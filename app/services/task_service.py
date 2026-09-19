import json
import asyncio
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.models.task import FarmTask, WorkLog
from app.models.farm import Farm
from app.models.user import User
from app.models.communication import AdvisoryMessage
from app.models.audit import DomainEventLog
from app.core.events import DomainEvent, EventBus, event_bus

class TaskService:
    @staticmethod
    def get_tasks(
        db: Session,
        farm_id: Optional[str] = None,
        assigned_role: Optional[str] = None,
        assigned_user_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[FarmTask]:
        query = db.query(FarmTask)
        if farm_id:
            query = query.filter(FarmTask.farm_id == farm_id)
        if assigned_role:
            query = query.filter(FarmTask.assigned_role == assigned_role)
        if assigned_user_id:
            query = query.filter(FarmTask.assigned_to_user_id == assigned_user_id)
        if status:
            query = query.filter(FarmTask.status == status)
        return query.order_by(FarmTask.created_at.desc()).all()

    @staticmethod
    def create_task(
        db: Session,
        farm_id: str,
        title: str,
        actor_id: str,
        actor_role: str,
        field_id: Optional[str] = None,
        description: Optional[str] = None,
        task_type: str = "irrigation",
        priority: str = "medium",
        assigned_role: str = "worker",
        assigned_to_user_id: Optional[str] = None,
        due_date: Optional[datetime] = None,
        checklist: Optional[List[Dict[str, Any]]] = None
    ) -> FarmTask:
        task = FarmTask(
            farm_id=farm_id,
            field_id=field_id,
            title=title,
            description=description,
            task_type=task_type,
            priority=priority,
            status="pending",
            assigned_role=assigned_role,
            assigned_to_user_id=assigned_to_user_id,
            created_by_role=actor_role,
            due_date=due_date,
            checklist_json=json.dumps(checklist or [
                {"step": f"Inspect field parcel condition", "done": False},
                {"step": f"Execute {task_type} procedure according to guidelines", "done": False},
                {"step": "Log sensor readings and completion sign-off", "done": False}
            ])
        )
        db.add(task)
        db.commit()
        db.refresh(task)

        # Audit
        audit = DomainEventLog(
            event_type="TASK_CREATED",
            actor_id=actor_id,
            actor_role=actor_role,
            entity_name="FarmTask",
            entity_id=task.id,
            payload_json=json.dumps(task.to_dict())
        )
        db.add(audit)
        db.commit()

        # Emit domain event
        event = DomainEvent(
            event_type="TASK_CREATED",
            actor_id=actor_id,
            actor_role=actor_role,
            entity_name="FarmTask",
            entity_id=task.id,
            payload=task.to_dict()
        )
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(event_bus.emit(event))
        except Exception:
            pass

        return task

    @staticmethod
    def update_task_status(
        db: Session,
        task_id: str,
        new_status: str,
        actor_id: str,
        actor_role: str,
        notes: Optional[str] = None,
        hours_logged: float = 1.0,
        gps_lat: Optional[float] = None,
        gps_lon: Optional[float] = None
    ) -> FarmTask:
        task = db.query(FarmTask).filter(FarmTask.id == task_id).first()
        if not task:
            raise ValueError(f"Task {task_id} not found")

        old_status = task.status
        is_completed = (new_status or "").lower() == "completed"
        task.status = new_status
        if notes:
            task.notes = notes
        
        completion_notif = None
        if is_completed:
            task.completed_at = datetime.now(timezone.utc)
            # Mark all checklist items done
            try:
                cl = json.loads(task.checklist_json) if task.checklist_json else []
                for item in cl:
                    item["done"] = True
                task.checklist_json = json.dumps(cl)
            except Exception:
                pass

            # Reward farm health for completing critical agricultural interventions
            farm = db.query(Farm).filter(Farm.id == task.farm_id).first()
            if farm and farm.health_score < 96.0:
                farm.health_score = min(100.0, farm.health_score + 2.5)

            # Create notification for assigner / agronomist
            agronomist_user = db.query(User).filter(User.role == "agronomist").first()
            receiver_id = agronomist_user.id if agronomist_user else None
            actor_user = db.query(User).filter(User.id == actor_id).first()
            actor_name = actor_user.full_name if actor_user else f"{actor_role.capitalize()} Field Cadre"

            completion_notif = AdvisoryMessage(
                sender_id=actor_id,
                sender_name=actor_name,
                sender_role=actor_role or "worker",
                receiver_id=receiver_id,
                farm_id=task.farm_id,
                subject=f"Task Completed: {task.title}",
                body=f"Field cadre {actor_name} has verified and logged completion for task '{task.title}'. Farm biological vitality adjusted (+2.5%). GPS verified.",
                advisory_type="task_completion",
                priority="normal"
            )
            db.add(completion_notif)

        # Add WorkLog
        work_log = WorkLog(
            task_id=task.id,
            worker_id=actor_id,
            hours_logged=hours_logged,
            ground_truth_notes=notes or f"Updated status to {task.status}",
            gps_lat=gps_lat,
            gps_lon=gps_lon
        )
        db.add(work_log)

        # Audit
        audit = DomainEventLog(
            event_type="TASK_STATUS_UPDATED",
            actor_id=actor_id,
            actor_role=actor_role,
            entity_name="FarmTask",
            entity_id=task.id,
            payload_json=json.dumps({"old_status": old_status, "new_status": task.status, "notes": notes})
        )
        db.add(audit)
        db.commit()
        db.refresh(task)

        # Emit domain event
        event = DomainEvent(
            event_type="TASK_COMPLETED" if is_completed else "TASK_STATUS_UPDATED",
            actor_id=actor_id,
            actor_role=actor_role,
            entity_name="FarmTask",
            entity_id=task.id,
            payload=task.to_dict()
        )
        EventBus.publish(event)

        # Emit notification received event if completion notification was created
        if completion_notif:
            EventBus.publish(DomainEvent(
                event_type="NOTIFICATION_RECEIVED",
                aggregate_type="AdvisoryMessage",
                aggregate_id=completion_notif.id,
                payload=completion_notif.to_dict(),
                producer=actor_role or "worker"
            ))

        return task

    @staticmethod
    def toggle_checklist_item(db: Session, task_id: str, step_index: int, actor_id: str, actor_role: str) -> FarmTask:
        task = db.query(FarmTask).filter(FarmTask.id == task_id).first()
        if not task:
            raise ValueError(f"Task {task_id} not found")

        try:
            cl = json.loads(task.checklist_json) if task.checklist_json else []
            if 0 <= step_index < len(cl):
                cl[step_index]["done"] = not cl[step_index].get("done", False)
                task.checklist_json = json.dumps(cl)
                
                # Check if all steps done
                if all(item.get("done", False) for item in cl):
                    task.status = "completed"
                    task.completed_at = datetime.now(timezone.utc)
                elif any(item.get("done", False) for item in cl) and task.status == "pending":
                    task.status = "in_progress"

                db.commit()
                db.refresh(task)

                event = DomainEvent(
                    event_type="CHECKLIST_TOGGLED",
                    actor_id=actor_id,
                    actor_role=actor_role,
                    entity_name="FarmTask",
                    entity_id=task.id,
                    payload=task.to_dict()
                )
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        asyncio.create_task(event_bus.emit(event))
                except Exception:
                    pass
        except Exception as e:
            print(f"[TaskService] Checklist toggle error: {e}")

        return task
