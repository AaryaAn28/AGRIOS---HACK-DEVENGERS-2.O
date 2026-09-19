import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import uuid

from app.database import get_db
from app.models.farm import Farm
from app.models.user import User
from app.models.farm_structure import FarmStructureVersion
from app.core.events import EventBus, DomainEvent
from app.services.crop_plan_service import CropPlanService

router = APIRouter(prefix="/api/farms", tags=["Farm Structures & Digital Twin"])

class StructureVersionCreate(BaseModel):
    created_by_id: str
    change_summary: str
    boundary: Optional[dict] = None
    spatial_objects: Optional[List[dict]] = None
    planting_grid: Optional[dict] = None

class PlantingGridUpdate(BaseModel):
    updated_by_id: str
    plant_updates: List[dict] # [{"row": 2, "col": 5, "status": "healthy"|"stressed"|"dead"}]
    notes: Optional[str] = "Field-worker plant counts audit"

class WalkAndCalibrateRequest(BaseModel):
    agronomist_id: str
    farm_name: str
    jurisdiction_code: Optional[str] = "PUNJAB_LUDHIANA"
    area_acres: float = 50.0
    crop_type: str = "Wheat"
    target_duration_days: Optional[int] = 120
    boundary_waypoints: Optional[List[dict]] = None
    spatial_objects: Optional[List[dict]] = None

@router.post("/walk-and-calibrate")
def walk_and_calibrate_farm(data: WalkAndCalibrateRequest, db: Session = Depends(get_db)):
    """
    Performs field walkthrough calibration, establishes farm boundaries,
    spatial infrastructure (borewells, nursery, weather station),
    generates 3D Digital Twin Version 1 (v1), and synthesizes the Master Crop Plan.
    """
    # 1. Create or retrieve Farm
    farm = db.query(Farm).filter(Farm.name == data.farm_name).first()
    if not farm:
        farm = Farm(
            id=str(uuid.uuid4()),
            name=data.farm_name,
            district="Ludhiana",
            state="Punjab",
            total_area_acres=data.area_acres,
            assigned_agronomist_id=data.agronomist_id,
            latitude=30.9010,
            longitude=75.8573
        )
        db.add(farm)
        db.commit()
        db.refresh(farm)
    else:
        farm.total_area_acres = data.area_acres
        farm.assigned_agronomist_id = data.agronomist_id
        db.commit()

    # 2. Build GeoJSON boundary from waypoints or default
    if data.boundary_waypoints and len(data.boundary_waypoints) >= 3:
        coords = [[p.get("lng", 75.856), p.get("lat", 30.900)] for p in data.boundary_waypoints]
        # close the polygon loop
        if coords[0] != coords[-1]:
            coords.append(coords[0])
        boundary_geojson = {"type": "Polygon", "coordinates": [coords]}
    else:
        boundary_geojson = {
            "type": "Polygon",
            "coordinates": [[[75.856, 30.900], [75.862, 30.900], [75.862, 30.906], [75.856, 30.906], [75.856, 30.900]]]
        }

    # 3. Default or custom spatial objects
    spatial_objects = data.spatial_objects or [
        {"id": "road_01", "type": "road", "name": "Main Tractor Access Path (4m width)", "status": "all_weather"},
        {"id": "borewell_01", "type": "water_source", "name": "Solar Submersible Borewell (75m)", "capacity_lph": 18000},
        {"id": "pond_01", "type": "water_source", "name": "Rainwater Harvesting Catchment Pond", "capacity_liters": 500000},
        {"id": "poly_01", "type": "greenhouse", "name": "Climate-Controlled Nursery Polyhouse", "area_sqm": 450},
        {"id": "weather_01", "type": "sensor", "name": "LoRa Microclimate Weather Station", "status": "active"},
        {"id": "shed_01", "type": "building", "name": "Farm Machinery Shed & Bio-Storage", "area_sqm": 300}
    ]

    # 4. Standard Planting Grid
    planting_grid = {
        "field_name": f"{farm.name} - Calibrated Plot 1",
        "crop": data.crop_type,
        "row_spacing_cm": 20,
        "plant_spacing_cm": 10,
        "total_rows": 24,
        "plants_per_row": 50,
        "total_plants": 1200,
        "healthy_plants": 1180,
        "stressed_plants": 20,
        "dead_plants": 0
    }

    # 5. Create immutable Structure Version 1 (v1)
    # Deactivate existing versions
    db.query(FarmStructureVersion).filter(FarmStructureVersion.farm_id == farm.id).update({"is_current": False})

    v1 = FarmStructureVersion(
        farm_id=farm.id,
        version_number=1,
        created_by_id=data.agronomist_id,
        change_summary=f"Field boundary walkthrough calibration & 3D twin generation ({data.area_acres} Acres, {data.crop_type})",
        boundary_geojson=json.dumps(boundary_geojson),
        spatial_objects_json=json.dumps(spatial_objects),
        planting_grid_json=json.dumps(planting_grid),
        is_current=True
    )
    db.add(v1)
    db.commit()
    db.refresh(v1)

    # 6. Synthesize the Master Crop Growing Plan
    crop_plan = CropPlanService.generate_master_plan(data.crop_type, data.target_duration_days or 120)

    # 7. Publish Domain Event
    EventBus.publish(DomainEvent(
        event_name="farm_calibrated_3d",
        aggregate_type="Farm",
        aggregate_id=farm.id,
        payload={
            "farm_id": farm.id,
            "farm_name": farm.name,
            "calibrated_by": data.agronomist_id,
            "acres": data.area_acres,
            "crop_type": data.crop_type,
            "version_number": 1,
            "spatial_objects_count": len(spatial_objects)
        },
        producer="AgronomistFieldWalkthrough"
    ))

    return {
        "status": "SUCCESS",
        "message": f"Farm '{farm.name}' calibrated. 3D Digital Twin Version 1 created.",
        "farm_id": farm.id,
        "farm_name": farm.name,
        "structure": v1.to_dict(),
        "crop_plan": crop_plan
    }

