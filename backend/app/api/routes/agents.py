from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Dict, Any, List
from uuid import UUID

from app.database import get_db
from app.models import VoiceAgent, ChatAgent, Tenant
from app.api.routes.auth import get_current_tenant

router = APIRouter(prefix="/api/agents", tags=["Agents"])

# Voice Agents

@router.get("/voice")
async def list_voice_agents(
    current_tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """List all voice agents for a tenant."""
    res = await db.execute(select(VoiceAgent).where(VoiceAgent.tenant_id == current_tenant.id))
    return {"status": "success", "data": res.scalars().all()}

@router.post("/voice")
async def create_voice_agent(
    payload: Dict[str, Any],
    current_tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Create a new AI Voice Agent with SIP support."""
    new_agent = VoiceAgent(
        tenant_id=current_tenant.id,
        name=payload.get("name", "Sales Voice Agent"),
        voice_id=payload.get("voice_id", "alloy"),
        system_prompt=payload.get("system_prompt", "You are a helpful SDR."),
        provider=payload.get("provider"),
        sip_config=payload.get("sip_config")
    )
    db.add(new_agent)
    await db.commit()
    await db.refresh(new_agent)
    
    # Trigger SIP registration if config is provided
    if new_agent.sip_config:
        from app.telephony.sip_manager import sip_manager, SIPConfig
        try:
            await sip_manager.register_agent(str(new_agent.id), SIPConfig(**new_agent.sip_config))
        except Exception as e:
            # We don't block creation but log the registration failure
            print(f"SIP Registration failed: {e}")
            
    return {"status": "success", "data": new_agent}

@router.put("/voice/{agent_id}")
async def update_voice_agent(
    agent_id: UUID,
    payload: Dict[str, Any],
    current_tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Update a Voice Agent's configuration including SIP."""
    stmt = select(VoiceAgent).where(VoiceAgent.id == agent_id, VoiceAgent.tenant_id == current_tenant.id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Voice agent not found")
        
    for key, value in payload.items():
        if hasattr(agent, key):
            setattr(agent, key, value)
            
    await db.commit()
    await db.refresh(agent)
    
    # Re-register if SIP config changed
    if "sip_config" in payload:
        from app.telephony.sip_manager import sip_manager, SIPConfig
        try:
            await sip_manager.register_agent(str(agent.id), SIPConfig(**agent.sip_config))
        except Exception as e:
            print(f"SIP Re-registration failed: {e}")

    return {"status": "success", "data": agent}

@router.delete("/voice/{agent_id}")
async def delete_voice_agent(
    agent_id: UUID,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Delete a Voice Agent."""
    stmt = select(VoiceAgent).where(VoiceAgent.id == agent_id, VoiceAgent.tenant_id == current_tenant.id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Voice agent not found")
        
    await db.delete(agent)
    await db.commit()
    
    return {"status": "success", "message": "Voice agent deleted"}

# Chat Agents

@router.get("/chat")
async def list_chat_agents(
    current_tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """List all chat agents for a tenant."""
    res = await db.execute(select(ChatAgent).where(ChatAgent.tenant_id == current_tenant.id))
    return {"status": "success", "data": res.scalars().all()}

@router.post("/chat")
async def create_chat_agent(
    payload: Dict[str, Any],
    current_tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Create a new AI Chat Agent."""
    new_agent = ChatAgent(
        tenant_id=current_tenant.id,
        name=payload.get("name", "DM Closer Agent"),
        system_prompt=payload.get("system_prompt", "You are a friendly Instagram closer."),
        settings=payload.get("settings", {})
    )
    db.add(new_agent)
    await db.commit()
    await db.refresh(new_agent)
    return {"status": "success", "data": new_agent}

@router.patch("/chat/{agent_id}")
async def update_chat_agent(
    agent_id: UUID,
    payload: Dict[str, Any],
    current_tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Update a Chat Agent's configuration."""
    stmt = select(ChatAgent).where(ChatAgent.id == agent_id, ChatAgent.tenant_id == current_tenant.id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Chat agent not found")
        
    for key, value in payload.items():
        if hasattr(agent, key):
            setattr(agent, key, value)
            
    await db.commit()
    await db.refresh(agent)
    
    return {"status": "success", "data": agent}

@router.delete("/chat/{agent_id}")
async def delete_chat_agent(
    agent_id: UUID,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Delete a Chat Agent."""
    stmt = select(ChatAgent).where(ChatAgent.id == agent_id, ChatAgent.tenant_id == current_tenant.id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Chat agent not found")
        
    await db.delete(agent)
    await db.commit()
    
    return {"status": "success", "message": "Chat agent deleted"}

# Utilities

@router.get("/{agent_id}")
async def get_agent(
    agent_id: UUID,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Get agent configuration (tries both chat and voice)."""
    v_res = await db.execute(select(VoiceAgent).where(VoiceAgent.id == agent_id, VoiceAgent.tenant_id == current_tenant.id))
    v = v_res.scalar_one_or_none()
    if v:
        return {"status": "success", "data": v, "type": "voice"}
        
    c_res = await db.execute(select(ChatAgent).where(ChatAgent.id == agent_id, ChatAgent.tenant_id == current_tenant.id))
    c = c_res.scalar_one_or_none()
    if c:
        return {"status": "success", "data": c, "type": "chat"}
        
    raise HTTPException(status_code=404, detail="Agent not found")

@router.post("/chat/simulate")
async def simulate_agent_response(
    payload: Dict[str, Any],
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """
    Real-time sandbox simulation for the Agent Studio.
    Does NOT store messages in Redis/DB.
    """
    from app.agents.claude_agent import agent as ai_agent
    
    # Extract config from payload (unsaved draft from Studio)
    user_message = payload.get("message", "Hello")
    system_prompt = payload.get("system_prompt", "")
    behavior_settings = payload.get("settings", {})
    knowledge_ids = payload.get("knowledge_ids", []) # IDs of documents to "lock" to
    
    # 1. Build Behavioral Instructions from Sliders
    # length: 1-100, tone: 1-100, aggressiveness: 1-100
    sliders = behavior_settings.get("behavior_sliders", {})
    length = sliders.get("length", 50)
    tone = sliders.get("tone", 50)
    aggressiveness = sliders.get("aggressiveness", 50)
    
    behavior_instructions = "\nBEHAVIORAL CONSTRAINTS:\n"
    if length < 30: behavior_instructions += "- Keep responses very short and one-sentence if possible.\n"
    elif length > 70: behavior_instructions += "- Provide detailed, thorough explanations.\n"
    
    if tone > 70: behavior_instructions += "- Use casual language and occasional relevant emojis (e.g. 🚀, 😊).\n"
    elif tone < 30: behavior_instructions += "- Maintain a strictly formal, corporate tone. No emojis.\n"
    
    if aggressiveness > 70: behavior_instructions += "- Push for the sale or booking aggressively. Use scarcity/urgency.\n"
    
    # 2. Retrieve Knowledge Context (Filtered by IDs if provided)
    knowledge_context = ""
    try:
        from app.knowledge.rag import rag_search
        # In simulation, we can pass filter if rag_search supports it. 
        # For now, we search generally and log simulation.
        results = await rag_search(str(current_tenant.id), user_message, top_k=5)
        if results:
            knowledge_context = "\n\n".join([f"[Source: {r['source']}]\n{r['text']}" for r in results])
    except Exception as e:
        print(f"Simulation RAG failed: {e}")

    # 3. Call AI with combined prompt
    final_prompt = f"{system_prompt}\n{behavior_instructions}"
    
    # 3. Call REAL Agent logic for high-fidelity simulation
    # We use a special 'sandbox' contact_id to avoid polluting real conversation memory
    try:
        agent_resp = await ai_agent.generate_response(
            tenant_id=str(current_tenant.id),
            contact_id="studio_sandbox_session",
            user_message=user_message,
            business_name=current_tenant.name,
            custom_persona=f"STUDIO_TEST_MODE: {system_prompt}\n{behavior_instructions}",
        )
        
        return {
            "status": "success",
            "reply": agent_resp.reply_text,
            "metadata": agent_resp.metadata,
            "execution_log": [
                {"role": "system", "text": "Simulation RAG search complete."},
                {"role": "system", "text": f"Applied constraints: Length({length}%), Tone({tone}%)"},
                {"role": "system", "text": "Enterprise logic applied to sandbox session."}
            ]
        }
    except Exception as e:
        logger.error("simulation_failed", error=str(e))
        return {"status": "error", "message": str(e)}

@router.put("/chat/{agent_id}")
async def update_chat_agent_config(
    agent_id: UUID,
    payload: Dict[str, Any],
    current_tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Save full agent configuration from Studio (Persona, Knowledge Documents, Tools).
    """
    from app.models import ChatAgent, KnowledgeDocument
    stmt = select(ChatAgent).where(ChatAgent.id == agent_id, ChatAgent.tenant_id == current_tenant.id)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    # Standard fields
    if "name" in payload: agent.name = payload["name"]
    if "system_prompt" in payload: agent.system_prompt = payload["system_prompt"]
    if "internal_role" in payload: agent.internal_role = payload["internal_role"]
    if "settings" in payload: agent.settings = payload["settings"]
    if "is_active" in payload: agent.is_active = payload["is_active"]
    
    # Knowledge Associations
    if "knowledge_ids" in payload:
        # Clear existing
        agent.knowledge_documents = []
        ids = payload["knowledge_ids"]
        if ids:
            k_stmt = select(KnowledgeDocument).where(KnowledgeDocument.id.in_(ids), KnowledgeDocument.tenant_id == current_tenant.id)
            k_res = await db.execute(k_stmt)
            agent.knowledge_documents = list(k_res.scalars().all())

    await db.commit()
    await db.refresh(agent)
    
    return {"status": "success", "data": agent}
