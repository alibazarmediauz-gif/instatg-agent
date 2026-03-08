"""
WhatsApp Channel (Meta Business API)
Handles incoming WhatsApp messages and sends AI replies.
"""

import httpx
import structlog
from fastapi import APIRouter, Request, HTTPException, Query
from app.config import settings
from app.agents.claude_agent import agent

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/webhooks/whatsapp", tags=["WhatsApp"])

@router.get("")
async def verify_whatsapp(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge")
):
    if hub_mode == "subscribe" and hub_verify_token == settings.meta_verify_token:
        return hub_challenge
    raise HTTPException(status_code=403)

@router.post("")
async def receive_whatsapp(request: Request):
    data = await request.json()
    logger.info("whatsapp_webhook_received", data=data)
    
    # Process WhatsApp business messages
    for entry in data.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for message in value.get("messages", []):
                sender_id = message.get("from")
                text = message.get("text", {}).get("body", "")
                
                # Logic to determine tenant_id from phonenumber_id
                # For now, we assume a single tenant or look it up
                tenant_id = "default_tenant" 
                
                await _handle_whatsapp_message(tenant_id, sender_id, text)
                
    return {"status": "ok"}

async def _handle_whatsapp_message(tenant_id: str, sender_id: str, text: str):
    from app.services.automation_engine import process_automation_flow
    from app.services.message_storage import storage
    
    # Get/Create conversation
    convo_id = await storage.get_or_create_conversation(
        tenant_id=tenant_id,
        channel="whatsapp",
        contact_id=sender_id,
        contact_name=f"WA User {sender_id}"
    )
    # Store incoming msg
    await storage.store_message(convo_id, "user", text)

    async def _auto_reply(reply_text: str):
        success = await send_whatsapp_message(sender_id, reply_text)
        if success:
            await storage.store_message(convo_id, "assistant", reply_text)

    # 1. CRM SYNC
    try:
        from app.database import async_session_factory
        from app.crm.amocrm import get_crm_client
        async with async_session_factory() as db:
            crm = await get_crm_client(tenant_id, db)
            if crm:
                await crm.auto_create_lead_if_new(
                    name=f"WA User {sender_id}",
                    phone=sender_id,
                    channel="WhatsApp",
                    first_message=text
                )
    except Exception as e:
        logger.error("wa_crm_sync_failed", error=str(e))

    # 2. Automation Flow
    handled = await process_automation_flow(
        tenant_id=tenant_id,
        message_text=text,
        platform="whatsapp",
        user_id=sender_id,
        send_message_func=_auto_reply
    )

    if not handled:
        # 3. AI Agent
        resp = await agent.generate_response(
            tenant_id=tenant_id,
            contact_id=f"wa_{sender_id}",
            user_message=text,
            message_type="text"
        )
        if resp.reply_text:
            await _auto_reply(resp.reply_text)

async def send_whatsapp_message(to: str, text: str):
    """Call Meta WhatsApp Cloud API."""
    url = f"https://graph.facebook.com/v19.0/{settings.wa_phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {settings.wa_access_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": text}
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(url, json=payload, headers=headers)
        if res.status_code == 200:
            return True
        else:
            logger.error("whatsapp_send_failed", status=res.status_code, body=res.text)
            return False
