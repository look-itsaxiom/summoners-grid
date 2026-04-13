extends Control
## Login / Signup screen — Supabase Auth integration.
## Shows login form or skips to menu if already authenticated.

const BG_COLOR := Color(0.04, 0.04, 0.09)
const GOLD := Color(1.0, 0.85, 0.0)

var _auth: Node
var _email_input: LineEdit
var _password_input: LineEdit
var _status_label: Label
var _is_processing := false


func _ready() -> void:
	_auth = get_node("/root/Auth")

	# If already logged in, skip to menu
	if _auth.is_logged_in():
		get_tree().change_scene_to_file("res://scenes/menu.tscn")
		return

	# Check if auth is configured
	if _auth.supabase_url.contains("your-project"):
		# Not configured — skip login for dev mode
		_build_dev_mode_ui()
	else:
		_build_login_ui()


func _build_dev_mode_ui() -> void:
	var bg := ColorRect.new()
	bg.color = BG_COLOR
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(margin)

	var center := VBoxContainer.new()
	center.add_theme_constant_override("separation", 16)
	center.alignment = BoxContainer.ALIGNMENT_CENTER
	center.size_flags_vertical = Control.SIZE_EXPAND_FILL
	center.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	margin.add_child(center)

	var title := Label.new()
	title.text = "Summoner's Grid"
	title.add_theme_font_size_override("font_size", 42)
	title.add_theme_color_override("font_color", GOLD)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(title)

	var tagline := Label.new()
	tagline.text = "TACTICAL GRID-BASED RPG CARD GAME"
	tagline.add_theme_font_size_override("font_size", 12)
	tagline.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7))
	tagline.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(tagline)

	var spacer := Control.new()
	spacer.custom_minimum_size.y = 30
	center.add_child(spacer)

	var play_btn := Button.new()
	play_btn.text = "PLAY"
	play_btn.custom_minimum_size = Vector2(250, 48)
	play_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	play_btn.add_theme_font_size_override("font_size", 18)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.2, 0.5, 0.3)
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	play_btn.add_theme_stylebox_override("normal", style)
	var hover := style.duplicate()
	hover.bg_color = style.bg_color.lightened(0.15)
	play_btn.add_theme_stylebox_override("hover", hover)
	play_btn.pressed.connect(func(): get_node("/root/SceneTransition").change_scene("res://scenes/menu.tscn"))
	center.add_child(play_btn)

	var note := Label.new()
	note.text = "Early Access Alpha"
	note.add_theme_font_size_override("font_size", 10)
	note.add_theme_color_override("font_color", Color(0.3, 0.3, 0.4))
	note.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(note)


func _build_login_ui() -> void:
	var bg := ColorRect.new()
	bg.color = BG_COLOR
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var login_margin := MarginContainer.new()
	login_margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(login_margin)

	var center := VBoxContainer.new()
	center.add_theme_constant_override("separation", 12)
	center.alignment = BoxContainer.ALIGNMENT_CENTER
	center.size_flags_vertical = Control.SIZE_EXPAND_FILL
	center.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	login_margin.add_child(center)

	var title := Label.new()
	title.text = "Summoner's Grid"
	title.add_theme_font_size_override("font_size", 36)
	title.add_theme_color_override("font_color", GOLD)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "Sign in or create an account"
	subtitle.add_theme_font_size_override("font_size", 12)
	subtitle.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(subtitle)

	var spacer := Control.new()
	spacer.custom_minimum_size.y = 12
	center.add_child(spacer)

	# Email
	var email_label := Label.new()
	email_label.text = "Email"
	email_label.add_theme_font_size_override("font_size", 11)
	email_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7))
	center.add_child(email_label)

	_email_input = LineEdit.new()
	_email_input.placeholder_text = "you@example.com"
	_email_input.custom_minimum_size = Vector2(300, 36)
	_email_input.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	center.add_child(_email_input)

	# Password
	var pw_label := Label.new()
	pw_label.text = "Password"
	pw_label.add_theme_font_size_override("font_size", 11)
	pw_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7))
	center.add_child(pw_label)

	_password_input = LineEdit.new()
	_password_input.placeholder_text = "••••••••"
	_password_input.secret = true
	_password_input.custom_minimum_size = Vector2(300, 36)
	_password_input.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	center.add_child(_password_input)

	# Status
	_status_label = Label.new()
	_status_label.text = ""
	_status_label.add_theme_font_size_override("font_size", 11)
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(_status_label)

	# Buttons
	var btn_row := HBoxContainer.new()
	btn_row.add_theme_constant_override("separation", 12)
	btn_row.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(btn_row)

	_add_btn(btn_row, "SIGN IN", Color(0.2, 0.5, 0.3), _on_sign_in)
	_add_btn(btn_row, "CREATE ACCOUNT", Color(0.3, 0.4, 0.6), _on_sign_up)

	# Guest option
	var guest_btn := Button.new()
	guest_btn.text = "Play as Guest"
	guest_btn.add_theme_font_size_override("font_size", 11)
	guest_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	var gs := StyleBoxFlat.new()
	gs.bg_color = Color(0.15, 0.15, 0.2)
	gs.corner_radius_top_left = 4
	gs.corner_radius_top_right = 4
	gs.corner_radius_bottom_left = 4
	gs.corner_radius_bottom_right = 4
	guest_btn.add_theme_stylebox_override("normal", gs)
	guest_btn.pressed.connect(func(): get_tree().change_scene_to_file("res://scenes/menu.tscn"))
	center.add_child(guest_btn)


func _add_btn(parent: HBoxContainer, text: String, color: Color, callback: Callable) -> void:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(150, 42)
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
	var hover := style.duplicate()
	hover.bg_color = color.lightened(0.15)
	btn.add_theme_stylebox_override("hover", hover)
	parent.add_child(btn)


func _on_sign_in() -> void:
	if _is_processing:
		return
	var email := _email_input.text.strip_edges()
	var password := _password_input.text
	if email == "" or password == "":
		_status_label.text = "Please enter email and password"
		_status_label.add_theme_color_override("font_color", Color(1, 0.3, 0.3))
		return

	_is_processing = true
	_status_label.text = "Signing in..."
	_status_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.5))

	var result: Dictionary = await _auth.sign_in(email, password)
	_is_processing = false

	if result.get("success", false):
		get_tree().change_scene_to_file("res://scenes/menu.tscn")
	else:
		_status_label.text = result.get("error", "Sign in failed")
		_status_label.add_theme_color_override("font_color", Color(1, 0.3, 0.3))


func _on_sign_up() -> void:
	if _is_processing:
		return
	var email := _email_input.text.strip_edges()
	var password := _password_input.text
	if email == "" or password.length() < 6:
		_status_label.text = "Email required, password min 6 characters"
		_status_label.add_theme_color_override("font_color", Color(1, 0.3, 0.3))
		return

	_is_processing = true
	_status_label.text = "Creating account..."
	_status_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.5))

	var result: Dictionary = await _auth.sign_up(email, password)
	_is_processing = false

	if result.get("success", false):
		get_tree().change_scene_to_file("res://scenes/menu.tscn")
	else:
		_status_label.text = result.get("error", "Sign up failed")
		_status_label.add_theme_color_override("font_color", Color(1, 0.3, 0.3))
