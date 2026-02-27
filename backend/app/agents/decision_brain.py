import structlog
from typing import Dict, Any, List
from app.agents.claude_agent import ClaudeAgent

logger = structlog.get_logger(__name__)

class DecisionBrain:
    """
    Intelligent decision engine for Voice and Chat funnels.
    Determines user intent or detects keywords to decide next funnel steps.
    """
    def __init__(self):
        self.ai = ClaudeAgent()

    async def decide_next_step(self, message: str, current_node: Dict[str, Any], context: Dict[str, Any]) -> str:
        """
        Analyze user input against node branching rules.
        Returns the ID of the next node to transition to.
        """
        rules = current_node.get("edges", []) # Branching rules (e.g., if price -> node_3)
        
        if not rules:
            return "default_handoff" # Fallback

        # Construct prompt for quick classification
        prompt = f"""
        Analyze the following customer message and decide which funnel branch to take.
        Message: "{message}"
        
        Available Branches:
        {chr(10).join([f"- {r.get('id')}: {r.get('condition_description')} (Trigger: {r.get('trigger_type')})" for r in rules])}
        
        Output ONLY the Branch ID that best fits. If none fit perfectly, output "DEFAULT".
        """

        try:
            decision = await self.ai.generate_response(
                message=prompt,
                chat_history=[],
                system_prompt="You are a funnel logic router. Precise and deterministic."
            )
            decision = decision.strip().upper()
            
            # Find matching rule ID
            for rule in rules:
                if rule.get("id").upper() == decision:
                    return rule.get("id")
            
            return "default"
        except Exception as e:
            logger.error("decision_brain_error", error=str(e))
            return "error_fallback"

    async def detect_objection(self, message: str) -> bool:
        """Specialized check for common sales objections (Price, Timing, Authority)."""
        prompt = f"Does the following message contain a sales objection (price, competition, no time)? Answer YES or NO only. Message: {message}"
        res = await self.ai.generate_response(message=prompt, chat_history=[], system_prompt="Objection detector.")
        return "YES" in res.upper()

# Global singleton
decision_brain = DecisionBrain()
