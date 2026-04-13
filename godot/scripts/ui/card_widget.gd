extends Control
## Card Widget — renders a card as an actual card with frame, art, name, stats.
## Reusable: hand (mini), collection (full), pack opening (full), board (micro).

const RARITY_COLORS := {
	"common": Color(0.5, 0.5, 0.5),
	"uncommon": Color(0.3, 0.8, 0.3),
	"rare": Color(0.3, 0.5, 1.0),
	"legend": Color(1.0, 0.75, 0.1),
	"myth": Color(0.9, 0.3, 1.0),
}

const TYPE_COLORS := {
	"summon": Color(0.25, 0.35, 0.6),
	"action": Color(0.5, 0.3, 0.15),
	"quest": Color(0.2, 0.4, 0.2),
	"building": Color(0.35, 0.35, 0.15),
	"counter": Color(0.5, 0.15, 0.15),
	"reaction": Color(0.4, 0.15, 0.35),
	"advance": Color(0.35, 0.2, 0.5),
}

var card_data: Dictionary = {}
var is_mini := false
var is_hovered := false
var _hover_scale := 1.0

static var _species_sprites: Dictionary = {}
static var _card_art: Dictionary = {}
static var _sprites_loaded := false

signal card_clicked()


static func load_sprites() -> void:
	if _sprites_loaded:
		return
	_sprites_loaded = true
	for sp in ["gignen", "fae", "stoneheart", "wilderling", "angar", "demar", "creptilis"]:
		var path := "res://assets/sprites/%s.png" % sp
		if ResourceLoader.exists(path):
			_species_sprites[sp] = load(path)
		var art_path := "res://assets/card_art/%s.png" % sp
		if ResourceLoader.exists(art_path):
			_card_art[sp] = load(art_path)


func _ready() -> void:
	load_sprites()
	mouse_filter = Control.MOUSE_FILTER_STOP
	mouse_entered.connect(func(): is_hovered = true; queue_redraw())
	mouse_exited.connect(func(): is_hovered = false; queue_redraw())


func setup(data: Dictionary, mini_mode: bool = false) -> void:
	card_data = data
	is_mini = mini_mode
	if is_mini:
		custom_minimum_size = Vector2(88, 115)
	else:
		custom_minimum_size = Vector2(160, 220)
	queue_redraw()


