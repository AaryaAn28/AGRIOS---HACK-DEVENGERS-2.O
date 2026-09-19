from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.farm import Farm, Field
from app.models.user import User
from app.schemas.agrios_schemas import FarmCreateRequest, FieldCreateRequest
from app.services.farm_service import FarmService
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/farms", tags=["Farms & Fields"])

@router.get("")
def list_farms(district: Optional[str] = None, db: Session = Depends(get_db)):
    farms = FarmService.get_farms(db, district)
    return [f.to_dict() for f in farms]

@router.get("/{farm_id}")
def get_farm(farm_id: str, db: Session = Depends(get_db)):
    farm = FarmService.get_farm_by_id(db, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    data = farm.to_dict()
    data["fields"] = [fld.to_dict() for fld in farm.fields]
    return data

@router.get("/{farm_id}/fields")
def list_fields(farm_id: str, db: Session = Depends(get_db)):
    fields = FarmService.get_fields_for_farm(db, farm_id)
    return [fld.to_dict() for fld in fields]

@router.post("")
def create_farm(request: FarmCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = Farm(
        name=request.name,
        owner_id=current_user.id,
        village=request.village,
        district=request.district,
        state=request.state,
        latitude=request.latitude,
        longitude=request.longitude,
        total_area_acres=request.total_area_acres,
        soil_type=request.soil_type,
        irrigation_source=request.irrigation_source
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm.to_dict()
