"""
Meta Integration API Routes

Provides status, disconnect, assets, health, and connect-url endpoints
for Instagram and Facebook integrations per tenant.
"""

import structlog
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models import FacebookAccount, InstagramAccount, EventLog
from app.services import meta_oauth_service

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/integrations/meta", tags=["Meta Integration"])


@router.get("/connect-url")
async def get_connect_url(
    tenant_id: str = Query(...),
    provider: str = Query("all", description="instagram, facebook, or all"),
):
    """Generate the Meta OAuth authorization URL for the tenant."""
    result = meta_oauth_service.build_auth_url(tenant_id, provider)
    return {"url": result["url"]}


@router.get("/status")
async def get_meta_status(
    tenant_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Get current connection status for Instagram and Facebook."""
    # Facebook
    fb_q = await db.execute(
        select(FacebookAccount).where(
            FacebookAccount.tenant_id == tenant_id,
            FacebookAccount.is_active == True,
        )
    )
    fb_accounts = fb_q.scalars().all()

    # Instagram
    ig_q = await db.execute(
        select(InstagramAccount).where(
            InstagramAccount.tenant_id == tenant_id,
            InstagramAccount.is_active == True,
        )
    )
    ig_accounts = ig_q.scalars().all()

    # Last event
    last_event_q = await db.execute(
        select(EventLog.created_at)
        .where(EventLog.tenant_id == tenant_id)
        .order_by(EventLog.created_at.desc())
        .limit(1)
    )
    last_event = last_event_q.scalar_one_or_none()

    return {
        "facebook": {
            "connected": len(fb_accounts) > 0,
            "status": fb_accounts[0].connection_status if fb_accounts else "disconnected",
            "count": len(fb_accounts),
            "accounts": [
                {
                    "id": str(a.id),
                    "page_id": a.page_id,
                    "page_name": a.page_name,
                    "ig_username": a.ig_username,
                    "connection_status": a.connection_status,
                    "token_expires_at": a.token_expires_at.isoformat() if a.token_expires_at else None,
                    "granted_scopes": a.granted_scopes,
                    "last_webhook_at": a.last_webhook_at.isoformat() if a.last_webhook_at else None,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                }
                for a in fb_accounts
            ],
        },
        "instagram": {
            "connected": len(ig_accounts) > 0,
            "status": ig_accounts[0].connection_status if ig_accounts else "disconnected",
            "count": len(ig_accounts),
            "accounts": [
                {
                    "id": str(a.id),
                    "instagram_user_id": a.instagram_user_id,
                    "username": a.username,
                    "page_id": a.page_id,
                    "connection_status": a.connection_status,
                    "token_expires_at": a.token_expires_at.isoformat() if a.token_expires_at else None,
                    "granted_scopes": a.granted_scopes,
                    "last_webhook_at": a.last_webhook_at.isoformat() if a.last_webhook_at else None,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                }
                for a in ig_accounts
            ],
        },
        "last_event_at": last_event.isoformat() if last_event else None,
    }


@router.post("/disconnect")
async def disconnect_meta(
    tenant_id: str = Query(...),
    provider: str = Query("all", description="instagram, facebook, or all"),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect Instagram or Facebook integration for the tenant."""
    success = await meta_oauth_service.disconnect(db, tenant_id, provider)
    return {"status": "disconnected" if success else "error", "provider": provider}


@router.get("/assets")
async def get_meta_assets(
    tenant_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Get all connected pages and Instagram accounts."""
    fb_q = await db.execute(
        select(FacebookAccount).where(
            FacebookAccount.tenant_id == tenant_id,
            FacebookAccount.is_active == True,
        )
    )
    fb_accounts = fb_q.scalars().all()

    ig_q = await db.execute(
        select(InstagramAccount).where(
            InstagramAccount.tenant_id == tenant_id,
            InstagramAccount.is_active == True,
        )
    )
    ig_accounts = ig_q.scalars().all()

    return {
        "pages": [
            {"page_id": a.page_id, "page_name": a.page_name, "ig_username": a.ig_username}
            for a in fb_accounts
        ],
        "instagram_accounts": [
            {"instagram_user_id": a.instagram_user_id, "username": a.username, "page_id": a.page_id}
            for a in ig_accounts
        ],
    }


@router.get("/health")
async def check_meta_health(
    tenant_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Validate stored tokens are still working by calling Graph API."""
    result = await meta_oauth_service.health_check(db, tenant_id)
    return result
