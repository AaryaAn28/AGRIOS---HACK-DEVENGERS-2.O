import pytest
from app.database import SessionLocal
from app.models.farm import Farm
from app.models.task import FarmTask
from app.services.task_service import TaskService

def test_task_creation_and_completion_lifecycle():
    db = SessionLocal()
    farm = db.query(Farm).first()
    assert farm is not None

    # 1. Create Task
    task = TaskService.create_task(
        db=db,
        farm_id=farm.id,
        title="Automated Test Irrigation Task",
        description="Verifying full task lifecycle",
        task_type="irrigation",
        priority="high",
        assigned_role="worker",
        actor_id="test-agronomist",
        actor_role="agronomist"
    )
    assert task.status == "pending"

    # 2. Toggle Checklist Item
    updated_task = TaskService.toggle_checklist_item(
        db=db,
        task_id=task.id,
        step_index=0,
        actor_id="test-worker",
        actor_role="worker"
    )
    assert updated_task.status in ("in_progress", "completed")

    # 3. Mark Complete
    final_task = TaskService.update_task_status(
        db=db,
        task_id=task.id,
        new_status="completed",
        actor_id="test-worker",
        actor_role="worker",
        notes="Automated lifecycle verified",
        hours_logged=1.5
    )
    assert final_task.status == "completed"
    assert final_task.completed_at is not None

    db.close()
