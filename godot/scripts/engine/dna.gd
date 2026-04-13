extends RefCounted
## Card DNA System — deterministic card identity.
## DNA is a 32-char hex string encoding every random decision in card generation.
## Given the same DNA, reconstruct() always produces the exact same card.
## Ported from src/engine/dna/index.ts

const DNA_VERSION := 0x01

const SPECIES_ORDER := ["gignen", "fae", "stoneheart", "wilderling", "angar", "demar", "creptilis"]
const RARITY_ORDER := ["common", "uncommon", "rare", "legend", "myth"]
const GROWTH_RATE_ORDER := ["minimal", "steady", "normal", "gradual", "accelerated", "exceptional"]

const GROWTH_WEIGHTS_BY_RARITY := {
	"common":   [10, 20, 40, 20, 8, 2],
	"uncommon": [5, 15, 35, 25, 15, 5],
	"rare":     [2, 10, 28, 30, 20, 10],
	"legend":   [0, 5, 20, 30, 28, 17],
	"myth":     [0, 0, 10, 25, 35, 30],
}

const STAT_KEYS := ["STR", "END", "DEF", "INT", "SPI", "MDF", "SPD", "ACC", "LCK"]

const PREFIXES := {
	"gignen": ["Ael", "Brin", "Cal", "Dorn", "Fen", "Gael", "Harn", "Kel", "Lor", "Myr"],
	"fae": ["Auri", "Bel", "Cel", "Dew", "Elan", "Fey", "Gil", "Haze", "Iris", "Lum"],
	"stoneheart": ["Bor", "Crag", "Dur", "Flint", "Grit", "Hew", "Iron", "Krag", "Mor", "Rok"],
	"wilderling": ["Ash", "Briar", "Claw", "Dusk", "Fang", "Growl", "Hunt", "Ivy", "Kite", "Leaf"],
	"angar": ["Aur", "Bright", "Cel", "Dawn", "Ether", "Flux", "Glow", "Halo", "Lux", "Nova"],
	"demar": ["Blaze", "Char", "Ember", "Flick", "Hex", "Jinx", "Knack", "Nix", "Quirk", "Spark"],
	"creptilis": ["Bane", "Coil", "Dread", "Edge", "Fume", "Gloom", "Husk", "Lurk", "Murk", "Shade"],
}

const SUFFIXES := ["wind", "stone", "blade", "heart", "thorn", "spark", "shade", "crest", "fang", "vale"]


# ─── Mulberry32 PRNG ──────────────────────────────────────────────────────────

class Mulberry32:
	var _state: int

	func _init(seed: int) -> void:
		_state = seed

	func next() -> float:
		_state = (_state + 0x6d2b79f5) & 0xFFFFFFFF
		var t: int = _state ^ (_state >> 15)
		t = (t * (1 | _state)) & 0xFFFFFFFF
		t = (t + ((t ^ (t >> 7)) * (61 | t) & 0xFFFFFFFF)) ^ t
		return float((t ^ (t >> 14)) & 0x7FFFFFFF) / 2147483648.0


static func _seeded_int(rng: Mulberry32, min_val: int, max_val: int) -> int:
	return min_val + floori(rng.next() * (max_val - min_val + 1))


static func _seeded_weighted_choice(rng: Mulberry32, options: Array, weights: Array) -> String:
	var total := 0.0
	for w in weights:
		total += float(w)
	var roll: float = rng.next() * total
	for i in range(options.size()):
		roll -= float(weights[i])
		if roll <= 0:
			return options[i]
	return options[options.size() - 1]


# ─── DNA Parsing ──────────────────────────────────────────────────────────────

static func parse_dna(dna: String) -> Dictionary:
	var hex := dna.to_lower()
	return {
		"version": hex.substr(0, 2).hex_to_int(),
		"species_index": hex.substr(2, 2).hex_to_int(),
		"rarity_index": (hex.substr(4, 3).hex_to_int() >> 8) & 0xF,
		"name_seed": hex.substr(7, 3).hex_to_int(),
		"growth_seed": hex.substr(10, 5).hex_to_int(),
		"stat_seed_a": hex.substr(15, 3).hex_to_int(),
		"stat_seed_b": hex.substr(18, 3).hex_to_int(),
		"stat_seed_c": hex.substr(21, 3).hex_to_int(),
		"equipment_seed": hex.substr(24, 3).hex_to_int(),
		"flair_seed": hex.substr(27, 3).hex_to_int(),
		"checksum": hex.substr(30, 2).hex_to_int(),
	}


# ─── DNA Generation ───────────────────────────────────────────────────────────

