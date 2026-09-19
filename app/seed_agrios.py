import json
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.farm import Farm, Field
from app.models.crop import Crop, CropHealthLog
from app.models.task import FarmTask, WorkLog
from app.models.resource import FarmResource, FarmEquipment, EquipmentBooking
from app.models.risk import WeatherLog, RiskAlert
from app.models.finance import ProduceInventory, MarketPrice, FinancialTransaction
from app.models.scheme import GovScheme, SchemeApplication
from app.models.communication import AdvisoryMessage
from app.models.digital_twin import DigitalTwinSnapshot
from app.services.digital_twin_service import DigitalTwinService
from app.utils.security import hash_password

def seed_database():
    print("[Seed] Creating database tables if not present...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # Check if users already seeded
        existing_user = db.query(User).filter(User.email == "farmer@agrios.in").first()
        if existing_user:
            print("[Seed] Database already seeded. Skipping duplicate seeding.")
            return

        print("[Seed] Seeding AGRIOS Canonical God Database...")

        # 1. PERSONAS / USERS
        gov_user = User(
            full_name="Dr. Vikramaditya Sen",
            email="gov@agrios.in",
            phone="+91 98140 11001",
            hashed_password=hash_password("Admin@123"),
            role="government",
            jurisdiction_code="PUNJAB_LUDHIANA_ZONE",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
        )
        agronomist_user = User(
            full_name="Dr. Priya Sharma",
            email="agronomist@agrios.in",
            phone="+91 98765 22002",
            hashed_password=hash_password("Admin@123"),
            role="agronomist",
            jurisdiction_code="PUNJAB_CENTRAL",
            avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
        )
        worker_user = User(
            full_name="Sunita Devi",
            email="worker@agrios.in",
            phone="+91 98111 33003",
            hashed_password=hash_password("Admin@123"),
            role="worker",
            jurisdiction_code="VILLAGE_JANDIALI",
            avatar_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
        )
        farmer_user = User(
            full_name="Balwinder Singh",
            email="farmer@agrios.in",
            phone="+91 98150 44004",
            hashed_password=hash_password("Admin@123"),
            role="farmer",
            jurisdiction_code="PUNJAB_LUDHIANA",
            avatar_url="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80"
        )
        db.add_all([gov_user, agronomist_user, worker_user, farmer_user])
        db.commit()

        # 2. FARMS & FIELDS
        farm = Farm(
            name="Green Valley Model Farm",
            owner_id=farmer_user.id,
            assigned_worker_id=worker_user.id,
            assigned_agronomist_id=agronomist_user.id,
            village="Jandiali Kalan",
            district="Ludhiana",
            state="Punjab",
            latitude=30.9010,
            longitude=75.8573,
            total_area_acres=14.5,
            soil_type="Rich Alluvial Loam",
            irrigation_source="Canal & Solar Submersible Tube Well",
            health_score=91.5,
            status="optimal"
        )
        db.add(farm)
        db.commit()
        db.refresh(farm)

        # Update farmer's farm_id
        farmer_user.farm_id = farm.id
        db.commit()

        field1 = Field(
            farm_id=farm.id,
            name="Field 1 (North Parcel)",
            area_acres=4.5,
            soil_ph=6.8,
            moisture_pct=42.5,
            nitrogen_level=185.0,
            phosphorus_level=26.0,
            potassium_level=220.0,
            ndvi_score=0.82,
            health_status="healthy"
        )
        field2 = Field(
            farm_id=farm.id,
            name="Field 2 (Canal Zone)",
            area_acres=5.0,
            soil_ph=7.1,
            moisture_pct=46.0,
            nitrogen_level=170.0,
            phosphorus_level=22.0,
            potassium_level=195.0,
            ndvi_score=0.79,
            health_status="healthy"
        )
        field3 = Field(
            farm_id=farm.id,
            name="Field 3 (South Orchard)",
            area_acres=5.0,
            soil_ph=6.5,
            moisture_pct=38.0,
            nitrogen_level=190.0,
            phosphorus_level=28.0,
            potassium_level=230.0,
            ndvi_score=0.85,
            health_status="healthy"
        )
        db.add_all([field1, field2, field3])
        db.commit()

        # 3. CROPS
        crop1 = Crop(
            field_id=field1.id,
            farm_id=farm.id,
            crop_name="PBW 550 Wheat",
            variety="High Rust Resistance Certified",
            season="Rabi",
            sowing_date=datetime.now(timezone.utc) - timedelta(days=65),
            expected_harvest_date=datetime.now(timezone.utc) + timedelta(days=45),
            stage="flowering",
            growth_progress_pct=68.0,
            health_index=93.0,
            yield_estimate_kg=5100.0,
            status="healthy"
        )
        crop2 = Crop(
            field_id=field2.id,
            farm_id=farm.id,
            crop_name="Pusa Basmati 1121",
            variety="Premium Export Long Grain",
            season="Kharif Reserve",
            sowing_date=datetime.now(timezone.utc) - timedelta(days=90),
            expected_harvest_date=datetime.now(timezone.utc) + timedelta(days=30),
            stage="grain_filling",
            growth_progress_pct=78.0,
            health_index=89.5,
            yield_estimate_kg=4400.0,
            status="healthy"
        )
        db.add_all([crop1, crop2])
        db.commit()

        # 4. TASKS & CHECKLISTS
        now = datetime.now(timezone.utc)
        task1 = FarmTask(
            farm_id=farm.id,
            field_id=field1.id,
            title="Morning Drip Irrigation Cycle & EC Monitoring",
            description="Run canal secondary pump for 90 minutes. Measure electrical conductivity and moisture across North Parcel.",
            task_type="irrigation",
            priority="high",
            status="pending",
            assigned_role="farmer",
            assigned_to_user_id=farmer_user.id,
            created_by_role="agronomist",
            due_date=now + timedelta(hours=6),
            checklist_json=json.dumps([
                {"step": "Check filter backwash pressure", "done": True},
                {"step": "Open Sub-lateral valves A1 through A4", "done": False},
                {"step": "Verify uniform dripper discharge rate", "done": False}
            ])
        )
        task2 = FarmTask(
            farm_id=farm.id,
            field_id=field1.id,
            title="Krishi Sakhi Ground Truth Biosecurity Scouting",
            description="Perform visual survey of leaf sheaths for aphid colonies and yellow rust pustules. Log geotagged pictures.",
            task_type="scouting",
            priority="medium",
            status="in_progress",
            assigned_role="worker",
            assigned_to_user_id=worker_user.id,
            created_by_role="agronomist",
            due_date=now + timedelta(hours=8),
            checklist_json=json.dumps([
                {"step": "Inspect 20 random flag leaves across 5 diagonals", "done": True},
                {"step": "Upload high-res photo into AI Crop Scanner", "done": True},
                {"step": "Check soil compaction around canal bunds", "done": False}
            ])
        )
        task3 = FarmTask(
            farm_id=farm.id,
            field_id=field2.id,
            title="Foliar Zinc Sulphate & Micronutrient Application",
            description="Spray 0.5% Zinc Sulphate + 2.5% Urea solution to boost grain filling weight.",
            task_type="spraying",
            priority="medium",
            status="pending",
            assigned_role="worker",
            assigned_to_user_id=worker_user.id,
            created_by_role="agronomist",
            due_date=now + timedelta(days=1),
            checklist_json=json.dumps([
                {"step": "Mix 1 kg Zinc Sulphate + 5 kg Urea in 200L clean water", "done": False},
                {"step": "Check wind speed is below 15 km/h before spraying", "done": False}
            ])
        )
        db.add_all([task1, task2, task3])
        db.commit()

        # 5. RESOURCES & EQUIPMENT
        r1 = FarmResource(farm_id=farm.id, name="IFFCO Urea 46% N", category="fertilizer", quantity=350.0, unit="kg", reorder_threshold=100.0, cost_per_unit=6.5, supplier="IFFCO Ludhiana Kendra", status="adequate")
        r2 = FarmResource(farm_id=farm.id, name="Di-Ammonium Phosphate (DAP)", category="fertilizer", quantity=180.0, unit="kg", reorder_threshold=50.0, cost_per_unit=27.0, supplier="KRIBHCO Regional Hub", status="adequate")
        r3 = FarmResource(farm_id=farm.id, name="Neem Oil Biopesticide (10,000 ppm)", category="pesticide", quantity=45.0, unit="liters", reorder_threshold=15.0, cost_per_unit=380.0, supplier="Punjab Bio-Agro", status="adequate")
        r4 = FarmResource(farm_id=farm.id, name="PBW-550 Certified Seed Stock", category="seed", quantity=120.0, unit="kg", reorder_threshold=40.0, cost_per_unit=42.0, supplier="PAU Seed Centre", status="adequate")
        db.add_all([r1, r2, r3, r4])

        eq1 = FarmEquipment(farm_id=farm.id, name="Mahindra 575 DI Tractor (45 HP)", equipment_type="tractor", registration_no="PB-10-CZ-8812", status="available", operating_hours=340.0, fuel_pct=82.0, hourly_rate=450.0, location="Primary Equipment Shed")
        eq2 = FarmEquipment(farm_id=farm.id, name="Kirloskar 7.5 HP Solar Drip Pump", equipment_type="pump", registration_no="SOLAR-PUMP-01", status="in_use", operating_hours=1120.0, fuel_pct=100.0, hourly_rate=120.0, location="Canal Sluice #2")
        eq3 = FarmEquipment(farm_id=farm.id, name="Aspee Hi-Tech Knapsack Sprayer", equipment_type="sprayer", registration_no="SPRAYER-B2", status="available", operating_hours=45.0, fuel_pct=95.0, hourly_rate=80.0, location="Chemical Tool Storage")
        eq4 = FarmEquipment(farm_id=farm.id, name="DJI Agras T40 Multispectral Drone", equipment_type="drone", registration_no="DRONE-AG-404", status="available", operating_hours=18.5, fuel_pct=90.0, hourly_rate=750.0, location="Agronomy Mobile Van")
        db.add_all([eq1, eq2, eq3, eq4])
        db.commit()

        # 6. WEATHER & RISKS
        w = WeatherLog(
            farm_id=farm.id,
            district="Ludhiana",
            temperature_c=27.2,
            humidity_pct=59.0,
            rainfall_mm=0.0,
            wind_speed_kmh=11.5,
            wind_direction="NE",
            condition="Clear Sky & Pleasant",
            forecast_json=json.dumps([
                {"day": "Tomorrow", "temp": 28, "condition": "Sunny"},
                {"day": "Day 2", "temp": 29, "condition": "Partly Cloudy"},
                {"day": "Day 3", "temp": 26, "condition": "Light Showers Expected"}
            ])
        )
        db.add(w)

        risk1 = RiskAlert(
            farm_id=farm.id,
            field_id=field1.id,
            alert_category="pest",
            severity="advisory",
            title="Regional Yellow Rust Warning: Favorable Dew & Temp Window",
            message="State Agronomy Meteorological advisory flags 3-day window of overnight heavy dew and daytime 24°C temperatures conducive for fungal spores.",
            action_plan="Inspect leaf underside at dawn. If yellow-orange linear stripes appear, apply Nativo 75 WG within 48h.",
            acknowledged=True
        )
        db.add(risk1)

        # 7. MARKET PRICES & FINANCE
        m1 = MarketPrice(crop_name="Wheat (PBW 550 / Sharbati)", mandi_name="Khanna Mandi (Asia's Largest)", state="Punjab", min_price=2275.0, max_price=2520.0, modal_price=2410.0, msp_price=2275.0, trend="bullish")
        m2 = MarketPrice(crop_name="Basmati Paddy (Pusa 1121)", mandi_name="Amritsar Mandi", state="Punjab", min_price=3650.0, max_price=4150.0, modal_price=3920.0, msp_price=3400.0, trend="bullish")
        m3 = MarketPrice(crop_name="Mustard (Giriraj)", mandi_name="Bathinda Mandi", state="Punjab", min_price=5200.0, max_price=5650.0, modal_price=5450.0, msp_price=5650.0, trend="stable")
        db.add_all([m1, m2, m3])

        tx1 = FinancialTransaction(farm_id=farm.id, tx_type="revenue", category="produce_sale", amount=142500.0, description="Sold 60 Quintals Certified Wheat to State Procurement Mandi", counterparty="Punjab Agro Foodgrains Corp")
        tx2 = FinancialTransaction(farm_id=farm.id, tx_type="expense", category="fertilizer", amount=6800.0, description="Procured 8 bags Urea and 3 bags DAP for top-dressing", counterparty="IFFCO Jandiali")
        tx3 = FinancialTransaction(farm_id=farm.id, tx_type="expense", category="machinery_hire", amount=2700.0, description="Laser land leveler rental for 6 hours", counterparty="Village Cooperative Pool")
        db.add_all([tx1, tx2, tx3])

        # 8. GOVERNMENT SCHEMES & SUBSIDIES
        s1 = GovScheme(
            scheme_code="PM-KISAN",
            title="Pradhan Mantri Kisan Samman Nidhi",
            department="Department of Agriculture & Farmers Welfare",
            description="Direct income support of Rs 6,000 per year in three equal installments to landholding farmer families.",
            subsidy_percentage=100.0,
            max_benefit_amount=6000.0,
            eligibility_criteria="Small/Marginal landholding farmer with active e-KYC"
        )
        s2 = GovScheme(
            scheme_code="SMAM-DRONE",
            title="Sub-Mission on Agricultural Mechanization (Kisan Drone Subsidy)",
            department="Mechanization & Technology Division",
            description="Subsidized drone purchase and custom hiring center assistance with up to 50% subsidy (max Rs 5,00,000 for FPOs/Cooperatives).",
            subsidy_percentage=50.0,
            max_benefit_amount=500000.0,
            eligibility_criteria="Registered Farmer Producer Organizations (FPOs) or Custom Hiring Centers"
        )
        s3 = GovScheme(
            scheme_code="PMFBY",
            title="Pradhan Mantri Fasal Bima Yojana (Crop Insurance)",
            department="Credit & Insurance Wing",
            description="Comprehensive crop risk coverage from pre-sowing to post-harvest against non-preventable natural risks.",
            subsidy_percentage=85.0,
            max_benefit_amount=120000.0,
            eligibility_criteria="All farmers growing notified crops in notified areas"
        )
        db.add_all([s1, s2, s3])
        db.commit()

        app1 = SchemeApplication(
            scheme_id=s1.id,
            farmer_id=farmer_user.id,
            farm_id=farm.id,
            applied_amount=6000.0,
            disbursed_amount=6000.0,
            status="disbursed",
            verification_notes="Aadhaar and land record authenticated. Direct transfer completed into SBI Jandiali branch."
        )
        db.add(app1)

        # 9. ADVISORY MESSAGES
        msg1 = AdvisoryMessage(
            sender_id=agronomist_user.id,
            sender_name=agronomist_user.full_name,
            sender_role="agronomist",
            receiver_id=farmer_user.id,
            farm_id=farm.id,
            subject="Soil Nitrogen Balance Recommendation for Field 1",
            body="Balwinder ji, soil sensor telemetry shows nitrogen at 185 kg/ha, which is optimal. Delay the planned additional urea top-dressing by 10 days to prevent excessive vegetative elongation before flowering.",
            advisory_type="scientific_guidance",
            priority="normal"
        )
        db.add(msg1)

        # 10. DIGITAL TWIN SNAPSHOT
        DigitalTwinService.get_snapshot(db, farm.id)

        db.commit()
        print("[Seed] Successfully seeded AGRIOS canonical database with all 4 personas, farm, fields, tasks, and telemetry!")

    except Exception as e:
        db.rollback()
        print(f"[Seed] Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
