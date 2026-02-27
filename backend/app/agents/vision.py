"""
InstaTG Agent — Vision Handler

Processes images and videos using Claude Vision API.
Extracts keyframes from video via ffmpeg for analysis.
"""

import base64
import subprocess
import tempfile
import os
import structlog
from typing import Optional
from dataclasses import dataclass

import anthropic

from app.config import settings

logger = structlog.get_logger(__name__)


@dataclass
class VisionResult:
    """Result of visual content analysis."""
    description: str
    content_type: str = "image"
    is_product_related: bool = False
    detected_text: str = ""
    metadata: dict = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class VisionHandler:
    """Handles image and video analysis using Claude Vision API."""

    def __init__(self):
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def analyze_image(
        self,
        image_data: bytes,
        media_type: str = "image/jpeg",
        context: str = "",
    ) -> VisionResult:
        """
        Analyze a single image using Claude Vision.
        
        Args:
            image_data: Raw image bytes
            media_type: MIME type (image/jpeg, image/png, image/webp, image/gif)
            context: Optional conversation context for better analysis
        
        Returns:
            VisionResult with description and metadata
        """
        try:
            b64_image = base64.b64encode(image_data).decode("utf-8")

            prompt = (
                "Analyze this image in the context of a sales conversation. "
                "Describe what you see clearly and concisely. "
                "If it's a product image, describe the product details (model, color, features). "
                "If it contains text, OCR and include the text. "
                "If it's a screenshot of a conversation, summarize the key points. "
                "If it's a document or price list, extract the important information. "
                "Keep your response under 200 words."
            )
            if context:
                prompt += f"\n\nConversation context: {context}"

            response = await self.client.messages.create(
                model=settings.claude_model,
                max_tokens=512,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": b64_image,
                                },
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
            )

            description = response.content[0].text

            logger.info("image_analyzed", description_length=len(description))

            return VisionResult(
                description=description,
                content_type="image",
                is_product_related="product" in description.lower() or "price" in description.lower(),
            )

        except anthropic.APIError as e:
            logger.error("vision_api_error", error=str(e))
            return VisionResult(
                description="I received your image but couldn't analyze it right now. Could you describe what you're showing me?",
                metadata={"error": str(e)},
            )
        except Exception as e:
            logger.error("vision_unexpected_error", error=str(e))
            return VisionResult(
                description="Image received. Could you tell me more about what you'd like to know?",
                metadata={"error": str(e)},
            )

    async def analyze_video(
        self,
        video_data: bytes,
        filename: str = "video.mp4",
        max_frames: int = 4,
        context: str = "",
    ) -> VisionResult:
        """
        Extract keyframes from video and analyze them with Claude Vision.
        
        Args:
            video_data: Raw video bytes
            filename: Original filename
            max_frames: Maximum number of keyframes to extract
            context: Optional conversation context
        
        Returns:
            VisionResult with combined frame descriptions
        """
        try:
            frames = await self._extract_keyframes(video_data, filename, max_frames)

            if not frames:
                logger.warning("no_frames_extracted", filename=filename)
                return VisionResult(
                    description="I received your video but couldn't process it. Could you describe what's in it?",
                    content_type="video",
                )

            # Build multi-image message for Claude
            content_blocks = []
            for i, frame_data in enumerate(frames):
                b64_frame = base64.b64encode(frame_data).decode("utf-8")
                content_blocks.append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": b64_frame,
                    },
                })

            prompt = (
                f"These are {len(frames)} keyframes extracted from a video sent in a sales conversation. "
                "Describe the overall content of the video based on these frames. "
                "If it shows a product, describe it in detail. "
                "If it's a demo or tutorial, summarize the key steps. "
                "Keep your response under 200 words."
            )
            if context:
                prompt += f"\n\nConversation context: {context}"

            content_blocks.append({"type": "text", "text": prompt})

            response = await self.client.messages.create(
                model=settings.claude_model,
                max_tokens=512,
                messages=[{"role": "user", "content": content_blocks}],
            )

            description = response.content[0].text

            logger.info("video_analyzed", frames_count=len(frames), description_length=len(description))

            return VisionResult(
                description=description,
                content_type="video",
                is_product_related="product" in description.lower(),
                metadata={"frames_extracted": len(frames)},
            )

        except Exception as e:
            logger.error("video_analysis_error", error=str(e))
            return VisionResult(
                description="I received your video. Could you tell me what it shows?",
                content_type="video",
                metadata={"error": str(e)},
            )

    async def _extract_keyframes(
        self,
        video_data: bytes,
        filename: str,
        max_frames: int,
    ) -> list[bytes]:
        """Extract keyframes from video using ffmpeg."""
        frames = []

        with tempfile.TemporaryDirectory() as tmpdir:
            video_path = os.path.join(tmpdir, filename)
            with open(video_path, "wb") as f:
                f.write(video_data)

            output_pattern = os.path.join(tmpdir, "frame_%03d.jpg")

            try:
                # Get video duration first
                probe_cmd = [
                    "ffprobe", "-v", "quiet",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    video_path,
                ]
                result = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=30)
                duration = float(result.stdout.strip()) if result.stdout.strip() else 10.0

                # Calculate interval between frames
                interval = max(duration / (max_frames + 1), 1.0)

                # Extract frames at regular intervals
                cmd = [
                    "ffmpeg", "-i", video_path,
                    "-vf", f"fps=1/{interval}",
                    "-frames:v", str(max_frames),
                    "-q:v", "2",
                    output_pattern,
                    "-y",
                ]
                subprocess.run(cmd, capture_output=True, timeout=60)

                # Read extracted frames
                for i in range(1, max_frames + 1):
                    frame_path = os.path.join(tmpdir, f"frame_{i:03d}.jpg")
                    if os.path.exists(frame_path):
                        with open(frame_path, "rb") as f:
                            frames.append(f.read())

                logger.info("keyframes_extracted", count=len(frames), duration=duration)

            except subprocess.TimeoutExpired:
                logger.error("ffmpeg_timeout", filename=filename)
            except FileNotFoundError:
                logger.error("ffmpeg_not_found", message="ffmpeg is not installed")
            except Exception as e:
                logger.error("keyframe_extraction_error", error=str(e))

        return frames

    def get_image_base64(self, image_data: bytes, media_type: str = "image/jpeg") -> dict:
        """Convert image bytes to base64 dict for Claude Vision."""
        return {
            "data": base64.b64encode(image_data).decode("utf-8"),
            "media_type": media_type,
        }


# Singleton instance
vision = VisionHandler()
