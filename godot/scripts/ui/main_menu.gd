extends Control
## Boot screen — runs formula verification on startup.

@onready var output_label: Label = $OutputLabel
@onready var _stats = get_node("/root/Stats")
@onready var _roles = get_node("/root/RolesData")
@onready var _species = get_node("/root/SpeciesData")
@onready var _factory = get_node("/root/SummonFactory")

var _pass_count := 0
var _fail_count := 0
var _results: Array[String] = []


func _ready() -> void:
	_run_all_checks()


func _check(test_name: String, expected: Variant, actual: Variant) -> void:
	if expected == actual:
		_results.append("[PASS] %s: %s" % [test_name, str(actual)])
		_pass_count += 1
	else:
		_results.append("[FAIL] %s: expected %s, got %s" % [test_name, str(expected), str(actual)])
		_fail_count += 1


func _run_all_checks() -> void:
	_pass_count = 0
	_fail_count = 0
	_results.clear()

	_test_stat_formulas()
	_test_damage_formulas()
	_test_element_advantage()
	_test_data_integrity()
	_test_summon_factory()

	# ─── Summary ───
	var summary := "=== Summoner's Grid — Formula Verification ===\n"
	summary += "%d passed, %d failed\n\n" % [_pass_count, _fail_count]
	for r in _results:
		summary += r + "\n"
	if _fail_count == 0:
		summary += "\nAll formulas match web prototype!"
	else:
		summary += "\n%d formula(s) FAILED" % _fail_count

	print(summary)
	if output_label:
		output_label.text = summary


func _test_stat_formulas() -> void:
	_check("FinalStat base=10 lv5 normal",
		15, _stats.calculate_final_stat(10, "normal", 5))
	_check("FinalStat role=1.1",
		16, _stats.calculate_final_stat(10, "normal", 5, 1.1))
	_check("FinalStat equip=3",
		18, _stats.calculate_final_stat(10, "normal", 5, 1.0, 3))
	_check("MaxHP END=13", 96, _stats.calculate_max_hp(13))
	_check("MaxHP END=15", 108, _stats.calculate_max_hp(15))
	_check("MoveSpeed SPD=7", 1, _stats.calculate_movement_speed(7))
	_check("MoveSpeed SPD=10", 2, _stats.calculate_movement_speed(10))
	_check("MoveSpeed SPD=15", 3, _stats.calculate_movement_speed(15))
	_check("CritChance LCK=13", 6, _stats.calculate_crit_chance(13))
	_check("CritChance LCK=22", 9, _stats.calculate_crit_chance(22))
	_check("CritChance LCK=33", 12, _stats.calculate_crit_chance(33))


func _test_damage_formulas() -> void:
	_check("Blast Bolt INT=19 BP=60 MDF=11",
		52, _stats.calculate_magical_damage(19, 60, 11))
	_check("Healing crit SPI=15 BP=40",
		31, _stats.calculate_healing(15, 40, true))
	_check("Melee STR=25 WP=30 DEF=15",
		54, _stats.calculate_physical_melee_damage(25, 30, 15))
	_check("Ranged STR=12 ACC=18 WP=20 DEF=10",
		21, _stats.calculate_physical_ranged_damage(12, 18, 20, 10))


func _test_element_advantage() -> void:
	_check("Fire > Wind", 1.25, _stats.get_element_multiplier("fire", "wind"))
	_check("Wind < Fire", 0.75, _stats.get_element_multiplier("wind", "fire"))
	_check("Fire = Earth", 1.0, _stats.get_element_multiplier("fire", "earth"))
	_check("Light > Dark", 1.25, _stats.get_element_multiplier("light", "dark"))
	_check("Neutral", 1.0, _stats.get_element_multiplier("neutral", "fire"))


func _test_data_integrity() -> void:
	# Species count
	_check("7 species", 7, _species.SPECIES.size())
	# Role count
	_check("27 roles", 27, _roles.ROLES.size())
	# Tier 1 roles
	_check("3 tier-1 roles", 3, _roles.get_tier1_roles().size())
	# Warrior advances
	var warrior_advances := _roles.get_advances_for("warrior")
	_check("Warrior → knight,berserker", 2, warrior_advances.size())


func _test_summon_factory() -> void:
	# Create a Gignen Warrior at level 5
	var card := {
		"id": "test_gignen",
		"name": "Gignen Warrior",
		"species": "gignen",
		"base_stats": {
			"STR": 10, "END": 8, "DEF": 10,
			"INT": 10, "SPI": 8, "MDF": 6,
			"SPD": 7, "ACC": 7, "LCK": 10,
		},
		"growth_rates": {
			"STR": "normal", "END": "gradual", "DEF": "normal",
			"INT": "steady", "SPI": "normal", "MDF": "minimal",
			"SPD": "normal", "ACC": "steady", "LCK": "normal",
		},
		"equipment": {
			"weapon": {
				"name": "Heirloom Sword",
				"base_power": 30,
				"damage_type": "physical_melee",
				"range": 1,
				"base_accuracy": 90,
				"stat_bonuses": {},
			},
			"offhand": {},
			"armor": {},
			"accessory": {},
		},
	}

	var unit: Dictionary = _factory.create_summon_unit(card, "playerA", Vector2i(5, 2), "warrior")

	_check("Unit level = 5", 5, unit["level"])
	_check("Unit owner", "playerA", unit["owner"])
	_check("Unit position", Vector2i(5, 2), unit["position"])
	_check("Unit HP = MaxHP", unit["max_hp"], unit["current_hp"])

	# HP Damage Retention test: take 52 damage, level up, damage stays
	var damaged := unit.duplicate(true)
	damaged["current_hp"] = unit["max_hp"] - 52  # 52 damage taken

	var leveled: Dictionary = _factory.apply_level_up(damaged, 1)
	var damage_after: int = leveled["max_hp"] - leveled["current_hp"]
	_check("Damage retained on level-up", 52, damage_after)
	_check("Level after +1", 6, leveled["level"])
