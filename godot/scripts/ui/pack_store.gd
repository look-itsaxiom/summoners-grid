extends Control
## In-game Pack Store — buy and open card packs.
## Connects to API backend via ApiClient autoload.

const BG_COLOR := Color(0.05, 0.05, 0.1)
const GOLD := Color(1.0, 0.85, 0.0)

var _api: Node
var _is_opening := false
var _result_container: VBoxContainer
var _status_label: Label


func _ready() -> void:
	_api = get_node("/root/ApiClient")
	# Dev mode: auto-login with test wallet
	if not _api.is_authenticated():
		_api.set_auth("0xdev_" + str(Time.get_unix_time_from_system()).md5_text().substr(0, 40))
	_build_ui()


func _build_ui() -> void:
	var bg_path := "res://assets/store_bg.png"
	if ResourceLoader.exists(bg_path):
		var bg_tex := TextureRect.new()
		bg_tex.texture = load(bg_path)
		bg_tex.set_anchors_preset(Control.PRESET_FULL_RECT)
		bg_tex.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		bg_tex.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		add_child(bg_tex)
		var overlay := ColorRect.new()
		overlay.color = Color(0.0, 0.0, 0.03, 0.6)
		overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
		add_child(overlay)
	else:
		var bg := ColorRect.new()
		bg.color = BG_COLOR
		bg.set_anchors_preset(Control.PRESET_FULL_RECT)
		add_child(bg)

	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_top", 20)
	margin.add_theme_constant_override("margin_bottom", 30)
	margin.add_theme_constant_override("margin_left", 60)
	margin.add_theme_constant_override("margin_right", 60)
	add_child(margin)

	var main := VBoxContainer.new()
	main.add_theme_constant_override("separation", 16)
	main.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	margin.add_child(main)

	# Title
	var title := Label.new()
	title.text = "PACK STORE"
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", GOLD)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	main.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "Buy card packs to build your collection"
	subtitle.add_theme_font_size_override("font_size", 12)
	subtitle.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7))
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	main.add_child(subtitle)

	# Coin balance
	var storage = get_node("/root/CardStorage")
	var coins_label := Label.new()
	coins_label.text = "🪙 %d coins" % storage.get_coins()
	coins_label.add_theme_font_size_override("font_size", 16)
	coins_label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.0))
	coins_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	main.add_child(coins_label)

	# Helpful tip when broke
	if storage.get_coins() < CardStorage.PACK_COST_STANDARD:
		var tip := Label.new()
		tip.text = "Play games to earn coins! Win = +150🪙, Lose = +50🪙"
		tip.add_theme_font_size_override("font_size", 11)
		tip.add_theme_color_override("font_color", Color(0.5, 0.6, 0.4))
		tip.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		main.add_child(tip)

	# Status
	_status_label = Label.new()
	_status_label.text = ""
	_status_label.add_theme_font_size_override("font_size", 12)
	_status_label.add_theme_color_override("font_color", Color(0.5, 0.8, 0.5))
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	main.add_child(_status_label)

	# Pack cards
	var packs := HBoxContainer.new()
	packs.add_theme_constant_override("separation", 24)
	packs.alignment = BoxContainer.ALIGNMENT_CENTER
	main.add_child(packs)

	var coins: int = get_node("/root/CardStorage").get_coins()
	_add_pack_card(packs, "Standard Pack", "5 cards\nGuaranteed Uncommon+\nGuaranteed Rare+", "🪙 300", Color(0.3, 0.5, 0.7), "standard", coins >= 300)
	_add_pack_card(packs, "Premium Pack", "10 cards\nGuaranteed Rare+\nGuaranteed Legend+", "🪙 1,000", Color(0.7, 0.6, 0.3), "premium", coins >= 1000)

	# Coin bundles teaser
	var coin_label := Label.new()
	coin_label.text = "COIN BUNDLES"
	coin_label.add_theme_font_size_override("font_size", 12)
	coin_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	coin_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	main.add_child(coin_label)

	var bundles := HBoxContainer.new()
	bundles.add_theme_constant_override("separation", 12)
	bundles.alignment = BoxContainer.ALIGNMENT_CENTER
	main.add_child(bundles)

	_add_coin_bundle(bundles, "500 🪙", "$0.99")
	_add_coin_bundle(bundles, "1,200 🪙", "$1.99")
	_add_coin_bundle(bundles, "3,000 🪙", "$4.99")
	_add_coin_bundle(bundles, "7,000 🪙", "$9.99")

	# Divider
	var divider := ColorRect.new()
	divider.color = Color(0.3, 0.25, 0.5, 0.4)
	divider.custom_minimum_size = Vector2(0, 1)
	main.add_child(divider)

	# Result area
	var result_label := Label.new()
	result_label.text = "OPENED CARDS"
	result_label.add_theme_font_size_override("font_size", 14)
	result_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8))
	main.add_child(result_label)

	_result_container = VBoxContainer.new()
	_result_container.add_theme_constant_override("separation", 8)
	main.add_child(_result_container)

	var placeholder := Label.new()
	placeholder.text = "Buy a pack to see your new cards here!"
	placeholder.add_theme_font_size_override("font_size", 11)
	placeholder.add_theme_color_override("font_color", Color(0.4, 0.4, 0.5))
	placeholder.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_result_container.add_child(placeholder)

	# Buttons
	var spacer := Control.new()
	spacer.custom_minimum_size.y = 8
	main.add_child(spacer)

	var btn_row := HBoxContainer.new()
	btn_row.add_theme_constant_override("separation", 16)
	btn_row.alignment = BoxContainer.ALIGNMENT_CENTER
	main.add_child(btn_row)

	_add_nav_button(btn_row, "MY COLLECTION", Color(0.3, 0.5, 0.3), func():
		get_node("/root/SceneTransition").change_scene("res://scenes/collection.tscn"))
	_add_nav_button(btn_row, "BACK TO MENU", Color(0.3, 0.3, 0.45), func():
		get_node("/root/SceneTransition").change_scene("res://scenes/menu.tscn"))


