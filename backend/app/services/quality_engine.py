import structlog
from typing import Dict, Any, List
from app.agents.claude_agent import ClaudeAgent
from app.models import SalesInteraction

logger = structlog.get_logger(__name__)

class QualityEngine:
    """
    AI QA Auditor for InstaTG Agent.
    Analyzes transcripts to provide quality scores, sentiment, and detect performance gaps.
    """
    def __init__(self):
        self.ai = ClaudeAgent()

    async def grade_interaction(self, interaction_id: str, transcript: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Grades an interaction based on script adherence, helpfulness, and professional tone.
        """
        formatted_transcript = "\n".join([f"{t['role'].upper()}: {t['text']}" for t in transcript])
        
        prompt = f"""
        Analyze this sales interaction transcript and provide a quality audit for the Uzbekistan market.
        
        Transcript:
        {formatted_transcript}
        
        Evaluation Criteria:
        1. Professionalism: Did the agent use polite UZ/RU forms (e.g., 'Siz', 'Assalomu alaykum')?
        2. Script Adherence: Did the agent mention the core offer?
        3. Objection Handling: Did the agent address customer concerns or give up?
        
        Provide the result in JSON format:
        {{
            "qa_grade": int (0-100),
            "sentiment": "positive" | "neutral" | "negative",
            "detected_objections": [string],
            "summary": "1-2 sentence summary in UZBEK or RUSSIAN",
            "needs_human_review": boolean,
            "improvement_tip": "Specific tip for the agent"
        }}
        """
        
        try:
            response = await self.ai.generate_response(
                message=prompt,
                chat_history=[],
                system_prompt="You are a professional QA Sales Auditor for Uzbekistan. You speak Uzbek and Russian fluently."
            )
            
            import json
            import re
            
            # Extract JSON
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                logger.info("interaction_graded", interaction_id=interaction_id, grade=result.get("qa_grade"))
                return result
            
            logger.error("quality_engine_json_error", response=response)
            return {"qa_grade": 0, "error": "JSON parse error"}
            
        except Exception as e:
            logger.error("quality_engine_error", interaction_id=interaction_id, error=str(e))
            return {"qa_grade": 0, "error": str(e)}

    async def update_interaction_score(self, db, interaction: SalesInteraction):
        """Analyze and update the interaction in the database."""
        # This would be called post-interaction
        # transcript = fetch_transcript_from_logs(interaction.id)
        # res = await self.grade_interaction(interaction.id, transcript)
        # interaction.qa_grade = res.get("qa_grade")
        # interaction.detected_objections = res.get("detected_objections")
        # await db.commit()
        pass

# Global instance
quality_engine = QualityEngine()
