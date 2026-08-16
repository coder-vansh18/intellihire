import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import Result, Test, User
from app.schemas import ResultOut

router = APIRouter(prefix="/api", tags=["Results"])

def format_result(r: Result, db: Session) -> ResultOut:
    user = db.get(User, r.user_id)
    test = db.get(Test, r.test_id)
    
    return ResultOut(
        id=str(r.id),
        userId=str(r.user_id),
        userName=user.name if user else "Student",
        testId={"_id": str(r.test_id), "title": test.title if test else "Test"},
        score=r.score,
        total=r.total,
        createdAt=r.created_at.isoformat(),
        tab_switch_count=r.tab_switch_count,
        tab_switches=r.tab_switch_count, # Requirement 1 metric
        fullscreen_exit_count=r.fullscreen_exit_count,
        paste_count=r.paste_count,
        disqualified=r.disqualified,
        metrics=r.metrics
    )

@router.get("/test/results", response_model=List[ResultOut])
@router.get("/results", response_model=List[ResultOut])
def get_all_results(db: Session = Depends(get_session)):
    results = db.exec(select(Result).order_by(Result.created_at.desc())).all()
    return [format_result(r, db) for r in results]

@router.get("/results/student/{student_id}", response_model=List[ResultOut])
def get_student_results(student_id: str, db: Session = Depends(get_session)):
    try:
        u_uuid = uuid.UUID(student_id)
    except ValueError:
        return []
    
    results = db.exec(
        select(Result)
        .where(Result.user_id == u_uuid)
        .order_by(Result.created_at.desc())
    ).all()
    
    return [format_result(r, db) for r in results]

@router.get("/results/{id}/analytics")
def get_result_analytics(id: str, db: Session = Depends(get_session)):
    try:
        r_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid result ID")
    
    result = db.get(Result, r_uuid)
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    test = db.get(Test, result.test_id)
    user = db.get(User, result.user_id)

    accuracy_percentage = round((result.score / result.total) * 100, 2) if result.total > 0 else 0
    
    return {
        "result_id": str(result.id),
        "student_name": user.name if user else "Student",
        "test_title": test.title if test else "Test",
        "score": result.score,
        "total": result.total,
        "accuracy_percentage": accuracy_percentage,
        "duration_seconds": result.duration_seconds,
        "proctoring_summary": {
            "tab_switches": result.tab_switch_count,
            "tab_switch_count": result.tab_switch_count,
            "fullscreen_exit_count": result.fullscreen_exit_count,
            "paste_count": result.paste_count,
            "disqualified": result.disqualified
        },
        "metrics": result.metrics
    }
