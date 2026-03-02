import asyncio
from uuid import uuid4
import os
import sys

# Mock settings
os.environ["DATABASE_URL"] = "postgresql+asyncpg://user:pass@localhost:5432/db"
os.environ["AMOCRM_CLIENT_ID"] = "test"
os.environ["AMOCRM_CLIENT_SECRET"] = "test"
os.environ["AMOCRM_REDIRECT_URI"] = "test"
os.environ["OPENAI_API_KEY"] = "fake"

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.api.routes.integrations import amocrm_callback

class MockDB:
    pass

async def test():
    print("Testing callback route...")
    try:
        res = await amocrm_callback(
            code="123",
            referer="test.amocrm.ru",
            state=str(uuid4()),
            db=MockDB()
        )
        print("Success:", res)
    except BaseException as e:
        print("Unhandled Exception:", type(e), str(e))
        import traceback
        traceback.print_exc()

asyncio.run(test())
