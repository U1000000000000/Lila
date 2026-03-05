"""
Memory Routes — /api/v1/memory
-------------------------------
Exposes endpoints for Lila's three-tier memory system.

Endpoints
─────────
GET  /memory/          → Tier 2 accumulated memory for the user
GET  /memory/imprints  → Tier 3 imprints (points) for the user
"""

from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_google_id
from app.services.memory_mongo_service import (
    get_recent_memories,
    get_imprints_for_user,
)


router = APIRouter(prefix="/memory", tags=["memory"])


@router.get("/")
async def get_memory(google_id: str = Depends(get_current_google_id)):
    """Return Tier 2 per-session memory summaries for the authenticated user."""
    memories = await get_recent_memories(google_id, limit=50)
    return {
        "sessions": [
            {
                "session_id": m.session_id,
                "summary": m.summary,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in memories
        ],
    }


@router.get("/imprints")
async def get_imprints(google_id: str = Depends(get_current_google_id)):
    """Return Tier 3 imprints (stable facts / points) for the authenticated user."""
    imprints = await get_imprints_for_user(google_id)
    return {
        "points": [
            p.model_dump() if hasattr(p, "model_dump") else p
            for p in imprints.points
        ],
        "updated_at": imprints.updated_at.isoformat() if imprints.updated_at else None,
    }
