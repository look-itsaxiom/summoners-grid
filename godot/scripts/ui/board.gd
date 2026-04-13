extends Control
## 12x14 tactical game board with territory highlighting and unit display.

signal cell_clicked(position: Vector2i)
signal cell_hovered(position: Vector2i)
signal cell_right_clicked(position: Vector2i)

const CELL_SIZE := 48
const BOARD_W := 12
const BOARD_H := 14
const TERRITORY_DEPTH := 3

# Colors
const COLOR_PLAYER_A := Color(0.06, 0.12, 0.06)       # Dark green territory
const COLOR_PLAYER_A_ALT := Color(0.07, 0.14, 0.07)   # Checkerboard alt
const COLOR_PLAYER_B := Color(0.12, 0.06, 0.06)       # Dark red territory
const COLOR_PLAYER_B_ALT := Color(0.14, 0.07, 0.07)   # Checkerboard alt
const COLOR_UNCLAIMED := Color(0.07, 0.07, 0.11)      # Dark blue neutral
const COLOR_UNCLAIMED_ALT := Color(0.08, 0.08, 0.13)  # Checkerboard alt
const COLOR_GRID_LINE := Color(0.18, 0.18, 0.28, 0.4)
const COLOR_TERRITORY_BORDER := Color(0.4, 0.4, 0.6, 0.6)
const COLOR_VALID_MOVE := Color(0.0, 0.5, 1.0, 0.25)
const COLOR_VALID_ATTACK := Color(1.0, 0.2, 0.2, 0.25)
const COLOR_VALID_PLACE := Color(0.0, 1.0, 0.4, 0.2)
const COLOR_SELECTED := Color(1.0, 0.85, 0.0, 0.3)
const COLOR_WEAPON_RANGE := Color(1.0, 0.5, 0.0, 0.12)
const COLOR_HP_HIGH := Color(0.2, 0.8, 0.2)
const COLOR_HP_MED := Color(0.8, 0.7, 0.15)
const COLOR_HP_LOW := Color(0.8, 0.2, 0.2)
var COLOR_UNIT_A := Color(0.4, 0.7, 1.0)
var COLOR_UNIT_B := Color(1.0, 0.4, 0.4)

var valid_moves: Array[Vector2i] = []
var valid_attacks: Array[String] = []  # instance_ids
var valid_placements: Array[Vector2i] = []
var weapon_range_cells: Array[Vector2i] = []  # hover range overlay
var selected_cell: Vector2i = Vector2i(-1, -1)
var hovered_cell: Vector2i = Vector2i(-1, -1)

# Cell flash animations: { Vector2i: { color: Color, alpha: float } }
var _cell_flashes: Dictionary = {}

# Per-unit animation state: { instance_id: { offset: Vector2, scale: float, flash: float } }
var _unit_anims: Dictionary = {}
var _animating := false

# Level-up ring effects: Array of { pos: Vector2i, radius: float, alpha: float }
var _level_rings: Array = []

# Zoom + pan state
var _zoom := 1.0
var _pan := Vector2.ZERO
var _is_panning := false
var _pan_start := Vector2.ZERO

# Species sprite textures (loaded once)
var _species_sprites: Dictionary = {}

@onready var _gm = get_node("/root/GameManager")


func _ready() -> void:
	custom_minimum_size = Vector2(BOARD_W * CELL_SIZE + 40, BOARD_H * CELL_SIZE + 40)
	mouse_filter = Control.MOUSE_FILTER_STOP
	set_process(true)
	_load_sprites()
	_apply_color_mode()


func _apply_color_mode() -> void:
	var settings = get_node_or_null("/root/Settings")
	if settings != null and settings.color_blind_mode:
		# Blue vs Orange — distinguishable by deuteranopia/protanopia
		COLOR_UNIT_A = Color(0.3, 0.5, 1.0)    # Blue
		COLOR_UNIT_B = Color(1.0, 0.6, 0.1)    # Orange


func _load_sprites() -> void:
	var species := ["gignen", "fae", "stoneheart", "wilderling", "angar", "demar", "creptilis"]
	for sp in species:
		var path := "res://assets/sprites/%s.png" % sp
		if ResourceLoader.exists(path):
			_species_sprites[sp] = load(path)


