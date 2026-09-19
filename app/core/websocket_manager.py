import json
from typing import List, Dict, Any, Optional
from fastapi import WebSocket
from app.core.events import DomainEvent, event_bus

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        closed_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                closed_connections.append(connection)
        for dead in closed_connections:
            self.disconnect(dead)

    async def handle_domain_event(self, event: DomainEvent):
        """Dispatches canonical domain events to connected WebSocket clients."""
        await self.broadcast({
            "type": "DOMAIN_EVENT",
            "data": event.to_dict()
        })

ws_manager = WebSocketManager()

# Hook WebSocketManager into EventBus globally
event_bus.subscribe_all(ws_manager.handle_domain_event)
