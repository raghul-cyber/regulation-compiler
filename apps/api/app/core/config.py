import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Storage config
    S3_ENDPOINT_URL: str | None = None
    S3_ACCESS_KEY: str | None = None
    S3_SECRET_KEY: str | None = None
    S3_BUCKET_NAME: str | None = "regulations-storage"
    
    # App-level config
    CLERK_SECRET_KEY: str | None = None
    CLERK_WEBHOOK_SECRET: str | None = None

    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"), 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()
