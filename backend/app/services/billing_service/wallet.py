import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException

from app.models import Wallet, UsageLog
import uuid

logger = structlog.get_logger(__name__)

async def verify_and_deduct_balance(
    db: AsyncSession, 
    tenant_id: str, 
    cost: float, 
    service_type: str, 
    units: int
) -> bool:
    """
    Pessimistic locking to securely verify and deduct wallet balances.
    Prevents race conditions if multiple webhooks arrive simultaneously.
    """
    try:
        # PostgreSQL row-level lock (FOR UPDATE)
        # Blocks other transactions reading this row until we commit/rollback
        query = select(Wallet).where(Wallet.tenant_id == tenant_id).with_for_update()
        result = await db.execute(query)
        wallet = result.scalar_one_or_none()

        if not wallet:
            logger.error("billing_wallet_not_found", tenant_id=tenant_id)
            raise HTTPException(status_code=400, detail="Wallet not found")

        if wallet.balance < cost:
            logger.warning("billing_insufficient_funds", tenant_id=tenant_id, balance=wallet.balance, required=cost)
            return False

        # Deduct balance
        wallet.balance -= cost
        
        # Record Usage Log
        usage_log = UsageLog(
            tenant_id=tenant_id,
            wallet_id=wallet.id,
            service_type=service_type,
            cost=cost,
            units_consumed=units
        )
        db.add(usage_log)
        
        # The session commit will happen at the caller level (e.g., dependency injection in FastAPI)
        # or we explicitly commit here if it's an isolated background task.
        await db.commit()
        
        logger.info("billing_deducted_successfully", tenant_id=tenant_id, cost=cost, remaining=wallet.balance)
        return True

    except Exception as e:
        await db.rollback()
        logger.error("billing_deduction_failed", tenant_id=tenant_id, error=str(e))
        return False
