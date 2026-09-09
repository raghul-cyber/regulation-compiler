import uuid
import os
import re
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.db.session import get_db
from app.models.organizations import User, RoleEnum, Organization
from app.models.regulations import Regulation, RegulationVersion
from app.models.requirements import Requirement
from app.models.audit import Report, ReportTypeEnum, ReportStatusEnum
from app.models.jobs import BackgroundJob, JobTypeEnum, JobStatusEnum
from app.core.auth import get_optional_current_user
from app.services.reporting import generate_pdf_report_task
from app.services.storage import StorageService

logger = logging.getLogger(__name__)
router = APIRouter()

# --- Export JSON ---

@router.get("/regulations/{regulation_id}/requirements/export")
def export_requirements(
    regulation_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    reg = db.query(Regulation).filter(Regulation.id == regulation_id).first()
    if not reg:
        ver = db.query(RegulationVersion).filter(RegulationVersion.id == regulation_id).first()
        if ver:
            reg = db.query(Regulation).filter(Regulation.id == ver.regulation_id).first()
    if not reg or not reg.current_version_id:
        raise HTTPException(status_code=404, detail="Regulation not found")

    reqs = db.query(Requirement).filter(
        Requirement.regulation_version_id == reg.current_version_id
    ).all()

    export_data = []
    for r in reqs:
        citation = "Article"
        if r.references and isinstance(r.references, dict):
            citation = r.references.get("clause") or citation
        if citation == "Article" and r.meta_data and isinstance(r.meta_data, dict):
            citation = r.meta_data.get("clause_ref") or citation

        export_data.append({
            "id": str(r.id),
            "regulation": reg.name,
            "article": citation,
            "title": r.title,
            "type": r.type.value if hasattr(r.type, 'value') else r.type,
            "description": r.description,
            "conditions": r.conditions,
            "actions": r.actions,
            "severity": r.severity.value if hasattr(r.severity, 'value') else r.severity,
            "evidence_required": r.evidence_required,
            "references": r.references
        })
        
    return export_data

# --- PDF Reports ---

class ReportCreate(BaseModel):
    regulation_id: uuid.UUID
    report_type: ReportTypeEnum

@router.post("/reports")
def create_report(
    payload: ReportCreate,
    background_tasks: BackgroundTasks,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    reg = db.query(Regulation).filter(Regulation.id == payload.regulation_id).first()
    if not reg:
        ver = db.query(RegulationVersion).filter(RegulationVersion.id == payload.regulation_id).first()
        if ver:
            reg = db.query(Regulation).filter(Regulation.id == ver.regulation_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Regulation not found")

    # Determine organization
    org_id = current_user.org_id if current_user else None
    if not org_id:
        org = db.query(Organization).first()
        org_id = org.id if org else uuid.UUID('c2edd90d-0521-415c-b333-70769fba8df5')

    report = Report(
        org_id=org_id,
        regulation_id=reg.id,
        report_type=payload.report_type,
        status=ReportStatusEnum.generating
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    job = BackgroundJob(
        job_type=JobTypeEnum.report,
        status=JobStatusEnum.queued,
        entity_id=str(report.id)
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Attempt Celery task dispatch with reliable BackgroundTasks fallback
    dispatched = False
    try:
        task = generate_pdf_report_task.delay(str(report.id), str(job.id))
        job.task_id = task.id
        db.commit()
        dispatched = True
        logger.info(f"Dispatched Celery task {task.id} for report {report.id}")
    except Exception as exc:
        logger.warning(f"Celery dispatch failed ({exc}). Falling back to asynchronous BackgroundTasks.")
        
    if not dispatched:
        background_tasks.add_task(generate_pdf_report_task, str(report.id), str(job.id))

    return {
        "message": "Report generation started",
        "report_id": str(report.id),
        "job_id": str(job.id)
    }

@router.get("/reports/{regulation_id}")
def list_reports(
    regulation_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    reg = db.query(Regulation).filter(Regulation.id == regulation_id).first()
    if not reg:
        ver = db.query(RegulationVersion).filter(RegulationVersion.id == regulation_id).first()
        if ver:
            reg = db.query(Regulation).filter(Regulation.id == ver.regulation_id).first()
    target_id = reg.id if reg else regulation_id

    reports = db.query(Report).filter(
        Report.regulation_id == target_id
    ).order_by(Report.generated_at.desc()).all()

    data = []
    for r in reports:
        download_url = None
        if r.status == ReportStatusEnum.completed and r.storage_path:
            download_url = f"http://127.0.0.1:8080/api/v1/reports/{r.id}/download"
                
        data.append({
            "id": str(r.id),
            "report_type": r.report_type.value if hasattr(r.report_type, 'value') else r.report_type,
            "status": r.status.value if hasattr(r.status, 'value') else r.status,
            "generated_at": r.generated_at.isoformat() if r.generated_at else None,
            "download_url": download_url
        })
        
    return {"data": data}

@router.get("/reports/download-by-path")
def download_by_path(
    path: str,
    db: Session = Depends(get_db)
):
    storage = StorageService()
    try:
        pdf_bytes = storage.get_file_bytes(path)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"File not found: {e}")
        
    filename = path.split("/")[-1] if "/" in path else path
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.get("/reports/{report_id}/download")
def download_report(
    report_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report or not report.storage_path:
        raise HTTPException(status_code=404, detail="Report not found or not yet generated")
        
    if report.status != ReportStatusEnum.completed:
        raise HTTPException(status_code=400, detail=f"Report is currently in status: {report.status}")
        
    storage = StorageService()
    try:
        pdf_bytes = storage.get_file_bytes(report.storage_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read report PDF: {e}")
        
    reg = db.query(Regulation).filter(Regulation.id == report.regulation_id).first()
    clean_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', (reg.name if reg else "regulation").lower())[:30]
    type_str = report.report_type.value if hasattr(report.report_type, 'value') else str(report.report_type)
    filename = f"{clean_name}_{type_str}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
