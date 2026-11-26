// 离线 Web Audio API 生日歌合成器 + 外部音频播放与无缝回退

const NOTE_FREQS = {
  C3: 130.81, F3: 174.61, G3: 196.0, A3: 220.0, Bb3: 233.08,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, Bb4: 466.16,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
};

// 柔和的 F 大调《祝你生日快乐》旋律 + 伴奏分解和弦（拍号 3/4，约 84 BPM）
const BEAT_SEC = 0.68;
const MELODY = [
  // Pick-up: Happy birth-day to you (F)
  { note: 'C4', start: 0.0, dur: 0.72, vel: 0.8 },
  { note: 'C4', start: 0.75, dur: 0.25, vel: 0.75 },
  { note: 'D4', start: 1.0, dur: 0.95, vel: 0.9 },
  { note: 'C4', start: 2.0, dur: 0.95, vel: 0.85 },
  { note: 'F4', start: 3.0, dur: 0.95, vel: 0.95 },
  { note: 'E4', start: 4.0, dur: 1.85, vel: 0.9 },

  // Happy birth-day to you (C7)
  { note: 'C4', start: 6.0, dur: 0.72, vel: 0.8 },
  { note: 'C4', start: 6.75, dur: 0.25, vel: 0.75 },
  { note: 'D4', start: 7.0, dur: 0.95, vel: 0.9 },
  { note: 'C4', start: 8.0, dur: 0.95, vel: 0.85 },
  { note: 'G4', start: 9.0, dur: 0.95, vel: 0.95 },
  { note: 'F4', start: 10.0, dur: 1.85, vel: 0.92 },

  // Happy birth-day dear friend (Bb)
  { note: 'C4', start: 12.0, dur: 0.72, vel: 0.85 },
  { note: 'C4', start: 12.75, dur: 0.25, vel: 0.8 },
  { note: 'C5', start: 13.0, dur: 0.95, vel: 1.0 },
  { note: 'A4', start: 14.0, dur: 0.95, vel: 0.95 },
  { note: 'F4', start: 15.0, dur: 0.95, vel: 0.9 },
  { note: 'E4', start: 16.0, dur: 0.95, vel: 0.85 },
  { note: 'D4', start: 17.0, dur: 1.85, vel: 0.9 },

  // Happy birth-day to you (F - C7 - F)
  { note: 'Bb4', start: 19.0, dur: 0.72, vel: 0.92 },
  { note: 'Bb4', start: 19.75, dur: 0.25, vel: 0.85 },
  { note: 'A4', start: 20.0, dur: 0.95, vel: 0.95 },
  { note: 'F4', start: 21.0, dur: 0.95, vel: 0.9 },
  { note: 'G4', start: 22.0, dur: 0.95, vel: 0.92 },
  { note: 'F4', start: 23.0, dur: 2.3, vel: 0.95 },
];

