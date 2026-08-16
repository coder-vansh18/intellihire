import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, or_
from app.db.session import get_session
from app.models import Test, Question, User, Batch, UserBatchLink, TestAssignment
from app.schemas import TestCreate, TestOut, QuestionOut, TestAssignPayload, BatchCreatePayload
from app.core.security import get_current_user

router = APIRouter(prefix="/api", tags=["Tests"])

def format_test_response(test: Test) -> TestOut:
    questions_out = [
        QuestionOut(
            id=str(q.id),
            question=q.question_text,
            options=q.options,
            correct=q.correct_option_index
        )
        for q in test.questions
    ]
    return TestOut(
        id=str(test.id),
        _id=str(test.id),
        title=test.title,
        duration_minutes=test.duration_minutes,
        is_public=test.is_public,
        questions=questions_out,
        createdAt=test.created_at.isoformat()
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
    
    test = Test(
        title=payload.title,
        duration_minutes=payload.duration_minutes or 60,
        is_public=payload.is_public if payload.is_public is not None else False,
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
        "test": format_test_response(test)
    }

@router.get("/tests", response_model=List[TestOut])
def get_all_tests(
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    # 1. Company / Professor / Admin Roles: View all created/managed tests
    if current_user and current_user.role in ["company", "professor", "admin"]:
        tests = db.exec(
            select(Test)
            .where(or_(Test.created_by_id == current_user.id, Test.created_by_id == None, Test.is_public == True))
            .order_by(Test.created_at.desc())
        ).all()
        return [format_test_response(t) for t in tests]
    
    # 2. Student Role: View Public Practice Tests + Assigned Tests (User, Batch, Branch, Year, Section)
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
            ).order_by(Test.created_at.desc())
        else:
            query = select(Test).where(Test.is_public == True).order_by(Test.created_at.desc())
        
        tests = db.exec(query).all()
        return [format_test_response(t) for t in tests]

    # 3. Unauthenticated Guests / Fallback: Public Practice Tests Only
    tests = db.exec(select(Test).where(Test.is_public == True).order_by(Test.created_at.desc())).all()
    return [format_test_response(t) for t in tests]

@router.get("/tests/{id}", response_model=TestOut)
def get_test(id: str, db: Session = Depends(get_session)):
    try:
        test_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid test ID format")
    
    test = db.get(Test, test_uuid)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    return format_test_response(test)

@router.delete("/tests/{id}")
@router.delete("/test/{id}")
def delete_test(id: str, db: Session = Depends(get_session)):
    try:
        test_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid test ID format")
    
    test = db.get(Test, test_uuid)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
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
