from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.schemas.agrios_schemas import SimulationTriggerRequest
from app.services.simulator_service import SimulatorService

router = APIRouter(prefix="/api/simulator", tags=["Hackathon Judge Demo Simulator"])

@router.get("/scenarios")
def list_scenarios():
    return {
        "scenarios": [
            {
                "id": "pest_outbreak",
                "title": "Severe Pest Outbreak (Yellow Rust / Spodoptera)",
                "description": "Injects critical biosecurity alert, drops farm health, automatically creates emergency spraying task for Field Worker, and broadcasts alert.",
                "affected_portals": ["Farmer", "Field Worker", "Agronomist", "Government"]
            },
            {
                "id": "sudden_drought",
                "title": "Extreme Heatwave & Soil Moisture Depletion",
                "description": "Temperature surges to 42.4°C, soil moisture crashes to 14.5%, triggers water stress alert and emergency irrigation checklist.",
                "affected_portals": ["Farmer", "Agronomist", "Government"]
            },
            {
                "id": "equipment_failure",
                "title": "Tractor Hydraulic Breakdown",
                "description": "Moves primary Mahindra 575 DI tractor into maintenance, alerts agronomist for cooperative equipment pooling.",
                "affected_portals": ["Farmer", "Agronomist"]
            },
            {
                "id": "task_completed",
                "title": "Krishi Sakhi Field Execution Sign-off",
                "description": "Simulates worker field inspection with GPS verification, completes task checklist, raises farm health score to optimal.",
                "affected_portals": ["Farmer", "Field Worker"]
            },
            {
                "id": "bumper_harvest",
                "title": "High-Yield Harvest & Direct Mandi Sale",
                "description": "Records 6,200 kg certified Grade A+ Wheat harvest, credits Rs 1.51 Lakhs revenue into Finance Ledger.",
                "affected_portals": ["Farmer", "Government"]
            },
            {
                "id": "reset_demo",
                "title": "Reset to Pristine Hackathon Baseline",
                "description": "Restores farm health to 92.5%, normalizes moisture, clears severe alerts, and resets equipment status.",
                "affected_portals": ["All Portals"]
            }
        ]
    }

@router.post("/trigger")
def trigger_simulation(request: SimulationTriggerRequest, db: Session = Depends(get_db)):
    try:
        res = SimulatorService.trigger_scenario(
            db=db,
            event_name=request.event_name,
            farm_id=request.farm_id,
            severity=request.severity or "critical",
            custom_params=request.custom_params
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
