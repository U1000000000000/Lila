"""
FastAPI application factory.
Registers all routers and middleware here.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import ws as ws_routes
from app.api.v1 import auth as auth_routes
from app.api.v1 import users as user_routes
from app.api.v1 import memory as memory_routes
from app.api.v1 import analysis as analysis_routes
from app.middleware.auth_middleware import AuthMiddleware
from app.core.config import settings
from app.db.mongodb import connect_db, close_db


# ── Lifecycle ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Server starting up...")
    await connect_db()
    yield
    print("💾 Server shutting down — saving state...")
    await close_db()


app = FastAPI(
    title="AI Voice Companion",
    description="Voice-first AI companion backend",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(ws_routes.router)                            # /ws  (WebSocket)
app.include_router(auth_routes.router,     prefix="/api/v1")   # /api/v1/auth
app.include_router(user_routes.router,     prefix="/api/v1")   # /api/v1/users
app.include_router(memory_routes.router,   prefix="/api/v1")   # /api/v1/memory
app.include_router(analysis_routes.router, prefix="/api/v1")   # /api/v1/analysis

# ── Middleware ───────────────────────────────────────────────────────────────
app.add_middleware(AuthMiddleware)
