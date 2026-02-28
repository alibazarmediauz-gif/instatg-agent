"""
Meta Webhooks Route

Unified webhook receiver for all Facebook and Instagram events.
Validates HMAC signatures, logs events to EventLog, routes to channel handlers.
"""

import structlog
from fastapi import APIRouter, Request, Response, HTTPException, Query, BackgroundTasks
from typing import Dict, Any

from app.config import settings
from app.services.webhook_security import verify_signature

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/webhooks/meta", tags=["Meta Webhooks"])


@router.get("")
async def verify_meta_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
) -> Response:
    """Verify the Meta webhook subscription (GET challenge)."""
    if hub_mode == "subscribe" and hub_verify_token == settings.meta_verify_token:
        logger.info("meta_webhook_verified")
        return Response(content=hub_challenge, media_type="text/plain")

    logger.warning("meta_webhook_verification_failed", mode=hub_mode)
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("")
async def receive_meta_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
) -> Dict[str, Any]:
    """
    Receive incoming Meta events (Facebook and Instagram).
    Validates signature, logs event, routes to appropriate channel handler.
    """
    # Read raw body for signature verification
    raw_body = await request.body()

    # Verify HMAC signature
    signature = request.headers.get("X-Hub-Signature-256", "")
    if settings.meta_app_secret and not verify_signature(raw_body, signature):
        logger.warning("meta_webhook_invalid_signature")
        raise HTTPException(status_code=403, detail="Invalid signature")

    try:
        import json
        body = json.loads(raw_body)
        logger.debug("meta_webhook_received", object=body.get("object"))

        obj_type = body.get("object", "")

        if obj_type not in ("page", "instagram"):
            return {"status": "ok", "message": "unsupported object type"}

        # Process each entry
        for entry in body.get("entry", []):
            page_id = entry.get("id", "")
            platform = "instagram" if obj_type == "instagram" else "facebook"

            # ── DM Messages ──
            for messaging_event in entry.get("messaging", []):
                sender_id = messaging_event.get("sender", {}).get("id", "")
                background_tasks.add_task(
                    _process_and_log_event,
                    platform=platform,
                    event_type="message",
                    page_id=page_id,
                    sender_id=sender_id,
                    payload=messaging_event,
                )

            # ── Comments (feed changes) ──
            for change in entry.get("changes", []):
                field = change.get("field", "")
                if field in ("feed", "comments"):
                    value = change.get("value", {})
                    sender_id = value.get("from", {}).get("id", "")
                    background_tasks.add_task(
                        _process_and_log_event,
                        platform=platform,
                        event_type="comment",
                        page_id=page_id,
                        sender_id=sender_id,
                        payload=value,
                    )

        return {"status": "ok", "processed": True}

    except Exception as e:
        logger.error("meta_webhook_error", error=str(e))
        return {"status": "error", "message": str(e)}


async def _process_and_log_event(
    platform: str,
    event_type: str,
    page_id: str,
    sender_id: str,
    payload: dict,
):
    """Background task: log the event to EventLog, then route to channel handler."""
    from app.database import async_session_factory
    from app.models import EventLog, FacebookAccount, InstagramAccount
    from sqlalchemy import select
    from datetime import datetime

    async with async_session_factory() as db:
        try:
            # Identify tenant from page_id
            tenant_id = None
            if platform == "facebook":
                result = await db.execute(
                    select(FacebookAccount).where(FacebookAccount.page_id == page_id)
                )
                account = result.scalar_one_or_none()
                if account:
                    tenant_id = str(account.tenant_id)
                    account.last_webhook_at = datetime.utcnow()
            else:
                result = await db.execute(
                    select(InstagramAccount).where(InstagramAccount.instagram_user_id == page_id)
                )
                account = result.scalar_one_or_none()
                if account:
                    tenant_id = str(account.tenant_id)
                    account.last_webhook_at = datetime.utcnow()

            # Log to EventLog
            event_log = EventLog(
                tenant_id=tenant_id,
                platform=platform,
                event_type=event_type,
                payload=payload,
                page_id=page_id,
                sender_id=sender_id,
                ig_user_id=page_id if platform == "instagram" else None,
                processed=False,
            )
            db.add(event_log)
            await db.commit()

            # Route to existing channel handlers
            if event_type == "message":
                if platform == "facebook":
                    from app.channels.facebook import _process_messaging_event
                    await _process_messaging_event(payload)
                else:
                    from app.channels.instagram import _process_messaging_event
                    await _process_messaging_event(payload)

            elif event_type == "comment":
                if platform == "facebook":
                    from app.channels.facebook import _process_comment_event
                    await _process_comment_event(page_id, payload)
                else:
                    from app.channels.instagram import _process_comment_event
                    await _process_comment_event(page_id, payload)

            # Mark as processed
            event_log.processed = True
            await db.commit()

        except Exception as e:
            logger.error(
                "meta_event_processing_error",
                error=str(e),
                platform=platform,
                event_type=event_type,
                page_id=page_id,
            )
            # Try to mark the error
            try:
                if event_log:
                    event_log.error_message = str(e)
                    await db.commit()
            except Exception:
                pass
