extends Node
## Creates summon units from card data — ported from createSummonUnit in stats.ts
## Connects Stats + RolesData to produce in-play units.

var _next_instance_id := 0


## Create a summon unit from a card dictionary. Enters at level 5.
## card_data keys: id, name, species, rarity, element, base_stats, growth_rates, equipment
## Returns a Dictionary representing the in-play SummonUnit.
func create_summon_unit(
	card_data: Dictionary,
	owner: String,
	position: Vector2i,
	role_id: String
) -> Dictionary:
	var level := 5  # Summons always enter at level 5
	var role_def: Dictionary = RolesData.get_definition(role_id)
	var stats: Dictionary = Stats.calculate_all_stats(card_data, level, role_def)
	var max_hp: int = Stats.calculate_max_hp(stats.get("END", 10))
	var movement: int = Stats.calculate_movement_speed(stats.get("SPD", 10))

	_next_instance_id += 1

	return {
		"instance_id": "%s-%d" % [card_data.get("id", "unknown"), _next_instance_id],
		"card": card_data,
		"owner": owner,
		"position": position,
		"level": level,
		"current_hp": max_hp,
		"max_hp": max_hp,
		"current_role": role_id,
		"calculated_stats": stats,
		"movement_remaining": movement,
		"has_attacked": false,
		"status_effects": [],
		"completed_quests": [],
		"is_named_summon": false,
		"named_summon_name": "",
	}


## Apply level up to a summon unit. Retains DAMAGE, not HP percentage.
func apply_level_up(unit: Dictionary, levels_gained: int = 1) -> Dictionary:
	var new_level: int = mini(unit["level"] + levels_gained, 20)
	if new_level == unit["level"]:
		return unit

	var damage_taken: int = unit["max_hp"] - unit["current_hp"]
	var role_def: Dictionary = RolesData.get_definition(unit["current_role"])
	var new_stats: Dictionary = Stats.calculate_all_stats(unit["card"], new_level, role_def)
	var new_max_hp: int = Stats.calculate_max_hp(new_stats.get("END", 10))
	var new_movement: int = Stats.calculate_movement_speed(new_stats.get("SPD", 10))

	var result := unit.duplicate(true)
	result["level"] = new_level
	result["calculated_stats"] = new_stats
	result["max_hp"] = new_max_hp
	result["current_hp"] = new_max_hp - damage_taken
	result["movement_remaining"] = new_movement
	return result


## Apply role advancement to a summon unit. Recalculates stats with new role.
func apply_role_advance(unit: Dictionary, new_role_id: String) -> Dictionary:
	var role_def: Dictionary = RolesData.get_definition(new_role_id)
	var new_stats: Dictionary = Stats.calculate_all_stats(unit["card"], unit["level"], role_def)
	var new_max_hp: int = Stats.calculate_max_hp(new_stats.get("END", 10))

	# Retain damage on role change too
	var damage_taken: int = unit["max_hp"] - unit["current_hp"]

	var result := unit.duplicate(true)
	result["current_role"] = new_role_id
	result["calculated_stats"] = new_stats
	result["max_hp"] = new_max_hp
	result["current_hp"] = maxi(new_max_hp - damage_taken, 1)
	result["movement_remaining"] = Stats.calculate_movement_speed(new_stats.get("SPD", 10))
	return result


## Reset instance ID counter (useful for tests).
func reset_ids() -> void:
	_next_instance_id = 0
