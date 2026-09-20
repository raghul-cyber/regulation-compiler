import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Storage config
    S3_ENDPOINT_URL: str | None = None
    S3_ACCESS_KEY: str | None = None
    S3_SECRET_KEY: str | None = None
    S3_BUCKET_NAME: str | None = "regulations-storage"
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    
    # App-level config
    CLERK_SECRET_KEY: str | None = None
    CLERK_WEBHOOK_SECRET: str | None = None

    # Dodo Payments config
    DODO_PAYMENTS_API_KEY: str | None = None
    DODO_PAYMENTS_WEBHOOK_SECRET: str | None = None
    DODO_PAYMENTS_ENVIRONMENT: str = "test_mode"  # "test_mode" or "live_mode"
    DODO_PAYMENTS_RETURN_URL: str | None = None
    DODO_PAYMENTS_PRODUCT_ID: str | None = None

    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"), 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()
