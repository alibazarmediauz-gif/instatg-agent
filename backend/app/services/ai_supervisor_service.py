"""
AI Supervisor Service

Provides the process(event) interface that classifies incoming messages
into REPLY, IGNORE, or ESCALATE actions. Wraps the existing ClaudeAgent.
"""

import structlog
from dataclasses import dataclass
from typing import Optional
from enum import Enum

logger = structlog.get_logger(__name__)


class SupervisorAction(str, Enum):
    REPLY = "reply"
    IGNORE = "ignore"
    ESCALATE = "escalate"


@dataclass
class SupervisorResult:
    action: SupervisorAction
    reply_text: str = ""
    tags: list[str] = None
    confidence: float = 1.0

    def __post_init__(self):
        if self.tags is None:
            self.tags = []


async def process(
    tenant_id: str,
    contact_id: str,
    message_text: str,
    platform: str,
    business_name: str = "",
) -> SupervisorResult:
    """
    Process an incoming message through the AI supervisor.

    Returns a SupervisorResult with:
    - action: REPLY (auto-respond), IGNORE (no action), ESCALATE (human needed)
    - reply_text: The generated reply (if action is REPLY)
    - tags: Classification tags (lead_intent, complaint, pricing, etc.)
    """
    try:
        from app.agents.claude_agent import agent

        response = await agent.generate_response(
            tenant_id=tenant_id,
            contact_id=contact_id,
            user_message=message_text,
            message_type="text",
            business_name=business_name,
        )

        # Determine action based on agent response
        if response.human_handoff:
            return SupervisorResult(
                action=SupervisorAction.ESCALATE,
                reply_text="",
                tags=["escalation", "human_review"],
                confidence=0.3,
            )

        if not response.reply_text or response.reply_text.strip() == "":
            return SupervisorResult(
                action=SupervisorAction.IGNORE,
                tags=["no_response_needed"],
                confidence=0.8,
            )

        # Classify tags from the response
        tags = _classify_tags(message_text, response.reply_text)

        return SupervisorResult(
            action=SupervisorAction.REPLY,
            reply_text=response.reply_text,
            tags=tags,
            confidence=0.9,
        )

    except Exception as e:
        logger.error("ai_supervisor_error", error=str(e), tenant=tenant_id)
        # On error, escalate to human
        return SupervisorResult(
            action=SupervisorAction.ESCALATE,
            reply_text="",
            tags=["error", "system_failure"],
            confidence=0.0,
        )


def _classify_tags(user_message: str, reply_text: str) -> list[str]:
    """Simple keyword-based tag classification for incoming messages."""
    tags = []
    msg_lower = user_message.lower()

    pricing_keywords = ["narx", "price", "qancha", "how much", "стоимость", "цена", "сколько"]
    if any(kw in msg_lower for kw in pricing_keywords):
        tags.append("pricing")

    complaint_keywords = ["muammo", "problem", "issue", "broken", "жалоба", "проблема", "shikoyat"]
    if any(kw in msg_lower for kw in complaint_keywords):
        tags.append("complaint")

    order_keywords = ["buyurtma", "order", "zakaz", "заказ", "sotib", "buy", "купить"]
    if any(kw in msg_lower for kw in order_keywords):
        tags.append("lead_intent")

    if "?" in user_message:
        tags.append("question")

    if not tags:
        tags.append("general")

    return tags
