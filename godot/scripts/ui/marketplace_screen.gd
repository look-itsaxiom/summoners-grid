extends Control
## Marketplace screen — browse and buy cards from other players.

const BG_COLOR := Color(0.05, 0.05, 0.1)
const GOLD := Color(1.0, 0.85, 0.0)

@onready var _mp = get_node("/root/Marketplace")
@onready var _storage = get_node("/root/CardStorage")
var _list_container: VBoxContainer
var _coins_label: Label
var _species_sprites: Dictionary = {}


func _ready() -> void:
	for sp in ["gignen", "fae", "stoneheart", "wilderling", "angar", "demar", "creptilis"]:
		var path := "res://assets/sprites/%s.png" % sp
		if ResourceLoader.exists(path):
			_species_sprites[sp] = load(path)
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
	margin.add_theme_constant_override("margin_left", 80)
	margin.add_theme_constant_override("margin_right", 80)
	add_child(margin)

	var outer := VBoxContainer.new()
	outer.add_theme_constant_override("separation", 10)
	outer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	margin.add_child(outer)

	# Header
	var header_row := HBoxContainer.new()
	header_row.add_theme_constant_override("separation", 20)
	outer.add_child(header_row)

	var title := Label.new()
	title.text = "MARKETPLACE"
	title.add_theme_font_size_override("font_size", 26)
	title.add_theme_color_override("font_color", GOLD)
	header_row.add_child(title)

	_coins_label = Label.new()
	_coins_label.text = "%d coins" % _storage.get_coins()
	_coins_label.add_theme_font_size_override("font_size", 16)
	_coins_label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.0))
	_coins_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_coins_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	header_row.add_child(_coins_label)

	var subtitle := Label.new()
	subtitle.text = "Buy and sell cards. 5% listing fee. 10% transaction fee on sales."
	subtitle.add_theme_font_size_override("font_size", 11)
	subtitle.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	outer.add_child(subtitle)

	# Tab buttons
	var tab_row := HBoxContainer.new()
	tab_row.add_theme_constant_override("separation", 8)
	outer.add_child(tab_row)

	var browse_btn := Button.new()
	browse_btn.text = "Browse All"
	browse_btn.custom_minimum_size = Vector2(120, 30)
	browse_btn.add_theme_font_size_override("font_size", 12)
	var bb_style := StyleBoxFlat.new()
	bb_style.bg_color = Color(0.3, 0.25, 0.1)
	bb_style.corner_radius_top_left = 4
	bb_style.corner_radius_top_right = 4
	browse_btn.add_theme_stylebox_override("normal", bb_style)
	browse_btn.pressed.connect(func(): _refresh_listings())
	tab_row.add_child(browse_btn)

	var my_btn := Button.new()
	my_btn.text = "My Listings"
	my_btn.custom_minimum_size = Vector2(120, 30)
	my_btn.add_theme_font_size_override("font_size", 12)
	var mb_style := StyleBoxFlat.new()
	mb_style.bg_color = Color(0.15, 0.15, 0.25)
	mb_style.corner_radius_top_left = 4
	mb_style.corner_radius_top_right = 4
	my_btn.add_theme_stylebox_override("normal", mb_style)
	my_btn.pressed.connect(func(): _refresh_listings(true))
	tab_row.add_child(my_btn)

	# Fee summary
	var fee_info := Label.new()
	fee_info.text = "Fees collected: %d coins" % _mp.total_fees_collected
	fee_info.add_theme_font_size_override("font_size", 10)
	fee_info.add_theme_color_override("font_color", Color(0.4, 0.4, 0.5))
	fee_info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	fee_info.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	tab_row.add_child(fee_info)

	# Scroll area for listings
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.custom_minimum_size.y = 380
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	outer.add_child(scroll)

	_list_container = VBoxContainer.new()
	_list_container.add_theme_constant_override("separation", 4)
	_list_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(_list_container)

	_refresh_listings()

	# Bottom buttons
	var btn_row := HBoxContainer.new()
	btn_row.add_theme_constant_override("separation", 12)
	btn_row.alignment = BoxContainer.ALIGNMENT_CENTER
	outer.add_child(btn_row)

	_add_btn(btn_row, "Sell a Card", Color(0.5, 0.3, 0.15), func(): get_node("/root/SceneTransition").change_scene("res://scenes/collection.tscn"))
	_add_btn(btn_row, "Back to Menu", Color(0.2, 0.2, 0.35), func(): get_node("/root/SceneTransition").change_scene("res://scenes/menu.tscn"))


func _refresh_listings(my_only: bool = false) -> void:
	for child in _list_container.get_children():
		child.queue_free()

	var sorted: Array = _mp.get_listings_sorted()
	if my_only:
		sorted = sorted.filter(func(l): return l.get("seller", "") == "you")
	if sorted.is_empty():
		var empty := Label.new()
		empty.text = "No cards for sale. Check back later!"
		empty.add_theme_font_size_override("font_size", 13)
		empty.add_theme_color_override("font_color", Color(0.4, 0.4, 0.5))
		empty.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		_list_container.add_child(empty)
		return

	for i in range(sorted.size()):
		var listing: Dictionary = sorted[i]
		# Find original index in mp.listings
		var orig_idx: int = _mp.listings.find(listing)
		_list_container.add_child(_build_listing_row(listing, orig_idx, i))


