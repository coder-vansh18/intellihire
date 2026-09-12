import uuid
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.db.session import get_session
from app.models import User, Test, Question, QuestionAlert
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

def test_qa_alert_creation_and_professor_retrieval(client: TestClient, session: Session):
    # 1. Create Professor and Student
    prof_sess = uuid.uuid4()
    prof = User(
        name="Prof QA Tester",
        email="prof_qa@intellihire.ai",
        password_hash=hash_password("profpass123"),
        role="company",
        session_id=prof_sess
    )
    
    student_sess = uuid.uuid4()
    student = User(
        name="Student Tester",
        email="student_qa@intellihire.ai",
        password_hash=hash_password("studentpass123"),
        role="student",
        session_id=student_sess
    )
    session.add(prof)
    session.add(student)
    session.commit()
    session.refresh(prof)
    session.refresh(student)

    prof_token = create_access_token(prof.id, prof.role, prof.session_id)
    student_token = create_access_token(student.id, student.role, student.session_id)

    # 2. Create Test with a Question
    test = Test(
        title="JavaScript Core Quiz",
        duration_minutes=30,
        is_public=True,
        created_by_id=prof.id
    )
    session.add(test)
    session.commit()
    session.refresh(test)

    question = Question(
        test_id=test.id,
        question_text="What is the result of typeof NaN in JavaScript?",
        options=["number", "undefined", "object", "NaN"],
        correct_option_index=0
    )
    session.add(question)
    session.commit()
    session.refresh(question)

    # 3. Student reports QA mistake on Question
    mistake_note = "spelling mistake in option D where NaN should be string"
    qa_payload = {
        "question_id": str(question.id),
        "question_number": 1,
        "question_text": question.question_text,
        "issue_type": "Spelling Mistake",
        "mistake_description": mistake_note
    }

    res = client.post(
        f"/api/tests/{test.id}/qa-alert",
        json=qa_payload,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 201
    res_data = res.json()
    assert "alert" in res_data
    expected_formatted_msg = f"The question contains {mistake_note} and needs to be assisted for evaluation"
    assert res_data["alert"]["formatted_message"] == expected_formatted_msg
    alert_id = res_data["alert"]["id"]

    # 4. Professor retrieves QA alerts for the test
    alerts_res = client.get(
        f"/api/tests/{test.id}/qa-alerts",
        headers={"Authorization": f"Bearer {prof_token}"}
    )
    assert alerts_res.status_code == 200
    alerts_list = alerts_res.json()
    assert len(alerts_list) == 1
    assert alerts_list[0]["student_name"] == "Student Tester"
    assert alerts_list[0]["formatted_message"] == expected_formatted_msg
    assert alerts_list[0]["status"] == "pending"

    # 5. Professor marks QA Alert as resolved
    status_update_res = client.put(
        f"/api/qa-alerts/{alert_id}/status",
        json={"status": "resolved"},
        headers={"Authorization": f"Bearer {prof_token}"}
    )
    assert status_update_res.status_code == 200
    assert status_update_res.json()["status"] == "resolved"

    # 6. Verify My Tests endpoint reflects the QA alert count
    my_tests_res = client.get(
        "/api/my-tests",
        headers={"Authorization": f"Bearer {prof_token}"}
    )
    assert my_tests_res.status_code == 200
    my_tests_data = my_tests_res.json()
    assert len(my_tests_data) == 1
    assert my_tests_data[0]["qa_alerts_count"] == 1
