import asyncio
from uuid import UUID
import httpx

async def test_callback():
    # Make request to the local server
    url = "http://localhost:8000/api/integrations/amocrm/callback"
    params = {
        "code": "test_code_123",
        "referer": "alibazarmediauz.amocrm.ru",
        "state": "00000000-0000-0000-0000-000000000000"  # Dummy UUID
    }
    
    async with httpx.AsyncClient() as client:
        try:
            print("Sending request...")
            response = await client.get(url, params=params, follow_redirects=False)
            print(f"Status: {response.status_code}")
            print(f"Headers: {response.headers}")
            print(f"Text: {response.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_callback())
