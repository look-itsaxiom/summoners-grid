extends Node
## Procedural sound effects — ported from src/engine/sound.ts
## Generates tones via AudioStreamGenerator. No external files needed.

var _players: Array[AudioStreamPlayer] = []
const MAX_PLAYERS := 8

var enabled: bool:
	get: return get_node_or_null("/root/Settings") == null or get_node("/root/Settings").sound_enabled


func _ready() -> void:
	for i in range(MAX_PLAYERS):
		var player := AudioStreamPlayer.new()
		player.bus = "Master"
		add_child(player)
		_players.append(player)


func _get_free_player() -> AudioStreamPlayer:
	for p in _players:
		if not p.playing:
			return p
	return _players[0]  # Reuse oldest if all busy


func _play_tone(frequency: float, duration: float, wave_type: String = "sine", volume: float = 0.15) -> void:
	if not enabled:
		return

	# Generate audio samples
	var sample_rate := 22050
	var num_samples := int(duration * sample_rate)
	var audio := AudioStreamWAV.new()
	audio.format = AudioStreamWAV.FORMAT_16_BITS
	audio.mix_rate = sample_rate
	audio.stereo = false

	var data := PackedByteArray()
	data.resize(num_samples * 2)  # 16-bit = 2 bytes per sample

	for i in range(num_samples):
		var t: float = float(i) / float(sample_rate)
		var progress: float = float(i) / float(num_samples)

		# Envelope: quick attack, exponential decay
		var envelope: float = volume * (1.0 - progress) * (1.0 - progress)

		# Waveform
		var sample: float = 0.0
		var phase: float = t * frequency * TAU

		match wave_type:
			"sine":
				sample = sin(phase)
			"triangle":
				sample = 2.0 * absf(2.0 * (t * frequency - floorf(t * frequency + 0.5))) - 1.0
			"sawtooth":
				sample = 2.0 * (t * frequency - floorf(t * frequency + 0.5))
			"square":
				sample = 1.0 if sin(phase) > 0 else -1.0

		var value: int = int(clampf(sample * envelope, -1.0, 1.0) * 32767)
		data[i * 2] = value & 0xFF
		data[i * 2 + 1] = (value >> 8) & 0xFF

	audio.data = data

	var player := _get_free_player()
	player.stream = audio
	player.play()


func _play_delayed(frequency: float, duration: float, wave_type: String, volume: float, delay: float) -> void:
	get_tree().create_timer(delay).timeout.connect(
		func(): _play_tone(frequency, duration, wave_type, volume)
	)


# ─── Sound Effects ───

func card_play() -> void:
	_play_tone(800, 0.1, "sine", 0.1)
	_play_delayed(1000, 0.08, "sine", 0.08, 0.05)


func summon_place() -> void:
	_play_tone(300, 0.15, "triangle", 0.12)
	_play_delayed(500, 0.2, "triangle", 0.1, 0.1)
	_play_delayed(700, 0.25, "triangle", 0.08, 0.2)


func attack_hit() -> void:
	_play_tone(200, 0.12, "sawtooth", 0.08)
	_play_tone(150, 0.15, "square", 0.05)


func attack_miss() -> void:
	_play_tone(400, 0.15, "sine", 0.06)
	_play_delayed(300, 0.2, "sine", 0.04, 0.08)


func critical_hit() -> void:
	_play_tone(400, 0.1, "sawtooth", 0.1)
	_play_delayed(600, 0.1, "sawtooth", 0.1, 0.06)
	_play_delayed(900, 0.15, "sawtooth", 0.08, 0.12)


func defeat() -> void:
	_play_tone(400, 0.2, "sawtooth", 0.1)
	_play_delayed(300, 0.25, "sawtooth", 0.08, 0.1)
	_play_delayed(200, 0.3, "sawtooth", 0.06, 0.2)
	_play_delayed(100, 0.4, "sawtooth", 0.04, 0.3)


func heal() -> void:
	_play_tone(500, 0.15, "sine", 0.08)
	_play_delayed(700, 0.15, "sine", 0.08, 0.1)
	_play_delayed(900, 0.2, "sine", 0.06, 0.2)


func level_up() -> void:
	_play_tone(400, 0.1, "triangle", 0.08)
	_play_delayed(500, 0.1, "triangle", 0.08, 0.08)
	_play_delayed(600, 0.1, "triangle", 0.08, 0.16)
	_play_delayed(800, 0.15, "triangle", 0.06, 0.24)


func vp_gain() -> void:
	_play_tone(600, 0.1, "sine", 0.1)
	_play_delayed(800, 0.1, "sine", 0.1, 0.1)
	_play_delayed(1000, 0.2, "sine", 0.08, 0.2)
	_play_delayed(1200, 0.25, "sine", 0.06, 0.3)


func victory() -> void:
	var notes := [523.0, 659.0, 784.0, 1047.0]  # C5 E5 G5 C6
	for i in range(notes.size()):
		_play_delayed(notes[i], 0.3, "triangle", 0.1, i * 0.2)


func game_defeat() -> void:
	var notes := [400.0, 350.0, 300.0, 200.0]
	for i in range(notes.size()):
		_play_delayed(notes[i], 0.4, "sawtooth", 0.06, i * 0.25)


func click() -> void:
	_play_tone(1000, 0.05, "sine", 0.05)
