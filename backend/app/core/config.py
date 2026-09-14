import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "IntelliHire API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "intellihire_super_secret_jwt_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./intellihire.db"
    )
    SEED_DEMO_DATA: bool = os.getenv("SEED_DEMO_DATA", "false").lower() == "true"

    class Config:
        env_file = ".env"

settings = Settings()
