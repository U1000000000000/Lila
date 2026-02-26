"""
Memory service for MongoDB operations.

Responsibilities:
  - memories       collection : long-term summary + recent MemoryFact summaries
  - conversations  collection : per-session conversation history

Conversation document schema:
    {
        google_id   : str,          # user identifier
        session_id  : str,          # uuid4 — unique per WebSocket connection
        started_at  : datetime,     # when the WebSocket session was opened
        updated_at  : datetime,     # last message timestamp
        history     : [             # only THIS session's messages
            {"role": "user"|"assistant", "content": "..."},
            ...
        ]
    }

One document per session prevents MongoDB's 16 MB document-size limit from
being reached by long-term users.  The LLM receives recent context by
aggregating the last few sessions rather than one giant document.
"""
import app.db.mongodb as mongodb
from app.models.memory import UserMemory
from datetime import datetime, timezone
from typing import List, Optional

from app.core.config import settings


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


# ── Conversations (per-session documents) ────────────────────────────────────

async def get_recent_conversation_context(
    google_id: str,
    max_messages: int | None = None,
) -> List[dict]:
    """
    Aggregate message history from the user's most recent sessions to use as
    LLM context at the start of a new session.

    We load up to 5 past sessions (sorted oldest→newest) and return at most
    `max_messages` messages from the tail — matching the CONVERSATION_WINDOW
    setting so the LLM never receives more than it can usefully attend to.
    """
    if max_messages is None:
        max_messages = settings.CONVERSATION_WINDOW

    db = mongodb.db
    # Fetch the 5 most recent sessions for this user (newest first)
    cursor = db["conversations"].find(
        {"google_id": google_id},
        {"history": 1, "started_at": 1},
    ).sort("started_at", -1).limit(5)

    sessions = await cursor.to_list(length=5)

    if not sessions:
        return []

    # Reverse to chronological order (oldest session first)
    sessions.reverse()

    # Flatten all session histories into one ordered list
    combined: List[dict] = []
    for session in sessions:
        combined.extend(session.get("history", []))

    # Return only the most recent messages up to max_messages
    return combined[-max_messages:]


async def save_session_history(
    google_id: str,
    session_id: str,
    started_at: datetime,
    history: List[dict],
) -> None:
    """
    Upsert the history for a specific session document.
    `history` should contain only the messages from this session
    (not the full cross-session context loaded for the LLM).
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
