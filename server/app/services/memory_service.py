"""
Memory Service
--------------
In-memory + disk-backed conversation memory.
Future: swap load_memory / save_memory for MongoDB calls.

Tiers:
  - conversation_history  : live sliding window (RAM)
  - summarized_facts      : recent session summaries (RAM → MongoDB)
  - long_term_memory      : compressed paragraph (RAM → MongoDB)
"""
import json
import time
from collections import deque
from threading import Thread

from groq import Groq
from app.core.config import settings

groq_client = Groq()

# ── Global State ──────────────────────────────────────────────────────────────
summarization_queue: deque = deque()
summarized_facts: list[str] = []
long_term_memory: str = ""
message_counter: int = 0


# ── Disk I/O (local fallback – will be replaced by MongoDB) ───────────────────
def load_memory() -> list:
    """Load conversation history from disk (local fallback)."""
    try:
        import os
        if not os.path.exists(settings.MEMORY_FILE) or os.path.getsize(settings.MEMORY_FILE) == 0:
            return []
        with open(settings.MEMORY_FILE, "r") as f:
            data = json.load(f)
        return data[-settings.CONVERSATION_WINDOW:] if isinstance(data, list) else []
    except Exception as e:
        print(f"❌ Memory load error: {e}")
        return []


def save_memory(data: list) -> None:
    """Persist conversation history to disk (local fallback)."""
    try:
        with open(settings.MEMORY_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"❌ Memory save error: {e}")


# ── Summarization ─────────────────────────────────────────────────────────────
def summarize_conversation_chunk(messages: list) -> str:
    """Summarise a chunk of old messages into a short paragraph of key facts."""
    try:
        context = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
        prompt = [
            {"role": "system", "content": (
                "Summarize this conversation between user and assistant. "
                "Extract key facts about BOTH the user AND what the assistant discussed. "
                "Include: user's preferences, personal details, topics discussed, assistant's responses. "
                "Format as a concise paragraph (max 3-4 sentences). "
                "If nothing important, return 'casual small talk'."
            )},
            {"role": "user", "content": context},
        ]
        response = groq_client.chat.completions.create(
            messages=prompt,
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=150,
            stream=False,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"❌ Chunk summarisation error: {e}")
        return "conversation summary failed"


def compress_summaries(old_summaries: list[str]) -> str:
    """Compress multiple summaries into a single long-term memory paragraph."""
    try:
        if not old_summaries:
            return ""
        combined = "\n".join(old_summaries)
        prompt = [
            {"role": "system", "content": (
                "You are compressing multiple conversation summaries into one concise long-term memory. "
                "Combine and deduplicate information. Keep the most important facts. "
                "Format as a single paragraph (max 5-6 sentences). "
                "Focus on: user's identity, preferences, important life details, conversation themes."
            )},
            {"role": "user", "content": f"Compress these summaries:\n\n{combined}"},
        ]
        response = groq_client.chat.completions.create(
            messages=prompt,
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=200,
            stream=False,
        )
        compressed = response.choices[0].message.content.strip()
        print(f"🗜️ Compressed {len(old_summaries)} summaries into long-term memory")
        return compressed
    except Exception as e:
        print(f"❌ Compression error: {e}")
        return ""


# ── Background Summariser Thread ──────────────────────────────────────────────
def _background_summarizer() -> None:
    """Daemon thread: drains summarization_queue and manages memory tiers."""
    global long_term_memory

    while True:
        try:
            if summarization_queue:
                chunk = summarization_queue.popleft()
                summary = summarize_conversation_chunk(chunk)
                summarized_facts.append(summary)
                print(f"📚 Background: summarised {len(chunk)} messages")

                # Compress when we accumulate too many summaries
                if len(summarized_facts) > 10:
                    print("🗜️ Compressing old summaries into long-term memory...")
                    old = summarized_facts[:-3]
                    long_term_memory = compress_summaries(old)
                    summarized_facts[:] = summarized_facts[-3:]
                    print(f"✅ Compressed — long-term memory updated, {len(summarized_facts)} recent summaries kept")

            time.sleep(2)
        except Exception as e:
            print(f"❌ Background summariser error: {e}")
            time.sleep(5)


# Start daemon on import
_summarizer_thread = Thread(target=_background_summarizer, daemon=True)
_summarizer_thread.start()
