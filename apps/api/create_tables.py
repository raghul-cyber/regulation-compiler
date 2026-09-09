import os
import sys

from app.db.session import engine
from app.models.base import Base
import app.models.organizations
import app.models.regulations
import app.models.requirements
import app.models.jobs
import app.models.audit
import app.models.customer

# Create all tables safely via SQLAlchemy metadata
Base.metadata.create_all(bind=engine)
print("Tables and schema types verified successfully.")
