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

Memory architecture:
  - conversation_history contains ONLY the current session's messages (RAM).
  - Tier 3 imprints (points) are ALWAYS injected into the system prompt.
  - Tier 2 memory is injected ONLY when keyword triggers are detected.
  - No DB writes happen here — Tier 1 is saved once at session end by ws.py.
"""
import asyncio
import json
from concurrent.futures import ThreadPoolExecutor
from typing import List

from groq import Groq

from app.services.memory_mongo_service import get_all_memories_text
from app.services.tts_service import send_buffer_to_tts, TTSSession

from app.core.lila_prompt import LILA_SYSTEM_PROMPT

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
        model="meta-llama/llama-4-scout-17b-16e-instruct",
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
    current_session_history: list,
    tts_ws,
    tts_session: "TTSSession",
    google_id: str = None,
    user_imprints: List[dict] | None = None,
) -> None:
    """
    Generate and stream an LLM response for `user_input`.
    Groq runs in a thread; TTS drains the sentence queue concurrently.
    Supports barge-in cancellation via asyncio.CancelledError.
    tts_session is a per-connection TTSSession (lock + task ref).

    conversation_history    — full current-session messages fed to the LLM.
                              Starts empty each session; never trimmed — Lila
                              always receives the complete current session.
    current_session_history — identical content; kept as a separate list so
                              DB persistence at session end is decoupled from
                              the LLM context list.
    user_imprints           — Tier 3 points loaded at session start, always
                              injected into the system prompt.
    """
    conversation_history.append({"role": "user", "content": user_input})
    current_session_history.append({"role": "user", "content": user_input})
    # No trim — Lila always receives the full current-session history.
    # Llama 4 Scout has a 10M token context window; a single voice session
    # will never approach that limit.

    # ── Build system prompt ───────────────────────────────────────────────────
    system_prompt = LILA_SYSTEM_PROMPT

    # Tier 3: ALWAYS inject imprints (points) if they exist
    if user_imprints:
        points_text = "\n".join(
            f"- {p.get('type', '')} {p.get('point', '')}"
            for p in user_imprints
        )
        system_prompt += (
            "\n\n[What you know about this person — treat as implicit "
            "background, do not reference directly unless it naturally "
            "comes up]:\n" + points_text
        )

    # Tier 2: inject memory ONLY when the user's words trigger recall
    needs_memory = any(kw in user_input.lower() for kw in _MEMORY_KEYWORDS)
    if needs_memory and google_id:
        memories_text = await get_all_memories_text(google_id)
        if memories_text:
            system_prompt += (
                f"\n\n[Your memory of past conversations]:\n"
                f"{memories_text}"
            )

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

        # Append assistant turn to both history lists (RAM only — no DB write)
        conversation_history.append({"role": "assistant", "content": full_response.strip()})
        current_session_history.append({"role": "assistant", "content": full_response.strip()})
        print(f"\n💬 Turn complete ({len(current_session_history)} messages this session)")

    except asyncio.CancelledError:
        print("\n🛑 LLM response cancelled (barge-in)")
        await websocket.send_text(json.dumps({"response": "[interrupted]"}))
        raise

    except Exception as e:
        print(f"\n❌ LLM error: {e}")
        await websocket.send_text(json.dumps({"response": "Sorry, I had a glitch."}))
