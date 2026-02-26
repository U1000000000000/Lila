"""
Shared authentication FastAPI dependencies.

Usage in a route:
    from app.dependencies.auth import get_current_user, get_current_google_id

    @router.get("/")
    async def my_route(user: dict = Depends(get_current_user)):
        ...

    @router.get("/me")
    async def my_route(google_id: str = Depends(get_current_google_id)):
        ...

Token extraction order (mirrors AuthMiddleware):
  1. Authorization: Bearer <token>  header
  2. jwt_token cookie

Note: WebSocket auth uses a separate query-param strategy in ws.py because
      browsers cannot set custom headers on WebSocket connections.
      AuthMiddleware uses its own copy of this logic at ASGI level.
      Both are intentionally NOT unified here — they operate in different
      layers of the stack where FastAPI's dependency injection is unavailable.
"""
from fastapi import Depends, HTTPException, Request, status
from app.core.security import decode_access_token


def _extract_token(request: Request) -> str | None:
    """Try Authorization: Bearer header first, then fall back to jwt_token cookie."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return request.cookies.get("jwt_token")


def get_current_user(request: Request) -> dict:
    """
    FastAPI dependency — returns the fully decoded JWT payload dict.

    Raises HTTP 401 if the token is absent or invalid.
    By the time this runs on protected routes, AuthMiddleware has already
    validated the token; this dependency is the idiomatic FastAPI mechanism
    to surface the decoded payload into route handlers without each handler
    having to duplicate the extraction + decode steps.
    """
    token = _extract_token(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_google_id(user: dict = Depends(get_current_user)) -> str:
    """
    FastAPI dependency — returns the google_id string from the JWT payload.

    Builds on get_current_user so token extraction and decoding happen once.
    Raises HTTP 401 if google_id is absent from the payload (shouldn't happen
    with tokens issued by this server, but guards against malformed tokens).
    """
    google_id: str | None = user.get("google_id")
    if not google_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain a google_id claim",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return google_id
