extends Control
## Card Collection Gallery — browse owned cards with filtering.
## Production-quality layout with card grid, filters, and detail view.

const BG_COLOR := Color(0.04, 0.04, 0.09)
const GOLD := Color(1.0, 0.85, 0.0)

const RARITY_COLORS := {
	"common": Color(0.5, 0.5, 0.5),
	"uncommon": Color(0.3, 0.7, 0.3),
	"rare": Color(0.3, 0.5, 0.9),
	"legend": Color(1.0, 0.75, 0.0),
	"myth": Color(0.85, 0.2, 0.85),
}

const SPECIES_EMOJI := {
	"gignen": "⚔️", "fae": "✨", "stoneheart": "🪨",
	"wilderling": "🐺", "angar": "👼", "demar": "😈", "creptilis": "🦎",
}

var _cards: Array = []  # All owned cards
var _filtered: Array = []  # After applying filters
var _grid: GridContainer
var _count_label: Label
var _detail_panel: VBoxContainer
var _filter_species: String = ""
var _filter_rarity: String = ""


func _ready() -> void:
	# Load collection from persistent storage
	var storage = get_node_or_null("/root/CardStorage")
	if storage:
		_cards = storage.get_cards()

	# If empty (first launch), show demo collection
	if _cards.is_empty():
		_cards = _generate_demo_collection()

	# Sort by rarity (rarest first)
	var rarity_order := {"myth": 0, "legend": 1, "rare": 2, "uncommon": 3, "common": 4}
	_cards.sort_custom(func(a, b): return rarity_order.get(a.get("rarity", "common"), 9) < rarity_order.get(b.get("rarity", "common"), 9))

	_filtered = _cards.duplicate()
	_build_ui()


func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = BG_COLOR
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# Main layout: sidebar filters + card grid
	var hbox := HBoxContainer.new()
	hbox.set_anchors_preset(Control.PRESET_FULL_RECT)
	hbox.add_theme_constant_override("separation", 0)
	add_child(hbox)

	# Left sidebar: filters
	var sidebar := _build_sidebar()
	hbox.add_child(sidebar)

	# Right: card grid in scroll
	var right := VBoxContainer.new()
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right.add_theme_constant_override("separation", 8)
	hbox.add_child(right)

	# Header
	var header := HBoxContainer.new()
	header.add_theme_constant_override("separation", 12)
	var hdr_margin := MarginContainer.new()
	hdr_margin.add_theme_constant_override("margin_top", 12)
	hdr_margin.add_theme_constant_override("margin_left", 16)
	hdr_margin.add_theme_constant_override("margin_right", 16)
	right.add_child(hdr_margin)
	hdr_margin.add_child(header)

	var title := Label.new()
	title.text = "MY COLLECTION"
	title.add_theme_font_size_override("font_size", 22)
	title.add_theme_color_override("font_color", GOLD)
	header.add_child(title)

	_count_label = Label.new()
	_count_label.add_theme_font_size_override("font_size", 13)
	_count_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	_count_label.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	header.add_child(_count_label)

	# Card grid scroll
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
	_grid.add_theme_constant_override("h_separation", 10)
	_grid.add_theme_constant_override("v_separation", 10)
	_grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid_margin.add_child(_grid)

	_refresh_grid()


func _build_sidebar() -> PanelContainer:
	var panel := PanelContainer.new()
	panel.custom_minimum_size.x = 200
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.06, 0.06, 0.12)
	style.content_margin_top = 16
	style.content_margin_bottom = 16
	style.content_margin_left = 14
	style.content_margin_right = 14
	panel.add_theme_stylebox_override("panel", style)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 10)
	panel.add_child(vbox)

	# Filters title
	var ft := Label.new()
	ft.text = "FILTERS"
	ft.add_theme_font_size_override("font_size", 14)
	ft.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8))
	vbox.add_child(ft)

	# Species filter
	var sp_label := Label.new()
	sp_label.text = "Species"
	sp_label.add_theme_font_size_override("font_size", 11)
	sp_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	vbox.add_child(sp_label)

	_add_filter_btn(vbox, "All Species", "", "species")
	for sp in ["gignen", "fae", "stoneheart", "wilderling", "angar", "demar", "creptilis"]:
		_add_filter_btn(vbox, "%s %s" % [SPECIES_EMOJI.get(sp, ""), sp.capitalize()], sp, "species")

	# Rarity filter
	var spacer := Control.new()
	spacer.custom_minimum_size.y = 8
	vbox.add_child(spacer)

	var r_label := Label.new()
	r_label.text = "Rarity"
	r_label.add_theme_font_size_override("font_size", 11)
	r_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	vbox.add_child(r_label)

	_add_filter_btn(vbox, "All Rarities", "", "rarity")
	for r in ["common", "uncommon", "rare", "legend", "myth"]:
		var rc: Color = RARITY_COLORS.get(r, Color.WHITE)
		_add_filter_btn(vbox, r.to_upper(), r, "rarity", rc)

	# Navigation
	var spacer2 := Control.new()
	spacer2.custom_minimum_size.y = 16
	vbox.add_child(spacer2)

	var back_btn := Button.new()
	back_btn.text = "BACK TO MENU"
	back_btn.add_theme_font_size_override("font_size", 12)
	back_btn.custom_minimum_size.y = 36
	var bs := StyleBoxFlat.new()
	bs.bg_color = Color(0.2, 0.2, 0.3)
	bs.corner_radius_top_left = 6
	bs.corner_radius_top_right = 6
	bs.corner_radius_bottom_left = 6
	bs.corner_radius_bottom_right = 6
	back_btn.add_theme_stylebox_override("normal", bs)
	back_btn.pressed.connect(func(): get_tree().change_scene_to_file("res://scenes/menu.tscn"))
	vbox.add_child(back_btn)

	var store_btn := Button.new()
	store_btn.text = "PACK STORE"
	store_btn.add_theme_font_size_override("font_size", 12)
	store_btn.custom_minimum_size.y = 36
	var ss := StyleBoxFlat.new()
	ss.bg_color = Color(0.5, 0.35, 0.1)
	ss.corner_radius_top_left = 6
	ss.corner_radius_top_right = 6
	ss.corner_radius_bottom_left = 6
	ss.corner_radius_bottom_right = 6
	store_btn.add_theme_stylebox_override("normal", ss)
	store_btn.pressed.connect(func(): get_tree().change_scene_to_file("res://scenes/pack_store.tscn"))
	vbox.add_child(store_btn)

	return panel


