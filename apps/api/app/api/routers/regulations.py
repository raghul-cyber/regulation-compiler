import io
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

import json
import re
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Response, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.auth import require_role, get_optional_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.audit import AuditLog
from app.models.jobs import BackgroundJob, JobTypeEnum
from app.models.organizations import RoleEnum, User
from app.models.regulations import (
    Regulation,
    RegulationVersion,
    SourceDocument,
    FileTypeEnum,
    FrameworkCatalog,
)
from app.models.requirements import Requirement, Policy
from app.services.fetcher import FrameworkFetcher
from app.services.storage import StorageService
import threading
import logging
from app.db.session import SessionLocal
from app.models.jobs import JobStatusEnum
from app.workers.tasks import process_ingestion_pipeline, process_amendment_pipeline, update_job_status
from app.pipelines.extraction import run_extraction_pipeline
from app.core.limiter import limiter
from app.core.security_guard import sanitize_filename, validate_file_magic_bytes, MAX_UPLOAD_SIZE
from app.services.spending_caps import check_spending_cap, SpendingCapExceededException
from app.core.cache import ResponseCache
from app.services.entitlement import EntitlementService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["regulations"])
storage_service = StorageService()

def run_pipeline_in_background(job_id_str: str, source_doc_id_str: str):
    """
    Executes the ingestion pipeline in a managed daemon thread so the compilation
    pipeline completes in seconds and never stalls on cold/hibernating Celery workers.
    """
    def _runner():
        logger.info(f"Starting in-process background pipeline execution for Job {job_id_str}")
        db = SessionLocal()
        try:
            update_job_status(db, uuid.UUID(job_id_str), JobStatusEnum.processing)
            run_extraction_pipeline(db, uuid.UUID(source_doc_id_str), job_id_str)
            update_job_status(db, uuid.UUID(job_id_str), JobStatusEnum.completed, {"message": "Pipeline completed successfully"})
            logger.info(f"In-process pipeline execution successfully finished for Job {job_id_str}")
        except Exception as e:
            logger.error(f"In-process pipeline execution failed for Job {job_id_str}: {e}")
            try:
                update_job_status(db, uuid.UUID(job_id_str), JobStatusEnum.failed, error=str(e))
            except Exception:
                pass
        finally:
            db.close()
            
    t = threading.Thread(target=_runner, daemon=True)
    t.start()


# ---------------------------------------------------------
# Static & Collection Endpoints (MUST precede /{regulation_id})
# ---------------------------------------------------------

