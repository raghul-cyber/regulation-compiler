import os
import sys

# 1. Update jobs.py
jobs_path = r"app\models\jobs.py"
with open(jobs_path, "r", encoding="utf-8") as f:
    jobs_content = f.read()

if "class JobEvent(" not in jobs_content:
    jobs_content += """

class JobEvent(BaseModel):
    __tablename__ = "job_events"

    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("background_jobs.id", ondelete="CASCADE"), index=True, nullable=False)
    stage_number: Mapped[int] = mapped_column(nullable=False)
    stage_name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False) # "started", "completed", "failed"
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
"""
    with open(jobs_path, "w", encoding="utf-8") as f:
        f.write(jobs_content)

# 2. Sync DB Schema
from app.db.base import Base
from app.db.session import engine
import app.models.jobs
Base.metadata.create_all(bind=engine)
print("DB Schema Synced (JobEvent created)")
