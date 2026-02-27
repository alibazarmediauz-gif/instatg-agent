"""
InstaTG Agent — SQLAlchemy ORM Models

All database models for the multi-tenant sales automation platform.
Each model includes tenant_id for data isolation.
Works with both PostgreSQL and SQLite.
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Enum,
    JSON,
    TypeDecorator,
    CHAR,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


# ─── Portable UUID Type ──────────────────────────────────────────────

class GUID(TypeDecorator):
    """Platform-independent UUID type.
    Uses PostgreSQL's UUID type when available, otherwise CHAR(32).
    """
    impl = CHAR(32)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            if isinstance(value, uuid.UUID):
                return value.hex
            return uuid.UUID(value).hex
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value)
        return value


# Alias for readability
UUID = GUID


# ─── Enums ────────────────────────────────────────────────────────────

class ChannelType(str, PyEnum):
    TELEGRAM = "telegram"
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    INSTAGRAM_COMMENT = "instagram_comment"
    FACEBOOK_COMMENT = "facebook_comment"


class SalesOutcome(str, PyEnum):
    WON = "won"
    LOST = "lost"
    IN_PROGRESS = "in_progress"
    NOT_QUALIFIED = "not_qualified"


class SentimentType(str, PyEnum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class LeadStage(str, PyEnum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    QUALIFIED = "qualified"
    WON = "won"
    LOST = "lost"
    FOLLOW_UP = "follow_up"


class MessageRole(str, PyEnum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class MessageType(str, PyEnum):
    TEXT = "text"
    VOICE = "voice"
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"
    STICKER = "sticker"
    COMMENT = "comment"
    COMMENT_REPLY = "comment_reply"
    OTHER = "other"


# ─── Models ───────────────────────────────────────────────────────────

class Tenant(Base):
    """Business tenant — each company is a tenant."""
    __tablename__ = "tenants"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    owner_email = Column(String(255), nullable=False, unique=True)
    owner_telegram_chat_id = Column(String(100), nullable=True)
    ai_persona = Column(Text, nullable=True, default="")
    master_prompt = Column(Text, nullable=True, default="")
    timezone = Column(String(50), default="Asia/Tashkent")
    human_handoff_enabled = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    telegram_account = relationship("TelegramAccount", back_populates="tenant", uselist=False, cascade="all, delete-orphan")
    instagram_accounts = relationship("InstagramAccount", back_populates="tenant", cascade="all, delete-orphan")
    facebook_accounts = relationship("FacebookAccount", back_populates="tenant", cascade="all, delete-orphan")
    amocrm_account = relationship("AmoCRMAccount", back_populates="tenant", uselist=False, cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="tenant", cascade="all, delete-orphan")
    knowledge_documents = relationship("KnowledgeDocument", back_populates="tenant", cascade="all, delete-orphan")
    manual_knowledges = relationship("ManualKnowledge", back_populates="tenant", cascade="all, delete-orphan")
    frequent_questions = relationship("FrequentQuestion", back_populates="tenant", cascade="all, delete-orphan")
    daily_reports = relationship("DailyReport", back_populates="tenant", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="tenant", cascade="all, delete-orphan")
    wallet = relationship("Wallet", back_populates="tenant", uselist=False, cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="tenant", cascade="all, delete-orphan")
    chat_agents = relationship("ChatAgent", back_populates="tenant", cascade="all, delete-orphan")
    voice_agents = relationship("VoiceAgent", back_populates="tenant", cascade="all, delete-orphan")
    ivr_flows = relationship("IVRFlow", back_populates="tenant", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="tenant", cascade="all, delete-orphan")
    calls = relationship("Call", back_populates="tenant", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="tenant", cascade="all, delete-orphan")
    ai_logs = relationship("AILog", back_populates="tenant", cascade="all, delete-orphan")
    knowledge_base_chunks = relationship("KnowledgeBaseChunk", back_populates="tenant", cascade="all, delete-orphan")
    pipelines = relationship("Pipeline", back_populates="tenant", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="tenant", cascade="all, delete-orphan")


class TelegramAccount(Base):
    """
    Dedicated Telegram business account for a tenant.
    Each tenant has ONE dedicated phone number for business use.
    Session string stored encrypted. Telegram Premium enabled.
    """
    __tablename__ = "telegram_accounts"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True)
    phone_number = Column(String(20), nullable=False)
    encrypted_session_string = Column(Text, nullable=True)  # Fernet-encrypted session string
    display_name = Column(String(255), nullable=True)
    is_premium = Column(Boolean, default=True)  # Telegram Premium account
    is_active = Column(Boolean, default=False)  # Only True after OTP verification
    connection_status = Column(String(50), default="disconnected")  # disconnected, otp_sent, connected, error
    last_connected_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="telegram_account")


class InstagramAccount(Base):
    """Instagram Business account connected via Meta Graph API."""
    __tablename__ = "instagram_accounts"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    instagram_user_id = Column(String(100), nullable=False)
    page_id = Column(String(100), nullable=False)
    access_token = Column(Text, nullable=False)
    username = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="instagram_accounts")


class FacebookAccount(Base):
    """Facebook Business Page connected via Meta Graph API."""
    __tablename__ = "facebook_accounts"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    page_id = Column(String(100), nullable=False, unique=True)
    access_token = Column(Text, nullable=False)
    page_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="facebook_accounts")


class AmoCRMAccount(Base):
    """AmoCRM Integration credentials for pushing leads and events."""
    __tablename__ = "amocrm_accounts"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True)
    subdomain = Column(String(255), nullable=False)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="amocrm_account")


class Conversation(Base):
    """A conversation thread with a single contact across any channel."""
    __tablename__ = "conversations"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    channel = Column(Enum(ChannelType), nullable=False)
    contact_id = Column(String(255), nullable=False)
    contact_name = Column(String(255), nullable=True)
    contact_username = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    needs_human = Column(Boolean, default=False)
    last_message_at = Column(DateTime(timezone=True), nullable=True)
    crm_lead_id = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")
    analysis = relationship("ConversationAnalysis", back_populates="conversation", uselist=False, cascade="all, delete-orphan")
    voice_analyses = relationship("VoiceAnalysis", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    """Individual message in a conversation."""
    __tablename__ = "messages"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(MessageRole), nullable=False)
    message_type = Column(Enum(MessageType), default=MessageType.TEXT)
    content = Column(Text, nullable=False)
    media_url = Column(Text, nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")


class ConversationAnalysis(Base):
    """AI-generated analysis of a completed conversation."""
    __tablename__ = "conversation_analyses"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, unique=True)
    sentiment = Column(Enum(SentimentType), nullable=True)
    lead_score = Column(Integer, nullable=True)
    sales_outcome = Column(Enum(SalesOutcome), nullable=True)
    key_topics = Column(JSON, nullable=True)
    objections_raised = Column(JSON, nullable=True)
    objection_handling = Column(JSON, nullable=True)
    recommended_action = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    is_toxic = Column(Boolean, default=False)
    has_hallucination = Column(Boolean, default=False)
    script_compliance = Column(Integer, default=100)
    flag_reason = Column(Text, nullable=True)
    raw_analysis = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="analysis")


class VoiceAnalysis(Base):
    """Deep analysis of a voice message — transcription + sales insight."""
    __tablename__ = "voice_analyses"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    message_id = Column(UUID(), ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    transcription = Column(Text, nullable=False)
    duration_seconds = Column(Float, nullable=True)
    tone = Column(String(50), nullable=True)
    emotion = Column(String(50), nullable=True)
    pain_points = Column(JSON, nullable=True)
    sale_outcome_reason = Column(Text, nullable=True)
    sales_moment_analysis = Column(Text, nullable=True)
    raw_analysis = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="voice_analyses")

class Notification(Base):
    """Real-time push notifications for agents."""
    __tablename__ = "notifications"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # info, success, warning, danger
    is_read = Column(Boolean, default=False, index=True)
    link = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    tenant = relationship("Tenant", back_populates="notifications")


class KnowledgeDocument(Base):
    """Uploaded knowledge base document for RAG."""
    __tablename__ = "knowledge_documents"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=True)
    chunk_count = Column(Integer, default=0)
    status = Column(String(50), default="processing")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="knowledge_documents")


class CRMLead(Base):
    """Record of a lead pushed to AmoCRM."""
    __tablename__ = "crm_leads"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    conversation_id = Column(UUID(), ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True)
    amocrm_lead_id = Column(String(100), nullable=True)
    amocrm_contact_id = Column(String(100), nullable=True)
    contact_name = Column(String(255), nullable=True)
    channel = Column(Enum(ChannelType), nullable=True)
    stage = Column(Enum(LeadStage), default=LeadStage.NEW)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    sync_error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class DailyReport(Base):
    """Generated daily analytics report."""
    __tablename__ = "daily_reports"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    report_date = Column(DateTime(timezone=True), nullable=False)
    total_conversations = Column(Integer, default=0)
    conversations_handled = Column(Integer, default=0)
    conversations_missed = Column(Integer, default=0)
    conversion_rate = Column(Float, default=0.0)
    top_scripts = Column(JSON, nullable=True)
    common_objections = Column(JSON, nullable=True)
    voice_summary = Column(Text, nullable=True)
    comparison_data = Column(JSON, nullable=True)
    full_report = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="daily_reports")


class ManualKnowledge(Base):
    """Manually entered Q&A or raw text knowledge."""
    __tablename__ = "manual_knowledges"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=True)
    answer = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="manual_knowledges")


class FrequentQuestion(Base):
    """Auto-tracked clustered questions asked by customers. Pending review if hit_count >= 5."""
    __tablename__ = "frequent_questions"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    cluster_topic = Column(Text, nullable=False)  # e.g., "Mijozlar manzilingizni qayerdanligini so'ramoqda"
    hit_count = Column(Integer, default=1)
    status = Column(String(50), default="tracking")  # tracking, pending_review, answered, dismissed
    admin_answer = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="frequent_questions")

# ─── New AI SaaS Models ───────────────────────────────────────────────

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True)
    balance = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="wallet")

class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    wallet_id = Column(UUID(), ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False)
    service_type = Column(String(50), nullable=False)  # "voice" or "chat"
    cost = Column(Float, nullable=False)
    units_consumed = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="usage_logs")

class ChatAgent(Base):
    __tablename__ = "chat_agents"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    system_prompt = Column(Text, nullable=True)
    settings = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="chat_agents")

class IVRFlow(Base):
    __tablename__ = "ivr_flows"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    tree_config = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="ivr_flows")

class VoiceAgent(Base):
    __tablename__ = "voice_agents"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    voice_id = Column(String(255), nullable=False)
    ivr_flow_id = Column(UUID(), ForeignKey("ivr_flows.id", ondelete="SET NULL"), nullable=True)
    system_prompt = Column(Text, nullable=True)
    
    # Telephony / SIP Config (Uzbekistan market)
    provider = Column(String(50), nullable=True)  # beeline, ucell, uztelecom, sip.uz
    sip_config = Column(JSON, nullable=True)      # {server, port, user, password, transport}
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="voice_agents")
    ivr_flow = relationship("IVRFlow")

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    status = Column(String(50), default="draft", index=True)  # draft, running, paused, completed
    channel = Column(String(50), default="voice", index=True) # voice, telegram, sms
    provider = Column(String(50), nullable=True)  # beeline, ucell, etc.
    agent_id = Column(UUID(), nullable=True)      # ID of the VoiceAgent or ChatAgent
    agent_name = Column(String(255), nullable=True) # Cached name
    
    total_contacts = Column(Integer, default=0)
    called = Column(Integer, default=0)           # Contacts processed (renamed for clarity but kept called for consistency with UI)
    conversions = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)
    
    ab_variants = Column(JSON, nullable=True) # {variants: [{hook: "...", body: "...", score: 0}]}
    
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="campaigns")

class Call(Base):
    __tablename__ = "calls"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    voice_agent_id = Column(UUID(), ForeignKey("voice_agents.id", ondelete="SET NULL"), nullable=True)
    campaign_id = Column(UUID(), ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    contact_number = Column(String(50), nullable=False)
    status = Column(String(50), default="initiated")
    duration_seconds = Column(Integer, default=0)
    recording_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="calls")
    voice_agent = relationship("VoiceAgent")
    campaign = relationship("Campaign")

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    chat_agent_id = Column(UUID(), ForeignKey("chat_agents.id", ondelete="SET NULL"), nullable=True)
    contact_id = Column(String(255), nullable=False)
    channel = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="chat_sessions")
    chat_agent = relationship("ChatAgent")

class AILog(Base):
    __tablename__ = "ai_logs"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String(255), nullable=False)
    prompt_snapshot = Column(Text, nullable=True)
    completion = Column(Text, nullable=True)
    token_usage = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="ai_logs")

class KnowledgeBaseChunk(Base):
    __tablename__ = "knowledge_base_chunks"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(UUID(), ForeignKey("knowledge_documents.id", ondelete="CASCADE"), nullable=True)
    content = Column(Text, nullable=False)
    vector_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="knowledge_base_chunks")

class Pipeline(Base):
    __tablename__ = "pipelines"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    tenant = relationship("Tenant", back_populates="pipelines")
    stages = relationship("PipelineStage", back_populates="pipeline", cascade="all, delete-orphan", order_by="PipelineStage.order")

class PipelineStage(Base):
    __tablename__ = "pipeline_stages"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    pipeline_id = Column(UUID(), ForeignKey("pipelines.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    pipeline = relationship("Pipeline", back_populates="stages")

class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_info = Column(JSON, nullable=True)
    status = Column(String(50), default="New", index=True)
    pipeline_stage_id = Column(UUID(), ForeignKey("pipeline_stages.id", ondelete="SET NULL"), nullable=True)
    probability_score = Column(Float, default=0.0)
    clv = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    tenant = relationship("Tenant", back_populates="leads")
    pipeline_stage = relationship("PipelineStage")
    sales_interactions = relationship("SalesInteraction", back_populates="lead", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="lead", cascade="all, delete-orphan")

class SalesInteraction(Base):
    __tablename__ = "sales_interactions"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    agent_id = Column(UUID(), nullable=True)
    channel = Column(String(50), nullable=False)
    detected_objections = Column(JSON, nullable=True)
    sentiment_score = Column(Float, nullable=True)
    qa_grade = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead", back_populates="sales_interactions")

class PromptVersion(Base):
    __tablename__ = "prompt_versions"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(), nullable=False)
    version_hash = Column(String(255), nullable=False)
    system_prompt = Column(Text, nullable=False)
    performance_score = Column(Float, default=0.0)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    status = Column(String(50), default="Pending")
    stripe_payment_intent_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    lead = relationship("Lead", back_populates="transactions")
