"""
InstaTG Agent — Database Engine & Session

Async SQLAlchemy engine and session factory for PostgreSQL on Railway.
"""

import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set")

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+asyncpg://",
        1,
    )

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Backwards-compatible alias used in existing imports.
async_session_factory = AsyncSessionLocal

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables on startup and add any missing columns."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # ── Safe column migration (idempotent) ──────────────────────
        # create_all doesn't ALTER existing tables to add new columns.
        # These statements safely add them if they don't exist yet.
        migrations = [
            # instagram_accounts — ALL columns that may be missing
            "ALTER TABLE instagram_accounts ADD COLUMN IF NOT EXISTS username VARCHAR(255)",
            "ALTER TABLE instagram_accounts ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ",
            "ALTER TABLE instagram_accounts ADD COLUMN IF NOT EXISTS granted_scopes JSONB",
            "ALTER TABLE instagram_accounts ADD COLUMN IF NOT EXISTS connection_status VARCHAR(50) DEFAULT 'connected'",
            "ALTER TABLE instagram_accounts ADD COLUMN IF NOT EXISTS last_webhook_at TIMESTAMPTZ",
            "ALTER TABLE instagram_accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()",
            "ALTER TABLE instagram_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()",
            # facebook_accounts — ALL columns that may be missing
            "ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS page_name VARCHAR(255)",
            "ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ",
            "ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS granted_scopes JSONB",
            "ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS connection_status VARCHAR(50) DEFAULT 'connected'",
            "ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS instagram_business_id VARCHAR(100)",
            "ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS ig_username VARCHAR(255)",
            "ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS last_webhook_at TIMESTAMPTZ",
            "ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()",
            "ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()",
            # event_logs — ALL columns
            "ALTER TABLE event_logs ADD COLUMN IF NOT EXISTS page_id VARCHAR(100)",
            "ALTER TABLE event_logs ADD COLUMN IF NOT EXISTS sender_id VARCHAR(100)",
            "ALTER TABLE event_logs ADD COLUMN IF NOT EXISTS ig_user_id VARCHAR(100)",
            "ALTER TABLE event_logs ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE",
            "ALTER TABLE event_logs ADD COLUMN IF NOT EXISTS error_message TEXT",
            "ALTER TABLE event_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()",
        ]
        from sqlalchemy import text
        for sql in migrations:
            try:
                await conn.execute(text(sql))
            except Exception:
                pass  # Column already exists or table doesn't exist yet


async def close_db() -> None:
    """Dispose engine on shutdown."""
    await engine.dispose()
