import asyncio
import sys
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.api.routes.notifications import create_and_dispatch_notification

async def test_notify():
    # Demo tenant ID mapped in TopBar
    tenant_id = "00000000-0000-0000-0000-000000000001"
    
    await create_and_dispatch_notification(
        tenant_id=tenant_id,
        title="🔔 Test Notification!",
        message="This is a real-time SSE test notification triggered from the script.",
        type="success",
        link="/dashboard"
    )
    print("Notification dispatched successfully!")

if __name__ == "__main__":
    asyncio.run(test_notify())
