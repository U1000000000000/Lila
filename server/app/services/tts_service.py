"""
TTS Service
-----------
Wraps Deepgram Text-to-Speech WebSocket.

Responsibilities:
  - connect_tts: opens and returns a Deepgram TTS WebSocket with retry + backoff.
  - TTSSession: per-connection lock/task state so concurrent users never interleave audio.
  - send_buffer_to_tts: streams synthesised PCM audio back to the frontend WebSocket.
"""
import asyncio
import json
import websockets

from app.core.config import settings


async def connect_tts() -> websockets.WebSocketClientProtocol:
    """
    Connect to Deepgram TTS WebSocket with exponential backoff (3 attempts).
    Raises RuntimeError if all attempts fail.
    """
    last_error = None
    for attempt in range(3):
        try:
            tts_ws = await websockets.connect(
                settings.DEEPGRAM_TTS_URL,
                additional_headers={"Authorization": f"Token {settings.DEEPGRAM_API_KEY}"},
            )
            print("🔊 TTS WebSocket connected")
            return tts_ws
        except Exception as e:
            last_error = e
            if attempt < 2:
                wait = 2 ** attempt
                print(f"⚠️ TTS connect failed (attempt {attempt + 1}/3), retrying in {wait}s…")
                await asyncio.sleep(wait)

    raise RuntimeError(f"TTS connection failed after 3 attempts: {last_error}")


class TTSSession:
    """Holds per-WebSocket-connection TTS state. Create one per /ws connection."""

    def __init__(self) -> None:
        self.lock: asyncio.Lock = asyncio.Lock()
        self.current_task: asyncio.Task | None = None


async def send_buffer_to_tts(text: str, websocket, tts_ws, session: TTSSession) -> None:
    """
    Send a text sentence to Deepgram TTS and stream raw PCM audio back
    to the frontend WebSocket in real-time.

    Protocol (replaces the old single-blob approach):
      1. JSON  {"type": "tts_start", "response": "<text>"}
             → frontend queues the caption and resets its chunk accumulator.
      2. Binary frames  <PCM chunk> ...
             → forwarded to the frontend the instant Deepgram generates them.
             → frontend accumulates these in memory (negligible cost).
      3. JSON  {"type": "tts_end"}
             → frontend assembles the accumulated PCM into a WAV blob,
               pushes it to the audio queue, and starts playback.

    Why this is faster than the old approach:
      Old: buffer ALL audio on the server (1-3 s per sentence), send one blob.
      New: first chunk arrives from Deepgram in ~150 ms and is forwarded
           immediately. Total transfer time ≈ TTS generation time, but the
           browser starts receiving data ~150 ms sooner per sentence.

    Uses a per-session lock to serialise requests so concurrent users
    never interleave audio on the same TTS WebSocket.
    """
    print(f"\n🎤 TTS ← '{text}'")

    async with session.lock:
        for attempt in range(2):
            try:
                session.current_task = asyncio.current_task()

                # Signal sentence start — frontend queues caption & resets buffer
                await websocket.send_text(json.dumps({"type": "tts_start", "response": text}))

                await tts_ws.send(json.dumps({"type": "Speak", "text": text}))
                await tts_ws.send(json.dumps({"type": "Flush"}))

                any_audio = False
                timeout_count = 0
                max_timeouts = 5  # 5 × 0.3 s = 1.5 s total silence before giving up

                while timeout_count < max_timeouts:
                    try:
                        chunk = await asyncio.wait_for(tts_ws.recv(), timeout=0.3)
                        timeout_count = 0
                        if isinstance(chunk, bytes):
                            any_audio = True
                            # Stream directly — no server-side buffering
                            await websocket.send_bytes(chunk)
                        elif isinstance(chunk, str):
                            msg = json.loads(chunk)
                            if msg.get("type") == "Flushed":
                                print(f"✅ TTS sentence done (streamed)")
                                break
                    except asyncio.TimeoutError:
                        timeout_count += 1
                        if any_audio and timeout_count >= 2:
                            break  # have audio and silence — done

                if not any_audio:
                    print("⚠️ No audio received from TTS")

                # Signal sentence end — frontend assembles accumulated chunks into WAV
                await websocket.send_text(json.dumps({"type": "tts_end"}))
                break  # Success, exit retry loop

            except asyncio.CancelledError:
                print("🛑 TTS cancelled (user interrupted)")
                try:
                    await tts_ws.send(json.dumps({"type": "Clear"}))
                except Exception:
                    pass
                # Do NOT send tts_end — frontend discards accumulated chunks
                # on the next tts_start anyway.
                raise

            except (websockets.exceptions.ConnectionClosed, OSError) as e:
                print(f"❌ TTS connection closed: {e}")
                if attempt == 0:
                    try:
                        tts_ws = await connect_tts()
                        print("🔄 TTS WebSocket reconnected, retrying...")
                        continue
                    except Exception as conn_err:
                        print(f"❌ TTS reconnection failed: {conn_err}")
                print("⚠️ TTS reconnection failed or already retried, giving up.")
                break

            except Exception as e:
                print(f"❌ TTS error: {e}")
                break

            finally:
                if session.current_task == asyncio.current_task():
                    session.current_task = None
