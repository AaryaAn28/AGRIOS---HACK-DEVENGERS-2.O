from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.database import get_db
from app.models.farm import Farm
from app.services.digital_twin_service import DigitalTwinService

router = APIRouter(prefix="/api/digital-twin", tags=["Digital Twin 3D Adapter"])

@router.get("/contract-spec")
def get_3d_engine_contract_specification():
    """Returns the formal API contract schema reserved for future Claude Opus 3D Digital Twin engine."""
    return {
        "engine_target": "Claude Opus 3D WebGL/Three.js Farm Engine",
        "protocol_version": "1.0-claude-contract",
        "telemetry_channel": "/ws/live-feed",
        "required_events": [
            "DIGITAL_TWIN_TELEMETRY_UPDATED",
            "FARM_HEALTH_UPDATED",
            "RISK_ALERT_GENERATED",
            "SIMULATION_TRIGGERED"
        ],
        "state_properties": {
            "canopy_coverage_pct": "float 0..100 (Biological leaf canopy volume)",
            "leaf_area_index": "float 0..8 (LAI)",
            "chlorophyll_content": "float SPAD index",
            "stress_index": "float 0..1 (Water/disease biophysical stress)",
            "ndvi_mean": "float 0..1 (Normalized Difference Vegetation Index)",
            "soil_moisture_grid": "Array of {x, y, val} spatial nodes",
            "thermal_profile_grid": "Array of {x, y, temp_c} surface temperature nodes",
            "mesh_anchor_points": "Array of {label, lat, lon, elevation_m} GIS ground anchors"
        }
    }

@router.get("/snapshot/{farm_id}")
def get_snapshot(farm_id: str, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        # Fallback to first farm
        farm = db.query(Farm).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    snapshot = DigitalTwinService.get_snapshot(db, farm.id)
    data = snapshot.to_dict()
    data["farm"] = farm.to_dict()
    return data

@router.post("/telemetry/{farm_id}")
def update_telemetry(
    farm_id: str,
    canopy_pct: Optional[float] = None,
    stress_index: Optional[float] = None,
    ndvi: Optional[float] = None,
    db: Session = Depends(get_db)
):
    snapshot = DigitalTwinService.update_telemetry(db, farm_id, canopy_pct, stress_index, ndvi)
    return snapshot.to_dict()
