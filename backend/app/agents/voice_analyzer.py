"""
InstaTG Agent — Voice Analyzer

Whisper STT transcription + Claude-based sales analysis of voice messages.
Identifies tone, emotion, pain points, and exact sales outcome moments.
"""

import io
import structlog
from dataclasses import dataclass, field
from typing import Optional

import openai
import anthropic

from app.config import settings

logger = structlog.get_logger(__name__)


@dataclass
class VoiceAnalysisResult:
    """Complete analysis of a voice message."""
    transcription: str
    duration_seconds: float = 0.0
    tone: str = "neutral"
    emotion: str = "calm"
    pain_points: list[str] = field(default_factory=list)
    sale_outcome_reason: str = ""
    sales_moment_analysis: str = ""
    summary: str = ""
    raw_analysis: dict = field(default_factory=dict)


VOICE_ANALYSIS_PROMPT = """You are an expert sales conversation analyst. Analyze this voice message transcription from a sales conversation.

TRANSCRIPTION:
{transcription}

CONVERSATION CONTEXT (previous messages):
{context}

Provide a detailed analysis in the following JSON format:
```json
{{
    "tone": "friendly|aggressive|hesitant|confident|frustrated|excited|neutral",
    "emotion": "happy|angry|sad|confused|interested|disinterested|anxious|calm|enthusiastic",
    "pain_points": ["list of customer pain points or concerns identified"],
    "sale_outcome_reason": "Detailed explanation: 'Sale happened because...' or 'Sale failed because...' or 'Sale is in progress because...'",
    "sales_moment_analysis": "Identify the exact moment/phrase where the sale was won or lost, or the turning point in the conversation",
    "summary": "Brief 2-3 sentence summary of what was communicated in the voice message"
}}
```

Be specific and actionable in your analysis. Focus on the WHY behind the customer's behavior."""


class VoiceAnalyzer:
    """Handles voice message transcription and sales analysis."""

    def __init__(self):
        self.openai_client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        self.anthropic_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def transcribe(self, audio_data: bytes, filename: str = "audio.ogg") -> tuple[str, float]:
        """
        Transcribe audio using OpenAI Whisper.
        
        Args:
            audio_data: Raw audio bytes
            filename: Original filename (for format detection)
        
        Returns:
            Tuple of (transcription_text, duration_seconds)
        """
        try:
            audio_file = io.BytesIO(audio_data)
            audio_file.name = filename

            response = await self.openai_client.audio.transcriptions.create(
                model=settings.whisper_model,
                file=audio_file,
                response_format="verbose_json",
            )

            transcription = response.text
            duration = getattr(response, "duration", 0.0) or 0.0

            logger.info(
                "voice_transcribed",
                duration=duration,
                text_length=len(transcription),
            )

            return transcription, duration

        except openai.APIError as e:
            logger.error("whisper_api_error", error=str(e))
            raise
        except Exception as e:
            logger.error("transcription_error", error=str(e))
            raise

    async def analyze(
        self,
        transcription: str,
        duration_seconds: float = 0.0,
        context: str = "",
    ) -> VoiceAnalysisResult:
        """
        Perform deep sales analysis on a voice transcription.
        
        Args:
            transcription: Text from Whisper STT
            duration_seconds: Audio duration
            context: Previous conversation context
        
        Returns:
            VoiceAnalysisResult with full analysis
        """
        try:
            prompt = VOICE_ANALYSIS_PROMPT.format(
                transcription=transcription,
                context=context or "No previous context available.",
            )

            response = await self.anthropic_client.messages.create(
                model=settings.claude_model,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )

            raw_text = response.content[0].text
            analysis = self._parse_analysis(raw_text)

            result = VoiceAnalysisResult(
                transcription=transcription,
                duration_seconds=duration_seconds,
                tone=analysis.get("tone", "neutral"),
                emotion=analysis.get("emotion", "calm"),
                pain_points=analysis.get("pain_points", []),
                sale_outcome_reason=analysis.get("sale_outcome_reason", ""),
                sales_moment_analysis=analysis.get("sales_moment_analysis", ""),
                summary=analysis.get("summary", ""),
                raw_analysis=analysis,
            )

            logger.info(
                "voice_analyzed",
                tone=result.tone,
                emotion=result.emotion,
                pain_points_count=len(result.pain_points),
            )

            return result

        except Exception as e:
            logger.error("voice_analysis_error", error=str(e))
            return VoiceAnalysisResult(
                transcription=transcription,
                duration_seconds=duration_seconds,
                summary=f"Analysis failed: {str(e)}",
            )

    async def transcribe_and_analyze(
        self,
        audio_data: bytes,
        filename: str = "audio.ogg",
        context: str = "",
    ) -> VoiceAnalysisResult:
        """
        Full pipeline: transcribe audio then analyze for sales insights.
        
        Args:
            audio_data: Raw audio bytes
            filename: Audio filename
            context: Previous conversation context
        
        Returns:
            VoiceAnalysisResult with transcription and analysis
        """
        transcription, duration = await self.transcribe(audio_data, filename)
        return await self.analyze(transcription, duration, context)

    def _parse_analysis(self, raw_text: str) -> dict:
        """Parse Claude's analysis JSON from the response."""
        import json

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
            logger.warning("voice_analysis_parse_failed", text_preview=raw_text[:200])
            return {"summary": raw_text[:500]}


# Singleton instance
voice_analyzer = VoiceAnalyzer()
