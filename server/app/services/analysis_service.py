"""
Analysis Service
----------------
Analyses a completed conversation session using Google Gemini.

Flow
────
1.  Fetch the raw session history from `conversations` collection.
2.  Build a structured prompt requesting a JSON analysis report.
3.  Call Gemini with response_mime_type="application/json" so the SDK
    returns a guaranteed-parseable JSON string — no regex needed.
4.  Validate the JSON against ConversationAnalysis (Pydantic).
5.  Upsert the result into the `analyses` collection.

Error handling
──────────────
- Any exception during Gemini call or parsing → status="failed" is saved so
  the frontend can render a graceful empty state rather than showing nothing.
- The function is designed to be called as a fire-and-forget asyncio task
  (ws.py creates it with asyncio.create_task) — it never raises to the caller.
"""
from __future__ import annotations

import json
import asyncio
from datetime import datetime, timezone
from typing import List, Optional

from google import genai
from google.genai import types as genai_types

import app.db.mongodb as mongodb
from app.core.config import settings
from app.models.analysis import ConversationAnalysis, GrammarCorrection

# ── Gemini client (lazy singleton — created on first call so the API key
#    is guaranteed to be loaded from .env by then) ────────────────────────────
_GENAI_CLIENT: genai.Client | None = None

_GEMINI_CONFIG = genai_types.GenerateContentConfig(
    temperature=1.0,          
    response_mime_type="application/json",
    thinking_config=genai_types.ThinkingConfig(
        thinking_budget=2048
    ),
)


def _get_client() -> genai.Client:
    """Return (and lazily create) the Gemini client."""
    global _GENAI_CLIENT
    if _GENAI_CLIENT is None:
        _GENAI_CLIENT = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _GENAI_CLIENT


# ── Prompt ────────────────────────────────────────────────────────────────────

_ANALYSIS_PROMPT_TEMPLATE = """\
You are an expert English language coach with a specialisation in spoken English \
and conversational fluency assessment. The user is practising SPOKEN ENGLISH. Assess their English only, 
regardless of what language Lila speaks in.

Below is the full transcript of a voice conversation between a user and an AI \
companion named Lila. Analyse the USER's messages only (not Lila's responses) and \
return a single JSON object matching the schema below. Do NOT include any prose, \
markdown fences, or explanation outside the JSON object.

─── SCHEMA ───────────────────────────────────────────────────────────────────
{{
  "session_title":           "<5-7 word descriptive title for this conversation, e.g. Career Goals and Ambitions>",
  "session_summary":         "<1-2 sentence summary of what was discussed>",
  "fluency_score":           <integer 0-100>,
  "cefr_level":              "<A1|A2|B1|B2|C1|C2>",
  "topics":                  ["<topic1>", "<topic2>"],
  "grammar_errors":          [
    {{
      "original":    "<exact user phrase with error>",
      "corrected":   "<corrected version>",
      "explanation": "<brief one-sentence explanation>"
    }}
  ],
  "vocabulary_highlights":   ["<interesting or advanced word the user used>"],
  "strengths":               ["<specific strength observed in the user's language>"],
  "areas_for_improvement":   ["<specific area to work on with example>"]
}}
─── RULES ────────────────────────────────────────────────────────────────────
- fluency_score: base it on naturalness, vocabulary range, grammatical accuracy, \
  and coherence. 90-100 = near-native. 70-89 = advanced learner. 50-69 = \
  intermediate. Below 50 = beginner.
- cefr_level: A1=0-29, A2=30-44, B1=45-59, B2=60-74, C1=75-89, C2=90-100.
- Must be consistent with fluency_score.
- grammar_errors: max 5. Only include real errors. If none, return empty array.
- vocabulary_highlights: max 5 words/phrases. Only genuinely interesting ones.
- strengths: 2-3 items, specific and grounded in what the user actually said.
- areas_for_improvement: 2-3 items, actionable and specific.
- If the conversation is too short to assess (< 3 user messages), set \
  fluency_score to 0, cefr_level to "" and return empty arrays for all lists.
─── CONVERSATION TRANSCRIPT ──────────────────────────────────────────────────
{transcript}
"""


def _build_transcript(history: List[dict]) -> str:
    """Format raw message history into a readable transcript string."""
    lines = []
    for msg in history:
        role = "User" if msg.get("role") == "user" else "Lila"
        content = msg.get("content", "").strip()
        if content:
            lines.append(f"{role}: {content}")
    return "\n".join(lines)


