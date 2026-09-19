from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.resource import FarmResource, FarmEquipment, EquipmentBooking
from app.models.user import User
from app.schemas.agrios_schemas import ResourceConsumeRequest, EquipmentBookingRequest
from app.services.resource_service import ResourceService
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/resources", tags=["Resources & Equipment"])

@router.get("")
def list_resources(farm_id: Optional[str] = None, db: Session = Depends(get_db)):
    resources = ResourceService.get_resources(db, farm_id=farm_id)
    return [r.to_dict() for r in resources]

@router.post("/consume")
def consume_resource(
    request: ResourceConsumeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        resource = ResourceService.consume_resource(
            db=db,
            resource_id=request.resource_id,
            quantity_used=request.quantity,
            actor_id=current_user.id,
            actor_role=current_user.role,
            notes=request.notes
        )
        return resource.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/equipment")
def list_equipment(farm_id: Optional[str] = None, db: Session = Depends(get_db)):
    equipment = ResourceService.get_equipment(db, farm_id=farm_id)
    return [eq.to_dict() for eq in equipment]

@router.post("/equipment/book")
def book_equipment(
    request: EquipmentBookingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        start_dt = datetime.fromisoformat(request.start_time)
        end_dt = datetime.fromisoformat(request.end_time)
        booking = ResourceService.book_equipment(
            db=db,
            equipment_id=request.equipment_id,
            farm_id=request.farm_id,
            booked_by_id=current_user.id,
            purpose=request.purpose,
            start_time=start_dt,
            end_time=end_dt
        )
        return booking.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
