# AGRIOS Mobile App — Flutter & Dart Android Client

Official Android application for the **AGRIOS Precision Agriculture Operating System**.

## 📱 Features & Highlights

1. **Operator Mode & 4 Quick Demo Logins**:
   - **Operator Mode**: 1-tap fast access for Krishi Sakhi field workers (`Sunita Devi • WORKER-001`).
   - **4 Quick Demo Personas**:
     - 🔬 **Dr. Priya Sharma**: Lead Agronomist & Scientist (Agronomist Lab)
     - 🏛️ **Dr. Vikramaditya Sen**: Director of Agriculture (State Command Center)
     - 🌾 **Balwinder Singh**: Farmer Custodian (Farmer Operational Portal)
     - 👩‍🌾 **Sunita Devi**: Krishi Sakhi (Field Operations & Sensor Cadre)

2. **Full Field Operations Suite**:
   - 📋 **Day Tasks Execution**: Strictly synchronized with the Agronomist's assigned active growth day schedule (e.g. Day 1 Sowing). GPS geotagging check-in.
   - 📡 **Ground Truth Telemetry**: Micro-plot in-situ soil moisture %, weed infestation tiers, and real-time ML Crop Stress Index prediction.
   - 🧰 **Field Kit & Wear Prognostics**: Live tool health registry, battery % retention, sensor drift tracking, and express doorstep swap requisitions.
   - 💬 **Agronomist Scientific Hotline**: 2-way direct consultation with Dr. Priya Sharma backed by instant botanical NLP symptom extraction and chemical/organic prescriptions.
   - 🎓 **Multi-Crop Training & Certification**: 8+ ICAR-PAU accredited courses (Wheat, Rice, Tomato, Potato, Maize, Cotton, Drip, Safety), interactive knowledge exams, and verifiable certificates.
   - 📖 **Offline Field Manuals**: Pre-cached syllabi, symptom matrices, and chemical dosage cheat sheets for zero-connectivity field parcels.
   - 📑 **Leave & Welfare Requests**: Formal leave applications with peer cadre auto-reassignment and PM-KISAN emergency wage advance requisitions.
   - 🏅 **Merit Scorecard & Incentive Ledger**: Composite performance rating (98.4%), 4 earned cadre distinction badges, and monthly DBT bonus ledger.
   - 🚨 **Emergency Protocols & SOS Beacon**: Instant satellite distress calling (108 Ambulance / KVK Van dispatch) and ISO 7243 WBGT heat strain safety limits.
   - 📊 **Official Regulatory Reports**: Punjab Agricultural letterhead reports with PDF print preview, CSV, and JSON export.

3. **Multilingual Architecture**:
   - 1-Click instantaneous switching between **English (🇬🇧)**, **Hindi (🇮🇳 हिन्दी)**, and **Odia (🇮🇳 ଓଡ଼ିଆ)**.

---

## 🚀 Running the App

### Prerequisites
- Flutter SDK 3.0+ & Dart SDK installed (`C:\padhai\flutter\flutter\bin`)
- Android Studio / Android SDK (API 21 to 34)
- AGRIOS backend running at `http://localhost:8000` (or `http://10.0.2.2:8000` from Android Emulator)

### Commands
```bash
# 1. Fetch dependencies
flutter pub get

# 2. Run on connected Android device or emulator
flutter run

# 3. Build APK
flutter build apk --release
```
The resulting release APK will be generated at `build/app/outputs/flutter-apk/app-release.apk`.
