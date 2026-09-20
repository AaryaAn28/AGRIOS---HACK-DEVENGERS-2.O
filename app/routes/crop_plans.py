from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
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
from app.models.communication import AdvisoryMessage
import uuid

router = APIRouter(prefix="/api/crop-plans", tags=["Crop Growing Plans"])

# In-memory store for active farm crop plans
_FARM_CROP_PLANS: Dict[str, Dict[str, Any]] = {}
_ACTIVE_DISPATCHED_DAY: Dict[str, int] = {"default": 1, "global": 1}

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

    # Persist any survey workers/farmers to DB if not already present
    from app.models.workforce import WorkerProfile
    from app.utils.security import hash_password
    import uuid as uid

    for w_entry in (survey_data.get("workers", []) + survey_data.get("farmers", [])):
        w_name = w_entry.get("name") if isinstance(w_entry, dict) else str(w_entry)
        if not w_name:
            continue
        clean_name = w_name.split("(")[0].strip()
        role = w_entry.get("role", "worker") if isinstance(w_entry, dict) else "worker"
        existing = db.query(User).filter(User.full_name == clean_name).first()
        if not existing:
            count = db.query(User).filter(User.role == role).count()
            p_code = f"{role.upper()}-{count + 1:03d}"
            new_u = User(
                id=str(uid.uuid4()),
                full_name=clean_name,
                email=f"{clean_name.lower().replace(' ', '.')}@agrios.in",
                phone="+91 98000 00" + f"{count + 1:03d}",
                hashed_password=hash_password("Admin@123"),
                role=role,
                persona_code=p_code,
                jurisdiction_code=survey_data.get("state", "Punjab"),
                farm_id=farm_id if farm_id != "default-farm" else None,
                has_completed_onboarding=True
            )
            db.add(new_u)
            db.commit()
            db.refresh(new_u)
            if role == "worker":
                wp = WorkerProfile(
                    user_id=new_u.id,
                    status="AVAILABLE",
                    active_tasks_count=0,
                    hours_worked_this_week=0.0
                )
                db.add(wp)
                db.commit()

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

    # If weather adaptation protocol was applied, create urgent AdvisoryMessage for workforce & farmers
    if adaptation_protocol:
        try:
            adv_msg = AdvisoryMessage(
                id=str(uuid.uuid4()),
                sender_id="agronomist_001",
                sender_role="agronomist",
                target_role="all",
                subject=f"⚠️ Weather Safeguard Protocol: {adaptation_protocol[:60]}",
                body=f"Agronomist Dr. Priya Sharma activated emergency agronomic safeguard: '{adaptation_protocol}'. Field operations, foliar sprays, and irrigation shifts have been realigned immediately.",
                priority="urgent"
            )
            db.add(adv_msg)
            db.commit()

            EventBus.publish(DomainEvent(
                event_type="NOTIFICATION_RECEIVED",
                actor_role="agronomist",
                payload={
                    "id": adv_msg.id,
                    "title": adv_msg.subject,
                    "message": adv_msg.body,
                    "priority": "urgent",
                    "target_role": "all"
                }
            ))
        except Exception as ex:
            db.rollback()

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


class DispatchDayTasksRequest(BaseModel):
    farm_id: str
    day_number: int
    crop_name: Optional[str] = "Wheat"

