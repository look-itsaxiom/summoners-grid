extends Control
## Deck preview screen — shows player's deck before game starts.
## Appears between menu and game. Shows summons, main deck, advance deck.

const BG_COLOR := Color(0.05, 0.05, 0.1)

var _mode: String = "standard"  # standard, random, spectator
@onready var _cards = get_node("/root/CardDB")


func _ready() -> void:
	var gm = get_node("/root/GameManager")
	_mode = "spectator" if gm.spectator_mode else ("random" if gm.use_random_decks else "standard")
	_build_ui()


func _build_ui() -> void:
	# Background
	var bg := ColorRect.new()
	bg.color = BG_COLOR
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# Scroll container for the whole page
	var scroll := ScrollContainer.new()
	scroll.set_anchors_preset(Control.PRESET_FULL_RECT)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	add_child(scroll)

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_top", 20)
	margin.add_theme_constant_override("margin_bottom", 20)
	margin.add_theme_constant_override("margin_left", 40)
	margin.add_theme_constant_override("margin_right", 40)
	margin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(margin)

	var main := VBoxContainer.new()
	main.add_theme_constant_override("separation", 16)
	main.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	margin.add_child(main)

	# Title
	var title := Label.new()
	title.text = "DECK PREVIEW"
	title.add_theme_font_size_override("font_size", 28)
	title.add_theme_color_override("font_color", Color(1.0, 0.85, 0.0))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	main.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "Review your cards before battle"
	subtitle.add_theme_font_size_override("font_size", 12)
	subtitle.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7))
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	main.add_child(subtitle)

	# Get the deck
	var deck: Dictionary = _cards.create_player_a_deck()

	# Summons section
	_add_section_header(main, "SUMMONS (%d)" % deck["summon_slots"].size())
	var summon_grid := GridContainer.new()
	summon_grid.columns = 3
	summon_grid.add_theme_constant_override("h_separation", 8)
	summon_grid.add_theme_constant_override("v_separation", 8)
	main.add_child(summon_grid)

	for slot in deck["summon_slots"]:
		var card: Dictionary = slot["summon"]
		var role_id: String = slot["role_id"]
		_add_summon_card(summon_grid, card, role_id)

	# Main deck section
	var main_deck: Array = deck["main_deck"]
	_add_section_header(main, "MAIN DECK (%d cards)" % main_deck.size())

	# Group by type
	var by_type: Dictionary = {}
	for card in main_deck:
		var ct: String = card.get("card_type", "unknown")
		if not by_type.has(ct):
			by_type[ct] = []
		by_type[ct].append(card)

	for card_type in by_type:
		var cards: Array = by_type[card_type]
		var type_label := Label.new()
		type_label.text = "%s (%d)" % [card_type.to_upper(), cards.size()]
		type_label.add_theme_font_size_override("font_size", 11)
		type_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8))
		main.add_child(type_label)

		var card_grid := GridContainer.new()
		card_grid.columns = 4
		card_grid.add_theme_constant_override("h_separation", 6)
		card_grid.add_theme_constant_override("v_separation", 6)
		main.add_child(card_grid)

		for card in cards:
			_add_deck_card(card_grid, card)

	# Advance deck section
	var advance_deck: Array = deck["advance_deck"]
	if advance_deck.size() > 0:
		_add_section_header(main, "ADVANCE DECK (%d cards)" % advance_deck.size())
		var adv_grid := GridContainer.new()
		adv_grid.columns = 4
		adv_grid.add_theme_constant_override("h_separation", 6)
		adv_grid.add_theme_constant_override("v_separation", 6)
		main.add_child(adv_grid)

		for card in advance_deck:
			_add_deck_card(adv_grid, card)

	# Spacer
	var spacer := Control.new()
	spacer.custom_minimum_size.y = 16
	main.add_child(spacer)

	# Buttons
	var btn_row := HBoxContainer.new()
	btn_row.add_theme_constant_override("separation", 16)
	btn_row.alignment = BoxContainer.ALIGNMENT_CENTER
	main.add_child(btn_row)

	_add_button(btn_row, "START GAME", Color(0.2, 0.6, 0.3), _on_start_game)
	_add_button(btn_row, "BACK", Color(0.3, 0.3, 0.4), _on_back)


func _add_section_header(parent: VBoxContainer, text: String) -> void:
	var divider := ColorRect.new()
	divider.color = Color(0.3, 0.25, 0.5, 0.4)
	divider.custom_minimum_size = Vector2(0, 1)
	parent.add_child(divider)

	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", 14)
	label.add_theme_color_override("font_color", Color(0.9, 0.8, 0.5))
	parent.add_child(label)


