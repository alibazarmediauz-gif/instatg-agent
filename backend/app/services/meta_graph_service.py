"""
Meta Graph API Service

Provides reliable message-sending functions for both Facebook Messenger
and Instagram DMs with exponential backoff retry logic and rate-limit handling.
"""

import asyncio
import httpx
import structlog
from typing import Optional

from app.config import settings

logger = structlog.get_logger(__name__)

GRAPH_API_URL = f"https://graph.facebook.com/{settings.graph_api_version}"

MAX_RETRIES = 3
BASE_DELAY = 1.0  # seconds


async def _request_with_retry(
    method: str,
    url: str,
    access_token: str,
    payload: Optional[dict] = None,
    params: Optional[dict] = None,
) -> dict:
    """
    Make a Graph API request with exponential backoff retry logic.
    Handles 429 (rate limit) and 5xx errors with retries.
    """
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    last_error = None

    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                if method == "POST":
                    response = await client.post(url, json=payload, headers=headers)
                else:
                    response = await client.get(url, params=params, headers=headers)

                if response.status_code == 200:
                    return {"success": True, "data": response.json()}

                # Rate limited — wait and retry
                if response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", BASE_DELAY * (2 ** attempt)))
                    logger.warning("meta_rate_limited", retry_after=retry_after, attempt=attempt)
                    await asyncio.sleep(retry_after)
                    continue

                # Server error — retry with backoff
                if response.status_code >= 500:
                    delay = BASE_DELAY * (2 ** attempt)
                    logger.warning("meta_server_error", status=response.status_code, delay=delay)
                    await asyncio.sleep(delay)
                    continue

                # Client error — don't retry
                logger.error("meta_api_error", status=response.status_code, body=response.text)
                return {"success": False, "error": response.text, "status": response.status_code}

        except httpx.TimeoutException:
            delay = BASE_DELAY * (2 ** attempt)
            logger.warning("meta_api_timeout", attempt=attempt, delay=delay)
            last_error = "Request timed out"
            await asyncio.sleep(delay)
        except Exception as e:
            last_error = str(e)
            logger.error("meta_api_exception", error=str(e), attempt=attempt)
            break

    return {"success": False, "error": last_error or "Max retries exceeded"}


async def send_fb_message(
    recipient_id: str,
    text: str,
    access_token: str,
) -> dict:
    """Send a Facebook Messenger message with retry logic."""
    url = f"{GRAPH_API_URL}/me/messages"
    payload = {
        "recipient": {"id": recipient_id},
        "message": {"text": text},
        "messaging_type": "RESPONSE",
    }

    result = await _request_with_retry("POST", url, access_token, payload=payload)

    if result["success"]:
        logger.info("fb_message_sent", recipient=recipient_id)
    else:
        logger.error("fb_message_failed", recipient=recipient_id, error=result.get("error"))

    return result


async def send_ig_message(
    recipient_id: str,
    text: str,
    access_token: str,
) -> dict:
    """Send an Instagram DM message with retry logic."""
    url = f"{GRAPH_API_URL}/me/messages"
    payload = {
        "recipient": {"id": recipient_id},
        "message": {"text": text},
    }

    result = await _request_with_retry("POST", url, access_token, payload=payload)

    if result["success"]:
        logger.info("ig_message_sent", recipient=recipient_id)
    else:
        logger.error("ig_message_failed", recipient=recipient_id, error=result.get("error"))

    return result


async def reply_to_comment(
    comment_id: str,
    text: str,
    access_token: str,
    platform: str = "facebook",
) -> dict:
    """Reply to a Facebook or Instagram comment publicly."""
    endpoint = "comments" if platform == "facebook" else "replies"
    url = f"{GRAPH_API_URL}/{comment_id}/{endpoint}"
    payload = {"message": text}

    result = await _request_with_retry("POST", url, access_token, payload=payload)

    if result["success"]:
        logger.info(f"{platform}_comment_reply_sent", comment_id=comment_id)
    else:
        logger.error(f"{platform}_comment_reply_failed", comment_id=comment_id, error=result.get("error"))

    return result


async def validate_token(access_token: str, asset_id: str) -> dict:
    """Validate a token by calling a cheap Graph API endpoint."""
    url = f"{GRAPH_API_URL}/{asset_id}"
    params = {"fields": "id,name", "access_token": access_token}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, params=params)
            if response.status_code == 200:
                return {"valid": True, "data": response.json()}
            return {"valid": False, "error": response.text}
    except Exception as e:
        return {"valid": False, "error": str(e)}
