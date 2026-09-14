import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.test import Test

class Organization(SQLModel, table=True):
    __tablename__ = "organizations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(nullable=False, index=True) # e.g. "Swami Keshvanand Institute of Technology"
    code: str = Field(nullable=False, unique=True, index=True) # e.g. "SKIT"
    domain: str = Field(nullable=False, index=True) # e.g. "skit.ac.in"
    is_active: bool = Field(default=True, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    users: List["User"] = Relationship(back_populates="organization", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    tests: List["Test"] = Relationship(back_populates="organization", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
