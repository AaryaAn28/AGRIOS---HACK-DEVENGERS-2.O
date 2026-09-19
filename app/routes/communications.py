from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.communication import AdvisoryMessage
from app.models.user import User
from app.schemas.agrios_schemas import MessageSendRequest
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/communications", tags=["Communications & Advisories"])

@router.get("")
def list_messages(farm_id: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(AdvisoryMessage)
    if farm_id:
        query = query.filter(AdvisoryMessage.farm_id == farm_id)
    return [m.to_dict() for m in query.order_by(AdvisoryMessage.created_at.desc()).all()]

@router.post("")
def send_message(
    request: MessageSendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = AdvisoryMessage(
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        sender_role=current_user.role,
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
