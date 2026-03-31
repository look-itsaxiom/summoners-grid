extends Node
## GameManager autoload — holds game state and orchestrates turn flow.

signal phase_changed(new_phase: String)
signal turn_changed(turn_number: int, active_player: String)
signal game_over_signal(winner: String)
signal log_added(entry: Dictionary)

const VP_TO_WIN := 3
const PHASES: Array[String] = ["draw", "level", "action", "end"]

var active_player: String = "playerA"
var phase: String = "draw"
var turn_number: int = 1
var coin_flip_winner: String = ""
var turn_order_decided: bool = false
var is_game_over: bool = false
var winner: String = ""

var players: Dictionary = {
	"playerA": _create_empty_player("playerA"),
	"playerB": _create_empty_player("playerB"),
}

var board_summons: Array = []
var board_buildings: Array = []
var game_log: Array = []
var face_down_cards: Dictionary = { "playerA": [], "playerB": [] }


func _create_empty_player(id: String) -> Dictionary:
	return {
		"id": id,
		"hand": [],
		"main_deck": [],
		"advance_deck": [],
		"discard_pile": [],
		"recharge_pile": [],
		"removed_from_play": [],
		"victory_points": 0,
		"summon_slots": [],
		"has_played_turn_summon": false,
	}


func add_log(message: String) -> void:
	var entry := {
		"turn": turn_number,
		"player": active_player,
		"message": message,
	}
	game_log.append(entry)
	log_added.emit(entry)


func initialize_game(deck_a: Dictionary, deck_b: Dictionary) -> void:
	is_game_over = false
	winner = ""
	turn_number = 1
	phase = "draw"
	game_log.clear()
	board_summons.clear()
	board_buildings.clear()
	face_down_cards = { "playerA": [], "playerB": [] }

	players["playerA"] = _create_empty_player("playerA")
	players["playerB"] = _create_empty_player("playerB")

	for slot in deck_a.get("summon_slots", []):
		players["playerA"]["hand"].append(slot["summon"])
		players["playerA"]["summon_slots"].append(slot["summon"])
	players["playerA"]["main_deck"] = deck_a.get("main_deck", []).duplicate(true)
	players["playerA"]["advance_deck"] = deck_a.get("advance_deck", []).duplicate(true)

	for slot in deck_b.get("summon_slots", []):
		players["playerB"]["hand"].append(slot["summon"])
		players["playerB"]["summon_slots"].append(slot["summon"])
	players["playerB"]["main_deck"] = deck_b.get("main_deck", []).duplicate(true)
	players["playerB"]["advance_deck"] = deck_b.get("advance_deck", []).duplicate(true)


func decide_turn_order(first_player: String) -> void:
	active_player = first_player
	turn_order_decided = true
	coin_flip_winner = first_player


func advance_phase() -> void:
	var idx: int = PHASES.find(phase)
	if idx >= 0 and idx < PHASES.size() - 1:
		phase = PHASES[idx + 1]
		phase_changed.emit(phase)


func check_victory() -> void:
	for pid in ["playerA", "playerB"]:
		if players[pid]["victory_points"] >= VP_TO_WIN:
			is_game_over = true
			winner = pid
			add_log("%s wins with %d VP!" % [pid, players[pid]["victory_points"]])
			game_over_signal.emit(winner)
			return


func switch_turn() -> void:
	var next_player := "playerB" if active_player == "playerA" else "playerA"
	if active_player == "playerB":
		turn_number += 1
	active_player = next_player
	phase = "draw"
	phase_changed.emit(phase)
	turn_changed.emit(turn_number, active_player)
