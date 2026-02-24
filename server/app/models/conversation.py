"""
Conversation model – Pydantic + Beanie (placeholder).
Represents a full conversation session stored in MongoDB.
"""
# from beanie import Document
# from pydantic import BaseModel
# from datetime import datetime

# class Message(BaseModel):
#     role: str          # "user" | "assistant"
#     content: str
#     timestamp: datetime

# class Conversation(Document):
#     user_id: str
#     messages: list[Message]
#     created_at: datetime
#     updated_at: datetime
#
#     class Settings:
#         name = "conversations"
