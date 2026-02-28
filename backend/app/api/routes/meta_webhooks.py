"""
Meta Webhooks Route — Unified Instagram + Facebook Messenger

Single endpoint for all Meta webhook events.
- Signature verification using RAW body bytes
- Supports: messaging, standby, message_reactions, comments, live_comments
- Debug logging for signature troubleshooting
"""

import hmac
import hashlib
import json
import structlog
from fastapi import APIRouter, Request, Response, HTTPException, Query, BackgroundTasks
from typing import Dict, Any

from app.config import settings

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/webhooks/meta", tags=["Meta Webhooks"])


# ─── GET: Webhook Verification ────────────────────────────────────────
@router.get("")
async def verify_meta_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
) -> Response:
    """Verify the Meta webhook subscription (GET challenge)."""
    if hub_mode == "subscribe" and hub_verify_token == settings.meta_verify_token:
        logger.info("META_WEBHOOK_VERIFIED", challenge=hub_challenge)
        return Response(content=hub_challenge, media_type="text/plain")

    logger.warning("META_WEBHOOK_VERIFY_FAILED", mode=hub_mode)
    raise HTTPException(status_code=403, detail="Verification failed")


# ─── POST: Receive Webhook Events ─────────────────────────────────────
@router.post("")
async def receive_meta_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
) -> Dict[str, Any]:
    """
    Receive incoming Meta events (Instagram + Facebook Messenger).
    1. Read RAW body once
    2. Verify HMAC SHA256 signature
    3. Parse JSON only after verification
    """

    # ── Step 1: Read RAW body (only once, never call request.json()) ──
    raw_body = await request.body()

    # ── Step 2: Get signature header (case-insensitive) ──
    signature = (
        request.headers.get("x-hub-signature-256")
        or request.headers.get("X-Hub-Signature-256")
    )

    # ── Step 3: Verify HMAC SHA256 ──
    if settings.meta_app_secret:
        if not signature:
            logger.warning("META_WEBHOOK_MISSING_SIGNATURE")
            raise HTTPException(status_code=403, detail="Missing signature")

        expected_signature = "sha256=" + hmac.new(
            settings.meta_app_secret.encode(),
            raw_body,
            hashlib.sha256,
        ).hexdigest()

        # Debug logging (temporary — remove after confirming fix)
        secret = settings.meta_app_secret
        secret_hint = f"{secret[:4]}...{secret[-4:]}" if len(secret) > 8 else "TOO_SHORT"
        logger.info("META_WEBHOOK_RECEIVED")
        logger.info(f"Signature header: {signature}")
        logger.info(f"Expected signature: {expected_signature}")
        logger.info(f"Body length: {len(raw_body)}")
        logger.info(f"Secret hint: {secret_hint} (len={len(secret)})")
        logger.info(f"Raw body first 100 chars: {raw_body[:100]}")

        # Constant-time comparison
        if not hmac.compare_digest(signature, expected_signature):
            logger.warning("META_WEBHOOK_SIGNATURE_MISMATCH")
            raise HTTPException(status_code=403, detail="Invalid signature")
    else:
        logger.warning("META_WEBHOOK_NO_SECRET_CONFIGURED — skipping verification")

    # ── Step 4: Parse JSON only AFTER verification ──
    try:
        body = json.loads(raw_body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    obj_type = body.get("object", "")
    logger.info("META_WEBHOOK_PARSED", object_type=obj_type)

    # ── Step 5: Route by object type ──
    if obj_type == "page":
        # Facebook Messenger
        _route_entries(body, "facebook", background_tasks)
    elif obj_type == "instagram":
        # Instagram
        _route_entries(body, "instagram", background_tasks)
    else:
        logger.info("META_WEBHOOK_UNSUPPORTED_OBJECT", object_type=obj_type)

    return {"status": "ok"}


# ─── Event Router ─────────────────────────────────────────────────────

def _route_entries(body: dict, platform: str, background_tasks: BackgroundTasks):
    """Route all entries to background processing."""
    for entry in body.get("entry", []):
        page_id = entry.get("id", "")

        # ── DM Messages (messaging) ──
        for event in entry.get("messaging", []):
            sender_id = event.get("sender", {}).get("id", "")
            background_tasks.add_task(
                _process_and_log_event,
                platform=platform,
                event_type="message",
                page_id=page_id,
                sender_id=sender_id,
                payload=event,
            )

        # ── Standby (messaging_handovers) ──
        for event in entry.get("standby", []):
            sender_id = event.get("sender", {}).get("id", "")
            background_tasks.add_task(
                _process_and_log_event,
                platform=platform,
                event_type="standby",
                page_id=page_id,
                sender_id=sender_id,
                payload=event,
            )

        # ── Message Reactions ──
        for event in entry.get("message_reactions", []):
            sender_id = event.get("sender", {}).get("id", "")
            background_tasks.add_task(
                _process_and_log_event,
                platform=platform,
                event_type="reaction",
                page_id=page_id,
                sender_id=sender_id,
                payload=event,
            )

        # ── Comments + Live Comments (changes) ──
        for change in entry.get("changes", []):
            field = change.get("field", "")
            if field in ("feed", "comments", "live_comments"):
                value = change.get("value", {})
                sender_id = value.get("from", {}).get("id", "")
                background_tasks.add_task(
                    _process_and_log_event,
                    platform=platform,
                    event_type="comment" if field != "live_comments" else "live_comment",
                    page_id=page_id,
                    sender_id=sender_id,
                    payload=value,
                )


# ─── Background Processing ────────────────────────────────────────────

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
        event_log = None
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

            # Route to existing channel handlers (only for messages and comments)
            if event_type == "message":
                if platform == "facebook":
                    from app.channels.facebook import _process_messaging_event
                    await _process_messaging_event(payload)
                else:
                    from app.channels.instagram import _process_messaging_event
                    await _process_messaging_event(payload)

            elif event_type in ("comment", "live_comment"):
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
                "META_EVENT_PROCESSING_ERROR",
                error=str(e),
                platform=platform,
                event_type=event_type,
                page_id=page_id,
            )
            try:
                if event_log:
                    event_log.error_message = str(e)
                    await db.commit()
            except Exception:
                pass
