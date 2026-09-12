import sys
import os
import uuid
from datetime import datetime, timedelta
sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import engine, create_db_and_tables
from sqlmodel import Session, select
from app.models import Test, User, Result
from app.core.security import create_access_token

create_db_and_tables()
client = TestClient(app)

# 1. Register & login a student
student_email = f"student_exp_{uuid.uuid4().hex[:6]}@test.com"
reg_res = client.post("/api/auth/register", json={
    "name": "Expiry Test Student",
    "email": student_email,
    "password": "password123",
    "role": "student"
})
assert reg_res.status_code in [200, 201], f"Register failed: {reg_res.text}"

login_res = client.post("/api/auth/login", json={
    "email": student_email,
    "password": "password123"
})
assert login_res.status_code == 200, f"Login failed: {login_res.text}"
token = login_res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Create an Active Test with Future Expiry
future_expiry = (datetime.utcnow() + timedelta(days=2)).isoformat()
res_active = client.post("/api/tests", json={
    "title": "Future Expiry Test",
    "duration_minutes": 20,
    "is_public": True,
    "expires_at": future_expiry,
    "questions": [
        {"question": "What is 2 + 2?", "options": ["3", "4", "5", "6"], "correct": 1}
    ]
})
assert res_active.status_code == 201, f"Create test failed: {res_active.text}"
active_test_id = res_active.json()["test"]["id"]
print(f"Created active test: {active_test_id} (Expires: {future_expiry})")

# 3. Create an Expired Test with Past Expiry
past_expiry = (datetime.utcnow() - timedelta(days=1)).isoformat()
res_expired = client.post("/api/tests", json={
    "title": "Past Expiry Test",
    "duration_minutes": 15,
    "is_public": True,
    "expires_at": past_expiry,
    "questions": [
        {"question": "What is 10 * 10?", "options": ["50", "100", "150", "200"], "correct": 1}
    ]
})
assert res_expired.status_code == 201
expired_test_id = res_expired.json()["test"]["id"]
print(f"Created expired test: {expired_test_id} (Expired on: {past_expiry})")

# 4. Verify /api/tests returns correct is_expired status
tests_res = client.get("/api/tests", headers=headers)
tests_data = tests_res.json()
active_in_list = next((t for t in tests_data if t["id"] == active_test_id), None)
expired_in_list = next((t for t in tests_data if t["id"] == expired_test_id), None)

assert active_in_list and not active_in_list["is_expired"], "Active test should not be expired"
assert expired_in_list and expired_in_list["is_expired"], "Expired test should be expired"
print("SUCCESS: Expiry status correctly computed in GET /api/tests")

# 5. Attempting to start expired test MUST fail with 400
start_expired_res = client.post(f"/api/tests/{expired_test_id}/start", headers=headers)
assert start_expired_res.status_code == 400, f"Expected 400, got {start_expired_res.status_code}"
print("SUCCESS: Expired test attempt correctly blocked by backend with HTTP 400!")

# 6. Attempting active test & submitting it
start_active_res = client.post(f"/api/tests/{active_test_id}/start", headers=headers)
assert start_active_res.status_code == 200
q0 = start_active_res.json()["questions"][0]
sub_res = client.post(f"/api/tests/{active_test_id}/submit", headers=headers, json={
    "testId": active_test_id,
    "answers": {q0["id"]: q0["correct"], "0": q0["correct"], f"{q0['id']}_text": q0["options"][q0["correct"]]},
    "tab_switches": 0
})
assert sub_res.status_code == 200
print(f"Submitted active test: Score {sub_res.json().get('score')}")

# 7. Check student tests again -> MUST show is_completed=True with result details
tests_after_sub = client.get("/api/tests", headers=headers).json()
completed_in_list = next((t for t in tests_after_sub if t["id"] == active_test_id), None)
assert completed_in_list and completed_in_list["is_completed"], "Submitted test must be marked is_completed=True"
assert completed_in_list["result"]["score"] == 1, "Result score must match submission"
print(f"SUCCESS: Completed test verified in student tests list: {completed_in_list['result']}")

# Clean up created test records
client.delete(f"/api/tests/{active_test_id}")
client.delete(f"/api/tests/{expired_test_id}")
print(">>> ALL EXPIRY & COMPLETION TESTS PASSED CLEANLY! <<<")
