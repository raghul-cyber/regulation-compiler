import enum
import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB

from .base import BaseModel

class JobStatusEnum(str, enum.Enum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"

class JobTypeEnum(str, enum.Enum):
    ingestion = "ingestion"
    amendment = "amendment"
    report = "report"
    notification = "notification"

class BackgroundJob(BaseModel):
    __tablename__ = "background_jobs"

    task_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    job_type: Mapped[JobTypeEnum] = mapped_column(nullable=False)
    status: Mapped[JobStatusEnum] = mapped_column(default=JobStatusEnum.queued, nullable=False, index=True)
    
    # Using string representations of entity IDs to keep this generic
    entity_id: Mapped[str | None] = mapped_column(String, nullable=True) 
    
    error_details: Mapped[str | None] = mapped_column(String, nullable=True)
    result_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
