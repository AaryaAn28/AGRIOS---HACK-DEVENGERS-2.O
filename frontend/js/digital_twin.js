// AGRIOS Digital Twin Container & Future Claude Opus 3D Integration Adapter
class AgriosDigitalTwinAdapter {
  constructor(canvasId, containerId) {
    this.canvas = document.getElementById(canvasId);
    this.container = document.getElementById(containerId);
    this.snapshot = null;
    this.orbitPreset = "isometric_farm_overview";
    this.activeLayer = "ndvi"; // ndvi, moisture, thermal
    this.animationFrameId = null;
  }

  async init(farmId) {
    console.log("[Digital Twin Adapter] Initializing telemetry container for farm:", farmId);
    try {
      this.snapshot = await AgriosAPI.getDigitalTwinSnapshot(farmId);
      this.renderHUD();
      this.setupCanvas();
      this.startSimulationLoop();

      // Listen for live realtime telemetry updates
      window.addEventListener("agrios:event", (e) => {
        const ev = e.detail;
        if (ev.event_type === "DIGITAL_TWIN_TELEMETRY_UPDATED" || ev.event_type === "SIMULATION_TRIGGERED") {
          console.log("[Digital Twin Adapter] Live Telemetry received:", ev);
          this.refreshTelemetry(farmId);
        }
      });
    } catch (err) {
      console.error("[Digital Twin Adapter] Init failed:", err);
    }
  }

  async refreshTelemetry(farmId) {
    this.snapshot = await AgriosAPI.getDigitalTwinSnapshot(farmId);
    this.renderHUD();
  }

  setLayer(layerName) {
    this.activeLayer = layerName;
    const btns = document.querySelectorAll(".twin-layer-btn");
    btns.forEach(b => {
      b.classList.toggle("active", b.dataset.layer === layerName);
    });
  }

  setCameraPreset(preset) {
    this.orbitPreset = preset;
    console.log("[Digital Twin Adapter] Camera orbit set to:", preset);
  }

  renderHUD() {
    if (!this.snapshot) return;
    const hud = document.getElementById("twin-hud-overlay");
    if (!hud) return;

    hud.innerHTML = `
      <div class="hud-pill">
        <span>🛰️</span> <span>LAI: <strong>${this.snapshot.leaf_area_index}</strong></span>
      </div>
      <div class="hud-pill">
        <span>🌱</span> <span>Canopy: <strong>${this.snapshot.canopy_coverage_pct}%</strong></span>
      </div>
      <div class="hud-pill">
        <span>⚡</span> <span>Stress Index: <strong style="color: ${this.snapshot.stress_index > 0.3 ? 'var(--accent-rose)' : 'var(--accent-neon)'}">${this.snapshot.stress_index}</strong></span>
      </div>
      <div class="hud-pill">
        <span>🛰️</span> <span>Mean NDVI: <strong style="color: var(--accent-neon)">${this.snapshot.ndvi_mean}</strong></span>
      </div>
    `;
  }

  setupCanvas() {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext("2d");
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  startSimulationLoop() {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext("2d");
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const w = this.canvas.width;
      const h = this.canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Draw 3D-inspired Perspective Isometric Grid
      ctx.save();
      ctx.translate(cx, cy);

      // Terrain Parcel Mesh
      const gridCols = 8;
      const gridRows = 6;
      const cellW = 55;
      const cellH = 30;

      angle += 0.003;
      const tilt = 0.55;

      for (let r = -gridRows / 2; r < gridRows / 2; r++) {
        for (let c = -gridCols / 2; c < gridCols / 2; c++) {
          const isoX = (c - r) * cellW * 0.8;
          const isoY = (c + r) * cellH * tilt;

          // Compute NDVI/Moisture elevation wave
          const wave = Math.sin(angle + (c * 0.4) + (r * 0.4)) * 6;

          ctx.beginPath();
          ctx.moveTo(isoX, isoY - wave);
          ctx.lineTo(isoX + (cellW * 0.8), isoY + (cellH * tilt) - wave);
          ctx.lineTo(isoX, isoY + (cellH * tilt * 2) - wave);
          ctx.lineTo(isoX - (cellW * 0.8), isoY + (cellH * tilt) - wave);
          ctx.closePath();

          if (this.activeLayer === "ndvi") {
            const ndvi = this.snapshot ? this.snapshot.ndvi_mean : 0.78;
            ctx.fillStyle = `rgba(16, 185, 129, ${0.15 + (ndvi * 0.3) + (Math.sin(c) * 0.05)})`;
            ctx.strokeStyle = "rgba(52, 211, 153, 0.3)";
          } else if (this.activeLayer === "moisture") {
            ctx.fillStyle = `rgba(6, 182, 212, ${0.2 + (Math.cos(r) * 0.1)})`;
            ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
          } else {
            ctx.fillStyle = `rgba(245, 158, 11, ${0.2 + (Math.sin(c + r) * 0.1)})`;
            ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
          }

          ctx.lineWidth = 1;
          ctx.fill();
          ctx.stroke();
        }
      }

      // Draw Simulated Crop Saplings / Telemetry Node Beacons
      const nodeX = (Math.sin(angle) * 80);
      const nodeY = (Math.cos(angle) * 40);
      ctx.beginPath();
      ctx.arc(nodeX, nodeY - 15, 6, 0, Math.PI * 2);
      ctx.fillStyle = "var(--accent-neon)";
      ctx.shadowColor = "var(--accent-neon)";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();

      this.animationFrameId = requestAnimationFrame(render);
    };

    render();
  }
}

window.AgriosDigitalTwinAdapter = AgriosDigitalTwinAdapter;
