from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Dict, Any, List
from uuid import UUID
import hashlib

from app.database import get_db
from app.models import PromptVersion

router = APIRouter(prefix="/api/prompts", tags=["Prompt Management"])

@router.get("/{agent_id}")
async def get_prompt_versions(
    agent_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get all prompt versions for a specific agent (for A/B testing)."""
    result = await db.execute(
        select(PromptVersion)
        .where(PromptVersion.agent_id == agent_id)
        .order_by(PromptVersion.created_at.desc())
    )
    prompts = result.scalars().all()
    return {"status": "success", "data": prompts}

@router.post("/{agent_id}")
async def create_prompt_version(
    agent_id: UUID,
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """Create a new prompt version and generate its hash."""
    system_prompt = payload.get("system_prompt", "")
    version_hash = hashlib.sha256(system_prompt.encode('utf-8')).hexdigest()[:8]
    
    new_prompt = PromptVersion(
        agent_id=agent_id,
        version_hash=version_hash,
        system_prompt=system_prompt,
        is_active=payload.get("is_active", False)
    )
    
    # If active, deactivate others
    if new_prompt.is_active:
        await db.execute(
            update(PromptVersion)
            .where(PromptVersion.agent_id == agent_id)
            .values(is_active=False)
        )

    db.add(new_prompt)
    await db.commit()
    await db.refresh(new_prompt)
    
    return {"status": "success", "data": new_prompt}

@router.post("/{prompt_id}/activate")
async def activate_prompt(
    prompt_id: UUID,
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """Activate a specific prompt, enabling rollback."""
    agent_id_str = payload.get("agent_id")
    if not agent_id_str:
        raise HTTPException(status_code=400, detail="Must provide agent_id")
        
    agent_id = UUID(agent_id_str)

    # Deactivate all
    await db.execute(
        update(PromptVersion)
        .where(PromptVersion.agent_id == agent_id)
        .values(is_active=False)
    )
    
    # Activate target
    await db.execute(
        update(PromptVersion)
        .where(PromptVersion.id == prompt_id)
        .values(is_active=True)
    )
    
    await db.commit()
    return {"status": "success"}
