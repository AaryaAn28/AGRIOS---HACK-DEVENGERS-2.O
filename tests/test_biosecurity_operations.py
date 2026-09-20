import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_pest_radar_hotspots():
    res = client.get("/api/government/pest-radar/hotspots")
    assert res.status_code == 200
    data = res.json()
    assert "metrics" in data
    assert "hotspots" in data
    assert "satellite_radar_telemetry" in data
    assert len(data["hotspots"]) >= 5
    assert data["metrics"]["active_hotspots_count"] >= 5
    assert data["metrics"]["state_biosecurity_readiness_pct"] > 50.0

    # Verify first hotspot structure
    h = data["hotspots"][0]
    assert "zone_name" in h
    assert "district" in h
    assert "pest_species" in h
    assert "spore_density_m3" in h
    assert "contagion_probability_pct" in h
    assert "dispersion_radius_km" in h

def test_simulate_pest_spread():
    # Fetch a real hotspot id first
    radar_res = client.get("/api/government/pest-radar/hotspots")
    hotspot_id = radar_res.json()["hotspots"][0]["id"]

    # 1. Simulate uncontrolled 7-day spread
    payload_uncontrolled = {
        "hotspot_id": hotspot_id,
        "forecast_days": 7,
        "wind_speed_kmh": 15.0,
        "humidity_pct": 70.0,
        "temperature_c": 29.0,
        "intervention": "none"
    }
    res1 = client.post("/api/government/pest-radar/simulate-spread", json=payload_uncontrolled)
    assert res1.status_code == 200
    sim1 = res1.json()
    assert sim1["forecast_days"] == 7
    assert sim1["prediction"]["projected_spread_radius_km"] > 0
    assert sim1["prediction"]["potential_economic_loss_inr_lakhs"] > 0

    # 2. Simulate 7-day spread with chemical cordon
    payload_cordon = {
        "hotspot_id": hotspot_id,
        "forecast_days": 7,
        "wind_speed_kmh": 15.0,
        "humidity_pct": 70.0,
        "temperature_c": 29.0,
        "intervention": "chemical_cordon"
    }
    res2 = client.post("/api/government/pest-radar/simulate-spread", json=payload_cordon)
    assert res2.status_code == 200
    sim2 = res2.json()
    # Chemical cordon should significantly dampen the projected radius and loss
    assert sim2["prediction"]["projected_spread_radius_km"] < sim1["prediction"]["projected_spread_radius_km"]
    assert sim2["prediction"]["containment_efficacy_pct"] >= 70.0

def test_biosecurity_buffer_zone_lifecycle():
    # 1. Declare new buffer zone
    create_payload = {
        "district": "Firozpur",
        "basin": "Sutlej River Agricultural Belt",
        "pest_type": "Whitefly Vector Complex (Bemisia tabaci)",
        "radius_km": 6.5,
        "severity": "high",
        "cordon_level": "Level 2: Chemical Cordon & Movement Restriction",
        "chemical_barrier_agent": "Diafenthiuron 50% WP + Border Neem Shield",
        "action_taken": "Mobile spray rigs deployed along NH-5 corridor."
    }
    create_res = client.post("/api/government/biosecurity/buffer-zones", json=create_payload)
    assert create_res.status_code == 200
    zone = create_res.json()
    assert zone["district"] == "Firozpur"
    assert zone["radius_km"] == 6.5
    assert "AGRI-SEC/PUN/ORD-" in zone["legal_order_number"]
    assert zone["active_checkpoints"] >= 5
    assert zone["containment_status"] == "enforced"

    zone_id = zone["id"]

    # 2. List zones and verify it exists
    list_res = client.get("/api/government/biosecurity/buffer-zones")
    assert list_res.status_code == 200
    zones = list_res.json()
    found = [z for z in zones if z["id"] == zone_id]
    assert len(found) == 1

    # 3. Update status to monitoring
    update_res = client.put(f"/api/government/biosecurity/buffer-zones/{zone_id}/status", json={
        "status": "monitoring",
        "action_note": "Spore density dropped by 65%; transitioning from emergency cordon to monitoring."
    })
    assert update_res.status_code == 200
    updated_zone = update_res.json()
    assert updated_zone["containment_status"] == "monitoring"
    assert "dropped by 65%" in updated_zone["action_taken"]

def test_ipm_protocols():
    res = client.get("/api/government/biosecurity/ipm-protocols")
    assert res.status_code == 200
    protocols = res.json()
    assert len(protocols) >= 5
    crops = [p["crop"] for p in protocols]
    assert "Rice" in crops
    assert "Wheat" in crops
    assert "Cotton" in crops
    assert "Maize" in crops

def test_cordon_audit_report():
    res = client.get("/api/government/biosecurity/reports/cordon-audit")
    assert res.status_code == 200
    report = res.json()
    assert "report_id" in report
    assert "PUN-BIOSEC-" in report["report_id"]
    assert "summary_metrics" in report
    assert "active_cordons" in report
    assert "surveillance_radar_hotspots" in report
    assert "phytosanitary_directives" in report
    assert report["status"] == "OFFICIALLY_GAZETTED"
    assert "Dr. Vikramaditya Sen" in report["signatory"]["name"]