def _count_user_messages(history: List[dict]) -> int:
    return sum(1 for m in history if m.get("role") == "user")


async def _fetch_session_from_db(google_id: str, session_id: str) -> Optional[dict]:
    """Return the conversations document for this session, or None."""
    db = mongodb.db
    return await db["conversations"].find_one(
        {"google_id": google_id, "session_id": session_id},
        {"history": 1, "started_at": 1, "updated_at": 1},
    )


async def _upsert_analysis(analysis: ConversationAnalysis) -> None:
    """Write (or overwrite) the analysis document in MongoDB."""
    db = mongodb.db
    doc = analysis.model_dump()
    await db["analyses"].update_one(
        {"session_id": analysis.session_id},
        {"$set": doc},
        upsert=True,
    )


async def _call_gemini(transcript: str) -> dict:
    """
    Call Gemini in a ThreadPoolExecutor so the event loop stays free.
    Returns the parsed JSON dict.
    """
    prompt = _ANALYSIS_PROMPT_TEMPLATE.format(transcript=transcript)

    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(
        None,
        lambda: _get_client().models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=_GEMINI_CONFIG,
        ),
    )

    raw_text = response.text.strip()
    return json.loads(raw_text)


# ── Public entry point ────────────────────────────────────────────────────────

async def run_analysis_for_session(google_id: str, session_id: str) -> None:
    """
    Fire-and-forget: analyse a session and persist the result.

    Called from ws.py via asyncio.create_task — never raises.
    """
    print(f"\n🔍 Starting analysis for session {session_id[:8]}… (user: {google_id})")

    # ── 1. Insert a "pending" placeholder immediately ─────────────────────────
    placeholder = ConversationAnalysis(
        google_id=google_id,
        session_id=session_id,
        status="pending",
        analysed_at=datetime.now(timezone.utc),
    )
    await _upsert_analysis(placeholder)

    try:
        # ── 2. Fetch session from DB ──────────────────────────────────────────
        session_doc = await _fetch_session_from_db(google_id, session_id)
        if not session_doc:
            raise ValueError(f"Session {session_id} not found in conversations collection")

        history: List[dict] = session_doc.get("history", [])
        if not history:
            raise ValueError("Session history is empty — nothing to analyse")

        # ── 3. Compute simple metrics ─────────────────────────────────────────
        started_at: Optional[datetime] = session_doc.get("started_at")
        updated_at: Optional[datetime] = session_doc.get("updated_at")
        duration_seconds = 0
        if started_at and updated_at:
            duration_seconds = max(0, int((updated_at - started_at).total_seconds()))

        message_count = _count_user_messages(history)

        # ── 4. Build transcript & call Gemini ─────────────────────────────────
        transcript = _build_transcript(history)
        analysis_dict = await _call_gemini(transcript)

        # ── 5. Parse grammar errors into typed objects ────────────────────────
        grammar_errors = [
            GrammarCorrection(**e)
            for e in analysis_dict.get("grammar_errors", [])
        ]

        # ── 6. Build final analysis model ─────────────────────────────────────
        analysis = ConversationAnalysis(
            google_id=google_id,
            session_id=session_id,
            status="done",
            analysed_at=datetime.now(timezone.utc),
            session_title=analysis_dict.get("session_title", ""),
            session_summary=analysis_dict.get("session_summary", ""),
            fluency_score=int(analysis_dict.get("fluency_score", 0)),
            cefr_level=analysis_dict.get("cefr_level", ""),
            topics=analysis_dict.get("topics", []),
            grammar_errors=grammar_errors,
            vocabulary_highlights=analysis_dict.get("vocabulary_highlights", []),
            strengths=analysis_dict.get("strengths", []),
            areas_for_improvement=analysis_dict.get("areas_for_improvement", []),
            duration_seconds=duration_seconds,
            message_count=message_count,
        )

        # ── 7. Persist ────────────────────────────────────────────────────────
        await _upsert_analysis(analysis)
        print(f"✅ Analysis done for session {session_id[:8]}… — score: {analysis.fluency_score}, CEFR: {analysis.cefr_level}")

    except Exception as e:
        print(f"❌ Analysis failed for session {session_id[:8]}…: {e}")
        failed = ConversationAnalysis(
            google_id=google_id,
            session_id=session_id,
            status="failed",
            analysed_at=datetime.now(timezone.utc),
            error_detail=str(e),
        )
        await _upsert_analysis(failed)


