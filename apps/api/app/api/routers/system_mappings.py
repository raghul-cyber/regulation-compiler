import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timezone

from app.db.session import get_db
from app.models.organizations import User, RoleEnum
from app.core.auth import require_role
from app.models.requirements import Requirement, SystemMapping, ImpactRecord

router = APIRouter(tags=["system_mappings"])

class SystemMappingCreate(BaseModel):
    system_name: str
    mapped_requirement_ids: List[uuid.UUID]

@router.post("/v1/system-mappings")
def create_system_mapping(
    payload: SystemMappingCreate,
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.developer, RoleEnum.compliance_officer])),
    db: Session = Depends(get_db)
):
    mapping = SystemMapping(
        org_id=current_user.org_id,
        system_name=payload.system_name,
        mapped_requirement_ids=payload.mapped_requirement_ids
    )
    db.add(mapping)
    db.commit()
    db.refresh(mapping)
    
    # Audit Logging
    from app.models.audit import AuditLog
    audit = AuditLog(
        org_id=current_user.org_id,
        actor_id=current_user.id,
        action="CREATE_SYSTEM_MAPPING",
        entity_type="SystemMapping",
        entity_id=mapping.id,
        metadata_={"system_name": mapping.system_name}
    )
    db.add(audit)
    db.commit()
    
    return {
        "message": "System mapping created successfully",
        "id": str(mapping.id)
    }

@router.get("/v1/impacts")
def list_impacts(
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.developer, RoleEnum.compliance_officer])),
    db: Session = Depends(get_db)
):
    # Fetch active impacts joined with system mapping and requirement
    impacts = db.query(ImpactRecord, SystemMapping, Requirement).join(
        SystemMapping, ImpactRecord.system_mapping_id == SystemMapping.id
    ).join(
        Requirement, ImpactRecord.requirement_id == Requirement.id
    ).filter(
        ImpactRecord.org_id == current_user.org_id,
        ImpactRecord.resolved_at == None
    ).order_by(ImpactRecord.created_at.desc()).all()
    
    data = []
    for impact, mapping, req in impacts:
        data.append({
            "id": str(impact.id),
            "system_name": mapping.system_name,
            "requirement_id": str(req.id),
            "requirement_title": req.title,
            "change_type": impact.change_type,
            "severity": impact.severity.value if hasattr(impact.severity, 'value') else impact.severity,
            "created_at": impact.created_at.isoformat()
        })
        
    return {"data": data}

@router.patch("/v1/impacts/{id}/resolve")
def resolve_impact(
    id: uuid.UUID,
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.developer, RoleEnum.compliance_officer])),
    db: Session = Depends(get_db)
):
    impact = db.query(ImpactRecord).filter(ImpactRecord.id == id, ImpactRecord.org_id == current_user.org_id).first()
    if not impact:
        raise HTTPException(status_code=404, detail="Impact record not found")
        
    impact.resolved_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Impact resolved"}
