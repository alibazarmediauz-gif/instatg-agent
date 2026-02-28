"""
Meta Integration API Routes — Production

Full Meta (Instagram + Facebook) integration endpoints:
- GET  /connect      → redirect to Meta OAuth
- GET  /callback     → handle OAuth return, store tokens
- GET  /status       → connection status per tenant
- POST /disconnect   → unlink Meta
- GET  /assets       → connected pages + IG accounts
- GET  /health       → validate tokens via Graph API
"""

import structlog
from fastapi import APIRouter, Depends, Query, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.config import settings
from app.models import FacebookAccount, InstagramAccount, EventLog
from app.services import meta_oauth_service

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/integrations/meta", tags=["Meta Integration"])


# ─── OAuth Connect ─────────────────────────────────────────
@router.get("/connect")
async def meta_connect(
    tenant_id: str = Query(...),
    provider: str = Query("all", description="instagram, facebook, or all"),
):
    """
    Start Meta OAuth flow.
    Redirects the user to Facebook Login with correct scopes.
    """
    result = meta_oauth_service.build_auth_url(tenant_id, provider)
    return RedirectResponse(url=result["url"])


@router.get("/connect-url")
async def get_connect_url(
    tenant_id: str = Query(...),
    provider: str = Query("all"),
):
    """Return the OAuth URL (JSON) instead of redirect — for frontend SPA use."""
    result = meta_oauth_service.build_auth_url(tenant_id, provider)
    return {"url": result["url"]}


# ─── OAuth Callback ────────────────────────────────────────
@router.get("/callback")
async def meta_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle OAuth callback from Meta.
    Verifies signed state, exchanges code for tokens, stores connection.
    Redirects to frontend with success/error param.
    """
    frontend = settings.frontend_url.rstrip("/")

    # 1. Verify signed state
    try:
        state_data = meta_oauth_service.verify_state(state)
        tenant_id = state_data["tenant_id"]
        provider = state_data["provider"]
    except ValueError as e:
        logger.error("meta_callback_invalid_state", error=str(e))
        return RedirectResponse(url=f"{frontend}/integrations?error=invalid_state")

    try:
        # 2. Exchange code for long-lived token
        token_data = await meta_oauth_service.exchange_code_for_token(code)

        # 3. Fetch connected assets (Pages + IG Business accounts)
        assets = await meta_oauth_service.fetch_connected_assets(token_data["access_token"])

        # 4. Store everything in DB (with encryption) and register channel handlers
        stored = await meta_oauth_service.store_connection(db, tenant_id, token_data, assets)

        logger.info(
            "meta_oauth_success",
            tenant=tenant_id,
            fb_pages=stored["facebook"],
            ig_accounts=stored["instagram"],
        )

        # Build connected param for toast
        connected_parts = []
        if stored["facebook"] > 0:
            connected_parts.append("facebook")
        if stored["instagram"] > 0:
            connected_parts.append("instagram")
        connected_param = ",".join(connected_parts) if connected_parts else "meta"

        return RedirectResponse(
            url=f"{frontend}/integrations?connected={connected_param}"
        )

    except Exception as e:
        logger.error("meta_callback_error", error=str(e), tenant=tenant_id)
        return RedirectResponse(
            url=f"{frontend}/integrations?error=connection_failed"
        )


# ─── Status ────────────────────────────────────────────────
@router.get("/status")
async def get_meta_status(
    tenant_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Get current connection status for Instagram and Facebook."""
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


# ─── Disconnect ────────────────────────────────────────────
@router.post("/disconnect")
async def disconnect_meta(
    tenant_id: str = Query(...),
    provider: str = Query("all"),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect Instagram or Facebook integration for the tenant."""
    success = await meta_oauth_service.disconnect(db, tenant_id, provider)
    return {"status": "disconnected" if success else "error", "provider": provider}


# ─── Assets ────────────────────────────────────────────────
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


# ─── Health ────────────────────────────────────────────────
@router.get("/health")
async def check_meta_health(
    tenant_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Validate stored tokens are still working by calling Graph API."""
    result = await meta_oauth_service.health_check(db, tenant_id)
    return result
