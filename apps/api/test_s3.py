import os
import boto3
from botocore.client import Config
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

s3_client = boto3.client(
    's3',
    endpoint_url="https://szywxetqogjlfydrktip.supabase.co/storage/v1/s3",
    aws_access_key_id=os.environ.get("S3_ACCESS_KEY"),
    aws_secret_access_key=os.environ.get("S3_SECRET_KEY"),
    region_name="eu-central-1",
    config=Config(signature_version='s3v4')
)

bucket = os.environ.get("S3_BUCKET_NAME")
print(f"Testing S3 connection to bucket: {bucket}")
print(f"Endpoint: {os.environ.get('S3_ENDPOINT_URL')}")

try:
    response = s3_client.list_objects_v2(Bucket=bucket)
    print("SUCCESS! Can connect and list objects.")
except Exception as e:
    import traceback
    traceback.print_exc()
