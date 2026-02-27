"""
InstaTG Agent — Telegram Channel (Pyrogram Userbot)

Dedicated business Telegram account per tenant.
Each tenant has ONE phone number for business use with Telegram Premium.
Supports OTP-based session creation, encrypted session storage.
Handles all incoming private DMs: text, voice, image, video, documents.
"""

import os
import asyncio
import tempfile
import structlog
from datetime import datetime
from typing import Optional

from cryptography.fernet import Fernet
from pyrogram import Client, filters
from pyrogram.types import Message
from pyrogram.enums import MessageMediaType

from app.config import settings
from app.agents.claude_agent import agent
from app.agents.voice_analyzer import voice_analyzer
from app.agents.vision import vision
from app.memory.context import memory
from app.models import ChannelType

logger = structlog.get_logger(__name__)

# Active Pyrogram clients, keyed by tenant_id
active_clients: dict[str, Client] = {}

# Pending OTP verifications — stores temporary Client instances awaiting OTP
_pending_otp: dict[str, dict] = {}

# ─── Encryption Helpers ──────────────────────────────────────────────

_fernet_key = settings.secret_key.encode()[:32].ljust(32, b'\0')
import base64
_fernet = Fernet(base64.urlsafe_b64encode(_fernet_key))


def encrypt_session_string(session_string: str) -> str:
    """Encrypt a Pyrogram session string for database storage."""
    return _fernet.encrypt(session_string.encode()).decode()


def decrypt_session_string(encrypted: str) -> str:
    """Decrypt a stored session string."""
    return _fernet.decrypt(encrypted.encode()).decode()


# ─── OTP-Based Session Flow ─────────────────────────────────────────

async def initiate_otp(tenant_id: str, phone_number: str) -> dict:
    """
    Step 1 of onboarding: Send OTP to the business phone number.
    Creates a temporary Pyrogram client and sends the code.
    
    Returns:
        {"status": "otp_sent", "phone_code_hash": "..."}
    """
    # Clean up any previous pending session
    if tenant_id in _pending_otp:
        old = _pending_otp.pop(tenant_id)
        try:
            await old["client"].disconnect()
        except Exception:
            pass

    client = Client(
        name=f"instatg_setup_{tenant_id}",
        api_id=settings.telegram_api_id,
        api_hash=settings.telegram_api_hash,
        in_memory=True,
    )

    await client.connect()

    sent_code = await client.send_code(phone_number)

    _pending_otp[tenant_id] = {
        "client": client,
        "phone_number": phone_number,
        "phone_code_hash": sent_code.phone_code_hash,
        "created_at": datetime.utcnow(),
    }

    logger.info("otp_sent", tenant=tenant_id, phone=phone_number)

    return {
        "status": "otp_sent",
        "phone_code_hash": sent_code.phone_code_hash,
    }


async def verify_otp(
    tenant_id: str,
    phone_number: str,
    code: str,
    phone_code_hash: str,
    password: str = None,
) -> dict:
    """
    Step 2 of onboarding: Verify OTP and create session string.
    
    Returns:
        {"status": "connected", "session_string": "encrypted_string"}
    """
    pending = _pending_otp.get(tenant_id)
    if not pending:
        return {"status": "error", "detail": "No pending OTP session. Please request OTP first."}

    client = pending["client"]

    try:
        # Sign in with the OTP code
        try:
            await client.sign_in(
                phone_number=phone_number,
                phone_code_hash=phone_code_hash,
                phone_code=code,
            )
        except Exception as e:
            # May need 2FA password
            if "PASSWORD_REQUIRED" in str(e).upper() or "Two-step" in str(e):
                if not password:
                    return {
                        "status": "2fa_required",
                        "detail": "This account has Two-Factor Authentication. Please provide the 2FA password.",
                    }
                await client.check_password(password)
            else:
                raise

        # Export session string
        session_string = await client.export_session_string()
        encrypted = encrypt_session_string(session_string)

        # Get account info
        me = await client.get_me()
        display_name = f"{me.first_name or ''} {me.last_name or ''}".strip() or phone_number
        is_premium = getattr(me, "is_premium", False)

        await client.disconnect()
        _pending_otp.pop(tenant_id, None)

        logger.info("otp_verified", tenant=tenant_id, phone=phone_number, premium=is_premium)

        return {
            "status": "connected",
            "encrypted_session_string": encrypted,
            "display_name": display_name,
            "is_premium": is_premium,
        }

    except Exception as e:
        logger.error("otp_verification_failed", tenant=tenant_id, error=str(e))
        return {"status": "error", "detail": str(e)}


# ─── Client Lifecycle ────────────────────────────────────────────────

