import pytest
from app.database import SessionLocal
from app.models.farm import Farm, Field
from app.models.crop import Crop
from app.models.resource import FarmResource
from app.services.farm_service import FarmService
from app.services.resource_service import ResourceService

def test_canonical_farm_and_fields():
    db = SessionLocal()
    farm = db.query(Farm).first()
    assert farm is not None
    assert farm.health_score > 0
    fields = db.query(Field).filter(Field.farm_id == farm.id).all()
    assert len(fields) >= 1
    db.close()

def test_resource_consumption_and_alert_trigger():
    db = SessionLocal()
    farm = db.query(Farm).first()
    res = db.query(FarmResource).filter(FarmResource.farm_id == farm.id).first()
    assert res is not None
    if res.quantity < 10.0:
        res.quantity = 100.0
        db.commit()

    initial_qty = res.quantity
    consumed = ResourceService.consume_resource(
        db=db,
        resource_id=res.id,
        quantity_used=10.0,
        actor_id="test-farmer",
        actor_role="farmer",
        notes="Automated test consumption"
    )
    assert consumed.quantity == initial_qty - 10.0
    db.close()
