"""
User service for MongoDB operations (Google OAuth only).
"""
import app.db.mongodb as mongodb
from app.models.user import User
from datetime import datetime


async def create_or_update_user(
    google_id: str,
    email: str,
    name: str,
    picture: str = None,
) -> User:
    """
    Upsert a user by their Google sub ID (the canonical unique identifier
    from Google's identity system, not their email which can change).
    Uses find_one_and_update for atomic upsert and returns the updated/new user.
    """
    db = mongodb.db
    now = datetime.utcnow()
    doc = await db["users"].find_one_and_update(
        {"google_id": google_id},
        {
            "$set": {
                "last_login": now,
                "picture": picture,
                "email": email,
                "name": name,
            },
            "$setOnInsert": {
                "created_at": now,
            },
        },
        upsert=True,
        return_document=True,
    )
    doc.pop("_id", None)
    return User(**doc)
