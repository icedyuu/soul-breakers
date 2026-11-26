// ============================ MOBILE TOUCH CONTROLS ============================
// Title screen MOBILE toggle (Settings.mobile). In singleplayer battles (VS CPU, Practice,
// Training) P1 is driven through PlayerInput.virtual — the same path the CPU bot uses —
// so motions, buffers, cancels and follow-ups behave exactly like keyboard play.
// Keyboard input for P1 is merged in, so a keyboard still works with MOBILE on.
// 2P Versus never uses the pad.
// Dash: DASH button (stick back held = back dash) or flick the stick twice (→ → / ← ←).
// Specials: SP1 / SP2 can be SWIPED. Tap = SP1 / SP2, swipe forward = ↓→SP, swipe back = ↓←SP1,
// swipe down = ↓↓SP2. While the finger rests on SP1/SP2 a small wheel shows the move names.
// Holding the stick in a direction and tapping SP fires that version at once (old shortcut).
// ULT button = SP1+SP2, GRAB = M+H. Button size + opacity: Settings (TOUCH BUTTON SIZE / OPACITY).
// Real stick motions keep working.
if (Settings.mobile == null) Settings.mobile = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
canvas.style.touchAction = 'none';
canvas.style.webkitUserSelect = canvas.style.userSelect = 'none';
canvas.style.webkitTouchCallout = 'none';
canvas.style.webkitTapHighlightColor = 'transparent';

const TOUCH_BTNS_BASE = [
  { a: 'light', label: 'L', x: 895, y: 618, r: 48, col: '#7ad8ff' },
  { a: 'medium', label: 'M', x: 1005, y: 596, r: 48, col: '#ffd84a' },
  { a: 'heavy', label: 'H', x: 1115, y: 566, r: 48, col: '#ff5a5a' },
  { a: 'sp1', label: 'SP1', sub: '⇠ swipe ⇢', x: 945, y: 494, r: 47, col: '#c08aff', swipe: 1 },
  { a: 'sp2', label: 'SP2', sub: 'swipe ⇢ ⇣', x: 1059, y: 470, r: 47, col: '#ff7ad8', swipe: 1 },
  { a: 'block', label: 'BLOCK', x: 1214, y: 452, r: 42, col: '#9affb0' },
  { a: 'ult', label: 'ULT', x: 1186, y: 348, r: 40, col: '#ff8a1a' },
  { a: 'grab', label: 'GRAB', sub: 'M+H', x: 1226, y: 586, r: 35, col: '#ffb070' },
  { a: 'dash', label: 'DASH', sub: '« hold ◀', x: 820, y: 508, r: 39, col: '#6affea' },
];
const TOUCH_SIZES = { S: 0.85, M: 1, L: 1.14, XL: 1.28 }, TOUCH_ALPHA = { LOW: 0.55, MID: 1, HIGH: 1.5 };
let TOUCH_BTNS = TOUCH_BTNS_BASE;
const TOUCH_PAUSE = { x: W / 2 - 34, y: 96, w: 68, h: 40 };
const TOUCH_RESET = { x: W - 150, y: 140, w: 120, h: 40 };
const STICK_BASE = { x: 175, y: 545, R: 96, dead: 20 };
let STICK = { ...STICK_BASE };
function touchLayout() {
  const s = TOUCH_SIZES[Settings.touchSize] || 1;
  if (touchLayout.s === s) return; touchLayout.s = s;
  TOUCH_BTNS = TOUCH_BTNS_BASE.map(b => ({ ...b, x: W - (W - b.x) * s, y: H - 10 - (H - 10 - b.y) * s, r: b.r * s }));
  STICK = { x: STICK_BASE.x * Math.max(1, s * 0.95), y: H - (H - STICK_BASE.y) * s, R: STICK_BASE.R * s, dead: STICK_BASE.dead * s };
}
const SWIPE_MIN = 26;

