"""
Unified LLM routing service with intelligent provider selection and fallbacks.
Provides multi-provider routing (Groq, OpenRouter, Orbit Claude).
Includes cost control, fallback logic, and structure logging.
"""
import time
import structlog
from typing import List, Dict, Any, Optional

import openai
import anthropic

from app.config import settings

logger = structlog.get_logger(__name__)

# Heuristic thresholds for routing
GROQ_MAX_LENGTH = 50
OPENROUTER_MAX_LENGTH = 200

# Default Cost Control Parameters
DEFAULT_MAX_TOKENS = 800
DEFAULT_TEMPERATURE = 0.7


async def try_groq(messages: List[Dict[str, str]], max_tokens: int, temperature: float) -> dict:
    """Attempt generation using Groq API for fast execution."""
    start_time = time.time()
    try:
        client = openai.AsyncOpenAI(
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1"
        )
        model = "llama-3.3-70b-versatile"
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        latency = time.time() - start_time
        tokens = response.usage.total_tokens if response.usage else 0
        return {
            "provider": "Groq",
            "model": model,
            "response": response.choices[0].message.content,
            "tokens_used": tokens,
            "latency_sec": round(latency, 2)
        }
    except Exception as e:
        logger.warning("llm_provider_failed", provider="Groq", error=str(e), latency=time.time() - start_time)
        raise


async def try_openrouter(messages: List[Dict[str, str]], max_tokens: int, temperature: float) -> dict:
    """Attempt generation using OpenRouter for balanced cost/performance."""
    start_time = time.time()
    try:
        client = openai.AsyncOpenAI(
            api_key=settings.openrouter_api_key,
            base_url="https://openrouter.ai/api/v1"
        )
        model = "mistralai/mixtral-8x7b-instruct"
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        latency = time.time() - start_time
        tokens = response.usage.total_tokens if response.usage else 0
        return {
            "provider": "OpenRouter",
            "model": model,
            "response": response.choices[0].message.content,
            "tokens_used": tokens,
            "latency_sec": round(latency, 2)
        }
    except Exception as e:
        logger.warning("llm_provider_failed", provider="OpenRouter", error=str(e), latency=time.time() - start_time)
        raise


async def try_orbit_claude(messages: List[Dict[str, str]], max_tokens: int, temperature: float) -> dict:
    """Attempt generation using Orbit Claude for complex reasoning tasks."""
    start_time = time.time()
    try:
        client = anthropic.AsyncAnthropic(
            api_key=settings.orbit_api_key,
        )
        # Assuming Orbit simply routes through Anthropic SDK endpoints/format
        model = "claude-3-5-sonnet-20241022" 
        
        # Convert messages to Anthropic format
        anthropic_messages = []
        system_prompt = ""
        for msg in messages:
            if msg.get("role") == "system":
                system_prompt += msg.get("content", "") + "\n"
            else:
                anthropic_messages.append({
                    "role": msg.get("role", "user"), 
                    "content": msg.get("content", "")
                })
        
        kwargs = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": anthropic_messages,
        }
        if system_prompt:
            kwargs["system"] = system_prompt.strip()

        response = await client.messages.create(**kwargs)
        
        latency = time.time() - start_time
        tokens = response.usage.input_tokens + response.usage.output_tokens if response.usage else 0
        
        return {
            "provider": "Orbit Claude",
            "model": model,
            "response": response.content[0].text,
            "tokens_used": tokens,
            "latency_sec": round(latency, 2)
        }
    except Exception as e:
        logger.warning("llm_provider_failed", provider="Orbit Claude", error=str(e), latency=time.time() - start_time)
        raise


def determine_complexity(message: str) -> str:
    """
    Evaluate message complexity using simple heuristics.
    Used to route to the most cost-effective and capable provider.
    """
    lower_msg = message.lower()
    
    # Keywords indicating a need for deep reasoning
    advanced_keywords = [
        "analyze", "reason", "complex", "explain", "why", "how", "evaluate", "synthesize", "compare"
    ]
    
    if any(keyword in lower_msg for keyword in advanced_keywords):
        return "HIGH"
        
    length = len(message)
    if length < GROQ_MAX_LENGTH:
        return "LOW"
    elif length <= OPENROUTER_MAX_LENGTH:
        return "MEDIUM"
    else:
        return "HIGH"


async def generate_response(
    message: str,
    conversation_history: list,
    mode: str = "chat"
) -> dict:
    """
    Unified multi-provider LLM routing endpoint.
    Expects conversation_history as a list of dicts: [{"role": "...", "content": "..."}]
    """
    messages = []
    if conversation_history:
        messages.extend(conversation_history)
    messages.append({"role": "user", "content": message})
    
    complexity = determine_complexity(message)
    logger.info("llm_routing_decision", complexity=complexity, message_length=len(message))
    
    # Base cost control
    max_tokens = DEFAULT_MAX_TOKENS
    temperature = DEFAULT_TEMPERATURE
    
    # Adjust for complexity
    if complexity == "HIGH":
        max_tokens = 2000
        temperature = 0.5
    
    # Build fallback sequence based on complexity routing requirements
    if complexity == "LOW":
        # Target: Groq -> fallback: OpenRouter -> fallback: Orbit
        routing_sequence = [try_groq, try_openrouter, try_orbit_claude]
    elif complexity == "MEDIUM":
        # Target: OpenRouter -> fallback: Orbit
        routing_sequence = [try_openrouter, try_orbit_claude]
    else: 
        # Target: Orbit -> fallback: OpenRouter (safe fallback)
        routing_sequence = [try_orbit_claude, try_openrouter]
        
    for provider_func in routing_sequence:
        try:
            result = await provider_func(messages, max_tokens, temperature)
            logger.info(
                "llm_generation_success", 
                provider=result["provider"],
                model=result["model"],
                tokens=result["tokens_used"],
                latency=result["latency_sec"]
            )
            return dict(result)
        except Exception:
            logger.info("llm_fallback_triggered", failed_provider=provider_func.__name__)
            continue
            
    # Absolute final failure scenario
    logger.error("all_llm_providers_failed", final_message="Could not generate response.")
    raise RuntimeError("All configured LLM providers failed to generate a response.")
