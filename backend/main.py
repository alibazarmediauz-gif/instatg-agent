"""
InstaTG Agent — FastAPI Application Entry Point

Initializes the application, registers routes, starts Telegram clients,
and manages database lifecycle.
"""

import structlog
from app.core.logging_config import setup_logging
from contextlib import asynccontextmanager

# Initialize structured logging
setup_logging()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        integrations=[FastApiIntegration(), SqlalchemyIntegration()],
        traces_sample_rate=1.0 if not settings.is_production else 0.1,
    )
from app.database import init_db, close_db
from app.memory.context import memory

# Import route routers
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.conversations import router as conversations_router
from app.api.routes.voice_analysis import router as voice_analysis_router
from app.api.routes.knowledge_base import router as kb_router
from app.api.routes.reports import router as reports_router
from app.api.routes.settings import router as settings_router
from app.api.routes.auth import router as auth_router
from app.api.routes.integrations import router as integrations_router
from app.channels.instagram import router as instagram_webhook_router
from app.channels.facebook import router as facebook_webhook_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.facebook_auth import router as facebook_auth_router
from app.api.routes.meta_webhooks import router as meta_webhooks_router
from app.api.routes.leads import router as leads_router
from app.api.routes.prompts import router as prompts_router
from app.api.routes.payments import router as payments_router
from app.api.routes.qa import router as qa_router

