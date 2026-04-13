extends Node
## Global theme loader — applies Kenney UI textures to all controls.
## Autoload as "ThemeLoader".

func _ready() -> void:
	var theme := Theme.new()

	# Button styles using Kenney textures
	var btn_path := "res://assets/ui/kenney/buttonLong_brown.png"
	var btn_pressed_path := "res://assets/ui/kenney/buttonLong_brown_pressed.png"
	if ResourceLoader.exists(btn_path):
		var normal := _make_btn_style(btn_path, Color(0.9, 0.85, 0.8))
		theme.set_stylebox("normal", "Button", normal)

		var hover := _make_btn_style(btn_path, Color(1.1, 1.0, 0.95))
		theme.set_stylebox("hover", "Button", hover)

		if ResourceLoader.exists(btn_pressed_path):
			var pressed := _make_btn_style(btn_pressed_path, Color(0.7, 0.65, 0.6))
			pressed.content_margin_top = 12
			pressed.content_margin_bottom = 8
			theme.set_stylebox("pressed", "Button", pressed)

		var disabled := _make_btn_style(btn_path, Color(0.4, 0.4, 0.4))
		theme.set_stylebox("disabled", "Button", disabled)

	# Button text colors
	theme.set_color("font_color", "Button", Color(0.95, 0.9, 0.8))
	theme.set_color("font_hover_color", "Button", Color(1.0, 0.95, 0.85))
	theme.set_color("font_pressed_color", "Button", Color(0.8, 0.75, 0.65))
	theme.set_color("font_disabled_color", "Button", Color(0.5, 0.5, 0.5))
	theme.set_color("font_shadow_color", "Button", Color(0.15, 0.1, 0.0, 0.5))
	theme.set_constant("shadow_offset_x", "Button", 1)
	theme.set_constant("shadow_offset_y", "Button", 1)

	# Panel styles using Kenney textures
	var panel_path := "res://assets/ui/kenney/panel_brown.png"
	if ResourceLoader.exists(panel_path):
		var panel_style := _make_panel_style(panel_path, Color(0.3, 0.25, 0.2, 0.9))
		theme.set_stylebox("panel", "PanelContainer", panel_style)

	# Label colors
	theme.set_color("font_color", "Label", Color(0.9, 0.85, 0.8))

	# Cinzel font for titles
	var cinzel_path := "res://assets/fonts/cinzel.ttf"
	if ResourceLoader.exists(cinzel_path):
		var font := load(cinzel_path)
		theme.set_font("font", "Label", font)

	# Lato for buttons and body
	var lato_path := "res://assets/fonts/lato.ttf"
	if ResourceLoader.exists(lato_path):
		var body_font := load(lato_path)
		theme.set_font("font", "Button", body_font)
		theme.set_font("font", "RichTextLabel", body_font)
		theme.set_font("font", "LineEdit", body_font)

	# Apply to scene tree
	get_tree().root.theme = theme


func _make_btn_style(tex_path: String, tint: Color) -> StyleBoxTexture:
	var style := StyleBoxTexture.new()
	style.texture = load(tex_path)
	style.texture_margin_left = 12
	style.texture_margin_right = 12
	style.texture_margin_top = 8
	style.texture_margin_bottom = 8
	style.content_margin_left = 14
	style.content_margin_right = 14
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	style.modulate_color = tint
	return style


func _make_panel_style(tex_path: String, tint: Color) -> StyleBoxTexture:
	var style := StyleBoxTexture.new()
	style.texture = load(tex_path)
	style.texture_margin_left = 10
	style.texture_margin_right = 10
	style.texture_margin_top = 10
	style.texture_margin_bottom = 10
	style.content_margin_left = 10
	style.content_margin_right = 10
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	style.modulate_color = tint
	return style
