"""
InstaTG Agent — Knowledge Base API Routes

Upload, list, and delete knowledge base documents.
"""

import structlog
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import KnowledgeDocument, Tenant
from app.api.routes.auth import get_current_tenant
from app.knowledge.uploader import ingest_document

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/knowledge-base", tags=["Knowledge Base"])


@router.get("")
async def list_documents(
    current_tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """List all knowledge base documents for a tenant."""
    result = await db.execute(
        select(KnowledgeDocument)
        .where(KnowledgeDocument.tenant_id == current_tenant.id)
        .order_by(desc(KnowledgeDocument.created_at))
    )
    docs = result.scalars().all()

    return {
        "documents": [
            {
                "id": str(d.id),
                "filename": d.filename,
                "file_type": d.file_type,
                "file_size": d.file_size,
                "chunk_count": d.chunk_count,
                "status": d.status,
                "created_at": d.created_at.isoformat(),
            }
            for d in docs
        ]
    }


@router.post("/upload")
async def upload_document(
    current_tenant: Tenant = Depends(get_current_tenant),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document to the knowledge base."""
    allowed_types = {"pdf", "docx", "doc", "txt", "md", "csv", "json"}
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""

    if ext not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: .{ext}. Allowed: {', '.join(sorted(allowed_types))}",
        )

    file_data = await file.read()

    if len(file_data) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum size: 10MB")

    # Create DB record
    doc = KnowledgeDocument(
        tenant_id=current_tenant.id,
        filename=file.filename,
        file_type=ext,
        file_size=len(file_data),
        status="processing",
    )
    db.add(doc)
    await db.flush()
    doc_id = str(doc.id)

    try:
        # Ingest into Pinecone
        result = await ingest_document(
            tenant_id=str(current_tenant.id),
            file_data=file_data,
            filename=file.filename,
            document_id=doc_id,
        )

        doc.chunk_count = result["chunk_count"]
        doc.status = "completed"
        await db.flush()

        logger.info("document_uploaded", tenant=str(current_tenant.id), filename=file.filename, chunks=result["chunk_count"])

        return {
            "id": doc_id,
            "filename": file.filename,
            "chunk_count": result["chunk_count"],
            "status": "completed",
        }

    except Exception as e:
        doc.status = "failed"
        await db.flush()
        logger.error("document_upload_error", error=str(e), filename=file.filename)
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
@router.post("/scrape")
async def scrape_website(
    url: str = Query(...),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Scrape a website and ingest its content into the knowledge base."""
    from app.knowledge.scraper import scraper
    
    # Simple URL validation
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Invalid URL. Must start with http or https")

    # Log the action in DB
    doc = KnowledgeDocument(
        tenant_id=current_tenant.id,
        filename=f"Scraped: {url}",
        file_type="web",
        file_size=0,
        status="processing",
    )
    db.add(doc)
    await db.flush()
    
    try:
        result = await scraper.scrape_and_ingest(str(current_tenant.id), url)
        
        if result["status"] == "success":
            doc.status = "completed"
            doc.chunk_count = result["chunks"]
            await db.commit()
            return result
        else:
            doc.status = "failed"
            await db.commit()
            raise HTTPException(status_code=500, detail=result["message"])
            
    except Exception as e:
        doc.status = "failed"
        await db.commit()
        raise HTTPException(status_code=500, detail=str(e))


# ─── Manual Knowledge ──────────────────────────────────────────────

from pydantic import BaseModel
class ManualKnowledgeCreate(BaseModel):
    question: str
    answer: str
    media_url: Optional[str] = None

@router.get("/manual")
async def list_manual_knowledge(current_tenant: Tenant = Depends(get_current_tenant), db: AsyncSession = Depends(get_db)):
    from app.models import ManualKnowledge
    result = await db.execute(select(ManualKnowledge).where(ManualKnowledge.tenant_id == current_tenant.id, ManualKnowledge.is_active == True))
    return {"manual": [{"id": str(k.id), "question": k.question, "answer": k.answer, "media_url": k.media_url, "created_at": k.created_at.isoformat()} for k in result.scalars().all()]}

@router.post("/manual")
async def create_manual_knowledge(data: ManualKnowledgeCreate, current_tenant: Tenant = Depends(get_current_tenant), db: AsyncSession = Depends(get_db)):
    from app.models import ManualKnowledge
    from app.knowledge.uploader import ingest_manual_entry
    
    new_kb = ManualKnowledge(tenant_id=current_tenant.id, question=data.question, answer=data.answer, media_url=data.media_url)
    db.add(new_kb)
    await db.commit()
    await db.refresh(new_kb)
    
    # Index in Pinecone
    try:
        combined_text = f"Q: {data.question}\nA: {data.answer}"
        await ingest_manual_entry(
            tenant_id=str(current_tenant.id),
            text=combined_text,
            source="Training Hub (Manual Entry)",
            entry_id=str(new_kb.id)
        )
    except Exception as e:
        logger.warning("pinecone_manual_sync_failed", error=str(e))
    
    return {"status": "success", "id": str(new_kb.id)}

@router.delete("/manual/{item_id}")
async def delete_manual_knowledge(item_id: UUID, current_tenant: Tenant = Depends(get_current_tenant), db: AsyncSession = Depends(get_db)):
    from app.models import ManualKnowledge
    result = await db.execute(select(ManualKnowledge).where(ManualKnowledge.id == item_id, ManualKnowledge.tenant_id == current_tenant.id))
    doc = result.scalar_one_or_none()
    if doc:
        # Delete from Pinecone
        try:
            from app.knowledge.rag import get_pinecone_index
            index = get_pinecone_index()
            index.delete(ids=[f"manual_{item_id}"], namespace=str(current_tenant.id))
        except Exception as e:
            logger.warning("pinecone_delete_failed", error=str(e))
            
        await db.delete(doc)
        await db.commit()
    return {"status": "deleted"}

# ─── Objection Handling Management ──────────────────────────────────

class ObjectionCreate(BaseModel):
    objection: str
    rebuttal: str

@router.get("/objections")
async def list_objections(current_tenant: Tenant = Depends(get_current_tenant), db: AsyncSession = Depends(get_db)):
    from app.models import ManualKnowledge
    result = await db.execute(select(ManualKnowledge).where(ManualKnowledge.tenant_id == current_tenant.id, ManualKnowledge.question.like("OBJECTION:%")))
    return {"objections": [{"id": str(k.id), "term": k.question.replace("OBJECTION:", ""), "response": k.answer} for k in result.scalars().all()]}

@router.post("/objections")
async def create_objection(data: ObjectionCreate, current_tenant: Tenant = Depends(get_current_tenant), db: AsyncSession = Depends(get_db)):
    from app.models import ManualKnowledge
    from app.knowledge.uploader import ingest_manual_entry
    
    new_kb = ManualKnowledge(tenant_id=current_tenant.id, question=f"OBJECTION:{data.objection}", answer=data.rebuttal)
    db.add(new_kb)
    await db.commit()
    await db.refresh(new_kb)
    
    # Index in Pinecone
    try:
        combined_text = f"OBJECTION: {data.objection}\nHANDLING: {data.rebuttal}"
        await ingest_manual_entry(
            tenant_id=str(current_tenant.id),
            text=combined_text,
            source="Sales Objection Plate",
            entry_id=str(new_kb.id)
        )
    except Exception as e:
        logger.warning("pinecone_objection_sync_failed", error=str(e))
        
    return {"status": "success", "id": str(new_kb.id)}

# ─── AI Simulator (Testing Laboratory) ─────────────────────────────

class SimulationRequest(BaseModel):
    user_query: str
    agent_id: Optional[UUID] = None

@router.post("/simulate")
async def simulate_ai_response(data: SimulationRequest, current_tenant: Tenant = Depends(get_current_tenant), db: AsyncSession = Depends(get_db)):
    """Test how the AI would respond given the current knowledge base."""
    from app.agents.claude_agent import agent
    
    # Use the existing agent logic but with a 'simulation' flag if needed
    response = await agent.generate_response(
        tenant_id=str(current_tenant.id),
        contact_id="sim_user_123",
        user_message=data.user_query,
        message_type="text",
        business_name="Simulation Test"
    )
    
    return {
        "status": "success",
        "response": response.reply_text,
        "sources_used": ["Manual Knowledge", "Frequent Questions"] # In real RAG, return actual docs
    }

@router.delete("/{document_id}")
async def delete_document(
    document_id: UUID,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Delete a knowledge base document and its vectors."""
    result = await db.execute(
        select(KnowledgeDocument).where(
            and_(KnowledgeDocument.id == document_id, KnowledgeDocument.tenant_id == current_tenant.id)
        )
    )
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove vectors from Pinecone
    try:
        from app.knowledge.rag import get_pinecone_index
        index = get_pinecone_index()
        # Delete vectors by ID prefix
        vector_ids = [f"{document_id}_{i}" for i in range(doc.chunk_count)]
        if vector_ids:
            index.delete(ids=vector_ids, namespace=str(current_tenant.id))
    except Exception as e:
        logger.warning("vector_delete_warning", error=str(e), document_id=str(document_id))

    await db.delete(doc)
    await db.commit()

    logger.info("document_deleted", tenant=str(current_tenant.id), document_id=str(document_id))

    return {"status": "deleted", "id": str(document_id)}
