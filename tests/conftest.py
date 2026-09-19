import pytest
from app.database import engine, Base
import app.models # Ensure all models are registered

@pytest.fixture(autouse=True, scope="session")
def setup_test_db():
    Base.metadata.create_all(bind=engine)
