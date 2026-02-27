"""
InstaTG Agent — Settings API Routes

Manage dedicated Telegram business account (OTP onboarding),
Instagram accounts, AI persona, timezone, and handoff rules.
"""

import structlog
from uuid import UUID
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Tenant, TelegramAccount, InstagramAccount

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/settings", tags=["Settings"])


# ─── Schemas ──────────────────────────────────────────────────────────

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    ai_persona: Optional[str] = None
    timezone: Optional[str] = None
    human_handoff_enabled: Optional[bool] = None
    owner_telegram_chat_id: Optional[str] = None


class TelegramOTPRequest(BaseModel):
    phone_number: str


class TelegramOTPVerify(BaseModel):
    phone_number: str
    code: str
    phone_code_hash: str
    password: Optional[str] = None  # For 2FA accounts


class InstagramAccountCreate(BaseModel):
    instagram_user_id: str
    page_id: str
    access_token: str
    username: Optional[str] = None


# ─── Tenant Settings ─────────────────────────────────────────────────

@router.get("/tenant")
async def get_tenant_settings(
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Get tenant settings."""
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    return {
        "id": str(tenant.id),
        "name": tenant.name,
        "owner_email": tenant.owner_email,
        "ai_persona": tenant.ai_persona,
        "timezone": tenant.timezone,
        "human_handoff_enabled": tenant.human_handoff_enabled,
        "owner_telegram_chat_id": tenant.owner_telegram_chat_id,
        "is_active": tenant.is_active,
        "created_at": tenant.created_at.isoformat(),
    }


@router.patch("/tenant")
async def update_tenant_settings(
    data: TenantUpdate,
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Update tenant settings."""
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tenant, key, value)

    await db.flush()
    logger.info("tenant_updated", tenant=str(tenant_id), fields=list(update_data.keys()))

    return {"status": "updated", "fields": list(update_data.keys())}


# ─── Telegram Business Account (Single, Dedicated) ───────────────────

