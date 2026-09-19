from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.risk import RiskAlert, WeatherLog
from app.models.user import User
from app.schemas.agrios_schemas import RiskAlertCreateRequest
from app.services.risk_service import RiskService
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/risks", tags=["Risks & Weather"])

@router.get("/alerts")
def list_alerts(farm_id: Optional[str] = None, severity: Optional[str] = None, db: Session = Depends(get_db)):
    alerts = RiskService.get_alerts(db, farm_id=farm_id, severity=severity)
    return [a.to_dict() for a in alerts]

@router.post("/alerts")
def create_alert(
    request: RiskAlertCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = RiskService.create_alert(
        db=db,
        farm_id=request.farm_id,
        field_id=request.field_id,
        category=request.alert_category,
        severity=request.severity,
        title=request.title,
        message=request.message,
        action_plan=request.action_plan,
        actor_id=current_user.id,
        actor_role=current_user.role
    )
    return alert.to_dict()

@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        alert = RiskService.acknowledge_alert(db, alert_id, current_user.id, current_user.role)
        return alert.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/weather")
def get_weather(district: str = "Ludhiana", db: Session = Depends(get_db)):
    weather = RiskService.get_latest_weather(db, district=district)
    if not weather:
        return {
            "temperature_c": 27.5,
            "humidity_pct": 58.0,
            "rainfall_mm": 0.0,
            "wind_speed_kmh": 14.0,
            "condition": "Pleasant Sunshine",
            "district": district,
            "forecast": [
                {"day": "Tomorrow", "temp": 28, "condition": "Clear"},
                {"day": "Day 2", "temp": 29, "condition": "Sunny"},
                {"day": "Day 3", "temp": 27, "condition": "Breezy"}
            ]
        }
    return weather.to_dict()
