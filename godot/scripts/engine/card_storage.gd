extends Node
## Persistent card storage — saves/loads player's card collection.
## Uses user:// for local persistence. Will sync to server when online.

const SAVE_PATH := "user://card_collection.json"

var _collection: Array = []  # Array of card dictionaries
var _pack_history: Array = []  # Array of { timestamp, pack_type, card_count }
var _coins: int = 500  # Starting coins — enough for 1 free standard pack
var _total_matches: int = 0
var _total_wins: int = 0

const PACK_COST_STANDARD := 300  # 300 coins = $3 equivalent
const PACK_COST_PREMIUM := 1000  # 1000 coins = $10 equivalent
const WIN_REWARD := 150  # Coins for winning
const LOSS_REWARD := 50  # Coins for losing (participation)


var _has_claimed_starter := false
var _last_daily_claim: String = ""  # ISO date of last daily bonus
const DAILY_BONUS := 100  # Free coins per day


func _ready() -> void:
	load_collection()
	_check_starter_pack()
	_check_daily_bonus()


## Grant a free starter pack on first launch.
func _check_starter_pack() -> void:
	if _has_claimed_starter or _collection.size() > 0:
		return

	# Generate 3 starter summons — one warrior, one magician, one scout
	var starters := [
		{"name": "Starter Warrior", "species": "gignen", "rarity": "uncommon", "power": 82,
		 "stats": {"STR": 12, "END": 10, "DEF": 10, "INT": 8, "SPI": 8, "MDF": 7, "SPD": 8, "ACC": 9, "LCK": 10},
		 "dna": "starter_warrior_%d" % randi()},
		{"name": "Starter Magician", "species": "fae", "rarity": "uncommon", "power": 80,
		 "stats": {"STR": 7, "END": 8, "DEF": 8, "INT": 12, "SPI": 11, "MDF": 10, "SPD": 9, "ACC": 8, "LCK": 7},
		 "dna": "starter_magician_%d" % randi()},
		{"name": "Starter Scout", "species": "wilderling", "rarity": "uncommon", "power": 81,
		 "stats": {"STR": 10, "END": 8, "DEF": 7, "INT": 7, "SPI": 7, "MDF": 7, "SPD": 12, "ACC": 11, "LCK": 12},
		 "dna": "starter_scout_%d" % randi()},
	]

	for card in starters:
		card["acquired_at"] = Time.get_datetime_string_from_system()
		card["source"] = "starter_pack"
		_collection.append(card)

	_has_claimed_starter = true
	save_collection()


## Check and grant daily login bonus.
func _check_daily_bonus() -> void:
	var today := Time.get_date_string_from_system()
	if _last_daily_claim == today:
		return
	_last_daily_claim = today
	_coins += DAILY_BONUS
	save_collection()


## Check if daily bonus was claimed today.
func got_daily_bonus_today() -> bool:
	return _last_daily_claim == Time.get_date_string_from_system()


## Get all owned cards.
func get_cards() -> Array:
	return _collection


## Get card count.
func get_card_count() -> int:
	return _collection.size()


## Get cards filtered by criteria.
func get_filtered(species: String = "", rarity: String = "") -> Array:
	var result: Array = []
	for card in _collection:
		if species != "" and card.get("species", "") != species:
			continue
		if rarity != "" and card.get("rarity", "") != rarity:
			continue
		result.append(card)
	return result


## Add cards from a pack opening.
func add_pack(cards: Array, pack_type: String) -> void:
	for card in cards:
		card["acquired_at"] = Time.get_datetime_string_from_system()
		card["source"] = "pack_%s" % pack_type
		_collection.append(card)

	_pack_history.append({
		"timestamp": Time.get_datetime_string_from_system(),
		"pack_type": pack_type,
		"card_count": cards.size(),
	})

	save_collection()


## Get pack opening history.
func get_pack_history() -> Array:
	return _pack_history


## Get current coin balance.
func get_coins() -> int:
	return _coins