func _add_filter_btn(parent: VBoxContainer, text: String, value: String, filter_type: String, color: Color = Color(0.7, 0.7, 0.8)) -> void:
	var btn := Button.new()
	btn.text = text
	btn.add_theme_font_size_override("font_size", 10)
	btn.add_theme_color_override("font_color", color)
	btn.custom_minimum_size.y = 24
	btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.1, 0.1, 0.18)
	style.corner_radius_top_left = 4
	style.corner_radius_top_right = 4
	style.corner_radius_bottom_left = 4
	style.corner_radius_bottom_right = 4
	style.content_margin_left = 8
	btn.add_theme_stylebox_override("normal", style)
	var hover := style.duplicate()
	hover.bg_color = Color(0.15, 0.15, 0.25)
	btn.add_theme_stylebox_override("hover", hover)
	btn.pressed.connect(func(): _apply_filter(filter_type, value))
	parent.add_child(btn)


func _apply_filter(filter_type: String, value: String) -> void:
	if filter_type == "species":
		_filter_species = value
	elif filter_type == "rarity":
		_filter_rarity = value
	_refresh_grid()


func _refresh_grid() -> void:
	# Apply filters
	_filtered.clear()
	for card in _cards:
		if _filter_species != "" and card.get("species", "") != _filter_species:
			continue
		if _filter_rarity != "" and card.get("rarity", "") != _filter_rarity:
			continue
		_filtered.append(card)

	_count_label.text = "%d / %d cards" % [_filtered.size(), _cards.size()]

	# Clear grid
	for child in _grid.get_children():
		child.queue_free()

	if _filtered.is_empty():
		var empty := Label.new()
		empty.text = "No cards match your filters."
		empty.add_theme_font_size_override("font_size", 13)
		empty.add_theme_color_override("font_color", Color(0.4, 0.4, 0.5))
		_grid.add_child(empty)
		return

	# Add cards
	for card in _filtered:
		_grid.add_child(_create_card_widget(card))


func _create_card_widget(card: Dictionary) -> PanelContainer:
	var rarity: String = card.get("rarity", "common")
	var rc: Color = RARITY_COLORS.get(rarity, Color(0.5, 0.5, 0.5))
	var glow: float = {"common": 0.0, "uncommon": 0.05, "rare": 0.15, "legend": 0.3, "myth": 0.5}.get(rarity, 0.0)

	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(150, 200)
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.07, 0.07, 0.13).lerp(rc, glow * 0.2)
	style.border_color = rc
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
	style.content_margin_top = 12
	style.content_margin_bottom = 8
	panel.add_theme_stylebox_override("panel", style)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	panel.add_child(vbox)

	# Species emoji
	var emoji := Label.new()
	emoji.text = SPECIES_EMOJI.get(card.get("species", ""), "🃏")
	emoji.add_theme_font_size_override("font_size", 40)
	emoji.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(emoji)

	# Card name
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
	rarity_lbl.add_theme_font_size_override("font_size", 10)
	rarity_lbl.add_theme_color_override("font_color", rc)
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
	dna_lbl.add_theme_font_size_override("font_size", 7)
	dna_lbl.add_theme_color_override("font_color", Color(0.3, 0.3, 0.4))
	dna_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(dna_lbl)

	return panel


func _generate_demo_collection() -> Array:
	var species_list := ["gignen", "fae", "stoneheart", "wilderling", "angar", "demar", "creptilis"]
	var prefixes := ["Shadow", "Iron", "Crystal", "Storm", "Ember", "Frost", "Dawn", "Dusk", "Stone", "Wild",
		"Crimson", "Azure", "Golden", "Silver", "Dark", "Light", "Ancient", "Swift", "Brave", "Fierce"]
	var suffixes := ["blade", "heart", "fang", "claw", "shield", "strike", "spirit", "soul", "wing", "scale",
		"horn", "thorn", "fire", "frost", "stone", "song", "dance", "storm", "guard", "walker"]

	var cards: Array = []
	for i in range(24):
		var sp: String = species_list[randi() % species_list.size()]
		var roll := randf()
		var rarity: String
		if roll < 0.4: rarity = "common"
		elif roll < 0.65: rarity = "uncommon"
		elif roll < 0.85: rarity = "rare"
		elif roll < 0.95: rarity = "legend"
		else: rarity = "myth"

		var dna := ""
		for _j in range(32):
			dna += "0123456789abcdef"[randi() % 16]

		cards.append({
			"name": "%s%s" % [prefixes[randi() % prefixes.size()], suffixes[randi() % suffixes.size()]],
			"species": sp,
			"rarity": rarity,
			"dna": dna,
		})

	# Sort by rarity
	var rarity_order := {"myth": 0, "legend": 1, "rare": 2, "uncommon": 3, "common": 4}
	cards.sort_custom(func(a, b): return rarity_order.get(a["rarity"], 9) < rarity_order.get(b["rarity"], 9))
	return cards
