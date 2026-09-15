import os
import uuid
import time
import io
import re
import json
import logging
from datetime import datetime, timezone
from jinja2 import Template
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

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
    # Normalize unicode ligatures (e.g. \ufb01 -> fi, \ufb02 -> fl, \ufb03 -> ffi)
    import unicodedata
    text = unicodedata.normalize('NFKD', text)
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


BASE_CSS = """
    @page {
        size: A4 portrait;
        margin: 18mm 15mm 20mm 15mm;
    }
    * { box-sizing: border-box; }
    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
        background: #ffffff;
        line-height: 1.45;
        font-size: 9pt;
        padding: 0;
        margin: 0;
    }
    
    /* Top Letterhead Table */
    table.letterhead-table {
        width: 100%;
        border-collapse: collapse;
        border-bottom: 2px solid #7c3aed;
        margin-bottom: 16px;
        padding-bottom: 10px;
    }
    .letterhead-accent {
        height: 4px;
        background: #7c3aed;
        margin-bottom: 10px;
        border-radius: 2px;
    }
    .letterhead-left {
        vertical-align: top;
        text-align: left;
        padding-bottom: 10px;
    }
    .letterhead-right {
        vertical-align: top;
        text-align: right;
        width: 230px;
        padding-bottom: 10px;
    }
    .doc-classification {
        display: inline-block;
        font-size: 7pt;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #6d28d9;
        background: #f5f3ff;
        border: 1px solid #ddd6fe;
        padding: 2px 7px;
        border-radius: 4px;
        margin-bottom: 6px;
    }
    .doc-title {
        font-size: 17pt;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 4px 0;
        letter-spacing: -0.02em;
        line-height: 1.2;
    }
    .doc-subtitle {
        font-size: 10pt;
        color: #475569;
        margin: 0;
        font-weight: 600;
    }
    .jurisdiction-badge {
        display: inline-block;
        font-size: 7pt;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        background: #0ea5e9;
        color: #ffffff;
        margin-left: 6px;
        vertical-align: middle;
    }
    
    .doc-meta-box {
        text-align: right;
        font-size: 7.5pt;
        color: #64748b;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 8px 12px;
    }
    table.meta-inner-table {
        width: 100%;
        border-collapse: collapse;
    }
    table.meta-inner-table td {
        padding: 2px 0;
    }
    .meta-lbl { font-weight: 600; color: #475569; text-align: left; }
    .meta-val { font-weight: 700; color: #0f172a; text-align: right; }

    /* Metadata Ribbon Table */
    table.metadata-ribbon-table {
        width: 100%;
        table-layout: fixed;
        border-collapse: collapse;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        margin-bottom: 16px;
    }
    .ribbon-cell {
        padding: 6px 10px;
        border-right: 1px solid #e2e8f0;
        font-size: 7.5pt;
        vertical-align: middle;
    }
    .ribbon-cell:last-child { border-right: none; }
    .ribbon-lbl { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; display: block; margin-bottom: 2px; }
    .ribbon-val { font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; display: block; }

    /* KPI Metrics Table */
    table.metrics-table {
        width: 100%;
        table-layout: fixed;
        border-collapse: separate;
        border-spacing: 8px 0;
        margin-bottom: 18px;
    }
    .metric-td {
        width: 25%;
        padding: 0;
        vertical-align: top;
    }
    .metric-box {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 10px 10px;
        text-align: center;
    }
    .metric-box.purple { border-top: 3px solid #7c3aed; }
    .metric-box.red { border-top: 3px solid #ef4444; }
    .metric-box.amber { border-top: 3px solid #f59e0b; }
    .metric-box.green { border-top: 3px solid #10b981; }
    
    .metric-num { font-size: 18pt; font-weight: 800; line-height: 1; margin-bottom: 3px; }
    .metric-box.purple .metric-num { color: #7c3aed; }
    .metric-box.red .metric-num { color: #dc2626; }
    .metric-box.amber .metric-num { color: #d97706; }
    .metric-box.green .metric-num { color: #059669; }
    .metric-tag { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }

    /* Module Index Table */
    table.module-index-table {
        width: 100%;
        border-collapse: collapse;
        background: #faf5ff;
        border: 1px solid #e9d5ff;
        border-radius: 6px;
        margin-bottom: 16px;
    }
    .module-index-title-cell {
        font-size: 7pt;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #6b21a8;
        white-space: nowrap;
        width: 150px;
        vertical-align: middle;
        padding: 6px 6px 6px 12px;
    }
    .module-index-pills-cell {
        vertical-align: middle;
        text-align: right;
        padding: 6px 12px 6px 6px;
    }
    .pill-item {
        display: inline-block;
        background: #ffffff;
        border: 1px solid #d8b4fe;
        color: #6b21a8;
        font-size: 7pt;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        margin: 1px 2px;
    }

    /* Section Header Table */
    table.section-header-table {
        width: 100%;
        border-collapse: collapse;
        border-bottom: 2px solid #0f172a;
        margin-top: 18px;
        margin-bottom: 10px;
    }
    .section-title-cell {
        vertical-align: bottom;
        text-align: left;
        padding-bottom: 4px;
    }
    .section-title {
        font-size: 11.5pt;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
        letter-spacing: -0.01em;
    }
    .section-badge-cell {
        vertical-align: bottom;
        text-align: right;
        width: 140px;
        padding-bottom: 4px;
    }
    .section-badge {
        display: inline-block;
        font-size: 6.5pt;
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
        font-size: 8.5pt;
        line-height: 1.45;
        margin-bottom: 12px;
    }

    /* Requirement Cards */
    .audit-card {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-left: 4px solid #7c3aed;
        border-radius: 6px;
        margin-bottom: 10px;
    }
    .audit-card.critical { border-left-color: #dc2626; }
    .audit-card.high { border-left-color: #ea580c; }
    .audit-card.medium { border-left-color: #ca8a04; }

    table.card-top-table {
        width: 100%;
        border-collapse: collapse;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
    }
    .card-top-left {
        vertical-align: middle;
        text-align: left;
        padding: 6px 10px;
    }
    .card-top-right {
        vertical-align: middle;
        text-align: right;
        width: 80px;
        padding: 6px 10px;
    }
    .citation-tag {
        display: inline-block;
        font-size: 7pt;
        font-weight: 800;
        color: #4338ca;
        background: #e0e7ff;
        padding: 2px 6px;
        border-radius: 4px;
        letter-spacing: 0.04em;
        margin-right: 6px;
        vertical-align: middle;
    }
    .card-req-title {
        font-size: 8.5pt;
        font-weight: 700;
        color: #0f172a;
        vertical-align: middle;
    }
    .severity-pill {
        display: inline-block;
        font-size: 6.5pt;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 2px 7px;
        border-radius: 4px;
        white-space: nowrap;
    }
    .pill-critical { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .pill-high { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
    .pill-medium { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
    .pill-low { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

    .card-content {
        padding: 8px 10px;
    }
    .card-desc {
        font-size: 8pt;
        color: #334155;
        line-height: 1.4;
        margin: 0 0 6px 0;
    }

    /* Specifications 2-column Table */
    table.specs-table {
        width: 100%;
        table-layout: fixed;
        border-collapse: collapse;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
    }
    td.spec-pane-col {
        width: 50%;
        vertical-align: top;
        padding: 6px 8px;
    }
    td.spec-pane-left {
        border-right: 1px solid #e2e8f0;
    }
    .spec-pane-title {
        font-size: 6.5pt;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #475569;
        margin-bottom: 4px;
        border-bottom: 1px solid #cbd5e1;
        padding-bottom: 2px;
    }
    .spec-item-list {
        list-style: none;
        padding: 0;
        margin: 0;
        font-size: 7.5pt;
        color: #1e293b;
    }
    .spec-item-list li {
        margin-bottom: 2px;
        line-height: 1.35;
    }
    .bullet-action {
        color: #7c3aed;
        font-weight: bold;
        margin-right: 4px;
    }
    .bullet-evidence {
        color: #059669;
        font-weight: bold;
        margin-right: 4px;
    }
    .stipulations-strip {
        margin-top: 6px;
        background: #faf5ff;
        border: 1px solid #f3e8ff;
        border-radius: 4px;
        padding: 4px 6px;
        font-size: 7pt;
        color: #581c87;
    }

    /* Checklist Item Table */
    table.checklist-item-table {
        width: 100%;
        table-layout: fixed;
        border-collapse: collapse;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        margin-bottom: 6px;
    }
    td.check-box-td {
        width: 28px;
        vertical-align: top;
        text-align: center;
        padding: 8px 2px 8px 8px;
    }
    .custom-check-box {
        font-size: 14pt;
        line-height: 1;
        color: #7c3aed;
    }
    td.checklist-content-td {
        vertical-align: top;
        padding: 6px 8px 6px 4px;
    }
    table.checklist-header-table {
        width: 100%;
        border-collapse: collapse;
    }
    td.checklist-header-left {
        vertical-align: middle;
        text-align: left;
    }
    td.checklist-header-right {
        vertical-align: middle;
        text-align: right;
        width: 70px;
    }
    .checklist-action-strip {
        font-size: 7pt;
        color: #6d28d9;
        background: #f5f3ff;
        border: 1px solid #ede9fe;
        border-radius: 4px;
        padding: 3px 6px;
        margin-top: 4px;
    }

    /* Table Styles */
    table.audit-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
        margin-bottom: 16px;
        font-size: 7.5pt;
    }
    table.audit-table th {
        background: #1e293b;
        color: #f8fafc;
        text-align: left;
        padding: 6px 8px;
        font-weight: 700;
        font-size: 7pt;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        border: 1px solid #1e293b;
    }
    table.audit-table td {
        padding: 6px 8px;
        border: 1px solid #e2e8f0;
        vertical-align: top;
        line-height: 1.35;
    }
    table.audit-table tr:nth-child(even) td {
        background: #f8fafc;
    }

    .footer-stamp {
        margin-top: 20px;
        padding-top: 8px;
        border-top: 1px solid #e2e8f0;
        font-size: 7pt;
        color: #64748b;
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
    <div class="letterhead-accent"></div>
    <table class="letterhead-table">
        <tr>
            <td class="letterhead-left">
                <span class="doc-classification">Official Statutory Audit Record</span>
                <h1 class="doc-title">{{ report_title }}</h1>
                <p class="doc-subtitle">{{ regulation.name }} <span class="jurisdiction-badge">{{ regulation.jurisdiction }}</span></p>
            </td>
            <td class="letterhead-right">
                <div class="doc-meta-box">
                    <table class="meta-inner-table">
                        <tr><td class="meta-lbl">DOC REF:</td><td class="meta-val">RAC-{{ report_id[:8]|upper }}</td></tr>
                        <tr><td class="meta-lbl">ISSUER:</td><td class="meta-val">{{ org_name }}</td></tr>
                        <tr><td class="meta-lbl">TIMESTAMP:</td><td class="meta-val">{{ date }} UTC</td></tr>
                        <tr><td class="meta-lbl">COMPLIANCE:</td><td class="meta-val" style="color: #059669;">100% CODIFIED</td></tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <table class="metadata-ribbon-table">
        <tr>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Issuing Entity</span>
                <span class="ribbon-val">{{ org_name }}</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Legal Framework</span>
                <span class="ribbon-val">{{ regulation.name }}</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Jurisdiction & Scope</span>
                <span class="ribbon-val">{{ regulation.jurisdiction }} &bull; Canonical Rulebook</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Supervisory Status</span>
                <span class="ribbon-val" style="color: #7c3aed;">Certified Active Enforcement</span>
            </td>
        </tr>
    </table>

    <table class="metrics-table">
        <tr>
            <td class="metric-td">
                <div class="metric-box purple">
                    <div class="metric-num">{{ requirements|length }}</div>
                    <div class="metric-tag">Enforceable Controls</div>
                </div>
            </td>
            <td class="metric-td">
                <div class="metric-box red">
                    <div class="metric-num">{{ critical_count }}</div>
                    <div class="metric-tag">Critical Obligations</div>
                </div>
            </td>
            <td class="metric-td">
                <div class="metric-box amber">
                    <div class="metric-num">{{ high_count }}</div>
                    <div class="metric-tag">High-Risk Safeguards</div>
                </div>
            </td>
            <td class="metric-td">
                <div class="metric-box green">
                    <div class="metric-num">100%</div>
                    <div class="metric-tag">Verification Coverage</div>
                </div>
            </td>
        </tr>
    </table>

    <table class="section-header-table">
        <tr>
            <td class="section-title-cell">
                <h2 class="section-title">1.0 Executive Summary & Statutory Mandate</h2>
            </td>
            <td class="section-badge-cell">
                <span class="section-badge badge-exec">Executive Directive</span>
            </td>
        </tr>
    </table>
    <div class="section-narrative">
        This executive compliance summary compiles the enforceable requirements derived from the formal codified statutory text of <strong>{{ regulation.name }}</strong> ({{ regulation.jurisdiction }}). 
        The provisions cataloged herein constitute mandatory technical and governance obligations, requiring verifiable system actions, continuous log retention, and verifiable proof of compliance for statutory supervisory authorities.
    </div>

    {% for req in requirements %}
    <div class="audit-card {{ req.severity_str }}">
        <table class="card-top-table">
            <tr>
                <td class="card-top-left">
                    <span class="citation-tag">{{ req.citation }}</span>
                    <strong class="card-req-title">{{ req.title }}</strong>
                </td>
                <td class="card-top-right">
                    <span class="severity-pill pill-{{ req.severity_str }}">{{ req.severity_str }}</span>
                </td>
            </tr>
        </table>
        <div class="card-content">
            <div class="card-desc">{{ req.description }}</div>
            
            <table class="specs-table">
                <tr>
                    <td class="spec-pane-col spec-pane-left">
                        <div class="spec-pane-title">Mandatory Technical Actions</div>
                        {% if req.actions %}
                            <ul class="spec-item-list">
                            {% for act in req.actions %}
                                <li><span class="bullet-action">&bull;</span>{{ act }}</li>
                            {% endfor %}
                            </ul>
                        {% else %}
                            <span style="color: #64748b; font-size: 7.5pt;">Enforce baseline technical security protocols.</span>
                        {% endif %}
                    </td>
                    <td class="spec-pane-col spec-pane-right">
                        <div class="spec-pane-title">Supervisory Audit Deliverables</div>
                        {% if req.evidence_required %}
                            <ul class="spec-item-list">
                            {% for ev in req.evidence_required %}
                                <li><span class="bullet-evidence">&#10003;</span>{{ ev }}</li>
                            {% endfor %}
                            </ul>
                        {% else %}
                            <span style="color: #64748b; font-size: 7.5pt;">Cryptographic log preservation and configuration snapshot.</span>
                        {% endif %}
                    </td>
                </tr>
            </table>

            {% if req.conditions %}
            <div class="stipulations-strip">
                <strong>Statutory Stipulations:</strong> {{ req.conditions|join(' • ') }}
            </div>
            {% endif %}
        </div>
    </div>
    {% endfor %}

    <div class="footer-stamp">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="text-align: left; font-size: 7pt; color: #64748b;">Official Statutory Compliance Report | Generated by Regulation-as-Code Compiler</td>
                <td style="text-align: right; font-size: 7pt; color: #64748b;">Report ID: {{ report_id }}</td>
            </tr>
        </table>
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
    <div class="letterhead-accent"></div>
    <table class="letterhead-table">
        <tr>
            <td class="letterhead-left">
                <span class="doc-classification">Technical Specification</span>
                <h1 class="doc-title">{{ report_title }}</h1>
                <p class="doc-subtitle">{{ regulation.name }} <span class="jurisdiction-badge">{{ regulation.jurisdiction }}</span></p>
            </td>
            <td class="letterhead-right">
                <div class="doc-meta-box">
                    <table class="meta-inner-table">
                        <tr><td class="meta-lbl">DOC REF:</td><td class="meta-val">RAC-{{ report_id[:8]|upper }}</td></tr>
                        <tr><td class="meta-lbl">ISSUER:</td><td class="meta-val">{{ org_name }}</td></tr>
                        <tr><td class="meta-lbl">TIMESTAMP:</td><td class="meta-val">{{ date }} UTC</td></tr>
                        <tr><td class="meta-lbl">FORMAT:</td><td class="meta-val" style="color: #7c3aed;">EXECUTABLE AST</td></tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <table class="metadata-ribbon-table">
        <tr>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Issuing Entity</span>
                <span class="ribbon-val">{{ org_name }}</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Legal Framework</span>
                <span class="ribbon-val">{{ regulation.name }}</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Jurisdiction & Scope</span>
                <span class="ribbon-val">{{ regulation.jurisdiction }} &bull; Technical Specifications</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Total Mappings</span>
                <span class="ribbon-val" style="color: #7c3aed;">{{ requirements|length }} Controls</span>
            </td>
        </tr>
    </table>

    <table class="section-header-table">
        <tr>
            <td class="section-title-cell">
                <h2 class="section-title">Requirements to Technical System Enforcement Matrix</h2>
            </td>
            <td class="section-badge-cell">
                <span class="section-badge badge-tech">AST Enforcement</span>
            </td>
        </tr>
    </table>
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
                        <div class="stipulations-strip" style="margin-top: 4px;">
                            {{ req.conditions|join(', ') }}
                        </div>
                    {% endif %}
                </td>
            </tr>
            {% endfor %}
        </tbody>
    </table>

    <div class="footer-stamp">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="text-align: left; font-size: 7pt; color: #64748b;">Technical Enforcement Matrix | Generated by Regulation-as-Code Compiler</td>
                <td style="text-align: right; font-size: 7pt; color: #64748b;">Report ID: {{ report_id }}</td>
            </tr>
        </table>
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
    <div class="letterhead-accent"></div>
    <table class="letterhead-table">
        <tr>
            <td class="letterhead-left">
                <span class="doc-classification">Supervisory Audit Manifest</span>
                <h1 class="doc-title">{{ report_title }}</h1>
                <p class="doc-subtitle">{{ regulation.name }} <span class="jurisdiction-badge">{{ regulation.jurisdiction }}</span></p>
            </td>
            <td class="letterhead-right">
                <div class="doc-meta-box">
                    <table class="meta-inner-table">
                        <tr><td class="meta-lbl">DOC REF:</td><td class="meta-val">RAC-{{ report_id[:8]|upper }}</td></tr>
                        <tr><td class="meta-lbl">ISSUER:</td><td class="meta-val">{{ org_name }}</td></tr>
                        <tr><td class="meta-lbl">TIMESTAMP:</td><td class="meta-val">{{ date }} UTC</td></tr>
                        <tr><td class="meta-lbl">AUDIT READINESS:</td><td class="meta-val" style="color: #059669;">CERTIFIED</td></tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <table class="metadata-ribbon-table">
        <tr>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Issuing Entity</span>
                <span class="ribbon-val">{{ org_name }}</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Legal Framework</span>
                <span class="ribbon-val">{{ regulation.name }}</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Scope</span>
                <span class="ribbon-val">{{ regulation.jurisdiction }} &bull; Evidentiary Manifest</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Total Deliverables</span>
                <span class="ribbon-val" style="color: #7c3aed;">{{ requirements|length }} Controls</span>
            </td>
        </tr>
    </table>

    <table class="section-header-table">
        <tr>
            <td class="section-title-cell">
                <h2 class="section-title">Mandatory Audit Artifacts & Telemetry Requirements</h2>
            </td>
            <td class="section-badge-cell">
                <span class="section-badge badge-audit">Audit Manifest</span>
            </td>
        </tr>
    </table>
    <div class="section-narrative">
        Exhaustive evidentiary deliverables and cryptographic verification requirements mandated for statutory compliance inspections.
    </div>

    {% for req in requirements %}
    <div class="audit-card {{ req.severity_str }}">
        <table class="card-top-table">
            <tr>
                <td class="card-top-left">
                    <span class="citation-tag">{{ req.citation }}</span>
                    <strong class="card-req-title">{{ req.title }}</strong>
                </td>
                <td class="card-top-right">
                    <span class="severity-pill pill-{{ req.severity_str }}">{{ req.severity_str }}</span>
                </td>
            </tr>
        </table>
        <div class="card-content">
            <div class="card-desc">{{ req.description }}</div>
            
            <table class="specs-table">
                <tr>
                    <td class="spec-pane-col spec-pane-left">
                        <div class="spec-pane-title">Mandatory Audit Evidence Deliverables</div>
                        {% if req.evidence_required %}
                            <ul class="spec-item-list">
                            {% for ev in req.evidence_required %}
                                <li><span class="bullet-evidence">&#10003;</span>{{ ev }}</li>
                            {% endfor %}
                            </ul>
                        {% else %}
                            <span style="color: #64748b; font-size: 7.5pt;">Formal configuration audit trail, cryptographic hash verification, and system log preservation.</span>
                        {% endif %}
                    </td>
                    <td class="spec-pane-col spec-pane-right">
                        <div class="spec-pane-title">Mandatory Technical Safeguards</div>
                        {% if req.actions %}
                            <ul class="spec-item-list">
                            {% for act in req.actions %}
                                <li><span class="bullet-action">&bull;</span>{{ act }}</li>
                            {% endfor %}
                            </ul>
                        {% else %}
                            <span style="color: #64748b; font-size: 7.5pt;">Verify continuous operational control status.</span>
                        {% endif %}
                    </td>
                </tr>
            </table>
        </div>
    </div>
    {% endfor %}

    <div class="footer-stamp">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="text-align: left; font-size: 7pt; color: #64748b;">Supervisory Audit Manifest | Generated by Regulation-as-Code Compiler</td>
                <td style="text-align: right; font-size: 7pt; color: #64748b;">Report ID: {{ report_id }}</td>
            </tr>
        </table>
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
    <div class="letterhead-accent"></div>
    <table class="letterhead-table">
        <tr>
            <td class="letterhead-left">
                <span class="doc-classification" style="color: #991b1b; background: #fef2f2; border-color: #fecaca;">Risk Exposure Assessment</span>
                <h1 class="doc-title">{{ report_title }}</h1>
                <p class="doc-subtitle">{{ regulation.name }} <span class="jurisdiction-badge" style="background: #dc2626;">{{ regulation.jurisdiction }}</span></p>
            </td>
            <td class="letterhead-right">
                <div class="doc-meta-box">
                    <table class="meta-inner-table">
                        <tr><td class="meta-lbl">DOC REF:</td><td class="meta-val">RAC-{{ report_id[:8]|upper }}</td></tr>
                        <tr><td class="meta-lbl">ISSUER:</td><td class="meta-val">{{ org_name }}</td></tr>
                        <tr><td class="meta-lbl">TIMESTAMP:</td><td class="meta-val">{{ date }} UTC</td></tr>
                        <tr><td class="meta-lbl">FOCUS:</td><td class="meta-val" style="color: #dc2626;">HIGH & CRITICAL EXPOSURE</td></tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <table class="metadata-ribbon-table">
        <tr>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Issuing Entity</span>
                <span class="ribbon-val">{{ org_name }}</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Legal Framework</span>
                <span class="ribbon-val">{{ regulation.name }}</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Critical / High Directives</span>
                <span class="ribbon-val" style="color: #dc2626;">{{ critical_count + high_count }} Elevated Obligations</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Remediation Priority</span>
                <span class="ribbon-val" style="color: #dc2626;">Immediate Operational Action</span>
            </td>
        </tr>
    </table>

    <table class="metrics-table">
        <tr>
            <td class="metric-td">
                <div class="metric-box red">
                    <div class="metric-num">{{ critical_count }}</div>
                    <div class="metric-tag">Critical Exposure</div>
                </div>
            </td>
            <td class="metric-td">
                <div class="metric-box amber">
                    <div class="metric-num">{{ high_count }}</div>
                    <div class="metric-tag">High-Risk Safeguards</div>
                </div>
            </td>
            <td class="metric-td">
                <div class="metric-box purple">
                    <div class="metric-num">{{ requirements|length }}</div>
                    <div class="metric-tag">Total Baseline</div>
                </div>
            </td>
            <td class="metric-td">
                <div class="metric-box green">
                    <div class="metric-num">100%</div>
                    <div class="metric-tag">Codified Rigor</div>
                </div>
            </td>
        </tr>
    </table>

    <table class="section-header-table">
        <tr>
            <td class="section-title-cell">
                <h2 class="section-title">Critical Risk & High-Exposure Gap Analysis</h2>
            </td>
            <td class="section-badge-cell">
                <span class="section-badge badge-gap">Risk Assessment</span>
            </td>
        </tr>
    </table>
    <div class="section-narrative">
        This gap analysis assesses statutory provisions carrying maximum enforcement risk under <strong>{{ regulation.name }}</strong>. 
        Items flagged as Critical or High severity represent legal obligations where missing controls or deferred remediation expose the organization to direct statutory sanctions or operational disruption.
    </div>

    {% set gap_reqs = requirements | selectattr("severity_str", "in", ["critical", "high"]) | list %}
    {% set target_reqs = gap_reqs if gap_reqs else requirements[:5] %}

    {% for req in target_reqs %}
    <div class="audit-card {{ req.severity_str }}">
        <table class="card-top-table">
            <tr>
                <td class="card-top-left">
                    <span class="citation-tag" style="background: #fee2e2; color: #991b1b;">{{ req.citation }}</span>
                    <strong class="card-req-title" style="color: #991b1b;">URGENT REMEDIATION: {{ req.title }}</strong>
                </td>
                <td class="card-top-right">
                    <span class="severity-pill pill-{{ req.severity_str }}">{{ req.severity_str }}</span>
                </td>
            </tr>
        </table>
        <div class="card-content">
            <div class="card-desc">{{ req.description }}</div>
            
            <table class="specs-table">
                <tr>
                    <td class="spec-pane-col spec-pane-left">
                        <div class="spec-pane-title" style="color: #991b1b;">Immediate Remediation Actions</div>
                        {% if req.actions %}
                            <ul class="spec-item-list">
                            {% for act in req.actions %}
                                <li><span class="bullet-action" style="color: #dc2626;">&bull;</span><strong>{{ act }}</strong></li>
                            {% endfor %}
                            </ul>
                        {% else %}
                            <span style="color: #dc2626; font-size: 7.5pt;">Deploy immediate technical safeguards and verify configuration baseline.</span>
                        {% endif %}
                    </td>
                    <td class="spec-pane-col spec-pane-right">
                        <div class="spec-pane-title">Required Audit Deliverables</div>
                        {% if req.evidence_required %}
                            <ul class="spec-item-list">
                            {% for ev in req.evidence_required %}
                                <li><span class="bullet-evidence">&#10003;</span>{{ ev }}</li>
                            {% endfor %}
                            </ul>
                        {% else %}
                            <span style="color: #64748b; font-size: 7.5pt;">Signed architectural remediation sign-off & system telemetry logs.</span>
                        {% endif %}
                    </td>
                </tr>
            </table>

            {% if req.conditions %}
            <div class="stipulations-strip" style="background: #fff1f2; border-color: #ffe4e6; color: #9f1239;">
                <strong>Exposure Conditions:</strong> {{ req.conditions|join(' • ') }}
            </div>
            {% endif %}
        </div>
    </div>
    {% endfor %}

    <div class="footer-stamp">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="text-align: left; font-size: 7pt; color: #64748b;">Regulatory Gap Analysis & Risk Exposure Manifest | Regulation-as-Code Compiler</td>
                <td style="text-align: right; font-size: 7pt; color: #64748b;">Report ID: {{ report_id }}</td>
            </tr>
        </table>
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
    <div class="letterhead-accent"></div>
    <table class="letterhead-table">
        <tr>
            <td class="letterhead-left">
                <span class="doc-classification">Operational Playbook</span>
                <h1 class="doc-title">{{ report_title }}</h1>
                <p class="doc-subtitle">{{ regulation.name }} <span class="jurisdiction-badge">{{ regulation.jurisdiction }}</span></p>
            </td>
            <td class="letterhead-right">
                <div class="doc-meta-box">
                    <table class="meta-inner-table">
                        <tr><td class="meta-lbl">DOC REF:</td><td class="meta-val">RAC-{{ report_id[:8]|upper }}</td></tr>
                        <tr><td class="meta-lbl">ISSUER:</td><td class="meta-val">{{ org_name }}</td></tr>
                        <tr><td class="meta-lbl">TIMESTAMP:</td><td class="meta-val">{{ date }} UTC</td></tr>
                        <tr><td class="meta-lbl">FIELD READY:</td><td class="meta-val" style="color: #059669;">YES</td></tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <table class="metadata-ribbon-table">
        <tr>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Issuing Entity</span>
                <span class="ribbon-val">{{ org_name }}</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Legal Framework</span>
                <span class="ribbon-val">{{ regulation.name }}</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Scope</span>
                <span class="ribbon-val">{{ regulation.jurisdiction }} &bull; Engineering & GRC Rollout</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Total Action Items</span>
                <span class="ribbon-val" style="color: #7c3aed;">{{ requirements|length }} Controls</span>
            </td>
        </tr>
    </table>

    <table class="section-header-table">
        <tr>
            <td class="section-title-cell">
                <h2 class="section-title">Operational Engineering & Compliance Checklist</h2>
            </td>
            <td class="section-badge-cell">
                <span class="section-badge badge-check">Field Playbook</span>
            </td>
        </tr>
    </table>
    <div class="section-narrative">
        Field-ready actionable checklist for cross-functional engineering, legal, and compliance deployment squads.
    </div>

    {% for req in requirements %}
    <table class="checklist-item-table">
        <tr>
            <td class="check-box-td">
                <div class="custom-check-box">&#9633;</div>
            </td>
            <td class="checklist-content-td">
                <table class="checklist-header-table">
                    <tr>
                        <td class="checklist-header-left">
                            <span class="citation-tag">{{ req.citation }}</span>
                            <strong style="font-size: 8.5pt; color: #0f172a; vertical-align: middle;">{{ req.title }}</strong>
                        </td>
                        <td class="checklist-header-right">
                            <span class="severity-pill pill-{{ req.severity_str }}">{{ req.severity_str }}</span>
                        </td>
                    </tr>
                </table>
                <div style="font-size: 8pt; color: #475569; margin-top: 3px; margin-bottom: 4px; line-height: 1.35;">
                    {{ req.description }}
                </div>
                {% if req.actions %}
                <div class="checklist-action-strip">
                    <strong>Required System Action:</strong> {{ req.actions|join(' • ') }}
                </div>
                {% endif %}
            </td>
        </tr>
    </table>
    {% endfor %}

    <div class="footer-stamp">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="text-align: left; font-size: 7pt; color: #64748b;">Operational Engineering Checklist | Generated by Regulation-as-Code Compiler</td>
                <td style="text-align: right; font-size: 7pt; color: #64748b;">Report ID: {{ report_id }}</td>
            </tr>
        </table>
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
    <!-- Top Letterhead -->
    <div class="letterhead-accent"></div>
    <table class="letterhead-table">
        <tr>
            <td class="letterhead-left">
                <span class="doc-classification">Official Statutory Audit Record</span>
                <h1 class="doc-title">{{ report_title }}</h1>
                <p class="doc-subtitle">{{ regulation.name }} <span class="jurisdiction-badge">{{ regulation.jurisdiction }}</span></p>
            </td>
            <td class="letterhead-right">
                <div class="doc-meta-box">
                    <table class="meta-inner-table">
                        <tr><td class="meta-lbl">DOC REF:</td><td class="meta-val">RAC-{{ report_id[:8]|upper }}</td></tr>
                        <tr><td class="meta-lbl">ISSUER:</td><td class="meta-val">{{ org_name }}</td></tr>
                        <tr><td class="meta-lbl">TIMESTAMP:</td><td class="meta-val">{{ date }} UTC</td></tr>
                        <tr><td class="meta-lbl">COMPLIANCE:</td><td class="meta-val" style="color: #059669;">100% CODIFIED</td></tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <!-- Metadata Ribbon -->
    <table class="metadata-ribbon-table">
        <tr>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Issuing Entity</span>
                <span class="ribbon-val">{{ org_name }}</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Legal Framework</span>
                <span class="ribbon-val">{{ regulation.name }}</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Jurisdiction & Scope</span>
                <span class="ribbon-val">{{ regulation.jurisdiction }} &bull; Canonical Rulebook</span>
            </td>
            <td class="ribbon-cell">
                <span class="ribbon-lbl">Supervisory Status</span>
                <span class="ribbon-val" style="color: #7c3aed;">Certified Active Enforcement</span>
            </td>
        </tr>
    </table>

    <!-- KPI Scorecard -->
    <table class="metrics-table">
        <tr>
            <td class="metric-td">
                <div class="metric-box purple">
                    <div class="metric-num">{{ requirements|length }}</div>
                    <div class="metric-tag">Enforceable Controls</div>
                </div>
            </td>
            <td class="metric-td">
                <div class="metric-box red">
                    <div class="metric-num">{{ critical_count }}</div>
                    <div class="metric-tag">Critical Obligations</div>
                </div>
            </td>
            <td class="metric-td">
                <div class="metric-box amber">
                    <div class="metric-num">{{ high_count }}</div>
                    <div class="metric-tag">High-Risk Safeguards</div>
                </div>
            </td>
            <td class="metric-td">
                <div class="metric-box green">
                    <div class="metric-num">100%</div>
                    <div class="metric-tag">Verification Coverage</div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Included Modules Index -->
    <table class="module-index-table">
        <tr>
            <td class="module-index-title-cell">Included Audit Modules</td>
            <td class="module-index-pills-cell">
                {% for s_name in section_names %}
                <span class="pill-item">&#10003; {{ s_name }}</span>
                {% endfor %}
            </td>
        </tr>
    </table>

    <!-- 1. Executive Summary -->
    {% if 'executive_summary' in selected_sections %}
    <div id="module-executive-summary">
        <table class="section-header-table">
            <tr>
                <td class="section-title-cell">
                    <h2 class="section-title">1.0 Executive Summary & Statutory Mandate</h2>
                </td>
                <td class="section-badge-cell">
                    <span class="section-badge badge-exec">Executive Directive</span>
                </td>
            </tr>
        </table>
        <div class="section-narrative">
            This executive compliance summary compiles the enforceable requirements derived from the formal codified statutory text of <strong>{{ regulation.name }}</strong> ({{ regulation.jurisdiction }}). 
            The directives outlined below represent mandatory technical baseline obligations requiring continuous log preservation, verifiable system actions, and formal proof for statutory oversight inspections.
        </div>

        {% for req in requirements %}
        <div class="audit-card {{ req.severity_str }}">
            <table class="card-top-table">
                <tr>
                    <td class="card-top-left">
                        <span class="citation-tag">{{ req.citation }}</span>
                        <strong class="card-req-title">{{ req.title }}</strong>
                    </td>
                    <td class="card-top-right">
                        <span class="severity-pill pill-{{ req.severity_str }}">{{ req.severity_str }}</span>
                    </td>
                </tr>
            </table>
            <div class="card-content">
                <div class="card-desc">{{ req.description }}</div>
                
                <table class="specs-table">
                    <tr>
                        <td class="spec-pane-col spec-pane-left">
                            <div class="spec-pane-title">Mandatory Technical Actions</div>
                            {% if req.actions %}
                                <ul class="spec-item-list">
                                {% for act in req.actions %}
                                    <li><span class="bullet-action">&bull;</span>{{ act }}</li>
                                {% endfor %}
                                </ul>
                            {% else %}
                                <span style="color: #64748b; font-size: 7.5pt;">Enforce baseline technical security protocols.</span>
                            {% endif %}
                        </td>
                        <td class="spec-pane-col spec-pane-right">
                            <div class="spec-pane-title">Supervisory Audit Deliverables</div>
                            {% if req.evidence_required %}
                                <ul class="spec-item-list">
                                {% for ev in req.evidence_required %}
                                    <li><span class="bullet-evidence">&#10003;</span>{{ ev }}</li>
                                {% endfor %}
                                </ul>
                            {% else %}
                                <span style="color: #64748b; font-size: 7.5pt;">Cryptographic log preservation and configuration snapshot.</span>
                            {% endif %}
                        </td>
                    </tr>
                </table>

                {% if req.conditions %}
                <div class="stipulations-strip">
                    <strong>Statutory Stipulations:</strong> {{ req.conditions|join(' • ') }}
                </div>
                {% endif %}
            </div>
        </div>
        {% endfor %}
    </div>
    {% if 'gap_analysis' in selected_sections or 'technical' in selected_sections or 'audit_evidence' in selected_sections or 'checklist' in selected_sections %}
    <div style="page-break-after: always;"></div>
    {% endif %}
    {% endif %}

    <!-- 2. Gap Analysis -->
    {% if 'gap_analysis' in selected_sections %}
    <div id="module-gap-analysis">
        <table class="section-header-table">
            <tr>
                <td class="section-title-cell">
                    <h2 class="section-title">2.0 Regulatory Gap Analysis & High-Risk Exposure Assessment</h2>
                </td>
                <td class="section-badge-cell">
                    <span class="section-badge badge-gap">Risk Assessment</span>
                </td>
            </tr>
        </table>
        <div class="section-narrative">
            The provisions detailed below represent statutory mandates carrying maximum compliance risk under <strong>{{ regulation.name }}</strong>. 
            Provisions classified as Critical or High severity require immediate technical safeguard mobilization; missing or incomplete controls expose the institution to supervisory fines and operational mandates.
        </div>

        {% set gap_reqs = requirements | selectattr("severity_str", "in", ["critical", "high"]) | list %}
        {% set target_reqs = gap_reqs if gap_reqs else requirements[:5] %}

        {% for req in target_reqs %}
        <div class="audit-card {{ req.severity_str }}">
            <table class="card-top-table">
                <tr>
                    <td class="card-top-left">
                        <span class="citation-tag" style="background: #fee2e2; color: #991b1b;">{{ req.citation }}</span>
                        <strong class="card-req-title" style="color: #991b1b;">URGENT REMEDIATION: {{ req.title }}</strong>
                    </td>
                    <td class="card-top-right">
                        <span class="severity-pill pill-{{ req.severity_str }}">{{ req.severity_str }}</span>
                    </td>
                </tr>
            </table>
            <div class="card-content">
                <div class="card-desc">{{ req.description }}</div>
                
                <table class="specs-table">
                    <tr>
                        <td class="spec-pane-col spec-pane-left">
                            <div class="spec-pane-title" style="color: #991b1b;">Immediate Remediation Actions</div>
                            {% if req.actions %}
                                <ul class="spec-item-list">
                                {% for act in req.actions %}
                                    <li><span class="bullet-action" style="color: #dc2626;">&bull;</span><strong>{{ act }}</strong></li>
                                {% endfor %}
                                </ul>
                            {% else %}
                                <span style="color: #dc2626; font-size: 7.5pt;">Deploy immediate technical safeguards and verify configuration baseline.</span>
                            {% endif %}
                        </td>
                        <td class="spec-pane-col spec-pane-right">
                            <div class="spec-pane-title">Required Audit Deliverables</div>
                            {% if req.evidence_required %}
                                <ul class="spec-item-list">
                                {% for ev in req.evidence_required %}
                                    <li><span class="bullet-evidence">&#10003;</span>{{ ev }}</li>
                                {% endfor %}
                                </ul>
                            {% else %}
                                <span style="color: #64748b; font-size: 7.5pt;">Signed architectural remediation sign-off & system telemetry logs.</span>
                            {% endif %}
                        </td>
                    </tr>
                </table>

                {% if req.conditions %}
                <div class="stipulations-strip" style="background: #fff1f2; border-color: #ffe4e6; color: #9f1239;">
                    <strong>Exposure Conditions:</strong> {{ req.conditions|join(' • ') }}
                </div>
                {% endif %}
            </div>
        </div>
        {% endfor %}
    </div>
    {% if 'technical' in selected_sections or 'audit_evidence' in selected_sections or 'checklist' in selected_sections %}
    <div style="page-break-after: always;"></div>
    {% endif %}
    {% endif %}

    <!-- 3. Technical System Mapping -->
    {% if 'technical' in selected_sections %}
    <div id="module-technical">
        <table class="section-header-table">
            <tr>
                <td class="section-title-cell">
                    <h2 class="section-title">3.0 Technical System Mapping & AST Enforcement Matrix</h2>
                </td>
                <td class="section-badge-cell">
                    <span class="section-badge badge-tech">AST Enforcement</span>
                </td>
            </tr>
        </table>
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
                            <div class="stipulations-strip" style="margin-top: 4px;">
                                {{ req.conditions|join(', ') }}
                            </div>
                        {% endif %}
                    </td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
    {% if 'audit_evidence' in selected_sections or 'checklist' in selected_sections %}
    <div style="page-break-after: always;"></div>
    {% endif %}
    {% endif %}

    <!-- 4. Audit Evidence -->
    {% if 'audit_evidence' in selected_sections %}
    <div id="module-audit-evidence">
        <table class="section-header-table">
            <tr>
                <td class="section-title-cell">
                    <h2 class="section-title">4.0 Supervisory Audit Evidence & Telemetry Requirements</h2>
                </td>
                <td class="section-badge-cell">
                    <span class="section-badge badge-audit">Audit Manifest</span>
                </td>
            </tr>
        </table>
        <div class="section-narrative">
            Exhaustive evidentiary deliverables and cryptographic verification requirements mandated for statutory compliance inspections.
        </div>

        {% for req in requirements %}
        <div class="audit-card {{ req.severity_str }}">
            <table class="card-top-table">
                <tr>
                    <td class="card-top-left">
                        <span class="citation-tag">{{ req.citation }}</span>
                        <strong class="card-req-title">{{ req.title }}</strong>
                    </td>
                    <td class="card-top-right">
                        <span class="severity-pill pill-{{ req.severity_str }}">{{ req.severity_str }}</span>
                    </td>
                </tr>
            </table>
            <div class="card-content">
                <div class="card-desc">{{ req.description }}</div>
                
                <table class="specs-table">
                    <tr>
                        <td class="spec-pane-col spec-pane-left">
                            <div class="spec-pane-title">Mandatory Audit Evidence Deliverables</div>
                            {% if req.evidence_required %}
                                <ul class="spec-item-list">
                                {% for ev in req.evidence_required %}
                                    <li><span class="bullet-evidence">&#10003;</span>{{ ev }}</li>
                                {% endfor %}
                                </ul>
                            {% else %}
                                <span style="color: #64748b; font-size: 7.5pt;">Formal configuration audit trail, cryptographic hash verification, and system log preservation.</span>
                            {% endif %}
                        </td>
                        <td class="spec-pane-col spec-pane-right">
                            <div class="spec-pane-title">Mandatory Technical Safeguards</div>
                            {% if req.actions %}
                                <ul class="spec-item-list">
                                {% for act in req.actions %}
                                    <li><span class="bullet-action">&bull;</span>{{ act }}</li>
                                {% endfor %}
                                </ul>
                            {% else %}
                                <span style="color: #64748b; font-size: 7.5pt;">Verify continuous operational control status.</span>
                            {% endif %}
                        </td>
                    </tr>
                </table>
            </div>
        </div>
        {% endfor %}
    </div>
    {% if 'checklist' in selected_sections %}
    <div style="page-break-after: always;"></div>
    {% endif %}
    {% endif %}

    <!-- 5. Implementation Checklist -->
    {% if 'checklist' in selected_sections %}
    <div id="module-checklist">
        <table class="section-header-table">
            <tr>
                <td class="section-title-cell">
                    <h2 class="section-title">5.0 Operational Engineering & Compliance Checklist</h2>
                </td>
                <td class="section-badge-cell">
                    <span class="section-badge badge-check">Field Playbook</span>
                </td>
            </tr>
        </table>
        <div class="section-narrative">
            Field-ready actionable checklist for cross-functional engineering, legal, and compliance deployment squads.
        </div>

        {% for req in requirements %}
        <table class="checklist-item-table">
            <tr>
                <td class="check-box-td">
                    <div class="custom-check-box">&#9633;</div>
                </td>
                <td class="checklist-content-td">
                    <table class="checklist-header-table">
                        <tr>
                            <td class="checklist-header-left">
                                <span class="citation-tag">{{ req.citation }}</span>
                                <strong style="font-size: 8.5pt; color: #0f172a; vertical-align: middle;">{{ req.title }}</strong>
                            </td>
                            <td class="checklist-header-right">
                                <span class="severity-pill pill-{{ req.severity_str }}">{{ req.severity_str }}</span>
                            </td>
                        </tr>
                    </table>
                    <div style="font-size: 8pt; color: #475569; margin-top: 3px; margin-bottom: 4px; line-height: 1.35;">
                        {{ req.description }}
                    </div>
                    {% if req.actions %}
                    <div class="checklist-action-strip">
                        <strong>Required System Action:</strong> {{ req.actions|join(' • ') }}
                    </div>
                    {% endif %}
                </td>
            </tr>
        </table>
        {% endfor %}
    </div>
    {% endif %}

    <div class="footer-stamp">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="text-align: left; font-size: 7pt; color: #64748b;">Official Statutory Compliance Report | Generated by Regulation-as-Code Compiler</td>
                <td style="text-align: right; font-size: 7pt; color: #64748b;">Report ID: {{ report_id }}</td>
            </tr>
        </table>
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

@celery_app.task(bind=False)
def generate_pdf_report_task(report_id: str, job_id: str = None, sections: list = None):
    from app.db.session import SessionLocal
    from app.models.jobs import BackgroundJob
    db = SessionLocal()
    dispatcher = None
    if job_id:
        dispatcher = EventDispatcher(db, uuid.UUID(job_id))
        
    try:
        # Check if report already completed
        existing_rep = db.query(Report).filter(Report.id == report_id).first()
        if existing_rep and existing_rep.status == ReportStatusEnum.completed and existing_rep.storage_path:
            logger.info(f"Report {report_id} already completed, skipping redundant processing.")
            if job_id:
                update_job_status(db, uuid.UUID(job_id), JobStatusEnum.completed, {
                    "report_id": str(existing_rep.id),
                    "storage_path": existing_rep.storage_path
                })
            return

        if job_id:
            update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing)

        if dispatcher: dispatcher.emit(1, "Initialize Report", "started")
        
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

        template = Template(tmpl_str, autoescape=False)
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
        if dispatcher: dispatcher.emit(3, "Compile Document Layout", "completed", {
            "template_used": "composite" if is_composite else selected_sections[0],
            "sections": selected_sections
        })
        
        # 4. Generate PDF using high-performance native PyMuPDF engine
        if dispatcher: dispatcher.emit(4, "Render PDF", "started")
        pdf_bytes = b""
        try:
            import pymupdf
            clean_css = re.sub(r'@(top|bottom)-(left|right)\s*\{[^}]*\}', '', BASE_CSS)
            
            clean_html = template.render(
                base_css=clean_css,
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
            
            story = pymupdf.Story(html=clean_html)
            buffer = io.BytesIO()
            writer = pymupdf.DocumentWriter(buffer)
            
            def rectfn(rect_num, filled):
                mediabox = pymupdf.Rect(0, 0, 595, 842) # A4
                rect = pymupdf.Rect(35, 45, 560, 795)   # Printable Margins
                return mediabox, rect, None

            story.write(writer, rectfn=rectfn)
            writer.close()
            
            doc = pymupdf.open(stream=buffer.getvalue(), filetype='pdf')
            total_pages = len(doc)
            
            for idx, page in enumerate(doc):
                # Running Top Header & Rules
                page.draw_line(pymupdf.Point(35, 38), pymupdf.Point(560, 38), color=(0.75, 0.78, 0.85), width=0.5)
                page.insert_text(pymupdf.Point(35, 32), 'STATUTORY COMPLIANCE COMPILER • OFFICIAL AUDIT RECORD', fontsize=7, color=(0.35, 0.4, 0.5))
                page.insert_text(pymupdf.Point(430, 32), 'STRICT ENFORCEMENT DIRECTIVE', fontsize=7, color=(0.45, 0.2, 0.8))
                
                # Running Bottom Footer & Rules
                page.draw_line(pymupdf.Point(35, 805), pymupdf.Point(560, 805), color=(0.85, 0.88, 0.92), width=0.5)
                page.insert_text(pymupdf.Point(35, 818), 'CONFIDENTIAL • CERTIFIED CODIFIED STATUTORY AUDIT', fontsize=7, color=(0.5, 0.55, 0.6))
                page.insert_text(pymupdf.Point(490, 818), f'Page {idx+1} of {total_pages}', fontsize=7.5, color=(0.35, 0.4, 0.5))
                
            pdf_bytes = doc.tobytes()
            doc.close()
            logger.info(f"PyMuPDF rendered {total_pages} pages ({len(pdf_bytes)} bytes) for report {report.id}")
            
        except Exception as render_err:
            logger.warning(f"Native Story rendering failed ({render_err}), falling back to direct document builder...")
            import pymupdf
            doc = pymupdf.open()
            page = doc.new_page(width=595, height=842)
            page.insert_text(pymupdf.Point(40, 60), "STATUTORY COMPLIANCE AUDIT REPORT", fontsize=16, fontname="helv", color=(0.2, 0.2, 0.6))
            page.insert_text(pymupdf.Point(40, 85), f"Regulation: {reg.name if hasattr(reg, 'name') else 'Statutory Directive'}", fontsize=11, fontname="helv")
            page.insert_text(pymupdf.Point(40, 105), f"Jurisdiction: {reg.jurisdiction if hasattr(reg, 'jurisdiction') else 'Official Jurisdiction'}", fontsize=9, fontname="helv", color=(0.4, 0.4, 0.4))
            page.insert_text(pymupdf.Point(40, 125), f"Audit ID: {report.id} | Generated: {datetime.now(timezone.utc).isoformat()}", fontsize=8, fontname="helv", color=(0.5, 0.5, 0.5))
            page.draw_line(pymupdf.Point(40, 135), pymupdf.Point(555, 135), color=(0.7, 0.7, 0.7), width=1)
            
            y = 160
            for r_item in formatted_reqs[:35]:
                if y > 780:
                    page = doc.new_page(width=595, height=842)
                    y = 50
                page.insert_text(pymupdf.Point(40, y), f"[{r_item.get('citation', 'Directive')}] {r_item.get('title', '')[:70]}", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
                y += 14
                page.insert_text(pymupdf.Point(40, y), f"Severity: {r_item.get('severity_str', 'HIGH')} | Type: {r_item.get('type_str', 'TECHNICAL')}", fontsize=7.5, fontname="helv", color=(0.4, 0.4, 0.4))
                y += 20
                
            pdf_bytes = doc.tobytes()
            doc.close()

        if dispatcher: dispatcher.emit(4, "Render PDF", "completed", {"size_bytes": len(pdf_bytes)})
            
        # 5. Upload to Local Storage / S3
        if dispatcher: dispatcher.emit(5, "Secure Storage Upload", "started")
        
        file_obj = io.BytesIO(pdf_bytes)
        filename = f"{report.id}.pdf"
        
        storage = StorageService()
        storage_path = storage.upload_file(file_obj, filename, "application/pdf")
        
        # Build production-ready dynamic download URL
        backend_url = os.getenv("API_PUBLIC_URL") or os.getenv("RENDER_EXTERNAL_URL") or "https://regulation-compiler.onrender.com"
        if os.getenv("ENVIRONMENT") == "development" or os.getenv("ENVIRONMENT") == "local":
            download_url = f"http://127.0.0.1:8080/api/v1/reports/{report.id}/download"
        else:
            download_url = f"{backend_url.rstrip('/')}/api/v1/reports/{report.id}/download"
            
        relative_url = f"/api/v1/reports/{report.id}/download"
            
        report.storage_path = storage_path
        report.status = ReportStatusEnum.completed
        db.commit()
        
        if dispatcher: dispatcher.emit(5, "Secure Storage Upload", "completed", {
            "path": download_url, 
            "relative_path": relative_url, 
            "storage_path": storage_path
        })
        
        if job_id:
            update_job_status(db, uuid.UUID(job_id), JobStatusEnum.completed, {
                "report_id": str(report.id), 
                "url": download_url,
                "relative_url": relative_url
            })
        
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
