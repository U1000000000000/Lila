"""
User Routes — /api/v1/users
----------------------------
Placeholder. Will implement profile management, preferences, deletion.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["users"])



from fastapi import Request
from app.core.security import decode_access_token

@router.get("/me")
async def get_me(request: Request):
	token = request.cookies.get("jwt_token")
	if not token:
		return {"error": "Not authenticated"}
	try:
		user = decode_access_token(token)
		return {"user": user}
	except Exception:
		return {"error": "Invalid token"}

# @router.patch("/me")
# async def update_profile(body: UpdateProfileSchema): ...

# @router.delete("/me")
# async def delete_account(): ...
