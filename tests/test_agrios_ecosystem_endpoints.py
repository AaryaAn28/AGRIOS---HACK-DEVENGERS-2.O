import uuid
from datetime import datetime, timezone
from app.database import SessionLocal
from app.models.user import User
from app.models.farm import Farm
from app.routes.agrios_ecosystem import (
    get_agronomist_soil_analysis,
    get_crop_rotation_advice,
    get_spray_weather_check,
    get_ipm_protocols,
    list_pathogen_observations,
    certify_pathogen_observation,
    broadcast_circular,
    list_broadcast_circulars,
    CircularBroadcastRequest,
    get_farmer_dashboard_summary,
    get_harvest_forecast,
    get_gov_kpis,
    get_workforce_registry,
    get_financial_overview,
    get_infrastructure_status,
    get_compliance_audit,
    generate_gov_report,
    GovReportRequest,
    log_attendance,
    get_attendance_history,
    AttendanceLogRequest,
    get_training_modules,
    complete_training_module,
    get_performance_metrics,
    get_emergency_protocols,
    global_search
)

def test_agronomist_scientific_endpoints():
    db = SessionLocal()
    try:
        farm = db.query(Farm).first()
        farm_id = farm.id if farm else "default_farm"

        # 1. Soil Analysis
        soil = get_agronomist_soil_analysis(farm_id, db)
        assert "npk_levels" in soil
        assert soil["ph"] == 7.2
        assert len(soil["scientific_recommendations"]) >= 2

        # 2. Crop Rotation Advice
        rotation = get_crop_rotation_advice()
        assert len(rotation["optimal_rotation_sequence"]) == 4
        assert "benefits" in rotation
        assert "nitrogen_savings_inr" in rotation["benefits"]

        # 3. Spray Weather Check
        weather = get_spray_weather_check(db)
        assert weather["suitability_code"] in ["OPTIMAL", "UNFAVORABLE"]
        assert "wind_speed_kmh" in weather

        # 4. IPM Protocols
        ipm = get_ipm_protocols()
        assert len(ipm["protocols"]) >= 3
        assert any("Yellow Rust" in p["pest"] for p in ipm["protocols"])

        # 5. Pathogen Observations & Certification
        obs_list = list_pathogen_observations()
        assert len(obs_list) >= 2
        obs_id = obs_list[0]["id"]
        cert_res = certify_pathogen_observation(obs_id)
        assert cert_res["status"] == "success"
        assert cert_res["observation"]["status"] == "Certified & Dispatched"

        # 6. Broadcast Circulars
        circ_req = CircularBroadcastRequest(
            subject="Test Critical Warning: Early Aphid Influx",
            body="Deploy ladybird beetles and neem oil barrier across all border blocks.",
            target_role="all",
            priority="high"
        )
        b_res = broadcast_circular(circ_req, db)
        assert b_res["status"] == "broadcasted"

        all_circs = list_broadcast_circulars()
        assert any(c["subject"] == "Test Critical Warning: Early Aphid Influx" for c in all_circs)
    finally:
        db.close()

def test_farmer_summary_and_harvest_endpoints():
    db = SessionLocal()
    try:
        farm = db.query(Farm).first()
        farm_id = farm.id if farm else "default_farm"

        # 1. Farmer Dashboard Summary
        summary = get_farmer_dashboard_summary(farm_id, db)
        assert summary["vitality_pct"] > 80
        assert summary["crop"] == "Wheat (PBW-550)"
        assert "tasks_completed" in summary

        # 2. Harvest Forecast
        forecast = get_harvest_forecast(farm_id, db)
        assert forecast["projected_yield_quintals"] > 0
        assert forecast["projected_revenue_inr"] > 0
        assert forecast["silo_moisture_pct"] <= 12.0
    finally:
        db.close()

def test_government_oversight_endpoints():
    db = SessionLocal()
    try:
        # 1. Dashboard KPIs
        kpis = get_gov_kpis(db)
        assert "total_registered_farms" in kpis
        assert "total_acres_managed" in kpis

        # 2. Workforce Registry
        registry = get_workforce_registry(db)
        assert "agronomists" in registry
        assert "farmers" in registry
        assert "workers" in registry

        # 3. Financial Overview
        fin = get_financial_overview(db)
        assert "total_state_budget_inr" in fin
        assert "disbursed_subsidies_inr" in fin

        # 4. Infrastructure Status
        infra = get_infrastructure_status(db)
        assert "total_cameras" in infra
        assert "weather_stations_online" in infra

        # 5. Compliance Audit
        audit = get_compliance_audit(db)
        assert "task_completion_rate" in audit
        assert "alert_resolution_rate" in audit

        # 6. Report Generation
        rep_req = GovReportRequest(report_type="comprehensive_digest", format="json")
        report = generate_gov_report(rep_req, db)
        assert report["report_type"] == "comprehensive_digest"
        assert "data" in report
    finally:
        db.close()

def test_worker_field_endpoints():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.role == "worker").first()
        user_id = user.id if user else str(uuid.uuid4())

        # 1. Attendance Check-in
        att_req = AttendanceLogRequest(
            user_id=user_id,
            gps_lat=30.9010,
            gps_lon=75.8573,
            action="check_in"
        )
        att_res = log_attendance(att_req)
        assert att_res["status"] == "logged"
        assert att_res["action"] == "check_in"

        # 2. Attendance History
        history = get_attendance_history(user_id)
        assert len(history) >= 1
        assert history[0]["user_id"] == user_id

        # 3. Training Modules
        modules = get_training_modules()
        assert len(modules) >= 3
        mod_id = modules[0]["id"]
        comp_res = complete_training_module(mod_id, user_id)
        assert comp_res["status"] == "completed"

        # 4. Performance Metrics
        perf = get_performance_metrics(user_id, db)
        assert "tasks_completed" in perf
        assert "accuracy_score" in perf

        # 5. Emergency Protocols
        protocols = get_emergency_protocols()
        assert len(protocols) >= 4
        assert any("Snakebite" in p["title"] for p in protocols)
    finally:
        db.close()

def test_universal_search_endpoint():
    db = SessionLocal()
    try:
        res = global_search(q="Wheat", db=db)
        assert res["query"] == "Wheat"
        assert isinstance(res["results"], list)
        assert len(res["results"]) >= 1
    finally:
        db.close()
