import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from app.database import Base

class DigitalTwinSnapshot(Base):
    """Authoritative digital twin state contract for future Claude Opus 3D integration.
    Contains canonical telemetry, canopy density, stress maps, and camera coordinates.
    """
    __tablename__ = "digital_twin_snapshots"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=False, index=True)
    field_id = Column(String(64), ForeignKey("fields.id"), nullable=True)
    crop_id = Column(String(64), ForeignKey("crops.id"), nullable=True)
    
    # Biological & Spatial State Metrics
    canopy_coverage_pct = Column(Float, default=74.5)
    leaf_area_index = Column(Float, default=3.8)
    chlorophyll_content = Column(Float, default=45.2)  # SPAD units
    stress_index = Column(Float, default=0.15)  # 0.0 to 1.0
    ndvi_mean = Column(Float, default=0.76)
    
    # 3D Adapter Telemetry & Visual Matrix Payloads (GeoJSON / Spatial Grids)
    soil_moisture_grid_json = Column(Text, nullable=True)
    thermal_profile_grid_json = Column(Text, nullable=True)
    camera_orbit_preset = Column(String(60), default="isometric_farm_overview")
    mesh_anchor_points_json = Column(Text, nullable=True)
    
    version = Column(String(20), default="1.0-claude-contract")
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        try:
            moisture_grid = json.loads(self.soil_moisture_grid_json) if self.soil_moisture_grid_json else []
        except Exception:
            moisture_grid = []
        try:
            thermal_grid = json.loads(self.thermal_profile_grid_json) if self.thermal_profile_grid_json else []
        except Exception:
            thermal_grid = []
        try:
            anchor_points = json.loads(self.mesh_anchor_points_json) if self.mesh_anchor_points_json else []
        except Exception:
            anchor_points = []

        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "field_id": self.field_id,
            "crop_id": self.crop_id,
            "canopy_coverage_pct": round(self.canopy_coverage_pct, 1),
            "leaf_area_index": round(self.leaf_area_index, 2),
            "chlorophyll_content": round(self.chlorophyll_content, 1),
            "stress_index": round(self.stress_index, 2),
            "ndvi_mean": round(self.ndvi_mean, 2),
            "soil_moisture_grid": moisture_grid,
            "thermal_profile_grid": thermal_grid,
            "camera_orbit_preset": self.camera_orbit_preset,
            "mesh_anchor_points": anchor_points,
            "version": self.version,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
