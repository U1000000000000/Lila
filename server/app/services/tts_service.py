"""
TTS Service
-----------
Wraps Deepgram Text-to-Speech WebSocket.

TTSSession encapsulates per-connection lock and current task reference,
ensuring TTS requests from different users never interfere with each other.
"""
import asyncio
import json


class TTSSession:
    """Holds per-WebSocket-connection TTS state. Create one per /ws connection."""

    def __init__(self) -> None:
        self.lock: asyncio.Lock = asyncio.Lock()
        self.current_task: asyncio.Task | None = None


async def send_buffer_to_tts(text: str, websocket, tts_ws, session: TTSSession) -> None:
    """
    Send a text sentence to Deepgram TTS and stream raw PCM audio back
    to the frontend WebSocket.  Uses a per-session lock to serialise
    requests so concurrent users never interleave audio.
    """

    print(f"\n🎤 TTS ← '{text}'")

    # Surface text to frontend immediately (before audio arrives)
    await websocket.send_text(json.dumps({"response": text + " "}))

    async with session.lock:
        try:
            session.current_task = asyncio.current_task()

            await tts_ws.send(json.dumps({"type": "Speak", "text": text}))
            await tts_ws.send(json.dumps({"type": "Flush"}))

            audio_buffer = bytearray()
            timeout_count = 0
            max_timeouts = 5  # 5 × 0.2 s = 1 s total silence before giving up

            while timeout_count < max_timeouts:
                try:
                    chunk = await asyncio.wait_for(tts_ws.recv(), timeout=0.2)
                    timeout_count = 0
                    if isinstance(chunk, bytes):
                        audio_buffer.extend(chunk)
                    elif isinstance(chunk, str):
                        msg = json.loads(chunk)
                        if msg.get("type") == "Flushed":
                            print(f"✅ TTS audio complete: {len(audio_buffer)} bytes")
                            break
                except asyncio.TimeoutError:
                    timeout_count += 1
                    if audio_buffer and timeout_count >= 2:
                        break  # have audio and silence — done

            if audio_buffer:
                print(f"🔊 Sending {len(audio_buffer)} bytes → frontend")
                await websocket.send_bytes(bytes(audio_buffer))
            else:
                print("⚠️ No audio received from TTS")

        except asyncio.CancelledError:
            print("🛑 TTS cancelled (user interrupted)")
            try:
                await tts_ws.send(json.dumps({"type": "Clear"}))
            except Exception:
                pass
            raise

        except Exception as e:
            print(f"❌ TTS error: {e}")

        finally:
            if session.current_task == asyncio.current_task():
                session.current_task = None
