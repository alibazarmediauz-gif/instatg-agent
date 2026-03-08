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
    """
    async with async_session_factory() as db:
        result = await db.execute(
            select(Automation)
            .where(Automation.tenant_id == tenant_id, Automation.is_active == True)
        )
        automations = result.scalars().all()
        
    for auto in automations:
        triggered = False
        if auto.trigger_type == "keyword" and auto.trigger_keyword:
            if auto.trigger_keyword.lower() in message_text.lower():
                triggered = True
        elif auto.trigger_type == "platform" and auto.trigger_keyword == platform:
            triggered = True
            
        if triggered:
            logger.info("automation_triggered", automation_id=str(auto.id), name=auto.name)
            # Execute synchronously to ensure we can return True correctly, 
            # but nodes like 'delay' will still pause correctly within the task.
            asyncio.create_task(execute_flow(
                flow_data=auto.flow_data, 
                tenant_id=tenant_id,
                user_id=user_id,
                message_text=message_text,
                send_message_func=send_message_func
            ))
            return True
                
    return False

async def execute_flow(flow_data: Dict[str, Any], tenant_id: str, user_id: str, message_text: str, send_message_func):
    """
    Traverses and executes visual automation blocks.
    Context is carried through the flow for data extraction and CRM updates.
    """
    if not flow_data or "nodes" not in flow_data or "edges" not in flow_data:
        return

    nodes = flow_data["nodes"]
    edges = flow_data["edges"]
    node_map = {n["id"]: n for n in nodes}
    edge_map = {}
    for e in edges:
        src = e["source"]
        if src not in edge_map: edge_map[src] = []
        edge_map[src].append(e)

    trigger_node = next((n for n in nodes if n.get("type") == "trigger"), None)
    if not trigger_node: return
        
    current_node_id = trigger_node["id"]
    visited = set()
    
    # State context to share between nodes
    context = {"message": message_text, "extracted": {}}
    
    while current_node_id:
        if current_node_id in visited: break
        visited.add(current_node_id)
        
        node = node_map.get(current_node_id)
        if not node: break
        
        node_type = node.get("type")
        node_data = node.get("data", {})
        
        try:
            if node_type == "message":
                text = node_data.get("text", "")
                # Simple variable replacement
                for k, v in context["extracted"].items():
                    text = text.replace(f"{{{{{k}}}}}", str(v))
                if text: await send_message_func(text)
                    
            elif node_type == "delay":
                amount = int(node_data.get("amount", 1))
                unit = node_data.get("unit", "minutes")
                await asyncio.sleep(amount * 60 if unit == "minutes" else amount)
                
            elif node_type == "crmUpdate":
                field = node_data.get("field", "status")
                value = node_data.get("value", "Qualified")
                from app.crm.amocrm import get_crm_client
                async with async_session_factory() as db:
                    crm = await get_crm_client(tenant_id, db)
                    if crm:
                        # Find the lead ID for this user
                        from app.models import Lead
                        lead_res = await db.execute(select(Lead).where(Lead.tenant_id == tenant_id, Lead.phone == user_id))
                        lead = lead_res.scalar_one_or_none()
                        if lead:
                            if field == "status":
                                await crm.move_lead_to_stage(lead.id, value.lower())
                            else:
                                await crm.add_note(lead.id, f"Field Update: {field} -> {value}")
            
            elif node_type == "extractData":
                keys = node_data.get("keys", "phone, name")
                from app.agents.claude_agent import agent
                # AI-powered extraction
                extracted = await agent.extract_json(message_text, keys)
                context["extracted"].update(extracted)
                logger.info("data_extracted", data=extracted)

            elif node_type == "aiStep":
                prompt = node_data.get("prompt", "")
                from app.agents.claude_agent import agent
                resp = await agent.generate_response(tenant_id, user_id, message_text, custom_persona=prompt)
                if resp.reply_text: await send_message_func(resp.reply_text)

        except Exception as e:
            logger.error("node_exec_error", node_id=current_node_id, error=str(e))
            
        # Decision logic for branching
        next_edges = edge_map.get(current_node_id, [])
        if not next_edges: break
        
        # Default to first path unless it's a condition node
        next_node_id = next_edges[0]["target"]
        
        if node_type == "condition":
            # Very basic condition parsing
            condition_val = node_data.get("value", "").lower()
            matching_edge = next((e for e in next_edges if e.get("label", "").lower() == condition_val), None)
            if matching_edge:
                next_node_id = matching_edge["target"]
            elif "else" in [e.get("label", "").lower() for e in next_edges]:
                next_node_id = next((e for e in next_edges if e.get("label", "").lower() == "else"))["target"]

        current_node_id = next_node_id
        
    logger.info("automation_flow_completed", tenant=tenant_id, user=user_id)