@router.get("/telegram")
async def get_telegram_account(
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Get the dedicated Telegram business account for this tenant."""
    result = await db.execute(
        select(TelegramAccount).where(TelegramAccount.tenant_id == tenant_id)
    )
    account = result.scalar_one_or_none()

    if not account:
        return {
            "connected": False,
            "phone_number": None,
            "display_name": None,
            "is_premium": False,
            "is_active": False,
            "connection_status": "disconnected",
        }

    # Check live client status
    from app.channels.telegram import get_client_status
    live_status = get_client_status(str(tenant_id))

    return {
        "connected": True,
        "id": str(account.id),
        "phone_number": account.phone_number,
        "display_name": account.display_name,
        "is_premium": account.is_premium,
        "is_active": account.is_active,
        "connection_status": live_status if account.is_active else account.connection_status,
        "last_connected_at": account.last_connected_at.isoformat() if account.last_connected_at else None,
        "created_at": account.created_at.isoformat(),
    }


@router.post("/telegram/send-otp")
async def send_telegram_otp(
    data: TelegramOTPRequest,
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Step 1: Business owner enters dedicated phone number.
    System sends OTP via Telegram to that phone.
    """
    from app.channels.telegram import initiate_otp

    # Check if tenant already has a connected account
    result = await db.execute(
        select(TelegramAccount).where(TelegramAccount.tenant_id == tenant_id)
    )
    existing = result.scalar_one_or_none()

    if existing and existing.is_active and existing.connection_status == "connected":
        raise HTTPException(
            status_code=400,
            detail="Account already connected. Disconnect first to reconnect.",
        )

    try:
        otp_result = await initiate_otp(str(tenant_id), data.phone_number)

        # Create or update the account record
        if existing:
            existing.phone_number = data.phone_number
            existing.connection_status = "otp_sent"
            existing.is_active = False
        else:
            account = TelegramAccount(
                tenant_id=tenant_id,
                phone_number=data.phone_number,
                connection_status="otp_sent",
                is_active=False,
            )
            db.add(account)

        await db.flush()

        return {
            "status": "otp_sent",
            "phone_code_hash": otp_result["phone_code_hash"],
            "message": f"OTP code sent to {data.phone_number} via Telegram",
        }

    except Exception as e:
        logger.error("otp_send_error", error=str(e), tenant=str(tenant_id))
        raise HTTPException(status_code=500, detail=f"Failed to send OTP: {str(e)}")


@router.post("/telegram/verify-otp")
async def verify_telegram_otp(
    data: TelegramOTPVerify,
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Step 2: Owner enters OTP code received on the business phone.
    Pyrogram creates session string, encrypts and saves to DB.
    Userbot starts listening.
    """
    from app.channels.telegram import verify_otp, create_telegram_client

    result = await db.execute(
        select(TelegramAccount).where(TelegramAccount.tenant_id == tenant_id)
    )
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(status_code=404, detail="No pending Telegram setup found")

    try:
        verify_result = await verify_otp(
            tenant_id=str(tenant_id),
            phone_number=data.phone_number,
            code=data.code,
            phone_code_hash=data.phone_code_hash,
            password=data.password,
        )

        if verify_result["status"] == "2fa_required":
            return verify_result

        if verify_result["status"] == "error":
            account.connection_status = "error"
            await db.flush()
            raise HTTPException(status_code=400, detail=verify_result["detail"])

        # Save encrypted session and activate account
        account.encrypted_session_string = verify_result["encrypted_session_string"]
        account.display_name = verify_result["display_name"]
        account.is_premium = verify_result.get("is_premium", False)
        account.is_active = True
        account.connection_status = "connected"
        account.last_connected_at = datetime.utcnow()
        await db.flush()

        # Start the userbot
        try:
            # Get tenant name for display
            tenant_result = await db.execute(select(Tenant.name).where(Tenant.id == tenant_id))
            tenant_name = tenant_result.scalar() or "Business"

            await create_telegram_client(
                tenant_id=str(tenant_id),
                encrypted_session=account.encrypted_session_string,
                phone_number=account.phone_number,
                display_name=tenant_name,
            )
        except Exception as e:
            logger.warning("userbot_start_delayed", error=str(e))

        logger.info("telegram_connected", tenant=str(tenant_id), phone=data.phone_number)

        return {
            "status": "connected",
            "display_name": account.display_name,
            "is_premium": account.is_premium,
            "message": "✅ Telegram business account connected! Userbot is now listening for incoming DMs.",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("otp_verify_error", error=str(e), tenant=str(tenant_id))
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@router.post("/telegram/disconnect")
async def disconnect_telegram(
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect the Telegram business account."""
    from app.channels.telegram import stop_telegram_client

    result = await db.execute(
        select(TelegramAccount).where(TelegramAccount.tenant_id == tenant_id)
    )
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(status_code=404, detail="No Telegram account found")

    # Stop the live client
    await stop_telegram_client(str(tenant_id))

    # Update DB
    account.is_active = False
    account.connection_status = "disconnected"
    account.encrypted_session_string = None
    await db.flush()

    logger.info("telegram_disconnected", tenant=str(tenant_id))

    return {"status": "disconnected", "message": "Telegram account disconnected."}


# ─── Instagram Accounts ──────────────────────────────────────────────

@router.get("/instagram-accounts")
async def list_instagram_accounts(
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """List connected Instagram accounts."""
    result = await db.execute(
        select(InstagramAccount).where(InstagramAccount.tenant_id == tenant_id)
    )
    accounts = result.scalars().all()

    return {
        "accounts": [
            {
                "id": str(a.id),
                "instagram_user_id": a.instagram_user_id,
                "username": a.username,
                "is_active": a.is_active,
                "created_at": a.created_at.isoformat(),
            }
            for a in accounts
        ]
    }


@router.post("/instagram-accounts")
async def add_instagram_account(
    data: InstagramAccountCreate,
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Add a new Instagram account."""
    account = InstagramAccount(
        tenant_id=tenant_id,
        instagram_user_id=data.instagram_user_id,
        page_id=data.page_id,
        access_token=data.access_token,
        username=data.username,
    )
    db.add(account)
    await db.flush()

    from app.channels.instagram import register_instagram_account
    register_instagram_account(
        instagram_user_id=data.instagram_user_id,
        tenant_id=str(tenant_id),
        access_token=data.access_token,
        page_id=data.page_id,
        display_name=data.username or data.instagram_user_id,
    )

    logger.info("instagram_account_added", tenant=str(tenant_id), user_id=data.instagram_user_id)

    return {"id": str(account.id), "status": "created"}


@router.delete("/instagram-accounts/{account_id}")
async def remove_instagram_account(
    account_id: UUID,
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Remove an Instagram account."""
    result = await db.execute(
        select(InstagramAccount).where(
            and_(InstagramAccount.id == account_id, InstagramAccount.tenant_id == tenant_id)
        )
    )
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(status_code=404, detail="Instagram account not found")

    await db.delete(account)
    await db.flush()

    return {"status": "deleted"}
