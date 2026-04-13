extends Control
## In-game Pack Store — buy and open card packs.
## Connects to API backend via ApiClient autoload.

const BG_COLOR := Color(0.05, 0.05, 0.1)
const GOLD := Color(1.0, 0.85, 0.0)

var _api: Node
var _is_opening := false
var _result_container: VBoxContainer
var _status_label: Label


func _ready() -> void:
	_api = get_node("/root/ApiClient")
	# Dev mode: auto-login with test wallet
	if not _api.is_authenticated():
		_api.set_auth("0xdev_" + str(Time.get_unix_time_from_system()).md5_text().substr(0, 40))
	_build_ui()


func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = BG_COLOR
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var scroll := ScrollContainer.new()
	scroll.set_anchors_preset(Control.PRESET_FULL_RECT)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	add_child(scroll)

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_top", 20)
	margin.add_theme_constant_override("margin_bottom", 30)
	margin.add_theme_constant_override("margin_left", 60)
	margin.add_theme_constant_override("margin_right", 60)
	margin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(margin)

	var main := VBoxContainer.new()
	main.add_theme_constant_override("separation", 16)
	main.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	margin.add_child(main)

	# Title
	var title := Label.new()
	title.text = "PACK STORE"
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", GOLD)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	main.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "Buy card packs to build your collection"
	subtitle.add_theme_font_size_override("font_size", 12)
	subtitle.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7))
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	main.add_child(subtitle)

	# Status
	_status_label = Label.new()
	_status_label.text = ""
	_status_label.add_theme_font_size_override("font_size", 12)
	_status_label.add_theme_color_override("font_color", Color(0.5, 0.8, 0.5))
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	main.add_child(_status_label)

	# Pack cards
	var packs := HBoxContainer.new()
	packs.add_theme_constant_override("separation", 24)
	packs.alignment = BoxContainer.ALIGNMENT_CENTER
	main.add_child(packs)

	_add_pack_card(packs, "Standard Pack", "5 cards\nGuaranteed Uncommon+\nGuaranteed Rare+", "$3.00", Color(0.3, 0.5, 0.7), "standard")
	_add_pack_card(packs, "Premium Pack", "10 cards\nGuaranteed Rare+\nGuaranteed Legend+", "$10.00", Color(0.7, 0.6, 0.3), "premium")

	# Divider
	var divider := ColorRect.new()
	divider.color = Color(0.3, 0.25, 0.5, 0.4)
	divider.custom_minimum_size = Vector2(0, 1)
	main.add_child(divider)

	# Result area
	var result_label := Label.new()
	result_label.text = "OPENED CARDS"
	result_label.add_theme_font_size_override("font_size", 14)
	result_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8))
	main.add_child(result_label)

	_result_container = VBoxContainer.new()
	_result_container.add_theme_constant_override("separation", 8)
	main.add_child(_result_container)

	var placeholder := Label.new()
	placeholder.text = "Buy a pack to see your new cards here!"
	placeholder.add_theme_font_size_override("font_size", 11)
	placeholder.add_theme_color_override("font_color", Color(0.4, 0.4, 0.5))
	placeholder.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_result_container.add_child(placeholder)

	# Buttons
	var spacer := Control.new()
	spacer.custom_minimum_size.y = 8
	main.add_child(spacer)

	var btn_row := HBoxContainer.new()
	btn_row.add_theme_constant_override("separation", 16)
	btn_row.alignment = BoxContainer.ALIGNMENT_CENTER
	main.add_child(btn_row)

	_add_nav_button(btn_row, "MY COLLECTION", Color(0.3, 0.5, 0.3), func():
		get_tree().change_scene_to_file("res://scenes/collection.tscn"))
	_add_nav_button(btn_row, "BACK TO MENU", Color(0.3, 0.3, 0.45), func():
		get_tree().change_scene_to_file("res://scenes/menu.tscn"))


func _add_pack_card(parent: HBoxContainer, title_text: String, desc_text: String, price: String, color: Color, pack_type: String) -> void:
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(260, 200)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.08, 0.08, 0.14)
	style.border_color = color
	style.border_width_top = 2
	style.border_width_bottom = 2
	style.border_width_left = 2
	style.border_width_right = 2
	style.corner_radius_top_left = 10
	style.corner_radius_top_right = 10
	style.corner_radius_bottom_left = 10
	style.corner_radius_bottom_right = 10
	style.content_margin_left = 20
	style.content_margin_right = 20
	style.content_margin_top = 16
	style.content_margin_bottom = 16
	panel.add_theme_stylebox_override("panel", style)
	parent.add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)
	panel.add_child(vbox)

	var t := Label.new()
	t.text = title_text
	t.add_theme_font_size_override("font_size", 18)
	t.add_theme_color_override("font_color", color)
	vbox.add_child(t)

	var d := Label.new()
	d.text = desc_text
	d.add_theme_font_size_override("font_size", 11)
	d.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7))
	vbox.add_child(d)

	var p := Label.new()
	p.text = price
	p.add_theme_font_size_override("font_size", 24)
	p.add_theme_color_override("font_color", Color.WHITE)
	vbox.add_child(p)

	var buy_btn := Button.new()
	buy_btn.text = "BUY PACK"
	buy_btn.custom_minimum_size = Vector2(0, 38)
	buy_btn.add_theme_font_size_override("font_size", 14)
	var btn_style := StyleBoxFlat.new()
	btn_style.bg_color = color
	btn_style.corner_radius_top_left = 6
	btn_style.corner_radius_top_right = 6
	btn_style.corner_radius_bottom_left = 6
	btn_style.corner_radius_bottom_right = 6
	btn_style.content_margin_top = 8
	btn_style.content_margin_bottom = 8
	buy_btn.add_theme_stylebox_override("normal", btn_style)
	var hover := btn_style.duplicate()
	hover.bg_color = color.lightened(0.15)
	buy_btn.add_theme_stylebox_override("hover", hover)
	buy_btn.pressed.connect(func(): _buy_pack(pack_type))
	vbox.add_child(buy_btn)


func _buy_pack(pack_type: String) -> void:
	if _is_opening:
		return
	_is_opening = true
	_status_label.text = "Opening pack..."
	_status_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.5))

	var result: Dictionary = await _api.open_pack(pack_type)

	_is_opening = false

	if not result.get("success", false):
		_status_label.text = "Failed to open pack: %s" % result.get("error", "Unknown error")
		_status_label.add_theme_color_override("font_color", Color(1.0, 0.3, 0.3))
		return

	# Transition to the pack opening ceremony
	var opening_scene = load("res://scenes/pack_opening.tscn")
	var opening = opening_scene.instantiate()
	opening.pack_data = result
	get_tree().root.add_child(opening)
	queue_free()  # Remove pack store


func _add_nav_button(parent: HBoxContainer, text: String, color: Color, callback: Callable) -> void:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(160, 42)
	btn.add_theme_font_size_override("font_size", 14)
	btn.pressed.connect(callback)
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	btn.add_theme_stylebox_override("normal", style)
	var hover := style.duplicate()
	hover.bg_color = color.lightened(0.15)
	btn.add_theme_stylebox_override("hover", hover)
	parent.add_child(btn)
