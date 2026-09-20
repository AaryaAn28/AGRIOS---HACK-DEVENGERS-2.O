/**
 * AGRIOS Digital Twin Adapter — Bridge between 3D Engine and AGRIOS Data Layer
 * 
 * This is the formal adapter interface that connects:
 * - AgriosDigitalTwin3D (Three.js engine) 
 * - AGRIOS REST APIs (scene data, telemetry, crop plans)
 * - AGRIOS WebSocket events (real-time state changes)
 * - AGRIOS UI (HUD, inspector panels, controls)
 * 
 * Interface Contract:
 *   mount(containerId)           - Initialize and display 3D scene
 *   destroy()                    - Clean up WebGL context
 *   updateState(snapshot)        - Push telemetry data
 *   applyEvent(domainEvent)      - Process WebSocket event
 *   selectEntity(type, id)       - Highlight entity
 *   focusEntity(type, id)        - Move camera to entity
 *   setCamera(preset)            - Switch camera preset
 *   setLayer(name, visible)      - Toggle layer visibility
 *   setTimeDay(day)              - Set crop growth day
 *   onUserInteraction(callback)  - Register interaction callback
 */

class AgriosDigitalTwinAdapter {
  constructor(canvasId, containerId) {
    this.canvasId = canvasId || null;
    this.containerId = containerId || null;
    this.canvas = canvasId ? document.getElementById(canvasId) : null;
    this.container = containerId ? document.getElementById(containerId) : null;
    this.engine = null;
    this.farmId = null;
    this.sceneData = null;
    this.isInitialized = false;
    this._eventListener = null;
    this._interactionCallback = null;
    this.animationFrameId = null;
    this.activeLayer = "ndvi";
    this.orbitPreset = "isometric_farm_overview";
    this.snapshot = null;
  }

  /**
   * Backwards compatible init() for 2D canvas mode (e.g. in farmer.html)
   */
  async init(farmId) {
    this.farmId = farmId || 'default';
    this.canvas = this.canvas || (this.canvasId ? document.getElementById(this.canvasId) : null);
    this.container = this.container || (this.containerId ? document.getElementById(this.containerId) : null);

    // If a 2D canvas element is targeted (legacy/farmer portal mode)
    if (this.canvas) {
      console.log("[DT Adapter] Initializing in 2D canvas mode for farm:", farmId);
      try {
        if (window.AgriosAPI && typeof AgriosAPI.getDigitalTwinSnapshot === "function") {
          this.snapshot = await AgriosAPI.getDigitalTwinSnapshot(farmId);
        }
        this._setupLegacyCanvas();
        this._startLegacyLoop();

        window.addEventListener("agrios:event", (e) => {
          const ev = e.detail;
          if (ev && (ev.event_type === "DIGITAL_TWIN_TELEMETRY_UPDATED" || ev.event_type === "SIMULATION_TRIGGERED")) {
            this.refreshTelemetry(farmId);
          }
        });
      } catch (err) {
        console.warn("[DT Adapter] Legacy canvas init warning:", err);
      }
      return;
    }

    // Otherwise mount in full 3D mode
    if (this.containerId) {
      await this.mount(this.containerId, farmId);
    }
  }

  async refreshTelemetry(farmId) {
    if (window.AgriosAPI && typeof AgriosAPI.getDigitalTwinSnapshot === "function") {
      this.snapshot = await AgriosAPI.getDigitalTwinSnapshot(farmId);
      this._updateHUD(this.snapshot);
    }
  }

  resizeCanvas() {
    if (this.canvas) {
      const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : { width: 400, height: 300 };
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }
  }

