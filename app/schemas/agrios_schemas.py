from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# ================= AUTH SCHEMAS =================
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserRegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: str = "farmer"
    phone: Optional[str] = None
    jurisdiction_code: Optional[str] = None
    farm_id: Optional[str] = None

# ================= FARM & FIELD SCHEMAS =================
class FarmCreateRequest(BaseModel):
    name: str
    village: Optional[str] = None
    district: Optional[str] = "Ludhiana"
    state: Optional[str] = "Punjab"
    latitude: Optional[float] = 30.9010
    longitude: Optional[float] = 75.8573
    total_area_acres: Optional[float] = 10.0
    soil_type: Optional[str] = "Alluvial Loam"
    irrigation_source: Optional[str] = "Canal & Tube Well"

class FieldCreateRequest(BaseModel):
    farm_id: str
    name: str
    area_acres: float = 2.5
    soil_ph: Optional[float] = 6.8
    moisture_pct: Optional[float] = 42.0
    boundary_geojson: Optional[str] = None

# ================= CROP SCHEMAS =================
class CropCreateRequest(BaseModel):
    field_id: str
    farm_id: str
    crop_name: str
    variety: Optional[str] = None
    season: Optional[str] = "Rabi"
    stage: Optional[str] = "vegetative"
    growth_progress_pct: Optional[float] = 45.0
    health_index: Optional[float] = 90.0
    yield_estimate_kg: Optional[float] = 4800.0

class HealthLogCreateRequest(BaseModel):
    crop_id: str
    farm_id: str
    disease_detected: Optional[str] = "None"
    pest_risk: Optional[str] = "Low"
    severity: Optional[float] = 0.0
    diagnosis_notes: Optional[str] = None
    remedy_recommended: Optional[str] = None
    image_url: Optional[str] = None

# ================= TASK SCHEMAS =================
class TaskCreateRequest(BaseModel):
    farm_id: str
    field_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    task_type: Optional[str] = "irrigation"
    priority: Optional[str] = "medium"
    assigned_role: Optional[str] = "worker"
    assigned_to_user_id: Optional[str] = None
    due_date: Optional[str] = None
    checklist: Optional[List[Dict[str, Any]]] = None

class TaskStatusUpdateRequest(BaseModel):
    status: str  # pending, in_progress, completed, overdue
    notes: Optional[str] = None
    hours_logged: Optional[float] = 1.0

# ================= RESOURCE & EQUIPMENT SCHEMAS =================
class ResourceConsumeRequest(BaseModel):
    resource_id: str
    quantity: float
    task_id: Optional[str] = None
    notes: Optional[str] = None

class EquipmentBookingRequest(BaseModel):
    equipment_id: str
    farm_id: str
    purpose: str
    start_time: str
    end_time: str

# ================= RISK & WEATHER SCHEMAS =================
class RiskAlertCreateRequest(BaseModel):
    farm_id: str
    field_id: Optional[str] = None
    alert_category: str
    severity: str
    title: str
    message: str
    action_plan: Optional[str] = None

# ================= FINANCE SCHEMAS =================
class TransactionCreateRequest(BaseModel):
    farm_id: str
    tx_type: str  # expense, revenue
    category: str
    amount: float
    description: str
    counterparty: Optional[str] = None

# ================= COMMUNICATION SCHEMAS =================
class MessageSendRequest(BaseModel):
    receiver_id: Optional[str] = None
    farm_id: Optional[str] = None
    subject: str
    body: str
    advisory_type: Optional[str] = "scientific_guidance"
    priority: Optional[str] = "normal"

# ================= SIMULATOR SCHEMAS =================
class SimulationTriggerRequest(BaseModel):
    event_name: str  # e.g., "pest_outbreak", "sudden_drought", "equipment_failure", "task_completed", "worker_on_leave"
    farm_id: Optional[str] = None
    severity: Optional[str] = "critical"
    custom_params: Optional[Dict[str, Any]] = None
