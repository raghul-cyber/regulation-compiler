"""
Generates production-grade, Google-compliant XML Sitemap and Robots policy
for RegCompiler (Regulation as Code Compiler).
Strictly zero mocks: Grounded directly in live Supabase PostgreSQL database entities.
"""

import os
import sys
import json
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

# Resolve base paths
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB_DIR = os.path.join(REPO_ROOT, "apps", "web")
PUBLIC_DIR = os.path.join(WEB_DIR, "public")
DATA_FILE = os.path.join(WEB_DIR, "src", "lib", "canonical-regulations.json")
API_DIR = os.path.join(REPO_ROOT, "apps", "api")

BASE_URL = "https://www.regcompiler.app"

def fetch_regulations_from_db():
    try:
        sys.path.insert(0, API_DIR)
        from app.db.session import SessionLocal
        from app.models.regulations import Regulation
        db = SessionLocal()
        regs = db.query(Regulation).all()
        db.close()
        
        # Zero mocks filter: reject any test/dummy/mock entities
        clean_regs = []
        for r in regs:
            name_lower = (r.name or "").lower().strip()
            if name_lower.startswith("test reg") or name_lower.startswith("mock") or name_lower == "test":
                continue
            clean_regs.append({
                "id": str(r.id),
                "name": r.name,
                "jurisdiction": r.jurisdiction,
                "created_at": r.created_at.isoformat() if hasattr(r, "created_at") and r.created_at else None
            })
        print(f"[DB] Successfully fetched {len(clean_regs)} genuine statutory regulations from Supabase DB.")
        return clean_regs
    except Exception as e:
        print(f"[DB Warning] Could not connect directly to database ({e}). Checking local snapshot...")
        return None

def get_regulations():
    # 1. Try DB
    regs = fetch_regulations_from_db()
    if regs:
        # Update local snapshot
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(regs, f, indent=2)
        return regs

    # 2. Try JSON snapshot
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            snapshot = json.load(f)
            clean_regs = [
                r for r in snapshot 
                if not (r.get("name", "").lower().startswith("test reg") or r.get("name", "").lower().startswith("mock"))
            ]
            print(f"[Snapshot] Loaded {len(clean_regs)} canonical regulations from {DATA_FILE}")
            return clean_regs

    raise RuntimeError("No regulations found in DB or snapshot file!")

def generate_sitemap(regulations):
    urlset = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")

    def add_entry(loc: str, priority: float, changefreq: str, lastmod: str):
        url = ET.SubElement(urlset, "url")
        loc_el = ET.SubElement(url, "loc")
        loc_el.text = loc
        lastmod_el = ET.SubElement(url, "lastmod")
        lastmod_el.text = lastmod
        changefreq_el = ET.SubElement(url, "changefreq")
        changefreq_el.text = changefreq
        priority_el = ET.SubElement(url, "priority")
        priority_el.text = f"{priority:.1f}"

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # 1. Core Primary Landing Page (Highest Google Search Priority: 1.0)
    add_entry(f"{BASE_URL}/", 1.0, "daily", now_iso)

    # 2. Main Regulatory Directory & Intelligence Catalogs (Priority: 0.9)
    add_entry(f"{BASE_URL}/regulations", 0.9, "daily", now_iso)

    # 3. High-Value Interactive Compliance & Pricing Tools (Priority: 0.8)
    add_entry(f"{BASE_URL}/compliance-check", 0.8, "weekly", now_iso)
    add_entry(f"{BASE_URL}/billing", 0.8, "weekly", now_iso)

    # 4. Canonical Statutory Frameworks & Regulation Detail Pages (Priority: 0.8)
    for reg in regulations:
        reg_id = reg["id"]
        raw_date = reg.get("created_at") or now_iso
        if "." in raw_date:
            raw_date = raw_date.split(".")[0] + "Z"
        elif not raw_date.endswith("Z"):
            raw_date = raw_date + "Z"

        # Direct Regulation View
        add_entry(f"{BASE_URL}/regulations/{reg_id}", 0.8, "weekly", raw_date)
        
        # In-Depth Statutory Controls & Analysis (Priority: 0.6)
        add_entry(f"{BASE_URL}/regulations/{reg_id}/requirements", 0.6, "weekly", raw_date)
        add_entry(f"{BASE_URL}/regulations/{reg_id}/diff", 0.6, "weekly", raw_date)
        add_entry(f"{BASE_URL}/regulations/{reg_id}/reports", 0.6, "weekly", raw_date)

    # 5. Statutory Governance & Legal Agreements (Priority: 0.5)
    add_entry(f"{BASE_URL}/privacy", 0.5, "monthly", now_iso)
    add_entry(f"{BASE_URL}/terms", 0.5, "monthly", now_iso)

    # 6. Portal Access Endpoints (Priority: 0.4)
    add_entry(f"{BASE_URL}/sign-in", 0.4, "monthly", now_iso)
    add_entry(f"{BASE_URL}/sign-up", 0.4, "monthly", now_iso)

    tree = ET.ElementTree(urlset)
    ET.indent(tree, space="  ", level=0)

    xml_header = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content = xml_header + ET.tostring(urlset, encoding="utf-8").decode("utf-8")

    out_file = os.path.join(PUBLIC_DIR, "sitemap.xml")
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(xml_content)

    print(f"[Sitemap] Successfully wrote {len(urlset)} URLs to {out_file}")
    return len(urlset)

def generate_robots():
    robots_content = f"""# https://www.robotstxt.org/robotstxt.html
# RegCompiler Statutory Intelligence Search Crawler Rules

User-agent: *
Allow: /
Allow: /regulations
Allow: /regulations/*
Allow: /compliance-check
Allow: /billing
Allow: /privacy
Allow: /terms
Allow: /sitemap.xml

# Protect internal workspace and authenticated tenant routes
Disallow: /admin
Disallow: /admin/*
Disallow: /settings
Disallow: /settings/*
Disallow: /dashboard
Disallow: /dashboard/*
Disallow: /api/*
Disallow: /_next/*

# Dedicated Googlebot Directives
User-agent: Googlebot
Allow: /
Allow: /regulations
Allow: /regulations/*
Allow: /compliance-check
Allow: /billing
Allow: /privacy
Allow: /terms
Allow: /sitemap.xml
Disallow: /admin
Disallow: /admin/*
Disallow: /settings
Disallow: /settings/*
Disallow: /dashboard
Disallow: /dashboard/*
Disallow: /api/*
Disallow: /_next/*

# XML Sitemap Location
Sitemap: {BASE_URL}/sitemap.xml
"""
    out_file = os.path.join(PUBLIC_DIR, "robots.txt")
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(robots_content)
    print(f"[Robots] Successfully wrote {out_file}")

if __name__ == "__main__":
    regs = get_regulations()
    generate_sitemap(regs)
    generate_robots()
