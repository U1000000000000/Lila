"""
User Routes — /api/v1/users
----------------------------
Placeholder. Will implement profile management, preferences, deletion.
"""
from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """
    Returns the decoded JWT payload for the currently authenticated user.

    Previously this handler only checked the jwt_token cookie, which meant
    Bearer-token requests (the standard frontend flow) silently returned 401.
    Using the shared get_current_user dependency fixes that and keeps the
    extraction logic in one place.
    """
    return {"user": user}


# @router.patch("/me")
# async def update_profile(body: UpdateProfileSchema): ...

# @router.delete("/me")
# async def delete_account(): ...
