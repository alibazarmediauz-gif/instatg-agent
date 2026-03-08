"""
InstaTG Agent — Database Engine & Session

Async SQLAlchemy engine and session factory for PostgreSQL on Railway.
"""

import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.config import settings

DATABASE_URL = settings.database_url

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
    from sqlalchemy import inspect, text
    import app.models  # Ensure models are registered with Base.metadata

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def get_columns(table_name):
            # Inspector doesn't work directly with async connection in all versions
            # So we use a sync helper via run_sync if needed, or simple PRAGMA/query
            pass

        # ── Safe column migration (idempotent) ──────────────────────
        # We manually check for column existence before adding.
        
        async def add_column_if_missing(table, column, type_definition):
            try:
                # Dialect-specific check
                if engine.dialect.name == "sqlite":
                    check_sql = f"PRAGMA table_info({table})"
                    res = await conn.execute(text(check_sql))
                    columns = [row[1] for row in res.fetchall()]
                else:
                    # PostgreSQL / Generic
                    check_sql = f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}' AND column_name='{column}'"
                    res = await conn.execute(text(check_sql))
                    columns = [row[0] for row in res.fetchall()]
                
                if column not in columns:
                    await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {type_definition}"))
                    print(f"Added column {column} to {table}")
            except Exception as e:
                print(f"Migration error for {table}.{column}: {e}")

        # Define migrations: (table, column, type)
        migrations = [
            # telegram_accounts
            ("telegram_accounts", "telegram_user_id", "VARCHAR(100)"),
            ("telegram_accounts", "access_token", "TEXT"),
            ("telegram_accounts", "username", "VARCHAR(255)"),
            
            # instagram_accounts
            ("instagram_accounts", "username", "VARCHAR(255)"),
            ("instagram_accounts", "token_expires_at", "TIMESTAMPTZ" if engine.dialect.name != "sqlite" else "DATETIME"),
            ("instagram_accounts", "granted_scopes", "JSONB" if engine.dialect.name != "sqlite" else "JSON"),
            ("instagram_accounts", "connection_status", "VARCHAR(50) DEFAULT 'connected'"),
            ("instagram_accounts", "last_webhook_at", "TIMESTAMPTZ" if engine.dialect.name != "sqlite" else "DATETIME"),
            ("instagram_accounts", "created_at", "TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP" if engine.dialect.name != "sqlite" else "DATETIME DEFAULT CURRENT_TIMESTAMP"),
            ("instagram_accounts", "updated_at", "TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP" if engine.dialect.name != "sqlite" else "DATETIME DEFAULT CURRENT_TIMESTAMP"),
            
            # facebook_accounts
            ("facebook_accounts", "page_name", "VARCHAR(255)"),
            ("facebook_accounts", "token_expires_at", "TIMESTAMPTZ" if engine.dialect.name != "sqlite" else "DATETIME"),
            ("facebook_accounts", "granted_scopes", "JSONB" if engine.dialect.name != "sqlite" else "JSON"),
            ("facebook_accounts", "connection_status", "VARCHAR(50) DEFAULT 'connected'"),
            ("facebook_accounts", "instagram_business_id", "VARCHAR(100)"),
            ("facebook_accounts", "ig_username", "VARCHAR(255)"),
            ("facebook_accounts", "last_webhook_at", "TIMESTAMPTZ" if engine.dialect.name != "sqlite" else "DATETIME"),
            ("facebook_accounts", "created_at", "TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP" if engine.dialect.name != "sqlite" else "DATETIME DEFAULT CURRENT_TIMESTAMP"),
            ("facebook_accounts", "updated_at", "TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP" if engine.dialect.name != "sqlite" else "DATETIME DEFAULT CURRENT_TIMESTAMP"),
            
            # event_logs
            ("event_logs", "page_id", "VARCHAR(100)"),
            ("event_logs", "sender_id", "VARCHAR(100)"),
            ("event_logs", "ig_user_id", "VARCHAR(100)"),
            ("event_logs", "processed", "BOOLEAN DEFAULT FALSE"),
            ("event_logs", "error_message", "TEXT"),
            ("event_logs", "created_at", "TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP" if engine.dialect.name != "sqlite" else "DATETIME DEFAULT CURRENT_TIMESTAMP"),

            # campaigns
            ("campaigns", "connected", "INTEGER DEFAULT 0"),
        ]

        # SQLite does not support ALTER COLUMN well, so we skip the phone_number DROP NOT NULL for SQLite
        if engine.dialect.name != "sqlite":
             try:
                 await conn.execute(text("ALTER TABLE telegram_accounts ALTER COLUMN phone_number DROP NOT NULL"))
             except Exception:
                 pass

        for table, col, type_def in migrations:
            await add_column_if_missing(table, col, type_def)


async def close_db() -> None:
    """Dispose engine on shutdown."""
    await engine.dispose()
