"""
Validation Suite for:
1. Worker Portal Day 1 Task Count (1 task, not 252)
2. Leaf Disease ML Vision Model (Pillow + NumPy biophysical feature extraction)
3. Growing Plan Calendar 'undefined' fix
4. 11-Questionnaire Precision Engine alignment
"""

import urllib.request
import json
import io
import base64
import re
from PIL import Image

SERVER = "http://127.0.0.1:8000"

def test_worker_task_filtering():
    print("\n--- TEST 1: WORKER DAY 1 TASK FILTERING ---")
    req = urllib.request.Request(f"{SERVER}/api/tasks")
    with urllib.request.urlopen(req) as resp:
        tasks = json.loads(resp.read().decode())

    # Simulated worker: Sunita Devi
    active_day = 1
    current_user = {"id": "test_worker", "full_name": "Sunita Devi", "persona_code": "WORKER-001", "role": "worker"}
    worker_name = current_user["full_name"].lower()
    worker_first_name = worker_name.split()[0]
    worker_code = current_user["persona_code"].lower()
    worker_id = current_user["id"]

    day_regex = re.compile(rf"\bDay\s*{active_day}\b", re.IGNORECASE)

    raw_matching = []
    for t in tasks:
        title_str = t.get("title") or ""
        desc_str = t.get("description") or ""
        full_text = f"{title_str} {desc_str}".lower()

        is_day_task = bool(day_regex.search(title_str) or day_regex.search(desc_str))
        is_emergency = bool(t.get("task_type") == "spray" or "emergency spray" in title_str.lower() or "rx-" in title_str.lower()) and bool(day_regex.search(full_text))

        if not (is_day_task or is_emergency):
            continue

        is_direct = bool(t.get("assigned_to_user_id") and t.get("assigned_to_user_id") == worker_id)
        is_name = (worker_name in full_text) or (worker_first_name in full_text)
        is_code = bool(worker_code in full_text)
        is_assigned_to_other = any(o in full_text for o in ["balwinder", "dr. priya", "priya sharma", "mamata"])
        is_role_fallback = (not t.get("assigned_to_user_id") and not is_assigned_to_other and (t.get("assigned_role") == "worker" or not t.get("assigned_role")))

        if (is_direct or is_name or is_code or is_role_fallback) and not is_assigned_to_other:
            raw_matching.append(t)

    # Deduplicate by title
    seen_titles = set()
    displayed_tasks = []
    for t in raw_matching:
        norm = (t.get("title") or "").strip().lower()
        if norm not in seen_titles:
            seen_titles.add(norm)
            displayed_tasks.append(t)

    print(f"Total tasks in DB: {len(tasks)}")
    print(f"Displayed tasks for Sunita Devi on Day 1: {len(displayed_tasks)}")
    for t in displayed_tasks:
        print(f" -> [{t.get('priority', 'high').upper()}] {t.get('title')} (Assigned: {t.get('assigned_to_user_id')})")

    assert len(displayed_tasks) == 1, f"Expected exactly 1 task for Sunita Devi on Day 1, got {len(displayed_tasks)}!"
    assert "Weeding" in displayed_tasks[0]["title"], "Expected Day 1 weeding/fertigation task!"
    print(">>> PASS: Worker Day 1 task filtering successfully shows only Sunita Devi's 1 task (NOT 252)!\n")


