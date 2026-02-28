"""
InstaTG Agent — Application Configuration

Loads all environment variables via Pydantic Settings.
All secrets are read from .env file in the backend root.
"""

from functools import lru_cache
import os
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the entire application."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    app_name: str = "InstaTG Agent"
    app_env: str = "development"
    debug: bool = False
    secret_key: str = "change-me-in-production"
    sentry_dsn: str = ""

    # --- Database ---
    database_url: str = ""
    database_echo: bool = False

    # --- Redis ---
    redis_url: str = "redis://localhost:6379/0"

    # --- Claude API ---
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-5-20250514"

    # --- OpenAI ---
    openai_api_key: str = ""
    whisper_model: str = "whisper-1"
    embedding_model: str = "text-embedding-3-small"

    # --- Alternative LLM Providers (optional) ---
    # Choose provider for text/embeddings: 'openai'|'openrouter'|'huggingface'
    llm_provider: str = "openai"
    openrouter_api_key: str = ""
    huggingface_api_key: str = ""

    # --- Pinecone ---
    pinecone_api_key: str = ""
    pinecone_index_name: str = "instatg-knowledge"
    pinecone_environment: str = "us-east-1"

    # --- Telegram ---
    telegram_api_id: int = 0
    telegram_api_hash: str = ""

    # --- Meta (Facebook/Instagram) ---
    meta_app_id: str = ""
    meta_app_secret: str = ""
    meta_verify_token: str = "instatg-verify-token"
    public_base_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"
    encryption_key: str = ""  # Fernet key for token encryption at rest
    graph_api_version: str = "v19.0"

    # --- AmoCRM ---
    amocrm_base_url: str = ""
    amocrm_client_id: str = ""
    amocrm_client_secret: str = ""
    amocrm_redirect_uri: str = ""
    amocrm_access_token: str = ""
    amocrm_refresh_token: str = ""

    # --- Celery ---
    celery_broker_url: str = "redis://localhost:6379/1"

    # --- Report Settings ---
    daily_report_hour: int = 9
    daily_report_timezone: str = "Asia/Tashkent"

    # --- Supabase Auth ---
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    @field_validator("database_url", mode="before")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        database_url = value or os.getenv("DATABASE_URL")
        if not database_url:
            raise RuntimeError("DATABASE_URL not set")
        if database_url.startswith("postgresql://"):
            database_url = database_url.replace(
                "postgresql://",
                "postgresql+asyncpg://",
                1,
            )
        return database_url

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance — call this everywhere."""
    return Settings()


settings = get_settings()
