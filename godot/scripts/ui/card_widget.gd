extends Control
## Card Widget — renders a card as an actual card with frame, art, name, stats.
## Reusable component for hand, board, collection, pack opening.

const RARITY_COLORS := {
	"common": Color(0.5, 0.5, 0.5),
	"uncommon": Color(0.3, 0.7, 0.3),
	"rare": Color(0.3, 0.5, 0.9),
	"legend": Color(0.9, 0.7, 0.1),
	"myth": Color(0.8, 0.3, 0.9),
}

const TYPE_COLORS := {
	"summon": Color(0.2, 0.3, 0.5),
	"action": Color(0.4, 0.25, 0.15),
	"quest": Color(0.2, 0.35, 0.2),
	"building": Color(0.3, 0.3, 0.15),
	"counter": Color(0.4, 0.15, 0.15),
	"reaction": Color(0.35, 0.15, 0.3),
	"advance": Color(0.3, 0.2, 0.4),
}

var card_data: Dictionary = {}
var show_mini := false  # Mini mode for hand display

# Cached textures
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


func setup(data: Dictionary, mini: bool = false) -> void:
	card_data = data
	show_mini = mini
	if mini:
		custom_minimum_size = Vector2(90, 120)
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

	var type_color: Color = TYPE_COLORS.get(ct, Color(0.2, 0.2, 0.3))
	var rarity_color: Color = RARITY_COLORS.get(rarity, Color(0.5, 0.5, 0.5))

	# Card background
	var bg_rect := Rect2(0, 0, w, h)
	draw_rect(bg_rect, Color(0.08, 0.07, 0.06))

	# Rarity border
	draw_rect(bg_rect, rarity_color, false, 2.0)

	# Top color bar (card type indicator)
	var bar_h: float = 4.0 if show_mini else 6.0
	draw_rect(Rect2(2, 2, w - 4, bar_h), type_color)

	# Art area
	var art_top: float = bar_h + 4
	var art_h: float = h * 0.45 if not show_mini else h * 0.4
	var art_rect := Rect2(4, art_top, w - 8, art_h)
	draw_rect(art_rect, Color(0.05, 0.05, 0.08))

	# Species art
	var art_tex: Texture2D = null
	if show_mini and species in _species_sprites:
		art_tex = _species_sprites[species]
	elif not show_mini and species in _card_art:
		art_tex = _card_art[species]
	elif species in _species_sprites:
		art_tex = _species_sprites[species]

	if art_tex != null:
		var tex_size := art_tex.get_size()
		var scale: float = minf(art_rect.size.x / tex_size.x, art_rect.size.y / tex_size.y)
		var draw_size := tex_size * scale
		var draw_pos := art_rect.position + (art_rect.size - draw_size) / 2.0
		draw_texture_rect(art_tex, Rect2(draw_pos, draw_size), false)

	# Name
	var name_y: float = art_top + art_h + 4
	var font := ThemeDB.fallback_font
	var name_size: int = 9 if show_mini else 13
	draw_string(font, Vector2(5, name_y + name_size), card_name, HORIZONTAL_ALIGNMENT_CENTER, w - 10, name_size, Color(0.95, 0.9, 0.8))

	# Type label
	var type_y: float = name_y + name_size + 4
	var type_str: String = ct.to_upper()
	if ct == "action":
		type_str = card_data.get("speed", "action").to_upper()
	var type_size: int = 7 if show_mini else 10
	draw_string(font, Vector2(5, type_y + type_size), type_str, HORIZONTAL_ALIGNMENT_CENTER, w - 10, type_size, type_color.lightened(0.4))

	# Stats/power (bottom area)
	if not show_mini:
		var power: int = card_data.get("power", 0)
		if power > 0:
			var power_str := "Power: %d" % power
			draw_string(font, Vector2(5, h - 8), power_str, HORIZONTAL_ALIGNMENT_CENTER, w - 10, 10, Color(0.7, 0.65, 0.5))

		# Description (truncated)
		var desc: String = card_data.get("description", "")
		if desc.length() > 60:
			desc = desc.substr(0, 57) + "..."
		if desc != "":
			draw_string(font, Vector2(5, h - 22), desc, HORIZONTAL_ALIGNMENT_LEFT, w - 10, 8, Color(0.5, 0.5, 0.55))

	# Rarity gem at bottom center
	var gem_y: float = h - 6 if show_mini else h - 4
	var gem_size: float = 4.0 if show_mini else 6.0
	draw_circle(Vector2(w / 2.0, gem_y), gem_size, rarity_color)


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		card_clicked.emit()
