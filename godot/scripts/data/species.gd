extends Node
## Species templates — ported from src/data/species.ts
## 7 species with stat ranges [min, max] per stat.

var SPECIES := {
	"gignen": {
		"id": "gignen", "name": "Gignen",
		"description": "Versatile and adaptive generalists suited to any role.",
		"stat_ranges": {
			"STR": [8, 12], "END": [8, 12], "DEF": [8, 12],
			"INT": [8, 12], "SPI": [8, 12], "MDF": [8, 12],
			"SPD": [8, 12], "ACC": [8, 12], "LCK": [8, 12],
		},
	},
	"fae": {
		"id": "fae", "name": "Fae",
		"description": "Graceful and intelligent, well-rounded for magical positions.",
		"stat_ranges": {
			"STR": [6, 12], "END": [6, 12], "DEF": [6, 14],
			"INT": [10, 16], "SPI": [10, 14], "MDF": [8, 14],
			"SPD": [8, 14], "ACC": [8, 14], "LCK": [6, 12],
		},
	},
	"stoneheart": {
		"id": "stoneheart", "name": "Stoneheart",
		"description": "Stalwart and industrious craftsfolk and warriors.",
		"stat_ranges": {
			"STR": [8, 14], "END": [10, 16], "DEF": [10, 14],
			"INT": [4, 10], "SPI": [6, 12], "MDF": [6, 12],
			"SPD": [4, 10], "ACC": [6, 12], "LCK": [6, 10],
		},
	},
	"wilderling": {
		"id": "wilderling", "name": "Wilderling",
		"description": "Agile and primal with keen senses and physical prowess.",
		"stat_ranges": {
			"STR": [10, 16], "END": [8, 14], "DEF": [6, 12],
			"INT": [4, 10], "SPI": [4, 10], "MDF": [4, 10],
			"SPD": [10, 16], "ACC": [8, 14], "LCK": [8, 14],
		},
	},
	"angar": {
		"id": "angar", "name": "Angar",
		"description": "Celestial and wise, known for strategic prowess and light magic mastery.",
		"stat_ranges": {
			"STR": [8, 16], "END": [6, 12], "DEF": [6, 12],
			"INT": [8, 14], "SPI": [8, 14], "MDF": [8, 14],
			"SPD": [6, 12], "ACC": [10, 16], "LCK": [6, 12],
		},
	},
	"demar": {
		"id": "demar", "name": "Demar",
		"description": "Inventive and clever devils excelling in crafting and magical support.",
		"stat_ranges": {
			"STR": [4, 10], "END": [6, 12], "DEF": [6, 10],
			"INT": [12, 16], "SPI": [8, 14], "MDF": [10, 16],
			"SPD": [6, 12], "ACC": [6, 12], "LCK": [8, 14],
		},
	},
	"creptilis": {
		"id": "creptilis", "name": "Creptilis",
		"description": "Calculated and resilient, balancing endurance and defense with sharp battle focus.",
		"stat_ranges": {
			"STR": [6, 12], "END": [8, 14], "DEF": [8, 14],
			"INT": [6, 12], "SPI": [8, 16], "MDF": [8, 14],
			"SPD": [6, 12], "ACC": [6, 12], "LCK": [6, 12],
		},
	},
}


func get_template(species_id: String) -> Dictionary:
	return SPECIES.get(species_id, {})


func get_all_ids() -> Array[String]:
	var ids: Array[String] = []
	for key in SPECIES:
		ids.append(key)
	return ids
