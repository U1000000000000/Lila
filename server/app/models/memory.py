
"""
Memory model for MongoDB (Atlas).
Represents compressed long-term + short-term memory for a user.
"""
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

class MemoryFact(BaseModel):
    text: str
    source_messages: list
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserMemory(BaseModel):
    google_id: str = Field(..., description="Google unique user id")
    long_term_summary: str = ""
    recent_summaries: List[MemoryFact] = []
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"from_attributes": True}
