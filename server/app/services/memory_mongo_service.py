"""
Memory service for MongoDB operations.

Three-tier memory architecture
──────────────────────────────
  Tier 1 — conversations  : full session transcript, one document per session.
  Tier 2 — memories        : per-session prose summary (~150-200 tokens), one document per session.
  Tier 3 — imprints        : structured stable-fact points, one document per user (max 20 points).

Conversation document schema:
    {
        google_id   : str,
        session_id  : str,
        started_at  : datetime,
        updated_at  : datetime,
        history     : [
            {"role": "user"|"assistant", "content": "..."},
            ...
        ]
    }
"""
import app.db.mongodb as mongodb
from app.models.memory import SessionMemory
from app.models.imprints import UserImprints
from datetime import datetime, timezone
from typing import List, Optional


# ══════════════════════════════════════════════════════════════════════════════
# Tier 2 — Memory (per-session summaries)
# ══════════════════════════════════════════════════════════════════════════════

async def get_recent_memories(
    google_id: str,
    limit: int = 10,
) -> List[SessionMemory]:
    """
    Return the most recent Tier 2 session summaries for a user.
    Ordered newest → oldest.  Returns up to `limit` documents.
    """
    db = mongodb.db
    cursor = (
        db["memories"]
        .find({"google_id": google_id})
        .sort("created_at", -1)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    results = []
    for doc in docs:
        doc.pop("_id", None)
        results.append(SessionMemory(**doc))
    # Return in chronological order (oldest first) for prompt assembly
    results.reverse()
    return results


async def get_all_memories_text(google_id: str) -> str:
    """
    Concatenate all Tier 2 session summaries into a single prose string.
    Used when Lila needs full recall context.
    """
    memories = await get_recent_memories(google_id, limit=50)
    if not memories:
        return ""
    return "\n\n".join(m.summary for m in memories if m.summary)


async def save_session_memory(
    google_id: str,
    session_id: str,
    summary: str,
    session_started_at: Optional[datetime] = None,
) -> None:
    """
    Upsert a Tier 2 summary for a specific session.
    One document per session — idempotent.
    """
    db = mongodb.db
    now = datetime.now(timezone.utc)
    await db["memories"].update_one(
        {"google_id": google_id, "session_id": session_id},
        {
            "$set": {
                "summary": summary,
                "updated_at": now,
            },
            "$setOnInsert": {
                "google_id": google_id,
                "session_id": session_id,
                "created_at": session_started_at or now,
            },
        },
        upsert=True,
    )


# ══════════════════════════════════════════════════════════════════════════════
# Tier 3 — Imprints (stable facts / points)
# ══════════════════════════════════════════════════════════════════════════════

async def get_imprints_for_user(google_id: str) -> UserImprints:
    """
    Return the Tier 3 imprints for a user.
    Always returns a UserImprints instance (empty points list for new users).
    """
    db = mongodb.db
    doc = await db["imprints"].find_one({"google_id": google_id})
    if doc:
        doc.pop("_id", None)
        return UserImprints(**doc)
    return UserImprints(google_id=google_id, points=[])


async def save_imprints_for_user(
    google_id: str,
    points: List[dict],
) -> None:
    """
    Upsert the Tier 3 imprints for a user.
    `points` is a list of dicts matching the Imprint schema.
    """
    db = mongodb.db
    now = datetime.now(timezone.utc)
    await db["imprints"].update_one(
        {"google_id": google_id},
        {
            "$set": {
                "points": points,
                "updated_at": now,
            },
            "$setOnInsert": {"google_id": google_id},
        },
        upsert=True,
    )


# ══════════════════════════════════════════════════════════════════════════════
# Tier 1 — Conversations (per-session transcript documents)
# ══════════════════════════════════════════════════════════════════════════════

async def save_session_history(
    google_id: str,
    session_id: str,
    started_at: datetime,
    history: List[dict],
) -> None:
    """
    Upsert the full transcript for a specific session.
    Called once when the WebSocket session ends (RAM → DB).
    """
    db = mongodb.db
    now = datetime.now(timezone.utc)
    await db["conversations"].update_one(
        {"google_id": google_id, "session_id": session_id},
        {
            "$set": {
                "history": history,
                "updated_at": now,
            },
            "$setOnInsert": {
                "google_id": google_id,
                "session_id": session_id,
                "started_at": started_at,
            },
        },
        upsert=True,
    )


async def get_all_conversation_history(
    google_id: str,
) -> List[dict]:
    """
    Aggregate ALL messages across ALL sessions for a user.
    Used by Tier 3 refactoring (requires full history).

    WARNING: For power users this will be large. Deferred optimisation.
    """
    db = mongodb.db
    cursor = db["conversations"].find(
        {"google_id": google_id},
        {"history": 1, "started_at": 1},
    ).sort("started_at", 1)  # chronological

    sessions = await cursor.to_list(length=None)
    combined: List[dict] = []
    for session in sessions:
        combined.extend(session.get("history", []))
    return combined
