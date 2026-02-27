"""
InstaTG Agent — Daily Report Generator

Generates comprehensive daily analytics reports and delivers via
dashboard, Telegram, and email.
"""

import structlog
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import (
    Conversation,
    ConversationAnalysis,
    VoiceAnalysis,
    DailyReport,
    SalesOutcome,
    SentimentType,
    ChannelType,
)

logger = structlog.get_logger(__name__)


class ReportGenerator:
    """Generates daily analytics reports per tenant."""

    async def generate_daily_report(
        self,
        db: AsyncSession,
        tenant_id: str,
        report_date: Optional[datetime] = None,
    ) -> dict:
        """
        Generate a comprehensive daily report.
        
        Args:
            db: Database session
            tenant_id: Business tenant ID
            report_date: Date to report on (default: yesterday)
        
        Returns:
            Full report as dict
        """
        if not report_date:
            report_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)

        date_start = report_date.replace(hour=0, minute=0, second=0, microsecond=0)
        date_end = date_start + timedelta(days=1)

        try:
            # 1. Total conversations today
            total_convos = await self._count_conversations(db, tenant_id, date_start, date_end)

            # 2. Conversations with AI response
            handled_convos = await self._count_handled_conversations(db, tenant_id, date_start, date_end)

            # 3. Missed conversations
            missed_convos = total_convos - handled_convos

            # 4. Conversion rate
            won_count = await self._count_by_outcome(db, tenant_id, date_start, date_end, SalesOutcome.WON)
            conversion_rate = (won_count / total_convos * 100) if total_convos > 0 else 0.0

            # 5. Outcome breakdown
            outcomes = await self._get_outcome_breakdown(db, tenant_id, date_start, date_end)

            # 6. Sentiment breakdown
            sentiments = await self._get_sentiment_breakdown(db, tenant_id, date_start, date_end)

            # 7. Channel breakdown
            channels = await self._get_channel_breakdown(db, tenant_id, date_start, date_end)

            # 8. Common objections
            objections = await self._get_common_objections(db, tenant_id, date_start, date_end)

            # 9. Top scores
            top_conversations = await self._get_top_conversations(db, tenant_id, date_start, date_end)

            # 10. Voice analysis summary
            voice_summary = await self._get_voice_summary(db, tenant_id, date_start, date_end)

            # 11. Comparison data
            comparison = await self._get_comparison(db, tenant_id, date_start)

            report = {
                "report_date": date_start.isoformat(),
                "tenant_id": str(tenant_id),
                "summary": {
                    "total_conversations": total_convos,
                    "conversations_handled": handled_convos,
                    "conversations_missed": missed_convos,
                    "conversion_rate": round(conversion_rate, 1),
                    "won": won_count,
                },
                "outcomes": outcomes,
                "sentiments": sentiments,
                "channels": channels,
                "common_objections": objections,
                "top_conversations": top_conversations,
                "voice_summary": voice_summary,
                "comparison": comparison,
            }

            # Save to database
            await self._save_report(db, tenant_id, date_start, report)

            logger.info(
                "daily_report_generated",
                tenant=tenant_id,
                date=date_start.isoformat(),
                total=total_convos,
                conversion=conversion_rate,
            )

            return report

        except Exception as e:
            logger.error("report_generation_error", error=str(e), tenant=tenant_id)
            raise

    def format_telegram_report(self, report: dict) -> str:
        """Format report as a Telegram message."""
        s = report.get("summary", {})
        comp = report.get("comparison", {})

        msg = f"""📊 *Daily Report — {report.get('report_date', 'Today')}*

📬 *Conversations:*
  Total: {s.get('total_conversations', 0)}
  Handled by AI: {s.get('conversations_handled', 0)}
  Missed: {s.get('conversations_missed', 0)}

💰 *Sales:*
  Won: {s.get('won', 0)}
  Conversion Rate: {s.get('conversion_rate', 0)}%

📈 *Outcomes:*"""

        for outcome, count in report.get("outcomes", {}).items():
            emoji = {"won": "✅", "lost": "❌", "in_progress": "⏳", "not_qualified": "🚫"}.get(outcome, "•")
            msg += f"\n  {emoji} {outcome}: {count}"

        if report.get("common_objections"):
            msg += "\n\n🛡 *Top Objections:*"
            for obj in report["common_objections"][:5]:
                msg += f"\n  • {obj}"

        if comp:
            msg += f"""

📊 *vs Yesterday:*
  Conversations: {comp.get('vs_yesterday_conversations', 'N/A')}
  Conversion: {comp.get('vs_yesterday_conversion', 'N/A')}
  
📊 *7-Day Average:*
  Conversations: {comp.get('avg_7d_conversations', 'N/A')}
  Conversion: {comp.get('avg_7d_conversion', 'N/A')}%"""

        if report.get("voice_summary"):
            msg += f"\n\n🎙 *Voice Analysis:*\n  {report['voice_summary']}"

        return msg

    # ─── Query Helpers ────────────────────────────────────────────

    async def _count_conversations(
        self, db: AsyncSession, tenant_id: str, start: datetime, end: datetime
    ) -> int:
        result = await db.execute(
            select(func.count(Conversation.id)).where(
                and_(
                    Conversation.tenant_id == tenant_id,
                    Conversation.created_at >= start,
                    Conversation.created_at < end,
                )
            )
        )
        return result.scalar() or 0

    async def _count_handled_conversations(
        self, db: AsyncSession, tenant_id: str, start: datetime, end: datetime
    ) -> int:
        result = await db.execute(
            select(func.count(Conversation.id)).where(
                and_(
                    Conversation.tenant_id == tenant_id,
                    Conversation.created_at >= start,
                    Conversation.created_at < end,
                    Conversation.last_message_at.isnot(None),
                )
            )
        )
        return result.scalar() or 0

    async def _count_by_outcome(
        self, db: AsyncSession, tenant_id: str, start: datetime, end: datetime, outcome: SalesOutcome
    ) -> int:
        result = await db.execute(
            select(func.count(ConversationAnalysis.id)).join(
                Conversation, ConversationAnalysis.conversation_id == Conversation.id
            ).where(
                and_(
                    Conversation.tenant_id == tenant_id,
                    Conversation.created_at >= start,
                    Conversation.created_at < end,
                    ConversationAnalysis.sales_outcome == outcome,
                )
            )
        )
        return result.scalar() or 0

    async def _get_outcome_breakdown(
        self, db: AsyncSession, tenant_id: str, start: datetime, end: datetime
    ) -> dict:
        result = await db.execute(
            select(
                ConversationAnalysis.sales_outcome,
                func.count(ConversationAnalysis.id),
            ).join(
                Conversation, ConversationAnalysis.conversation_id == Conversation.id
            ).where(
                and_(
                    Conversation.tenant_id == tenant_id,
                    Conversation.created_at >= start,
                    Conversation.created_at < end,
                )
            ).group_by(ConversationAnalysis.sales_outcome)
        )
        return {str(row[0].value) if row[0] else "unknown": row[1] for row in result.all()}

    async def _get_sentiment_breakdown(
        self, db: AsyncSession, tenant_id: str, start: datetime, end: datetime
    ) -> dict:
        result = await db.execute(
            select(
                ConversationAnalysis.sentiment,
                func.count(ConversationAnalysis.id),
            ).join(
                Conversation, ConversationAnalysis.conversation_id == Conversation.id
            ).where(
                and_(
                    Conversation.tenant_id == tenant_id,
                    Conversation.created_at >= start,
                    Conversation.created_at < end,
                )
            ).group_by(ConversationAnalysis.sentiment)
        )
        return {str(row[0].value) if row[0] else "unknown": row[1] for row in result.all()}

    async def _get_channel_breakdown(
        self, db: AsyncSession, tenant_id: str, start: datetime, end: datetime
    ) -> dict:
        result = await db.execute(
            select(
                Conversation.channel,
                func.count(Conversation.id),
            ).where(
                and_(
                    Conversation.tenant_id == tenant_id,
                    Conversation.created_at >= start,
                    Conversation.created_at < end,
                )
            ).group_by(Conversation.channel)
        )
        return {str(row[0].value) if row[0] else "unknown": row[1] for row in result.all()}

    async def _get_common_objections(
        self, db: AsyncSession, tenant_id: str, start: datetime, end: datetime
    ) -> list:
        result = await db.execute(
            select(ConversationAnalysis.objections_raised).join(
                Conversation, ConversationAnalysis.conversation_id == Conversation.id
            ).where(
                and_(
                    Conversation.tenant_id == tenant_id,
                    Conversation.created_at >= start,
                    Conversation.created_at < end,
                    ConversationAnalysis.objections_raised.isnot(None),
                )
            )
        )
        all_objections = []
        for row in result.all():
            if row[0]:
                all_objections.extend(row[0] if isinstance(row[0], list) else [])

        # Count and sort
        from collections import Counter
        counter = Counter(all_objections)
        return [obj for obj, _ in counter.most_common(10)]

    async def _get_top_conversations(
        self, db: AsyncSession, tenant_id: str, start: datetime, end: datetime
    ) -> list:
        result = await db.execute(
            select(
                Conversation.contact_name,
                ConversationAnalysis.lead_score,
                ConversationAnalysis.sales_outcome,
                ConversationAnalysis.summary,
            ).join(
                ConversationAnalysis, ConversationAnalysis.conversation_id == Conversation.id
            ).where(
                and_(
                    Conversation.tenant_id == tenant_id,
                    Conversation.created_at >= start,
                    Conversation.created_at < end,
                )
            ).order_by(ConversationAnalysis.lead_score.desc()).limit(5)
        )
        return [
            {
                "contact": row[0] or "Unknown",
                "score": row[1] or 0,
                "outcome": str(row[2].value) if row[2] else "unknown",
                "summary": row[3] or "",
            }
            for row in result.all()
        ]

    async def _get_voice_summary(
        self, db: AsyncSession, tenant_id: str, start: datetime, end: datetime
    ) -> str:
        result = await db.execute(
            select(func.count(VoiceAnalysis.id)).join(
                Conversation, VoiceAnalysis.conversation_id == Conversation.id
            ).where(
                and_(
                    Conversation.tenant_id == tenant_id,
                    VoiceAnalysis.created_at >= start,
                    VoiceAnalysis.created_at < end,
                )
            )
        )
        voice_count = result.scalar() or 0
        return f"{voice_count} voice messages analyzed today" if voice_count > 0 else ""

    async def _get_comparison(self, db: AsyncSession, tenant_id: str, current_date: datetime) -> dict:
        yesterday = current_date - timedelta(days=1)
        yesterday_end = current_date

        yesterday_convos = await self._count_conversations(db, tenant_id, yesterday, yesterday_end)

        # 7-day average
        week_start = current_date - timedelta(days=7)
        week_convos = await self._count_conversations(db, tenant_id, week_start, current_date)
        avg_7d = round(week_convos / 7, 1) if week_convos else 0

        return {
            "vs_yesterday_conversations": yesterday_convos,
            "avg_7d_conversations": avg_7d,
        }

    async def _save_report(
        self, db: AsyncSession, tenant_id: str, report_date: datetime, report: dict
    ) -> None:
        db_report = DailyReport(
            tenant_id=tenant_id,
            report_date=report_date,
            total_conversations=report["summary"]["total_conversations"],
            conversations_handled=report["summary"]["conversations_handled"],
            conversations_missed=report["summary"]["conversations_missed"],
            conversion_rate=report["summary"]["conversion_rate"],
            common_objections=report.get("common_objections"),
            voice_summary=report.get("voice_summary"),
            comparison_data=report.get("comparison"),
            full_report=report,
        )
        db.add(db_report)
        await db.flush()


# Singleton instance
report_generator = ReportGenerator()
