extends Node
## Persistent card storage — saves/loads player's card collection.
## Uses user:// for local persistence. Will sync to server when online.

const SAVE_PATH := "user://card_collection.json"

var _collection: Array = []  # Array of card dictionaries
var _pack_history: Array = []  # Array of { timestamp, pack_type, card_count }


func _ready() -> void:
	load_collection()


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
		"version": 1,
		"collection": _collection,
		"pack_history": _pack_history,
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
