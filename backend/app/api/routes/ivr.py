from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
from uuid import UUID

from app.database import get_db

router = APIRouter(prefix="/api/ivr", tags=["IVR Builder"])

@router.get("")
async def get_ivr_flows(
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """Get all IVR tree flows for this tenant."""
    from app.models import IVRFlow
    result = await db.execute(select(IVRFlow).where(IVRFlow.tenant_id == tenant_id))
    items = result.scalars().all()
    return {
        "flows": [
            {"id": str(i.id), "name": i.name, "tree_config": i.tree_config, "created_at": i.created_at}
            for i in items
        ]
    }

@router.put("/{flow_id}")
async def update_ivr_flow(
    flow_id: str,
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """Update or save an IVR JSON tree representation."""
    from app.models import IVRFlow
    from sqlalchemy import update
    
    # Check if exists
    result = await db.execute(select(IVRFlow).where(IVRFlow.id == flow_id, IVRFlow.tenant_id == tenant_id))
    item = result.scalar_one_or_none()
    
    if item:
        item.tree_config = payload.get("tree_config", item.tree_config)
        item.name = payload.get("name", item.name)
    else:
        item = IVRFlow(
            id=flow_id,
            tenant_id=tenant_id,
            name=payload.get("name", "New Flow"),
            tree_config=payload.get("tree_config", {})
        )
        db.add(item)
        
    await db.commit()
    return {"status": "success", "flow_id": flow_id}
