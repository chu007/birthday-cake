import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createAgeCandles } from './numerals.js';

function createParticleDotTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.92)');
  grad.addColorStop(0.72, 'rgba(255, 255, 255, 0.26)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createFivePointStarTexture() {
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, size * 0.46);
  glow.addColorStop(0.0, 'rgba(255, 255, 255, 0.72)');
  glow.addColorStop(0.42, 'rgba(255, 255, 255, 0.16)');
  glow.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const outerR = size * 0.35;
  const innerR = size * 0.145;
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function drawStarOnCanvas(ctx, cx, cy, outerR, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.beginPath();
  const innerR = outerR * 0.44;
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = outerR * 0.85;
  ctx.fill();
  ctx.restore();
}

const RICH_PALETTE = [
  '#ffe066',
  '#ff9f1c',
  '#38e8ff',
  '#3b82f6',
  '#ff6b9d',
  '#ff4d6d',
  '#c084fc',
  '#ffffff',
];

function paintBottomAuroraBand(ctx, ectx, w, h, ratioStart, auroraColors) {
  const applyBand = (targetCtx, alphaScale) => {
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'screen';

    const baseBand = targetCtx.createLinearGradient(0, h * ratioStart, 0, h);
    baseBand.addColorStop(0.0, 'rgba(14, 165, 233, 0.0)');
    baseBand.addColorStop(0.48, `rgba(29, 78, 216, ${0.48 * alphaScale})`);
    baseBand.addColorStop(0.82, `rgba(37, 99, 235, ${0.84 * alphaScale})`);
    baseBand.addColorStop(1.0, `rgba(56, 189, 248, ${0.95 * alphaScale})`);
    targetCtx.fillStyle = baseBand;
    targetCtx.fillRect(0, h * (ratioStart - 0.02), w, h * (1 - ratioStart + 0.02));

    const auroraSpots = 20;
    for (let i = 0; i < auroraSpots; i += 1) {
      const cx = (i / auroraSpots) * w + Math.sin(i * 2.3) * (w * 0.018);
      const cy = h * (0.91 - (i % 3) * 0.055);
      const rx = w * 0.052 + (i % 4) * (w * 0.02);
      const col = auroraColors[i % auroraColors.length];

      const paintBloom = (offsetX) => {
        const g = targetCtx.createRadialGradient(cx + offsetX, cy, 6, cx + offsetX, cy, rx);
        g.addColorStop(0.0, `rgba(${col}, ${0.65 * alphaScale})`);
        g.addColorStop(0.55, `rgba(${col}, ${0.24 * alphaScale})`);
        g.addColorStop(1.0, `rgba(${col}, 0.0)`);
        targetCtx.fillStyle = g;
        targetCtx.beginPath();
        targetCtx.arc(cx + offsetX, cy, rx, 0, Math.PI * 2);
        targetCtx.fill();
      };
      paintBloom(0);
      paintBloom(w);
      paintBloom(-w);
    }
    targetCtx.restore();
  };

  applyBand(ctx, 1.0);
  applyBand(ectx, 0.75);
}

function paintStarsAndBokeh(ctx, ectx, w, h, dotCount, starCount, scale = 1) {
  for (let i = 0; i < dotCount; i += 1) {
    const x = Math.random() * w;
    const y = 14 + Math.random() * (h - 28);
    const r = (4 + Math.random() * 14) * scale;
    const col = RICH_PALETTE[i % RICH_PALETTE.length];
    const paintDot = (targetCtx, a) => {
      targetCtx.save();
      targetCtx.globalAlpha = a;
      const g = targetCtx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0.0, '#ffffff');
      g.addColorStop(0.35, col);
      g.addColorStop(0.85, col);
      g.addColorStop(1.0, 'rgba(0,0,0,0)');
      targetCtx.fillStyle = g;
      targetCtx.beginPath();
      targetCtx.arc(x, y, r, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.restore();
    };
    paintDot(ctx, 0.88);
    paintDot(ectx, 0.68);
  }

  for (let i = 0; i < starCount; i += 1) {
    const x = Math.random() * w;
    const y = 16 + Math.random() * (h - 32);
    const baseR = i % 6 === 0 ? 18 + Math.random() * 9 : i % 2 === 0 ? 10 + Math.random() * 6 : 5 + Math.random() * 4;
    const col = RICH_PALETTE[(i * 3) % RICH_PALETTE.length];
    drawStarOnCanvas(ctx, x, y, baseR * scale, col, 0.96);
    drawStarOnCanvas(ectx, x, y, baseR * scale, col, 0.92);
  }
}

