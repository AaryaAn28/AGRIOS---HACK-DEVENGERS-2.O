import pytest
from app.database import SessionLocal
from app.services.simulator_service import SimulatorService
from app.models.risk import RiskAlert
from app.models.farm import Farm

def test_simulator_pest_outbreak_scenario():
    db = SessionLocal()
    farm = db.query(Farm).first()
    assert farm is not None

    res = SimulatorService.trigger_scenario(db, "pest_outbreak", farm_id=farm.id)
    assert res["scenario"] == "pest_outbreak"
    assert "alert_id" in res

    alert = db.query(RiskAlert).filter(RiskAlert.id == res["alert_id"]).first()
    assert alert is not None
    assert alert.severity == "critical"

    db.close()

def test_simulator_reset_baseline():
    db = SessionLocal()
    res = SimulatorService.trigger_scenario(db, "reset_demo")
    assert res["scenario"] == "reset_demo"
    farm = db.query(Farm).first()
    assert farm.health_score == 92.5
    assert farm.status == "optimal"
    db.close()
