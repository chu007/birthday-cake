import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createClassicCandles, createAgeCandles } from './numerals.js';

function createParticleDotTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.32, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.68, 'rgba(255, 255, 255, 0.20)');
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
  glow.addColorStop(0.0, 'rgba(255, 255, 255, 0.72)');
  glow.addColorStop(0.55, 'rgba(255, 255, 255, 0.16)');
  glow.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
  ctx.fillRect(8, 8, 16, 16);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 尖锐精致的四角钻石星芒贴图，营造“亮晶晶”闪烁效果
function createDiamondGlintTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  const coreGlow = ctx.createRadialGradient(cx, cy, 1, cx, cy, size * 0.34);
  coreGlow.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  coreGlow.addColorStop(0.24, 'rgba(255, 248, 225, 0.65)');
  coreGlow.addColorStop(1.0, 'rgba(255, 240, 200, 0.0)');
  ctx.fillStyle = coreGlow;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const longR = size * 0.47;
  const innerR = size * 0.045;
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

function createFivePointStarTexture() {
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, size * 0.42);
  glow.addColorStop(0.0, 'rgba(255, 255, 255, 0.72)');
  glow.addColorStop(0.4, 'rgba(255, 255, 255, 0.14)');
  glow.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const outerR = size * 0.34;
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

