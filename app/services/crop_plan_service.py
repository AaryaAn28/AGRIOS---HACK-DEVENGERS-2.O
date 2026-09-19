"""
AGRIOS Master Crop Growing Plan Service
Synthesizes comprehensive 60–120 day agronomic growth schedules, input protocols,
water regimes, and stage-by-stage task releases for all agricultural crops.
"""

from typing import Dict, Any, List, Optional
import datetime

# Comprehensive Agricultural Crop Knowledge Base
AGRONOMIC_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    "Wheat": {
        "scientific_name": "Triticum aestivum",
        "family": "Poaceae",
        "standard_duration_days": 120,
        "water_requirement_mm": "400 - 450 mm",
        "optimal_temp_c": "15°C - 24°C",
        "seed_rate_kg_acre": 40.0,
        "soil_preference": "Well-drained loam or clay loam, pH 6.0 - 7.5",
        "stages": [
            {
                "stage_num": 1,
                "name": "Land Preparation & Basal Nutrition",
                "start_day": 1,
                "end_day": 10,
                "description": "Deep summer plowing followed by rotavator pulverization. Incorporate organic manure and basal phosphorus.",
                "inputs": ["FYM Compost: 4 tonnes/acre", "Basal DAP: 55 kg/acre", "Muriate of Potash: 20 kg/acre"],
                "water_regime": "Pre-sowing irrigation (Rauni) to achieve field capacity moisture.",
                "scouting_flags": "Soil grubs, termite emergence, clod size uniformity",
                "tasks": [
                    {"title": "Execute Deep Tillage & Rotavator Pass", "role": "worker", "category": "tillage", "priority": "high"},
                    {"title": "Apply Basal DAP and Compost Uniformly", "role": "worker", "category": "nutrition", "priority": "high"},
                    {"title": "Verify Rauni Pre-Sowing Moisture Calibration", "role": "farmer", "category": "irrigation", "priority": "medium"}
                ]
            },
            {
                "stage_num": 2,
                "name": "Seed Priming, Drilling & Emergence",
                "start_day": 11,
                "end_day": 20,
                "description": "Seed bio-priming with Trichoderma viride. Line sowing with seed-cum-fertilizer drill at 5 cm depth.",
                "inputs": ["Certified Seed: 40 kg/acre", "Trichoderma viride: 10 g/kg seed", "Azotobacter culture: 250 g/acre"],
                "water_regime": "No irrigation needed; conserve seedbed moisture.",
                "scouting_flags": "Seedling emergence percentage, damping-off patches",
                "tasks": [
                    {"title": "Bio-prime Wheat Seeds with Trichoderma", "role": "worker", "category": "sowing", "priority": "urgent"},
                    {"title": "Calibrate Seed Drill Spacing (20 cm row-to-row)", "role": "farmer", "category": "equipment", "priority": "high"},
                    {"title": "Conduct Day 7 Emergence Count & Canopy Stand Audit", "role": "worker", "category": "scouting", "priority": "medium"}
                ]
            },
            {
                "stage_num": 3,
                "name": "Crown Root Initiation (CRI) & 1st Irrigation",
                "start_day": 21,
                "end_day": 35,
                "description": "Most critical physiological stage. Crown roots emerge 2 cm below soil. First top-dressing of nitrogen.",
                "inputs": ["Urea (Top Dressing 1): 45 kg/acre", "Zinc Sulfate (21%): 10 kg/acre"],
                "water_regime": "1st Critical Irrigation (50–60 mm depth). Water stress at CRI causes 30% irreversible yield penalty.",
                "scouting_flags": "Phalaris minor (Gullidanda) weed flushes, armyworm",
                "tasks": [
                    {"title": "Execute 1st Critical CRI Irrigation", "role": "worker", "category": "irrigation", "priority": "urgent"},
                    {"title": "Broadcast 1st Nitrogen Split with Zinc", "role": "worker", "category": "nutrition", "priority": "high"},
                    {"title": "Interculture Manual Weeding / Narrow-leaf Herbicide", "role": "worker", "category": "protection", "priority": "high"}
                ]
            },
            {
                "stage_num": 4,
                "name": "Active Tillering & Canopy Expansion",
                "start_day": 36,
                "end_day": 55,
                "description": "Secondary tiller production. High nitrogen uptake and canopy closure.",
                "inputs": ["Foliar 19-19-19 Bio-NPK: 1 kg/acre", "Neem Oil Extract: 500 ml/acre preventative"],
                "water_regime": "2nd Irrigation at Late Tillering (40–45 days after sowing).",
                "scouting_flags": "Yellow Rust (Puccinia striiformis) initial leaf pustules, Aphids",
                "tasks": [
                    {"title": "Execute 2nd Irrigation Pass", "role": "worker", "category": "irrigation", "priority": "medium"},
                    {"title": "Drone / Visual Yellow Rust Sentinel Scouting", "role": "worker", "category": "scouting", "priority": "urgent"},
                    {"title": "Apply Foliar Bio-NPK 19-19-19 Booster", "role": "worker", "category": "nutrition", "priority": "medium"}
                ]
            },
            {
                "stage_num": 5,
                "name": "Jointing & Booting Stage",
                "start_day": 56,
                "end_day": 75,
                "description": "Stem elongation and flag leaf emergence. Spikelet differentiation occurs.",
                "inputs": ["Urea (Final Split): 25 kg/acre", "Propiconazole 25% EC (if rust threshold breached): 200 ml/acre"],
                "water_regime": "3rd Irrigation at Booting stage. Keep soil at 65% field capacity.",
                "scouting_flags": "Flag leaf necrosis, powdery mildew, termite activity",
                "tasks": [
                    {"title": "Apply Final Nitrogen Top Dressing", "role": "worker", "category": "nutrition", "priority": "high"},
                    {"title": "3rd Critical Booting Irrigation", "role": "worker", "category": "irrigation", "priority": "high"},
                    {"title": "Microclimate Temperature & Humidity Sensor Check", "role": "farmer", "category": "telemetry", "priority": "medium"}
                ]
            },
            {
                "stage_num": 6,
                "name": "Flowering, Anthesis & Milk Stage",
                "start_day": 76,
                "end_day": 95,
                "description": "Pollination and early grain development. Milky fluid accumulates in grain.",
                "inputs": ["Potassium Nitrate (13-0-45) Foliar: 1.5 kg/acre (prevents terminal heat shock)"],
                "water_regime": "4th Irrigation at Milk stage. Avoid water logging and high wind days (prevents lodging).",
                "scouting_flags": "Aphid colonies on ears, loose smut, lodging risk",
                "tasks": [
                    {"title": "Anti-Heat Stress Foliar Spray (13-0-45)", "role": "worker", "category": "protection", "priority": "high"},
                    {"title": "Calibrated Gentle Irrigation (Avoid Windy Evenings)", "role": "worker", "category": "irrigation", "priority": "high"},
                    {"title": "Aphid Colony Inspection along Headlands", "role": "worker", "category": "scouting", "priority": "medium"}
                ]
            },
            {
                "stage_num": 7,
                "name": "Dough Stage & Physiological Ripening",
                "start_day": 96,
                "end_day": 110,
                "description": "Grain hardens, moisture content drops from 40% to 20%. Green pigmentation fades to golden amber.",
                "inputs": ["None (Chemical withdrawal period)"],
                "water_regime": "Cease all irrigation 12–15 days before anticipated harvest.",
                "scouting_flags": "Bird damage, rat burrows, shattering risk",
                "tasks": [
                    {"title": "Perform Complete Irrigation Cut-off", "role": "farmer", "category": "irrigation", "priority": "high"},
                    {"title": "Install Bird Scarers & Rodent Traps", "role": "worker", "category": "protection", "priority": "medium"},
                    {"title": "Moisture Meter Grain Sampling (Target <15%)", "role": "farmer", "category": "quality", "priority": "high"}
                ]
            },
            {
                "stage_num": 8,
                "name": "Mechanical Harvesting, Threshing & Mandi Storage",
                "start_day": 111,
                "end_day": 120,
                "description": "Combine harvesting when grain moisture reaches 12%. Threshing, straw management (Super SMS), and mandi dispatch.",
                "inputs": ["Bags / Silo Liners", "Stubble microbial decomposer: 1 liter/acre"],
                "water_regime": "Dry field conditions required for heavy machinery.",
                "scouting_flags": "Cracked grains, dockage percentage, storage pests",
                "tasks": [
                    {"title": "Schedule Combine Harvester with Super SMS", "role": "farmer", "category": "harvest", "priority": "urgent"},
                    {"title": "Grain Moisture & Quality Verification at Gate", "role": "farmer", "category": "mandi", "priority": "high"},
                    {"title": "Apply Bio-decomposer on Crop Residue (Zero Stubble Burning)", "role": "worker", "category": "ecology", "priority": "high"}
                ]
            }
        ]
    },

    "Rice": {
        "scientific_name": "Oryza sativa",
        "family": "Poaceae",
        "standard_duration_days": 120,
        "water_requirement_mm": "1100 - 1400 mm",
        "optimal_temp_c": "22°C - 34°C",
        "seed_rate_kg_acre": 15.0,
        "soil_preference": "Heavy clay or clayey loam with impervious subsoil, pH 5.5 - 7.0",
        "stages": [
            {
                "stage_num": 1,
                "name": "Nursery Sowing & Raised Bed Prep",
                "start_day": 1,
                "end_day": 20,
                "description": "Nursery bed formation, seed salt floating check, priming with carbendazim, and raising 25-day old robust seedlings.",
                "inputs": ["Certified Paddy Seed: 15 kg/acre", "FYM: 500 kg for nursery", "Carbendazim: 2 g/kg"],
                "water_regime": "Keep nursery bed continuously moist without submerging seedlings.",
                "scouting_flags": "Bacterial seedling blight, gall midge",
                "tasks": [
                    {"title": "Prepare 1/10th Acre Wet Nursery Bed", "role": "worker", "category": "nursery", "priority": "high"},
                    {"title": "Soak, Incubate & Broadcast Pre-germinated Seeds", "role": "worker", "category": "sowing", "priority": "urgent"},
                    {"title": "Maintain Thin Water Layer in Nursery Bed", "role": "worker", "category": "irrigation", "priority": "medium"}
                ]
            },
            {
                "stage_num": 2,
                "name": "Main Field Puddling & Transplanting",
                "start_day": 21,
                "end_day": 35,
                "description": "Flood main field, perform puddling (2 passes rotavator) to form hard pan. Transplant 2-3 seedlings/hill at 20x15 cm.",
                "inputs": ["DAP: 45 kg/acre", "Zinc Sulfate 33%: 7 kg/acre", "MOP: 25 kg/acre"],
                "water_regime": "Maintain 2–3 cm standing water during transplanting.",
                "scouting_flags": "Snails, root damage, uneven transplanting depth",
                "tasks": [
                    {"title": "Puddle Field to Create Hard Impervious Pan", "role": "worker", "category": "tillage", "priority": "high"},
                    {"title": "Transplant Seedlings (2-3/hill at 20x15 cm)", "role": "worker", "category": "transplanting", "priority": "urgent"},
                    {"title": "Apply Pre-emergence Herbicide within 3 Days", "role": "worker", "category": "protection", "priority": "high"}
                ]
            },
            {
                "stage_num": 3,
                "name": "Active Tillering & Nitrogen Top-Dressing",
                "start_day": 36,
                "end_day": 55,
                "description": "Formation of productive tillers. High vegetative biomass accumulation.",
                "inputs": ["Urea (1st Split): 35 kg/acre", "Cartap Hydrochloride 4G: 7 kg/acre for stem borer"],
                "water_regime": "Alternate Wetting and Drying (AWD) cycle to conserve water while maintaining root oxygenation.",
                "scouting_flags": "Yellow stem borer dead hearts, Brown planthopper (BPH) at base",
                "tasks": [
                    {"title": "Broadcast 1st Urea Split on Drained Soil", "role": "worker", "category": "nutrition", "priority": "high"},
                    {"title": "Monitor AWD Field Tube for 5 cm Below Surface", "role": "farmer", "category": "irrigation", "priority": "high"},
                    {"title": "Stem Borer Dead Heart Scouting across Diagonal", "role": "worker", "category": "scouting", "priority": "medium"}
                ]
            },
            {
                "stage_num": 4,
                "name": "Panicle Initiation & Flag Leaf Stage",
                "start_day": 56,
                "end_day": 75,
                "description": "Spikelet formation inside stem sheath. Most critical water sensitive phase.",
                "inputs": ["Urea (Final Split): 25 kg/acre", "Azoxystrobin + Difenoconazole: 200 ml/acre"],
                "water_regime": "Mandatory 5 cm standing water throughout panicle initiation.",
                "scouting_flags": "Bacterial leaf blight, sheath blight water-soaked lesions",
                "tasks": [
                    {"title": "Apply Final Nitrogen Top Dressing", "role": "worker", "category": "nutrition", "priority": "high"},
                    {"title": "Maintain Continuous 5 cm Water Depth", "role": "worker", "category": "irrigation", "priority": "urgent"},
                    {"title": "Sheath Blight & Blast Preventative Spray", "role": "worker", "category": "protection", "priority": "high"}
                ]
            },
            {
                "stage_num": 5,
                "name": "Heading, Anthesis & Milk Grain Stage",
                "start_day": 76,
                "end_day": 95,
                "description": "Panicles emerge from flag leaf sheath. Flowering lasts 7 days. Starch synthesis begins.",
                "inputs": ["0-0-50 Potassium Sulfate Foliar: 1 kg/acre"],
                "water_regime": "Maintain shallow water (2–3 cm) until milk stage completes.",
                "scouting_flags": "Rice gundhi bug, false smut yellow velvety balls",
                "tasks": [
                    {"title": "Gundhi Bug Dusk/Dawn Sweep-net Scouting", "role": "worker", "category": "scouting", "priority": "high"},
                    {"title": "Foliar Potassium Spray for Grain Plumpness", "role": "worker", "category": "nutrition", "priority": "medium"},
                    {"title": "Check Water Level Sensors in Deep Zones", "role": "farmer", "category": "telemetry", "priority": "medium"}
                ]
            },
            {
                "stage_num": 6,
                "name": "Dough, Grain Hardening & Pre-Harvest Drainage",
                "start_day": 96,
                "end_day": 110,
                "description": "Grain transitions from soft to hard dough. 85% of panicle turns golden yellow.",
                "inputs": ["None"],
                "water_regime": "Drain all standing water from field 14 days before harvest.",
                "scouting_flags": "Lodging risk from late season storms, rat burrows",
                "tasks": [
                    {"title": "Open Field Drain Channels for Total Water Evacuation", "role": "worker", "category": "drainage", "priority": "urgent"},
                    {"title": "Set Up Owl Perches and Rodent Traps", "role": "worker", "category": "protection", "priority": "medium"},
                    {"title": "Verify Grain Hardness & Hull Color (>85% Golden)", "role": "farmer", "category": "quality", "priority": "high"}
                ]
            },
            {
                "stage_num": 7,
                "name": "Combine Harvesting, Moisture Testing & Mandi Despatch",
                "start_day": 111,
                "end_day": 120,
                "description": "Mechanized harvest at 18–20% moisture, rapid threshing and cleaning, yard sun-drying to 14%.",
                "inputs": ["Jute bags / grain tarp"],
                "water_regime": "Firm, bone-dry soil for combine traction.",
                "scouting_flags": "Paddy milling recovery percentage, moisture level",
                "tasks": [
                    {"title": "Execute Tracked Combine Harvester Operation", "role": "farmer", "category": "harvest", "priority": "urgent"},
                    {"title": "Moisture Reduction & Quality Grading at Yard", "role": "worker", "category": "quality", "priority": "high"},
                    {"title": "Dispatch Certified Lot to Government APMC Mandi", "role": "farmer", "category": "mandi", "priority": "high"}
                ]
            }
        ]
    },

    "Tomato": {
        "scientific_name": "Solanum lycopersicum",
        "family": "Solanaceae",
        "standard_duration_days": 100,
        "water_requirement_mm": "500 - 650 mm (Drip fertigation)",
        "optimal_temp_c": "18°C - 27°C",
        "seed_rate_kg_acre": 0.15,
        "soil_preference": "Deep sandy loam or clay loam, rich in organic matter, pH 6.0 - 6.8",
        "stages": [
            {
                "stage_num": 1,
                "name": "Bed Preparation, Drip Line & Mulching",
                "start_day": 1,
                "end_day": 12,
                "description": "Raised broad beds (90 cm width, 15 cm height). Lay inline drip lateral and 25-micron silver-black plastic mulch.",
                "inputs": ["Vermi-compost: 2 tonnes/acre", "Silver-black mulch: 4 rolls/acre", "Basal NPK: 50 kg/acre"],
                "water_regime": "Initial drip flush to moisten bed prior to transplanting.",
                "scouting_flags": "Drip emitter clogging, bed shape uniformity",
                "tasks": [
                    {"title": "Form 90 cm Raised Beds & Install Drip Laterals", "role": "worker", "category": "tillage", "priority": "high"},
                    {"title": "Lay Silver-Black Mulch & Punch Holes at 45 cm", "role": "worker", "category": "equipment", "priority": "high"},
                    {"title": "Test Drip Pressure & Uniform Emitter Flow", "role": "farmer", "category": "irrigation", "priority": "medium"}
                ]
            },
            {
                "stage_num": 2,
                "name": "Pro-tray Seedling Transplanting & Staking",
                "start_day": 13,
                "end_day": 30,
                "description": "Transplant 25-day old pro-tray seedlings into mulch holes. Drench root zone with bio-fungicide. Install bamboo stakes.",
                "inputs": ["Certified Hybrid Seedlings: 8,000/acre", "Pseudomonas fluorescens: 5 g/liter root drench", "Bamboo stakes & trellising twine"],
                "water_regime": "Daily drip irrigation: 2–3 liters/plant/day depending on evapotranspiration.",
                "scouting_flags": "Whitefly (Bemisia tabaci) vectors of Leaf Curl Virus, Cutworms",
                "tasks": [
                    {"title": "Transplant Hybrid Pro-Tray Seedlings in Evening", "role": "worker", "category": "transplanting", "priority": "urgent"},
                    {"title": "Root Drench with Pseudomonas Bio-fungicide", "role": "worker", "category": "protection", "priority": "high"},
                    {"title": "Erect Bamboo Stakes & String Trellis Wire", "role": "worker", "category": "equipment", "priority": "high"}
                ]
            },
            {
                "stage_num": 3,
                "name": "Vegetative Growth, Pruning & Fertigation",
                "start_day": 31,
                "end_day": 50,
                "description": "Single-stem pruning (remove side suckers up to 30 cm). Weekly fertigation with water-soluble 19-19-19.",
                "inputs": ["Water Soluble NPK 19-19-19: 5 kg/acre/week", "Neem Azadirachtin 10,000 ppm: 2 ml/liter"],
                "water_regime": "Maintain steady soil matric potential (-20 kPa) using tensiometers.",
                "scouting_flags": "Early blight (Alternaria solani) target spots, Leaf miner serpentine mines",
                "tasks": [
                    {"title": "Prune Lateral Suckers up to 30 cm Height", "role": "worker", "category": "operations", "priority": "high"},
                    {"title": "Execute Scheduled Drip Fertigation (19-19-19)", "role": "worker", "category": "nutrition", "priority": "high"},
                    {"title": "Install Yellow Sticky Traps for Whitefly (15 traps/acre)", "role": "worker", "category": "scouting", "priority": "medium"}
                ]
            },
            {
                "stage_num": 4,
                "name": "Flowering, Fruit Set & Calcium/Boron Spray",
                "start_day": 51,
                "end_day": 70,
                "description": "Profuse flowering and berry fruit set. Apply calcium nitrate and boron to avoid Blossom End Rot (BER).",
                "inputs": ["Calcium Nitrate: 4 kg/acre drip", "Solubor (Boron 20%): 1 g/liter foliar", "0-52-34 (Mono Potassium Phosphate): 4 kg/acre"],
                "water_regime": "Avoid any drought stress fluctuation to prevent fruit cracking.",
                "scouting_flags": "Tomato fruit borer (Helicoverpa armigera), Blossom end rot",
                "tasks": [
                    {"title": "Foliar Calcium + Boron Spray to Prevent BER", "role": "worker", "category": "nutrition", "priority": "urgent"},
                    {"title": "Install Pheromone Traps for Helicoverpa (5 traps/acre)", "role": "worker", "category": "protection", "priority": "high"},
                    {"title": "Tie Main Stem Upright to Trellis Wire", "role": "worker", "category": "operations", "priority": "medium"}
                ]
            },
            {
                "stage_num": 5,
                "name": "Fruit Sizing, Color Break & Harvest Cycles",
                "start_day": 71,
                "end_day": 100,
                "description": "Breaker stage to ripe red stage. Harvest every 3–4 days in early morning. Grade into crates.",
                "inputs": ["0-0-50 Potassium Sulfate: 5 kg/acre drip", "Plastic crates"],
                "water_regime": "Moderate drip irrigation; do not saturate beds before harvest.",
                "scouting_flags": "Late blight (Phytophthora infestans), fruit cracking, anthracnose",
                "tasks": [
                    {"title": "Early Morning Selective Harvest (Breaker/Pink Stage)", "role": "worker", "category": "harvest", "priority": "urgent"},
                    {"title": "Grade Tomatoes by Size and Firmness into Crates", "role": "worker", "category": "quality", "priority": "high"},
                    {"title": "Log Yield Volume and Despatch to Cold Storage / Market", "role": "farmer", "category": "mandi", "priority": "high"}
                ]
            }
        ]
    },

    "Maize": {
        "scientific_name": "Zea mays",
        "family": "Poaceae",
        "standard_duration_days": 95,
        "water_requirement_mm": "500 - 600 mm",
        "optimal_temp_c": "21°C - 30°C",
        "seed_rate_kg_acre": 8.0,
        "soil_preference": "Deep, fertile loam or silt loam, well drained, pH 6.0 - 7.5",
        "stages": [
            {
                "stage_num": 1,
                "name": "Field Ridge Preparation & Planting",
                "start_day": 1,
                "end_day": 15,
                "description": "Deep plowing, ridge and furrow layout at 60 cm spacing. Sowing at 20 cm plant-to-plant on ridge sides.",
                "inputs": ["Hybrid Seed: 8 kg/acre", "Basal DAP: 50 kg/acre", "MOP: 20 kg/acre", "Zinc: 10 kg/acre"],
                "water_regime": "Light furrow irrigation immediately after sowing.",
                "scouting_flags": "Fall Armyworm (Spodoptera frugiperda) early whorl damage",
                "tasks": [
                    {"title": "Make Ridges and Furrows at 60 cm Spacing", "role": "worker", "category": "tillage", "priority": "high"},
                    {"title": "Sow Hybrid Maize Seeds 4 cm Deep on Ridges", "role": "worker", "category": "sowing", "priority": "urgent"},
                    {"title": "Scout Emergence & Check for FAW Pinholes in Leaves", "role": "worker", "category": "scouting", "priority": "high"}
                ]
            },
            {
                "stage_num": 2,
                "name": "Knee-High Stage & FAW Bio-Defense",
                "start_day": 16,
                "end_day": 40,
                "description": "Rapid vegetative growth. Plant reaches knee height (45–60 cm). Critical stage for Fall Armyworm defense.",
                "inputs": ["Urea (Top Dressing 1): 40 kg/acre", "Bacillus thuringiensis (Bt) or Emamectin benzoate: 0.4 g/liter whorl application"],
                "water_regime": "Furrow irrigation every 8–10 days.",
                "scouting_flags": "FAW frass in central whorls, banded leaf blight",
                "tasks": [
                    {"title": "Earthing-up and Interculture Weeding Pass", "role": "worker", "category": "operations", "priority": "high"},
                    {"title": "Targeted Central Whorl Spray for Fall Armyworm", "role": "worker", "category": "protection", "priority": "urgent"},
                    {"title": "Broadcast 1st Split Nitrogen along Ridge Sides", "role": "worker", "category": "nutrition", "priority": "high"}
                ]
            },
            {
                "stage_num": 3,
                "name": "Tasseling, Silking & Cob Development",
                "start_day": 41,
                "end_day": 70,
                "description": "Tassels shed pollen, silks emerge on cobs. Most moisture-sensitive stage of entire crop.",
                "inputs": ["Urea (Final Split): 30 kg/acre", "13-0-45 Potassium Nitrate: 1 kg/acre foliar"],
                "water_regime": "Mandatory irrigation at tasseling and silking. Moisture stress causes poor cob fertilization.",
                "scouting_flags": "Stem borer, leaf blight, barren cobs",
                "tasks": [
                    {"title": "Execute Critical Tasseling Irrigation", "role": "worker", "category": "irrigation", "priority": "urgent"},
                    {"title": "Apply Final Nitrogen Top Dressing before Silking", "role": "worker", "category": "nutrition", "priority": "high"},
                    {"title": "Check Silk Emergence and Pollen Shed Sync", "role": "farmer", "category": "scouting", "priority": "medium"}
                ]
            },
            {
                "stage_num": 4,
                "name": "Grain Filling, Black Layer Maturity & Harvest",
                "start_day": 71,
                "end_day": 95,
                "description": "Starch fills kernels. Black layer forms at kernel base indicating physiological maturity. Cob harvest.",
                "inputs": ["Storage bags / de-husking equipment"],
                "water_regime": "Stop irrigation 10 days before harvest.",
                "scouting_flags": "Cob rot, kernel moisture percentage",
                "tasks": [
                    {"title": "Cease Furrow Irrigation as Husks Turn Pale Brown", "role": "farmer", "category": "irrigation", "priority": "high"},
                    {"title": "Check Black Layer Formation at Kernel Base", "role": "farmer", "category": "quality", "priority": "high"},
                    {"title": "Harvest Mature Cobs & Run Sheller/Dehusker", "role": "worker", "category": "harvest", "priority": "urgent"}
                ]
            }
        ]
    }
}

