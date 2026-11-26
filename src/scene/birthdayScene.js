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
  grad.addColorStop(0.28, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.62, 'rgba(255, 255, 255, 0.18)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createDiamondGlintTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  const coreGlow = ctx.createRadialGradient(cx, cy, 0.5, cx, cy, size * 0.20);
  coreGlow.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  coreGlow.addColorStop(0.35, 'rgba(255, 248, 228, 0.65)');
  coreGlow.addColorStop(1.0, 'rgba(255, 240, 200, 0.0)');
  ctx.fillStyle = coreGlow;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const longR = size * 0.48;
  const innerR = size * 0.022;
  for (let i = 0; i < 8; i += 1) {
    const r = i % 2 === 0 ? longR : innerR;
    const a = (i * Math.PI) / 4;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
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

  const glow = ctx.createRadialGradient(cx, cy, 1, cx, cy, size * 0.36);
  glow.addColorStop(0.0, 'rgba(255, 255, 255, 0.78)');
  glow.addColorStop(0.45, 'rgba(255, 255, 255, 0.16)');
  glow.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const outerR = size * 0.33;
  const innerR = size * 0.135;
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

// 圆角方形平底白蛋糕托盘几何体
function createSquareCakeBoardGeometry(size = 2.24, cornerRadius = 0.14, thickness = 0.034) {
  const half = size / 2;
  const r = cornerRadius;
  const shape = new THREE.Shape();
  shape.moveTo(-half + r, -half);
  shape.lineTo(half - r, -half);
  shape.quadraticCurveTo(half, -half, half, -half + r);
  shape.lineTo(half, half - r);
  shape.quadraticCurveTo(half, half, half - r, half);
  shape.lineTo(-half + r, half);
  shape.quadraticCurveTo(-half, half, -half, half - r);
  shape.lineTo(-half, -half + r);
  shape.quadraticCurveTo(-half, -half, -half + r, -half);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.012,
    bevelThickness: 0.008,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

// 温润纯白动物奶油侧面贴图 + Lambeth 垂坠花边微浮雕凹凸贴图
function createCreamBodyTextures() {
  const w = 2048;
  const h = 512;

  const albedo = document.createElement('canvas');
  albedo.width = w;
  albedo.height = h;
  const ctx = albedo.getContext('2d');

  const bump = document.createElement('canvas');
  bump.width = w;
  bump.height = h;
  const bctx = bump.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0.0, '#fffdf7');
  bg.addColorStop(0.65, '#fcf6ea');
  bg.addColorStop(1.0, '#f7ede0');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, w, h);

  // 细腻乳白奶油抹面横纹
  for (let y = 14; y < h - 14; y += 20) {
    ctx.fillStyle = 'rgba(232, 218, 198, 0.16)';
    ctx.fillRect(0, y, w, 2);
    bctx.fillStyle = 'rgba(165, 165, 165, 0.25)';
    bctx.fillRect(0, y, w, 3);
  }

  // 8 组纯白 Lambeth 吊链花边底纹与垂坠珍珠点暗纹
  const arches = 8;
  const stepW = w / arches;
  for (let i = 0; i < arches; i += 1) {
    const x0 = i * stepW;
    const x1 = (i + 1) * stepW;
    const xm = (x0 + x1) * 0.5;

    ctx.beginPath();
    ctx.moveTo(x0, h * 0.22);
    ctx.quadraticCurveTo(xm, h * 0.44, x1, h * 0.22);
    ctx.strokeStyle = '#fffefa';
    ctx.lineWidth = 7;
    ctx.stroke();

    bctx.beginPath();
    bctx.moveTo(x0, h * 0.22);
    bctx.quadraticCurveTo(xm, h * 0.44, x1, h * 0.22);
    bctx.strokeStyle = '#ececec';
    bctx.lineWidth = 9;
    bctx.stroke();

    // 每条垂链下方细小的奶油褶皱光影
    for (let k = 1; k <= 5; k += 1) {
      const lx = x0 + (x1 - x0) * (k / 6);
      ctx.strokeStyle = 'rgba(230, 214, 192, 0.24)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lx, h * 0.34);
      ctx.lineTo(lx, h * 0.72);
      ctx.stroke();

      bctx.strokeStyle = 'rgba(195, 195, 195, 0.42)';
      bctx.lineWidth = 4;
      bctx.beginPath();
      bctx.moveTo(lx, h * 0.34);
      bctx.lineTo(lx, h * 0.72);
      bctx.stroke();
    }
  }

  const map = new THREE.CanvasTexture(albedo);
  map.wrapS = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bump);
  bumpMap.wrapS = THREE.RepeatWrapping;
  return { map, bumpMap };
}

