"""
InstaTG Agent — Pinecone RAG Search

Vector search for tenant knowledge bases using Pinecone.
Embeds queries with OpenAI text-embedding-3-small.
"""

import structlog
from typing import Optional

from pinecone import Pinecone
from app.llms.provider import get_embedding

from app.config import settings

logger = structlog.get_logger(__name__)

_pinecone_client: Optional[Pinecone] = None
_pinecone_index = None


def get_pinecone_index():
    """Get or create Pinecone index connection."""
    global _pinecone_client, _pinecone_index

    if _pinecone_index is None:
        _pinecone_client = Pinecone(api_key=settings.pinecone_api_key)
        _pinecone_index = _pinecone_client.Index(settings.pinecone_index_name)
        logger.info("pinecone_connected", index=settings.pinecone_index_name)

    return _pinecone_index


async def get_embedding(text: str) -> list[float]:
    """Generate embedding for text using OpenAI."""
    client = openai.AsyncOpenAI(api_key=settings.openai_api_key)

    response = await client.embeddings.create(
        model=settings.embedding_model,
        input=text,
    )

    return response.data[0].embedding


async def rag_search(
    tenant_id: str,
    query: str,
    top_k: int = 5,
    score_threshold: float = 0.3,
) -> list[dict]:
    """
    Search tenant knowledge base for relevant content.
    
    Args:
        tenant_id: Business tenant identifier (used as Pinecone namespace)
        query: User question or message
        top_k: Number of results to return
        score_threshold: Minimum similarity score
    
    Returns:
        List of dicts with 'text', 'score', and 'metadata' keys
    """
    try:
        # Generate query embedding
        query_embedding = await get_embedding(query)

        # Search Pinecone with tenant namespace
        index = get_pinecone_index()
        results = index.query(
            vector=query_embedding,
            top_k=top_k,
            namespace=str(tenant_id),
            include_metadata=True,
        )

        # Filter by score threshold and format results
        matches = []
        for match in results.get("matches", []):
            if match["score"] >= score_threshold:
                matches.append({
                    "text": match["metadata"].get("text", ""),
                    "score": match["score"],
                    "source": match["metadata"].get("source", "unknown"),
                    "chunk_index": match["metadata"].get("chunk_index", 0),
                    "metadata": match["metadata"],
                })

        logger.info(
            "rag_search_completed",
            tenant=tenant_id,
            query_length=len(query),
            results_count=len(matches),
            top_score=matches[0]["score"] if matches else 0,
        )

        return matches

    except Exception as e:
        logger.error("rag_search_error", error=str(e), tenant=tenant_id)
        return []


async def upsert_vectors(
    tenant_id: str,
    vectors: list[dict],
) -> int:
    """
    Upsert vectors into Pinecone for a tenant.
    
    Args:
        tenant_id: Tenant namespace
        vectors: List of dicts with 'id', 'values', 'metadata'
    
    Returns:
        Number of vectors upserted
    """
    try:
        index = get_pinecone_index()

        # Batch upsert (Pinecone recommends batches of 100)
        batch_size = 100
        total_upserted = 0

        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            pinecone_vectors = [
                {
                    "id": v["id"],
                    "values": v["values"],
                    "metadata": v["metadata"],
                }
                for v in batch
            ]
            index.upsert(vectors=pinecone_vectors, namespace=str(tenant_id))
            total_upserted += len(batch)

        logger.info("vectors_upserted", tenant=tenant_id, count=total_upserted)
        return total_upserted

    except Exception as e:
        logger.error("vector_upsert_error", error=str(e), tenant=tenant_id)
        raise


async def delete_tenant_vectors(tenant_id: str) -> None:
    """Delete all vectors for a tenant namespace."""
    try:
        index = get_pinecone_index()
        index.delete(delete_all=True, namespace=str(tenant_id))
        logger.info("tenant_vectors_deleted", tenant=tenant_id)
    except Exception as e:
        logger.error("vector_delete_error", error=str(e), tenant=tenant_id)
        raise