@router.get("/{farm_id}/structures")
def get_farm_structures(farm_id: str, db: Session = Depends(get_db)):
    """Returns the current farm structure version and full version history timeline."""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    versions = db.query(FarmStructureVersion).filter(FarmStructureVersion.farm_id == farm_id).order_by(FarmStructureVersion.version_number.desc()).all()

    if not versions:
        # Create baseline version
        initial_version = FarmStructureVersion(
            farm_id=farm_id,
            version_number=1,
            created_by_id=farm.assigned_agronomist_id or farm.owner_id or "system",
            change_summary="Initial baseline farm layout and GIS georeferenced boundaries",
            boundary_geojson=json.dumps({
                "type": "Polygon",
                "coordinates": [[[75.856, 30.900], [75.859, 30.900], [75.859, 30.903], [75.856, 30.903], [75.856, 30.900]]]
            }),
            spatial_objects_json=json.dumps([
                {"id": "road_01", "type": "road", "name": "Main Tractor Access Path", "status": "all_weather"},
                {"id": "well_01", "type": "water_source", "name": "Solar Submersible Borewell", "depth_m": 75},
                {"id": "shed_01", "type": "building", "name": "Cold Storage & Machinery Shed", "area_sqm": 350}
            ]),
            planting_grid_json=json.dumps({
                "field_name": "Field 1",
                "crop": "Wheat",
                "row_spacing_cm": 20,
                "plant_spacing_cm": 10,
                "total_rows": 24,
                "plants_per_row": 50,
                "total_plants": 1200,
                "healthy_plants": 1180,
                "stressed_plants": 20,
                "dead_plants": 0
            }),
            is_current=True
        )
        db.add(initial_version)
        db.commit()
        db.refresh(initial_version)
        versions = [initial_version]

    current = next((v for v in versions if v.is_current), versions[0])
    return {
        "current_structure": current.to_dict(),
        "versions": [v.to_dict() for v in versions],
        "total_versions": len(versions)
    }

@router.post("/{farm_id}/structures")
def create_structure_version(farm_id: str, data: StructureVersionCreate, db: Session = Depends(get_db)):
    """Creates a new immutable version of the farm spatial layout."""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    old_versions = db.query(FarmStructureVersion).filter(FarmStructureVersion.farm_id == farm_id).all()
    latest_num = max([v.version_number for v in old_versions], default=0)
    for v in old_versions:
        v.is_current = False

    new_version_num = latest_num + 1
    new_v = FarmStructureVersion(
        farm_id=farm_id,
        version_number=new_version_num,
        created_by_id=data.created_by_id,
        change_summary=data.change_summary,
        boundary_geojson=json.dumps(data.boundary) if data.boundary else None,
        spatial_objects_json=json.dumps(data.spatial_objects) if data.spatial_objects else '[]',
        planting_grid_json=json.dumps(data.planting_grid) if data.planting_grid else '{}',
        is_current=True
    )
    db.add(new_v)
    db.commit()
    db.refresh(new_v)

    EventBus.publish(DomainEvent(
        event_name="structure_version_created",
        aggregate_type="FarmStructure",
        aggregate_id=new_v.id,
        payload={
            "farm_id": farm_id,
            "version_number": new_version_num,
            "change_summary": data.change_summary,
            "created_by": data.created_by_id
        },
        producer="DigitalTwinEditor"
    ))

    return new_v.to_dict()

@router.patch("/{farm_id}/structures/planting-grid")
def update_planting_grid(farm_id: str, data: PlantingGridUpdate, db: Session = Depends(get_db)):
    """Updates plant health/counts within the planting grid."""
    current = db.query(FarmStructureVersion).filter(
        FarmStructureVersion.farm_id == farm_id,
        FarmStructureVersion.is_current == True
    ).first()
    if not current:
        raise HTTPException(status_code=404, detail="Current structure not found")

    grid = json.loads(current.planting_grid_json) if current.planting_grid_json else {}
    dead_count = grid.get("dead_plants", 0)
    stressed_count = grid.get("stressed_plants", 20)
    healthy_count = grid.get("healthy_plants", 1180)

    for update in data.plant_updates:
        status = update.get("status")
        if status == "dead":
            dead_count += 1
            healthy_count = max(0, healthy_count - 1)
        elif status == "stressed":
            stressed_count += 1
            healthy_count = max(0, healthy_count - 1)
        elif status == "healthy":
            healthy_count += 1

    grid["dead_plants"] = dead_count
    grid["stressed_plants"] = stressed_count
    grid["healthy_plants"] = healthy_count
    current.planting_grid_json = json.dumps(grid)
    db.commit()

    EventBus.publish(DomainEvent(
        event_name="planting_grid_updated",
        aggregate_type="PlantingGrid",
        aggregate_id=current.id,
        payload={
            "farm_id": farm_id,
            "healthy": healthy_count,
            "stressed": stressed_count,
            "dead": dead_count,
            "notes": data.notes
        },
        producer="FieldWorkerApp"
    ))

    return {
        "status": "success",
        "planting_grid": grid,
        "message": "Plant operational counts updated in Digital Twin"
    }
