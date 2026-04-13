extends Node
## Authentication — Supabase Auth via REST API.
## Handles signup, login, session management.
## Configure via SUPABASE_URL and SUPABASE_ANON_KEY.

# Configuration — set these to connect to your Supabase project
var supabase_url: String = "https://your-project.supabase.co"
var supabase_anon_key: String = "your-anon-key"

# Session state
var _access_token: String = ""
var _refresh_token: String = ""
var _user_id: String = ""
var _user_email: String = ""
var _is_logged_in := false

# Signals
signal auth_state_changed(logged_in: bool)
signal auth_error(message: String)

const SESSION_PATH := "user://auth_session.json"


func _ready() -> void:
	# Try to load saved session
	_load_session()
	# Try to load config from environment or config file
	_load_config()


func _load_config() -> void:
	# Check for config file
	var config_path := "user://supabase_config.json"
	if FileAccess.file_exists(config_path):
		var file := FileAccess.open(config_path, FileAccess.READ)
		var parsed = JSON.parse_string(file.get_as_text())
		file.close()
		if parsed is Dictionary:
			supabase_url = parsed.get("url", supabase_url)
			supabase_anon_key = parsed.get("anon_key", supabase_anon_key)


func is_logged_in() -> bool:
	return _is_logged_in


func get_user_email() -> String:
	return _user_email


func get_user_id() -> String:
	return _user_id


func get_access_token() -> String:
	return _access_token


## Sign up with email and password.
func sign_up(email: String, password: String) -> Dictionary:
	var url := "%s/auth/v1/signup" % supabase_url
	var body := JSON.stringify({"email": email, "password": password})
	var headers := [
		"Content-Type: application/json",
		"apikey: %s" % supabase_anon_key,
	]

	var result := await _post(url, body, headers)

	if result.has("access_token"):
		_set_session(result)
		return {"success": true, "user_id": _user_id}
	elif result.has("error"):
		var msg: String = result.get("error_description", result.get("msg", "Signup failed"))
		auth_error.emit(msg)
		return {"success": false, "error": msg}
	else:
		return {"success": false, "error": "Unknown signup error"}


## Sign in with email and password.
func sign_in(email: String, password: String) -> Dictionary:
	var url := "%s/auth/v1/token?grant_type=password" % supabase_url
	var body := JSON.stringify({"email": email, "password": password})
	var headers := [
		"Content-Type: application/json",
		"apikey: %s" % supabase_anon_key,
	]

	var result := await _post(url, body, headers)

	if result.has("access_token"):
		_set_session(result)
		return {"success": true, "user_id": _user_id}
	elif result.has("error"):
		var msg: String = result.get("error_description", result.get("msg", "Login failed"))
		auth_error.emit(msg)
		return {"success": false, "error": msg}
	else:
		return {"success": false, "error": "Unknown login error"}


## Sign out — clear session.
func sign_out() -> void:
	_access_token = ""
	_refresh_token = ""
	_user_id = ""
	_user_email = ""
	_is_logged_in = false
	_clear_session()
	auth_state_changed.emit(false)


## Refresh the access token using the refresh token.
func refresh_session() -> Dictionary:
	if _refresh_token == "":
		return {"success": false, "error": "No refresh token"}

	var url := "%s/auth/v1/token?grant_type=refresh_token" % supabase_url
	var body := JSON.stringify({"refresh_token": _refresh_token})
	var headers := [
		"Content-Type: application/json",
		"apikey: %s" % supabase_anon_key,
	]

	var result := await _post(url, body, headers)

	if result.has("access_token"):
		_set_session(result)
		return {"success": true}
	else:
		sign_out()
		return {"success": false, "error": "Session expired"}


func _set_session(data: Dictionary) -> void:
	_access_token = data.get("access_token", "")
	_refresh_token = data.get("refresh_token", "")

	var user: Dictionary = data.get("user", {})
	_user_id = user.get("id", "")
	_user_email = user.get("email", "")
	_is_logged_in = _access_token != ""

	_save_session()
	auth_state_changed.emit(_is_logged_in)


func _save_session() -> void:
	var data := {
		"access_token": _access_token,
		"refresh_token": _refresh_token,
		"user_id": _user_id,
		"user_email": _user_email,
	}
	var file := FileAccess.open(SESSION_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))
		file.close()


func _load_session() -> void:
	if not FileAccess.file_exists(SESSION_PATH):
		return
	var file := FileAccess.open(SESSION_PATH, FileAccess.READ)
	if file == null:
		return
	var parsed = JSON.parse_string(file.get_as_text())
	file.close()
	if parsed is Dictionary:
		_access_token = parsed.get("access_token", "")
		_refresh_token = parsed.get("refresh_token", "")
		_user_id = parsed.get("user_id", "")
		_user_email = parsed.get("user_email", "")
		_is_logged_in = _access_token != ""
		if _is_logged_in:
			auth_state_changed.emit(true)


func _clear_session() -> void:
	if FileAccess.file_exists(SESSION_PATH):
		DirAccess.remove_absolute(SESSION_PATH)


func _post(url: String, body: String, headers: Array) -> Dictionary:
	var http := HTTPRequest.new()
	add_child(http)

	var packed: PackedStringArray = PackedStringArray()
	for h in headers:
		packed.append(h)

	http.request(url, packed, HTTPClient.METHOD_POST, body)
	var response = await http.request_completed

	var response_code: int = response[1]
	var body_bytes: PackedByteArray = response[3]
	http.queue_free()

	var parsed = JSON.parse_string(body_bytes.get_string_from_utf8())
	if parsed == null:
		return {"error": "Invalid response", "status": response_code}
	return parsed
