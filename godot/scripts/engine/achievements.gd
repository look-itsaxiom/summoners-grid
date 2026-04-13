extends Node
## Achievement system — milestones that reward coins and track progress.
## Autoload as "Achievements".

const SAVE_PATH := "user://achievements.json"

# Achievement definitions: { id: { name, description, requirement, reward, check_func } }
var DEFINITIONS := {
	"first_blood": {
		"name": "First Blood",
		"description": "Win your first battle",
		"reward": 100,
	},
	"pack_rat": {
		"name": "Pack Rat",
		"description": "Open 5 card packs",
		"reward": 200,
	},
	"collector": {
		"name": "Collector",
		"description": "Own 50 cards",
		"reward": 300,
	},
	"streak_3": {
		"name": "On Fire",
		"description": "Win 3 games in a row",
		"reward": 150,
	},
	"streak_5": {
		"name": "Unstoppable",
		"description": "Win 5 games in a row",
		"reward": 300,
	},
	"veteran": {
		"name": "Veteran",
		"description": "Play 10 matches",
		"reward": 200,
	},
	"champion": {
		"name": "Champion",
		"description": "Win 10 matches",
		"reward": 500,
	},
	"myth_hunter": {
		"name": "Myth Hunter",
		"description": "Pull a Mythic card from a pack",
		"reward": 250,
	},
	"deck_master": {
		"name": "Deck Master",
		"description": "Build a custom deck and win with it",
		"reward": 200,
	},
	"rank_up": {
		"name": "Moving Up",
		"description": "Reach Apprentice rank",
		"reward": 150,
	},
}

# Unlocked achievements: { id: true }
var _unlocked: Dictionary = {}

signal achievement_unlocked(id: String, name: String, reward: int)


func _ready() -> void:
	_load()
	achievement_unlocked.connect(_show_toast)


func is_unlocked(id: String) -> bool:
	return _unlocked.has(id)


func get_unlocked_count() -> int:
	return _unlocked.size()


func get_total_count() -> int:
	return DEFINITIONS.size()


func get_progress_text() -> String:
	return "%d / %d achievements" % [get_unlocked_count(), get_total_count()]


## Try to unlock an achievement. Returns reward amount if newly unlocked, 0 if already had it.
func try_unlock(id: String) -> int:
	if _unlocked.has(id):
		return 0
	if not DEFINITIONS.has(id):
		return 0

	_unlocked[id] = true
	var def: Dictionary = DEFINITIONS[id]
	var reward: int = def.get("reward", 0)

	# Award coins
	if reward > 0:
		var storage = get_node_or_null("/root/CardStorage")
		if storage:
			storage._coins += reward
			storage._save()

	achievement_unlocked.emit(id, def["name"], reward)
	_save()
	return reward


## Check all achievement conditions against current game state.
func check_all() -> void:
	var settings = get_node_or_null("/root/Settings")
	var storage = get_node_or_null("/root/CardStorage")

	if settings:
		if settings.total_wins >= 1:
			try_unlock("first_blood")
		if settings.total_wins >= 10:
			try_unlock("champion")
		if settings.total_wins + settings.total_losses >= 10:
			try_unlock("veteran")
		if settings.current_streak >= 3:
			try_unlock("streak_3")
		if settings.current_streak >= 5:
			try_unlock("streak_5")

	if storage:
		if storage.get_card_count() >= 50:
			try_unlock("collector")
		if storage._pack_history.size() >= 5:
			try_unlock("pack_rat")
		var rank: Dictionary = storage.get_rank()
		if rank.get("name", "") != "Novice":
			try_unlock("rank_up")


func get_all() -> Array:
	var result: Array = []
	for id in DEFINITIONS:
		var def: Dictionary = DEFINITIONS[id].duplicate()
		def["id"] = id
		def["unlocked"] = _unlocked.has(id)
		result.append(def)
	return result


func _show_toast(id: String, achievement_name: String, reward: int) -> void:
	# Create a CanvasLayer toast that slides in from the top
	var canvas := CanvasLayer.new()
	canvas.layer = 100

	var panel := PanelContainer.new()
	var ps := StyleBoxFlat.new()
	ps.bg_color = Color(0.12, 0.1, 0.2, 0.95)
	ps.border_color = Color(1.0, 0.85, 0.0)
	ps.border_width_top = 2
	ps.border_width_bottom = 2
	ps.border_width_left = 2
	ps.border_width_right = 2
	ps.corner_radius_top_left = 8
	ps.corner_radius_top_right = 8
	ps.corner_radius_bottom_left = 8
	ps.corner_radius_bottom_right = 8
	ps.content_margin_top = 10
	ps.content_margin_bottom = 10
	ps.content_margin_left = 16
	ps.content_margin_right = 16
	panel.add_theme_stylebox_override("panel", ps)
	panel.position = Vector2(440, -80)
	canvas.add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 2)
	panel.add_child(vbox)

	var header := Label.new()
	header.text = "ACHIEVEMENT UNLOCKED"
	header.add_theme_font_size_override("font_size", 10)
	header.add_theme_color_override("font_color", Color(1.0, 0.85, 0.0))
	header.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(header)

	var name_label := Label.new()
	name_label.text = achievement_name
	name_label.add_theme_font_size_override("font_size", 16)
	name_label.add_theme_color_override("font_color", Color.WHITE)
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(name_label)

	if reward > 0:
		var reward_label := Label.new()
		reward_label.text = "+%d coins" % reward
		reward_label.add_theme_font_size_override("font_size", 11)
		reward_label.add_theme_color_override("font_color", Color(0.3, 0.9, 0.3))
		reward_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(reward_label)

	get_tree().root.add_child(canvas)

	# Animate: slide in, hold, slide out
	var tw := canvas.create_tween()
	tw.tween_property(panel, "position:y", 20.0, 0.3).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
	tw.tween_interval(2.5)
	tw.tween_property(panel, "position:y", -80.0, 0.3).set_ease(Tween.EASE_IN)
	tw.tween_callback(func(): canvas.queue_free())


func _save() -> void:
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify({"unlocked": _unlocked.keys()}, "\t"))
		file.close()


func _load() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return
	var parsed = JSON.parse_string(file.get_as_text())
	file.close()
	if parsed is Dictionary:
		for id in parsed.get("unlocked", []):
			_unlocked[id] = true
