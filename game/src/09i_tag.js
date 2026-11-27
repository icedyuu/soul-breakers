// ============================ 2V2 TAG MODE ============================
// Two fighters per side, one on the field. TAG (P1 E / P2 U, controller stick click, touch TAG)
// swaps in the partner, who jumps in with an air heavy (tag-in attack). The benched fighter
// slowly recovers part of the damage taken. A KO'd point fighter is replaced by the partner;
// the round ends when a whole team is down. Local VERSUS, VS CPU (single match) and ONLINE (host picks the mode).
// Battle cfg: cfg.tag = { t: [[p1a, p1b], [p2a, p2b]], v: [[v, v], [v, v]] } (CHARS indices / variants).
// The fighter on the field is a fresh Fighter every time it tags in, so forms, buffs, summons and
// cooldowns of the fighter who left are dropped; their projectiles and marks on the opponent are cleared.
const TAG = { CD: 180, REGEN: 0.0007, RECK: 0.5, KOWAIT: 50 };
let TAG_VS = false;   // title menu: FIGHT 1P VS 2P  ◀ 1 VS 1 / 2 VS 2 TAG ▶

function isTagBattle(bt) { return !!(bt && bt.team); }
function tagReady(bt, i) {
  const T = bt && bt.team && bt.team[i]; if (!T) return false;
  const F = i ? bt.p2 : bt.p1, P = T.s[1 - T.cur];
  return T.cd <= 0 && !T.pending && !P.dead && F.actionable() && !F.ko && bt.phase === 'fight';
}
// marks / debuffs a fighter put on the opponent; cleared when that fighter leaves the field
function tagClearMarks(O) {
  if (!O) return;
  const zero = ['bleedN', 'bleedT', 'markT', 'cmdT', 'graspT', 'chainT', 'infFreezeT', 'hlwMarkT', 'sealT', 'kanPactT', 'kanPactN', 'tokStopT', 'tokSlowT', 'hachiMarkT', 'kuFearT', 'slowT', 'hzCough', 'hzCoughCd', 'hzBlindT'];
  for (const k of zero) if (O[k]) O[k] = 0;
  for (const k of ['bleedBy', 'markBy', 'hlwMarkBy', 'sealBy', 'kanPactBy', 'hachiBy', 'sealK', 'sealK2', 'chainPull']) if (O[k]) O[k] = null;
  if (O.hachiHid) { O.hachiHid = false; O.hidden = false; }
  if (O.state !== 'grabbed' && O.state !== 'cine') O.forcePose = null;
}
function tagTeamRatio(bt, i) {
  const T = bt.team[i], F = i ? bt.p2 : bt.p1; let hp = 0, max = 0;
  T.s.forEach((s, k) => { const m = CHARS[T.ids[k]].health; max += m; hp += k === T.cur ? Math.max(0, F.hp) / F.maxHp * m : s.dead ? 0 : (s.hp ?? m); });
  return hp / max;
}

