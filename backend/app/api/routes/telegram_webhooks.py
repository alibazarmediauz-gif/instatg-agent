from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import structlog
from uuid import UUID

from app.database import get_db
from app.agents.claude_agent import ClaudeAgent
from app.models import Lead, ChatAgent

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
    try:
        data = await request.json()
        logger.info("telegram_bot_webhook_received", tenant_id=str(tenant_id), data=data)
        
        if "message" not in data or "text" not in data["message"]:
            return {"status": "ok"}
            
        message = data["message"]
        chat_id = message["chat"]["id"]
        text = message["text"]
        user_data = message.get("from", {})

        # 1. Identify or Create Lead
        from sqlalchemy import select
        
        lead_result = await db.execute(
            select(Lead).where(Lead.tenant_id == tenant_id, Lead.phone == str(chat_id))
        )
        lead = lead_result.scalar_one_or_none()
        
        if not lead:
            lead = Lead(
                tenant_id=tenant_id,
                name=user_data.get("first_name", "Telegram User"),
                phone=str(chat_id),
                source="telegram_bot",
                status="new"
            )
            db.add(lead)
            await db.commit()
            await db.refresh(lead)

        # 2. Process with Claude Agent
        # Fetch agent config if exists
        agent_result = await db.execute(
            select(ChatAgent).where(ChatAgent.tenant_id == tenant_id, ChatAgent.channel == "telegram")
        )
        chat_agent_config = agent_result.scalar_one_or_none()
        
        system_prompt = chat_agent_config.system_prompt if chat_agent_config else "You are a helpful sales assistant. Respond in Uzbek or Russian."
        
        ai_agent = ClaudeAgent()
        response_text = await ai_agent.generate_response(
            message=text,
            chat_history=[], # Needs implementation in production
            system_prompt=system_prompt
        )

        # 3. Log interaction and Return
        logger.info("telegram_bot_response_generated", lead_id=str(lead.id), response=response_text)
        
        return {"status": "ok", "response": response_text}
        
    except Exception as e:
        logger.error("telegram_bot_webhook_error", error=str(e))
        return {"status": "error", "message": str(e)}

@router.post("/bot")
async def telegram_bot_webhook_legacy(request: Request):
    """Fallback for non-parameterized webhook if needed."""
    return {"status": "ok", "message": "Please use /bot/{tenant_id} endpoint"}
