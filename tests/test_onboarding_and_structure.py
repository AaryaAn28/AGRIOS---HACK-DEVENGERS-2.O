from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.farm import Farm
from app.models.agricultural_profile import AgriculturalProfile
from app.models.farm_structure import FarmStructureVersion
from app.services.simulator_service import SimulatorService
from app.routes.auth import register_subordinate, RegisterSubordinateRequest
from app.routes.onboarding import save_user_profile, ProfileSaveRequest, get_agricultural_taxonomy
from app.routes.farm_structures import create_structure_version, update_planting_grid, StructureVersionCreate, PlantingGridUpdate
from app.routes.simulator import trigger_simulation, undo_last_simulation_event, get_simulation_status, SimulationTriggerRequest

def test_register_subordinate_agronomist():
    db = SessionLocal()
    created_id = None
    try:
        gov = db.query(User).filter(User.role == "government").first()
        req = RegisterSubordinateRequest(
            role="agronomist",
            full_name="Dr. Vikram Singh",
            jurisdiction_code="Punjab Central",
            registered_by_id=gov.id if gov else None
        )
        res = register_subordinate(req, db)
        created_id = res.get("id")
        assert res["persona_code"].startswith("AGRONOMIST-")
        assert res["default_password"] == "Admin@123"
        assert res["has_completed_onboarding"] is False
    finally:
        if created_id:
            db.query(User).filter(User.id == created_id).delete()
            db.commit()
        db.close()

def test_onboarding_profile_save_and_retrieve():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.role == "agronomist").first()
        assert user is not None

        req = ProfileSaveRequest(
            user_id=user.id,
            jurisdiction_state="Punjab",
            jurisdiction_district="Ludhiana",
            farming_types=["field_farming", "horticulture", "pisciculture"],
            crops_species={
                "field_farming": ["Wheat", "Rice"],
                "horticulture": ["Tomato", "Mango"],
                "pisciculture": ["Rohu", "Catla"]
            },
            farm_conditions={"terrain": "Flat plain", "elevation_m": 245},
            soil_config={"soil_type": "Alluvial Loam", "ph": "7.4"},
            water_config={"source": "Canal", "method": "Drip"},
            risks_config=["Yellow Rust", "Rice Blast"],
            data_availability={"satellite": True, "weather": True}
        )
        res = save_user_profile(req, db)
        assert res["status"] == "success"
        assert res["profile"]["is_completed"] is True
        assert res["user"]["has_completed_onboarding"] is True

        # Verify taxonomy endpoint
        taxonomy = get_agricultural_taxonomy()
        assert len(taxonomy["farming_types"]) >= 10
        assert "pisciculture" in [ft["id"] for ft in taxonomy["farming_types"]]
    finally:
        db.close()

def test_farm_structure_versioning_and_planting_grid():
    db = SessionLocal()
    try:
        farm = db.query(Farm).first()
        assert farm is not None

        # Create new structure version
        req = StructureVersionCreate(
            created_by_id=farm.assigned_agronomist_id or farm.owner_id,
            change_summary="Expanded western drip irrigation zone and new nursery",
            spatial_objects=[
                {"id": "road_1", "type": "road", "name": "4m Tractor Path"},
                {"id": "pond_1", "type": "water_source", "name": "Rainwater Pond", "capacity_liters": 450000}
            ],
            planting_grid={
                "total_plants": 1200,
                "healthy_plants": 1160,
                "stressed_plants": 30,
                "dead_plants": 10
            }
        )
        v = create_structure_version(farm.id, req, db)
        assert v["version_number"] >= 1
        assert v["is_current"] is True

        # Update planting grid without modifying boundary
        grid_req = PlantingGridUpdate(
            updated_by_id=farm.assigned_agronomist_id or farm.owner_id,
            plant_updates=[{"row": 1, "col": 1, "status": "dead"}],
            notes="Logged damping-off seedling death"
        )
        grid_res = update_planting_grid(farm.id, grid_req, db)
        assert grid_res["status"] == "success"
        assert grid_res["planting_grid"]["dead_plants"] >= 11
    finally:
        db.close()

def test_simulator_undo_and_status():
    db = SessionLocal()
    try:
        # Trigger shock
        req = SimulationTriggerRequest(event_name="pest_outbreak")
        res = trigger_simulation(req, db)
        assert "simulation_state" in res
        assert res["simulation_state"]["events_simulated"] >= 1

        # Undo event
        undo_res = undo_last_simulation_event(db)
        assert undo_res["status"] == "success"

        # Check status
        status = get_simulation_status()
        assert status["status"] == "LIVE"
    finally:
        db.close()

def test_walk_and_calibrate_and_crop_plan():
    from app.routes.farm_structures import walk_and_calibrate_farm, WalkAndCalibrateRequest
    from app.routes.crop_plans import generate_crop_plan, activate_crop_plan
    db = SessionLocal()
    try:
        agro = db.query(User).filter(User.role == "agronomist").first()
        req = WalkAndCalibrateRequest(
            agronomist_id=agro.id if agro else "agro_test",
            farm_name="Test Calibrated Bio Farm",
            area_acres=25.0,
            crop_type="Wheat",
            target_duration_days=120
        )
        calib_res = walk_and_calibrate_farm(req, db)
        assert calib_res["status"] == "SUCCESS"
        assert calib_res["structure"]["version_number"] == 1
        assert "crop_plan" in calib_res
        assert calib_res["crop_plan"]["crop_name"] == "Wheat"
        assert len(calib_res["crop_plan"]["stages"]) >= 5

        # Test crop plan activation & Stage 1 task release
        activate_res = activate_crop_plan(calib_res["farm_id"], calib_res["crop_plan"], db)
        assert activate_res["status"] == "SUCCESS"
        assert len(activate_res["dispatched_tasks"]) >= 1
    finally:
        db.close()
