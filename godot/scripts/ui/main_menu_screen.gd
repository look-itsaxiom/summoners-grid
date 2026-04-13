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
	_check_first_time()


var _particles: Array = []
var _particle_timer := 0.0

func _build_ui() -> void:
	# Background — art or fallback color
	var bg_path := "res://assets/menu_bg.png"
	if ResourceLoader.exists(bg_path):
		var bg_tex := TextureRect.new()
		bg_tex.texture = load(bg_path)
		bg_tex.set_anchors_preset(Control.PRESET_FULL_RECT)
		bg_tex.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		bg_tex.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		add_child(bg_tex)
		# Dark overlay so text is readable
		var overlay := ColorRect.new()
		overlay.color = Color(0.0, 0.0, 0.05, 0.55)
		overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
		add_child(overlay)
	else:
		var bg := ColorRect.new()
		bg.color = BG_COLOR
		bg.set_anchors_preset(Control.PRESET_FULL_RECT)
		add_child(bg)

	# Top gradient — darker at top for title readability
	var gradient := ColorRect.new()
	gradient.color = Color(0.02, 0.01, 0.06, 0.6)
	gradient.set_anchors_preset(Control.PRESET_FULL_RECT)
	gradient.anchor_bottom = 0.3
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

	# Title — Cinzel fantasy font if available
	var title := Label.new()
	title.text = "Summoner's Grid"
	var cinzel_path := "res://assets/fonts/cinzel.ttf"
	if ResourceLoader.exists(cinzel_path):
		var font := FontFile.new()
		font.load_dynamic_font(cinzel_path)
		title.add_theme_font_override("font", font)
	title.add_theme_font_size_override("font_size", 52)
	title.add_theme_color_override("font_color", TITLE_COLOR)
	title.add_theme_color_override("font_shadow_color", Color(0.3, 0.15, 0.0, 0.7))
	title.add_theme_constant_override("shadow_offset_x", 3)
	title.add_theme_constant_override("shadow_offset_y", 4)
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

	_add_button(play_col, "Campaign", Color(0.6, 0.3, 0.7), _on_campaign, 220)
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
	_add_button(collect_col, "Marketplace", Color(0.5, 0.35, 0.1), _on_marketplace, 220)
	_add_button(collect_col, "Card Forge", Color(0.55, 0.25, 0.1), _on_forge, 220)
	_add_button(collect_col, "Deck Builder", Color(0.4, 0.3, 0.55), _on_deck_builder, 220)

	# Bottom row: How to Play
	var spacer2 := Control.new()
	spacer2.custom_minimum_size.y = 4
	center.add_child(spacer2)

	var bottom_row := HBoxContainer.new()
	bottom_row.add_theme_constant_override("separation", 12)
	bottom_row.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(bottom_row)

	_add_button(bottom_row, "Collection", Color(0.3, 0.5, 0.3), _on_collection, 110)
	_add_button(bottom_row, "How to Play", Color(0.2, 0.25, 0.35), _on_how_to_play, 110)
	_add_button(bottom_row, "History", Color(0.2, 0.2, 0.3), _on_match_history, 100)
	_add_button(bottom_row, "Settings", Color(0.2, 0.2, 0.3), _on_settings, 100)

	# Spacer
	var spacer3 := Control.new()
	spacer3.custom_minimum_size.y = 4
	center.add_child(spacer3)

	# Campaign progress
	var campaign = get_node_or_null("/root/Campaign")
	if campaign and not campaign.is_campaign_complete():
		var cp_label := Label.new()
		cp_label.text = campaign.get_progress_text()
		cp_label.add_theme_font_size_override("font_size", 11)
		cp_label.add_theme_color_override("font_color", Color(0.6, 0.3, 0.7))
		cp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		center.add_child(cp_label)

	# Daily challenge
	var daily = get_node_or_null("/root/DailyChallenge")
	if daily:
		var challenge: Dictionary = daily.get_challenge()
		if not challenge.is_empty():
			var dc_label := Label.new()
			if daily.is_completed():
				dc_label.text = "Daily Challenge Complete!"
				dc_label.add_theme_color_override("font_color", Color(0.3, 0.9, 0.3))
			else:
				dc_label.text = "Daily: %s — %s (+%d coins)" % [challenge["name"], challenge["description"], challenge["reward"]]
				dc_label.add_theme_color_override("font_color", Color(1.0, 0.7, 0.2))
			dc_label.add_theme_font_size_override("font_size", 11)
			dc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			center.add_child(dc_label)

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
	var ver_str: String = ProjectSettings.get_setting("application/config/version", "0.0.0")
	version.text = "v%s Alpha — Summoner's Grid" % ver_str
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
	btn.custom_minimum_size = Vector2(width, 44)
	btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	btn.add_theme_font_size_override("font_size", 15)
	btn.add_theme_color_override("font_color", Color(0.95, 0.9, 0.8))
	btn.add_theme_color_override("font_shadow_color", Color(0.2, 0.1, 0.0, 0.5))
	btn.add_theme_constant_override("shadow_offset_x", 1)
	btn.add_theme_constant_override("shadow_offset_y", 1)
	btn.pressed.connect(callback)

	# Try Kenney texture buttons, fallback to flat
	var btn_tex_path := "res://assets/ui/kenney/buttonLong_brown.png"
	var btn_pressed_path := "res://assets/ui/kenney/buttonLong_brown_pressed.png"
	if ResourceLoader.exists(btn_tex_path):
		var normal_style := StyleBoxTexture.new()
		normal_style.texture = load(btn_tex_path)
		normal_style.texture_margin_left = 12
		normal_style.texture_margin_right = 12
		normal_style.texture_margin_top = 8
		normal_style.texture_margin_bottom = 8
		normal_style.content_margin_left = 16
		normal_style.content_margin_right = 16
		normal_style.content_margin_top = 10
		normal_style.content_margin_bottom = 10
		normal_style.modulate_color = color.lerp(Color(0.8, 0.7, 0.6), 0.3)
		btn.add_theme_stylebox_override("normal", normal_style)

		var hover_style := StyleBoxTexture.new()
		hover_style.texture = load(btn_tex_path)
		hover_style.texture_margin_left = 12
		hover_style.texture_margin_right = 12
		hover_style.texture_margin_top = 8
		hover_style.texture_margin_bottom = 8
		hover_style.content_margin_left = 16
		hover_style.content_margin_right = 16
		hover_style.content_margin_top = 10
		hover_style.content_margin_bottom = 10
		hover_style.modulate_color = color.lerp(Color(1.0, 0.9, 0.8), 0.3).lightened(0.15)
		btn.add_theme_stylebox_override("hover", hover_style)

		if ResourceLoader.exists(btn_pressed_path):
			var pressed_style := StyleBoxTexture.new()
			pressed_style.texture = load(btn_pressed_path)
			pressed_style.texture_margin_left = 12
			pressed_style.texture_margin_right = 12
			pressed_style.texture_margin_top = 8
			pressed_style.texture_margin_bottom = 8
			pressed_style.content_margin_left = 16
			pressed_style.content_margin_right = 16
			pressed_style.content_margin_top = 12
			pressed_style.content_margin_bottom = 8
			btn.add_theme_stylebox_override("pressed", pressed_style)
	else:
		var style := StyleBoxFlat.new()
		style.bg_color = color
		style.corner_radius_top_left = 8
		style.corner_radius_top_right = 8
		style.corner_radius_bottom_left = 8
		style.corner_radius_bottom_right = 8
		style.content_margin_top = 10
		style.content_margin_bottom = 10
		btn.add_theme_stylebox_override("normal", style)

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


