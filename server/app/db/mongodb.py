
"""
MongoDB connection manager for FastAPI using Motor (Atlas ready).
Usage:
    from app.db.mongodb import db
    users = db["users"]
"""
from motor.motor_asyncio import AsyncIOMotorClient
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
    await db["memories"].create_index("google_id", unique=True)
    await db["conversations"].create_index("google_id", unique=True)
    print("✅ MongoDB connected and indexes ensured")

async def close_db():
    global client
    if client:
        client.close()
        print("🔌 MongoDB disconnected")
