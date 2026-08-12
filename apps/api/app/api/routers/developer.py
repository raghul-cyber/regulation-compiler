import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.regulations import Regulation
from app.models.requirements import Requirement
from app.models.audit import ApiKey, Webhook
from app.core.auth import require_scope

# Setup slowapi globally in main.py, import limiter here
from app.core.limiter import limiter

router = APIRouter(tags=["developer"])

from app.services.versioning import VersioningService
from app.models.regulations import RegulationVersion

# --- Diff Engine (Phase 12) ---

@router.get("/regulations/{id}/diff")
@limiter.limit("10/minute")
def get_regulation_diff(
    request: Request,
    id: uuid.UUID,
    old_version_id: Optional[uuid.UUID] = None,
    new_version_id: Optional[uuid.UUID] = None,
    api_key: ApiKey = Depends(require_scope(["read-only", "admin"])),
    db: Session = Depends(get_db)
):
    reg = db.query(Regulation).filter(Regulation.id == id, Regulation.org_id == api_key.org_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Regulation not found")
        
    versions = db.query(RegulationVersion).filter(RegulationVersion.regulation_id == id).order_by(RegulationVersion.created_at.desc()).all()
    if len(versions) < 2:
        return {"message": "At least 2 versions are required to generate a diff.", "diff_summary": {"added": [], "modified": [], "removed": []}}
        
    nv = new_version_id if new_version_id else versions[0].id
    ov = old_version_id if old_version_id else versions[1].id
    
    # Try fetching existing diff
    new_ver = next((v for v in versions if v.id == nv), None)
    if new_ver and new_ver.diff_summary:
        return {"diff_summary": new_ver.diff_summary, "old_version": str(ov), "new_version": str(nv)}
        
    # Generate on the fly if missing
    svc = VersioningService(db)
    summary = svc.generate_diff(ov, nv)
    
    return {"diff_summary": summary, "old_version": str(ov), "new_version": str(nv)}

# --- Policy & Controls ---

@router.get("/policy/{regulation_id}")
@limiter.limit("60/minute")
def get_active_policy(
    request: Request,
    regulation_id: uuid.UUID,
    api_key: ApiKey = Depends(require_scope(["read-only", "admin", "check-compliance"])),
    db: Session = Depends(get_db)
):
    reg = db.query(Regulation).filter(Regulation.id == regulation_id, Regulation.org_id == api_key.org_id).first()
    if not reg or not reg.current_version_id:
        raise HTTPException(status_code=404, detail="Regulation not found")
        
    rules = db.query(Requirement).filter(
        Requirement.regulation_version_id == reg.current_version_id,
        Requirement.validation_status == "approved",
        Requirement.type.in_(["obligation", "prohibition"])
    ).all()
    
    data = []
    for r in rules:
        data.append({
            "id": str(r.id),
            "title": r.title,
            "type": r.type.value if hasattr(r.type, 'value') else r.type,
            "severity": r.severity.value if hasattr(r.severity, 'value') else r.severity,
            "conditions": r.conditions,
            "actions": r.actions
        })
        
    return {"data": data}

@router.get("/controls/{regulation_id}")
@limiter.limit("60/minute")
def get_controls_by_severity(
    request: Request,
    regulation_id: uuid.UUID,
    api_key: ApiKey = Depends(require_scope(["read-only", "admin"])),
    db: Session = Depends(get_db)
):
    reg = db.query(Regulation).filter(Regulation.id == regulation_id, Regulation.org_id == api_key.org_id).first()
    if not reg or not reg.current_version_id:
        raise HTTPException(status_code=404, detail="Regulation not found")
        
    reqs = db.query(Requirement).filter(
        Requirement.regulation_version_id == reg.current_version_id,
        Requirement.validation_status == "approved"
    ).all()
    
    grouped = {
        "critical": [],
        "high": [],
        "medium": [],
        "low": []
    }
    
    for r in reqs:
        sev = r.severity.value if hasattr(r.severity, 'value') else r.severity
        if sev in grouped:
            grouped[sev].append({
                "id": str(r.id),
                "title": r.title,
                "description": r.description
            })
            
    return {"data": grouped}

# --- Check Compliance ---

class ComplianceCheckPayload(BaseModel):
    system_name: str
    regulation_ids: List[uuid.UUID]
    controls_implemented: Dict[str, Any] # e.g. {"data_encryption": true, "retention_days": 30}

@router.post("/check-compliance")
@limiter.limit("120/minute")
def check_compliance(
    request: Request,
    payload: ComplianceCheckPayload,
    api_key: ApiKey = Depends(require_scope(["check-compliance", "admin"])),
    db: Session = Depends(get_db)
):
    results = []
    
    # Flatted submitted keys for simple heuristic evaluation
    submitted_keys = [k.lower() for k in payload.controls_implemented.keys()]
    
    for reg_id in payload.regulation_ids:
        reg = db.query(Regulation).filter(Regulation.id == reg_id, Regulation.org_id == api_key.org_id).first()
        if not reg or not reg.current_version_id:
            continue
            
        rules = db.query(Requirement).filter(
            Requirement.regulation_version_id == reg.current_version_id,
            Requirement.validation_status == "approved",
            Requirement.severity.in_(["high", "critical"])
        ).all()
        
        for rule in rules:
            # Real evaluation logic: Does the payload keys match any words in the condition/actions?
            # E.g. rule has action "encrypt data at rest", payload has "data_encryption"
            
            rule_text = " ".join(rule.actions + rule.conditions).lower()
            
            # Simple heuristic: if any submitted key part matches rule text
            passed = False
            for skey in submitted_keys:
                skey_clean = skey.replace('_', ' ')
                if skey_clean in rule_text or any(word in rule_text for word in skey_clean.split() if len(word) > 4):
                    passed = True
                    break
                    
            if not passed:
                results.append({
                    "regulation": reg.name,
                    "requirement_id": str(rule.id),
                    "title": rule.title,
                    "severity": rule.severity.value if hasattr(rule.severity, 'value') else rule.severity,
                    "status": "failed",
                    "message": f"Missing controls for: {', '.join(rule.actions)}"
                })
                
    # If no failures, it's compliant
    return {
        "system": payload.system_name,
        "is_compliant": len(results) == 0,
        "violations": results
    }

# --- Webhooks ---

class WebhookCreate(BaseModel):
    target_url: str
    event_types: List[str]
    secret_key: str

@router.post("/webhooks")
@limiter.limit("30/minute")
def register_webhook(
    request: Request,
    payload: WebhookCreate,
    api_key: ApiKey = Depends(require_scope(["admin"])),
    db: Session = Depends(get_db)
):
    webhook = Webhook(
        org_id=api_key.org_id,
        target_url=payload.target_url,
        event_types=payload.event_types,
        secret_key=payload.secret_key
    )
    db.add(webhook)
    db.commit()
    db.refresh(webhook)
    
    return {
        "message": "Webhook registered successfully",
        "id": str(webhook.id),
        "target_url": webhook.target_url
    }
