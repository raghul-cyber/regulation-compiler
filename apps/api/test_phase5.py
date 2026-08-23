import os
import sys
import uuid
import json
import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup DB connection
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), '..', '..')))
# Just use raw psycopg2 or sqlalchemy directly to query
engine = create_engine("postgresql://postgres:postgres@localhost:5432/postgres")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

API_URL = "http://localhost:8000/api/v1"
ADMIN_TOKEN = None

# We need a token first
# In test_api.py earlier I didn't pass a token, so I got 401. I need to bypass auth or generate a token, or just do the logic directly via python script on the database/services.
