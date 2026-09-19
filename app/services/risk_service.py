import json
import asyncio
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.models.risk import RiskAlert, WeatherLog
from app.models.farm import Farm
from app.models.digital_twin import DigitalTwinSnapshot
from app.models.audit import DomainEventLog
from app.core.events import DomainEvent, event_bus

class RiskService:
    @staticmethod
    def get_alerts(db: Session, farm_id: Optional[str] = None, severity: Optional[str] = None) -> List[RiskAlert]:
        query = db.query(RiskAlert)
        if farm_id:
            query = query.filter(RiskAlert.farm_id == farm_id)
        if severity:
            query = query.filter(RiskAlert.severity == severity)
        return query.order_by(RiskAlert.created_at.desc()).all()

    @staticmethod
    def create_alert(
        db: Session,
        farm_id: str,
        title: str,
        message: str,
        category: str = "pest",
        severity: str = "warning",
        field_id: Optional[str] = None,
        action_plan: Optional[str] = None,
        actor_id: Optional[str] = None,
        actor_role: str = "system"
    ) -> RiskAlert:
        alert = RiskAlert(
            farm_id=farm_id,
            field_id=field_id,
            alert_category=category,
            severity=severity,
            title=title,
            message=message,
            action_plan=action_plan
        )
        db.add(alert)

        # Severe risks negatively impact farm health score
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if farm:
            penalty = 12.0 if severity == "critical" else (6.0 if severity == "warning" else 2.0)
            farm.health_score = max(10.0, farm.health_score - penalty)
            farm.status = "critical" if farm.health_score < 50 else ("warning" if farm.health_score < 80 else "optimal")

        # Update digital twin stress index if snapshot exists
        twin = db.query(DigitalTwinSnapshot).filter(DigitalTwinSnapshot.farm_id == farm_id).first()
        if twin:
            twin.stress_index = min(1.0, twin.stress_index + 0.3)
            twin.ndvi_mean = max(0.2, twin.ndvi_mean - 0.1)

        # Audit
        audit = DomainEventLog(
            event_type="RISK_ALERT_GENERATED",
            actor_id=actor_id,
            actor_role=actor_role,
            entity_name="RiskAlert",
            entity_id=alert.id,
            payload_json=json.dumps(alert.to_dict())
        )
        db.add(audit)
        db.commit()
        db.refresh(alert)

        # Emit domain event
        event = DomainEvent(
            event_type="RISK_ALERT_GENERATED",
            actor_id=actor_id,
            actor_role=actor_role,
            entity_name="RiskAlert",
            entity_id=alert.id,
            payload=alert.to_dict()
        )
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(event_bus.emit(event))
        except Exception:
            pass

        return alert

    @staticmethod
    def acknowledge_alert(db: Session, alert_id: str, actor_id: str, actor_role: str) -> RiskAlert:
        alert = db.query(RiskAlert).filter(RiskAlert.id == alert_id).first()
        if not alert:
            raise ValueError(f"Alert {alert_id} not found")
        alert.acknowledged = True
        db.commit()
        db.refresh(alert)

        event = DomainEvent(
            event_type="RISK_ALERT_ACKNOWLEDGED",
            actor_id=actor_id,
            actor_role=actor_role,
            entity_name="RiskAlert",
            entity_id=alert.id,
            payload=alert.to_dict()
        )
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(event_bus.emit(event))
        except Exception:
            pass

        return alert

    @staticmethod
    def get_latest_weather(db: Session, district: str = "Ludhiana") -> Optional[WeatherLog]:
        return db.query(WeatherLog).filter(WeatherLog.district == district).order_by(WeatherLog.recorded_at.desc()).first()
