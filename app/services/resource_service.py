import json
import asyncio
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.models.resource import FarmResource, FarmEquipment, EquipmentBooking
from app.models.risk import RiskAlert
from app.models.finance import FinancialTransaction
from app.models.audit import DomainEventLog
from app.core.events import DomainEvent, event_bus

class ResourceService:
    @staticmethod
    def get_resources(db: Session, farm_id: Optional[str] = None) -> List[FarmResource]:
        query = db.query(FarmResource)
        if farm_id:
            query = query.filter(FarmResource.farm_id == farm_id)
        return query.all()

    @staticmethod
    def get_equipment(db: Session, farm_id: Optional[str] = None) -> List[FarmEquipment]:
        query = db.query(FarmEquipment)
        if farm_id:
            query = query.filter(FarmEquipment.farm_id == farm_id)
        return query.all()

    @staticmethod
    def consume_resource(
        db: Session,
        resource_id: str,
        quantity_used: float,
        actor_id: str,
        actor_role: str,
        notes: Optional[str] = None
    ) -> FarmResource:
        resource = db.query(FarmResource).filter(FarmResource.id == resource_id).first()
        if not resource:
            raise ValueError(f"Resource {resource_id} not found")

        old_qty = resource.quantity
        resource.quantity = max(0.0, resource.quantity - quantity_used)

        if resource.quantity == 0.0:
            resource.status = "exhausted"
        elif resource.quantity <= resource.reorder_threshold:
            resource.status = "low"
        else:
            resource.status = "adequate"

        # If low/exhausted, auto-trigger a Risk Alert for the farm
        if resource.status in ("low", "exhausted"):
            alert = RiskAlert(
                farm_id=resource.farm_id,
                alert_category="soil_moisture",
                severity="warning" if resource.status == "low" else "critical",
                title=f"Inventory Alert: {resource.name} is {resource.status.upper()}",
                message=f"Current stock has dropped to {round(resource.quantity, 1)} {resource.unit}. Reorder threshold is {resource.reorder_threshold} {resource.unit}.",
                action_plan=f"Procure replacement batch from {resource.supplier} immediately to prevent operational task blockage."
            )
            db.add(alert)

        # Record financial expense for consumption if applicable
        expense_amount = quantity_used * resource.cost_per_unit
        if expense_amount > 0:
            tx = FinancialTransaction(
                farm_id=resource.farm_id,
                tx_type="expense",
                category=resource.category,
                amount=expense_amount,
                description=f"Consumed {quantity_used} {resource.unit} of {resource.name} ({notes or 'Field application'})",
                counterparty=resource.supplier
            )
            db.add(tx)

        # Audit
        audit = DomainEventLog(
            event_type="RESOURCE_CONSUMED",
            actor_id=actor_id,
            actor_role=actor_role,
            entity_name="FarmResource",
            entity_id=resource.id,
            payload_json=json.dumps({
                "resource_name": resource.name,
                "quantity_used": quantity_used,
                "remaining_quantity": resource.quantity,
                "status": resource.status
            })
        )
        db.add(audit)
        db.commit()
        db.refresh(resource)

        # Emit domain event
        event = DomainEvent(
            event_type="RESOURCE_CONSUMED",
            actor_id=actor_id,
            actor_role=actor_role,
            entity_name="FarmResource",
            entity_id=resource.id,
            payload=resource.to_dict()
        )
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(event_bus.emit(event))
        except Exception:
            pass

        return resource

    @staticmethod
    def book_equipment(
        db: Session,
        equipment_id: str,
        farm_id: str,
        booked_by_id: str,
        purpose: str,
        start_time: datetime,
        end_time: datetime
    ) -> EquipmentBooking:
        equipment = db.query(FarmEquipment).filter(FarmEquipment.id == equipment_id).first()
        if not equipment:
            raise ValueError(f"Equipment {equipment_id} not found")

        equipment.status = "booked"
        
        # Calculate duration hours
        duration_hours = max(1.0, (end_time - start_time).total_seconds() / 3600.0)
        total_cost = duration_hours * equipment.hourly_rate

        booking = EquipmentBooking(
            equipment_id=equipment_id,
            farm_id=farm_id,
            booked_by_id=booked_by_id,
            purpose=purpose,
            start_time=start_time,
            end_time=end_time,
            total_cost=total_cost,
            status="confirmed"
        )
        db.add(booking)

        # Record expense
        tx = FinancialTransaction(
            farm_id=farm_id,
            tx_type="expense",
            category="machinery_hire",
            amount=total_cost,
            description=f"Hired {equipment.name} for {round(duration_hours, 1)} hrs ({purpose})",
            counterparty="Village Agri Cooperative Asset Pool"
        )
        db.add(tx)

        db.commit()
        db.refresh(booking)

        # Emit event
        event = DomainEvent(
            event_type="EQUIPMENT_BOOKED",
            actor_id=booked_by_id,
            actor_role="farmer",
            entity_name="FarmEquipment",
            entity_id=equipment.id,
            payload=booking.to_dict()
        )
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(event_bus.emit(event))
        except Exception:
            pass

        return booking
