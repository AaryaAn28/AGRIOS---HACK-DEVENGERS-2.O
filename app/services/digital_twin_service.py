import json
import asyncio
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from app.models.digital_twin import DigitalTwinSnapshot
from app.models.farm import Farm
from app.core.events import DomainEvent, event_bus

class DigitalTwinService:
    """Authoritative digital twin business adapter.
    Preserves a clean, strictly typed integration contract for future Claude Opus 3D module.
    """
    @staticmethod
    def get_snapshot(db: Session, farm_id: str) -> DigitalTwinSnapshot:
        snapshot = db.query(DigitalTwinSnapshot).filter(DigitalTwinSnapshot.farm_id == farm_id).first()
        if not snapshot:
            # Create standard baseline snapshot
            snapshot = DigitalTwinSnapshot(
                farm_id=farm_id,
                canopy_coverage_pct=72.5,
                leaf_area_index=3.8,
                chlorophyll_content=46.0,
                stress_index=0.12,
                ndvi_mean=0.78,
                soil_moisture_grid_json=json.dumps([
                    {"x": 0, "y": 0, "val": 42}, {"x": 1, "y": 0, "val": 44}, {"x": 2, "y": 0, "val": 40},
                    {"x": 0, "y": 1, "val": 39}, {"x": 1, "y": 1, "val": 45}, {"x": 2, "y": 1, "val": 41},
                    {"x": 0, "y": 2, "val": 38}, {"x": 1, "y": 2, "val": 43}, {"x": 2, "y": 2, "val": 42}
                ]),
                thermal_profile_grid_json=json.dumps([
                    {"x": 0, "y": 0, "temp_c": 26.2}, {"x": 1, "y": 0, "temp_c": 26.5}, {"x": 2, "y": 0, "temp_c": 26.3},
                    {"x": 0, "y": 1, "temp_c": 26.0}, {"x": 1, "y": 1, "temp_c": 25.8}, {"x": 2, "y": 1, "temp_c": 26.1},
                    {"x": 0, "y": 2, "temp_c": 26.4}, {"x": 1, "y": 2, "temp_c": 26.6}, {"x": 2, "y": 2, "temp_c": 26.5}
                ]),
                camera_orbit_preset="isometric_farm_overview",
                mesh_anchor_points_json=json.dumps([
                    {"label": "Canal Inlet", "lat": 30.9015, "lon": 75.8568, "elevation_m": 242.0},
                    {"label": "Main Pump House", "lat": 30.9012, "lon": 75.8575, "elevation_m": 242.5},
                    {"label": "Weather Sensor Tower", "lat": 30.9018, "lon": 75.8580, "elevation_m": 244.0}
                ])
            )
            db.add(snapshot)
            db.commit()
            db.refresh(snapshot)
        return snapshot

    @staticmethod
    def update_telemetry(
        db: Session,
        farm_id: str,
        canopy_pct: Optional[float] = None,
        stress_index: Optional[float] = None,
        ndvi: Optional[float] = None
    ) -> DigitalTwinSnapshot:
        snapshot = DigitalTwinService.get_snapshot(db, farm_id)
        if canopy_pct is not None:
            snapshot.canopy_coverage_pct = canopy_pct
        if stress_index is not None:
            snapshot.stress_index = stress_index
        if ndvi is not None:
            snapshot.ndvi_mean = ndvi

        db.commit()
        db.refresh(snapshot)

        event = DomainEvent(
            event_type="DIGITAL_TWIN_TELEMETRY_UPDATED",
            entity_name="DigitalTwinSnapshot",
            entity_id=snapshot.id,
            payload=snapshot.to_dict()
        )
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(event_bus.emit(event))
        except Exception:
            pass

        return snapshot
