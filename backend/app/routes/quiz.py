import uuid
import random
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import Test, QuizProgress, Result, User
from app.schemas import ProgressUpdatePayload, QuizSubmitPayload
from app.core.security import get_current_user

router = APIRouter(prefix="/api", tags=["Quiz"])

GUEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")

@router.post("/tests/{test_id}/start")
def start_quiz(
    test_id: str, 
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        t_uuid = uuid.UUID(test_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid test ID")
    
    test = db.get(Test, t_uuid)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    user_id = current_user.id if current_user else GUEST_USER_ID

    existing_progress = db.exec(
        select(QuizProgress)
        .where(QuizProgress.user_id == user_id)
        .where(QuizProgress.test_id == test.id)
    ).first()

    if existing_progress:
        q_order = existing_progress.randomized_question_ids
        opt_map = existing_progress.randomized_options_map
        
        questions_by_id = {str(q.id): q for q in test.questions}
        shuffled_questions = []
        for q_id in q_order:
            q = questions_by_id.get(q_id)
            if q:
                mapped_indices = opt_map.get(q_id, list(range(len(q.options))))
                shuffled_options = [q.options[idx] for idx in mapped_indices]
                shuffled_questions.append({
                    "id": str(q.id),
                    "question": q.question_text,
                    "options": shuffled_options
                })
        
        elapsed_sec = (datetime.utcnow() - existing_progress.started_at).total_seconds()
        total_sec = test.duration_minutes * 60
        remaining_sec = max(0, int(total_sec - elapsed_sec))
        
        return {
            "session_id": str(existing_progress.id),
            "questions": shuffled_questions,
            "answers": existing_progress.answers,
            "started_at": existing_progress.started_at.isoformat(),
            "duration_minutes": test.duration_minutes,
            "remaining_seconds": remaining_sec,
            "tab_switch_count": existing_progress.tab_switch_count,
            "fullscreen_exit_count": existing_progress.fullscreen_exit_count,
            "paste_count": existing_progress.paste_count
        }

    questions = list(test.questions)
    random.shuffle(questions)
    
    randomized_q_ids = [str(q.id) for q in questions]
    randomized_options_map = {}
    shuffled_questions = []

    for q in questions:
        opt_indices = list(range(len(q.options)))
        random.shuffle(opt_indices)
        randomized_options_map[str(q.id)] = opt_indices
        
        shuffled_opts = [q.options[i] for i in opt_indices]
        shuffled_questions.append({
            "id": str(q.id),
            "question": q.question_text,
            "options": shuffled_opts
        })

    progress = QuizProgress(
        user_id=user_id,
        test_id=test.id,
        started_at=datetime.utcnow(),
        last_saved_at=datetime.utcnow(),
        answers={},
        randomized_question_ids=randomized_q_ids,
        randomized_options_map=randomized_options_map
    )
    db.add(progress)
    db.commit()
    db.refresh(progress)

    return {
        "session_id": str(progress.id),
        "questions": shuffled_questions,
        "answers": {},
        "started_at": progress.started_at.isoformat(),
        "duration_minutes": test.duration_minutes,
        "remaining_seconds": test.duration_minutes * 60,
        "tab_switch_count": 0,
        "fullscreen_exit_count": 0,
        "paste_count": 0
    }

@router.post("/tests/{test_id}/progress")
def save_progress(
    test_id: str,
    payload: ProgressUpdatePayload,
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    user_id = current_user.id if current_user else GUEST_USER_ID
    
    t_uuid = uuid.UUID(test_id)
    progress = db.exec(
        select(QuizProgress)
        .where(QuizProgress.user_id == user_id)
        .where(QuizProgress.test_id == t_uuid)
    ).first()

    if not progress:
        raise HTTPException(status_code=404, detail="No active test session found")

    tab_switches_val = payload.tab_switches if payload.tab_switches is not None else payload.tab_switch_count
    progress.answers = payload.answers
    progress.tab_switch_count = tab_switches_val if tab_switches_val is not None else progress.tab_switch_count
    progress.fullscreen_exit_count = payload.fullscreen_exit_count or progress.fullscreen_exit_count
    progress.paste_count = payload.paste_count or progress.paste_count
    progress.last_saved_at = datetime.utcnow()

    db.add(progress)
    db.commit()

    test = db.get(Test, t_uuid)
    elapsed = (datetime.utcnow() - progress.started_at).total_seconds()
    remaining = max(0, int((test.duration_minutes * 60) - elapsed))

    return {"success": True, "remaining_seconds": remaining}

@router.post("/tests/{test_id}/submit")
def submit_quiz(
    test_id: str,
    payload: QuizSubmitPayload,
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    t_uuid = uuid.UUID(test_id)
    test = db.get(Test, t_uuid)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    user_id = current_user.id if current_user else (uuid.UUID(payload.userId) if payload.userId else GUEST_USER_ID)
    user_name = current_user.name if current_user else (payload.userName or "Student")

    progress = db.exec(
        select(QuizProgress)
        .where(QuizProgress.user_id == user_id)
        .where(QuizProgress.test_id == t_uuid)
    ).first()

    submitted_answers = payload.answers if payload.answers is not None else (progress.answers if progress else {})
    
    raw_tab_switches = payload.tab_switches if payload.tab_switches is not None else payload.tab_switch_count
    tab_switches = raw_tab_switches if raw_tab_switches is not None else (progress.tab_switch_count if progress else 0)
    
    fs_exits = payload.fullscreen_exit_count or (progress.fullscreen_exit_count if progress else 0)
    pastes = payload.paste_count or (progress.paste_count if progress else 0)

    duration_sec = 0
    if progress:
        duration_sec = int((datetime.utcnow() - progress.started_at).total_seconds())

    score = 0
    total = len(test.questions)
    metrics = []

    # Construct evaluation list matching the EXACT question order shown to student
    questions_by_id = {str(q.id): q for q in test.questions}
    
    if progress and progress.randomized_question_ids:
        questions_list = []
        for q_id in progress.randomized_question_ids:
            if q_id in questions_by_id:
                questions_list.append(questions_by_id[q_id])
        for q in test.questions:
            if q not in questions_list:
                questions_list.append(q)
    else:
        questions_list = list(test.questions)

    for idx, q in enumerate(questions_list):
        q_id_str = str(q.id)
        user_ans = submitted_answers.get(q_id_str, submitted_answers.get(str(idx)))
        
        is_correct = False
        selected_option_original = None

        if user_ans is not None:
            try:
                user_ans_int = int(user_ans)
            except (ValueError, TypeError):
                user_ans_int = None

            if user_ans_int is not None:
                selected_option_original = user_ans_int
                # Un-shuffle if session randomized options map exists
                if progress and progress.randomized_options_map and q_id_str in progress.randomized_options_map:
                    opt_map = progress.randomized_options_map[q_id_str]
                    try:
                        selected_option_original = opt_map[user_ans_int]
                    except (IndexError, KeyError):
                        selected_option_original = user_ans_int
            else:
                # If user_ans is option text string
                user_ans_str = str(user_ans).strip().lower()
                for opt_i, opt_val in enumerate(q.options):
                    if str(opt_val).strip().lower() == user_ans_str:
                        selected_option_original = opt_i
                        break

            # Evaluate correct answer (by index match or string text match)
            if selected_option_original is not None:
                if int(selected_option_original) == q.correct_option_index:
                    is_correct = True
                elif 0 <= selected_option_original < len(q.options) and 0 <= q.correct_option_index < len(q.options):
                    sel_text = str(q.options[selected_option_original]).strip().lower()
                    corr_text = str(q.options[q.correct_option_index]).strip().lower()
                    if sel_text == corr_text:
                        is_correct = True

            if is_correct:
                score += 1

        metrics.append({
            "question_id": q_id_str,
            "question_text": q.question_text,
            "selected_option": selected_option_original,
            "correct_option": q.correct_option_index,
            "is_correct": is_correct
        })

    disqualified = tab_switches >= 3 or fs_exits >= 5 or (payload.disqualified is True)

    result = Result(
        user_id=user_id,
        test_id=test.id,
        score=score,
        total=total,
        duration_seconds=duration_sec,
        metrics=metrics,
        tab_switch_count=tab_switches,
        fullscreen_exit_count=fs_exits,
        paste_count=pastes,
        disqualified=disqualified
    )
    db.add(result)

    if progress:
        db.delete(progress)
    
    db.commit()
    db.refresh(result)

    return {
        "message": "Result saved successfully",
        "score": score,
        "total": total,
        "tab_switches": tab_switches,
        "disqualified": disqualified,
        "result_id": str(result.id)
    }

@router.post("/test")
def legacy_submit_test(
    payload: QuizSubmitPayload,
    db: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    if payload.testId:
        return submit_quiz(test_id=payload.testId, payload=payload, db=db, current_user=current_user)
    raise HTTPException(status_code=400, detail="Missing testId in submission payload")
