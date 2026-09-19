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
    """Returns all available login personas, including dynamically registered ones."""
    users = db.query(User).order_by(User.created_at.asc()).all()
    personas = []
    for u in users:
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
