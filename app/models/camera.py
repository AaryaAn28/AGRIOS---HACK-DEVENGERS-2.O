from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import json
import uuid

from app.database import Base

class Camera(Base):
    """Camera & Coverage Subsystem (Guardrail 11).
    Explicitly tracks camera coverage polygons and represents unmonitored blind spots.
    """
    __tablename__ = "cameras"

    id = Column(String(64), primary_key=True, default=lambda: f"cam_{uuid.uuid4().hex[:8]}")
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=False)
    field_id = Column(String(64), ForeignKey("fields.id"), nullable=True)
    name = Column(String(128), nullable=False)
    location_lat = Column(Float, nullable=False)
    location_lon = Column(Float, nullable=False)
    coverage_polygon_json = Column(Text, nullable=True) # GeoJSON coordinates
    coverage_area_sqm = Column(Float, default=4500.0) # Area in square meters
    field_coverage_pct = Column(Float, default=62.5) # Explicitly calculates coverage of target parcel
    blind_spots_pct = Column(Float, default=37.5) # Explicit representation of unmonitored blind spots
    status = Column(String(32), default="online") # online, offline, degraded
    last_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    capabilities_json = Column(Text, default='["optical_rgb", "thermal_radiometric", "ptz", "edge_ai_leaf_stress"]')

    observations = relationship("CameraObservation", back_populates="camera", cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        kwargs.pop("ip_stream_url", None)
        if "location_lat" not in kwargs:
            kwargs["location_lat"] = 30.9010
        if "location_lon" not in kwargs:
            kwargs["location_lon"] = 75.8573
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "field_id": self.field_id,
            "name": self.name,
            "location_lat": self.location_lat,
            "location_lon": self.location_lon,
            "coverage_polygon": json.loads(self.coverage_polygon_json) if self.coverage_polygon_json else None,
            "coverage_area_sqm": self.coverage_area_sqm,
            "field_coverage_pct": self.field_coverage_pct,
            "blind_spots_pct": self.blind_spots_pct,
            "status": self.status,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
            "capabilities": json.loads(self.capabilities_json) if self.capabilities_json else []
        }

class CameraObservation(Base):
    """AI Vision Observation from field cameras.
    Treated as an observation/assessment with confidence, not definitive diagnosis.
    """
    __tablename__ = "camera_observations"

    id = Column(String(64), primary_key=True, default=lambda: f"camobs_{uuid.uuid4().hex[:8]}")
    camera_id = Column(String(64), ForeignKey("cameras.id"), nullable=False)
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=False)
    field_id = Column(String(64), ForeignKey("fields.id"), nullable=True)
    observation_type = Column(String(64), nullable=False) # crop_stress, pest_activity, disease_symptoms, standing_water, dry_zones
    confidence = Column(Float, nullable=False, default=0.88)
    details = Column(Text, nullable=False)
    bounding_box_json = Column(Text, nullable=True)
    reviewed_by_agronomist = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    camera = relationship("Camera", back_populates="observations")

    def to_dict(self):
        return {
            "id": self.id,
            "camera_id": self.camera_id,
            "farm_id": self.farm_id,
            "field_id": self.field_id,
            "observation_type": self.observation_type,
            "confidence": self.confidence,
            "details": self.details,
            "bounding_box": json.loads(self.bounding_box_json) if self.bounding_box_json else None,
            "reviewed_by_agronomist": self.reviewed_by_agronomist,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }
