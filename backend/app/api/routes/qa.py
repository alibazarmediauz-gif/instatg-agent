from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc
from sqlalchemy.orm import selectinload
from typing import Dict, Any, List
from uuid import UUID

from app.database import get_db
from app.models import ConversationAnalysis, Conversation

router = APIRouter(prefix="/api/qa", tags=["QA Control Center"])

@router.get("/flagged")
async def get_flagged_interactions(
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Get all flagged conversation analyses for QA Manager review."""
    result = await db.execute(
        select(ConversationAnalysis)
        .join(Conversation, ConversationAnalysis.conversation_id == Conversation.id)
        .options(selectinload(ConversationAnalysis.conversation))
        .where(
            Conversation.tenant_id == tenant_id,
            or_(
                ConversationAnalysis.is_toxic == True,
                ConversationAnalysis.has_hallucination == True,
                ConversationAnalysis.script_compliance < 80
            ) # Type of QA deviations
        )
        .order_by(desc(ConversationAnalysis.created_at))
    )
    
    flagged = result.scalars().all()
    
    # Calculate some stats
    total_result = await db.execute(select(ConversationAnalysis).join(Conversation).where(Conversation.tenant_id == tenant_id))
    total_passed = len(total_result.scalars().all()) - len(flagged)
    
    return {
        "status": "success",
        "stats": {
            "pending_reviews": len(flagged),
            "auto_passed": total_passed,
            "flag_rate": round(len(flagged) / (total_passed + len(flagged) + 1) * 100, 1),
            "avg_qa_score": 91.4 # Stub, calculate avg script_compliance in real app
        },
        "data": [
            {
                "id": str(fa.id),
                "conversation_id": str(fa.conversation_id),
                "contact_name": fa.conversation.contact_name or "Unknown",
                "agent": "AI Sub-Agent",
                "is_toxic": fa.is_toxic,
                "has_hallucination": fa.has_hallucination,
                "script_compliance": fa.script_compliance,
                "flag_reason": fa.flag_reason,
                "score": fa.script_compliance,
                "created_at": fa.created_at.isoformat()
            } for fa in flagged
        ]
    }

@router.post("/audit/{analysis_id}")
async def submit_audit(
    analysis_id: UUID,
    payload: Dict[str, Any],
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Manager submits their audit review."""
    return {"status": "success"}
