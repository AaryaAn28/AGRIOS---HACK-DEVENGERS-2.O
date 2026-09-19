import pytest
from app.database import SessionLocal
from app.models.farm import Farm
from app.services.digital_twin_service import DigitalTwinService

def test_digital_twin_contract_and_snapshot():
    db = SessionLocal()
    farm = db.query(Farm).first()
    assert farm is not None

    snapshot = DigitalTwinService.get_snapshot(db, farm.id)
    assert snapshot is not None
    assert snapshot.version == "1.0-claude-contract"
    assert snapshot.canopy_coverage_pct > 0
    assert snapshot.ndvi_mean > 0

    # Test updating telemetry
    updated = DigitalTwinService.update_telemetry(db, farm.id, canopy_pct=82.0, stress_index=0.08)
    assert updated.canopy_coverage_pct == 82.0
    assert updated.stress_index == 0.08
    db.close()
