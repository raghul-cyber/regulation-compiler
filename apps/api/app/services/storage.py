import boto3
import uuid
import logging
import os
import shutil
from botocore.exceptions import ClientError
from typing import BinaryIO
from app.core.config import settings

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self.bucket_name = settings.S3_BUCKET_NAME
        self.local_storage_path = os.path.join(os.getcwd(), ".local_storage")
        os.makedirs(self.local_storage_path, exist_ok=True)
        
        # If we have real keys, configure the client. Otherwise fallback to local storage.
        self.use_local = not all([
            settings.S3_ACCESS_KEY,
            settings.S3_SECRET_KEY,
            self.bucket_name
        ])
        
        if not self.use_local:
            import botocore.config
            self.s3_client = boto3.client(
                's3',
                endpoint_url=settings.S3_ENDPOINT_URL,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
                region_name="eu-central-1",
                config=botocore.config.Config(
                    signature_version='s3v4',
                    connect_timeout=3,
                    read_timeout=6,
                    retries={'max_attempts': 1}
                )
            )
        else:
            logger.warning(f"StorageService running in LOCAL mode. Files will be saved to {self.local_storage_path}")
            self.s3_client = None

    def upload_file(self, file_obj: BinaryIO, file_name: str, content_type: str) -> str:
        """
        Uploads a file to S3 or local storage, with instantaneous local fallback on timeout or error.
        """
        ext = file_name.split('.')[-1] if '.' in file_name else 'bin'
        unique_id = uuid.uuid4()
        storage_path = f"regulations/{unique_id}.{ext}"

        # Read binary data once so it can be uploaded or fallback saved
        if hasattr(file_obj, 'seek'):
            file_obj.seek(0)
        data = file_obj.read() if hasattr(file_obj, 'read') else file_obj
        if isinstance(data, str):
            data = data.encode('utf-8')

        # 1. Save locally first to guarantee zero-latency in-process pipeline retrieval
        local_file_path = os.path.join(self.local_storage_path, storage_path)
        os.makedirs(os.path.dirname(local_file_path), exist_ok=True)
        try:
            with open(local_file_path, "wb") as f:
                f.write(data)
            logger.info(f"Cached file locally: {local_file_path} ({len(data)} bytes)")
        except Exception as e:
            logger.warning(f"Could not cache locally: {e}")

        # 2. Upload to S3 if configured
        if not self.use_local and self.s3_client:
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=storage_path,
                    Body=data,
                    ContentType=content_type
                )
                logger.info(f"S3 put_object successful: {storage_path} ({len(data)} bytes)")
            except Exception as e:
                logger.warning(f"S3 put_object encountered error ({e}). Using local cache.")

        return storage_path

    def get_file_bytes(self, storage_path: str) -> bytes:
        """
        Downloads a file from local storage or S3 and returns its content as bytes.
        """
        local_file_path = os.path.join(self.local_storage_path, storage_path)
        if os.path.exists(local_file_path):
            with open(local_file_path, "rb") as f:
                return f.read()

        if not self.use_local and self.s3_client:
            try:
                response = self.s3_client.get_object(
                    Bucket=self.bucket_name,
                    Key=storage_path
                )
                return response['Body'].read()
            except Exception as e:
                logger.error(f"Failed to download file from S3: {e}")

        if os.path.exists(local_file_path):
            with open(local_file_path, "rb") as f:
                return f.read()

        raise FileNotFoundError(f"File not found in storage: {storage_path}")

    def generate_presigned_url(self, storage_path: str, expiration: int = 3600) -> str:
        """
        Generates a presigned URL for downloading a file from S3.
        If using local storage, returns a file:// URI.
        """
        if self.use_local:
            return f"http://127.0.0.1:8080/api/v1/reports/download-by-path?path={storage_path}"
            
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': storage_path},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise Exception("URL generation failed") from e
