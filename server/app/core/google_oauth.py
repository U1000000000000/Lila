"""
Google OAuth2 utility for FastAPI.
Handles login URL generation, callback, token exchange, and JWT issuance.
"""
import os
import requests
import httpx
from urllib.parse import urlencode
from fastapi import HTTPException
from app.core.config import settings

# In production, ensure these are loaded via .environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = settings.GOOGLE_REDIRECT_URI

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

SCOPES = ["openid", "email", "profile"]


def get_google_login_url(state: str) -> str:
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Google OAuth is not configured. Missing GOOGLE_CLIENT_ID.",
        )
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def exchange_code_for_token(code: str) -> dict:
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    # Mask secret for logging so we don't leak it, but we can verify what's happening
    masked_data = data.copy()
    masked_data["client_secret"] = f"{GOOGLE_CLIENT_SECRET[:10]}...{GOOGLE_CLIENT_SECRET[-4:]}" if GOOGLE_CLIENT_SECRET else "MISSING"
    print(f"Exchanging code with payload: {masked_data}")
    
    # Use httpx post which is standard in async FastAPI environments
    with httpx.Client() as client:
        resp = client.post(GOOGLE_TOKEN_URL, data=data)
    
    if resp.status_code != 200:
        error_msg = f"Failed to exchange code for token. Google response: {resp.text}"
        print(f"OAuth Error: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    return resp.json()


def get_user_info(access_token: str) -> dict:
    with httpx.Client() as client:
        resp = client.get(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch user info")
    return resp.json()
