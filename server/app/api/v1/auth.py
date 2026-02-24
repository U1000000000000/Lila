
"""
Auth Routes — /api/v1/auth
--------------------------
Placeholder. Will implement login / register / refresh / logout.
"""
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from app.core.security import decode_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

def _extract_token(request: Request) -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return request.cookies.get("jwt_token")


@router.get("/me")
async def get_me(request: Request):
    token = _extract_token(request)
    if not token:
        return JSONResponse({"error": "Not authenticated"}, status_code=401)
    try:
        user = decode_access_token(token)
        return {"user": user}
    except Exception:
        return JSONResponse({"error": "Invalid token"}, status_code=401)

from app.api.v1.google_auth import router as google_router
router.include_router(google_router)
