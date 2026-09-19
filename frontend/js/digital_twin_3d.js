/**
 * AGRIOS 3D Digital Twin Engine — Three.js Agricultural World
 * 
 * A living, interactive, data-driven 3D representation of a real agricultural farm.
 * Built on Three.js with procedural geometry (no external model files).
 * 
 * Features:
 * - Procedural terrain with Perlin noise
 * - Instanced crop rendering (6 growth stages)
 * - Animated worker characters
 * - Weather effects (sun, rain, clouds, heatwave)
 * - Real-time WebSocket event integration
 * - Layer toggles, camera presets, time slider
 * - Click-to-inspect raycaster
 * - Minimap & HUD
 * 
 * @requires Three.js 0.164+ via importmap
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// ═══════════════════════════════════════════════════════════════
// SECTION 1: Perlin Noise (simplex-style, self-contained)
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
    // Fisher-Yates shuffle with seed
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
  // Terrain
  soil: 0x8B7355,
  soilDark: 0x6B5B45,
  grass: 0x4CAF50,
  grassLight: 0x66BB6A,
  grassDark: 0x2E7D32,
  // Water
  water: 0x2196F3,
  waterDeep: 0x1565C0,
  pond: 0x42A5F5,
  // Crops by stage
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
  buildingRoof: 0xA1887F,
  polyhouse: 0xB2DFDB,
  polyhouseFrame: 0x78909C,
  // Infrastructure
  road: 0x9E9E9E,
  roadDark: 0x757575,
  fence: 0x8D6E63,
  sensor: 0x00BCD4,
  sensorBlink: 0x00E5FF,
  borewell: 0x607D8B,
  // Workers
  workerFarmer: 0x4CAF50,
  workerLabor: 0xFF9800,
  workerAgronomist: 0x2196F3,
  workerSkin: 0xE0C8A8,
  // Sky
  skyDay: 0x87CEEB,
  skyDawn: 0xFFB74D,
  skyDusk: 0xFF7043,
  skyNight: 0x1A237E,
  // Effects
  rain: 0xB3E5FC,
  heatShimmer: 0xFFCC80,
  fog: 0xCFD8DC,
  // UI
  emerald: 0x10B981,
  emeraldBright: 0x34D399,
  alertRed: 0xEF4444,
  alertAmber: 0xF59E0B,
};

// ═══════════════════════════════════════════════════════════════
// SECTION 3: Main Engine Class
// ═══════════════════════════════════════════════════════════════
export class AgriosDigitalTwin3D {
  constructor() {
    // Core Three.js
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.labelRenderer = null;
    this.clock = new THREE.Clock();
    this.noise = new SimplexNoise(42);

    // Scene groups (for layer toggling)
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
    this.rainParticles = null;
    this.cloudMeshes = [];
    this.isDestroyed = false;

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

    // Raycaster for click detection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Minimap
    this.minimapRenderer = null;
    this.minimapCamera = null;

    // Callbacks
    this.onEntitySelect = null;
    this.onEntityInspect = null;

    // Animation
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

    // ── WebGL Renderer ──
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // ── CSS2D Label Renderer ──
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(width, height);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(this.labelRenderer.domElement);

    // ── Scene ──
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.skyDay);
    this.scene.fog = new THREE.FogExp2(0xCCE5FF, 0.003);

    // ── Camera ──
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 500);
    this.camera.position.set(60, 55, 60);
    this.camera.lookAt(0, 0, 0);

    // ── Controls ──
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 15;
    this.controls.maxDistance = 150;
    this.controls.maxPolarAngle = Math.PI / 2.15;
    this.controls.minPolarAngle = 0.2;
    this.controls.target.set(0, 0, 0);

    // ── Add groups to scene ──
    Object.values(this.groups).forEach(g => this.scene.add(g));

    // ── Lighting ──
    this._setupLighting();

    // ── Minimap ──
    this._setupMinimap(minimapCanvasId);

    // ── Event listeners ──
    this._setupEventListeners(container);

    // ── Resize handler ──
    this._resizeObserver = new ResizeObserver(() => this._onResize(container));
    this._resizeObserver.observe(container);

    console.log('[3D Twin] Engine initialized');
  }

  _setupLighting() {
    // Ambient light (soft fill)
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
    this._ambientLight = ambient;

    // Hemisphere light (sky/ground color difference)
    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x4CAF50, 0.4);
    this.scene.add(hemi);
    this._hemiLight = hemi;

    // Directional sunlight with shadows
    const sun = new THREE.DirectionalLight(0xFFF8E1, 1.2);
    sun.position.set(40, 60, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    sun.shadow.bias = -0.001;
    this.scene.add(sun);
    this._sunLight = sun;

    // Subtle sun target
    sun.target.position.set(0, 0, 0);
    this.scene.add(sun.target);
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

    this.minimapCamera = new THREE.OrthographicCamera(-70, 70, 52.5, -52.5, 1, 200);
    this.minimapCamera.position.set(0, 100, 0);
    this.minimapCamera.lookAt(0, 0, 0);
  }

  _setupEventListeners(container) {
    // Click detection
    container.addEventListener('click', (e) => this._onClick(e, container));
    // Touch support
    container.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const t = e.changedTouches[0];
        this._onClick({ clientX: t.clientX, clientY: t.clientY }, container);
      }
    });
  }

  _onResize(container) {
    if (this.isDestroyed) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
  }

  // ─────────────────────────────────────────────────────────────
  // SCENE BUILDING
  // ─────────────────────────────────────────────────────────────
  async buildScene(sceneData) {
    this.sceneData = sceneData;

    // Parse crop plan duration
    if (sceneData.crop_plan && sceneData.crop_plan.stages) {
      const lastStage = sceneData.crop_plan.stages[sceneData.crop_plan.stages.length - 1];
      this.maxDays = lastStage ? (lastStage.end_day || 120) : 120;
    }

    // Clear existing scene objects
    this._clearGroups();

    // Build in order
    this._buildTerrain();
    this._buildFarmBoundary(sceneData.boundary);
    this._buildFields(sceneData.spatial_objects);
    this._buildRoads(sceneData.spatial_objects);
    this._buildWater(sceneData.spatial_objects);
    this._buildBuildings(sceneData.spatial_objects);
    this._buildInfrastructure(sceneData.spatial_objects);
    this._buildCrops(sceneData.planting_grid, sceneData.crop_plan);
    this._buildWorkers(sceneData.workers);
    this._applyWeather(sceneData.weather);

    console.log('[3D Twin] Scene built with', this.scene.children.length, 'top-level objects');
  }

  _clearGroups() {
    Object.values(this.groups).forEach(group => {
      while (group.children.length > 0) {
        const child = group.children[0];
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
        group.remove(child);
      }
    });
    this.animatedObjects = [];
    this.workerMeshes = [];
    this.cloudMeshes = [];
    this.rainParticles = null;
  }

  // ─────────────────────────────────────────────────────────────
  // TERRAIN
  // ─────────────────────────────────────────────────────────────
  _buildTerrain() {
    const size = 140;
    const segments = 80;
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

      // Perlin noise for elevation
      const elevation = this.noise.noise2D(x * 0.02, z * 0.02) * 2.0 +
                        this.noise.noise2D(x * 0.05, z * 0.05) * 0.8;
      positions.setY(i, elevation);

      // Color based on position and noise
      const inFarm = Math.abs(x) < 50 && Math.abs(z) < 40;
      const noiseVal = this.noise.noise2D(x * 0.08, z * 0.08);

      let color;
      if (inFarm) {
        color = soilColor.clone().lerp(grassDarkColor, 0.3 + noiseVal * 0.2);
      } else {
        color = grassColor.clone().lerp(grassDarkColor, 0.5 + noiseVal * 0.3);
      }

      colorAttr.setXYZ(i, color.r, color.g, color.b);
    }

    geo.setAttribute('color', colorAttr);
    geo.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.FrontSide,
    });

    const terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    terrain.userData = { type: 'terrain' };
    this.groups.terrain.add(terrain);
  }

  // ─────────────────────────────────────────────────────────────
  // FARM BOUNDARY
  // ─────────────────────────────────────────────────────────────
  _buildFarmBoundary(boundaryGeoJSON) {
    let coords;
    if (boundaryGeoJSON && boundaryGeoJSON.coordinates && boundaryGeoJSON.coordinates[0]) {
      coords = boundaryGeoJSON.coordinates[0];
    } else {
      // Default boundary rectangle
      coords = [[-45, -35], [45, -35], [45, 35], [-45, 35], [-45, -35]];
    }

    // Convert GeoJSON coords to 3D positions
    // GeoJSON is [lon, lat], we normalize to our scene coordinates
    const centerLon = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const centerLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    const scale = 8000; // Approximate scale factor for GPS to meters

    const points3D = coords.map(c => {
      const x = (c[0] - centerLon) * scale;
      const z = -(c[1] - centerLat) * scale;
      return new THREE.Vector3(
        Math.max(-50, Math.min(50, x)),
        0.5,
        Math.max(-40, Math.min(40, z))
      );
    });

    // If all points collapsed to near zero (GPS coords very close), use default
    const spread = points3D.reduce((max, p) => Math.max(max, Math.abs(p.x) + Math.abs(p.z)), 0);
    if (spread < 5) {
      points3D.length = 0;
      [[-45, -35], [45, -35], [45, 35], [-45, 35], [-45, -35]].forEach(c => {
        points3D.push(new THREE.Vector3(c[0], 0.5, c[1]));
      });
    }

    // Update farm bounds
    this.farmBounds = {
      minX: Math.min(...points3D.map(p => p.x)),
      maxX: Math.max(...points3D.map(p => p.x)),
      minZ: Math.min(...points3D.map(p => p.z)),
      maxZ: Math.max(...points3D.map(p => p.z)),
    };

    // Fence posts and rails
    const postGeo = new THREE.CylinderGeometry(0.15, 0.2, 2.5, 6);
    const postMat = new THREE.MeshLambertMaterial({ color: COLORS.fence });
    const railGeo = new THREE.CylinderGeometry(0.06, 0.06, 1, 4);
    const railMat = new THREE.MeshLambertMaterial({ color: COLORS.fence });

    for (let i = 0; i < points3D.length - 1; i++) {
      const a = points3D[i];
      const b = points3D[i + 1];
      const dist = a.distanceTo(b);
      const numPosts = Math.max(2, Math.floor(dist / 6));

      for (let j = 0; j <= numPosts; j++) {
        const t = j / numPosts;
        const pos = a.clone().lerp(b, t);
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(pos.x, 1.25, pos.z);
        post.castShadow = true;
        this.groups.fields.add(post);
      }

      // Top rail
      const midpoint = a.clone().lerp(b, 0.5);
      const railLength = dist;
      const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, railLength, 4),
        railMat
      );
      rail.position.set(midpoint.x, 2.0, midpoint.z);
      rail.rotation.z = Math.PI / 2;
      const angle = Math.atan2(b.z - a.z, b.x - a.x);
      rail.rotation.y = -angle;
      this.groups.fields.add(rail);
    }

    // Field boundary line
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points3D);
    const lineMat = new THREE.LineBasicMaterial({ color: COLORS.emerald, linewidth: 2 });
    const boundaryLine = new THREE.Line(lineGeo, lineMat);
    this.groups.fields.add(boundaryLine);

    // Farm name label
    if (this.sceneData && this.sceneData.farm) {
      const label = this._createLabel(
        this.sceneData.farm.name || 'AGRIOS Farm',
        new THREE.Vector3(0, 8, this.farmBounds.minZ - 3),
        '#10b981', '0.85rem', true
      );
      this.groups.labels.add(label);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // FIELDS (subdivided crop zones)
  // ─────────────────────────────────────────────────────────────
  _buildFields(spatialObjects) {
    const { minX, maxX, minZ, maxZ } = this.farmBounds;
    const farmW = maxX - minX;
    const farmH = maxZ - minZ;

    // Subdivide into 2x2 field parcels
    const cols = 2, rows = 2;
    const cellW = (farmW - 8) / cols;
    const cellH = (farmH - 8) / rows;
    const fieldNames = ['Field A (North-West)', 'Field B (North-East)', 'Field C (South-West)', 'Field D (South-East)'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = minX + 4 + c * cellW + cellW / 2;
        const z = minZ + 4 + r * cellH + cellH / 2;
        const idx = r * cols + c;

        // Field surface plane
        const fieldGeo = new THREE.PlaneGeometry(cellW - 2, cellH - 2);
        fieldGeo.rotateX(-Math.PI / 2);
        const fieldMat = new THREE.MeshLambertMaterial({
          color: new THREE.Color(COLORS.soilDark).lerp(new THREE.Color(COLORS.soil), 0.3 + idx * 0.1),
          transparent: true,
          opacity: 0.6,
        });
        const field = new THREE.Mesh(fieldGeo, fieldMat);
        field.position.set(x, 0.15, z);
        field.receiveShadow = true;
        field.userData = {
          type: 'field',
          name: fieldNames[idx],
          area_acres: ((cellW * cellH) / 4046.86 * 100).toFixed(1),
          index: idx,
        };
        this.groups.fields.add(field);

        // Furrow lines
        const furrowCount = Math.floor(cellW / 3);
        for (let f = 0; f < furrowCount; f++) {
          const fx = x - cellW / 2 + 2 + f * 3;
          const furrowGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(fx, 0.18, z - cellH / 2 + 1),
            new THREE.Vector3(fx, 0.18, z + cellH / 2 - 1),
          ]);
          const furrow = new THREE.Line(furrowGeo, new THREE.LineBasicMaterial({
            color: 0x6D5B3E, transparent: true, opacity: 0.3,
          }));
          this.groups.fields.add(furrow);
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // ROADS
  // ─────────────────────────────────────────────────────────────
  _buildRoads(spatialObjects) {
    const { minX, maxX, minZ, maxZ } = this.farmBounds;
    const midX = (minX + maxX) / 2;
    const midZ = (minZ + maxZ) / 2;

    // Main horizontal road through farm center
    this._createRoadSegment(minX - 5, midZ, maxX + 5, midZ, 3);
    // Main vertical road
    this._createRoadSegment(midX, minZ - 5, midX, maxZ + 5, 2.5);
    // Access road from edge
    this._createRoadSegment(maxX + 5, midZ, maxX + 20, midZ, 2);
  }

  _createRoadSegment(x1, z1, x2, z2, width) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dz, dx);

    const roadGeo = new THREE.PlaneGeometry(length, width);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMat = new THREE.MeshLambertMaterial({
      color: COLORS.road,
      transparent: true,
      opacity: 0.85,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set((x1 + x2) / 2, 0.2, (z1 + z2) / 2);
    road.rotation.y = -angle;
    road.receiveShadow = true;
    road.userData = { type: 'road', name: 'Farm Access Road' };
    this.groups.infrastructure.add(road);

    // Road edge lines
    const edgeMat = new THREE.LineBasicMaterial({ color: COLORS.roadDark, transparent: true, opacity: 0.5 });
    for (const side of [-1, 1]) {
      const perpX = -Math.sin(angle) * (width / 2) * side;
      const perpZ = Math.cos(angle) * (width / 2) * side;
      const edgeGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1 + perpX, 0.22, z1 + perpZ),
        new THREE.Vector3(x2 + perpX, 0.22, z2 + perpZ),
      ]);
      this.groups.infrastructure.add(new THREE.Line(edgeGeo, edgeMat));
    }
  }

  // ─────────────────────────────────────────────────────────────
  // WATER (pond, irrigation channels)
  // ─────────────────────────────────────────────────────────────
  _buildWater(spatialObjects) {
    const { maxX, maxZ } = this.farmBounds;

    // Rainwater pond
    const pondGeo = new THREE.CircleGeometry(6, 32);
    pondGeo.rotateX(-Math.PI / 2);
    const pondMat = new THREE.MeshPhongMaterial({
      color: COLORS.pond,
      transparent: true,
      opacity: 0.75,
      shininess: 100,
      specular: 0x4FC3F7,
    });
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.position.set(maxX - 12, 0.1, maxZ - 10);
    pond.userData = { type: 'water_source', name: 'Rainwater Harvesting Pond', capacity: '500,000 L' };
    this.groups.water.add(pond);

    // Pond rim
    const rimGeo = new THREE.TorusGeometry(6, 0.3, 8, 32);
    rimGeo.rotateX(-Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, new THREE.MeshLambertMaterial({ color: 0x795548 }));
    rim.position.copy(pond.position);
    rim.position.y = 0.3;
    this.groups.water.add(rim);

    // Animated water surface
    this.animatedObjects.push({
      type: 'water',
      mesh: pond,
      baseY: 0.1,
    });

    // Irrigation channels from pond to fields
    const midX = (this.farmBounds.minX + this.farmBounds.maxX) / 2;
    const midZ = (this.farmBounds.minZ + this.farmBounds.maxZ) / 2;

    const channelPoints = [
      [pond.position.x, pond.position.z],
      [midX + 10, maxZ - 10],
      [midX + 10, midZ],
      [midX - 15, midZ],
    ];

    for (let i = 0; i < channelPoints.length - 1; i++) {
      const [x1, z1] = channelPoints[i];
      const [x2, z2] = channelPoints[i + 1];
      const cGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, 0.15, z1),
        new THREE.Vector3(x2, 0.15, z2),
      ]);
      const channel = new THREE.Line(cGeo, new THREE.LineBasicMaterial({
        color: COLORS.water, linewidth: 2, transparent: true, opacity: 0.6,
      }));
      this.groups.water.add(channel);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // BUILDINGS
  // ─────────────────────────────────────────────────────────────
  _buildBuildings(spatialObjects) {
    const { minX, minZ, maxX, maxZ } = this.farmBounds;

    // 1. Farm Machinery Shed
    this._createBuilding(
      maxX - 5, 0, minZ + 8,
      12, 5, 8,
      COLORS.buildingWall, COLORS.buildingRoof,
      { type: 'building', name: 'Farm Machinery Shed & Bio-Storage', area_sqm: 300, status: 'operational' }
    );

    // 2. Nursery Polyhouse (transparent greenhouse)
    this._createPolyhouse(
      minX + 15, 0, maxZ - 8,
      10, 4, 6,
      { type: 'greenhouse', name: 'Climate-Controlled Nursery Polyhouse', area_sqm: 450, status: 'active' }
    );

    // 3. Small office / farmhouse
    this._createBuilding(
      maxX + 8, 0, 0,
      6, 4, 5,
      0xFFF8E1, 0xD7CCC8,
      { type: 'building', name: 'Farm Office & Control Room', status: 'operational' }
    );
  }

  _createBuilding(x, y, z, width, height, depth, wallColor, roofColor, userData) {
    const group = new THREE.Group();

    // Walls
    const wallGeo = new THREE.BoxGeometry(width, height, depth);
    const wallMat = new THREE.MeshLambertMaterial({ color: wallColor });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.set(0, height / 2, 0);
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    // Sloped roof
    const roofGeo = new THREE.ConeGeometry(Math.max(width, depth) * 0.6, 2.5, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshLambertMaterial({ color: roofColor });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, height + 1.25, 0);
    roof.castShadow = true;
    group.add(roof);

    // Door
    const doorGeo = new THREE.PlaneGeometry(1.5, 3);
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x5D4037, side: THREE.DoubleSide });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.5, depth / 2 + 0.02);
    group.add(door);

    group.position.set(x, y, z);
    group.userData = userData;
    walls.userData = userData;
    this.groups.buildings.add(group);

    // Label
    const label = this._createLabel(userData.name.split(' ')[0] + ' ' + (userData.name.split(' ')[1] || ''), 
      new THREE.Vector3(x, height + 4, z), '#e2e8f0', '0.7rem');
    this.groups.labels.add(label);
  }

  _createPolyhouse(x, y, z, width, height, depth, userData) {
    const group = new THREE.Group();

    // Frame
    const frameMat = new THREE.MeshLambertMaterial({ color: COLORS.polyhouseFrame });
    // Arch ribs
    const archCount = 5;
    for (let i = 0; i < archCount; i++) {
      const t = i / (archCount - 1);
      const az = -depth / 2 + t * depth;
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-width / 2, 0, az),
        new THREE.Vector3(0, height, az),
        new THREE.Vector3(width / 2, 0, az)
      );
      const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.08, 4, false);
      const tube = new THREE.Mesh(tubeGeo, frameMat);
      group.add(tube);
    }

    // Cover (semi-transparent)
    const coverGeo = new THREE.BoxGeometry(width, height * 0.7, depth);
    const coverMat = new THREE.MeshPhongMaterial({
      color: COLORS.polyhouse,
      transparent: true,
      opacity: 0.3,
      shininess: 80,
      side: THREE.DoubleSide,
    });
    const cover = new THREE.Mesh(coverGeo, coverMat);
    cover.position.set(0, height * 0.4, 0);
    group.add(cover);

    group.position.set(x, y, z);
    group.userData = userData;
    cover.userData = userData;
    this.groups.buildings.add(group);

    const label = this._createLabel('Polyhouse', new THREE.Vector3(x, height + 2, z), '#80CBC4', '0.7rem');
    this.groups.labels.add(label);
  }

  // ─────────────────────────────────────────────────────────────
  // INFRASTRUCTURE (borewell, weather station, sensors, cameras)
  // ─────────────────────────────────────────────────────────────
  _buildInfrastructure(spatialObjects) {
    const { minX, maxX, minZ, maxZ } = this.farmBounds;
    const midX = (minX + maxX) / 2;

    // 1. Solar Borewell Tower
    this._createBorewell(minX + 8, 0, minZ + 12);

    // 2. Weather Station
    this._createWeatherStation(maxX - 15, 0, minZ + 5);

    // 3. IoT Sensor nodes (4 corners + center)
    const sensorPositions = [
      [minX + 10, minZ + 10],
      [maxX - 10, minZ + 10],
      [minX + 10, maxZ - 10],
      [maxX - 10, maxZ - 10],
      [midX, 0],
    ];
    sensorPositions.forEach((pos, i) => {
      this._createSensorNode(pos[0], 0, pos[1], `Sensor-${i + 1}`);
    });

    // 4. Camera towers (2 positions)
    this._createCameraTower(minX + 5, 0, maxZ - 5, 'CAM-NORTH-01');
    this._createCameraTower(maxX - 5, 0, minZ + 5, 'CAM-SOUTH-01');
  }

  _createBorewell(x, y, z) {
    const group = new THREE.Group();

    // Tower base
    const baseGeo = new THREE.CylinderGeometry(1.2, 1.5, 0.5, 8);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x9E9E9E });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.25;
    group.add(base);

    // Pipe
    const pipeGeo = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
    const pipeMat = new THREE.MeshLambertMaterial({ color: COLORS.borewell });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.y = 3.5;
    pipe.castShadow = true;
    group.add(pipe);

    // Solar panel
    const panelGeo = new THREE.BoxGeometry(3, 0.1, 2);
    const panelMat = new THREE.MeshPhongMaterial({ color: 0x1A237E, shininess: 80, specular: 0x4FC3F7 });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0, 5.5, 0);
    panel.rotation.x = -0.4;
    panel.castShadow = true;
    group.add(panel);

    // Pump indicator (animated)
    const pumpGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const pumpMat = new THREE.MeshPhongMaterial({ color: COLORS.emerald, emissive: COLORS.emerald, emissiveIntensity: 0.3 });
    const pump = new THREE.Mesh(pumpGeo, pumpMat);
    pump.position.set(0, 1, 1);
    group.add(pump);
    this.animatedObjects.push({ type: 'blink', mesh: pump, speed: 2.0 });

    group.position.set(x, y, z);
    group.userData = { type: 'water_source', name: 'Solar Submersible Borewell (75m)', capacity_lph: 18000, status: 'active' };
    this.groups.infrastructure.add(group);

    const label = this._createLabel('Borewell', new THREE.Vector3(x, 7, z), '#00BCD4', '0.65rem');
    this.groups.labels.add(label);
  }

  _createWeatherStation(x, y, z) {
    const group = new THREE.Group();

    // Tower pole
    const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 8, 6);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0xCFD8DC });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 4;
    pole.castShadow = true;
    group.add(pole);

    // Anemometer (spinning cups)
    const anemGroup = new THREE.Group();
    const cupGeo = new THREE.SphereGeometry(0.25, 6, 6, 0, Math.PI);
    const cupMat = new THREE.MeshLambertMaterial({ color: 0xB0BEC5 });
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.5, 4),
        poleMat
      );
      arm.rotation.z = Math.PI / 2;
      arm.position.set(Math.cos(angle) * 0.75, 0, Math.sin(angle) * 0.75);
      anemGroup.add(arm);

      const cup = new THREE.Mesh(cupGeo, cupMat);
      cup.position.set(Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5);
      cup.rotation.y = angle;
      anemGroup.add(cup);
    }
    anemGroup.position.y = 8;
    group.add(anemGroup);
    this.animatedObjects.push({ type: 'spin', mesh: anemGroup, speed: 1.5, axis: 'y' });

    // Sensor box
    const boxGeo = new THREE.BoxGeometry(0.8, 0.5, 0.8);
    const boxMat = new THREE.MeshLambertMaterial({ color: 0xECEFF1 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = 6;
    group.add(box);

    group.position.set(x, y, z);
    group.userData = { type: 'sensor', name: 'LoRa Microclimate Weather Station', status: 'active' };
    this.groups.infrastructure.add(group);

    const label = this._createLabel('Weather Stn', new THREE.Vector3(x, 10, z), '#FFF176', '0.65rem');
    this.groups.labels.add(label);
  }

  _createSensorNode(x, y, z, name) {
    const group = new THREE.Group();

    // Stake
    const stakeGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.5, 4);
    const stake = new THREE.Mesh(stakeGeo, new THREE.MeshLambertMaterial({ color: 0x78909C }));
    stake.position.y = 0.75;
    group.add(stake);

    // Sensor head
    const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const headMat = new THREE.MeshPhongMaterial({
      color: COLORS.sensor,
      emissive: COLORS.sensor,
      emissiveIntensity: 0.2,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.6;
    group.add(head);

    this.animatedObjects.push({ type: 'blink', mesh: head, speed: 1.0 + Math.random() });

    group.position.set(x, y, z);
    group.userData = { type: 'sensor', name: `IoT ${name}`, status: 'online' };
    this.groups.infrastructure.add(group);
  }

  _createCameraTower(x, y, z, name) {
    const group = new THREE.Group();

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 5, 6);
    const pole = new THREE.Mesh(poleGeo, new THREE.MeshLambertMaterial({ color: 0x90A4AE }));
    pole.position.y = 2.5;
    pole.castShadow = true;
    group.add(pole);

    // Camera housing
    const camGeo = new THREE.BoxGeometry(0.6, 0.4, 0.8);
    const camMat = new THREE.MeshLambertMaterial({ color: 0x37474F });
    const cam = new THREE.Mesh(camGeo, camMat);
    cam.position.set(0, 5.2, 0.3);
    group.add(cam);

    // Lens
    const lensGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.3, 8);
    const lensMat = new THREE.MeshPhongMaterial({ color: 0x263238, shininess: 100, specular: 0x4FC3F7 });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 5.2, 0.75);
    group.add(lens);

    // LED
    const ledGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const ledMat = new THREE.MeshPhongMaterial({ color: 0xF44336, emissive: 0xF44336, emissiveIntensity: 0.8 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0.25, 5.4, 0);
    group.add(led);
    this.animatedObjects.push({ type: 'blink', mesh: led, speed: 0.8 });

    group.position.set(x, y, z);
    group.userData = { type: 'camera', name: name, status: 'recording', fov: '120°' };
    this.groups.infrastructure.add(group);
  }

  // ─────────────────────────────────────────────────────────────
  // CROPS (Instanced Mesh with 6 growth stages)
  // ─────────────────────────────────────────────────────────────
  _buildCrops(plantingGrid, cropPlan) {
    const { minX, maxX, minZ, maxZ } = this.farmBounds;
    const farmW = maxX - minX - 8;
    const farmH = maxZ - minZ - 8;

    const totalRows = plantingGrid?.total_rows || 24;
    const plantsPerRow = plantingGrid?.plants_per_row || 50;
    const totalPlants = Math.min(totalRows * plantsPerRow, 2400); // Cap for performance
    const healthyPct = (plantingGrid?.healthy_plants || 1180) / (plantingGrid?.total_plants || 1200);
    const stressedPct = (plantingGrid?.stressed_plants || 20) / (plantingGrid?.total_plants || 1200);

    // Determine current growth stage from day slider
    const currentStage = this._getCurrentStage(cropPlan);
    const stageIndex = currentStage ? currentStage.index : 2;

    // Create instanced mesh based on stage
    const { geometry, material, scale } = this._getCropGeometryForStage(stageIndex, cropPlan?.crop_type);

    const count = totalPlants;
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const colors = new Float32Array(count * 3);
    const healthyColor = new THREE.Color(this._getStageColor(stageIndex));
    const stressedColor = new THREE.Color(COLORS.cropStressed);
    const deadColor = new THREE.Color(COLORS.cropDead);

    let plantIdx = 0;
    const rowSpacing = farmH / totalRows;
    const colSpacing = farmW / plantsPerRow;

    for (let r = 0; r < totalRows && plantIdx < count; r++) {
      for (let c = 0; c < plantsPerRow && plantIdx < count; c++) {
        const x = minX + 4 + c * colSpacing + (Math.random() - 0.5) * 0.3;
        const z = minZ + 4 + r * rowSpacing + (Math.random() - 0.5) * 0.3;
        const y = 0.2;

        dummy.position.set(x, y, z);
        const s = scale * (0.85 + Math.random() * 0.3);
        dummy.scale.set(s, s * (0.9 + Math.random() * 0.2), s);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(plantIdx, dummy.matrix);

        // Color based on health
        const rand = Math.random();
        let color;
        if (rand > healthyPct + stressedPct) {
          color = deadColor;
        } else if (rand > healthyPct) {
          color = stressedColor;
        } else {
          color = healthyColor.clone();
          // Slight variation
          color.r += (Math.random() - 0.5) * 0.05;
          color.g += (Math.random() - 0.5) * 0.08;
        }
        instancedMesh.setColorAt(plantIdx, color);

        plantIdx++;
      }
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    instancedMesh.userData = { type: 'crops', totalPlants: plantIdx, stage: stageIndex };
    this.cropInstances = instancedMesh;
    this.groups.crops.add(instancedMesh);

    // Wind sway animation
    this.animatedObjects.push({ type: 'cropSway', mesh: instancedMesh, count: plantIdx });
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
    const t = cropType?.toLowerCase() || 'wheat';
    switch (stageIndex) {
      case 0: // Sowing — small mounds
        return {
          geometry: new THREE.SphereGeometry(0.15, 4, 4),
          material: new THREE.MeshLambertMaterial({ color: COLORS.cropSeed }),
          scale: 1.0,
        };
      case 1: // Germination — tiny sprouts
        return {
          geometry: new THREE.ConeGeometry(0.08, 0.5, 4),
          material: new THREE.MeshLambertMaterial({ color: COLORS.cropSprout }),
          scale: 1.0,
        };
      case 2: // Vegetative — growing stalks
        return {
          geometry: new THREE.CylinderGeometry(0.05, 0.08, 1.2, 5),
          material: new THREE.MeshLambertMaterial({ color: COLORS.cropVegetative }),
          scale: t.includes('rice') ? 0.8 : (t.includes('cotton') ? 1.3 : 1.0),
        };
      case 3: // Flowering — flowers/heads
        return {
          geometry: this._createFlowerGeometry(),
          material: new THREE.MeshLambertMaterial({ color: COLORS.cropFlowering }),
          scale: t.includes('tomato') ? 0.9 : 1.1,
        };
      case 4: // Fruiting/grain fill
        return {
          geometry: this._createFruitGeometry(t),
          material: new THREE.MeshLambertMaterial({ color: COLORS.cropFruiting }),
          scale: 1.2,
        };
      case 5: // Harvest ready — golden
      default:
        return {
          geometry: this._createHarvestGeometry(t),
          material: new THREE.MeshLambertMaterial({ color: COLORS.cropHarvest }),
          scale: t.includes('wheat') ? 1.4 : 1.2,
        };
    }
  }

  _createFlowerGeometry() {
    // Stalk with flower head
    const geo = new THREE.CylinderGeometry(0.04, 0.07, 1.5, 5);
    return geo;
  }

  _createFruitGeometry(cropType) {
    if (cropType.includes('tomato')) {
      return new THREE.SphereGeometry(0.15, 6, 6);
    }
    if (cropType.includes('cotton')) {
      return new THREE.DodecahedronGeometry(0.12, 0);
    }
    return new THREE.CylinderGeometry(0.06, 0.08, 1.8, 5);
  }

  _createHarvestGeometry(cropType) {
    if (cropType.includes('wheat')) {
      return new THREE.CylinderGeometry(0.03, 0.06, 2.0, 4);
    }
    if (cropType.includes('rice')) {
      return new THREE.CylinderGeometry(0.04, 0.07, 1.4, 5);
    }
    return new THREE.CylinderGeometry(0.05, 0.08, 1.6, 5);
  }

  _getStageColor(stageIndex) {
    const stageColors = [
      COLORS.cropSeed, COLORS.cropSprout, COLORS.cropVegetative,
      COLORS.cropFlowering, COLORS.cropFruiting, COLORS.cropHarvest
    ];
    return stageColors[Math.min(stageIndex, stageColors.length - 1)];
  }

  // ─────────────────────────────────────────────────────────────
  // WORKERS (Procedural character meshes)
  // ─────────────────────────────────────────────────────────────
  _buildWorkers(workers) {
    if (!workers || workers.length === 0) {
      // Default workers
      workers = [
        { id: 'w1', name: 'Sunita Devi', role: 'worker', position: { x: -15, z: -10 }, current_task: { title: 'Irrigating Field A', type: 'watering' }, fatigue_index: 42 },
        { id: 'w2', name: 'Mamata Behera', role: 'worker', position: { x: 10, z: 5 }, current_task: { title: 'Spraying Pesticide', type: 'spraying' }, fatigue_index: 58 },
        { id: 'w3', name: 'Balwinder Singh', role: 'farmer', position: { x: -5, z: 20 }, current_task: { title: 'Inspecting Crops', type: 'inspecting' }, fatigue_index: 35 },
        { id: 'w4', name: 'Dr. Priya Sharma', role: 'agronomist', position: { x: 25, z: -15 }, current_task: { title: 'Soil Sampling', type: 'inspecting' }, fatigue_index: 28 },
      ];
    }

    workers.forEach((worker, i) => {
      const workerGroup = this._createWorkerCharacter(worker);
      this.workerMeshes.push({ group: workerGroup, data: worker, animPhase: Math.random() * Math.PI * 2 });
    });
  }

  _createWorkerCharacter(worker) {
    const group = new THREE.Group();
    const roleColor = worker.role === 'farmer' ? COLORS.workerFarmer :
                      worker.role === 'agronomist' ? COLORS.workerAgronomist :
                      COLORS.workerLabor;

    // Body (capsule = cylinder + 2 hemispheres)
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.3, 1.2, 8);
    const bodyMat = new THREE.MeshLambertMaterial({ color: roleColor });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.4;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const headMat = new THREE.MeshLambertMaterial({ color: COLORS.workerSkin });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.3;
    head.castShadow = true;
    group.add(head);

    // Hat
    const hatGeo = new THREE.CylinderGeometry(0.4, 0.35, 0.15, 8);
    const hatMat = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 2.55;
    group.add(hat);
    const hatBrimGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.04, 12);
    const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
    hatBrim.position.y = 2.48;
    group.add(hatBrim);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.8, 4);
    const armMat = new THREE.MeshLambertMaterial({ color: COLORS.workerSkin });
    [-1, 1].forEach(side => {
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(side * 0.5, 1.5, 0);
      arm.rotation.z = side * 0.2;
      group.add(arm);
    });

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.8, 4);
    const legMat = new THREE.MeshLambertMaterial({ color: 0x5D4037 });
    [-1, 1].forEach(side => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(side * 0.2, 0.4, 0);
      group.add(leg);
    });

    // Position
    const px = worker.position?.x || (Math.random() * 60 - 30);
    const pz = worker.position?.z || (Math.random() * 50 - 25);
    group.position.set(px, 0, pz);

    // Name label
    const label = this._createLabel(
      worker.name || 'Worker',
      new THREE.Vector3(0, 3.2, 0),
      roleColor === COLORS.workerFarmer ? '#4CAF50' :
      roleColor === COLORS.workerAgronomist ? '#2196F3' : '#FF9800',
      '0.65rem'
    );
    group.add(label);

    // Interaction data
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

    this.groups.workers.add(group);
    return group;
  }

  // ─────────────────────────────────────────────────────────────
  // WEATHER EFFECTS
  // ─────────────────────────────────────────────────────────────
  _applyWeather(weather) {
    if (!weather) weather = { condition: 'clear' };
    this.currentWeather = weather.condition || 'clear';

    // Remove existing weather effects
    while (this.groups.weather.children.length > 0) {
      const child = this.groups.weather.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      this.groups.weather.remove(child);
    }
    this.cloudMeshes = [];
    this.rainParticles = null;

    switch (this.currentWeather) {
      case 'clear':
        this._setWeatherClear();
        break;
      case 'cloudy':
        this._setWeatherCloudy();
        break;
      case 'rain':
        this._setWeatherRain();
        break;
      case 'heatwave':
        this._setWeatherHeatwave();
        break;
    }
  }

  _setWeatherClear() {
    this.scene.background = new THREE.Color(COLORS.skyDay);
    this.scene.fog = new THREE.FogExp2(0xCCE5FF, 0.003);
    this._sunLight.intensity = 1.2;
    this._sunLight.color.set(0xFFF8E1);
    this._ambientLight.intensity = 0.5;
    this.renderer.toneMappingExposure = 1.2;
  }

  _setWeatherCloudy() {
    this.scene.background = new THREE.Color(0xB0BEC5);
    this.scene.fog = new THREE.FogExp2(0xB0BEC5, 0.006);
    this._sunLight.intensity = 0.6;
    this._sunLight.color.set(0xE0E0E0);
    this._ambientLight.intensity = 0.7;
    this.renderer.toneMappingExposure = 0.9;

    // Cloud planes
    this._addClouds(8);
  }

  _setWeatherRain() {
    this.scene.background = new THREE.Color(0x78909C);
    this.scene.fog = new THREE.FogExp2(0x78909C, 0.008);
    this._sunLight.intensity = 0.3;
    this._sunLight.color.set(0xB0BEC5);
    this._ambientLight.intensity = 0.8;
    this.renderer.toneMappingExposure = 0.7;

    // Clouds
    this._addClouds(12);

    // Rain particles
    this._addRainParticles();
  }

  _setWeatherHeatwave() {
    this.scene.background = new THREE.Color(0xFFCC80);
    this.scene.fog = new THREE.FogExp2(0xFFE0B2, 0.004);
    this._sunLight.intensity = 1.8;
    this._sunLight.color.set(0xFFD54F);
    this._ambientLight.intensity = 0.6;
    this._ambientLight.color.set(0xFFE0B2);
    this.renderer.toneMappingExposure = 1.5;
  }

  _addClouds(count) {
    for (let i = 0; i < count; i++) {
      const cloudGroup = new THREE.Group();
      const blobCount = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < blobCount; j++) {
        const blobGeo = new THREE.SphereGeometry(
          3 + Math.random() * 4, 6, 4
        );
        const blobMat = new THREE.MeshLambertMaterial({
          color: 0xECEFF1,
          transparent: true,
          opacity: 0.7 + Math.random() * 0.2,
        });
        const blob = new THREE.Mesh(blobGeo, blobMat);
        blob.position.set(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 5
        );
        blob.scale.y = 0.4 + Math.random() * 0.3;
        cloudGroup.add(blob);
      }

      cloudGroup.position.set(
        (Math.random() - 0.5) * 120,
        35 + Math.random() * 15,
        (Math.random() - 0.5) * 100
      );
      this.groups.weather.add(cloudGroup);
      this.cloudMeshes.push(cloudGroup);
    }
  }

  _addRainParticles() {
    const particleCount = 3000;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: COLORS.rain,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    this.rainParticles = new THREE.Points(geo, mat);
    this.groups.weather.add(this.rainParticles);
  }

  // ─────────────────────────────────────────────────────────────
  // LABELS (CSS2D)
  // ─────────────────────────────────────────────────────────────
  _createLabel(text, position, color = '#e2e8f0', fontSize = '0.7rem', bold = false) {
    const div = document.createElement('div');
    div.textContent = text;
    div.style.cssText = `
      color: ${color};
      font-family: 'Inter', sans-serif;
      font-size: ${fontSize};
      font-weight: ${bold ? '700' : '600'};
      text-shadow: 0 1px 3px rgba(0,0,0,0.6);
      pointer-events: none;
      white-space: nowrap;
    `;
    const label = new CSS2DObject(div);
    label.position.copy(position);
    return label;
  }

  // ─────────────────────────────────────────────────────────────
  // CLICK / INSPECT
  // ─────────────────────────────────────────────────────────────
  _onClick(event, container) {
    const rect = container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Gather all clickable meshes
    const clickables = [];
    const traverse = (group) => {
      group.traverse(obj => {
        if (obj.isMesh && obj.userData && obj.userData.type) {
          clickables.push(obj);
        }
      });
    };
    traverse(this.groups.buildings);
    traverse(this.groups.infrastructure);
    traverse(this.groups.workers);
    traverse(this.groups.fields);
    traverse(this.groups.water);

    const intersects = this.raycaster.intersectObjects(clickables, false);
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const data = hit.userData;

      // Walk up parent to find group-level userData if needed
      let entityData = data;
      if (!entityData.name && hit.parent && hit.parent.userData && hit.parent.userData.name) {
        entityData = hit.parent.userData;
      }

      this.selectedEntity = entityData;

      // Highlight effect
      this._highlightEntity(hit);

      // Callback
      if (this.onEntityInspect) {
        this.onEntityInspect(entityData);
      }
    } else {
      this.selectedEntity = null;
      if (this.onEntityInspect) {
        this.onEntityInspect(null);
      }
    }
  }

  _highlightEntity(mesh) {
    // Reset previous highlights
    this.scene.traverse(obj => {
      if (obj._originalEmissive !== undefined && obj.material) {
        obj.material.emissive?.setHex(obj._originalEmissive);
        delete obj._originalEmissive;
      }
    });

    // Apply highlight
    if (mesh.material && mesh.material.emissive) {
      mesh._originalEmissive = mesh.material.emissive.getHex();
      mesh.material.emissive.setHex(0x10B981);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CAMERA PRESETS
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
    this._animateCamera(
      new THREE.Vector3(...p.pos),
      new THREE.Vector3(...p.target)
    );
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
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad

      this.camera.position.lerpVectors(startPos, targetPos, ease);
      this.controls.target.lerpVectors(startLook, targetLook, ease);
      this.controls.update();

      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }

  // ─────────────────────────────────────────────────────────────
  // LAYER TOGGLES
  // ─────────────────────────────────────────────────────────────
  setLayerVisibility(layerName, visible) {
    this.layers[layerName] = visible;
    const groupMap = {
      fields: this.groups.fields,
      crops: this.groups.crops,
      workers: this.groups.workers,
      infrastructure: this.groups.infrastructure,
      risks: this.groups.risks,
    };
    if (groupMap[layerName]) {
      groupMap[layerName].visible = visible;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // TIME SIMULATION
  // ─────────────────────────────────────────────────────────────
  setDay(dayNumber) {
    this.currentDay = dayNumber;
    // Rebuild crops for new stage
    if (this.sceneData) {
      // Clear only crops group
      while (this.groups.crops.children.length > 0) {
        const child = this.groups.crops.children[0];
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
        this.groups.crops.remove(child);
      }
      // Remove crop sway animation
      this.animatedObjects = this.animatedObjects.filter(a => a.type !== 'cropSway');
      this._buildCrops(this.sceneData.planting_grid, this.sceneData.crop_plan);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // WEATHER CONTROL (from UI)
  // ─────────────────────────────────────────────────────────────
  setWeather(condition) {
    this._applyWeather({ condition });
  }

  // ─────────────────────────────────────────────────────────────
  // EVENT HANDLER (from WebSocket)
  // ─────────────────────────────────────────────────────────────
  applyEvent(eventData) {
    const type = eventData.event_type;
    console.log('[3D Twin] Applying event:', type);

    switch (type) {
      case 'DIGITAL_TWIN_TELEMETRY_UPDATED':
        // Update HUD values via callback
        if (this.onTelemetryUpdate) this.onTelemetryUpdate(eventData.payload);
        break;

      case 'FARM_HEALTH_UPDATED':
        // Flash health indicator
        this._flashHealthUpdate(eventData.payload);
        break;

      case 'RISK_ALERT_GENERATED':
        // Spawn alert sphere
        this._spawnRiskAlert(eventData.payload);
        break;

      case 'SIMULATION_TRIGGERED':
        // Handle scenario
        if (eventData.payload.scenario === 'pest_outbreak') {
          this._spawnRiskAlert({ severity: 'high', title: 'Pest Outbreak', x: 0, z: 0 });
        }
        if (eventData.payload.scenario === 'heavy_rainfall') {
          this.setWeather('rain');
        }
        break;

      case 'TASK_CREATED':
      case 'TASK_STATUS_UPDATED':
        // Could update worker animations
        break;

      case 'WEATHER_CHANGED':
        this.setWeather(eventData.payload.condition || 'clear');
        break;

      case 'farm_calibrated_3d':
      case 'structure_version_created':
        // Full scene rebuild needed
        if (this.onSceneRebuildNeeded) this.onSceneRebuildNeeded();
        break;

      case 'planting_grid_updated':
        // Rebuild crops
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
    // Brief green/red flash on terrain
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

    // Fade out
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
    const color = severity === 'high' ? COLORS.alertRed :
                  severity === 'critical' ? COLORS.alertRed : COLORS.alertAmber;

    const sphereGeo = new THREE.SphereGeometry(3, 12, 12);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(x, 3, z);
    sphere.userData = {
      type: 'risk',
      name: payload.title || 'Risk Alert',
      severity: severity,
    };
    this.groups.risks.add(sphere);

    // Pulsing animation
    this.animatedObjects.push({ type: 'pulse', mesh: sphere, speed: 2.0 });

    // Auto-remove after 30 seconds
    setTimeout(() => {
      this.groups.risks.remove(sphere);
      sphereGeo.dispose();
      sphereMat.dispose();
      this.animatedObjects = this.animatedObjects.filter(a => a.mesh !== sphere);
    }, 30000);
  }

  // ─────────────────────────────────────────────────────────────
  // ANIMATION LOOP
  // ─────────────────────────────────────────────────────────────
  startAnimationLoop() {
    const animate = () => {
      if (this.isDestroyed) return;
      this.animFrameId = requestAnimationFrame(animate);

      const delta = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();

      // Update controls
      this.controls.update();

      // Animate objects
      this._updateAnimations(elapsed, delta);

      // Render main scene
      this.renderer.render(this.scene, this.camera);

      // Render labels
      if (this.labelRenderer) {
        this.labelRenderer.render(this.scene, this.camera);
      }

      // Render minimap
      if (this.minimapRenderer && this.minimapCamera) {
        // Temporarily hide labels for minimap
        this.groups.labels.visible = false;
        this.minimapRenderer.render(this.scene, this.minimapCamera);
        this.groups.labels.visible = true;
      }
    };

    animate();
  }

  _updateAnimations(elapsed, delta) {
    // Animated objects
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

        case 'water': {
          anim.mesh.position.y = anim.baseY + Math.sin(elapsed * 0.5) * 0.05;
          break;
        }

        case 'cropSway': {
          // Subtle wind sway on instanced crops
          if (anim.mesh.instanceMatrix) {
            const dummy = new THREE.Object3D();
            const swayAmount = 0.02;
            // Only sway a subset for performance
            const step = Math.max(1, Math.floor(anim.count / 200));
            for (let i = 0; i < anim.count; i += step) {
              anim.mesh.getMatrixAt(i, dummy.matrix);
              dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
              const sway = Math.sin(elapsed * 1.5 + i * 0.1) * swayAmount;
              dummy.rotation.z = sway;
              dummy.rotation.x = Math.sin(elapsed * 1.2 + i * 0.15) * swayAmount * 0.5;
              dummy.updateMatrix();
              anim.mesh.setMatrixAt(i, dummy.matrix);
            }
            anim.mesh.instanceMatrix.needsUpdate = true;
          }
          break;
        }
      }
    }

    // Worker idle animation (gentle bobbing)
    for (const w of this.workerMeshes) {
      const bob = Math.sin(elapsed * 2 + w.animPhase) * 0.06;
      w.group.position.y = bob;
      // Slight body rotation for "looking around"
      w.group.rotation.y = Math.sin(elapsed * 0.3 + w.animPhase) * 0.15;
    }

    // Cloud drift
    for (const cloud of this.cloudMeshes) {
      cloud.position.x += delta * 1.5;
      if (cloud.position.x > 80) cloud.position.x = -80;
    }

    // Rain particles
    if (this.rainParticles) {
      const positions = this.rainParticles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= delta * 25; // Fall speed
        if (positions[i + 1] < 0) {
          positions[i + 1] = 40 + Math.random() * 10;
          positions[i] = (Math.random() - 0.5) * 120;
          positions[i + 2] = (Math.random() - 0.5) * 100;
        }
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // STATE UPDATE (from adapter)
  // ─────────────────────────────────────────────────────────────
  updateState(snapshot) {
    // Update telemetry values used by HUD
    if (this.sceneData) {
      this.sceneData.telemetry = snapshot;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // FOCUS ENTITY
  // ─────────────────────────────────────────────────────────────
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
      this._animateCamera(
        new THREE.Vector3(pos.x + 10, pos.y + 12, pos.z + 10),
        pos
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // GET SCENE INFO (for HUD updates)
  // ─────────────────────────────────────────────────────────────
  getSceneInfo() {
    return {
      totalObjects: this.scene.children.length,
      cropCount: this.cropInstances ? this.cropInstances.count : 0,
      workerCount: this.workerMeshes.length,
      currentDay: this.currentDay,
      maxDays: this.maxDays,
      weather: this.currentWeather,
      activePreset: this.activePreset,
      layers: { ...this.layers },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // DESTROY (cleanup WebGL context)
  // ─────────────────────────────────────────────────────────────
  destroy() {
    this.isDestroyed = true;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }

    // Dispose all geometries and materials
    this.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }

    if (this.labelRenderer) {
      this.labelRenderer.domElement.remove();
    }

    if (this.minimapRenderer) {
      this.minimapRenderer.dispose();
    }

    this.controls?.dispose();

    console.log('[3D Twin] Engine destroyed');
  }
}
