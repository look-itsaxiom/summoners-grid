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
signal effect_stack_changed(stack: Array)
signal effect_resolved(entry: Dictionary)
signal summon_leveled(unit: Dictionary, old_level: int, new_level: int)

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
var spectator_mode: bool = false
var use_random_decks: bool = false
var _custom_deck_a: Dictionary = {}  # Set by deck builder, used instead of default deck
var coin_flip_winner: String = ""
var turn_order_decided: bool = false
var is_game_over: bool = false
var winner: String = ""

var players: Dictionary = {}
var board_summons: Array = []
var board_buildings: Array = []
var game_log: Array = []
var face_down_cards: Dictionary = { "playerA": [], "playerB": [] }

# Effect Stack — LIFO resolution per GDD
# Each entry: { id, speed, source, source_owner, effects, targets, resolved }
var effect_stack: Array = []
const SPEED_PRIORITY := { "action": 1, "reaction": 2, "counter": 3 }

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
	effect_stack.clear()
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
		var old_level: int = s["level"]
		var leveled: Dictionary = SummonFactory.apply_level_up(s, levels)

		if is_on_gignen:
			add_log("%s levels up: %d → %d (Gignen Country bonus!) (HP: %d/%d)" % [
				s.get("card", {}).get("name", "?"), old_level, leveled["level"],
				leveled["current_hp"], leveled["max_hp"]
			])
		else:
			add_log("%s levels up: %d → %d (HP: %d/%d)" % [
				s.get("card", {}).get("name", "?"), old_level, leveled["level"],
				leveled["current_hp"], leveled["max_hp"]
			])

		board_summons[i] = leveled
		summon_leveled.emit(leveled, old_level, leveled["level"])

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


# ─── Card Play System ───

signal card_played(card: Dictionary)

func play_card(card_index: int, target_ids: Array = []) -> void:
	var p: Dictionary = players[active_player]

	if card_index < 0 or card_index >= p["hand"].size():
		add_log("Invalid card index.")
		return

	var card: Dictionary = p["hand"][card_index]
	var card_type: String = card.get("card_type", "")

	if card_type == "summon":
		add_log("Use play_summon for summon cards.")
		return

	# Remove from hand
	p["hand"].remove_at(card_index)

	# Send to appropriate pile
	var dest: String = card.get("pile_destination", "recharge")
	if dest == "discard":
		p["discard_pile"].append(card)
	elif dest == "recharge":
		p["recharge_pile"].append(card)

	add_log("Played %s." % card.get("name", "?"))
	card_played.emit(card)

	# Resolve based on card type
	var target_unit: Dictionary = {}
	if target_ids.size() > 0:
		var tgt_idx := _find_summon_index(target_ids[0])
		if tgt_idx >= 0:
			target_unit = board_summons[tgt_idx]

	if card_type == "action":
		# Push to effect stack instead of resolving inline
		if push_to_stack(card, active_player, target_ids):
			# Auto-resolve if no opponent response expected (AI games, etc.)
			# In a full implementation, wait for opponent response window.
			# For now: resolve immediately to maintain existing behavior.
			resolve_effect_stack()
		else:
			add_log("Failed to push %s to stack." % card.get("name", "?"))
	elif card_type == "quest" and not target_unit.is_empty():
		_resolve_quest_card(card, target_unit)
	elif card_type == "building":
		_resolve_building_card(card)


func _resolve_action_card(card: Dictionary, target_unit: Dictionary) -> void:
	# Find caster (first summon matching role family requirement, or first summon)
	var my_summons := _get_summons_for(active_player)
	var caster: Dictionary = {}

	for req in card.get("requirements", []):
		var req_family: String = req.get("role_family", "")
		if req_family != "":
			for s in my_summons:
				var role_def: Dictionary = RolesData.get_definition(s["current_role"])
				if role_def.get("family", "") == req_family:
					caster = s
					break
		if not caster.is_empty():
			break

	if caster.is_empty() and my_summons.size() > 0:
		caster = my_summons[0]

	# Resolve each effect
	for effect in card.get("effects", []):
		# Re-find target (may have been defeated)
		var tgt_idx := _find_summon_index(target_unit["instance_id"])
		if tgt_idx == -1:
			break
		var current_target: Dictionary = board_summons[tgt_idx]

		var effect_type: String = effect.get("type", "")

		if effect_type == "damage":
			_resolve_damage_effect(card, effect, caster, current_target)
		elif effect_type == "heal":
			_resolve_heal_effect(effect, caster, current_target)
		elif effect_type == "buff":
			_resolve_buff_effect(card, effect, current_target)
		elif effect_type == "debuff":
			add_log("%s: %s" % [current_target["card"].get("name", "?"), effect.get("description", "")])
		else:
			add_log("Effect: %s" % effect.get("description", ""))


