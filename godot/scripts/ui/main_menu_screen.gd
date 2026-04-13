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


var _particles: Array = []
var _particle_timer := 0.0

func _build_ui() -> void:
	# Background with subtle gradient
	var bg := ColorRect.new()
	bg.color = BG_COLOR
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# Subtle top gradient overlay for depth
	var gradient := ColorRect.new()
	gradient.color = Color(0.08, 0.05, 0.15, 0.3)
	gradient.set_anchors_preset(Control.PRESET_FULL_RECT)
	gradient.anchor_bottom = 0.4
	add_child(gradient)

	set_process(true)

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
	spacer.custom_minimum_size.y = 20
	center.add_child(spacer)

	# Two-column layout: Play | Collect
	var columns := HBoxContainer.new()
	columns.add_theme_constant_override("separation", 24)
	columns.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(columns)

	# Left column: Play modes
	var play_col := VBoxContainer.new()
	play_col.add_theme_constant_override("separation", 8)
	play_col.custom_minimum_size.x = 220
	columns.add_child(play_col)

	var play_header := Label.new()
	play_header.text = "PLAY"
	play_header.add_theme_font_size_override("font_size", 11)
	play_header.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	play_header.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	play_col.add_child(play_header)

	_add_button(play_col, "BATTLE VS AI", Color(1.0, 0.6, 0.0), _on_play_vs_ai, 220)
	_add_button(play_col, "Random Deck", Color(0.7, 0.55, 0.0), _on_random_game, 220)
	_add_button(play_col, "Watch AI vs AI", Color(0.3, 0.3, 0.4), _on_watch_ai, 220)

	# Right column: Collection & Economy
	var collect_col := VBoxContainer.new()
	collect_col.add_theme_constant_override("separation", 8)
	collect_col.custom_minimum_size.x = 220
	columns.add_child(collect_col)

	var collect_header := Label.new()
	collect_header.text = "COLLECT"
	collect_header.add_theme_font_size_override("font_size", 11)
	collect_header.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	collect_header.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	collect_col.add_child(collect_header)

	_add_button(collect_col, "Pack Store", Color(0.6, 0.4, 0.15), _on_pack_store, 220)
	_add_button(collect_col, "Deck Builder", Color(0.4, 0.3, 0.55), _on_deck_builder, 220)
	_add_button(collect_col, "My Collection", Color(0.3, 0.5, 0.3), _on_collection, 220)

	# Bottom row: How to Play
	var spacer2 := Control.new()
	spacer2.custom_minimum_size.y = 4
	center.add_child(spacer2)

	_add_button(center, "How to Play", Color(0.2, 0.25, 0.35), _on_how_to_play, 200)

	# Spacer
	var spacer3 := Control.new()
	spacer3.custom_minimum_size.y = 4
	center.add_child(spacer3)

	# Daily bonus notification
	var storage = get_node_or_null("/root/CardStorage")
	if storage and storage.got_daily_bonus_today():
		var bonus_label := Label.new()
		bonus_label.text = "Daily Bonus: +100 coins!"
		bonus_label.add_theme_font_size_override("font_size", 12)
		bonus_label.add_theme_color_override("font_color", Color(0.3, 0.9, 0.3))
		bonus_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		center.add_child(bonus_label)

	# Player rank + stats bar
	if storage:
		var rank: Dictionary = storage.get_rank()
		var rank_label := Label.new()
		var rank_text := "Rank: %s" % rank["name"]
		if rank.has("next") and not rank["next"].is_empty():
			rank_text += "  (%d/%d wins to %s)" % [rank["wins"], rank["next"]["min"], rank["next"]["name"]]
		rank_label.text = rank_text
		rank_label.add_theme_font_size_override("font_size", 11)
		rank_label.add_theme_color_override("font_color", rank["color"])
		rank_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		center.add_child(rank_label)

		var player_coins: int = storage.get_coins()
		var total_power := 0
		for card in storage.get_cards():
			total_power += card.get("power", 0)
		var stats_text := "🪙 %d  |  📦 %d cards  |  ⚡ %d power" % [player_coins, storage.get_card_count(), total_power]
		if player_coins < CardStorage.PACK_COST_STANDARD:
			var needed: int = CardStorage.PACK_COST_STANDARD - player_coins
			stats_text += "  |  %d🪙 to next pack" % needed
		var rarities: Dictionary = storage.get_rarity_counts()
		if rarities.has("myth"):
			stats_text += "  |  ✨ %d myth" % rarities["myth"]
		var stats_label := Label.new()
		stats_label.text = stats_text
		stats_label.add_theme_font_size_override("font_size", 10)
		stats_label.add_theme_color_override("font_color", Color(0.45, 0.45, 0.55))
		stats_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		center.add_child(stats_label)

	# Version
	var version := Label.new()
	version.text = "Alpha Build — Summoner's Grid (Godot)"
	version.add_theme_font_size_override("font_size", 10)
	version.add_theme_color_override("font_color", Color(0.3, 0.3, 0.4))
	version.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(version)


func _process(delta: float) -> void:
	# Spawn floating sparkle particles
	_particle_timer += delta
	if _particle_timer > 0.3 and _particles.size() < 20:
		_particle_timer = 0.0
		var sz := 1 + randi() % 3  # 1-3px
		var sparkle := ColorRect.new()
		sparkle.custom_minimum_size = Vector2(sz, sz)
		sparkle.size = Vector2(sz, sz)
		var hue := randf_range(0.1, 0.17)  # Gold to amber range
		sparkle.color = Color.from_hsv(hue, 0.6, 1.0, 0.2 + randf() * 0.2)
		sparkle.position = Vector2(randf() * 1280, 720 + 10)
		sparkle.z_index = -1
		add_child(sparkle)
		_particles.append({"node": sparkle, "speed": 20 + randf() * 40, "drift": randf_range(-15, 15)})

	# Update particles
	var to_remove: Array = []
	for p in _particles:
		var node: ColorRect = p["node"]
		node.position.y -= p["speed"] * delta
		node.position.x += p["drift"] * delta
		node.color.a -= delta * 0.15
		if node.position.y < -20 or node.color.a <= 0:
			to_remove.append(p)
			node.queue_free()

	for p in to_remove:
		_particles.erase(p)


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


func _add_button(parent: Container, text: String, color: Color, callback: Callable, width: int = 300) -> void:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(width, 42)
	btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	btn.add_theme_font_size_override("font_size", 15)
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
	get_node("/root/SceneTransition").change_scene("res://scenes/deck_preview.tscn")


func _on_random_game() -> void:
	var gm = get_node("/root/GameManager")
	gm.spectator_mode = false
	gm.use_random_decks = true
	get_node("/root/SceneTransition").change_scene("res://scenes/game.tscn")


func _on_watch_ai() -> void:
	var gm = get_node("/root/GameManager")
	gm.spectator_mode = true
	gm.use_random_decks = false
	get_node("/root/SceneTransition").change_scene("res://scenes/game.tscn")


func _on_pack_store() -> void:
	get_node("/root/SceneTransition").change_scene("res://scenes/pack_store.tscn")


func _on_deck_builder() -> void:
	get_node("/root/SceneTransition").change_scene("res://scenes/deck_builder.tscn")


func _on_collection() -> void:
	get_node("/root/SceneTransition").change_scene("res://scenes/collection.tscn")


func _on_how_to_play() -> void:
	get_node("/root/SceneTransition").change_scene("res://scenes/how_to_play.tscn")
