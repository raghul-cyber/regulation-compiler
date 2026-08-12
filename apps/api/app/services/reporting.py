import os
import uuid
from datetime import datetime
from jinja2 import Template
import boto3
from sqlalchemy.orm import Session

from app.models.audit import Report, ReportStatusEnum
from app.models.requirements import Requirement
from app.models.regulations import Regulation

# Initialize S3 Client
s3 = boto3.client(
    "s3",
    endpoint_url=os.environ.get("S3_ENDPOINT_URL"),
    aws_access_key_id=os.environ.get("S3_ACCESS_KEY"),
    aws_secret_access_key=os.environ.get("S3_SECRET_KEY"),
)
BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "regulations-files")

# --- HTML Templates ---
EXECUTIVE_SUMMARY_TMPL = """
<!DOCTYPE html>
<html>
<head>
<style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; }
    h1 { color: #111; border-bottom: 2px solid #0052cc; padding-bottom: 10px; }
    .meta { font-size: 0.9em; color: #666; margin-bottom: 30px; }
    .card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .count { font-size: 2em; font-weight: bold; color: #0052cc; }
</style>
</head>
<body>
    <h1>Executive Summary: {{ regulation.title }}</h1>
    <div class="meta">Generated: {{ date }} | Org: {{ org_id }}</div>
    
    <div class="card">
        <div>Total Enforceable Requirements</div>
        <div class="count">{{ requirements|length }}</div>
    </div>
    
    <h2>Key Obligations</h2>
    <ul>
    {% for req in requirements if req.type == 'obligation' %}
        <li><strong>{{ req.title }}</strong> (Severity: {{ req.severity }})</li>
    {% endfor %}
    </ul>
</body>
</html>
"""

TECHNICAL_TMPL = """
<!DOCTYPE html>
<html>
<head>
<style>
    body { font-family: monospace; padding: 20px; font-size: 12px; }
    h1 { border-bottom: 1px solid #ccc; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #eee; }
</style>
</head>
<body>
    <h1>Technical System Mapping</h1>
    <p>Generated: {{ date }}</p>
    <table>
        <tr><th>ID</th><th>Title</th><th>Actions Required</th><th>Severity</th></tr>
        {% for req in requirements %}
        <tr>
            <td>{{ req.id }}</td>
            <td>{{ req.title }}</td>
            <td>{{ req.actions|join(', ') }}</td>
            <td>{{ req.severity }}</td>
        </tr>
        {% endfor %}
    </table>
</body>
</html>
"""

AUDIT_EVIDENCE_TMPL = """
<!DOCTYPE html>
<html>
<head><style>body { font-family: Arial; padding: 40px; }</style></head>
<body>
    <h1>Audit Evidence Requirements</h1>
    <p>Generated: {{ date }}</p>
    <ul>
        {% for req in requirements %}
        <li><strong>{{ req.title }}</strong>: {{ req.evidence_required|join(', ') }}</li>
        {% endfor %}
    </ul>
</body>
</html>
"""

GAP_ANALYSIS_TMPL = """
<!DOCTYPE html>
<html>
<head><style>body { font-family: Arial; padding: 40px; color: #d97706; }</style></head>
<body>
    <h1>Gap Analysis Report</h1>
    <p>Generated: {{ date }}</p>
    <p>This report highlights missing controls and unresolved requirements.</p>
    <ul>
        {% for req in requirements if req.severity in ['high', 'critical'] %}
        <li>URGENT: {{ req.title }} ({{ req.description }})</li>
        {% endfor %}
    </ul>
</body>
</html>
"""

CHECKLIST_TMPL = """
<!DOCTYPE html>
<html>
<head><style>body { font-family: Arial; padding: 40px; } .chk { width: 15px; height: 15px; border: 1px solid #000; display: inline-block; margin-right: 10px; }</style></head>
<body>
    <h1>Implementation Checklist</h1>
    <p>Generated: {{ date }}</p>
    {% for req in requirements %}
    <div style="margin-bottom: 15px;">
        <div class="chk"></div><strong>{{ req.title }}</strong>
        <p style="margin-left: 30px; font-size: 0.9em; color: #555;">{{ req.description }}</p>
    </div>
    {% endfor %}
</body>
</html>
"""

TEMPLATES = {
    "executive_summary": EXECUTIVE_SUMMARY_TMPL,
    "technical": TECHNICAL_TMPL,
    "audit_evidence": AUDIT_EVIDENCE_TMPL,
    "gap_analysis": GAP_ANALYSIS_TMPL,
    "checklist": CHECKLIST_TMPL
}

# --- Celery Task ---
from celery import shared_task

@shared_task
def generate_pdf_report_task(report_id: str):
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        from playwright.sync_api import sync_playwright
        
        # 1. Fetch Report
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            return
            
        reg = db.query(Regulation).filter(Regulation.id == report.regulation_id).first()
        if not reg:
            report.status = ReportStatusEnum.failed
            db.commit()
            return
            
        # 2. Fetch approved requirements
        reqs = db.query(Requirement).filter(
            Requirement.regulation_version_id == reg.current_version_id,
            Requirement.validation_status == "approved"
        ).all()
        
        # 3. Render HTML
        tmpl_str = TEMPLATES.get(report.report_type.value, EXECUTIVE_SUMMARY_TMPL)
        template = Template(tmpl_str)
        html_content = template.render(
            regulation=reg,
            requirements=reqs,
            date=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            org_id=report.org_id
        )
        
        # 4. Generate PDF using Playwright
        pdf_bytes = b""
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_content(html_content)
            pdf_bytes = page.pdf(format="A4", print_background=True)
            browser.close()
            
        # 5. Upload to S3
        s3_key = f"reports/{report.org_id}/{report.regulation_id}/{report.id}.pdf"
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=pdf_bytes,
            ContentType="application/pdf"
        )
        
        # 6. Mark Completed
        report.storage_path = s3_key
        report.status = ReportStatusEnum.completed
        db.commit()
        
    except Exception as e:
        print(f"Report Generation Failed: {e}")
        db.rollback()
        report = db.query(Report).filter(Report.id == report_id).first()
        if report:
            report.status = ReportStatusEnum.failed
            db.commit()
    finally:
        db.close()