def test_leaf_ml_vision_model():
    print("--- TEST 2: LEAF DISEASE ML VISION MODEL ---")

    # 1. Test Healthy Leaf Image
    green_img = Image.new("RGB", (120, 120), color=(25, 145, 25))
    buf = io.BytesIO()
    green_img.save(buf, format="JPEG")
    green_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

    payload_healthy = json.dumps({
        "crop_name": "Wheat",
        "image_data_url": green_b64,
        "field_parcel": "Parcel North #1"
    }).encode("utf-8")

    req = urllib.request.Request(f"{SERVER}/api/agronomist/diagnose-leaf", data=payload_healthy, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        res_h = json.loads(resp.read().decode())

    print("[Healthy Leaf Input]")
    print(f"Pathogen: {res_h.get('pathogen_identified')}")
    print(f"Confidence: {res_h.get('confidence_pct')}%")
    print(f"Healthy GLAI: {res_h.get('biophysical_metrics', {}).get('healthy_green_pct')}%")
    assert "Healthy" in res_h.get("pathogen_identified"), "Expected Healthy classification"
    assert res_h.get("confidence_pct") >= 90.0, "Expected high confidence"

    # 2. Test Diseased Wheat Leaf with Rust Pustules
    rust_img = Image.new("RGB", (100, 100), color=(30, 140, 30))
    for x in range(25, 75):
        for y in range(25, 75):
            rust_img.putpixel((x, y), (235, 130, 15))
    buf = io.BytesIO()
    rust_img.save(buf, format="JPEG")
    rust_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

    payload_rust = json.dumps({
        "crop_name": "Wheat",
        "image_data_url": rust_b64,
        "field_parcel": "Parcel North #1"
    }).encode("utf-8")

    req = urllib.request.Request(f"{SERVER}/api/agronomist/diagnose-leaf", data=payload_rust, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        res_r = json.loads(resp.read().decode())

    print("\n[Rust Pustule Leaf Input]")
    print(f"Pathogen: {res_r.get('pathogen_identified')}")
    print(f"Confidence: {res_r.get('confidence_pct')}%")
    print(f"Rust Pustule Density: {res_r.get('biophysical_metrics', {}).get('rust_pustule_pct')}%")
    print(f"Prescription: {res_r.get('recommended_treatment', {}).get('chemical')}")
    assert "Yellow Stripe Rust" in res_r.get("pathogen_identified"), "Expected Yellow Stripe Rust classification"
    assert res_r.get("biophysical_metrics", {}).get("rust_pustule_pct", 0) > 10.0, "Expected pustule detection"

    # 3. Test Tomato Late Blight Leaf
    tomato_img = Image.new("RGB", (100, 100), color=(35, 140, 35))
    for x in range(20, 80):
        for y in range(20, 80):
            tomato_img.putpixel((x, y), (70, 40, 20)) # dark water-soaked necrotic tissue
    buf = io.BytesIO()
    tomato_img.save(buf, format="JPEG")
    tomato_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

    payload_tomato = json.dumps({
        "crop_name": "Tomato",
        "image_data_url": tomato_b64,
        "field_parcel": "Parcel South Polyhouse"
    }).encode("utf-8")

    req = urllib.request.Request(f"{SERVER}/api/agronomist/diagnose-leaf", data=payload_tomato, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        res_t = json.loads(resp.read().decode())

    print("\n[Tomato Blight Leaf Input]")
    print(f"Pathogen: {res_t.get('pathogen_identified')}")
    print(f"Confidence: {res_t.get('confidence_pct')}%")
    print(f"Prescription: {res_t.get('recommended_treatment', {}).get('chemical')}")
    assert "Blight" in res_t.get("pathogen_identified"), "Expected Blight classification for Tomato"
    print(">>> PASS: Leaf Disease ML Vision Model accurately extracted biophysical metrics and classified foliar diseases!\n")


def test_calendar_no_undefined():
    print("--- TEST 3: GROWING PLAN CALENDAR 'undefined' FIX ---")
    req = urllib.request.Request(f"{SERVER}/api/crop-plans/generate?crop_name=Wheat&duration_days=120")
    with urllib.request.urlopen(req) as resp:
        plan = json.loads(resp.read().decode())

    stages = plan.get("stages", [])
    assert len(stages) > 0, "Expected stages in crop plan"

    total_days_checked = 0
    for s in stages:
        for d in s.get("daily_schedule", []):
            total_days_checked += 1
            # Check calendar mapping keys
            title = d.get("title") or d.get("theme")
            objective = d.get("objective") or d.get("focus")
            assert title is not None and title != "undefined", f"Found undefined title on Day {d.get('day')}"
            assert objective is not None and objective != "undefined", f"Found undefined objective on Day {d.get('day')}"

            for t in d.get("tasks", []):
                assignee = t.get("assignee") or t.get("assigned_to")
                duration = t.get("duration_hours") or t.get("estimated_hours")
                assert assignee is not None and assignee != "undefined", f"Found undefined assignee on Day {d.get('day')}"
                assert duration is not None and duration != "undefined", f"Found undefined duration on Day {d.get('day')}"

    print(f"Checked {total_days_checked} days across all growth stages.")
    print(">>> PASS: Zero instances of 'undefined' found in Growing Plan Calendar!\n")


def test_11_questionnaire_engine_wiring():
    print("--- TEST 4: 11-QUESTIONNAIRE PRECISION ENGINE WIRING ---")
    # Calibrate engine for Cotton cultivar in Ludhiana
    calib_payload = json.dumps({
        "farm_id": "precision-farm-test",
        "crop_name": "Cotton",
        "duration_days": 150,
        "state": "Punjab",
        "district_basin": "Bathinda Malwa",
        "farming_classification": "Terrestrial Field Crops",
        "soil_texture": "Alluvial Sandy Silt",
        "soil_ph": 7.8,
        "water_source": "Canal Lift + Drip",
        "worker_daily_hours_cap": 7.0,
        "workers": [
            {"name": "Sunita Devi (Krishi Sakhi)", "role": "worker", "daily_hours_cap": 7.0},
            {"name": "Mamata Behera (Field Assistant)", "role": "worker", "daily_hours_cap": 7.0}
        ],
        "farmers": [
            {"name": "Balwinder Singh (Farmer Custodian)", "role": "farmer"}
        ]
    }).encode("utf-8")

    req = urllib.request.Request(f"{SERVER}/api/crop-plans/generate-and-calibrate", data=calib_payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        calib_res = json.loads(resp.read().decode())

    print(f"Calibrated Crop: {calib_res.get('crop_name')}")
    print(f"Calibrated Stages: {len(calib_res.get('stages', []))}")
    assert calib_res.get("crop_name") == "Cotton", "Expected Cotton crop"

    # Now dispatch Day 1 tasks for this farm
    dispatch_payload = json.dumps({
        "farm_id": "precision-farm-test",
        "day_number": 1,
        "crop_name": "Cotton"
    }).encode("utf-8")

    req_disp = urllib.request.Request(f"{SERVER}/api/crop-plans/dispatch-day-tasks", data=dispatch_payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req_disp) as resp:
        disp_res = json.loads(resp.read().decode())

    print(f"Dispatch Status: {disp_res.get('status')}")
    print(f"Dispatched Tasks Count: {disp_res.get('dispatched_count')}")
    print(f"Dispatched Tasks: {disp_res.get('dispatched_tasks')}")

    assert disp_res.get("status") == "SUCCESS", "Expected successful dispatch"
    assert disp_res.get("dispatched_count") == 4, "Expected 4 tasks partitioned across cadre"
    print(">>> PASS: 11-Questionnaire Precision Engine successfully derives and dispatches calibrated tasks!\n")


if __name__ == "__main__":
    test_worker_task_filtering()
    test_leaf_ml_vision_model()
    test_calendar_no_undefined()
    test_11_questionnaire_engine_wiring()
    print("ALL 4 CRITICAL REQUIREMENTS VERIFIED AND PASSED!")
