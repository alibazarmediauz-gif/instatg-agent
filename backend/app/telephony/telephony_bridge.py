import structlog
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod

logger = structlog.get_logger(__name__)

class BaseTelephonyProvider(ABC):
    @abstractmethod
    async def make_call(self, from_number: str, to_number: str, agent_id: str) -> str:
        """Initiate an outbound call and return a provider-specific call_id."""
        pass

    @abstractmethod
    async def hangup_call(self, call_id: str) -> bool:
        """Terminate an active call."""
        pass

class ZadarmaProvider(BaseTelephonyProvider):
    async def make_call(self, from_number: str, to_number: str, agent_id: str) -> str:
        logger.info("zadarma_dialing", to=to_number, via=from_number)
        # Mock Zadarma API call
        return f"zad_{agent_id}_{to_number}"

    async def hangup_call(self, call_id: str) -> bool:
        logger.info("zadarma_hangup", call_id=call_id)
        return True

class LocalUZSIPProvider(BaseTelephonyProvider):
    async def make_call(self, from_number: str, to_number: str, agent_id: str) -> str:
        logger.info("local_uz_sip_dialing", to=to_number)
        return f"uz_sip_{agent_id}"

    async def hangup_call(self, call_id: str) -> bool:
        return True

class VapiProvider(BaseTelephonyProvider):
    async def make_call(self, from_number: str, to_number: str, agent_id: str) -> str:
        from app.telephony.vapi_service import create_vapi_call
        # system_prompt can be passed if needed
        res = await create_vapi_call(to_number, agent_id, "default_tenant")
        return res.get("id") if res else "error"

    async def hangup_call(self, call_id: str) -> bool:
        return True

class TelephonyBridge:
    """
    Unified bridge to switch between different telephony providers (Vapi, Zadarma, Local SIP).
    Supports localized routing for the Uzbekistan market.
    """
    def __init__(self):
        self.providers: Dict[str, BaseTelephonyProvider] = {
            "vapi": VapiProvider(),
            "zadarma": ZadarmaProvider(),
            "local_uz": LocalUZSIPProvider()
        }

    async def dispatch_call(self, provider_name: str, from_number: str, to_number: str, agent_id: str):
        provider = self.providers.get(provider_name) or self.providers["vapi"]
        return await provider.make_call(from_number, to_number, agent_id)

telephony_bridge = TelephonyBridge()