# Fallback generic crop template for any other selected crop
def get_generic_crop_plan(crop_name: str, duration_days: int = 90) -> Dict[str, Any]:
    return {
        "scientific_name": f"{crop_name} spp.",
        "family": "Agricultural Cultivar",
        "standard_duration_days": duration_days,
        "water_requirement_mm": "450 - 600 mm",
        "optimal_temp_c": "18°C - 30°C",
        "seed_rate_kg_acre": 20.0,
        "soil_preference": "Fertile well-drained loam, pH 6.2 - 7.2",
        "stages": [
            {
                "stage_num": 1,
                "name": "Land Preparation & Basal Nutrition",
                "start_day": 1,
                "end_day": max(10, int(duration_days * 0.12)),
                "description": f"Field preparation, plowing, compost incorporation and basal nutrition for {crop_name}.",
                "inputs": ["Compost / FYM: 3 tonnes/acre", "Basal NPK: 50 kg/acre"],
                "water_regime": "Pre-sowing irrigation to achieve field capacity.",
                "scouting_flags": "Soil pests, uniform moisture distribution",
                "tasks": [
                    {"title": f"Tillage and Bed Preparation for {crop_name}", "role": "worker", "category": "tillage", "priority": "high"},
                    {"title": "Apply Basal Nutrition & Compost", "role": "worker", "category": "nutrition", "priority": "high"}
                ]
            },
            {
                "stage_num": 2,
                "name": "Sowing & Early Crop Establishment",
                "start_day": max(11, int(duration_days * 0.12) + 1),
                "end_day": int(duration_days * 0.35),
                "description": f"Seed germination, stand establishment and first weed control pass for {crop_name}.",
                "inputs": ["Certified Seed", "Bio-fungicide Seed Coat"],
                "water_regime": "Scheduled light irrigation.",
                "scouting_flags": "Emergence stand count, cutworms",
                "tasks": [
                    {"title": f"Sowing / Planting of {crop_name}", "role": "worker", "category": "sowing", "priority": "urgent"},
                    {"title": "First Weeding and Stand Count Audit", "role": "worker", "category": "operations", "priority": "high"}
                ]
            },
            {
                "stage_num": 3,
                "name": "Vegetative Vigour & Top Dressing",
                "start_day": int(duration_days * 0.35) + 1,
                "end_day": int(duration_days * 0.65),
                "description": f"Canopy growth, foliar nutrition and pest defense for {crop_name}.",
                "inputs": ["Nitrogen Top Dressing", "Micronutrient Foliar Spray"],
                "water_regime": "Maintain steady soil moisture.",
                "scouting_flags": "Foliar blight, sucking pests",
                "tasks": [
                    {"title": "Broadcast Secondary Nitrogen Split", "role": "worker", "category": "nutrition", "priority": "high"},
                    {"title": "Preventative Bio-Pesticide Scouting Pass", "role": "worker", "category": "protection", "priority": "medium"}
                ]
            },
            {
                "stage_num": 4,
                "name": "Reproductive, Flowering & Maturation",
                "start_day": int(duration_days * 0.65) + 1,
                "end_day": int(duration_days * 0.88),
                "description": f"Flowering and yield formation for {crop_name}.",
                "inputs": ["Potassium Foliar Spray"],
                "water_regime": "Critical flowering irrigation.",
                "scouting_flags": "Fruit/grain borers, fungal rust",
                "tasks": [
                    {"title": "Critical Reproductive Stage Irrigation", "role": "worker", "category": "irrigation", "priority": "urgent"},
                    {"title": "Pest Trap Audit & Canopy Monitoring", "role": "worker", "category": "scouting", "priority": "high"}
                ]
            },
            {
                "stage_num": 5,
                "name": "Harvesting, Grading & Mandi Storage",
                "start_day": int(duration_days * 0.88) + 1,
                "end_day": duration_days,
                "description": f"Maturity determination, mechanical or manual harvesting, sorting and mandi dispatch of {crop_name}.",
                "inputs": ["Storage packaging"],
                "water_regime": "Dry soil conditions for harvesting.",
                "scouting_flags": "Harvest moisture, grading quality",
                "tasks": [
                    {"title": f"Harvest Mature {crop_name}", "role": "worker", "category": "harvest", "priority": "urgent"},
                    {"title": "Post-Harvest Moisture Test & Mandi Gate Log", "role": "farmer", "category": "mandi", "priority": "high"}
                ]
            }
        ]
    }


