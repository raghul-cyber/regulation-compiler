import os

# Update tasks.py
tasks_path = r"apps\api\app\workers\tasks.py"
with open(tasks_path, "r", encoding="utf-8") as f:
    tasks_content = f.read()

tasks_content = tasks_content.replace(
"""def update_job_status(db: Session, job_id: uuid.UUID, status: JobStatusEnum, result: dict = None, error: str = None):""",
"""def update_job_status(db: Session, job_id: uuid.UUID, status: JobStatusEnum, result: dict = None, error: str = None):
    # Merge existing result_data if present to not overwrite the stages
    job = db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
    if job and result and job.result_data:
        merged = job.result_data.copy()
        merged.update(result)
        result = merged
"""
)

tasks_content = tasks_content.replace(
"""        # 1. Extraction (PDF parsing, OCR, chunking)
        run_extraction_pipeline(db, uuid.UUID(source_doc_id))""",
"""        # Stages 1-3 handled during initialization and here
        update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing, {"stage": 3, "stage_name": "Queue Ingestion Job"})
        
        # Pass job_id so extraction can report stages 4-13
        run_extraction_pipeline(db, uuid.UUID(source_doc_id), job_id)
        
        update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing, {"stage": 14, "stage_name": "LLM Requirement Extraction"})
        update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing, {"stage": 15, "stage_name": "Embedding Generation"})
        update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing, {"stage": 16, "stage_name": "Vector Database Sync"})
        update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing, {"stage": 17, "stage_name": "Compliance Diff Calculation"})
        update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing, {"stage": 18, "stage_name": "Finalizing Version"})
"""
)

with open(tasks_path, "w", encoding="utf-8") as f:
    f.write(tasks_content)


# Update extraction.py
extraction_path = r"apps\api\app\pipelines\extraction.py"
with open(extraction_path, "r", encoding="utf-8") as f:
    extr_content = f.read()

extr_content = extr_content.replace(
"""def run_extraction_pipeline(db: Session, source_document_id: uuid.UUID):""",
"""def run_extraction_pipeline(db: Session, source_document_id: uuid.UUID, job_id: str = None):
    from app.workers.tasks import update_job_status, JobStatusEnum"""
)

extr_content = extr_content.replace(
"""    # 2. Download PDF from S3""",
"""    if job_id: update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing, {"stage": 4, "stage_name": "Download Document from S3"})
    # 2. Download PDF from S3"""
)

extr_content = extr_content.replace(
"""    # 3. Extract text page by page with PyMuPDF""",
"""    if job_id: update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing, {"stage": 5, "stage_name": "Stream PDF/HTML to Memory"})
    if job_id: update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing, {"stage": 6, "stage_name": "Page Counting & Layout Analysis"})
    if job_id: update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing, {"stage": 7, "stage_name": "PyMuPDF Text Extraction"})
    # 3. Extract text page by page with PyMuPDF"""
)

extr_content = extr_content.replace(
"""        # 4. Implement Tesseract OCR fallback for short pages""",
"""        # 4. Implement Tesseract OCR fallback for short pages
        if job_id: update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing, {"stage": 8, "stage_name": "OCR Quality Check"})"""
)

extr_content = extr_content.replace(
"""            logger.info(f"Page {page_num + 1} text too short ({len(page_text)} chars). Falling back to OCR.")""",
"""            logger.info(f"Page {page_num + 1} text too short ({len(page_text)} chars). Falling back to OCR.")
            if job_id: update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing, {"stage": 9, "stage_name": "Tesseract Fallback (if needed)"})"""
)

extr_content = extr_content.replace(
"""    # 5. Save raw_text, ocr_used, page_count""",
"""    if job_id: update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing, {"stage": 10, "stage_name": "Database Persistence (Raw Text)"})
    # 5. Save raw_text, ocr_used, page_count"""
)

extr_content = extr_content.replace(
"""    # 6. Implement regex segmentation (Article, Recital, etc.)""",
"""    if job_id: update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing, {"stage": 11, "stage_name": "Regex Segmentation Engine"})
    if job_id: update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing, {"stage": 12, "stage_name": "Article / Recital Mapping"})
    if job_id: update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing, {"stage": 13, "stage_name": "Chunking for LLM"})
    # 6. Implement regex segmentation (Article, Recital, etc.)"""
)

with open(extraction_path, "w", encoding="utf-8") as f:
    f.write(extr_content)

print("Backend stages patched.")
