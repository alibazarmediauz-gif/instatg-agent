"""
InstaTG Agent — Conversations API Routes

List, filter, and view conversation histories.
"""

import structlog
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Conversation, Message, ConversationAnalysis, ChannelType, SalesOutcome

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/conversations", tags=["Conversations"])


@router.get("")
async def list_conversations(
    tenant_id: UUID = Query(...),
    channel: Optional[str] = Query(None),
    outcome: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List conversations with filtering and pagination."""
    start = datetime.utcnow() - timedelta(days=days)
    offset = (page - 1) * page_size

    query = (
        select(Conversation)
        .options(selectinload(Conversation.analysis))
        .where(
            and_(Conversation.tenant_id == tenant_id, Conversation.created_at >= start)
        )
    )

    if channel:
        if channel == "comments":
            query = query.where(Conversation.channel.in_([ChannelType.INSTAGRAM_COMMENT, ChannelType.FACEBOOK_COMMENT]))
        elif channel == "instagram":
             # To keep legacy 'instagram' filter from overlapping with 'instagram_comment'
             query = query.where(Conversation.channel == ChannelType.INSTAGRAM)
        elif channel == "facebook":
             query = query.where(Conversation.channel == ChannelType.FACEBOOK)
        else:
            query = query.where(Conversation.channel == ChannelType(channel))

    if search:
        query = query.where(
            Conversation.contact_name.ilike(f"%{search}%")
            | Conversation.contact_username.ilike(f"%{search}%")
        )

    if outcome:
        query = query.join(
            ConversationAnalysis, ConversationAnalysis.conversation_id == Conversation.id
        ).where(ConversationAnalysis.sales_outcome == SalesOutcome(outcome))

    query = query.order_by(desc(Conversation.last_message_at)).offset(offset).limit(page_size)

    result = await db.execute(query)
    conversations = result.scalars().all()

    return {
        "conversations": [
            {
                "id": str(c.id),
                "contact_name": c.contact_name or "Unknown",
                "contact_username": c.contact_username or "",
                "channel": c.channel.value,
                "is_active": c.is_active,
                "needs_human": c.needs_human,
                "last_message_at": c.last_message_at.isoformat() if c.last_message_at else None,
                "created_at": c.created_at.isoformat(),
                "analysis": {
                    "sentiment": c.analysis.sentiment.value if c.analysis and c.analysis.sentiment else None,
                    "lead_score": c.analysis.lead_score if c.analysis else None,
                    "sales_outcome": c.analysis.sales_outcome.value if c.analysis and c.analysis.sales_outcome else None,
                    "summary": c.analysis.summary if c.analysis else None,
                } if c.analysis else None,
            }
            for c in conversations
        ],
        "page": page,
        "page_size": page_size,
    }


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: UUID,
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Get full conversation with messages and analysis."""
    result = await db.execute(
        select(Conversation)
        .options(
            selectinload(Conversation.messages),
            selectinload(Conversation.analysis),
            selectinload(Conversation.voice_analyses),
        )
        .where(
            and_(Conversation.id == conversation_id, Conversation.tenant_id == tenant_id)
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return {
        "id": str(conversation.id),
        "contact_name": conversation.contact_name,
        "contact_username": conversation.contact_username,
        "channel": conversation.channel.value,
        "is_active": conversation.is_active,
        "needs_human": conversation.needs_human,
        "crm_lead_id": conversation.crm_lead_id,
        "created_at": conversation.created_at.isoformat(),
        "messages": [
            {
                "id": str(m.id),
                "role": m.role.value,
                "message_type": m.message_type.value,
                "content": m.content,
                "media_url": m.media_url,
                "created_at": m.created_at.isoformat(),
            }
            for m in conversation.messages
        ],
        "analysis": {
            "sentiment": conversation.analysis.sentiment.value if conversation.analysis and conversation.analysis.sentiment else None,
            "lead_score": conversation.analysis.lead_score if conversation.analysis else None,
            "sales_outcome": conversation.analysis.sales_outcome.value if conversation.analysis and conversation.analysis.sales_outcome else None,
            "key_topics": conversation.analysis.key_topics if conversation.analysis else [],
            "objections_raised": conversation.analysis.objections_raised if conversation.analysis else [],
            "objection_handling": conversation.analysis.objection_handling if conversation.analysis else [],
            "recommended_action": conversation.analysis.recommended_action if conversation.analysis else None,
            "summary": conversation.analysis.summary if conversation.analysis else None,
        } if conversation.analysis else None,
        "voice_analyses": [
            {
                "id": str(va.id),
                "transcription": va.transcription,
                "duration_seconds": va.duration_seconds,
                "tone": va.tone,
                "emotion": va.emotion,
                "pain_points": va.pain_points,
                "sale_outcome_reason": va.sale_outcome_reason,
                "created_at": va.created_at.isoformat(),
            }
            for va in conversation.voice_analyses
        ],
    }
