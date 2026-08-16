from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class ResultOut(BaseModel):
    id: str
    userId: str
    userName: str
    testId: Optional[Dict[str, Any]] = None
    score: int
    total: int
    createdAt: str
    tab_switch_count: Optional[int] = 0
    tab_switches: Optional[int] = 0 # Requirement 1 metric for dashboard
    fullscreen_exit_count: Optional[int] = 0
    paste_count: Optional[int] = 0
    disqualified: Optional[bool] = False
    metrics: Optional[List[Dict[str, Any]]] = []
