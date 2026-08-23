import os

file_path = "apps/api/app/services/reporting.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_block = """        # 5. Upload to S3
        if dispatcher: dispatcher.emit(5, "Secure Storage Upload", "started")
        s3_key = f"reports/{report.org_id}/{report.regulation_id}/{report.id}.pdf"
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=pdf_bytes,
            ContentType="application/pdf"
        )
        time.sleep(1)
        if dispatcher: dispatcher.emit(5, "Secure Storage Upload", "completed", {"path": s3_key})"""

new_block = """        # 5. Upload to S3 (Mocked for testing)
        if dispatcher: dispatcher.emit(5, "Secure Storage Upload", "started")
        s3_key = f"reports/{report.org_id}/{report.regulation_id}/{report.id}.pdf"
        
        if os.environ.get("AWS_ACCESS_KEY_ID"):
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=pdf_bytes,
                ContentType="application/pdf"
            )
            storage_url = s3.generate_presigned_url('get_object',
                                                    Params={'Bucket': BUCKET_NAME,
                                                            'Key': s3_key},
                                                    ExpiresIn=3600)
        else:
            # Mock upload
            storage_url = f"mock-s3://local/{s3_key}"
            
        report.storage_path = storage_url
        time.sleep(1)
        if dispatcher: dispatcher.emit(5, "Secure Storage Upload", "completed", {"path": s3_key})"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("reporting.py patched successfully")
else:
    print("Failed to find block in reporting.py")
