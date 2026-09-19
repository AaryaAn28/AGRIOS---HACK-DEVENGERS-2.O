from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.database import Base

class WorkerProfile(Base):
    """Dynamic Workforce Engine (Guardrail 13).
    Tracks workload-based availability (tasks, hours, rest rules) and explicit statuses:
    AVAILABLE, WORKING, REST_RECOMMENDED, SCHEDULED_OFF, ON_LEAVE, UNAVAILABLE.
    """
    __tablename__ = "worker_profiles"

    id = Column(String(64), primary_key=True, default=lambda: f"wp_{uuid.uuid4().hex[:8]}")
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, unique=True)
    status = Column(String(32), default="AVAILABLE") # AVAILABLE, WORKING, REST_RECOMMENDED, SCHEDULED_OFF, ON_LEAVE, UNAVAILABLE
    active_tasks_count = Column(Integer, default=1)
    hours_worked_this_week = Column(Float, default=24.5)
    consecutive_work_days = Column(Integer, default=3)
    rest_recommended = Column(Boolean, default=False)
    is_off_today = Column(Boolean, default=False)
    current_gps_lat = Column(Float, default=30.8924)
    current_gps_lon = Column(Float, default=75.8341)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else "Worker",
            "status": self.status,
            "active_tasks_count": self.active_tasks_count,
            "hours_worked_this_week": self.hours_worked_this_week,
            "consecutive_work_days": self.consecutive_work_days,
            "rest_recommended": self.rest_recommended,
            "is_off_today": self.is_off_today,
            "current_gps": {"lat": self.current_gps_lat, "lon": self.current_gps_lon},
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class LeaveRequest(Base):
    """Worker Leave Management.
    Approved leave triggers task delay/reassignment and sets worker status to ON_LEAVE / OFF TODAY.
    """
    __tablename__ = "leave_requests"

    id = Column(String(64), primary_key=True, default=lambda: f"leave_{uuid.uuid4().hex[:8]}")
    worker_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(32), default="pending") # pending, approved, rejected
    approved_by_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    reassignment_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    worker = relationship("User", foreign_keys=[worker_id])
    approver = relationship("User", foreign_keys=[approved_by_id])

    def to_dict(self):
        return {
            "id": self.id,
            "worker_id": self.worker_id,
            "worker_name": self.worker.full_name if self.worker else "Worker",
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "reason": self.reason,
            "status": self.status,
            "approved_by_id": self.approved_by_id,
            "reassignment_notes": self.reassignment_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
