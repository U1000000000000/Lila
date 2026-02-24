"""
Auth Middleware — placeholder.
Will verify JWT tokens on protected routes.
"""
# from fastapi import Request, HTTPException, status
# from starlette.middleware.base import BaseHTTPMiddleware
# from app.core.security import decode_access_token

# class AuthMiddleware(BaseHTTPMiddleware):
#     async def dispatch(self, request: Request, call_next):
#         if request.url.path.startswith("/api/v1/auth"):
#             return await call_next(request)      # public routes
#         token = request.headers.get("Authorization", "").replace("Bearer ", "")
#         if not token:
#             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
#         decode_access_token(token)               # raises on invalid
#         return await call_next(request)

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.security import decode_access_token

def _extract_token(request: Request) -> str | None:
    """Try Authorization: Bearer header first, then jwt_token cookie."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return request.cookies.get("jwt_token")


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Public routes that don't need authentication
        if (
            request.url.path.startswith("/api/v1/auth")
            or request.url.path.startswith("/static")
            or request.url.path.startswith("/docs")
            or request.url.path.startswith("/openapi")
            or request.url.path.startswith("/favicon")
            or request.url.path.startswith("/.well-known")
            or request.url.path == "/ws"
        ):
            return await call_next(request)
        token = _extract_token(request)
        if not token:
            return JSONResponse({"error": "Not authenticated"}, status_code=401)
        try:
            decode_access_token(token)
        except Exception:
            return JSONResponse({"error": "Invalid token"}, status_code=401)
        return await call_next(request)
