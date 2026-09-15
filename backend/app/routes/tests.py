import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, or_
from app.db.session import get_session
from app.models import Test, Question, User, Batch, UserBatchLink, TestAssignment, Result, QuizProgress, QuestionAlert
from app.schemas import (
    TestCreate, TestUpdatePayload, TestOut, QuestionOut, 
    TestAssignPayload, BatchCreatePayload, QAAlertCreate, QAAlertOut, QAAlertStatusUpdate
)
from app.core.security import get_current_user

router = APIRouter(prefix="/api", tags=["Tests"])

def format_test_response(
    test: Test, 
    db: Optional[Session] = None, 
    user_id: Optional[uuid.UUID] = None
) -> TestOut:
    questions_out = [
        QuestionOut(
            id=str(q.id),
            question=q.question_text,
            options=q.options,
            correct=q.correct_option_index
        )
        for q in test.questions
    ]

    assignments_out = []
    qa_count = 0
    if db:
        assignments = db.exec(select(TestAssignment).where(TestAssignment.test_id == test.id)).all()
        for a in assignments:
            assignments_out.append({
                "id": str(a.id),
                "branch": a.branch,
                "year": a.year,
                "section": a.section,
                "user_id": str(a.user_id) if a.user_id else None,
                "batch_id": str(a.batch_id) if a.batch_id else None
            })
        
        alerts = db.exec(select(QuestionAlert).where(QuestionAlert.test_id == test.id)).all()
        qa_count = len(alerts)

    # Check Expiry with consistent UTC timezone
    is_expired = False
    expires_at_str = None
    if test.expires_at:
        raw_iso = test.expires_at.isoformat()
        expires_at_str = raw_iso if raw_iso.endswith("Z") else f"{raw_iso}Z"
        is_expired = datetime.utcnow() > test.expires_at

    # Check Completion Status for user
    is_completed = False
    result_data = None
    if db and user_id:
        result_record = db.exec(
            select(Result)
            .where(Result.user_id == user_id)
            .where(Result.test_id == test.id)
            .order_by(Result.created_at.desc())
        ).first()

        if result_record:
            is_completed = True
            result_data = {
                "id": str(result_record.id),
                "score": result_record.score,
                "total": result_record.total,
                "accuracy": round((result_record.score / result_record.total) * 100) if result_record.total else 0,
                "duration_seconds": result_record.duration_seconds,
                "tab_switch_count": result_record.tab_switch_count,
                "fullscreen_exit_count": result_record.fullscreen_exit_count,
                "paste_count": result_record.paste_count,
                "disqualified": result_record.disqualified,
                "submitted_at": result_record.created_at.isoformat()
            }

    return TestOut(
        id=str(test.id),
        _id=str(test.id),
        title=test.title,
        duration_minutes=test.duration_minutes,
        is_public=test.is_public,
        expires_at=expires_at_str,
        is_expired=is_expired,
        is_completed=is_completed,
        result=result_data,
        qa_alerts_count=qa_count,
        questions=questions_out,
        createdAt=test.created_at.isoformat(),
        assignments=assignments_out
    )