func _process(delta: float) -> void:
	var needs_redraw := false

	# Cell flash decay
	if not _cell_flashes.is_empty():
		var to_remove: Array[Vector2i] = []
		for pos in _cell_flashes:
			_cell_flashes[pos]["alpha"] -= delta * 2.5
			if _cell_flashes[pos]["alpha"] <= 0:
				to_remove.append(pos)
		for pos in to_remove:
			_cell_flashes.erase(pos)
		needs_redraw = true

	# Unit hit flash decay
	for uid in _unit_anims:
		var anim: Dictionary = _unit_anims[uid]
		if anim.get("flash", 0.0) > 0:
			anim["flash"] = maxf(0.0, anim["flash"] - delta * 4.0)
			needs_redraw = true

	# Level-up ring expansion
	if not _level_rings.is_empty():
		var done_rings: Array = []
		for ring in _level_rings:
			ring["radius"] += delta * 80.0
			ring["alpha"] -= delta * 2.0
			if ring["alpha"] <= 0:
				done_rings.append(ring)
		for ring in done_rings:
			_level_rings.erase(ring)
		needs_redraw = true

	if _animating:
		needs_redraw = true

	if needs_redraw:
		queue_redraw()


func _draw() -> void:
	# Apply zoom + pan transform to all draw calls
	draw_set_transform(_pan, 0, Vector2(_zoom, _zoom))
	var offset := Vector2(28, 12)  # Margin for row/col labels

	# Draw territory backgrounds
	for y in range(BOARD_H):
		for x in range(BOARD_W):
			var rect := Rect2(offset + Vector2(x * CELL_SIZE, (BOARD_H - 1 - y) * CELL_SIZE), Vector2(CELL_SIZE, CELL_SIZE))
			var color := _get_territory_color(x, y)

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

			color.a = 0.7  # Semi-transparent so board bg shows through
			draw_rect(rect, color)

			# Subtle inner bevel — lighter top-left edge, darker bottom-right
			var bevel_light := Color(1, 1, 1, 0.04)
			var bevel_dark := Color(0, 0, 0, 0.08)
			draw_line(rect.position, rect.position + Vector2(CELL_SIZE, 0), bevel_light, 1.0)
			draw_line(rect.position, rect.position + Vector2(0, CELL_SIZE), bevel_light, 1.0)
			draw_line(rect.position + Vector2(CELL_SIZE, CELL_SIZE), rect.position + Vector2(0, CELL_SIZE), bevel_dark, 1.0)
			draw_line(rect.position + Vector2(CELL_SIZE, CELL_SIZE), rect.position + Vector2(CELL_SIZE, 0), bevel_dark, 1.0)

			# Weapon range overlay (subtle orange tint)
			if pos in weapon_range_cells:
				draw_rect(rect, COLOR_WEAPON_RANGE)

			# Grid lines
			draw_rect(rect, COLOR_GRID_LINE, false, 1.0)

	# Territory border lines with glow
	var border_width := BOARD_W * CELL_SIZE
	# Player A territory top border (y=3 line)
	var a_border_y := offset.y + (BOARD_H - TERRITORY_DEPTH) * CELL_SIZE
	draw_line(Vector2(offset.x, a_border_y), Vector2(offset.x + border_width, a_border_y), Color(0.3, 0.3, 0.5, 0.2), 4.0)
	draw_line(Vector2(offset.x, a_border_y), Vector2(offset.x + border_width, a_border_y), COLOR_TERRITORY_BORDER, 1.5)
	# Player B territory bottom border (y=11 line)
	var b_border_y := offset.y + TERRITORY_DEPTH * CELL_SIZE
	draw_line(Vector2(offset.x, b_border_y), Vector2(offset.x + border_width, b_border_y), Color(0.3, 0.3, 0.5, 0.2), 4.0)
	draw_line(Vector2(offset.x, b_border_y), Vector2(offset.x + border_width, b_border_y), COLOR_TERRITORY_BORDER, 1.5)

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
		var uid: String = s["instance_id"]
		# Apply animation offset
		if uid in _unit_anims:
			screen_pos += _unit_anims[uid].get("offset", Vector2.ZERO)
		_draw_unit(screen_pos, s)

	# Draw attack target indicators
	for s in _gm.board_summons:
		if s["instance_id"] in valid_attacks:
			var pos: Vector2i = s["position"]
			var rect := Rect2(offset + Vector2(pos.x * CELL_SIZE, (BOARD_H - 1 - pos.y) * CELL_SIZE), Vector2(CELL_SIZE, CELL_SIZE))
			draw_rect(rect, COLOR_VALID_ATTACK)
			draw_rect(rect, Color(1, 0.2, 0.2, 0.6), false, 2.0)

	# Draw level-up ring effects
	for ring in _level_rings:
		var rpos: Vector2i = ring["pos"]
		var center := offset + Vector2(rpos.x * CELL_SIZE + CELL_SIZE * 0.5, (BOARD_H - 1 - rpos.y) * CELL_SIZE + CELL_SIZE * 0.5)
		var ring_color := Color(1.0, 0.85, 0.0, ring["alpha"] * 0.8)
		draw_arc(center, ring["radius"], 0, TAU, 32, ring_color, 2.0)

	# Draw cell flash animations
	for pos in _cell_flashes:
		var flash: Dictionary = _cell_flashes[pos]
		var alpha: float = flash["alpha"]
		if alpha > 0:
			var flash_color: Color = flash["color"]
			flash_color.a = alpha * 0.6
			var rect := Rect2(offset + Vector2(pos.x * CELL_SIZE, (BOARD_H - 1 - pos.y) * CELL_SIZE), Vector2(CELL_SIZE, CELL_SIZE))
			draw_rect(rect, flash_color)