func _add_pack_card(parent: HBoxContainer, title_text: String, desc_text: String, price: String, color: Color, pack_type: String, can_afford: bool = true) -> void:
	var display_color: Color = color if can_afford else Color(0.25, 0.25, 0.3)
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(260, 200)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.08, 0.08, 0.14)
	style.border_color = display_color
	style.border_width_top = 2
	style.border_width_bottom = 2
	style.border_width_left = 2
	style.border_width_right = 2
	style.corner_radius_top_left = 10
	style.corner_radius_top_right = 10
	style.corner_radius_bottom_left = 10
	style.corner_radius_bottom_right = 10
	style.content_margin_left = 20
	style.content_margin_right = 20
	style.content_margin_top = 16
	style.content_margin_bottom = 16
	panel.add_theme_stylebox_override("panel", style)
	parent.add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)
	panel.add_child(vbox)

	var t := Label.new()
	t.text = title_text
	t.add_theme_font_size_override("font_size", 18)
	t.add_theme_color_override("font_color", display_color)
	vbox.add_child(t)

	var d := Label.new()
	d.text = desc_text
	d.add_theme_font_size_override("font_size", 11)
	d.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7))
	vbox.add_child(d)

	var p := Label.new()
	p.text = price
	p.add_theme_font_size_override("font_size", 24)
	p.add_theme_color_override("font_color", Color.WHITE)
	vbox.add_child(p)

	var buy_btn := Button.new()
	buy_btn.text = "BUY PACK"
	buy_btn.custom_minimum_size = Vector2(0, 38)
	buy_btn.add_theme_font_size_override("font_size", 14)
	var btn_style := StyleBoxFlat.new()
	btn_style.bg_color = display_color
	btn_style.corner_radius_top_left = 6
	btn_style.corner_radius_top_right = 6
	btn_style.corner_radius_bottom_left = 6
	btn_style.corner_radius_bottom_right = 6
	btn_style.content_margin_top = 8
	btn_style.content_margin_bottom = 8
	buy_btn.add_theme_stylebox_override("normal", btn_style)
	var hover := btn_style.duplicate()
	hover.bg_color = color.lightened(0.15)
	buy_btn.add_theme_stylebox_override("hover", hover)
	var pt := pack_type  # Capture for lambda
	buy_btn.pressed.connect(func(): _buy_pack(pt))
	vbox.add_child(buy_btn)


func _buy_pack(pack_type: String) -> void:
	if _is_opening:
		return

	# Check if player can afford it
	var storage = get_node("/root/CardStorage")
	if not storage.can_afford(pack_type):
		_status_label.text = "Not enough coins! Play games to earn more."
		_status_label.add_theme_color_override("font_color", Color(1.0, 0.3, 0.3))
		return

	# Deduct coins
	storage.spend_coins(pack_type)

	_is_opening = true
	_status_label.text = "Opening pack..."
	_status_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.5))

	# Generate cards locally (offline mode — no server needed)
	var pack_size: int = 10 if pack_type == "premium" else 5
	var cards: Array = _generate_local_pack(pack_size)

	# Save cards to persistent storage (reuse storage from coin check)
	storage.add_pack(cards, pack_type)

	# Check for myth pull achievement
	var achievements = get_node_or_null("/root/Achievements")
	if achievements:
		for card in cards:
			if card.get("rarity", "") == "myth":
				achievements.try_unlock("myth_hunter")
				break
		achievements.check_all()

	# Store pack data in ApiClient for the opening scene to read
	_api.set("_last_pack_data", {
		"success": true,
		"packType": pack_type,
		"packSize": pack_size,
		"cards": cards,
	})

	_is_opening = false
	get_node("/root/SceneTransition").change_scene("res://scenes/pack_opening.tscn")


