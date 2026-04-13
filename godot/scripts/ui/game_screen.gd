extends Control
## Main game screen — connects board, HUD, hand display, and game log.

var _shake_intensity := 0.0
var _shake_decay := 5.0

@onready var _gm = get_node("/root/GameManager")
@onready var _sf = get_node("/root/SummonFactory")

var board: Control
var phase_label: Label
var turn_label: Label
var player_a_info: Label
var player_b_info: Label
var hand_container: GridContainer
var log_label: RichTextLabel
var end_turn_btn: Button
var status_label: Label
var turn_banner: ColorRect

var selected_card_index: int = -1
var selected_unit_id: String = ""

@onready var _cards = get_node("/root/CardDB")
@onready var _sfx = get_node("/root/SFX")
@onready var _bgm = get_node("/root/BGM")


var FloatingNumber = preload("res://scripts/ui/floating_number.gd")


func _ready() -> void:
	_build_ui()
	_start_test_game()

	_gm.log_added.connect(_on_log_added)
	_gm.phase_changed.connect(_on_phase_changed)
	_gm.game_over_signal.connect(_on_game_over)
	_gm.attack_resolved.connect(_on_attack_resolved)
	_gm.summon_defeated.connect(_on_summon_defeated)

	_bgm.play("battle")


func _build_ui() -> void:
	# Main layout: HBoxContainer with board on left, sidebar on right
	var main_hbox := HBoxContainer.new()
	main_hbox.set_anchors_preset(Control.PRESET_FULL_RECT)
	main_hbox.add_theme_constant_override("separation", 8)
	add_child(main_hbox)

	# Board
	var board_script = load("res://scripts/ui/board.gd")
	board = Control.new()
	board.set_script(board_script)
	board.cell_clicked.connect(_on_cell_clicked)
	main_hbox.add_child(board)

	# Right sidebar
	var sidebar := VBoxContainer.new()
	sidebar.custom_minimum_size.x = 280
	sidebar.add_theme_constant_override("separation", 6)
	main_hbox.add_child(sidebar)

	# Turn/phase info
	turn_label = Label.new()
	turn_label.text = "Turn 1"
	turn_label.add_theme_font_size_override("font_size", 18)
	sidebar.add_child(turn_label)

	phase_label = Label.new()
	phase_label.text = "DRAW PHASE"
	phase_label.add_theme_font_size_override("font_size", 14)
	phase_label.add_theme_color_override("font_color", Color.GOLD)
	sidebar.add_child(phase_label)

	# Player info
	player_a_info = Label.new()
	player_a_info.text = "Player A — VP: 0/3"
	player_a_info.add_theme_color_override("font_color", Color(0.4, 0.7, 1.0))
	sidebar.add_child(player_a_info)

	player_b_info = Label.new()
	player_b_info.text = "Player B — VP: 0/3"
	player_b_info.add_theme_color_override("font_color", Color(1.0, 0.4, 0.4))
	sidebar.add_child(player_b_info)

	# Status / card detail area
	var status_panel := PanelContainer.new()
	status_panel.custom_minimum_size = Vector2(0, 60)
	var sp_style := StyleBoxFlat.new()
	sp_style.bg_color = Color(0.08, 0.08, 0.14)
	sp_style.corner_radius_top_left = 4
	sp_style.corner_radius_top_right = 4
	sp_style.corner_radius_bottom_left = 4
	sp_style.corner_radius_bottom_right = 4
	sp_style.content_margin_left = 6
	sp_style.content_margin_right = 6
	sp_style.content_margin_top = 4
	sp_style.content_margin_bottom = 4
	status_panel.add_theme_stylebox_override("panel", sp_style)
	sidebar.add_child(status_panel)

	status_label = Label.new()
	status_label.text = "Select a card or unit."
	status_label.autowrap_mode = TextServer.AUTOWRAP_WORD
	status_label.add_theme_font_size_override("font_size", 11)
	status_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.9))
	status_panel.add_child(status_label)

	# End turn button
	end_turn_btn = Button.new()
	end_turn_btn.text = "End Turn"
	end_turn_btn.custom_minimum_size.y = 40
	end_turn_btn.pressed.connect(_on_end_turn)
	sidebar.add_child(end_turn_btn)

	# Hand display
	var hand_label := Label.new()
	hand_label.text = "Hand:"
	hand_label.add_theme_font_size_override("font_size", 12)
	sidebar.add_child(hand_label)

	var hand_scroll := ScrollContainer.new()
	hand_scroll.custom_minimum_size.y = 140
	hand_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	hand_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	sidebar.add_child(hand_scroll)

	hand_container = GridContainer.new()
	hand_container.columns = 3
	hand_container.add_theme_constant_override("h_separation", 4)
	hand_container.add_theme_constant_override("v_separation", 4)
	hand_scroll.add_child(hand_container)

	# Game log
	var log_title := Label.new()
	log_title.text = "Game Log:"
	log_title.add_theme_font_size_override("font_size", 12)
	sidebar.add_child(log_title)

	log_label = RichTextLabel.new()
	log_label.custom_minimum_size.y = 200
	log_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
	log_label.bbcode_enabled = true
	log_label.scroll_following = true
	sidebar.add_child(log_label)

	# Turn banner (overlays everything)
	var banner_script = load("res://scripts/ui/turn_banner.gd")
	turn_banner = ColorRect.new()
	turn_banner.set_script(banner_script)
	add_child(turn_banner)


