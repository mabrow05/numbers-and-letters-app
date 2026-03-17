// ============================================================
//  State
// ============================================================
const state = {
  screen: 'home',   // 'home' | 'config' | 'game' | 'celebration'
  mode: null,       // 'letters' | 'numbers'

  // Persisted config so returning to config screen keeps choices
  cfg: {
    letterCase:      'both',  // 'upper' | 'lower' | 'both'
    fontStyle:       'stick', // 'stick' | 'dnealian'
    requiredSuccess: 2,
    rangeMin:        0,
    rangeMax:        10,
  },

  deck:       [],   // [{ id, upper?, lower?, value?, successes }]
  totalCards: 0,
  mastered:   0,
};

// ============================================================
//  Utils
// ============================================================
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function reinsert(card) {
  // Put the card back at a random spot between position 1 and 3 (or deck end)
  const pos = Math.min(1 + Math.floor(Math.random() * 3), state.deck.length);
  state.deck.splice(pos, 0, card);
}

function setScreen(name) {
  state.screen = name;
  render();
}

// ============================================================
//  Build deck
// ============================================================
function buildDeck() {
  if (state.mode === 'letters') {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    state.deck = letters.map(l => ({
      id: l,
      upper: l,
      lower: l.toLowerCase(),
      successes: 0,
    }));
  } else {
    state.deck = [];
    for (let i = state.cfg.rangeMin; i <= state.cfg.rangeMax; i++) {
      state.deck.push({ id: i, value: i, successes: 0 });
    }
  }
  shuffle(state.deck);
  state.totalCards = state.deck.length;
  state.mastered   = 0;
}

// ============================================================
//  Game actions
// ============================================================
function gotIt() {
  const card = state.deck[0];
  card.successes++;

  if (card.successes >= state.cfg.requiredSuccess) {
    state.deck.shift();
    state.mastered++;
    if (state.deck.length === 0) { setScreen('celebration'); return; }
  } else {
    state.deck.shift();
    reinsert(card);
  }
  renderGameScreen();
}

function tryAgain() {
  const card = state.deck.shift();
  reinsert(card);
  renderGameScreen();
}

// ============================================================
//  Render: Home
// ============================================================
function renderHome() {
  document.getElementById('app').innerHTML = `
    <div class="screen">
      <div class="title">Letters &amp;<br>Numbers</div>
      <div class="subtitle">Choose a game to get started!</div>

      <div style="display:flex;flex-direction:column;align-items:center;gap:14px;width:100%">
        <button class="btn btn-wide btn-letters" data-action="choose" data-mode="letters">
          🔤 Letters
        </button>
        <button class="btn btn-wide btn-numbers" data-action="choose" data-mode="numbers">
          🔢 Numbers
        </button>
      </div>
    </div>
  `;
}

// ============================================================
//  Render: Config
// ============================================================
function renderConfig() {
  document.getElementById('app').innerHTML = state.mode === 'letters'
    ? renderLettersConfig()
    : renderNumbersConfig();
}

