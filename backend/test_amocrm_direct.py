import asyncio
import os
import sys

# We need to set the database URL and API keys so the config loader doesn't crash
os.environ["DATABASE_URL"] = "postgresql+asyncpg://user:pass@localhost:5432/db"
os.environ["AMOCRM_CLIENT_ID"] = "test_client_id"
os.environ["AMOCRM_CLIENT_SECRET"] = "test_secret"
os.environ["AMOCRM_REDIRECT_URI"] = "https://test.com/callback"
os.environ["OPENAI_API_KEY"] = "fake"

try:
    from app.crm.amocrm import AmoCRMClient
except Exception as e:
    print(f"Failed to import AmoCRMClient: {e}")
    sys.exit(1)

async def test_auth():
    print("Testing AMOCRMClient exchange_code...")
    # This reflects exactly what the callback does
    client = AmoCRMClient("test_subdomain", "", "")
    try:
        res = await client.exchange_code("fake_auth_code_from_amo")
        print("Success:", res)
    except Exception as e:
        print("Exception caught in exchange_code:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_auth())