func _build_listing_row(listing: Dictionary, orig_index: int, display_index: int) -> PanelContainer:
	var card: Dictionary = listing.get("card", {})
	var price: int = listing.get("price", 0)
	var featured: bool = listing.get("featured", false)
	var seller: String = listing.get("seller", "?")
	var rarity: String = card.get("rarity", "common")

	var panel := PanelContainer.new()
	var ps := StyleBoxFlat.new()
	if featured:
		ps.bg_color = Color(0.12, 0.1, 0.06)
		ps.border_color = Color(1.0, 0.85, 0.0, 0.4)
		ps.border_width_top = 1
		ps.border_width_bottom = 1
		ps.border_width_left = 1
		ps.border_width_right = 1
	else:
		ps.bg_color = Color(0.08, 0.08, 0.14) if display_index % 2 == 0 else Color(0.06, 0.06, 0.11)
	ps.content_margin_left = 10
	ps.content_margin_right = 10
	ps.content_margin_top = 8
	ps.content_margin_bottom = 8
	ps.corner_radius_top_left = 4
	ps.corner_radius_top_right = 4
	ps.corner_radius_bottom_left = 4
	ps.corner_radius_bottom_right = 4
	panel.add_theme_stylebox_override("panel", ps)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	panel.add_child(row)

	# Species sprite
	var sp: String = card.get("species", "")
	if sp in _species_sprites:
		var sprite := TextureRect.new()
		sprite.texture = _species_sprites[sp]
		sprite.custom_minimum_size = Vector2(32, 32)
		sprite.expand_mode = TextureRect.EXPAND_FIT_WIDTH_PROPORTIONAL
		sprite.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		row.add_child(sprite)

	# Card info
	var info := VBoxContainer.new()
	info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(info)

	var name_label := Label.new()
	var featured_tag: String = " [FEATURED]" if featured else ""
	name_label.text = "%s%s" % [card.get("name", "?"), featured_tag]
	name_label.add_theme_font_size_override("font_size", 13)
	name_label.add_theme_color_override("font_color", Color.WHITE if not featured else GOLD)
	info.add_child(name_label)

	var rarity_colors := {"common": Color(0.5, 0.5, 0.5), "uncommon": Color(0.3, 0.7, 0.3), "rare": Color(0.3, 0.5, 0.9), "legend": Color(0.9, 0.7, 0.1), "myth": Color(0.8, 0.3, 0.9)}
	var detail := Label.new()
	detail.text = "%s · %s · Power %d" % [rarity.to_upper(), sp.capitalize(), card.get("power", 0)]
	detail.add_theme_font_size_override("font_size", 10)
	detail.add_theme_color_override("font_color", rarity_colors.get(rarity, Color(0.5, 0.5, 0.5)))
	info.add_child(detail)

	# Price
	var price_label := Label.new()
	price_label.text = "%d coins" % price
	price_label.add_theme_font_size_override("font_size", 16)
	price_label.add_theme_color_override("font_color", GOLD)
	price_label.custom_minimum_size.x = 120
	row.add_child(price_label)

	# Buy/Cancel button
	if seller == "you":
		var cancel_btn := Button.new()
		cancel_btn.text = "Cancel"
		cancel_btn.custom_minimum_size = Vector2(80, 30)
		cancel_btn.add_theme_font_size_override("font_size", 11)
		var cs := StyleBoxFlat.new()
		cs.bg_color = Color(0.4, 0.2, 0.2)
		cs.corner_radius_top_left = 4
		cs.corner_radius_top_right = 4
		cs.corner_radius_bottom_left = 4
		cs.corner_radius_bottom_right = 4
		cancel_btn.add_theme_stylebox_override("normal", cs)
		cancel_btn.pressed.connect(func():
			_mp.cancel_listing(orig_index)
			_refresh_listings()
			_coins_label.text = "%d coins" % _storage.get_coins()
		)
		row.add_child(cancel_btn)
	else:
		var can_afford: bool = _storage.get_coins() >= price
		var buy_btn := Button.new()
		buy_btn.text = "BUY" if can_afford else "Can't afford"
		buy_btn.custom_minimum_size = Vector2(90, 30)
		buy_btn.add_theme_font_size_override("font_size", 12)
		buy_btn.disabled = not can_afford
		var bs := StyleBoxFlat.new()
		bs.bg_color = Color(0.2, 0.5, 0.3) if can_afford else Color(0.2, 0.2, 0.25)
		bs.corner_radius_top_left = 4
		bs.corner_radius_top_right = 4
		bs.corner_radius_bottom_left = 4
		bs.corner_radius_bottom_right = 4
		buy_btn.add_theme_stylebox_override("normal", bs)
		if can_afford:
			buy_btn.pressed.connect(func():
				_mp.buy_listing(orig_index)
				_refresh_listings()
				_coins_label.text = "%d coins" % _storage.get_coins()
			)
		row.add_child(buy_btn)

	return panel


func _add_btn(parent: HBoxContainer, text: String, color: Color, callback: Callable) -> void:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(160, 42)
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
	parent.add_child(btn)
