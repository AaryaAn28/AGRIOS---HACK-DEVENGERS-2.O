import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Text, Integer, Boolean
from app.database import Base

class PestOutbreakHotspot(Base):
    __tablename__ = "pest_outbreak_hotspots"

    id = Column(String(64), primary_key=True, default=lambda: f"hotspot-{uuid.uuid4().hex[:8]}")
    zone_name = Column(String(120), nullable=False, index=True)
    district = Column(String(80), nullable=False, index=True)
    latitude = Column(Float, nullable=False, default=30.9010)
    longitude = Column(Float, nullable=False, default=75.8573)
    pest_species = Column(String(120), nullable=False)
    scientific_name = Column(String(120), nullable=False)
    crop_affected = Column(String(60), nullable=False)
    risk_index = Column(String(30), default="Moderate", index=True)  # Low, Moderate, Elevated, High, Critical
    risk_score = Column(Float, default=65.0)  # 0.0 to 100.0
    affected_acres = Column(Float, default=15.0)
    spore_density_m3 = Column(Float, default=120.0)  # Spores or vector count / m³
    vector_velocity_kmh = Column(Float, default=8.5)
    wind_vector = Column(String(40), default="NW @ 12 km/h")
    dispersion_radius_km = Column(Float, default=4.2)
    contagion_probability_pct = Column(Float, default=68.5)
    status = Column(String(30), default="Active", index=True)  # Active, Contained, Monitoring, Resolved
    reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "zone_name": self.zone_name,
            "district": self.district,
            "latitude": round(self.latitude, 4),
            "longitude": round(self.longitude, 4),
            "pest_species": self.pest_species,
            "scientific_name": self.scientific_name,
            "crop_affected": self.crop_affected,
            "risk_index": self.risk_index,
            "risk_score": round(self.risk_score, 1),
            "affected_acres": round(self.affected_acres, 1),
            "spore_density_m3": round(self.spore_density_m3, 1),
            "vector_velocity_kmh": round(self.vector_velocity_kmh, 1),
            "wind_vector": self.wind_vector,
            "dispersion_radius_km": round(self.dispersion_radius_km, 2),
            "contagion_probability_pct": round(self.contagion_probability_pct, 1),
            "status": self.status,
            "reported_at": self.reported_at.isoformat() if self.reported_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class BiosecurityBufferZone(Base):
    __tablename__ = "biosecurity_buffer_zones"

    id = Column(String(64), primary_key=True, default=lambda: f"qz-{uuid.uuid4().hex[:8]}")
    zone_code = Column(String(60), nullable=False, unique=True, index=True)
    district = Column(String(80), nullable=False, index=True)
    basin = Column(String(120), nullable=False)
    pest_type = Column(String(120), nullable=False)
    center_lat = Column(Float, nullable=False, default=30.9010)
    center_lon = Column(Float, nullable=False, default=75.8573)
    radius_km = Column(Float, nullable=False, default=5.0)
    cordon_level = Column(String(60), default="Level 2: Chemical Cordon & Movement Restriction")
    phytosanitary_protocol = Column(Text, nullable=False)
    legal_order_number = Column(String(80), nullable=False)
    chemical_barrier_agent = Column(String(140), default="Chlorantraniliprole 18.5% SC + Bio-Shield Barrier")
    active_checkpoints = Column(Integer, default=4)
    containment_status = Column(String(30), default="enforced", index=True)  # enforced, monitoring, contained, lifted
    severity = Column(String(30), default="high")  # critical, high, moderate
    enforcement_officer = Column(String(120), default="Dr. Vikramaditya Sen (State Agriculture Secretary)")
    action_taken = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "zone_code": self.zone_code,
            "district": self.district,
            "basin": self.basin,
            "pest_type": self.pest_type,
            "center_lat": round(self.center_lat, 4),
            "center_lon": round(self.center_lon, 4),
            "radius_km": round(self.radius_km, 1),
            "cordon_level": self.cordon_level,
            "phytosanitary_protocol": self.phytosanitary_protocol,
            "legal_order_number": self.legal_order_number,
            "chemical_barrier_agent": self.chemical_barrier_agent,
            "active_checkpoints": self.active_checkpoints,
            "containment_status": self.containment_status,
            "severity": self.severity,
            "enforcement_officer": self.enforcement_officer,
            "action_taken": self.action_taken,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None
        }

class IPMProtocolRecord(Base):
    __tablename__ = "ipm_protocols"

    id = Column(String(64), primary_key=True, default=lambda: f"ipm-{uuid.uuid4().hex[:8]}")
    crop = Column(String(60), nullable=False, index=True)
    pest = Column(String(120), nullable=False, index=True)
    etl = Column(String(160), nullable=False)  # Economic Threshold Level
    biocontrol = Column(String(180), nullable=False)
    cultural = Column(String(180), nullable=False)
    chemical_last_resort = Column(String(180), nullable=False)
    efficacy_score = Column(Float, default=94.5)  # Efficacy percentage
    active = Column(Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "crop": self.crop,
            "pest": self.pest,
            "etl": self.etl,
            "biocontrol": self.biocontrol,
            "cultural": self.cultural,
            "chemical_last_resort": self.chemical_last_resort,
            "efficacy_score": round(self.efficacy_score, 1),
            "active": self.active
        }
