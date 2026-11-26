const VALID_STYLES = new Set(['strawberry', 'cherry']);
const VALID_PRESETS = new Set(['musicbox', 'piano', 'chimes']);
const VALID_CANDLE_STYLES = new Set(['classic', 'number']);

const DEFAULT_CONFIG = {
  style: 'strawberry',
  name: 'You',
  candles: 'classic',
  age: 18,
  wish: '生日快乐！愿你永远闪闪发光，自由快乐！',
  music: 'musicbox',
  audioUrl: '',
};

export function sanitizeAudioUrl(raw) {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('./') || trimmed.startsWith('/')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
  } catch {
    return '';
  }
  return '';
}

export function clampAge(raw, fallback = DEFAULT_CONFIG.age) {
  const num = Number.parseInt(String(raw ?? ''), 10);
  if (Number.isNaN(num)) return fallback;
  return Math.min(99, Math.max(1, num));
}

export function loadConfig() {
  const globalCfg = typeof window !== 'undefined' && window.BIRTHDAY_CONFIG ? window.BIRTHDAY_CONFIG : {};
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();

  const baseStyle = VALID_STYLES.has(globalCfg.style) ? globalCfg.style : DEFAULT_CONFIG.style;
  const paramStyle = params.get('style');
  const style = paramStyle && VALID_STYLES.has(paramStyle) ? paramStyle : baseStyle;

  const baseName = typeof globalCfg.name === 'string' && globalCfg.name.trim()
    ? globalCfg.name.trim().slice(0, 32)
    : DEFAULT_CONFIG.name;
  const paramName = params.get('name');
  const name = paramName && paramName.trim() ? paramName.trim().slice(0, 32) : baseName;

  const baseAge = clampAge(globalCfg.age, DEFAULT_CONFIG.age);
  const paramAge = params.get('age');
  const age = paramAge !== null && paramAge.trim() !== '' ? clampAge(paramAge, baseAge) : baseAge;

  const baseCandles = VALID_CANDLE_STYLES.has(globalCfg.candles) ? globalCfg.candles : DEFAULT_CONFIG.candles;
  const paramCandles = params.get('candles');
  let candles = baseCandles;
  if (paramCandles && VALID_CANDLE_STYLES.has(paramCandles)) {
    candles = paramCandles;
  } else if (paramAge !== null && paramAge.trim() !== '' && paramCandles !== 'classic') {
    candles = 'number';
  }

  const baseWish = typeof globalCfg.wish === 'string' && globalCfg.wish.trim()
    ? globalCfg.wish.trim().slice(0, 300)
    : DEFAULT_CONFIG.wish;
  const paramWish = params.get('wish');
  const wish = paramWish && paramWish.trim() ? paramWish.trim().slice(0, 300) : baseWish;

  const baseMusic = VALID_PRESETS.has(globalCfg.music) ? globalCfg.music : DEFAULT_CONFIG.music;
  const paramMusic = params.get('music');
  const music = paramMusic && VALID_PRESETS.has(paramMusic) ? paramMusic : baseMusic;

  const baseAudio = sanitizeAudioUrl(globalCfg.audioUrl);
  const paramAudio = params.get('audio');
  const audioUrl = paramAudio !== null ? sanitizeAudioUrl(paramAudio) : baseAudio;

  return {
    style,
    name,
    candles,
    age,
    wish,
    music,
    audioUrl,
  };
}
