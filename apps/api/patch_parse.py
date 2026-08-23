import os

filepath = "app/pipelines/extraction.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

old_parse = """        if source_doc.file_type.value == "pdf" or source_doc.storage_path.endswith(".pdf"):
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            page_count = len(doc)
            for page in doc:
                raw_text += page.get_text() + "\\n"
        else:
            raw_text = file_bytes.decode('utf-8')"""

new_parse = """        if file_bytes == b"MOCK_PDF_CONTENT":
            logger.info("Using fallback sample text since S3 is in MOCK mode.")
            import os
            sample_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "gdpr.html")
            if os.path.exists(sample_path):
                with open(sample_path, "r", encoding="utf-8") as sf:
                    raw_text = sf.read()
            else:
                raw_text = "Article 5: Personal data shall be processed lawfully. Article 32: Implement security measures."
            page_count = 1
        elif source_doc.file_type.value == "pdf" or source_doc.storage_path.endswith(".pdf"):
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            page_count = len(doc)
            for page in doc:
                raw_text += page.get_text() + "\\n"
        else:
            raw_text = file_bytes.decode('utf-8')"""

content = content.replace(old_parse, new_parse)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched extraction.py successfully!")
