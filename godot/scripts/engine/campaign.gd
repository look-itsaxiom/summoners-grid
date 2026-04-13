extends Node
## Campaign mode — 5 battles with increasing difficulty and story.
## Autoload as "Campaign".

const SAVE_PATH := "user://campaign.json"

const STAGES := [
	{
		"name": "The First Summoning",
		"description": "Your journey begins. A rival summoner challenges you in the training grounds.",
		"difficulty": 0,
		"reward": 200,
		"enemy_deck": "default",
	},
	{
		"name": "Border Skirmish",
		"description": "Wilderling raiders threaten the northern border. Defend your territory.",
		"difficulty": 1,
		"reward": 300,
		"enemy_deck": "default",
	},
	{
		"name": "The Stoneheart Fortress",
		"description": "Deep in the mountains, the Stoneheart clan guards an ancient artifact.",
		"difficulty": 1,
		"reward": 400,
		"enemy_deck": "default",
	},
	{
		"name": "Demar's Gambit",
		"description": "The trickster Demar challenge you to a game of wits and fire. Nothing is as it seems.",
		"difficulty": 2,
		"reward": 500,
		"enemy_deck": "default",
	},
	{
		"name": "The Grand Tournament",
		"description": "The champion of the realm awaits. Win here, and your name will be legend.",
		"difficulty": 2,
		"reward": 1000,
		"enemy_deck": "default",
	},
]

var current_stage := 0
var completed_stages: Array = []

signal stage_completed(stage_index: int, reward: int)


func _ready() -> void:
	_load()


func get_current_stage() -> Dictionary:
	if current_stage >= STAGES.size():
		return {}
	return STAGES[current_stage]


func get_stage_count() -> int:
	return STAGES.size()


func is_campaign_complete() -> bool:
	return current_stage >= STAGES.size()


func get_progress_text() -> String:
	if is_campaign_complete():
		return "Campaign Complete!"
	return "Stage %d/%d: %s" % [current_stage + 1, STAGES.size(), STAGES[current_stage]["name"]]


func complete_current_stage() -> int:
	if current_stage >= STAGES.size():
		return 0

	var stage: Dictionary = STAGES[current_stage]
	var reward: int = stage.get("reward", 0)
	completed_stages.append(current_stage)

	var storage = get_node_or_null("/root/CardStorage")
	if storage and reward > 0:
		storage.add_coins(reward)

	stage_completed.emit(current_stage, reward)
	current_stage += 1
	_save()
	return reward


func get_difficulty_for_current() -> int:
	if current_stage >= STAGES.size():
		return 1
	return STAGES[current_stage].get("difficulty", 1)


func _save() -> void:
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify({
			"current_stage": current_stage,
			"completed": completed_stages,
		}, "\t"))
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
		current_stage = parsed.get("current_stage", 0)
		completed_stages = parsed.get("completed", [])
