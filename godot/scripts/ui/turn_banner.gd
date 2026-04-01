extends ColorRect
## Full-screen turn transition banner that fades in and out.

var _label: Label
var _elapsed := 0.0
var _duration := 1.5
var _active := false


func _ready() -> void:
	# Full screen overlay
	set_anchors_preset(Control.PRESET_FULL_RECT)
	color = Color(0, 0, 0, 0)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	z_index = 50

	_label = Label.new()
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_label.set_anchors_preset(Control.PRESET_FULL_RECT)
	_label.add_theme_font_size_override("font_size", 32)
	_label.modulate.a = 0
	add_child(_label)


func show_banner(text: String, text_color: Color = Color.WHITE) -> void:
	_label.text = text
	_label.add_theme_color_override("font_color", text_color)
	_elapsed = 0.0
	_active = true
	mouse_filter = Control.MOUSE_FILTER_STOP  # Block input during banner


func _process(delta: float) -> void:
	if not _active:
		return

	_elapsed += delta
	var t: float = _elapsed / _duration

	if t < 0.2:
		# Fade in
		var fade_in: float = t / 0.2
		color.a = fade_in * 0.6
		_label.modulate.a = fade_in
	elif t < 0.7:
		# Hold
		color.a = 0.6
		_label.modulate.a = 1.0
	elif t < 1.0:
		# Fade out
		var fade_out: float = (t - 0.7) / 0.3
		color.a = 0.6 * (1.0 - fade_out)
		_label.modulate.a = 1.0 - fade_out
	else:
		# Done
		color.a = 0
		_label.modulate.a = 0
		_active = false
		mouse_filter = Control.MOUSE_FILTER_IGNORE
