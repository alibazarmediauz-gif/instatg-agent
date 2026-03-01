"""
InstaTG Agent — Integrations / CRM API Routes

Provides configuration and status endpoints for AmoCRM integration.
"""

import structlog
from uuid import UUID
from datetime import datetime, timedelta
from pydantic import BaseModel

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import CRMLead, LeadStage, ChannelType

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/integrations", tags=["Integrations"])


@router.get("/crm-status")
async def get_crm_status(
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Get CRM integration status and lead pipeline summary."""
    from app.models import AmoCRMAccount, Lead
    from sqlalchemy import select, func
    
    account_q = await db.execute(select(AmoCRMAccount).where(AmoCRMAccount.tenant_id == tenant_id, AmoCRMAccount.is_active == True))
    account = account_q.scalar_one_or_none()
    is_connected = account is not None

    # Pipeline breakdown from our Lead table
    pipeline = {}
    if is_connected:
        # Get count per stage from our Lead table
        stages_q = await db.execute(
            select(Lead.status, func.count(Lead.id))
            .where(Lead.tenant_id == tenant_id)
            .group_by(Lead.status)
        )
        for status, count in stages_q.all():
            pipeline[status] = count

    total = sum(pipeline.values())

    return {
        "connected": is_connected,
        "subdomain": account.subdomain if account else None,
        "total_leads": total,
        "pipeline": pipeline,
        "last_synced_at": account.updated_at.isoformat() if account else None,
        "sync_errors": 0,
    }

class AmoCRMInit(BaseModel):
    subdomain: str

@router.get("/test-deploy")
async def test_deploy():
    return {"status": "deployed_properly_with_asyncsession_fix"}

@router.get("/amocrm/auth-url")
async def get_amocrm_auth_url(tenant_id: UUID = Query(...)):
    """Generate the amoCRM authorization URL for the SaaS tenant."""
    from app.config import settings
    
    # We pass the tenant_id in the 'state' parameter so when amoCRM redirects back,
    # we know which tenant this connection belongs to.
    state = str(tenant_id)
    
    auth_url = (
        f"https://www.amocrm.ru/oauth?client_id={settings.amocrm_client_id}"
        f"&state={state}"
        f"&mode=post_message"
    )
    return {"url": auth_url}

@router.get("/amocrm/callback")
async def amocrm_callback(
    code: str = Query(..., description="The authorization code from amoCRM"),
    referer: str = Query(..., description="The amoCRM domain that made the request"),
    state: str = Query(..., description="The tenant_id passed during the initial request"),
    db: AsyncSession = Depends(get_db)
):
    """Handle the OAuth redirect from amoCRM, exchange the code, and redirect the user."""
    from app.models import AmoCRMAccount
    from app.crm.amocrm import AmoCRMClient
    from app.config import settings
    from fastapi.responses import RedirectResponse
    
    tenant_id = UUID(state)
    subdomain = referer.replace(".amocrm.ru", "")
    
    # Initialize temp client to exchange the code
    temp_client = AmoCRMClient(subdomain, "", "")
    try:
        token_data = await temp_client.exchange_code(code)
        
        account_q = await db.execute(select(AmoCRMAccount).where(AmoCRMAccount.tenant_id == tenant_id))
        account = account_q.scalar_one_or_none()

        if account:
            account.subdomain = subdomain
            account.access_token = token_data["access_token"]
            account.refresh_token = token_data["refresh_token"]
            account.is_active = True
        else:
            account = AmoCRMAccount(
                tenant_id=tenant_id, 
                subdomain=subdomain, 
                access_token=token_data["access_token"],
                refresh_token=token_data["refresh_token"]
            )
            db.add(account)
        
        await db.commit()
        
        # Redirect the user back to the CRM dashboard
        # Using the base frontend URL from settings
        return RedirectResponse(url=f"{settings.frontend_url}/crm?amo_connected=true")
        
    except Exception as e:
        logger.error("amocrm_callback_failed", error=str(e), tenant_id=str(tenant_id))
        return RedirectResponse(url=f"{settings.frontend_url}/crm?amo_error=token_exchange_failed")

@router.post("/amocrm/disconnect")
async def disconnect_amocrm(tenant_id: UUID = Query(...), db: AsyncSession = Depends(get_db)):
    from app.models import AmoCRMAccount
    account_q = await db.execute(select(AmoCRMAccount).where(AmoCRMAccount.tenant_id == tenant_id))
    account = account_q.scalar_one_or_none()
    if account:
        account.is_active = False
        await db.commit()
    return {"status": "disconnected"}



@router.get("/crm-leads")
async def list_crm_leads(
    tenant_id: UUID = Query(...),
    stage: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List CRM leads with optional stage filter."""
    query = select(CRMLead).where(CRMLead.tenant_id == tenant_id)
    if stage:
        query = query.where(CRMLead.stage == LeadStage(stage))

    result = await db.execute(query.order_by(CRMLead.updated_at.desc()))
    leads = result.scalars().all()

    return {
        "leads": [
            {
                "id": str(l.id),
                "amocrm_lead_id": l.amocrm_lead_id,
                "amocrm_contact_id": l.amocrm_contact_id,
                "contact_name": l.contact_name,
                "channel": l.channel.value if l.channel else None,
                "stage": l.stage.value if l.stage else None,
                "last_synced_at": l.last_synced_at.isoformat() if l.last_synced_at else None,
                "sync_error": l.sync_error,
                "created_at": l.created_at.isoformat(),
            }
            for l in leads
        ]
    }
