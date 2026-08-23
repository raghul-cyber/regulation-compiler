import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.core.auth import require_role
from app.models.organizations import User, RoleEnum
from app.models.requirements import Policy, ComplianceCheck, Requirement
from app.models.regulations import RegulationVersion, Regulation
from app.services.compliance import evaluate_policy_compliance, remediate_violation

router = APIRouter(tags=["Compliance"])

@router.post("/compliance/evaluate")
def evaluate_compliance(
    request: Request,
    payload: Dict[str, Any], # expecting {"policy_id": "uuid", "system_payload": {...}}
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer, RoleEnum.developer]))
):
    policy_id_str = payload.get("policy_id")
    system_payload = payload.get("system_payload", {})
    
    if not policy_id_str:
        raise HTTPException(status_code=400, detail="policy_id is required")
        
    try:
        policy_id = uuid.UUID(policy_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid policy_id UUID")

    check = evaluate_policy_compliance(db, policy_id, system_payload, current_user.org_id)
    return {"data": {"id": check.id, "result": check.result.value}}

@router.get("/compliance/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer, RoleEnum.developer]))
):
    # Fetch the latest compliance checks for all active policies
    policies = db.query(Policy).filter(Policy.org_id == current_user.org_id, Policy.status == "deployed").all()
    
    compliant_reqs = 0
    non_compliant_reqs = 0
    missing_unknown_reqs = 0
    failing_items = []
    
    for p in policies:
        latest_check = db.query(ComplianceCheck).filter(
            ComplianceCheck.policy_id == p.id
        ).order_by(desc(ComplianceCheck.created_at)).first()
        
        if latest_check:
            for req_id_str, v_data in latest_check.violations.items():
                if v_data.get("status") == "pass":
                    compliant_reqs += 1
                elif v_data.get("status") == "unknown":
                    missing_unknown_reqs += 1
                else:
                    non_compliant_reqs += 1
                    
                if v_data.get("status") != "pass":
                    # Fetch req title for drill-down
                    req = db.query(Requirement).filter(Requirement.id == uuid.UUID(req_id_str)).first()
                    failing_items.append({
                        "requirement_id": req_id_str,
                        "title": req.title if req else "Unknown",
                        "gap_type": v_data.get("gap_type"),
                        "gap_id": v_data.get("gap_id"),
                        "policy_id": p.id
                    })
        else:
            missing_unknown_reqs += len(p.requirement_ids)
            
    return {
        "data": {
            "compliant": compliant_reqs,
            "non_compliant": non_compliant_reqs,
            "missing_unknown": missing_unknown_reqs,
            "failing_items": failing_items
        }
    }

@router.get("/compliance/gap-analysis")
def get_gap_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer, RoleEnum.developer]))
):
    policies = db.query(Policy).filter(Policy.org_id == current_user.org_id, Policy.status == "deployed").all()
    gaps = []
    
    for p in policies:
        latest_check = db.query(ComplianceCheck).filter(
            ComplianceCheck.policy_id == p.id
        ).order_by(desc(ComplianceCheck.created_at)).first()
        
        if latest_check:
            for req_id_str, v_data in latest_check.violations.items():
                if v_data.get("status") != "pass":
                    req = db.query(Requirement).filter(Requirement.id == uuid.UUID(req_id_str)).first()
                    gaps.append({
                        "requirement_id": req_id_str,
                        "title": req.title if req else "Unknown",
                        "gap_type": v_data.get("gap_type"),
                        "gap_id": v_data.get("gap_id"),
                        "recommended_action": v_data.get("recommended_action"),
                        "status": v_data.get("status"),
                        "compliance_check_id": latest_check.id
                    })
                    
    return {"data": gaps}

@router.get("/compliance/checklist")
def get_checklist(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer, RoleEnum.developer]))
):
    policies = db.query(Policy).filter(Policy.org_id == current_user.org_id, Policy.status == "deployed").all()
    checklist = []
    
    for p in policies:
        latest_check = db.query(ComplianceCheck).filter(
            ComplianceCheck.policy_id == p.id
        ).order_by(desc(ComplianceCheck.created_at)).first()
        
        # We need regulation mapping to show references
        reg_version = db.query(RegulationVersion).filter(RegulationVersion.id == p.regulation_version_id).first()
        reg_name = "Unknown"
        if reg_version:
            reg = db.query(Regulation).filter(Regulation.id == reg_version.regulation_id).first()
            if reg:
                reg_name = reg.name

        reqs = db.query(Requirement).filter(Requirement.id.in_(p.requirement_ids)).all()
        for req in reqs:
            status = "missing"
            if latest_check:
                v_data = latest_check.violations.get(str(req.id), {})
                status = v_data.get("status", "unknown")
                
            checklist.append({
                "requirement_id": req.id,
                "title": req.title,
                "regulation": reg_name,
                "status": status,
                "compliance_check_id": latest_check.id if latest_check else None
            })
            
    return {"data": checklist}

@router.post("/compliance/remediate")
def remediate_compliance(
    request: Request,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer, RoleEnum.developer]))
):
    check_id_str = payload.get("compliance_check_id")
    req_id_str = payload.get("requirement_id")
    rem_payload = payload.get("remediation_payload", {})
    
    if not check_id_str or not req_id_str:
        raise HTTPException(status_code=400, detail="compliance_check_id and requirement_id required")
        
    try:
        check = remediate_violation(
            db, 
            uuid.UUID(check_id_str), 
            uuid.UUID(req_id_str), 
            rem_payload, 
            current_user.org_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
        
    return {"data": {"status": "success", "new_result": check.result.value}}