func _draw_unit(screen_pos: Vector2, unit: Dictionary) -> void:
	var card: Dictionary = unit.get("card", {})
	var species: String = card.get("species", "")
	var unit_owner: String = unit["owner"]
	var team_color := COLOR_UNIT_A if unit_owner == "playerA" else COLOR_UNIT_B
	var uid: String = unit["instance_id"]

	# Animation: scale (for summon appear)
	var unit_scale: float = 1.0
	if uid in _unit_anims:
		unit_scale = _unit_anims[uid].get("scale", 1.0)
	if unit_scale <= 0.01:
		return  # Not visible yet

	# Apply scale transform around cell center
	var center := screen_pos + Vector2(CELL_SIZE * 0.5, CELL_SIZE * 0.5)
	var scaled_pos := center - Vector2(CELL_SIZE * 0.5, CELL_SIZE * 0.5) * unit_scale

	# Drop shadow
	var shadow_rect := Rect2(scaled_pos + Vector2(3, 3) * unit_scale, (Vector2(CELL_SIZE - 4, CELL_SIZE - 4)) * unit_scale)
	draw_rect(shadow_rect, Color(0, 0, 0, 0.3))

	# Unit background — solid dark card with team-colored border
	var bg_rect := Rect2(scaled_pos + Vector2(2, 2) * unit_scale, (Vector2(CELL_SIZE - 4, CELL_SIZE - 4)) * unit_scale)

	# Hit flash: lerp toward white
	var flash_amt: float = 0.0
	if uid in _unit_anims:
		flash_amt = _unit_anims[uid].get("flash", 0.0)

	var bg_color := Color(0.05, 0.05, 0.1, 0.9)
	if flash_amt > 0:
		bg_color = bg_color.lerp(Color(1, 0.9, 0.8, 0.95), flash_amt)

	draw_rect(bg_rect, bg_color)
	draw_rect(bg_rect, team_color * Color(1, 1, 1, 0.6), false, 2.0)

	# Team color top bar
	var team_bar := Rect2(bg_rect.position + Vector2(1, 1), Vector2(bg_rect.size.x - 2, 3))
	draw_rect(team_bar, team_color)

	# Species sprite (if available)
	if species in _species_sprites and _species_sprites[species] != null:
		var tex: Texture2D = _species_sprites[species]
		var sprite_size := 28.0  # Fit nicely in 48px cell
		var sprite_pos := screen_pos + Vector2((CELL_SIZE - sprite_size) / 2.0, 2)
		draw_texture_rect(tex, Rect2(sprite_pos, Vector2(sprite_size, sprite_size)), false, Color(1, 1, 1, 0.85))
	else:
		# Fallback: text name
		var name_str: String = card.get("name", "?")
		if name_str.length() > 10:
			name_str = name_str.substr(0, 10)
		var name_pos := screen_pos + Vector2(2, 12)
		draw_string(ThemeDB.fallback_font, name_pos, name_str, HORIZONTAL_ALIGNMENT_CENTER, CELL_SIZE - 4, 8, team_color)

	# HP text — below sprite
	var hp_str := "%d/%d" % [unit["current_hp"], unit["max_hp"]]
	var hp_pos := screen_pos + Vector2(2, 34)
	draw_string(ThemeDB.fallback_font, hp_pos, hp_str, HORIZONTAL_ALIGNMENT_CENTER, CELL_SIZE - 4, 8, Color(0.5, 1.0, 0.5))

	# Level — small text at bottom
	var level_str := "Lv%d" % unit["level"]
	var level_pos := screen_pos + Vector2(2, 43)
	draw_string(ThemeDB.fallback_font, level_pos, level_str, HORIZONTAL_ALIGNMENT_CENTER, CELL_SIZE - 4, 7, Color(0.6, 0.6, 0.8))

	# HP bar with glow
	var bar_y := screen_pos.y + CELL_SIZE - 7
	var bar_w: float = CELL_SIZE - 4
	var bar_rect := Rect2(screen_pos.x + 2, bar_y, bar_w, 4)
	draw_rect(bar_rect, Color(0.1, 0.1, 0.15))

	var hp_pct: float = float(unit["current_hp"]) / float(unit["max_hp"])
	var hp_color := COLOR_HP_HIGH
	if hp_pct <= 0.25:
		hp_color = COLOR_HP_LOW
	elif hp_pct <= 0.5:
		hp_color = COLOR_HP_MED
	var fill_w: float = bar_w * hp_pct
	var fill_rect := Rect2(screen_pos.x + 2, bar_y, fill_w, 4)
	draw_rect(fill_rect, hp_color)
	# Subtle bright highlight on top half of bar
	var highlight_rect := Rect2(screen_pos.x + 2, bar_y, fill_w, 2)
	draw_rect(highlight_rect, hp_color.lightened(0.3) * Color(1, 1, 1, 0.4))

	# Team indicator line
	var line_y := screen_pos.y + CELL_SIZE - 2
	draw_line(
		Vector2(screen_pos.x + 6, line_y),
		Vector2(screen_pos.x + CELL_SIZE - 6, line_y),
		team_color, 2.0
	)