func _start_test_game() -> void:
	var deck_a: Dictionary
	var deck_b: Dictionary
	if _gm.use_random_decks:
		deck_a = _cards.create_random_deck()
		deck_b = _cards.create_random_deck()
	elif not _gm._custom_deck_a.is_empty():
		# Use the custom deck from deck builder
		deck_a = _gm._custom_deck_a
		deck_b = _cards.create_player_b_deck()
		_gm._custom_deck_a = {}  # Clear after use
	else:
		deck_a = _cards.create_player_a_deck()
		deck_b = _cards.create_player_b_deck()

	_gm.initialize_game(deck_a, deck_b)

	# Coin flip for turn order
	var goes_first: String
	if _gm.spectator_mode:
		goes_first = "playerA"
	else:
		goes_first = "playerA" if randi() % 2 == 0 else "playerB"
	_gm.decide_turn_order(goes_first)

	if _gm.spectator_mode:
		turn_banner.show_banner("AI vs AI", Color(0.8, 0.6, 1.0))
		_gm.execute_draw_phase()
		_gm.execute_level_phase()
		_refresh_ui()
		await get_tree().create_timer(1.5).timeout
		_run_spectator_loop()
	elif goes_first == "playerB":
		# AI goes first
		turn_banner.show_banner("AI goes first!", Color(1.0, 0.4, 0.4))
		_gm.execute_draw_phase()
		_gm.execute_level_phase()
		_refresh_ui()
		await get_tree().create_timer(1.0).timeout
		_run_ai_turn()
		if not _gm.is_game_over:
			turn_banner.show_banner("YOUR TURN — Turn %d" % _gm.turn_number, Color(0.4, 0.8, 1.0))
		_refresh_ui()
	else:
		turn_banner.show_banner("YOU go first!", Color(0.4, 0.8, 1.0))
		_gm.execute_draw_phase()
		_gm.execute_level_phase()
		_refresh_ui()


func _refresh_ui() -> void:
	turn_label.text = "Turn %d — %s" % [_gm.turn_number, _gm.active_player]
	phase_label.text = _gm.phase.to_upper() + " PHASE"

	var pa: Dictionary = _gm.players["playerA"]
	var pb: Dictionary = _gm.players["playerB"]
	player_a_info.text = "Player A — VP: %d/3 | Summons: %d | Hand: %d" % [
		pa["victory_points"], _count_summons("playerA"), pa["hand"].size()
	]
	player_b_info.text = "Player B — VP: %d/3 | Summons: %d | Hand: %d" % [
		pb["victory_points"], _count_summons("playerB"), pb["hand"].size()
	]

	end_turn_btn.visible = not _gm.spectator_mode and _gm.phase == "action" and _gm.active_player == "playerA"

	_refresh_hand()
	board.queue_redraw()


func _refresh_hand() -> void:
	# Clear existing cards
	for child in hand_container.get_children():
		child.queue_free()

	var hand: Array = _gm.players[_gm.active_player]["hand"]
	for i in range(hand.size()):
		var card: Dictionary = hand[i]
		var ct: String = card.get("card_type", "")
		var btn := Button.new()

		# Card display text
		var label_text: String = card.get("name", "?")
		if ct == "summon":
			label_text += "\n[SUMMON]"
		elif ct == "action":
			var speed: String = card.get("speed", "action").to_upper()
			label_text += "\n[%s]" % speed
		elif ct == "quest":
			label_text += "\n[QUEST]"
		elif ct == "building":
			label_text += "\n[BUILDING]"
		elif ct == "counter":
			label_text += "\n[COUNTER]"
		elif ct == "reaction":
			label_text += "\n[REACTION]"
		elif ct == "advance":
			label_text += "\n[ADVANCE]"
		else:
			label_text += "\n[%s]" % ct.to_upper()

		btn.text = label_text
		btn.custom_minimum_size = Vector2(85, 55)
		btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		btn.add_theme_font_size_override("font_size", 10)
		btn.clip_text = false
		btn.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		btn.tooltip_text = card.get("description", card.get("name", ""))

		# Color by type
		var style := StyleBoxFlat.new()
		style.corner_radius_top_left = 4
		style.corner_radius_top_right = 4
		style.corner_radius_bottom_left = 4
		style.corner_radius_bottom_right = 4
		style.content_margin_left = 4
		style.content_margin_right = 4

		if ct == "summon":
			style.bg_color = Color(0.15, 0.2, 0.35)
			style.border_color = Color(0.3, 0.4, 0.7)
		elif ct == "action":
			style.bg_color = Color(0.25, 0.15, 0.1)
			style.border_color = Color(0.6, 0.4, 0.2)
		elif ct == "quest":
			style.bg_color = Color(0.15, 0.25, 0.15)
			style.border_color = Color(0.3, 0.6, 0.3)
		elif ct == "building":
			style.bg_color = Color(0.2, 0.2, 0.12)
			style.border_color = Color(0.5, 0.5, 0.25)
		elif ct == "counter":
			style.bg_color = Color(0.3, 0.1, 0.1)
			style.border_color = Color(0.7, 0.2, 0.2)
		elif ct == "reaction":
			style.bg_color = Color(0.25, 0.1, 0.2)
			style.border_color = Color(0.6, 0.25, 0.5)
		elif ct == "advance":
			style.bg_color = Color(0.2, 0.15, 0.3)
			style.border_color = Color(0.5, 0.35, 0.7)
		else:
			style.bg_color = Color(0.2, 0.15, 0.25)
			style.border_color = Color(0.5, 0.3, 0.6)

		style.border_width_bottom = 2
		style.border_width_top = 2
		style.border_width_left = 2
		style.border_width_right = 2

		if i == selected_card_index:
			style.border_color = Color.GOLD
			style.bg_color = style.bg_color.lightened(0.15)

		btn.add_theme_stylebox_override("normal", style)

		var hover_style: StyleBoxFlat = style.duplicate()
		hover_style.bg_color = style.bg_color.lightened(0.1)
		btn.add_theme_stylebox_override("hover", hover_style)

		var idx := i
		btn.pressed.connect(func(): _on_card_selected(idx))
		hand_container.add_child(btn)

	# Add playable advance cards
	var playable = _gm.get_playable_advance_cards()
	for entry in playable:
		var card: Dictionary = entry["card"]
		var adv_btn := Button.new()
		adv_btn.text = "%s\n[ADVANCE]" % card.get("name", "?")
		adv_btn.custom_minimum_size = Vector2(110, 55)
		adv_btn.tooltip_text = card.get("description", "")

		var adv_style := StyleBoxFlat.new()
		adv_style.bg_color = Color(0.3, 0.15, 0.35)
		adv_style.border_color = Color(0.7, 0.3, 0.8)
		adv_style.border_width_bottom = 2
		adv_style.border_width_top = 2
		adv_style.border_width_left = 2
		adv_style.border_width_right = 2
		adv_style.corner_radius_top_left = 4
		adv_style.corner_radius_top_right = 4
		adv_style.corner_radius_bottom_left = 4
		adv_style.corner_radius_bottom_right = 4
		adv_btn.add_theme_stylebox_override("normal", adv_style)

		var adv_index: int = entry["index"]
		var targets: Array = entry["valid_targets"]
		adv_btn.pressed.connect(func():
			if targets.size() > 0:
				_gm.play_advance_card(adv_index, targets[0]["instance_id"])
				_sfx.level_up()
				_refresh_ui()
		)
		hand_container.add_child(adv_btn)


