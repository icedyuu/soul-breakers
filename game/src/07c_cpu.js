// =============================== CPU OPPONENT ===============================
// The bot plays P2 through the normal input path: every frame it writes directions and button presses into
// PlayerInput.virtual, so motions, buffers, cooldowns, meter and cancels work exactly as for a human.
// Fairness: it sees the opponent (and projectiles) only through a delayed snapshot (reaction time per level)
// and never reads the human's inputs. It may read its own fighter state (cooldowns, meter), like a player reads the HUD.
const CPU_LEVELS = [
  { name: 'EASY', jp: '易', color: '#7aff9a', tech: 0.08, throw: 0.05, react: 26, think: 22, block: 0.22, lowRead: 0.2, aggro: 0.35, depth: 1, special: 0.3, ult: 0.35, anti: 0.1, burst: 0, idle: 0.3, jumpIn: 0.12, mix: 0.1, counter: 0 },
  { name: 'NORMAL', jp: '普通', color: '#ffd84a', tech: 0.3, throw: 0.18, react: 16, think: 13, block: 0.58, lowRead: 0.55, aggro: 0.55, depth: 2, special: 0.55, ult: 0.7, anti: 0.4, burst: 0.25, idle: 0.12, jumpIn: 0.1, mix: 0.3, counter: 0.08 },
  { name: 'HARD', jp: '難', color: '#ff4a5a', tech: 0.5, throw: 0.3, react: 10, think: 7, block: 0.86, lowRead: 0.85, aggro: 0.7, depth: 4, special: 0.75, ult: 0.95, anti: 0.75, burst: 0.55, idle: 0.03, jumpIn: 0.08, mix: 0.55, counter: 0.2 },
];
const CPU_SPECIALS = ['sp1', 'sp1f', 'counter', 'sp2', 'sp2f', 'sp2d'];

// rough per-move profile from frame data (cached on the move object)
function cpuProfile(m) {
  if (m.__ai) return m.__ai;
  const src = (m.tick ? String(m.tick) : '') + (m.onStart ? String(m.onStart) : '');
  let reach = m.hb ? m.hb.x + m.hb.w : 0;
  const dashes = m.vx || /\bvx\s*=/.test(src);
  if (dashes) reach += Math.min(220, Math.abs(m.vx || 9) * Math.max(6, (m.act || 6) + 4));
  const shoots = !!m.spawn || /BT\.spawn/.test(src);
  if (shoots) reach = Math.max(reach, 560);
  const grab = !!m.grab || m.type === 'unblock';
  if (grab) reach = Math.max(reach, 105);
  const hits = (m.dmg || 0) > 0 || shoots || grab;
  const kind = m.counter ? 'counter' : m.virtual ? 'virtual' : !hits ? 'buff' : shoots ? 'proj' : grab ? 'grab' : 'melee';
  const anti = !!(m.invuln && m.launch && m.hb && m.hb.y < -180);
  return (m.__ai = { reach: Math.max(reach, 40), kind, anti, st: m.st || 0, low: m.type === 'low', over: m.type === 'overhead' });
}

