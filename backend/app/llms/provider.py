"""
Simple LLM provider wrapper.
Provides `get_embedding` and `generate_text` helpers with a pluggable provider selector.
Currently supports OpenAI (default). Placeholders for OpenRouter/HuggingFace are present.
"""
import structlog
from typing import List, Optional

import openai

from app.config import settings

logger = structlog.get_logger(__name__)


async def get_embedding(text: str) -> List[float]:
    """Return embedding vector for `text` using configured provider."""
    provider = (settings.llm_provider or "openai").lower()

    if provider == "openai":
        client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.embeddings.create(model=settings.embedding_model, input=text)
        return response.data[0].embedding

    # Future: implement OpenRouter / HuggingFace embedding calls here
    raise RuntimeError(f"Embedding provider '{provider}' not implemented. Set LLM_PROVIDER=openai or implement provider.")


async def generate_text(prompt: str, model: Optional[str] = None, max_tokens: int = 512) -> str:
    """Generate text from `prompt` using configured provider.

    Returns plain text string.
    """
    provider = (settings.llm_provider or "openai").lower()
    model = model or settings.embedding_model

    if provider == "openai":
        client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        # Use chat completion-ish interface if available, otherwise fall back
        try:
            resp = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
            )
            # Best-effort extract
            return resp.choices[0].message.content
        except Exception:
            # Older response shape
            resp = await client.completions.create(model=model, prompt=prompt, max_tokens=max_tokens)
            return getattr(resp, "text", resp.choices[0].text)

    raise RuntimeError(f"Text generation provider '{provider}' not implemented.")
