import os

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./restaurant.db")
COMPANY_CODE = os.getenv("COMPANY_CODE", "STAFF2024")
