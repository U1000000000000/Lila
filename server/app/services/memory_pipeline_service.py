"""
Memory Pipeline Service
-----------------------
Runs after every WebSocket session ends (fire-and-forget from ws.py).

Pipeline order
──────────────
  1. Tier 1 — conversation transcript saved to `conversations`  (done by ws.py before calling)
  2. Analysis + Tier 2 + Tier 3 — run concurrently via asyncio.gather

  Concurrency rationale:
  - Tier 1 is already persisted before this pipeline fires, so all three steps
    can safely read from the DB (conversations collection) immediately.
  - Analysis, Tier 2, and Tier 3 have ZERO data dependencies on each other:
      Analysis → reads conversations (Tier 1 already saved)
      Tier 2   → reads memories + current transcript (independent)
      Tier 3   → reads conversations + current transcript + imprints (independent)
  - Running sequentially would queue 3 Gemini API round-trips unnecessarily.
  - asyncio.gather fires all three concurrently; total latency ≈ slowest single call.

Design notes
────────────
- All Gemini calls run in a ThreadPoolExecutor so the event loop stays free.
- Uses response_mime_type="application/json" for guaranteed-parseable output.
- Never raises to caller — the pipeline is fire-and-forget from ws.py.
- Analysis runs concurrently with Tier 2 + 3 (independent task).
"""
from __future__ import annotations

import asyncio
import json
from typing import List

from google import genai
from google.genai import types as genai_types

from app.core.config import settings
from app.services.memory_mongo_service import (
    get_all_memories_text,
    save_session_memory,
    get_imprints_for_user,
    save_imprints_for_user,
    get_all_conversation_history,
)
from app.services.analysis_service import run_analysis_for_session


# ── Gemini client ─────────────────────────────────────────────────────────────
# Double-checked locking with a threading.Lock ensures thread-safe lazy
# initialisation.  asyncio.Lock cannot be used here because _get_client() is
# called from inside run_in_executor threads, not from the event loop.
import threading as _threading

_GENAI_CLIENT: genai.Client | None = None
_GENAI_CLIENT_LOCK = _threading.Lock()


def _get_client() -> genai.Client:
    """Return the Gemini client, initialising it exactly once (thread-safe)."""
    global _GENAI_CLIENT
    # Fast path — no lock needed once the client exists.
    if _GENAI_CLIENT is not None:
        return _GENAI_CLIENT
    # Slow path — acquire the lock and check again inside (double-checked locking).
    # This prevents two threads that both saw None from each creating a client.
    with _GENAI_CLIENT_LOCK:
        if _GENAI_CLIENT is None:
            _GENAI_CLIENT = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _GENAI_CLIENT


# ══════════════════════════════════════════════════════════════════════════════
# Prompts
# ══════════════════════════════════════════════════════════════════════════════

