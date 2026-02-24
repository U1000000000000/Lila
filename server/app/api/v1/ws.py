"""
WebSocket Route — /ws
----------------------
Single persistent connection per user session.
Orchestrates: STT ↔ LLM ↔ TTS pipeline.
"""
import asyncio
import json

import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import settings
from app.services.memory_mongo_service import get_conversation_for_user
from app.core.security import decode_access_token
from app.services.stt_service import connect_stt, connect_tts
from app.services.llm_service import send_llm_response
from app.services.tts_service import TTSSession

router = APIRouter()

# Track concurrent connections with an asyncio-safe lock
_active_connections: int = 0
_connections_lock: asyncio.Lock = asyncio.Lock()


async def _increment_connections() -> int:
    global _active_connections
    async with _connections_lock:
        _active_connections += 1
        return _active_connections


async def _decrement_connections() -> int:
    global _active_connections
    async with _connections_lock:
        _active_connections = max(0, _active_connections - 1)
        return _active_connections


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global _active_connections

    await websocket.accept()

    # Accept token from query param (?token=JWT) or cookie.
    # Browsers can't set custom headers on WebSocket connections, so we use
    # the query param approach when cookies aren't available cross-origin.
    token = (
        websocket.query_params.get("token")
        or websocket.cookies.get("jwt_token")
    )
    if not token:
        await websocket.send_text(json.dumps({"error": "Not authenticated"}))
        await websocket.close()
        return
    try:
        user = decode_access_token(token)
        google_id = user.get("google_id")
        if not google_id:
            raise Exception("No google_id in token")
    except Exception:
        await websocket.send_text(json.dumps({"error": "Invalid or missing authentication"}))
        await websocket.close()
        return

    async with _connections_lock:
        if _active_connections >= settings.MAX_CONCURRENT_CONNECTIONS:
            await websocket.send_text(json.dumps({"error": "Too many connections. Please wait."}))
            await websocket.close()
            return

    active = await _increment_connections()
    print(f"✅ Client connected (active: {active})")

    # Load raw conversation history from MongoDB for this user
    conversation_history: list = await get_conversation_for_user(google_id)
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
        async def receive_audio():
            """Forward raw audio bytes from browser → Deepgram STT."""
            try:
                async for message in websocket.iter_bytes():
                    if message:
                        await deepgram_ws.send(message)
            except websockets.exceptions.ConnectionClosed:
                print("🚪 Frontend closed audio stream")
            except Exception as e:
                print(f"❌ Audio receive error: {e}")

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

                        print(f"👤 User: {transcript}")
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
                                tts_ws,
                                tts_session,
                                google_id,
                            )
                        )

                    elif "error" in data:
                        print(f"❌ Deepgram error: {data['error']}")
                        if not websocket.client_state.closed:
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
                    if not websocket.client_state.closed:
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
        print(f"🚪 Session closed (active: {active})")
