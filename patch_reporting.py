import os

file_path = "apps/api/app/services/reporting.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_block = """            # (In a real app, upload to S3/GCS here)
            # For demonstration, we simulate an S3 presigned URL
            # s3_client.upload_file(file_path, bucket, key)
            # storage_url = s3_client.generate_presigned_url('get_object', Params={'Bucket': bucket, 'Key': key}, ExpiresIn=3600)
            
            # Using boto3 for real S3 signed URL:
            import boto3
            s3 = boto3.client('s3')
            bucket_name = "rac-reports-bucket"
            s3_key = f"reports/{report.regulation_id}/{report.id}.pdf"
            s3.upload_file(file_path, bucket_name, s3_key)
            
            storage_url = s3.generate_presigned_url('get_object',
                                                    Params={'Bucket': bucket_name,
                                                            'Key': s3_key},
                                                    ExpiresIn=3600)"""

new_block = """            import os
            if not os.environ.get("AWS_ACCESS_KEY_ID"):
                storage_url = f"mock-s3://local/{os.path.basename(file_path)}"
            else:
                import boto3
                s3 = boto3.client('s3')
                bucket_name = "rac-reports-bucket"
                s3_key = f"reports/{report.regulation_id}/{report.id}.pdf"
                s3.upload_file(file_path, bucket_name, s3_key)
                
                storage_url = s3.generate_presigned_url('get_object',
                                                        Params={'Bucket': bucket_name,
                                                                'Key': s3_key},
                                                        ExpiresIn=3600)"""

content = content.replace(old_block, new_block)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("reporting.py patched successfully")