const ACCOMPANIMENT = [
  // Bar 1: Fmaj
  { note: 'F3', start: 1.0, dur: 1.8, vel: 0.32 },
  { note: 'C4', start: 1.5, dur: 1.3, vel: 0.25 },
  { note: 'A4', start: 2.0, dur: 1.1, vel: 0.22 },
  // Bar 2: C7
  { note: 'C3', start: 4.0, dur: 1.8, vel: 0.32 },
  { note: 'G3', start: 4.5, dur: 1.3, vel: 0.24 },
  { note: 'Bb3', start: 5.0, dur: 1.1, vel: 0.22 },
  // Bar 3: C7
  { note: 'C3', start: 7.0, dur: 1.8, vel: 0.32 },
  { note: 'G3', start: 7.5, dur: 1.3, vel: 0.24 },
  { note: 'E4', start: 8.0, dur: 1.1, vel: 0.2 },
  // Bar 4: Fmaj
  { note: 'F3', start: 10.0, dur: 1.8, vel: 0.32 },
  { note: 'C4', start: 10.5, dur: 1.3, vel: 0.24 },
  { note: 'A4', start: 11.0, dur: 1.1, vel: 0.22 },
  // Bar 5: F7 -> Bb
  { note: 'F3', start: 13.0, dur: 1.8, vel: 0.32 },
  { note: 'A3', start: 13.5, dur: 1.3, vel: 0.24 },
  { note: 'C4', start: 14.0, dur: 1.1, vel: 0.22 },
  { note: 'Bb3', start: 16.0, dur: 1.8, vel: 0.32 },
  { note: 'F4', start: 16.5, dur: 1.3, vel: 0.24 },
  { note: 'D4', start: 17.0, dur: 1.1, vel: 0.22 },
  // Bar 7-8: F/C -> C7 -> F
  { note: 'C3', start: 20.0, dur: 1.5, vel: 0.3 },
  { note: 'A3', start: 20.5, dur: 1.2, vel: 0.24 },
  { note: 'C3', start: 22.0, dur: 0.9, vel: 0.28 },
  { note: 'G3', start: 22.35, dur: 0.8, vel: 0.22 },
  { note: 'F3', start: 23.0, dur: 2.4, vel: 0.35 },
  { note: 'C4', start: 23.3, dur: 2.1, vel: 0.25 },
  { note: 'A4', start: 23.6, dur: 1.8, vel: 0.2 },
];

const LOOP_BEATS = 26.5;

export class MusicEngine {
  constructor({ preset = 'musicbox', audioUrl = '' } = {}) {
    this.preset = preset;
    this.audioUrl = audioUrl;
    this.ctx = null;
    this.masterGain = null;
    this.reverbNode = null;
    this.muted = false;
    this.started = false;
    this.schedulerId = null;
    this.nextLoopStart = 0;
    this.externalAudio = null;
    this.usingExternal = false;
    this.localObjectUrl = null;
  }

  _ensureContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 0.72;

    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.ratio.value = 3;

    this.reverbNode = this._createReverb(2.1, 2.4);
    const wetGain = this.ctx.createGain();
    wetGain.gain.value = 0.28;

