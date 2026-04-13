extends Control
## Settings screen — toggle audio, visuals, and gameplay options.

const BG_COLOR := Color(0.05, 0.05, 0.1)
const GOLD := Color(1.0, 0.85, 0.0)

@onready var _settings = get_node("/root/Settings")

var _sound_toggle: CheckButton
var _volume_slider: HSlider
var _shake_toggle: CheckButton
var _numbers_toggle: CheckButton


func _ready() -> void:
	_build_ui()


func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = BG_COLOR
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_top", 60)
	margin.add_theme_constant_override("margin_bottom", 60)
	margin.add_theme_constant_override("margin_left", 300)
	margin.add_theme_constant_override("margin_right", 300)
	add_child(margin)

	var center := VBoxContainer.new()
	center.add_theme_constant_override("separation", 16)
	center.alignment = BoxContainer.ALIGNMENT_CENTER
	center.size_flags_vertical = Control.SIZE_EXPAND_FILL
	center.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	margin.add_child(center)

	# Title
	var title := Label.new()
	title.text = "Settings"
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", GOLD)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(title)

	var spacer := Control.new()
	spacer.custom_minimum_size.y = 8
	center.add_child(spacer)

	# ── Audio Section ──
	_add_section_header(center, "AUDIO")

	# Sound enabled
	var sound_row := _add_toggle_row(center, "Sound Effects & Music")
	_sound_toggle = sound_row
	_sound_toggle.button_pressed = _settings.sound_enabled
	_sound_toggle.toggled.connect(func(on: bool):
		_settings.sound_enabled = on
		_settings._apply_audio()
		_settings.save_settings()
	)

	# Volume
	var vol_label := Label.new()
	vol_label.text = "Volume"
	vol_label.add_theme_font_size_override("font_size", 13)
	vol_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8))
	center.add_child(vol_label)

	_volume_slider = HSlider.new()
	_volume_slider.min_value = 0.0
	_volume_slider.max_value = 1.0
	_volume_slider.step = 0.05
	_volume_slider.value = _settings.sound_volume
	_volume_slider.custom_minimum_size = Vector2(0, 24)
	_volume_slider.value_changed.connect(func(val: float):
		_settings.sound_volume = val
		_settings._apply_audio()
		_settings.save_settings()
	)
	center.add_child(_volume_slider)

	var spacer2 := Control.new()
	spacer2.custom_minimum_size.y = 4
	center.add_child(spacer2)

	# ── Gameplay Section ──
	_add_section_header(center, "GAMEPLAY")

	# Screen shake
	var shake_row := _add_toggle_row(center, "Screen Shake")
	_shake_toggle = shake_row
	_shake_toggle.button_pressed = _settings.screen_shake_enabled
	_shake_toggle.toggled.connect(func(on: bool):
		_settings.screen_shake_enabled = on
		_settings.save_settings()
	)

	# Damage numbers
	var numbers_row := _add_toggle_row(center, "Floating Damage Numbers")
	_numbers_toggle = numbers_row
	_numbers_toggle.button_pressed = _settings.show_damage_numbers
	_numbers_toggle.toggled.connect(func(on: bool):
		_settings.show_damage_numbers = on
		_settings.save_settings()
	)

	# AI Difficulty
	var diff_label := Label.new()
	diff_label.text = "AI Difficulty"
	diff_label.add_theme_font_size_override("font_size", 13)
	diff_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8))
	center.add_child(diff_label)

	var diff_row := HBoxContainer.new()
	diff_row.add_theme_constant_override("separation", 8)
	diff_row.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(diff_row)

	var diff_names := ["Easy", "Normal", "Hard"]
	var diff_colors := [Color(0.3, 0.5, 0.2), Color(0.4, 0.35, 0.15), Color(0.5, 0.15, 0.15)]
	for di in range(3):
		var dbtn := Button.new()
		dbtn.text = diff_names[di]
		dbtn.custom_minimum_size = Vector2(80, 32)
		dbtn.add_theme_font_size_override("font_size", 12)
		var ds := StyleBoxFlat.new()
		ds.bg_color = diff_colors[di] if _settings.ai_difficulty == di else Color(0.15, 0.15, 0.2)
		ds.corner_radius_top_left = 4
		ds.corner_radius_top_right = 4
		ds.corner_radius_bottom_left = 4
		ds.corner_radius_bottom_right = 4
		dbtn.add_theme_stylebox_override("normal", ds)
		var diff_idx: int = di
		var all_btns: Array = []
		dbtn.pressed.connect(func():
			_settings.ai_difficulty = diff_idx
			_settings.save_settings()
			# Update button styles
			for child in diff_row.get_children():
				if child is Button:
					var idx: int = child.get_index()
					var st: StyleBoxFlat = StyleBoxFlat.new()
					st.bg_color = diff_colors[idx] if idx == diff_idx else Color(0.15, 0.15, 0.2)
					st.corner_radius_top_left = 4
					st.corner_radius_top_right = 4
					st.corner_radius_bottom_left = 4
					st.corner_radius_bottom_right = 4
					child.add_theme_stylebox_override("normal", st)
		)
		diff_row.add_child(dbtn)

	var spacer_acc := Control.new()
	spacer_acc.custom_minimum_size.y = 4
	center.add_child(spacer_acc)

	# ── Accessibility Section ──
	_add_section_header(center, "ACCESSIBILITY")

	# Color blind mode
	var cb_row := _add_toggle_row(center, "Color Blind Mode (Blue/Orange)")
	cb_row.button_pressed = _settings.color_blind_mode
	cb_row.toggled.connect(func(on: bool):
		_settings.color_blind_mode = on
		_settings.save_settings()
	)

	var spacer3 := Control.new()
	spacer3.custom_minimum_size.y = 8
	center.add_child(spacer3)

	# ── Achievements Section ──
	var achv = get_node_or_null("/root/Achievements")
	if achv:
		_add_section_header(center, "ACHIEVEMENTS")
		var achv_progress := Label.new()
		achv_progress.text = achv.get_progress_text()
		achv_progress.add_theme_font_size_override("font_size", 13)
		achv_progress.add_theme_color_override("font_color", Color(1.0, 0.85, 0.0))
		achv_progress.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		center.add_child(achv_progress)

		var achv_list := Label.new()
		var lines: Array[String] = []
		for a in achv.get_all():
			var icon: String = "+" if a["unlocked"] else "-"
			lines.append("%s %s — %s (%d coins)" % [icon, a["name"], a["description"], a["reward"]])
		achv_list.text = "\n".join(lines)
		achv_list.add_theme_font_size_override("font_size", 10)
		achv_list.add_theme_color_override("font_color", Color(0.5, 0.55, 0.65))
		center.add_child(achv_list)

	# ── Stats Section ──
	_add_section_header(center, "MATCH STATS")

	var stats := Label.new()
	stats.text = _settings.get_stats_text()
	stats.add_theme_font_size_override("font_size", 13)
	stats.add_theme_color_override("font_color", Color(0.6, 0.7, 0.8))
	stats.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(stats)

	var spacer4 := Control.new()
	spacer4.custom_minimum_size.y = 8
	center.add_child(spacer4)

	# Back button
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
	center.add_child(back_btn)


func _add_section_header(parent: VBoxContainer, text: String) -> void:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", 11)
	label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	parent.add_child(label)


func _add_toggle_row(parent: VBoxContainer, text: String) -> CheckButton:
	var toggle := CheckButton.new()
	toggle.text = text
	toggle.add_theme_font_size_override("font_size", 13)
	toggle.add_theme_color_override("font_color", Color(0.8, 0.8, 0.9))
	toggle.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	parent.add_child(toggle)
	return toggle


