import pytest
import uuid
import json
from app.database import engine, Base, ensure_schema, SessionLocal
import app.models # Ensure all models are registered
from app.models.user import User
from app.models.farm import Farm, Field
from app.models.resource import FarmResource
from app.models.camera import Camera
from app.models.farm_structure import FarmStructureVersion

from app.utils.security import hash_password

@pytest.fixture(autouse=True, scope="session")
def setup_test_db():
    ensure_schema()
    db = SessionLocal()
    try:
        # Ensure test government admin
        gov = db.query(User).filter(User.role == "government").first()
        if not gov:
            gov = User(id="test_gov", full_name="Dr. Vikramaditya Sen", email="gov@agrios.in", role="government", hashed_password=hash_password("Admin@123"))
            db.add(gov)

        # Ensure test farmer
        farmer = db.query(User).filter(User.role == "farmer").first()
        if not farmer:
            farmer = User(id="test_farmer", full_name="Balwinder Singh", email="farmer@agrios.in", role="farmer", hashed_password=hash_password("Admin@123"))
            db.add(farmer)

        # Ensure test agronomist
        agronomist = db.query(User).filter(User.role == "agronomist").first()
        if not agronomist:
            agronomist = User(id="test_agronomist", full_name="Dr. Priya Sharma", email="agronomist@agrios.in", role="agronomist", hashed_password=hash_password("Admin@123"))
            db.add(agronomist)

        # Ensure test worker
        worker = db.query(User).filter(User.role == "worker").first()
        if not worker:
            worker = User(id="test_worker", full_name="Sunita Devi", email="worker@agrios.in", role="worker", hashed_password=hash_password("Admin@123"))
            db.add(worker)

        db.commit()

        # Ensure demo farm fixture for tests
        farm = db.query(Farm).first()
        if not farm:
            farm = Farm(
                id="9fca8bd1-344e-46b1-b5f8-4a94ebd4167c",
                name="Green Valley Model Farm",
                owner_id=farmer.id,
                assigned_worker_id=worker.id,
                assigned_agronomist_id=agronomist.id,
                district="Ludhiana",
                state="Punjab",
                latitude=30.9010,
                longitude=75.8573,
                total_area_acres=14.5,
                health_score=91.5,
                status="optimal"
            )
            db.add(farm)
            db.commit()
        else:
            if not farm.latitude:
                farm.latitude = 30.9010
            if not farm.longitude:
                farm.longitude = 75.8573
            db.commit()

        field = db.query(Field).filter(Field.farm_id == farm.id).first()
        if not field:
            field = Field(farm_id=farm.id, name="Field 1 (North Parcel)", area_acres=7.5)
            db.add(field)
            db.commit()

        from app.models.crop import Crop
        crop = db.query(Crop).filter(Crop.farm_id == farm.id).first()
        if not crop:
            crop = Crop(farm_id=farm.id, field_id=field.id, crop_name="Wheat", variety="PBW-550")
            db.add(crop)

        res1 = db.query(FarmResource).filter(FarmResource.farm_id == farm.id).first()
        if not res1:
            res1 = FarmResource(farm_id=farm.id, resource_type="water", name="Tubewell Reserve", current_stock=450000, unit="liters", capacity=500000)
            db.add(res1)

        cam1 = db.query(Camera).filter(Camera.farm_id == farm.id).first()
        if not cam1:
            cam1 = Camera(farm_id=farm.id, field_id=field.id, name="Solar PTZ Cam 01", ip_stream_url="rtsp://127.0.0.1:8554/cam1")
            db.add(cam1)

        struct1 = db.query(FarmStructureVersion).filter(FarmStructureVersion.farm_id == farm.id).first()
        if not struct1:
            struct1 = FarmStructureVersion(
                farm_id=farm.id,
                version_number=1,
                created_by_id=agronomist.id,
                change_summary="Test structure",
                planting_grid_json=json.dumps({"total_plants": 1200, "healthy_plants": 1180, "stressed_plants": 20, "dead_plants": 0}),
                is_current=True
            )
            db.add(struct1)

        db.commit()
    finally:
        db.close()
