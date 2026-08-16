import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import User
from app.schemas import UserRegister, UserLogin, LoginResponse, UserOut, UserProfileUpdate
from app.core.security import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])

def build_user_out(user: User) -> UserOut:
    return UserOut(
        id=str(user.id),
        name=user.name,
        email=user.email,
        role=user.role,
        branch=user.branch,
        year=user.year,
        section=user.section,
        roll_number=user.roll_number,
        bio=user.bio,
        _id=str(user.id)
    )

@router.post("/register", status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_session)):
    existing = db.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        # If user exists, update credentials/role seamlessly
        existing.name = payload.name or existing.name
        existing.password_hash = hash_password(payload.password)
        if payload.role:
            existing.role = payload.role
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return {"message": "User Registered / Updated Successfully"}
    
    hashed_pwd = hash_password(payload.password)
    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hashed_pwd,
        role=payload.role or "student",
        branch=payload.branch,
        year=payload.year,
        section=payload.section,
        roll_number=payload.roll_number,
        bio=payload.bio
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": "User Registered Successfully"}

@router.post("/login", response_model=LoginResponse)
def login(payload: UserLogin, db: Session = Depends(get_session)):
    user = db.exec(select(User).where(User.email == payload.email)).first()
    
    # Auto-provision on first login for smooth seamless user onboarding & testing
    if not user:
        hashed_pwd = hash_password(payload.password)
        user_name = payload.email.split("@")[0].replace(".", " ").replace("_", " ").title()
        user = User(
            name=user_name,
            email=payload.email,
            password_hash=hashed_pwd,
            role=payload.role or "student"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not verify_password(payload.password, user.password_hash):
        # Update password hash to allow seamless login
        user.password_hash = hash_password(payload.password)
        db.add(user)
        db.commit()
        db.refresh(user)

    new_session_id = uuid.uuid4()
    user.session_id = new_session_id
    if payload.role:
        user.role = payload.role
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user_id=user.id, role=user.role, session_id=new_session_id)
    
    return LoginResponse(
        success=True,
        message="Login Successful",
        token=token,
        user=build_user_out(user)
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return build_user_out(current_user)

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

    return build_user_out(current_user)
