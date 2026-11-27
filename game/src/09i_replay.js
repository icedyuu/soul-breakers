// ============================ REPLAYS · SPECTATING ============================
// Every finished VS match (1P vs CPU, Arcade, 1P vs 2P, Online) is recorded as
//   seed + sim settings + battle cfg + both fighters' resolved inputs per frame.
// The sim is deterministic with a seeded Math.random (the same trick as online lockstep),
// so a replay just runs the battle again from those inputs. Local matches therefore run
// their sim with NetRng too (CPU bot + touch pad keep the real Math.random: they only
// produce inputs, which are recorded). A state hash every 60 frames checks the playback;
// online soft-resyncs are stored as snapshots and adopted at the same frame.
// Saved on the device (localStorage 'sb_replays_v1'): the last RP_MAX matches + favourites.
// Spectating: the online host relays the recording live to friends (PeerJS, read-only);
// the spectator plays it back as a live replay ~1.5 s behind (see the bottom of this file).
const RP_KEY = 'sb_replays_v1', RP_MAX = 12, RP_FAV_MAX = 20, RP_HASH_EVERY = 60;
let RP_CTX = null, RP_OK = false;

function rpPack(A, B) {
  const out = []; let i = 0;
  while (i < A.length) {
    let j = i + 1; while (j < A.length && A[j] === A[i] && B[j] === B[i]) j++;
    const n = j - i; out.push(A[i].toString(36) + '.' + B[i].toString(36) + (n > 1 ? '*' + n.toString(36) : '')); i = j;
  }
  return out.join(',');
}
function rpUnpack(s) {
  const A = [], B = []; if (!s) return { A, B };
  for (const t of s.split(',')) {
    const st = t.indexOf('*'), ab = st < 0 ? t : t.slice(0, st), c = st < 0 ? 1 : parseInt(t.slice(st + 1), 36), d = ab.indexOf('.');
    const a = parseInt(ab.slice(0, d), 36), b = parseInt(ab.slice(d + 1), 36);
    for (let k = 0; k < c; k++) { A.push(a); B.push(b); }
  }
  return { A, B };
}
// one input's resolved state this frame → netplay int (dirs, 6 held, 6 pressed)
function rpEnc(inp) { return netEncode(inp.h < 0, inp.h > 0, inp.u, inp.d, a => !!inp.held[a], a => inp.pressF[a] === inp.f); }
function rpModeLabel(cfg) {
  if (cfg.online) return 'ONLINE';
  if (cfg.cpu) return (cfg.cpu.arcade ? 'ARCADE' : 'VS CPU') + ' · ' + (CPU_LEVELS[cfg.cpu.level] ? CPU_LEVELS[cfg.cpu.level].name : '');
  return '1P VS 2P';
}

// ---------------- storage ----------------
const Replay = {
  list: null, opt: { spec: true },
  load() {
    if (this.list) return this.list;
    try { const d = JSON.parse(localStorage.getItem(RP_KEY) || 'null'); this.list = d && Array.isArray(d.l) ? d.l : []; if (d && d.opt) this.opt = Object.assign(this.opt, d.opt); }
    catch (e) { this.list = []; }
    return this.list;
  },
  save() {
    const l = this.load();
    for (let tries = 0; tries < 40; tries++) {
      try { localStorage.setItem(RP_KEY, JSON.stringify({ v: 1, l, opt: this.opt })); return true; }
      catch (e) {   // storage full: drop the oldest non-favourite (then the oldest favourite)
        let i = -1; for (let k = l.length - 1; k >= 0; k--) if (!l[k].fav) { i = k; break; }
        if (i < 0) i = l.length - 1; if (i < 0) return false; l.splice(i, 1);
      }
    }
    return false;
  },
  add(R) {
    const l = this.load(); l.unshift(R);
    let n = 0; for (let i = 0; i < l.length; i++) if (!l[i].fav && ++n > RP_MAX) { l.splice(i, 1); i--; }
    this.save();
  },
  fav(R) {
    if (!R.fav && this.load().filter(r => r.fav).length >= RP_FAV_MAX) return false;
    R.fav = !R.fav; this.save(); return true;
  },
  remove(R) { const l = this.load(), i = l.indexOf(R); if (i >= 0) l.splice(i, 1); this.save(); },
  setOpt(k, v) { this.load(); this.opt[k] = v; this.save(); },
  // finished battle → stored replay object
  fromBattle(bt) {
    const r = bt.rec, c = r.cfg;
    return {
      v: 1, id: Date.now().toString(36) + Math.floor(NetRng.orig() * 1e6).toString(36), at: Date.now(), kind: r.kind, seed: r.seed, env: r.env, cfg: c, b: netBuildId(),
      p1: CHARS[c.p1].id, p2: CHARS[c.p2].id, names: r.names, side: r.side, mode: rpModeLabel(c),
      wins: bt.wins.slice(), n: r.a.length, fr: rpPack(r.a, r.b), h: r.h, snaps: r.snaps, fav: false,
    };
  },
};

