"""
InstaTG Agent — Claude AI Agent

Main conversational AI agent using Claude claude-sonnet-4-5.
Handles text, image descriptions, and voice transcripts.
Returns structured responses with reply text and metadata.
"""

import json
import structlog
from typing import Optional
from dataclasses import dataclass, field

import anthropic

from app.config import settings
from app.memory.context import memory
from app.knowledge.rag import rag_search

logger = structlog.get_logger(__name__)


@dataclass
class AgentResponse:
    """Structured response from the AI agent."""
    reply_text: str
    sentiment: str = "neutral"
    intent: str = "general"
    lead_score: int = 0
    human_handoff: bool = False
    sale_detected: bool = False
    confidence: float = 0.0
    unhandled_question: bool = False
    metadata: dict = field(default_factory=dict)


SYSTEM_PROMPT_TEMPLATE = """You are an intelligent, warm, and professional sales assistant for {business_name}. 
You work as a real person — never reveal you are an AI. Be natural, friendly, and helpful.

YOUR PERSONALITY:
- Warm and approachable, like chatting with a knowledgeable friend
- Confident but not pushy
- Empathetic — acknowledge customer feelings and concerns
- Professional but conversational — avoid corporate jargon
- Use natural language, occasional emoji where appropriate

YOUR GOALS (in priority order):
1. Answer customer questions accurately using the knowledge base
2. Qualify the lead — understand their needs, budget, timeline
3. Handle objections naturally — reframe, empathize, provide value
4. Guide toward a purchase decision without being aggressive
5. VALIDATE PAYMENTS: If a user sends a screenshot of a receipt or proof of payment, analyze it. Check for amount, date, and "Success" status. Confirm receipt if it looks valid.
6. If you genuinely cannot help, flag for a human operator

KNOWLEDGE BASE CONTEXT:
{knowledge_context}

MASTER OVERRIDE PROMPT:
{master_prompt}

{custom_persona}

RESPONSE FORMAT:
Always respond in the same language the customer writes in.
CRITICAL RULE: You must speak in fluent Uzbek (standard literary or regional dialects) if the user speaks Uzbek.
If the user speaks Russian, respond in Russian.
If the user sends a photo of a payment receipt, acknowledge it: "To'lov qabul qilindi, rahmat!" (UZ) or "Оплата принята, спасибо!" (RU) if it looks valid.

Keep responses concise — 1-3 short paragraphs maximum.
Ask one follow-up question when appropriate to keep the conversation flowing.

IMPORTANT RULES:
- Never say "I'm an AI" or "I'm a bot" or "As an AI assistant"
- Never make up information not in the knowledge base
- For payment screenshots: If the image is NOT a receipt, kindly ask for a clear photo of the payment confirmation.
- If unsure, say you'll check with the team and get back (flag for human)
- If the customer confirms a purchase or deal, acknowledge it warmly
- If the customer seems frustrated, be extra empathetic and offer to connect them with a manager

After your natural reply, add a JSON block on a new line with this exact format:
```json
{{"sentiment": "positive|neutral|negative", "intent": "purchase|inquiry|complaint|support|general|payment_verification", "lead_score": 1-10, "human_handoff": true|false, "sale_detected": true|false, "unhandled_question": true|false, "confidence": 0.0-1.0}}
```"""


