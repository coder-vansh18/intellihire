import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from app.models.batch import UserBatchLink

if TYPE_CHECKING:
    from app.models.test import Test
    from app.models.result import Result
    from app.models.progress import QuizProgress
    from app.models.batch import Batch
    from app.models.assignment import TestAssignment

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(nullable=False)
    email: str = Field(unique=True, index=True, nullable=False)
    password_hash: str = Field(nullable=False)
    role: str = Field(default="student", nullable=False) # "student" or "company" / "professor"
    session_id: Optional[uuid.UUID] = Field(default=None, nullable=True) # Single-session JWT tracking
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Academic & Profile Details (Branch, Year, Section, Roll No, Bio)
    branch: Optional[str] = Field(default=None, index=True, nullable=True) # e.g. "Computer Science"
    year: Optional[str] = Field(default=None, index=True, nullable=True)   # e.g. "3rd Year"
    section: Optional[str] = Field(default=None, index=True, nullable=True)# e.g. "Section A"
    roll_number: Optional[str] = Field(default=None, nullable=True)        # e.g. "2026CS101"
    bio: Optional[str] = Field(default=None, nullable=True)                # e.g. "Aspiring software developer"

    results: List["Result"] = Relationship(back_populates="user")
    created_tests: List["Test"] = Relationship(back_populates="creator")
    progress: List["QuizProgress"] = Relationship(back_populates="user")
    batches: List["Batch"] = Relationship(back_populates="users", link_model=UserBatchLink)
    assignments: List["TestAssignment"] = Relationship(back_populates="user")
