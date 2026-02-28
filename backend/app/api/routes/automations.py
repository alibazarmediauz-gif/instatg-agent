"""
InstaTG Agent — Automations API Routes

CRUD endpoints for saving and loading visual automation flows.
"""

import structlog
from uuid import UUID
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.models import Automation

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/automations", tags=["Automations"])


class AutomationCreate(BaseModel):
    name: str
    is_active: bool = True
    trigger_type: str = "keyword"
    trigger_keyword: Optional[str] = None
    flow_data: Optional[Any] = None


class AutomationUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    trigger_type: Optional[str] = None
    trigger_keyword: Optional[str] = None
    flow_data: Optional[Any] = None


@router.get("")
async def list_automations(tenant_id: UUID = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Automation).where(Automation.tenant_id == tenant_id).order_by(Automation.created_at.desc()))
    items = result.scalars().all()
    return {
        "automations": [
            {
                "id": str(i.id),
                "name": i.name,
                "is_active": i.is_active,
                "trigger_type": i.trigger_type,
                "trigger_keyword": i.trigger_keyword,
                "flow_data": i.flow_data,
                "created_at": i.created_at.isoformat() if i.created_at else None,
            }
            for i in items
        ]
    }


@router.get("/{auto_id}")
async def get_automation(auto_id: UUID, tenant_id: UUID = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Automation).where(Automation.id == auto_id, Automation.tenant_id == tenant_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    return {
        "id": str(item.id),
        "name": item.name,
        "is_active": item.is_active,
        "trigger_type": item.trigger_type,
        "trigger_keyword": item.trigger_keyword,
        "flow_data": item.flow_data,
    }


@router.post("")
async def create_automation(data: AutomationCreate, tenant_id: UUID = Query(...), db: AsyncSession = Depends(get_db)):
    item = Automation(
        tenant_id=tenant_id,
        name=data.name,
        is_active=data.is_active,
        trigger_type=data.trigger_type,
        trigger_keyword=data.trigger_keyword,
        flow_data=data.flow_data,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {"status": "success", "id": str(item.id)}


@router.patch("/{auto_id}")
async def update_automation(
    auto_id: UUID, data: AutomationUpdate, tenant_id: UUID = Query(...), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Automation).where(Automation.id == auto_id, Automation.tenant_id == tenant_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    update_data = data.dict(exclude_unset=True)
    for k, v in update_data.items():
        setattr(item, k, v)
        
    await db.commit()
    return {"status": "success"}


@router.delete("/{auto_id}")
async def delete_automation(auto_id: UUID, tenant_id: UUID = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Automation).where(Automation.id == auto_id, Automation.tenant_id == tenant_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Automation not found")
        
    await db.delete(item)
    await db.commit()
    return {"status": "deleted"}
