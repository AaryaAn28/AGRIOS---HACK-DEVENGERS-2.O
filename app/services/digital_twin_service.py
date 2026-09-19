import json
import asyncio
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from app.models.digital_twin import DigitalTwinSnapshot
from app.models.farm import Farm
from app.core.events import DomainEvent, event_bus

class DigitalTwinService:
    """Authoritative digital twin business adapter.
    Preserves a clean, strictly typed integration contract for future Claude Opus 3D module.
    """
    @staticmethod
    def get_snapshot(db: Session, farm_id: str) -> DigitalTwinSnapshot:
        snapshot = db.query(DigitalTwinSnapshot).filter(DigitalTwinSnapshot.farm_id == farm_id).first()
        if not snapshot:
            # Create standard baseline snapshot
            snapshot = DigitalTwinSnapshot(
                farm_id=farm_id,
                canopy_coverage_pct=72.5,
                leaf_area_index=3.8,
                chlorophyll_content=46.0,
                stress_index=0.12,
                ndvi_mean=0.78,
                soil_moisture_grid_json=json.dumps([
                    {"x": 0, "y": 0, "val": 42}, {"x": 1, "y": 0, "val": 44}, {"x": 2, "y": 0, "val": 40},
                    {"x": 0, "y": 1, "val": 39}, {"x": 1, "y": 1, "val": 45}, {"x": 2, "y": 1, "val": 41},
                    {"x": 0, "y": 2, "val": 38}, {"x": 1, "y": 2, "val": 43}, {"x": 2, "y": 2, "val": 42}
                ]),
                thermal_profile_grid_json=json.dumps([
                    {"x": 0, "y": 0, "temp_c": 26.2}, {"x": 1, "y": 0, "temp_c": 26.5}, {"x": 2, "y": 0, "temp_c": 26.3},
                    {"x": 0, "y": 1, "temp_c": 26.0}, {"x": 1, "y": 1, "temp_c": 25.8}, {"x": 2, "y": 1, "temp_c": 26.1},
                    {"x": 0, "y": 2, "temp_c": 26.4}, {"x": 1, "y": 2, "temp_c": 26.6}, {"x": 2, "y": 2, "temp_c": 26.5}
                ]),
                camera_orbit_preset="isometric_farm_overview",
                mesh_anchor_points_json=json.dumps([
                    {"label": "Canal Inlet", "lat": 30.9015, "lon": 75.8568, "elevation_m": 242.0},
                    {"label": "Main Pump House", "lat": 30.9012, "lon": 75.8575, "elevation_m": 242.5},
                    {"label": "Weather Sensor Tower", "lat": 30.9018, "lon": 75.8580, "elevation_m": 244.0}
                ])
            )
            db.add(snapshot)
            db.commit()
            db.refresh(snapshot)
        return snapshot

    @staticmethod
    def update_telemetry(
        db: Session,
        farm_id: str,
        canopy_pct: Optional[float] = None,
        stress_index: Optional[float] = None,
        ndvi: Optional[float] = None
    ) -> DigitalTwinSnapshot:
        snapshot = DigitalTwinService.get_snapshot(db, farm_id)
        if canopy_pct is not None:
            snapshot.canopy_coverage_pct = canopy_pct
        if stress_index is not None:
            snapshot.stress_index = stress_index
        if ndvi is not None:
            snapshot.ndvi_mean = ndvi

        db.commit()
        db.refresh(snapshot)

        event = DomainEvent(
            event_type="DIGITAL_TWIN_TELEMETRY_UPDATED",
            entity_name="DigitalTwinSnapshot",
            entity_id=snapshot.id,
            payload=snapshot.to_dict()
        )
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(event_bus.emit(event))
        except Exception:
            pass

        return snapshot

    @staticmethod
    def get_workers_for_scene(db: Session, farm_id: str) -> list:
        workers = []
        try:
            from app.models.farm import Farm
            from app.models.workforce import WorkerProfile
            from app.models.user import User
            from app.models.task import Task
            
            farm = db.query(Farm).filter(Farm.id == farm_id).first()
            if not farm:
                farm = db.query(Farm).first()
            actual_farm_id = farm.id if farm else farm_id

            profiles = db.query(WorkerProfile).all()
            user_ids_added = set()

            for i, p in enumerate(profiles):
                user = db.query(User).filter(User.id == p.user_id).first()
                if not user or user.id in user_ids_added:
                    continue
                user_ids_added.add(user.id)
                role = getattr(user, 'role', 'worker')
                avatar_color = 'green' if role == 'farmer' else 'blue' if role == 'agronomist' else 'orange'
                
                active_task = db.query(Task).filter(Task.assigned_to_id == user.id, Task.status.in_(['pending', 'in_progress'])).first()
                task_dict = {"title": active_task.title, "type": active_task.task_type, "status": active_task.status} if active_task else None
                
                # Positions in farm coordinates (-30 to 30)
                positions = [
                    {"x": -15.0, "z": -10.0},
                    {"x": 12.0, "z": 8.0},
                    {"x": -8.0, "z": 18.0},
                    {"x": 20.0, "z": -12.0},
                ]
                pos = positions[i % len(positions)]
                
                workers.append({
                    "id": user.id,
                    "name": getattr(user, 'full_name', getattr(user, 'username', 'Worker')),
                    "role": role,
                    "avatar_color": avatar_color,
                    "current_task": task_dict or {"title": "Field Monitoring", "type": "inspecting", "status": "in_progress"},
                    "fatigue_index": getattr(p, 'fatigue_score', 42.0) or 42.0,
                    "position": pos
                })

            # If fewer than 2 workers, pull registered personnel from User table
            if len(workers) < 2:
                field_users = db.query(User).filter(User.role.in_(['worker', 'farmer', 'agronomist'])).limit(4).all()
                for j, u in enumerate(field_users):
                    if u.id in user_ids_added:
                        continue
                    user_ids_added.add(u.id)
                    role = getattr(u, 'role', 'worker')
                    avatar_color = 'green' if role == 'farmer' else 'blue' if role == 'agronomist' else 'orange'
                    offsets = [
                        {"x": -18.0, "z": -12.0},
                        {"x": 10.0, "z": 6.0},
                        {"x": -6.0, "z": 22.0},
                        {"x": 24.0, "z": -16.0},
                    ]
                    pos = offsets[j % len(offsets)]
                    workers.append({
                        "id": u.id,
                        "name": getattr(u, 'full_name', getattr(u, 'username', 'Worker')),
                        "role": role,
                        "avatar_color": avatar_color,
                        "current_task": {"title": "Routine Parcel Inspection", "type": "inspecting", "status": "in_progress"},
                        "fatigue_index": 35.0 + (j * 8.0),
                        "position": pos
                    })
        except Exception as e:
            print(f"[DigitalTwinService] Worker query fallback: {e}")
        
        if not workers:
            workers = [
                {
                    "id": "w1", 
                    "name": "Sunita Devi (Krishi Sakhi)", 
                    "role": "worker", 
                    "avatar_color": "orange", 
                    "current_task": {"title": "Soil Moisture Check", "type": "inspecting", "status": "in_progress"}, 
                    "fatigue_index": 42.0, 
                    "position": {"x": -15.0, "z": -10.0}
                },
                {
                    "id": "w2", 
                    "name": "Balwinder Singh (Farmer)", 
                    "role": "farmer", 
                    "avatar_color": "green", 
                    "current_task": {"title": "Irrigation Gate Valve", "type": "watering", "status": "in_progress"}, 
                    "fatigue_index": 38.0, 
                    "position": {"x": 12.0, "z": 8.0}
                }
            ]
        return workers

    @staticmethod
    def get_weather_state(db: Session, farm_id: str) -> dict:
        hour = datetime.now(timezone.utc).hour
        time_of_day = 'day'
        if 5 <= hour < 8:
            time_of_day = 'dawn'
        elif 8 <= hour < 18:
            time_of_day = 'day'
        elif 18 <= hour < 20:
            time_of_day = 'dusk'
        else:
            time_of_day = 'night'
            
        return {
            "condition": "clear",
            "temperature_c": 28.5,
            "humidity_pct": 62,
            "wind_speed_kmh": 8.2,
            "rain_probability_pct": 15,
            "time_of_day": time_of_day
        }

    @staticmethod
    def get_scene_data(db: Session, farm_id: str) -> dict:
        from app.models.farm import Farm
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            farm = db.query(Farm).first()
        actual_farm_id = farm.id if farm else farm_id
        farm_dict = farm.to_dict() if farm else {"name": "Greenfield Model Farm", "total_area_acres": 14.5, "latitude": 30.9010, "longitude": 75.8573}

        boundary = None
        spatial_objects = []
        planting_grid = None

        try:
            from app.models.farm_structure import FarmStructureVersion
            structure = db.query(FarmStructureVersion).filter(FarmStructureVersion.farm_id == actual_farm_id).order_by(FarmStructureVersion.version_number.desc()).first()
            if not structure:
                structure = db.query(FarmStructureVersion).order_by(FarmStructureVersion.version_number.desc()).first()
            if structure:
                boundary = json.loads(structure.boundary_geojson) if structure.boundary_geojson else None
                spatial_objects = json.loads(structure.spatial_objects_json) if structure.spatial_objects_json else []
                planting_grid = json.loads(structure.planting_grid_json) if structure.planting_grid_json else None
        except Exception as e:
            print(f"[DigitalTwinService] Structure load warning: {e}")

        telemetry = DigitalTwinService.get_snapshot(db, actual_farm_id).to_dict()
        workers = DigitalTwinService.get_workers_for_scene(db, actual_farm_id)
        weather = DigitalTwinService.get_weather_state(db, actual_farm_id)
        
        risks = []
        try:
            from app.models.risk import RiskAlert
            db_risks = db.query(RiskAlert).filter(RiskAlert.farm_id == actual_farm_id, RiskAlert.status == 'active').all()
            risks = [r.to_dict() for r in db_risks]
        except Exception:
            pass

        cameras = []
        try:
            from app.models.camera import Camera
            db_cameras = db.query(Camera).filter(Camera.farm_id == actual_farm_id).all()
            cameras = [c.to_dict() for c in db_cameras]
        except Exception:
            pass

        crop_plan = None
        try:
            from app.services.crop_plan_service import CropPlanService
            crop_type = None
            if planting_grid and isinstance(planting_grid, dict) and planting_grid.get("crop"):
                crop_type = planting_grid.get("crop")
            if not crop_type:
                crop_type = getattr(farm, 'crop_type', None) or "Wheat"
            duration = 195 if "pisciculture" in str(crop_type).lower() else 120
            crop_plan = CropPlanService.generate_master_plan(crop_type, duration)
        except Exception as e:
            print(f"[DigitalTwinService] Crop plan warning: {e}")

        return {
            "farm": farm_dict,
            "boundary": boundary,
            "spatial_objects": spatial_objects,
            "planting_grid": planting_grid,
            "telemetry": telemetry,
            "crop_plan": crop_plan,
            "workers": workers,
            "weather": weather,
            "risks": risks,
            "cameras": cameras
        }