  _setupLegacyCanvas() {
    if (!this.canvas) return;
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  _startLegacyLoop() {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    let angle = 0;

    const render = () => {
      if (!this.canvas) return;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const w = this.canvas.width;
      const h = this.canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.save();
      ctx.translate(cx, cy);

      const gridCols = 8;
      const gridRows = 6;
      const cellW = 55;
      const cellH = 30;

      angle += 0.003;
      const tilt = 0.55;

      const activeCrop = localStorage.getItem("agrios_calibrated_crop") || "Wheat";

      const drawBotanicalPlant = (ctx, px, py, crop, sway, scale = 0.75) => {
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(scale, scale);

        const cLower = crop.toLowerCase();
        if (cLower.includes("rice") || cLower.includes("paddy")) {
          // Rice: slender emerald stem, arching leaves, nodding golden-green grain panicles
          ctx.strokeStyle = "#16a34a";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(sway * 3, -12, sway * 6, -24);
          ctx.stroke();

          // Drooping panicle with grains
          ctx.strokeStyle = "#ca8a04";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(sway * 6, -24);
          ctx.quadraticCurveTo(sway * 6 + 6, -22, sway * 6 + 10, -16);
          ctx.stroke();

          ctx.fillStyle = "#eab308";
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(sway * 6 + 4 + i * 1.5, -22 + i * 1.8, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }

          // Blade leaves
          ctx.fillStyle = "#22c55e";
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.quadraticCurveTo(-10 + sway, -14, -14 + sway, -8);
          ctx.quadraticCurveTo(-8 + sway, -6, 0, -4);
          ctx.fill();

        } else if (cLower.includes("tomato")) {
          // Tomato: bushy branching stems, green foliage, bright red tomato fruits
          ctx.strokeStyle = "#15803d";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(sway * 2, -10, sway * 4, -20);
          ctx.stroke();

          // Foliage cluster
          ctx.fillStyle = "#16a34a";
          ctx.beginPath();
          ctx.arc(sway * 2 - 6, -12, 5, 0, Math.PI * 2);
          ctx.arc(sway * 4 + 4, -18, 6, 0, Math.PI * 2);
          ctx.fill();

          // Red ripe tomatoes
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(sway * 2 - 4, -8, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(sway * 4 + 3, -13, 3.8, 0, Math.PI * 2);
          ctx.fill();

          // Yellow blossom
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.arc(sway * 4, -22, 2.2, 0, Math.PI * 2);
          ctx.fill();

        } else if (cLower.includes("maize") || cLower.includes("corn")) {
          // Maize: thick tall stalk, broad leaves, golden ear with silk
          ctx.strokeStyle = "#15803d";
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(sway * 4, -30);
          ctx.stroke();

          // Broad arching leaves
          ctx.fillStyle = "#22c55e";
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.quadraticCurveTo(-12 + sway, -16, -18 + sway, -8);
          ctx.quadraticCurveTo(-10 + sway, -8, 0, -8);
          ctx.fill();

          // Ear of corn
          ctx.fillStyle = "#eab308";
          ctx.beginPath();
          ctx.ellipse(sway * 2 + 5, -16, 3.5, 7, Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();

          // Tassel top
          ctx.strokeStyle = "#ca8a04";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sway * 4, -30);
          ctx.lineTo(sway * 4 - 3, -35);
          ctx.moveTo(sway * 4, -30);
          ctx.lineTo(sway * 4 + 3, -35);
          ctx.stroke();

        } else if (cLower.includes("potato")) {
          // Potato: leafy dark green bush, small white/lilac flowers
          ctx.fillStyle = "#166534";
          ctx.beginPath();
          ctx.arc(0 + sway, -10, 8, 0, Math.PI * 2);
          ctx.arc(-7 + sway, -12, 6, 0, Math.PI * 2);
          ctx.arc(7 + sway, -11, 6, 0, Math.PI * 2);
          ctx.fill();

          // White blossom
          ctx.fillStyle = "#f8fafc";
          ctx.beginPath();
          ctx.arc(sway, -19, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.arc(sway, -19, 1, 0, Math.PI * 2);
          ctx.fill();

        } else if (cLower.includes("cotton")) {
          // Cotton: branching shrub, lobed leaves, fluffy white cotton bolls
          ctx.strokeStyle = "#78350f";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(sway * 2, -18);
          ctx.stroke();

          ctx.fillStyle = "#15803d";
          ctx.beginPath();
          ctx.arc(sway * 2 - 5, -12, 5, 0, Math.PI * 2);
          ctx.arc(sway * 2 + 5, -14, 5, 0, Math.PI * 2);
          ctx.fill();

          // White fluffy cotton bolls
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(sway * 2 - 4, -18, 4, 0, Math.PI * 2);
          ctx.arc(sway * 2 + 4, -20, 3.8, 0, Math.PI * 2);
          ctx.fill();

        } else {
          // Default: Wheat (golden spike, awn bristles, linear blade)
          ctx.strokeStyle = "#84cc16";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(sway * 2, -12, sway * 5, -25);
          ctx.stroke();

          // Wheat spike head
          ctx.fillStyle = "#eab308";
          ctx.beginPath();
          ctx.ellipse(sway * 5, -25, 3, 9, sway * 0.1, 0, Math.PI * 2);
          ctx.fill();

          // Awn bristles
          ctx.strokeStyle = "#ca8a04";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(sway * 5, -34);
          ctx.lineTo(sway * 5 - 3, -40);
          ctx.moveTo(sway * 5, -34);
          ctx.lineTo(sway * 5 + 3, -40);
          ctx.stroke();

          // Foliage leaf
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.quadraticCurveTo(-10 + sway, -14, -12 + sway, -8);
          ctx.stroke();
        }

        ctx.restore();
      };

      for (let r = -gridRows / 2; r < gridRows / 2; r++) {
        for (let c = -gridCols / 2; c < gridCols / 2; c++) {
          const isoX = (c - r) * cellW * 0.8;
          const isoY = (c + r) * cellH * tilt;
          const wave = Math.sin(angle + (c * 0.4) + (r * 0.4)) * 6;

          ctx.beginPath();
          ctx.moveTo(isoX, isoY - wave);
          ctx.lineTo(isoX + (cellW * 0.8), isoY + (cellH * tilt) - wave);
          ctx.lineTo(isoX, isoY + (cellH * tilt * 2) - wave);
          ctx.lineTo(isoX - (cellW * 0.8), isoY + (cellH * tilt) - wave);
          ctx.closePath();

          const ndvi = this.snapshot ? (this.snapshot.ndvi_mean || 0.78) : 0.78;
          ctx.fillStyle = `rgba(16, 185, 129, ${0.15 + (ndvi * 0.3) + (Math.sin(c) * 0.05)})`;
          ctx.strokeStyle = "rgba(52, 211, 153, 0.3)";
          ctx.lineWidth = 1;
          ctx.fill();
          ctx.stroke();

          // Render living botanical crop illustration on tile
          const plantSway = Math.sin(angle * 2.5 + c * 0.5 + r * 0.5) * 1.8;
          drawBotanicalPlant(ctx, isoX, isoY - wave + (cellH * tilt), activeCrop, plantSway, 0.7);
        }
      }

      ctx.restore();
      this.animationFrameId = requestAnimationFrame(render);
    };

    render();
  }

  /**
   * Mount the 3D Digital Twin into a DOM container
   * @param {string} containerId - ID of the canvas container div
   * @param {string} farmId - Farm ID to load scene data for
   * @param {string} minimapCanvasId - ID of minimap canvas element
   */
  async mount(containerId, farmId, minimapCanvasId) {
    this.containerId = containerId;
    this.farmId = farmId || 'default';

    try {
      // Show loading state
      this._showLoading(containerId);

      // Dynamically import the 3D engine (ES module)
      const { AgriosDigitalTwin3D } = await import('./digital_twin_3d.js');
      
      this.engine = new AgriosDigitalTwin3D();
      this.engine.init(containerId, minimapCanvasId);

      // Load scene data from backend
      this.sceneData = await this._fetchSceneData(farmId);

      // Build the 3D scene
      await this.engine.buildScene(this.sceneData);

      // Wire up interaction callbacks
      this.engine.onEntityInspect = (entityData) => {
        this._handleEntityInspect(entityData);
      };

      this.engine.onTelemetryUpdate = (payload) => {
        this._updateHUD(payload);
      };

      this.engine.onSceneRebuildNeeded = () => {
        this._rebuildScene();
      };

      this.engine.onEditStateChange = (state) => {
        if (typeof window._on3DEditStateChange === 'function') {
          window._on3DEditStateChange(state);
        }
      };

      this.engine.onAreaMeasure = (measure) => {
        if (typeof window._on3DAreaMeasure === 'function') {
          window._on3DAreaMeasure(measure);
        }
      };

      this.engine.onFieldConfigurePlants = (fieldData) => {
        if (typeof window._on3DConfigurePlants === 'function') {
          window._on3DConfigurePlants(fieldData);
        }
      };

      this.engine.onDayStateChange = (state) => {
        if (typeof window._on3DDayStateChange === 'function') {
          window._on3DDayStateChange(state);
        }
      };

      // Start the animation loop
      this.engine.startAnimationLoop();

      // Listen for WebSocket events
      this._eventListener = (e) => {
        if (this.engine && !this.engine.isDestroyed) {
          this.engine.applyEvent(e.detail);
        }
      };
      window.addEventListener('agrios:event', this._eventListener);

      // Initial HUD update
      this._updateHUD(this.sceneData.telemetry);
      this._updateWeatherBadge(this.sceneData.weather);

      // Hide loading
      this._hideLoading(containerId);

      this.isInitialized = true;
      console.log('[DT Adapter] Mounted successfully for farm:', farmId);

    } catch (err) {
      console.error('[DT Adapter] Mount failed:', err);
      this._hideLoading(containerId);
      this._showError(containerId, err.message);
    }
  }

  /**
   * Destroy the 3D scene and clean up resources
   */
  destroy() {
    if (this._eventListener) {
      window.removeEventListener('agrios:event', this._eventListener);
      this._eventListener = null;
    }

    if (this.engine) {
      this.engine.destroy();
      this.engine = null;
    }

    this.isInitialized = false;
    console.log('[DT Adapter] Destroyed');
  }

  /**
   * Update scene state with new telemetry snapshot
   */
  updateState(snapshot) {
    if (this.engine) {
      this.engine.updateState(snapshot);
      this._updateHUD(snapshot);
    }
  }

  /**
   * Apply a real-time WebSocket domain event
   */
  applyEvent(domainEvent) {
    if (this.engine) {
      this.engine.applyEvent(domainEvent);
    }
  }

  /**
   * Highlight a specific entity in the scene
   */
  selectEntity(type, id) {
    if (this.engine) {
      this.engine.focusEntity(type, id);
    }
  }

  /**
   * Move camera to focus on entity
   */
  focusEntity(type, id) {
    if (this.engine) {
      this.engine.focusEntity(type, id);
    }
  }

  /**
   * Switch camera to a preset view
   * @param {'overview'|'field_focus'|'worker_focus'|'infrastructure'} preset
   */
  setCamera(preset) {
    if (this.engine) {
      this.engine.setCameraPreset(preset);
    }
    // Update camera button states
    document.querySelectorAll('.dt3d-toolbar-btn[data-camera]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.camera === preset);
    });
  }

  /**
   * Toggle layer visibility
   * @param {string} layerName - fields, crops, workers, infrastructure, risks
   * @param {boolean} visible
   */
  setLayer(layerName, visible) {
    if (this.engine) {
      this.engine.setLayerVisibility(layerName, visible);
    }
    // Update layer button state
    const btn = document.querySelector(`.dt3d-toolbar-btn[data-layer="${layerName}"]`);
    if (btn) btn.classList.toggle('active', visible);
  }

  /**
   * Set the crop growth simulation day
   * @param {number} dayNumber
   */
  setTimeDay(dayNumber) {
    if (this.engine) {
      this.engine.setDay(dayNumber);
    }
    // Update day display
    const dayLabel = document.getElementById('dt3d-day-label');
    if (dayLabel) dayLabel.textContent = `Day ${dayNumber}`;
  }

  /**
   * Set weather condition
   * @param {'clear'|'cloudy'|'rain'|'heatwave'} condition
   */
  setWeather(condition) {
    if (this.engine) {
      this.engine.setWeather(condition);
    }
    this._updateWeatherBadge({ condition });
  }

  /**
   * Toggle 3D North Sector pest outbreak warning beacon
   */
  setOutbreakBeacon(active, sector) {
    if (this.engine && typeof this.engine.setOutbreakBeacon === 'function') {
      this.engine.setOutbreakBeacon(active, sector);
    }
  }

  /**
   * Run simulated GPS boundary walk with surveyor avatar
   */
  simulateWalkCalibration(onProgress, onComplete) {
    if (this.engine && typeof this.engine.simulateWalkCalibration === 'function') {
      this.engine.simulateWalkCalibration(onProgress, onComplete);
    } else if (onComplete) {
      onComplete();
    }
  }

  /**
   * Set active crop type and update 3D botanical plant models
   * @param {string} cropName - 'Rice', 'Wheat', 'Tomato', 'Maize', 'Potato', 'Cotton'
   */
  setCrop(cropName) {
    this.cropName = cropName;
    if (this.engine && typeof this.engine.setCrop === 'function') {
      this.engine.setCrop(cropName);
    }
  }

  /**
   * Set active Master Crop Plan
   * @param {object} cropPlan
   */
  setCropPlan(cropPlan) {
    this.cropPlan = cropPlan;
    if (this.engine) {
      if (this.engine.sceneData) {
        this.engine.sceneData.crop_plan = cropPlan;
      }
      if (cropPlan?.crop_name && typeof this.engine.setCrop === 'function') {
        this.engine.setCrop(cropPlan.crop_name);
      }
      if (cropPlan?.duration_days && typeof this.engine.setPlanDuration === 'function') {
        this.engine.setPlanDuration(cropPlan.duration_days);
      }
    }
  }

  /**
   * Register callback for user interactions
   */
  onUserInteraction(callback) {
    this._interactionCallback = callback;
  }

  /**
   * Toggle CAD-lite Edit Farm mode
   * @param {boolean} enabled
   */
  setEditMode(enabled) {
    if (!this.engine) return;
    if (enabled) {
      this.engine.enterEditMode();
    } else {
      this.engine.exitEditMode();
    }
  }

  /**
   * Set active CAD editor tool
   * @param {'select'|'road'|'field'|'irrigation'|'building'|'plants'} toolName
   */
  setEditorTool(toolName) {
    if (this.engine && typeof this.engine.setEditorTool === 'function') {
      this.engine.setEditorTool(toolName);
    }
  }

  /**
   * Set building palette type for CAD placement
   * @param {'shed'|'office'|'polyhouse'|'silo'|'coldstorage'} buildingType
   */
  setBuildingType(buildingType) {
    if (this.engine && typeof this.engine.setBuildingType === 'function') {
      this.engine.setBuildingType(buildingType);
    }
  }

  /**
   * Undo last CAD edit action
   */
  undoEdit() {
    if (this.engine && typeof this.engine.undoEdit === 'function') {
      return this.engine.undoEdit();
    }
    return null;
  }

  /**
   * Redo last CAD edit action
   */
  redoEdit() {
    if (this.engine && typeof this.engine.redoEdit === 'function') {
      return this.engine.redoEdit();
    }
    return null;
  }

  /**
   * Finalize current CAD drawing tool (Road/Field/Irrigation)
   */
  finishCADTool() {
    if (this.engine && typeof this.engine.finishCurrentTool === 'function') {
      return this.engine.finishCurrentTool();
    }
    return false;
  }

  /**
   * Clear current CAD drawing points
   */
  clearCADTool() {
    if (this.engine && typeof this.engine.clearCurrentTool === 'function') {
      this.engine.clearCurrentTool();
    }
  }

  /**
   * Randomize disease schedule for demonstration
   */
  randomizeDiseases() {
    if (this.engine && typeof this.engine.randomizeDiseaseSchedule === 'function') {
      return this.engine.randomizeDiseaseSchedule();
    }
    return null;
  }

  /**
   * Calibrate maximum duration days for crop plan
   * @param {number} maxDays
   */
  setPlanDuration(maxDays) {
    if (this.engine && typeof this.engine.setPlanDuration === 'function') {
      this.engine.setPlanDuration(maxDays);
    }
  }

  /**
   * Save Farm CAD Layout to backend database
   * @param {string} changeSummary
   */
  async saveFarmDraft(changeSummary = 'CAD Layout Updated via 3D Digital Twin Editor') {
    if (this.engine && typeof this.engine.saveFarmLayout === 'function') {
      const result = await this.engine.saveFarmLayout(this.farmId, changeSummary);
      const versionLabel = document.getElementById('twin-version-label');
      if (versionLabel && result && result.structure) {
        versionLabel.textContent = `v${result.structure.version_number} (Current)`;
      }
      return result;
    }
    return null;
  }

  /**
   * Sync workforce roster dynamically in the live 3D scene
   * @param {Array} workers
   */
  syncWorkersRoster(workers) {
    if (this.engine && typeof this.engine.syncWorkforce === 'function') {
      this.engine.syncWorkforce(workers);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PRIVATE: Data Fetching
  // ─────────────────────────────────────────────────────────────
  async _fetchSceneData(farmId) {
    try {
      const res = await fetch(`/api/digital-twin/scene-data/${farmId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[DT Adapter] Scene data fetch failed, using defaults:', e);
    }

    // Fallback defaults
    return {
      farm: { name: 'AGRIOS Greenfield Model Farm', total_area_acres: 14.5 },
      boundary: null,
      spatial_objects: [],
      planting_grid: { total_rows: 24, plants_per_row: 50, total_plants: 1200, healthy_plants: 1180, stressed_plants: 20, dead_plants: 0 },
      telemetry: { canopy_coverage_pct: 72.5, leaf_area_index: 3.8, ndvi_mean: 0.78, stress_index: 0.12 },
      crop_plan: { crop_type: 'Wheat', stages: [
        { name: 'Sowing', start_day: 1, end_day: 7 },
        { name: 'Germination', start_day: 8, end_day: 21 },
        { name: 'Vegetative Growth', start_day: 22, end_day: 55 },
        { name: 'Flowering', start_day: 56, end_day: 75 },
        { name: 'Grain Fill', start_day: 76, end_day: 100 },
        { name: 'Harvest Ready', start_day: 101, end_day: 120 },
      ]},
      workers: [],
      weather: { condition: 'clear', temperature_c: 28.5, humidity_pct: 62, wind_speed_kmh: 8.2 },
      risks: [],
      cameras: [],
    };
  }

  async _rebuildScene() {
    if (!this.farmId) return;
    this.sceneData = await this._fetchSceneData(this.farmId);
    if (this.engine) {
      await this.engine.buildScene(this.sceneData);
      this._updateHUD(this.sceneData.telemetry);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PRIVATE: UI Updates
  // ─────────────────────────────────────────────────────────────
  _updateHUD(telemetry) {
    if (!telemetry) return;
    const hud = document.getElementById('dt3d-hud');
    if (!hud) return;

    const stressColor = (telemetry.stress_index || 0) > 0.3 ? '#EF4444' : '#34D399';

    hud.innerHTML = `
      <div class="dt3d-hud-pill"><span class="hud-icon">🛰️</span> LAI: <strong>${(telemetry.leaf_area_index || 3.8).toFixed(1)}</strong></div>
      <div class="dt3d-hud-pill"><span class="hud-icon">🌱</span> Canopy: <strong>${(telemetry.canopy_coverage_pct || 72.5).toFixed(1)}%</strong></div>
      <div class="dt3d-hud-pill"><span class="hud-icon">📊</span> NDVI: <strong>${(telemetry.ndvi_mean || 0.78).toFixed(2)}</strong></div>
      <div class="dt3d-hud-pill"><span class="hud-icon">⚡</span> Stress: <strong style="color:${stressColor}">${(telemetry.stress_index || 0.12).toFixed(2)}</strong></div>
    `;
  }

  _updateWeatherBadge(weather) {
    if (!weather) return;
    const badge = document.getElementById('dt3d-weather-badge');
    if (!badge) return;

    const icons = { clear: '☀️', cloudy: '☁️', rain: '🌧️', heatwave: '🌡️', dusk: '🌅', night: '🌙' };
    const labels = { clear: 'Clear Sky', cloudy: 'Overcast', rain: 'Thunderstorm & Rain', heatwave: 'Heatwave', dusk: 'Golden Dusk', night: 'Starry Night' };
    const condition = weather.condition || 'clear';

    badge.innerHTML = `
      <span>${icons[condition] || '☀️'}</span>
      <span>${labels[condition] || 'Clear'}</span>
      <span style="color:#94a3b8">|</span>
      <span>${weather.temperature_c || 28}°C</span>
    `;
  }

  _handleEntityInspect(entityData) {
    const panel = document.getElementById('dt3d-inspector');
    if (!panel) return;

    if (!entityData) {
      panel.classList.remove('visible');
      return;
    }

    panel.classList.add('visible');

    const titleEl = panel.querySelector('.dt3d-inspector-title');
    const gridEl = panel.querySelector('.dt3d-inspector-grid');

    if (titleEl) {
      const typeIcons = {
        worker: '👷', building: '🏗️', greenhouse: '🏛️', field: '🌾',
        sensor: '📡', camera: '📷', water_source: '💧', road: '🛤️',
        crops: '🌱', risk: '⚠️',
      };
      titleEl.textContent = `${typeIcons[entityData.type] || '📍'} ${entityData.name || entityData.type}`;
    }

    if (gridEl) {
      let statsHTML = '';

      if (entityData.type === 'worker') {
        statsHTML = `
          <div class="dt3d-inspector-stat"><label>Role</label><span class="val">${entityData.role || 'N/A'}</span></div>
          <div class="dt3d-inspector-stat"><label>Current Task</label><span class="val">${entityData.current_task?.title || 'Idle'}</span></div>
          <div class="dt3d-inspector-stat"><label>Fatigue Index</label><span class="val">${entityData.fatigue_index || 0}%</span></div>
        `;
      } else if (entityData.type === 'field') {
        statsHTML = `
          <div class="dt3d-inspector-stat"><label>Name</label><span class="val">${entityData.name}</span></div>
          <div class="dt3d-inspector-stat"><label>Area</label><span class="val">${entityData.area_acres || '—'} acres</span></div>
        `;
      } else if (entityData.type === 'building' || entityData.type === 'greenhouse') {
        statsHTML = `
          <div class="dt3d-inspector-stat"><label>Name</label><span class="val">${entityData.name}</span></div>
          <div class="dt3d-inspector-stat"><label>Status</label><span class="val">${entityData.status || 'active'}</span></div>
          <div class="dt3d-inspector-stat"><label>Area</label><span class="val">${entityData.area_sqm || '—'} sqm</span></div>
        `;
      } else if (entityData.type === 'water_source') {
        statsHTML = `
          <div class="dt3d-inspector-stat"><label>Name</label><span class="val">${entityData.name}</span></div>
          <div class="dt3d-inspector-stat"><label>Capacity</label><span class="val">${entityData.capacity_lph || entityData.capacity || '—'}</span></div>
          <div class="dt3d-inspector-stat"><label>Status</label><span class="val">${entityData.status || 'active'}</span></div>
        `;
      } else if (entityData.type === 'sensor' || entityData.type === 'camera') {
        statsHTML = `
          <div class="dt3d-inspector-stat"><label>Name</label><span class="val">${entityData.name}</span></div>
          <div class="dt3d-inspector-stat"><label>Status</label><span class="val" style="color:#34D399">${entityData.status || 'online'}</span></div>
          ${entityData.fov ? `<div class="dt3d-inspector-stat"><label>FOV</label><span class="val">${entityData.fov}</span></div>` : ''}
        `;
      } else if (entityData.type === 'risk') {
        statsHTML = `
          <div class="dt3d-inspector-stat"><label>Alert</label><span class="val">${entityData.name}</span></div>
          <div class="dt3d-inspector-stat"><label>Severity</label><span class="val" style="color:#EF4444">${entityData.severity || 'medium'}</span></div>
        `;
      } else {
        statsHTML = `
          <div class="dt3d-inspector-stat"><label>Type</label><span class="val">${entityData.type}</span></div>
          <div class="dt3d-inspector-stat"><label>Name</label><span class="val">${entityData.name || '—'}</span></div>
        `;
      }

      gridEl.innerHTML = statsHTML;

      // Append actionable 3D Twin Dispatch Button
      let actionsEl = panel.querySelector('.dt3d-inspector-actions');
      if (!actionsEl) {
        actionsEl = document.createElement('div');
        actionsEl.className = 'dt3d-inspector-actions';
        actionsEl.style.cssText = 'margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.15); display:flex; flex-direction:column; gap:6px;';
        gridEl.parentElement.appendChild(actionsEl);
      }

      const entityLabel = entityData.name || entityData.type || 'Field Entity';
      if (entityData.type === 'risk') {
        actionsEl.innerHTML = `
          <button class="btn-primary" onclick="window.dispatchInspectorIntervention('${entityLabel.replace(/'/g, "\\'")}', 'risk')" style="width:100%; background:#ef4444; color:white; border:none; height:32px; font-size:0.75rem; font-weight:700; border-radius:6px; cursor:pointer;">
            🚨 Dispatch Containment Task
          </button>
        `;
      } else if (entityData.type === 'worker') {
        actionsEl.innerHTML = `
          <button class="btn-primary" onclick="window.dispatchInspectorIntervention('${entityLabel.replace(/'/g, "\\'")}', 'worker')" style="width:100%; background:#059669; color:white; border:none; height:32px; font-size:0.75rem; font-weight:700; border-radius:6px; cursor:pointer;">
            📋 Assign Field Directive
          </button>
        `;
      } else if (entityData.type === 'field' || entityData.type === 'crops') {
        actionsEl.innerHTML = `
          <button class="btn-primary" onclick="window.dispatchInspectorIntervention('${entityLabel.replace(/'/g, "\\'")}', 'field')" style="width:100%; background:#10b981; color:white; border:none; height:32px; font-size:0.75rem; font-weight:700; border-radius:6px; cursor:pointer;">
            🌱 Dispatch Irrigation & Canopy Inspection
          </button>
        `;
      } else {
        actionsEl.innerHTML = `
          <button class="btn-secondary" onclick="window.dispatchInspectorIntervention('${entityLabel.replace(/'/g, "\\'")}', 'sensor')" style="width:100%; background:rgba(255,255,255,0.15); color:white; border:1px solid rgba(255,255,255,0.2); height:30px; font-size:0.75rem; font-weight:600; border-radius:6px; cursor:pointer;">
            ⚙️ Run Diagnostic Latch
          </button>
        `;
      }
    }

    // Fire callback
    if (this._interactionCallback) {
      this._interactionCallback({ action: 'inspect', entity: entityData });
    }
  }

  // Global 3D Inspector Task Dispatch Action
  static initInspectorActions() {
    if (typeof window === 'undefined') return;
    window.dispatchInspectorIntervention = async function(entityName, type) {
      try {
        const activeFarm = localStorage.getItem("agrios_active_farm_id") || "default";
        let title = `[3D Twin Dispatch] Targeted Action on ${entityName}`;
        let category = "operations";
        let priority = "high";

        if (type === "risk") {
          title = `[Phytosanitary Buffer] Emergency Containment: ${entityName}`;
          category = "plant_protection";
          priority = "URGENT";
        } else if (type === "worker") {
          title = `[Directive] Field Reassignment for ${entityName}`;
          category = "operations";
          priority = "high";
        } else if (type === "field") {
          title = `[Parcel Care] Irrigation & Foliar Audit for ${entityName}`;
          category = "irrigation";
          priority = "medium";
        }

        if (window.AgriosAPI && typeof AgriosAPI.createTask === "function") {
          await AgriosAPI.createTask({
            farm_id: activeFarm,
            title: title,
            category: category,
            priority: priority,
            description: `Direct task triggered from 3D Digital Twin World Inspector targeting ${entityName}. Verified coordinates latched.`
          });
        }

        if (window.AgriosUI && typeof AgriosUI.showToast === "function") {
          AgriosUI.showToast("Task Dispatched", `Released directive for ${entityName} to workforce queue.`, "🚀");
        }

        try {
          localStorage.setItem("agrios_broadcast_event", JSON.stringify({
            event_type: "TASK_CREATED",
            payload: { title: title, target: entityName, timestamp: Date.now() }
          }));
        } catch(e) {}
      } catch(err) {
        console.error("Inspector dispatch error:", err);
        if (window.AgriosUI) AgriosUI.showToast("Dispatch Failed", err.message, "❌");
      }
    };
  }

  // ─────────────────────────────────────────────────────────────
  // PRIVATE: Loading / Error states
  // ─────────────────────────────────────────────────────────────
  _showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const loading = document.createElement('div');
    loading.className = 'dt3d-loading';
    loading.id = 'dt3d-loading-overlay';
    loading.innerHTML = `
      <div class="dt3d-loading-spinner"></div>
      <div>Initializing 3D Digital Twin...</div>
      <div style="font-size:0.75rem;color:#64748b;margin-top:4px;">Loading Three.js engine & farm data</div>
    `;
    container.appendChild(loading);
  }

  _hideLoading(containerId) {
    const el = document.getElementById('dt3d-loading-overlay');
    if (el) {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.5s ease';
      setTimeout(() => el.remove(), 500);
    }
  }

  _showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const errDiv = document.createElement('div');
    errDiv.className = 'dt3d-loading';
    errDiv.innerHTML = `
      <div style="font-size:2rem;">⚠️</div>
      <div style="color:#EF4444;font-weight:700;">3D Engine Error</div>
      <div style="font-size:0.8rem;color:#94a3b8;max-width:400px;text-align:center;">${message}</div>
      <button onclick="this.parentElement.remove()" style="margin-top:12px;padding:6px 16px;background:#10b981;color:white;border:none;border-radius:6px;cursor:pointer;">Dismiss</button>
    `;
    container.appendChild(errDiv);
  }
}

// Export to global scope for non-module access
window.AgriosDigitalTwinAdapter = AgriosDigitalTwinAdapter;
AgriosDigitalTwinAdapter.initInspectorActions();
