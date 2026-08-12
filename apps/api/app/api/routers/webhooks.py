import os
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from svix.webhooks import Webhook, WebhookVerificationError

from app.db.session import get_db
from app.models.organizations import Organization, User, PlanEnum, RoleEnum

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

CLERK_WEBHOOK_SECRET = os.environ.get("CLERK_WEBHOOK_SECRET")

@router.post("/clerk")
async def clerk_webhook(request: Request, db: Session = Depends(get_db)):
    if not CLERK_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="CLERK_WEBHOOK_SECRET is not set")
    
    # Get headers
    svix_id = request.headers.get("svix-id")
    svix_timestamp = request.headers.get("svix-timestamp")
    svix_signature = request.headers.get("svix-signature")
    
    if not svix_id or not svix_timestamp or not svix_signature:
        raise HTTPException(status_code=400, detail="Missing svix headers")
        
    payload = await request.body()
    headers = {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature
    }
    
    wh = Webhook(CLERK_WEBHOOK_SECRET)
    
    try:
        event = wh.verify(payload, headers)
    except WebhookVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
        
    event_type = event.get("type")
    data = event.get("data", {})
    
    if event_type == "user.created":
        clerk_user_id = data.get("id")
        email_addresses = data.get("email_addresses", [])
        email = email_addresses[0].get("email_address") if email_addresses else ""
        
        # In a real app, users might join existing orgs. For now, create a default one if none.
        org_id = None
        # Let's check if the user is linked to any org from clerk metadata, or create a default one
        # Because the spec says "create the org row on first login if none exists yet"
        
        # Find if we have any organizations. If not, create a default "Personal Workspace"
        org = db.query(Organization).first()
        if not org:
            org = Organization(
                name="Default Workspace",
                plan=PlanEnum.trial
            )
            db.add(org)
            db.commit()
            db.refresh(org)
            
        org_id = org.id
        
        user = User(
            org_id=org_id,
            clerk_user_id=clerk_user_id,
            role=RoleEnum.admin if org.name == "Default Workspace" else RoleEnum.developer,
            email=email
        )
        db.add(user)
        db.commit()
        
    return {"success": True}
