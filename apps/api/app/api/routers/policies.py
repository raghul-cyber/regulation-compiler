import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.core.auth import require_role
from app.models.organizations import User, RoleEnum
from app.models.requirements import Policy, PolicyStatusEnum, Requirement, ValidationStatusEnum
from app.models.regulations import RegulationVersion, Regulation

router = APIRouter(tags=["Policies"])

@router.get("/policies")
def list_policies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer, RoleEnum.developer]))
):
    policies = db.query(Policy).filter(Policy.org_id == current_user.org_id).all()
    
    result = []
    for p in policies:
        # Fetch metrics
        reqs = db.query(Requirement).filter(Requirement.id.in_(p.requirement_ids)).all()
        severity_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        for r in reqs:
            severity_counts[r.severity.value] += 1
            
        reg_version = db.query(RegulationVersion).filter(RegulationVersion.id == p.regulation_version_id).first()
        reg_name = "Unknown"
        if reg_version:
            reg = db.query(Regulation).filter(Regulation.id == reg_version.regulation_id).first()
            if reg:
                reg_name = reg.name
                
        result.append({
            "id": p.id,
            "regulation_name": reg_name,
            "status": p.status.value,
            "deployed_at": p.deployed_at,
            "total_requirements": len(reqs),
            "severity_breakdown": severity_counts
        })
        
    return {"data": result}

@router.post("/policies")
def create_policy(
    request: Request,
    payload: Dict[str, Any], # expecting {"regulation_version_id": "uuid"}
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer]))
):
    reg_ver_id_str = payload.get("regulation_version_id")
    if not reg_ver_id_str:
        raise HTTPException(status_code=400, detail="regulation_version_id is required")
        
    try:
        reg_ver_id = uuid.UUID(reg_ver_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    # Fetch all approved requirements for this version
    reqs = db.query(Requirement).filter(
        Requirement.regulation_version_id == reg_ver_id,
        Requirement.validation_status == ValidationStatusEnum.approved
    ).all()
    
    if not reqs:
        raise HTTPException(status_code=400, detail="No approved requirements found for this regulation version.")
        
    req_ids = [r.id for r in reqs]
    
    policy = Policy(
        org_id=current_user.org_id,
        regulation_version_id=reg_ver_id,
        requirement_ids=req_ids,
        status=PolicyStatusEnum.deployed,
        deployed_at=datetime.utcnow()
    )
    
    db.add(policy)
    db.commit()
    db.refresh(policy)
    
    return {"data": {"id": policy.id, "status": policy.status.value, "requirements_count": len(req_ids)}}

