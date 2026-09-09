import os
import uuid
import time
import io
import re
import json
from datetime import datetime, timezone
from jinja2 import Template
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.models.audit import Report, ReportStatusEnum
from app.models.requirements import Requirement
from app.models.regulations import Regulation
from app.models.organizations import Organization
from app.models.jobs import JobStatusEnum
from app.services.storage import StorageService
from app.workers.events import EventDispatcher
from app.workers.tasks import update_job_status

# --- Human-Readable Formatters & Extractors ---

ACRONYMS = {
    'ict': 'ICT', 'cmdb': 'CMDB', 'eol': 'EOL', 'mfa': 'MFA',
    'cve': 'CVE', 'cves': 'CVEs', 'sla': 'SLA', 'tlpt': 'TLPT',
    'ai': 'AI', 'gdpr': 'GDPR', 'dora': 'DORA', 'ast': 'AST',
    'api': 'API', 'id': 'ID', 'rbac': 'RBAC', 'tls': 'TLS',
    'pci': 'PCI', 'dss': 'DSS', 'soc': 'SOC', 'nist': 'NIST',
    'eu': 'EU', 'iso': 'ISO', 'grc': 'GRC'
}

def format_human_label(text: str) -> str:
    if not text:
        return ""
    text = str(text).strip()
    words = re.split(r'[\s_\-]+', text)
    formatted = []
    for i, w in enumerate(words):
        lw = w.lower()
        if lw in ACRONYMS:
            formatted.append(ACRONYMS[lw])
        elif i == 0:
            formatted.append(w.capitalize())
        else:
            formatted.append(w)
    return " ".join(formatted)

def extract_clean_list(val) -> list[str]:
    if not val:
        return []
    if isinstance(val, dict):
        res = []
        for k, v in val.items():
            k_fmt = format_human_label(k)
            if isinstance(v, bool):
                if v:
                    res.append(k_fmt)
            elif isinstance(v, (int, float, str)):
                res.append(f"{k_fmt}: {v}")
            elif isinstance(v, list):
                sub_items = ", ".join(format_human_label(x) for x in v)
                res.append(f"{k_fmt} ({sub_items})")
            else:
                res.append(k_fmt)
        return res
    if isinstance(val, list):
        res = []
        for item in val:
            if isinstance(item, dict):
                res.extend(extract_clean_list(item))
            else:
                res.append(format_human_label(str(item)))
        return res
    if isinstance(val, str):
        val_s = val.strip()
        if (val_s.startswith('{') and val_s.endswith('}')) or (val_s.startswith('[') and val_s.endswith(']')):
            try:
                parsed = json.loads(val_s)
                return extract_clean_list(parsed)
            except Exception:
                try:
                    import ast
                    parsed = ast.literal_eval(val_s)
                    return extract_clean_list(parsed)
                except Exception:
                    pass
        if ";" in val_s:
            return [format_human_label(x) for x in val_s.split(";") if x.strip()]
        if "," in val_s and not val_s.startswith("http"):
            return [format_human_label(x) for x in val_s.split(",") if x.strip()]
        return [format_human_label(val_s)]
    return [format_human_label(str(val))]

def extract_citation(r_dict: dict) -> str:
    # 1. Check references dict
    refs = r_dict.get("references")
    if isinstance(refs, dict):
        for key in ["article", "clause", "section", "paragraph", "recital"]:
            if refs.get(key):
                return str(refs[key]).strip()
    
    # 2. Check meta_data dict
    meta = r_dict.get("meta_data")
    if isinstance(meta, dict):
        for key in ["clause_ref", "article", "clause", "section"]:
            if meta.get(key):
                return str(meta[key]).strip()

    # 3. Check title / description regex
    title = r_dict.get("title", "")
    desc = r_dict.get("description", "")
    m = re.search(r'\b(Article\s+\d+(\([a-z0-9]+\))*|Section\s+\d+(\.\d+)*|Art\.\s+\d+)\b', f"{title} {desc}", re.IGNORECASE)
    if m:
        return m.group(1).title()

    return "Mandatory Directive"


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
    import html as py_html
    text = py_html.unescape(text)
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


