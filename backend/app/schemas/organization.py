from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class OrganizationCreate(BaseModel):
    name: str
    code: str
    domain: str
    admin_name: str
    admin_email: str
    admin_password: str

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    domain: Optional[str] = None
    is_active: Optional[bool] = None

class OrganizationOut(BaseModel):
    id: str
    name: str
    code: str
    domain: str
    is_active: bool
    created_at: str
    total_admins: Optional[int] = 0
    total_professors: Optional[int] = 0
    total_students: Optional[int] = 0
    total_tests: Optional[int] = 0

class OrgAdminAssignmentPayload(BaseModel):
    name: str
    email: str
    password: str

class SuperAdminOverview(BaseModel):
    total_organizations: int
    total_org_admins: int
    total_professors: int
    total_students: int
    total_tests: int
    total_submissions: int
