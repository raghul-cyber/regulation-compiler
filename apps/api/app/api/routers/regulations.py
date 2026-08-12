from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid

from app.db.session import get_db
from app.core.auth import require_role
from app.models.organizations import RoleEnum, User
from app.models.regulations import Regulation, RegulationVersion, SourceDocument, FileTypeEnum
from app.services.storage import StorageService

router = APIRouter(tags=["regulations"])
storage_service = StorageService()

@router.post("/upload")
async def upload_regulation(
    file: UploadFile = File(...),
    jurisdiction: str = Form(...),
    name: str = Form(...),
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer])),
    db: Session = Depends(get_db)
):
    # Validate file extension
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    if ext == 'pdf':
        file_type = FileTypeEnum.pdf
    elif ext in ['htm', 'html']:
        file_type = FileTypeEnum.html
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and HTML files are supported."
        )

    # 1. Upload file to S3
    try:
        storage_path = storage_service.upload_file(file.file, file.filename, file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to upload file")

    # 2. Create Regulation
    regulation = Regulation(
        name=name,
        jurisdiction=jurisdiction,
        source_url=f"s3://{storage_path}",  # Placeholder for original URL
    )
    db.add(regulation)
    db.flush()

    # 3. Create SourceDocument first since its regulation_version_id is nullable
    source_doc = SourceDocument(
        file_type=file_type,
        storage_path=storage_path,
        raw_text="",
        ocr_used=False,
        page_count=0
    )
    db.add(source_doc)
    db.flush()

    # 4. Create RegulationVersion linked to SourceDocument
    version = RegulationVersion(
        regulation_id=regulation.id,
        version_label="v1",
        published_date=datetime.now(timezone.utc).date(),
        ingested_at=datetime.now(timezone.utc),
        source_document_id=source_doc.id
    )
    db.add(version)
    db.flush()
    
    # 5. Link SourceDocument back to RegulationVersion
    source_doc.regulation_version_id = version.id
    
    # Update regulation's current version
    regulation.current_version_id = version.id
    
    db.commit()

    # Phase 14: Enqueue real Celery task
    from app.models.jobs import BackgroundJob, JobTypeEnum
    job = BackgroundJob(
        job_type=JobTypeEnum.ingestion,
        entity_id=str(version.id)
    )
    db.add(job)
    db.commit()

    from app.workers.tasks import process_ingestion_pipeline
    task = process_ingestion_pipeline.delay(str(job.id), str(source_doc.id))
    
    job.task_id = task.id
    db.commit()

    return {
        "regulation_version_id": str(version.id),
        "job_id": str(job.id)
    }

@router.post("/{regulation_id}/amend")
async def amend_regulation(
    regulation_id: uuid.UUID,
    file: UploadFile = File(...),
    version_label: str = Form(...),
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer])),
    db: Session = Depends(get_db)
):
    reg = db.query(Regulation).filter(Regulation.id == regulation_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Regulation not found")

    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    if ext == 'pdf':
        file_type = FileTypeEnum.pdf
    elif ext in ['htm', 'html']:
        file_type = FileTypeEnum.html
    else:
        raise HTTPException(status_code=400, detail="Only PDF and HTML supported.")

    try:
        storage_path = storage_service.upload_file(file.file, file.filename, file.content_type)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to upload file")

    source_doc = SourceDocument(
        file_type=file_type,
        storage_path=storage_path,
        raw_text="",
        ocr_used=False,
        page_count=0
    )
    db.add(source_doc)
    db.flush()

    new_version = RegulationVersion(
        regulation_id=regulation_id,
        version_label=version_label,
        published_date=datetime.now(timezone.utc).date(),
        ingested_at=datetime.now(timezone.utc),
        source_document_id=source_doc.id
    )
    db.add(new_version)
    db.flush()
    
    # Triggering full pipeline (Phase 5-7). In reality, this dispatches Celery tasks.
    old_version_id = reg.current_version_id
    
    source_doc.regulation_version_id = new_version.id
    reg.current_version_id = new_version.id
    db.commit()

    # Phase 14: Enqueue real Celery task for amendment
    from app.models.jobs import BackgroundJob, JobTypeEnum
    job = BackgroundJob(
        job_type=JobTypeEnum.amendment,
        entity_id=str(new_version.id)
    )
    db.add(job)
    db.commit()

    from app.workers.tasks import process_amendment_pipeline
    task = process_amendment_pipeline.delay(
        str(job.id), 
        str(source_doc.id), 
        str(old_version_id), 
        str(new_version.id)
    )
    
    job.task_id = task.id
    db.commit()

    return {
        "regulation_version_id": str(new_version.id),
        "job_id": str(job.id)
    }

from sqlalchemy import func
from app.models.requirements import Requirement
from app.models.audit import AuditLog
from datetime import timedelta

@router.get("/{regulation_id}/dashboard-summary")
def get_dashboard_summary(
    regulation_id: uuid.UUID,
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer, RoleEnum.legal_counsel, RoleEnum.developer])),
    db: Session = Depends(get_db)
):
    reg = db.query(Regulation).filter(Regulation.id == regulation_id).first()
    if not reg or not reg.current_version_id:
        raise HTTPException(status_code=404, detail="Regulation not found")

    # Aggregate queries
    # Total requirements
    total = db.query(func.count(Requirement.id)).filter(Requirement.regulation_version_id == reg.current_version_id).scalar()
    
    # Types
    obligations = db.query(func.count(Requirement.id)).filter(
        Requirement.regulation_version_id == reg.current_version_id,
        Requirement.type == "obligation"
    ).scalar()
    
    prohibitions = db.query(func.count(Requirement.id)).filter(
        Requirement.regulation_version_id == reg.current_version_id,
        Requirement.type == "prohibition"
    ).scalar()
    
    # High risk
    high_risk = db.query(func.count(Requirement.id)).filter(
        Requirement.regulation_version_id == reg.current_version_id,
        Requirement.severity == "high"
    ).scalar()
    
    # Recent additions (last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent = db.query(func.count(Requirement.id)).filter(
        Requirement.regulation_version_id == reg.current_version_id,
        Requirement.created_at >= seven_days_ago
    ).scalar()
    
    # Severity distribution
    severity_dist = db.query(Requirement.severity, func.count(Requirement.id)).filter(
        Requirement.regulation_version_id == reg.current_version_id
    ).group_by(Requirement.severity).all()
    
    # Status distribution
    status_dist = db.query(Requirement.validation_status, func.count(Requirement.id)).filter(
        Requirement.regulation_version_id == reg.current_version_id
    ).group_by(Requirement.validation_status).all()

    return {
        "total_requirements": total or 0,
        "total_obligations": obligations or 0,
        "total_prohibitions": prohibitions or 0,
        "high_risk_controls": high_risk or 0,
        "recent_additions": recent or 0,
        "severity_distribution": {sev.value: count for sev, count in severity_dist},
        "status_distribution": {stat.value: count for stat, count in status_dist}
    }

@router.get("/{regulation_id}/activity")
def get_recent_activity(
    regulation_id: uuid.UUID,
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer, RoleEnum.legal_counsel, RoleEnum.developer])),
    db: Session = Depends(get_db)
):
    reg = db.query(Regulation).filter(Regulation.id == regulation_id).first()
    if not reg or not reg.current_version_id:
        raise HTTPException(status_code=404, detail="Regulation not found")

    # Fetch recent audit logs for requirements in this version
    activities = db.query(AuditLog, User.email).join(
        User, AuditLog.actor_id == User.id
    ).join(
        Requirement, AuditLog.entity_id == Requirement.id
    ).filter(
        Requirement.regulation_version_id == reg.current_version_id,
        AuditLog.entity_type == "Requirement"
    ).order_by(AuditLog.created_at.desc()).limit(10).all()

    data = []
    for log, email in activities:
        data.append({
            "id": str(log.id),
            "action": log.action,
            "entity_id": str(log.entity_id),
            "metadata": log.metadata_,
            "actor_email": email,
            "timestamp": log.created_at.isoformat()
        })
        
    return {"data": data}
