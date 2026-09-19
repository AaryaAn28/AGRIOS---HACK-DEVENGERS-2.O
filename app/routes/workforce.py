from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.workforce import WorkerProfile, LeaveRequest
from app.models.user import User
from app.core.events import EventBus, DomainEvent

router = APIRouter(prefix="/api/workforce", tags=["workforce"])

class StatusUpdate(BaseModel):
    status: str
    rest_recommended: Optional[bool] = None
    is_off_today: Optional[bool] = None

class LeaveCreate(BaseModel):
    worker_id: str
    start_date: datetime
    end_date: datetime
    reason: str

class LeaveApproval(BaseModel):
    approved_by_id: str
    reassignment_notes: Optional[str] = "Pending inspection tasks re-routed to nearest certified Krishi Sakhi"

@router.get("/profiles")
def list_worker_profiles(db: Session = Depends(get_db)):
    profiles = db.query(WorkerProfile).all()
    # If empty, create initial profile for worker users
    if not profiles:
        workers = db.query(User).filter(User.role == "worker").all()
        for w in workers:
            wp = WorkerProfile(
                user_id=w.id,
                status="AVAILABLE",
                active_tasks_count=2,
                hours_worked_this_week=28.0,
                consecutive_work_days=3,
                rest_recommended=False,
                is_off_today=False
            )
            db.add(wp)
        db.commit()
        profiles = db.query(WorkerProfile).all()

    return [p.to_dict() for p in profiles]

@router.get("/profiles/{user_id}")
def get_worker_profile(user_id: str, db: Session = Depends(get_db)):
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == user_id).first()
    if not profile:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        profile = WorkerProfile(user_id=user.id, status="AVAILABLE")
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile.to_dict()

@router.patch("/profiles/{user_id}/status")
def update_worker_status(
    user_id: str,
    data: StatusUpdate,
    db: Session = Depends(get_db)
):
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Worker profile not found")

    profile.status = data.status
    if data.rest_recommended is not None:
        profile.rest_recommended = data.rest_recommended
    if data.is_off_today is not None:
        profile.is_off_today = data.is_off_today

    db.commit()
    db.refresh(profile)

    EventBus.publish(DomainEvent(
        event_type="workforce.status_updated",
        aggregate_type="workforce",
        aggregate_id=user_id,
        payload=profile.to_dict(),
        producer="workforce_engine"
    ))

    return profile.to_dict()

@router.get("/leaves")
def list_leave_requests(db: Session = Depends(get_db)):
    leaves = db.query(LeaveRequest).order_by(LeaveRequest.created_at.desc()).all()
    return [l.to_dict() for l in leaves]

@router.post("/leaves")
def request_leave(
    data: LeaveCreate,
    db: Session = Depends(get_db)
):
    worker = db.query(User).filter(User.id == data.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    leave = LeaveRequest(
        worker_id=data.worker_id,
        start_date=data.start_date,
        end_date=data.end_date,
        reason=data.reason,
        status="pending"
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)

    EventBus.publish(DomainEvent(
        event_type="workforce.leave_requested",
        aggregate_type="leave",
        aggregate_id=leave.id,
        payload=leave.to_dict(),
        producer="worker_portal"
    ))

    return leave.to_dict()

@router.post("/leaves/{leave_id}/approve")
def approve_leave(
    leave_id: str,
    data: LeaveApproval,
    db: Session = Depends(get_db)
):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    leave.status = "approved"
    leave.approved_by_id = data.approved_by_id
    leave.reassignment_notes = data.reassignment_notes

    # Update worker profile to ON_LEAVE
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == leave.worker_id).first()
    if profile:
        profile.status = "ON_LEAVE"
        profile.is_off_today = True

    db.commit()
    db.refresh(leave)

    EventBus.publish(DomainEvent(
        event_type="workforce.leave_approved",
        aggregate_type="leave",
        aggregate_id=leave.id,
        payload={
            **leave.to_dict(),
            "worker_status": "ON_LEAVE",
            "task_reassignment": data.reassignment_notes
        },
        producer="government_command_center"
    ))

    return leave.to_dict()