TIER2_MEMORY_PROMPT = """\
You are Lila's memory system. Your job is to write a focused, compressed summary \
of a SINGLE conversation session between a user and Lila — an AI conversation \
partner designed to feel like a real friend.

You will receive:
1. CURRENT SESSION TRANSCRIPT — the full raw conversation that just ended
2. PREVIOUS SESSION SUMMARIES — compressed summaries from all prior sessions \
(may be empty for new users) — provided ONLY so you do not repeat facts \
already captured. Do NOT rewrite or incorporate them into your output.

Your output is a NEW, INDEPENDENT SUMMARY OF THIS SESSION ONLY. It will be \
saved as its own document alongside summaries of other sessions. Future reads \
will concatenate all session summaries for full recall context.

━━━ YOUR GOAL ━━━
Produce a focused per-session summary that:
- Covers ONLY what happened in THIS session — not history from prior sessions
- Captures every meaningful NEW fact not already in PREVIOUS SESSION SUMMARIES
- Skips facts already captured in PREVIOUS SESSION SUMMARIES — assume they are known
- Stays within approximately 150-200 tokens
- Reads like a private note a thoughtful friend wrote after a specific conversation

━━━ WHAT TO CAPTURE (from this session only) ━━━
ABOUT THE USER (personal identity):
- Name, age, location, occupation, field of study if mentioned this session
- Living situation, family, relationships
- Goals, ambitions, fears, insecurities that surfaced
- Strong opinions or preferences that came up naturally
- Problems they are currently dealing with
- Things they mentioned wanting to do or achieve

ABOUT THE RELATIONSHIP WITH LILA:
- Topics the user brought up or returned to in this session
- Things Lila promised, agreed to, or committed to help with this session
- Topics the user avoided or reacted negatively to
- Inside references, jokes, or shared moments that happened this session
- How the user communicated (formal, casual, direct, evasive) if notable

ABOUT USER'S LANGUAGE LEARNING:
- Native language or language background if mentioned
- Topics where their English became noticeably stronger or weaker
- Vocabulary gaps or recurring grammar patterns noticed naturally

━━━ WHAT TO IGNORE ━━━
- Lila's side of the conversation (her responses, questions, opinions)
- One-off throwaway comments that don't reveal anything meaningful
- Small talk with no informational content ("how are you", "that's interesting")
- Anything the user immediately contradicted or walked back in the same session
- Facts already captured in PREVIOUS SESSION SUMMARIES

━━━ OUTPUT FORMAT ━━━
Return ONLY a JSON object. No preamble, no explanation, no markdown fences.

{{"memories": "<this session's summary as flowing natural prose, written in \
third person, approximately 150-200 tokens, reads like a private note about \
what was new and meaningful in this specific conversation>"}}

━━━ TONE OF THE SUMMARY TEXT ━━━
Write as if a close friend is jotting notes about a specific conversation they \
just had. Not clinical. Not a list. Flowing sentences focused on what was \
new in this session.

━━━ INPUT ━━━

CURRENT SESSION TRANSCRIPT:
{current_session_transcript}

PREVIOUS SESSION SUMMARIES (context only — do NOT repeat these facts):
{existing_memories}

━━━ OUTPUT ━━━\
"""


