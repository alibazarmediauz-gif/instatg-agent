"""
InstaTG Agent — Instagram Channel (Meta Graph API)

Handles Instagram Business DMs and post/reel comments via webhooks.
Supports text and image messages, replies via Send Message API.
Detects product inquiries in comments and auto-sends DMs.
"""

import httpx
import structlog
from typing import Optional

from fastapi import APIRouter, Request, Response, HTTPException, Query

from app.config import settings
from app.agents.claude_agent import agent
from app.agents.vision import vision
from app.memory.context import memory

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/webhooks/instagram", tags=["Instagram Webhooks"])

# Instagram Graph API base URL
GRAPH_API_URL = "https://graph.facebook.com/v19.0"


# ─── Account registry (loaded from DB on startup) ────────────────────

_instagram_accounts: dict[str, dict] = {}
# Format: { instagram_user_id: { "tenant_id": "...", "access_token": "...", "page_id": "..." } }

# Product inquiry keywords shared with facebook.py
PRODUCT_KEYWORDS = [
    "narx", "price", "qancha", "how much", "стоимость", "цена", "сколько",
    "sotib", "buy", "купить", "order", "zakaz", "заказ",
    "mavjud", "available", "есть ли", "bor mi", "bormi",
    "qayerda", "where", "где",
    "yetkazib", "deliver", "доставка", "доставите",
    "chegirma", "discount", "скидка", "aksiya", "акция",
    "mahsulot", "product", "товар", "tovar",
    "katalog", "catalog", "каталог",
    "model", "razmer", "size", "rang", "color", "цвет", "размер",
]


def register_instagram_account(
    instagram_user_id: str,
    tenant_id: str,
    access_token: str,
    page_id: str,
    display_name: str = "",
) -> None:
    """Register an Instagram account for webhook handling."""
    _instagram_accounts[instagram_user_id] = {
        "tenant_id": tenant_id,
        "access_token": access_token,
        "page_id": page_id,
        "display_name": display_name or "Instagram Business",
    }
    logger.info("instagram_account_registered", user_id=instagram_user_id, tenant=tenant_id)


def get_account_by_id(instagram_user_id: str) -> Optional[dict]:
    """Look up account config by Instagram user ID."""
    return _instagram_accounts.get(instagram_user_id)


# ─── Webhook Endpoints ───────────────────────────────────────────────

@router.get("")
async def webhook_verify(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
) -> Response:
    """
    Instagram webhook verification (GET challenge).
    Meta sends this when you first subscribe to webhooks.
    """
    if hub_mode == "subscribe" and hub_verify_token == settings.meta_verify_token:
        logger.info("instagram_webhook_verified")
        return Response(content=hub_challenge, media_type="text/plain")

    logger.warning("instagram_webhook_verification_failed", mode=hub_mode)
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("")
async def webhook_receive(request: Request) -> dict:
    """
    Receive incoming Instagram DM events.
    Processes messages and sends AI-generated replies.
    """
    try:
        body = await request.json()
        logger.debug("instagram_webhook_received", body=body)

        # Process each entry
        for entry in body.get("entry", []):
            # ── DM messages ──
            for messaging_event in entry.get("messaging", []):
                await _process_messaging_event(messaging_event)

            # ── Comments on posts/reels ──
            for change in entry.get("changes", []):
                if change.get("field") == "comments":
                    await _process_comment_event(entry.get("id", ""), change.get("value", {}))

        return {"status": "ok"}

    except Exception as e:
        logger.error("instagram_webhook_error", error=str(e))
        return {"status": "error", "message": str(e)}


# ─── Message Processing ──────────────────────────────────────────────

