"""
InstaTG Agent — Knowledge Base Uploader

Ingests documents (PDF, TXT, DOCX) into Pinecone vectors.
Chunks text, generates embeddings, and stores per-tenant namespace.
"""

import uuid
import structlog
from typing import Optional

import PyPDF2
import docx
import io

from app.config import settings
from app.llms.provider import get_embedding
from app.knowledge.rag import upsert_vectors

logger = structlog.get_logger(__name__)

# Chunking parameters
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """
    Split text into overlapping chunks for embedding.
    
    Args:
        text: Full document text
        chunk_size: Maximum characters per chunk
        overlap: Number of overlapping characters between chunks
    
    Returns:
        List of text chunks
    """
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size

        # Try to break at sentence boundary
        if end < len(text):
            last_period = text.rfind(".", start, end)
            last_newline = text.rfind("\n", start, end)
            break_point = max(last_period, last_newline)
            if break_point > start + chunk_size // 2:
                end = break_point + 1

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - overlap

    return chunks


def extract_text_from_pdf(file_data: bytes) -> str:
    """Extract text from a PDF file."""
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_data))
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        return "\n\n".join(text_parts)
    except Exception as e:
        logger.error("pdf_extraction_error", error=str(e))
        raise ValueError(f"Failed to extract text from PDF: {e}")


def extract_text_from_docx(file_data: bytes) -> str:
    """Extract text from a DOCX file."""
    try:
        doc = docx.Document(io.BytesIO(file_data))
        text_parts = []
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_parts.append(paragraph.text)
        return "\n\n".join(text_parts)
    except Exception as e:
        logger.error("docx_extraction_error", error=str(e))
        raise ValueError(f"Failed to extract text from DOCX: {e}")


def extract_text_from_txt(file_data: bytes) -> str:
    """Extract text from a plain text file."""
    try:
        for encoding in ["utf-8", "utf-16", "latin-1", "cp1251"]:
            try:
                return file_data.decode(encoding)
            except (UnicodeDecodeError, LookupError):
                continue
        return file_data.decode("utf-8", errors="replace")
    except Exception as e:
        logger.error("txt_extraction_error", error=str(e))
        raise ValueError(f"Failed to read text file: {e}")


def extract_text(file_data: bytes, filename: str) -> str:
    """
    Extract text from a file based on its extension.
    
    Supported: PDF, DOCX, TXT, MD, CSV
    """
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    extractors = {
        "pdf": extract_text_from_pdf,
        "docx": extract_text_from_docx,
        "doc": extract_text_from_docx,
        "txt": extract_text_from_txt,
        "md": extract_text_from_txt,
        "csv": extract_text_from_txt,
        "json": extract_text_from_txt,
    }

    extractor = extractors.get(ext)
    if not extractor:
        raise ValueError(f"Unsupported file type: .{ext}. Supported: {', '.join(extractors.keys())}")

    return extractor(file_data)


async def ingest_document(
    tenant_id: str,
    file_data: bytes,
    filename: str,
    document_id: Optional[str] = None,
) -> dict:
    """
    Full ingestion pipeline: extract text → chunk → embed → store in Pinecone.
    
    Args:
        tenant_id: Business tenant identifier
        file_data: Raw file bytes
        filename: Original filename (for format detection)
        document_id: Optional document ID for tracking
    
    Returns:
        Dict with ingestion results (chunk_count, document_id)
    """
    doc_id = document_id or str(uuid.uuid4())

    try:
        # 1. Extract text
        logger.info("ingestion_started", tenant=tenant_id, filename=filename)
        text = extract_text(file_data, filename)

        if not text.strip():
            raise ValueError("No text content found in document")

        # 2. Chunk text
        chunks = chunk_text(text)
        logger.info("text_chunked", tenant=tenant_id, chunk_count=len(chunks))

        # 3. Generate embeddings and prepare vectors
        vectors = []
        for i, chunk in enumerate(chunks):
            embedding = await get_embedding(chunk)
            vectors.append({
                "id": f"{doc_id}_{i}",
                "values": embedding,
                "metadata": {
                    "text": chunk,
                    "source": filename,
                    "document_id": doc_id,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "tenant_id": str(tenant_id),
                },
            })

        # 4. Upsert to Pinecone
        upserted = await upsert_vectors(tenant_id, vectors)

        logger.info(
            "ingestion_completed",
            tenant=tenant_id,
            filename=filename,
            chunks=len(chunks),
            vectors_stored=upserted,
        )

        return {
            "document_id": doc_id,
            "filename": filename,
            "chunk_count": len(chunks),
            "text_length": len(text),
            "status": "completed",
        }

    except ValueError as e:
        logger.error("ingestion_validation_error", error=str(e), filename=filename)
        raise
    except Exception as e:
        logger.error("ingestion_error", error=str(e), tenant=tenant_id, filename=filename)
        raise
