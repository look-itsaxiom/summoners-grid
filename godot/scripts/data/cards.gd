extends Node
## Card database — ported from src/data/cards.ts
## Contains weapons, armor, accessories, summons, action cards, and deck builders.

# ─── Weapons ───

var WEAPONS := {
	"heirloom_sword": {
		"id": "heirloom_sword", "name": "Heirloom Sword", "slot": "weapon",
		"base_power": 30, "damage_type": "physical_melee", "element": "neutral",
		"range": 1, "base_accuracy": 90.0, "stat_bonuses": {},
	},
	"apprentices_wand": {
		"id": "apprentices_wand", "name": "Apprentice's Wand", "slot": "weapon",
		"base_power": 30, "damage_type": "magical", "element": "neutral",
		"range": 3, "base_accuracy": 90.0, "stat_bonuses": {},
	},
	"hunting_bow": {
		"id": "hunting_bow", "name": "Hunting Bow", "slot": "weapon",
		"base_power": 30, "damage_type": "physical_ranged", "element": "neutral",
		"range": 5, "base_accuracy": 90.0, "stat_bonuses": {},
	},
	"flame_blade": {
		"id": "flame_blade", "name": "Flame Blade", "slot": "weapon",
		"base_power": 45, "damage_type": "physical_melee", "element": "fire",
		"range": 1, "base_accuracy": 85.0, "stat_bonuses": { "STR": 3 },
	},
	"frost_staff": {
		"id": "frost_staff", "name": "Frost Staff", "slot": "weapon",
		"base_power": 50, "damage_type": "magical", "element": "water",
		"range": 3, "base_accuracy": 85.0, "stat_bonuses": { "INT": 3 },
	},
}

var ARMOR := {
	"leather_armor": { "id": "leather_armor", "name": "Leather Armor", "slot": "armor", "stat_bonuses": { "DEF": 3, "SPD": -1 } },
	"iron_plate": { "id": "iron_plate", "name": "Iron Plate", "slot": "armor", "stat_bonuses": { "DEF": 6, "MDF": 2, "SPD": -3 } },
	"mage_robe": { "id": "mage_robe", "name": "Mage Robe", "slot": "armor", "stat_bonuses": { "MDF": 5, "INT": 2 } },
	"scout_cloak": { "id": "scout_cloak", "name": "Scout Cloak", "slot": "armor", "stat_bonuses": { "SPD": 3, "ACC": 2 } },
}

var ACCESSORIES := {
	"lucky_charm": { "id": "lucky_charm", "name": "Lucky Charm", "slot": "accessory", "stat_bonuses": { "LCK": 5 } },
	"warriors_ring": { "id": "warriors_ring", "name": "Warrior's Ring", "slot": "accessory", "stat_bonuses": { "STR": 3, "END": 2 } },
	"sages_pendant": { "id": "sages_pendant", "name": "Sage's Pendant", "slot": "accessory", "stat_bonuses": { "INT": 3, "SPI": 2 } },
	"swift_boots": { "id": "swift_boots", "name": "Swift Boots", "slot": "accessory", "stat_bonuses": { "SPD": 4, "ACC": 1 } },
}

# ─── Summon Cards ───

