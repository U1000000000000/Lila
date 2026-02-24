"""
Memory Routes — /api/v1/memory
-------------------------------
Placeholder. Will expose endpoints to read / search / delete Lila's memory
for a user — supporting the tiered memory system in the architecture doc.
"""

from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from app.core.security import decode_access_token
from app.services.memory_mongo_service import get_memory_for_user, save_memory_for_user


router = APIRouter(prefix="/memory", tags=["memory"])


def get_current_google_id(request: Request):
	token = request.cookies.get("jwt_token")
	if not token:
		return None
	try:
		user = decode_access_token(token)
		return user.get("google_id")
	except Exception:
		return None




@router.get("/")
async def get_memory(request: Request):
	google_id = get_current_google_id(request)
	if not google_id:
		return JSONResponse({"error": "Not authenticated"}, status_code=401)
	memory = await get_memory_for_user(google_id)
	return memory.dict() if memory else {"long_term_summary": "", "recent_summaries": []}



@router.post("/")
async def save_memory(request: Request):
	google_id = get_current_google_id(request)
	if not google_id:
		return JSONResponse({"error": "Not authenticated"}, status_code=401)
	body = await request.json()
	messages = body.get("messages", [])
	memory = await save_memory_for_user(user_id, messages)
	return memory.dict()

# @router.get("/summary")
# async def get_summary(): ...
