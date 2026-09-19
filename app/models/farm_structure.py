import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class FarmStructureVersion(Base):
    """Digital Twin Farm Spatial Structure with immutable Version History.
    Only original creator can modify structure. Tracks boundaries, spatial objects
    (roads, canals, borewells, ponds, greenhouses), and interactive planting-site grid.
    """
    __tablename__ = "farm_structure_versions"

    id = Column(String(64), primary_key=True, default=lambda: f"fstruct_{uuid.uuid4().hex[:8]}")
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False, default=1)
    created_by_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    change_summary = Column(String(256), default="Initial baseline farm spatial layout")
    
    # Boundary GeoJSON
    boundary_geojson = Column(Text, nullable=True)

    # Spatial Objects: roads, paths, ponds, borewells, storage, polyhouses, sensors
    spatial_objects_json = Column(Text, default='[]')

    # Interactive Planting Site Grid (rows, plant spacing, coordinates, plant statuses)
    planting_grid_json = Column(Text, default='{}')

    is_current = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    farm = relationship("Farm")
    creator = relationship("User", foreign_keys=[created_by_id])

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "version_number": self.version_number,
            "created_by_id": self.created_by_id,
            "created_by_name": self.creator.full_name if self.creator else "System",
            "change_summary": self.change_summary,
            "boundary": json.loads(self.boundary_geojson) if self.boundary_geojson else None,
            "spatial_objects": json.loads(self.spatial_objects_json) if self.spatial_objects_json else [],
            "planting_grid": json.loads(self.planting_grid_json) if self.planting_grid_json else {},
            "is_current": self.is_current,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
