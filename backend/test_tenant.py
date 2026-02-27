import asyncio
from app.database import async_session_factory
from app.models import Tenant
from sqlalchemy import select

async def main():
    async with async_session_factory() as session:
        result = await session.execute(select(Tenant).where(Tenant.id == "00000000-0000-0000-0000-000000000001"))
        tenant = result.scalar_one_or_none()
        print(f"Tenant: {tenant}")
        if tenant:
            print(tenant.created_at)
            print(tenant.master_prompt)
            print({
                "id": str(tenant.id),
                "name": tenant.name,
                "owner_email": tenant.owner_email,
                "ai_persona": tenant.ai_persona,
                "timezone": tenant.timezone,
                "human_handoff_enabled": tenant.human_handoff_enabled,
                "owner_telegram_chat_id": tenant.owner_telegram_chat_id,
                "is_active": tenant.is_active,
                "created_at": tenant.created_at.isoformat(),
            })
            
asyncio.run(main())