// ---------------- recording hooks ----------------
{
  const BP = Battle.prototype;
  const swapRng = (fn) => function (...a) { const r = Math.random; Math.random = NetRng.orig; try { return fn.apply(this, a); } finally { Math.random = r; } };
  CpuBot.prototype.tick = swapRng(CpuBot.prototype.tick);   // bots / touch only make inputs → keep them off the sim RNG
  TouchPad.tick = swapRng(TouchPad.tick);
  Mastery.fresh = swapRng(Mastery.fresh);   // a new profile id may be made lazily during the first battle

  const nr = BP.newRound;
  BP.newRound = function (first) {
    if (first) {
      if (RP_CTX) { if (RP_CTX.kind === 'local') NetRng.seed(RP_CTX.seed); }
      else if (this.mode === 'versus' && Replay.on !== false) {
        const net = typeof NetBattle !== 'undefined' && this instanceof NetBattle;
        const seed = net ? this.cfg.seed : ((NetRng.orig() * 4294967295) >>> 0) || 1;
        if (!net) NetRng.seed(seed);
        this.rec = { kind: net ? 'net' : 'local', seed, a: [], b: [], h: {}, snaps: {}, cfg: null,
          env: net ? { rt: this.cfg.roundTime, fx: 'HIGH', sh: true } : { rt: Settings.roundTime, fx: Settings.fx, sh: Settings.shake } };
      }
    }
    const loc = this.rec && this.rec.kind === 'local' && !RP_CTX, mr = Math.random;
    if (loc) Math.random = netRandom;
    let res; try { res = nr.call(this, first); } finally { if (loc) Math.random = mr; }
    if (first && this.rec && !this.rec.cfg) {
      const r = this.rec, c = this.cfg;
      r.cfg = JSON.parse(JSON.stringify(c));
      const me = (typeof Cloud !== 'undefined' && Cloud.on && Cloud.name) || 'YOU';
      if (r.kind === 'net') { const lp = Net.role === 'host' ? 0 : 1, rv = Net.rival || 'RIVAL'; r.side = lp; r.names = lp ? [rv, me] : [me, rv]; }
      else { r.side = 0; r.names = c.cpu ? [me, 'CPU'] : ['P1', 'P2']; }
      if (typeof SpecHost !== 'undefined') SpecHost.matchStart(this);
    }
    return res;
  };
  const bu = BP.update;
  BP.update = function () {
    const r = this.rec;
    if (!r) return bu.call(this);
    const loc = r.kind === 'local' && !this.paused, mr = Math.random;
    if (loc) Math.random = netRandom;
    this._stepped = false;
    const ok = UI.ok();   // read before the update: go() clears Keys.pressed mid-frame
    try { bu.call(this); } finally { if (loc) Math.random = mr; }
    // one recorded frame per sim step (inputs were resolved inside stepSim)
    if (this._stepped && !this.recDone) {
      const i0 = this.inputs[0], i1 = this.inputs[1];
      r.a.push(rpEnc(i0) | (ok ? NET_OK : 0)); r.b.push(rpEnc(i1));
      const k = r.a.length;
      if (k % RP_HASH_EVERY === 0) r.h[k] = NetBattle.prototype.stateHash.call(this);
      if (typeof SpecHost !== 'undefined') SpecHost.frame(this);
    }
    if (this.phase === 'matchEnd' && !this.recDone) this.storeReplay();   // the match is over: store it
  };
  const ss = BP.stepSim;
  BP.stepSim = function () { this._stepped = true; return ss.call(this); };
  BP.storeReplay = function () {
    this.recDone = true;
    try { this.savedReplay = Replay.fromBattle(this); Replay.add(this.savedReplay); } catch (e) { console.warn('replay not saved', e); }
    if (typeof SpecHost !== 'undefined') SpecHost.matchEnd(this);
  };
  // online soft resync: remember the adopted state so the replay adopts it at the same frame
  const rs = NetBattle.prototype.restoreSnap;
  NetBattle.prototype.restoreSnap = function (s) {
    if (this.rec && !this.recDone) { const enc = netEnc(s); this.rec.snaps[this.rec.a.length] = enc; if (typeof SpecHost !== 'undefined') SpecHost.snap(this, this.rec.a.length, enc); }
    return rs.call(this, s);
  };
}

