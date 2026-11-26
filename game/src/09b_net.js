// ============================ ONLINE 1V1 (WebRTC) ============================
// Two devices (phones, tablets, PCs) play a Versus match over the internet.
//  · Signaling: free PeerJS cloud server (0.peerjs.com, no accounts). The data itself
//    flows peer-to-peer over a WebRTC data channel (PeerJS' free TURN relay as fallback).
//  · Netcode: delay-based lockstep. Both peers run the same deterministic simulation;
//    only inputs (one small int per frame) are exchanged, applied `delay` frames later.
//    Math.random is a shared seeded PRNG inside the sim, sim-relevant Settings are fixed.
//  · Every 60 frames both sides compare a state hash; on mismatch the host sends its
//    fighter/battle state and both continue from it (soft resync).
// Host = P1 (left), guest = P2 (right). Each player uses their own P1 keys (arrows +
// P2 keys work too) or the MOBILE touch pad.
// Hooks into the rest of the game: only TitleScene (menu item) — everything else here.
const NET_PROTO = 1;
const NET_PREFIX = 'soulbrk-v1-';
const NET_HASH_EVERY = 60;
const NET_TIMEOUT = 7000;

// ---------------- deterministic RNG for the simulation ----------------
const NetRng = {
  s: 1, orig: Math.random,
  seed(n) { this.s = (n >>> 0) || 1; },
  next() { let t = (this.s = (this.s + 0x6D2B79F5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; },
};
const netRandom = () => NetRng.next();
// audio must never consume the sim RNG (muted / locked audio would desync the peers)
// (FX.update only uses randomness for screen shake, which draw code can also trigger; stage
// updates are pure ambience — e.g. neon rain starts at per-device random positions)
for (const [o, k] of [[Sound, 'play'], [Sound, 'speak'], [Sound, 'announce'], [Music, 'play'], [FX, 'update'], ...STAGES.filter(st => st.update).map(st => [st, 'update'])]) {
  const fn = o[k];
  o[k] = function (...a) { const r = Math.random; Math.random = NetRng.orig; try { return fn.apply(this, a); } finally { Math.random = r; } };
}
// run fn with deterministic globals (seeded RNG, empty key presses, fixed sim settings)
function netEnter(cfg) {
  const mr = Math.random, kp = Keys.pressed, rt = Settings.roundTime, fx = Settings.fx, sh = Settings.shake;
  Math.random = netRandom; Keys.pressed = new Set(); Settings.roundTime = cfg.roundTime; Settings.fx = 'HIGH'; Settings.shake = true;
  return () => { Math.random = mr; Keys.pressed = kp; Settings.roundTime = rt; Settings.fx = fx; Settings.shake = sh; };
}
function netHashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function netBuildId() { return netHashStr(NET_PROTO + ':' + CHARS.map(c => c.id + c.health).join(',') + ':' + STAGES.length); }

// ---------------- input encoding (one int per frame) ----------------
const NET_BTNS = ['light', 'medium', 'heavy', 'sp1', 'sp2', 'block'];
const NET_OK = 1 << 16;
function netDecode(v, o) {
  o.l = !!(v & 1); o.r = !!(v & 2); o.u = !!(v & 4); o.d = !!(v & 8);
  o.btn.press.clear();
  NET_BTNS.forEach((a, i) => { o.btn.held[a] = !!(v & (1 << (4 + i))); if (v & (1 << (10 + i))) o.btn.press.add(a); });
}
function netEncode(l, r, u, d, held, press, ok) {
  let v = (l ? 1 : 0) | (r ? 2 : 0) | (u ? 4 : 0) | (d ? 8 : 0);
  NET_BTNS.forEach((a, i) => { if (held(a)) v |= 1 << (4 + i); if (press(a)) v |= 1 << (10 + i); });
  return ok ? v | NET_OK : v;
}

// ---------------- connection ----------------
const Net = {
  peer: null, conn: null, role: null, code: '', status: 'idle', err: '', rtt: 0, lastRx: 0, lastPing: 0,
  match: 0, rin: new Map(), rinMax: -1, rhash: new Map(), remoteSel: null, desyncs: 0,
  available() { return typeof window.Peer === 'function'; },
  opts() {
    const q = new URLSearchParams(location.search), o = { debug: 0 };
    if (q.get('peerhost')) { o.host = q.get('peerhost'); o.port = +q.get('peerport') || 9000; o.secure = q.get('peersecure') === '1'; o.path = q.get('peerpath') || '/'; }
    return o;
  },
  reset() { this.match = 0; this.rin = new Map(); this.rinMax = -1; this.rhash = new Map(); this.remoteSel = null; this.rtt = 0; this.desyncs = 0; },
  host() {
    this.close(); this.reset(); this.role = 'host'; this.status = 'opening'; this.err = '';
    if (!this.available()) return this.fail('Online play is not available in this browser.');
    this.code = String(100000 + Math.floor(Math.random() * 900000));
    const p = this.peer = new Peer(NET_PREFIX + this.code, this.opts());
    p.on('open', () => { if (this.peer === p && this.status === 'opening') this.status = 'waiting'; });
    p.on('connection', c => {
      if (this.peer !== p) return;
      if (this.conn) { c.on('open', () => { try { c.send({ t: 'full' }); } catch (e) { } setTimeout(() => c.close(), 400); }); return; }
      this.bind(c);
    });
    p.on('disconnected', () => { if (this.peer === p && !this.conn) try { p.reconnect(); } catch (e) { } });
    p.on('error', e => {
      if (this.peer !== p) return;
      if (e.type === 'unavailable-id') return this.host();
      if (this.conn && this.conn.open) return;   // signaling hiccup after the P2P link is up: ignore
      this.fail(netErrText(e));
    });
  },
  join(code) {
    this.close(); this.reset(); this.role = 'guest'; this.code = code; this.status = 'connecting'; this.err = '';
    if (!this.available()) return this.fail('Online play is not available in this browser.');
    const p = this.peer = new Peer(this.opts());
    p.on('open', () => { if (this.peer === p) this.bind(p.connect(NET_PREFIX + code, { reliable: true, serialization: 'json' })); });
    p.on('error', e => { if (this.peer !== p) return; if (this.conn && this.conn.open) return; this.fail(e.type === 'peer-unavailable' ? `Room ${code} not found. Check the code.` : netErrText(e)); });
    this.joinT = setTimeout(() => { if (this.peer === p && this.status === 'connecting') this.fail('Could not connect. Check the code and your internet, then try again.'); }, 20000);
  },
  bind(c) {
    this.conn = c; this.lastRx = performance.now();
    c.on('open', () => { if (this.conn === c) this.send({ t: 'hello', v: NET_PROTO, b: netBuildId() }); });
    c.on('data', d => { if (this.conn === c) this.rx(d); });
    c.on('close', () => { if (this.conn === c) this.lost('Your opponent left.'); });
    c.on('error', () => { if (this.conn === c) this.lost('Connection lost.'); });
  },
  rx(d) {
    if (!d || typeof d !== 'object') return;
    this.lastRx = performance.now();
    switch (d.t) {
      case 'hello':
        if (d.v !== NET_PROTO || d.b !== netBuildId()) { this.send({ t: 'bad' }); return this.fail('Both players need the same game version. Reload the game on both devices.'); }
        if (this.status !== 'connected') { this.status = 'connected'; clearTimeout(this.joinT); }
        return;
      case 'bad': return this.fail('Both players need the same game version. Reload the game on both devices.');
      case 'full': return this.fail('That room is already full.');
      case 'ping': return this.send({ t: 'pong', ts: d.ts });
      case 'pong': { const r = performance.now() - d.ts; this.rtt = this.rtt ? this.rtt * 0.7 + r * 0.3 : r; return; }
      case 'i': if (d.m === this.match) { d.v.forEach((v, k) => this.rin.set(d.f + k, v)); this.rinMax = Math.max(this.rinMax, d.f + d.v.length - 1); } return;
      case 'h': if (d.m === this.match) { this.rhash.set(d.f, d.h); if (scene && scene.netCheck) scene.netCheck(d.f); } return;
      case 'sel': this.remoteSel = d; break;
      case 'bye': return this.lost('Your opponent left.');
    }
    if (scene && scene.onNet) scene.onNet(d);
  },
  send(o) { try { if (this.conn && this.conn.open) this.conn.send(o); } catch (e) { } },
  tick() {
    const now = performance.now();
    if (this.status !== 'connected') return;
    if (now - this.lastPing > 1000) { this.lastPing = now; this.send({ t: 'ping', ts: now }); }
    if (now - this.lastRx > NET_TIMEOUT) this.lost('Connection lost (no answer from your opponent).');
  },
  delayFrames() { const r = this.rtt || 120; return clamp(Math.round(r / 2 / STEP) + 2, 2, 9); },
  fail(msg) {
    const was = this.status; this.err = msg; this.status = 'error'; this.teardown();
    if (was === 'connected' && !(scene instanceof NetLobbyScene)) { this.status = 'idle'; go(new NetLobbyScene({ error: msg })); }
  },
  lost(msg) {
    if (this.status !== 'connected') return;
    this.err = msg; this.status = 'lost'; this.teardown();
    if (!(scene instanceof NetLobbyScene)) go(new NetLobbyScene({ error: msg }));
  },
  teardown() {
    const c = this.conn, p = this.peer; this.conn = null; this.peer = null; clearTimeout(this.joinT);
    try { if (c) c.close(); } catch (e) { }
    try { if (p) p.destroy(); } catch (e) { }
  },
  close() {
    if (this.conn) this.send({ t: 'bye' });
    const c = this.conn, p = this.peer; this.conn = null; this.peer = null; this.status = 'idle'; clearTimeout(this.joinT);
    setTimeout(() => { try { if (c) c.close(); } catch (e) { } try { if (p) p.destroy(); } catch (e) { } }, 300);
  },
};
function netErrText(e) {
  const t = e && e.type;
  if (t === 'browser-incompatible') return 'This browser does not support online play.';
  if (t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'socket-closed') return "Can't reach the online server. Check your internet (online play needs the web version: icedyuu.github.io/soul-breakers).";
  return 'Online error: ' + (t || (e && e.message) || 'unknown');
}
function netStatusChip(g) {
  const ms = Math.round(Net.rtt);
  g.save(); g.font = `800 14px ${FONT_UI}`; g.textAlign = 'left'; g.textBaseline = 'middle';
  const txt = `ONLINE · ROOM ${Net.code}${ms ? ' · ' + ms + ' ms' : ''}`, w = g.measureText(txt).width + 24;
  g.fillStyle = 'rgba(10,6,24,0.8)'; g.fillRect(12, 10, w, 26); g.strokeStyle = '#7affc0'; g.lineWidth = 1.5; g.strokeRect(12, 10, w, 26);
  g.fillStyle = '#7affc0'; g.fillText(txt, 24, 24); g.restore();
}

// ---------------- lobby: create / join a room ----------------
const NET_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'DEL', '0', 'OK'];
class NetLobbyScene {
  constructor(o = {}) {
    this.t = 0; this.mode = o.join != null ? 'join' : 'menu'; this.code = o.join || ''; this.error = o.error || '';
    Music.play('menu');
    this.menu = new MenuList([{ id: 'host', label: 'CREATE ROOM', jp: '部屋を作る' }, { id: 'join', label: 'JOIN ROOM', jp: '参加' }, { id: 'back', label: 'BACK', jp: '戻る' }], W / 2, 330, { w: 420, h: 54 });
    if (o.join && o.join.length === 6) this.doJoin();
  }
  keyRect(i) { const c = i % 3, r = Math.floor(i / 3); return { x: W / 2 - 180 + c * 124, y: 300 + r * 88, w: 112, h: 76 }; }
  backRect() { return { x: 30, y: H - 90, w: 180, h: 50 }; }
  shareRect() { return { x: W / 2 - 160, y: 470, w: 320, h: 52 }; }
  doJoin() { this.error = ''; Net.join(this.code); this.mode = 'connecting'; Sound.play('menuOk'); }
  leave() { Net.close(); Sound.play('menuBack'); this.mode = 'menu'; this.error = ''; }
  update() {
    this.t++; Net.tick();
    if (Net.status === 'connected') { Sound.play('impactBig'); go(new NetSelectScene()); return; }
    if (Net.status === 'error' && (this.mode === 'connecting' || this.mode === 'hosting')) { this.error = Net.err; this.mode = this.mode === 'connecting' ? 'join' : 'menu'; Net.status = 'idle'; Sound.play('menuBack'); }
    const backHit = Mouse.clicked && inRect(this.backRect());
    if (this.mode === 'menu') {
      if (backHit || Keys.pressed.has('Escape') || UI.back()) { Net.close(); Sound.play('menuBack'); go(new TitleScene()); return; }
      const it = this.menu.update(); if (!it) return;
      if (it.id === 'back') { Net.close(); Sound.play('menuBack'); go(new TitleScene()); return; }
      Sound.play('menuOk'); this.error = '';
      if (it.id === 'host') { Net.host(); this.mode = 'hosting'; }
      if (it.id === 'join') { this.mode = 'join'; this.code = ''; }
      return;
    }
    if (backHit || Keys.pressed.has('Escape')) { this.leave(); return; }
    if (this.mode === 'hosting' && Net.status === 'waiting' && Mouse.clicked && inRect(this.shareRect())) this.share();
    if (this.mode === 'join') {
      for (let d = 0; d <= 9; d++) if (Keys.pressed.has('Digit' + d) || Keys.pressed.has('Numpad' + d)) this.typeKey(String(d));
      if (Keys.pressed.has('Backspace')) this.typeKey('DEL');
      if (Keys.pressed.has('Enter') || Keys.pressed.has('NumpadEnter')) this.typeKey('OK');
      if (Mouse.clicked) NET_KEYS.forEach((k, i) => { if (inRect(this.keyRect(i))) this.typeKey(k); });
    }
  }
  typeKey(k) {
    if (k === 'DEL') { this.code = this.code.slice(0, -1); Sound.play('menuMove'); return; }
    if (k === 'OK') { if (this.code.length === 6) this.doJoin(); else Sound.play('menuBack'); return; }
    if (this.code.length < 6) { this.code += k; Sound.play('menuMove'); this.error = ''; }
    if (this.code.length === 6 && k !== 'OK') this.doJoin();
  }
  share() {
    const url = location.origin + location.pathname + '?join=' + Net.code;
    const txt = `Fight me in SOUL BREAKERS! Room code: ${Net.code}`;
    try {
      if (navigator.share) navigator.share({ title: 'SOUL BREAKERS', text: txt, url }).catch(() => { });
      else if (navigator.clipboard) { navigator.clipboard.writeText(url); this.copied = 120; }
    } catch (e) { }
    Sound.play('menuOk');
  }
  draw(g) {
    const t = this.t;
    drawMenuBG(g, t, '#18c88a');
    drawTitleText(g, 'ONLINE BATTLE', W / 2, 110, 84, '#ffd84a', '#18a85a');
    g.font = `700 22px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#9affd0'; g.fillText('オンライン対戦 · 1 VS 1 · two devices', W / 2, 172);
    g.font = `600 18px ${FONT_UI}`; g.fillStyle = '#e8dcff';
    if (this.mode === 'menu') {
      g.fillText('One player creates a room, the other joins with the 6-digit code.', W / 2, 232);
      g.fillText('Works on phones, tablets and PCs · free · no account needed.', W / 2, 262);
      this.menu.draw(g, t);
    } else if (this.mode === 'hosting') {
      if (Net.status === 'waiting') {
        g.fillText('Tell your friend this room code:', W / 2, 238);
        this.drawCode(g, Net.code, 300, true);
        drawButton(g, this.shareRect(), navigator.share ? 'SHARE INVITE' : this.copied > 0 ? 'LINK COPIED!' : 'COPY INVITE LINK', null, inRect(this.shareRect()), t);
        g.font = `600 18px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = '#e8dcff';
        g.fillText('Waiting for your opponent' + '.'.repeat(1 + (t >> 4) % 3), W / 2, 570);
      } else g.fillText('Creating room' + '.'.repeat(1 + (t >> 4) % 3), W / 2, 330);
    } else if (this.mode === 'join') {
      g.fillText('Enter the room code:', W / 2, 212);
      this.drawCode(g, this.code, 236, false);
      NET_KEYS.forEach((k, i) => drawButton(g, this.keyRect(i), k, null, inRect(this.keyRect(i)), t));
    } else if (this.mode === 'connecting') {
      this.drawCode(g, this.code, 260, false);
      g.font = `600 20px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = '#e8dcff'; g.fillText('Connecting' + '.'.repeat(1 + (t >> 4) % 3), W / 2, 400);
    }
    if (this.copied > 0) this.copied--;
    if (this.error) {
      g.save(); g.font = `700 18px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const w = Math.min(W - 60, g.measureText(this.error).width + 40);
      g.fillStyle = 'rgba(80,0,20,0.9)'; g.fillRect(W / 2 - w / 2, 640, w, 40); g.strokeStyle = '#ff5a7a'; g.strokeRect(W / 2 - w / 2, 640, w, 40);
      g.fillStyle = '#ffd0d8'; g.fillText(this.error, W / 2, 661); g.restore();
    }
    if (this.mode !== 'menu') drawButton(g, this.backRect(), 'BACK', null, inRect(this.backRect()), t);
    if (!Net.available()) { g.font = `700 16px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = '#ff9ab0'; g.fillText('Online play is not available in this browser.', W / 2, 620); }
  }
  drawCode(g, code, y, big) {
    const n = 6, bw = big ? 92 : 70, bh = big ? 120 : 84, gap = 12, x0 = W / 2 - (n * bw + (n - 1) * gap) / 2;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (bw + gap);
      g.fillStyle = 'rgba(10,6,24,0.85)'; g.fillRect(x, y, bw, bh); g.strokeStyle = i === code.length && !big ? '#ffd84a' : 'rgba(150,255,210,0.6)'; g.lineWidth = 3; g.strokeRect(x, y, bw, bh);
      if (code[i]) { g.font = `900 ${big ? 84 : 58}px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle'; strokeText(g, code[i], x + bw / 2, y + bh / 2 + 4, '#ffffff', OUTLINE, 5); }
    }
  }
}