class ClaudeAgent:
    """AI Sales Agent powered by Claude claude-sonnet-4-5."""

    def __init__(self):
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = settings.claude_model

    async def generate_response(
        self,
        tenant_id: str,
        contact_id: str,
        user_message: str,
        message_type: str = "text",
        business_name: str = "our company",
        custom_persona: str = "",
        image_data: Optional[list] = None,
    ) -> AgentResponse:
        """
        Generate an AI response to a user message.
        """
        try:
            # 0. Fetch Tenant AI settings
            db_persona = ""
            master_prompt = ""
            from app.database import async_session_factory
            from app.models import Tenant, FrequentQuestion
            from sqlalchemy import select
            
            async with async_session_factory() as db:
                result = await db.execute(select(Tenant.ai_persona, Tenant.master_prompt).where(Tenant.id == tenant_id))
                row = result.first()
                if row:
                    db_persona = row[0] or ""
                    master_prompt = row[1] or ""
            
            # Combine DB persona with channel-specific persona
            final_persona = f"{db_persona}\n\n{custom_persona}".strip()

            # 1. Retrieve conversation context from Redis
            context_messages = await memory.get_context(tenant_id, contact_id)

            # 2. Check if human handoff is active
            if await memory.is_human_handoff(tenant_id, contact_id):
                logger.info("human_handoff_active", tenant=tenant_id, contact=contact_id)
                return AgentResponse(
                    reply_text="",
                    human_handoff=True,
                    metadata={"reason": "Human operator is handling this conversation"},
                )

            # 3. Search knowledge base via RAG
            knowledge_context = await self._get_knowledge_context(tenant_id, user_message)

            # 4. Build system prompt
            system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
                business_name=business_name,
                knowledge_context=knowledge_context or "No specific knowledge base loaded yet. Answer based on general sales best practices.",
                master_prompt=master_prompt,
                custom_persona=f"\nADDITIONAL INSTRUCTIONS:\n{final_persona}" if final_persona else "",
            )

            # 5. Build message history for Claude
            claude_messages = self._build_message_history(context_messages, user_message, message_type, image_data)

            # 6. Call Claude API
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system_prompt,
                messages=claude_messages,
            )

            raw_reply = response.content[0].text

            # 7. Parse response and metadata
            agent_response = self._parse_response(raw_reply)

            # 8. Store messages in Redis context
            await memory.add_message(tenant_id, contact_id, "user", user_message, message_type)
            await memory.add_message(tenant_id, contact_id, "assistant", agent_response.reply_text, "text")

            # 9. Handle human handoff flag (Intelligence: proactive escalation)
            handoff_triggered = False
            reason = ""
            
            if agent_response.human_handoff:
                reason = "AI requested handoff"
                handoff_triggered = True
            elif agent_response.confidence < 0.4:
                reason = f"Low AI confidence ({agent_response.confidence})"
                handoff_triggered = True
            elif agent_response.intent in ["complaint", "support"]:
                reason = f"Customer {agent_response.intent} detected"
                handoff_triggered = True
            elif agent_response.sentiment == "negative":
                reason = "Frustrated user detected (Negative Sentiment)"
                handoff_triggered = True

            if handoff_triggered:
                from app.services.handoff_service import handoff_service
                await handoff_service.trigger_handoff(
                    tenant_id=tenant_id,
                    contact_id=contact_id,
                    reason=reason,
                    contact_name=business_name
                )
                logger.warning("human_handoff_triggered", tenant=tenant_id, contact=contact_id, reason=reason)

            # 10. Auto-track unhandled questions
            if agent_response.unhandled_question and message_type == "text" and len(user_message.strip()) > 5:
                try:
                    async with async_session_factory() as db:
                        stmt = select(FrequentQuestion).where(
                            FrequentQuestion.tenant_id == tenant_id,
                            FrequentQuestion.cluster_topic == user_message.strip()
                        )
                        result = await db.execute(stmt)
                        fq = result.scalars().first()
                        
                        if fq:
                            fq.hit_count += 1
                            if fq.hit_count >= 5 and fq.status == "tracking":
                                fq.status = "pending_review"
                        else:
                            new_fq = FrequentQuestion(
                                tenant_id=tenant_id,
                                cluster_topic=user_message.strip(),
                                hit_count=1,
                                status="tracking"
                            )
                            db.add(new_fq)
                        await db.commit()
                except Exception as e:
                    logger.error("frequent_question_tracking_failed", error=str(e), tenant=tenant_id)

            logger.info(
                "agent_response_generated",
                tenant=tenant_id,
                contact=contact_id,
                sentiment=agent_response.sentiment,
                lead_score=agent_response.lead_score,
                sale_detected=agent_response.sale_detected,
            )

            return agent_response

        except anthropic.APIError as e:
            logger.error("claude_api_error", error=str(e), tenant=tenant_id)
            return AgentResponse(
                reply_text="I'm having a brief technical issue. Let me get back to you in just a moment! 🙏",
                metadata={"error": str(e)},
            )
        except Exception as e:
            logger.error("agent_unexpected_error", error=str(e), tenant=tenant_id)
            return AgentResponse(
                reply_text="Sorry, give me a moment — I'll get right back to you! 😊",
                metadata={"error": str(e)},
            )

    def _build_message_history(
        self,
        context_messages: list[dict],
        current_message: str,
        message_type: str,
        image_data: Optional[list] = None,
    ) -> list[dict]:
        """Build Claude-compatible message history from Redis context."""
        messages = []

        # Add context messages
        for msg in context_messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

        # Add current message
        if image_data and message_type == "image":
            content_blocks = []
            for img in image_data:
                content_blocks.append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": img.get("media_type", "image/jpeg"),
                        "data": img["data"],
                    },
                })
            if current_message:
                content_blocks.append({"type": "text", "text": current_message})
            messages.append({"role": "user", "content": content_blocks})
        else:
            prefix = ""
            if message_type == "voice":
                prefix = "[Voice message transcription]: "
            elif message_type == "video":
                prefix = "[Video description]: "
            elif message_type == "document":
                prefix = "[Document content]: "
            messages.append({"role": "user", "content": f"{prefix}{current_message}"})

        return messages

    async def _get_knowledge_context(self, tenant_id: str, query: str) -> str:
        """Retrieve relevant knowledge base chunks via RAG."""
        try:
            results = await rag_search(tenant_id, query, top_k=5)
            if not results:
                return ""
            context_parts = []
            for i, result in enumerate(results, 1):
                context_parts.append(f"[Source {i}] (relevance: {result['score']:.2f})\n{result['text']}")
            return "\n\n".join(context_parts)
        except Exception as e:
            logger.warning("rag_search_failed", error=str(e), tenant=tenant_id)
            return ""

    def _parse_response(self, raw_reply: str) -> AgentResponse:
        """Parse Claude's response to extract reply text and JSON metadata."""
        reply_text = raw_reply
        metadata = {}

        try:
            # Look for JSON block in the response
            if "```json" in raw_reply:
                parts = raw_reply.split("```json")
                reply_text = parts[0].strip()
                json_str = parts[1].split("```")[0].strip()
                metadata = json.loads(json_str)
            elif raw_reply.rstrip().endswith("}"):
                # Try to find JSON at the end
                lines = raw_reply.strip().split("\n")
                json_lines = []
                for line in reversed(lines):
                    json_lines.insert(0, line)
                    try:
                        candidate = "\n".join(json_lines)
                        metadata = json.loads(candidate)
                        reply_text = "\n".join(lines[:len(lines) - len(json_lines)]).strip()
                        break
                    except json.JSONDecodeError:
                        continue
        except (json.JSONDecodeError, IndexError, KeyError):
            logger.warning("metadata_parse_failed", reply_preview=raw_reply[:100])

        return AgentResponse(
            reply_text=reply_text,
            sentiment=metadata.get("sentiment", "neutral"),
            intent=metadata.get("intent", "general"),
            lead_score=metadata.get("lead_score", 0),
            human_handoff=metadata.get("human_handoff", False),
            sale_detected=metadata.get("sale_detected", False),
            unhandled_question=metadata.get("unhandled_question", False),
            confidence=metadata.get("confidence", 0.0),
            metadata=metadata,
        )


# Singleton instance
agent = ClaudeAgent()
