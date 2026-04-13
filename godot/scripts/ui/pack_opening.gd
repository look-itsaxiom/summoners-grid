extends Control
## Pack Opening Ceremony — the dopamine machine.
## Cards reveal one at a time with escalating excitement.

const BG_COLOR := Color(0.03, 0.03, 0.08)
const GOLD := Color(1.0, 0.85, 0.0)

const RARITY_COLORS := {
	"common": Color(0.5, 0.5, 0.5),
	"uncommon": Color(0.3, 0.7, 0.3),
	"rare": Color(0.3, 0.5, 0.9),
	"legend": Color(1.0, 0.75, 0.0),
	"myth": Color(0.85, 0.2, 0.85),
}

const RARITY_GLOW := {
	"common": 0.0,
	"uncommon": 0.1,
	"rare": 0.25,
	"legend": 0.5,
	"myth": 0.8,
}

var _cards: Array = []
var _current_index := 0
var _card_nodes: Array = []
var _title_label: Label
var _instruction_label: Label
var _grid: GridContainer
var _sfx: Node
var _is_revealing := false
var _pack_type: String = "standard"
var _species_sprites: Dictionary = {}

# Can be set directly or read from ApiClient autoload
var pack_data: Dictionary = {}


func _ready() -> void:
	_sfx = get_node_or_null("/root/SFX")
	for sp in ["gignen", "fae", "stoneheart", "wilderling", "angar", "demar", "creptilis"]:
		var path := "res://assets/sprites/%s.png" % sp
		if ResourceLoader.exists(path):
			_species_sprites[sp] = load(path)

	# Read pack data from ApiClient if not set directly
	if pack_data.is_empty():
		var api = get_node_or_null("/root/ApiClient")
		if api and api.get("_last_pack_data") is Dictionary:
			pack_data = api.get("_last_pack_data")
			api.set("_last_pack_data", {})

	_cards = pack_data.get("cards", [])
	_pack_type = pack_data.get("packType", "standard")

	# Sort cards: commons first, rarest last (build anticipation)
	var rarity_order := {"common": 0, "uncommon": 1, "rare": 2, "legend": 3, "myth": 4}
	_cards.sort_custom(func(a, b):
		return rarity_order.get(a.get("rarity", "common"), 0) < rarity_order.get(b.get("rarity", "common"), 0)
	)

	_build_ui()

	# Full-screen invisible click catcher for card reveals
	var click_catcher := Button.new()
	click_catcher.name = "ClickCatcher"
	click_catcher.set_anchors_preset(Control.PRESET_FULL_RECT)
	click_catcher.flat = true
	click_catcher.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	click_catcher.pressed.connect(_on_reveal_click)
	click_catcher.z_index = 10  # Above card panels but below buttons
	add_child(click_catcher)

	# Start the ceremony after a brief pause
	get_tree().create_timer(0.5).timeout.connect(_start_reveal)