## Generate a pack of cards locally using randomized species + rarity.
func _generate_local_pack(pack_size: int) -> Array:
	var species_list := ["gignen", "fae", "stoneheart", "wilderling", "angar", "demar", "creptilis"]

	# Species-themed name pools — 30+ per species for variety
	var species_names := {
		"gignen": ["Aldric", "Brennan", "Cedric", "Darian", "Elric", "Gareth", "Haldor", "Kael", "Lorcan", "Maren", "Nolan", "Osric", "Quinn", "Rowan", "Soren", "Thane", "Varen", "Wren", "Alistair", "Brock", "Dorian", "Fenwick", "Griffin", "Harlan", "Jasper", "Kellan", "Magnus", "Orion", "Phelan", "Ryland"],
		"fae": ["Aelindra", "Briseis", "Caelum", "Dewshine", "Elowen", "Faelan", "Glimmer", "Iselda", "Lysara", "Miriel", "Nimue", "Opaline", "Rivanah", "Sylaris", "Thistledown", "Willowmere", "Ambrosine", "Crystallia", "Dawnpetal", "Ethereia", "Floranis", "Gossamer", "Honeydew", "Iridia", "Juniperleaf", "Moonwhisper", "Petalwind", "Shimmerleaf", "Starbloom", "Twillia"],
		"stoneheart": ["Anvil", "Boulderkin", "Cragmore", "Durnhelm", "Forgeborn", "Grannek", "Hammerfall", "Ironvein", "Korrak", "Magmor", "Obsidian", "Quartzfist", "Rumblor", "Slatejaw", "Tungsten", "Basaltus", "Cobaltjaw", "Deepforge", "Embervein", "Flintridge", "Gravelguard", "Ironhelm", "Kragstone", "Orebreaker", "Peakshield", "Runeforge", "Steelvein", "Titangrip", "Understone", "Zincore"],
		"wilderling": ["Ashfang", "Bristleclaw", "Cindermane", "Duskprowl", "Fangripper", "Greymaw", "Howler", "Ironpelt", "Knifewind", "Moonstalker", "Nightfang", "Razorback", "Shadowpaw", "Thornfur", "Windrunner", "Bloodfang", "Copperclaw", "Dirtrunner", "Emberhowl", "Frostbite", "Gravetooth", "Hawkeye", "Irontusk", "Jagscar", "Longclaw", "Mudslider", "Pinefang", "Sharphide", "Stormhowl", "Venomfur"],
		"angar": ["Aethon", "Brighthelm", "Celestine", "Divinor", "Exalted", "Glorian", "Haloward", "Illumina", "Justicar", "Luminar", "Novastar", "Oathkeeper", "Radiance", "Seraphiel", "Valoris", "Aurelius", "Benedictus", "Concordia", "Devotion", "Empyrean", "Faithguard", "Gracewing", "Holybright", "Invictus", "Justarius", "Keraphim", "Lightbearer", "Merciful", "Noblecrown", "Providence"],
		"demar": ["Ashwick", "Blightcurse", "Charscribe", "Doomweave", "Embertrick", "Fiendscrawl", "Grimtome", "Hexfire", "Infernix", "Jinxbolt", "Malicor", "Netherspark", "Pyrestitch", "Shadowink", "Vexshade", "Acidquill", "Brimthorn", "Cryptflame", "Darkbrand", "Evilgrin", "Fellmark", "Gloomhex", "Hellscrawl", "Impburn", "Jestercurse", "Knifetongue", "Lichwhisper", "Madmark", "Nightpact", "Plaguescrawl"],
		"creptilis": ["Basilisk", "Cobriel", "Dracofen", "Frostscale", "Gekkora", "Hydrix", "Iguana", "Komodos", "Lacertus", "Mambara", "Naga", "Pythara", "Salamandrix", "Taipanos", "Viperion", "Amphibus", "Chamelios", "Dracolis", "Elapidae", "Fangcoil", "Gatorix", "Herpeton", "Iguanox", "Jawscale", "Kingcobra", "Lizardos", "Monitors", "Newtera", "Ophidius", "Rattlescale"],
	}

	var cards: Array = []
	for i in range(pack_size):
		var sp: String = species_list[randi() % species_list.size()]
		var rarity: String

		# Guarantee rarity for last slots
		if i == pack_size - 1:
			# Last card: rare+
			var roll := randf()
			if roll < 0.7: rarity = "rare"
			elif roll < 0.92: rarity = "legend"
			else: rarity = "myth"
		elif i == pack_size - 2:
			# Second to last: uncommon+
			var roll := randf()
			if roll < 0.6: rarity = "uncommon"
			elif roll < 0.85: rarity = "rare"
			elif roll < 0.97: rarity = "legend"
			else: rarity = "myth"
		else:
			# Normal slot
			var roll := randf()
			if roll < 0.5: rarity = "common"
			elif roll < 0.75: rarity = "uncommon"
			elif roll < 0.9: rarity = "rare"
			elif roll < 0.97: rarity = "legend"
			else: rarity = "myth"

		var pool: Array = species_names.get(sp, ["Unknown"])
		var card_name: String = pool[randi() % pool.size()]

		# Rarer cards get titles
		if rarity == "legend":
			var titles := ["the Bold", "the Wise", "the Fierce", "the Ancient", "the Radiant"]
			card_name += " %s" % titles[randi() % titles.size()]
		elif rarity == "myth":
			var titles := ["the Eternal", "the Mythic", "Worldbreaker", "Godslayer", "the Immortal"]
			card_name += " %s" % titles[randi() % titles.size()]

		# Generate a fake DNA hex string
		var dna := ""
		for _j in range(32):
			dna += "0123456789abcdef"[randi() % 16]

		# Generate stats based on species ranges + rarity bonus
		var stat_total := {"common": 70, "uncommon": 80, "rare": 90, "legend": 105, "myth": 120}
		var budget: int = stat_total.get(rarity, 70) + randi() % 10
		var stats := _distribute_stats(budget, sp)

		cards.append({
			"name": card_name,
			"species": sp,
			"rarity": rarity,
			"dna": dna,
			"power": budget,
			"stats": stats,
		})

	return cards


