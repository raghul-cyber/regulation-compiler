import logging
import uuid
import httpx
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.jobs import BackgroundJob, JobStatusEnum
from app.models.audit import Webhook
from app.pipelines.extraction import run_extraction_pipeline
# from app.pipelines.embeddings import run_embeddings_pipeline  # Assuming it exists
# from app.services.versioning import VersioningService
# from app.services.reporting import generate_report

logger = logging.getLogger(__name__)

def update_job_status(db: Session, job_id: uuid.UUID, status: JobStatusEnum, result: dict = None, error: str = None):
    job = db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
    if job:
        job.status = status
        if status == JobStatusEnum.processing and not job.started_at:
            job.started_at = datetime.now(timezone.utc)
        if status in [JobStatusEnum.completed, JobStatusEnum.failed]:
            job.completed_at = datetime.now(timezone.utc)
        if result:
            job.result_data = result
        if error:
            job.error_details = error
        db.commit()

@celery_app.task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
def process_ingestion_pipeline(self, job_id: str, source_doc_id: str):
    logger.info(f"Starting ingestion pipeline for job {job_id}")
    db = SessionLocal()
    try:
        update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing)
        
        # 1. Extraction (PDF parsing, OCR, chunking)
        run_extraction_pipeline(db, uuid.UUID(source_doc_id))
        
        # 2. LLM Requirement Extraction (mock call for now)
        # run_llm_extraction_pipeline(db, uuid.UUID(source_doc_id))
        
        # 3. Embeddings (mock call for now)
        # run_embeddings_pipeline(db, uuid.UUID(source_doc_id))

        update_job_status(db, uuid.UUID(job_id), JobStatusEnum.completed, {"message": "Pipeline completed successfully"})
    except Exception as e:
        logger.error(f"Ingestion pipeline failed: {str(e)}")
        # Only set to failed if we've exhausted retries, or do it anyway and let Celery retry update it back?
        # Better: if self.request.retries == self.max_retries (or close to it)
        update_job_status(db, uuid.UUID(job_id), JobStatusEnum.failed, error=str(e))
        raise
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
def process_amendment_pipeline(self, job_id: str, source_doc_id: str, old_version_id: str, new_version_id: str):
    logger.info(f"Starting amendment pipeline for job {job_id}")
    db = SessionLocal()
    try:
        update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing)
        
        # Run normal ingestion
        run_extraction_pipeline(db, uuid.UUID(source_doc_id))
        
        # Run diff engine
        from app.services.versioning import VersioningService
        svc = VersioningService(db)
        svc.generate_diff(uuid.UUID(old_version_id), uuid.UUID(new_version_id))

        update_job_status(db, uuid.UUID(job_id), JobStatusEnum.completed, {"message": "Amendment and Diff completed"})
    except Exception as e:
        logger.error(f"Amendment pipeline failed: {str(e)}")
        update_job_status(db, uuid.UUID(job_id), JobStatusEnum.failed, error=str(e))
        raise
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=5, autoretry_for=(httpx.RequestError,), retry_backoff=True)
def dispatch_webhook_task(self, webhook_id: str, payload: dict):
    logger.info(f"Dispatching webhook {webhook_id}")
    db = SessionLocal()
    try:
        wh = db.query(Webhook).filter(Webhook.id == uuid.UUID(webhook_id)).first()
        if not wh:
            return
            
        # Send HTTP POST
        response = httpx.post(
            wh.target_url,
            json={"event": "impact_alert", "data": payload},
            headers={"X-Rac-Signature": wh.secret_key},
            timeout=10.0
        )
        response.raise_for_status()
    except Exception as e:
        logger.error(f"Webhook dispatch failed: {str(e)}")
        raise
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=2, autoretry_for=(Exception,), retry_backoff=True)
def generate_report_task(self, job_id: str, report_id: str):
    logger.info(f"Generating report for job {job_id}")
    db = SessionLocal()
    try:
        update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing)
        
        # generate_report(db, uuid.UUID(report_id))
        
        update_job_status(db, uuid.UUID(job_id), JobStatusEnum.completed, {"url": f"https://mock-s3.com/{report_id}.pdf"})
    except Exception as e:
        update_job_status(db, uuid.UUID(job_id), JobStatusEnum.failed, error=str(e))
        raise
    finally:
        db.close()