func _add_summon_card(parent: GridContainer, card: Dictionary, role_id: String) -> void:
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(250, 80)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.1, 0.12, 0.2)
	style.border_color = Color(0.3, 0.4, 0.7)
	style.border_width_top = 2
	style.border_width_bottom = 2
	style.border_width_left = 2
	style.border_width_right = 2
	style.corner_radius_top_left = 6
	style.corner_radius_top_right = 6
	style.corner_radius_bottom_left = 6
	style.corner_radius_bottom_right = 6
	style.content_margin_left = 8
	style.content_margin_right = 8
	style.content_margin_top = 6
	style.content_margin_bottom = 6
	panel.add_theme_stylebox_override("panel", style)
	parent.add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 2)
	panel.add_child(vbox)

	# Name + species
	var name_label := Label.new()
	name_label.text = "%s  [%s · %s]" % [card.get("name", "?"), role_id.capitalize(), card.get("species", "?").capitalize()]
	name_label.add_theme_font_size_override("font_size", 12)
	name_label.add_theme_color_override("font_color", Color(0.4, 0.7, 1.0))
	vbox.add_child(name_label)

	# Key stats
	var base_stats: Dictionary = card.get("base_stats", {})
	var stats_text := "STR %d  DEF %d  INT %d  SPD %d  LCK %d" % [
		base_stats.get("STR", 0), base_stats.get("DEF", 0),
		base_stats.get("INT", 0), base_stats.get("SPD", 0),
		base_stats.get("LCK", 0)]
	var stats_label := Label.new()
	stats_label.text = stats_text
	stats_label.add_theme_font_size_override("font_size", 10)
	stats_label.add_theme_color_override("font_color", Color(0.6, 0.7, 0.8))
	vbox.add_child(stats_label)

	# Weapon
	var weapon: Dictionary = card.get("equipment", {}).get("weapon", {})
	if not weapon.is_empty():
		var wpn_label := Label.new()
		wpn_label.text = "Weapon: %s (BP:%d, Range:%d)" % [
			weapon.get("name", "?"), weapon.get("base_power", 0), weapon.get("range", 1)]
		wpn_label.add_theme_font_size_override("font_size", 9)
		wpn_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
		vbox.add_child(wpn_label)


func _add_deck_card(parent: GridContainer, card: Dictionary) -> void:
	var ct: String = card.get("card_type", "")
	var btn := PanelContainer.new()
	btn.custom_minimum_size = Vector2(140, 45)
	var style := StyleBoxFlat.new()
	style.corner_radius_top_left = 4
	style.corner_radius_top_right = 4
	style.corner_radius_bottom_left = 4
	style.corner_radius_bottom_right = 4
	style.content_margin_left = 6
	style.content_margin_right = 6
	style.content_margin_top = 4
	style.content_margin_bottom = 4

	# Color by type
	match ct:
		"action": style.bg_color = Color(0.2, 0.12, 0.08)
		"quest": style.bg_color = Color(0.12, 0.2, 0.12)
		"building": style.bg_color = Color(0.18, 0.18, 0.1)
		"counter": style.bg_color = Color(0.25, 0.08, 0.08)
		"reaction": style.bg_color = Color(0.2, 0.08, 0.16)
		"advance": style.bg_color = Color(0.16, 0.12, 0.24)
		_: style.bg_color = Color(0.12, 0.12, 0.18)

	btn.add_theme_stylebox_override("panel", style)
	parent.add_child(btn)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 1)
	btn.add_child(vbox)

	var name_label := Label.new()
	name_label.text = card.get("name", "?")
	name_label.add_theme_font_size_override("font_size", 10)
	name_label.add_theme_color_override("font_color", Color(0.85, 0.85, 0.9))
	name_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(name_label)

	var type_label := Label.new()
	type_label.text = "[%s]" % ct.to_upper()
	type_label.add_theme_font_size_override("font_size", 8)
	type_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	vbox.add_child(type_label)


func _add_button(parent: HBoxContainer, text: String, color: Color, callback: Callable) -> void:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(160, 44)
	btn.add_theme_font_size_override("font_size", 16)
	btn.pressed.connect(callback)
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	btn.add_theme_stylebox_override("normal", style)
	var hover := style.duplicate()
	hover.bg_color = color.lightened(0.15)
	btn.add_theme_stylebox_override("hover", hover)
	parent.add_child(btn)


func _on_start_game() -> void:
	get_node("/root/SceneTransition").change_scene("res://scenes/game.tscn")


func _on_back() -> void:
	get_node("/root/SceneTransition").change_scene("res://scenes/menu.tscn")
