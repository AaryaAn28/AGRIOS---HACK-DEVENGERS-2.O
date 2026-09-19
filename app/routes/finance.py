from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.finance import ProduceInventory, MarketPrice, FinancialTransaction
from app.models.user import User
from app.schemas.agrios_schemas import TransactionCreateRequest
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/finance", tags=["Market & Finance"])

@router.get("/inventory")
def list_produce_inventory(farm_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ProduceInventory)
    if farm_id:
        query = query.filter(ProduceInventory.farm_id == farm_id)
    return [p.to_dict() for p in query.all()]

@router.get("/market-prices")
def list_market_prices(crop_name: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(MarketPrice)
    if crop_name:
        query = query.filter(MarketPrice.crop_name.ilike(f"%{crop_name}%"))
    return [m.to_dict() for m in query.all()]

@router.get("/transactions")
def list_transactions(farm_id: Optional[str] = None, tx_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(FinancialTransaction)
    if farm_id:
        query = query.filter(FinancialTransaction.farm_id == farm_id)
    if tx_type:
        query = query.filter(FinancialTransaction.tx_type == tx_type)
    return [t.to_dict() for t in query.order_by(FinancialTransaction.tx_date.desc()).all()]

@router.post("/transactions")
def create_transaction(
    request: TransactionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tx = FinancialTransaction(
        farm_id=request.farm_id,
        tx_type=request.tx_type,
        category=request.category,
        amount=request.amount,
        description=request.description,
        counterparty=request.counterparty
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx.to_dict()

@router.get("/summary/{farm_id}")
def get_finance_summary(farm_id: str, db: Session = Depends(get_db)):
    txs = db.query(FinancialTransaction).filter(FinancialTransaction.farm_id == farm_id).all()
    total_revenue = sum(t.amount for t in txs if t.tx_type == "revenue")
    total_expense = sum(t.amount for t in txs if t.tx_type == "expense")
    net_profit = total_revenue - total_expense
    return {
        "farm_id": farm_id,
        "total_revenue": round(total_revenue, 2),
        "total_expense": round(total_expense, 2),
        "net_profit": round(net_profit, 2),
        "transactions_count": len(txs)
    }
