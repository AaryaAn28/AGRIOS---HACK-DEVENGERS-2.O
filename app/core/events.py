import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Callable, List
import asyncio

class DomainEvent:
    def __init__(
        self,
        event_type: Optional[str] = None,
        actor_id: Optional[str] = None,
        actor_role: Optional[str] = None,
        entity_name: Optional[str] = None,
        entity_id: Optional[str] = None,
        aggregate_type: Optional[str] = None,
        aggregate_id: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
        causation_id: Optional[str] = None,
        previous_version: int = 1,
        new_version: int = 2,
        producer: Optional[str] = None,
        event_name: Optional[str] = None
    ):
        self.event_id = str(uuid.uuid4())
        self.event_type = event_type or event_name or "domain_event"
        self.actor_id = actor_id or "SYSTEM"
        self.actor_role = actor_role or "system"
        self.producer = producer or self.actor_role
        self.entity_name = entity_name or aggregate_type or "Entity"
        self.entity_id = entity_id or aggregate_id or str(uuid.uuid4())
        self.aggregate_type = aggregate_type or self.entity_name
        self.aggregate_id = aggregate_id or self.entity_id
        self.payload = payload or {}
        self.correlation_id = correlation_id or str(uuid.uuid4())
        self.causation_id = causation_id or self.correlation_id
        self.previous_version = previous_version
        self.new_version = new_version
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "aggregate_type": self.aggregate_type,
            "aggregate_id": self.aggregate_id,
            "actor_id": self.actor_id,
            "actor_role": self.actor_role,
            "producer": self.producer,
            "entity_name": self.entity_name,
            "entity_id": self.entity_id,
            "correlation_id": self.correlation_id,
            "causation_id": self.causation_id,
            "previous_version": self.previous_version,
            "new_version": self.new_version,
            "timestamp": self.timestamp,
            "payload": self.payload
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
                print(f"[EventBus] Error in global subscriber {handler}: {e}")

        # 2. Dispatch to specific event subscribers
        if event.event_type in self._subscribers:
            for handler in self._subscribers[event.event_type]:
                try:
                    res = handler(event)
                    if asyncio.iscoroutine(res):
                        await res
                except Exception as e:
                    print(f"[EventBus] Error in subscriber {handler} for {event.event_type}: {e}")

    @classmethod
    def publish(cls, event: DomainEvent):
        """Synchronous bridge to publish domain event across global event bus."""
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(event_bus.emit(event))
        except RuntimeError:
            try:
                asyncio.run(event_bus.emit(event))
            except Exception:
                pass

# Global singleton event bus
event_bus = EventBus()
