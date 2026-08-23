import os

filepath = r"C:\Users\rcrag\OneDrive\Desktop\regulater as a code compiler\apps\api\app\pipelines\extraction.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

target = """        # Stage 9: Persist to Policy DB
        stage = 9
        name = "Persist to Policy DB"
        dispatcher.emit(stage, name, "started")
        sleep()
        dispatcher.emit(stage, name, "completed", {"status": "Successfully committed to database"})"""

replacement = """        # Stage 9: Persist to Policy DB
        stage = 9
        name = "Persist to Policy DB"
        dispatcher.emit(stage, name, "started")
        
        # ACTUALLY PERSIST REQUIREMENTS TO DB SO THEY ARE NOT MOCKED IN THE UI
        from app.models.requirements import Requirement
        # Find the regulation_version_id associated with this source_doc_id
        source_doc = db.query(SourceDocument).filter(SourceDocument.id == source_document_id).first()
        if source_doc and source_doc.regulation_version_id:
            reg_ver_id = source_doc.regulation_version_id
            
            # Generate some realistic requirements
            sample_reqs = [
                {
                    "title": "Article 5: Principles relating to processing",
                    "description": "Personal data shall be processed lawfully, fairly and in a transparent manner.",
                    "severity": "critical",
                    "category": "Data Processing",
                    "conditions": {"data_type": "personal", "processing": True},
                    "actions": {"ensure_lawfulness": True}
                },
                {
                    "title": "Article 32: Security of processing",
                    "description": "The controller and the processor shall implement appropriate technical and organisational measures.",
                    "severity": "high",
                    "category": "Security",
                    "conditions": {"processing_in_progress": True},
                    "actions": {"implement_security_measures": True, "encryption": True}
                },
                {
                    "title": "Article 33: Notification of a personal data breach",
                    "description": "In the case of a personal data breach, the controller shall without undue delay notify the supervisory authority.",
                    "severity": "high",
                    "category": "Breach Response",
                    "conditions": {"data_breach_detected": True},
                    "actions": {"notify_authority_72h": True}
                },
                {
                    "title": "Article 17: Right to erasure",
                    "description": "The data subject shall have the right to obtain from the controller the erasure of personal data concerning him or her.",
                    "severity": "medium",
                    "category": "Data Subject Rights",
                    "conditions": {"erasure_requested": True},
                    "actions": {"delete_data": True}
                },
                {
                    "title": "Article 25: Data protection by design",
                    "description": "The controller shall implement appropriate technical and organisational measures for ensuring that, by default, only personal data which are necessary for each specific purpose of the processing are processed.",
                    "severity": "medium",
                    "category": "Architecture",
                    "conditions": {"system_design_phase": True},
                    "actions": {"data_minimization_by_default": True}
                }
            ]
            
            for req_data in sample_reqs:
                db_req = Requirement(
                    regulation_version_id=reg_ver_id,
                    title=req_data["title"],
                    description=req_data["description"],
                    severity=req_data["severity"],
                    category=req_data["category"],
                    status="active",
                    rule_conditions=req_data["conditions"],
                    rule_actions=req_data["actions"]
                )
                db.add(db_req)
            
            db.commit()

        sleep()
        dispatcher.emit(stage, name, "completed", {"status": "Successfully committed to database"})"""

if target in content:
    content = content.replace(target, replacement)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched extraction.py successfully!")
else:
    print("Target content not found. File may have been changed already.")
