import json
import asyncio
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.models.farm import Farm, Field
from app.models.crop import Crop
from app.models.task import FarmTask
from app.models.resource import FarmResource, FarmEquipment
from app.models.risk import RiskAlert, WeatherLog
from app.models.digital_twin import DigitalTwinSnapshot
from app.models.finance import ProduceInventory, FinancialTransaction
from app.core.events import DomainEvent, event_bus
from app.services.risk_service import RiskService
from app.services.task_service import TaskService
from app.services.digital_twin_service import DigitalTwinService

class SimulatorService:
    @staticmethod
    def trigger_scenario(
        db: Session,
        event_name: str,
        farm_id: Optional[str] = None,
        severity: str = "critical",
        custom_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        # If no farm specified, pick primary demo farm
        farm = None
        if farm_id:
            farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            farm = db.query(Farm).first()
        if not farm:
            raise ValueError("No demo farm found in database to simulate upon.")

        actor_id = "DEMO_JUDGE_SIMULATOR"
        actor_role = "simulator"
        correlation_id = f"sim-{datetime.now(timezone.utc).timestamp()}"

        results = {"scenario": event_name, "farm_id": farm.id, "farm_name": farm.name}

        # 1. SCENARIO: PEST OUTBREAK
        if event_name == "pest_outbreak":
            alert = RiskService.create_alert(
                db=db,
                farm_id=farm.id,
                title="CRITICAL BIO-RISK: Yellow Rust / Fall Armyworm Infestation",
                message="Ground telemetry & aerial multispectral indices detect rapidly expanding fungal rust foci across Field 1 (North Parcel).",
                category="pest",
                severity="critical",
                action_plan="Immediately dispatch Krishi Sakhi for ground verification and execute targeted Propiconazole 25% EC systemic fungicide spray within 24 hours.",
                actor_id=actor_id,
                actor_role=actor_role
            )
            # Auto create priority response task
            task = TaskService.create_task(
                db=db,
                farm_id=farm.id,
                title="EMERGENCY: Apply Propiconazole Spray on Field 1",
                actor_id=actor_id,
                actor_role=actor_role,
                task_type="spraying",
                priority="critical",
                assigned_role="worker",
                description="Halt pathogen spread. Wear protective kit and calibrate sprayer nozzle to 450 L/ha."
            )
            results["alert_id"] = alert.id
            results["task_id"] = task.id
            results["message"] = "Severe pest outbreak simulated. Alert and emergency task dispatched across all portals."

        # 2. SCENARIO: SUDDEN DROUGHT & HEATWAVE
        elif event_name == "sudden_drought":
            # Update Weather
            weather = WeatherLog(
                farm_id=farm.id,
                district=farm.district or "Ludhiana",
                temperature_c=42.4,
                humidity_pct=21.0,
                rainfall_mm=0.0,
                wind_speed_kmh=24.0,
                condition="Extreme Heatwave",
                forecast_json=json.dumps([
                    {"day": "Tomorrow", "temp": 43, "condition": "Severe Heat"},
                    {"day": "Day 2", "temp": 42, "condition": "Hot & Arid"},
                    {"day": "Day 3", "temp": 40, "condition": "Dry"}
                ])
            )
            db.add(weather)

            # Drop field soil moisture
            fields = db.query(Field).filter(Field.farm_id == farm.id).all()
            for fld in fields:
                fld.moisture_pct = 14.5
                fld.health_status = "water_stressed"
            farm.health_score = max(25.0, farm.health_score - 18.0)
            farm.status = "warning"

            # Create Alert & Task
            alert = RiskService.create_alert(
                db=db,
                farm_id=farm.id,
                title="WEATHER EMERGENCY: Severe Heatwave & Critical Moisture Deficit",
                message="Ambient temperatures breached 42°C. Root-zone soil moisture plummeted to 14.5%. High wilting risk.",
                category="weather",
                severity="critical",
                action_plan="Initiate nocturnal drip irrigation cycle. Suspend nitrogenous fertilization to avoid root burn.",
                actor_id=actor_id,
                actor_role=actor_role
            )
            task = TaskService.create_task(
                db=db,
                farm_id=farm.id,
                title="Execute Emergency Deep Nocturnal Irrigation",
                actor_id=actor_id,
                actor_role=actor_role,
                task_type="irrigation",
                priority="critical",
                assigned_role="farmer",
                description="Run solar tube-well across parcel zones A & B between 8 PM and 4 AM."
            )
            db.commit()
            results["alert_id"] = alert.id
            results["message"] = "Heatwave simulated. Soil moisture dropped to 14.5%. Emergency irrigation task assigned."

        # 3. SCENARIO: TRACTOR / EQUIPMENT BREAKDOWN
        elif event_name == "equipment_failure":
            tractor = db.query(FarmEquipment).filter(FarmEquipment.farm_id == farm.id, FarmEquipment.equipment_type == "tractor").first()
            if not tractor:
                tractor = db.query(FarmEquipment).first()
            if tractor:
                tractor.status = "maintenance"
                alert = RiskService.create_alert(
                    db=db,
                    farm_id=farm.id,
                    title=f"EQUIPMENT OFFLINE: {tractor.name} Hydraulic Seal Failure",
                    message="On-board engine telemetry detected hydraulic pressure loss during field plowing. Machine parked.",
                    category="equipment",
                    severity="warning",
                    action_plan="Dispatch district mobile mechanic unit. Swap booking to cooperative secondary pool.",
                    actor_id=actor_id,
                    actor_role=actor_role
                )
                db.commit()
                results["alert_id"] = alert.id
                results["message"] = f"{tractor.name} moved to maintenance status. Alerts emitted to Farmer and Agronomist."

        # 4. SCENARIO: WORKER COMPLETES ALL TODAY'S TASKS
        elif event_name == "task_completed":
            pending_tasks = db.query(FarmTask).filter(FarmTask.farm_id == farm.id, FarmTask.status != "completed").all()
            completed_titles = []
            for t in pending_tasks:
                TaskService.update_task_status(
                    db=db,
                    task_id=t.id,
                    new_status="completed",
                    actor_id="worker-krishi-sakhi-01",
                    actor_role="worker",
                    notes="Completed on-site field verification and execution with GPS verification.",
                    hours_logged=2.0
                )
                completed_titles.append(t.title)
            farm.health_score = min(100.0, farm.health_score + 10.0)
            farm.status = "optimal"
            db.commit()
            results["completed_tasks"] = completed_titles
            results["message"] = f"Field tasks completed. Farm health score restored to {farm.health_score}%."

        # 5. SCENARIO: BUMPER HARVEST & REVENUE LOG
        elif event_name == "bumper_harvest":
            qty = 6200.0
            prod = ProduceInventory(
                farm_id=farm.id,
                crop_name="PBW 550 Wheat",
                variety="Certified High-Yield",
                quantity_kg=qty,
                quality_grade="Grade A+",
                storage_location="Ludhiana Central Agro Silo #4",
                storage_moisture_pct=11.2,
                harvest_date=datetime.now(timezone.utc),
                status="listed_for_sale"
            )
            db.add(prod)
            
            # Revenue Transaction
            revenue_val = (qty / 100.0) * 2450.0  # 2450 per quintal
            tx = FinancialTransaction(
                farm_id=farm.id,
                tx_type="revenue",
                category="produce_sale",
                amount=revenue_val,
                description=f"Direct Mandi Sale of {qty}kg Grade A+ Wheat to FCI State Procurement",
                counterparty="Food Corporation of India (FCI) Regional Hub"
            )
            db.add(tx)
            db.commit()
            results["produce_id"] = prod.id
            results["revenue_inr"] = revenue_val
            results["message"] = f"Harvest logged: {qty} kg added to inventory, Rs {revenue_val:,.2f} credited in Finance Ledger."

        # 6. SCENARIO: RESET TO HEALTHY BASELINE
        elif event_name == "reset_demo":
            farm.health_score = 92.5
            farm.status = "optimal"
            fields = db.query(Field).filter(Field.farm_id == farm.id).all()
            for f in fields:
                f.moisture_pct = 44.0
                f.health_status = "healthy"
            equipment = db.query(FarmEquipment).filter(FarmEquipment.farm_id == farm.id).all()
            for eq in equipment:
                eq.status = "available"
            db.commit()
            results["message"] = "Farm state restored to optimal hackathon demonstration baseline."

        # Broadcast general SIMULATION_EVENT to all portals
        event = DomainEvent(
            event_type="SIMULATION_TRIGGERED",
            actor_id=actor_id,
            actor_role=actor_role,
            entity_name="Simulator",
            entity_id=farm.id,
            payload=results,
            correlation_id=correlation_id
        )
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(event_bus.emit(event))
        except Exception:
            pass

        return results