# --- Executive Letterhead & Precision Border CSS ---
BASE_CSS = """
    @page {
        size: A4 portrait;
        margin: 18mm 15mm 20mm 15mm;
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
        padding-bottom: 16px;
        margin-bottom: 18px;
    }
    .letterhead-accent {
        height: 4px;
        background: linear-gradient(90deg, #7c3aed, #4f46e5, #06b6d4);
        margin-bottom: 14px;
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
        font-size: 19pt;
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
        margin-bottom: 20px;
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
        margin-bottom: 22px;
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
        padding: 8px 14px;
        margin-bottom: 20px;
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
        padding: 2px 8px;
        border-radius: 4px;
    }

    /* Section Headings */
    .section-header {
        border-bottom: 2px solid #0f172a;
        padding-bottom: 6px;
        margin-top: 24px;
        margin-bottom: 12px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
    }
    .section-title {
        font-size: 12.5pt;
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
        font-size: 9pt;
        line-height: 1.5;
        margin-bottom: 16px;
    }

    /* Requirement Cards */
    .audit-card {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-left: 4px solid #7c3aed;
        border-radius: 6px;
        margin-bottom: 12px;
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
        padding: 7px 12px;
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
        white-space: nowrap;
    }
    .card-req-title {
        font-size: 9pt;
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
        white-space: nowrap;
    }
    .pill-critical { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .pill-high { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
    .pill-medium { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
    .pill-low { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

    .card-content {
        padding: 10px 12px;
    }
    .card-desc {
        font-size: 8.5pt;
        color: #334155;
        line-height: 1.45;
        margin: 0 0 8px 0;
    }

    /* Specifications 2-column grid */
    .specs-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 8px 10px;
    }
    .spec-pane-title {
        font-size: 7pt;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #475569;
        margin-bottom: 5px;
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
        margin-bottom: 3px;
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
        padding: 5px 8px;
        font-size: 7.5pt;
        color: #581c87;
    }

    /* Page Breaks */
    .page-break {
        page-break-before: always;
        break-before: page;
        margin-top: 20px;
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

    /* Checklist Item Styles */
    .checklist-row {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 10px 12px;
        margin-bottom: 8px;
        page-break-inside: avoid;
        break-inside: avoid;
        display: flex;
        align-items: flex-start;
        gap: 10px;
    }
    .check-box-indicator {
        width: 15px;
        height: 15px;
        border: 2px solid #7c3aed;
        border-radius: 3px;
        margin-top: 2px;
        flex-shrink: 0;
    }
    .checklist-body {
        flex: 1;
    }
    .checklist-hdr {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
    }

    .footer-stamp {
        margin-top: 30px;
        padding-top: 12px;
        border-top: 1px solid #e2e8f0;
        font-size: 7.5pt;
        color: #64748b;
        display: flex;
        justify-content: space-between;
        page-break-inside: avoid;
    }
"""

EXECUTIVE_SUMMARY_TMPL = """
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>{{ base_css }}</style>
</head>
<body>
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

    <div class="section-header">
        <h2 class="section-title">1.0 Executive Summary & Statutory Mandate</h2>
        <span class="section-badge badge-exec">Executive Directive</span>
    </div>
    <div class="section-narrative">
        This executive compliance summary compiles the enforceable requirements derived from the formal codified statutory text of <strong>{{ regulation.name }}</strong> ({{ regulation.jurisdiction }}). 
        The provisions cataloged herein constitute mandatory technical and governance obligations, requiring verifiable system actions, continuous log retention, and verifiable proof of compliance for statutory supervisory authorities.
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
                <strong>Statutory Stipulations:</strong> {{ req.conditions|join(' • ') }}
            </div>
            {% endif %}
        </div>
    </div>
    {% endfor %}

    <div class="footer-stamp">
        <div>Official Statutory Compliance Report | Generated by Regulation-as-Code Compiler</div>
        <div>Report ID: {{ report_id }}</div>
    </div>
</body>
</html>
"""

