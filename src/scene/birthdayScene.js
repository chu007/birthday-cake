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

// 纤细锐利的针状四角星芒贴图：极细交叉光线 + 微亮针尖核心（拒绝粗钝大菱形）
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

// 半透珠光奶白粉渐变蛋糕侧面贴图 + 竖向抹面凹凸纹理（轻盈通透感，不厚重实心）
function createTranslucentCakeSideTextures() {
  const w = 2048;
  const h = 512;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = w;
  albedoCanvas.height = h;
  const ctx = albedoCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bctx = bumpCanvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0.0, '#fffdf9');
  bg.addColorStop(0.54, '#fff6f9');
  bg.addColorStop(0.84, '#ffe5f0');
  bg.addColorStop(1.0, '#ffd4e6');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, w, h);

  // 竖向/斜向轻柔抹刀梳齿暗纹，在光照下有真实奶油肌理
  for (let x = 0; x < w; x += 16) {
    const shade = Math.round(128 + Math.sin((x / w) * Math.PI * 128) * 32);
    bctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    bctx.fillRect(x, 0, 8, h);
  }
  for (let y = 16; y < h - 16; y += 26) {
    ctx.fillStyle = 'rgba(255, 218, 232, 0.14)';
    ctx.fillRect(0, y, w, 2);
    bctx.fillStyle = 'rgba(165, 165, 165, 0.25)';
    bctx.fillRect(0, y, w, 3);
  }

  // 雅致香槟粉金手写体 "happy birthday"
  ctx.save();
  ctx.font = 'italic 500 28px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(245, 208, 138, 0.6)';
  ctx.shadowBlur = 4;
  ctx.fillStyle = 'rgba(210, 152, 168, 0.92)';
  const reps = 3;
  for (let i = 0; i < reps; i += 1) {
    const x = (w / reps) * (i + 0.5);
    ctx.fillText('happy birthday', x, h * 0.56);
  }
  ctx.restore();

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;

  return { map, bumpMap };
}

// 奶白螺旋抹面顶盘贴图 + 螺旋凹凸纹
function createCreamTopTextures() {
  const size = 1024;
  const cx = size / 2;
  const cy = size / 2;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const ctx = albedoCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d');

  const grad = ctx.createRadialGradient(cx, cy, 18, cx, cy, size * 0.5);
  grad.addColorStop(0.0, '#fffdf9');
  grad.addColorStop(0.65, '#fff7f7');
  grad.addColorStop(0.92, '#ffecf3');
  grad.addColorStop(1.0, '#ffe0ed');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);

  // 阿基米德螺旋抹面奶油纹理
  ctx.beginPath();
  bctx.beginPath();
  const turns = 11;
  const steps = turns * 80;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const r = 18 + t * (size * 0.43);
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
  ctx.strokeStyle = 'rgba(244, 212, 224, 0.36)';
  ctx.lineWidth = 5;
  ctx.stroke();

  bctx.strokeStyle = 'rgba(235, 235, 235, 0.85)';
  bctx.lineWidth = 10;
  bctx.stroke();

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);

  return { map, bumpMap };
}

// 连续花边裱花条纹理：沿 TubeGeometry 的 uv.y（截面圆周）挤出 12 道星形花嘴棱纹 + 细腻明暗沟槽
function createPipingStripeTexture(tintHex = '#fffdf9', grooveHex = '#f5dce6') {
  const size = 512;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const ctx = albedoCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d');

  ctx.fillStyle = tintHex;
  ctx.fillRect(0, 0, size, size);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);

  // 沿纵向 y 绘制 12 条高对比星形花嘴条纹
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
    bg.addColorStop(0.0, '#1e1e1e');
    bg.addColorStop(0.32, '#dcdcdc');
    bg.addColorStop(0.5, '#ffffff');
    bg.addColorStop(0.68, '#dcdcdc');
    bg.addColorStop(1.0, '#1e1e1e');
    bctx.fillStyle = bg;
    bctx.fillRect(0, y0, size, bandH + 1);
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap };
}

