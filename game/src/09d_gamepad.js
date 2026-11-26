// ============================ GAME CONTROLLERS (Gamepad API) ============================
// Xbox / PlayStation / generic controllers on PC and phones, no extra service.
// A controller simply presses the player's bound KEYBOARD codes (Keys.down / Keys.pressed),
// so menus, battles, Training, VS CPU, the MOBILE pad (merges P1 keys) and ONLINE lockstep
// (09b samples Keys) all work unchanged. Controller 1 = P1 keys, controller 2 = P2 keys.
// Battle layout is remappable (SETTINGS → CONTROLLER), menus always use A = OK, B = back.
// Hooks: Pad.poll() at the start of every tick (10_main), Pad.draw(ctx) after the scene.
const PAD_ACTS = ['light', 'medium', 'heavy', 'sp1', 'sp2', 'block', 'ult', 'grab'];
const PAD_ACT_LABELS = { ...ACTION_LABELS, ult: 'Ultimate (SP1+SP2)', grab: 'Grab (M+H)' };
const PAD_DEFAULT = { 0: 'sp1', 1: 'heavy', 2: 'light', 3: 'medium', 4: 'block', 5: 'sp2', 6: 'grab', 7: 'ult' };
const PAD_NAMES = {
  xbox: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'VIEW', 'MENU', 'L-STICK', 'R-STICK', 'D↑', 'D↓', 'D←', 'D→', 'HOME'],
  ps: ['CROSS ✕', 'CIRCLE ○', 'SQUARE □', 'TRIANGLE △', 'L1', 'R1', 'L2', 'R2', 'SHARE', 'OPTIONS', 'L3', 'R3', 'D↑', 'D↓', 'D←', 'D→', 'PS'],
};
Settings.padMap = { ...PAD_DEFAULT };
Settings.KEYS.push('padMap');
try { const s = JSON.parse(localStorage.getItem('soulbreakers_v1') || 'null'); if (s && s.padMap) { Settings.padMap = s.padMap; if (s.padMap[6] === 'block' && s.padMap[4] === 'block') Settings.padMap[6] = 'grab'; } } catch (e) { /* storage unavailable */ }

