import os
import uuid
import logging
from dotenv import load_dotenv

# Load env before any local app imports!
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.regulations import SourceDocument, DocumentSection, RegulationVersion
from app.models.requirements import Requirement
from app.models.audit import LLMLog
from app.pipelines.extraction import run_llm_extraction

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/regulation_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from sqlalchemy.sql import text

def main():
    logger.info("Setting up database...")
    db = SessionLocal()
    
    try:
        # 0. WIPE PREVIOUS RUN DATA
        db.execute(text("DELETE FROM llm_logs"))
        db.execute(text("DELETE FROM requirements"))
        db.commit()
        
        # 1. Look for the GDPR document we uploaded
        source_doc = db.query(SourceDocument).filter(SourceDocument.page_count > 10).order_by(SourceDocument.created_at.desc()).first()
        
        if not source_doc:
            logger.error("No SourceDocument found with >10 pages. Run the Phase 4 test first!")
            return
            
        # 2. Get or create a Regulation Version
        reg_version = db.query(RegulationVersion).first()
        if not reg_version:
            logger.error("No RegulationVersion found.")
            return
            
        # 3. Inject artificial repair trigger into chunk 7's text
        target_section = db.query(DocumentSection).filter(
            DocumentSection.source_document_id == source_doc.id,
            DocumentSection.order_index == 6 # chunk 7
        ).first()
        if target_section and "artificial_repair_trigger" not in target_section.raw_text:
            target_section.raw_text += "\n artificial_repair_trigger"
            db.commit()
            
        # 4. Run the Pipeline!
        logger.info(f"Testing LLM Extraction on SourceDocument: {source_doc.id}")
        logger.info(f"Document has {len(source_doc.sections)} parsed sections.")
        
        requirements_added = run_llm_extraction(db, source_doc.id, reg_version.id)
        
        if requirements_added > 0:
            logger.info(f"\n--- SUCCESS! Extracted {requirements_added} structured requirements ---\n")
            
            # Print a sample of extracted requirements
            reqs = db.query(Requirement).limit(5).all()
            print("\n--- Extracted Requirements (Sample) ---")
            for req in reqs:
                print(f"\n[Severity: {req.severity.value}] {req.title}")
                print(f"Desc: {req.description}")
                print(f"Conditions: {req.conditions.get('items', [])}")
                print(f"Actions: {req.actions.get('items', [])}")
                print(f"References: {req.references.get('items', [])}")
                
        # 5. Print Total Spend
        print("\n--- LLM Logs (Spend & Telemetry) ---")
        logs = db.query(LLMLog).all()
        total_cost = sum(log.estimated_cost for log in logs)
        for log in logs[:10]:
            print(f"{log.action_type} | {log.model_name} | {log.prompt_tokens + log.completion_tokens} tokens | ${log.estimated_cost:.5f}")
        print(f"\nREAL TOTAL SPEND SO FAR: ${total_cost:.5f}")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
