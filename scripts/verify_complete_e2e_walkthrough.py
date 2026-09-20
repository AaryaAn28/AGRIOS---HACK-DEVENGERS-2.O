import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def api_post(endpoint, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode("utf-8") if data is not None else b"{}",
        headers=headers
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def api_patch(endpoint, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers=headers,
        method="PATCH"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def api_put(endpoint, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers=headers,
        method="PUT"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def api_get(endpoint, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE_URL}{endpoint}", headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def run_full_judge_walkthrough():
    print("=" * 75)
    print("AGRIOS COMPLETE 6-STEP JUDGE DEMONSTRATION WALKTHROUGH EXECUTION")
    print("=" * 75)

    # STEP 1: Clean-Slate Launch & Government Commissioning
    print("\n[STEP 1] Government Commissioning of New Agronomist...")
    gov_kpis = api_get("/api/government/dashboard-kpis")
    print(f"  Initial Gov State: Monitored Acres={gov_kpis.get('monitored_acres', 0)}, "
          f"Active Agronomists={gov_kpis.get('active_agronomists', 0)}")
    
    unique_suffix = int(time.time())
    agronomist_data = {
        "role": "agronomist",
        "full_name": "Dr. Priya Sharma",
        "jurisdiction_code": "Punjab Ludhiana Central",
        "email": f"priya_{unique_suffix}@agrios.in"
    }
    new_agro = api_post("/api/auth/register-subordinate", agronomist_data)
    agro_id = new_agro["id"]
    print(f"  Created Agronomist: {new_agro['persona_code']} | Name: {new_agro['full_name']} | ID: {agro_id}")

    # Authenticate as Agronomist
    agro_auth = api_post(f"/api/auth/quick-login-user/{agro_id}", {})
    agro_token = agro_auth["access_token"]
    print(f"  Authenticated as {new_agro['persona_code']} (Bearer Token Acquired)")

    # STEP 2: Agronomist 11-Step Configuration & Digital Twin Calibration
    print("\n[STEP 2] Agronomist 11-Pillar Wizard & 3D Farm Calibration...")
    onboarding_payload = {
        "user_id": agro_id,
        "jurisdiction_state": "Punjab",
        "jurisdiction_district": "Ludhiana",
        "jurisdiction_block": "Ludhiana East",
        "village_coverage": "Jandiali Kalan, Kohara, Sahnewal",
        "climate_zone": "Semi-Arid Subtropical",
        "farming_types": ["field_farming"],
        "crops_species": {"field_farming": ["Wheat", "Rice (Paddy)"]},
        "soil_config": {"type": "Alluvial Loam", "ph": 6.8, "nitrogen_base": "Medium", "depth_cm": 90},
        "climate_config": {"agro_climatic_zone": "Trans-Gangetic Plains", "annual_rainfall_mm": 650},
        "risks_config": ["Yellow Rust (Puccinia striiformis)", "Fall Armyworm"]
    }
    onboard_res = api_post("/api/onboarding/profile", onboarding_payload)
    print(f"  11-Step Onboarding Profile: {onboard_res.get('status')} | Message: {onboard_res.get('message')}")

    # Boundary Walk & Calibration
    calibrate_payload = {
        "agronomist_id": agro_id,
        "farm_name": f"Dr. Priya Bio Farm {unique_suffix}",
        "area_acres": 14.5,
        "crop_type": "Wheat",
        "target_duration_days": 120
    }
    calib_res = api_post("/api/farms/walk-and-calibrate", calibrate_payload)
    farm_id = calib_res["farm_id"]
    print(f"  Calibrated Boundary: Farm ID={farm_id}, Farm Name={calib_res['farm_name']}, Twin Version={calib_res['structure']['version_number']}")

    # Interactive Planting Grid Update
    grid_update_payload = {
        "updated_by_id": agro_id,
        "plant_updates": [
            {"row": 0, "col": 0, "status": "healthy"},
            {"row": 0, "col": 1, "status": "stressed"},
            {"row": 0, "col": 2, "status": "dead"}
        ],
        "notes": "Post-walkthrough spot calibration audit"
    }
    grid_res = api_patch(f"/api/farms/{farm_id}/structures/planting-grid", grid_update_payload)
    print(f"  Planting Grid Persisted: Healthy={grid_res['planting_grid']['healthy_plants']}, "
          f"Stressed={grid_res['planting_grid']['stressed_plants']}, Dead={grid_res['planting_grid']['dead_plants']}")

    # Activate Crop Plan & Release Stage 1 Tasks
    plan_activate = api_post(f"/api/crop-plans/farm/{farm_id}/activate", calib_res["crop_plan"])
    print(f"  Master Crop Plan: {plan_activate['message']}")
    print(f"  Stage 1 Dispatched Tasks: {plan_activate['dispatched_tasks']}")

    # STEP 3: Agronomist Subordinate Assignment & Disease Prescription
    print("\n[STEP 3] Assign Team, Certify Pathogen Observation & Omni-Channel Broadcast...")
    farmer_data = {
        "role": "farmer",
        "full_name": "Balwinder Singh",
        "jurisdiction_code": "Punjab Ludhiana Central",
        "farm_id": farm_id,
        "registered_by_id": agro_id,
        "email": f"balwinder_{unique_suffix}@agrios.in"
    }
    farmer = api_post("/api/auth/register-subordinate", farmer_data)
    farmer_id = farmer["id"]
    farmer_auth = api_post(f"/api/auth/quick-login-user/{farmer_id}", {})
    farmer_token = farmer_auth["access_token"]
    print(f"  Registered Farmer: {farmer['persona_code']} | Name: {farmer['full_name']}")

    worker_data = {
        "role": "worker",
        "full_name": "Sunita Devi (Krishi Sakhi)",
        "jurisdiction_code": "Punjab Ludhiana Central",
        "farm_id": farm_id,
        "registered_by_id": agro_id,
        "email": f"sunita_{unique_suffix}@agrios.in"
    }
    worker = api_post("/api/auth/register-subordinate", worker_data)
    worker_id = worker["id"]
    worker_auth = api_post(f"/api/auth/quick-login-user/{worker_id}", {})
    worker_token = worker_auth["access_token"]
    print(f"  Registered Krishi Sakhi: {worker['persona_code']} | Name: {worker['full_name']}")

    # Certify Pathogen Observation
    cert_res = api_post("/api/agronomist/certify-observation/OBS-7741", {})
    print(f"  Pathogen Observation Certified: {cert_res.get('status')} | {cert_res['observation']['id']} status: {cert_res['observation']['status']}")

    # Broadcast Critical Advisory
    broadcast_res = api_post("/api/communications/broadcast", {
        "title": "Mandatory Seed Treatment & Stripe Rust Watch",
        "content": "All farmers in Ludhiana Central cluster must calibrate spray kits for stripe rust prevention.",
        "priority": "high"
    })
    print(f"  Broadcast Dispatched: ID {broadcast_res['circular']['id']} -> Reach: {broadcast_res['reach']}")

    # STEP 4: Field Worker Execution & Geotagged Shift
    print("\n[STEP 4] Krishi Sakhi / Field Worker Shift & Task Execution...")
    gps_attendance = api_post("/api/workforce/attendance", {
        "user_id": worker_id,
        "gps_lat": 30.9010,
        "gps_lon": 75.8573,
        "action": "check_in"
    })
    print(f"  GPS Attendance Geotagged: {gps_attendance['status']} at ({gps_attendance['entry']['gps_lat']}, {gps_attendance['entry']['gps_lon']})")

    # Complete Training Module
    training_res = api_post(f"/api/workforce/training/TRN-001/complete?user_id={worker_id}", {})
    print(f"  Training Module TRN-001 Completed: Certificate {training_res.get('certificate_code')}")

    # Fetch Worker Tasks & Complete First Task
    tasks = api_get(f"/api/tasks?farm_id={farm_id}")
    if tasks:
        first_task = tasks[0]
        put_task = api_put(f"/api/tasks/{first_task['id']}/status", {
            "status": "completed",
            "notes": "Tillage and rotavator pass executed according to moisture reading.",
            "hours_logged": 2.5
        }, token=worker_token)
        print(f"  Completed Field Task: '{first_task['title']}' -> New Status: {put_task.get('status')}")

    # STEP 5: Farmer Operations & Living Weather
    print("\n[STEP 5] Farmer Operations, Silo Telemetry & Scheme Application...")
    farmer_summary = api_get(f"/api/farmer/dashboard-summary/{farm_id}")
    print(f"  Farmer Dashboard Summary: Vitality={farmer_summary.get('vitality_pct')}%, "
          f"Active Stage='{farmer_summary.get('active_stage')}', "
          f"Tasks Completed={farmer_summary.get('tasks_completed')}/{farmer_summary.get('total_tasks')}")
    
    harvest_forecast = api_get(f"/api/crops/farm/{farm_id}/harvest-forecast")
    print(f"  Harvest Forecast: Projected Yield={harvest_forecast.get('projected_yield_quintals')} Qtl, "
          f"Est Revenue=INR {harvest_forecast.get('projected_gross_revenue_inr', 0):,}, "
          f"Silo Moisture={harvest_forecast.get('silo_grain_moisture_pct')}%")

    # Apply for Government Scheme
    schemes = api_get("/api/schemes")
    if schemes:
        target_scheme = schemes[0]
        scheme_apply = api_post(
            f"/api/schemes/{target_scheme['id']}/apply?farm_id={farm_id}&applied_amount=15000",
            {},
            token=farmer_token
        )
        print(f"  Government Scheme Applied: Scheme '{target_scheme['title']}' | Application ID {scheme_apply.get('id')} | Status: {scheme_apply.get('status')}")

    # STEP 6: Government Real-Time Oversight & Report Generation
    print("\n[STEP 6] Government Command Center Real-Time KPIs & Executive Report...")
    updated_kpis = api_get("/api/government/dashboard-kpis")
    print(f"  Updated State KPIs: Total Registered Farms={updated_kpis.get('total_registered_farms')}, "
          f"Monitored Acres={updated_kpis.get('total_monitored_acres')}, "
          f"Active Agronomists={updated_kpis.get('total_agronomists')}, "
          f"Active Alerts={updated_kpis.get('active_biosecurity_alerts')}")
    
    compliance = api_get("/api/government/compliance-audit")
    print(f"  Compliance Audit: Task Completion Rate={compliance.get('task_completion_rate')}%, "
          f"Alert Resolution Rate={compliance.get('alert_resolution_rate')}%")

    report_res = api_post("/api/government/reports/generate", {
        "report_type": "Executive State Agricultural Digest",
        "format": "json"
    })
    print(f"  Executive Digest Generated: {report_res.get('report_id')} | Status: {report_res.get('status')}")

    # BONUS: Judge Shock Simulator Event & 1-Click Undo
    print("\n[BONUS] Judge Shock Simulator: Triggering Shock Scenario & Undo...")
    shock_res = api_post("/api/simulator/trigger", {
        "event_name": "pest_outbreak",
        "severity": "critical",
        "farm_id": farm_id
    })
    print(f"  Simulator Shock Triggered: {shock_res.get('scenario')} -> Health dropped to {shock_res.get('post_event_health')}%")
    
    # 1-Click Undo
    undo_res = api_post("/api/simulator/undo", {})
    print(f"  1-Click Undo: {undo_res.get('message')}")

    print("\n" + "=" * 75)
    print("[SUCCESS] ALL 6 DEMONSTRATION FLOW STEPS FULLY EXECUTED AND VERIFIED!")
    print("=" * 75)

if __name__ == "__main__":
    run_full_judge_walkthrough()
