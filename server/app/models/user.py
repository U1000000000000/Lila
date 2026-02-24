
"""
User model for MongoDB (Atlas) — Google OAuth only.
No password fields, only Google identity info.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class User(BaseModel):
	google_id: str = Field(..., description="Google unique user id")
	email: EmailStr
	name: str
	picture: Optional[str] = None
	created_at: datetime = Field(default_factory=datetime.utcnow)
	last_login: Optional[datetime] = None

	model_config = {"from_attributes": True}