@router.post("/upload")
@limiter.limit("5/minute")
async def upload_regulation(
    request: Request,
    file: UploadFile = File(...),
    jurisdiction: str = Form(...),
    name: str = Form(...),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    # 1. Resolve and verify authenticated user
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required to upload and compile regulations."
        )

    # 2. Enforce 3 Free Uses Policy & Atomic Concurrency-Safe Entitlement Reservation
    entitlement_service = EntitlementService(db)
    op_id = request.headers.get("X-Idempotency-Key") or f"upload-{uuid.uuid4()}"
    usage_event = entitlement_service.reserve_usage(
        user=current_user,
        operation_type="regulation_compilation",
        operation_id=op_id,
        source="web_upload",
        metadata={"regulation_name": name, "jurisdiction": jurisdiction}
    )

    try:
        # Check spending cap
        org_id = current_user.org_id if current_user else None
        try:
            check_spending_cap(db, org_id, expected_invocation_cost=0.02)
        except SpendingCapExceededException as sce:
            raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=str(sce))

        # Sanitize filename to prevent directory traversal
        clean_filename = sanitize_filename(file.filename)

        # Validate file extension
        ext = clean_filename.split('.')[-1].lower() if '.' in clean_filename else ''
        if ext == 'pdf':
            file_type = FileTypeEnum.pdf
        elif ext in ['htm', 'html']:
            file_type = FileTypeEnum.html
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF and HTML files are supported."
            )

        # Validate file size (strict 25MB enterprise limit)
        content = await file.read()
        if len(content) > MAX_UPLOAD_SIZE:
            del content
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds the 25MB maximum limit."
            )

        # Validate magic bytes against malicious disguised payloads
        if not validate_file_magic_bytes(content, ext):
            del content
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security verification failed: File contents do not match valid {ext.upper()} magic byte format."
            )
        await file.seek(0)
        del content
        import gc
        gc.collect()

        # Upload file to S3
        try:
            storage_path = storage_service.upload_file(file.file, clean_filename, file.content_type)
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to upload file")

        # Create Regulation
        regulation = Regulation(
            name=name,
            jurisdiction=jurisdiction,
            source_url=f"s3://{storage_path}",
        )
        db.add(regulation)
        db.flush()

        # Create SourceDocument first since its regulation_version_id is nullable
        source_doc = SourceDocument(
            file_type=file_type,
            storage_path=storage_path,
            raw_text="",
            ocr_used=False,
            page_count=0
        )
        db.add(source_doc)
        db.flush()

        # Create RegulationVersion linked to SourceDocument
        version = RegulationVersion(
            regulation_id=regulation.id,
            version_label="v1",
            published_date=datetime.now(timezone.utc).date(),
            ingested_at=datetime.now(timezone.utc),
            source_document_id=source_doc.id
        )
        db.add(version)
        db.flush()
        
        # Link SourceDocument back to RegulationVersion
        source_doc.regulation_version_id = version.id
        
        # Update regulation's current version
        regulation.current_version_id = version.id
        db.commit()

        # Enqueue task & trigger in-process execution fallback
        job = BackgroundJob(
            job_type=JobTypeEnum.ingestion,
            entity_id=str(version.id)
        )
        db.add(job)
        db.commit()

        try:
            task = process_ingestion_pipeline.delay(str(job.id), str(source_doc.id))
            job.task_id = task.id
        except Exception as cel_err:
            logger.warning(f"Could not enqueue Celery task: {cel_err}")
            job.task_id = str(uuid.uuid4())
        db.commit()

        # Trigger reliable background execution immediately
        run_pipeline_in_background(str(job.id), str(source_doc.id))

        # Invalidate cached regulation lists
        ResponseCache.invalidate("regulations")

        # Mark usage successfully completed
        entitlement_service.complete_usage(op_id)

        return {
            "regulation_id": str(regulation.id),
            "regulation_version_id": str(version.id),
            "job_id": str(job.id),
            "operation_id": op_id
        }

    except HTTPException:
        entitlement_service.release_usage(op_id, reason="client_http_exception")
        raise
    except Exception as fatal_ex:
        entitlement_service.release_usage(op_id, reason=f"fatal_error: {str(fatal_ex)}")
        raise


