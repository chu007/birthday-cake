import * as THREE from 'three';

// 为数字 0-9 定义平滑中心线路径，使用 TubeGeometry + 圆球端点构建立体圆润的小巧数字蜡烛
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
  grad.addColorStop(0.2, 'rgba(255, 224, 130, 0.85)');
  grad.addColorStop(0.5, 'rgba(255, 165, 55, 0.26)');
  grad.addColorStop(1.0, 'rgba(255, 120, 20, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
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
  grad.addColorStop(0.0, 'rgba(225, 235, 255, 0.65)');
  grad.addColorStop(0.5, 'rgba(180, 200, 230, 0.22)');
  grad.addColorStop(1.0, 'rgba(150, 175, 210, 0.0)');
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

        float sway = sin(uTime * 7.5 + uSeed + h * 3.5) * 0.014 * h;
        float swayZ = cos(uTime * 6.2 + uSeed * 1.7 + h * 3.0) * 0.009 * h;
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
        vec3 baseBlue = vec3(0.32, 0.68, 1.0);
        vec3 midAmber = vec3(1.0, 0.78, 0.28);
        vec3 tipGold = vec3(1.0, 0.98, 0.84);

        vec3 col = mix(baseBlue, midAmber, smoothstep(0.0, 0.28, vHeight));
        col = mix(col, tipGold, smoothstep(0.28, 0.82, vHeight));

        float alpha = smoothstep(0.0, 0.12, vHeight) * (1.0 - smoothstep(0.76, 1.0, vHeight));
        alpha *= flicker * uOpacity * mix(1.0, 0.55, uBlow);

        gl_FragColor = vec4(col * 1.6, alpha);
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
    const radius = Math.sin(Math.pow(t, 0.52) * Math.PI) * 0.062 * (1 - 0.36 * t);
    points.push(new THREE.Vector2(Math.max(0.001, radius), y));
  }
  return new THREE.LatheGeometry(points, 18);
}