// ---------------- battle ----------------
{
  const BP = Battle.prototype;
  const nr = BP.newRound;
  BP.newRound = function (first) {
    const c = this.cfg, on = !!c.tag && c.mode === 'versus';
    if (on) { c.p1 = c.tag.t[0][0]; c.p2 = c.tag.t[1][0]; c.v1 = c.tag.v[0][0]; c.v2 = c.tag.v[1][0]; }
    const r = nr.call(this, first);
    this.team = on ? [0, 1].map(i => ({ ids: c.tag.t[i], vs: c.tag.v[i], cur: 0, cd: 60, pending: null, s: [{ hp: null, rec: 0, dead: false, burst: true }, { hp: null, rec: 0, dead: false, burst: true }] })) : null;
    FX.calloutDy = on ? 40 : 0;   // move-name callouts sit under the partner panel
    if (on) { const [v1, v2] = cfgVariants(c); this.p1.variant = v1; this.p2.variant = v2; }
    return r;
  };
  BP.tagSwap = function (i, kind) {
    const T = this.team[i], out = i ? this.p2 : this.p1, O = out.opp, n = 1 - T.cur, sOut = T.s[T.cur], sIn = T.s[n];
    sOut.hp = Math.max(0, out.hp); sOut.burst = out.burstReady; sOut.dead = kind === 'ko';
    sOut.rec = sOut.dead ? 0 : Math.min(out.maxHp, out.hp + (out.maxHp - out.hp) * TAG.RECK);
    for (const p of this.projs) if (p.owner === out) p.dead = true;
    this.projs = this.projs.filter(p => !p.dead);
    tagClearMarks(O);
    if (this.dialog && this.dialog.F === out) this.dialog = null;
    if (O.comboHits > 0 && O.state !== 'hit' && O.state !== 'wall') O.resetCombo();
    FX.dust(out.x, out.y - 60, 16, 'rgba(230,220,255,0.75)'); FX.ring(out.x, out.y - 90, out.colors.accent, 10, 120, 14, 5);
    // the partner enters (fresh fighter: no leftover forms / buffs / summons)
    const ch = CHARS[T.ids[n]];
    let x = kind === 'ko' ? out.x : out.x - out.facing * 70;
    if (Math.abs(x - O.x) < 170) x = O.x + (x < O.x || (x === O.x && out.x < O.x) ? -170 : 170);
    x = clamp(x, 70, STAGE_W - 70);
    const fac = O.x >= x ? 1 : -1, F = new Fighter(ch, i + 1, x, fac, this.inputs[i]);
    F.variant = T.vs[n]; if (this.mstats[i]) F.stats = this.mstats[i];
    F.meter = out.meter; F.burstReady = sIn.burst;
    if (sIn.hp != null) F.hp = F.redHp = sIn.hp;
    F.opp = O; O.opp = F;
    if (i) this.p2 = F; else this.p1 = F;
    T.cur = n; T.cd = TAG.CD; T.pending = null;
    this.inputs[i].use('tag');
    F.y = GROUND - (kind === 'ko' ? 300 : 230); F.onGround = false; F.setState('jump'); F.airUsed = {}; F.jumpsLeft = 0; F.flipT = 14; F.afterimage = 14;
    if (kind === 'ko') { F.vx = 0; F.vy = 0; F.invuln = 50; }
    else { F.vy = -2; F.vx = clamp((O.x - x) / 24, -8, 8); F.invuln = 10; F.tagAtk = 3; }
    FX.wtext(F.x, GROUND - 330, kind === 'ko' ? 'TAG IN!' : 'TAG!', { size: 40, color: '#ffffff', stroke: F.colors.accent, life: 40 });
    FX.ring(F.x, F.y - 60, F.colors.accent, 10, 160, 16, 6); Sound.play('whoosh'); Sound.play('teleport');
    if (!F.ch.mute && F.ch.intro) Sound.speak(F.ch.name, F.ch.voicePitch ?? 0.6, F.ch.voiceRate ?? 1.1);
  };
  BP.tryTag = function (i) {
    if (this.cine || this.freeze || this.hitstop > 0 || !tagReady(this, i)) return false;
    const F = i ? this.p2 : this.p1, O = F.opp;
    if (O.state === 'grabbed' || O.state === 'cine') return false;
    this.tagSwap(i, 'tag'); return true;
  };
  const ss = BP.stepSim;
  BP.stepSim = function () {
    if (!this.team) return ss.call(this);
    const fight = this.phase === 'fight';
    // CPU partner management: tags out a hurt fighter now and then
    if (this.cpu && fight && !this.freeze && !this.cine) {
      const T = this.team[1], F = this.p2, P = T.s[1 - T.cur], pr = P.dead ? 0 : (P.hp ?? F.maxHp) / CHARS[T.ids[1 - T.cur]].health, r = F.hp / F.maxHp;
      if (tagReady(this, 1) && ((r < 0.4 && pr > r + 0.2 && Math.random() < 0.02) || Math.random() < 0.0012)) this.tryTag(1);
    }
    ss.call(this);
    for (let i = 0; i < 2; i++) {
      const T = this.team[i], F = i ? this.p2 : this.p1, inp = this.inputs[i];
      if (inp.p('tag')) { if (this.tryTag(i)) inp.use('tag'); }
      if (this.freeze || this.hitstop > 0) continue;
      if (fight && T.cd > 0) T.cd--;
      // tag-in attack: an air heavy on the way down
      if (F.tagAtk > 0 && --F.tagAtk === 0 && F.state === 'jump' && F.canUse('jH', true, 0)) F.startMove('jH');
      // bench recovery
      const b = T.s[1 - T.cur], mx = CHARS[T.ids[1 - T.cur]].health;
      if (fight && !b.dead && b.hp != null && b.hp < b.rec) b.hp = Math.min(b.rec, b.hp + mx * TAG.REGEN);
      // KO'd point fighter: partner comes in once the body is down
      if (T.pending && fight && !this.cine) { T.pending.t++; if (T.pending.t >= TAG.KOWAIT && (F.onGround || T.pending.t > 150) && F.state !== 'grabbed') this.tagSwap(i, 'ko'); }
    }
  };
  const ck = BP.checkKO;
  BP.checkKO = function () {
    if (!this.team) return ck.call(this);
    if (this.cine) return;
    const P = [this.p1, this.p2], down = [false, false];
    for (let i = 0; i < 2; i++) {
      const F = P[i], T = this.team[i];
      if (F.hp > 0 || T.pending) continue;
      if (T.s[1 - T.cur].dead) { down[i] = true; continue; }
      if (F.state === 'grabbed') continue;
      T.pending = { t: 0 }; F.ko = true; F.move = null; F.hitActive = false;
      if (F.onGround || F.state !== 'hit') { F.setState('hit'); F.onGround = false; F.vy = -10; F.vx = (F.x < F.opp.x ? -1 : 1) * 5; F.y = Math.min(F.y, GROUND - 1); }
      F.kdOnLand = true; F.hitstun = 9999;
      for (const p of this.projs) if (p.owner === F) p.dead = true;
      this.slow = 45; FX.shakeIt(12); Sound.play('ko');
      FX.announce('K.O.', { sub: CHARS[T.ids[1 - T.cur]].name + ' — TAG IN!', size: 120, life: 70, color: '#ff3355', glow: '#ff0033' });
    }
    if (!down[0] && !down[1]) return;
    if (P[0].state === 'grabbed' || P[1].state === 'grabbed') return;
    this.doKO(down[0] && down[1] ? null : down[0] ? this.p2 : this.p1);
  };
  const to = BP.timeOver;
  BP.timeOver = function () {
    if (!this.team) return to.call(this);
    this.phase = 'ko'; this.pf = 0;
    const r1 = tagTeamRatio(this, 0), r2 = tagTeamRatio(this, 1);
    this.winner = Math.abs(r1 - r2) < 0.001 ? null : r1 > r2 ? this.p1 : this.p2;
    FX.announce('TIME OVER', { sub: '時間切れ', size: 120, life: 100, color: '#ffd84a', glow: '#ff6a00' }); Sound.play('gong'); Sound.announce('time', 'Time over', 0.5, 0.9);
    for (const F of [this.p1, this.p2]) { F.move = null; F.hitActive = false; if (F !== this.winner) F.setState('defeat'); }
    this.timeOut = true;
  };
}

