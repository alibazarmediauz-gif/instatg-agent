"""
InstaTG Agent — Analytics API Routes

Contains analytics-specific endpoints that are not part of dashboard summary stats.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Conversation, ConversationAnalysis

router = APIRouter(prefix="/api/analytics", tags=["SaaS Analytics"])


@router.get("/dashboard", deprecated=True, status_code=status.HTTP_410_GONE)
async def deprecated_dashboard_endpoint():
    """Deprecated. Use /api/dashboard/stats instead."""
    return {
        "detail": "Endpoint deprecated. Use /api/dashboard/stats?tenant_id=<id>&days=<n>.",
        "replacement": "/api/dashboard/stats",
    }


@router.get("/conversation-analysis/{id}")
async def get_conversation_analysis(
    id: UUID,
    tenant_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Return analysis for a conversation.
    The path id can be either conversation_analysis.id or conversation.id.
    """
    query = (
        select(ConversationAnalysis)
        .options(selectinload(ConversationAnalysis.conversation))
        .join(Conversation, ConversationAnalysis.conversation_id == Conversation.id)
        .where(
            or_(
                ConversationAnalysis.id == id,
                Conversation.id == id,
            )
        )
    )

    if tenant_id is not None:
        query = query.where(Conversation.tenant_id == tenant_id)

    result = await db.execute(query)
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(status_code=404, detail="Conversation analysis not found")

    conversation = analysis.conversation

    return {
        "id": str(analysis.id),
        "conversation_id": str(analysis.conversation_id),
        "conversation": {
            "id": str(conversation.id),
            "tenant_id": str(conversation.tenant_id),
            "channel": conversation.channel.value,
            "contact_id": conversation.contact_id,
            "contact_name": conversation.contact_name,
            "contact_username": conversation.contact_username,
            "created_at": conversation.created_at.isoformat(),
        },
        "analysis": {
            "sentiment": analysis.sentiment.value if analysis.sentiment else None,
            "lead_score": analysis.lead_score,
            "sales_outcome": analysis.sales_outcome.value if analysis.sales_outcome else None,
            "key_topics": analysis.key_topics or [],
            "objections_raised": analysis.objections_raised or [],
            "objection_handling": analysis.objection_handling or [],
            "recommended_action": analysis.recommended_action,
            "summary": analysis.summary,
            "is_toxic": analysis.is_toxic,
            "has_hallucination": analysis.has_hallucination,
            "script_compliance": analysis.script_compliance,
            "flag_reason": analysis.flag_reason,
            "raw_analysis": analysis.raw_analysis,
            "created_at": analysis.created_at.isoformat(),
        },
    }
