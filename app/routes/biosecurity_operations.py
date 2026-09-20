from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.biosecurity_service import BiosecurityService

router = APIRouter(prefix="/api/government", tags=["Government Biosecurity & Pest Radar"])

# ----------------- SCHEMAS -----------------

class SpreadSimulationRequest(BaseModel):
    hotspot_id: str = Field(..., description="Target hotspot ID for dispersion simulation")
    forecast_days: int = Field(7, ge=1, le=60, description="Forecast window in days (7, 14, 30)")
    wind_speed_kmh: float = Field(14.0, ge=0.0, le=100.0)
    humidity_pct: float = Field(65.0, ge=10.0, le=100.0)
    temperature_c: float = Field(28.0, ge=0.0, le=50.0)
    intervention: str = Field("none", description="'none', 'biological_barrier', 'chemical_cordon', 'full_lockdown'")

class QuarantineZoneCreateRequest(BaseModel):
    district: str = Field(..., min_length=2)
    pest_type: str = Field(..., min_length=2)
    radius_km: float = Field(5.0, ge=0.5, le=50.0)
    severity: str = Field("high", description="'moderate', 'elevated', 'high', 'critical'")
    cordon_level: str = Field("Level 2: Chemical Cordon & Movement Restriction")
    chemical_barrier_agent: str = Field("Chlorantraniliprole 18.5% SC + Bio-Shield Barrier")
    action_taken: str = Field(..., min_length=5)
    basin: Optional[str] = None

class QuarantineStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="'enforced', 'monitoring', 'contained', 'lifted'")
    action_note: Optional[str] = None

# ----------------- PEST OUTBREAK RADAR ENDPOINTS -----------------

@router.get("/pest-radar/hotspots")
def get_pest_radar_hotspots(db: Session = Depends(get_db)):
    """
    Returns statewide satellite radar telemetry, active pathogen hotspots,
    vector migration velocities, and biosecurity readiness metrics.
    """
    return BiosecurityService.get_radar_overview(db)

@router.post("/pest-radar/simulate-spread")
def simulate_pest_spread(req: SpreadSimulationRequest, db: Session = Depends(get_db)):
    """
    Spatiotemporal Vector Dispersion Model predicting pest/spore spread over 7/14/30 days
    under varying atmospheric conditions and containment barrier strategies.
    """
    return BiosecurityService.simulate_vector_spread(
        db=db,
        hotspot_id=req.hotspot_id,
        forecast_days=req.forecast_days,
        wind_speed_kmh=req.wind_speed_kmh,
        humidity_pct=req.humidity_pct,
        temp_c=req.temperature_c,
        intervention=req.intervention
    )

# ----------------- BIOSECURITY BUFFER ZONES ENDPOINTS -----------------

@router.get("/biosecurity/buffer-zones")
def list_biosecurity_buffer_zones(db: Session = Depends(get_db)):
    """
    Lists all active and historical biosecurity containment zones and legal cordon sanitaires.
    """
    return BiosecurityService.list_all_buffer_zones(db)

@router.post("/biosecurity/buffer-zones")
def create_biosecurity_buffer_zone(req: QuarantineZoneCreateRequest, db: Session = Depends(get_db)):
    """
    Declares a new legal Biosecurity Buffer Zone with gazetted legal order number,
    calculates checkpoints, and broadcasts domain events.
    """
    data = req.model_dump() if hasattr(req, "model_dump") else req.dict()
    return BiosecurityService.create_quarantine_buffer_zone(db, data)

@router.put("/biosecurity/buffer-zones/{zone_id}/status")
def update_biosecurity_buffer_zone_status(
    zone_id: str,
    req: QuarantineStatusUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Updates the enforcement status of an existing containment buffer zone.
    """
    try:
        return BiosecurityService.update_buffer_zone_status(db, zone_id, req.status, req.action_note)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/biosecurity/ipm-protocols")
def get_ipm_protocols(db: Session = Depends(get_db)):
    """
    Retrieves accredited PAU-ICAR Integrated Pest Management and biological control protocols.
    """
    return BiosecurityService.get_ipm_protocols(db)

@router.get("/biosecurity/reports/cordon-audit")
def get_biosecurity_cordon_audit_report(db: Session = Depends(get_db)):
    """
    Generates the official Government of Punjab Phytosanitary &
    Biosecurity Cordon Sanitaire Gazette Digest Audit Report.
    """
    return BiosecurityService.generate_cordon_audit_report(db)