# SaaS AI Agents & Campaign Routes
from app.api.routes.agents import router as agents_router
from app.api.routes.campaigns import router as campaigns_router
from app.api.routes.ivr import router as ivr_router
from app.api.routes.billing import router as billing_router
from app.api.websockets import router as websockets_router
# analytics router previously provided a `/dashboard` endpoint that duplicated
# `/api/dashboard/stats`.  That route is now deprecated and removed, so the
# analytics router is no longer mounted by default.  Keeping the import here
# in case new analytics endpoints are added later.
from app.api.routes.analytics import router as analytics_router
from app.api.routes.telegram_webhooks import router as telegram_webhooks_router
from app.api.routes.quality_monitoring import router as quality_monitoring_router

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown."""
    logger.info("application_starting", app_name=settings.app_name, env=settings.app_env)

    # 1. Initialize database tables
    await init_db()
    logger.info("database_initialized")

    # 2. Connect Redis
    await memory.connect()

    # 3. Start Telegram clients for all active accounts
    await _start_telegram_clients()

    # 4. Register Instagram accounts for webhook handling
    await _register_instagram_accounts()

    # 5. Register Facebook accounts for webhook handling
    await _register_facebook_accounts()

    logger.info("application_ready", app_name=settings.app_name)

    yield

    # Shutdown
    logger.info("application_shutting_down")

    # Stop Telegram clients
    from app.channels.telegram import active_clients, stop_telegram_client
    for tenant_id in list(active_clients.keys()):
        await stop_telegram_client(tenant_id)

    # Close Redis
    await memory.close()

    # Close database
    await close_db()

    logger.info("application_stopped")


async def _start_telegram_clients():
    """Start Telegram client for each tenant that has an active dedicated business account."""
    try:
        from app.database import async_session_factory
        from app.models import TelegramAccount, Tenant
        from app.channels.telegram import create_telegram_client
        from sqlalchemy import select

        async with async_session_factory() as db:
            result = await db.execute(
                select(TelegramAccount, Tenant.name)
                .join(Tenant, TelegramAccount.tenant_id == Tenant.id)
                .where(TelegramAccount.is_active == True)
                .where(TelegramAccount.encrypted_session_string.isnot(None))
            )

            for row in result.all():
                account = row[0]
                business_name = row[1]
                try:
                    await create_telegram_client(
                        tenant_id=str(account.tenant_id),
                        encrypted_session=account.encrypted_session_string,
                        phone_number=account.phone_number,
                        display_name=business_name,
                    )
                except Exception as e:
                    logger.error(
                        "telegram_client_start_failed",
                        tenant=str(account.tenant_id),
                        phone=account.phone_number,
                        error=str(e),
                    )

    except Exception as e:
        logger.warning("telegram_startup_skipped", reason=str(e))


async def _register_instagram_accounts():
    """Register all active Instagram accounts for webhook handling."""
    try:
        from app.database import async_session_factory
        from app.models import InstagramAccount, Tenant
        from app.channels.instagram import register_instagram_account
        from sqlalchemy import select

        async with async_session_factory() as db:
            result = await db.execute(
                select(InstagramAccount, Tenant.name)
                .join(Tenant, InstagramAccount.tenant_id == Tenant.id)
                .where(InstagramAccount.is_active == True)
            )

            for row in result.all():
                account = row[0]
                business_name = row[1]
                register_instagram_account(
                    instagram_user_id=account.instagram_user_id,
                    tenant_id=str(account.tenant_id),
                    access_token=account.access_token,
                    page_id=account.page_id,
                    display_name=business_name,
                )

    except Exception as e:
        logger.warning("instagram_startup_skipped", reason=str(e))


async def _register_facebook_accounts():
    """Register all active Facebook accounts for webhook handling."""
    try:
        from app.database import async_session_factory
        from app.models import FacebookAccount, Tenant
        from app.channels.facebook import register_facebook_account
        from sqlalchemy import select

        async with async_session_factory() as db:
            result = await db.execute(
                select(FacebookAccount, Tenant.name)
                .join(Tenant, FacebookAccount.tenant_id == Tenant.id)
                .where(FacebookAccount.is_active == True)
            )

            for row in result.all():
                account = row[0]
                business_name = row[1]
                register_facebook_account(
                    page_id=account.page_id,
                    tenant_id=str(account.tenant_id),
                    access_token=account.access_token,
                    page_name=account.page_name or business_name,
                )

    except Exception as e:
        logger.warning("facebook_startup_skipped", reason=str(e))


# ─── Create FastAPI App ──────────────────────────────────────────────

app = FastAPI(
    title="InstaTG Agent API",
    description="AI-powered sales automation platform for Telegram and Instagram",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(conversations_router)
app.include_router(voice_analysis_router)
app.include_router(kb_router)
app.include_router(reports_router)
app.include_router(settings_router)
app.include_router(integrations_router)
app.include_router(instagram_webhook_router)
app.include_router(facebook_webhook_router)
app.include_router(notifications_router)
app.include_router(facebook_auth_router)
app.include_router(meta_webhooks_router)

# SaaS Extensions
app.include_router(leads_router)
app.include_router(prompts_router)
app.include_router(payments_router)
app.include_router(qa_router)
app.include_router(agents_router)
app.include_router(campaigns_router)
app.include_router(ivr_router)
app.include_router(billing_router)
app.include_router(websockets_router)
# analytics router deliberately not registered; dashboard stats live under
# /api/dashboard/stats and the old analytics.dashboard endpoint is gone.
app.include_router(telegram_webhooks_router)
app.include_router(quality_monitoring_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "status": "running",
        "env": settings.app_env,
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    health_status = {"api": "ok", "redis": "unknown", "database": "unknown"}

    # Check Redis
    try:
        await memory.redis.ping()
        health_status["redis"] = "ok"
    except Exception:
        health_status["redis"] = "error"

    # Check Database
    try:
        from app.database import async_session_factory
        from sqlalchemy import text
        async with async_session_factory() as db:
            await db.execute(text("SELECT 1"))
            health_status["database"] = "ok"
    except Exception:
        health_status["database"] = "error"

    # Check Celery Workers via inspecting registered tasks
    try:
        from celery_worker import celery_app
        inspector = celery_app.control.inspect()
        ping_res = inspector.ping()
        health_status["celery"] = "ok" if ping_res else "timeout"
    except Exception:
        health_status["celery"] = "error"

    return health_status
