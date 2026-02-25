"""
Centralised configuration — all environment variables live here.
Import `settings` from anywhere in the app.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the server/ directory
load_dotenv(dotenv_path=Path(__file__).parent.parent.parent / ".env")


class Settings:
    # ── External APIs ──────────────────────────────────────────────────────────
    DEEPGRAM_API_KEY: str = os.environ.get("DEEPGRAM_API_KEY", "")
    DEEPGRAM_STT_URL: str = os.environ.get("DEEPGRAM_STT_URL", "")
    DEEPGRAM_TTS_URL: str = os.environ.get("DEEPGRAM_TTS_URL", "")
    GROQ_API_KEY: str = os.environ.get("GROQ_API_KEY", "")

    # ── Database ───────────────────────────────────────────────────────────────
    MONGODB_URL: str = os.environ.get("MONGODB_URL", "")
    MONGODB_DB_NAME: str = os.environ.get("MONGODB_DB_NAME", "appdb")

    # ── Auth ───────────────────────────────────────────────────────────────────
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "change-me-in-production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # ── Server ─────────────────────────────────────────────────────────────────
    PORT: int = int(os.environ.get("PORT", 8000))
    MAX_CONCURRENT_CONNECTIONS: int = int(os.environ.get("MAX_CONCURRENT_CONNECTIONS", 10))
    CORS_ORIGINS: list[str] = [
        origin.strip() for origin in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
    ]
    FRONTEND_URL: str = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    GOOGLE_REDIRECT_URI: str = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/google/callback")
    
    # ── Memory / Conversation ──────────────────────────────────────────────────
    CONVERSATION_WINDOW: int = 15    # sliding window — last N messages kept hot
    SAVE_INTERVAL: int = 5           # persist to DB every N messages
    MEMORY_FILE: str = str(Path(__file__).parent.parent.parent / "memory.json")  # local fallback


settings = Settings()

# Push Groq key into env so the Groq SDK picks it up automatically
os.environ["GROQ_API_KEY"] = settings.GROQ_API_KEY
