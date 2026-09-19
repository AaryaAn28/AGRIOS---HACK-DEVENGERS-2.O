import pytest
from app.database import SessionLocal
from app.models.user import User
from app.utils.security import verify_password, hash_password, create_access_token, decode_access_token

def test_password_hashing():
    raw = "Admin@123"
    hashed = hash_password(raw)
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPass", hashed) is False

def test_jwt_token_generation_and_decoding():
    payload = {"sub": "user-123", "role": "farmer", "email": "farmer@agrios.in"}
    token = create_access_token(payload)
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user-123"
    assert decoded["role"] == "farmer"

def test_seeded_personas_exist():
    db = SessionLocal()
    # At clean slate, Government admin is pre-seeded
    gov = db.query(User).filter(User.role == "government").first()
    assert gov is not None, "Government admin must exist in clean-slate baseline"
    assert gov.email == "gov@agrios.in"
    db.close()
