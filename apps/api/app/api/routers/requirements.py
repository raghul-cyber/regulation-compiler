from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timezone
import uuid
from typing import Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.core.auth import require_role
from app.models.organizations import RoleEnum, User
from app.models.regulations import Regulation, RegulationVersion, DocumentSection
from app.models.requirements import Requirement, RequirementTypeEnum, SeverityEnum, ValidationStatusEnum
from app.models.audit import AuditLog

router = APIRouter(tags=["requirements"])

class RequirementStatusUpdate(BaseModel):
    status: ValidationStatusEnum
    reviewer_note: Optional[str] = None

@router.get("/v1/regulations/{regulation_id}/requirements")
def list_requirements(
    regulation_id: uuid.UUID,
    type: Optional[RequirementTypeEnum] = None,
    severity: Optional[SeverityEnum] = None,
    status: Optional[ValidationStatusEnum] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    cursor: Optional[datetime] = None,
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer, RoleEnum.legal_counsel, RoleEnum.developer])),
    db: Session = Depends(get_db)
):
    # Find the current version of the regulation
    reg = db.query(Regulation).filter(Regulation.id == regulation_id).first()
    if not reg or not reg.current_version_id:
        raise HTTPException(status_code=404, detail="Regulation or current version not found")
        
    if search:
        # Hybrid Search path
        import os
        from sqlalchemy import text
        from google import genai
        from google.genai import types

        # 1. Get embedding for the query
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", "mock-key-for-local"))
        try:
            emb_res = client.models.embed_content(
                model='gemini-embedding-2',
                contents=search,
                config=types.EmbedContentConfig(output_dimensionality=768)
            )
            query_vector = emb_res.embeddings[0].values
            vector_str = "[" + ",".join(map(str, query_vector)) + "]"
        except Exception:
            # Fallback mock embedding if API fails
            vector_str = "[" + ",".join(["0.0"] * 768) + "]"

        # 2. Execute Hybrid Query
        sql = text("""
        WITH semantic_search AS (
            SELECT 
                id, 
                1 - (embedding <=> :vector::vector) AS semantic_score
            FROM requirement_embeddings
        ),
        fts_search AS (
            SELECT 
                id,
                ts_rank(
                    to_tsvector('english', title || ' ' || description), 
                    plainto_tsquery('english', :query)
                ) AS fts_score
            FROM requirements
            WHERE regulation_version_id = :version_id
        )
        SELECT 
            r.id, r.regulation_version_id, r.section_id, r.type, r.title, r.description, 
            r.conditions, r.actions, r.severity, r.evidence_required, r.references, 
            r.confidence_score, r.validation_status, r.reviewed_by_user_id, r.reviewed_at, 
            r.meta_data, r.created_at, r.updated_at,
            COALESCE(s.semantic_score, 0) AS semantic_score,
            COALESCE(f.fts_score, 0) AS fts_score,
            (COALESCE(s.semantic_score, 0) * 0.7 + COALESCE(f.fts_score, 0) * 0.3) AS combined_score,
            s_text.raw_text as source_text
        FROM requirements r
        LEFT JOIN semantic_search s ON r.id = s.id
        LEFT JOIN fts_search f ON r.id = f.id
        LEFT JOIN document_sections s_text ON r.section_id = s_text.id
        WHERE r.regulation_version_id = :version_id
          AND (COALESCE(s.semantic_score, 0) > 0.4 OR COALESCE(f.fts_score, 0) > 0.05)
        ORDER BY combined_score DESC
        LIMIT :limit
        """)

        params = {
            "version_id": str(reg.current_version_id),
            "vector": vector_str,
            "query": search,
            "limit": limit
        }
        
        result_proxy = db.execute(sql, params)
        rows = result_proxy.fetchall()
        
        data = []
        for row in rows:
            row_dict = dict(row._mapping)
            # Ensure enums/UUIDs/datetimes are properly converted if needed,
            # though FastAPI usually handles mapping dicts well, but manual conversion is safer
            row_dict["id"] = str(row_dict["id"])
            row_dict["regulation_version_id"] = str(row_dict["regulation_version_id"])
            row_dict["section_id"] = str(row_dict["section_id"])
            if row_dict["reviewed_by_user_id"]:
                row_dict["reviewed_by_user_id"] = str(row_dict["reviewed_by_user_id"])
            data.append(row_dict)
            
        return {
            "data": data,
            "next_cursor": None # Pagination complex with scores, keeping simple for demo
        }
        
    else:
        # Standard filtering path
        query = db.query(Requirement, DocumentSection.raw_text.label("source_text")).join(
            DocumentSection, Requirement.section_id == DocumentSection.id
        ).filter(
            Requirement.regulation_version_id == reg.current_version_id
        )
        
        if type:
            query = query.filter(Requirement.type == type)
        if severity:
            query = query.filter(Requirement.severity == severity)
        if status:
            query = query.filter(Requirement.validation_status == status)
            
        if cursor:
            query = query.filter(Requirement.created_at < cursor)
            
        # Order by created_at desc for pagination
        query = query.order_by(Requirement.created_at.desc(), Requirement.id).limit(limit)
        
        results = query.all()
        
        data = []
        for req, source_text in results:
            req_dict = req.__dict__.copy()
            req_dict.pop("_sa_instance_state", None)
            req_dict["source_text"] = source_text
            data.append(req_dict)
            
        next_cursor = None
        if results and len(results) == limit:
            next_cursor = results[-1][0].created_at.isoformat()
            
        return {
            "data": data,
            "next_cursor": next_cursor
        }

@router.patch("/v1/requirements/{requirement_id}/status")
def update_requirement_status(
    requirement_id: uuid.UUID,
    payload: RequirementStatusUpdate,
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer, RoleEnum.legal_counsel])),
    db: Session = Depends(get_db)
):
    req = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")
        
    old_status = req.validation_status
    
    req.validation_status = payload.status
    req.reviewed_by_user_id = current_user.id
    req.reviewed_at = datetime.now(timezone.utc)
    
    # Audit Logging
    audit = AuditLog(
        org_id=current_user.org_id,
        actor_id=current_user.id,
        action="UPDATE_REQUIREMENT_STATUS",
        entity_type="Requirement",
        entity_id=req.id,
        metadata_={
            "old_status": old_status.value,
            "new_status": payload.status.value,
            "note": payload.reviewer_note
        }
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Status updated successfully", "status": payload.status}
