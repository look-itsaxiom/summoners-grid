extends Node
## Persistent settings + match history. Autoload as "Settings".

const SETTINGS_PATH := "user://settings.cfg"
const HISTORY_PATH := "user://match_history.json"

# Settings
var sound_enabled := true
var sound_volume := 0.5
var screen_shake_enabled := true
var show_damage_numbers := true
var ai_speed := 1.0  # 0.5 = slow, 1.0 = normal, 2.0 = fast
var ai_difficulty := 1  # 0=Easy, 1=Normal, 2=Hard
var color_blind_mode := false

# Match history
var match_history: Array = []
var total_wins := 0
var total_losses := 0
var total_draws := 0
var current_streak := 0
var best_streak := 0


func _ready() -> void:
	load_settings()
	load_history()
	_apply_audio()


func _apply_audio() -> void:
	var db: float
	if not sound_enabled or sound_volume <= 0:
		db = -80.0
	else:
		db = linear_to_db(sound_volume)
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"), db)


func save_settings() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("audio", "sound_enabled", sound_enabled)
	cfg.set_value("audio", "sound_volume", sound_volume)
	cfg.set_value("gameplay", "screen_shake", screen_shake_enabled)
	cfg.set_value("gameplay", "damage_numbers", show_damage_numbers)
	cfg.set_value("gameplay", "ai_speed", ai_speed)
	cfg.set_value("gameplay", "ai_difficulty", ai_difficulty)
	cfg.set_value("accessibility", "color_blind", color_blind_mode)
	cfg.save(SETTINGS_PATH)


func load_settings() -> void:
	var cfg := ConfigFile.new()
	if cfg.load(SETTINGS_PATH) != OK:
		return
	sound_enabled = cfg.get_value("audio", "sound_enabled", true)
	sound_volume = cfg.get_value("audio", "sound_volume", 0.5)
	screen_shake_enabled = cfg.get_value("gameplay", "screen_shake", true)
	show_damage_numbers = cfg.get_value("gameplay", "damage_numbers", true)
	ai_speed = cfg.get_value("gameplay", "ai_speed", 1.0)
	ai_difficulty = cfg.get_value("gameplay", "ai_difficulty", 1)
	color_blind_mode = cfg.get_value("accessibility", "color_blind", false)


func record_match(winner: String, turns: int, mode: String) -> void:
	var entry := {
		"winner": winner,
		"turns": turns,
		"mode": mode,
		"date": Time.get_datetime_string_from_system(),
	}
	match_history.append(entry)

	if winner == "playerA":
		total_wins += 1
		current_streak += 1
		if current_streak > best_streak:
			best_streak = current_streak
	elif winner == "playerB":
		total_losses += 1
		current_streak = 0
	else:
		total_draws += 1

	if match_history.size() > 50:
		match_history = match_history.slice(-50)
	save_history()


func save_history() -> void:
	var data := {
		"matches": match_history,
		"total_wins": total_wins,
		"total_losses": total_losses,
		"total_draws": total_draws,
		"current_streak": current_streak,
		"best_streak": best_streak,
	}
	var file := FileAccess.open(HISTORY_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data, "\t"))
		file.close()


func load_history() -> void:
	if not FileAccess.file_exists(HISTORY_PATH):
		return
	var file := FileAccess.open(HISTORY_PATH, FileAccess.READ)
	if file == null:
		return
	var parsed = JSON.parse_string(file.get_as_text())
	file.close()
	if parsed is Dictionary:
		match_history = parsed.get("matches", [])
		total_wins = parsed.get("total_wins", 0)
		total_losses = parsed.get("total_losses", 0)
		total_draws = parsed.get("total_draws", 0)
		current_streak = parsed.get("current_streak", 0)
		best_streak = parsed.get("best_streak", 0)


func get_win_rate() -> float:
	var total := total_wins + total_losses
	if total == 0:
		return 0.0
	return float(total_wins) / float(total) * 100.0


func get_stats_text() -> String:
	var text := "%dW / %dL (%.0f%% win rate, %d games)" % [
		total_wins, total_losses, get_win_rate(),
		total_wins + total_losses + total_draws
	]
	if best_streak > 0:
		text += "  |  Best streak: %d" % best_streak
	if current_streak > 1:
		text += "  |  Current: %d" % current_streak
	return text