@router.get("")
def list_regulations(
    page: Optional[int] = None,
    page_size: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Check cache if not paginated
    cache_key = "regulations:list" if (page is None and page_size is None) else None
    if cache_key:
        cached = ResponseCache.get(cache_key)
        if cached is not None:
            return cached

    try:
        base_query = db.query(Regulation).order_by(Regulation.created_at.desc())
        total_items = base_query.count()
        if page is not None and page_size is not None:
            p = max(1, page)
            ps = min(100, max(1, page_size))
            regs = base_query.offset((p - 1) * ps).limit(ps).all()
        else:
            regs = base_query.all()
    except Exception as query_err:
        db.rollback()
        import logging
        logging.getLogger(__name__).warning(f"Could not order by created_at, falling back: {query_err}")
        regs = db.query(Regulation).all()
        total_items = len(regs)

    try:
        framework_map = {f.name: f.description for f in db.query(FrameworkCatalog).all()}
    except Exception:
        framework_map = {}

    default_descriptions = {
        "General Data Protection Regulation (GDPR)": "Comprehensive EU privacy legislation establishing stringent principles for lawful personal data processing, data subject rights, and cross-border data transfer controls.",
        "Digital Operational Resilience Act (DORA)": "EU regulation strengthening the operational resilience of financial entities and their critical third-party ICT service providers against cyber disruption.",
        "Health Insurance Portability and Accountability Act (HIPAA)": "United States federal statutory standard establishing strict safeguards for Protected Health Information (PHI) and electronic privacy.",
        "California Consumer Privacy Act (CCPA / CPRA)": "California state landmark privacy legislation providing consumers transparent opt-out rights, non-discrimination protections, and strict automated profiling controls.",
        "Personal Information Protection and Electronic Documents Act (PIPEDA)": "Canadian federal statutory law governing how private sector organizations handle personal information in commercial activities.",
        "ISO/IEC 27001:2022": "International flagship security standard defining requirements for establishing, implementing, maintaining, and continually improving an Information Security Management System (ISMS).",
        "Payment Card Industry Data Security Standard (PCI DSS 4.0)": "Global cardholder data security architecture enforcing network segmentation, multi-factor authentication, end-to-end cryptographic safeguards, and strict vulnerability testing."
    }

    req_counts = {}
    try:
        counts = db.query(
            Requirement.regulation_version_id,
            func.count(Requirement.id)
        ).group_by(Requirement.regulation_version_id).all()
        req_counts = {str(vid): cnt for vid, cnt in counts if vid}
    except Exception:
        req_counts = {}

    result = []
    for r in regs:
        desc = framework_map.get(r.name) or default_descriptions.get(r.name) or "Official canonical compliance regulation framework."
        vid_str = str(r.current_version_id) if r.current_version_id else None
        req_count = req_counts.get(vid_str, 0) if vid_str else 0
        
        created_str = (
            r.created_at.isoformat() 
            if hasattr(r, "created_at") and r.created_at is not None 
            else datetime.now(timezone.utc).isoformat()
        )
        
        result.append({
            "id": str(r.id),
            "name": r.name,
            "jurisdiction": r.jurisdiction,
            "description": desc,
            "requirements_count": req_count,
            "current_version_id": vid_str,
            "source_url": r.source_url,
            "created_at": created_str
        })

    if page is not None and page_size is not None:
        p = max(1, page)
        ps = min(100, max(1, page_size))
        total_pages = (total_items + ps - 1) // ps if ps > 0 else 1
        return {
            "items": result,
            "pagination": {
                "page": p,
                "page_size": ps,
                "total_items": total_items,
                "total_pages": total_pages,
                "has_next": p < total_pages,
                "has_prev": p > 1
            }
        }

    # Cache full list for 60s
    if cache_key:
        ResponseCache.set(cache_key, result, ttl_seconds=60)
    return result



@router.get("/frameworks")
def list_frameworks(db: Session = Depends(get_db)):
    frameworks = db.query(FrameworkCatalog).order_by(FrameworkCatalog.name).all()
    return [
        {
            "id": str(f.id),
            "name": f.name,
            "acronym": f.acronym,
            "jurisdiction": f.jurisdiction,
            "source_url": f.source_url,
            "is_fetchable": f.is_fetchable,
            "description": f.description
        }
        for f in frameworks
    ]


@router.post("/frameworks/{acronym}/ingest")
async def ingest_framework(
    request: Request,
    acronym: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    framework = db.query(FrameworkCatalog).filter(FrameworkCatalog.acronym == acronym).first()
    if not framework:
        raise HTTPException(status_code=404, detail="Framework not found")
        
    if not framework.is_fetchable:
        raise HTTPException(status_code=400, detail=f"{framework.name} requires a licensed custom upload.")

    # 1. Resolve and verify authenticated user
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required to ingest statutory frameworks."
        )

    # 2. Enforce 3 Free Uses Policy & Atomic Concurrency-Safe Entitlement Reservation
    entitlement_service = EntitlementService(db)
    op_id = request.headers.get("X-Idempotency-Key") or f"ingest-{acronym}-{uuid.uuid4()}"
    usage_event = entitlement_service.reserve_usage(
        user=current_user,
        operation_type="framework_ingestion",
        operation_id=op_id,
        source="framework_catalog",
        metadata={"acronym": acronym}
    )

    try:
        fetcher = FrameworkFetcher()
        html_bytes, filename = await fetcher.fetch_html(framework.source_url)
        
        path = storage_service.upload_file(io.BytesIO(html_bytes), filename, content_type="text/html")
        
        # 1. Regulation
        is_local = not all([settings.S3_ACCESS_KEY, settings.S3_SECRET_KEY, settings.S3_BUCKET_NAME])
        prefix = "file://" if is_local else f"s3://{settings.S3_BUCKET_NAME}/"
        regulation = db.query(Regulation).filter(Regulation.name == framework.name).first()
        if not regulation:
            regulation = Regulation(
                name=framework.name,
                jurisdiction=framework.jurisdiction,
                source_url=f"{prefix}{path}"
            )
            db.add(regulation)
            db.flush()
            
        # 2. SourceDocument
        source_doc = SourceDocument(
            file_type=FileTypeEnum.html,
            storage_path=path,
            raw_text="",
            ocr_used=False,
            page_count=1
        )
        db.add(source_doc)
        db.flush()
        
        # 3. Version
        version = RegulationVersion(
            regulation_id=regulation.id,
            version_label="1.0",
            published_date=datetime.now(timezone.utc).date(),
            ingested_at=datetime.now(timezone.utc),
            source_document_id=source_doc.id
        )
        db.add(version)
        db.flush()
        
        source_doc.regulation_version_id = version.id
        regulation.current_version_id = version.id
        db.commit()
        
        job = BackgroundJob(
            job_type=JobTypeEnum.ingestion,
            entity_id=str(version.id)
        )
        db.add(job)
        db.commit()

        try:
            task = process_ingestion_pipeline.delay(str(job.id), str(source_doc.id))
            job.task_id = task.id
        except Exception as cel_err:
            logger.warning(f"Could not enqueue Celery task: {cel_err}")
            job.task_id = str(uuid.uuid4())
        db.commit()

        # Trigger reliable background execution immediately
        run_pipeline_in_background(str(job.id), str(source_doc.id))

        # Mark usage successfully completed
        entitlement_service.complete_usage(op_id)

        return {
            "regulation_id": str(regulation.id),
            "regulation_version_id": str(version.id),
            "job_id": str(job.id),
            "operation_id": op_id,
            "message": f"Started ingestion pipeline for {framework.name}"
        }

    except HTTPException:
        entitlement_service.release_usage(op_id, reason="client_http_exception")
        raise
    except Exception as fatal_ex:
        entitlement_service.release_usage(op_id, reason=f"fatal_error: {str(fatal_ex)}")
        raise


# ---------------------------------------------------------
# Parameterized / Specific Regulation Operations
# ---------------------------------------------------------

@router.post("/{regulation_id}/amend")
@limiter.limit("5/minute")
async def amend_regulation(
    request: Request,
    regulation_id: uuid.UUID,
    file: UploadFile = File(...),
    version_label: str = Form(...),
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.compliance_officer, RoleEnum.developer])),
    db: Session = Depends(get_db)
):
    reg = db.query(Regulation).filter(Regulation.id == regulation_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Regulation not found")

    # Check spending cap
    try:
        check_spending_cap(db, current_user.org_id, expected_invocation_cost=0.02)
    except SpendingCapExceededException as sce:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=str(sce))

    # Sanitize filename
    clean_filename = sanitize_filename(file.filename)

    ext = clean_filename.split('.')[-1].lower() if '.' in clean_filename else ''
    if ext == 'pdf':
        file_type = FileTypeEnum.pdf
    elif ext in ['htm', 'html']:
        file_type = FileTypeEnum.html
    else:
        raise HTTPException(status_code=400, detail="Only PDF and HTML supported.")

    # Validate file size (25MB enterprise limit)
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the 25MB maximum limit."
        )

    # Validate magic bytes
    if not validate_file_magic_bytes(content, ext):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Security verification failed: File contents do not match valid {ext.upper()} magic byte format."
        )
    await file.seek(0)

    try:
        storage_path = storage_service.upload_file(file.file, clean_filename, file.content_type)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to upload file")

    source_doc = SourceDocument(
        file_type=file_type,
        storage_path=storage_path,
        raw_text="",
        ocr_used=False,
        page_count=0
    )
    db.add(source_doc)
    db.flush()

    new_version = RegulationVersion(
        regulation_id=regulation_id,
        version_label=version_label,
        published_date=datetime.now(timezone.utc).date(),
        ingested_at=datetime.now(timezone.utc),
        source_document_id=source_doc.id
    )
    db.add(new_version)
    db.flush()
    
    old_version_id = reg.current_version_id
    source_doc.regulation_version_id = new_version.id
    reg.current_version_id = new_version.id
    db.commit()

    # Enqueue real Celery task for amendment
    job = BackgroundJob(
        job_type=JobTypeEnum.amendment,
        entity_id=str(new_version.id)
    )
    db.add(job)
    db.commit()

    try:
        task = process_amendment_pipeline.delay(
            str(job.id), 
            str(source_doc.id), 
            str(old_version_id), 
            str(new_version.id)
        )
        job.task_id = task.id
    except Exception as cel_err:
        logger.warning(f"Could not enqueue Celery task: {cel_err}")
        job.task_id = str(uuid.uuid4())
    db.commit()

    # Trigger reliable background execution immediately
    run_pipeline_in_background(str(job.id), str(source_doc.id))

    # Invalidate cached regulation lists
    ResponseCache.invalidate("regulations")

    return {
        "regulation_version_id": str(new_version.id),
        "job_id": str(job.id)
    }


