// ============================ MOBILE TOUCH CONTROLS ============================
// Title screen MOBILE toggle (Settings.mobile). In singleplayer battles (VS CPU, Practice,
// Training) P1 is driven through PlayerInput.virtual — the same path the CPU bot uses —
// so motions, buffers, cancels and follow-ups behave exactly like keyboard play.
// Keyboard input for P1 is merged in, so a keyboard still works with MOBILE on.
// 2P Versus never uses the pad.
// Shortcuts: SP1 + stick forward = ↓→SP1, SP1 + back = ↓←SP1, SP2 + forward = ↓→SP2,
// SP2 + down = ↓↓SP2, ULT button = SP1+SP2. Real stick motions work too.
if (Settings.mobile == null) Settings.mobile = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
canvas.style.touchAction = 'none';
canvas.style.webkitUserSelect = canvas.style.userSelect = 'none';
canvas.style.webkitTouchCallout = 'none';
canvas.style.webkitTapHighlightColor = 'transparent';

const TOUCH_BTNS = [
  { a: 'light', label: 'L', x: 900, y: 612, r: 48, col: '#7ad8ff' },
  { a: 'medium', label: 'M', x: 1012, y: 590, r: 48, col: '#ffd84a' },
  { a: 'heavy', label: 'H', x: 1124, y: 562, r: 48, col: '#ff5a5a' },
  { a: 'sp1', label: 'SP1', sub: '+→  +←', x: 950, y: 496, r: 44, col: '#c08aff' },
  { a: 'sp2', label: 'SP2', sub: '+→  +↓', x: 1062, y: 470, r: 44, col: '#ff7ad8' },
  { a: 'block', label: 'BLOCK', x: 1214, y: 452, r: 42, col: '#9affb0' },
  { a: 'ult', label: 'ULT', x: 1186, y: 350, r: 38, col: '#ff8a1a' },
  { a: 'grab', label: 'GRAB', sub: 'M+H', x: 1226, y: 572, r: 36, col: '#ffb070' },
];
const TOUCH_PAUSE = { x: W / 2 - 34, y: 96, w: 68, h: 40 };
const TOUCH_RESET = { x: W - 150, y: 140, w: 120, h: 40 };
const STICK = { x: 175, y: 545, R: 96, dead: 20 };

