import { loadConfig } from './config.js';
import { MusicEngine } from './audio/musicEngine.js';
import { BlowDetector } from './audio/blowDetector.js';
import { BirthdayScene } from './scene/birthdayScene.js';

const config = loadConfig();
document.title = config.name === 'You' ? 'Happy Birthday' : `Happy Birthday · ${config.name}`;

// 支持从 customize.html 同域会话预览临时上传的本地 MP3
let previewAudioUrl = config.audioUrl;
try {
  const sessionAudio = sessionStorage.getItem('birthday_preview_audio');
  if (sessionAudio && sessionAudio.startsWith('blob:')) {
    previewAudioUrl = sessionAudio;
  }
} catch {
  // ignore storage errors
}

const sceneContainer = document.getElementById('scene-container');
const introOverlay = document.getElementById('intro-overlay');
const introRecipient = document.getElementById('intro-recipient');
const muteBtn = document.getElementById('mute-btn');
const iconSoundOn = document.getElementById('icon-sound-on');
const iconSoundOff = document.getElementById('icon-sound-off');

const celebrationUi = document.getElementById('celebration-ui');
const recipientLabel = document.getElementById('recipient-label');
const wishTriggerArea = document.getElementById('wish-trigger-area');
const wishBtn = document.getElementById('wish-btn');
const wishActiveArea = document.getElementById('wish-active-area');
const blowHintText = document.getElementById('blow-hint-text');
const blowMeterFill = document.getElementById('blow-meter-fill');
const blowFallbackBtn = document.getElementById('blow-fallback-btn');
const relightRow = document.getElementById('relight-row');
const relightBottomBtn = document.getElementById('relight-bottom-btn');

const wishCardOverlay = document.getElementById('wish-card-overlay');
const wishCardTag = document.getElementById('wish-card-tag');
const wishCardText = document.getElementById('wish-card-text');
const relightCardBtn = document.getElementById('relight-card-btn');
const viewCakeBtn = document.getElementById('view-cake-btn');

// 所有用户输入严格使用 textContent 注入，避免 XSS
introRecipient.textContent = config.name === 'You' ? 'A Birthday Surprise' : `For ${config.name}`;
recipientLabel.textContent = config.name === 'You' ? 'For You' : `${config.name} 专属`;
wishCardTag.textContent = `For ${config.name} · ${config.age}`;
wishCardText.textContent = config.wish;

const music = new MusicEngine({
  preset: config.music,
  audioUrl: previewAudioUrl,
});

let wishCardTimer = null;
let scene = null;
let hasStarted = false;

function handleExtinguish() {
  if (!scene || scene.state === 'blown') return;
  blowDetector.stop();
  scene.blowOut();
  music.playFireworkBurst();

  wishActiveArea.classList.add('hidden');
  wishTriggerArea.classList.add('hidden');
  relightRow.classList.add('hidden');

  clearTimeout(wishCardTimer);
  wishCardTimer = window.setTimeout(() => {
    wishCardOverlay.classList.remove('hidden');
  }, 1250);
}

const blowDetector = new BlowDetector({
  onIntensity(val) {
    if (scene) scene.setBlowIntensity(val);
    blowMeterFill.style.width = `${Math.round(val * 100)}%`;
  },
  onBlowOut() {
    handleExtinguish();
  },
});

scene = new BirthdayScene(sceneContainer, {
  age: config.age,
  onFlameTap() {
    handleExtinguish();
  },
});

function updateMuteIcon(isMuted) {
  iconSoundOn.classList.toggle('hidden', isMuted);
  iconSoundOff.classList.toggle('hidden', !isMuted);
}

function startCelebration() {
  if (hasStarted) return;
  hasStarted = true;
  introOverlay.classList.add('fade-out');
  celebrationUi.classList.remove('hidden');
  muteBtn.classList.remove('hidden');

  scene.runAndLight();
  music.playIgniteSparkle();
  music.start();
  updateMuteIcon(music.isMuted());
}

introOverlay.addEventListener('click', startCelebration);
introOverlay.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    startCelebration();
  }
});

muteBtn.addEventListener('click', () => {
  const muted = music.toggleMute();
  updateMuteIcon(muted);
});

wishBtn.addEventListener('click', async () => {
  scene.enterWishMode();
  wishTriggerArea.classList.add('hidden');
  relightRow.classList.add('hidden');
  wishActiveArea.classList.remove('hidden');
  blowMeterFill.style.width = '0%';
  blowHintText.textContent = 'Blow or Tap Flame';

  const result = await blowDetector.start();
  if (!result.supported) {
    blowHintText.textContent = 'Tap Flame or Blow Out';
  }
});

blowFallbackBtn.addEventListener('click', () => {
  handleExtinguish();
});

function handleRelight() {
  clearTimeout(wishCardTimer);
  blowDetector.stop();
  wishCardOverlay.classList.add('hidden');
  wishActiveArea.classList.add('hidden');
  relightRow.classList.add('hidden');
  wishTriggerArea.classList.remove('hidden');

  scene.relight();
  music.playIgniteSparkle();
}

relightCardBtn.addEventListener('click', handleRelight);
relightBottomBtn.addEventListener('click', handleRelight);

viewCakeBtn.addEventListener('click', () => {
  wishCardOverlay.classList.add('hidden');
  relightRow.classList.remove('hidden');
});
