from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime, timezone

from app.database import get_db
from app.schemas.agrios_schemas import SimulationTriggerRequest
from app.services.simulator_service import SimulatorService
from app.core.events import EventBus, DomainEvent

router = APIRouter(prefix="/api/simulator", tags=["Hackathon Judge Demo Simulator"])

# Global in-memory demo telemetry tracker for Judge Demo Control
SIMULATION_STATE = {
    "status": "LIVE",
    "events_simulated": 0,
    "last_event": "System Baseline Initialized",
    "last_event_time": datetime.now(timezone.utc).isoformat(),
    "history": []
}

@router.get("/status")
def get_simulation_status():
    """Returns real-time simulation metrics for the Judge Demo Controller header banner."""
    return SIMULATION_STATE

@router.get("/scenarios")
def list_scenarios():
    return {
        "status": SIMULATION_STATE,
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

        # Update telemetry state
        if request.event_name == "reset_demo":
            SIMULATION_STATE["events_simulated"] = 0
            SIMULATION_STATE["last_event"] = "Pristine Baseline Restored"
            SIMULATION_STATE["history"] = []
        else:
            SIMULATION_STATE["events_simulated"] += 1
            SIMULATION_STATE["last_event"] = request.event_name
            SIMULATION_STATE["history"].append(request.event_name)

        SIMULATION_STATE["last_event_time"] = datetime.now(timezone.utc).isoformat()
        res["simulation_state"] = SIMULATION_STATE
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/undo")
def undo_last_simulation_event(db: Session = Depends(get_db)):
    """Reverts the last simulated shock by restoring baseline state."""
    if not SIMULATION_STATE["history"]:
        return {
            "status": "noop",
            "message": "No events in simulation history to undo.",
            "simulation_state": SIMULATION_STATE
        }

    undone_event = SIMULATION_STATE["history"].pop()
    # Reset to baseline
    res = SimulatorService.trigger_scenario(db=db, event_name="reset_demo")
    SIMULATION_STATE["events_simulated"] = max(0, SIMULATION_STATE["events_simulated"] - 1)
    SIMULATION_STATE["last_event"] = f"Reverted: {undone_event}"
    SIMULATION_STATE["last_event_time"] = datetime.now(timezone.utc).isoformat()

    EventBus.publish(DomainEvent(
        event_type="simulator.event_undone",
        aggregate_type="simulator",
        aggregate_id="demo_controller",
        payload={"undone_event": undone_event, "current_state": "baseline"},
        producer="judge_demo_controller"
    ))

    return {
        "status": "success",
        "message": f"Successfully reverted '{undone_event}' and restored baseline state.",
        "undone_event": undone_event,
        "simulation_state": SIMULATION_STATE
    }
