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
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL")
    if not GEMINI_MODEL:
        raise RuntimeError("GEMINI_MODEL environment variable is required and missing. Application will not start.")

    # ── Google OAuth ───────────────────────────────────────────────────────────
    GOOGLE_CLIENT_ID: str = os.environ.get("GOOGLE_CLIENT_ID")
    if not GOOGLE_CLIENT_ID:
        raise RuntimeError("GOOGLE_CLIENT_ID environment variable is required and missing. Application will not start.")
    GOOGLE_CLIENT_SECRET: str = os.environ.get("GOOGLE_CLIENT_SECRET")
    if not GOOGLE_CLIENT_SECRET:
        raise RuntimeError("GOOGLE_CLIENT_SECRET environment variable is required and missing. Application will not start.")

    # ── Database ───────────────────────────────────────────────────────────────
    MONGODB_URL: str = os.environ.get("MONGODB_URL", "")
    MONGODB_DB_NAME: str = os.environ.get("MONGODB_DB_NAME", "appdb")

    # ── Auth ───────────────────────────────────────────────────────────────────
    JWT_SECRET: str = os.environ.get("JWT_SECRET")
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET environment variable is required and missing. Application will not start.")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # ── Environment mode ───────────────────────────────────────────────────────
    # Set APP_ENV=production in your deployment environment to activate
    # production URLs.  Everything else defaults to local development.
    APP_ENV: str = os.environ.get("APP_ENV", "development")  # "development" | "production"

    # ── Canonical URLs (all four defined in .env — APP_ENV picks the pair) ────
    _FRONTEND_URL_LOCAL: str = os.environ.get("FRONTEND_URL_LOCAL", "http://localhost:5173")
    _FRONTEND_URL_PROD: str  = os.environ.get("FRONTEND_URL", "https://lilakreis.vercel.app")
    _BACKEND_URL_LOCAL: str  = os.environ.get("BACKEND_URL_LOCAL", "http://localhost:8000")
    _BACKEND_URL_PROD: str   = os.environ.get("BACKEND_URL", "https://lila.zeabur.app")

    # Active URLs — determined solely by APP_ENV, no manual toggling needed.
    FRONTEND_URL: str = _FRONTEND_URL_PROD if APP_ENV == "production" else _FRONTEND_URL_LOCAL
    BACKEND_URL: str  = _BACKEND_URL_PROD  if APP_ENV == "production" else _BACKEND_URL_LOCAL

    # ── Server ─────────────────────────────────────────────────────────────────
    PORT: int = int(os.environ.get("PORT", 8000))
    MAX_CONCURRENT_CONNECTIONS: int = int(os.environ.get("MAX_CONCURRENT_CONNECTIONS", 10))

    # CORS: allow requests only from the active frontend origin.
    # Override by setting CORS_ORIGINS as a comma-separated list in .env
    # (e.g. for feature-branch preview URLs or extra staging domains).
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.environ.get("CORS_ORIGINS", "").split(",")
        if origin.strip()
    ] or [FRONTEND_URL]

    # Google OAuth callback — derived automatically; override only if needed.
    GOOGLE_REDIRECT_URI: str = os.environ.get(
        "GOOGLE_REDIRECT_URI",
        f"{BACKEND_URL}/api/v1/auth/google/callback",
    )
    
    # ── Memory / Conversation ──────────────────────────────────────────────────
    # No per-session window cap — Lila always receives the full current session.
    TIER2_MAX_TOKENS: int = 250      # approximate ceiling for memory prose
    TIER3_MAX_POINTS: int = 20       # max imprints per user


settings = Settings()

# Push Groq key into env so the Groq SDK picks it up automatically
os.environ["GROQ_API_KEY"] = settings.GROQ_API_KEY
