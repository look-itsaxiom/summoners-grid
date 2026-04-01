extends SceneTree
## Headless test runner — run with: godot --headless --script test/test_runner.gd
## Exercises the full game engine without UI.

var _pass := 0
var _fail := 0


func _init() -> void:
	# Wait for autoloads to initialize
	root.ready.connect(_run_all_tests)


func _run_all_tests() -> void:
	print("=== Summoner's Grid — Headless Test Suite ===\n")

	_test_stats()
	_test_damage_formulas()
	_test_elements()
	_test_data_integrity()
	_test_summon_creation()
	_test_level_up_damage_retention()
	_test_role_advance()
	_test_game_flow()
	_test_placement_validation()
	_test_attack_resolution()

	print("\n=== Results: %d passed, %d failed ===" % [_pass, _fail])

	if _fail > 0:
		print("FAILURES DETECTED")
		quit(1)
	else:
		print("ALL TESTS PASSED")
		quit(0)


func _check(name: String, expected: Variant, actual: Variant) -> void:
	if expected == actual:
		_pass += 1
	else:
		_fail += 1
		print("  [FAIL] %s: expected %s, got %s" % [name, str(expected), str(actual)])


func _test_stats() -> void:
	print("--- Stats ---")
	var s = root.get_node("Stats")
	_check("FinalStat basic", 15, s.calculate_final_stat(10, "normal", 5))
	_check("FinalStat role", 16, s.calculate_final_stat(10, "normal", 5, 1.1))
	_check("FinalStat equip", 18, s.calculate_final_stat(10, "normal", 5, 1.0, 3))
	_check("MaxHP END=13", 96, s.calculate_max_hp(13))
	_check("MaxHP END=15", 108, s.calculate_max_hp(15))
	_check("MoveSpeed SPD=7", 1, s.calculate_movement_speed(7))
	_check("MoveSpeed SPD=10", 2, s.calculate_movement_speed(10))
	_check("MoveSpeed SPD=15", 3, s.calculate_movement_speed(15))
	_check("CritChance LCK=13", 6, s.calculate_crit_chance(13))
	_check("CritChance LCK=22", 9, s.calculate_crit_chance(22))
	_check("CritChance LCK=33", 12, s.calculate_crit_chance(33))


func _test_damage_formulas() -> void:
	print("--- Damage Formulas ---")
	var s = root.get_node("Stats")
	_check("Blast Bolt", 52, s.calculate_magical_damage(19, 60, 11))
	_check("Healing crit", 31, s.calculate_healing(15, 40, true))
	_check("Phys Melee", 54, s.calculate_physical_melee_damage(25, 30, 15))
	_check("Phys Ranged", 21, s.calculate_physical_ranged_damage(12, 18, 20, 10))
	# Forced roll hit/miss
	var hit = s.roll_hit(90.0, 50)
	_check("Roll hit (50 <= 90)", true, hit["hit"])
	var miss = s.roll_hit(90.0, 95)
	_check("Roll miss (95 > 90)", false, miss["hit"])


func _test_elements() -> void:
	print("--- Elements ---")
	var s = root.get_node("Stats")
	_check("Fire > Wind", 1.25, s.get_element_multiplier("fire", "wind"))
	_check("Wind < Fire", 0.75, s.get_element_multiplier("wind", "fire"))
	_check("Fire = Earth", 1.0, s.get_element_multiplier("fire", "earth"))
	_check("Light > Dark", 1.25, s.get_element_multiplier("light", "dark"))
	_check("Dark > Light", 1.25, s.get_element_multiplier("dark", "light"))
	_check("Neutral", 1.0, s.get_element_multiplier("neutral", "fire"))


func _test_data_integrity() -> void:
	print("--- Data ---")
	var sp = root.get_node("SpeciesData")
	var r = root.get_node("RolesData")
	var c = root.get_node("CardDB")
	_check("7 species", 7, sp.SPECIES.size())
	_check("27 roles", 27, r.ROLES.size())
	_check("3 tier-1 roles", 3, r.get_tier1_roles().size())
	_check("6 summons", 6, c.SUMMONS.size())
	_check("32 actions", 32, c.ACTIONS.size())
	_check("5 counters", 5, c.COUNTERS.size())
	_check("3 reactions", 3, c.REACTIONS.size())
	_check("7 advances", 7, c.ADVANCES.size())
	# Deck builders work
	var da: Dictionary = c.create_player_a_deck()
	_check("Deck A summons", 3, da["summon_slots"].size())
	_check("Deck A main >= 15", true, da["main_deck"].size() >= 15)
	_check("Deck A advances >= 3", true, da["advance_deck"].size() >= 3)


func _test_summon_creation() -> void:
	print("--- Summon Creation ---")
	var sf = root.get_node("SummonFactory")
	var c = root.get_node("CardDB")
	var card: Dictionary = c.SUMMONS["gignen_warrior_a"]
	var unit: Dictionary = sf.create_summon_unit(card, "playerA", Vector2i(5, 2), "warrior")
	_check("Unit level", 5, unit["level"])
	_check("Unit owner", "playerA", unit["owner"])
	_check("Unit position", Vector2i(5, 2), unit["position"])
	_check("Unit full HP", true, unit["current_hp"] == unit["max_hp"])
	_check("Unit has stats", true, unit["calculated_stats"].has("STR"))