// ---------------- HUD: partner panel under each health bar ----------------
function drawTagHUD(g, bt) {
  for (let i = 0; i < 2; i++) {
    const T = bt.team[i], F = i ? bt.p2 : bt.p1, k = 1 - T.cur, s = T.s[k], ch = CHARS[T.ids[k]], mx = ch.health;
    const hp = s.dead ? 0 : (s.hp ?? mx), left = i === 0, w = 250, x = left ? 34 : W - 34 - w, y = 118;
    g.save(); g.textBaseline = 'middle';
    g.fillStyle = 'rgba(8,4,18,0.72)'; g.fillRect(x, y, w, 34); g.strokeStyle = s.dead ? 'rgba(255,255,255,0.15)' : P_COL[i + 1]; g.lineWidth = 1.5; g.strokeRect(x + 0.5, y + 0.5, w - 1, 33);
    const px = left ? x + 3 : x + w - 31;
    g.save(); g.beginPath(); g.rect(px, y + 3, 28, 28); g.clip();
    const pt = chArt(ch, T.vs[k], 'portrait'); g.globalAlpha = s.dead ? 0.3 : 1;
    if (left) g.drawImage(pt, px - 6, y - 2, 40, 40); else { g.translate(px + 28, y); g.scale(-1, 1); g.drawImage(pt, -6, -2, 40, 40); }
    g.restore();
    const tx = left ? x + 37 : x + w - 37, bw = 140, bx = left ? tx : tx - bw;
    g.textAlign = left ? 'left' : 'right'; g.font = `italic 900 13px ${FONT_T}`;
    strokeText(g, s.dead ? ch.name + '  K.O.' : ch.name, tx, y + 10, s.dead ? '#888' : '#ffffff', OUTLINE, 3);
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(bx, y + 21, bw, 7);
    if (!s.dead) {
      const rk = Math.min(1, (s.rec || hp) / mx), hk = hp / mx;
      g.fillStyle = 'rgba(90,170,255,0.55)'; if (left) g.fillRect(bx, y + 21, bw * rk, 7); else g.fillRect(bx + bw * (1 - rk), y + 21, bw * rk, 7);
      g.fillStyle = hk < 0.3 ? '#ff5a4a' : '#ffd23a'; if (left) g.fillRect(bx, y + 21, bw * hk, 7); else g.fillRect(bx + bw * (1 - hk), y + 21, bw * hk, 7);
    }
    // TAG ready indicator
    const rdy = tagReady(bt, i), ix = left ? x + w - 34 : x + 34;
    g.textAlign = 'center'; g.font = `900 11px ${FONT_UI}`;
    if (s.dead) strokeText(g, '—', ix, y + 17, '#777', OUTLINE, 3);
    else {
      const key = keyLabel(Settings.binds[bt.online ? 1 : i + 1].tag);
      g.globalAlpha = rdy ? 0.75 + 0.25 * Math.sin(bt.pf * 0.2) : 0.5;
      strokeText(g, 'TAG', ix, y + 11, rdy ? '#7dfcff' : '#9a9ab0', OUTLINE, 3);
      g.font = `800 10px ${FONT_UI}`; strokeText(g, rdy ? key : Math.ceil(Math.max(0, T.cd) / 60) + 's', ix, y + 25, rdy ? '#ffffff' : '#9a9ab0', OUTLINE, 3);
    }
    g.restore();
  }
}
{
  const dh = drawHUD;
  drawHUD = function (g, bt) { dh(g, bt); if (isTagBattle(bt) && bt.phase !== 'intro') drawTagHUD(g, bt); };
}

