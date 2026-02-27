# InstaTG Agent — Deployment & Setup Guide

**Version:** 1.0.0  
**Date:** Feb 27, 2026  
**Status:** Ready for Local Testing & Cloud Deployment

---

## 📋 Summary

InstaTG Agent is a comprehensive AI-powered sales automation platform for Telegram, Instagram, and Facebook. It combines Claude AI, real-time messaging, and CRM integration to automate customer conversations and lead qualification.

### Key Features Implemented
- ✅ FastAPI backend (Python 3.9+)
- ✅ Telegram userbot (Pyrogram) with OTP-based session management
- ✅ Instagram & Facebook Messenger webhooks
- ✅ Claude AI responses with RAG (Pinecone)
- ✅ Voice transcription (Whisper) & analysis
- ✅ Vision analysis (Claude Vision) for images/videos
- ✅ AmoCRM CRM integration
- ✅ PostgreSQL support
- ✅ Redis for conversation memory (fallback: in-memory)
- ✅ Celery for background tasks
- ✅ Multi-tenant architecture
- ✅ Pluggable LLM provider (OpenAI, with placeholders for OpenRouter/HuggingFace)

---

## 🚀 Quick Start — Local Development

### Prerequisites
- **Python 3.9+**
- **macOS/Linux** (tested on macOS)
- **Git**
- `ffmpeg` and `ffprobe` (for video processing)

### 1. Clone & Setup Virtual Environment

```bash
cd /Users/elmurodovnazir/Documents/InstaTG\ Agent
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r backend/requirements.txt
```

### 3. Configure Environment

Copy the example to `.env`:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:

```dotenv
# Application
APP_NAME=InstaTG Agent
APP_ENV=development
DEBUG=true
SECRET_KEY=your-32-char-secret-key-here

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database
DATABASE_ECHO=false

# Redis (optional for dev; falls back to in-memory)
REDIS_URL=redis://localhost:6379/0

# Claude API (Anthropic)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
CLAUDE_MODEL=claude-sonnet-4-5-20250514

# OpenAI (for Whisper + Embeddings)
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
WHISPER_MODEL=whisper-1
EMBEDDING_MODEL=text-embedding-3-small

# Pinecone (Vector DB for RAG)
PINECONE_API_KEY=xxxxxxxxxxxxx
PINECONE_INDEX_NAME=instatg-knowledge
PINECONE_ENVIRONMENT=us-east-1

# Telegram
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=your-api-hash-here

# Meta (Facebook/Instagram)
META_APP_ID=xxxxxxxxxxxxx
META_APP_SECRET=xxxxxxxxxxxxx
META_VERIFY_TOKEN=instatg-verify-token

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
```

### 4. Run the Backend

```bash
cd backend
/path/to/.venv/bin/python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
[info     ] application_ready app_name=InstaTG Agent
```

✅ **Server is ready!** Open http://127.0.0.1:8000/ in your browser.

---

## 🔧 External API Keys Required

### Minimal Setup (MVP)
To get the app running at minimum:

1. **Anthropic (Claude)**  
   - Get key: https://console.anthropic.com  
   - Set: `ANTHROPIC_API_KEY=sk-ant-...`

2. **OpenAI (Whisper + Embeddings)**  
   - Get key: https://platform.openai.com  
   - Set: `OPENAI_API_KEY=sk-...`

3. **Telegram** (for userbot)  
   - Get API ID/Hash: https://my.telegram.org (API Development Tools)  
   - Set: `TELEGRAM_API_ID=` and `TELEGRAM_API_HASH=`

4. **Meta App** (for Instagram/Facebook)  
   - Create app: https://developers.facebook.com  
   - Add Instagram Graph API & Webhooks products
   - Set: `META_APP_ID=` and `META_APP_SECRET=`

### Advanced (Full Features)

5. **Pinecone** (Vector DB for RAG)  
   - Create project: https://app.pinecone.io  
   - Set: `PINECONE_API_KEY=` and `PINECONE_INDEX_NAME=`

6. **Redis** (Conversation memory)  
   - Local: `brew install redis` → `redis-server`  
   - Cloud: https://upstash.com (serverless Redis)  
   - Set: `REDIS_URL=redis://localhost:6379/0`