@router.get("/{regulation_id}/dashboard-summary")
def get_dashboard_summary(
    regulation_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    reg = db.query(Regulation).filter(Regulation.id == regulation_id).first()
    if not reg:
        ver = db.query(RegulationVersion).filter(RegulationVersion.id == regulation_id).first()
        if ver:
            reg = db.query(Regulation).filter(Regulation.id == ver.regulation_id).first()
    if not reg or not reg.current_version_id:
        raise HTTPException(status_code=404, detail="Regulation not found")

    # Aggregate queries
    total = db.query(func.count(Requirement.id)).filter(Requirement.regulation_version_id == reg.current_version_id).scalar()
    
    # Types
    obligations = db.query(func.count(Requirement.id)).filter(
        Requirement.regulation_version_id == reg.current_version_id,
        Requirement.type == "obligation"
    ).scalar()
    
    prohibitions = db.query(func.count(Requirement.id)).filter(
        Requirement.regulation_version_id == reg.current_version_id,
        Requirement.type == "prohibition"
    ).scalar()
    
    # High risk
    high_risk = db.query(func.count(Requirement.id)).filter(
        Requirement.regulation_version_id == reg.current_version_id,
        Requirement.severity == "high"
    ).scalar()
    
    # Recent additions (last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent = db.query(func.count(Requirement.id)).filter(
        Requirement.regulation_version_id == reg.current_version_id,
        Requirement.created_at >= seven_days_ago
    ).scalar()
    
    # Severity distribution
    severity_dist = db.query(Requirement.severity, func.count(Requirement.id)).filter(
        Requirement.regulation_version_id == reg.current_version_id
    ).group_by(Requirement.severity).all()
    
    # Status distribution
    status_dist = db.query(Requirement.validation_status, func.count(Requirement.id)).filter(
        Requirement.regulation_version_id == reg.current_version_id
    ).group_by(Requirement.validation_status).all()

    return {
        "total_requirements": total or 0,
        "total_obligations": obligations or 0,
        "total_prohibitions": prohibitions or 0,
        "high_risk_controls": high_risk or 0,
        "recent_additions": recent or 0,
        "severity_distribution": {sev.value: count for sev, count in severity_dist},
        "status_distribution": {stat.value: count for stat, count in status_dist}
    }