TIER3_POINTS_PROMPT = """\
You are Lila's long-term identity system. Your job is to maintain a small, \
precise set of facts that are ALWAYS true about this user — facts so fundamental \
that Lila must know them before every single conversation, with or without any \
session memories available.

You will receive:
1. CURRENT SESSION TRANSCRIPT — the full raw conversation that just ended
2. FULL CONVERSATION HISTORY — all previous sessions combined (oldest first), \
for identifying recurring patterns across sessions
3. EXISTING POINTS — the current list of known facts (may be empty for new users)

Your output will replace EXISTING POINTS entirely.

━━━ WHAT POINTS ARE ━━━
Points are IDENTITY ANCHORS — not summaries of events, not observations from \
one session, not things that might change next week. They are permanent facts \
about WHO this person is that Lila needs injected into her prompt before every \
conversation so she is never starting blind.

Ask yourself: "If Lila had no session memories at all, would knowing this \
fact make her response meaningfully more personal?" If yes, it belongs. If no, \
drop it.

A strong point is:
- True across many sessions, unlikely to change
- Reveals something core about identity, personality, or the Lila–user dynamic
- Dense — packs the maximum useful information into the fewest words
- Actionable — Lila can use it to respond differently than she would for a stranger

A weak point (cut these ruthlessly):
- A session event ("user talked about their project today")
- A temporary state ("user was tired", "user is stressed about exams this week")
- A decision or situation likely to be resolved within weeks \
("user is deciding between X and Y", "user is waiting for a result", \
"user is weighing architecture options") — once resolved this becomes a lie; \
drop it entirely and let Tier 2 carry it. If the temporary decision is \
attached to a permanent sentence, REMOVE the decision clause only — do not \
keep the whole point just because part of it is permanent
- Vague filler ("user is friendly", "user likes technology")
- Redundant with another point — two points saying the same thing differently
- Something so obvious Lila would infer it from the conversation anyway

━━━ POINT TYPES ━━━
Tag every point with one of these types:

[IDENTITY] — who the user fundamentally is
Examples: "Final year CS student at JECRC Jaipur, building an AI voice \
companion called Lila as a personal project", "Based in Jaipur, Rajasthan; \
works independently, no team"

[PERSONALITY] — how they think, feel, and communicate — stable patterns only
Examples: "Responds well to direct criticism but needs it framed constructively; \
gets defensive when big-picture ideas are challenged", "Understates problems \
initially, then reveals they're larger — probe gently before accepting the \
first framing"

[RELATIONSHIP] — what is specific and established between this user and Lila
Examples: "Treats Lila as a genuine collaborator on the Lila project — treat \
it as fully shared knowledge, never ask for re-explanation", "Appreciates \
pushback over agreement; Lila has standing permission to challenge his decisions"

[LANGUAGE] — stable English proficiency patterns seen across multiple sessions
Examples: "Strong technical vocabulary, weaker in casual/emotional register; \
article usage (a/an/the) and past perfect are recurring gaps"

[GOAL] — the user's core persistent ambitions or ongoing struggles
Examples: "Primary goal: ship Lila as a real product, not a portfolio piece; \
currently managing tension between final year deadlines and project velocity"

━━━ RULES FOR UPDATING ━━━

CONSOLIDATING POINTS (do this first, before anything else):
- Scan all EXISTING POINTS for any two that cover the same or adjacent aspects \
of the same topic within the same type category
- Merge them into ONE dense point using commas, semicolons, or em-dashes
- Example: two [IDENTITY] points about location and work → \
"Web developer from Jaipur, India; currently in America"
- Example: two [LANGUAGE] observations → \
"Strong technical vocabulary; recurring gaps in article usage and past perfect"
- Never split a previously merged point back out into separate points

PER-CATEGORY LIMITS (enforced after consolidation):
- For each category ([IDENTITY], [PERSONALITY], [RELATIONSHIP], [LANGUAGE], [GOAL]),
  never use more than 2 points per category unless the topics are genuinely unrelated and cannot be merged without losing meaning.
- If you have more than 2 points in any category, merge further until only the most essential, dense anchors remain.
- Example: If 6 [GOAL] points all relate to the same project, merge them into 1–2 dense sentences covering all relevant details.

ADDING POINTS:
- Only add a new point if this session introduced a genuinely new stable fact \
that cannot be absorbed into any existing point
- New users: start with 1 point; grow only when clear identity-level \
information appears
- Hard maximum: {max_points} points. If still at {max_points} after \
consolidation and a new fact is clearly more important than the weakest \
existing point, replace the weakest — never exceed {max_points}

UPDATING EXISTING POINTS:
- Current session contradicts an existing point → update to the newer truth
- Current session adds nuance → refine the point in place, do not add a duplicate
- Current session confirms an existing point → leave unchanged, increment sessions_seen

REMOVING POINTS:
- Remove only if the current session clearly disproved or obsoleted the fact
- Silence in the current session is NOT a reason to remove a point

RECENCY RULE:
- Current session always wins over older information in direct conflicts
- When merging nuance, prefer the more specific or more recent version

━━━ OUTPUT FORMAT ━━━
Return ONLY a JSON object. No preamble, no explanation, no markdown fences.

{{"points": [\
  {{"type": "[IDENTITY] | [PERSONALITY] | [RELATIONSHIP] | [LANGUAGE] | [GOAL]",\
   "point": "<the fact as a dense declarative sentence Lila can act on, \
maximum 40 words>",\
   "confidence": "high | medium",\
   "sessions_seen": <integer>}}\
]}}

"confidence": "high" = stated explicitly or confirmed across multiple sessions. \
"medium" = inferred from one session or implied rather than stated directly.

"sessions_seen" starts at 1. Increment each session where the fact is \
confirmed, referenced, or observed again. Merged points carry the highest \
sessions_seen of the source points.

━━━ FINAL CHECK BEFORE OUTPUT ━━━
Do these steps IN ORDER before producing output:

1. EPHEMERALITY SWEEP — For every point, ask: "Will this still be true in \
two months?" If the answer is "probably not", delete it. If a permanent point \
contains a temporary clause (e.g. "nearing deployment; weighing X vs Y"), \
STRIP the temporary clause from the sentence rather than keeping the whole point.

2. CATEGORY COUNT — Count your points per category right now:
   [IDENTITY]: __ points   (max 2)
   [PERSONALITY]: __ points (max 2)
   [RELATIONSHIP]: __ points (max 2)
   [LANGUAGE]: __ points   (max 2)
   [GOAL]: __ points       (max 2)
   Any category over 2? Merge the two most similar points in that category \
into one dense sentence. Repeat until every category is at or below 2.

3. TOTAL COUNT — Is the grand total at or below {max_points}? \
If not, merge the two weakest points across all categories.

4. IDENTITY ANCHOR TEST — For each remaining point: would it change how Lila \
responds to this person vs a complete stranger? If no, drop it.

5. DENSITY TEST — Can any point be made shorter without losing meaning? \
If yes, tighten it.

━━━ INPUT ━━━

CURRENT SESSION TRANSCRIPT:
{current_session_transcript}

FULL CONVERSATION HISTORY (all previous sessions, oldest first):
{all_conversations_transcript}

EXISTING POINTS:
{existing_points_json}

━━━ OUTPUT ━━━\
"""


