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
    """Get all IVR tree flows."""
    return {"flows": []}

@router.put("/{flow_id}")
async def update_ivr_flow(
    flow_id: str,
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """Update or save an IVR JSON tree representation."""
    return {"status": "success", "flow_id": flow_id}