func _on_cell_clicked(pos: Vector2i) -> void:
	if _gm.is_game_over or _gm.phase != "action":
		return

	# If a card is selected, try to play it
	if selected_card_index >= 0:
		var hand: Array = _gm.players[_gm.active_player]["hand"]
		if selected_card_index < hand.size():
			var card: Dictionary = hand[selected_card_index]
			var ct: String = card.get("card_type", "")

			if ct == "summon":
				_gm.play_summon(selected_card_index, pos)
				_sfx.summon_place()
				board.flash_cell(pos, Color(0.3, 0.6, 1.0))  # Blue flash on summon
				selected_card_index = -1
				board.clear_highlights()
				_refresh_ui()
				return

			# Action/quest cards — find target summon at clicked position
			if ct == "action" or ct == "quest":
				var target_type: String = card.get("target_type", "")
				for s in _gm.board_summons:
					if s["position"] != pos:
						continue
					# Validate target type
					var is_ally: bool = s["owner"] == _gm.active_player
					var valid_target := false
					if target_type == "ally_summon" and is_ally:
						valid_target = true
					elif target_type == "enemy_summon" and not is_ally:
						valid_target = true
					elif target_type == "any_summon":
						valid_target = true
					elif ct == "quest" and is_ally:
						valid_target = true

					if valid_target:
						_gm.play_card(selected_card_index, [s["instance_id"]])
						_sfx.card_play()
						selected_card_index = -1
						board.clear_highlights()
						_refresh_ui()
						return
				# Clicked empty space with action card — deselect
				selected_card_index = -1
				board.clear_highlights()
				status_label.text = "No valid target there. Select again."
				_refresh_hand()
				return

	# If a unit is selected, try to move or attack
	if selected_unit_id != "":
		# Check if clicking an enemy (attack)
		for s in _gm.board_summons:
			if s["position"] == pos and s["owner"] != _gm.active_player:
				_gm.attack_with_summon(selected_unit_id, s["instance_id"])
				selected_unit_id = ""
				board.clear_highlights()
				_refresh_ui()
				return

		# Try to move
		if pos in board.valid_moves:
			_gm.move_summon(selected_unit_id, pos)
			board.flash_cell(pos, Color(0.5, 0.8, 1.0))  # Light blue flash on move
			# Keep unit selected for attack after move
			board.clear_highlights()
			var attacks = _gm.get_valid_attacks(selected_unit_id)
			board.show_attacks(attacks)
			board.selected_cell = pos
			_refresh_ui()
			return

	# Check if clicking own unit to select it
	for s in _gm.board_summons:
		if s["position"] == pos and s["owner"] == _gm.active_player:
			selected_unit_id = s["instance_id"]
			selected_card_index = -1
			board.clear_highlights()
			board.selected_cell = pos
			board.show_moves(_gm.get_valid_moves(selected_unit_id))
			board.show_attacks(_gm.get_valid_attacks(selected_unit_id))
			status_label.text = _format_unit_detail(s)
			_refresh_hand()
			return

	# Deselect
	selected_card_index = -1
	selected_unit_id = ""
	board.clear_highlights()
	status_label.text = "Select a card or unit."
	_refresh_hand()


