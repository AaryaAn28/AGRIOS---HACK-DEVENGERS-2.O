import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.camera import Camera, CameraObservation
from app.core.events import EventBus, DomainEvent

router = APIRouter(prefix="/api/cameras", tags=["cameras"])

class ObservationCreate(BaseModel):
    farm_id: str
    field_id: Optional[str] = None
    observation_type: str
    confidence: float = 0.85
    details: str
    bounding_box: Optional[dict] = None

@router.get("")
def list_cameras(
    farm_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Camera)
    if farm_id:
        query = query.filter(Camera.farm_id == farm_id)
    cameras = query.all()
    return [c.to_dict() for c in cameras]

@router.get("/{camera_id}")
def get_camera(
    camera_id: str,
    db: Session = Depends(get_db)
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera.to_dict()

@router.get("/{camera_id}/observations")
def list_camera_observations(
    camera_id: str,
    db: Session = Depends(get_db)
):
    obs = db.query(CameraObservation).filter(CameraObservation.camera_id == camera_id).order_by(CameraObservation.timestamp.desc()).all()
    return [o.to_dict() for o in obs]

@router.post("/{camera_id}/observations")
def record_camera_observation(
    camera_id: str,
    data: ObservationCreate,
    db: Session = Depends(get_db)
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    obs = CameraObservation(
        camera_id=camera_id,
        farm_id=data.farm_id,
        field_id=data.field_id,
        observation_type=data.observation_type,
        confidence=data.confidence,
        details=data.details,
        bounding_box_json=json.dumps(data.bounding_box) if data.bounding_box else None,
        reviewed_by_agronomist=False
    )
    db.add(obs)
    db.commit()
    db.refresh(obs)

    # Emit domain event
    EventBus.publish(DomainEvent(
        event_type="camera.observation_logged",
        aggregate_type="camera",
        aggregate_id=camera_id,
        payload=obs.to_dict(),
        producer="edge_ai_vision_agent"
    ))

    return obs.to_dict()

@router.patch("/observations/{obs_id}/review")
def review_observation(
    obs_id: str,
    reviewed: bool = True,
    db: Session = Depends(get_db)
):
    obs = db.query(CameraObservation).filter(CameraObservation.id == obs_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
    obs.reviewed_by_agronomist = reviewed
    db.commit()
    return obs.to_dict()