// 下层主蛋糕壁贴图（2048x512）：镜面星空 + 斑斓五角星光点 + 底部电光蓝极光 + happy birthday 字样
function createCakeSideTextures() {
  const w = 2048;
  const h = 512;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = w;
  albedoCanvas.height = h;
  const ctx = albedoCanvas.getContext('2d');

  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = w;
  emissiveCanvas.height = h;
  const ectx = emissiveCanvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0.0, '#090b16');
  bg.addColorStop(0.68, '#050712');
  bg.addColorStop(1.0, '#071432');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ectx.fillStyle = '#000000';
  ectx.fillRect(0, 0, w, h);

  const topSheen = ctx.createLinearGradient(0, 0, 0, 32);
  topSheen.addColorStop(0.0, 'rgba(196, 181, 253, 0.35)');
  topSheen.addColorStop(0.45, 'rgba(56, 189, 248, 0.14)');
  topSheen.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = topSheen;
  ctx.fillRect(0, 0, w, 34);

  paintBottomAuroraBand(ctx, ectx, w, h, 0.72, ['56, 189, 248', '37, 99, 235', '34, 211, 238']);
  paintStarsAndBokeh(ctx, ectx, w, h, 180, 130, 1.0);

  const drawText = (targetCtx, alpha) => {
    targetCtx.save();
    targetCtx.font = 'italic 400 32px Georgia, "Times New Roman", serif';
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';
    targetCtx.shadowColor = 'rgba(186, 230, 253, 0.95)';
    targetCtx.shadowBlur = 10;
    targetCtx.fillStyle = `rgba(245, 250, 255, ${alpha})`;
    const reps = 3;
    for (let i = 0; i < reps; i += 1) {
      const x = (w / reps) * (i + 0.5);
      targetCtx.fillText('happy birthday', x, h * 0.54);
    }
    targetCtx.restore();
  };
  drawText(ctx, 0.92);
  drawText(ectx, 0.8);

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.colorSpace = THREE.SRGBColorSpace;

  return { map, emissiveMap };
}

// 上层小皇冠蛋糕壁贴图（1024x384）：高密度彩色星星光点 + 衔接处柔紫电光蓝极光
function createUpperTierSideTextures() {
  const w = 1024;
  const h = 384;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = w;
  albedoCanvas.height = h;
  const ctx = albedoCanvas.getContext('2d');

  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = w;
  emissiveCanvas.height = h;
  const ectx = emissiveCanvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0.0, '#090b18');
  bg.addColorStop(0.66, '#050712');
  bg.addColorStop(1.0, '#0b183b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ectx.fillStyle = '#000000';
  ectx.fillRect(0, 0, w, h);

  const topSheen = ctx.createLinearGradient(0, 0, 0, 28);
  topSheen.addColorStop(0.0, 'rgba(253, 224, 71, 0.3)');
  topSheen.addColorStop(0.45, 'rgba(244, 114, 182, 0.16)');
  topSheen.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = topSheen;
  ctx.fillRect(0, 0, w, 30);

  paintBottomAuroraBand(ctx, ectx, w, h, 0.74, ['96, 165, 250', '167, 139, 250', '56, 189, 248']);
  paintStarsAndBokeh(ctx, ectx, w, h, 100, 75, 0.85);

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.colorSpace = THREE.SRGBColorSpace;

  return { map, emissiveMap };
}

