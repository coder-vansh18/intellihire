import uuid
from datetime import datetime
from typing import List, Dict, Any, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, JSON, Column

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.test import Test

class QuizProgress(SQLModel, table=True):
    __tablename__ = "quiz_progress"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, nullable=False)
    test_id: uuid.UUID = Field(foreign_key="tests.id", index=True, nullable=False)
    
    started_at: datetime = Field(default_factory=datetime.utcnow)
    last_saved_at: datetime = Field(default_factory=datetime.utcnow)
    
    answers: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    
    randomized_question_ids: List[str] = Field(sa_column=Column(JSON, nullable=False))
    randomized_options_map: Dict[str, List[int]] = Field(sa_column=Column(JSON, nullable=False))
    
    tab_switch_count: int = Field(default=0, nullable=False)
    fullscreen_exit_count: int = Field(default=0, nullable=False)
    paste_count: int = Field(default=0, nullable=False)

    user: "User" = Relationship(back_populates="progress")
    test: "Test" = Relationship(back_populates="progress_sessions")
