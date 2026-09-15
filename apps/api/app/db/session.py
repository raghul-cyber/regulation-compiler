import os
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:5432/regulation_db")

# High-concurrency connection pool configuration
engine = create_engine(
    DATABASE_URL,
    pool_size=30,          # Support up to 30 steady connections
    max_overflow=20,       # Allow burst up to 50 concurrent connections
    pool_timeout=10.0,     # Fail fast if pool exhausted
    pool_pre_ping=True,    # Automatically heal stale connections
    pool_recycle=300       # Recycle connections every 5 minutes
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
