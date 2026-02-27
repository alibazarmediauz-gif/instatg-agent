"""
InstaTG Agent — Dashboard API Routes

Provides stats, live counts, and conversion data for the dashboard.
"""

import structlog
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Conversation, ConversationAnalysis, Message,
    SalesOutcome, ChannelType, SentimentType,
)

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    tenant_id: UUID = Query(...),
    days: int = Query(1, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard overview statistics."""
    now = datetime.utcnow()
    start = now - timedelta(days=days)

    # Total conversations
    total_q = await db.execute(
        select(func.count(Conversation.id)).where(
            and_(Conversation.tenant_id == tenant_id, Conversation.created_at >= start)
        )
    )
    total = total_q.scalar() or 0

    # Active conversations (last message within 2 hours)
    active_threshold = now - timedelta(hours=2)
    active_q = await db.execute(
        select(func.count(Conversation.id)).where(
            and_(
                Conversation.tenant_id == tenant_id,
                Conversation.last_message_at >= active_threshold,
            )
        )
    )
    active = active_q.scalar() or 0

    # Won deals
    won_q = await db.execute(
        select(func.count(ConversationAnalysis.id)).join(
            Conversation, ConversationAnalysis.conversation_id == Conversation.id
        ).where(
            and_(
                Conversation.tenant_id == tenant_id,
                Conversation.created_at >= start,
                ConversationAnalysis.sales_outcome == SalesOutcome.WON,
            )
        )
    )
    won = won_q.scalar() or 0

    # Average lead score
    avg_q = await db.execute(
        select(func.avg(ConversationAnalysis.lead_score)).join(
            Conversation, ConversationAnalysis.conversation_id == Conversation.id
        ).where(
            and_(
                Conversation.tenant_id == tenant_id,
                Conversation.created_at >= start,
            )
        )
    )
    avg_score = round(avg_q.scalar() or 0, 1)

    # Total messages
    msgs_q = await db.execute(
        select(func.count(Message.id)).join(
            Conversation, Message.conversation_id == Conversation.id
        ).where(
            and_(Conversation.tenant_id == tenant_id, Message.created_at >= start)
        )
    )
    total_messages = msgs_q.scalar() or 0

    conversion_rate = round((won / total * 100) if total > 0 else 0, 1)

    return {
        "total_conversations": total,
        "active_conversations": active,
        "won_deals": won,
        "conversion_rate": conversion_rate,
        "avg_lead_score": avg_score,
        "total_messages": total_messages,
        "period_days": days,
    }


@router.get("/conversion-graph")
async def get_conversion_graph(
    tenant_id: UUID = Query(...),
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
):
    """Get daily conversion data for graph rendering."""
    now = datetime.utcnow()
    data = []

    for i in range(days):
        date = (now - timedelta(days=days - 1 - i)).replace(hour=0, minute=0, second=0, microsecond=0)
        next_date = date + timedelta(days=1)

        convos_q = await db.execute(
            select(func.count(Conversation.id)).where(
                and_(
                    Conversation.tenant_id == tenant_id,
                    Conversation.created_at >= date,
                    Conversation.created_at < next_date,
                )
            )
        )
        convos = convos_q.scalar() or 0

        won_q = await db.execute(
            select(func.count(ConversationAnalysis.id)).join(
                Conversation, ConversationAnalysis.conversation_id == Conversation.id
            ).where(
                and_(
                    Conversation.tenant_id == tenant_id,
                    Conversation.created_at >= date,
                    Conversation.created_at < next_date,
                    ConversationAnalysis.sales_outcome == SalesOutcome.WON,
                )
            )
        )
        won = won_q.scalar() or 0

        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "conversations": convos,
            "won": won,
            "conversion_rate": round((won / convos * 100) if convos > 0 else 0, 1),
        })

    return {"data": data, "period_days": days}


@router.get("/channel-breakdown")
async def get_channel_breakdown(
    tenant_id: UUID = Query(...),
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
):
    """Get conversation breakdown by channel."""
    start = datetime.utcnow() - timedelta(days=days)

    result = await db.execute(
        select(
            Conversation.channel,
            func.count(Conversation.id),
        ).where(
            and_(Conversation.tenant_id == tenant_id, Conversation.created_at >= start)
        ).group_by(Conversation.channel)
    )

    breakdown = {str(row[0].value): row[1] for row in result.all()}
    return {"channels": breakdown, "period_days": days}
