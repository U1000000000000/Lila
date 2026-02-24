"""
Memory Routes — /api/v1/memory
-------------------------------
Exposes endpoints to read / save Lila's memory for the authenticated user.
"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from app.core.security import decode_access_token
from app.services.memory_mongo_service import get_memory_for_user, save_memory_for_user


router = APIRouter(prefix="/memory", tags=["memory"])


def get_current_google_id(request: Request):
	token = request.cookies.get("jwt_token")
	if not token:
		# Also check Authorization header (used by frontend Bearer flow)
		auth = request.headers.get("Authorization", "")
		if auth.startswith("Bearer "):
			token = auth[7:]
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
	long_term_summary = body.get("long_term_summary", "")
	recent_summaries = body.get("recent_summaries", [])
	memory = await save_memory_for_user(google_id, long_term_summary, recent_summaries)
	return memory.dict()
