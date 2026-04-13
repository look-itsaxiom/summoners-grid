extends Node
## Daily challenge system — a new challenge every day with bonus coin reward.
## Autoload as "DailyChallenge".

const SAVE_PATH := "user://daily_challenge.json"

# Challenge templates
const CHALLENGES := [
	{ "id": "speed_run", "name": "Speed Run", "description": "Win a game in 6 turns or fewer", "reward": 200 },
	{ "id": "flawless", "name": "Flawless", "description": "Win without losing any summons", "reward": 300 },
	{ "id": "underdog", "name": "Underdog", "description": "Win on Hard difficulty", "reward": 250 },
	{ "id": "card_master", "name": "Card Master", "description": "Play 5 or more action cards in one game", "reward": 150 },
	{ "id": "territory", "name": "Territory Control", "description": "Win by territory VP (attack enemy territory)", "reward": 200 },
	{ "id": "random_hero", "name": "Random Hero", "description": "Win a Random Deck game", "reward": 150 },
	{ "id": "triple_kill", "name": "Triple Kill", "description": "Defeat 3 enemy summons in one game", "reward": 200 },
]

var today_challenge: Dictionary = {}
var completed_today := false
var _last_date: String = ""

signal challenge_completed(challenge: Dictionary, reward: int)


func _ready() -> void:
	_load()
	_refresh_challenge()


func _refresh_challenge() -> void:
	var today := Time.get_date_string_from_system()
	if today != _last_date:
		_last_date = today
		completed_today = false
		# Pick challenge based on day hash for consistency
		var day_hash: int = today.hash()
		var idx: int = absi(day_hash) % CHALLENGES.size()
		today_challenge = CHALLENGES[idx].duplicate()
		_save()


func get_challenge() -> Dictionary:
	_refresh_challenge()
	return today_challenge


func is_completed() -> bool:
	_refresh_challenge()
	return completed_today


## Check if a match result satisfies today's challenge.
func check_match(winner: String, turns: int, mode: String, summons_lost: int, cards_played: int, enemy_defeats: int, territory_vp: bool) -> bool:
	if completed_today or today_challenge.is_empty():
		return false
	if winner != "playerA":
		return false

	var satisfied := false
	var settings = get_node_or_null("/root/Settings")
	var difficulty: int = settings.ai_difficulty if settings else 1

	match today_challenge["id"]:
		"speed_run":
			satisfied = turns <= 6
		"flawless":
			satisfied = summons_lost == 0
		"underdog":
			satisfied = difficulty == 2
		"card_master":
			satisfied = cards_played >= 5
		"territory":
			satisfied = territory_vp
		"random_hero":
			satisfied = mode == "random"
		"triple_kill":
			satisfied = enemy_defeats >= 3

	if satisfied:
		completed_today = true
		var reward: int = today_challenge.get("reward", 0)
		var storage = get_node_or_null("/root/CardStorage")
		if storage and reward > 0:
			storage._coins += reward
			storage._save()
		challenge_completed.emit(today_challenge, reward)
		_save()

	return satisfied


func _save() -> void:
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify({
			"date": _last_date,
			"challenge_id": today_challenge.get("id", ""),
			"completed": completed_today,
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
		_last_date = parsed.get("date", "")
		completed_today = parsed.get("completed", false)
		var saved_id: String = parsed.get("challenge_id", "")
		for c in CHALLENGES:
			if c["id"] == saved_id:
				today_challenge = c.duplicate()
				break