TECHNICAL_TMPL = """
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>{{ base_css }}</style>
</head>
<body>
    <div class="letterhead">
        <div class="letterhead-accent"></div>
        <div class="letterhead-content">
            <div>
                <span class="doc-classification">Technical Specification</span>
                <h1 class="doc-title">{{ report_title }}</h1>
                <p class="doc-subtitle">{{ regulation.name }} <span class="jurisdiction-badge">{{ regulation.jurisdiction }}</span></p>
            </div>
            <div class="doc-meta-box">
                <div class="meta-row"><span class="meta-lbl">DOC REF:</span><span class="meta-val">RAC-{{ report_id[:8]|upper }}</span></div>
                <div class="meta-row"><span class="meta-lbl">ISSUER:</span><span class="meta-val">{{ org_name }}</span></div>
                <div class="meta-row"><span class="meta-lbl">TIMESTAMP:</span><span class="meta-val">{{ date }} UTC</span></div>
                <div class="meta-row"><span class="meta-lbl">FORMAT:</span><span class="meta-val" style="color: #7c3aed;">EXECUTABLE AST</span></div>
            </div>
        </div>
    </div>

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
            <span class="ribbon-val">{{ regulation.jurisdiction }} &bull; Technical Specifications</span>
        </div>
        <div class="ribbon-cell">
            <span class="ribbon-lbl">Total Mappings</span>
            <span class="ribbon-val" style="color: #7c3aed;">{{ requirements|length }} Controls</span>
        </div>
    </div>

    <div class="section-header">
        <h2 class="section-title">Requirements to Technical System Enforcement Matrix</h2>
        <span class="section-badge badge-tech">AST Enforcement</span>
    </div>
    <div class="section-narrative">
        Codified mapping of statutory mandates to technical enforcement mechanisms, automated policy verification, and telemetry constraints.
    </div>

    <table class="audit-table">
        <thead>
            <tr>
                <th style="width: 26%;">Citation & Requirement Title</th>
                <th style="width: 14%;">Severity / Type</th>
                <th style="width: 32%;">Mandatory Technical Actions</th>
                <th style="width: 28%;">Supervisory Deliverables / Conditions</th>
            </tr>
        </thead>
        <tbody>
            {% for req in requirements %}
            <tr>
                <td>
                    <span class="citation-tag" style="display: inline-block; margin-bottom: 4px;">{{ req.citation }}</span><br>
                    <strong style="color: #0f172a;">{{ req.title }}</strong>
                </td>
                <td>
                    <span class="severity-pill pill-{{ req.severity_str }}" style="display: inline-block; margin-bottom: 4px;">{{ req.severity_str }}</span><br>
                    <small style="color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 6.5pt;">{{ req.type_str }}</small>
                </td>
                <td>
                    {% if req.actions %}
                        <ul class="spec-item-list">
                        {% for act in req.actions %}
                            <li><span class="bullet-action">&bull;</span>{{ act }}</li>
                        {% endfor %}
                        </ul>
                    {% else %}
                        <span style="color: #64748b;">Verify technical security controls</span>
                    {% endif %}
                </td>
                <td>
                    {% if req.evidence_required %}
                        <ul class="spec-item-list">
                        {% for ev in req.evidence_required %}
                            <li><span class="bullet-evidence">&#10003;</span>{{ ev }}</li>
                        {% endfor %}
                        </ul>
                    {% else %}
                        <span style="color: #64748b;">System log preservation</span>
                    {% endif %}
                    {% if req.conditions %}
                        <div class="stipulations-strip" style="margin-top: 6px;">
                            {{ req.conditions|join(', ') }}
                        </div>
                    {% endif %}
                </td>
            </tr>
            {% endfor %}
        </tbody>
    </table>

    <div class="footer-stamp">
        <div>Technical Enforcement Matrix | Generated by Regulation-as-Code Compiler</div>
        <div>Report ID: {{ report_id }}</div>
    </div>
</body>
</html>
"""

AUDIT_EVIDENCE_TMPL = """
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>{{ base_css }}</style>
</head>
<body>
    <div class="letterhead">
        <div class="letterhead-accent"></div>
        <div class="letterhead-content">
            <div>
                <span class="doc-classification">Supervisory Audit Manifest</span>
                <h1 class="doc-title">{{ report_title }}</h1>
                <p class="doc-subtitle">{{ regulation.name }} <span class="jurisdiction-badge">{{ regulation.jurisdiction }}</span></p>
            </div>
            <div class="doc-meta-box">
                <div class="meta-row"><span class="meta-lbl">DOC REF:</span><span class="meta-val">RAC-{{ report_id[:8]|upper }}</span></div>
                <div class="meta-row"><span class="meta-lbl">ISSUER:</span><span class="meta-val">{{ org_name }}</span></div>
                <div class="meta-row"><span class="meta-lbl">TIMESTAMP:</span><span class="meta-val">{{ date }} UTC</span></div>
                <div class="meta-row"><span class="meta-lbl">AUDIT READINESS:</span><span class="meta-val" style="color: #059669;">CERTIFIED</span></div>
            </div>
        </div>
    </div>

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
            <span class="ribbon-lbl">Scope</span>
            <span class="ribbon-val">{{ regulation.jurisdiction }} &bull; Evidentiary Manifest</span>
        </div>
        <div class="ribbon-cell">
            <span class="ribbon-lbl">Total Deliverables</span>
            <span class="ribbon-val" style="color: #7c3aed;">{{ requirements|length }} Controls</span>
        </div>
    </div>

    <div class="section-header">
        <h2 class="section-title">Mandatory Audit Artifacts & Telemetry Requirements</h2>
        <span class="section-badge badge-audit">Audit Manifest</span>
    </div>
    <div class="section-narrative">
        Exhaustive evidentiary deliverables and cryptographic verification requirements mandated for statutory compliance inspections.
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
                    <div class="spec-pane-title">Mandatory Audit Evidence Deliverables</div>
                    {% if req.evidence_required %}
                        <ul class="spec-item-list">
                        {% for ev in req.evidence_required %}
                            <li><span class="bullet-evidence">&#10003;</span>{{ ev }}</li>
                        {% endfor %}
                        </ul>
                    {% else %}
                        <span style="color: #64748b; font-size: 8pt;">Formal configuration audit trail, cryptographic hash verification, and system log preservation.</span>
                    {% endif %}
                </div>
                <div>
                    <div class="spec-pane-title">Mandatory Technical Safeguards</div>
                    {% if req.actions %}
                        <ul class="spec-item-list">
                        {% for act in req.actions %}
                            <li><span class="bullet-action">&bull;</span>{{ act }}</li>
                        {% endfor %}
                        </ul>
                    {% else %}
                        <span style="color: #64748b; font-size: 8pt;">Verify continuous operational control status.</span>
                    {% endif %}
                </div>
            </div>
        </div>
    </div>
    {% endfor %}

    <div class="footer-stamp">
        <div>Supervisory Audit Manifest | Generated by Regulation-as-Code Compiler</div>
        <div>Report ID: {{ report_id }}</div>
    </div>
</body>
</html>
"""

