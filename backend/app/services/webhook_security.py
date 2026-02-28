"""
Webhook Security Service

Validates incoming Meta webhook payloads using HMAC SHA256
signature verification against the META_APP_SECRET.
"""

import hashlib
import hmac
import structlog

from app.config import settings

logger = structlog.get_logger(__name__)


def verify_signature(raw_body: bytes, signature_header: str) -> bool:
    """
    Verify the X-Hub-Signature-256 header from Meta webhooks.

    Args:
        raw_body: The raw request body bytes
        signature_header: The X-Hub-Signature-256 header value (e.g. "sha256=abc123...")

    Returns:
        True if signature is valid, False otherwise
    """
    if not signature_header:
        logger.warning("webhook_missing_signature")
        return False

    if not settings.meta_app_secret:
        logger.warning("webhook_no_app_secret_configured")
        return True  # Skip validation if secret not configured (dev mode)

    try:
        # Header format: "sha256=<hex_digest>"
        parts = signature_header.split("=", 1)
        if len(parts) != 2 or parts[0] != "sha256":
            logger.warning("webhook_invalid_signature_format", header=signature_header[:20])
            return False

        received_signature = parts[1]

        # Compute expected signature
        expected_signature = hmac.new(
            key=settings.meta_app_secret.encode("utf-8"),
            msg=raw_body,
            digestmod=hashlib.sha256,
        ).hexdigest()

        # Constant-time comparison to prevent timing attacks
        is_valid = hmac.compare_digest(received_signature, expected_signature)

        if not is_valid:
            logger.warning("webhook_signature_mismatch")

        return is_valid

    except Exception as e:
        logger.error("webhook_signature_verification_error", error=str(e))
        return False
