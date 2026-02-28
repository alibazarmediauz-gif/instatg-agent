"""
Facebook Auth Routes (Meta OAuth)

Handles the OAuth login redirect and callback for connecting
Facebook Pages and Instagram Business accounts.
Uses meta_oauth_service for the core logic.
"""

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings
from app.services import meta_oauth_service

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/facebook-auth", tags=["Facebook Auth"])


@router.get("/login")
async def facebook_login(
    tenant_id: str = Query(...),
    provider: str = Query("all", description="instagram, facebook, or all"),
):
    """
    Start the Meta OAuth flow.
    Builds the authorization URL and redirects the user to Facebook Login.
    """
    result = meta_oauth_service.build_auth_url(tenant_id, provider)
    return RedirectResponse(url=result["url"])


@router.get("/callback")
async def facebook_callback(
    code: str = Query(..., description="Authorization code from Facebook"),
    state: str = Query(..., description="State param: tenant_id:csrf:provider"),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle the OAuth callback from Meta.
    Exchanges code for token, fetches pages + IG accounts, and stores them.
    """
    # Parse state: "tenant_id:csrf:provider"
    try:
        parts = state.split(":", 2)
        tenant_id = parts[0]
        provider = parts[2] if len(parts) > 2 else "all"
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    try:
        # 1. Exchange code for long-lived token
        token_data = await meta_oauth_service.exchange_code_for_token(code)

        # 2. Fetch connected assets (Pages + IG Business accounts)
        assets = await meta_oauth_service.fetch_connected_assets(token_data["access_token"])

        # 3. Store everything in DB and register in channel handlers
        stored = await meta_oauth_service.store_connection(db, tenant_id, token_data, assets)

        logger.info(
            "meta_oauth_success",
            tenant=tenant_id,
            fb_pages=stored["facebook"],
            ig_accounts=stored["instagram"],
        )

        # Determine which provider was actually connected for toast
        connected = []
        if stored["facebook"] > 0:
            connected.append("facebook")
        if stored["instagram"] > 0:
            connected.append("instagram")

        connected_param = ",".join(connected) if connected else provider

        # Build frontend redirect URL
        frontend_url = settings.public_base_url.replace(":8000", ":3000")
        if "localhost" not in frontend_url and "127.0.0.1" not in frontend_url:
            # In production, use frontend URL directly
            frontend_url = frontend_url.replace("/api", "")

        return RedirectResponse(
            url=f"{frontend_url}/integrations?connected={connected_param}"
        )

    except Exception as e:
        logger.error("meta_oauth_callback_error", error=str(e), tenant=tenant_id)
        frontend_url = settings.public_base_url.replace(":8000", ":3000")
        return RedirectResponse(
            url=f"{frontend_url}/integrations?error=connection_failed"
        )


@router.get("/status")
async def get_facebook_status(
    tenant_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Check if tenant has connected Facebook Pages (backwards compatible)."""
    from sqlalchemy import select
    from app.models import FacebookAccount

    query = select(FacebookAccount).where(
        FacebookAccount.tenant_id == tenant_id,
        FacebookAccount.is_active == True,
    )
    result = await db.execute(query)
    accounts = result.scalars().all()

    return {
        "connected": len(accounts) > 0,
        "accounts": [{"id": p.page_id, "name": p.page_name} for p in accounts],
    }
