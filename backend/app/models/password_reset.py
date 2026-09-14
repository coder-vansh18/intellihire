import uuid
from datetime import datetime, timedelta
from typing import Optional
from sqlmodel import SQLModel, Field

class PasswordResetToken(SQLModel, table=True):
    __tablename__ = "password_resets"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, nullable=False)
    token: str = Field(nullable=False, index=True)
    expires_at: datetime = Field(nullable=False)
    is_used: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