function createCreamTopTextures() {
  const size = 1024;
  const cx = size / 2;
  const cy = size / 2;

  const albedo = document.createElement('canvas');
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext('2d');

  const bump = document.createElement('canvas');
  bump.width = size;
  bump.height = size;
  const bctx = bump.getContext('2d');

  const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, size * 0.5);
  grad.addColorStop(0.0, '#fffdf7');
  grad.addColorStop(0.7, '#fcf6eb');
  grad.addColorStop(1.0, '#f5ebdc');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);

  ctx.beginPath();
  bctx.beginPath();
  const turns = 10;
  const steps = turns * 72;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const r = 18 + t * (size * 0.44);
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) {
      ctx.moveTo(x, y);
      bctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      bctx.lineTo(x, y);
    }
  }
  ctx.strokeStyle = 'rgba(230, 214, 192, 0.32)';
  ctx.lineWidth = 4;
  ctx.stroke();

  bctx.strokeStyle = 'rgba(220, 220, 220, 0.8)';
  bctx.lineWidth = 8;
  bctx.stroke();

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bump);
  return { map, bumpMap };
}

// 高立体感星形花嘴纯白奶油棱纹贴图（乳白峰 + 暖米金暗沟）
function createPipingStripeTexture(tintHex = '#fffdf7', grooveHex = '#dfd0bc') {
  const size = 256;
  const albedo = document.createElement('canvas');
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext('2d');

  const bump = document.createElement('canvas');
  bump.width = size;
  bump.height = size;
  const bctx = bump.getContext('2d');

  const flutes = 12;
  const bandH = size / flutes;
  for (let i = 0; i < flutes; i += 1) {
    const y0 = i * bandH;
    const g = ctx.createLinearGradient(0, y0, 0, y0 + bandH);
    g.addColorStop(0.0, grooveHex);
    g.addColorStop(0.28, tintHex);
    g.addColorStop(0.5, '#ffffff');
    g.addColorStop(0.72, tintHex);
    g.addColorStop(1.0, grooveHex);
    ctx.fillStyle = g;
    ctx.fillRect(0, y0, size, bandH + 1);

    const bg = bctx.createLinearGradient(0, y0, 0, y0 + bandH);
    bg.addColorStop(0.0, '#141414');
    bg.addColorStop(0.32, '#dcdcdc');
    bg.addColorStop(0.5, '#ffffff');
    bg.addColorStop(0.68, '#dcdcdc');
    bg.addColorStop(1.0, '#141414');
    bctx.fillStyle = bg;
    bctx.fillRect(0, y0, size, bandH + 1);
  }

  const map = new THREE.CanvasTexture(albedo);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bump);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  return { map, bumpMap };
}

