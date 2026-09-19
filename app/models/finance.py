import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from app.database import Base

class ProduceInventory(Base):
    __tablename__ = "produce_inventory"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=False, index=True)
    crop_name = Column(String(80), nullable=False)
    variety = Column(String(80), nullable=True)
    quantity_kg = Column(Float, default=5000.0)
    quality_grade = Column(String(20), default="Grade A")  # Grade A, Grade B, Standard
    storage_location = Column(String(120), default="District Silo Complex B-4")
    storage_moisture_pct = Column(Float, default=11.5)
    harvest_date = Column(DateTime, nullable=True)
    status = Column(String(30), default="in_storage")  # in_storage, listed_for_sale, sold

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "crop_name": self.crop_name,
            "variety": self.variety,
            "quantity_kg": round(self.quantity_kg, 1),
            "quality_grade": self.quality_grade,
            "storage_location": self.storage_location,
            "storage_moisture_pct": round(self.storage_moisture_pct, 1),
            "harvest_date": self.harvest_date.isoformat() if self.harvest_date else None,
            "status": self.status
        }

class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    crop_name = Column(String(80), nullable=False, index=True)
    mandi_name = Column(String(100), default="Khanna Mandi", index=True)
    state = Column(String(80), default="Punjab")
    min_price = Column(Float, default=2150.0)  # INR per quintal (100 kg)
    max_price = Column(Float, default=2480.0)
    modal_price = Column(Float, default=2350.0)
    msp_price = Column(Float, default=2275.0)
    trend = Column(String(20), default="bullish")  # bullish, bearish, stable
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "crop_name": self.crop_name,
            "mandi_name": self.mandi_name,
            "state": self.state,
            "min_price": self.min_price,
            "max_price": self.max_price,
            "modal_price": self.modal_price,
            "msp_price": self.msp_price,
            "trend": self.trend,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(64), ForeignKey("farms.id"), nullable=False, index=True)
    tx_type = Column(String(30), default="expense")  # expense, revenue
    category = Column(String(60), default="seeds")  # seeds, fertilizer, labor, fuel, machinery_hire, produce_sale, subsidy_payout
    amount = Column(Float, nullable=False)
    description = Column(String(200), nullable=False)
    counterparty = Column(String(120), nullable=True)  # e.g. "Punjab Agro Mandi", "Local Labor Union"
    payment_method = Column(String(40), default="UPI / Direct Bank Transfer")
    tx_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "tx_type": self.tx_type,
            "category": self.category,
            "amount": round(self.amount, 2),
            "description": self.description,
            "counterparty": self.counterparty,
            "payment_method": self.payment_method,
            "tx_date": self.tx_date.isoformat() if self.tx_date else None
        }
