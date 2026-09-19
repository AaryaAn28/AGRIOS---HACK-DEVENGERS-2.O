import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Callable, List
import asyncio

class DomainEvent:
    def __init__(
        self,
        event_type: str,
        actor_id: Optional[str] = None,
        actor_role: Optional[str] = None,
        entity_name: Optional[str] = None,
        entity_id: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None
    ):
        self.event_id = str(uuid.uuid4())
        self.event_type = event_type
        self.actor_id = actor_id
        self.actor_role = actor_role
        self.entity_name = entity_name
        self.entity_id = entity_id
        self.payload = payload or {}
        self.correlation_id = correlation_id or str(uuid.uuid4())
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "actor_id": self.actor_id,
            "actor_role": self.actor_role,
            "entity_name": self.entity_name,
            "entity_id": self.entity_id,
            "payload": self.payload,
            "correlation_id": self.correlation_id,
            "timestamp": self.timestamp
        }

class EventBus:
    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}
        self._global_subscribers: List[Callable] = []

    def subscribe(self, event_type: str, handler: Callable):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(handler)

    def subscribe_all(self, handler: Callable):
        self._global_subscribers.append(handler)

    async def emit(self, event: DomainEvent):
        # 1. Dispatch to global subscribers (e.g. WebSocket broadcaster & Audit logger)
        for handler in self._global_subscribers:
            try:
                res = handler(event)
                if asyncio.iscoroutine(res):
                    await res
            except Exception as e:
                print(f"[EventBus] Global subscriber error: {e}")

        # 2. Dispatch to specific event subscribers
        if event.event_type in self._subscribers:
            for handler in self._subscribers[event.event_type]:
                try:
                    res = handler(event)
                    if asyncio.iscoroutine(res):
                        await res
                except Exception as e:
                    print(f"[EventBus] Error in subscriber for {event.event_type}: {e}")

# Global singleton event bus
event_bus = EventBus()
