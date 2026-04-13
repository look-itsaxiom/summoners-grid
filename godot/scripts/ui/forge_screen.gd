extends Control
## Card Forge — combine 3 cards of same rarity into 1 card of next rarity.

var CardWidgetScript = preload("res://scripts/ui/card_widget.gd")

const BG_COLOR := Color(0.05, 0.05, 0.1)
const GOLD := Color(1.0, 0.85, 0.0)

const RARITY_ORDER := ["common", "uncommon", "rare", "legend", "myth"]
const RARITY_COLORS := {
	"common": Color(0.5, 0.5, 0.5),
	"uncommon": Color(0.3, 0.7, 0.3),
	"rare": Color(0.3, 0.5, 0.9),
	"legend": Color(0.9, 0.7, 0.1),
	"myth": Color(0.8, 0.3, 0.9),
}

@onready var _storage = get_node("/root/CardStorage")
var _selected: Array = []  # Card indices selected for forging
var _selected_rarity: String = ""
var _grid: GridContainer
var _result_label: Label
var _forge_btn: Button


func _ready() -> void:
	_build_ui()


func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = BG_COLOR
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_top", 30)
	margin.add_theme_constant_override("margin_bottom", 30)
	margin.add_theme_constant_override("margin_left", 100)
	margin.add_theme_constant_override("margin_right", 100)
	add_child(margin)

	var outer := VBoxContainer.new()
	outer.add_theme_constant_override("separation", 10)
	outer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	margin.add_child(outer)

	var title := Label.new()
	title.text = "CARD FORGE"
	title.add_theme_font_size_override("font_size", 26)
	title.add_theme_color_override("font_color", GOLD)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	outer.add_child(title)

	var desc := Label.new()
	desc.text = "Select 3 cards of the same rarity to forge into 1 card of the next rarity up."
	desc.add_theme_font_size_override("font_size", 12)
	desc.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	outer.add_child(desc)

	# Result preview
	_result_label = Label.new()
	_result_label.text = "Select 3 cards to forge..."
	_result_label.add_theme_font_size_override("font_size", 14)
	_result_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7))
	_result_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	outer.add_child(_result_label)

	# Forge button
	_forge_btn = Button.new()
	_forge_btn.text = "FORGE"
	_forge_btn.custom_minimum_size = Vector2(200, 42)
	_forge_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	_forge_btn.add_theme_font_size_override("font_size", 16)
	_forge_btn.disabled = true
	var fs := StyleBoxFlat.new()
	fs.bg_color = Color(0.5, 0.3, 0.1)
	fs.corner_radius_top_left = 6
	fs.corner_radius_top_right = 6
	fs.corner_radius_bottom_left = 6
	fs.corner_radius_bottom_right = 6
	_forge_btn.add_theme_stylebox_override("normal", fs)
	_forge_btn.pressed.connect(_on_forge)
	outer.add_child(_forge_btn)

	# Card grid
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	outer.add_child(scroll)

	_grid = GridContainer.new()
	_grid.columns = 8
	_grid.add_theme_constant_override("h_separation", 6)
	_grid.add_theme_constant_override("v_separation", 6)
	scroll.add_child(_grid)

	_refresh_grid()

	# Back button
	var back_btn := Button.new()
	back_btn.text = "Back to Menu"
	back_btn.custom_minimum_size = Vector2(160, 38)
	back_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	back_btn.add_theme_font_size_override("font_size", 13)
	var bs := StyleBoxFlat.new()
	bs.bg_color = Color(0.2, 0.2, 0.3)
	bs.corner_radius_top_left = 6
	bs.corner_radius_top_right = 6
	bs.corner_radius_bottom_left = 6
	bs.corner_radius_bottom_right = 6
	back_btn.add_theme_stylebox_override("normal", bs)
	back_btn.pressed.connect(func(): get_node("/root/SceneTransition").change_scene("res://scenes/menu.tscn"))
	outer.add_child(back_btn)


