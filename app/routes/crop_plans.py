from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import json

from app.database import get_db
from app.services.crop_plan_service import CropPlanService
from app.models.task import FarmTask
from app.models.farm import Farm
from app.models.agricultural_profile import AgriculturalProfile
from app.core.events import EventBus, DomainEvent
from app.models.user import User

router = APIRouter(prefix="/api/crop-plans", tags=["Crop Growing Plans"])

# In-memory store for active farm crop plans
_FARM_CROP_PLANS: Dict[str, Dict[str, Any]] = {}

@router.post("/generate-and-calibrate")
def generate_and_calibrate_precision_engine(survey_data: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Synthesizes precision agronomic plan calibrated to registered workforce,
    jurisdiction (Punjab, Odisha, etc.), farming classification, soil hydrology,
    and worker fatigue limits.
    """
    calibrated_plan = CropPlanService.generate_calibrated_precision_engine(survey_data)

    # If agronomist user id is provided, mark onboarding completed in DB
    agronomist_id = survey_data.get("agronomist_id")
    if agronomist_id:
        user = db.query(User).filter(User.id == agronomist_id).first()
        if user:
            user.has_completed_onboarding = True
            db.commit()

    # Store calibrated plan
    farm_id = survey_data.get("farm_id") or "default-farm"
    _FARM_CROP_PLANS[farm_id] = calibrated_plan

    # Emit domain event
    EventBus.publish(DomainEvent(
        event_type="PRECISION_CROP_ENGINE_CALIBRATED",
        actor_role="agronomist",
        payload={
            "plan_id": calibrated_plan.get("plan_id"),
            "crop_name": calibrated_plan.get("crop_name"),
            "state": calibrated_plan.get("state"),
            "district_basin": calibrated_plan.get("district_basin"),
            "total_workers": calibrated_plan.get("registered_cadre_summary", {}).get("total_registered_workers")
        }
    ))

    return calibrated_plan

@router.patch("/farm/{farm_id}/modify-stage")
def modify_crop_stage(farm_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Allows agronomist to tweak stage equipment, chemical dosages, or activate
    real-time weather adaptation protocols (e.g. unexpected rain / heatwave).
    """
    plan = _FARM_CROP_PLANS.get(farm_id) or _FARM_CROP_PLANS.get("default-farm")
    if not plan:
        plan = CropPlanService.generate_master_plan("Wheat", 120)
        _FARM_CROP_PLANS[farm_id] = plan

    stage_num = payload.get("stage_num", 1)
    new_inputs = payload.get("inputs")
    adaptation_protocol = payload.get("adaptation_protocol")

    stages = plan.get("stages", [])
    target_stage = None
    for s in stages:
        if s.get("stage_num") == stage_num:
            target_stage = s
            if new_inputs:
                s["inputs"] = new_inputs
            if adaptation_protocol:
                s["active_adaptation_protocol"] = adaptation_protocol
                s["description"] += f" [Protocol Activated: {adaptation_protocol}]"
            break

    # Emit domain event
    EventBus.publish(DomainEvent(
        event_type="CROP_STAGE_ADAPTATION_MODIFIED",
        actor_role="agronomist",
        payload={
            "farm_id": farm_id,
            "stage_num": stage_num,
            "adaptation_protocol": adaptation_protocol
        }
    ))

    return {
        "status": "SUCCESS",
        "message": f"Stage {stage_num} modified successfully with real-time agronomic adjustments.",
        "stage": target_stage,
        "active_adaptation_protocol": adaptation_protocol
    }

@router.get("/generate")
def generate_crop_plan(crop_name: str = Query(..., description="Crop name to generate plan for"), duration_days: Optional[int] = Query(None, description="Target crop cycle duration in days")):
    """
    Synthesizes an internet-grade 60–120 day master crop growing plan.
    """
    return CropPlanService.generate_master_plan(crop_name, duration_days)

@router.get("/farm/{farm_id}")
def get_farm_crop_plan(farm_id: str, db: Session = Depends(get_db)):
    """
    Retrieves the active master crop plan for a specific farm.
    """
    if farm_id in _FARM_CROP_PLANS:
        return _FARM_CROP_PLANS[farm_id]
        
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        # Fallback default plan for Wheat
        return CropPlanService.generate_master_plan("Wheat", 120)
        
    plan = CropPlanService.generate_master_plan(farm.name or "Wheat", 120)
    _FARM_CROP_PLANS[farm_id] = plan
    return plan

@router.post("/farm/{farm_id}/activate")
def activate_crop_plan(farm_id: str, plan_data: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Activates the master crop growing plan for a farm and automatically
    dispatches the Stage 1 agronomic tasks to the Farmer and Field Workers.
    """
    _FARM_CROP_PLANS[farm_id] = plan_data

    # Dispatch Stage 1 tasks if available
    stages = plan_data.get("stages", [])
    dispatched_tasks = []
    if stages:
        stage1 = stages[0]
        for task_info in stage1.get("tasks", []):
            new_task = FarmTask(
                farm_id=farm_id,
                title=task_info.get("title"),
                description=f"Stage 1 [{stage1.get('name')}]: {task_info.get('title')}. Assigned to: {task_info.get('assigned_to', 'Field Worker')}. Inputs: {', '.join(stage1.get('inputs', []))}",
                task_type=task_info.get("category", "irrigation"),
                priority=task_info.get("priority", "high"),
                status="pending",
                assigned_role=task_info.get("role", "worker")
            )
            db.add(new_task)
            dispatched_tasks.append(task_info.get("title"))

        db.commit()

    # Emit domain event
    EventBus.publish(DomainEvent(
        event_type="crop_plan_activated",
        aggregate_type="Farm",
        aggregate_id=farm_id,
        payload={
            "farm_id": farm_id,
            "crop_name": plan_data.get("crop_name"),
            "duration_days": plan_data.get("duration_days"),
            "dispatched_tasks_count": len(dispatched_tasks),
            "dispatched_tasks": dispatched_tasks
        },
        producer="CropPlanService"
    ))

    return {
        "status": "SUCCESS",
        "message": f"Master Crop Plan for {plan_data.get('crop_name')} activated. Stage 1 tasks released across workforce.",
        "dispatched_tasks": dispatched_tasks
    }

