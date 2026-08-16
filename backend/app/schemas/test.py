from typing import List, Optional
from pydantic import BaseModel

class QuestionCreate(BaseModel):
    question: str
    options: List[str]
    correct: int

class QuestionOut(BaseModel):
    id: str
    question: str
    options: List[str]
    correct: Optional[int] = None

class TestCreate(BaseModel):
    title: str
    duration_minutes: Optional[int] = 60
    is_public: Optional[bool] = False
    questions: List[QuestionCreate]

class TestOut(BaseModel):
    id: str
    _id: str
    title: str
    duration_minutes: int
    is_public: bool
    questions: List[QuestionOut]
    createdAt: str

class TestAssignPayload(BaseModel):
    user_id: Optional[str] = None # Individual assignment
    batch_id: Optional[str] = None # Group batch assignment
    branch: Optional[str] = None   # Branch assignment (e.g. "Computer Science")
    year: Optional[str] = None     # Year assignment (e.g. "3rd Year")
    section: Optional[str] = None  # Section assignment (e.g. "Section A")

class BatchCreatePayload(BaseModel):
    name: str
    description: Optional[str] = None
    user_ids: Optional[List[str]] = []