const Pad = {
  list: [], st: [], kb: new Set(), n: 0, lastUse: -1e9, toast: null, capture: null, ctx: '', nav: null,
  type(gp) { return /sony|playstation|dualshock|dualsense|054c/i.test((gp && gp.id) || '') ? 'ps' : 'xbox'; },
  name(i, gp) { const t = PAD_NAMES[this.type(gp || this.list[0])]; return t[i] || 'B' + i; },
  read() {
    let raw = [];
    try { raw = navigator.getGamepads ? [...navigator.getGamepads()] : []; } catch (e) { raw = []; }
    this.list = raw.filter(p => p && p.connected !== false);
    return this.list;
  },
  // raw state: pressed button indices + stick/d-pad direction
  state(gp) {
    const btn = new Set(), b = gp.buttons || [], a = gp.axes || [];
    for (let i = 0; i < b.length; i++) { const x = b[i]; if (x && (x.pressed || (typeof x === 'object' ? x.value : x) > 0.45)) btn.add(i); }
    const ax = a[0] || 0, ay = a[1] || 0;
    const dir = { l: btn.has(14) || ax < -0.45, r: btn.has(15) || ax > 0.45, u: btn.has(12) || ay < -0.55, d: btn.has(13) || ay > 0.55 };
    return { btn, dir };
  },
  context() {
    if (Keys.rebind) return 'none';
    if (this.capture) return 'capture';
    if (typeof NetLobbyScene !== 'undefined' && scene instanceof NetLobbyScene && scene.mode === 'join') return 'keypad';
    if (scene instanceof Battle && !scene.paused) return 'battle';
    return 'menu';
  },
  codes(p, s, ctx) {
    const out = new Set(), bd = Settings.binds[p], add = c => c && out.add(c);
    for (const k of ['l', 'r', 'u', 'd']) if (s.dir[k]) {
      add(bd[{ l: 'left', r: 'right', u: 'up', d: 'down' }[k]]);
      if (p === 1 && ctx === 'menu' && scene instanceof BindScene) add({ l: 'ArrowLeft', r: 'ArrowRight', u: 'ArrowUp', d: 'ArrowDown' }[k]);
    }
    const B_ = s.btn;
    if (ctx === 'battle') {
      for (const i of B_) {
        const a = Settings.padMap[i];
        if (a === 'ult') { add(bd.sp1); add(bd.sp2); } else if (a === 'grab') { add(bd.medium); add(bd.heavy); } else if (a) add(bd[a]);
      }
      if (B_.has(9)) add('Escape');
      if (B_.has(8)) add('Digit5');
    } else {
      if (B_.has(0)) { add(bd.light); if (p === 1) add('Enter'); }
      if (B_.has(1)) { add(bd.heavy); if (p === 1) add('Escape'); }
      if (B_.has(2)) add(bd.medium);
      if (B_.has(4)) add(bd.sp1);
      if (B_.has(5)) add(bd.sp2);
      if (B_.has(9)) add(scene instanceof Battle ? 'Escape' : p === 1 ? 'Enter' : bd.light);
    }
    return out;
  },
  poll() {
    this.n++;
    const pads = this.read(), ctx = this.context(), changed = ctx !== this.ctx;
    this.ctx = ctx; this.nav = null;
    const live = new Set();
    pads.slice(0, 2).forEach((gp, k) => {
      const s = this.state(gp), st = this.st[k] || (this.st[k] = { codes: new Set(), btn: new Set(), dir: {}, latch: new Set(), id: gp.id });
      if (st.id !== gp.id) { st.latch = new Set(s.btn); st.id = gp.id; }
      // buttons held across a context switch (e.g. A that confirmed the stage) are ignored until released
      if (changed) for (const i of s.btn) st.latch.add(i);
      for (const i of [...st.latch]) if (!s.btn.has(i)) st.latch.delete(i);
      const fresh = [...s.btn].filter(i => !st.btn.has(i));
      if (fresh.length) Sound.unlock();
      if (fresh.length || ['l', 'r', 'u', 'd'].some(d => s.dir[d] && !st.dir[d])) this.lastUse = this.n;
      if (ctx === 'capture' && k >= 0) { const f = fresh.find(i => i <= 7); if (f !== undefined) { const cb = this.capture; this.capture = null; st.latch.add(f); cb(f); } }
      if (ctx === 'keypad' && k === 0) this.nav = { dir: Object.fromEntries(['l', 'r', 'u', 'd'].map(d => [d, s.dir[d] && !st.dir[d]])), a: fresh.includes(0), b: fresh.includes(1) };
      st.btn = s.btn; st.dir = s.dir;
      const use = { btn: new Set([...s.btn].filter(i => !st.latch.has(i))), dir: s.dir };
      const want = ctx === 'battle' || ctx === 'menu' ? this.codes(k + 1, use, ctx) : new Set();
      for (const c of want) { if (!st.codes.has(c) && !Keys.down.has(c)) Keys.pressed.add(c); Keys.down.add(c); live.add(c); }
      st.codes = want;
    });
    // release codes the controllers no longer hold (unless the keyboard holds them)
    this.st.forEach((st, k) => { if (k >= pads.length) st.codes = new Set(); });
    for (const c of this.held || []) if (!live.has(c) && !this.kb.has(c)) Keys.down.delete(c);
    this.held = live;
    if (this.toast) { this.toast.t--; if (this.toast.t <= 0) this.toast = null; }
  },
  active() { return this.list.length > 0 && this.n - this.lastUse < 60 * 20; },
  draw(g) {
    const ts = this.toast; if (!ts) return;
    g.save(); g.globalAlpha = Math.min(1, ts.t / 20);
    const w = 420, x = W / 2 - w / 2, y = 20;
    if (Settings.pixel && typeof pxBox === 'function') pxBox(g, snap2(x), y, w, 44, 'rgba(14,8,30,0.92)', '#7ad8ff'); else { g.fillStyle = 'rgba(14,8,30,0.92)'; g.fillRect(x, y, w, 44); g.strokeStyle = '#7ad8ff'; g.strokeRect(x, y, w, 44); }
    g.font = `800 18px ${FONT_UI}`; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(ts.msg, W / 2, y + 23); g.restore();
  },
};
window.addEventListener('keydown', e => { Pad.kb.add(e.code); });
window.addEventListener('keyup', e => { Pad.kb.delete(e.code); });
window.addEventListener('blur', () => Pad.kb.clear());
window.addEventListener('gamepadconnected', e => { Sound.unlock(); const n = Pad.read().indexOf(e.gamepad) + 1; Pad.toast = { msg: `🎮 CONTROLLER ${n > 0 && n < 3 ? 'P' + n : ''} CONNECTED`, t: 180 }; Pad.lastUse = Pad.n; });
window.addEventListener('gamepaddisconnected', () => { Pad.toast = { msg: '🎮 CONTROLLER DISCONNECTED', t: 150 }; });

