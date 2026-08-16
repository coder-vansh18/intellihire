import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.models.test import Test
    from app.models.user import User
    from app.models.batch import Batch

class TestAssignment(SQLModel, table=True):
    __tablename__ = "test_assignments"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    test_id: uuid.UUID = Field(foreign_key="tests.id", index=True, nullable=False)
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id", index=True)
    batch_id: Optional[uuid.UUID] = Field(default=None, foreign_key="batches.id", index=True)
    
    # Branch, Year & Section assignment filters
    branch: Optional[str] = Field(default=None, index=True)
    year: Optional[str] = Field(default=None, index=True)
    section: Optional[str] = Field(default=None, index=True)
    
    assigned_at: datetime = Field(default_factory=datetime.utcnow)

    test: "Test" = Relationship(back_populates="assignments")
    user: Optional["User"] = Relationship(back_populates="assignments")
    batch: Optional["Batch"] = Relationship(back_populates="assignments")
