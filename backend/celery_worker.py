"""
InstaTG Agent — Celery Worker

Async task processing for message handling, conversation analysis,
CRM syncing, and scheduled daily reports.
"""

import asyncio
from datetime import datetime

from celery import Celery
from celery.schedules import crontab

from app.config import settings

# ─── Celery App ───────────────────────────────────────────────────────

celery_app = Celery(
    "instatg_agent",
    broker=settings.celery_broker_url,
    backend=settings.celery_broker_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone=settings.daily_report_timezone,
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_soft_time_limit=300,
    task_time_limit=600,
)


# ─── Beat Schedule ───────────────────────────────────────────────────

celery_app.conf.beat_schedule = {
    "generate-daily-reports": {
        "task": "celery_worker.generate_daily_report_task",
        "schedule": crontab(hour=settings.daily_report_hour, minute=0),
    },
    "check-inactive-conversations": {
        "task": "celery_worker.check_inactive_conversations_task",
        "schedule": crontab(minute="*/30"),  # Every 30 minutes
    },
    "check-cold-leads": {
        "task": "celery_worker.check_cold_leads_task",
        "schedule": crontab(hour="*/6", minute=0),  # Every 6 hours
    },
    "trigger-follow-up-campaigns": {
        "task": "celery_worker.check_follow_up_campaigns_task",
        "schedule": crontab(minute="*/15"),  # Every 15 minutes
    },
}


# ─── Helper to run async in sync context ─────────────────────────────

