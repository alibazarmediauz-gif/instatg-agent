from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Dict, Any, List
from uuid import UUID

from app.database import get_db
from app.models import Campaign

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])

@router.get("")
async def list_campaigns(
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """List all campaigns for a tenant."""
    result = await db.execute(
        select(Campaign)
        .where(Campaign.tenant_id == tenant_id)
        .order_by(Campaign.created_at.desc())
    )
    campaigns = result.scalars().all()
    return {"status": "success", "data": campaigns}

@router.post("")
async def create_campaign(
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """Create a new outbound multi-channel campaign."""
    campaign = Campaign(
        tenant_id=tenant_id,
        name=payload.get("name", "New Campaign"),
        status="draft",
        channel=payload.get("channel", "voice"),
        provider=payload.get("provider"),
        agent_id=payload.get("agent_id"),
        agent_name=payload.get("agent_name", "Default Agent"),
        total_contacts=payload.get("total_contacts", 0),
        scheduled_at=payload.get("scheduled_at")
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return {"status": "success", "data": campaign}

@router.post("/{campaign_id}/start")
async def start_campaign(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """Start the campaign processing engine."""
    await db.execute(
        update(Campaign)
        .where(Campaign.id == campaign_id, Campaign.tenant_id == tenant_id)
        .values(status="running")
    )
    await db.commit()
    
    # Trigger background engine
    from app.services.campaign_engine import campaign_engine
    await campaign_engine.start_campaign(tenant_id, str(campaign_id))
    
    return {"status": "success", "state": "running"}

@router.post("/{campaign_id}/pause")
async def pause_campaign(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """Pause an active campaign."""
    await db.execute(
        update(Campaign)
        .where(Campaign.id == campaign_id, Campaign.tenant_id == tenant_id)
        .values(status="paused")
    )
    await db.commit()
    
    # Notify engine to stop
    from app.services.campaign_engine import campaign_engine
    await campaign_engine.stop_campaign(str(campaign_id))
    
    return {"status": "success", "state": "paused"}

@router.get("/{campaign_id}/stats")
async def get_campaign_stats(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """Get stats for a campaign."""
    result = await db.execute(
        select(Campaign)
        .where(Campaign.id == campaign_id, Campaign.tenant_id == tenant_id)
    )
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    return {
        "status": "success", 
        "data": {
            "total_contacts": campaign.total_contacts,
            "completed_contacts": campaign.completed_contacts,
            "success_rate": campaign.success_rate
        }
    }
@router.post("/{campaign_id}/generate-variants")
async def generate_campaign_variants(
    campaign_id: UUID,
    payload: Dict[str, str],
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """Trigger AI generation of A/B message variants."""
    from app.services.campaign_engine import campaign_engine
    
    base_message = payload.get("base_message")
    if not base_message:
        raise HTTPException(status_code=400, detail="base_message is required")
        
    variants = await campaign_engine.generate_ab_variants(
        tenant_id=str(tenant_id),
        campaign_id=str(campaign_id),
        base_message=base_message
    )
    
    if not variants:
        raise HTTPException(status_code=500, detail="Failed to generate variants")
        
    return {"status": "success", "data": variants}
