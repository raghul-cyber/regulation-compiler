from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.db.session import get_db
from app.core.auth import require_role
from app.models.organizations import User, RoleEnum

router = APIRouter(tags=["team"])

@router.get("/")
def get_team_members(
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer, RoleEnum.developer, RoleEnum.legal_counsel, RoleEnum.auditor])),
    db: Session = Depends(get_db)
):
    users = db.query(User).filter(User.org_id == current_user.org_id).all()
    
    return {
        "data": [
            {
                "id": str(u.id),
                "email": u.email,
                "role": u.role.value if hasattr(u.role, 'value') else u.role,
                "clerk_user_id": u.clerk_user_id
            }
            for u in users
        ]
    }

@router.patch("/{user_id}/role")
def update_team_member_role(
    user_id: uuid.UUID,
    role: str,
    current_user: User = Depends(require_role([RoleEnum.admin])),
    db: Session = Depends(get_db)
):
    # Only admins can change roles
    target_user = db.query(User).filter(User.id == user_id, User.org_id == current_user.org_id).first()
    
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found in your organization.")
        
    if str(target_user.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="You cannot change your own role.")
        
    try:
        new_role = RoleEnum(role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {role}")
        
    target_user.role = new_role
    db.commit()
    
    return {"message": "Role updated successfully"}

from pydantic import BaseModel
import secrets
from app.models.organizations import TeamInvite

class InviteRequest(BaseModel):
    email: str
    role: str

@router.post("/invite")
def create_invite(
    req: InviteRequest,
    current_user: User = Depends(require_role([RoleEnum.admin])),
    db: Session = Depends(get_db)
):
    try:
        role_enum = RoleEnum(req.role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    token = secrets.token_urlsafe(32)
    invite = TeamInvite(
        email=req.email,
        role=role_enum,
        org_id=current_user.org_id,
        token=token
    )
    db.add(invite)
    db.commit()
    
    # In a real app with SendGrid/SES configured, we would send an email here.
    # For now, we simulate an SMTP send by logging it to the console.
    invite_link = f"http://localhost:3000/invite/accept?token={token}"
    import logging
    logging.getLogger(__name__).info(f"SMTP SIMULATION: Sent invite email to {req.email} with link {invite_link}")
    
    return {"message": "Invite sent successfully"}

@router.get("/invites")
def list_invites(
    current_user: User = Depends(require_role([RoleEnum.admin])),
    db: Session = Depends(get_db)
):
    invites = db.query(TeamInvite).filter(TeamInvite.org_id == current_user.org_id, TeamInvite.status == 'pending').all()
    return {
        "data": [
            {
                "id": str(i.id),
                "email": i.email,
                "role": i.role.value if hasattr(i.role, 'value') else i.role,
                "created_at": i.created_at.isoformat(),
                "link": f"http://localhost:3000/invite/accept?token={i.token}"
            }
            for i in invites
        ]
    }
    
@router.delete("/invite/{invite_id}")
def delete_invite(
    invite_id: uuid.UUID,
    current_user: User = Depends(require_role([RoleEnum.admin])),
    db: Session = Depends(get_db)
):
    invite = db.query(TeamInvite).filter(TeamInvite.id == invite_id, TeamInvite.org_id == current_user.org_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
        
    db.delete(invite)
    db.commit()
    return {"message": "Invite deleted successfully"}

class AcceptInviteRequest(BaseModel):
    token: str
    clerk_user_id: str

@router.post("/invite/accept")
def accept_invite(
    req: AcceptInviteRequest,
    db: Session = Depends(get_db)
):
    invite = db.query(TeamInvite).filter(TeamInvite.token == req.token, TeamInvite.status == 'pending').first()
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invitation token.")
        
    existing_user = db.query(User).filter(User.clerk_user_id == req.clerk_user_id).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already registered.")
        
    new_user = User(
        org_id=invite.org_id,
        clerk_user_id=req.clerk_user_id,
        email=invite.email,
        role=invite.role
    )
    db.add(new_user)
    
    invite.status = 'accepted'
    db.commit()
    
    return {"message": "Invite accepted successfully", "user_id": str(new_user.id)}
