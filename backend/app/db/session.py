import uuid
from sqlalchemy import inspect, text
from sqlmodel import SQLModel, create_engine, Session, select
from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL, 
    echo=False, 
    connect_args=connect_args
)

GUEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")

def auto_migrate_sqlite():
    if not settings.DATABASE_URL.startswith("sqlite"):
        return
    inspector = inspect(engine)
    with engine.begin() as conn:
        # Check users table columns
        if inspector.has_table("users"):
            user_cols = {col["name"] for col in inspector.get_columns("users")}
            new_user_cols = {
                "branch": "TEXT",
                "year": "TEXT",
                "section": "TEXT",
                "roll_number": "TEXT",
                "bio": "TEXT"
            }
            for col_name, col_type in new_user_cols.items():
                if col_name not in user_cols:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))

        # Check tests table columns
        if inspector.has_table("tests"):
            test_cols = {col["name"] for col in inspector.get_columns("tests")}
            if "is_public" not in test_cols:
                conn.execute(text("ALTER TABLE tests ADD COLUMN is_public BOOLEAN DEFAULT 0"))

        # Check test_assignments table columns
        if inspector.has_table("test_assignments"):
            assign_cols = {col["name"] for col in inspector.get_columns("test_assignments")}
            new_assign_cols = {
                "branch": "TEXT",
                "year": "TEXT",
                "section": "TEXT"
            }
            for col_name, col_type in new_assign_cols.items():
                if col_name not in assign_cols:
                    conn.execute(text(f"ALTER TABLE test_assignments ADD COLUMN {col_name} {col_type}"))

def ensure_guest_user():
    from app.models.user import User
    with Session(engine) as session:
        guest = session.get(User, GUEST_USER_ID)
        if not guest:
            guest = User(
                id=GUEST_USER_ID,
                name="Guest Student",
                email="guest@intellihire.ai",
                password_hash="guest_no_login",
                role="student"
            )
            session.add(guest)
            try:
                session.commit()
            except Exception:
                session.rollback()

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    if settings.DATABASE_URL.startswith("sqlite"):
        try:
            auto_migrate_sqlite()
        except Exception as e:
            print(f"Auto-migration note: {e}")
    try:
        ensure_guest_user()
    except Exception as e:
        print(f"Guest user provisioning note: {e}")

def get_session():
    with Session(engine) as session:
        yield session
