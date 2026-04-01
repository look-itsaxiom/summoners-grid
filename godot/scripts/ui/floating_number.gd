extends Label
## Floating damage/heal number that rises and fades.

var velocity := Vector2(0, -60)
var lifetime := 1.2
var elapsed := 0.0


static func spawn(parent: Control, text: String, pos: Vector2, color: Color, is_crit: bool = false) -> void:
	var label := Label.new()
	label.set_script(load("res://scripts/ui/floating_number.gd"))
	label.text = text
	label.position = pos - Vector2(20, 10)
	label.add_theme_color_override("font_color", color)
	label.add_theme_font_size_override("font_size", 16 if is_crit else 13)
	label.z_index = 100

	if is_crit:
		label.text = text + "!"
		label.add_theme_font_size_override("font_size", 20)

	parent.add_child(label)


func _process(delta: float) -> void:
	elapsed += delta
	var t: float = elapsed / lifetime

	position += velocity * delta
	velocity.y *= 0.95  # Slow down

	# Fade out in last 40%
	if t > 0.6:
		modulate.a = 1.0 - ((t - 0.6) / 0.4)

	if t >= 1.0:
		queue_free()
