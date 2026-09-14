import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, or_, func

from app.db.session import get_session
from app.models import Organization, User, Test, Question, Result, QuizProgress, TestAssignment, QuestionAlert, UserBatchLink
from app.schemas.admin import (
    AdminUserCreate, AdminUserUpdate, AdminUserOut,
    IndividualTestAttempt, IndividualStudentReport, AdminAnalyticsOverview
)
from app.core.security import get_current_user, hash_password

router = APIRouter(prefix="/api/admin", tags=["Admin Oversight"])

def verify_admin_role(current_user: Optional[User] = Depends(get_current_user)) -> User:
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied. Organization Admin privileges required.")
    return current_user

# ---------------------------------------------------------------------------
# 1. High-Level Analytics Overview (Scoped to Organization)
# ---------------------------------------------------------------------------
@router.get("/analytics", response_model=AdminAnalyticsOverview)
def get_admin_analytics(
    db: Session = Depends(get_session),
    admin: User = Depends(verify_admin_role)
):
    org = db.get(Organization, admin.organization_id) if admin.organization_id else None

    user_query = select(User)
    test_query = select(Test)
    qa_query = select(QuestionAlert)

    if admin.organization_id:
        user_query = user_query.where(User.organization_id == admin.organization_id)
        test_query = test_query.where(Test.organization_id == admin.organization_id)

    users = db.exec(user_query).all()
    students = [u for u in users if u.role == "student"]
    professors = [u for u in users if u.role in ["company", "professor"]]
    
    tests = db.exec(test_query).all()
    test_ids = [t.id for t in tests]
    
    if test_ids:
        results = db.exec(select(Result).where(Result.test_id.in_(test_ids))).all()
        qa_alerts = db.exec(select(QuestionAlert).where(QuestionAlert.test_id.in_(test_ids))).all()
    else:
        results = []
        qa_alerts = []

    flagged = [r for r in results if r.disqualified or (r.tab_switch_count and r.tab_switch_count >= 2)]

    avg_accuracy = 0.0
    if results:
        total_score = sum(r.score for r in results)
        total_possible = sum(r.total for r in results if r.total > 0)
        if total_possible > 0:
            avg_accuracy = round((total_score / total_possible) * 100, 1)

    return AdminAnalyticsOverview(
        organization_id=str(org.id) if org else None,
        organization_name=org.name if org else "Default Organization",
        organization_code=org.code if org else "DEFAULT",
        organization_domain=org.domain if org else "intellihire.ai",
        total_users=len(users),
        total_students=len(students),
        total_professors=len(professors),
        total_tests=len(tests),
        total_submissions=len(results),
        average_organization_accuracy=avg_accuracy,
        total_qa_alerts=len(qa_alerts),
        total_flagged_sessions=len(flagged)
    )

# ---------------------------------------------------------------------------
# 2. User Management (List, Add, Update, Remove Scoped to Org)
# ---------------------------------------------------------------------------
@router.get("/users", response_model=List[AdminUserOut])
def list_organization_users(
    role: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_session),
    admin: User = Depends(verify_admin_role)
):
    query = select(User).order_by(User.created_at.desc())

    if admin.organization_id:
        query = query.where(User.organization_id == admin.organization_id)

    if role:
        if role == "professor" or role == "company":
            query = query.where(or_(User.role == "company", User.role == "professor"))
        else:
            query = query.where(User.role == role)

    if branch:
        query = query.where(User.branch == branch)

    if search:
        s = f"%{search.strip()}%"
        query = query.where(or_(User.name.ilike(s), User.email.ilike(s), User.roll_number.ilike(s)))

    users = db.exec(query).all()
    org = db.get(Organization, admin.organization_id) if admin.organization_id else None
    output: List[AdminUserOut] = []

    for u in users:
        user_results = db.exec(select(Result).where(Result.user_id == u.id)).all()
        tests_created = db.exec(select(Test).where(Test.created_by_id == u.id)).all()

        avg_score = 0.0
        if user_results:
            total_score = sum(r.score for r in user_results)
            total_max = sum(r.total for r in user_results if r.total > 0)
            if total_max > 0:
                avg_score = round((total_score / total_max) * 100, 1)

        output.append(
            AdminUserOut(
                id=str(u.id),
                name=u.name,
                email=u.email,
                role=u.role,
                organization_id=str(u.organization_id) if u.organization_id else None,
                organization_name=org.name if org else None,
                organization_domain=org.domain if org else None,
                branch=u.branch,
                year=u.year,
                section=u.section,
                roll_number=u.roll_number,
                bio=u.bio,
                created_at=u.created_at.isoformat(),
                tests_attempted=len(user_results),
                average_score_percent=avg_score,
                tests_created=len(tests_created)
            )
        )

    return output

