import json
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.models.farm import Farm, Field
from app.models.crop import Crop
from app.models.digital_twin import DigitalTwinSnapshot
from app.models.audit import DomainEventLog
from app.core.events import DomainEvent, event_bus

class FarmService:
    @staticmethod
    def get_farms(db: Session, district: Optional[str] = None) -> List[Farm]:
        query = db.query(Farm)
        if district:
            query = query.filter(Farm.district == district)
        return query.all()

    @staticmethod
    def get_farm_by_id(db: Session, farm_id: str) -> Optional[Farm]:
        return db.query(Farm).filter(Farm.id == farm_id).first()

    @staticmethod
    def update_farm_health(db: Session, farm_id: str, new_health: float, actor_id: str, actor_role: str) -> Farm:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            raise ValueError(f"Farm {farm_id} not found")
        
        old_health = farm.health_score
        farm.health_score = max(0.0, min(100.0, new_health))
        farm.status = "optimal" if farm.health_score >= 80 else ("warning" if farm.health_score >= 50 else "critical")
        
        # Audit Log
        audit = DomainEventLog(
            event_type="FARM_HEALTH_UPDATED",
            actor_id=actor_id,
            actor_role=actor_role,
            entity_name="Farm",
            entity_id=farm.id,
            payload_json=json.dumps({"old_health": old_health, "new_health": farm.health_score, "status": farm.status})
        )
        db.add(audit)
        db.commit()
        db.refresh(farm)

        # Emit typed domain event
        event = DomainEvent(
            event_type="FARM_HEALTH_UPDATED",
            actor_id=actor_id,
            actor_role=actor_role,
            entity_name="Farm",
            entity_id=farm.id,
            payload={"farm_id": farm.id, "health_score": farm.health_score, "status": farm.status}
        )
        # We run the async event emission via background loop if needed, or scheduled
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(event_bus.emit(event))
            else:
                loop.run_until_complete(event_bus.emit(event))
        except Exception:
            pass

        return farm

    @staticmethod
    def get_fields_for_farm(db: Session, farm_id: str) -> List[Field]:
        return db.query(Field).filter(Field.farm_id == farm_id).all()
