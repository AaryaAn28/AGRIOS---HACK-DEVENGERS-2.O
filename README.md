# 🌱 AGRIOS — The Living Agricultural Operating System
> **Hack Devengers 2.0 Hackathon Final Submission**  
> An event-driven, production-grade Precision Agricultural Operating System synchronizing **Government Command**, **Agronomist Diagnostic Labs**, **Farmers**, and **Krishi Sakhis** across a single canonical state with **Real-Time WebSockets**, an interactive **3D WebGL Digital Twin**, **AI Vision Diagnostics**, and a **Standalone Flutter Mobile App**.

---

## 🌐 Live Deployments & Project Links

| Target | Description | URL / Path |
|---|---|---|
| 🚀 **Live Web Platform** | Cloud Deployment on Render | [https://agrios-nerh.onrender.com/](https://agrios-nerh.onrender.com/) |
| 🌾 **Official Booking Portal** | Interactive Framer Services Site | [https://theagrios.framer.website/#booking](https://theagrios.framer.website/#booking) |
| 📱 **Android Mobile APK** | Standalone Debug APK Package | [`apk_output/AGRIOS-debug.apk`](apk_output/AGRIOS-debug.apk) *(161.5 MB)* |
| 📑 **Interactive OpenAPI (Swagger)** | Complete Backend API Documentation | [https://agrios-nerh.onrender.com/docs](https://agrios-nerh.onrender.com/docs) |
| 🧪 **Judge Shock Simulator** | Live Event Propagation Sandbox | [https://agrios-nerh.onrender.com/simulator.html](https://agrios-nerh.onrender.com/simulator.html) |

---

## 🏛️ Ecosystem Architecture & Core Portals

AGRIOS eliminates fragmented agricultural point solutions by binding four operational personas into an **event-driven canonical state architecture**:

```
                                  ┌─────────────────────────────────────────┐
                                  │   🏛️ State Government Command Center    │
                                  │  (Biosecurity, Basin Telemetry, DBT)    │
                                  └────────────────────┬────────────────────┘
                                                       │
                           ┌───────────────────────────┴───────────────────────────┐
                           ▼                                                       ▼
      ┌─────────────────────────────────────────┐             ┌─────────────────────────────────────────┐
      │       🔬 Lead Agronomist Lab            │             │        🌾 Farmer Living Terminal        │
      │ (3D Twin, Rx Ledger, Master Crop Plan)  │◄───────────►│ (Crop Plan, Mandi Rates, Silo Storage)  │
      └────────────────────┬────────────────────┘             └────────────────────┬────────────────────┘
                           │                                                       │
                           └───────────────────────────┬───────────────────────────┘
                                                       ▼
                                  ┌─────────────────────────────────────────┐
                                  │       👩‍🌾 Krishi Sakhi Field App         │
                                  │ (AI Leaf Scanner, GPS Logs, SOS Beacon) │
                                  └─────────────────────────────────────────┘
```

### 1. 🔐 Unified Operating System Terminal (`/` & `/index.html`)
- Clean authentication terminal with high-contrast Indian agriculture hero visual pane and responsive mobile breakpoints.
- **1-Click Demo Persona Quick-Login** enabling judges to switch instantly between all 4 personas without manual credential typing.
- Persistent session storage and secure JWT verification.

### 2. 🏛️ Government Agricultural Command Center (`/government.html`)
- **Live Pest Outbreak Radar**: Continuous aerobiological vector dispersion simulation with dynamic sliders for atmospheric physics (Wind Velocity, Ambient Temp, Relative Humidity) and real-time SVG animated radar blips.
- **Biosecurity Containment Buffer Zones**: Formal phytosanitary cordon sanitaire enforcement (3km, 5km, 10km) with gazette export.
- **Direct Benefit Transfer (DBT) Ledger**: Pre-seeded claims pipeline with 1-click PFMS bank disbursals, batch settlements, and claim rejection tracking.
- **Basin Satellite Telemetry**: Normalized Difference Vegetation Index (NDVI), NDWI water stress, and SAVI ground cover monitoring.
- **Strategic Reserves & Fertilizer Freight Logistics**: Dynamic rake consignment tracking and grain silo food security quotas.

### 3. 🔬 Lead Agronomist Diagnostic Portal (`/agronomist.html`)
- **3D WebGL Digital Twin Farm**: Interactive Three.js farm viewport with 360° touch orbit, camera presets, day-by-day biophysical timeline scrub (Days 1–120), thermal heatmaps, and live worker coordinates.
- **Walk & Calibrate**: GPS farm parcel commissioning tool with dynamic spatial boundary geometry generation.
- **Master Crop Plan Engine**: Automated 120-day phonological growth stage builder for Wheat, Basmati Rice, Maize, Mustard, and Aquaculture.
- **Rx Prescription Formulator & Broadcast Circulars**: Dual organic/chemical intervention dispatch to field workers.

### 4. 👨‍🌾 Farmer Operations Terminal (`/farmer.html`)
- **Living Farm Twin**: Stage-by-stage crop progress tracker, biological vitality index, and moisture balance.
- **Custom Hiring Center (Machinery Booking)**: On-demand tractor, boom sprayer, drone, and harvester rental calendar.
- **APMC Mandi Price Ticker**: Live mandi commodity rates across Punjab, Haryana, and UP markets with MSP benchmarking.
- **Harvest & Silo Storage**: Moisture-controlled grain silo inventory with automated aeration ventilation controls.

### 5. 👩‍🌾 Krishi Sakhi / Field Companion (`/worker.html`)
- **Daily Work Plan**: Assigned geotagged tasks synchronized in real-time from the agronomist's master crop plan.
- **AI Leaf Scanner**: Vision-based leaf diagnostic simulator detecting pathogens (e.g. Yellow Rust, Pink Bollworm, Leaf Blight) with instant treatment recommendations.
- **Ground Truth & Kit**: GPS-tagged field attendance logbook, soil moisture sampling, and equipment health status.
- **Emergency SOS Distress Beacon**: High-priority alert dispatcher broadcasting location coordinates across the command center.

### 6. 🧪 Judge's Shock Simulation Sandbox (`/simulator.html`)
- Dedicated demonstration tool allowing judges to inject real-world agricultural crises:
  - **⚡ Unseasonal Hailstorm (35mm ice stones)**: Drops farm health index, triggers emergency crop loss claims in the government portal.
  - **🐛 Pink Bollworm & Yellow Rust Outbreak**: Pings the government Pest Outbreak Radar, spikes spore densities, and triggers quarantine alerts.
  - **🌊 Canal Breach & Soil Waterlogging**: Floods spatial parcels, updates sensor telemetry, and alters task priorities.
  - **☀️ Severe Heatwave & Drought Shock**: Spikes thermal canopy stress and recommends drip micro-irrigation.
  - **🔄 Reset Baseline**: Restores the canonical database state cleanly with 1 click.

---

## 🔑 Pre-Seeded Demo Accounts (1-Click Ready)

All demo accounts share the canonical password: `Admin@123`

| Role | Name | Email | Jurisdiction / Assignment |
|---|---|---|---|
| **Director of Agriculture** | Dr. Vikramaditya Sen | `gov@agrios.in` | Punjab State Department of Agriculture |
| **Lead Agronomist** | Dr. Priya Sharma | `agronomist@agrios.in` | Central Punjab Agro-Climatic Zone |
| **Farmer Custodian** | Balwinder Singh | `farmer@agrios.in` | Green Valley Bio Farm, Ludhiana (14.2 Ha) |
| **Krishi Sakhi (Worker)** | Sunita Devi | `worker@agrios.in` | Jandiali Kalan Extension Division |

---

## 📱 Standalone Flutter Mobile App (`agrios_app/`)

The mobile application is written in **Flutter 3.47 (Dart 3.13)** with complete offline-first resilience:
- **Pre-Compiled APK**: [`apk_output/AGRIOS-debug.apk`](apk_output/AGRIOS-debug.apk) *(161.5 MB)*
- **Framer Booking Portal Landing**: Launches directly into the live booking website (`https://theagrios.framer.website/#booking`) with native JavaScript bridge interceptors.
- **One-Tap Registration**: Seamless transition between the Framer booking portal and the AGRIOS Operating System Login Terminal.
- **Cross-Platform Parity**: Contains all 4 persona views, 3D farm model viewer, AI leaf scanner, DBT claims tracker, and GPS walk-and-calibrate screen.
- **Offline Fallback Directory**: Automatically renders local service bookings if network is disconnected.

---

## 📂 Repository File Structure

```text
AGRIOS - HACK DEVENGERS 2.O/
├── app/                        # FastAPI Backend Application
│   ├── core/                   # EventBus, Real-Time WebSockets & Domain Events
│   ├── models/                 # SQLAlchemy Database Models (20+ Entities)
│   ├── routes/                 # 20 REST API Endpoints (Auth, Farms, Crops, Radar, DBT)
│   ├── schemas/                # Pydantic Request/Response Validation Schemas
│   ├── services/               # ML Agronomic, Biosecurity, and Digital Twin Engines
│   ├── utils/                  # JWT Security, Password Hashing, GeoJSON Converters
│   ├── config.py               # Environment Configuration & Defaults
│   ├── database.py             # Database Connection & Migration Adapter
│   ├── main.py                 # FastAPI Application Factory & Routing
│   └── seed_agrios.py          # Pre-Seeded Canonical Database Generator
│
├── frontend/                   # Modern Web Application (HTML5, CSS3, Vanilla JS)
│   ├── assets/                 # High-Resolution Photography, Icons & Geometry Data
│   ├── css/                    # Vizitor Design Theme & 3D Viewport Stylesheets
│   ├── js/                     # AgriosAPI Client, Three.js Digital Twin, i18n, WebSockets
│   ├── index.html              # Unified Login & Persona Switcher Terminal
│   ├── login.html              # Standalone Authentication Gateway
│   ├── farmer.html             # Farmer Management Portal
│   ├── worker.html             # Krishi Sakhi Field Operations Portal
│   ├── agronomist.html         # Lead Agronomist Diagnostic Lab & 3D Twin
│   ├── government.html         # State Agricultural Command Center
│   ├── simulator.html          # Judge Live Crisis Injection Sandbox
│   └── vercel.json             # Vercel Production Route Configuration
│
├── agrios_app/                 # Standalone Flutter Mobile App
│   ├── lib/
│   │   ├── constants/          # API Endpoints, Color Tokens, Typography
│   │   ├── models/             # Data Models for Tasks, Equipment, Emergencies
│   │   ├── screens/            # 19+ Screens (Auth, Landing, Portals, 3D Twin)
│   │   │   ├── landing/        # Framer Booking Screen (webview_flutter)
│   │   │   ├── auth/           # Login & Persona Selection
│   │   │   ├── dashboard/      # Dashboards for all 4 personas
│   │   │   └── government/     # Pest Radar & DBT Mobile Screens
│   │   ├── services/           # Authentication & HTTP Services
│   │   └── main.dart           # App Entry Point & AuthGate Router
│   ├── android/                # Native Android Gradle Project (SDK 36, Kotlin 2.1)
│   └── pubspec.yaml            # Flutter Dependencies (webview_flutter, http, intl)
│
├── apk_output/                 # Compiled Android Packages
│   └── AGRIOS-debug.apk        # Ready-to-Install Android Debug APK (161.5 MB)
│
├── tests/                      # Pytest Automated Test Suite (100% Passing)
│   ├── conftest.py             # Test Fixtures & FastAPI TestClient
│   ├── test_auth.py            # Authentication, JWT, and Seeded Users
│   ├── test_digital_twin_3d_endpoints.py # 3D Scene & Telemetry Endpoints
│   ├── test_biosecurity_operations.py    # Pest Radar & Buffer Zone Verification
│   ├── test_workforce_operations.py      # Krishi Sakhi & ML Service Tests
│   └── ...                     # 50 Comprehensive End-to-End Test Cases
│
├── scripts/                    # Verification & Automation Scripts
│   ├── test_e2e_journey.py     # Multi-Persona Walkthrough Script
│   ├── verify_complete_e2e_walkthrough.py # 6-Step Judge Automated Verification
│   └── verify_feature_count.py # System Feature Contract Verification
│
├── pytest.ini                  # Pytest Configuration File
├── Dockerfile                  # Production Multi-Stage Container Definition
├── render.yaml                 # Render Infrastructure-as-Code Blueprint
├── requirements.txt            # Pinned Python Dependencies
├── run.py                      # Multi-Environment ASGI Launcher
├── start_agrios.bat            # Windows 1-Click Server Startup
├── start_agrios.sh             # Linux / macOS 1-Click Server Startup
├── run_tests.bat               # Windows 1-Click Test Runner
└── run_tests.sh                # Linux / macOS 1-Click Test Runner
```

---

## ⚡ Quickstart Guide

### 1. Run Locally (Python 3.10 – 3.14)
```bash
# Clone the repository
git clone https://github.com/AaryaAn28/AGRIOS---HACK-DEVENGERS-2.O.git
cd "AGRIOS---HACK-DEVENGERS-2.O"

# Install dependencies
pip install -r requirements.txt

# Launch AGRIOS
python run.py
```
*Access the local portal at `http://127.0.0.1:8000`.*

### 2. Run with Docker
```bash
# Build the production image
docker build -t agrios-os .

# Run container on port 8000
docker run -d -p 8000:8000 --name agrios-container agrios-os
```

### 3. Run Automated Tests
```bash
pytest
```
*Executes all 50 integration tests with instant status validation.*

---

## 🏆 Hackathon Submission Checklist

- [x] **Full-Stack Implementation**: Pure FastAPI backend, pure vanilla JS + HTML5 frontend, Flutter mobile client.
- [x] **Zero Third-Party Vendor Locks**: Completely autonomous, self-contained architecture.
- [x] **100% Test Coverage**: All 50 pytest integration tests passing.
- [x] **Live Public Cloud Deployment**: Hosted and functioning live on Render with auto-deploy.
- [x] **Live Marketing & Services Portal**: Connected with Framer booking site.
- [x] **Native Mobile App**: Freshly compiled Android debug APK with webview bridge and full parity.
- [x] **Crisis Simulation**: Live interactive judge testbed for instant evaluation.

---
**AGRIOS Engineering Team** • *Built for Hack Devengers 2.0*
