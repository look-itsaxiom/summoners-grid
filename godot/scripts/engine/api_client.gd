extends Node
## HTTP client for communicating with the backend API.
## All user-facing features (packs, collection, decks) go through this.

var base_url: String = "http://localhost:3000"
var _wallet_address: String = ""
var _auth_token: String = ""
var _http: HTTPRequest


func _ready() -> void:
	_http = HTTPRequest.new()
	add_child(_http)


## Set the API server URL.
func set_server(url: String) -> void:
	base_url = url


## Set auth credentials after login.
func set_auth(wallet: String, token: String = "") -> void:
	_wallet_address = wallet
	_auth_token = token


func is_authenticated() -> bool:
	return _wallet_address != ""


func get_wallet() -> String:
	return _wallet_address


## Open a card pack. Returns parsed JSON response.
func open_pack(pack_type: String = "standard") -> Dictionary:
	var url := base_url + "/api/packs/open"
	var body := JSON.stringify({
		"packType": pack_type,
		"walletAddress": _wallet_address,
	})
	var headers := ["Content-Type: application/json"]
	if _auth_token != "":
		headers.append("Authorization: Bearer %s" % _auth_token)

	var result := await _post(url, body, headers)
	return result


## Get the user's card collection.
func get_collection() -> Dictionary:
	var url := "%s/api/collection?walletAddress=%s" % [base_url, _wallet_address]
	var headers: Array[String] = []
	if _auth_token != "":
		headers.append("Authorization: Bearer %s" % _auth_token)

	var result := await _get(url, headers)
	return result


## Check API health.
func health_check() -> Dictionary:
	return await _get(base_url + "/api/health", [])


## Internal GET request.
func _get(url: String, headers: Array) -> Dictionary:
	var http := HTTPRequest.new()
	add_child(http)

	var packed_headers: PackedStringArray = PackedStringArray()
	for h in headers:
		packed_headers.append(h)

	http.request(url, packed_headers, HTTPClient.METHOD_GET)
	var response = await http.request_completed

	var _result: int = response[0]
	var response_code: int = response[1]
	var _resp_headers = response[2]
	var body_bytes: PackedByteArray = response[3]

	http.queue_free()

	if response_code != 200:
		return {"success": false, "error": "HTTP %d" % response_code}

	var parsed = JSON.parse_string(body_bytes.get_string_from_utf8())
	if parsed == null:
		return {"success": false, "error": "Invalid JSON response"}
	return parsed


## Internal POST request.
func _post(url: String, body: String, headers: Array) -> Dictionary:
	var http := HTTPRequest.new()
	add_child(http)

	var packed_headers: PackedStringArray = PackedStringArray()
	for h in headers:
		packed_headers.append(h)

	http.request(url, packed_headers, HTTPClient.METHOD_POST, body)
	var response = await http.request_completed

	var _result: int = response[0]
	var response_code: int = response[1]
	var _resp_headers = response[2]
	var body_bytes: PackedByteArray = response[3]

	http.queue_free()

	if response_code != 200:
		return {"success": false, "error": "HTTP %d" % response_code}

	var parsed = JSON.parse_string(body_bytes.get_string_from_utf8())
	if parsed == null:
		return {"success": false, "error": "Invalid JSON response"}
	return parsed
