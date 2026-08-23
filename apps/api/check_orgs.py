import os
import sys

sys.path.append(os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models.organizations import Organization

db = SessionLocal()
orgs = db.query(Organization).all()
for org in orgs:
    print(org.id, org.name)
