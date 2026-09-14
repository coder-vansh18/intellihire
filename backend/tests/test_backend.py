import uuid
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.db.session import get_session
from app.models import User, Test, Question, QuizProgress, Result, Batch, UserBatchLink, TestAssignment
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

def test_user_registration_and_single_session_login(client: TestClient, session: Session):
    # Public self-registration is closed in institutional model
    reg_response = client.post("/api/auth/register", json={
        "name": "Jane Student",
        "email": "jane@example.com",
        "password": "securepassword123",
        "role": "student"
    })
    assert reg_response.status_code == 403

    # Seed student account
    student = User(
        name="Test Student",
        email="student@intellihire.ai",
        password_hash=hash_password("student123"),
        role="student",
        session_id=uuid.uuid4()
    )
    session.add(student)
    session.commit()

    # Login with student account to test single-session JWT tracking
    login1 = client.post("/api/auth/login", json={
        "email": "student@intellihire.ai",
        "password": "student123"
    })
    assert login1.status_code == 200
    token1 = login1.json()["token"]

    me1 = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token1}"})
    assert me1.status_code == 200

    login2 = client.post("/api/auth/login", json={
        "email": "student@intellihire.ai",
        "password": "student123"
    })
    assert login2.status_code == 200
    token2 = login2.json()["token"]

    me1_invalidated = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token1}"})
    assert me1_invalidated.status_code == 401

    me2_valid = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token2}"})
    assert me2_valid.status_code == 200

def test_quiz_shuffling_and_proctoring_submission(client: TestClient, session: Session):
    bob = User(
        name="Bob Test",
        email="bob@example.com",
        password_hash=hash_password("password123"),
        role="student",
        session_id=uuid.uuid4()
    )
    session.add(bob)
    session.commit()

    token = client.post("/api/auth/login", json={"email": "bob@example.com", "password": "password123"}).json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post("/api/tests", json={
        "title": "Data Structures Test",
        "duration_minutes": 30,
        "is_public": True,
        "questions": [
            {
                "question": "What is the time complexity of lookup in a Hash Table?",
                "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
                "correct": 0
            }
        ]
    }, headers=headers)
    assert create_res.status_code == 201
    test_id = create_res.json()["test"]["id"]

    start_res = client.post(f"/api/tests/{test_id}/start", headers=headers)
    assert start_res.status_code == 200

    sub_res = client.post(f"/api/tests/{test_id}/submit", json={
        "answers": {"0": 0},
        "tab_switches": 3,
        "fullscreen_exit_count": 0,
        "paste_count": 0
    }, headers=headers)
    assert sub_res.status_code == 200
    result_data = sub_res.json()
    assert result_data["disqualified"] is True
    assert result_data["tab_switches"] == 3

def test_role_based_test_assignments_and_visibility(client: TestClient, session: Session):
    company = User(
        name="Acme Corp",
        email="company@acme.com",
        password_hash=hash_password("pwd"),
        role="company",
        session_id=uuid.uuid4()
    )
    alice = User(
        name="Alice Student",
        email="alice@student.com",
        password_hash=hash_password("pwd"),
        role="student",
        session_id=uuid.uuid4()
    )
    charlie = User(
        name="Charlie Student",
        email="charlie@student.com",
        password_hash=hash_password("pwd"),
        role="student",
        session_id=uuid.uuid4()
    )
    session.add_all([company, alice, charlie])
    session.commit()

    c_token = client.post("/api/auth/login", json={"email": "company@acme.com", "password": "pwd", "role": "company"}).json()["token"]
    c_headers = {"Authorization": f"Bearer {c_token}"}

    a_token = client.post("/api/auth/login", json={"email": "alice@student.com", "password": "pwd", "role": "student"}).json()["token"]
    a_headers = {"Authorization": f"Bearer {a_token}"}
    alice_id = client.get("/api/auth/me", headers=a_headers).json()["id"]

    ch_token = client.post("/api/auth/login", json={"email": "charlie@student.com", "password": "pwd", "role": "student"}).json()["token"]
    ch_headers = {"Authorization": f"Bearer {ch_token}"}

    create_res = client.post("/api/tests", json={
        "title": "Backend Engineering Private Test",
        "duration_minutes": 45,
        "is_public": False,
        "questions": [
            {
                "question": "What status code represents Resource Created?",
                "options": ["200", "201", "204", "400"],
                "correct": 1
            }
        ]
    }, headers=c_headers)
    assert create_res.status_code == 201
    private_test_id = create_res.json()["test"]["id"]

    # Verify Alice cannot see it yet
    alice_tests = client.get("/api/tests", headers=a_headers).json()
    assert not any(t["id"] == private_test_id for t in alice_tests)

    # Assign test specifically to Alice
    assign_res = client.post(f"/api/tests/{private_test_id}/assign", json={
        "user_id": alice_id
    }, headers=c_headers)
    assert assign_res.status_code == 201

    # Verify Alice can now see it
    alice_tests_after = client.get("/api/tests", headers=a_headers).json()
    assert any(t["id"] == private_test_id for t in alice_tests_after)

    # Verify Charlie still CANNOT see it
    charlie_tests = client.get("/api/tests", headers=ch_headers).json()
    assert not any(t["id"] == private_test_id for t in charlie_tests)

def test_branchwise_profile_update_and_test_assignment(client: TestClient, session: Session):
    prof = User(
        name="Prof Smith",
        email="prof@college.edu",
        password_hash=hash_password("pwd"),
        role="professor",
        session_id=uuid.uuid4()
    )
    student = User(
        name="Student",
        email="student@intellihire.ai",
        password_hash=hash_password("student123"),
        role="student",
        session_id=uuid.uuid4()
    )
    session.add_all([prof, student])
    session.commit()

    p_token = client.post("/api/auth/login", json={"email": "prof@college.edu", "password": "pwd"}).json()["token"]
    p_headers = {"Authorization": f"Bearer {p_token}"}

    s_token = client.post("/api/auth/login", json={"email": "student@intellihire.ai", "password": "student123"}).json()["token"]
    s_headers = {"Authorization": f"Bearer {s_token}"}

    # Update student profile details
    update_profile_res = client.put("/api/auth/profile", json={
        "branch": "Computer Science & Engineering",
        "year": "4th Year",
        "section": "Section A",
        "roll_number": "2026CS101",
        "bio": "Aspiring Full Stack Engineer"
    }, headers=s_headers)
    assert update_profile_res.status_code == 200
    profile_data = update_profile_res.json()
    assert profile_data["branch"] == "Computer Science & Engineering"
    assert profile_data["year"] == "4th Year"
    assert profile_data["section"] == "Section A"

    # Create Test targeted to Computer Science 4th Year Section A
    create_res = client.post("/api/tests", json={
        "title": "CSE Final Year Capstone Exam",
        "duration_minutes": 60,
        "is_public": False,
        "questions": [
            {
                "question": "Which layer handles reliable data delivery in OSI Model?",
                "options": ["Network", "Transport", "Data Link", "Application"],
                "correct": 1
            }
        ]
    }, headers=p_headers)
    assert create_res.status_code == 201
    targeted_test_id = create_res.json()["test"]["id"]

    # Assign test branch-wise
    assign_res = client.post(f"/api/tests/{targeted_test_id}/assign", json={
        "branch": "Computer Science & Engineering",
        "year": "4th Year",
        "section": "Section A"
    }, headers=p_headers)
    assert assign_res.status_code == 201

    # Verify Student sees test automatically
    s_tests = client.get("/api/tests", headers=s_headers).json()
    assert any(t["id"] == targeted_test_id for t in s_tests)
