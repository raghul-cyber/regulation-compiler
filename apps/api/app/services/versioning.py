import uuid
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Dict, List, Any

from app.models.regulations import RegulationVersion
from app.models.requirements import Requirement, RequirementEmbedding

class VersioningService:
    def __init__(self, db: Session):
        self.db = db

    def generate_diff(self, old_version_id: uuid.UUID, new_version_id: uuid.UUID) -> Dict[str, List[Any]]:
        """
        Generates a semantic diff between two regulation versions.
        Updates the new_version's diff_summary.
        """
        old_reqs = self.db.query(Requirement).filter(
            Requirement.regulation_version_id == old_version_id,
            Requirement.validation_status.in_(["approved", "enforceable"])
        ).all()
        
        new_reqs = self.db.query(Requirement).filter(
            Requirement.regulation_version_id == new_version_id,
            Requirement.validation_status.in_(["approved", "enforceable"])
        ).all()

        added = []
        modified = []
        removed = []

        # Convert to dict for fast structural lookup by reference_label
        # Assuming Requirement.title often acts as a proxy for structural label if we didn't join DocumentSection
        # We will use title for structural match
        old_by_title = {r.title.lower(): r for r in old_reqs}
        new_by_title = {r.title.lower(): r for r in new_reqs}

        matched_old_ids = set()

        # 1. Match new requirements
        for new_req in new_reqs:
            old_req_match = None
            match_reason = None
            
            # Step 1: Structural Match (Title)
            if new_req.title.lower() in old_by_title:
                old_req_match = old_by_title[new_req.title.lower()]
                match_reason = "structural"
            else:
                # Step 2: Semantic Match (pgvector)
                # Fetch new_req embedding
                new_emb = self.db.query(RequirementEmbedding).filter(RequirementEmbedding.id == new_req.id).first()
                if new_emb:
                    # Find nearest old_req embedding
                    # Using <=>(cosine distance) < 0.1 (similarity > 0.9)
                    closest_old = self.db.query(
                        RequirementEmbedding.id,
                        RequirementEmbedding.embedding.cosine_distance(new_emb.embedding).label("distance")
                    ).join(
                        Requirement, Requirement.id == RequirementEmbedding.id
                    ).filter(
                        Requirement.regulation_version_id == old_version_id,
                        Requirement.validation_status.in_(["approved", "enforceable"])
                    ).order_by("distance").first()

                    if closest_old and closest_old.distance < 0.1:
                        # Find the actual old req object
                        old_req_match = next((r for r in old_reqs if r.id == closest_old.id), None)
                        if old_req_match:
                            match_reason = f"semantic (dist: {closest_old.distance:.3f})"

            if old_req_match:
                matched_old_ids.add(old_req_match.id)
                # Check for field differences to ensure it actually changed
                diffs = self._compare_fields(old_req_match, new_req)
                if diffs:
                    modified.append({
                        "requirement_id": str(new_req.id),
                        "old_requirement_id": str(old_req_match.id),
                        "title": new_req.title,
                        "match_reason": match_reason,
                        "field_diffs": diffs,
                        "old_data": self._req_to_dict(old_req_match),
                        "new_data": self._req_to_dict(new_req)
                    })
            else:
                # No match found, it is strictly added
                added.append({
                    "requirement_id": str(new_req.id),
                    "title": new_req.title,
                    "new_data": self._req_to_dict(new_req)
                })

        # 2. Any old requirements not matched are removed
        for old_req in old_reqs:
            if old_req.id not in matched_old_ids:
                removed.append({
                    "old_requirement_id": str(old_req.id),
                    "title": old_req.title,
                    "old_data": self._req_to_dict(old_req)
                })

        diff_summary = {
            "added": added,
            "modified": modified,
            "removed": removed
        }

        # Save to DB
        new_version = self.db.query(RegulationVersion).filter(RegulationVersion.id == new_version_id).first()
        if new_version:
            new_version.diff_summary = diff_summary
            self.db.commit()
            
            # Phase 13: Trigger Impact Analysis
            from app.services.impact_analysis import ImpactAnalysisService
            # We assume the regulation has an org_id via current context, but since this might run in a worker,
            # we can fetch the org_id from the regulation.
            reg = new_version.regulation
            if reg and hasattr(reg, 'org_id'): # Note: Regulation does not have org_id directly, need to check how it's linked
                org_id = reg.org_id
            else:
                # If org_id is not directly on regulation, we'd need to find it.
                # Assuming single tenant for local or it's passed down.
                # Just placeholder for now:
                # Let's query any user to get org_id as hack for single-tenant local demo, or if it exists.
                from app.models.organizations import Organization
                org = self.db.query(Organization).first()
                org_id = org.id if org else None

            if org_id:
                impact_svc = ImpactAnalysisService(self.db)
                impact_svc.analyze_diff_impacts(org_id, diff_summary)

        return diff_summary

    def _compare_fields(self, old_req: Requirement, new_req: Requirement) -> Dict[str, Dict]:
        diffs = {}
        fields = ["type", "severity", "description", "conditions", "actions", "evidence_required", "references"]
        
        for field in fields:
            old_val = getattr(old_req, field)
            new_val = getattr(new_req, field)
            
            # Enums might need .value
            if hasattr(old_val, 'value'):
                old_val = old_val.value
            if hasattr(new_val, 'value'):
                new_val = new_val.value
                
            if old_val != new_val:
                diffs[field] = {"old": old_val, "new": new_val}
                
        return diffs
        
    def _req_to_dict(self, req: Requirement) -> dict:
        return {
            "id": str(req.id),
            "type": req.type.value if hasattr(req.type, 'value') else req.type,
            "severity": req.severity.value if hasattr(req.severity, 'value') else req.severity,
            "description": req.description,
            "conditions": req.conditions,
            "actions": req.actions,
            "evidence_required": req.evidence_required,
            "references": req.references
        }