func _on_card_selected(index: int) -> void:
	_sfx.click()
	selected_card_index = index
	selected_unit_id = ""
	board.clear_highlights()

	var hand: Array = _gm.players[_gm.active_player]["hand"]
	if index < hand.size():
		var card: Dictionary = hand[index]
		var ct: String = card.get("card_type", "")
		status_label.text = _format_card_detail(card)

		if ct == "summon":
			board.show_placements(_gm.get_valid_placements())
		elif ct == "action" or ct == "quest":
			# Highlight valid targets
			var target_type: String = card.get("target_type", "")
			var target_ids: Array[String] = []
			for s in _gm.board_summons:
				var is_ally: bool = s["owner"] == _gm.active_player
				if target_type == "ally_summon" and is_ally:
					target_ids.append(s["instance_id"])
				elif target_type == "enemy_summon" and not is_ally:
					target_ids.append(s["instance_id"])
				elif target_type == "any_summon":
					target_ids.append(s["instance_id"])
				elif ct == "quest" and is_ally:
					target_ids.append(s["instance_id"])
			board.show_attacks(target_ids)  # Reuse attack highlight for targets

	_refresh_hand()


func _on_end_turn() -> void:
	selected_card_index = -1
	selected_unit_id = ""
	board.clear_highlights()
	end_turn_btn.visible = false  # Hide during AI turn

	_gm.end_action_phase()

	if _gm.is_game_over:
		return

	# Show AI turn banner, wait, execute AI, then show player banner
	turn_banner.show_banner("AI TURN", Color(1.0, 0.4, 0.4))
	await get_tree().create_timer(1.0).timeout

	_run_ai_turn()
	board.queue_redraw()
	_refresh_ui()

	if _gm.is_game_over:
		return

	await get_tree().create_timer(0.5).timeout
	turn_banner.show_banner("YOUR TURN — Turn %d" % _gm.turn_number, Color(0.4, 0.8, 1.0))
	_refresh_ui()


func _run_ai_turn() -> void:
	# Execute AI's draw + level
	_gm.execute_draw_phase()
	_gm.execute_level_phase()

	var ai_player: String = _gm.active_player

	# 1. Play a summon if possible
	var ai_hand: Array = _gm.players[ai_player]["hand"]
	for i in range(ai_hand.size() - 1, -1, -1):
		if ai_hand[i].get("card_type", "") == "summon":
			var placements = _gm.get_valid_placements()
			if placements.size() > 0:
				# Prefer front-center positions
				placements.sort_custom(func(a, b):
					var a_front: int = a.y if ai_player == "playerA" else (13 - a.y)
					var b_front: int = b.y if ai_player == "playerA" else (13 - b.y)
					if a_front != b_front: return a_front > b_front
					return absi(a.x - 6) < absi(b.x - 6)
				)
				_gm.play_summon(i, placements[0])
			break

	if _gm.is_game_over: return

	# 1b. Play advance cards if eligible
	var playable_advances = _gm.get_playable_advance_cards()
	for entry in playable_advances:
		if entry["valid_targets"].size() > 0:
			_gm.play_advance_card(entry["index"], entry["valid_targets"][0]["instance_id"])
			_sfx.level_up()
			break
	if _gm.is_game_over: return

	# 2. Play action cards (5-priority system ported from web AI)
	_ai_play_action_cards(ai_player)

	if _gm.is_game_over: return

	# 3. Move and attack with each summon
	var my_summon_ids: Array[String] = []
	for s in _gm.board_summons:
		if s["owner"] == ai_player:
			my_summon_ids.append(s["instance_id"])

	for unit_id in my_summon_ids:
		if _gm.is_game_over: return

		var unit = _find_unit(unit_id)
		if unit.is_empty(): continue

		var enemies: Array = []
		for e in _gm.board_summons:
			if e["owner"] != ai_player:
				enemies.append(e)
		if enemies.size() == 0: continue

		# Find nearest enemy
		var nearest = enemies[0]
		for e in enemies:
			if _dist(unit["position"], e["position"]) < _dist(unit["position"], nearest["position"]):
				nearest = e

		# Attack if in range
		var attacks = _gm.get_valid_attacks(unit_id)
		if nearest["instance_id"] in attacks:
			_gm.attack_with_summon(unit_id, nearest["instance_id"])
		else:
			# Move toward nearest enemy
			var moves = _gm.get_valid_moves(unit_id)
			if moves.size() > 0:
				var best_move: Vector2i = moves[0]
				for m in moves:
					if _dist(m, nearest["position"]) < _dist(best_move, nearest["position"]):
						best_move = m
				_gm.move_summon(unit_id, best_move)

				# Attack after move
				attacks = _gm.get_valid_attacks(unit_id)
				if nearest["instance_id"] in attacks:
					_gm.attack_with_summon(unit_id, nearest["instance_id"])

	if _gm.is_game_over: return

	# End AI turn
	_gm.end_action_phase()

	if not _gm.is_game_over:
		# Auto-advance draw + level for player
		_gm.execute_draw_phase()
		_gm.execute_level_phase()


