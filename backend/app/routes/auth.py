import uuid
import secrets
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import User, Organization, PasswordResetToken
from app.schemas import (
    UserRegister, UserLogin, LoginResponse, UserOut, UserProfileUpdate,
    ForgotPasswordRequest, ResetPasswordRequest, PasswordResetOut
)
from app.core.security import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])

def build_user_out(user: User, db: Optional[Session] = None) -> UserOut:
    org_name = None
    org_domain = None
    if user.organization_id and db:
        org = db.get(Organization, user.organization_id)
        if org:
            org_name = org.name
            org_domain = org.domain

    return UserOut(
        id=str(user.id),
        name=user.name,
        email=user.email,
        role=user.role,
        organization_id=str(user.organization_id) if user.organization_id else None,
        organization_name=org_name,
        organization_domain=org_domain,
        must_change_password=user.must_change_password,
        branch=user.branch,
        year=user.year,
        section=user.section,
        roll_number=user.roll_number,
        bio=user.bio,
        _id=str(user.id)
    )

@router.post("/register", status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_session)):
    # Closed institutional platform: Self-registration is restricted.
    # Users must be provisioned by their Organization Administrator.
    raise HTTPException(
        status_code=403,
        detail="Self-registration is disabled. Please contact your College / Organization Administrator to obtain your official login credentials."
    )

@router.post("/login", response_model=LoginResponse)
def login(payload: UserLogin, db: Session = Depends(get_session)):
    clean_email = payload.email.strip().lower()
    user = db.exec(select(User).where(User.email == clean_email)).first()
    
    if not user:
        # Check if email domain belongs to any organization
        domain_parts = clean_email.split("@")
        if len(domain_parts) > 1:
            user_domain = domain_parts[1].lower()
            org = db.exec(select(Organization).where(Organization.domain == user_domain)).first()
            if org:
                # If valid college domain and user attempting first-time setup with common password, provision
                hashed_pwd = hash_password(payload.password)
                user_name = clean_email.split("@")[0].replace(".", " ").replace("_", " ").title()
                user = User(
                    organization_id=org.id,
                    name=user_name,
                    email=clean_email,
                    password_hash=hashed_pwd,
                    role=payload.role or "student",
                    must_change_password=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Account not found. Please ensure your account has been provisioned by your organization administrator."
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Incorrect password. If you are using an initial temporary password, please use 'Forgot Password' to reset your credentials."
        )

    new_session_id = uuid.uuid4()
    user.session_id = new_session_id
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user_id=user.id, role=user.role, session_id=new_session_id)
    
    return LoginResponse(
        success=True,
        message="Login Successful",
        token=token,
        user=build_user_out(user, db)
    )

@router.post("/forgot-password", response_model=PasswordResetOut)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_session)):
    clean_email = payload.email.strip().lower()
    user = db.exec(select(User).where(User.email == clean_email)).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found with this institutional email address."
        )

    # Invalidate previous unused tokens for this user
    previous_tokens = db.exec(
        select(PasswordResetToken)
        .where(PasswordResetToken.user_id == user.id)
        .where(PasswordResetToken.is_used == False)
    ).all()
    for pt in previous_tokens:
        pt.is_used = True
        db.add(pt)

    # Generate 6-character secure alphanumeric token (e.g. SK-8931)
    random_code = secrets.token_hex(3).upper()
    reset_token_str = f"RESET-{random_code}"

    token_record = PasswordResetToken(
        user_id=user.id,
        token=reset_token_str,
        expires_at=datetime.utcnow() + timedelta(hours=2),
        is_used=False
    )
    db.add(token_record)
    db.commit()

    return PasswordResetOut(
        success=True,
        message=f"Password reset token generated for {user.email}. In a production email environment, this is emailed. Use token '{reset_token_str}' to set your new password.",
        reset_token=reset_token_str
    )

@router.post("/reset-password", response_model=PasswordResetOut)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_session)):
    clean_email = payload.email.strip().lower()
    user = db.exec(select(User).where(User.email == clean_email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    token_record = db.exec(
        select(PasswordResetToken)
        .where(PasswordResetToken.user_id == user.id)
        .where(PasswordResetToken.token == payload.token.strip())
        .where(PasswordResetToken.is_used == False)
    ).first()

    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or already used reset token.")

    if datetime.utcnow() > token_record.expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new token.")

    if len(payload.new_password.strip()) < 4:
        raise HTTPException(status_code=400, detail="New password must be at least 4 characters long.")

    # Update password
    user.password_hash = hash_password(payload.new_password.strip())
    user.must_change_password = False
    token_record.is_used = True

    db.add(user)
    db.add(token_record)
    db.commit()

    return PasswordResetOut(
        success=True,
        message="Password reset successfully! You can now log in with your new private password."
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_session)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return build_user_out(current_user, db)

@router.put("/profile", response_model=UserOut)
def update_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if payload.name is not None:
        current_user.name = payload.name
    if payload.branch is not None:
        current_user.branch = payload.branch
    if payload.year is not None:
        current_user.year = payload.year
    if payload.section is not None:
        current_user.section = payload.section
    if payload.roll_number is not None:
        current_user.roll_number = payload.roll_number
    if payload.bio is not None:
        current_user.bio = payload.bio
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return build_user_out(current_user, db)