func _get_territory_color(x: int, y: int) -> Color:
	var is_alt: bool = (x + y) % 2 == 0
	var settings = get_node_or_null("/root/Settings")
	var cb: bool = settings != null and settings.color_blind_mode
	if y < TERRITORY_DEPTH:
		if cb:
			return Color(0.06, 0.08, 0.16) if is_alt else Color(0.05, 0.07, 0.14)  # Blue tint
		return COLOR_PLAYER_A_ALT if is_alt else COLOR_PLAYER_A
	elif y >= BOARD_H - TERRITORY_DEPTH:
		if cb:
			return Color(0.16, 0.10, 0.04) if is_alt else Color(0.14, 0.08, 0.03)  # Orange tint
		return COLOR_PLAYER_B_ALT if is_alt else COLOR_PLAYER_B
	return COLOR_UNCLAIMED_ALT if is_alt else COLOR_UNCLAIMED


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		if _is_panning:
			_pan += event.relative
			queue_redraw()
		else:
			var pos := _screen_to_grid(event.position)
			if pos != hovered_cell:
				hovered_cell = pos
				cell_hovered.emit(pos)
				queue_redraw()

	if event is InputEventMouseButton:
		# Zoom with mouse wheel
		if event.pressed and event.button_index == MOUSE_BUTTON_WHEEL_UP:
			var old_zoom := _zoom
			_zoom = minf(_zoom * 1.15, 2.5)
			# Zoom toward cursor
			_pan = event.position - (event.position - _pan) * (_zoom / old_zoom)
			queue_redraw()
		elif event.pressed and event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			var old_zoom := _zoom
			_zoom = maxf(_zoom / 1.15, 0.5)
			_pan = event.position - (event.position - _pan) * (_zoom / old_zoom)
			queue_redraw()

		# Pan with middle mouse button
		elif event.button_index == MOUSE_BUTTON_MIDDLE:
			_is_panning = event.pressed
			_pan_start = event.position

		elif event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			var pos := _screen_to_grid(event.position)
			if pos.x >= 0 and pos.x < BOARD_W and pos.y >= 0 and pos.y < BOARD_H:
				selected_cell = pos
				cell_clicked.emit(pos)
				queue_redraw()
		elif event.pressed and event.button_index == MOUSE_BUTTON_RIGHT:
			var pos := _screen_to_grid(event.position)
			if pos.x >= 0 and pos.x < BOARD_W and pos.y >= 0 and pos.y < BOARD_H:
				cell_right_clicked.emit(pos)


func _screen_to_grid(screen_pos: Vector2) -> Vector2i:
	var offset := Vector2(28, 12)
	# Undo zoom + pan to get board-local coords
	var local := (screen_pos - _pan) / _zoom - offset
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
	weapon_range_cells.clear()
	selected_cell = Vector2i(-1, -1)
	queue_redraw()


