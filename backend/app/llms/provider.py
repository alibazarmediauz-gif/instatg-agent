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

    # Google/Groq typically don't share the same embedding endpoint via OpenAI SDK
    # We'll default to OpenAI if key is present, otherwise error
    if settings.openai_api_key:
        client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.embeddings.create(model=settings.embedding_model, input=text)
        return response.data[0].embedding

    raise RuntimeError(f"Embedding provider '{provider}' not implemented or no OpenAI key for embeddings.")


async def generate_text(prompt: str, model: Optional[str] = None, max_tokens: int = 512) -> str:
    """Generate text from `prompt` using configured provider."""
    provider = (settings.llm_provider or "openai").lower()
    
    if provider == "groq":
        client = openai.AsyncOpenAI(
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1"
        )
        model = model or "llama-3.3-70b-versatile"
    elif provider == "google":
        client = openai.AsyncOpenAI(
            api_key=settings.google_api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )
        model = model or "gemini-1.5-flash"
    else:
        # Default to OpenAI
        client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        model = model or "gpt-3.5-turbo"

    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
        )
        return resp.choices[0].message.content
    except Exception as e:
        logger.error("llm_generation_failed", provider=provider, model=model, error=str(e))
        raise
