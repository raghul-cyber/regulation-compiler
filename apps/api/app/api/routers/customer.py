from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import uuid
from typing import List, Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.core.auth import require_role
from app.models.organizations import RoleEnum, User
from app.models.customer import CustomerSystem, CustomerControl, CustomerEvidence

router = APIRouter(tags=["customer"])

class SystemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    system_type: Optional[str] = None

class ControlCreate(BaseModel):
    name: str
    description: Optional[str] = None
    control_type: Optional[str] = None
    system_id: Optional[uuid.UUID] = None

@router.post("/v1/customer/systems")
def create_system(
    payload: SystemCreate,
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer])),
    db: Session = Depends(get_db)
):
    sys = CustomerSystem(
        org_id=current_user.org_id,
        name=payload.name,
        description=payload.description,
        system_type=payload.system_type
    )
    db.add(sys)
    db.commit()
    db.refresh(sys)
    return sys

@router.post("/v1/customer/controls")
def create_control(
    payload: ControlCreate,
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer])),
    db: Session = Depends(get_db)
):
    ctrl = CustomerControl(
        org_id=current_user.org_id,
        system_id=payload.system_id,
        name=payload.name,
        description=payload.description,
        control_type=payload.control_type
    )
    db.add(ctrl)
    db.commit()
    db.refresh(ctrl)
    return ctrl

@router.post("/v1/customer/controls/{control_id}/evidence")
def upload_evidence(
    control_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer])),
    db: Session = Depends(get_db)
):
    ctrl = db.query(CustomerControl).filter(CustomerControl.id == control_id, CustomerControl.org_id == current_user.org_id).first()
    if not ctrl:
        raise HTTPException(status_code=404, detail="Control not found")
        
    from app.services.storage import StorageService
    storage_service = StorageService()
    
    try:
        storage_path = storage_service.upload_file(file.file, file.filename, file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to upload evidence file")
    
    evidence = CustomerEvidence(
        org_id=current_user.org_id,
        control_id=ctrl.id,
        file_name=file.filename,
        storage_path=storage_path
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return evidence