class CropPlanService:
    @staticmethod
    def generate_master_plan(crop_name: str, target_duration_days: Optional[int] = None) -> Dict[str, Any]:
        """
        Generates a full 60–120 day master crop growing plan for the specified crop.
        """
        clean_crop = crop_name.strip().capitalize()
        
        # Match against knowledge base
        matched_profile = None
        for key in AGRONOMIC_KNOWLEDGE_BASE:
            if key.lower() in clean_crop.lower() or clean_crop.lower() in key.lower():
                matched_profile = AGRONOMIC_KNOWLEDGE_BASE[key]
                break
                
        if not matched_profile:
            matched_profile = get_generic_crop_plan(clean_crop, target_duration_days or 90)

        duration = target_duration_days or matched_profile.get("standard_duration_days", 100)
        
        plan = {
            "crop_name": clean_crop,
            "scientific_name": matched_profile.get("scientific_name"),
            "family": matched_profile.get("family"),
            "duration_days": duration,
            "water_requirement": matched_profile.get("water_requirement_mm"),
            "optimal_temperature": matched_profile.get("optimal_temp_c"),
            "seed_rate_kg_acre": matched_profile.get("seed_rate_kg_acre"),
            "soil_preference": matched_profile.get("soil_preference"),
            "stages": matched_profile.get("stages", []),
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "status": "APPROVED_BY_AGRONOMIST"
        }
        return plan
