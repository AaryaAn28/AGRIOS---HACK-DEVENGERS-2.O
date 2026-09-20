# 📱 AGRIOS Android Mobile APK

> **AGRIOS Standalone Android Application Package**  
> Built with Flutter 3.47 (Dart 3.13) & Android SDK 36.

---

## 📦 Package Details

- **File Name**: `AGRIOS-debug.apk`
- **Build Target**: Android 8.0+ (API 26+) up to Android 15 (API 35/36)
- **Architecture**: Universal (ARM64-v8a, ARMeabi-v7a, x86_64)
- **Package Name**: `com.agrios.agrios_app`
- **Version**: `1.0.0+1`
- **Binary Size**: `~161.5 MB`

---

## 🚀 Key Features Included

1. **🌾 Official Framer Booking & Services Portal Integration**:
   - Initial entry screen directly showcases the live interactive booking site ([https://theagrios.framer.website/#booking](https://theagrios.framer.website/#booking)).
   - Native JavaScript Bridge & custom Top/Bottom CTA buttons navigate seamlessly into the AGRIOS Login Terminal.
2. **🔐 4-Persona Unified Operating System**:
   - **Director of Agriculture**: Pest Outbreak Radar, Buffer Zones, and PFMS DBT Batch Disbursals.
   - **Lead Agronomist**: 3D Farm Model Viewport, Rx Ledger, Master Crop Plan.
   - **Farmer**: Mandi Rates, Machinery Booking, Harvest & Silo Aeration.
   - **Krishi Sakhi**: Daily Work Plan, AI Leaf Scanner, GPS Ground Truth, Emergency SOS Beacon.
3. **📶 Offline-First Fallback**:
   - Resilient offline mode with local service catalog and emergency protocols if disconnected from network.

---

## 🛠️ Building from Source

To compile the APK yourself locally:

```bash
cd agrios_app

# Fetch dependencies
flutter pub get

# Compile debug APK
flutter build apk --debug
```

The compiled APK will be located at:
`agrios_app/build/app/outputs/flutter-apk/app-debug.apk`

---

## 📲 Installing on Device or Emulator

```bash
# Connect Android device with USB debugging enabled, or launch emulator
adb install apk_output/AGRIOS-debug.apk
```
