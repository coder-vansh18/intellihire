import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
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
        userEmail=user.email if user else "",
        userBranch=user.branch if user else None,
        userYear=user.year if user else None,
        userSection=user.section if user else None,
        userRollNumber=user.roll_number if user else None,
        testId={"_id": str(r.test_id), "title": test.title if test else "Test"},
        score=r.score,
        total=r.total,
        duration_seconds=r.duration_seconds or 0,
        createdAt=r.created_at.isoformat(),
        tab_switch_count=r.tab_switch_count,
        tab_switches=r.tab_switch_count,
        fullscreen_exit_count=r.fullscreen_exit_count,
        paste_count=r.paste_count,
        disqualified=r.disqualified,
        metrics=r.metrics or []
    )

@router.get("/test/results", response_model=List[ResultOut])
@router.get("/results", response_model=List[ResultOut])
def get_all_results(
    test_id: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    db: Session = Depends(get_session)
):
    query = select(Result).order_by(Result.created_at.desc())

    if test_id:
        try:
            t_uuid = uuid.UUID(test_id)
            query = query.where(Result.test_id == t_uuid)
        except ValueError:
            pass

    results = db.exec(query).all()
    formatted = [format_result(r, db) for r in results]

    # Filter in-memory if branch/year/section query params passed
    if branch:
        formatted = [r for r in formatted if (r.userBranch or "").lower() == branch.lower()]
    if year:
        formatted = [r for r in formatted if (r.userYear or "").lower() == year.lower()]
    if section:
        formatted = [r for r in formatted if (r.userSection or "").lower() == section.lower()]

    return formatted

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
        "student_email": user.email if user else "",
        "student_branch": user.branch if user else None,
        "student_year": user.year if user else None,
        "student_section": user.section if user else None,
        "student_roll_number": user.roll_number if user else None,
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