// 丰盈流畅的 S 形波浪奶油花边管道（还原图片顶部与底部饱满的白色奶油褶皱花边）
function createSweepingRuffleGeometry({
  radius = 0.79,
  baseY = 0.75,
  waves = 14,
  radialAmp = 0.068,
  verticalAmp = 0.036,
  tubeRadius = 0.070,
  tubularSegments = 280,
}) {
  const pts = [];
  const totalSamples = waves * 12;
  for (let i = 0; i < totalSamples; i += 1) {
    const theta = (i / totalSamples) * Math.PI * 2;
    const s = Math.sin(theta * waves);
    const c = Math.cos(theta * waves);
    // 略微不对称的 S 卷曲感，更像手工挤出的奶油花边
    const r = radius + s * radialAmp + Math.sin(theta * waves * 2) * (radialAmp * 0.2);
    const y = baseY + c * verticalAmp;
    pts.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
  return new THREE.TubeGeometry(curve, tubularSegments, tubeRadius, 14, true);
}

function createLambethSwagGeometry({
  radius = 0.908,
  topY = 0.62,
  drop = 0.11,
  arches = 8,
  tubeRadius = 0.022,
}) {
  const pts = [];
  const samples = arches * 16;
  for (let i = 0; i < samples; i += 1) {
    const theta = (i / samples) * Math.PI * 2;
    const phase = (i / samples) * arches;
    const frac = phase - Math.floor(phase);
    const sag = Math.sin(frac * Math.PI);
    const y = topY - drop * sag;
    const r = radius + sag * 0.01;
    pts.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
  return new THREE.TubeGeometry(curve, arches * 20, tubeRadius, 10, true);
}

// 饱满微心形樱桃几何体（顶部带天然果蒂凹陷）
function createCherryGeometry() {
  const pts = [];
  const steps = 22;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps; // 0 (bottom) -> 1 (top dimple)
    const angle = t * Math.PI;
    let r = Math.sin(angle) * 0.118;
    let y = (1 - Math.cos(angle)) * 0.098;
    // 上半部略胖，顶部中心略微内凹形成车厘子果蒂窝
    if (t > 0.5) {
      r *= 1.04 - 0.1 * (t - 0.5);
    }
    if (t > 0.84) {
      const dip = (t - 0.84) / 0.16;
      y -= dip * 0.026;
    }
    pts.push(new THREE.Vector2(Math.max(0.0005, r), y));
  }
  return new THREE.LatheGeometry(pts, 28);
}

// 樱桃下方垫着的小朵星形奶油垫
function createFlutedCushionGeometry(outerR = 0.108, height = 0.056) {
  const geo = new THREE.CylinderGeometry(0.03, outerR, height, 24, 6, false);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 0.002) continue;
    const hNorm = Math.min(1, Math.max(0, (y + height / 2) / height));
    const angle = Math.atan2(z, x);
    const fluted = 1 + 0.16 * Math.cos(angle * 8);
    const targetR = outerR * (1 - 0.52 * Math.pow(hNorm, 1.3)) * fluted;
    const scale = targetR / r;
    pos.setX(i, x * scale);
    pos.setZ(i, z * scale);
    pos.setY(i, y + height / 2);
  }
  geo.computeVertexNormals();
  return geo;
}