func _build_ui() -> void:
	# Dark background
	var bg := ColorRect.new()
	bg.color = BG_COLOR
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# Center everything
	var center := VBoxContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	center.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_theme_constant_override("separation", 16)
	var center_margin := MarginContainer.new()
	center_margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	center_margin.add_theme_constant_override("margin_left", 100)
	center_margin.add_theme_constant_override("margin_right", 100)
	center_margin.add_theme_constant_override("margin_top", 40)
	center_margin.add_theme_constant_override("margin_bottom", 40)
	add_child(center_margin)
	center_margin.add_child(center)

	# Title
	_title_label = Label.new()
	_title_label.text = "%s PACK" % _pack_type.to_upper()
	_title_label.add_theme_font_size_override("font_size", 28)
	_title_label.add_theme_color_override("font_color", GOLD)
	_title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(_title_label)

	# Instruction
	_instruction_label = Label.new()
	_instruction_label.text = "Tap anywhere to reveal cards..."
	_instruction_label.add_theme_font_size_override("font_size", 12)
	_instruction_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	_instruction_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(_instruction_label)

	# Card grid
	_grid = GridContainer.new()
	_grid.columns = 5
	_grid.add_theme_constant_override("h_separation", 12)
	_grid.add_theme_constant_override("v_separation", 12)
	_grid.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	center.add_child(_grid)

	# Create face-down card slots
	for i in range(_cards.size()):
		var slot := _create_card_slot(i)
		_grid.add_child(slot)
		_card_nodes.append(slot)

	# Continue button (hidden until all revealed)
	var btn_row := HBoxContainer.new()
	btn_row.alignment = BoxContainer.ALIGNMENT_CENTER
	btn_row.add_theme_constant_override("separation", 16)
	center.add_child(btn_row)

	var continue_btn := Button.new()
	continue_btn.text = "CONTINUE"
	continue_btn.name = "ContinueBtn"
	continue_btn.custom_minimum_size = Vector2(160, 42)
	continue_btn.add_theme_font_size_override("font_size", 16)
	continue_btn.visible = false
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.2, 0.5, 0.3)
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	continue_btn.add_theme_stylebox_override("normal", style)
	var hover := style.duplicate()
	hover.bg_color = style.bg_color.lightened(0.15)
	continue_btn.add_theme_stylebox_override("hover", hover)
	continue_btn.pressed.connect(_on_continue)
	btn_row.add_child(continue_btn)

	var open_more := Button.new()
	open_more.text = "OPEN ANOTHER"
	open_more.name = "OpenMoreBtn"
	open_more.custom_minimum_size = Vector2(160, 42)
	open_more.add_theme_font_size_override("font_size", 16)
	open_more.visible = false
	var style2 := StyleBoxFlat.new()
	style2.bg_color = Color(0.6, 0.4, 0.15)
	style2.corner_radius_top_left = 8
	style2.corner_radius_top_right = 8
	style2.corner_radius_bottom_left = 8
	style2.corner_radius_bottom_right = 8
	style2.content_margin_top = 10
	style2.content_margin_bottom = 10
	open_more.add_theme_stylebox_override("normal", style2)
	var hover2 := style2.duplicate()
	hover2.bg_color = style2.bg_color.lightened(0.15)
	open_more.add_theme_stylebox_override("hover", hover2)
	open_more.pressed.connect(func(): get_node("/root/SceneTransition").change_scene("res://scenes/pack_store.tscn"))
	btn_row.add_child(open_more)


func _create_card_slot(index: int) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(140, 180)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.12, 0.12, 0.2)
	style.border_color = Color(0.25, 0.25, 0.35)
	style.border_width_top = 2
	style.border_width_bottom = 2
	style.border_width_left = 2
	style.border_width_right = 2
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	style.content_margin_left = 10
	style.content_margin_right = 10
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	panel.add_theme_stylebox_override("panel", style)

	var vbox := VBoxContainer.new()
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_theme_constant_override("separation", 4)
	panel.add_child(vbox)

	# Face-down: question mark
	var mystery := Label.new()
	mystery.name = "Mystery"
	mystery.text = "?"
	mystery.add_theme_font_size_override("font_size", 48)
	mystery.add_theme_color_override("font_color", Color(0.3, 0.3, 0.4))
	mystery.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(mystery)

	var hint := Label.new()
	hint.name = "Hint"
	hint.text = "Card %d" % (index + 1)
	hint.add_theme_font_size_override("font_size", 10)
	hint.add_theme_color_override("font_color", Color(0.3, 0.3, 0.4))
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(hint)

	return panel


func _start_reveal() -> void:
	_instruction_label.text = "Click to reveal each card!"
	_is_revealing = true


## Called when the invisible click catcher is pressed.
func _on_reveal_click() -> void:
	if _is_revealing and _current_index < _cards.size():
		_reveal_card(_current_index)
		_current_index += 1

		if _current_index >= _cards.size():
			_all_revealed()