async def create_telegram_client(
    tenant_id: str,
    encrypted_session: str,
    phone_number: str,
    display_name: str = "TG Business",
) -> Client:
    """
    Create and start a Pyrogram userbot client for a dedicated business account.
    Decrypts the stored session string and connects.
    
    Args:
        tenant_id: Business tenant ID
        encrypted_session: Encrypted Pyrogram session string from DB
        phone_number: Account phone number
        display_name: Display name for logging
    
    Returns:
        Started Pyrogram Client instance
    """
    session_string = decrypt_session_string(encrypted_session)

    client = Client(
        name=f"instatg_{tenant_id}",
        api_id=settings.telegram_api_id,
        api_hash=settings.telegram_api_hash,
        session_string=session_string,
        in_memory=True,
    )

    # Register message handler
    @client.on_message(filters.private & filters.incoming)
    async def handle_private_message(client_instance: Client, message: Message):
        await process_telegram_message(tenant_id, display_name, client_instance, message)

    await client.start()
    active_clients[tenant_id] = client

    logger.info(
        "telegram_client_started",
        tenant=tenant_id,
        phone=phone_number,
        display_name=display_name,
    )

    return client


async def stop_telegram_client(tenant_id: str) -> None:
    """Stop a running Telegram client."""
    client = active_clients.pop(tenant_id, None)
    if client:
        await client.stop()
        logger.info("telegram_client_stopped", tenant=tenant_id)


def get_client_status(tenant_id: str) -> str:
    """Check if a client is active for a tenant."""
    return "connected" if tenant_id in active_clients else "disconnected"


# ─── Message Processing ─────────────────────────────────────────────

async def process_telegram_message(
    tenant_id: str,
    business_name: str,
    client: Client,
    message: Message,
) -> None:
    """
    Process any incoming Telegram private message.
    Routes to appropriate handler based on media type.
    Always responds — never crashes on unknown types.
    """
    contact_id = str(message.from_user.id)
    contact_name = _get_contact_name(message)
    contact_username = message.from_user.username or ""

    logger.info(
        "telegram_message_received",
        tenant=tenant_id,
        contact=contact_id,
        contact_name=contact_name,
        media_type=str(message.media) if message.media else "text",
    )

    try:
        from app.api.routes.notifications import create_and_dispatch_notification
        await create_and_dispatch_notification(
            tenant_id=tenant_id,
            title="New Telegram Message",
            message=f"From {contact_name}",
            type="info",
            link="/conversations"
        )
    except Exception as e:
        logger.error("telegram_notification_error", error=str(e), tenant=tenant_id)

    try:
        # Route to appropriate handler
        if message.text:
            await _handle_text(tenant_id, business_name, client, message, contact_id)

        elif message.voice or message.audio:
            await _handle_voice(tenant_id, business_name, client, message, contact_id)

        elif message.photo:
            await _handle_photo(tenant_id, business_name, client, message, contact_id)

        elif message.video or message.video_note:
            await _handle_video(tenant_id, business_name, client, message, contact_id)

        elif message.document:
            await _handle_document(tenant_id, business_name, client, message, contact_id)

        elif message.sticker:
            await _handle_sticker(tenant_id, business_name, client, message, contact_id)

        else:
            # Graceful fallback for any unknown media type
            await _handle_fallback(tenant_id, business_name, client, message, contact_id)

    except Exception as e:
        logger.error(
            "telegram_message_processing_error",
            error=str(e),
            tenant=tenant_id,
            contact=contact_id,
            media_type=str(message.media),
        )
        # Never leave the user without a response
        try:
            await message.reply_text(
                "Got it! Give me just a moment to look into this for you 😊"
            )
        except Exception:
            logger.error("telegram_reply_fallback_failed", tenant=tenant_id)


# ─── Message Handlers ───────────────────────────────────────────────

async def _handle_text(
    tenant_id: str, business_name: str, client: Client,
    message: Message, contact_id: str,
) -> None:
    """Handle plain text messages."""
    response = await agent.generate_response(
        tenant_id=tenant_id, contact_id=contact_id,
        user_message=message.text, message_type="text",
        business_name=business_name,
    )
    if response.reply_text and not response.human_handoff:
        await message.reply_text(response.reply_text)


async def _handle_voice(
    tenant_id: str, business_name: str, client: Client,
    message: Message, contact_id: str,
) -> None:
    """Handle voice and audio messages — transcribe with Whisper then respond."""
    with tempfile.TemporaryDirectory() as tmpdir:
        media = message.voice or message.audio
        file_path = await message.download(file_name=os.path.join(tmpdir, "voice.ogg"))
        with open(file_path, "rb") as f:
            audio_data = f.read()

    context_messages = await memory.get_context(tenant_id, contact_id, limit=10)
    context_text = "\n".join([f"{m['role']}: {m['content']}" for m in context_messages])

    analysis = await voice_analyzer.transcribe_and_analyze(
        audio_data=audio_data, filename="voice.ogg", context=context_text,
    )

    response = await agent.generate_response(
        tenant_id=tenant_id, contact_id=contact_id,
        user_message=analysis.transcription, message_type="voice",
        business_name=business_name,
    )
    if response.reply_text and not response.human_handoff:
        await message.reply_text(response.reply_text)