// ---------------- playback ----------------
function rpEnter(env) {
  const mr = Math.random, kp = Keys.pressed, rt = Settings.roundTime, fx = Settings.fx, sh = Settings.shake, ok = UI.ok;
  Math.random = netRandom; Keys.pressed = new Set(); Settings.roundTime = env.rt; Settings.fx = env.fx; Settings.shake = env.sh; UI.ok = () => RP_OK;
  return () => { Math.random = mr; Keys.pressed = kp; Settings.roundTime = rt; Settings.fx = fx; Settings.shake = sh; UI.ok = ok; };
}
const RP_SPEEDS = [0.25, 0.5, 1, 2, 4];
class ReplayBattle extends Battle {
  // R: stored replay (or a live spectator stream with R.A / R.B arrays); o: { back(), live }
  constructor(R, o = {}) {
    const cfg = JSON.parse(JSON.stringify(R.cfg)); cfg.cosAuto = false;
    NetRng.seed(R.seed); RP_CTX = R; RP_OK = false;
    const restore = rpEnter(R.env);
    try { super(cfg); } finally { restore(); RP_CTX = null; }
    if (!R.A) { const u = rpUnpack(R.fr); R.A = u.A; R.B = u.B; }
    this.R = R; this.o = o; this.k = 0; this.spd = 2; this.acc = 0; this.rpPaused = false; this.bad = 0; this.ended = false; this.endT = 0;
    this.cpu = cfg.cpu ? { level: cfg.cpu.level, tick() { } } : null;
    this.touch = false; this.isReplay = true;
    this.vin = [0, 1].map(() => ({ l: false, r: false, u: false, d: false, btn: { held: {}, press: new Set() } }));
    this.inputs[0].virtual = this.vin[0]; this.inputs[1].virtual = this.vin[1];
  }
  get total() { return this.o.live ? this.R.A.length : this.R.n; }
  step() {
    const R = this.R, k = this.k;
    if (R.snaps && R.snaps[k]) NetBattle.prototype.restoreSnap.call(this, netDec(R.snaps[k]));
    const a = R.A[k], b = R.B[k];
    netDecode(a, this.vin[0]); netDecode(b, this.vin[1]); RP_OK = !!(a & NET_OK);
    const restore = rpEnter(R.env);
    try { Battle.prototype.update.call(this); } finally { restore(); RP_OK = false; }
    this.k++;
    const h = R.h && R.h[this.k];
    if (h !== undefined && !this.ended && h !== NetBattle.prototype.stateHash.call(this)) this.bad++;   // (last frame: the results screen changed the live match)
  }
  updateRoundEnd() {   // last round: don't open the results screen (no XP for watching)
    if ((this.wins[0] >= 2 || this.wins[1] >= 2) && (this.pf >= 210 || (this.pf > 60 && UI.ok()))) { this.phase = 'matchEnd'; this.ended = true; return; }
    return super.updateRoundEnd();
  }
  btns() {
    const y = H - 62, b = (i, w = 62) => ({ x: W / 2 - 238 + i * 68, y, w, h: 44 });
    return [['restart', '⏮', b(0)], ['slow', '−', b(1)], ['pause', this.rpPaused ? '▶' : '❚❚', b(2)], ['fast', '+', b(3)], ['fav', this.R.fav ? '★' : '☆', b(4)], ['exit', '✕', b(5)]]
      .filter(x => !this.o.live || x[0] === 'pause' || x[0] === 'exit');
  }
  act(id) {
    Sound.play('menuMove');
    if (id === 'pause') this.rpPaused = !this.rpPaused;
    if (id === 'slow') this.spd = Math.max(0, this.spd - 1);
    if (id === 'fast') this.spd = Math.min(RP_SPEEDS.length - 1, this.spd + 1);
    if (id === 'fav' && !this.o.live) { if (!Replay.fav(this.R)) this.toast = { t: 0, s: 'Favourites are full (' + RP_FAV_MAX + ').' }; else this.toast = { t: 0, s: this.R.fav ? '★ Saved as favourite' : 'Favourite removed' }; }
    if (id === 'restart') go(new ReplayBattle(this.R, this.o));
    if (id === 'exit') this.exit();
  }
  exit() { Sound.play('menuBack'); go(this.o.back ? this.o.back() : new ReplaysScene()); }
  controls() {
    const wake = Mouse.clicked || Mouse.moved || Keys.pressed.size > 0;
    if (wake) { const hidden = !this.barOn(); this.uiT = 0; if (hidden && Mouse.clicked && Settings.mobile) { Mouse.clicked = false; return false; } } else this.uiT = (this.uiT || 0) + 1;
    const P = Keys.pressed, b1 = Settings.binds[1], b2 = Settings.binds[2], has = (...c) => c.some(x => P.has(x));
    if (has('Escape', 'Backspace', b1.heavy, b2.heavy)) { this.exit(); return true; }
    if (has('Space', 'Enter', 'KeyP', b1.light, b2.light)) this.act('pause');
    if (has('ArrowLeft', 'Minus', 'NumpadSubtract', b1.left, b1.sp1, b2.sp1)) this.act('slow');
    if (has('ArrowRight', 'Equal', 'NumpadAdd', b1.right, b1.sp2, b2.sp2)) this.act('fast');
    if (!this.o.live && has('KeyR')) { this.act('restart'); return true; }
    if (!this.o.live && has('KeyF', b1.medium)) this.act('fav');
    if (Mouse.clicked) for (const [id, , r] of this.btns()) if (inRect(r)) { Mouse.clicked = false; this.act(id); if (scene !== this) return true; }
    return scene !== this;
  }
  barOn() { return (this.uiT || 0) < 200 || this.rpPaused || this.ended || (!this.o.live && this.k >= this.total); }
  update() {
    if (this.toast && ++this.toast.t > 120) this.toast = null;
    if (this.controls()) return;
    if (this.ended || this.k >= this.total) {
      if (!this.o.live) { this.endT++; if (this.endT > 120 && this.endT % 1 === 0 && !this.rpPaused) { /* stays on the last frame */ } }
      if (this.o.live && this.o.onStarve) this.o.onStarve(this);
      return;
    }
    if (this.rpPaused) return;
    let n = this.o.live && this.o.rate ? this.o.rate(this) : RP_SPEEDS[this.spd];
    this.acc += n;
    let steps = 0;
    while (this.acc >= 1 && this.k < this.total && !this.ended && steps < 8) { this.acc--; steps++; this.step(); if (scene !== this) return; }
    if (this.k >= this.total || this.ended) this.acc = 0;
  }
  draw(g) {
    super.draw(g);
    const R = this.R, live = this.o.live;
    // top badge
    g.save(); g.font = `italic 900 22px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tag = live ? '● LIVE · ' + (this.o.title || 'SPECTATING') : 'REPLAY · ' + R.mode;
    const tw = g.measureText(tag).width + 36;
    g.fillStyle = 'rgba(8,4,20,0.78)'; g.fillRect(W / 2 - tw / 2, 150, tw, 32);
    strokeText(g, tag, W / 2, 167, live ? '#ff6a7a' : '#7ad8ff', OUTLINE, 4);
    if (R.names) { g.font = `800 15px ${FONT_UI}`; g.fillStyle = '#e8dcff'; g.fillText(`${R.names[0]}  vs  ${R.names[1]}`, W / 2, 194); }
    g.restore();
    // control bar (hides after ~3 s without input)
    if (!this.barOn()) { const tot = Math.max(1, this.total); g.fillStyle = live ? '#ff6a7a' : '#7ad8ff'; g.globalAlpha = 0.7; g.fillRect(0, H - 3, W * Math.min(1, this.k / tot), 3); g.globalAlpha = 1; }
    else {
    g.save(); g.fillStyle = 'rgba(8,4,20,0.72)'; g.fillRect(0, H - 76, W, 76);
    const tot = Math.max(1, this.total), pr = Math.min(1, this.k / tot);
    g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(20, H - 74, W - 40, 6); g.fillStyle = live ? '#ff6a7a' : '#7ad8ff'; g.fillRect(20, H - 74, (W - 40) * pr, 6);
    for (const [id, lab, r] of this.btns()) {
      const on = inRect(r) || (id === 'pause' && this.rpPaused);
      drawButton(g, r, '', null, on, this.pf);
      g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 22px ${FONT_UI}`; g.fillStyle = id === 'fav' && this.R.fav ? '#ffd84a' : '#ffffff'; g.fillText(lab, r.x + r.w / 2 - 3, r.y + r.h / 2 + 1); g.restore();
    }
    g.font = `800 16px ${FONT_UI}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#ffd84a';
    g.fillText(live ? (this.o.status ? this.o.status(this) : '') : `${RP_SPEEDS[this.spd]}×`, W / 2 + 200, H - 40);
    g.textAlign = 'right'; g.fillStyle = '#cfc4ee'; g.font = `700 14px ${FONT_UI}`;
    const sec = f => { const s = Math.floor(f / 60); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    g.fillText(`${sec(this.k)} / ${sec(tot)}`, W / 2 - 250, H - 40);
    g.textAlign = 'left'; g.fillStyle = 'rgba(220,210,255,0.6)'; g.font = `600 13px ${FONT_UI}`;
    if (!Settings.mobile) g.fillText(live ? 'SPACE pause · ←/→ speed · ESC leave' : 'SPACE pause · ←/→ speed · R restart · F favourite · ESC back', 20, H - 22);
    if (this.bad) { g.textAlign = 'right'; g.fillStyle = '#ff9a7a'; g.fillText('⚠ replay out of sync (older game version?)', W - 20, H - 22); }
    g.restore();
    }
    if (this.rpPaused || this.ended || (!live && this.k >= this.total)) {
      g.save(); g.font = `italic 900 46px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      strokeText(g, this.rpPaused ? 'PAUSED' : live ? 'MATCH OVER' : 'END OF REPLAY', W / 2, H / 2 - 120, '#ffffff', OUTLINE, 6);
      if (!this.rpPaused && !live) { g.font = `700 18px ${FONT_UI}`; g.fillStyle = '#e8dcff'; g.fillText('⏮ watch again   ·   ✕ back', W / 2, H / 2 - 76); }
      g.restore();
    }
    if (this.toast) { g.save(); g.font = `800 20px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(8,4,20,0.85)'; g.fillRect(W / 2 - 220, 220, 440, 40); g.fillStyle = '#ffd84a'; g.fillText(this.toast.s, W / 2, 241); g.restore(); }
  }
}

// ---------------- REPLAYS menu ----------------
class ReplaysScene {
  constructor(o = {}) {
    this.t = 0; this.sel = o.sel || 0; this.act = 0; this.confirm = null; this.msg = ''; this.back = o.back || (() => new TitleScene());
    Music.play('menu'); Replay.load();
  }
  rows() { return Replay.load(); }
  get top() { return Math.max(0, Math.min(this.sel - 3, this.rows().length - 7)); }
  rowY(i) { return 176 + (i - this.top) * 60; }
  acts(R) { return [['watch', 'WATCH'], ['fav', ''], ['del', this.confirm === R ? 'SURE?' : 'DELETE']]; }
  actRect(i, j) { const w = [140, 60, 116][j], x = [850, 998, 1066][j]; return { x, y: this.rowY(i) + 8, w, h: 40 }; }
  specRect() { return { x: W / 2 - 330 + 120, y: H - 90, w: 660 - 120, h: 50 }; }
  say(m) { this.msg = m; this.msgT = 0; }
  run(R, a) {
    if (!R) return;
    if (a === 'watch') {
      if (R.b && R.b !== netBuildId()) this.say('Recorded with an older game version: it may play out differently.');
      Sound.play('menuOk'); const sel = this.sel, back = this.back;
      go(new ReplayBattle(R, { back: () => new ReplaysScene({ sel, back }) })); return;
    }
    if (a === 'fav') { if (!Replay.fav(R)) this.say(`You can keep up to ${RP_FAV_MAX} favourites.`); else { Sound.play('menuOk'); this.say(R.fav ? '★ Favourite: this replay is kept.' : `Favourite removed. The game keeps your last ${RP_MAX} matches.`); } return; }
    if (a === 'del') {
      if (this.confirm !== R) { this.confirm = R; Sound.play('menuMove'); return; }
      Replay.remove(R); this.confirm = null; Sound.play('menuBack'); this.say('Replay deleted.');
    }
  }
  toggleSpec() { Replay.setOpt('spec', !Replay.opt.spec); Sound.play('menuMove'); }
  update() {
    this.t++; if (this.msgT !== undefined) this.msgT++;
    const rows = this.rows();
    if (this.sel >= rows.length) this.sel = Math.max(0, rows.length - 1);
    if (Keys.pressed.has('Escape') || UI.back() || (Mouse.clicked && inRect(cloudBackRect))) { Sound.play('menuBack'); go(this.back()); return; }
    if (Mouse.clicked && inRect(this.specRect())) { this.toggleSpec(); return; }
    if (UI.up() && rows.length) { this.sel = (this.sel + rows.length - 1) % rows.length; this.confirm = null; Sound.play('menuMove'); }
    if (UI.down() && rows.length) { this.sel = (this.sel + 1) % rows.length; this.confirm = null; Sound.play('menuMove'); }
    const R = rows[this.sel];
    if (R && (UI.left() || UI.right())) { this.act = (this.act + (UI.right() ? 1 : 2)) % 3; Sound.play('menuMove'); }
    if (R && UI.ok()) { this.run(R, this.acts(R)[this.act][0]); return; }
    if (R && (pressedAny('KeyF') || UI.p(1, 'medium'))) this.run(R, 'fav');
    if (R && pressedAny('Delete')) this.run(R, 'del');
    if (!Mouse.clicked) return;
    const top = this.top;
    for (let i = top; i < Math.min(rows.length, top + 7); i++) {
      for (let j = 0; j < 3; j++) if (inRect(this.actRect(i, j))) { this.sel = i; this.act = j; this.run(rows[i], this.acts(rows[i])[j][0]); return; }
      if (inRect({ x: 90, y: this.rowY(i), w: 760, h: 56 })) { if (this.sel === i) this.run(rows[i], 'watch'); else { this.sel = i; this.confirm = null; Sound.play('menuMove'); } return; }
    }
  }
  draw(g) {
    const t = this.t, rows = this.rows(), top = this.top;
    drawMenuBG(g, t, '#3a8aff');
    drawTitleText(g, 'REPLAYS', W / 2, 72, 72, '#ffd84a', '#2a6aff');
    g.font = `700 17px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#bcd8ff';
    g.fillText(`リプレイ · your last ${RP_MAX} matches are saved on this device · ★ keeps one for good`, W / 2, 126);
    panel(g, 80, 162, W - 160, 440);
    g.textBaseline = 'middle';
    if (!rows.length) { g.textAlign = 'center'; g.font = `700 20px ${FONT_UI}`; g.fillStyle = '#fff'; g.fillText('No replays yet. Finish a VS match (CPU, Arcade, 1P vs 2P or Online) and it shows up here.', W / 2, 380); }
    for (let i = top; i < Math.min(rows.length, top + 7); i++) {
      const R = rows[i], y = this.rowY(i), on = i === this.sel, c1 = chById(R.p1), c2 = chById(R.p2);
      g.fillStyle = on ? 'rgba(60,110,255,0.28)' : 'rgba(255,255,255,0.04)'; g.fillRect(90, y, W - 180, 56);
      if (on) { g.strokeStyle = '#7ab0ff'; g.lineWidth = 2; g.strokeRect(90, y, W - 180, 56); }
      [c1, c2].forEach((ch, s) => { const im = ch && ch.portrait; if (im) { g.save(); g.beginPath(); g.rect(100 + s * 58, y + 4, 52, 48); g.clip(); g.drawImage(im, 100 + s * 58 - 8, y - 2, 68, 68); g.restore(); } g.strokeStyle = s ? P_COL[2] : P_COL[1]; g.lineWidth = 2; g.strokeRect(100 + s * 58, y + 4, 52, 48); });
      g.textAlign = 'left';
      g.font = `italic 900 21px ${FONT_T}`; g.fillStyle = '#fff';
      g.fillText(`${R.fav ? '★ ' : ''}${c1 ? c1.name : R.p1}  vs  ${c2 ? c2.name : R.p2}`, 226, y + 19);
      const d = new Date(R.at), dt = `${d.getDate()}.${d.getMonth() + 1}. ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const s = Math.round(R.n / 60), len = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      const won = R.wins[R.side] >= 2, res = R.cfg.cpu || R.kind === 'net' ? (won ? 'WIN' : 'LOSE') : (R.wins[0] >= 2 ? 'P1 WINS' : 'P2 WINS');
      g.font = `700 14px ${FONT_UI}`; g.fillStyle = '#bcd8ff';
      g.fillText(`${R.mode}${R.names && R.kind === 'net' ? ' · ' + R.names.join(' vs ') : ''} · ${dt} · ${len}`, 226, y + 41);
      g.textAlign = 'right'; g.font = `italic 900 22px ${FONT_T}`;
      strokeText(g, `${R.wins[0]}-${R.wins[1]} ${res}`, 836, y + 28, res === 'LOSE' ? '#ff8aa0' : '#7affc0', OUTLINE, 4);
      this.acts(R).forEach(([a, lab], j) => cloudBtn(g, this.actRect(i, j), lab, t, true));
      { const r = this.actRect(i, 1); g.save(); g.textAlign = 'center'; g.font = `900 26px ${FONT_UI}`; g.fillStyle = R.fav ? '#ffd84a' : 'rgba(255,255,255,0.55)'; g.fillText(R.fav ? '★' : '☆', r.x + r.w / 2 - 4, r.y + r.h / 2 + 1); g.restore(); }
      if (on) { const r = this.actRect(i, this.act); g.strokeStyle = '#ffd84a'; g.lineWidth = 3; g.strokeRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6); }
    }
    if (rows.length > 7) { g.textAlign = 'center'; g.font = `700 14px ${FONT_UI}`; g.fillStyle = '#bcd8ff'; g.fillText(`${top + 1}–${Math.min(rows.length, top + 7)} of ${rows.length}`, W / 2, 616); }
    drawButton(g, cloudBackRect, 'BACK', null, inRect(cloudBackRect), t);
    drawButton(g, this.specRect(), 'FRIENDS MAY WATCH MY ONLINE FIGHTS', null, inRect(this.specRect()), t, Replay.opt.spec ? 'ON' : 'OFF');
    if (this.msg && this.msgT < 240) { g.textAlign = 'center'; g.font = `700 17px ${FONT_UI}`; g.fillStyle = '#ffd84a'; g.fillText(this.msg, W / 2, 148 + 494); }
    drawFooter(g, Settings.mobile ? 'tap a match to watch it' : '↑/↓ match · ←/→ button · ENTER select · F favourite · DEL delete · ESC back');
  }
}
{   // title menu item
  const TP = TitleScene.prototype, up = TP.update, dr = TP.draw;
  TP.rpMenu = function () {
    if (this.rpAdded) return; this.rpAdded = true;
    const m = this.menu, items = m.items;
    if (!items.some(i => i.id === 'replays')) { const at = items.findIndex(i => i.id === 'howto'); items.splice(at < 0 ? items.length - 1 : at, 0, { id: 'replays', label: 'REPLAYS', jp: 'リプレイ' }); }
    const n = items.length; m.h = Math.min(m.h, n > 8 ? 37 : 40); m.gap = n > 8 ? 5 : m.gap; m.y = Math.min(m.y, H - 60 - n * (m.h + m.gap));
    const mu = m.update.bind(m);
    m.update = () => { const it = mu(); if (it && it.id === 'replays') { Sound.play('menuOk'); go(new ReplaysScene()); return null; } return it; };
  };
  TP.update = function () { this.netMenu && this.netMenu(); this.cosMenu && this.cosMenu(); this.rpMenu(); return up.call(this); };
  TP.draw = function (g) { this.netMenu && this.netMenu(); this.cosMenu && this.cosMenu(); this.rpMenu(); return dr.call(this, g); };
}

// ============================ SPECTATING (online) ============================
// Host side: spectators connect to the host's room peer with metadata {spec:1}. They never send
// inputs; the host streams the match recording (header, packed frames every 6 frames, soft-resync
// snapshots) to up to SPEC_MAX of them. Nothing here changes the two players' lockstep.
const SPEC_MAX = 4;
const SpecHost = {
  conns: [], bt: null, sent: 0, lastPing: 0,
  accept(c) {
    c.on('open', () => {
      const no = why => { try { c.send({ t: 'sno', why }); } catch (e) { } setTimeout(() => { try { c.close(); } catch (e) { } }, 400); };
      if (!Replay.load() || !Replay.opt.spec) return no('This player does not allow spectators.');
      if (this.conns.length >= SPEC_MAX) return no('Too many spectators in this room (' + SPEC_MAX + ').');
      this.conns.push(c);
      this.tx(c, { t: 'shi', b: netBuildId() });
      if (this.bt && scene === this.bt && !this.bt.recDone) { this.tx(c, this.header(this.bt)); this.tx(c, { t: 'sf', m: this.m, k: 0, p: rpPack(this.bt.rec.a.slice(0, this.sent), this.bt.rec.b.slice(0, this.sent)) }); this.sendSnaps(c, 0, this.sent); }
    });
    const drop = () => { this.conns = this.conns.filter(x => x !== c); };
    c.on('close', drop); c.on('error', drop);
  },
  tx(c, o) { try { if (c.open) c.send(o); } catch (e) { } },
  all(o) { for (const c of this.conns) this.tx(c, o); },
  header(bt) { const r = bt.rec; return { t: 'ss', m: this.m, R: { kind: 'net', seed: r.seed, env: r.env, cfg: r.cfg, names: r.names, side: 0, mode: 'ONLINE', p1: CHARS[r.cfg.p1].id, p2: CHARS[r.cfg.p2].id } }; },
  sendSnaps(c, k0, k1) { const sn = this.bt.rec.snaps; for (const k in sn) if (+k >= k0 && +k <= k1) this.tx(c, { t: 'sn', m: this.m, k: +k, s: sn[k] }); },
  matchStart(bt) {
    if (bt.rec.kind !== 'net' || Net.role !== 'host') return;
    this.bt = bt; this.sent = 0; this.m = Net.match;
    this.all(this.header(bt));
  },
  flush() {
    const bt = this.bt, r = bt.rec, n = r.a.length; if (n <= this.sent) return;
    const h = {}; for (let k = this.sent + 1; k <= n; k++) if (r.h[k] !== undefined) h[k] = r.h[k];
    this.all({ t: 'sf', m: this.m, k: this.sent, p: rpPack(r.a.slice(this.sent, n), r.b.slice(this.sent, n)), h });
    this.sent = n;
  },
  frame(bt) { if (bt === this.bt && this.conns.length && bt.rec.a.length - this.sent >= 6) this.flush(); },
  snap(bt, k, enc) { if (bt !== this.bt || !this.conns.length) return; this.flush(); this.all({ t: 'sn', m: this.m, k, s: enc }); },
  matchEnd(bt) { if (bt !== this.bt) return; if (this.conns.length) { this.flush(); this.all({ t: 'se', m: this.m }); } this.bt = null; },
  tick() {
    if (!this.conns.length) return;
    if (Net.status !== 'connected' && Net.status !== 'waiting') { this.close(); return; }
    const now = performance.now(); if (now - this.lastPing > 2000) { this.lastPing = now; this.all({ t: 'sp' }); }
  },
  close() { const cs = this.conns; this.conns = []; this.bt = null; for (const c of cs) { this.tx(c, { t: 'sbye' }); setTimeout(() => { try { c.close(); } catch (e) { } }, 300); } },
};
{
  const nt = Net.tick, nc = Net.close, td = Net.teardown;
  Net.tick = function () { const r = nt.apply(this, arguments); SpecHost.tick(); return r; };
  Net.close = function () { SpecHost.close(); return nc.apply(this, arguments); };
  Net.teardown = function () { SpecHost.close(); return td.apply(this, arguments); };
}

// Spectator side: own PeerJS peer, read-only connection to the room, plays the stream as a live replay.
class SpectateScene {
  constructor(o = {}) {
    this.t = 0; this.o = o; this.code = o.code; this.name = o.name || ''; this.back = o.back || (() => new NetLobbyScene());
    this.state = 'connecting'; this.msg = ''; this.R = null; this.queue = []; this.lastRx = performance.now(); this.rb = null;
    Music.play('menu');
    if (!Net.available()) { this.fail('Online play is not available in this browser.'); return; }
    if (Net.status === 'connected') { this.fail('Leave your own online room first.'); return; }
    const p = this.peer = new Peer(Net.opts());
    p.on('open', () => {
      if (this.peer !== p) return;
      const c = this.conn = p.connect(NET_PREFIX + this.code, { reliable: true, serialization: 'json', metadata: { spec: 1 } });
      c.on('data', d => { if (this.conn === c) this.rx(d); });
      c.on('close', () => { if (this.conn === c) this.closed('The match room was closed.'); });
      c.on('error', () => { if (this.conn === c) this.closed('Connection lost.'); });
    });
    p.on('error', e => { if (this.peer !== p) return; if (this.conn && this.conn.open) return; this.fail(e.type === 'peer-unavailable' ? `Room ${this.code} not found (the match may be over).` : netErrText(e)); });
    this.joinT = setTimeout(() => { if (this.state === 'connecting') this.fail('Could not connect to the match. Check the code and your internet.'); }, 20000);
  }
  fail(m) { this.state = 'error'; this.msg = m; this.teardown(); if (scene !== this && (scene === this.rb || scene instanceof ReplayBattle)) go(this); }
  closed(m) {   // keep playing what is buffered, then show the message
    if (this.state === 'error' || this.state === 'done') return;
    this.msg = m; this.state = 'done'; this.teardown();
    if (scene !== this && !(scene === this.rb)) return;
    if (scene !== this && this.rb && (this.rb.ended || this.rb.k >= this.rb.total)) go(this);
  }
  teardown() {
    clearTimeout(this.joinT);
    const c = this.conn, p = this.peer; this.conn = null; this.peer = null;
    setTimeout(() => { try { if (c) c.close(); } catch (e) { } try { if (p) p.destroy(); } catch (e) { } }, 200);
  }
  leave() { this.teardown(); this.state = 'left'; Sound.play('menuBack'); go(this.back()); }
  rx(d) {
    if (!d || typeof d !== 'object') return;
    this.lastRx = performance.now();
    switch (d.t) {
      case 'sno': return this.fail(d.why || 'Spectating is not allowed.');
      case 'shi': if (d.b !== netBuildId()) return this.fail('You need the same game version as the players. Reload the game.'); this.state = 'waiting'; clearTimeout(this.joinT); return;
      case 'sbye': return this.closed('The players left the room.');
      case 'ss': { const R = { ...d.R, m: d.m, A: [], B: [], h: {}, snaps: {}, n: 0 }; this.queue.push(R); return; }
      case 'sf': case 'sn': case 'se': {
        const R = this.queue.find(x => x.m === d.m) || (this.R && this.R.m === d.m ? this.R : null); if (!R) return;
        if (d.t === 'sn') R.snaps[d.k] = d.s;
        if (d.t === 'se') R.over = true;
        if (d.t === 'sf' && d.k === R.A.length) { const u = rpUnpack(d.p); for (let i = 0; i < u.A.length; i++) { R.A.push(u.A[i]); R.B.push(u.B[i]); } if (d.h) Object.assign(R.h, d.h); R.n = R.A.length; }
        return;
      }
    }
  }
  // the live battle asks for a playback rate: stay ~1.5 s behind the players, catch up if far behind
  rate(rb) { const lag = this.R.A.length - rb.k; return lag > 600 ? 4 : lag > 240 ? 2 : lag > 120 ? 1.25 : lag < 30 && !this.R.over ? 0.5 : 1; }
  startNext() {
    if (!this.queue.length) return false;
    const R = this.queue[0];
    if (R.A.length < 90 && !R.over) return false;    // small buffer first
    this.queue.shift(); this.R = R; this.state = 'watching';
    const self = this, title = this.name ? 'WATCHING ' + this.name : 'ROOM ' + this.code;
    this.rb = new ReplayBattle(R, { live: true, title, back: () => { self.teardown(); self.state = 'left'; return self.back(); }, rate: rb => self.rate(rb), onStarve: rb => self.starve(rb), status: rb => self.status(rb) });
    go(this.rb); return true;
  }
  starve(rb) {   // live battle ran out of frames
    if (rb.ended || (this.R.over && rb.k >= this.R.A.length)) { if (!this.endT) this.endT = 0; if (++this.endT > 150 || this.queue.length) { this.endT = 0; if (!this.startNext()) go(this); } return; }
    if (this.state === 'done' || this.state === 'error') go(this);
  }
  status(rb) { const lag = this.R.A.length - rb.k; return this.R.over ? 'match over' : lag < 10 ? 'buffering…' : `${(lag / 60).toFixed(1)} s behind`; }
  update() {
    this.t++;
    if (this.state !== 'error' && this.state !== 'done' && this.state !== 'left' && this.peer && performance.now() - this.lastRx > 12000 && this.state !== 'connecting') this.closed('No answer from the match (connection lost).');
    if (Keys.pressed.has('Escape') || UI.back() || (Mouse.clicked && inRect(cloudBackRect))) return this.leave();
    if (this.state === 'waiting' || this.state === 'watching') this.startNext();
  }
  draw(g) {
    const t = this.t;
    drawMenuBG(g, t, '#ff4a6a');
    drawTitleText(g, 'SPECTATE', W / 2, 110, 84, '#ffd84a', '#ff2a55');
    g.font = `700 22px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffb3c6'; g.fillText(`観戦 · ${this.name ? this.name + ' · ' : ''}room ${this.code}`, W / 2, 176);
    g.font = `700 24px ${FONT_UI}`; g.fillStyle = this.state === 'error' ? '#ff9ab0' : '#fff';
    const dots = '.'.repeat(1 + (t >> 4) % 3);
    const txt = { connecting: 'Connecting to the match' + dots, waiting: 'Connected! Waiting for the next fight to start' + dots, watching: 'Loading' + dots }[this.state] || this.msg;
    g.fillText(txt, W / 2, 330);
    if (this.state === 'waiting') { g.font = `600 17px ${FONT_UI}`; g.fillStyle = '#e8dcff'; g.fillText('The players are picking their fighters. You only watch — they can’t see or hear you.', W / 2, 372); }
    drawButton(g, cloudBackRect, 'BACK', null, inRect(cloudBackRect), t);
    drawFooter(g, 'ESC: back');
  }
}

