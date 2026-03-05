
"""
Memory model for MongoDB (Atlas).

Tier 2 — Memory
────────────────
Per-session compressed summary.  One document per session in the `memories`
collection, each containing a ~200-token prose summary plus timestamps.

When Lila needs recall, the N most recent SessionMemory documents are
loaded and concatenated into the system prompt.

Document schema:
    {
        google_id   : str,
        session_id  : str,          # FK → conversations.session_id
        summary     : str,          # ~150-250 token prose summary
        created_at  : datetime,     # when the session started
        updated_at  : datetime,     # when the summary was written
    }
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class SessionMemory(BaseModel):
    """One Tier 2 memory document — one per session."""
    google_id: str = Field(..., description="Google unique user id")
    session_id: str = Field(..., description="Session this summary belongs to")
    summary: str = ""                  # ~150-250 token prose
    created_at: Optional[datetime] = None   # session start time
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"from_attributes": True}