func _resolve_damage_effect(card: Dictionary, effect: Dictionary, caster: Dictionary, target_unit: Dictionary) -> void:
	if caster.is_empty():
		return

	var caster_stats: Dictionary = caster["calculated_stats"]
	var target_stats: Dictionary = target_unit["calculated_stats"]

	# Hit check
	var to_hit_pct: float = Stats.calculate_to_hit(85.0, caster_stats.get("ACC", 10))
	var hit_result: Dictionary = Stats.roll_hit(to_hit_pct)
	add_log("To-hit: %.1f%%, rolled %d" % [to_hit_pct, hit_result["roll"]])

	if not hit_result["hit"]:
		add_log("Attack missed!")
		return

	# Crit
	var is_crit := false
	if effect.get("can_crit", false):
		var crit_pct: int = Stats.calculate_crit_chance(caster_stats.get("LCK", 10))
		var crit_result: Dictionary = Stats.roll_crit(crit_pct)
		is_crit = crit_result["crit"]
		if is_crit:
			add_log("CRITICAL HIT! (%d%%)" % crit_pct)

	# Damage
	var bp: int = effect.get("base_power", 0)
	var damage: int = 0
	var dmg_type: String = effect.get("damage_type", "magical")

	if dmg_type == "magical":
		damage = Stats.calculate_magical_damage(caster_stats.get("INT", 10), bp, target_stats.get("MDF", 10), is_crit)
	else:
		damage = Stats.calculate_physical_melee_damage(caster_stats.get("STR", 10), bp, target_stats.get("DEF", 10), is_crit)

	# Elemental advantage
	var spell_element: String = effect.get("element", card.get("element", "neutral"))
	var def_element: String = target_unit["card"].get("element", "neutral")
	var elem_mult: float = Stats.get_element_multiplier(spell_element, def_element)
	if elem_mult > 1.0:
		damage = floori(damage * elem_mult)
		add_log("Elemental advantage! x1.25")

	add_log("Deals %d damage!" % damage)

	var new_hp: int = target_unit["current_hp"] - damage
	if new_hp <= 0:
		_handle_defeat(target_unit)
	else:
		target_unit["current_hp"] = maxi(0, new_hp)
		add_log("%s HP: %d/%d" % [target_unit["card"].get("name", "?"), target_unit["current_hp"], target_unit["max_hp"]])


func _resolve_heal_effect(effect: Dictionary, caster: Dictionary, target_unit: Dictionary) -> void:
	if caster.is_empty():
		return

	var caster_stats: Dictionary = caster["calculated_stats"]
	var is_crit := false
	if effect.get("can_crit", false):
		var crit_pct: int = Stats.calculate_crit_chance(caster_stats.get("LCK", 10))
		var crit_result: Dictionary = Stats.roll_crit(crit_pct)
		is_crit = crit_result["crit"]
		if is_crit:
			add_log("Critical heal! (%d%%)" % crit_pct)

	var bp: int = effect.get("base_power", 0)
	var heal_amount: int = Stats.calculate_healing(caster_stats.get("SPI", 10), bp, is_crit)
	var actual_heal: int = mini(target_unit["max_hp"] - target_unit["current_hp"], heal_amount)
	target_unit["current_hp"] += actual_heal
	add_log("%s heals %d HP (%d/%d)" % [
		target_unit["card"].get("name", "?"), actual_heal,
		target_unit["current_hp"], target_unit["max_hp"]
	])


