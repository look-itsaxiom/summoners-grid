extends Control
## Match history screen — shows recent match results and win/loss stats.

const BG_COLOR := Color(0.05, 0.05, 0.1)
const GOLD := Color(1.0, 0.85, 0.0)

@onready var _settings = get_node("/root/Settings")


func _ready() -> void:
	_build_ui()


func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = BG_COLOR
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_top", 40)
	margin.add_theme_constant_override("margin_bottom", 40)
	margin.add_theme_constant_override("margin_left", 200)
	margin.add_theme_constant_override("margin_right", 200)
	add_child(margin)

	var outer := VBoxContainer.new()
	outer.add_theme_constant_override("separation", 12)
	outer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	outer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	margin.add_child(outer)

	# Title
	var title := Label.new()
	title.text = "Match History"
	title.add_theme_font_size_override("font_size", 28)
	title.add_theme_color_override("font_color", GOLD)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	outer.add_child(title)

	# Stats summary
	var stats := Label.new()
	stats.text = _settings.get_stats_text()
	stats.add_theme_font_size_override("font_size", 14)
	stats.add_theme_color_override("font_color", Color(0.7, 0.8, 0.9))
	stats.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	outer.add_child(stats)

	# Column headers
	var header := HBoxContainer.new()
	header.add_theme_constant_override("separation", 0)
	outer.add_child(header)
	_add_header_cell(header, "Result", 100)
	_add_header_cell(header, "Mode", 120)
	_add_header_cell(header, "Turns", 80)
	_add_header_cell(header, "Date", 200)

	# Scrollable match list
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.custom_minimum_size.y = 300
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	outer.add_child(scroll)

	var list := VBoxContainer.new()
	list.add_theme_constant_override("separation", 2)
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.add_child(list)

	# Show matches in reverse chronological order
	var matches: Array = _settings.match_history.duplicate()
	matches.reverse()

	if matches.is_empty():
		var empty := Label.new()
		empty.text = "No matches played yet. Go battle some AI!"
		empty.add_theme_font_size_override("font_size", 13)
		empty.add_theme_color_override("font_color", Color(0.4, 0.4, 0.5))
		empty.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		list.add_child(empty)
	else:
		for i in range(matches.size()):
			var entry: Dictionary = matches[i]
			var row := _build_match_row(entry, i)
			list.add_child(row)

	# Back button
	var spacer := Control.new()
	spacer.custom_minimum_size.y = 8
	outer.add_child(spacer)

	var back_btn := Button.new()
	back_btn.text = "Back to Menu"
	back_btn.custom_minimum_size = Vector2(200, 42)
	back_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	back_btn.add_theme_font_size_override("font_size", 15)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.2, 0.2, 0.35)
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	back_btn.add_theme_stylebox_override("normal", style)
	var hover := style.duplicate()
	hover.bg_color = style.bg_color.lightened(0.15)
	back_btn.add_theme_stylebox_override("hover", hover)
	back_btn.pressed.connect(func(): get_node("/root/SceneTransition").change_scene("res://scenes/menu.tscn"))
	outer.add_child(back_btn)


func _add_header_cell(parent: HBoxContainer, text: String, width: int) -> void:
	var label := Label.new()
	label.text = text
	label.custom_minimum_size.x = width
	label.add_theme_font_size_override("font_size", 11)
	label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	parent.add_child(label)


func _build_match_row(entry: Dictionary, index: int) -> PanelContainer:
	var panel := PanelContainer.new()
	var ps := StyleBoxFlat.new()
	ps.bg_color = Color(0.08, 0.08, 0.14) if index % 2 == 0 else Color(0.06, 0.06, 0.11)
	ps.content_margin_left = 8
	ps.content_margin_right = 8
	ps.content_margin_top = 6
	ps.content_margin_bottom = 6
	panel.add_theme_stylebox_override("panel", ps)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 0)
	panel.add_child(row)

	# Result
	var winner: String = entry.get("winner", "")
	var is_win: bool = winner == "playerA"
	var result_label := Label.new()
	result_label.text = "WIN" if is_win else "LOSS"
	result_label.custom_minimum_size.x = 100
	result_label.add_theme_font_size_override("font_size", 13)
	result_label.add_theme_color_override("font_color", Color(0.3, 0.9, 0.3) if is_win else Color(0.9, 0.3, 0.3))
	row.add_child(result_label)

	# Mode
	var mode: String = entry.get("mode", "standard")
	var mode_label := Label.new()
	mode_label.text = mode.capitalize()
	mode_label.custom_minimum_size.x = 120
	mode_label.add_theme_font_size_override("font_size", 12)
	mode_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7))
	row.add_child(mode_label)

	# Turns
	var turns: int = entry.get("turns", 0)
	var turns_label := Label.new()
	turns_label.text = "%d turns" % turns
	turns_label.custom_minimum_size.x = 80
	turns_label.add_theme_font_size_override("font_size", 12)
	turns_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7))
	row.add_child(turns_label)

	# Date
	var date: String = entry.get("date", "")
	var date_label := Label.new()
	date_label.text = date
	date_label.custom_minimum_size.x = 200
	date_label.add_theme_font_size_override("font_size", 11)
	date_label.add_theme_color_override("font_color", Color(0.4, 0.4, 0.5))
	row.add_child(date_label)

	return panel