// MOBILE touch pad hides while a controller is being used
{ const td = TouchPad.draw; TouchPad.draw = function (g, bt) { if (Pad.active()) return; return td.call(this, g, bt); }; }

// ONLINE join keypad: d-pad moves a cursor, A presses the key, B deletes / leaves
{
  const up = NetLobbyScene.prototype.update, dr = NetLobbyScene.prototype.draw;
  NetLobbyScene.prototype.update = function () {
    const nv = Pad.nav, mode = this.mode;
    up.call(this);
    if (scene !== this || mode !== 'join' || this.mode !== 'join' || !nv) return;
    let k = this.padKey ?? 0;
    if (nv.dir.l) k = Math.floor(k / 3) * 3 + (k % 3 + 2) % 3;
    if (nv.dir.r) k = Math.floor(k / 3) * 3 + (k % 3 + 1) % 3;
    if (nv.dir.u) k = (k + 9) % 12;
    if (nv.dir.d) k = (k + 3) % 12;
    if (k !== (this.padKey ?? 0) || nv.dir.l || nv.dir.r || nv.dir.u || nv.dir.d) Sound.play('menuMove');
    this.padKey = k;
    if (nv.a) this.typeKey(NET_KEYS[k]);
    else if (nv.b) { if (this.code.length) this.typeKey('DEL'); else this.leave(); }
  };
  NetLobbyScene.prototype.draw = function (g) {
    dr.call(this, g);
    if (this.mode !== 'join' || !Pad.list.length || this.padKey == null) return;
    const r = this.keyRect(this.padKey);
    g.save(); g.strokeStyle = '#ffd84a'; g.lineWidth = 4; g.strokeRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8); g.restore();
  };
}