static func generate_dna(species: String = "", rarity: String = "") -> String:
	var species_idx: int
	if species != "" and species in SPECIES_ORDER:
		species_idx = SPECIES_ORDER.find(species)
	else:
		species_idx = randi() % SPECIES_ORDER.size()

	var rarity_idx: int
	if rarity != "" and rarity in RARITY_ORDER:
		rarity_idx = RARITY_ORDER.find(rarity)
	else:
		rarity_idx = randi() % RARITY_ORDER.size()

	var name_seed := randi() % 0xFFF
	var growth_seed := randi() % 0xFFFFF
	var stat_seed_a := randi() % 0xFFF
	var stat_seed_b := randi() % 0xFFF
	var stat_seed_c := randi() % 0xFFF
	var equipment_seed := randi() % 0xFFF
	var flair_seed := randi() % 0xFFF

	var body := ""
	body += _to_hex(DNA_VERSION, 2)
	body += _to_hex(species_idx, 2)
	body += _to_hex(rarity_idx << 8, 3)
	body += _to_hex(name_seed, 3)
	body += _to_hex(growth_seed, 5)
	body += _to_hex(stat_seed_a, 3)
	body += _to_hex(stat_seed_b, 3)
	body += _to_hex(stat_seed_c, 3)
	body += _to_hex(equipment_seed, 3)
	body += _to_hex(flair_seed, 3)

	var xor_val := _compute_checksum(body)
	return body + _to_hex(xor_val, 2)


# ─── DNA Validation ───────────────────────────────────────────────────────────

static func validate_dna(dna: String) -> bool:
	if dna.length() != 32:
		return false
	var regex := RegEx.new()
	regex.compile("^[0-9a-fA-F]+$")
	if not regex.search(dna):
		return false

	var hex := dna.to_lower()
	var body := hex.substr(0, 30)
	var stored_checksum := hex.substr(30, 2).hex_to_int()
	var computed := _compute_checksum(body)

	if computed != stored_checksum:
		return false

	var parsed := parse_dna(dna)
	if parsed["version"] != DNA_VERSION:
		return false
	if parsed["species_index"] >= SPECIES_ORDER.size():
		return false
	if parsed["rarity_index"] >= RARITY_ORDER.size():
		return false

	return true


# ─── Card Reconstruction ──────────────────────────────────────────────────────

static func reconstruct(dna: String) -> Dictionary:
	if not validate_dna(dna):
		return {}

	var parsed := parse_dna(dna)
	var species: String = SPECIES_ORDER[parsed["species_index"]]
	var rarity: String = RARITY_ORDER[parsed["rarity_index"]]

	# Name
	var name_rng := Mulberry32.new(parsed["name_seed"])
	var prefix_list: Array = PREFIXES[species]
	var prefix: String = prefix_list[_seeded_int(name_rng, 0, prefix_list.size() - 1)]
	var suffix: String = SUFFIXES[_seeded_int(name_rng, 0, SUFFIXES.size() - 1)]
	var card_name: String = prefix + suffix

	# Growth rates
	var growth_rng := Mulberry32.new(parsed["growth_seed"])
	var growth_rates := {}
	var rarity_weights: Array = GROWTH_WEIGHTS_BY_RARITY[rarity]
	for key in STAT_KEYS:
		growth_rates[key] = _seeded_weighted_choice(growth_rng, GROWTH_RATE_ORDER, rarity_weights)

	# Base stats — use species stat ranges from SpeciesData
	var species_data = Engine.get_singleton("SpeciesData") if Engine.has_singleton("SpeciesData") else null
	var stat_ranges: Dictionary = {}
	if species_data:
		var sp: Dictionary = species_data.get_species(species)
		stat_ranges = sp.get("stat_ranges", {})

	var floor_bonus: int = [0, 1, 2, 3, 4][parsed["rarity_index"]]
	var stat_rngs := [
		Mulberry32.new(parsed["stat_seed_a"]),
		Mulberry32.new(parsed["stat_seed_b"]),
		Mulberry32.new(parsed["stat_seed_c"]),
	]
	var stat_groups := [
		["STR", "END", "DEF"],
		["INT", "SPI", "MDF"],
		["SPD", "ACC", "LCK"],
	]

	var base_stats := {}
	for gi in range(3):
		var rng: Mulberry32 = stat_rngs[gi]
		for key in stat_groups[gi]:
			var range_arr: Array = stat_ranges.get(key, [8, 14])
			var min_val: int = mini(int(range_arr[0]) + floor_bonus, int(range_arr[1]))
			base_stats[key] = _seeded_int(rng, min_val, int(range_arr[1]))

	return {
		"id": "dna-%s" % dna,
		"name": card_name,
		"card_type": "summon",
		"species": species,
		"rarity": rarity,
		"element": "neutral",
		"base_stats": base_stats,
		"growth_rates": growth_rates,
		"dna": dna,
	}


# ─── Helpers ──────────────────────────────────────────────────────────────────

static func _to_hex(value: int, width: int) -> String:
	var hex := "%x" % (value & ((1 << (width * 4)) - 1))
	while hex.length() < width:
		hex = "0" + hex
	return hex


static func _compute_checksum(body: String) -> int:
	var xor_val := 0
	for i in range(0, body.length(), 2):
		xor_val ^= body.substr(i, 2).hex_to_int()
	return xor_val & 0xFF