import hashlib

@celery_app.task(bind=True, max_retries=2, autoretry_for=(httpx.RequestError,), retry_backoff=True)
def poll_regulations_task(self):
    """
    Phase 16: Poll all HTTP regulation sources, compute hash, and trigger amendment
    if the content has changed.
    """
    logger.info("Starting scheduled regulation polling (Celery Beat)")
    db = SessionLocal()
    try:
        from app.models.regulations import Regulation, SourceDocument, RegulationVersion, FileTypeEnum
        from app.models.jobs import BackgroundJob, JobTypeEnum
        from app.services.storage import StorageService
        import io
        
        storage_service = StorageService()
        
        # Only poll HTTP sources
        regs = db.query(Regulation).filter(Regulation.source_url.like("http%")).all()
        logger.info(f"Found {len(regs)} regulations to poll")
        
        for reg in regs:
            logger.info(f"Polling {reg.name} at {reg.source_url}")
            try:
                response = httpx.get(reg.source_url, timeout=30.0, follow_redirects=True)
                response.raise_for_status()
                
                content = response.content
                content_hash = hashlib.sha256(content).hexdigest()
                
                if reg.last_known_hash != content_hash:
                    logger.info(f"Hash change detected for {reg.name}! Old: {reg.last_known_hash}, New: {content_hash}")
                    
                    # Simulated S3 Upload of the new scrape
                    filename = f"{reg.name.replace(' ', '_')}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}.html"
                    # In a real app we'd pass a file-like object
                    file_obj = io.BytesIO(content)
                    storage_path = storage_service.upload_file(file_obj, filename, "text/html")
                    
                    # Create new version records
                    source_doc = SourceDocument(
                        file_type=FileTypeEnum.html,
                        storage_path=storage_path,
                        raw_text="",
                        ocr_used=False,
                        page_count=0
                    )
                    db.add(source_doc)
                    db.flush()
                    
                    version_label = f"Auto-scraped {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}"
                    new_version = RegulationVersion(
                        regulation_id=reg.id,
                        version_label=version_label,
                        published_date=datetime.now(timezone.utc).date(),
                        ingested_at=datetime.now(timezone.utc),
                        source_document_id=source_doc.id
                    )
                    db.add(new_version)
                    db.flush()
                    
                    source_doc.regulation_version_id = new_version.id
                    old_version_id = reg.current_version_id
                    reg.current_version_id = new_version.id
                    
                    # Update hash
                    reg.last_known_hash = content_hash
                    
                    # Enqueue Job
                    job = BackgroundJob(
                        job_type=JobTypeEnum.amendment,
                        entity_id=str(new_version.id)
                    )
                    db.add(job)
                    db.commit()
                    
                    task = process_amendment_pipeline.delay(
                        str(job.id), 
                        str(source_doc.id), 
                        str(old_version_id), 
                        str(new_version.id)
                    )
                    job.task_id = task.id
                    db.commit()
                    logger.info(f"Successfully enqueued amendment pipeline for {reg.name} (Job: {job.id})")
                else:
                    logger.info(f"No changes detected for {reg.name}")
                    
                reg.last_checked_at = datetime.now(timezone.utc)
                db.commit()
                
            except Exception as inner_e:
                logger.error(f"Failed to poll {reg.name}: {inner_e}")
                # Continue loop even if one fails
                
    except Exception as e:
        logger.error(f"Polling task failed: {e}")
        raise
    finally:
        db.close()
