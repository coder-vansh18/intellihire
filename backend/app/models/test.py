import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.question import Question
    from app.models.result import Result
    from app.models.progress import QuizProgress
    from app.models.assignment import TestAssignment
    from app.models.qa_alert import QuestionAlert
    from app.models.organization import Organization

class Test(SQLModel, table=True):
    __tablename__ = "tests"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    organization_id: Optional[uuid.UUID] = Field(default=None, foreign_key="organizations.id", index=True, nullable=True)
    title: str = Field(nullable=False)
    duration_minutes: int = Field(default=60, nullable=False)
    is_public: bool = Field(default=False, nullable=False)
    expires_at: Optional[datetime] = Field(default=None, nullable=True)
    created_by_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    organization: Optional["Organization"] = Relationship(back_populates="tests")
    creator: Optional["User"] = Relationship(back_populates="created_tests")
    questions: List["Question"] = Relationship(back_populates="test", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    results: List["Result"] = Relationship(back_populates="test", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    progress_sessions: List["QuizProgress"] = Relationship(back_populates="test", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    assignments: List["TestAssignment"] = Relationship(back_populates="test", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    qa_alerts: List["QuestionAlert"] = Relationship(back_populates="test", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
