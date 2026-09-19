import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from app.database import get_db
from app.models.user import User
from app.models.agricultural_profile import AgriculturalProfile
from app.core.events import EventBus, DomainEvent

router = APIRouter(prefix="/api/onboarding", tags=["Agricultural Onboarding"])

# Comprehensive Agricultural Taxonomy
TAXONOMY = {
    "farming_types": [
        {
            "id": "field_farming",
            "name": "Field / Arable Farming",
            "icon": "🌾",
            "desc": "Cereal crops, pulses, oilseeds, cash crops",
            "crops": ["Rice (Paddy)", "Wheat", "Maize", "Chickpea (Gram)", "Mustard / Rapeseed", "Cotton", "Sugarcane", "Bajra (Pearl Millet)", "Soybean"]
        },
        {
            "id": "horticulture",
            "name": "Horticulture",
            "icon": "🍎",
            "desc": "Fruits, vegetables, floriculture, spices",
            "crops": ["Tomato", "Potato", "Onion", "Chilli", "Brinjal (Eggplant)", "Mango", "Banana", "Kinnow / Citrus", "Guava", "Papaya", "Marigold", "Turmeric"]
        },
        {
            "id": "pisciculture",
            "name": "Aquaculture / Pisciculture",
            "icon": "🐟",
            "desc": "Freshwater fish, brackish water, shrimp, integrated ponds",
            "crops": ["Rohu (Labeo rohita)", "Catla", "Mrigal", "Tilapia", "Pangasius", "Vannamei Shrimp", "Freshwater Prawn"]
        },
        {
            "id": "agroforestry",
            "name": "Agroforestry & Plantation",
            "icon": "🌳",
            "desc": "Trees + crops, silvopasture, timber & fruit agroforestry",
            "crops": ["Poplar", "Eucalyptus", "Teak", "Moringa (Drumstick)", "Subabul", "Bamboo"]
        },
        {
            "id": "livestock",
            "name": "Livestock & Dairy Farming",
            "icon": "🐄",
            "desc": "Dairy cattle, buffaloes, poultry, sheep & goat",
            "crops": ["Murrah Buffalo", "Sahiwal Cattle", "Broiler Poultry", "Layer Poultry", "Beetal Goat", "Black Bengal"]
        },
        {
            "id": "apiculture",
            "name": "Apiculture (Beekeeping)",
            "icon": "🐝",
            "desc": "Honey production, pollination services",
            "crops": ["Apis mellifera (Italian Bee)", "Apis cerana indica (Indian Honeybee)", "Mustard Flora Honey", "Litchi Flora Honey"]
        },
        {
            "id": "mushroom",
            "name": "Mushroom Cultivation",
            "icon": "🍄",
            "desc": "Controlled indoor fungal fruiting",
            "crops": ["White Button Mushroom", "Oyster Mushroom (Dhingri)", "Milky Mushroom", "Paddy Straw Mushroom"]
        },
        {
            "id": "protected_ag",
            "name": "Protected / Controlled Ag",
            "icon": "🌱",
            "desc": "Greenhouses, polyhouses, hydroponics, vertical racks",
            "crops": ["Hydroponic Lettuce", "Colored Bell Peppers", "Cherry Tomato", "Seedless Cucumber", "Microgreens"]
        },
        {
            "id": "organic_natural",
            "name": "Organic & Natural Farming",
            "icon": "🌿",
            "desc": "Zero Budget Natural Farming (ZBNF), regenerative",
            "crops": ["Organic Basmati Rice", "Desi Wheat (Bansi/Khandwa)", "Organic Pulses", "Jeevarmit Soil Inoculation"]
        },
        {
            "id": "mixed_integrated",
            "name": "Mixed / Integrated Farming",
            "icon": "🔄",
            "desc": "Crop + fish pond + dairy biodigester system",
            "crops": ["Paddy-Fish Culture", "Crop-Livestock Biogas Nexus", "Integrated Duck-Fish System"]
        }
    ],
    "soil_types": ["Alluvial Loam", "Black Cotton Soil", "Red & Yellow Soil", "Laterite Soil", "Sandy Loam", "Saline / Alkaline Soil"],
    "irrigation_methods": ["Canal Network (Sirhind / BML)", "Solar Submersible Tube Well", "Micro-Drip Irrigation", "Overhead Sprinkler", "Precision Laser Levelled Basin", "Rain-fed Monsoon Catchment"],
    "common_pests": [
        "Yellow Rust (Puccinia striiformis)",
        "Rice Blast (Magnaporthe oryzae)",
        "Brown Planthopper (Nilaparvata lugens)",
        "Pink Bollworm",
        "Fall Armyworm",
        "Fruit & Shoot Borer",
        "Aphids & Whiteflies",
        "Root Knot Nematode",
        "Fish Fin Rot & EUS"
    ],
    "data_sources": [
        {"id": "satellite_ndvi", "name": "Sentinel-2 & Landsat Multi-Spectral NDVI", "available": True},
        {"id": "weather_radar", "name": "Hyperlocal Agro-Weather Telemetry & IMD Radar", "available": True},
        {"id": "soil_tests", "name": "Soil Health Card Laboratory NPK Tests", "available": True},
        {"id": "farm_photos", "name": "Krishi Sakhi Smartphone Georeferenced Macro Photos", "available": True},
        {"id": "field_worker_obs", "name": "Field Worker Ground-Truth Calibrated Checklists", "available": True},
        {"id": "iot_sensors", "name": "Field Telemetry IoT Soil Moisture & PTZ Cameras", "available": True},
        {"id": "drone_imagery", "name": "SMAM Kisan Drone Multispectral Thermal Flights", "available": False},
        {"id": "market_mandi_api", "name": "e-NAM APMC Mandi Daily Price Ticker", "available": True}
    ]
}

