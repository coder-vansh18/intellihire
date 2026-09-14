import uuid
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import StaticPool

from app.models import User, Test, Question, QuizProgress, Result, Batch, UserBatchLink, TestAssignment
from app.main import app
from app.db.session import get_session

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

def override_get_session():
    with Session(test_engine) as session:
        yield session

app.dependency_overrides[get_session] = override_get_session

@pytest.fixture(autouse=True)
def setup_db():
    SQLModel.metadata.create_all(test_engine)
    yield
    SQLModel.metadata.drop_all(test_engine)

def test_user_registration_and_single_session_login():
    with TestClient(app) as client:
        # Public self-registration is closed in institutional model
        reg_response = client.post("/api/auth/register", json={
            "name": "Jane Student",
            "email": "jane@example.com",
            "password": "securepassword123",
            "role": "student"
        })
        assert reg_response.status_code == 403

        # Login with pre-seeded student account to test single-session JWT tracking
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

def test_quiz_shuffling_and_proctoring_submission():
    with TestClient(app) as client:
        client.post("/api/auth/register", json={
            "name": "Bob Test",
            "email": "bob@example.com",
            "password": "password123",
            "role": "student"
        })
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

def test_role_based_test_assignments_and_visibility():
    with TestClient(app) as client:
        # Register Company, Student 1, Student 2
        client.post("/api/auth/register", json={"name": "Acme Corp", "email": "company@acme.com", "password": "pwd", "role": "company"})
        c_token = client.post("/api/auth/login", json={"email": "company@acme.com", "password": "pwd", "role": "company"}).json()["token"]
        c_headers = {"Authorization": f"Bearer {c_token}"}

        client.post("/api/auth/register", json={"name": "Alice Student", "email": "alice@student.com", "password": "pwd", "role": "student"})
        a_token = client.post("/api/auth/login", json={"email": "alice@student.com", "password": "pwd", "role": "student"}).json()["token"]
        a_headers = {"Authorization": f"Bearer {a_token}"}
        alice_id = client.get("/api/auth/me", headers=a_headers).json()["id"]

        client.post("/api/auth/register", json={"name": "Charlie Student", "email": "charlie@student.com", "password": "pwd", "role": "student"})
        ch_token = client.post("/api/auth/login", json={"email": "charlie@student.com", "password": "pwd", "role": "student"}).json()["token"]
        ch_headers = {"Authorization": f"Bearer {ch_token}"}
        charlie_id = client.get("/api/auth/me", headers=ch_headers).json()["id"]

        # Create Tests
        t1_res = client.post("/api/tests", json={
            "title": "Private Direct Test for Charlie",
            "is_public": False,
            "questions": [{"question": "Q1", "options": ["A", "B"], "correct": 0}]
        }, headers=c_headers).json()
        t1_id = t1_res["test"]["id"]

        t2_res = client.post("/api/tests", json={
            "title": "Public Practice Quiz",
            "is_public": True,
            "questions": [{"question": "Q2", "options": ["A", "B"], "correct": 0}]
        }, headers=c_headers).json()

        t3_res = client.post("/api/tests", json={
            "title": "CS-2026 Batch Exam",
            "is_public": False,
            "questions": [{"question": "Q3", "options": ["A", "B"], "correct": 0}]
        }, headers=c_headers).json()
        t3_id = t3_res["test"]["id"]

        # Create Batch "CS-2026" with Alice
        batch_res = client.post("/api/batches", json={
            "name": "CS-2026",
            "description": "Computer Science Batch 2026",
            "user_ids": [alice_id]
        }, headers=c_headers).json()
        batch_id = batch_res["batch_id"]

        # Assign Test 1 to Charlie individually
        client.post(f"/api/tests/{t1_id}/assign", json={"user_id": charlie_id}, headers=c_headers)

        # Assign Test 3 to CS-2026 Batch
        client.post(f"/api/tests/{t3_id}/assign", json={"batch_id": batch_id}, headers=c_headers)

        # Test Visibility for Alice (Student 1)
        alice_tests = client.get("/api/tests", headers=a_headers).json()
        alice_titles = [t["title"] for t in alice_tests]
        assert "Public Practice Quiz" in alice_titles
        assert "CS-2026 Batch Exam" in alice_titles
        assert "Private Direct Test for Charlie" not in alice_titles

        # Test Visibility for Charlie (Student 2)
        charlie_tests = client.get("/api/tests", headers=ch_headers).json()
        charlie_titles = [t["title"] for t in charlie_tests]
        assert "Public Practice Quiz" in charlie_titles
        assert "Private Direct Test for Charlie" in charlie_titles
        assert "CS-2026 Batch Exam" not in charlie_titles

def test_branchwise_profile_update_and_test_assignment():
    with TestClient(app) as client:
        # Register Professor & Student
        client.post("/api/auth/register", json={"name": "Prof Smith", "email": "prof@college.edu", "password": "pwd", "role": "professor"})
        p_token = client.post("/api/auth/login", json={"email": "prof@college.edu", "password": "pwd"}).json()["token"]
        p_headers = {"Authorization": f"Bearer {p_token}"}

        client.post("/api/auth/register", json={"name": "David Student", "email": "david@student.edu", "password": "pwd", "role": "student"})
        d_token = client.post("/api/auth/login", json={"email": "david@student.edu", "password": "pwd"}).json()["token"]
        d_headers = {"Authorization": f"Bearer {d_token}"}

        # Update David's Profile to Computer Science, 3rd Year, Section A
        up_res = client.put("/api/auth/profile", json={
            "branch": "Computer Science",
            "year": "3rd Year",
            "section": "Section A",
            "roll_number": "CS2026_042",
            "bio": "Tech Enthusiast"
        }, headers=d_headers)
        assert up_res.status_code == 200
        up_data = up_res.json()
        assert up_data["branch"] == "Computer Science"
        assert up_data["year"] == "3rd Year"
        assert up_data["section"] == "Section A"

        # Professor creates a CS Branch Midterm Test
        cs_test_res = client.post("/api/tests", json={
            "title": "Computer Science Branch Midterm",
            "is_public": False,
            "questions": [{"question": "What is OS?", "options": ["A", "B"], "correct": 0}]
        }, headers=p_headers).json()
        cs_test_id = cs_test_res["test"]["id"]

        # Assign test specifically to "Computer Science" branch
        assign_res = client.post(f"/api/tests/{cs_test_id}/assign", json={
            "branch": "Computer Science"
        }, headers=p_headers)
        assert assign_res.status_code == 201

        # David (Computer Science student) views test list -> should see CS Branch Midterm
        david_tests = client.get("/api/tests", headers=d_headers).json()
        d_titles = [t["title"] for t in david_tests]
        assert "Computer Science Branch Midterm" in d_titles
