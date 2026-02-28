"""
Meta OAuth Service

Handles the full Meta (Facebook/Instagram) OAuth lifecycle:
- Building authorization URLs with correct scopes
- Exchanging authorization codes for long-lived tokens
- Fetching connected assets (Pages + IG Business accounts)
- Storing connections per tenant
- Disconnecting and health checks
"""

import secrets
import httpx
import structlog
from typing import Optional
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models import FacebookAccount, InstagramAccount

logger = structlog.get_logger(__name__)

GRAPH_API_URL = f"https://graph.facebook.com/{settings.graph_api_version}"

# ─── Scopes ──────────────────────────────────────────────
INSTAGRAM_SCOPES = [
    "instagram_business_basic",
    "instagram_business_manage_messages",
    "instagram_business_manage_comments",
]

FACEBOOK_SCOPES = [
    "pages_show_list",
    "pages_manage_metadata",
    "pages_messaging",
    "pages_read_engagement",
]

ALL_SCOPES = INSTAGRAM_SCOPES + FACEBOOK_SCOPES


def build_auth_url(tenant_id: str, provider: str = "all") -> dict:
    """
    Build the Meta OAuth authorization URL.
    Returns the URL and a CSRF state token.
    """
    csrf = secrets.token_urlsafe(16)
    state = f"{tenant_id}:{csrf}:{provider}"

    if provider == "instagram":
        scopes = INSTAGRAM_SCOPES + ["pages_show_list"]
    elif provider == "facebook":
        scopes = FACEBOOK_SCOPES
    else:
        scopes = ALL_SCOPES

    redirect_uri = f"{settings.public_base_url}/api/facebook-auth/callback"

    url = (
        f"https://www.facebook.com/{settings.graph_api_version}/dialog/oauth?"
        f"client_id={settings.meta_app_id}&"
        f"redirect_uri={redirect_uri}&"
        f"scope={','.join(scopes)}&"
        f"state={state}"
    )

    return {"url": url, "state": state, "csrf": csrf}


async def exchange_code_for_token(code: str) -> dict:
    """Exchange authorization code for a long-lived access token."""
    redirect_uri = f"{settings.public_base_url}/api/facebook-auth/callback"

    async with httpx.AsyncClient(timeout=30) as client:
        # Step 1: Exchange code for short-lived token
        token_res = await client.get(
            f"{GRAPH_API_URL}/oauth/access_token",
            params={
                "client_id": settings.meta_app_id,
                "client_secret": settings.meta_app_secret,
                "redirect_uri": redirect_uri,
                "code": code,
            },
        )
        if token_res.status_code != 200:
            logger.error("meta_oauth_code_exchange_failed", body=token_res.text)
            raise ValueError(f"Failed to exchange code: {token_res.text}")

        short_token = token_res.json().get("access_token")

        # Step 2: Exchange for long-lived token
        ll_res = await client.get(
            f"{GRAPH_API_URL}/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": settings.meta_app_id,
                "client_secret": settings.meta_app_secret,
                "fb_exchange_token": short_token,
            },
        )

        if ll_res.status_code == 200:
            ll_data = ll_res.json()
            access_token = ll_data.get("access_token", short_token)
            expires_in = ll_data.get("expires_in", 5184000)  # default 60 days
        else:
            access_token = short_token
            expires_in = 3600

        # Step 3: Fetch granted scopes
        debug_res = await client.get(
            f"{GRAPH_API_URL}/debug_token",
            params={
                "input_token": access_token,
                "access_token": f"{settings.meta_app_id}|{settings.meta_app_secret}",
            },
        )
        granted_scopes = []
        if debug_res.status_code == 200:
            data = debug_res.json().get("data", {})
            granted_scopes = data.get("scopes", [])

        return {
            "access_token": access_token,
            "expires_in": expires_in,
            "expires_at": datetime.utcnow() + timedelta(seconds=expires_in),
            "granted_scopes": granted_scopes,
        }


async def fetch_connected_assets(access_token: str) -> dict:
    """Fetch user's Facebook Pages and linked Instagram Business accounts."""
    async with httpx.AsyncClient(timeout=30) as client:
        # Fetch Pages with instagram_business_account expanded
        pages_res = await client.get(
            f"{GRAPH_API_URL}/me/accounts",
            params={
                "fields": "id,name,access_token,instagram_business_account{id,username}",
                "access_token": access_token,
            },
        )

        if pages_res.status_code != 200:
            logger.error("meta_fetch_assets_failed", body=pages_res.text)
            raise ValueError("Failed to fetch pages from Meta")

        pages = pages_res.json().get("data", [])

        result = {"pages": [], "instagram_accounts": []}

        for page in pages:
            page_info = {
                "page_id": page["id"],
                "page_name": page.get("name", ""),
                "page_access_token": page.get("access_token", ""),
            }
            result["pages"].append(page_info)

            ig_account = page.get("instagram_business_account")
            if ig_account:
                result["instagram_accounts"].append({
                    "instagram_user_id": ig_account["id"],
                    "ig_username": ig_account.get("username", ""),
                    "page_id": page["id"],
                    "page_access_token": page.get("access_token", ""),
                })

        return result


