"""
Google OAuth2 endpoints for FastAPI.
- /auth/google/login: Redirects to Google login
- /auth/google/callback: Handles Google callback, issues JWT
"""
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, JSONResponse
from app.core.google_oauth import get_google_login_url, exchange_code_for_token, get_user_info
from app.core.security import create_access_token
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
    jwt_token = create_access_token({
        "sub": user.email,
        "name": user.name,
        "google_id": user.google_id
    })
    # Redirect to frontend with token as a URL param.
    # This sidesteps cross-origin cookie restrictions between :8000 and :5173
    # (the browser won't send a :8000 cookie back to :5173 fetch requests).
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    redirect_url = f"{frontend_url}/auth/callback?token={jwt_token}"
    return RedirectResponse(url=redirect_url, status_code=302)
