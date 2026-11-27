// =============================== BATTLE ===============================
class Camera {
  constructor() { this.x = STAGE_W / 2; this.y = H / 2; this.z = 1; }
  update(bt, snap) {
    const a = bt.p1, b = bt.p2;
    let tx = (a.x + b.x) / 2, ty = 394 + Math.min(0, (Math.min(a.y, b.y) - GROUND) * 0.3), tz = 1.15;
    if (bt.freeze) { const F = bt.freeze.F; tx = F.x; ty = F.y - 110 * F.s; tz = 1.45; }
    else if (bt.cine) { const c = bt.cine; tx = c.camX ?? (c.A.x + c.D.x) / 2; ty = c.camY ?? GROUND - 150; tz = c.zoom; }
    else if (bt.focus) { tx = bt.focus.x; ty = bt.focus.y; tz = bt.focus.z; }
    const k = snap ? 1 : 0.13, kz = snap ? 1 : 0.1;
    this.x = lerp(this.x, tx, k); this.y = lerp(this.y, ty, k); this.z = lerp(this.z, tz, kz);
    const hw = W / 2 / this.z, hh = H / 2 / this.z;
    this.x = clamp(this.x, hw, STAGE_W - hw); this.y = clamp(this.y, -380 + hh, 720 - hh);
  }
  apply(g) { g.translate(W / 2 + FX.sx, H / 2 + FX.sy); g.scale(this.z, this.z); g.translate(-this.x, -this.y); }
  toScreen(x, y) { return [(x - this.x) * this.z + W / 2, (y - this.y) * this.z + H / 2]; }
}

const KANJI_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

class Battle {
  constructor(cfg) {
    this.cfg = cfg; this.mode = cfg.mode; BT = this;
    this.stage = STAGES[cfg.stage];
    this.inputs = [new PlayerInput(1), new PlayerInput(2)];
    this.practice = this.mode !== 'versus';
    if (this.practice) this.inputs[1].virtual = { l: false, r: false, u: false, d: false };
    this.cpu = cfg.cpu && !this.practice ? new CpuBot(this, cfg.cpu.level) : null;   // singleplayer: bot drives P2 through PlayerInput.virtual
    this.touch = TouchPad.attach(this);   // MOBILE mode: touch pad drives P1 through PlayerInput.virtual (singleplayer only)
    this.wins = [0, 0]; this.round = 0;
    this.mstats = [null, null];
    this.dm = { stance: 0, guard: 0, action: 0 }; this.infMeter = true; this.showBoxes = false;
    this.panel = 0; this.trialIdx = 0; this.trialDone = new Set(); this.trialProg = 0; this.trialProgT = 0; this.trialFlash = 0; this.listPage = 0;
    this.cam = new Camera();
    this.paused = false; this.pauseMenu = null; this.showList = false;
    this.newRound(true);
    Music.play(this.stage.music);
  }
  newRound(first) {
    this.round++; this.projs = []; FX.reset(); this.dialog = null; this.cine = null; this.freeze = null; this.slow = 0; this.hitstop = 0; this.focus = null;
    const c1 = CHARS[this.cfg.p1], c2 = CHARS[this.cfg.p2];
    this.inputs.forEach(i => i.reset());
    this.p1 = new Fighter(c1, 1, STAGE_W / 2 - 220, 1, this.inputs[0]);
    this.p2 = new Fighter(c2, 2, STAGE_W / 2 + 220, -1, this.inputs[1]);
    this.p1.opp = this.p2; this.p2.opp = this.p1;
    if (this.mstats[0]) { this.p1.stats = this.mstats[0]; this.p2.stats = this.mstats[1]; } else this.mstats = [this.p1.stats, this.p2.stats];
    if (this.mode === 'training') this.applyTrialHand();
    this.timer = this.practice || !Settings.roundTime ? Infinity : Settings.roundTime * 60;
    this.comboShow = [null, null]; this.comboEnd = [null, null];
    this.pf = 0; this.winner = null;
    if (this.practice) { this.phase = 'fight'; }
    else if (first) { this.phase = 'intro'; this.p1.setState('intro'); this.p2.setState('intro'); }
    else this.phase = 'roundCall';
    this.cam.update(this, true);
  }

