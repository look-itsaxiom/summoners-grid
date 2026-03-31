extends Node
## Core game constants — ported from src/types/index.ts

# Board
const BOARD_WIDTH := 12
const BOARD_HEIGHT := 14
const TERRITORY_DEPTH := 3

# Summons
const ENTRY_LEVEL := 5
const MAX_LEVEL := 20
const HAND_LIMIT := 6
const SUMMON_DRAW_COUNT := 3

# Combat
const CRIT_MULTIPLIER := 1.5

# Victory
const VP_TO_WIN := 3
const VP_TIER1_DEFEAT := 1
const VP_TIER2_DEFEAT := 2
const VP_TERRITORY_ATTACK := 1

# Growth rate values (per level)
var GROWTH_RATES := {
	"minimal": 0.5,
	"steady": 0.67,
	"normal": 1.0,
	"gradual": 1.33,
	"accelerated": 1.5,
	"exceptional": 2.0,
}

var GROWTH_RATE_SYMBOLS := {
	"minimal": "--",
	"steady": "-",
	"normal": "_",
	"gradual": "+",
	"accelerated": "++",
	"exceptional": "*",
}

# Stat keys
var STAT_KEYS: Array[String] = [
	"STR", "END", "DEF", "INT", "SPI", "MDF", "SPD", "ACC", "LCK"
]

# Elements
var ELEMENTS: Array[String] = ["fire", "water", "earth", "wind", "light", "dark", "neutral"]

var ELEMENT_ADVANTAGES := {
	"fire": "wind",
	"wind": "earth",
	"earth": "water",
	"water": "fire",
	"light": "dark",
	"dark": "light",
	"neutral": "",
}

# Turn phases
var PHASES: Array[String] = ["draw", "level", "action", "end"]

# Pile destinations
const PILE_DISCARD := "discard"
const PILE_RECHARGE := "recharge"
const PILE_REMOVED := "removed"

# Damage types
const DMG_PHYSICAL_MELEE := "physical_melee"
const DMG_PHYSICAL_RANGED := "physical_ranged"
const DMG_MAGICAL := "magical"