// ---------------- friends: publish my room, WATCH button for friends in a fight ----------------
// Needs cloud/supabase_spectate.sql (sb_set_room, sb_friend_rooms). Without it the buttons just don't show;
// WATCH A MATCH with the room code (online lobby) always works.
{
  const fs = Friends.status;
  Friends.status = function () { return scene instanceof ReplayBattle || scene instanceof SpectateScene ? 'menu' : fs.call(this); };
  Friends.rooms = {}; Friends.pubRoom = '';
  const ft = Friends.tick;
  Friends.tick = function () {
    const r = ft.apply(this, arguments);
    if (Cloud.on && !this.noRoomFn && !document.hidden) {
      const want = Net.status === 'connected' && Replay.load() && Replay.opt.spec && Net.code ? Net.code : '';
      const now = Date.now();
      if (want !== this.pubRoom || (want && now - (this.pubAt || 0) > 10 * 60000)) {
        if (!this.roomBusy) {
          this.roomBusy = true; const was = want;
          Cloud.rpc('sb_set_room', { p_token: Cloud.tok, p_room: want }).then(() => { this.pubRoom = was; this.pubAt = Date.now(); })
            .catch(e => { if (String(e && e.message) === 'MISSING_FN') this.noRoomFn = true; this.pubRoom = was; this.pubAt = Date.now(); })
            .finally(() => { this.roomBusy = false; });
        }
      }
    }
    return r;
  };
  const od = Friends.onData;
  Friends.onData = function () {
    const r = od.apply(this, arguments);
    const busy = this.d.friends.filter(f => f.online && f.status === 'match');
    if (!busy.length) this.rooms = {};
    else if (!this.noRoomFn && !this.roomsBusy) {
      this.roomsBusy = true;
      Cloud.rpc('sb_friend_rooms', { p_token: Cloud.tok }).then(d => { const m = {}; for (const x of (Array.isArray(d) ? d : [])) if (x && /^\d{6}$/.test(x.room)) m[x.name] = x.room; this.rooms = m; })
        .catch(e => { if (String(e && e.message) === 'MISSING_FN') this.noRoomFn = true; })
        .finally(() => { this.roomsBusy = false; });
    }
    return r;
  };
  const FP = FriendsScene.prototype, rows = FP.rows, run = FP.run;
  FP.rows = function () {
    const out = rows.call(this);
    for (const r of out) if (r.k === 'fr' && r.f.online && r.f.status === 'match' && Friends.rooms[r.f.name] && Net.status !== 'connected') { r.acts = [['watch', 'WATCH'], ...r.acts]; }
    return out;
  };
  FP.run = function (row, a) {
    if (a === 'watch' && row) { const code = Friends.rooms[row.name]; if (code) { Sound.play('menuOk'); const back = this.back; go(new SpectateScene({ code, name: row.name, back: () => new FriendsScene({ back }) })); } return; }
    return run.call(this, row, a);
  };
}
