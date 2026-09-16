from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timezone
import uuid
from typing import Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.core.auth import require_role, get_optional_current_user
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
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    # Find the regulation or regulation version
    reg = db.query(Regulation).filter(Regulation.id == regulation_id).first()
    if not reg:
        ver = db.query(RegulationVersion).filter(RegulationVersion.id == regulation_id).first()
        if ver:
            reg = db.query(Regulation).filter(Regulation.id == ver.regulation_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Regulation not found")
        
    version_id = reg.current_version_id
    if not version_id:
        latest_ver = db.query(RegulationVersion).filter(RegulationVersion.regulation_id == reg.id).order_by(RegulationVersion.ingested_at.desc()).first()
        if latest_ver:
            version_id = latest_ver.id
            
    if not version_id:
        return {"data": [], "next_cursor": None}
        
    if search:
        # Hybrid Search path
        import os
        from sqlalchemy import text
        from google.genai import types
        from app.pipelines.embeddings import get_gemini_client

        # 1. Get embedding for the query
        try:
            client = get_gemini_client()
        except Exception:
            raise HTTPException(status_code=500, detail="Semantic search is unavailable. Missing GEMINI_API_KEY.")
        try:
            emb_res = client.models.embed_content(
                model='gemini-embedding-2',
                contents=search,
                config=types.EmbedContentConfig(output_dimensionality=768)
            )
            query_vector = emb_res.embeddings[0].values
            vector_str = "[" + ",".join(map(str, query_vector)) + "]"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Semantic search failed: {str(e)}")

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
            s_text.raw_text as source_text,
            s_text.reference_label as section_label
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
            row_dict["section_label"] = str(row_dict.get("section_label") or "")
            row_dict["source_text"] = str(row_dict.get("source_text") or "")
            if row_dict["reviewed_by_user_id"]:
                row_dict["reviewed_by_user_id"] = str(row_dict["reviewed_by_user_id"])
            data.append(row_dict)
            
        return {
            "data": data,
            "next_cursor": None # Pagination complex with scores, keeping simple for demo
        }
        
    else:
        # Standard filtering path
        query = db.query(
            Requirement, 
            DocumentSection.raw_text.label("source_text"),
            DocumentSection.reference_label.label("section_label")
        ).outerjoin(
            DocumentSection, Requirement.section_id == DocumentSection.id
        ).filter(
            Requirement.regulation_version_id == version_id
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
        for req, source_text, section_label in results:
            req_dict = {
                "id": str(req.id),
                "regulation_version_id": str(req.regulation_version_id),
                "section_id": str(req.section_id) if req.section_id else None,
                "type": req.type.value if hasattr(req.type, "value") else str(req.type),
                "title": req.title,
                "description": req.description,
                "conditions": req.conditions or {},
                "actions": req.actions or {},
                "severity": req.severity.value if hasattr(req.severity, "value") else str(req.severity),
                "evidence_required": req.evidence_required or {},
                "references": req.references or {},
                "confidence_score": float(req.confidence_score) if req.confidence_score is not None else 0.95,
                "validation_status": req.validation_status.value if hasattr(req.validation_status, "value") else str(req.validation_status),
                "reviewed_by_user_id": str(req.reviewed_by_user_id) if req.reviewed_by_user_id else None,
                "reviewed_at": req.reviewed_at.isoformat() if req.reviewed_at else None,
                "reviewer_note": (req.meta_data.get("reviewer_note") if req.meta_data else None) or "",
                "meta_data": req.meta_data or {},
                "source_text": source_text or "",
                "section_label": section_label or "",
                "created_at": req.created_at.isoformat() if req.created_at else None,
                "updated_at": req.created_at.isoformat() if req.created_at else None,
            }
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
    if payload.reviewer_note:
        meta = dict(req.meta_data or {})
        meta["reviewer_note"] = payload.reviewer_note
        req.meta_data = meta
    
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
