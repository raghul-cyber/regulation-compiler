import os
import sys

from dotenv import load_dotenv
load_dotenv("../../.env")

from app.db.session import SessionLocal, engine
from app.models.regulations import Regulation

print("Engine URL:", engine.url)
db = SessionLocal()
regs = db.query(Regulation).all()
print("Local query count:", len(regs))
for r in regs:
    print(" -", r.name, "ID:", r.id, "current_version:", r.current_version_id, "created_at:", r.created_at)
db.close()
