"""
InstaTG Agent — Reports API Routes

Serves daily/weekly reports and provides PDF download capability.
"""

import structlog
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import DailyReport
from app.analytics.reports import report_generator

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("")
async def list_reports(
    tenant_id: UUID = Query(...),
    days: int = Query(30, ge=1, le=365),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List daily reports for a tenant."""
    start = datetime.utcnow() - timedelta(days=days)
    offset = (page - 1) * page_size

    result = await db.execute(
        select(DailyReport)
        .where(and_(DailyReport.tenant_id == tenant_id, DailyReport.report_date >= start))
        .order_by(desc(DailyReport.report_date))
        .offset(offset)
        .limit(page_size)
    )
    reports = result.scalars().all()

    return {
        "reports": [
            {
                "id": str(r.id),
                "report_date": r.report_date.isoformat(),
                "total_conversations": r.total_conversations,
                "conversations_handled": r.conversations_handled,
                "conversations_missed": r.conversations_missed,
                "conversion_rate": r.conversion_rate,
                "created_at": r.created_at.isoformat(),
            }
            for r in reports
        ],
        "page": page,
        "page_size": page_size,
    }


@router.get("/{report_id}")
async def get_report(
    report_id: UUID,
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Get full report details."""
    result = await db.execute(
        select(DailyReport).where(
            and_(DailyReport.id == report_id, DailyReport.tenant_id == tenant_id)
        )
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return {
        "id": str(report.id),
        "report_date": report.report_date.isoformat(),
        "total_conversations": report.total_conversations,
        "conversations_handled": report.conversations_handled,
        "conversations_missed": report.conversations_missed,
        "conversion_rate": report.conversion_rate,
        "top_scripts": report.top_scripts,
        "common_objections": report.common_objections,
        "voice_summary": report.voice_summary,
        "comparison_data": report.comparison_data,
        "full_report": report.full_report,
        "created_at": report.created_at.isoformat(),
    }


@router.post("/generate")
async def generate_report_now(
    tenant_id: UUID = Query(...),
    date: str = Query(None, description="Date in YYYY-MM-DD format"),
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger report generation."""
    try:
        report_date = datetime.strptime(date, "%Y-%m-%d") if date else None
        report = await report_generator.generate_daily_report(db, str(tenant_id), report_date)
        return {"status": "generated", "report": report}
    except Exception as e:
        logger.error("manual_report_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
