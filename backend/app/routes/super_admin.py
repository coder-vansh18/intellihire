import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, or_

from app.db.session import get_session
from app.models import Organization, User, Test, Result
from app.schemas.organization import (
    OrganizationCreate, OrganizationUpdate, OrganizationOut,
    OrgAdminAssignmentPayload, SuperAdminOverview
)
from app.core.security import get_current_user, hash_password

router = APIRouter(prefix="/api/super-admin", tags=["Super Admin Oversight"])

def verify_super_admin(current_user: Optional[User] = Depends(get_current_user)) -> User:
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Access denied. Super Administrator privileges required.")
    return current_user

# ---------------------------------------------------------------------------
# 1. Platform-Wide Overview Metrics
# ---------------------------------------------------------------------------
@router.get("/overview", response_model=SuperAdminOverview)
def get_super_admin_overview(
    db: Session = Depends(get_session),
    super_admin: User = Depends(verify_super_admin)
):
    orgs = db.exec(select(Organization)).all()
    users = db.exec(select(User)).all()
    tests = db.exec(select(Test)).all()
    results = db.exec(select(Result)).all()

    admins = [u for u in users if u.role == "admin"]
    profs = [u for u in users if u.role in ["company", "professor"]]
    students = [u for u in users if u.role == "student"]

    return SuperAdminOverview(
        total_organizations=len(orgs),
        total_org_admins=len(admins),
        total_professors=len(profs),
        total_students=len(students),
        total_tests=len(tests),
        total_submissions=len(results)
    )

# ---------------------------------------------------------------------------
# 2. Organization Management (CRUD)
# ---------------------------------------------------------------------------
@router.get("/organizations", response_model=List[OrganizationOut])
def list_organizations(
    db: Session = Depends(get_session),
    super_admin: User = Depends(verify_super_admin)
):
    orgs = db.exec(select(Organization).order_by(Organization.created_at.desc())).all()
    out = []
    for org in orgs:
        org_users = db.exec(select(User).where(User.organization_id == org.id)).all()
        admins = len([u for u in org_users if u.role == "admin"])
        profs = len([u for u in org_users if u.role in ["company", "professor"]])
        students = len([u for u in org_users if u.role == "student"])
        tests = len(db.exec(select(Test).where(Test.organization_id == org.id)).all())

        out.append(
            OrganizationOut(
                id=str(org.id),
                name=org.name,
                code=org.code,
                domain=org.domain,
                is_active=org.is_active,
                created_at=org.created_at.isoformat(),
                total_admins=admins,
                total_professors=profs,
                total_students=students,
                total_tests=tests
            )
        )
    return out

@router.post("/organizations", response_model=OrganizationOut, status_code=201)
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_session),
    super_admin: User = Depends(verify_super_admin)
):
    # Check if code or domain already taken
    clean_code = payload.code.strip().upper()
    clean_domain = payload.domain.strip().lower().replace("@", "")

    existing_code = db.exec(select(Organization).where(Organization.code == clean_code)).first()
    if existing_code:
        raise HTTPException(status_code=400, detail=f"Organization code '{clean_code}' is already registered.")

    existing_admin = db.exec(select(User).where(User.email == payload.admin_email.strip().lower())).first()
    if existing_admin:
        raise HTTPException(status_code=400, detail=f"User with email '{payload.admin_email}' already exists.")

    # 1. Create Organization
    new_org = Organization(
        name=payload.name.strip(),
        code=clean_code,
        domain=clean_domain,
        is_active=True
    )
    db.add(new_org)
    db.commit()
    db.refresh(new_org)

    # 2. Provision Initial Organization Admin
    new_admin = User(
        organization_id=new_org.id,
        name=payload.admin_name.strip(),
        email=payload.admin_email.strip().lower(),
        password_hash=hash_password(payload.admin_password.strip()),
        role="admin",
        branch="Administration",
        year="Admin Cell",
        section="Executive Lead",
        roll_number=f"{clean_code}-ADM-01",
        bio=f"Lead Institutional Administrator for {payload.name}"
    )
    db.add(new_admin)
    db.commit()

    return OrganizationOut(
        id=str(new_org.id),
        name=new_org.name,
        code=new_org.code,
        domain=new_org.domain,
        is_active=new_org.is_active,
        created_at=new_org.created_at.isoformat(),
        total_admins=1,
        total_professors=0,
        total_students=0,
        total_tests=0
    )

