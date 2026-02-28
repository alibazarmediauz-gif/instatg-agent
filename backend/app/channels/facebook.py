"""
InstaTG Agent — Facebook Channel (Meta Graph API)

Handles Facebook Page messages (Messenger) and Facebook post comments.
Supports text/image messages via Messenger, and comment-to-DM conversion.
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

router = APIRouter(prefix="/webhooks/facebook", tags=["Facebook Webhooks"])

# Facebook Graph API base URL
GRAPH_API_URL = "https://graph.facebook.com/v19.0"

# ─── Product inquiry keywords ────────────────────────────────────────
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


# ─── Account registry (loaded from DB on startup) ────────────────────

_facebook_accounts: dict[str, dict] = {}
# Format: { page_id: { "tenant_id": "...", "access_token": "...", "page_name": "..." } }


def register_facebook_account(
    page_id: str,
    tenant_id: str,
    access_token: str,
    page_name: str = "",
) -> None:
    """Register a Facebook Page for webhook handling."""
    _facebook_accounts[page_id] = {
        "tenant_id": tenant_id,
        "access_token": access_token,
        "page_name": page_name or "Facebook Business",
    }
    logger.info("facebook_account_registered", page_id=page_id, tenant=tenant_id)


def get_page_by_id(page_id: str) -> Optional[dict]:
    """Look up account config by Page ID."""
    return _facebook_accounts.get(page_id)


# ─── Webhook Endpoints ───────────────────────────────────────────────

@router.get("")
async def webhook_verify(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
) -> Response:
    """
    Facebook webhook verification (GET challenge).
    Same pattern as Instagram — Meta sends this on subscription.
    """
    verify_token = settings.meta_verify_token
    if hub_mode == "subscribe" and hub_verify_token == verify_token:
        logger.info("facebook_webhook_verified")
        return Response(content=hub_challenge, media_type="text/plain")

    logger.warning("facebook_webhook_verification_failed", mode=hub_mode)
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("")
async def webhook_receive(request: Request) -> dict:
    """
    Receive incoming Facebook events.
    Handles both Messenger messages and page feed comments.
    """
    try:
        body = await request.json()
        logger.debug("facebook_webhook_received", body=body)

        obj_type = body.get("object", "")

        for entry in body.get("entry", []):
            # ── Messenger DMs ──
            for messaging_event in entry.get("messaging", []):
                await _process_messaging_event(messaging_event)

            # ── Page Feed Comments ──
            for change in entry.get("changes", []):
                if change.get("field") == "feed":
                    await _process_comment_event(entry.get("id", ""), change.get("value", {}))

        return {"status": "ok"}

    except Exception as e:
        logger.error("facebook_webhook_error", error=str(e))
        return {"status": "error", "message": str(e)}


# ─── Messenger Message Processing ───────────────────────────────────

async def _process_messaging_event(event: dict) -> None:
    """Process a single Facebook Messenger event."""
    sender_id = event.get("sender", {}).get("id", "")
    recipient_id = event.get("recipient", {}).get("id", "")
    message_data = event.get("message", {})

    if not sender_id or not message_data:
        return

    account = get_page_by_id(recipient_id)
    if not account:
        logger.warning("facebook_unknown_page", recipient=recipient_id)
        return

    # Skip echo messages from our own page
    if sender_id == recipient_id:
        return
    if message_data.get("is_echo"):
        return

    tenant_id = account["tenant_id"]
    access_token = account["access_token"]
    business_name = account["page_name"]

    logger.info(
        "facebook_dm_received",
        tenant=tenant_id,
        sender=sender_id,
        has_text="text" in message_data,
    )

    try:
        from app.api.routes.notifications import create_and_dispatch_notification
        await create_and_dispatch_notification(
            tenant_id=tenant_id,
            title="New Facebook Message",
            message=f"From {sender_id}",
            type="info",
            link="/conversations"
        )
    except Exception as e:
        logger.error("facebook_notification_error", error=str(e), tenant=tenant_id)

    try:
        if "text" in message_data:
            await _handle_text_message(
                tenant_id=tenant_id,
                sender_id=sender_id,
                text=message_data["text"],
                access_token=access_token,
                business_name=business_name,
            )

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
        logger.error("facebook_processing_error", error=str(e), tenant=tenant_id, sender=sender_id)


async def _handle_text_message(
    tenant_id: str, sender_id: str, text: str,
    access_token: str, business_name: str,
) -> None:
    """Handle incoming Messenger text and reply."""
    response = await agent.generate_response(
        tenant_id=tenant_id,
        contact_id=f"fb_{sender_id}",
        user_message=text,
        message_type="text",
        business_name=business_name,
    )

    if response.reply_text and not response.human_handoff:
        await _send_messenger_message(sender_id, response.reply_text, access_token)


async def _handle_attachment(
    tenant_id: str, sender_id: str, attachment: dict,
    access_token: str, business_name: str,
) -> None:
    """Handle incoming attachment (image, video, etc.)."""
    attachment_type = attachment.get("type", "")
    payload = attachment.get("payload", {})
    url = payload.get("url", "")

    if not url:
        return

    if attachment_type == "image":
        async with httpx.AsyncClient() as http:
            img_response = await http.get(url, timeout=30)
            if img_response.status_code == 200:
                image_data = img_response.content
                vision_result = await vision.analyze_image(image_data, media_type="image/jpeg")

                response = await agent.generate_response(
                    tenant_id=tenant_id,
                    contact_id=f"fb_{sender_id}",
                    user_message=f"[Image: {vision_result.description}]",
                    message_type="image",
                    business_name=business_name,
                    image_data=[vision.get_image_base64(image_data)],
                )

                if response.reply_text and not response.human_handoff:
                    await _send_messenger_message(sender_id, response.reply_text, access_token)
    else:
        response = await agent.generate_response(
            tenant_id=tenant_id,
            contact_id=f"fb_{sender_id}",
            user_message=f"[Customer sent a {attachment_type}]",
            message_type="text",
            business_name=business_name,
        )

        if response.reply_text and not response.human_handoff:
            await _send_messenger_message(sender_id, response.reply_text, access_token)


# ─── Comment Processing (Facebook Feed) ──────────────────────────────

def is_product_inquiry(text: str) -> bool:
    """
    Detect if a comment text is a product-related inquiry.
    Uses keyword matching for fast detection.
    """
    text_lower = text.lower()
    matches = sum(1 for kw in PRODUCT_KEYWORDS if kw in text_lower)
    # At least 1 keyword match, or text is a question
    return matches >= 1 or "?" in text


async def _process_comment_event(page_id: str, value: dict) -> None:
    """
    Process a Facebook page feed comment event.
    
    When someone comments on a post asking about a product:
    1. Reply to the comment publicly (social proof)
    2. Send a private DM to the commenter (sales conversion)
    """
    item = value.get("item", "")
    verb = value.get("verb", "")
    
    # Only process new comments (not edits/removes)
    if item != "comment" or verb != "add":
        return

    comment_id = value.get("comment_id", "")
    comment_text = value.get("message", "")
    sender_id = value.get("from", {}).get("id", "")
    sender_name = value.get("from", {}).get("name", "Unknown")
    post_id = value.get("post_id", "")

    if not comment_text or not sender_id or not comment_id:
        return

    account = get_page_by_id(page_id)
    if not account:
        logger.warning("facebook_comment_unknown_page", page_id=page_id)
        return

    # Skip comments from our own page
    if sender_id == page_id:
        return

    tenant_id = account["tenant_id"]
    access_token = account["access_token"]
    business_name = account["page_name"]

    logger.info(
        "facebook_comment_received",
        tenant=tenant_id,
        sender=sender_id,
        sender_name=sender_name,
        comment_text=comment_text[:100],
        is_inquiry=is_product_inquiry(comment_text),
    )

    # Check if this is a product inquiry
    if not is_product_inquiry(comment_text):
        logger.debug("facebook_comment_not_inquiry", text=comment_text[:80])
        return

    try:
        # Step 1: Generate a public reply to the comment
        public_response = await agent.generate_response(
            tenant_id=tenant_id,
            contact_id=f"fb_comment_{sender_id}",
            user_message=f"[PUBLIC COMMENT on our post] {sender_name} wrote: \"{comment_text}\"",
            message_type="text",
            business_name=business_name,
            custom_persona=(
                "You are replying to a PUBLIC comment on a social media post. "
                "Keep your reply SHORT (1-2 sentences), friendly, and helpful. "
                "Invite them to DM for more details. Example: "
                "'Great question! We have this available. I'll send you the details in DM 📩'"
            ),
        )

        if public_response.reply_text:
            await _reply_to_comment(comment_id, public_response.reply_text, access_token)

        # Step 2: Send a private DM with sales pitch
        dm_response = await agent.generate_response(
            tenant_id=tenant_id,
            contact_id=f"fb_{sender_id}",
            user_message=f"[PRIVATE DM follow-up] This customer commented on our post: \"{comment_text}\". Start a sales conversation based on their interest.",
            message_type="text",
            business_name=business_name,
            custom_persona=(
                "You are following up on a customer's public comment about your product. "
                "They showed interest publicly. Now send them a personalized private message. "
                "Be warm, reference what they asked about, offer specific product details, "
                "and guide them toward a purchase. Include pricing if relevant."
            ),
        )

        if dm_response.reply_text and not dm_response.human_handoff:
            await _send_messenger_message(sender_id, dm_response.reply_text, access_token)
            logger.info("facebook_comment_dm_sent", sender=sender_id, comment=comment_text[:50])

    except Exception as e:
        logger.error("facebook_comment_processing_error", error=str(e), sender=sender_id)


# ─── Send Message APIs ──────────────────────────────────────────────

from app.utils.media_parser import parse_media_tags

async def _send_messenger_message(recipient_id: str, text: str, access_token: str) -> bool:
    """Send a message via Facebook Messenger (Page messages API)."""
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
                    "messaging_type": "RESPONSE",
                }
                res = await http.post(url, json=payload, headers=headers, timeout=15)
                if res.status_code != 200:
                    logger.error("facebook_text_send_error", status=res.status_code, body=res.text)
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
                    "messaging_type": "RESPONSE",
                }
                res = await http.post(url, json=payload, headers=headers, timeout=15)
                if res.status_code != 200:
                    logger.error("facebook_img_send_error", status=res.status_code, body=res.text)
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
                    "messaging_type": "RESPONSE",
                }
                res = await http.post(url, json=payload, headers=headers, timeout=15)
                if res.status_code != 200:
                    logger.error("facebook_vid_send_error", status=res.status_code, body=res.text)
                    success = False

            if success:
                logger.info("facebook_message_sent", recipient=recipient_id)
            return success

    except Exception as e:
        logger.error("facebook_send_exception", error=str(e), recipient=recipient_id)
        return False


async def _reply_to_comment(comment_id: str, text: str, access_token: str) -> bool:
    """Reply to a Facebook comment publicly."""
    url = f"{GRAPH_API_URL}/{comment_id}/comments"
    payload = {"message": text}
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient() as http:
            response = await http.post(url, json=payload, headers=headers, timeout=15)

            if response.status_code == 200:
                logger.info("facebook_comment_reply_sent", comment_id=comment_id)
                return True
            else:
                logger.error("facebook_comment_reply_error", status=response.status_code, body=response.text)
                return False

    except Exception as e:
        logger.error("facebook_comment_reply_exception", error=str(e))
        return False