func _draw() -> void:
	if card_data.is_empty():
		return

	var w: float = size.x
	var h: float = size.y
	var ct: String = card_data.get("card_type", "action")
	var rarity: String = card_data.get("rarity", "common")
	var species: String = card_data.get("species", "")
	var card_name: String = card_data.get("name", "?")
	var type_color: Color = TYPE_COLORS.get(ct, Color(0.25, 0.25, 0.35))
	var rarity_color: Color = RARITY_COLORS.get(rarity, Color(0.5, 0.5, 0.5))

	# Hover glow
	if is_hovered:
		var glow_rect := Rect2(-3, -3, w + 6, h + 6)
		draw_rect(glow_rect, rarity_color * Color(1, 1, 1, 0.3))

	# Card outer frame
	draw_rect(Rect2(0, 0, w, h), Color(0.15, 0.12, 0.1))

	# Inner card background
	var inner := Rect2(2, 2, w - 4, h - 4)
	draw_rect(inner, type_color.darkened(0.5))

	# Rarity border
	draw_rect(Rect2(0, 0, w, h), rarity_color, false, 2.5 if is_hovered else 1.5)

	# Top bar — card type color
	var bar_h: float = 3.0 if is_mini else 5.0
	draw_rect(Rect2(2, 2, w - 4, bar_h), type_color.lightened(0.2))

	# Art area
	var art_top: float = bar_h + 5
	var art_h: float = h * 0.48 if is_mini else h * 0.45
	var art_rect := Rect2(5, art_top, w - 10, art_h)
	draw_rect(art_rect, Color(0.04, 0.04, 0.06))
	# Art border
	draw_rect(art_rect, Color(0.2, 0.18, 0.15), false, 1.0)

	# Card art — species for summons, type icons for actions
	var art_tex: Texture2D = null
	if species != "" and is_mini and species in _species_sprites:
		art_tex = _species_sprites[species]
	elif species != "" and not is_mini and species in _card_art:
		art_tex = _card_art[species]
	elif species != "" and species in _species_sprites:
		art_tex = _species_sprites[species]
	else:
		# Try action type art
		var type_art_map := {
			"action": "res://assets/card_art/action_attack.png",
			"quest": "res://assets/card_art/quest_scroll.png",
			"building": "res://assets/card_art/building_tower.png",
			"counter": "res://assets/card_art/action_shield.png",
			"reaction": "res://assets/card_art/action_shield.png",
		}
		# Check for specific effect types
		var effects: Array = card_data.get("effects", [])
		for eff in effects:
			var etype: String = eff.get("type", "")
			if etype == "heal":
				type_art_map["action"] = "res://assets/card_art/action_heal.png"
				break
			elif etype == "buff":
				type_art_map["action"] = "res://assets/card_art/action_buff.png"
				break
		var art_path: String = type_art_map.get(ct, "")
		if art_path != "" and ResourceLoader.exists(art_path):
			art_tex = load(art_path)

	if art_tex != null:
		var tex_size := art_tex.get_size()
		var art_scale: float = minf(art_rect.size.x / tex_size.x, art_rect.size.y / tex_size.y)
		var draw_size := tex_size * art_scale
		var draw_pos := art_rect.position + (art_rect.size - draw_size) / 2.0
		draw_texture_rect(art_tex, Rect2(draw_pos, draw_size), false)

	# Name plate
	var name_top: float = art_top + art_h + 2
	var name_h: float = 18.0 if is_mini else 24.0
	draw_rect(Rect2(3, name_top, w - 6, name_h), Color(0.1, 0.08, 0.06, 0.9))

	var font := ThemeDB.fallback_font
	var name_size: int = 9 if is_mini else 12
	var truncated_name := card_name
	if is_mini and card_name.length() > 12:
		truncated_name = card_name.substr(0, 10) + ".."
	draw_string(font, Vector2(5, name_top + name_size + 2), truncated_name, HORIZONTAL_ALIGNMENT_CENTER, w - 10, name_size, Color(0.95, 0.9, 0.8))

	# Type label
	var type_top: float = name_top + name_h + 1
	var type_str: String = ct.to_upper()
	if ct == "action":
		type_str = card_data.get("speed", "action").to_upper()
	var type_size: int = 7 if is_mini else 9
	draw_string(font, Vector2(5, type_top + type_size), type_str, HORIZONTAL_ALIGNMENT_CENTER, w - 10, type_size, type_color.lightened(0.5))

	if not is_mini:
		# Description
		var desc: String = card_data.get("description", "")
		if desc.length() > 50:
			desc = desc.substr(0, 47) + "..."
		if desc != "":
			draw_string(font, Vector2(5, h - 24), desc, HORIZONTAL_ALIGNMENT_LEFT, w - 10, 8, Color(0.55, 0.5, 0.45))

		# Power
		var power: int = card_data.get("power", 0)
		if power > 0:
			draw_string(font, Vector2(5, h - 10), "PWR %d" % power, HORIZONTAL_ALIGNMENT_RIGHT, w - 10, 10, Color(0.8, 0.7, 0.5))

	# Rarity gem
	var gem_y: float = h - (5 if is_mini else 6)
	var gem_r: float = 3.0 if is_mini else 5.0
	draw_circle(Vector2(w / 2.0, gem_y), gem_r + 1, Color(0, 0, 0, 0.4))
	draw_circle(Vector2(w / 2.0, gem_y), gem_r, rarity_color)
	# Gem highlight
	draw_circle(Vector2(w / 2.0 - 1, gem_y - 1), gem_r * 0.4, rarity_color.lightened(0.5))

	# Bottom border accent
	draw_line(Vector2(4, h - 2), Vector2(w - 4, h - 2), rarity_color * Color(1, 1, 1, 0.4), 1.0)


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		card_clicked.emit()