async def _process_messaging_event(event: dict) -> None:
    """Process a single Instagram messaging event."""
    sender_id = event.get("sender", {}).get("id", "")
    recipient_id = event.get("recipient", {}).get("id", "")
    message_data = event.get("message", {})

    if not sender_id or not message_data:
        return

    # Look up the Instagram account
    account = get_account_by_id(recipient_id)
    if not account:
        logger.warning("instagram_unknown_recipient", recipient=recipient_id)
        return

    # Skip if sender is our own page (avoid echo)
    if sender_id == recipient_id:
        return

    tenant_id = account["tenant_id"]
    access_token = account["access_token"]
    business_name = account["display_name"]

    logger.info(
        "instagram_dm_received",
        tenant=tenant_id,
        sender=sender_id,
        has_text="text" in message_data,
        has_attachments="attachments" in message_data,
    )

    try:
        from app.api.routes.notifications import create_and_dispatch_notification
        await create_and_dispatch_notification(
            tenant_id=tenant_id,
            title="New Instagram Message",
            message=f"From {sender_id}",
            type="info",
            link="/conversations"
        )
    except Exception as e:
        logger.error("instagram_notification_error", error=str(e), tenant=tenant_id)

    try:
        # Handle text message
        if "text" in message_data:
            await _handle_text_message(
                tenant_id=tenant_id,
                sender_id=sender_id,
                text=message_data["text"],
                access_token=access_token,
                business_name=business_name,
            )

        # Handle attachments (images, etc.)
        if "attachments" in message_data:
            for attachment in message_data["attachments"]:
                await _handle_attachment(
                    tenant_id=tenant_id,
                    sender_id=sender_id,
                    attachment=attachment,
                    access_token=access_token,
                    business_name=business_name,
                )

    except Exception as e:
        logger.error(
            "instagram_processing_error",
            error=str(e),
            tenant=tenant_id,
            sender=sender_id,
        )


async def _handle_text_message(
    tenant_id: str,
    sender_id: str,
    text: str,
    access_token: str,
    business_name: str,
) -> None:
    """Handle incoming text DM and reply."""
    response = await agent.generate_response(
        tenant_id=tenant_id,
        contact_id=f"ig_{sender_id}",
        user_message=text,
        message_type="text",
        business_name=business_name,
    )

    if response.reply_text and not response.human_handoff:
        await _send_instagram_message(sender_id, response.reply_text, access_token)


async def _handle_attachment(
    tenant_id: str,
    sender_id: str,
    attachment: dict,
    access_token: str,
    business_name: str,
) -> None:
    """Handle incoming attachment (image, video, etc.)."""
    attachment_type = attachment.get("type", "")
    payload = attachment.get("payload", {})
    url = payload.get("url", "")

    if not url:
        logger.warning("instagram_attachment_no_url", type=attachment_type)
        return

    if attachment_type == "image":
        # Download and analyze image
        async with httpx.AsyncClient() as http:
            img_response = await http.get(url, timeout=30)
            if img_response.status_code == 200:
                image_data = img_response.content
                vision_result = await vision.analyze_image(image_data, media_type="image/jpeg")

                response = await agent.generate_response(
                    tenant_id=tenant_id,
                    contact_id=f"ig_{sender_id}",
                    user_message=f"[Image: {vision_result.description}]",
                    message_type="image",
                    business_name=business_name,
                    image_data=[vision.get_image_base64(image_data)],
                )

                if response.reply_text and not response.human_handoff:
                    await _send_instagram_message(sender_id, response.reply_text, access_token)
    else:
        # Fallback for other attachment types
        response = await agent.generate_response(
            tenant_id=tenant_id,
            contact_id=f"ig_{sender_id}",
            user_message=f"[Customer sent a {attachment_type}]",
            message_type="text",
            business_name=business_name,
        )

        if response.reply_text and not response.human_handoff:
            await _send_instagram_message(sender_id, response.reply_text, access_token)


# ─── Send Message API ────────────────────────────────────────────────

from app.utils.media_parser import parse_media_tags

async def _send_instagram_message(
    recipient_id: str,
    text: str,
    access_token: str,
) -> bool:
    """
    Send a message to an Instagram user via the Graph API.
    
    Returns True if successful.
    """
    if not text:
        return False

    clean_text, image_urls, video_urls = parse_media_tags(text)
    url = f"{GRAPH_API_URL}/me/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    
    success = True

    try:
        async with httpx.AsyncClient() as http:
            # 1. Send Text if present
            if clean_text:
                payload = {
                    "recipient": {"id": recipient_id},
                    "message": {"text": clean_text},
                }
                res = await http.post(url, json=payload, headers=headers, timeout=15)
                if res.status_code != 200:
                    logger.error("instagram_text_send_error", status=res.status_code, body=res.text)
                    success = False

            # 2. Send Images
            for img_url in image_urls:
                payload = {
                    "recipient": {"id": recipient_id},
                    "message": {
                        "attachment": {
                            "type": "image",
                            "payload": {"url": img_url, "is_reusable": True}
                        }
                    },
                }
                res = await http.post(url, json=payload, headers=headers, timeout=15)
                if res.status_code != 200:
                    logger.error("instagram_img_send_error", status=res.status_code, body=res.text)
                    success = False

            # 3. Send Videos 
            for vid_url in video_urls:
                payload = {
                    "recipient": {"id": recipient_id},
                    "message": {
                        "attachment": {
                            "type": "video",
                            "payload": {"url": vid_url, "is_reusable": True}
                        }
                    },
                }
                res = await http.post(url, json=payload, headers=headers, timeout=15)
                if res.status_code != 200:
                    logger.error("instagram_vid_send_error", status=res.status_code, body=res.text)
                    success = False

            if success:
                logger.info("instagram_message_sent", recipient=recipient_id)
            return success

    except Exception as e:
        logger.error("instagram_send_exception", error=str(e), recipient=recipient_id)
        return False


