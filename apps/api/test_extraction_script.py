import logging
import os
from dotenv import load_dotenv

# Load root .env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.regulations import SourceDocument, DocumentSection
from app.pipelines.extraction import run_extraction_pipeline

logging.basicConfig(level=logging.INFO)

import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/regulation_db")
# Fix localhost to postgres if running inside docker (for testing)
if os.environ.get("DOCKER_ENV"):
    DATABASE_URL = DATABASE_URL.replace("localhost", "postgres")
    
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_pipeline():
    db = SessionLocal()
    try:
        # Get the most recently uploaded SourceDocument
        source_doc = db.query(SourceDocument).order_by(SourceDocument.created_at.desc()).first()
        if not source_doc:
            print("No source documents found in DB. Please upload one first.")
            return

        print(f"Found SourceDocument: {source_doc.id}")
        print(f"File Path: {source_doc.storage_path}")

        # Run extraction
        sections = run_extraction_pipeline(db, source_doc.id)
        
        print(f"\n--- SUCCESS! Created {sections} sections ---")
        
        # Print a few sections
        created_sections = db.query(DocumentSection).filter(DocumentSection.source_document_id == source_doc.id).order_by(DocumentSection.order_index).limit(5).all()
        for sec in created_sections:
            print(f"Section {sec.order_index}: {sec.reference_label} ({len(sec.raw_text)} chars)")
            print(f"Preview: {sec.raw_text[:100]}...\n")
            
    finally:
        db.close()

if __name__ == "__main__":
    test_pipeline()
