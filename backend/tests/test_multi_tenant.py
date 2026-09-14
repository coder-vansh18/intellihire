import uuid
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.db.session import get_session
from app.models import Organization, User, Test, Result
from app.core.security import hash_password, create_access_token

@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

def test_multi_tenant_hierarchy_and_security(client: TestClient, session: Session):
    # 1. Setup Super Admin
    super_admin = User(
        name="Global Master Admin",
        email="superadmin@intellihire.ai",
        password_hash=hash_password("supersecret123"),
        role="super_admin",
        session_id=uuid.uuid4()
    )
    session.add(super_admin)
    session.commit()
    session.refresh(super_admin)
    super_token = create_access_token(super_admin.id, super_admin.role, super_admin.session_id)

    # 2. Super Admin creates Organization 1 (SKIT)
    create_org_res = client.post(
        "/api/super-admin/organizations",
        json={
            "name": "Swami Keshvanand Institute of Technology",
            "code": "SKIT",
            "domain": "skit.ac.in",
            "admin_name": "SKIT Admin",
            "admin_email": "admin@skit.ac.in",
            "admin_password": "skitadminpassword"
        },
        headers={"Authorization": f"Bearer {super_token}"}
    )
    assert create_org_res.status_code == 201
    skit_org_data = create_org_res.json()
    assert skit_org_data["code"] == "SKIT"
    assert skit_org_data["domain"] == "skit.ac.in"
    skit_org_id = skit_org_data["id"]

    # Retrieve created SKIT Admin
    skit_admin = session.query(User).filter(User.email == "admin@skit.ac.in").first()
    assert skit_admin is not None
    assert str(skit_admin.organization_id) == skit_org_id
    skit_admin_token = create_access_token(skit_admin.id, skit_admin.role, skit_admin.session_id)

    # 3. Super Admin creates Organization 2 (IIT Delhi)
    create_iitd_res = client.post(
        "/api/super-admin/organizations",
        json={
            "name": "IIT Delhi",
            "code": "IITD",
            "domain": "iitd.ac.in",
            "admin_name": "IITD Admin",
            "admin_email": "admin@iitd.ac.in",
            "admin_password": "iitdadminpassword"
        },
        headers={"Authorization": f"Bearer {super_token}"}
    )
    assert create_iitd_res.status_code == 201

    # 4. Super Admin Overview
    overview_res = client.get(
        "/api/super-admin/overview",
        headers={"Authorization": f"Bearer {super_token}"}
    )
    assert overview_res.status_code == 200
    overview_data = overview_res.json()
    assert overview_data["total_organizations"] == 2
    assert overview_data["total_org_admins"] == 2

    # 5. SKIT Org Admin provisions a Student with matching college domain (@skit.ac.in)
    add_student_res = client.post(
        "/api/admin/users",
        json={
            "name": "Priyanshu Verma",
            "email": "b241187@skit.ac.in",
            "password": "commonpassword123",
            "role": "student",
            "branch": "Computer Science & Engineering",
            "year": "3rd Year",
            "section": "Section A",
            "roll_number": "b241187"
        },
        headers={"Authorization": f"Bearer {skit_admin_token}"}
    )
    assert add_student_res.status_code == 201
    student_data = add_student_res.json()
    assert student_data["email"] == "b241187@skit.ac.in"

    # 6. SKIT Org Admin attempts to provision user with non-institutional email -> Rejected
    bad_domain_res = client.post(
        "/api/admin/users",
        json={
            "name": "Random User",
            "email": "random.user@gmail.com",
            "password": "password123",
            "role": "student"
        },
        headers={"Authorization": f"Bearer {skit_admin_token}"}
    )
    assert bad_domain_res.status_code == 400
    assert "must end with your organization domain" in bad_domain_res.json()["detail"]

    # 7. Public Self-Registration -> Forbidden
    public_register_res = client.post(
        "/api/auth/register",
        json={
            "name": "Uninvited Guest",
            "email": "guest@random.com",
            "password": "guestpassword"
        }
    )
    assert public_register_res.status_code == 403

    # 8. Password Reset Flow (Student resets temporary password to private one)
    forgot_res = client.post(
        "/api/auth/forgot-password",
        json={"email": "b241187@skit.ac.in"}
    )
    assert forgot_res.status_code == 200
    reset_token = forgot_res.json()["reset_token"]
    assert reset_token is not None

    reset_res = client.post(
        "/api/auth/reset-password",
        json={
            "email": "b241187@skit.ac.in",
            "token": reset_token,
            "new_password": "MyPrivatePassword@2026"
        }
    )
    assert reset_res.status_code == 200

    # 9. Student Logs in with new private password
    login_res = client.post(
        "/api/auth/login",
        json={
            "email": "b241187@skit.ac.in",
            "password": "MyPrivatePassword@2026"
        }
    )
    assert login_res.status_code == 200
    assert login_res.json()["user"]["organization_domain"] == "skit.ac.in"
