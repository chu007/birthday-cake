import { loadConfig, clampAge, sanitizeAudioUrl } from './config.js';

const defaults = loadConfig();

const form = document.getElementById('custom-form');
const inputName = document.getElementById('input-name');
const inputAge = document.getElementById('input-age');
const inputWish = document.getElementById('input-wish');
const inputMusic = document.getElementById('input-music');
const audioUrlField = document.getElementById('audio-url-field');
const inputAudioUrl = document.getElementById('input-audio-url');
const inputLocalFile = document.getElementById('input-local-file');

const previewBtn = document.getElementById('preview-btn');
const resultBox = document.getElementById('result-box');
const generatedUrlInput = document.getElementById('generated-url');
const copyBtn = document.getElementById('copy-btn');
const copyToast = document.getElementById('copy-toast');

inputName.value = defaults.name;
inputAge.value = String(defaults.age);
inputWish.value = defaults.wish;

if (defaults.audioUrl) {
  inputMusic.value = 'custom_url';
  inputAudioUrl.value = defaults.audioUrl;
  audioUrlField.classList.remove('hidden');
} else {
  inputMusic.value = defaults.music;
}

inputMusic.addEventListener('change', () => {
  const isCustom = inputMusic.value === 'custom_url';
  audioUrlField.classList.toggle('hidden', !isCustom);
});

let localBlobUrl = '';
inputLocalFile.addEventListener('change', () => {
  if (localBlobUrl) {
    URL.revokeObjectURL(localBlobUrl);
    localBlobUrl = '';
  }
  const file = inputLocalFile.files && inputLocalFile.files[0];
  if (file) {
    localBlobUrl = URL.createObjectURL(file);
  }
});

function buildShareUrl() {
  const name = inputName.value.trim().slice(0, 32) || defaults.name;
  const age = clampAge(inputAge.value, defaults.age);
  const wish = inputWish.value.trim().slice(0, 300) || defaults.wish;

  const url = new URL('./index.html', window.location.href);
  url.searchParams.set('name', name);
  url.searchParams.set('age', String(age));
  url.searchParams.set('wish', wish);

  if (inputMusic.value === 'custom_url') {
    const cleanAudio = sanitizeAudioUrl(inputAudioUrl.value);
    url.searchParams.set('music', 'musicbox');
    if (cleanAudio) {
      url.searchParams.set('audio', cleanAudio);
    }
  } else {
    url.searchParams.set('music', inputMusic.value);
  }

  return url.toString();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const shareUrl = buildShareUrl();
  generatedUrlInput.value = shareUrl;
  resultBox.classList.remove('hidden');
  copyToast.classList.add('hidden');
});

copyBtn.addEventListener('click', async () => {
  const text = generatedUrlInput.value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    generatedUrlInput.select();
    document.execCommand('copy');
  }
  copyToast.classList.remove('hidden');
  window.setTimeout(() => copyToast.classList.add('hidden'), 2000);
});

previewBtn.addEventListener('click', () => {
  try {
    if (localBlobUrl) {
      sessionStorage.setItem('birthday_preview_audio', localBlobUrl);
    } else {
      sessionStorage.removeItem('birthday_preview_audio');
    }
  } catch {
    // ignore storage errors
  }
  window.location.href = buildShareUrl();
});
