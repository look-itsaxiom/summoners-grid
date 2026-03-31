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

# Simple test deck for first playable
var _test_card_warrior := {
	"id": "test_warrior", "name": "Gignen Warrior", "card_type": "summon",
	"species": "gignen", "rarity": "common", "element": "neutral",
	"base_stats": {
		"STR": 10, "END": 8, "DEF": 10, "INT": 10, "SPI": 8,
		"MDF": 6, "SPD": 7, "ACC": 7, "LCK": 10,
	},
	"growth_rates": {
		"STR": "normal", "END": "gradual", "DEF": "normal", "INT": "steady",
		"SPI": "normal", "MDF": "minimal", "SPD": "normal", "ACC": "steady", "LCK": "normal",
	},
	"equipment": {
		"weapon": { "name": "Heirloom Sword", "base_power": 30, "damage_type": "physical_melee",
			"range": 1, "base_accuracy": 90.0, "element": "neutral", "stat_bonuses": {} },
		"offhand": {}, "armor": {}, "accessory": {},
	},
	"pile_destination": "removed",
}

var _test_card_mage := {
	"id": "test_mage", "name": "Fae Magician", "card_type": "summon",
	"species": "fae", "rarity": "common", "element": "fire",
	"base_stats": {
		"STR": 9, "END": 8, "DEF": 9, "INT": 9, "SPI": 8,
		"MDF": 10, "SPD": 10, "ACC": 6, "LCK": 12,
	},
	"growth_rates": {
		"STR": "minimal", "END": "normal", "DEF": "steady", "INT": "accelerated",
		"SPI": "gradual", "MDF": "normal", "SPD": "steady", "ACC": "minimal", "LCK": "normal",
	},
	"equipment": {
		"weapon": { "name": "Apprentice Wand", "base_power": 40, "damage_type": "magical",
			"range": 3, "base_accuracy": 85.0, "element": "fire", "stat_bonuses": {} },
		"offhand": {}, "armor": {}, "accessory": {},
	},
	"pile_destination": "removed",
}

var _test_action_card := {
	"id": "healing_hands", "name": "Healing Hands", "card_type": "action",
	"element": "light", "description": "Restore HP to an ally.",
	"requirements": [], "pile_destination": "recharge",
	"speed": "action", "target_type": "ally_summon",
	"effects": [{ "type": "heal", "base_power": 40, "can_crit": true, "description": "Heal ally" }],
}


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
	var deck_a := {
		"summon_slots": [
			{ "summon": _test_card_warrior.duplicate(true), "role_id": "warrior" },
			{ "summon": _test_card_mage.duplicate(true), "role_id": "magician" },
		],
		"main_deck": [_test_action_card.duplicate(true)],
		"advance_deck": [],
	}
	# Give player B different IDs
	var b_warrior := _test_card_warrior.duplicate(true)
	b_warrior["id"] = "test_warrior_b"
	b_warrior["name"] = "Stoneheart Warrior"
	b_warrior["species"] = "stoneheart"

	var b_mage := _test_card_mage.duplicate(true)
	b_mage["id"] = "test_mage_b"
	b_mage["name"] = "Demar Sorcerer"
	b_mage["species"] = "demar"

	var deck_b := {
		"summon_slots": [
			{ "summon": b_warrior, "role_id": "warrior" },
			{ "summon": b_mage, "role_id": "magician" },
		],
		"main_deck": [_test_action_card.duplicate(true)],
		"advance_deck": [],
	}

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
		var btn := Button.new()
		btn.text = "%s\n(%s)" % [card.get("name", "?"), card.get("card_type", "?")]
		btn.custom_minimum_size = Vector2(100, 50)
		btn.tooltip_text = card.get("description", card.get("name", ""))

		if i == selected_card_index:
			btn.modulate = Color.GOLD

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
			if card.get("card_type", "") == "summon":
				_gm.play_summon(selected_card_index, pos)
				selected_card_index = -1
				board.clear_highlights()
				_refresh_ui()
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
		status_label.text = "Selected: %s — click board to play" % card.get("name", "?")
		if card.get("card_type", "") == "summon":
			board.show_placements(_gm.get_valid_placements())

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

	# Simple AI: play a summon if possible
	var ai_hand: Array = _gm.players[_gm.active_player]["hand"]
	for i in range(ai_hand.size() - 1, -1, -1):
		if ai_hand[i].get("card_type", "") == "summon":
			var placements = _gm.get_valid_placements()
			if placements.size() > 0:
				_gm.play_summon(i, placements[0])
			break

	# Move and attack with each summon
	for s in _gm.board_summons.duplicate():
		if s["owner"] != _gm.active_player:
			continue

		# Find nearest enemy
		var enemies: Array = []
		for e in _gm.board_summons:
			if e["owner"] != _gm.active_player:
				enemies.append(e)

		if enemies.size() == 0:
			continue

		var nearest = enemies[0]
		for e in enemies:
			if _dist(s["position"], e["position"]) < _dist(s["position"], nearest["position"]):
				nearest = e

		# Attack if in range
		var attacks = _gm.get_valid_attacks(s["instance_id"])
		if nearest["instance_id"] in attacks:
			_gm.attack_with_summon(s["instance_id"], nearest["instance_id"])
			if _gm.is_game_over:
				return
		else:
			# Move toward nearest enemy
			var moves = _gm.get_valid_moves(s["instance_id"])
			if moves.size() > 0:
				var best_move: Vector2i = moves[0]
				for m in moves:
					if _dist(m, nearest["position"]) < _dist(best_move, nearest["position"]):
						best_move = m
				_gm.move_summon(s["instance_id"], best_move)

				# Attack after move
				attacks = _gm.get_valid_attacks(s["instance_id"])
				if nearest["instance_id"] in attacks:
					_gm.attack_with_summon(s["instance_id"], nearest["instance_id"])
					if _gm.is_game_over:
						return

	# End AI turn
	_gm.end_action_phase()

	if not _gm.is_game_over:
		# Auto-advance draw + level for player
		_gm.execute_draw_phase()
		_gm.execute_level_phase()


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
	status_label.add_theme_color_override("font_color", Color.GOLD)
	end_turn_btn.visible = false
	_refresh_ui()
