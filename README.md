# 🌱 AGRIOS — The Living Agricultural Operating System
> **Hack Devengers 2.0 Hackathon Submission**  
> Unified Living Agricultural Operating System connecting Government Command, Agronomist Diagnostic Labs, Farmers, and Krishi Sakhis across a single canonical state with Real-Time WebSockets, 3D WebGL Digital Twin, AI Vision Diagnostics, and a Standalone Mobile Flutter App.

---

## 🏛️ System Architecture & Portals

AGRIOS replaces fragmented agricultural tools with **one synchronized operating system** operating over an event-driven canonical state:

1. **🌾 Fields Today Landing Page (`/`)**:
   - Modern, high-converting showcase page with live metrics, 7 core agricultural pillars, and instant 1-click persona entry cards.
2. **🔐 Unified Login Terminal (`/login`)**:
   - Central authentication terminal with glassmorphic visual backdrop, Google sign-in integration, and 1-click demo persona quick-login.
3. **👨‍🌾 Farmer Portal (`/farmer.html`)**:
   - Living farm overview, biological vitality score, active 120-day crop plan stages, custom hiring center machinery bookings (Tractors, Drones, Sprayers), live APMC mandi ticker, and silo aeration storage management.
4. **👩‍🌾 Krishi Sakhi / Field Worker Portal (`/worker.html`)**:
   - Daily work plan with GPS geotagging, on-site neural vision leaf scanner, ground truth logs, tool kit diagnostics, agronomist hotline with botanical NLP triage, training modules, and emergency SOS beacon.
5. **🔬 Lead Agronomist Portal (`/agronomist.html`)**:
   - Interactive 3D WebGL Digital Twin Farm Model with touch orbit, day slider (Days 1–120), CAD layout tools, multi-day pest risk beacons, prescription formulator, and regional circular broadcasts.
6. **🏛️ Government Command Center (`/government.html`)**:
   - Statewide satellite telemetry (NDVI, NDWI, SAVI), GIS basin inspector, biosecurity radar with pest vector spread simulations, 3km/5km cordon sanitaire buffer zones, disaster directives, and PFMS DBT subsidy approvals.
7. **🧪 Mobile-First Judge Simulation Sandbox (`/simulator.html`)**:
   - Live shock injection environment for hackathon judges: Unseasonal Hailstorm, Whitefly Pest Swarm, Canal Breach / Flash Flood, and Extreme Heatwave / Drought with real-time cross-portal WebSocket event propagation.

---

## 📂 Project Directory Structure

```text
AGRIOS - HACK DEVENGERS 2.O/
├── app/                        # FastAPI Backend Application
│   ├── core/                   # EventBus, domain events & WebSocket manager
│   ├── models/                 # SQLAlchemy ORM models (User, Farm, Crop, Task, Risk, etc.)
│   ├── routes/                 # 20 modular API routers (Auth, Farms, Crops, Digital Twin, etc.)
│   ├── schemas/                # Pydantic validation schemas
│   ├── services/               # ML Agronomic Service, Biosecurity Service, Digital Twin Engine
│   ├── utils/                  # Auth, JWT, Security, and helpers
│   ├── config.py               # Environment configuration & settings
│   ├── database.py             # SQLAlchemy session manager & PostgreSQL/SQLite adapter
│   ├── main.py                 # FastAPI app entry point & lifespan manager
│   └── seed_agrios.py          # Canonical database seeder
│
├── frontend/                   # Web Platform (Pure HTML5, CSS3 & Modern Vanilla JS)
│   ├── assets/                 # High-resolution artwork, crop geometries, UI icons
│   ├── css/                    # Vizitor theme, 3D Digital Twin styles
│   ├── js/                     # AgriosAPI client, Three.js 3D Twin, i18n, realtime WebSockets
│   ├── index.html              # Core authentication terminal with demo quick-login
│   ├── farmer.html             # Farmer operations portal
│   ├── worker.html             # Krishi Sakhi field companion portal
│   ├── agronomist.html         # Agronomist diagnostic lab & 3D twin portal
│   ├── government.html         # State agricultural command center
│   └── simulator.html          # Judge's live shock simulation sandbox
│
├── agrios_app/                 # Standalone Flutter Mobile Application
│   ├── lib/                    # Dart source (3D twin, Leaf Scanner, Walk-and-Calibrate, 19+ screens)
│   ├── android/                # Native Android build configuration (Gradle 8.9, Kotlin 2.1)
│   └── pubspec.yaml            # Flutter project dependencies
│
├── apk_output/                 # Pre-built Mobile Artifacts
│   └── AGRIOS-debug.apk        # Standalone Android Debug APK (168.9 MB)
│
├── tests/                      # Automated Integration & Unit Tests
│   ├── conftest.py             # Test fixtures & test client setup
│   ├── test_schemes_reject.py  # Subsidy approval & rejection lifecycle tests
│   └── ...                     # 50 comprehensive tests covering all ecosystem endpoints
│
├── scripts/                    # Verification & Developer Tools
│   ├── test_e2e_journey.py     # End-to-end multi-persona walkthrough test
│   ├── verify_complete_e2e_walkthrough.py # 6-step judge automated verification
│   └── verify_feature_count.py # 324-feature contract verification script
│
├── Dockerfile                  # Production container definition
├── render.yaml                 # Render Blueprint specification for cloud deployment
├── Procfile                    # PaaS process file (uvicorn web server)
├── requirements.txt            # Pinned Python dependencies
├── run.py                      # Multi-environment ASGI server launcher
├── start_agrios.bat            # Windows 1-click server launch
├── run_tests.bat               # Windows 1-click pytest test suite
└── verify_e2e.bat              # Windows 1-click E2E verification
```