## Distribute a stat budget across 9 stats with species bias.
func _distribute_stats(budget: int, species: String) -> Dictionary:
	# Species primary stat biases
	var bias := {
		"gignen": ["STR", "LCK"],
		"fae": ["INT", "SPI"],
		"stoneheart": ["END", "DEF"],
		"wilderling": ["SPD", "STR"],
		"angar": ["ACC", "INT"],
		"demar": ["INT", "MDF"],
		"creptilis": ["DEF", "SPI"],
	}
	var primary_stats: Array = bias.get(species, ["STR", "INT"])
	var all_stats := ["STR", "END", "DEF", "INT", "SPI", "MDF", "SPD", "ACC", "LCK"]

	var stats := {}
	var remaining := budget

	# Give primary stats a boost
	for ps in primary_stats:
		var val := 8 + randi() % 6  # 8-13
		stats[ps] = val
		remaining -= val

	# Distribute rest evenly with variance
	var other_stats: Array = []
	for s in all_stats:
		if not stats.has(s):
			other_stats.append(s)

	var per_stat: int = int(remaining) / int(other_stats.size())
	for s in other_stats:
		var val := maxi(4, per_stat - 2 + randi() % 5)
		stats[s] = val
		remaining -= val

	# Dump remainder into random stat
	if remaining > 0:
		stats[all_stats[randi() % all_stats.size()]] += remaining

	return stats


func _add_coin_bundle(parent: HBoxContainer, coins_text: String, price: String) -> void:
	var btn := Button.new()
	btn.text = "%s\n%s" % [coins_text, price]
	btn.custom_minimum_size = Vector2(110, 50)
	btn.add_theme_font_size_override("font_size", 11)
	btn.disabled = true  # Coming soon
	btn.tooltip_text = "Coming soon — real money purchases"
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.12, 0.1, 0.06)
	style.border_color = Color(0.4, 0.35, 0.15)
	style.border_width_top = 1
	style.border_width_bottom = 1
	style.border_width_left = 1
	style.border_width_right = 1
	style.corner_radius_top_left = 6
	style.corner_radius_top_right = 6
	style.corner_radius_bottom_left = 6
	style.corner_radius_bottom_right = 6
	btn.add_theme_stylebox_override("normal", style)
	btn.add_theme_stylebox_override("disabled", style)
	parent.add_child(btn)


func _add_nav_button(parent: HBoxContainer, text: String, color: Color, callback: Callable) -> void:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(160, 42)
	btn.add_theme_font_size_override("font_size", 14)
	btn.pressed.connect(callback)
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	btn.add_theme_stylebox_override("normal", style)
	var hover := style.duplicate()
	hover.bg_color = color.lightened(0.15)
	btn.add_theme_stylebox_override("hover", hover)
	parent.add_child(btn)