var SUMMONS := {
	"gignen_warrior_a": {
		"id": "gignen_warrior_a", "name": "Gignen Warrior", "card_type": "summon",
		"species": "gignen", "rarity": "common", "element": "neutral",
		"description": "A versatile Gignen trained in the ways of the warrior.",
		"requirements": [], "pile_destination": "removed",
		"base_stats": { "STR": 10, "END": 8, "DEF": 10, "INT": 10, "SPI": 8, "MDF": 6, "SPD": 7, "ACC": 7, "LCK": 10 },
		"growth_rates": { "STR": "gradual", "END": "normal", "DEF": "normal", "INT": "steady", "SPI": "normal", "MDF": "steady", "SPD": "minimal", "ACC": "steady", "LCK": "exceptional" },
		"equipment": {
			"weapon": { "name": "Heirloom Sword", "base_power": 30, "damage_type": "physical_melee", "element": "neutral", "range": 1, "base_accuracy": 90.0, "stat_bonuses": {} },
			"offhand": {}, "armor": { "stat_bonuses": { "DEF": 3, "SPD": -1 } }, "accessory": { "stat_bonuses": { "STR": 3, "END": 2 } },
		},
	},
	"gignen_scout_a": {
		"id": "gignen_scout_a", "name": "Gignen Scout", "card_type": "summon",
		"species": "gignen", "rarity": "common", "element": "neutral",
		"description": "A keen-eyed Gignen with natural aptitude for scouting.",
		"requirements": [], "pile_destination": "removed",
		"base_stats": { "STR": 8, "END": 10, "DEF": 8, "INT": 8, "SPI": 9, "MDF": 9, "SPD": 12, "ACC": 9, "LCK": 12 },
		"growth_rates": { "STR": "normal", "END": "gradual", "DEF": "normal", "INT": "normal", "SPI": "normal", "MDF": "normal", "SPD": "gradual", "ACC": "gradual", "LCK": "exceptional" },
		"equipment": {
			"weapon": { "name": "Hunting Bow", "base_power": 30, "damage_type": "physical_ranged", "element": "neutral", "range": 5, "base_accuracy": 90.0, "stat_bonuses": {} },
			"offhand": {}, "armor": { "stat_bonuses": { "SPD": 3, "ACC": 2 } }, "accessory": { "stat_bonuses": { "SPD": 4, "ACC": 1 } },
		},
	},
	"gignen_magician_a": {
		"id": "gignen_magician_a", "name": "Gignen Magician", "card_type": "summon",
		"species": "gignen", "rarity": "common", "element": "neutral",
		"description": "A Gignen who has unlocked the secrets of magic.",
		"requirements": [], "pile_destination": "removed",
		"base_stats": { "STR": 9, "END": 8, "DEF": 9, "INT": 9, "SPI": 8, "MDF": 10, "SPD": 10, "ACC": 6, "LCK": 12 },
		"growth_rates": { "STR": "gradual", "END": "normal", "DEF": "minimal", "INT": "gradual", "SPI": "gradual", "MDF": "normal", "SPD": "normal", "ACC": "minimal", "LCK": "exceptional" },
		"equipment": {
			"weapon": { "name": "Apprentice's Wand", "base_power": 30, "damage_type": "magical", "element": "neutral", "range": 3, "base_accuracy": 90.0, "stat_bonuses": {} },
			"offhand": {}, "armor": { "stat_bonuses": { "MDF": 5, "INT": 2 } }, "accessory": { "stat_bonuses": { "INT": 3, "SPI": 2 } },
		},
	},
	"fae_magician_b": {
		"id": "fae_magician_b", "name": "Fae Magician", "card_type": "summon",
		"species": "fae", "rarity": "common", "element": "neutral",
		"description": "A graceful Fae with deep magical talent.",
		"requirements": [], "pile_destination": "removed",
		"base_stats": { "STR": 8, "END": 8, "DEF": 10, "INT": 12, "SPI": 13, "MDF": 11, "SPD": 10, "ACC": 7, "LCK": 8 },
		"growth_rates": { "STR": "normal", "END": "normal", "DEF": "normal", "INT": "gradual", "SPI": "gradual", "MDF": "normal", "SPD": "normal", "ACC": "gradual", "LCK": "normal" },
		"equipment": {
			"weapon": { "name": "Apprentice's Wand", "base_power": 30, "damage_type": "magical", "element": "neutral", "range": 3, "base_accuracy": 90.0, "stat_bonuses": {} },
			"offhand": {}, "armor": { "stat_bonuses": { "MDF": 5, "INT": 2 } }, "accessory": { "stat_bonuses": { "LCK": 5 } },
		},
	},
	"stoneheart_warrior_b": {
		"id": "stoneheart_warrior_b", "name": "Stoneheart Warrior", "card_type": "summon",
		"species": "stoneheart", "rarity": "common", "element": "neutral",
		"description": "A stalwart Stoneheart built for battle.",
		"requirements": [], "pile_destination": "removed",
		"base_stats": { "STR": 9, "END": 7, "DEF": 6, "INT": 1, "SPI": 6, "MDF": 3, "SPD": 4, "ACC": 4, "LCK": 6 },
		"growth_rates": { "STR": "gradual", "END": "normal", "DEF": "normal", "INT": "normal", "SPI": "gradual", "MDF": "accelerated", "SPD": "normal", "ACC": "accelerated", "LCK": "steady" },
		"equipment": {
			"weapon": { "name": "Heirloom Sword", "base_power": 30, "damage_type": "physical_melee", "element": "neutral", "range": 1, "base_accuracy": 90.0, "stat_bonuses": {} },
			"offhand": {}, "armor": { "stat_bonuses": { "DEF": 6, "MDF": 2, "SPD": -3 } }, "accessory": { "stat_bonuses": { "STR": 3, "END": 2 } },
		},
	},
	"wilderling_scout_b": {
		"id": "wilderling_scout_b", "name": "Wilderling Scout", "card_type": "summon",
		"species": "wilderling", "rarity": "common", "element": "neutral",
		"description": "A primal Wilderling with unmatched speed.",
		"requirements": [], "pile_destination": "removed",
		"base_stats": { "STR": 12, "END": 9, "DEF": 7, "INT": 6, "SPI": 8, "MDF": 5, "SPD": 16, "ACC": 13, "LCK": 9 },
		"growth_rates": { "STR": "steady", "END": "normal", "DEF": "normal", "INT": "accelerated", "SPI": "minimal", "MDF": "steady", "SPD": "exceptional", "ACC": "exceptional", "LCK": "accelerated" },
		"equipment": {
			"weapon": { "name": "Hunting Bow", "base_power": 30, "damage_type": "physical_ranged", "element": "neutral", "range": 5, "base_accuracy": 90.0, "stat_bonuses": {} },
			"offhand": {}, "armor": { "stat_bonuses": { "SPD": 3, "ACC": 2 } }, "accessory": { "stat_bonuses": { "SPD": 4, "ACC": 1 } },
		},
	},
}

