import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class GovScheme(Base):
    __tablename__ = "gov_schemes"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    scheme_code = Column(String(40), unique=True, nullable=False)  # e.g., "PM-KISAN", "PMFBY", "SMAM-DRONE"
    title = Column(String(160), nullable=False)
    department = Column(String(120), default="Ministry of Agriculture & Farmers Welfare")
    description = Column(Text, nullable=False)
    subsidy_percentage = Column(Float, default=50.0)  # e.g., 50%
    max_benefit_amount = Column(Float, default=50000.0)
    eligibility_criteria = Column(Text, default="Small and Marginal Farmers (<5 acres) with active Aadhaar link")
    deadline = Column(DateTime, nullable=True)
    active = Column(Boolean, default=True)

    applications = relationship("SchemeApplication", back_populates="scheme", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "scheme_code": self.scheme_code,
            "title": self.title,
            "department": self.department,
            "description": self.description,
            "subsidy_percentage": self.subsidy_percentage,
            "max_benefit_amount": self.max_benefit_amount,
            "eligibility_criteria": self.eligibility_criteria,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "active": self.active,
            "applications_count": len(self.applications) if self.applications else 0
        }

class SchemeApplication(Base):
    __tablename__ = "scheme_applications"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    scheme_id = Column(String(64), ForeignKey("gov_schemes.id"), nullable=False, index=True)
    farmer_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=False)
    applied_amount = Column(Float, default=25000.0)
    disbursed_amount = Column(Float, default=0.0)
    status = Column(String(30), default="applied")  # applied, under_review, approved, disbursed, rejected
    verification_notes = Column(Text, nullable=True)
    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    scheme = relationship("GovScheme", back_populates="applications")

    def to_dict(self):
        return {
            "id": self.id,
            "scheme_id": self.scheme_id,
            "scheme_code": self.scheme.scheme_code if self.scheme else None,
            "scheme_title": self.scheme.title if self.scheme else None,
            "farmer_id": self.farmer_id,
            "farm_id": self.farm_id,
            "applied_amount": self.applied_amount,
            "disbursed_amount": self.disbursed_amount,
            "status": self.status,
            "verification_notes": self.verification_notes,
            "applied_at": self.applied_at.isoformat() if self.applied_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
