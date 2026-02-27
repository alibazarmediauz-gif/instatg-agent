import httpx
import structlog
from bs4 import BeautifulSoup
from typing import List, Dict
from app.knowledge.rag import get_pinecone_index
from app.knowledge.uploader import ingest_document

logger = structlog.get_logger(__name__)

class WebScraper:
    """
    Automated scraper to ingest website content into the tenant's knowledge base.
    Optimized for parsing business pages, FAQs, and service descriptions.
    """
    
    async def scrape_and_ingest(self, tenant_id: str, url: str) -> Dict[str, any]:
        logger.info("web_scrape_starting", tenant=tenant_id, url=url)
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, follow_redirects=True)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Remove script and style elements
                for script_or_style in soup(["script", "style", "nav", "footer"]):
                    script_or_style.decompose()

                # Extract meaningful text
                text_content = soup.get_text(separator='\n')
                # Clean up whitespace
                lines = (line.strip() for line in text_content.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text = '\n'.join(chunk for chunk in chunks if chunk)

                # Ingest as a virtual document
                result = await ingest_document(
                    tenant_id=tenant_id,
                    file_data=text.encode('utf-8'),
                    filename=f"scraped_{url.replace('://', '_').replace('/', '_')}.txt",
                    document_id=f"ws_{tenant_id}_{hash(url)}"
                )
                
                logger.info("web_scrape_completed", tenant=tenant_id, url=url, chunks=result.get("chunk_count"))
                return {
                    "status": "success",
                    "url": url,
                    "chunks": result.get("chunk_count")
                }
                
        except Exception as e:
            logger.error("web_scrape_error", error=str(e), url=url)
            return {"status": "error", "message": str(e)}

scraper = WebScraper()
