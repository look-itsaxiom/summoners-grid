extends Node
## GameManager autoload — game state, turn flow, placement, movement.
## Ported from src/store/gameStore.ts

signal phase_changed(new_phase: String)
signal turn_changed(turn_number: int, active_player: String)
signal game_over_signal(winner: String)
signal log_added(entry: Dictionary)
signal summon_placed(unit: Dictionary)
signal summon_moved(instance_id: String, from: Vector2i, to: Vector2i)
signal summon_defeated(unit: Dictionary)

const BOARD_WIDTH := 12
const BOARD_HEIGHT := 14
const TERRITORY_DEPTH := 3
const VP_TO_WIN := 3
const HAND_LIMIT := 6
const SUMMON_DRAW_COUNT := 3
const PHASES: Array[String] = ["draw", "level", "action", "end"]

var active_player: String = "playerA"
var phase: String = "draw"
var turn_number: int = 1
var coin_flip_winner: String = ""
var turn_order_decided: bool = false
var is_game_over: bool = false
var winner: String = ""

var players: Dictionary = {}
var board_summons: Array = []
var board_buildings: Array = []
var game_log: Array = []
var face_down_cards: Dictionary = { "playerA": [], "playerB": [] }

# Maps summon card IDs to their starting role
var summon_role_map: Dictionary = {}


func _ready() -> void:
	_reset_players()


func _reset_players() -> void:
	players = {
		"playerA": _create_empty_player("playerA"),
		"playerB": _create_empty_player("playerB"),
	}


func _create_empty_player(id: String) -> Dictionary:
	return {
		"id": id, "hand": [], "main_deck": [], "advance_deck": [],
		"discard_pile": [], "recharge_pile": [], "removed_from_play": [],
		"victory_points": 0, "summon_slots": [], "has_played_turn_summon": false,
	}


# ─── Logging ───

func add_log(message: String) -> void:
	var entry := { "turn": turn_number, "player": active_player, "message": message }
	game_log.append(entry)
	log_added.emit(entry)


# ─── Initialization ───

func initialize_game(deck_a: Dictionary, deck_b: Dictionary) -> void:
	is_game_over = false
	winner = ""
	turn_number = 1
	phase = "draw"
	game_log.clear()
	board_summons.clear()
	board_buildings.clear()
	face_down_cards = { "playerA": [], "playerB": [] }
	summon_role_map.clear()
	_reset_players()

	_init_player("playerA", deck_a)
	_init_player("playerB", deck_b)


func _init_player(pid: String, deck: Dictionary) -> void:
	var p: Dictionary = players[pid]
	for slot in deck.get("summon_slots", []):
		p["hand"].append(slot["summon"])
		p["summon_slots"].append(slot["summon"])
		# Store role mapping
		var card_id: String = slot["summon"].get("id", "")
		var role_id: String = slot.get("role_id", "warrior")
		summon_role_map[card_id] = role_id
	p["main_deck"] = deck.get("main_deck", []).duplicate(true)
	p["advance_deck"] = deck.get("advance_deck", []).duplicate(true)


func decide_turn_order(first_player: String) -> void:
	active_player = first_player
	turn_order_decided = true
	coin_flip_winner = first_player


# ─── Phase Execution ───

func advance_phase() -> void:
	var idx: int = PHASES.find(phase)
	if idx >= 0 and idx < PHASES.size() - 1:
		phase = PHASES[idx + 1]
		phase_changed.emit(phase)


func execute_draw_phase() -> void:
	# Skip draw on first turn for first player
	if turn_number == 1 and active_player == coin_flip_winner:
		add_log("First turn — draw phase skipped.")
		advance_phase()
		return

	var p: Dictionary = players[active_player]
	var drawn := _draw_cards(p, 1)

	if drawn.size() > 0:
		var names := ""
		for c in drawn:
			if names != "":
				names += ", "
			names += c.get("name", "?")
		add_log("Drew: %s" % names)
	else:
		add_log("No cards to draw.")

	advance_phase()


func execute_level_phase() -> void:
	var my_summons := _get_summons_for(active_player)

	if my_summons.size() == 0:
		add_log("No summons in play — level phase skipped.")
		advance_phase()
		return

	# Check Gignen Country building effect
	var gignen_spaces := {}
	for b in board_buildings:
		if b.get("card", {}).get("id", "") == "gignen_country" and b.get("owner", "") == active_player:
			for space in b.get("occupied_spaces", []):
				gignen_spaces["%d,%d" % [space.x, space.y]] = true

	for i in range(board_summons.size()):
		var s: Dictionary = board_summons[i]
		if s["owner"] != active_player:
			continue
		if s["level"] >= 20:
			continue

		var pos: Vector2i = s["position"]
		var is_on_gignen: bool = (
			s.get("card", {}).get("species", "") == "gignen" and
			gignen_spaces.has("%d,%d" % [pos.x, pos.y])
		)
		var levels := 2 if is_on_gignen else 1
		var leveled: Dictionary = SummonFactory.apply_level_up(s, levels)

		if is_on_gignen:
			add_log("%s levels up: %d → %d (Gignen Country bonus!) (HP: %d/%d)" % [
				s.get("card", {}).get("name", "?"), s["level"], leveled["level"],
				leveled["current_hp"], leveled["max_hp"]
			])
		else:
			add_log("%s levels up: %d → %d (HP: %d/%d)" % [
				s.get("card", {}).get("name", "?"), s["level"], leveled["level"],
				leveled["current_hp"], leveled["max_hp"]
			])

		board_summons[i] = leveled

	advance_phase()


