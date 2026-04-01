extends Control
## 12x14 tactical game board with territory highlighting and unit display.

signal cell_clicked(position: Vector2i)
signal cell_hovered(position: Vector2i)

const CELL_SIZE := 48
const BOARD_W := 12
const BOARD_H := 14
const TERRITORY_DEPTH := 3

# Colors
const COLOR_PLAYER_A := Color(0.08, 0.15, 0.08)       # Dark green territory
const COLOR_PLAYER_B := Color(0.15, 0.08, 0.08)       # Dark red territory
const COLOR_UNCLAIMED := Color(0.08, 0.08, 0.12)      # Dark blue neutral
const COLOR_GRID_LINE := Color(0.2, 0.2, 0.3, 0.5)
const COLOR_VALID_MOVE := Color(0.0, 0.5, 1.0, 0.25)
const COLOR_VALID_ATTACK := Color(1.0, 0.2, 0.2, 0.25)
const COLOR_VALID_PLACE := Color(0.0, 1.0, 0.4, 0.2)
const COLOR_SELECTED := Color(1.0, 0.85, 0.0, 0.3)
const COLOR_HP_HIGH := Color(0.2, 0.8, 0.2)
const COLOR_HP_MED := Color(0.8, 0.7, 0.15)
const COLOR_HP_LOW := Color(0.8, 0.2, 0.2)
const COLOR_UNIT_A := Color(0.4, 0.7, 1.0)
const COLOR_UNIT_B := Color(1.0, 0.4, 0.4)

var valid_moves: Array[Vector2i] = []
var valid_attacks: Array[String] = []  # instance_ids
var valid_placements: Array[Vector2i] = []
var selected_cell: Vector2i = Vector2i(-1, -1)
var hovered_cell: Vector2i = Vector2i(-1, -1)

@onready var _gm = get_node("/root/GameManager")


func _ready() -> void:
	custom_minimum_size = Vector2(BOARD_W * CELL_SIZE + 40, BOARD_H * CELL_SIZE + 40)
	mouse_filter = Control.MOUSE_FILTER_STOP


func _draw() -> void:
	var offset := Vector2(28, 12)  # Margin for row/col labels

	# Draw territory backgrounds
	for y in range(BOARD_H):
		for x in range(BOARD_W):
			var rect := Rect2(offset + Vector2(x * CELL_SIZE, (BOARD_H - 1 - y) * CELL_SIZE), Vector2(CELL_SIZE, CELL_SIZE))
			var color := _get_territory_color(y)

			# Highlight overlays
			var pos := Vector2i(x, y)
			if pos == selected_cell:
				color = color.lerp(Color.GOLD, 0.25)
			elif pos in valid_moves:
				color = color.lerp(COLOR_VALID_MOVE, 0.4)
			elif pos in valid_placements:
				color = Color(0.2, 0.7, 0.3, 1.0)  # Bright distinct green
			elif pos == hovered_cell:
				color = color.lerp(Color.WHITE, 0.05)

			draw_rect(rect, color)

			# Grid lines
			draw_rect(rect, COLOR_GRID_LINE, false, 1.0)

	# Draw column labels
	for x in range(BOARD_W):
		var label_pos := offset + Vector2(x * CELL_SIZE + CELL_SIZE * 0.35, -2)
		draw_string(ThemeDB.fallback_font, label_pos, str(x), HORIZONTAL_ALIGNMENT_CENTER, -1, 10, Color(0.35, 0.35, 0.45))

	# Draw row labels
	for y in range(BOARD_H):
		var screen_y: int = BOARD_H - 1 - y
		var label_pos := offset + Vector2(-20, screen_y * CELL_SIZE + CELL_SIZE * 0.6)
		draw_string(ThemeDB.fallback_font, label_pos, str(y), HORIZONTAL_ALIGNMENT_CENTER, -1, 10, Color(0.35, 0.35, 0.45))

	# Draw summon units
	for s in _gm.board_summons:
		var pos: Vector2i = s["position"]
		var screen_pos := offset + Vector2(pos.x * CELL_SIZE, (BOARD_H - 1 - pos.y) * CELL_SIZE)
		_draw_unit(screen_pos, s)

	# Draw attack target indicators
	for s in _gm.board_summons:
		if s["instance_id"] in valid_attacks:
			var pos: Vector2i = s["position"]
			var rect := Rect2(offset + Vector2(pos.x * CELL_SIZE, (BOARD_H - 1 - pos.y) * CELL_SIZE), Vector2(CELL_SIZE, CELL_SIZE))
			draw_rect(rect, COLOR_VALID_ATTACK)
			draw_rect(rect, Color(1, 0.2, 0.2, 0.6), false, 2.0)