func _test_level_up_damage_retention() -> void:
	print("--- Level Up (Damage Retention) ---")
	var sf = root.get_node("SummonFactory")
	var c = root.get_node("CardDB")
	var card: Dictionary = c.SUMMONS["gignen_warrior_a"]
	var unit: Dictionary = sf.create_summon_unit(card, "playerA", Vector2i(0, 0), "warrior")

	# Take 52 damage
	unit["current_hp"] = unit["max_hp"] - 52
	var leveled: Dictionary = sf.apply_level_up(unit, 1)
	var damage_after: int = leveled["max_hp"] - leveled["current_hp"]
	_check("Damage retained", 52, damage_after)
	_check("Level +1", 6, leveled["level"])
	_check("Max HP increased", true, leveled["max_hp"] >= unit["max_hp"])


func _test_role_advance() -> void:
	print("--- Role Advance ---")
	var sf = root.get_node("SummonFactory")
	var c = root.get_node("CardDB")
	var card: Dictionary = c.SUMMONS["gignen_warrior_a"]
	var unit: Dictionary = sf.create_summon_unit(card, "playerA", Vector2i(0, 0), "warrior")
	_check("Start role", "warrior", unit["current_role"])

	var advanced: Dictionary = sf.apply_role_advance(unit, "berserker")
	_check("Advanced role", "berserker", advanced["current_role"])
	# Berserker has STR 1.3 modifier vs warrior's 1.1 — STR should increase
	_check("STR increased", true, advanced["calculated_stats"]["STR"] >= unit["calculated_stats"]["STR"])


func _test_game_flow() -> void:
	print("--- Game Flow ---")
	var gm = root.get_node("GameManager")
	var c = root.get_node("CardDB")

	gm.initialize_game(c.create_player_a_deck(), c.create_player_b_deck())
	gm.decide_turn_order("playerA")

	_check("Turn 1", 1, gm.turn_number)
	_check("Player A active", "playerA", gm.active_player)
	_check("Phase draw", "draw", gm.phase)
	_check("Not game over", false, gm.is_game_over)

	# Execute draw (skipped T1)
	gm.execute_draw_phase()
	_check("Phase after draw", "level", gm.phase)

	# Execute level (no summons)
	gm.execute_level_phase()
	_check("Phase after level", "action", gm.phase)

	# Play a summon
	var hand: Array = gm.players["playerA"]["hand"]
	var summon_idx := -1
	for i in range(hand.size()):
		if hand[i].get("card_type", "") == "summon":
			summon_idx = i
			break
	_check("Has summon in hand", true, summon_idx >= 0)

	if summon_idx >= 0:
		gm.play_summon(summon_idx, Vector2i(5, 1))
		_check("Summon on board", true, gm.board_summons.size() >= 1)
		_check("Drew 3 cards", true, gm.players["playerA"]["hand"].size() >= 3)


func _test_placement_validation() -> void:
	print("--- Placement Validation ---")
	var gm = root.get_node("GameManager")
	var c = root.get_node("CardDB")

	gm.initialize_game(c.create_player_a_deck(), c.create_player_b_deck())
	gm.decide_turn_order("playerA")
	gm.execute_draw_phase()
	gm.execute_level_phase()

	var placements = gm.get_valid_placements()
	_check("Valid placements exist", true, placements.size() > 0)
	# All placements should be in Player A territory (y < 3)
	var all_in_territory := true
	for p in placements:
		if p.y >= 3:
			all_in_territory = false
			break
	_check("All in territory", true, all_in_territory)


func _test_attack_resolution() -> void:
	print("--- Attack Resolution ---")
	var gm = root.get_node("GameManager")
	var c = root.get_node("CardDB")

	gm.initialize_game(c.create_player_a_deck(), c.create_player_b_deck())
	gm.decide_turn_order("playerA")
	gm.execute_draw_phase()
	gm.execute_level_phase()

	# Place summons for both players
	var hand_a: Array = gm.players["playerA"]["hand"]
	for i in range(hand_a.size() - 1, -1, -1):
		if hand_a[i].get("card_type", "") == "summon":
			gm.play_summon(i, Vector2i(5, 2))
			break

	# Switch to player B
	gm.end_action_phase()
	gm.execute_draw_phase()
	gm.execute_level_phase()

	var hand_b: Array = gm.players["playerB"]["hand"]
	for i in range(hand_b.size() - 1, -1, -1):
		if hand_b[i].get("card_type", "") == "summon":
			gm.play_summon(i, Vector2i(5, 12))
			break

	_check("2 summons on board", 2, gm.board_summons.size())

	# Both summons should exist with different owners
	var owners: Array = []
	for s in gm.board_summons:
		owners.append(s["owner"])
	_check("Different owners", true, "playerA" in owners and "playerB" in owners)
