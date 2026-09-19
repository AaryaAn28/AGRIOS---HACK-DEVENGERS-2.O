from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.schemas.agrios_schemas import LoginRequest, TokenResponse, UserRegisterRequest
from app.utils.security import verify_password, hash_password, create_access_token
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

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
        # Fallback to any user or create
        user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"No user found for role '{role}'")

    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict()
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