// 七彩流光糖霜顶面贴图（1024x1024）
function createCakeTopTextures() {
  const size = 1024;
  const cx = size / 2;
  const cy = size / 2;

  const albedo = document.createElement('canvas');
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext('2d');

  const emissive = document.createElement('canvas');
  emissive.width = size;
  emissive.height = size;
  const ectx = emissive.getContext('2d');

  const baseGrad = ctx.createRadialGradient(cx, cy, 12, cx, cy, size * 0.5);
  baseGrad.addColorStop(0.0, '#fff7d6');
  baseGrad.addColorStop(0.28, '#fde047');
  baseGrad.addColorStop(0.54, '#f472b6');
  baseGrad.addColorStop(0.8, '#60a5fa');
  baseGrad.addColorStop(1.0, '#312e81');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  const emGrad = ectx.createRadialGradient(cx, cy, 10, cx, cy, size * 0.5);
  emGrad.addColorStop(0.0, 'rgba(255, 232, 160, 0.52)');
  emGrad.addColorStop(0.45, 'rgba(244, 114, 182, 0.24)');
  emGrad.addColorStop(0.82, 'rgba(56, 189, 248, 0.16)');
  emGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ectx.fillStyle = emGrad;
  ectx.fillRect(0, 0, size, size);

  const palette = ['#ffe066', '#ff9f1c', '#ff6b9d', '#38e8ff', '#fb7185', '#ffffff', '#c084fc', '#3b82f6'];
  for (let i = 0; i < 620; i += 1) {
    const r = Math.sqrt(Math.random()) * (size * 0.47);
    const a = Math.random() * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    const dotR = 3 + Math.random() * 9;
    const col = palette[i % palette.length];

    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fill();

    if (i % 2 === 0) {
      ectx.save();
      ectx.globalAlpha = 0.65;
      ectx.fillStyle = col;
      ectx.beginPath();
      ectx.arc(x, y, dotR * 0.85, 0, Math.PI * 2);
      ectx.fill();
      ectx.restore();
    }
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  const emissiveMap = new THREE.CanvasTexture(emissive);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  return { map, emissiveMap };
}

function createWhitePlateTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  const grad = ctx.createRadialGradient(cx, cy, 40, cx, cy, size * 0.5);
  grad.addColorStop(0.0, '#1e3a8a');
  grad.addColorStop(0.56, '#60a5fa');
  grad.addColorStop(0.67, '#eff6ff');
  grad.addColorStop(0.77, '#ffffff');
  grad.addColorStop(0.94, '#ffffff');
  grad.addColorStop(1.0, '#dbeafe');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class BirthdayScene {
  constructor(container, { age = 18, onFlameTap = null } = {}) {
    this.container = container;
    this.age = age;
    this.onFlameTap = onFlameTap;

    this.state = 'intro';
    this.blowIntensity = 0;
    this.introProgress = 0;
    this.elapsed = 0;
    this.disposed = false;
    this.extraDisposables = [];

    this.dotTex = createParticleDotTexture();
    this.starTex = createFivePointStarTexture();
    this.sideTextures = createCakeSideTextures();
    this.upperSideTextures = createUpperTierSideTextures();
    this.topTextures = createCakeTopTextures();
    this.plateTex = createWhitePlateTexture();

    this._initRenderer();
    this._initScene();
    this._initPostProcessing();
    this._buildBackdropStars();
    this._buildPlateAndCake();
    this._buildDomeArcsAbovePlate();
    this._buildCandles();
    this._buildSwirlParticles();
    this._buildFireworks();
    this._bindEvents();
    this._updateCameraFraming();

    this.lastFrameTime = performance.now();
    this._animate();
  }

  _track(obj) {
    if (obj) this.extraDisposables.push(obj);
    return obj;
  }

  _initRenderer() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020308);
    this.scene.fog = new THREE.FogExp2(0x020308, 0.025);

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 70);
    this.camera.position.set(0, 2.45, 7.65);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 3.8;
    this.controls.maxDistance = 18.0;
    this.controls.minPolarAngle = Math.PI * 0.24;
    this.controls.maxPolarAngle = Math.PI * 0.50;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.48;

    this.userDragging = false;
    this.controls.addEventListener('start', () => {
      this.userDragging = true;
    });
    this.controls.addEventListener('end', () => {
      this.userDragging = false;
    });

    this.ambient = new THREE.AmbientLight(0xc7dcff, 0.78);
    this.scene.add(this.ambient);

    this.rimLight = new THREE.DirectionalLight(0x93c5fd, 1.25);
    this.rimLight.position.set(-3.4, 4.5, -2.5);
    this.scene.add(this.rimLight);

    this.sideHighlight = new THREE.DirectionalLight(0xffffff, 0.85);
    this.sideHighlight.position.set(3.6, 3.2, 3.2);
    this.scene.add(this.sideHighlight);

    this.cakeGroup = new THREE.Group();
    this.scene.add(this.cakeGroup);

    this.targetCamOffset = new THREE.Vector3(0, 2.45, 7.65);
    this.targetLookAt = new THREE.Vector3(0, 0.88, 0);
    this.camTransition = 0;
  }

  _initPostProcessing() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.52,
      0.48,
      0.70
    );
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
  }

  _buildBackdropStars() {
    const count = 240;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xa5f3fc),
      new THREE.Color(0xfef08a),
      new THREE.Color(0xfbcfe8),
    ];

    for (let i = 0; i < count; i += 1) {
      const r = 12 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = this._track(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = this._track(new THREE.PointsMaterial({
      size: 0.08,
      map: this.dotTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    this.bgStars = new THREE.Points(geo, mat);
    this.scene.add(this.bgStars);
  }

  _scatterToppings(count, rMin, rMax, baseY, shoulderRadius, materials, pearlGeo, waferGeo) {
    for (let i = 0; i < count; i += 1) {
      const mat = materials[i % materials.length];
      const useWafer = i % 3 === 1;
      const piece = new THREE.Mesh(useWafer ? waferGeo : pearlGeo, mat);
      const a = Math.random() * Math.PI * 2;
      const r = rMin + Math.random() * (rMax - rMin);
      const sz = 0.016 + Math.random() * 0.025;
      piece.scale.setScalar(sz);

      const shoulderDrop = r > shoulderRadius ? -(r - shoulderRadius) * 0.45 : Math.random() * 0.018;
      piece.position.set(Math.cos(a) * r, baseY + shoulderDrop, Math.sin(a) * r);
      if (useWafer) {
        piece.rotation.set(Math.random() * 1.4, Math.random() * Math.PI, Math.random() * 1.4);
      }
      this.cakeGroup.add(piece);
    }
  }

  _buildPlateAndCake() {
    // 1. 宽大纯白瓷盘（radius = 1.66，承托双层大蛋糕）
    const platePts = [
      new THREE.Vector2(0.0, -0.04),
      new THREE.Vector2(1.18, -0.04),
      new THREE.Vector2(1.48, 0.015),
      new THREE.Vector2(1.65, 0.11),
      new THREE.Vector2(1.67, 0.135),
      new THREE.Vector2(1.59, 0.14),
      new THREE.Vector2(1.26, 0.03),
      new THREE.Vector2(0.0, 0.015),
    ];
    const plateGeo = this._track(new THREE.LatheGeometry(platePts, 72));
    const plateMat = this._track(new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: this.plateTex,
      emissive: 0xeef6ff,
      emissiveMap: this.plateTex,
      emissiveIntensity: 0.42,
      roughness: 0.14,
      metalness: 0.03,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    }));
    this.plate = new THREE.Mesh(plateGeo, plateMat);
    this.cakeGroup.add(this.plate);

    // 瓷盘边缘 36 颗彩色星点装饰
    const platePalette = [0xffe066, 0xff9f1c, 0xff6b9d, 0x38e8ff, 0x3b82f6, 0xfb7185, 0xffffff];
    const plateDotGeo = this._track(new THREE.SphereGeometry(1, 8, 8));
    for (let i = 0; i < 36; i += 1) {
      const a = (i / 36) * Math.PI * 2 + (Math.random() - 0.5) * 0.16;
      const r = 1.12 + Math.random() * 0.40;
      const sz = 0.018 + Math.random() * 0.022;
      const col = platePalette[i % platePalette.length];
      const mat = this._track(new THREE.MeshBasicMaterial({ color: col }));
      const dot = new THREE.Mesh(plateDotGeo, mat);
      dot.scale.setScalar(sz);
      dot.position.set(Math.cos(a) * r, 0.055 + Math.max(0, r - 1.24) * 0.22, Math.sin(a) * r);
      this.cakeGroup.add(dot);
    }

    // 2. 第一层（底层大蛋糕：radius = 1.06, height = 0.98, y = 0.04..1.02）
    const baseGlowGeo = this._track(new THREE.TorusGeometry(1.07, 0.024, 14, 72));
    const baseGlowMat = this._track(new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
    }));
    this.baseBlueRing = new THREE.Mesh(baseGlowGeo, baseGlowMat);
    this.baseBlueRing.rotation.x = Math.PI / 2;
    this.baseBlueRing.position.y = 0.045;
    this.cakeGroup.add(this.baseBlueRing);

    const tier1BodyGeo = this._track(new THREE.CylinderGeometry(1.06, 1.06, 0.98, 72, 1, true));
    const tier1BodyMat = this._track(new THREE.MeshPhysicalMaterial({
      map: this.sideTextures.map,
      emissive: 0xffffff,
      emissiveMap: this.sideTextures.emissiveMap,
      emissiveIntensity: 0.78,
      roughness: 0.15,
      metalness: 0.08,
      clearcoat: 0.92,
      clearcoatRoughness: 0.12,
    }));
    const tier1Body = new THREE.Mesh(tier1BodyGeo, tier1BodyMat);
    tier1Body.position.y = 0.53;
    this.cakeGroup.add(tier1Body);

    const tier1TopGeo = this._track(new THREE.CylinderGeometry(1.01, 1.06, 0.055, 72));
    const topDeckMat = this._track(new THREE.MeshPhysicalMaterial({
      map: this.topTextures.map,
      emissive: 0xffffff,
      emissiveMap: this.topTextures.emissiveMap,
      emissiveIntensity: 0.72,
      roughness: 0.18,
      metalness: 0.06,
      clearcoat: 0.85,
      clearcoatRoughness: 0.14,
    }));
    const tier1Top = new THREE.Mesh(tier1TopGeo, topDeckMat);
    tier1Top.position.y = 1.035;
    this.cakeGroup.add(tier1Top);

    // 两层衔接处的青金柔光细环
    const junctionGeo = this._track(new THREE.TorusGeometry(0.695, 0.016, 12, 64));
    const junctionMat = this._track(new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.75,
    }));
    this.tierJunctionRing = new THREE.Mesh(junctionGeo, junctionMat);
    this.tierJunctionRing.rotation.x = Math.PI / 2;
    this.tierJunctionRing.position.y = 1.068;
    this.cakeGroup.add(this.tierJunctionRing);

    // 3. 第二层（上层皇冠小蛋糕：radius = 0.68, height = 0.74, y = 1.05..1.79）
    const tier2BodyGeo = this._track(new THREE.CylinderGeometry(0.68, 0.68, 0.74, 64, 1, true));
    const tier2BodyMat = this._track(new THREE.MeshPhysicalMaterial({
      map: this.upperSideTextures.map,
      emissive: 0xffffff,
      emissiveMap: this.upperSideTextures.emissiveMap,
      emissiveIntensity: 0.78,
      roughness: 0.15,
      metalness: 0.08,
      clearcoat: 0.92,
      clearcoatRoughness: 0.12,
    }));
    const tier2Body = new THREE.Mesh(tier2BodyGeo, tier2BodyMat);
    tier2Body.position.y = 1.42;
    this.cakeGroup.add(tier2Body);

    const tier2TopGeo = this._track(new THREE.CylinderGeometry(0.64, 0.68, 0.05, 64));
    const tier2Top = new THREE.Mesh(tier2TopGeo, topDeckMat);
    tier2Top.position.y = 1.805;
    this.cakeGroup.add(tier2Top);

    // 4. 双层露台 + 顶面流光溢彩 3D 糖珠与亮片（底层露台 110 颗 + 顶层皇冠 130 颗）
    const topPalette = [
      0xffe066, 0xff9f1c, 0xff6b9d, 0x38e8ff, 0x3b82f6, 0xc084fc, 0xff4d6d, 0xffffff, 0xfef08a,
    ];
    const toppingMaterials = topPalette.map((col, idx) =>
      this._track(new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: idx % 2 === 0 ? 0.8 : 0.48,
        roughness: 0.18,
        metalness: 0.15,
      }))
    );
    const pearlGeo = this._track(new THREE.SphereGeometry(1, 8, 8));
    const waferGeo = this._track(new THREE.CylinderGeometry(1, 1, 0.35, 8));

    // 底层外露平台糖霜装饰（r = 0.72..1.03）
    this._scatterToppings(110, 0.72, 1.03, 1.062, 0.98, toppingMaterials, pearlGeo, waferGeo);
    // 上层顶面糖霜装饰（r = 0.21..0.66，留出中央放 26 蜡烛）
    this._scatterToppings(130, 0.21, 0.66, 1.832, 0.61, toppingMaterials, pearlGeo, waferGeo);

    // 5. 贴合两层蛋糕表面的 400 颗流光星尘粒子
    const dustCount = 400;
    const dustPos = new Float32Array(dustCount * 3);
    const dustCol = new Float32Array(dustCount * 3);
    const dustPalette = [
      new THREE.Color(0x38e8ff),
      new THREE.Color(0xffe066),
      new THREE.Color(0xff6b9d),
      new THREE.Color(0xffffff),
      new THREE.Color(0xc084fc),
    ];

    for (let i = 0; i < dustCount; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const isTier1 = i < 240;
      const r = isTier1 ? 1.075 + Math.random() * 0.055 : 0.695 + Math.random() * 0.045;
      const y = isTier1 ? 0.06 + Math.random() * 0.96 : 1.06 + Math.random() * 0.74;
      dustPos[i * 3] = Math.cos(a) * r;
      dustPos[i * 3 + 1] = y;
      dustPos[i * 3 + 2] = Math.sin(a) * r;

      const c = dustPalette[i % dustPalette.length];
      dustCol[i * 3] = c.r;
      dustCol[i * 3 + 1] = c.g;
      dustCol[i * 3 + 2] = c.b;
    }

    const dustGeo = this._track(new THREE.BufferGeometry());
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustCol, 3));
    const dustMat = this._track(new THREE.PointsMaterial({
      size: 0.042,
      map: this.dotTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.84,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    this.cakeDust = new THREE.Points(dustGeo, dustMat);
    this.cakeGroup.add(this.cakeDust);
  }

  _buildDomeArcsAbovePlate() {
    // 严格位于纯白瓷盘上方（y >= 0.14）的半开放玻璃罩轮廓 + 若隐若现断断续续的多条细弧线（按双层大蛋糕尺度拔高）
    this.domeArcMaterials = [];

    const domeGeo = this._track(new THREE.SphereGeometry(2.00, 64, 42, 0, Math.PI * 2, 0, Math.PI * 0.69));
    this.domeShellMat = this._track(new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vLocalPos;
        varying float vWorldY;
        void main() {
          vLocalPos = position;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldY = worldPos.y;
          vec4 mvPos = viewMatrix * worldPos;
          vNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uOpacity;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vLocalPos;
        varying float vWorldY;
        void main() {
          float plateFade = smoothstep(0.14, 0.36, vWorldY);
          float ndv = abs(dot(normalize(vNormal), normalize(vViewDir)));
          float rim = pow(1.0 - ndv, 18.0);

          float angle = atan(vLocalPos.z, vLocalPos.x);
          float wisp = smoothstep(-0.15, 0.65, sin(angle * 3.0 + vLocalPos.y * 2.4 + uTime * 0.35));
          float pulse = 0.72 + 0.28 * sin(uTime * 1.4 + vLocalPos.y * 2.0);

          vec3 col = mix(vec3(0.75, 0.88, 1.0), vec3(1.0, 0.92, 0.78), 0.45);
          float alpha = rim * plateFade * (0.28 + 0.72 * wisp) * 0.56 * pulse * uOpacity;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    }));

    const domeShell = new THREE.Mesh(domeGeo, this.domeShellMat);
    domeShell.position.y = 1.38;
    this.cakeGroup.add(domeShell);

    const arcSpecs = [
      { radius: 1.97, centerY: 1.38, rotY: 0.15, freq: 3.0, phase: 0.4, speed: 0.25, color: new THREE.Color(0xfff1d6), peakAlpha: 0.50 },
      { radius: 2.03, centerY: 1.37, rotY: 1.05, freq: 4.0, phase: 1.8, speed: -0.20, color: new THREE.Color(0xdbeafe), peakAlpha: 0.40 },
      { radius: 2.08, centerY: 1.39, rotY: 2.18, freq: 2.5, phase: 3.1, speed: 0.18, color: new THREE.Color(0xfef3c7), peakAlpha: 0.36 },
      { radius: 1.94, centerY: 1.36, rotY: -0.82, freq: 3.5, phase: 4.5, speed: -0.22, color: new THREE.Color(0xe0f2fe), peakAlpha: 0.34 },
      { radius: 2.11, centerY: 1.40, rotY: 1.62, freq: 3.0, phase: 5.4, speed: 0.16, color: new THREE.Color(0xffffff), peakAlpha: 0.30 },
    ];

    for (const spec of arcSpecs) {
      const pts = [];
      const segments = 60;
      const startTheta = -0.60;
      const endTheta = Math.PI + 0.60;
      for (let i = 0; i <= segments; i += 1) {
        const theta = startTheta + (i / segments) * (endTheta - startTheta);
        const x = Math.cos(theta) * spec.radius;
        const y = spec.centerY + Math.sin(theta) * spec.radius;
        pts.push(new THREE.Vector3(x, Math.max(0.14, y), 0));
      }

      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = this._track(new THREE.TubeGeometry(curve, 76, 0.0044, 6, false));

      const arcMat = this._track(new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uFreq: { value: spec.freq },
          uPhase: { value: spec.phase },
          uSpeed: { value: spec.speed },
          uColor: { value: spec.color },
          uPeak: { value: spec.peakAlpha },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform float uOpacity;
          uniform float uFreq;
          uniform float uPhase;
          uniform float uSpeed;
          uniform vec3 uColor;
          uniform float uPeak;
          varying vec2 vUv;
          void main() {
            float endFade = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x);
            float dash = sin(vUv.x * 6.28318 * uFreq + uPhase + uTime * uSpeed);
            float broken = smoothstep(-0.08, 0.58, dash);
            float shimmer = 0.78 + 0.22 * sin(uTime * 1.7 + uPhase);
            float alpha = endFade * broken * uPeak * shimmer * uOpacity;
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
      }));

      const mesh = new THREE.Mesh(tubeGeo, arcMat);
      mesh.rotation.y = spec.rotY;
      this.cakeGroup.add(mesh);
      this.domeArcMaterials.push(arcMat);
    }
  }

  _buildCandles() {
    this.candles = createAgeCandles(this.age);
    this.candles.root.position.set(0, 1.83, 0);
    this.cakeGroup.add(this.candles.root);
  }

  _buildSwirlParticles() {
    const richColors = [
      new THREE.Color(0xffe066),
      new THREE.Color(0xff9f1c),
      new THREE.Color(0x38e8ff),
      new THREE.Color(0xff6b9d),
      new THREE.Color(0xff4d6d),
      new THREE.Color(0xc084fc),
      new THREE.Color(0xffffff),
    ];

    const createSwirlLayer = (count, tex, size, speedFactor, rMin, rMax, yMin, yMax, riseDir = 1) => {
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const meta = [];

      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const radius = rMin + Math.random() * (rMax - rMin);
        const y = yMin + Math.random() * (yMax - yMin);
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = Math.sin(angle) * radius;

        const c = richColors[Math.floor(Math.random() * richColors.length)];
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;

        meta.push({
          angle,
          radius,
          y,
          yMin,
          yMax,
          rMin,
          rMax,
          riseDir,
          angSpeed: (0.20 + Math.random() * 0.34) * speedFactor,
          riseSpeed: (0.18 + Math.random() * 0.28) * speedFactor,
          phase: Math.random() * Math.PI * 2,
        });
      }

      const geo = this._track(new THREE.BufferGeometry());
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const mat = this._track(new THREE.PointsMaterial({
        size,
        map: tex,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));

      const points = new THREE.Points(geo, mat);
      this.cakeGroup.add(points);
      return { points, geo, mat, meta, count };
    };

    // 5 层拔高版流光溢彩粒子：环绕双层蛋糕与顶层烛火
    this.heroBokeh = createSwirlLayer(40, this.dotTex, 0.25, 0.72, 0.88, 1.92, 0.22, 3.05);
    this.heroStars = createSwirlLayer(64, this.starTex, 0.31, 0.85, 0.72, 1.96, 0.18, 3.18);
    this.midStars = createSwirlLayer(165, this.starTex, 0.18, 1.05, 0.52, 1.90, 0.16, 3.10);
    this.candleMist = createSwirlLayer(360, this.dotTex, 0.088, 1.22, 0.20, 1.52, 0.95, 3.05);
    this.belowSparks = createSwirlLayer(42, this.starTex, 0.13, 0.55, 0.35, 1.58, -0.45, 0.04, -1);
  }

  _buildFireworks() {
    this.fireworkBursts = [];
    const burstCount = 5;
    const perBurst = 115;
    const colors = [0xffd76e, 0x38bdf8, 0xf472b6, 0xfb7185, 0xa7f3d0, 0xffffff];

    for (let b = 0; b < burstCount; b += 1) {
      const positions = new Float32Array(perBurst * 3);
      const velocities = new Float32Array(perBurst * 3);
      const vColors = new Float32Array(perBurst * 3);

      const c1 = new THREE.Color(colors[b % colors.length]);
      const c2 = new THREE.Color(colors[(b + 2) % colors.length]);

      for (let i = 0; i < perBurst; i += 1) {
        const mix = c1.clone().lerp(c2, Math.random());
        vColors[i * 3] = mix.r;
        vColors[i * 3 + 1] = mix.g;
        vColors[i * 3 + 2] = mix.b;
      }

      const geo = this._track(new THREE.BufferGeometry());
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(vColors, 3));

      const mat = this._track(new THREE.PointsMaterial({
        size: 0.17,
        map: this.starTex,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));

      const points = new THREE.Points(geo, mat);
      points.visible = false;
      this.scene.add(points);

      this.fireworkBursts.push({
        points,
        geo,
        mat,
        positions,
        velocities,
        count: perBurst,
        active: false,
        age: 0,
        life: 1.95,
      });
    }
  }

  _launchFireworks() {
    const origins = [
      new THREE.Vector3(-1.45, 3.15, -0.8),
      new THREE.Vector3(1.45, 3.25, -0.6),
      new THREE.Vector3(0.0, 3.65, -1.2),
      new THREE.Vector3(-1.15, 2.6, 0.5),
      new THREE.Vector3(1.15, 2.7, 0.4),
    ];

    this.fireworkBursts.forEach((burst, idx) => {
      const origin = origins[idx % origins.length];
      for (let i = 0; i < burst.count; i += 1) {
        burst.positions[i * 3] = origin.x;
        burst.positions[i * 3 + 1] = origin.y;
        burst.positions[i * 3 + 2] = origin.z;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 1.2 + Math.random() * 2.2;
        burst.velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
        burst.velocities[i * 3 + 1] = Math.cos(phi) * speed + 0.55;
        burst.velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
      }
      burst.geo.attributes.position.needsUpdate = true;
      burst.age = -(idx * 0.28);
      burst.life = 1.95;
      burst.active = true;
      burst.points.visible = false;
    });
  }

  _bindEvents() {
    this._onResize = () => {
      if (this.disposed) return;
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.composer.setSize(width, height);
      this.bloomPass.setSize(width, height);
      this._updateCameraFraming();
    };
    window.addEventListener('resize', this._onResize);

    this.raycaster = new THREE.Raycaster();
    this.pointerDownPos = new THREE.Vector2();

    this._onPointerDown = (e) => {
      this.pointerDownPos.set(e.clientX, e.clientY);
    };

    this._onPointerUp = (e) => {
      if (this.state !== 'wish' || !this.onFlameTap) return;
      const dx = e.clientX - this.pointerDownPos.x;
      const dy = e.clientY - this.pointerDownPos.y;
      if (Math.hypot(dx, dy) > 14) return;

      const rect = this.renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      this.raycaster.setFromCamera(ndc, this.camera);
      const hits = this.raycaster.intersectObjects(this.candles.hitTargets, false);
      if (hits.length > 0) {
        this.onFlameTap();
      }
    };

    this.renderer.domElement.addEventListener('pointerdown', this._onPointerDown);
    this.renderer.domElement.addEventListener('pointerup', this._onPointerUp);
  }

  _updateCameraFraming() {
    const aspect = this.camera.aspect;
    const isPortrait = aspect < 0.85;
    const halfTanY = Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5));
    const fitPortraitDist = Math.min(14.5, Math.max(8.4, 2.16 / (halfTanY * Math.max(0.38, aspect))));

    if (this.state === 'wish') {
      this.targetCamOffset.set(0, isPortrait ? 2.95 : 2.55, isPortrait ? fitPortraitDist * 0.84 : 5.8);
      this.targetLookAt.set(0, isPortrait ? 1.32 : 1.38, 0);
    } else if (this.state === 'blown') {
      this.targetCamOffset.set(0, isPortrait ? 3.35 : 2.65, isPortrait ? fitPortraitDist * 1.04 : 7.9);
      this.targetLookAt.set(0, isPortrait ? 0.82 : 0.96, 0);
    } else {
      this.targetCamOffset.set(0, isPortrait ? 3.05 : 2.45, isPortrait ? fitPortraitDist : 7.65);
      this.targetLookAt.set(0, isPortrait ? 0.78 : 0.88, 0);
    }

    if (this.state === 'intro') {
      this.camera.position.copy(this.targetCamOffset);
      this.controls.target.copy(this.targetLookAt);
      this.controls.update();
    } else {
      this.camTransition = 1.0;
    }
  }

  runAndLight() {
    this.state = 'lit';
    this.introProgress = 0.01;
    this.candles.ignite();
    this._updateCameraFraming();
  }

  enterWishMode() {
    if (this.state === 'blown') {
      this.candles.ignite();
    }
    this.state = 'wish';
    this._updateCameraFraming();
  }

  blowOut() {
    if (this.state === 'blown') return;
    this.state = 'blown';
    this.blowIntensity = 0;
    this.candles.extinguish();
    this._launchFireworks();
    this._updateCameraFraming();
  }

  relight() {
    this.state = 'lit';
    this.blowIntensity = 0;
    this.candles.ignite();
    this._updateCameraFraming();
  }

  setBlowIntensity(val) {
    this.blowIntensity = Math.min(1, Math.max(0, val));
  }

  setAge(newAge) {
    const clamped = Math.min(99, Math.max(1, Number.parseInt(newAge, 10) || 18));
    if (clamped === this.age) return;
    this.age = clamped;
    const wasLit = this.candles.isLit();
    this.cakeGroup.remove(this.candles.root);
    this.candles.dispose();
    this._buildCandles();
    if (wasLit) {
      this.candles.ignite();
    }
  }

  _updateSwirl(layer, dt, power) {
    const pos = layer.geo.attributes.position.array;
    for (let i = 0; i < layer.count; i += 1) {
      const m = layer.meta[i];
      m.angle += m.angSpeed * dt;
      m.y += m.riseSpeed * dt * m.riseDir;
      if (m.riseDir > 0 && m.y > m.yMax) {
        m.y = m.yMin;
        m.radius = m.rMin + Math.random() * (m.rMax - m.rMin);
      } else if (m.riseDir < 0 && m.y < m.yMin) {
        m.y = m.yMax;
        m.radius = m.rMin + Math.random() * (m.rMax - m.rMin);
      }
      const wobble = Math.sin(this.elapsed * 1.8 + m.phase) * 0.055;
      const r = m.radius + wobble;
      pos[i * 3] = Math.cos(m.angle) * r;
      pos[i * 3 + 1] = m.y;
      pos[i * 3 + 2] = Math.sin(m.angle) * r;
    }
    layer.geo.attributes.position.needsUpdate = true;
    layer.mat.opacity = 0.95 * power;
  }

  _updateFireworks(dt) {
    for (const burst of this.fireworkBursts) {
      if (!burst.active) continue;
      burst.age += dt;
      if (burst.age < 0) continue;
      if (burst.age >= burst.life) {
        burst.active = false;
        burst.points.visible = false;
        continue;
      }

      burst.points.visible = true;
      const p = burst.age / burst.life;
      const drag = Math.pow(0.96, dt * 60);

      for (let i = 0; i < burst.count; i += 1) {
        const idx = i * 3;
        burst.velocities[idx] *= drag;
        burst.velocities[idx + 1] = burst.velocities[idx + 1] * drag - 1.55 * dt;
        burst.velocities[idx + 2] *= drag;

        burst.positions[idx] += burst.velocities[idx] * dt;
        burst.positions[idx + 1] += burst.velocities[idx + 1] * dt;
        burst.positions[idx + 2] += burst.velocities[idx + 2] * dt;
      }
      burst.geo.attributes.position.needsUpdate = true;
      burst.mat.opacity = Math.max(0, 1 - Math.pow(p, 1.65));
    }
  }

  _animate() {
    if (this.disposed) return;
    requestAnimationFrame(() => this._animate());

    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastFrameTime) / 1000);
    this.lastFrameTime = now;
    this.elapsed += dt;

    if (this.state === 'intro') {
      this.introProgress = 0.24;
    } else if (this.introProgress < 1) {
      this.introProgress = Math.min(1, this.introProgress + dt * 1.15);
    }

    const easePower = this.state === 'intro'
      ? 0.24
      : 1 - Math.pow(1 - this.introProgress, 3);

    this.ambient.intensity = THREE.MathUtils.lerp(0.26, 0.78, easePower);
    this.rimLight.intensity = THREE.MathUtils.lerp(0.45, 1.25, easePower);
    this.sideHighlight.intensity = THREE.MathUtils.lerp(0.20, 0.85, easePower);

    this.cakeGroup.scale.setScalar(0.92 + 0.08 * easePower);
    this.domeShellMat.uniforms.uTime.value = this.elapsed;
    this.domeShellMat.uniforms.uOpacity.value = easePower;
    for (const mat of this.domeArcMaterials) {
      mat.uniforms.uTime.value = this.elapsed;
      mat.uniforms.uOpacity.value = easePower;
    }

    this.baseBlueRing.material.opacity = this.state === 'intro' ? 0.36 : 0.85 * easePower;
    this.tierJunctionRing.material.opacity = this.state === 'intro' ? 0.28 : 0.75 * easePower;
    this.cakeDust.material.opacity = 0.84 * easePower;

    this.bgStars.rotation.y += dt * 0.015;
    this._updateSwirl(this.heroBokeh, dt, easePower);
    this._updateSwirl(this.heroStars, dt, easePower);
    this._updateSwirl(this.midStars, dt, easePower);
    this._updateSwirl(this.candleMist, dt, easePower);
    this._updateSwirl(this.belowSparks, dt, easePower);
    this.candles.update(dt, this.elapsed, this.blowIntensity);
    this._updateFireworks(dt);

    if (this.camTransition > 0 && !this.userDragging) {
      const lerpAlpha = Math.min(1, dt * 5.2);
      this.controls.target.lerp(this.targetLookAt, lerpAlpha);
      const currentDist = this.camera.position.distanceTo(this.controls.target);
      const desiredDist = this.targetCamOffset.distanceTo(this.targetLookAt);
      const dir = this.camera.position.clone().sub(this.controls.target).normalize();
      const newDist = THREE.MathUtils.lerp(currentDist, desiredDist, lerpAlpha);
      const desiredY = THREE.MathUtils.lerp(this.camera.position.y, this.targetCamOffset.y, lerpAlpha);
      this.camera.position.copy(this.controls.target).addScaledVector(dir, newDist);
      this.camera.position.y = desiredY;
      this.camTransition = Math.max(0, this.camTransition - dt * 0.55);
    }

    this.controls.autoRotate = !this.userDragging && this.state !== 'wish';
    this.controls.update();

    this.composer.render();
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener('resize', this._onResize);
    this.renderer.domElement.removeEventListener('pointerdown', this._onPointerDown);
    this.renderer.domElement.removeEventListener('pointerup', this._onPointerUp);
    this.candles.dispose();
    this.dotTex.dispose();
    this.starTex.dispose();
    this.sideTextures.map.dispose();
    this.sideTextures.emissiveMap.dispose();
    this.upperSideTextures.map.dispose();
    this.upperSideTextures.emissiveMap.dispose();
    this.topTextures.map.dispose();
    this.topTextures.emissiveMap.dispose();
    this.plateTex.dispose();
    for (const item of this.extraDisposables) {
      if (typeof item.dispose === 'function') item.dispose();
    }
    this.controls.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