// SETTINGS → CONTROLLER  (button remapping + layout)
class PadScene {
  constructor() { this.t = 0; this.row = 0; this.waiting = false; this.msg = ''; }
  rows() { return PAD_ACTS.length + 2; }
  rect(r) { return r < PAD_ACTS.length ? { x: 480, y: 150 + r * 46, w: 380, h: 38 } : { x: 400, y: 150 + PAD_ACTS.length * 46 + 14 + (r - PAD_ACTS.length) * 48, w: 480, h: 40 }; }
  btnsOf(a) { return Object.keys(Settings.padMap).filter(i => Settings.padMap[i] === a).map(Number); }
  start() {
    const a = PAD_ACTS[this.row];
    this.waiting = true; this.msg = ''; Sound.play('menuOk');
    Pad.capture = i => {
      this.waiting = false;
      const m = Settings.padMap, old = this.btnsOf(a), prev = m[i];
      for (const b of old) delete m[b];
      m[i] = a;
      if (prev && prev !== a && !this.btnsOf(prev).length && old.length) { m[old[0]] = prev; this.msg = `Swapped: ${PAD_ACT_LABELS[prev]} → ${Pad.name(old[0])}`; }
      else this.msg = `${PAD_ACT_LABELS[a]} → ${Pad.name(i)}`;
      Settings.save(); Sound.play('menuOk');
    };
  }
  activate() {
    if (this.row === PAD_ACTS.length) { Settings.padMap = { ...PAD_DEFAULT }; Settings.save(); this.msg = 'Defaults restored.'; Sound.play('menuOk'); return; }
    if (this.row === PAD_ACTS.length + 1) { Sound.play('menuBack'); go(new SettingsScene()); return; }
    this.start();
  }
  update() {
    this.t++;
    if (this.waiting) {
      if (Keys.pressed.has('Escape') || Mouse.clicked) { Pad.capture = null; this.waiting = false; this.msg = 'Cancelled.'; Sound.play('menuBack'); }
      return;
    }
    const n = this.rows();
    if (UI.up() || pressedAny('ArrowUp')) { this.row = (this.row + n - 1) % n; Sound.play('menuMove'); }
    if (UI.down() || pressedAny('ArrowDown')) { this.row = (this.row + 1) % n; Sound.play('menuMove'); }
    for (let r = 0; r < n; r++) if (inRect(this.rect(r))) { if (Mouse.moved) this.row = r; if (Mouse.clicked) { this.row = r; this.activate(); return; } }
    if (UI.ok()) { this.activate(); return; }
    if (UI.back()) { Sound.play('menuBack'); go(new SettingsScene()); }
  }
  draw(g) {
    const t = this.t, pads = Pad.list;
    drawMenuBG(g, t, '#7ad8ff');
    drawTitleText(g, 'CONTROLLER', W / 2, 50, 46, '#ffd84a', '#ff2a3a');
    g.font = `700 16px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffb3c6'; g.fillText('コントローラー', W / 2, 88);
    g.font = `700 17px ${FONT_UI}`; g.fillStyle = pads.length ? '#9affb0' : '#ffb3c6';
    g.fillText(pads.length ? pads.slice(0, 2).map((p, i) => `P${i + 1}: ${p.id.replace(/\s*\(.*$/, '').slice(0, 34)}`).join('     ·     ') : 'No controller found. Connect one (USB or Bluetooth) and press any button.', W / 2, 120);
    PAD_ACTS.forEach((a, r) => {
      const rc = this.rect(r), sel = this.row === r;
      g.textAlign = 'right'; g.font = `700 18px ${FONT_UI}`; g.fillStyle = '#e8e0ff'; g.fillText(PAD_ACT_LABELS[a], rc.x - 20, rc.y + rc.h / 2);
      g.fillStyle = sel ? (this.waiting ? '#ff2a55' : 'rgba(255,60,90,0.55)') : 'rgba(14,8,30,0.85)'; g.fillRect(rc.x, rc.y, rc.w, rc.h);
      g.strokeStyle = sel ? '#fff' : 'rgba(255,255,255,0.2)'; g.lineWidth = sel ? 2 : 1; g.strokeRect(rc.x, rc.y, rc.w, rc.h);
      g.textAlign = 'center'; g.font = `900 18px ${FONT_UI}`; g.fillStyle = '#fff';
      g.fillText(sel && this.waiting ? 'PRESS A BUTTON…  (ESC cancels)' : (this.btnsOf(a).map(i => Pad.name(i)).join('  /  ') || '—'), rc.x + rc.w / 2, rc.y + rc.h / 2 + 1);
    });
    ['RESET TO DEFAULTS', 'BACK'].forEach((lab, i) => drawButton(g, this.rect(PAD_ACTS.length + i), lab, null, this.row === PAD_ACTS.length + i, t));
    const xb = Pad.type(pads[0]) === 'xbox';
    g.font = `600 15px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.textAlign = 'center';
    g.fillText(`Move: left stick or d-pad  ·  ${xb ? 'MENU' : 'OPTIONS'}: pause  ·  ${xb ? 'VIEW' : 'SHARE'}: reset positions (Training)  ·  Menus: ${xb ? 'A' : '✕'} OK, ${xb ? 'B' : '○'} back`, W / 2, 610);
    g.fillText('Controller 1 plays as P1, controller 2 as P2. Works in VS CPU, Versus, Training and Online, together with keyboard and touch.', W / 2, 634);
    if (this.msg) { g.font = `700 16px ${FONT_UI}`; g.fillStyle = '#ffd84a'; g.fillText(this.msg, W / 2, 662); }
    drawFooter(g, '↑/↓ select   ·   ENTER / A remap   ·   ESC / B back   ·   conflicting buttons are swapped automatically');
  }
}

// add CONTROLLER → to the Settings menu (no edit of SettingsScene itself)
{
  const up = SettingsScene.prototype.update;
  SettingsScene.prototype.update = function () {
    if (!this.padItem) {
      this.padItem = true;
      const i = this.items.findIndex(it => it.id === 'binds');
      this.items.splice(i < 0 ? this.items.length - 1 : i + 1, 0, { id: 'pad', label: 'CONTROLLER  →', type: 'action' });
      const m = this.menu, n = this.items.length; m.items = this.items;
      if (m.y + n * (m.h + m.gap) > 650) { m.gap = 5; m.h = Math.floor((650 - m.y) / n) - m.gap; }
      const mu = m.update;
      m.update = function () { const it = mu.call(this); if (it && it.id === 'pad') { Sound.play('menuOk'); go(new PadScene()); return null; } return it; };
    }
    return up.call(this);
  };
}

// How to Play → CONTROLS page: controller hint
{
  const dc = HowToScene.prototype.drawControls;
  HowToScene.prototype.drawControls = function (g) {
    dc.call(this, g);
    g.save(); g.font = `700 15px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = '#7ad8ff';
    const m = Settings.padMap, lab = { light: 'Light', medium: 'Med', heavy: 'Heavy', sp1: 'SP1', sp2: 'SP2', block: 'Block', ult: 'ULT', grab: 'Grab' };
    const parts = PAD_ACTS.map(a => { const b = Object.keys(m).filter(i => m[i] === a).map(i => Pad.name(+i)); return b.length ? `${b.join('/')} ${lab[a]}` : null; }).filter(Boolean);
    g.fillText(`🎮 CONTROLLER: stick/d-pad move · ${parts.join(' · ')} · remap: SETTINGS → CONTROLLER`, W / 2, 646);
    g.restore();
  };
}