# ─── Comment Processing ──────────────────────────────────────────────

def is_product_inquiry(text: str) -> bool:
    """Detect if a comment is a product-related inquiry."""
    text_lower = text.lower()
    matches = sum(1 for kw in PRODUCT_KEYWORDS if kw in text_lower)
    return matches >= 1 or "?" in text


async def _process_comment_event(ig_user_id: str, value: dict) -> None:
    """
    Process an Instagram comment webhook event.
    
    When someone comments on a post asking about a product:
    1. Reply to the comment publicly (social proof)
    2. Send a private DM to the commenter (sales conversion)
    """
    comment_id = value.get("id", "")
    comment_text = value.get("text", "")
    sender_id = value.get("from", {}).get("id", "")
    sender_name = value.get("from", {}).get("username", "Unknown")
    media_id = value.get("media", {}).get("id", "")

    if not comment_text or not sender_id or not comment_id:
        return

    account = get_account_by_id(ig_user_id)
    if not account:
        logger.warning("instagram_comment_unknown_account", ig_user_id=ig_user_id)
        return

    # Skip our own comments
    if sender_id == ig_user_id:
        return

    tenant_id = account["tenant_id"]
    access_token = account["access_token"]
    business_name = account["display_name"]

    logger.info(
        "instagram_comment_received",
        tenant=tenant_id,
        sender=sender_id,
        sender_name=sender_name,
        comment_text=comment_text[:100],
        is_inquiry=is_product_inquiry(comment_text),
    )

    if not is_product_inquiry(comment_text):
        logger.debug("instagram_comment_not_inquiry", text=comment_text[:80])
        return

    try:
        # Step 1: Public reply to the comment
        public_response = await agent.generate_response(
            tenant_id=tenant_id,
            contact_id=f"ig_comment_{sender_id}",
            user_message=f'[PUBLIC COMMENT on our post] @{sender_name} wrote: "{comment_text}"',
            message_type="text",
            business_name=business_name,
            custom_persona=(
                "You are replying to a PUBLIC comment on an Instagram post. "
                "Keep your reply SHORT (1-2 sentences), friendly, and helpful. "
                "Invite them to DM for details. Example: "
                "'Great question! I'll send you the details in DM 📩'"
            ),
        )

        if public_response.reply_text:
            await _reply_to_ig_comment(comment_id, public_response.reply_text, access_token)

        # Step 2: Private DM with sales pitch
        dm_response = await agent.generate_response(
            tenant_id=tenant_id,
            contact_id=f"ig_{sender_id}",
            user_message=f'[PRIVATE DM follow-up] @{sender_name} commented on our post: "{comment_text}". Start a sales conversation.',
            message_type="text",
            business_name=business_name,
            custom_persona=(
                "You are following up on a customer's public comment. "
                "They showed interest publicly. Send a personalized private message. "
                "Be warm, reference what they asked, offer product details and pricing."
            ),
        )

        if dm_response.reply_text and not dm_response.human_handoff:
            await _send_instagram_message(sender_id, dm_response.reply_text, access_token)
            logger.info("instagram_comment_dm_sent", sender=sender_id, comment=comment_text[:50])

    except Exception as e:
        logger.error("instagram_comment_processing_error", error=str(e), sender=sender_id)


async def _reply_to_ig_comment(comment_id: str, text: str, access_token: str) -> bool:
    """Reply to an Instagram comment publicly."""
    url = f"{GRAPH_API_URL}/{comment_id}/replies"
    payload = {"message": text}
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient() as http:
            response = await http.post(url, json=payload, headers=headers, timeout=15)

            if response.status_code == 200:
                logger.info("instagram_comment_reply_sent", comment_id=comment_id)
                return True
            else:
                logger.error("instagram_comment_reply_error", status=response.status_code, body=response.text)
                return False

    except Exception as e:
        logger.error("instagram_comment_reply_exception", error=str(e))
        return False
