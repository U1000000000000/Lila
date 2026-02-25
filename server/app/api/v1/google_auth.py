"""
Google OAuth2 endpoints for FastAPI.
- /auth/google/login: Redirects to Google login
- /auth/google/callback: Handles Google callback, issues JWT
"""
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, JSONResponse
from app.core.google_oauth import get_google_login_url, exchange_code_for_token, get_user_info
from app.core.security import create_access_token
from app.core.config import settings
from app.services.user_service import create_or_update_user
import os

router = APIRouter(prefix="/google", tags=["auth"])

@router.get("/login")
def google_login(request: Request):
    state = "secure_random_state"  # TODO: generate securely
    url = get_google_login_url(state)
    return RedirectResponse(url)

@router.get("/callback")
async def google_callback(request: Request, code: str = None, state: str = None):
    if not code:
        return JSONResponse({"error": "Missing code"}, status_code=400)
    token_data = exchange_code_for_token(code)
    user_info = get_user_info(token_data["access_token"])
    # Store user in MongoDB
    user = await create_or_update_user(user_info["email"], user_info["name"], user_info.get("picture"))
    # Issue JWT
    token = create_access_token({
        "sub": user.email,
        "name": user.name,
        "google_id": user.google_id
    })
    # 4) Send token to frontend
    # Since we use window.location.href to start OAuth, we must redirect back.
    # We pass the token in the URL fragment or query string.
    frontend_url = settings.FRONTEND_URL
    redirect_url = f"{frontend_url}/auth/callback?token={token}"
    return RedirectResponse(url=redirect_url, status_code=302)