func _resolve_buff_effect(card: Dictionary, effect: Dictionary, target_unit: Dictionary) -> void:
	# Special: Sharpened Blade — increase weapon base power by 10
	if card.get("id", "") == "sharpened_blade":
		var weapon: Dictionary = target_unit["card"].get("equipment", {}).get("weapon", {})
		if not weapon.is_empty():
			var old_power: int = weapon.get("base_power", 0)
			weapon["base_power"] = old_power + 10
			add_log("%s's weapon power increased by 10! (now %d)" % [
				target_unit["card"].get("name", "?"), weapon["base_power"]
			])
			return
	add_log("%s gains: %s" % [target_unit["card"].get("name", "?"), effect.get("description", "")])


func _resolve_quest_card(card: Dictionary, target_unit: Dictionary) -> void:
	var rewards: Array = card.get("reward_effects", [])
	if rewards.size() > 0:
		var tgt_idx := _find_summon_index(target_unit["instance_id"])
		if tgt_idx >= 0:
			var leveled: Dictionary = SummonFactory.apply_level_up(board_summons[tgt_idx], 2)
			add_log("%s gains 2 levels: %d → %d" % [
				target_unit["card"].get("name", "?"), target_unit["level"], leveled["level"]
			])
			board_summons[tgt_idx] = leveled

	# VP reward
	var vp: int = card.get("vp_reward", 0)
	if vp > 0:
		players[active_player]["victory_points"] += vp
		add_log("%s gains %d VP from quest! (%d total)" % [
			active_player, vp, players[active_player]["victory_points"]
		])
		check_victory()


func _resolve_building_card(card: Dictionary) -> void:
	# Buildings are placed on the board — simplified for now
	add_log("Building %s placed." % card.get("name", "?"))


func _handle_defeat(unit: Dictionary) -> void:
	add_log("%s is defeated!" % unit["card"].get("name", "?"))

	# Remove from board
	var idx := _find_summon_index(unit["instance_id"])
	if idx >= 0:
		board_summons.remove_at(idx)

	# Check Iron Will / Dramatic Return triggers BEFORE VP award
	check_triggers("summon_defeated", {
		"defeated_unit": unit, "target_owner": unit["owner"],
	})

	# If Iron Will/Dramatic Return revived the unit, skip VP
	if _find_summon_index(unit["instance_id"]) >= 0:
		add_log("%s was saved by a counter!" % unit["card"].get("name", "?"))
		summon_defeated.emit(unit)
		return

	# Award VP
	var role_def: Dictionary = RolesData.get_definition(unit["current_role"])
	var vp_gain: int = 2 if role_def.get("tier", 1) >= 2 else 1
	players[active_player]["victory_points"] += vp_gain

	# Move card to removed from play
	players[unit["owner"]]["removed_from_play"].append(unit["card"])

	add_log("%s gains %d VP! (%d total)" % [
		active_player, vp_gain, players[active_player]["victory_points"]
	])

	# Check VP triggers (Graverobbing)
	check_triggers("victory_point_gained", {
		"gainer": active_player, "target_owner": unit["owner"],
	})

	summon_defeated.emit(unit)
	check_victory()


# ─── Advance Cards (Role Advancement) ───

func get_playable_advance_cards() -> Array:
	## Returns array of { "index": int, "card": Dict, "valid_targets": Array[Dict] }
	var p: Dictionary = players[active_player]
	var advance_deck: Array = p.get("advance_deck", [])
	var my_summons := _get_summons_for(active_player)
	var results: Array = []

	for i in range(advance_deck.size()):
		var card: Dictionary = advance_deck[i]
		var valid_targets: Array = []

		for unit in my_summons:
			var meets_reqs := true
			for req in card.get("requirements", []):
				var req_type: String = req.get("type", "")
				if req_type == "role":
					var req_role_id: String = req.get("role_id", "")
					if req_role_id != "" and unit["current_role"] != req_role_id:
						meets_reqs = false
					var req_family: String = req.get("role_family", "")
					if req_family != "":
						var role_def: Dictionary = RolesData.get_definition(unit["current_role"])
						if role_def.get("family", "") != req_family:
							meets_reqs = false
				if req_type == "level":
					var min_level: int = req.get("min_level", 0)
					if unit["level"] < min_level:
						meets_reqs = false
			if meets_reqs:
				valid_targets.append(unit)

		if valid_targets.size() > 0:
			results.append({ "index": i, "card": card, "valid_targets": valid_targets })

	return results


