from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, List
from uuid import UUID

from app.database import get_db
from app.models import SalesInteraction
from app.services.quality_engine import quality_engine

router = APIRouter(prefix="/api/monitoring", tags=["Quality Monitoring"])

@router.get("/interactions")
async def list_interactions(
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """List recent sales interactions for QA review."""
    result = await db.execute(
        select(SalesInteraction)
        .where(SalesInteraction.tenant_id == tenant_id)
        .order_by(SalesInteraction.created_at.desc())
        .limit(50)
    )
    interactions = result.scalars().all()
    return {"status": "success", "data": interactions}

@router.post("/interactions/{interaction_id}/grade")
async def trigger_grade(
    interaction_id: UUID,
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Trigger AI grading for a specific interaction."""
    # 1. Fetch interaction and transcript
    result = await db.execute(
        select(SalesInteraction).where(SalesInteraction.id == interaction_id, SalesInteraction.tenant_id == tenant_id)
    )
    interaction = result.scalar_one_or_none()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
        
    # Mock transcript for now - in production this would come from logs or a dedicated Table
    mock_transcript = [
        {"role": "assistant", "text": "Assalomu alaykum! Men Malika."},
        {"role": "user", "text": "Vaalaykum assalom. Narxi qancha?"}
    ]
    
    # 2. Call QualityEngine
    report = await quality_engine.grade_interaction(str(interaction_id), mock_transcript)
    
    # 3. Update DB
    interaction.qa_grade = report.get("qa_grade", 0)
    # intersection.summary = report.get("summary") # Need to add this to model if needed
    
    await db.commit()
    return {"status": "success", "report": report}

@router.get("/stats")
async def get_qa_stats(
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Get aggregated QA metrics for the dashboard."""
    # Simplified mock stats
    return {
        "status": "success",
        "data": {
            "avg_grade": 84,
            "total_reviewed": 120,
            "flagged_count": 5
        }
    }