func end_action_phase() -> void:
	phase = "end"
	phase_changed.emit(phase)
	execute_end_phase()


func execute_end_phase() -> void:
	var p: Dictionary = players[active_player]

	# Discard excess cards (hand limit = 6)
	while p["hand"].size() > HAND_LIMIT:
		var discarded: Dictionary = p["hand"].pop_back()
		p["recharge_pile"].append(discarded)
		add_log("Discarded %s (hand limit)." % discarded.get("name", "?"))

	# Territory control VP check
	var opponent := "playerB" if active_player == "playerA" else "playerA"
	var opp_y_start: int = 0 if opponent == "playerA" else BOARD_HEIGHT - TERRITORY_DEPTH
	var opp_y_end: int = TERRITORY_DEPTH if opponent == "playerA" else BOARD_HEIGHT

	var my_in_opp_territory := 0
	var opp_in_own_territory := 0
	for s in board_summons:
		var sy: int = s["position"].y
		if sy >= opp_y_start and sy < opp_y_end:
			if s["owner"] == active_player:
				my_in_opp_territory += 1
			elif s["owner"] == opponent:
				opp_in_own_territory += 1

	if my_in_opp_territory > 0 and opp_in_own_territory == 0:
		p["victory_points"] += 1
		add_log("Territory control! %s gains 1 VP (%d total)." % [
			active_player, p["victory_points"]
		])

	# Reset summon actions for next turn
	for i in range(board_summons.size()):
		var s: Dictionary = board_summons[i]
		if s["owner"] != active_player:
			continue
		s["has_attacked"] = false
		s["movement_remaining"] = Stats.calculate_movement_speed(
			s["calculated_stats"].get("SPD", 10)
		)

	# Check victory
	check_victory()
	if is_game_over:
		return

	# Switch turn
	var next_player := "playerB" if active_player == "playerA" else "playerA"
	var next_turn := turn_number + 1 if active_player == "playerB" else turn_number

	active_player = next_player
	turn_number = next_turn
	phase = "draw"
	players[next_player]["has_played_turn_summon"] = false

	add_log("--- Turn %d, %s's turn ---" % [turn_number, active_player])
	phase_changed.emit(phase)
	turn_changed.emit(turn_number, active_player)


func check_victory() -> void:
	for pid in ["playerA", "playerB"]:
		if players[pid]["victory_points"] >= VP_TO_WIN:
			is_game_over = true
			winner = pid
			add_log("%s wins with %d VP!" % [pid, players[pid]["victory_points"]])
			game_over_signal.emit(winner)
			return


# ─── Summon Placement ───

func play_summon(card_index: int, position: Vector2i) -> void:
	var p: Dictionary = players[active_player]

	if p["has_played_turn_summon"]:
		add_log("Already played a summon this turn!")
		return

	if card_index < 0 or card_index >= p["hand"].size():
		add_log("Invalid card index.")
		return

	var card: Dictionary = p["hand"][card_index]
	if card.get("card_type", "") != "summon":
		add_log("Not a summon card.")
		return

	if not _is_in_territory(position, active_player):
		add_log("Must place summon in your own territory!")
		return

	if _is_space_occupied(position):
		add_log("Space is already occupied!")
		return

	var role_id: String = summon_role_map.get(card.get("id", ""), "warrior")
	var unit: Dictionary = SummonFactory.create_summon_unit(card, active_player, position, role_id)

	# Remove from hand
	p["hand"].remove_at(card_index)
	p["has_played_turn_summon"] = true

	# Draw 3 cards
	var drawn := _draw_cards(p, SUMMON_DRAW_COUNT)

	board_summons.append(unit)
	summon_placed.emit(unit)

	var role_name: String = RolesData.get_definition(role_id).get("name", role_id)
	add_log("Played %s (%s) at (%d,%d). Drew %d cards." % [
		card.get("name", "?"), role_name, position.x, position.y, drawn.size()
	])


# ─── Movement ───

