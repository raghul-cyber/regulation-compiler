import httpx
import time
import json
import uuid
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# DB Setup
engine = create_engine("postgresql://postgres:postgres@localhost:5432/rac_db")
Session = sessionmaker(bind=engine)

API_BASE = "http://127.0.0.1:8080/api/v1"

# Get a test user token (Assuming Clerk dev token logic or we bypass for testing)
# Wait, my endpoints use Clerk `require_role`. For API testing, I have a back-door or I just mocked it previously?
# Let's check how I bypassed auth in Phase 1 or 2 API tests...
