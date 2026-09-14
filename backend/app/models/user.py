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
    from app.models.organization import Organization

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    organization_id: Optional[uuid.UUID] = Field(default=None, foreign_key="organizations.id", index=True, nullable=True)
    name: str = Field(nullable=False)
    email: str = Field(unique=True, index=True, nullable=False)
    password_hash: str = Field(nullable=False)
    role: str = Field(default="student", nullable=False) # "super_admin", "admin", "company"/"professor", "student"
    session_id: Optional[uuid.UUID] = Field(default=None, nullable=True) # Single-session JWT tracking
    must_change_password: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Academic & Profile Details (Branch, Year, Section, Roll No, Bio)
    branch: Optional[str] = Field(default=None, index=True, nullable=True) # e.g. "Computer Science"
    year: Optional[str] = Field(default=None, index=True, nullable=True)   # e.g. "3rd Year"
    section: Optional[str] = Field(default=None, index=True, nullable=True)# e.g. "Section A"
    roll_number: Optional[str] = Field(default=None, nullable=True)        # e.g. "2026CS101"
    bio: Optional[str] = Field(default=None, nullable=True)                # e.g. "Aspiring software developer"

    # Relationships
    organization: Optional["Organization"] = Relationship(back_populates="users")
    results: List["Result"] = Relationship(back_populates="user")
    created_tests: List["Test"] = Relationship(back_populates="creator")
    progress: List["QuizProgress"] = Relationship(back_populates="user")
    batches: List["Batch"] = Relationship(back_populates="users", link_model=UserBatchLink)
    assignments: List["TestAssignment"] = Relationship(back_populates="user")
