import structlog
from fastapi import APIRouter, Request, Response, HTTPException, Query, BackgroundTasks
from typing import Dict, Any, List

from app.config import settings

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/webhooks/meta", tags=["Meta Webhooks"])

@router.get("")
async def verify_meta_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
) -> Response:
    """
    Verify the Meta webhook subscription.
    """
    if hub_mode == "subscribe" and hub_verify_token == settings.meta_verify_token:
        logger.info("meta_webhook_verified")
        return Response(content=hub_challenge, media_type="text/plain")

    logger.warning("meta_webhook_verification_failed", mode=hub_mode)
    raise HTTPException(status_code=403, detail="Verification failed")


from app.services.chat_ai_service.engine import process_message

@router.post("")
async def receive_meta_webhook(request: Request, background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """
    Receive incoming Meta events (Facebook and Instagram).
    Normalizes the payload and triggers AI responses.
    """
    try:
        body = await request.json()
        logger.debug("meta_webhook_received_raw", payload=body)

        if body.get("object") != "page" and body.get("object") != "instagram":
            return {"status": "ok", "message": "unsupported object"}

        from app.database import async_session_factory
        from app.models import InstagramAccount, ChatAgent, Lead
        from sqlalchemy import select
        from app.agents.claude_agent import ClaudeAgent

        for entry in body.get("entry", []):
            page_id = entry.get("id")
            
            for messaging_event in entry.get("messaging", []):
                sender_id = messaging_event.get("sender", {}).get("id", "")
                message_data = messaging_event.get("message", {})
                text = message_data.get("text", "")
                
                if not text:
                    continue

                # 1. Background Task for AI Processing
                background_tasks.add_task(
                    process_instagram_ai_response,
                    page_id=page_id,
                    sender_id=sender_id,
                    text=text
                )

        return {"status": "ok", "processed": True}

    except Exception as e:
        logger.error("meta_webhook_error", error=str(e))
        return {"status": "error", "message": str(e)}


async def process_instagram_ai_response(page_id: str, sender_id: str, text: str):
    """
    Background worker to identify tenant, manage lead, and generate AI response.
    """
    from app.database import async_session_factory
    from app.models import InstagramAccount, ChatAgent, Lead
    from sqlalchemy import select
    from app.agents.claude_agent import ClaudeAgent
    import httpx

    async with async_session_factory() as db:
        try:
            # 1. Identify Tenant
            result = await db.execute(
                select(InstagramAccount).where(InstagramAccount.page_id == page_id)
            )
            account = result.scalar_one_or_none()
            if not account:
                logger.warning("meta_webhook_tenant_not_found", page_id=page_id)
                return

            tenant_id = account.tenant_id

            # 2. Sync Lead
            lead_result = await db.execute(
                select(Lead).where(Lead.tenant_id == tenant_id, Lead.phone == sender_id) # Reuse phone field for PSID
            )
            lead = lead_result.scalar_one_or_none()
            if not lead:
                lead = Lead(
                    tenant_id=tenant_id,
                    name=f"IG User {sender_id[:6]}",
                    phone=sender_id,
                    source="instagram",
                    status="new"
                )
                db.add(lead)
                await db.commit()

            # 3. Generate AI Response
            agent_result = await db.execute(
                select(ChatAgent).where(ChatAgent.tenant_id == tenant_id, ChatAgent.channel == "instagram")
            )
            config = agent_result.scalar_one_or_none()
            system_prompt = config.system_prompt if config else "You are an AI sales assistant for an Uzbekistan business. Use Uzbek or Russian."

            ai = ClaudeAgent()
            response_text = await ai.generate_response(
                message=text,
                chat_history=[],
                system_prompt=system_prompt
            )

            # 4. Send back via Meta Graph API (Placeholder for production utility)
            logger.info("meta_ai_response_ready", tenant_id=str(tenant_id), response=response_text)
            
            # if account.access_token:
            #     url = f"https://graph.facebook.com/v19.0/me/messages?access_token={account.access_token}"
            #     payload = {"recipient": {"id": sender_id}, "message": {"text": response_text}}
            #     async with httpx.AsyncClient() as client:
            #         await client.post(url, json=payload)

        except Exception as e:
            logger.error("process_instagram_ai_response_error", error=str(e))

