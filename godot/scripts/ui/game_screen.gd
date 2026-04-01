extends Control
## Main game screen — connects board, HUD, hand display, and game log.

@onready var _gm = get_node("/root/GameManager")
@onready var _sf = get_node("/root/SummonFactory")

var board: Control  # Board node (scripts/ui/board.gd)
var phase_label: Label
var turn_label: Label
var player_a_info: Label
var player_b_info: Label
var hand_container: HBoxContainer
var log_label: RichTextLabel
var end_turn_btn: Button
var status_label: Label

var selected_card_index: int = -1
var selected_unit_id: String = ""

@onready var _cards = get_node("/root/CardDB")


func _ready() -> void:
	_build_ui()
	_start_test_game()

	_gm.log_added.connect(_on_log_added)
	_gm.phase_changed.connect(_on_phase_changed)
	_gm.game_over_signal.connect(_on_game_over)


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

	# Status
	status_label = Label.new()
	status_label.text = "Select a card or unit."
	status_label.autowrap_mode = TextServer.AUTOWRAP_WORD
	sidebar.add_child(status_label)

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
	hand_scroll.custom_minimum_size.y = 120
	hand_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sidebar.add_child(hand_scroll)

	hand_container = HBoxContainer.new()
	hand_container.add_theme_constant_override("separation", 4)
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


func _start_test_game() -> void:
	var deck_a: Dictionary = _cards.create_player_a_deck()
	var deck_b: Dictionary = _cards.create_player_b_deck()

	_gm.initialize_game(deck_a, deck_b)
	_gm.decide_turn_order("playerA")

	# Auto-advance draw + level for first turn
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

	end_turn_btn.visible = _gm.phase == "action" and _gm.active_player == "playerA"

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
			var target: String = card.get("target_type", "").replace("_", " ")
			label_text += "\n[%s]" % target.to_upper()
		elif ct == "quest":
			label_text += "\n[QUEST]"
		else:
			label_text += "\n[%s]" % ct.to_upper()

		btn.text = label_text
		btn.custom_minimum_size = Vector2(110, 55)
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
			status_label.text = "%s selected (Lv%d %s)" % [
				s["card"].get("name", "?"), s["level"], s["current_role"]
			]
			_refresh_hand()
			return

	# Deselect
	selected_card_index = -1
	selected_unit_id = ""
	board.clear_highlights()
	status_label.text = "Select a card or unit."
	_refresh_hand()


func _on_card_selected(index: int) -> void:
	selected_card_index = index
	selected_unit_id = ""
	board.clear_highlights()

	var hand: Array = _gm.players[_gm.active_player]["hand"]
	if index < hand.size():
		var card: Dictionary = hand[index]
		var ct: String = card.get("card_type", "")
		var desc: String = card.get("description", card.get("name", "?"))
		status_label.text = "Selected: %s — %s" % [card.get("name", "?"), desc]

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

	_gm.end_action_phase()

	if _gm.is_game_over:
		return

	# AI turn (simple: auto-advance phases, then we play for AI)
	_run_ai_turn()
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


func _on_phase_changed(_new_phase: String) -> void:
	_refresh_ui()


func _on_game_over(winner_id: String) -> void:
	status_label.text = "%s WINS!" % winner_id.to_upper()
	end_turn_btn.visible = false
	_refresh_ui()
	_show_game_over_overlay(winner_id)


func _show_game_over_overlay(winner_id: String) -> void:
	# Dim background
	var overlay := ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.7)
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(overlay)

	var panel := VBoxContainer.new()
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.grow_horizontal = Control.GROW_DIRECTION_BOTH
	panel.grow_vertical = Control.GROW_DIRECTION_BOTH
	panel.custom_minimum_size = Vector2(350, 320)
	panel.position = Vector2(465, 150)
	panel.add_theme_constant_override("separation", 10)
	overlay.add_child(panel)

	var is_player_win: bool = winner_id == "playerA"

	# Banner
	var banner := Label.new()
	banner.text = "VICTORY" if is_player_win else "DEFEAT"
	banner.add_theme_font_size_override("font_size", 36)
	banner.add_theme_color_override("font_color", Color.GOLD if is_player_win else Color.RED)
	banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	panel.add_child(banner)

	var winner_label := Label.new()
	winner_label.text = "%s Wins!" % ("Player A" if winner_id == "playerA" else "Player B")
	winner_label.add_theme_font_size_override("font_size", 18)
	winner_label.add_theme_color_override("font_color", Color.WHITE)
	winner_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	panel.add_child(winner_label)

	# Stats
	var pa: Dictionary = _gm.players["playerA"]
	var pb: Dictionary = _gm.players["playerB"]
	var defeats := 0
	var cards_played := 0
	for entry in _gm.game_log:
		var msg: String = entry.get("message", "")
		if "defeated" in msg: defeats += 1
		if msg.begins_with("Played "): cards_played += 1

	var stats_text := "Turns: %d\nPlayer A VP: %d | Player B VP: %d\nSummons defeated: %d\nCards played: %d" % [
		_gm.turn_number, pa["victory_points"], pb["victory_points"], defeats, cards_played
	]
	var stats_label := Label.new()
	stats_label.text = stats_text
	stats_label.add_theme_font_size_override("font_size", 13)
	stats_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.9))
	stats_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	panel.add_child(stats_label)

	# Spacer
	var spacer := Control.new()
	spacer.custom_minimum_size.y = 10
	panel.add_child(spacer)

	# Buttons
	var btn_container := HBoxContainer.new()
	btn_container.add_theme_constant_override("separation", 16)
	btn_container.alignment = BoxContainer.ALIGNMENT_CENTER
	panel.add_child(btn_container)

	var new_game_btn := Button.new()
	new_game_btn.text = "New Game"
	new_game_btn.custom_minimum_size = Vector2(120, 40)
	new_game_btn.pressed.connect(func(): get_tree().reload_current_scene())
	btn_container.add_child(new_game_btn)

	var menu_btn := Button.new()
	menu_btn.text = "Main Menu"
	menu_btn.custom_minimum_size = Vector2(120, 40)
	menu_btn.pressed.connect(func(): get_tree().change_scene_to_file("res://scenes/menu.tscn"))
	btn_container.add_child(menu_btn)


func _find_unit(instance_id: String) -> Dictionary:
	for s in _gm.board_summons:
		if s["instance_id"] == instance_id:
			return s
	return {}
