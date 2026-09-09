import os
import sys
import pymupdf
from jinja2 import Template
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.abspath("apps/api"))
sys.path.insert(0, os.path.abspath("."))
from app.db.session import SessionLocal
from app.models.regulations import Regulation
from app.models.requirements import Requirement
from app.models.organizations import Organization

# Include the new formatters
from scratch.test_formatters import extract_clean_list, extract_citation, format_human_label

ARTIFACT_DIR = "C:/Users/rcrag/.gemini/antigravity-ide/brain/fcae8e30-6301-4069-a84b-9b626f1b3aeb"

NEW_BASE_CSS = """
    @page {
        size: A4 portrait;
        margin: 20mm 15mm 22mm 15mm;
        @top-left {
            content: "STATUTORY COMPLIANCE COMPILER \\2022  OFFICIAL AUDIT RECORD";
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 7pt;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.08em;
        }
        @top-right {
            content: "STRICT ENFORCEMENT DIRECTIVE";
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 7pt;
            font-weight: 700;
            color: #7c3aed;
            letter-spacing: 0.08em;
        }
        @bottom-left {
            content: "CONFIDENTIAL \\2022  CERTIFIED CODIFIED STATUTORY AUDIT";
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 7pt;
            color: #94a3b8;
            letter-spacing: 0.04em;
        }
        @bottom-right {
            content: "Page " counter(page) " of " counter(pages);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 7.5pt;
            font-weight: 600;
            color: #64748b;
        }
    }
    * { box-sizing: border-box; }
    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
        background: #ffffff;
        line-height: 1.5;
        font-size: 9.5pt;
        padding: 0;
        margin: 0;
        -webkit-font-smoothing: antialiased;
    }
    
    /* Top Letterhead Banner */
    .letterhead {
        border-bottom: 2px solid #7c3aed;
        padding-bottom: 18px;
        margin-bottom: 20px;
    }
    .letterhead-accent {
        height: 4px;
        background: linear-gradient(90deg, #7c3aed, #4f46e5, #06b6d4);
        margin-bottom: 16px;
        border-radius: 2px;
    }
    .letterhead-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }
    .doc-classification {
        display: inline-block;
        font-size: 7.5pt;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #6d28d9;
        background: #f5f3ff;
        border: 1px solid #ddd6fe;
        padding: 3px 8px;
        border-radius: 4px;
        margin-bottom: 8px;
    }
    .doc-title {
        font-size: 20pt;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 6px 0;
        letter-spacing: -0.02em;
        line-height: 1.2;
    }
    .doc-subtitle {
        font-size: 11pt;
        color: #475569;
        margin: 0;
        font-weight: 600;
    }
    .jurisdiction-badge {
        display: inline-block;
        font-size: 7.5pt;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 4px;
        background: #0ea5e9;
        color: #ffffff;
        margin-left: 6px;
        vertical-align: middle;
    }
    
    .doc-meta-box {
        text-align: right;
        font-size: 8pt;
        color: #64748b;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 10px 14px;
        min-width: 220px;
    }
    .meta-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
    }
    .meta-row:last-child { margin-bottom: 0; }
    .meta-lbl { font-weight: 600; color: #475569; margin-right: 12px; }
    .meta-val { font-weight: 700; color: #0f172a; }

    /* Metadata Ribbon */
    .metadata-ribbon {
        display: table;
        width: 100%;
        table-layout: fixed;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        margin-bottom: 22px;
    }
    .ribbon-cell {
        display: table-cell;
        padding: 8px 12px;
        border-right: 1px solid #e2e8f0;
        font-size: 8pt;
        vertical-align: middle;
    }
    .ribbon-cell:last-child { border-right: none; }
    .ribbon-lbl { font-size: 7pt; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; display: block; margin-bottom: 2px; }
    .ribbon-val { font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }

    /* KPI Metrics Cards */
    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 24px;
    }
    .metric-box {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px 14px;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .metric-box.purple { border-top: 3px solid #7c3aed; }
    .metric-box.red { border-top: 3px solid #ef4444; }
    .metric-box.amber { border-top: 3px solid #f59e0b; }
    .metric-box.green { border-top: 3px solid #10b981; }
    
    .metric-num { font-size: 20pt; font-weight: 800; line-height: 1; margin-bottom: 4px; }
    .metric-box.purple .metric-num { color: #7c3aed; }
    .metric-box.red .metric-num { color: #dc2626; }
    .metric-box.amber .metric-num { color: #d97706; }
    .metric-box.green .metric-num { color: #059669; }
    .metric-tag { font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }

    /* Module Index Ribbon */
    .module-index {
        background: #faf5ff;
        border: 1px solid #e9d5ff;
        border-radius: 6px;
        padding: 10px 14px;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .module-index-title {
        font-size: 7.5pt;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #6b21a8;
        margin-right: 12px;
        white-space: nowrap;
    }
    .module-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }
    .pill-item {
        background: #ffffff;
        border: 1px solid #d8b4fe;
        color: #6b21a8;
        font-size: 7.5pt;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 4px;
    }

    /* Section Headings */
    .section-header {
        border-bottom: 2px solid #0f172a;
        padding-bottom: 6px;
        margin-top: 28px;
        margin-bottom: 14px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
    }
    .section-title {
        font-size: 13pt;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
        letter-spacing: -0.01em;
    }
    .section-badge {
        font-size: 7pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 2px 6px;
        border-radius: 3px;
    }
    .badge-exec { background: #f3e8ff; color: #6b21a8; }
    .badge-gap { background: #fee2e2; color: #991b1b; }
    .badge-tech { background: #e0e7ff; color: #3730a3; }
    .badge-audit { background: #ecfdf5; color: #065f46; }
    .badge-check { background: #f1f5f9; color: #334155; }

    .section-narrative {
        color: #334155;
        font-size: 9.5pt;
        line-height: 1.55;
        margin-bottom: 18px;
    }

    /* Requirement Cards */
    .audit-card {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-left: 4px solid #7c3aed;
        border-radius: 6px;
        margin-bottom: 14px;
        page-break-inside: avoid;
        break-inside: avoid;
        box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .audit-card.critical { border-left-color: #dc2626; }
    .audit-card.high { border-left-color: #ea580c; }
    .audit-card.medium { border-left-color: #ca8a04; }

    .card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        padding: 8px 14px;
        border-top-right-radius: 5px;
    }
    .citation-tag {
        font-size: 7.5pt;
        font-weight: 800;
        color: #4338ca;
        background: #e0e7ff;
        padding: 2px 7px;
        border-radius: 4px;
        letter-spacing: 0.04em;
        margin-right: 8px;
    }
    .card-req-title {
        font-size: 9.5pt;
        font-weight: 700;
        color: #0f172a;
        flex: 1;
    }
    .severity-pill {
        font-size: 7pt;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 2px 8px;
        border-radius: 4px;
    }
    .pill-critical { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .pill-high { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
    .pill-medium { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
    .pill-low { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

    .card-content {
        padding: 12px 14px;
    }
    .card-desc {
        font-size: 9pt;
        color: #334155;
        line-height: 1.5;
        margin: 0 0 10px 0;
    }

    /* Specifications 2-column grid */
    .specs-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 10px 12px;
    }
    .spec-pane-title {
        font-size: 7pt;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #475569;
        margin-bottom: 6px;
        border-bottom: 1px solid #cbd5e1;
        padding-bottom: 3px;
    }
    .spec-item-list {
        list-style: none;
        padding: 0;
        margin: 0;
        font-size: 8pt;
        color: #1e293b;
    }
    .spec-item-list li {
        margin-bottom: 4px;
        display: flex;
        align-items: flex-start;
        line-height: 1.35;
    }
    .spec-item-list li:last-child { margin-bottom: 0; }
    .bullet-action {
        color: #7c3aed;
        font-weight: bold;
        margin-right: 6px;
    }
    .bullet-evidence {
        color: #059669;
        font-weight: bold;
        margin-right: 6px;
    }
    .stipulations-strip {
        margin-top: 8px;
        background: #faf5ff;
        border: 1px solid #f3e8ff;
        border-radius: 4px;
        padding: 6px 10px;
        font-size: 7.5pt;
        color: #581c87;
    }

    /* Page Breaks */
    .page-break {
        page-break-before: always;
        break-before: page;
        margin-top: 24px;
    }

    /* Table Styles */
    table.audit-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        margin-bottom: 20px;
        font-size: 8pt;
        page-break-inside: auto;
    }
    table.audit-table th {
        background: #1e293b;
        color: #f8fafc;
        text-align: left;
        padding: 8px 10px;
        font-weight: 700;
        font-size: 7.5pt;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        border: 1px solid #1e293b;
    }
    table.audit-table td {
        padding: 8px 10px;
        border: 1px solid #e2e8f0;
        vertical-align: top;
        line-height: 1.4;
    }
    table.audit-table tr:nth-child(even) td {
        background: #f8fafc;
    }
"""

