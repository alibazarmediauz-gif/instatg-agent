import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import Tenant, FacebookAccount
from app.config import settings

router = APIRouter(prefix="/facebook-auth", tags=["Facebook Auth"])

# In production, these should be in settings/env
FB_APP_ID = settings.meta_app_id
FB_APP_SECRET = settings.meta_app_secret
FB_REDIRECT_URI = "http://localhost:8000/api/facebook-auth/callback" # Change for production
GRAPH_API_URL = "https://graph.facebook.com/v19.0"

@router.get("/login")
async def facebook_login(tenant_id: str):
    """
    Generates the Facebook OAuth login URL and redirects the user.
    """
    scopes = "pages_show_list,pages_messaging,pages_read_engagement"
    state = tenant_id  # Pass tenant_id through state to recover it in callback
    
    auth_url = (
        f"https://www.facebook.com/v19.0/dialog/oauth?"
        f"client_id={FB_APP_ID}&"
        f"redirect_uri={FB_REDIRECT_URI}&"
        f"scope={scopes}&"
        f"state={state}"
    )
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def facebook_callback(
    code: str = Query(..., description="Authorization code from Facebook"),
    state: str = Query(..., description="Tenant ID passed as state"),
    db: AsyncSession = Depends(get_db)
):
    """
    Handles the OAuth callback, exchanges code for a long-lived token, 
    and saves the user's Facebook Pages to the DB.
    """
    tenant_id = state
    
    async with httpx.AsyncClient() as client:
        # 1. Exchange 'code' for short-lived access token
        token_res = await client.get(
            f"{GRAPH_API_URL}/oauth/access_token",
            params={
                "client_id": FB_APP_ID,
                "client_secret": FB_APP_SECRET,
                "redirect_uri": FB_REDIRECT_URI,
                "code": code
            }
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get access token from Facebook")
        
        token_data = token_res.json()
        short_lived_token = token_data.get("access_token")

        # 2. Exchange short-lived token for long-lived token
        ll_token_res = await client.get(
            f"{GRAPH_API_URL}/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": FB_APP_ID,
                "client_secret": FB_APP_SECRET,
                "fb_exchange_token": short_lived_token
            }
        )
        
        long_lived_token = short_lived_token
        if ll_token_res.status_code == 200:
            long_lived_token = ll_token_res.json().get("access_token", short_lived_token)

        # 3. Fetch user's pages
        pages_res = await client.get(
            f"{GRAPH_API_URL}/me/accounts",
            params={"access_token": long_lived_token}
        )
        if pages_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch pages")
        
        pages_data = pages_res.json().get("data", [])
        
        # 4. Save/Update pages in Database
        for page in pages_data:
            page_id = page.get("id")
            page_access_token = page.get("access_token")
            page_name = page.get("name")
            
            # Check if exists
            query = select(FacebookAccount).where(FacebookAccount.page_id == page_id)
            result = await db.execute(query)
            existing_account = result.scalars().first()
            
            if existing_account:
                existing_account.access_token = page_access_token
                existing_account.page_name = page_name
                existing_account.is_active = True
                existing_account.tenant_id = tenant_id # update tenant if moved
            else:
                new_account = FacebookAccount(
                    tenant_id=tenant_id,
                    page_id=page_id,
                    access_token=page_access_token,
                    page_name=page_name,
                    is_active=True
                )
                db.add(new_account)
                
        await db.commit()

        # Register them instantly for webhooks
        from app.channels.facebook import register_facebook_account
        for page in pages_data:
            register_facebook_account(
                page_id=page.get("id"),
                tenant_id=tenant_id,
                access_token=page.get("access_token"),
                page_name=page.get("name")
            )

    # Redirect back to frontend settings page
    return RedirectResponse(url="http://localhost:3000/settings?fb_connected=true")


@router.get("/status")
async def get_facebook_status(tenant_id: str = Query(...), db: AsyncSession = Depends(get_db)):
    """Check if tenant has connected Facebook Pages."""
    query = select(FacebookAccount).where(FacebookAccount.tenant_id == tenant_id, FacebookAccount.is_active == True)
    result = await db.execute(query)
    accounts = result.scalars().all()
    
    return {
        "connected": len(accounts) > 0,
        "accounts": [{"id": p.page_id, "name": p.page_name} for p in accounts]
    }
