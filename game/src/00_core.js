'use strict';
/* =====================================================================
   SOUL BREAKERS — 魂砕き
   An original anime-style 2-player fighting game. Pure HTML5 Canvas,
   Web Audio, no external assets.
   Sections: CORE · AUDIO · FX · CHARACTER RENDERER · CHARACTERS ·
             STAGES · FIGHTER · BATTLE · HUD · SCENES · MAIN
   ===================================================================== */

// ============================== CORE ==================================
const W = 1280, H = 720;
const GROUND = 620;
const STAGE_W = 2000;
const STEP = 1000 / 60;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const FONT_JP = "'Hiragino Mincho ProN','Yu Mincho','YuMincho','MS Mincho','Noto Serif JP','Noto Serif CJK JP',serif";
const FONT_JPS = "'Hiragino Kaku Gothic ProN','Yu Gothic','YuGothic','Meiryo','Noto Sans JP','Noto Sans CJK JP',sans-serif";
const FONT_T = "PixelArcade,Impact,'Haettenschweiler','Arial Narrow Bold','Arial Black',sans-serif";
const FONT_UI = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const OUTLINE = '#120a16';

function overlap(a, b) { return a && b && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function mkCanvas(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); if (fn) fn(g, w, h); return c; }

// ---------------- Settings (persisted in localStorage) ----------------
const ACTIONS = ['left', 'right', 'up', 'down', 'light', 'medium', 'heavy', 'sp1', 'sp2', 'block'];
const ACTION_LABELS = { left: 'Move Left', right: 'Move Right', up: 'Jump', down: 'Crouch', light: 'Light Attack', medium: 'Medium Attack', heavy: 'Heavy Attack', sp1: 'Special 1', sp2: 'Special 2', block: 'Block' };
const DEFAULT_BINDS = {
  1: { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', light: 'KeyF', medium: 'KeyV', heavy: 'KeyG', sp1: 'KeyR', sp2: 'KeyT', block: 'KeyH' },
  2: { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', light: 'KeyK', medium: 'KeyJ', heavy: 'KeyL', sp1: 'KeyO', sp2: 'KeyP', block: 'KeyI' },
};
const Settings = {
  cpuLevel: 1, master: 0.8, music: 0.5, sfx: 0.85, muted: false, voice: true, shake: true, fx: 'HIGH', roundTime: 99, pixel: true, mobile: null, touchSize: 'M', touchAlpha: 'MID',
  binds: JSON.parse(JSON.stringify(DEFAULT_BINDS)),
  KEYS: ['cpuLevel', 'master', 'music', 'sfx', 'muted', 'voice', 'shake', 'fx', 'roundTime', 'pixel', 'mobile', 'touchSize', 'touchAlpha'],
  load() {
    try {
      const s = JSON.parse(localStorage.getItem('soulbreakers_v1') || 'null');
      if (!s) return;
      for (const k of this.KEYS) if (k in s) this[k] = s[k];
      if (s.binds) this.binds = { 1: { ...DEFAULT_BINDS[1], ...s.binds[1] }, 2: { ...DEFAULT_BINDS[2], ...s.binds[2] } };
    } catch (e) { /* storage unavailable */ }
  },
  save() {
    try {
      const o = { binds: this.binds };
      for (const k of this.KEYS) o[k] = this[k];
      localStorage.setItem('soulbreakers_v1', JSON.stringify(o));
    } catch (e) { /* ignore */ }
  },
};
Settings.load();

function keyLabel(code) {
  if (!code) return '—';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'NUM ' + code.slice(6);
  const map = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: 'SPACE', ShiftLeft: 'L-SHIFT', ShiftRight: 'R-SHIFT', ControlLeft: 'L-CTRL', ControlRight: 'R-CTRL', AltLeft: 'L-ALT', AltRight: 'R-ALT', Semicolon: ';', Comma: ',', Period: '.', Slash: '/', Quote: "'", BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=', Enter: 'ENTER', Backspace: 'BKSP', Tab: 'TAB', Backquote: '`', IntlBackslash: '<' };
  return map[code] || code;
}
const B = (p, a) => Settings.binds[p][a];

// ---------------- Keyboard ----------------
const Keys = { down: new Set(), pressed: new Set(), rebind: null };
function isGameKey(code) {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Tab', 'Backspace'].includes(code)) return true;
  for (const p of [1, 2]) for (const a of ACTIONS) if (Settings.binds[p][a] === code) return true;
  return false;
}
window.addEventListener('keydown', e => {
  Sound.unlock();
  if (Keys.rebind) { e.preventDefault(); const cb = Keys.rebind; Keys.rebind = null; cb(e.code); return; }
  if (isGameKey(e.code)) e.preventDefault();
  if (e.repeat) return;
  if (!Keys.down.has(e.code)) Keys.pressed.add(e.code);
  Keys.down.add(e.code);
}, { passive: false });
window.addEventListener('keyup', e => { Keys.down.delete(e.code); if (isGameKey(e.code)) e.preventDefault(); });
window.addEventListener('blur', () => Keys.down.clear());
const pressedAny = (...codes) => codes.some(c => Keys.pressed.has(c));
const UI = {
  up: () => pressedAny('ArrowUp', B(1, 'up')),
  down: () => pressedAny('ArrowDown', B(1, 'down')),
  left: () => pressedAny('ArrowLeft', B(1, 'left')),
  right: () => pressedAny('ArrowRight', B(1, 'right')),
  ok: () => pressedAny('Enter', 'Space', B(1, 'light'), B(2, 'light')),
  back: () => pressedAny('Escape', 'Backspace', B(1, 'heavy'), B(2, 'heavy')),
  p: (pid, a) => pressedAny(B(pid, a)),
  pOk: pid => pid === 1 ? pressedAny(B(1, 'light'), 'Enter', 'Space') : pressedAny(B(2, 'light')),
  pBack: pid => pid === 1 ? pressedAny(B(1, 'heavy'), 'Escape') : pressedAny(B(2, 'heavy')),
};

// ---------------- Mouse ----------------
const Mouse = { x: -1, y: -1, clicked: false, moved: false };
function mousePos(e) { const r = canvas.getBoundingClientRect(); Mouse.x = (e.clientX - r.left) * W / r.width; Mouse.y = (e.clientY - r.top) * H / r.height; }
canvas.addEventListener('mousemove', e => { mousePos(e); Mouse.moved = true; });
canvas.addEventListener('mousedown', e => { Sound.unlock(); mousePos(e); Mouse.clicked = true; });
const inRect = (r) => Mouse.x >= r.x && Mouse.x <= r.x + r.w && Mouse.y >= r.y && Mouse.y <= r.y + r.h;

// ---------------- Per-player command input ----------------
// Directions use numpad notation relative to facing: 4=back 6=forward 2=down 8=up, 5=neutral.
class PlayerInput {
  constructor(pid) { this.pid = pid; this.enabled = true; this.virtual = null; this.reset(); }
  reset() { this.f = 0; this.dir = 5; this.hist = [{ d: 5, f: 0 }]; this.buf = {}; this.held = {}; this.h = 0; this.u = this.d = false; this.uPrev = false; this.upPressed = false; this.blockPressF = -99; this.pressF = {}; this.pdir = {}; this.log = []; this.logDir = 5; }
  update(facing) {
    this.f++;
    const b = Settings.binds[this.pid] || {};
    const live = this.enabled && !this.virtual;
    const dn = c => live && Keys.down.has(c), pr = c => live && Keys.pressed.has(c);
    let l = dn(b.left), r = dn(b.right), u = dn(b.up), d = dn(b.down);
    if (this.virtual) ({ l, r, u, d } = this.virtual);
    if (u && d) u = false;          // SOCD: down wins
    if (l && r) l = r = false;      // SOCD: neutral
    this.h = (r ? 1 : 0) - (l ? 1 : 0);
    this.fwd = this.h * facing;
    const dir = 5 + this.fwd + (u ? 3 : d ? -3 : 0);
    this.upPressed = u && !this.uPrev; this.uPrev = u;
    if (this.upPressed) { this.buf.up = 10; this.pressF.up = this.f; } else if (this.buf.up > 0) this.buf.up--;
    this.u = u; this.d = d;
    if (dir !== this.dir) { this.dir = dir; this.hist.push({ d: dir, f: this.f }); if (this.hist.length > 24) this.hist.shift(); }
    const now = [], vb = this.virtual && this.virtual.btn;   // vb: CPU-driven buttons ({ held:{}, press:Set }), same path as keys
    const bHeld = a => vb ? this.enabled && !!vb.held[a] : dn(b[a]), bPr = a => vb ? this.enabled && vb.press.has(a) : pr(b[a]);
    for (const a of ['light', 'medium', 'heavy', 'sp1', 'sp2', 'block']) {
      this.held[a] = bHeld(a);
      if (bPr(a)) { this.buf[a] = 10; this.pressF[a] = this.f; this.pdir[a] = { fwd: this.fwd, d }; now.push(a); } else if (this.buf[a] > 0) this.buf[a]--;
    }
    if (dir !== this.logDir || now.length) { this.log.push({ d: dir, b: now, f: this.f }); if (this.log.length > 30) this.log.shift(); this.logDir = dir; }
    if (bPr('block')) this.blockPressF = this.f;
  }
  p(a) { return this.buf[a] > 0; }
  use(a) { this.buf[a] = 0; }
  // find an ordered subsequence of direction groups inside the time window
  seq(steps, win) {
    const ents = this.hist.filter(e => this.f - e.f <= win);
    let i = 0;
    for (const e of ents) { if (steps[i].includes(e.d)) { i++; if (i === steps.length) return true; } }
    return false;
  }
  motion(type, win = 20) {
    switch (type) {
      case 'qcf': return this.seq([[1, 2], [3, 6]], win);
      case 'qcb': return this.seq([[2, 3], [1, 4]], win);
      case 'dd': return this.seq([[1, 2, 3], [4, 5, 6, 7, 8, 9], [1, 2, 3]], win + 4);
      case 'ff': return this.seq([[6], [5, 4, 1, 2, 7, 8], [6]], win);
      case 'bb': return this.seq([[4], [5, 6, 3, 2, 9, 8], [4]], win);
    }
    return false;
  }
  clearMotion() { this.hist = [{ d: this.dir, f: this.f }]; }
}
