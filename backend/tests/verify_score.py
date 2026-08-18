import sys
import os
sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import engine
from sqlmodel import Session, select
from app.models import Test

client = TestClient(app)
session = Session(engine)
test = session.exec(select(Test)).first()

if test:
    print(f"Testing Assessment: {test.title}")
    # 1. Start session
    start_res = client.post(f"/api/tests/{test.id}/start")
    data = start_res.json()
    questions = data["questions"]
    print(f"Loaded {len(questions)} randomized questions")

    # 2. Answer all questions correctly
    answers = {}
    for idx, q in enumerate(questions):
        q_id = q["id"]
        correct_idx = q["correct"]
        selected_text = q["options"][correct_idx]
        answers[str(idx)] = correct_idx
        answers[q_id] = correct_idx
        answers[f"{q_id}_text"] = selected_text

    # 3. Submit
    sub_res = client.post(f"/api/tests/{test.id}/submit", json={
        "testId": str(test.id),
        "answers": answers,
        "tab_switches": 0
    })
    result = sub_res.json()
    print(f"Submission Response: Status {sub_res.status_code}")
    print(f"Score: {result.get('score')} / {result.get('total')}")
    assert result.get("score") == len(questions), f"Expected {len(questions)}, got {result.get('score')}"
    print(">>> SUCCESS: 30 / 30 Score calculated accurately! <<<")
else:
    print("No test found in DB")
