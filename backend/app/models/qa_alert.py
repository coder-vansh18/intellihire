import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.models.test import Test
    from app.models.user import User

class QuestionAlert(SQLModel, table=True):
    __tablename__ = "question_alerts"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    test_id: uuid.UUID = Field(foreign_key="tests.id", nullable=False)
    question_id: Optional[uuid.UUID] = Field(default=None, foreign_key="questions.id", nullable=True)
    question_number: Optional[int] = Field(default=1, nullable=True)
    question_text: str = Field(nullable=False)
    
    student_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id", nullable=True)
    student_name: str = Field(default="Anonymous Student", nullable=False)
    student_email: Optional[str] = Field(default=None, nullable=True)
    
    issue_type: str = Field(default="Spelling Mistake", nullable=False)
    mistake_description: str = Field(nullable=False)
    formatted_message: str = Field(nullable=False)
    status: str = Field(default="pending", nullable=False) # pending, reviewed, resolved
    created_at: datetime = Field(default_factory=datetime.utcnow)

    test: Optional["Test"] = Relationship(back_populates="qa_alerts")
    student: Optional["User"] = Relationship()
