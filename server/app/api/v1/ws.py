"""
WebSocket Route — /ws
----------------------
Single persistent connection per user session.
Orchestrates: STT ↔ LLM ↔ TTS pipeline.

Memory architecture:
  - Current session messages live in RAM only (conversation_history,
    current_session_history).
  - Tier 3 imprints are loaded once at session start and passed to every
    LLM call.
  - On disconnect, Tier 1 is saved to DB, then the full post-session
    pipeline fires (analysis → Tier 2 → Tier 3).
"""
import asyncio
import json
from datetime import datetime, timezone
from uuid import uuid4

import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from app.core.config import settings
from app.services.memory_mongo_service import (
    get_imprints_for_user,
    save_session_history,
)
from app.core.security import decode_access_token
from app.services.stt_service import connect_stt
from app.services.tts_service import connect_tts, TTSSession
from app.services.llm_service import send_llm_response
from app.services.memory_pipeline_service import run_post_session_pipeline

router = APIRouter()

# Track concurrent connections with an asyncio-safe lock
_active_connections: int = 0
_connections_lock: asyncio.Lock = asyncio.Lock()


async def _decrement_connections() -> int:
    global _active_connections
    async with _connections_lock:
        _active_connections = max(0, _active_connections - 1)
        return _active_connections


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global _active_connections

    await websocket.accept()

    # Browsers automatically send HttpOnly cookies with WebSocket handshakes
    # (same as HTTP requests) — no query param needed or accepted.
    # Reading from the cookie only keeps the JWT out of URLs, server logs,
    # and JS memory entirely.
    token = websocket.cookies.get("jwt_token")
    if not token:
        await websocket.send_text(json.dumps({"error": "Not authenticated"}))
        await websocket.close()
        return
    try:
        user = decode_access_token(token)
        google_id = user.get("google_id")
        if not google_id:
            raise Exception("No google_id in token")
    except Exception as auth_err:
        print(f"🔐 Auth failed: {auth_err}")
        await websocket.send_text(json.dumps({"error": "Invalid or missing authentication"}))
        await websocket.close()
        return

    # Check and increment are a single atomic operation inside one lock
    # acquisition — no other coroutine can slip between the guard and the
    # increment and push the count past the ceiling.
    async with _connections_lock:
        if _active_connections >= settings.MAX_CONCURRENT_CONNECTIONS:
            await websocket.send_text(json.dumps({"error": "Too many connections. Please wait."}))
            await websocket.close()
            return
        _active_connections += 1
        active = _active_connections
    print(f"✅ Client connected (active: {active})")

    # Each WebSocket connection is its own session
    session_id: str = str(uuid4())
    session_started_at: datetime = datetime.now(timezone.utc)

    # ── Memory architecture: current session only, no past sessions ───────────
    conversation_history: list = []            # fed to LLM — current session only
    current_session_history: list = []         # mirror for DB persistence at end

    # Tier 3 — load imprints once, inject into every LLM call
    user_imprints: list = []
    try:
        imprints_doc = await get_imprints_for_user(google_id)
        user_imprints = [
            p.model_dump() if hasattr(p, "model_dump") else p
            for p in imprints_doc.points
        ]
        if user_imprints:
            print(f"📌 Loaded {len(user_imprints)} imprints for user {google_id}")
    except Exception as e:
        print(f"⚠️  Failed to load imprints: {e}")

    latest_user_input: str = ""
    current_task: asyncio.Task | None = None
    tts_ws = None
    # Per-connection TTS session — isolates lock/state from other users
    tts_session = TTSSession()

    try:
        # ── Connect to Deepgram ───────────────────────────────────────────────
        try:
            tts_ws = await connect_tts()
            stt_ws = await connect_stt()
        except RuntimeError as e:
            await websocket.send_text(json.dumps({"error": str(e)}))
            await websocket.close()
            return

        # ── Inner coroutines ──────────────────────────────────────────────────
        # Hard cap on inbound binary frames.  A malicious client sending
        # arbitrarily large audio blobs would exhaust server memory without
        # this guard.  Browser MediaRecorder chunks at 100 ms intervals are
        # typically 2-8 KB; 1 MB is many orders of magnitude above any
        # legitimate frame and safely catches abuse or misconfiguration.
        _MAX_AUDIO_BYTES = 1 * 1024 * 1024  # 1 MB

        async def receive_audio():
            """Forward raw audio bytes from browser → Deepgram STT."""
            try:
                async for message in websocket.iter_bytes():
                    if not message:
                        continue
                    if len(message) > _MAX_AUDIO_BYTES:
                        print(
                            f"\u26a0\ufe0f  Oversized audio frame ({len(message):,} bytes) "
                            f"from {google_id} \u2014 closing connection (1009)"
                        )
                        await websocket.close(code=1009)  # RFC 6455: Message Too Big
                        return
                    await deepgram_ws.send(message)
            except websockets.exceptions.ConnectionClosed:
                print("\U0001f6aa Frontend closed audio stream")
            except Exception as e:
                print(f"\u274c Audio receive error: {e}")

        async def process_transcription():
            """Read STT results and trigger LLM responses."""
            nonlocal latest_user_input, current_task

            async for raw in deepgram_ws:
                try:
                    data = json.loads(raw)

                    if data.get("type") == "Metadata":
                        continue

                    if "channel" in data and "alternatives" in data["channel"]:
                        transcript = (
                            data["channel"]["alternatives"][0]
                            .get("transcript", "")
                            .strip()
                        )
                        if not transcript:
                            continue

                        is_final = data.get("is_final", False)

                        # Always forward transcript to the browser so the user
                        # can see what Deepgram heard (interim = live preview,
                        # final = confirmed text). is_final flag lets the
                        # frontend distinguish the two if needed.
                        if websocket.client_state != WebSocketState.DISCONNECTED:
                            await websocket.send_text(
                                json.dumps({"transcript": transcript, "is_final": is_final})
                            )

                        # Only fire the LLM on a FINAL (non-interim) transcript.
                        #
                        # Deepgram streams a sequence of progressively longer
                        # interim results while the user speaks:
                        #   "Hello"  → "Hello how"  → "Hello how are you"
                        # Acting on every interim causes:
                        #   (a) constant LLM cancel/restart churn (wasted RTTs)
                        #   (b) the += accumulation turning the prompt into
                        #       "Hello Hello how Hello how are Hello how are you"
                        # Waiting for is_final gives one clean, complete sentence.
                        if not is_final:
                            continue

                        print(f"👤 User (final): {transcript}")
                        # += is correct here: Deepgram may emit multiple finals
                        # for a single spoken utterance when the user pauses
                        # mid-sentence. Each final cancels the in-flight LLM
                        # task and the next one incorporates the full context.
                        latest_user_input += " " + transcript

                        # Barge-in: cancel current response
                        if current_task and not current_task.done():
                            print("🛑 Barge-in — cancelling previous response")
                            current_task.cancel()
                            try:
                                await current_task
                            except asyncio.CancelledError:
                                pass

                        captured_input = latest_user_input.strip()
                        latest_user_input = ""  # reset so next turn starts fresh

                        current_task = asyncio.create_task(
                            send_llm_response(
                                captured_input,
                                websocket,
                                conversation_history,
                                current_session_history,
                                tts_ws,
                                tts_session,
                                google_id,
                                user_imprints,
                            )
                        )

                    elif "error" in data:
                        print(f"❌ Deepgram error: {data['error']}")
                        if websocket.client_state != WebSocketState.DISCONNECTED:
                            await websocket.send_text(
                                json.dumps({"error": f"STT error: {data['error']}"})
                            )

                except Exception as e:
                    print(f"❌ Transcription error: {e}")

        async def keep_alive():
            """Ping client every 30 s to prevent proxy timeouts."""
            try:
                while True:
                    await asyncio.sleep(30)
                    if websocket.client_state != WebSocketState.DISCONNECTED:
                        await websocket.send_text(json.dumps({"type": "ping"}))
            except Exception:
                pass

        # ── Run pipeline ──────────────────────────────────────────────────────
        async with stt_ws as deepgram_ws:
            keep_alive_task = asyncio.create_task(keep_alive())
            try:
                await asyncio.gather(receive_audio(), process_transcription())
            finally:
                keep_alive_task.cancel()
                try:
                    await keep_alive_task
                except asyncio.CancelledError:
                    pass

    except WebSocketDisconnect:
        print("🚪 Client disconnected normally")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
    finally:
        active = await _decrement_connections()
        if tts_ws:
            try:
                await tts_ws.close()
            except Exception:
                pass

        # ── Post-session pipeline ─────────────────────────────────────────────
        # Only trigger if the user actually spoke (session has messages).
        if google_id and session_id and current_session_history:
            # Step 1: Save Tier 1 to DB — MUST complete before pipeline reads it
            try:
                await save_session_history(
                    google_id,
                    session_id,
                    session_started_at,
                    current_session_history,
                )
                print(
                    f"💾 Tier 1 saved to MongoDB for user {google_id} "
                    f"(session {session_id[:8]}… | {len(current_session_history)} messages)"
                )
            except Exception as e:
                print(f"❌ Tier 1 save failed: {e}")

            # Steps 2-4: Analysis → Tier 2 → Tier 3 (fire-and-forget)
            asyncio.create_task(
                run_post_session_pipeline(
                    google_id,
                    session_id,
                    current_session_history,
                    session_started_at,
                ),
                name=f"pipeline-{session_id[:8]}",
            )
            print(f"🧠 Post-session pipeline queued for session {session_id[:8]}…")

        print(f"🚪 Session closed (active: {active})")