func _on_marketplace() -> void:
	get_node("/root/SceneTransition").change_scene("res://scenes/marketplace.tscn")


func _on_forge() -> void:
	get_node("/root/SceneTransition").change_scene("res://scenes/forge.tscn")


func _on_deck_builder() -> void:
	get_node("/root/SceneTransition").change_scene("res://scenes/deck_builder.tscn")


func _on_collection() -> void:
	get_node("/root/SceneTransition").change_scene("res://scenes/collection.tscn")


func _on_how_to_play() -> void:
	get_node("/root/SceneTransition").change_scene("res://scenes/how_to_play.tscn")


func _on_campaign() -> void:
	var campaign = get_node_or_null("/root/Campaign")
	if campaign == null or campaign.is_campaign_complete():
		# Show completion or fallback
		var gm = get_node("/root/GameManager")
		gm.spectator_mode = false
		gm.use_random_decks = false
		get_node("/root/SceneTransition").change_scene("res://scenes/deck_preview.tscn")
		return

	# Show stage briefing overlay
	var stage: Dictionary = campaign.get_current_stage()
	var overlay := ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.7)
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(overlay)

	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(460, 0)
	panel.position = Vector2(410, 180)
	var ps := StyleBoxFlat.new()
	ps.bg_color = Color(0.08, 0.06, 0.14)
	ps.border_color = Color(0.6, 0.3, 0.7)
	ps.border_width_top = 2
	ps.border_width_bottom = 2
	ps.border_width_left = 2
	ps.border_width_right = 2
	ps.corner_radius_top_left = 10
	ps.corner_radius_top_right = 10
	ps.corner_radius_bottom_left = 10
	ps.corner_radius_bottom_right = 10
	ps.content_margin_top = 20
	ps.content_margin_bottom = 16
	ps.content_margin_left = 24
	ps.content_margin_right = 24
	panel.add_theme_stylebox_override("panel", ps)
	overlay.add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 10)
	panel.add_child(vbox)

	var stage_num := Label.new()
	stage_num.text = "STAGE %d / %d" % [campaign.current_stage + 1, campaign.get_stage_count()]
	stage_num.add_theme_font_size_override("font_size", 11)
	stage_num.add_theme_color_override("font_color", Color(0.6, 0.3, 0.7))
	stage_num.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(stage_num)

	var title := Label.new()
	title.text = stage["name"]
	title.add_theme_font_size_override("font_size", 24)
	title.add_theme_color_override("font_color", Color(1.0, 0.85, 0.0))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	var desc := Label.new()
	desc.text = stage["description"]
	desc.add_theme_font_size_override("font_size", 13)
	desc.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8))
	desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD
	vbox.add_child(desc)

	var diff_names := ["Easy", "Normal", "Hard"]
	var diff_label := Label.new()
	diff_label.text = "Difficulty: %s  |  Reward: %d coins" % [diff_names[stage["difficulty"]], stage["reward"]]
	diff_label.add_theme_font_size_override("font_size", 12)
	diff_label.add_theme_color_override("font_color", Color(0.5, 0.55, 0.7))
	diff_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(diff_label)

	var btn_row := HBoxContainer.new()
	btn_row.add_theme_constant_override("separation", 12)
	btn_row.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_child(btn_row)

	var back_btn := Button.new()
	back_btn.text = "Back"
	back_btn.custom_minimum_size = Vector2(120, 38)
	back_btn.add_theme_font_size_override("font_size", 13)
	var bs := StyleBoxFlat.new()
	bs.bg_color = Color(0.2, 0.2, 0.3)
	bs.corner_radius_top_left = 6
	bs.corner_radius_top_right = 6
	bs.corner_radius_bottom_left = 6
	bs.corner_radius_bottom_right = 6
	back_btn.add_theme_stylebox_override("normal", bs)
	back_btn.pressed.connect(func(): overlay.queue_free())
	btn_row.add_child(back_btn)

	var fight_btn := Button.new()
	fight_btn.text = "FIGHT!"
	fight_btn.custom_minimum_size = Vector2(140, 38)
	fight_btn.add_theme_font_size_override("font_size", 15)
	var fs := StyleBoxFlat.new()
	fs.bg_color = Color(0.5, 0.2, 0.6)
	fs.corner_radius_top_left = 6
	fs.corner_radius_top_right = 6
	fs.corner_radius_bottom_left = 6
	fs.corner_radius_bottom_right = 6
	fight_btn.add_theme_stylebox_override("normal", fs)
	fight_btn.pressed.connect(func():
		var settings = get_node_or_null("/root/Settings")
		if settings:
			settings.ai_difficulty = stage["difficulty"]
		var gm = get_node("/root/GameManager")
		gm.spectator_mode = false
		gm.use_random_decks = false
		gm.set("_campaign_mode", true)
		get_node("/root/SceneTransition").change_scene("res://scenes/deck_preview.tscn")
	)
	btn_row.add_child(fight_btn)


