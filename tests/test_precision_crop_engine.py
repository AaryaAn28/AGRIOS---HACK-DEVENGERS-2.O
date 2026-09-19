import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, SessionLocal
from app.models.user import User

client = TestClient(app)

def test_precision_crop_engine_generate_and_calibrate():
    # Setup test agronomist
    db = SessionLocal()
    test_agro = db.query(User).filter(User.role == "agronomist").first()
    agro_id = test_agro.id if test_agro else "agro-test-id"
    db.close()

    payload = {
        "agronomist_id": agro_id,
        "farm_id": "test-farm-precision-001",
        "crop_name": "Wheat",
        "duration_days": 120,
        "state": "Odisha",
        "district_basin": "Mahanadi River Basin (Cuttack/Jagatsinghpur)",
        "farming_classification": "Terrestrial Field Crops",
        "soil_texture": "Alluvial Silt Loam",
        "soil_ph": 6.8,
        "water_source": "Canal Distributary Sluice + Solar Drip",
        "irrigation_method": "Automated Drip Lines",
        "worker_daily_hours_cap": 7.0,
        "workers": [
            {"name": "Sunita Devi (Krishi Sakhi)", "role": "worker", "daily_hours_cap": 7.0},
            {"name": "Mamata Behera (Field Assistant)", "role": "worker", "daily_hours_cap": 7.0}
        ],
        "farmers": [
            {"name": "Balwinder Singh", "role": "farmer"}
        ],
        "mechanization": [
            "Tractor & Multi-Row Seed Drill",
            "Laser Land Leveler",
            "Solar Drip Fertigation Automation"
        ],
        "fatigue_protection_rules": {
            "max_continuous_hours": 4.0,
            "thermal_cutoff": 38.0,
            "rain_lockdown_pct": 60,
            "fatigue_cap_pct": 85
        }
    }

    res = client.post("/api/crop-plans/generate-and-calibrate", json=payload)
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["crop_name"] == "Wheat"
    assert data["state"] == "Odisha"
    assert data["district_basin"] == "Mahanadi River Basin (Cuttack/Jagatsinghpur)"
    assert "worker_fatigue_matrix" in data
    assert len(data["worker_fatigue_matrix"]) == 2
    assert "weather_adaptation_protocols" in data
    assert "yield_projection" in data

    # Verify worker fatigue matrix calculation
    w1 = data["worker_fatigue_matrix"][0]
    assert w1["worker_name"] == "Sunita Devi (Krishi Sakhi)"
    assert w1["daily_hours_cap"] == 7.0
    assert "fatigue_index_pct" in w1
    assert "load_status" in w1

def test_crop_stage_weather_adaptation_patch():
    farm_id = "test-farm-precision-001"
    
    # Trigger Rain protocol
    res_rain = client.patch(f"/api/crop-plans/farm/{farm_id}/modify-stage", json={
        "stage_num": 1,
        "adaptation_protocol": "Precipitation Safeguard: Suspended Foliar Sprays, Opened Drainage Gates"
    })
    assert res_rain.status_code == 200
    data_rain = res_rain.json()
    assert "Precipitation Safeguard" in data_rain["active_adaptation_protocol"]

    # Trigger Heatwave protocol
    res_heat = client.patch(f"/api/crop-plans/farm/{farm_id}/modify-stage", json={
        "stage_num": 1,
        "adaptation_protocol": "Thermal Stress Shift: Labor 05:30-09:30 & 17:00-19:30, Night Drip Active",
        "inputs": ["Anti-transpirant KNO3 (1.5%)", "Basal Compost"]
    })
    assert res_heat.status_code == 200
    data_heat = res_heat.json()
    assert "Thermal Stress Shift" in data_heat["active_adaptation_protocol"]
    assert "Anti-transpirant KNO3 (1.5%)" in data_heat["stage"]["inputs"]

def test_activate_crop_plan_and_task_dispatch():
    farm_id = "test-farm-precision-001"
    # Get the plan
    get_res = client.get(f"/api/crop-plans/farm/{farm_id}")
    assert get_res.status_code == 200
    plan = get_res.json()

    # Activate
    act_res = client.post(f"/api/crop-plans/farm/{farm_id}/activate", json=plan)
    assert act_res.status_code == 200
    act_data = act_res.json()
    assert act_data["status"] == "SUCCESS"
    assert len(act_data["dispatched_tasks"]) > 0