GAP_ANALYSIS_TMPL = """
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>{{ base_css }}</style>
</head>
<body>
    <div class="letterhead">
        <div class="letterhead-accent"></div>
        <div class="letterhead-content">
            <div>
                <span class="doc-classification" style="color: #991b1b; background: #fef2f2; border-color: #fecaca;">Risk Exposure Assessment</span>
                <h1 class="doc-title">{{ report_title }}</h1>
                <p class="doc-subtitle">{{ regulation.name }} <span class="jurisdiction-badge" style="background: #dc2626;">{{ regulation.jurisdiction }}</span></p>
            </div>
            <div class="doc-meta-box">
                <div class="meta-row"><span class="meta-lbl">DOC REF:</span><span class="meta-val">RAC-{{ report_id[:8]|upper }}</span></div>
                <div class="meta-row"><span class="meta-lbl">ISSUER:</span><span class="meta-val">{{ org_name }}</span></div>
                <div class="meta-row"><span class="meta-lbl">TIMESTAMP:</span><span class="meta-val">{{ date }} UTC</span></div>
                <div class="meta-row"><span class="meta-lbl">FOCUS:</span><span class="meta-val" style="color: #dc2626;">HIGH & CRITICAL EXPOSURE</span></div>
            </div>
        </div>
    </div>

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
            <span class="ribbon-lbl">Critical / High Directives</span>
            <span class="ribbon-val" style="color: #dc2626;">{{ critical_count + high_count }} Elevated Obligations</span>
        </div>
        <div class="ribbon-cell">
            <span class="ribbon-lbl">Remediation Priority</span>
            <span class="ribbon-val" style="color: #dc2626;">Immediate Operational Action</span>
        </div>
    </div>

    <div class="metrics-grid">
        <div class="metric-box red">
            <div class="metric-num">{{ critical_count }}</div>
            <div class="metric-tag">Critical Exposure</div>
        </div>
        <div class="metric-box amber">
            <div class="metric-num">{{ high_count }}</div>
            <div class="metric-tag">High-Risk Safeguards</div>
        </div>
        <div class="metric-box purple">
            <div class="metric-num">{{ requirements|length }}</div>
            <div class="metric-tag">Total Baseline</div>
        </div>
        <div class="metric-box green">
            <div class="metric-num">100%</div>
            <div class="metric-tag">Codified Rigor</div>
        </div>
    </div>

    <div class="section-header">
        <h2 class="section-title">Critical Risk & High-Exposure Gap Analysis</h2>
        <span class="section-badge badge-gap">Risk Assessment</span>
    </div>
    <div class="section-narrative">
        This gap analysis assesses statutory provisions carrying maximum enforcement risk under <strong>{{ regulation.name }}</strong>. 
        Items flagged as Critical or High severity represent legal obligations where missing controls or deferred remediation expose the organization to direct statutory sanctions or operational disruption.
    </div>

    {% set gap_reqs = requirements | selectattr("severity_str", "in", ["critical", "high"]) | list %}
    {% set target_reqs = gap_reqs if gap_reqs else requirements[:5] %}

    {% for req in target_reqs %}
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
                <strong>Exposure Conditions:</strong> {{ req.conditions|join(' • ') }}
            </div>
            {% endif %}
        </div>
    </div>
    {% endfor %}

    <div class="footer-stamp">
        <div>Regulatory Gap Analysis & Risk Exposure Manifest | Regulation-as-Code Compiler</div>
        <div>Report ID: {{ report_id }}</div>
    </div>
</body>
</html>
"""