## Check if player can afford a pack.
func can_afford(pack_type: String) -> bool:
	var cost: int = PACK_COST_PREMIUM if pack_type == "premium" else PACK_COST_STANDARD
	return _coins >= cost


## Spend coins on a pack. Returns true if successful.
func spend_coins(pack_type: String) -> bool:
	var cost: int = PACK_COST_PREMIUM if pack_type == "premium" else PACK_COST_STANDARD
	if _coins < cost:
		return false
	_coins -= cost
	save_collection()
	return true


## Award coins for completing a match.
func award_match_coins(won: bool) -> int:
	var reward: int = WIN_REWARD if won else LOSS_REWARD
	_coins += reward
	_total_matches += 1
	if won:
		_total_wins += 1
	save_collection()
	return reward


## Add coins directly (bonuses, purchases, etc.)
func add_coins(amount: int) -> void:
	_coins += amount
	save_collection()


## Get match stats.
func get_match_stats() -> Dictionary:
	return {"total": _total_matches, "wins": _total_wins, "losses": _total_matches - _total_wins}


## Get player rank based on total wins.
func get_rank() -> Dictionary:
	var ranks := [
		{"name": "Novice", "min": 0, "color": Color(0.5, 0.5, 0.5)},
		{"name": "Apprentice", "min": 3, "color": Color(0.3, 0.7, 0.3)},
		{"name": "Warrior", "min": 10, "color": Color(0.3, 0.5, 0.9)},
		{"name": "Champion", "min": 25, "color": Color(1.0, 0.75, 0.0)},
		{"name": "Master", "min": 50, "color": Color(0.85, 0.2, 0.85)},
		{"name": "Legend", "min": 100, "color": Color(1.0, 0.4, 0.2)},
	]
	var current: Dictionary = ranks[0]
	for r in ranks:
		if _total_wins >= r["min"]:
			current = r
	var next_rank: Dictionary = {}
	for i in range(ranks.size() - 1):
		if ranks[i]["name"] == current["name"] and i + 1 < ranks.size():
			next_rank = ranks[i + 1]
			break
	return {"name": current["name"], "color": current["color"], "wins": _total_wins, "next": next_rank}


## Get rarity breakdown.
func get_rarity_counts() -> Dictionary:
	var counts := {}
	for card in _collection:
		var r: String = card.get("rarity", "common")
		counts[r] = counts.get(r, 0) + 1
	return counts


## Get species breakdown.
func get_species_counts() -> Dictionary:
	var counts := {}
	for card in _collection:
		var s: String = card.get("species", "unknown")
		counts[s] = counts.get(s, 0) + 1
	return counts


## Save collection to disk.
func save_collection() -> void:
	var data := {
		"version": 2,
		"collection": _collection,
		"pack_history": _pack_history,
		"coins": _coins,
		"total_matches": _total_matches,
		"total_wins": _total_wins,
		"has_claimed_starter": _has_claimed_starter,
		"last_daily_claim": _last_daily_claim,
		"saved_at": Time.get_datetime_string_from_system(),
	}

	var json := JSON.stringify(data, "\t")
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_error("CardStorage: Failed to save: %s" % FileAccess.get_open_error())
		return
	file.store_string(json)
	file.close()


## Load collection from disk.
func load_collection() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		_collection = []
		_pack_history = []
		return

	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return
	var json_text := file.get_as_text()
	file.close()

	var parsed = JSON.parse_string(json_text)
	if parsed == null or not parsed is Dictionary:
		push_error("CardStorage: Failed to parse save file.")
		return

	var data: Dictionary = parsed
	_collection = data.get("collection", [])
	_pack_history = data.get("pack_history", [])
	_coins = data.get("coins", 500)
	_total_matches = data.get("total_matches", 0)
	_total_wins = data.get("total_wins", 0)
	_has_claimed_starter = data.get("has_claimed_starter", false)
	_last_daily_claim = data.get("last_daily_claim", "")
