import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createClassicCandles, createAgeCandles } from './numerals.js';

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function createParticleDotTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.30, 'rgba(255, 255, 255, 0.88)');
  grad.addColorStop(0.66, 'rgba(255, 255, 255, 0.22)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 方形像素粒子贴图：营造梦幻像素粒子的清晰边角与柔光
function createPixelSquareTexture() {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const glow = ctx.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size * 0.48);
  glow.addColorStop(0.0, 'rgba(255, 255, 255, 0.78)');
  glow.addColorStop(0.55, 'rgba(255, 255, 255, 0.18)');
  glow.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
  ctx.fillRect(8, 8, 16, 16);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 尖锐精致的四角钻石星芒贴图，营造“亮晶晶”高珠宝级闪烁效果
function createDiamondGlintTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  const coreGlow = ctx.createRadialGradient(cx, cy, 1, cx, cy, size * 0.36);
  coreGlow.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  coreGlow.addColorStop(0.24, 'rgba(255, 244, 224, 0.72)');
  coreGlow.addColorStop(1.0, 'rgba(255, 225, 240, 0.0)');
  ctx.fillStyle = coreGlow;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const longR = size * 0.48;
  const innerR = size * 0.044;
  for (let i = 0; i < 8; i += 1) {
    const r = i % 2 === 0 ? longR : innerR;
    const a = (i * Math.PI) / 4;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
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

function createSoftRingTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, size * 0.18, cx, cy, size * 0.5);
  grad.addColorStop(0.0, 'rgba(255, 228, 158, 0.0)');
  grad.addColorStop(0.45, 'rgba(255, 228, 158, 0.52)');
  grad.addColorStop(0.66, 'rgba(255, 165, 210, 0.72)');
  grad.addColorStop(0.84, 'rgba(255, 228, 158, 0.18)');
  grad.addColorStop(1.0, 'rgba(255, 228, 158, 0.0)');
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

  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, size * 0.44);
  glow.addColorStop(0.0, 'rgba(255, 255, 255, 0.78)');
  glow.addColorStop(0.42, 'rgba(255, 255, 255, 0.16)');
  glow.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const outerR = size * 0.35;
  const innerR = size * 0.14;
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

// 华丽粉白像素粒子蛋糕侧面贴图（2048x512）：珠光粉白极光渐变 + 亮粉金紫菱星与像素格子
function createPinkWhitePixelSideTextures() {
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

  // 珠光奶白 -> 浪漫樱花粉 -> 华丽亮粉霞渐变
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0.0, '#fffbfd');
  bg.addColorStop(0.46, '#ffe0ee');
  bg.addColorStop(0.80, '#ff99cc');
  bg.addColorStop(1.0, '#ff6fb5');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ectx.fillStyle = '#000000';
  ectx.fillRect(0, 0, w, h);

  // 底部华丽亮粉霞光晕波浪
  const drawBottomAurora = (targetCtx, alphaScale) => {
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'screen';

    const baseBand = targetCtx.createLinearGradient(0, h * 0.62, 0, h);
    baseBand.addColorStop(0.0, 'rgba(255, 121, 190, 0.0)');
    baseBand.addColorStop(0.42, `rgba(255, 111, 181, ${0.42 * alphaScale})`);
    baseBand.addColorStop(0.80, `rgba(251, 207, 232, ${0.68 * alphaScale})`);
    baseBand.addColorStop(1.0, `rgba(255, 241, 248, ${0.84 * alphaScale})`);
    targetCtx.fillStyle = baseBand;
    targetCtx.fillRect(0, h * 0.62, w, h * 0.38);

    for (let i = 0; i < 20; i += 1) {
      const cx = (i / 20) * w + Math.sin(i * 2.1) * 36;
      const cy = h * (0.90 - (i % 3) * 0.05);
      const rx = 115 + (i % 4) * 38;
      const col = i % 3 === 0 ? '255, 111, 181' : i % 3 === 1 ? '251, 207, 232' : '243, 198, 255';

      for (const offsetX of [0, w, -w]) {
        const g = targetCtx.createRadialGradient(cx + offsetX, cy, 4, cx + offsetX, cy, rx);
        g.addColorStop(0.0, `rgba(${col}, ${0.52 * alphaScale})`);
        g.addColorStop(0.55, `rgba(${col}, ${0.22 * alphaScale})`);
        g.addColorStop(1.0, `rgba(${col}, 0.0)`);
        targetCtx.fillStyle = g;
        targetCtx.beginPath();
        targetCtx.arc(cx + offsetX, cy, rx, 0, Math.PI * 2);
        targetCtx.fill();
      }
    }
    targetCtx.restore();
  };

  drawBottomAurora(ctx, 0.92);
  drawBottomAurora(ectx, 0.52);

  // 微妙像素格子质感
  ctx.fillStyle = 'rgba(244, 114, 182, 0.05)';
  for (let gx = 0; gx < w; gx += 16) {
    ctx.fillRect(gx, 0, 1, h);
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  for (let gy = 0; gy < h; gy += 16) {
    ctx.fillRect(0, gy, w, 1);
  }

  // 散布绚丽像素方块与像素菱星（纯白 / 香槟金 / 亮樱粉 / 虹彩紫粉）
  const pixelPalette = ['#ffffff', '#fff1f5', '#ffe49e', '#ffd166', '#fbcfe8', '#ff79be', '#f3c6ff'];
  const snap = (v, step = 8) => Math.round(v / step) * step;

  for (let i = 0; i < 420; i += 1) {
    const px = snap(Math.random() * (w - 16), 8);
    const py = snap(16 + Math.random() * (h - 42), 8);
    const cell = i % 5 === 0 ? 7 : i % 2 === 0 ? 5 : 4;
    const col = pixelPalette[i % pixelPalette.length];
    const isBright = i % 2 === 0;

    ctx.fillStyle = col;
    ctx.globalAlpha = isBright ? 0.95 : 0.72;
    ctx.fillRect(px, py, cell, cell);

    if (i % 7 === 0) {
      ctx.fillRect(px - cell, py, cell * 3, cell);
      ctx.fillRect(px, py - cell, cell, cell * 3);
    }

    if (isBright) {
      ectx.fillStyle = col;
      ectx.globalAlpha = i % 7 === 0 ? 0.65 : 0.42;
      ectx.fillRect(px, py, cell, cell);
      if (i % 7 === 0) {
        ectx.fillRect(px - cell, py, cell * 3, cell);
        ectx.fillRect(px, py - cell, cell, cell * 3);
      }
    }
  }
  ctx.globalAlpha = 1;
  ectx.globalAlpha = 1;

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.colorSpace = THREE.SRGBColorSpace;

  return { map, emissiveMap };
}

