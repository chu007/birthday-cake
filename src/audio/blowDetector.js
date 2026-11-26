// 麦克风吹气检测：自适应环境底噪，持续吹气约 350ms 触发熄灭，同时实时返回气流强度驱动火苗摇曳

export class BlowDetector {
  constructor({ onIntensity, onBlowOut } = {}) {
    this.onIntensity = onIntensity || (() => {});
    this.onBlowOut = onBlowOut || (() => {});
    this.stream = null;
    this.ctx = null;
    this.analyser = null;
    this.dataArray = null;
    this.rafId = null;
    this.active = false;
    this.baseline = 0;
    this.baselineSamples = [];
    this.blowAccumMs = 0;
    this.lastTime = 0;
    this.triggered = false;
  }

  async start() {
    if (this.active) return { supported: true };
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { supported: false, reason: 'no-media-devices' };
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    } catch {
      return { supported: false, reason: 'permission-denied-or-insecure' };
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      this.stop();
      return { supported: false, reason: 'no-audio-context' };
    }

    this.ctx = new AudioCtx();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume().catch(() => {});
    }

    const source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.72;
    source.connect(this.analyser);

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.active = true;
    this.triggered = false;
    this.baseline = 0;
    this.baselineSamples = [];
    this.blowAccumMs = 0;
    this.lastTime = performance.now();

    const startTime = this.lastTime;

    const tick = (now) => {
      if (!this.active || !this.analyser) return;
      const dt = Math.min(80, now - this.lastTime);
      this.lastTime = now;

      this.analyser.getByteFrequencyData(this.dataArray);

      // 吹气的风声主要集中在低中频湍流能量（约前 28 个 bin）
      let lowMidSum = 0;
      const bins = Math.min(28, this.dataArray.length);
      for (let i = 1; i < bins; i += 1) {
        lowMidSum += this.dataArray[i];
      }
      const avgEnergy = lowMidSum / (bins - 1);

      // 前 420ms 校准环境底噪
      if (now - startTime < 420) {
        this.baselineSamples.push(avgEnergy);
        const sum = this.baselineSamples.reduce((a, b) => a + b, 0);
        this.baseline = sum / this.baselineSamples.length;
        this.onIntensity(0);
        this.rafId = requestAnimationFrame(tick);
        return;
      }

      const delta = Math.max(0, avgEnergy - this.baseline);
      const threshold = Math.max(16, this.baseline * 0.65 + 14);
      const intensity = Math.min(1, delta / (threshold * 1.6));
      this.onIntensity(intensity);

      if (!this.triggered && delta > threshold) {
        this.blowAccumMs += dt;
        if (this.blowAccumMs >= 340) {
          this.triggered = true;
          this.onIntensity(1);
          this.onBlowOut();
          this.stop();
          return;
        }
      } else {
        this.blowAccumMs = Math.max(0, this.blowAccumMs - dt * 0.6);
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
    return { supported: true };
  }

  stop() {
    this.active = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.analyser = null;
    this.onIntensity(0);
  }
}