CHECKLIST_TMPL = """
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>{{ base_css }}</style>
</head>
<body>
    <div class="letterhead">
        <div class="letterhead-accent"></div>
        <div class="letterhead-content">
            <div>
                <span class="doc-classification">Operational Playbook</span>
                <h1 class="doc-title">{{ report_title }}</h1>
                <p class="doc-subtitle">{{ regulation.name }} <span class="jurisdiction-badge">{{ regulation.jurisdiction }}</span></p>
            </div>
            <div class="doc-meta-box">
                <div class="meta-row"><span class="meta-lbl">DOC REF:</span><span class="meta-val">RAC-{{ report_id[:8]|upper }}</span></div>
                <div class="meta-row"><span class="meta-lbl">ISSUER:</span><span class="meta-val">{{ org_name }}</span></div>
                <div class="meta-row"><span class="meta-lbl">TIMESTAMP:</span><span class="meta-val">{{ date }} UTC</span></div>
                <div class="meta-row"><span class="meta-lbl">FIELD READY:</span><span class="meta-val" style="color: #059669;">YES</span></div>
            </div>
        </div>
    </div>

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
            <span class="ribbon-lbl">Scope</span>
            <span class="ribbon-val">{{ regulation.jurisdiction }} &bull; Engineering & GRC Rollout</span>
        </div>
        <div class="ribbon-cell">
            <span class="ribbon-lbl">Total Action Items</span>
            <span class="ribbon-val" style="color: #7c3aed;">{{ requirements|length }} Controls</span>
        </div>
    </div>

    <div class="section-header">
        <h2 class="section-title">Operational Engineering & Compliance Checklist</h2>
        <span class="section-badge badge-check">Field Playbook</span>
    </div>
    <div class="section-narrative">
        Field-ready actionable checklist for cross-functional engineering, legal, and compliance deployment squads.
    </div>

    {% for req in requirements %}
    <div class="checklist-row">
        <div class="check-box-indicator"></div>
        <div class="checklist-body">
            <div class="checklist-hdr">
                <div>
                    <span class="citation-tag">{{ req.citation }}</span>
                    <strong style="font-size: 9pt; color: #0f172a;">{{ req.title }}</strong>
                </div>
                <span class="severity-pill pill-{{ req.severity_str }}">{{ req.severity_str }}</span>
            </div>
            <div style="font-size: 8.5pt; color: #475569; margin-bottom: 6px; line-height: 1.4;">
                {{ req.description }}
            </div>
            {% if req.actions %}
            <div style="font-size: 8pt; color: #6d28d9; background: #f5f3ff; border: 1px solid #ede9fe; border-radius: 4px; padding: 4px 8px;">
                <strong>Required System Action:</strong> {{ req.actions|join(' • ') }}
            </div>
            {% endif %}
        </div>
    </div>
    {% endfor %}

    <div class="footer-stamp">
        <div>Operational Engineering Checklist | Generated by Regulation-as-Code Compiler</div>
        <div>Report ID: {{ report_id }}</div>
    </div>
</body>
</html>
"""

