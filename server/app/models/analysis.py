"""
ConversationAnalysis model — Pydantic.

Stored in MongoDB `analyses` collection, one document per WebSocket session.
Generated asynchronously by analysis_service.py after the session ends.

Document schema
───────────────
{
    google_id          : str,
    session_id         : str,           # immutable FK → conversations.session_id
    status             : str,           # "pending" | "done" | "failed"
    analysed_at        : datetime,
    session_title      : str,           # LLM-generated e.g. "Career Goals & Ambitions"
    session_summary    : str,           # 1-2 sentence summary
    fluency_score      : int,           # 0–100
    cefr_level         : str,           # A1 A2 B1 B2 C1 C2
    topics             : [str],
    grammar_errors     : [{original, corrected, explanation}],
    vocabulary_highlights: [str],
    strengths          : [str],
    areas_for_improvement: [str],
    duration_seconds   : int,
    message_count      : int,
    error_detail       : str | None,    # populated only when status == "failed"
}
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class GrammarCorrection(BaseModel):
    original: str
    corrected: str
    explanation: str


class ConversationAnalysis(BaseModel):
    google_id: str
    session_id: str

    # Lifecycle
    status: str = "pending"           # "pending" | "done" | "failed"
    analysed_at: datetime = Field(default_factory=datetime.utcnow)

    # LLM-generated fields (populated when status == "done")
    session_title: str = ""
    session_summary: str = ""
    fluency_score: int = 0
    cefr_level: str = ""
    topics: List[str] = []
    grammar_errors: List[GrammarCorrection] = []
    vocabulary_highlights: List[str] = []
    strengths: List[str] = []
    areas_for_improvement: List[str] = []

    # Computed from raw session data (always available)
    duration_seconds: int = 0
    message_count: int = 0

    # Failure detail
    error_detail: Optional[str] = None

    model_config = {"from_attributes": True}


class DashboardStats(BaseModel):
    """Aggregated stats across all analyses for a user — returned by GET /analysis/dashboard."""
    total_sessions: int = 0
    total_time_seconds: int = 0
    average_fluency: float = 0.0
    vocabulary_growth: int = 0          # count of unique vocabulary highlights
    latest_cefr: str = ""
    recent_grammar_errors: List[GrammarCorrection] = []
    recent_sessions: List[ConversationAnalysis] = []
    fluency_history: List[int] = []     # chronological fluency scores for chart
