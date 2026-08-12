import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv("../../.env")

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    req_count = conn.execute(text("SELECT count(*) FROM requirements")).scalar()
    emb_count = conn.execute(text("SELECT count(*) FROM requirement_embeddings")).scalar()
    print(f"Requirements: {req_count}")
    print(f"Embeddings: {emb_count}")
