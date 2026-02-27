# InstaTG Agent — Complete SaaS Product Guide

**Nima bu? (What is this?)**  
InstaTG Agent — AI-powered B2B sales automation platform. Har bir kompaniya Telegram va Instagram-dan avtomatik sotuv qiladi Claude AI orqali.

---

## 📋 Table of Contents

1. [Nima Beramiz Foydalanuvchiga? (Customer Value)](#customer-value)
2. [Ishlash Tartib (How It Works)](#workflow)
3. [Bizda Nima Qoladi? (What We Keep)](#our-business)
4. [Control & Admin System (Boshqaruv)](#control-system)
5. [Revenue Model (Pul Oliw)](#revenue-model)
6. [Technical Architecture](#architecture)

---

## 🎯 Customer Value
<a name="customer-value"></a>

### Foydalanuvchi Nima Oladi? (What Does Customer Get?)

**3 ta Asosiy Problem Yechamiz:**

#### 1️⃣ **Telegram va Instagram-dan Avtomatik Sotuv**
- ❌ **Ilg'or masala:** Manual javob berish, message lost qilish, slow response
- ✅ **Bizning yechimiw:** 24/7 Claude AI avtomatik javob beradi Telegram/Instagram DM'da
- 💰 **Natija:** 40-60% conversion rate boost (avtomatik response = faster sales)

**Misol:**
```
Telegram DM:
👤 Customer: "Shuning narxi qancha? 🤔"
⏱️ AI javob (2 sekunda): "Assalomu alaikum! 👋 Biz 3 ta paket taqdim qilaman:
  💎 Starter: $99/oy
  💎 Pro: $299/oy  
  💎 Enterprise: Custom
  
Sizga qaysi paket mos? 😊"
```

#### 2️⃣ **Lead Scoring & Qualification**
- ❌ **Ilg'or masala:** Qaysi contact'ni follow-up qilsh kerakligini bilmaslik
- ✅ **Bizning yechimiw:** AI har bir conversation'ni analiz qiladi → lead score 1-10
- 💡 **Natija:** 
  - Lead score **1-3:** Not qualified (ignore)
  - Lead score **6-10:** Hot lead (automatic CRM sync to AmoCRM)
  - Human handoff triggered for **high-value conversations**

#### 3️⃣ **Voice Analysis & Sentiment Detection**
- ❌ **Ilg'or masala:** Voice message'dan customer emotion tushunmaslik
- ✅ **Bizning yechimiw:** 
  - Whisper STT → voice transcription
  - Claude sentiment analysis → "positive/negative/frustrated"
  - Objection detection → "customer says 'narxi qimmat'" → auto-respond with value proposition
- 💰 **Natija:** Emotional intelligence = better closing rate

#### 4️⃣ **Knowledge Base (FAQ + Objection Handling)**
- ❌ **Ilg'or masala:** Bir xil savolga beruvchi har safar boshqacha javob beradi
- ✅ **Bizning yechimiw:** 
  - Admin PDF/DOCX upload qiladi → AI chunking + embeddings → Pinecone RAG
  - Customer istalgan savol → AI automatically knowledge base'dan retrieve qiladi
  - Consistent answers + professional tone
- 💡 **Examples:** FAQ, price lists, product specs, objection scripts

#### 5️⃣ **Daily Reports & Analytics**
- ❌ **Ilg'or masala:** Har sabah "kemapas sotuvlar edik?" ni calculate qilish
- ✅ **Bizning yechimiw:** 
  - Automatic daily report (6 AM)
  - Revenue, conversion rate, conversation count, sentiment breakdown
  - Send via Telegram + email + dashboard
- 📊 **Dashboard shows:**
  - Wallet balance (top-up to use credits)
  - Total conversations, leads generated, won deals
  - Conversion funnel (inquiry → qualified → purchase)
  - Cost per lead, ROI trends

#### 6️⃣ **AmoCRM Integration (Auto Lead Sync)**
- ❌ **Ilg'or masala:** Telegram'dan lead keldi, lekin CRM'ga qo'lda kiritish kerak
- ✅ **Bizning yechimiw:** 
  - Qualified lead (lead score ≥ 7) → auto-create in AmoCRM
  - Conversation summary → CRM note
  - Customer email/phone auto-extracted
  - CRM status updates trigger follow-up tasks
- 💡 **Result:** Zero manual data entry for leads

---

## ⚙️ How It Works (Detailed Workflow)
<a name="workflow"></a>

### **Act 1: Customer Setup (5 minutes)**

```
1️⃣ Sign up → Create Tenant
   - Email: admin@mycompany.uz
   - Company: "ABC Sales Agency"
   - Currency: USD/UZS
   
2️⃣ Connect Telegram Account
   - Frontend button: "Connect Telegram"
   - OTP login (userbot mode)
   - Encrypted session storage in DB
   - Status: "Connected ✅"
   
3️⃣ Connect Instagram/Facebook Business Account
   - OAuth redirect to Meta Graph API
   - Webhook registration for DM events
   - Status: "Connected ✅"
   
4️⃣ Setup CRM (AmoCRM)
   - OAuth token exchange
   - Select which pipelines to sync
   - Status: "Connected ✅"
   
5️⃣ Upload Knowledge Base
   - Drag-drop PDF files: "Price list.pdf", "FAQ.pdf"
   - Enter Q&As manually (objections)
   - Website scraper: "https://example.com/faq"
   - AI chunks text → embeddings → Pinecone storage
   
6️⃣ Configure AI Persona
   - Business name: "ABC Sales"
   - Tone: "Professional but friendly"
   - Language: Uzbek + Russian
   - Custom prompt override (optional)
   - Test in Simulator: Type message → see AI response
```

---

### **Act 2: Customer Messages (Real-time Flow)**

**Telegram message incoming:** 
```
👤 Customer: "Assalomu alaikum! Sizda bo'sh job'ni bor?"

⏱️ Pipeline:
1. Telegram webhook → Backend (/api/channels/telegram)
2. Pyrogram userbot receives message
3. Extract: tenant_id, contact_id, user_message
4. Fetch conversation history from Redis/memory
5. RAG search: "knowledge base'da bo'sh job' haqidagi dokumentga aniqlash"
6. Claude API call:
   - System prompt (persona + knowledge + master prompt)
   - User message + conversation context
   - Optional image description (if photo sent)
   - Optional voice transcription (if voice message)
7. Claude responses in Uzbek:
   "Assalomu alaikum! 👋 Hah, bizda 3 ta bo'sh job' bor:
    💼 Senior Developer
    💼 Product Manager
    💼 Marketing Lead
    
    Qaysi bo'sh job'ni ko'rib chiqasiz? 😊"
   + JSON metadata (sentiment, lead_score, intent, etc.)

8. Extract sentiment/intent from JSON:
   - Lead score: 5 (inquiry stage)
   - Intent: "inquiry"
   - Sentiment: "positive"
   - Confidence: 0.92

9. Send reply via Telegram userbot
10. Store message in DB:
    - Conversation table (contact_id + tenant_id)
    - Messages table (role: user/assistant, timestamp, etc.)
    - Store conversation context in Redis for next message

11. If human handoff needed (lead_score < 4):
    - Flag for admin
    - Send Telegram notification to admin
    - Status: "Waiting for human"
```

---

### **Act 3: Lead Scoring & CRM Sync (Async Background Task)**

**After 10-30 minutes of inactivity:**

```
Celery Task: "score_conversation"
↓
1. Fetch full conversation thread
2. Send to Claude Scorer with:
   - All messages (user + AI responses)
   - Conversation summary request
3. Claude Scorer returns:
   - sentiment: "positive"
   - lead_score: 8 (QUALIFIED!)
   - sales_outcome: "in_progress"
   - key_topics: ["job opening", "requirements", "salary"]
   - objections: ["no remote option mentioned"]
   - recommended_action: "Follow up with job description"

4. Store scoring result in ConversationAnalysis table

5. If lead_score ≥ 7:
   ✅ Create Lead in AmoCRM:
      - Name: Customer name (extracted from Telegram)
      - Phone: Telegram bot username or phone (if shared)
      - Email: "customer@gmail.com" (if shared)
      - Pipeline: "Sales" → Stage: "Qualified"
      - Note: "Interested in Senior Developer role. Positive sentiment. 
              Need to share job description and salary info."
      - Source: "Telegram - InstaTG Agent"

6. Send notification to admin:
   "🔥 New qualified lead! Score: 8/10. Ready for personal follow-up"

7. Optional: Send follow-up message via AI:
   "Thanks for your interest! I'm sending you the job description and salary details. 
    Are you ready to discuss your background? 😊"
```

---

### **Act 4: Daily Report & Analytics**

**Every morning at 6 AM (via Celery):**

```
Celery Task: "generate_daily_report_task"
↓
1. Query all conversations for tenant (last 24h)
2. Calculate metrics:
   - Total conversations: 47
   - New leads: 12
   - Qualified leads (score ≥7): 7
   - Sales closed: 2
   - Revenue: $4,200
   - Conversion rate: 14.9%
   - Sentiment breakdown: 60% positive, 30% neutral, 10% negative
   - Avg response time: 2.3 seconds

3. Send report to 3 channels:
   a) Dashboard: Show KPI cards + charts
   b) Telegram: Text message to owner_telegram_chat_id
   c) Email: admin@company.uz

4. Sample report:
   "📊 Daily Report — Feb 27, 2026
   
   💬 Conversations: 47
   💰 Revenue: $4,200
   📈 Conversion: 14.9%
   🎯 Leads Qualified: 7
   ✅ Closed Deals: 2
   
   😊 Sentiment: 60% positive
   ⏱️ Avg Response: 2.3s
   
   Dashboard: http://localhost:3000"
```

---

## 💼 Our Business (What We Keep)
<a name="our-business"></a>

### **Revenue Streams**

#### 1️⃣ **Usage-Based Pricing (Pay-as-you-go)**
```
Customer's Wallet System:
- $1 per conversation = 1 AI API call
- $0.05 per voice transcription (Whisper)
- $0.02 per embedding (RAG search)
- $0.10 per vision call (image analysis)

Example:
- Customer starts with $100 (top-up)
- Day 1: 50 conversations (-$50) → Balance: $50
- Day 2: 30 conversations, 5 voice messages (-$30.25) → Balance: $19.75
- Day 3: Runs out → auto-payment failed → AI stops responding
- Frontend shows: "Wallet balance low! Add credits to continue"
```

**Database tracking:**
```python
# Table: Wallet
tenant_id, balance, currency, last_topup_date

# Table: UsageLog
tenant_id, usage_type (conversation|voice|embedding|vision), 
cost, timestamp, contact_id
```

#### 2️⃣ **Subscription Tiers (Optional - Future)**
```
🆓 Free Tier (Freemium):
- 20 conversations/month
- No CRM integration
- Single Telegram account
- Basic analytics

💎 Pro ($99/month):
- Unlimited conversations
- AmoCRM integration
- Multiple accounts (Telegram + Instagram + Facebook)
- Advanced analytics + voice analysis
- Priority support

🏢 Enterprise (Custom):
- Everything
- Dedicated account manager
- Custom integrations
- 99.9% SLA
```

---

### **Cost Structure (What We Pay)**

```
Per Customer Per Month (Avg 500 conversations):

API Costs:
- Claude API: $500 conversations × $0.003/call = $1.50
- Whisper STT: 50 voice × $0.006 = $0.30
- OpenAI embeddings: 500 calls × $0.00002 = $0.01
- Pinecone: $96 (12-month commitment) / 30 customers = $3.20
  Subtotal API: ~$5 per customer

Infrastructure:
- Backend server (AWS): $200/month ÷ 50 customers = $4/customer
- Frontend CDN: $50 ÷ 50 = $1/customer
- Database (PostgreSQL): $100 ÷ 50 = $2/customer
- Redis (Upstash): $50 ÷ 50 = $1/customer
  Subtotal Infra: ~$8 per customer

Support & Operations:
- Customer support staff: $3/customer
- Monitoring/alerting: $1/customer
  Subtotal Ops: ~$4/customer

Total Cost: ~$17/customer/month

Gross Margin (if $99/month subscription):
= ($99 - $17) / $99 = 82.8% margin ✅
```

---

### **Admin Control (Nima Biz Ko'ramiz?)**
<a name="control-system"></a>

#### **1. Admin Dashboard (Biz uchun)**

```
Path: /admin (Admin panel)

A. Tenant Management
   - List all customers
   - Columns: Name | Email | Created | Status | Wallet Balance | Conversations | Revenue
   - Actions: View details | Suspend | Delete | Send message
   - Search + Filter: Active/Inactive, date range
   
B. Usage Analytics (Global)
   - Total revenue (all customers)
   - Total conversations (API calls)
   - API cost vs revenue comparison
   - Churn rate (inactive customers)
   - Top customers by revenue
   
C. Billing & Payments
   - Monthly revenue breakdown
   - Customer payment history
   - Failed payment alerts
   - Refund requests queue
   
D. API Health
   - Uptime status (99.9%?)
   - Response time (avg, p95, p99)
   - Error rate
   - Claude API quota remaining
   - Pinecone index health
   
E. Compliance & Fraud
   - Flag suspicious activity (100+ conversations in 1 hour = bot?)
   - Customer complaints queue
   - Blocked tenants
   - Data deletion requests (GDPR)
```

#### **2. Customer Control (Foydalanuvchi uchun)**

```
Path: /settings (Customer's own settings)

A. Account Management
   - Change company name
   - Change timezone
   - Update owner email
   - API key generation (for custom integrations)
   
B. AI Persona Configuration
   - Business name (shown in AI responses)
   - Tone selector: (Friendly | Professional | Casual)
   - Language: (Uzbek | Russian | English | auto-detect)
   - Custom system prompt (override master prompt)
   - Test simulator (type message → see response)
   
C. Knowledge Base Management
   - Upload files (PDF, DOCX, TXT)
   - Web scraper (URL → auto-extract FAQ)
   - Manual Q&A editor (type + answer)
   - Edit uploaded docs
   - View embeddings stats (1,245 chunks, 2.5M tokens)
   - Delete docs
   
D. Integration Status
   - Telegram: "Connected ✅" or "Disconnected ❌"
   - Instagram: List connected accounts (multiple)
   - Facebook: List connected pages
   - AmoCRM: "Synced ✅" + last sync time
   - Disconnect button for each (secure unlink)
   
E. Channel Configuration
   - Telegram: Respond to DMs? (toggle)
   - Instagram: Respond to DMs? (toggle)
   - Facebook: Respond to Messenger? (toggle)
   - Auto-handoff rules: (if lead_score < X, human review)
   
F. Wallet & Billing
   - Current balance: $45.75
   - Usage today: $5.20 (47 conversations)
   - Monthly spend: $142.50 (30 days)
   - Top-up options: ($10 | $50 | $100 | Custom)
   - Payment method: (Card | Bank transfer)
   - Invoice history + download
   - Auto-topup when balance < $10? (toggle)
   
G. Team Management
   - Add team member (email)
   - Roles: Admin | Viewer | Agent
   - Revoke access
   
H. Notifications
   - Email: Daily report? (toggle)
   - Email: Low balance alert? (toggle)
   - Telegram: Send daily report to my chat? (toggle)
   - Slack: Webhook integration (optional)
```

---

### **Key Admin Controls (Management Tools)**

#### **Suspend/Pause a Customer**
```
Why: Customer's credits ran out, unpaid invoice, compliance issue
How: Admin → Customer → "Suspend" button
Result: All AI responses stop. Customer can't send messages.
Message shown: "Wallet depleted or account suspended. Contact support."
Recovery: When payment received, auto-resume
```

#### **Override Customer Settings**
```
Why: Customer's knowledge base broken, or needs emergency help
How: Admin → Customer → "Manage" → Can edit their:
     - AI persona
     - Knowledge base
     - Integration status
Result: Admin can fix issues on customer's behalf
```

#### **Revenue & Cost Tracking**
```
Dashboard shows:
- Customer: "ABC Sales Agency"
- API Cost: $45 (actual cost to serve them this month)
- Revenue: $99 (subscription or usage-based)
- Margin: $54 (59%)
- Churn risk: "Low" (active, daily conversations)

Red flags:
- Churn risk: "High" (no messages in 7 days)
- Cost overrun: (API cost > revenue?)
- Abuse: (10,000 conversations/day = bot?)
```

---

## 💵 Revenue Model Details
<a name="revenue-model"></a>

### **Pricing Strategy (Flexible Options)**

**Option A: Freemium + Premium Subscription**
```
Free Tier (No credit card needed)
✓ 20 conversations/month
✗ No CRM sync
✗ No voice analysis
✗ Single Telegram account
→ Goal: Viral adoption, free trial

Premium ($99/month)
✓ Unlimited conversations
✓ All AI features (voice, vision, sentiment)
✓ CRM integrations (AmoCRM, Pipedrive, HubSpot)
✓ Multiple accounts (Telegram, IG, FB)
✓ Daily reports + email
✓ Knowledge base (unlimited docs)
✓ Priority support
→ Goal: Predictable revenue from committed customers

Enterprise (Custom)
✓ Everything
✓ Dedicated account manager
✓ Custom webhooks/integrations
✓ 99.9% SLA
✓ Dedicated AI model fine-tuning
→ Goal: Land large agencies, scale revenue per customer
```

**Option B: Pure Usage-Based (Wallet System)**
```
No upfront cost. Pay as you use:

Conversation API call: $0.015
  (Claude API $0.003 + markup $0.012)

Voice transcription: $0.025
  (Whisper $0.006 + margin)

Knowledge base embedding: $0.05
  (OpenAI embeddings $0.00002 + margin)

Vision API call: $0.30
  (Claude vision $0.15 + markup)

CRM sync: $0.05 per synced lead

Advantage: Customers only pay for what they use
Disadvantage: Revenue unpredictable, hard to forecast
```

**Recommended: Hybrid Model**
```
Base: $49/month (includes 50 conversations)
+ Overage: $0.10 per conversation above 50
+ Premium features: Voice analysis (+$20), CRM sync (+$30)

Example:
- Customer uses 200 conversations/month
- Cost: $49 (base) + $0.10 × 150 (overage) + $20 (voice) = $84/month
- Simple, predictable, scales with usage
```

---

## 🏗️ Technical Architecture (How It All Connects)
<a name="architecture"></a>

### **Data Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER SIDE                             │
├─────────────────────────────────────────────────────────────┤

1. INCOMING CHANNELS (Multiple sources)
   ┌──────────────────┐
   │ Telegram DM      │ ← Pyrogram userbot listens
   │ (user messages)  │
   └──────────┬───────┘
              │
   ┌──────────────────────────────────┐
   │ Instagram DM                     │ ← Meta Webhook endpoint
   │ (Meta Graph API webhook)         │
   └──────────┬──────────────────────┘
              │
   ┌──────────────────────────────────┐
   │ Facebook Messenger               │ ← Meta Webhook endpoint
   │ (Meta Graph API webhook)         │
   └──────────┬──────────────────────┘
              │
              ▼
   
2. MESSAGE INGESTION → Backend
   ┌─────────────────────────────────────────┐
   │ FastAPI Router                          │
   │ /api/channels/telegram                  │
   │ /api/channels/instagram/webhook         │
   │ /api/channels/facebook/webhook          │
   └────┬────────────────────────────────────┘
        │ Extract: tenant_id, contact_id, message
        ▼
   
3. CONTEXT RETRIEVAL (Recent conversation)
   ┌──────────────────────────────┐
   │ Redis Memory Cache           │
   │ (Key: tenant_id:contact_id)  │
   │ (Value: last 10 messages)    │
   └────┬─────────────────────────┘
        │ If Redis unavailable, fall back to in-memory dict
        ▼
   
4. KNOWLEDGE BASE LOOKUP (RAG)
   ┌────────────────────────────────────────┐
   │ Pinecone Vector Database               │
   │ (customer knowledge docs)              │
   │ Namespace: tenant_id                   │
   └────┬──────────────────────────────────┘
        │ Query: Embed user message + semantic search
        │ Result: Top 3 relevant doc chunks
        ▼
   
5. AI AGENT DECISION (Claude)
   ┌─────────────────────────────────────────────┐
   │ Claude API (claude-sonnet-4-5-20250514)     │
   │                                              │
   │ Input:                                       │
   │  - System prompt (persona + knowledge)      │
   │  - Conversation history                     │
   │  - User message                             │
   │  - (Optional) Image description             │
   │  - (Optional) Voice transcription           │
   │                                              │
   │ Output:                                      │
   │  - Reply text (natural language)            │
   │  - JSON metadata (sentiment, score, etc)    │
   └────┬────────────────────────────────────────┘
        │
        ▼
   
6. DECISION LOGIC
   ┌──────────────────────────────────┐
   │ Check lead_score & sentiment     │
   │                                  │
   │ If score < 4:                    │
   │   → FLAG: "Human handoff needed" │
   │   → Store in "handoff_queue"     │
   │                                  │
   │ If score ≥ 4:                    │
   │   → Send reply via channel       │
   │   → Store conversation          │
   └──────┬───────────────────────────┘
          │
          ▼
   
7. RESPONSE DELIVERY
   ┌─────────────────────────────┐
   │ Telegram Userbot            │ → Send message + emoji
   │ Meta Graph API              │ → POST to IG/FB endpoint
   │ (Each sends via own channel) │
   └────┬────────────────────────┘
        │
        ▼ (Message arrives in customer's chat)
   
8. CONVERSATION STORAGE
   ┌─────────────────────────────────┐
   │ PostgreSQL Database             │
   │                                 │
   │ Conversation table:             │
   │  - id, tenant_id, contact_id    │
   │  - created_at, updated_at       │
   │  - status (open, closed)        │
   │                                 │
   │ Message table:                  │
   │  - id, conversation_id          │
   │  - role (user / assistant)      │
   │  - text, timestamp              │
   │  - channel (telegram/ig/fb)     │
   │  - metadata (sentiment, etc)    │
   └─────────────────────────────────┘
   
9. CACHE UPDATE (Fast next reply)
   ┌──────────────────────────────┐
   │ Redis: Store message history │
   │ (Expires in 24 hours)        │
   └──────────────────────────────┘
   
10. BACKGROUND JOBS (Async - Celery)
    ┌──────────────────────────────────┐
    │ After 30min inactivity:          │
    │ → score_conversation_task        │
    │   (Full Claude analysis)         │
    │   (Save lead_score to DB)        │
    │                                  │
    │ If score ≥ 7:                    │
    │ → sync_to_amocrm_task            │
    │   (Create lead in customer's CRM)│
    │                                  │
    │ Every morning 6 AM:              │
    │ → generate_daily_report_task     │
    │   (Send report to dashboard,     │
    │    Telegram, email)              │
    └──────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                   OUR SIDE (ADMIN)                           │
├─────────────────────────────────────────────────────────────┤

11. ADMIN DASHBOARD
    ┌──────────────────────────────┐
    │ /admin page                  │
    │                              │
    │ View:                        │
    │ - All customers              │
    │ - Revenue tracking           │
    │ - API health status          │
    │ - Fraud detection            │
    │ - Support queue              │
    └──────────────────────────────┘

12. ANALYTICS AGGREGATION
    ┌────────────────────────────────┐
    │ Aggregate metrics across       │
    │ all customers:                 │
    │ - Total conversations/month    │
    │ - Total revenue/month          │
    │ - API cost vs revenue margin   │
    │ - Churn rate                   │
    │ - System uptime                │
    └────────────────────────────────┘
```

---

### **Database Schema (Key Tables)**

```sql
-- Tenant (Company/Customer)
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  owner_email VARCHAR(255) UNIQUE,
  ai_persona TEXT,
  master_prompt TEXT,
  timezone VARCHAR(50),
  human_handoff_enabled BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Conversation (Thread per contact)
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  tenant_id UUID FOREIGN KEY → tenants.id,
  contact_id VARCHAR(255), -- "tg_123456" or "ig_456789"
  channel VARCHAR(50), -- "telegram", "instagram", "facebook"
  status VARCHAR(50), -- "open", "closed", "handoff_pending"
  lead_score INT (1-10), -- Calculated by Claude scorer
  sentiment VARCHAR(20), -- "positive", "neutral", "negative"
  created_at TIMESTAMP,
  last_message_at TIMESTAMP,
  closed_at TIMESTAMP
);

-- Message (Individual messages)
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID FOREIGN KEY → conversations.id,
  role VARCHAR(20), -- "user", "assistant"
  content TEXT,
  message_type VARCHAR(20), -- "text", "image", "voice", "video"
  metadata JSON, -- {sentiment: "positive", intent: "inquiry"}
  created_at TIMESTAMP,
  channel VARCHAR(50) -- "telegram", "instagram", etc
);

-- Knowledge Document (Uploaded by customer)
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY,
  tenant_id UUID FOREIGN KEY,
  filename VARCHAR(255),
  file_path VARCHAR(500),
  file_type VARCHAR(20), -- "pdf", "docx", "txt"
  num_chunks INT, -- How many embeddings created
  total_tokens INT, -- Token count for cost tracking
  created_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Lead (From conversation)
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  tenant_id UUID FOREIGN KEY,
  contact_id VARCHAR(255),
  conversation_id UUID FOREIGN KEY,
  amocrm_lead_id VARCHAR(255), -- External CRM ID
  lead_score INT,
  status VARCHAR(50), -- "new", "qualified", "won", "lost"
  source VARCHAR(50), -- "telegram", "instagram", "facebook"
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Wallet (Billing)
CREATE TABLE wallet (
  id UUID PRIMARY KEY,
  tenant_id UUID FOREIGN KEY UNIQUE,
  balance DECIMAL(10, 2),
  currency VARCHAR(10), -- "USD", "UZS"
  last_topup_at TIMESTAMP
);

-- UsageLog (For billing)
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID FOREIGN KEY,
  usage_type VARCHAR(50), -- "conversation", "voice", "embedding", "vision"
  cost DECIMAL(10, 4),
  timestamp TIMESTAMP
);
```

---

### **API Endpoints (Customer-Facing)**

```
CONVERSATIONS
GET    /api/conversations?tenant_id=X&page=1
POST   /api/conversations/{id}/messages
WS     /ws/conversations/{id} (WebSocket for real-time)

KNOWLEDGE BASE
GET    /api/knowledge-base?tenant_id=X
POST   /api/knowledge-base/upload (multipart/form-data)
DELETE /api/knowledge-base/{id}
POST   /api/knowledge-base/simulate (test AI response)

LEADS & CRM
GET    /api/leads?tenant_id=X&stage=qualified
POST   /api/leads
PATCH  /api/leads/{id}/stage
GET    /api/integrations/crm-status

ANALYTICS
GET    /api/dashboard/stats?tenant_id=X&days=7
GET    /api/analytics/conversation-analysis/{id}
GET    /api/reports?tenant_id=X&days=30

SETTINGS
GET    /api/settings/tenant?tenant_id=X
PATCH  /api/settings/tenant?tenant_id=X
GET    /api/settings/telegram?tenant_id=X
POST   /api/settings/telegram/send-otp
POST   /api/settings/telegram/verify-otp
GET    /api/settings/instagram?tenant_id=X
POST   /api/settings/instagram/connect

BILLING
GET    /api/billing/wallet?tenant_id=X
POST   /api/billing/top-up
GET    /api/billing/usage-logs?tenant_id=X
```

---

### **Webhook Endpoints (Incoming)**

```
Meta Webhooks (Incoming from Instagram/Facebook):
POST /api/meta-webhooks/instagram
POST /api/meta-webhooks/facebook
GET  /api/meta-webhooks/[verify token challenge]

Telegram (Polling or Webhook - not implemented yet):
Currently using Pyrogram polling in background worker
```

---

## 🔄 Complete Customer Lifecycle

### **Week 1: Onboarding**
```
Day 1: Customer signs up
  → Tenant created
  → Demo account set up
  → Receive welcome email

Day 2-3: Setup integrations
  → Connect Telegram (OTP login)
  → Connect Instagram/Facebook
  → Connect CRM (optional)

Day 4-5: Upload knowledge base
  → Drag-drop FAQ documents
  → Enter manual Q&As
  → Test in simulator

Day 6-7: Go live
  → Activate channels
  → Send test message
  → First automated response ✅
```

### **Week 2+: Ongoing**
```
Daily:
  - Customers send messages
  - AI auto-responds in real-time
  - Leads scored & qualified
  - Conversations stored

Weekly:
  - Qualified leads auto-synced to CRM
  - Admin reviews performance
  - Knowledge base updated as needed

Monthly:
  - Billing cycle (subscription or usage)
  - Daily reports aggregated
  - ROI analysis (revenue from AI-driven leads)
  - Churn risk assessment
```

---

## ✅ Summary: What We Keep, What They Get

| What They Get | What We Keep |
|---------------|--------------|
| **AI Sales Assistant** (24/7) | **API Costs** (Claude, Whisper) |
| **Lead Scoring** (automated) | **Infrastructure** (servers, DB) |
| **CRM Integration** (AmoCRM) | **Revenue** (subscription/usage) |
| **Knowledge Base** (unlimited) | **Customer Data** (insights, analytics) |
| **Voice Analysis** (sentiment) | **Support** (email, chat) |
| **Daily Reports** (analytics) | **Margin** (60-80%) |
| **Multi-channel** (TG, IG, FB) | **Growth** (scaling customers) |

---

## 🎯 Success Metrics (How We Win)

**For Customers:**
- Lead response time: < 5 seconds (vs 4+ hours manual)
- Conversion rate: +40% (automated + consistent responses)
- Time saved: 20+ hours/month (no manual message responses)
- Cost per lead: $0.50-$2 (vs $50 with human agent)

**For Us:**
- Customer acquisition cost (CAC): < $50
- Customer lifetime value (LTV): > $5,000
- Churn rate: < 5% /month
- Unit economics: 10:1 (LTV:CAC ratio)

---

**📌 Key Takeaway:**  
We make money by serving customers well. The better our AI responds, the more leads they convert, the longer they stay, the more we profit. Win-win 🚀

