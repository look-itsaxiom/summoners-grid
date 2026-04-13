extends CanvasLayer
## Global scene transition — fade to black between scenes.
## Use: SceneTransition.change_scene("res://scenes/menu.tscn")

var _overlay: ColorRect
var _is_transitioning := false


func _ready() -> void:
	layer = 100  # Always on top
	_overlay = ColorRect.new()
	_overlay.color = Color(0, 0, 0, 0)
	_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_overlay)


## Fade out, change scene, fade in.
func change_scene(path: String, duration: float = 0.3) -> void:
	if _is_transitioning:
		return
	_is_transitioning = true
	_overlay.mouse_filter = Control.MOUSE_FILTER_STOP

	# Fade to black
	var tween := create_tween()
	tween.tween_property(_overlay, "color:a", 1.0, duration * 0.5)
	await tween.finished

	# Change scene
	get_tree().change_scene_to_file(path)

	# Wait a frame for scene to load
	await get_tree().process_frame

	# Fade from black
	var tween2 := create_tween()
	tween2.tween_property(_overlay, "color:a", 0.0, duration * 0.5)
	await tween2.finished

	_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_is_transitioning = false
