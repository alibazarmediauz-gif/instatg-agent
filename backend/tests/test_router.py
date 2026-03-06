import pytest
from app.services.llm_router import generate_response

@pytest.mark.asyncio
async def test_llm_router_routing():
    """Test that the router handles different complexity levels."""
    # Simple message should use a faster model
    simple_resp = await generate_response(
        messages=[{"role": "user", "content": "Hi"}],
        complexity_hint="low"
    )
    assert simple_resp is not None
    
    # Complex message should use reasoning model
    complex_resp = await generate_response(
        messages=[{"role": "user", "content": "Explain quantum physics in detail."}],
        complexity_hint="high"
    )
    assert complex_resp is not None

@pytest.mark.asyncio
async def test_llm_router_fallback():
    """Verify router can handle invalid complexity hints."""
    resp = await generate_response(
        messages=[{"role": "user", "content": "Test"}],
        complexity_hint="invalid"
    )
    assert resp is not None
