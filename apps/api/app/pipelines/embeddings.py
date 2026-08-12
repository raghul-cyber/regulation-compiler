import logging
import os
from sqlalchemy.orm import Session
from sqlalchemy import select
from google import genai
from google.genai import types
from app.models.requirements import Requirement, RequirementEmbedding, ValidationStatusEnum

logger = logging.getLogger(__name__)

def generate_requirement_embedding(db: Session, requirement_id: str, client: genai.Client = None):
    """
    Generates an embedding for a requirement and checks for duplicates.
    """
    if not client:
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        
    req = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not req:
        logger.error(f"Requirement {requirement_id} not found.")
        return False
        
    # Check if embedding already exists
    existing_emb = db.query(RequirementEmbedding).filter(RequirementEmbedding.id == req.id).first()
    if existing_emb:
        logger.info(f"Embedding already exists for requirement {req.id}")
        return True
        
    # Construct embedding text
    conditions_text = ", ".join(req.conditions.get("items", [])) if req.conditions else ""
    actions_text = ", ".join(req.actions.get("items", [])) if req.actions else ""
    embed_text = f"Requirement: {req.title}\nDescription: {req.description}\nConditions: {conditions_text}\nActions: {actions_text}"
    
    try:
        emb_res = client.models.embed_content(
            model='gemini-embedding-2',
            contents=embed_text,
            config=types.EmbedContentConfig(output_dimensionality=768)
        )
        # Gemeni SDK returns a list of embeddings
        embedding_vector = emb_res.embeddings[0].values
        
        # 1. Check for duplicates using pgvector cosine distance (<=>)
        # Threshold 0.08 distance means > 0.92 cosine similarity
        stmt = select(RequirementEmbedding.id).where(
            RequirementEmbedding.embedding.cosine_distance(embedding_vector) < 0.08
        ).where(
            RequirementEmbedding.id != req.id
        )
        
        duplicate_ids = [str(row[0]) for row in db.execute(stmt).all()]
        
        if duplicate_ids:
            logger.info(f"Found {len(duplicate_ids)} potential duplicates for {req.id}")
            meta = req.meta_data.copy() if req.meta_data else {}
            meta["potential_duplicates"] = duplicate_ids
            req.meta_data = meta
            # Force pending review if duplicates found
            req.validation_status = ValidationStatusEnum.pending_review
            
        # 2. Store the embedding
        new_emb = RequirementEmbedding(
            id=req.id,
            embedding=embedding_vector,
            model_used='gemini-embedding-2'
        )
        db.add(new_emb)
        db.commit()
        return True
        
    except Exception as e:
        logger.error(f"Failed to generate embedding for requirement {req.id}: {e}")
        db.rollback()
        return False