func move_summon(instance_id: String, to: Vector2i) -> void:
	var idx := _find_summon_index(instance_id)
	if idx == -1:
		return

	var unit: Dictionary = board_summons[idx]
	var from: Vector2i = unit["position"]
	var distance := _chebyshev_distance(from, to)

	if distance > unit["movement_remaining"]:
		add_log("Not enough movement remaining!")
		return

	if to.x < 0 or to.x >= BOARD_WIDTH or to.y < 0 or to.y >= BOARD_HEIGHT:
		add_log("Out of bounds!")
		return

	if _is_space_occupied(to):
		add_log("Space is occupied!")
		return

	unit["position"] = to
	unit["movement_remaining"] -= distance
	summon_moved.emit(instance_id, from, to)

	add_log("Moved %s to (%d,%d)." % [
		unit.get("card", {}).get("name", "?"), to.x, to.y
	])


# ─── Attack Resolution ───

signal attack_resolved(result: Dictionary)

func attack_with_summon(attacker_id: String, target_id: String) -> void:
	var atk_idx := _find_summon_index(attacker_id)
	var tgt_idx := _find_summon_index(target_id)
	if atk_idx == -1 or tgt_idx == -1:
		add_log("Invalid attacker or target.")
		return

	var attacker: Dictionary = board_summons[atk_idx]
	var target_unit: Dictionary = board_summons[tgt_idx]

	if attacker["owner"] != active_player:
		add_log("Not your summon!")
		return
	if attacker["has_attacked"]:
		add_log("%s has already attacked this turn!" % attacker["card"].get("name", "?"))
		return
	if target_unit["owner"] == active_player:
		add_log("Cannot attack your own summon!")
		return

	var weapon: Dictionary = attacker["card"].get("equipment", {}).get("weapon", {})
	if weapon.is_empty():
		add_log("%s has no weapon equipped!" % attacker["card"].get("name", "?"))
		return

	# Range check
	var distance := _chebyshev_distance(attacker["position"], target_unit["position"])
	var weapon_range: int = weapon.get("range", 1)
	if distance > weapon_range:
		add_log("Target out of range! (distance: %d, range: %d)" % [distance, weapon_range])
		return

	var atk_stats: Dictionary = attacker["calculated_stats"]
	var tgt_stats: Dictionary = target_unit["calculated_stats"]

	# Hit calculation
	var to_hit_pct: float = Stats.calculate_to_hit(
		weapon.get("base_accuracy", 90.0), atk_stats.get("ACC", 10)
	)
	var hit_result: Dictionary = Stats.roll_hit(to_hit_pct)

	add_log("%s attacks %s! To-hit: %.1f%%, rolled %d" % [
		attacker["card"].get("name", "?"), target_unit["card"].get("name", "?"),
		to_hit_pct, hit_result["roll"]
	])

	attacker["has_attacked"] = true

	if not hit_result["hit"]:
		add_log("Attack missed!")
		attack_resolved.emit({ "hit": false, "damage": 0 })
		return

	# Crit calculation
	var crit_pct: int = Stats.calculate_crit_chance(atk_stats.get("LCK", 10))
	var crit_result: Dictionary = Stats.roll_crit(crit_pct)
	var is_crit: bool = crit_result["crit"]

	if is_crit:
		add_log("CRITICAL HIT! (%d%% chance, rolled %d)" % [crit_pct, crit_result["roll"]])

	# Damage calculation
	var damage: int = 0
	var damage_type: String = weapon.get("damage_type", "physical_melee")
	var weapon_power: int = weapon.get("base_power", 0)

	if damage_type == "physical_melee":
		damage = Stats.calculate_physical_melee_damage(
			atk_stats.get("STR", 10), weapon_power, tgt_stats.get("DEF", 10), is_crit
		)
	elif damage_type == "physical_ranged":
		damage = Stats.calculate_physical_ranged_damage(
			atk_stats.get("STR", 10), atk_stats.get("ACC", 10),
			weapon_power, tgt_stats.get("DEF", 10), is_crit
		)
	else:  # magical
		damage = Stats.calculate_magical_damage(
			atk_stats.get("INT", 10), weapon_power, tgt_stats.get("MDF", 10), is_crit
		)

	# Elemental advantage
	var atk_element: String = weapon.get("element", "neutral")
	var def_element: String = target_unit["card"].get("element", "neutral")
	var elem_mult: float = Stats.get_element_multiplier(atk_element, def_element)
	if elem_mult > 1.0:
		damage = floori(damage * elem_mult)
		add_log("Elemental advantage! (%s > %s) x1.25" % [atk_element, def_element])

	add_log("Deals %d damage!" % damage)

	var new_hp: int = target_unit["current_hp"] - damage
	var defeated: bool = new_hp <= 0

	if defeated:
		add_log("%s is defeated!" % target_unit["card"].get("name", "?"))
		board_summons.remove_at(tgt_idx)

		# Award VP based on role tier
		var role_def: Dictionary = RolesData.get_definition(target_unit["current_role"])
		var vp_gain: int = 2 if role_def.get("tier", 1) >= 2 else 1
		players[active_player]["victory_points"] += vp_gain

		# Move card to removed from play
		var target_owner: String = target_unit["owner"]
		players[target_owner]["removed_from_play"].append(target_unit["card"])

		add_log("%s gains %d VP! (%d total)" % [
			active_player, vp_gain, players[active_player]["victory_points"]
		])

		summon_defeated.emit(target_unit)
		check_victory()
	else:
		target_unit["current_hp"] = maxi(0, new_hp)
		add_log("%s HP: %d/%d" % [
			target_unit["card"].get("name", "?"), target_unit["current_hp"], target_unit["max_hp"]
		])

	attack_resolved.emit({
		"hit": true, "crit": is_crit, "damage": damage,
		"defeated": defeated, "attacker": attacker_id, "target": target_id,
	})


