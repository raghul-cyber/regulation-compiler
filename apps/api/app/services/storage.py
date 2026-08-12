import boto3
import uuid
import logging
from botocore.exceptions import ClientError
from typing import BinaryIO
from app.core.config import settings

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self.bucket_name = settings.S3_BUCKET_NAME
        
        # If we have real keys, configure the client. Otherwise fallback to mock mode.
        self.mock_mode = not all([
            settings.S3_ACCESS_KEY,
            settings.S3_SECRET_KEY,
            self.bucket_name
        ])
        
        if not self.mock_mode:
            import botocore.config
            self.s3_client = boto3.client(
                's3',
                endpoint_url=settings.S3_ENDPOINT_URL,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
                region_name="eu-central-1",
                config=botocore.config.Config(signature_version='s3v4')
            )
        else:
            logger.warning("StorageService running in MOCK mode (missing credentials)")
            self.s3_client = None

    def upload_file(self, file_obj: BinaryIO, file_name: str, content_type: str) -> str:
        """
        Uploads a file to the S3 bucket and returns the generated storage path.
        """
        ext = file_name.split('.')[-1] if '.' in file_name else 'bin'
        unique_id = uuid.uuid4()
        storage_path = f"regulations/{unique_id}.{ext}"

        if self.mock_mode:
            logger.info(f"Mock upload successful: {storage_path}")
            return storage_path

        try:
            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                storage_path,
                ExtraArgs={"ContentType": content_type}
            )
            return storage_path
        except ClientError as e:
            logger.error(f"Failed to upload file to S3: {e}")
            raise Exception("Storage upload failed") from e
    def get_file_bytes(self, storage_path: str) -> bytes:
        """
        Downloads a file from the S3 bucket and returns its content as bytes.
        """
        if self.mock_mode:
            logger.info(f"Mock download successful: {storage_path}")
            return b"MOCK_PDF_CONTENT"
            
        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=storage_path
            )
            return response['Body'].read()
        except ClientError as e:
            logger.error(f"Failed to download file from S3: {e}")
            raise Exception("Storage download failed") from e