// 构造连续波浪褶皱奶油花边管道（一条无缝连续的法式奶油裱花环，彻底告别“分开的几坨”）
function createContinuousRuffledPipingGeometry({
  radius = 0.72,
  baseY = 0.84,
  waves = 22,
  radialAmp = 0.042,
  verticalAmp = 0.024,
  tubeRadius = 0.056,
  tubularSegments = 240,
}) {
  const pts = [];
  const totalSamples = waves * 8;
  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / totalSamples;
    const theta = t * Math.PI * 2;
    const r = radius + Math.sin(theta * waves) * radialAmp;
    const y = baseY + Math.cos(theta * waves) * verticalAmp;
    pts.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
  return new THREE.TubeGeometry(curve, tubularSegments, tubeRadius, 16, true);
}

// 亮晶晶闪烁粒子 Custom Shader（按设备 DPR 限制最大像素尺寸，保持精致细腻绝不变大粗点）
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
    this.sideTextures = createTranslucentCakeSideTextures();
    this.topTextures = createCreamTopTextures();
    this.whitePipingTex = createPipingStripeTexture('#fffdf9', '#edd0dc');
    this.blushPipingTex = createPipingStripeTexture('#fff3f7', '#ecc0d2');

    this._initRenderer();
    this._initScene();
    this._initPostProcessing();
    this._buildBackdropStars();
    this._buildAiryTrayAndLuminousCake();
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
    this.camera.position.set(0, 1.95, 5.6);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 14.0;
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

    // 多角度柔暖布光，让连续奶油裱花的星形条纹清晰立体
    this.ambient = new THREE.AmbientLight(0xfff0f5, 0.68);
    this.scene.add(this.ambient);

    this.keyLight = new THREE.DirectionalLight(0xfffaf0, 1.12);
    this.keyLight.position.set(3.4, 4.6, 3.6);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0xffd6e7, 0.85);
    this.rimLight.position.set(-3.4, 3.4, -2.6);
    this.scene.add(this.rimLight);

    this.cakeGroup = new THREE.Group();
    this.scene.add(this.cakeGroup);

    this.targetCamOffset = new THREE.Vector3(0, 1.95, 5.6);
    this.targetLookAt = new THREE.Vector3(0, 0.56, 0);
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
      0.42,
      0.82
    );
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
  }

  _buildBackdropStars() {
    const count = 120;
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
      opacity: 0.06,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    this.bgStars = new THREE.Points(geo, mat);
    this.scene.add(this.bgStars);
  }

  _buildAiryTrayAndLuminousCake() {
    // 1. 轻盈磨砂平底托盘（半透珍珠白，减少厚重实心感 + 细香槟金镶边）
    const trayGeo = this._track(new THREE.CylinderGeometry(1.26, 1.24, 0.024, 72));
    const trayMat = this._track(new THREE.MeshPhysicalMaterial({
      color: 0xfff8fa,
      emissive: 0xffeef4,
      emissiveIntensity: 0.14,
      transparent: true,
      opacity: 0.58,
      roughness: 0.24,
      metalness: 0.04,
      clearcoat: 0.55,
      clearcoatRoughness: 0.16,
    }));
    this.tray = new THREE.Mesh(trayGeo, trayMat);
    this.tray.position.y = 0.012;
    this.cakeGroup.add(this.tray);

    const trayRimGeo = this._track(new THREE.TorusGeometry(1.26, 0.0085, 10, 84));
    const goldMat = this._track(new THREE.MeshStandardMaterial({
      color: 0xf5d08a,
      emissive: 0x6b4d18,
      emissiveIntensity: 0.25,
      metalness: 0.72,
      roughness: 0.22,
    }));
    const trayRim = new THREE.Mesh(trayRimGeo, goldMat);
    trayRim.rotation.x = Math.PI / 2;
    trayRim.position.y = 0.018;
    this.cakeGroup.add(trayRim);

    // 2. 通透轻盈的蛋糕体：无底盖半透柔光内芯 + 珠光奶白粉薄纱外衣 + 表面微粒子星纱
    const innerGlowGeo = this._track(new THREE.CylinderGeometry(0.76, 0.76, 0.78, 48, 1, true));
    const innerGlowMat = this._track(new THREE.MeshBasicMaterial({
      color: 0xffedf4,
      transparent: true,
      opacity: 0.30,
      depthWrite: false,
    }));
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    innerGlow.position.y = 0.42;
    this.cakeGroup.add(innerGlow);

    const bodyGeo = this._track(new THREE.CylinderGeometry(0.80, 0.80, 0.80, 72, 1, true));
    const bodyMat = this._track(new THREE.MeshPhysicalMaterial({
      map: this.sideTextures.map,
      bumpMap: this.sideTextures.bumpMap,
      bumpScale: 0.015,
      emissive: 0xfff0f6,
      emissiveIntensity: 0.16,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      roughness: 0.34,
      metalness: 0.02,
      clearcoat: 0.25,
      sheen: 0.75,
      sheenColor: new THREE.Color(0xffe4ef),
    }));
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.425;
    this.cakeGroup.add(bodyMesh);

    // 螺旋纹理奶油顶盘（半透柔润奶油感）
    const topGeo = this._track(new THREE.CylinderGeometry(0.79, 0.80, 0.032, 72));
    const topMat = this._track(new THREE.MeshPhysicalMaterial({
      map: this.topTextures.map,
      bumpMap: this.topTextures.bumpMap,
      bumpScale: 0.026,
      emissive: 0xfff5f8,
      emissiveIntensity: 0.14,
      transparent: true,
      opacity: 0.86,
      roughness: 0.38,
      metalness: 0.02,
      sheen: 0.65,
      sheenColor: new THREE.Color(0xffffff),
    }));
    const topDisk = new THREE.Mesh(topGeo, topMat);
    topDisk.position.y = 0.835;
    this.cakeGroup.add(topDisk);

    // 3. 蛋糕体表面 2200 颗极细微粒光纱（形成空气感奶油轮廓，彻底告别厚重实心块）
    const veilCount = 2200;
    const veilPos = new Float32Array(veilCount * 3);
    const veilCol = new Float32Array(veilCount * 3);
    const veilSizes = new Float32Array(veilCount);
    const veilPhases = new Float32Array(veilCount);
    const veilSpeeds = new Float32Array(veilCount);
    const veilPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xfff5f8),
      new THREE.Color(0xffd6e7),
      new THREE.Color(0xfde68a),
    ];

    for (let i = 0; i < veilCount; i += 1) {
      const a = Math.random() * Math.PI * 2;
      let r;
      let y;
      if (i < 1500) {
        // 筒身竖向微粒褶皱
        const pleat = Math.sin(a * 32) * 0.008;
        r = 0.798 + pleat + (Math.random() - 0.5) * 0.018;
        y = 0.035 + Math.random() * 0.79;
      } else if (i < 1950) {
        // 顶缘奶油花边微光粒子
        r = 0.45 + Math.random() * 0.36;
        y = 0.83 + Math.random() * 0.045;
      } else {
        // 托盘细微光边粒子
        r = 1.24 + (Math.random() - 0.5) * 0.03;
        y = 0.02 + Math.random() * 0.015;
      }

      veilPos[i * 3] = Math.cos(a) * r;
      veilPos[i * 3 + 1] = y;
      veilPos[i * 3 + 2] = Math.sin(a) * r;

      const c = veilPalette[i % veilPalette.length];
      veilCol[i * 3] = c.r;
      veilCol[i * 3 + 1] = c.g;
      veilCol[i * 3 + 2] = c.b;

      veilSizes[i] = 0.014 + Math.random() * 0.022;
      veilPhases[i] = Math.random() * Math.PI * 2;
      veilSpeeds[i] = 1.2 + Math.random() * 2.2;
    }

    const veilGeo = this._track(new THREE.BufferGeometry());
    veilGeo.setAttribute('position', new THREE.BufferAttribute(veilPos, 3));
    veilGeo.setAttribute('aColor', new THREE.BufferAttribute(veilCol, 3));
    veilGeo.setAttribute('aSize', new THREE.BufferAttribute(veilSizes, 1));
    veilGeo.setAttribute('aPhase', new THREE.BufferAttribute(veilPhases, 1));
    veilGeo.setAttribute('aSpeed', new THREE.BufferAttribute(veilSpeeds, 1));

    this.cakeVeilMat = this._track(createTwinklePointsMaterial(this.dotTex, 3.6));
    this.cakeVeilPoints = new THREE.Points(veilGeo, this.cakeVeilMat);
    this.cakeGroup.add(this.cakeVeilPoints);

    // 4. 连续的星形花嘴带纹理白色奶油裱花（一条完整无缝的法式花边环，绝不是分开的一坨坨！）
    const whitePipingMat = this._track(new THREE.MeshPhysicalMaterial({
      map: this.whitePipingTex.map,
      bumpMap: this.whitePipingTex.bumpMap,
      bumpScale: 0.032,
      color: 0xfffdfb,
      emissive: 0xfff0f6,
      emissiveIntensity: 0.12,
      transparent: true,
      opacity: 0.92,
      roughness: 0.42,
      metalness: 0.01,
      sheen: 0.65,
      sheenColor: new THREE.Color(0xffffff),
    }));

    const blushPipingMat = this._track(new THREE.MeshPhysicalMaterial({
      map: this.blushPipingTex.map,
      bumpMap: this.blushPipingTex.bumpMap,
      bumpScale: 0.028,
      color: 0xfff4f8,
      emissive: 0xffd6e7,
      emissiveIntensity: 0.10,
      transparent: true,
      opacity: 0.90,
      roughness: 0.42,
      metalness: 0.01,
      sheen: 0.65,
      sheenColor: new THREE.Color(0xffd6e7),
    }));

    // 顶部外圈连续波浪花边奶油裱花环
    const outerLaceGeo = this._track(createContinuousRuffledPipingGeometry({
      radius: 0.71,
      baseY: 0.858,
      waves: 22,
      radialAmp: 0.044,
      verticalAmp: 0.022,
      tubeRadius: 0.056,
      tubularSegments: 240,
    }));
    const outerLace = new THREE.Mesh(outerLaceGeo, whitePipingMat);
    this.cakeGroup.add(outerLace);

    // 顶部内圈精致淡粉白细纹奶油波浪环
    const innerLaceGeo = this._track(createContinuousRuffledPipingGeometry({
      radius: 0.51,
      baseY: 0.850,
      waves: 16,
      radialAmp: 0.032,
      verticalAmp: 0.016,
      tubeRadius: 0.036,
      tubularSegments: 192,
    }));
    const innerLace = new THREE.Mesh(innerLaceGeo, blushPipingMat);
    this.cakeGroup.add(innerLace);

    // 底座接缝处连续的奶油褶皱围边
    const baseLaceGeo = this._track(createContinuousRuffledPipingGeometry({
      radius: 0.808,
      baseY: 0.052,
      waves: 28,
      radialAmp: 0.024,
      verticalAmp: 0.014,
      tubeRadius: 0.032,
      tubularSegments: 224,
    }));
    const baseLace = new THREE.Mesh(baseLaceGeo, blushPipingMat);
    this.cakeGroup.add(baseLace);
  }

  _buildCandles() {
    this.candles = this.candleStyle === 'number'
      ? createAgeCandles(this.age)
      : createClassicCandles();
    this.candles.root.position.set(0, 0.85, 0);
    this.cakeGroup.add(this.candles.root);
  }

  _buildPostIgniteSparkles() {
    // 严格在点蜡烛后才出现，且不限制在任何圆圈内，粒子极细小精致（绝不大颗粗钝）
    const palette = [
      new THREE.Color(0xffffff), // 钻石白
      new THREE.Color(0xfff5f8), // 珍珠白
      new THREE.Color(0xfde68a), // 香槟金
      new THREE.Color(0xf7d58b), // 暖金
      new THREE.Color(0xffd6e7), // 淡樱粉
      new THREE.Color(0xfbcfe8), // 柔粉
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
          const r = 0.25 + Math.random() * 0.56;
          x = Math.cos(a) * r;
          y = 0.08 + Math.random() * 0.86;
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

    // 1. 极细针状钻石星芒（最大仅 15.5 CSS px，璀璨亮晶晶闪烁）
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

    // 2. 细腻仙女金粉微尘（最大仅 6.5 CSS px，精致小星点铺满夜空）
    this.fairyDust = createLayer({
      count: 340,
      tex: this.starTex,
      sizeMin: 0.028,
      sizeMax: 0.058,
      maxCssPx: 6.5,
      speedMin: 2.6,
      speedMax: 5.8,
      bounds: fullBounds,
      riseSpeedRange: [0.10, 0.28],
    });

    // 3. 精致微光小圆点（最大仅 8.0 CSS px，绝无大坨模糊球）
    this.microBokeh = createLayer({
      count: 90,
      tex: this.dotTex,
      sizeMin: 0.032,
      sizeMax: 0.068,
      maxCssPx: 8.0,
      speedMin: 1.5,
      speedMax: 3.2,
      bounds: fullBounds,
      riseSpeedRange: [0.05, 0.15],
    });

    // 4. 点亮后才在白色奶油裱花上闪耀的细微星芒
    this.crownShimmers = createLayer({
      count: 55,
      tex: this.glintTex,
      sizeMin: 0.038,
      sizeMax: 0.075,
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
      this.cakeVeilMat.uniforms.uPixelRatio.value = pr;
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
    // 去掉多余外圈后，拉近构图让细腻的奶油裱花纹理与通透光感成为绝对主角
    const fitPortraitDist = Math.min(10.5, Math.max(6.2, 1.56 / (halfTanY * Math.max(0.38, aspect))));

    if (this.state === 'wish') {
      this.targetCamOffset.set(0, isPortrait ? 1.95 : 1.75, isPortrait ? fitPortraitDist * 0.78 : 4.2);
      this.targetLookAt.set(0, isPortrait ? 0.56 : 0.72, 0);
    } else if (this.state === 'blown') {
      this.targetCamOffset.set(0, isPortrait ? 2.25 : 2.05, isPortrait ? fitPortraitDist * 1.06 : 5.8);
      this.targetLookAt.set(0, isPortrait ? 0.25 : 0.58, 0);
    } else {
      this.targetCamOffset.set(0, isPortrait ? 2.10 : 1.85, isPortrait ? fitPortraitDist : 5.2);
      this.targetLookAt.set(0, isPortrait ? 0.22 : 0.52, 0);
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

    const easeLight = this.state === 'intro' ? 0.56 : 0.56 + 0.44 * (1 - Math.pow(1 - this.lightProgress, 3));
    const easeSparkles = this.state === 'intro' ? 0 : 1 - Math.pow(1 - this.sparkleProgress, 2.2);

    this.ambient.intensity = THREE.MathUtils.lerp(0.38, 0.68, easeLight);
    this.keyLight.intensity = THREE.MathUtils.lerp(0.50, 1.12, easeLight);
    this.rimLight.intensity = THREE.MathUtils.lerp(0.38, 0.85, easeLight);

    this.cakeVeilMat.uniforms.uTime.value = this.elapsed;
    this.cakeVeilMat.uniforms.uOpacity.value = this.state === 'intro' ? 0.52 : 0.86;

    this.bgStars.material.opacity = this.state === 'intro' ? 0.04 : 0.32 * easeSparkles;

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
    this.sideTextures.map.dispose();
    this.sideTextures.bumpMap.dispose();
    this.topTextures.map.dispose();
    this.topTextures.bumpMap.dispose();
    this.whitePipingTex.map.dispose();
    this.whitePipingTex.bumpMap.dispose();
    this.blushPipingTex.map.dispose();
    this.blushPipingTex.bumpMap.dispose();
    for (const item of this.extraDisposables) {
      if (typeof item.dispose === 'function') item.dispose();
    }
    this.controls.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
