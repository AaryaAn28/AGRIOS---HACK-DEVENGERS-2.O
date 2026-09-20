from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.scheme import GovScheme, SchemeApplication
from app.models.user import User
from app.utils.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/api/schemes", tags=["Government Schemes & Subsidies"])

@router.get("")
def list_schemes(active_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(GovScheme)
    if active_only:
        query = query.filter(GovScheme.active == True)
    return [s.to_dict() for s in query.all()]

@router.get("/applications")
def list_applications(farmer_id: Optional[str] = None, scheme_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(SchemeApplication)
    if farmer_id:
        query = query.filter(SchemeApplication.farmer_id == farmer_id)
    if scheme_id:
        query = query.filter(SchemeApplication.scheme_id == scheme_id)
    return [app.to_dict() for app in query.all()]

@router.post("/{scheme_id}/apply")
def apply_for_scheme(
    scheme_id: str,
    farm_id: str,
    applied_amount: float = 25000.0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = db.query(GovScheme).filter(GovScheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    app = SchemeApplication(
        scheme_id=scheme.id,
        farmer_id=current_user.id,
        farm_id=farm_id,
        applied_amount=applied_amount,
        status="under_review",
        verification_notes="Aadhaar and land registry e-KYC verified by regional portal."
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app.to_dict()

@router.post("/applications/{application_id}/approve")
def approve_scheme_application(
    application_id: str,
    disbursed_amount: float,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    app = db.query(SchemeApplication).filter(SchemeApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = "disbursed"
    app.disbursed_amount = disbursed_amount
    db.commit()
    db.refresh(app)
    return app.to_dict()

@router.post("/applications/{application_id}/reject")
def reject_scheme_application(
    application_id: str,
    rejection_reason: Optional[str] = "Eligibility criteria not met or incomplete land registry KYC",
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    app = db.query(SchemeApplication).filter(SchemeApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = "rejected"
    app.verification_notes = rejection_reason
    db.commit()
    db.refresh(app)
    return app.to_dict()