func play_advance_card(advance_index: int, target_unit_id: String) -> void:
	var p: Dictionary = players[active_player]
	var advance_deck: Array = p.get("advance_deck", [])

	if advance_index < 0 or advance_index >= advance_deck.size():
		add_log("Invalid advance card.")
		return

	var card: Dictionary = advance_deck[advance_index]
	var tgt_idx := _find_summon_index(target_unit_id)
	if tgt_idx == -1:
		add_log("Invalid target for advance card.")
		return

	var unit: Dictionary = board_summons[tgt_idx]
	if unit["owner"] != active_player:
		add_log("Not your summon!")
		return

	# Remove from advance deck, send to discard
	advance_deck.remove_at(advance_index)
	p["discard_pile"].append(card)

	var advance_type: String = card.get("advance_type", "role_change")
	var target_role: String = card.get("target_role", "")

	if advance_type == "role_change" and target_role != "":
		var advanced: Dictionary = SummonFactory.apply_role_advance(unit, target_role)
		board_summons[tgt_idx] = advanced

		var role_name: String = RolesData.get_definition(target_role).get("name", target_role)
		add_log("%s advances to %s! (HP: %d/%d)" % [
			unit["card"].get("name", "?"), role_name,
			advanced["current_hp"], advanced["max_hp"]
		])

	card_played.emit(card)


## Set a counter/reaction card face-down.
func set_face_down(card_index: int) -> void:
	var p: Dictionary = players[active_player]
	if card_index < 0 or card_index >= p["hand"].size():
		return

	var card: Dictionary = p["hand"][card_index]
	var ct: String = card.get("card_type", "")
	if ct != "counter" and ct != "reaction":
		add_log("Only counter/reaction cards can be set face-down.")
		return

	p["hand"].remove_at(card_index)
	face_down_cards[active_player].append(card)
	add_log("Set %s face-down." % card.get("name", "?"))


## Check both players' face-down cards for matching triggers.
func check_triggers(event: String, context: Dictionary = {}) -> void:
	for player_id in ["playerA", "playerB"]:
		var fd: Array = face_down_cards.get(player_id, [])
		if fd.size() == 0:
			continue

		for i in range(fd.size() - 1, -1, -1):
			var card: Dictionary = fd[i]
			if card.get("card_type", "") != "counter":
				continue
			if card.get("trigger_condition", "") != event:
				continue

			# Trigger!
			add_log("%s activates counter: %s!" % [player_id, card.get("name", "?")])
			fd.remove_at(i)

			var dest: String = card.get("pile_destination", "discard")
			if dest == "discard":
				players[player_id]["discard_pile"].append(card)

			# Resolve by card ID
			match card.get("id", ""):
				"dramatic_return":
					_trigger_dramatic_return(player_id, context)
				"graverobbing":
					_trigger_graverobbing(context)
				"iron_will":
					_trigger_iron_will(context)
				_:
					add_log("Counter effect: %s" % card.get("description", ""))
			return  # Only one trigger per event


func _trigger_dramatic_return(player_id: String, context: Dictionary) -> void:
	var defeated_unit: Dictionary = context.get("defeated_unit", {})
	if defeated_unit.is_empty():
		return

	var revive_hp: int = maxi(1, floori(defeated_unit.get("max_hp", 100) * 0.1))
	var owner: String = defeated_unit.get("owner", player_id)

	# Find territory position
	var y_start: int = 0 if owner == "playerA" else BOARD_HEIGHT - TERRITORY_DEPTH
	var y_end: int = TERRITORY_DEPTH if owner == "playerA" else BOARD_HEIGHT

	for y in range(y_start, y_end):
		for x in range(BOARD_WIDTH):
			var pos := Vector2i(x, y)
			if not _is_space_occupied(pos):
				defeated_unit["current_hp"] = revive_hp
				defeated_unit["position"] = pos
				board_summons.append(defeated_unit)
				add_log("%s returns at (%d,%d) with %d HP!" % [
					defeated_unit["card"].get("name", "?"), x, y, revive_hp
				])
				return


