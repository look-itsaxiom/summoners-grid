extends Node
## Stat calculation engine — ported from src/engine/stats.ts

const CRIT_MULTIPLIER := 1.5

# Local copies of growth rates (avoids cross-autoload compile dependency)
var GROWTH_RATES := {
	"minimal": 0.5,
	"steady": 0.67,
	"normal": 1.0,
	"gradual": 1.33,
	"accelerated": 1.5,
	"exceptional": 2.0,
}

var STAT_KEYS: Array[String] = [
	"STR", "END", "DEF", "INT", "SPI", "MDF", "SPD", "ACC", "LCK"
]

var ELEMENT_ADVANTAGES := {
	"fire": "wind",
	"wind": "earth",
	"earth": "water",
	"water": "fire",
	"light": "dark",
	"dark": "light",
	"neutral": "",
}


## (BaseStat + Floor(Level * GrowthRate)) * RoleModifier + EquipmentBonus
func calculate_final_stat(
	base_stat: int, growth_type: String, level: int,
	role_modifier: float = 1.0, equipment_bonus: int = 0
) -> int:
	var rate: float = GROWTH_RATES.get(growth_type, 1.0)
	var growth_gain := floori(level * rate)
	return floori((base_stat + growth_gain) * role_modifier) + equipment_bonus


func calculate_all_stats(card_data: Dictionary, level: int, role_def: Dictionary) -> Dictionary:
	var result := {}
	var base_stats: Dictionary = card_data.get("base_stats", {})
	var growth_rates: Dictionary = card_data.get("growth_rates", {})
	var equipment: Dictionary = card_data.get("equipment", {})
	var role_mods: Dictionary = role_def.get("stat_modifiers", {})

	for key in STAT_KEYS:
		var base_stat: int = base_stats.get(key, 0)
		var growth_type: String = growth_rates.get(key, "normal")
		var role_mod: float = role_mods.get(key, 1.0)
		var equip_bonus := 0
		for slot in ["weapon", "offhand", "armor", "accessory"]:
			var item: Dictionary = equipment.get(slot, {})
			if not item.is_empty():
				equip_bonus += item.get("stat_bonuses", {}).get(key, 0)
		result[key] = calculate_final_stat(base_stat, growth_type, level, role_mod, equip_bonus)
	return result


## 50 + Floor(END^1.5)
func calculate_max_hp(end_stat: int) -> int:
	return 50 + floori(pow(end_stat, 1.5))


## 2 + Floor((SPD - 10) / 5)
func calculate_movement_speed(spd_stat: int) -> int:
	return 2 + floori(float(spd_stat - 10) / 5.0)


## BaseAccuracy + (ACC / 10)
func calculate_to_hit(base_accuracy: float, acc_stat: int) -> float:
	return base_accuracy + float(acc_stat) / 10.0


## Floor((LCK * 0.3375) + 1.65)
func calculate_crit_chance(lck_stat: int) -> int:
	return floori(lck_stat * 0.3375 + 1.65)


## STR * (1 + WP/100) * (STR/DEF) * CritMult
func calculate_physical_melee_damage(
	str_stat: int, weapon_power: int, target_def: int, is_crit: bool = false
) -> int:
	var cm := CRIT_MULTIPLIER if is_crit else 1.0
	return floori(str_stat * (1.0 + weapon_power / 100.0) * (float(str_stat) / float(target_def)) * cm)


## ((STR+ACC)/2) * (1 + WP/100) * (STR/DEF) * CritMult
func calculate_physical_ranged_damage(
	str_stat: int, acc_stat: int, weapon_power: int, target_def: int, is_crit: bool = false
) -> int:
	var cm := CRIT_MULTIPLIER if is_crit else 1.0
	return floori(((str_stat + acc_stat) / 2.0) * (1.0 + weapon_power / 100.0) * (float(str_stat) / float(target_def)) * cm)


## INT * (1 + BP/100) * (INT/MDF) * CritMult
func calculate_magical_damage(
	int_stat: int, base_power: int, target_mdf: int, is_crit: bool = false
) -> int:
	var cm := CRIT_MULTIPLIER if is_crit else 1.0
	return floori(int_stat * (1.0 + base_power / 100.0) * (float(int_stat) / float(target_mdf)) * cm)


## SPI * (1 + BP/100) * CritMult
func calculate_healing(spi_stat: int, base_power: int, is_crit: bool = false) -> int:
	var cm := CRIT_MULTIPLIER if is_crit else 1.0
	return floori(spi_stat * (1.0 + base_power / 100.0) * cm)


func roll_hit(to_hit_percent: float, forced_roll: int = -1) -> Dictionary:
	var r: int = forced_roll if forced_roll >= 0 else (randi() % 100 + 1)
	return { "hit": r <= int(to_hit_percent), "roll": r }


func roll_crit(crit_chance_percent: int, forced_roll: int = -1) -> Dictionary:
	var r: int = forced_roll if forced_roll >= 0 else (randi() % 100 + 1)
	return { "crit": r <= crit_chance_percent, "roll": r }


func get_element_multiplier(attacker_element: String, defender_element: String) -> float:
	if attacker_element == "neutral" or defender_element == "neutral":
		return 1.0
	var adv: String = ELEMENT_ADVANTAGES.get(attacker_element, "")
	if adv == defender_element:
		return 1.25
	var def_adv: String = ELEMENT_ADVANTAGES.get(defender_element, "")
	if def_adv == attacker_element:
		return 0.75
	return 1.0
