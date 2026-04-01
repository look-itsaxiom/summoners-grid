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
	"fireball": {
		"id": "fireball", "name": "Fireball", "card_type": "action",
		"speed": "action", "element": "fire", "pile_destination": "discard",
		"description": "Heavy magical fire damage.", "target_type": "enemy_summon",
		"requirements": [{ "type": "role", "role_family": "magician", "description": "Requires Magician" }],
		"effects": [{ "type": "damage", "base_power": 80, "damage_type": "magical", "element": "fire", "can_crit": true, "description": "Heavy fire damage" }],
	},
	"drain_touch": {
		"id": "drain_touch", "name": "Drain Touch", "card_type": "action",
		"speed": "action", "element": "dark", "pile_destination": "discard",
		"description": "Magical dark damage + lifesteal.", "target_type": "enemy_summon",
		"requirements": [{ "type": "role", "role_family": "magician", "description": "Requires Magician" }],
		"effects": [{ "type": "damage", "base_power": 30, "damage_type": "magical", "element": "dark", "can_crit": true, "description": "Dark damage + lifesteal" }],
	},
	"ensnare": {
		"id": "ensnare", "name": "Ensnare", "card_type": "action",
		"speed": "action", "element": "earth", "pile_destination": "discard",
		"description": "Damage and immobilize.", "target_type": "enemy_summon",
		"requirements": [{ "type": "role", "role_family": "scout", "description": "Requires Scout" }],
		"effects": [{ "type": "damage", "base_power": 25, "damage_type": "physical_melee", "element": "earth", "can_crit": true, "description": "Earth damage + immobilize" }],
	},
	"dual_shot": {
		"id": "dual_shot", "name": "Dual Shot", "card_type": "action",
		"speed": "action", "element": "neutral", "pile_destination": "recharge",
		"description": "Grant extra attack this turn.", "target_type": "ally_summon",
		"requirements": [],
		"effects": [{ "type": "buff", "description": "Extra basic attack", "duration": "end_of_turn" }],
	},
	"obliterate": {
		"id": "obliterate", "name": "Obliterate", "card_type": "action",
		"speed": "action", "element": "dark", "pile_destination": "discard",
		"description": "Massive magical dark damage.", "target_type": "enemy_summon",
		"requirements": [{ "type": "role", "role_family": "magician", "description": "Requires Magician" }],
		"effects": [{ "type": "damage", "base_power": 100, "damage_type": "magical", "element": "dark", "can_crit": true, "description": "Massive dark damage" }],
	},
	"adventurous_spirit": {
		"id": "adventurous_spirit", "name": "Adventurous Spirit", "card_type": "action",
		"speed": "action", "element": "wind", "pile_destination": "recharge",
		"description": "+2 movement speed this turn.", "target_type": "ally_summon",
		"requirements": [],
		"effects": [{ "type": "buff", "description": "+2 movement", "duration": "end_of_turn" }],
	},
	"second_wind": {
		"id": "second_wind", "name": "Second Wind", "card_type": "action",
		"speed": "action", "element": "wind", "pile_destination": "recharge",
		"description": "Moderate heal + cleanse debuffs.", "target_type": "ally_summon",
		"requirements": [],
		"effects": [{ "type": "heal", "base_power": 30, "can_crit": false, "description": "Heal + cleanse" }],
	},
	"earth_wall": {
		"id": "earth_wall", "name": "Earth Wall", "card_type": "action",
		"speed": "action", "element": "earth", "pile_destination": "recharge",
		"description": "+DEF until end of next turn.", "target_type": "ally_summon",
		"requirements": [],
		"effects": [{ "type": "buff", "description": "+DEF boost", "duration": "end_of_next_turn" }],
	},
	"rally_cry": {
		"id": "rally_cry", "name": "Rally Cry", "card_type": "action",
		"speed": "action", "element": "neutral", "pile_destination": "recharge",
		"description": "All allies gain +1 movement.", "target_type": "ally_summon",
		"requirements": [],
		"effects": [{ "type": "buff", "description": "+1 movement to all allies", "duration": "end_of_turn" }],
	},
	"quick_strike": {
		"id": "quick_strike", "name": "Quick Strike", "card_type": "action",
		"speed": "action", "element": "neutral", "pile_destination": "recharge",
		"description": "Fast physical attack.", "target_type": "enemy_summon",
		"requirements": [{ "type": "role", "role_family": "scout", "description": "Requires Scout" }],
		"effects": [{ "type": "damage", "base_power": 35, "damage_type": "physical_melee", "can_crit": true, "description": "Quick physical hit" }],
	},
	"shadow_step": {
		"id": "shadow_step", "name": "Shadow Step", "card_type": "action",
		"speed": "action", "element": "dark", "pile_destination": "recharge",
		"description": "Teleport summon + bonus damage.", "target_type": "ally_summon",
		"requirements": [{ "type": "role", "role_family": "scout", "description": "Requires Scout" }],
		"effects": [{ "type": "buff", "description": "Teleport + damage boost", "duration": "end_of_turn" }],
	},
	"ice_lance": {
		"id": "ice_lance", "name": "Ice Lance", "card_type": "action",
		"speed": "action", "element": "water", "pile_destination": "discard",
		"description": "Magical water damage + slow.", "target_type": "enemy_summon",
		"requirements": [{ "type": "role", "role_family": "magician", "description": "Requires Magician" }],
		"effects": [{ "type": "damage", "base_power": 50, "damage_type": "magical", "element": "water", "can_crit": true, "description": "Ice damage + slow" }],
	},
	"precision_shot": {
		"id": "precision_shot", "name": "Precision Shot", "card_type": "action",
		"speed": "action", "element": "neutral", "pile_destination": "discard",
		"description": "High-accuracy ranged attack.", "target_type": "enemy_summon",
		"requirements": [{ "type": "role", "role_family": "scout", "description": "Requires Scout" }],
		"effects": [{ "type": "damage", "base_power": 45, "damage_type": "physical_ranged", "can_crit": true, "description": "Precise ranged hit" }],
	},
	"power_surge": {
		"id": "power_surge", "name": "Power Surge", "card_type": "action",
		"speed": "action", "element": "neutral", "pile_destination": "recharge",
		"description": "Greatly boost STR this turn.", "target_type": "ally_summon",
		"requirements": [{ "type": "role", "role_family": "warrior", "description": "Requires Warrior" }],
		"effects": [{ "type": "buff", "description": "+STR surge", "duration": "end_of_turn" }],
	},
	"dark_bargain": {
		"id": "dark_bargain", "name": "Dark Bargain", "card_type": "action",
		"speed": "action", "element": "dark", "pile_destination": "discard",
		"description": "Sacrifice HP to draw 2 cards.", "target_type": "ally_summon",
		"requirements": [],
		"effects": [{ "type": "special", "description": "Sacrifice 20% HP, draw 2" }],
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

# ─── Advance Cards ───

var ADVANCES := {
	"berserker_rage": {
		"id": "berserker_rage", "name": "Berserker Rage", "card_type": "advance",
		"advance_type": "role_change", "element": "neutral", "pile_destination": "discard",
		"description": "Advance Warrior (Lv10+) to Berserker. High STR, low DEF.",
		"target_role": "berserker",
		"requirements": [
			{ "type": "role", "role_id": "warrior", "description": "Must be Warrior" },
			{ "type": "level", "min_level": 10, "description": "Level 10+" },
		],
	},
	"knights_oath": {
		"id": "knights_oath", "name": "Knight's Oath", "card_type": "advance",
		"advance_type": "role_change", "element": "neutral", "pile_destination": "discard",
		"description": "Advance Warrior (Lv7+) to Knight. High DEF and END.",
		"target_role": "knight",
		"requirements": [
			{ "type": "role", "role_id": "warrior", "description": "Must be Warrior" },
			{ "type": "level", "min_level": 7, "description": "Level 7+" },
		],
	},
	"shadow_pact": {
		"id": "shadow_pact", "name": "Shadow Pact", "card_type": "advance",
		"advance_type": "role_change", "element": "dark", "pile_destination": "discard",
		"description": "Advance Magician to Warlock. High INT + LCK, low SPI.",
		"target_role": "warlock",
		"requirements": [
			{ "type": "role", "role_id": "magician", "description": "Must be Magician" },
		],
	},
	"explorers_path": {
		"id": "explorers_path", "name": "Explorer's Path", "card_type": "advance",
		"advance_type": "role_change", "element": "neutral", "pile_destination": "discard",
		"description": "Advance Scout (Lv7+) to Explorer. Balanced SPD and END.",
		"target_role": "explorer",
		"requirements": [
			{ "type": "role", "role_id": "scout", "description": "Must be Scout" },
			{ "type": "level", "min_level": 7, "description": "Level 7+" },
		],
	},
	"rogues_shadow": {
		"id": "rogues_shadow", "name": "Rogue's Shadow", "card_type": "advance",
		"advance_type": "role_change", "element": "dark", "pile_destination": "discard",
		"description": "Advance Scout to Rogue. High SPD + ACC + LCK.",
		"target_role": "rogue",
		"requirements": [
			{ "type": "role", "role_id": "scout", "description": "Must be Scout" },
		],
	},
	"elemental_focus": {
		"id": "elemental_focus", "name": "Elemental Focus", "card_type": "advance",
		"advance_type": "role_change", "element": "fire", "pile_destination": "discard",
		"description": "Advance Magician to Elemental Mage. High INT + MDF.",
		"target_role": "elemental_mage",
		"requirements": [
			{ "type": "role", "role_id": "magician", "description": "Must be Magician" },
		],
	},
	"light_mage_prayer": {
		"id": "light_mage_prayer", "name": "Light Mage's Prayer", "card_type": "advance",
		"advance_type": "role_change", "element": "light", "pile_destination": "discard",
		"description": "Advance Magician to Light Mage. High SPI + healing.",
		"target_role": "light_mage",
		"requirements": [
			{ "type": "role", "role_id": "magician", "description": "Must be Magician" },
		],
	},
}

# ─── Counter Cards ───

var COUNTERS := {
	"dramatic_return": {
		"id": "dramatic_return", "name": "Dramatic Return", "card_type": "counter",
		"element": "light", "pile_destination": "discard",
		"description": "When a summon is defeated, return it with 10% HP.",
		"trigger_condition": "summon_defeated",
		"requirements": [],
		"effects": [{ "type": "special", "description": "Return defeated summon with 10% HP" }],
	},
	"graverobbing": {
		"id": "graverobbing", "name": "Graverobbing", "card_type": "counter",
		"element": "dark", "pile_destination": "discard",
		"description": "Nullify VP gain from defeating a summon.",
		"trigger_condition": "victory_point_gained",
		"requirements": [],
		"effects": [{ "type": "special", "description": "Nullify VP gain" }],
	},
	"iron_will": {
		"id": "iron_will", "name": "Iron Will", "card_type": "counter",
		"element": "earth", "pile_destination": "discard",
		"description": "Summon survives defeat with 1 HP instead.",
		"trigger_condition": "summon_defeated",
		"requirements": [],
		"effects": [{ "type": "special", "description": "Survive defeat with 1 HP" }],
	},
	"mirror_shield": {
		"id": "mirror_shield", "name": "Mirror Shield", "card_type": "counter",
		"element": "light", "pile_destination": "discard",
		"description": "Reflect 50% spell damage back at attacker.",
		"trigger_condition": "summon_targeted_spell",
		"requirements": [],
		"effects": [{ "type": "damage", "description": "Reflect 50% spell damage" }],
	},
	"ambush": {
		"id": "ambush", "name": "Ambush", "card_type": "counter",
		"element": "neutral", "pile_destination": "discard",
		"description": "When enemy enters your territory, deal damage.",
		"trigger_condition": "enemy_enters_territory",
		"requirements": [],
		"effects": [{ "type": "damage", "base_power": 40, "damage_type": "physical_melee", "description": "Ambush damage" }],
	},
}

# ─── Reaction Cards ───

var REACTIONS := {
	"tactical_retreat": {
		"id": "tactical_retreat", "name": "Tactical Retreat", "card_type": "reaction",
		"element": "wind", "pile_destination": "recharge",
		"description": "Move a summon up to 3 spaces after being attacked.",
		"trigger_condition": "after_attacked",
		"requirements": [],
		"effects": [{ "type": "movement", "description": "Move 3 spaces after attack" }],
	},
	"battle_meditation": {
		"id": "battle_meditation", "name": "Battle Meditation", "card_type": "reaction",
		"element": "neutral", "pile_destination": "recharge",
		"description": "After dealing damage, heal caster for 25% of damage dealt.",
		"trigger_condition": "after_dealing_damage",
		"requirements": [],
		"effects": [{ "type": "heal", "description": "Heal 25% of damage dealt" }],
	},
	"vengeful_strike": {
		"id": "vengeful_strike", "name": "Vengeful Strike", "card_type": "reaction",
		"element": "fire", "pile_destination": "discard",
		"description": "When ally is defeated, nearest summon gains +50% STR this turn.",
		"trigger_condition": "ally_defeated",
		"requirements": [],
		"effects": [{ "type": "buff", "description": "+50% STR after ally defeated" }],
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
		"main_deck": _dup_all([
			ACTIONS["sharpened_blade"],
			ACTIONS["healing_hands"],
			ACTIONS["rush"],
			ACTIONS["rush"],
			ACTIONS["tempest_slash"],
			ACTIONS["adventurous_spirit"],
			ACTIONS["battle_cry"],
			ACTIONS["mend_wounds"],
			ACTIONS["shield_bash"],
			ACTIONS["second_wind"],
			ACTIONS["earth_wall"],
			ACTIONS["rally_cry"],
			BUILDINGS["gignen_country"],
			BUILDINGS["healing_spring"],
			QUESTS["nearwood_forest"],
			QUESTS["nearwood_forest"],
			QUESTS["trial_of_strength"],
			COUNTERS["dramatic_return"],
			COUNTERS["iron_will"],
			REACTIONS["tactical_retreat"],
		]),
		"advance_deck": _dup_all([
			ADVANCES["berserker_rage"],
			ADVANCES["knights_oath"],
			ADVANCES["explorers_path"],
			ADVANCES["light_mage_prayer"],
		]),
	}


func create_player_b_deck() -> Dictionary:
	return {
		"summon_slots": [
			{ "summon": SUMMONS["fae_magician_b"].duplicate(true), "role_id": "magician" },
			{ "summon": SUMMONS["stoneheart_warrior_b"].duplicate(true), "role_id": "warrior" },
			{ "summon": SUMMONS["wilderling_scout_b"].duplicate(true), "role_id": "scout" },
		],
		"main_deck": _dup_all([
			ACTIONS["blast_bolt"],
			ACTIONS["blast_bolt"],
			ACTIONS["fireball"],
			ACTIONS["drain_touch"],
			ACTIONS["ensnare"],
			ACTIONS["dual_shot"],
			ACTIONS["quick_strike"],
			ACTIONS["shadow_step"],
			ACTIONS["obliterate"],
			ACTIONS["ice_lance"],
			ACTIONS["precision_shot"],
			ACTIONS["power_surge"],
			ACTIONS["dark_bargain"],
			ACTIONS["healing_hands"],
			ACTIONS["mend_wounds"],
			COUNTERS["graverobbing"],
			COUNTERS["ambush"],
			REACTIONS["vengeful_strike"],
			REACTIONS["battle_meditation"],
		]),
		"advance_deck": _dup_all([
			ADVANCES["shadow_pact"],
			ADVANCES["rogues_shadow"],
			ADVANCES["elemental_focus"],
		]),
	}


func create_random_deck() -> Dictionary:
	## Generate a random deck with procedural summons.
	var species_list: Array = SpeciesData.get_all_ids()
	var role_map := { "warrior": "warrior", "magician": "magician", "scout": "scout",
		"gignen": "warrior", "fae": "magician", "stoneheart": "warrior",
		"wilderling": "scout", "angar": "magician", "demar": "magician", "creptilis": "scout" }

	var summon_slots: Array = []
	for i in range(3):
		var sp: String = species_list[randi() % species_list.size()]
		var template: Dictionary = SpeciesData.get_template(sp)
		var summon := _generate_random_summon(sp, template, i)
		var role_id: String = role_map.get(sp, "warrior")
		summon_slots.append({ "summon": summon, "role_id": role_id })

	# Random selection of action cards
	var all_action_keys: Array = ACTIONS.keys()
	all_action_keys.shuffle()
	var main_deck: Array = []
	for j in range(mini(10, all_action_keys.size())):
		main_deck.append(ACTIONS[all_action_keys[j]].duplicate(true))
	# Add a quest and building
	main_deck.append(QUESTS["nearwood_forest"].duplicate(true))
	main_deck.append(BUILDINGS["healing_spring"].duplicate(true))

	# Random advances
	var all_advance_keys: Array = ADVANCES.keys()
	all_advance_keys.shuffle()
	var advance_deck: Array = []
	for k in range(mini(3, all_advance_keys.size())):
		advance_deck.append(ADVANCES[all_advance_keys[k]].duplicate(true))

	return { "summon_slots": summon_slots, "main_deck": main_deck, "advance_deck": advance_deck }


func _generate_random_summon(species_id: String, template: Dictionary, index: int) -> Dictionary:
	var stat_ranges: Dictionary = template.get("stat_ranges", {})
	var base_stats := {}
	var growth_types: Array[String] = ["minimal", "steady", "normal", "gradual", "accelerated", "exceptional"]

	for key in Stats.STAT_KEYS:
		var range_val: Array = stat_ranges.get(key, [8, 12])
		base_stats[key] = randi_range(range_val[0], range_val[1])

	var growth_rates := {}
	for key in Stats.STAT_KEYS:
		growth_rates[key] = growth_types[randi() % growth_types.size()]

	# Pick a random weapon
	var weapon_keys: Array = WEAPONS.keys()
	var weapon: Dictionary = WEAPONS[weapon_keys[randi() % weapon_keys.size()]].duplicate(true)

	return {
		"id": "random_%s_%d" % [species_id, index],
		"name": "%s %s" % [template.get("name", species_id).capitalize(), ["Warrior", "Scout", "Mage"][index % 3]],
		"card_type": "summon",
		"species": species_id,
		"rarity": ["common", "uncommon", "rare"][randi() % 3],
		"element": ["neutral", "fire", "water", "earth", "wind"][randi() % 5],
		"description": template.get("description", ""),
		"requirements": [],
		"pile_destination": "removed",
		"base_stats": base_stats,
		"growth_rates": growth_rates,
		"equipment": {
			"weapon": weapon,
			"offhand": {},
			"armor": {},
			"accessory": {},
		},
	}


func _dup_all(cards: Array) -> Array:
	var result: Array = []
	for c in cards:
		result.append(c.duplicate(true))
	return result