# ══════════════════════════════════════════════════════════════════════════════
# Transcript builder (shared by all tiers)
# ══════════════════════════════════════════════════════════════════════════════

def build_transcript(history: List[dict]) -> str:
    """Format raw message history into a readable transcript string."""
    lines = []
    for msg in history:
        role = "User" if msg.get("role") == "user" else "Lila"
        content = msg.get("content", "").strip()
        if content:
            lines.append(f"{role}: {content}")
    return "\n".join(lines)


# ══════════════════════════════════════════════════════════════════════════════
# Tier 2 — Memory Summarisation
# ══════════════════════════════════════════════════════════════════════════════

_TIER2_CONFIG = genai_types.GenerateContentConfig(
    temperature=1,
    response_mime_type="application/json",
    thinking_config=genai_types.ThinkingConfig(thinking_budget=2048),
)


async def run_tier2_summarization(
    google_id: str,
    transcript: str,
    existing_memories: str,
) -> str:
    """
    Generate a Tier 2 summary for the CURRENT SESSION ONLY.
    Existing memories are provided as context so the summary avoids
    restating facts already captured in prior session summaries.
    Returns a ~150-250 token prose summary of this session.
    """
    prompt = TIER2_MEMORY_PROMPT.format(
        current_session_transcript=transcript,
        existing_memories=existing_memories
        if existing_memories
        else "None — this is the user's first session.",
    )

    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(
        None,
        lambda: _get_client().models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=_TIER2_CONFIG,
        ),
    )

    result = json.loads(response.text.strip())
    return result["memories"]


# ══════════════════════════════════════════════════════════════════════════════
# Tier 3 — Imprints (Points) Refactoring
# ══════════════════════════════════════════════════════════════════════════════

_TIER3_CONFIG = genai_types.GenerateContentConfig(
    temperature=1,
    response_mime_type="application/json",
    thinking_config=genai_types.ThinkingConfig(thinking_budget=2048),
)


