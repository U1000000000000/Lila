"""
Google OAuth2 utility for FastAPI.
Handles login URL generation, callback, token exchange, and JWT issuance.
"""
import httpx
from urllib.parse import urlencode
from fastapi import HTTPException
from app.core.config import settings

# All OAuth credentials are read from `settings`, which loads them from .env
# via load_dotenv() before this module is ever imported.  Reading them at the
# call site (via settings.*) avoids the import-time race where os.environ.get()
# would return None if .env had not yet been loaded.
GOOGLE_REDIRECT_URI = settings.GOOGLE_REDIRECT_URI

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

SCOPES = ["openid", "email", "profile"]


def get_google_login_url(state: str) -> str:
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def exchange_code_for_token(code: str) -> dict:
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(GOOGLE_TOKEN_URL, data=data)
    if resp.status_code != 200:
        # Log the raw Google response server-side only — it may echo back
        # request parameters including the client_secret.  Never surface it
        # to the caller.
        print(f"OAuth token exchange failed (HTTP {resp.status_code}): {resp.text}")
        raise HTTPException(
            status_code=400,
            detail="OAuth token exchange failed. Please try signing in again.",
        )
    return resp.json()


async def get_user_info(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch user info")
    return resp.json()
