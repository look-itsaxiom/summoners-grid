extends Node
## Card Marketplace — P2P card trading with transaction fees.
## Autoload as "Marketplace".
## Currently local-only. Will connect to Supabase when auth is ready.

const SAVE_PATH := "user://marketplace.json"

# Fee structure (the greed)
const LISTING_FEE_PCT := 0.05       # 5% of asking price to list
const TRANSACTION_FEE_PCT := 0.10   # 10% cut on every sale
const FEATURED_COST := 50           # Coins to feature a listing

# Price floors by rarity (can't undercut below this)
const PRICE_FLOORS := {
	"common": 30,
	"uncommon": 75,
	"rare": 200,
	"legend": 500,
	"myth": 2000,
}

# Suggested prices (what the market "expects")
const SUGGESTED_PRICES := {
	"common": 50,
	"uncommon": 125,
	"rare": 350,
	"legend": 800,
	"myth": 3000,
}

# Local listings: Array of { card: Dictionary, price: int, listed_at: String, featured: bool, seller: String }
var listings: Array = []

# Transaction history
var transactions: Array = []
var total_fees_collected := 0

signal card_listed(listing: Dictionary)
signal card_sold(listing: Dictionary, buyer: String)
signal listing_removed(index: int)


func _ready() -> void:
	_load()
	# Seed some NPC listings for offline mode so the marketplace isn't empty
	if listings.is_empty():
		_seed_npc_listings()


## List a card for sale. Returns listing fee charged, or -1 if can't afford.
func list_card(card: Dictionary, card_index: int, price: int) -> int:
	var rarity: String = card.get("rarity", "common")
	var floor_price: int = PRICE_FLOORS.get(rarity, 30)
	if price < floor_price:
		return -1

	var listing_fee: int = maxi(1, int(price * LISTING_FEE_PCT))
	var storage = get_node_or_null("/root/CardStorage")
	if storage == null or storage.get_coins() < listing_fee:
		return -1

	# Charge listing fee
	storage._coins -= listing_fee
	total_fees_collected += listing_fee

	# Remove card from collection and add to listings
	storage.remove_cards_by_indices([card_index])

	var listing := {
		"card": card,
		"price": price,
		"listed_at": Time.get_datetime_string_from_system(),
		"featured": false,
		"seller": "you",
	}
	listings.append(listing)
	card_listed.emit(listing)
	_save()
	return listing_fee


## Buy a listing. Returns true on success.
func buy_listing(listing_index: int) -> bool:
	if listing_index < 0 or listing_index >= listings.size():
		return false

	var listing: Dictionary = listings[listing_index]
	var price: int = listing["price"]
	var storage = get_node_or_null("/root/CardStorage")
	if storage == null or storage.get_coins() < price:
		return false

	# Can't buy your own listings
	if listing.get("seller", "") == "you":
		return false

	# Charge buyer
	storage._coins -= price

	# Transaction fee (taken from the sale price)
	var fee: int = maxi(1, int(price * TRANSACTION_FEE_PCT))
	total_fees_collected += fee

	# Seller gets price minus fee (for NPC sellers, coins just disappear)
	var seller_gets: int = price - fee
	if listing.get("seller", "") == "you":
		storage._coins += seller_gets

	# Give card to buyer
	var card: Dictionary = listing["card"].duplicate()
	card["acquired_at"] = Time.get_datetime_string_from_system()
	card["source"] = "marketplace"
	storage._collection.append(card)
	storage.save_collection()

	# Record transaction
	transactions.append({
		"card_name": card.get("name", "?"),
		"rarity": card.get("rarity", "?"),
		"price": price,
		"fee": fee,
		"date": Time.get_datetime_string_from_system(),
		"type": "buy",
	})

	# Remove listing
	listings.remove_at(listing_index)
	card_sold.emit(listing, "player")
	_save()
	return true


## Remove your own listing (get card back, no refund on listing fee).
func cancel_listing(listing_index: int) -> bool:
	if listing_index < 0 or listing_index >= listings.size():
		return false
	var listing: Dictionary = listings[listing_index]
	if listing.get("seller", "") != "you":
		return false

	var storage = get_node_or_null("/root/CardStorage")
	if storage:
		var card: Dictionary = listing["card"].duplicate()
		card["acquired_at"] = Time.get_datetime_string_from_system()
		card["source"] = "marketplace_return"
		storage._collection.append(card)
		storage.save_collection()

	listings.remove_at(listing_index)
	listing_removed.emit(listing_index)
	_save()
	return true


## Feature a listing for extra visibility.
func feature_listing(listing_index: int) -> bool:
	if listing_index < 0 or listing_index >= listings.size():
		return false
	var storage = get_node_or_null("/root/CardStorage")
	if storage == null or storage.get_coins() < FEATURED_COST:
		return false

	storage._coins -= FEATURED_COST
	total_fees_collected += FEATURED_COST
	listings[listing_index]["featured"] = true
	storage.save_collection()
	_save()
	return true


func get_listings_sorted() -> Array:
	var sorted: Array = listings.duplicate()
	# Featured first, then by price ascending
	sorted.sort_custom(func(a, b):
		if a.get("featured", false) != b.get("featured", false):
			return a.get("featured", false)  # featured = true sorts first
		return a.get("price", 0) < b.get("price", 0)
	)
	return sorted


func _seed_npc_listings() -> void:
	# Generate some NPC cards so the marketplace isn't empty
	var species := ["gignen", "fae", "stoneheart", "wilderling", "angar", "demar", "creptilis"]
	var rarities := ["common", "uncommon", "rare", "legend"]
	var names := ["Shadowblade", "Ironheart", "Starweaver", "Thornguard", "Flamecaller", "Frostfang", "Stormwind", "Duskwalker"]

	for i in range(8):
		var sp: String = species[i % species.size()]
		var rarity: String = rarities[i % rarities.size()]
		var card := {
			"name": names[i],
			"species": sp,
			"rarity": rarity,
			"power": 40 + randi() % 60,
			"element": "neutral",
		}
		var price: int = SUGGESTED_PRICES.get(rarity, 100) + (randi() % 100 - 50)
		price = maxi(price, PRICE_FLOORS.get(rarity, 30))
		listings.append({
			"card": card,
			"price": price,
			"listed_at": Time.get_datetime_string_from_system(),
			"featured": i < 2,
			"seller": "npc_%s" % sp,
		})


func _save() -> void:
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify({
			"listings": listings,
			"transactions": transactions,
			"total_fees": total_fees_collected,
		}, "\t"))
		file.close()


func _load() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return
	var parsed = JSON.parse_string(file.get_as_text())
	file.close()
	if parsed is Dictionary:
		listings = parsed.get("listings", [])
		transactions = parsed.get("transactions", [])
		total_fees_collected = parsed.get("total_fees", 0)