func _on_match_history() -> void:
	get_node("/root/SceneTransition").change_scene("res://scenes/match_history.tscn")


func _on_settings() -> void:
	get_node("/root/SceneTransition").change_scene("res://scenes/settings.tscn")


func _check_first_time() -> void:
	var settings = get_node_or_null("/root/Settings")
	if settings == null:
		return
	if settings.total_wins + settings.total_losses > 0:
		return

	# First time — show welcome popup
	var overlay := ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.6)
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(overlay)

	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(420, 0)
	panel.position = Vector2(430, 200)
	var ps := StyleBoxFlat.new()
	ps.bg_color = Color(0.08, 0.08, 0.14)
	ps.border_color = Color(1.0, 0.85, 0.0)
	ps.border_width_top = 2
	ps.border_width_bottom = 2
	ps.border_width_left = 2
	ps.border_width_right = 2
	ps.corner_radius_top_left = 10
	ps.corner_radius_top_right = 10
	ps.corner_radius_bottom_left = 10
	ps.corner_radius_bottom_right = 10
	ps.content_margin_top = 20
	ps.content_margin_bottom = 16
	ps.content_margin_left = 24
	ps.content_margin_right = 24
	panel.add_theme_stylebox_override("panel", ps)
	overlay.add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 10)
	panel.add_child(vbox)

	var title := Label.new()
	title.text = "Welcome, Summoner!"
	title.add_theme_font_size_override("font_size", 22)
	title.add_theme_color_override("font_color", Color(1.0, 0.85, 0.0))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	var desc := Label.new()
	desc.text = "New here? Start with \"How to Play\" to learn the basics,\nor jump straight into a Random Deck game to try it out.\n\nYou have 500 coins — enough for a card pack from the Pack Store!"
	desc.add_theme_font_size_override("font_size", 12)
	desc.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8))
	desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD
	vbox.add_child(desc)

	var btn_row := HBoxContainer.new()
	btn_row.add_theme_constant_override("separation", 12)
	btn_row.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_child(btn_row)

	var learn_btn := Button.new()
	learn_btn.text = "How to Play"
	learn_btn.custom_minimum_size = Vector2(140, 38)
	learn_btn.add_theme_font_size_override("font_size", 13)
	var ls := StyleBoxFlat.new()
	ls.bg_color = Color(0.2, 0.4, 0.6)
	ls.corner_radius_top_left = 6
	ls.corner_radius_top_right = 6
	ls.corner_radius_bottom_left = 6
	ls.corner_radius_bottom_right = 6
	learn_btn.add_theme_stylebox_override("normal", ls)
	learn_btn.pressed.connect(func():
		overlay.queue_free()
		_on_how_to_play()
	)
	btn_row.add_child(learn_btn)

	var play_btn := Button.new()
	play_btn.text = "Let's Go!"
	play_btn.custom_minimum_size = Vector2(140, 38)
	play_btn.add_theme_font_size_override("font_size", 13)
	var pls := StyleBoxFlat.new()
	pls.bg_color = Color(0.3, 0.5, 0.2)
	pls.corner_radius_top_left = 6
	pls.corner_radius_top_right = 6
	pls.corner_radius_bottom_left = 6
	pls.corner_radius_bottom_right = 6
	play_btn.add_theme_stylebox_override("normal", pls)
	play_btn.pressed.connect(func(): overlay.queue_free())
	btn_row.add_child(play_btn)