# ── Read helpers (used by API routes) ────────────────────────────────────────

async def get_analyses_for_user(
    google_id: str,
    limit: int = 50,
    skip: int = 0,
) -> List[ConversationAnalysis]:
    """Return paginated list of done analyses, newest first."""
    db = mongodb.db
    cursor = (
        db["analyses"]
        .find({"google_id": google_id, "status": "done"})
        .sort("analysed_at", -1)
        .skip(skip)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    results = []
    for doc in docs:
        doc.pop("_id", None)
        try:
            results.append(ConversationAnalysis(**doc))
        except Exception:
            pass
    return results


async def get_analysis_for_session(
    google_id: str,
    session_id: str,
) -> Optional[ConversationAnalysis]:
    """Return the analysis for a specific session (any status)."""
    db = mongodb.db
    doc = await db["analyses"].find_one(
        {"google_id": google_id, "session_id": session_id},
    )
    if not doc:
        return None
    doc.pop("_id", None)
    return ConversationAnalysis(**doc)


async def get_dashboard_stats(google_id: str) -> dict:
    """
    Aggregate statistics across all completed analyses using a MongoDB
    aggregation pipeline — no Python-side loops for the heavy maths.
    """
    db = mongodb.db

    pipeline = [
        {"$match": {"google_id": google_id, "status": "done"}},
        {"$sort": {"analysed_at": -1}},
        {"$facet": {
            # Overall aggregates
            "totals": [
                {"$group": {
                    "_id": None,
                    "total_sessions": {"$sum": 1},
                    "total_time_seconds": {"$sum": "$duration_seconds"},
                    "average_fluency": {"$avg": "$fluency_score"},
                    "vocab_items": {"$push": "$vocabulary_highlights"},
                }},
            ],
            # Latest CEFR level
            "latest_cefr": [
                {"$limit": 1},
                {"$project": {"cefr_level": 1}},
            ],
            # Fluency history for chart (last 30 sessions, oldest→newest)
            "fluency_history": [
                {"$limit": 30},
                {"$sort": {"analysed_at": 1}},
                {"$project": {"fluency_score": 1}},
            ],
            # 5 most recent grammar errors across latest 10 sessions
            "recent_grammar": [
                {"$limit": 10},
                {"$unwind": "$grammar_errors"},
                {"$limit": 5},
                {"$project": {
                    "original": "$grammar_errors.original",
                    "corrected": "$grammar_errors.corrected",
                    "explanation": "$grammar_errors.explanation",
                }},
            ],
            # 3 recent sessions for the sidebar card
            "recent_sessions": [
                {"$limit": 3},
                {"$project": {
                    "_id": 0,
                    "session_id": 1,
                    "session_title": 1,
                    "session_summary": 1,
                    "fluency_score": 1,
                    "cefr_level": 1,
                    "topics": 1,
                    "duration_seconds": 1,
                    "analysed_at": 1,
                }},
            ],
        }},
    ]

    result = await db["analyses"].aggregate(pipeline).to_list(length=1)
    if not result:
        return _empty_dashboard()

    facet = result[0]
    totals = facet.get("totals", [{}])[0] if facet.get("totals") else {}

    # Flatten vocabulary arrays and deduplicate
    raw_vocab = totals.get("vocab_items", [])
    all_vocab = {word for sublist in raw_vocab for word in sublist}

    return {
        "total_sessions": totals.get("total_sessions", 0),
        "total_time_seconds": totals.get("total_time_seconds", 0),
        "average_fluency": round(totals.get("average_fluency") or 0, 1),
        "vocabulary_growth": len(all_vocab),
        "latest_cefr": (facet.get("latest_cefr") or [{}])[0].get("cefr_level") or "N/A",
        "fluency_history": [
            s.get("fluency_score", 0) for s in facet.get("fluency_history", [])
        ],
        "recent_grammar_errors": [
            {
                "original":    g.get("original", ""),
                "corrected":   g.get("corrected", ""),
                "explanation": g.get("explanation", ""),
            }
            for g in facet.get("recent_grammar", [])
        ],
        "recent_sessions": facet.get("recent_sessions", []),
    }


def _empty_dashboard() -> dict:
    return {
        "total_sessions": 0,
        "total_time_seconds": 0,
        "average_fluency": 0.0,
        "vocabulary_growth": 0,
        "latest_cefr": "",
        "fluency_history": [],
        "recent_grammar_errors": [],
        "recent_sessions": [],
    }
