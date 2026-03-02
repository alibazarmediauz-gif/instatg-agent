from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any
import httpx
import structlog
from uuid import UUID

from app.database import get_db
from app.models import TelegramAccount
from app.config import settings
from app.services.meta_oauth_service import encrypt_token

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/integrations/telegram", tags=["Telegram Auth"])

@router.post("/connect")
async def connect_telegram_bot(
    payload: Dict[str, Any],
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Connect a new Telegram Bot using the provided Bot Token.
    Validates the token via Telegram's API, sets up the webhook, and saves it.
    """
    token = payload.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Bot token is required")

    async with httpx.AsyncClient(timeout=15) as client:
        # 1. Validate the bot token by calling getMe
        res = await client.get(f"https://api.telegram.org/bot{token}/getMe")
        if res.status_code != 200:
            logger.error("invalid_telegram_token", response=res.text)
            raise HTTPException(status_code=400, detail="Yaroqsiz Telegram bot token (BotFather'dan to'g'ri nusxa olayotganingizga ishonch hosil qiling)")
        
        bot_data = res.json().get("result", {})
        bot_id = str(bot_data.get("id"))
        bot_username = bot_data.get("username")

        # 2. Set the Webhook to point to our production app
        webhook_url = f"{settings.public_base_url}/api/webhooks/telegram"
        webhook_res = await client.post(
            f"https://api.telegram.org/bot{token}/setWebhook",
            json={"url": webhook_url, "allowed_updates": ["message", "edited_message", "callback_query"]}
        )

        if webhook_res.status_code != 200:
            logger.error("telegram_webhook_failed", response=webhook_res.text)
            raise HTTPException(status_code=500, detail="Webhook ulashda xatolik yuz berdi")

    # 3. Encrypt the token and save it to the database
    encrypted_token = encrypt_token(token)

    account_q = await db.execute(select(TelegramAccount).where(TelegramAccount.telegram_user_id == bot_id, TelegramAccount.tenant_id == tenant_id))
    account = account_q.scalar_one_or_none()

    if account:
        account.access_token = encrypted_token
        account.username = bot_username
        account.is_active = True
        account.connection_status = "connected"
    else:
        account = TelegramAccount(
            tenant_id=tenant_id,
            telegram_user_id=bot_id,
            access_token=encrypted_token,
            username=bot_username,
            is_active=True,
            connection_status="connected"
        )
        db.add(account)

    await db.commit()
    logger.info("telegram_bot_connected", tenant_id=str(tenant_id), bot=bot_username)

    # 4. Register in memory channel handler
    from app.channels.telegram import register_telegram_account
    register_telegram_account(tenant_id=str(tenant_id), access_token=token, bot_username=bot_username)

    return {"status": "success", "message": "Bot muvaffaqiyatli ulandi", "bot": bot_username}


@router.post("/otp/request")
async def request_telegram_otp(
    payload: Dict[str, Any],
    tenant_id: UUID = Query(...),
):
    """
    Step 1: Request an OTP to a personal phone number via Pyrogram.
    """
    phone = payload.get("phone")
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number required")

    try:
        from app.channels.telegram import initiate_otp
        # phone typically requires + prefix for pyrogram
        if not phone.startswith("+"):
            phone = "+" + phone.lstrip("+")
            
        result = await initiate_otp(str(tenant_id), phone)
        return result
    except Exception as e:
        logger.error("telegram_otp_request_error", error=str(e), tenant=str(tenant_id))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/otp/verify")
async def verify_telegram_otp_endpoint(
    payload: Dict[str, Any],
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Step 2: Verify the OTP and save the session string for personal accounts.
    """
    phone = payload.get("phone")
    code = payload.get("code")
    phone_code_hash = payload.get("phone_code_hash")
    password = payload.get("password")

    if not all([phone, code, phone_code_hash]):
        raise HTTPException(status_code=400, detail="Missing required OTP fields")

    try:
        from app.channels.telegram import verify_otp, create_telegram_client
        result = await verify_otp(
            tenant_id=str(tenant_id),
            phone_number=phone,
            code=code,
            phone_code_hash=phone_code_hash,
            password=password
        )

        if result.get("status") == "2fa_required":
            return result

        if result.get("status") != "connected":
            raise HTTPException(status_code=400, detail=result.get("detail", "OTP verification failed"))

        # Save session to DB
        encrypted_session = result["encrypted_session_string"]
        display_name = result["display_name"]
        is_premium = result.get("is_premium", False)

        account_q = await db.execute(select(TelegramAccount).where(TelegramAccount.phone_number == phone, TelegramAccount.tenant_id == tenant_id))
        account = account_q.scalar_one_or_none()

        if account:
            account.encrypted_session_string = encrypted_session
            account.display_name = display_name
            account.is_premium = is_premium
            account.is_active = True
            account.connection_status = "connected"
        else:
            account = TelegramAccount(
                tenant_id=tenant_id,
                phone_number=phone,
                encrypted_session_string=encrypted_session,
                display_name=display_name,
                is_premium=is_premium,
                is_active=True,
                connection_status="connected"
            )
            db.add(account)

        await db.commit()

        # Start listening client
        await create_telegram_client(
            tenant_id=str(tenant_id),
            encrypted_session=encrypted_session,
            phone_number=phone,
            display_name=display_name
        )

        return {"status": "connected", "display_name": display_name}

    except Exception as e:
        logger.error("telegram_otp_verify_error", error=str(e), tenant=str(tenant_id))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/disconnect")
async def disconnect_telegram_account(
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Disconnects the active Telegram account for the tenant.
    Stops the Pyrogram client, deletes active_bots caches, and removes credentials from DB.
    """
    try:
        from app.channels.telegram import stop_telegram_client, active_bots
        
        # Stop client if running
        await stop_telegram_client(str(tenant_id))
        
        # Remove active bot token if any
        if str(tenant_id) in active_bots:
            del active_bots[str(tenant_id)]

        # Delete database row entirely
        await db.execute(
            delete(TelegramAccount).where(TelegramAccount.tenant_id == tenant_id)
        )
        await db.commit()

        logger.info("telegram_account_disconnected", tenant=str(tenant_id))
        return {"status": "success", "message": "Telegram account disconnected successfully"}

    except Exception as e:
        logger.error("telegram_disconnect_error", error=str(e), tenant=str(tenant_id))
        raise HTTPException(status_code=500, detail=str(e))
