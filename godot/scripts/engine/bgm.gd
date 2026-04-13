extends Node
## Procedural background music — ambient battle theme.
## Generates a looping low-frequency drone with harmonic shifts.
## No external audio files needed.

var _player: AudioStreamPlayer
var _is_playing := false
var _current_track := ""

var enabled: bool:
	get: return get_node_or_null("/root/Settings") == null or get_node("/root/Settings").sound_enabled


func _ready() -> void:
	_player = AudioStreamPlayer.new()
	_player.bus = "Master"
	_player.volume_db = -8.0
	add_child(_player)


## Play a looping ambient track. Track names: "battle", "menu", "victory", "defeat"
func play(track: String) -> void:
	if not enabled or track == _current_track:
		return
	_current_track = track

	var audio := _generate_track(track)
	if audio == null:
		return

	_player.stream = audio
	_player.play()
	_is_playing = true


func stop() -> void:
	_player.stop()
	_is_playing = false
	_current_track = ""


func _generate_track(track: String) -> AudioStreamWAV:
	var sample_rate := 22050
	var duration := 8.0  # 8 second loop
	var num_samples := int(duration * sample_rate)

	var audio := AudioStreamWAV.new()
	audio.format = AudioStreamWAV.FORMAT_16_BITS
	audio.mix_rate = sample_rate
	audio.stereo = false
	audio.loop_mode = AudioStreamWAV.LOOP_FORWARD
	audio.loop_begin = 0
	audio.loop_end = num_samples

	var data := PackedByteArray()
	data.resize(num_samples * 2)

	for i in range(num_samples):
		var t: float = float(i) / float(sample_rate)
		var progress: float = float(i) / float(num_samples)
		var sample: float = 0.0

		match track:
			"battle":
				sample = _battle_sample(t, progress)
			"menu":
				sample = _menu_sample(t, progress)
			"victory":
				sample = _victory_sample(t, progress)
			"defeat":
				sample = _defeat_sample(t, progress)

		var value: int = int(clampf(sample, -1.0, 1.0) * 32767)
		data[i * 2] = value & 0xFF
		data[i * 2 + 1] = (value >> 8) & 0xFF

	audio.data = data
	return audio


func _battle_sample(t: float, progress: float) -> float:
	var vol := 0.08
	# Low drone — C2 (65 Hz) with subtle octave
	var drone := sin(t * 65.0 * TAU) * 0.5 + sin(t * 130.0 * TAU) * 0.25
	# Slow harmonic swell — shifts between C and G
	var swell_freq := 65.0 + sin(progress * TAU) * 33.0  # 65-98 Hz
	var swell := sin(t * swell_freq * TAU) * 0.3
	# High shimmer — quiet, adds texture
	var shimmer := sin(t * 523.0 * TAU) * sin(progress * TAU * 2.0) * 0.08
	# Pulse rhythm — subtle low throb
	var pulse := sin(t * 2.0 * TAU) * 0.15  # 2 Hz throb
	return (drone + swell + shimmer) * vol * (0.8 + pulse * 0.2)


func _menu_sample(t: float, progress: float) -> float:
	var vol := 0.06
	# Gentle pad — C3 + E3 + G3 major chord
	var c := sin(t * 131.0 * TAU) * 0.3
	var e := sin(t * 165.0 * TAU) * 0.2
	var g := sin(t * 196.0 * TAU) * 0.2
	# Slow volume envelope
	var env := 0.7 + sin(progress * TAU) * 0.3
	return (c + e + g) * vol * env


func _victory_sample(t: float, progress: float) -> float:
	var vol := 0.07
	# Bright major chord — C4 + E4 + G4
	var c := sin(t * 262.0 * TAU) * 0.3
	var e := sin(t * 330.0 * TAU) * 0.25
	var g := sin(t * 392.0 * TAU) * 0.2
	# Rising shimmer
	var rise := sin(t * (392.0 + progress * 200.0) * TAU) * 0.1
	var env := 0.6 + sin(progress * TAU * 0.5) * 0.4
	return (c + e + g + rise) * vol * env


func _defeat_sample(t: float, progress: float) -> float:
	var vol := 0.06
	# Minor chord — C3 + Eb3 + G3
	var c := sin(t * 131.0 * TAU) * 0.3
	var eb := sin(t * 156.0 * TAU) * 0.25
	var g := sin(t * 196.0 * TAU) * 0.2
	# Slow descending tone
	var descend := sin(t * (200.0 - progress * 80.0) * TAU) * 0.1
	var env := 0.8 - progress * 0.3
	return (c + eb + g + descend) * vol * env
