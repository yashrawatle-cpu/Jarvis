/**
 * J.A.R.V.I.S. Arc Reactor Mark 85 / AI Neural Core 3D Scene
 * Built according to Three.js Architecture, PBR & Performance directives.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HologramReaction, RecognizedGesture } from '../types';

// Pre-allocated scratch objects for zero GC in render loop
const _vec3 = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3(0, 0.5, 5.2);
const _currentCamPos = new THREE.Vector3(0, 0.5, 5.2);
const _lookAtTarget = new THREE.Vector3(0, 0, 0);

export class ArcReactorScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private frameId = 0;
  private clock = new THREE.Clock();

  // Procedural Model Components
  private rootGroup = new THREE.Group();
  private outerRingGroup = new THREE.Group();
  private middleRotorGroup = new THREE.Group();
  private innerGimbalGroup = new THREE.Group();
  private coreCrystalMesh!: THREE.Mesh;
  private coreWireframeMesh!: THREE.Mesh;
  private opticalRingMesh!: THREE.Mesh;
  private particleSystem!: THREE.Points;
  private repulsorBeamMesh!: THREE.Mesh;
  private contactShadowMesh!: THREE.Mesh;

  // Materials for dynamic emissive intensity
  private coreEmissiveMat!: THREE.MeshStandardMaterial;
  private ringEmissiveMat!: THREE.MeshStandardMaterial;
  private beamMat!: THREE.MeshBasicMaterial;
  private coilMats: THREE.MeshStandardMaterial[] = [];

  // Reactive state
  private audioLevel = 0;
  private targetAudioLevel = 0;
  private currentReaction: HologramReaction = 'idle';
  private reactionTimer = 0;
  private gestureState: RecognizedGesture = 'NONE';
  private explodeSeparation = 0;
  private targetExplodeSeparation = 0;
  private baseRotationSpeed = 0.6;
  private pointerPos = { x: 0, y: 0 };
  private isDestroyed = false;

  // Projection Mode 3D Floating Data Nodes & Process Constellation
  private isProjectionMode = false;
  private projectionProgress = 0;
  private projectionGroup = new THREE.Group();
  private projectedNodes: {
    group: THREE.Group;
    coreMesh: THREE.Mesh;
    orbitRing: THREE.Mesh;
    sprite: THREE.Sprite;
    targetPos: THREE.Vector3;
    basePos: THREE.Vector3;
    rotSpeed: number;
    badgeTexture: THREE.CanvasTexture;
  }[] = [];
  private projectionLinesGeo!: THREE.BufferGeometry;
  private projectionLinesMesh!: THREE.LineSegments;
  private projectionLinesMat!: THREE.LineBasicMaterial;
  private projectionLinePositions!: Float32Array;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Detect Software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Modern Renderer & PBR Color Pipeline
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    this.container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x020617, 0.045);

    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    this.camera.position.copy(_currentCamPos);

    // 4. Mandatory Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig
    this.setupLighting();

    // 6. Build Composite 3-12 Part Procedural Arc Reactor
    this.buildArcReactor();

    // 6b. Build 3D Holographic Projection Mode System Process Constellation
    this.buildProjectionSystem();

    // 7. Event listeners
    this.onResize = this.onResize.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('pointermove', this.onPointerMove);

    // 8. Start Animation Loop
    this.startLoop();
  }

  private setupLighting() {
    // Key Light: warm directional with tight shadow bounds
    const keyLight = new THREE.DirectionalLight(0xfff3e0, 2.8);
    keyLight.position.set(3, 4, 4);
    keyLight.castShadow = !this.isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 15;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
      const d = 3.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
    }
    this.scene.add(keyLight);

    // Cool fill light: Hemisphere contrast
    const hemiLight = new THREE.HemisphereLight(0x00f0ff, 0x020617, 1.2);
    this.scene.add(hemiLight);

    // Subtle cyan backlight for Stark holographic rim
    const rimLight = new THREE.DirectionalLight(0x00d8ff, 3.2);
    rimLight.position.set(-4, -1, -3);
    this.scene.add(rimLight);
  }

  private createHologramTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 1024, 1024);

    // Radial cybernetic markings
    const cx = 512;
    const cy = 512;

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 480, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 460, 0, Math.PI * 2);
    ctx.stroke();

    // Radial degree tick marks
    for (let i = 0; i < 360; i += 5) {
      const angle = (i * Math.PI) / 180;
      const isMajor = i % 30 === 0;
      const r1 = isMajor ? 440 : 455;
      const r2 = 475;

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.strokeStyle = isMajor ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = isMajor ? 3 : 1;
      ctx.stroke();
    }

    // Concentric coordinate grid
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('STARK IND. ARC-85 // QUANTUM RESTRAINT', cx, cy - 380);
    ctx.fillText('OUTPUT: 3.2 GJ/s  •  PALLADIUM CORES: 10', cx, cy + 380);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    return texture;
  }

  private createContactShadowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(0.35, 'rgba(0, 20, 30, 0.45)');
    grad.addColorStop(0.7, 'rgba(0, 100, 130, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private buildArcReactor() {
    this.scene.add(this.rootGroup);

    // Grounding Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(7, 7);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: this.createContactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
    });
    this.contactShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadowMesh.rotation.x = -Math.PI / 2;
    this.contactShadowMesh.position.y = -1.6;
    this.scene.add(this.contactShadowMesh);

    // PART 1: Outer Heavy Titanium Gimbal Ring
    const outerTorusGeo = new THREE.TorusGeometry(1.9, 0.08, 16, 64);
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x242e38,
      metalness: 0.95,
      roughness: 0.22,
    });
    const outerRingMesh = new THREE.Mesh(outerTorusGeo, titaniumMat);
    outerRingMesh.castShadow = !this.isSoftwareGl;
    this.outerRingGroup.add(outerRingMesh);

    // 4 Outer Titanium Brackets
    const bracketGeo = new THREE.BoxGeometry(0.18, 0.35, 0.25);
    const bracketMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.9,
      roughness: 0.35,
    });
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const bracket = new THREE.Mesh(bracketGeo, bracketMat);
      bracket.position.set(Math.cos(angle) * 1.9, Math.sin(angle) * 1.9, 0);
      bracket.rotation.z = angle;
      this.outerRingGroup.add(bracket);
    }
    this.rootGroup.add(this.outerRingGroup);

    // PART 2: Holographic Optical Chapter Ring
    const opticalGeo = new THREE.PlaneGeometry(3.6, 3.6);
    const opticalMat = new THREE.MeshBasicMaterial({
      map: this.createHologramTexture(),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      opacity: 0.85,
    });
    this.opticalRingMesh = new THREE.Mesh(opticalGeo, opticalMat);
    this.rootGroup.add(this.opticalRingMesh);

    // PART 3: Middle Rotor with 10 Segmented Palladium Induction Coils
    const rotorTorusGeo = new THREE.TorusGeometry(1.4, 0.06, 16, 48);
    const copperRotorMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      metalness: 0.88,
      roughness: 0.2,
    });
    const rotorRingMesh = new THREE.Mesh(rotorTorusGeo, copperRotorMat);
    this.middleRotorGroup.add(rotorRingMesh);

    const coilGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16);
    for (let i = 0; i < 10; i++) {
      const angle = (i * (Math.PI * 2)) / 10;
      const coilMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x00d8ff,
        emissiveIntensity: 0.6,
        metalness: 0.85,
        roughness: 0.25,
      });
      this.coilMats.push(coilMat);

      const coilMesh = new THREE.Mesh(coilGeo, coilMat);
      coilMesh.position.set(Math.cos(angle) * 1.4, Math.sin(angle) * 1.4, 0);
      coilMesh.rotation.z = angle + Math.PI / 2;
      this.middleRotorGroup.add(coilMesh);
    }
    this.rootGroup.add(this.middleRotorGroup);

    // PART 4: Inner Gimbal Optical Gyroscope Ring
    const innerTorusGeo = new THREE.TorusGeometry(0.95, 0.045, 16, 40);
    this.ringEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.15,
    });
    const innerRingMesh = new THREE.Mesh(innerTorusGeo, this.ringEmissiveMat);
    this.innerGimbalGroup.add(innerRingMesh);
    this.rootGroup.add(this.innerGimbalGroup);

    // PART 5: Central Pulsing Arc Reactor Crystal (Icosahedron + Geodesic Wireframe)
    const crystalGeo = new THREE.IcosahedronGeometry(0.55, 1);
    this.coreEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.92,
    });
    this.coreCrystalMesh = new THREE.Mesh(crystalGeo, this.coreEmissiveMat);
    this.rootGroup.add(this.coreCrystalMesh);

    const wireframeGeo = new THREE.IcosahedronGeometry(0.62, 1);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    this.coreWireframeMesh = new THREE.Mesh(wireframeGeo, wireframeMat);
    this.rootGroup.add(this.coreWireframeMesh);

    // PART 6: Repulsor Beam Conduit (Volumetric Cylinder)
    const beamGeo = new THREE.CylinderGeometry(0.04, 0.75, 4.5, 16, 1, true);
    this.beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.repulsorBeamMesh = new THREE.Mesh(beamGeo, this.beamMat);
    this.repulsorBeamMesh.rotation.x = Math.PI / 2;
    this.repulsorBeamMesh.position.z = 2.2;
    this.rootGroup.add(this.repulsorBeamMesh);

    // PART 7: Orbital Holographic Particle Matrix (1,200 particles)
    const particleCount = 1200;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const cyanColor = new THREE.Color(0x00f0ff);
    const goldColor = new THREE.Color(0xf59e0b);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 1.0 + Math.random() * 1.5;
      const z = (Math.random() - 0.5) * 1.2;

      particlePositions[i * 3] = Math.cos(theta) * radius;
      particlePositions[i * 3 + 1] = Math.sin(theta) * radius;
      particlePositions[i * 3 + 2] = z;

      const isGold = Math.random() > 0.85;
      const col = isGold ? goldColor : cyanColor;
      particleColors[i * 3] = col.r;
      particleColors[i * 3 + 1] = col.g;
      particleColors[i * 3 + 2] = col.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3)
    );
    particleGeo.setAttribute(
      'color',
      new THREE.BufferAttribute(particleColors, 3)
    );

    const particleMat = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.particleSystem = new THREE.Points(particleGeo, particleMat);
    this.rootGroup.add(this.particleSystem);
  }

  // Generate crisp procedural Stark Industries 2D HUD process badges
  private createProcessBadgeTexture(
    label: string,
    metric: string,
    status: string,
    colorHex: string
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 72;
    const ctx = canvas.getContext('2d')!;

    // Translucent dark carbon HUD backing
    ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
    ctx.fillRect(0, 0, 256, 72);

    // Stark Cyan/Accent Border
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(4, 4, 248, 64);

    // Micro corner brackets
    ctx.fillStyle = colorHex;
    ctx.fillRect(2, 2, 8, 3);
    ctx.fillRect(2, 2, 3, 8);
    ctx.fillRect(246, 2, 8, 3);
    ctx.fillRect(251, 2, 3, 8);
    ctx.fillRect(2, 67, 8, 3);
    ctx.fillRect(2, 62, 3, 8);
    ctx.fillRect(246, 67, 8, 3);
    ctx.fillRect(251, 62, 3, 8);

    // Active status indicator node
    ctx.beginPath();
    ctx.arc(18, 25, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = colorHex;
    ctx.fill();

    // Process identifier header
    ctx.font = 'bold 15px "JetBrains Mono", monospace, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, 30, 29);

    // Subsystem Telemetry & Status
    ctx.font = '11px "JetBrains Mono", monospace, sans-serif';
    ctx.fillStyle = colorHex;
    ctx.fillText(`${metric} // ${status}`, 30, 52);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  // Build 3D Holographic Projection Mode System Process Constellation
  private buildProjectionSystem() {
    this.projectionGroup = new THREE.Group();
    this.projectionGroup.visible = false;
    this.scene.add(this.projectionGroup);

    // 10 Key System Process Data Points casting into 3D orbital space
    const processDefs = [
      { label: 'CORE.NEURAL_NET', metric: '99.8% SYNAPSE', status: 'OPTIMAL', pos: new THREE.Vector3(2.1, 1.4, 0.7), color: 0x00f0ff, hex: '#00f0ff' },
      { label: 'OPTICAL.VISION_CV', metric: '60 FPS TRACK', status: 'ACTIVE', pos: new THREE.Vector3(-2.2, 1.5, 0.6), color: 0x10b981, hex: '#10b981' },
      { label: 'QUANTUM.BUS', metric: '4.8 TFLOPS', status: 'OPTIMAL', pos: new THREE.Vector3(2.5, -0.6, 0.9), color: 0xf59e0b, hex: '#f59e0b' },
      { label: 'OS.KERNEL_LINK', metric: 'RING_0 NOMINAL', status: 'SYNCED', pos: new THREE.Vector3(-2.4, -0.8, 0.8), color: 0x38bdf8, hex: '#38bdf8' },
      { label: 'AUDIO.SPECTRAL', metric: '44.1 kHz PCM', status: 'ACTIVE', pos: new THREE.Vector3(1.1, 2.3, 0.4), color: 0x818cf8, hex: '#818cf8' },
      { label: 'ARC.HARMONICS', metric: '0.55 Hz SYNC', status: 'OPTIMAL', pos: new THREE.Vector3(-1.1, -2.2, 0.5), color: 0xfacc15, hex: '#facc15' },
      { label: 'SYSTEM.TELEMETRY', metric: '0.4ms LATENCY', status: 'SYNCED', pos: new THREE.Vector3(1.8, -1.9, -0.4), color: 0x2dd4bf, hex: '#2dd4bf' },
      { label: 'MEMORY.CACHE', metric: '12.4 GB / 82%', status: 'ACTIVE', pos: new THREE.Vector3(-1.9, 0.4, -0.7), color: 0xf43f5e, hex: '#f43f5e' },
      { label: 'PALM.KINEMATICS', metric: '21-PT SENSOR', status: 'SYNCED', pos: new THREE.Vector3(0.0, 2.6, 1.1), color: 0xfbbf24, hex: '#fbbf24' },
      { label: 'POWER.PALLADIUM', metric: '8.4 GJ/s CORE', status: 'OPTIMAL', pos: new THREE.Vector3(0.0, -2.5, -0.6), color: 0xf97316, hex: '#f97316' },
    ];

    const octaGeo = new THREE.OctahedronGeometry(0.09, 0);
    const ringGeo = new THREE.TorusGeometry(0.18, 0.01, 8, 24);

    processDefs.forEach((def, i) => {
      const nodeGroup = new THREE.Group();

      // Node Geometric Core
      const coreMat = new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.color,
        emissiveIntensity: 2.2,
        metalness: 0.8,
        roughness: 0.2,
      });
      const coreMesh = new THREE.Mesh(octaGeo, coreMat);
      nodeGroup.add(coreMesh);

      // Node Orbit Coordinate Ring
      const ringMat = new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.color,
        emissiveIntensity: 1.2,
        wireframe: true,
      });
      const orbitRing = new THREE.Mesh(ringGeo, ringMat);
      nodeGroup.add(orbitRing);

      // Crisp 2D Billboard HUD Process Badge
      const badgeTexture = this.createProcessBadgeTexture(def.label, def.metric, def.status, def.hex);
      const spriteMat = new THREE.SpriteMaterial({
        map: badgeTexture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(1.15, 0.32, 1.0);
      sprite.position.set(0, 0.28, 0);
      nodeGroup.add(sprite);

      // Initial placement collapsed at reactor center
      nodeGroup.position.set(0, 0, 0);
      nodeGroup.scale.set(0, 0, 0);
      this.projectionGroup.add(nodeGroup);

      this.projectedNodes.push({
        group: nodeGroup,
        coreMesh,
        orbitRing,
        sprite,
        targetPos: def.pos,
        basePos: new THREE.Vector3(0, 0, 0),
        rotSpeed: 0.8 + (i % 3) * 0.4,
        badgeTexture,
      });
    });

    // Connecting Holographic Laser Line Network
    // 10 radial lines (20 v) + 10 perimeter ring lines (20 v) + 4 cross chords (8 v) = 24 segments = 48 vertices
    const totalSegments = 24;
    this.projectionLinePositions = new Float32Array(totalSegments * 6);
    this.projectionLinesGeo = new THREE.BufferGeometry();
    this.projectionLinesGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.projectionLinePositions, 3)
    );

    this.projectionLinesMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    this.projectionLinesMesh = new THREE.LineSegments(
      this.projectionLinesGeo,
      this.projectionLinesMat
    );
    this.projectionGroup.add(this.projectionLinesMesh);
  }

  // Reactive state setters
  public setProjectionMode(val: boolean) {
    this.isProjectionMode = val;
  }

  public getProjectionMode(): boolean {
    return this.isProjectionMode;
  }

  public setAudioLevel(level: number) {
    this.targetAudioLevel = THREE.MathUtils.clamp(level, 0, 1);
  }

  public setHologramReaction(reaction: HologramReaction) {
    this.currentReaction = reaction;
    if (reaction === 'pulse_sequence') {
      this.reactionTimer = 16.0; // Sustained breathing cycle
    } else {
      this.reactionTimer = 2.5; // active reaction duration
    }
  }

  public setGestureState(gesture: RecognizedGesture) {
    this.gestureState = gesture;

    if (gesture === 'OPEN_PALM') {
      this.targetExplodeSeparation = 0.65; // expand holographic rings
    } else if (gesture === 'CLOSED_FIST') {
      this.targetExplodeSeparation = 0.0;
      this.setHologramReaction('repulsor_burst');
    } else if (gesture === 'PINCH_ZOOM') {
      this.targetExplodeSeparation = 0.35;
    } else {
      this.targetExplodeSeparation = 0.0;
    }
  }

  public setExplodedSeparation(val: number) {
    this.targetExplodeSeparation = THREE.MathUtils.clamp(val, 0, 1);
  }

  private onPointerMove(e: PointerEvent) {
    // Normalized pointer coords: -1 to 1
    this.pointerPos.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointerPos.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  private onResize() {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private startLoop() {
    const tick = () => {
      if (this.isDestroyed) return;
      const dt = Math.min(this.clock.getDelta(), 0.1);

      this.updatePhysics(dt);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private updatePhysics(dt: number) {
    // 1. Audio Level Smoothing
    this.audioLevel = THREE.MathUtils.damp(
      this.audioLevel,
      this.targetAudioLevel,
      8,
      dt
    );

    // 2. Exploded View Layer Separation (Exponential Damping)
    this.explodeSeparation = THREE.MathUtils.damp(
      this.explodeSeparation,
      this.targetExplodeSeparation,
      6,
      dt
    );

    // Displace layers along Z axis when exploded/palm gesture active
    this.outerRingGroup.position.z = -this.explodeSeparation * 1.2;
    this.middleRotorGroup.position.z = this.explodeSeparation * 0.8;
    this.innerGimbalGroup.position.z = this.explodeSeparation * 1.5;
    this.opticalRingMesh.position.z = -this.explodeSeparation * 0.5;

    // 3. Reaction Timer
    if (this.reactionTimer > 0) {
      this.reactionTimer -= dt;
      if (this.reactionTimer <= 0) {
        this.currentReaction = 'idle';
      }
    }

    // 4. Dynamic Rotations & Kinetics
    let speedMult = 1.0;
    if (this.currentReaction === 'accelerating' || this.currentReaction === 'quantum_spin') {
      speedMult = 3.5;
    } else if (this.currentReaction === 'repulsor_burst') {
      speedMult = 5.0;
    } else if (this.currentReaction === 'analyzing') {
      speedMult = 1.8;
    } else if (this.currentReaction === 'pulse_sequence') {
      speedMult = 0.85; // Hypnotic rhythmic pace
    }

    const rotDelta = this.baseRotationSpeed * speedMult * dt;

    // Counter-rotating rings
    this.outerRingGroup.rotation.z += rotDelta * 0.4;
    this.middleRotorGroup.rotation.z -= rotDelta * 0.9;
    this.innerGimbalGroup.rotation.x += rotDelta * 1.1;
    this.innerGimbalGroup.rotation.y += rotDelta * 0.7;

    // Optical chapter ring slow rotation
    this.opticalRingMesh.rotation.z += rotDelta * 0.15;

    // Core crystal rotation
    this.coreCrystalMesh.rotation.x += rotDelta * 0.8;
    this.coreCrystalMesh.rotation.y += rotDelta * 1.2;
    this.coreWireframeMesh.rotation.x -= rotDelta * 0.6;
    this.coreWireframeMesh.rotation.z += rotDelta * 0.9;

    // Particles toroidal rotation
    this.particleSystem.rotation.z += rotDelta * 0.5;
    this.particleSystem.rotation.y += rotDelta * 0.2;

    // 5. Breathing Cycle & Synchronized Rhythmic Pulse Sequence (~0.55 Hz ambient LFO)
    const elapsedTime = this.clock.getElapsedTime();
    const breathingPhase = (Math.sin(elapsedTime * Math.PI * 1.1) + 1) * 0.5; // 0 to 1
    const breathingCurve = Math.pow(breathingPhase, 1.4); // Organic inhale/exhale curvature
    const isPulseSequence = this.currentReaction === 'pulse_sequence';

    if (isPulseSequence) {
      // Scale Breathing on Core Crystal & Geodesic Wireframe
      const crystalScale = 1.0 + breathingCurve * 0.35;
      this.coreCrystalMesh.scale.set(crystalScale, crystalScale, crystalScale);

      const wireScale = 1.0 + breathingCurve * 0.28;
      this.coreWireframeMesh.scale.set(wireScale, wireScale, wireScale);

      // Inner Gimbal & Rotor Radial Breathing
      const gimbalScale = 1.0 + breathingCurve * 0.16;
      this.innerGimbalGroup.scale.set(gimbalScale, gimbalScale, gimbalScale);

      // Orbital Particle Matrix Radial Inhale / Exhale
      const particleScale = 1.0 + breathingCurve * 0.26;
      this.particleSystem.scale.set(particleScale, particleScale, particleScale);

      // Subtle breathing displacement along Z-axis
      const breathZ = breathingCurve * 0.25;
      this.outerRingGroup.position.z = -this.explodeSeparation * 1.2 - breathZ * 0.5;
      this.middleRotorGroup.position.z = this.explodeSeparation * 0.8 + breathZ * 0.6;
    } else {
      // Normal non-breathing baseline scales
      this.coreCrystalMesh.scale.set(1, 1, 1);
      this.coreWireframeMesh.scale.set(1, 1, 1);
      this.innerGimbalGroup.scale.set(1, 1, 1);
      this.particleSystem.scale.set(1, 1, 1);
    }

    // 6. Audio and Reaction Glowing Emissive Pulsing
    const pulseFactor = Math.sin(elapsedTime * 4) * 0.2 + 0.8;
    const reactiveBoost = this.audioLevel * 2.5;

    let coreIntensity = (1.5 + reactiveBoost) * pulseFactor;
    let beamOpacity = 0.05 + this.audioLevel * 0.4;

    if (this.currentReaction === 'repulsor_burst') {
      coreIntensity = 4.5;
      beamOpacity = 0.85;
      this.coreEmissiveMat.emissive.setHex(0xffffff);
    } else if (this.currentReaction === 'pulse_sequence') {
      // Synchronized breathing luminous pulse: breathes from warm cyan to brilliant celestial white
      coreIntensity = 1.2 + breathingCurve * 3.6 + reactiveBoost;
      beamOpacity = 0.08 + breathingCurve * 0.45;
      this.coreEmissiveMat.emissive.setRGB(0.1 * breathingCurve, 0.8 + 0.2 * breathingCurve, 1.0);
    } else if (this.currentReaction === 'stealth_blue') {
      coreIntensity = 0.8;
      this.coreEmissiveMat.emissive.setHex(0x0284c7);
      beamOpacity = 0.02;
    } else if (this.currentReaction === 'alert') {
      this.coreEmissiveMat.emissive.setHex(0xf43f5e);
      coreIntensity = 2.8;
    } else {
      this.coreEmissiveMat.emissive.setHex(0x00f0ff);
    }

    this.coreEmissiveMat.emissiveIntensity = coreIntensity;
    this.ringEmissiveMat.emissiveIntensity = (isPulseSequence ? 0.9 + breathingCurve * 1.8 : 0.8) + reactiveBoost;
    this.beamMat.opacity = beamOpacity;

    for (let i = 0; i < this.coilMats.length; i++) {
      if (isPulseSequence) {
        // Coils light up in a circulating breathing wave synchronized to the beat!
        const coilPhase = (elapsedTime * 3.5 + i * (Math.PI * 2 / 10)) % (Math.PI * 2);
        const coilPulse = Math.sin(coilPhase) * 0.5 + 0.5;
        this.coilMats[i].emissiveIntensity =
          0.6 + breathingCurve * 1.4 + coilPulse * 0.8 + this.audioLevel * 1.5;
      } else {
        const phase = Math.sin(elapsedTime * 5 + i * 0.6);
        this.coilMats[i].emissiveIntensity =
          0.5 + phase * 0.4 + this.audioLevel * 1.5;
      }
    }

    // 7. Camera Damping with Subtle Parallax & Breathing Depth
    const cameraBreathingZ = isPulseSequence ? breathingCurve * 0.28 : 0;
    _targetCamPos.x = this.pointerPos.x * 0.5;
    _targetCamPos.y = 0.5 + this.pointerPos.y * 0.4;
    _targetCamPos.z = 5.2 - this.explodeSeparation * 0.8 - cameraBreathingZ;

    _currentCamPos.x = THREE.MathUtils.damp(
      _currentCamPos.x,
      _targetCamPos.x,
      4,
      dt
    );
    _currentCamPos.y = THREE.MathUtils.damp(
      _currentCamPos.y,
      _targetCamPos.y,
      4,
      dt
    );
    _currentCamPos.z = THREE.MathUtils.damp(
      _currentCamPos.z,
      _targetCamPos.z,
      4,
      dt
    );

    this.camera.position.copy(_currentCamPos);
    this.camera.lookAt(_lookAtTarget);

    // 8. Projection Mode Holographic Node Kinetics & Connecting Laser Net
    this.projectionProgress = THREE.MathUtils.damp(
      this.projectionProgress,
      this.isProjectionMode ? 1.0 : 0.0,
      4.5,
      dt
    );

    if (this.projectionProgress < 0.002) {
      this.projectionGroup.visible = false;
    } else {
      this.projectionGroup.visible = true;

      const N = this.projectedNodes.length;
      const currentPositions: THREE.Vector3[] = [];

      for (let i = 0; i < N; i++) {
        const node = this.projectedNodes[i];

        // Harmonic floating orbital drift
        const floatY = Math.sin(elapsedTime * 1.5 + i * 0.8) * 0.08;
        const floatX = Math.cos(elapsedTime * 1.2 + i * 0.6) * 0.05;
        const floatZ = Math.sin(elapsedTime * 1.8 + i * 1.1) * 0.06;

        _vec3.copy(node.targetPos);
        _vec3.x += floatX;
        _vec3.y += floatY;
        _vec3.z += floatZ;

        // Smooth outward radiation from core center (0, 0, 0)
        node.group.position.lerpVectors(node.basePos, _vec3, this.projectionProgress);
        currentPositions.push(node.group.position);

        // Node scale with responsive pulse matching breathing beat
        const nodeScale =
          this.projectionProgress *
          (1.0 + (isPulseSequence ? breathingCurve * 0.22 : 0) + this.audioLevel * 0.35);
        node.group.scale.set(nodeScale, nodeScale, nodeScale);

        // Orbit ring & core kinetic rotation
        node.orbitRing.rotation.x += dt * node.rotSpeed * 1.4;
        node.orbitRing.rotation.y += dt * node.rotSpeed;
        node.coreMesh.rotation.y += dt * node.rotSpeed * 2.0;
      }

      // Update Dynamic Connecting Laser Lines
      let ptr = 0;
      const posArr = this.projectionLinePositions;

      // A. Radial lines from Arc Core emitter (0, 0, 0) to each floating node
      for (let i = 0; i < N; i++) {
        const p = currentPositions[i];
        posArr[ptr++] = 0; posArr[ptr++] = 0; posArr[ptr++] = 0;
        posArr[ptr++] = p.x; posArr[ptr++] = p.y; posArr[ptr++] = p.z;
      }

      // B. Perimeter ring connecting adjacent process nodes
      for (let i = 0; i < N; i++) {
        const p1 = currentPositions[i];
        const p2 = currentPositions[(i + 1) % N];
        posArr[ptr++] = p1.x; posArr[ptr++] = p1.y; posArr[ptr++] = p1.z;
        posArr[ptr++] = p2.x; posArr[ptr++] = p2.y; posArr[ptr++] = p2.z;
      }

      // C. Cross-connection topological chords (0-4, 1-5, 2-6, 3-7)
      const crossPairs = [[0, 4], [1, 5], [2, 6], [3, 7]];
      for (const [a, b] of crossPairs) {
        const p1 = currentPositions[a];
        const p2 = currentPositions[b];
        posArr[ptr++] = p1.x; posArr[ptr++] = p1.y; posArr[ptr++] = p1.z;
        posArr[ptr++] = p2.x; posArr[ptr++] = p2.y; posArr[ptr++] = p2.z;
      }

      this.projectionLinesGeo.attributes.position.needsUpdate = true;
      this.projectionLinesMat.opacity =
        this.projectionProgress *
        0.6 *
        (0.8 + this.audioLevel * 0.5 + (isPulseSequence ? breathingCurve * 0.3 : 0));
    }
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointerMove);

    // Dispose projection node textures and geometries
    for (const node of this.projectedNodes) {
      node.badgeTexture?.dispose();
    }
    this.projectionLinesGeo?.dispose();
    this.projectionLinesMat?.dispose();

    // Dispose geometries, materials, and textures
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Sprite) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => {
            (m as any)?.map?.dispose();
            m.dispose();
          });
        } else if (obj.material) {
          (obj.material as any)?.map?.dispose();
          obj.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(
        this.renderer.domElement
      );
    }
  }
}
