import os

tasks_path = r"apps\api\app\workers\tasks.py"
with open(tasks_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the 18 stages fake dispatch from Phase 1 with clean execution
start_str = 'update_job_status(db, uuid.UUID(job_id), JobStatusEnum.processing, {"stage": 3, "stage_name": "Queue Ingestion Job"})'
end_str = 'update_job_status(db, uuid.UUID(job_id), JobStatusEnum.completed, {"message": "Pipeline completed successfully"})'

# We'll just replace the whole block by finding index of start_str and end_str
if start_str in content and end_str in content:
    start_idx = content.find(start_str)
    end_idx = content.find(end_str) + len(end_str)
    
    new_block = """
        run_extraction_pipeline(db, uuid.UUID(source_doc_id), job_id)
        update_job_status(db, uuid.UUID(job_id), JobStatusEnum.completed, {"message": "Pipeline completed successfully"})
"""
    new_content = content[:start_idx] + new_block.strip() + content[end_idx:]
    with open(tasks_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Tasks patched")
else:
    print("Could not find blocks to patch. Please review file manually.")