  // ---------------- combat API used by moves ----------------
  spawn(o) { if (!o.srcKey && o.owner) o.srcKey = o.owner.moveKey; const p = new Proj(o); this.projs.push(p); return p; }
  say(F, text, dur = 100) { this.dialog = { F, text, t: 0, dur }; if (!F.ch.mute) Sound.speak(text, F.ch.voicePitch ?? 0.6, F.ch.voiceRate ?? 1); }
  superFreeze(F, m) {
    this.freeze = { F, m, f: 0, dur: 56 };
    FX.darkTarget = 0.7; Sound.play('charge'); Sound.play('ultStart', F.ch.id); FX.speedlines(50, W / 2, H / 2, F.colors.accent, 60);
    if (!F.ch.mute) Sound.speak(m.name.toLowerCase(), 0.6, 1.05);   // mute: fighters who never speak aloud (The Hollow)
  }
  startCine(A, D, fn, opts = {}) {
    this.cine = { A, D, fn, f: 0, zoom: opts.zoom || 1.3 };
    A.setState('cine'); D.setState('grabbed'); A.vx = A.vy = D.vx = D.vy = 0; A.hitActive = false; D.move = null; D.hitActive = false;
    D.counterActive = false; A.counterActive = false;
  }
  endCine() {
    const { A, D } = this.cine, landT = this.cine.landT ?? 22;
    A.forcePose = null; A.hidden = false;
    if (A.y < GROUND) { A.onGround = false; A.setState('jump'); A.sf = 12; } else { A.y = GROUND; A.onGround = true; A.setState('land'); A.landT = landT; }
    A.move = null;
    if (D.state === 'grabbed') this.release(D, A.facing * 4, -8);
    D.forcePose = null; this.cine = null; FX.darkTarget = 0;
  }
  release(D, vx, vy) { D.forcePose = null; D.setState('hit'); D.onGround = false; D.vx = vx; D.vy = vy; D.kdOnLand = true; D.hitstun = 40; D.juggle = 6; if (D.y > GROUND - 1) D.y = GROUND - 1; }
  applyDamage(A, D, dmg) {
    dmg *= (typeof D.ch.defMul === 'function' ? D.ch.defMul(D, A) : D.ch.defMul) || 1;   // defMul: number or (D, A) => multiplier (e.g. Borgar's Stone Skin)
    D.hp = Math.max(0, D.hp - dmg); D.comboDmg += dmg; A.stats.dmg += dmg; D.lastDmg = dmg; D.lastHitT = 0;
    if (this.practice) D.hp = Math.max(1, D.hp);
    if (A.ch.onDealDamage) A.ch.onDealDamage(A, D, dmg, this);
    A.stats.hits++;
    if (D.comboHits > A.stats.maxCombo) A.stats.maxCombo = D.comboHits;
    if (D.comboHits >= 2) this.comboShow[A.pid - 1] = { hits: D.comboHits, dmg: D.comboDmg, raw: D.comboRaw, pct: D.comboDmg / D.maxHp, flags: D.comboFlags, juggle: D.juggle, jmax: A.ch.juggleMax || 6, t: 0 };
  }
  scriptHit(A, D, dmg, o = {}) {
    D.comboHits++; D.comboRaw += dmg * A.dmgMult; D.comboMoves.push(A.moveKey);
    this.applyDamage(A, D, dmg * A.dmgMult);
    if (this.mode === 'training' && D === this.p2) this.checkTrial(D);
    D.flash = 5; D.hitShake = 6;
    const c = D.chestW(), str = o.str || 2;
    FX.hitSpark(c[0] + rand(-25, 25), c[1] + rand(-35, 35), str, str >= 3 ? A.colors.accent : '#ffd34a');
    Sound.play(o.sfx || 'hit', Math.min(3, str));
    if (str >= 4) { FX.speedlines(14, ...this.cam.toScreen(c[0], c[1]), '#ffffff'); Sound.play('impactBig'); }
  }
  resolveHit(A, D, hd, o) {
    const dir = o.dir;
    if (!o.proj) { A.hitCount++; A.hitT = hd.interval || 999; A.connected = true; }
    const remain = !o.proj && A.move ? (A.move.st + A.move.act + A.move.rec) - A.mf : 0;
    // --- card shield (front only) ---
    if (D.shieldT > 0 && dir === -D.facing && !hd.grab && !hd.ult) {
      D.shieldHP -= o.proj ? 1 : 2;
      FX.blockSpark(o.x, o.y, true); Sound.play('block'); this.hitstop = Math.max(this.hitstop, 6);
      if (D.shieldHP <= 0) { D.shieldT = 0; FX.burst(D.x + D.facing * 50, D.y - 100, '#ffd23a', 20, 8); FX.wtext(D.x, D.y - 230, 'SHIELD BREAK', { size: 26, color: '#ffd23a', life: 30 }); }
      if (!o.proj) A.vx = -dir * 8;
      return 'shield';
    }
    // --- counter stances ---
    if (D.state === 'attack' && D.counterActive && hd.type !== 'unblock' && !hd.ult && !(hd.grab && (D.move.counterNoGrab || hd.throw))) {   // counterNoGrab: grabs beat this counter (Kuon's Infinity)
      const m = D.move;
      FX.wtext(D.x, D.y - 230 * D.s, 'COUNTER!', { size: 40, color: '#ffffff', stroke: D.colors.accent, life: 40 });
      Sound.play('counter'); FX.flashScreen('#ffffff', 6, 0.35); FX.ring(D.x, D.y - 100, D.colors.accent, 20, 140, 16, 6); this.hitstop = Math.max(this.hitstop, 10);
      D.stats.counters++;
      if (m.absorb) { const dd = (hd.dmg || 0) * 0.5; D.hp = Math.max(1, D.hp - dd); D.flash = 6; A.stats.dmg += dd; }
      if (o.proj && !m.reflect) o.proj.dead = true;
      m.onCounter(D, o.proj ? o.proj.owner : A, o.proj || null);
      return 'countered';
    }
    if (hd.grab) { if (hd.onHit) hd.onHit(A, D); return 'grab'; }
    // --- blocking ---
    if (D.isGuarding() && hd.type !== 'unblock') {
      if (D.autoBlock) D.crouching = hd.type === 'low';
      const okLow = hd.type !== 'low' || D.crouching, okHigh = hd.type !== 'overhead' || !D.crouching;
      if (okLow && okHigh) {
        const perfect = !D.autoBlock && (D.input.f - D.input.blockPressF) <= 8;
        if (D.ch.onGuard) { const r = D.ch.onGuard(D, A, hd, o, perfect, dir); if (r) return r; }
        D.setState('block'); D.guard = true; D.move = null; D.hitActive = false;
        D.blockstun = Math.round(perfect ? (hd.bs || 12) * 0.5 : (hd.bs || 12));
        const chip = perfect ? 0 : (hd.dmg || 0) * (hd.ult ? 0.25 : hd.special ? 0.12 : 0.03);
        D.hp = Math.max(1, D.hp - chip); A.stats.dmg += chip;
        D.vx = dir * (hd.kb || 4) * 0.95;
        if (!o.proj && D.atWall() && A.onGround) A.vx = -dir * (hd.kb || 4) * 0.7;
        D.meter = Math.min(100, D.meter + (perfect ? 14 : 3)); A.meter = Math.min(100, A.meter + 2);
        FX.blockSpark(o.x, o.y, perfect); Sound.play(perfect ? 'perfect' : 'block');
        this.hitstop = Math.max(this.hitstop, perfect ? 9 : 5);
        D.stats.blocks++;
    if (!o.proj && A.lastFD && A.lastFD.key === A.moveKey) A.lastFD.onBlock = D.blockstun - remain;
        if (perfect) { D.stats.perfect++; FX.wtext(D.x, D.y - 225 * D.s, 'PERFECT BLOCK!', { size: 32, color: '#ffffff', stroke: '#16a5c4', life: 45 }); FX.flashScreen('#7dfcff', 5, 0.2); }
        return 'blocked';
      }
    }
    // --- armor ---
    if (D.armorActive() && hd.type !== 'unblock' && !hd.ult) {
      const dmg = (hd.dmg || 0) * 0.5 * A.dmgMult;
      D.hp = Math.max(this.practice ? 1 : 0, D.hp - dmg); A.stats.dmg += dmg; D.armorLeft--; D.flash = 5; D.hitShake = 5;
      FX.hitSpark(o.x, o.y, 1, '#ff9a6a'); FX.wtext(D.x, D.y - 235 * D.s, 'ARMOR', { size: 26, color: '#ffb37a', life: 30 });
      Sound.play('armor'); this.hitstop = Math.max(this.hitstop, 7); FX.shakeIt(4);
      return 'armor';
    }
    // --- clean hit ---
    const wasInCombo = D.comboHits > 0 && (D.state === 'hit' || D.state === 'wall');
    const counterHit = D.state === 'attack' && D.move && D.mf <= D.move.st + D.move.act && !D.move.counter;
    const punish = !counterHit && D.state === 'attack' && D.move && D.mf > D.move.st + D.move.act;
    let link = null;
    if (!o.proj && A.isLink && wasInCombo && A.hitCount === 1) { link = A.linkDelta >= -1 && A.linkDelta <= 2 ? 'perfect' : 'link'; }
    if (!o.proj) { A.isLink = false; A.connectedHit = true; }
    D.comboHits++;
    const scale = Math.max(0.35, 1 - 0.1 * (D.comboHits - 1));
    const raw = (hd.dmg || 0) * (counterHit ? 1.2 : punish ? 1.1 : 1) * (link === 'perfect' ? 1.1 : 1) * A.dmgMult;
    D.comboRaw += raw;
    this.applyDamage(A, D, raw * scale);
    D.comboMoves.push(o.proj ? (o.proj.srcKey || 'proj') : A.moveKey);
    const str = hd.str || 1;
    if (counterHit) {
      A.stats.counters++; D.comboFlags.counter = true;
      FX.ring(o.x, o.y, '#ffffff', 6, 130, 12, 6); FX.ring(o.x, o.y, '#ff2a3a', 6, 90, 14, 8); FX.burst(o.x, o.y, '#ffe14a', 16, 11); FX.flashScreen('#ff2a3a', 4, 0.22);
      FX.wtext(D.x, D.y - 230 * D.s, str >= 3 ? 'COUNTER HIT — STAGGER!' : 'COUNTER HIT!', { size: 36, color: '#ffe14a', stroke: '#b3001b', life: 45 });
      Sound.play('counter');
    }
    if (punish) FX.wtext(D.x, D.y - 230 * D.s, 'PUNISH!', { size: 32, color: '#ff9a3a', stroke: OUTLINE, life: 40 });
    if (link) {
      D.comboFlags.link = true; A.stats.links = (A.stats.links || 0) + 1;
      FX.wtext(A.x, A.y - 245 * A.s, link === 'perfect' ? 'PERFECT LINK!' : 'LINK', { size: link === 'perfect' ? 30 : 22, color: link === 'perfect' ? '#7dfcff' : '#ffffff', stroke: OUTLINE, life: 36 });
      if (link === 'perfect') { Sound.play('perfect'); A.meter = Math.min(100, A.meter + 5); }
    }
    const wasAir = !D.onGround, fromWall = D.state === 'wall';
    D.move = null; D.hitActive = false; D.counterActive = false; D.guard = false;
    let hs = (hd.hs || 16) + (counterHit ? (str >= 3 ? 16 : 8) : punish ? 4 : 0);
    if (D.comboHits > 6) hs *= Math.max(0.45, 1 - 0.05 * (D.comboHits - 6));
    if (D.comboT > 300) hs *= 0.7;
    D.setState('hit'); D.hitstun = Math.max(6, Math.round(hs));
    D.crouchHit = D.crouching && D.onGround && !hd.launch && !hd.kd;
    D.hitVariant = str >= 2 && Math.random() < 0.5;
    D.vx = dir * (hd.kb || 4);
    const jg = hd.jg ?? 1;
    if (fromWall) { D.vy = hd.launch || -7; D.onGround = false; D.kdOnLand = true; D.vx = dir * 2; D.juggle += jg; }
    else if (hd.launch) { D.vy = hd.launch * (D.juggle >= 3 ? 0.85 : 1) - (counterHit ? 2 : 0); D.onGround = false; D.kdOnLand = true; D.juggle += jg; if (wasAir) D.comboFlags.air = true; }
    else if (wasAir) { D.vy = hd.spike ? 12 : Math.min(D.vy, -6 + Math.min(D.juggle, 6) * 0.7); D.kdOnLand = true; D.juggle += jg; D.vx = dir * Math.max(2, (hd.kb || 4) * 0.6); D.comboFlags.air = true; }
    else if (hd.kd) { D.vy = -7; D.onGround = false; D.kdOnLand = true; }
    if (hd.gb && !D.bounceUsed) { D.bounce = true; D.bounceUsed = true; D.vy = 13; D.onGround = false; D.kdOnLand = true; if (D.y >= GROUND) D.y = GROUND - 1; }
    D.canSplat = !!(hd.ws || (hd.kb || 0) >= 9 || hd.kd);
    if (!o.proj && D.atWall() && A.onGround) A.vx = -dir * (hd.kb || 4) * 0.6;
    A.meter = Math.min(100, A.meter + raw * scale * 0.11 + 2); D.meter = Math.min(100, D.meter + raw * scale * 0.07);
    D.flash = 7; D.hitShake = 8;
    FX.hitSpark(o.x, o.y, str, str >= 3 ? A.colors.accent : '#ffd34a');
    Sound.play('hit', Math.min(3, str));
    if (o.proj && o.proj.kind === 'pillar') Sound.play('thunder');
    this.hitstop = Math.max(this.hitstop, hd.hitstop || [0, 6, 8, 11, 13][Math.min(4, str)]);
    if (hd.shake) FX.shakeIt(hd.shake); else if (str >= 3) FX.shakeIt(5);
    if (str >= 3 || counterHit) FX.speedlines(8, ...this.cam.toScreen(o.x, o.y), '#ffffff', 34);
    if (hd.impact) { FX.impactFrame(hd.impact); Sound.play('impactBig'); }
    if (!o.proj && !A.onGround && !D.onGround && A.state === 'attack') A.vy = Math.min(A.vy, -4); // air-combo float: a connecting air hit keeps the attacker aloft
    if (!o.proj && A.lastFD && A.lastFD.key === A.moveKey) A.lastFD.onHit = hd.launch || hd.kd ? 'KD' : D.hitstun - remain;
    if (this.mode === 'training' && D === this.p2) this.checkTrial(D);
    if (hd.onHit && (!o.proj || hd.projOnHit)) { if (hd.onHit(A, D)) return 'cine'; }
    return 'hit';
  }
  juggleCapped(A, D) { return D.state === 'hit' && !D.onGround && D.juggle >= (A.ch.juggleMax || 6); }
  onComboEnd(D) {
    const A = D.opp, n = D.comboHits;
    if (this.mode === 'training' && D === this.p2) this.checkTrial(D);
    if (n < 2) return;
    const pct = D.comboDmg / D.maxHp, scale = D.comboRaw > 0 ? D.comboDmg / D.comboRaw : 1;
    const perfect = n >= 5 && pct >= 0.3;
    this.comboEnd[A.pid - 1] = { hits: n, dmg: D.comboDmg, pct, scale, flags: { ...D.comboFlags }, perfect, t: 0 };
    FX.burst(D.x, D.y - 90, A.colors.accent, 10 + n * 2, 9);
    if (perfect) {
      A.stats.perfectCombos = (A.stats.perfectCombos || 0) + 1;
      FX.announce('PERFECT COMBO!!', { sub: '完璧連撃', size: 80, life: 80, y: H / 2 - 130, color: '#fff2a8', glow: A.colors.accent });
      Sound.play('perfect'); Sound.play('impactBig'); FX.flashScreen('#ffffff', 8, 0.3);
    }
  }
  checkTrial(D) {
    const A = this.p1, tr = A.ch.combos && A.ch.combos[this.trialIdx]; if (!tr) return;
    let i = 0; for (const k of D.comboMoves) if (i < tr.seq.length && k === tr.seq[i]) i++;
    this.trialProg = Math.max(i, D.comboHits ? i : 0); this.trialProgT = 0;
    const preOK = !tr.pre || tr.pre.every(k => A.recentPlays.some(r => r.k === k && A.T - r.T < 360));
    if (i >= tr.seq.length && preOK && !this.trialFlash) {
      this.trialDone.add(A.ch.id + ':' + this.trialIdx); this.trialFlash = 90;
      FX.announce('TRIAL CLEAR!', { sub: tr.name, size: 70, life: 90, y: 200, color: '#bfffd0', glow: '#18a85a' }); Sound.play('victory');
    }
  }
  applyTrialHand() {
    const A = this.p1, tr = A.ch.combos && A.ch.combos[this.trialIdx];
    if (A.ch.applyTrial) A.ch.applyTrial(A, tr, this);
    if (A.cards && tr && tr.hand) { A.cards.hand = tr.hand.slice(); A.cards.refill = [0, 0, 0]; A.cards.sel = 0; A.cards.deck = shuffleArr(CARD_IDS.filter(id => !tr.hand.includes(id))); }
  }
  // ---------------- per-frame simulation ----------------
  stepSim() {
    const frozen = !!(this.freeze || this.hitstop > 0);
    if (this.cpu) this.cpu.tick();
    if (this.touch) TouchPad.tick(this);
    this.inputs[0].update(this.p1.facing); this.inputs[1].update(this.p2.facing);
    if (frozen) { for (const inp of this.inputs) for (const k in inp.buf) if (inp.buf[k] > 0) inp.buf[k]++; } // don't let buffered presses expire during freezes
    FX.update(frozen);
    if (this.freeze) {
      this.freeze.f++;
      this.freeze.F.animOnly();
      if (this.freeze.f >= this.freeze.dur) { this.freeze = null; FX.darkTarget = 0.35; }
      return;
    }
    if (this.hitstop > 0) { this.hitstop--; return; }
    if (this.slow > 0) { this.slow--; if (this.slow % 3 !== 0) { this.p1.animOnly(); this.p2.animOnly(); this.p1.T--; this.p2.T--; return; } }
    if (FX.darkTarget > 0 && !this.cine && !this.freeze && !(this.p1.state === 'attack' && this.p1.move && this.p1.move.ult) && !(this.p2.state === 'attack' && this.p2.move && this.p2.move.ult)) FX.darkTarget = 0;
    if (this.stage.update) this.stage.update(this);
    if (this.cine) {
      const c = this.cine; c.f++;
      const done = c.fn(c.A, c.D, c.f, c);
      c.A.animOnly(); c.D.animOnly();
      if (done || c.f > (c.maxF || 400)) this.endCine();   // maxF: longer cinematics (Jackpot's MAX ending)
    } else {
      this.p1.update(); this.p2.update();
      this.checkHits();
    }
    for (const p of this.projs) p.update();
    this.checkProjectiles();
    this.projs = this.projs.filter(p => !p.dead);
    for (const p of this.projs) if (p.kind === 'crossing' && p.trapped) {
      const D = p.owner.opp;
      if (D.y < GROUND - 115) p.trapped = false;
      else if (D.state !== 'grabbed' && D.state !== 'cine') D.x = clamp(D.x, p.x - 84, p.x + 84);
    }
    this.pushApart();
  }
  checkHits() {
    const hits = [];
    for (const [A, D] of [[this.p1, this.p2], [this.p2, this.p1]]) {
      if (A.state !== 'attack' || !A.hitActive) continue;
      const m = A.move; if (A.hitCount >= (m.hits || 1) || A.hitT > 0) continue;
      const hu = D.hurtbox(); if (!hu || D.invuln > 0) continue;
      const hb = A.hitbox(); if (!overlap(hb, hu)) continue;
      if (m.grab && !m.comboGrab && (!D.onGround || D.state === 'hit' || D.state === 'getup' || D.state === 'knockdown')) continue;
      if (m.throw && (D.state === 'block' || D.state === 'wall' || D.state === 'burst')) continue;   // universal throw: not in blockstun / wall splat
      if (m.comboGrab && !(D.state === 'hit' || D.state === 'wall')) continue;
      if (this.juggleCapped(A, D)) { if (!D.comboFlags.capped) { D.comboFlags.capped = true; FX.wtext(D.x, D.y - 200, 'JUGGLE LIMIT', { size: 22, color: '#aab', life: 30 }); } continue; }
      const cx = (Math.max(hb.x, hu.x) + Math.min(hb.x + hb.w, hu.x + hu.w)) / 2, cy = (Math.max(hb.y, hu.y) + Math.min(hb.y + hb.h, hu.y + hu.h)) / 2;
      const hd = m.final && A.hitCount === (m.hits || 1) - 1 ? Object.assign(Object.create(m), m.final) : m;
      hits.push([A, D, hd, { x: cx, y: cy, dir: A.facing }]);
    }
    for (const [A, D, m, o] of hits) { if (this.cine) break; this.resolveHit(A, D, m, o); }
  }
  checkProjectiles() {
    const P = this.projs;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const a = P[i], b = P[j];
      if (!a.active() || !b.active() || a.owner === b.owner) continue;
      if (!overlap(a.rect(), b.rect())) continue;
      const ca = a.kind === 'beam' || a.crush, cb = b.kind === 'beam' || b.crush;
      if (ca || cb) { if (ca && !cb) b.dead = true; else if (cb && !ca) a.dead = true; continue; }
      if (!a.clash || !b.clash) continue;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      if (a.str > b.str) { b.dead = true; a.str -= b.str; } else if (b.str > a.str) { a.dead = true; b.str -= a.str; } else { a.dead = b.dead = true; }
      FX.hitSpark(mx, my, 2, '#ffffff'); Sound.play('hit', 1);
    }
    if (this.cine) return;
    for (const p of P) {
      if (!p.active() || p.hitT > 0) continue;
      const D = p.owner === this.p1 ? this.p2 : this.p1;
      const hu = D.hurtbox(); if (!hu || D.invuln > 0) continue;
      const r = p.rect(); if (!overlap(r, hu)) continue;
      if (this.juggleCapped(p.owner, D)) continue;
      const hd = p.final && p.hits === 1 ? Object.assign(Object.create(p), p.final) : p;
      const dir = p.kind === 'beam' ? p.owner.facing : (Math.sign(p.vx) || (D.x > p.x ? 1 : -1));
      const cx = (Math.max(r.x, hu.x) + Math.min(r.x + r.w, hu.x + hu.w)) / 2, cy = (Math.max(r.y, hu.y) + Math.min(r.y + r.h, hu.y + hu.h)) / 2;
      const res = this.resolveHit(p.owner, D, hd, { x: cx, y: cy, dir, proj: p });
      if (res === 'countered') continue;
      if (res === 'shield') { if (p.persist) p.harmless = true; else p.dead = true; continue; }
      if (res === 'cine') { p.dead = true; continue; }
      p.hits--; p.hitT = p.interval;
      const keep = p.kind === 'pillar' || p.persist;
      if (p.hits <= 0 && !keep) { p.dead = true; if (p.kind !== 'beam') FX.burst(p.x, p.y, p.color, 14, 7); }
      if (p.hits <= 0 && keep) p.harmless = true;
    }
  }
  pushApart() {
    const a = this.p1, b = this.p2;
    if (this.cine || a.hidden || b.hidden) return;
    const pass = F => F.state === 'attack' && F.move && F.move.pass && F.mf <= F.move.pass; // pass-through moves (dodges, phantom dashes)
    if (pass(a) || pass(b)) return;
    const skip = s => s === 'grabbed' || s === 'cine' || s === 'knockdown';
    if (!skip(a.state) && !skip(b.state)) {
      const wa = (a.ch.hurt?.w ?? 52) * 0.77 * a.s * (a.ch.wide || 1), wb = (b.ch.hurt?.w ?? 52) * 0.77 * b.s * (b.ch.wide || 1);
      // a grounded fighter's pushbox stops at the shoulders against a jumper (the big chibi head can be jumped over),
      // so a jump from the corner carries over the opponent instead of shoving them along the floor
      const air = !a.onGround !== !b.onGround;
      const ha = (a.state === 'crouch' ? 110 : air && a.onGround ? 118 * (a.ch.lowPush || 1) : 165) * a.s, hb = (b.state === 'crouch' ? 110 : air && b.onGround ? 118 * (b.ch.lowPush || 1) : 165) * b.s;   // lowPush: crawling fighters (Teke Teke) are easier to jump over
      const vOver = a.y > b.y - hb && b.y > a.y - ha;
      const dx = b.x - a.x, ov = (wa + wb) / 2 - Math.abs(dx);
      if (vOver && ov > 0) {
        let dir = dx > 0 ? 1 : dx < 0 ? -1 : a.facing;
        a.x -= dir * ov / 2; b.x += dir * ov / 2;
        if (a.x < 50) { b.x += 50 - a.x; a.x = 50; } if (a.x > STAGE_W - 50) { b.x -= a.x - (STAGE_W - 50); a.x = STAGE_W - 50; }
        if (b.x < 50) { a.x += 50 - b.x; b.x = 50; } if (b.x > STAGE_W - 50) { a.x -= b.x - (STAGE_W - 50); b.x = STAGE_W - 50; }
      }
    }
    const maxD = W / 1.15 - 140, d = Math.abs(a.x - b.x);
    if (d > maxD) { const ex = (d - maxD) / 2, dir = a.x < b.x ? 1 : -1; a.x += dir * ex; b.x -= dir * ex; }
  }

  // ---------------- round flow ----------------
  update() {
    if (this.paused) { this.updatePause(); return; }
    if (Keys.pressed.has('Escape') && this.phase !== 'matchEnd') { this.paused = true; this.showList = false; this.pauseMenu = new MenuList([{ id: 'resume', label: 'RESUME', jp: '再開' }, { id: 'list', label: 'MOVE LIST', jp: '技表' }, { id: 'restart', label: this.practice ? 'RESET POSITIONS' : 'RESTART MATCH', jp: 'やり直す' }, { id: 'select', label: 'CHARACTER SELECT', jp: 'キャラ選択' }, { id: 'menu', label: 'MAIN MENU', jp: 'メニュー' }], W / 2, 250, { w: 420 }); Sound.play('menuOk'); return; }
    if (this.practice) this.practiceKeys();
    this.pf++;
    const fightOn = this.phase === 'fight';
    this.inputs[0].enabled = fightOn; this.inputs[1].enabled = fightOn && !this.practice;
    switch (this.phase) {
      case 'intro': this.updateIntro(); break;
      case 'roundCall': this.updateRoundCall(); break;
      case 'fight':
        if (!this.freeze && !this.cine && this.hitstop <= 0 && this.timer !== Infinity) { this.timer--; if (this.timer <= 0) this.timeOver(); }
        break;
      case 'ko': this.updateKO(); break;
      case 'roundEnd': this.updateRoundEnd(); break;
    }
    this.stepSim();
    if (this.phase === 'fight' && !this.practice) this.checkKO();
    if (this.practice) this.practiceUpdate();
    if (this.dialog && ++this.dialog.t >= this.dialog.dur) this.dialog = null;
    for (const c of this.comboShow) if (c) c.t++;
    for (const c of this.comboEnd) if (c) c.t++;
    this.comboEnd = this.comboEnd.map(c => c && c.t < 150 ? c : null);
    if (this.trialFlash > 0) this.trialFlash--;
    this.comboShow = this.comboShow.map((c, i) => c && (c.t < 90 || (i === 0 ? this.p2 : this.p1).comboHits > 1) ? c : null);
    this.cam.update(this);
  }
  updateIntro() {
    const f = this.pf;
    if (f === 1) { this.focus = { x: this.p1.x, y: GROUND - 140, z: 1.35 }; Sound.play('gong'); }
    if (f === 100) { this.focus = { x: this.p2.x, y: GROUND - 140, z: 1.35 }; Sound.play('whoosh'); }
    if (f === 8) this.introFx(this.p1);
    if (f === 108) this.introFx(this.p2);
    if (f >= 200 || (f > 20 && UI.ok())) {
      this.focus = null; this.p1.setState('idle'); this.p2.setState('idle'); this.phase = 'roundCall'; this.pf = 0;
    }
  }
  introFx(F) {
    const c = F.colors.accent;
    if (F.ch.introFx) F.ch.introFx(F);
    else if (F.ch.id === 'yoru') { FX.dust(F.x, F.y - 80, 20, 'rgba(200,190,230,0.7)'); Sound.play('teleport'); F.afterimage = 20; }
    else if (F.ch.id === 'sera') { for (let i = 0; i < 4; i++) FX.p({ type: 'bolt', x: F.x + rand(-30, 30), y: -300, x2: F.x, y2: F.y - 150, size: 4, life: 14, color: c, jag: 40 }); Sound.play('thunder'); FX.flashScreen('#cff8ff', 8, 0.4); }
    else if (F.ch.id === 'goro') { FX.shakeIt(14); FX.rocks(F.x + F.facing * 80, GROUND, 18); FX.dust(F.x + F.facing * 80, GROUND, 14); Sound.play('slam'); }
    else { for (let i = 0; i < 30; i++) FX.flame(F.x + rand(-40, 40), F.y - rand(0, 180), c, 1, 6, 3); Sound.play('fire'); }
    if (!F.ch.mute) Sound.speak(F.ch.intro, F.ch.voicePitch ?? (F.ch.id === 'goro' ? 0.3 : F.ch.id === 'sera' || F.ch.id === 'yoru' ? 1.2 : 0.8), F.ch.voiceRate ?? 1);
  }
  updateRoundCall() {
    const f = this.pf;
    if (f === 1) {
      const final = this.wins[0] === 1 && this.wins[1] === 1;
      FX.announce(final ? 'FINAL ROUND' : `ROUND ${this.round}`, { sub: final ? '最終決戦' : `第${KANJI_NUM[Math.min(9, this.round)]}戦`, life: 75, size: 110, glow: '#ff2255', color: '#ffd84a' });
      Sound.play('gong'); Sound.announce(final ? 'final' : 'round' + this.round, final ? 'Final round' : `Round ${this.round}`, 0.5, 0.9);
    }
    if (f === 80) { FX.announce('FIGHT!', { sub: '始め！', life: 50, size: 150, glow: '#ff2200', color: '#ff8a1a' }); Sound.play('impactBig'); Sound.announce('fight', 'Fight!', 0.5, 1.1); FX.speedlines(20, W / 2, H / 2 - 40, '#ffffff', 50); FX.shakeIt(8); }
    if (f >= 92) { this.phase = 'fight'; this.pf = 0; }
  }
  checkKO() {
    const d1 = this.p1.hp <= 0, d2 = this.p2.hp <= 0;
    if (!d1 && !d2) return;
    if (this.cine || this.p1.state === 'grabbed' || this.p2.state === 'grabbed') return;
    this.doKO(d1 && d2 ? null : d1 ? this.p2 : this.p1);
  }
  doKO(winner) {
    this.phase = 'ko'; this.pf = 0; this.winner = winner;
    const losers = winner ? [winner.opp] : [this.p1, this.p2];
    for (const L of losers) {
      L.ko = true; L.move = null; L.hitActive = false;
      if (L.onGround || L.state !== 'hit') { L.setState('hit'); L.onGround = false; L.vy = -11; L.vx = (L.x < L.opp.x ? -1 : 1) * 6; L.y = Math.min(L.y, GROUND - 1); }
      L.kdOnLand = true; L.hitstun = 9999;
    }
    const final = winner && this.wins[winner.pid - 1] + 1 >= 2;
    this.slow = final ? 120 : 75;
    FX.impactFrame(final ? 5 : 3); FX.shakeIt(18); Sound.play('ko'); Sound.announce('ko', 'K.O.', 0.4, 0.8);
    FX.announce(final ? 'FINISH!' : 'K.O.', { sub: final ? '決着' : '撃破', size: 170, life: 120, color: '#ff3355', glow: '#ff0033' });
    FX.speedlines(40, W / 2, H / 2, '#ffffff', 60); FX.flashScreen('#ffffff', 10, 0.6);
    const L = losers[0]; this.focus = { x: L.x, y: GROUND - 140, z: final ? 1.5 : 1.25 };
  }
  timeOver() {
    this.phase = 'ko'; this.pf = 0;
    const r1 = this.p1.hp / this.p1.maxHp, r2 = this.p2.hp / this.p2.maxHp;
    this.winner = Math.abs(r1 - r2) < 0.001 ? null : r1 > r2 ? this.p1 : this.p2;
    FX.announce('TIME OVER', { sub: '時間切れ', size: 120, life: 100, color: '#ffd84a', glow: '#ff6a00' }); Sound.play('gong'); Sound.announce('time', 'Time over', 0.5, 0.9);
    for (const F of [this.p1, this.p2]) { F.move = null; F.hitActive = false; if (F !== this.winner) { F.setState('defeat'); } }
    this.timeOut = true;
  }
  updateKO() {
    if (this.pf === 90) this.focus = null;
    const W1 = this.winner;
    if (this.pf === 150) {
      if (W1) {
        this.wins[W1.pid - 1]++;
        W1.setState('victory'); W1.forcePose = null; W1.move = null; W1.vx = 0;
        if (!W1.onGround) { W1.onGround = false; }
        Sound.play('victory');
        FX.announce(`${W1.ch.name} WINS`, { sub: '勝利', size: 96, life: 140, style: 'slide', color: '#ffffff', glow: W1.colors.accent });
        Sound.speak(`${W1.ch.name} wins`, 0.5, 0.9);
        this.quote = { F: W1, text: pick(W1.ch.wins), t: 0 };
        this.focus = { x: W1.x, y: GROUND - 140, z: 1.3 };
      } else {
        FX.announce(this.timeOut ? 'DRAW' : 'DOUBLE K.O.', { sub: '引き分け', size: 110, life: 140 }); Sound.play('defeat');
      }
      this.phase = 'roundEnd'; this.pf = 0;
    }
  }
  updateRoundEnd() {
    if (this.quote) this.quote.t++;
    if (this.pf === 60 && this.winner) Sound.play('defeat');
    if (this.pf >= 210 || (this.pf > 60 && UI.ok())) {
      this.quote = null; this.timeOut = false;
      if (this.wins[0] >= 2 || this.wins[1] >= 2) { this.phase = 'matchEnd'; go(new ResultsScene(this)); }
      else this.newRound(false);
    }
  }
  // ---------------- practice / training ----------------
  practiceKeys() {
    const P = Keys.pressed, dm = this.dm, tick = () => Sound.play('menuMove');
    if (P.has('Digit1')) { dm.stance = (dm.stance + 1) % 3; tick(); }
    if (P.has('Digit2')) { dm.guard = (dm.guard + 1) % 4; tick(); }
    if (P.has('Digit3')) { dm.action = (dm.action + 1) % 3; tick(); }
    if (P.has('Digit4')) { this.infMeter = !this.infMeter; tick(); }
    if (P.has('Digit5')) { this.resetPositions(false); Sound.play('menuOk'); }
    if (P.has('Digit6')) { this.resetPositions(true); Sound.play('menuOk'); }
    if (P.has('Digit7')) { this.showBoxes = !this.showBoxes; tick(); }
    if (this.mode === 'training') {
      const n = (this.p1.ch.combos || []).length || 1;
      if (P.has('Digit8')) { this.panel = (this.panel + 1) % 3; tick(); }
      if (P.has('Digit9')) { this.trialIdx = (this.trialIdx + 1) % n; this.trialProg = 0; this.panel = 1; this.applyTrialHand(); tick(); }
      if (P.has('Digit0')) { this.trialIdx = (this.trialIdx + n - 1) % n; this.trialProg = 0; this.panel = 1; this.applyTrialHand(); tick(); }
    }
  }
  resetPositions(wall) {
    const s = this.p1.stats; this.newRound(false); this.round = 1; this.phase = 'fight'; this.p1.stats = s;
    if (wall) { this.p2.x = STAGE_W - 70; this.p1.x = STAGE_W - 160; this.p1.facing = 1; this.p2.facing = -1; this.cam.update(this, true); }
  }
  practiceUpdate() {
    const D = this.p2, A = this.p1, dm = this.dm;
    const v = this.inputs[1].virtual; v.l = v.r = v.u = false; v.d = dm.stance === 1;
    if (dm.stance === 2 && D.onGround && D.state === 'idle' && D.sf > 20) v.u = true;
    if (dm.guard === 1) D.autoBlock = true;
    else if (dm.guard === 2) D.autoBlock = D.lastHitT > 0 && D.lastHitT < 120;
    else if (dm.guard === 3) { if (this.pf % 30 === 0) this.rndBlock = Math.random() < 0.5; D.autoBlock = !!this.rndBlock; }
    else D.autoBlock = false;
    if (dm.action === 1 && D.onGround && (D.state === 'idle' || D.state === 'crouch') && D.sf > 40) D.startMove(dm.stance === 1 ? 'cL' : 'L');
    if (dm.action === 2 && D.burstReady && (D.state === 'hit' || D.state === 'wall') && D.comboHits >= 4) D.doBurst();
    if (D.comboHits === 0 && D.lastHitT > 50 && D.hp < D.maxHp && D.actionable()) { D.hp = D.maxHp; D.redHp = D.maxHp; }
    if (A.lastHitT > 50 && A.hp < A.maxHp) { A.hp = A.maxHp; }
    for (const F of [A, D]) if (!F.burstReady && F.comboHits === 0 && F.lastHitT > 150 && F.state !== 'burst') F.burstReady = true;
    if (this.infMeter && A.meter < 100 && !(A.state === 'attack' && A.move.ult) && !this.freeze && !this.cine) A.meter = Math.min(100, A.meter + 1.5);
    for (const k in A.cd) if (this.cfg.mode === 'training' && A.cd[k] > 20) A.cd[k] = 20;
  }
  // ---------------- pause ----------------
  updatePause() {
    if (this.showList) {
      const np = Math.max(listPages(this.p1.ch), listPages(this.p2.ch));
      if (UI.left() || pressedAny(B(2, 'left'))) { this.listPage = (this.listPage + np - 1) % np; Sound.play('menuMove'); }
      else if (UI.right() || pressedAny(B(2, 'right'))) { this.listPage = (this.listPage + 1) % np; Sound.play('menuMove'); }
      else if (UI.back() || UI.ok() || Mouse.clicked) { this.showList = false; Sound.play('menuBack'); }
      return;
    }
    if (Keys.pressed.has('Escape')) { this.paused = false; Sound.play('menuBack'); return; }
    const it = this.pauseMenu.update();
    if (!it) return;
    Sound.play('menuOk');
    switch (it.id) {
      case 'resume': this.paused = false; break;
      case 'list': this.showList = true; break;
      case 'restart':
        this.paused = false;
        if (this.practice) this.resetPositions();
        else { this.wins = [0, 0]; this.round = 0; this.mstats = [null, null]; this.newRound(true); }
        break;
      case 'select': this.paused = false; go(new CharSelectScene(this.mode)); break;
      case 'menu': this.paused = false; go(new TitleScene()); break;
    }
  }

  // ---------------- rendering ----------------
  draw(g) {
    if (Settings.pixel) this.drawWorldPixel(g); else this.drawWorldVector(g);
    drawHUD(g, this);
    if (this.freeze) drawCutIn(g, this.freeze);
    if (this.quote && this.quote.t > 20) drawQuote(g, this);
    if (this.dialog) speechBox(g, W / 2 - 330, this.cine ? 116 : 480, 660, this.dialog.F.ch.name, this.dialog.F.ch.titleJp, this.dialog.text, this.dialog.F.colors.accent, Math.min(1, this.dialog.t / 8, (this.dialog.dur - this.dialog.t) / 10));
    if (this.phase === 'intro') drawIntroCard(g, this);
    if (this.touch) TouchPad.draw(g, this);
    if (this.paused) this.drawPause(g);
  }
  drawWorldVector(g) {
    const cam = this.cam, t = this.pf;
    drawStageBG(g, this.stage, cam, t);
    if (this.cine && this.cine.bg) this.cine.bg(g, this.cine);
    if (FX.dark > 0.01) { g.fillStyle = `rgba(4,2,12,${FX.dark})`; g.fillRect(0, 0, W, H); }
    g.save(); cam.apply(g);
    g.drawImage(this.stage.floor, -200, GROUND);
    if (FX.dark > 0.01) { g.fillStyle = `rgba(4,2,12,${FX.dark})`; g.fillRect(-200, GROUND, STAGE_W + 400, 300); }
    if (this.stage.worldBack) this.stage.worldBack(g, this.pf);
    FX.drawParticles(g, true);
    const order = this.p2.state === 'attack' || this.p2.state === 'cine' ? [this.p1, this.p2] : [this.p2, this.p1];
    for (const F of order) F.draw(g);
    for (const p of this.projs) p.draw(g);
    FX.drawWorld(g);
    FX.drawParticles(g, false);
    if (this.showBoxes) this.drawBoxes(g);
    g.restore();
    if (this.cine && this.cine.fg) this.cine.fg(g, this.cine);
    if (this.stage.front) this.stage.front(g);
    FX.drawScreen(g);
  }
  drawBoxes(g) {
    g.lineWidth = 2;
    for (const F of [this.p1, this.p2]) {
      const hu = F.hurtbox(); if (hu) { g.strokeStyle = F.invuln > 0 ? '#ffffff' : '#3aff6a'; g.strokeRect(hu.x, hu.y, hu.w, hu.h); }
      if (F.state === 'attack' && F.hitActive) { const hb = F.hitbox(); g.strokeStyle = '#ff2a2a'; g.fillStyle = 'rgba(255,40,40,0.2)'; g.fillRect(hb.x, hb.y, hb.w, hb.h); g.strokeRect(hb.x, hb.y, hb.w, hb.h); }
    }
    for (const p of this.projs) if (p.active()) { const r = p.rect(); g.strokeStyle = '#ff8a2a'; g.strokeRect(r.x, r.y, r.w, r.h); }
  }
  drawPause(g) {
    g.fillStyle = 'rgba(5,2,14,0.78)'; g.fillRect(0, 0, W, H);
    if (this.showList) { drawMoveList(g, this.p1.ch, 40, 60, 590, 'P1', this.listPage); drawMoveList(g, this.p2.ch, 650, 60, 590, this.practice ? 'DUMMY' : 'P2', this.listPage); drawFooter(g, '← / →  page (moves · combos & follow-ups · cards)   ·   any button: close'); return; }
    drawTitleText(g, 'PAUSED', W / 2, 160, 80, '#ffffff', '#ff2a55'); g.font = `700 26px ${FONT_JP}`; g.textAlign = 'center'; g.fillStyle = '#ffb0c0'; g.fillText('一時停止', W / 2, 205);
    this.pauseMenu.draw(g, this.pf);
    drawFooter(g, 'ESC: resume   ·   ↑/↓ + ENTER / F / K: select');
  }
}