function createTwinklePointsMaterial(texture, maxCssPx = 12.0) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uMaxPx: { value: maxCssPx },
      uMap: { value: texture },
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
        vTwinkle = 0.34 + 0.66 * pow(wave, 2.4);

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float rawSize = aSize * uPixelRatio * (460.0 / max(2.0, -mvPosition.z)) * (0.76 + 0.44 * vTwinkle);
        gl_PointSize = min(uMaxPx * uPixelRatio, rawSize);
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
        gl_FragColor = vec4(vColor * tex.rgb * (1.65 + 1.15 * vTwinkle), alpha);
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
    this.glintTex = createDiamondGlintTexture();
    this.starTex = createFivePointStarTexture();
    this.bodyTextures = createCreamBodyTextures();
    this.topTextures = createCreamTopTextures();
    this.pipingTextures = createPipingStripeTexture('#fffdf7', '#dfd0bc');

    this._initRenderer();
    this._initScene();
    this._initPostProcessing();
    this._buildBackdropStars();
    this._buildWhiteCherryCake();
    this._buildCandles();
    this._buildPostIgniteSparkles();
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
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06040a);
    this.scene.fog = new THREE.FogExp2(0x06040a, 0.02);

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 70);
    this.camera.position.set(0, 2.35, 5.4);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 14.0;
    this.controls.minPolarAngle = Math.PI * 0.16;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.38;

    this.userDragging = false;
    this.controls.addEventListener('start', () => {
      this.userDragging = true;
    });
    this.controls.addEventListener('end', () => {
      this.userDragging = false;
    });

    // 柔暖甜品棚拍布光：突出纯白奶油波浪立体沟槽阴影，让深红车厘子反射出亮泽高光
    this.ambient = new THREE.AmbientLight(0xfff7ee, 0.68);
    this.scene.add(this.ambient);

    this.keyLight = new THREE.DirectionalLight(0xfffcf5, 1.15);
    this.keyLight.position.set(3.4, 5.4, 3.6);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0xffecd9, 0.62);
    this.rimLight.position.set(-3.4, 3.6, -2.8);
    this.scene.add(this.rimLight);

    this.frontFill = new THREE.DirectionalLight(0xfff1e8, 0.44);
    this.frontFill.position.set(-1.8, 2.4, 4.4);
    this.scene.add(this.frontFill);

    this.cakeGroup = new THREE.Group();
    this.scene.add(this.cakeGroup);

    this.targetCamOffset = new THREE.Vector3(0, 2.35, 5.4);
    this.targetLookAt = new THREE.Vector3(0, 0.42, 0);
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
      0.38,
      0.42,
      0.84
    );
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
  }

  _buildBackdropStars() {
    const count = 110;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color(0xffffff),
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
      size: 0.045,
      map: this.dotTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    this.bgStars = new THREE.Points(geo, mat);
    this.scene.add(this.bgStars);
  }

  _buildWhiteCherryCake() {
    // 1. 纯白圆角方形平底蛋糕垫板（还原参考图双层方托盘）
    const boardMat = this._track(new THREE.MeshPhysicalMaterial({
      color: 0xfcfaf7,
      emissive: 0xfff8f0,
      emissiveIntensity: 0.06,
      roughness: 0.28,
      metalness: 0.02,
      clearcoat: 0.45,
      clearcoatRoughness: 0.16,
    }));

    const outerBoardGeo = this._track(createSquareCakeBoardGeometry(2.30, 0.14, 0.026));
    const outerBoard = new THREE.Mesh(outerBoardGeo, boardMat);
    outerBoard.position.y = 0.008;
    outerBoard.rotation.y = 0.14;
    this.cakeGroup.add(outerBoard);

    const innerBoardGeo = this._track(createSquareCakeBoardGeometry(2.04, 0.10, 0.022));
    const innerBoard = new THREE.Mesh(innerBoardGeo, boardMat);
    innerBoard.position.y = 0.036;
    innerBoard.rotation.y = 0.14;
    this.cakeGroup.add(innerBoard);

    // 2. 纯白动物奶油蛋糕坯（radius = 0.90, height = 0.68）
    const bodyGeo = this._track(new THREE.CylinderGeometry(0.90, 0.90, 0.68, 72, 1, true));
    const bodyMat = this._track(new THREE.MeshPhysicalMaterial({
      map: this.bodyTextures.map,
      bumpMap: this.bodyTextures.bumpMap,
      bumpScale: 0.02,
      roughness: 0.42,
      metalness: 0.01,
      sheen: 0.45,
      sheenColor: new THREE.Color(0xfffaf2),
    }));
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.398;
    this.cakeGroup.add(bodyMesh);

    const topGeo = this._track(new THREE.CylinderGeometry(0.895, 0.90, 0.032, 72));
    const topMat = this._track(new THREE.MeshPhysicalMaterial({
      map: this.topTextures.map,
      bumpMap: this.topTextures.bumpMap,
      bumpScale: 0.022,
      roughness: 0.44,
      metalness: 0.01,
      sheen: 0.4,
      sheenColor: new THREE.Color(0xfffdf8),
    }));
    const topDisk = new THREE.Mesh(topGeo, topMat);
    topDisk.position.y = 0.728;
    this.cakeGroup.add(topDisk);

    // 3. 顶部与底部丰盈流畅的 S 形白色奶油波浪裱花环（还原照片厚实立体的法式花边）
    const pipingMat = this._track(new THREE.MeshPhysicalMaterial({
      map: this.pipingTextures.map,
      bumpMap: this.pipingTextures.bumpMap,
      bumpScale: 0.036,
      color: 0xfffdf8,
      roughness: 0.38,
      metalness: 0.01,
      sheen: 0.5,
      sheenColor: new THREE.Color(0xffffff),
    }));

    const topRuffleGeo = this._track(createSweepingRuffleGeometry({
      radius: 0.79,
      baseY: 0.752,
      waves: 14,
      radialAmp: 0.068,
      verticalAmp: 0.036,
      tubeRadius: 0.070,
      tubularSegments: 280,
    }));
    this.cakeGroup.add(new THREE.Mesh(topRuffleGeo, pipingMat));

    const bottomRuffleGeo = this._track(createSweepingRuffleGeometry({
      radius: 0.94,
      baseY: 0.118,
      waves: 14,
      radialAmp: 0.062,
      verticalAmp: 0.034,
      tubeRadius: 0.072,
      tubularSegments: 280,
    }));
    this.cakeGroup.add(new THREE.Mesh(bottomRuffleGeo, pipingMat));

    // 4. 侧面细腻的 8 拱白色垂坠花边 + 每处波峰下方垂落的 3 颗渐变小奶油珠
    const sideSwagGeo = this._track(createLambethSwagGeometry({
      radius: 0.908,
      topY: 0.61,
      drop: 0.11,
      arches: 8,
      tubeRadius: 0.021,
    }));
    this.cakeGroup.add(new THREE.Mesh(sideSwagGeo, pipingMat));

    const pearlDrops = [
      { y: 0.46, r: 0.021 },
      { y: 0.39, r: 0.017 },
      { y: 0.33, r: 0.013 },
    ];
    const dropGeo = this._track(new THREE.SphereGeometry(1, 10, 10));
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      for (const d of pearlDrops) {
        const dropMesh = new THREE.Mesh(dropGeo, pipingMat);
        dropMesh.scale.setScalar(d.r);
        dropMesh.position.set(Math.cos(a) * 0.908, d.y, Math.sin(a) * 0.908);
        this.cakeGroup.add(dropMesh);
      }
    }

    // 5. 顶面 6 颗饱满亮泽的深红新鲜车厘子（配白色星形奶油垫 + 自然弯曲绿果蒂）
    const cushionGeo = this._track(createFlutedCushionGeometry(0.106, 0.055));
    const cherryGeo = this._track(createCherryGeometry());
    const cherryMat = this._track(new THREE.MeshPhysicalMaterial({
      color: 0x6e0919,
      emissive: 0x1a0206,
      emissiveIntensity: 0.25,
      roughness: 0.07,
      metalness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      sheen: 0.35,
      sheenColor: new THREE.Color(0xb91c34),
    }));
    const stemMat = this._track(new THREE.MeshStandardMaterial({
      color: 0x556b38,
      roughness: 0.55,
      metalness: 0.02,
    }));

    const cherryRingR = 0.45;
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2 + 0.24;
      const cx = Math.cos(a) * cherryRingR;
      const cz = Math.sin(a) * cherryRingR;

      // 樱桃底下的小团白色奶油垫
      const cushion = new THREE.Mesh(cushionGeo, pipingMat);
      cushion.position.set(cx, 0.738, cz);
      cushion.rotation.y = a;
      this.cakeGroup.add(cushion);

      // 车厘子本体 + 弯曲果蒂组
      const cherryGroup = new THREE.Group();
      cherryGroup.position.set(cx, 0.775, cz);
      cherryGroup.rotation.set(
        Math.sin(i * 1.9) * 0.12,
        a + i * 0.6,
        Math.cos(i * 1.3) * 0.12
      );

      const fruit = new THREE.Mesh(cherryGeo, cherryMat);
      cherryGroup.add(fruit);

      const stemCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.165, 0),
        new THREE.Vector3(0.015, 0.255, 0.008),
        new THREE.Vector3(0.042, 0.345, 0.018),
        new THREE.Vector3(0.062, 0.395, 0.024),
      ]);
      const stemGeo = this._track(new THREE.TubeGeometry(stemCurve, 14, 0.0085, 6, false));
      cherryGroup.add(new THREE.Mesh(stemGeo, stemMat));

      const tipGeo = this._track(new THREE.SphereGeometry(0.012, 8, 8));
      const tip = new THREE.Mesh(tipGeo, stemMat);
      tip.position.set(0.062, 0.395, 0.024);
      cherryGroup.add(tip);

      this.cakeGroup.add(cherryGroup);
    }
  }

  _buildCandles() {
    this.candles = this.candleStyle === 'number'
      ? createAgeCandles(this.age)
      : createClassicCandles();
    // 稳稳立在 6 颗车厘子围成的中央空白处
    this.candles.root.position.set(0, 0.735, 0);
    this.cakeGroup.add(this.candles.root);
  }

  _buildPostIgniteSparkles() {
    const palette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xfff5f8),
      new THREE.Color(0xfde68a),
      new THREE.Color(0xf7d58b),
      new THREE.Color(0xffd6e7),
      new THREE.Color(0xfbcfe8),
    ];

    const createLayer = ({ count, tex, sizeMin, sizeMax, maxCssPx, speedMin, speedMax, bounds, riseSpeedRange, onCakeOnly = false }) => {
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
          const r = 0.25 + Math.random() * 0.72;
          x = Math.cos(a) * r;
          y = 0.12 + Math.random() * 0.78;
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
          driftAmp: onCakeOnly ? 0.015 : 0.06 + Math.random() * 0.12,
          phase: phases[i],
        });
      }

      const geo = this._track(new THREE.BufferGeometry());
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
      geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
      geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
      geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

      const mat = this._track(createTwinklePointsMaterial(tex, maxCssPx));
      const points = new THREE.Points(geo, mat);
      points.visible = false;
      this.scene.add(points);

      return { points, geo, mat, meta, count, bounds, onCakeOnly };
    };

    const fullBounds = { xMin: -3.2, xMax: 3.2, yMin: -1.1, yMax: 3.6, zMin: -2.4, zMax: 2.0 };

    this.diamondGlints = createLayer({
      count: 130,
      tex: this.glintTex,
      sizeMin: 0.08,
      sizeMax: 0.145,
      maxCssPx: 15.5,
      speedMin: 2.4,
      speedMax: 5.2,
      bounds: fullBounds,
      riseSpeedRange: [0.06, 0.18],
    });

    this.fairyDust = createLayer({
      count: 320,
      tex: this.starTex,
      sizeMin: 0.028,
      sizeMax: 0.056,
      maxCssPx: 6.5,
      speedMin: 2.6,
      speedMax: 5.8,
      bounds: fullBounds,
      riseSpeedRange: [0.10, 0.28],
    });

    this.microBokeh = createLayer({
      count: 85,
      tex: this.dotTex,
      sizeMin: 0.032,
      sizeMax: 0.066,
      maxCssPx: 8.0,
      speedMin: 1.5,
      speedMax: 3.2,
      bounds: fullBounds,
      riseSpeedRange: [0.05, 0.15],
    });

    this.crownShimmers = createLayer({
      count: 45,
      tex: this.glintTex,
      sizeMin: 0.038,
      sizeMax: 0.072,
      maxCssPx: 9.0,
      speedMin: 2.8,
      speedMax: 5.4,
      bounds: fullBounds,
      riseSpeedRange: [0.0, 0.015],
      onCakeOnly: true,
    });
    this.scene.remove(this.crownShimmers.points);
    this.cakeGroup.add(this.crownShimmers.points);

    this.sparkleLayers = [this.diamondGlints, this.fairyDust, this.microBokeh, this.crownShimmers];
  }

  _buildFireworks() {
    this.fireworkBursts = [];
    const burstCount = 5;
    const perBurst = 115;
    const colors = [0xffffff, 0xfde68a, 0xffd6e7, 0xfbcfe8, 0xf5d08a, 0xfff5f8];

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
        size: 0.11,
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
      new THREE.Vector3(-1.35, 2.35, -0.7),
      new THREE.Vector3(1.35, 2.45, -0.6),
      new THREE.Vector3(0.0, 2.85, -1.0),
      new THREE.Vector3(-1.0, 1.95, 0.4),
      new THREE.Vector3(1.0, 2.05, 0.4),
    ];

    this.fireworkBursts.forEach((burst, idx) => {
      const origin = origins[idx % origins.length];
      for (let i = 0; i < burst.count; i += 1) {
        burst.positions[i * 3] = origin.x;
        burst.positions[i * 3 + 1] = origin.y;
        burst.positions[i * 3 + 2] = origin.z;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 1.1 + Math.random() * 2.0;
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
    const fitPortraitDist = Math.min(11.0, Math.max(6.4, 1.68 / (halfTanY * Math.max(0.38, aspect))));

    if (this.state === 'wish') {
      this.targetCamOffset.set(0, isPortrait ? 2.25 : 2.05, isPortrait ? fitPortraitDist * 0.78 : 4.3);
      this.targetLookAt.set(0, isPortrait ? 0.56 : 0.72, 0);
    } else if (this.state === 'blown') {
      this.targetCamOffset.set(0, isPortrait ? 2.65 : 2.35, isPortrait ? fitPortraitDist * 1.06 : 5.9);
      this.targetLookAt.set(0, isPortrait ? 0.22 : 0.52, 0);
    } else {
      this.targetCamOffset.set(0, isPortrait ? 2.55 : 2.35, isPortrait ? fitPortraitDist : 5.3);
      this.targetLookAt.set(0, isPortrait ? 0.18 : 0.42, 0);
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

    const easeLight = this.state === 'intro' ? 0.62 : 0.62 + 0.38 * (1 - Math.pow(1 - this.lightProgress, 3));
    const easeSparkles = this.state === 'intro' ? 0 : 1 - Math.pow(1 - this.sparkleProgress, 2.2);

    this.ambient.intensity = THREE.MathUtils.lerp(0.45, 0.68, easeLight);
    this.keyLight.intensity = THREE.MathUtils.lerp(0.60, 1.15, easeLight);
    this.rimLight.intensity = THREE.MathUtils.lerp(0.32, 0.62, easeLight);
    this.frontFill.intensity = THREE.MathUtils.lerp(0.24, 0.44, easeLight);

    this.bgStars.material.opacity = this.state === 'intro' ? 0.03 : 0.28 * easeSparkles;

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
    this.glintTex.dispose();
    this.starTex.dispose();
    this.bodyTextures.map.dispose();
    this.bodyTextures.bumpMap.dispose();
    this.topTextures.map.dispose();
    this.topTextures.bumpMap.dispose();
    this.pipingTextures.map.dispose();
    this.pipingTextures.bumpMap.dispose();
    for (const item of this.extraDisposables) {
      if (typeof item.dispose === 'function') item.dispose();
    }
    this.controls.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
