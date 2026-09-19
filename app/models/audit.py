import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text
from app.database import Base

class DomainEventLog(Base):
    __tablename__ = "domain_event_logs"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String(80), nullable=False, index=True)
    actor_id = Column(String(64), nullable=True, index=True)
    actor_role = Column(String(40), nullable=True)
    entity_name = Column(String(80), nullable=True, index=True)
    entity_id = Column(String(64), nullable=True, index=True)
    payload_json = Column(Text, nullable=True)
    correlation_id = Column(String(64), nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "event_type": self.event_type,
            "actor_id": self.actor_id,
            "actor_role": self.actor_role,
            "entity_name": self.entity_name,
            "entity_id": self.entity_id,
            "correlation_id": self.correlation_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
