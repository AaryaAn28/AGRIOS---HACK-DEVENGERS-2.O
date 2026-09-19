"""Test suite for AGRIOS Workforce Operations & Agronomic Intelligence ML Suite.
Validates:
1. Pure ML service algorithms (Hotline NLP triage, Ground truth stress, Equipment wear prognostics, ISO 7243 WBGT heat strain)
2. Ground Truth observation endpoints & real ML regression
3. Field kit & tools wear prognostics, damage tickets & replacements
4. Agronomist hotline 2-way chat with instant botanical NLP triage
5. Multi-crop training courses (8+ crops) & accredited ICAR-PAU certification
6. Leave applications & emergency wage advances
7. Dynamic performance scorecard & merit badges
8. Emergency SOPs & live distress SOS beacon
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.risk import RiskAlert
from app.models.communication import AdvisoryMessage
from app.services.workforce_ml_service import WorkforceAgronomicMLService

client = TestClient(app)


def test_workforce_ml_service_algorithms():
    """Verify all 4 mathematical and ML models in WorkforceAgronomicMLService."""
    # 1. Botanical NLP Symptom Triage
    triage_wheat = WorkforceAgronomicMLService.triage_hotline_query(
        query_text="Noticing yellow longitudinal powder stripes on upper flag leaves.",
        crop_name="Wheat",
        symptoms="Yellow stripes, powdery pustules"
    )
    assert "Yellow" in triage_wheat["detected_pathogen"] or "Rust" in triage_wheat["detected_pathogen"]
    assert triage_wheat["urgency"] in ("CRITICAL", "ELEVATED")
    assert "chemical" in triage_wheat["prescriptions"]
    assert "biological" in triage_wheat["prescriptions"]

    triage_rice = WorkforceAgronomicMLService.triage_hotline_query(
        query_text="Spindle shaped diamond lesions with gray center on leaves.",
        crop_name="Rice"
    )
    assert "Blast" in triage_rice["detected_pathogen"]

    # 2. Ground Truth Composite Stress Regression
    eval_healthy = WorkforceAgronomicMLService.evaluate_ground_truth({
        "soil_moisture_pct": 30.0,
        "weed_pressure": "Low (<5%)",
        "canopy_cover_pct": 95.0,
        "foliar_nitrogen_status": "Optimal",
        "crop_name": "Wheat"
    })
    assert eval_healthy["composite_stress_score"] < 35.0
    assert eval_healthy["stress_classification"] in ("OPTIMAL_HEALTH", "HEALTHY_VIGOROUS")

    eval_stressed = WorkforceAgronomicMLService.evaluate_ground_truth({
        "soil_moisture_pct": 12.0,
        "weed_pressure": "High (>25%)",
        "canopy_cover_pct": 50.0,
        "foliar_nitrogen_status": "Severe Deficit",
        "crop_name": "Wheat"
    })
    assert eval_stressed["composite_stress_score"] > 50.0
    assert eval_stressed["irrigation_requirement_mm"] > 0

    # 3. Tool Health & Wear Prognostics
    tool_health = WorkforceAgronomicMLService.predict_equipment_health(
        tool_name="Spectrum FieldScout TDR 350 Soil Moisture Probe",
        usage_hours=400.0,
        reported_issues=["Electrode corrosion"],
        battery_charge_pct=75.0
    )
    assert 0 <= tool_health["overall_health_score"] <= 100
    assert "remaining_useful_life_hours" in tool_health
    assert "maintenance_advisory" in tool_health

    # 4. ISO 7243 WBGT Heat Strain
    heat_stress = WorkforceAgronomicMLService.calculate_worker_biophysical_stress(
        temp_c=36.0,
        humidity_pct=70.0,
        hours_worked=5.0,
        heavy_labor=True
    )
    assert heat_stress["estimated_wbgt_c"] > 28.0
    assert heat_stress["heat_strain_classification"] in ("HIGH_HEAT_STRAIN", "EXTREME_HEAT_DANGER")
    assert heat_stress["mandatory_rest_minutes_per_hour"] >= 20
    assert heat_stress["water_intake_recommendation_liters_per_hour"] >= 0.75


def test_ground_truth_api_endpoints():
    """Verify GET and POST /api/workforce-ops/ground-truth with live ML regression."""
    # GET existing
    res_get = client.get("/api/workforce-ops/ground-truth")
    assert res_get.status_code == 200
    logs = res_get.json()
    assert isinstance(logs, list)
    assert len(logs) >= 2

    # POST new observation
    payload = {
        "farm_id": "farm-pb-001",
        "farm_name": "Green Valley Model Farm",
        "field_parcel": "East Sector Trial B",
        "crop": "Rice (Basmati)",
        "soil_moisture_pct": 24.5,
        "weed_infestation": "Moderate (10%)",
        "canopy_coverage": "85%",
        "nitrogen_status": "Optimal",
        "notes": "Field parcel inspected by Krishi Sakhi.",
        "gps_lat": 30.9015,
        "gps_lon": 75.8580
    }
    res_post = client.post("/api/workforce-ops/ground-truth", json=payload)
    assert res_post.status_code == 200
    data = res_post.json()
    assert data["status"] == "success"
    assert "ml_evaluation" in data
    assert "composite_stress_score" in data["ml_evaluation"]
    assert data["entry"]["field_parcel"] == "East Sector Trial B"


def test_equipment_kit_api_endpoints():
    """Verify tool registry, wear prognostics, damage reports, and spare requisitions."""
    # GET kit
    res_kit = client.get("/api/workforce-ops/equipment-kit")
    assert res_kit.status_code == 200
    kit_data = res_kit.json()
    assert kit_data["total_instruments"] >= 6
    assert any("Trimble" in item["name"] for item in kit_data["items"])
    assert "health_score" in kit_data["items"][0]

    # Report damage
    damage_payload = {
        "tool_id": "TOOL-GPS-01",
        "damage_type": "Antenna loose",
        "description": "GPS lock dropping intermittently under tree canopy",
        "severity": "minor"
    }
    res_dmg = client.post("/api/workforce-ops/equipment-kit/report-damage", json=damage_payload)
    assert res_dmg.status_code == 200
    dmg_data = res_dmg.json()
    assert dmg_data["status"] == "ticket_created"
    assert "TKT-REP-" in dmg_data["ticket"]["ticket_id"]

    # Requisition spare part
    req_payload = {
        "tool_name": "Replacement TDR Moisture Sensor Rods (Pair)",
        "urgency": "HIGH",
        "reason": "Bent during hard clay soil sampling",
        "field_season": "Rabi 2026-27"
    }
    res_req = client.post("/api/workforce-ops/equipment-kit/request-replacement", json=req_payload)
    assert res_req.status_code == 200
    req_data = res_req.json()
    assert req_data["status"] == "requisition_submitted"
    assert "REQ-KIT-" in req_data["requisition"]["requisition_id"]


def test_hotline_api_endpoints():
    """Verify 2-way hotline chat, NLP botanical symptom triage, and advisory creation."""
    # GET messages
    res_get = client.get("/api/workforce-ops/hotline/messages")
    assert res_get.status_code == 200
    messages = res_get.json()
    assert len(messages) >= 2

    # POST message
    post_payload = {
        "worker_id": "test_worker",
        "crop_name": "Tomato",
        "symptoms": "Water-soaked dark lesions on leaf tips with white fuzzy growth underneath",
        "message": "Dr. Priya, is this late blight? Urgent guidance requested.",
        "urgency": "CRITICAL"
    }
    res_send = client.post("/api/workforce-ops/hotline/send", json=post_payload)
    assert res_send.status_code == 200
    data = res_send.json()
    assert data["status"] == "delivered"
    assert "Blight" in data["ml_evaluation"]["detected_pathogen"]
    assert "ai_triage_response" in data

    # Verify advisory was recorded in database
    db = SessionLocal()
    try:
        adv = db.query(AdvisoryMessage).filter(AdvisoryMessage.advisory_type == "hotline_inquiry").order_by(AdvisoryMessage.created_at.desc()).first()
        assert adv is not None
        assert "Hotline" in adv.subject
    finally:
        db.close()


def test_training_and_certification_api_endpoints():
    """Verify multi-crop training modules (8+ crops) and ICAR-PAU certification generation."""
    # GET modules
    res_mods = client.get("/api/workforce-ops/training/modules")
    assert res_mods.status_code == 200
    modules = res_mods.json()
    assert len(modules) >= 8
    crops_covered = {m["crop"] for m in modules}
    assert "Rice" in crops_covered
    assert "Wheat" in crops_covered
    assert "Tomato" in crops_covered
    assert "Potato" in crops_covered
    assert "Maize" in crops_covered
    assert "Cotton" in crops_covered

    # POST certification with passing answers
    target_mod = next(m for m in modules if m["crop"] == "Rice")
    # All option 0 are correct answers per catalogue definition
    answers = [q["answer"] for q in target_mod["quiz"]]
    cert_payload = {
        "module_id": target_mod["id"],
        "worker_name": "Sunita Devi (Krishi Sakhi)",
        "answers": answers
    }
    res_cert = client.post("/api/workforce-ops/training/certify", json=cert_payload)
    assert res_cert.status_code == 200
    cert = res_cert.json()
    assert cert["status"] == "PASSED"
    assert "CERT-ICAR-PB-2026-" in cert["certificate_code"]
    assert cert["score_pct"] == 100.0
    assert cert["accreditation_authority"] is not None
    assert cert["signatory_agronomist"] == "Dr. Priya Sharma (Lead Agronomist • PB-AGRO-001)"


def test_leave_and_wage_advance_api_endpoints():
    """Verify leave request submissions and direct benefit wage advance workflow."""
    # GET existing status
    res_get = client.get("/api/workforce-ops/leaves")
    assert res_get.status_code == 200
    status_data = res_get.json()
    assert "leaves" in status_data
    assert "wage_advances" in status_data

    # Apply for leave
    leave_payload = {
        "category": "Harvest Seasonal Rest",
        "start_date": "2026-10-01",
        "end_date": "2026-10-04",
        "reason": "Family farm paddy harvest assistance",
        "emergency_phone": "+91 98765 00000"
    }
    res_leave = client.post("/api/workforce-ops/leaves", json=leave_payload)
    assert res_leave.status_code == 200
    assert res_leave.json()["status"] == "submitted"

    # Request wage advance
    wage_payload = {
        "amount_inr": 3000.0,
        "purpose": "Agricultural equipment batteries and field boots",
        "repayment_months": 2
    }
    res_wage = client.post("/api/workforce-ops/wage-advance", json=wage_payload)
    assert res_wage.status_code == 200
    wage_res = res_wage.json()
    assert wage_res["status"] == "advance_approved"
    assert wage_res["wage_advance"]["amount_inr"] == 3000.0


def test_scorecard_and_biophysical_api_endpoints():
    """Verify worker merit scorecard and biophysical heat stress calculations."""
    res_score = client.get("/api/workforce-ops/scorecard/WORKER-001")
    assert res_score.status_code == 200
    score_data = res_score.json()
    assert "composite_performance_score" in score_data
    assert score_data["composite_performance_score"] > 0
    assert len(score_data["earned_badges"]) == 4
    assert score_data["incentive_bonus_inr"] > 0

    res_heat = client.get("/api/workforce-ops/biophysical-stress?temp_c=34.0&humidity_pct=65.0")
    assert res_heat.status_code == 200
    heat_data = res_heat.json()
    assert "estimated_wbgt_c" in heat_data
    assert "mandatory_rest_minutes_per_hour" in heat_data


def test_emergency_sos_api_endpoints():
    """Verify emergency field protocols and live SOS distress beacon creating RiskAlert."""
    # GET protocols
    res_proto = client.get("/api/workforce-ops/emergency-protocols")
    assert res_proto.status_code == 200
    protos = res_proto.json()
    assert len(protos) >= 5

    # POST distress beacon
    sos_payload = {
        "worker_id": "test_worker",
        "worker_name": "Sunita Devi",
        "gps_lat": 30.9012,
        "gps_lon": 75.8575,
        "emergency_type": "Foliar Chemical Spray Drift Eye Irritation",
        "details": "Accidental chemical blowback during high wind spraying."
    }
    res_sos = client.post("/api/workforce-ops/emergency-sos", json=sos_payload)
    assert res_sos.status_code == 200
    sos_data = res_sos.json()
    assert sos_data["status"] == "SOS_BROADCAST_ACTIVE"
    assert "108 National Ambulance" in sos_data["emergency_services_dispatched"]

    # Verify RiskAlert and AdvisoryMessage in database
    db = SessionLocal()
    try:
        alert = db.query(RiskAlert).filter(RiskAlert.id == sos_data["alert_id"]).first()
        assert alert is not None
        assert alert.alert_category == "emergency"
        assert alert.severity == "critical"

        adv = db.query(AdvisoryMessage).filter(AdvisoryMessage.id == sos_data["advisory_id"]).first()
        assert adv is not None
        assert adv.advisory_type == "emergency_sos"
        assert adv.priority == "urgent"
    finally:
        db.close()


def test_workforce_report_generation_endpoints():
    """Verify all 8 dedicated official report generation endpoints in workforce operations."""
    # 1. Ground Truth & Hydrology Report
    res_gt = client.get("/api/workforce-ops/ground-truth/report")
    assert res_gt.status_code == 200
    gt_data = res_gt.json()
    assert "REP-GT-" in gt_data["report_id"]
    assert "summary" in gt_data
    assert "ground_truth_records" in gt_data
    assert len(gt_data["ground_truth_records"]) >= 2

    # 2. Equipment Kit Wear Prognostics Audit Report
    res_kit = client.get("/api/workforce-ops/equipment-kit/audit-report")
    assert res_kit.status_code == 200
    kit_data = res_kit.json()
    assert "REP-KIT-" in kit_data["report_id"]
    assert "fleet_readiness_score" in kit_data["summary"]
    assert len(kit_data["instruments"]) >= 6

    # 3. Hotline Consultation Transcript Report
    res_hotline = client.get("/api/workforce-ops/hotline/transcript-report")
    assert res_hotline.status_code == 200
    hotline_data = res_hotline.json()
    assert "REP-HOTLINE-" in hotline_data["report_id"]
    assert "transcript" in hotline_data
    assert len(hotline_data["transcript"]) >= 2

    # 4. Training Transcript & Qualifications Report
    res_trn = client.get("/api/workforce-ops/training/transcript-report")
    assert res_trn.status_code == 200
    trn_data = res_trn.json()
    assert "TRN-TRANSCRIPT-" in trn_data["report_id"]
    assert "curricula" in trn_data
    assert len(trn_data["curricula"]) >= 8

    # 5. Offline Curriculum Manual & Field Cheatsheet Guide
    res_guide = client.get("/api/workforce-ops/training/offline-guide/TRN-RICE-01")
    assert res_guide.status_code == 200
    guide_data = res_guide.json()
    assert guide_data["module_id"] == "TRN-RICE-01"
    assert len(guide_data["syllabus_modules"]) == 4
    assert "field_cheatsheet" in guide_data
    assert "chemical_rx" in guide_data["field_cheatsheet"]

    # 6. PM-KISAN Welfare & Wage Advance Statement
    res_welfare = client.get("/api/workforce-ops/leaves/welfare-statement")
    assert res_welfare.status_code == 200
    welfare_data = res_welfare.json()
    assert "STMT-WELFARE-" in welfare_data["statement_id"]
    assert welfare_data["beneficiary"]["cadre_code"] == "WORKER-001"
    assert "wage_advances" in welfare_data

    # 7. Annual Krishi Sakhi Merit Certificate & Scorecard Report
    res_merit = client.get("/api/workforce-ops/scorecard/WORKER-001/merit-report")
    assert res_merit.status_code == 200
    merit_data = res_merit.json()
    assert "REP-MERIT-" in merit_data["report_id"]
    assert "kpi_metrics" in merit_data
    assert "bonus_ledger" in merit_data
    assert len(merit_data["merit_badges"]) >= 4

    # 8. Emergency Safety, Biosecurity & Heat Stress Audit Report
    res_safety = client.get("/api/workforce-ops/emergency/safety-report")
    assert res_safety.status_code == 200
    safety_data = res_safety.json()
    assert "REP-SAFETY-" in safety_data["report_id"]
    assert "environmental_biophysics" in safety_data
    assert "wbgt_heat_index_c" in safety_data["environmental_biophysics"]
    assert len(safety_data["standard_operating_procedures"]) >= 5