    this.masterGain.connect(compressor);
    this.masterGain.connect(this.reverbNode);
    this.reverbNode.connect(wetGain);
    wetGain.connect(compressor);
    compressor.connect(this.ctx.destination);
  }

  _createReverb(seconds, decay) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch += 1) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i += 1) {
        const env = Math.pow(1 - i / length, decay);
        data[i] = (Math.random() * 2 - 1) * env;
      }
    }
    const convolver = this.ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  setPreset(preset) {
    if (['musicbox', 'piano', 'chimes'].includes(preset)) {
      this.preset = preset;
    }
  }

  setLocalFile(file) {
    if (this.localObjectUrl) {
      URL.revokeObjectURL(this.localObjectUrl);
      this.localObjectUrl = null;
    }
    if (file) {
      this.localObjectUrl = URL.createObjectURL(file);
      this.audioUrl = this.localObjectUrl;
    }
  }

  async start() {
    this._ensureContext();
    this.started = true;

    if (this.audioUrl) {
      const ok = await this._tryPlayExternal(this.audioUrl);
      if (ok) {
        this.usingExternal = true;
        return;
      }
    }

    this.usingExternal = false;
    this._startSynthLoop();
  }

  async _tryPlayExternal(url) {
    try {
      if (this.externalAudio) {
        this.externalAudio.pause();
      }
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = this.muted ? 0 : 0.65;
      audio.crossOrigin = 'anonymous';
      this.externalAudio = audio;
      await audio.play();
      return true;
    } catch {
      this.externalAudio = null;
      return false;
    }
  }

  _startSynthLoop() {
    if (!this.ctx || this.schedulerId !== null) return;
    this.nextLoopStart = this.ctx.currentTime + 0.08;
    this._schedulePhrase(this.nextLoopStart);
    this.nextLoopStart += LOOP_BEATS * BEAT_SEC;

    this.schedulerId = window.setInterval(() => {
      if (!this.ctx || !this.started || this.usingExternal) return;
      while (this.nextLoopStart < this.ctx.currentTime + 2.5) {
        this._schedulePhrase(this.nextLoopStart);
        this.nextLoopStart += LOOP_BEATS * BEAT_SEC;
      }
    }, 800);
  }

  _schedulePhrase(baseTime) {
    for (const item of MELODY) {
      const freq = NOTE_FREQS[item.note];
      if (!freq) continue;
      this._playNote(freq, baseTime + item.start * BEAT_SEC, item.dur * BEAT_SEC, item.vel * 0.24, true);
    }
    for (const item of ACCOMPANIMENT) {
      const freq = NOTE_FREQS[item.note];
      if (!freq) continue;
      this._playNote(freq, baseTime + item.start * BEAT_SEC, item.dur * BEAT_SEC, item.vel * 0.17, false);
    }
  }

  _playNote(freq, when, duration, gainPeak, isLead) {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    if (this.preset === 'musicbox') {
      // 八音盒：清脆铃片基音 + 高次泛音 + 轻柔衰减
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(isLead ? freq * 2 : freq, when);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime((isLead ? freq * 2 : freq) * 3.003, when);

      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.16, when);
      g2.gain.exponentialRampToValueAtTime(0.001, when + Math.min(0.25, duration));

      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.linearRampToValueAtTime(gainPeak, when + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0008, when + duration + 0.75);

      osc1.connect(gain);
      osc2.connect(g2);
      g2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(when);
      osc2.start(when);
      const stopAt = when + duration + 0.85;
      osc1.stop(stopAt);
      osc2.stop(stopAt);
      return;
    }

    if (this.preset === 'piano') {
      // 柔情钢琴：暖色低通滤波 + 柔和起音
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, when);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, when);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isLead ? 2200 : 1200, when);
      filter.frequency.exponentialRampToValueAtTime(480, when + duration + 0.6);

      const g2 = ctx.createGain();
      g2.gain.value = 0.25;

      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.linearRampToValueAtTime(gainPeak * 1.15, when + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, when + duration + 0.9);

      osc1.connect(filter);
      osc2.connect(g2);
      g2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(when);
      osc2.start(when);
      const stopAt = when + duration + 1.0;
      osc1.stop(stopAt);
      osc2.stop(stopAt);
      return;
    }

    // 星空风铃 chimes：空气感双失谐正弦波 + 较长余韵
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseF = isLead ? freq * 2 : freq;
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseF, when);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseF * 1.004, when);

    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(gainPeak * 0.9, when + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0007, when + duration + 1.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(when);
    osc2.start(when);
    const stopAt = when + duration + 1.4;
    osc1.stop(stopAt);
    osc2.stop(stopAt);
  }

  playIgniteSparkle() {
    this._ensureContext();
    if (!this.ctx || !this.masterGain || this.muted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const now = this.ctx.currentTime + 0.02;
    notes.forEach((f, idx) => {
      this._playNote(f, now + idx * 0.075, 0.7, 0.14, true);
    });
  }

  playFireworkBurst() {
    this._ensureContext();
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    // 柔和小烟花碎响 + 闪烁星铃
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
    const noiseBuf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2.5);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);

    [880, 1174.66, 1396.91].forEach((f, idx) => {
      this._playNote(f, now + idx * 0.06, 0.55, 0.09, true);
    });
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.72, this.ctx.currentTime, 0.08);
    }
    if (this.externalAudio) {
      this.externalAudio.volume = this.muted ? 0 : 0.65;
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  dispose() {
    if (this.schedulerId !== null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    if (this.externalAudio) {
      this.externalAudio.pause();
      this.externalAudio = null;
    }
    if (this.localObjectUrl) {
      URL.revokeObjectURL(this.localObjectUrl);
      this.localObjectUrl = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