// ---------------- controllers: stick clicks = TAG ----------------
{
  PAD_ACTS.push('tag'); PAD_ACT_LABELS.tag = 'Tag Partner (2v2)';
  PAD_DEFAULT[10] = 'tag'; PAD_DEFAULT[11] = 'tag';
  const m = Settings.padMap;
  if (!Object.values(m).includes('tag')) for (const b of [10, 11]) if (!m[b]) m[b] = 'tag';
}

// ---------------- menus: title choice + VS CPU entry ----------------
{
  const TP = TitleScene.prototype, up = TP.update, dr = TP.draw;
  TP.tagMenu = function () {
    const it = this.menu.items.find(i => i.id === 'fight'); if (!it) return null;
    it.type = 'choice'; it.value = TAG_VS ? '◀ 2 VS 2 TAG ▶' : '◀ 1 VS 1 ▶';
    return it;
  };
  TP.update = function () {
    const it = this.tagMenu();
    if (it && this.menu.items[this.menu.sel] === it) {
      const r = this.menu.rect(this.menu.items.indexOf(it)), onVal = Mouse.clicked && inRect(r) && Mouse.x > r.x + r.w * 0.55;
      if (UI.left() || UI.right() || onVal) { TAG_VS = !TAG_VS; Sound.play('menuMove'); this.tagMenu(); Mouse.clicked = false; return; }
    }
    const prev = scene, res = up.call(this);
    if (TAG_VS && scene !== prev && scene instanceof CharSelectScene && scene.mode === 'versus' && !scene.cpu && !(typeof NetSelectScene !== 'undefined' && scene instanceof NetSelectScene)) scene.tag = true;
    return res;
  };
  TP.draw = function (g) { this.tagMenu(); return dr.call(this, g); };

  const CP = CpuSetupScene.prototype, cu = CP.update;
  CP.update = function () {
    const items = this.menu.items;
    if (!items.some(i => i.id === 'tag')) items.splice(3, 0, { id: 'tag', label: '2 VS 2 TAG MATCH', jp: 'タッグ' });
    const it = items[this.menu.sel];
    if (it && it.id === 'tag' && (UI.ok() || (Mouse.clicked && inRect(this.menu.rect(this.menu.sel))))) {
      Sound.play('menuOk'); const s = new CharSelectScene('versus', { level: Settings.cpuLevel }); s.tag = true; go(s); return;
    }
    return cu.call(this);
  };
}

