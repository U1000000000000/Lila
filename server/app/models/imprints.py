"""
Imprints model for MongoDB (Atlas).

Tier 3 — Imprints
──────────────────
Stable, personality-defining facts about a user that Lila carries across every
conversation.  One document per user in the `imprints` collection, containing
up to 20 structured points.

Always injected into Lila's system prompt so she knows who she's talking to.
Updated after every session by the post-session pipeline (memory_pipeline_service).
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class Imprint(BaseModel):
    """A single stable fact about the user or the Lila–user relationship."""
    type: str                          # [IDENTITY] | [PERSONALITY] | [RELATIONSHIP] | [LANGUAGE] | [GOAL]
    point: str                         # declarative sentence, max ~30 words
    confidence: str = "medium"         # "high" | "medium"
    sessions_seen: int = 1             # how many sessions this fact has surfaced


class UserImprints(BaseModel):
    google_id: str = Field(..., description="Google unique user id")
    points: List[Imprint] = []         # max 20 imprints
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"from_attributes": True}
