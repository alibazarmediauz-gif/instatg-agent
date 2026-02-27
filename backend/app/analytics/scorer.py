"""
InstaTG Agent — Conversation Scorer

Claude-based conversation analysis after inactivity.
Generates sentiment, lead score, sales outcome, and actionable insights.
"""

import json
import structlog
from typing import Optional
from datetime import datetime

import anthropic

from app.config import settings
from app.memory.context import memory

logger = structlog.get_logger(__name__)

SCORING_PROMPT = """You are an expert sales conversation analyst. Analyze this complete conversation and provide a detailed assessment.

CONVERSATION:
{conversation}

Analyze the conversation and respond with ONLY the following JSON (no other text):
```json
{{
    "sentiment": "positive|neutral|negative",
    "lead_score": 1-10,
    "sales_outcome": "won|lost|in_progress|not_qualified",
    "key_topics": ["topic1", "topic2"],
    "objections_raised": ["objection1", "objection2"],
    "objection_handling": ["how objection1 was handled", "how objection2 was handled"],
    "recommended_action": "Specific next step recommendation",
    "summary": "2-3 sentence conversation summary highlighting key moments",
    "qa_flags": {
        "is_toxic": false,
        "has_hallucination": false,
        "script_compliance": 95,
        "flag_reason": null
    }
}}
```

SCORING GUIDE:
- lead_score 1-3: Not qualified, wrong audience, no budget/interest
- lead_score 4-5: Mildly interested but many blockers
- lead_score 6-7: Good prospect, addressing concerns, moving forward
- lead_score 8-9: Very interested, close to buying, needs final push
- lead_score 10: Purchase confirmed or very strong buying signals

- sales_outcome "won": Customer confirmed purchase, agreed to deal, or expressed clear commitment
- sales_outcome "lost": Customer explicitly declined, chose competitor, or went silent after objections
- sales_outcome "in_progress": Active conversation, still evaluating, needs follow-up
- sales_outcome "not_qualified": Customer doesn't fit the ideal profile, no real buying intent"""


class ConversationScorer:
    """Scores and analyzes completed conversations."""

    def __init__(self):
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def score_conversation(
        self,
        tenant_id: str,
        contact_id: str,
        conversation_messages: Optional[list[dict]] = None,
    ) -> dict:
        """
        Analyze and score a conversation.
        
        Args:
            tenant_id: Business tenant ID
            contact_id: Contact identifier
            conversation_messages: Optional pre-loaded messages (if None, loads from Redis)
        
        Returns:
            Dict with full analysis results
        """
        try:
            # Load messages from Redis if not provided
            if not conversation_messages:
                conversation_messages = await memory.get_context(tenant_id, contact_id)

            if not conversation_messages:
                logger.warning("no_messages_to_score", tenant=tenant_id, contact=contact_id)
                return {"error": "No messages found"}

            # Format conversation for analysis
            conversation_text = self._format_conversation(conversation_messages)

            # Call Claude for analysis
            prompt = SCORING_PROMPT.format(conversation=conversation_text)

            response = await self.client.messages.create(
                model=settings.claude_model,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )

            raw_text = response.content[0].text
            analysis = self._parse_analysis(raw_text)

            logger.info(
                "conversation_scored",
                tenant=tenant_id,
                contact=contact_id,
                sentiment=analysis.get("sentiment"),
                lead_score=analysis.get("lead_score"),
                outcome=analysis.get("sales_outcome"),
            )

            return analysis

        except Exception as e:
            logger.error("scoring_error", error=str(e), tenant=tenant_id, contact=contact_id)
            return {
                "error": str(e),
                "sentiment": "neutral",
                "lead_score": 0,
                "sales_outcome": "in_progress",
            }

    async def check_and_score_inactive(
        self,
        tenant_id: str,
        contact_id: str,
        inactivity_seconds: int = 7200,
    ) -> Optional[dict]:
        """
        Check if conversation is inactive and score it.
        
        Args:
            tenant_id: Tenant ID
            contact_id: Contact ID
            inactivity_seconds: Seconds of inactivity threshold (default: 2 hours)
        
        Returns:
            Analysis dict if scored, None if still active
        """
        last_time = await memory.get_last_message_time(tenant_id, contact_id)

        if not last_time:
            return None

        elapsed = (datetime.utcnow() - last_time).total_seconds()

        if elapsed >= inactivity_seconds:
            logger.info(
                "conversation_inactive",
                tenant=tenant_id,
                contact=contact_id,
                inactive_seconds=elapsed,
            )
            return await self.score_conversation(tenant_id, contact_id)

        return None

    def _format_conversation(self, messages: list[dict]) -> str:
        """Format messages into readable conversation text."""
        lines = []
        for msg in messages:
            role = msg.get("role", "unknown").upper()
            content = msg.get("content", "")
            msg_type = msg.get("type", "text")
            timestamp = msg.get("timestamp", "")

            prefix = f"[{timestamp}] " if timestamp else ""
            type_tag = f" [{msg_type}]" if msg_type != "text" else ""

            lines.append(f"{prefix}{role}{type_tag}: {content}")

        return "\n".join(lines)

    def _parse_analysis(self, raw_text: str) -> dict:
        """Parse JSON analysis from Claude's response."""
        try:
            if "```json" in raw_text:
                json_str = raw_text.split("```json")[1].split("```")[0].strip()
                return json.loads(json_str)
            elif "```" in raw_text:
                json_str = raw_text.split("```")[1].split("```")[0].strip()
                return json.loads(json_str)
            else:
                return json.loads(raw_text.strip())
        except (json.JSONDecodeError, IndexError):
            logger.warning("score_parse_failed", text_preview=raw_text[:200])
            return {
                "sentiment": "neutral",
                "lead_score": 0,
                "sales_outcome": "in_progress",
                "summary": raw_text[:500],
            }


# Singleton instance
scorer = ConversationScorer()
