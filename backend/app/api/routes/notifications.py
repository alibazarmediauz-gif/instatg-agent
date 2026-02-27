from fastapi import APIRouter, Depends, Query, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, update
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import asyncio
import json

from app.database import get_db
from app.models import Notification

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

# Memory-based pub/sub for SSE
# Key: tenant_id string, Value: list of asyncio.Queue
active_connections: dict[str, List[asyncio.Queue]] = {}

def get_tenant_connections(tenant_id: str) -> List[asyncio.Queue]:
    if tenant_id not in active_connections:
        active_connections[tenant_id] = []
    return active_connections[tenant_id]

async def notify_tenant(tenant_id: str, payload: dict):
    q_list = get_tenant_connections(tenant_id)
    dead_queues = []
    for q in q_list:
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            dead_queues.append(q)
    for q in dead_queues:
        q_list.remove(q)

from uuid import UUID
from fastapi.encoders import jsonable_encoder

class NotificationResponse(BaseModel):
    id: UUID
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

async def create_and_dispatch_notification(
    tenant_id: str,
    title: str,
    message: str,
    type: str = "info",
    link: str = None
):
    from app.database import async_session_factory
    from app.models import Notification
    
    async with async_session_factory() as db:
        new_notification = Notification(
            tenant_id=tenant_id, # Tenant UUID is implicitly handled by SQLAlchemy
            title=title,
            message=message,
            type=type,
            link=link
        )
        db.add(new_notification)
        await db.commit()
        await db.refresh(new_notification)
        
        payload = jsonable_encoder(NotificationResponse.from_orm(new_notification))
        payload["event_type"] = "new_notification"
        
        await notify_tenant(str(tenant_id), payload)

@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    tenant_id: str = Query(...),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get the latest notifications for a tenant."""
    query = (
        select(Notification)
        .where(Notification.tenant_id == tenant_id)
        .order_by(desc(Notification.created_at))
        .limit(limit)
    )
    result = await db.execute(query)
    notifications = result.scalars().all()
    # Convert string tenant_id string to UUID mapping implicitly handled by SQLAlchemy if UUID passed as string
    
    # We return the mapped dict so pydantic can parse it
    return [NotificationResponse.from_orm(n) for n in notifications]


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    tenant_id: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Mark a specific notification as read."""
    query = (
        update(Notification)
        .where(Notification.id == notification_id)
        .where(Notification.tenant_id == tenant_id)
        .values(is_read=True)
    )
    await db.execute(query)
    await db.commit()
    return {"status": "success"}


@router.post("/read-all")
async def mark_all_read(
    tenant_id: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Mark all notifications as read."""
    query = (
        update(Notification)
        .where(Notification.tenant_id == tenant_id)
        .where(Notification.is_read == False)
        .values(is_read=True)
    )
    await db.execute(query)
    await db.commit()
    return {"status": "success"}

from fastapi.responses import StreamingResponse

@router.get("/stream")
async def stream_notifications(request: Request, tenant_id: str = Query(...)):
    """Server-Sent Events endpoint for real-time notifications."""
    queue = asyncio.Queue(maxsize=100)
    conns = get_tenant_connections(tenant_id)
    conns.append(queue)
    
    async def event_generator():
        try:
            # Send initial ping to establish connection
            yield f"data: {json.dumps({'type': 'ping', 'message': 'connected'})}\n\n"
            
            while True:
                if await request.is_disconnected():
                    break
                try:
                    # Wait for a new notification payload
                    payload = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {json.dumps(payload)}\n\n"
                except asyncio.TimeoutError:
                    # Send a heartbeat every 15s to keep connection alive
                    yield ": heartbeat\n\n"
        finally:
            if queue in active_connections.get(tenant_id, []):
                active_connections[tenant_id].remove(queue)
                
    return StreamingResponse(event_generator(), media_type="text/event-stream")
