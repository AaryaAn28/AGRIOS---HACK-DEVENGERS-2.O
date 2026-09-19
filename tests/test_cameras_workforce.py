from datetime import datetime, timezone, timedelta
from app.database import SessionLocal
from app.models.user import User
from app.models.farm import Farm
from app.models.camera import Camera, CameraObservation
from app.models.workforce import WorkerProfile, LeaveRequest

def test_camera_coverage_and_observation():
    db = SessionLocal()
    try:
        farm = db.query(Farm).first()
        assert farm is not None

        camera = Camera(
            farm_id=farm.id,
            name="Field 1 North Sector Optical & Radiometric PTZ",
            location_lat=farm.latitude + 0.001,
            location_lon=farm.longitude + 0.001,
            coverage_area_sqm=4800.0,
            field_coverage_pct=65.0,
            blind_spots_pct=35.0,
            status="online"
        )
        db.add(camera)
        db.commit()
        db.refresh(camera)

        assert camera.field_coverage_pct == 65.0
        assert camera.blind_spots_pct == 35.0

        obs = CameraObservation(
            camera_id=camera.id,
            farm_id=farm.id,
            observation_type="pest_activity",
            confidence=0.91,
            details="Localized stem borer clusters identified on western perimeter.",
            reviewed_by_agronomist=False
        )
        db.add(obs)
        db.commit()
        db.refresh(obs)

        assert obs.confidence == 0.91
        assert obs.reviewed_by_agronomist is False
    finally:
        db.close()

def test_workforce_dynamic_status_and_leave_workflow():
    db = SessionLocal()
    try:
        worker = db.query(User).filter(User.role == "worker").first()
        gov = db.query(User).filter(User.role == "government").first()
        assert worker is not None
        assert gov is not None

        profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == worker.id).first()
        if not profile:
            profile = WorkerProfile(
                user_id=worker.id,
                status="AVAILABLE",
                active_tasks_count=2,
                hours_worked_this_week=30.0,
                consecutive_work_days=4,
                rest_recommended=False
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)

        assert profile.status in ["AVAILABLE", "WORKING", "ON_LEAVE"]

        # Create leave request
        now = datetime.now(timezone.utc)
        leave = LeaveRequest(
            worker_id=worker.id,
            start_date=now,
            end_date=now + timedelta(days=2),
            reason="Krishi Sakhi annual certification training workshop",
            status="pending"
        )
        db.add(leave)
        db.commit()
        db.refresh(leave)

        assert leave.status == "pending"

        # Approve leave
        leave.status = "approved"
        leave.approved_by_id = gov.id
        leave.reassignment_notes = "Assigned backup Krishi Sakhi Manjit Kaur for pending ground checks"
        profile.status = "ON_LEAVE"
        profile.is_off_today = True

        db.commit()
        db.refresh(leave)
        db.refresh(profile)

        assert leave.status == "approved"
        assert profile.status == "ON_LEAVE"
        assert profile.is_off_today is True
    finally:
        db.close()
