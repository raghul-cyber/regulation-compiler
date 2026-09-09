import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath("apps/api"))
from jinja2 import Template
from playwright.async_api import async_playwright
from app.db.session import SessionLocal
from app.models.regulations import Regulation
from app.models.requirements import Requirement
from app.services.reporting import BASE_CSS, COMPOSITE_REPORT_TMPL, SECTION_NAMES

ARTIFACT_DIR = "C:/Users/rcrag/.gemini/antigravity-ide/brain/fcae8e30-6301-4069-a84b-9b626f1b3aeb"

async def render_pdf_preview():
    db = SessionLocal()
    reg = db.query(Regulation).filter(Regulation.name.ilike("%DORA%")).first()
    if not reg:
        reg = db.query(Regulation).first()

    reqs = db.query(Requirement).filter(Requirement.regulation_version_id == reg.current_version_id).all()
    formatted_reqs = []
    crit_count = 0
    high_count = 0
    for r in reqs:
        s_val = r.severity.value if hasattr(r.severity, 'value') else str(r.severity or 'medium').lower()
        t_val = r.type.value if hasattr(r.type, 'value') else str(r.type or 'obligation').lower()
        if s_val == 'critical': crit_count += 1
        elif s_val == 'high': high_count += 1
        
        citation = "Statutory Directive"
        if r.references and isinstance(r.references, dict):
            citation = r.references.get("clause") or citation
        if citation == "Statutory Directive" and r.meta_data and isinstance(r.meta_data, dict):
            citation = r.meta_data.get("clause_ref") or citation

        formatted_reqs.append({
            "id": str(r.id),
            "title": r.title or "Regulatory Requirement",
            "description": r.description or "Mandatory statutory compliance obligation.",
            "severity_str": s_val,
            "type_str": t_val,
            "citation": citation,
            "actions": r.actions if isinstance(r.actions, list) else ([str(r.actions)] if r.actions else []),
            "evidence_required": r.evidence_required if isinstance(r.evidence_required, list) else ([str(r.evidence_required)] if r.evidence_required else []),
            "conditions": r.conditions,
            "conditions_str": str(r.conditions)
        })
    db.close()

    selected_sections = ["executive_summary", "gap_analysis"]
    section_titles = [SECTION_NAMES.get(s, s) for s in selected_sections]
    report_title = f"{section_titles[0]} & {section_titles[1]}"

    tmpl = Template(COMPOSITE_REPORT_TMPL)
    html_content = tmpl.render(
        base_css=BASE_CSS,
        regulation=reg,
        requirements=formatted_reqs,
        critical_count=crit_count,
        high_count=high_count,
        date="2026-09-09 10:45:00",
        org_id="Default Enterprise Org",
        report_id="composite-audit-7890",
        report_title=report_title,
        selected_sections=selected_sections,
        section_names=section_titles
    )

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 900, "height": 1400})
        await page.set_content(html_content, wait_until="load")
        
        # Take full page screenshot
        out_path = os.path.join(ARTIFACT_DIR, "unified_report_document_preview.png")
        await page.screenshot(path=out_path, full_page=True)
        print(f"Rendered multi-section document preview to {out_path}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(render_pdf_preview())