COMPOSITE_REPORT_TMPL = """
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
            {% for s_name in section_names %}
            <span class="pill-item">&#10003; {{ s_name }}</span>
            {% endfor %}
        </div>
    </div>

    <!-- 1. Executive Summary -->
    {% if 'executive_summary' in selected_sections %}
    <div id="module-executive-summary">
        <div class="section-header">
            <h2 class="section-title">1.0 Executive Summary & Statutory Mandate</h2>
            <span class="section-badge badge-exec">Executive Directive</span>
        </div>
        <div class="section-narrative">
            This executive compliance summary compiles the enforceable requirements derived from the formal codified statutory text of <strong>{{ regulation.name }}</strong> ({{ regulation.jurisdiction }}). 
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
                    <strong>Statutory Stipulations:</strong> {{ req.conditions|join(' • ') }}
                </div>
                {% endif %}
            </div>
        </div>
        {% endfor %}
    </div>
    {% endif %}

    <!-- 2. Gap Analysis -->
    {% if 'gap_analysis' in selected_sections %}
    {% if 'executive_summary' in selected_sections %}<div class="page-break"></div>{% endif %}
    <div id="module-gap-analysis">
        <div class="section-header">
            <h2 class="section-title">2.0 Regulatory Gap Analysis & High-Risk Exposure Assessment</h2>
            <span class="section-badge badge-gap">Risk Assessment</span>
        </div>
        <div class="section-narrative">
            The provisions detailed below represent statutory mandates carrying maximum compliance risk under <strong>{{ regulation.name }}</strong>. 
            Provisions classified as Critical or High severity require immediate technical safeguard mobilization; missing or incomplete controls expose the institution to supervisory fines and operational mandates.
        </div>

        {% set gap_reqs = requirements | selectattr("severity_str", "in", ["critical", "high"]) | list %}
        {% set target_reqs = gap_reqs if gap_reqs else requirements[:5] %}

        {% for req in target_reqs %}
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
                    <strong>Exposure Conditions:</strong> {{ req.conditions|join(' • ') }}
                </div>
                {% endif %}
            </div>
        </div>
        {% endfor %}
    </div>
    {% endif %}

    <!-- 3. Technical System Mapping -->
    {% if 'technical' in selected_sections %}
    {% if 'executive_summary' in selected_sections or 'gap_analysis' in selected_sections %}<div class="page-break"></div>{% endif %}
    <div id="module-technical">
        <div class="section-header">
            <h2 class="section-title">3.0 Technical System Mapping & AST Enforcement Matrix</h2>
            <span class="section-badge badge-tech">AST Enforcement</span>
        </div>
        <div class="section-narrative">
            Codified mapping of statutory mandates to technical enforcement mechanisms, automated policy verification, and telemetry constraints.
        </div>

        <table class="audit-table">
            <thead>
                <tr>
                    <th style="width: 26%;">Citation & Requirement Title</th>
                    <th style="width: 14%;">Severity / Type</th>
                    <th style="width: 32%;">Mandatory Technical Actions</th>
                    <th style="width: 28%;">Supervisory Deliverables / Conditions</th>
                </tr>
            </thead>
            <tbody>
                {% for req in requirements %}
                <tr>
                    <td>
                        <span class="citation-tag" style="display: inline-block; margin-bottom: 4px;">{{ req.citation }}</span><br>
                        <strong style="color: #0f172a;">{{ req.title }}</strong>
                    </td>
                    <td>
                        <span class="severity-pill pill-{{ req.severity_str }}" style="display: inline-block; margin-bottom: 4px;">{{ req.severity_str }}</span><br>
                        <small style="color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 6.5pt;">{{ req.type_str }}</small>
                    </td>
                    <td>
                        {% if req.actions %}
                            <ul class="spec-item-list">
                            {% for act in req.actions %}
                                <li><span class="bullet-action">&bull;</span>{{ act }}</li>
                            {% endfor %}
                            </ul>
                        {% else %}
                            <span style="color: #64748b;">Verify technical security controls</span>
                        {% endif %}
                    </td>
                    <td>
                        {% if req.evidence_required %}
                            <ul class="spec-item-list">
                            {% for ev in req.evidence_required %}
                                <li><span class="bullet-evidence">&#10003;</span>{{ ev }}</li>
                            {% endfor %}
                            </ul>
                        {% else %}
                            <span style="color: #64748b;">System log preservation</span>
                        {% endif %}
                        {% if req.conditions %}
                            <div class="stipulations-strip" style="margin-top: 6px;">
                                {{ req.conditions|join(', ') }}
                            </div>
                        {% endif %}
                    </td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
    {% endif %}

    <!-- 4. Audit Evidence -->
    {% if 'audit_evidence' in selected_sections %}
    {% if 'executive_summary' in selected_sections or 'gap_analysis' in selected_sections or 'technical' in selected_sections %}<div class="page-break"></div>{% endif %}
    <div id="module-audit-evidence">
        <div class="section-header">
            <h2 class="section-title">4.0 Supervisory Audit Evidence & Telemetry Requirements</h2>
            <span class="section-badge badge-audit">Audit Manifest</span>
        </div>
        <div class="section-narrative">
            Exhaustive evidentiary deliverables and cryptographic verification requirements mandated for statutory compliance inspections.
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
                        <div class="spec-pane-title">Mandatory Audit Evidence Deliverables</div>
                        {% if req.evidence_required %}
                            <ul class="spec-item-list">
                            {% for ev in req.evidence_required %}
                                <li><span class="bullet-evidence">&#10003;</span>{{ ev }}</li>
                            {% endfor %}
                            </ul>
                        {% else %}
                            <span style="color: #64748b; font-size: 8pt;">Formal configuration audit trail, cryptographic hash verification, and system log preservation.</span>
                        {% endif %}
                    </div>
                    <div>
                        <div class="spec-pane-title">Mandatory Technical Safeguards</div>
                        {% if req.actions %}
                            <ul class="spec-item-list">
                            {% for act in req.actions %}
                                <li><span class="bullet-action">&bull;</span>{{ act }}</li>
                            {% endfor %}
                            </ul>
                        {% else %}
                            <span style="color: #64748b; font-size: 8pt;">Verify continuous operational control status.</span>
                        {% endif %}
                    </div>
                </div>
            </div>
        </div>
        {% endfor %}
    </div>
    {% endif %}

    <!-- 5. Implementation Checklist -->
    {% if 'checklist' in selected_sections %}
    {% if 'executive_summary' in selected_sections or 'gap_analysis' in selected_sections or 'technical' in selected_sections or 'audit_evidence' in selected_sections %}<div class="page-break"></div>{% endif %}
    <div id="module-checklist">
        <div class="section-header">
            <h2 class="section-title">5.0 Operational Engineering & Compliance Checklist</h2>
            <span class="section-badge badge-check">Field Playbook</span>
        </div>
        <div class="section-narrative">
            Field-ready actionable checklist for cross-functional engineering, legal, and compliance deployment squads.
        </div>

        {% for req in requirements %}
        <div class="checklist-row">
            <div class="check-box-indicator"></div>
            <div class="checklist-body">
                <div class="checklist-hdr">
                    <div>
                        <span class="citation-tag">{{ req.citation }}</span>
                        <strong style="font-size: 9pt; color: #0f172a;">{{ req.title }}</strong>
                    </div>
                    <span class="severity-pill pill-{{ req.severity_str }}">{{ req.severity_str }}</span>
                </div>
                <div style="font-size: 8.5pt; color: #475569; margin-bottom: 6px; line-height: 1.4;">
                    {{ req.description }}
                </div>
                {% if req.actions %}
                <div style="font-size: 8pt; color: #6d28d9; background: #f5f3ff; border: 1px solid #ede9fe; border-radius: 4px; padding: 4px 8px;">
                    <strong>Required System Action:</strong> {{ req.actions|join(' • ') }}
                </div>
                {% endif %}
            </div>
        </div>
        {% endfor %}
    </div>
    {% endif %}

    <div class="footer-stamp">
        <div>Official Statutory Compliance Report | Generated by Regulation-as-Code Compiler</div>
        <div>Report ID: {{ report_id }}</div>
    </div>
</body>
</html>
"""