# ─── Action Cards ───

var ACTIONS := {
	"sharpened_blade": {
		"id": "sharpened_blade", "name": "Sharpened Blade", "card_type": "action",
		"speed": "action", "element": "neutral", "pile_destination": "recharge",
		"description": "Target weapon gains +10 Base Power.", "target_type": "ally_summon",
		"requirements": [{ "type": "role", "role_family": "warrior", "description": "Requires Warrior" }],
		"effects": [{ "type": "buff", "description": "+10 weapon power", "duration": "permanent" }],
	},
	"healing_hands": {
		"id": "healing_hands", "name": "Healing Hands", "card_type": "action",
		"speed": "action", "element": "light", "pile_destination": "discard",
		"description": "Heal target summon.", "target_type": "ally_summon",
		"requirements": [{ "type": "role", "role_family": "magician", "description": "Requires Magician" }],
		"effects": [{ "type": "heal", "base_power": 40, "can_crit": true, "description": "Heal ally" }],
	},
	"blast_bolt": {
		"id": "blast_bolt", "name": "Blast Bolt", "card_type": "action",
		"speed": "action", "element": "fire", "pile_destination": "discard",
		"description": "Magical fire damage to enemy.", "target_type": "enemy_summon",
		"requirements": [{ "type": "role", "role_family": "magician", "description": "Requires Magician" }],
		"effects": [{ "type": "damage", "base_power": 60, "damage_type": "magical", "element": "fire", "can_crit": true, "description": "Fire damage" }],
	},
	"rush": {
		"id": "rush", "name": "Rush", "card_type": "action",
		"speed": "action", "element": "wind", "pile_destination": "recharge",
		"description": "Double movement, halve DEF.", "target_type": "ally_summon",
		"requirements": [],
		"effects": [
			{ "type": "buff", "description": "Double movement speed", "duration": "end_of_turn" },
			{ "type": "debuff", "description": "Halve DEF", "duration": "end_of_next_turn" },
		],
	},
	"tempest_slash": {
		"id": "tempest_slash", "name": "Tempest Slash", "card_type": "action",
		"speed": "action", "element": "wind", "pile_destination": "discard",
		"description": "+1 movement, extra wind damage.", "target_type": "ally_summon",
		"requirements": [],
		"effects": [
			{ "type": "buff", "description": "+1 movement", "duration": "end_of_turn" },
			{ "type": "damage", "base_power": 30, "damage_type": "physical_melee", "element": "wind", "can_crit": true, "description": "Wind slash" },
		],
	},
	"battle_cry": {
		"id": "battle_cry", "name": "Battle Cry", "card_type": "action",
		"speed": "action", "element": "neutral", "pile_destination": "recharge",
		"description": "Buff STR of all allied summons.", "target_type": "ally_summon",
		"requirements": [{ "type": "role", "role_family": "warrior", "description": "Requires Warrior" }],
		"effects": [{ "type": "buff", "description": "+STR to all allies", "duration": "end_of_turn" }],
	},
	"mend_wounds": {
		"id": "mend_wounds", "name": "Mend Wounds", "card_type": "action",
		"speed": "action", "element": "light", "pile_destination": "recharge",
		"description": "Light heal.", "target_type": "ally_summon",
		"requirements": [],
		"effects": [{ "type": "heal", "base_power": 25, "can_crit": false, "description": "Light heal" }],
	},
	"shield_bash": {
		"id": "shield_bash", "name": "Shield Bash", "card_type": "action",
		"speed": "action", "element": "neutral", "pile_destination": "recharge",
		"description": "Physical damage that stuns.", "target_type": "enemy_summon",
		"requirements": [{ "type": "role", "role_family": "warrior", "description": "Requires Warrior" }],
		"effects": [{ "type": "damage", "base_power": 20, "damage_type": "physical_melee", "can_crit": true, "description": "Bash damage" }],
	},
}

