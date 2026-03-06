"""
InstaTG Agent — Dashboard API Routes

Provides stats, live counts, and conversion data for the dashboard.
"""

import structlog
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Conversation, ConversationAnalysis, Message,
    SalesOutcome, Tenant
)
from app.api.routes.auth import get_current_tenant

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    current_tenant: Tenant = Depends(get_current_tenant),
    days: int = Query(7, ge=0, le=365),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard analytics payload used by both Dashboard and Analytics pages."""
    effective_days = days if days > 0 else 7
    now = datetime.utcnow()
    start = now - timedelta(days=effective_days)

    # Total conversations
    total_q = await db.execute(
        select(func.count(Conversation.id)).where(
            and_(Conversation.tenant_id == current_tenant.id, Conversation.created_at >= start)
        )
    )
    total = total_q.scalar() or 0

    # Active conversations (last message within 2 hours)
    active_threshold = now - timedelta(hours=2)
    active_q = await db.execute(
        select(func.count(Conversation.id)).where(
            and_(
                Conversation.tenant_id == current_tenant.id,
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
                Conversation.tenant_id == current_tenant.id,
                Conversation.created_at >= start,
                ConversationAnalysis.sales_outcome == SalesOutcome.WON,
            )
        )
    )
    won = won_q.scalar() or 0

    # Total messages
    msgs_q = await db.execute(
        select(func.count(Message.id)).join(
            Conversation, Message.conversation_id == Conversation.id
        ).where(
            and_(Conversation.tenant_id == current_tenant.id, Message.created_at >= start)
        )
    )
    total_messages = msgs_q.scalar() or 0

    # Channel performance for analytics table
    channel_totals_q = await db.execute(
        select(
            Conversation.channel,
            func.count(Conversation.id),
        ).where(
            and_(Conversation.tenant_id == current_tenant.id, Conversation.created_at >= start)
        ).group_by(Conversation.channel)
    )
    channel_totals = {row[0].value: row[1] for row in channel_totals_q.all()}

    channel_won_q = await db.execute(
        select(
            Conversation.channel,
            func.count(ConversationAnalysis.id),
        ).join(
            ConversationAnalysis, ConversationAnalysis.conversation_id == Conversation.id
        ).where(
            and_(
                Conversation.tenant_id == current_tenant.id,
                Conversation.created_at >= start,
                ConversationAnalysis.sales_outcome == SalesOutcome.WON,
            )
        ).group_by(Conversation.channel)
    )
    channel_wins = {row[0].value: row[1] for row in channel_won_q.all()}

    channel_data = []
    for source, leads in sorted(channel_totals.items(), key=lambda item: item[1], reverse=True):
        wins = channel_wins.get(source, 0)
        channel_data.append(
            {
                "source": source,
                "leads": leads,
                "conversion": round((wins / leads * 100), 1) if leads else 0,
                "revenue": round(wins * 500, 2),
            }
        )

    # Build an analytics-style response expected by the frontend control center.
    total_revenue = float(won * 500)  # simplistic revenue estimation
    total_cost = float(total_messages * 0.5)  # assume $0.50 per message
    roi = round(((total_revenue - total_cost) / total_cost * 100), 1) if total_cost > 0 else 0
    cpl = round(total_cost / (total or 1), 2)

    return {
        "status": "success",
        "kpis": {
            "total_revenue": total_revenue,
            "total_cost": total_cost,
            "roi": roi,
            "cpl": cpl,
        },
        # revenueData/channelData/regionData/funnelData mirror analytics.py structure
        "revenueData": [],
        "channelData": channel_data,
        "regionData": [],
        "funnelData": [
            {"name": "Total Leads", "value": total},
            {"name": "Qualified", "value": active},
            {"name": "Quoted", "value": won},
            {"name": "Deals Won", "value": won},
        ],
    }


@router.get("/conversion-graph")
async def get_conversion_graph(
    current_tenant: Tenant = Depends(get_current_tenant),
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
                    Conversation.tenant_id == current_tenant.id,
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
                    Conversation.tenant_id == current_tenant.id,
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
    current_tenant: Tenant = Depends(get_current_tenant),
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
            and_(Conversation.tenant_id == current_tenant.id, Conversation.created_at >= start)
        ).group_by(Conversation.channel)
    )

    breakdown = {str(row[0].value): row[1] for row in result.all()}
    return {"channels": breakdown, "period_days": days}
