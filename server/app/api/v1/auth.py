
"""
Auth Routes — /api/v1/auth
--------------------------
Placeholder. Will implement login / register / refresh / logout.
"""
from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user

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


from app.api.v1.google_auth import router as google_router
router.include_router(google_router)