def run_async(coro):
    """Run async coroutine in Celery sync worker."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


# ─── Tasks ────────────────────────────────────────────────────────────

@celery_app.task(name="celery_worker.analyze_conversation_task", bind=True, max_retries=3)
def analyze_conversation_task(self, tenant_id: str, contact_id: str):
    """Score and analyze a conversation after inactivity."""
    try:
        from app.analytics.scorer import scorer
        result = run_async(scorer.score_conversation(tenant_id, contact_id))

        if result and not result.get("error"):
            # Save to database
            _save_analysis(tenant_id, contact_id, result)

        return result

    except Exception as exc:
        self.retry(exc=exc, countdown=60)


@celery_app.task(name="celery_worker.generate_daily_report_task", bind=True, max_retries=2)
def generate_daily_report_task(self, tenant_id: str = None):
    """Generate daily reports for all tenants or a specific tenant."""
    try:
        from app.analytics.reports import report_generator
        from app.database import async_session_factory
        from app.models import Tenant
        from sqlalchemy import select

        async def _generate():
            async with async_session_factory() as db:
                if tenant_id:
                    tenant_ids = [tenant_id]
                else:
                    result = await db.execute(
                        select(Tenant.id).where(Tenant.is_active == True)
                    )
                    tenant_ids = [str(row[0]) for row in result.all()]

                reports = []
                for tid in tenant_ids:
                    try:
                        report = await report_generator.generate_daily_report(db, tid)
                        reports.append(report)

                        # Send to Telegram if owner has chat_id
                        await _send_report_to_telegram(db, tid, report)

                    except Exception as e:
                        import structlog
                        logger = structlog.get_logger(__name__)
                        logger.error("report_generation_failed", tenant=tid, error=str(e))

                await db.commit()
                return reports

        return run_async(_generate())

    except Exception as exc:
        self.retry(exc=exc, countdown=300)


@celery_app.task(name="celery_worker.check_inactive_conversations_task")
def check_inactive_conversations_task():
    """Check for inactive conversations and score them."""
    from app.analytics.scorer import scorer
    from app.database import async_session_factory
    from app.models import Conversation
    from sqlalchemy import select, and_
    from datetime import timedelta

    async def _check():
        async with async_session_factory() as db:
            threshold = datetime.utcnow() - timedelta(hours=2)
            result = await db.execute(
                select(Conversation).where(
                    and_(
                        Conversation.is_active == True,
                        Conversation.last_message_at <= threshold,
                        Conversation.last_message_at.isnot(None),
                    )
                ).limit(50)
            )

            conversations = result.scalars().all()
            for conv in conversations:
                analysis = await scorer.score_conversation(
                    str(conv.tenant_id), conv.contact_id
                )
                if analysis and not analysis.get("error"):
                    _save_analysis(str(conv.tenant_id), conv.contact_id, analysis)
                    conv.is_active = False

            await db.commit()

    run_async(_check())


@celery_app.task(name="celery_worker.check_cold_leads_task")
def check_cold_leads_task():
    """Move cold leads (no reply 24h) to follow-up stage in AmoCRM."""
    from app.crm.amocrm import crm
    from app.database import async_session_factory
    from app.models import Conversation, CRMLead, LeadStage
    from sqlalchemy import select, and_
    from datetime import timedelta

    async def _check():
        if not crm.is_configured:
            return

        async with async_session_factory() as db:
            threshold = datetime.utcnow() - timedelta(hours=24)
            result = await db.execute(
                select(Conversation).where(
                    and_(
                        Conversation.is_active == True,
                        Conversation.last_message_at <= threshold,
                        Conversation.crm_lead_id.isnot(None),
                    )
                ).limit(50)
            )

            conversations = result.scalars().all()
            for conv in conversations:
                try:
                    await crm.move_lead_to_stage(conv.crm_lead_id, "follow_up")
                except Exception:
                    pass

            await db.commit()

    run_async(_check())


@celery_app.task(name="celery_worker.execute_campaign_batch_task", bind=True, max_retries=3)
def execute_campaign_batch_task(self, tenant_id: str, campaign_id: str):
    """Distributed task to process a campaign batch."""
    from app.database import async_session_factory
    from app.models import Campaign, Lead
    from sqlalchemy import select
    import structlog

    logger = structlog.get_logger(__name__)

    async def _process():
        async with async_session_factory() as db:
            # 1. Fetch Campaign
            result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
            campaign = result.scalar_one_or_none()
            if not campaign or campaign.status != "running":
                return {"status": "skipped", "reason": "Campaign not running"}

            # 2. Fetch Pending Leads
            leads_result = await db.execute(
                select(Lead).where(
                    Lead.tenant_id == tenant_id,
                    Lead.status == "new" 
                ).limit(50) # Batch size for worker
            )
            leads = leads_result.scalars().all()

            if not leads:
                campaign.status = "completed"
                await db.commit()
                return {"status": "completed"}

            for lead in leads:
                try:
                    target_number = lead.contact_info.get("phone") or lead.contact_number
                    if not target_number:
                        continue

                    # Dispatch based on channel
                    if campaign.channel == "voice":
                        from app.telephony.telephony_bridge import telephony_bridge
                        await telephony_bridge.dispatch_call(
                            provider_name="local_uz", # Default for UZ market
                            from_number="+998901234567", # Mocked
                            to_number=target_number,
                            agent_id=str(campaign.agent_id)
                        )
                    elif campaign.channel == "telegram":
                        from app.channels.telegram import active_clients
                        client = active_clients.get(str(tenant_id))
                        if client:
                            message = f"Assalomu alaykum! Men {campaign.agent_name}. {campaign.name} bo'yicha sizga yozmoqdaman."
                            await client.send_message(target_number, message)
                    
                    campaign.called += 1
                    await db.commit()
                except Exception as e:
                    logger.error("celery_campaign_dispatch_error", error=str(e), lead_id=str(lead.id))

            return {"status": "batch_processed", "count": len(leads)}

    try:
        return run_async(_process())
    except Exception as exc:
        self.retry(exc=exc, countdown=60)


@celery_app.task(name="celery_worker.sync_crm_lead_task")
def sync_crm_lead_task(
    tenant_id: str,
    contact_name: str,
    contact_username: str,
    channel: str,
    first_message: str,
):
    """Create a new lead in AmoCRM."""
    from app.crm.amocrm import crm

    async def _sync():
        return await crm.auto_create_lead_if_new(
            tenant_id=tenant_id,
            contact_name=contact_name,
            contact_username=contact_username,
            channel=channel,
            first_message=first_message,
        )

    return run_async(_sync())


# ─── Helpers ──────────────────────────────────────────────────────────

def _save_analysis(tenant_id: str, contact_id: str, analysis: dict):
    """Save conversation analysis to database."""
    from app.database import async_session_factory
    from app.models import Conversation, ConversationAnalysis, SalesOutcome, SentimentType
    from sqlalchemy import select, and_

    async def _save():
        async with async_session_factory() as db:
            result = await db.execute(
                select(Conversation).where(
                    and_(
                        Conversation.tenant_id == tenant_id,
                        Conversation.contact_id == contact_id,
                    )
                ).order_by(Conversation.created_at.desc()).limit(1)
            )
            conversation = result.scalar_one_or_none()

            if not conversation:
                return

            # Create or update analysis
            existing_result = await db.execute(
                select(ConversationAnalysis).where(
                    ConversationAnalysis.conversation_id == conversation.id
                )
            )
            existing = existing_result.scalar_one_or_none()

            sentiment_map = {
                "positive": SentimentType.POSITIVE,
                "negative": SentimentType.NEGATIVE,
                "neutral": SentimentType.NEUTRAL,
            }
            outcome_map = {
                "won": SalesOutcome.WON,
                "lost": SalesOutcome.LOST,
                "in_progress": SalesOutcome.IN_PROGRESS,
                "not_qualified": SalesOutcome.NOT_QUALIFIED,
            }

            if existing:
                existing.sentiment = sentiment_map.get(analysis.get("sentiment"), SentimentType.NEUTRAL)
                existing.lead_score = analysis.get("lead_score", 0)
                existing.sales_outcome = outcome_map.get(analysis.get("sales_outcome"), SalesOutcome.IN_PROGRESS)
                existing.key_topics = analysis.get("key_topics", [])
                existing.objections_raised = analysis.get("objections_raised", [])
                existing.objection_handling = analysis.get("objection_handling", [])
                existing.recommended_action = analysis.get("recommended_action", "")
                existing.summary = analysis.get("summary", "")
                existing.raw_analysis = analysis
            else:
                db_analysis = ConversationAnalysis(
                    conversation_id=conversation.id,
                    sentiment=sentiment_map.get(analysis.get("sentiment"), SentimentType.NEUTRAL),
                    lead_score=analysis.get("lead_score", 0),
                    sales_outcome=outcome_map.get(analysis.get("sales_outcome"), SalesOutcome.IN_PROGRESS),
                    key_topics=analysis.get("key_topics", []),
                    objections_raised=analysis.get("objections_raised", []),
                    objection_handling=analysis.get("objection_handling", []),
                    recommended_action=analysis.get("recommended_action", ""),
                    summary=analysis.get("summary", ""),
                    raw_analysis=analysis,
                )
                db.add(db_analysis)

            await db.commit()

    run_async(_save())


async def _send_report_to_telegram(db, tenant_id: str, report: dict):
    """Send daily report to tenant owner via Telegram."""
    from app.models import Tenant
    from app.analytics.reports import report_generator
    from sqlalchemy import select

    result = await db.execute(
        select(Tenant).where(Tenant.id == tenant_id)
    )
    tenant = result.scalar_one_or_none()

    if tenant and tenant.owner_telegram_chat_id:
        try:
            from pyrogram import Client
            from app.channels.telegram import active_clients

            # Find an active client for this tenant
            client = active_clients.get(str(tenant_id))
            if client:
                message = report_generator.format_telegram_report(report)
                await client.send_message(
                    chat_id=int(tenant.owner_telegram_chat_id),
                    text=message,
                    parse_mode=None,
                )
        except Exception:
            pass
