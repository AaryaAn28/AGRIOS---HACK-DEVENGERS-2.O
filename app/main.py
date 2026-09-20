import os
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base, ensure_schema
from app.seed_agrios import seed_database

# Import all routers
from fastapi.responses import FileResponse, JSONResponse
from app.routes.auth import router as auth_router
from app.routes.farms import router as farms_router
from app.routes.crops import router as crops_router
from app.routes.tasks import router as tasks_router
from app.routes.resources import router as resources_router
from app.routes.risks import router as risks_router
from app.routes.finance import router as finance_router
from app.routes.schemes import router as schemes_router
from app.routes.communications import router as communications_router
from app.routes.digital_twin import router as digital_twin_router
from app.routes.simulator import router as simulator_router
from app.routes.websockets import router as websockets_router
from app.routes.cameras import router as cameras_router
from app.routes.workforce import router as workforce_router
from app.routes.onboarding import router as onboarding_router
from app.routes.farm_structures import router as farm_structures_router
from app.routes.crop_plans import router as crop_plans_router
from app.routes.agrios_ecosystem import router as ecosystem_router
from app.routes.workforce_operations import router as workforce_ops_router
from app.routes.biosecurity_operations import router as biosecurity_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[Lifespan] Initializing {settings.PROJECT_NAME}...")
    # 1. Create DB tables & migrate columns
    ensure_schema()
    # 2. Seed initial canonical data
    seed_database()
    print(f"[Lifespan] AGRIOS startup completed. Ready for demo.")
    yield
    print(f"[Lifespan] Shutting down AGRIOS...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.0.0",
    description="Unified Living Agricultural Operating System with 4 Portals, God Database and Realtime Event Stream",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    err_tb = traceback.format_exc()
    print(f"[ERROR 500] {request.method} {request.url.path}: {exc}\n{err_tb}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}", "type": type(exc).__name__}
    )

# Register all Routers
app.include_router(websockets_router)
app.include_router(auth_router)
app.include_router(farms_router)
app.include_router(crops_router)
app.include_router(tasks_router)
app.include_router(resources_router)
app.include_router(risks_router)
app.include_router(finance_router)
app.include_router(schemes_router)
app.include_router(communications_router)
app.include_router(digital_twin_router)
app.include_router(simulator_router)
app.include_router(cameras_router)
app.include_router(workforce_router)
app.include_router(onboarding_router)
app.include_router(farm_structures_router)
app.include_router(crop_plans_router)
app.include_router(ecosystem_router)
app.include_router(workforce_ops_router)
app.include_router(biosecurity_router)

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "AGRIOS Living Agricultural OS",
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT
    }

# Clean frontend routes without .html extension
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")

@app.get("/")
@app.get("/about")
@app.get("/about.html")
def get_about_page():
    return FileResponse(os.path.join(frontend_path, "about.html"))

@app.get("/login")
@app.get("/login.html")
@app.get("/index.html")
def get_login_page():
    return FileResponse(os.path.join(frontend_path, "index.html"))

@app.get("/logout")
def get_logout_page():
    return FileResponse(os.path.join(frontend_path, "index.html"))

@app.get("/farmer")
def get_farmer_page():
    return FileResponse(os.path.join(frontend_path, "farmer.html"))

@app.get("/worker")
def get_worker_page():
    return FileResponse(os.path.join(frontend_path, "worker.html"))

@app.get("/agronomist")
def get_agronomist_page():
    return FileResponse(os.path.join(frontend_path, "agronomist.html"))

@app.get("/government")
def get_government_page():
    return FileResponse(os.path.join(frontend_path, "government.html"))

@app.get("/simulator")
def get_simulator_page():
    return FileResponse(os.path.join(frontend_path, "simulator.html"))

# Mount frontend directory for static assets
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

