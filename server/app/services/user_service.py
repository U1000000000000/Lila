"""
User service for MongoDB operations (Google OAuth only).
"""
import app.db.mongodb as mongodb
from app.models.user import User
from datetime import datetime

async def create_or_update_user(email: str, name: str, picture: str = None) -> User:
    db = mongodb.db
    # Try to find user by email
    doc = await db["users"].find_one({"email": email})
    if doc:
        # Update last_login and picture
        await db["users"].update_one({"email": email}, {"$set": {"last_login": datetime.utcnow(), "picture": picture}})
        doc = await db["users"].find_one({"email": email})
        doc.pop("_id", None)
        return User(**doc)
    # Create new user
    google_id = email  # Use email as unique id if google_id not provided
    user = User(google_id=google_id, email=email, name=name, picture=picture, created_at=datetime.utcnow(), last_login=datetime.utcnow())
    await db["users"].insert_one(user.model_dump())
    return user
