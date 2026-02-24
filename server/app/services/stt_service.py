"""
STT Service
-----------
Handles connecting to Deepgram Speech-to-Text WebSocket with retry + backoff.
"""
import asyncio
import websockets

from app.core.config import settings


async def connect_stt() -> websockets.WebSocketClientProtocol:
    """
    Connect to Deepgram STT WebSocket with exponential backoff (3 attempts).
    Raises RuntimeError if all attempts fail.
    """
    last_error = None
    for attempt in range(3):
        try:
            stt_ws = await websockets.connect(
                settings.DEEPGRAM_STT_URL,
                additional_headers={"Authorization": f"Token {settings.DEEPGRAM_API_KEY}"},
            )
            print("🎤 STT WebSocket connected")
            return stt_ws
        except Exception as e:
            last_error = e
            if attempt < 2:
                wait = 2 ** attempt
                print(f"⚠️ STT connect failed (attempt {attempt + 1}/3), retrying in {wait}s…")
                await asyncio.sleep(wait)

    raise RuntimeError(f"STT connection failed after 3 attempts: {last_error}")


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
