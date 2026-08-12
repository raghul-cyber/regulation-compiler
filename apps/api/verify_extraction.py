import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/regulation_db")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("\n--- 2. source_documents (raw_text preview) ---")
    doc = conn.execute(text("SELECT raw_text, page_count, ocr_used FROM source_documents ORDER BY created_at DESC LIMIT 1")).fetchone()
    print(f"Page Count: {doc.page_count}")
    print(f"OCR Used: {doc.ocr_used}")
    print("\nRaw Text Preview (first 500 chars):")
    print(doc.raw_text[:500])

    print("\n\n--- 3. document_sections (first 10 rows) ---")
    sections = conn.execute(text("SELECT reference_label, order_index, length(raw_text) as text_len FROM document_sections WHERE source_document_id = (SELECT id FROM source_documents ORDER BY created_at DESC LIMIT 1) ORDER BY order_index ASC LIMIT 10")).fetchall()
    
    for s in sections:
        print(f"Index {s.order_index} | {s.reference_label} | {s.text_len} chars")
