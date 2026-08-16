from typing import Optional
from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "student"
    branch: Optional[str] = None
    year: Optional[str] = None
    section: Optional[str] = None
    roll_number: Optional[str] = None
    bio: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = "student"

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
