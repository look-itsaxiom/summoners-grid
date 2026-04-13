extends Control
## Deck Builder — select cards from your collection to build a playable deck.
## Connects the economy (packs) to gameplay (battle).

const BG_COLOR := Color(0.04, 0.04, 0.09)
const GOLD := Color(1.0, 0.85, 0.0)

const RARITY_COLORS := {
	"common": Color(0.5, 0.5, 0.5), "uncommon": Color(0.3, 0.7, 0.3),
	"rare": Color(0.3, 0.5, 0.9), "legend": Color(1.0, 0.75, 0.0),
	"myth": Color(0.85, 0.2, 0.85),
}

var _storage: Node
var _collection: Array = []
var _deck_summons: Array = []  # 3 summon cards for the deck
var _deck_label: Label
var _grid: GridContainer
var _summon_slots: Array = []  # 3 slot panels


func _ready() -> void:
	_storage = get_node("/root/CardStorage")
	_collection = _storage.get_cards()
	_build_ui()


func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = BG_COLOR
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var main_hbox := HBoxContainer.new()
	main_hbox.set_anchors_preset(Control.PRESET_FULL_RECT)
	main_hbox.add_theme_constant_override("separation", 0)
	add_child(main_hbox)

	# Left panel: deck slots
	var left := _build_deck_panel()
	main_hbox.add_child(left)

	# Right: card grid from collection
	var right := VBoxContainer.new()
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right.add_theme_constant_override("separation", 8)
	main_hbox.add_child(right)

	# Header
	var header_margin := MarginContainer.new()
	header_margin.add_theme_constant_override("margin_top", 12)
	header_margin.add_theme_constant_override("margin_left", 16)
	header_margin.add_theme_constant_override("margin_right", 16)
	right.add_child(header_margin)

	var header := Label.new()
	header.text = "YOUR CARDS — tap to add to deck"
	header.add_theme_font_size_override("font_size", 14)
	header.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7))
	header_margin.add_child(header)

	# Card grid
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	right.add_child(scroll)

	var grid_margin := MarginContainer.new()
	grid_margin.add_theme_constant_override("margin_left", 16)
	grid_margin.add_theme_constant_override("margin_right", 16)
	grid_margin.add_theme_constant_override("margin_bottom", 16)
	grid_margin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(grid_margin)

	_grid = GridContainer.new()
	_grid.columns = 5
	_grid.add_theme_constant_override("h_separation", 8)
	_grid.add_theme_constant_override("v_separation", 8)
	_grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid_margin.add_child(_grid)

	_refresh_card_grid()


func _build_deck_panel() -> PanelContainer:
	var panel := PanelContainer.new()
	panel.custom_minimum_size.x = 280
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.06, 0.06, 0.12)
	style.content_margin_top = 16
	style.content_margin_bottom = 16
	style.content_margin_left = 16
	style.content_margin_right = 16
	panel.add_theme_stylebox_override("panel", style)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 10)
	panel.add_child(vbox)

	var title := Label.new()
	title.text = "DECK BUILDER"
	title.add_theme_font_size_override("font_size", 20)
	title.add_theme_color_override("font_color", GOLD)
	vbox.add_child(title)

	_deck_label = Label.new()
	_deck_label.text = "Select 3 summons for your deck"
	_deck_label.add_theme_font_size_override("font_size", 11)
	_deck_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	_deck_label.autowrap_mode = TextServer.AUTOWRAP_WORD
	vbox.add_child(_deck_label)

	# 3 summon slots
	var slots_label := Label.new()
	slots_label.text = "SUMMON SLOTS"
	slots_label.add_theme_font_size_override("font_size", 12)
	slots_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8))
	vbox.add_child(slots_label)

	for i in range(3):
		var slot := _create_empty_slot(i)
		_summon_slots.append(slot)
		vbox.add_child(slot)

	# Spacer
	var spacer := Control.new()
	spacer.custom_minimum_size.y = 16
	spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_child(spacer)

	# Play button
	var play_btn := Button.new()
	play_btn.text = "PLAY WITH THIS DECK"
	play_btn.custom_minimum_size.y = 44
	play_btn.add_theme_font_size_override("font_size", 14)
	var ps := StyleBoxFlat.new()
	ps.bg_color = Color(0.2, 0.5, 0.3)
	ps.corner_radius_top_left = 8
	ps.corner_radius_top_right = 8
	ps.corner_radius_bottom_left = 8
	ps.corner_radius_bottom_right = 8
	ps.content_margin_top = 10
	ps.content_margin_bottom = 10
	play_btn.add_theme_stylebox_override("normal", ps)
	var ph := ps.duplicate()
	ph.bg_color = ps.bg_color.lightened(0.15)
	play_btn.add_theme_stylebox_override("hover", ph)
	play_btn.pressed.connect(_on_play)
	vbox.add_child(play_btn)

	# Back button
	var back_btn := Button.new()
	back_btn.text = "BACK TO MENU"
	back_btn.custom_minimum_size.y = 36
	back_btn.add_theme_font_size_override("font_size", 12)
	var bs := StyleBoxFlat.new()
	bs.bg_color = Color(0.2, 0.2, 0.3)
	bs.corner_radius_top_left = 6
	bs.corner_radius_top_right = 6
	bs.corner_radius_bottom_left = 6
	bs.corner_radius_bottom_right = 6
	back_btn.add_theme_stylebox_override("normal", bs)
	back_btn.pressed.connect(func(): get_tree().change_scene_to_file("res://scenes/menu.tscn"))
	vbox.add_child(back_btn)

	return panel