@router.post("/dispatch-day-tasks")
def dispatch_day_tasks(req: DispatchDayTasksRequest, db: Session = Depends(get_db)):
    """
    Executes and circulates tasks for the specified growth day across the workforce cadre.
    Creates tasks in `farm_tasks` table and emits real-time WebSocket domain events.
    """
    farm = db.query(Farm).filter(Farm.id == req.farm_id).first()
    if not farm:
        farm = db.query(Farm).first()
    actual_farm_id = farm.id if farm else req.farm_id

    crop = req.crop_name or (getattr(farm, 'crop_type', None) if farm else "Wheat") or "Wheat"
    day_ctx = CropPlanService.get_day_context(actual_farm_id, req.day_number, crop)
    tasks_to_create = day_ctx.get("tasks", [])

    # Deduplicate: Remove prior pending tasks for this day on this farm to prevent duplicate stacking
    day_prefix = f"Day {req.day_number}"
    db.query(FarmTask).filter(
        FarmTask.farm_id == actual_farm_id,
        FarmTask.description.like(f"%{day_prefix}%"),
        FarmTask.status == "pending"
    ).delete(synchronize_session=False)

    users = db.query(User).all()

    created_tasks = []
    for t in tasks_to_create:
        assigned_name = t.get("assigned_to", "")
        assigned_user_id = None
        for u in users:
            if u.full_name and (u.full_name.lower() in assigned_name.lower() or assigned_name.lower() in u.full_name.lower()):
                assigned_user_id = u.id
                break

        new_task = FarmTask(
            farm_id=actual_farm_id,
            title=t.get("title"),
            description=f"Day {req.day_number} [{day_ctx.get('stage_name')}]: {t.get('description', '')} Assigned: {t.get('assigned_to')}",
            task_type=t.get("category", "operations"),
            priority=t.get("priority", "high"),
            status="pending",
            assigned_to_user_id=assigned_user_id,
            assigned_role=t.get("assigned_role", "worker")
        )
        db.add(new_task)
        created_tasks.append(t.get("title"))

    db.commit()

    # Record broadcast notification in advisory_messages table
    admin_user = db.query(User).filter(User.role == "agronomist").first()
    sender_id = admin_user.id if admin_user else "agronomist_system"
    sender_name = admin_user.full_name if admin_user else "Lead Agronomist"

    advisory_notif = AdvisoryMessage(
        sender_id=sender_id,
        sender_name=sender_name,
        sender_role="agronomist",
        farm_id=actual_farm_id,
        subject=f"Day {req.day_number} Directives Dispatched ({crop})",
        body=f"Agronomist has dispatched {len(created_tasks)} tasks for {crop} (Day {req.day_number}, Stage: {day_ctx.get('stage_name', 'Field Operations')}). Field workers have been assigned.",
        advisory_type="task_dispatch",
        priority="high"
    )
    db.add(advisory_notif)
    db.commit()

    # Emit task created event for WebSocket broadcast
    EventBus.publish(DomainEvent(
        event_type="TASK_CREATED",
        aggregate_type="FarmTask",
        aggregate_id=actual_farm_id,
        payload={
            "farm_id": actual_farm_id,
            "day_number": req.day_number,
            "crop_name": crop,
            "stage_name": day_ctx.get("stage_name"),
            "dispatched_count": len(created_tasks),
            "tasks": created_tasks
        },
        producer="Agronomist_3D_Calibrator"
    ))

    # Emit notification received event
    EventBus.publish(DomainEvent(
        event_type="NOTIFICATION_RECEIVED",
        aggregate_type="AdvisoryMessage",
        aggregate_id=advisory_notif.id,
        payload=advisory_notif.to_dict(),
        producer="Agronomist_3D_Calibrator"
    ))

    # If Day 30 outbreak active, publish pest outbreak domain event
    if day_ctx.get("pest_outbreak_active"):
        outbreak = day_ctx.get("outbreak_details", {})
        EventBus.publish(DomainEvent(
            event_type="RISK_ALERT_TRIGGERED",
            aggregate_type="RiskAlert",
            aggregate_id=actual_farm_id,
            payload={
                "farm_id": actual_farm_id,
                "sector": outbreak.get("sector", "North Sector (Field A)"),
                "alert_title": f"Active Pathogen: {outbreak.get('pathogen')}",
                "severity": outbreak.get("severity", "ELEVATED_CRITICAL"),
                "prescription": outbreak.get("recommended_prescription"),
                "confidence": outbreak.get("confidence_pct", 89.2)
            },
            producer="Pathogen_AI_Lab"
        ))

    # Save active dispatched day for worker and farmer portals
    _ACTIVE_DISPATCHED_DAY[actual_farm_id] = req.day_number
    _ACTIVE_DISPATCHED_DAY["default"] = req.day_number
    _ACTIVE_DISPATCHED_DAY["global"] = req.day_number

    return {
        "status": "SUCCESS",
        "day_number": req.day_number,
        "stage_name": day_ctx.get("stage_name"),
        "theme": day_ctx.get("theme"),
        "pest_outbreak_active": day_ctx.get("pest_outbreak_active", False),
        "outbreak_details": day_ctx.get("outbreak_details"),
        "dispatched_count": len(created_tasks),
        "dispatched_tasks": created_tasks,
        "message": f"Day {req.day_number} tasks successfully circulated across cadre. Farmer and Worker portals notified."
    }

@router.get("/farm/{farm_id}/active-dispatched-day")
def get_active_dispatched_day(farm_id: str):
    """Returns the most recent growth day assigned/dispatched by the Agronomist."""
    day = _ACTIVE_DISPATCHED_DAY.get(farm_id) or _ACTIVE_DISPATCHED_DAY.get("default") or _ACTIVE_DISPATCHED_DAY.get("global") or 1
    return {
        "farm_id": farm_id,
        "active_dispatched_day": day
    }

@router.get("/day-context/{farm_id}/{day_number}")
def get_day_context(farm_id: str, day_number: int, crop_name: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Returns the contextual stage, theme, 4 tasks, and outbreak indicators for day_number."""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        farm = db.query(Farm).first()
    actual_crop = crop_name or (getattr(farm, 'crop_type', None) if farm else "Wheat") or "Wheat"
    return CropPlanService.get_day_context(farm_id, day_number, actual_crop)