func _refresh_grid() -> void:
	for child in _grid.get_children():
		child.queue_free()
	_selected.clear()
	_selected_rarity = ""
	_update_forge_state()

	var cards: Array = _storage.get_cards()
	# Only show cards that can be forged (not myth — already max rarity)
	for i in range(cards.size()):
		var card: Dictionary = cards[i]
		var rarity: String = card.get("rarity", "common")
		if rarity == "myth":
			continue
		var btn := _create_card_btn(card, i)
		_grid.add_child(btn)


func _create_card_btn(card: Dictionary, index: int) -> Control:
	var rarity: String = card.get("rarity", "common")
	var cw := Control.new()
	cw.set_script(CardWidgetScript)
	cw.setup(card, true)  # Mini mode for forge grid
	cw.card_clicked.connect(func(): _toggle_select(index, rarity, cw))
	return cw


func _toggle_select(index: int, rarity: String, cw: Control) -> void:
	if index in _selected:
		_selected.erase(index)
		cw.modulate = Color(1, 1, 1)
	else:
		if _selected.size() > 0 and rarity != _selected_rarity:
			return
		if _selected.size() >= 3:
			return
		_selected.append(index)
		_selected_rarity = rarity
		cw.modulate = Color(1.3, 1.1, 0.7)  # Gold highlight for selected

	if _selected.is_empty():
		_selected_rarity = ""
	_update_forge_state()


func _update_forge_state() -> void:
	if _selected.size() == 3:
		var next_idx: int = RARITY_ORDER.find(_selected_rarity) + 1
		if next_idx < RARITY_ORDER.size():
			var next_rarity: String = RARITY_ORDER[next_idx]
			_result_label.text = "Forge 3 %s cards into 1 %s card!" % [_selected_rarity.to_upper(), next_rarity.to_upper()]
			_result_label.add_theme_color_override("font_color", RARITY_COLORS.get(next_rarity, GOLD))
			_forge_btn.disabled = false
			return
	_forge_btn.disabled = true
	if _selected.size() > 0:
		_result_label.text = "%d / 3 %s cards selected" % [_selected.size(), _selected_rarity.to_upper()]
		_result_label.add_theme_color_override("font_color", RARITY_COLORS.get(_selected_rarity, Color(0.6, 0.6, 0.7)))
	else:
		_result_label.text = "Select 3 cards of the same rarity to forge..."
		_result_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7))


func _on_forge() -> void:
	if _selected.size() != 3:
		return

	var next_idx: int = RARITY_ORDER.find(_selected_rarity) + 1
	if next_idx >= RARITY_ORDER.size():
		return

	var next_rarity: String = RARITY_ORDER[next_idx]

	# Remove the 3 selected cards
	_storage.remove_cards_by_indices(_selected)

	# Generate 1 new card of next rarity
	var species := ["gignen", "fae", "stoneheart", "wilderling", "angar", "demar", "creptilis"]
	var sp: String = species[randi() % species.size()]
	var names := ["Forged", "Ascended", "Reborn", "Awakened", "Transcended", "Evolved", "Empowered", "Blessed"]
	var suffixes := ["Guardian", "Champion", "Sentinel", "Warden", "Harbinger", "Sovereign"]
	var new_name: String = "%s %s" % [names[randi() % names.size()], suffixes[randi() % suffixes.size()]]

	var new_card := {
		"name": new_name,
		"species": sp,
		"rarity": next_rarity,
		"power": 50 + randi() % 50 + next_idx * 20,
		"element": "neutral",
		"acquired_at": Time.get_datetime_string_from_system(),
		"source": "forge",
	}
	_storage._collection.append(new_card)
	_storage.save_collection()

	# Check achievements
	var achievements = get_node_or_null("/root/Achievements")
	if achievements:
		achievements.check_all()

	_refresh_grid()
	_result_label.text = "Forged: %s (%s)!" % [new_name, next_rarity.to_upper()]
	_result_label.add_theme_color_override("font_color", RARITY_COLORS.get(next_rarity, GOLD))
