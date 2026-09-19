from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket_manager import ws_manager

router = APIRouter(tags=["Realtime WebSockets"])

@router.websocket("/ws/live-feed")
async def live_feed(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial welcome handshake
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "message": "AGRIOS Real-Time Event Stream Connected. Subscribed to God Database state pipeline."
        })
        while True:
            # Keep connection alive, listen for ping/client messages
            data = await websocket.receive_text()
            # Echo heartbeat or client commands
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
