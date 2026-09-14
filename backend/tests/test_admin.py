import uuid
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.db.session import get_session
from app.models import User, Test, Question, Result
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

def test_admin_panel_workflows(client: TestClient, session: Session):
    # 1. Create Admin, Professor, and Student users
    admin = User(
        name="Super Admin",
        email="superadmin@intellihire.ai",
        password_hash=hash_password("adminpass"),
        role="admin",
        session_id=uuid.uuid4()
    )
    prof = User(
        name="Prof Turing",
        email="profturing@intellihire.ai",
        password_hash=hash_password("profpass"),
        role="company",
        branch="Computer Science",
        session_id=uuid.uuid4()
    )
    student = User(
        name="John Doe",
        email="johndoe@intellihire.ai",
        password_hash=hash_password("studentpass"),
        role="student",
        branch="Computer Science",
        year="3rd Year",
        section="Section A",
        roll_number="CS301",
        session_id=uuid.uuid4()
    )
    session.add(admin)
    session.add(prof)
    session.add(student)
    session.commit()
    session.refresh(admin)
    session.refresh(prof)
    session.refresh(student)

    admin_token = create_access_token(admin.id, admin.role, admin.session_id)
    student_token = create_access_token(student.id, student.role, student.session_id)

    # 2. Create Test and Result for Student
    test = Test(
        title="Python Data Structures Test",
        duration_minutes=45,
        is_public=True,
        created_by_id=prof.id
    )
    session.add(test)
    session.commit()
    session.refresh(test)

    result = Result(
        user_id=student.id,
        test_id=test.id,
        score=28,
        total=30,
        tab_switch_count=1,
        fullscreen_exit_count=0,
        paste_count=0,
        disqualified=False,
        duration_seconds=1200,
        metrics=[]
    )
    session.add(result)
    session.commit()

    # 3. Test Analytics Endpoint
    analytics_res = client.get(
        "/api/admin/analytics",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert analytics_res.status_code == 200
    data = analytics_res.json()
    assert data["total_users"] == 3
    assert data["total_students"] == 1
    assert data["total_professors"] == 1
    assert data["total_tests"] == 1
    assert data["total_submissions"] == 1
    assert data["average_organization_accuracy"] > 0

    # 4. Test Listing Users
    users_res = client.get(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert users_res.status_code == 200
    users_list = users_res.json()
    assert len(users_list) == 3

    # 5. Test Admin Adding a New Student and Faculty
    new_student_payload = {
        "name": "Sarah Connor",
        "email": "sarah@intellihire.ai",
        "password": "sarahpassword123",
        "role": "student",
        "branch": "Information Technology",
        "year": "2nd Year",
        "section": "Section B",
        "roll_number": "IT202"
    }
    create_res = client.post(
        "/api/admin/users",
        json=new_student_payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert create_res.status_code == 201
    created_user = create_res.json()
    assert created_user["name"] == "Sarah Connor"
    assert created_user["role"] == "student"
    sarah_id = created_user["id"]

    # 6. Test Admin Updating User Details
    update_res = client.put(
        f"/api/admin/users/{sarah_id}",
        json={"year": "3rd Year", "section": "Section A"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["year"] == "3rd Year"

    # 7. Test Admin Fetching Individual Student Report Card
    report_res = client.get(
        f"/api/admin/users/{student.id}/report",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert report_data["total_tests_attempted"] == 1
    assert report_data["average_score_percent"] == round((28 / 30) * 100, 1)
    assert len(report_data["attempts"]) == 1
    assert report_data["attempts"][0]["test_title"] == "Python Data Structures Test"
    assert report_data["attempts"][0]["score"] == 28

    # 8. Test Non-Admin Forbidden Check
    forbidden_res = client.get(
        "/api/admin/analytics",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert forbidden_res.status_code == 403

    # 9. Test Admin Deleting User
    delete_res = client.delete(
        f"/api/admin/users/{sarah_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert delete_res.status_code == 200