// tag flag follows into CHARACTER SELECT from a tag battle / results / stage select
{
  const _go = go;
  go = function (s) {
    if (s instanceof CharSelectScene && !(typeof NetSelectScene !== 'undefined' && s instanceof NetSelectScene) && scene) {
      const c = scene.cfg || (scene.bt && scene.bt.cfg);
      if (c && c.tag) s.tag = true;
    }
    return _go(s);
  };
}

// ---------------- character select: each side picks two ----------------
{
  const P = CharSelectScene.prototype, cf = P.confirm, up = P.update, dr = P.draw;
  P.tagTeam = function () { return this.teamSel || (this.teamSel = [[], []]); };
  P.confirm = function (s) {
    if (!this.tag) return cf.call(this, s);
    const tm = this.tagTeam()[s];
    if (tm.length === 1 && tm[0].i === this.cur[s]) { Sound.play('menuBack'); this.dupT = 50; return; }   // same fighter twice
    const was = this.ready[s];
    cf.call(this, s);
    if (!this.ready[s] || was) return;
    const v = (this.vs && this.vs[s]) | 0;
    if (tm.length === 0) { tm.push({ i: this.cur[s], v }); this.ready[s] = false; }
    else tm[1] = { i: this.cur[s], v };
  };
  P.update = function () {
    if (!this.tag) return up.call(this);
    const tm = this.tagTeam();
    if (this.dupT) this.dupT--;
    for (let s = 0; s < 2; s++) if (!this.ready[s] && tm[s].length > 1 && !(s === 1 && this instanceof NetSelectScene)) tm[s].length = 1;   // online: slot 1 = the rival's team (from 'tsel')
    if (!this.ask) {
      if (this.single) { const s = this.activeSlot(); if (s !== null && !this.ready[s] && tm[s].length === 1 && UI.back()) { tm[s].length = 0; Sound.play('menuBack'); return; } }
      else for (const pid of [1, 2]) if (!this.ready[pid - 1] && tm[pid - 1].length === 1 && UI.pBack(pid)) { tm[pid - 1].length = 0; Sound.play('menuBack'); return; }
    }
    const prev = scene, res = up.call(this);
    if (scene !== prev && scene instanceof StageSelectScene && tm[0].length === 2 && tm[1].length === 2) {
      const c = scene.cfg, t = [tm[0].map(o => o.i), tm[1].map(o => o.i)], v = [tm[0].map(o => o.v), tm[1].map(o => o.v)];
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) if (t[0][a] === t[1][b] && v[0][a] === v[1][b]) v[1][b] = v[1][b] + 1 >= VAR_N - 1 ? 0 : v[1][b] + 1;   // mirror: other colour
      c.tag = { t, v }; c.p1 = t[0][0]; c.p2 = t[1][0]; c.v1 = v[0][0]; c.v2 = v[1][0];
    }
    return res;
  };
  P.draw = function (g) {
    dr.call(this, g);
    if (!this.tag) return;
    const tm = this.tagTeam(), t = this.t;
    g.save(); g.textBaseline = 'middle'; g.textAlign = 'center';
    const rr = this.randRect(), y = rr.y + rr.h + 14;
    g.font = `italic 900 18px ${FONT_T}`; strokeText(g, '2 VS 2 TAG  ·  PICK 2 FIGHTERS', W / 2, y + 4, '#7dfcff', OUTLINE, 4);
    for (let s = 0; s < 2; s++) {
      const x0 = s ? W / 2 + 12 : W / 2 - 12 - 150, yy = y + 20;
      for (let k = 0; k < 2; k++) {
        const o = tm[s][k] || (k === tm[s].length && !this.ready[s] && !(this.single && s === 1 && !this.ready[0]) ? { i: this.cur[s], cur: 1 } : null);
        const r = { x: x0 + k * 78, y: yy, w: 72, h: 72 };
        g.fillStyle = 'rgba(8,4,20,0.75)'; g.fillRect(r.x, r.y, r.w, r.h);
        if (o) {
          const ch = CHARS[o.i], pt = ch.portrait, kk = pt.width / 300, sw = 150 * kk;
          g.save(); g.beginPath(); g.rect(r.x, r.y, r.w, r.h); g.clip(); g.globalAlpha = o.cur ? 0.45 + 0.15 * Math.sin(t * 0.25) : 1;
          g.drawImage(pt, 126 * kk - sw / 2, 120 * kk - sw * 0.42, sw, sw, r.x, r.y, r.w, r.h); g.restore();
        }
        g.strokeStyle = s ? P_COL[2] : P_COL[1]; g.lineWidth = o && !o.cur ? 3 : 1.5; g.strokeRect(r.x, r.y, r.w, r.h);
        g.font = `900 11px ${FONT_UI}`; strokeText(g, k ? 'PARTNER' : 'POINT', r.x + r.w / 2, r.y + r.h - 8, '#ffffff', OUTLINE, 3);
      }
    }
    if (this.dupT) { g.font = `900 14px ${FONT_UI}`; strokeText(g, 'ALREADY IN YOUR TEAM', W / 2, y + 108, '#ff9ab0', OUTLINE, 3); }
    g.restore();
  };
}