## Show weapon range overlay for a unit at given position with given range.
func show_weapon_range(unit_pos: Vector2i, weapon_range: int) -> void:
	weapon_range_cells.clear()
	for dy in range(-weapon_range, weapon_range + 1):
		for dx in range(-weapon_range, weapon_range + 1):
			if dx == 0 and dy == 0:
				continue
			var dist := maxi(absi(dx), absi(dy))  # Chebyshev
			if dist <= weapon_range:
				var cx: int = unit_pos.x + dx
				var cy: int = unit_pos.y + dy
				if cx >= 0 and cx < BOARD_W and cy >= 0 and cy < BOARD_H:
					weapon_range_cells.append(Vector2i(cx, cy))
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


## Reset zoom and pan to default.
func reset_view() -> void:
	_zoom = 1.0
	_pan = Vector2.ZERO
	queue_redraw()


## Flash a cell with a color (fades out over ~0.4s).
func flash_cell(pos: Vector2i, color: Color) -> void:
	_cell_flashes[pos] = { "color": color, "alpha": 1.0 }
	queue_redraw()


## Animate a summon appearing on the board (scale from 0 → 1 with overshoot).
func animate_summon_appear(instance_id: String) -> void:
	_ensure_anim(instance_id)
	_unit_anims[instance_id]["scale"] = 0.0
	_animating = true
	var tw := create_tween()
	tw.tween_method(func(v: float):
		if instance_id in _unit_anims:
			_unit_anims[instance_id]["scale"] = v
			queue_redraw()
	, 0.0, 1.0, 0.25).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
	tw.tween_callback(func(): _animating = false)


## Animate a unit sliding from old_pos to new_pos on the grid.
func animate_move(instance_id: String, from_pos: Vector2i, to_pos: Vector2i) -> void:
	_ensure_anim(instance_id)
	# Calculate pixel offset: unit is already at to_pos in data, so offset starts at (from - to) and goes to zero
	var diff := Vector2((from_pos.x - to_pos.x) * CELL_SIZE, (to_pos.y - from_pos.y) * CELL_SIZE)
	_unit_anims[instance_id]["offset"] = diff
	_animating = true
	var tw := create_tween()
	tw.tween_method(func(v: Vector2):
		if instance_id in _unit_anims:
			_unit_anims[instance_id]["offset"] = v
			queue_redraw()
	, diff, Vector2.ZERO, 0.2).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_QUAD)
	tw.tween_callback(func(): _animating = false)


## Animate an attack lunge: attacker moves partway toward target, then snaps back.
func animate_attack(attacker_id: String, attacker_pos: Vector2i, target_pos: Vector2i) -> void:
	_ensure_anim(attacker_id)
	# Lunge direction in screen coords
	var dx: float = (target_pos.x - attacker_pos.x) * CELL_SIZE * 0.35
	var dy: float = (attacker_pos.y - target_pos.y) * CELL_SIZE * 0.35  # Y flipped on screen
	var lunge := Vector2(dx, dy)
	_animating = true
	var tw := create_tween()
	# Lunge forward
	tw.tween_method(func(v: Vector2):
		if attacker_id in _unit_anims:
			_unit_anims[attacker_id]["offset"] = v
			queue_redraw()
	, Vector2.ZERO, lunge, 0.1).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_QUAD)
	# Snap back
	tw.tween_method(func(v: Vector2):
		if attacker_id in _unit_anims:
			_unit_anims[attacker_id]["offset"] = v
			queue_redraw()
	, lunge, Vector2.ZERO, 0.15).set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_QUAD)
	tw.tween_callback(func(): _animating = false)


## Flash a unit white (hit feedback).
func animate_hit_flash(instance_id: String) -> void:
	_ensure_anim(instance_id)
	_unit_anims[instance_id]["flash"] = 1.0
	queue_redraw()


## Show an expanding golden ring at a grid position (level-up VFX).
func animate_level_up(grid_pos: Vector2i) -> void:
	_level_rings.append({ "pos": grid_pos, "radius": 4.0, "alpha": 1.0 })
	# Second ring with slight delay effect (starts smaller)
	_level_rings.append({ "pos": grid_pos, "radius": 0.0, "alpha": 0.8 })
	queue_redraw()


func _ensure_anim(instance_id: String) -> void:
	if instance_id not in _unit_anims:
		_unit_anims[instance_id] = { "offset": Vector2.ZERO, "scale": 1.0, "flash": 0.0 }
