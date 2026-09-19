import json
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.farm import Farm, Field
from app.models.crop import Crop, CropHealthLog
from app.models.task import FarmTask, WorkLog, Task
from app.models.resource import FarmResource, FarmEquipment, EquipmentBooking
from app.models.risk import WeatherLog, RiskAlert
from app.models.finance import ProduceInventory, MarketPrice, FinancialTransaction
from app.models.scheme import GovScheme, SchemeApplication
from app.models.communication import AdvisoryMessage
from app.models.digital_twin import DigitalTwinSnapshot
from app.models.farm_structure import FarmStructureVersion
from app.models.agricultural_profile import AgriculturalProfile
from app.utils.security import hash_password

def seed_database(clean_slate: bool = True):
    """
    Seeds the clean-slate AGRIOS database.
    Only the Government Admin is hardcoded. Zero hardcoded crops, zero pre-existing farms,
    zero mock tasks. Everything is created dynamically through the agricultural workflow.
    """
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # Check if Government admin already exists
        gov_user = db.query(User).filter(User.role == "government").first()
        if not gov_user:
            print("[Seed] Seeding Government Admin Official (Clean Slate)...")
            gov_user = User(
                full_name="Dr. Vikramaditya Sen",
                email="gov@agrios.in",
                phone="+91 98140 11001",
                hashed_password=hash_password("Admin@123"),
                role="government",
                jurisdiction_code="PUNJAB_LUDHIANA_ZONE",
                avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
                has_completed_onboarding=True
            )
            db.add(gov_user)
            db.commit()
            print("[Seed] Government Admin created (gov@agrios.in / Admin@123).")
        else:
            print("[Seed] Government Admin already present.")

    except Exception as e:
        db.rollback()
        print(f"[Seed] Error during seeding: {e}")
        raise e
    finally:
        db.close()

def reset_to_clean_slate():
    """
    Wipes all dynamic farms, crops, tasks, and subordinate users,
    restoring pristine clean-slate state where only Government exists.
    """
    db: Session = SessionLocal()
    try:
        # Delete subordinate users
        db.query(User).filter(User.role.in_(["agronomist", "farmer", "worker"])).delete(synchronize_session=False)
        # Delete dynamic models
        db.query(Task).delete(synchronize_session=False)
        db.query(FarmTask).delete(synchronize_session=False)
        db.query(CropHealthLog).delete(synchronize_session=False)
        db.query(Crop).delete(synchronize_session=False)
        db.query(Field).delete(synchronize_session=False)
        db.query(FarmStructureVersion).delete(synchronize_session=False)
        db.query(Farm).delete(synchronize_session=False)
        db.query(AgriculturalProfile).delete(synchronize_session=False)
        db.query(RiskAlert).delete(synchronize_session=False)
        db.query(ProduceInventory).delete(synchronize_session=False)
        db.commit()
        print("[Reset] Clean slate restored. Zero hardcoded crops/farms.")
    except Exception as e:
        db.rollback()
        print(f"[Reset] Error resetting to clean slate: {e}")
    finally:
        db.close()
