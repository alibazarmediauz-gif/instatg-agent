from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any
from uuid import UUID

from app.database import get_db
from app.models import Wallet, UsageLog

router = APIRouter(prefix="/api/billing", tags=["Billing & Usage"])

# ─── Subscription & Tiers ──────────────────────────────────────────

SUBSCRIPTION_PLANS = {
    "basic": {"name": "Basic", "price_uzs": 500000, "call_limit": 100, "chat_limit": 1000},
    "pro": {"name": "Pro", "price_uzs": 1500000, "call_limit": 500, "chat_limit": 5000},
    "enterprise": {"name": "Enterprise", "price_uzs": 5000000, "call_limit": 999999, "chat_limit": 999999}
}

@router.get("/subscription")
async def get_subscription(tenant_id: UUID = Query(...), db: AsyncSession = Depends(get_db)):
    """Check current subscription tier and usage."""
    # Simplified: every tenant starts on Pro for demo
    return {
        "tier": "pro",
        "limits": SUBSCRIPTION_PLANS["pro"],
        "usage": {
            "calls": 142,
            "chats": 2840
        }
    }

import structlog
import base64
from app.config import settings

logger = structlog.get_logger(__name__)

@router.post("/payme/callback")
async def payme_callback(request: Dict[str, Any], db: AsyncSession = Depends(get_db)):
    """
    Endpoint for Payme.uz merchant integration (JSON-RPC 2.0).
    Implements mandatory methods for the UZ market.
    """
    method = request.get("method")
    params = request.get("params", {})
    rpc_id = request.get("id")
    
    logger.info("payme_request", method=method, params=params)

    # In real production, check 'Authorization' header for merchant token
    # auth_header = ... 

    if method == "CheckPerformTransaction":
        # Verify if amount is valid and account exists
        return {"result": {"allow": True}, "id": rpc_id}

    elif method == "CreateTransaction":
        # Create a record in transactions table (status: pending)
        # Returns internal transaction ID
        return {
            "result": {
                "create_time": int(datetime.now().timestamp() * 1000),
                "transaction": params.get("id"), # Simplified mock
                "state": 1
            },
            "id": rpc_id
        }

    elif method == "PerformTransaction":
        # Finalize payment and update tenant balance
        # tenant_id = params.get("account", {}).get("tenant_id")
        # amount = params.get("amount") / 100 # UZS to base
        return {
            "result": {
                "perform_time": int(datetime.now().timestamp() * 1000),
                "transaction": params.get("id"),
                "state": 2
            },
            "id": rpc_id
        }

    return {"error": {"code": -32601, "message": "Method not found"}, "id": rpc_id}

@router.post("/click/callback")
async def click_callback(
    click_trans_id: int = Query(...),
    service_id: int = Query(...),
    click_paydoc_id: int = Query(...),
    merchant_trans_id: str = Query(...),
    amount: float = Query(...),
    action: int = Query(...), # 0: Prepare, 1: Complete
    error: int = Query(...),
    sign_time: str = Query(...),
    sign_string: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for Click.uz merchant integration.
    Action 0: Prepare, Action 1: Complete.
    """
    logger.info("click_request", action=action, trans_id=click_trans_id, amount=amount)
    
    # Sign verification logic would go here
    # signature = md5(click_trans_id + service_id + SECRET + merchant_trans_id + amount + action + sign_time)
    
    if action == 0: # Prepare
        return {"error": 0, "error_note": "Success", "click_trans_id": click_trans_id, "merchant_trans_id": merchant_trans_id}
    
    if action == 1: # Complete
        # Update wallet balance here
        return {"error": 0, "error_note": "Success", "click_trans_id": click_trans_id, "merchant_trans_id": merchant_trans_id, "merchant_confirm_id": 12345}

    return {"error": -1, "error_note": "Unknown action"}

@router.get("/usage-logs")
async def get_usage_logs(
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Get ledger of usage."""
    result = await db.execute(
        select(UsageLog)
        .where(UsageLog.tenant_id == tenant_id)
        .order_by(UsageLog.created_at.desc())
        .limit(50)
    )
    logs = result.scalars().all()
    
    return {
        "status": "success", 
        "logs": [
            {
                "id": str(log.id),
                "service_type": log.service_type,
                "cost": log.cost,
                "units_consumed": log.units_consumed,
                "created_at": log.created_at.isoformat()
            } for log in logs
        ]
    }