## AI card play — 5 priority system (ported from src/engine/ai.ts)
func _ai_play_action_cards(ai_player: String) -> void:
	var hand: Array = _gm.players[ai_player]["hand"]
	var my_summons: Array = []
	var enemies: Array = []
	for s in _gm.board_summons:
		if s["owner"] == ai_player:
			my_summons.append(s)
		else:
			enemies.append(s)

	# P1: Emergency heal (< 30% HP)
	var critical: Array = my_summons.filter(func(s): return float(s["current_hp"]) / float(s["max_hp"]) < 0.3)
	if critical.size() > 0:
		for i in range(hand.size() - 1, -1, -1):
			if _gm.is_game_over: return
			var card: Dictionary = hand[i]
			if card.get("card_type", "") != "action": continue
			if card.get("target_type", "") == "ally_summon":
				for eff in card.get("effects", []):
					if eff.get("type", "") == "heal":
						critical.sort_custom(func(a, b): return a["current_hp"] < b["current_hp"])
						_gm.play_card(i, [critical[0]["instance_id"]])
						return

	# P2: Buff cards on strongest summon
	if my_summons.size() > 0:
		for i in range(hand.size() - 1, -1, -1):
			if _gm.is_game_over: return
			var card: Dictionary = hand[i]
			if card.get("card_type", "") != "action": continue
			if card.get("target_type", "") == "ally_summon":
				for eff in card.get("effects", []):
					if eff.get("type", "") == "buff":
						var strongest = my_summons[0]
						for s in my_summons:
							if s["calculated_stats"].get("STR", 0) > strongest["calculated_stats"].get("STR", 0):
								strongest = s
						_gm.play_card(i, [strongest["instance_id"]])
						return

	# P3: Damage cards on lowest HP enemy
	if enemies.size() > 0:
		for i in range(hand.size() - 1, -1, -1):
			if _gm.is_game_over: return
			var card: Dictionary = hand[i]
			if card.get("card_type", "") != "action": continue
			if card.get("target_type", "") == "enemy_summon":
				for eff in card.get("effects", []):
					if eff.get("type", "") == "damage":
						enemies.sort_custom(func(a, b): return a["current_hp"] < b["current_hp"])
						_gm.play_card(i, [enemies[0]["instance_id"]])
						return

	# P4: Heal damaged allies
	var damaged: Array = my_summons.filter(func(s): return s["current_hp"] < s["max_hp"])
	if damaged.size() > 0:
		for i in range(hand.size() - 1, -1, -1):
			if _gm.is_game_over: return
			var card: Dictionary = hand[i]
			if card.get("card_type", "") != "action": continue
			if card.get("target_type", "") == "ally_summon":
				for eff in card.get("effects", []):
					if eff.get("type", "") == "heal":
						damaged.sort_custom(func(a, b): return float(a["current_hp"])/float(a["max_hp"]) < float(b["current_hp"])/float(b["max_hp"]))
						_gm.play_card(i, [damaged[0]["instance_id"]])
						return

	# P5: Quest cards
	if my_summons.size() > 0:
		for i in range(hand.size() - 1, -1, -1):
			if _gm.is_game_over: return
			var card: Dictionary = hand[i]
			if card.get("card_type", "") == "quest":
				_gm.play_card(i, [my_summons[0]["instance_id"]])
				return


## Spectator mode — both players are AI, auto-play with delays.
func _run_spectator_loop() -> void:
	while not _gm.is_game_over:
		if not is_inside_tree():
			return  # Scene was freed (user clicked Main Menu)

		var player_label := "Player A" if _gm.active_player == "playerA" else "Player B"
		var color := Color(0.4, 0.8, 1.0) if _gm.active_player == "playerA" else Color(1.0, 0.4, 0.4)
		turn_banner.show_banner("%s — Turn %d" % [player_label, _gm.turn_number], color)
		await get_tree().create_timer(0.8).timeout

		if not is_inside_tree():
			return

		_run_ai_turn_for_spectator()
		board.queue_redraw()
		_refresh_ui()

		if _gm.is_game_over:
			break

		await get_tree().create_timer(0.5).timeout
		if not is_inside_tree():
			return

		await get_tree().create_timer(0.5).timeout


func _run_ai_turn_for_spectator() -> void:
	## Execute one full AI turn (draw → level → action → end) for spectator mode.
	_gm.execute_draw_phase()
	_gm.execute_level_phase()

	var ai_player: String = _gm.active_player

	# Play summon
	var ai_hand: Array = _gm.players[ai_player]["hand"]
	for i in range(ai_hand.size() - 1, -1, -1):
		if ai_hand[i].get("card_type", "") == "summon":
			var placements = _gm.get_valid_placements()
			if placements.size() > 0:
				placements.sort_custom(func(a, b):
					var a_front: int = a.y if ai_player == "playerA" else (13 - a.y)
					var b_front: int = b.y if ai_player == "playerA" else (13 - b.y)
					if a_front != b_front: return a_front > b_front
					return absi(a.x - 6) < absi(b.x - 6)
				)
				_gm.play_summon(i, placements[0])
			break

	if _gm.is_game_over: return

	# Advance cards
	var playable_advances = _gm.get_playable_advance_cards()
	for entry in playable_advances:
		if entry["valid_targets"].size() > 0:
			_gm.play_advance_card(entry["index"], entry["valid_targets"][0]["instance_id"])
			break

	if _gm.is_game_over: return

	# Action cards
	_ai_play_action_cards(ai_player)

	if _gm.is_game_over: return

	# Move + attack
	var ids: Array[String] = []
	for s in _gm.board_summons:
		if s["owner"] == ai_player:
			ids.append(s["instance_id"])

	for unit_id in ids:
		if _gm.is_game_over: return
		var unit = _find_unit(unit_id)
		if unit.is_empty(): continue

		var enemies: Array = []
		for e in _gm.board_summons:
			if e["owner"] != ai_player:
				enemies.append(e)
		if enemies.size() == 0: continue

		var nearest = enemies[0]
		for e in enemies:
			if _dist(unit["position"], e["position"]) < _dist(unit["position"], nearest["position"]):
				nearest = e

		var attacks = _gm.get_valid_attacks(unit_id)
		if nearest["instance_id"] in attacks:
			_gm.attack_with_summon(unit_id, nearest["instance_id"])
		else:
			var moves = _gm.get_valid_moves(unit_id)
			if moves.size() > 0:
				var best: Vector2i = moves[0]
				for m in moves:
					if _dist(m, nearest["position"]) < _dist(best, nearest["position"]):
						best = m
				_gm.move_summon(unit_id, best)
				attacks = _gm.get_valid_attacks(unit_id)
				if nearest["instance_id"] in attacks:
					_gm.attack_with_summon(unit_id, nearest["instance_id"])

	if _gm.is_game_over: return
	_gm.end_action_phase()


