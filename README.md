# AGRIOS — The Living Agricultural Operating System
> **Hack Devengers 2.0 Hackathon Submission**  
> Unified Agricultural Operating System with 4 Operational Portals, Canonical "God Database", Real-Time WebSocket Telemetry, and 3D Digital Twin Integration Surface.

---

## 🌟 Architecture & Core Principles

AGRIOS replaces traditional fragmented agriculture dashboards with **one living agricultural operating system** where four portals operate over a single canonical state:

1. **🌾 Farmer Portal (`/farmer.html`)**:
   - Living farm overview, biological vitality score, daily execution checklists
   - 3D Digital Twin Adapter Surface with NDVI, soil moisture, and thermal stress layers
   - Machinery & equipment bookings (Tractors, Solar Pumps, Sprayers, Drones)
   - APMC Mandi market rates, farm profit/loss ledger, and direct crop sales
   - PM-KISAN and PMFBY subsidy application tracking

2. **👩‍🌾 Field Worker / Krishi Sakhi Portal (`/worker.html`)**:
   - Today's Field Work Plan with GPS-verified task execution
   - AI Crop Photo Scanner: On-site leaf disease detection (Yellow Rust, Blight)
   - Assigned farm parcel monitoring and ground truth logging
   - Offline sync telemetry indicator

3. **🔬 Agronomist Portal (`/agronomist.html`)**:
   - Regional crop health and biosecurity surveillance
   - Diagnostic Lab: Review Krishi Sakhi crop scans and validate pathogen infections
   - AI Prescription Builder: Dispatches chemical & mechanical remediation tasks
   - Scientific advisory broadcast channel to farmers

4. **🏛️ Government Command Center (`/government.html`)**:
   - Statewide food security quotas and grain buffer reserves
   - Direct Benefit Transfer (DBT) subsidy pipeline with 1-click approvals
   - District-level fertilizer strategic inventory monitoring
   - Macro agro-climatic disaster and canal release advisories

5. **🎮 Mobile-First Judge Demo Controller (`/simulator.html`)**:
   - Purpose-built for hackathon judges to inject live shocks:
     - **Pest Outbreak**: Spawns critical yellow rust infestation, drops health, auto-assigns urgent spraying task
     - **Severe Drought / Heatwave**: Spikes temperature to 42°C, crashes moisture to 14.5%, triggers emergency irrigation
     - **Machinery Failure**: Marks tractor offline, alerts agronomist for cooperative equipment pooling
     - **Krishi Sakhi Execution**: Completes today's field checklist, logs GPS ground truth, rewards farm vitality
     - **Bumper Harvest**: Adds 6,200 kg certified wheat to storage, credits ₹1.51 Lakhs revenue
     - **Pristine Reset**: Restores system to optimal baseline
   - Real-time streaming log of domain events over WebSockets

---

## 🔑 Demo Personas (1-Click Login)

All accounts are pre-seeded with password: `Admin@123`

| Portal | Role | Name | Email | Jurisdiction / Farm |
|---|---|---|---|---|
| **Farmer** | `farmer` | Balwinder Singh | `farmer@agrios.in` | Green Valley Farm, Ludhiana |
| **Field Worker** | `worker` | Sunita Devi | `worker@agrios.in` | Jandiali Kalan Extension Zone |
| **Agronomist** | `agronomist` | Dr. Priya Sharma | `agronomist@agrios.in` | Central Punjab Zone |
| **Government** | `government` | Dr. Vikramaditya Sen | `gov@agrios.in` | Punjab Agriculture Dept |

---

## ⚡ Quickstart

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Server**:
   ```bash
   python run.py
   ```

3. **Access Portals**:
   - Flagship Login: `http://localhost:8000/`
   - Farmer Portal: `http://localhost:8000/farmer.html`
   - Krishi Sakhi: `http://localhost:8000/worker.html`
   - Agronomist: `http://localhost:8000/agronomist.html`
   - Command Center: `http://localhost:8000/government.html`
   - Judge Simulator: `http://localhost:8000/simulator.html`
   - API Docs: `http://localhost:8000/docs`

4. **Run Automated Test Suite**:
   ```bash
   pytest tests/ -v
   ```

---

## 🛰️ 3D Digital Twin Boundary

Interactive 3D WebGL rendering is reserved for future Claude Opus integration. AGRIOS exposes:
- **Contract Specification**: `GET /api/digital-twin/contract-spec`
- **Telemetry Snapshot**: `GET /api/digital-twin/snapshot/{farm_id}`
- **WebSocket Channel**: `/ws/live-feed` (Events: `DIGITAL_TWIN_TELEMETRY_UPDATED`, `FARM_HEALTH_UPDATED`, `SIMULATION_TRIGGERED`)
- **Frontend Container Adapter**: `AgriosDigitalTwinAdapter` in `frontend/js/digital_twin.js`
