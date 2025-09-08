# oauth_tidal.py
import urllib.parse

AUTH_URL  = "https://login.tidal.com/authorize"              # ← was wrong
TOKEN_URL = "https://auth.tidal.com/v1/oauth2/token"

def auth_url(client_id, redirect_uri, scope, state, code_challenge):
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": scope,                       # e.g., "playlists.read playlists.write"
        "state": state,
        "code_challenge_method": "S256",
        "code_challenge": code_challenge,
    }
    return f"{AUTH_URL}?{urllib.parse.urlencode(params)}"