@router.post("/users", response_model=AdminUserOut, status_code=201)
def add_organization_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_session),
    admin: User = Depends(verify_admin_role)
):
    clean_email = payload.email.strip().lower()

    # 1. Enforce Domain Validation for the Organization
    org = db.get(Organization, admin.organization_id) if admin.organization_id else None
    if org and org.domain:
        required_domain = org.domain.lower()
        if not clean_email.endswith(f"@{required_domain}") and not clean_email.endswith(f".{required_domain}"):
            raise HTTPException(
                status_code=400,
                detail=f"Email '{clean_email}' must end with your organization domain: @{org.domain}"
            )

    existing = db.exec(select(User).where(User.email == clean_email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email address already exists")

    hashed_pwd = hash_password(payload.password)
    user_role = payload.role.strip().lower()
    if user_role not in ["student", "company", "professor", "admin"]:
        user_role = "student"

    new_user = User(
        organization_id=admin.organization_id,
        name=payload.name.strip(),
        email=clean_email,
        password_hash=hashed_pwd,
        role=user_role,
        must_change_password=True,
        branch=payload.branch.strip() if payload.branch else None,
        year=payload.year.strip() if payload.year else None,
        section=payload.section.strip() if payload.section else None,
        roll_number=payload.roll_number.strip() if payload.roll_number else None,
        bio=payload.bio.strip() if payload.bio else None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return AdminUserOut(
        id=str(new_user.id),
        name=new_user.name,
        email=new_user.email,
        role=new_user.role,
        organization_id=str(new_user.organization_id) if new_user.organization_id else None,
        organization_name=org.name if org else None,
        organization_domain=org.domain if org else None,
        branch=new_user.branch,
        year=new_user.year,
        section=new_user.section,
        roll_number=new_user.roll_number,
        bio=new_user.bio,
        created_at=new_user.created_at.isoformat(),
        tests_attempted=0,
        average_score_percent=0.0,
        tests_created=0
    )

@router.put("/users/{id}", response_model=AdminUserOut)
def update_organization_user(
    id: str,
    payload: AdminUserUpdate,
    db: Session = Depends(get_session),
    admin: User = Depends(verify_admin_role)
):
    try:
        user_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    target_user = db.get(User, user_uuid)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if admin.organization_id and target_user.organization_id != admin.organization_id and admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="You can only manage users within your own organization")

    org = db.get(Organization, target_user.organization_id) if target_user.organization_id else None

    if payload.name is not None and payload.name.strip():
        target_user.name = payload.name.strip()
    if payload.email is not None and payload.email.strip():
        new_email = payload.email.strip().lower()
        if new_email != target_user.email:
            if org and org.domain and not new_email.endswith(f"@{org.domain.lower()}"):
                raise HTTPException(status_code=400, detail=f"Email must end with your organization domain: @{org.domain}")
            existing = db.exec(select(User).where(User.email == new_email)).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email is already taken by another user")
            target_user.email = new_email
    if payload.password is not None and payload.password.strip():
        target_user.password_hash = hash_password(payload.password.strip())
        target_user.must_change_password = False
    if payload.role is not None and payload.role.strip():
        r = payload.role.strip().lower()
        if r in ["student", "company", "professor", "admin"]:
            target_user.role = r
    if payload.branch is not None:
        target_user.branch = payload.branch.strip() if payload.branch else None
    if payload.year is not None:
        target_user.year = payload.year.strip() if payload.year else None
    if payload.section is not None:
        target_user.section = payload.section.strip() if payload.section else None
    if payload.roll_number is not None:
        target_user.roll_number = payload.roll_number.strip() if payload.roll_number else None
    if payload.bio is not None:
        target_user.bio = payload.bio.strip() if payload.bio else None

    db.add(target_user)
    db.commit()
    db.refresh(target_user)

    user_results = db.exec(select(Result).where(Result.user_id == target_user.id)).all()
    tests_created = db.exec(select(Test).where(Test.created_by_id == target_user.id)).all()
    avg_score = 0.0
    if user_results:
        total_score = sum(r.score for r in user_results)
        total_max = sum(r.total for r in user_results if r.total > 0)
        if total_max > 0:
            avg_score = round((total_score / total_max) * 100, 1)

    return AdminUserOut(
        id=str(target_user.id),
        name=target_user.name,
        email=target_user.email,
        role=target_user.role,
        organization_id=str(target_user.organization_id) if target_user.organization_id else None,
        organization_name=org.name if org else None,
        organization_domain=org.domain if org else None,
        branch=target_user.branch,
        year=target_user.year,
        section=target_user.section,
        roll_number=target_user.roll_number,
        bio=target_user.bio,
        created_at=target_user.created_at.isoformat(),
        tests_attempted=len(user_results),
        average_score_percent=avg_score,
        tests_created=len(tests_created)
    )

@router.delete("/users/{id}")
def delete_organization_user(
    id: str,
    db: Session = Depends(get_session),
    admin: User = Depends(verify_admin_role)
):
    try:
        user_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    if user_uuid == admin.id:
        raise HTTPException(status_code=400, detail="Administrators cannot delete their own active account")

    target_user = db.get(User, user_uuid)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if admin.organization_id and target_user.organization_id != admin.organization_id and admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="You can only manage users within your own organization")

    # Clean up user's dependencies
    results = db.exec(select(Result).where(Result.user_id == target_user.id)).all()
    for r in results:
        db.delete(r)

    progress_sessions = db.exec(select(QuizProgress).where(QuizProgress.user_id == target_user.id)).all()
    for p in progress_sessions:
        db.delete(p)

    batch_links = db.exec(select(UserBatchLink).where(UserBatchLink.user_id == target_user.id)).all()
    for bl in batch_links:
        db.delete(bl)

    assignments = db.exec(select(TestAssignment).where(TestAssignment.user_id == target_user.id)).all()
    for a in assignments:
        db.delete(a)

    qa_alerts = db.exec(select(QuestionAlert).where(QuestionAlert.student_id == target_user.id)).all()
    for al in qa_alerts:
        db.delete(al)

    created_tests = db.exec(select(Test).where(Test.created_by_id == target_user.id)).all()
    for t in created_tests:
        db.delete(t)

    db.delete(target_user)
    db.commit()

    return {"message": f"User {target_user.name} ({target_user.email}) deleted successfully"}

# ---------------------------------------------------------------------------
# 3. Individual Student Performance Dossier / Report Card
# ---------------------------------------------------------------------------
@router.get("/users/{id}/report", response_model=IndividualStudentReport)
def get_individual_student_report(
    id: str,
    db: Session = Depends(get_session),
    admin: User = Depends(verify_admin_role)
):
    try:
        user_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    target_user = db.get(User, user_uuid)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if admin.organization_id and target_user.organization_id != admin.organization_id and admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Access denied. Candidate belongs to another organization.")

    org = db.get(Organization, target_user.organization_id) if target_user.organization_id else None

    results = db.exec(
        select(Result)
        .where(Result.user_id == target_user.id)
        .order_by(Result.created_at.desc())
    ).all()

    attempts: List[IndividualTestAttempt] = []
    total_score = 0
    total_possible = 0
    clean_count = 0
    disqualified_count = 0

    for r in results:
        test = db.get(Test, r.test_id)
        test_title = test.title if test else "Assessment"
        accuracy = round((r.score / r.total) * 100, 1) if r.total > 0 else 0.0

        total_score += r.score
        total_possible += r.total

        if r.disqualified or (r.tab_switch_count and r.tab_switch_count >= 3):
            disqualified_count += 1
        else:
            clean_count += 1

        attempts.append(
            IndividualTestAttempt(
                result_id=str(r.id),
                test_id=str(r.test_id),
                test_title=test_title,
                score=r.score,
                total=r.total,
                accuracy=accuracy,
                tab_switch_count=r.tab_switch_count or 0,
                fullscreen_exit_count=r.fullscreen_exit_count or 0,
                paste_count=r.paste_count or 0,
                disqualified=bool(r.disqualified),
                duration_seconds=r.duration_seconds or 0,
                submitted_at=r.created_at.isoformat()
            )
        )

    avg_score = round((total_score / total_possible) * 100, 1) if total_possible > 0 else 0.0

    user_out = AdminUserOut(
        id=str(target_user.id),
        name=target_user.name,
        email=target_user.email,
        role=target_user.role,
        organization_id=str(target_user.organization_id) if target_user.organization_id else None,
        organization_name=org.name if org else None,
        organization_domain=org.domain if org else None,
        branch=target_user.branch,
        year=target_user.year,
        section=target_user.section,
        roll_number=target_user.roll_number,
        bio=target_user.bio,
        created_at=target_user.created_at.isoformat(),
        tests_attempted=len(results),
        average_score_percent=avg_score,
        tests_created=0
    )

    return IndividualStudentReport(
        user=user_out,
        total_tests_attempted=len(results),
        average_score_percent=avg_score,
        total_clean_attempts=clean_count,
        total_disqualified_attempts=disqualified_count,
        attempts=attempts
    )

# ---------------------------------------------------------------------------
# 4. Global Assessment Oversight Scoped to Organization
# ---------------------------------------------------------------------------
@router.get("/tests")
def get_admin_tests_oversight(
    db: Session = Depends(get_session),
    admin: User = Depends(verify_admin_role)
):
    query = select(Test).order_by(Test.created_at.desc())
    if admin.organization_id:
        query = query.where(Test.organization_id == admin.organization_id)

    tests = db.exec(query).all()
    results = []
    for t in tests:
        creator = db.get(User, t.created_by_id) if t.created_by_id else None
        submission_count = len(db.exec(select(Result).where(Result.test_id == t.id)).all())
        qa_count = len(db.exec(select(QuestionAlert).where(QuestionAlert.test_id == t.id)).all())

        results.append({
            "id": str(t.id),
            "title": t.title,
            "duration_minutes": t.duration_minutes,
            "is_public": t.is_public,
            "expires_at": t.expires_at.isoformat() if t.expires_at else None,
            "is_expired": datetime.utcnow() > t.expires_at if t.expires_at else False,
            "created_at": t.created_at.isoformat(),
            "creator_name": creator.name if creator else "Faculty Lead",
            "creator_email": creator.email if creator else None,
            "total_questions": len(t.questions),
            "total_submissions": submission_count,
            "qa_alerts_count": qa_count
        })
    return results

@router.delete("/tests/{id}")
def admin_delete_test(
    id: str,
    db: Session = Depends(get_session),
    admin: User = Depends(verify_admin_role)
):
    try:
        test_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid test ID format")

    test = db.get(Test, test_uuid)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    if admin.organization_id and test.organization_id != admin.organization_id and admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="You can only delete assessments within your organization")

    results = db.exec(select(Result).where(Result.test_id == test.id)).all()
    for r in results:
        db.delete(r)

    progress_sessions = db.exec(select(QuizProgress).where(QuizProgress.test_id == test.id)).all()
    for p in progress_sessions:
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

    return {"message": f"Assessment '{test.title}' deleted successfully by administrator"}
