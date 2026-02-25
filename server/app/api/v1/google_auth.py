"""
Google OAuth2 endpoints for FastAPI.
- /auth/google/login: Redirects to Google login
- /auth/google/callback: Handles Google callback, issues JWT
"""
import os
import secrets

from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, JSONResponse
from app.core.google_oauth import get_google_login_url, exchange_code_for_token, get_user_info
from app.core.security import create_access_token
from app.core.config import settings
from app.services.user_service import create_or_update_user

router = APIRouter(prefix="/google", tags=["auth"])

# How long the state cookie is valid (seconds)
_STATE_COOKIE_TTL = 300  # 5 minutes


@router.get("/login")
def google_login(request: Request):
    # Generate a cryptographically random, unguessable state value and store
    # it in an HttpOnly cookie so we can verify it when Google redirects back.
    state = secrets.token_urlsafe(32)
    url = get_google_login_url(state)
    response = RedirectResponse(url)
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        samesite="lax",
        max_age=_STATE_COOKIE_TTL,
        secure=False,  # set to True in production behind HTTPS
    )
    return response


@router.get("/callback")
async def google_callback(request: Request, code: str = None, state: str = None):
    # ── CSRF validation ────────────────────────────────────────────────────────
    stored_state = request.cookies.get("oauth_state")
    if not state or not stored_state or not secrets.compare_digest(state, stored_state):
        return JSONResponse({"error": "Invalid OAuth state — possible CSRF attack"}, status_code=400)

    if not code:
        return JSONResponse({"error": "Missing authorization code"}, status_code=400)

    # ── Exchange & fetch user info ──────────────────────────────────────────────
    token_data = exchange_code_for_token(code)
    user_info = get_user_info(token_data["access_token"])

    # Use the canonical Google subject identifier ("sub") as the unique user key.
    # Email can change; sub is stable and guaranteed unique per Google account.
    google_id = user_info.get("sub")
    if not google_id:
        return JSONResponse({"error": "Google did not return a subject identifier"}, status_code=400)

    user = await create_or_update_user(
        google_id=google_id,
        email=user_info["email"],
        name=user_info["name"],
        picture=user_info.get("picture"),
    )

    # ── Issue JWT ────────────────────────────────────────────────────────────
    jwt_token = create_access_token({
        "sub": user.email,
        "name": user.name,
        "google_id": user.google_id,
    })

    # Redirect to frontend; clear the one-time state cookie on the way out
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    redirect_url = f"{frontend_url}/auth/callback?token={jwt_token}"
    response = RedirectResponse(url=redirect_url, status_code=302)
    response.delete_cookie("oauth_state")
    return response
