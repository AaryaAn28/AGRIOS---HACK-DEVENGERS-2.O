import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.farm import Farm
from app.models.communication import AdvisoryMessage
from app.services.task_service import TaskService

client = TestClient(app)

def test_dispatch_tasks_and_cross_portal_notifications():
    db = SessionLocal()
    farm = db.query(Farm).first()
    assert farm is not None

    # 1. Dispatch granular day tasks
    payload = {
        "farm_id": farm.id,
        "crop_name": "Wheat",
        "day_number": 1,
        "stage_name": "Germination & Crown Root Initiation (CRI)",
        "tasks": [
            {
                "title": "Initial Flood / Sprinkler Emergence Verification",
                "assigned_to": "Sunita Devi (Krishi Sakhi)",
                "role": "worker",
                "estimated_hours": 3.0,
                "priority": "high",
                "field_parcel": "North Sector A1"
            }
        ]
    }
    res = client.post("/api/crop-plans/dispatch-day-tasks", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["day_number"] == 1
    assert len(data["dispatched_tasks"]) >= 1

    # 2. Check AdvisoryMessage was created for dispatch
    notifs_res = client.get(f"/api/communications?farm_id={farm.id}")
    assert notifs_res.status_code == 200
    notifs = notifs_res.json()
    dispatch_notifs = [n for n in notifs if n.get("advisory_type") == "task_dispatch"]
    assert len(dispatch_notifs) > 0
    assert "Day 1" in dispatch_notifs[0]["subject"]

    # 3. Worker completes the dispatched task -> triggers assigner notification
    from app.models.task import FarmTask
    task_record = db.query(FarmTask).filter(FarmTask.farm_id == farm.id).order_by(FarmTask.created_at.desc()).first()
    assert task_record is not None

    completed_task = TaskService.update_task_status(
        db=db,
        task_id=task_record.id,
        new_status="completed",
        actor_id="WORKER-001",
        actor_role="worker",
        notes="Verified GPS and irrigation line"
    )
    assert completed_task.status == "completed"

    # 4. Check assigner completion notification was recorded
    notifs_res2 = client.get(f"/api/communications?farm_id={farm.id}")
    notifs2 = notifs_res2.json()
    comp_notifs = [n for n in notifs2 if n.get("advisory_type") == "task_completion"]
    assert len(comp_notifs) > 0
    assert "Task Completed" in comp_notifs[0]["subject"]

    # 5. Mark individual message read
    notif_id = comp_notifs[0]["id"]
    read_res = client.put(f"/api/communications/{notif_id}/read")
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True

    # 6. Mark all messages read
    mark_all_res = client.post(f"/api/communications/mark-all-read?farm_id={farm.id}")
    assert mark_all_res.status_code == 200
    assert mark_all_res.json()["status"].lower() == "success"

    # Verify 0 unread remain for this farm
    notifs_res3 = client.get(f"/api/communications?farm_id={farm.id}")
    unread = [n for n in notifs_res3.json() if not n.get("is_read")]
    assert len(unread) == 0

def test_phytosanitary_quarantine_zones_government():
    # 1. Create Quarantine Zone (State Command)
    payload = {
        "district": "Sangrur North Basin",
        "pest_type": "Fall Armyworm (Spodoptera frugiperda)",
        "radius_km": 4.5,
        "severity": "high",
        "action_taken": "Deploy pheromone traps at 50m intervals."
    }
    res = client.post("/api/agronomist/quarantine-zones", json=payload)
    assert res.status_code == 200
    zone = res.json()
    assert zone["district"] == "Sangrur North Basin"
    assert zone["radius_km"] == 4.5

    # 2. List Quarantine Zones
    list_res = client.get("/api/agronomist/quarantine-zones")
    assert list_res.status_code == 200
    zones = list_res.json()
    matching = [z for z in zones if z["id"] == zone["id"]]
    assert len(matching) == 1
