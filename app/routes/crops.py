from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.crop import Crop, CropHealthLog
from app.models.user import User
from app.schemas.agrios_schemas import CropCreateRequest, HealthLogCreateRequest
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/crops", tags=["Crops & Health Tracking"])

@router.get("")
def list_crops(farm_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Crop)
    if farm_id:
        query = query.filter(Crop.farm_id == farm_id)
    return [c.to_dict() for c in query.all()]

@router.get("/knowledge-base")
def get_crop_knowledge_base():
    """Returns agronomic reference data for all supported crops (durations, expected yields, seasons)."""
    return {
        "crops": [
            {"name": "Wheat", "scientific": "Triticum aestivum", "duration_days": 120, "expected_yield_qtl": 24.5, "season": "Rabi"},
            {"name": "Rice", "scientific": "Oryza sativa", "duration_days": 135, "expected_yield_qtl": 28.0, "season": "Kharif"},
            {"name": "Tomato", "scientific": "Solanum lycopersicum", "duration_days": 105, "expected_yield_qtl": 180.0, "season": "Rabi/Kharif"},
            {"name": "Potato", "scientific": "Solanum tuberosum", "duration_days": 85, "expected_yield_qtl": 120.0, "season": "Rabi"},
            {"name": "Maize", "scientific": "Zea mays", "duration_days": 100, "expected_yield_qtl": 32.0, "season": "Kharif"},
            {"name": "Cotton", "scientific": "Gossypium hirsutum", "duration_days": 165, "expected_yield_qtl": 12.0, "season": "Kharif"},
            {"name": "Sugarcane", "scientific": "Saccharum officinarum", "duration_days": 340, "expected_yield_qtl": 380.0, "season": "Perennial"},
            {"name": "Mustard", "scientific": "Brassica juncea", "duration_days": 110, "expected_yield_qtl": 8.5, "season": "Rabi"},
            {"name": "Chickpea", "scientific": "Cicer arietinum", "duration_days": 100, "expected_yield_qtl": 10.0, "season": "Rabi"},
            {"name": "Soybean", "scientific": "Glycine max", "duration_days": 95, "expected_yield_qtl": 12.0, "season": "Kharif"},
            {"name": "Groundnut", "scientific": "Arachis hypogaea", "duration_days": 105, "expected_yield_qtl": 14.0, "season": "Kharif"},
            {"name": "Banana", "scientific": "Musa acuminata", "duration_days": 330, "expected_yield_qtl": 320.0, "season": "Perennial"},
            {"name": "Mango", "scientific": "Mangifera indica", "duration_days": 180, "expected_yield_qtl": 65.0, "season": "Summer"},
            {"name": "Onion", "scientific": "Allium cepa", "duration_days": 120, "expected_yield_qtl": 150.0, "season": "Rabi"},
            {"name": "Chilli", "scientific": "Capsicum annuum", "duration_days": 135, "expected_yield_qtl": 55.0, "season": "Kharif/Rabi"},
            {"name": "Turmeric", "scientific": "Curcuma longa", "duration_days": 240, "expected_yield_qtl": 100.0, "season": "Kharif"},
            {"name": "Pisciculture", "scientific": "Composite Carp Culture", "duration_days": 195, "expected_yield_qtl": 38.0, "season": "Perennial"}
        ]
    }

@router.get("/taxonomies")
def get_crop_taxonomies():
    """Returns the 5 production system taxonomy configurations for the 11-step questionnaire."""
    return {
        "taxonomies": [
            {"id": "terrestrial", "name": "Terrestrial Field Crops", "subtypes": [
                "Open Field Cereal Grains", "Grain Legumes & Pulses", "Oilseed Crops", "Fiber & Cash Crops"
            ]},
            {"id": "pisciculture", "name": "Pisciculture & Aquaculture", "subtypes": [
                "Composite Carp Polyculture", "Intensive Biofloc (Zero-Discharge)", "Monoculture Tilapia/Pangasius",
                "Giant Freshwater Prawn (Scampi)", "Carp Nursery & Spawn Production"
            ]},
            {"id": "polyhouse", "name": "Polyhouse & Protected Cultivation", "subtypes": [
                "Dutch Polyhouse (Climate-Controlled)", "Hydroponic Dutch Buckets", "NFT Closed-Loop Lettuce",
                "Naturally Ventilated Polyhouse (NVP)", "Plug Nursery & Portray Propagation"
            ]},
            {"id": "horticulture", "name": "Commercial Horticulture & Orchards", "subtypes": [
                "High-Density Orchards", "Vineyards & Trellis Systems", "Floriculture & Cut Flowers",
                "Truck Vegetables & Market Gardens", "Spice Plantations"
            ]},
            {"id": "hill", "name": "Terrace & Hill Agriculture", "subtypes": [
                "Alpine Terraces & Rain-Fed", "Tea & Coffee Hedgerows", "Hill Pomology (Apple/Pear)",
                "Highland Spices (Large Cardamom)", "Kuhl Watershed Management"
            ]}
        ]
    }

@router.get("/{crop_id}")
def get_crop(crop_id: str, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    data = crop.to_dict()
    data["health_logs"] = [log.to_dict() for log in crop.health_logs]
    return data

@router.post("/health-scan")
def scan_crop_photo(request: HealthLogCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """AI Crop Photo Scanner endpoint. Simulates edge vision model diagnostic with explainable remediation."""
    log = CropHealthLog(
        crop_id=request.crop_id,
        farm_id=request.farm_id,
        recorded_by_id=current_user.id,
        disease_detected=request.disease_detected or "Early Foliar Rust Detected",
        pest_risk=request.pest_risk or "Moderate",
        severity=request.severity if request.severity is not None else 0.35,
        diagnosis_notes=request.diagnosis_notes or "Hyperspectral pattern matches Puccinia striiformis (Yellow Rust) in early stage on upper leaf surface.",
        remedy_recommended=request.remedy_recommended or "Apply Mancozeb 75% WP @ 2g/liter of water or Nativo 75 WG @ 0.6g/L within 48 hours. Ensure uniform droplet size.",
        image_url=request.image_url or "assets/scans/sample_wheat_rust.jpg"
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log.to_dict()