func _dist(a: Vector2i, b: Vector2i) -> int:
	return maxi(absi(a.x - b.x), absi(a.y - b.y))


func _count_summons(player_id: String) -> int:
	var count := 0
	for s in _gm.board_summons:
		if s["owner"] == player_id:
			count += 1
	return count


func _on_log_added(entry: Dictionary) -> void:
	if log_label:
		var color := "cyan" if entry["player"] == "playerA" else "red"
		log_label.append_text("[color=%s]T%d[/color] %s\n" % [color, entry["turn"], entry["message"]])

	# Trigger sounds and floating numbers from log messages
	var msg: String = entry.get("message", "")
	if msg.contains("heals"):
		_sfx.heal()
		# Show floating heal number — parse "heals X HP"
		var heal_match := msg.split("heals ")
		if heal_match.size() > 1:
			var heal_str: String = heal_match[1].split(" ")[0]
			if heal_str.is_valid_int():
				# Find the unit that was healed (name before "heals")
				var unit_name: String = msg.split(" heals")[0]
				for s in _gm.board_summons:
					if s["card"].get("name", "") in unit_name:
						var pos := _unit_screen_pos(s)
						FloatingNumber.spawn(self, "+%s" % heal_str, pos, Color(0.3, 1.0, 0.3))
						break
	elif msg.contains("gains") and msg.contains("VP"):
		_sfx.vp_gain()
	elif msg.contains("levels up"):
		_sfx.level_up()


func _on_phase_changed(_new_phase: String) -> void:
	_refresh_ui()


func _on_game_over(winner_id: String) -> void:
	if winner_id == "playerA":
		_sfx.victory()
		_bgm.play("victory")
	else:
		_sfx.game_defeat()
		_bgm.play("defeat")
	status_label.text = "%s WINS!" % winner_id.to_upper()
	end_turn_btn.visible = false

	# Record match and award coins
	var mode := "spectator" if _gm.spectator_mode else ("random" if _gm.use_random_decks else "standard")
	get_node("/root/Settings").record_match(winner_id, _gm.turn_number, mode)

	var storage = get_node_or_null("/root/CardStorage")
	if storage and not _gm.spectator_mode:
		var won: bool = winner_id == "playerA"
		var reward: int = storage.award_match_coins(won)
		status_label.text = "%s WINS! +%d 🪙" % [winner_id.to_upper(), reward]

	_refresh_ui()
	_show_game_over_overlay(winner_id)


