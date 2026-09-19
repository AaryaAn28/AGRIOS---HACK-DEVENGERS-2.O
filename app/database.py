import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

DATABASE_URL = settings.DATABASE_URL
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    connect_args = {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def ensure_schema():
    """Ensures all tables exist and runs lightweight schema migration for SQLite."""
    Base.metadata.create_all(bind=engine)
    if DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            try:
                res = conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()
                existing_cols = [r[1] for r in res]
                if "persona_code" not in existing_cols:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN persona_code VARCHAR(40)")
                if "registered_by_id" not in existing_cols:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN registered_by_id VARCHAR(64)")
                if "has_completed_onboarding" not in existing_cols:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT 1")
                conn.commit()
            except Exception as e:
                print(f"[Schema Migration Note] {e}")