func _draw_unit(screen_pos: Vector2, unit: Dictionary) -> void:
	var card: Dictionary = unit.get("card", {})
	var name_str: String = card.get("name", "?")
	if name_str.length() > 10:
		name_str = name_str.substr(0, 10)

	var unit_owner: String = unit["owner"]
	var team_color := COLOR_UNIT_A if unit_owner == "playerA" else COLOR_UNIT_B

	# Unit background glow
	var bg_rect := Rect2(screen_pos + Vector2(1, 1), Vector2(CELL_SIZE - 2, CELL_SIZE - 2))
	draw_rect(bg_rect, team_color * Color(1, 1, 1, 0.15))

	# Name — centered in cell
	var name_pos := screen_pos + Vector2(2, 12)
	draw_string(ThemeDB.fallback_font, name_pos, name_str, HORIZONTAL_ALIGNMENT_CENTER, CELL_SIZE - 4, 8, team_color)

	# HP text — centered
	var hp_str := "%d/%d" % [unit["current_hp"], unit["max_hp"]]
	var hp_pos := screen_pos + Vector2(2, 23)
	draw_string(ThemeDB.fallback_font, hp_pos, hp_str, HORIZONTAL_ALIGNMENT_CENTER, CELL_SIZE - 4, 9, Color(0.5, 1.0, 0.5))

	# Level + role — centered
	var level_str := "Lv%d %s" % [unit["level"], unit["current_role"].substr(0, 7)]
	var level_pos := screen_pos + Vector2(2, 33)
	draw_string(ThemeDB.fallback_font, level_pos, level_str, HORIZONTAL_ALIGNMENT_CENTER, CELL_SIZE - 4, 7, Color(0.6, 0.6, 0.8))

	# HP bar
	var bar_y := screen_pos.y + CELL_SIZE - 7
	var bar_rect := Rect2(screen_pos.x + 2, bar_y, CELL_SIZE - 4, 4)
	draw_rect(bar_rect, Color(0.1, 0.1, 0.15))

	var hp_pct: float = float(unit["current_hp"]) / float(unit["max_hp"])
	var hp_color := COLOR_HP_HIGH
	if hp_pct <= 0.25:
		hp_color = COLOR_HP_LOW
	elif hp_pct <= 0.5:
		hp_color = COLOR_HP_MED
	var fill_rect := Rect2(screen_pos.x + 2, bar_y, (CELL_SIZE - 4) * hp_pct, 4)
	draw_rect(fill_rect, hp_color)

	# Team indicator line
	var line_y := screen_pos.y + CELL_SIZE - 2
	draw_line(
		Vector2(screen_pos.x + 6, line_y),
		Vector2(screen_pos.x + CELL_SIZE - 6, line_y),
		team_color, 2.0
	)


func _get_territory_color(y: int) -> Color:
	if y < TERRITORY_DEPTH:
		return COLOR_PLAYER_A
	elif y >= BOARD_H - TERRITORY_DEPTH:
		return COLOR_PLAYER_B
	return COLOR_UNCLAIMED


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		var pos := _screen_to_grid(event.position)
		if pos != hovered_cell:
			hovered_cell = pos
			cell_hovered.emit(pos)
			queue_redraw()

	if event is InputEventMouseButton:
		if event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			var pos := _screen_to_grid(event.position)
			if pos.x >= 0 and pos.x < BOARD_W and pos.y >= 0 and pos.y < BOARD_H:
				selected_cell = pos
				cell_clicked.emit(pos)
				queue_redraw()


func _screen_to_grid(screen_pos: Vector2) -> Vector2i:
	var offset := Vector2(28, 12)
	var local := screen_pos - offset
	var gx := int(local.x / CELL_SIZE)
	var gy := BOARD_H - 1 - int(local.y / CELL_SIZE)
	if gx < 0 or gx >= BOARD_W or gy < 0 or gy >= BOARD_H:
		return Vector2i(-1, -1)
	return Vector2i(gx, gy)


## Clear all highlights.
func clear_highlights() -> void:
	valid_moves.clear()
	valid_attacks.clear()
	valid_placements.clear()
	selected_cell = Vector2i(-1, -1)
	queue_redraw()


## Show valid placements for summon.
func show_placements(positions: Array[Vector2i]) -> void:
	valid_placements = positions
	queue_redraw()


## Show valid moves for a unit.
func show_moves(positions: Array[Vector2i]) -> void:
	valid_moves = positions
	queue_redraw()


## Show valid attack targets.
func show_attacks(instance_ids: Array[String]) -> void:
	valid_attacks = instance_ids
	queue_redraw()
