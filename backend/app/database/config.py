import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "PayVerify Ethiopia"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "payverify_ethiopia_super_secret_jwt_key_2026_change_in_prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./payverify.db")
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081",
        "http://localhost:19000",
        "http://localhost:19006",
        "*"
    ]
    
    MAX_QR_PAYLOAD_BYTES: int = 8192  # 8KB max to prevent payload DOS
    MAX_REQUESTS_PER_MINUTE: int = 120

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
