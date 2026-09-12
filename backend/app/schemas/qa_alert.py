from typing import Optional
from pydantic import BaseModel

class QAAlertCreate(BaseModel):
    question_id: Optional[str] = None
    question_number: Optional[int] = 1
    question_text: str
    issue_type: Optional[str] = "Spelling Mistake"
    mistake_description: str # specific mistake details

class QAAlertOut(BaseModel):
    id: str
    test_id: str
    test_title: Optional[str] = None
    question_id: Optional[str] = None
    question_number: Optional[int] = 1
    question_text: str
    student_id: Optional[str] = None
    student_name: str
    student_email: Optional[str] = None
    issue_type: str
    mistake_description: str
    formatted_message: str
    status: str
    created_at: str

class QAAlertStatusUpdate(BaseModel):
    status: str # "reviewed", "resolved", "pending"
