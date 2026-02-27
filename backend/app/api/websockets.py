from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        # tenant_id -> list of active websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, tenant_id: str):
        await websocket.accept()
        if tenant_id not in self.active_connections:
            self.active_connections[tenant_id] = []
        self.active_connections[tenant_id].append(websocket)
        logger.info(f"WebSocket connected for tenant {tenant_id}")

    def disconnect(self, websocket: WebSocket, tenant_id: str):
        if tenant_id in self.active_connections:
            try:
                self.active_connections[tenant_id].remove(websocket)
                if not self.active_connections[tenant_id]:
                    del self.active_connections[tenant_id]
                logger.info(f"WebSocket disconnected for tenant {tenant_id}")
            except ValueError:
                pass

    async def broadcast_to_tenant(self, tenant_id: str, message: dict):
        if tenant_id in self.active_connections:
            for connection in self.active_connections[tenant_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to {tenant_id}: {e}")
                    self.disconnect(connection, tenant_id)

manager = ConnectionManager()

@router.websocket("/ws/{tenant_id}")
async def websocket_endpoint(websocket: WebSocket, tenant_id: str):
    await manager.connect(websocket, tenant_id)
    try:
        while True:
            # Just keep connection alive and listen for client pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, tenant_id)
