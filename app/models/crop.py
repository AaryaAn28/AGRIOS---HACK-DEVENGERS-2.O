import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Crop(Base):
    __tablename__ = "crops"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    field_id = Column(String(64), ForeignKey("fields.id"), nullable=False, index=True)
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=False, index=True)
    crop_name = Column(String(80), nullable=False)  # e.g., Wheat (PBW 550), Basmati Paddy
    variety = Column(String(80), nullable=True)
    season = Column(String(30), default="Rabi")  # Kharif, Rabi, Zaid
    sowing_date = Column(DateTime, nullable=True)
    expected_harvest_date = Column(DateTime, nullable=True)
    stage = Column(String(40), default="vegetative")  # germination, vegetative, flowering, grain_filling, ripening, harvested
    growth_progress_pct = Column(Float, default=45.0)
    health_index = Column(Float, default=90.0)  # 0 to 100
    yield_estimate_kg = Column(Float, default=4800.0)
    status = Column(String(30), default="healthy")

    field = relationship("Field", back_populates="crops")
    health_logs = relationship("CropHealthLog", back_populates="crop", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "field_id": self.field_id,
            "farm_id": self.farm_id,
            "crop_name": self.crop_name,
            "variety": self.variety,
            "season": self.season,
            "sowing_date": self.sowing_date.isoformat() if self.sowing_date else None,
            "expected_harvest_date": self.expected_harvest_date.isoformat() if self.expected_harvest_date else None,
            "stage": self.stage,
            "growth_progress_pct": round(self.growth_progress_pct, 1),
            "health_index": round(self.health_index, 1),
            "yield_estimate_kg": round(self.yield_estimate_kg, 1),
            "status": self.status
        }

class CropHealthLog(Base):
    __tablename__ = "crop_health_logs"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    crop_id = Column(String(64), ForeignKey("crops.id"), nullable=False, index=True)
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=False)
    recorded_by_id = Column(String(64), nullable=True)
    disease_detected = Column(String(120), nullable=True)  # e.g., "Yellow Rust", "Early Blight", "None"
    pest_risk = Column(String(60), default="Low")  # Low, Moderate, High, Severe
    severity = Column(Float, default=0.0)  # 0.0 to 1.0
    diagnosis_notes = Column(Text, nullable=True)
    remedy_recommended = Column(Text, nullable=True)
    image_url = Column(String(256), nullable=True)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    crop = relationship("Crop", back_populates="health_logs")

    def to_dict(self):
        return {
            "id": self.id,
            "crop_id": self.crop_id,
            "farm_id": self.farm_id,
            "recorded_by_id": self.recorded_by_id,
            "disease_detected": self.disease_detected,
            "pest_risk": self.pest_risk,
            "severity": self.severity,
            "diagnosis_notes": self.diagnosis_notes,
            "remedy_recommended": self.remedy_recommended,
            "image_url": self.image_url,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None
        }
