import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "AGRIOS - Agricultural Operating System")
    API_VERSION: str = os.getenv("API_VERSION", "v1")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./agrios_god.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "agrios-dev-secret-key-2026-hackdevengers")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    CORS_ORIGINS: list = ["*"]
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

settings = Settings()
