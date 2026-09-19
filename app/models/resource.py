import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class FarmResource(Base):
    __tablename__ = "farm_resources"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=False, index=True)
    name = Column(String(120), nullable=False)  # e.g., "Urea 46%", "DAP Fertilizer", "PBW-550 Wheat Seeds"
    category = Column(String(40), default="fertilizer")  # fertilizer, seed, pesticide, water, fuel
    quantity = Column(Float, default=100.0)
    unit = Column(String(20), default="kg")  # kg, liters, bags, hours
    reorder_threshold = Column(Float, default=20.0)
    cost_per_unit = Column(Float, default=25.0)  # INR
    supplier = Column(String(120), default="IFFCO Regional Cooperative")
    status = Column(String(30), default="adequate")  # adequate, low, exhausted
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    transactions = relationship("ResourceTransaction", back_populates="resource", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "resource_name": self.name,
            "name": self.name,
            "category": self.category,
            "quantity": round(self.quantity, 1),
            "unit": self.unit,
            "reorder_threshold": self.reorder_threshold,
            "min_threshold": self.reorder_threshold,
            "cost_per_unit": self.cost_per_unit,
            "supplier": self.supplier,
            "status": self.status,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class ResourceTransaction(Base):
    """Transaction-Based Inventory & Procurement (Guardrail 14).
    Tracks every purchase, consumption, batch number, unit cost, and links to financial ledger.
    """
    __tablename__ = "resource_transactions"

    id = Column(String(64), primary_key=True, default=lambda: f"rtx_{uuid.uuid4().hex[:8]}")
    resource_id = Column(String(64), ForeignKey("farm_resources.id"), nullable=False, index=True)
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=False)
    transaction_type = Column(String(32), default="consumption") # purchase, consumption, adjustment
    quantity = Column(Float, nullable=False)
    unit_cost = Column(Float, default=25.0)
    total_cost = Column(Float, default=0.0)
    batch_no = Column(String(64), default=lambda: f"BATCH-{datetime.now().strftime('%Y%m%d')}")
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    resource = relationship("FarmResource", back_populates="transactions")

    def to_dict(self):
        return {
            "id": self.id,
            "resource_id": self.resource_id,
            "farm_id": self.farm_id,
            "transaction_type": self.transaction_type,
            "quantity": self.quantity,
            "unit_cost": self.unit_cost,
            "total_cost": self.total_cost,
            "batch_no": self.batch_no,
            "notes": self.notes,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }

class FarmEquipment(Base):
    __tablename__ = "farm_equipment"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=False, index=True)
    name = Column(String(120), nullable=False)  # e.g., "Mahindra 575 DI Tractor", "Solar Submersible Pump"
    equipment_type = Column(String(40), default="tractor")  # tractor, pump, sprayer, harvester, drone
    registration_no = Column(String(40), nullable=True)
    status = Column(String(30), default="available")  # available, in_use, maintenance, booked
    operating_hours = Column(Float, default=320.0)
    fuel_pct = Column(Float, default=85.0)
    hourly_rate = Column(Float, default=450.0)  # INR/hour
    location = Column(String(100), default="Primary Shed")
    last_serviced = Column(DateTime, nullable=True)

    bookings = relationship("EquipmentBooking", back_populates="equipment", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "name": self.name,
            "equipment_type": self.equipment_type,
            "registration_no": self.registration_no,
            "status": self.status,
            "operating_hours": round(self.operating_hours, 1),
            "fuel_pct": round(self.fuel_pct, 1),
            "fuel_level_pct": round(self.fuel_pct, 1),
            "hourly_rate": self.hourly_rate,
            "location": self.location,
            "last_serviced": self.last_serviced.isoformat() if self.last_serviced else None
        }

class EquipmentBooking(Base):
    __tablename__ = "equipment_bookings"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    equipment_id = Column(String(64), ForeignKey("farm_equipment.id"), nullable=False, index=True)
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=False)
    booked_by_id = Column(String(64), nullable=True)
    purpose = Column(String(140), default="Field plowing and seedbed preparation")
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    total_cost = Column(Float, default=900.0)
    status = Column(String(30), default="confirmed")  # confirmed, active, completed, cancelled
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    equipment = relationship("FarmEquipment", back_populates="bookings")

    def to_dict(self):
        return {
            "id": self.id,
            "equipment_id": self.equipment_id,
            "farm_id": self.farm_id,
            "booked_by_id": self.booked_by_id,
            "purpose": self.purpose,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "total_cost": self.total_cost,
            "status": self.status,
            "equipment_name": self.equipment.name if self.equipment else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