async def store_connection(
    db: AsyncSession,
    tenant_id: str,
    token_data: dict,
    assets: dict,
) -> dict:
    """Store Facebook Pages and Instagram accounts to the database."""
    stored = {"facebook": 0, "instagram": 0}

    for page in assets.get("pages", []):
        page_id = page["page_id"]
        q = await db.execute(select(FacebookAccount).where(FacebookAccount.page_id == page_id))
        existing = q.scalar_one_or_none()

        if existing:
            existing.access_token = page["page_access_token"]
            existing.page_name = page["page_name"]
            existing.is_active = True
            existing.connection_status = "connected"
            existing.token_expires_at = token_data.get("expires_at")
            existing.granted_scopes = token_data.get("granted_scopes")
            existing.tenant_id = tenant_id
        else:
            fb_account = FacebookAccount(
                tenant_id=tenant_id,
                page_id=page_id,
                access_token=page["page_access_token"],
                page_name=page["page_name"],
                is_active=True,
                connection_status="connected",
                token_expires_at=token_data.get("expires_at"),
                granted_scopes=token_data.get("granted_scopes"),
            )
            db.add(fb_account)
        stored["facebook"] += 1

    for ig in assets.get("instagram_accounts", []):
        ig_user_id = ig["instagram_user_id"]
        q = await db.execute(
            select(InstagramAccount).where(InstagramAccount.instagram_user_id == ig_user_id)
        )
        existing = q.scalar_one_or_none()

        if existing:
            existing.access_token = ig["page_access_token"]
            existing.page_id = ig["page_id"]
            existing.username = ig.get("ig_username", "")
            existing.is_active = True
            existing.connection_status = "connected"
            existing.token_expires_at = token_data.get("expires_at")
            existing.granted_scopes = token_data.get("granted_scopes")
            existing.tenant_id = tenant_id
        else:
            ig_account = InstagramAccount(
                tenant_id=tenant_id,
                instagram_user_id=ig_user_id,
                page_id=ig["page_id"],
                access_token=ig["page_access_token"],
                username=ig.get("ig_username", ""),
                is_active=True,
                connection_status="connected",
                token_expires_at=token_data.get("expires_at"),
                granted_scopes=token_data.get("granted_scopes"),
            )
            db.add(ig_account)
        stored["instagram"] += 1

        # Also update the parent Facebook record with IG info
        fb_q = await db.execute(
            select(FacebookAccount).where(
                FacebookAccount.page_id == ig["page_id"],
                FacebookAccount.tenant_id == tenant_id,
            )
        )
        fb = fb_q.scalar_one_or_none()
        if fb:
            fb.instagram_business_id = ig_user_id
            fb.ig_username = ig.get("ig_username", "")

    await db.commit()

    # Register in channel handlers
    from app.channels.facebook import register_facebook_account
    from app.channels.instagram import register_instagram_account

    for page in assets.get("pages", []):
        register_facebook_account(
            page_id=page["page_id"],
            tenant_id=tenant_id,
            access_token=page["page_access_token"],
            page_name=page["page_name"],
        )

    for ig in assets.get("instagram_accounts", []):
        register_instagram_account(
            instagram_user_id=ig["instagram_user_id"],
            tenant_id=tenant_id,
            access_token=ig["page_access_token"],
            page_id=ig["page_id"],
            display_name=ig.get("ig_username", ""),
        )

    return stored


async def disconnect(db: AsyncSession, tenant_id: str, provider: str) -> bool:
    """Disconnect a Meta integration (instagram or facebook) for a tenant."""
    if provider in ("facebook", "all"):
        result = await db.execute(
            select(FacebookAccount).where(
                FacebookAccount.tenant_id == tenant_id,
                FacebookAccount.is_active == True,
            )
        )
        for acc in result.scalars().all():
            acc.is_active = False
            acc.connection_status = "disconnected"

    if provider in ("instagram", "all"):
        result = await db.execute(
            select(InstagramAccount).where(
                InstagramAccount.tenant_id == tenant_id,
                InstagramAccount.is_active == True,
            )
        )
        for acc in result.scalars().all():
            acc.is_active = False
            acc.connection_status = "disconnected"

    await db.commit()
    return True


async def health_check(db: AsyncSession, tenant_id: str) -> dict:
    """Validate that stored tokens are still working by calling /me."""
    results = {"facebook": None, "instagram": None}

    fb_q = await db.execute(
        select(FacebookAccount).where(
            FacebookAccount.tenant_id == tenant_id,
            FacebookAccount.is_active == True,
        )
    )
    fb = fb_q.scalars().first()

    if fb:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                res = await client.get(
                    f"{GRAPH_API_URL}/{fb.page_id}",
                    params={"fields": "id,name", "access_token": fb.access_token},
                )
                if res.status_code == 200:
                    results["facebook"] = {"status": "ok", "page": res.json().get("name")}
                else:
                    results["facebook"] = {"status": "error", "message": res.text}
                    fb.connection_status = "error"
                    await db.commit()
        except Exception as e:
            results["facebook"] = {"status": "error", "message": str(e)}

    ig_q = await db.execute(
        select(InstagramAccount).where(
            InstagramAccount.tenant_id == tenant_id,
            InstagramAccount.is_active == True,
        )
    )
    ig = ig_q.scalars().first()

    if ig:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                res = await client.get(
                    f"{GRAPH_API_URL}/{ig.instagram_user_id}",
                    params={"fields": "id,username", "access_token": ig.access_token},
                )
                if res.status_code == 200:
                    results["instagram"] = {"status": "ok", "username": res.json().get("username")}
                else:
                    results["instagram"] = {"status": "error", "message": res.text}
                    ig.connection_status = "error"
                    await db.commit()
        except Exception as e:
            results["instagram"] = {"status": "error", "message": str(e)}

    return results