func _trigger_graverobbing(context: Dictionary) -> void:
	var gainer: String = context.get("gainer", "")
	if gainer == "" or not players.has(gainer):
		return
	if players[gainer]["victory_points"] > 0:
		players[gainer]["victory_points"] -= 1
		add_log("Graverobbing nullifies VP! %s back to %d VP." % [
			gainer, players[gainer]["victory_points"]
		])


func _trigger_iron_will(context: Dictionary) -> void:
	var unit: Dictionary = context.get("defeated_unit", {})
	if unit.is_empty():
		return
	# Revive with 1 HP in place
	unit["current_hp"] = 1
	board_summons.append(unit)
	add_log("%s survives with Iron Will! (1 HP)" % unit["card"].get("name", "?"))


# ─── Effect Stack (LIFO) ───

## Check if a card at given speed can be pushed onto the stack.
## Speed Lock: only same or higher speed allowed when stack is non-empty.
func can_push_to_stack(speed: String) -> bool:
	if effect_stack.is_empty():
		return true
	var top_speed: String = effect_stack.back().get("speed", "action")
	return SPEED_PRIORITY.get(speed, 0) >= SPEED_PRIORITY.get(top_speed, 0)


## Push a card effect onto the stack. Returns false if speed-locked.
func push_to_stack(card: Dictionary, source_owner: String, target_ids: Array = []) -> bool:
	var speed: String = card.get("speed", "action")
	if not can_push_to_stack(speed):
		add_log("Speed Lock! Cannot play %s-speed card while %s-speed is on the stack." % [
			speed, effect_stack.back().get("speed", "?")])
		return false

	var entry := {
		"id": card.get("id", ""),
		"speed": speed,
		"source": card,
		"source_owner": source_owner,
		"effects": card.get("effects", []),
		"targets": target_ids,
		"resolved": false,
	}
	effect_stack.append(entry)
	add_log("→ %s pushed to effect stack (%s speed)" % [card.get("name", "?"), speed])
	effect_stack_changed.emit(effect_stack)
	return true


## Resolve the entire effect stack LIFO. Called when both players pass.
func resolve_effect_stack() -> void:
	if effect_stack.is_empty():
		return

	add_log("— Resolving effect stack (%d entries) —" % effect_stack.size())

	while effect_stack.size() > 0:
		var entry: Dictionary = effect_stack.pop_back()
		if entry.get("resolved", false):
			continue

		var card: Dictionary = entry.get("source", {})
		var owner: String = entry.get("source_owner", "")
		var targets: Array = entry.get("targets", [])

		add_log("Resolving: %s (owner: %s)" % [card.get("name", "?"), owner])

		# Determine target unit
		var target_unit: Dictionary = {}
		if targets.size() > 0:
			var tgt_idx := _find_summon_index(targets[0])
			if tgt_idx >= 0:
				target_unit = board_summons[tgt_idx]

		# Find caster from owner's summons
		var caster: Dictionary = _find_caster_for(card, owner)

		# Resolve effects
		for effect in entry.get("effects", []):
			if not target_unit.is_empty():
				# Re-check target is still alive
				var tgt_idx := _find_summon_index(target_unit["instance_id"])
				if tgt_idx == -1:
					add_log("Target no longer on board, skipping effect.")
					break
				target_unit = board_summons[tgt_idx]

			var effect_type: String = effect.get("type", "")
			if effect_type == "damage" and not target_unit.is_empty():
				_resolve_damage_effect(card, effect, caster, target_unit)
			elif effect_type == "heal" and not target_unit.is_empty():
				_resolve_heal_effect(effect, caster, target_unit)
			elif effect_type == "buff" and not target_unit.is_empty():
				_resolve_buff_effect(card, effect, target_unit)
			elif effect_type == "debuff" and not target_unit.is_empty():
				add_log("%s: %s" % [target_unit["card"].get("name", "?"), effect.get("description", "")])
			else:
				add_log("Effect: %s" % effect.get("description", ""))

		entry["resolved"] = true
		effect_resolved.emit(entry)

	add_log("— Effect stack resolved —")
	effect_stack_changed.emit(effect_stack)


