import os
import sys
import json
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/regulation_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def verify():
    db = SessionLocal()
    try:
        # 1. Counts
        req_count = db.execute(text("SELECT count(*) FROM requirements")).scalar()
        emb_count = db.execute(text("SELECT count(*) FROM requirement_embeddings")).scalar()
        
        print(f"=== 1. Counts ===")
        print(f"requirements table: {req_count} rows")
        print(f"requirement_embeddings table: {emb_count} rows")
        print()
        
        if req_count == 0 or emb_count == 0:
            print("No data found!")
            return
            
        # 2. Sample Embedding (First 10 dims)
        first_emb = db.execute(text("SELECT id, embedding FROM requirement_embeddings LIMIT 1")).fetchone()
        
        print(f"=== 2. Sample Embedding ===")
        print(f"Requirement ID: {first_emb.id}")
        
        # Depending on how asyncpg/psycopg2 returns vectors, it might be a string or list
        emb_data = first_emb.embedding
        if isinstance(emb_data, str):
            emb_list = json.loads(emb_data)
        else:
            emb_list = list(emb_data)
            
        print(f"First 10 dimensions of 768:")
        print(emb_list[:10])
        print()
        
        # 3. Similarity Query
        print(f"=== 3. Nearest Neighbors (Cosine Similarity) ===")
        # Get the first requirement's vector to query against
        query_vector_str = f"[{','.join(map(str, emb_list))}]"
        
        sql = """
            SELECT r.id, r.title, 1 - (e.embedding <=> :query_vector) AS similarity
            FROM requirements r
            JOIN requirement_embeddings e ON r.id = e.id
            ORDER BY e.embedding <=> :query_vector
            LIMIT 5
        """
        
        neighbors = db.execute(text(sql), {"query_vector": query_vector_str}).fetchall()
        for i, n in enumerate(neighbors):
            print(f"{i+1}. {n.title} (ID: {n.id}) - Similarity: {n.similarity:.4f}")
        print()
        
        # 4. Duplicate Detection
        print(f"=== 4. Duplicate Detection ===")
        # Check if any have potential_duplicates in meta_data
        duplicates_sql = """
            SELECT id, title, meta_data->'potential_duplicates' AS dups
            FROM requirements
            WHERE meta_data ? 'potential_duplicates'
            LIMIT 1
        """
        has_dup = db.execute(text(duplicates_sql)).fetchone()
        
        if has_dup:
            print("Found a naturally occurring near-duplicate flagged in meta_data!")
            print(f"Requirement ID: {has_dup.id}")
            print(f"Title: {has_dup.title}")
            print(f"Duplicates Array: {has_dup.dups}")
        else:
            print("No natural duplicates flagged (highest was 0.904 < 0.920). Deliberately inserting a test duplicate...")
            
            from app.pipelines.embeddings import generate_requirement_embedding
            import uuid
            
            # 1. Grab an existing one to duplicate
            target_req = db.execute(text("SELECT * FROM requirements LIMIT 1")).fetchone()
            
            # 2. Insert fake duplicate requirement (same title/desc)
            fake_id = uuid.uuid4()
            fake_sql = """
                INSERT INTO requirements (id, regulation_version_id, section_id, type, title, description, conditions, actions, severity, evidence_required, "references", confidence_score, validation_status, meta_data)
                VALUES (:id, :rv_id, :sec_id, :type, :title, :desc, :cond, :act, :sev, :ev, :ref, :conf, :status, '{}'::jsonb)
            """
            db.execute(text(fake_sql), {
                "id": fake_id,
                "rv_id": target_req.regulation_version_id,
                "sec_id": target_req.section_id,
                "type": target_req.type,
                "title": f"COPY: {target_req.title}",
                "desc": target_req.description,
                "cond": '{"items": []}',
                "act": '{"items": []}',
                "sev": "low",
                "ev": '{"items": []}',
                "ref": '{"items": []}',
                "conf": 1.0,
                "status": "draft"
            })
            db.commit()
            
            # 3. Run the exact pipeline embedding function on this new fake requirement
            from google import genai
            client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
            generate_requirement_embedding(db, str(fake_id), client)
            
            # 4. Check if it got flagged
            flagged = db.execute(text("SELECT meta_data->'potential_duplicates' AS dups, validation_status FROM requirements WHERE id = :id"), {"id": fake_id}).fetchone()
            
            print(f"\n--- Fake Duplicate Trigger Results ---")
            print(f"Target ID: {target_req.id} ({target_req.title})")
            print(f"Fake Requirement ID: {fake_id}")
            print(f"Flagged duplicates array: {flagged.dups}")
            print(f"Updated status: {flagged.validation_status}")
            
            # 5. Cleanup
            db.execute(text("DELETE FROM requirements WHERE id = :id"), {"id": fake_id})
            db.commit()
            print("Test duplicate row deleted successfully.\n")
            
    finally:
        db.close()

if __name__ == "__main__":
    verify()