// ---------------- character select (own fighter on the left, rival on the right) ----------------
class NetSelectScene extends CharSelectScene {
  constructor() {
    super('versus', null); this.single = true; this.sent = ''; this.startT = 0;
    const rs = Net.remoteSel; if (rs) { this.cur[1] = rs.cur; this.ready[1] = rs.ready; } else this.cur[1] = 1 % CHARS.length;
  }
  onNet(d) {
    if (d.t === 'sel') { if (d.cur !== this.cur[1]) this.ropes[1] = {}; if (d.ready && !this.ready[1]) Sound.play('menuOk'); this.cur[1] = clamp(d.cur | 0, 0, CHARS.length - 1); this.ready[1] = !!d.ready; }
    if (d.t === 'start' && Net.role === 'guest') netStartMatch(d.cfg, d.m);
  }
  update() {
    Net.tick(); if (scene !== this) return;
    if (!this.ready[0]) {
      const r1 = this.ready[1], c1 = this.cur[1];
      this.ready[1] = false;
      super.update();
      this.ready[1] = r1; this.cur[1] = c1;
      if (scene !== this) { if (scene instanceof TitleScene) { Net.close(); go(new NetLobbyScene()); } return; }
    } else {
      this.t++;
      if ((UI.back() || Keys.pressed.has('Escape')) && !(this.ready[1] && this.startT > 0)) { this.ready[0] = false; Sound.play('menuBack'); }
    }
    const key = this.cur[0] + ':' + this.ready[0];
    if (key !== this.sent) { this.sent = key; Net.send({ t: 'sel', cur: this.cur[0], ready: this.ready[0] }); }
    if (this.ready[0] && this.ready[1]) this.startT++; else this.startT = 0;
    if (Net.role === 'host' && this.startT === 45) {
      const cfg = { mode: 'versus', p1: this.cur[0], p2: this.cur[1], stage: Math.floor(Math.random() * STAGES.length), seed: Math.floor(Math.random() * 4294967295) + 1, delay: Net.delayFrames(), roundTime: Settings.roundTime, online: true };
      const m = Net.match + 1;
      Net.send({ t: 'start', cfg, m });
      netStartMatch(cfg, m);
    }
  }
  draw(g) {
    this.single = false;
    try { super.draw(g); } finally { this.single = true; }
    // relabel the sides and replace the local-keyboard footer
    for (const [s, txt] of [[0, 'YOU'], [1, 'RIVAL']]) {
      const x = s ? W - 34 : 34; g.fillStyle = '#0a0618'; g.fillRect(s ? x - 110 : x - 4, 126, 114, 20);
      g.font = `900 15px ${FONT_UI}`; g.textBaseline = 'alphabetic'; g.textAlign = s ? 'right' : 'left'; g.fillStyle = s ? P_COL[2] : P_COL[1]; g.fillText(txt, x, 140);
    }
    if (!this.ready[1]) { g.save(); g.font = `italic 900 22px ${FONT_T}`; g.textAlign = 'right'; g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillText('CHOOSING…', W - 34, 290); g.restore(); }
    g.fillStyle = '#05030a'; g.fillRect(0, H - 34, W, 34);
    drawFooter(g, this.ready[0] ? (this.ready[1] ? 'Both ready — get set!' : 'Waiting for your rival…  ·  G / ESC: change fighter') : 'Choose YOUR fighter  ·  tap a card or A/D/W/S + F  ·  V: random  ·  ESC: leave room');
    netStatusChip(g);
  }
}
function netStartMatch(cfg, m) {
  Net.match = m; Net.rin = new Map(); Net.rinMax = -1; Net.rhash = new Map(); Net.remoteSel = null; Net.desyncs = 0;
  go(new NetVSScene(cfg));
}
class NetVSScene extends VSScene {
  update() {
    Net.tick(); if (scene !== this) return;
    this.t++;
    if (this.t === 26) { Sound.play('impactBig'); Sound.play('slam'); }
    if (this.t >= 150) go(new NetBattle(this.cfg));
  }
  draw(g) { super.draw(g); const me = Net.role === 'host' ? 0 : 1; g.save(); g.font = `italic 900 34px ${FONT_T}`; g.textAlign = me ? 'right' : 'left'; strokeText(g, 'YOU', me ? W - 50 : 50, me ? 240 : 530, '#7affc0', OUTLINE, 6); g.restore(); }
}

