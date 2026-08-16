import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.assignment import TestAssignment

class UserBatchLink(SQLModel, table=True):
    __tablename__ = "user_batch_links"
    
    user_id: uuid.UUID = Field(foreign_key="users.id", primary_key=True)
    batch_id: uuid.UUID = Field(foreign_key="batches.id", primary_key=True)
    assigned_at: datetime = Field(default_factory=datetime.utcnow)

class Batch(SQLModel, table=True):
    __tablename__ = "batches"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True, nullable=False) # e.g., "CS-2026", "Section A"
    description: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    users: List["User"] = Relationship(back_populates="batches", link_model=UserBatchLink)
    assignments: List["TestAssignment"] = Relationship(back_populates="batch", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