function renderLettersConfig() {
  const { letterCase, fontStyle, requiredSuccess } = state.cfg;
  const caseOptions = [
    { v: 'upper', label: 'ABC' },
    { v: 'lower', label: 'abc' },
    { v: 'both',  label: 'Aa Bb' },
  ];
  const fontOptions = [
    { v: 'stick',    label: 'Stick',     style: "font-family:'Andika'" },
    { v: 'dnealian', label: "D'Nealian", style: "font-family:'Patrick Hand'" },
  ];

  return `
    <div class="screen">
      <div class="title" style="font-size:1.8rem">🔤 Letter Settings</div>

      <div class="config-panel">
        <div class="section-label">Show letters as</div>
        <div class="toggle-group">
          ${caseOptions.map(o => `
            <button class="toggle-pill ${letterCase === o.v ? 'active' : ''}"
                    data-action="set-cfg" data-key="letterCase" data-value="${o.v}">
              ${o.label}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="config-panel">
        <div class="section-label">Letter style</div>
        <div class="toggle-group">
          ${fontOptions.map(o => `
            <button class="toggle-pill teal ${fontStyle === o.v ? 'active' : ''}"
                    data-action="set-cfg" data-key="fontStyle" data-value="${o.v}"
                    style="${o.style}">
              ${o.label}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="config-panel">
        <div class="section-label">Times correct before moving on</div>
        ${renderStepper(requiredSuccess, 'requiredSuccess', 1, 5)}
      </div>

      <button class="btn btn-wide btn-go" data-action="start">🚀 Let's Go!</button>
      <button class="btn btn-ghost" data-action="home">← Back</button>
    </div>
  `;
}

function renderNumbersConfig() {
  const { rangeMin, rangeMax, requiredSuccess } = state.cfg;
  return `
    <div class="screen">
      <div class="title" style="font-size:1.8rem">🔢 Number Settings</div>

      <div class="config-panel">
        <div class="section-label">Number range</div>
        <div class="range-row">
          <div class="range-col">
            <div class="section-label" style="margin-bottom:0">From</div>
            ${renderStepper(rangeMin, 'rangeMin', 0, rangeMax - 1)}
          </div>
          <div class="range-sep">—</div>
          <div class="range-col">
            <div class="section-label" style="margin-bottom:0">To</div>
            ${renderStepper(rangeMax, 'rangeMax', rangeMin + 1, 100)}
          </div>
        </div>
      </div>

      <div class="config-panel">
        <div class="section-label">Times correct before moving on</div>
        ${renderStepper(requiredSuccess, 'requiredSuccess', 1, 5)}
      </div>

      <button class="btn btn-wide btn-go" data-action="start">🚀 Let's Go!</button>
      <button class="btn btn-ghost" data-action="home">← Back</button>
    </div>
  `;
}

function renderStepper(value, key, min, max) {
  return `
    <div class="stepper">
      <button class="stepper-btn" data-action="step" data-key="${key}" data-delta="-1" data-min="${min}" data-max="${max}">−</button>
      <div class="stepper-value">${value}</div>
      <button class="stepper-btn" data-action="step" data-key="${key}" data-delta="1" data-min="${min}" data-max="${max}">+</button>
    </div>
  `;
}

// ============================================================
//  Render: Game (partial re-render keeps animation fresh)
// ============================================================
function renderGame() {
  document.getElementById('app').innerHTML = `
    <div class="screen" id="game-screen">
      <div class="game-meta">
        <span class="game-stat" id="stat-mastered">0 mastered</span>
        <span class="game-stat" id="stat-left">0 left</span>
      </div>

      <div class="progress-track">
        <div class="progress-fill" id="progress-fill" style="width:0%"></div>
      </div>

      <div id="card-area"></div>

      <div class="game-actions">
        <button class="btn btn-wide btn-success" data-action="got-it">✓ Got it!</button>
        <button class="btn btn-wide btn-retry"   data-action="try-again">↺ Try Again</button>
      </div>

      <div class="kbd-hint">Space = Got it &nbsp;·&nbsp; Esc = Try Again</div>

      <button class="btn btn-ghost" data-action="home">✕ Quit</button>
    </div>
  `;
  fillGameCard();
}

function renderGameScreen() {
  // If we're already on the game screen, just update the card area
  const gameScreen = document.getElementById('game-screen');
  if (!gameScreen) {
    renderGame();
  } else {
    fillGameCard();
    updateGameMeta();
  }
}

// Build an inline SVG that scales the glyph(s) to fill the card.
// viewBox is always 400×300 (4:3, matching the card aspect-ratio).
function buildGlyphSVG(card) {
  const { fontStyle, letterCase, requiredSuccess } = state.cfg;
  const hasStars  = requiredSuccess > 1;
  const font      = fontStyle === 'stick' ? 'Andika, sans-serif' : "'Patrick Hand', cursive";

  // Shared SVG text attributes
  const attrs = `text-anchor="middle" dominant-baseline="central"
    text-rendering="optimizeLegibility" fill="#2D3561"`;

  let textNodes;

  if (state.mode === 'numbers') {
    const y = hasStars ? 138 : 162;
    const size = hasStars ? 205 : 235;
    textNodes = `
      <text x="200" y="${y}" ${attrs}
        font-family="'Nunito', sans-serif" font-weight="900" font-size="${size}">
        ${card.value}
      </text>`;
  } else if (letterCase === 'both') {
    // Upper + lower stacked
    const [uy, lowy, uSize, lSize] = hasStars
      ? [82,  200, 105, 95]
      : [90,  218, 120, 110];
    textNodes = `
      <text x="200" y="${uy}"   ${attrs} font-family="${font}" font-size="${uSize}">${card.upper}</text>
      <text x="200" y="${lowy}" ${attrs} font-family="${font}" font-size="${lSize}">${card.lower}</text>`;
  } else {
    const display = letterCase === 'upper' ? card.upper : card.lower;
    const y       = hasStars ? 137 : 162;
    const size    = hasStars ? 205 : 235;
    textNodes = `
      <text x="200" y="${y}" ${attrs} font-family="${font}" font-size="${size}">${display}</text>`;
  }

  return `
    <svg class="card-svg" viewBox="0 0 400 300"
         xmlns="http://www.w3.org/2000/svg"
         aria-hidden="true">
      ${textNodes}
    </svg>`;
}

function fillGameCard() {
  const card = state.deck[0];
  const { requiredSuccess } = state.cfg;

  // Stars only when requiredSuccess > 1
  let starsHTML = '';
  if (requiredSuccess > 1) {
    const stars = Array.from({ length: requiredSuccess }, (_, i) =>
      `<span class="card-star ${i < card.successes ? '' : 'empty'}">⭐</span>`
    ).join('');
    starsHTML = `<div class="card-stars">${stars}</div>`;
  }

  const area = document.getElementById('card-area');
  if (area) {
    area.innerHTML = `
      <div class="flashcard">
        ${buildGlyphSVG(card)}
        ${starsHTML}
      </div>
    `;
  }

  updateGameMeta();
}

function updateGameMeta() {
  const fill    = document.getElementById('progress-fill');
  const statM   = document.getElementById('stat-mastered');
  const statL   = document.getElementById('stat-left');
  if (!fill) return;

  const pct = state.totalCards ? (state.mastered / state.totalCards) * 100 : 0;
  fill.style.width     = `${pct}%`;
  statM.textContent    = `${state.mastered} mastered`;
  statL.textContent    = `${state.deck.length} left`;
}

// ============================================================
//  Render: Celebration
// ============================================================
function renderCelebration() {
  document.getElementById('app').innerHTML = `
    <div class="screen celebration">
      <span class="celebration-emoji">🎉</span>
      <div class="celebration-title">You did it!</div>
      <div class="celebration-sub">Amazing job learning your ${state.mode}!</div>

      <div style="display:flex;flex-direction:column;align-items:center;gap:14px;width:100%;margin-top:12px">
        <button class="btn btn-wide btn-again" data-action="play-again">🔄 Play Again</button>
        <button class="btn btn-ghost" data-action="home">🏠 Home</button>
      </div>
    </div>
  `;
  startConfetti();
}

// ============================================================
//  Master render
// ============================================================
function render() {
  stopConfetti();
  switch (state.screen) {
    case 'home':        renderHome();        break;
    case 'config':      renderConfig();      break;
    case 'game':        renderGame();        break;
    case 'celebration': renderCelebration(); break;
  }
}

// ============================================================
//  Event delegation
// ============================================================
document.getElementById('app').addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;

  const action = el.dataset.action;

  switch (action) {
    case 'choose':
      state.mode = el.dataset.mode;
      setScreen('config');
      break;

    case 'set-cfg':
      state.cfg[el.dataset.key] = el.dataset.value;
      renderConfig();
      break;

    case 'step': {
      const key   = el.dataset.key;
      const delta = parseInt(el.dataset.delta, 10);
      const min   = parseInt(el.dataset.min, 10);
      const max   = parseInt(el.dataset.max, 10);
      state.cfg[key] = Math.max(min, Math.min(max, state.cfg[key] + delta));
      renderConfig();
      break;
    }

    case 'start':
      buildDeck();
      setScreen('game');
      break;

    case 'got-it':
      gotIt();
      break;

    case 'try-again':
      tryAgain();
      break;

    case 'play-again':
      buildDeck();
      setScreen('game');
      break;

    case 'home':
      setScreen('home');
      break;
  }
});

