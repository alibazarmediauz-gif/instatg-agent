import structlog
import asyncio
from typing import List, Dict, Any
from uuid import UUID
from datetime import datetime
from app.database import async_session_factory
from app.models import Lead, Campaign, VoiceAgent, ChatAgent
from sqlalchemy import select, update

logger = structlog.get_logger(__name__)

class CampaignEngine:
    """
    Background worker to execute multi-channel outbound campaigns.
    Handles scheduling, lead selection, and agent triggering.
    """
    def __init__(self):
        self._running_tasks: Dict[str, asyncio.Task] = {}

    async def start_campaign(self, tenant_id: UUID, campaign_id: str):
        """Start a campaign processing loop in the background."""
        if campaign_id in self._running_tasks:
            return

        task = asyncio.create_task(self._process_campaign(tenant_id, campaign_id))
        self._running_tasks[campaign_id] = task
        logger.info("campaign_started", campaign_id=campaign_id)

    async def _process_campaign(self, tenant_id: UUID, campaign_id: str):
        """Internal worker to delegate campaign processing to Celery."""
        try:
            from celery_worker import execute_campaign_batch_task
            
            # Instead of a local loop, we trigger a Celery task that handles batches.
            # The Celery task will recursively or via beat schedule continue until done.
            logger.info("delegating_campaign_to_celery", campaign_id=campaign_id)
            
            # Simple delegation: trigger the first batch
            execute_campaign_batch_task.delay(str(tenant_id), str(campaign_id))
            
        except ImportError:
            logger.error("celery_not_found_falling_back_to_local")
            # Fallback to local processing if Celery is not available (demo mode)
            async with async_session_factory() as db:
                result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
                campaign = result.scalar_one_or_none()
                if campaign:
                    campaign.status = "error"
                    campaign.error_message = "Celery worker not found for distributed processing"
                    await db.commit()
    
    async def stop_campaign(self, campaign_id: str):
        """Cancel a running campaign task."""
        async with async_session_factory() as db:
            result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
            campaign = result.scalar_one_or_none()
            if campaign:
                campaign.status = "paused"
                await db.commit()
        
        if campaign_id in self._running_tasks:
            self._running_tasks[campaign_id].cancel()
            del self._running_tasks[campaign_id]
            logger.info("campaign_stopped", campaign_id=campaign_id)

    async def generate_ab_variants(self, tenant_id: str, campaign_id: str, base_message: str):
        """Use AI to generate high-converting variations of a campaign message."""
        from app.agents.claude_agent import agent
        import json

        prompt = f"""Generate 3 high-converting variations of the following sales outreach message in the same language.
        Focus on different 'hooks': one curiosity-based, one value-based, and one direct.
        Base message: {base_message}
        
        Return ONLY a JSON object with the following structure:
        {{"variants": [
            {{"hook": "Curiosity|Value|Direct", "body": "varied message text"}}
        ]}}"""

        try:
            # Direct call to Claude for clean JSON generation
            response = await agent.client.messages.create(
                model=agent.model,
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            variants_data = json.loads(response.content[0].text)
            
            async with async_session_factory() as db:
                await db.execute(
                    update(Campaign)
                    .where(Campaign.id == campaign_id)
                    .values(ab_variants=variants_data)
                )
                await db.commit()
            
            logger.info("ab_variants_generated", campaign_id=campaign_id)
            return variants_data
        except Exception as e:
            logger.error("ab_generation_failed", error=str(e), campaign_id=campaign_id)
            return None

campaign_engine = CampaignEngine()
