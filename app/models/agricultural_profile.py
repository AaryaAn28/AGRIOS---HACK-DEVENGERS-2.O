import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class AgriculturalProfile(Base):
    """Authoritative Agricultural Configuration Profile created during Agronomist Onboarding.
    Defines multi-select farming types, dynamic crop/species taxonomy, regional soil/water/climate,
    pest/disease risks, data availability, and downstream templates for supervised Farmers & Workers.
    """
    __tablename__ = "agricultural_profiles"

    id = Column(String(64), primary_key=True, default=lambda: f"prof_{uuid.uuid4().hex[:8]}")
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, unique=True)
    
    # 1. Role & Jurisdiction
    jurisdiction_state = Column(String(64), default="Punjab")
    jurisdiction_district = Column(String(64), default="Ludhiana")
    jurisdiction_block = Column(String(64), default="Ludhiana-1")
    village_coverage = Column(String(256), default="Jandiali Kalan, Kohara, Sahnewal")
    climate_zone = Column(String(64), default="Indo-Gangetic Plain / Semi-Arid Subtropical")

    # 2. Multi-select Farming Types (JSON list)
    farming_types_json = Column(Text, default='["field_farming", "horticulture"]')

    # 3. Dynamic Crops / Species selection (JSON dict)
    crops_species_json = Column(Text, default='{"field_farming": ["Wheat", "Rice"], "horticulture": ["Tomato", "Potato"]}')

    # 4. Farm Conditions
    farm_conditions_json = Column(Text, default='{"terrain": "Flat alluvial plain", "elevation_m": 245, "water_table_depth_m": 18.5}')

    # 5. Soil & Water Configuration
    soil_config_json = Column(Text, default='{"soil_types": ["Alluvial Loam"], "ph_range": "7.2 - 7.8", "salinity": "Low", "drainage": "Well-drained"}')
    water_config_json = Column(Text, default='{"irrigation_sources": ["Canal", "Tube Well"], "methods": ["Canal Flood", "Drip"], "monsoon_dependency": "Moderate"}')

    # 6. Climate & Weather Profile
    climate_config_json = Column(Text, default='{"temp_range_c": "4 - 44", "annual_rainfall_mm": 650, "extreme_weather": ["Summer Heatwave", "Winter Frost"]}')

    # 7. Management Practices
    practices_json = Column(Text, default='{"sowing_methods": ["Zero Tillage Drill", "Broadcasting"], "rotation": ["Wheat-Paddy", "Moong"], "organic_inputs": ["FYM", "Biofertilizer"]}')

    # 8. Pests & Pathogens Focus
    risks_config_json = Column(Text, default='["Yellow Rust", "Pink Bollworm", "Stem Borer", "Aphids"]')

    # 9. Resources & Infrastructure
    resources_config_json = Column(Text, default='{"machinery": ["Tractor 50HP", "Rotavator", "Drone Sprayer"], "storage": ["Pungrain Silo", "Covered Plinth"], "field_worker_ratio": "1:25"}')

    # 10. Data Availability Signals
    data_availability_json = Column(Text, default='{"satellite_ndvi": true, "weather_api": true, "soil_tests": true, "farm_photos": true, "field_worker_obs": true, "iot_sensors": true, "drone_imagery": false}')

    # 11. Operational Parameters
    operational_params_json = Column(Text, default='{"inspection_frequency_days": 7, "risk_escalation_threshold": "moderate", "auto_task_dispatch": true}')

    is_completed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "jurisdiction": {
                "state": self.jurisdiction_state,
                "district": self.jurisdiction_district,
                "block": self.jurisdiction_block,
                "village_coverage": self.village_coverage,
                "climate_zone": self.climate_zone
            },
            "farming_types": json.loads(self.farming_types_json) if self.farming_types_json else [],
            "crops_species": json.loads(self.crops_species_json) if self.crops_species_json else {},
            "farm_conditions": json.loads(self.farm_conditions_json) if self.farm_conditions_json else {},
            "soil_config": json.loads(self.soil_config_json) if self.soil_config_json else {},
            "water_config": json.loads(self.water_config_json) if self.water_config_json else {},
            "climate_config": json.loads(self.climate_config_json) if self.climate_config_json else {},
            "practices": json.loads(self.practices_json) if self.practices_json else {},
            "risks_config": json.loads(self.risks_config_json) if self.risks_config_json else [],
            "resources_config": json.loads(self.resources_config_json) if self.resources_config_json else {},
            "data_availability": json.loads(self.data_availability_json) if self.data_availability_json else {},
            "operational_params": json.loads(self.operational_params_json) if self.operational_params_json else {},
            "is_completed": self.is_completed,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
