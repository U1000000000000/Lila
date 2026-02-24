"""
LLM Service
-----------
Groq-powered streaming response generation.

Performance architecture:
  - The Groq SDK returns a *synchronous* blocking iterator. Running it
    directly inside an async function freezes the entire event loop.
  - Fix: run it in a ThreadPoolExecutor so the event loop stays free.
  - Sentences are pushed onto an asyncio.Queue the moment they complete.
  - A concurrent TTS consumer drains that queue immediately.
  - Effect: TTS starts on sentence 1 while the LLM generates sentence 2.
"""
import asyncio
import json
from concurrent.futures import ThreadPoolExecutor

from groq import Groq

from app.core.config import settings
from app.services.memory_mongo_service import (
    get_memory_for_user,
    save_conversation_for_user,
)
from app.services.tts_service import send_buffer_to_tts, TTSSession

groq_client = Groq()

# Shared thread pool — keeps all blocking Groq calls off the event loop
_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="groq")

# Poison-pill pushed onto the queue to signal end-of-stream
_SENTINEL = object()

_MEMORY_KEYWORDS = [
    "remember", "told you", "earlier", "before",
    "said", "mentioned", "what do you know", "recall",
    "my name", "i said", "we talked", "what did i",
]

_SYSTEM_PROMPT_BASE = (
    "You are a friendly, empathetic AI friend. "
    "Keep answers SHORT (1-2 sentences max) and natural like texting. "
    "Be conversational, warm, and real. No formality. "
    "Respond fast — brevity shows you're engaged."
)


def _stream_groq_to_queue(
    messages: list,
    sentence_queue: asyncio.Queue,
    loop: asyncio.AbstractEventLoop,
) -> str:
    """
    Runs inside a ThreadPoolExecutor thread — never on the event loop thread.
    Calls the blocking Groq sync iterator, splits tokens into sentences,
    and pushes each completed sentence onto `sentence_queue` immediately.
    Returns the full response string.
    """
    full_response = ""
    sentence_buffer = ""

    response = groq_client.chat.completions.create(
        messages=messages,
        model="llama-3.3-70b-versatile",
        temperature=0.8,
        max_tokens=150,
        stream=True,
    )

    for chunk in response:
        token = chunk.choices[0].delta.content if chunk.choices[0].delta else ""
        if token:
            sentence_buffer += token
            full_response += token
            print(token, end="", flush=True)

            if sentence_buffer.rstrip().endswith((".", "?", "!", ";")):
                asyncio.run_coroutine_threadsafe(
                    sentence_queue.put(sentence_buffer.strip()), loop
                ).result()
                sentence_buffer = ""

    # Flush any trailing text that lacks sentence-ending punctuation
    if sentence_buffer.strip():
        asyncio.run_coroutine_threadsafe(
            sentence_queue.put(sentence_buffer.strip()), loop
        ).result()

    # Signal the async consumer that the stream is done
    asyncio.run_coroutine_threadsafe(
        sentence_queue.put(_SENTINEL), loop
    ).result()

    return full_response


async def send_llm_response(
    user_input: str,
    websocket,
    conversation_history: list,
    tts_ws,
    tts_session: "TTSSession",
    google_id: str = None,
) -> None:
    """
    Generate and stream an LLM response for `user_input`.
    Groq runs in a thread; TTS drains the sentence queue concurrently.
    Supports barge-in cancellation via asyncio.CancelledError.
    tts_session is a per-connection TTSSession (lock + task ref).
    """
    conversation_history.append({"role": "user", "content": user_input})

    # Slide the context window — keep only the most recent N messages
    if len(conversation_history) > settings.CONVERSATION_WINDOW:
        conversation_history[:] = conversation_history[-settings.CONVERSATION_WINDOW:]

    # Build system prompt — inject persistent memory only when user explicitly asks
    system_prompt = _SYSTEM_PROMPT_BASE
    needs_memory = any(kw in user_input.lower() for kw in _MEMORY_KEYWORDS)
    if needs_memory and google_id:
        mem = await get_memory_for_user(google_id)
        if mem:
            if mem.long_term_summary:
                system_prompt += f"\n\n[Long-term memory]: {mem.long_term_summary}"
            if mem.recent_summaries:
                recent = "; ".join(
                    s.text for s in mem.recent_summaries[-3:]
                )
                system_prompt += f"\n\n[Recent context]: {recent}"

    messages = [{"role": "system", "content": system_prompt}] + conversation_history
    sentence_queue: asyncio.Queue = asyncio.Queue()
    loop = asyncio.get_event_loop()

    try:
        # ── Producer: Groq runs in a thread — event loop stays responsive ────
        groq_future = loop.run_in_executor(
            _executor,
            _stream_groq_to_queue,
            messages,
            sentence_queue,
            loop,
        )

        # ── Consumer: drain sentences → TTS the moment each one arrives ───────
        full_response = ""
        while True:
            sentence = await sentence_queue.get()
            if sentence is _SENTINEL:
                break
            full_response += sentence + " "
            await send_buffer_to_tts(sentence, websocket, tts_ws, tts_session)

        # Ensure the producer thread has fully exited
        await groq_future

        # Persist assistant turn and save raw conversation to MongoDB
        conversation_history.append({"role": "assistant", "content": full_response.strip()})

        if google_id:
            await save_conversation_for_user(google_id, conversation_history)
            print(f"\n💾 Conversation saved to MongoDB for user {google_id} ({len(conversation_history)} messages)")
        else:
            print("\n❌ Not authenticated: chat not saved")

    except asyncio.CancelledError:
        print("\n🛑 LLM response cancelled (barge-in)")
        await websocket.send_text(json.dumps({"response": "[interrupted]"}))
        raise

    except Exception as e:
        print(f"\n❌ LLM error: {e}")
        await websocket.send_text(json.dumps({"response": "Sorry, I had a glitch."}))