// ---------------- VS screen: partner names ----------------
{
  const VP = VSScene.prototype, dr = VP.draw;
  VP.draw = function (g) {
    dr.call(this, g);
    const c = this.cfg.tag; if (!c) return;
    const k = clamp((this.t - 30) / 15, 0, 1); if (!k) return;
    g.save(); g.globalAlpha = k; g.textBaseline = 'middle';
    g.font = `italic 900 30px ${FONT_T}`;
    g.textAlign = 'left'; strokeText(g, '& ' + CHARS[c.t[0][1]].name, 40, 640, '#ffffff', CHARS[c.t[0][1]].colors.accent, 6);
    g.textAlign = 'right'; strokeText(g, '& ' + CHARS[c.t[1][1]].name, W - 40, 640, '#ffffff', CHARS[c.t[1][1]].colors.accent, 6);
    g.textAlign = 'center'; g.font = `italic 900 22px ${FONT_T}`; strokeText(g, '2 VS 2 TAG', W / 2, 640, '#7dfcff', OUTLINE, 5);
    g.restore();
  };
}

// touch pad: which battle the TAG button belongs to (online the pad gets a stand-in object)
function touchTagBt(bt) { return bt && bt.team ? bt : TouchPad.bt && TouchPad.bt.team ? TouchPad.bt : null; }
function touchTagReady(bt) { const b = touchTagBt(bt); return !!b && tagReady(b, b.lp || 0); }

