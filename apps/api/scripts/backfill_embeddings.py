import os
import sys
import logging
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from google import genai
from app.models.requirements import Requirement, RequirementEmbedding
from app.pipelines.embeddings import generate_requirement_embedding

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/regulation_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def backfill():
    db = SessionLocal()
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    
    try:
        # Find all requirements that do NOT have a corresponding embedding
        reqs = db.query(Requirement).outerjoin(RequirementEmbedding, Requirement.id == RequirementEmbedding.id).filter(
            RequirementEmbedding.id.is_(None)
        ).all()
        
        logger.info(f"Found {len(reqs)} requirements missing embeddings.")
        
        success_count = 0
        for req in reqs:
            logger.info(f"Generating embedding for requirement {req.id}")
            if generate_requirement_embedding(db, req.id, client):
                success_count += 1
                
        logger.info(f"Successfully generated embeddings for {success_count} requirements.")
        
    finally:
        db.close()

if __name__ == "__main__":
    backfill()