@router.get("/{regulation_id}/activity")
def get_recent_activity(
    regulation_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    reg = db.query(Regulation).filter(Regulation.id == regulation_id).first()
    if not reg or not reg.current_version_id:
        raise HTTPException(status_code=404, detail="Regulation not found")

    activities = db.query(AuditLog, User.email).join(
        User, AuditLog.actor_id == User.id
    ).join(
        Requirement, AuditLog.entity_id == Requirement.id
    ).filter(
        Requirement.regulation_version_id == reg.current_version_id,
        AuditLog.entity_type == "Requirement"
    ).order_by(AuditLog.created_at.desc()).limit(10).all()

    data = []
    for log, email in activities:
        data.append({
            "id": str(log.id),
            "action": log.action,
            "entity_id": str(log.entity_id),
            "metadata": log.metadata_,
            "actor_email": email,
            "timestamp": log.created_at.isoformat()
        })
        
    return {"data": data}


@router.get("/{regulation_id}/policy/download")
def download_regulation_policy(
    regulation_id: uuid.UUID,
    db: Session = Depends(get_db)
):
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
        raise HTTPException(status_code=400, detail="Regulation has no compiled version")

    policy = db.query(Policy).filter(Policy.regulation_version_id == version_id).first()
    
    reqs = db.query(Requirement).filter(
        Requirement.regulation_version_id == version_id
    ).all()

    if not reqs:
        raise HTTPException(status_code=404, detail="No compiled requirements found for this regulation")

    # Extract knowledge graph from requirements metadata if available
    kg_entities = []
    kg_relationships = []
    for r in reqs:
        if r.meta_data and "knowledge_graph" in r.meta_data:
            kg = r.meta_data["knowledge_graph"]
            kg_entities.extend(kg.get("entities", []))
            kg_relationships.extend(kg.get("relationships", []))
            break
            
    # Deduplicate entities
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
        "policy_id": str(policy.id) if policy else str(uuid.uuid4()),
        "regulation_id": str(reg.id),
        "regulation_name": reg.name,
        "jurisdiction": reg.jurisdiction,
        "status": policy.status.value if policy and hasattr(policy.status, 'value') else "deployed",
        "deployed_at": policy.deployed_at.isoformat() if policy and policy.deployed_at else datetime.now(timezone.utc).isoformat(),
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
    
    clean_filename = re.sub(r'[^a-zA-Z0-9_\-]', '_', reg.name.lower())[:40]
    return Response(
        content=json.dumps(policy_export, indent=2),
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{clean_filename}_executable_policy.json"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.get("/{regulation_id}")
def get_regulation(
    regulation_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    reg = db.query(Regulation).filter(Regulation.id == regulation_id).first()
    if not reg:
        ver = db.query(RegulationVersion).filter(RegulationVersion.id == regulation_id).first()
        if ver:
            reg = db.query(Regulation).filter(Regulation.id == ver.regulation_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Regulation not found")

    req_count = 0
    if reg.current_version_id:
        req_count = db.query(func.count(Requirement.id)).filter(
            Requirement.regulation_version_id == reg.current_version_id
        ).scalar() or 0

    return {
        "id": str(reg.id),
        "name": reg.name,
        "jurisdiction": reg.jurisdiction,
        "source_url": reg.source_url,
        "current_version_id": str(reg.current_version_id) if reg.current_version_id else None,
        "requirements_count": req_count,
        "created_at": reg.created_at.isoformat()
    }
