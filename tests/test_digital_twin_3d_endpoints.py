import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.farm import Farm
from app.database import get_db

client = TestClient(app)

def test_digital_twin_scene_data_endpoint():
    """Verify GET /api/digital-twin/scene-data/{farm_id} returns all required 3D scene elements."""
    # 1. Fetch scene data for default fallback
    response = client.get("/api/digital-twin/scene-data/default")
    assert response.status_code == 200
    data = response.json()

    assert "farm" in data
    assert "telemetry" in data
    assert "workers" in data
    assert "weather" in data
    assert "spatial_objects" in data
    assert "crop_plan" in data

    # Verify telemetry properties for 3D shaders and HUD
    telemetry = data["telemetry"]
    assert "canopy_coverage_pct" in telemetry
    assert "leaf_area_index" in telemetry
    assert "ndvi_mean" in telemetry
    assert "stress_index" in telemetry

    # Verify crop plan stages for time simulation slider
    crop_plan = data["crop_plan"]
    assert crop_plan is not None
    assert "stages" in crop_plan
    assert len(crop_plan["stages"]) > 0

    # Verify workers format for 3D character instancing
    workers = data["workers"]
    assert isinstance(workers, list)
    assert len(workers) >= 1
    w0 = workers[0]
    assert "id" in w0
    assert "name" in w0
    assert "role" in w0
    assert "avatar_color" in w0
    assert "position" in w0
    assert "x" in w0["position"]
    assert "z" in w0["position"]

def test_digital_twin_workers_endpoint():
    """Verify GET /api/digital-twin/workers/{farm_id} returns worker roster with 3D coordinates."""
    response = client.get("/api/digital-twin/workers/default")
    assert response.status_code == 200
    workers = response.json()
    assert isinstance(workers, list)
    assert len(workers) >= 1
    for w in workers:
        assert "name" in w
        assert "role" in w
        assert "avatar_color" in w
        assert "fatigue_index" in w
        assert "position" in w

def test_digital_twin_weather_state_endpoint():
    """Verify GET /api/digital-twin/weather-state/{farm_id} returns environmental telemetry."""
    response = client.get("/api/digital-twin/weather-state/default")
    assert response.status_code == 200
    weather = response.json()
    assert "condition" in weather
    assert "temperature_c" in weather
    assert "humidity_pct" in weather
    assert "wind_speed_kmh" in weather
    assert "time_of_day" in weather
    assert weather["time_of_day"] in ["dawn", "day", "dusk", "night"]

def test_digital_twin_canonical_farm_scene():
    """Verify GET /api/digital-twin/scene-data with existing canonical farm ID."""
    # Query farms first
    farms_resp = client.get("/api/farms")
    assert farms_resp.status_code == 200
    farms = farms_resp.json()
    assert len(farms) > 0
    target_farm_id = farms[0]["id"]

    response = client.get(f"/api/digital-twin/scene-data/{target_farm_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["farm"]["id"] == target_farm_id

def test_digital_twin_save_structure_layout_and_versioning():
    """Verify POST /api/farms/{farm_id}/structures creates layout versions for CAD-drawn roads and buildings."""
    # 1. Fetch available farm
    farms_resp = client.get("/api/farms")
    assert farms_resp.status_code == 200
    farms = farms_resp.json()
    target_farm_id = farms[0]["id"]

    # 2. Commit CAD spatial layout version
    cad_payload = {
        "created_by_id": "test_agronomist_001",
        "change_summary": "CAD World Editor: Added new tractor road ribbon and nursery polyhouse",
        "boundary": {
            "type": "Polygon",
            "coordinates": [[[-50.0, -40.0], [50.0, -40.0], [50.0, 40.0], [-50.0, 40.0], [-50.0, -40.0]]]
        },
        "spatial_objects": [
            {
                "id": "road_cad_01",
                "type": "road",
                "name": "CAD Access Ribbon",
                "waypoints": [{"x": -20.0, "z": 0.0}, {"x": 20.0, "z": 0.0}],
                "width": 3.5
            },
            {
                "id": "bldg_cad_01",
                "type": "building",
                "subtype": "polyhouse",
                "name": "CAD Research Polyhouse",
                "position": {"x": 10.0, "y": 0.0, "z": 15.0}
            }
        ],
        "planting_grid": {
            "field_name": "Field CAD 1",
            "crop": "Wheat",
            "total_plants": 1500,
            "healthy_plants": 1490,
            "stressed_plants": 10,
            "dead_plants": 0
        }
    }

    post_resp = client.post(f"/api/farms/{target_farm_id}/structures", json=cad_payload)
    assert post_resp.status_code == 200
    post_data = post_resp.json()
    assert post_data["is_current"] is True
    assert post_data["version_number"] >= 2

    # 3. Verify GET /api/digital-twin/scene-data/{farm_id} delivers the newly saved layout
    scene_resp = client.get(f"/api/digital-twin/scene-data/{target_farm_id}")
    assert scene_resp.status_code == 200
    scene_data = scene_resp.json()
    assert scene_data["spatial_objects"] is not None
    assert len(scene_data["spatial_objects"]) >= 2
    obj_ids = [o.get("id") for o in scene_data["spatial_objects"]]
    assert "road_cad_01" in obj_ids
    assert "bldg_cad_01" in obj_ids
    assert scene_data["planting_grid"]["total_plants"] == 1500


def test_digital_twin_crop_plan_matching_calibrated_crop():
    """Verify that when a farm is calibrated or updated with a specific crop (e.g. Rice, Tomato),
    the scene-data endpoint reflects that crop in planting_grid and synthesized crop_plan."""
    farms_resp = client.get("/api/farms")
    assert farms_resp.status_code == 200
    target_farm_id = farms_resp.json()[0]["id"]

    for crop_name in ["Rice", "Tomato", "Maize", "Cotton"]:
        payload = {
            "created_by_id": "agro_test_bot",
            "change_summary": f"Switch crop to {crop_name}",
            "planting_grid": {
                "field_name": f"{crop_name} Sector",
                "crop": crop_name,
                "total_plants": 1200,
                "healthy_plants": 1150,
                "stressed_plants": 50,
                "dead_plants": 0
            }
        }
        res = client.post(f"/api/farms/{target_farm_id}/structures", json=payload)
        assert res.status_code == 200

        scene_res = client.get(f"/api/digital-twin/scene-data/{target_farm_id}")
        assert scene_res.status_code == 200
        scene_data = scene_res.json()
        assert scene_data["planting_grid"]["crop"] == crop_name
        assert scene_data["crop_plan"]["crop_name"] == crop_name
        assert len(scene_data["crop_plan"]["stages"]) > 0