7. **AmoCRM** (CRM integration)  
   - Subdomain & OAuth: https://amocrm.ru  
   - Set: `AMOCRM_BASE_URL=`, `AMOCRM_CLIENT_ID=`, etc.

8. **Supabase** (Auth, optional)  
   - Create project: https://supabase.com  
   - Set: `SUPABASE_URL=` and keys

---

## 📊 Known Issues & Fallbacks

| Issue | Impact | Workaround |
|-------|--------|-----------|
| Redis unavailable | In-memory conversation storage only | App falls back to memory (restart loses context) |
| Pinecone not configured | RAG search fails silently | Knowledge base features unavailable |
| ANTHROPIC_API_KEY empty | Claude calls fail | Set real key in `.env` |
| OPENAI_API_KEY empty | Whisper & embeddings fail | Set real key in `.env` |
| ffmpeg not installed | Video analysis fails | `brew install ffmpeg` |
| `TELEGRAM_API_ID=0` | Telegram userbot cannot connect | Register at https://my.telegram.org |

---

## 🔌 Telegram Setup (User Bot)

### Step 1: Register with Telegram
1. Visit https://my.telegram.org
2. Phone login with your business number
3. Go to **API development tools**
4. Create an app (if needed)
5. Copy `api_id` and `api_hash` → Set in `.env`

### Step 2: OTP-Based Login (Per Tenant)
The app uses **OTP-based session creation** instead of username/password:

```bash
# POST /api/telegram/initiate-otp
# Body: { "phone_number": "+998901234567", "tenant_id": "..." }
# Response: { "status": "otp_sent", "phone_code_hash": "..." }

# Then verify with code from SMS:
# POST /api/telegram/verify-otp
# Body: { "phone_number": "...", "code": "123456", ... }
# Response: { "status": "connected", "encrypted_session_string": "..." }
```

This encrypted session is stored in the database and reused.

---

## 🌐 Facebook/Instagram Setup

### Step 1: Create Meta App
1. https://developers.facebook.com
2. Create an app (type: Business)
3. Add products: **Instagram Graph API** + **Webhooks**
4. Copy `App ID` and `App Secret` → `.env`

### Step 2: Configure Webhook
1. In app dashboard → Products → Webhooks
2. Set webhook URL: `https://your-domain.com/webhooks/instagram`  
   (For local dev, use ngrok: `ngrok http 8000`)
3. Verify token: Set `META_VERIFY_TOKEN` (can be any string)
4. Subscribe to events: `messages`, `message_echoes`, `comments`

### Step 3: Connect Pages via OAuth
1. Users visit: `GET /api/facebook-auth/login?tenant_id=...`
2. They authorize your app → redirects to callback
3. App exchanges code for **long-lived page tokens** (60 days)
4. Tokens stored in DB and reused for sending messages

---

## 🐳 Docker & Cloud Deployment

### Docker Build
```bash
docker build -f backend/Dockerfile -t instatg-agent:latest .
```

### Environment Setup (Docker)
Create `.env` file and pass to container:
```bash
docker run -p 8000:8000 \
  --env-file backend/.env \
  instatg-agent:latest
```

### Production Checklist
- [ ] Use PostgreSQL
- [ ] Enable Redis (Upstash or self-hosted)
- [ ] Set `APP_ENV=production`
- [ ] Enable Sentry (`SENTRY_DSN=`)
- [ ] Use Cloudflare/WAF for security
- [ ] SSL certificate (HTTPS)
- [ ] Configure CORS (`allow_origins` in main.py)
- [ ] Set up Celery worker pods
- [ ] Database backups & migration scripts (alembic)

---

## 📚 API Endpoints Overview

### Health Checks
- `GET /` — App info
- `GET /health` — Detailed health status

### Telegram
- `POST /api/telegram/initiate-otp` — Start OTP login
- `POST /api/telegram/verify-otp` — Verify OTP code
- `POST /webhooks/telegram` — Incoming messages webhook

### Instagram/Facebook
- `GET|POST /webhooks/instagram` — IG message webhooks
- `GET|POST /webhooks/facebook` — FB message webhooks
- `GET /api/facebook-auth/login` — OAuth flow start
- `GET /api/facebook-auth/callback` — OAuth callback

### Knowledge Base
- `GET /api/knowledge-base` — List documents
- `POST /api/knowledge-base/upload` — Upload document
- `POST /api/knowledge-base/scrape` — Scrape website
- `POST /api/knowledge-base/simulate` — Test AI response

