import structlog
from typing import Dict, Any, Tuple
import json
import random

logger = structlog.get_logger(__name__)

# NOTE: In a production environment, this would integrate directly with LangChain/LlamaIndex
# using OpenAI/Anthropic models to route the prompt. For this architectural implementation,
# we construct the node structure and simulate the LLM inference based on heuristics.

class AISalesBrain:
    """
    AI Sales Engine that replicates a professional human sales department.
    Handles intent detection, objection handling, and deal closing logic.
    """
    def __init__(self, tenant_id: str, agent_id: str):
        self.tenant_id = tenant_id
        self.agent_id = agent_id

    async def classify_intent(self, user_message: str) -> str:
        """
        Classifier Node: Determines the category of the user's message.
        Categories: Question, Objection, Buying_Signal, Smalltalk
        """
        msg_lower = user_message.lower()
        if any(word in msg_lower for word in ["expensive", "too much", "competitor", "not sure", "later"]):
            return "Objection"
        elif any(word in msg_lower for word in ["buy", "price", "cost", "how to pay", "sign up", "start"]):
            return "Buying_Signal"
        elif "?" in msg_lower or any(word in msg_lower for word in ["how", "what", "can you", "does it"]):
            return "Question"
        return "Smalltalk"

    async def handle_objection(self, user_message: str, context: Dict[str, Any]) -> str:
        """
        Objection Handler Node: Triggers persuasion frameworks (e.g., SPIN, Challenger).
        """
        logger.info("sales_brain_objection_handler", message=user_message)
        # LLM would generate actual response here using the provided context
        return "I understand price is a concern. However, our solution reduces your operational costs by 40% on average in the first 3 months. Let's look at the ROI."

    async def handle_closing(self, user_message: str, context: Dict[str, Any]) -> Tuple[str, bool]:
        """
        Closer Node: Generates final push and determines if payment link should be sent.
        Returns (Response text, Should Send Link)
        """
        logger.info("sales_brain_closer", message=user_message)
        # LLM would generate actual response here
        return "Great! I'll generate your secure payment link right now so we can get started.", True

    async def base_conversation(self, user_message: str, context: Dict[str, Any]) -> str:
        """
        Standard RAG Knowledge Response
        """
        return "Here is some information about our product features based on your query."

    async def calculate_deal_probability(self, interaction_history: list) -> float:
        """
        Analyzes conversational milestones to calculate deal probability %.
        """
        base_prob = 10.0
        
        for msg in interaction_history:
            intent = await self.classify_intent(msg.get("content", ""))
            if intent == "Question":
                base_prob += 5.0
            elif intent == "Objection":
                base_prob -= 2.0
            elif intent == "Buying_Signal":
                base_prob += 20.0
                
        # Cap at 95% for unclosed deals
        return min(max(base_prob, 0.0), 95.0)

    async def process_utterance(self, user_message: str, interaction_history: list) -> Dict[str, Any]:
        """
        Main routing function for the Sales Brain.
        """
        intent = await self.classify_intent(user_message)
        
        response_text = ""
        action = None
        
        if intent == "Objection":
            response_text = await self.handle_objection(user_message, {})
        elif intent == "Buying_Signal":
            response_text, should_send_link = await self.handle_closing(user_message, {})
            if should_send_link:
                action = "generate_payment_link"
        elif intent == "Question":
            response_text = await self.base_conversation(user_message, {})
        else:
            response_text = "I'm here to help with any questions you have about our services."

        new_prob = await self.calculate_deal_probability(interaction_history + [{"content": user_message}])

        return {
            "intent": intent,
            "response": response_text,
            "deal_probability": new_prob,
            "suggested_action": action
        }
