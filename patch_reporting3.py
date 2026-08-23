import re

file_path = "apps/api/app/services/reporting.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the s3 put_object block
old_pattern = r"s3\.put_object\([\s\S]*?ContentType=\"application/pdf\"\n\s*\)"
new_code = """import os
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
            storage_url = f"mock-s3://local/{s3_key}\""""

content = re.sub(old_pattern, new_code, content)

# Also we need to make sure we set report.storage_path = storage_url instead of hardcoding s3_key
# The old code doesn't set report.storage_path! Wait, let's see where it sets status.