const TouchPad = {
  v: { l: false, r: false, u: false, d: false, btn: { held: {}, press: new Set() } },
  bt: null, touches: new Map(), pend: new Set(), q: [], stick: null, flash: {},
  attach(bt) {
    this.bt = null; this.touches.clear(); this.pend.clear(); this.q = []; this.stick = null;
    if (!Settings.mobile || !(bt.cpu || bt.practice)) return false;
    this.bt = bt; bt.inputs[0].virtual = this.v;
    return true;
  },
  live() { return !!(this.bt && scene === this.bt && !this.bt.paused && this.bt.phase !== 'matchEnd'); },
  pos(t) { const r = canvas.getBoundingClientRect(); return { x: (t.clientX - r.left) * W / r.width, y: (t.clientY - r.top) * H / r.height }; },
  hit(p) {
    let best = null, bd = 1e9;
    for (const b of TOUCH_BTNS) { const d = Math.hypot(p.x - b.x, p.y - b.y); if (d < b.r * 1.3 && d < bd) { bd = d; best = b; } }
    return best;
  },
  inR: (p, r) => p.x >= r.x - 10 && p.x <= r.x + r.w + 10 && p.y >= r.y - 10 && p.y <= r.y + r.h + 10,
  down(id, p) {
    const bt = this.bt;
    if (this.inR(p, TOUCH_PAUSE)) { Keys.pressed.add('Escape'); this.touches.set(id, { kind: 'none' }); return; }
    if (bt.practice && this.inR(p, TOUCH_RESET)) { Keys.pressed.add('Digit5'); this.touches.set(id, { kind: 'none' }); return; }
    if (bt.phase !== 'fight') Keys.pressed.add('Enter');   // tap skips intro / round end
    const b = p.x > 560 ? this.hit(p) : null;
    if (b) { this.touches.set(id, { kind: 'btn', b }); this.press(b); return; }
    if (p.x < W * 0.55 && !this.stick) { this.stick = { id, ox: clamp(p.x, 80, 460), oy: clamp(p.y, 300, 640), x: p.x, y: p.y }; this.touches.set(id, { kind: 'stick' }); return; }
    this.touches.set(id, { kind: 'btn', b: null });
  },
  move(id, p) {
    const t = this.touches.get(id); if (!t) return;
    if (t.kind === 'stick') { this.stick.x = p.x; this.stick.y = p.y; return; }
    if (t.kind === 'btn') { const b = p.x > 560 ? this.hit(p) : null; if (b !== t.b) { t.b = b; if (b) this.press(b); } }   // slide between buttons
  },
  up(id) {
    const t = this.touches.get(id); if (!t) return;
    if (t.kind === 'stick') this.stick = null;
    this.touches.delete(id);
  },
  press(b) { if (b.a === 'ult') { this.pend.add('sp1'); this.pend.add('sp2'); this.pend.add('ult'); } else if (b.a === 'grab') { this.pend.add('medium'); this.pend.add('heavy'); } else this.pend.add(b.a); this.flash[b.a] = 8; },
  stickDir() {
    const s = this.stick; if (!s) return { l: false, r: false, u: false, d: false };
    const dx = s.x - s.ox, dy = s.y - s.oy, len = Math.hypot(dx, dy);
    if (len < STICK.dead) return { l: false, r: false, u: false, d: false };
    const nx = dx / len, ny = dy / len;
    return { l: nx < -0.38, r: nx > 0.38, u: ny < -0.5, d: ny > 0.5 };
  },
  // one sim step: write the virtual input for P1 (called by Battle.stepSim before inputs update)
  tick(bt) {
    const v = this.v, kb = Settings.binds[1], K = Keys.down, KP = Keys.pressed;
    v.btn.press.clear();
    for (const k in this.flash) if (this.flash[k] > 0) this.flash[k]--;
    if (!this.live()) { this.pend.clear(); this.q = []; }
    const st = this.live() ? this.stickDir() : { l: false, r: false, u: false, d: false };
    let dir = { l: st.l || K.has(kb.left), r: st.r || K.has(kb.right), u: st.u || K.has(kb.up), d: st.d || K.has(kb.down) };
    const pend = this.pend, fac = bt.p1.facing;
    for (const a of ['light', 'medium', 'heavy', 'sp1', 'sp2', 'block']) if (KP.has(kb[a])) pend.add(a);
    // directional-special shortcuts (touch SP buttons only, keyboard keeps real motions)
    if (!this.q.length && !pend.has('ult') && st && (pend.has('sp1') !== pend.has('sp2'))) {
      const rel = (st.r ? 1 : st.l ? -1 : 0) * fac, sp = pend.has('sp1') ? 'sp1' : 'sp2';
      const touchSp = [...this.touches.values()].some(t => t.kind === 'btn' && t.b && t.b.a === sp) || this.flash[sp] > 0;
      let m = null;
      if (touchSp && sp === 'sp1' && rel > 0) m = [{ d: 'd' }, { d: 'df' }, { d: 'f', p: ['sp1'] }];
      else if (touchSp && sp === 'sp1' && rel < 0) m = [{ d: 'd' }, { d: 'db' }, { d: 'b', p: ['sp1'] }];
      else if (touchSp && sp === 'sp2' && rel > 0) m = [{ d: 'd' }, { d: 'df' }, { d: 'f', p: ['sp2'] }];
      else if (touchSp && sp === 'sp2' && st.d && !rel) m = [{ d: 'd' }, { d: 'n' }, { d: 'd', p: ['sp2'] }];
      if (m) { this.q = m; pend.delete(sp); }
    }
    if (this.q.length) {
      const fr = this.q.shift(), f = fr.d.includes('f'), b = fr.d.includes('b');
      dir = { l: (f && fac < 0) || (b && fac > 0), r: (f && fac > 0) || (b && fac < 0), u: false, d: fr.d[0] === 'd' };
      for (const a of fr.p || []) pend.add(a);
    }
    Object.assign(v, dir);
    const held = new Set();
    for (const t of this.touches.values()) if (t.kind === 'btn' && t.b) { if (t.b.a === 'ult') { held.add('sp1'); held.add('sp2'); } else if (t.b.a === 'grab') { held.add('medium'); held.add('heavy'); } else held.add(t.b.a); }
    for (const a of ['light', 'medium', 'heavy', 'sp1', 'sp2', 'block']) {
      v.btn.held[a] = held.has(a) || K.has(kb[a]) || pend.has(a);
      if (pend.has(a)) v.btn.press.add(a);
    }
    pend.clear();
  },
  draw(g, bt) {
    if (!this.live()) return;
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    // stick
    const s = this.stick, ox = s ? s.ox : STICK.x, oy = s ? s.oy : STICK.y;
    g.globalAlpha = s ? 0.5 : 0.28;
    g.fillStyle = 'rgba(20,10,40,0.6)'; g.strokeStyle = '#ffffff'; g.lineWidth = 3;
    g.beginPath(); g.arc(ox, oy, STICK.R, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#ffffff'; g.font = `800 20px ${FONT_UI}`;
    for (const [dx, dy, t] of [[0, -1, '▲'], [0, 1, '▼'], [-1, 0, '◀'], [1, 0, '▶']]) g.fillText(t, ox + dx * (STICK.R - 22), oy + dy * (STICK.R - 22));
    let kx = ox, ky = oy;
    if (s) { const dx = s.x - ox, dy = s.y - oy, l = Math.hypot(dx, dy), k = l > STICK.R ? STICK.R / l : 1; kx = ox + dx * k; ky = oy + dy * k; }
    g.globalAlpha = s ? 0.75 : 0.4; g.fillStyle = '#e8dcff';
    g.beginPath(); g.arc(kx, ky, 40, 0, TAU); g.fill();
    // buttons
    const P1 = bt.p1, held = this.v.btn.held;
    for (const b of TOUCH_BTNS) {
      const on = b.a === 'ult' ? held.sp1 && held.sp2 : b.a === 'grab' ? held.medium && held.heavy : held[b.a], fl = this.flash[b.a] > 0;
      const ready = b.a !== 'ult' || P1.meter >= 100;
      g.globalAlpha = on || fl ? 0.85 : ready ? 0.45 : 0.22;
      g.fillStyle = on || fl ? b.col : 'rgba(20,10,40,0.75)'; g.strokeStyle = b.col; g.lineWidth = 4;
      g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill(); g.stroke();
      if (b.a === 'ult' && ready) { g.globalAlpha = 0.35 + 0.25 * Math.sin(bt.pf * 0.2); g.lineWidth = 6; g.beginPath(); g.arc(b.x, b.y, b.r + 7, 0, TAU); g.stroke(); }
      g.globalAlpha = on || fl ? 1 : ready ? 0.9 : 0.45;
      g.fillStyle = on || fl ? '#120820' : '#ffffff';
      g.font = `900 ${b.label.length > 3 ? 17 : b.label.length > 1 ? 22 : 34}px ${FONT_UI}`;
      g.fillText(b.label, b.x, b.y - (b.sub ? 7 : 0));
      if (b.sub) { g.font = `800 14px ${FONT_UI}`; g.fillText(b.sub, b.x, b.y + 17); }
    }
    // pause / reset
    const pill = (r, t) => { g.globalAlpha = 0.6; g.fillStyle = 'rgba(20,10,40,0.85)'; g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.roundRect ? g.roundRect(r.x, r.y, r.w, r.h, 10) : g.rect(r.x, r.y, r.w, r.h); g.fill(); g.stroke(); g.globalAlpha = 0.95; g.fillStyle = '#fff'; g.font = `900 18px ${FONT_UI}`; g.fillText(t, r.x + r.w / 2, r.y + r.h / 2 + 1); };
    pill(TOUCH_PAUSE, 'II');
    if (bt.practice) pill(TOUCH_RESET, 'RESET');
    g.restore();
    // portrait phone: ask to rotate
    if (window.innerHeight > window.innerWidth * 1.05) {
      g.save(); g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, H / 2 - 50, W, 100);
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffd84a'; g.font = `900 40px ${FONT_UI}`;
      g.fillText('⟳  TURN YOUR PHONE SIDEWAYS (LANDSCAPE)', W / 2, H / 2 + 2); g.restore();
    }
  },
};
function touchEv(e, fn) {
  Sound.unlock();
  if (!TouchPad.live()) return;          // menus: let the browser turn taps into mouse clicks
  e.preventDefault();
  for (const t of e.changedTouches) fn(t.identifier, TouchPad.pos(t));
}
canvas.addEventListener('touchstart', e => touchEv(e, (id, p) => TouchPad.down(id, p)), { passive: false });
canvas.addEventListener('touchmove', e => touchEv(e, (id, p) => TouchPad.move(id, p)), { passive: false });
canvas.addEventListener('touchend', e => touchEv(e, id => TouchPad.up(id)), { passive: false });
canvas.addEventListener('touchcancel', e => touchEv(e, id => TouchPad.up(id)), { passive: false });
document.addEventListener('touchmove', e => { if (e.target === canvas || TouchPad.live()) e.preventDefault(); }, { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());   // iOS pinch zoom
document.addEventListener('dblclick', e => e.preventDefault());

// title-screen toggle button
const MOBILE_BTN = { x: W - 262, y: 22, w: 240, h: 46 };
function mobileToggleUpdate() {
  if (Mouse.clicked && inRect(MOBILE_BTN)) { Settings.mobile = !Settings.mobile; Settings.save(); Sound.play('menuOk'); Mouse.clicked = false; return true; }
  return false;
}
function mobileToggleDraw(g, t) {
  const on = Settings.mobile;
  drawButton(g, MOBILE_BTN, on ? 'MOBILE: ON' : 'MOBILE: OFF', '', on, t);
  g.save(); g.font = `700 13px ${FONT_UI}`; g.textAlign = 'right'; g.fillStyle = '#e8dcff'; g.globalAlpha = 0.8;
  g.fillText(on ? 'touch controls in VS CPU / Practice / Training' : 'tap for touch controls (1 player)', MOBILE_BTN.x + MOBILE_BTN.w, MOBILE_BTN.y + MOBILE_BTN.h + 16); g.restore();
}
