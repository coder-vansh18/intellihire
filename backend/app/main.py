from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import create_db_and_tables
from app.routes import auth, tests, quiz, results, admin, super_admin

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "IntelliHire FastAPI Relational Backend API is running 🚀",
        "docs": "/docs"
    }

app.include_router(auth.router)
app.include_router(tests.router)
app.include_router(quiz.router)
app.include_router(results.router)
app.include_router(admin.router)
app.include_router(super_admin.router)
