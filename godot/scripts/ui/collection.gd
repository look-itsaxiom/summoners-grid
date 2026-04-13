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
var _detail_panel: VBoxContainer  # Reserved for future card detail view
var _filter_species: String = ""
var _filter_rarity: String = ""

# Card frame textures by rarity
var _card_frames: Dictionary = {}

# Species sprite textures
var _species_sprites: Dictionary = {}
# Large card art textures (for detail popup)
var _card_art: Dictionary = {}

func _load_card_frames() -> void:
	for r in ["common", "uncommon", "rare", "legend", "myth"]:
		var path := "res://assets/card_frames/%s.png" % r
		if ResourceLoader.exists(path):
			_card_frames[r] = load(path)
	for sp in ["gignen", "fae", "stoneheart", "wilderling", "angar", "demar", "creptilis"]:
		var path := "res://assets/sprites/%s.png" % sp
		if ResourceLoader.exists(path):
			_species_sprites[sp] = load(path)
		var art_path := "res://assets/card_art/%s.png" % sp
		if ResourceLoader.exists(art_path):
			_card_art[sp] = load(art_path)


func _ready() -> void:
	_load_card_frames()
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

	_add_filter_btn(vbox, "All Species (%d)" % _cards.size(), "", "species")
	var sp_counts: Dictionary = {}
	for c in _cards:
		var s: String = c.get("species", "")
		sp_counts[s] = sp_counts.get(s, 0) + 1
	for sp in ["gignen", "fae", "stoneheart", "wilderling", "angar", "demar", "creptilis"]:
		var count: int = sp_counts.get(sp, 0)
		var label_text := "%s %s (%d)" % [SPECIES_EMOJI.get(sp, ""), sp.capitalize(), count]
		_add_filter_btn(vbox, label_text, sp, "species")

	# Rarity filter
	var spacer := Control.new()
	spacer.custom_minimum_size.y = 8
	vbox.add_child(spacer)

	var r_label := Label.new()
	r_label.text = "Rarity"
	r_label.add_theme_font_size_override("font_size", 11)
	r_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	vbox.add_child(r_label)

	var r_counts: Dictionary = {}
	for c in _cards:
		var r2: String = c.get("rarity", "")
		r_counts[r2] = r_counts.get(r2, 0) + 1
	_add_filter_btn(vbox, "All Rarities (%d)" % _cards.size(), "", "rarity")
	for r in ["common", "uncommon", "rare", "legend", "myth"]:
		var rc: Color = RARITY_COLORS.get(r, Color.WHITE)
		var r_count: int = r_counts.get(r, 0)
		_add_filter_btn(vbox, "%s (%d)" % [r.to_upper(), r_count], r, "rarity", rc)

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
	back_btn.pressed.connect(func(): get_node("/root/SceneTransition").change_scene("res://scenes/menu.tscn"))
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
	store_btn.pressed.connect(func(): get_node("/root/SceneTransition").change_scene("res://scenes/pack_store.tscn"))
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

	var rarity_parts: Array[String] = []
	var storage = get_node_or_null("/root/CardStorage")
	if storage:
		var rc: Dictionary = storage.get_rarity_counts()
		for r in ["myth", "legend", "rare", "uncommon", "common"]:
			if rc.has(r) and rc[r] > 0:
				rarity_parts.append("%d %s" % [rc[r], r])
	var breakdown := " · ".join(rarity_parts) if rarity_parts.size() > 0 else ""
	_count_label.text = "%d / %d cards%s" % [_filtered.size(), _cards.size(), ("  (%s)" % breakdown) if breakdown != "" else ""]

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

	# Check if card is new (acquired in last session / recently)
	var is_new := false
	var acquired: String = card.get("acquired_at", "")
	if acquired != "" and acquired.length() >= 10:
		var today := Time.get_date_string_from_system()
		is_new = acquired.begins_with(today)

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

	# Card frame background image
	if rarity in _card_frames and _card_frames[rarity] != null:
		var frame_tex: TextureRect = TextureRect.new()
		frame_tex.texture = _card_frames[rarity]
		frame_tex.expand_mode = TextureRect.EXPAND_FIT_WIDTH_PROPORTIONAL
		frame_tex.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		frame_tex.set_anchors_preset(Control.PRESET_FULL_RECT)
		frame_tex.modulate = Color(1, 1, 1, 0.3)  # Subtle background
		frame_tex.mouse_filter = Control.MOUSE_FILTER_IGNORE
		panel.add_child(frame_tex)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	panel.add_child(vbox)

	# Species art (sprite if available, emoji fallback)
	var sp: String = card.get("species", "")
	if sp in _species_sprites and _species_sprites[sp] != null:
		var sprite := TextureRect.new()
		sprite.texture = _species_sprites[sp]
		sprite.custom_minimum_size = Vector2(60, 60)
		sprite.expand_mode = TextureRect.EXPAND_FIT_WIDTH_PROPORTIONAL
		sprite.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		sprite.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		vbox.add_child(sprite)
	else:
		var emoji := Label.new()
		emoji.text = SPECIES_EMOJI.get(sp, "🃏")
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

	# Power level (if available)
	var power: int = card.get("power", 0)
	if power > 0:
		var power_lbl := Label.new()
		power_lbl.text = "⚡ %d" % power
		power_lbl.add_theme_font_size_override("font_size", 10)
		var power_color := Color(0.5, 0.5, 0.6)
		if power >= 110: power_color = Color(0.85, 0.2, 0.85)
		elif power >= 95: power_color = Color(1.0, 0.75, 0.0)
		elif power >= 80: power_color = Color(0.3, 0.5, 0.9)
		power_lbl.add_theme_color_override("font_color", power_color)
		power_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(power_lbl)
	else:
		# DNA fallback
		var dna_lbl := Label.new()
		dna_lbl.text = card.get("dna", "").substr(0, 16)
		dna_lbl.add_theme_font_size_override("font_size", 7)
		dna_lbl.add_theme_color_override("font_color", Color(0.3, 0.3, 0.4))
		dna_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(dna_lbl)

	# "NEW" badge for recently acquired cards
	if is_new:
		var badge := Label.new()
		badge.text = "NEW"
		badge.add_theme_font_size_override("font_size", 9)
		badge.add_theme_color_override("font_color", Color(1.0, 0.3, 0.3))
		badge.position = Vector2(4, 2)
		panel.add_child(badge)

	# Make clickable
	var click_btn := Button.new()
	click_btn.set_anchors_preset(Control.PRESET_FULL_RECT)
	click_btn.flat = true
	click_btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	click_btn.pressed.connect(func(): _show_card_detail(card))
	panel.add_child(click_btn)

	return panel