func _show_game_over_overlay(winner_id: String) -> void:
	# Dim background
	var overlay := ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.75)
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(overlay)

	# Styled panel background
	var panel_bg := PanelContainer.new()
	panel_bg.set_anchors_preset(Control.PRESET_CENTER)
	panel_bg.grow_horizontal = Control.GROW_DIRECTION_BOTH
	panel_bg.grow_vertical = Control.GROW_DIRECTION_BOTH
	panel_bg.custom_minimum_size = Vector2(400, 360)
	panel_bg.position = Vector2(440, 130)
	var panel_style := StyleBoxFlat.new()
	panel_style.bg_color = Color(0.08, 0.08, 0.14)
	panel_style.border_color = Color(0.3, 0.25, 0.5)
	panel_style.border_width_top = 2
	panel_style.border_width_bottom = 2
	panel_style.border_width_left = 2
	panel_style.border_width_right = 2
	panel_style.corner_radius_top_left = 12
	panel_style.corner_radius_top_right = 12
	panel_style.corner_radius_bottom_left = 12
	panel_style.corner_radius_bottom_right = 12
	panel_style.content_margin_top = 24
	panel_style.content_margin_bottom = 20
	panel_style.content_margin_left = 30
	panel_style.content_margin_right = 30
	panel_bg.add_theme_stylebox_override("panel", panel_style)
	overlay.add_child(panel_bg)

	var panel := VBoxContainer.new()
	panel.add_theme_constant_override("separation", 8)
	panel_bg.add_child(panel)

	var is_player_win: bool = winner_id == "playerA"
	var is_spectator: bool = _gm.spectator_mode

	# Banner
	var banner := Label.new()
	if is_spectator:
		banner.text = "GAME OVER"
		banner.add_theme_color_override("font_color", Color(0.8, 0.7, 1.0))
	else:
		banner.text = "VICTORY" if is_player_win else "DEFEAT"
		banner.add_theme_color_override("font_color", Color.GOLD if is_player_win else Color(1.0, 0.3, 0.3))
	banner.add_theme_font_size_override("font_size", 40)
	banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	panel.add_child(banner)

	var winner_label := Label.new()
	winner_label.text = "%s Wins!" % ("Player A" if winner_id == "playerA" else "Player B")
	winner_label.add_theme_font_size_override("font_size", 16)
	winner_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8))
	winner_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	panel.add_child(winner_label)

	# Divider
	var divider := ColorRect.new()
	divider.color = Color(0.3, 0.25, 0.5, 0.5)
	divider.custom_minimum_size = Vector2(0, 1)
	panel.add_child(divider)

	# Stats
	var pa: Dictionary = _gm.players["playerA"]
	var pb: Dictionary = _gm.players["playerB"]
	var defeats := 0
	var cards_played := 0
	var max_damage := 0
	for entry in _gm.game_log:
		var msg: String = entry.get("message", "")
		if "defeated" in msg: defeats += 1
		if msg.begins_with("Played "): cards_played += 1
		if msg.begins_with("Deals "):
			var dmg_str: String = msg.replace("Deals ", "").replace(" damage!", "")
			if dmg_str.is_valid_int():
				max_damage = maxi(max_damage, dmg_str.to_int())

	var stats_lines: Array[String] = [
		"  Turns Played     %d" % _gm.turn_number,
		"  Player A VP      %d / %d" % [pa["victory_points"], _gm.VP_TO_WIN],
		"  Player B VP      %d / %d" % [pb["victory_points"], _gm.VP_TO_WIN],
		"  Summons Defeated %d" % defeats,
		"  Cards Played     %d" % cards_played,
	]
	if max_damage > 0:
		stats_lines.append("  Highest Damage   %d" % max_damage)

	var stats_label := Label.new()
	stats_label.text = "\n".join(stats_lines)
	stats_label.add_theme_font_size_override("font_size", 12)
	stats_label.add_theme_color_override("font_color", Color(0.7, 0.75, 0.85))
	panel.add_child(stats_label)

	# Spacer
	var spacer := Control.new()
	spacer.custom_minimum_size.y = 8
	panel.add_child(spacer)

	# Buttons
	var btn_container := HBoxContainer.new()
	btn_container.add_theme_constant_override("separation", 16)
	btn_container.alignment = BoxContainer.ALIGNMENT_CENTER
	panel.add_child(btn_container)

	_add_overlay_button(btn_container, "New Game", Color(0.2, 0.5, 0.3), func(): get_tree().reload_current_scene())
	_add_overlay_button(btn_container, "Main Menu", Color(0.3, 0.3, 0.45), func(): get_tree().change_scene_to_file("res://scenes/menu.tscn"))


func _add_overlay_button(parent: HBoxContainer, text: String, color: Color, callback: Callable) -> void:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(130, 42)
	btn.add_theme_font_size_override("font_size", 14)
	btn.pressed.connect(callback)
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.corner_radius_top_left = 6
	style.corner_radius_top_right = 6
	style.corner_radius_bottom_left = 6
	style.corner_radius_bottom_right = 6
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	btn.add_theme_stylebox_override("normal", style)
	var hover := style.duplicate()
	hover.bg_color = color.lightened(0.15)
	btn.add_theme_stylebox_override("hover", hover)
	parent.add_child(btn)


func _format_card_detail(card: Dictionary) -> String:
	var lines: Array[String] = []
	var name_str: String = card.get("name", "?")
	var ct: String = card.get("card_type", "")
	var element: String = card.get("element", "neutral")

	# Header: name + type + element
	var type_label: String = ct.to_upper()
	if ct == "action":
		type_label = card.get("speed", "action").to_upper()
	lines.append("%s  [%s · %s]" % [name_str, type_label, element.capitalize()])

	# Description
	var desc: String = card.get("description", "")
	if desc != "":
		lines.append(desc)

	# Requirements
	var reqs: Array = card.get("requirements", [])
	if reqs.size() > 0:
		var req_parts: Array[String] = []
		for req in reqs:
			var req_type: String = req.get("type", "")
			if req_type == "role":
				var family: String = req.get("role_family", "")
				if family != "":
					req_parts.append("Requires: %s summon" % family.capitalize())
			elif req_type == "level":
				req_parts.append("Min level: %d" % req.get("min_level", 0))
		if req_parts.size() > 0:
			lines.append(" · ".join(req_parts))

	# Effects summary for action cards
	if ct == "action":
		for effect in card.get("effects", []):
			var etype: String = effect.get("type", "")
			var bp: int = effect.get("base_power", 0)
			if etype == "damage" and bp > 0:
				var dtype: String = effect.get("damage_type", "magical")
				lines.append("DMG: %d BP (%s)" % [bp, dtype])
			elif etype == "heal" and bp > 0:
				lines.append("HEAL: %d BP" % bp)
			elif etype == "buff":
				var edesc: String = effect.get("description", "")
				if edesc != "":
					lines.append("BUFF: %s" % edesc)

	# Target type
	var target: String = card.get("target_type", "")
	if target != "":
		lines.append("Target: %s" % target.replace("_", " "))

	return "\n".join(lines)


