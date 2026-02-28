"""
InstaTG Agent — Automation Engine
Traverses and executes React Flow JSON graphs mapped to Automations.
"""

import asyncio
import structlog
from typing import Dict, Any, List
from sqlalchemy import select
from app.database import async_session_factory
from app.models import Automation

logger = structlog.get_logger(__name__)

async def process_automation_flow(tenant_id: str, message_text: str, platform: str, user_id: str, send_message_func) -> bool:
    """
    Checks if the incoming message triggers any active automation flow.
    If yes, executes the flow and returns True. If not, returns False.
    
    `send_message_func` should be an async callback: `async def func(text: str) -> None`
    """
    async with async_session_factory() as db:
        result = await db.execute(
            select(Automation)
            .where(Automation.tenant_id == tenant_id, Automation.is_active == True)
        )
        automations = result.scalars().all()
        
    for auto in automations:
        # Check trigger keyword exactly or loosely
        if auto.trigger_type == "keyword" and auto.trigger_keyword:
            if auto.trigger_keyword.lower() in message_text.lower():
                # We found a matching automation
                logger.info("automation_triggered", automation_id=str(auto.id), name=auto.name)
                
                # Execute asynchronously so we don't block the webhook
                asyncio.create_task(execute_flow(auto.flow_data, send_message_func))
                return True
                
    return False

async def execute_flow(flow_data: Dict[str, Any], send_message_func):
    """
    Traverses the React Flow node/edge graph from the trigger node and executes each block.
    """
    if not flow_data or "nodes" not in flow_data or "edges" not in flow_data:
        logger.warning("automation_flow_invalid", error="Missing nodes/edges in JSON")
        return

    nodes: List[Dict] = flow_data["nodes"]
    edges: List[Dict] = flow_data["edges"]
    
    # Map nodes by ID for quick O(1) lookup
    node_map = {n["id"]: n for n in nodes}
    
    # Map edges by source node: source_id -> [target_id1, target_id2]
    # For a linear sequence, there will just be one target.
    edge_map = {}
    for e in edges:
        src = e["source"]
        tgt = e["target"]
        if src not in edge_map:
            edge_map[src] = []
        edge_map[src].append(tgt)
        
    # 1. Find the Trigger Node (type: 'trigger')
    trigger_node = next((n for n in nodes if n.get("type") == "trigger"), None)
    if not trigger_node:
        logger.warning("automation_flow_invalid", error="No trigger node found")
        return
        
    # 2. Traverse Graph
    current_node_id = trigger_node["id"]
    
    # Use a set to prevent infinite loops from cyclic edges 
    visited = set()
    
    while current_node_id:
        if current_node_id in visited:
            logger.warning("automation_circular_dependency", node_id=current_node_id)
            break
            
        visited.add(current_node_id)
        node = node_map.get(current_node_id)
        if not node:
            break
            
        node_type = node.get("type")
        node_data = node.get("data", {})
        
        # Execute Action based on node type
        try:
            if node_type == "message":
                text = node_data.get("text", "")
                if text:
                    await send_message_func(text)
                    
            elif node_type == "delay":
                amount = int(node_data.get("amount", 1))
                unit = node_data.get("unit", "minutes")
                
                seconds = amount * 60 if unit == "minutes" else amount * 3600
                logger.info("automation_delay", seconds=seconds, node_id=current_node_id)
                await asyncio.sleep(seconds)
                
            elif node_type == "aiStep":
                # Fallback to AI agent dynamically.
                # In robust versions, this injects specific system context to Claude.
                prompt_text = node_data.get("prompt", "")
                logger.info("automation_ai_handoff", prompt=prompt_text)
                await send_message_func(f"(AI is taking over with context: {prompt_text})")
        except Exception as e:
            logger.error("automation_node_execution_error", node_id=current_node_id, error=str(e))
            
        # Move to next node
        next_nodes = edge_map.get(current_node_id, [])
        if not next_nodes:
             break # End of flow
             
        # For simplicity, we just take the first target path. 
        # Future enhancements would evaluate conditional edges.
        current_node_id = next_nodes[0]
        
    logger.info("automation_flow_completed")