function buildDigitMesh(digitChar, waxMaterial, pinMaterial) {
  const spec = DIGIT_STROKES[digitChar] || DIGIT_STROKES[6];
  const group = new THREE.Group();
  const radius = 0.044;

  const capGeo = new THREE.SphereGeometry(radius, 14, 12);

  for (const stroke of spec.strokes) {
    const vecs = stroke.pts.map(([x, y]) => new THREE.Vector3(x, y, 0));
    const curve = new THREE.CatmullRomCurve3(vecs, Boolean(stroke.closed), 'catmullrom', 0.35);
    const tubeGeo = new THREE.TubeGeometry(curve, stroke.closed ? 44 : 28, radius, 14, Boolean(stroke.closed));
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

  // 细巧的香槟金支撑插针
  const pinGeo = new THREE.CylinderGeometry(0.012, 0.009, 0.16, 10);
  const pin = new THREE.Mesh(pinGeo, pinMaterial);
  pin.position.set(0, -0.015, 0);
  group.add(pin);

  // 烛芯
  const wickCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(spec.wickX, spec.wickY - 0.02, 0),
    new THREE.Vector3(spec.wickX + 0.004, spec.wickY + 0.035, 0),
    new THREE.Vector3(spec.wickX + 0.01, spec.wickY + 0.072, 0.004),
  ]);
  const wickGeo = new THREE.TubeGeometry(wickCurve, 8, 0.008, 6, false);
  const wickMat = new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.9 });
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
  // 精致小巧的比例：在修长蛋糕顶面居中点缀，避免喧宾夺主
  root.scale.setScalar(0.58);

  const waxMaterial = new THREE.MeshStandardMaterial({
    color: 0xffdc7a,
    emissive: 0x8a5a10,
    emissiveIntensity: 0.55,
    metalness: 0.3,
    roughness: 0.22,
  });

  const pinMaterial = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    metalness: 0.72,
    roughness: 0.2,
  });

  const flameGeo = createTeardropGeometry();
  const coreGeo = createTeardropGeometry();
  coreGeo.scale(0.54, 0.58, 0.54);

  const glowTex = createGlowSpriteTexture();
  const smokeTex = createSmokeTexture();

  const spacing = digits.length === 1 ? 0 : 0.40;
  const startX = -((digits.length - 1) * spacing) / 2;

  const candleItems = [];
  const hitTargets = [];
  const smokeSprites = [];

  digits.forEach((d, idx) => {
    const { group, flameAnchor } = buildDigitMesh(d, waxMaterial, pinMaterial);
    group.position.set(startX + idx * spacing, 0, 0);
    root.add(group);

    const flameGroup = new THREE.Group();
    flameGroup.position.copy(flameAnchor);
    group.add(flameGroup);

    const flameMat = createFlameShaderMaterial(idx * 2.13);
    const outerFlame = new THREE.Mesh(flameGeo, flameMat);
    flameGroup.add(outerFlame);

    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xfffef5,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerCore = new THREE.Mesh(coreGeo, coreMat);
    innerCore.position.y = 0.018;
    flameGroup.add(innerCore);

    // 内层暖金火光晕
    const glowSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xffd57e,
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glowSprite.position.y = 0.16;
    glowSprite.scale.set(0.76, 0.76, 1);
    flameGroup.add(glowSprite);

    // 外层柔和环境烛光晕（呼应原视频蜡烛周围的暖金星雾光环）
    const auraGlowSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xffbe55,
        transparent: true,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    auraGlowSprite.position.y = 0.16;
    auraGlowSprite.scale.set(1.32, 1.32, 1);
    flameGroup.add(auraGlowSprite);

    // 照亮蛋糕顶面彩色糖霜的暖色点光源
    const light = new THREE.PointLight(0xffbe5c, 1.95, 4.4, 1.6);
    light.position.set(0, 0.24, 0.06);
    flameGroup.add(light);

    // 宽容点击热区，确保小尺寸蜡烛在手机上依然容易点击
    const hitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 10),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitMesh.position.set(0, 0.16, 0);
    flameGroup.add(hitMesh);
    hitTargets.push(hitMesh);

    for (let s = 0; s < 7; s += 1) {
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: smokeTex,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
      );
      sp.visible = false;
      sp.userData = {
        origin: flameAnchor.clone(),
        age: 0,
        life: 0,
        delay: s * 0.12,
        vx: (Math.random() - 0.5) * 0.06,
        vz: (Math.random() - 0.5) * 0.06,
        vy: 0.24 + Math.random() * 0.12,
      };
      group.add(sp);
      smokeSprites.push(sp);
    }

    candleItems.push({
      group,
      flameGroup,
      flameMat,
      coreMat,
      glowSprite,
      auraGlowSprite,
      light,
      seed: idx * 2.13,
    });
  });

  let lit = false;
  let flamePower = 0;
  let targetPower = 0;

  return {
    root,
    hitTargets,

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
        sp.scale.set(0.09, 0.09, 1);
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
        const s = flamePower * (0.94 + 0.08 * flicker);
        item.flameGroup.scale.set(s, s * (1 - effectiveBlow * 0.25), s);
        item.flameGroup.rotation.z = -effectiveBlow * (0.35 + 0.15 * Math.sin(elapsed * 24 + item.seed));

        item.glowSprite.material.opacity = 0.82 * flamePower * flicker * (1 - effectiveBlow * 0.35);
        item.auraGlowSprite.material.opacity = 0.28 * flamePower * flicker * (1 - effectiveBlow * 0.45);
        item.light.intensity = 2.1 * flamePower * flicker * (1 - effectiveBlow * 0.3);
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
        const scale = 0.09 + p * 0.32;
        sp.scale.set(scale, scale, 1);
        sp.material.opacity = Math.sin(p * Math.PI) * 0.42;
      }
    },

    dispose() {
      glowTex.dispose();
      smokeTex.dispose();
      flameGeo.dispose();
      coreGeo.dispose();
      waxMaterial.dispose();
      pinMaterial.dispose();
    },
  };
}