// ---------------- the online battle ----------------
function netPlain(v, d = 3) {
  const t = typeof v;
  if (v === null || t === 'boolean' || t === 'string') return true;
  if (t === 'number') return true;
  if (d <= 0 || t !== 'object') return false;
  if (Array.isArray(v)) return v.length < 64 && v.every(x => netPlain(x, d - 1));
  if (Object.getPrototypeOf(v) !== Object.prototype) return false;
  return Object.keys(v).every(k => netPlain(v[k], d - 1));
}
const netNum = v => typeof v === 'number' && !isFinite(v) ? { $n: String(v) } : v;
function netEnc(v) { return JSON.parse(JSON.stringify(v, (k, x) => netNum(x))); }
function netDec(v) {
  if (v && typeof v === 'object') { if ('$n' in v && Object.keys(v).length === 1) return Number(v.$n); for (const k of Object.keys(v)) v[k] = netDec(v[k]); }
  return v;
}
const NET_SKIP_F = new Set(['ch', 'input', 'opp', 'move', 'sk', 'ropes', 'after', 'stats', 'baseCh']);
const NET_BT_KEYS = ['timer', 'pf', 'phase', 'hitstop', 'slow', 'round', 'wins', 'timeOut'];
function netSnapObj(o, skip) {
  const out = {};
  for (const k of Object.keys(o)) { if (skip && skip.has(k)) continue; const v = o[k]; if (typeof v === 'function') continue; if (netPlain(v)) out[k] = v; }
  return out;
}
function netApplyObj(o, s) {
  for (const k of Object.keys(s)) {
    const v = s[k], cur = o[k];
    if (cur && v && typeof cur === 'object' && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(cur) === Object.prototype) { for (const kk of Object.keys(cur)) if (!(kk in v)) delete cur[kk]; Object.assign(cur, v); }
    else o[k] = v;
  }
}