## Get valid attack targets for a summon.
func get_valid_attacks(instance_id: String) -> Array[String]:
	var idx := _find_summon_index(instance_id)
	if idx == -1:
		return []

	var unit: Dictionary = board_summons[idx]
	if unit["has_attacked"]:
		return []

	var weapon: Dictionary = unit["card"].get("equipment", {}).get("weapon", {})
	if weapon.is_empty():
		return []

	var weapon_range: int = weapon.get("range", 1)
	var result: Array[String] = []

	for s in board_summons:
		if s["owner"] == unit["owner"]:
			continue
		if _chebyshev_distance(unit["position"], s["position"]) <= weapon_range:
			result.append(s["instance_id"])
	return result


# ─── Helpers ───

func _is_in_territory(pos: Vector2i, player_id: String) -> bool:
	if player_id == "playerA":
		return pos.y >= 0 and pos.y < TERRITORY_DEPTH
	else:
		return pos.y >= BOARD_HEIGHT - TERRITORY_DEPTH and pos.y < BOARD_HEIGHT


func _is_space_occupied(pos: Vector2i) -> bool:
	for s in board_summons:
		if s["position"] == pos:
			return true
	for b in board_buildings:
		for space in b.get("occupied_spaces", []):
			if space == pos:
				return true
	return false


func _chebyshev_distance(a: Vector2i, b: Vector2i) -> int:
	return maxi(absi(a.x - b.x), absi(a.y - b.y))


func _find_summon_index(instance_id: String) -> int:
	for i in range(board_summons.size()):
		if board_summons[i]["instance_id"] == instance_id:
			return i
	return -1


func _get_summons_for(player_id: String) -> Array:
	var result: Array = []
	for s in board_summons:
		if s["owner"] == player_id:
			result.append(s)
	return result


func _draw_cards(player: Dictionary, count: int) -> Array:
	var drawn: Array = []
	for i in range(count):
		if player["main_deck"].size() == 0:
			# Shuffle recharge pile into main deck
			if player["recharge_pile"].size() == 0:
				break
			player["main_deck"] = player["recharge_pile"].duplicate(true)
			player["recharge_pile"].clear()
			player["main_deck"].shuffle()
			add_log("Recharge pile shuffled into main deck.")

		if player["main_deck"].size() > 0:
			var card: Dictionary = player["main_deck"].pop_front()
			player["hand"].append(card)
			drawn.append(card)
	return drawn


## Get valid placement positions for the active player.
func get_valid_placements() -> Array[Vector2i]:
	var result: Array[Vector2i] = []
	var y_start: int = 0 if active_player == "playerA" else BOARD_HEIGHT - TERRITORY_DEPTH
	var y_end: int = TERRITORY_DEPTH if active_player == "playerA" else BOARD_HEIGHT

	for y in range(y_start, y_end):
		for x in range(BOARD_WIDTH):
			var pos := Vector2i(x, y)
			if not _is_space_occupied(pos):
				result.append(pos)
	return result


## Get valid movement positions for a summon unit.
func get_valid_moves(instance_id: String) -> Array[Vector2i]:
	var idx := _find_summon_index(instance_id)
	if idx == -1:
		return []

	var unit: Dictionary = board_summons[idx]
	var pos: Vector2i = unit["position"]
	var move_range: int = unit["movement_remaining"]
	var result: Array[Vector2i] = []

	for dx in range(-move_range, move_range + 1):
		for dy in range(-move_range, move_range + 1):
			if dx == 0 and dy == 0:
				continue
			var dist := maxi(absi(dx), absi(dy))
			if dist > move_range:
				continue
			var target := Vector2i(pos.x + dx, pos.y + dy)
			if target.x < 0 or target.x >= BOARD_WIDTH:
				continue
			if target.y < 0 or target.y >= BOARD_HEIGHT:
				continue
			if not _is_space_occupied(target):
				result.append(target)
	return result
