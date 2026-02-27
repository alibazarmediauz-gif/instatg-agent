import stripe
import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Dict, Any
from uuid import UUID

from app.config import settings
from app.database import get_db
from app.models import Lead, Transaction

logger = structlog.get_logger(__name__)

# Note: Ideally set this in settings, defaulting here for the mock
stripe.api_key = getattr(settings, "stripe_secret_key", "sk_test_mock")
endpoint_secret = getattr(settings, "stripe_webhook_secret", "whsec_test_mock")

router = APIRouter(prefix="/api/payments", tags=["Payments & Transactions"])

@router.post("/create-payment-link")
async def create_payment_link(
    payload: Dict[str, Any],
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a Stripe Payment Link for a High-Ticket closure.
    Called by the AISalesBrain when a Lead says "Yes, let's start".
    """
    lead_id_str = payload.get("lead_id")
    amount = payload.get("amount", 0)  # Amount in cents
    
    if not lead_id_str or amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid lead_id or amount")
        
    lead_id = UUID(lead_id_str)

    try:
        # 1. Create a Stripe Product/Price on the fly (or look it up)
        # For simplicity in this demo, we mock the payment link creation
        # Real implementation:
        # price = stripe.Price.create(unit_amount=amount, currency="usd", product_data={"name": "Sales Service"})
        # link = stripe.PaymentLink.create(line_items=[{"price": price.id, "quantity": 1}])
        
        mock_payment_url = f"https://buy.stripe.com/mock_{lead_id_str[:8]}"
        mock_payment_intent = f"pi_mock_{lead_id_str[:8]}"

        # 2. Record Transaction in DB
        transaction = Transaction(
            lead_id=lead_id,
            amount=amount / 100.0,
            currency="USD",
            status="Pending",
            stripe_payment_intent_id=mock_payment_intent
        )
        db.add(transaction)
        await db.commit()
        
        return {"status": "success", "payment_url": mock_payment_url}
        
    except Exception as e:
        logger.error("stripe_payment_link_error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create payment link")


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Handle Stripe webhook events (e.g. payment_intent.succeeded).
    Automatically moves the associated Lead to 'Won'.
    """
    payload_body = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        # Real implementation requires webhook signature verification
        # event = stripe.Webhook.construct_event(payload_body, sig_header, endpoint_secret)
        
        # Mocking event parsing from raw JSON for the architecture demo
        import json
        event = json.loads(payload_body.decode("utf-8"))
        
        if event["type"] == "payment_intent.succeeded":
            payment_intent = event["data"]["object"]
            pi_id = payment_intent.get("id")
            
            # Find transaction
            result = await db.execute(
                select(Transaction).where(Transaction.stripe_payment_intent_id == pi_id)
            )
            transaction = result.scalar_one_or_none()
            
            if transaction:
                transaction.status = "Succeeded"
                
                # Auto-update Lead to Won
                await db.execute(
                    update(Lead)
                    .where(Lead.id == transaction.lead_id)
                    .values(status="Won")
                )
                
                await db.commit()
                logger.info("payment_succeeded_lead_won", lead_id=str(transaction.lead_id))
                
        return {"status": "success"}

    except Exception as e:
        logger.error("stripe_webhook_error", error=str(e))
        raise HTTPException(status_code=400, detail="Webhook error")
