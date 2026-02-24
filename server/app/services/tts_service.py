"""
TTS Service
-----------
Wraps Deepgram Text-to-Speech WebSocket.
Handles locking to prevent audio mixing, cancellation, and buffering.
"""
import asyncio
import json

from app.core.config import settings

# Prevents simultaneous TTS requests from interleaving audio
tts_lock = asyncio.Lock()
current_tts_task: asyncio.Task | None = None


async def send_buffer_to_tts(text: str, websocket, tts_ws) -> None:
    """
    Send a text sentence to Deepgram TTS and stream raw PCM audio back
    to the frontend WebSocket. Uses tts_lock to serialise requests.
    """
    global current_tts_task

    print(f"\n🎤 TTS ← '{text}'")

    # Surface text to frontend immediately (before audio arrives)
    await websocket.send_text(json.dumps({"response": text + " "}))

    async with tts_lock:
        try:
            current_tts_task = asyncio.current_task()

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
            if current_tts_task == asyncio.current_task():
                current_tts_task = None
