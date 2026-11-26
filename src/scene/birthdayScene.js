const CAKE_ASSETS = {
  strawberry: {
    src: './cakes/strawberry.webp',
    wickX: 0.4988,
    wickY: 0.1909,
  },
  cherry: {
    src: './cakes/cherry.webp',
    wickX: 0.4987,
    wickY: 0.2261,
  },
};

const PALETTE = [
  { r: 255, g: 255, b: 255 }, // 亮白
  { r: 254, g: 243, b: 199 }, // 暖白金
  { r: 253, g: 230, b: 138 }, // 香槟金
  { r: 251, g: 207, b: 232 }, // 淡樱粉
  { r: 249, g: 168, b: 212 }, // 柔粉金
];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * 从四角连通域剔除影棚纯黑背景，保留蛋糕内部深色细节（如车厘子、阴影），
 * 并对轮廓外缘做轻量羽化，确保 2.5D 舞台与深色夜空无缝融合。
 */
function extractBorderlessCake(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const total = w * h;
  const bgMask = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const BG_THRESHOLD = 26;
  const FEATHER_LOW = 12;
  const FEATHER_HIGH = 42;

  const tryEnqueue = (idx) => {
    if (bgMask[idx]) return;
    const o = idx * 4;
    const lum = Math.max(data[o], data[o + 1], data[o + 2]);
    if (lum <= BG_THRESHOLD) {
      bgMask[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < w; x++) {
    tryEnqueue(x);
    tryEnqueue((h - 1) * w + x);
  }
  for (let y = 1; y < h - 1; y++) {
    tryEnqueue(y * w);
    tryEnqueue(y * w + (w - 1));
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % w;
    const y = (idx - x) / w;
    if (x > 0) tryEnqueue(idx - 1);
    if (x < w - 1) tryEnqueue(idx + 1);
    if (y > 0) tryEnqueue(idx - w);
    if (y < h - 1) tryEnqueue(idx + w);
  }

  for (let i = 0; i < total; i++) {
    if (bgMask[i]) {
      data[i * 4 + 3] = 0;
    }
  }

  // 对紧邻背景的暗边缘像素做 1-2px 柔和过渡，消除 JPEG 黑边残留
  for (let y = 1; y < h - 1; y++) {
    const row = y * w;
    for (let x = 1; x < w - 1; x++) {
      const idx = row + x;
      if (bgMask[idx]) continue;
      if (
        bgMask[idx - 1] ||
        bgMask[idx + 1] ||
        bgMask[idx - w] ||
        bgMask[idx + w]
      ) {
        const o = idx * 4;
        const lum = Math.max(data[o], data[o + 1], data[o + 2]);
        if (lum < FEATHER_HIGH) {
          const factor = clamp((lum - FEATHER_LOW) / (FEATHER_HIGH - FEATHER_LOW), 0, 1);
          data[o + 3] = Math.round(data[o + 3] * factor);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return off;
}

function drawFourPointGlint(ctx, x, y, radius, color, alpha, rotation = 0) {
  if (alpha <= 0.01 || radius <= 0.2) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(x, y);
  if (rotation) ctx.rotate(rotation);

  // 柔和星芒微晕，增强亮晶晶质感但不显笨重
  const haloR = radius * 1.15;
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, haloR);
  halo.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${(alpha * 0.42).toFixed(3)})`);
  halo.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, haloR, 0, Math.PI * 2);
  ctx.fill();

  // 极细十字星芒（针尖式四芒星）
  ctx.globalAlpha = Math.min(1, alpha);
  const inner = radius * 0.14;
  ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
  ctx.beginPath();
  ctx.moveTo(0, -radius);
  ctx.lineTo(inner, -inner);
  ctx.lineTo(radius, 0);
  ctx.lineTo(inner, inner);
  ctx.lineTo(0, radius);
  ctx.lineTo(-inner, inner);
  ctx.lineTo(-radius, 0);
  ctx.lineTo(-inner, -inner);
  ctx.closePath();
  ctx.fill();

  // 中心钻石亮芯
  ctx.globalAlpha = Math.min(1, alpha * 1.2);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(0.7, radius * 0.18), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export class BirthdayScene {
  constructor(container, options = {}) {
    this.container = container;
    this.cakeStyle = CAKE_ASSETS[options.cakeStyle] ? options.cakeStyle : 'strawberry';
    this.asset = CAKE_ASSETS[this.cakeStyle];
    this.onFlameTap = typeof options.onFlameTap === 'function' ? options.onFlameTap : () => {};

    this.state = 'intro'; // 'intro' | 'lit' | 'wish' | 'blown'
    this.destroyed = false;

    // 动画过渡进度
    this.litLevel = 0;       // 0 = 暗夜未点燃, 1 = 完全点亮
    this.sparkleAlpha = 0;   // 点亮后渐显，绝不在开场出现
    this.flameScale = 0;     // 火焰可见度
    this.blowIntensity = 0;
    this.smoothBlow = 0;
    this.zoom = 1;
    this.targetZoom = 1;

    // 2.5D 交互视差状态
    this.rotX = 0;
    this.rotY = 0;
    this.targetRotX = 0;
    this.targetRotY = 0;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.pointerStartX = 0;
    this.pointerStartY = 0;
    this.pointerMoved = false;

    // 离线缓存的无背景高清蛋糕图
    this.cakeCanvas = null;
    this.cakeReady = false;
    this.lastCakeLitStamp = -1;

    // 粒子池
    this.bgParticles = [];
    this.fgParticles = [];
    this.smokePuffs = [];
    this.fireworks = [];
    this.emberSparks = [];
    this.emberGlow = 0;
    this.lastSmokeAt = 0;
    this.lastEmberAt = 0;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.viewW = container.clientWidth || window.innerWidth;
    this.viewH = container.clientHeight || window.innerHeight;
    this.stageSize = 360;

    this._buildDom();
    this._initSparkles();
    this._bindEvents();
    this._resize();
    this._loadCakeAsset();

    this.prevTime = performance.now();
    this._rafId = requestAnimationFrame((now) => this._tick(now));
  }

  _buildDom() {
    this.container.innerHTML = '';

    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.className = 'fx-bg-canvas';
    this.bgCtx = this.bgCanvas.getContext('2d');

    this.stageViewport = document.createElement('div');
    this.stageViewport.className = 'stage-viewport';

    this.cakeStage = document.createElement('div');
    this.cakeStage.className = 'cake-stage';

    this.cakeLayer = document.createElement('canvas');
    this.cakeLayer.className = 'cake-layer';
    this.cakeCtx = this.cakeLayer.getContext('2d');

    this.flameLayer = document.createElement('canvas');
    this.flameLayer.className = 'flame-layer';
    this.flameCtx = this.flameLayer.getContext('2d');

    this.fgCanvas = document.createElement('canvas');
    this.fgCanvas.className = 'fx-fg-canvas';
    this.fgCtx = this.fgCanvas.getContext('2d');

    this.cakeStage.appendChild(this.cakeLayer);
    this.cakeStage.appendChild(this.flameLayer);
    this.stageViewport.appendChild(this.cakeStage);

    this.container.appendChild(this.bgCanvas);
    this.container.appendChild(this.stageViewport);
    this.container.appendChild(this.fgCanvas);
  }

  _loadCakeAsset() {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (this.destroyed) return;
      this.cakeCanvas = extractBorderlessCake(img);
      this.cakeReady = true;
      this.lastCakeLitStamp = -1;
    };
    img.src = this.asset.src;
  }

  _initSparkles() {
    // 严格控制 CSS 像素尺寸：极细腻星尘 + 针芒星，晶莹闪烁而不出现粗大圆球
    const createPool = (count, isForeground) => {
      const list = [];
      for (let i = 0; i < count; i++) {
        const isGlint = Math.random() < (isForeground ? 0.38 : 0.26);
        const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        list.push({
          nx: Math.random(),
          ny: Math.random(),
          vx: (Math.random() - 0.5) * (isForeground ? 0.013 : 0.008),
          vy: -(0.009 + Math.random() * (isForeground ? 0.018 : 0.012)),
          isGlint,
          radius: isGlint
            ? (isForeground ? 3.4 + Math.random() * 4.4 : 2.3 + Math.random() * 3.0)
            : (isForeground ? 0.9 + Math.random() * 1.15 : 0.65 + Math.random() * 0.95),
          color,
          baseAlpha: isGlint ? 0.78 + Math.random() * 0.22 : 0.56 + Math.random() * 0.36,
          phase: Math.random() * Math.PI * 2,
          speed: 1.8 + Math.random() * 3.2,
          rotation: Math.random() * Math.PI * 0.25,
        });
      }
      return list;
    };

    this.bgParticles = createPool(85, false);
    this.fgParticles = createPool(72, true);
  }

  _bindEvents() {
    this._onResize = () => this._resize();
    window.addEventListener('resize', this._onResize);

    this._onPointerDown = (e) => {
      if (this.state === 'intro') return;
      this.isDragging = true;
      this.pointerMoved = false;
      this.pointerStartX = e.clientX;
      this.pointerStartY = e.clientY;
    };

    this._onPointerMove = (e) => {
      if (this.state === 'intro') return;
      if (this.isDragging) {
        const dx = e.clientX - this.pointerStartX;
        const dy = e.clientY - this.pointerStartY;
        if (Math.hypot(dx, dy) > 8) {
          this.pointerMoved = true;
        }
        const normX = clamp(dx / Math.max(120, this.viewW * 0.35), -1, 1);
        const normY = clamp(dy / Math.max(120, this.viewH * 0.35), -1, 1);
        this.targetRotY = normX * 10.5;
        this.targetRotX = -normY * 6.5;
      } else if (e.pointerType === 'mouse') {
        const nx = (e.clientX / this.viewW - 0.5) * 2;
        const ny = (e.clientY / this.viewH - 0.5) * 2;
        this.targetRotY = clamp(nx * 5.2, -6, 6);
        this.targetRotX = clamp(-ny * 3.4, -4, 4);
      }
    };

    this._onPointerUp = (e) => {
      const wasTap = this.isDragging && !this.pointerMoved;
      this.isDragging = false;
      this.targetRotX = 0;
      this.targetRotY = 0;

      if (wasTap && this.state === 'wish') {
        const rect = this.cakeStage.getBoundingClientRect();
        const flameScreenX = rect.left + rect.width * this.asset.wickX;
        const flameScreenY = rect.top + rect.height * this.asset.wickY - 14;
        const dist = Math.hypot(e.clientX - flameScreenX, e.clientY - flameScreenY);
        if (dist <= 64) {
          this.onFlameTap();
        }
      }
    };

    this._onPointerCancel = () => {
      this.isDragging = false;
      this.targetRotX = 0;
      this.targetRotY = 0;
    };

    this.container.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerCancel);
  }

  _resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.viewW = this.container.clientWidth || window.innerWidth;
    this.viewH = this.container.clientHeight || window.innerHeight;

    for (const c of [this.bgCanvas, this.fgCanvas]) {
      c.width = Math.round(this.viewW * this.dpr);
      c.height = Math.round(this.viewH * this.dpr);
      const ctx = c.getContext('2d');
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    const stageRect = this.cakeStage.getBoundingClientRect();
    this.stageSize = Math.max(200, Math.round(stageRect.width || Math.min(this.viewW * 0.92, this.viewH * 0.56, 460)));

    for (const c of [this.cakeLayer, this.flameLayer]) {
      c.width = Math.round(this.stageSize * this.dpr);
      c.height = Math.round(this.stageSize * this.dpr);
      const ctx = c.getContext('2d');
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    this.lastCakeLitStamp = -1;
  }

  runAndLight() {
    this.state = 'lit';
    this.targetZoom = 1.0;
  }

  enterWishMode() {
    if (this.state === 'blown') {
      this.relight();
    }
    this.state = 'wish';
    this.targetZoom = 1.07;
  }

  setBlowIntensity(val) {
    this.blowIntensity = clamp(val || 0, 0, 1);
  }

  blowOut() {
    if (this.state === 'blown') return;
    this.state = 'blown';
    this.targetZoom = 1.0;
    this.blowIntensity = 0;
    this.emberGlow = 1;
    this._spawnSmokeBurst();
    this._launchFireworks();
  }

  relight() {
    this.state = 'lit';
    this.targetZoom = 1.0;
    this.blowIntensity = 0;
    this.emberGlow = 0;
    this.smokePuffs.length = 0;
  }

  _spawnSmokeBurst() {
    const cx = this.stageSize * this.asset.wickX;
    const cy = this.stageSize * this.asset.wickY - 4;
    for (let i = 0; i < 14; i++) {
      this.smokePuffs.push({
        x: cx + (Math.random() - 0.5) * 4,
        y: cy - i * 1.6,
        vx: (Math.random() - 0.5) * 10,
        vy: -(24 + Math.random() * 24),
        radius: 3.5 + Math.random() * 5,
        alpha: 0.42 - i * 0.015,
        life: 0,
        maxLife: 1.5 + Math.random() * 1.0,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  _launchFireworks() {
    const centers = [
      { x: this.viewW * 0.22, y: this.viewH * 0.26 },
      { x: this.viewW * 0.78, y: this.viewH * 0.24 },
      { x: this.viewW * 0.5, y: this.viewH * 0.18 },
      { x: this.viewW * 0.34, y: this.viewH * 0.34 },
      { x: this.viewW * 0.68, y: this.viewH * 0.35 },
    ];

    centers.forEach((origin, idx) => {
      const delay = idx * 0.18;
      const count = 34;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.18;
        const speed = 65 + Math.random() * 135;
        const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        this.fireworks.push({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 24,
          color,
          size: 1.1 + Math.random() * 1.4,
          life: -delay,
          maxLife: 1.2 + Math.random() * 0.65,
          isGlint: Math.random() < 0.25,
        });
      }
    });
  }

  _tick(now) {
    if (this.destroyed) return;
    const dt = clamp((now - this.prevTime) / 1000, 0.001, 0.05);
    this.prevTime = now;
    const t = now * 0.001;

    this._updateState(dt, t);
    this._renderBgFx(dt, t);
    this._renderCakeLayer(t);
    this._renderFlameLayer(dt, t);
    this._renderFgFx(dt, t);

    this._rafId = requestAnimationFrame((ts) => this._tick(ts));
  }

  _updateState(dt, t) {
    const targetLit = this.state === 'intro' ? 0 : 1;
    const targetFlame = this.state === 'lit' || this.state === 'wish' ? 1 : 0;
    const targetSparkle = this.state === 'intro' ? 0 : 1;

    this.litLevel = lerp(this.litLevel, targetLit, 1 - Math.exp(-dt * 4.5));
    this.flameScale = lerp(this.flameScale, targetFlame, 1 - Math.exp(-dt * (targetFlame ? 8.5 : 14)));
    this.sparkleAlpha = lerp(this.sparkleAlpha, targetSparkle, 1 - Math.exp(-dt * 3.0));
    this.zoom = lerp(this.zoom, this.targetZoom, 1 - Math.exp(-dt * 5.0));
    this.smoothBlow = lerp(this.smoothBlow, this.blowIntensity, 1 - Math.exp(-dt * 14));
    this.emberGlow = Math.max(0, this.emberGlow - dt * 0.7);

    // 轻微呼吸晃动 + 拖拽阻尼
    const idleY = this.state === 'intro' ? 0 : Math.sin(t * 0.72) * 1.6;
    const idleX = this.state === 'intro' ? 0 : Math.cos(t * 0.54) * 0.9;
    this.rotY = lerp(this.rotY, this.targetRotY + idleY, 1 - Math.exp(-dt * 8));
    this.rotX = lerp(this.rotX, this.targetRotX + idleX, 1 - Math.exp(-dt * 8));
    this.panX = this.rotY * 0.55;
    this.panY = -this.rotX * 0.4;

    this.cakeStage.style.transform =
      `translate3d(-50%, -50%, 0) translate3d(${this.panX.toFixed(2)}px, ${this.panY.toFixed(2)}px, 0) ` +
      `rotateX(${this.rotX.toFixed(2)}deg) rotateY(${this.rotY.toFixed(2)}deg) scale(${this.zoom.toFixed(4)})`;
  }

  _updateAndDrawSparkles(ctx, pool, dt, t, parallaxMul) {
    if (this.sparkleAlpha <= 0.005) return;
    const w = this.viewW;
    const h = this.viewH;

    for (const p of pool) {
      p.nx += p.vx * dt;
      p.ny += p.vy * dt;
      if (p.ny < -0.04) {
        p.ny = 1.04;
        p.nx = Math.random();
      }
      if (p.nx < -0.04) p.nx = 1.04;
      if (p.nx > 1.04) p.nx = -0.04;

      const twinkle = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(t * p.speed + p.phase), 1.7);
      const alpha = this.sparkleAlpha * p.baseAlpha * twinkle;
      if (alpha <= 0.015) continue;

      const px = p.nx * w + this.rotY * parallaxMul;
      const py = p.ny * h - this.rotX * parallaxMul;

      if (p.isGlint) {
        drawFourPointGlint(ctx, px, py, p.radius, p.color, alpha, p.rotation + Math.sin(t + p.phase) * 0.08);
      } else {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = alpha * 0.28;
        ctx.fillStyle = `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`;
        ctx.beginPath();
        ctx.arc(px, py, p.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, p.radius * 0.72, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  _renderBgFx(dt, t) {
    const ctx = this.bgCtx;
    const w = this.viewW;
    const h = this.viewH;
    ctx.clearRect(0, 0, w, h);

    // 深邃影棚背景基底
    const cx = w * 0.5;
    const cy = h * (w >= 768 ? 0.43 : 0.41);
    const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * 0.75);
    bgGrad.addColorStop(0, '#0c0814');
    bgGrad.addColorStop(0.5, '#07040c');
    bgGrad.addColorStop(1, '#050308');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 点亮后蛋糕背后的温柔暖粉金氛围光晕
    if (this.litLevel > 0.01) {
      const auraAlpha = 0.34 * this.litLevel * (this.state === 'blown' ? 0.45 : 1);
      const auraR = Math.min(w, h) * 0.62;
      const pulse = 1 + Math.sin(t * 2.1) * 0.03;
      const aura = ctx.createRadialGradient(cx, cy - this.stageSize * 0.06, 0, cx, cy, auraR * pulse);
      aura.addColorStop(0, `rgba(253, 218, 165, ${auraAlpha})`);
      aura.addColorStop(0.42, `rgba(244, 172, 200, ${auraAlpha * 0.55})`);
      aura.addColorStop(1, 'rgba(5, 3, 8, 0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, w, h);
    }

    // 远景细碎星尘（点亮后自由飘散全屏）
    this._updateAndDrawSparkles(ctx, this.bgParticles, dt, t, -0.7);
  }

  _renderCakeLayer(t) {
    if (!this.cakeReady || !this.cakeCanvas) return;

    const flicker = 0.5 + 0.5 * Math.sin(t * 11.3) * 0.5 + 0.5 * Math.cos(t * 17.7) * 0.5;
    const candlePower = this.flameScale * (1 - this.smoothBlow * 0.45);
    // intro 未点亮时节流重绘，点亮时随烛光轻闪重绘
    const stamp = Math.round(this.litLevel * 100) + Math.round(candlePower * 50 * (0.85 + 0.15 * flicker));
    if (stamp === this.lastCakeLitStamp) return;
    this.lastCakeLitStamp = stamp;

    const ctx = this.cakeCtx;
    const s = this.stageSize;
    ctx.clearRect(0, 0, s, s);
    ctx.save();
    ctx.drawImage(this.cakeCanvas, 0, 0, s, s);

    // Act 1 暗夜低调氛围（兼容所有 WebView，避免 ctx.filter 兼容差异）
    const dimAlpha = (1 - this.litLevel) * 0.56;
    if (dimAlpha > 0.01) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = `rgba(7, 4, 14, ${dimAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, s, s);
    }

    // 点亮后的实时暖色烛光照亮蛋糕顶面奶油与托盘
    if (candlePower > 0.02) {
      const gx = s * this.asset.wickX;
      const gy = s * (this.asset.wickY + 0.08);
      const gr = s * (0.48 + flicker * 0.04);
      const wash = ctx.createRadialGradient(gx, gy, s * 0.02, gx, gy, gr);
      const intensity = candlePower * (0.24 + flicker * 0.06);
      wash.addColorStop(0, `rgba(255, 224, 165, ${intensity.toFixed(3)})`);
      wash.addColorStop(0.45, `rgba(255, 198, 138, ${(intensity * 0.42).toFixed(3)})`);
      wash.addColorStop(1, 'rgba(255, 180, 120, 0)');

      ctx.globalCompositeOperation = 'lighter';
      // 限制在蛋糕透明通道内部
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, s, s);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(this.cakeCanvas, 0, 0, s, s);
    }

    ctx.restore();
  }

  _renderFlameLayer(dt, t) {
    const ctx = this.flameCtx;
    const s = this.stageSize;
    ctx.clearRect(0, 0, s, s);

    const wx = s * this.asset.wickX;
    const wy = s * this.asset.wickY;

    // 1. 火焰主体 + 光晕
    if (this.flameScale > 0.015) {
      const blow = this.smoothBlow;
      const fastFlicker =
        Math.sin(t * 14.5) * 0.35 +
        Math.sin(t * 23.1 + 1.2) * 0.25 +
        Math.cos(t * 31.7) * 0.15;
      const sway = Math.sin(t * 7.8) * 1.4 + Math.cos(t * 13.1) * 0.9 + blow * (12 + fastFlicker * 7);

      const flameH = s * (0.082 + fastFlicker * 0.005) * this.flameScale * (1 - blow * 0.24);
      const flameW = s * 0.021 * this.flameScale * (1 - blow * 0.18);

      ctx.save();
      // 柔和外光晕
      ctx.globalCompositeOperation = 'lighter';
      const haloR = s * (0.14 + fastFlicker * 0.01) * this.flameScale;
      const halo = ctx.createRadialGradient(wx + sway * 0.25, wy - flameH * 0.45, 0, wx + sway * 0.25, wy - flameH * 0.45, haloR);
      halo.addColorStop(0, `rgba(255, 214, 135, ${(0.52 * this.flameScale).toFixed(3)})`);
      halo.addColorStop(0.38, `rgba(255, 166, 78, ${(0.22 * this.flameScale).toFixed(3)})`);
      halo.addColorStop(1, 'rgba(255, 130, 50, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(wx + sway * 0.25, wy - flameH * 0.45, haloR, 0, Math.PI * 2);
      ctx.fill();

      // 外焰泪滴形（暖橘金 -> 明亮乳白）
      const tipX = wx + sway;
      const tipY = wy - flameH;
      const outerGrad = ctx.createLinearGradient(wx, wy + 2, tipX, tipY);
      outerGrad.addColorStop(0, 'rgba(255, 128, 32, 0.92)');
      outerGrad.addColorStop(0.45, 'rgba(255, 196, 84, 0.96)');
      outerGrad.addColorStop(1, 'rgba(255, 246, 200, 0.98)');

      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.moveTo(wx, wy + 2);
      ctx.bezierCurveTo(
        wx - flameW * 1.15,
        wy - flameH * 0.22,
        wx - flameW * 0.85 + sway * 0.45,
        wy - flameH * 0.68,
        tipX,
        tipY
      );
      ctx.bezierCurveTo(
        wx + flameW * 0.85 + sway * 0.55,
        wy - flameH * 0.68,
        wx + flameW * 1.15,
        wy - flameH * 0.22,
        wx,
        wy + 2
      );
      ctx.closePath();
      ctx.fill();

      // 内焰亮白芯
      const innerH = flameH * 0.6;
      const innerW = flameW * 0.48;
      const innerTipX = wx + sway * 0.55;
      const innerTipY = wy - innerH;
      ctx.fillStyle = 'rgba(255, 253, 242, 0.96)';
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.bezierCurveTo(
        wx - innerW,
        wy - innerH * 0.28,
        wx - innerW * 0.6 + sway * 0.25,
        wy - innerH * 0.72,
        innerTipX,
        innerTipY
      );
      ctx.bezierCurveTo(
        wx + innerW * 0.6 + sway * 0.3,
        wy - innerH * 0.72,
        wx + innerW,
        wy - innerH * 0.28,
        wx,
        wy
      );
      ctx.closePath();
      ctx.fill();

      // 烛芯接触点淡蓝火底
      const blueR = Math.max(2.2, flameW * 0.55);
      const blueGrad = ctx.createRadialGradient(wx, wy - 1, 0, wx, wy - 1, blueR * 1.4);
      blueGrad.addColorStop(0, 'rgba(120, 185, 255, 0.65)');
      blueGrad.addColorStop(1, 'rgba(90, 150, 255, 0)');
      ctx.fillStyle = blueGrad;
      ctx.beginPath();
      ctx.arc(wx, wy - 1, blueR * 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 偶发极细微火苗上升余星
      if (t - this.lastEmberAt > 0.36 && Math.random() < 0.35) {
        this.lastEmberAt = t;
        this.emberSparks.push({
          x: tipX + (Math.random() - 0.5) * 3,
          y: tipY,
          vx: (Math.random() - 0.5) * 14 + sway * 0.4,
          vy: -(24 + Math.random() * 20),
          life: 0,
          maxLife: 0.45 + Math.random() * 0.3,
        });
      }
    }

    // 2. 吹灭后的余烬微红
    if (this.emberGlow > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const eg = ctx.createRadialGradient(wx, wy - 1, 0, wx, wy - 1, 6);
      eg.addColorStop(0, `rgba(255, 140, 60, ${this.emberGlow.toFixed(3)})`);
      eg.addColorStop(1, 'rgba(255, 80, 20, 0)');
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(wx, wy - 1, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. 上升火苗微星
    for (let i = this.emberSparks.length - 1; i >= 0; i--) {
      const e = this.emberSparks[i];
      e.life += dt;
      if (e.life >= e.maxLife) {
        this.emberSparks.splice(i, 1);
        continue;
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      const a = 1 - e.life / e.maxLife;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * 0.85;
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 1.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. 吹熄缕烟
    if (this.state === 'blown' && this.emberGlow > 0.15 && t - this.lastSmokeAt > 0.09) {
      this.lastSmokeAt = t;
      this.smokePuffs.push({
        x: wx + (Math.random() - 0.5) * 3,
        y: wy - 3,
        vx: (Math.random() - 0.5) * 8,
        vy: -(22 + Math.random() * 14),
        radius: 3 + Math.random() * 3.5,
        alpha: 0.28,
        life: 0,
        maxLife: 1.5 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
      });
    }

    for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
      const sm = this.smokePuffs[i];
      sm.life += dt;
      if (sm.life >= sm.maxLife) {
        this.smokePuffs.splice(i, 1);
        continue;
      }
      const p = sm.life / sm.maxLife;
      sm.x += (sm.vx + Math.sin(t * 3.2 + sm.phase + p * 5) * 10) * dt;
      sm.y += sm.vy * dt;
      sm.vy *= 0.992;
      const r = sm.radius * (1 + p * 2.2);
      const a = sm.alpha * Math.sin(Math.min(1, p * 4) * (Math.PI / 2)) * Math.pow(1 - p, 1.4);

      const sg = ctx.createRadialGradient(sm.x, sm.y, 0, sm.x, sm.y, r);
      sg.addColorStop(0, `rgba(235, 228, 240, ${a.toFixed(3)})`);
      sg.addColorStop(1, 'rgba(220, 212, 230, 0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(sm.x, sm.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _renderFgFx(dt, t) {
    const ctx = this.fgCtx;
    const w = this.viewW;
    const h = this.viewH;
    ctx.clearRect(0, 0, w, h);

    // 前景极细腻闪烁星芒与碎光粉尘（仅点亮后出现，不限制范围）
    this._updateAndDrawSparkles(ctx, this.fgParticles, dt, t, 1.4);

    // 吹灭蜡烛后的庆贺烟花
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const f = this.fireworks[i];
      f.life += dt;
      if (f.life < 0) continue;
      if (f.life >= f.maxLife) {
        this.fireworks.splice(i, 1);
        continue;
      }
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vx *= Math.pow(0.24, dt);
      f.vy = f.vy * Math.pow(0.26, dt) + 52 * dt;

      const p = f.life / f.maxLife;
      const alpha = Math.pow(1 - p, 1.25);

      if (f.isGlint) {
        drawFourPointGlint(ctx, f.x, f.y, f.size * 3.2, f.color, alpha, p * 1.6);
      } else {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${f.color.r}, ${f.color.g}, ${f.color.b})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  destroy() {
    this.destroyed = true;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    window.removeEventListener('resize', this._onResize);
    this.container.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerCancel);
    this.container.innerHTML = '';
  }
}
