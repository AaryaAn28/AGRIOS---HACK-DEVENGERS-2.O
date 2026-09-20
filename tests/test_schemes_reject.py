import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.scheme import GovScheme, SchemeApplication
from app.models.farm import Farm
from app.models.user import User

client = TestClient(app)

def test_scheme_application_approve_and_reject_lifecycle():
    db = SessionLocal()
    try:
        scheme = db.query(GovScheme).first()
        assert scheme is not None, "GovScheme should be seeded"
        farm = db.query(Farm).first()
        assert farm is not None, "Farm should be seeded"
        farmer = db.query(User).filter(User.role == "farmer").first()
        assert farmer is not None, "Farmer user should exist"

        # Create two test applications
        app_to_approve = SchemeApplication(
            scheme_id=scheme.id,
            farmer_id=farmer.id,
            farm_id=farm.id,
            applied_amount=50000.0,
            status="under_review"
        )
        app_to_reject = SchemeApplication(
            scheme_id=scheme.id,
            farmer_id=farmer.id,
            farm_id=farm.id,
            applied_amount=75000.0,
            status="under_review"
        )
        db.add(app_to_approve)
        db.add(app_to_reject)
        db.commit()
        db.refresh(app_to_approve)
        db.refresh(app_to_reject)

        # Test Approval endpoint
        res_appr = client.post(f"/api/schemes/applications/{app_to_approve.id}/approve?disbursed_amount=50000")
        assert res_appr.status_code == 200
        data_appr = res_appr.json()
        assert data_appr["status"] == "disbursed"
        assert data_appr["disbursed_amount"] == 50000.0

        # Test Rejection endpoint
        res_rej = client.post(
            f"/api/schemes/applications/{app_to_reject.id}/reject?rejection_reason=Incomplete+Khasra+Record"
        )
        assert res_rej.status_code == 200
        data_rej = res_rej.json()
        assert data_rej["status"] == "rejected"
        assert "Incomplete Khasra Record" in data_rej["verification_notes"]

        # Verify in DB
        db.refresh(app_to_reject)
        assert app_to_reject.status == "rejected"

        # Test 404 on nonexistent application
        res_404 = client.post("/api/schemes/applications/nonexistent-uuid-9999/reject")
        assert res_404.status_code == 404

    finally:
        db.close()
