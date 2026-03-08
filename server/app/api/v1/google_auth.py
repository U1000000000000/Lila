"""
Google OAuth2 endpoints for FastAPI.
- /auth/google/login:    Redirects to Google login page
- /auth/google/callback: Handles Google callback, issues a short-lived auth code
- /auth/logout:          Clears the HttpOnly JWT cookie (JS cannot do this itself)

Cookie strategy:
  The JWT is NOT set directly in the OAuth 302 redirect response.  That would
  set the cookie for localhost:8000, while the React app lives on localhost:5173
  (Vite dev proxy) — browsers isolate cookies by port for localhost, so the
  cookie would never be sent with subsequent API calls through the proxy.

  Instead, the callback stores the JWT in a server-side dict keyed by a
  short-lived one-time code (30 s TTL).  The frontend exchanges this code via
  a normal POST /api/v1/auth/exchange request that goes through the Vite proxy
  (localhost:5173 → localhost:8000).  The exchange response sets the HttpOnly
  JWT cookie, which the browser stores for localhost:5173 and therefore
  includes in every subsequent proxied API call.  In production (same origin,
  no proxy), the direct redirect + cookie approach would also work, but the
  code-exchange pattern is safer and more portable.
"""
import time
import secrets

from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, JSONResponse
from app.core.google_oauth import get_google_login_url, exchange_code_for_token, get_user_info
from app.core.security import create_access_token
from app.core.config import settings
from app.services.user_service import create_or_update_user

router = APIRouter(prefix="/google", tags=["auth"])

# How long the state cookie is valid (seconds)
_STATE_COOKIE_TTL = 300   # 5 minutes

# How long the JWT session cookie lives (seconds)
_JWT_COOKIE_TTL = 60 * 60 * 24  # 24 hours

# ── One-time auth code store ───────────────────────────────────────────────────
# Maps  code → (jwt_token, expires_at)
# Codes are deleted on first use or after _AUTH_CODE_TTL seconds.
# No persistence needed — a server restart just forces a fresh login.
_auth_codes: dict[str, tuple[str, float]] = {}
_AUTH_CODE_TTL = 30  # seconds — long enough for the browser round-trip


def _purge_expired_codes() -> None:
    """Remove codes whose TTL has elapsed without being consumed.

    Called on each new login so the dict never grows unboundedly.
    O(n) over the number of *currently stored* codes — which in
    practice is at most a handful (one per concurrent login attempt).
    """
    now = time.time()
    expired = [k for k, (_, exp) in _auth_codes.items() if now > exp]
    for k in expired:
        del _auth_codes[k]


@router.get("/login")
def google_login(request: Request):
    # Generate a cryptographically random, unguessable state value and store
    # it in an HttpOnly cookie so we can verify it when Google redirects back.
    state = secrets.token_urlsafe(32)
    url = get_google_login_url(state)
    response = RedirectResponse(url)
    # secure=True in production (HTTPS); False only for local HTTP dev
    _secure = settings.FRONTEND_URL.startswith("https://")
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        samesite="lax",
        max_age=_STATE_COOKIE_TTL,
        secure=_secure,
    )
    return response


@router.get("/callback")
async def google_callback(request: Request, code: str = None, state: str = None, error: str = None):
    frontend_url = settings.FRONTEND_URL  # resolved from APP_ENV (dev → localhost:5173, prod → vercel)

    # ── User cancelled / provider returned an error ────────────────────────────
    if error or not code:
        response = RedirectResponse(url=f"{frontend_url}/login", status_code=302)
        response.delete_cookie("oauth_state")
        return response

    # ── CSRF validation ────────────────────────────────────────────────────────
    stored_state = request.cookies.get("oauth_state")
    if not state or not stored_state or not secrets.compare_digest(state, stored_state):
        response = RedirectResponse(url=f"{frontend_url}/login", status_code=302)
        response.delete_cookie("oauth_state")
        return response

    # ── Exchange & fetch user info ──────────────────────────────────────────────
    token_data = await exchange_code_for_token(code)
    user_info = await get_user_info(token_data["access_token"])

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
        "email": user.email,
        "picture": user.picture,
        "google_id": user.google_id,
    })

    # ── Store JWT under a one-time code and redirect with just the code ───────
    # Use a different variable name (auth_code) to avoid shadowing the `code`
    # OAuth parameter that was already consumed above.
    auth_code = secrets.token_urlsafe(32)
    _auth_codes[auth_code] = (jwt_token, time.time() + _AUTH_CODE_TTL)
    _purge_expired_codes()  # evict stale entries left by tab-close / abandoned flows

    redirect_url = f"{frontend_url}/auth/callback?code={auth_code}"
    response = RedirectResponse(url=redirect_url, status_code=302)
    response.delete_cookie("oauth_state")
    return response



