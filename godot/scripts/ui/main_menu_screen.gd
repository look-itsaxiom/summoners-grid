extends Control
## Main menu — title screen with game mode buttons.

const TITLE_COLOR := Color(1.0, 0.85, 0.0)
const SUBTITLE_COLOR := Color(0.6, 0.6, 0.7)
const BG_COLOR := Color(0.05, 0.05, 0.1)


func _ready() -> void:
	_build_ui()
	var bgm = get_node_or_null("/root/BGM")
	if bgm:
		bgm.play("menu")


func _build_ui() -> void:
	# Background
	var bg := ColorRect.new()
	bg.color = BG_COLOR
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# MarginContainer centers content with padding
	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_top", 100)
	margin.add_theme_constant_override("margin_bottom", 80)
	margin.add_theme_constant_override("margin_left", 340)
	margin.add_theme_constant_override("margin_right", 340)
	add_child(margin)

	var center := VBoxContainer.new()
	center.add_theme_constant_override("separation", 12)
	center.alignment = BoxContainer.ALIGNMENT_CENTER
	center.size_flags_vertical = Control.SIZE_EXPAND_FILL
	center.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	margin.add_child(center)

	# Title
	var title := Label.new()
	title.text = "Summoner's Grid"
	title.add_theme_font_size_override("font_size", 42)
	title.add_theme_color_override("font_color", TITLE_COLOR)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(title)

	# Subtitle
	var subtitle := Label.new()
	subtitle.text = "TACTICAL GRID-BASED RPG CARD GAME"
	subtitle.add_theme_font_size_override("font_size", 12)
	subtitle.add_theme_color_override("font_color", SUBTITLE_COLOR)
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(subtitle)

	# Spacer
	var spacer := Control.new()
	spacer.custom_minimum_size.y = 30
	center.add_child(spacer)

	# Buttons
	_add_button(center, "PLAY VS AI", Color(1.0, 0.6, 0.0), _on_play_vs_ai)
	_add_button(center, "Random Deck Game", Color(0.9, 0.7, 0.0), _on_random_game)
	_add_button(center, "Watch AI vs AI", Color(0.3, 0.3, 0.4), _on_watch_ai)
	_add_button(center, "Pack Store", Color(0.6, 0.4, 0.15), _on_pack_store)
	_add_button(center, "Deck Builder", Color(0.4, 0.3, 0.55), _on_deck_builder)
	_add_button(center, "My Collection", Color(0.3, 0.5, 0.3), _on_collection)
	_add_button(center, "How to Play", Color(0.25, 0.4, 0.6), _on_how_to_play)

	# Spacer
	var spacer3 := Control.new()
	spacer3.custom_minimum_size.y = 8
	center.add_child(spacer3)

	# Version
	var version := Label.new()
	version.text = "Alpha Build — Summoner's Grid (Godot)"
	version.add_theme_font_size_override("font_size", 10)
	version.add_theme_color_override("font_color", Color(0.3, 0.3, 0.4))
	version.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(version)


func _add_feature_card(parent: HBoxContainer, title_text: String, desc_text: String) -> void:
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(170, 70)
	parent.add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)
	panel.add_child(vbox)

	var t := Label.new()
	t.text = title_text
	t.add_theme_font_size_override("font_size", 13)
	t.add_theme_color_override("font_color", TITLE_COLOR)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(t)

	var d := Label.new()
	d.text = desc_text
	d.add_theme_font_size_override("font_size", 10)
	d.add_theme_color_override("font_color", SUBTITLE_COLOR)
	d.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(d)


func _add_button(parent: VBoxContainer, text: String, color: Color, callback: Callable) -> void:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(300, 48)
	btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	btn.add_theme_font_size_override("font_size", 18)
	btn.pressed.connect(callback)

	# Style
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	btn.add_theme_stylebox_override("normal", style)

	var hover_style := style.duplicate()
	hover_style.bg_color = color.lightened(0.15)
	btn.add_theme_stylebox_override("hover", hover_style)

	parent.add_child(btn)


func _on_play_vs_ai() -> void:
	var gm = get_node("/root/GameManager")
	gm.spectator_mode = false
	gm.use_random_decks = false
	get_tree().change_scene_to_file("res://scenes/deck_preview.tscn")


func _on_random_game() -> void:
	var gm = get_node("/root/GameManager")
	gm.spectator_mode = false
	gm.use_random_decks = true
	get_tree().change_scene_to_file("res://scenes/game.tscn")


func _on_watch_ai() -> void:
	var gm = get_node("/root/GameManager")
	gm.spectator_mode = true
	gm.use_random_decks = false
	get_tree().change_scene_to_file("res://scenes/game.tscn")


func _on_pack_store() -> void:
	get_tree().change_scene_to_file("res://scenes/pack_store.tscn")


func _on_deck_builder() -> void:
	get_tree().change_scene_to_file("res://scenes/deck_builder.tscn")


func _on_collection() -> void:
	get_tree().change_scene_to_file("res://scenes/collection.tscn")


func _on_how_to_play() -> void:
	get_tree().change_scene_to_file("res://scenes/how_to_play.tscn")
