extends Node
## Role definitions — ported from src/data/roles.ts
## 27 roles across 3 families (warrior, magician, scout), tiers 1-3.

var ROLES := {
	# ─── Warrior Family ───
	"warrior": {
		"id": "warrior", "name": "Warrior", "family": "warrior", "tier": 1,
		"stat_modifiers": { "STR": 1.1, "DEF": 1.05 },
		"advances_from": [],
	},
	"knight": {
		"id": "knight", "name": "Knight", "family": "warrior", "tier": 2,
		"stat_modifiers": { "STR": 1.1, "DEF": 1.2, "END": 1.1 },
		"advances_from": ["warrior"],
	},
	"berserker": {
		"id": "berserker", "name": "Berserker", "family": "warrior", "tier": 2,
		"stat_modifiers": { "STR": 1.3, "SPD": 1.15, "DEF": 0.9 },
		"advances_from": ["warrior"],
	},
	"sentinel": {
		"id": "sentinel", "name": "Sentinel", "family": "warrior", "tier": 3,
		"stat_modifiers": { "DEF": 1.4, "END": 1.3, "STR": 1.05 },
		"advances_from": ["knight"],
	},
	"paladin": {
		"id": "paladin", "name": "Paladin", "family": "warrior", "tier": 3,
		"stat_modifiers": { "STR": 1.15, "DEF": 1.2, "SPI": 1.2, "MDF": 1.1 },
		"advances_from": ["knight", "white_mage"],
	},
	"dread_knight": {
		"id": "dread_knight", "name": "Dread Knight", "family": "warrior", "tier": 3,
		"stat_modifiers": { "STR": 1.25, "DEF": 1.1, "INT": 1.15 },
		"advances_from": ["knight", "black_mage"],
	},
	"warlord": {
		"id": "warlord", "name": "Warlord", "family": "warrior", "tier": 3,
		"stat_modifiers": { "STR": 1.35, "END": 1.15, "ACC": 1.1 },
		"advances_from": ["berserker"],
	},
	"battle_dancer": {
		"id": "battle_dancer", "name": "Battle Dancer", "family": "warrior", "tier": 3,
		"stat_modifiers": { "STR": 1.2, "SPD": 1.3, "ACC": 1.15 },
		"advances_from": ["berserker", "rogue"],
	},
	"spellblade": {
		"id": "spellblade", "name": "Spellblade", "family": "warrior", "tier": 3,
		"stat_modifiers": { "STR": 1.2, "INT": 1.2, "SPD": 1.1 },
		"advances_from": ["berserker", "red_mage"],
	},

	# ─── Magician Family ───
	"magician": {
		"id": "magician", "name": "Magician", "family": "magician", "tier": 1,
		"stat_modifiers": { "INT": 1.1, "SPI": 1.05 },
		"advances_from": [],
	},
	"elemental_mage": {
		"id": "elemental_mage", "name": "Elemental Mage", "family": "magician", "tier": 2,
		"stat_modifiers": { "INT": 1.25, "MDF": 1.1 },
		"advances_from": ["magician"],
	},
	"light_mage": {
		"id": "light_mage", "name": "Light Mage", "family": "magician", "tier": 2,
		"stat_modifiers": { "SPI": 1.2, "INT": 1.1, "MDF": 1.05 },
		"advances_from": ["magician"],
	},
	"dark_mage": {
		"id": "dark_mage", "name": "Dark Mage", "family": "magician", "tier": 2,
		"stat_modifiers": { "INT": 1.2, "SPI": 1.1, "LCK": 1.05 },
		"advances_from": ["magician"],
	},
	"red_mage": {
		"id": "red_mage", "name": "Red Mage", "family": "magician", "tier": 2,
		"stat_modifiers": { "INT": 1.15, "STR": 1.1, "SPD": 1.05 },
		"advances_from": ["magician"],
	},
	"white_mage": {
		"id": "white_mage", "name": "White Mage", "family": "magician", "tier": 2,
		"stat_modifiers": { "SPI": 1.3, "MDF": 1.15 },
		"advances_from": ["light_mage"],
	},
	"black_mage": {
		"id": "black_mage", "name": "Black Mage", "family": "magician", "tier": 2,
		"stat_modifiers": { "INT": 1.3, "LCK": 1.1 },
		"advances_from": ["dark_mage"],
	},
	"priest": {
		"id": "priest", "name": "Priest", "family": "magician", "tier": 3,
		"stat_modifiers": { "SPI": 1.4, "MDF": 1.2, "END": 1.1 },
		"advances_from": ["white_mage"],
	},
	"sage": {
		"id": "sage", "name": "Sage", "family": "magician", "tier": 3,
		"stat_modifiers": { "INT": 1.2, "SPI": 1.2, "MDF": 1.2 },
		"advances_from": ["red_mage", "white_mage"],
	},
	"sorcerer": {
		"id": "sorcerer", "name": "Sorcerer", "family": "magician", "tier": 3,
		"stat_modifiers": { "INT": 1.35, "SPD": 1.15 },
		"advances_from": ["red_mage"],
	},
	"warlock": {
		"id": "warlock", "name": "Warlock", "family": "magician", "tier": 3,
		"stat_modifiers": { "INT": 1.35, "LCK": 1.2, "SPI": 0.9 },
		"advances_from": ["black_mage"],
	},
	"shadowblade": {
		"id": "shadowblade", "name": "Shadowblade", "family": "magician", "tier": 3,
		"stat_modifiers": { "INT": 1.15, "SPD": 1.2, "ACC": 1.2, "LCK": 1.1 },
		"advances_from": ["black_mage", "rogue"],
	},

	# ─── Scout Family ───
	"scout": {
		"id": "scout", "name": "Scout", "family": "scout", "tier": 1,
		"stat_modifiers": { "SPD": 1.1, "ACC": 1.05 },
		"advances_from": [],
	},
	"rogue": {
		"id": "rogue", "name": "Rogue", "family": "scout", "tier": 2,
		"stat_modifiers": { "SPD": 1.2, "ACC": 1.15, "LCK": 1.1 },
		"advances_from": ["scout"],
	},
	"explorer": {
		"id": "explorer", "name": "Explorer", "family": "scout", "tier": 2,
		"stat_modifiers": { "SPD": 1.15, "ACC": 1.1, "END": 1.1 },
		"advances_from": ["scout"],
	},
	"assassin": {
		"id": "assassin", "name": "Assassin", "family": "scout", "tier": 3,
		"stat_modifiers": { "SPD": 1.3, "ACC": 1.25, "LCK": 1.2 },
		"advances_from": ["rogue"],
	},
	"ranger": {
		"id": "ranger", "name": "Ranger", "family": "scout", "tier": 3,
		"stat_modifiers": { "ACC": 1.3, "SPD": 1.15, "STR": 1.1 },
		"advances_from": ["explorer"],
	},
	"trailblazer": {
		"id": "trailblazer", "name": "Trailblazer", "family": "scout", "tier": 3,
		"stat_modifiers": { "SPD": 1.35, "END": 1.2, "ACC": 1.1 },
		"advances_from": ["explorer"],
	},
}


func get_definition(role_id: String) -> Dictionary:
	return ROLES.get(role_id, {})


func get_tier1_roles() -> Array[String]:
	var result: Array[String] = []
	for key in ROLES:
		if ROLES[key]["tier"] == 1:
			result.append(key)
	return result


func get_advances_for(role_id: String) -> Array[String]:
	## Returns all roles that can be advanced TO from the given role.
	var result: Array[String] = []
	for key in ROLES:
		var advances_from: Array = ROLES[key]["advances_from"]
		if role_id in advances_from:
			result.append(key)
	return result
