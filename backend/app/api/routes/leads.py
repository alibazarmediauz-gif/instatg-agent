from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from typing import Dict, Any, List
from uuid import UUID

from app.database import get_db
from app.models import Lead, Pipeline, PipelineStage, SalesInteraction, Transaction

router = APIRouter(prefix="/api/leads", tags=["CRM Leads"])

@router.get("")
async def list_leads(
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Get all leads for the Kanban board."""
    result = await db.execute(
        select(Lead)
        .options(selectinload(Lead.pipeline_stage))
        .where(Lead.tenant_id == tenant_id)
        .order_by(Lead.created_at.desc())
    )
    leads = result.scalars().all()
    return {"status": "success", "data": leads}

@router.post("")
async def create_lead(
    payload: Dict[str, Any],
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Create a new lead (manual or via API)."""
    new_lead = Lead(
        tenant_id=tenant_id,
        contact_info=payload.get("contact_info", {}),
        status=payload.get("status", "New"),
        probability_score=payload.get("probability_score", 0.0)
    )
    
    if "pipeline_stage_id" in payload and payload["pipeline_stage_id"]:
        new_lead.pipeline_stage_id = UUID(payload["pipeline_stage_id"])

    db.add(new_lead)
    await db.commit()
    await db.refresh(new_lead)
    
    return {"status": "success", "data": new_lead}

@router.get("/pipelines")
async def get_pipelines(
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Grab pipeline configuration and stages."""
    result = await db.execute(
        select(Pipeline)
        .options(selectinload(Pipeline.stages))
        .where(Pipeline.tenant_id == tenant_id)
    )
    pipelines = result.scalars().all()
    return {"status": "success", "data": pipelines}

@router.post("/pipelines")
async def seed_pipeline(
    payload: Dict[str, Any],
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Seed or create a new pipeline with stages."""
    pipeline = Pipeline(
        tenant_id=tenant_id,
        name=payload.get("name", "Default Sales Pipeline"),
        is_default=payload.get("is_default", True)
    )
    db.add(pipeline)
    await db.commit()
    await db.refresh(pipeline)

    stages = payload.get("stages", ["New", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"])
    for i, name in enumerate(stages):
        stage = PipelineStage(pipeline_id=pipeline.id, name=name, order=i)
        db.add(stage)
    
    await db.commit()
    return {"status": "success", "pipeline_id": pipeline.id}

@router.get("/{lead_id}")
async def get_lead(
    lead_id: UUID,
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Get rich lead details, including interaction logs."""
    result = await db.execute(
        select(Lead)
        .options(selectinload(Lead.sales_interactions), selectinload(Lead.transactions))
        .where(Lead.id == lead_id, Lead.tenant_id == tenant_id)
    )
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    return {"status": "success", "data": lead}

@router.patch("/{lead_id}/stage")
async def update_lead_stage(
    lead_id: UUID,
    payload: Dict[str, Any],
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Move lead between Kanban stages."""
    stage_id = payload.get("pipeline_stage_id")
    status = payload.get("status")

    if not stage_id and not status:
        raise HTTPException(status_code=400, detail="Must provide pipeline_stage_id or status")

    update_vals = {}
    if stage_id:
        update_vals["pipeline_stage_id"] = UUID(stage_id) if stage_id else None
    if status:
        update_vals["status"] = status

    await db.execute(
        update(Lead)
        .where(Lead.id == lead_id, Lead.tenant_id == tenant_id)
        .values(**update_vals)
    )
    await db.commit()
    return {"status": "success"}

@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: UUID,
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Delete a lead from the CRM pipeline."""
    result = await db.execute(
        select(Lead)
        .where(Lead.id == lead_id, Lead.tenant_id == tenant_id)
    )
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    await db.delete(lead)
    await db.commit()
    return {"status": "success"}
