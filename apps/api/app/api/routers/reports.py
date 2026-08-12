import uuid
import os
import boto3
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.db.session import get_db
from app.models.organizations import User, RoleEnum
from app.models.regulations import Regulation
from app.models.requirements import Requirement
from app.models.audit import Report, ReportTypeEnum, ReportStatusEnum
from app.core.auth import require_role
from app.services.reporting import generate_pdf_report_task, s3, BUCKET_NAME

router = APIRouter()

# --- Export JSON ---

@router.get("/regulations/{regulation_id}/requirements/export")
def export_requirements(
    regulation_id: uuid.UUID,
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer, RoleEnum.legal_counsel, RoleEnum.developer])),
    db: Session = Depends(get_db)
):
    reg = db.query(Regulation).filter(Regulation.id == regulation_id).first()
    if not reg or not reg.current_version_id:
        raise HTTPException(status_code=404, detail="Regulation not found")

    reqs = db.query(Requirement).filter(
        Requirement.regulation_version_id == reg.current_version_id,
        Requirement.validation_status == "approved"
    ).all()

    export_data = []
    for r in reqs:
        export_data.append({
            "id": str(r.id),
            "regulation": reg.title,
            "article": r.reference_label,
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
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer, RoleEnum.legal_counsel])),
    db: Session = Depends(get_db)
):
    reg = db.query(Regulation).filter(Regulation.id == payload.regulation_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Regulation not found")

    report = Report(
        org_id=current_user.org_id,
        regulation_id=payload.regulation_id,
        report_type=payload.report_type,
        status=ReportStatusEnum.generating,
        generated_at=func.now() if hasattr(func, 'now') else None # Will be set by db
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Trigger Celery Task
    generate_pdf_report_task.delay(str(report.id))

    return {"message": "Report generation started", "report_id": str(report.id)}

@router.get("/reports/{regulation_id}")
def list_reports(
    regulation_id: uuid.UUID,
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer, RoleEnum.legal_counsel, RoleEnum.developer])),
    db: Session = Depends(get_db)
):
    reports = db.query(Report).filter(
        Report.regulation_id == regulation_id
    ).order_by(Report.generated_at.desc()).all()

    data = []
    for r in reports:
        download_url = None
        if r.status == ReportStatusEnum.completed and r.storage_path:
            # Generate presigned URL valid for 1 hour
            try:
                download_url = s3.generate_presigned_url(
                    ClientMethod='get_object',
                    Params={
                        'Bucket': BUCKET_NAME,
                        'Key': r.storage_path,
                        'ResponseContentDisposition': f'attachment; filename="report_{r.report_type.value}.pdf"'
                    },
                    ExpiresIn=3600
                )
            except Exception as e:
                print(f"Failed to generate presigned URL: {e}")
                
        data.append({
            "id": str(r.id),
            "report_type": r.report_type.value if hasattr(r.report_type, 'value') else r.report_type,
            "status": r.status.value if hasattr(r.status, 'value') else r.status,
            "generated_at": r.generated_at.isoformat(),
            "download_url": download_url
        })
        
    return {"data": data}