TEMPLATES = {
    "executive_summary": EXECUTIVE_SUMMARY_TMPL,
    "technical": TECHNICAL_TMPL,
    "audit_evidence": AUDIT_EVIDENCE_TMPL,
    "gap_analysis": GAP_ANALYSIS_TMPL,
    "checklist": CHECKLIST_TMPL,
    "composite": COMPOSITE_REPORT_TMPL
}

SECTION_NAMES = {
    "executive_summary": "Executive Summary",
    "technical": "Technical System Mapping",
    "audit_evidence": "Audit Evidence",
    "gap_analysis": "Gap Analysis",
    "checklist": "Implementation Checklist"
}


# --- Celery Task for PDF Generation ---

@celery_app.task(bind=False, max_retries=2, autoretry_for=(Exception,), retry_backoff=True)
def generate_pdf_report_task(report_id: str, job_id: str = None, sections: list = None):
    from app.db.session import SessionLocal
    from app.models.jobs import BackgroundJob
    db = SessionLocal()
    dispatcher = None
    if job_id:
        dispatcher = EventDispatcher(db, uuid.UUID(job_id))
        update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing)
        
    try:
        if dispatcher: dispatcher.emit(1, "Initialize Report", "started")
        from playwright.sync_api import sync_playwright
        
        # 1. Fetch Report
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            if dispatcher: dispatcher.emit(1, "Initialize Report", "failed", {"error": "Report not found"})
            return
            
        reg = db.query(Regulation).filter(Regulation.id == report.regulation_id).first()
        if not reg:
            report.status = ReportStatusEnum.failed
            db.commit()
            if dispatcher: dispatcher.emit(1, "Initialize Report", "failed", {"error": "Regulation not found"})
            return
            
        report_type_str = report.report_type.value if hasattr(report.report_type, 'value') else str(report.report_type)

        # Resolve organization name to prevent raw UUID dumps
        org = db.query(Organization).filter(Organization.id == report.org_id).first()
        org_name = org.name if org and org.name else "Enterprise Compliance Division"

        # Determine effective sections list
        selected_sections = sections or []
        if not selected_sections and job_id:
            try:
                job_rec = db.query(BackgroundJob).filter(BackgroundJob.id == uuid.UUID(job_id)).first()
                if job_rec and job_rec.result_data and isinstance(job_rec.result_data, dict):
                    selected_sections = job_rec.result_data.get("sections") or []
            except Exception:
                pass
                
        if not selected_sections:
            if report_type_str == "composite":
                selected_sections = ["executive_summary", "gap_analysis", "technical", "audit_evidence", "checklist"]
            else:
                selected_sections = [report_type_str]

        # Filter to valid known sections
        valid_sections = [s for s in selected_sections if s in SECTION_NAMES]
        if not valid_sections:
            valid_sections = ["executive_summary"]
        selected_sections = valid_sections

        if dispatcher: dispatcher.emit(1, "Initialize Report", "completed", {
            "report_type": report_type_str,
            "sections": selected_sections
        })

        # 2. Fetch requirements (broad status fallback to ensure real statutory data is always present)
        if dispatcher: dispatcher.emit(2, "Fetch Requirements", "started")
        
        target_version_id = reg.current_version_id
        if not target_version_id and reg.versions:
            target_version_id = reg.versions[0].id
            
        reqs = []
        if target_version_id:
            from app.models.requirements import ValidationStatusEnum
            reqs = db.query(Requirement).filter(
                Requirement.regulation_version_id == target_version_id,
                Requirement.validation_status.in_([ValidationStatusEnum.approved, ValidationStatusEnum.enforceable])
            ).all()
            
            if not reqs:
                reqs = db.query(Requirement).filter(
                    Requirement.regulation_version_id == target_version_id
                ).all()

        # Fallback if no version requirements yet: find requirements from any version of this regulation
        if not reqs:
            for v in reg.versions:
                v_reqs = db.query(Requirement).filter(Requirement.regulation_version_id == v.id).all()
                if v_reqs:
                    reqs = v_reqs
                    break

        time.sleep(0.5)
        if dispatcher: dispatcher.emit(2, "Fetch Requirements", "completed", {"count": len(reqs)})
        
        # Format requirement dictionaries for executive template rendering
        formatted_reqs = []
        crit_count = 0
        high_count = 0
        for r in reqs:
            s_val = r.severity.value if hasattr(r.severity, 'value') else str(r.severity or 'medium').lower()
            t_val = r.type.value if hasattr(r.type, 'value') else str(r.type or 'obligation').lower()
            if s_val == 'critical':
                crit_count += 1
            elif s_val == 'high':
                high_count += 1
                
            citation = extract_citation({
                "references": r.references,
                "meta_data": r.meta_data,
                "title": r.title,
                "description": r.description
            })

            clean_t = clean_regulatory_text(r.title)
            clean_d = clean_regulatory_text(r.description)
            if not clean_t or len(clean_t) < 4:
                clean_t = f"Operational Mandate: {clean_d[:55]}..." if clean_d else "Mandatory Statutory Obligation"

            actions_list = extract_clean_list(r.actions)
            evidence_list = extract_clean_list(r.evidence_required)
            conditions_list = extract_conditions_readable(r.conditions)

            cond_str = ""
            if r.conditions:
                try:
                    cond_str = json.dumps(r.conditions, indent=1)
                except Exception:
                    cond_str = str(r.conditions)

            formatted_reqs.append({
                "id": str(r.id),
                "title": clean_t,
                "description": clean_d,
                "severity_str": s_val,
                "type_str": t_val,
                "citation": citation,
                "actions": actions_list,
                "evidence_required": evidence_list,
                "conditions": conditions_list,
                "conditions_str": cond_str
            })

        # 3. Render HTML
        if dispatcher: dispatcher.emit(3, "Compile Document Layout", "started")
        
        # Determine whether to use single template or composite
        is_composite = report_type_str == "composite" or len(selected_sections) > 1
        
        section_titles = [SECTION_NAMES.get(s, s) for s in selected_sections]
        if len(section_titles) == 1:
            report_title = section_titles[0]
        elif len(section_titles) == 2:
            report_title = f"{section_titles[0]} & {section_titles[1]}"
        else:
            report_title = "Comprehensive Statutory Compliance Report"

        if is_composite:
            tmpl_str = COMPOSITE_REPORT_TMPL
        else:
            tmpl_str = TEMPLATES.get(selected_sections[0], EXECUTIVE_SUMMARY_TMPL)

        template = Template(tmpl_str, autoescape=True)
        html_content = template.render(
            base_css=BASE_CSS,
            regulation=reg,
            requirements=formatted_reqs,
            critical_count=crit_count,
            high_count=high_count,
            date=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            org_id=str(report.org_id),
            org_name=org_name,
            report_id=str(report.id),
            report_title=report_title,
            selected_sections=selected_sections,
            section_names=section_titles
        )
        time.sleep(0.5)
        if dispatcher: dispatcher.emit(3, "Compile Document Layout", "completed", {
            "template_used": "composite" if is_composite else selected_sections[0],
            "sections": selected_sections
        })
        
        # 4. Generate PDF using Playwright with precision page margins
        if dispatcher: dispatcher.emit(4, "Render PDF", "started")
        pdf_bytes = b""
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_content(html_content, wait_until="load")
            pdf_bytes = page.pdf(
                format="A4",
                print_background=True,
                margin={"top": "18mm", "bottom": "20mm", "left": "15mm", "right": "15mm"}
            )
            browser.close()
        time.sleep(0.5)
        if dispatcher: dispatcher.emit(4, "Render PDF", "completed", {"size_bytes": len(pdf_bytes)})
            
        # 5. Upload to Local Storage / S3
        if dispatcher: dispatcher.emit(5, "Secure Storage Upload", "started")
        
        file_obj = io.BytesIO(pdf_bytes)
        filename = f"{report.id}.pdf"
        
        storage = StorageService()
        storage_path = storage.upload_file(file_obj, filename, "application/pdf")
        download_url = f"http://127.0.0.1:8080/api/v1/reports/{report.id}/download"
            
        report.storage_path = storage_path
        report.status = ReportStatusEnum.completed
        db.commit()
        
        if dispatcher: dispatcher.emit(5, "Secure Storage Upload", "completed", {"path": download_url, "storage_path": storage_path})
        
        if job_id:
            update_job_status(db, uuid.UUID(job_id), JobStatusEnum.completed, {"report_id": str(report.id), "url": download_url})
        
    except Exception as e:
        import traceback
        print("Report Generation Failed Traceback:")
        traceback.print_exc()
        db.rollback()
        report = db.query(Report).filter(Report.id == report_id).first()
        if report:
            report.status = ReportStatusEnum.failed
            db.commit()
        if job_id:
            if dispatcher: dispatcher.emit(5, "Secure Storage Upload", "failed", {"error": str(e)})
            update_job_status(db, uuid.UUID(job_id), JobStatusEnum.failed, error=str(e))
    finally:
        db.close()
