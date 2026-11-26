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
  grad.addColorStop(0.68, 'rgba(255, 255, 255, 0.22)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
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

  const coreGlow = ctx.createRadialGradient(cx, cy, 1, cx, cy, size * 0.36);
  coreGlow.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  coreGlow.addColorStop(0.25, 'rgba(255, 248, 225, 0.68)');
  coreGlow.addColorStop(1.0, 'rgba(255, 240, 200, 0.0)');
  ctx.fillStyle = coreGlow;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const longR = size * 0.47;
  const innerR = size * 0.048;
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

  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, size * 0.44);
  glow.addColorStop(0.0, 'rgba(255, 255, 255, 0.72)');
  glow.addColorStop(0.42, 'rgba(255, 255, 255, 0.16)');
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

// 奶白微粉渐变奶油蛋糕侧面贴图（2048x512）：柔和奶油白 -> 底部淡樱粉晕染 + 细碎香槟金箔 + 雅致粉金 happy birthday
function createCreamCakeSideTextures() {
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

  // 奶白主色 + 底部淡淡樱花粉渐变
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0.0, '#fffdf9');
  bg.addColorStop(0.55, '#fff7f8');
  bg.addColorStop(0.84, '#ffe8f0');
  bg.addColorStop(1.0, '#ffd8e8');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ectx.fillStyle = '#000000';
  ectx.fillRect(0, 0, w, h);

  // 极轻微的奶油抹面水平纹理，显得真实细腻
  for (let y = 18; y < h - 18; y += 22) {
    ctx.fillStyle = `rgba(244, 210, 224, ${0.06 + Math.random() * 0.05})`;
    ctx.fillRect(0, y, w, 2);
  }

  // 细碎高雅的香槟金箔与珍珠细闪微粒
  const glitterColors = ['#f5d08a', '#fde68a', '#fbcfe8', '#ffffff'];
  for (let i = 0; i < 220; i += 1) {
    const x = Math.random() * w;
    const y = 24 + Math.random() * (h - 48);
    const r = 1.6 + Math.random() * 3.8;
    const col = glitterColors[i % glitterColors.length];

    ctx.save();
    ctx.globalAlpha = 0.68;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (i % 3 === 0) {
      ectx.save();
      ectx.globalAlpha = 0.35;
      ectx.fillStyle = col;
      ectx.beginPath();
      ectx.arc(x, y, r * 0.9, 0, Math.PI * 2);
      ectx.fill();
      ectx.restore();
    }
  }

  // 雅致香槟粉金手写体 "happy birthday" 印在蛋糕中下部
  const drawText = (targetCtx, col, blur) => {
    targetCtx.save();
    targetCtx.font = 'italic 500 30px Georgia, "Times New Roman", serif';
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';
    if (blur > 0) {
      targetCtx.shadowColor = 'rgba(245, 208, 138, 0.75)';
      targetCtx.shadowBlur = blur;
    }
    targetCtx.fillStyle = col;
    const reps = 3;
    for (let i = 0; i < reps; i += 1) {
      const x = (w / reps) * (i + 0.5);
      targetCtx.fillText('happy birthday', x, h * 0.58);
    }
    targetCtx.restore();
  };
  drawText(ctx, 'rgba(196, 138, 152, 0.88)', 4);
  drawText(ectx, 'rgba(245, 208, 138, 0.25)', 6);

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.colorSpace = THREE.SRGBColorSpace;

  return { map, emissiveMap };
}

