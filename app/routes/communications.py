from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.communication import AdvisoryMessage
from app.models.user import User
from app.schemas.agrios_schemas import MessageSendRequest
from app.utils.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/api/communications", tags=["Communications & Advisories"])

@router.get("")
def list_messages(farm_id: Optional[str] = None, current_user: Optional[User] = Depends(get_optional_user), db: Session = Depends(get_db)):
    query = db.query(AdvisoryMessage)
    if farm_id:
        query = query.filter(AdvisoryMessage.farm_id == farm_id)
    return [m.to_dict() for m in query.order_by(AdvisoryMessage.created_at.desc()).all()]

@router.post("")
def send_message(
    request: MessageSendRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    sender = current_user or db.query(User).filter(User.role == "agronomist").first()
    msg = AdvisoryMessage(
        sender_id=sender.id if sender else "system",
        sender_name=sender.full_name if sender else "AGRIOS Agronomist",
        sender_role=sender.role if sender else "agronomist",
        receiver_id=request.receiver_id,
        farm_id=request.farm_id,
        subject=request.subject,
        body=request.body,
        advisory_type=request.advisory_type or "scientific_guidance",
        priority=request.priority or "normal"
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg.to_dict()

@router.put("/{message_id}/read")
def mark_message_read(message_id: str, db: Session = Depends(get_db)):
    msg = db.query(AdvisoryMessage).filter(AdvisoryMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.is_read = True
    db.commit()
    db.refresh(msg)
    return msg.to_dict()

@router.post("/mark-all-read")
def mark_all_read(farm_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AdvisoryMessage)
    if farm_id:
        query = query.filter(AdvisoryMessage.farm_id == farm_id)
    query.update({AdvisoryMessage.is_read: True}, synchronize_session=False)
    db.commit()
    return {"status": "success", "message": "All notifications marked as read"}
