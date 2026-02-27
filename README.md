# InstaTG Agent

AI-powered B2B SaaS sales automation platform that connects Telegram personal accounts and Instagram Business accounts with Claude AI for automated conversation handling, lead management, and analytics.

## Features

- **Telegram Userbot** — Connects to personal Telegram accounts via Pyrogram, handles text, voice, image, video, and document messages
- **Instagram DMs** — Receives and replies to Instagram Direct Messages via Meta Graph API webhooks
- **AI Agent** — Claude claude-sonnet-4-5 powered sales assistant with natural, warm conversation style
- **Voice Analysis** — Whisper STT transcription + Claude analysis for tone, emotion, and sales outcome detection
- **Vision** — Claude Vision API for image analysis and video keyframe extraction
- **RAG Knowledge Base** — Pinecone vector search for tenant-specific FAQ, products, and objection handling scripts
- **AmoCRM Integration** — Auto-create leads, update summaries, manage pipeline stages
- **Conversation Scoring** — Sentiment, lead qualification, sales outcome, objection tracking
- **Daily Reports** — Automated daily analytics delivered via dashboard, Telegram, and email
- **Multi-Tenant** — Complete data isolation per business

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Python FastAPI |
| Frontend | Next.js 14 + TailwindCSS + Shadcn UI |
| Telegram | Pyrogram (userbot) |
| Instagram | Meta Graph API + Webhooks |
| AI LLM | Claude API (claude-sonnet-4-5) |
| Voice STT | OpenAI Whisper |
| Vision | Claude Vision |
| Vector DB | Pinecone (RAG) |
| Main DB | PostgreSQL (Supabase) |
| Cache | Redis (Upstash) |
| CRM | AmoCRM REST API |
| Auth | Supabase Auth (JWT) |
| Task Queue | Celery + Redis |

## Project Structure

```
/backend
  /app
    /channels
      telegram.py       ← Pyrogram userbot handler
      instagram.py      ← Meta Graph API webhook handler
    /agents
      claude_agent.py   ← Main AI agent logic
      voice_analyzer.py ← Whisper + sales analysis
      vision.py         ← Image/video handler
    /memory
      context.py        ← Redis conversation context
    /knowledge
      rag.py            ← Pinecone RAG search
      uploader.py       ← Knowledge base ingestion
    /crm
      amocrm.py         ← AmoCRM integration
    /analytics
      scorer.py         ← Conversation scoring
      reports.py        ← Daily report generator
    /api
      routes/           ← All REST endpoints
    config.py           ← Configuration
    database.py         ← PostgreSQL connection
    models.py           ← ORM models
  main.py               ← FastAPI app entry point
  celery_worker.py      ← Celery task worker

/frontend
  Next.js 14 application with dashboard, conversations,
  voice analysis, knowledge base, reports, and settings pages
```

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or Supabase)
- Redis (or Upstash)
- ffmpeg (for video processing)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys and credentials

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API URL

# Run development server
npm run dev
```

### 3. Celery Worker

```bash
cd backend

# Start worker
celery -A celery_worker worker --loglevel=info

# Start beat scheduler (for daily reports)
celery -A celery_worker beat --loglevel=info
```

### 4. Required API Keys

| Service | How to Get |
|---------|-----------|
| Claude API | https://console.anthropic.com |
| OpenAI API | https://platform.openai.com |
| Pinecone | https://www.pinecone.io |
| Telegram API | https://my.telegram.org/apps |
| Instagram/Meta | https://developers.facebook.com |
| AmoCRM | https://www.amocrm.com/developers |
| Supabase | https://supabase.com |
| Redis/Upstash | https://upstash.com |

### 5. API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

See `.env.example` for the complete list of required environment variables.

## Deployment (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```
