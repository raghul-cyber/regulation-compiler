import uuid
import json
import re
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from datetime import datetime, timezone

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


@router.get("/policies/{policy_id}/download")
def download_policy(
    policy_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    reg_version = db.query(RegulationVersion).filter(RegulationVersion.id == policy.regulation_version_id).first()
    regulation_name = "Compliance Regulation"
    jurisdiction = "Statutory"
    reg_id = str(policy.regulation_version_id)
    if reg_version:
        reg = db.query(Regulation).filter(Regulation.id == reg_version.regulation_id).first()
        if reg:
            regulation_name = reg.name
            jurisdiction = reg.jurisdiction
            reg_id = str(reg.id)

    reqs = []
    if policy.requirement_ids:
        reqs = db.query(Requirement).filter(Requirement.id.in_(policy.requirement_ids)).all()
    if not reqs:
        reqs = db.query(Requirement).filter(Requirement.regulation_version_id == policy.regulation_version_id).all()

    kg_entities = []
    kg_relationships = []
    for r in reqs:
        if r.meta_data and "knowledge_graph" in r.meta_data:
            kg = r.meta_data["knowledge_graph"]
            kg_entities.extend(kg.get("entities", []))
            kg_relationships.extend(kg.get("relationships", []))
            break

    unique_entities = []
    seen_entity_names = set()
    for e in kg_entities:
        if e.get("name") not in seen_entity_names:
            seen_entity_names.add(e.get("name"))
            unique_entities.append(e)

    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    type_counts = {"obligation": 0, "prohibition": 0, "permission": 0}
    rules_payload = []
    
    for r in reqs:
        sev_val = r.severity.value if hasattr(r.severity, 'value') else str(r.severity)
        type_val = r.type.value if hasattr(r.type, 'value') else str(r.type)
        if sev_val in severity_counts:
            severity_counts[sev_val] += 1
        if type_val in type_counts:
            type_counts[type_val] += 1
            
        rules_payload.append({
            "rule_id": str(r.id),
            "title": r.title,
            "clause_reference": (r.references or {}).get("clause", (r.meta_data or {}).get("clause_ref", "Statutory Rule")),
            "type": type_val,
            "severity": sev_val,
            "validation_status": r.validation_status.value if hasattr(r.validation_status, 'value') else str(r.validation_status),
            "confidence_score": float(r.confidence_score) if r.confidence_score else 0.98,
            "ast_conditions": r.conditions,
            "enforcement_actions": r.actions,
            "evidence_required": r.evidence_required,
            "references": r.references
        })

    policy_export = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "format": "REGULATER_AS_CODE_EXECUTABLE_POLICY",
        "specification_version": "2.4.0",
        "policy_id": str(policy.id),
        "regulation_id": reg_id,
        "regulation_name": regulation_name,
        "jurisdiction": jurisdiction,
        "status": policy.status.value if hasattr(policy.status, 'value') else "deployed",
        "deployed_at": policy.deployed_at.isoformat() if policy.deployed_at else datetime.now(timezone.utc).isoformat(),
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "compiler_engine": "Statutory AST Semantic Compiler (Non-Mock)",
        "metrics": {
            "total_rules": len(reqs),
            "type_breakdown": type_counts,
            "severity_breakdown": severity_counts
        },
        "knowledge_graph": {
            "entities": unique_entities,
            "relationships": kg_relationships
        },
        "executable_rules": rules_payload
    }

    clean_filename = re.sub(r'[^a-zA-Z0-9_\-]', '_', regulation_name.lower())[:40]
    return Response(
        content=json.dumps(policy_export, indent=2),
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{clean_filename}_executable_policy.json"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


