/**
 * Cozy 3D Isometric Snow-Plowing Engine
 * Enhanced with Town Districts & Reputation, Dynamic Weather System,
 * Emissive Atmospheric Lighting, and Accurate Road Cell Coverage.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { synthAudio } from '../audio/synthAudio';
import {
  VehicleUpgrades,
  VehicleSkin,
  LevelConfig,
  ActiveGameStats,
  WeatherType,
  TownDistrict,
} from '../types/game';

// Pre-allocated math helpers to ensure 0 GC in render loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3Cam = new THREE.Vector3();
const _vec3CamTarget = new THREE.Vector3();

export interface SolidObstacle {
  type: 'box' | 'circle';
  x: number;
  z: number;
  radius: number;
  halfW?: number;
  halfD?: number;
  rotation?: number;
}

export interface SnowDriftItem {
  id: number;
  mesh: THREE.Group;
  position: THREE.Vector3;
  radius: number;
  type: 'drift' | 'golden' | 'gift' | 'snowman';
  cleared: boolean;
  value: number;
}

export class SnowScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private isSoftwareGl: boolean = false;
  private animFrameId: number = 0;
  private isDestroyed: boolean = false;

  // Physical Solid Obstacles (Cabins, Trees, Lamps)
  private solidObstacles: SolidObstacle[] = [];

  // Level & World State
  private levelConfig: LevelConfig;
  private vehicleUpgrades: VehicleUpgrades;
  private vehicleSkin: VehicleSkin;

  // Lighting & Atmosphere
  private keyLight: THREE.DirectionalLight | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;
  private rimLight: THREE.DirectionalLight | null = null;
  private ambientFog: THREE.Fog | null = null;

  // Dynamic Weather State
  private activeWeather: WeatherType = 'light_snow';
  private weatherTimer: number = 42; // countdown per cycle
  private weatherCycleIndex: number = 0;
  private weatherAlertPlayed: boolean = false;
  private weatherNotification: string = '';

  // Town Districts & Reputation
  private townDistricts: TownDistrict[] = [];

  // Accurate Road Grid Tracking for Progress Bar
  private gridResolution = 48; // 48x48 road grid
  private isRoadCell: boolean[][] = [];
  private isClearedCell: boolean[][] = [];
  private totalRoadCells: number = 0;
  private clearedRoadCellsCount: number = 0;

  // Player Vehicle
  private playerGroup: THREE.Group = new THREE.Group();
  private bladeMesh: THREE.Mesh | null = null;
  private leftBladeArm: THREE.Mesh | null = null;
  private rightBladeArm: THREE.Mesh | null = null;
  private wheelMeshes: THREE.Mesh[] = [];
  private beaconLight: THREE.PointLight | null = null;
  private beaconMesh: THREE.Mesh | null = null;
  private headlightCones: THREE.Mesh[] = [];
  private headlightLights: THREE.SpotLight[] = [];

  // Vehicle Kinematics
  private posX: number = 0;
  private posZ: number = 0;
  private angle: number = 0; // heading angle in radians
  private speed: number = 0; // forward/backward speed
  private angularVelocity: number = 0;
  private boostFuel: number = 100;
  private isBoosting: boolean = false;
  private isIceDrifting: boolean = false;

  // Input states
  private heldKeys: { [key: string]: boolean } = {};

  // Snow Canvas Clearing System
  private snowCanvasSize = 512;
  private snowCanvas: HTMLCanvasElement;
  private snowCtx: CanvasRenderingContext2D;
  private snowTexture: THREE.CanvasTexture;
  private groundPlaneMesh: THREE.Mesh | null = null;

  // 3D Snow Drift Objects & Collectibles
  private snowDrifts: SnowDriftItem[] = [];

  // Particle Systems
  private snowParticles: THREE.Points | null = null; // ambient snowfall
  private snowParticlesCount = 800;
  private snowParticlePositions: Float32Array = new Float32Array(0);

  // Dynamic Plowing Spray Particles
  private sprayParticlesCount = 350;
  private sprayPositions: Float32Array = new Float32Array(0);
  private sprayVelocities: Float32Array = new Float32Array(0);
  private sprayLifetimes: Float32Array = new Float32Array(0);
  private sprayPointsMesh: THREE.Points | null = null;
  private sprayIndex = 0;

  // Camera Shake & Follow
  private camShakeIntensity: number = 0;
  private camShakeDecay: number = 0.92;
  private camFollowTarget: THREE.Vector3 = new THREE.Vector3();
  private frustumSize: number = 32;

  // Game Stats Callback
  private onStatsUpdate: ((stats: ActiveGameStats) => void) | null = null;
  private onLevelComplete: (() => void) | null = null;

  // Stats tracking
  private stats: ActiveGameStats = {
    clearedPercent: 0,
    totalSnowUnits: 1000,
    clearedUnits: 0,
    combo: 1,
    comboTimer: 0,
    score: 0,
    coinsEarned: 0,
    boostFuel: 100,
    maxBoostFuel: 100,
    isBoosting: false,
    speed: 0,
    elapsedTime: 0,
    currentDistrictName: 'Maple Residential Loop',
    currentDistrictReputation: 50,
    currentDistrictTier: 'Neutral',
    overallTownReputation: 50,
    activeWeather: 'light_snow',
    weatherTimeRemaining: 42,
    weatherNotification: '',
  };

  private lastTime: number = performance.now();
  private hitstopTimer: number = 0;
  private isLevelFinished: boolean = false;

  constructor(
    container: HTMLElement,
    levelConfig: LevelConfig,
    upgrades: VehicleUpgrades,
    skin: VehicleSkin,
    onStatsUpdate?: (stats: ActiveGameStats) => void,
    onLevelComplete?: () => void
  ) {
    this.container = container;
    this.levelConfig = levelConfig;
    this.vehicleUpgrades = upgrades;
    this.vehicleSkin = skin;
    this.onStatsUpdate = onStatsUpdate || null;
    this.onLevelComplete = onLevelComplete || null;

    // Detect software WebGL per Three.js guidelines
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // Initialize Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    // Create Scene & Environment
    this.scene = new THREE.Scene();
    this.setupAtmosphere();

    // Setup Orthographic Isometric Camera
    const aspect = width / height;
    this.camera = new THREE.OrthographicCamera(
      (-this.frustumSize * aspect) / 2,
      (this.frustumSize * aspect) / 2,
      this.frustumSize / 2,
      -this.frustumSize / 2,
      0.1,
      250
    );

    // Isometric 45 deg angle
    this.camera.position.set(35, 42, 35);
    this.camera.lookAt(0, 0, 0);

    // Setup Dynamic Snow Mask Canvas
    this.snowCanvas = document.createElement('canvas');
    this.snowCanvas.width = this.snowCanvasSize;
    this.snowCanvas.height = this.snowCanvasSize;
    this.snowCtx = this.snowCanvas.getContext('2d', { willReadFrequently: true })!;
    this.snowTexture = new THREE.CanvasTexture(this.snowCanvas);
    this.snowTexture.colorSpace = THREE.SRGBColorSpace;
    this.snowTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    // Initialize Districts & Road Grid
    this.setupTownDistricts();
    this.setupRoadGrid();

    // Build World
    this.buildTerrain();
    this.buildTownProps();
    this.buildSnowDrifts();
    this.buildPlayerVehicle();
    this.setupFallingSnow();
    this.setupSprayParticles();

    // Event Listeners
    this.setupKeyListeners();
    window.addEventListener('resize', this.onResize);

    // Start Simulation Loop
    this.lastTime = performance.now();
    this.startLoop();
  }

  private setupAtmosphere() {
    // Soft, luminous winter sky & emissive horizon
    const skyColor = 0xd5e6f3;
    const groundColor = 0xa4b9c9;
    const sunColor = 0xfff6e6;

    this.scene.background = new THREE.Color(skyColor);

    // Emissive, atmospheric fog:
    // Far enough (near: 42, far: 115) so the playfield, buildings, and vehicle remain
    // vivid and luminescent, while distant borders blend seamlessly into the glowing sky!
    this.ambientFog = new THREE.Fog(skyColor, 42, 115);
    this.scene.fog = this.ambientFog;

    // Procedural Studio Environment for PBR metallic blades & glass
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch (e) {
      console.warn('PMREM environment generation skipped:', e);
    }

    // Warm Key Light (Directional with tight shadow bounds)
    this.keyLight = new THREE.DirectionalLight(sunColor, 1.65);
    this.keyLight.position.set(30, 45, 20);
    this.keyLight.castShadow = !this.isSoftwareGl;
    if (this.keyLight.castShadow) {
      this.keyLight.shadow.mapSize.width = 1024;
      this.keyLight.shadow.mapSize.height = 1024;
      this.keyLight.shadow.camera.near = 10;
      this.keyLight.shadow.camera.far = 120;
      const d = 36;
      this.keyLight.shadow.camera.left = -d;
      this.keyLight.shadow.camera.right = d;
      this.keyLight.shadow.camera.top = d;
      this.keyLight.shadow.camera.bottom = -d;
      this.keyLight.shadow.bias = -0.0004;
      this.keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.keyLight);

    // Cool Hemisphere Fill Light
    this.hemiLight = new THREE.HemisphereLight(skyColor, groundColor, 1.05);
    this.scene.add(this.hemiLight);

    // Subtle Rim Light for crisp silhouette
    this.rimLight = new THREE.DirectionalLight(0xd6ecfa, 0.7);
    this.rimLight.position.set(-25, 20, -25);
    this.scene.add(this.rimLight);
  }

  private setupTownDistricts() {
    const w = this.levelConfig.size.width;
    const l = this.levelConfig.size.length;

    // 4 Distinct Neighborhood Districts with clear geographical quadrants
    this.townDistricts = [
      {
        id: 'maple_residential',
        name: 'Maple Residential Loop',
        icon: '🏡',
        description: 'Suburban homes, driveways, and postal routes.',
        bounds: { minX: -w / 2, maxX: 0, minZ: -l / 2, maxZ: 0 },
        clearedPercent: 0,
        reputation: 40,
        reputationTier: 'Neutral',
        payoutBonus: 1.0,
        urgentNotice: 'Mrs. Higgins: Snowbank is blocking morning mail delivery!',
      },
      {
        id: 'town_center',
        name: 'Town Center Commercial Strip',
        icon: '🏪',
        description: 'Main street, bakery, general store, and town hall.',
        bounds: { minX: 0, maxX: w / 2, minZ: -l / 2, maxZ: 0 },
        clearedPercent: 0,
        reputation: 50,
        reputationTier: 'Neutral',
        payoutBonus: 1.1,
        urgentNotice: 'Bakery Shop: Delivery trucks stuck at the curb!',
      },
      {
        id: 'clinic_route',
        name: 'Highland Clinic & School Zone',
        icon: '🏥',
        description: 'Crucial emergency access lane & school bus route.',
        bounds: { minX: -w / 2, maxX: 0, minZ: 0, maxZ: l / 2 },
        clearedPercent: 0,
        reputation: 45,
        reputationTier: 'Neutral',
        payoutBonus: 1.25,
        urgentNotice: 'Clinic: Ambulance entrance needs immediate clearing!',
      },
      {
        id: 'pine_overlook',
        name: 'Pine Ridge & Ice Rink Park',
        icon: '🌲',
        description: 'Scenic recreation trail, frozen fountain, and cabins.',
        bounds: { minX: 0, maxX: w / 2, minZ: 0, maxZ: l / 2 },
        clearedPercent: 0,
        reputation: 60,
        reputationTier: 'Respected',
        payoutBonus: 1.15,
      },
    ];
  }

  private setupRoadGrid() {
    // 48x48 cell road network grid for 100% accurate, responsive progress tracking
    const res = this.gridResolution;
    this.isRoadCell = [];
    this.isClearedCell = [];
    this.totalRoadCells = 0;
    this.clearedRoadCellsCount = 0;

    const w = this.levelConfig.size.width;
    const l = this.levelConfig.size.length;

    for (let x = 0; x < res; x++) {
      this.isRoadCell[x] = [];
      this.isClearedCell[x] = [];
      for (let z = 0; z < res; z++) {
        // Map grid cell [0..res-1] to world space [-w/2..w/2, -l/2..l/2]
        const wx = (x / (res - 1) - 0.5) * w;
        const wz = (z / (res - 1) - 0.5) * l;

        // Realistic Spacious Town Diorama:
        // Central park plaza + sweeping outer boulevard + 4 connecting driveways
        // Open snowy lawns, gardens, and pine groves between streets!
        const distFromCenter = Math.hypot(wx, wz);

        // 1. Central open park plaza & skating pond (open area to plow)
        const inCenterPlaza = distFromCenter <= 7.2;

        // 2. Wide sweeping main outer boulevard
        const inMainBoulevard = distFromCenter >= 14.0 && distFromCenter <= 20.0;

        // 3. Four approach roads connecting center to outer boulevard
        const inConnectingAvenues =
          (Math.abs(wx) <= 3.2 && distFromCenter <= 20.5) ||
          (Math.abs(wz) <= 3.2 && distFromCenter <= 20.5);

        // 4. Driveway aprons leading directly into cabin carports
        const inDriveways =
          (Math.abs(wx) >= 15 && Math.abs(wx) <= 22 && Math.abs(wz) <= 3.8) ||
          (Math.abs(wz) >= 15 && Math.abs(wz) <= 22 && Math.abs(wx) <= 3.8);

        const isRoad = inCenterPlaza || inMainBoulevard || inConnectingAvenues || inDriveways;

        this.isRoadCell[x][z] = isRoad;
        this.isClearedCell[x][z] = false;

        if (isRoad) {
          this.totalRoadCells++;
        }
      }
    }

    if (this.totalRoadCells === 0) this.totalRoadCells = 1;
    this.stats.totalSnowUnits = this.totalRoadCells;
  }

  private buildTerrain() {
    const worldW = this.levelConfig.size.width;
    const worldL = this.levelConfig.size.length;

    // Reset with full pristine snow (#ffffff)
    this.snowCtx.fillStyle = '#ffffff';
    this.snowCtx.fillRect(0, 0, this.snowCanvasSize, this.snowCanvasSize);
    this.snowTexture.needsUpdate = true;

    // 1. Base Terrain Mesh with Asphalt / Cobblestone ground
    this.solidObstacles = [];
    const baseGeo = new THREE.PlaneGeometry(worldW + 24, worldL + 24, 32, 32);
    baseGeo.rotateX(-Math.PI / 2);

    // Procedural asphalt texture
    const asphaltCanvas = document.createElement('canvas');
    asphaltCanvas.width = 256;
    asphaltCanvas.height = 256;
    const actx = asphaltCanvas.getContext('2d')!;
    actx.fillStyle = '#30353d';
    actx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2000; i++) {
      actx.fillStyle = Math.random() > 0.5 ? '#3a414b' : '#262930';
      actx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    // Subtle road dashes
    actx.fillStyle = '#eab308';
    actx.fillRect(124, 20, 8, 40);
    actx.fillRect(124, 100, 8, 40);
    actx.fillRect(124, 180, 8, 40);

    const asphaltTexture = new THREE.CanvasTexture(asphaltCanvas);
    asphaltTexture.wrapS = THREE.RepeatWrapping;
    asphaltTexture.wrapT = THREE.RepeatWrapping;
    asphaltTexture.repeat.set(8, 8);

    const baseMat = new THREE.MeshStandardMaterial({
      map: asphaltTexture,
      roughness: 0.85,
      metalness: 0.1,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.05;
    baseMesh.receiveShadow = !this.isSoftwareGl;
    this.scene.add(baseMesh);

    // 2. Snow Cover Plane with dynamic alpha mask & sparkling snow roughness
    const snowGeo = new THREE.PlaneGeometry(worldW, worldL, 64, 64);
    snowGeo.rotateX(-Math.PI / 2);

    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xf5faff,
      alphaMap: this.snowTexture,
      transparent: true,
      roughness: 0.65,
      metalness: 0.05,
      bumpScale: 0.06,
    });

    this.groundPlaneMesh = new THREE.Mesh(snowGeo, snowMat);
    this.groundPlaneMesh.position.y = 0.02;
    this.groundPlaneMesh.receiveShadow = !this.isSoftwareGl;
    this.scene.add(this.groundPlaneMesh);

    // Perimeter boundary natural barriers
    this.buildPerimeterBarriers(worldW, worldL);
  }

  private buildPerimeterBarriers(worldW: number, worldL: number) {
    const halfW = worldW / 2;
    const halfL = worldL / 2;

    const borderPoints: [number, number][] = [];
    const step = 4;
    for (let x = -halfW - 3; x <= halfW + 3; x += step) {
      borderPoints.push([x, -halfL - 2]);
      borderPoints.push([x, halfL + 2]);
    }
    for (let z = -halfL - 2; z <= halfL + 2; z += step) {
      borderPoints.push([-halfW - 2, z]);
      borderPoints.push([halfW + 2, z]);
    }

    borderPoints.forEach(([bx, bz]) => {
      const scale = 0.8 + Math.random() * 0.5;
      const actualX = bx + (Math.random() - 0.5) * 1.5;
      const actualZ = bz + (Math.random() - 0.5) * 1.5;
      const tree = this.createCozyPineTree(scale);
      tree.position.set(actualX, 0, actualZ);
      this.scene.add(tree);
    });
  }

  private createCozyPineTree(scale = 1.0): THREE.Group {
    const group = new THREE.Group();

    const trunkGeo = new THREE.CylinderGeometry(0.25 * scale, 0.35 * scale, 1.4 * scale, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.7 * scale;
    trunk.castShadow = !this.isSoftwareGl;
    trunk.receiveShadow = !this.isSoftwareGl;
    group.add(trunk);

    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x224835, roughness: 0.75 });
    const snowCapMat = new THREE.MeshStandardMaterial({ color: 0xf5f8fc, roughness: 0.6 });

    const tiers = [
      { y: 1.4 * scale, r: 1.5 * scale, h: 1.3 * scale },
      { y: 2.2 * scale, r: 1.15 * scale, h: 1.2 * scale },
      { y: 2.9 * scale, r: 0.75 * scale, h: 1.1 * scale },
    ];

    tiers.forEach((t) => {
      const coneGeo = new THREE.ConeGeometry(t.r, t.h, 7);
      const cone = new THREE.Mesh(coneGeo, foliageMat);
      cone.position.y = t.y;
      cone.castShadow = !this.isSoftwareGl;
      cone.receiveShadow = !this.isSoftwareGl;
      group.add(cone);

      const snowCapGeo = new THREE.ConeGeometry(t.r * 0.95, t.h * 0.38, 7);
      const snowCap = new THREE.Mesh(snowCapGeo, snowCapMat);
      snowCap.position.y = t.y + t.h * 0.28;
      snowCap.castShadow = !this.isSoftwareGl;
      group.add(snowCap);
    });

    return group;
  }

  private createCozyCabin(roofColor = 0xb84b39): THREE.Group {
    const cabin = new THREE.Group();

    const wallGeo = new THREE.BoxGeometry(4.2, 2.6, 3.8);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x7c5a3e, roughness: 0.85 });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 1.3;
    walls.castShadow = !this.isSoftwareGl;
    walls.receiveShadow = !this.isSoftwareGl;
    cabin.add(walls);

    const roofGeo = new THREE.ConeGeometry(3.6, 1.8, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.65 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.3;
    roof.scale.set(1.1, 1, 1.3);
    roof.castShadow = !this.isSoftwareGl;
    cabin.add(roof);

    const snowRoofGeo = new THREE.ConeGeometry(3.7, 1.2, 4);
    snowRoofGeo.rotateY(Math.PI / 4);
    const snowRoofMat = new THREE.MeshStandardMaterial({ color: 0xf5f8fc, roughness: 0.5 });
    const snowRoof = new THREE.Mesh(snowRoofGeo, snowRoofMat);
    snowRoof.position.y = 3.65;
    snowRoof.scale.set(1.12, 1, 1.32);
    snowRoof.castShadow = !this.isSoftwareGl;
    cabin.add(snowRoof);

    const chimneyGeo = new THREE.BoxGeometry(0.65, 2.0, 0.65);
    const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x5a5d64, roughness: 0.9 });
    const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
    chimney.position.set(1.2, 3.6, 0.7);
    chimney.castShadow = !this.isSoftwareGl;
    cabin.add(chimney);

    const winGeo = new THREE.PlaneGeometry(0.85, 0.95);
    const winMat = new THREE.MeshStandardMaterial({
      color: 0xffe285,
      emissive: 0xffb733,
      emissiveIntensity: 0.85,
      roughness: 0.2,
    });
    const win1 = new THREE.Mesh(winGeo, winMat);
    win1.position.set(0, 1.4, 1.92);
    cabin.add(win1);

    const win2 = win1.clone();
    win2.position.set(-1.2, 1.4, 1.92);
    cabin.add(win2);

    const porchLight = new THREE.PointLight(0xffb84d, 0.8, 6);
    porchLight.position.set(0, 1.8, 2.4);
    cabin.add(porchLight);

    return cabin;
  }

  private createStreetLamp(): THREE.Group {
    const lamp = new THREE.Group();

    const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 3.4, 6);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x24272c, metalness: 0.8, roughness: 0.3 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.7;
    pole.castShadow = !this.isSoftwareGl;
    lamp.add(pole);

    const lanternGeo = new THREE.OctahedronGeometry(0.35);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xffefb8,
      emissive: 0xffc44d,
      emissiveIntensity: 1.2,
    });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.y = 3.5;
    lamp.add(lantern);

    const light = new THREE.PointLight(0xffc966, 1.3, 8);
    light.position.y = 3.4;
    light.castShadow = !this.isSoftwareGl;
    lamp.add(light);

    return lamp;
  }

  private createSnowman(): THREE.Group {
    const snowman = new THREE.Group();
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf4f9ff, roughness: 0.5 });

    const base = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), snowMat);
    base.position.y = 0.55;
    snowman.add(base);

    const mid = new THREE.Mesh(new THREE.SphereGeometry(0.48, 8, 8), snowMat);
    mid.position.y = 1.35;
    snowman.add(mid);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), snowMat);
    head.position.y = 1.95;
    snowman.add(head);

    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.3, 5),
      new THREE.MeshStandardMaterial({ color: 0xe66012, roughness: 0.4 })
    );
    nose.rotateX(Math.PI / 2);
    nose.position.set(0, 1.95, 0.42);
    snowman.add(nose);

    const scarf = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.08, 6, 10),
      new THREE.MeshStandardMaterial({ color: 0xcc2936, roughness: 0.6 })
    );
    scarf.rotateX(Math.PI / 2);
    scarf.position.y = 1.7;
    snowman.add(scarf);

    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0x1f232b, roughness: 0.7 })
    );
    hat.position.y = 2.32;
    snowman.add(hat);

    return snowman;
  }

  private buildTownProps() {
    const w = this.levelConfig.size.width;
    const l = this.levelConfig.size.length;

    const cabinCoords: { x: number; z: number; rot: number; color?: number }[] = [
      { x: -w * 0.32, z: -l * 0.28, rot: 0.4, color: 0xba4836 },
      { x: w * 0.30, z: -l * 0.32, rot: -0.3, color: 0x3d6b8c },
      { x: -w * 0.35, z: l * 0.22, rot: 1.2, color: 0xb5843c },
      { x: w * 0.33, z: l * 0.26, rot: -1.1, color: 0x477852 },
    ];

    if (this.levelConfig.id >= 2) {
      cabinCoords.push({ x: 0, z: -l * 0.38, rot: 0, color: 0x8a4574 });
      cabinCoords.push({ x: -w * 0.12, z: l * 0.36, rot: Math.PI, color: 0xa84832 });
    }

    cabinCoords.forEach((c) => {
      const cabin = this.createCozyCabin(c.color);
      cabin.position.set(c.x, 0, c.z);
      cabin.rotation.y = c.rot;
      this.scene.add(cabin);
      // Register cabin solid obstacle (box bounding box)
      this.solidObstacles.push({
        type: 'box',
        x: c.x,
        z: c.z,
        radius: 3.5,
        halfW: 2.3,
        halfD: 2.1,
        rotation: c.rot,
      });
    });

    const lampCoords: [number, number][] = [
      [-w * 0.18, -l * 0.15],
      [w * 0.18, -l * 0.15],
      [-w * 0.18, l * 0.15],
      [w * 0.18, l * 0.15],
      [0, -l * 0.28],
      [0, l * 0.28],
    ];

    lampCoords.forEach(([lx, lz]) => {
      const lamp = this.createStreetLamp();
      lamp.position.set(lx, 0, lz);
      this.scene.add(lamp);
    });

    const treeCoords: [number, number, number][] = [
      [-w * 0.22, -l * 0.35, 1.1],
      [w * 0.25, -l * 0.22, 0.9],
      [-w * 0.28, l * 0.32, 1.2],
      [w * 0.22, l * 0.35, 1.0],
      [-w * 0.05, -l * 0.42, 0.8],
      [w * 0.08, l * 0.42, 1.15],
    ];

    treeCoords.forEach(([tx, tz, ts]) => {
      const tree = this.createCozyPineTree(ts);
      tree.position.set(tx, 0, tz);
      this.scene.add(tree);
    });

    const snowman1 = this.createSnowman();
    snowman1.position.set(-w * 0.22, 0, -l * 0.18);
    this.scene.add(snowman1);
    this.snowDrifts.push({
      id: 991,
      mesh: snowman1,
      position: new THREE.Vector3(-w * 0.22, 0, -l * 0.18),
      radius: 1.1,
      type: 'snowman',
      cleared: false,
      value: 30,
    });

    const snowman2 = this.createSnowman();
    snowman2.position.set(w * 0.2, 0, l * 0.18);
    this.scene.add(snowman2);
    this.snowDrifts.push({
      id: 992,
      mesh: snowman2,
      position: new THREE.Vector3(w * 0.2, 0, l * 0.18),
      radius: 1.1,
      type: 'snowman',
      cleared: false,
      value: 30,
    });

    this.buildIcePatches();
  }

  private buildIcePatches() {
    const iceGeo = new THREE.CircleGeometry(2.5, 16);
    iceGeo.rotateX(-Math.PI / 2);
    const iceMat = new THREE.MeshStandardMaterial({
      color: 0x9ed1ed,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.65,
    });

    const ice1 = new THREE.Mesh(iceGeo, iceMat);
    ice1.position.set(4, 0.04, -3);
    this.scene.add(ice1);

    const ice2 = new THREE.Mesh(iceGeo, iceMat);
    ice2.position.set(-5, 0.04, 6);
    this.scene.add(ice2);
  }

  private buildSnowDrifts() {
    this.snowDrifts = [];
    const w = this.levelConfig.size.width * 0.75;
    const l = this.levelConfig.size.length * 0.75;

    const driftCount = 20 + this.levelConfig.id * 8;
    for (let i = 0; i < driftCount; i++) {
      const x = (Math.random() - 0.5) * w;
      const z = (Math.random() - 0.5) * l;

      if (Math.hypot(x, z) < 4.0) continue;

      const isGift = i % 6 === 0;
      const isGolden = !isGift && i % 4 === 0;

      const group = new THREE.Group();
      group.position.set(x, 0, z);

      if (isGift) {
        const boxGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
        const boxMat = new THREE.MeshStandardMaterial({
          color: 0xdf2935,
          roughness: 0.3,
          metalness: 0.2,
        });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.y = 0.42;
        box.castShadow = !this.isSoftwareGl;
        group.add(box);

        const ribGeo = new THREE.BoxGeometry(0.9, 0.9, 0.18);
        const ribMat = new THREE.MeshStandardMaterial({
          color: 0xffd23f,
          metalness: 0.7,
          roughness: 0.2,
        });
        const rib1 = new THREE.Mesh(ribGeo, ribMat);
        rib1.position.y = 0.42;
        group.add(rib1);

        const rib2 = rib1.clone();
        rib2.rotateY(Math.PI / 2);
        group.add(rib2);

        this.scene.add(group);
        this.snowDrifts.push({
          id: i,
          mesh: group,
          position: new THREE.Vector3(x, 0, z),
          radius: 1.2,
          type: 'gift',
          cleared: false,
          value: 45,
        });
      } else if (isGolden) {
        const moundGeo = new THREE.DodecahedronGeometry(0.95, 1);
        moundGeo.scale(1.4, 0.65, 1.2);
        const moundMat = new THREE.MeshStandardMaterial({
          color: 0xffd152,
          emissive: 0xaa7c00,
          emissiveIntensity: 0.35,
          roughness: 0.3,
          metalness: 0.6,
        });
        const mound = new THREE.Mesh(moundGeo, moundMat);
        mound.position.y = 0.32;
        mound.castShadow = !this.isSoftwareGl;
        group.add(mound);

        this.scene.add(group);
        this.snowDrifts.push({
          id: i,
          mesh: group,
          position: new THREE.Vector3(x, 0, z),
          radius: 1.4,
          type: 'golden',
          cleared: false,
          value: 25,
        });
      } else {
        const moundGeo = new THREE.SphereGeometry(0.9, 7, 6);
        moundGeo.scale(1.5, 0.55, 1.3);
        const moundMat = new THREE.MeshStandardMaterial({
          color: 0xf2f7fc,
          roughness: 0.65,
          metalness: 0.05,
        });
        const mound = new THREE.Mesh(moundGeo, moundMat);
        mound.position.y = 0.25;
        mound.castShadow = !this.isSoftwareGl;
        mound.receiveShadow = !this.isSoftwareGl;
        group.add(mound);

        this.scene.add(group);
        this.snowDrifts.push({
          id: i,
          mesh: group,
          position: new THREE.Vector3(x, 0, z),
          radius: 1.3,
          type: 'drift',
          cleared: false,
          value: 10,
        });
      }
    }
  }

  /**
   * Procedural 3D Snowplow Vehicle (Group composed of 10+ distinct parts)
   */
  private buildPlayerVehicle() {
    this.playerGroup = new THREE.Group();
    // Maintain current position and angle so upgrading NEVER resets player to start!
    this.playerGroup.position.set(this.posX, 0, this.posZ);
    this.playerGroup.rotation.y = this.angle;
    this.scene.add(this.playerGroup);

    const primaryColor = new THREE.Color(this.vehicleSkin.primaryColor);
    const secondaryColor = new THREE.Color(this.vehicleSkin.secondaryColor);
    const bladeColor = new THREE.Color(this.vehicleSkin.bladeColor);

    // 1. Primary Chassis & Cab
    const cabGeo = new THREE.BoxGeometry(1.6, 1.25, 2.2);
    const cabMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.35,
      metalness: 0.25,
    });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.y = 1.05;
    cab.castShadow = !this.isSoftwareGl;
    cab.receiveShadow = !this.isSoftwareGl;
    this.playerGroup.add(cab);

    // Slanted Engine Hood
    const hoodGeo = new THREE.BoxGeometry(1.45, 0.7, 1.2);
    const hoodMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.35,
      metalness: 0.25,
    });
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.set(0, 0.75, 1.45);
    hood.castShadow = !this.isSoftwareGl;
    this.playerGroup.add(hood);

    // Undercarriage
    const underGeo = new THREE.BoxGeometry(1.5, 0.45, 3.2);
    const underMat = new THREE.MeshStandardMaterial({
      color: 0x1e2229,
      roughness: 0.85,
      metalness: 0.5,
    });
    const under = new THREE.Mesh(underGeo, underMat);
    under.position.y = 0.45;
    under.castShadow = !this.isSoftwareGl;
    this.playerGroup.add(under);

    // 2. Cab Windows (Tinted glass with warm interior glow)
    const windshieldGeo = new THREE.PlaneGeometry(1.3, 0.65);
    windshieldGeo.rotateX(-0.25);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x1a2634,
      emissive: 0x223344,
      emissiveIntensity: 0.3,
      roughness: 0.1,
      metalness: 0.9,
    });
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 1.35, 1.11);
    this.playerGroup.add(windshield);

    const sideWinGeo = new THREE.PlaneGeometry(1.1, 0.55);
    const sideWinLeft = new THREE.Mesh(sideWinGeo, glassMat);
    sideWinLeft.rotateY(-Math.PI / 2);
    sideWinLeft.position.set(-0.81, 1.35, 0.1);
    this.playerGroup.add(sideWinLeft);

    const sideWinRight = new THREE.Mesh(sideWinGeo, glassMat);
    sideWinRight.rotateY(Math.PI / 2);
    sideWinRight.position.set(0.81, 1.35, 0.1);
    this.playerGroup.add(sideWinRight);

    // 3. Heavy Curved Snow Blade (Upgradable width & heated blade!)
    const bladeW = 2.4 + this.vehicleUpgrades.bladeWidth * 0.45;
    const isHeated = (this.vehicleUpgrades.heatedBlade || 0) > 0;

    const bladeGeo = new THREE.CylinderGeometry(0.55, 0.55, bladeW, 10, 1, false, 0, Math.PI);
    bladeGeo.rotateZ(Math.PI / 2);
    bladeGeo.rotateX(Math.PI / 2);

    const bladeMat = new THREE.MeshStandardMaterial({
      color: isHeated ? 0xff6622 : bladeColor,
      emissive: isHeated ? 0xff3300 : 0x000000,
      emissiveIntensity: isHeated ? 0.4 : 0,
      roughness: 0.25,
      metalness: 0.75,
    });
    this.bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
    this.bladeMesh.position.set(0, 0.52, 2.35);
    this.bladeMesh.castShadow = !this.isSoftwareGl;
    this.playerGroup.add(this.bladeMesh);

    // Scraping cutting edge
    const bladeEdgeGeo = new THREE.BoxGeometry(bladeW, 0.08, 0.12);
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe0e6ed,
      roughness: 0.1,
      metalness: 0.95,
    });
    const bladeEdge = new THREE.Mesh(bladeEdgeGeo, chromeMat);
    bladeEdge.position.set(0, -0.22, 0.12);
    this.bladeMesh.add(bladeEdge);

    // Hydraulic Push Arms
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 6);
    armGeo.rotateX(Math.PI / 2);
    const armMat = new THREE.MeshStandardMaterial({
      color: 0x3a3f47,
      roughness: 0.4,
      metalness: 0.8,
    });
    this.leftBladeArm = new THREE.Mesh(armGeo, armMat);
    this.leftBladeArm.position.set(-0.65, 0.52, 1.8);
    this.playerGroup.add(this.leftBladeArm);

    this.rightBladeArm = new THREE.Mesh(armGeo, armMat);
    this.rightBladeArm.position.set(0.65, 0.52, 1.8);
    this.playerGroup.add(this.rightBladeArm);

    // 4. Rugged Heavy Snow Tires with Rims (4 wheels)
    const wheelPositions = [
      { x: -0.9, y: 0.45, z: 1.0 },
      { x: 0.9, y: 0.45, z: 1.0 },
      { x: -0.9, y: 0.45, z: -0.9 },
      { x: 0.9, y: 0.45, z: -0.9 },
    ];

    const tireGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.38, 12);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x181a1e,
      roughness: 0.9,
      metalness: 0.1,
    });

    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.39, 10);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      roughness: 0.3,
      metalness: 0.7,
    });

    this.wheelMeshes = [];
    wheelPositions.forEach((pos) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, pos.y, pos.z);

      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.castShadow = !this.isSoftwareGl;
      wheelGroup.add(tire);

      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheelGroup.add(rim);

      this.playerGroup.add(wheelGroup);
      this.wheelMeshes.push(tire);
    });

    // 5. Roof Flashing Amber Beacon
    const beaconBaseGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.15, 8);
    const beaconBase = new THREE.Mesh(beaconBaseGeo, underMat);
    beaconBase.position.set(0, 1.72, 0);
    this.playerGroup.add(beaconBase);

    const beaconGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.25, 8);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xffa500,
      emissive: 0xff8800,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });
    this.beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    this.beaconMesh.position.set(0, 1.9, 0);
    this.playerGroup.add(this.beaconMesh);

    this.beaconLight = new THREE.PointLight(0xff9900, 1.3, 6);
    this.beaconLight.position.set(0, 2.1, 0);
    this.playerGroup.add(this.beaconLight);

    // 6. Glowing Headlights with Volumetric Beam Cones
    this.headlightCones = [];
    const headlightGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 8);
    headlightGeo.rotateX(Math.PI / 2);
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xfffae6,
      emissive: 0xfff0aa,
      emissiveIntensity: 2.2,
    });

    const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    leftHeadlight.position.set(-0.55, 0.85, 2.05);
    this.playerGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    rightHeadlight.position.set(0.55, 0.85, 2.05);
    this.playerGroup.add(rightHeadlight);

    // Cones cutting through the atmosphere
    const beamGeo = new THREE.ConeGeometry(1.8, 8.5, 12, 1, true);
    beamGeo.rotateX(-Math.PI / 2.2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfff3cc,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const leftBeam = new THREE.Mesh(beamGeo, beamMat);
    leftBeam.position.set(-0.55, 0.7, 5.0);
    this.playerGroup.add(leftBeam);
    this.headlightCones.push(leftBeam);

    const rightBeam = new THREE.Mesh(beamGeo, beamMat);
    rightBeam.position.set(0.55, 0.7, 5.0);
    this.playerGroup.add(rightBeam);
    this.headlightCones.push(rightBeam);

    // Exhaust Stack Pipe
    const exhaustGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.4, 6);
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x484d54, metalness: 0.8, roughness: 0.3 });
    const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
    exhaust.position.set(-0.75, 1.6, -0.85);
    this.playerGroup.add(exhaust);

    // Rear Salt Spreader
    if (this.vehicleUpgrades.saltSpreader > 0) {
      const hopperGeo = new THREE.ConeGeometry(0.7, 0.8, 6);
      hopperGeo.rotateX(Math.PI);
      const hopperMat = new THREE.MeshStandardMaterial({ color: 0xe68a2e, roughness: 0.4 });
      const hopper = new THREE.Mesh(hopperGeo, hopperMat);
      hopper.position.set(0, 0.95, -1.4);
      this.playerGroup.add(hopper);
    }

    // Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(2.4, 3.8);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x111620,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.position.y = 0.03;
    this.playerGroup.add(contactShadow);
  }

  /**
   * Safe Upgrade Application: Preserves vehicle coordinates so the player is NOT sent to start!
   */
  public updateUpgradesAndSkin(upgrades: VehicleUpgrades, skin: VehicleSkin) {
    this.vehicleUpgrades = upgrades;
    this.vehicleSkin = skin;
    this.scene.remove(this.playerGroup);
    this.buildPlayerVehicle();
  }

  private setupFallingSnow() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.snowParticlesCount * 3);
    const w = this.levelConfig.size.width * 1.3;
    const l = this.levelConfig.size.length * 1.3;

    for (let i = 0; i < this.snowParticlesCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * w;
      pos[i * 3 + 1] = Math.random() * 26 + 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * l;
    }

    this.snowParticlePositions = pos;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.38,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    this.snowParticles = new THREE.Points(geo, mat);
    this.scene.add(this.snowParticles);
  }

  private setupSprayParticles() {
    const geo = new THREE.BufferGeometry();
    this.sprayPositions = new Float32Array(this.sprayParticlesCount * 3);
    this.sprayVelocities = new Float32Array(this.sprayParticlesCount * 3);
    this.sprayLifetimes = new Float32Array(this.sprayParticlesCount);

    for (let i = 0; i < this.sprayParticlesCount; i++) {
      this.sprayPositions[i * 3 + 1] = -100;
      this.sprayLifetimes[i] = 0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.sprayPositions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xf2f8ff,
      size: 0.48,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });

    this.sprayPointsMesh = new THREE.Points(geo, mat);
    this.scene.add(this.sprayPointsMesh);
  }

  private emitPlowSnowSpray(count = 3) {
    if (!this.sprayPointsMesh) return;

    const bladeW = (2.4 + this.vehicleUpgrades.bladeWidth * 0.45) * 0.5;
    const heading = this.angle;
    const cosA = Math.cos(heading);
    const sinA = Math.sin(heading);

    for (let c = 0; c < count; c++) {
      const isLeft = Math.random() > 0.5;
      const sideSign = isLeft ? -1 : 1;
      const wingOffset = sideSign * bladeW * (0.8 + Math.random() * 0.3);

      const px = this.posX + cosA * wingOffset + sinA * 2.3;
      const pz = this.posZ - sinA * wingOffset + cosA * 2.3;

      const idx = this.sprayIndex;
      this.sprayPositions[idx * 3 + 0] = px;
      this.sprayPositions[idx * 3 + 1] = 0.35 + Math.random() * 0.2;
      this.sprayPositions[idx * 3 + 2] = pz;

      const outwardAngle = heading + sideSign * (Math.PI / 3 + (Math.random() - 0.5) * 0.3);
      const spraySpd = 4.2 + Math.random() * 3.5 + (this.isBoosting ? 3.0 : 0);

      this.sprayVelocities[idx * 3 + 0] = Math.sin(outwardAngle) * spraySpd;
      this.sprayVelocities[idx * 3 + 1] = 2.6 + Math.random() * 2.0;
      this.sprayVelocities[idx * 3 + 2] = Math.cos(outwardAngle) * spraySpd;

      this.sprayLifetimes[idx] = 0.55 + Math.random() * 0.3;

      this.sprayIndex = (this.sprayIndex + 1) % this.sprayParticlesCount;
    }
  }

  private emitBurstParticles(x: number, y: number, z: number, count = 18, color = 0xffffff) {
    if (!this.sprayPointsMesh) return;
    for (let i = 0; i < count; i++) {
      const idx = this.sprayIndex;
      this.sprayPositions[idx * 3 + 0] = x + (Math.random() - 0.5) * 0.5;
      this.sprayPositions[idx * 3 + 1] = y + Math.random() * 0.4;
      this.sprayPositions[idx * 3 + 2] = z + (Math.random() - 0.5) * 0.5;

      const spd = 2.8 + Math.random() * 5.0;
      const theta = Math.random() * Math.PI * 2;
      this.sprayVelocities[idx * 3 + 0] = Math.cos(theta) * spd;
      this.sprayVelocities[idx * 3 + 1] = 2.2 + Math.random() * 3.5;
      this.sprayVelocities[idx * 3 + 2] = Math.sin(theta) * spd;

      this.sprayLifetimes[idx] = 0.65;
      this.sprayIndex = (this.sprayIndex + 1) % this.sprayParticlesCount;
    }
  }

  private setupKeyListeners() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.heldKeys[e.code] = true;
    synthAudio.ensureAudio();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.heldKeys[e.code] = false;
  };

  private onBlur = () => {
    this.heldKeys = {};
  };

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / height;

    this.camera.left = (-this.frustumSize * aspect) / 2;
    this.camera.right = (this.frustumSize * aspect) / 2;
    this.camera.top = this.frustumSize / 2;
    this.camera.bottom = -this.frustumSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };

  /**
   * Dynamic Weather State Machine
   * Rotates between: Clear Spell -> Light Snow -> Blizzard -> Aurora
   */
  private updateWeather(dt: number) {
    this.weatherTimer -= dt;
    this.stats.weatherTimeRemaining = Math.max(0, Math.floor(this.weatherTimer));

    // Weather change warning at 8s mark
    if (this.weatherTimer <= 8 && !this.weatherAlertPlayed) {
      this.weatherAlertPlayed = true;
      const nextWeatherList: WeatherType[] = ['clear', 'light_snow', 'blizzard', 'aurora'];
      const nextWeather = nextWeatherList[(this.weatherCycleIndex + 1) % nextWeatherList.length];

      let alertText = 'WEATHER ALERT: Condition changing soon!';
      if (nextWeather === 'blizzard') alertText = 'WEATHER WARNING: Severe Blizzard Approaching in 8s!';
      else if (nextWeather === 'clear') alertText = 'WEATHER ALERT: Sun breaking through clouds in 8s!';
      else if (nextWeather === 'aurora') alertText = 'WEATHER ALERT: Aurora Borealis rising in 8s!';

      this.weatherNotification = alertText;
      this.stats.weatherNotification = alertText;
      synthAudio.playWeatherAlert();
    }

    // Switch weather state when timer expires
    if (this.weatherTimer <= 0) {
      this.weatherCycleIndex++;
      const weatherModes: WeatherType[] = ['light_snow', 'clear', 'blizzard', 'aurora'];
      this.activeWeather = weatherModes[this.weatherCycleIndex % weatherModes.length];
      this.weatherTimer = this.activeWeather === 'blizzard' ? 32 : 45;
      this.weatherAlertPlayed = false;
      this.weatherNotification = '';
      this.stats.weatherNotification = '';
      this.stats.activeWeather = this.activeWeather;

      if (this.activeWeather === 'blizzard') {
        synthAudio.playBlizzardGust();
        this.addCameraShake(0.3);
      }

      this.applyWeatherVisuals(this.activeWeather);
    }
  }

  private applyWeatherVisuals(weather: WeatherType) {
    if (!this.ambientFog || !this.keyLight || !this.hemiLight) return;

    if (weather === 'clear') {
      // Golden luminous sun & radiant crisp mist
      const sunColor = 0xfff0d6;
      const skyColor = 0xe0effa;
      this.scene.background = new THREE.Color(skyColor);
      this.ambientFog.color.setHex(skyColor);
      this.ambientFog.near = 48;
      this.ambientFog.far = 135;
      this.keyLight.color.setHex(sunColor);
      this.keyLight.intensity = 2.0;
      this.hemiLight.intensity = 1.2;
      this.headlightCones.forEach((c) => {
        (c.material as THREE.MeshBasicMaterial).opacity = 0.12;
      });
    } else if (weather === 'blizzard') {
      // Whiteout snow squall: headlamps glow brightly, swirling winds
      const stormColor = 0x93a8ba;
      this.scene.background = new THREE.Color(stormColor);
      this.ambientFog.color.setHex(stormColor);
      this.ambientFog.near = 32;
      this.ambientFog.far = 85;
      this.keyLight.intensity = 1.1;
      this.hemiLight.intensity = 0.8;
      this.headlightCones.forEach((c) => {
        (c.material as THREE.MeshBasicMaterial).opacity = 0.42;
      });
    } else if (weather === 'aurora') {
      // Ethereal emerald & violet twilight
      const auroraColor = 0x142a38;
      this.scene.background = new THREE.Color(auroraColor);
      this.ambientFog.color.setHex(auroraColor);
      this.ambientFog.near = 40;
      this.ambientFog.far = 110;
      this.keyLight.color.setHex(0x7ef0d5);
      this.keyLight.intensity = 1.3;
      this.hemiLight.color.setHex(0x5eead4);
      this.hemiLight.groundColor.setHex(0x312e81);
      this.headlightCones.forEach((c) => {
        (c.material as THREE.MeshBasicMaterial).opacity = 0.35;
      });
    } else {
      // Standard light snow: cozy winter daylight
      const skyColor = 0xd5e6f3;
      this.scene.background = new THREE.Color(skyColor);
      this.ambientFog.color.setHex(skyColor);
      this.ambientFog.near = 42;
      this.ambientFog.far = 115;
      this.keyLight.color.setHex(0xfff6e6);
      this.keyLight.intensity = 1.65;
      this.hemiLight.intensity = 1.05;
      this.headlightCones.forEach((c) => {
        (c.material as THREE.MeshBasicMaterial).opacity = 0.2;
      });
    }
  }

  /**
   * Main Simulation & Animation Loop
   */
  private startLoop() {
    const tick = () => {
      if (this.isDestroyed) return;

      const now = performance.now();
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= dt;
      } else {
        this.updateSimulation(dt);
      }

      this.render();

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.animFrameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.animFrameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.animFrameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.animFrameId = window.setTimeout(cb, 60);
      }
    };
    this.animFrameId = window.setTimeout(poll, 5);
  }

  private updateSimulation(dt: number) {
    this.stats.elapsedTime += dt;

    // Update dynamic weather conditions
    this.updateWeather(dt);

    // 1. Vehicle Steering & Throttle Kinematics
    const forwardKey = this.heldKeys['KeyW'] || this.heldKeys['ArrowUp'];
    const backwardKey = this.heldKeys['KeyS'] || this.heldKeys['ArrowDown'];
    const leftKey = this.heldKeys['KeyA'] || this.heldKeys['ArrowLeft'];
    const rightKey = this.heldKeys['KeyD'] || this.heldKeys['ArrowRight'];
    const boostKey = this.heldKeys['Space'] || this.heldKeys['ShiftLeft'];

    // Weather impact on driving:
    // In 'clear': +15% speed, lower friction
    // In 'blizzard': +25% snow resistance drag, wind push
    let weatherSpeedFactor = 1.0;
    let friction = this.isIceDrifting ? 0.985 : 0.93;

    if (this.activeWeather === 'clear') {
      weatherSpeedFactor = 1.15;
      friction = 0.95;
    } else if (this.activeWeather === 'blizzard') {
      weatherSpeedFactor = 0.88;
      friction = 0.91;
    }

    const topSpeedBase = (7.5 + this.vehicleUpgrades.engineSpeed * 1.5) * weatherSpeedFactor;
    const accelRate = (12.0 + this.vehicleUpgrades.engineSpeed * 2.5) * weatherSpeedFactor;
    const turnRate = 2.4 + this.vehicleUpgrades.snowGrip * 0.35;

    // Boost Handling
    this.isBoosting = false;
    if (boostKey && this.boostFuel > 5 && forwardKey) {
      this.isBoosting = true;
      this.boostFuel = Math.max(0, this.boostFuel - 35 * dt);
      synthAudio.playBoost();
      this.addCameraShake(0.1);
    } else {
      const rechargeRate = 12 + this.vehicleUpgrades.boostTank * 4;
      this.boostFuel = Math.min(100, this.boostFuel + rechargeRate * dt);
    }
    this.stats.boostFuel = this.boostFuel;
    this.stats.isBoosting = this.isBoosting;

    const currentMaxSpeed = topSpeedBase * (this.isBoosting ? 1.55 : 1.0);

    // Apply Throttle
    if (forwardKey) {
      this.speed = Math.min(currentMaxSpeed, this.speed + accelRate * dt);
    } else if (backwardKey) {
      this.speed = Math.max(-currentMaxSpeed * 0.5, this.speed - accelRate * 0.8 * dt);
    } else {
      this.speed *= Math.pow(friction, dt * 60);
      if (Math.abs(this.speed) < 0.05) this.speed = 0;
    }

    // Apply Steering
    const speedRatio = this.speed / currentMaxSpeed;
    const absSpeedRatio = Math.abs(speedRatio);

    if (leftKey) {
      this.angularVelocity = Math.min(turnRate, this.angularVelocity + turnRate * 4 * dt);
    } else if (rightKey) {
      this.angularVelocity = Math.max(-turnRate, this.angularVelocity - turnRate * 4 * dt);
    } else {
      this.angularVelocity *= Math.pow(0.85, dt * 60);
      if (Math.abs(this.angularVelocity) < 0.02) this.angularVelocity = 0;
    }

    // Turn vehicle
    if (absSpeedRatio > 0.05) {
      const steerDirection = this.speed >= 0 ? 1 : -1;
      this.angle += this.angularVelocity * steerDirection * dt * (0.4 + absSpeedRatio * 0.6);
    }

    // Vehicle Translation
    let moveX = Math.sin(this.angle) * this.speed * dt;
    let moveZ = Math.cos(this.angle) * this.speed * dt;

    // Blizzard wind force
    if (this.activeWeather === 'blizzard') {
      moveX += 1.8 * dt; // persistent side gale
    }

    this.posX += moveX;
    this.posZ += moveZ;

    // Physical collision resolution: prevent vehicle from passing through buildings, trees, and lamps
    this.resolveObstacleCollisions();

    // Boundary constraints
    const halfW = this.levelConfig.size.width / 2 - 1.5;
    const halfL = this.levelConfig.size.length / 2 - 1.5;
    if (Math.abs(this.posX) > halfW) {
      this.posX = Math.sign(this.posX) * halfW;
      this.speed *= -0.4;
      synthAudio.playBump();
      this.addCameraShake(0.2);
    }
    if (Math.abs(this.posZ) > halfL) {
      this.posZ = Math.sign(this.posZ) * halfL;
      this.speed *= -0.4;
      synthAudio.playBump();
      this.addCameraShake(0.2);
    }

    // Update Player Mesh Transform
    this.playerGroup.position.set(this.posX, 0, this.posZ);
    this.playerGroup.rotation.y = this.angle;

    // Body roll / tilt when turning
    const roll = -this.angularVelocity * 0.04 * absSpeedRatio;
    const pitch = (forwardKey ? -0.02 : backwardKey ? 0.02 : 0) * absSpeedRatio;
    this.playerGroup.rotation.z = roll;
    this.playerGroup.rotation.x = pitch;

    this.wheelMeshes.forEach((wheel) => {
      wheel.rotation.x += this.speed * 0.4;
    });

    if (this.beaconLight && this.beaconMesh) {
      const beaconTime = performance.now() * 0.008;
      this.beaconLight.intensity = 0.8 + Math.sin(beaconTime * 4) * 0.6;
    }

    synthAudio.updateEngine(absSpeedRatio, this.isBoosting);

    // 2. Snow Plowing, Road Grid Cells & Town Districts
    let isActivelyClearingSnow = false;
    if (Math.abs(this.speed) > 0.3) {
      isActivelyClearingSnow = this.carveSnowRoad();
    }
    synthAudio.updateSnowPlowing(isActivelyClearingSnow, absSpeedRatio);

    // Track current active district
    this.updateCurrentDistrictAndReputation();

    // 3. Snowdrift & Collectible Collisions
    this.checkSnowDriftCollisions();

    // 4. Update Falling Snow & Spray Particles
    this.updateParticles(dt);

    // 5. Update Combo Timer
    if (this.stats.combo > 1) {
      this.stats.comboTimer -= dt;
      if (this.stats.comboTimer <= 0) {
        this.stats.combo = 1;
        this.stats.comboTimer = 0;
      }
    }

    // 6. Camera Follow with Smooth Damping & Shake
    this.updateCameraFollow(dt);

    // 7. Check Level Victory Condition
    if (!this.isLevelFinished && this.stats.clearedPercent >= this.levelConfig.targetPercent) {
      this.isLevelFinished = true;
      synthAudio.playUpgrade();
      if (this.onLevelComplete) {
        this.onLevelComplete();
      }
    }

    this.stats.speed = Math.abs(this.speed);
    if (this.onStatsUpdate) {
      this.onStatsUpdate({ ...this.stats });
    }
  }

  private carveSnowRoad(): boolean {
    const worldW = this.levelConfig.size.width;
    const worldL = this.levelConfig.size.length;

    const u = (this.posX / worldW + 0.5) * this.snowCanvasSize;
    const v = (this.posZ / worldL + 0.5) * this.snowCanvasSize;

    const bladeWidthMeters = 2.4 + this.vehicleUpgrades.bladeWidth * 0.45;
    const pixelRadius = Math.max(6, Math.floor((bladeWidthMeters / worldW) * this.snowCanvasSize * 0.95));

    const forwardOffset = 2.0;
    const bladeU = u + Math.sin(this.angle) * (forwardOffset / worldW) * this.snowCanvasSize;
    const bladeV = v + Math.cos(this.angle) * (forwardOffset / worldL) * this.snowCanvasSize;

    // Erase snow along plow blade footprint on the canvas mask
    this.snowCtx.save();
    this.snowCtx.globalCompositeOperation = 'destination-out';
    this.snowCtx.fillStyle = 'rgba(0, 0, 0, 0.95)';

    this.snowCtx.beginPath();
    this.snowCtx.arc(bladeU, bladeV, pixelRadius, 0, Math.PI * 2);
    this.snowCtx.fill();

    if (this.vehicleUpgrades.saltSpreader > 0) {
      const saltRadius = 5 + this.vehicleUpgrades.saltSpreader * 3;
      const rearU = u - Math.sin(this.angle) * (1.6 / worldW) * this.snowCanvasSize;
      const rearV = v - Math.cos(this.angle) * (1.6 / worldL) * this.snowCanvasSize;
      this.snowCtx.beginPath();
      this.snowCtx.arc(rearU, rearV, saltRadius, 0, Math.PI * 2);
      this.snowCtx.fill();
    }

    this.snowCtx.restore();
    this.snowTexture.needsUpdate = true;

    // Accurate Road Grid Clearance Detection
    // Compute grid cell radius covered by blade
    const res = this.gridResolution;
    const bladeWorldX = this.posX + Math.sin(this.angle) * 2.1;
    const bladeWorldZ = this.posZ + Math.cos(this.angle) * 2.1;

    const centerGridX = Math.floor((bladeWorldX / worldW + 0.5) * res);
    const centerGridZ = Math.floor((bladeWorldZ / worldL + 0.5) * res);
    const cellRadius = Math.max(1, Math.round((bladeWidthMeters / worldW) * res * 0.7));

    let newlyClearedCells = 0;

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        const gx = centerGridX + dx;
        const gz = centerGridZ + dz;

        if (gx >= 0 && gx < res && gz >= 0 && gz < res) {
          if (this.isRoadCell[gx][gz] && !this.isClearedCell[gx][gz]) {
            this.isClearedCell[gx][gz] = true;
            this.clearedRoadCellsCount++;
            newlyClearedCells++;
          }
        }
      }
    }

    if (newlyClearedCells > 0) {
      this.emitPlowSnowSpray(2);

      // Compute exact percentage based on designated road network
      const rawPct = Math.min(100, Math.floor((this.clearedRoadCellsCount / this.totalRoadCells) * 100));
      this.stats.clearedPercent = rawPct;
      this.stats.clearedUnits = this.clearedRoadCellsCount;

      // Payout multiplier: blizzard bonus (+75%) & district reputation bonus
      const currentDist = this.getCurrentDistrict();
      const districtMultiplier = currentDist ? currentDist.payoutBonus : 1.0;
      const blizzardBonus = this.activeWeather === 'blizzard' ? 1.75 : 1.0;

      const scoreInc = Math.floor(6 * this.stats.combo * districtMultiplier * blizzardBonus);
      this.stats.score += scoreInc;

      // Combo sustain
      this.stats.comboTimer = 2.4;
      if (this.stats.score % 50 === 0 && this.stats.combo < 10) {
        this.stats.combo = Math.min(10, this.stats.combo + 1);
        synthAudio.playComboChime(this.stats.combo);
      }

      return true;
    }

    return false;
  }

  private getCurrentDistrict(): TownDistrict | undefined {
    return this.townDistricts.find((d) => {
      return (
        this.posX >= d.bounds.minX &&
        this.posX <= d.bounds.maxX &&
        this.posZ >= d.bounds.minZ &&
        this.posZ <= d.bounds.maxZ
      );
    });
  }

  private updateCurrentDistrictAndReputation() {
    const res = this.gridResolution;
    const w = this.levelConfig.size.width;
    const l = this.levelConfig.size.length;

    // Update each district's clearance & reputation
    let totalRep = 0;
    this.townDistricts.forEach((dist) => {
      let districtRoads = 0;
      let districtCleared = 0;

      for (let x = 0; x < res; x++) {
        for (let z = 0; z < res; z++) {
          const wx = (x / (res - 1) - 0.5) * w;
          const wz = (z / (res - 1) - 0.5) * l;

          if (
            wx >= dist.bounds.minX &&
            wx <= dist.bounds.maxX &&
            wz >= dist.bounds.minZ &&
            wz <= dist.bounds.maxZ
          ) {
            if (this.isRoadCell[x][z]) {
              districtRoads++;
              if (this.isClearedCell[x][z]) {
                districtCleared++;
              }
            }
          }
        }
      }

      const pct = districtRoads > 0 ? Math.floor((districtCleared / districtRoads) * 100) : 0;
      dist.clearedPercent = pct;

      // Reputation formula: 30 base + (cleared % * 0.7)
      dist.reputation = Math.min(100, Math.floor(30 + pct * 0.7));

      if (dist.reputation >= 85) {
        dist.reputationTier = 'Town Hero';
        dist.payoutBonus = 1.5;
        dist.urgentNotice = undefined;
      } else if (dist.reputation >= 60) {
        dist.reputationTier = 'Respected';
        dist.payoutBonus = 1.25;
        dist.urgentNotice = undefined;
      } else if (dist.reputation >= 35) {
        dist.reputationTier = 'Neutral';
        dist.payoutBonus = 1.0;
      } else {
        dist.reputationTier = 'Neglected';
        dist.payoutBonus = 0.85; // slight penalty for neglected streets
      }

      totalRep += dist.reputation;
    });

    const avgRep = Math.round(totalRep / this.townDistricts.length);
    this.stats.overallTownReputation = avgRep;

    // Current district stats for HUD
    const cur = this.getCurrentDistrict();
    if (cur) {
      this.stats.currentDistrictName = cur.name;
      this.stats.currentDistrictReputation = cur.reputation;
      this.stats.currentDistrictTier = cur.reputationTier;
    }
  }

  /**
   * Solid Obstacle Collision Resolution:
   * Prevents snowplow from driving through buildings, trees, and cast iron lamps!
   */
  private resolveObstacleCollisions() {
    const chassisRadius = 1.15;
    const bladeOffset = 2.0;
    const bladeRadius = 0.95;
    const bladeFrontX = this.posX + Math.sin(this.angle) * bladeOffset;
    const bladeFrontZ = this.posZ + Math.cos(this.angle) * bladeOffset;

    let hasCollided = false;

    for (let i = 0; i < this.solidObstacles.length; i++) {
      const obs = this.solidObstacles[i];

      // Quick broadphase distance check from vehicle center
      const roughDist = Math.hypot(this.posX - obs.x, this.posZ - obs.z);
      if (roughDist > obs.radius + 3.8) continue;

      if (obs.type === 'box') {
        // Cabins: Oriented bounding box in local cabin space
        const rot = obs.rotation || 0;
        const cosR = Math.cos(-rot);
        const sinR = Math.sin(-rot);

        // Test chassis center
        const relX = this.posX - obs.x;
        const relZ = this.posZ - obs.z;
        const localX = cosR * relX - sinR * relZ;
        const localZ = sinR * relX + cosR * relZ;

        const halfW = (obs.halfW || 2.3) + chassisRadius;
        const halfD = (obs.halfD || 2.1) + chassisRadius;

        if (Math.abs(localX) < halfW && Math.abs(localZ) < halfD) {
          const overlapX = halfW - Math.abs(localX);
          const overlapZ = halfD - Math.abs(localZ);

          let pushLocalX = 0;
          let pushLocalZ = 0;

          if (overlapX < overlapZ) {
            pushLocalX = Math.sign(localX) * overlapX;
          } else {
            pushLocalZ = Math.sign(localZ) * overlapZ;
          }

          const invCos = Math.cos(rot);
          const invSin = Math.sin(rot);
          this.posX += invCos * pushLocalX - invSin * pushLocalZ;
          this.posZ += invSin * pushLocalX + invCos * pushLocalZ;
          hasCollided = true;
        }

        // Also test front plow blade against cabin box
        const relBladeX = bladeFrontX - obs.x;
        const relBladeZ = bladeFrontZ - obs.z;
        const localBladeX = cosR * relBladeX - sinR * relBladeZ;
        const localBladeZ = sinR * relBladeX + cosR * relBladeZ;

        const bladeHalfW = (obs.halfW || 2.3) + bladeRadius;
        const bladeHalfD = (obs.halfD || 2.1) + bladeRadius;

        if (Math.abs(localBladeX) < bladeHalfW && Math.abs(localBladeZ) < bladeHalfD) {
          const bOverlapX = bladeHalfW - Math.abs(localBladeX);
          const bOverlapZ = bladeHalfD - Math.abs(localBladeZ);

          let bPushX = 0;
          let bPushZ = 0;

          if (bOverlapX < bOverlapZ) {
            bPushX = Math.sign(localBladeX) * bOverlapX;
          } else {
            bPushZ = Math.sign(localBladeZ) * bOverlapZ;
          }

          const invCos = Math.cos(rot);
          const invSin = Math.sin(rot);
          this.posX += invCos * bPushX - invSin * bPushZ;
          this.posZ += invSin * bPushX + invCos * bPushZ;
          hasCollided = true;
        }
      }
    }

    if (hasCollided) {
      if (Math.abs(this.speed) > 0.5) {
        synthAudio.playBump();
        this.addCameraShake(0.18);
        this.hitstopTimer = 0.035;
      }
      this.speed *= -0.35;
    }
  }

  private checkSnowDriftCollisions() {
    const bladePos = _vec3A.set(
      this.posX + Math.sin(this.angle) * 2.2,
      0,
      this.posZ + Math.cos(this.angle) * 2.2
    );

    const hitRadius = 1.6 + this.vehicleUpgrades.bladeWidth * 0.2;

    this.snowDrifts.forEach((drift) => {
      if (drift.cleared) return;

      const dist = bladePos.distanceTo(drift.position);
      if (dist < hitRadius + drift.radius) {
        drift.cleared = true;
        this.scene.remove(drift.mesh);

        const color = drift.type === 'golden' ? 0xffd700 : drift.type === 'gift' ? 0xff4d4d : 0xf2f8ff;
        this.emitBurstParticles(drift.position.x, 0.4, drift.position.z, 24, color);

        if (drift.type === 'snowman') {
          synthAudio.playPickup();
          this.stats.coinsEarned += 25;
          this.stats.score += 350 * this.stats.combo;
          this.stats.combo = Math.min(10, this.stats.combo + 2);
          this.stats.comboTimer = 3.2;
          this.emitBurstParticles(drift.position.x, 0.8, drift.position.z, 28, 0xffffff);
          this.emitBurstParticles(drift.position.x, 1.2, drift.position.z, 12, 0xe66012);
        } else if (drift.type === 'gift') {
          synthAudio.playPickup();
          this.stats.coinsEarned += drift.value;
          this.stats.score += drift.value * 20;
          this.stats.combo = Math.min(10, this.stats.combo + 2);
          this.stats.comboTimer = 3.5;
        } else if (drift.type === 'golden') {
          synthAudio.playComboChime(this.stats.combo + 2);
          this.stats.coinsEarned += drift.value;
          this.stats.score += drift.value * 15;
          this.stats.combo = Math.min(10, this.stats.combo + 1);
          this.stats.comboTimer = 3.0;
        } else {
          synthAudio.playBump();
          this.stats.coinsEarned += 2;
          this.stats.score += 50 * this.stats.combo;
          this.stats.comboTimer = 2.6;
        }

        this.addCameraShake(0.18);
        this.hitstopTimer = 0.035;
      }
    });
  }

  private updateParticles(dt: number) {
    if (this.snowParticles) {
      const pos = this.snowParticlePositions;
      const isBlizzard = this.activeWeather === 'blizzard';
      const fallSpeed = isBlizzard ? 5.2 : 2.5;
      const windPush = isBlizzard ? 7.5 : 0.6;

      for (let i = 0; i < this.snowParticlesCount; i++) {
        pos[i * 3 + 1] -= dt * (fallSpeed + (i % 3) * 0.8);
        pos[i * 3 + 0] += dt * windPush;

        if (pos[i * 3 + 1] < 0) {
          pos[i * 3 + 1] = 24;
          pos[i * 3 + 0] = (Math.random() - 0.5) * this.levelConfig.size.width * 1.3;
        }
      }
      this.snowParticles.geometry.attributes.position.needsUpdate = true;
    }

    if (this.sprayPointsMesh) {
      const pos = this.sprayPositions;
      const vel = this.sprayVelocities;
      const life = this.sprayLifetimes;
      const gravity = -9.8;

      for (let i = 0; i < this.sprayParticlesCount; i++) {
        if (life[i] > 0) {
          life[i] -= dt;

          vel[i * 3 + 1] += gravity * dt;
          pos[i * 3 + 0] += vel[i * 3 + 0] * dt;
          pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
          pos[i * 3 + 2] += vel[i * 3 + 2] * dt;

          if (pos[i * 3 + 1] <= 0.05 || life[i] <= 0) {
            life[i] = 0;
            pos[i * 3 + 1] = -100;
          }
        }
      }
      this.sprayPointsMesh.geometry.attributes.position.needsUpdate = true;
    }
  }

  public addCameraShake(amount: number) {
    this.camShakeIntensity = Math.min(0.8, this.camShakeIntensity + amount);
  }

  private updateCameraFollow(dt: number) {
    const isoDist = 32;
    _vec3CamTarget.set(this.posX, 0, this.posZ);

    this.camFollowTarget.lerp(_vec3CamTarget, 1 - Math.exp(-8 * dt));

    const shakeX = (Math.random() - 0.5) * this.camShakeIntensity;
    const shakeZ = (Math.random() - 0.5) * this.camShakeIntensity;
    this.camShakeIntensity *= Math.pow(this.camShakeDecay, dt * 60);

    this.camera.position.set(
      this.camFollowTarget.x + isoDist + shakeX,
      38,
      this.camFollowTarget.z + isoDist + shakeZ
    );
    this.camera.lookAt(this.camFollowTarget.x, 0, this.camFollowTarget.z);
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public resetVehiclePosition() {
    this.posX = 0;
    this.posZ = 0;
    this.angle = 0;
    this.speed = 0;
    this.angularVelocity = 0;
    this.playerGroup.position.set(0, 0, 0);
    this.playerGroup.rotation.set(0, 0, 0);
  }

  public resetVehicleToCenter() {
    this.resetVehiclePosition();
    this.camFollowTarget.set(0, 0, 0);
    synthAudio.playPickup();
    this.emitBurstParticles(0, 0.4, 0, 24, 0x38bdf8);
    this.addCameraShake(0.12);
  }

  public setVirtualKey(action: 'forward' | 'backward' | 'left' | 'right' | 'boost', isHeld: boolean) {
    switch (action) {
      case 'forward':
        this.heldKeys['KeyW'] = isHeld;
        this.heldKeys['ArrowUp'] = isHeld;
        break;
      case 'backward':
        this.heldKeys['KeyS'] = isHeld;
        this.heldKeys['ArrowDown'] = isHeld;
        break;
      case 'left':
        this.heldKeys['KeyA'] = isHeld;
        this.heldKeys['ArrowLeft'] = isHeld;
        break;
      case 'right':
        this.heldKeys['KeyD'] = isHeld;
        this.heldKeys['ArrowRight'] = isHeld;
        break;
      case 'boost':
        this.heldKeys['Space'] = isHeld;
        break;
    }
  }

  public restartLevel() {
    this.isLevelFinished = false;
    this.resetVehiclePosition();
    this.stats.clearedPercent = 0;
    this.stats.clearedUnits = 0;
    this.stats.combo = 1;
    this.stats.comboTimer = 0;
    this.stats.score = 0;
    this.stats.coinsEarned = 0;
    this.stats.elapsedTime = 0;

    // Reset road grid cells
    const res = this.gridResolution;
    for (let x = 0; x < res; x++) {
      for (let z = 0; z < res; z++) {
        this.isClearedCell[x][z] = false;
      }
    }
    this.clearedRoadCellsCount = 0;

    // Reset snow canvas
    this.snowCtx.fillStyle = '#ffffff';
    this.snowCtx.fillRect(0, 0, this.snowCanvasSize, this.snowCanvasSize);
    this.snowTexture.needsUpdate = true;

    // Respawn snowdrifts
    this.snowDrifts.forEach((d) => {
      this.scene.remove(d.mesh);
    });
    this.buildSnowDrifts();
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      clearTimeout(this.animFrameId);
    }
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('resize', this.onResize);

    try {
      this.renderer.dispose();
      if (this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    } catch (e) {
      console.warn('Error during Three.js cleanup:', e);
    }
  }
}
