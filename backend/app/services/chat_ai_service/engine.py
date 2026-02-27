import structlog
from typing import Dict, Any
import uuid
import json
from datetime import datetime

from app.database import async_session_factory
from sqlalchemy import select, update
from app.models import (
    Tenant, Conversation, Message, MessageRole, MessageType,
    Wallet, UsageLog, Lead, ChannelType
)
from app.services.chat_ai_service.sales_brain import AISalesBrain

logger = structlog.get_logger(__name__)

async def process_message(normalized_event: Dict[str, Any], raw_payload: Dict[str, Any]):
    """
    Core entry point for the AI Chat Engine (Real Data Integration).
    Handles message intent parsing, LLM completion, CRM updates, and Wallet deductions.
    """
    tenant_id_str = normalized_event.get("tenant_id")
    channel_str = normalized_event.get("channel", "telegram")
    contact_id = normalized_event.get("contact_id")
    contact_name = normalized_event.get("contact_name")
    text_content = normalized_event.get("text", "")

    if not tenant_id_str or not contact_id or not text_content:
        logger.warning("invalid_event", event=normalized_event)
        return False
        
    try:
        tenant_uuid = uuid.UUID(tenant_id_str)
    except ValueError:
        logger.error("invalid_tenant_uuid", tenant_id=tenant_id_str)
        return False

    async with async_session_factory() as session:
        # 1. Billing Pre-flight Check
        result = await session.execute(
            select(Wallet).where(Wallet.tenant_id == tenant_uuid)
        )
        wallet = result.scalar_one_or_none()
        if not wallet or wallet.balance <= 0:
            logger.warning("wallet_empty", tenant_id=tenant_id_str)
            return False

        # 2. Get or Create Conversation
        result = await session.execute(
            select(Conversation).where(
                Conversation.tenant_id == tenant_uuid,
                Conversation.contact_id == contact_id
            )
        )
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            channel_enum = ChannelType.TELEGRAM if "telegram" in channel_str else ChannelType.INSTAGRAM
            conversation = Conversation(
                tenant_id=tenant_uuid,
                contact_id=contact_id,
                contact_name=contact_name,
                channel=channel_enum
            )
            session.add(conversation)
            await session.commit()
            await session.refresh(conversation)

        # 3. Save User Message
        user_msg = Message(
            conversation_id=conversation.id,
            role=MessageRole.USER,
            message_type=MessageType.TEXT,
            content=text_content
        )
        session.add(user_msg)
        await session.commit()

        # 4. Process with Sales Brain
        # Instead of generic RAG, use the SalesBrain for SDR simulation
        brain = AISalesBrain(tenant_id=tenant_id_str, agent_id="default")
        
        # Load last few messages for memory context
        result = await session.execute(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.desc())
            .limit(10)
        )
        recent_msgs = result.scalars().all()
        history = [{"role": m.role.value, "content": m.content} for m in reversed(recent_msgs)]

        brain_output = await brain.process_utterance(text_content, history)
        reply_text = brain_output.get("response", "I'm not sure how to respond to that.")
        new_prob = brain_output.get("deal_probability", 0.0)
        intent = brain_output.get("intent")
        
        if brain_output.get("suggested_action") == "generate_payment_link":
            # For this demo, inject a fake link
            reply_text += f"\n\nHere is your secure checkout link: https://buy.stripe.com/mock_{str(conversation.id)[:8]}"

        # 5. Save AI Message
        ai_msg = Message(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            message_type=MessageType.TEXT,
            content=reply_text,
            metadata_={"intent": intent, "probability_score": new_prob}
        )
        session.add(ai_msg)

        # 6. CRM State Synchronization (Update Lead)
        result = await session.execute(
            select(Lead).where(
                Lead.tenant_id == tenant_uuid,
                # Try to map by contact_name as a naive approach. In real app, map by phone/email/contact_id
            )
        )
        leads = result.scalars().all()
        # Find lead matching contact_name loosely, or create a new one
        target_lead = None
        for l in leads:
            ci = l.contact_info or {}
            if ci.get("name") == contact_name or l.contact_name == contact_name:
                target_lead = l
                break
                
        if not target_lead:
            target_lead = Lead(
                tenant_id=tenant_uuid,
                contact_info={"name": contact_name, "contact_id": contact_id},
                status="In Progress",
                probability_score=new_prob
            )
            session.add(target_lead)
        else:
            target_lead.probability_score = new_prob
            # If buying signal, advance stage
            if intent == "Buying_Signal":
                target_lead.status = "Proposal"

        # 7. Billing Deduction
        COST_PER_MESSAGE = 0.02
        wallet.balance -= COST_PER_MESSAGE
        usage_log = UsageLog(
            tenant_id=tenant_uuid,
            wallet_id=wallet.id,
            service_type="chat",
            cost=COST_PER_MESSAGE,
            units_consumed=1
        )
        session.add(usage_log)

        await session.commit()
        logger.info("ai_engine_processing_complete", status="success", contact=contact_id, cost=COST_PER_MESSAGE)
        return True
