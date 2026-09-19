import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(30), default="farmer", index=True, nullable=False)  # farmer, worker, agronomist, government, admin
    jurisdiction_code = Column(String(60), nullable=True)  # e.g., "PUNJAB_LUDHIANA"
    farm_id = Column(String(64), nullable=True)
    avatar_url = Column(String(256), nullable=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "jurisdiction_code": self.jurisdiction_code,
            "farm_id": self.farm_id,
            "avatar_url": self.avatar_url,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
