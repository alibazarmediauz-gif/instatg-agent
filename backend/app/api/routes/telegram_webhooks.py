from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import structlog
from uuid import UUID
import httpx

from app.database import get_db
from app.models import Lead
from app.channels.telegram import active_bots

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/webhooks/telegram", tags=["Webhooks"])

@router.post("/bot/{tenant_id}")
async def telegram_bot_webhook(
    tenant_id: UUID,
    request: Request, 
    db: AsyncSession = Depends(get_db)
):
    """
    Handle incoming messages from Telegram Bot API for a specific tenant.
    """
    tenant_id_str = str(tenant_id)

    try:
        data = await request.json()
        
        if "message" not in data or "text" not in data["message"]:
             # Also acknowledge edited_message / callback_query gracefully
            return {"status": "ok"}
            
        message = data["message"]
        chat_id = message["chat"]["id"]
        text = message["text"]
        user_data = message.get("from", {})

        logger.info("telegram_bot_message_received", tenant=tenant_id_str, chat_id=chat_id, text=text)

        # 1. Identify or Create Lead
        lead_result = await db.execute(
            select(Lead).where(Lead.tenant_id == tenant_id, Lead.phone == str(chat_id))
        )
        lead = lead_result.scalar_one_or_none()
        
        contact_name = user_data.get("first_name", "Telegram User")
        if user_data.get("last_name"):
            contact_name += f" {user_data.get('last_name')}"

        if not lead:
            lead = Lead(
                tenant_id=tenant_id,
                name=contact_name,
                phone=str(chat_id),
                source="telegram_bot",
                status="new"
            )
            db.add(lead)
            await db.commit()
            await db.refresh(lead)

        # 2. Setup Reply Function 
        # (needs the bot token cached in memory)
        async def _auto_reply(reply_text: str):
            bot_data = active_bots.get(tenant_id_str)
            if not bot_data:
                logger.error("telegram_bot_token_not_in_memory", tenant=tenant_id_str)
                return

            token = bot_data["access_token"]
            url = f"https://api.telegram.org/bot{token}/sendMessage"
            
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json={
                    "chat_id": chat_id,
                    "text": reply_text
                })
                if res.status_code != 200:
                    logger.error("telegram_bot_send_failed", response=res.text)

        # 3. Process with Automation Flow (which routes to AI Agent if needed)
        from app.services.automation_engine import process_automation_flow
        
        handled = await process_automation_flow(
            tenant_id=tenant_id_str,
            message_text=text,
            platform="telegram",
            user_id=str(chat_id),
            send_message_func=_auto_reply
        )
        
        # 4. Fallback to Claude Agent directly if automation didn't handle it
        if not handled:
            from app.agents.claude_agent import agent
            response = await agent.generate_response(
                tenant_id=tenant_id_str, 
                contact_id=str(chat_id),
                user_message=text, 
                message_type="text",
                business_name="Business", # Will be pulled from DB inside agent
            )
            if response.reply_text and not response.human_handoff:
                await _auto_reply(response.reply_text)

        return {"status": "ok"}
        
    except Exception as e:
        logger.error("telegram_bot_webhook_error", error=str(e), tenant=tenant_id_str)
        # Always return 200 OK so Telegram stops retrying the bad payload
        return {"status": "error", "message": str(e)}

@router.post("/bot")
async def telegram_bot_webhook_legacy(request: Request):
    """Fallback for non-parameterized webhook if needed."""
    return {"status": "ok"}
