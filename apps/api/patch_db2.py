import os
import sys
from sqlalchemy.schema import CreateTable

sys.path.append(os.path.abspath("apps/api"))

from app.models.jobs import JobEvent
from app.db.session import engine

JobEvent.__table__.create(engine, checkfirst=True)
print("DB Schema Synced (JobEvent created)")
