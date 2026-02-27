"""
InstaTG Agent — AmoCRM Integration

REST API client for AmoCRM with OAuth2 token management.
Auto-creates leads, updates conversation summaries, and manages pipeline stages.
"""

import structlog
from datetime import datetime
from typing import Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

logger = structlog.get_logger(__name__)


class AmoCRMClient:
    """AmoCRM REST API client with automatic token refresh."""

    def __init__(self, subdomain: str, access_token: str, refresh_token: str = ""):
        self.subdomain = subdomain
        self.base_url = f"https://{subdomain}.amocrm.ru" if ".amocrm.ru" not in subdomain else subdomain
        self.client_id = settings.amocrm_client_id
        self.client_secret = settings.amocrm_client_secret
        self.redirect_uri = settings.amocrm_redirect_uri
        self._access_token = access_token
        self._refresh_token = refresh_token

    @property
    def headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._access_token}",
            "Content-Type": "application/json",
        }

    @property
    def is_configured(self) -> bool:
        return bool(self.base_url and self._access_token)

    # ─── OAuth2 Token Management ──────────────────────────────────

    async def refresh_access_token(self) -> bool:
        """Refresh OAuth2 access token using refresh token."""
        if not self._refresh_token:
            logger.error("amocrm_no_refresh_token")
            return False

        url = f"{self.base_url}/oauth2/access_token"
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "refresh_token",
            "refresh_token": self._refresh_token,
            "redirect_uri": self.redirect_uri,
        }

        try:
            async with httpx.AsyncClient() as http:
                response = await http.post(url, json=payload, timeout=15)

                if response.status_code == 200:
                    data = response.json()
                    self._access_token = data["access_token"]
                    self._refresh_token = data["refresh_token"]
                    logger.info("amocrm_token_refreshed")
                    return True
                else:
                    logger.error("amocrm_token_refresh_failed", status=response.status_code, body=response.text)
                    return False

        except Exception as e:
            logger.error("amocrm_token_refresh_error", error=str(e))
            return False

    async def exchange_code(self, auth_code: str) -> dict:
        """Exchange authorization code for access + refresh tokens."""
        url = f"{self.base_url}/oauth2/access_token"
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "authorization_code",
            "code": auth_code,
            "redirect_uri": self.redirect_uri,
        }

        async with httpx.AsyncClient() as http:
            response = await http.post(url, json=payload, timeout=15)

            if response.status_code == 200:
                data = response.json()
                self._access_token = data["access_token"]
                self._refresh_token = data["refresh_token"]
                logger.info("amocrm_code_exchanged")
                return data
            else:
                logger.error("amocrm_code_exchange_failed", status=response.status_code)
                raise Exception(f"AmoCRM auth failed: {response.text}")

    # ─── API Request Wrapper ──────────────────────────────────────

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
    async def _request(
        self,
        method: str,
        endpoint: str,
        json_data: Optional[dict] = None,
        params: Optional[dict] = None,
    ) -> dict:
        """Make an authenticated API request with auto-retry and token refresh."""
        url = f"{self.base_url}/api/v4/{endpoint.lstrip('/')}"

        async with httpx.AsyncClient() as http:
            response = await http.request(
                method=method,
                url=url,
                headers=self.headers,
                json=json_data,
                params=params,
                timeout=15,
            )

            # Token expired — refresh and retry
            if response.status_code == 401:
                refreshed = await self.refresh_access_token()
                if refreshed:
                    response = await http.request(
                        method=method,
                        url=url,
                        headers=self.headers,
                        json=json_data,
                        params=params,
                        timeout=15,
                    )

            if response.status_code in (200, 201):
                return response.json() if response.text else {}
            elif response.status_code == 204:
                return {}
            else:
                logger.error(
                    "amocrm_api_error",
                    method=method,
                    endpoint=endpoint,
                    status=response.status_code,
                    body=response.text[:500],
                )
                return {"error": True, "status": response.status_code, "detail": response.text}

    # ─── Contact Management ──────────────────────────────────────

    async def create_contact(
        self,
        name: str,
        phone: str = "",
        email: str = "",
        custom_fields: Optional[list] = None,
    ) -> Optional[str]:
        """Create a new contact in AmoCRM."""
        contact_data = [{"name": name}]

        custom = custom_fields or []
        if phone:
            custom.append({"field_code": "PHONE", "values": [{"value": phone, "enum_code": "WORK"}]})
        if email:
            custom.append({"field_code": "EMAIL", "values": [{"value": email, "enum_code": "WORK"}]})

        if custom:
            contact_data[0]["custom_fields_values"] = custom

        result = await self._request("POST", "/contacts", json_data=contact_data)

        if result and not result.get("error"):
            embedded = result.get("_embedded", {})
            contacts = embedded.get("contacts", [])
            if contacts:
                contact_id = str(contacts[0]["id"])
                logger.info("amocrm_contact_created", contact_id=contact_id, name=name)
                return contact_id

        return None

    # ─── Lead Management ─────────────────────────────────────────

    async def create_lead(
        self,
        contact_name: str,
        channel: str,
        username: str = "",
        first_message: str = "",
        contact_id: Optional[str] = None,
    ) -> Optional[str]:
        """
        Create a new lead in AmoCRM when a contact writes for the first time.
        
        Returns the AmoCRM lead ID or None on failure.
        """
        if not self.is_configured:
            logger.warning("amocrm_not_configured")
            return None

        lead_name = f"{channel.capitalize()} — {contact_name}"

        lead_data = [{
            "name": lead_name,
            "custom_fields_values": [
                {
                    "field_code": "PHONE",
                    "values": [{"value": username or contact_name}],
                },
            ],
        }]

        # Add note with first message
        if contact_id:
            lead_data[0]["_embedded"] = {
                "contacts": [{"id": int(contact_id)}],
            }

        result = await self._request("POST", "/leads", json_data=lead_data)

        if result and not result.get("error"):
            embedded = result.get("_embedded", {})
            leads = embedded.get("leads", [])
            if leads:
                lead_id = str(leads[0]["id"])
                logger.info(
                    "amocrm_lead_created",
                    lead_id=lead_id,
                    contact=contact_name,
                    channel=channel,
                )

                # Add note with first message
                if first_message:
                    await self.add_note(lead_id, f"First message:\n{first_message}")

                return lead_id

        return None

    async def update_lead_summary(self, lead_id: str, summary: str) -> bool:
        """Update a lead with conversation summary as a note."""
        return await self.add_note(lead_id, f"Conversation Summary:\n{summary}")

    async def move_lead_to_stage(self, lead_id: str, stage: str) -> bool:
        """
        Move a lead to a specific pipeline stage.
        stage: 'won', 'lost', 'follow_up'
        """
        # AmoCRM uses status_id for pipeline stages
        # These IDs are pipeline-specific — map them here
        stage_map = {
            "won": 142,        # "Успешно реализовано" (Won)
            "lost": 143,       # "Закрыто и не реализовано" (Lost)
            "follow_up": 141,  # Custom follow-up stage
        }

        status_id = stage_map.get(stage)
        if not status_id:
            logger.warning("amocrm_unknown_stage", stage=stage)
            return False

        lead_data = [{"id": int(lead_id), "status_id": status_id}]
        result = await self._request("PATCH", "/leads", json_data=lead_data)

        if result and not result.get("error"):
            logger.info("amocrm_lead_stage_updated", lead_id=lead_id, stage=stage)
            return True

        return False

    # ─── Notes ───────────────────────────────────────────────────

    async def add_note(self, entity_id: str, text: str, entity_type: str = "leads") -> bool:
        """Add a text note to a lead or contact."""
        note_data = [{
            "note_type": "common",
            "params": {"text": text},
        }]

        endpoint = f"/{entity_type}/{entity_id}/notes"
        result = await self._request("POST", endpoint, json_data=note_data)

        if result and not result.get("error"):
            logger.info("amocrm_note_added", entity_id=entity_id)
            return True

        return False

    # ─── Auto Lead Creation (called from channels) ───────────────

    async def auto_create_lead_if_new(
        self,
        tenant_id: str,
        contact_name: str,
        contact_username: str,
        channel: str,
        first_message: str,
    ) -> Optional[str]:
        """
        Create a lead automatically when a new contact writes.
        This is the main entry point called from Telegram/Instagram handlers.
        """
        if not self.is_configured:
            return None

        try:
            # Create contact first
            contact_id = await self.create_contact(
                name=contact_name,
                custom_fields=[{
                    "field_code": "IM",
                    "values": [{"value": contact_username, "enum_code": channel.upper()}],
                }],
            )

            # Create lead linked to contact
            lead_id = await self.create_lead(
                contact_name=contact_name,
                channel=channel,
                username=contact_username,
                first_message=first_message,
                contact_id=contact_id,
            )

            return lead_id

        except Exception as e:
            logger.error(
                "amocrm_auto_create_error",
                error=str(e),
                contact=contact_name,
                channel=channel,
            )
            return None


# Helper to get client from DB
async def get_crm_client(tenant_id: str, db: AsyncSession) -> Optional[AmoCRMClient]:
    from app.models import AmoCRMAccount
    result = await db.execute(select(AmoCRMAccount).where(AmoCRMAccount.tenant_id == tenant_id, AmoCRMAccount.is_active == True))
    account = result.scalar_one_or_none()
    if account:
        return AmoCRMClient(account.subdomain, account.access_token, account.refresh_token)
    return None