@router.put("/organizations/{id}", response_model=OrganizationOut)
def update_organization(
    id: str,
    payload: OrganizationUpdate,
    db: Session = Depends(get_session),
    super_admin: User = Depends(verify_super_admin)
):
    try:
        org_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid organization ID format")

    org = db.get(Organization, org_uuid)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if payload.name is not None and payload.name.strip():
        org.name = payload.name.strip()
    if payload.code is not None and payload.code.strip():
        new_code = payload.code.strip().upper()
        if new_code != org.code:
            existing = db.exec(select(Organization).where(Organization.code == new_code)).first()
            if existing:
                raise HTTPException(status_code=400, detail="Organization code already in use")
            org.code = new_code
    if payload.domain is not None and payload.domain.strip():
        org.domain = payload.domain.strip().lower().replace("@", "")
    if payload.is_active is not None:
        org.is_active = payload.is_active

    db.add(org)
    db.commit()
    db.refresh(org)

    org_users = db.exec(select(User).where(User.organization_id == org.id)).all()
    admins = len([u for u in org_users if u.role == "admin"])
    profs = len([u for u in org_users if u.role in ["company", "professor"]])
    students = len([u for u in org_users if u.role == "student"])
    tests = len(db.exec(select(Test).where(Test.organization_id == org.id)).all())

    return OrganizationOut(
        id=str(org.id),
        name=org.name,
        code=org.code,
        domain=org.domain,
        is_active=org.is_active,
        created_at=org.created_at.isoformat(),
        total_admins=admins,
        total_professors=profs,
        total_students=students,
        total_tests=tests
    )

@router.delete("/organizations/{id}")
def delete_organization(
    id: str,
    db: Session = Depends(get_session),
    super_admin: User = Depends(verify_super_admin)
):
    try:
        org_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid organization ID format")

    org = db.get(Organization, org_uuid)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Delete all users and tests associated with organization
    org_users = db.exec(select(User).where(User.organization_id == org.id)).all()
    for u in org_users:
        db.delete(u)

    org_tests = db.exec(select(Test).where(Test.organization_id == org.id)).all()
    for t in org_tests:
        db.delete(t)

    db.delete(org)
    db.commit()

    return {"message": f"Organization '{org.name}' and all associated accounts deleted successfully"}

@router.post("/organizations/{id}/admins", response_model=OrganizationOut)
def assign_org_admin(
    id: str,
    payload: OrgAdminAssignmentPayload,
    db: Session = Depends(get_session),
    super_admin: User = Depends(verify_super_admin)
):
    try:
        org_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid organization ID format")

    org = db.get(Organization, org_uuid)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    existing = db.exec(select(User).where(User.email == payload.email.strip().lower())).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"User with email '{payload.email}' already exists")

    new_admin = User(
        organization_id=org.id,
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        password_hash=hash_password(payload.password.strip()),
        role="admin",
        branch="Administration",
        year="Admin Cell",
        section="Assigned Lead",
        roll_number=f"{org.code}-ADM-{uuid.uuid4().hex[:4].upper()}",
        bio=f"Assigned Administrator for {org.name}"
    )
    db.add(new_admin)
    db.commit()

    org_users = db.exec(select(User).where(User.organization_id == org.id)).all()
    admins = len([u for u in org_users if u.role == "admin"])
    profs = len([u for u in org_users if u.role in ["company", "professor"]])
    students = len([u for u in org_users if u.role == "student"])
    tests = len(db.exec(select(Test).where(Test.organization_id == org.id)).all())

    return OrganizationOut(
        id=str(org.id),
        name=org.name,
        code=org.code,
        domain=org.domain,
        is_active=org.is_active,
        created_at=org.created_at.isoformat(),
        total_admins=admins,
        total_professors=profs,
        total_students=students,
        total_tests=tests
    )
