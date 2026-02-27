"""
Seed Script — Populate database with realistic demo data.

Run: python seed_demo_data.py
"""

import asyncio
import uuid
from datetime import datetime, timedelta

from sqlalchemy import text
from app.database import engine, async_session_factory, init_db
from app.models import (
    Tenant, Conversation, Message, ConversationAnalysis, VoiceAnalysis,
    KnowledgeDocument, DailyReport, CRMLead,
    ChannelType, SalesOutcome, SentimentType, LeadStage, MessageRole, MessageType,
)


# Fixed UUIDs for predictability
TENANT_ID = uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567890")

CONV_IDS = [uuid.uuid4() for _ in range(9)]
MSG_IDS = [uuid.uuid4() for _ in range(70)]
VA_IDS = [uuid.uuid4() for _ in range(3)]


async def seed():
    await init_db()

    async with async_session_factory() as db:
        # Check if already seeded
        result = await db.execute(text("SELECT COUNT(*) FROM tenants"))
        count = result.scalar()
        if count > 0:
            print("⚠️  Database already has data. Skipping seed.")
            return

        now = datetime.utcnow()

        # ─── Tenant ──────────────────────────────────────────
        tenant = Tenant(
            id=TENANT_ID,
            name="SalesAI Demo Company",
            owner_email="admin@salesai.demo",
            ai_persona="professional",
            timezone="Asia/Tashkent",
            human_handoff_enabled=True,
            owner_telegram_chat_id="123456789",
            is_active=True,
        )
        db.add(tenant)

        # ─── Conversations ───────────────────────────────────
        conversations_data = [
            {
                "id": CONV_IDS[0],
                "contact_id": "ig_emma_watson_12345",
                "contact_name": "Emma Watson",
                "contact_username": "emma_w",
                "channel": ChannelType.INSTAGRAM,
                "is_active": True,
                "needs_human": True,
                "last_message_at": now - timedelta(minutes=5),
            },
            {
                "id": CONV_IDS[1],
                "contact_id": "tg_987654321",
                "contact_name": "Alex Rivera",
                "contact_username": "alex_rivera",
                "channel": ChannelType.TELEGRAM,
                "is_active": True,
                "needs_human": False,
                "last_message_at": now - timedelta(minutes=2),
            },
            {
                "id": CONV_IDS[2],
                "contact_id": "ig_sarah_kim_67890",
                "contact_name": "Sarah Kim",
                "contact_username": "sarah_k",
                "channel": ChannelType.INSTAGRAM,
                "is_active": False,
                "needs_human": False,
                "last_message_at": now - timedelta(minutes=15),
            },
            {
                "id": CONV_IDS[3],
                "contact_id": "tg_111222333",
                "contact_name": "Mike Thompson",
                "contact_username": "mike_t",
                "channel": ChannelType.TELEGRAM,
                "is_active": True,
                "needs_human": False,
                "last_message_at": now - timedelta(hours=1),
            },
            {
                "id": CONV_IDS[4],
                "contact_id": "tg_444555666",
                "contact_name": "Lina Petrova",
                "contact_username": "lina_p",
                "channel": ChannelType.TELEGRAM,
                "is_active": False,
                "needs_human": False,
                "last_message_at": now - timedelta(hours=3),
            },
            {
                "id": CONV_IDS[5],
                "contact_id": "ig_david_chen_54321",
                "contact_name": "David Chen",
                "contact_username": "david_chen",
                "channel": ChannelType.INSTAGRAM,
                "is_active": True,
                "needs_human": False,
                "last_message_at": now - timedelta(hours=5),
            },
            {
                "id": CONV_IDS[6],
                "contact_id": "fb_123456789",
                "contact_name": "Marketing Agency Co",
                "contact_username": None,
                "channel": ChannelType.FACEBOOK,
                "is_active": True,
                "needs_human": False,
                "last_message_at": now - timedelta(minutes=45),
            },
            {
                "id": CONV_IDS[7],
                "contact_id": "ig_jessica_m_888",
                "contact_name": "Jessica Miller",
                "contact_username": "jessica_m",
                "channel": ChannelType.INSTAGRAM_COMMENT,
                "is_active": True,
                "needs_human": False,
                "last_message_at": now - timedelta(hours=2),
            },
            {
                "id": CONV_IDS[8],
                "contact_id": "fb_carlos_r_999",
                "contact_name": "Carlos Rodriguez",
                "contact_username": None,
                "channel": ChannelType.FACEBOOK_COMMENT,
                "is_active": True,
                "needs_human": False,
                "last_message_at": now - timedelta(hours=4),
            },
        ]

        for cd in conversations_data:
            conv = Conversation(tenant_id=TENANT_ID, **cd)
            db.add(conv)

        # ─── Messages ────────────────────────────────────────
        # Conversation 0: Emma Watson — frustrated customer (needs_human)
        emma_msgs = [
            ("user", "Hi, I've been looking at your automation tools. Specifically interested in the CRM integrations."),
            ("assistant", "Hello! Great to hear you're interested. Our platform integrates seamlessly with Salesforce, HubSpot, and Pipedrive. Which CRM are you currently using?"),
            ("user", "We use HubSpot. But I'm having major issues with your trial. Nothing is syncing!"),
            ("assistant", "I understand that can be frustrating. Usually, this is due to API permissions. Have you checked your HubSpot API key settings?"),
            ("user", "This is ridiculous. I need to speak to a human immediately. Your bot is useless!"),
            ("assistant", "I completely understand your frustration. Let me connect you with our support team right away. A specialist will be with you shortly."),
        ]

        # Conversation 1: Alex Rivera — negotiation (high score)
        alex_msgs = [
            ("user", "Hey, I saw your enterprise plan. Is the enterprise plan compatible with our setup? We run 50+ agents."),
            ("assistant", "Absolutely! Our Enterprise plan supports unlimited agents. For 50+ agents, we'd recommend our custom tier with dedicated support. Would you like me to arrange a call with our solutions team?"),
            ("user", "How much would that cost us? We need annual pricing with volume discount."),
            ("assistant", "For 50+ agents on an annual plan, we offer 30% volume discount. That brings it to $45/agent/month. I can prepare a custom proposal with exact pricing for your team size."),
            ("user", "That sounds reasonable. Let me discuss with my CFO. Can you send the proposal to alex@rivercorp.com?"),
            ("assistant", "Absolutely! I'll send over a detailed proposal within the hour. It will include volume pricing, feature breakdown, and implementation timeline. Looking forward to working with you!"),
        ]

        # Conversation 2: Sarah Kim — won deal
        sarah_msgs = [
            ("user", "Thanks for the info, I'll check with my team."),
            ("assistant", "Of course! I'll also send you a comparison chart with our competitors. Feel free to reach out anytime."),
            ("user", "We've decided to go ahead with the Professional plan. How do I sign up?"),
            ("assistant", "Wonderful decision! I'll send you the signup link right now. The Professional plan includes all CRM integrations, voice analysis, and 24/7 support. Welcome aboard! 🎉"),
        ]

        # Conversation 3: Mike Thompson — qualification
        mike_msgs = [
            ("user", "How much is the implementation timeline for a mid-size company?"),
            ("assistant", "For mid-size companies (20-100 employees), typical implementation takes 2-3 weeks. This includes CRM integration, AI training on your data, and team onboarding. Would you like to schedule an implementation call?"),
            ("user", "That seems fast. What about data migration from our existing system?"),
            ("assistant", "We handle data migration as part of our implementation package — completely free of charge. Our team will export all your existing leads, contacts, and conversation history. Zero data loss guaranteed."),
        ]

        # Conversation 4: Lina Petrova — lost deal
        lina_msgs = [
            ("user", "I've been comparing your tool with Competitor X. They have a feature your platform doesn't offer."),
            ("assistant", "I'd love to understand which feature you're referring to. We're constantly expanding our capabilities and your feedback helps prioritize our roadmap."),
            ("user", "They have native WhatsApp integration. We rely heavily on WhatsApp for our business."),
            ("assistant", "That's great feedback. While we currently focus on Telegram and Instagram, WhatsApp integration is on our Q2 roadmap. In the meantime, we can connect via Zapier as a workaround."),
            ("user", "Sorry, we need native WhatsApp now. Maybe we'll come back when you have it."),
            ("assistant", "I completely understand. I'll make sure our team knows about this requirement. When WhatsApp launches, I'll personally notify you. Wishing you the best!"),
        ]

        # Conversation 5: David Chen — follow-up
        david_msgs = [
            ("user", "Got your email about the new features. The AI persona customization looks interesting."),
            ("assistant", "Great to hear! The AI persona feature lets you customize your bot's tone, language, and sales approach. You can switch between Professional, Friendly, Consultative, and Aggressive modes."),
            ("user", "Can I try it before committing to the annual plan?"),
            ("assistant", "Absolutely! We offer a 14-day full-feature trial. No credit card required. I can set it up for you right now if you'd like."),
        ]

        # Conversation 6: Facebook DM
        fb_dm_msgs = [
            ("user", "Hello, do you offer customized plans for agencies?", MessageType.TEXT),
            ("assistant", "Hi there! Yes, we have a dedicated Agency Partner Program with white-labeling options and custom pricing. How many clients are you looking to onboard?", MessageType.TEXT),
            ("user", "We have about 10 active e-commerce clients right now.", MessageType.TEXT),
            ("assistant", "Perfect. Our Agency Starter tier covers up to 15 sub-accounts with full API access. Would you like me to send over the partner kit?", MessageType.TEXT),
        ]

        # Conversation 7: Instagram Comment -> DM
        ig_cm_msgs = [
            ("user", "qancha turadi bu model? razmeri bormi?", MessageType.COMMENT),
            ("assistant", "Great question! I'll send you the details in DM 📩", MessageType.COMMENT_REPLY),
            ("assistant", "Hi Jessica! Thanks for your comment on our post! The model you asked about is currently $45, and we have sizes S, M, and L available. Which size are you looking for?", MessageType.TEXT),
            ("user", "M size please. How fast is delivery?", MessageType.TEXT),
            ("assistant", "We can deliver size M by tomorrow morning if you order today. Shall I process the order for you?", MessageType.TEXT),
        ]

        # Conversation 8: Facebook Comment -> DM
        fb_cm_msgs = [
            ("user", "Is this software available in Spanish?", MessageType.COMMENT),
            ("assistant", "Yes it is! I'm sending you a DM with more information. 🌎", MessageType.COMMENT_REPLY),
            ("assistant", "Hi Carlos! Following up on your comment. Yes, our entire platform and the AI agent fully support Spanish. We have many clients in LATAM and Spain. Would you like to see a demo in Spanish?", MessageType.TEXT),
            ("user", "Yes, a demo would be great. Next Tuesday?", MessageType.TEXT),
        ]

        all_conv_msgs = [
            (CONV_IDS[0], emma_msgs),
            (CONV_IDS[1], alex_msgs),
            (CONV_IDS[2], sarah_msgs),
            (CONV_IDS[3], mike_msgs),
            (CONV_IDS[4], lina_msgs),
            (CONV_IDS[5], david_msgs),
            (CONV_IDS[6], fb_dm_msgs),
            (CONV_IDS[7], ig_cm_msgs),
            (CONV_IDS[8], fb_cm_msgs),
        ]

        msg_idx = 0
        for conv_id, msgs in all_conv_msgs:
            for i, item in enumerate(msgs):
                if len(item) == 2:
                    role, content = item
                    m_type = MessageType.TEXT
                else:
                    role, content, m_type = item

                msg = Message(
                    id=MSG_IDS[msg_idx] if msg_idx < len(MSG_IDS) else uuid.uuid4(),
                    conversation_id=conv_id,
                    role=MessageRole(role),
                    message_type=m_type,
                    content=content,
                    created_at=now - timedelta(minutes=60 - i * 3),
                )
                db.add(msg)
                msg_idx += 1

        # ─── Conversation Analyses ────────────────────────────
        analyses = [
            {
                "conversation_id": CONV_IDS[0],
                "sentiment": SentimentType.NEGATIVE,
                "lead_score": 6.5,
                "sales_outcome": SalesOutcome.IN_PROGRESS,
                "key_topics": ["CRM Integration", "HubSpot", "Sync Issues"],
                "objections_raised": ["Product not working", "Need human agent"],
                "objection_handling": ["Acknowledged frustration", "Offered escalation"],
                "recommended_action": "Immediate human intervention — customer is frustrated",
                "summary": "Customer frustrated with HubSpot sync issues. Escalated for human intervention.",
            },
            {
                "conversation_id": CONV_IDS[1],
                "sentiment": SentimentType.POSITIVE,
                "lead_score": 9.8,
                "sales_outcome": SalesOutcome.IN_PROGRESS,
                "key_topics": ["Enterprise Plan", "Volume Pricing", "50+ Agents"],
                "objections_raised": ["Price inquiry"],
                "objection_handling": ["Offered 30% volume discount"],
                "recommended_action": "Follow up on proposal — high intent buyer",
                "summary": "Enterprise prospect with 50+ agents. Proposal sent. High probability deal.",
            },
            {
                "conversation_id": CONV_IDS[2],
                "sentiment": SentimentType.POSITIVE,
                "lead_score": 9.2,
                "sales_outcome": SalesOutcome.WON,
                "key_topics": ["Professional Plan", "Comparison", "Signup"],
                "objections_raised": [],
                "objection_handling": [],
                "recommended_action": "Onboarding — send welcome kit",
                "summary": "Customer chose Professional plan after reviewing competitor comparison. Deal won.",
            },
            {
                "conversation_id": CONV_IDS[3],
                "sentiment": SentimentType.NEUTRAL,
                "lead_score": 7.5,
                "sales_outcome": SalesOutcome.IN_PROGRESS,
                "key_topics": ["Implementation", "Data Migration", "Mid-size Company"],
                "objections_raised": ["Timeline concern"],
                "objection_handling": ["Explained 2-3 week timeline", "Free data migration"],
                "recommended_action": "Schedule implementation call",
                "summary": "Mid-size company prospect asking about implementation. Positive engagement.",
            },
            {
                "conversation_id": CONV_IDS[4],
                "sentiment": SentimentType.NEGATIVE,
                "lead_score": 3.2,
                "sales_outcome": SalesOutcome.LOST,
                "key_topics": ["WhatsApp", "Competitor Comparison", "Feature Gap"],
                "objections_raised": ["Missing WhatsApp integration", "Competitor preferred"],
                "objection_handling": ["Mentioned Q2 roadmap", "Offered Zapier workaround"],
                "recommended_action": "Re-engage when WhatsApp launches",
                "summary": "Lost to competitor — customer needs native WhatsApp. Follow up Q2.",
            },
            {
                "conversation_id": CONV_IDS[5],
                "sentiment": SentimentType.POSITIVE,
                "lead_score": 8.4,
                "sales_outcome": SalesOutcome.IN_PROGRESS,
                "key_topics": ["AI Persona", "Trial", "Features"],
                "objections_raised": ["Wants trial before committing"],
                "objection_handling": ["Offered 14-day free trial"],
                "recommended_action": "Set up trial account — follow up in 7 days",
                "summary": "Interested in AI persona feature. Trial offered. Good engagement.",
            },
            {
                "conversation_id": CONV_IDS[6],
                "sentiment": SentimentType.POSITIVE,
                "lead_score": 8.0,
                "sales_outcome": SalesOutcome.IN_PROGRESS,
                "key_topics": ["Agency Plan", "White-label"],
                "objections_raised": [],
                "objection_handling": [],
                "recommended_action": "Send partner kit",
                "summary": "Agency interested in white-label solution for 10 clients.",
            },
            {
                "conversation_id": CONV_IDS[7],
                "sentiment": SentimentType.POSITIVE,
                "lead_score": 9.5,
                "sales_outcome": SalesOutcome.IN_PROGRESS,
                "key_topics": ["Product availability", "Pricing", "Delivery"],
                "objections_raised": [],
                "objection_handling": [],
                "recommended_action": "Process order for size M",
                "summary": "Comment to DM conversion. High intent to buy size M.",
            },
            {
                "conversation_id": CONV_IDS[8],
                "sentiment": SentimentType.POSITIVE,
                "lead_score": 8.5,
                "sales_outcome": SalesOutcome.IN_PROGRESS,
                "key_topics": ["Spanish support", "Demo"],
                "objections_raised": [],
                "objection_handling": [],
                "recommended_action": "Schedule demo for next Tuesday",
                "summary": "FB comment inquiry about language support. Demo requested.",
            },
        ]

        for a in analyses:
            analysis = ConversationAnalysis(id=uuid.uuid4(), **a)
            db.add(analysis)

        # ─── Voice Analyses ───────────────────────────────────
        voice_data = [
            {
                "id": VA_IDS[0],
                "conversation_id": CONV_IDS[1],
                "transcription": "Hey Alex, this is John from VoiceAI. I noticed you checked out our pricing page yesterday. I wanted to see if you had any specific questions about our enterprise tiers?\n\nHi John. Yeah, I'm definitely interested in the automation features. We're currently scaling our outreach team and manual follow-ups are killing us. But honestly, the budget is tight this quarter, so I'm looking at options that can give us the best ROI immediately.\n\nI totally understand. If budget is the main concern, we actually have a quarterly promo that waives the onboarding fee. That might help lower the initial cost. Would that make a difference for you?\n\nActually yes, that could work. Let me run it by our CFO and get back to you by Friday.",
                "duration_seconds": 45,
                "tone": "professional",
                "emotion": "cautiously optimistic",
                "pain_points": ["Budget Constraints", "Manual follow-ups", "Scaling outreach"],
                "sale_outcome_reason": "Sales rep successfully pivoted to Professional Plan when budget objection was raised. Waiving the onboarding fee was the critical closing factor. Clear ROI communicated regarding scaling outreach team.",
                "sales_moment_analysis": "Key moment at 0:28 — offering quarterly promo when budget concern raised. This pivot from enterprise to flexible pricing saved the deal.",
            },
            {
                "id": VA_IDS[1],
                "conversation_id": CONV_IDS[4],
                "transcription": "Hi Sarah, thanks for responding to our message. I wanted to follow up on our conversation about the sales automation platform.\n\nHi, yeah I looked at it. Honestly, we've been using Competitor X for a while now and switching seems like a lot of work.\n\nI understand switching costs can be a concern. What if I told you we handle the entire migration for free? And our platform typically shows 40% more engagement within the first month.\n\nThat's interesting, but I'm really not in a position to make a decision right now. Maybe in a few months.\n\nCompletely understand. I'll follow up in Q2. In the meantime, I'll send over some case studies from companies similar to yours. Have a great day!",
                "duration_seconds": 80,
                "tone": "hesitant",
                "emotion": "reluctant",
                "pain_points": ["Switching costs", "Current tool satisfaction", "Decision authority"],
                "sale_outcome_reason": "Prospect satisfied with current solution. Switching cost objection not fully addressed. Needs stronger competitive differentiation.",
                "sales_moment_analysis": "Missed opportunity at 0:35 — should have asked about specific pain points with current tool before pitching migration.",
            },
            {
                "id": VA_IDS[2],
                "conversation_id": CONV_IDS[5],
                "transcription": "Mike, great to connect. You mentioned on the form that you're looking for an AI-powered follow-up system. Tell me more about your current workflow.\n\nYeah, we have about 200 leads coming in weekly from Instagram and Telegram. Right now my team manually responds to each one. It takes hours and we're missing a lot of leads during off-hours.\n\nThat's a common challenge. Our AI agent handles initial qualification 24/7 and only flags the high-intent leads for your team. Most of our clients see a 60% reduction in response time. Would a 14-day trial interest you?\n\nDefinitely. I want to see how it handles our industry-specific questions.\n\nWe can train the AI on your product catalog and FAQ docs. The setup takes about 30 minutes. When would be a good time to do that?",
                "duration_seconds": 135,
                "tone": "engaged",
                "emotion": "excited",
                "pain_points": ["Manual responses", "Missing leads off-hours", "Volume handling"],
                "sale_outcome_reason": "Strong alignment between customer pain (200 leads/week, off-hours gaps) and product capability. Trial agreed — high conversion probability.",
                "sales_moment_analysis": "Excellent discovery phase. Sales rep matched each pain point to a specific feature. Trial agreement came naturally after demonstrating clear value.",
            },
        ]

        for vd in voice_data:
            va = VoiceAnalysis(**vd)
            db.add(va)

        # ─── Knowledge Documents ──────────────────────────────
        docs = [
            KnowledgeDocument(
                tenant_id=TENANT_ID,
                filename="Product_Catalog_2024.pdf",
                file_type="pdf",
                file_size=2457600,
                chunk_count=24,
                status="completed",
                created_at=now - timedelta(hours=2),
            ),
            KnowledgeDocument(
                tenant_id=TENANT_ID,
                filename="Price_List_Q3.xlsx",
                file_type="xlsx",
                file_size=876544,
                chunk_count=8,
                status="completed",
                created_at=now - timedelta(days=1),
            ),
        ]
        for d in docs:
            db.add(d)

        # ─── Daily Reports ────────────────────────────────────
        for i in range(3):
            report_date = now - timedelta(days=i)
            total = 142 - i * 15
            handled = int(total * (0.83 - i * 0.02))
            missed = total - handled
            dr = DailyReport(
                tenant_id=TENANT_ID,
                report_date=report_date,
                total_conversations=total,
                conversations_handled=handled,
                conversations_missed=missed,
                conversion_rate=round(12.0 - i * 1.5, 1),
                top_scripts=[
                    {"phrase": "Book a demo", "success_rate": 0.42},
                    {"phrase": "Annual plan discount", "success_rate": 0.38},
                    {"phrase": "How it works", "success_rate": 0.35},
                    {"phrase": "Free trial start", "success_rate": 0.33},
                    {"phrase": "Integration list", "success_rate": 0.28},
                ],
                common_objections=[
                    {"phrase": "Too expensive", "frequency": 0.32},
                    {"phrase": "Not now", "frequency": 0.28},
                    {"phrase": "Competitor X feature", "frequency": 0.18},
                ],
                voice_summary="Average emotion score: 7.2/10. Positive trend. Best script: waiving onboarding fee (42% win rate).",
                comparison_data={
                    "yesterday": {"total": total + 12, "handled": handled + 8},
                    "last_week_avg": {"total": total - 5, "handled": handled - 3},
                },
                full_report={
                    "outcome_distribution": {
                        "in_progress": 63, "handoff": 17, "won": 12, "lost": 8,
                    },
                    "handoff_reasons": [
                        {"reason": "Frustrated tone", "pct": 42},
                        {"reason": "Complex query", "pct": 28},
                        {"reason": "Keyword 'Manager'", "pct": 18},
                        {"reason": "Pricing Negotiation", "pct": 12},
                    ],
                    "voice_emotion_score": 7.2,
                    "best_script": {
                        "text": "I understand you're looking for efficiency. Our tool automates 80% of initial outreach.",
                        "win_rate": 0.42,
                    },
                    "worst_script": {
                        "text": "Check out our pricing page for more info.",
                        "dropoff_rate": 0.65,
                    },
                    "weekly_volume": [
                        {"day": "Mon", "chats": 42, "resolved": 38},
                        {"day": "Tue", "chats": 55, "resolved": 48},
                        {"day": "Wed", "chats": 38, "resolved": 35},
                        {"day": "Thu", "chats": 64, "resolved": 55},
                        {"day": "Fri", "chats": 52, "resolved": 46},
                        {"day": "Sat", "chats": 28, "resolved": 24},
                        {"day": "Sun", "chats": 18, "resolved": 16},
                    ],
                    "channel_breakdown": {"telegram": 65, "instagram": 35},
                },
            )
            db.add(dr)

        # ─── CRM Leads ───────────────────────────────────────
        crm_leads = [
            CRMLead(
                tenant_id=TENANT_ID,
                conversation_id=CONV_IDS[1],
                amocrm_lead_id="AMO-10042",
                amocrm_contact_id="AMO-C-5001",
                contact_name="Alex Rivera",
                channel=ChannelType.TELEGRAM,
                stage=LeadStage.QUALIFIED,
                last_synced_at=now - timedelta(minutes=5),
            ),
            CRMLead(
                tenant_id=TENANT_ID,
                conversation_id=CONV_IDS[2],
                amocrm_lead_id="AMO-10043",
                amocrm_contact_id="AMO-C-5002",
                contact_name="Sarah Kim",
                channel=ChannelType.INSTAGRAM,
                stage=LeadStage.WON,
                last_synced_at=now - timedelta(minutes=10),
            ),
            CRMLead(
                tenant_id=TENANT_ID,
                conversation_id=CONV_IDS[4],
                amocrm_lead_id="AMO-10044",
                amocrm_contact_id="AMO-C-5003",
                contact_name="Lina Petrova",
                channel=ChannelType.TELEGRAM,
                stage=LeadStage.LOST,
                last_synced_at=now - timedelta(hours=1),
            ),
        ]
        for cl in crm_leads:
            db.add(cl)

        await db.commit()
        print(f"✅ Demo data seeded successfully!")
        print(f"   Tenant ID: {TENANT_ID}")
        print(f"   Conversations: {len(conversations_data)}")
        print(f"   Messages: {msg_idx}")
        print(f"   Voice Analyses: {len(voice_data)}")
        print(f"   Knowledge Docs: {len(docs)}")
        print(f"   Daily Reports: 3")
        print(f"   CRM Leads: {len(crm_leads)}")


if __name__ == "__main__":
    asyncio.run(seed())
