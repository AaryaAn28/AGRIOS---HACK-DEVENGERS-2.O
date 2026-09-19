from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.crop import Crop, CropHealthLog
from app.models.user import User
from app.schemas.agrios_schemas import CropCreateRequest, HealthLogCreateRequest
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/crops", tags=["Crops & Health Tracking"])

@router.get("")
def list_crops(farm_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Crop)
    if farm_id:
        query = query.filter(Crop.farm_id == farm_id)
    return [c.to_dict() for c in query.all()]

@router.get("/{crop_id}")
def get_crop(crop_id: str, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    data = crop.to_dict()
    data["health_logs"] = [log.to_dict() for log in crop.health_logs]
    return data

@router.post("/health-scan")
def scan_crop_photo(request: HealthLogCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """AI Crop Photo Scanner endpoint. Simulates edge vision model diagnostic with explainable remediation."""
    log = CropHealthLog(
        crop_id=request.crop_id,
        farm_id=request.farm_id,
        recorded_by_id=current_user.id,
        disease_detected=request.disease_detected or "Early Foliar Rust Detected",
        pest_risk=request.pest_risk or "Moderate",
        severity=request.severity if request.severity is not None else 0.35,
        diagnosis_notes=request.diagnosis_notes or "Hyperspectral pattern matches Puccinia striiformis (Yellow Rust) in early stage on upper leaf surface.",
        remedy_recommended=request.remedy_recommended or "Apply Mancozeb 75% WP @ 2g/liter of water or Nativo 75 WG @ 0.6g/L within 48 hours. Ensure uniform droplet size.",
        image_url=request.image_url or "assets/scans/sample_wheat_rust.jpg"
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log.to_dict()