func _show_card_detail(card: Dictionary) -> void:
	var rarity: String = card.get("rarity", "common")
	var rc: Color = RARITY_COLORS.get(rarity, Color(0.5, 0.5, 0.5))

	# Overlay
	var overlay := ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.8)
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(overlay)

	# Click overlay to dismiss
	var dismiss := Button.new()
	dismiss.set_anchors_preset(Control.PRESET_FULL_RECT)
	dismiss.flat = true
	dismiss.pressed.connect(func(): overlay.queue_free())
	overlay.add_child(dismiss)

	# Detail panel
	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.grow_horizontal = Control.GROW_DIRECTION_BOTH
	panel.grow_vertical = Control.GROW_DIRECTION_BOTH
	panel.custom_minimum_size = Vector2(400, 450)
	panel.position = Vector2(440, 100)
	var ps := StyleBoxFlat.new()
	ps.bg_color = Color(0.06, 0.06, 0.12)
	ps.border_color = rc
	ps.border_width_top = 3
	ps.border_width_bottom = 3
	ps.border_width_left = 3
	ps.border_width_right = 3
	ps.corner_radius_top_left = 12
	ps.corner_radius_top_right = 12
	ps.corner_radius_bottom_left = 12
	ps.corner_radius_bottom_right = 12
	ps.content_margin_left = 24
	ps.content_margin_right = 24
	ps.content_margin_top = 20
	ps.content_margin_bottom = 16
	panel.add_theme_stylebox_override("panel", ps)
	overlay.add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)
	panel.add_child(vbox)

	# Species art — use large card art if available, else sprite
	var sp: String = card.get("species", "")
	if sp in _card_art and _card_art[sp] != null:
		var art := TextureRect.new()
		art.texture = _card_art[sp]
		art.custom_minimum_size = Vector2(150, 220)
		art.expand_mode = TextureRect.EXPAND_FIT_WIDTH_PROPORTIONAL
		art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		art.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		vbox.add_child(art)
	elif sp in _species_sprites and _species_sprites[sp] != null:
		var sprite := TextureRect.new()
		sprite.texture = _species_sprites[sp]
		sprite.custom_minimum_size = Vector2(80, 80)
		sprite.expand_mode = TextureRect.EXPAND_FIT_WIDTH_PROPORTIONAL
		sprite.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		sprite.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		vbox.add_child(sprite)

	# Name
	var name_lbl := Label.new()
	name_lbl.text = card.get("name", "?")
	name_lbl.add_theme_font_size_override("font_size", 22)
	name_lbl.add_theme_color_override("font_color", Color.WHITE)
	name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(name_lbl)

	# Rarity + Species
	var info_lbl := Label.new()
	info_lbl.text = "%s  ·  %s" % [rarity.to_upper(), sp.capitalize()]
	info_lbl.add_theme_font_size_override("font_size", 13)
	info_lbl.add_theme_color_override("font_color", rc)
	info_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(info_lbl)

	# Power
	var power: int = card.get("power", 0)
	if power > 0:
		var power_lbl := Label.new()
		power_lbl.text = "⚡ Power: %d" % power
		power_lbl.add_theme_font_size_override("font_size", 16)
		power_lbl.add_theme_color_override("font_color", GOLD)
		power_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(power_lbl)

	# Stats grid
	var stats: Dictionary = card.get("stats", {})
	if not stats.is_empty():
		var divider := ColorRect.new()
		divider.color = Color(0.3, 0.25, 0.5, 0.4)
		divider.custom_minimum_size = Vector2(0, 1)
		vbox.add_child(divider)

		var stats_title := Label.new()
		stats_title.text = "STATS"
		stats_title.add_theme_font_size_override("font_size", 11)
		stats_title.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
		stats_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(stats_title)

		var stats_grid := GridContainer.new()
		stats_grid.columns = 3
		stats_grid.add_theme_constant_override("h_separation", 16)
		stats_grid.add_theme_constant_override("v_separation", 4)
		stats_grid.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		vbox.add_child(stats_grid)

		for key in ["STR", "END", "DEF", "INT", "SPI", "MDF", "SPD", "ACC", "LCK"]:
			var val: int = stats.get(key, 0)
			var stat_lbl := Label.new()
			stat_lbl.text = "%s %d" % [key, val]
			stat_lbl.add_theme_font_size_override("font_size", 12)
			var stat_color := Color(0.6, 0.7, 0.8)
			if val >= 12: stat_color = Color(0.3, 0.8, 0.3)
			if val >= 15: stat_color = Color(1.0, 0.75, 0.0)
			stat_lbl.add_theme_color_override("font_color", stat_color)
			stats_grid.add_child(stat_lbl)

	# DNA
	var dna_lbl := Label.new()
	dna_lbl.text = "DNA: %s" % card.get("dna", "")
	dna_lbl.add_theme_font_size_override("font_size", 8)
	dna_lbl.add_theme_color_override("font_color", Color(0.3, 0.3, 0.4))
	dna_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(dna_lbl)

	# Dismiss hint
	var hint := Label.new()
	hint.text = "Click anywhere to close"
	hint.add_theme_font_size_override("font_size", 10)
	hint.add_theme_color_override("font_color", Color(0.35, 0.35, 0.45))
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(hint)


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
