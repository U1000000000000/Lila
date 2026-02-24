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
    """
    db = mongodb.db
    doc = await db["users"].find_one({"google_id": google_id})
    if doc:
        await db["users"].update_one(
            {"google_id": google_id},
            {"$set": {"last_login": datetime.utcnow(), "picture": picture, "email": email, "name": name}},
        )
        doc = await db["users"].find_one({"google_id": google_id})
        doc.pop("_id", None)
        return User(**doc)
    # Create new user using the real Google sub ID
    user = User(
        google_id=google_id,
        email=email,
        name=name,
        picture=picture,
        created_at=datetime.utcnow(),
        last_login=datetime.utcnow(),
    )
    await db["users"].insert_one(user.model_dump())
    return user