async def run_tier3_refactoring(
    google_id: str,
    transcript: str,
    existing_points: list,
    all_conversations_transcript: str = "",
) -> list:
    """
    Generate updated Tier 3 imprints from the full session history.
    Receives the current session transcript, all prior Tier 1 conversation
    history (for cross-session pattern recognition), and existing points.
    Returns the new points list (max 20 items).
    """
    prompt = TIER3_POINTS_PROMPT.format(
        current_session_transcript=transcript,
        all_conversations_transcript=all_conversations_transcript
        if all_conversations_transcript
        else "None — this is the user's first session.",
        existing_points_json=json.dumps(existing_points, indent=2)
        if existing_points
        else "[]",
        max_points=settings.TIER3_MAX_POINTS,
    )

    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(
        None,
        lambda: _get_client().models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=_TIER3_CONFIG,
        ),
    )

    result = json.loads(response.text.strip())
    points = result["points"]

    # Hard safety cap — Gemini should never exceed this after the prompt's
    # consolidation pass, but enforce it in code to be certain.
    max_pts = settings.TIER3_MAX_POINTS
    if len(points) > max_pts:
        print(
            f"⚠️  Tier 3 returned {len(points)} points (limit {max_pts}) — "
            f"prompt consolidation may have failed; truncating by confidence/sessions_seen."
        )
        # Sort: high confidence first, then most-seen — drop the weakest tail
        _conf_order = {"high": 0, "medium": 1}
        points = sorted(
            points,
            key=lambda p: (_conf_order.get(p.get("confidence", "medium"), 1), -p.get("sessions_seen", 1)),
        )[:max_pts]

    return points


# ══════════════════════════════════════════════════════════════════════════════
# Pipeline orchestrator
# ══════════════════════════════════════════════════════════════════════════════

async def run_post_session_pipeline(
    google_id: str,
    session_id: str,
    current_session_history: List[dict],
    session_started_at=None,
) -> None:
    """
    Fire-and-forget pipeline executed after every session ends.
    Tier 1 must already be saved to DB before this is called.

    Analysis, Tier 2, and Tier 3 have no data dependencies on each other
    (all three only need Tier 1, which is already persisted) so they run
    concurrently via asyncio.gather. Total latency ≈ slowest single call,
    not the sum of all three.
    """
    print(f"\n🧠 Post-session pipeline starting for session {session_id[:8]}…")

    transcript = build_transcript(current_session_history)

    if not transcript.strip():
        print(f"⚠️  Empty transcript for session {session_id[:8]}, skipping pipeline")
        return

    # ── Isolated async helpers — each catches its own exceptions ─────────────

    async def _run_analysis():
        try:
            await run_analysis_for_session(google_id, session_id)
            print(f"✅ Analysis complete for session {session_id[:8]}")
        except Exception as e:
            print(f"❌ Analysis failed for session {session_id[:8]}: {e}")

    async def _run_tier2():
        try:
            existing_memories_str = await get_all_memories_text(google_id)
            new_summary = await run_tier2_summarization(
                google_id, transcript, existing_memories_str,
            )
            await save_session_memory(
                google_id, session_id, new_summary, session_started_at,
            )
            print(f"✅ Tier 2 memory saved for session {session_id[:8]}")
        except Exception as e:
            print(f"❌ Tier 2 memory failed for session {session_id[:8]}: {e}")

    async def _run_tier3():
        try:
            existing_imprints = await get_imprints_for_user(google_id)
            existing_points = [
                p.model_dump() if hasattr(p, "model_dump") else p
                for p in existing_imprints.points
            ]
            # All Tier 1 history is already saved — safe to read immediately.
            all_history_msgs = await get_all_conversation_history(google_id)
            all_conversations_transcript = build_transcript(all_history_msgs)

            new_points = await run_tier3_refactoring(
                google_id,
                transcript,
                existing_points,
                all_conversations_transcript,
            )
            await save_imprints_for_user(google_id, new_points)
            print(
                f"✅ Tier 3 imprints updated for {google_id} "
                f"(session {session_id[:8]}, {len(new_points)} points)"
            )
        except Exception as e:
            print(f"❌ Tier 3 imprints failed for session {session_id[:8]}: {e}")

    try:
        await asyncio.gather(_run_analysis(), _run_tier2(), _run_tier3())
        print(f"✅ Post-session pipeline complete for session {session_id[:8]}")
    except Exception as e:
        print(f"❌ Post-session pipeline failed for session {session_id[:8]}: {e}")
