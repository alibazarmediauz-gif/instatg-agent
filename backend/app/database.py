"""
InstaTG Agent — Database Engine & Session

Async SQLAlchemy engine and session factory.
Supports PostgreSQL (asyncpg) and SQLite (aiosqlite) for demo mode.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# Detect database type and configure engine accordingly
_is_sqlite = settings.database_url.startswith("sqlite")

if _is_sqlite:
    # SQLite — no pool settings, enable check_same_thread=False
    engine = create_async_engine(
        settings.database_url,
        echo=settings.database_echo,
        connect_args={"check_same_thread": False},
    )
else:
    # PostgreSQL — full pool configuration
    engine = create_async_engine(
        settings.database_url,
        echo=settings.database_echo,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
    )

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency — yields a database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables on startup (dev convenience)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Dispose engine on shutdown."""
    await engine.dispose()
