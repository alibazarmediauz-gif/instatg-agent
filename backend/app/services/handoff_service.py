import structlog
from app.api.routes.notifications import create_and_dispatch_notification
from app.memory.context import memory

logger = structlog.get_logger(__name__)

class HandoffService:
    """Manages the escalation of conversations from AI to Human agents."""

    @staticmethod
    async def trigger_handoff(
        tenant_id: str,
        contact_id: str,
        reason: str,
        channel: str = "telegram",
        contact_name: str = "Unknown"
    ):
        """
        Escalates a conversation to a human operator.
        1. Marks the conversation as handoff-needed in Redis.
        2. Dispatches an in-app notification.
        3. Sends a Telegram alert to the business owner.
        """
        logger.warning("handoff_triggered", tenant=tenant_id, contact=contact_id, reason=reason)

        # 1. Update Redis state to block AI response
        await memory.set_human_handoff(tenant_id, contact_id, True)

        # 2. Dispatch In-App Notification (SSE + DB)
        await create_and_dispatch_notification(
            tenant_id=tenant_id,
            title="🆘 Human Handoff Required",
            message=f"Contact {contact_name} requires assistance on {channel}. Reason: {reason}",
            type="warning",
            link="/conversations"
        )

        # 3. Send Telegram Alert to Owner
        await HandoffService._send_telegram_alert(tenant_id, contact_name, channel, reason)

    @staticmethod
    async def _send_telegram_alert(tenant_id: str, contact_name: str, channel: str, reason: str):
        """Helper to send Telegram message to owner."""
        try:
            from app.channels.telegram import active_clients
            from app.database import async_session_factory
            from app.models import Tenant
            from sqlalchemy import select

            async with async_session_factory() as db:
                result = await db.execute(select(Tenant.owner_telegram_chat_id).where(Tenant.id == tenant_id))
                chat_id = result.scalar_one_or_none()

            if not chat_id:
                logger.warning("handoff_owner_chat_id_missing", tenant=tenant_id)
                return

            client = active_clients.get(tenant_id)
            if client:
                alert_text = (
                    f"🆘 *HUMAN HANDOFF ALERT*\n\n"
                    f"👤 *Customer:* {contact_name}\n"
                    f"🔌 *Channel:* {channel.capitalize()}\n"
                    f"📝 *Reason:* {reason}\n\n"
                    f"⚠️ AI has paused for this conversation. Please step in via the dashboard."
                )
                await client.send_message(chat_id, alert_text, parse_mode="markdown")
                logger.info("handoff_telegram_alert_sent", tenant=tenant_id, chat_id=chat_id)
            else:
                logger.warning("handoff_tg_client_not_ready", tenant=tenant_id)

        except Exception as e:
            logger.error("handoff_notification_failed", error=str(e), tenant=tenant_id)

handoff_service = HandoffService()