// 奶白奶油抹面顶盘贴图（1024x1024）：细腻螺旋抹面纹理 + 中心淡粉暖光
function createCreamTopTexture() {
  const size = 1024;
  const cx = size / 2;
  const cy = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(cx, cy, 18, cx, cy, size * 0.5);
  grad.addColorStop(0.0, '#fffdf9');
  grad.addColorStop(0.6, '#fff8f6');
  grad.addColorStop(0.9, '#ffeff4');
  grad.addColorStop(1.0, '#ffe3ee');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // 同心细腻奶油抹刀旋纹
  for (let r = 45; r < size * 0.46; r += 26) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(244, 212, 224, 0.28)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 构造星形花嘴挤出的 3D 立体奶油裱花花朵几何体（带 7 瓣花纹褶皱与螺旋尖顶）
function createWhippedRosetteGeometry(outerR = 0.085, height = 0.115) {
  const geo = new THREE.CylinderGeometry(0.008, outerR, height, 28, 12, false);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 0.002) continue;

    // 高度归一化 0 (底) .. 1 (顶)，防止浮点误差出现负数导致 Math.pow 返回 NaN
    const hNorm = Math.min(1, Math.max(0, (y + height / 2) / height));
    const angle = Math.atan2(z, x);

    // 鼓润饱满的塔身曲线 + 星形裱花花嘴 7 瓣螺旋褶皱
    const bulge = Math.sin(Math.pow(Math.max(0, 1 - hNorm), 0.65) * Math.PI * 0.88);
    const fluted = 1 + 0.19 * Math.cos(angle * 7 + hNorm * 3.8);
    const targetR = outerR * (0.14 + 0.92 * bulge) * fluted * (1 - 0.58 * Math.pow(hNorm, 1.5));

    const scale = targetR / r;
    pos.setX(i, x * scale);
    pos.setZ(i, z * scale);
    // 顶部略微弯曲成奶油小尖
    pos.setY(i, y + height / 2);
  }
  geo.computeVertexNormals();
  return geo;
}

