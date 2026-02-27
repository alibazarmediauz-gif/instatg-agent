from fastapi import APIRouter, Request, Query, HTTPException
import structlog
import hashlib
import hmac
from typing import Dict, Any

from app.config import settings
from app.channels.telegram import active_clients # Or a generic channel router

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])

@router.get("/meta")
async def verify_meta_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge")
):
    """VERIFY hook for Facebook / Instagram Meta Graph API."""
    if hub_mode == "subscribe" and hub_verify_token == settings.secret_key:
        logger.info("meta_webhook_verified")
        return int(hub_challenge)
    
    logger.warning("meta_webhook_verification_failed")
    raise HTTPException(status_code=403, detail="Verification token mismatch")

@router.post("/meta")
async def process_meta_webhook(request: Request):
    """PROCESS incoming data from Facebook/Instagram."""
    # Verify X-Hub-Signature-256 in production
    payload = await request.json()
    
    logger.info("meta_webhook_received", payload=payload)
    
    # Logic to route message to appropriate agent
    # entry -> messaging -> message
    
    return {"status": "event_received"}

@router.post("/telegram/custom")
async def telegram_webhook(payload: Dict[str, Any]):
    """Optional custom webhook handler for Telegram Bots (if not using Pyrogram)."""
    logger.info("telegram_custom_webhook", payload=payload)
    return {"ok": True}
