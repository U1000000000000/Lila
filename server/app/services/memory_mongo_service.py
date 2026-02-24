"""
Memory service for MongoDB operations.

Responsibilities:
  - memories   collection : long-term summary + recent MemoryFact summaries
  - conversations collection : raw per-user conversation history (sliding window)
"""
import app.db.mongodb as mongodb
from app.models.memory import UserMemory
from typing import List, Optional


# ── Memory (summaries) ────────────────────────────────────────────────────────

async def get_memory_for_user(google_id: str) -> Optional[UserMemory]:
    db = mongodb.db
    doc = await db["memories"].find_one({"google_id": google_id})
    if doc:
        doc.pop("_id", None)
        return UserMemory(**doc)
    return None


async def save_memory_for_user(
    google_id: str,
    long_term_summary: str,
    recent_summaries: list,
) -> UserMemory:
    db = mongodb.db
    doc = await db["memories"].find_one_and_update(
        {"google_id": google_id},
        {"$set": {"long_term_summary": long_term_summary, "recent_summaries": recent_summaries}},
        upsert=True,
        return_document=True,
    )
    if not doc:
        doc = await db["memories"].find_one({"google_id": google_id})
    doc.pop("_id", None)
    return UserMemory(**doc)


# ── Conversations (raw message history) ──────────────────────────────────────

async def get_conversation_for_user(google_id: str) -> List[dict]:
    """Return the stored raw conversation history for a user, or an empty list."""
    db = mongodb.db
    doc = await db["conversations"].find_one({"google_id": google_id})
    if doc:
        return doc.get("history", [])
    return []


async def save_conversation_for_user(google_id: str, history: List[dict]) -> None:
    """Upsert the raw conversation history for a user."""
    db = mongodb.db
    await db["conversations"].update_one(
        {"google_id": google_id},
        {"$set": {"history": history}},
        upsert=True,
    )
