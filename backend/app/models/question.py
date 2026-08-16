import uuid
from typing import List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, JSON, Column

if TYPE_CHECKING:
    from app.models.test import Test

class Question(SQLModel, table=True):
    __tablename__ = "questions"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    test_id: uuid.UUID = Field(foreign_key="tests.id", index=True, nullable=False)
    question_text: str = Field(nullable=False)
    
    options: List[str] = Field(sa_column=Column(JSON, nullable=False))
    correct_option_index: int = Field(nullable=False)

    test: "Test" = Relationship(back_populates="questions")
