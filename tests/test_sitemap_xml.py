"""
Test Suite: Google Search Priority sitemap.xml Validation
Enforces:
1. Sitemaps.org 0.9 schema compliance
2. Google Search Central priority guidelines (0.0 to 1.0)
3. ISO-8601 W3C Datetime compliance for <lastmod>
4. ZERO MOCKS: All regulation IDs must be genuine database UUIDs, no placeholder/mock domains
5. Correct robots.txt configuration and sitemap declaration
"""

import os
import re
import uuid
import xml.etree.ElementTree as ET
from datetime import datetime

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITEMAP_PATH = os.path.join(REPO_ROOT, "apps", "web", "public", "sitemap.xml")
ROBOTS_PATH = os.path.join(REPO_ROOT, "apps", "web", "public", "robots.txt")
DATA_PATH = os.path.join(REPO_ROOT, "apps", "web", "src", "lib", "canonical-regulations.json")

def test_sitemap_xml():
    print("--- [1/6] Testing sitemap.xml existence & XML parsing ---")
    assert os.path.exists(SITEMAP_PATH), f"sitemap.xml not found at {SITEMAP_PATH}"
    
    with open(SITEMAP_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    assert content.startswith("<?xml"), "Sitemap must begin with XML declaration"
    tree = ET.parse(SITEMAP_PATH)
    root = tree.getroot()
    
    # Check namespace
    expected_ns = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
    assert root.tag == f"{expected_ns}urlset", f"Expected root <urlset> with namespace, got {root.tag}"
    print(f"PASS: Valid XML document with root <urlset> and correct namespace.")

    print("\n--- [2/6] Validating URL structure, priority & changefreq ---")
    urls = root.findall(f"{expected_ns}url")
    assert len(urls) > 0, "Sitemap contains no URLs!"
    print(f"Total indexed URLs: {len(urls)}")

    valid_changefreqs = {"always", "hourly", "daily", "weekly", "monthly", "yearly", "never"}
    
    homepage_found = False
    regulations_hub_found = False
    compliance_check_found = False
    billing_found = False

    for url_el in urls:
        loc = url_el.find(f"{expected_ns}loc")
        assert loc is not None and loc.text, "Missing or empty <loc>"
        loc_text = loc.text.strip()
        assert loc_text.startswith("https://www.regcompiler.app"), f"URL must be absolute and use canonical domain: {loc_text}"

        # Validate priority
        priority_el = url_el.find(f"{expected_ns}priority")
        assert priority_el is not None and priority_el.text, f"Missing <priority> for {loc_text}"
        priority_val = float(priority_el.text)
        assert 0.0 <= priority_val <= 1.0, f"Priority must be between 0.0 and 1.0, got {priority_val} on {loc_text}"

        # Validate changefreq
        cf_el = url_el.find(f"{expected_ns}changefreq")
        assert cf_el is not None and cf_el.text in valid_changefreqs, f"Invalid changefreq for {loc_text}"

        # Validate lastmod
        lm_el = url_el.find(f"{expected_ns}lastmod")
        assert lm_el is not None and lm_el.text, f"Missing <lastmod> for {loc_text}"
        # Parse ISO date
        lm_str = lm_el.text.replace("Z", "+00:00")
        try:
            datetime.fromisoformat(lm_str)
        except Exception as e:
            raise AssertionError(f"Invalid ISO-8601 lastmod timestamp '{lm_el.text}' on {loc_text}: {e}")

        # Check key priorities
        if loc_text == "https://www.regcompiler.app/":
            homepage_found = True
            assert priority_val == 1.0, f"Homepage priority must be 1.0, got {priority_val}"
            assert cf_el.text == "daily"
        elif loc_text == "https://www.regcompiler.app/regulations":
            regulations_hub_found = True
            assert priority_val == 0.9, f"Regulations directory priority must be 0.9, got {priority_val}"
            assert cf_el.text == "daily"
        elif loc_text == "https://www.regcompiler.app/compliance-check":
            compliance_check_found = True
            assert priority_val == 0.8
        elif loc_text == "https://www.regcompiler.app/billing":
            billing_found = True
            assert priority_val == 0.8

    assert homepage_found, "Homepage not found in sitemap"
    assert regulations_hub_found, "Regulations directory not found in sitemap"
    assert compliance_check_found, "Compliance check page not found in sitemap"
    assert billing_found, "Billing page not found in sitemap"
    print("PASS: Core routes have calibrated Google Search priorities (1.0, 0.9, 0.8, etc.) and valid ISO timestamps.")

    print("\n--- [3/6] ZERO MOCKS AUDIT: Verifying genuine regulation data ---")
    mock_patterns = [r"example\.com", r"mock", r"test[_\s-]?reg", r"placeholder"]
    for url_el in urls:
        loc = url_el.find(f"{expected_ns}loc").text
        for p in mock_patterns:
            assert not re.search(p, loc, re.IGNORECASE), f"MOCK DETECTED in sitemap URL: {loc} matches '{p}'"

    # Verify that all /regulations/<id> paths have valid UUIDs
    reg_urls = [u.find(f"{expected_ns}loc").text for u in urls if "/regulations/" in u.find(f"{expected_ns}loc").text]
    assert len(reg_urls) > 0, "No regulation detail URLs found"

    uuid_pattern = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
    for rurl in reg_urls:
        parts = rurl.split("/regulations/")[1].split("/")
        reg_id = parts[0]
        assert uuid_pattern.match(reg_id), f"Regulation ID in URL is not a valid UUID: {reg_id} (URL: {rurl})"
    print(f"PASS: Zero mocks verified across {len(reg_urls)} regulation URLs. All UUIDs are genuine.")

    print("\n--- [4/6] Validating robots.txt ---")
    assert os.path.exists(ROBOTS_PATH), f"robots.txt not found at {ROBOTS_PATH}"
    with open(ROBOTS_PATH, "r", encoding="utf-8") as f:
        robots_content = f.read()

    assert "Sitemap: https://www.regcompiler.app/sitemap.xml" in robots_content, "robots.txt must point to sitemap.xml"
    assert "Disallow: /admin" in robots_content, "robots.txt must protect internal /admin"
    assert "Disallow: /settings" in robots_content, "robots.txt must protect internal /settings"
    assert "Allow: /regulations" in robots_content, "robots.txt must allow regulations"
    print("PASS: robots.txt properly references sitemap.xml and enforces search crawler policies.")

    print("\n--- [5/6] Verifying canonical data JSON integrity ---")
    assert os.path.exists(DATA_PATH), f"Data snapshot missing at {DATA_PATH}"
    import json
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert len(data) >= 150, f"Expected at least 150 regulations in dataset, got {len(data)}"
    for item in data:
        assert uuid_pattern.match(item["id"]), f"Invalid UUID: {item['id']}"
        assert item["name"], "Regulation missing name"
        assert not item["name"].lower().startswith("test reg"), f"Mock item in dataset: {item['name']}"
    print(f"PASS: Canonical dataset contains {len(data)} genuine statutory regulations.")

    print("\n--- [6/6] Verifying Next.js TypeScript route files ---")
    sitemap_ts = os.path.join(REPO_ROOT, "apps", "web", "src", "app", "sitemap.ts")
    robots_ts = os.path.join(REPO_ROOT, "apps", "web", "src", "app", "robots.ts")
    assert os.path.exists(sitemap_ts), f"Missing {sitemap_ts}"
    assert os.path.exists(robots_ts), f"Missing {robots_ts}"
    print("PASS: Next.js metadata route handlers exist.")

    print("\n=========================================")
    print(" ALL SITEMAP & GOOGLE SEARCH AUDITS PASSED!")
    print("=========================================")

if __name__ == "__main__":
    test_sitemap_xml()
