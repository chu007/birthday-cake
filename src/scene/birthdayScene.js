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

// 2048x512 修长黑曜镜面蛋糕壁：高饱和彩色五角星、斑斓光点、底部电光蓝极光波浪、happy birthday 字样
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

  // 深黑曜镜面底色（从顶到底保持修长深邃黑，不再加遮挡高度的宽滴落帘）
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0.0, '#090b16');
  bg.addColorStop(0.68, '#050712');
  bg.addColorStop(1.0, '#071432');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ectx.fillStyle = '#000000';
  ectx.fillRect(0, 0, w, h);

  // 顶部仅留极细微的镜面紫金高光过渡，不缩短视觉筒高
  const topSheen = ctx.createLinearGradient(0, 0, 0, 32);
  topSheen.addColorStop(0.0, 'rgba(196, 181, 253, 0.35)');
  topSheen.addColorStop(0.45, 'rgba(56, 189, 248, 0.14)');
  topSheen.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = topSheen;
  ctx.fillRect(0, 0, w, 34);

  // 底部 ~24% 手绘感电光蓝/青色镜面极光波浪
  const drawBottomAurora = (targetCtx, alphaScale) => {
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'screen';

    const baseBand = targetCtx.createLinearGradient(0, h * 0.72, 0, h);
    baseBand.addColorStop(0.0, 'rgba(14, 165, 233, 0.0)');
    baseBand.addColorStop(0.48, `rgba(29, 78, 216, ${0.48 * alphaScale})`);
    baseBand.addColorStop(0.82, `rgba(37, 99, 235, ${0.84 * alphaScale})`);
    baseBand.addColorStop(1.0, `rgba(56, 189, 248, ${0.95 * alphaScale})`);
    targetCtx.fillStyle = baseBand;
    targetCtx.fillRect(0, h * 0.70, w, h * 0.30);

    const auroraSpots = 20;
    for (let i = 0; i < auroraSpots; i += 1) {
      const cx = (i / auroraSpots) * w + Math.sin(i * 2.3) * 36;
      const cy = h * (0.91 - (i % 3) * 0.055);
      const rx = 105 + (i % 4) * 42;
      const col = i % 3 === 0 ? '56, 189, 248' : i % 3 === 1 ? '37, 99, 235' : '34, 211, 238';

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

  drawBottomAurora(ctx, 1.0);
  drawBottomAurora(ectx, 0.75);

  // 高密度高饱和度斑斓彩色圆点与流光星点（180 颗彩点 + 130 颗三级尺寸五角星）
  const richPalette = [
    '#ffe066', // 亮柠檬黄
    '#ff9f1c', // 琥珀橙
    '#38e8ff', // 电光青
    '#3b82f6', // 宝石蓝
    '#ff6b9d', // 樱花粉
    '#ff4d6d', // 珊瑚红
    '#c084fc', // 星云紫
    '#ffffff', // 纯白
  ];

  for (let i = 0; i < 180; i += 1) {
    const x = Math.random() * w;
    const y = 14 + Math.random() * (h - 28);
    const r = 4 + Math.random() * 14;
    const col = richPalette[i % richPalette.length];
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

  for (let i = 0; i < 130; i += 1) {
    const x = Math.random() * w;
    const y = 18 + Math.random() * (h - 40);
    // 3 档尺寸：大主角亮星 + 中星 + 小星
    const tier = i % 6 === 0 ? 18 + Math.random() * 9 : i % 2 === 0 ? 10 + Math.random() * 6 : 5 + Math.random() * 4;
    const col = richPalette[(i * 3) % richPalette.length];
    drawStarOnCanvas(ctx, x, y, tier, col, 0.96);
    drawStarOnCanvas(ectx, x, y, tier, col, 0.92);
  }

  // 蛋糕中部偏下清晰细腻的白色 "happy birthday" 字样
  const drawText = (targetCtx, alpha) => {
    targetCtx.save();
    targetCtx.font = 'italic 400 30px Georgia, "Times New Roman", serif';
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
  drawText(ctx, 0.9);
  drawText(ectx, 0.78);

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.colorSpace = THREE.SRGBColorSpace;

  return { map, emissiveMap };
}

// 1024x1024 温暖烛光映照下的七彩流光糖霜顶面
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

  // 暖金烛光中心 -> 蜜桃粉/橙 -> 梦幻紫/青蓝边沿
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

// 亮白瓷盘贴图：纯白陶瓷釉面 + 蛋糕正下方淡淡天蓝倒影
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
  grad.addColorStop(0.54, '#60a5fa');
  grad.addColorStop(0.65, '#eff6ff');
  grad.addColorStop(0.76, '#ffffff');
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
    this.scene.fog = new THREE.FogExp2(0x020308, 0.028);

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 65);
    this.camera.position.set(0, 1.95, 6.2);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 3.4;
    this.controls.maxDistance = 16.0;
    // 更贴近平视角度，充分展现修长挺拔的蛋糕立体侧面
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
    this.rimLight.position.set(-3.4, 4.2, -2.5);
    this.scene.add(this.rimLight);

    this.sideHighlight = new THREE.DirectionalLight(0xffffff, 0.85);
    this.sideHighlight.position.set(3.6, 2.8, 3.2);
    this.scene.add(this.sideHighlight);

    this.cakeGroup = new THREE.Group();
    this.scene.add(this.cakeGroup);

    this.targetCamOffset = new THREE.Vector3(0, 1.95, 6.2);
    this.targetLookAt = new THREE.Vector3(0, 1.05, 0);
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
    const count = 220;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xa5f3fc),
      new THREE.Color(0xfef08a),
      new THREE.Color(0xfbcfe8),
    ];

    for (let i = 0; i < count; i += 1) {
      const r = 11 + Math.random() * 14;
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

  _buildPlateAndCake() {
    // 1. 纯白瓷盘（高明度亮白瓷面，radius = 1.54）
    const platePts = [
      new THREE.Vector2(0.0, -0.04),
      new THREE.Vector2(1.08, -0.04),
      new THREE.Vector2(1.36, 0.015),
      new THREE.Vector2(1.53, 0.105),
      new THREE.Vector2(1.55, 0.13),
      new THREE.Vector2(1.48, 0.135),
      new THREE.Vector2(1.16, 0.03),
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

    // 瓷盘表面环绕的丰富彩色糖果点与小星星（~30 颗）
    const platePalette = [0xffe066, 0xff9f1c, 0xff6b9d, 0x38e8ff, 0x3b82f6, 0xfb7185, 0xffffff];
    const plateDotGeo = this._track(new THREE.SphereGeometry(1, 8, 8));
    for (let i = 0; i < 30; i += 1) {
      const a = (i / 30) * Math.PI * 2 + (Math.random() - 0.5) * 0.18;
      const r = 1.04 + Math.random() * 0.38;
      const sz = 0.018 + Math.random() * 0.022;
      const col = platePalette[i % platePalette.length];
      const mat = this._track(new THREE.MeshBasicMaterial({ color: col }));
      const dot = new THREE.Mesh(plateDotGeo, mat);
      dot.scale.setScalar(sz);
      dot.position.set(Math.cos(a) * r, 0.055 + Math.max(0, r - 1.15) * 0.22, Math.sin(a) * r);
      this.cakeGroup.add(dot);
    }

    // 2. 蛋糕底座电光蓝柔和光圈
    const baseGlowGeo = this._track(new THREE.TorusGeometry(0.93, 0.022, 14, 72));
    const baseGlowMat = this._track(new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
    }));
    this.baseBlueRing = new THREE.Mesh(baseGlowGeo, baseGlowMat);
    this.baseBlueRing.rotation.x = Math.PI / 2;
    this.baseBlueRing.position.y = 0.045;
    this.cakeGroup.add(this.baseBlueRing);

    // 3. 修长挺拔的镜面蛋糕筒身（radius = 0.92, height = 1.38 -> 高径比 0.75，还原图片修长美感）
    const bodyGeo = this._track(new THREE.CylinderGeometry(0.92, 0.92, 1.38, 72, 1, true));
    const bodyMat = this._track(new THREE.MeshPhysicalMaterial({
      map: this.sideTextures.map,
      emissive: 0xffffff,
      emissiveMap: this.sideTextures.emissiveMap,
      emissiveIntensity: 0.78,
      roughness: 0.16,
      metalness: 0.08,
      clearcoat: 0.92,
      clearcoatRoughness: 0.12,
    }));
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.73;
    this.cakeGroup.add(bodyMesh);

    // 圆润顶部流心肩部 + 七彩顶面（y = 1.42 .. 1.47）
    const topDiskGeo = this._track(new THREE.CylinderGeometry(0.87, 0.92, 0.06, 72));
    const topDiskMat = this._track(new THREE.MeshPhysicalMaterial({
      map: this.topTextures.map,
      emissive: 0xffffff,
      emissiveMap: this.topTextures.emissiveMap,
      emissiveIntensity: 0.72,
      roughness: 0.18,
      metalness: 0.06,
      clearcoat: 0.85,
      clearcoatRoughness: 0.14,
    }));
    const topDisk = new THREE.Mesh(topDiskGeo, topDiskMat);
    topDisk.position.y = 1.445;
    this.cakeGroup.add(topDisk);

    // 4. 蛋糕顶部 190 颗流光溢彩 3D 立体糖珠与闪烁彩色亮片（小而密集，堆叠在顶面和肩缘）
    const topPalette = [
      0xffe066, 0xff9f1c, 0xff6b9d, 0x38e8ff, 0x3b82f6, 0xc084fc, 0xff4d6d, 0xffffff, 0xfef08a,
    ];
    const pearlGeo = this._track(new THREE.SphereGeometry(1, 8, 8));
    const waferGeo = this._track(new THREE.CylinderGeometry(1, 1, 0.35, 8));

    for (let i = 0; i < 190; i += 1) {
      const col = topPalette[i % topPalette.length];
      const mat = this._track(new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: i % 3 === 0 ? 0.82 : 0.48,
        roughness: 0.18,
        metalness: 0.15,
      }));

      const useWafer = i % 3 === 1;
      const piece = new THREE.Mesh(useWafer ? waferGeo : pearlGeo, mat);
      const a = Math.random() * Math.PI * 2;
      // 避开中心放数字蜡烛的狭小区域（r < 0.24），密集分布在顶面及边缘肩部
      const r = i < 75 ? 0.62 + Math.random() * 0.29 : 0.22 + Math.random() * 0.56;
      const sz = 0.016 + Math.random() * 0.025;
      piece.scale.setScalar(sz);

      const shoulderDrop = r > 0.84 ? -(r - 0.84) * 0.45 : Math.random() * 0.018;
      piece.position.set(Math.cos(a) * r, 1.472 + shoulderDrop, Math.sin(a) * r);
      if (useWafer) {
        piece.rotation.set(Math.random() * 1.4, Math.random() * Math.PI, Math.random() * 1.4);
      }
      this.cakeGroup.add(piece);
    }

    // 贴合修长蛋糕筒身的微光亮片粒子
    const dustCount = 300;
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
      const r = 0.935 + Math.random() * 0.055;
      const y = 0.06 + Math.random() * 1.39;
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
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    this.cakeDust = new THREE.Points(dustGeo, dustMat);
    this.cakeGroup.add(this.cakeDust);
  }

  _buildDomeArcsAbovePlate() {
    // 严格位于白瓷盘上方（y >= 0.14）的半开放玻璃罩轮廓 + 若隐若现断断续续的多条细弧线
    this.domeArcMaterials = [];

    // 1. 极其克制的开放式罩顶外缘微光（裁剪在盘面之上，且中间通过正弦波打断，若隐若现）
    const domeGeo = this._track(new THREE.SphereGeometry(1.78, 64, 42, 0, Math.PI * 2, 0, Math.PI * 0.68));
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
          // 严格裁掉托盘下方部分，从盘面边缘淡入
          float plateFade = smoothstep(0.14, 0.36, vWorldY);
          float ndv = abs(dot(normalize(vNormal), normalize(vViewDir)));
          float rim = pow(1.0 - ndv, 18.0);

          // 断断续续的若隐若现衰减
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
    domeShell.position.y = 1.15;
    this.cakeGroup.add(domeShell);

    // 五条同心略错距的断续微光细圆弧：均从托盘上方拱起，不互相交叉打结
    const arcSpecs = [
      { radius: 1.75, centerY: 1.15, rotY: 0.15, tiltZ: 0.0, freq: 3.0, phase: 0.4, speed: 0.25, color: new THREE.Color(0xfff1d6), peakAlpha: 0.50 },
      { radius: 1.81, centerY: 1.14, rotY: 1.05, tiltZ: 0.0, freq: 4.0, phase: 1.8, speed: -0.20, color: new THREE.Color(0xdbeafe), peakAlpha: 0.40 },
      { radius: 1.86, centerY: 1.16, rotY: 2.18, tiltZ: 0.0, freq: 2.5, phase: 3.1, speed: 0.18, color: new THREE.Color(0xfef3c7), peakAlpha: 0.36 },
      { radius: 1.71, centerY: 1.13, rotY: -0.82, tiltZ: 0.0, freq: 3.5, phase: 4.5, speed: -0.22, color: new THREE.Color(0xe0f2fe), peakAlpha: 0.34 },
      { radius: 1.89, centerY: 1.17, rotY: 1.62, tiltZ: 0.0, freq: 3.0, phase: 5.4, speed: 0.16, color: new THREE.Color(0xffffff), peakAlpha: 0.30 },
    ];

    for (const spec of arcSpecs) {
      // 从托盘上方约 -0.56 rad 跨过顶峰到对面 +0.56 rad
      const pts = [];
      const segments = 56;
      const startTheta = -0.56;
      const endTheta = Math.PI + 0.56;
      for (let i = 0; i <= segments; i += 1) {
        const theta = startTheta + (i / segments) * (endTheta - startTheta);
        const x = Math.cos(theta) * spec.radius;
        const y = spec.centerY + Math.sin(theta) * spec.radius;
        pts.push(new THREE.Vector3(x, Math.max(0.14, y), 0));
      }

      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = this._track(new THREE.TubeGeometry(curve, 72, 0.0044, 6, false));

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
            // 两端接近托盘处柔顺渐隐
            float endFade = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x);
            // 多段断续的虚实呼吸效果
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
      mesh.rotation.z = spec.tiltZ;
      this.cakeGroup.add(mesh);
      this.domeArcMaterials.push(arcMat);
    }
  }

  _buildCandles() {
    this.candles = createAgeCandles(this.age);
    this.candles.root.position.set(0, 1.47, 0);
    this.cakeGroup.add(this.candles.root);
  }

  _buildSwirlParticles() {
    const richColors = [
      new THREE.Color(0xffe066), // 亮黄
      new THREE.Color(0xff9f1c), // 橙金
      new THREE.Color(0x38e8ff), // 电光青蓝
      new THREE.Color(0xff6b9d), // 樱花粉
      new THREE.Color(0xff4d6d), // 珊瑚红
      new THREE.Color(0xc084fc), // 星紫
      new THREE.Color(0xffffff), // 纯白
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

    // 5 层流光溢彩粒子：大散景亮斑 + 大主角五角星 + 中号彩色星星 + 蛋糕肩部溢出的细密彩金星雾 + 盘下微落星点
    this.heroBokeh = createSwirlLayer(32, this.dotTex, 0.24, 0.72, 0.85, 1.68, 0.20, 2.55);
    this.heroStars = createSwirlLayer(52, this.starTex, 0.30, 0.85, 0.70, 1.72, 0.16, 2.68);
    this.midStars = createSwirlLayer(140, this.starTex, 0.17, 1.05, 0.50, 1.66, 0.15, 2.62);
    this.candleMist = createSwirlLayer(320, this.dotTex, 0.085, 1.22, 0.18, 1.38, 1.25, 2.70);
    this.belowSparks = createSwirlLayer(36, this.starTex, 0.13, 0.55, 0.35, 1.45, -0.42, 0.04, -1);
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
        size: 0.16,
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
      new THREE.Vector3(-1.35, 2.75, -0.8),
      new THREE.Vector3(1.35, 2.85, -0.6),
      new THREE.Vector3(0.0, 3.3, -1.2),
      new THREE.Vector3(-1.05, 2.25, 0.5),
      new THREE.Vector3(1.1, 2.35, 0.4),
    ];

    this.fireworkBursts.forEach((burst, idx) => {
      const origin = origins[idx % origins.length];
      for (let i = 0; i < burst.count; i += 1) {
        burst.positions[i * 3] = origin.x;
        burst.positions[i * 3 + 1] = origin.y;
        burst.positions[i * 3 + 2] = origin.z;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 1.15 + Math.random() * 2.15;
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
    // 保证外缘弧线（半径 ~1.88）与纯白瓷盘在 390px 窄屏左右留白完整入画
    const fitPortraitDist = Math.min(13.5, Math.max(7.8, 2.04 / (halfTanY * Math.max(0.38, aspect))));

    if (this.state === 'wish') {
      this.targetCamOffset.set(0, isPortrait ? 2.55 : 2.15, isPortrait ? fitPortraitDist * 0.84 : 5.3);
      this.targetLookAt.set(0, isPortrait ? 0.95 : 1.02, 0);
    } else if (this.state === 'blown') {
      this.targetCamOffset.set(0, isPortrait ? 2.95 : 2.25, isPortrait ? fitPortraitDist * 1.04 : 7.0);
      this.targetLookAt.set(0, isPortrait ? 0.45 : 0.72, 0);
    } else {
      // 桌面端略微拉远并下移 lookAt，保证纯白瓷盘完整位于底部 "Happy birthday!" 文字上方
      this.targetCamOffset.set(0, isPortrait ? 2.78 : 2.15, isPortrait ? fitPortraitDist : 6.95);
      this.targetLookAt.set(0, isPortrait ? 0.44 : 0.64, 0);
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
    this.cakeDust.material.opacity = 0.82 * easePower;

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