class CpuBot {
  constructor(bt, level, side = 1) {   // side 1 = P2 (side 0 is used by the bot-vs-bot tests)
    this.bt = bt; this.side = side; this.level = clamp(level | 0, 0, CPU_LEVELS.length - 1); this.L = CPU_LEVELS[this.level];
    this.inp = bt.inputs[side];
    this.v = this.inp.virtual = { l: false, r: false, u: false, d: false, btn: { held: {}, press: new Set() }, cpu: true };
    this.obs = []; this.q = []; this.f = 0; this.hold = { d: 'n', t: 0, block: false }; this.lastDown = -99;
    this.threatId = null; this.threatBlock = false; this.cancelId = null; this.steps = 0; this.burstRoll = null; this.wait = 0;
  }
  get me() { return this.side ? this.bt.p2 : this.bt.p1; }
  roll(p) { return Math.random() < p; }
  // --- perception (delayed snapshot of the other fighter and of projectiles) ---
  observe() {
    const o = this.me.opp;
    this.obs.push({
      x: o.x, y: o.y, vx: o.vx, state: o.state, onGround: o.onGround, move: o.move, mf: o.mf, id: o.state === 'attack' ? o.T - o.mf : null,
      crouch: o.state === 'crouch' || (o.state === 'attack' && o.move && o.move.crouch) || (o.state === 'block' && o.crouching),
      guard: o.state === 'block' || !!o.guard, hp: o.hp, s: o.s,
      projs: this.bt.projs.filter(p => p.owner !== this.me && p.active()).map(p => ({ x: p.x, y: p.y, vx: p.vx, w: p.w || 40, low: p.type === 'low', id: p })),
    });
    if (this.obs.length > 40) this.obs.shift();
  }
  seen() { const o = this.me.opp, ex = o && o.ch.cpuBlind ? o.ch.cpuBlind(o, this.me) : 0; return this.obs[Math.max(0, this.obs.length - 1 - this.L.react - ex)]; }   // cpuBlind: extra reaction frames (Haze's smoke)
  // --- output ---
  apply(fr) {
    const me = this.me, f = me.facing, v = this.v;
    const d = fr.d || 'n';
    const fw = d.includes('f'), bk = d.includes('b');
    v.u = d.includes('u'); v.d = d.includes('d') && !v.u;
    v.r = (fw && f > 0) || (bk && f < 0); v.l = (fw && f < 0) || (bk && f > 0);
    v.btn.held = {}; if (fr.block) v.btn.held.block = true;
    for (const b of fr.p || []) { v.btn.press.add(b); v.btn.held[b] = true; }
    if (v.d) this.lastDown = this.f;
  }
  neutral() { this.apply({ d: 'n' }); }
  push(...frames) { this.q.push(...frames); }
  tick() {
    this.f++; this.v.btn.press.clear();
    const bt = this.bt, me = this.me;
    this.observe();
    const C = bt.cine;
    if (C && C.thr && C.D === me && C.f >= 1 && C.f <= THROW_TECH) {   // being thrown: guess a tech (like a human must)
      if (C.f === 1) this.techAt = this.roll(this.L.tech) ? 2 + Math.floor(Math.random() * (THROW_TECH - 3)) : -1;
      if (C.f === this.techAt) { this.apply({ d: 'n', p: ['medium', 'heavy'] }); return; }
    }
    if (bt.phase !== 'fight' || bt.cine || bt.freeze || me.ko || me.opp.ko) { this.q = []; this.neutral(); return; }
    if (bt.hitstop > 0 && !this.q.length) { this.apply({ d: this.hold.d, block: this.hold.block }); this.comboLogic(); return; }
    if (this.q.length) { this.apply(this.q.shift()); return; }
    this.decide();
  }
  // --- move input macros (same inputs a player would make) ---
  macro(k) {
    const btn = { L: 'light', M: 'medium', H: 'heavy', cL: 'light', cM: 'medium', cH: 'heavy', jL: 'light', jM: 'medium', jH: 'heavy' };
    const pad = n => Array.from({ length: Math.max(0, n) }, () => ({ d: 'n' }));
    switch (k) {
      case 'L': case 'M': case 'H': return [...pad(1), { d: 'n', p: [btn[k]] }];
      case 'cL': case 'cM': case 'cH': return [{ d: 'd', p: [btn[k]] }, { d: 'd' }];
      case 'jL': case 'jM': case 'jH': return [{ d: 'n', p: [btn[k]] }];
      case 'LH': return [{ d: 'n', p: ['light', 'heavy'] }];
      case 'THROW': return [{ d: 'n', p: ['medium', 'heavy'] }];
      case 'FF': return [{ d: 'f' }, { d: 'n' }, { d: 'f', p: ['heavy'] }];
      case 'sp1': case 'sp2': return [...pad(23 - (this.f - this.lastDown)), { d: 'n', p: [k] }];   // let old ↓ inputs expire so no motion is read
      case 'sp1f': return [{ d: 'd' }, { d: 'df' }, { d: 'f', p: ['sp1'] }];
      case 'sp2f': return [{ d: 'd' }, { d: 'df' }, { d: 'f', p: ['sp2'] }];
      case 'counter': return [{ d: 'd' }, { d: 'db' }, { d: 'b', p: ['sp1'] }];
      case 'sp2d': return [{ d: 'd' }, { d: 'n' }, { d: 'd', p: ['sp2'] }, { d: 'n' }];
      case 'ult': return [{ d: 'n', p: ['sp1', 'sp2'] }];
    }
    return [];
  }
  can(k) {
    const me = this.me, m = me.ch.moves[k]; if (!m) return false;
    if (m.virtual) return !(me.cd[k] > 0);
    if (m.cpuOk && !m.cpuOk(me)) return false;   // optional per-move bot condition (e.g. Jackpot only bets with LUCK)
    return me.canUse(k, !me.onGround, 0);
  }
  doMove(k) { this.push(...this.macro(k)); }
  pickSpecial(dist, filter) {
    const me = this.me, out = [];
    for (const k of CPU_SPECIALS) {
      const m = me.ch.moves[k]; if (!m || !this.can(k)) continue;
      const P = cpuProfile(m); if (filter && !filter(P, m, k)) continue;
      let w = 1;
      if (P.kind === 'proj') w = dist > 260 ? 3 : 1.2;
      else if (P.kind === 'buff') w = dist > 300 ? 1.5 : 0.4;
      else if (P.kind === 'counter' || P.kind === 'virtual') w = 0.5;
      else w = dist < P.reach * me.s + 20 ? 2.5 : 0.15;
      out.push([k, w]);
    }
    if (!out.length) return null;
    let r = Math.random() * out.reduce((a, b) => a + b[1], 0);
    for (const [k, w] of out) if ((r -= w) <= 0) return k;
    return out[0][0];
  }
  // --- combos: cancel a connecting move into the next one ---
  comboLogic() {
    const me = this.me, m = me.move;
    if (me.state !== 'attack' || !m || !me.connectedHit) return false;
    const id = me.T - me.mf; if (this.cancelId === id) return false;
    this.cancelId = id;
    if (this.steps >= this.L.depth || !this.roll(0.85)) return false;
    this.steps++;
    // character follow-ups first
    const fus = (m.followups || []).filter(fu => { const fm = me.ch.moves[fu.move]; return fm && !(me.cd[fu.move] > 0) && !(fm.cost && me.meter < fm.cost) && (!fu.cond || fu.cond(me)); });
    if (fus.length && this.roll(0.6)) {
      const fu = pick(fus), d = fu.dir === 'f' ? 'f' : fu.dir === 'b' ? 'b' : fu.dir === 'd' ? 'd' : 'n';
      if (fu.motion === 'qcf') this.q = [{ d: 'd' }, { d: 'df' }, { d: 'f', p: [fu.btn] }];
      else if (fu.motion === 'qcb') this.q = [{ d: 'd' }, { d: 'db' }, { d: 'b', p: [fu.btn] }];
      else this.q = [{ d, p: [fu.btn] }];
      return true;
    }
    if (me.meter >= 100 && me.ch.moves.ult && me.onGround && this.roll(this.L.ult * 0.6) && (m.lvl || 1) < 6) { this.q = this.macro('ult'); return true; }
    const lvl = m.lvl || 1;
    if (me.onGround && lvl === 1) { this.q = this.macro(this.roll(0.5) ? 'M' : 'cM'); return true; }
    if (me.onGround && lvl === 2) { this.q = this.macro(this.roll(0.65) ? 'H' : 'cH'); return true; }
    if (!me.onGround && lvl < 3) { this.q = this.macro(lvl === 1 ? 'jM' : 'jH'); return true; }
    if (lvl <= 3 && me.onGround && this.roll(this.L.special + 0.15)) { const k = this.pickSpecial(60, P => P.kind === 'melee' || P.kind === 'proj' || P.kind === 'grab'); if (k) { this.q = this.macro(k); return true; } }
    return false;
  }
  // --- main decision ---
  decide() {
    const me = this.me, L = this.L, o = this.seen();
    const dist = Math.abs(o.x - me.x), toward = Math.sign(o.x - me.x) || me.facing;
    const st = me.state;
    if (st === 'attack') { this.comboLogic(); this.apply({ d: 'n' }); return; }
    this.steps = st === 'attack' ? this.steps : 0;
    if (st === 'hit' || st === 'wall') {
      // Soul Burst out of a long combo
      if (me.burstReady && me.comboHits >= 4 && this.burstRoll !== me.comboHits) { this.burstRoll = me.comboHits; if (this.roll(L.burst * 0.35)) { this.apply({ d: 'n', p: ['block', 'heavy'] }); return; } }
      this.apply({ d: 'n', block: true }); return;   // hold block so blockstun follows hitstun when possible
    }
    if (st === 'block') { const low = o.move && cpuProfile(o.move).low; this.apply({ d: low && this.roll(L.lowRead) ? 'd' : this.hold.d === 'd' ? 'd' : 'n', block: true }); return; }
    if (!me.actionable()) { this.neutral(); return; }
    const air = !me.onGround;
    // ---- defence: react to a seen attack or an incoming projectile ----
    const om = o.state === 'attack' ? o.move : null;
    let threat = null;
    if (om && o.mf <= (om.st || 0) + (om.act || 0)) {
      const P = cpuProfile(om);
      if (dist < P.reach * (o.s || 1) + 70 && P.kind !== 'buff' && P.kind !== 'counter') threat = { id: o.id, low: P.low, over: P.over || !o.onGround, grab: P.kind === 'grab', melee: P.kind !== 'proj' };
    }
    if (!threat) for (const p of o.projs) {
      const dx = me.x - p.x, closing = p.vx === 0 ? Math.abs(dx) < 160 : Math.sign(p.vx) === Math.sign(dx);
      if (closing && Math.abs(dx) < 140 + Math.abs(p.vx) * 14 && Math.abs(p.y - (me.y - 90)) < 200) { threat = { id: p.id, low: p.low, proj: true }; break; }
    }
    if (threat && !air) {
      if (this.threatId !== threat.id) {
        this.threatId = threat.id; this.threatBlock = this.roll(L.block);
        if (this.threatBlock && threat.melee && !threat.grab && this.roll(L.counter) && this.can('counter') && cpuProfile(me.ch.moves.counter).kind === 'counter') { this.q = this.macro('counter'); this.threatBlock = false; return; }
        if (threat.grab && this.roll(L.block * 0.6)) { this.q = [{ d: 'ub' }, { d: 'ub' }, { d: 'n' }]; this.threatBlock = false; return; }   // jump away from an unblockable
      }
      if (this.threatBlock && !threat.grab) {
        const low = threat.low ? this.roll(L.lowRead) || this.hold.d === 'd' : false;
        this.hold = { d: low && !threat.over ? 'd' : 'n', t: 10, block: true };
        this.apply(this.hold); return;
      }
    }
    // ---- anti-air ----
    if (o.onGround) this.aaRolled = false;
    else if (!air && !this.aaRolled && (dist < 140 || (dist < 230 && Math.sign(o.vx) === -toward))) {
      this.aaRolled = true;
      if (this.roll(L.anti)) {
        const k = this.pickSpecial(dist, P => P.anti) || (this.can('LH') ? 'LH' : null);
        if (k) { this.doMove(k); return; }
      }
    }
    // keep holding the last block / walk for a few frames
    if (this.hold.t > 0) { this.hold.t--; this.apply(this.hold); return; }
    this.hold.block = false;
    // ---- air: attack when close on the way down ----
    if (air) {
      if (me.vy > -2 && dist < 150 && Math.abs(o.y - me.y) < 160 && this.roll(0.5)) { const k = pick(['jM', 'jH', 'jL']); if (this.can(k)) { this.doMove(k); return; } }
      this.apply({ d: this.hold.d.includes('f') ? 'f' : 'n' }); return;
    }
    if (this.wait > 0) { this.wait--; this.neutral(); return; }
    if (this.roll(L.idle * 0.25)) { this.wait = L.think; this.neutral(); return; }
    // ---- offence / neutral ----
    const knocked = o.state === 'knockdown' || o.state === 'getup';
    const reachN = 92 * me.s, meter = me.meter >= 100 && me.ch.moves.ult;
    if (knocked) { this.hold = { d: dist > 150 ? 'f' : this.roll(0.5) ? 'n' : 'b', t: L.think, block: false }; this.apply(this.hold); return; }
    if (meter && dist < 240 && !o.guard && this.roll(L.ult * 0.12)) { const P = cpuProfile(me.ch.moves.ult); if (dist < P.reach * me.s + 40) { this.doMove('ult'); return; } }
    if (dist <= reachN + 18) {
      if (!this.roll(L.aggro + 0.2)) { this.hold = { d: this.roll(0.5) ? 'b' : 'n', t: L.think, block: this.roll(L.block * 0.5) }; this.apply(this.hold); return; }
      this.steps = 0;
      if (this.roll(L.special * 0.35)) { const k = this.pickSpecial(dist, P => P.kind === 'melee' || P.kind === 'grab'); if (k) { this.doMove(k); return; } }
      if (dist < 78 * me.s && o.onGround && (o.state === 'idle' || o.state === 'crouch' || o.state === 'walk') && this.roll(o.guard ? L.throw * 2.5 : L.throw) && this.can('THROW')) { this.doMove('THROW'); return; }
      const mixLow = o.guard && !o.crouch && this.roll(L.mix);
      const k = mixLow ? pick(['cM', 'cH', 'cL']) : pick(['L', 'L', 'M', 'cL', 'cM', 'H', 'LH', 'cH']);
      if (this.can(k)) { this.doMove(k); this.wait = this.level === 0 ? 10 : 0; return; }
      this.doMove('L'); return;
    }
    if (dist < 330) {
      if (this.roll(L.special * 0.3)) { const k = this.pickSpecial(dist); if (k) { this.doMove(k); return; } }
      const r = Math.random();
      if (r < L.jumpIn) { this.q = [{ d: 'uf' }, { d: 'uf' }, { d: 'f' }]; return; }
      if (r < L.jumpIn + 0.12 * L.aggro && dist < 230 && this.can('FF')) { this.doMove('FF'); return; }
      if (r < L.jumpIn + 0.2 * L.aggro) { this.q = [{ d: 'f' }, { d: 'n' }, { d: 'f' }, { d: 'f' }, { d: 'f' }, { d: 'f' }, { d: 'f' }, { d: 'f' }]; return; }   // dash in
      this.hold = { d: this.roll(L.aggro + 0.25) ? 'f' : this.roll(0.5) ? 'b' : 'n', t: L.think, block: false };
      this.apply(this.hold); return;
    }
    // far: zone, power up or walk in
    if (this.roll(L.special * 0.4)) { const k = this.pickSpecial(dist, P => P.kind === 'proj' || P.kind === 'buff' || P.kind === 'virtual'); if (k) { this.doMove(k); return; } }
    this.hold = { d: this.roll(0.75 + L.aggro * 0.2) ? 'f' : 'n', t: L.think + 4, block: false };
    this.apply(this.hold);
  }
}
