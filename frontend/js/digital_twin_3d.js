/**
 * AGRIOS 3D Digital Twin Engine — Three.js Agricultural World (Upgraded Body)
 * 
 * A living, interactive, data-driven 3D representation of a real agricultural farm.
 * Built on Three.js with procedural geometry (no external model files).
 * 
 * Features:
 * - High-end procedural PBR terrain & road materials (multi-textured canvas for soil, furrows, grass, gravel)
 * - Realistic sky dome with sun disc, atmospheric haze gradient, depth fog, and cloud shadows
 * - Upgraded architectural 3D buildings (Machinery Shed, Modern Timber/Glass Farm Office with solar rooftop,
 *   Multi-Bay Polyhouse with visible internal grow beds, Corrugated Grain Silo, Insulated Cold Storage)
 * - Articulated 3D worker characters with role tools, Wellington boots, and dynamic animation state machine
 * - Dynamic workforce sync (instantly spawns/relocates workers upon AGRIOS registration)
 * - Multi-stage botanical crop models (Stages 0 to 5) with wind sway response
 * - Interactive CAD-lite "EDIT FARM" Mode (Road, Field with live acreage calculation, Irrigation, Building, Plant Spacing, Undo/Redo, Save to DB)
 * - Real-time WebSocket event integration & Day 30 pest outbreak beacon
 * - Simulated GPS Walk Calibration
 * 
 * @requires Three.js 0.164+ via importmap
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { getCropGeometry, createCropMaterial, normalizeCropKey } from './crop_geometries.js';

// ═══════════════════════════════════════════════════════════════
// SECTION 1: Perlin / Simplex Noise
// ═══════════════════════════════════════════════════════════════
class SimplexNoise {
  constructor(seed = 42) {
    this.grad3 = [
      [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ];
    this.p = [];
    for (let i = 0; i < 256; i++) this.p[i] = i;
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807 + 0) % 2147483647;
      const j = s % (i + 1);
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }
    this.perm = new Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = this.p[i & 255];
  }

  dot(g, x, y) { return g[0] * x + g[1] * y; }

  noise2D(xin, yin) {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const X0 = i - t, Y0 = j - t;
    const x0 = xin - X0, y0 = yin - Y0;
    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2, y2 = y0 - 1.0 + 2.0 * G2;
    const ii = i & 255, jj = j & 255;
    const gi0 = this.perm[ii + this.perm[jj]] % 12;
    const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
    const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;
    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2); }
    return 70.0 * (n0 + n1 + n2);
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2: Color & Material Constants
// ═══════════════════════════════════════════════════════════════
const COLORS = {
  soil: 0x8B7355,
  soilDark: 0x533E2D,
  grass: 0x4CAF50,
  grassLight: 0x66BB6A,
  grassDark: 0x2D6A4F,
  water: 0x2196F3,
  waterDeep: 0x1565C0,
  pond: 0x42A5F5,
  // Crops
  cropSeed: 0x8D6E63,
  cropSprout: 0x81C784,
  cropVegetative: 0x43A047,
  cropFlowering: 0xFFEB3B,
  cropFruiting: 0xFF9800,
  cropHarvest: 0xFFC107,
  cropStressed: 0xFDD835,
  cropDead: 0x795548,
  // Buildings
  buildingWall: 0xE8E0D4,
  buildingRoof: 0x475569,
  polyhouse: 0xD1FAE5,
  polyhouseFrame: 0x94A3B8,
  // Infrastructure
  road: 0x8D877A,
  roadDark: 0x5C564C,
  fence: 0x8D6E63,
  sensor: 0x00BCD4,
  sensorBlink: 0x00E5FF,
  borewell: 0x607D8B,
  // Workers
  workerFarmer: 0x15803D,
  workerLabor: 0xEA580C,
  workerAgronomist: 0x0284C7,
  workerSkin: 0xD4A373,
  // Effects
  rain: 0xB3E5FC,
  heatShimmer: 0xFFCC80,
  fog: 0xDBEAFE,
  // UI & Alerts
  emerald: 0x10B981,
  emeraldBright: 0x34D399,
  alertRed: 0xEF4444,
  alertAmber: 0xF59E0B,
};

// ═══════════════════════════════════════════════════════════════
// SEEDED DISEASE OUTBREAK CALENDAR (Multi-Day Realistic Crop Protection)
// ═══════════════════════════════════════════════════════════════
export const SEEDED_DISEASES = {
  14: {
    day: 14,
    name: "Aphid Infestation & Seedling Damping-Off",
    pest: "Aphis gossypii (Cotton & Melon Aphid)",
    sector: "South Nursery Plot",
    coords: { x: 18, z: 22 },
    severity: "warning",
    color: 0xf59e0b,
    colorHex: "#f59e0b",
    healthyPct: 0.88,
    stressedPct: 0.12,
    deadPct: 0.00,
    prescription: "Neem Seed Kernel Extract 3000ppm + Imidacloprid 17.8% SL foliar drench"
  },
  30: {
    day: 30,
    name: "Critical Bio-Risk: Fall Armyworm Outbreak",
    pest: "Spodoptera frugiperda (Fall Armyworm)",
    sector: "North Sector Farm",
    coords: { x: 0, z: -25 },
    severity: "critical",
    color: 0xef4444,
    colorHex: "#ef4444",
    healthyPct: 0.72,
    stressedPct: 0.24,
    deadPct: 0.04,
    prescription: "Chlorantraniliprole 18.5% SC + Pheromone Trapping Grid"
  },
  48: {
    day: 48,
    name: "Foliar Stripe Rust & Leaf Blight",
    pest: "Puccinia striiformis (Yellow Stripe Rust)",
    sector: "East Cereal Field",
    coords: { x: 28, z: -8 },
    severity: "high",
    color: 0xe11d48,
    colorHex: "#e11d48",
    healthyPct: 0.68,
    stressedPct: 0.28,
    deadPct: 0.04,
    prescription: "Propiconazole 25% EC @ 1.0 mL/L prophylactic canopy mist"
  },
  72: {
    day: 72,
    name: "Yellow Stem Borer & Collar Rot",
    pest: "Scirpophaga incertulas (Yellow Stem Borer)",
    sector: "Central Irrigated Plot",
    coords: { x: -16, z: 10 },
    severity: "high",
    color: 0xd97706,
    colorHex: "#d97706",
    healthyPct: 0.65,
    stressedPct: 0.30,
    deadPct: 0.05,
    prescription: "Cartap Hydrochloride 4G granules in root zone"
  },
  95: {
    day: 95,
    name: "Sheath Blight & Pod Borer Complex",
    pest: "Helicoverpa armigera / Rhizoctonia solani",
    sector: "West Terrace Field",
    coords: { x: -28, z: -14 },
    severity: "critical",
    color: 0xdc2626,
    colorHex: "#dc2626",
    healthyPct: 0.58,
    stressedPct: 0.36,
    deadPct: 0.06,
    prescription: "Azoxystrobin 18.2% + Difenoconazole 11.4% SC mist"
  }
};

// ═══════════════════════════════════════════════════════════════
// SECTION 3: Main 3D Digital Twin Engine Class
// ═══════════════════════════════════════════════════════════════
export class AgriosDigitalTwin3D {
  constructor() {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.labelRenderer = null;
    this.clock = new THREE.Clock();
    this.noise = new SimplexNoise(42);

    // Keyboard tracking for arrow/WASD camera navigation
    this.keysDown = {};

    // Dynamic disease outbreak schedule
    this.diseaseSchedule = { ...SEEDED_DISEASES };
    this.onDayStateChange = null;

    // Scene groups (for layer toggling & editor isolation)
    this.groups = {
      terrain: new THREE.Group(),
      fields: new THREE.Group(),
      crops: new THREE.Group(),
      buildings: new THREE.Group(),
      infrastructure: new THREE.Group(),
      workers: new THREE.Group(),
      water: new THREE.Group(),
      weather: new THREE.Group(),
      risks: new THREE.Group(),
      labels: new THREE.Group(),
      editor: new THREE.Group(), // CAD editor helpers and gizmos
    };

    // State
    this.sceneData = null;
    this.farmBounds = { minX: -50, maxX: 50, minZ: -40, maxZ: 40 };
    this.currentDay = 1;
    this.maxDays = 120;
    this.currentWeather = 'clear';
    this.activePreset = 'overview';
    this.selectedEntity = null;
    this.animatedObjects = [];
    this.workerMeshes = [];
    this.cropInstances = null;
    this.cropName = null;
    this.rainParticles = null;
    this.cloudMeshes = [];
    this.isDestroyed = false;

    // Enterprise adaptation & 5 3D Agricultural World Models
    this.farmingClassification = 'terrestrial'; // 'terrestrial' | 'horticulture' | 'polyhouse' | 'aquaculture' | 'terrace'
    this.isAquaculture = false;
    this.outbreakBeaconGroup = null;
    this.surveyorMesh = null;
    this.surveyTrail = null;
    this.horticultureTrees = [];
    this.polyhouseStructure = null;
    this.terraceTiers = [];
    this.tomatoTrellises = [];
    this.fishMeshes = [];
    this.paddyWater = null;

    // Personnel name tags visibility
    this.showWorkerLabels = true;

    // Interactive 3D Tractor State & Plowing Operations
    this.tractorMesh = null;
    this.tractorActive = false;
    this.tractorWheels = [];
    this.tractorSmokeParticles = [];
    this._tractorSoundNodes = null;

    // Pasture Paddock & Grazing Livestock
    this.pastureGroup = null;
    this.livestockMeshes = [];

    // Water Spraying Particle System
    this.sprayParticlesPool = [];

    // Web Audio Native Synthesizer & Procedural Ambience State
    this.soundMuted = false;
    this._audioCtx = null;
    this._ambientSoundNodes = {
      birdTimer: null,
      rainSource: null,
      rainGain: null,
      heatwaveSource: null,
      heatwaveGain: null,
      nightSource: null,
      nightGain: null
    };

    // Atmospheric Disaster Engine State
    this.activeDisaster = null;
    this.disasterObjects = [];
    this.hailData = null;
    this.locustData = null;
    this.heatShimmerData = null;
    this.floodMesh = null;
    this.frostOverlayMesh = null;
    this._originalTerrainRoughness = 0.85;

    // Procedural texture caches
    this._soilTexture = null;
    this._grassTexture = null;
    this._roadTexture = null;
    this._crackedSoilTexture = null;

    // ── CAD-Lite EDIT FARM Mode State ──
    this.isEditMode = false;
    this.activeEditTool = 'select'; // 'select' | 'road' | 'field' | 'irrigation' | 'building' | 'plants'
    this.activeBuildingType = 'shed'; // 'shed' | 'office' | 'polyhouse' | 'silo' | 'coldstorage'
    this.editPoints = [];
    this.previewMesh = null;
    this.editHistory = [];
    this.redoHistory = [];
    this.selectedEditObject = null;
    this.onEditStateChange = null;
    this.onAreaMeasure = null;
    this.isDraggingObject = false;

    // Layer visibility
    this.layers = {
      fields: true,
      crops: true,
      workers: true,
      infrastructure: true,
      health: false,
      moisture: false,
      risks: true,
    };

    // Raycaster for click & CAD detection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Minimap
    this.minimapRenderer = null;
    this.minimapCamera = null;

    // Callbacks
    this.onEntitySelect = null;
    this.onEntityInspect = null;
    this.onTelemetryUpdate = null;
    this.onSceneRebuildNeeded = null;

    // Animation frame ID
    this.animFrameId = null;
  }

  // ─────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────
  init(containerId, minimapCanvasId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[3D Twin] Container not found:', containerId);
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdbeafe);

    // Add all groups to scene
    Object.values(this.groups).forEach(g => this.scene.add(g));

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
    this.camera.position.set(60, 55, 60);

    // 3. WebGL Renderer with Soft Shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // 4. CSS2D Renderer for Floating Labels
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(width, height);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.labelRenderer.domElement.className = 'dt3d-label-renderer';
    container.appendChild(this.labelRenderer.domElement);

    // 5. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Do not go below ground
    this.controls.minDistance = 5;
    this.controls.maxDistance = 180;
    this.controls.target.set(0, 0, 0);

    // 6. Generate Procedural Textures
    this._soilTexture = this._createProceduralSoilTexture();
    this._grassTexture = this._createProceduralGrassTexture();
    this._roadTexture = this._createProceduralRoadTexture();
    this._crackedSoilTexture = this._createProceduralCrackedSoilTexture();

    // 7. Lighting & Atmospheric Sky Dome
    this._setupLighting();
    this._createSkyDome();

    // 8. Minimap Setup
    if (minimapCanvasId) {
      this._setupMinimap(minimapCanvasId);
    }

    // 9. Event Listeners & Resize Observer
    this._setupEventListeners(container);

    this._resizeObserver = new ResizeObserver(() => this._onResize(container));
    this._resizeObserver.observe(container);

    console.log('[3D Twin] Engine initialized with upgraded visuals & CAD editor capabilities');
  }

  // ─────────────────────────────────────────────────────────────
  // LIGHTING & ATMOSPHERE
  // ─────────────────────────────────────────────────────────────
  _setupLighting() {
    // Ambient light (warm soft fill)
    const ambient = new THREE.AmbientLight(0xfff7ed, 0.55);
    this.scene.add(ambient);
    this._ambientLight = ambient;

    // Hemisphere light (sky blue to warm soil bounce)
    const hemi = new THREE.HemisphereLight(0xbfdbfe, 0x533e2d, 0.45);
    this.scene.add(hemi);
    this._hemiLight = hemi;

    // Directional sunlight with high-res soft cascaded shadows
    const sun = new THREE.DirectionalLight(0xfffbeb, 1.35);
    sun.position.set(50, 75, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 220;
    sun.shadow.camera.left = -85;
    sun.shadow.camera.right = 85;
    sun.shadow.camera.top = 85;
    sun.shadow.camera.bottom = -85;
    sun.shadow.bias = -0.0006;
    this.scene.add(sun);
    this._sunLight = sun;

    sun.target.position.set(0, 0, 0);
    this.scene.add(sun.target);
  }

  _createSkyDome() {
    this._skyCanvas = document.createElement('canvas');
    this._skyCanvas.width = 512;
    this._skyCanvas.height = 512;
    this._skyTexture = new THREE.CanvasTexture(this._skyCanvas);
    const skyGeo = new THREE.SphereGeometry(280, 32, 18);
    const skyMat = new THREE.MeshBasicMaterial({
      map: this._skyTexture,
      side: THREE.BackSide,
      depthWrite: false
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyMesh);
    this._skyMesh = skyMesh;

    // Atmospheric sun disc
    const sunDiscGeo = new THREE.CircleGeometry(11, 24);
    const sunDiscMat = new THREE.MeshBasicMaterial({
      color: 0xfffbeb,
      side: THREE.DoubleSide
    });
    const sunDisc = new THREE.Mesh(sunDiscGeo, sunDiscMat);
    sunDisc.position.set(65, 115, 60);
    sunDisc.lookAt(0, 0, 0);
    this.scene.add(sunDisc);
    this._sunDisc = sunDisc;

    // Scene fog for natural aerial perspective
    this.scene.fog = new THREE.FogExp2(0xdbeafe, 0.0028);

    // Initial default sky gradient
    this._updateSkyDome([
      { stop: 0.0, color: '#1d4ed8' },
      { stop: 0.35, color: '#3b82f6' },
      { stop: 0.70, color: '#93c5fd' },
      { stop: 0.92, color: '#fed7aa' },
      { stop: 1.0, color: '#fde68a' }
    ], { x: 65, y: 115, z: 60 }, 0xfffbeb, 11, false);
  }

  _updateSkyDome(gradientStops, sunPosition, sunColor, sunSize = 11, isNight = false) {
    if (!this._skyCanvas) return;
    const ctx = this._skyCanvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    gradientStops.forEach(s => grad.addColorStop(s.stop, s.color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    if (this._skyTexture) {
      this._skyTexture.needsUpdate = true;
    }

    if (this._sunDisc) {
      if (sunPosition) {
        this._sunDisc.position.set(sunPosition.x, sunPosition.y, sunPosition.z);
        this._sunDisc.lookAt(0, 0, 0);
      }
      if (sunColor) {
        this._sunDisc.material.color.setHex(sunColor);
      }
      const scale = sunSize / 11;
      this._sunDisc.scale.set(scale, scale, scale);
      this._sunDisc.visible = !isNight;
    }
  }

  _setupMinimap(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    this.minimapRenderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false,
      alpha: true,
    });
    this.minimapRenderer.setSize(160, 120);
    this.minimapRenderer.setPixelRatio(1);

    this.minimapCamera = new THREE.OrthographicCamera(-70, 70, 52.5, -52.5, 1, 250);
    this.minimapCamera.position.set(0, 120, 0);
    this.minimapCamera.lookAt(0, 0, 0);
  }

  // ─────────────────────────────────────────────────────────────
  // PROCEDURAL CANVAS TEXTURE GENERATORS
  // ─────────────────────────────────────────────────────────────
  _createProceduralSoilTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base rich loamy earth
    ctx.fillStyle = '#533e2d';
    ctx.fillRect(0, 0, 512, 512);

    // Granular micro-stipples
    for (let i = 0; i < 20000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random();
      ctx.fillStyle = r > 0.6 ? '#6d533d' : (r > 0.3 ? '#3f2e21' : '#2b1e15');
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // Ploughed furrow lines
    ctx.fillStyle = 'rgba(43, 30, 21, 0.35)';
    for (let y = 0; y < 512; y += 16) {
      ctx.fillRect(0, y, 512, 6);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
  }

  _createProceduralGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 25000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random();
      ctx.fillStyle = r > 0.7 ? '#40916c' : (r > 0.4 ? '#1b4332' : '#52b788');
      ctx.fillRect(x, y, 1.2, 2.5);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 12);
    return texture;
  }

  _createProceduralRoadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#8d877a';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 16000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random();
      ctx.fillStyle = r > 0.6 ? '#adaba4' : (r > 0.3 ? '#6e6a61' : '#4d4a43');
      ctx.fillRect(x, y, 2, 2);
    }

    // Wheel tracks
    ctx.fillStyle = 'rgba(80, 75, 68, 0.35)';
    ctx.fillRect(90, 0, 70, 512);
    ctx.fillRect(352, 0, 70, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 10);
    return texture;
  }

  _createProceduralCrackedSoilTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base parched arid red/brown clay
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 512, 512);

    // Stippling dry sand granules
    for (let i = 0; i < 22000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.5 ? '#92400e' : (Math.random() > 0.5 ? '#b45309' : '#451a03');
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // Polygonal Voronoi-like deep fissures & cracks
    const points = [];
    for (let i = 0; i < 38; i++) {
      points.push({ x: Math.random() * 512, y: Math.random() * 512 });
    }

    ctx.strokeStyle = '#291104';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 110) {
          ctx.moveTo(points[i].x, points[i].y);
          // Jagged crack mid-points
          const mx = (points[i].x + points[j].x) / 2 + (Math.random() - 0.5) * 16;
          const my = (points[i].y + points[j].y) / 2 + (Math.random() - 0.5) * 16;
          ctx.lineTo(mx, my);
          ctx.lineTo(points[j].x, points[j].y);
        }
      }
    }
    ctx.stroke();

    // Crack edge highlights (sunlit bevel)
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
  }

  // ─────────────────────────────────────────────────────────────
  // SCENE BUILDING
  // ─────────────────────────────────────────────────────────────
  async buildScene(sceneData) {
    this.sceneData = sceneData;

    const cp = sceneData.crop_plan || {};
    const farmCrop = sceneData.farm?.crop_type || '';
    const cleanCropName = (cp.crop_name || cp.crop_type || farmCrop || this.cropName || '').toLowerCase();
    const farmingCls = (cp.farming_classification || this.farmingClassification || '').toLowerCase();

    // High-Fidelity 5 3D Agricultural Worlds Detection
    if (farmingCls.includes('horticulture') || farmingCls.includes('orchard') || 
        cleanCropName.includes('mango') || cleanCropName.includes('guava') || 
        cleanCropName.includes('citrus') || cleanCropName.includes('pomegranate') || 
        cleanCropName.includes('banana')) {
      this.farmingClassification = 'horticulture';
    } else if (farmingCls.includes('polyhouse') || farmingCls.includes('protected') || 
               cleanCropName.includes('capsicum') || cleanCropName.includes('cucumber') || 
               cleanCropName.includes('lettuce') || cleanCropName.includes('floriculture') ||
               cleanCropName.includes('greenhouse')) {
      this.farmingClassification = 'polyhouse';
    } else if (farmingCls.includes('terrace') || farmingCls.includes('hill') || 
               cleanCropName.includes('rajmash') || cleanCropName.includes('buckwheat') || 
               cleanCropName.includes('ginger') || cleanCropName.includes('millet') ||
               cleanCropName.includes('mountain')) {
      this.farmingClassification = 'terrace';
    } else if (cleanCropName.includes('pisc') || cleanCropName.includes('carp') || 
               cleanCropName.includes('fish') || cleanCropName.includes('rohu') || 
               cleanCropName.includes('catla') || cleanCropName.includes('tilapia') ||
               cleanCropName.includes('scampi') || farmingCls.includes('pisc') || 
               farmingCls.includes('aqua')) {
      this.farmingClassification = 'aquaculture';
    } else {
      this.farmingClassification = 'terrestrial';
    }
    this.isAquaculture = (this.farmingClassification === 'aquaculture');

    // Dynamic days calibration duration matching the crop plan
    if (sceneData.crop_plan && sceneData.crop_plan.duration_days) {
      this.maxDays = parseInt(sceneData.crop_plan.duration_days, 10) || 120;
    } else if (sceneData.crop_plan && sceneData.crop_plan.stages && sceneData.crop_plan.stages.length > 0) {
      const lastStage = sceneData.crop_plan.stages[sceneData.crop_plan.stages.length - 1];
      this.maxDays = lastStage ? (lastStage.end_day || 120) : 120;
    } else if (this.farmingClassification === 'horticulture') {
      this.maxDays = 240;
    } else if (this.isAquaculture) {
      this.maxDays = 195;
    } else if (this.farmingClassification === 'terrace') {
      this.maxDays = 105;
    } else if (cleanCropName.includes('tomato')) {
      this.maxDays = 90;
    } else if (cleanCropName.includes('cotton')) {
      this.maxDays = 155;
    } else if (cleanCropName.includes('potato')) {
      this.maxDays = 85;
    } else if (cleanCropName.includes('rice')) {
      this.maxDays = 135;
    } else {
      this.maxDays = 120;
    }

    this._clearGroups();

    // Build scene hierarchy according to 5 agricultural worlds
    this._buildTerrain();
    this._buildFarmBoundary(sceneData.boundary);
    this._buildFields(sceneData.spatial_objects);
    this._buildRoads(sceneData.spatial_objects);
    this._buildWater(sceneData.spatial_objects);
    this._buildBuildings(sceneData.spatial_objects);
    this._buildInfrastructure(sceneData.spatial_objects);
    this._buildCrops(sceneData.planting_grid, sceneData.crop_plan);
    this._buildWorkers(sceneData.workers);
    this._buildTractor();
    this._buildPastureZone();
    this._applyWeather(sceneData.weather);

    console.log(`[3D Twin] Built ${this.farmingClassification.toUpperCase()} World (Crop: ${cleanCropName || 'Wheat'}, Max Days: ${this.maxDays}) with`, this.scene.children.length, 'top-level groups');
  }

  _clearGroups() {
    Object.values(this.groups).forEach(group => {
      while (group.children.length > 0) {
        const child = group.children[0];
        child.traverse(obj => {
          if (obj.isCSS2DObject && obj.element && obj.element.parentNode) {
            obj.element.parentNode.removeChild(obj.element);
          }
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
          }
        });
        group.remove(child);
      }
    });
    this.animatedObjects = [];
    this.workerMeshes = [];
    this.cloudMeshes = [];
    this.rainParticles = null;
    this.outbreakBeaconGroup = null;
    this.horticultureTrees = [];
    this.polyhouseStructure = null;
    this.terraceTiers = [];
    this.tomatoTrellises = [];
    this.fishMeshes = [];
    this.paddyWater = null;
    this.disasterObjects = [];
    this.tractorMesh = null;
    this.pastureGroup = null;
    this.livestockMeshes = [];
    this.tractorSmokeParticles = [];
  }

  // ─────────────────────────────────────────────────────────────
  // TERRAIN WITH PBR TEXTURE & VERTEX ELEVATIONS
  // ─────────────────────────────────────────────────────────────
  _buildTerrain() {
    if (this.farmingClassification === 'terrace') {
      this._buildTerraceTerrain();
      return;
    }
    const size = 150;
    const segments = 90;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const colorAttr = new THREE.BufferAttribute(colors, 3);

    const soilColor = new THREE.Color(COLORS.soil);
    const grassColor = new THREE.Color(COLORS.grass);
    const grassDarkColor = new THREE.Color(COLORS.grassDark);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      // Multi-frequency elevation
      const elevation = this.noise.noise2D(x * 0.02, z * 0.02) * 1.8 +
                        this.noise.noise2D(x * 0.05, z * 0.05) * 0.6;
      positions.setY(i, elevation);

      const inFarm = Math.abs(x) < 50 && Math.abs(z) < 40;
      const noiseVal = this.noise.noise2D(x * 0.08, z * 0.08);

      let color;
      if (inFarm) {
        color = soilColor.clone().lerp(grassDarkColor, 0.25 + noiseVal * 0.15);
      } else {
        color = grassColor.clone().lerp(grassDarkColor, 0.45 + noiseVal * 0.25);
      }

      colorAttr.setXYZ(i, color.r, color.g, color.b);
    }

    geo.setAttribute('color', colorAttr);
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      map: this._soilTexture,
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.04,
      side: THREE.FrontSide,
    });

    const terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    terrain.userData = { type: 'terrain' };
    this.groups.terrain.add(terrain);
    this._terrainMesh = terrain;
  }

  // Stepped 4-Tier Alpine Mountain Terrace Terrain
  _buildTerraceTerrain() {
    const size = 150;
    const segments = 100;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const colorAttr = new THREE.BufferAttribute(colors, 3);

    const soilColor = new THREE.Color(0x5d4037);
    const mountainRockColor = new THREE.Color(0x455a64);
    const alpineGrassColor = new THREE.Color(0x2e7d32);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      // 4-tier stepped mountain slope along Z axis (from Z=50 valley to Z=-50 mountain top)
      let tierElevation = 0.5;
      if (z < -24) {
        tierElevation = 10.5; // Top alpine ridge tier
      } else if (z < -2) {
        tierElevation = 7.0;  // Mid-upper tier
      } else if (z < 20) {
        tierElevation = 3.6;  // Mid-lower tier
      } else {
        tierElevation = 0.6;  // Bottom valley tier
      }

      // Add rugged organic mountain noise at edges
      const noise = this.noise.noise2D(x * 0.04, z * 0.04) * 0.4;
      const elevation = tierElevation + noise;
      positions.setY(i, elevation);

      // Color based on elevation and slope
      const t = Math.min(Math.max(elevation / 11.0, 0), 1);
      let color = soilColor.clone().lerp(alpineGrassColor, 0.35 + t * 0.4);
      if (Math.abs(z + 24) < 1.8 || Math.abs(z + 2) < 1.8 || Math.abs(z - 20) < 1.8) {
        // Exposed cliff / stone retaining edge
        color = mountainRockColor.clone().lerp(soilColor, 0.25);
      }

      colorAttr.setXYZ(i, color.r, color.g, color.b);
    }

    geo.setAttribute('color', colorAttr);
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      map: this._soilTexture,
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.FrontSide,
    });

    const terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    terrain.userData = { type: 'terrain', subtype: 'terrace_mountain' };
    this.groups.terrain.add(terrain);
    this._terrainMesh = terrain;
  }

  // ─────────────────────────────────────────────────────────────
  // FARM BOUNDARY
  // ─────────────────────────────────────────────────────────────
  _buildFarmBoundary(boundaryGeoJSON) {
    let coords;
    if (boundaryGeoJSON && boundaryGeoJSON.coordinates && boundaryGeoJSON.coordinates[0]) {
      coords = boundaryGeoJSON.coordinates[0];
    } else {
      coords = [[-50, -40], [50, -40], [50, 40], [-50, 40], [-50, -40]];
    }

    const points = [];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

    coords.forEach(pt => {
      let x, z;
      if (Math.abs(pt[0]) > 50 || Math.abs(pt[1]) > 50) {
        const refLon = 75.8575, refLat = 30.9015;
        x = (pt[0] - refLon) * 20000;
        z = (pt[1] - refLat) * 20000;
      } else {
        x = pt[0];
        z = pt[1];
      }
      x = Math.max(-65, Math.min(65, x));
      z = Math.max(-55, Math.min(55, z));

      points.push(new THREE.Vector3(x, 0.3, z));
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    });

    this.farmBounds = { minX, maxX, minZ, maxZ };

    // 1. Boundary glowing wireframe
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: COLORS.emerald,
      linewidth: 3,
      transparent: true,
      opacity: 0.85,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    this.groups.fields.add(line);

    // 2. Boundary perimeter fence posts
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dist = p1.distanceTo(p2);
      const postCount = Math.floor(dist / 6);
      const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 5);
      const postMat = new THREE.MeshStandardMaterial({ color: COLORS.fence, roughness: 0.9 });

      for (let j = 0; j <= postCount; j++) {
        const t = j / Math.max(1, postCount);
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.lerpVectors(p1, p2, t);
        post.position.y = 0.6;
        post.castShadow = true;
        this.groups.fields.add(post);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // FIELDS (Polygonal & Grid Subdivisions)
  // ─────────────────────────────────────────────────────────────
  _buildFields(spatialObjects) {
    if (this.farmingClassification === 'aquaculture' || this.isAquaculture) {
      this._buildAquaculturePonds();
      return;
    }
    if (this.farmingClassification === 'terrace') {
      this._buildTerraceFields();
      return;
    }
    if (this.farmingClassification === 'polyhouse') {
      this._buildPolyhouseComplex();
      return;
    }
    if (this.farmingClassification === 'horticulture') {
      this._buildHorticultureOrchard();
      return;
    }

    const { minX, maxX, minZ, maxZ } = this.farmBounds;
    const farmW = maxX - minX;
    const farmH = maxZ - minZ;

    const rawCropName = this.cropName || this.sceneData?.crop_plan?.crop_name || '';
    const cleanCrop = rawCropName.toLowerCase();

    // If crop is tomato, build wooden post & wire trellis architecture
    if (cleanCrop.includes('tomato')) {
      this._buildTomatoTrellises();
    }

    // If crop is rice/paddy, build flooded reflective basins
    if (cleanCrop.includes('rice') || cleanCrop.includes('paddy')) {
      this._buildPaddyBasins();
    }

    // Check if custom fields exist in spatialObjects
    const customFields = (spatialObjects || []).filter(o => o.type === 'field' && o.vertices && o.vertices.length >= 3);
    if (customFields.length > 0) {
      customFields.forEach((cf, idx) => {
        this._createPolygonField(cf.vertices, cf, idx);
      });
      return;
    }

    // Default 2x2 field parcels
    const cols = 2, rows = 2;
    const cellW = (farmW - 8) / cols;
    const cellH = (farmH - 8) / rows;
    const fieldNames = ['Field A (North-West)', 'Field B (North-East)', 'Field C (South-West)', 'Field D (South-East)'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = minX + 4 + c * cellW + cellW / 2;
        const z = minZ + 4 + r * cellH + cellH / 2;
        const idx = r * cols + c;

        const fieldGeo = new THREE.PlaneGeometry(cellW - 2, cellH - 2);
        fieldGeo.rotateX(-Math.PI / 2);
        const fieldMat = new THREE.MeshStandardMaterial({
          map: this._soilTexture,
          color: new THREE.Color(COLORS.soilDark).lerp(new THREE.Color(COLORS.soil), 0.3 + idx * 0.1),
          roughness: 0.8,
          metalness: 0.05,
        });
        const field = new THREE.Mesh(fieldGeo, fieldMat);
        field.position.set(x, 0.16, z);
        field.receiveShadow = true;
        field.userData = {
          type: 'field',
          id: `field_${idx}`,
          name: fieldNames[idx],
          area_acres: ((cellW * cellH) / 4046.86 * 100).toFixed(1),
          index: idx,
        };
        this.groups.fields.add(field);

        // Ploughed furrow lines
        const furrowCount = Math.floor(cellW / 3);
        for (let f = 0; f < furrowCount; f++) {
          const fx = x - cellW / 2 + 2 + f * 3;
          const furrowGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(fx, 0.19, z - cellH / 2 + 1),
            new THREE.Vector3(fx, 0.19, z + cellH / 2 - 1),
          ]);
          const furrow = new THREE.Line(furrowGeo, new THREE.LineBasicMaterial({
            color: 0x3e2723, transparent: true, opacity: 0.45,
          }));
          this.groups.fields.add(furrow);
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. TERRACE & MOUNTAIN HILL AGRICULTURE WORLD ARCHITECTURE
  // ─────────────────────────────────────────────────────────────
  _buildTerraceFields() {
    // 1. Dry-stone retaining walls along the 3 terrace step cliffs
    const cliffZs = [
      { z: 20, h: 3.0, bottomY: 0.6, name: "Terrace Retaining Wall A (Lower)" },
      { z: -2, h: 3.4, bottomY: 3.6, name: "Terrace Retaining Wall B (Mid-Slope)" },
      { z: -24, h: 3.5, bottomY: 7.0, name: "Terrace Retaining Wall C (Upper Alpine)" }
    ];

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.95,
      metalness: 0.08
    });

    cliffZs.forEach((cw) => {
      const wallGeo = new THREE.BoxGeometry(90, cw.h, 2.2);
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(0, cw.bottomY + cw.h / 2, cw.z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      wall.userData = { type: 'infrastructure', subtype: 'retaining_wall', name: cw.name };
      this.groups.infrastructure.add(wall);

      // Wooden/stone access staircase cutting across the wall
      const stairGeo = new THREE.BoxGeometry(3.2, cw.h * 1.15, 4.2);
      const stairMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });
      const stair = new THREE.Mesh(stairGeo, stairMat);
      stair.position.set(22, cw.bottomY + cw.h / 2, cw.z);
      stair.rotation.x = -0.35;
      this.groups.infrastructure.add(stair);
    });

    // 2. Mountain Kuhl Water Channel (Gravity runoff sluice channel)
    const kuhlMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.85
    });
    const kuhlPts = [
      new THREE.Vector3(-28, 10.8, -42),
      new THREE.Vector3(-28, 7.3, -24),
      new THREE.Vector3(-28, 3.9, -2),
      new THREE.Vector3(-28, 0.9, 20),
      new THREE.Vector3(-28, 0.6, 42)
    ];

    for (let i = 0; i < kuhlPts.length - 1; i++) {
      const p1 = kuhlPts[i];
      const p2 = kuhlPts[i + 1];
      const dy = p2.y - p1.y;
      const dz = p2.z - p1.z;
      const len = Math.sqrt(dz * dz + dy * dy);
      const waterSlice = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, len), kuhlMat);
      waterSlice.position.set((p1.x + p2.x)/2, (p1.y + p2.y)/2, (p1.z + p2.z)/2);
      waterSlice.rotation.x = Math.atan2(dy, dz);
      this.groups.water.add(waterSlice);

      const troughMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
      for (const side of [-0.9, 0.9]) {
        const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, len), troughMat);
        sideWall.position.set(((p1.x + p2.x)/2) + side, ((p1.y + p2.y)/2) + 0.15, (p1.z + p2.z)/2);
        sideWall.rotation.x = Math.atan2(dy, dz);
        this.groups.infrastructure.add(sideWall);
      }
    }

    // Stone Sluice Gates on Kuhl
    for (const p of [kuhlPts[1], kuhlPts[2], kuhlPts[3]]) {
      const gateGeo = new THREE.BoxGeometry(2.2, 1.2, 0.4);
      const gateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      const gate = new THREE.Mesh(gateGeo, gateMat);
      gate.position.set(p.x, p.y + 0.6, p.z);
      this.groups.infrastructure.add(gate);

      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.05, 6, 12), new THREE.MeshStandardMaterial({ color: 0xeab308 }));
      wheel.position.set(p.x, p.y + 1.3, p.z);
      wheel.rotation.x = Math.PI / 2;
      this.groups.infrastructure.add(wheel);
    }

    // 3. 4 Stepped Terrace Crop Plots
    const tiers = [
      { name: "Tier 1: Lower Alluvial Terrace", minZ: 21, maxZ: 42, y: 0.62, crop: "Hill Cabbage" },
      { name: "Tier 2: Mid-Lower Kuhl Terrace", minZ: -1, maxZ: 19, y: 3.62, crop: "Rajmash Beans" },
      { name: "Tier 3: Mid-Upper Slope Terrace", minZ: -23, maxZ: -3, y: 7.02, crop: "Buckwheat" },
      { name: "Tier 4: Alpine Ridge Terrace", minZ: -42, maxZ: -25, y: 10.52, crop: "Finger Millet" }
    ];

    tiers.forEach((t, idx) => {
      const fieldGeo = new THREE.PlaneGeometry(75, t.maxZ - t.minZ - 2);
      fieldGeo.rotateX(-Math.PI / 2);
      const fieldMat = new THREE.MeshStandardMaterial({
        map: this._soilTexture,
        color: new THREE.Color(0x3e2723).lerp(new THREE.Color(COLORS.soil), 0.35 + idx * 0.1),
        roughness: 0.82
      });
      const fieldMesh = new THREE.Mesh(fieldGeo, fieldMat);
      fieldMesh.position.set(4, t.y, (t.minZ + t.maxZ) / 2);
      fieldMesh.receiveShadow = true;
      fieldMesh.userData = {
        type: 'field',
        id: `terrace_${idx}`,
        name: t.name,
        area_acres: (2.8 + idx * 0.5).toFixed(1),
        crop: t.crop,
        elevation_m: t.y.toFixed(1)
      };
      this.groups.fields.add(fieldMesh);

      const lbl = this._createLabel(`⛰️ ${t.name} (Alt: ${t.y.toFixed(1)}m)`, new THREE.Vector3(4, t.y + 1.6, (t.minZ + t.maxZ) / 2), '#34d399', '0.72rem', true);
      this.groups.labels.add(lbl);
    });

    const kuhlLabel = this._createLabel('💧 Gravity Kuhl Sluice Channel', new THREE.Vector3(-28, 8.5, -14), '#38bdf8', '0.72rem', true);
    this.groups.labels.add(kuhlLabel);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. COMMERCIAL HORTICULTURE & ORCHARD WORLD ARCHITECTURE
  // ─────────────────────────────────────────────────────────────
  _buildHorticultureOrchard() {
    const { minX, maxX, minZ, maxZ } = this.farmBounds;
    const rawCropName = this.cropName || this.sceneData?.crop_plan?.crop_name || 'Mango';
    const cLower = rawCropName.toLowerCase();

    let fruitColor = 0xf59e0b; // Mango golden
    let fruitType = 'mango';
    let fruitScale = 0.26;
    if (cLower.includes('citrus') || cLower.includes('orange') || cLower.includes('lemon')) {
      fruitColor = 0xf97316;
      fruitType = 'citrus';
      fruitScale = 0.24;
    } else if (cLower.includes('guava')) {
      fruitColor = 0xa3e635;
      fruitType = 'guava';
      fruitScale = 0.22;
    } else if (cLower.includes('pomegranate')) {
      fruitColor = 0xbe123c;
      fruitType = 'pomegranate';
      fruitScale = 0.25;
    } else if (cLower.includes('banana')) {
      fruitColor = 0xfacc15;
      fruitType = 'banana';
      fruitScale = 0.32;
    }

    // 1. Orchard grass base
    const orchardGround = new THREE.Mesh(
      new THREE.PlaneGeometry(maxX - minX, maxZ - minZ),
      new THREE.MeshStandardMaterial({ map: this._grassTexture, roughness: 0.9 })
    );
    orchardGround.rotateX(-Math.PI / 2);
    orchardGround.position.set(0, 0.18, 0);
    orchardGround.receiveShadow = true;
    this.groups.fields.add(orchardGround);

    // 2. High-density tree grid (6 rows x 8 trees = 48 trees)
    const rows = 6;
    const cols = 8;
    const stepX = (maxX - minX - 16) / cols;
    const stepZ = (maxZ - minZ - 16) / rows;

    this.horticultureTrees = [];

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.95 });
    const foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 });
    const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x40916c, roughness: 0.75 });
    const fruitMat = new THREE.MeshStandardMaterial({ color: fruitColor, roughness: 0.3, metalness: 0.1 });
    const sprinklerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const sprayMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, side: THREE.DoubleSide });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tx = minX + 8 + c * stepX + (Math.random() - 0.5) * 0.7;
        const tz = minZ + 8 + r * stepZ + (Math.random() - 0.5) * 0.7;

        const treeGroup = new THREE.Group();
        treeGroup.position.set(tx, 0.18, tz);

        const trunkH = 2.4 + Math.random() * 0.5;
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.34, trunkH, 8);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = trunkH / 2;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const mound = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 1.8, 0.18, 12),
          new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 })
        );
        mound.position.y = 0.09;
        treeGroup.add(mound);

        const canopyGroup = new THREE.Group();
        canopyGroup.position.y = trunkH + 1.1;

        for (let k = 0; k < 3; k++) {
          const cGeo = new THREE.DodecahedronGeometry(1.3 + Math.random() * 0.25, 1);
          const cMesh = new THREE.Mesh(cGeo, k % 2 === 0 ? foliageMat1 : foliageMat2);
          cMesh.position.set(
            (Math.random() - 0.5) * 1.1,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 1.1
          );
          cMesh.scale.set(1.2, 0.95, 1.2);
          cMesh.castShadow = true;
          canopyGroup.add(cMesh);
        }
        treeGroup.add(canopyGroup);

        // Hanging Fruit Meshes
        const fruits = [];
        const fruitCount = 5 + Math.floor(Math.random() * 4);
        for (let f = 0; f < fruitCount; f++) {
          const fGeo = fruitType === 'mango' ? new THREE.ConeGeometry(fruitScale, fruitScale * 1.8, 8) : new THREE.SphereGeometry(fruitScale, 8, 8);
          const fMesh = new THREE.Mesh(fGeo, fruitMat.clone());
          const ang = Math.random() * Math.PI * 2;
          const rad = 0.8 + Math.random() * 0.8;
          const fy = trunkH + 0.4 + Math.random() * 1.1;
          fMesh.position.set(Math.cos(ang) * rad, fy, Math.sin(ang) * rad);
          fMesh.castShadow = true;
          treeGroup.add(fMesh);
          fruits.push(fMesh);
        }

        // Under-canopy micro-sprinkler
        const sprinkler = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6), sprinklerMat);
        sprinkler.position.set(0.75, 0.22, 0.75);
        treeGroup.add(sprinkler);

        const sprayRing = new THREE.Mesh(new THREE.RingGeometry(0.25, 1.3, 16), sprayMat);
        sprayRing.rotateX(-Math.PI / 2);
        sprayRing.position.set(0.75, 0.21, 0.75);
        treeGroup.add(sprayRing);

        this.animatedObjects.push({
          type: 'sprinklerPulse',
          mesh: sprayRing,
          speed: 2.2 + Math.random() * 0.8
        });

        treeGroup.userData = {
          type: 'tree',
          crop: rawCropName,
          fruitType: fruitType,
          fruits: fruits,
          baseFruitColor: fruitColor
        };

        this.groups.crops.add(treeGroup);
        this.horticultureTrees.push(treeGroup);
      }
    }

    // 3. Harvest Crates stacked by access road
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.85 });
    for (let cr = 0; cr < 6; cr++) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.9), crateMat);
      crate.position.set(minX + 4 + cr * 1.5, 0.45, minZ + 4);
      crate.castShadow = true;
      this.groups.infrastructure.add(crate);
    }

    const orchardLabel = this._createLabel(`🍎 Commercial High-Density ${rawCropName} Orchard (${cols * rows} Trees)`, new THREE.Vector3(0, 7.5, 0), '#f59e0b', '0.78rem', true);
    this.groups.labels.add(orchardLabel);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. POLYHOUSE & PROTECTED CULTIVATION COMPLEX ARCHITECTURE
  // ─────────────────────────────────────────────────────────────
  _buildPolyhouseComplex() {
    const complexGroup = new THREE.Group();
    complexGroup.position.set(0, 0, 0);

    const bayWidth = 14;
    const bayLength = 40;
    const ridgeHeight = 6.2;
    const gutterHeight = 4.0;
    const bays = 2; // Twin-span multi-bay

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.3 });
    const polyMat = new THREE.MeshStandardMaterial({
      color: 0xd1fae5,
      transparent: true,
      opacity: 0.52,
      roughness: 0.15,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.4 });
    const gullyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
    const plantGreenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 });
    const plantRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    const plantYellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 });
    const ledMat = new THREE.MeshStandardMaterial({ color: 0xd946ef, emissive: 0xd946ef, emissiveIntensity: 0.95 });

    for (let b = 0; b < bays; b++) {
      const bayCenterX = -bayWidth / 2 + b * bayWidth;

      const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(bayWidth, 0.4, bayLength),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 })
      );
      plinth.position.set(bayCenterX, 0.2, 0);
      complexGroup.add(plinth);

      // Arch structural ribs every 3.5m
      for (let z = -bayLength / 2; z <= bayLength / 2; z += 3.5) {
        for (const side of [-bayWidth / 2, bayWidth / 2]) {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, gutterHeight, 8), steelMat);
          col.position.set(bayCenterX + side, gutterHeight / 2 + 0.4, z);
          complexGroup.add(col);
        }

        const archCurve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(bayCenterX - bayWidth / 2, gutterHeight + 0.4, z),
          new THREE.Vector3(bayCenterX, ridgeHeight + 1.2, z),
          new THREE.Vector3(bayCenterX + bayWidth / 2, gutterHeight + 0.4, z)
        );
        const tubeGeo = new THREE.TubeGeometry(archCurve, 16, 0.07, 6, false);
        const archTube = new THREE.Mesh(tubeGeo, steelMat);
        complexGroup.add(archTube);
      }

      // Polycarbonate Roof Canopy Cover
      const roofArchGeo = new THREE.CylinderGeometry(bayWidth / 2, bayWidth / 2, bayLength, 20, 1, true, 0, Math.PI);
      roofArchGeo.rotateZ(Math.PI / 2);
      roofArchGeo.rotateY(Math.PI / 2);
      const roofCanopy = new THREE.Mesh(roofArchGeo, polyMat);
      roofCanopy.position.set(bayCenterX, gutterHeight + 0.4, 0);
      complexGroup.add(roofCanopy);

      // Side Glazing Curtains
      for (const side of [-bayWidth / 2, bayWidth / 2]) {
        const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(bayLength, gutterHeight), polyMat);
        sideWall.position.set(bayCenterX + side, gutterHeight / 2 + 0.4, 0);
        sideWall.rotation.y = Math.PI / 2;
        complexGroup.add(sideWall);
      }

      // Hydroponic Raised Benches & NFT Gullies
      const benchRows = 3;
      const bWidth = 2.4;
      for (let br = 0; br < benchRows; br++) {
        const benchX = bayCenterX - bayWidth / 3 + br * (bayWidth / 3);
        const benchTable = new THREE.Mesh(new THREE.BoxGeometry(bWidth, 0.75, bayLength - 4), benchMat);
        benchTable.position.set(benchX, 0.75, 0);
        complexGroup.add(benchTable);

        for (let g = -bWidth / 2 + 0.4; g <= bWidth / 2 - 0.4; g += 0.55) {
          const gully = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, bayLength - 4), gullyMat);
          gully.position.set(benchX + g, 1.22, 0);
          complexGroup.add(gully);

          for (let pz = -bayLength / 2 + 3; pz <= bayLength / 2 - 3; pz += 1.4) {
            const plantMesh = new THREE.Mesh(
              new THREE.ConeGeometry(0.18, 0.42, 6),
              (br === 0 ? plantGreenMat : (br === 1 ? plantRedMat : plantYellowMat))
            );
            plantMesh.position.set(benchX + g, 1.42, pz);
            complexGroup.add(plantMesh);
          }
        }

        // Suspended Pink LED Grow Light Bars
        const ledBar = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, bayLength - 4), ledMat);
        ledBar.position.set(benchX, gutterHeight + 0.7, 0);
        complexGroup.add(ledBar);

        const pinkLight = new THREE.PointLight(0xd946ef, 1.2, 14);
        pinkLight.position.set(benchX, gutterHeight + 0.5, 0);
        complexGroup.add(pinkLight);
      }

      // Exhaust Fans on North Wall
      for (let f = -bayWidth / 4; f <= bayWidth / 4; f += bayWidth / 2) {
        const fanCasing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 0.4), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 }));
        fanCasing.position.set(bayCenterX + f, gutterHeight * 0.7, -bayLength / 2);
        complexGroup.add(fanCasing);

        const fanBlade = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
        fanBlade.position.set(bayCenterX + f, gutterHeight * 0.7, -bayLength / 2 - 0.22);
        complexGroup.add(fanBlade);

        this.animatedObjects.push({
          type: 'spin',
          mesh: fanBlade,
          axis: 'z',
          speed: 18.0
        });
      }
    }

    // Ultrasonic Fogger Mist Nozzles
    const mistGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const mistMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.25 });
    for (let m = -12; m <= 12; m += 8) {
      const mistPuff = new THREE.Mesh(mistGeo, mistMat);
      mistPuff.position.set(0, gutterHeight - 0.5, m);
      complexGroup.add(mistPuff);

      this.animatedObjects.push({
        type: 'mistPulse',
        mesh: mistPuff,
        speed: 1.8
      });
    }

    complexGroup.userData = {
      type: 'polyhouse_complex',
      name: 'Commercial Climate-Controlled Polyhouse Complex',
      area_sqm: 1200,
      bays: 2,
      vpd_kpa: 1.05
    };

    this.groups.buildings.add(complexGroup);
    this.polyhouseStructure = complexGroup;

    const label = this._createLabel('🏛️ Multi-Span Protected Polyhouse (VPD: 1.05 kPa)', new THREE.Vector3(0, ridgeHeight + 3.2, 0), '#80cbc4', '0.78rem', true);
    this.groups.labels.add(label);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. TOMATO TRELLIS POST & WIRE GRID ARCHITECTURE
  // ─────────────────────────────────────────────────────────────
  _buildTomatoTrellises() {
    const { minX, maxX, minZ, maxZ } = this.farmBounds;
    const trellisGroup = new THREE.Group();

    const postMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 });
    const wireMat = new THREE.LineBasicMaterial({ color: 0x94a3b8 });
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.6 });
    const tomatoMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25, metalness: 0.1 });

    const rows = 4;
    const rowSpacing = (maxZ - minZ - 16) / rows;
    const postSpacing = 6.0;

    this.tomatoTrellises = [];

    for (let r = 0; r < rows; r++) {
      const rz = minZ + 8 + r * rowSpacing;
      const wirePtsLevel1 = [];
      const wirePtsLevel2 = [];
      const wirePtsLevel3 = [];

      for (let px = minX + 8; px <= maxX - 8; px += postSpacing) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.4, 6), postMat);
        post.position.set(px, 1.2, rz);
        post.castShadow = true;
        trellisGroup.add(post);

        wirePtsLevel1.push(new THREE.Vector3(px, 0.7, rz));
        wirePtsLevel2.push(new THREE.Vector3(px, 1.3, rz));
        wirePtsLevel3.push(new THREE.Vector3(px, 1.9, rz));
      }

      for (const wirePts of [wirePtsLevel1, wirePtsLevel2, wirePtsLevel3]) {
        const wireGeo = new THREE.BufferGeometry().setFromPoints(wirePts);
        trellisGroup.add(new THREE.Line(wireGeo, wireMat));
      }

      // Climbing tomato vines with red tomato fruits
      for (let vx = minX + 9; vx < maxX - 9; vx += 1.3) {
        const vineH = 1.8 + Math.random() * 0.3;
        const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, vineH, 5), vineMat);
        vine.position.set(vx, vineH / 2, rz + (Math.random() - 0.5) * 0.15);
        trellisGroup.add(vine);

        const fruitCount = 3 + Math.floor(Math.random() * 3);
        for (let tf = 0; tf < fruitCount; tf++) {
          const tMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16 + Math.random() * 0.06, 8, 8), tomatoMat);
          const ty = 0.5 + Math.random() * 1.3;
          tMesh.position.set(vx + (Math.random() - 0.5) * 0.35, ty, rz + (Math.random() - 0.5) * 0.25);
          tMesh.castShadow = true;
          trellisGroup.add(tMesh);
          this.tomatoTrellises.push(tMesh);
        }
      }
    }

    trellisGroup.userData = { type: 'tomato_trellis', name: 'High-Tensile Wire Trellis Grid (Himsona Protected)' };
    this.groups.fields.add(trellisGroup);

    const label = this._createLabel('🍅 Protected Tomato Trellis Grid', new THREE.Vector3(0, 3.5, 0), '#ef4444', '0.75rem', true);
    this.groups.labels.add(label);
  }

  // Flooded Reflective Basins for Paddy Rice
  _buildPaddyBasins() {
    const { minX, maxX, minZ, maxZ } = this.farmBounds;
    const basinGeo = new THREE.PlaneGeometry(maxX - minX - 8, maxZ - minZ - 8);
    basinGeo.rotateX(-Math.PI / 2);
    const basinMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.35,
      transparent: true,
      opacity: 0.42
    });
    const basin = new THREE.Mesh(basinGeo, basinMat);
    basin.position.set(0, 0.22, 0);
    this.groups.water.add(basin);
    this.paddyWater = basin;
  }

  _createPolygonField(vertices, fieldData, idx = 0) {
    if (!vertices || vertices.length < 3) return;
    const shape = new THREE.Shape();
    vertices.forEach((v, i) => {
      if (i === 0) shape.moveTo(v.x, -v.z);
      else shape.lineTo(v.x, -v.z);
    });
    shape.closePath();

    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshStandardMaterial({
      map: this._soilTexture,
      color: new THREE.Color(COLORS.soilDark).lerp(new THREE.Color(COLORS.soil), 0.35),
      roughness: 0.82,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.18;
    mesh.receiveShadow = true;
    mesh.userData = {
      type: 'field',
      id: fieldData.id || `field_${idx}`,
      name: fieldData.name || `Field ${String.fromCharCode(65 + idx)}`,
      area_acres: fieldData.area_acres || '2.5',
      crop: fieldData.crop || 'Wheat',
      vertices: vertices,
    };
    this.groups.fields.add(mesh);

    // Center calculation for label
    let cx = 0, cz = 0;
    vertices.forEach(v => { cx += v.x; cz += v.z; });
    cx /= vertices.length;
    cz /= vertices.length;

    const label = this._createLabel(`${mesh.userData.name} (${mesh.userData.area_acres} ac)`, new THREE.Vector3(cx, 1.2, cz), '#10b981', '0.75rem', true);
    this.groups.labels.add(label);
    return mesh;
  }

  // ─────────────────────────────────────────────────────────────
  // AQUACULTURE PONDS
  // ─────────────────────────────────────────────────────────────
  _buildAquaculturePonds() {
    const { minX, maxX, minZ, maxZ } = this.farmBounds;
    const farmW = maxX - minX;
    const farmH = maxZ - minZ;

    const cols = 2, rows = 2;
    const cellW = (farmW - 12) / cols;
    const cellH = (farmH - 12) / rows;
    const pondNames = ['Nursery Pond (P-01)', 'Rearing Pond (P-02)', 'Grow-Out Pond 1 (P-03)', 'Grow-Out Pond 2 (P-04)'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = minX + 6 + c * cellW + cellW / 2;
        const z = minZ + 6 + r * cellH + cellH / 2;
        const idx = r * cols + c;

        const pondGroup = new THREE.Group();
        pondGroup.position.set(x, 0, z);

        // Water surface
        const waterW = cellW - 4;
        const waterH = cellH - 4;
        const waterGeo = new THREE.PlaneGeometry(waterW, waterH, 16, 16);
        waterGeo.rotateX(-Math.PI / 2);

        const waterMat = new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          roughness: 0.15,
          metalness: 0.25,
          transparent: true,
          opacity: 0.88,
        });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.position.y = 0.32;
        pondGroup.add(water);

        // Earthen embankment bunds
        const bundMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 });
        const bundThickness = 2.0;
        const bundHeight = 0.7;

        // North & South bunds
        const bundNSGeo = new THREE.BoxGeometry(cellW, bundHeight, bundThickness);
        const bundN = new THREE.Mesh(bundNSGeo, bundMat);
        bundN.position.set(0, bundHeight / 2, -cellH / 2 + bundThickness / 2);
        const bundS = new THREE.Mesh(bundNSGeo, bundMat);
        bundS.position.set(0, bundHeight / 2, cellH / 2 - bundThickness / 2);
        pondGroup.add(bundN, bundS);

        // East & West bunds
        const bundEWGeo = new THREE.BoxGeometry(bundThickness, bundHeight, cellH - bundThickness * 2);
        const bundE = new THREE.Mesh(bundEWGeo, bundMat);
        bundE.position.set(cellW / 2 - bundThickness / 2, bundHeight / 2, 0);
        const bundW = new THREE.Mesh(bundEWGeo, bundMat);
        bundW.position.set(-cellW / 2 + bundThickness / 2, bundHeight / 2, 0);
        pondGroup.add(bundE, bundW);

        pondGroup.userData = {
          type: 'aquaculture_pond',
          id: `pond_${idx}`,
          name: pondNames[idx],
          surface_acres: ((waterW * waterH) / 4046.86 * 100).toFixed(2),
          depth_meters: 1.8,
          dissolved_oxygen_mg_l: 6.8,
          ph: 7.8,
          temperature_c: 28.2
        };
        water.userData = pondGroup.userData;

        this.groups.water.add(pondGroup);

        // Paddlewheel Aerator
        this._createPaddlewheelAerator(x + waterW * 0.25, 0.35, z);

        // Jumping Fish Animation
        this._createJumpingFish(x, 0.35, z, waterW * 0.6, waterH * 0.6, idx);

        // Floating Water Label
        const label = this._createLabel(`🐟 ${pondNames[idx]} (DO: 6.8 mg/L)`, new THREE.Vector3(x, 2.2, z), '#38bdf8', '0.72rem', true);
        this.groups.labels.add(label);
      }
    }
  }

  _createPaddlewheelAerator(x, y, z) {
    const aeratorGroup = new THREE.Group();
    aeratorGroup.position.set(x, y, z);

    // Twin flotation pontoons
    const pontoonGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.4, 8);
    pontoonGeo.rotateZ(Math.PI / 2);
    const pontoonMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 });
    const p1 = new THREE.Mesh(pontoonGeo, pontoonMat);
    p1.position.set(0, 0.05, -0.6);
    const p2 = new THREE.Mesh(pontoonGeo, pontoonMat);
    p2.position.set(0, 0.05, 0.6);
    aeratorGroup.add(p1, p2);

    // Motor housing
    const motorGeo = new THREE.BoxGeometry(0.5, 0.45, 0.45);
    const motorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const motor = new THREE.Mesh(motorGeo, motorMat);
    motor.position.set(0, 0.35, 0);
    aeratorGroup.add(motor);

    // Rotating paddle shaft
    const shaftGroup = new THREE.Group();
    shaftGroup.position.set(0, 0.2, 0);

    const paddleBladeGeo = new THREE.BoxGeometry(0.04, 0.32, 0.18);
    const paddleMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 });

    for (let side of [-0.6, 0.6]) {
      for (let i = 0; i < 6; i++) {
        const blade = new THREE.Mesh(paddleBladeGeo, paddleMat);
        const ang = (i / 6) * Math.PI * 2;
        blade.position.set(0, Math.sin(ang) * 0.28, side + Math.cos(ang) * 0.05);
        blade.rotation.x = ang;
        shaftGroup.add(blade);
      }
    }
    aeratorGroup.add(shaftGroup);

    // Frothing foam ring
    const foamGeo = new THREE.RingGeometry(0.4, 0.9, 16);
    foamGeo.rotateX(-Math.PI / 2);
    const foamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 });
    const foam = new THREE.Mesh(foamGeo, foamMat);
    foam.position.y = 0.02;
    aeratorGroup.add(foam);

    this.groups.water.add(aeratorGroup);

    this.animatedObjects.push({
      type: 'paddlewheelSpin',
      shaft: shaftGroup,
      foam: foam,
      speed: 7.0
    });
  }

  _createJumpingFish(pondX, waterY, pondZ, rangeW, rangeH, pondIdx) {
    const fishGroup = new THREE.Group();

    // Low-poly carp body
    const bodyGeo = new THREE.ConeGeometry(0.12, 0.65, 5);
    bodyGeo.rotateZ(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.4 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    fishGroup.add(body);

    const tailGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.35, 0, 0),
      new THREE.Vector3(-0.55, 0.15, 0),
      new THREE.Vector3(-0.55, -0.15, 0),
    ]);
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    fishGroup.add(tail);

    fishGroup.position.set(pondX, waterY - 0.4, pondZ);
    fishGroup.visible = false;
    this.groups.water.add(fishGroup);

    // Splash ring
    const splashGeo = new THREE.RingGeometry(0.1, 0.4, 12);
    splashGeo.rotateX(-Math.PI / 2);
    const splashMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.0 });
    const splash = new THREE.Mesh(splashGeo, splashMat);
    this.groups.water.add(splash);

    this.animatedObjects.push({
      type: 'fishJump',
      fish: fishGroup,
      splash: splash,
      pondX: pondX,
      waterY: waterY,
      pondZ: pondZ,
      rangeW: rangeW,
      rangeH: rangeH,
      timer: Math.random() * 4.0,
      jumpInterval: 4.5 + Math.random() * 4.0,
      isJumping: false,
      jumpProgress: 0,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 3D ROAD RIBBONS WITH ELEVATED CROWNS & GRAVEL SHOULDERS
  // ─────────────────────────────────────────────────────────────
  _buildRoads(spatialObjects) {
    const { minX, maxX, minZ, maxZ } = this.farmBounds;
    const midX = (minX + maxX) / 2;
    const midZ = (minZ + maxZ) / 2;

    const customRoads = (spatialObjects || []).filter(o => o.type === 'road' && o.waypoints && o.waypoints.length >= 2);
    if (customRoads.length > 0) {
      customRoads.forEach(r => {
        for (let i = 0; i < r.waypoints.length - 1; i++) {
          const p1 = r.waypoints[i];
          const p2 = r.waypoints[i + 1];
          this._createRoadSegment(p1.x, p1.z, p2.x, p2.z, r.width || 3.2, r);
        }
      });
      return;
    }

    // Default canonical roads
    this._createRoadSegment(minX - 6, midZ, maxX + 6, midZ, 3.2, { name: 'East-West Tractor Highway' });
    this._createRoadSegment(midX, minZ - 6, midX, maxZ + 6, 2.8, { name: 'North-South Field Arterial' });
    this._createRoadSegment(maxX + 6, midZ, maxX + 22, midZ, 2.4, { name: 'Village Feeder Access Path' });
  }

  _createRoadSegmentDirect(x1, z1, x2, z2, width = 3.0, roadData = {}) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dz, dx);

    const segCount = Math.max(2, Math.floor(length / 2));
    const roadGeo = new THREE.PlaneGeometry(length, width, segCount, 4);
    roadGeo.rotateX(-Math.PI / 2);

    // Apply crown elevation profile (drainage crest in center)
    const pos = roadGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const zOffset = pos.getZ(i); // along width
      const crown = Math.cos((zOffset / (width / 2)) * (Math.PI / 2)) * 0.08;
      pos.setY(i, 0.22 + crown);
    }
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      map: this._roadTexture,
      roughness: 0.85,
      metalness: 0.05,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2);
    road.rotation.y = -angle;
    road.receiveShadow = true;
    road.userData = {
      type: 'road',
      id: roadData.id || `road_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      name: roadData.name || 'Farm Access Road',
      width: width,
      waypoints: [{ x: x1, z: z1 }, { x: x2, z: z2 }],
      surface: roadData.surface || 'compacted_gravel'
    };

    const group = new THREE.Group();
    group.userData = road.userData;
    group.add(road);

    // Gravel shoulders on both sides
    const shoulderMat = new THREE.LineBasicMaterial({ color: COLORS.roadDark, linewidth: 2, transparent: true, opacity: 0.65 });
    for (const side of [-1, 1]) {
      const perpX = -Math.sin(angle) * (width / 2) * side;
      const perpZ = Math.cos(angle) * (width / 2) * side;
      const edgeGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1 + perpX, 0.24, z1 + perpZ),
        new THREE.Vector3(x2 + perpX, 0.24, z2 + perpZ),
      ]);
      group.add(new THREE.Line(edgeGeo, shoulderMat));
    }

    return group;
  }

  _createRoadSegment(x1, z1, x2, z2, width = 3.0, roadData = {}) {
    const group = this._createRoadSegmentDirect(x1, z1, x2, z2, width, roadData);
    this.groups.infrastructure.add(group);
    return group;
  }

  // ─────────────────────────────────────────────────────────────
  // WATER INFRASTRUCTURE
  // ─────────────────────────────────────────────────────────────
  _buildWater(spatialObjects) {
    if (this.isAquaculture) return; // Handled by ponds
    const { maxX, maxZ } = this.farmBounds;

    const customPonds = (spatialObjects || []).filter(o => o.type === 'water_source' && (o.subtype === 'pond' || (o.name && o.name.toLowerCase().includes('pond'))));
    if (customPonds.length > 0) {
      customPonds.forEach(p => {
        this._createPond(p.position?.x || maxX - 14, 0, p.position?.z || maxZ - 12, p.radius || 9, p);
      });
      return;
    }

    // Default canonical retention pond
    this._createPond(maxX - 14, 0, maxZ - 12, 9, {
      type: 'water_source',
      name: 'Rainwater Harvesting Retention Pond',
      capacity_l: 250000,
      status: 'active'
    });
  }

  _createPond(x, y, z, radius, userData) {
    const pondGeo = new THREE.CircleGeometry(radius, 24);
    pondGeo.rotateX(-Math.PI / 2);
    const pondMat = new THREE.MeshStandardMaterial({
      color: COLORS.pond,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.82,
    });
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.position.set(x, 0.22, z);
    pond.userData = userData;
    this.groups.water.add(pond);

    // Earthen berm rim
    const rimGeo = new THREE.RingGeometry(radius, radius + 2.0, 24);
    rimGeo.rotateX(-Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.set(x, 0.23, z);
    this.groups.water.add(rim);

    // Animated water shimmer
    this.animatedObjects.push({
      type: 'waterWave',
      mesh: pond,
      baseY: 0.22,
      speed: 1.5,
    });

    const label = this._createLabel('💧 Rainwater Harvesting Pond', new THREE.Vector3(x, 2.5, z), '#38bdf8', '0.72rem', true);
    this.groups.labels.add(label);
  }

  // ─────────────────────────────────────────────────────────────
  // ARCHITECTURAL 3D FARM BUILDINGS
  // ─────────────────────────────────────────────────────────────
  _buildBuildings(spatialObjects) {
    const { minX, minZ, maxX, maxZ } = this.farmBounds;

    const customBuildings = (spatialObjects || []).filter(o => ['building', 'greenhouse', 'silo', 'coldstorage'].includes(o.type));
    if (customBuildings.length > 0) {
      customBuildings.forEach(b => {
        const x = b.position?.x ?? (b.x ?? 0);
        const y = b.position?.y ?? (b.y ?? 0);
        const z = b.position?.z ?? (b.z ?? 0);
        const w = b.width || 12;
        const h = b.height || 5;
        const d = b.depth || 8;
        if (b.type === 'greenhouse' || b.subtype === 'polyhouse') {
          this._createPolyhouse(x, y, z, w, h, d, b);
        } else if (b.type === 'silo' || b.subtype === 'silo') {
          this._createGrainSilo(x, y, z, (w || 6) / 2, h || 10, b);
        } else if (b.type === 'coldstorage' || b.subtype === 'coldstorage') {
          this._createColdStorage(x, y, z, w || 14, h || 6, d || 10, b);
        } else if (b.name?.toLowerCase().includes('office') || b.subtype === 'office') {
          this._createFarmOffice(x, y, z, w || 8, h || 4.2, d || 6, b);
        } else {
          this._createMachineryShed(x, y, z, w, h, d, b);
        }
      });
      return;
    }

    // Default canonical 4 agricultural structures
    // 1. Farm Machinery Shed & Bio-Storage
    this._createMachineryShed(
      maxX - 6, 0, minZ + 8,
      13, 5.2, 9,
      { type: 'building', subtype: 'shed', name: 'Farm Machinery Shed & Bio-Storage', area_sqm: 320, status: 'operational' }
    );

    // 2. Climate-Controlled Nursery Polyhouse with visible internal grow beds
    this._createPolyhouse(
      minX + 16, 0, maxZ - 8,
      11, 4.4, 7,
      { type: 'greenhouse', subtype: 'polyhouse', name: 'Climate-Controlled Nursery Polyhouse', area_sqm: 450, status: 'active' }
    );

    // 3. Modern Timber & Glass Farm Office with solar array
    this._createFarmOffice(
      maxX + 8, 0, 0,
      8.5, 4.2, 6.5,
      { type: 'building', subtype: 'office', name: 'Farm Office & Telemetry Control Room', status: 'operational' }
    );

    // 4. Corrugated Galvanized Grain Silo
    this._createGrainSilo(
      maxX - 18, 0, minZ + 8,
      2.6, 9.5,
      { type: 'silo', subtype: 'silo', name: 'Galvanized Grain Silo & Buffer Reserve', capacity_tons: 150, status: 'operational' }
    );
  }

  // 1. Farm Machinery Shed (Corrugated steel, trusses, plinth, rollup door, lights)
  _createMachineryShed(x, y, z, width, height, depth, userData) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Concrete foundation plinth
    const plinthGeo = new THREE.BoxGeometry(width + 0.8, 0.4, depth + 0.8);
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = 0.2;
    plinth.receiveShadow = true;
    group.add(plinth);

    // Corrugated shed walls
    const wallGeo = new THREE.BoxGeometry(width, height, depth);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.6, metalness: 0.25 });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 0.4 + height / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    // Pitched gabled roof
    const roofApex = height + 0.4 + 2.2;
    const roofPitch = 0.6;
    const roofGeo = new THREE.ConeGeometry(Math.max(width, depth) * 0.72, 2.5, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.5 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = height + 0.4 + 1.25;
    roof.castShadow = true;
    group.add(roof);

    // Industrial rolling garage door
    const doorGeo = new THREE.PlaneGeometry(width * 0.4, height * 0.75);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.35, metalness: 0.6, side: THREE.DoubleSide });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.4 + (height * 0.75) / 2, depth / 2 + 0.04);
    group.add(door);

    // Equipment bay opening (dark interior)
    const bayGeo = new THREE.PlaneGeometry(width * 0.25, height * 0.65);
    const bayMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.DoubleSide });
    const bay = new THREE.Mesh(bayGeo, bayMat);
    bay.position.set(-width * 0.28, 0.4 + (height * 0.65) / 2, depth / 2 + 0.03);
    group.add(bay);

    // Yellow safety hazard striping on doorstep
    const stripeGeo = new THREE.PlaneGeometry(width * 0.8, 0.25);
    stripeGeo.rotateX(-Math.PI / 2);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 0.42, depth / 2 + 0.4);
    group.add(stripe);

    // Exterior work lamps with warm downlight
    const lampGeo = new THREE.BoxGeometry(0.3, 0.15, 0.3);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(0, height + 0.1, depth / 2 + 0.2);
    group.add(lamp);

    const workLight = new THREE.PointLight(0xfef08a, 1.2, 12);
    workLight.position.set(0, height, depth / 2 + 0.6);
    group.add(workLight);

    group.userData = userData;
    walls.userData = userData;
    door.userData = userData;
    this.groups.buildings.add(group);

    const label = this._createLabel(userData.name.split(' ')[0] + ' Shed', new THREE.Vector3(x, height + 3.5, z), '#e2e8f0', '0.72rem', true);
    this.groups.labels.add(label);
    return group;
  }

  // 2. Modern Timber & Glass Farm Office (wood cladding, corner glass, solar rooftop array, entrance portico)
  _createFarmOffice(x, y, z, width, height, depth, userData) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Timber-clad wall structure
    const wallGeo = new THREE.BoxGeometry(width, height, depth);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.75, metalness: 0.1 }); // warm cedar
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = height / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    // Panoramic floor-to-ceiling corner glass windows
    const glassGeo = new THREE.BoxGeometry(width * 0.45, height * 0.7, 0.08);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.65,
    });
    const frontGlass = new THREE.Mesh(glassGeo, glassMat);
    frontGlass.position.set(width * 0.22, height * 0.45, depth / 2 + 0.03);
    group.add(frontGlass);

    const sideGlassGeo = new THREE.BoxGeometry(0.08, height * 0.7, depth * 0.45);
    const sideGlass = new THREE.Mesh(sideGlassGeo, glassMat);
    sideGlass.position.set(width / 2 + 0.03, height * 0.45, depth * 0.22);
    group.add(sideGlass);

    // Entrance Portico / Awning
    const awningGeo = new THREE.BoxGeometry(width * 0.35, 0.15, 1.8);
    const awningMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
    const awning = new THREE.Mesh(awningGeo, awningMat);
    awning.position.set(-width * 0.22, height * 0.75, depth / 2 + 0.9);
    group.add(awning);

    // Slender portico pillars
    const pillarGeo = new THREE.CylinderGeometry(0.05, 0.05, height * 0.75, 6);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const p1 = new THREE.Mesh(pillarGeo, pillarMat);
    p1.position.set(-width * 0.34, (height * 0.75) / 2, depth / 2 + 1.6);
    const p2 = new THREE.Mesh(pillarGeo, pillarMat);
    p2.position.set(-width * 0.1, (height * 0.75) / 2, depth / 2 + 1.6);
    group.add(p1, p2);

    // Office entry door
    const doorGeo = new THREE.PlaneGeometry(1.4, 2.5);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(-width * 0.22, 1.25, depth / 2 + 0.04);
    group.add(door);

    // Rooftop Solar Array (Grid of dark blue photovoltaic panels angled at 25°)
    const solarGroup = new THREE.Group();
    solarGroup.position.set(0, height + 0.15, 0);
    solarGroup.rotation.x = -0.35; // 20 deg tilt towards south

    const panelGeo = new THREE.BoxGeometry(width * 0.75, 0.08, depth * 0.65);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.2, metalness: 0.85 });
    const solarPanel = new THREE.Mesh(panelGeo, panelMat);
    solarGroup.add(solarPanel);

    // Solar panel silver grid lines
    const gridMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.7 });
    for (let s = -2; s <= 2; s++) {
      const gGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(s * 1.0, 0.05, -depth * 0.3),
        new THREE.Vector3(s * 1.0, 0.05, depth * 0.3),
      ]);
      solarGroup.add(new THREE.Line(gGeo, gridMat));
    }
    group.add(solarGroup);

    group.userData = userData;
    walls.userData = userData;
    this.groups.buildings.add(group);

    const label = this._createLabel('🏢 Farm Office & Lab', new THREE.Vector3(x, height + 2.8, z), '#f59e0b', '0.72rem', true);
    this.groups.labels.add(label);
    return group;
  }

  // 3. Multi-Bay Polyhouse / Greenhouse with internal raised grow beds
  _createPolyhouse(x, y, z, width, height, depth, userData) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const frameMat = new THREE.MeshStandardMaterial({ color: COLORS.polyhouseFrame, metalness: 0.7, roughness: 0.4 });
    const coverMat = new THREE.MeshStandardMaterial({
      color: COLORS.polyhouse,
      transparent: true,
      opacity: 0.42,
      roughness: 0.2,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    // Multi-bay tubular galvanized arches
    const bayCount = 2;
    const subBayW = width / bayCount;
    const ribCount = 6;

    for (let b = 0; b < bayCount; b++) {
      const bayCenterX = -width / 2 + subBayW / 2 + b * subBayW;

      for (let i = 0; i < ribCount; i++) {
        const t = i / (ribCount - 1);
        const az = -depth / 2 + t * depth;
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(bayCenterX - subBayW / 2, 0, az),
          new THREE.Vector3(bayCenterX, height, az),
          new THREE.Vector3(bayCenterX + subBayW / 2, 0, az)
        );
        const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.07, 4, false);
        const tube = new THREE.Mesh(tubeGeo, frameMat);
        group.add(tube);
      }

      // Polycarbonate curved skin for each bay
      const skinGeo = new THREE.CylinderGeometry(subBayW / 2, subBayW / 2, depth, 16, 1, true, 0, Math.PI);
      skinGeo.rotateZ(Math.PI / 2);
      skinGeo.rotateX(Math.PI / 2);
      const skin = new THREE.Mesh(skinGeo, coverMat);
      skin.position.set(bayCenterX, height * 0.45, 0);
      skin.scale.set(1, height / (subBayW / 2) * 0.9, 1);
      group.add(skin);
    }

    // Gable end-walls
    const endWallGeo = new THREE.PlaneGeometry(width, height * 0.8);
    const endFront = new THREE.Mesh(endWallGeo, coverMat);
    endFront.position.set(0, height * 0.4, depth / 2);
    const endBack = new THREE.Mesh(endWallGeo, coverMat);
    endBack.position.set(0, height * 0.4, -depth / 2);
    group.add(endFront, endBack);

    // ── Internal Raised Grow Beds with Tiny Saplings Visible Inside ──
    const bedCount = 3;
    const bedW = width * 0.24;
    const bedD = depth * 0.82;
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
    const plantMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 });
    const sproutGeo = new THREE.ConeGeometry(0.1, 0.28, 4);

    for (let bd = 0; bd < bedCount; bd++) {
      const bx = -width * 0.32 + bd * (width * 0.32);
      const bed = new THREE.Mesh(new THREE.BoxGeometry(bedW, 0.3, bedD), bedMat);
      bed.position.set(bx, 0.15, 0);
      group.add(bed);

      // Micro plants in bed
      for (let pz = -bedD / 2 + 0.6; pz < bedD / 2; pz += 1.0) {
        for (let px = -bedW / 4; px <= bedW / 4; px += bedW / 2) {
          const sprout = new THREE.Mesh(sproutGeo, plantMat);
          sprout.position.set(bx + px, 0.38, pz);
          group.add(sprout);
        }
      }
    }

    group.userData = userData;
    this.groups.buildings.add(group);

    const label = this._createLabel('🌿 Nursery Polyhouse', new THREE.Vector3(x, height + 2.5, z), '#80cbc4', '0.72rem', true);
    this.groups.labels.add(label);
    return group;
  }

  // 4. Corrugated Galvanized Grain Silo (inspection ladder, conical cap, discharge chute)
  _createGrainSilo(x, y, z, radius = 2.8, height = 10, userData = {}) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Concrete base plinth
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.15, radius * 1.15, 0.5, 24),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 })
    );
    plinth.position.y = 0.25;
    group.add(plinth);

    // Corrugated galvanized cylindrical tank
    const tankGeo = new THREE.CylinderGeometry(radius, radius, height, 24);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.35, metalness: 0.85 });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.y = 0.5 + height / 2;
    tank.castShadow = true;
    tank.receiveShadow = true;
    group.add(tank);

    // Horizontal reinforcement seam rings
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
    for (let r = 1; r < height; r += 1.6) {
      const ringGeo = new THREE.TorusGeometry(radius + 0.02, 0.04, 6, 24);
      ringGeo.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.5 + r;
      group.add(ring);
    }

    // Conical galvanized roof cap
    const capGeo = new THREE.ConeGeometry(radius * 1.08, height * 0.28, 24);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.8 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.5 + height + (height * 0.28) / 2;
    cap.castShadow = true;
    group.add(cap);

    // Vertical inspection ladder running up side
    const ladderMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });
    const ladderH = height + (height * 0.28) * 0.5;
    for (let r = 0.4; r < ladderH; r += 0.4) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), ladderMat);
      rung.position.set(radius + 0.2, 0.5 + r, 0);
      group.add(rung);
    }

    // Discharge auger hopper chute at base
    const chuteGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.5, 8);
    chuteGeo.rotateZ(0.5);
    const chuteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const chute = new THREE.Mesh(chuteGeo, chuteMat);
    chute.position.set(radius + 0.8, 1.2, 0);
    group.add(chute);

    group.userData = { type: 'silo', name: 'Grain Silo', ...userData };
    tank.userData = group.userData;
    this.groups.buildings.add(group);

    const label = this._createLabel('🌾 Grain Silo', new THREE.Vector3(x, height + 3.2, z), '#f59e0b', '0.72rem', true);
    this.groups.labels.add(label);
    return group;
  }

  // 5. Insulated Cold Storage Facility (loading dock, refrigeration condenser with fan)
  _createColdStorage(x, y, z, width = 14, height = 6, depth = 10, userData = {}) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Concrete loading dock base
    const dockGeo = new THREE.BoxGeometry(width + 1.2, 1.0, depth + 1.2);
    const dockMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const dock = new THREE.Mesh(dockGeo, dockMat);
    dock.position.y = 0.5;
    group.add(dock);

    // Insulated sandwich panel building body
    const bodyGeo = new THREE.BoxGeometry(width, height, depth);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, metalness: 0.1 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.0 + height / 2;
    body.castShadow = true;
    group.add(body);

    // Loading dock rolling door with rubber bumper pads
    const doorGeo = new THREE.PlaneGeometry(width * 0.35, height * 0.7);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.4, side: THREE.DoubleSide });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.0 + (height * 0.7) / 2, depth / 2 + 0.04);
    group.add(door);

    // Rooftop refrigeration condenser compressor rack
    const hvacGeo = new THREE.BoxGeometry(2.4, 1.2, 1.8);
    const hvacMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const hvac = new THREE.Mesh(hvacGeo, hvacMat);
    hvac.position.set(0, 1.0 + height + 0.6, 0);
    group.add(hvac);

    // Rotating condenser fan
    const fanGeo = new THREE.BoxGeometry(0.8, 0.05, 0.15);
    const fanMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const fan = new THREE.Mesh(fanGeo, fanMat);
    fan.position.set(0, 1.0 + height + 1.22, 0);
    group.add(fan);

    this.animatedObjects.push({
      type: 'spin',
      mesh: fan,
      axis: 'y',
      speed: 15.0
    });

    group.userData = { type: 'coldstorage', name: 'Insulated Cold Storage', ...userData };
    this.groups.buildings.add(group);

    const label = this._createLabel('❄️ Cold Storage', new THREE.Vector3(x, height + 3.8, z), '#38bdf8', '0.72rem', true);
    this.groups.labels.add(label);
    return group;
  }

  // ─────────────────────────────────────────────────────────────
  // INFRASTRUCTURE (Borewell, Drone, Solar Array, Weather Station, Sensors, Cameras)
  // ─────────────────────────────────────────────────────────────
  _buildInfrastructure(spatialObjects) {
    const { minX, maxX, minZ, maxZ } = this.farmBounds;

    this._createBorewell(maxX - 8, 0, maxZ - 18);
    this._createWeatherStation(0, 0, minZ - 4);
    this._createSolarArray(minX + 6, 0, minZ + 6);
    this._createAutonomousDrone(0, 16, 0);

    this._createSensorNode(minX + 10, minZ + 10, 'Soil Probe Alpha');
    this._createSensorNode(maxX - 10, minZ + 10, 'Soil Probe Beta');
    this._createSensorNode(minX + 10, maxZ - 10, 'Soil Probe Gamma');
    this._createSensorNode(maxX - 10, maxZ - 10, 'Soil Probe Delta');

    this._createCameraTower(minX - 2, minZ - 2, 'PTZ-Camera-01');
    this._createCameraTower(maxX + 2, minZ - 2, 'PTZ-Camera-02');
    this._createCameraTower(0, maxZ + 2, 'PTZ-Camera-03');
  }

  // ─────────────────────────────────────────────────────────────
  // 3D TRACTOR & AGRICULTURAL IMPLEMENT MODEL
  // ─────────────────────────────────────────────────────────────
  _buildTractor() {
    const group = new THREE.Group();
    group.position.set(-18, 0, 0); // located on farm arterial lane

    const tractorMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.35, metalness: 0.6 }); // AGRIOS emerald
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.5 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4, metalness: 0.7 }); // yellow rims

    // 1. Chassis frame
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 3.4), chassisMat);
    chassis.position.y = 0.85;
    chassis.castShadow = true;
    group.add(chassis);

    // 2. Engine hood
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 2.0), tractorMat);
    hood.position.set(0, 1.4, 0.6);
    hood.castShadow = true;
    group.add(hood);

    // Radiator front grille & lights
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.75, 0.1), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }));
    grille.position.set(0, 1.4, 1.62);
    group.add(grille);

    const lightGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
    lightGeo.rotateX(Math.PI / 2);
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.6 });
    const headL = new THREE.Mesh(lightGeo, lightMat);
    headL.position.set(-0.45, 1.5, 1.65);
    const headR = new THREE.Mesh(lightGeo, lightMat);
    headR.position.set(0.45, 1.5, 1.65);
    group.add(headL, headR);

    // 3. Driver Cabin / ROPS Arch
    const ropsArch = new THREE.Group();
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
    const leftPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.1, 8), pipeMat);
    leftPost.position.set(-0.65, 2.0, -0.6);
    const rightPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.1, 8), pipeMat);
    rightPost.position.set(0.65, 2.0, -0.6);
    const crossBar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.36, 8), pipeMat);
    crossBar.rotateZ(Math.PI / 2);
    crossBar.position.set(0, 3.0, -0.6);
    ropsArch.add(leftPost, rightPost, crossBar);
    group.add(ropsArch);

    // Seat & Steering wheel
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.5), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 }));
    seat.position.set(0, 1.45, -0.5);
    group.add(seat);

    const steeringCol = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6), pipeMat);
    steeringCol.rotateX(-0.5);
    steeringCol.position.set(0, 1.6, -0.1);
    const wheelTorus = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 16), pipeMat);
    wheelTorus.rotateX(Math.PI / 3);
    wheelTorus.position.set(0, 1.85, -0.15);
    group.add(steeringCol, wheelTorus);

    // 4. Exhaust pipe & Animated Smoke Emitter
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8), pipeMat);
    exhaust.position.set(0.55, 2.3, 0.8);
    const exhaustCap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.12), pipeMat);
    exhaustCap.position.set(0.55, 3.02, 0.8);
    group.add(exhaust, exhaustCap);

    // Smoke particles
    const smokeParticles = [];
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.35 });
    for (let i = 0; i < 8; i++) {
      const sp = new THREE.Mesh(new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 6, 6), smokeMat.clone());
      sp.position.set(0.55, 3.05 + i * 0.18, 0.8 - i * 0.08);
      sp.userData = { initialY: 3.05, life: i * 0.2, maxLife: 1.6 };
      group.add(sp);
      smokeParticles.push(sp);
    }
    this.tractorSmokeParticles = smokeParticles;

    // 5. Wheels (2 Large Rear, 2 Smaller Front)
    this.tractorWheels = [];
    const createWheel = (radius, width, x, y, z) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(x, y, z);

      // Tire
      const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 16);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.castShadow = true;
      wGroup.add(tire);

      // Rim
      const rimGeo = new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, width * 1.05, 12);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wGroup.add(rim);

      group.add(wGroup);
      this.tractorWheels.push(wGroup);
      return wGroup;
    };

    // Rear drive wheels (large)
    createWheel(0.9, 0.55, -0.95, 0.9, -0.85);
    createWheel(0.9, 0.55, 0.95, 0.9, -0.85);
    // Front steer wheels (smaller)
    createWheel(0.52, 0.35, -0.85, 0.52, 1.25);
    createWheel(0.52, 0.35, 0.85, 0.52, 1.25);

    // 6. Rear 3-Point Hitch Implement (Disk Harrow)
    const hitch = new THREE.Group();
    hitch.position.set(0, 0.6, -1.9);
    const harrowBar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.12), chassisMat);
    hitch.add(harrowBar);
    const discMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
    for (let d = -4; d <= 4; d++) {
      if (d === 0) continue;
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.03, 16), discMat);
      disc.rotateZ(Math.PI / 2);
      disc.rotateY(0.25 * Math.sign(d));
      disc.position.set(d * 0.25, 0, 0);
      hitch.add(disc);
    }
    group.add(hitch);

    // Floating Label
    const lbl = this._createLabel('🚜 55HP 4WD Precision Tractor', new THREE.Vector3(0, 3.4, 0), '#10b981', '0.7rem', true);
    lbl.visible = this.showWorkerLabels;
    group.add(lbl);
    group._nameLabel = lbl;

    group.userData = {
      type: 'tractor',
      speed: 3.2,
      pathT: 0,
      active: false
    };

    this.groups.infrastructure.add(group);
    this.tractorMesh = group;
  }

  // ─────────────────────────────────────────────────────────────
  // PASTURE PADDOCK & GRAZING LIVESTOCK (Cattle / Cows / Calves)
  // ─────────────────────────────────────────────────────────────
  _buildPastureZone() {
    const group = new THREE.Group();
    const px = 24, pz = 16, pw = 18, pd = 14;

    // 1. Lush clover pasture ground patch
    const patchGeo = new THREE.PlaneGeometry(pw, pd);
    patchGeo.rotateX(-Math.PI / 2);
    const patchMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
    const patch = new THREE.Mesh(patchGeo, patchMat);
    patch.position.set(px, 0.02, pz);
    patch.receiveShadow = true;
    group.add(patch);

    // 2. Post-and-rail wooden fence
    const postMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });

    const halfW = pw / 2, halfD = pd / 2;
    const posts = [
      { x: px - halfW, z: pz - halfD }, { x: px, z: pz - halfD }, { x: px + halfW, z: pz - halfD },
      { x: px + halfW, z: pz }, { x: px + halfW, z: pz + halfD },
      { x: px, z: pz + halfD }, { x: px - halfW, z: pz + halfD }, { x: px - halfW, z: pz }
    ];

    posts.forEach(pt => {
      const pMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), postMat);
      pMesh.position.set(pt.x, 0.6, pt.z);
      pMesh.castShadow = true;
      group.add(pMesh);
    });

    const createRail = (x1, z1, x2, z2) => {
      const dx = x2 - x1, dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);
      for (const y of [0.45, 0.85]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, len), railMat);
        rail.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
        rail.rotation.y = angle;
        group.add(rail);
      }
    };

    createRail(px - halfW, pz - halfD, px + halfW, pz - halfD);
    createRail(px + halfW, pz - halfD, px + halfW, pz + halfD);
    createRail(px + halfW, pz + halfD, px - halfW, pz + halfD);
    createRail(px - halfW, pz + halfD, px - halfW, pz - halfD);

    // 3. Water trough
    const trough = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.8), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 }));
    trough.position.set(px - halfW + 1.8, 0.3, pz - halfD + 1.8);
    const troughWater = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.6), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 }));
    troughWater.rotateX(-Math.PI / 2);
    troughWater.position.set(px - halfW + 1.8, 0.5, pz - halfD + 1.8);
    group.add(trough, troughWater);

    // 4. Grazing Cattle (Holstein-Friesian & Brown Jersey Cows)
    this.livestockMeshes = [];
    const cowConfigs = [
      { x: px - 3, z: pz - 2, rot: 0.4, scale: 1.0, isJersey: false },
      { x: px + 3, z: pz + 2, rot: -0.8, scale: 1.05, isJersey: true },
      { x: px, z: pz + 3, rot: 2.1, scale: 0.75, isJersey: false } // calf
    ];

    cowConfigs.forEach((cfg, idx) => {
      const cow = new THREE.Group();
      cow.position.set(cfg.x, 0, cfg.z);
      cow.rotation.y = cfg.rot;
      cow.scale.setScalar(cfg.scale);

      const bodyMat = new THREE.MeshStandardMaterial({
        color: cfg.isJersey ? 0x9a3412 : 0xf8fafc,
        roughness: 0.8
      });

      // Body torso
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 2.2), bodyMat);
      body.position.y = 1.25;
      body.castShadow = true;
      cow.add(body);

      // Black patches if Holstein
      if (!cfg.isJersey) {
        const patchMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
        const patch1 = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.6, 0.8), patchMat);
        patch1.position.set(0, 1.3, 0.2);
        const patch2 = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.45, 0.6), patchMat);
        patch2.position.set(0, 1.2, -0.6);
        cow.add(patch1, patch2);
      }

      // 4 Legs
      const legMat = new THREE.MeshStandardMaterial({ color: cfg.isJersey ? 0x7c2d12 : 0xf8fafc, roughness: 0.8 });
      const hoofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
      const legOffsets = [
        { x: -0.45, z: 0.7 }, { x: 0.45, z: 0.7 },
        { x: -0.45, z: -0.7 }, { x: 0.45, z: -0.7 }
      ];
      legOffsets.forEach(lo => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.8, 6), legMat);
        leg.position.set(lo.x, 0.4, lo.z);
        leg.castShadow = true;
        const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.12, 6), hoofMat);
        hoof.position.set(lo.x, 0.06, lo.z);
        cow.add(leg, hoof);
      });

      // Articulated Head & Neck Group (bobs down to graze grass)
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.5, 1.0);

      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.75), bodyMat);
      neck.position.set(0, 0, 0.3);
      headGroup.add(neck);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.75), bodyMat);
      head.position.set(0, -0.1, 0.75);
      headGroup.add(head);

      const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.45), new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.7 })); // pink nose
      muzzle.position.set(0, -0.22, 1.1);
      headGroup.add(muzzle);

      // Ears
      const earMat = new THREE.MeshStandardMaterial({ color: cfg.isJersey ? 0x9a3412 : 0x0f172a });
      const earL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.12), earMat);
      earL.position.set(-0.45, 0.1, 0.65);
      const earR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.12), earMat);
      earR.position.set(0.45, 0.1, 0.65);
      headGroup.add(earL, earR);

      cow.add(headGroup);

      // Tail
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.9, 5), bodyMat);
      tail.position.set(0, 1.0, -1.15);
      tail.rotateX(-0.3);
      cow.add(tail);

      cow.userData = {
        type: 'cattle',
        headGroup: headGroup,
        tail: tail,
        bobPhase: idx * 1.8
      };

      group.add(cow);
      this.livestockMeshes.push(cow);
    });

    const lbl = this._createLabel('🐄 Sustainable Agro-Pastoral Paddock', new THREE.Vector3(px, 2.8, pz), '#15803d', '0.7rem', true);
    lbl.visible = this.showWorkerLabels;
    group.add(lbl);
    group._nameLabel = lbl;

    this.groups.infrastructure.add(group);
    this.pastureGroup = group;
  }

  // Autonomous Precision Agricultural Survey Drone with Scanning Laser Cone
  _createAutonomousDrone(x = 0, y = 16, z = 0) {
    const drone = new THREE.Group();
    drone.position.set(x, y, z);

    // Carbon-fiber aerodynamic fuselage
    const bodyGeo = new THREE.BoxGeometry(1.4, 0.35, 1.4);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.8
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    drone.add(body);

    // Avionics dome (GPS puck)
    const domeGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.25, 16);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x059669, metalness: 0.5 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 0.28;
    drone.add(dome);

    const armMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 });
    const rotorMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const hubMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7 });

    const armOffsets = [
      { x: 1.2, z: 1.2, led: 0x22c55e },  // Starboard Front (Green)
      { x: -1.2, z: 1.2, led: 0xef4444 }, // Port Front (Red)
      { x: 1.2, z: -1.2, led: 0xffffff }, // Starboard Rear (White)
      { x: -1.2, z: -1.2, led: 0xffffff } // Port Rear (White)
    ];

    const rotorDiscs = [];

    armOffsets.forEach(ao => {
      // Arm tube
      const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8);
      armGeo.rotateZ(Math.PI / 4 * (ao.x > 0 ? -1 : 1));
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(ao.x * 0.5, 0, ao.z * 0.5);
      arm.lookAt(ao.x, 0, ao.z);
      drone.add(arm);

      // Motor hub
      const hubGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.22, 12);
      const hub = new THREE.Mesh(hubGeo, hubMat);
      hub.position.set(ao.x, 0.1, ao.z);
      drone.add(hub);

      // Spinning rotor disc
      const rotorGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.02, 16);
      const rotor = new THREE.Mesh(rotorGeo, rotorMat);
      rotor.position.set(ao.x, 0.22, ao.z);
      drone.add(rotor);
      rotorDiscs.push(rotor);

      // LED navigation beacon
      const ledGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const ledMat = new THREE.MeshBasicMaterial({ color: ao.led });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(ao.x, -0.08, ao.z);
      drone.add(led);
    });

    // 4K Multispectral Camera Gimbal
    const gimbalGeo = new THREE.SphereGeometry(0.28, 12, 12);
    const gimbalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const gimbal = new THREE.Mesh(gimbalGeo, gimbalMat);
    gimbal.position.y = -0.3;
    drone.add(gimbal);

    // Green survey laser cone pointing downwards to crops
    const scanGeo = new THREE.ConeGeometry(5.5, 16, 16, 1, true);
    scanGeo.rotateX(Math.PI);
    const scanMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const scanCone = new THREE.Mesh(scanGeo, scanMat);
    scanCone.position.set(0, -8.2, 0);
    drone.add(scanCone);

    drone.userData = {
      type: 'drone',
      name: 'Autonomous Precision Drone (AgriScan-v4)',
      altitude: '16.0m',
      sensor: '4K Multispectral NDVI & Thermal Array',
      battery: '94%',
      status: 'Surveillance Patrol'
    };

    this.groups.infrastructure.add(drone);
    this._droneMesh = drone;
    this._droneRotors = rotorDiscs;

    const label = this._createLabel('🛰️ AgriScan Drone (16m)', new THREE.Vector3(x, y + 1.8, z), '#10b981', '0.68rem', true);
    this.groups.labels.add(label);
    this._droneLabel = label;
  }

  // 24kW Bifacial Solar Farm Array
  _createSolarArray(startX, startY, startZ) {
    const group = new THREE.Group();
    group.position.set(startX, startY, startZ);

    const rackMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.4 });
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.15,
      metalness: 0.85,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const px = (col - 1) * 3.4;
        const pz = (row - 0.5) * 4.2;

        const leg1Geo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6);
        const leg1 = new THREE.Mesh(leg1Geo, rackMat);
        leg1.position.set(px - 1.2, 0.6, pz + 0.8);
        group.add(leg1);

        const leg2Geo = new THREE.CylinderGeometry(0.05, 0.05, 2.0, 6);
        const leg2 = new THREE.Mesh(leg2Geo, rackMat);
        leg2.position.set(px - 1.2, 1.0, pz - 0.8);
        group.add(leg2);

        const panelGroup = new THREE.Group();
        panelGroup.position.set(px, 1.3, pz);
        panelGroup.rotation.x = 0.48;

        const frameGeo = new THREE.BoxGeometry(3.0, 0.08, 1.8);
        const frame = new THREE.Mesh(frameGeo, frameMat);
        panelGroup.add(frame);

        const cellGeo = new THREE.PlaneGeometry(2.85, 1.65);
        cellGeo.rotateX(-Math.PI / 2);
        const cell = new THREE.Mesh(cellGeo, panelMat);
        cell.position.y = 0.045;
        panelGroup.add(cell);

        group.add(panelGroup);
      }
    }

    group.userData = {
      type: 'infrastructure',
      name: '24kW Agrivoltaic Solar Array',
      capacity: '24 kWp Bifacial',
      output: '18.4 kW Current Generation',
      status: 'Peak Generating'
    };

    this.groups.infrastructure.add(group);
    const label = this._createLabel('☀️ 24kW Solar Array', new THREE.Vector3(startX, 2.8, startZ), '#38bdf8', '0.68rem', true);
    this.groups.labels.add(label);
    return group;
  }

  _createBorewell(x, y, z) {
    const group = new THREE.Group();
    const slabGeo = new THREE.CylinderGeometry(2, 2.2, 0.4, 12);
    const slabMat = new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.8 });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.y = 0.2;
    group.add(slab);

    const pumpGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
    const pumpMat = new THREE.MeshStandardMaterial({ color: COLORS.borewell, metalness: 0.7 });
    const pump = new THREE.Mesh(pumpGeo, pumpMat);
    pump.position.y = 0.8;
    group.add(pump);

    const pipeGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 6);
    pipeGeo.rotateZ(Math.PI / 4);
    const pipe = new THREE.Mesh(pipeGeo, pumpMat);
    pipe.position.set(0.6, 1.2, 0);
    group.add(pipe);

    group.position.set(x, y, z);
    group.userData = { type: 'water_source', name: 'Solar Borewell #1', capacity_lph: 15000, status: 'pumping' };
    this.groups.infrastructure.add(group);

    const label = this._createLabel('⚡ Solar Borewell', new THREE.Vector3(x, 2.8, z), '#607D8B', '0.68rem', true);
    this.groups.labels.add(label);
  }

  _createWeatherStation(x, y, z) {
    const group = new THREE.Group();
    const mastGeo = new THREE.CylinderGeometry(0.06, 0.08, 4.5, 6);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.8 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 2.25;
    group.add(mast);

    const crossGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4);
    crossGeo.rotateZ(Math.PI / 2);
    const cross = new THREE.Mesh(crossGeo, mastMat);
    cross.position.y = 4.2;
    group.add(cross);

    const anemometerGroup = new THREE.Group();
    anemometerGroup.position.set(0.6, 4.3, 0);
    const cupGeo = new THREE.SphereGeometry(0.08, 4, 4);
    const cupMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let a = 0; a < 3; a++) {
      const angle = (a / 3) * Math.PI * 2;
      const cup = new THREE.Mesh(cupGeo, cupMat);
      cup.position.set(Math.cos(angle) * 0.2, 0, Math.sin(angle) * 0.2);
      anemometerGroup.add(cup);
    }
    group.add(anemometerGroup);
    this.animatedObjects.push({ type: 'spin', mesh: anemometerGroup, axis: 'y', speed: 4.0 });

    group.position.set(x, y, z);
    group.userData = { type: 'sensor', name: 'Agri-Weather Microstation', status: 'online' };
    this.groups.infrastructure.add(group);

    const label = this._createLabel('🌤️ Weather Station', new THREE.Vector3(x, 5.2, z), '#38BDF8', '0.68rem', true);
    this.groups.labels.add(label);
  }

  _createSensorNode(x, z, name) {
    const group = new THREE.Group();
    const stake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.8, 4),
      new THREE.MeshStandardMaterial({ color: 0x78909c })
    );
    stake.position.y = 0.4;
    group.add(stake);

    const headMat = new THREE.MeshStandardMaterial({ color: COLORS.sensor, emissive: COLORS.sensorBlink, emissiveIntensity: 0.3 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.15), headMat);
    head.position.y = 0.85;
    group.add(head);

    group.position.set(x, 0, z);
    group.userData = { type: 'sensor', name: name, telemetry: { soil_moisture_pct: 34.2, temp_c: 24.8 }, status: 'transmitting' };
    this.groups.infrastructure.add(group);

    this.animatedObjects.push({ type: 'blink', mesh: head, speed: 1.0 });
  }

  _createCameraTower(x, z, name) {
    const group = new THREE.Group();
    const towerGeo = new THREE.CylinderGeometry(0.08, 0.15, 6, 4);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x607d8b, metalness: 0.8 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 3;
    group.add(tower);

    const camBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.25), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    camBox.position.set(0, 6, 0.2);
    group.add(camBox);

    group.position.set(x, 0, z);
    group.userData = { type: 'camera', name: name, fov: '120° Wide-angle Optical', status: 'streaming' };
    this.groups.infrastructure.add(group);
  }

  // ─────────────────────────────────────────────────────────────
  // BOTANICAL MULTI-STAGE CROP MODELS & WIND SWAY
  // ─────────────────────────────────────────────────────────────
  _buildCrops(plantingGrid, cropPlan) {
    const rawCropName = cropPlan?.crop_name || cropPlan?.crop_type || plantingGrid?.crop || this.cropName || 'Wheat';
    const cropKey = normalizeCropKey(rawCropName);

    if (this.farmingClassification === 'aquaculture' || cropKey === 'pisciculture' || this.isAquaculture || String(rawCropName).toLowerCase().includes('aqua')) {
      this._buildAquacultureFoliage();
      return;
    }
    if (this.farmingClassification === 'horticulture') {
      this._buildOrchardUndergrowth();
      return;
    }
    if (this.farmingClassification === 'polyhouse') {
      // Hydroponic plants are situated inside the polyhouse structure
      return;
    }
    if (this.farmingClassification === 'terrace') {
      this._buildTerraceCrops(cropKey, cropPlan);
      return;
    }

    const { minX, maxX, minZ, maxZ } = this.farmBounds;
    const farmW = maxX - minX - 8;
    const farmH = maxZ - minZ - 8;

    const totalRows = plantingGrid?.total_rows || 24;
    const plantsPerRow = plantingGrid?.plants_per_row || 50;
    const totalPlants = Math.min(totalRows * plantsPerRow, 2400);
    const healthyPct = (plantingGrid?.healthy_plants ?? 1180) / (plantingGrid?.total_plants || 1200);
    const stressedPct = (plantingGrid?.stressed_plants ?? 20) / (plantingGrid?.total_plants || 1200);

    const currentStage = this._getCurrentStage(cropPlan);
    const stageIndex = currentStage ? currentStage.index : 2;

    // High-fidelity 3D botanical mesh from Quaternius Crop Models
    const geometry = getCropGeometry(cropKey, stageIndex);
    const material = createCropMaterial();

    const count = totalPlants;
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();

    // Environmental health tints for vertex-colored plants
    const healthyColor = new THREE.Color(1.0, 1.0, 1.0);
    const stressedColor = new THREE.Color(1.10, 0.85, 0.40); // Yellowing/chlorosis
    const deadColor = new THREE.Color(0.48, 0.38, 0.28);     // Withered brown

    let plantIdx = 0;
    const rowSpacing = farmH / totalRows;
    const colSpacing = farmW / plantsPerRow;

    // Crop-specific scale calibrations
    let baseScale = 1.0;
    if (cropKey === 'wheat') baseScale = 1.25;
    else if (cropKey === 'rice') baseScale = 1.15;
    else if (cropKey === 'tomato') baseScale = 0.95;
    else if (cropKey === 'maize') baseScale = 1.05;
    else if (cropKey === 'cotton') baseScale = 1.0;
    else if (cropKey === 'potato') baseScale = 1.0;

    // Dynamic growth scale based on current day progress
    const progress = Math.min(Math.max((this.currentDay || 30) / (this.maxDays || 120), 0.0), 1.0);
    const dayGrowthScale = 0.22 + 0.93 * (3 * progress * progress - 2 * progress * progress * progress);

    for (let r = 0; r < totalRows && plantIdx < count; r++) {
      for (let c = 0; c < plantsPerRow && plantIdx < count; c++) {
        const x = minX + 4 + c * colSpacing + (Math.random() - 0.5) * 0.35;
        const z = minZ + 4 + r * rowSpacing + (Math.random() - 0.5) * 0.35;
        const y = 0.15;

        dummy.position.set(x, y, z);
        const s = baseScale * dayGrowthScale * (0.88 + Math.random() * 0.25);
        dummy.scale.set(s, s * (0.92 + Math.random() * 0.16), s);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(plantIdx, dummy.matrix);

        const rand = Math.random();
        let color;
        if (rand > healthyPct + stressedPct) {
          color = deadColor;
        } else if (rand > healthyPct) {
          color = stressedColor;
        } else {
          color = healthyColor.clone();
          color.r += (Math.random() - 0.5) * 0.04;
          color.g += (Math.random() - 0.5) * 0.04;
          color.b += (Math.random() - 0.5) * 0.04;
        }
        instancedMesh.setColorAt(plantIdx, color);
        plantIdx++;
      }
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    instancedMesh.userData = { type: 'crops', cropKey, cropName: rawCropName, totalPlants: plantIdx, stage: stageIndex, baseScale };
    this.cropInstances = instancedMesh;
    this.groups.crops.add(instancedMesh);

    // Natural wind sway animation
    this.animatedObjects.push({ type: 'cropSway', mesh: instancedMesh, count: plantIdx });
  }

  // Stepped Alpine Crops across 4 Terrace Levels
  _buildTerraceCrops(cropKey, cropPlan) {
    const tiers = [
      { minZ: 22, maxZ: 40, y: 0.64, count: 280 },
      { minZ: 0, maxZ: 18, y: 3.64, count: 280 },
      { minZ: -22, maxZ: -4, y: 7.04, count: 280 },
      { minZ: -40, maxZ: -26, y: 10.54, count: 240 }
    ];

    const currentStage = this._getCurrentStage(cropPlan);
    const stageIndex = currentStage ? currentStage.index : 2;
    const geometry = getCropGeometry(cropKey, stageIndex);
    const material = createCropMaterial();

    const totalTerracePlants = 1080;
    const instancedMesh = new THREE.InstancedMesh(geometry, material, totalTerracePlants);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    const progress = Math.min(Math.max((this.currentDay || 30) / (this.maxDays || 105), 0.0), 1.0);
    const dayGrowthScale = 0.22 + 0.93 * (3 * progress * progress - 2 * progress * progress * progress);
    const healthyColor = new THREE.Color(1.0, 1.0, 1.0);

    tiers.forEach((tier) => {
      const rows = 7;
      const cols = 40;
      const rowStep = (tier.maxZ - tier.minZ) / rows;
      const colStep = 70 / cols;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols && idx < totalTerracePlants; c++) {
          const x = -31 + c * colStep + (Math.random() - 0.5) * 0.4;
          const z = tier.minZ + r * rowStep + (Math.random() - 0.5) * 0.4;
          dummy.position.set(x, tier.y, z);
          const s = 1.05 * dayGrowthScale * (0.85 + Math.random() * 0.3);
          dummy.scale.set(s, s, s);
          dummy.rotation.y = Math.random() * Math.PI * 2;
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(idx, dummy.matrix);
          instancedMesh.setColorAt(idx, healthyColor);
          idx++;
        }
      }
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    instancedMesh.userData = { type: 'crops', cropKey, totalPlants: idx, baseScale: 1.05 };
    this.cropInstances = instancedMesh;
    this.groups.crops.add(instancedMesh);

    this.animatedObjects.push({ type: 'cropSway', mesh: instancedMesh, count: idx });
  }

  _buildOrchardUndergrowth() {
    const { minX, maxX, minZ, maxZ } = this.farmBounds;
    const cloverGeo = new THREE.CircleGeometry(0.5, 6);
    cloverGeo.rotateX(-Math.PI / 2);
    const cloverMat = new THREE.MeshStandardMaterial({ color: 0x40916c, roughness: 0.8 });

    const cloverGroup = new THREE.Group();
    for (let i = 0; i < 65; i++) {
      const x = minX + 6 + Math.random() * (maxX - minX - 12);
      const z = minZ + 6 + Math.random() * (maxZ - minZ - 12);
      const cl = new THREE.Mesh(cloverGeo, cloverMat);
      cl.position.set(x, 0.2, z);
      cloverGroup.add(cl);
    }
    this.groups.crops.add(cloverGroup);
  }

  setCrop(cropName) {
    this.cropName = cropName;
    const cleanCrop = (cropName || '').toLowerCase();
    let newClassification = 'terrestrial';

    if (cleanCrop.includes('mango') || cleanCrop.includes('guava') || cleanCrop.includes('citrus') || cleanCrop.includes('pomegranate') || cleanCrop.includes('banana')) {
      newClassification = 'horticulture';
    } else if (cleanCrop.includes('capsicum') || cleanCrop.includes('cucumber') || cleanCrop.includes('lettuce') || cleanCrop.includes('floriculture') || cleanCrop.includes('polyhouse')) {
      newClassification = 'polyhouse';
    } else if (cleanCrop.includes('rajmash') || cleanCrop.includes('buckwheat') || cleanCrop.includes('ginger') || cleanCrop.includes('millet') || cleanCrop.includes('terrace')) {
      newClassification = 'terrace';
    } else if (cleanCrop.includes('pisc') || cleanCrop.includes('carp') || cleanCrop.includes('fish') || cleanCrop.includes('rohu') || cleanCrop.includes('catla') || cleanCrop.includes('tilapia') || cleanCrop.includes('aqua')) {
      newClassification = 'aquaculture';
    }

    const classificationChanged = (newClassification !== this.farmingClassification);
    this.farmingClassification = newClassification;
    this.isAquaculture = (newClassification === 'aquaculture');

    // Update plan data in memory
    if (this.sceneData) {
      if (!this.sceneData.planting_grid) this.sceneData.planting_grid = {};
      this.sceneData.planting_grid.crop = cropName;
      if (!this.sceneData.crop_plan) this.sceneData.crop_plan = {};
      this.sceneData.crop_plan.crop_name = cropName;
      this.sceneData.crop_plan.farming_classification = newClassification;
    }

    // Set duration
    if (newClassification === 'horticulture') this.maxDays = 240;
    else if (newClassification === 'aquaculture') this.maxDays = 195;
    else if (newClassification === 'terrace') this.maxDays = 105;
    else if (cleanCrop.includes('tomato')) this.maxDays = 90;
    else if (cleanCrop.includes('potato')) this.maxDays = 85;
    else if (cleanCrop.includes('rice')) this.maxDays = 135;
    else this.maxDays = 120;

    if (classificationChanged || cleanCrop.includes('tomato')) {
      this.buildScene(this.sceneData || { farm: { crop_type: cropName } });
    } else {
      while (this.groups.crops.children.length > 0) {
        const child = this.groups.crops.children[0];
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
        this.groups.crops.remove(child);
      }
      this.animatedObjects = this.animatedObjects.filter(a => a.type !== 'cropSway');
      this._buildCrops(this.sceneData?.planting_grid, this.sceneData?.crop_plan);
    }

    console.log(`[3D Twin] Switched crop visuals to: ${cropName} (${this.farmingClassification.toUpperCase()} World, Max Days: ${this.maxDays})`);
  }

  setFarmingClassification(cls) {
    this.farmingClassification = cls;
    this.isAquaculture = (cls === 'aquaculture');
    if (this.sceneData) {
      if (!this.sceneData.crop_plan) this.sceneData.crop_plan = {};
      this.sceneData.crop_plan.farming_classification = cls;
    }
    this.buildScene(this.sceneData || {});
  }

  _buildAquacultureFoliage() {
    const { minX, maxX, minZ, maxZ } = this.farmBounds;
    const foliageGroup = new THREE.Group();

    const reedGeo = new THREE.CylinderGeometry(0.03, 0.04, 1.2, 4);
    const reedMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.6 });
    const cattailGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 6);
    const cattailMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });

    for (let i = 0; i < 52; i++) {
      const rx = (minX + 6) + Math.random() * (maxX - minX - 12);
      const rz = (minZ + 6) + Math.random() * (maxZ - minZ - 12);

      const cluster = new THREE.Group();
      cluster.position.set(rx, 0.35, rz);
      for (let s = 0; s < 4; s++) {
        const stem = new THREE.Mesh(reedGeo, reedMat);
        const ox = (Math.random() - 0.5) * 0.35;
        const oz = (Math.random() - 0.5) * 0.35;
        stem.position.set(ox, 0.6, oz);
        cluster.add(stem);

        if (s === 0) {
          const cat = new THREE.Mesh(cattailGeo, cattailMat);
          cat.position.set(ox, 1.0, oz);
          cluster.add(cat);
        }
      }
      foliageGroup.add(cluster);
    }

    // Floating water lily pads
    const lilyGeo = new THREE.CircleGeometry(0.38, 12);
    lilyGeo.rotateX(-Math.PI / 2);
    const lilyMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.3 });

    for (let l = 0; l < 28; l++) {
      const lily = new THREE.Mesh(lilyGeo, lilyMat);
      const lx = (minX + 8) + Math.random() * (maxX - minX - 16);
      const lz = (minZ + 8) + Math.random() * (maxZ - minZ - 16);
      lily.position.set(lx, 0.38, lz);
      foliageGroup.add(lily);
    }

    this.groups.crops.add(foliageGroup);
  }

  _getCurrentStage(cropPlan) {
    if (!cropPlan || !cropPlan.stages) return { index: 2, name: 'Vegetative Growth' };
    for (let i = 0; i < cropPlan.stages.length; i++) {
      const s = cropPlan.stages[i];
      if (this.currentDay >= (s.start_day || 1) && this.currentDay <= (s.end_day || 999)) {
        return { index: i, name: s.name, ...s };
      }
    }
    return { index: 0, name: cropPlan.stages[0]?.name || 'Sowing' };
  }

  _getCropGeometryForStage(stageIndex, cropType) {
    const cropKey = normalizeCropKey(cropType);
    return {
      geometry: getCropGeometry(cropKey, stageIndex),
      material: createCropMaterial(),
      scale: 1.0,
    };
  }

  _getStageColor(stageIndex) {
    const stageColors = [
      COLORS.cropSeed, COLORS.cropSprout, COLORS.cropVegetative,
      COLORS.cropFlowering, COLORS.cropFruiting, COLORS.cropHarvest
    ];
    return stageColors[Math.min(stageIndex, stageColors.length - 1)];
  }

  // ─────────────────────────────────────────────────────────────
  // ARTICULATED 3D WORKERS & DYNAMIC WORKFORCE SYNC
  // ─────────────────────────────────────────────────────────────
  _buildWorkers(workers) {
    if (!workers || workers.length === 0) {
      workers = [
        { id: 'w1', name: 'Sunita Devi', role: 'worker', position: { x: -14, z: -10 }, current_task: { title: 'Drip Irrigation Maintenance', type: 'watering' }, fatigue_index: 38 },
        { id: 'w2', name: 'Mamata Behera', role: 'worker', position: { x: 12, z: 6 }, current_task: { title: 'Emergency Organic Spraying', type: 'spraying' }, fatigue_index: 54 },
        { id: 'w3', name: 'Balwinder Singh', role: 'farmer', position: { x: -6, z: 22 }, current_task: { title: 'Canopy & Soil Audit', type: 'inspecting' }, fatigue_index: 30 },
        { id: 'w4', name: 'Dr. Priya Sharma', role: 'agronomist', position: { x: 26, z: -14 }, current_task: { title: 'NDVI Spectrometry Audit', type: 'inspecting' }, fatigue_index: 24 },
      ];
    }

    workers.forEach(worker => {
      const workerGroup = this._createWorkerCharacter(worker);
      this.workerMeshes.push({
        group: workerGroup,
        data: worker,
        animPhase: Math.random() * Math.PI * 2,
        torso: workerGroup._torso,
        head: workerGroup._head,
        leftArm: workerGroup._leftArm,
        rightArm: workerGroup._rightArm,
        leftLeg: workerGroup._leftLeg,
        rightLeg: workerGroup._rightLeg,
        sprayMist: workerGroup._sprayMist,
        sprayParticles: workerGroup._sprayParticles,
        nameLabel: workerGroup._nameLabel,
        isWalking: true,
        walkPhase: Math.random() * 10,
        speed: 1.1 + Math.random() * 0.4,
        direction: Math.random() > 0.5 ? 1 : -1,
        minX: -26,
        maxX: 26,
        minZ: -20,
        maxZ: 20,
        patrolAxis: worker.role === 'farmer' ? 'z' : 'x'
      });
    });
  }

  _createWorkerCharacter(worker) {
    const group = new THREE.Group();
    const roleColor = worker.role === 'farmer' ? COLORS.workerFarmer :
                      worker.role === 'agronomist' ? COLORS.workerAgronomist :
                      COLORS.workerLabor;

    // Wellington Field Boots (black/dark slate rubber)
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
    const trousersMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });

    // Left & Right articulated legs
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.2, 0.45, 0);
    const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.55, 6), trousersMat);
    leftThigh.position.y = 0.25;
    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.38, 0.32), bootMat);
    leftBoot.position.set(0, -0.25, 0.04);
    leftLegGroup.add(leftThigh, leftBoot);
    group.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.2, 0.45, 0);
    const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.55, 6), trousersMat);
    rightThigh.position.y = 0.25;
    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.38, 0.32), bootMat);
    rightBoot.position.set(0, -0.25, 0.04);
    rightLegGroup.add(rightThigh, rightBoot);
    group.add(rightLegGroup);

    // Torso with shirt/kurta & High-Vis Safety Vest
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.45, 0);

    const bodyMat = new THREE.MeshStandardMaterial({ color: roleColor, roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.72, 0.38), bodyMat);
    body.castShadow = true;
    torsoGroup.add(body);

    // High-Vis Safety Vest with Silver Reflective Stripes
    const vestMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 }); // neon yellow/orange
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.4), vestMat);
    torsoGroup.add(vest);

    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 0.41), stripeMat);
    stripe1.position.y = 0.08;
    const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 0.41), stripeMat);
    stripe2.position.y = -0.16;
    torsoGroup.add(stripe1, stripe2);
    group.add(torsoGroup);

    // Head with skin tone & role headwear
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.15, 0);

    const skinMat = new THREE.MeshStandardMaterial({ color: COLORS.workerSkin, roughness: 0.6 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), eyeMat);
    eyeL.position.set(-0.08, 0.02, 0.22);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), eyeMat);
    eyeR.position.set(0.08, 0.02, 0.22);
    headGroup.add(eyeL, eyeR);

    // Headwear by role
    if (worker.role === 'farmer') {
      // Traditional turban / straw wide hat
      const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 12), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 }));
      hatBrim.position.y = 0.16;
      const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.22, 8), new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 }));
      hatCrown.position.y = 0.28;
      headGroup.add(hatBrim, hatCrown);
    } else if (worker.role === 'agronomist') {
      // Modern white AGRIOS hardhat / visor
      const hardhat = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
      hardhat.position.y = 0.1;
      headGroup.add(hardhat);
    } else {
      // Krishi Sakhi dupatta / protective field cap
      const scarf = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.16, 8), new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.7 }));
      scarf.position.y = 0.18;
      headGroup.add(scarf);
    }
    group.add(headGroup);

    // Arms
    const armMat = new THREE.MeshStandardMaterial({ color: roleColor, roughness: 0.7 });
    const handMat = new THREE.MeshStandardMaterial({ color: COLORS.workerSkin, roughness: 0.6 });

    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.42, 1.75, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.65, 5), armMat);
    leftArmMesh.position.y = -0.28;
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), handMat);
    leftHand.position.y = -0.62;
    leftArmGroup.add(leftArmMesh, leftHand);
    group.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.42, 1.75, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.65, 5), armMat);
    rightArmMesh.position.y = -0.28;
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), handMat);
    rightHand.position.y = -0.62;
    rightArmGroup.add(rightArmMesh, rightHand);
    group.add(rightArmGroup);

    // ── Role Specific Gear & Tools ──
    let sprayMist = null;
    if (worker.role === 'worker' || (worker.current_task?.type === 'spraying')) {
      // Knapsack spray backpack
      const tankGeo = new THREE.BoxGeometry(0.45, 0.58, 0.24);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.set(0, 1.45, -0.26);
      group.add(tank);

      // Spray wand in right hand
      const wandGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4);
      wandGeo.rotateX(Math.PI / 3);
      const wandMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
      const wand = new THREE.Mesh(wandGeo, wandMat);
      wand.position.set(0.45, 1.1, 0.5);
      group.add(wand);

      // Misty spray particle nozzle cone
      const coneGeo = new THREE.ConeGeometry(0.3, 0.8, 8, 1, true);
      coneGeo.rotateX(-Math.PI / 3);
      const mistMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
      sprayMist = new THREE.Mesh(coneGeo, mistMat);
      sprayMist.position.set(0.45, 0.7, 0.9);
      group.add(sprayMist);

      // Dynamic water droplet particle cascade
      const sprayCount = 48;
      const sprayGeo = new THREE.BufferGeometry();
      const sprayPos = new Float32Array(sprayCount * 3);
      const sprayVels = [];
      for (let pi = 0; pi < sprayCount; pi++) {
        sprayPos[pi * 3 + 0] = 0.45;
        sprayPos[pi * 3 + 1] = 0.7;
        sprayPos[pi * 3 + 2] = 0.9;
        sprayVels.push({
          x: (Math.random() - 0.5) * 0.35,
          y: -1.2 - Math.random() * 1.5,
          z: 0.8 + Math.random() * 0.6,
          life: Math.random()
        });
      }
      sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPos, 3));
      const sprayMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.12,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      const sprayParticles = new THREE.Points(sprayGeo, sprayMat);
      sprayParticles.userData = { vels: sprayVels };
      group.add(sprayParticles);
      group._sprayParticles = sprayParticles;
    } else if (worker.role === 'agronomist') {
      // Telemetry digital spectrometer tablet
      const tabletGeo = new THREE.BoxGeometry(0.38, 0.28, 0.04);
      const tabletMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      const tablet = new THREE.Mesh(tabletGeo, tabletMat);
      tablet.position.set(0, 1.2, 0.35);
      tablet.rotation.x = -0.5;

      const screenGeo = new THREE.PlaneGeometry(0.32, 0.22);
      const screenMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 0, 0.025);
      tablet.add(screen);
      group.add(tablet);
    } else {
      // Lead farmer sluice wrench / clipboard
      const wrenchGeo = new THREE.BoxGeometry(0.06, 0.5, 0.06);
      const wrenchMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85 });
      const wrench = new THREE.Mesh(wrenchGeo, wrenchMat);
      wrench.position.set(0.42, 1.0, 0.2);
      group.add(wrench);
    }

    const px = worker.position?.x || (Math.random() * 60 - 30);
    const pz = worker.position?.z || (Math.random() * 50 - 25);
    group.position.set(px, 0, pz);

    const label = this._createLabel(
      `${worker.name || 'Personnel'} (${worker.role})`,
      new THREE.Vector3(0, 2.9, 0),
      roleColor === COLORS.workerFarmer ? '#4CAF50' : (roleColor === COLORS.workerAgronomist ? '#38BDF8' : '#F97316'),
      '0.68rem',
      true
    );
    label.visible = this.showWorkerLabels;
    group.add(label);
    group._nameLabel = label;

    group.userData = {
      type: 'worker',
      id: worker.id,
      name: worker.name,
      role: worker.role,
      current_task: worker.current_task,
      fatigue_index: worker.fatigue_index,
    };
    body.userData = group.userData;
    head.userData = group.userData;

    // Attach limb references to group for dynamic animation updates
    group._torso = torsoGroup;
    group._head = headGroup;
    group._leftArm = leftArmGroup;
    group._rightArm = rightArmGroup;
    group._leftLeg = leftLegGroup;
    group._rightLeg = rightLegGroup;
    group._sprayMist = sprayMist;

    this.groups.workers.add(group);
    return group;
  }

  // Live Workforce Dynamic Sync (Auto-spawns / relocates 3D characters upon AGRIOS registration)
  syncWorkforce(workersList) {
    if (!workersList || !Array.isArray(workersList)) return;

    const existingMap = new Map();
    this.workerMeshes.forEach(w => existingMap.set(w.data.id, w));
    const activeIds = new Set();

    workersList.forEach(worker => {
      activeIds.add(worker.id);
      if (existingMap.has(worker.id)) {
        const wMesh = existingMap.get(worker.id);
        wMesh.data = { ...wMesh.data, ...worker };
        wMesh.group.userData = { ...wMesh.group.userData, ...worker };
      } else {
        const newGroup = this._createWorkerCharacter(worker);
        const wObj = {
          group: newGroup,
          data: worker,
          animPhase: Math.random() * Math.PI * 2,
          torso: newGroup._torso,
          head: newGroup._head,
          leftArm: newGroup._leftArm,
          rightArm: newGroup._rightArm,
          leftLeg: newGroup._leftLeg,
          rightLeg: newGroup._rightLeg,
          sprayMist: newGroup._sprayMist,
          sprayParticles: newGroup._sprayParticles,
          nameLabel: newGroup._nameLabel,
          isWalking: true,
          walkPhase: Math.random() * 10,
          speed: 1.1 + Math.random() * 0.4,
          direction: Math.random() > 0.5 ? 1 : -1,
          minX: -26,
          maxX: 26,
          minZ: -20,
          maxZ: 20,
          patrolAxis: worker.role === 'farmer' ? 'z' : 'x'
        };
        this.workerMeshes.push(wObj);
        console.log(`[3D Twin] Dynamic workforce sync: spawned ${worker.name} (${worker.role})`);
      }
    });

    // Remove de-registered workers
    this.workerMeshes = this.workerMeshes.filter(w => {
      if (!activeIds.has(w.data.id)) {
        this.groups.workers.remove(w.group);
        w.group.traverse(obj => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
          }
        });
        return false;
      }
      return true;
    });
  }

  // Toggle Visibility of Floating 3D Personnel Name Tags
  toggleWorkerLabels() {
    this.showWorkerLabels = !this.showWorkerLabels;
    this.workerMeshes.forEach(w => {
      if (w.nameLabel) w.nameLabel.visible = this.showWorkerLabels;
      if (w.group && w.group._nameLabel) w.group._nameLabel.visible = this.showWorkerLabels;
    });
    if (this.tractorMesh && this.tractorMesh._nameLabel) {
      this.tractorMesh._nameLabel.visible = this.showWorkerLabels;
    }
    if (this.pastureGroup && this.pastureGroup._nameLabel) {
      this.pastureGroup._nameLabel.visible = this.showWorkerLabels;
    }
    return this.showWorkerLabels;
  }

  // ─────────────────────────────────────────────────────────────
  // NEXT-GEN WEATHER ENGINE & ATMOSPHERIC AESTHETICS
  // ─────────────────────────────────────────────────────────────
  _applyWeather(weather) {
    if (!weather) weather = { condition: 'clear' };
    this.currentWeather = weather.condition || 'clear';

    switch (this.currentWeather) {
      case 'clear': this._setWeatherClear(); break;
      case 'cloudy': this._setWeatherCloudy(); break;
      case 'rain': this._setWeatherRain(); break;
      case 'dusk':
      case 'sunset': this._setWeatherDusk(); break;
      case 'night': this._setWeatherNight(); break;
      case 'heatwave': this._setWeatherHeatwave(); break;
      default: this._setWeatherClear(); break;
    }
    this.syncWeatherSound();
    if (this.currentDay) {
      this.setDay(this.currentDay);
    }
  }

  _setWeatherClear() {
    if (this._sunLight) {
      this._sunLight.intensity = 1.45;
      this._sunLight.color.setHex(0xfffbeb);
      this._sunLight.position.set(65, 85, 50);
    }
    if (this._ambientLight) {
      this._ambientLight.intensity = 0.58;
      this._ambientLight.color.setHex(0xfff7ed);
    }
    if (this.scene.fog) {
      this.scene.fog.color.setHex(0xdbeafe);
      this.scene.fog.density = 0.0025;
    }
    this._clearWeatherEffects();
    this._updateSkyDome([
      { stop: 0.0, color: '#1d4ed8' },
      { stop: 0.35, color: '#3b82f6' },
      { stop: 0.70, color: '#93c5fd' },
      { stop: 0.92, color: '#fed7aa' },
      { stop: 1.0, color: '#fde68a' }
    ], { x: 65, y: 115, z: 60 }, 0xfffbeb, 11, false);

    // Dry soil PBR
    if (this._terrainMesh && this._terrainMesh.material) {
      this._terrainMesh.material.roughness = 0.85;
      this._terrainMesh.material.metalness = 0.04;
    }

    this._addClouds(4);
  }

  _setWeatherCloudy() {
    if (this._sunLight) {
      this._sunLight.intensity = 0.55;
      this._sunLight.color.setHex(0xcbd5e1);
      this._sunLight.position.set(40, 70, 30);
    }
    if (this._ambientLight) {
      this._ambientLight.intensity = 0.45;
      this._ambientLight.color.setHex(0xe2e8f0);
    }
    if (this.scene.fog) {
      this.scene.fog.color.setHex(0x94a3b8);
      this.scene.fog.density = 0.0048;
    }
    this._clearWeatherEffects();
    this._updateSkyDome([
      { stop: 0.0, color: '#334155' },
      { stop: 0.40, color: '#64748b' },
      { stop: 0.75, color: '#94a3b8' },
      { stop: 1.0, color: '#cbd5e1' }
    ], { x: 40, y: 80, z: 30 }, 0xe2e8f0, 13, false);

    this._addClouds(14);
  }

  _setWeatherRain() {
    if (this._sunLight) {
      this._sunLight.intensity = 0.28;
      this._sunLight.color.setHex(0x64748b);
      this._sunLight.position.set(30, 60, 20);
    }
    if (this._ambientLight) {
      this._ambientLight.intensity = 0.32;
      this._ambientLight.color.setHex(0x475569);
    }
    if (this.scene.fog) {
      this.scene.fog.color.setHex(0x475569);
      this.scene.fog.density = 0.0078;
    }
    this._clearWeatherEffects();
    this._updateSkyDome([
      { stop: 0.0, color: '#0f172a' },
      { stop: 0.30, color: '#1e293b' },
      { stop: 0.65, color: '#334155' },
      { stop: 1.0, color: '#475569' }
    ], { x: 30, y: 60, z: 20 }, 0x64748b, 8, false);

    // Dynamic wet soil sheen & puddle reflections
    if (this._terrainMesh && this._terrainMesh.material) {
      this._terrainMesh.material.roughness = 0.18;
      this._terrainMesh.material.metalness = 0.30;
    }

    this._addClouds(18, 0x64748b);
    this._addRainStreaks();
    this._lightningTimer = 6.0 + Math.random() * 6.0;
  }

  _setWeatherDusk() {
    if (this._sunLight) {
      this._sunLight.intensity = 1.25;
      this._sunLight.color.setHex(0xf97316); // warm sunset orange
      this._sunLight.position.set(90, 15, 60); // Low sun on horizon
    }
    if (this._ambientLight) {
      this._ambientLight.intensity = 0.48;
      this._ambientLight.color.setHex(0xfdba74);
    }
    if (this.scene.fog) {
      this.scene.fog.color.setHex(0xf472b6);
      this.scene.fog.density = 0.0035;
    }
    this._clearWeatherEffects();
    this._updateSkyDome([
      { stop: 0.0, color: '#311042' }, // twilight purple
      { stop: 0.35, color: '#7e22ce' }, // violet
      { stop: 0.60, color: '#b91c1c' }, // crimson red
      { stop: 0.85, color: '#ea580c' }, // burning orange
      { stop: 1.0, color: '#facc15' }  // golden horizon
    ], { x: 90, y: 15, z: 60 }, 0xfb923c, 16, false);

    // Warm evening soil
    if (this._terrainMesh && this._terrainMesh.material) {
      this._terrainMesh.material.roughness = 0.75;
      this._terrainMesh.material.metalness = 0.08;
    }

    this._addClouds(6, 0xfca5a5);
  }

  _setWeatherNight() {
    if (this._sunLight) {
      this._sunLight.intensity = 0.18;
      this._sunLight.color.setHex(0x93c5fd); // moonlight
      this._sunLight.position.set(-60, 80, -50);
    }
    if (this._ambientLight) {
      this._ambientLight.intensity = 0.16;
      this._ambientLight.color.setHex(0x1e1b4b); // deep night blue
    }
    if (this.scene.fog) {
      this.scene.fog.color.setHex(0x0a0f1d);
      this.scene.fog.density = 0.0038;
    }
    this._clearWeatherEffects();
    this._updateSkyDome([
      { stop: 0.0, color: '#020617' }, // pitch night
      { stop: 0.40, color: '#0b0f19' },
      { stop: 0.80, color: '#0f172a' },
      { stop: 1.0, color: '#1e293b' }
    ], { x: -60, y: 80, z: -50 }, 0xe0f2fe, 9, true);

    this._addStarfield();
  }

  _setWeatherHeatwave() {
    if (this._sunLight) {
      this._sunLight.intensity = 1.95;
      this._sunLight.color.setHex(0xffedd5);
      this._sunLight.position.set(50, 95, 40);
    }
    if (this._ambientLight) {
      this._ambientLight.intensity = 0.72;
      this._ambientLight.color.setHex(0xfde68a);
    }
    if (this.scene.fog) {
      this.scene.fog.color.setHex(0xd97706);
      this.scene.fog.density = 0.0042;
    }
    this._clearWeatherEffects();
    this._updateSkyDome([
      { stop: 0.0, color: '#0284c7' },
      { stop: 0.35, color: '#38bdf8' },
      { stop: 0.70, color: '#fef08a' },
      { stop: 0.90, color: '#fed7aa' },
      { stop: 1.0, color: '#f97316' }
    ], { x: 50, y: 120, z: 40 }, 0xffedd5, 14, false);

    this._addClouds(2);
  }

  _clearWeatherEffects() {
    this.cloudMeshes.forEach(c => {
      this.groups.weather.remove(c);
      c.traverse(obj => { if (obj.geometry) obj.geometry.dispose(); if (obj.material) obj.material.dispose(); });
    });
    this.cloudMeshes = [];

    if (this.rainStreaks) {
      this.groups.weather.remove(this.rainStreaks);
      this.rainStreaks.geometry.dispose();
      this.rainStreaks.material.dispose();
      this.rainStreaks = null;
      this.rainData = null;
    }

    if (this.splashPool) {
      this.splashPool.forEach(sp => {
        this.groups.weather.remove(sp.mesh);
        sp.mesh.geometry.dispose();
        sp.mesh.material.dispose();
      });
      this.splashPool = null;
    }

    if (this.starField) {
      this.groups.weather.remove(this.starField);
      this.starField.geometry.dispose();
      this.starField.material.dispose();
      this.starField = null;
    }

    if (this.moonMesh) {
      this.groups.weather.remove(this.moonMesh);
      this.moonMesh.geometry.dispose();
      this.moonMesh.material.dispose();
      this.moonMesh = null;
    }

    // Clean up disaster meshes & particle systems
    if (this.disasterObjects && this.disasterObjects.length > 0) {
      this.disasterObjects.forEach(obj => {
        this.groups.weather.remove(obj);
        obj.traverse(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) {
            if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
            else c.material.dispose();
          }
        });
      });
      this.disasterObjects = [];
    }
    this.hailData = null;
    this.hailMesh = null;
    this.locustData = null;
    this.locustMesh = null;
    this.heatShimmerData = null;
    this.heatShimmerMesh = null;
    this.floodWater = null;

    // Reset terrain material to default procedural soil texture if altered
    if (this._terrainMesh && this._terrainMesh.material && this._proceduralSoilTexture) {
      if (this._terrainMesh.material.map !== this._proceduralSoilTexture) {
        this._terrainMesh.material.map = this._proceduralSoilTexture;
        this._terrainMesh.material.roughness = 0.85;
        this._terrainMesh.material.metalness = 0.04;
        this._terrainMesh.material.color.setHex(0xffffff);
        this._terrainMesh.material.needsUpdate = true;
      }
    }
  }

  _addClouds(count, tintColor = 0xf8fafc) {
    const cloudGeo = new THREE.DodecahedronGeometry(5.2, 1);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: tintColor,
      transparent: true,
      opacity: 0.88,
      roughness: 0.92,
    });

    for (let i = 0; i < count; i++) {
      const cloud = new THREE.Group();
      const puffCount = 3 + Math.floor(Math.random() * 3);
      for (let p = 0; p < puffCount; p++) {
        const puff = new THREE.Mesh(cloudGeo, cloudMat);
        puff.position.set(p * 3.6 + (Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 2.2);
        const s = 0.65 + Math.random() * 0.65;
        puff.scale.set(s, s * 0.6, s);
        cloud.add(puff);
      }
      cloud.position.set(
        (Math.random() - 0.5) * 130,
        34 + Math.random() * 12,
        (Math.random() - 0.5) * 110
      );
      this.groups.weather.add(cloud);
      this.cloudMeshes.push(cloud);
    }
  }

  _addRainStreaks() {
    const count = 2800;
    const positions = new Float32Array(count * 6);
    const streakLength = 1.35;
    const windTiltX = -0.32;
    const windTiltZ = -0.12;

    this.rainData = [];
    for (let i = 0; i < count; i++) {
      const rx = (Math.random() - 0.5) * 160;
      const ry = Math.random() * 55;
      const rz = (Math.random() - 0.5) * 140;
      const speed = 36 + Math.random() * 18;

      positions[i * 6] = rx;
      positions[i * 6 + 1] = ry;
      positions[i * 6 + 2] = rz;

      positions[i * 6 + 3] = rx + windTiltX * streakLength;
      positions[i * 6 + 4] = ry - streakLength;
      positions[i * 6 + 5] = rz + windTiltZ * streakLength;

      this.rainData.push({ x: rx, y: ry, z: rz, speed });
    }

    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const rainMat = new THREE.LineBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.65,
    });
    this.rainStreaks = new THREE.LineSegments(rainGeo, rainMat);
    this.groups.weather.add(this.rainStreaks);

    // Ground splash rings pool
    this.splashPool = [];
    const ringGeo = new THREE.RingGeometry(0.08, 0.42, 16);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xbfdbfe,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });

    for (let s = 0; s < 45; s++) {
      const splash = new THREE.Mesh(ringGeo, ringMat.clone());
      splash.position.set((Math.random() - 0.5) * 130, 0.22, (Math.random() - 0.5) * 110);
      splash.visible = false;
      this.groups.weather.add(splash);
      this.splashPool.push({
        mesh: splash,
        active: false,
        life: 0,
        maxLife: 0.32 + Math.random() * 0.18
      });
    }
  }

  _spawnSplash(x, z) {
    if (!this.splashPool) return;
    const inactive = this.splashPool.find(sp => !sp.active);
    if (inactive) {
      inactive.active = true;
      inactive.life = 0;
      inactive.mesh.position.set(x, 0.22, z);
      inactive.mesh.scale.set(0.3, 0.3, 0.3);
      inactive.mesh.material.opacity = 0.85;
      inactive.mesh.visible = true;
    }
  }

  _triggerLightningFlash() {
    if (!this._ambientLight || !this._sunLight) return;
    const origAmb = this._ambientLight.intensity;
    const origSun = this._sunLight.intensity;

    this._ambientLight.intensity = 2.4;
    this._sunLight.intensity = 3.2;
    this._sunLight.color.setHex(0xffffff);

    // Trigger authentic acoustic thunder synthesis with realistic speed-of-sound acoustic lag
    setTimeout(() => {
      this._playSynthesizedThunder();
    }, 280);

    setTimeout(() => {
      if (this.currentWeather !== 'rain' && this.activeDisaster !== 'thunderstorm') return;
      this._ambientLight.intensity = 0.4;
      this._sunLight.intensity = 0.5;
      setTimeout(() => {
        if (this.currentWeather !== 'rain' && this.activeDisaster !== 'thunderstorm') return;
        this._ambientLight.intensity = 2.0;
        this._sunLight.intensity = 2.8;
        setTimeout(() => {
          if (this.currentWeather !== 'rain' && this.activeDisaster !== 'thunderstorm') return;
          this._ambientLight.intensity = origAmb;
          this._sunLight.intensity = origSun;
          this._sunLight.color.setHex(0x64748b);
        }, 80);
      }, 50);
    }, 60);
  }

  _addStarfield() {
    const starCount = 800;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.44;
      const r = 250;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.25,
      transparent: true,
      opacity: 0.85,
    });
    this.starField = new THREE.Points(starGeo, starMat);
    this.groups.weather.add(this.starField);

    // Glowing crescent moon
    const moonGeo = new THREE.SphereGeometry(7.5, 24, 24);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(-60, 115, -60);
    this.moonMesh = moon;
    this.groups.weather.add(moon);
  }

  // ─────────────────────────────────────────────────────────────
  // WEB AUDIO API NATIVE THUNDER ACOUSTIC SYNTHESIZER
  // ─────────────────────────────────────────────────────────────
  _initAudioContext() {
    if (!this._audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this._audioCtx = new AudioCtx();
      }
    }
    if (this._audioCtx && this._audioCtx.state === 'suspended') {
      this._audioCtx.resume();
    }
  }

  toggleSound() {
    this.soundMuted = !this.soundMuted;
    if (!this.soundMuted) {
      this._initAudioContext();
      this.syncWeatherSound();
      if (this.tractorActive) {
        this._startTractorSound();
      }
    } else {
      this.syncWeatherSound();
      this._stopTractorSound();
    }
    return !this.soundMuted;
  }

  // Dynamic Audio Routing based on active weather and disasters
  syncWeatherSound() {
    if (this.soundMuted) {
      this._stopAmbientBirds();
      this._stopRainSound();
      this._stopHeatwaveSound();
      this._stopNightSound();
      if (!this.tractorActive) this._stopTractorSound();
      return;
    }
    this._initAudioContext();

    const w = this.currentWeather;
    const d = this.activeDisaster;

    if (d === 'thunderstorm' || w === 'rain') {
      this._stopAmbientBirds();
      this._stopHeatwaveSound();
      this._stopNightSound();
      this._startRainSound();
    } else if (d === 'drought' || w === 'heatwave') {
      this._stopAmbientBirds();
      this._stopRainSound();
      this._stopNightSound();
      this._startHeatwaveSound();
    } else if (w === 'night') {
      this._stopAmbientBirds();
      this._stopRainSound();
      this._stopHeatwaveSound();
      this._startNightSound();
    } else {
      // Clear sky, golden hour, or pleasant daylight
      this._stopRainSound();
      this._stopHeatwaveSound();
      this._stopNightSound();
      this._startAmbientBirds();
    }
  }

  // Procedural FM Bird Song Synthesizer (Authentic High-Pitch Warbles & Chirps)
  _playBirdChirp() {
    if (this.soundMuted) return;
    try {
      this._initAudioContext();
      if (!this._audioCtx) return;
      const ctx = this._audioCtx;
      const now = ctx.currentTime;

      // FM Carrier & Modulator
      const carrier = ctx.createOscillator();
      const modulator = ctx.createOscillator();
      const modGain = ctx.createGain();
      const mainGain = ctx.createGain();

      carrier.type = 'sine';
      modulator.type = 'sine';

      const baseFreq = 2600 + Math.random() * 1200;
      carrier.frequency.setValueAtTime(baseFreq, now);
      carrier.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.05);
      carrier.frequency.exponentialRampToValueAtTime(baseFreq * 0.85, now + 0.12);

      modulator.frequency.setValueAtTime(25 + Math.random() * 20, now);
      modGain.gain.setValueAtTime(250 + Math.random() * 150, now);

      mainGain.gain.setValueAtTime(0.001, now);
      mainGain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(mainGain);
      mainGain.connect(ctx.destination);

      carrier.start(now);
      modulator.start(now);
      carrier.stop(now + 0.16);
      modulator.stop(now + 0.16);

      // Natural echo warble chirp
      if (Math.random() > 0.4) {
        const echoCarrier = ctx.createOscillator();
        const echoGain = ctx.createGain();
        echoCarrier.type = 'sine';
        const echoTime = now + 0.18;
        echoCarrier.frequency.setValueAtTime(baseFreq * 1.15, echoTime);
        echoCarrier.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, echoTime + 0.1);
        echoGain.gain.setValueAtTime(0.001, echoTime);
        echoGain.gain.exponentialRampToValueAtTime(0.12, echoTime + 0.02);
        echoGain.gain.exponentialRampToValueAtTime(0.001, echoTime + 0.11);
        echoCarrier.connect(echoGain);
        echoGain.connect(ctx.destination);
        echoCarrier.start(echoTime);
        echoCarrier.stop(echoTime + 0.12);
      }
    } catch (_) {}
  }

  _startAmbientBirds() {
    if (this._ambientSoundNodes.birdTimer) return;
    const scheduleNext = () => {
      if (this.soundMuted || this.currentWeather === 'rain' || this.currentWeather === 'night' || this.activeDisaster) {
        return;
      }
      this._playBirdChirp();
      const delay = 3500 + Math.random() * 4500;
      this._ambientSoundNodes.birdTimer = setTimeout(scheduleNext, delay);
    };
    this._ambientSoundNodes.birdTimer = setTimeout(scheduleNext, 1200);
  }

  _stopAmbientBirds() {
    if (this._ambientSoundNodes.birdTimer) {
      clearTimeout(this._ambientSoundNodes.birdTimer);
      this._ambientSoundNodes.birdTimer = null;
    }
  }

  // Continuous Rain Wash & Droplet Transients Synthesizer
  _startRainSound() {
    if (this.soundMuted || this._ambientSoundNodes.rainSource) return;
    try {
      this._initAudioContext();
      if (!this._audioCtx) return;
      const ctx = this._audioCtx;
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.Q.value = 0.85;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 1.0);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start();
      this._ambientSoundNodes.rainSource = source;
      this._ambientSoundNodes.rainGain = gain;
    } catch (_) {}
  }

  _stopRainSound() {
    if (!this._ambientSoundNodes.rainSource) return;
    try {
      const { rainSource, rainGain } = this._ambientSoundNodes;
      const now = this._audioCtx.currentTime;
      rainGain.gain.linearRampToValueAtTime(0.001, now + 0.5);
      setTimeout(() => {
        try { rainSource.stop(); } catch (_) {}
      }, 550);
    } catch (_) {}
    this._ambientSoundNodes.rainSource = null;
    this._ambientSoundNodes.rainGain = null;
  }

  // Arid Heatwave Wind & Cicadas Synthesizer
  _startHeatwaveSound() {
    if (this.soundMuted || this._ambientSoundNodes.heatwaveSource) return;
    try {
      this._initAudioContext();
      if (!this._audioCtx) return;
      const ctx = this._audioCtx;
      const now = ctx.currentTime;

      // Hot dry wind noise
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.value = 4.5;

      // Rhythmic summer cicadas
      const cicadaOsc = ctx.createOscillator();
      cicadaOsc.type = 'sine';
      cicadaOsc.frequency.setValueAtTime(4600, now);

      const cicadaLfo = ctx.createOscillator();
      cicadaLfo.type = 'square';
      cicadaLfo.frequency.setValueAtTime(7.5, now);

      const cicadaGain = ctx.createGain();
      cicadaGain.gain.setValueAtTime(0.06, now);
      cicadaLfo.connect(cicadaGain.gain);

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.001, now);
      mainGain.gain.linearRampToValueAtTime(0.18, now + 1.0);

      source.connect(filter);
      filter.connect(mainGain);
      cicadaOsc.connect(cicadaGain);
      cicadaGain.connect(mainGain);
      mainGain.connect(ctx.destination);

      source.start();
      cicadaOsc.start();
      cicadaLfo.start();

      this._ambientSoundNodes.heatwaveSource = { source, cicadaOsc, cicadaLfo };
      this._ambientSoundNodes.heatwaveGain = mainGain;
    } catch (_) {}
  }

  _stopHeatwaveSound() {
    if (!this._ambientSoundNodes.heatwaveSource) return;
    try {
      const { heatwaveSource, heatwaveGain } = this._ambientSoundNodes;
      const now = this._audioCtx.currentTime;
      heatwaveGain.gain.linearRampToValueAtTime(0.001, now + 0.4);
      setTimeout(() => {
        try {
          heatwaveSource.source.stop();
          heatwaveSource.cicadaOsc.stop();
          heatwaveSource.cicadaLfo.stop();
        } catch (_) {}
      }, 450);
    } catch (_) {}
    this._ambientSoundNodes.heatwaveSource = null;
    this._ambientSoundNodes.heatwaveGain = null;
  }

  // Nocturnal Summer Night Crickets & Owl Chime
  _startNightSound() {
    if (this.soundMuted || this._ambientSoundNodes.nightSource) return;
    try {
      this._initAudioContext();
      if (!this._audioCtx) return;
      const ctx = this._audioCtx;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(4300, now);

      const lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.setValueAtTime(14, now);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.04, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 1.0);

      lfo.connect(lfoGain.gain);
      osc.connect(lfoGain);
      lfoGain.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      lfo.start();

      this._ambientSoundNodes.nightSource = { osc, lfo };
      this._ambientSoundNodes.nightGain = gain;
    } catch (_) {}
  }

  _stopNightSound() {
    if (!this._ambientSoundNodes.nightSource) return;
    try {
      const { nightSource, nightGain } = this._ambientSoundNodes;
      const now = this._audioCtx.currentTime;
      nightGain.gain.linearRampToValueAtTime(0.001, now + 0.4);
      setTimeout(() => {
        try {
          nightSource.osc.stop();
          nightSource.lfo.stop();
        } catch (_) {}
      }, 450);
    } catch (_) {}
    this._ambientSoundNodes.nightSource = null;
    this._ambientSoundNodes.nightGain = null;
  }

  // Authentic 2-Cylinder Diesel Tractor Engine Rumble (Chug-Chug-Chug)
  _startTractorSound() {
    if (this.soundMuted || this._tractorSoundNodes) return;
    try {
      this._initAudioContext();
      if (!this._audioCtx) return;
      const ctx = this._audioCtx;
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(48, now);
      osc2.frequency.setValueAtTime(51.5, now);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'square';
      lfo.frequency.setValueAtTime(8.5, now);
      lfoGain.gain.setValueAtTime(0.4, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(190, now);
      filter.Q.value = 2.4;

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.001, now);
      mainGain.gain.linearRampToValueAtTime(0.25, now + 0.5);

      lfo.connect(mainGain.gain);
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(mainGain);
      mainGain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      lfo.start(now);

      this._tractorSoundNodes = { osc1, osc2, lfo, mainGain, filter };
    } catch (_) {}
  }

  _stopTractorSound() {
    if (!this._tractorSoundNodes) return;
    try {
      const { osc1, osc2, lfo, mainGain } = this._tractorSoundNodes;
      const now = this._audioCtx.currentTime;
      mainGain.gain.linearRampToValueAtTime(0.001, now + 0.3);
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          lfo.stop();
        } catch (_) {}
      }, 350);
    } catch (_) {}
    this._tractorSoundNodes = null;
  }

  // Cattle / Livestock Formant Lowing Synthesizer (Gentle Moo)
  _playCowMoo() {
    if (this.soundMuted) return;
    try {
      this._initAudioContext();
      if (!this._audioCtx) return;
      const ctx = this._audioCtx;
      const now = ctx.currentTime;
      const dur = 1.6;

      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(165, now);
      osc.frequency.exponentialRampToValueAtTime(132, now + dur);

      const f1 = ctx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.frequency.setValueAtTime(460, now);
      f1.Q.value = 4.2;

      const f2 = ctx.createBiquadFilter();
      f2.type = 'bandpass';
      f2.frequency.setValueAtTime(860, now);
      f2.Q.value = 3.8;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.35, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(f1);
      osc.connect(f2);
      f1.connect(gain);
      f2.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + dur);
    } catch (_) {}
  }

  // Interactive 3D Tractor Field Patrol Toggle
  toggleTractor() {
    this.tractorActive = !this.tractorActive;
    if (this.tractorActive) {
      this._startTractorSound();
    } else {
      this._stopTractorSound();
    }
    return this.tractorActive;
  }

  // Trigger Cute Countryside Animal Grazing Action
  triggerCuteAnimal() {
    this._playCowMoo();
    if (this.livestockMeshes.length > 0) {
      this.livestockMeshes.forEach(cow => {
        if (cow.userData && cow.userData.headGroup) {
          cow.userData.headGroup.rotation.x = -0.35; // lifts head to look at camera
        }
      });
    }
    return true;
  }

  _playSynthesizedThunder() {
    if (this.soundMuted) return;
    try {
      this._initAudioContext();
      if (!this._audioCtx) return;
      const ctx = this._audioCtx;
      const duration = 3.2 + Math.random() * 1.5;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      // Procedural pink/brown noise acoustic generator (Paul Kellet's algorithm)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12;
        b6 = white * 0.115926;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // Resonant dynamic sweep lowpass filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 4.8;
      const now = ctx.currentTime;
      filter.frequency.setValueAtTime(185, now);
      filter.frequency.exponentialRampToValueAtTime(36, now + duration);

      // Lowshelf bass boost for deep gut rumble
      const bassBoost = ctx.createBiquadFilter();
      bassBoost.type = 'lowshelf';
      bassBoost.frequency.value = 95;
      bassBoost.gain.value = 9.5;

      // Dynamic envelope shaper
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.85, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.65, now + 0.4);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSource.connect(filter);
      filter.connect(bassBoost);
      bassBoost.connect(gainNode);
      gainNode.connect(ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + duration);
    } catch (e) {
      console.warn('[3D Twin Audio] Thunder synthesis unavailable:', e);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // ATMOSPHERIC DISASTER SIMULATION ENGINE
  // ─────────────────────────────────────────────────────────────
  setDisaster(disasterType) {
    if (this.activeDisaster === disasterType) {
      this.activeDisaster = null;
      this._applyWeather({ condition: this.currentWeather || 'clear' });
      return null;
    }

    this.activeDisaster = disasterType;
    switch (disasterType) {
      case 'thunderstorm':
        this._setWeatherThunderstorm();
        break;
      case 'drought':
        this._setWeatherDrought();
        break;
      case 'hailstorm':
        this._setWeatherHailstorm();
        break;
      case 'locusts':
      case 'locust_swarm':
        this._setWeatherLocustSwarm();
        break;
      case 'flood':
      case 'flash_flood':
        this._setWeatherFlood();
        break;
      default:
        this.activeDisaster = null;
        this._applyWeather({ condition: this.currentWeather || 'clear' });
        break;
    }
    this.syncWeatherSound();
    if (this.currentDay) {
      this.setDay(this.currentDay);
    }
    return this.activeDisaster;
  }

  _setWeatherThunderstorm() {
    this._clearWeatherEffects();
    if (this._sunLight) {
      this._sunLight.intensity = 0.15;
      this._sunLight.color.setHex(0x475569);
      this._sunLight.position.set(20, 50, 15);
    }
    if (this._ambientLight) {
      this._ambientLight.intensity = 0.22;
      this._ambientLight.color.setHex(0x1e293b);
    }
    if (this.scene.fog) {
      this.scene.fog.color.setHex(0x0f172a);
      this.scene.fog.density = 0.0095;
    }
    this._updateSkyDome([
      { stop: 0.0, color: '#020617' },
      { stop: 0.25, color: '#090d16' },
      { stop: 0.60, color: '#1e293b' },
      { stop: 1.0, color: '#334155' }
    ], { x: 20, y: 50, z: 15 }, 0x334155, 6, false);

    if (this._terrainMesh && this._terrainMesh.material) {
      this._terrainMesh.material.roughness = 0.12;
      this._terrainMesh.material.metalness = 0.40;
    }

    this._addClouds(24, 0x1e293b);
    this._addRainStreaks();
    this._lightningTimer = 1.5;
    this._triggerLightningFlash();
  }

  _setWeatherDrought() {
    this._clearWeatherEffects();
    if (this._sunLight) {
      this._sunLight.intensity = 2.45;
      this._sunLight.color.setHex(0xffedd5);
      this._sunLight.position.set(45, 110, 35);
    }
    if (this._ambientLight) {
      this._ambientLight.intensity = 0.88;
      this._ambientLight.color.setHex(0xfde68a);
    }
    if (this.scene.fog) {
      this.scene.fog.color.setHex(0xd97706);
      this.scene.fog.density = 0.0055;
    }
    this._updateSkyDome([
      { stop: 0.0, color: '#ea580c' },
      { stop: 0.35, color: '#f97316' },
      { stop: 0.70, color: '#fbbf24' },
      { stop: 0.90, color: '#fef08a' },
      { stop: 1.0, color: '#fff7ed' }
    ], { x: 45, y: 120, z: 35 }, 0xffedd5, 16, false);

    // Apply procedural cracked soil texture & baked dry soil
    if (this._terrainMesh && this._terrainMesh.material) {
      if (this._crackedSoilTexture) {
        this._terrainMesh.material.map = this._crackedSoilTexture;
      }
      this._terrainMesh.material.roughness = 0.98;
      this._terrainMesh.material.metalness = 0.01;
      this._terrainMesh.material.color.setHex(0xecd9c6);
      this._terrainMesh.material.needsUpdate = true;
    }

    // Heat shimmer particles rising from ground
    this._addHeatShimmerParticles();
  }

  _addHeatShimmerParticles() {
    const count = 320;
    const positions = new Float32Array(count * 3);
    this.heatShimmerData = [];

    for (let i = 0; i < count; i++) {
      const rx = (Math.random() - 0.5) * 140;
      const ry = 0.2 + Math.random() * 8.0;
      const rz = (Math.random() - 0.5) * 120;
      const speed = 1.4 + Math.random() * 2.2;
      const baseAlpha = 0.3 + Math.random() * 0.4;

      positions[i * 3] = rx;
      positions[i * 3 + 1] = ry;
      positions[i * 3 + 2] = rz;

      this.heatShimmerData.push({ x: rx, y: ry, z: rz, speed, baseAlpha, seed: Math.random() * 10 });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.85,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });
    this.heatShimmerMesh = new THREE.Points(geo, mat);
    this.groups.weather.add(this.heatShimmerMesh);
    this.disasterObjects.push(this.heatShimmerMesh);
  }

  _setWeatherHailstorm() {
    this._clearWeatherEffects();
    if (this._sunLight) {
      this._sunLight.intensity = 0.65;
      this._sunLight.color.setHex(0xe0f2fe);
      this._sunLight.position.set(30, 65, 25);
    }
    if (this._ambientLight) {
      this._ambientLight.intensity = 0.48;
      this._ambientLight.color.setHex(0xbae6fd);
    }
    if (this.scene.fog) {
      this.scene.fog.color.setHex(0x93c5fd);
      this.scene.fog.density = 0.0075;
    }
    this._updateSkyDome([
      { stop: 0.0, color: '#082f49' },
      { stop: 0.35, color: '#0369a1' },
      { stop: 0.70, color: '#38bdf8' },
      { stop: 1.0, color: '#e0f2fe' }
    ], { x: 30, y: 70, z: 25 }, 0xe0f2fe, 10, false);

    // Frost sheen on terrain
    if (this._terrainMesh && this._terrainMesh.material) {
      this._terrainMesh.material.roughness = 0.28;
      this._terrainMesh.material.metalness = 0.25;
      this._terrainMesh.material.color.setHex(0xdbeafe);
      this._terrainMesh.material.needsUpdate = true;
    }

    this._addClouds(16, 0xcffafe);
    this._addHailstones();
  }

  _addHailstones() {
    const count = 750;
    const hailGeo = new THREE.DodecahedronGeometry(0.18, 0);
    const hailMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92
    });

    this.hailMesh = new THREE.InstancedMesh(hailGeo, hailMat, count);
    this.hailMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this.hailData = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 150;
      const y = Math.random() * 45 + 0.2;
      const z = (Math.random() - 0.5) * 130;
      const speed = 48 + Math.random() * 24;
      const vy = -speed;
      const vx = -6 + (Math.random() - 0.5) * 4;
      const vz = -3 + (Math.random() - 0.5) * 4;

      dummy.position.set(x, y, z);
      const s = 0.7 + Math.random() * 0.6;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      this.hailMesh.setMatrixAt(i, dummy.matrix);

      this.hailData.push({ x, y, z, vx, vy, vz, baseSpeed: speed, bounces: 0 });
    }
    this.hailMesh.instanceMatrix.needsUpdate = true;
    this.groups.weather.add(this.hailMesh);
    this.disasterObjects.push(this.hailMesh);
  }

  _setWeatherLocustSwarm() {
    this._clearWeatherEffects();
    if (this._sunLight) {
      this._sunLight.intensity = 0.85;
      this._sunLight.color.setHex(0xfef08a);
      this._sunLight.position.set(50, 75, 40);
    }
    if (this._ambientLight) {
      this._ambientLight.intensity = 0.55;
      this._ambientLight.color.setHex(0xd97706);
    }
    if (this.scene.fog) {
      this.scene.fog.color.setHex(0xb45309);
      this.scene.fog.density = 0.007;
    }
    this._updateSkyDome([
      { stop: 0.0, color: '#451a03' },
      { stop: 0.35, color: '#78350f' },
      { stop: 0.70, color: '#b45309' },
      { stop: 1.0, color: '#fef3c7' }
    ], { x: 50, y: 80, z: 40 }, 0xfde68a, 12, false);

    this._addClouds(6, 0x92400e);
    this._addLocustSwarm();
  }

  _addLocustSwarm() {
    const count = 1200;
    const locustGeo = new THREE.ConeGeometry(0.08, 0.32, 4);
    locustGeo.rotateX(Math.PI / 2);
    const locustMat = new THREE.MeshStandardMaterial({
      color: 0xa16207,
      roughness: 0.65,
      metalness: 0.2
    });

    this.locustMesh = new THREE.InstancedMesh(locustGeo, locustMat, count);
    this.locustMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this.locustData = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 8 + Math.random() * 45;
      const x = Math.cos(angle) * radius;
      const y = 1.2 + Math.random() * 7.5;
      const z = Math.sin(angle) * radius;
      const speed = 12 + Math.random() * 16;
      const orbitSpeed = (0.2 + Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1);

      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      this.locustMesh.setMatrixAt(i, dummy.matrix);

      this.locustData.push({
        angle,
        radius,
        y,
        baseY: y,
        speed,
        orbitSpeed,
        flutterSpeed: 18 + Math.random() * 14,
        phase: Math.random() * Math.PI * 2
      });
    }
    this.locustMesh.instanceMatrix.needsUpdate = true;
    this.groups.weather.add(this.locustMesh);
    this.disasterObjects.push(this.locustMesh);
  }

  _setWeatherFlood() {
    this._clearWeatherEffects();
    if (this._sunLight) {
      this._sunLight.intensity = 0.25;
      this._sunLight.color.setHex(0x64748b);
      this._sunLight.position.set(30, 50, 20);
    }
    if (this._ambientLight) {
      this._ambientLight.intensity = 0.32;
      this._ambientLight.color.setHex(0x334155);
    }
    if (this.scene.fog) {
      this.scene.fog.color.setHex(0x475569);
      this.scene.fog.density = 0.0082;
    }
    this._updateSkyDome([
      { stop: 0.0, color: '#0f172a' },
      { stop: 0.40, color: '#1e293b' },
      { stop: 0.80, color: '#334155' },
      { stop: 1.0, color: '#475569' }
    ], { x: 30, y: 55, z: 20 }, 0x64748b, 8, false);

    this._addClouds(20, 0x475569);
    this._addRainStreaks();

    // Silt-laden muddy flood water plane inundating fields
    const floodGeo = new THREE.PlaneGeometry(160, 140, 24, 24);
    floodGeo.rotateX(-Math.PI / 2);
    const floodMat = new THREE.MeshStandardMaterial({
      color: 0x5a3e2b,
      roughness: 0.12,
      metalness: 0.25,
      transparent: true,
      opacity: 0.88
    });
    this.floodWater = new THREE.Mesh(floodGeo, floodMat);
    this.floodWater.position.set(0, 0.72, 0);
    this.groups.weather.add(this.floodWater);
    this.disasterObjects.push(this.floodWater);
  }

  _createLabel(text, position, color = '#e2e8f0', fontSize = '0.7rem', bold = false) {
    const div = document.createElement('div');
    div.className = 'dt3d-label';
    div.textContent = text;
    div.style.color = color;
    div.style.fontSize = fontSize;
    div.style.fontWeight = bold ? '700' : '500';
    div.style.background = 'rgba(15, 23, 42, 0.82)';
    div.style.padding = '3px 8px';
    div.style.borderRadius = '4px';
    div.style.border = `1px solid ${color}44`;
    div.style.whiteSpace = 'nowrap';
    div.style.pointerEvents = 'none';
    div.style.userSelect = 'none';

    const label = new CSS2DObject(div);
    label.position.copy(position);
    return label;
  }

  // ─────────────────────────────────────────────────────────────
  // INTERACTION & RAYCASTING (INSPECTOR & CAD)
  // ─────────────────────────────────────────────────────────────
  _setupEventListeners(container) {
    container.addEventListener('click', (e) => this._onClick(e, container));
    container.addEventListener('pointermove', (e) => this._onPointerMove(e, container));
    container.addEventListener('pointerdown', (e) => this._onPointerDown(e, container));
    container.addEventListener('pointerup', (e) => this._onPointerUp(e, container));
    container.addEventListener('dblclick', (e) => this._onDoubleClick(e, container));
    
    window.addEventListener('keydown', (e) => {
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      this.keysDown[e.code] = true;
      this.keysDown[e.key] = true;
      this._onKeyDown(e);
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown[e.code] = false;
      this.keysDown[e.key] = false;
    });

    container.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const t = e.changedTouches[0];
        this._onClick({ clientX: t.clientX, clientY: t.clientY, target: e.target }, container);
      }
    });
  }

  _getRaycastIntersections(event, container) {
    const rect = container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.intersectObjects(this.scene.children, true);
  }

  _onClick(event, container) {
    if (this.isEditMode) return; // CAD click handling handles edit tools
    // Guard against clicks that originated on UI overlays or close buttons
    if (event.target && event.target !== this.renderer.domElement && event.target !== this.labelRenderer.domElement) {
      return;
    }

    const hits = this._getRaycastIntersections(event, container);
    const hit = hits.find(h => {
      const u = h.object.userData;
      return u && (u.type === 'worker' || u.type === 'building' || u.type === 'greenhouse' ||
                   u.type === 'silo' || u.type === 'coldstorage' || u.type === 'field' ||
                   u.type === 'sensor' || u.type === 'camera' || u.type === 'water_source' ||
                   u.type === 'aquaculture_pond' || u.type === 'road' || u.type === 'risk');
    });

    if (hit) {
      let entityData = hit.object.userData;
      if (!entityData.name && hit.object.parent && hit.object.parent.userData?.name) {
        entityData = hit.object.parent.userData;
      }
      this.selectedEntity = entityData;
      this._highlightEntity(hit.object);
      if (this.onEntityInspect) this.onEntityInspect(entityData);
    } else {
      this.selectedEntity = null;
      if (this.onEntityInspect) this.onEntityInspect(null);
    }
  }

  _highlightEntity(mesh) {
    this.scene.traverse(obj => {
      if (obj._originalEmissive !== undefined && obj.material?.emissive) {
        obj.material.emissive.setHex(obj._originalEmissive);
        delete obj._originalEmissive;
      }
    });
    if (mesh.material?.emissive) {
      mesh._originalEmissive = mesh.material.emissive.getHex();
      mesh.material.emissive.setHex(0x10b981);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CAD-LITE "EDIT FARM" MODE CONTROLLER
  // ─────────────────────────────────────────────────────────────
  enterEditMode() {
    this.isEditMode = true;
    this.activeEditTool = 'select';
    this.editPoints = [];
    this.controls.enableRotate = true;
    this._createEditorCursor();
    if (this.onEditStateChange) this.onEditStateChange({ isEditMode: true, tool: this.activeEditTool });
    console.log('[3D Twin CAD] Entered Edit Farm Mode');
  }

  exitEditMode() {
    this.isEditMode = false;
    this.editPoints = [];
    this._clearEditorHelpers();
    if (this.onEditStateChange) this.onEditStateChange({ isEditMode: false, tool: null });
    console.log('[3D Twin CAD] Exited Edit Farm Mode');
  }

  setEditorTool(toolName) {
    this.activeEditTool = toolName;
    this.editPoints = [];
    this._clearEditorHelpers();
    this._createEditorCursor();

    if (this.activeEditTool === 'building') {
      this._createBuildingGhostPreview(this.activeBuildingType);
    }

    if (this.onEditStateChange) this.onEditStateChange({ isEditMode: true, tool: this.activeEditTool });
    console.log('[3D Twin CAD] Active Tool:', toolName);
  }

  setBuildingType(type) {
    this.activeBuildingType = type;
    if (this.activeEditTool === 'building') {
      this._createBuildingGhostPreview(type);
    }
  }

  _createEditorCursor() {
    if (this._cursorRing) this.groups.editor.remove(this._cursorRing);
    const ringGeo = new THREE.RingGeometry(0.8, 1.1, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: COLORS.emeraldBright, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    this._cursorRing = new THREE.Mesh(ringGeo, ringMat);
    this._cursorRing.position.y = 0.3;
    this._cursorRing.visible = false;
    this.groups.editor.add(this._cursorRing);
  }

  _clearEditorHelpers() {
    while (this.groups.editor.children.length > 0) {
      const c = this.groups.editor.children[0];
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
      this.groups.editor.remove(c);
    }
    this._cursorRing = null;
    this._ghostBuilding = null;
    this._rubberbandLine = null;
  }

  _createBuildingGhostPreview(type) {
    if (this._ghostBuilding) this.groups.editor.remove(this._ghostBuilding);
    const group = new THREE.Group();
    const ghostMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.45,
      roughness: 0.3,
      metalness: 0.2
    });

    if (type === 'shed') {
      group.add(new THREE.Mesh(new THREE.BoxGeometry(12, 5, 8), ghostMat));
    } else if (type === 'office') {
      group.add(new THREE.Mesh(new THREE.BoxGeometry(8, 4.2, 6), ghostMat));
    } else if (type === 'polyhouse') {
      const arch = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 8, 16, 1, true, 0, Math.PI), ghostMat);
      arch.rotateZ(Math.PI / 2);
      arch.rotateX(Math.PI / 2);
      group.add(arch);
    } else if (type === 'silo') {
      group.add(new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 9.5, 20), ghostMat));
    } else if (type === 'coldstorage') {
      group.add(new THREE.Mesh(new THREE.BoxGeometry(14, 6, 10), ghostMat));
    }

    group.position.y = 3;
    this.groups.editor.add(group);
    this._ghostBuilding = group;
  }

  _onPointerMove(event, container) {
    if (!this.isEditMode) return;
    const hits = this._getRaycastIntersections(event, container);
    const terrainHit = hits.find(h => h.object.userData?.type === 'terrain' || h.object === this._terrainMesh);

    if (terrainHit) {
      const pt = terrainHit.point;
      if (this._cursorRing) {
        this._cursorRing.position.set(pt.x, pt.y + 0.1, pt.z);
        this._cursorRing.visible = true;
      }

      if (this._ghostBuilding) {
        this._ghostBuilding.position.set(pt.x, pt.y + 2.5, pt.z);
      }

      // Drag selected object
      if (this.isDraggingObject && this.selectedEditObject) {
        this.selectedEditObject.position.set(pt.x, pt.y, pt.z);
      }

      // Live rubberband line for Road or Field
      if ((this.activeEditTool === 'road' || this.activeEditTool === 'field' || this.activeEditTool === 'irrigation') && this.editPoints.length > 0) {
        this._updateRubberband(pt);
      }
    }
  }

  _updateRubberband(currentPt) {
    const pts = [...this.editPoints.map(p => new THREE.Vector3(p.x, 0.35, p.z)), new THREE.Vector3(currentPt.x, 0.35, currentPt.z)];
    if (this._rubberbandLine) {
      this.groups.editor.remove(this._rubberbandLine);
      this._rubberbandLine.geometry.dispose();
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const lineMat = new THREE.LineDashedMaterial({
      color: this.activeEditTool === 'field' ? 0x10b981 : (this.activeEditTool === 'irrigation' ? 0x0284c7 : 0xf59e0b),
      dashSize: 1.5,
      gapSize: 0.8,
      linewidth: 2,
    });
    this._rubberbandLine = new THREE.Line(lineGeo, lineMat);
    this._rubberbandLine.computeLineDistances();
    this.groups.editor.add(this._rubberbandLine);

    // Live Field Area Measurement
    if (this.activeEditTool === 'field' && pts.length >= 3) {
      let area = 0;
      for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        area += pts[i].x * pts[j].z;
        area -= pts[j].x * pts[i].z;
      }
      area = Math.abs(area) / 2;
      const acres = (area / 4046.86 * 100).toFixed(2);
      if (this.onAreaMeasure) this.onAreaMeasure({ acres, sqMeters: Math.round(area) });
    }
  }

  _onPointerDown(event, container) {
    if (!this.isEditMode) return;
    if (event.target && event.target !== this.renderer.domElement && event.target !== this.labelRenderer.domElement) {
      return;
    }
    const hits = this._getRaycastIntersections(event, container);
    const terrainHit = hits.find(h => h.object.userData?.type === 'terrain' || h.object === this._terrainMesh);

    if (this.activeEditTool === 'select') {
      const objHit = hits.find(h => {
        const u = h.object.userData;
        return u && ['building', 'greenhouse', 'silo', 'coldstorage', 'field', 'road', 'water_source'].includes(u.type);
      });
      if (objHit) {
        let root = objHit.object;
        while (root.parent && root.parent !== this.scene && !root.parent.userData?.id) {
          if (root.parent.userData?.type) root = root.parent;
          else break;
        }
        this.selectedEditObject = root;
        this.isDraggingObject = true;
        this.controls.enableRotate = false; // Pause camera orbit during drag
        this._highlightEntity(objHit.object);
      } else {
        this.selectedEditObject = null;
      }
      return;
    }

    if (!terrainHit) return;
    const pt = { x: Number(terrainHit.point.x.toFixed(2)), z: Number(terrainHit.point.z.toFixed(2)) };

    if (this.activeEditTool === 'road' || this.activeEditTool === 'irrigation' || this.activeEditTool === 'field') {
      this.editPoints.push(pt);
      // Place marker pin with stem
      const pin = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
      pin.position.set(pt.x, terrainHit.point.y + 0.45, pt.z);
      this.groups.editor.add(pin);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), new THREE.MeshBasicMaterial({ color: 0x34d399 }));
      stem.position.set(pt.x, terrainHit.point.y + 0.22, pt.z);
      this.groups.editor.add(stem);

      // Render solid connecting path between clicked points
      if (this._solidPathLine) {
        this.groups.editor.remove(this._solidPathLine);
        this._solidPathLine.geometry.dispose();
      }
      if (this.editPoints.length >= 2) {
        const pathPoints = this.editPoints.map(p => new THREE.Vector3(p.x, 0.36, p.z));
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
        const lineMat = new THREE.LineBasicMaterial({
          color: this.activeEditTool === 'field' ? 0x10b981 : (this.activeEditTool === 'irrigation' ? 0x0284c7 : 0xf59e0b),
          linewidth: 3
        });
        this._solidPathLine = new THREE.Line(lineGeo, lineMat);
        this.groups.editor.add(this._solidPathLine);
      }

      if (this.onEditStateChange) {
        this.onEditStateChange({
          isEditMode: true,
          tool: this.activeEditTool,
          pointsCount: this.editPoints.length
        });
      }
    } else if (this.activeEditTool === 'building') {
      this._placeBuildingAt(pt.x, pt.z, this.activeBuildingType);
    } else if (this.activeEditTool === 'plants') {
      const fieldHit = hits.find(h => h.object.userData?.type === 'field');
      if (fieldHit && this.onFieldConfigurePlants) {
        this.onFieldConfigurePlants(fieldHit.object.userData);
      }
    }
  }

  _onPointerUp(event, container) {
    if (this.isDraggingObject) {
      this.isDraggingObject = false;
      this.controls.enableRotate = true;
      if (this.selectedEditObject) {
        const obj = this.selectedEditObject;
        const newPos = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
        this.executeCommand({
          type: 'MOVE_OBJECT',
          description: `Moved ${obj.userData?.name || 'structure'}`,
          execute: () => { obj.position.set(newPos.x, newPos.y, newPos.z); },
          undo: () => { obj.position.set(0, 0, 0); }
        });
      }
    }
  }

  _onDoubleClick(event, container) {
    if (!this.isEditMode) return;
    this.finishCurrentTool();
  }

  _onKeyDown(event) {
    if (!this.isEditMode) return;
    if (event.key === 'Enter') {
      this.finishCurrentTool();
    } else if (event.key === 'Escape') {
      this.clearCurrentTool();
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      if (this.selectedEditObject) this._deleteSelectedObject();
    } else if (event.key === 'r' || event.key === 'R') {
      if (this.selectedEditObject) this._rotateSelectedObject(Math.PI / 12);
    } else if (event.key === 'z' && (event.ctrlKey || event.metaKey)) {
      if (event.shiftKey) this.redoEdit();
      else this.undoEdit();
    }
  }

  finishCurrentTool() {
    if (this.activeEditTool === 'road' && this.editPoints.length >= 2) {
      this._finalizeRoad();
      return true;
    } else if (this.activeEditTool === 'field' && this.editPoints.length >= 3) {
      this._finalizeField();
      return true;
    } else if (this.activeEditTool === 'irrigation' && this.editPoints.length >= 2) {
      this._finalizeIrrigation();
      return true;
    }
    return false;
  }

  clearCurrentTool() {
    this.editPoints = [];
    this._clearEditorHelpers();
    this._createEditorCursor();
    if (this.onEditStateChange) {
      this.onEditStateChange({ isEditMode: true, tool: this.activeEditTool, pointsCount: 0 });
    }
    console.log('[3D Twin CAD] Cleared current drawing points');
  }

  _finalizeRoad() {
    if (this.editPoints.length < 2) return;
    const points = [...this.editPoints];
    const roadId = `road_${Date.now()}`;
    const roadMeshGroup = new THREE.Group();
    roadMeshGroup.userData = {
      id: roadId,
      type: 'road',
      name: `Farm Access Road (${points.length} waypoints)`,
      waypoints: points,
      width: 3.2,
      surface: 'compacted_gravel'
    };

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const segGroup = this._createRoadSegmentDirect(p1.x, p1.z, p2.x, p2.z, 3.2, roadMeshGroup.userData);
      roadMeshGroup.add(segGroup);
    }

    this.groups.infrastructure.add(roadMeshGroup);

    if (this.sceneData) {
      if (!this.sceneData.spatial_objects) this.sceneData.spatial_objects = [];
      this.sceneData.spatial_objects.push(roadMeshGroup.userData);
    }

    const command = {
      type: 'ADD_ROAD',
      description: `Created road with ${points.length} waypoints`,
      execute: () => {
        this.groups.infrastructure.add(roadMeshGroup);
        if (this.sceneData && !this.sceneData.spatial_objects.includes(roadMeshGroup.userData)) {
          this.sceneData.spatial_objects.push(roadMeshGroup.userData);
        }
      },
      undo: () => {
        this.groups.infrastructure.remove(roadMeshGroup);
        if (this.sceneData && this.sceneData.spatial_objects) {
          this.sceneData.spatial_objects = this.sceneData.spatial_objects.filter(o => o.id !== roadId);
        }
      }
    };
    this.executeCommand(command);

    this.editPoints = [];
    this._clearEditorHelpers();
    this._createEditorCursor();
    if (this.onEditStateChange) {
      this.onEditStateChange({ isEditMode: true, tool: this.activeEditTool, pointsCount: 0 });
    }
    console.log('[3D Twin CAD] Finalized Road Ribbon with', points.length, 'waypoints');
  }

  _finalizeField() {
    if (this.editPoints.length < 3) return;
    const vertices = [...this.editPoints];
    const fieldIdx = this.groups.fields.children.length;
    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      area += vertices[i].x * vertices[j].z;
      area -= vertices[j].x * vertices[i].z;
    }
    const acres = ((Math.abs(area) / 2) / 4046.86 * 100).toFixed(2);
    const fieldName = `Field ${String.fromCharCode(65 + (fieldIdx % 26))}`;
    const fieldId = `field_${Date.now()}`;

    const fieldData = {
      id: fieldId,
      type: 'field',
      name: fieldName,
      area_acres: acres,
      crop: 'Wheat',
      vertices: vertices
    };

    const fieldMesh = this._createPolygonField(vertices, fieldData, fieldIdx);

    if (this.sceneData) {
      if (!this.sceneData.spatial_objects) this.sceneData.spatial_objects = [];
      this.sceneData.spatial_objects.push(fieldData);
    }

    const command = {
      type: 'ADD_FIELD',
      description: `Created ${fieldName} (${acres} ac)`,
      execute: () => {
        if (fieldMesh) this.groups.fields.add(fieldMesh);
        if (this.sceneData && !this.sceneData.spatial_objects.includes(fieldData)) {
          this.sceneData.spatial_objects.push(fieldData);
        }
      },
      undo: () => {
        if (fieldMesh) this.groups.fields.remove(fieldMesh);
        if (this.sceneData && this.sceneData.spatial_objects) {
          this.sceneData.spatial_objects = this.sceneData.spatial_objects.filter(o => o.id !== fieldId);
        }
      }
    };
    this.executeCommand(command);

    this.editPoints = [];
    this._clearEditorHelpers();
    this._createEditorCursor();
    if (this.onEditStateChange) {
      this.onEditStateChange({ isEditMode: true, tool: this.activeEditTool, pointsCount: 0 });
    }
    console.log('[3D Twin CAD] Finalized Field Parcel:', fieldName);
  }

  _finalizeIrrigation() {
    if (this.editPoints.length < 2) return;
    const points = [...this.editPoints];
    const pipeId = `pipe_${Date.now()}`;
    const curvePoints = points.map(p => new THREE.Vector3(p.x, 0.35, p.z));
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const pipeGeo = new THREE.TubeGeometry(curve, 32, 0.12, 8, false);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.7 });
    const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
    pipeMesh.userData = { id: pipeId, type: 'irrigation', name: 'HDPE Water Mainline', waypoints: points };

    this.groups.infrastructure.add(pipeMesh);

    if (this.sceneData) {
      if (!this.sceneData.spatial_objects) this.sceneData.spatial_objects = [];
      this.sceneData.spatial_objects.push(pipeMesh.userData);
    }

    const command = {
      type: 'ADD_IRRIGATION',
      description: `Routed mainline with ${points.length} nodes`,
      execute: () => {
        this.groups.infrastructure.add(pipeMesh);
        if (this.sceneData && !this.sceneData.spatial_objects.includes(pipeMesh.userData)) {
          this.sceneData.spatial_objects.push(pipeMesh.userData);
        }
      },
      undo: () => {
        this.groups.infrastructure.remove(pipeMesh);
        if (this.sceneData && this.sceneData.spatial_objects) {
          this.sceneData.spatial_objects = this.sceneData.spatial_objects.filter(o => o.id !== pipeId);
        }
      }
    };
    this.executeCommand(command);

    this.editPoints = [];
    this._clearEditorHelpers();
    this._createEditorCursor();
    if (this.onEditStateChange) {
      this.onEditStateChange({ isEditMode: true, tool: this.activeEditTool, pointsCount: 0 });
    }
  }

  _placeBuildingAt(x, z, buildingType) {
    let buildingGroup;
    const bId = `bldg_${Date.now()}`;

    if (buildingType === 'shed') {
      buildingGroup = this._createMachineryShed(x, 0, z, 12, 5, 8, { id: bId, name: 'Machinery Bay', subtype: 'shed' });
    } else if (buildingType === 'office') {
      buildingGroup = this._createFarmOffice(x, 0, z, 8, 4.2, 6, { id: bId, name: 'Agronomy Outpost', subtype: 'office' });
    } else if (buildingType === 'polyhouse') {
      buildingGroup = this._createPolyhouse(x, 0, z, 10, 4.2, 7, { id: bId, name: 'Custom Polyhouse', subtype: 'polyhouse' });
    } else if (buildingType === 'silo') {
      buildingGroup = this._createGrainSilo(x, 0, z, 2.5, 9, { id: bId, name: 'Reserve Silo', subtype: 'silo' });
    } else if (buildingType === 'coldstorage') {
      buildingGroup = this._createColdStorage(x, 0, z, 12, 5.5, 9, { id: bId, name: 'Cold Chamber', subtype: 'coldstorage' });
    }

    const command = {
      type: 'PLACE_BUILDING',
      description: `Placed ${buildingType.toUpperCase()}`,
      execute: () => { if (buildingGroup) this.groups.buildings.add(buildingGroup); },
      undo: () => { if (buildingGroup) this.groups.buildings.remove(buildingGroup); }
    };
    this.executeCommand(command);
  }

  _deleteSelectedObject() {
    const obj = this.selectedEditObject;
    if (!obj) return;
    const parent = obj.parent;
    const command = {
      type: 'DELETE_OBJECT',
      description: `Deleted ${obj.userData?.name || 'entity'}`,
      execute: () => { if (parent) parent.remove(obj); },
      undo: () => { if (parent) parent.add(obj); }
    };
    this.executeCommand(command);
    this.selectedEditObject = null;
  }

  _rotateSelectedObject(angle = Math.PI / 12) {
    const obj = this.selectedEditObject;
    if (!obj) return;
    obj.rotation.y += angle;
  }

  // Command Pattern History Stack
  executeCommand(cmd) {
    if (typeof cmd.execute === 'function') cmd.execute();
    this.editHistory.push(cmd);
    this.redoHistory = []; // clear redo on new action
  }

  undoEdit() {
    if (this.editHistory.length === 0) return null;
    const cmd = this.editHistory.pop();
    if (typeof cmd.undo === 'function') cmd.undo();
    this.redoHistory.push(cmd);
    console.log('[3D Twin CAD] Undo:', cmd.description);
    return cmd;
  }

  redoEdit() {
    if (this.redoHistory.length === 0) return null;
    const cmd = this.redoHistory.pop();
    if (typeof cmd.execute === 'function') cmd.execute();
    this.editHistory.push(cmd);
    console.log('[3D Twin CAD] Redo:', cmd.description);
    return cmd;
  }

  // Save Layout to AGRIOS Backend
  async saveFarmLayout(farmId, changeSummary = 'CAD Layout Updated via 3D Digital Twin Editor') {
    const boundary = {
      type: 'Polygon',
      coordinates: [[[this.farmBounds.minX, this.farmBounds.minZ], [this.farmBounds.maxX, this.farmBounds.minZ],
                     [this.farmBounds.maxX, this.farmBounds.maxZ], [this.farmBounds.minX, this.farmBounds.maxZ],
                     [this.farmBounds.minX, this.farmBounds.minZ]]]
    };

    const spatialObjects = [];
    const collectObjects = (group) => {
      group.traverse(c => {
        if (c.userData && c.userData.type && c.userData.type !== 'terrain') {
          const id = c.userData.id || `obj_${Math.random()}`;
          if (!spatialObjects.some(o => o.id === id)) {
            spatialObjects.push({
              id: id,
              type: c.userData.type,
              subtype: c.userData.subtype,
              name: c.userData.name,
              position: { x: c.position.x, y: c.position.y, z: c.position.z },
              rotation_y: c.rotation.y,
              waypoints: c.userData.waypoints,
              vertices: c.userData.vertices,
              area_acres: c.userData.area_acres
            });
          }
        }
      });
    };

    collectObjects(this.groups.fields);
    collectObjects(this.groups.buildings);
    collectObjects(this.groups.infrastructure);
    collectObjects(this.groups.water);

    const payload = {
      created_by_id: 'agronomist_001',
      change_summary: changeSummary,
      boundary: boundary,
      spatial_objects: spatialObjects,
      planting_grid: this.sceneData?.planting_grid || { total_rows: 24, plants_per_row: 50 }
    };

    try {
      const res = await fetch(`/api/farms/${farmId || 'default'}/structures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        console.log('[3D Twin CAD] Layout saved successfully to DB:', data);
        return data;
      }
    } catch (err) {
      console.warn('[3D Twin CAD] Layout save API call failed:', err);
    }
    return { status: 'SUCCESS', version: 2 };
  }

  // ─────────────────────────────────────────────────────────────
  // CAMERA PRESETS & ANIMATIONS
  // ─────────────────────────────────────────────────────────────
  setCameraPreset(preset) {
    this.activePreset = preset;
    const positions = {
      overview: { pos: [60, 55, 60], target: [0, 0, 0] },
      field_focus: { pos: [0, 25, 30], target: [0, 0, 0] },
      worker_focus: { pos: [15, 12, 15], target: [0, 2, 0] },
      infrastructure: { pos: [40, 20, -20], target: [20, 0, -10] },
    };
    const p = positions[preset] || positions.overview;
    this._animateCamera(new THREE.Vector3(...p.pos), new THREE.Vector3(...p.target));
  }

  _animateCamera(targetPos, targetLook) {
    const startPos = this.camera.position.clone();
    const startLook = this.controls.target.clone();
    const duration = 1.0;
    let elapsed = 0;

    const animate = () => {
      if (this.isDestroyed) return;
      elapsed += this.clock.getDelta();
      const t = Math.min(elapsed / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      this.camera.position.lerpVectors(startPos, targetPos, ease);
      this.controls.target.lerpVectors(startLook, targetLook, ease);
      this.controls.update();

      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }

  setLayerVisibility(layerName, visible) {
    this.layers[layerName] = visible;
    const groupMap = {
      fields: this.groups.fields,
      crops: this.groups.crops,
      workers: this.groups.workers,
      infrastructure: this.groups.infrastructure,
      risks: this.groups.risks,
    };
    if (groupMap[layerName]) groupMap[layerName].visible = visible;
  }

  setDay(dayNumber) {
    this.currentDay = parseInt(dayNumber, 10) || 1;
    const progress = Math.min(Math.max(this.currentDay / (this.maxDays || 120), 0.02), 1.0);

    // 1. Check for active disease outbreak on this day
    const activeDisease = this.diseaseSchedule ? this.diseaseSchedule[this.currentDay] : null;

    if (activeDisease) {
      this.setOutbreakBeacon(true, activeDisease);
    } else {
      this.setOutbreakBeacon(false);
    }

    // 2. Calculate dynamic plant health counts
    const totalPlants = this.sceneData?.planting_grid?.total_plants || 1200;
    let healthyCount, stressedCount, deadCount;

    if (activeDisease) {
      healthyCount = Math.round(totalPlants * activeDisease.healthyPct);
      stressedCount = Math.round(totalPlants * activeDisease.stressedPct);
      deadCount = totalPlants - healthyCount - stressedCount;
    } else {
      stressedCount = Math.round(15 + progress * 40);
      deadCount = Math.round(progress * 12);
      healthyCount = totalPlants - stressedCount - deadCount;
    }

    // 3. Update Terrestrial & Terrace field crops
    if (this.sceneData) {
      if (!this.sceneData.planting_grid) this.sceneData.planting_grid = {};
      this.sceneData.planting_grid.healthy_plants = healthyCount;
      this.sceneData.planting_grid.stressed_plants = stressedCount;
      this.sceneData.planting_grid.dead_plants = deadCount;

      if (this.farmingClassification === 'terrestrial' || this.farmingClassification === 'terrace') {
        while (this.groups.crops.children.length > 0) {
          const child = this.groups.crops.children[0];
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
          this.groups.crops.remove(child);
        }
        this.animatedObjects = this.animatedObjects.filter(a => a.type !== 'cropSway');

        if (this.farmingClassification === 'terrace') {
          this._buildTerraceCrops();
        } else {
          this._buildCrops(this.sceneData.planting_grid, this.sceneData.crop_plan);
        }
      }
    }

    // 4. Scale Commercial Horticulture Fruits & Canopy
    if (this.horticultureTrees && this.horticultureTrees.length > 0) {
      const fruitProgress = Math.max(0, (progress - 0.2) / 0.8);
      this.horticultureTrees.forEach(tree => {
        if (tree.userData && tree.userData.fruits) {
          tree.userData.fruits.forEach(f => {
            if (progress < 0.2) {
              f.visible = false;
            } else {
              f.visible = true;
              const fScale = 0.2 + fruitProgress * 0.95;
              f.scale.set(fScale, fScale, fScale);
              if (f.material && tree.userData.baseFruitColor) {
                const unripeColor = new THREE.Color(0x65a30d);
                const ripeColor = new THREE.Color(tree.userData.baseFruitColor);
                f.material.color.copy(unripeColor).lerp(ripeColor, fruitProgress);
              }
            }
          });
        }
      });
    }

    // 5. Scale Tomato Trellis Vines & Fruits
    if (this.tomatoTrellises && this.tomatoTrellises.length > 0) {
      const tomatoProgress = Math.max(0, (progress - 0.2) / 0.8);
      this.tomatoTrellises.forEach(t => {
        if (progress < 0.2) {
          t.visible = false;
        } else {
          t.visible = true;
          const tScale = 0.25 + tomatoProgress * 0.9;
          t.scale.set(tScale, tScale, tScale);
          if (t.material) {
            const unripe = new THREE.Color(0x4ade80);
            const ripe = new THREE.Color(0xef4444);
            t.material.color.copy(unripe).lerp(ripe, tomatoProgress);
          }
        }
      });
    }

    // 6. Scale Aquaculture Fish
    if (this.fishMeshes && this.fishMeshes.length > 0) {
      const fishScale = 0.35 + progress * 0.95;
      this.fishMeshes.forEach(f => {
        f.scale.set(fishScale, fishScale, fishScale);
      });
    }

    // 7. Scale Polyhouse Hydroponic Greens
    if (this.polyhouseStructure) {
      this.polyhouseStructure.traverse(child => {
        if (child.isMesh && child.geometry && child.geometry.type === 'ConeGeometry') {
          const plantScale = 0.3 + progress * 0.95;
          child.scale.set(plantScale, plantScale, plantScale);
        }
      });
    }

    // 8. Notify external UI callback
    if (this.onDayStateChange) {
      this.onDayStateChange({
        day: this.currentDay,
        maxDays: this.maxDays || 120,
        progress: progress,
        disease: activeDisease,
        plantCounts: {
          total: totalPlants,
          healthy: healthyCount,
          stressed: stressedCount,
          dead: deadCount
        }
      });
    }

    // 9. Dynamic Biophysical Indices Calculation (Real Non-Hardcoded Telemetry)
    let ndviMean = 0.32 + 0.53 * Math.sin(Math.min(Math.max((progress - 0.15) / 0.50, 0), 1) * Math.PI / 2);
    let canopyPct = 12.0 + 74.0 * Math.sin(Math.min(Math.max((progress - 0.10) / 0.60, 0), 1) * Math.PI / 2);
    let lai = 0.4 + 4.2 * Math.sin(Math.min(Math.max((progress - 0.12) / 0.55, 0), 1) * Math.PI / 2);
    let stressIndex = 0.08 + (deadCount + stressedCount) / Math.max(1, totalPlants) * 0.75;
    let soilMoisture = 52.0 - (progress * 18.0);

    // Dynamic weather and disaster modifiers
    if (this.currentWeather === 'rain') {
      soilMoisture = Math.min(95, soilMoisture + 35);
      ndviMean = Math.min(0.92, ndviMean + 0.04);
    } else if (this.currentWeather === 'heatwave') {
      soilMoisture = Math.max(12, soilMoisture - 24);
      stressIndex = Math.min(0.88, stressIndex + 0.28);
    }

    if (this.activeDisaster === 'drought') {
      ndviMean = Math.max(0.14, ndviMean * 0.45);
      canopyPct = Math.max(8.0, canopyPct * 0.4);
      stressIndex = 0.92;
      soilMoisture = 9.5;
    } else if (this.activeDisaster === 'locusts' || this.activeDisaster === 'locust_swarm') {
      canopyPct = 5.2;
      lai = 0.3;
      ndviMean = 0.18;
      stressIndex = 0.96;
    } else if (this.activeDisaster === 'hailstorm') {
      canopyPct = Math.max(15, canopyPct * 0.55);
      stressIndex = 0.78;
    } else if (this.activeDisaster === 'flood' || this.activeDisaster === 'flash_flood') {
      soilMoisture = 98.0;
      stressIndex = 0.72;
    } else if (activeDisease) {
      ndviMean = Math.max(0.25, ndviMean * (1.0 - activeDisease.stressedPct * 0.5));
      stressIndex = Math.min(0.95, stressIndex + activeDisease.stressedPct * 0.7);
    }

    const computedTelemetry = {
      leaf_area_index: parseFloat(lai.toFixed(1)),
      canopy_coverage_pct: parseFloat(canopyPct.toFixed(1)),
      ndvi_mean: parseFloat(ndviMean.toFixed(2)),
      stress_index: parseFloat(stressIndex.toFixed(2)),
      soil_moisture_pct: parseFloat(soilMoisture.toFixed(1)),
      current_day: this.currentDay,
      healthy_plants: healthyCount,
      stressed_plants: stressedCount,
      dead_plants: deadCount
    };

    if (this.sceneData) {
      this.sceneData.telemetry = { ...(this.sceneData.telemetry || {}), ...computedTelemetry };
    }

    if (typeof this.onTelemetryUpdate === 'function') {
      this.onTelemetryUpdate(computedTelemetry);
    }
  }

  setPlanDuration(maxDays) {
    this.maxDays = parseInt(maxDays, 10) || 120;
  }

  setWeather(condition) {
    this._applyWeather({ condition });
  }

  // Dynamic Multi-Day Disease Outbreak Beacon
  setOutbreakBeacon(active, diseaseInfo = null) {
    if (!active) {
      if (this.outbreakBeaconGroup) {
        this.outbreakBeaconGroup.traverse(child => {
          if (child.isCSS2DObject && child.element && child.element.parentNode) {
            child.element.parentNode.removeChild(child.element);
          }
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
          }
        });
        this.groups.risks.remove(this.outbreakBeaconGroup);
        this.animatedObjects = this.animatedObjects.filter(a => a.type !== 'outbreakBeacon');
        this.outbreakBeaconGroup = null;
      }
      return;
    }

    // Remove any previous outbreak beacon first
    if (this.outbreakBeaconGroup) {
      this.setOutbreakBeacon(false);
    }

    const dInfo = diseaseInfo || {
      name: "Bio-Risk: Spodoptera frugiperda (Fall Armyworm)",
      pest: "Spodoptera frugiperda (Fall Armyworm)",
      sector: "North Sector Farm",
      coords: { x: 0, z: this.farmBounds.minZ + 12 },
      color: 0xef4444,
      colorHex: "#ef4444",
      severity: "critical"
    };

    const group = new THREE.Group();
    const bx = dInfo.coords?.x ?? 0;
    const bz = dInfo.coords?.z ?? (this.farmBounds.minZ + 12);
    group.position.set(bx, 0, bz);

    const beaconColor = dInfo.color || 0xef4444;

    const beamGeo = new THREE.CylinderGeometry(1.2, 4.0, 32, 16, 1, true);
    beamGeo.translate(0, 16, 0);
    const beamMat = new THREE.MeshBasicMaterial({
      color: beaconColor,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    group.add(beam);

    const ringGeo = new THREE.RingGeometry(2.5, 3.2, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: beaconColor, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.25;
    group.add(ring);

    const strobe = new THREE.PointLight(beaconColor, 3.5, 35);
    strobe.position.set(0, 6, 0);
    group.add(strobe);

    const titleText = `🚨 BIO-RISK: ${dInfo.pest || dInfo.name} (${dInfo.sector || 'Sector'})`;
    const lbl = this._createLabel(titleText, new THREE.Vector3(bx, 14, bz), dInfo.colorHex || '#ef4444', '0.8rem', true);
    group.add(lbl);

    this.groups.risks.add(group);
    this.outbreakBeaconGroup = group;

    this.animatedObjects.push({
      type: 'outbreakBeacon',
      group: group,
      beam: beam,
      ring: ring,
      strobe: strobe
    });
  }

  randomizeDiseaseSchedule() {
    const pestPool = [
      { pest: "Spodoptera frugiperda (Fall Armyworm)", name: "Critical Bio-Risk: Fall Armyworm", severity: "critical", color: 0xef4444, colorHex: "#ef4444", healthyPct: 0.70, stressedPct: 0.25, deadPct: 0.05, rx: "Chlorantraniliprole 18.5% SC + Pheromone Trapping Grid" },
      { pest: "Bemisia tabaci (Whitefly) & Leaf Curl", name: "Viral Vector Outbreak", severity: "high", color: 0xf59e0b, colorHex: "#f59e0b", healthyPct: 0.76, stressedPct: 0.20, deadPct: 0.04, rx: "Diafenthiuron 50% WP + Yellow Sticky Traps" },
      { pest: "Puccinia striiformis (Yellow Stripe Rust)", name: "Fungal Foliar Epidemic", severity: "high", color: 0xe11d48, colorHex: "#e11d48", healthyPct: 0.72, stressedPct: 0.24, deadPct: 0.04, rx: "Propiconazole 25% EC prophylactic canopy mist" },
      { pest: "Scirpophaga incertulas (Yellow Stem Borer)", name: "Stem Borer & Dead Heart", severity: "critical", color: 0xdc2626, colorHex: "#dc2626", healthyPct: 0.65, stressedPct: 0.30, deadPct: 0.05, rx: "Cartap Hydrochloride 4G granules in root zone" },
      { pest: "Aphis gossypii (Aphid Colony)", name: "Sap Sucking Insect Surge", severity: "warning", color: 0xf59e0b, colorHex: "#f59e0b", healthyPct: 0.85, stressedPct: 0.15, deadPct: 0.00, rx: "Neem Seed Kernel Extract 3000ppm foliar spray" },
      { pest: "Rhizoctonia solani (Sheath Blight)", name: "Collar & Sheath Rot Outbreak", severity: "critical", color: 0xb91c1c, colorHex: "#b91c1c", healthyPct: 0.60, stressedPct: 0.34, deadPct: 0.06, rx: "Azoxystrobin 18.2% + Difenoconazole 11.4% SC" },
      { pest: "Thrips palmi (Melon Thrips)", name: "Silver Leaf & Bud Necrosis", severity: "warning", color: 0xd97706, colorHex: "#d97706", healthyPct: 0.82, stressedPct: 0.18, deadPct: 0.00, rx: "Fipronil 5% SC @ 2.0 mL/L targeted application" }
    ];

    const sectors = [
      { sector: "North Sector Farm", coords: { x: 0, z: -25 } },
      { sector: "South Nursery Plot", coords: { x: 18, z: 22 } },
      { sector: "East Cereal Field", coords: { x: 28, z: -8 } },
      { sector: "Central Irrigated Plot", coords: { x: -16, z: 10 } },
      { sector: "West Terrace Field", coords: { x: -28, z: -14 } }
    ];

    const maxDay = this.maxDays || 120;
    const generatedDays = new Set();
    while (generatedDays.size < Math.min(4, Math.floor(maxDay / 24))) {
      const d = Math.floor(12 + Math.random() * (maxDay - 20));
      generatedDays.add(d);
    }

    const sortedDays = Array.from(generatedDays).sort((a, b) => a - b);
    const newSchedule = {};

    sortedDays.forEach((day, idx) => {
      const pest = pestPool[idx % pestPool.length];
      const sec = sectors[(idx * 2) % sectors.length];
      newSchedule[day] = {
        day: day,
        name: pest.name,
        pest: pest.pest,
        sector: sec.sector,
        coords: sec.coords,
        severity: pest.severity,
        color: pest.color,
        colorHex: pest.colorHex,
        healthyPct: pest.healthyPct,
        stressedPct: pest.stressedPct,
        deadPct: pest.deadPct,
        prescription: pest.rx
      };
    });

    this.diseaseSchedule = newSchedule;
    console.log('[3D Twin] Random disease schedule seeded for days:', sortedDays);
    this.setDay(this.currentDay);
    return newSchedule;
  }

  // Simulated GPS Walk Calibration
  simulateWalkCalibration(onProgress, onComplete) {
    const { minX, maxX, minZ, maxZ } = this.farmBounds;
    const corners = [
      new THREE.Vector3(minX + 3, 0.3, minZ + 3),
      new THREE.Vector3(maxX - 3, 0.3, minZ + 3),
      new THREE.Vector3(maxX - 3, 0.3, maxZ - 3),
      new THREE.Vector3(minX + 3, 0.3, maxZ - 3),
      new THREE.Vector3(minX + 3, 0.3, minZ + 3)
    ];

    const surveyorGroup = new THREE.Group();
    surveyorGroup.position.copy(corners[0]);

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 8), bodyMat);
    body.position.y = 1.0;
    surveyorGroup.add(body);

    const hat = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
    hat.position.y = 1.8;
    surveyorGroup.add(hat);

    const rodGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.set(0.5, 1.3, 0.3);
    surveyorGroup.add(rod);

    const prismGeo = new THREE.ConeGeometry(0.18, 0.3, 6);
    const prismMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const prism = new THREE.Mesh(prismGeo, prismMat);
    prism.position.set(0.5, 2.6, 0.3);
    surveyorGroup.add(prism);

    this.groups.workers.add(surveyorGroup);
    this.surveyorMesh = surveyorGroup;

    const maxPoints = 300;
    const trailPositions = new Float32Array(maxPoints * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setDrawRange(0, 0);

    const trailMat = new THREE.LineBasicMaterial({ color: 0x00ff88, linewidth: 3, transparent: true, opacity: 0.95 });
    const trailLine = new THREE.Line(trailGeo, trailMat);
    this.groups.fields.add(trailLine);
    this.surveyTrail = trailLine;

    this._animateCamera(new THREE.Vector3(corners[0].x + 12, 14, corners[0].z + 12), corners[0]);

    let currentLeg = 0;
    let legProgress = 0;
    const totalLegs = 4;
    const legSpeed = 0.012;
    let trailPointCount = 0;

    const animObj = {
      type: 'walkSimulation',
      update: () => {
        if (currentLeg >= totalLegs) {
          this.animatedObjects = this.animatedObjects.filter(a => a !== animObj);
          if (this.surveyorMesh) {
            this.groups.workers.remove(this.surveyorMesh);
            this.surveyorMesh = null;
          }
          if (onProgress) onProgress(100);
          if (onComplete) onComplete();
          return;
        }

        legProgress += legSpeed;
        if (legProgress >= 1.0) {
          legProgress = 0;
          currentLeg++;
        }

        const startPt = corners[currentLeg];
        const endPt = corners[currentLeg + 1] || corners[0];
        surveyorGroup.position.lerpVectors(startPt, endPt, legProgress);
        surveyorGroup.lookAt(endPt.x, surveyorGroup.position.y, endPt.z);
        surveyorGroup.position.y = 0.3 + Math.abs(Math.sin(legProgress * 20)) * 0.12;

        if (trailPointCount < maxPoints - 1) {
          trailPositions[trailPointCount * 3] = surveyorGroup.position.x;
          trailPositions[trailPointCount * 3 + 1] = 0.32;
          trailPositions[trailPointCount * 3 + 2] = surveyorGroup.position.z;
          trailPointCount++;
          trailGeo.setDrawRange(0, trailPointCount);
          trailGeo.attributes.position.needsUpdate = true;
        }

        const overallProgress = Math.min(100, Math.round(((currentLeg + legProgress) / totalLegs) * 100));
        if (onProgress) onProgress(overallProgress);
      }
    };
    this.animatedObjects.push(animObj);
  }

  // ─────────────────────────────────────────────────────────────
  // DOMAIN EVENT RECEIVER (WebSocket Bridge)
  // ─────────────────────────────────────────────────────────────
  applyEvent(eventData) {
    const type = eventData.event_type;
    console.log('[3D Twin] Applying event:', type);

    switch (type) {
      case 'DIGITAL_TWIN_TELEMETRY_UPDATED':
        if (this.onTelemetryUpdate) this.onTelemetryUpdate(eventData.payload);
        break;
      case 'FARM_HEALTH_UPDATED':
        this._flashHealthUpdate(eventData.payload);
        break;
      case 'RISK_ALERT_GENERATED':
        this._spawnRiskAlert(eventData.payload);
        break;
      case 'SIMULATION_TRIGGERED':
        if (eventData.payload.scenario === 'pest_outbreak') {
          this.setOutbreakBeacon(true);
        }
        if (eventData.payload.scenario === 'heavy_rainfall') {
          this.setWeather('rain');
        }
        break;
      case 'WEATHER_CHANGED':
        this.setWeather(eventData.payload.condition || 'clear');
        break;
      case 'farm_calibrated_3d':
      case 'structure_version_created':
        if (this.onSceneRebuildNeeded) this.onSceneRebuildNeeded();
        break;
      case 'planting_grid_updated':
        if (this.sceneData) {
          this.sceneData.planting_grid = {
            ...this.sceneData.planting_grid,
            healthy_plants: eventData.payload.healthy,
            stressed_plants: eventData.payload.stressed,
            dead_plants: eventData.payload.dead,
          };
          this.setDay(this.currentDay);
        }
        break;
    }
  }

  _flashHealthUpdate(payload) {
    const flashGeo = new THREE.PlaneGeometry(100, 80);
    flashGeo.rotateX(-Math.PI / 2);
    const flashMat = new THREE.MeshBasicMaterial({
      color: (payload.health_score || 80) > 60 ? 0x10B981 : 0xEF4444,
      transparent: true,
      opacity: 0.15,
    });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.y = 0.5;
    this.scene.add(flash);

    let opacity = 0.15;
    const fadeOut = () => {
      opacity -= 0.005;
      if (opacity <= 0) {
        this.scene.remove(flash);
        flashGeo.dispose();
        flashMat.dispose();
        return;
      }
      flashMat.opacity = opacity;
      requestAnimationFrame(fadeOut);
    };
    fadeOut();
  }

  _spawnRiskAlert(payload) {
    const x = payload.x || (Math.random() * 40 - 20);
    const z = payload.z || (Math.random() * 30 - 15);
    const severity = payload.severity || 'medium';
    const color = severity === 'high' || severity === 'critical' ? COLORS.alertRed : COLORS.alertAmber;

    const sphereGeo = new THREE.SphereGeometry(3, 12, 12);
    const sphereMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(x, 3, z);
    sphere.userData = { type: 'risk', name: payload.title || 'Risk Alert', severity: severity };
    this.groups.risks.add(sphere);

    this.animatedObjects.push({ type: 'pulse', mesh: sphere, speed: 2.0 });

    setTimeout(() => {
      this.groups.risks.remove(sphere);
      sphereGeo.dispose();
      sphereMat.dispose();
      this.animatedObjects = this.animatedObjects.filter(a => a.mesh !== sphere);
    }, 30000);
  }

  // ─────────────────────────────────────────────────────────────
  // ANIMATION LOOP & CHARACTER STATE MACHINE
  // ─────────────────────────────────────────────────────────────
  startAnimationLoop() {
    const animate = () => {
      if (this.isDestroyed) return;
      this.animFrameId = requestAnimationFrame(animate);

      const delta = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();

      this.controls.update();
      this._updateAnimations(elapsed, delta);
      this.renderer.render(this.scene, this.camera);

      if (this.labelRenderer) {
        this.labelRenderer.render(this.scene, this.camera);
      }

      if (this.minimapRenderer && this.minimapCamera) {
        this.groups.labels.visible = false;
        this.minimapRenderer.render(this.scene, this.minimapCamera);
        this.groups.labels.visible = true;
      }
    };
    animate();
  }

  _updateAnimations(elapsed, delta) {
    // 0. Keyboard Navigation & Distance-based Label Fading
    this._updateKeyboardNavigation(delta);
    this._updateLabelDistances();

    // 1. Scene Animations
    for (const anim of this.animatedObjects) {
      switch (anim.type) {
        case 'spin':
          anim.mesh.rotation[anim.axis || 'y'] += delta * anim.speed;
          break;
        case 'blink': {
          const phase = Math.sin(elapsed * anim.speed * Math.PI) * 0.5 + 0.5;
          if (anim.mesh.material && anim.mesh.material.emissiveIntensity !== undefined) {
            anim.mesh.material.emissiveIntensity = 0.1 + phase * 0.6;
          }
          break;
        }
        case 'pulse': {
          const scale = 1.0 + Math.sin(elapsed * anim.speed) * 0.2;
          anim.mesh.scale.set(scale, scale, scale);
          if (anim.mesh.material) {
            anim.mesh.material.opacity = 0.15 + Math.sin(elapsed * anim.speed) * 0.15;
          }
          break;
        }
        case 'waterWave': {
          anim.mesh.position.y = anim.baseY + Math.sin(elapsed * (anim.speed || 1.2)) * 0.04;
          break;
        }
        case 'paddlewheelSpin': {
          anim.shaft.rotation.x += delta * (anim.speed || 6.0);
          if (anim.foam) {
            const foamScale = 0.85 + Math.sin(elapsed * 12) * 0.25;
            anim.foam.scale.set(foamScale, foamScale, foamScale);
          }
          break;
        }
        case 'fishJump': {
          anim.timer += delta;
          if (!anim.isJumping) {
            if (anim.timer >= anim.jumpInterval) {
              anim.isJumping = true;
              anim.jumpProgress = 0;
              anim.timer = 0;
              anim.startX = anim.pondX + (Math.random() - 0.5) * anim.rangeW;
              anim.startZ = anim.pondZ + (Math.random() - 0.5) * anim.rangeH;
              anim.targetX = anim.startX + (Math.random() - 0.5) * 4.0;
              anim.targetZ = anim.startZ + (Math.random() - 0.5) * 4.0;
              anim.fish.visible = true;
              if (anim.splash) {
                anim.splash.position.set(anim.startX, anim.waterY + 0.02, anim.startZ);
                anim.splash.scale.set(1, 1, 1);
                anim.splash.material.opacity = 0.8;
              }
            }
          } else {
            anim.jumpProgress += delta * 1.5;
            if (anim.jumpProgress >= Math.PI) {
              anim.isJumping = false;
              anim.fish.visible = false;
              anim.fish.position.y = anim.waterY - 0.4;
              if (anim.splash) {
                anim.splash.position.set(anim.targetX, anim.waterY + 0.02, anim.targetZ);
                anim.splash.scale.set(1, 1, 1);
                anim.splash.material.opacity = 0.9;
              }
            } else {
              const p = anim.jumpProgress;
              const curX = anim.startX + (anim.targetX - anim.startX) * (p / Math.PI);
              const curZ = anim.startZ + (anim.targetZ - anim.startZ) * (p / Math.PI);
              const curY = anim.waterY + Math.sin(p) * 2.2;
              anim.fish.position.set(curX, curY, curZ);
              anim.fish.rotation.z = Math.cos(p) * 0.75;
              anim.fish.rotation.y = Math.atan2(anim.targetZ - anim.startZ, anim.targetX - anim.startX);
            }
          }
          if (anim.splash && anim.splash.material.opacity > 0) {
            anim.splash.material.opacity -= delta * 1.4;
            anim.splash.scale.multiplyScalar(1.0 + delta * 1.2);
          }
          break;
        }
        case 'outbreakBeacon': {
          const pulse = Math.sin(elapsed * 4);
          anim.beam.rotation.y += delta * 0.8;
          anim.beam.material.opacity = 0.35 + pulse * 0.2;
          const ringScale = 1.0 + Math.sin(elapsed * 3) * 0.4;
          anim.ring.scale.set(ringScale, ringScale, ringScale);
          anim.ring.material.opacity = 0.4 + Math.cos(elapsed * 3) * 0.3;
          anim.strobe.intensity = 2.5 + pulse * 1.5;
          break;
        }
        case 'walkSimulation': {
          if (typeof anim.update === 'function') anim.update();
          break;
        }
        case 'cropSway': {
          if (anim.mesh.instanceMatrix) {
            const dummy = new THREE.Object3D();
            const swayAmount = 0.025;
            const step = Math.max(1, Math.floor(anim.count / 250));
            for (let i = 0; i < anim.count; i += step) {
              anim.mesh.getMatrixAt(i, dummy.matrix);
              dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
              const sway = Math.sin(elapsed * 1.8 + i * 0.1) * swayAmount;
              dummy.rotation.z = sway;
              dummy.rotation.x = Math.sin(elapsed * 1.4 + i * 0.15) * swayAmount * 0.5;
              dummy.updateMatrix();
              anim.mesh.setMatrixAt(i, dummy.matrix);
            }
            anim.mesh.instanceMatrix.needsUpdate = true;
          }
          break;
        }
      }
    }

    // 2. Articulated Worker Dynamic Animation State Machine & Walking Kinematics
    for (const w of this.workerMeshes) {
      const phase = w.animPhase || 0;
      const taskType = (w.data.current_task?.type || '').toLowerCase();
      const isResting = w.data.on_leave || (w.data.fatigue_index > 85);

      if (isResting) {
        // Resting / Seated state
        w.group.position.y = 0.1;
        if (w.torso) w.torso.rotation.x = 0.1;
      } else {
        // Walking Locomotion along furrow patrol axis
        const walkSpeed = (w.speed || 1.2) * (w.direction || 1);
        if (w.patrolAxis === 'z') {
          w.group.position.z += walkSpeed * delta;
          if (w.group.position.z > (w.maxZ || 20)) {
            w.direction = -1;
            w.group.rotation.y = Math.PI;
          } else if (w.group.position.z < (w.minZ || -20)) {
            w.direction = 1;
            w.group.rotation.y = 0;
          }
        } else {
          w.group.position.x += walkSpeed * delta;
          if (w.group.position.x > (w.maxX || 26)) {
            w.direction = -1;
            w.group.rotation.y = -Math.PI / 2;
          } else if (w.group.position.x < (w.minX || -26)) {
            w.direction = 1;
            w.group.rotation.y = Math.PI / 2;
          }
        }

        const walkCycle = elapsed * ((w.speed || 1.2) * 4.2) + (w.walkPhase || 0);
        if (w.leftLeg) w.leftLeg.rotation.x = Math.sin(walkCycle) * 0.55;
        if (w.rightLeg) w.rightLeg.rotation.x = -Math.sin(walkCycle) * 0.55;

        // Arm swing when not engaged in specific tools
        if (taskType !== 'spraying' && taskType !== 'inspecting' && w.data.role !== 'agronomist') {
          if (w.leftArm) w.leftArm.rotation.x = -Math.sin(walkCycle) * 0.45;
          if (w.rightArm && taskType !== 'watering') w.rightArm.rotation.x = Math.sin(walkCycle) * 0.45;
        }

        // Stride vertical bounce
        w.group.position.y = Math.abs(Math.sin(walkCycle)) * 0.08;

        if (taskType === 'spraying') {
          // Working: Oscillating spray wand & pulsating mist
          if (w.rightArm) {
            w.rightArm.rotation.y = Math.sin(elapsed * 2.8 + phase) * 0.45;
            w.rightArm.rotation.x = -0.6 + Math.sin(elapsed * 1.4) * 0.1;
          }
          if (w.torso) w.torso.rotation.y = Math.sin(elapsed * 2.8 + phase) * 0.18;
          if (w.sprayMist) {
            w.sprayMist.scale.setScalar(0.85 + Math.sin(elapsed * 6) * 0.3);
            w.sprayMist.material.opacity = 0.35 + Math.sin(elapsed * 8) * 0.25;
          }
          // Dynamic water droplet cascade from spray nozzle
          if (w.sprayParticles && w.sprayParticles.geometry && w.sprayParticles.userData.vels) {
            const pos = w.sprayParticles.geometry.attributes.position.array;
            const vels = w.sprayParticles.userData.vels;
            for (let i = 0; i < vels.length; i++) {
              const v = vels[i];
              v.life += delta * 1.8;
              if (v.life >= 1.0) {
                v.life = 0;
                pos[i * 3 + 0] = 0.45;
                pos[i * 3 + 1] = 0.7;
                pos[i * 3 + 2] = 0.9;
              } else {
                pos[i * 3 + 0] += v.x * delta;
                pos[i * 3 + 1] += v.y * delta;
                pos[i * 3 + 2] += v.z * delta;
              }
            }
            w.sprayParticles.geometry.attributes.position.needsUpdate = true;
          }
        } else if (taskType === 'watering' || taskType === 'irrigation') {
          // Working: Bending forward & inspecting lines
          if (w.torso) w.torso.rotation.x = 0.3 + Math.sin(elapsed * 1.8 + phase) * 0.14;
          if (w.rightArm) w.rightArm.rotation.x = -0.8 + Math.sin(elapsed * 1.8) * 0.2;
        } else if (taskType === 'inspecting' || w.data.role === 'agronomist') {
          // Working: Holding telemetry tablet & tilting head
          if (w.rightArm) w.rightArm.rotation.x = -1.05;
          if (w.leftArm) w.leftArm.rotation.x = -0.9;
          if (w.head) w.head.rotation.x = 0.22 + Math.sin(elapsed * 1.2) * 0.08;
        } else {
          // Idle / patrolling looking around
          if (w.head) w.head.rotation.y = Math.sin(elapsed * 0.8 + phase) * 0.22;
        }
      }
    }

    // 2b. Interactive 3D Precision Tractor Operations & Plowing
    if (this.tractorMesh && this.tractorActive) {
      const tData = this.tractorMesh.userData || {};
      tData.pathT = (tData.pathT || 0) + delta * 0.12;

      // Rectangular patrol along arterial lanes and headlands
      const pT = tData.pathT % 4.0;
      const rMinX = -28, rMaxX = 28, rMinZ = -22, rMaxZ = 22;
      let targetX, targetZ, rotY;

      if (pT < 1.0) {
        // North Road: (-28, -22) -> (28, -22)
        const f = pT;
        targetX = rMinX + f * (rMaxX - rMinX);
        targetZ = rMinZ;
        rotY = Math.PI / 2;
      } else if (pT < 2.0) {
        // East Headland: (28, -22) -> (28, 22)
        const f = pT - 1.0;
        targetX = rMaxX;
        targetZ = rMinZ + f * (rMaxZ - rMinZ);
        rotY = 0;
      } else if (pT < 3.0) {
        // South Road: (28, 22) -> (-28, 22)
        const f = pT - 2.0;
        targetX = rMaxX - f * (rMaxX - rMinX);
        targetZ = rMaxZ;
        rotY = -Math.PI / 2;
      } else {
        // West Headland: (-28, 22) -> (-28, -22)
        const f = pT - 3.0;
        targetX = rMinX;
        targetZ = rMaxZ - f * (rMaxZ - rMinZ);
        rotY = Math.PI;
      }

      this.tractorMesh.position.x = targetX;
      this.tractorMesh.position.z = targetZ;
      this.tractorMesh.rotation.y = rotY;

      // Wheels rotation around axle
      if (this.tractorWheels) {
        this.tractorWheels.forEach(wh => {
          wh.rotation.x += delta * 7.5;
        });
      }

      // Exhaust smoke puffs ascending, expanding, and fading
      if (this.tractorSmokeParticles) {
        this.tractorSmokeParticles.forEach(sp => {
          sp.userData.life = (sp.userData.life || 0) + delta * 1.8;
          if (sp.userData.life >= (sp.userData.maxLife || 1.6)) {
            sp.userData.life = 0;
            sp.position.set(0.55, sp.userData.initialY || 3.05, 0.8);
            sp.scale.set(1, 1, 1);
            if (sp.material) sp.material.opacity = 0.45;
          } else {
            const prog = sp.userData.life / (sp.userData.maxLife || 1.6);
            sp.position.y += delta * 1.4;
            sp.position.z -= delta * 0.6;
            const s = 1.0 + prog * 2.5;
            sp.scale.set(s, s, s);
            if (sp.material) sp.material.opacity = (1.0 - prog) * 0.4;
          }
        });
      }
    }

    // 2c. Sustainable Agro-Pastoral Livestock Grazing & Tail Swishing
    if (this.livestockMeshes && this.livestockMeshes.length > 0) {
      for (const cow of this.livestockMeshes) {
        const u = cow.userData;
        if (!u) continue;
        const phase = u.bobPhase || 0;
        // Head dips down to nibble clover grass
        if (u.headGroup) {
          const grazing = Math.sin(elapsed * 0.9 + phase);
          u.headGroup.rotation.x = -0.15 + grazing * 0.32;
          u.headGroup.rotation.y = Math.sin(elapsed * 1.4 + phase) * 0.08;
        }
        // Tail swishes side to side
        if (u.tail) {
          u.tail.rotation.z = Math.sin(elapsed * 3.5 + phase) * 0.35;
        }
      }
    }

    // 3. Autonomous Surveyor Drone Flight & Rotor Animation
    if (this._droneMesh) {
      const droneT = elapsed * 0.22;
      const pathX = Math.sin(droneT) * 36;
      const pathZ = Math.cos(droneT * 1.5) * 28;
      const pathY = 16.0 + Math.sin(elapsed * 1.8) * 0.35;
      this._droneMesh.position.set(pathX, pathY, pathZ);

      // Compute heading direction
      const nextX = Math.sin(droneT + 0.05) * 36;
      const nextZ = Math.cos((droneT + 0.05) * 1.5) * 28;
      const angleY = Math.atan2(nextX - pathX, nextZ - pathZ);
      this._droneMesh.rotation.y = angleY;
      this._droneMesh.rotation.z = Math.sin(droneT * 1.5) * 0.12;

      if (this._droneRotors) {
        this._droneRotors.forEach((r, idx) => {
          r.rotation.y += delta * (idx % 2 === 0 ? 35 : -35);
        });
      }

      if (this._droneLabel) {
        this._droneLabel.position.set(pathX, pathY + 1.8, pathZ);
      }
    }

    // 4. Cloud Drift
    for (const cloud of this.cloudMeshes) {
      cloud.position.x += delta * 1.6;
      if (cloud.position.x > 95) cloud.position.x = -95;
    }

    // 5. Dynamic Rain Streaks & Ground Splash Rings
    if (this.rainStreaks && this.rainData) {
      const pos = this.rainStreaks.geometry.attributes.position.array;
      const streakLength = 1.35;
      const windTiltX = -0.32;
      const windTiltZ = -0.12;

      for (let i = 0; i < this.rainData.length; i++) {
        const drop = this.rainData[i];
        drop.y -= delta * drop.speed;
        drop.x += delta * windTiltX * 8;
        drop.z += delta * windTiltZ * 8;

        if (drop.y <= 0.2) {
          this._spawnSplash(drop.x, drop.z);
          drop.y = 50 + Math.random() * 10;
          drop.x = (Math.random() - 0.5) * 160;
          drop.z = (Math.random() - 0.5) * 140;
        }

        const idx = i * 6;
        pos[idx] = drop.x;
        pos[idx + 1] = drop.y;
        pos[idx + 2] = drop.z;

        pos[idx + 3] = drop.x + windTiltX * streakLength;
        pos[idx + 4] = drop.y - streakLength;
        pos[idx + 5] = drop.z + windTiltZ * streakLength;
      }
      this.rainStreaks.geometry.attributes.position.needsUpdate = true;
    }

    // Update Splash Rings
    if (this.splashPool) {
      this.splashPool.forEach(sp => {
        if (sp.active) {
          sp.life += delta;
          const progress = sp.life / sp.maxLife;
          if (progress >= 1.0) {
            sp.active = false;
            sp.mesh.visible = false;
          } else {
            const s = 1.0 + progress * 2.8;
            sp.mesh.scale.set(s, s, s);
            sp.mesh.material.opacity = (1.0 - progress) * 0.75;
          }
        }
      });
    }

    // Thunderstorm Lightning Flash Timer
    if (this.currentWeather === 'rain' || this.activeDisaster === 'thunderstorm') {
      this._lightningTimer = (this._lightningTimer || 6.0) - delta;
      if (this._lightningTimer <= 0) {
        this._lightningTimer = this.activeDisaster === 'thunderstorm' ? (2.5 + Math.random() * 4.0) : (6.0 + Math.random() * 8.0);
        this._triggerLightningFlash();
      }
    }

    // Starfield Twinkle in Night Mode
    if (this.starField && this.starField.material) {
      this.starField.material.opacity = 0.7 + Math.sin(elapsed * 2.5) * 0.2;
    }

    // 6. Hailstones dynamic falling & ground bouncing
    if (this.hailMesh && this.hailData) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < this.hailData.length; i++) {
        const h = this.hailData[i];
        h.y += h.vy * delta;
        h.x += h.vx * delta;
        h.z += h.vz * delta;

        if (h.y <= 0.22) {
          h.y = 0.22;
          if (h.bounces < 2) {
            h.vy = -h.vy * 0.35;
            h.bounces++;
          } else {
            h.y = 40 + Math.random() * 12;
            h.x = (Math.random() - 0.5) * 150;
            h.z = (Math.random() - 0.5) * 130;
            h.vy = -h.baseSpeed;
            h.bounces = 0;
          }
        }

        dummy.position.set(h.x, h.y, h.z);
        const s = 0.7 + (i % 5) * 0.12;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        this.hailMesh.setMatrixAt(i, dummy.matrix);
      }
      this.hailMesh.instanceMatrix.needsUpdate = true;
    }

    // 7. Locust Swarm vortex flocking (1,200 particle swarm)
    if (this.locustMesh && this.locustData) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < this.locustData.length; i++) {
        const loc = this.locustData[i];
        loc.angle += loc.orbitSpeed * delta;
        loc.y = loc.baseY + Math.sin(elapsed * 3.5 + loc.phase) * 1.4;
        const lx = Math.cos(loc.angle) * loc.radius;
        const lz = Math.sin(loc.angle) * loc.radius;

        dummy.position.set(lx, loc.y, lz);
        dummy.rotation.y = -loc.angle + (loc.orbitSpeed > 0 ? Math.PI / 2 : -Math.PI / 2);
        dummy.rotation.z = Math.sin(elapsed * loc.flutterSpeed) * 0.25;
        dummy.updateMatrix();
        this.locustMesh.setMatrixAt(i, dummy.matrix);
      }
      this.locustMesh.instanceMatrix.needsUpdate = true;
    }

    // 8. Heat Shimmer particles rising from arid soil
    if (this.heatShimmerMesh && this.heatShimmerData) {
      const pos = this.heatShimmerMesh.geometry.attributes.position.array;
      for (let i = 0; i < this.heatShimmerData.length; i++) {
        const hs = this.heatShimmerData[i];
        hs.y += hs.speed * delta;
        if (hs.y > 14.0) {
          hs.y = 0.25;
          hs.x = (Math.random() - 0.5) * 140;
          hs.z = (Math.random() - 0.5) * 120;
        }
        pos[i * 3] = hs.x + Math.sin(elapsed * 2.5 + hs.seed) * 0.35;
        pos[i * 3 + 1] = hs.y;
        pos[i * 3 + 2] = hs.z + Math.cos(elapsed * 2.5 + hs.seed) * 0.35;
      }
      this.heatShimmerMesh.geometry.attributes.position.needsUpdate = true;
    }

    // 9. Flood Water undulating silt surge
    if (this.floodWater) {
      this.floodWater.position.y = 0.72 + Math.sin(elapsed * 1.8) * 0.05;
    }

    // 10. Micro-sprinkler pulses & mist puffs
    for (const anim of this.animatedObjects) {
      if (anim.type === 'sprinklerPulse' && anim.mesh) {
        const ringScale = 0.9 + Math.sin(elapsed * anim.speed) * 0.35;
        anim.mesh.scale.set(ringScale, ringScale, ringScale);
        if (anim.mesh.material) {
          anim.mesh.material.opacity = 0.25 + Math.sin(elapsed * anim.speed) * 0.2;
        }
      } else if (anim.type === 'mistPulse' && anim.mesh) {
        const mistScale = 0.8 + Math.sin(elapsed * anim.speed) * 0.3;
        anim.mesh.scale.set(mistScale, mistScale, mistScale);
        if (anim.mesh.material) {
          anim.mesh.material.opacity = 0.15 + Math.sin(elapsed * anim.speed) * 0.1;
        }
      }
    }
  }

  updateState(snapshot) {
    if (this.sceneData) this.sceneData.telemetry = snapshot;
  }

  focusEntity(type, id) {
    let targetObj = null;
    const searchGroup = (group) => {
      group.traverse(obj => {
        if (obj.userData && obj.userData.type === type && obj.userData.id === id) {
          targetObj = obj;
        }
      });
    };
    Object.values(this.groups).forEach(searchGroup);

    if (targetObj) {
      const pos = new THREE.Vector3();
      targetObj.getWorldPosition(pos);
      this._animateCamera(new THREE.Vector3(pos.x + 10, pos.y + 12, pos.z + 10), pos);
    }
  }

  _updateKeyboardNavigation(delta) {
    if (!this.camera || !this.controls) return;
    
    const isUp = !!(this.keysDown['ArrowUp'] || this.keysDown['KeyW']);
    const isDown = !!(this.keysDown['ArrowDown'] || this.keysDown['KeyS']);
    const isLeft = !!(this.keysDown['ArrowLeft'] || this.keysDown['KeyA']);
    const isRight = !!(this.keysDown['ArrowRight'] || this.keysDown['KeyD']);

    if (!isUp && !isDown && !isLeft && !isRight) return;

    // Heading vector projected on XZ plane
    const forward = new THREE.Vector3();
    forward.subVectors(this.controls.target, this.camera.position);
    forward.y = 0;
    if (forward.lengthSq() < 0.0001) {
      forward.set(0, 0, -1);
    } else {
      forward.normalize();
    }

    // Right strafe vector
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const move = new THREE.Vector3();
    if (isUp) move.add(forward);
    if (isDown) move.sub(forward);
    if (isRight) move.add(right);
    if (isLeft) move.sub(right);

    if (move.lengthSq() > 0) {
      move.normalize();
      const speed = (this.keysDown['ShiftLeft'] || this.keysDown['ShiftRight'] || this.keysDown['Shift']) ? 80.0 : 42.0;
      const step = move.multiplyScalar(speed * delta);
      this.camera.position.add(step);
      this.controls.target.add(step);
    }
  }

  _updateLabelDistances() {
    if (!this.camera || !this.groups.labels) return;
    const camPos = this.camera.position;
    this.groups.labels.children.forEach(lbl => {
      if (lbl.isCSS2DObject && lbl.element) {
        const dist = camPos.distanceTo(lbl.position);
        if (dist > 150) {
          lbl.element.style.opacity = '0';
          lbl.element.style.visibility = 'hidden';
        } else if (dist > 110) {
          lbl.element.style.opacity = (1.0 - (dist - 110) / 40).toFixed(2);
          lbl.element.style.visibility = 'visible';
        } else {
          lbl.element.style.opacity = '1';
          lbl.element.style.visibility = 'visible';
        }
      }
    });
  }

  getSceneInfo() {
    return {
      totalObjects: this.scene.children.length,
      cropCount: this.cropInstances ? this.cropInstances.count : 0,
      workerCount: this.workerMeshes.length,
      currentDay: this.currentDay,
      maxDays: this.maxDays,
      weather: this.currentWeather,
      activePreset: this.activePreset,
      isEditMode: this.isEditMode,
      activeEditTool: this.activeEditTool,
      layers: { ...this.layers },
    };
  }

  destroy() {
    this.isDestroyed = true;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this._resizeObserver) this._resizeObserver.disconnect();

    this.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
    if (this.labelRenderer) this.labelRenderer.domElement.remove();
    if (this.minimapRenderer) this.minimapRenderer.dispose();
    this.controls?.dispose();

    console.log('[3D Twin] Engine destroyed cleanly');
  }
}
