"""
Memory Routes — /api/v1/memory
-------------------------------
Exposes endpoints to read / save Lila's memory for the authenticated user.
"""

from fastapi import APIRouter, Depends, Request
from app.dependencies.auth import get_current_google_id
from app.services.memory_mongo_service import get_memory_for_user, save_memory_for_user


router = APIRouter(prefix="/memory", tags=["memory"])


@router.get("/")
async def get_memory(google_id: str = Depends(get_current_google_id)):
    memory = await get_memory_for_user(google_id)
    return memory.dict() if memory else {"long_term_summary": "", "recent_summaries": []}


@router.post("/")
async def save_memory(request: Request, google_id: str = Depends(get_current_google_id)):
    body = await request.json()
    long_term_summary = body.get("long_term_summary", "")
    recent_summaries = body.get("recent_summaries", [])
    memory = await save_memory_for_user(google_id, long_term_summary, recent_summaries)
    return memory.dict()
