import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, JSON, Column

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.test import Test

class Result(SQLModel, table=True):
    __tablename__ = "results"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id", index=True, nullable=True)
    test_id: uuid.UUID = Field(foreign_key="tests.id", index=True, nullable=False)
    
    score: int = Field(nullable=False)
    total: int = Field(nullable=False)
    duration_seconds: int = Field(nullable=False, default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    metrics: List[Dict[str, Any]] = Field(sa_column=Column(JSON, nullable=False))
    
    tab_switch_count: int = Field(default=0, nullable=False)
    fullscreen_exit_count: int = Field(default=0, nullable=False)
    paste_count: int = Field(default=0, nullable=False)
    disqualified: bool = Field(default=False, nullable=False)

    user: Optional["User"] = Relationship(back_populates="results")
    test: "Test" = Relationship(back_populates="results")