class NetBattle extends Battle {
  constructor(cfg) {
    NetRng.seed(cfg.seed);
    const restore = netEnter(cfg);
    try { super(cfg); } finally { restore(); }
    this.online = true; this.lp = Net.role === 'host' ? 0 : 1; this.delay = cfg.delay;
    this.simF = 0; this.localF = cfg.delay; this.lin = new Map(); this.kp = new Set(); this.stall = 0; this.syncAt = -1; this.syncState = null; this.myHash = new Map();
    this.vin = [0, 1].map(() => ({ l: false, r: false, u: false, d: false, btn: { held: {}, press: new Set() } }));
    this.inputs[0].virtual = this.vin[0]; this.inputs[1].virtual = this.vin[1];
    for (let f = 0; f < cfg.delay; f++) { this.lin.set(f, 0); if (!Net.rin.has(f)) Net.rin.set(f, 0); }
    this.touch = false;
    TouchPad.attach(this); if (Settings.mobile) TouchPad.bt = this;    // the pad drives the LOCAL fighter (read in sample())
    this.padBt = { p1: this.lp ? this.p2 : this.p1, pf: 0, practice: false };
  }
  get me() { return this.lp ? this.p2 : this.p1; }
  onNet(d) {
    if (d.m !== Net.match) return;
    if (d.t === 'sync' && Net.role === 'guest') this.syncAt = d.f;
    if (d.t === 'state' && Net.role === 'guest') this.syncState = d;
  }
  sample() {
    const kp = this.kp, b1 = Settings.binds[1], b2 = Settings.binds[2], K = Keys.down;
    const ok = ['Enter', 'Space', b1.light, b2.light].some(c => kp.has(c));
    let v;
    if (this.paused) v = 0;
    else if (TouchPad.bt === this) {
      for (const a of NET_BTNS) if (kp.has(b1[a]) || kp.has(b2[a])) TouchPad.pend.add(a);
      this.padBt.p1 = this.me; TouchPad.tick(this.padBt);
      const t = TouchPad.v, any = c => K.has(c);
      v = netEncode(t.l || any(b2.left), t.r || any(b2.right), t.u || any(b2.up), t.d || any(b2.down), a => t.btn.held[a] || any(b2[a]), a => t.btn.press.has(a));
    } else {
      const dn = a => K.has(b1[a]) || K.has(b2[a]);
      v = netEncode(dn('left'), dn('right'), dn('up'), dn('down'), dn, a => kp.has(b1[a]) || kp.has(b2[a]));
    }
    kp.clear();
    return ok ? v | NET_OK : v;
  }
  update() {
    Net.tick(); if (scene !== this) return;
    for (const c of Keys.pressed) this.kp.add(c);
    if (this.paused) this.updateLeave();
    else if (Keys.pressed.has('Escape')) { this.kp.delete('Escape'); this.paused = true; Sound.play('menuOk'); this.pauseMenu = new MenuList([{ id: 'resume', label: 'RESUME', jp: '再開' }, { id: 'list', label: 'MOVE LIST', jp: '技表' }, { id: 'leave', label: 'LEAVE MATCH', jp: '退出' }], W / 2, 290, { w: 400, h: 54 }); }
    const maxSteps = Net.rinMax > this.simF + this.delay ? 2 : 1;
    let steps = 0;
    for (; steps < maxSteps; steps++) {
      while (this.localF <= this.simF + this.delay) { const v = this.sample(); this.lin.set(this.localF, v); Net.send({ t: 'i', m: Net.match, f: this.localF, v: [v] }); this.localF++; }
      if (!Net.rin.has(this.simF) || !this.syncGate()) break;
      this.netStep();
      if (scene !== this) return;
    }
    this.stall = steps ? 0 : this.stall + 1;
  }
  // soft resync: host captures its state at frame syncAt, the guest waits for it and adopts it
  syncGate() {
    if (this.syncAt !== this.simF) return true;
    if (Net.role === 'host') { Net.send({ t: 'state', m: Net.match, f: this.simF, s: this.snapshot() }); this.syncAt = -1; return true; }
    if (!this.syncState || this.syncState.f !== this.simF) return false;
    this.restoreSnap(netDec(this.syncState.s)); this.syncState = null; this.syncAt = -1; Net.desyncs++;
    return true;
  }
  snapshot() {
    const fs = [this.p1, this.p2].map(F => ({ o: netSnapObj(F, NET_SKIP_F), mk: F.move ? F.moveKey : null, ch: F.ch.id, i: netSnapObj(F.input, new Set(['virtual'])) }));
    const b = {}; for (const k of NET_BT_KEYS) b[k] = this[k];
    b.win = this.winner ? this.winner.pid : 0;
    return netEnc({ b, f: fs, rng: NetRng.s });
  }
  restoreSnap(s) {
    [this.p1, this.p2].forEach((F, i) => {
      const fs = s.f[i]; netApplyObj(F, fs.o); netApplyObj(F.input, fs.i);
      if (fs.mk && F.ch.id === fs.ch && F.ch.moves && F.ch.moves[fs.mk]) F.move = F.ch.moves[fs.mk];
      else if (!fs.mk) F.move = null;
    });
    for (const k of NET_BT_KEYS) if (k in s.b) this[k] = s.b[k];
    this.winner = s.b.win ? (s.b.win === 1 ? this.p1 : this.p2) : null;
    NetRng.s = s.rng;
  }
  netStep() {
    const f = this.simF, mine = this.lin.get(f), theirs = Net.rin.get(f);
    const v0 = this.lp ? theirs : mine, v1 = this.lp ? mine : theirs;
    netDecode(v0, this.vin[0]); netDecode(v1, this.vin[1]);
    const wasPaused = this.paused; this.paused = false;
    const restore = netEnter(this.cfg);
    try { if ((v0 | v1) & NET_OK) Keys.pressed.add('Enter'); Battle.prototype.update.call(this); }
    finally { restore(); if (scene === this) this.paused = wasPaused; }
    this.lin.delete(f - 240); Net.rin.delete(f - 240);
    this.simF++;
    if (f % NET_HASH_EVERY === 0) { const h = this.stateHash(); this.myHash.set(f, h); Net.send({ t: 'h', m: Net.match, f, h }); this.netCheck(f); }
    if (scene !== this && scene instanceof ResultsScene) go(new NetResultsScene(this));
  }
  stateHash() {
    const r = x => Math.round(x * 10), parts = [this.phase, this.timer === Infinity ? -1 : this.timer, this.round, this.wins.join('-'), this.projs.length, NetRng.s];
    for (const F of [this.p1, this.p2]) parts.push(r(F.x), r(F.y), r(F.hp), r(F.meter), F.state, F.moveKey || '');
    return netHashStr(parts.join(','));
  }
  netCheck(f) {
    if (!this.myHash.has(f) || !Net.rhash.has(f)) return;
    const same = this.myHash.get(f) === Net.rhash.get(f); this.myHash.delete(f); Net.rhash.delete(f);
    if (!same && Net.role === 'host' && this.syncAt < 0) { this.syncAt = this.simF + this.delay + 12; Net.send({ t: 'sync', m: Net.match, f: this.syncAt }); Net.desyncs++; }
  }
  updateLeave() {
    if (this.showList) { if (UI.left() || UI.right()) this.listPage = (this.listPage + 1) % 2; else if (Keys.pressed.size || Mouse.clicked) this.showList = false; return; }
    if (Keys.pressed.has('Escape')) { this.paused = false; Sound.play('menuBack'); return; }
    const it = this.pauseMenu.update(); if (!it) return;
    Sound.play('menuOk');
    if (it.id === 'resume') this.paused = false;
    if (it.id === 'list') this.showList = true;
    if (it.id === 'leave') { Net.close(); go(new NetLobbyScene({ error: 'You left the match.' })); }
  }
  drawPause(g) {
    g.fillStyle = 'rgba(5,2,14,0.72)'; g.fillRect(0, 0, W, H);
    if (this.showList) { drawMoveList(g, this.me.ch, 345, 60, 590, 'YOU', this.listPage); drawFooter(g, '← / →  page   ·   any button: close   ·   the match keeps running!'); return; }
    drawTitleText(g, 'MENU', W / 2, 160, 80, '#ffffff', '#18a85a');
    g.font = `700 20px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = '#ffb0c0'; g.fillText('Online match — the fight keeps running!', W / 2, 220);
    this.pauseMenu.draw(g, this.pf);
    drawFooter(g, 'ESC: back to the fight   ·   ↑/↓ + ENTER: select');
  }
  draw(g) {
    super.draw(g);
    if (TouchPad.bt === this && !this.paused) { this.padBt.p1 = this.me; this.padBt.pf = this.pf; TouchPad.draw(g, this.padBt); }
    // marker over the local fighter for the first seconds of each round
    if ((this.phase === 'roundCall' || this.phase === 'intro' || (this.phase === 'fight' && this.pf < 120)) && !this.paused) {
      const F = this.me, [sx, sy] = this.cam.toScreen(F.x, F.y - 230 * (F.s || 1));
      g.save(); g.font = `italic 900 26px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle'; strokeText(g, '▼ YOU', sx, clamp(sy, 120, H - 60), '#7affc0', OUTLINE, 5); g.restore();
    }
    g.save(); g.font = `700 13px ${FONT_UI}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(160,255,210,0.75)';
    g.fillText(`ONLINE · ${Math.round(Net.rtt)} ms · delay ${this.delay}${Net.desyncs ? ' · sync ' + Net.desyncs : ''}`, 14, H - 14); g.restore();
    if (this.stall > 30) {
      g.save(); g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, H / 2 - 40, W, 80); g.font = `900 34px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffd84a';
      g.fillText('WAITING FOR OPPONENT' + '.'.repeat(1 + (this.stall >> 4) % 3), W / 2, H / 2); g.restore();
    }
  }
}