func _create_empty_slot(index: int) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(0, 50)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.1, 0.1, 0.18)
	style.border_color = Color(0.2, 0.2, 0.3)
	style.border_width_top = 1
	style.border_width_bottom = 1
	style.border_width_left = 1
	style.border_width_right = 1
	style.corner_radius_top_left = 6
	style.corner_radius_top_right = 6
	style.corner_radius_bottom_left = 6
	style.corner_radius_bottom_right = 6
	style.content_margin_left = 8
	style.content_margin_right = 8
	style.content_margin_top = 6
	style.content_margin_bottom = 6
	panel.add_theme_stylebox_override("panel", style)

	var label := Label.new()
	label.name = "SlotLabel"
	label.text = "Empty Slot %d" % (index + 1)
	label.add_theme_font_size_override("font_size", 11)
	label.add_theme_color_override("font_color", Color(0.3, 0.3, 0.4))
	panel.add_child(label)

	return panel


func _refresh_card_grid() -> void:
	for child in _grid.get_children():
		child.queue_free()

	if _collection.is_empty():
		var empty := Label.new()
		empty.text = "No cards! Visit the Pack Store to get started."
		empty.add_theme_font_size_override("font_size", 13)
		empty.add_theme_color_override("font_color", Color(0.4, 0.4, 0.5))
		_grid.add_child(empty)
		return

	for card in _collection:
		var widget := _create_card_button(card)
		_grid.add_child(widget)


func _create_card_button(card: Dictionary) -> Button:
	var rarity: String = card.get("rarity", "common")
	var rc: Color = RARITY_COLORS.get(rarity, Color(0.5, 0.5, 0.5))
	var already_in_deck := card in _deck_summons

	var btn := Button.new()
	btn.custom_minimum_size = Vector2(130, 70)
	btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL

	var text := "%s\n%s · %s" % [card.get("name", "?"), rarity.to_upper(), card.get("species", "?").capitalize()]
	if already_in_deck:
		text += "\n[IN DECK]"
	btn.text = text
	btn.add_theme_font_size_override("font_size", 10)
	btn.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART

	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.08, 0.08, 0.14) if not already_in_deck else Color(0.12, 0.18, 0.12)
	style.border_color = rc if not already_in_deck else Color(0.3, 0.6, 0.3)
	style.border_width_top = 2
	style.border_width_bottom = 2
	style.border_width_left = 2
	style.border_width_right = 2
	style.corner_radius_top_left = 6
	style.corner_radius_top_right = 6
	style.corner_radius_bottom_left = 6
	style.corner_radius_bottom_right = 6
	style.content_margin_left = 6
	style.content_margin_right = 6
	style.content_margin_top = 4
	style.content_margin_bottom = 4
	btn.add_theme_stylebox_override("normal", style)

	var hover := style.duplicate()
	hover.bg_color = style.bg_color.lightened(0.1)
	btn.add_theme_stylebox_override("hover", hover)

	btn.pressed.connect(func(): _toggle_card(card))
	return btn


func _toggle_card(card: Dictionary) -> void:
	if card in _deck_summons:
		_deck_summons.erase(card)
	elif _deck_summons.size() < 3:
		_deck_summons.append(card)
	else:
		return  # Deck full

	_refresh_slots()
	_refresh_card_grid()


func _refresh_slots() -> void:
	for i in range(3):
		var slot: PanelContainer = _summon_slots[i]
		var label: Label = slot.get_node("SlotLabel")
		var style: StyleBoxFlat = slot.get_theme_stylebox("panel").duplicate()

		if i < _deck_summons.size():
			var card: Dictionary = _deck_summons[i]
			var rc: Color = RARITY_COLORS.get(card.get("rarity", "common"), Color(0.5, 0.5, 0.5))
			label.text = "%s (%s %s)" % [card.get("name", "?"), card.get("rarity", "?").to_upper(), card.get("species", "?").capitalize()]
			label.add_theme_color_override("font_color", rc)
			style.border_color = rc
			style.bg_color = Color(0.08, 0.08, 0.14)
		else:
			label.text = "Empty Slot %d" % (i + 1)
			label.add_theme_color_override("font_color", Color(0.3, 0.3, 0.4))
			style.border_color = Color(0.2, 0.2, 0.3)
			style.bg_color = Color(0.1, 0.1, 0.18)

		slot.add_theme_stylebox_override("panel", style)

	_deck_label.text = "%d / 3 summons selected" % _deck_summons.size()
	if _deck_summons.size() == 3:
		_deck_label.add_theme_color_override("font_color", Color(0.3, 0.8, 0.3))
	else:
		_deck_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))


func _on_play() -> void:
	if _deck_summons.size() < 3:
		_deck_label.text = "Need 3 summons to play!"
		_deck_label.add_theme_color_override("font_color", Color(1.0, 0.3, 0.3))
		return

	# For now, play with standard decks (custom deck integration is next step)
	var gm = get_node("/root/GameManager")
	gm.spectator_mode = false
	gm.use_random_decks = false
	get_tree().change_scene_to_file("res://scenes/game.tscn")
