import os
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:5432/regulation_db")

# Lean, memory-efficient connection pool configuration
# Defaults to 5 connections + 5 burst to stay well under 512MB RAM and avoid Supabase pooler exhaustion
if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )
else:
    db_pool_size = int(os.getenv("DB_POOL_SIZE", "5"))
    db_max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "5"))
    db_pool_timeout = float(os.getenv("DB_POOL_TIMEOUT", "15.0"))
    db_pool_recycle = int(os.getenv("DB_POOL_RECYCLE", "300"))

    engine = create_engine(
        DATABASE_URL,
        pool_size=db_pool_size,
        max_overflow=db_max_overflow,
        pool_timeout=db_pool_timeout,
        pool_pre_ping=True,
        pool_recycle=db_pool_recycle,
        pool_use_lifo=True  # Reuse recently used connections to allow excess idle connections to close
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
