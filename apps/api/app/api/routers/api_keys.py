import uuid
import secrets
import hashlib
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.organizations import User, RoleEnum
from app.models.audit import ApiKey
from app.core.auth import require_role

router = APIRouter(tags=["api_keys"])

class ApiKeyCreate(BaseModel):
    name: str
    scopes: List[str]

@router.post("/api-keys")
def create_api_key(
    payload: ApiKeyCreate,
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.developer])),
    db: Session = Depends(get_db)
):
    # Generate raw key
    raw_key = f"rac_{secrets.token_urlsafe(32)}"
    
    # Hash it
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    
    # Save to DB
    api_key = ApiKey(
        org_id=current_user.org_id,
        name=payload.name,
        key_hash=key_hash,
        scopes=payload.scopes,
        created_by=current_user.id
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    
    return {
        "message": "API Key created successfully. Save this raw key now, it will never be shown again.",
        "id": str(api_key.id),
        "raw_key": raw_key,
        "name": api_key.name,
        "scopes": api_key.scopes,
        "created_at": api_key.created_at.isoformat()
    }

@router.get("/api-keys")
def list_api_keys(
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.developer])),
    db: Session = Depends(get_db)
):
    keys = db.query(ApiKey).filter(ApiKey.org_id == current_user.org_id).order_by(ApiKey.created_at.desc()).all()
    
    data = []
    for k in keys:
        data.append({
            "id": str(k.id),
            "name": k.name,
            "scopes": k.scopes,
            "created_at": k.created_at.isoformat(),
            "revoked_at": k.revoked_at.isoformat() if k.revoked_at else None,
            "created_by": str(k.created_by) if k.created_by else None
        })
        
    return {"data": data}

@router.delete("/api-keys/{key_id}")
def revoke_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.developer])),
    db: Session = Depends(get_db)
):
    api_key = db.query(ApiKey).filter(
        ApiKey.id == key_id, 
        ApiKey.org_id == current_user.org_id
    ).first()
    
    if not api_key:
        raise HTTPException(status_code=404, detail="API Key not found")
        
    if api_key.revoked_at:
        raise HTTPException(status_code=400, detail="API Key is already revoked")
        
    api_key.revoked_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"message": "API Key revoked successfully"}
