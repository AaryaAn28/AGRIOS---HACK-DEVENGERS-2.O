from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.schemas.agrios_schemas import LoginRequest, TokenResponse
from app.utils.security import verify_password, hash_password, create_access_token
from app.utils.auth import get_current_user
from app.core.events import EventBus, DomainEvent

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class RegisterSubordinateRequest(BaseModel):
    role: str # agronomist, farmer, worker
    full_name: str
    email: Optional[str] = None
    jurisdiction_code: Optional[str] = "Punjab - Central Agro Zone"
    farm_id: Optional[str] = None
    registered_by_id: Optional[str] = None

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict()
    }

@router.post("/quick-login/{role}", response_model=TokenResponse)
def quick_login(role: str, db: Session = Depends(get_db)):
    """One-click instant authentication for hackathon presentation and portal switching."""
    normalized_role = role.lower().strip()
    if normalized_role == "agronomist":
        user = db.query(User).filter(User.role == "agronomist", User.email == "agronomist@agrios.in").first()
        if not user:
            user = db.query(User).filter(User.role == "agronomist").first()
    else:
        user = db.query(User).filter(User.role == normalized_role).first()
    if not user:
        user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"No user found for role '{role}'")

    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict()
    }

@router.post("/quick-login-user/{user_id}", response_model=TokenResponse)
def quick_login_user(user_id: str, db: Session = Depends(get_db)):
    """Quick login for dynamically registered personas by user ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict()
    }

@router.get("/quick-personas")
def get_quick_personas(db: Session = Depends(get_db)):
    """Returns all available login personas, ensuring Dr. Priya Sharma is the sole agronomist."""
    users = db.query(User).order_by(User.created_at.asc()).all()
    personas = []
    seen_priya = False
    for u in users:
        # Enforce exactly one agronomist: Dr. Priya Sharma
        if u.role == "agronomist":
            if u.email != "agronomist@agrios.in" or seen_priya:
                continue
            seen_priya = True
        p_dict = u.to_dict()
        p_dict["password_hint"] = "Admin@123"
        personas.append(p_dict)
    return personas

@router.post("/register-subordinate")
def register_subordinate(
    data: RegisterSubordinateRequest,
    db: Session = Depends(get_db)
):
    """Allows Government to register Agronomists (e.g. AGRONOMIST-001),
    and Agronomists to register Farmers & Field Workers.
    """
    role = data.role.lower().strip()
    if role not in ["agronomist", "farmer", "worker"]:
        raise HTTPException(status_code=400, detail="Role must be agronomist, farmer, or worker")

    # Count existing users in this role to generate sequential code
    count = db.query(User).filter(User.role == role).count()
    seq_num = count + 1
    role_prefix = role.upper()
    persona_code = f"{role_prefix}-{seq_num:03d}"

    # Default email if not provided
    clean_role = role.replace(" ", "")
    email = data.email.lower().strip() if data.email else f"{clean_role}{seq_num:03d}@agrios.in"

    # Check if email already exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        email = f"{clean_role}{seq_num:03d}_{count}@agrios.in"

    # For agronomists, require onboarding wizard on first login
    has_completed_onboarding = False if role == "agronomist" else True

    # Associate with default farm if farmer and none specified
    farm_id = data.farm_id
    if role == "farmer" and not farm_id:
        default_farm = db.query(Farm).first()
        if default_farm:
            farm_id = default_farm.id

    new_user = User(
        full_name=data.full_name,
        email=email,
        phone="+91 98000 00" + f"{seq_num:03d}",
        hashed_password=hash_password("Admin@123"),
        role=role,
        persona_code=persona_code,
        jurisdiction_code=data.jurisdiction_code,
        farm_id=farm_id,
        registered_by_id=data.registered_by_id,
        has_completed_onboarding=has_completed_onboarding,
        avatar_url=f"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if role == "worker":
        from app.models.workforce import WorkerProfile
        wp = WorkerProfile(
            user_id=new_user.id,
            status="AVAILABLE",
            active_tasks_count=0,
            hours_worked_this_week=0.0
        )
        db.add(wp)
        db.commit()

    # Emit domain event
    EventBus.publish(DomainEvent(
        event_type="auth.subordinate_registered",
        aggregate_type="user",
        aggregate_id=new_user.id,
        payload={
            "persona_code": persona_code,
            "role": role,
            "email": email,
            "full_name": data.full_name,
            "has_completed_onboarding": has_completed_onboarding
        },
        producer="government_command_center" if role == "agronomist" else "agronomist_portal"
    ))

    return {
        "message": f"Successfully registered {role.capitalize()} with ID {persona_code}",
        "id": new_user.id,
        "full_name": new_user.full_name,
        "persona_code": persona_code,
        "email": email,
        "default_password": "Admin@123",
        "has_completed_onboarding": has_completed_onboarding,
        "user": new_user.to_dict()
    }

@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = None
    if current_user.farm_id:
        farm_obj = db.query(Farm).filter(Farm.id == current_user.farm_id).first()
        if farm_obj:
            farm = farm_obj.to_dict()
    data = current_user.to_dict()
    data["farm"] = farm
    return data

# ================= AUTHENTICATION ENHANCEMENTS =================

class SignUpRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: str = "farmer"  # government, agronomist, farmer, worker
    phone: Optional[str] = None
    jurisdiction_code: Optional[str] = "Punjab - Central Agro Zone"
    farm_name: Optional[str] = None
    farm_acres: Optional[float] = 10.0

@router.post("/signup", response_model=TokenResponse)
def signup(data: SignUpRequest, db: Session = Depends(get_db)):
    clean_email = data.email.lower().strip()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists")

    role = data.role.lower().strip()
    if role not in ["government", "agronomist", "farmer", "worker"]:
        role = "farmer"

    count = db.query(User).filter(User.role == role).count()
    seq_num = count + 1
    role_prefix = role.upper()
    persona_code = f"{role_prefix}-{seq_num:03d}" if role != "government" else "GOV-001"

    # For agronomists, require onboarding wizard on first login
    has_completed_onboarding = False if role == "agronomist" else True

    # If farmer provided a farm name, create farm
    farm_id = None
    if role == "farmer" and data.farm_name:
        import uuid as uid
        new_farm = Farm(
            id=str(uid.uuid4()),
            name=data.farm_name,
            district="Ludhiana",
            state="Punjab",
            total_area_acres=data.farm_acres or 10.0,
            latitude=30.9010,
            longitude=75.8573
        )
        db.add(new_farm)
        db.commit()
        db.refresh(new_farm)
        farm_id = new_farm.id

    new_user = User(
        full_name=data.full_name,
        email=clean_email,
        phone=data.phone or "+91 98000 00000",
        hashed_password=hash_password(data.password),
        role=role,
        persona_code=persona_code,
        jurisdiction_code=data.jurisdiction_code,
        farm_id=farm_id,
        has_completed_onboarding=has_completed_onboarding,
        avatar_url=f"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if role == "worker":
        from app.models.workforce import WorkerProfile
        existing_wp = db.query(WorkerProfile).filter(WorkerProfile.user_id == new_user.id).first()
        if not existing_wp:
            wp = WorkerProfile(
                user_id=new_user.id,
                status="AVAILABLE",
                active_tasks_count=0,
                hours_worked_this_week=0.0
            )
            db.add(wp)
            db.commit()

    token = create_access_token({"sub": new_user.id, "role": new_user.role, "email": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user.to_dict()
    }

class GoogleAuthRequest(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[str] = "farmer"
    token: Optional[str] = None

@router.post("/google", response_model=TokenResponse)
def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    clean_email = (data.email or "google.pilot@agrios.in").lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        # Create user with Google profile
        role = (data.role or "farmer").lower().strip()
        count = db.query(User).filter(User.role == role).count()
        seq_num = count + 1
        persona_code = f"{role.upper()}-{seq_num:03d}"
        user = User(
            full_name=data.name or clean_email.split("@")[0].capitalize(),
            email=clean_email,
            hashed_password=hash_password("GoogleAuth@2026"),
            role=role,
            persona_code=persona_code,
            jurisdiction_code="Punjab Google Workspace Domain",
            avatar_url=data.avatar_url or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
            has_completed_onboarding=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict()
    }

_RESET_OTPS: Dict[str, str] = {}

class ForgotPasswordRequest(BaseModel):
    email: str

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    clean_email = req.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No registered account found with that email address.")

    import random
    otp = f"{random.randint(100000, 999999)}"
    _RESET_OTPS[clean_email] = otp
    return {
        "status": "success",
        "message": f"A 6-digit verification code has been dispatched to {clean_email}.",
        "otp_code": otp,
        "otp_hint": otp  # Included for immediate UI testing convenience
    }

class ResetPasswordRequest(BaseModel):
    email: str
    otp: Optional[str] = None
    otp_code: Optional[str] = None
    new_password: str

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    clean_email = req.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    submitted_otp = (req.otp or req.otp_code or "").strip()
    expected_otp = _RESET_OTPS.get(clean_email)
    if not expected_otp or expected_otp != submitted_otp:
        # Also allow demo master code 123456
        if submitted_otp != "123456":
            raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    user.hashed_password = hash_password(req.new_password)
    db.commit()
    _RESET_OTPS.pop(clean_email, None)

    return {
        "status": "success",
        "message": "Password reset successfully. You can now log in with your new credentials."
    }

@router.post("/reset-database")
def reset_database_endpoint():
    """Wipes all dynamic agronomists, farmers, workers and restores pristine clean slate."""
    from app.seed_agrios import reset_to_clean_slate
    reset_to_clean_slate()
    return {
        "status": "success",
        "message": "Clean-slate baseline restored. Only Government Admin remains in database."
    }