def generate_sample_report():
    db = SessionLocal()
    reg = db.query(Regulation).filter(Regulation.name.ilike("%DORA%")).first()
    if not reg: reg = db.query(Regulation).first()

    reqs = db.query(Requirement).filter(Requirement.regulation_version_id == reg.current_version_id).all()
    org = db.query(Organization).first()
    org_name = org.name if org else "Enterprise Compliance Division"

    formatted_reqs = []
    crit_count = 0
    high_count = 0

    for r in reqs:
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

        actions_list = extract_clean_list(r.actions)
        evidence_list = extract_clean_list(r.evidence_required)
        conditions_list = extract_clean_list(r.conditions)

        formatted_reqs.append({
            "id": str(r.id),
            "title": r.title or "Regulatory Requirement",
            "description": r.description or "Mandatory statutory compliance obligation.",
            "severity_str": s_val,
            "type_str": t_val,
            "citation": citation,
            "actions": actions_list,
            "evidence_required": evidence_list,
            "conditions": conditions_list
        })
    db.close()

    selected_sections = ["executive_summary", "gap_analysis"]
    report_title = "Executive Summary & Gap Analysis Report"

    tmpl_html = """
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <style>{{ base_css }}</style>
    </head>
    <body>
        <!-- Formal Letterhead -->
        <div class="letterhead">
            <div class="letterhead-accent"></div>
            <div class="letterhead-content">
                <div>
                    <span class="doc-classification">Official Statutory Audit Record</span>
                    <h1 class="doc-title">{{ report_title }}</h1>
                    <p class="doc-subtitle">{{ regulation.name }} <span class="jurisdiction-badge">{{ regulation.jurisdiction }}</span></p>
                </div>
                <div class="doc-meta-box">
                    <div class="meta-row"><span class="meta-lbl">DOC REF:</span><span class="meta-val">RAC-{{ report_id[:8]|upper }}</span></div>
                    <div class="meta-row"><span class="meta-lbl">ISSUER:</span><span class="meta-val">{{ org_name }}</span></div>
                    <div class="meta-row"><span class="meta-lbl">TIMESTAMP:</span><span class="meta-val">{{ date }} UTC</span></div>
                    <div class="meta-row"><span class="meta-lbl">COMPLIANCE:</span><span class="meta-val" style="color: #059669;">100% CODIFIED</span></div>
                </div>
            </div>
        </div>

        <!-- Metadata Ribbon -->
        <div class="metadata-ribbon">
            <div class="ribbon-cell">
                <span class="ribbon-lbl">Issuing Entity</span>
                <span class="ribbon-val">{{ org_name }}</span>
            </div>
            <div class="ribbon-cell">
                <span class="ribbon-lbl">Legal Framework</span>
                <span class="ribbon-val">{{ regulation.name }}</span>
            </div>
            <div class="ribbon-cell">
                <span class="ribbon-lbl">Jurisdiction & Scope</span>
                <span class="ribbon-val">{{ regulation.jurisdiction }} &bull; Canonical Rulebook</span>
            </div>
            <div class="ribbon-cell">
                <span class="ribbon-lbl">Supervisory Status</span>
                <span class="ribbon-val" style="color: #7c3aed;">Certified Active Enforcement</span>
            </div>
        </div>

        <!-- KPI Scorecard -->
        <div class="metrics-grid">
            <div class="metric-box purple">
                <div class="metric-num">{{ requirements|length }}</div>
                <div class="metric-tag">Enforceable Controls</div>
            </div>
            <div class="metric-box red">
                <div class="metric-num">{{ critical_count }}</div>
                <div class="metric-tag">Critical Obligations</div>
            </div>
            <div class="metric-box amber">
                <div class="metric-num">{{ high_count }}</div>
                <div class="metric-tag">High-Risk Safeguards</div>
            </div>
            <div class="metric-box green">
                <div class="metric-num">100%</div>
                <div class="metric-tag">Verification Coverage</div>
            </div>
        </div>

        <!-- Included Modules Index -->
        <div class="module-index">
            <div class="module-index-title">Included Audit Modules</div>
            <div class="module-pills">
                <span class="pill-item">&#10003; 1.0 Executive Summary & Mandate</span>
                <span class="pill-item">&#10003; 2.0 Regulatory Gap Analysis</span>
            </div>
        </div>

        <!-- Section 1: Executive Summary -->
        <div class="section-header">
            <h2 class="section-title">1.0 Executive Summary & Statutory Mandate</h2>
            <span class="section-badge badge-exec">Executive Directive</span>
        </div>
        <div class="section-narrative">
            This executive compliance report compiles the binding technical and operational controls derived from the statutory codified text of <strong>{{ regulation.name }}</strong> ({{ regulation.jurisdiction }}).
            The directives outlined below represent mandatory technical baseline obligations requiring continuous log preservation, verifiable system actions, and formal proof for statutory oversight inspections.
        </div>

        {% for req in requirements %}
        <div class="audit-card {{ req.severity_str }}">
            <div class="card-top">
                <div style="display: flex; align-items: center;">
                    <span class="citation-tag">{{ req.citation }}</span>
                    <span class="card-req-title">{{ req.title }}</span>
                </div>
                <span class="severity-pill pill-{{ req.severity_str }}">{{ req.severity_str }}</span>
            </div>
            <div class="card-content">
                <div class="card-desc">{{ req.description }}</div>
                
                <div class="specs-grid">
                    <div>
                        <div class="spec-pane-title">Mandatory Technical Actions</div>
                        {% if req.actions %}
                            <ul class="spec-item-list">
                            {% for act in req.actions %}
                                <li><span class="bullet-action">&bull;</span>{{ act }}</li>
                            {% endfor %}
                            </ul>
                        {% else %}
                            <span style="color: #64748b; font-size: 8pt;">Enforce baseline technical security protocols.</span>
                        {% endif %}
                    </div>
                    <div>
                        <div class="spec-pane-title">Supervisory Audit Deliverables</div>
                        {% if req.evidence_required %}
                            <ul class="spec-item-list">
                            {% for ev in req.evidence_required %}
                                <li><span class="bullet-evidence">&#10003;</span>{{ ev }}</li>
                            {% endfor %}
                            </ul>
                        {% else %}
                            <span style="color: #64748b; font-size: 8pt;">Cryptographic log preservation and configuration snapshot.</span>
                        {% endif %}
                    </div>
                </div>

                {% if req.conditions %}
                <div class="stipulations-strip">
                    <strong>Statutory Stipulations:</strong> {{ req.conditions|join(' &bull; ') }}
                </div>
                {% endif %}
            </div>
        </div>
        {% endfor %}

        <!-- Section 2: Gap Analysis (starts on clean page) -->
        <div class="page-break"></div>

        <div class="section-header">
            <h2 class="section-title">2.0 Regulatory Gap Analysis & High-Risk Exposure Assessment</h2>
            <span class="section-badge badge-gap">Risk Assessment</span>
        </div>
        <div class="section-narrative">
            The provisions detailed below represent statutory mandates carrying maximum compliance risk under <strong>{{ regulation.name }}</strong>.
            Provisions classified as Critical or High severity require immediate technical safeguard mobilization; missing or incomplete controls expose the institution to supervisory fines and operational mandates.
        </div>

        {% for req in requirements if req.severity_str in ['critical', 'high'] %}
        <div class="audit-card {{ req.severity_str }}">
            <div class="card-top">
                <div style="display: flex; align-items: center;">
                    <span class="citation-tag" style="background: #fee2e2; color: #991b1b;">{{ req.citation }}</span>
                    <span class="card-req-title" style="color: #991b1b;">URGENT REMEDIATION: {{ req.title }}</span>
                </div>
                <span class="severity-pill pill-{{ req.severity_str }}">{{ req.severity_str }}</span>
            </div>
            <div class="card-content">
                <div class="card-desc">{{ req.description }}</div>
                
                <div class="specs-grid">
                    <div>
                        <div class="spec-pane-title" style="color: #991b1b;">Immediate Remediation Actions</div>
                        {% if req.actions %}
                            <ul class="spec-item-list">
                            {% for act in req.actions %}
                                <li><span class="bullet-action" style="color: #dc2626;">&bull;</span><strong>{{ act }}</strong></li>
                            {% endfor %}
                            </ul>
                        {% else %}
                            <span style="color: #dc2626; font-size: 8pt;">Deploy immediate technical safeguards and verify configuration baseline.</span>
                        {% endif %}
                    </div>
                    <div>
                        <div class="spec-pane-title">Required Audit Deliverables</div>
                        {% if req.evidence_required %}
                            <ul class="spec-item-list">
                            {% for ev in req.evidence_required %}
                                <li><span class="bullet-evidence">&#10003;</span>{{ ev }}</li>
                            {% endfor %}
                            </ul>
                        {% else %}
                            <span style="color: #64748b; font-size: 8pt;">Signed architectural remediation sign-off & system telemetry logs.</span>
                        {% endif %}
                    </div>
                </div>

                {% if req.conditions %}
                <div class="stipulations-strip" style="background: #fff1f2; border-color: #ffe4e6; color: #9f1239;">
                    <strong>Exposure Conditions:</strong> {{ req.conditions|join(' &bull; ') }}
                </div>
                {% endif %}
            </div>
        </div>
        {% endfor %}
    </body>
    </html>
    """

    template = Template(tmpl_html)
    rendered_html = template.render(
        base_css=NEW_BASE_CSS,
        regulation=reg,
        requirements=formatted_reqs,
        critical_count=crit_count,
        high_count=high_count,
        date="2026-09-09 11:30:00",
        org_name=org_name,
        report_id="composite-audit-7890",
        report_title=report_title
    )

    pdf_out = os.path.join(os.path.dirname(__file__), "new_report_design.pdf")
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

    # Render PDF pages to PNG
    doc = pymupdf.open(pdf_out)
    print(f"Generated {len(doc)} pages in new design!")
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=150)
        pix.save(f"scratch/new_design_page_{i+1}.png")
    print("Saved all rendered pages to scratch/new_design_page_*.png")

if __name__ == "__main__":
    generate_sample_report()