// Keyboard shortcuts (game screen only)
document.addEventListener('keydown', (e) => {
  if (state.screen !== 'game') return;
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    gotIt();
  } else if (e.code === 'Escape' || e.code === 'Backspace') {
    e.preventDefault();
    tryAgain();
  }
});

// ============================================================
//  Confetti
// ============================================================
const CONFETTI_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#6BCB77',
  '#A29BFE', '#FF9A3C', '#FF6B9D', '#74B9FF',
];

let confettiRAF  = null;
let confettiList = [];

function startConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  confettiList = Array.from({ length: 140 }, () => ({
    x:        Math.random() * canvas.width,
    y:        Math.random() * canvas.height - canvas.height,
    size:     6 + Math.random() * 8,
    color:    CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    vx:       (Math.random() - 0.5) * 2.5,
    vy:       2.5 + Math.random() * 3.5,
    rot:      Math.random() * Math.PI * 2,
    vr:       (Math.random() - 0.5) * 0.15,
    isRect:   Math.random() > 0.4,
  }));

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of confettiList) {
      p.x   += p.vx;
      p.y   += p.vy;
      p.rot += p.vr;

      if (p.y > canvas.height + 10) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;

      if (p.isRect) {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    confettiRAF = requestAnimationFrame(frame);
  }

  frame();
}

function stopConfetti() {
  if (confettiRAF) {
    cancelAnimationFrame(confettiRAF);
    confettiRAF = null;
  }
  confettiList = [];
  const canvas = document.getElementById('confetti-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// ============================================================
//  Boot
// ============================================================
render();
