"""
Memory service for MongoDB operations.
"""
import app.db.mongodb as mongodb
from app.models.memory import UserMemory
from typing import Optional


async def get_memory_for_user(google_id: str) -> Optional[UserMemory]:
    db = mongodb.db
    doc = await db["memories"].find_one({"google_id": google_id})
    if doc:
        return UserMemory(**doc)
    return None


async def save_memory_for_user(google_id: str, long_term_summary: str, recent_summaries: list) -> UserMemory:
    db = mongodb.db
    doc = await db["memories"].find_one_and_update(
        {"google_id": google_id},
        {"$set": {"long_term_summary": long_term_summary, "recent_summaries": recent_summaries}},
        upsert=True,
        return_document=True
    )
    if not doc:
        doc = await db["memories"].find_one({"google_id": google_id})
    return UserMemory(**doc)


# Remove or fix get_all_memories if not used (List/Memory undefined)