func _reveal_card(index: int) -> void:
	if index >= _cards.size() or index >= _card_nodes.size():
		return

	var card: Dictionary = _cards[index]
	var panel: PanelContainer = _card_nodes[index]
	var rarity: String = card.get("rarity", "common")
	var rarity_color: Color = RARITY_COLORS.get(rarity, Color(0.5, 0.5, 0.5))
	var glow_strength: float = RARITY_GLOW.get(rarity, 0.0)

	# Update panel border to rarity color
	var style: StyleBoxFlat = panel.get_theme_stylebox("panel").duplicate()
	style.border_color = rarity_color
	style.bg_color = Color(0.08, 0.08, 0.14).lerp(rarity_color, glow_strength * 0.3)
	if glow_strength > 0.3:
		style.border_width_top = 3
		style.border_width_bottom = 3
		style.border_width_left = 3
		style.border_width_right = 3
	panel.add_theme_stylebox_override("panel", style)

	# Replace content
	var vbox: VBoxContainer = panel.get_child(0)
	for child in vbox.get_children():
		child.queue_free()

	# Species art
	var sp: String = card.get("species", "")
	if sp in _species_sprites and _species_sprites[sp] != null:
		var sprite := TextureRect.new()
		sprite.texture = _species_sprites[sp]
		sprite.custom_minimum_size = Vector2(50, 50)
		sprite.expand_mode = TextureRect.EXPAND_FIT_WIDTH_PROPORTIONAL
		sprite.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		sprite.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		vbox.add_child(sprite)
	else:
		var species_map := {"gignen": "⚔️", "fae": "✨", "stoneheart": "🪨", "wilderling": "🐺", "angar": "👼", "demar": "😈", "creptilis": "🦎"}
		var emoji := Label.new()
		emoji.text = species_map.get(sp, "🃏")
		emoji.add_theme_font_size_override("font_size", 36)
		emoji.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(emoji)

	# Name
	var name_lbl := Label.new()
	name_lbl.text = card.get("name", "?")
	name_lbl.add_theme_font_size_override("font_size", 13)
	name_lbl.add_theme_color_override("font_color", Color.WHITE)
	name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(name_lbl)

	# Rarity
	var rarity_lbl := Label.new()
	rarity_lbl.text = rarity.to_upper()
	rarity_lbl.add_theme_font_size_override("font_size", 11)
	rarity_lbl.add_theme_color_override("font_color", rarity_color)
	rarity_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(rarity_lbl)

	# Species
	var species_lbl := Label.new()
	species_lbl.text = card.get("species", "?").capitalize()
	species_lbl.add_theme_font_size_override("font_size", 10)
	species_lbl.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	species_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(species_lbl)

	# DNA
	var dna_lbl := Label.new()
	dna_lbl.text = card.get("dna", "").substr(0, 16)
	dna_lbl.add_theme_font_size_override("font_size", 8)
	dna_lbl.add_theme_color_override("font_color", Color(0.3, 0.3, 0.4))
	dna_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(dna_lbl)

	# Sound — escalating pitch based on rarity
	if _sfx:
		match rarity:
			"common": _sfx.click()
			"uncommon": _sfx.card_play()
			"rare": _sfx.summon_place()
			"legend":
				_sfx.vp_gain()
				_screen_shake(6.0)
			"myth":
				_sfx.victory()
				_screen_shake(12.0)

	# Update instruction
	var remaining := _cards.size() - _current_index - 1
	if remaining > 0:
		_instruction_label.text = "%d cards remaining..." % remaining
	else:
		_instruction_label.text = ""


func _all_revealed() -> void:
	_is_revealing = false
	_title_label.text = "PACK COMPLETE!"

	# Hide click catcher so buttons become clickable
	var catcher = get_node_or_null("ClickCatcher")
	if catcher:
		catcher.visible = false

	# Count rarities for summary
	var counts := {}
	for card in _cards:
		var r: String = card.get("rarity", "common")
		counts[r] = counts.get(r, 0) + 1

	var summary_parts: Array[String] = []
	for r in ["myth", "legend", "rare", "uncommon", "common"]:
		if counts.has(r):
			summary_parts.append("%d %s" % [counts[r], r.to_upper()])
	_instruction_label.text = " · ".join(summary_parts)
	_instruction_label.add_theme_color_override("font_color", GOLD)

	# Show buttons
	var continue_btn = _find_node_recursive(self, "ContinueBtn")
	if continue_btn:
		continue_btn.visible = true
	var open_more = _find_node_recursive(self, "OpenMoreBtn")
	if open_more:
		open_more.visible = true

	# Celebration sound
	if _sfx:
		_sfx.level_up()


func _find_node_recursive(node: Node, target_name: String) -> Node:
	if node.name == target_name:
		return node
	for child in node.get_children():
		var found := _find_node_recursive(child, target_name)
		if found:
			return found
	return null


func _on_continue() -> void:
	get_node("/root/SceneTransition").change_scene("res://scenes/pack_store.tscn")


# Screen shake
var _shake_intensity := 0.0
var _original_position := Vector2.ZERO
var _shake_active := false

func _screen_shake(intensity: float) -> void:
	_shake_intensity = intensity
	_shake_active = true

func _process(_delta: float) -> void:
	if _shake_active:
		_shake_intensity *= 0.85
		if _shake_intensity < 0.5:
			_shake_active = false
			position = Vector2.ZERO
		else:
			position = Vector2(randf_range(-_shake_intensity, _shake_intensity), randf_range(-_shake_intensity, _shake_intensity))