@router.post("/tests", response_model=dict, status_code=201)
@router.post("/test", response_model=dict, status_code=201)
def create_test(
    payload: TestCreate, 
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    if not payload.title or not payload.questions:
        raise HTTPException(status_code=400, detail="Title and questions required")
    
    expires_at_dt = None
    if payload.expires_at:
        try:
            clean_str = payload.expires_at.replace("Z", "+00:00")
            dt_parsed = datetime.fromisoformat(clean_str)
            if dt_parsed.tzinfo is not None:
                expires_at_dt = dt_parsed.astimezone(timezone.utc).replace(tzinfo=None)
            else:
                expires_at_dt = dt_parsed
        except Exception as e:
            print(f"Error parsing test expires_at datetime: {e}")
            expires_at_dt = None

    test = Test(
        organization_id=current_user.organization_id if current_user else None,
        title=payload.title,
        duration_minutes=payload.duration_minutes or 60,
        is_public=payload.is_public if payload.is_public is not None else False,
        expires_at=expires_at_dt,
        created_by_id=current_user.id if current_user else None
    )
    db.add(test)
    db.commit()
    db.refresh(test)
    
    for q_data in payload.questions:
        question = Question(
            test_id=test.id,
            question_text=q_data.question,
            options=q_data.options,
            correct_option_index=q_data.correct
        )
        db.add(question)
    
    db.commit()
    db.refresh(test)
    
    return {
        "message": "Test Created Successfully",
        "test": format_test_response(test, db, current_user.id if current_user else None)
    }

@router.put("/tests/{id}")
@router.put("/tests/{id}/expiry")
def update_test(
    id: str,
    payload: TestUpdatePayload,
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Update assessment title, duration, visibility, or expiry deadline"""
    try:
        test_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid test ID format")
    
    test = db.get(Test, test_uuid)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    if payload.title is not None and payload.title.strip():
        test.title = payload.title.strip()
    if payload.duration_minutes is not None:
        test.duration_minutes = payload.duration_minutes
    if payload.is_public is not None:
        test.is_public = payload.is_public

    if payload.expires_at is not None:
        if payload.expires_at == "" or payload.expires_at.lower() in ["null", "none"]:
            test.expires_at = None
        else:
            try:
                clean_str = payload.expires_at.replace("Z", "+00:00")
                dt_parsed = datetime.fromisoformat(clean_str)
                if dt_parsed.tzinfo is not None:
                    test.expires_at = dt_parsed.astimezone(timezone.utc).replace(tzinfo=None)
                else:
                    test.expires_at = dt_parsed
            except Exception as e:
                print(f"Error parsing updated expires_at: {e}")

    db.add(test)
    db.commit()
    db.refresh(test)

    return {
        "message": "Assessment updated successfully",
        "test": format_test_response(test, db, current_user.id if current_user else None)
    }

@router.get("/my-tests", response_model=List[TestOut])
def get_my_tests_management(
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Dedicated endpoint for professors and managers to view their own created assessments"""
    if not current_user:
        return []

    if current_user.role == "super_admin":
        tests = db.exec(select(Test).order_by(Test.created_at.desc())).all()
    else:
        tests = db.exec(
            select(Test)
            .where(Test.created_by_id == current_user.id)
            .order_by(Test.created_at.desc())
        ).all()

    user_id = current_user.id if current_user else None
    return [format_test_response(t, db, user_id) for t in tests]

@router.get("/tests", response_model=List[TestOut])
def get_all_tests(
    mode: Optional[str] = Query(None),
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    user_id = current_user.id if current_user else None

    # If explicitly requested in management mode, return assessments scoped to user
    if mode == "manage":
        if not current_user:
            return []
        if current_user.role == "super_admin":
            tests = db.exec(select(Test).order_by(Test.created_at.desc())).all()
        elif current_user.role == "admin":
            query = select(Test).order_by(Test.created_at.desc())
            if current_user.organization_id:
                query = query.where(Test.organization_id == current_user.organization_id)
            tests = db.exec(query).all()
        else:
            tests = db.exec(
                select(Test)
                .where(Test.created_by_id == current_user.id)
                .order_by(Test.created_at.desc())
            ).all()
        return [format_test_response(t, db, user_id) for t in tests]

    # 1. Student Role: View Public Practice Tests + Tests specifically assigned to Student's Branch/Year/Section/Batch
    if current_user and current_user.role == "student":
        student_batch_ids = db.exec(
            select(UserBatchLink.batch_id).where(UserBatchLink.user_id == current_user.id)
        ).all()

        conditions = [TestAssignment.user_id == current_user.id]
        if student_batch_ids:
            conditions.append(TestAssignment.batch_id.in_(student_batch_ids))
        if current_user.branch:
            conditions.append(TestAssignment.branch == current_user.branch)
        if current_user.year:
            conditions.append(TestAssignment.year == current_user.year)
        if current_user.section:
            conditions.append(TestAssignment.section == current_user.section)

        assigned_test_ids = db.exec(
            select(TestAssignment.test_id).where(or_(*conditions))
        ).all()

        if assigned_test_ids:
            query = select(Test).where(
                or_(
                    Test.is_public == True,
                    Test.id.in_(assigned_test_ids)
                )
            )
        else:
            query = select(Test).where(Test.is_public == True)

        if current_user.organization_id:
            query = query.where(or_(Test.organization_id == current_user.organization_id, Test.organization_id == None))
        
        tests = db.exec(query.order_by(Test.created_at.desc())).all()
        return [format_test_response(t, db, user_id) for t in tests]

    # 2. Professors / Companies / Admins: View assessments in their organization
    query = select(Test).order_by(Test.created_at.desc())
    if current_user and current_user.organization_id and current_user.role != "super_admin":
        query = query.where(or_(Test.organization_id == current_user.organization_id, Test.organization_id == None))

    tests = db.exec(query).all()
    return [format_test_response(t, db, user_id) for t in tests]

@router.get("/tests/{id}", response_model=TestOut)
def get_test(
    id: str, 
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        test_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid test ID format")
    
    test = db.get(Test, test_uuid)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    user_id = current_user.id if current_user else None
    return format_test_response(test, db, user_id)

@router.delete("/tests/{id}")
@router.delete("/test/{id}")
def delete_test(
    id: str, 
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        test_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid test ID format")
    
    test = db.get(Test, test_uuid)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    if current_user and current_user.role not in ["super_admin", "admin"]:
        if test.created_by_id and test.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only delete assessments created by you")
    
    # Clean up associated records
    results = db.exec(select(Result).where(Result.test_id == test.id)).all()
    for r in results:
        db.delete(r)

    progress_records = db.exec(select(QuizProgress).where(QuizProgress.test_id == test.id)).all()
    for p in progress_records:
        db.delete(p)

    assignments = db.exec(select(TestAssignment).where(TestAssignment.test_id == test.id)).all()
    for a in assignments:
        db.delete(a)

    alerts = db.exec(select(QuestionAlert).where(QuestionAlert.test_id == test.id)).all()
    for al in alerts:
        db.delete(al)

    questions = db.exec(select(Question).where(Question.test_id == test.id)).all()
    for q in questions:
        db.delete(q)

    db.delete(test)
    db.commit()
    return {"message": "Test deleted successfully"}

@router.post("/tests/{id}/assign", status_code=201)
def assign_test(
    id: str,
    payload: TestAssignPayload,
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        test_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid test ID format")
    
    test = db.get(Test, test_uuid)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    user_uuid = uuid.UUID(payload.user_id) if payload.user_id else None
    batch_uuid = uuid.UUID(payload.batch_id) if payload.batch_id else None

    if not user_uuid and not batch_uuid and not payload.branch and not payload.year and not payload.section:
        raise HTTPException(status_code=400, detail="Must provide user_id, batch_id, branch, year, or section to assign test")

    assignment = TestAssignment(
        test_id=test.id,
        user_id=user_uuid,
        batch_id=batch_uuid,
        branch=payload.branch,
        year=payload.year,
        section=payload.section
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "message": "Test assigned successfully",
        "assignment_id": str(assignment.id),
        "test_id": str(test.id),
        "user_id": str(user_uuid) if user_uuid else None,
        "batch_id": str(batch_uuid) if batch_uuid else None,
        "branch": payload.branch,
        "year": payload.year,
        "section": payload.section
    }

# -------------------------------------------------------------
# 🚩 QUESTION QA ALERT REPORTING & MANAGEMENT ENDPOINTS
# -------------------------------------------------------------

@router.post("/tests/{id}/qa-alert", response_model=dict, status_code=201)
def submit_question_qa_alert(
    id: str,
    payload: QAAlertCreate,
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Student sends a QA alert describing spelling, option, or question mistakes to the test creator"""
    try:
        test_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid test ID format")

    test = db.get(Test, test_uuid)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    q_uuid = None
    if payload.question_id:
        try:
            q_uuid = uuid.UUID(payload.question_id)
        except ValueError:
            q_uuid = None

    mistake_text = payload.mistake_description.strip()
    formatted_msg = f"The question contains {mistake_text} and needs to be assisted for evaluation"

    alert = QuestionAlert(
        test_id=test.id,
        question_id=q_uuid,
        question_number=payload.question_number or 1,
        question_text=payload.question_text,
        student_id=current_user.id if current_user else None,
        student_name=current_user.name if current_user else "Student",
        student_email=current_user.email if current_user else None,
        issue_type=payload.issue_type or "Spelling Mistake",
        mistake_description=mistake_text,
        formatted_message=formatted_msg,
        status="pending"
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    return {
        "message": "QA Alert sent to test creator successfully",
        "alert": {
            "id": str(alert.id),
            "test_id": str(alert.test_id),
            "question_number": alert.question_number,
            "issue_type": alert.issue_type,
            "mistake_description": alert.mistake_description,
            "formatted_message": alert.formatted_message,
            "status": alert.status,
            "created_at": alert.created_at.isoformat()
        }
    }

@router.get("/qa-alerts", response_model=List[QAAlertOut])
@router.get("/tests/{id}/qa-alerts", response_model=List[QAAlertOut])
def get_qa_alerts(
    id: Optional[str] = None,
    test_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Retrieve QA alerts for test creators / professors"""
    target_id = id or test_id
    query = select(QuestionAlert).order_by(QuestionAlert.created_at.desc())

    if target_id:
        try:
            t_uuid = uuid.UUID(target_id)
            query = query.where(QuestionAlert.test_id == t_uuid)
        except ValueError:
            pass

    if status_filter:
        query = query.where(QuestionAlert.status == status_filter)

    alerts = db.exec(query).all()
    results = []
    for a in alerts:
        test = db.get(Test, a.test_id)
        results.append(
            QAAlertOut(
                id=str(a.id),
                test_id=str(a.test_id),
                test_title=test.title if test else "Assessment",
                question_id=str(a.question_id) if a.question_id else None,
                question_number=a.question_number or 1,
                question_text=a.question_text,
                student_id=str(a.student_id) if a.student_id else None,
                student_name=a.student_name,
                student_email=a.student_email,
                issue_type=a.issue_type,
                mistake_description=a.mistake_description,
                formatted_message=a.formatted_message,
                status=a.status,
                created_at=a.created_at.isoformat()
            )
        )
    return results

@router.put("/qa-alerts/{id}/status")
def update_qa_alert_status(
    id: str,
    payload: QAAlertStatusUpdate,
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Update QA Alert status (e.g. reviewed, resolved, pending)"""
    try:
        a_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid alert ID format")

    alert = db.get(QuestionAlert, a_uuid)
    if not alert:
        raise HTTPException(status_code=404, detail="QA Alert not found")

    alert.status = payload.status
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return {"message": "QA Alert status updated successfully", "status": alert.status}

@router.delete("/qa-alerts/{id}")
def delete_qa_alert(
    id: str,
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        a_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid alert ID format")

    alert = db.get(QuestionAlert, a_uuid)
    if not alert:
        raise HTTPException(status_code=404, detail="QA Alert not found")

    db.delete(alert)
    db.commit()
    return {"message": "QA Alert deleted successfully"}

# -------------------------------------------------------------
# 👥 BATCHES MANAGEMENT ENDPOINTS
# -------------------------------------------------------------

@router.post("/batches", status_code=201)
def create_batch(
    payload: BatchCreatePayload,
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    batch = Batch(
        name=payload.name,
        description=payload.description
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    if payload.user_ids:
        for u_id_str in payload.user_ids:
            try:
                u_uuid = uuid.UUID(u_id_str)
                link = UserBatchLink(user_id=u_uuid, batch_id=batch.id)
                db.add(link)
            except ValueError:
                continue
        db.commit()

    return {
        "message": "Batch created successfully",
        "batch_id": str(batch.id),
        "name": batch.name
    }

@router.get("/batches")
def get_all_batches(db: Session = Depends(get_session)):
    batches = db.exec(select(Batch).order_by(Batch.created_at.desc())).all()
    return [
        {
            "id": str(b.id),
            "name": b.name,
            "description": b.description,
            "created_at": b.created_at.isoformat()
        }
        for b in batches
    ]