class ProfileSaveRequest(BaseModel):
    user_id: str
    jurisdiction_state: str = "Punjab"
    jurisdiction_district: str = "Ludhiana"
    jurisdiction_block: str = "Ludhiana East"
    village_coverage: str = "Jandiali Kalan, Kohara, Sahnewal"
    climate_zone: str = "Semi-Arid Subtropical"
    farming_types: List[str]
    crops_species: Dict[str, List[str]]
    farm_conditions: Dict[str, Any] = {}
    soil_config: Dict[str, Any] = {}
    water_config: Dict[str, Any] = {}
    climate_config: Dict[str, Any] = {}
    practices: Dict[str, Any] = {}
    risks_config: List[str] = []
    resources_config: Dict[str, Any] = {}
    data_availability: Dict[str, bool] = {}
    operational_params: Dict[str, Any] = {}

@router.get("/taxonomy")
def get_agricultural_taxonomy():
    """Returns the full agricultural taxonomy for the 11-step onboarding wizard."""
    return TAXONOMY

@router.get("/profile/{user_id}")
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    """Retrieves an Agronomist's configuration profile."""
    profile = db.query(AgriculturalProfile).filter(AgriculturalProfile.user_id == user_id).first()
    if not profile:
        return {"is_completed": False, "user_id": user_id}
    return profile.to_dict()

@router.post("/profile")
def save_user_profile(data: ProfileSaveRequest, db: Session = Depends(get_db)):
    """Saves completed Agricultural Configuration Profile and marks user onboarding as finished."""
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(AgriculturalProfile).filter(AgriculturalProfile.user_id == data.user_id).first()
    if not profile:
        profile = AgriculturalProfile(user_id=data.user_id)
        db.add(profile)

    profile.jurisdiction_state = data.jurisdiction_state
    profile.jurisdiction_district = data.jurisdiction_district
    profile.jurisdiction_block = data.jurisdiction_block
    profile.village_coverage = data.village_coverage
    profile.climate_zone = data.climate_zone

    profile.farming_types_json = json.dumps(data.farming_types)
    profile.crops_species_json = json.dumps(data.crops_species)
    profile.farm_conditions_json = json.dumps(data.farm_conditions)
    profile.soil_config_json = json.dumps(data.soil_config)
    profile.water_config_json = json.dumps(data.water_config)
    profile.climate_config_json = json.dumps(data.climate_config)
    profile.practices_json = json.dumps(data.practices)
    profile.risks_config_json = json.dumps(data.risks_config)
    profile.resources_config_json = json.dumps(data.resources_config)
    profile.data_availability_json = json.dumps(data.data_availability)
    profile.operational_params_json = json.dumps(data.operational_params)
    profile.is_completed = True

    # Mark user as having completed onboarding
    user.has_completed_onboarding = True

    db.commit()
    db.refresh(profile)

    # Publish Domain Event
    EventBus.publish(DomainEvent(
        event_type="agronomist.profile_configured",
        aggregate_type="agricultural_profile",
        aggregate_id=profile.id,
        payload={
            "user_id": user.id,
            "persona_code": user.persona_code or "AGRONOMIST",
            "farming_types": data.farming_types,
            "crops_species": data.crops_species,
            "risks_config": data.risks_config,
            "jurisdiction": f"{data.jurisdiction_district}, {data.jurisdiction_state}"
        },
        producer="agronomist_onboarding_wizard"
    ))

    return {
        "status": "success",
        "message": "AGRIOS Agricultural Configuration Profile generated successfully. Models tuned.",
        "profile": profile.to_dict(),
        "user": user.to_dict()
    }
