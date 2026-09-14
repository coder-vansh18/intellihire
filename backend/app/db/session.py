import uuid
from sqlmodel import SQLModel, create_engine, Session, select, text
from sqlalchemy import inspect
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL, 
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

GUEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000099")
SUPER_ADMIN_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
SKIT_ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000010")
SKIT_ADMIN_ID = uuid.UUID("00000000-0000-0000-0000-000000000011")
SKIT_PROF_ID = uuid.UUID("00000000-0000-0000-0000-000000000012")
SKIT_STUDENT_ID = uuid.UUID("00000000-0000-0000-0000-000000000013")

IITD_ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000020")
IITD_ADMIN_ID = uuid.UUID("00000000-0000-0000-0000-000000000021")
IITD_PROF_ID = uuid.UUID("00000000-0000-0000-0000-000000000022")
IITD_STUDENT_ID = uuid.UUID("00000000-0000-0000-0000-000000000023")

def auto_migrate_database():
    """Auto-migrate schema changes seamlessly without manual DDL migrations"""
    is_sqlite = "sqlite" in settings.DATABASE_URL
    inspector = inspect(engine)
    
    with engine.connect() as conn:
        # Check users table columns
        if inspector.has_table("users"):
            user_cols = {col["name"] for col in inspector.get_columns("users")}
            new_user_cols = {
                "organization_id": "VARCHAR(36)" if is_sqlite else "CHAR(36)",
                "must_change_password": "BOOLEAN DEFAULT 0",
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
            if "organization_id" not in test_cols:
                conn.execute(text(f"ALTER TABLE tests ADD COLUMN organization_id {'VARCHAR(36)' if is_sqlite else 'CHAR(36)'} NULL"))
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
    from app.models.organization import Organization
    from app.models.user import User
    from app.core.security import hash_password

    with Session(engine) as session:
        # 1. Platform Super Admin (Master Platform Administrator)
        super_admin = session.exec(select(User).where(User.email == "superadmin@intellihire.ai")).first()
        if not super_admin:
            super_admin = User(
                id=SUPER_ADMIN_ID,
                name="Master Super Administrator",
                email="superadmin@intellihire.ai",
                password_hash=hash_password("super123"),
                role="super_admin",
                branch="Platform Engineering",
                year="Executive",
                section="Master",
                roll_number="ROOT-01",
                bio="IntelliHire Global Multi-Tenant Master Administrator"
            )
            session.add(super_admin)
        else:
            super_admin.role = "super_admin"
            super_admin.password_hash = hash_password("super123")
            session.add(super_admin)

        # 2. Organization 1: SKIT College (domain: skit.ac.in)
        skit_org = session.get(Organization, SKIT_ORG_ID)
        if not skit_org:
            skit_org = Organization(
                id=SKIT_ORG_ID,
                name="Swami Keshvanand Institute of Technology (SKIT)",
                code="SKIT",
                domain="skit.ac.in",
                is_active=True
            )
            session.add(skit_org)

        # SKIT Org Admin
        skit_admin = session.exec(select(User).where(User.email == "admin@skit.ac.in")).first()
        if not skit_admin:
            skit_admin = User(
                id=SKIT_ADMIN_ID,
                organization_id=SKIT_ORG_ID,
                name="SKIT College Administrator",
                email="admin@skit.ac.in",
                password_hash=hash_password("skitadmin123"),
                role="admin",
                branch="Institutional Administration",
                year="Admin Cell",
                section="Head",
                roll_number="SKIT-ADM-01",
                bio="Lead Institutional Administrator for SKIT Jaipur"
            )
            session.add(skit_admin)
        else:
            skit_admin.organization_id = SKIT_ORG_ID
            skit_admin.role = "admin"
            skit_admin.password_hash = hash_password("skitadmin123")
            session.add(skit_admin)

        # SKIT Professor
        skit_prof = session.exec(select(User).where(User.email == "prof.sharma@skit.ac.in")).first()
        if not skit_prof:
            skit_prof = User(
                id=SKIT_PROF_ID,
                organization_id=SKIT_ORG_ID,
                name="Prof. R.K. Sharma",
                email="prof.sharma@skit.ac.in",
                password_hash=hash_password("skitprof123"),
                role="company",
                branch="Computer Science & Engineering",
                year="Faculty Lead",
                section="Department Chair",
                roll_number="SKIT-FAC-01",
                bio="Professor of Computer Science & Assessment Coordinator at SKIT"
            )
            session.add(skit_prof)
        else:
            skit_prof.organization_id = SKIT_ORG_ID
            skit_prof.role = "company"
            skit_prof.password_hash = hash_password("skitprof123")
            session.add(skit_prof)

        # SKIT Student
        skit_student = session.exec(select(User).where(User.email == "b241187@skit.ac.in")).first()
        if not skit_student:
            skit_student = User(
                id=SKIT_STUDENT_ID,
                organization_id=SKIT_ORG_ID,
                name="Priyanshu Verma",
                email="b241187@skit.ac.in",
                password_hash=hash_password("skitstudent123"),
                role="student",
                branch="Computer Science & Engineering",
                year="3rd Year",
                section="Section A",
                roll_number="b241187",
                bio="B.Tech CSE Student at SKIT Jaipur"
            )
            session.add(skit_student)
        else:
            skit_student.organization_id = SKIT_ORG_ID
            skit_student.role = "student"
            skit_student.password_hash = hash_password("skitstudent123")
            session.add(skit_student)

        # 3. Organization 2: IIT Delhi (domain: iitd.ac.in)
        iitd_org = session.get(Organization, IITD_ORG_ID)
        if not iitd_org:
            iitd_org = Organization(
                id=IITD_ORG_ID,
                name="Indian Institute of Technology Delhi (IITD)",
                code="IITD",
                domain="iitd.ac.in",
                is_active=True
            )
            session.add(iitd_org)

        # IITD Admin
        iitd_admin = session.exec(select(User).where(User.email == "admin@iitd.ac.in")).first()
        if not iitd_admin:
            iitd_admin = User(
                id=IITD_ADMIN_ID,
                organization_id=IITD_ORG_ID,
                name="IITD Assessment Admin",
                email="admin@iitd.ac.in",
                password_hash=hash_password("iitdadmin123"),
                role="admin",
                branch="Dean Office",
                year="Administration",
                section="Academics",
                roll_number="IITD-ADM-01",
                bio="Assessment Portal Administrator at IIT Delhi"
            )
            session.add(iitd_admin)
        else:
            iitd_admin.organization_id = IITD_ORG_ID
            iitd_admin.role = "admin"
            iitd_admin.password_hash = hash_password("iitdadmin123")
            session.add(iitd_admin)

        # IITD Professor
        iitd_prof = session.exec(select(User).where(User.email == "prof.verma@iitd.ac.in")).first()
        if not iitd_prof:
            iitd_prof = User(
                id=IITD_PROF_ID,
                organization_id=IITD_ORG_ID,
                name="Dr. Sunita Verma",
                email="prof.verma@iitd.ac.in",
                password_hash=hash_password("iitdprof123"),
                role="company",
                branch="Computer Science & Engineering",
                year="Faculty Lead",
                section="AI Lab",
                roll_number="IITD-FAC-01",
                bio="Head of AI & Algorithms Evaluation Cell at IIT Delhi"
            )
            session.add(iitd_prof)
        else:
            iitd_prof.organization_id = IITD_ORG_ID
            iitd_prof.role = "company"
            iitd_prof.password_hash = hash_password("iitdprof123")
            session.add(iitd_prof)

        # IITD Student
        iitd_student = session.exec(select(User).where(User.email == "cs2026@iitd.ac.in")).first()
        if not iitd_student:
            iitd_student = User(
                id=IITD_STUDENT_ID,
                organization_id=IITD_ORG_ID,
                name="Ananya Sharma",
                email="cs2026@iitd.ac.in",
                password_hash=hash_password("iitdstudent123"),
                role="student",
                branch="Computer Science & Engineering",
                year="4th Year",
                section="Section A",
                roll_number="2026CS901",
                bio="Computer Science undergraduate at IIT Delhi"
            )
            session.add(iitd_student)
        else:
            iitd_student.organization_id = IITD_ORG_ID
            iitd_student.role = "student"
            iitd_student.password_hash = hash_password("iitdstudent123")
            session.add(iitd_student)

        # Backward compatibility for generic testing accounts:
        # Generic Professor
        gen_prof = session.exec(select(User).where(User.email == "professor@intellihire.ai")).first()
        if gen_prof:
            gen_prof.organization_id = SKIT_ORG_ID
            session.add(gen_prof)

        # Generic Student
        gen_student = session.exec(select(User).where(User.email == "student@intellihire.ai")).first()
        if gen_student:
            gen_student.organization_id = SKIT_ORG_ID
            session.add(gen_student)

        # Generic Admin
        gen_admin = session.exec(select(User).where(User.email == "admin@intellihire.ai")).first()
        if gen_admin:
            gen_admin.organization_id = SKIT_ORG_ID
            session.add(gen_admin)

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
