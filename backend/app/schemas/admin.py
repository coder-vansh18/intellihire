from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class AdminUserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str # "student" or "company" (professor) or "admin"
    branch: Optional[str] = None
    year: Optional[str] = None
    section: Optional[str] = None
    roll_number: Optional[str] = None
    bio: Optional[str] = None

class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[str] = None
    section: Optional[str] = None
    roll_number: Optional[str] = None
    bio: Optional[str] = None

class AdminUserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    organization_domain: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[str] = None
    section: Optional[str] = None
    roll_number: Optional[str] = None
    bio: Optional[str] = None
    created_at: str
    tests_attempted: Optional[int] = 0
    average_score_percent: Optional[float] = 0.0
    tests_created: Optional[int] = 0

class IndividualTestAttempt(BaseModel):
    result_id: str
    test_id: str
    test_title: str
    score: int
    total: int
    accuracy: float
    tab_switch_count: int
    fullscreen_exit_count: int
    paste_count: int
    disqualified: bool
    duration_seconds: Optional[int] = 0
    submitted_at: str

class IndividualStudentReport(BaseModel):
    user: AdminUserOut
    total_tests_attempted: int
    average_score_percent: float
    total_clean_attempts: int
    total_disqualified_attempts: int
    attempts: List[IndividualTestAttempt]

class AdminAnalyticsOverview(BaseModel):
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    organization_code: Optional[str] = None
    organization_domain: Optional[str] = None
    total_users: int
    total_students: int
    total_professors: int
    total_tests: int
    total_submissions: int
    average_organization_accuracy: float
    total_qa_alerts: int
    total_flagged_sessions: int