const TouchPad = {
  v: { l: false, r: false, u: false, d: false, btn: { held: {}, press: new Set() } },
  bt: null, touches: new Map(), pend: new Set(), q: [], req: [], stick: null, flash: {},
  attach(bt) {
    this.bt = null; this.touches.clear(); this.pend.clear(); this.q = []; this.req = []; this.stick = null; touchLayout();
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
  // screen direction of the stick: 'R' | 'L' | 'D' | null (diagonal down counts as R/L)
  stickScr() { const s = this.stickDir(); return s.r ? 'R' : s.l ? 'L' : s.d ? 'D' : null; },
  down(id, p) {
    const bt = this.bt; touchLayout();
    if (this.inR(p, TOUCH_PAUSE)) { Keys.pressed.add('Escape'); this.touches.set(id, { kind: 'none' }); return; }
    if (bt.practice && this.inR(p, TOUCH_RESET)) { Keys.pressed.add('Digit5'); this.touches.set(id, { kind: 'none' }); return; }
    if (bt.phase !== 'fight') Keys.pressed.add('Enter');   // tap skips intro / round end
    const b = p.x > 560 ? this.hit(p) : null;
    if (b && b.swipe) {      // SP1 / SP2: stick held → fire now, else wait for swipe / release
      const sd = this.stickScr();
      if (sd) { this.req.push({ a: b.a, s: sd }); this.touches.set(id, { kind: 'aim', b, ox: p.x, oy: p.y, fired: true }); this.flash[b.a] = 8; return; }
      this.touches.set(id, { kind: 'aim', b, ox: p.x, oy: p.y, x: p.x, y: p.y, fired: false }); return;
    }
    if (b && b.a === 'dash') { this.req.push({ a: 'dash', s: this.stickScr() }); this.flash.dash = 8; this.touches.set(id, { kind: 'none' }); return; }
    if (b) { this.touches.set(id, { kind: 'btn', b }); this.press(b); return; }
    if (p.x < W * 0.55 && !this.stick) { this.stick = { id, ox: clamp(p.x, 80, 460), oy: clamp(p.y, 300, 640), x: p.x, y: p.y }; this.touches.set(id, { kind: 'stick' }); return; }
    this.touches.set(id, { kind: 'btn', b: null });
  },
  move(id, p) {
    const t = this.touches.get(id); if (!t) return;
    if (t.kind === 'stick') { this.stick.x = p.x; this.stick.y = p.y; return; }
    if (t.kind === 'aim') {
      t.x = p.x; t.y = p.y; if (t.fired) return;
      const dx = p.x - t.ox, dy = p.y - t.oy;
      if (Math.hypot(dx, dy) < SWIPE_MIN) return;
      const s = dy > Math.abs(dx) * 0.8 ? 'D' : Math.abs(dx) >= Math.abs(dy) * 0.6 ? (dx > 0 ? 'R' : 'L') : null;
      this.req.push({ a: t.b.a, s }); t.fired = true; this.flash[t.b.a] = 8; return;
    }
    if (t.kind === 'btn') { const b = p.x > 560 ? this.hit(p) : null; if (b && (b.swipe || b.a === 'dash')) return; if (b !== t.b) { t.b = b; if (b) this.press(b); } }   // slide between buttons
  },
  up(id) {
    const t = this.touches.get(id); if (!t) return;
    if (t.kind === 'stick') this.stick = null;
    if (t.kind === 'aim' && !t.fired) { this.req.push({ a: t.b.a, s: null }); this.flash[t.b.a] = 8; }   // plain tap
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
  // turn a touch request (button + screen direction) into a short motion for the input buffer
  motionFor(r, fac) {
    const rel = r.s === 'R' ? fac : r.s === 'L' ? -fac : 0;
    if (r.a === 'dash') return rel < 0 ? [{ d: 'b' }, { d: 'n' }, { d: 'b' }, { d: 'b' }] : [{ d: 'f' }, { d: 'n' }, { d: 'f' }, { d: 'f' }];
    if (rel > 0) return [{ d: 'd' }, { d: 'df' }, { d: 'f', p: [r.a] }];
    if (rel < 0 && r.a === 'sp1') return [{ d: 'd' }, { d: 'db' }, { d: 'b', p: ['sp1'] }];
    if (r.s === 'D' && r.a === 'sp2') return [{ d: 'd' }, { d: 'n' }, { d: 'd', p: ['sp2'] }];
    return [{ d: 'n', p: [r.a] }];
  },
  // one sim step: write the virtual input for P1 (called by Battle.stepSim before inputs update)
  tick(bt) {
    const v = this.v, kb = Settings.binds[1], K = Keys.down, KP = Keys.pressed;
    v.btn.press.clear();
    for (const k in this.flash) if (this.flash[k] > 0) this.flash[k]--;
    if (!this.live()) { this.pend.clear(); this.q = []; this.req = []; }
    const st = this.live() ? this.stickDir() : { l: false, r: false, u: false, d: false };
    let dir = { l: st.l || K.has(kb.left), r: st.r || K.has(kb.right), u: st.u || K.has(kb.up), d: st.d || K.has(kb.down) };
    const pend = this.pend, fac = bt.p1.facing;
    for (const a of ['light', 'medium', 'heavy', 'sp1', 'sp2', 'block']) if (KP.has(kb[a])) pend.add(a);
    if (!this.q.length && this.req.length) this.q = this.motionFor(this.req.shift(), fac);
    if (this.q.length) {
      const fr = this.q.shift(), f = fr.d.includes('f'), b = fr.d.includes('b');
      dir = { l: (f && fac < 0) || (b && fac > 0), r: (f && fac > 0) || (b && fac < 0), u: false, d: fr.d[0] === 'd' };
      if (fr.d === 'n' && fr.p) dir = { l: false, r: false, u: false, d: false };
      for (const a of fr.p || []) pend.add(a);
    }
    Object.assign(v, dir);
    const held = new Set();
    for (const t of this.touches.values()) {
      if (t.kind === 'aim' && t.fired) held.add(t.b.a);
      if (t.kind === 'btn' && t.b) { if (t.b.a === 'ult') { held.add('sp1'); held.add('sp2'); } else if (t.b.a === 'grab') { held.add('medium'); held.add('heavy'); } else held.add(t.b.a); }
    }
    for (const a of ['light', 'medium', 'heavy', 'sp1', 'sp2', 'block']) {
      v.btn.held[a] = held.has(a) || K.has(kb[a]) || pend.has(a);
      if (pend.has(a)) v.btn.press.add(a);
    }
    pend.clear();
  },
  draw(g, bt) {
    if (!this.live()) return;
    touchLayout();
    const AM = TOUCH_ALPHA[Settings.touchAlpha] || 1, A = a => Math.min(1, a * AM), sz = TOUCH_SIZES[Settings.touchSize] || 1;
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    // stick
    const s = this.stick, ox = s ? s.ox : STICK.x, oy = s ? s.oy : STICK.y;
    g.globalAlpha = A(s ? 0.5 : 0.28);
    g.fillStyle = 'rgba(20,10,40,0.6)'; g.strokeStyle = '#ffffff'; g.lineWidth = 3;
    g.beginPath(); g.arc(ox, oy, STICK.R, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#ffffff'; g.font = `800 ${Math.round(20 * sz)}px ${FONT_UI}`;
    for (const [dx, dy, t] of [[0, -1, '▲'], [0, 1, '▼'], [-1, 0, '◀'], [1, 0, '▶']]) g.fillText(t, ox + dx * (STICK.R - 22 * sz), oy + dy * (STICK.R - 22 * sz));
    let kx = ox, ky = oy;
    if (s) { const dx = s.x - ox, dy = s.y - oy, l = Math.hypot(dx, dy), k = l > STICK.R ? STICK.R / l : 1; kx = ox + dx * k; ky = oy + dy * k; }
    g.globalAlpha = A(s ? 0.75 : 0.4); g.fillStyle = '#e8dcff';
    g.beginPath(); g.arc(kx, ky, 40 * sz, 0, TAU); g.fill();
    if (!s) { g.globalAlpha = A(0.35); g.font = `700 ${Math.round(13 * sz)}px ${FONT_UI}`; g.fillText('2× flick = dash', ox, oy + STICK.R + 16 * sz); }
    // buttons
    const P1 = bt.p1, held = this.v.btn.held;
    const aimOn = a => [...this.touches.values()].some(t => t.kind === 'aim' && t.b.a === a);
    for (const b of TOUCH_BTNS) {
      const on = b.a === 'ult' ? held.sp1 && held.sp2 : b.a === 'grab' ? held.medium && held.heavy : b.a === 'dash' ? false : held[b.a] || aimOn(b.a), fl = this.flash[b.a] > 0;
      const ready = b.a !== 'ult' || P1.meter >= 100;
      g.globalAlpha = A(on || fl ? 0.85 : ready ? 0.45 : 0.22);
      g.fillStyle = on || fl ? b.col : 'rgba(20,10,40,0.75)'; g.strokeStyle = b.col; g.lineWidth = 4;
      g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill(); g.stroke();
      if (b.a === 'ult' && ready) { g.globalAlpha = A(0.35 + 0.25 * Math.sin(bt.pf * 0.2)); g.lineWidth = 6; g.beginPath(); g.arc(b.x, b.y, b.r + 7, 0, TAU); g.stroke(); }
      g.globalAlpha = A(on || fl ? 1 : ready ? 0.9 : 0.45);
      g.fillStyle = on || fl ? '#120820' : '#ffffff';
      g.font = `900 ${Math.round((b.label.length > 3 ? 17 : b.label.length > 1 ? 22 : 34) * sz)}px ${FONT_UI}`;
      g.fillText(b.label, b.x, b.y - (b.sub ? 7 * sz : 0));
      if (b.sub) { g.font = `800 ${Math.round(12 * sz)}px ${FONT_UI}`; g.fillText(b.sub, b.x, b.y + 17 * sz); }
    }
    // special wheel: while a finger rests on SP1 / SP2, show what each swipe does
    for (const t of this.touches.values()) if (t.kind === 'aim' && !t.fired) this.drawWheel(g, t.b, P1, A, sz);
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
  drawWheel(g, b, P1, A, sz) {
    const mv = P1.ch.moves || {}, fac = P1.facing, nm = k => mv[k] && mv[k].name;
    const opts = b.a === 'sp1'
      ? [['sp1', 0, -1, '●'], ['sp1f', fac, 0, fac > 0 ? '▶' : '◀'], ['counter', -fac, 0, fac > 0 ? '◀' : '▶']]
      : [['sp2', 0, -1, '●'], ['sp2f', fac, 0, fac > 0 ? '▶' : '◀'], ['sp2d', 0, 1, '▼']];
    const D = 108 * sz;
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.globalAlpha = A(0.5); g.strokeStyle = b.col; g.lineWidth = 2; g.setLineDash([6, 6]);
    g.beginPath(); g.arc(b.x, b.y, D * 0.62, 0, TAU); g.stroke(); g.setLineDash([]);
    for (const [k, dx, dy, ar] of opts) {
      const n = nm(k); if (!n) continue;
      const cd = P1.cd && P1.cd[k] > 0, txt = `${ar} ${n}`;
      g.font = `800 ${Math.round(15 * sz)}px ${FONT_UI}`;
      const w = g.measureText(txt).width + 18 * sz, h = 28 * sz;
      let x = b.x + dx * D, y = b.y + dy * (dy < 0 ? D * 0.95 : D * 0.85);
      if (dx) x += dx * w * 0.32;
      x = clamp(x, w / 2 + 4, W - w / 2 - 4);
      g.globalAlpha = A(0.92); g.fillStyle = 'rgba(18,8,36,0.92)'; g.strokeStyle = b.col; g.lineWidth = 2;
      g.beginPath(); g.roundRect ? g.roundRect(x - w / 2, y - h / 2, w, h, 9) : g.rect(x - w / 2, y - h / 2, w, h); g.fill(); g.stroke();
      g.globalAlpha = cd ? 0.45 : 1; g.fillStyle = cd ? '#9aa' : '#fff'; g.fillText(txt, x, y + 1);
    }
    g.restore();
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
