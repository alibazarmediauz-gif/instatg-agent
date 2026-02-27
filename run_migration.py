import asyncio
import sys
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.database import init_db

if __name__ == "__main__":
    asyncio.run(init_db())
    print("Database synced!")
