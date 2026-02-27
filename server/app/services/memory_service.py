"""
Memory Service
--------------
In-memory + disk-backed conversation memory.
Future: swap load_memory / save_memory for MongoDB calls.

Tiers:
  - conversation_history  : live sliding window (RAM)
  - summarized_facts      : recent session summaries (RAM → MongoDB)
  - long_term_memory      : compressed paragraph (RAM → MongoDB)

NOTE: This module is superseded by memory_mongo_service.py for production use.
It is retained as a local-fallback / testing path.  All mutable state is now
scoped to individual users via UserMemoryState so that sessions never bleed
into each other.
"""
import json
import time
from collections import deque
from dataclasses import dataclass, field
from threading import Lock, Thread
from typing import Dict

from groq import Groq
from app.core.config import settings

groq_client = Groq()


# ── Per-user State ────────────────────────────────────────────────────────────

@dataclass
class UserMemoryState:
    """Holds all mutable memory for a single user.  Never shared between users."""
    summarization_queue: deque = field(default_factory=deque)
    summarized_facts: list = field(default_factory=list)
    long_term_memory: str = ""
    message_counter: int = 0


# Registry: google_id → UserMemoryState
_user_memory_store: Dict[str, UserMemoryState] = {}
_store_lock: Lock = Lock()


def _get_user_state(google_id: str) -> UserMemoryState:
    """Return (or lazily create) the UserMemoryState for *google_id*."""
    with _store_lock:
        if google_id not in _user_memory_store:
            _user_memory_store[google_id] = UserMemoryState()
        return _user_memory_store[google_id]


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
            model="meta-llama/llama-4-scout-17b-16e-instruct",
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
            model="meta-llama/llama-4-scout-17b-16e-instruct",
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


# ── Public helpers that callers use to enqueue work ──────────────────────────

def enqueue_summarization(google_id: str, messages: list) -> None:
    """Enqueue a chunk of messages for background summarisation for *google_id*."""
    state = _get_user_state(google_id)
    state.summarization_queue.append(messages)


def get_user_memory_snapshot(google_id: str) -> dict:
    """Return a read-only snapshot of the current in-memory state for *google_id*."""
    state = _get_user_state(google_id)
    return {
        "summarized_facts": list(state.summarized_facts),
        "long_term_memory": state.long_term_memory,
        "message_counter": state.message_counter,
    }


# ── Background Summariser Thread ──────────────────────────────────────────────

def _background_summarizer() -> None:
    """
    Daemon thread: drains each user's summarization_queue and manages their
    memory tiers independently.  State is read from and written to the
    per-user UserMemoryState objects — never to module-level globals.
    """
    while True:
        try:
            # Snapshot user IDs to avoid holding the lock while doing I/O
            with _store_lock:
                user_ids = list(_user_memory_store.keys())

            for google_id in user_ids:
                state = _user_memory_store.get(google_id)
                if state is None or not state.summarization_queue:
                    continue

                chunk = state.summarization_queue.popleft()
                summary = summarize_conversation_chunk(chunk)
                state.summarized_facts.append(summary)
                print(f"📚 [{google_id}] Background: summarised {len(chunk)} messages")

                # Compress when we accumulate too many summaries
                if len(state.summarized_facts) > 10:
                    print(f"🗜️ [{google_id}] Compressing old summaries into long-term memory…")
                    old = state.summarized_facts[:-3]
                    state.long_term_memory = compress_summaries(old)
                    state.summarized_facts = state.summarized_facts[-3:]
                    print(
                        f"✅ [{google_id}] Compressed — long-term memory updated, "
                        f"{len(state.summarized_facts)} recent summaries kept"
                    )

            time.sleep(2)
        except Exception as e:
            print(f"❌ Background summariser error: {e}")
            time.sleep(5)


# Start daemon on import
_summarizer_thread = Thread(target=_background_summarizer, daemon=True)
_summarizer_thread.start()
