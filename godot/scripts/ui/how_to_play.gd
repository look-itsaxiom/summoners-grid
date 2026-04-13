extends Control
## How to Play screen — teaches new players the game basics.

const BG_COLOR := Color(0.05, 0.05, 0.1)
const GOLD := Color(1.0, 0.85, 0.0)
const HEADER_COLOR := Color(0.9, 0.8, 0.5)
const TEXT_COLOR := Color(0.75, 0.75, 0.85)
const ACCENT := Color(0.5, 0.7, 1.0)


func _ready() -> void:
	_build_ui()


func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = BG_COLOR
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var scroll := ScrollContainer.new()
	scroll.set_anchors_preset(Control.PRESET_FULL_RECT)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	add_child(scroll)

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_top", 20)
	margin.add_theme_constant_override("margin_bottom", 30)
	margin.add_theme_constant_override("margin_left", 80)
	margin.add_theme_constant_override("margin_right", 80)
	margin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(margin)

	var main := VBoxContainer.new()
	main.add_theme_constant_override("separation", 14)
	main.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	margin.add_child(main)

	# Title
	_add_label(main, "HOW TO PLAY", 28, GOLD, HORIZONTAL_ALIGNMENT_CENTER)
	_add_label(main, "Summoner's Grid — Tactical Grid-Based RPG Card Game", 12, Color(0.6, 0.6, 0.7), HORIZONTAL_ALIGNMENT_CENTER)

	# Objective
	_add_divider(main)
	_add_label(main, "OBJECTIVE", 16, HEADER_COLOR)
	_add_label(main, "Be the first player to earn 3 Victory Points (VP). Defeat enemy summons and attack their territory to earn VP.", 12, TEXT_COLOR)

	# Turn Structure
	_add_divider(main)
	_add_label(main, "TURN STRUCTURE", 16, HEADER_COLOR)
	_add_text_block(main, [
		"Each turn has 4 phases:",
		"",
		"1. DRAW PHASE — Draw a card from your Main Deck (skipped on Turn 1)",
		"2. LEVEL PHASE — All your summons on the board gain 1 level, recalculating stats",
		"3. ACTION PHASE — Place summons, play cards, move units, attack enemies",
		"4. END PHASE — Turn passes to your opponent",
	])

	# Summons
	_add_divider(main)
	_add_label(main, "SUMMON CARDS", 16, HEADER_COLOR)
	_add_text_block(main, [
		"Your deck contains 3 Summon Cards. During the Action Phase, play one summon per turn:",
		"",
		"• Select a Summon from your hand and place it on a valid territory space",
		"• Summons enter at Level 5 with stats based on species, role, and equipment",
		"• After placing, you draw 3 cards from your Main Deck",
		"• Each summon has a Role (Warrior, Magician, Scout) that affects stats and card access",
	])

	# Action Cards
	_add_divider(main)
	_add_label(main, "ACTION CARDS", 16, HEADER_COLOR)
	_add_text_block(main, [
		"Action cards are your main tools for combat and support:",
		"",
		"• Each card has requirements (e.g., \"Requires Warrior summon\")",
		"• Select a card, then click a valid target on the board",
		"• Effects resolve through the Effect Stack (last played resolves first)",
		"• Cards go to Discard or Recharge pile after use",
		"",
		"Other card types: Building (placed on board), Quest (complete for VP + levels),",
		"Counter (set face-down, triggers automatically), Reaction (responds to events),",
		"Advance (changes a summon's role to a higher tier)",
	])

	# Combat
	_add_divider(main)
	_add_label(main, "COMBAT", 16, HEADER_COLOR)
	_add_text_block(main, [
		"Click your summon on the board to select it. Blue cells show valid moves,",
		"red cells show attackable enemies.",
		"",
		"• Movement: Based on SPD stat. Click a blue cell to move.",
		"• Attack: Click a red-highlighted enemy. Requires an equipped weapon.",
		"• Hit Chance: BaseAccuracy + (ACC / 10) — roll under to hit",
		"• Critical Hits: Based on LCK stat — deals 1.5x damage",
		"• Damage types: Physical Melee (STR), Physical Ranged (STR+ACC), Magical (INT)",
		"• Defense: Physical attacks vs DEF, Magical attacks vs MDF",
	])

	# Victory Points
	_add_divider(main)
	_add_label(main, "VICTORY POINTS", 16, HEADER_COLOR)
	_add_text_block(main, [
		"First to 3 VP wins the game!",
		"",
		"• Defeat a Tier 1 summon: 1 VP",
		"• Defeat a Tier 2+ summon: 2 VP",
		"• Attack enemy territory (end turn with a summon in their zone, no defenders): 1 VP",
	])

	# Elements
	_add_divider(main)
	_add_label(main, "ELEMENTS", 16, HEADER_COLOR)
	_add_text_block(main, [
		"Elemental advantages deal 1.25x damage:",
		"",
		"Fire > Wind > Earth > Water > Fire",
		"Light <> Dark (both deal bonus damage to each other)",
		"Neutral has no advantages or weaknesses",
	])

	# Economy
	_add_divider(main)
	_add_label(main, "COLLECTING CARDS", 16, HEADER_COLOR)
	_add_text_block(main, [
		"Build your collection by opening card packs from the Pack Store:",
		"",
		"• You start with 500 coins and 3 starter cards",
		"• Standard Pack (300 coins): 5 cards, guaranteed Uncommon+ and Rare+",
		"• Premium Pack (1,000 coins): 10 cards, guaranteed Rare+ and Legend+",
		"• 5 rarities: Common, Uncommon, Rare, Legend, and Myth",
		"• Rarer cards have higher stats and Power levels",
		"",
		"Earn coins by playing:",
		"• Win a match: +150 coins",
		"• Lose a match: +50 coins",
		"• Daily login bonus: +100 coins",
		"",
		"Use the Deck Builder to select 3 summons from your collection",
		"and take them into battle. Rarer cards are genuinely stronger!",
	])

	# Tips
	_add_divider(main)
	_add_label(main, "TIPS", 16, HEADER_COLOR)
	_add_text_block(main, [
		"• Review your deck before battle using the Deck Preview screen",
		"• Level up your summons — higher level = stronger stats",
		"• Use Quest cards to gain bonus levels quickly",
		"• Advance your summons to Tier 2+ roles for powerful stat modifiers",
		"• Set Counter cards face-down to surprise your opponent",
		"• Position your summons strategically — protect your territory!",
	])

	# Back button
	var spacer := Control.new()
	spacer.custom_minimum_size.y = 10
	main.add_child(spacer)

	var btn_row := HBoxContainer.new()
	btn_row.alignment = BoxContainer.ALIGNMENT_CENTER
	main.add_child(btn_row)

	var back_btn := Button.new()
	back_btn.text = "BACK TO MENU"
	back_btn.custom_minimum_size = Vector2(200, 44)
	back_btn.add_theme_font_size_override("font_size", 16)
	back_btn.pressed.connect(func(): get_tree().change_scene_to_file("res://scenes/menu.tscn"))
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.3, 0.3, 0.45)
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	back_btn.add_theme_stylebox_override("normal", style)
	var hover := style.duplicate()
	hover.bg_color = style.bg_color.lightened(0.15)
	back_btn.add_theme_stylebox_override("hover", hover)
	btn_row.add_child(back_btn)


func _add_label(parent: VBoxContainer, text: String, font_sz: int, color: Color, align: int = HORIZONTAL_ALIGNMENT_LEFT) -> void:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", font_sz)
	label.add_theme_color_override("font_color", color)
	label.horizontal_alignment = align
	label.autowrap_mode = TextServer.AUTOWRAP_WORD
	parent.add_child(label)


func _add_text_block(parent: VBoxContainer, lines: Array) -> void:
	var label := Label.new()
	label.text = "\n".join(lines)
	label.add_theme_font_size_override("font_size", 11)
	label.add_theme_color_override("font_color", TEXT_COLOR)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD
	parent.add_child(label)


func _add_divider(parent: VBoxContainer) -> void:
	var rect := ColorRect.new()
	rect.color = Color(0.3, 0.25, 0.5, 0.4)
	rect.custom_minimum_size = Vector2(0, 1)
	parent.add_child(rect)
