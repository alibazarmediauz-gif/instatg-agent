from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Dict, Any, List
from uuid import UUID

from app.database import get_db
from app.models import VoiceAgent, ChatAgent

router = APIRouter(prefix="/api/agents", tags=["Agents"])

# Voice Agents

@router.get("/voice")
async def list_voice_agents(
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """List all voice agents for a tenant."""
    res = await db.execute(select(VoiceAgent).where(VoiceAgent.tenant_id == tenant_id))
    return {"status": "success", "data": res.scalars().all()}

@router.post("/voice")
async def create_voice_agent(
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """Create a new AI Voice Agent with SIP support."""
    new_agent = VoiceAgent(
        tenant_id=tenant_id,
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
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """Update a Voice Agent's configuration including SIP."""
    stmt = select(VoiceAgent).where(VoiceAgent.id == agent_id, VoiceAgent.tenant_id == tenant_id)
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
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """Delete a Voice Agent."""
    stmt = select(VoiceAgent).where(VoiceAgent.id == agent_id, VoiceAgent.tenant_id == tenant_id)
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
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """List all chat agents for a tenant."""
    res = await db.execute(select(ChatAgent).where(ChatAgent.tenant_id == tenant_id))
    return {"status": "success", "data": res.scalars().all()}

@router.post("/chat")
async def create_chat_agent(
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """Create a new AI Chat Agent."""
    new_agent = ChatAgent(
        tenant_id=tenant_id,
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
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """Update a Chat Agent's configuration."""
    stmt = select(ChatAgent).where(ChatAgent.id == agent_id, ChatAgent.tenant_id == tenant_id)
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
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """Delete a Chat Agent."""
    stmt = select(ChatAgent).where(ChatAgent.id == agent_id, ChatAgent.tenant_id == tenant_id)
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
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """Get agent configuration (tries both chat and voice)."""
    v_res = await db.execute(select(VoiceAgent).where(VoiceAgent.id == agent_id, VoiceAgent.tenant_id == tenant_id))
    v = v_res.scalar_one_or_none()
    if v:
        return {"status": "success", "data": v, "type": "voice"}
        
    c_res = await db.execute(select(ChatAgent).where(ChatAgent.id == agent_id, ChatAgent.tenant_id == tenant_id))
    c = c_res.scalar_one_or_none()
    if c:
        return {"status": "success", "data": c, "type": "chat"}
        
    raise HTTPException(status_code=404, detail="Agent not found")

@router.put("/{agent_id}/prompt-version")
async def update_agent_prompt(
    agent_id: UUID,
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    tenant_id: UUID = Query(...)
):
    """Update agent prompt / instructions (mock implementation for either agent type)."""
    return {"status": "success", "message": "Prompt updated"}
