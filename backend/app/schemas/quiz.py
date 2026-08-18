from typing import Optional, Dict, Any
from pydantic import BaseModel

class ProgressUpdatePayload(BaseModel):
    answers: Dict[str, Any] = {}
    tab_switch_count: Optional[int] = 0
    tab_switches: Optional[int] = None # Requirement 1 support
    fullscreen_exit_count: Optional[int] = 0
    paste_count: Optional[int] = 0

class QuizSubmitPayload(BaseModel):
    userId: Optional[str] = None
    userName: Optional[str] = None
    testId: Optional[str] = None
    score: Optional[int] = None
    total: Optional[int] = None
    answers: Optional[Dict[str, Any]] = None
    tab_switch_count: Optional[int] = 0
    tab_switches: Optional[int] = None # Requirement 1 support
    fullscreen_exit_count: Optional[int] = 0
    paste_count: Optional[int] = 0
    disqualified: Optional[bool] = False