## Find the best caster summon for a card from a player's board units.
func _find_caster_for(card: Dictionary, owner: String) -> Dictionary:
	var my_summons := _get_summons_for(owner)
	var caster: Dictionary = {}

	for req in card.get("requirements", []):
		var req_family: String = req.get("role_family", "")
		if req_family != "":
			for s in my_summons:
				var role_def: Dictionary = RolesData.get_definition(s["current_role"])
				if role_def.get("family", "") == req_family:
					caster = s
					break
		if not caster.is_empty():
			break

	if caster.is_empty() and my_summons.size() > 0:
		caster = my_summons[0]
	return caster


## Check if the effect stack is empty (both players can take new actions).
func is_stack_empty() -> bool:
	return effect_stack.is_empty()


## Get the current top speed level on the stack ("" if empty).
func get_stack_top_speed() -> String:
	if effect_stack.is_empty():
		return ""
	return effect_stack.back().get("speed", "action")


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
		attack_resolved.emit({ "hit": false, "damage": 0, "attacker": attacker_id, "target": target_id })
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
		_handle_defeat(target_unit)
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


# ─── Save / Load ───

const SAVE_PATH := "user://savegame.json"

func save_game() -> bool:
	var data := {
		"version": 1,
		"active_player": active_player,
		"phase": phase,
		"turn_number": turn_number,
		"is_game_over": is_game_over,
		"winner": winner,
		"spectator_mode": spectator_mode,
		"players": players,
		"board_summons": board_summons,
		"board_buildings": board_buildings,
		"face_down_cards": face_down_cards,
		"effect_stack": effect_stack,
		"summon_role_map": summon_role_map,
	}

	var json := JSON.stringify(data, "\t")
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_error("Failed to save: %s" % FileAccess.get_open_error())
		return false
	file.store_string(json)
	file.close()
	add_log("Game saved.")
	return true


func load_game() -> bool:
	if not FileAccess.file_exists(SAVE_PATH):
		return false

	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return false
	var json_text := file.get_as_text()
	file.close()

	var parsed = JSON.parse_string(json_text)
	if parsed == null or not parsed is Dictionary:
		push_error("Failed to parse save file.")
		return false

	var data: Dictionary = parsed
	if data.get("version", 0) != 1:
		push_error("Incompatible save version.")
		return false

	active_player = data.get("active_player", "playerA")
	phase = data.get("phase", "draw")
	turn_number = data.get("turn_number", 1)
	is_game_over = data.get("is_game_over", false)
	winner = data.get("winner", "")
	spectator_mode = data.get("spectator_mode", false)
	players = data.get("players", {})
	board_summons = data.get("board_summons", [])
	board_buildings = data.get("board_buildings", [])
	face_down_cards = data.get("face_down_cards", { "playerA": [], "playerB": [] })
	effect_stack = data.get("effect_stack", [])
	summon_role_map = data.get("summon_role_map", {})

	# Restore Vector2i positions (JSON loses type info)
	for s in board_summons:
		var pos = s.get("position", null)
		if pos is Dictionary:
			s["position"] = Vector2i(int(pos.get("x", 0)), int(pos.get("y", 0)))
		elif pos is String:
			# Godot serializes Vector2i as "(x, y)"
			var cleaned: String = pos.replace("(", "").replace(")", "").strip_edges()
			var parts: PackedStringArray = cleaned.split(",")
			if parts.size() >= 2:
				s["position"] = Vector2i(int(parts[0].strip_edges()), int(parts[1].strip_edges()))
		elif pos is Array and pos.size() >= 2:
			s["position"] = Vector2i(int(pos[0]), int(pos[1]))

	add_log("Game loaded (Turn %d)." % turn_number)
	return true


static func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)
