"""
Vapi Integration Service
Handles real-time AI voice calls using Vapi.ai
"""

import httpx
import structlog
from app.config import settings

logger = structlog.get_logger(__name__)

VAPI_BASE_URL = "https://api.vapi.ai"

async def create_vapi_call(phone_number: str, agent_id: str, tenant_id: str, system_prompt: str = ""):
    """Initiate an outbound call via Vapi."""
    headers = {
        "Authorization": f"Bearer {settings.vapi_api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "phoneNumberId": settings.vapi_phone_number_id,
        "assistantId": agent_id,
        "customer": {
            "number": phone_number
        },
        "assistantOverrides": {
            "variableValues": {
                "tenantId": tenant_id
            }
        }
    }
    
    if system_prompt:
        payload["assistantOverrides"]["instructions"] = system_prompt

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{VAPI_BASE_URL}/call/phone", json=payload, headers=headers)
            if response.status_code == 201:
                logger.info("vapi_call_initiated", phone=phone_number, call_id=response.json().get("id"))
                return response.json()
            else:
                logger.error("vapi_call_failed", status=response.status_code, body=response.text)
                return None
        except Exception as e:
            logger.error("vapi_exception", error=str(e))
            return None
