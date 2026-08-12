import logging
import httpx
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.models.requirements import Requirement, SystemMapping, ImpactRecord
from app.models.audit import Notification, NotificationTypeEnum, Webhook

logger = logging.getLogger(__name__)

class ImpactAnalysisService:
    def __init__(self, db: Session):
        self.db = db

    def analyze_diff_impacts(self, org_id: str, diff_summary: Dict[str, Any]):
        """
        Analyzes the diff_summary for removed and modified requirements,
        checks if any internal systems are mapped to the old requirement IDs,
        and generates ImpactRecords and Notifications.
        """
        impacted_items = diff_summary.get("modified", []) + diff_summary.get("removed", [])
        if not impacted_items:
            return
            
        # Get all system mappings for this org
        # In a very large DB, we might query this more specifically, but for now we fetch all mappings
        mappings = self.db.query(SystemMapping).filter(SystemMapping.org_id == org_id).all()
        
        impacts_created = 0
        
        for item in impacted_items:
            old_req_id_str = item.get("old_requirement_id")
            if not old_req_id_str:
                continue
                
            change_type = "modified" if "new_data" in item else "removed"
            severity = item.get("new_data", {}).get("severity") or item.get("old_data", {}).get("severity") or "high"
            
            # Find any system that mapped to this old requirement
            for mapping in mappings:
                if old_req_id_str in [str(u) for u in mapping.mapped_requirement_ids]:
                    # Generate impact record
                    record = ImpactRecord(
                        org_id=org_id,
                        system_mapping_id=mapping.id,
                        requirement_id=old_req_id_str, # In reality we'd link to the new req id for modified, but sticking to old for trace
                        change_type=change_type,
                        severity=severity
                    )
                    self.db.add(record)
                    impacts_created += 1
                    
                    # Create notification
                    notif = Notification(
                        org_id=org_id,
                        type=NotificationTypeEnum.impact_alert,
                        payload={
                            "system_name": mapping.system_name,
                            "change_type": change_type,
                            "requirement_title": item.get("title", "Unknown Requirement"),
                            "severity": severity
                        }
                    )
                    self.db.add(notif)
                    self.db.commit()
                    
                    # Dispatch Webhook
                    self._dispatch_webhooks(org_id, notif.payload)
                    
        logger.info(f"Generated {impacts_created} impact records from amendment.")

    def _dispatch_webhooks(self, org_id: str, payload: dict):
        webhooks = self.db.query(Webhook).filter(Webhook.org_id == org_id).all()
        for wh in webhooks:
            # Check if this webhook subscribes to impact_alerts
            if "impact_alert" in wh.event_types or "*" in wh.event_types:
                try:
                    # Sync dispatch for simplicity. Production would use Celery.
                    httpx.post(
                        wh.target_url, 
                        json={"event": "impact_alert", "data": payload},
                        headers={"X-Rac-Signature": wh.secret_key}, # Simple sig
                        timeout=5.0
                    )
                except Exception as e:
                    logger.error(f"Failed to dispatch webhook to {wh.target_url}: {e}")