# ─── Quest Cards ───

var QUESTS := {
	"nearwood_forest": {
		"id": "nearwood_forest", "name": "Nearwood Forest Expedition", "card_type": "quest",
		"element": "earth", "pile_destination": "discard",
		"description": "Target summon gains 2 levels.", "requirements": [],
		"vp_reward": 0, "reward_effects": [{ "type": "special", "description": "+2 levels" }],
	},
	"trial_of_strength": {
		"id": "trial_of_strength", "name": "Trial of Strength", "card_type": "quest",
		"element": "neutral", "pile_destination": "discard",
		"description": "Target warrior gains VP on completion.", "requirements": [],
		"vp_reward": 1, "reward_effects": [{ "type": "special", "description": "+1 VP" }],
	},
}

# ─── Building Cards ───

var BUILDINGS := {
	"gignen_country": {
		"id": "gignen_country", "name": "Gignen Country", "card_type": "building",
		"element": "neutral", "pile_destination": "discard",
		"description": "Gignen summons on this tile gain double level-ups.",
		"dimensions": { "width": 1, "height": 1 }, "is_trap": false,
		"requirements": [], "effects": [],
	},
	"healing_spring": {
		"id": "healing_spring", "name": "Healing Spring", "card_type": "building",
		"element": "water", "pile_destination": "discard",
		"description": "Summons on this tile heal at end of turn.",
		"dimensions": { "width": 1, "height": 1 }, "is_trap": false,
		"requirements": [], "effects": [{ "type": "heal", "base_power": 15, "description": "Heal at end of turn" }],
	},
}


# ─── Deck Builders ───

func create_player_a_deck() -> Dictionary:
	return {
		"summon_slots": [
			{ "summon": SUMMONS["gignen_warrior_a"].duplicate(true), "role_id": "warrior" },
			{ "summon": SUMMONS["gignen_scout_a"].duplicate(true), "role_id": "scout" },
			{ "summon": SUMMONS["gignen_magician_a"].duplicate(true), "role_id": "magician" },
		],
		"main_deck": [
			ACTIONS["sharpened_blade"].duplicate(true),
			ACTIONS["healing_hands"].duplicate(true),
			ACTIONS["rush"].duplicate(true),
			ACTIONS["rush"].duplicate(true),
			ACTIONS["tempest_slash"].duplicate(true),
			ACTIONS["battle_cry"].duplicate(true),
			ACTIONS["mend_wounds"].duplicate(true),
			ACTIONS["shield_bash"].duplicate(true),
			BUILDINGS["gignen_country"].duplicate(true),
			BUILDINGS["healing_spring"].duplicate(true),
			QUESTS["nearwood_forest"].duplicate(true),
			QUESTS["nearwood_forest"].duplicate(true),
			QUESTS["trial_of_strength"].duplicate(true),
		],
		"advance_deck": [],
	}


func create_player_b_deck() -> Dictionary:
	return {
		"summon_slots": [
			{ "summon": SUMMONS["fae_magician_b"].duplicate(true), "role_id": "magician" },
			{ "summon": SUMMONS["stoneheart_warrior_b"].duplicate(true), "role_id": "warrior" },
			{ "summon": SUMMONS["wilderling_scout_b"].duplicate(true), "role_id": "scout" },
		],
		"main_deck": [
			ACTIONS["blast_bolt"].duplicate(true),
			ACTIONS["blast_bolt"].duplicate(true),
			ACTIONS["healing_hands"].duplicate(true),
			ACTIONS["rush"].duplicate(true),
			ACTIONS["tempest_slash"].duplicate(true),
			ACTIONS["mend_wounds"].duplicate(true),
			ACTIONS["shield_bash"].duplicate(true),
		],
		"advance_deck": [],
	}