// ---------------- results: rematch needs both players ----------------
class NetResultsScene extends ResultsScene {
  constructor(bt) {
    super(bt);
    this.menu = new MenuList([{ id: 'rematch', label: 'REMATCH', jp: '再戦' }, { id: 'select', label: 'CHARACTER SELECT', jp: 'キャラ選択' }, { id: 'leave', label: 'LEAVE ROOM', jp: '退出' }], 960, 500, { w: 420, h: 50 });
    this.want = false; this.rwant = false; this.won = this.win.pid - 1 === bt.lp;
    // series score for this room (rematches keep counting)
    const sr = Net.series && Net.series.code === Net.code ? Net.series : (Net.series = { code: Net.code, me: 0, rv: 0, m: 0 });
    if (sr.m !== Net.match) { sr.m = Net.match; this.won ? sr.me++ : sr.rv++; }
    this.series = sr;
  }
  onNet(d) {
    if (d.t === 'res') { if (d.w === 'rematch') { this.rwant = true; this.rwantT = this.t; this.menu.items[0].label = this.want ? 'REMATCH' : 'ACCEPT REMATCH'; this.menu.sel = 0; Sound.play('menuOk'); } if (d.w === 'select') { Sound.play('menuBack'); go(new NetSelectScene()); } }
    if (d.t === 'start' && Net.role === 'guest') netStartMatch(d.cfg, d.m);
  }
  update() {
    Net.tick(); if (scene !== this) return;
    this.t++;
    if (Net.role === 'host' && this.want && this.rwant && !this.started) {
      this.started = true;
      const c = this.bt.cfg, cfg = { ...c, stage: (c.stage + 1) % STAGES.length, seed: Math.floor(Math.random() * 4294967295) + 1, delay: Net.delayFrames() }, m = Net.match + 1;
      Net.send({ t: 'start', cfg, m }); netStartMatch(cfg, m); return;
    }
    if (this.t < 30) return;
    const it = this.menu.update(); if (!it) return;
    Sound.play('menuOk');
    if (it.id === 'rematch' && !this.want) { this.want = true; this.menu.items[0].label = this.rwant ? 'STARTING…' : 'WAITING…'; Net.send({ t: 'res', w: 'rematch' }); }
    if (it.id === 'select') { Net.send({ t: 'res', w: 'select' }); go(new NetSelectScene()); }
    if (it.id === 'leave') { Net.close(); go(new NetLobbyScene()); }
  }
  draw(g) {
    super.draw(g);
    g.fillStyle = '#05030a'; g.fillRect(0, H - 34, W, 34);
    drawFooter(g, this.want ? (this.rwant ? 'Starting rematch…' : 'Waiting for your rival to accept the rematch…') : this.rwant ? 'Your rival wants a REMATCH!' : '↑/↓ + ENTER  ·  tap');
    g.save(); g.translate(330, 110); g.rotate(-0.08); drawTitleText(g, this.won ? 'YOU WIN!' : 'YOU LOSE', 0, 0, 64, this.won ? '#7affc0' : '#ff8aa0', this.won ? '#18a85a' : '#a8183a'); g.restore();
    const sr = this.series;
    if (sr && sr.me + sr.rv > 1) {   // series score once there was a rematch
      g.save(); g.font = `italic 900 24px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const txt = `SERIES  ${sr.me} – ${sr.rv}`, w = g.measureText(txt).width + 34;
      g.fillStyle = 'rgba(8,4,20,0.85)'; g.fillRect(330 - w / 2, 22, w, 36); g.strokeStyle = sr.me > sr.rv ? '#7affc0' : sr.me < sr.rv ? '#ff8aa0' : '#ffd84a'; g.lineWidth = 2; g.strokeRect(330 - w / 2, 22, w, 36);
      g.fillStyle = '#ffffff'; g.fillText(txt, 330, 41); g.restore();
    }
    if (this.rwant && !this.want) {   // the rival asked: big accept prompt
      const k = Math.min(1, (this.t - (this.rwantT | 0)) / 12), pu = 1 + Math.sin(this.t / 6) * 0.04;
      g.save(); g.translate(400, 525); g.scale(k * pu, k * pu);
      g.font = `italic 900 30px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const txt = 'RIVAL WANTS A REMATCH!  ▶', w = g.measureText(txt).width + 44;
      g.fillStyle = '#ffd84a'; g.fillRect(-w / 2, -24, w, 48); g.strokeStyle = '#140a24'; g.lineWidth = 3; g.strokeRect(-w / 2, -24, w, 48);
      g.fillStyle = '#140a24'; g.fillText(txt, 0, 2); g.restore();
    }
    netStatusChip(g);
  }
}