### Conversations
- `GET /api/conversations` — List chats
- `POST /api/conversations/{id}/messages` — Send message
- `GET /api/conversations/{id}/analysis` — Chat analysis

### Other Modules
- Analytics (`/api/analytics`)
- Billing & Payments (`/api/payments`, `/api/billing`)
- Campaigns (`/api/campaigns`)
- Voice (`/api/voice-analysis`)
- IVR (`/api/ivr`)
- CRM Integration (`/api/integrations/crm-status`)

---

## 🧪 Testing Locally

### 1. Health Check
```bash
curl http://127.0.0.1:8000/
# Expected: {"name": "InstaTG Agent", "status": "running", ...}
```

### 2. Knowledge Base Upload
```bash
curl -X POST http://127.0.0.1:8000/api/knowledge-base/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample.pdf" \
  -F "tenant_id=uuid-here"
```

### 3. Conversation Simulation
```bash
curl -X POST http://127.0.0.1:8000/api/knowledge-base/simulate \
  -H "Content-Type: application/json" \
  -d '{"user_query": "What is your price?", "tenant_id": "..."}'
```

---

## 🐛 Troubleshooting

### `ModuleNotFoundError: No module named 'app'`
**Fix:** Run from backend directory:
```bash
cd backend && python -m uvicorn main:app --reload
```

### `NameError: name 'Optional' is not defined`
**Fix:** Already fixed in `knowledge_base.py` and `integrations.py`. Ensure you have latest version.

### `NotOpenSSLWarning` (urllib3)
**Fix:** Harmless on macOS with LibreSSL. Ignore or update OpenSSL if needed.

### Redis connection error
**Fix:** Normal fallback to in-memory. Install Redis for production:
```bash
brew install redis
redis-server  # Start in another terminal
```

### Claude API 401 errors
**Fix:** Check `ANTHROPIC_API_KEY` is valid at https://console.anthropic.com

### Pinecone 401 errors
**Fix:** Verify `PINECONE_API_KEY` and `PINECONE_INDEX_NAME` exist at https://app.pinecone.io

---

## 📦 Project Structure

```
backend/
├── main.py                    # FastAPI app entry point
├── requirements.txt           # Python dependencies
├── alembic/                   # Database migrations
├── app/
│   ├── config.py              # Configuration & env vars
│   ├── database.py            # SQLAlchemy setup
│   ├── models.py              # ORM models
│   ├── agents/                # AI agents (Claude, Voice, Vision)
│   ├── api/                   # API routes
│   │   ├── routes/            # Endpoint handlers
│   │   └── websockets.py      # WebSocket server
│   ├── channels/              # Message channels (Telegram, IG, FB)
│   ├── knowledge/             # RAG & document ingestion
│   ├── memory/                # Conversation context
│   ├── crm/                   # CRM integrations
│   ├── services/              # Business logic
│   ├── analytics/             # Reporting & scoring
│   ├── core/                  # Logging & utilities
│   └── llms/
│       └── provider.py        # LLM provider abstraction
```

---

## 🚢 Next Steps for Production

1. **Database:** Use PostgreSQL in all environments
   ```bash
   alembic upgrade head
   ```

2. **Secrets Management:** Use AWS Secrets Manager, Vault, or Supabase
   - Never commit `.env` files
   - Use environment variable injection in CI/CD

3. **Monitoring:**
   - Enable Sentry for error tracking
   - Set up CloudWatch or Datadog logs
   - Monitor Celery workers

4. **Scaling:**
   - Deploy with Kubernetes or Docker Swarm
   - Multiple Celery workers for async tasks
   - Redis cluster for HA

5. **Testing:**
   - Add pytest unit tests
   - Integration tests for API endpoints
   - E2E tests for Telegram/IG flows

---

## 📞 Support & Resources

- **Anthropic Claude:** https://console.anthropic.com
- **Telegram Bot API:** https://core.telegram.org/bots
- **Meta Graph API:** https://developers.facebook.com/docs/graph-api
- **FastAPI:** https://fastapi.tiangolo.com
- **SQLAlchemy:** https://www.sqlalchemy.org

---

**Built with ❤️ for sales automation.**

Last Updated: **Feb 27, 2026**
