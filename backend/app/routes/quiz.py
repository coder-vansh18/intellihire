import uuid
import random
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, or_
from app.db.session import get_session, GUEST_USER_ID
from app.models import Test, QuizProgress, Result, User
from app.schemas import ProgressUpdatePayload, QuizSubmitPayload
from app.core.security import get_current_user

router = APIRouter(prefix="/api", tags=["Quiz"])

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

    # Check if assessment deadline has expired
    if test.expires_at and datetime.utcnow() > test.expires_at:
        raise HTTPException(
            status_code=400,
            detail=f"This assessment expired on {test.expires_at.strftime('%b %d, %Y at %I:%M %p UTC')} and is no longer accepting submissions."
        )

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
                correct_shuffled_idx = mapped_indices.index(q.correct_option_index) if q.correct_option_index in mapped_indices else 0
                shuffled_questions.append({
                    "id": str(q.id),
                    "question": q.question_text,
                    "options": shuffled_options,
                    "correct": correct_shuffled_idx
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
        correct_shuffled_idx = opt_indices.index(q.correct_option_index) if q.correct_option_index in opt_indices else 0

        shuffled_questions.append({
            "id": str(q.id),
            "question": q.question_text,
            "options": shuffled_opts,
            "correct": correct_shuffled_idx
        })

    session_id = str(uuid.uuid4())
    try:
        progress = QuizProgress(
            id=uuid.UUID(session_id),
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
    except Exception as e:
        db.rollback()
        print(f"QuizProgress startup note: {e}")

    return {
        "session_id": session_id,
        "questions": shuffled_questions,
        "answers": {},
        "started_at": datetime.utcnow().isoformat(),
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
        return {"success": True}

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

    user_id = current_user.id if current_user else None
    if not user_id and payload.userId:
        try:
            cand_id = uuid.UUID(payload.userId)
            if db.get(User, cand_id):
                user_id = cand_id
        except ValueError:
            user_id = None
    
    if not user_id:
        user_id = GUEST_USER_ID

    progress = db.exec(
        select(QuizProgress)
        .where(or_(QuizProgress.user_id == user_id, QuizProgress.user_id == GUEST_USER_ID))
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

    for q in test.questions:
        q_id_str = str(q.id)
        
        # Retrieve user answer by question UUID, text, or index
        user_ans = submitted_answers.get(q_id_str)
        user_ans_text = submitted_answers.get(f"{q_id_str}_text") or submitted_answers.get(f"{q_id_str}_val")

        if user_ans is None and progress and progress.randomized_question_ids:
            try:
                random_idx = progress.randomized_question_ids.index(q_id_str)
                user_ans = submitted_answers.get(str(random_idx))
                if user_ans_text is None:
                    user_ans_text = submitted_answers.get(f"{random_idx}_text")
            except ValueError:
                pass

        is_correct = False
        selected_option_original = None

        correct_text = ""
        if 0 <= q.correct_option_index < len(q.options):
            correct_text = str(q.options[q.correct_option_index]).strip().lower()

        # Strategy 1: Direct text match of selected option vs correct option in DB
        if user_ans_text and correct_text:
            if str(user_ans_text).strip().lower() == correct_text:
                is_correct = True
                selected_option_original = q.correct_option_index

        # Strategy 2: Numeric index evaluation with option un-shuffling
        if not is_correct and user_ans is not None:
            try:
                user_ans_int = int(user_ans)
            except (ValueError, TypeError):
                user_ans_int = None

            if user_ans_int is not None:
                selected_option_original = user_ans_int
                
                # Un-shuffle option index if option map is recorded
                if progress and progress.randomized_options_map and q_id_str in progress.randomized_options_map:
                    opt_map = progress.randomized_options_map[q_id_str]
                    try:
                        selected_option_original = opt_map[user_ans_int]
                    except (IndexError, KeyError):
                        selected_option_original = user_ans_int

                # Check index equality
                if selected_option_original == q.correct_option_index:
                    is_correct = True
                elif 0 <= selected_option_original < len(q.options):
                    sel_text = str(q.options[selected_option_original]).strip().lower()
                    if sel_text == correct_text:
                        is_correct = True
            else:
                # String value submitted in answers
                if str(user_ans).strip().lower() == correct_text:
                    is_correct = True
                    selected_option_original = q.correct_option_index

        if is_correct:
            score += 1

        metrics.append({
            "question_id": q_id_str,
            "question_text": q.question_text,
            "selected_option": selected_option_original,
            "correct_option": q.correct_option_index,
            "is_correct": is_correct
        })

    is_disqualified = tab_switches >= 3 or fs_exits >= 5 or (getattr(payload, "disqualified", False) is True)

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
        disqualified=is_disqualified
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
        "disqualified": is_disqualified,
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
