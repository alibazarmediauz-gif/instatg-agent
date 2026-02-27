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

@router.get("/amocrm/auth-url")
async def get_amocrm_auth_url(subdomain: str = Query(...)):
    """Generate the amoCRM authorization URL."""
    from app.config import settings
    client_id = settings.amocrm_client_id
    redirect_uri = settings.amocrm_redirect_uri
    
    # Standard amoCRM OAuth URL
    auth_url = (
        f"https://www.amocrm.ru/oauth?client_id={client_id}"
        f"&mode=post_message" # or popup
    )
    # Note: Modern amoCRM often uses a different flow or requires specific redirect_uri in the console
    return {"url": auth_url}

class AmoCRMAuthCode(BaseModel):
    subdomain: str
    code: str

@router.post("/amocrm/connect")
async def connect_amocrm(data: AmoCRMAuthCode, tenant_id: UUID = Query(...), db: AsyncSession = Depends(get_db)):
    """Exchange code for tokens and save account."""
    from app.models import AmoCRMAccount
    from app.crm.amocrm import AmoCRMClient
    
    # Initialize a temporary client to exchange the code
    # We don't have tokens yet, so we pass empty ones
    temp_client = AmoCRMClient(data.subdomain, "", "")
    try:
        token_data = await temp_client.exchange_code(data.code)
        
        account_q = await db.execute(select(AmoCRMAccount).where(AmoCRMAccount.tenant_id == tenant_id))
        account = account_q.scalar_one_or_none()

        if account:
            account.subdomain = data.subdomain
            account.access_token = token_data["access_token"]
            account.refresh_token = token_data["refresh_token"]
            account.is_active = True
        else:
            account = AmoCRMAccount(
                tenant_id=tenant_id, 
                subdomain=data.subdomain, 
                access_token=token_data["access_token"],
                refresh_token=token_data["refresh_token"]
            )
            db.add(account)
        
        await db.commit()
        return {"status": "success", "connected": True}
    except Exception as e:
        logger.error("amocrm_connection_failed", error=str(e))
        return {"status": "error", "message": str(e)}

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
