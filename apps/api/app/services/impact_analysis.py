import logging
import httpx
import json
from typing import Dict, Any
from sqlalchemy.orm import Session
import uuid

from app.models.requirements import Requirement, Policy, PolicyStatusEnum
from app.models.customer import CustomerControl, CustomerSystem
from app.models.audit import Notification, NotificationTypeEnum, Webhook
from app.services.compliance import evaluate_policy_compliance

logger = logging.getLogger(__name__)

class ImpactAnalysisService:
    def __init__(self, db: Session):
        self.db = db

    def analyze_diff_impacts(self, old_version_id: uuid.UUID, new_version_id: uuid.UUID, diff_summary: Dict[str, Any]):
        """
        W18 Continuous Compliance Loop:
        1. Find all active Policies tracking old_version_id.
        2. Identify changed requirements.
        3. Trigger W11 re-evaluation for those customers on a new Policy instance.
        """
        impacted_items = diff_summary.get("modified", []) + diff_summary.get("removed", [])
        added_items = diff_summary.get("added", [])
        if not impacted_items and not added_items:
            logger.info("No modifications to track for impact.")
            return

        # Find all organizations actively using the old version
        policies = self.db.query(Policy).filter(
            Policy.regulation_version_id == old_version_id,
            Policy.status == PolicyStatusEnum.deployed
        ).all()
        
        if not policies:
            logger.info("No deployed policies affected by this regulation change.")
            return

        # Extract new requirement IDs to attach to the new policy
        new_reqs = self.db.query(Requirement).filter(
            Requirement.regulation_version_id == new_version_id,
            Requirement.validation_status.in_(["approved", "enforceable"])
        ).all()
        new_req_ids = [r.id for r in new_reqs]

        for old_policy in policies:
            org_id = old_policy.org_id
            logger.info(f"Triggering W18 Loop for Org {org_id} (Policy {old_policy.id})")
            
            # Archive old policy
            old_policy.status = PolicyStatusEnum.draft
            
            # Create new Policy pointing to new_version_id
            new_policy = Policy(
                org_id=org_id,
                regulation_version_id=new_version_id,
                requirement_ids=new_req_ids,
                status=PolicyStatusEnum.deployed
            )
            self.db.add(new_policy)
            self.db.flush()
            
            # Extract customer's latest state (W10 payload)
            payload = {}
            controls = self.db.query(CustomerControl).filter(CustomerControl.org_id == org_id).all()
            for c in controls:
                val = c.description
                if val == "True": val = True
                elif val == "False": val = False
                elif val.isdigit(): val = int(val)
                payload[c.name] = val
                
            # W11 Trigger: Run evaluate_policy_compliance automatically against new policy
            check = evaluate_policy_compliance(self.db, new_policy.id, payload, org_id)
            
            # Alert Customer (Notification & Webhook)
            msg = f"Regulation update detected! {len(impacted_items)} requirements changed, {len(added_items)} added."
            notif = Notification(
                org_id=org_id,
                type=NotificationTypeEnum.impact_alert,
                payload={
                    "message": msg,
                    "old_policy_id": str(old_policy.id),
                    "new_policy_id": str(new_policy.id),
                    "new_compliance_result": check.result.value if hasattr(check.result, 'value') else check.result
                }
            )
            self.db.add(notif)
            self.db.commit()
            
            self._dispatch_webhooks(org_id, notif.payload)

    def _dispatch_webhooks(self, org_id: str, payload: dict):
        webhooks = self.db.query(Webhook).filter(Webhook.org_id == org_id).all()
        for wh in webhooks:
            if "impact_alert" in wh.event_types or "*" in wh.event_types:
                try:
                    httpx.post(
                        wh.target_url, 
                        json={"event": "impact_alert", "data": payload},
                        headers={"X-Rac-Signature": wh.secret_key},
                        timeout=5.0
                    )
                except Exception as e:
                    logger.error(f"Failed to dispatch webhook to {wh.target_url}: {e}")
