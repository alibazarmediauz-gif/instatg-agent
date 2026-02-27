"""
InstaTG Agent — Voice Analysis API Routes

Lists voice messages with transcriptions, AI analysis, and sale outcomes.
"""

import structlog
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import VoiceAnalysis, Conversation

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/voice-analysis", tags=["Voice Analysis"])


@router.get("")
async def list_voice_analyses(
    tenant_id: UUID = Query(...),
    days: int = Query(30, ge=1, le=365),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List all voice message analyses for a tenant."""
    start = datetime.utcnow() - timedelta(days=days)
    offset = (page - 1) * page_size

    result = await db.execute(
        select(VoiceAnalysis)
        .join(Conversation, VoiceAnalysis.conversation_id == Conversation.id)
        .where(
            and_(
                Conversation.tenant_id == tenant_id,
                VoiceAnalysis.created_at >= start,
            )
        )
        .order_by(desc(VoiceAnalysis.created_at))
        .offset(offset)
        .limit(page_size)
    )
    analyses = result.scalars().all()

    return {
        "analyses": [
            {
                "id": str(a.id),
                "conversation_id": str(a.conversation_id),
                "transcription": a.transcription,
                "duration_seconds": a.duration_seconds,
                "tone": a.tone,
                "emotion": a.emotion,
                "pain_points": a.pain_points or [],
                "sale_outcome_reason": a.sale_outcome_reason,
                "sales_moment_analysis": a.sales_moment_analysis,
                "created_at": a.created_at.isoformat(),
            }
            for a in analyses
        ],
        "page": page,
        "page_size": page_size,
    }


@router.get("/{analysis_id}")
async def get_voice_analysis(
    analysis_id: UUID,
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed voice analysis by ID."""
    result = await db.execute(
        select(VoiceAnalysis)
        .join(Conversation, VoiceAnalysis.conversation_id == Conversation.id)
        .where(
            and_(
                VoiceAnalysis.id == analysis_id,
                Conversation.tenant_id == tenant_id,
            )
        )
    )
    analysis = result.scalar_one_or_none()

    if not analysis:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Voice analysis not found")

    return {
        "id": str(analysis.id),
        "conversation_id": str(analysis.conversation_id),
        "transcription": analysis.transcription,
        "duration_seconds": analysis.duration_seconds,
        "tone": analysis.tone,
        "emotion": analysis.emotion,
        "pain_points": analysis.pain_points or [],
        "sale_outcome_reason": analysis.sale_outcome_reason,
        "sales_moment_analysis": analysis.sales_moment_analysis,
        "raw_analysis": analysis.raw_analysis,
        "created_at": analysis.created_at.isoformat(),
    }
