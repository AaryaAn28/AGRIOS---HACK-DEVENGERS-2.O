import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class FarmTask(Base):
    __tablename__ = "farm_tasks"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=False, index=True)
    field_id = Column(String(64), ForeignKey("fields.id"), nullable=True)
    title = Column(String(160), nullable=False)
    description = Column(Text, nullable=True)
    task_type = Column(String(40), default="irrigation")  # irrigation, fertilizing, spraying, scouting, harvest, maintenance
    priority = Column(String(30), default="medium")  # low, medium, high, critical
    status = Column(String(30), default="pending", index=True)  # pending, in_progress, completed, overdue
    assigned_to_user_id = Column(String(64), nullable=True)
    assigned_role = Column(String(30), default="worker")  # worker, farmer, agronomist
    created_by_role = Column(String(30), default="farmer")
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    checklist_json = Column(Text, default="[]")  # e.g. [{"step": "Check soil moisture", "done": true}]
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    work_logs = relationship("WorkLog", back_populates="task", cascade="all, delete-orphan")

    def to_dict(self):
        try:
            checklist = json.loads(self.checklist_json) if self.checklist_json else []
        except Exception:
            checklist = []
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "field_id": self.field_id,
            "title": self.title,
            "description": self.description,
            "task_type": self.task_type,
            "priority": self.priority,
            "status": self.status,
            "assigned_to_user_id": self.assigned_to_user_id,
            "assigned_role": self.assigned_role,
            "created_by_role": self.created_by_role,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "checklist": checklist,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class WorkLog(Base):
    __tablename__ = "work_logs"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String(64), ForeignKey("farm_tasks.id"), nullable=False, index=True)
    worker_id = Column(String(64), nullable=True)
    hours_logged = Column(Float, default=1.0)
    ground_truth_notes = Column(Text, nullable=True)
    gps_lat = Column(Float, nullable=True)
    gps_lon = Column(Float, nullable=True)
    verification_photo = Column(String(256), nullable=True)
    logged_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    task = relationship("FarmTask", back_populates="work_logs")

    def to_dict(self):
        return {
            "id": self.id,
            "task_id": self.task_id,
            "worker_id": self.worker_id,
            "hours_logged": self.hours_logged,
            "ground_truth_notes": self.ground_truth_notes,
            "gps_lat": self.gps_lat,
            "gps_lon": self.gps_lon,
            "verification_photo": self.verification_photo,
            "logged_at": self.logged_at.isoformat() if self.logged_at else None
        }

# Alias for backwards-compatibility
Task = FarmTask
