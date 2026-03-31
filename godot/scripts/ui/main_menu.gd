extends Control
## Boot screen — runs formula verification on startup.

@onready var output_label: Label = $OutputLabel
@onready var _stats = get_node("/root/Stats")
@onready var _constants = get_node("/root/Constants")

var _pass_count := 0
var _fail_count := 0
var _results: Array[String] = []


func _ready() -> void:
	_run_formula_checks()


func _check(test_name: String, expected: Variant, actual: Variant) -> void:
	if expected == actual:
		_results.append("[PASS] %s: %s" % [test_name, str(actual)])
		_pass_count += 1
	else:
		_results.append("[FAIL] %s: expected %s, got %s" % [test_name, str(expected), str(actual)])
		_fail_count += 1


func _run_formula_checks() -> void:
	_pass_count = 0
	_fail_count = 0
	_results.clear()

	# ─── Stat Calculation ───

	_check("FinalStat base=10 lv5 normal",
		15, _stats.calculate_final_stat(10, "normal", 5))
	_check("FinalStat base=10 lv5 normal role=1.1",
		16, _stats.calculate_final_stat(10, "normal", 5, 1.1))
	_check("FinalStat base=10 lv5 normal equip=3",
		18, _stats.calculate_final_stat(10, "normal", 5, 1.0, 3))

	# ─── Max HP: 50 + floor(END^1.5) ───

	_check("MaxHP END=13", 96, _stats.calculate_max_hp(13))
	_check("MaxHP END=15", 108, _stats.calculate_max_hp(15))

	# ─── Movement Speed: 2 + floor((SPD-10)/5) ───

	_check("MoveSpeed SPD=7", 1, _stats.calculate_movement_speed(7))
	_check("MoveSpeed SPD=10", 2, _stats.calculate_movement_speed(10))
	_check("MoveSpeed SPD=15", 3, _stats.calculate_movement_speed(15))
	_check("MoveSpeed SPD=12", 2, _stats.calculate_movement_speed(12))

	# ─── Crit Chance: floor(LCK * 0.3375 + 1.65) ───

	_check("CritChance LCK=13", 6, _stats.calculate_crit_chance(13))
	_check("CritChance LCK=22", 9, _stats.calculate_crit_chance(22))
	_check("CritChance LCK=33", 12, _stats.calculate_crit_chance(33))

	# ─── Damage Formulas (Play Example) ───

	_check("Blast Bolt INT=19 BP=60 MDF=11",
		52, _stats.calculate_magical_damage(19, 60, 11))
	_check("Healing Hands SPI=15 BP=40 crit",
		31, _stats.calculate_healing(15, 40, true))
	_check("Phys Melee STR=25 WP=30 DEF=15",
		54, _stats.calculate_physical_melee_damage(25, 30, 15))
	_check("Phys Ranged STR=12 ACC=18 WP=20 DEF=10",
		21, _stats.calculate_physical_ranged_damage(12, 18, 20, 10))

	# ─── Element Advantage ───

	_check("Fire > Wind = 1.25", 1.25, _stats.get_element_multiplier("fire", "wind"))
	_check("Wind vs Fire = 0.75", 0.75, _stats.get_element_multiplier("wind", "fire"))
	_check("Fire vs Earth = 1.0", 1.0, _stats.get_element_multiplier("fire", "earth"))
	_check("Light > Dark = 1.25", 1.25, _stats.get_element_multiplier("light", "dark"))
	_check("Dark > Light = 1.25", 1.25, _stats.get_element_multiplier("dark", "light"))
	_check("Neutral vs any = 1.0", 1.0, _stats.get_element_multiplier("neutral", "fire"))

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