// 亮晶晶闪烁粒子 Custom Shader（支持每颗粒子独立闪烁相位与速度，点亮后才绽放）
function createTwinklePointsMaterial(texture) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uMap: { value: texture },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aPhase;
      attribute float aSpeed;
      attribute vec3 aColor;

      uniform float uTime;
      uniform float uPixelRatio;

      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vColor = aColor;
        float wave = 0.5 + 0.5 * sin(uTime * aSpeed + aPhase);
        vTwinkle = 0.38 + 0.62 * pow(wave, 2.2);

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPixelRatio * (860.0 / max(1.5, -mvPosition.z)) * (0.75 + 0.55 * vTwinkle);
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
        gl_FragColor = vec4(vColor * tex.rgb * (1.35 + 0.75 * vTwinkle), alpha);
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
    this.sideTextures = createCreamCakeSideTextures();
    this.topTex = createCreamTopTexture();

    this._initRenderer();
    this._initScene();
    this._initPostProcessing();
    this._buildBackdropStars();
    this._buildFlatTrayAndCreamCake();
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
    this.camera.position.set(0, 2.25, 7.2);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 3.8;
    this.controls.maxDistance = 18.0;
    this.controls.minPolarAngle = Math.PI * 0.22;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.42;

    this.userDragging = false;
    this.controls.addEventListener('start', () => {
      this.userDragging = true;
    });
    this.controls.addEventListener('end', () => {
      this.userDragging = false;
    });

    // 柔暖奶油棚拍布光：凸显白色奶油裱花的立体起伏阴影，不过曝死白
    this.ambient = new THREE.AmbientLight(0xfff0f5, 0.72);
    this.scene.add(this.ambient);

    this.keyLight = new THREE.DirectionalLight(0xfffaf0, 1.05);
    this.keyLight.position.set(3.2, 4.8, 3.8);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0xffd6e7, 0.75);
    this.rimLight.position.set(-3.4, 3.6, -2.8);
    this.scene.add(this.rimLight);

    this.cakeGroup = new THREE.Group();
    this.scene.add(this.cakeGroup);

    this.targetCamOffset = new THREE.Vector3(0, 2.25, 7.2);
    this.targetLookAt = new THREE.Vector3(0, 0.85, 0);
    this.camTransition = 0;
  }

  _initPostProcessing() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // 提高 threshold 至 0.80，让纯白奶油裱花保持细腻立体阴影，而火苗与星芒亮晶晶发光
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.44,
      0.44,
      0.80
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
      size: 0.065,
      map: this.dotTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    this.bgStars = new THREE.Points(geo, mat);
    this.scene.add(this.bgStars);
  }

  _buildFlatTrayAndCreamCake() {
    // 1. 简约平底托盘（去掉厚重盘沿立体感，改为扁平珠光白圆托盘 + 细香槟金镶边）
    const trayGeo = this._track(new THREE.CylinderGeometry(1.30, 1.28, 0.032, 72));
    const trayMat = this._track(new THREE.MeshPhysicalMaterial({
      color: 0xfff9f7,
      emissive: 0xfff0f5,
      emissiveIntensity: 0.08,
      roughness: 0.28,
      metalness: 0.04,
      clearcoat: 0.6,
      clearcoatRoughness: 0.18,
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

    // 2. 小巧雅致的白色奶油蛋糕（radius = 0.80, height = 0.84 -> 更矮更精致）
    const bodyGeo = this._track(new THREE.CylinderGeometry(0.80, 0.80, 0.84, 72, 1, true));
    const bodyMat = this._track(new THREE.MeshPhysicalMaterial({
      map: this.sideTextures.map,
      emissive: 0xffffff,
      emissiveMap: this.sideTextures.emissiveMap,
      emissiveIntensity: 0.45,
      roughness: 0.36,
      metalness: 0.02,
      clearcoat: 0.22,
      sheen: 0.65,
      sheenColor: new THREE.Color(0xffe4ef),
    }));
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.452;
    this.cakeGroup.add(bodyMesh);

    const topGeo = this._track(new THREE.CylinderGeometry(0.79, 0.80, 0.036, 72));
    const topMat = this._track(new THREE.MeshPhysicalMaterial({
      map: this.topTex,
      roughness: 0.38,
      metalness: 0.02,
      clearcoat: 0.18,
      sheen: 0.55,
      sheenColor: new THREE.Color(0xfff0f5),
    }));
    const topDisk = new THREE.Mesh(topGeo, topMat);
    topDisk.position.y = 0.875;
    this.cakeGroup.add(topDisk);

    // 3. 蛋糕底座一圈交替排列的奶白 / 淡粉 / 香槟金小珍珠围边
    const pearlColors = [0xfffaf7, 0xfbcfe8, 0xf5d08a];
    const pearlMats = pearlColors.map((col, idx) =>
      this._track(new THREE.MeshPhysicalMaterial({
        color: col,
        roughness: idx === 2 ? 0.22 : 0.26,
        metalness: idx === 2 ? 0.58 : 0.06,
        clearcoat: 0.6,
      }))
    );
    const basePearlGeo = this._track(new THREE.SphereGeometry(0.028, 12, 10));
    const basePearlCount = 42;
    for (let i = 0; i < basePearlCount; i += 1) {
      const a = (i / basePearlCount) * Math.PI * 2;
      const pearl = new THREE.Mesh(basePearlGeo, pearlMats[i % pearlMats.length]);
      pearl.position.set(Math.cos(a) * 0.815, 0.055, Math.sin(a) * 0.815);
      this.cakeGroup.add(pearl);
    }

    // 4. 蛋糕顶部 3D 立体白色奶油裱花（16 朵星形花嘴外圈花朵 + 8 朵内圈小奶油花 + 细微粉金珍珠点缀）
    const creamMat = this._track(new THREE.MeshPhysicalMaterial({
      color: 0xfffdfb,
      emissive: 0xffeef4,
      emissiveIntensity: 0.08,
      roughness: 0.42,
      metalness: 0.01,
      sheen: 0.6,
      sheenColor: new THREE.Color(0xfff5f8),
    }));
    const blushCreamMat = this._track(new THREE.MeshPhysicalMaterial({
      color: 0xfff0f6,
      emissive: 0xffd6e7,
      emissiveIntensity: 0.07,
      roughness: 0.42,
      metalness: 0.01,
      sheen: 0.6,
      sheenColor: new THREE.Color(0xffd6e7),
    }));

    const outerRosetteGeo = this._track(createWhippedRosetteGeometry(0.095, 0.118));
    const innerRosetteGeo = this._track(createWhippedRosetteGeometry(0.066, 0.082));
    const tinyPearlGeo = this._track(new THREE.SphereGeometry(0.020, 10, 10));

    // 外圈 16 朵饱满白色奶油裱花，花谷间点缀小颗香槟金与淡粉珍珠
    const outerCount = 16;
    for (let i = 0; i < outerCount; i += 1) {
      const a = (i / outerCount) * Math.PI * 2;
      const rosette = new THREE.Mesh(outerRosetteGeo, creamMat);
      rosette.position.set(Math.cos(a) * 0.66, 0.885, Math.sin(a) * 0.66);
      rosette.rotation.y = a + i * 0.5;
      this.cakeGroup.add(rosette);

      const valleyAngle = a + Math.PI / outerCount;
      const pearl = new THREE.Mesh(tinyPearlGeo, pearlMats[(i % 2) + 1]);
      pearl.position.set(Math.cos(valleyAngle) * 0.68, 0.905, Math.sin(valleyAngle) * 0.68);
      this.cakeGroup.add(pearl);
    }

    // 内圈 8 朵雅致淡粉白奶油小花，环绕中央蜡烛
    const innerCount = 8;
    for (let i = 0; i < innerCount; i += 1) {
      const a = (i / innerCount) * Math.PI * 2 + 0.2;
      const puff = new THREE.Mesh(innerRosetteGeo, i % 2 === 0 ? blushCreamMat : creamMat);
      puff.position.set(Math.cos(a) * 0.45, 0.885, Math.sin(a) * 0.45);
      puff.rotation.y = -a;
      this.cakeGroup.add(puff);
    }

    // 5. 正侧面一朵精致的淡粉色缎带蝴蝶结（法式奶油蛋糕轻奢点睛）
    const bowGroup = new THREE.Group();
    bowGroup.position.set(0.32, 0.64, 0.745);
    bowGroup.rotation.y = 0.42;
    const bowMat = this._track(new THREE.MeshPhysicalMaterial({
      color: 0xffd2e3,
      roughness: 0.34,
      metalness: 0.05,
      sheen: 0.75,
      sheenColor: new THREE.Color(0xffffff),
    }));
    const loopGeo = this._track(new THREE.TorusGeometry(0.052, 0.017, 10, 22));
    const leftLoop = new THREE.Mesh(loopGeo, bowMat);
    leftLoop.position.set(-0.045, 0.01, 0);
    leftLoop.scale.set(1.2, 0.72, 0.6);
    leftLoop.rotation.z = 0.25;
    bowGroup.add(leftLoop);

    const rightLoop = new THREE.Mesh(loopGeo, bowMat);
    rightLoop.position.set(0.045, 0.01, 0);
    rightLoop.scale.set(1.2, 0.72, 0.6);
    rightLoop.rotation.z = -0.25;
    bowGroup.add(rightLoop);

    const knotGeo = this._track(new THREE.SphereGeometry(0.022, 10, 10));
    const knot = new THREE.Mesh(knotGeo, bowMat);
    bowGroup.add(knot);

    const tailGeo = this._track(new THREE.CylinderGeometry(0.012, 0.018, 0.14, 8));
    const leftTail = new THREE.Mesh(tailGeo, bowMat);
    leftTail.scale.set(1, 1, 0.35);
    leftTail.position.set(-0.032, -0.068, 0.005);
    leftTail.rotation.z = -0.26;
    bowGroup.add(leftTail);

    const rightTail = new THREE.Mesh(tailGeo, bowMat);
    rightTail.scale.set(1, 1, 0.35);
    rightTail.position.set(0.032, -0.068, 0.005);
    rightTail.rotation.z = 0.26;
    bowGroup.add(rightTail);

    this.cakeGroup.add(bowGroup);
  }

  _buildWideAiryArchAbove() {
    // 显著拉高、拉大（半径 2.22..2.38，远大于 1.30 平底托盘），断续若隐若现的白金粉微光细弧
    this.domeArcMaterials = [];

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

          vec3 col = mix(vec3(1.0, 0.94, 0.96), vec3(0.99, 0.90, 0.68), 0.45);
          float alpha = rim * plateFade * (0.25 + 0.75 * wisp) * 0.48 * pulse * uOpacity;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    }));

    const domeShell = new THREE.Mesh(domeGeo, this.domeShellMat);
    domeShell.position.y = 1.45;
    this.cakeGroup.add(domeShell);

    const arcSpecs = [
      { radius: 2.24, centerY: 1.44, rotY: 0.15, freq: 3.0, phase: 0.4, speed: 0.22, color: new THREE.Color(0xfef3c7), peakAlpha: 0.52 },
      { radius: 2.31, centerY: 1.46, rotY: 1.35, freq: 3.5, phase: 2.1, speed: -0.18, color: new THREE.Color(0xfff5f8), peakAlpha: 0.42 },
      { radius: 2.37, centerY: 1.45, rotY: 2.45, freq: 2.5, phase: 4.0, speed: 0.15, color: new THREE.Color(0xfde68a), peakAlpha: 0.36 },
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
      const tubeGeo = this._track(new THREE.TubeGeometry(curve, 80, 0.0044, 6, false));

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
      this.cakeGroup.add(mesh);
      this.domeArcMaterials.push(arcMat);
    }
  }

  _buildCandles() {
    this.candles = this.candleStyle === 'number'
      ? createAgeCandles(this.age)
      : createClassicCandles();
    this.candles.root.position.set(0, 0.88, 0);
    this.cakeGroup.add(this.candles.root);
  }

  _buildFreeSparkles() {
    // 严格在点蜡烛后才出现，且不限制在圆圈内，自由散落飘浮于整片夜空
    const palette = [
      new THREE.Color(0xffffff), // 钻石白
      new THREE.Color(0xfff5f8), // 珍珠白
      new THREE.Color(0xfde68a), // 香槟金
      new THREE.Color(0xf7d58b), // 暖金
      new THREE.Color(0xffd6e7), // 淡樱粉
      new THREE.Color(0xfbcfe8), // 柔粉
    ];

    const createLayer = ({ count, tex, sizeMin, sizeMax, speedMin, speedMax, bounds, riseSpeedRange, onCakeOnly = false }) => {
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
          const r = 0.28 + Math.random() * 0.56;
          x = Math.cos(a) * r;
          y = 0.10 + Math.random() * 0.92;
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

      const mat = this._track(createTwinklePointsMaterial(tex));
      const points = new THREE.Points(geo, mat);
      points.visible = false;
      this.scene.add(points);

      return { points, geo, mat, meta, count, bounds, onCakeOnly };
    };

    const fullBounds = { xMin: -3.5, xMax: 3.5, yMin: -1.35, yMax: 4.5, zMin: -2.6, zMax: 2.4 };

    // 1. 钻石四角星芒：强闪烁亮晶晶效果，自由飘满全屏
    this.diamondGlints = createLayer({
      count: 140,
      tex: this.glintTex,
      sizeMin: 0.14,
      sizeMax: 0.32,
      speedMin: 2.2,
      speedMax: 4.8,
      bounds: fullBounds,
      riseSpeedRange: [0.08, 0.22],
    });

    // 2. 柔美粉白金散景光斑：自由漂浮在全屏夜空中
    this.blushBokeh = createLayer({
      count: 110,
      tex: this.dotTex,
      sizeMin: 0.10,
      sizeMax: 0.25,
      speedMin: 1.4,
      speedMax: 3.0,
      bounds: fullBounds,
      riseSpeedRange: [0.06, 0.18],
    });

    // 3. 细腻星尘微粒：从蛋糕及整片画幅自由上升闪烁
    this.microStardust = createLayer({
      count: 260,
      tex: this.starTex,
      sizeMin: 0.055,
      sizeMax: 0.135,
      speedMin: 2.5,
      speedMax: 5.5,
      bounds: fullBounds,
      riseSpeedRange: [0.14, 0.34],
    });

    // 4. 点缀在白色奶油裱花与蛋糕身上的亮晶晶小星芒（同样只在点亮后出现）
    this.crownShimmers = createLayer({
      count: 60,
      tex: this.glintTex,
      sizeMin: 0.08,
      sizeMax: 0.16,
      speedMin: 2.6,
      speedMax: 5.0,
      bounds: fullBounds,
      riseSpeedRange: [0.0, 0.02],
      onCakeOnly: true,
    });
    // 把蛋糕体表面的亮晶晶挂到 cakeGroup 上随蛋糕一起旋转
    this.scene.remove(this.crownShimmers.points);
    this.cakeGroup.add(this.crownShimmers.points);

    this.sparkleLayers = [this.diamondGlints, this.blushBokeh, this.microStardust, this.crownShimmers];
  }

  _buildFireworks() {
    this.fireworkBursts = [];
    const burstCount = 5;
    const perBurst = 115;
    // 烟花配色与蛋糕统一：珍珠白、香槟金、樱粉、玫瑰金
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
        size: 0.17,
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
      for (const layer of this.sparkleLayers) {
        layer.mat.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);
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
    // 让直径 4.76 的拉高拉大外圈在 390px 竖屏两侧留白完整入画
    const fitPortraitDist = Math.min(16.0, Math.max(9.6, 2.48 / (halfTanY * Math.max(0.38, aspect))));

    if (this.state === 'wish') {
      this.targetCamOffset.set(0, isPortrait ? 2.45 : 2.35, isPortrait ? fitPortraitDist * 0.72 : 6.2);
      this.targetLookAt.set(0, isPortrait ? 0.68 : 1.05, 0);
    } else if (this.state === 'blown') {
      this.targetCamOffset.set(0, isPortrait ? 2.95 : 2.55, isPortrait ? fitPortraitDist * 1.02 : 9.4);
      this.targetLookAt.set(0, isPortrait ? 0.35 : 1.08, 0);
    } else {
      this.targetCamOffset.set(0, isPortrait ? 2.75 : 2.45, isPortrait ? fitPortraitDist : 9.2);
      this.targetLookAt.set(0, isPortrait ? 0.30 : 1.04, 0);
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
      this.sparkleProgress = Math.min(1, this.sparkleProgress + dt * 0.72);
    }

    const easeLight = this.state === 'intro' ? 0.55 : 0.55 + 0.45 * (1 - Math.pow(1 - this.lightProgress, 3));
    const easeSparkles = this.state === 'intro' ? 0 : 1 - Math.pow(1 - this.sparkleProgress, 2.2);

    this.ambient.intensity = THREE.MathUtils.lerp(0.32, 0.72, easeLight);
    this.keyLight.intensity = THREE.MathUtils.lerp(0.35, 1.05, easeLight);
    this.rimLight.intensity = THREE.MathUtils.lerp(0.28, 0.75, easeLight);

    this.bgStars.material.opacity = this.state === 'intro' ? 0.08 : 0.42 * easeSparkles;

    this.domeShellMat.uniforms.uTime.value = this.elapsed;
    this.domeShellMat.uniforms.uOpacity.value = easeLight;
    for (const mat of this.domeArcMaterials) {
      mat.uniforms.uTime.value = this.elapsed;
      mat.uniforms.uOpacity.value = easeLight;
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
    this.glintTex.dispose();
    this.starTex.dispose();
    this.sideTextures.map.dispose();
    this.sideTextures.emissiveMap.dispose();
    this.topTex.dispose();
    for (const item of this.extraDisposables) {
      if (typeof item.dispose === 'function') item.dispose();
    }
    this.controls.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
