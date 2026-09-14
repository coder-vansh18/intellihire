from typing import Optional
from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "student"
    organization_id: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[str] = None
    section: Optional[str] = None
    roll_number: Optional[str] = None
    bio: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[str] = None
    section: Optional[str] = None
    roll_number: Optional[str] = None
    bio: Optional[str] = None

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    organization_domain: Optional[str] = None
    must_change_password: Optional[bool] = False
    branch: Optional[str] = None
    year: Optional[str] = None
    section: Optional[str] = None
    roll_number: Optional[str] = None
    bio: Optional[str] = None
    _id: Optional[str] = None

class LoginResponse(BaseModel):
    success: bool
    message: str
    token: str
    user: UserOut

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str

class PasswordResetOut(BaseModel):
    success: bool
    message: str
    reset_token: Optional[str] = None
