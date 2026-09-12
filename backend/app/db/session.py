import uuid
from sqlmodel import SQLModel, create_engine, Session, select, text
from sqlalchemy import inspect
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL, 
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

GUEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
PROFESSOR_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")
STUDENT_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000003")

def auto_migrate_database():
    """Auto-migrate schema changes seamlessly without manual DDL migrations"""
    is_sqlite = "sqlite" in settings.DATABASE_URL
    inspector = inspect(engine)
    
    with engine.connect() as conn:
        # Check users table columns
        if inspector.has_table("users"):
            user_cols = {col["name"] for col in inspector.get_columns("users")}
            new_user_cols = {
                "branch": "TEXT" if is_sqlite else "VARCHAR(255)",
                "year": "TEXT" if is_sqlite else "VARCHAR(255)",
                "section": "TEXT" if is_sqlite else "VARCHAR(255)",
                "roll_number": "TEXT" if is_sqlite else "VARCHAR(255)",
                "bio": "TEXT" if is_sqlite else "TEXT",
                "session_id": "VARCHAR(36)" if is_sqlite else "CHAR(36)"
            }
            for col_name, col_type in new_user_cols.items():
                if col_name not in user_cols:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))

        # Check tests table columns
        if inspector.has_table("tests"):
            test_cols = {col["name"] for col in inspector.get_columns("tests")}
            if "is_public" not in test_cols:
                conn.execute(text("ALTER TABLE tests ADD COLUMN is_public BOOLEAN DEFAULT 0"))
            if "expires_at" not in test_cols:
                conn.execute(text("ALTER TABLE tests ADD COLUMN expires_at DATETIME NULL"))

        # Check test_assignments table columns
        if inspector.has_table("test_assignments"):
            assign_cols = {col["name"] for col in inspector.get_columns("test_assignments")}
            new_assign_cols = {
                "branch": "TEXT" if is_sqlite else "VARCHAR(255)",
                "year": "TEXT" if is_sqlite else "VARCHAR(255)",
                "section": "TEXT" if is_sqlite else "VARCHAR(255)"
            }
            for col_name, col_type in new_assign_cols.items():
                if col_name not in assign_cols:
                    conn.execute(text(f"ALTER TABLE test_assignments ADD COLUMN {col_name} {col_type}"))

def ensure_default_accounts():
    from app.models.user import User
    from app.core.security import hash_password
    with Session(engine) as session:
        # 1. Guest Account
        guest = session.get(User, GUEST_USER_ID)
        if not guest:
            guest = User(
                id=GUEST_USER_ID,
                name="Guest Student",
                email="guest@intellihire.ai",
                password_hash=hash_password("guest123"),
                role="student",
                branch="Computer Science & Engineering",
                year="3rd Year",
                section="Section A",
                bio="Guest evaluation account"
            )
            session.add(guest)

        # 2. Professor / Recruiter Default Account
        prof = session.exec(select(User).where(User.email == "professor@intellihire.ai")).first()
        if not prof:
            prof = User(
                id=PROFESSOR_USER_ID,
                name="Prof. Alan Turing",
                email="professor@intellihire.ai",
                password_hash=hash_password("prof123"),
                role="company",
                branch="Computer Science & Engineering",
                year="Faculty / Placement Cell",
                section="Faculty Lead",
                roll_number="FAC-2026-CS01",
                bio="Head of Assessments & Academic Placement Evaluation"
            )
            session.add(prof)
        else:
            prof.role = "company"
            prof.password_hash = hash_password("prof123")
            session.add(prof)

        # 3. Student Default Account
        student = session.exec(select(User).where(User.email == "student@intellihire.ai")).first()
        if not student:
            student = User(
                id=STUDENT_USER_ID,
                name="Alex Johnson",
                email="student@intellihire.ai",
                password_hash=hash_password("student123"),
                role="student",
                branch="Computer Science & Engineering",
                year="3rd Year",
                section="Section A",
                roll_number="2026CS101",
                bio="Computer Science undergraduate aspiring full-stack software engineer"
            )
            session.add(student)
        else:
            student.role = "student"
            student.password_hash = hash_password("student123")
            session.add(student)

        try:
            session.commit()
        except Exception as e:
            session.rollback()
            print(f"Default user seeding note: {e}")

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    try:
        auto_migrate_database()
    except Exception as e:
        print(f"Auto-migration note: {e}")
    try:
        ensure_default_accounts()
    except Exception as e:
        print(f"Default accounts provisioning note: {e}")

def get_session():
    with Session(engine) as session:
        yield session
