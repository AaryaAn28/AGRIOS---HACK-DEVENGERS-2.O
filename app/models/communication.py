import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from app.database import Base

class AdvisoryMessage(Base):
    __tablename__ = "advisory_messages"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    sender_name = Column(String(120), nullable=True)
    sender_role = Column(String(30), nullable=False)  # agronomist, worker, farmer, government
    receiver_id = Column(String(64), ForeignKey("users.id"), nullable=True, index=True)  # null = broadcast to farm/district
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=True, index=True)
    subject = Column(String(160), nullable=False)
    body = Column(Text, nullable=False)
    advisory_type = Column(String(40), default="scientific_guidance")  # scientific_guidance, emergency_warning, task_instruction, general
    priority = Column(String(20), default="normal")  # low, normal, urgent
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "sender_name": self.sender_name,
            "sender_role": self.sender_role,
            "receiver_id": self.receiver_id,
            "farm_id": self.farm_id,
            "subject": self.subject,
            "body": self.body,
            "advisory_type": self.advisory_type,
            "priority": self.priority,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
