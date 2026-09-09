import os
from playwright.sync_api import sync_playwright

def inspect_pdf():
    pdf_path = os.path.abspath("scratch/test_composite_executive_gap.pdf")
    assert os.path.exists(pdf_path), f"File {pdf_path} not found"
    
    with open(pdf_path, "rb") as f:
        content = f.read()

    print(f"PDF File size: {len(content)} bytes")
    # Quick string search in PDF stream
    text_indicators = [
        b"Executive Summary",
        b"Gap Analysis",
        b"Statutory",
        b"DORA",
        b"Regulation"
    ]
    for ind in text_indicators:
        found = ind in content
        print(f"Indicator {ind.decode('utf-8')}: {'FOUND' if found else 'NOT FOUND'}")

if __name__ == "__main__":
    inspect_pdf()
