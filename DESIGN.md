# AGRIOS Stitch-First Design System Specification

## 1. Visual Identity & Design Philosophy
AGRIOS is engineered as a high-end, living agricultural operating system. It avoids the tired look of standard administrative templates or recolored healthcare dashboards by grounding its aesthetic in satellite remote sensing, precision agronomy, and living terrain.

### Key Pillars:
1. **Satellite & Terrain Surface Depth**: Deep obsidian and forest-night dark backgrounds (`#070D0B`, `#0B1612`, `#10221C`) paired with translucent frosted-glass panels (`backdrop-filter: blur(16px)`).
2. **Precision Agricultural Palette**:
   - **Vitality Emerald (`#10B981`, `#059669`, `#34D399`)**: Represents healthy biomass, NDVI > 0.75, completed tasks, and verified ground truth.
   - **Harvest Gold (`#F59E0B`, `#D97706`, `#FBBF24`)**: Represents grain maturity, market APMC rates, yield forecasts, and advisory warnings.
   - **Sensor Cyan (`#06B6D4`, `#0891B2`, `#67E8F9`)**: Represents soil moisture telemetry, drip irrigation channels, and 3D Digital Twin sensor streams.
   - **Bio-Risk Coral (`#EF4444`, `#DC2626`, `#F87171`)**: Represents biosecurity threats, fungal rust, pest swarms, and heatwave alarms.
3. **Subtle 3D Lighting & Micro-Interactions**:
   - Elevated glass panels feature layered box-shadows: `0 8px 32px 0 rgba(0, 0, 0, 0.45)`, `inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)`.
   - Live telemetry beacons pulse with green radiant rings to signal canonical state synchrony.
   - Micro-state transitions on buttons, cards, and tabs with fluid easing (`cubic-bezier(0.16, 1, 0.3, 1)`).
4. **Data Density & Tabular Typography**:
   - Inter / Plus Jakarta Sans font hierarchy.
   - Tabular numerals (`font-variant-numeric: tabular-nums`) for agricultural telemetry (temperature, moisture, NPK ratios, crop yields, and financial values).

---

## 2. Color System & Design Tokens

```css
:root {
  /* Surfaces */
  --bg-deep: #070D0B;
  --bg-card: rgba(11, 22, 18, 0.75);
  --bg-card-elevated: rgba(16, 34, 28, 0.85);
  --bg-glass: rgba(16, 34, 28, 0.6);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-emerald: rgba(16, 185, 129, 0.3);
  --border-glow: rgba(16, 185, 129, 0.5);

  /* Primary Brand & Accents */
  --emerald-500: #10B981;
  --emerald-400: #34D399;
  --emerald-600: #059669;
  --amber-500: #F59E0B;
  --amber-400: #FBBF24;
  --cyan-500: #06B6D4;
  --cyan-400: #67E8F9;
  --rose-500: #EF4444;
  --rose-400: #F87171;

  /* Typography */
  --text-primary: #F3F4F6;
  --text-secondary: #9CA3AF;
  --text-muted: #6B7280;
  --text-emerald: #34D399;
  --text-amber: #FBBF24;
  --text-cyan: #67E8F9;

  /* Shadows & Depth */
  --shadow-glass: 0 8px 32px 0 rgba(0, 0, 0, 0.45);
  --shadow-glow-emerald: 0 0 25px rgba(16, 185, 129, 0.25);
  --shadow-glow-amber: 0 0 25px rgba(245, 158, 11, 0.25);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-smooth: 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 3. Stitch Component Hierarchy

### A. Navigation & Top Bar
- Brand header with glowing biological leaf emblem and live WebSocket beacon.
- Portal switcher dropdown or quick-action toolbar.
- Real-time weather and satellite synchronization status.

### B. Metric & Vitality Cards
- Circular SVG vitality ring showing biological health (0–100%) with dynamic gradient coloration (green for optimal, amber for mild stress, red for critical outbreak).
- Tabular telemetry readouts with trend indicators (`▲ +4.2%`, `▼ -1.8%`).

### C. 3D Digital Twin Integration Container
- Clean bounded frame (`#claude-digital-twin-viewport`) housing topographic parcel contours, NDVI heatmap, sensor beacons, and layer toggles (NDVI, Soil Moisture, Canopy Thermal, Pest Traps).
- Ready-to-dock adapter interface for Claude Opus WebGL rendering.

### D. AI Crop Photo Scanner
- Interactive drag-and-drop or camera capture target.
- Real-time simulated inference scanner line with neural confidence gauges (e.g. "Yellow Rust Detected • 94.2% Confidence").
- One-click prescription dispatch to Krishi Sakhi.

### E. Live WebSocket Telemetry Log
- High-contrast event feed ticker displaying canonical state mutations across portals in real time.
