import cakeSceneCode from '../scene/birthdayScene.js?raw';
import musicEngineCode from '../audio/musicEngine.js?raw';

const KEYWORDS = new Set([
  'import', 'from', 'export', 'default', 'class', 'extends', 'constructor',
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'of',
  'in', 'new', 'this', 'true', 'false', 'null', 'async', 'await', 'continue', 'break',
]);

const TOKEN_RE = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:\\[\s\S]|[^`])*`|'(?:\\.|[^'\n])*'|"(?:\\.|[^"\n])*"|\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*)/g;

function buildHighlightedPre(source) {
  const pre = document.createElement('pre');
  pre.className = 'code-pre';

  const lines = source.split(/\r?\n/);
  lines.forEach((line, idx) => {
    const row = document.createElement('div');
    row.className = 'code-line';

    const ln = document.createElement('span');
    ln.className = 'tok-ln';
    ln.textContent = String(idx + 1).padStart(3, ' ');
    row.appendChild(ln);

    const content = document.createElement('span');
    content.className = 'tok-code';

    if (!line) {
      content.textContent = ' ';
    } else {
      let lastIndex = 0;
      TOKEN_RE.lastIndex = 0;
      let match;
      while ((match = TOKEN_RE.exec(line)) !== null) {
        if (match.index > lastIndex) {
          content.appendChild(document.createTextNode(line.slice(lastIndex, match.index)));
        }
        const tok = match[0];
        let cls = '';
        if (tok.startsWith('//') || tok.startsWith('/*')) {
          cls = 'tok-cmt';
        } else if (tok.startsWith("'") || tok.startsWith('"') || tok.startsWith('`')) {
          cls = 'tok-str';
        } else if (/^(0x|\d)/.test(tok)) {
          cls = 'tok-num';
        } else if (KEYWORDS.has(tok)) {
          cls = 'tok-kw';
        } else if (line[TOKEN_RE.lastIndex] === '(') {
          cls = 'tok-fn';
        }

        if (cls) {
          const span = document.createElement('span');
          span.className = cls;
          span.textContent = tok;
          content.appendChild(span);
        } else {
          content.appendChild(document.createTextNode(tok));
        }
        lastIndex = TOKEN_RE.lastIndex;
      }
      if (lastIndex < line.length) {
        content.appendChild(document.createTextNode(line.slice(lastIndex)));
      }
    }

    row.appendChild(content);
    pre.appendChild(row);
  });

  return pre;
}

function curateDisplaySource() {
  const partA = cakeSceneCode.split(/\r?\n/).slice(0, 320).join('\n');
  const partB = musicEngineCode.split(/\r?\n/).slice(0, 120).join('\n');
  return [
    '// === src/scene/birthdayScene.js ===',
    partA,
    '',
    '// === src/audio/musicEngine.js ===',
    partB,
  ].join('\n');
}

export class CodeBackdropPanel {
  constructor(container) {
    this.container = container;
    this.running = false;
    this.visible = true;
    this.offsetPx = 0;
    this.loopHeight = 0;
    this.destroyed = false;

    this._build();
    this._measure();
    this._onResize = () => this._measure();
    window.addEventListener('resize', this._onResize);

    this.lastNow = performance.now();
    this._rafId = requestAnimationFrame((ts) => this._tick(ts));
  }

  _build() {
    this.container.textContent = '';

    const header = document.createElement('div');
    header.className = 'code-header';

    const dot = document.createElement('span');
    dot.className = 'code-live-dot';
    header.appendChild(dot);

    const title = document.createElement('span');
    title.className = 'code-title';
    title.textContent = 'birthdayScene.js · live';
    header.appendChild(title);

    this.viewport = document.createElement('div');
    this.viewport.className = 'code-scroll-viewport';

    this.track = document.createElement('div');
    this.track.className = 'code-track';

    const source = curateDisplaySource();
    this.primaryBlock = buildHighlightedPre(source);
    this.cloneBlock = this.primaryBlock.cloneNode(true);

    this.track.appendChild(this.primaryBlock);
    this.track.appendChild(this.cloneBlock);
    this.viewport.appendChild(this.track);

    this.container.appendChild(header);
    this.container.appendChild(this.viewport);
  }

  _measure() {
    this.loopHeight = this.primaryBlock ? this.primaryBlock.offsetHeight : 0;
  }

  setRunning(isRunning) {
    this.running = Boolean(isRunning);
  }

  setVisible(isVisible) {
    this.visible = Boolean(isVisible);
  }

  isVisible() {
    return this.visible;
  }

  _tick(now) {
    if (this.destroyed) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastNow) / 1000));
    this.lastNow = now;

    if (this.visible) {
      if (this.loopHeight <= 0) {
        this._measure();
      }
      if (this.loopHeight > 0) {
        const speedPx = this.running ? 36 : 12;
        this.offsetPx += speedPx * dt;
        if (this.offsetPx >= this.loopHeight) {
          this.offsetPx -= this.loopHeight;
        }
        this.track.style.transform = `translate3d(0, -${this.offsetPx.toFixed(1)}px, 0)`;
      }
    }

    this._rafId = requestAnimationFrame((ts) => this._tick(ts));
  }

  destroy() {
    this.destroyed = true;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    window.removeEventListener('resize', this._onResize);
    this.container.textContent = '';
  }
}