func _format_unit_detail(unit: Dictionary) -> String:
	var card: Dictionary = unit.get("card", {})
	var stats: Dictionary = unit.get("calculated_stats", {})
	var lines: Array[String] = []

	lines.append("%s  Lv%d %s" % [card.get("name", "?"), unit["level"], unit["current_role"]])
	lines.append("HP: %d/%d  MV: %d" % [unit["current_hp"], unit["max_hp"], unit["movement_remaining"]])
	lines.append("STR %d  DEF %d  INT %d  MDF %d" % [
		stats.get("STR", 0), stats.get("DEF", 0), stats.get("INT", 0), stats.get("MDF", 0)])
	lines.append("SPD %d  ACC %d  LCK %d  SPI %d" % [
		stats.get("SPD", 0), stats.get("ACC", 0), stats.get("LCK", 0), stats.get("SPI", 0)])

	var weapon: Dictionary = card.get("equipment", {}).get("weapon", {})
	if not weapon.is_empty():
		lines.append("Weapon: %s (BP:%d, Range:%d)" % [
			weapon.get("name", "?"), weapon.get("base_power", 0), weapon.get("range", 1)])

	return "\n".join(lines)


func _find_unit(instance_id: String) -> Dictionary:
	for s in _gm.board_summons:
		if s["instance_id"] == instance_id:
			return s
	return {}


# ─── Screen Shake ───

func _process(delta: float) -> void:
	if _shake_intensity > 0:
		_shake_intensity = maxf(0.0, _shake_intensity - _shake_decay * delta)
		var offset := Vector2(
			randf_range(-_shake_intensity, _shake_intensity),
			randf_range(-_shake_intensity, _shake_intensity)
		)
		board.position = board.position.lerp(board.global_position + offset, 0.5) if false else Vector2(28, 0) + offset
	elif board.position != Vector2(28, 0):
		board.position = Vector2(28, 0)


func _screen_shake(intensity: float = 8.0) -> void:
	var settings = get_node_or_null("/root/Settings")
	if settings != null and not settings.screen_shake_enabled:
		return
	_shake_intensity = intensity


# ─── Keyboard Shortcuts ───

func _unhandled_input(event: InputEvent) -> void:
	if _gm.is_game_over or _gm.phase != "action":
		return
	if _gm.active_player != "playerA":
		return

	if event is InputEventKey and event.pressed:
		var key: Key = event.keycode

		# E = End Turn
		if key == KEY_E:
			_on_end_turn()
			get_viewport().set_input_as_handled()

		# Escape = Deselect
		elif key == KEY_ESCAPE:
			selected_card_index = -1
			selected_unit_id = ""
			board.clear_highlights()
			status_label.text = "Select a card or unit."
			_refresh_hand()
			get_viewport().set_input_as_handled()

		# 1-9 = Select hand card
		elif key >= KEY_1 and key <= KEY_9:
			var idx: int = key - KEY_1
			var hand: Array = _gm.players["playerA"]["hand"]
			if idx < hand.size():
				_on_card_selected(idx)
				get_viewport().set_input_as_handled()


# ─── Floating Numbers ───

func _on_attack_resolved(result: Dictionary) -> void:
	if not result.get("hit", false):
		_sfx.attack_miss()
		var target_id: String = result.get("target", "")
		var target_unit = _find_unit(target_id)
		if not target_unit.is_empty():
			var screen_pos := _unit_screen_pos(target_unit)
			FloatingNumber.spawn(self, "MISS", screen_pos, Color(0.6, 0.6, 0.6))
		return

	var damage: int = result.get("damage", 0)
	var is_crit: bool = result.get("crit", false)
	var target_id: String = result.get("target", "")
	var target_unit = _find_unit(target_id)

	if is_crit:
		_sfx.critical_hit()
		_screen_shake(12.0)
	else:
		_sfx.attack_hit()
		_screen_shake(4.0)

	# Flash target cell red
	if not target_unit.is_empty():
		var tpos: Vector2i = target_unit.get("position", Vector2i(-1, -1))
		if tpos.x >= 0:
			board.flash_cell(tpos, Color(1.0, 0.2, 0.2) if not is_crit else Color(1.0, 0.85, 0.0))

	if damage > 0:
		var screen_pos: Vector2
		if not target_unit.is_empty():
			screen_pos = _unit_screen_pos(target_unit)
		else:
			screen_pos = Vector2(640, 360)

		var color := Color(1.0, 0.2, 0.2) if not is_crit else Color(1.0, 0.85, 0.0)
		FloatingNumber.spawn(self, str(damage), screen_pos, color, is_crit)

	board.queue_redraw()


func _on_summon_defeated(unit: Dictionary) -> void:
	_sfx.defeat()
	var screen_pos := _unit_screen_pos(unit)
	FloatingNumber.spawn(self, "DEFEATED", screen_pos + Vector2(0, -15), Color(1.0, 0.3, 0.3), true)


func _unit_screen_pos(unit: Dictionary) -> Vector2:
	# Convert grid position to approximate screen position on the board
	var pos: Vector2i = unit.get("position", Vector2i(6, 7))
	var offset := Vector2(28, 12)  # Must match board.gd offset
	var cell_size := 48  # Must match board.gd CELL_SIZE
	return board.global_position + offset + Vector2(
		pos.x * cell_size + cell_size * 0.5,
		(13 - pos.y) * cell_size + cell_size * 0.5
	)