async def _handle_photo(
    tenant_id: str, business_name: str, client: Client,
    message: Message, contact_id: str,
) -> None:
    """Handle photo messages — analyze with Claude Vision then respond."""
    with tempfile.TemporaryDirectory() as tmpdir:
        file_path = await message.download(file_name=os.path.join(tmpdir, "photo.jpg"))
        with open(file_path, "rb") as f:
            image_data = f.read()

    vision_result = await vision.analyze_image(image_data, media_type="image/jpeg")

    user_message = vision_result.description
    if message.caption:
        user_message = f"{message.caption}\n\n[Image shows: {vision_result.description}]"

    response = await agent.generate_response(
        tenant_id=tenant_id, contact_id=contact_id,
        user_message=user_message, message_type="image",
        business_name=business_name,
        image_data=[vision.get_image_base64(image_data)],
    )
    if response.reply_text and not response.human_handoff:
        await message.reply_text(response.reply_text)


async def _handle_video(
    tenant_id: str, business_name: str, client: Client,
    message: Message, contact_id: str,
) -> None:
    """Handle video messages — extract keyframes and analyze."""
    with tempfile.TemporaryDirectory() as tmpdir:
        media = message.video or message.video_note
        file_path = await message.download(file_name=os.path.join(tmpdir, "video.mp4"))
        with open(file_path, "rb") as f:
            video_data = f.read()

    vision_result = await vision.analyze_video(video_data, filename="video.mp4")

    user_message = f"[Video content: {vision_result.description}]"
    if message.caption:
        user_message = f"{message.caption}\n\n{user_message}"

    response = await agent.generate_response(
        tenant_id=tenant_id, contact_id=contact_id,
        user_message=user_message, message_type="video",
        business_name=business_name,
    )
    if response.reply_text and not response.human_handoff:
        await message.reply_text(response.reply_text)


async def _handle_document(
    tenant_id: str, business_name: str, client: Client,
    message: Message, contact_id: str,
) -> None:
    """Handle document messages — extract text and respond."""
    with tempfile.TemporaryDirectory() as tmpdir:
        filename = message.document.file_name or "document"
        file_path = await message.download(file_name=os.path.join(tmpdir, filename))
        with open(file_path, "rb") as f:
            file_data = f.read()

    try:
        from app.knowledge.uploader import extract_text
        text = extract_text(file_data, filename)
        if len(text) > 3000:
            text = text[:3000] + "\n\n[Document truncated for processing...]"
    except ValueError:
        text = f"[Received file: {filename} — unable to extract text from this format]"

    user_message = f"[Document: {filename}]\n{text}"
    if message.caption:
        user_message = f"{message.caption}\n\n{user_message}"

    response = await agent.generate_response(
        tenant_id=tenant_id, contact_id=contact_id,
        user_message=user_message, message_type="document",
        business_name=business_name,
    )
    if response.reply_text and not response.human_handoff:
        await message.reply_text(response.reply_text)


async def _handle_sticker(
    tenant_id: str, business_name: str, client: Client,
    message: Message, contact_id: str,
) -> None:
    """Handle sticker messages — acknowledge with a friendly response."""
    sticker_emoji = message.sticker.emoji or "😊"

    response = await agent.generate_response(
        tenant_id=tenant_id, contact_id=contact_id,
        user_message=f"[Customer sent a sticker with emoji: {sticker_emoji}]",
        message_type="text", business_name=business_name,
    )
    if response.reply_text and not response.human_handoff:
        await message.reply_text(response.reply_text)


async def _handle_fallback(
    tenant_id: str, business_name: str, client: Client,
    message: Message, contact_id: str,
) -> None:
    """Graceful fallback for any unrecognized media type."""
    media_type = str(message.media) if message.media else "unknown"

    response = await agent.generate_response(
        tenant_id=tenant_id, contact_id=contact_id,
        user_message=f"[Customer sent a {media_type} message that I cannot display]",
        message_type="text", business_name=business_name,
    )
    if response.reply_text and not response.human_handoff:
        await message.reply_text(response.reply_text)


def _get_contact_name(message: Message) -> str:
    """Extract contact display name from a message."""
    user = message.from_user
    if user.first_name and user.last_name:
        return f"{user.first_name} {user.last_name}"
    return user.first_name or user.username or str(user.id)