// 粉白蛋糕上表面平滑顶盘贴图（1024x1024）：无坨坨，柔和樱粉白渐变 + 防过曝深莓粉清晰 "happy / birthday"
function createPinkWhitePixelTopTextures() {
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

  // 哑光柔缎感蜜桃樱花粉中心 -> 浅粉 -> 清透珠光白边缘（控光防过曝，保证字迹锐利）
  const grad = ctx.createRadialGradient(cx, cy, 24, cx, cy, size * 0.5);
  grad.addColorStop(0.0, '#f28ab8');
  grad.addColorStop(0.55, '#f7abc9');
  grad.addColorStop(0.84, '#ffd4e6');
  grad.addColorStop(1.0, '#fff0f6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // 顶盘底面严格黑底自发光，确保强星芒 Bloom 下字迹永不发白泛糊
  ectx.fillStyle = '#000000';
  ectx.fillRect(0, 0, size, size);

  // 外圈极细像素星点围边
  const pixelCols = ['#ffffff', '#fbcfe8', '#fde68a', '#ff79be'];
  for (let i = 0; i < 165; i += 1) {
    const a = (i / 165) * Math.PI * 2 + (Math.random() - 0.5) * 0.04;
    const r = size * (0.39 + Math.random() * 0.085);
    const x = Math.round((cx + Math.cos(a) * r) / 6) * 6;
    const y = Math.round((cy + Math.sin(a) * r) / 6) * 6;
    const sz = i % 3 === 0 ? 6 : 4;
    const col = pixelCols[i % pixelCols.length];

    ctx.fillStyle = col;
    ctx.globalAlpha = 0.88;
    ctx.fillRect(x, y, sz, sz);

    if (i % 2 === 0) {
      ectx.fillStyle = col;
      ectx.globalAlpha = 0.28;
      ectx.fillRect(x, y, sz, sz);
    }
  }
  ctx.globalAlpha = 1;
  ectx.globalAlpha = 1;

  const paintTopText = (targetCtx, isEmissive) => {
    targetCtx.save();
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';

    const drawWord = (text, yCenter, fontPx) => {
      targetCtx.save();
      targetCtx.translate(cx, yCenter);
      targetCtx.scale(1.0, 1.48);
      targetCtx.font = `italic 700 ${fontPx}px Georgia, "Times New Roman", serif`;

      if (!isEmissive) {
        targetCtx.lineWidth = 4;
        targetCtx.lineJoin = 'round';
        targetCtx.strokeStyle = 'rgba(255, 228, 242, 0.72)';
        targetCtx.strokeText(text, 0, 0);
        targetCtx.fillStyle = '#831843';
        targetCtx.fillText(text, 0, 0);
      } else {
        targetCtx.fillStyle = 'rgba(190, 24, 93, 0.08)';
        targetCtx.fillText(text, 0, 0);
      }
      targetCtx.restore();
    };

    drawWord('happy', 646, 108);
    drawWord('birthday', 796, 114);
    targetCtx.restore();
  };

  paintTopText(ctx, false);
  paintTopText(ectx, true);

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  const emissiveMap = new THREE.CanvasTexture(emissive);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  return { map, emissiveMap };
}

// 平底白色圆托盘贴图：珠光白瓷面 + 蛋糕正下方淡淡柔粉倒影
function createPinkGlowTrayTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  const grad = ctx.createRadialGradient(cx, cy, 24, cx, cy, size * 0.5);
  grad.addColorStop(0.0, '#ff85c0');
  grad.addColorStop(0.56, '#fbcfe8');
  grad.addColorStop(0.68, '#fff5f8');
  grad.addColorStop(0.82, '#ffffff');
  grad.addColorStop(1.0, '#fffaf8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 亮晶晶闪烁粒子 Custom Shader（支持逐粒子渐显 aReveal + 独立闪烁与绚丽高光）
function createTwinklePointsMaterial(texture, maxPointPx = 28.0, intensityBoost = 1.85) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uMap: { value: texture },
      uMaxPx: { value: maxPointPx },
      uBoost: { value: intensityBoost },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aPhase;
      attribute float aSpeed;
      attribute float aReveal;
      attribute vec3 aColor;

      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uMaxPx;

      varying vec3 vColor;
      varying float vTwinkle;
      varying float vReveal;

      void main() {
        vColor = aColor;
        vReveal = aReveal;
        float wave = 0.5 + 0.5 * sin(uTime * aSpeed + aPhase);
        vTwinkle = 0.30 + 0.70 * pow(wave, 2.4);

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float revealScale = mix(0.32, 1.0, clamp(aReveal, 0.0, 1.0));
        float rawSize = aSize * revealScale * uPixelRatio * (750.0 / max(1.5, -mvPosition.z)) * (0.72 + 0.58 * vTwinkle);
        gl_PointSize = min(rawSize, uMaxPx * uPixelRatio);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uOpacity;
      uniform float uBoost;

      varying vec3 vColor;
      varying float vTwinkle;
      varying float vReveal;

      void main() {
        if (vReveal < 0.01) discard;
        vec4 tex = texture2D(uMap, gl_PointCoord);
        float alpha = tex.a * vTwinkle * uOpacity * vReveal;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(vColor * tex.rgb * (uBoost + 1.05 * vTwinkle), alpha);
      }
    `,
  });
}

export class BirthdayScene {
  constructor(container, { candleStyle = 'classic', age = 18, onFlameTap = null } = {}) {
    this.container = container;
    this.candleStyle = candleStyle;
    this.age = age;
    this.onFlameTap = onFlameTap;

    this.state = 'intro';
    this.blowIntensity = 0;
    this.lightProgress = 0;
    this.igniteElapsed = 0;
    this.elapsed = 0;
    this.disposed = false;
    this.extraDisposables = [];

    this.dotTex = createParticleDotTexture();
    this.pixelTex = createPixelSquareTexture();
    this.glintTex = createDiamondGlintTexture();
    this.starTex = createFivePointStarTexture();
    this.softRingTex = createSoftRingTexture();
    this.sideTextures = createPinkWhitePixelSideTextures();
    this.topTextures = createPinkWhitePixelTopTextures();
    this.trayTex = createPinkGlowTrayTexture();

    this._initRenderer();
    this._initScene();
    this._initPostProcessing();
    this._buildBackdropStars();
    this._buildFlatTrayAndPinkPixelCake();
    this._buildWideAiryArchAbove();
    this._buildCandles();
    this._buildSpiralRibbons();
    this._buildIgnitionSparklerBurst();
    this._buildFreeSparkles();
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
    this.scene.background = new THREE.Color(0x05040b);
    this.scene.fog = new THREE.FogExp2(0x05040b, 0.02);

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 70);
    this.camera.position.set(0, 2.75, 7.2);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 3.8;
    this.controls.maxDistance = 18.0;
    this.controls.minPolarAngle = Math.PI * 0.20;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.42;

    this.userDragging = false;
    this.controls.addEventListener('start', () => {
      this.userDragging = true;
    });
    this.controls.addEventListener('end', () => {
      this.userDragging = false;
    });

    this.ambient = new THREE.AmbientLight(0xfff0f5, 0.78);
    this.scene.add(this.ambient);

    this.keyLight = new THREE.DirectionalLight(0xfffaf0, 1.02);
    this.keyLight.position.set(3.2, 4.8, 3.8);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0xffb8d9, 0.90);
    this.rimLight.position.set(-3.4, 3.6, -2.8);
    this.scene.add(this.rimLight);

    this.cakeGroup = new THREE.Group();
    this.scene.add(this.cakeGroup);

    this.targetCamOffset = new THREE.Vector3(0, 2.75, 7.2);
    this.targetLookAt = new THREE.Vector3(0, 0.85, 0);
    this.camTransition = 0;
  }

  _initPostProcessing() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // 提升高珠宝级星芒与彩带光晕，同时顶面保持哑光防过曝
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.54,
      0.48,
      0.74
    );
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
  }

  _buildBackdropStars() {
    const count = 170;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xfde68a),
      new THREE.Color(0xfbcfe8),
      new THREE.Color(0xf3c6ff),
    ];

    for (let i = 0; i < count; i += 1) {
      const r = 13 + Math.random() * 14;
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
      size: 0.055,
      map: this.dotTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    this.bgStars = new THREE.Points(geo, mat);
    this.scene.add(this.bgStars);
  }

  _buildFlatTrayAndPinkPixelCake() {
    // 1. 扁平珠光白圆托盘（带淡淡柔粉倒影 + 细香槟金镶边 + 华丽柔金边缘光环）
    const trayGeo = this._track(new THREE.CylinderGeometry(1.30, 1.28, 0.032, 72));
    const trayMat = this._track(new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: this.trayTex,
      emissive: 0xffe4ef,
      emissiveMap: this.trayTex,
      emissiveIntensity: 0.14,
      roughness: 0.22,
      metalness: 0.04,
      clearcoat: 0.72,
      clearcoatRoughness: 0.14,
    }));
    this.tray = new THREE.Mesh(trayGeo, trayMat);
    this.tray.position.y = 0.016;
    this.cakeGroup.add(this.tray);

    const trayRimGeo = this._track(new THREE.TorusGeometry(1.30, 0.011, 10, 84));
    const goldMat = this._track(new THREE.MeshStandardMaterial({
      color: 0xf5d08a,
      emissive: 0x6b4c14,
      emissiveIntensity: 0.26,
      metalness: 0.75,
      roughness: 0.22,
    }));
    const trayRim = new THREE.Mesh(trayRimGeo, goldMat);
    trayRim.rotation.x = Math.PI / 2;
    trayRim.position.y = 0.024;
    this.cakeGroup.add(trayRim);

    const trayHaloGeo = this._track(new THREE.TorusGeometry(1.305, 0.016, 10, 84));
    this.trayHaloMat = this._track(new THREE.MeshBasicMaterial({
      color: 0xfde68a,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
    }));
    const trayHalo = new THREE.Mesh(trayHaloGeo, this.trayHaloMat);
    trayHalo.rotation.x = Math.PI / 2;
    trayHalo.position.y = 0.026;
    this.cakeGroup.add(trayHalo);

    // 蛋糕底部亮樱花粉微光环
    const baseGlowGeo = this._track(new THREE.TorusGeometry(0.825, 0.015, 10, 72));
    this.baseGlowMat = this._track(new THREE.MeshBasicMaterial({
      color: 0xff85c0,
      transparent: true,
      opacity: 0.46,
      blending: THREE.AdditiveBlending,
    }));
    const baseGlowRing = new THREE.Mesh(baseGlowGeo, this.baseGlowMat);
    baseGlowRing.rotation.x = Math.PI / 2;
    baseGlowRing.position.y = 0.034;
    this.cakeGroup.add(baseGlowRing);

    // 2. 暖玫粉内芯 + 华丽粉白微透像素粒子蛋糕筒身
    const innerCoreGeo = this._track(new THREE.CylinderGeometry(0.76, 0.76, 0.80, 48));
    const innerCoreMat = this._track(new THREE.MeshStandardMaterial({
      color: 0xa63a6c,
      emissive: 0xd4558f,
      emissiveIntensity: 0.34,
      roughness: 0.52,
    }));
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    innerCore.position.y = 0.445;
    this.cakeGroup.add(innerCore);

    const bodyGeo = this._track(new THREE.CylinderGeometry(0.80, 0.80, 0.84, 72, 1, true));
    const bodyMat = this._track(new THREE.MeshPhysicalMaterial({
      map: this.sideTextures.map,
      emissive: 0xffffff,
      emissiveMap: this.sideTextures.emissiveMap,
      emissiveIntensity: 0.68,
      transparent: true,
      opacity: 0.90,
      roughness: 0.24,
      metalness: 0.05,
      clearcoat: 0.60,
      clearcoatRoughness: 0.16,
    }));
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.452;
    this.cakeGroup.add(bodyMesh);

    // 平滑无坨坨的蛋糕顶部基底 + 哑光防过曝字盘
    const topRimGeo = this._track(new THREE.CylinderGeometry(0.79, 0.80, 0.036, 72));
    const topRimMat = this._track(new THREE.MeshPhysicalMaterial({
      color: 0xf9a8d4,
      emissive: 0xf472b6,
      emissiveIntensity: 0.22,
      roughness: 0.28,
      clearcoat: 0.42,
    }));
    const topRimDisk = new THREE.Mesh(topRimGeo, topRimMat);
    topRimDisk.position.y = 0.875;
    this.cakeGroup.add(topRimDisk);

    const topFaceGeo = this._track(new THREE.CircleGeometry(0.792, 72));
    const topFaceMat = this._track(new THREE.MeshPhysicalMaterial({
      map: this.topTextures.map,
      emissive: 0xffffff,
      emissiveMap: this.topTextures.emissiveMap,
      emissiveIntensity: 0.14,
      roughness: 0.48,
      metalness: 0.02,
      clearcoat: 0.08,
      clearcoatRoughness: 0.34,
    }));
    const topFace = new THREE.Mesh(topFaceGeo, topFaceMat);
    topFace.rotation.x = -Math.PI / 2;
    topFace.position.y = 0.896;
    this.cakeGroup.add(topFace);

    // 3. 蛋糕底座一圈紧贴相连、统一珠光白的珍珠围边（完全连成一体）
    const pearlMat = this._track(new THREE.MeshPhysicalMaterial({
      color: 0xfff8fb,
      emissive: 0xffd6e7,
      emissiveIntensity: 0.16,
      roughness: 0.20,
      metalness: 0.06,
      clearcoat: 0.72,
    }));

    const cordGeo = this._track(new THREE.TorusGeometry(0.812, 0.017, 12, 96));
    const cordMesh = new THREE.Mesh(cordGeo, pearlMat);
    cordMesh.rotation.x = Math.PI / 2;
    cordMesh.position.y = 0.048;
    this.cakeGroup.add(cordMesh);

    const basePearlGeo = this._track(new THREE.SphereGeometry(0.028, 12, 10));
    const basePearlCount = 96;
    for (let i = 0; i < basePearlCount; i += 1) {
      const a = (i / basePearlCount) * Math.PI * 2;
      const pearl = new THREE.Mesh(basePearlGeo, pearlMat);
      pearl.position.set(Math.cos(a) * 0.814, 0.050, Math.sin(a) * 0.814);
      this.cakeGroup.add(pearl);
    }

    // 4A. 3D 环绕蛋糕筒身与肩缘的像素粒子星海
    const pixelCount = 1150;
    const pPos = new Float32Array(pixelCount * 3);
    const pCol = new Float32Array(pixelCount * 3);
    const pSizes = new Float32Array(pixelCount);
    const pPhases = new Float32Array(pixelCount);
    const pSpeeds = new Float32Array(pixelCount);
    const pReveal = new Float32Array(pixelCount).fill(1.0);

    const pPalette = [
      new THREE.Color(0xffffff), // 纯白
      new THREE.Color(0xfff5f8), // 珍珠白
      new THREE.Color(0xfbcfe8), // 淡樱粉
      new THREE.Color(0xff79be), // 亮樱粉
      new THREE.Color(0xf3c6ff), // 虹彩紫粉
      new THREE.Color(0xffe49e), // 香槟金
    ];

    for (let i = 0; i < pixelCount; i += 1) {
      const a = Math.random() * Math.PI * 2;
      if (i < 900) {
        const r = 0.806 + Math.random() * 0.024;
        const y = 0.06 + Math.random() * 0.825;
        pPos[i * 3] = Math.cos(a) * r;
        pPos[i * 3 + 1] = y;
        pPos[i * 3 + 2] = Math.sin(a) * r;
      } else {
        const r = 0.77 + Math.random() * 0.045;
        const y = 0.885 + Math.random() * 0.018;
        pPos[i * 3] = Math.cos(a) * r;
        pPos[i * 3 + 1] = y;
        pPos[i * 3 + 2] = Math.sin(a) * r;
      }

      const c = pPalette[i % pPalette.length];
      pCol[i * 3] = c.r;
      pCol[i * 3 + 1] = c.g;
      pCol[i * 3 + 2] = c.b;
      pSizes[i] = (0.038 + Math.random() * 0.046) * (i % 12 === 0 ? 1.35 : 1.0);
      pPhases[i] = Math.random() * Math.PI * 2;
      pSpeeds[i] = 1.6 + Math.random() * 3.0;
    }

    const pGeo = this._track(new THREE.BufferGeometry());
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('aColor', new THREE.BufferAttribute(pCol, 3));
    pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSizes, 1));
    pGeo.setAttribute('aPhase', new THREE.BufferAttribute(pPhases, 1));
    pGeo.setAttribute('aSpeed', new THREE.BufferAttribute(pSpeeds, 1));
    pGeo.setAttribute('aReveal', new THREE.BufferAttribute(pReveal, 1));

    this.cakePixelMat = this._track(createTwinklePointsMaterial(this.pixelTex, 16.0, 1.75));
    this.cakePixelMat.uniforms.uOpacity.value = 0.62;
    this.cakePixelShell = new THREE.Points(pGeo, this.cakePixelMat);
    this.cakeGroup.add(this.cakePixelShell);

    // 4B. 碎钻星芒微镶层（240 颗高光四角菱钻点缀筒身、肩缘及底部珍珠带，打造华丽碎钻闪烁感）
    const flareCount = 240;
    const fPos = new Float32Array(flareCount * 3);
    const fCol = new Float32Array(flareCount * 3);
    const fSizes = new Float32Array(flareCount);
    const fPhases = new Float32Array(flareCount);
    const fSpeeds = new Float32Array(flareCount);
    const fReveal = new Float32Array(flareCount).fill(1.0);

    const flareColors = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xffe49e),
      new THREE.Color(0xff99cc),
      new THREE.Color(0xfbcfe8),
    ];

    for (let i = 0; i < flareCount; i += 1) {
      const a = Math.random() * Math.PI * 2;
      let r;
      let y;
      if (i < 150) {
        r = 0.812 + Math.random() * 0.025;
        y = 0.08 + Math.random() * 0.79;
      } else if (i < 205) {
        r = 0.79 + Math.random() * 0.032;
        y = 0.892 + Math.random() * 0.015;
      } else {
        // 环绕底部珍珠带的高光碎钻
        r = 0.836 + Math.random() * 0.016;
        y = 0.048 + Math.random() * 0.018;
      }

      fPos[i * 3] = Math.cos(a) * r;
      fPos[i * 3 + 1] = y;
      fPos[i * 3 + 2] = Math.sin(a) * r;

      const c = flareColors[i % flareColors.length];
      fCol[i * 3] = c.r;
      fCol[i * 3 + 1] = c.g;
      fCol[i * 3 + 2] = c.b;

      fSizes[i] = 0.048 + Math.random() * 0.056;
      // 带绕筒身扫掠的波浪闪烁相位
      fPhases[i] = a * 2.0 + Math.random() * 1.4;
      fSpeeds[i] = 2.6 + Math.random() * 3.4;
    }

    const fGeo = this._track(new THREE.BufferGeometry());
    fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
    fGeo.setAttribute('aColor', new THREE.BufferAttribute(fCol, 3));
    fGeo.setAttribute('aSize', new THREE.BufferAttribute(fSizes, 1));
    fGeo.setAttribute('aPhase', new THREE.BufferAttribute(fPhases, 1));
    fGeo.setAttribute('aSpeed', new THREE.BufferAttribute(fSpeeds, 1));
    fGeo.setAttribute('aReveal', new THREE.BufferAttribute(fReveal, 1));

    this.cakeFlareMat = this._track(createTwinklePointsMaterial(this.glintTex, 18.0, 2.2));
    this.cakeFlareMat.uniforms.uOpacity.value = 0.42;
    this.cakeDiamondFlares = new THREE.Points(fGeo, this.cakeFlareMat);
    this.cakeGroup.add(this.cakeDiamondFlares);
  }

  _buildWideAiryArchAbove() {
    // 5 道点亮后自下而上流淌显现的断续微光弧线（已彻底移除球形玻璃罩外壳）
    this.domeArcMaterials = [];
    this.domeArcMeshes = [];

    const arcSpecs = [
      { radius: 2.16, centerY: 1.44, rotY: 0.12, tiltZ: 0.08, freq: 3.5, phase: 0.3, speed: 0.24, color: new THREE.Color(0xffe49e), peakAlpha: 0.78 },
      { radius: 2.24, centerY: 1.46, rotY: 0.92, tiltZ: -0.07, freq: 4.0, phase: 1.7, speed: -0.20, color: new THREE.Color(0xfff1f5), peakAlpha: 0.66 },
      { radius: 2.30, centerY: 1.45, rotY: 1.85, tiltZ: 0.06, freq: 3.0, phase: 3.1, speed: 0.18, color: new THREE.Color(0xfbcfe8), peakAlpha: 0.60 },
      { radius: 2.36, centerY: 1.47, rotY: 2.58, tiltZ: -0.09, freq: 3.5, phase: 4.5, speed: -0.22, color: new THREE.Color(0xfde68a), peakAlpha: 0.56 },
      { radius: 2.42, centerY: 1.45, rotY: -0.65, tiltZ: 0.05, freq: 3.0, phase: 5.4, speed: 0.16, color: new THREE.Color(0xffffff), peakAlpha: 0.50 },
    ];

    for (const spec of arcSpecs) {
      const pts = [];
      const segments = 64;
      const startTheta = -0.52;
      const endTheta = Math.PI + 0.52;
      for (let i = 0; i <= segments; i += 1) {
        const theta = startTheta + (i / segments) * (endTheta - startTheta);
        const x = Math.cos(theta) * spec.radius;
        const y = spec.centerY + Math.sin(theta) * spec.radius;
        pts.push(new THREE.Vector3(x, Math.max(0.18, y), 0));
      }

      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = this._track(new THREE.TubeGeometry(curve, 80, 0.0058, 6, false));

      const arcMat = this._track(new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uReveal: { value: 0 },
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
          uniform float uReveal;
          uniform float uFreq;
          uniform float uPhase;
          uniform float uSpeed;
          uniform vec3 uColor;
          uniform float uPeak;
          varying vec2 vUv;
          void main() {
            float endFade = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
            float distFromEnd = min(vUv.x, 1.0 - vUv.x) * 2.0;
            float archSweep = 1.0 - smoothstep(uReveal * 1.18 - 0.18, uReveal * 1.18 + 0.02, distFromEnd);
            float dash = sin(vUv.x * 6.28318 * uFreq + uPhase + uTime * uSpeed);
            float broken = smoothstep(0.08, 0.65, dash);
            float shimmer = 0.78 + 0.22 * sin(uTime * 1.9 + uPhase);
            float alpha = endFade * archSweep * broken * uPeak * shimmer * uOpacity;
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
      }));

      const mesh = new THREE.Mesh(tubeGeo, arcMat);
      mesh.rotation.y = spec.rotY;
      mesh.rotation.z = spec.tiltZ;
      mesh.visible = false;
      this.cakeGroup.add(mesh);
      this.domeArcMaterials.push(arcMat);
      this.domeArcMeshes.push(mesh);
    }
  }

  _buildCandles() {
    this.candles = this.candleStyle === 'number'
      ? createAgeCandles(this.age)
      : createClassicCandles();
    this.candles.root.position.set(0, 0.896, 0);
    this.cakeGroup.add(this.candles.root);
  }

  // 双螺旋星光彩带：点蜡烛后由托盘旋转盘绕而起，似丝带般舞动升空
  _buildSpiralRibbons() {
    const count = 360;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    const reveals = new Float32Array(count);
    const meta = [];

    const ribbonColors = [
      new THREE.Color(0xffe49e), // 香槟金
      new THREE.Color(0xffffff), // 钻石白
      new THREE.Color(0xff79be), // 亮樱粉
      new THREE.Color(0xfbcfe8), // 柔淡粉
      new THREE.Color(0xf3c6ff), // 虹彩粉紫
    ];

    for (let i = 0; i < count; i += 1) {
      const arm = i % 2;
      const u = Math.floor(i / 2) / (count / 2); // 0 (底) .. 1 (顶)
      const jitterR = (Math.random() - 0.5) * 0.14;
      const jitterY = (Math.random() - 0.5) * 0.10;
      const jitterA = (Math.random() - 0.5) * 0.18;

      const c = ribbonColors[i % ribbonColors.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = i % 5 === 0 ? 0.115 + Math.random() * 0.045 : 0.055 + Math.random() * 0.045;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 2.4 + Math.random() * 3.0;
      reveals[i] = 0;

      meta.push({ arm, u, jitterR, jitterY, jitterA });
    }

    const geo = this._track(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aReveal', new THREE.BufferAttribute(reveals, 1));

    const mat = this._track(createTwinklePointsMaterial(this.glintTex, 22.0, 2.0));
    const points = new THREE.Points(geo, mat);
    points.visible = false;
    this.cakeGroup.add(points);

    this.spiralRibbon = { points, geo, mat, meta, count };
  }

  // 点蜡烛瞬间的烟花泉涌爆破与金色扩散光环
  _buildIgnitionSparklerBurst() {
    const count = 210;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    const reveals = new Float32Array(count);
    const velocities = [];

    const burstColors = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xffe49e),
      new THREE.Color(0xff79be),
      new THREE.Color(0xfbcfe8),
      new THREE.Color(0xf3c6ff),
    ];

    for (let i = 0; i < count; i += 1) {
      const c = burstColors[i % burstColors.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 0.065 + Math.random() * 0.085;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 3.2 + Math.random() * 3.8;
      reveals[i] = 0;
      velocities.push({ x: 0, y: 0, z: 0, life: 1.9, delay: 0 });
    }

    const geo = this._track(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aReveal', new THREE.BufferAttribute(reveals, 1));

    const mat = this._track(createTwinklePointsMaterial(this.glintTex, 24.0, 2.25));
    const points = new THREE.Points(geo, mat);
    points.visible = false;
    this.cakeGroup.add(points);

    this.igniteBurst = { points, geo, mat, velocities, count, active: false };

    // 蛋糕顶面绽放出的羽化粉金扩散光波
    const ringGeo = this._track(new THREE.PlaneGeometry(0.72, 0.72));
    const ringMat = this._track(new THREE.MeshBasicMaterial({
      map: this.softRingTex,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.915;
    ringMesh.visible = false;
    this.cakeGroup.add(ringMesh);
    this.ignitePulseRing = { mesh: ringMesh, mat: ringMat };
  }

  _triggerIgnitionChoreography() {
    this.igniteElapsed = 0;

    // 从烛火处向上向四周螺旋喷涌的烟花星芒
    const b = this.igniteBurst;
    const pos = b.geo.attributes.position.array;
    const rev = b.geo.attributes.aReveal.array;

    for (let i = 0; i < b.count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const radialSpeed = 0.55 + Math.random() * 2.05;
      const upSpeed = 1.25 + Math.random() * 2.05;
      const swirlTangent = 0.75 + Math.random() * 0.65;

      pos[i * 3] = Math.cos(a) * 0.04;
      pos[i * 3 + 1] = 1.48;
      pos[i * 3 + 2] = Math.sin(a) * 0.04;
      rev[i] = 0;

      b.velocities[i].x = Math.cos(a) * radialSpeed - Math.sin(a) * swirlTangent;
      b.velocities[i].y = upSpeed;
      b.velocities[i].z = Math.sin(a) * radialSpeed + Math.cos(a) * swirlTangent;
      b.velocities[i].life = 1.65 + Math.random() * 0.65;
      b.velocities[i].delay = Math.random() * 0.22;
    }
    b.geo.attributes.position.needsUpdate = true;
    b.geo.attributes.aReveal.needsUpdate = true;
    b.active = true;
    b.points.visible = true;

    this.ignitePulseRing.mesh.visible = true;
    this.ignitePulseRing.mesh.scale.setScalar(1);
    this.ignitePulseRing.mat.opacity = 0.82;
  }

  _buildFreeSparkles() {
    // 点蜡烛后从蛋糕旋转泉涌散开至全屏的精致闪烁星海
    const palette = [
      new THREE.Color(0xffffff), // 钻石白
      new THREE.Color(0xfff5f8), // 珍珠白
      new THREE.Color(0xffe49e), // 亮香槟金
      new THREE.Color(0xfbcfe8), // 淡樱粉
      new THREE.Color(0xff79be), // 亮樱粉
      new THREE.Color(0xf3c6ff), // 虹彩紫粉
    ];

    const createLayer = ({ count, tex, sizeMin, sizeMax, speedMin, speedMax, bounds, riseSpeedRange, maxPx = 28.0, boost = 1.9, onCakeOnly = false }) => {
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      const phases = new Float32Array(count);
      const speeds = new Float32Array(count);
      const reveals = new Float32Array(count);
      const meta = [];

      for (let i = 0; i < count; i += 1) {
        let homeX;
        let homeY;
        let homeZ;
        if (onCakeOnly) {
          const a = Math.random() * Math.PI * 2;
          const r = 0.35 + Math.random() * 0.68;
          homeX = Math.cos(a) * r;
          homeY = 0.12 + Math.random() * 0.96;
          homeZ = Math.sin(a) * r;
        } else {
          homeX = bounds.xMin + Math.random() * (bounds.xMax - bounds.xMin);
          homeY = bounds.yMin + Math.random() * (bounds.yMax - bounds.yMin);
          homeZ = bounds.zMin + Math.random() * (bounds.zMax - bounds.zMin);
        }

        const homeR = Math.hypot(homeX, homeZ);
        const homeAngle = Math.atan2(homeZ, homeX);
        const startA = homeAngle - (2.2 + Math.random() * 2.0);
        const startR = onCakeOnly ? 0.14 : 0.18 + Math.random() * 0.65;
        const startY = onCakeOnly ? 0.10 + Math.random() * 0.78 : 0.14 + Math.random() * 1.25;

        positions[i * 3] = Math.cos(startA) * startR;
        positions[i * 3 + 1] = startY;
        positions[i * 3 + 2] = Math.sin(startA) * startR;

        const c = palette[Math.floor(Math.random() * palette.length)];
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;

        sizes[i] = sizeMin + Math.random() * (sizeMax - sizeMin);
        phases[i] = Math.random() * Math.PI * 2;
        speeds[i] = speedMin + Math.random() * (speedMax - speedMin);
        reveals[i] = 0;

        // 靠近蛋糕中心/下方先散开，外围顺势接力绽放
        const distNorm = clamp(homeR / 3.8, 0, 1);
        const delay = onCakeOnly
          ? Math.random() * 0.55
          : 0.04 + distNorm * 0.52 + Math.random() * 0.32;

        meta.push({
          homeX,
          homeZ,
          homeY,
          homeR,
          homeAngle,
          startR,
          startY,
          swirlTwist: 2.2 + Math.random() * 2.2,
          delay,
          bloomDur: onCakeOnly ? 1.15 : 1.55 + Math.random() * 0.35,
          y: homeY,
          riseSpeed: riseSpeedRange[0] + Math.random() * (riseSpeedRange[1] - riseSpeedRange[0]),
          driftFreq: 0.45 + Math.random() * 0.9,
          driftAmp: onCakeOnly ? 0.02 : 0.08 + Math.random() * 0.14,
          phase: phases[i],
        });
      }

      const geo = this._track(new THREE.BufferGeometry());
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
      geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
      geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
      geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
      geo.setAttribute('aReveal', new THREE.BufferAttribute(reveals, 1));

      const mat = this._track(createTwinklePointsMaterial(tex, maxPx, boost));
      const points = new THREE.Points(geo, mat);
      points.visible = false;
      this.scene.add(points);

      return { points, geo, mat, meta, count, bounds, onCakeOnly };
    };

    const fullBounds = { xMin: -3.5, xMax: 3.5, yMin: -1.35, yMax: 4.5, zMin: -2.6, zMax: 2.4 };

    // 1. 高闪钻石四角星芒
    this.diamondGlints = createLayer({
      count: 190,
      tex: this.glintTex,
      sizeMin: 0.082,
      sizeMax: 0.172,
      speedMin: 2.4,
      speedMax: 5.0,
      bounds: fullBounds,
      riseSpeedRange: [0.08, 0.22],
      maxPx: 28.0,
      boost: 2.15,
    });

    // 2. 珠光粉金细腻光点
    this.blushBokeh = createLayer({
      count: 135,
      tex: this.dotTex,
      sizeMin: 0.052,
      sizeMax: 0.118,
      speedMin: 1.6,
      speedMax: 3.4,
      bounds: fullBounds,
      riseSpeedRange: [0.06, 0.18],
      maxPx: 20.0,
      boost: 1.85,
    });

    // 3. 精细梦幻星尘微粒
    this.microStardust = createLayer({
      count: 320,
      tex: this.starTex,
      sizeMin: 0.032,
      sizeMax: 0.072,
      speedMin: 2.6,
      speedMax: 5.6,
      bounds: fullBounds,
      riseSpeedRange: [0.14, 0.34],
      maxPx: 14.0,
      boost: 1.95,
    });

    // 4. 环绕蛋糕飞舞的高光星芒（点亮后随蛋糕旋转绽放）
    this.crownShimmers = createLayer({
      count: 95,
      tex: this.glintTex,
      sizeMin: 0.048,
      sizeMax: 0.095,
      speedMin: 2.6,
      speedMax: 5.2,
      bounds: fullBounds,
      riseSpeedRange: [0.0, 0.02],
      maxPx: 18.0,
      boost: 2.2,
      onCakeOnly: true,
    });
    this.scene.remove(this.crownShimmers.points);
    this.cakeGroup.add(this.crownShimmers.points);

    this.sparkleLayers = [this.diamondGlints, this.blushBokeh, this.microStardust, this.crownShimmers];
  }

  _buildFireworks() {
    this.fireworkBursts = [];
    const burstCount = 5;
    const perBurst = 120;
    const colors = [0xffffff, 0xffe49e, 0xff79be, 0xfbcfe8, 0xf3c6ff, 0xffd166];

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
        size: 0.13,
        map: this.glintTex,
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
      new THREE.Vector3(-1.45, 2.75, -0.8),
      new THREE.Vector3(1.45, 2.85, -0.6),
      new THREE.Vector3(0.0, 3.35, -1.1),
      new THREE.Vector3(-1.1, 2.2, 0.5),
      new THREE.Vector3(1.1, 2.3, 0.4),
    ];

    this.fireworkBursts.forEach((burst, idx) => {
      const origin = origins[idx % origins.length];
      for (let i = 0; i < burst.count; i += 1) {
        burst.positions[i * 3] = origin.x;
        burst.positions[i * 3 + 1] = origin.y;
        burst.positions[i * 3 + 2] = origin.z;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 1.15 + Math.random() * 2.1;
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
      const pr = Math.min(window.devicePixelRatio || 1, 2);
      if (this.cakePixelMat) this.cakePixelMat.uniforms.uPixelRatio.value = pr;
      if (this.cakeFlareMat) this.cakeFlareMat.uniforms.uPixelRatio.value = pr;
      if (this.spiralRibbon) this.spiralRibbon.mat.uniforms.uPixelRatio.value = pr;
      if (this.igniteBurst) this.igniteBurst.mat.uniforms.uPixelRatio.value = pr;
      for (const layer of this.sparkleLayers) {
        layer.mat.uniforms.uPixelRatio.value = pr;
      }
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
    const fitPortraitDist = Math.min(16.0, Math.max(9.2, 2.48 / (halfTanY * Math.max(0.38, aspect))));

    if (this.state === 'wish') {
      this.targetCamOffset.set(0, isPortrait ? 4.35 : 3.55, isPortrait ? fitPortraitDist * 0.72 : 5.6);
      this.targetLookAt.set(0, isPortrait ? 0.68 : 0.98, 0);
    } else if (this.state === 'blown') {
      this.targetCamOffset.set(0, isPortrait ? 5.15 : 4.15, isPortrait ? fitPortraitDist * 0.96 : 8.6);
      this.targetLookAt.set(0, isPortrait ? 0.44 : 0.96, 0);
    } else {
      // 约 27° 经典甜品俯视角，既展示完整立体蛋糕体，又让顶面 "happy / birthday" 清晰可读
      this.targetCamOffset.set(0, isPortrait ? 5.65 : 4.55, isPortrait ? fitPortraitDist * 0.90 : 7.8);
      this.targetLookAt.set(0, isPortrait ? 0.46 : 0.86, 0);
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
    this.lightProgress = 0.01;
    this.candles.ignite();
    this._triggerIgnitionChoreography();
    this._updateCameraFraming();
  }

  enterWishMode() {
    if (this.state === 'blown') {
      this.candles.ignite();
      this._triggerIgnitionChoreography();
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
    this._triggerIgnitionChoreography();
    this._updateCameraFraming();
  }

  setBlowIntensity(val) {
    this.blowIntensity = Math.min(1, Math.max(0, val));
  }

  _updateSpiralRibbons() {
    const rb = this.spiralRibbon;
    const active = this.state !== 'intro' && this.igniteElapsed > 0.01;
    rb.points.visible = active;
    if (!active) return;

    rb.mat.uniforms.uTime.value = this.elapsed;
    rb.mat.uniforms.uOpacity.value = this.state === 'blown' ? 0.48 : 0.92;

    const pos = rb.geo.attributes.position.array;
    const rev = rb.geo.attributes.aReveal.array;

    // 彩带从底座盘旋扫掠至外罩顶端的渐显前沿
    const revealFront = clamp((this.igniteElapsed - 0.04) / 1.55, 0, 1);

    for (let i = 0; i < rb.count; i += 1) {
      const m = rb.meta[i];
      // 持续沿着螺旋线缓缓向上流动，并通过两端渐隐包络消除循环接缝
      const flowU = (m.u + this.igniteElapsed * 0.075) % 1.0;
      const radius = 0.88 + Math.pow(flowU, 0.78) * 1.24 + m.jitterR;
      const angle = m.arm * Math.PI + flowU * Math.PI * 4.8 + this.igniteElapsed * 0.55 + m.jitterA;
      const y = 0.06 + flowU * 2.86 + m.jitterY;

      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      const sweepMask = smoothstep(m.u - 0.14, m.u + 0.02, revealFront * 1.16);
      const endEnvelope = Math.sin(flowU * Math.PI);
      rev[i] = sweepMask * clamp(endEnvelope * 1.45, 0, 1);
    }

    rb.geo.attributes.position.needsUpdate = true;
    rb.geo.attributes.aReveal.needsUpdate = true;
  }

  _updateIgnitionBurst(dt) {
    const b = this.igniteBurst;
    if (!b.active) return;

    b.mat.uniforms.uTime.value = this.elapsed;
    b.mat.uniforms.uOpacity.value = 1.0;

    const pos = b.geo.attributes.position.array;
    const rev = b.geo.attributes.aReveal.array;
    let aliveCount = 0;

    for (let i = 0; i < b.count; i += 1) {
      const v = b.velocities[i];
      const age = this.igniteElapsed - v.delay;
      if (age < 0) {
        rev[i] = 0;
        aliveCount += 1;
        continue;
      }
      if (age >= v.life) {
        rev[i] = 0;
        continue;
      }
      aliveCount += 1;
      const drag = Math.pow(0.28, dt);
      v.x *= drag;
      v.y = v.y * drag - 1.05 * dt;
      v.z *= drag;

      pos[i * 3] += v.x * dt;
      pos[i * 3 + 1] += v.y * dt;
      pos[i * 3 + 2] += v.z * dt;

      const p = age / v.life;
      rev[i] = smoothstep(0.0, 0.08, p) * Math.pow(1 - p, 1.45);
    }

    b.geo.attributes.position.needsUpdate = true;
    b.geo.attributes.aReveal.needsUpdate = true;

    if (aliveCount === 0) {
      b.active = false;
      b.points.visible = false;
    }

    // 粉金扩散光环动画
    const pr = this.ignitePulseRing;
    if (pr.mesh.visible) {
      const rp = clamp(this.igniteElapsed / 1.15, 0, 1);
      if (rp >= 1) {
        pr.mesh.visible = false;
      } else {
        const easeR = 1 - Math.pow(1 - rp, 3);
        pr.mesh.scale.setScalar(1 + easeR * 8.2);
        pr.mat.opacity = 0.80 * Math.pow(1 - rp, 1.7);
      }
    }
  }

  _updateSparkleLayer(layer, dt, globalOpacity) {
    const visible = this.state !== 'intro' && globalOpacity > 0.005;
    layer.points.visible = visible;
    if (!visible) return;

    layer.mat.uniforms.uTime.value = this.elapsed;
    layer.mat.uniforms.uOpacity.value = globalOpacity;

    const pos = layer.geo.attributes.position.array;
    const rev = layer.geo.attributes.aReveal.array;
    const { bounds, onCakeOnly } = layer;

    for (let i = 0; i < layer.count; i += 1) {
      const m = layer.meta[i];
      const localT = this.igniteElapsed - m.delay;
      if (localT <= 0) {
        rev[i] = 0;
        continue;
      }

      const p = clamp(localT / m.bloomDur, 0, 1);
      if (p < 1) {
        // 旋转升起散开阶段：从蛋糕附近旋风式划出优美弧线飘散到全屏目标位置
        const ease = 1 - Math.pow(1 - p, 3);
        const r = THREE.MathUtils.lerp(m.startR, m.homeR, ease);
        const angle = m.homeAngle - (1 - ease) * m.swirlTwist;
        const arcLift = Math.sin(ease * Math.PI) * (onCakeOnly ? 0.16 : 0.45);
        const y = THREE.MathUtils.lerp(m.startY, m.homeY, ease) + arcLift;

        pos[i * 3] = Math.cos(angle) * r;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = Math.sin(angle) * r;
        m.y = m.homeY;
        rev[i] = smoothstep(0.0, 0.28, p);
      } else {
        rev[i] = 1.0;
        if (onCakeOnly) {
          pos[i * 3] = m.homeX + Math.sin(this.elapsed * m.driftFreq + m.phase) * m.driftAmp;
          pos[i * 3 + 1] = m.homeY + Math.cos(this.elapsed * 1.4 + m.phase) * 0.025;
          pos[i * 3 + 2] = m.homeZ + Math.cos(this.elapsed * m.driftFreq * 0.8 + m.phase) * m.driftAmp;
        } else {
          m.y += m.riseSpeed * dt;
          if (m.y > bounds.yMax) {
            m.y = bounds.yMin;
          }
          pos[i * 3] = m.homeX + Math.sin(this.elapsed * m.driftFreq + m.phase) * m.driftAmp;
          pos[i * 3 + 1] = m.y;
          pos[i * 3 + 2] = m.homeZ + Math.cos(this.elapsed * m.driftFreq * 0.8 + m.phase) * m.driftAmp;
        }
      }
    }

    layer.geo.attributes.position.needsUpdate = true;
    layer.geo.attributes.aReveal.needsUpdate = true;
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
      this.lightProgress = 0;
      this.igniteElapsed = 0;
    } else {
      this.lightProgress = Math.min(1, this.lightProgress + dt * 1.15);
      this.igniteElapsed += dt;
    }

    const easeLight = this.state === 'intro' ? 0.55 : 0.55 + 0.45 * (1 - Math.pow(1 - this.lightProgress, 3));
    const postIgniteOpacity = this.state === 'intro' ? 0 : smoothstep(0.0, 0.35, this.igniteElapsed);
    const domeReveal = this.state === 'intro' ? 0 : smoothstep(0.14, 1.55, this.igniteElapsed);

    this.ambient.intensity = THREE.MathUtils.lerp(0.38, 0.78, easeLight);
    this.keyLight.intensity = THREE.MathUtils.lerp(0.40, 1.02, easeLight);
    this.rimLight.intensity = THREE.MathUtils.lerp(0.38, 0.90, easeLight);

    this.bgStars.material.opacity = this.state === 'intro' ? 0.08 : 0.46 * postIgniteOpacity;
    this.baseGlowMat.opacity = THREE.MathUtils.lerp(0.42, 0.85, easeLight);
    this.trayHaloMat.opacity = THREE.MathUtils.lerp(0.10, 0.44, easeLight);

    // 蛋糕表面像素粒子与碎钻星芒：暗夜保留微光，点亮后晶莹耀眼
    this.cakePixelMat.uniforms.uTime.value = this.elapsed;
    this.cakePixelMat.uniforms.uOpacity.value = THREE.MathUtils.lerp(0.58, 0.95, easeLight);

    this.cakeFlareMat.uniforms.uTime.value = this.elapsed;
    this.cakeFlareMat.uniforms.uOpacity.value = THREE.MathUtils.lerp(0.42, 0.98, easeLight);

    // 周围断断续续流光弧线自底座渐次向上描绘显现（无球形罩子，未点亮时彻底隐藏）
    const arcsVisible = this.state !== 'intro' && domeReveal > 0.005;
    for (let i = 0; i < this.domeArcMaterials.length; i += 1) {
      this.domeArcMeshes[i].visible = arcsVisible;
      this.domeArcMaterials[i].uniforms.uTime.value = this.elapsed;
      this.domeArcMaterials[i].uniforms.uOpacity.value = postIgniteOpacity;
      this.domeArcMaterials[i].uniforms.uReveal.value = domeReveal;
    }

    this._updateSpiralRibbons();
    this._updateIgnitionBurst(dt);
    for (const layer of this.sparkleLayers) {
      this._updateSparkleLayer(layer, dt, postIgniteOpacity);
    }

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
    this.pixelTex.dispose();
    this.glintTex.dispose();
    this.starTex.dispose();
    this.softRingTex.dispose();
    this.sideTextures.map.dispose();
    this.sideTextures.emissiveMap.dispose();
    this.topTextures.map.dispose();
    this.topTextures.emissiveMap.dispose();
    this.trayTex.dispose();
    for (const item of this.extraDisposables) {
      if (typeof item.dispose === 'function') item.dispose();
    }
    this.controls.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