window.addEventListener('pagehide', () => { if (Net.conn) Net.close(); });

// ---------------- title-screen entry ("ONLINE 1 VS 1") + invite links (?join=123456) ----------------
const NET_JOIN = (() => { try { const j = new URLSearchParams(location.search).get('join'); return j && /^\d{6}$/.test(j) ? j : null; } catch (e) { return null; } })();
let netJoinPending = NET_JOIN;
{
  const up = TitleScene.prototype.update;
  TitleScene.prototype.netMenu = function () {
    if (this.netAdded) return; this.netAdded = true;
    const m = this.menu, items = m.items;
    if (!items.some(i => i.id === 'online')) items.splice(2, 0, { id: 'online', label: 'ONLINE 1 VS 1', jp: 'オンライン' });
    m.h = 44; m.gap = 8;
    const mu = m.update.bind(m);
    m.update = () => { const it = mu(); if (it && it.id === 'online') { Sound.play('menuOk'); go(new NetLobbyScene()); return null; } return it; };
  };
  TitleScene.prototype.update = function () {
    this.netMenu();
    if (netJoinPending) { const j = netJoinPending; netJoinPending = null; go(new NetLobbyScene({ join: j })); return; }
    return up.call(this);
  };
  const dr = TitleScene.prototype.draw;
  TitleScene.prototype.draw = function (g) { this.netMenu(); return dr.call(this, g); };
}
