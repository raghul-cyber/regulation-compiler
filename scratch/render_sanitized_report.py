import os
import sys
import re
import html
import pymupdf
from jinja2 import Template
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.abspath("apps/api"))
sys.path.insert(0, os.path.abspath("."))
from app.db.session import SessionLocal
from app.models.regulations import Regulation
from app.models.requirements import Requirement
from app.models.organizations import Organization
from app.services.reporting import BASE_CSS, COMPOSITE_REPORT_TMPL, extract_clean_list, extract_citation

ARTIFACT_DIR = "C:/Users/rcrag/.gemini/antigravity-ide/brain/fcae8e30-6301-4069-a84b-9b626f1b3aeb"

def clean_regulatory_text(val: str) -> str:
    if not val:
        return ""
    text = str(val)
    # Strip HTML tags
    text = re.sub(r'</?[a-zA-Z0-9_\-]+(?:\s+[^>]*)?/?>?', ' ', text)
    # Strip leading/trailing orphan HTML fragments like '/div>', '="4%"/>'
    text = re.sub(r'^\s*(?:/?(?:div|col|tbody|tr|td|p|span|table|body|html|thead)\b\s*>|="[^"]*"\s*/?>|\s*>\s*)+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\b[a-zA-Z0-9_\-]+="[^"]*"\s*/?>?', ' ', text)
    text = re.sub(r'="[^"]*"\s*/?>?', ' ', text)
    # Unescape HTML entities
    text = html.unescape(text)
    # Clean leftover prefixes like 'Obligation Control 1: /div>'
    text = re.sub(r'^Obligation Control \d+:\s*(?:/?(?:div|col|tbody|tr|td|p|span)\b\s*>|="[^"]*"\s*/?>|\s*>\s*)*', '', text, flags=re.IGNORECASE).strip()
    # Normalize whitespace & non-breaking spaces
    text = text.replace('\xa0', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def format_condition_rule(rule_dict: dict) -> str:
    if not isinstance(rule_dict, dict):
        return str(rule_dict)
    field = rule_dict.get("field", "condition")
    op = rule_dict.get("operator", "EQUALS")
    val = rule_dict.get("value", True)
    
    clean_field = field.replace("statutory.", "").replace("control.", "").replace("system.", "").replace("_", " ").replace(".", " ").title().strip()
    if op == "EQUALS":
        if val is True:
            return f"{clean_field}: Mandatory"
        elif val is False:
            return f"{clean_field}: Prohibited"
        else:
            return f"{clean_field} == {val}"
    return f"{clean_field} {op} {val}"

def extract_conditions_readable(conditions) -> list[str]:
    if not conditions:
        return []
    if isinstance(conditions, dict):
        if "rules" in conditions and isinstance(conditions["rules"], list):
            return [format_condition_rule(r) for r in conditions["rules"]]
        res = []
        for k, v in conditions.items():
            k_clean = k.replace("_", " ").title()
            if isinstance(v, bool):
                if v:
                    res.append(f"{k_clean}: Mandatory")
                else:
                    res.append(f"{k_clean}: Prohibited")
            elif isinstance(v, dict):
                res.append(f"{k_clean}: {format_condition_rule(v)}")
            elif isinstance(v, list):
                sub = ", ".join(str(x) for x in v)
                res.append(f"{k_clean} ({sub})")
            else:
                res.append(f"{k_clean}: {v}")
        return res
    if isinstance(conditions, list):
        res = []
        for item in conditions:
            if isinstance(item, dict):
                res.extend(extract_conditions_readable(item))
            else:
                res.append(str(item))
        return res
    return [str(conditions)]

def test_sanitized_render():
    db = SessionLocal()
    reg = db.query(Regulation).filter(Regulation.name == 'Digital Operational Resilience Act').first()
    reqs = []
    for v in reg.versions:
        v_reqs = db.query(Requirement).filter(Requirement.regulation_version_id == v.id).all()
        if v_reqs:
            reqs = v_reqs
            break
            
    org = db.query(Organization).first()
    org_name = org.name if org else "Acme Corp"

    formatted_reqs = []
    crit_count = 0
    high_count = 0

    for idx, r in enumerate(reqs, 1):
        s_val = r.severity.value if hasattr(r.severity, 'value') else str(r.severity or 'medium').lower()
        t_val = r.type.value if hasattr(r.type, 'value') else str(r.type or 'obligation').lower()
        if s_val == 'critical': crit_count += 1
        elif s_val == 'high': high_count += 1

        citation = extract_citation({
            "references": r.references,
            "meta_data": r.meta_data,
            "title": r.title,
            "description": r.description
        })

        clean_t = clean_regulatory_text(r.title)
        clean_d = clean_regulatory_text(r.description)
        if not clean_t or len(clean_t) < 4:
            clean_t = f"Operational Mandate: {clean_d[:55]}..."

        actions_list = extract_clean_list(r.actions)
        evidence_list = extract_clean_list(r.evidence_required)
        conditions_list = extract_conditions_readable(r.conditions)

        formatted_reqs.append({
            "id": str(r.id),
            "title": clean_t,
            "description": clean_d,
            "severity_str": s_val,
            "type_str": t_val,
            "citation": citation,
            "actions": actions_list,
            "evidence_required": evidence_list,
            "conditions": conditions_list
        })
    db.close()

    selected_sections = ["executive_summary", "gap_analysis", "technical"]
    section_titles = ["Executive Summary", "Gap Analysis", "Technical System Mapping"]
    report_title = "Comprehensive Statutory Compliance Report"

    template = Template(COMPOSITE_REPORT_TMPL, autoescape=True)
    rendered_html = template.render(
        base_css=BASE_CSS,
        regulation=reg,
        requirements=formatted_reqs,
        critical_count=crit_count,
        high_count=high_count,
        date="2026-09-09 11:45:00",
        org_name=org_name,
        report_id="sanitized-dora-test-99",
        report_title=report_title,
        selected_sections=selected_sections,
        section_names=section_titles
    )

    pdf_out = os.path.join(os.path.dirname(__file__), "sanitized_test_report.pdf")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_content(rendered_html, wait_until="load")
        pdf_bytes = page.pdf(
            format="A4",
            print_background=True,
            margin={"top": "18mm", "bottom": "20mm", "left": "15mm", "right": "15mm"}
        )
        browser.close()

    with open(pdf_out, "wb") as f:
        f.write(pdf_bytes)

    doc = pymupdf.open(pdf_out)
    print(f"Generated {len(doc)} pages with sanitized engine!")
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=150)
        img_path = os.path.join(ARTIFACT_DIR, f"sanitized_page_{i+1}.png")
        pix.save(img_path)
        print(f"Saved page {i+1} to {img_path}")

if __name__ == "__main__":
    test_sanitized_render()
