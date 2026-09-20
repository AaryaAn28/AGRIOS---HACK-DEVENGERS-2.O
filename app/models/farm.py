import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from app.database import Base

class Farm(Base):
    __tablename__ = "farms"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(120), nullable=False)
    owner_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    assigned_worker_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    assigned_agronomist_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    village = Column(String(80), nullable=True)
    district = Column(String(80), nullable=True, index=True)
    state = Column(String(80), nullable=True, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    total_area_acres = Column(Float, default=10.0)
    soil_type = Column(String(60), default="Alluvial Loam")
    irrigation_source = Column(String(60), default="Canal & Tube Well")
    health_score = Column(Float, default=88.5)  # 0 to 100
    current_growth_day = Column(Integer, default=1)  # Persisted active dispatched day
    status = Column(String(30), default="optimal")  # optimal, warning, critical
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    fields = relationship("Field", back_populates="farm", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "owner_id": self.owner_id,
            "assigned_worker_id": self.assigned_worker_id,
            "assigned_agronomist_id": self.assigned_agronomist_id,
            "village": self.village,
            "district": self.district,
            "state": self.state,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "total_area_acres": self.total_area_acres,
            "soil_type": self.soil_type,
            "irrigation_source": self.irrigation_source,
            "health_score": round(self.health_score, 1) if self.health_score is not None else 85.0,
            "current_growth_day": self.current_growth_day or 1,
            "status": self.status,
            "fields_count": len(self.fields) if self.fields else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Field(Base):
    __tablename__ = "fields"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=False, index=True)
    name = Column(String(80), nullable=False)
    area_acres = Column(Float, default=2.5)
    boundary_geojson = Column(Text, nullable=True)
    soil_ph = Column(Float, default=6.8)
    moisture_pct = Column(Float, default=42.0)
    nitrogen_level = Column(Float, default=180.0)  # kg/ha
    phosphorus_level = Column(Float, default=24.0)
    potassium_level = Column(Float, default=210.0)
    ndvi_score = Column(Float, default=0.78)  # 0.0 to 1.0
    health_status = Column(String(30), default="healthy")

    farm = relationship("Farm", back_populates="fields")
    crops = relationship("Crop", back_populates="field", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "name": self.name,
            "area_acres": self.area_acres,
            "boundary_geojson": self.boundary_geojson,
            "soil_ph": self.soil_ph,
            "moisture_pct": self.moisture_pct,
            "nitrogen_level": self.nitrogen_level,
            "phosphorus_level": self.phosphorus_level,
            "potassium_level": self.potassium_level,
            "ndvi_score": round(self.ndvi_score, 2) if self.ndvi_score is not None else 0.75,
            "health_status": self.health_status
        }
