import * as THREE from 'three';

// 为数字 0-9 定义平滑中心线路径，使用 TubeGeometry + 圆球端点构建立体数字蜡烛
const DIGIT_STROKES = {
  0: {
    wickX: 0,
    wickY: 0.82,
    strokes: [
      {
        closed: true,
        pts: [
          [0, 0.78],
          [0.14, 0.70],
          [0.18, 0.43],
          [0.14, 0.16],
          [0, 0.08],
          [-0.14, 0.16],
          [-0.18, 0.43],
          [-0.14, 0.70],
        ],
      },
    ],
  },
  1: {
    wickX: 0.02,
    wickY: 0.82,
    strokes: [
      { pts: [[-0.11, 0.65], [0.02, 0.78]] },
      { pts: [[0.02, 0.78], [0.02, 0.08]] },
      { pts: [[-0.14, 0.08], [0.16, 0.08]] },
    ],
  },
  2: {
    wickX: 0.02,
    wickY: 0.82,
    strokes: [
      {
        pts: [
          [-0.16, 0.61],
          [-0.08, 0.74],
          [0.05, 0.78],
          [0.16, 0.67],
          [0.15, 0.50],
          [0.01, 0.32],
          [-0.17, 0.09],
        ],
      },
      { pts: [[-0.17, 0.09], [0.18, 0.09]] },
    ],
  },
  3: {
    wickX: 0.0,
    wickY: 0.82,
    strokes: [
      {
        pts: [
          [-0.15, 0.66],
          [0.0, 0.78],
          [0.15, 0.67],
          [0.12, 0.50],
          [-0.02, 0.44],
        ],
      },
      {
        pts: [
          [-0.02, 0.44],
          [0.14, 0.39],
          [0.17, 0.22],
          [0.02, 0.08],
          [-0.16, 0.16],
        ],
      },
    ],
  },
  4: {
    wickX: 0.09,
    wickY: 0.82,
    strokes: [
      { pts: [[0.09, 0.78], [-0.18, 0.29]] },
      { pts: [[-0.18, 0.29], [0.19, 0.29]] },
      { pts: [[0.09, 0.78], [0.09, 0.08]] },
    ],
  },
  5: {
    wickX: -0.02,
    wickY: 0.82,
    strokes: [
      { pts: [[0.15, 0.78], [-0.13, 0.78]] },
      { pts: [[-0.13, 0.78], [-0.15, 0.47]] },
      {
        pts: [
          [-0.15, 0.47],
          [0.02, 0.51],
          [0.17, 0.39],
          [0.16, 0.20],
          [0.01, 0.08],
          [-0.16, 0.15],
        ],
      },
    ],
  },
  6: {
    wickX: 0.01,
    wickY: 0.82,
    strokes: [
      {
        pts: [
          [0.13, 0.70],
          [0.01, 0.78],
          [-0.13, 0.66],
          [-0.17, 0.36],
          [-0.12, 0.14],
          [0.03, 0.08],
          [0.16, 0.19],
          [0.15, 0.37],
          [0.01, 0.46],
          [-0.15, 0.36],
        ],
      },
    ],
  },
  7: {
    wickX: 0.0,
    wickY: 0.82,
    strokes: [
      { pts: [[-0.17, 0.78], [0.17, 0.78]] },
      { pts: [[0.17, 0.78], [-0.06, 0.08]] },
    ],
  },
  8: {
    wickX: 0.0,
    wickY: 0.81,
    strokes: [
      {
        closed: true,
        pts: [
          [0, 0.77],
          [0.12, 0.71],
          [0.14, 0.60],
          [0.09, 0.47],
          [0, 0.44],
          [-0.09, 0.47],
          [-0.14, 0.60],
          [-0.12, 0.71],
        ],
      },
      {
        closed: true,
        pts: [
          [0, 0.44],
          [0.12, 0.39],
          [0.17, 0.25],
          [0.12, 0.12],
          [0, 0.08],
          [-0.12, 0.12],
          [-0.17, 0.25],
          [-0.12, 0.39],
        ],
      },
    ],
  },
  9: {
    wickX: -0.01,
    wickY: 0.82,
    strokes: [
      {
        pts: [
          [-0.13, 0.16],
          [-0.01, 0.08],
          [0.13, 0.20],
          [0.17, 0.50],
          [0.12, 0.72],
          [-0.03, 0.78],
          [-0.16, 0.67],
          [-0.15, 0.49],
          [-0.01, 0.40],
          [0.15, 0.50],
        ],
      },
    ],
  },
};

function createGlowSpriteTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, 'rgba(255, 253, 240, 1.0)');
  grad.addColorStop(0.22, 'rgba(255, 224, 140, 0.82)');
  grad.addColorStop(0.55, 'rgba(255, 178, 95, 0.24)');
  grad.addColorStop(1.0, 'rgba(255, 140, 60, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createFlameSparkleTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const outer = size * 0.46;
  const inner = size * 0.08;
  for (let i = 0; i < 8; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / 4;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 250, 225, 0.96)';
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSmokeTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, 'rgba(248, 240, 248, 0.65)');
  grad.addColorStop(0.5, 'rgba(225, 215, 230, 0.22)');
  grad.addColorStop(1.0, 'rgba(200, 190, 210, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function createFlameShaderMaterial(seedOffset) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSeed: { value: seedOffset },
      uBlow: { value: 0 },
      uOpacity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uSeed;
      uniform float uBlow;
      varying vec2 vUv;
      varying float vHeight;

      void main() {
        vUv = uv;
        vec3 pos = position;
        float h = clamp(pos.y / 0.34, 0.0, 1.0);
        vHeight = h;

        float sway = sin(uTime * 7.5 + uSeed + h * 3.5) * 0.012 * h;
        float swayZ = cos(uTime * 6.2 + uSeed * 1.7 + h * 3.0) * 0.008 * h;
        float gust = uBlow * (0.095 * h * h + sin(uTime * 28.0 + uSeed) * 0.028 * h);

        pos.x += sway + gust;
        pos.z += swayZ + uBlow * 0.032 * h;
        pos.y *= mix(1.0, 0.65, uBlow * 0.85);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uSeed;
      uniform float uBlow;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vHeight;

      void main() {
        float flicker = 0.88 + 0.12 * sin(uTime * 14.0 + uSeed);
        vec3 baseBlue = vec3(0.42, 0.72, 1.0);
        vec3 midAmber = vec3(1.0, 0.78, 0.30);
        vec3 tipGold = vec3(1.0, 0.98, 0.86);

        vec3 col = mix(baseBlue, midAmber, smoothstep(0.0, 0.28, vHeight));
        col = mix(col, tipGold, smoothstep(0.28, 0.82, vHeight));

        float alpha = smoothstep(0.0, 0.12, vHeight) * (1.0 - smoothstep(0.76, 1.0, vHeight));
        alpha *= flicker * uOpacity * mix(1.0, 0.55, uBlow);

        gl_FragColor = vec4(col * 1.55, alpha);
      }
    `,
  });
}

function createTeardropGeometry() {
  const points = [];
  const steps = 18;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const y = t * 0.34;
    const radius = Math.sin(Math.pow(t, 0.52) * Math.PI) * 0.058 * (1 - 0.36 * t);
    points.push(new THREE.Vector2(Math.max(0.001, radius), y));
  }
  return new THREE.LatheGeometry(points, 18);
}

// 共享的火焰 + 光晕 + 轻烟装配控制器，同时服务于细蜡烛与数字蜡烛
function createCandleController(root, candleConfigs) {
  const disposables = [];
  const track = (obj) => {
    disposables.push(obj);
    return obj;
  };

  const flameGeo = track(createTeardropGeometry());
  const coreGeo = track(createTeardropGeometry());
  coreGeo.scale(0.54, 0.58, 0.54);

  const glowTex = track(createGlowSpriteTexture());
  const smokeTex = track(createSmokeTexture());
  const sparkleTex = track(createFlameSparkleTexture());

  const candleItems = [];
  const hitTargets = [];
  const smokeSprites = [];
  const flameSparkles = [];

  candleConfigs.forEach(({ group, flameAnchor, lightIntensity = 1.6, flameScale = 1.0, seed = 0 }, idx) => {
    const flameGroup = new THREE.Group();
    flameGroup.position.copy(flameAnchor);
    group.add(flameGroup);

    const flameMat = track(createFlameShaderMaterial(seed));
    const outerFlame = new THREE.Mesh(flameGeo, flameMat);
    flameGroup.add(outerFlame);

    const coreMat = track(new THREE.MeshBasicMaterial({
      color: 0xfffef5,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    const innerCore = new THREE.Mesh(coreGeo, coreMat);
    innerCore.position.y = 0.018;
    flameGroup.add(innerCore);

    const glowMat = track(new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xffd888,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    const glowSprite = new THREE.Sprite(glowMat);
    glowSprite.position.y = 0.16;
    glowSprite.scale.set(0.68, 0.68, 1);
    flameGroup.add(glowSprite);

    const auraMat = track(new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xffc66d,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    const auraGlowSprite = new THREE.Sprite(auraMat);
    auraGlowSprite.position.y = 0.16;
    auraGlowSprite.scale.set(1.22, 1.22, 1);
    flameGroup.add(auraGlowSprite);

    // 点亮后的微小亮晶晶金星点缀
    for (let k = 0; k < 2; k += 1) {
      const spMat = track(new THREE.SpriteMaterial({
        map: sparkleTex,
        color: k === 0 ? 0xffffff : 0xfde68a,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));
      const glint = new THREE.Sprite(spMat);
      glint.position.set((k === 0 ? -1 : 1) * (0.09 + idx * 0.015), 0.18 + k * 0.08, 0.04);
      glint.scale.setScalar(0.085);
      flameGroup.add(glint);
      flameSparkles.push({ sprite: glint, phase: idx * 2.1 + k * 1.9 });
    }

    const light = new THREE.PointLight(0xffcb77, lightIntensity, 4.2, 1.5);
    light.position.set(0, 0.22, 0.08);
    flameGroup.add(light);

    const hitGeo = track(new THREE.SphereGeometry(0.28, 10, 10));
    const hitMat = track(new THREE.MeshBasicMaterial({ visible: false }));
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.position.set(0, 0.16, 0);
    flameGroup.add(hitMesh);
    hitTargets.push(hitMesh);

    for (let s = 0; s < 6; s += 1) {
      const smMat = track(new THREE.SpriteMaterial({
        map: smokeTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }));
      const sp = new THREE.Sprite(smMat);
      sp.visible = false;
      sp.userData = {
        origin: flameAnchor.clone(),
        age: 0,
        life: 0,
        delay: s * 0.12,
        vx: (Math.random() - 0.5) * 0.05,
        vz: (Math.random() - 0.5) * 0.05,
        vy: 0.22 + Math.random() * 0.12,
      };
      group.add(sp);
      smokeSprites.push(sp);
    }

    candleItems.push({
      flameGroup,
      flameMat,
      coreMat,
      glowSprite,
      auraGlowSprite,
      light,
      lightIntensity,
      flameScale,
      seed,
    });
  });

  let lit = false;
  let flamePower = 0;
  let targetPower = 0;

  return {
    root,
    hitTargets,
    track,

    ignite() {
      lit = true;
      targetPower = 1;
      for (const sp of smokeSprites) {
        sp.visible = false;
      }
    },

    extinguish() {
      if (!lit && targetPower === 0) return;
      lit = false;
      targetPower = 0;
      for (const sp of smokeSprites) {
        const u = sp.userData;
        sp.position.copy(u.origin).add(new THREE.Vector3(0, 0.05, 0));
        u.age = -u.delay;
        u.life = 2.4 + Math.random() * 1.1;
        sp.scale.set(0.08, 0.08, 1);
        sp.material.opacity = 0;
        sp.visible = true;
      }
    },

    isLit() {
      return lit;
    },

    update(dt, elapsed, blowIntensity = 0) {
      const speed = targetPower > flamePower ? 4.5 : 7.5;
      flamePower += (targetPower - flamePower) * Math.min(1, dt * speed);
      const effectiveBlow = lit ? blowIntensity : 0;

      for (const item of candleItems) {
        item.flameGroup.visible = flamePower > 0.015;
        item.flameMat.uniforms.uTime.value = elapsed;
        item.flameMat.uniforms.uBlow.value = effectiveBlow;
        item.flameMat.uniforms.uOpacity.value = flamePower;

        item.coreMat.opacity = 0.98 * flamePower * (1 - effectiveBlow * 0.4);

        const flicker = 0.9 + 0.1 * Math.sin(elapsed * 13 + item.seed) + 0.06 * Math.cos(elapsed * 21 + item.seed);
        const s = flamePower * item.flameScale * (0.94 + 0.08 * flicker);
        item.flameGroup.scale.set(s, s * (1 - effectiveBlow * 0.25), s);
        item.flameGroup.rotation.z = -effectiveBlow * (0.35 + 0.15 * Math.sin(elapsed * 24 + item.seed));

        item.glowSprite.material.opacity = 0.78 * flamePower * flicker * (1 - effectiveBlow * 0.35);
        item.auraGlowSprite.material.opacity = 0.24 * flamePower * flicker * (1 - effectiveBlow * 0.45);
        item.light.intensity = item.lightIntensity * flamePower * flicker * (1 - effectiveBlow * 0.3);
      }

      for (const fs of flameSparkles) {
        const twinkle = Math.pow(0.5 + 0.5 * Math.sin(elapsed * 3.8 + fs.phase), 3.0);
        fs.sprite.material.opacity = flamePower * (0.15 + 0.85 * twinkle) * (1 - effectiveBlow * 0.6);
        const gs = 0.06 + 0.06 * twinkle;
        fs.sprite.scale.setScalar(gs);
      }

      for (const sp of smokeSprites) {
        if (!sp.visible) continue;
        const u = sp.userData;
        u.age += dt;
        if (u.age < 0) continue;
        if (u.age >= u.life) {
          sp.visible = false;
          continue;
        }
        const p = u.age / u.life;
        sp.position.x = u.origin.x + Math.sin(elapsed * 2.4 + u.delay * 10) * 0.04 * p + u.vx * u.age;
        sp.position.y = u.origin.y + 0.06 + u.vy * u.age;
        sp.position.z = u.origin.z + Math.cos(elapsed * 2.1 + u.delay * 8) * 0.04 * p + u.vz * u.age;
        const scale = 0.08 + p * 0.28;
        sp.scale.set(scale, scale, 1);
        sp.material.opacity = Math.sin(p * Math.PI) * 0.42;
      }
    },

    dispose() {
      for (const item of disposables) {
        if (typeof item.dispose === 'function') item.dispose();
      }
    },
  };
}

function createSpiralStripeTexture(baseHex, stripeHex) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  // 优雅的螺旋香槟金细条纹
  ctx.strokeStyle = stripeHex;
  ctx.lineWidth = 14;
  for (let offset = -size; offset < size * 2; offset += 64) {
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + size, size);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 浪漫无龄细长蜡烛组：3 支错落有致的珍珠白 / 樱粉 / 象牙白香槟金细蜡烛
export function createClassicCandles() {
  const root = new THREE.Group();
  const extraDisposables = [];
  const track = (obj) => {
    extraDisposables.push(obj);
    return obj;
  };

  const centerTex = track(createSpiralStripeTexture('#fffaf6', '#f2cd80'));
  const goldCupMat = track(new THREE.MeshStandardMaterial({
    color: 0xf7d58b,
    emissive: 0x5c4212,
    emissiveIntensity: 0.25,
    metalness: 0.72,
    roughness: 0.22,
  }));
  const wickMat = track(new THREE.MeshStandardMaterial({ color: 0x26201c, roughness: 0.9 }));

  const specs = [
    { x: -0.17, z: 0.04, height: 0.36, color: '#ffe3ee', stripe: false, flameScale: 0.78, lightIntensity: 1.0, seed: 1.1 },
    { x: 0.0, z: -0.02, height: 0.50, color: '#fffaf6', stripe: true, flameScale: 0.92, lightIntensity: 1.5, seed: 2.7 },
    { x: 0.17, z: 0.04, height: 0.34, color: '#fff7ee', stripe: false, flameScale: 0.76, lightIntensity: 1.0, seed: 4.3 },
  ];

  const candleConfigs = [];

  for (const spec of specs) {
    const group = new THREE.Group();
    group.position.set(spec.x, 0, spec.z);
    root.add(group);

    // 迷你香槟金底座托杯
    const cupGeo = track(new THREE.CylinderGeometry(0.036, 0.022, 0.034, 16));
    const cup = new THREE.Mesh(cupGeo, goldCupMat);
    cup.position.y = 0.017;
    group.add(cup);

    const rimGeo = track(new THREE.TorusGeometry(0.034, 0.007, 8, 20));
    const rim = new THREE.Mesh(rimGeo, goldCupMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.034;
    group.add(rim);

    // 纤细光滑蜡烛杆
    const bodyGeo = track(new THREE.CylinderGeometry(0.023, 0.024, spec.height, 20));
    const bodyMat = track(new THREE.MeshPhysicalMaterial({
      color: spec.stripe ? 0xffffff : spec.color,
      map: spec.stripe ? centerTex : null,
      emissive: 0xffeef4,
      emissiveIntensity: 0.14,
      roughness: 0.28,
      metalness: 0.04,
      clearcoat: 0.35,
    }));
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.03 + spec.height / 2;
    group.add(body);

    const topCapGeo = track(new THREE.SphereGeometry(0.023, 14, 10));
    const topCap = new THREE.Mesh(topCapGeo, bodyMat);
    topCap.scale.set(1, 0.4, 1);
    topCap.position.y = 0.03 + spec.height;
    group.add(topCap);

    // 细烛芯
    const wickCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.03 + spec.height, 0),
      new THREE.Vector3(0.003, 0.03 + spec.height + 0.025, 0),
      new THREE.Vector3(0.007, 0.03 + spec.height + 0.052, 0.003),
    ]);
    const wickGeo = track(new THREE.TubeGeometry(wickCurve, 8, 0.0045, 6, false));
    const wick = new THREE.Mesh(wickGeo, wickMat);
    group.add(wick);

    candleConfigs.push({
      group,
      flameAnchor: new THREE.Vector3(0.007, 0.03 + spec.height + 0.048, 0.003),
      lightIntensity: spec.lightIntensity,
      flameScale: spec.flameScale,
      seed: spec.seed,
    });
  }

  const controller = createCandleController(root, candleConfigs);
  const baseDispose = controller.dispose.bind(controller);
  controller.dispose = () => {
    baseDispose();
    for (const item of extraDisposables) {
      if (typeof item.dispose === 'function') item.dispose();
    }
  };
  return controller;
}

function buildDigitMesh(digitChar, waxMaterial, pinMaterial, track) {
  const spec = DIGIT_STROKES[digitChar] || DIGIT_STROKES[6];
  const group = new THREE.Group();
  const radius = 0.044;
  const capGeo = track(new THREE.SphereGeometry(radius, 14, 12));

  for (const stroke of spec.strokes) {
    const vecs = stroke.pts.map(([x, y]) => new THREE.Vector3(x, y, 0));
    const curve = new THREE.CatmullRomCurve3(vecs, Boolean(stroke.closed), 'catmullrom', 0.35);
    const tubeGeo = track(new THREE.TubeGeometry(curve, stroke.closed ? 44 : 28, radius, 14, Boolean(stroke.closed)));
    const tubeMesh = new THREE.Mesh(tubeGeo, waxMaterial);
    group.add(tubeMesh);

    if (!stroke.closed) {
      const startCap = new THREE.Mesh(capGeo, waxMaterial);
      startCap.position.copy(vecs[0]);
      group.add(startCap);

      const endCap = new THREE.Mesh(capGeo, waxMaterial);
      endCap.position.copy(vecs[vecs.length - 1]);
      group.add(endCap);
    }
  }

  const pinGeo = track(new THREE.CylinderGeometry(0.012, 0.009, 0.16, 10));
  const pin = new THREE.Mesh(pinGeo, pinMaterial);
  pin.position.set(0, -0.015, 0);
  group.add(pin);

  const wickCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(spec.wickX, spec.wickY - 0.02, 0),
    new THREE.Vector3(spec.wickX + 0.004, spec.wickY + 0.035, 0),
    new THREE.Vector3(spec.wickX + 0.01, spec.wickY + 0.072, 0.004),
  ]);
  const wickGeo = track(new THREE.TubeGeometry(wickCurve, 8, 0.008, 6, false));
  const wickMat = track(new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.9 }));
  const wick = new THREE.Mesh(wickGeo, wickMat);
  group.add(wick);

  return {
    group,
    flameAnchor: new THREE.Vector3(spec.wickX + 0.01, spec.wickY + 0.068, 0.004),
  };
}

export function createAgeCandles(age) {
  const digits = String(Math.min(99, Math.max(1, age))).split('');
  const root = new THREE.Group();
  root.scale.setScalar(0.56);

  const extraDisposables = [];
  const track = (obj) => {
    extraDisposables.push(obj);
    return obj;
  };

  const waxMaterial = track(new THREE.MeshStandardMaterial({
    color: 0xffdc7a,
    emissive: 0x8a5a10,
    emissiveIntensity: 0.55,
    metalness: 0.3,
    roughness: 0.22,
  }));

  const pinMaterial = track(new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    metalness: 0.72,
    roughness: 0.2,
  }));

  const spacing = digits.length === 1 ? 0 : 0.40;
  const startX = -((digits.length - 1) * spacing) / 2;

  const candleConfigs = digits.map((d, idx) => {
    const { group, flameAnchor } = buildDigitMesh(d, waxMaterial, pinMaterial, track);
    group.position.set(startX + idx * spacing, 0, 0);
    root.add(group);
    return {
      group,
      flameAnchor,
      lightIntensity: 1.5,
      flameScale: 1.0,
      seed: idx * 2.13,
    };
  });

  const controller = createCandleController(root, candleConfigs);
  const baseDispose = controller.dispose.bind(controller);
  controller.dispose = () => {
    baseDispose();
    for (const item of extraDisposables) {
      if (typeof item.dispose === 'function') item.dispose();
    }
  };
  return controller;
}