---

## 🔑 Demo Personas (1-Click Login)

All demo accounts are pre-seeded with password: `Admin@123`

| Portal | Role | Name | Email | Jurisdiction / Farm |
|---|---|---|---|---|
| **Lead Agronomist** | `agronomist` | Dr. Priya Sharma | `agronomist@agrios.in` | Central Punjab Agro-Climatic Zone |
| **Farmer Custodian** | `farmer` | Balwinder Singh | `farmer@agrios.in` | Green Valley Farm, Ludhiana (14.2 Ha) |
| **Krishi Sakhi** | `worker` | Sunita Devi | `worker@agrios.in` | Jandiali Kalan Extension Division |
| **Director of Agriculture**| `government` | Dr. Vikramaditya Sen | `gov@agrios.in` | Punjab Agriculture & Food Directorate |

---

## ⚡ Local Quickstart

### Prerequisites
- Python 3.10+ (Tested up to Python 3.14)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Server
- **Windows**: Double-click `start_agrios.bat` or run:
  ```bash
  python run.py
  ```
- **macOS / Linux**:
  ```bash
  chmod +x start_agrios.sh
  ./start_agrios.sh
  ```

### 3. Open in Browser
- **Landing Page**: [http://localhost:8000/](http://localhost:8000/)
- **Login Portal**: [http://localhost:8000/login](http://localhost:8000/login)
- **Judge's Sandbox**: [http://localhost:8000/simulator](http://localhost:8000/simulator)
- **Interactive OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Run Automated Test Suite
- **Windows**: Double-click `run_tests.bat` or run:
  ```bash
  pytest tests/ -v
  ```
- **macOS / Linux**:
  ```bash
  chmod +x run_tests.sh
  ./run_tests.sh
  ```

---

## ☁️ Deploying on Render

AGRIOS includes a native `render.yaml` Blueprint file for automated zero-configuration deployment:

1. Push this repository to your GitHub account (`git push origin main`).
2. Navigate to [Render Dashboard](https://dashboard.render.com/) and click **New +** &rarr; **Blueprint**.
3. Select your repository: `AGRIOS---HACK-DEVENGERS-2.O`.
4. Render automatically parses `render.yaml`:
   - **Environment**: Python 3.11.9
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Healthcheck Path**: `/api/health`
5. Click **Apply**. Once built, the live web service serves the About page at `https://<your-app>.onrender.com/`.

---

## 📱 Standalone Flutter Mobile App

The native Android app is in `agrios_app/` with full cross-portal parity:
- **Pre-Built APK**: Located in `apk_output/AGRIOS-debug.apk` (168.9 MB).
- **Features Included**:
  - Interactive 3D Farm Model with Orbit Controls & Plant Health Shader simulation
  - Mobile Leaf Vision AI Camera Scanner with automated dual chemical/organic prescription formulary
  - GPS Boundary Walk-and-Calibrate tool
  - Judge Simulation Emergency Trigger
  - SOP & Help Guide in all screens
