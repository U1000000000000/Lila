
"""
MongoDB connection manager for FastAPI using Motor (Atlas ready).
Usage:
    from app.db.mongodb import db
    users = db["users"]
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING
from app.core.config import settings

client: AsyncIOMotorClient | None = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    # Ensure indexes for production best practices
    await db["users"].create_index("google_id", unique=True)
    await db["users"].create_index("email", unique=True)
    # Memories collection — Tier 2 per-session summaries
    await db["memories"].create_index(
        [("google_id", ASCENDING), ("session_id", ASCENDING)],
        unique=True,
    )
    await db["memories"].create_index([("google_id", ASCENDING), ("created_at", DESCENDING)])
    # Per-session documents: unique on (google_id, session_id); sorted by started_at
    await db["conversations"].create_index(
        [("google_id", ASCENDING), ("session_id", ASCENDING)],
        unique=True,
    )
    await db["conversations"].create_index([("google_id", ASCENDING), ("started_at", DESCENDING)])
    # Analyses collection — one document per session, fast per-user date-sorted queries
    await db["analyses"].create_index(
        [("session_id", ASCENDING)],
        unique=True,
    )
    await db["analyses"].create_index([("google_id", ASCENDING), ("analysed_at", DESCENDING)])
    # Compound index covering google_id + status + analysed_at in a single scan.
    # The previous separate (google_id, status) index has been superseded by this
    # one: MongoDB can use a compound index to satisfy prefix queries, so this
    # single index covers (google_id), (google_id+status), and all three fields.
    # The dashboard query filters status="completed" and sorts by analysed_at,
    # so this compound index resolves it without a collection scan.
    await db["analyses"].create_index(
        [("google_id", ASCENDING), ("status", ASCENDING), ("analysed_at", DESCENDING)],
        name="analyses_user_status_date",
    )
    # Imprints collection — Tier 3 stable facts, one doc per user
    await db["imprints"].create_index("google_id", unique=True)
    print("✅ MongoDB connected and indexes ensured")

async def close_db():
    global client
    if client:
        client.close()
        print("🔌 MongoDB disconnected")