// ---------------- ONLINE: mode choice in the room's character select, team sync, lockstep state ----------------
// The host picks 1 VS 1 / 2 VS 2 TAG (button at the top or the TAG key). Teams travel as 'tsel' messages,
// the host puts cfg.tag into the 'start' message. The TAG button is part of the per-frame input int (09b).
function netTagPossible() { return Net.remoteTag !== false; }
{
  const NP = NetSelectScene.prototype, nu = NP.update, no = NP.onNet, nd = NP.draw;
  NP.tagBtn = function () { return { x: W / 2 - 170, y: 104, w: 340, h: 34 }; };
  NP.setTagMode = function (on, send) {
    on = !!on && netTagPossible();
    const changed = !!this.tag !== on; Net.tagMode = on; this.tag = on;
    if (changed) { this.teamSel = [[], []]; this.ready[0] = false; this.ready[1] = false; this.tselSent = null; Sound.play('menuMove'); }
    if (send) Net.send({ t: 'tmode', on });
  };
  NP.onNet = function (d) {
    if (d.t === 'tmode' && Net.role === 'guest') { this.setTagMode(d.on, false); return; }
    if (d.t === 'tsel') { const tm = this.tagTeam(); tm[1] = (Array.isArray(d.team) ? d.team : []).slice(0, 2).map(o => ({ i: clamp(o.i | 0, 0, CHARS.length - 1), v: clamp(o.v | 0, 0, VAR_N - 1) })); return; }
    return no.call(this, d);
  };
  NP.update = function () {
    if (this.tag === undefined) {
      this.tag = !!Net.tagMode && netTagPossible();
      if (Net.role === 'host') Net.send({ t: 'tmode', on: this.tag });
      if (this.tag && Array.isArray(Net.remoteTeam)) this.onNet({ t: 'tsel', team: Net.remoteTeam });
    }
    if (Net.role === 'host' && netTagPossible()) {
      const kb = [Settings.binds[1].tag, Settings.binds[2].tag];
      if (kb.some(k => Keys.pressed.has(k)) || (Mouse.clicked && inRect(this.tagBtn()))) { Mouse.clicked = false; this.setTagMode(!this.tag, true); }
    }
    const tm = this.tagTeam();
    if (this.tag && Net.role === 'host' && !(tm[0].length === 2 && tm[1].length === 2)) this.startT = 0;   // wait for both teams
    const r = nu.call(this);
    if (scene === this && this.tag) {
      const key = JSON.stringify(tm[0]);
      if (key !== this.tselSent) { this.tselSent = key; Net.send({ t: 'tsel', team: tm[0] }); }
    }
    return r;
  };
  NP.draw = function (g) {
    nd.call(this, g);
    if (!netTagPossible()) return;
    const r = this.tagBtn(), host = Net.role === 'host';
    drawButton(g, r, this.tag ? '2 VS 2 TAG' : '1 VS 1', null, host && inRect(r), this.t, host ? '⇄ ' + keyLabel(Settings.binds[1].tag) : 'HOST');
  };
  // messages that can arrive before the room's select screen exists
  const rx = Net.rx.bind(Net);
  Net.rx = function (d) {
    if (d && d.t === 'tmode') Net.tagMode = !!d.on;
    if (d && d.t === 'tsel') Net.remoteTeam = d.team;
    if (d && d.t === 'start') Net.remoteTeam = null;
    return rx(d);
  };
  // host: the teams go into the match cfg
  const ns = Net.send.bind(Net);
  Net.send = function (o) {
    const sc = scene;
    if (o && o.t === 'start' && o.cfg && sc instanceof NetSelectScene) {
      const tm = sc.tagTeam();
      if (sc.tag && tm[0].length === 2 && tm[1].length === 2) {
        const t = [tm[0].map(x => x.i), tm[1].map(x => x.i)], v = [tm[0].map(x => x.v), tm[1].map(x => x.v)];
        for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) if (t[0][a] === t[1][b] && v[0][a] === v[1][b]) v[1][b] = v[1][b] + 1 >= VAR_N - 1 ? 0 : v[1][b] + 1;
        o.cfg.tag = { t, v }; o.cfg.p1 = t[0][0]; o.cfg.p2 = t[1][0]; o.cfg.v1 = v[0][0]; o.cfg.v2 = v[1][0];
      } else delete o.cfg.tag;
      Net.remoteTeam = null;
    }
    return ns(o);
  };
  // lockstep: team state joins the hash and the soft-resync snapshot
  const BP = NetBattle.prototype, sh = BP.stateHash, sn = BP.snapshot, rs = BP.restoreSnap;
  BP.stateHash = function () {
    const h = sh.call(this); if (!this.team) return h;
    return netHashStr(h + '|' + this.team.map(T => [T.cur, T.cd, T.pending ? T.pending.t : -1, T.s.map(x => (x.dead ? 'd' : '') + Math.round((x.hp ?? -1) * 10)).join('/')].join(':')).join('|') + '|' + this.p1.ch.id + this.p2.ch.id);
  };
  BP.snapshot = function () { const s = sn.call(this); if (this.team) s.tm = JSON.parse(JSON.stringify(this.team)); return s; };
  BP.restoreSnap = function (s) {
    if (s && s.tm && this.team) {
      this.team = s.tm;
      [0, 1].forEach(i => {
        const F = i ? this.p2 : this.p1, id = s.f[i].ch;
        if (F.ch.id === id) return;   // the other side tagged in the meantime: rebuild the right fighter, then adopt its state
        const T = this.team[i], ch = CHARS.find(c => c.id === id) || F.ch, N = new Fighter(ch, i + 1, F.x, F.facing, this.inputs[i]);
        N.variant = T.vs[T.cur]; if (this.mstats[i]) N.stats = this.mstats[i];
        N.opp = F.opp; F.opp.opp = N; if (i) this.p2 = N; else this.p1 = N;
        for (const p of this.projs) if (p.owner === F) p.dead = true;
        this.projs = this.projs.filter(p => !p.dead);
      });
    }
    return rs.call(this, s);
  };
}