// 星空蓝像素粒子蛋糕侧面贴图（2048x512）：向初版电光星空蓝靠拢 + 细腻像素方块与十字像素星点
function createBluePixelSideTextures() {
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

  // 静谧深邃星空蓝 -> 宝蓝 -> 底部电光晴空蓝渐变
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0.0, '#0d193d');
  bg.addColorStop(0.54, '#162d68');
  bg.addColorStop(0.84, '#2458c9');
  bg.addColorStop(1.0, '#38bdf8');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ectx.fillStyle = '#000000';
  ectx.fillRect(0, 0, w, h);

  // 底部电光蓝柔光极光波浪
  const drawBottomAurora = (targetCtx, alphaScale) => {
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'screen';

    const baseBand = targetCtx.createLinearGradient(0, h * 0.66, 0, h);
    baseBand.addColorStop(0.0, 'rgba(56, 189, 248, 0.0)');
    baseBand.addColorStop(0.45, `rgba(37, 99, 235, ${0.42 * alphaScale})`);
    baseBand.addColorStop(0.82, `rgba(56, 189, 248, ${0.72 * alphaScale})`);
    baseBand.addColorStop(1.0, `rgba(125, 211, 252, ${0.88 * alphaScale})`);
    targetCtx.fillStyle = baseBand;
    targetCtx.fillRect(0, h * 0.66, w, h * 0.34);

    for (let i = 0; i < 18; i += 1) {
      const cx = (i / 18) * w + Math.sin(i * 2.1) * 38;
      const cy = h * (0.90 - (i % 3) * 0.05);
      const rx = 110 + (i % 4) * 38;
      const col = i % 2 === 0 ? '56, 189, 248' : '96, 165, 250';

      for (const offsetX of [0, w, -w]) {
        const g = targetCtx.createRadialGradient(cx + offsetX, cy, 4, cx + offsetX, cy, rx);
        g.addColorStop(0.0, `rgba(${col}, ${0.52 * alphaScale})`);
        g.addColorStop(0.55, `rgba(${col}, ${0.20 * alphaScale})`);
        g.addColorStop(1.0, `rgba(${col}, 0.0)`);
        targetCtx.fillStyle = g;
        targetCtx.beginPath();
        targetCtx.arc(cx + offsetX, cy, rx, 0, Math.PI * 2);
        targetCtx.fill();
      }
    }
    targetCtx.restore();
  };

  drawBottomAurora(ctx, 0.9);
  drawBottomAurora(ectx, 0.56);

  // 像素感细网格暗纹（微妙像素布面质感）
  ctx.fillStyle = 'rgba(186, 230, 253, 0.035)';
  for (let gx = 0; gx < w; gx += 16) {
    ctx.fillRect(gx, 0, 1, h);
  }
  for (let gy = 0; gy < h; gy += 16) {
    ctx.fillRect(0, gy, w, 1);
  }

  // 散布清晰方形像素块与像素小十字星（保留粒子感与像素感）
  const pixelPalette = ['#bae6fd', '#7dd3fc', '#38bdf8', '#ffffff', '#fde68a', '#fbcfe8'];
  const snap = (v, step = 8) => Math.round(v / step) * step;

  for (let i = 0; i < 360; i += 1) {
    const px = snap(Math.random() * (w - 16), 8);
    const py = snap(18 + Math.random() * (h - 46), 8);
    const cell = i % 5 === 0 ? 7 : i % 2 === 0 ? 5 : 4;
    const col = pixelPalette[i % pixelPalette.length];
    const isBright = i % 3 === 0;

    ctx.fillStyle = col;
    ctx.globalAlpha = isBright ? 0.9 : 0.62;
    ctx.fillRect(px, py, cell, cell);

    if (i % 9 === 0) {
      // 精致像素十字星
      ctx.fillRect(px - cell, py, cell * 3, cell);
      ctx.fillRect(px, py - cell, cell, cell * 3);
    }

    if (isBright) {
      ectx.fillStyle = col;
      ectx.globalAlpha = i % 9 === 0 ? 0.62 : 0.42;
      ectx.fillRect(px, py, cell, cell);
      if (i % 9 === 0) {
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

// 蛋糕上表面平滑顶盘贴图（1024x1024）：无任何裱花坨坨，干净冰蓝渐变 + 前半区发光 "happy birthday"
function createBluePixelTopTextures() {
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

  // 深宝蓝中心 -> 晴空蓝 -> 清透冰蓝边缘
  const grad = ctx.createRadialGradient(cx, cy, 24, cx, cy, size * 0.5);
  grad.addColorStop(0.0, '#14265a');
  grad.addColorStop(0.55, '#1e3e8a');
  grad.addColorStop(0.84, '#2563eb');
  grad.addColorStop(1.0, '#60a5fa');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const emGrad = ectx.createRadialGradient(cx, cy, 20, cx, cy, size * 0.5);
  emGrad.addColorStop(0.0, 'rgba(37, 99, 235, 0.14)');
  emGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.22)');
  emGrad.addColorStop(1.0, 'rgba(125, 211, 252, 0.36)');
  ectx.fillStyle = emGrad;
  ectx.fillRect(0, 0, size, size);

  // 外圈极细像素星点围边（贴平表面，不凸起不凌乱）
  const pixelCols = ['#ffffff', '#bae6fd', '#fde68a', '#fbcfe8'];
  for (let i = 0; i < 150; i += 1) {
    const a = (i / 150) * Math.PI * 2 + (Math.random() - 0.5) * 0.04;
    const r = size * (0.39 + Math.random() * 0.085);
    const x = Math.round((cx + Math.cos(a) * r) / 6) * 6;
    const y = Math.round((cy + Math.sin(a) * r) / 6) * 6;
    const sz = i % 3 === 0 ? 6 : 4;
    const col = pixelCols[i % pixelCols.length];

    ctx.fillStyle = col;
    ctx.globalAlpha = 0.78;
    ctx.fillRect(x, y, sz, sz);

    ectx.fillStyle = col;
    ectx.globalAlpha = 0.52;
    ectx.fillRect(x, y, sz, sz);
  }
  ctx.globalAlpha = 1;
  ectx.globalAlpha = 1;

  // 在蛋糕上表面前半区绘制清晰可辨的两行 "happy / birthday"（纵向适度拉伸以抵消 3D 俯视压扁，确保一眼可读）
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
        targetCtx.lineWidth = 10;
        targetCtx.lineJoin = 'round';
        targetCtx.strokeStyle = 'rgba(10, 22, 58, 0.90)';
        targetCtx.strokeText(text, 0, 0);
        targetCtx.fillStyle = '#ffffff';
        targetCtx.fillText(text, 0, 0);
      } else {
        targetCtx.fillStyle = 'rgba(224, 242, 254, 0.24)';
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

// 平底白色圆托盘贴图：珠光白瓷面 + 蛋糕正下方淡淡天蓝极光倒影
function createBlueGlowTrayTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  const grad = ctx.createRadialGradient(cx, cy, 24, cx, cy, size * 0.5);
  grad.addColorStop(0.0, '#3b82f6');
  grad.addColorStop(0.56, '#93c5fd');
  grad.addColorStop(0.68, '#eff6ff');
  grad.addColorStop(0.82, '#ffffff');
  grad.addColorStop(1.0, '#fffaf8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 亮晶晶闪烁粒子 Custom Shader（支持每颗粒子独立闪烁相位与速度 + 限制最大像素尺寸以保持细腻）
function createTwinklePointsMaterial(texture, maxPointPx = 28.0) {
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
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aPhase;
      attribute float aSpeed;
      attribute vec3 aColor;

      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uMaxPx;

      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vColor = aColor;
        float wave = 0.5 + 0.5 * sin(uTime * aSpeed + aPhase);
        vTwinkle = 0.36 + 0.64 * pow(wave, 2.2);

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float rawSize = aSize * uPixelRatio * (740.0 / max(1.5, -mvPosition.z)) * (0.76 + 0.48 * vTwinkle);
        gl_PointSize = min(rawSize, uMaxPx * uPixelRatio);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uOpacity;

      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vec4 tex = texture2D(uMap, gl_PointCoord);
        float alpha = tex.a * vTwinkle * uOpacity;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(vColor * tex.rgb * (1.55 + 0.85 * vTwinkle), alpha);
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
    this.sparkleProgress = 0;
    this.elapsed = 0;
    this.disposed = false;
    this.extraDisposables = [];

    this.dotTex = createParticleDotTexture();
    this.pixelTex = createPixelSquareTexture();
    this.glintTex = createDiamondGlintTexture();
    this.starTex = createFivePointStarTexture();
    this.sideTextures = createBluePixelSideTextures();
    this.topTextures = createBluePixelTopTextures();
    this.trayTex = createBlueGlowTrayTexture();

    this._initRenderer();
    this._initScene();
    this._initPostProcessing();
    this._buildBackdropStars();
    this._buildFlatTrayAndBluePixelCake();
    this._buildWideAiryArchAbove();
    this._buildCandles();
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
    this.renderer.toneMappingExposure = 1.04;
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

    this.ambient = new THREE.AmbientLight(0xdfeaff, 0.76);
    this.scene.add(this.ambient);

    this.keyLight = new THREE.DirectionalLight(0xfffaf0, 1.05);
    this.keyLight.position.set(3.2, 4.8, 3.8);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x93c5fd, 0.85);
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

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.42,
      0.40,
      0.78
    );
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
  }

  _buildBackdropStars() {
    const count = 150;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xbae6fd),
      new THREE.Color(0xfef3c7),
      new THREE.Color(0xfbcfe8),
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

  _buildFlatTrayAndBluePixelCake() {
    // 1. 扁平珠光白圆托盘（带蛋糕底部淡蓝色极光倒影 + 细香槟金镶边）
    const trayGeo = this._track(new THREE.CylinderGeometry(1.30, 1.28, 0.032, 72));
    const trayMat = this._track(new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: this.trayTex,
      emissive: 0xdbeafe,
      emissiveMap: this.trayTex,
      emissiveIntensity: 0.16,
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
      emissive: 0x5c4212,
      emissiveIntensity: 0.22,
      metalness: 0.72,
      roughness: 0.24,
    }));
    const trayRim = new THREE.Mesh(trayRimGeo, goldMat);
    trayRim.rotation.x = Math.PI / 2;
    trayRim.position.y = 0.024;
    this.cakeGroup.add(trayRim);

    // 蛋糕底部晴空蓝微光环
    const baseGlowGeo = this._track(new THREE.TorusGeometry(0.825, 0.014, 10, 72));
    const baseGlowMat = this._track(new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.55,
    }));
    const baseGlowRing = new THREE.Mesh(baseGlowGeo, baseGlowMat);
    baseGlowRing.rotation.x = Math.PI / 2;
    baseGlowRing.position.y = 0.034;
    this.cakeGroup.add(baseGlowRing);

    // 2. 深邃星空蓝内芯 + 微透像素粒子蛋糕筒身（保留粒子感与通透感）
    const innerCoreGeo = this._track(new THREE.CylinderGeometry(0.76, 0.76, 0.80, 48));
    const innerCoreMat = this._track(new THREE.MeshStandardMaterial({
      color: 0x0b183e,
      emissive: 0x172f6e,
      emissiveIntensity: 0.35,
      roughness: 0.6,
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
      metalness: 0.06,
      clearcoat: 0.58,
      clearcoatRoughness: 0.16,
    }));
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.452;
    this.cakeGroup.add(bodyMesh);

    // 平滑无坨坨的蛋糕顶部基底 + 精确 UV 定向圆盘（展示 "happy birthday"）
    const topRimGeo = this._track(new THREE.CylinderGeometry(0.79, 0.80, 0.036, 72));
    const topRimMat = this._track(new THREE.MeshPhysicalMaterial({
      color: 0x2563eb,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.32,
      roughness: 0.26,
      clearcoat: 0.48,
    }));
    const topRimDisk = new THREE.Mesh(topRimGeo, topRimMat);
    topRimDisk.position.y = 0.875;
    this.cakeGroup.add(topRimDisk);

    const topFaceGeo = this._track(new THREE.CircleGeometry(0.792, 72));
    const topFaceMat = this._track(new THREE.MeshPhysicalMaterial({
      map: this.topTextures.map,
      emissive: 0xffffff,
      emissiveMap: this.topTextures.emissiveMap,
      emissiveIntensity: 0.85,
      roughness: 0.26,
      metalness: 0.03,
      clearcoat: 0.45,
      clearcoatRoughness: 0.18,
    }));
    const topFace = new THREE.Mesh(topFaceGeo, topFaceMat);
    topFace.rotation.x = -Math.PI / 2;
    topFace.position.y = 0.896;
    this.cakeGroup.add(topFace);

    // 3. 蛋糕底座一圈紧贴相连、统一珠光白的珍珠围边（完全连成一体，无分离彩色珠子）
    const pearlMat = this._track(new THREE.MeshPhysicalMaterial({
      color: 0xf4f9ff,
      emissive: 0xdbeafe,
      emissiveIntensity: 0.14,
      roughness: 0.22,
      metalness: 0.06,
      clearcoat: 0.68,
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

    // 4. 3D 环绕蛋糕筒身与肩缘的像素粒子星海（保留立体粒子感与像素感）
    const pixelCount = 1150;
    const pPos = new Float32Array(pixelCount * 3);
    const pCol = new Float32Array(pixelCount * 3);
    const pSizes = new Float32Array(pixelCount);
    const pPhases = new Float32Array(pixelCount);
    const pSpeeds = new Float32Array(pixelCount);

    const pPalette = [
      new THREE.Color(0x7dd3fc), // 晴空蓝
      new THREE.Color(0x38bdf8), // 电光蓝
      new THREE.Color(0xbae6fd), // 冰晶蓝
      new THREE.Color(0xffffff), // 纯白
      new THREE.Color(0xfde68a), // 香槟金
      new THREE.Color(0xfbcfe8), // 淡樱粉
    ];

    for (let i = 0; i < pixelCount; i += 1) {
      const a = Math.random() * Math.PI * 2;
      if (i < 900) {
        // 筒身像素星粒子带
        const r = 0.806 + Math.random() * 0.024;
        const y = 0.06 + Math.random() * 0.825;
        pPos[i * 3] = Math.cos(a) * r;
        pPos[i * 3 + 1] = y;
        pPos[i * 3 + 2] = Math.sin(a) * r;
      } else {
        // 顶部平缓肩缘一圈极细星粒，无任何突起坨坨
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
      pSizes[i] = 0.036 + Math.random() * 0.042;
      pPhases[i] = Math.random() * Math.PI * 2;
      pSpeeds[i] = 1.4 + Math.random() * 2.8;
    }

    const pGeo = this._track(new THREE.BufferGeometry());
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('aColor', new THREE.BufferAttribute(pCol, 3));
    pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSizes, 1));
    pGeo.setAttribute('aPhase', new THREE.BufferAttribute(pPhases, 1));
    pSpeeds.forEach((_, idx) => {
      if (idx % 12 === 0) pSizes[idx] *= 1.35;
    });
    pGeo.setAttribute('aSpeed', new THREE.BufferAttribute(pSpeeds, 1));

    this.cakePixelMat = this._track(createTwinklePointsMaterial(this.pixelTex, 16.0));
    this.cakePixelMat.uniforms.uOpacity.value = 0.58;
    this.cakePixelShell = new THREE.Points(pGeo, this.cakePixelMat);
    this.cakeGroup.add(this.cakePixelShell);
  }

  _buildWideAiryArchAbove() {
    // 拉高拉大的柔光外罩细弧边框（注意：与点蜡烛一起出现，点亮前完全隐藏）
    this.domeArcMaterials = [];
    this.domeArcMeshes = [];

    const domeGeo = this._track(new THREE.SphereGeometry(2.26, 64, 42, 0, Math.PI * 2, 0, Math.PI * 0.68));
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
          float plateFade = smoothstep(0.18, 0.78, vWorldY);
          float ndv = abs(dot(normalize(vNormal), normalize(vViewDir)));
          float rim = pow(1.0 - ndv, 18.0);

          float angle = atan(vLocalPos.z, vLocalPos.x);
          float wisp = smoothstep(-0.15, 0.65, sin(angle * 3.0 + vLocalPos.y * 2.1 + uTime * 0.35));
          float pulse = 0.72 + 0.28 * sin(uTime * 1.4 + vLocalPos.y * 1.8);

          vec3 col = mix(vec3(0.82, 0.92, 1.0), vec3(0.99, 0.90, 0.68), 0.45);
          float alpha = rim * plateFade * (0.25 + 0.75 * wisp) * 0.48 * pulse * uOpacity;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    }));

    this.domeShell = new THREE.Mesh(domeGeo, this.domeShellMat);
    this.domeShell.position.y = 1.45;
    this.domeShell.visible = false;
    this.cakeGroup.add(this.domeShell);

    const arcSpecs = [
      { radius: 2.24, centerY: 1.44, rotY: 0.15, freq: 3.0, phase: 0.4, speed: 0.22, color: new THREE.Color(0xfef3c7), peakAlpha: 0.70 },
      { radius: 2.31, centerY: 1.46, rotY: 1.35, freq: 3.5, phase: 2.1, speed: -0.18, color: new THREE.Color(0xe0f2fe), peakAlpha: 0.58 },
      { radius: 2.37, centerY: 1.45, rotY: 2.45, freq: 2.5, phase: 4.0, speed: 0.15, color: new THREE.Color(0xfde68a), peakAlpha: 0.52 },
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
      const tubeGeo = this._track(new THREE.TubeGeometry(curve, 80, 0.0056, 6, false));

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
            float endFade = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
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

  _buildFreeSparkles() {
    // 严格在点蜡烛后才出现，自由散落全屏，尺寸大幅收细为精致小光点
    const palette = [
      new THREE.Color(0xffffff), // 钻石白
      new THREE.Color(0xfff5f8), // 珍珠白
      new THREE.Color(0xfde68a), // 香槟金
      new THREE.Color(0xfbcfe8), // 淡樱粉
      new THREE.Color(0xbae6fd), // 浅冰蓝星芒
    ];

    const createLayer = ({ count, tex, sizeMin, sizeMax, speedMin, speedMax, bounds, riseSpeedRange, maxPx = 28.0, onCakeOnly = false }) => {
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      const phases = new Float32Array(count);
      const speeds = new Float32Array(count);
      const meta = [];

      for (let i = 0; i < count; i += 1) {
        let x;
        let y;
        let z;
        if (onCakeOnly) {
          const a = Math.random() * Math.PI * 2;
          const r = 0.25 + Math.random() * 0.56;
          x = Math.cos(a) * r;
          y = 0.08 + Math.random() * 0.88;
          z = Math.sin(a) * r;
        } else {
          x = bounds.xMin + Math.random() * (bounds.xMax - bounds.xMin);
          y = bounds.yMin + Math.random() * (bounds.yMax - bounds.yMin);
          z = bounds.zMin + Math.random() * (bounds.zMax - bounds.zMin);
        }

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const c = palette[Math.floor(Math.random() * palette.length)];
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;

        sizes[i] = sizeMin + Math.random() * (sizeMax - sizeMin);
        phases[i] = Math.random() * Math.PI * 2;
        speeds[i] = speedMin + Math.random() * (speedMax - speedMin);

        meta.push({
          baseX: x,
          baseZ: z,
          y,
          riseSpeed: riseSpeedRange[0] + Math.random() * (riseSpeedRange[1] - riseSpeedRange[0]),
          driftFreq: 0.4 + Math.random() * 0.9,
          driftAmp: onCakeOnly ? 0.018 : 0.08 + Math.random() * 0.14,
          phase: phases[i],
        });
      }

      const geo = this._track(new THREE.BufferGeometry());
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
      geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
      geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
      geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

      const mat = this._track(createTwinklePointsMaterial(tex, maxPx));
      const points = new THREE.Points(geo, mat);
      points.visible = false;
      this.scene.add(points);

      return { points, geo, mat, meta, count, bounds, onCakeOnly };
    };

    const fullBounds = { xMin: -3.5, xMax: 3.5, yMin: -1.35, yMax: 4.5, zMin: -2.6, zMax: 2.4 };

    // 1. 细巧钻石四角星芒
    this.diamondGlints = createLayer({
      count: 165,
      tex: this.glintTex,
      sizeMin: 0.085,
      sizeMax: 0.175,
      speedMin: 2.2,
      speedMax: 4.8,
      bounds: fullBounds,
      riseSpeedRange: [0.08, 0.22],
      maxPx: 30.0,
    });

    // 2. 细腻微光小圆点
    this.blushBokeh = createLayer({
      count: 120,
      tex: this.dotTex,
      sizeMin: 0.055,
      sizeMax: 0.125,
      speedMin: 1.5,
      speedMax: 3.2,
      bounds: fullBounds,
      riseSpeedRange: [0.06, 0.18],
      maxPx: 22.0,
    });

    // 3. 精细星空像素尘微粒
    this.microStardust = createLayer({
      count: 280,
      tex: this.starTex,
      sizeMin: 0.032,
      sizeMax: 0.072,
      speedMin: 2.5,
      speedMax: 5.5,
      bounds: fullBounds,
      riseSpeedRange: [0.14, 0.34],
      maxPx: 14.0,
    });

    // 4. 蛋糕周围细碎星芒点缀（点亮后随蛋糕旋转）
    this.crownShimmers = createLayer({
      count: 75,
      tex: this.glintTex,
      sizeMin: 0.045,
      sizeMax: 0.088,
      speedMin: 2.6,
      speedMax: 5.0,
      bounds: fullBounds,
      riseSpeedRange: [0.0, 0.02],
      maxPx: 18.0,
      onCakeOnly: true,
    });
    this.scene.remove(this.crownShimmers.points);
    this.cakeGroup.add(this.crownShimmers.points);

    this.sparkleLayers = [this.diamondGlints, this.blushBokeh, this.microStardust, this.crownShimmers];
  }

  _buildFireworks() {
    this.fireworkBursts = [];
    const burstCount = 5;
    const perBurst = 115;
    const colors = [0xffffff, 0xfde68a, 0xbae6fd, 0xfbcfe8, 0xf5d08a, 0xfff5f8];

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
        size: 0.12,
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
      if (this.cakePixelMat) {
        this.cakePixelMat.uniforms.uPixelRatio.value = pr;
      }
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
      // 约 27° 经典甜品俯视角，既展示完整立体蛋糕体，又让顶面 "happy birthday" 清晰可读
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

  _updateSparkleLayer(layer, dt, sparkleAlpha) {
    layer.points.visible = sparkleAlpha > 0.005;
    if (!layer.points.visible) return;

    layer.mat.uniforms.uTime.value = this.elapsed;
    layer.mat.uniforms.uOpacity.value = sparkleAlpha;

    if (layer.onCakeOnly) return;

    const pos = layer.geo.attributes.position.array;
    const { bounds } = layer;
    for (let i = 0; i < layer.count; i += 1) {
      const m = layer.meta[i];
      m.y += m.riseSpeed * dt;
      if (m.y > bounds.yMax) {
        m.y = bounds.yMin;
      }
      pos[i * 3] = m.baseX + Math.sin(this.elapsed * m.driftFreq + m.phase) * m.driftAmp;
      pos[i * 3 + 1] = m.y;
      pos[i * 3 + 2] = m.baseZ + Math.cos(this.elapsed * m.driftFreq * 0.8 + m.phase) * m.driftAmp;
    }
    layer.geo.attributes.position.needsUpdate = true;
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
      this.sparkleProgress = 0;
    } else {
      this.lightProgress = Math.min(1, this.lightProgress + dt * 1.15);
      this.sparkleProgress = Math.min(1, this.sparkleProgress + dt * 0.78);
    }

    const easeLight = this.state === 'intro' ? 0.55 : 0.55 + 0.45 * (1 - Math.pow(1 - this.lightProgress, 3));
    const easeSparkles = this.state === 'intro' ? 0 : 1 - Math.pow(1 - this.sparkleProgress, 2.2);

    this.ambient.intensity = THREE.MathUtils.lerp(0.36, 0.76, easeLight);
    this.keyLight.intensity = THREE.MathUtils.lerp(0.38, 1.05, easeLight);
    this.rimLight.intensity = THREE.MathUtils.lerp(0.35, 0.85, easeLight);

    this.bgStars.material.opacity = this.state === 'intro' ? 0.08 : 0.40 * easeSparkles;

    // 蛋糕表面像素粒子在暗夜也保留淡淡微光，点亮后晶莹绽放
    this.cakePixelMat.uniforms.uTime.value = this.elapsed;
    this.cakePixelMat.uniforms.uOpacity.value = THREE.MathUtils.lerp(0.54, 0.92, easeLight);

    // 箭头指的柔光圆罩边框与点蜡烛同时出现，未点燃时彻底隐藏
    const domeVisible = easeSparkles > 0.005;
    this.domeShell.visible = domeVisible;
    this.domeShellMat.uniforms.uTime.value = this.elapsed;
    this.domeShellMat.uniforms.uOpacity.value = easeSparkles;
    for (let i = 0; i < this.domeArcMaterials.length; i += 1) {
      this.domeArcMeshes[i].visible = domeVisible;
      this.domeArcMaterials[i].uniforms.uTime.value = this.elapsed;
      this.domeArcMaterials[i].uniforms.uOpacity.value = easeSparkles;
    }

    for (const layer of this.sparkleLayers) {
      this._updateSparkleLayer(layer, dt, easeSparkles);
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
