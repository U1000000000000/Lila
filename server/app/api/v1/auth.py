
"""
Auth Routes — /api/v1/auth
--------------------------
"""
import time
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from app.dependencies.auth import get_current_user
from app.core.config import settings
from app.core.security import decode_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """
    Returns the decoded JWT payload for the currently authenticated user.

    This route lives under /api/v1/auth, which is deliberately excluded from
    AuthMiddleware so the frontend can call it without a chicken-and-egg
    problem.  Authentication is therefore handled entirely by the
    get_current_user dependency rather than by middleware.
    """
    return {"user": user}


@router.post("/exchange")
async def exchange_auth_code(request: Request, response: Response):
    """
    Exchange a short-lived one-time code (issued by /auth/google/callback)
    for an HttpOnly JWT cookie.

    This endpoint is called by the React frontend through the Vite dev proxy
    (localhost:5173 → localhost:8000).  Because the response goes through the
    proxy, the browser stores the resulting Set-Cookie for localhost:5173,
    solving the cross-port cookie isolation problem that occurs when the
    backend sets a cookie directly in the OAuth 302 redirect response.
    """
    from app.api.v1.google_auth import _auth_codes, _JWT_COOKIE_TTL

    body = await request.json()
    code: str = body.get("code", "")

    entry = _auth_codes.pop(code, None)
    if not entry:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired auth code")

    jwt_token, expires_at = entry
    if time.time() > expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Auth code expired")

    _secure = settings.FRONTEND_URL.startswith("https://")
    response.set_cookie(
        key="jwt_token",
        value=jwt_token,
        httponly=True,
        samesite="lax",
        secure=_secure,
        max_age=_JWT_COOKIE_TTL,
        path="/",
    )

    user = decode_access_token(jwt_token)
    return {"user": user}


@router.post("/logout")
async def logout(response: Response):
    """
    Clear the HttpOnly JWT cookie server-side.
    JavaScript cannot delete HttpOnly cookies — only the server can.
    Frontend calls POST /api/v1/auth/logout on user logout.
    """
    response.delete_cookie(key="jwt_token", path="/", samesite="lax")
    return {"ok": True}


from app.api.v1.google_auth import router as google_router
router.include_router(google_router)