def test_google_auth_with_role_preservation():
    # Google sign-up as agronomist
    res_agro = client.post("/api/auth/google", json={
        "token": "mock_google_token_agro",
        "role": "agronomist",
        "email": "dr.priya.agro@agrios.in",
        "name": "Dr. Priya Agronomist"
    })
    assert res_agro.status_code == 200
    data_agro = res_agro.json()
    assert data_agro["user"]["role"] == "agronomist"
    assert data_agro["user"]["email"] == "dr.priya.agro@agrios.in"
    assert "access_token" in data_agro

def test_pisciculture_master_plan_and_day_schedules():
    farm_id = "test-farm-aqua-001"
    payload = {
        "farm_id": farm_id,
        "crop_name": "Pisciculture",
        "duration_days": 195,
        "state": "Odisha",
        "district_basin": "Coastal Delta (Puri/Cuttack/Balasore)",
        "farming_classification": "Pisciculture & Aquaculture",
        "soil_texture": "Clay-Loam Water-Retentive Pond Bed Bottom",
        "soil_ph": 7.5,
        "water_source": "Perennial Canal Sluice & Deep Borewell Feed",
        "irrigation_method": "Paddlewheel Surface Aeration & Sluice Circulation",
        "worker_daily_hours_cap": 7.5,
        "workers": [
            {"name": "Sunita Devi (Krishi Sakhi)", "role": "worker", "daily_hours_cap": 7.0},
            {"name": "Mamata Behera (Field Assistant)", "role": "worker", "daily_hours_cap": 7.0}
        ],
        "farmers": [
            {"name": "Balwinder Singh", "role": "farmer", "daily_hours_cap": 8.0}
        ],
        "mechanization": [
            "Paddle Aerators & O2 Probes",
            "Automated Demand Pellet Feeders",
            "Cast Net & Drag Seining Gear"
        ],
        "fatigue_protection_rules": {
            "max_continuous_hours": 4.0,
            "thermal_cutoff": 38.0,
            "rain_lockdown_pct": 60,
            "fatigue_cap_pct": 85
        }
    }

    res = client.post("/api/crop-plans/generate-and-calibrate", json=payload)
    assert res.status_code == 200, res.text
    plan = res.json()
    assert plan["crop_name"] == "Pisciculture"
    assert plan["farming_classification"] == "Pisciculture & Aquaculture"

    # Verify each stage is at least 10 days
    for stage in plan["stages"]:
        duration = stage["end_day"] - stage["start_day"] + 1
        assert duration >= 10, f"Stage {stage['stage_num']} is less than 10 days: {duration}"
        # Verify granular day-by-day schedule is present
        assert "daily_schedule" in stage
        assert len(stage["daily_schedule"]) >= 10
        for day_plan in stage["daily_schedule"]:
            assert "tasks" in day_plan
            # Verify 4 tasks assigned across personnel
            assert len(day_plan["tasks"]) == 4

def test_day_context_and_dispatch_day_tasks():
    farm_id = "test-farm-aqua-001"

    # Test Day 30 Outbreak Context
    ctx_res = client.get(f"/api/crop-plans/day-context/{farm_id}/30?crop_name=Pisciculture")
    assert ctx_res.status_code == 200
    ctx = ctx_res.json()
    assert ctx["day_number"] == 30
    assert ctx["pest_outbreak_active"] is True
    assert "North" in ctx["outbreak_sector"]
    assert "prescription" in ctx

    # Test Dispatching Day 30 Tasks
    dispatch_res = client.post("/api/crop-plans/dispatch-day-tasks", json={
        "farm_id": farm_id,
        "day_number": 30,
        "crop_name": "Pisciculture"
    })
    assert dispatch_res.status_code == 200
    dispatch_data = dispatch_res.json()
    assert dispatch_data["status"] == "SUCCESS"
    assert dispatch_data["day_number"] == 30
    assert len(dispatch_data["dispatched_tasks"]) == 4
    assert dispatch_data["pest_outbreak_active"] is True

