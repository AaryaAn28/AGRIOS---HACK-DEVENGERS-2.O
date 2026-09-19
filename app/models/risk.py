import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Boolean
from app.database import Base

class WeatherLog(Base):
    __tablename__ = "weather_logs"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=True, index=True)
    district = Column(String(80), default="Ludhiana", index=True)
    temperature_c = Column(Float, default=26.5)
    humidity_pct = Column(Float, default=62.0)
    rainfall_mm = Column(Float, default=0.0)
    wind_speed_kmh = Column(Float, default=12.0)
    wind_direction = Column(String(20), default="NE")
    solar_radiation = Column(Float, default=5.4)  # kWh/m2
    condition = Column(String(40), default="Partly Cloudy")  # Sunny, Rain, Storm, Heatwave
    forecast_json = Column(Text, nullable=True)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        try:
            forecast = json.loads(self.forecast_json) if self.forecast_json else []
        except Exception:
            forecast = []
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "district": self.district,
            "temperature_c": round(self.temperature_c, 1),
            "humidity_pct": round(self.humidity_pct, 1),
            "rainfall_mm": round(self.rainfall_mm, 1),
            "wind_speed_kmh": round(self.wind_speed_kmh, 1),
            "wind_direction": self.wind_direction,
            "solar_radiation": round(self.solar_radiation, 2),
            "condition": self.condition,
            "forecast": forecast,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None
        }

class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=False, index=True)
    field_id = Column(String(64), ForeignKey("fields.id"), nullable=True)
    alert_category = Column(String(40), default="pest")  # pest, disease, weather, soil_moisture, equipment
    severity = Column(String(30), default="warning")  # advisory, warning, critical
    title = Column(String(140), nullable=False)
    message = Column(Text, nullable=False)
    action_plan = Column(Text, nullable=True)
    acknowledged = Column(Boolean, default=False)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "field_id": self.field_id,
            "alert_category": self.alert_category,
            "severity": self.severity,
            "title": self.title,
            "message": self.message,
            "action_plan": self.action_plan,
            "acknowledged": self.acknowledged,
            "resolved": self.resolved,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
