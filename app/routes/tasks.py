from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.task import FarmTask
from app.models.user import User
from app.schemas.agrios_schemas import TaskCreateRequest, TaskStatusUpdateRequest
from app.services.task_service import TaskService
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["Tasks & Workforce"])

@router.get("")
def list_tasks(
    farm_id: Optional[str] = None,
    assigned_role: Optional[str] = None,
    assigned_to_user_id: Optional[str] = None,
    status: Optional[str] = None,
    growth_day: Optional[int] = None,
    db: Session = Depends(get_db)
):
    tasks = TaskService.get_tasks(
        db, farm_id=farm_id, assigned_role=assigned_role,
        assigned_user_id=assigned_to_user_id, status=status
    )
    # Server-side growth day filtering by checking title/description for "Day X"
    if growth_day is not None:
        import re
        day_pattern = re.compile(rf"\bDay\s*{growth_day}\b", re.IGNORECASE)
        tasks = [t for t in tasks if day_pattern.search(t.title or "") or day_pattern.search(t.description or "")
                 or (t.task_type == "spray")]  # Always include spray tasks regardless of day
    return [t.to_dict() for t in tasks]

@router.get("/{task_id}")
def get_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(FarmTask).filter(FarmTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task.to_dict()

@router.post("")
def create_task(request: TaskCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    due_dt = datetime.fromisoformat(request.due_date) if request.due_date else None
    task = TaskService.create_task(
        db=db,
        farm_id=request.farm_id,
        field_id=request.field_id,
        title=request.title,
        description=request.description,
        task_type=request.task_type or "irrigation",
        priority=request.priority or "medium",
        assigned_role=request.assigned_role or "worker",
        assigned_to_user_id=request.assigned_to_user_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        due_date=due_dt,
        checklist=request.checklist
    )
    return task.to_dict()

@router.put("/{task_id}/status")
def update_task_status(
    task_id: str,
    request: TaskStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        task = TaskService.update_task_status(
            db=db,
            task_id=task_id,
            new_status=request.status,
            actor_id=current_user.id,
            actor_role=current_user.role,
            notes=request.notes,
            hours_logged=request.hours_logged or 1.0
        )
        return task.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{task_id}/checklist/{step_index}/toggle")
def toggle_checklist(
    task_id: str,
    step_index: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        task = TaskService.toggle_checklist_item(
            db=db,
            task_id=task_id,
            step_index=step_index,
            actor_id=current_user.id,
            actor_role=current_user.role
        )
        return task.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
