import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.organizations import User, RoleEnum
from app.core.auth import require_role
from app.models.jobs import BackgroundJob

router = APIRouter(tags=["jobs"])

@router.get("/jobs/{job_id}")
def get_job_status(
    job_id: uuid.UUID,
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.developer, RoleEnum.compliance_officer])),
    db: Session = Depends(get_db)
):
    job = db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return {
        "id": str(job.id),
        "job_type": job.job_type.value if hasattr(job.job_type, 'value') else job.job_type,
        "status": job.status.value if hasattr(job.status, 'value') else job.status,
        "error_details": job.error_details,
        "result_data": job.result_data,
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None
    }
