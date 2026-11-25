// ============================== FIGHTER ===============================
const FREE_GROUND = ['idle', 'walk', 'crouch'];
class Fighter {
  constructor(ch, pid, x, facing, input) {
    this.ch = ch; this.pid = pid; this.input = input; this.s = ch.scale;
    this.x = x; this.y = GROUND; this.vx = 0; this.vy = 0; this.facing = facing; this.onGround = true;
    this.maxHp = ch.health; this.hp = ch.health; this.redHp = ch.health; this.meter = 0;
    this.state = 'idle'; this.sf = 0; this.move = null; this.moveKey = null; this.mf = 0;
    this.hitstun = 0; this.blockstun = 0; this.kdOnLand = false; this.juggle = 0; this.invuln = 0; this.cd = {};
    this.comboHits = 0; this.comboDmg = 0; this.lastHitT = 0;
    this.pose = buildPose(ch, 'stance'); this.sk = skeleton(this.pose, ch.dims);
    this.ropes = {}; this.after = []; this.afterimage = 0;
    this.T = 0; this.walkPhase = 0; this.jumpsLeft = 0; this.airUsed = {}; this.chainL = 0;
    this.stats = { dmg: 0, hits: 0, maxCombo: 0, specials: 0, perfect: 0, blocks: 0, counters: 0 };
    this.rage = 0; this.flash = 0; this.forcePose = null; this.hidden = false; this.ko = false;
    this.guard = false; this.crouching = false; this.ctrlVel = false; this.autoBlock = false;
    this.performed = new Set(); this.lastDmg = 0; this.hitActive = false; this.counterActive = false; this.armorLeft = 0;
    this.connected = false; this.hitCount = 0; this.hitT = 0; this.landT = 4; this.flipT = 0; this.hitShake = 0;
    // advanced combo state
    this.burstReady = true; this.wallUsed = false; this.bounceUsed = false; this.bounce = false; this.canSplat = false; this.wallT = 0;
    this.comboRaw = 0; this.comboFlags = {}; this.comboMoves = []; this.comboT = 0; this.slowT = 0; this.cardChain = 0; this.recentPlays = [];
    this.lastHitT = 999; this.sealK = null; this.sealK2 = null; this.sealT = 0; this.sealMax = 0; this.lastSpK = null; this.lastSpK2 = null; this.shieldT = 0; this.shieldHP = 0; this.connectedHit = false; this.isLink = false; this.readyF = 0; this.linkDelta = -99; this.goPressF = -99; this.lastFD = null;
    if (ch.initFighter) ch.initFighter(this);
  }
  resetCombo() { if (this.opp) this.opp.wallCancel = false; this.comboHits = 0; this.comboDmg = 0; this.comboRaw = 0; this.juggle = 0; this.comboFlags = {}; this.comboMoves = []; this.comboT = 0; this.wallUsed = false; this.bounceUsed = false; this.bounce = false; this.canSplat = false; }
  doBurst() {
    this.burstReady = false; this.setState('burst'); this.invuln = 34; this.move = null; this.hitActive = false; this.vx = 0; if (!this.onGround) this.vy = 0; this.forcePose = null;
    const c = this.colors.accent;
    FX.ring(this.x, this.y - 90, '#ffffff', 20, 280, 22, 10); FX.ring(this.x, this.y - 90, c, 10, 200, 18, 8); FX.burst(this.x, this.y - 90, c, 30, 12);
    FX.flashScreen(c, 10, 0.45); FX.shakeIt(12); Sound.play('impactBig'); Sound.play('counter');
    FX.wtext(this.x, this.y - 240 * this.s, 'SOUL BURST!', { size: 40, color: '#ffffff', stroke: c, life: 50 });
    const A = this.opp;
    if (A && Math.abs(A.x - this.x) < 240 && A.state !== 'cine' && A.state !== 'grabbed') {
      A.setState('hit'); A.move = null; A.hitActive = false; A.onGround = false; A.vy = -8; A.vx = (A.x > this.x ? 1 : -1) * 12; A.kdOnLand = true; A.hitstun = 30; A.y = Math.min(A.y, GROUND - 1);
    }
    if (BT) for (const p of BT.projs) if (p.owner === A && !p.persist) p.dead = true;
  }
  wallSplat() {
    const left = this.x < STAGE_W / 2;
    this.x = clamp(this.x, 52, STAGE_W - 52); this.setState('wall'); this.wallT = 34; if (this.opp) this.opp.wallCancel = true; this.vx = this.vy = 0; this.wallUsed = true; this.canSplat = false; this.comboFlags.wall = true;
    const wx = left ? 40 : STAGE_W - 40, wy = this.y - 100 * this.s;
    FX.sparks.push({ x: wx, y: wy, str: 4, color: '#ffffff', t: 0, max: 16, rot: 0 }); FX.rocks(wx, wy, 12, '#8a8a9a'); FX.ring(wx, wy, '#ffffff', 10, 150, 16, 6, 1);
    FX.wtext(this.x + (left ? 90 : -90), wy - 70, 'WALL SPLAT!', { size: 38, color: '#ffffff', stroke: '#5a2aff', life: 45 });
    Sound.play('slam'); FX.shakeIt(12); if (BT) BT.hitstop = Math.max(BT.hitstop, 8);
  }
  leaveWall() { this.setState('hit'); this.onGround = false; this.y = Math.min(this.y, GROUND - 1); this.vy = -2; this.vx = (this.x < STAGE_W / 2 ? 1 : -1) * 1.5; this.kdOnLand = true; this.hitstun = 20; }
  airJumpCancel() {
    this.jumpsLeft--; this.vy = this.ch.jumpV * 0.6; this.vx = this.facing * 3; this.setState('jump'); this.airUsed = {}; this.move = null; this.hitActive = false; this.flipT = 12; this.afterimage = 8;
    const O = this.opp; if (O && O.state === 'hit' && !O.onGround) { O.vy = Math.min(O.vy, -7); O.vx = this.facing * 2.5; } // the air-jump re-floats a juggled opponent (once per jump)
    FX.ring(this.x, this.y, this.colors.accent, 6, 50, 12, 4, 0.35); Sound.play('jump');
  }
  get colors() { if (this.ch.palette) return this.ch.palette(this);   // state-dependent palettes (expansion fighters: glowing runes, engine heat, authority)
    return this.rage > 0 && this.ch.rageColors ? this.ch.rageColors : this.ch.colors; }
  get dmgMult() { return (this.rage > 0 ? 1.25 : 1) * (this.ch.dmgBonus ? this.ch.dmgBonus(this) : 1); }
  setState(s) { this.state = s; this.sf = 0; }
  soft(s) { if (this.state !== s) { this.state = s; this.sf = 0; } }
  toIdle() { this.setState(this.input.d && this.onGround ? 'crouch' : 'idle'); this.move = null; this.hitActive = false; this.counterActive = false; this.chainL = 0; this.cardChain = 0; this.readyF = this.input.f; }
  handW(which) { const pt = which === 'f' ? this.sk.fh : this.sk.bh; return toWorld(this.x, this.y, this.facing, this.s, this.pose, this.sk, pt[0], pt[1]); }
  staffTop() { const [hx, hy] = this.sk.bh, p = this.pose; return toWorld(this.x, this.y, this.facing, this.s, p, this.sk, hx + Math.sin(p.sa) * 84, hy + Math.cos(p.sa) * 84); }
  chestW() { return [this.x, this.y - 118 * this.s]; }
  atWall() { return this.x <= 62 || this.x >= STAGE_W - 62; }
  actionable() { return FREE_GROUND.includes(this.state) || this.state === 'jump'; }
  isGuarding() { return (this.guard || this.state === 'block' || (this.autoBlock && FREE_GROUND.includes(this.state))) && this.onGround; }
  armorActive() {
    if (this.state !== 'attack') return false;
    const m = this.move, f = this.mf;
    if (m.armor && f >= m.armor[0] && f <= m.armor[1] && this.armorLeft > 0) return true;
    if (this.rage > 0 && m.lvl >= 3 && !m.special && f <= m.st + m.act && this.armorLeft > 0) return true;
    if (this.ch.armorBuff && this.armorLeft > 0 && f <= m.st + m.act && this.ch.armorBuff(this, m)) return true;   // character buffs that grant armor (Borgar)
    return false;
  }
  hurtbox() {
    if (this.hidden || this.state === 'knockdown' || this.state === 'grabbed' || this.state === 'cine') return null;
    const s = this.s, hb = this.ch.hurt || {}, w = (hb.w || 52) * s * (this.ch.wide || 1);
    let h = (hb.h || 172) * s, y = this.y - h;
    const crouchy = this.state === 'crouch' || this.state === 'prejump' || this.state === 'land' || this.state === 'getup' || (this.state === 'attack' && this.move.crouch) || (this.state === 'block' && this.crouching) || (this.state === 'hit' && this.crouchHit);
    if (crouchy && this.onGround) { h = (hb.ch || 118) * s; y = this.y - h; }
    if (!this.onGround) { h = (hb.air || 140) * s; y = this.y - (hb.airTop || 165) * s; }
    return { x: this.x - w / 2, y, w, h };
  }
  hitbox() {
    const hb = this.move.hb, s = this.s;
    const x0 = this.facing > 0 ? this.x + hb.x * s : this.x - (hb.x + hb.w) * s;
    return { x: x0, y: this.y + hb.y * s, w: hb.w * s, h: hb.h * s };
  }

  // ------------------------- main update -------------------------
  update() {
    const inp = this.input, opp = this.opp;
    this.T++; this.sf++; this.ctrlVel = false;
    for (const k in this.cd) if (this.cd[k] > 0) this.cd[k]--;
    if (this.invuln > 0) this.invuln--;
    if (this.flash > 0) this.flash--;
    if (this.flipT > 0) this.flipT--;
    if (this.rage > 0) { this.rage--; if (this.T % 2 === 0) FX.flame(this.x + rand(-30, 30), this.y - rand(20, 190) * this.s, '#ff2a1a', 1, 6, 2.5); }
    if (this.meter >= 100 && this.T % 4 === 0 && !this.ko) FX.p({ type: 'ember', x: this.x + rand(-35, 35) * this.s, y: this.y - rand(10, 180) * this.s, vy: -rand(1, 2.5), vx: rand(-0.3, 0.3), life: 30, size: rand(1.5, 3), color: this.colors.accent });
    if (this.redHp > this.hp && this.comboHits === 0) this.redHp = Math.max(this.hp, this.redHp - 5);
    if (this.redHp < this.hp) this.redHp = this.hp;
    if (this.onGround && FREE_GROUND.includes(this.state) && Math.abs(opp.x - this.x) > 4) this.facing = opp.x > this.x ? 1 : -1;
    if (this.state !== 'block') this.guard = false;
    this.lastHitT++;
    if (this.slowT > 0) this.slowT--;
    if (this.sealT > 0 && --this.sealT === 0) { this.sealK = this.sealK2 = null; }   // SEAL (The Hollow): one special slot locked for a short time
    if (this.ch.tick) this.ch.tick(this);
    if ((this.state === 'hit' || this.state === 'wall') && this.burstReady && !this.ko && inp.p('block') && inp.p('heavy')) { inp.use('block'); inp.use('heavy'); this.doBurst(); }

    switch (this.state) {
      case 'idle': case 'walk': case 'crouch': this.groundControl(); break;
      case 'prejump': this.vx = 0; if (this.sf >= 3) this.doJump(); break;
      case 'jump': this.airControl(); break;
      case 'land': this.vx *= 0.5; if (this.sf >= this.landT) this.toIdle(); break;
      case 'dash':
        this.vx = this.facing * this.ch.dashV * (this.sf < 10 ? 1 : 0.55); this.ctrlVel = true;
        if (this.sf % 4 === 0) FX.dust(this.x - this.facing * 20, GROUND, 1);
        if (inp.p('heavy') && this.canUse('FF', false, 0)) { inp.use('heavy'); this.startMove('FF'); break; }
        if (this.sf > 3 && this.tryAttack(false)) break;
        if (this.sf >= 16) this.toIdle(); break;
      case 'backdash': if (this.sf < 14) { this.vx = -this.facing * (this.ch.backdashV || 8.5); this.ctrlVel = true; } if (this.sf >= 20) this.toIdle(); break;
      case 'block': this.guard = true; this.crouching = this.autoBlock ? this.crouching : inp.d; if (--this.blockstun <= 0) this.toIdle(); break;
      case 'hit': if (this.onGround && !this.ko) { if (--this.hitstun <= 0) this.toIdle(); } break;
      case 'knockdown': if (!this.ko && this.sf >= 36) { this.setState('getup'); this.invuln = 24; } break;
      case 'getup': if (this.sf >= 16) this.toIdle(); break;
      case 'attack': this.attackUpdate(); break;
      case 'wall': if (--this.wallT <= 0) this.leaveWall(); break;
      case 'burst':
        this.vx *= 0.8; if (!this.onGround && this.sf < 18) this.vy = 0;
        if (this.sf >= 26) { if (this.onGround) this.toIdle(); else { this.setState('jump'); this.sf = 12; } }
        break;
      default: break; // intro, victory, defeat, grabbed, cine
    }
    const inCombo = ['hit', 'grabbed', 'cine', 'wall'].includes(this.state);
    if (inCombo && this.comboHits > 0) this.comboT++;
    if (!inCombo && this.comboHits > 0) { if (BT && BT.onComboEnd) BT.onComboEnd(this); this.resetCombo(); }
    this.physics();
    this.animate();
  }

  groundControl() {
    const inp = this.input;
    if (this.tryAttack(false)) return;
    if (inp.held.block) { this.guard = true; this.crouching = inp.d; this.vx = 0; this.soft(this.crouching ? 'crouch' : 'idle'); return; }
    this.crouching = false;
    if (inp.u) { this.setState('prejump'); this.jumpDir = inp.h; return; }
    if (inp.dir === 6 && inp.motion('ff', 16)) { inp.clearMotion(); this.setState('dash'); this.afterimage = 12; if (this.ch.dashInv) this.invuln = this.ch.dashInv; Sound.play('whoosh', 0.8); FX.dust(this.x, GROUND, 6); return; }
    if (inp.dir === 4 && inp.motion('bb', 16)) { inp.clearMotion(); this.setState('backdash'); this.invuln = this.ch.backdashInv || 6; this.onGround = false; this.vy = -5; this.afterimage = 10; Sound.play('whoosh', 0.7); return; }
    if (inp.d) { this.soft('crouch'); this.crouching = true; this.vx = 0; return; }
    if (inp.h !== 0) {
      const fwd = inp.h * this.facing;
      this.vx = inp.h * (fwd > 0 ? this.ch.walk : this.ch.backWalk) * (this.rage > 0 ? 1.15 : 1) * (this.slowT > 0 ? 0.5 : 1) * (this.ch.walkMul ? this.ch.walkMul(this) : 1);
      this.walkPhase += 0.2 * fwd * (this.ch.walk / 4.4); this.ctrlVel = true; this.soft('walk');
    } else { this.vx = 0; this.soft('idle'); }
  }
  doJump() {
    this.vy = this.ch.jumpV; this.vx = this.jumpDir * this.ch.jumpX; this.onGround = false;
    this.setState('jump'); this.airUsed = {}; this.jumpsLeft = this.ch.doubleJump ? 1 : 0; this.chainL = 0;
    Sound.play('jump'); FX.dust(this.x, GROUND, 5);
  }
  superJump() {
    this.vy = this.ch.jumpV * 1.12; this.vx = this.facing * this.ch.jumpX * 0.7; this.onGround = false;
    this.setState('jump'); this.airUsed = {}; this.jumpsLeft = this.ch.doubleJump ? 1 : 0; this.move = null; this.hitActive = false;
    Sound.play('jump'); FX.dust(this.x, GROUND, 8); this.afterimage = 10;
  }
  airControl() {
    const inp = this.input;
    if (this.tryAttack(true)) return;
    if (this.ch.doubleJump && this.jumpsLeft > 0 && inp.upPressed && this.sf > 5) {
      this.jumpsLeft--; this.vy = this.ch.jumpV * 0.85; this.vx = inp.h * this.ch.jumpX; this.sf = 0; this.airUsed = {}; this.flipT = 16;
      FX.ring(this.x, this.y, this.colors.accent, 6, 50, 12, 4, 0.35); Sound.play('jump'); this.afterimage = 10;
    }
  }

  canUse(k, air, minLvl) {
    const m = this.ch.moves[k]; if (!m) return false;
    if (m.virtual) return false;
    if (this.cd[k] > 0) return false;
    if (this.sealT > 0 && (this.sealK === k || this.sealK2 === k)) return false;
    if (m.req && !m.req(this)) return false;
    if ((m.lvl || 1) <= minLvl) return false;
    if (m.cost && this.meter < m.cost) return false;
    if (m.air === 'both') return !air || !this.airUsed[k];
    if (!!m.air !== air) return false;
    if (air && this.airUsed[k]) return false;
    return true;
  }
  tryAttack(air, minLvl = 0) {
    const inp = this.input; let k;
    if (this.ch.tryCustom && this.ch.tryCustom(this, inp, air, minLvl)) return true;
    const go = (key, ...btns) => { this.goPressF = inp.pressF[btns[0]] ?? -99; btns.forEach(b => inp.use(b)); this.startMove(key); return true; };
    if (inp.p('sp1') && inp.p('sp2')) { if (this.canUse('ult', air, minLvl)) return go('ult', 'sp1', 'sp2'); }
    if (inp.p('sp1')) {
      k = inp.motion('qcf') ? 'sp1f' : inp.motion('qcb') ? 'counter' : 'sp1';
      if (this.canUse(k, air, minLvl)) { inp.clearMotion(); return go(k, 'sp1'); }
      if (this.ch.moves[k] && this.sealT > 0 && (this.sealK === k || this.sealK2 === k) && inp.buf.sp1 === 10) FX.wtext(this.x, this.y - 210 * this.s, 'SEALED', { size: 18, color: '#d8c4ff', stroke: '#2a0a4a', life: 26 });
      else if (this.ch.moves[k] && this.cd[k] > 0 && !air && inp.buf.sp1 === 10) FX.wtext(this.x, this.y - 210 * this.s, 'COOLDOWN', { size: 16, color: '#9aa', life: 24 });
    }
    if (inp.p('sp2')) {
      k = inp.motion('dd', 22) ? 'sp2d' : (this.ch.moves.sp2f && inp.motion('qcf')) ? 'sp2f' : 'sp2';
      if (this.canUse(k, air, minLvl)) { inp.clearMotion(); return go(k, 'sp2'); }
      if (this.ch.moves[k] && this.sealT > 0 && (this.sealK === k || this.sealK2 === k) && inp.buf.sp2 === 10) FX.wtext(this.x, this.y - 210 * this.s, 'SEALED', { size: 18, color: '#d8c4ff', stroke: '#2a0a4a', life: 26 });
      else if (this.ch.moves[k] && this.cd[k] > 0 && !air && inp.buf.sp2 === 10) FX.wtext(this.x, this.y - 210 * this.s, 'COOLDOWN', { size: 16, color: '#9aa', life: 24 });
    }
    if (!air && inp.p('heavy') && inp.p('light') && this.canUse('LH', air, minLvl)) return go('LH', 'heavy', 'light');
    if (inp.p('heavy')) {
      k = air ? 'jH' : inp.motion('ff', 20) ? 'FF' : inp.d ? 'cH' : 'H';
      if (k === 'FF' && !this.canUse('FF', air, minLvl)) k = 'H';
      if (this.canUse(k, air, minLvl)) { if (k === 'FF') inp.clearMotion(); return go(k, 'heavy'); }
    }
    if (inp.p('medium')) { k = air ? 'jM' : inp.d ? 'cM' : 'M'; if (this.canUse(k, air, minLvl)) return go(k, 'medium'); }
    if (inp.p('light')) {
      k = air ? 'jL' : inp.d ? 'cL' : 'L';
      if (this.canUse(k, air, minLvl)) return go(k, 'light');
      if (minLvl === 1 && this.chainL < 2 && this.canUse(k, air, 0)) { this.chainL++; return go(k, 'light'); }
    }
    return false;
  }
  startMove(k, forced) {
    const m = this.ch.moves[k];
    const fromLvl1 = this.state === 'attack' && this.move && this.move.lvl === 1;
    if (!fromLvl1) this.chainL = 0;
    const cancelled = this.state === 'attack' || this.state === 'dash';
    this.isLink = !cancelled && !forced && this.onGround; this.linkDelta = this.goPressF - this.readyF; this.goPressF = -99;
    if (!cancelled) this.cardChain = 0;
    this.recentPlays.push({ k, T: this.T }); if (this.recentPlays.length > 12) this.recentPlays.shift();
    this.lastFD = { key: k, name: m.name, st: m.st, act: m.act, rec: m.rec, cat: m.cat, cw: m.cw, jg: m.jg, onHit: null, onBlock: null, cancelled };
    // chain guarantee: a cancel made from a clean hit early in a combo keeps a grounded opponent in hitstun until it can connect
    const O = this.opp;
    if (cancelled && O && O.state === 'hit' && O.onGround && O.comboHits > 0 && O.comboHits < 7 && !m.ult && (this.connectedHit || this.move?.cardMove || this.move?.spawn)) {
      const reach = m.dmg ? m.st + 3 : m.spawn ? Math.min(m.spawn.f + 16, 30) : 0;
      if (reach) O.hitstun = Math.max(O.hitstun, reach);
    }
    this.connectedHit = false;
    this.move = m; this.moveKey = k; this.mf = 0; this.setState('attack');
    this.hitCount = 0; this.hitT = 0; this.connected = false; this.hitActive = false; this.counterActive = false;
    this.armorLeft = m.armorHits || (this.rage > 0 ? 1 : 0) || (this.ch.armorHits ? this.ch.armorHits(this, m) : 0);
    if (m.cd) this.cd[k] = m.cd;
    if (m.cost) this.meter -= m.cost;
    if (m.air) this.airUsed[k] = true;
    if (this.onGround && !m.keepVel) this.vx = 0;
    this.performed.add(k);
    if (m.special && SEAL_SLOTS.includes(k)) { if (this.lastSpK !== k) this.lastSpK2 = this.lastSpK; this.lastSpK = k; }   // remembered for The Hollow's Outlet Seal
    if (m.special || m.ult) {
      this.stats.specials++;
      FX.callout(this.pid, m.name, m.jp, this.colors.accent);
      if (m.sfx) Sound.play(m.sfx); else Sound.play('energy');
    }
    if (m.ult) { BT.superFreeze(this, m); }
    if (m.onStart) m.onStart(this, this.opp);
  }
  attackUpdate() {
    if (!this.move) { this.setState(this.onGround ? 'idle' : 'jump'); return; }   // move cleared externally (e.g. time over mid-attack)
    const m = this.move, f = ++this.mf, inp = this.input;
    // late conversions (lenient simultaneous presses)
    if (f <= 3 && (this.moveKey === 'L' || this.moveKey === 'cL') && inp.p('heavy') && this.canUse('LH', false, 0)) { inp.use('heavy'); this.startMove('LH'); return; }
    if (f <= 3 && (m.special || m.cardMove) && !m.ult && (inp.p('sp1') || inp.p('sp2')) && this.meter >= 100 && this.ch.moves.ult && this.onGround) {
      const s1 = this.moveKey.startsWith('sp1') || m.cardMove, s2 = this.moveKey.startsWith('sp2');
      if ((s1 && inp.p('sp2')) || (s2 && inp.p('sp1'))) { this.cd[this.moveKey] = 0; if (m.cardMove && this.ch.refundCard) this.ch.refundCard(this); inp.use('sp1'); inp.use('sp2'); this.startMove('ult'); return; }
    }
    if (m.vx !== undefined && f <= m.st + m.act) { this.vx = this.facing * m.vx; this.ctrlVel = true; }
    if (m.tick) m.tick(this, f, this.opp);
    if (this.state !== 'attack' || this.move !== m) return; // tick may have changed state
    if (m.spawn && f === m.spawn.f) m.spawn.fn(this, this.opp);
    if (m.invuln && f >= m.invuln[0] && f <= m.invuln[1]) this.invuln = Math.max(this.invuln, 2);
    this.counterActive = !!m.counter && f > m.st && f <= m.st + m.act;
    if (this.counterActive && this.T % 3 === 0) FX.p({ type: 'ember', x: this.x + rand(-40, 40), y: this.y - rand(20, 180) * this.s, vy: -1, life: 16, size: 2.5, color: '#ffffff' });
    const active = f > m.st && f <= m.st + m.act && (m.dmg || 0) > 0;
    if (f === m.st + 1 && (m.dmg || 0) > 0) {
      if (!m.special && !m.ult) Sound.play('whoosh', m.lvl >= 3 ? 0.7 : 1.2);
      if (m.sw) FX.swoosh(this, { ...m.sw, color: m.sw.color || this.colors.accent });
    }
    if (this.hitT > 0) this.hitT--;
    this.hitActive = active;
    // character-specific follow-ups / target combos (checked before generic cancels)
    if (m.followups && f > m.st) for (const fu of m.followups) {
      if (!fu.any && !this.connectedHit) continue;
      if (fu.cond && !fu.cond(this)) continue;
      if (!inp.p(fu.btn)) continue;
      if (fu.motion && !inp.motion(fu.motion)) continue;
      if (!fu.motion && fu.noMotion && (inp.motion('qcf') || inp.motion('qcb'))) continue;
      const pd = inp.pdir[fu.btn] || {}; // direction held when the button was pressed also counts
      if (fu.dir === 'f' && inp.fwd <= 0 && !(pd.fwd > 0)) continue;
      if (fu.dir === 'b' && inp.fwd >= 0 && !(pd.fwd < 0)) continue;
      if (fu.dir === 'd' && !inp.d && !pd.d) continue;
      if (fu.window && f > m.st + m.act + fu.window) continue;
      const fm = this.ch.moves[fu.move]; if (!fm || this.cd[fu.move] > 0 || (fm.cost && this.meter < fm.cost)) continue;
      inp.use(fu.btn); if (fu.motion) inp.clearMotion(); this.startMove(fu.move); return;
    }
    // wall cancel: after a wall splat the attacker may cancel the recovery into ANY attack once, stepping in to follow up
    if (this.wallCancel && this.opp && this.opp.state === 'wall' && f > m.st + m.act) {
      const O = this.opp, far = Math.abs(O.x - this.x) - 80, px = this.x;
      if (far > 0) this.x += Math.sign(O.x - this.x) * far;
      if (this.tryAttack(!this.onGround, 0)) { this.wallCancel = false; this.afterimage = 10; FX.dust(px, GROUND, 6); Sound.play('whoosh', 0.9); return; }
      this.x = px;
    }
    // windowed cancels: on hit everything higher; on block only light/medium chains and special cancels
    if (this.connected && f > m.st && f <= m.st + m.act + (m.cw ?? 12)) {
      if (m.jc && this.connectedHit && (inp.u || inp.p('up')) && f > m.st) { inp.use('up'); this.superJump(); return; }
      if (m.ajc && this.connectedHit && !this.onGround && this.jumpsLeft > 0 && inp.p('up')) { inp.use('up'); this.airJumpCancel(); return; }
      const minLvl = this.connectedHit ? m.lvl : (m.lvl <= 2 ? m.lvl : Math.max(m.lvl, 3));
      if (this.tryAttack(!this.onGround, minLvl)) return;
    }
    // card chain: after a card resolves, one more card/card special may be chained (max 2)
    if (m.cardMove && this.cardChain < 2 && f > (m.spawn ? m.spawn.f : m.st)) { const cc = this.cardChain; if (this.tryAttack(!this.onGround, 3)) { this.cardChain = cc + 1; return; } }
    const total = m.st + m.act + m.rec;
    if (f >= total) {
      if (this.onGround) this.toIdle();
      else { this.setState('jump'); this.sf = 12; this.move = null; this.hitActive = false; }
    }
  }
  physics() {
    if (this.state === 'grabbed' || this.state === 'cine' || this.state === 'wall') return;
    if (!this.onGround) {
      const g = this.state === 'hit' ? 0.62 + 0.06 * Math.min(this.juggle, 8) : (this.state === 'attack' && this.connectedHit && this.opp && !this.opp.onGround) ? 0.5 : 0.85 * (this.ch.grav || 1);
      if (this.ch.glide && this.state === 'jump' && this.input.u && this.vy > this.ch.glide) this.vy = this.ch.glide - g;
      this.vy += g; this.y += this.vy; this.x += this.vx;
      if (this.y >= GROUND && this.vy >= 0) { this.y = GROUND; this.vy = 0; this.onGround = true; this.land(); }
    } else {
      this.x += this.vx;
      if (!this.ctrlVel) this.vx *= (this.state === 'hit' || this.state === 'block') ? 0.86 : this.state === 'knockdown' ? 0.85 : 0.72;
      if (Math.abs(this.vx) < 0.05) this.vx = 0;
    }
    if (this.state === 'hit' && this.canSplat && !this.wallUsed && Math.abs(this.vx) >= 5 && (this.x <= 52 || this.x >= STAGE_W - 52)) { this.wallSplat(); return; }
    this.x = clamp(this.x, 50, STAGE_W - 50);
  }
  land() {
    const s = this.state;
    if (s === 'hit') {
      if (this.bounce && !this.ko) {
        this.bounce = false; this.vy = -12.5; this.onGround = false; this.y = GROUND - 1; this.comboFlags.bounce = true;
        FX.dust(this.x, GROUND, 12); FX.ring(this.x, GROUND, '#ffffff', 10, 120, 14, 5, 0.3); Sound.play('slam'); FX.shakeIt(6);
        FX.wtext(this.x, GROUND - 60, 'BOUNCE!', { size: 26, color: '#ffffff', life: 30 }); return;
      }
      if (this.kdOnLand || this.ko) {
        this.setState('knockdown'); this.vx *= 0.4; this.kdOnLand = false; this.juggle = 0;
        FX.dust(this.x, GROUND, 12); FX.shakeIt(this.ko ? 10 : 5); Sound.play('land'); Sound.play('hit', 1);
      }
    } else if (s === 'jump' || s === 'backdash') {
      this.setState('land'); this.landT = s === 'backdash' ? 6 : 4; this.vx = 0; Sound.play('land'); FX.dust(this.x, GROUND, 4);
    } else if (s === 'attack') {
      const m = this.move;
      if (m.air || m.landRec) { if (m.onLand) m.onLand(this); this.setState('land'); this.landT = m.landRec || 5; this.vx = 0; this.move = null; this.hitActive = false; Sound.play('land'); FX.dust(this.x, GROUND, 5); }
    }
  }

  // ------------------------- animation -------------------------
  targetPose() {
    const ch = this.ch, st = ch.stance;
    if (this.forcePose) return [this.forcePose, 0.55];
    switch (this.state) {
      case 'idle': if (this.guard) return ['block', 0.45];
        if (ch.idlePose) { const ip = ch.idlePose(this); if (ip) return [ip, 0.16]; }   // optional idle gestures (e.g. Yamika, Lunaria)
        return [{ t: (st.t ?? POSE0.t) + Math.sin(this.T * 0.07) * 0.03, fa2: (st.fa2 ?? POSE0.fa2) + Math.sin(this.T * 0.07) * 0.07, ba2: (st.ba2 ?? POSE0.ba2) + Math.sin(this.T * 0.07 + 1) * 0.05 }, 0.22];
      case 'walk': {
        const ph = this.walkPhase, s1 = Math.sin(ph), c1 = Math.cos(ph);
        const fl1 = 0.1 + 0.42 * s1, bl1 = 0.1 - 0.42 * s1;
        return [{ t: (st.t ?? POSE0.t) + 0.04, wk: s1, wc: c1, fl1, bl1, fl2: fl1 - (0.15 + 0.55 * Math.max(0, -c1)), bl2: bl1 - (0.15 + 0.55 * Math.max(0, c1)) }, 0.35];
      }
      case 'crouch': return [this.guard ? 'cblock' : 'crouch', 0.4];
      case 'prejump': return ['prejump', 0.6];
      case 'jump': return [this.flipT > 0 ? 'flip' : this.vy < -3 ? 'jump' : 'fall', 0.25];
      case 'land': return ['land', 0.5];
      case 'dash': return ['dash', 0.4];
      case 'backdash': return ['backdash', 0.4];
      case 'block': return [this.crouching ? 'cblock' : 'block', 0.6];
      case 'hit':
        if (!this.onGround) return [{ base: 'airhit', rot: -0.35 - clamp(this.vy * 0.04, -0.4, 0.5) }, 0.3];
        return [this.crouchHit ? 'chit' : this.hitVariant ? 'hit2' : 'hit', 0.55];
      case 'knockdown': return ['down', 0.28];
      case 'getup': return ['getup', 0.3];
      case 'grabbed': return ['airhit', 0.4];
      case 'wall': return [{ base: 'hit', t: -0.5, hd: -0.5, fa1: -1.6, fa2: -2.0, ba1: -1.8, ba2: -2.2 }, 0.6];
      case 'burst': return ['raise', 0.45];
      case 'victory': return ['victory', 0.12];
      case 'defeat': return [ch.poses && ch.poses.defeat ? 'defeat' : 'kneel', 0.12];
      case 'intro': return ['intro', 0.12];
      case 'attack': {
        const m = this.move, f = this.mf;
        if (m.poseFn) return [m.poseFn(this, f), m.poseRate || 0.5];
        if (f <= m.st) return [m.poses[0], 0.5];
        if (f <= m.st + m.act + Math.min(6, m.rec * 0.4)) return [m.poses[1], 0.65];
        return [!this.onGround ? 'fall' : m.crouch ? 'crouch' : 'stance', 0.16];
      }
      default: return ['stance', 0.25];
    }
  }
  animate() {
    const [spec, rate] = this.targetPose();
    const tgt = buildPose(this.ch, spec);
    for (const k of POSE_KEYS) this.pose[k] = lerp(this.pose[k], tgt[k], rate);
    this.sk = skeleton(this.pose, this.ch.dims);
    if (this.afterimage > 0) { this.afterimage--; if (this.T % 2 === 0 && !this.hidden) this.after.push({ pose: { ...this.pose }, x: this.x, y: this.y, facing: this.facing, life: 14 }); }
    for (const a of this.after) a.life--;
    this.after = this.after.filter(a => a.life > 0);
    if (this.hitShake > 0) this.hitShake--;
  }
  animOnly() { this.T++; if (this.flash > 0) this.flash--; this.animate(); }
  expr() {
    const s = this.state;
    if (s === 'hit' || s === 'grabbed') return 'hurt';
    if (s === 'knockdown') return this.ko ? 'ko' : 'hurt';
    if (s === 'defeat') return 'hurt';
    if (s === 'victory') return this.ch.id === 'yoru' ? 'closed' : this.ch.id === 'goro' ? 'shout' : 'grin';
    if (s === 'cine' || (s === 'attack' && (this.move.special || this.move.ult || this.move.lvl >= 3))) return 'shout';
    return 'normal';
  }
  glowing() { return this.rage > 0 || this.state === 'cine' || (this.state === 'attack' && (this.move.ult || this.move.lvl >= 5)) || (BT && BT.freeze && BT.freeze.F === this) || this.state === 'victory'; }
  draw(g) {
    const c = this.colors, T = this.T;
    const hgt = Math.max(0, GROUND - this.y), sc = 1 / (1 + hgt / 260);
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.ellipse(this.x, GROUND + 3, 46 * this.s * sc * (this.ch.wide || 1), 9 * sc, 0, 0, TAU); g.fill();
    if (this.hidden) return;
    if (this.ch.drawBehind) this.ch.drawBehind(g, this);   // optional layer behind the fighter (e.g. The Hollow's remnant)
    const acs = this.ch.afterColors;
    this.after.forEach((a, i) => { g.globalAlpha = a.life / 14 * (acs ? 0.6 : 0.42); drawFigure(g, this.ch, a.pose, a.x, a.y, a.facing, { mono: acs ? acs[i % acs.length] : c.accent }); });
    g.globalAlpha = 1;
    const ox = this.hitShake > 0 ? rand(-3, 3) : 0;
    const aura = !this.ko && (this.rage > 0 || this.meter >= 100 || this.state === 'cine' || (this.state === 'attack' && this.move.ult));
    if (aura && FX.hq) {
      g.save(); g.shadowColor = c.accent; g.shadowBlur = 26; g.globalAlpha = 0.45 + 0.2 * Math.sin(T * 0.3);
      drawFigure(g, this.ch, this.pose, this.x + ox, this.y, this.facing, { mono: c.accent, scale: 1.03 }); g.restore();
    }
    if (this.counterActive) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = this.ch.id === 'sera' ? '#7ff6ff' : '#ffffff'; g.globalAlpha = 0.5 + 0.3 * Math.sin(T * 0.8); g.lineWidth = 3;
      g.beginPath(); g.ellipse(this.x, this.y - 95 * this.s, 62 * this.s, 110 * this.s, 0, 0, TAU); g.stroke(); g.restore();
    }
    drawFigure(g, this.ch, this.pose, this.x + ox, this.y, this.facing, { pal: c, expr: this.expr(), glow: this.glowing(), T, ropes: this.ropes });
    if (this.armorActive()) { g.globalAlpha = 0.22 + 0.12 * Math.sin(T * 0.9); drawFigure(g, this.ch, this.pose, this.x + ox, this.y, this.facing, { mono: '#ff6a3a' }); g.globalAlpha = 1; }
    if (this.ch.drawExtra) this.ch.drawExtra(g, this);
    if (this.flash > 0) { g.globalAlpha = this.flash / 7 * 0.75; drawFigure(g, this.ch, this.pose, this.x + ox, this.y, this.facing, { mono: '#ffffff' }); g.globalAlpha = 1; }
  }
}

// ============================ PROJECTILES =============================
const SEAL_SLOTS = ['sp1', 'sp1f', 'counter', 'sp2', 'sp2f', 'sp2d'];
class Proj {
  constructor(o) {
    Object.assign(this, { vx: 0, vy: 0, w: 40, h: 40, life: 120, hits: 1, interval: 10, dmg: 50, hs: 18, bs: 12, kb: 6, type: 'mid', kd: 0, launch: 0, clash: 1, t: 0, hitT: 0, dead: false, str: 2, delay: 0, special: 1, harmless: false, rot: 0, grav: 0 }, o);
    this.max = this.life;
  }
  rect() {
    if (EXTRA_PROJ[this.kind] && EXTRA_PROJ[this.kind].rect) return EXTRA_PROJ[this.kind].rect(this);
    if (this.kind === 'beam') { const F = this.owner; const x0 = F.facing > 0 ? this.x + 60 : this.x - 60 - this.w; return { x: x0, y: this.y - this.h / 2, w: this.w, h: this.h }; }
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }
  active() { return !this.dead && this.delay <= 0 && !this.harmless; }
  update() {
    this.t++;
    if (this.delay > 0) {
      this.delay--;
      if (this.kind === 'pillar') { FX.p({ type: 'ember', x: this.x + rand(-40, 40), y: GROUND - rand(0, 10), vy: -rand(2, 5), life: 18, size: 2.5, color: this.color }); }
      if (EXTRA_PROJ[this.kind] && EXTRA_PROJ[this.kind].delay) EXTRA_PROJ[this.kind].delay(this);
      if (this.delay === 0 && this.kind === 'pillar') { Sound.play('thunder'); FX.shakeIt(8); FX.flashScreen('#d8fbff', 5, 0.3); FX.ring(this.x, GROUND, this.color, 10, 110, 14, 6, 0.25); FX.dust(this.x, GROUND, 8); }
      return;
    }
    if (this.kind === 'beam') {
      const F = this.owner; this.x = F.x; this.y = F.y - 118 * F.s;
      if (F.state !== 'attack') this.dead = true;
      if (this.t % 3 === 0) FX.shakeIt(5);
    }
    if (this.hitT > 0) this.hitT--;
    this.vy += this.grav;
    this.x += this.vx; this.y += this.vy; this.life--; this.rot += 0.45;
    if (EXTRA_PROJ[this.kind]) EXTRA_PROJ[this.kind].update(this);
    if (this.kind === 'log') { this.vy += 0.5; }
    if ((this.kind === 'kunai' || this.kind === 'shuriken') && this.y >= GROUND - 8) { this.dead = true; FX.burst(this.x, GROUND - 8, '#ccd', 6, 4); }
    if (this.life <= 0 || this.x < -120 || this.x > STAGE_W + 120) this.dead = true;
    const c = this.color;
    switch (this.kind) {
      case 'fireball': FX.flame(this.x - this.vx * 2, this.y, c, 2, 14, 1); break;
      case 'orb': FX.flame(this.x - this.vx * 3, this.y, c, 3, 24, 1.2); if (this.t % 6 === 0) FX.p({ type: 'bolt', x: this.x, y: this.y, x2: this.x + rand(-60, 60), y2: this.y + rand(-60, 60), size: 1.5, life: 4, color: '#9ff4ff' }); break;
      case 'kunai': case 'shuriken': if (this.t % 2 === 0) FX.p({ type: 'spark', x: this.x, y: this.y, vx: -this.vx * 0.2, vy: 0, life: 8, size: 2, color: c }); break;
      case 'quake': case 'quakeShort':
        if (this.t % 2 === 0) { FX.rocks(this.x, GROUND, 1, '#5a4a40'); FX.flame(this.x, GROUND - 6, c, 1, 20, 2.5); }
        if (this.t % 4 === 0) FX.dust(this.x, GROUND, 2); break;
      case 'pillar': FX.p({ type: 'bolt', x: this.x + rand(-20, 20), y: -300, x2: this.x + rand(-15, 15), y2: GROUND, size: 4, life: 3, color: c, jag: 40 }); break;
    }
  }
  draw(g) {
    const c = this.color, T = this.t;
    g.save();
    if (EXTRA_PROJ[this.kind]) { EXTRA_PROJ[this.kind].draw(g, this); g.restore(); return; }
    switch (this.kind) {
      case 'fireball': {
        g.globalCompositeOperation = 'lighter'; g.translate(this.x, this.y); g.scale(Math.sign(this.vx) || 1, 1);
        for (let i = 4; i >= 0; i--) { g.fillStyle = ['#5a0d02', '#c2240c', c, '#ffd27a', '#fffbe0'][4 - i]; g.globalAlpha = 0.9; g.beginPath(); g.ellipse(-i * 5, 0, 18 + i * 7 + Math.sin(T * 0.6 + i) * 3, 14 + i * 5, 0, 0, TAU); g.fill(); }
        g.globalAlpha = 0.5; g.fillStyle = c; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-10, -18 + i * 9); g.quadraticCurveTo(-45 - rand(0, 20), -24 + i * 12, -70 - rand(0, 20), -10 + i * 5); g.lineTo(-10, -14 + i * 9); g.fill(); }
        break;
      }
      case 'orb': {
        g.globalCompositeOperation = 'lighter'; g.translate(this.x, this.y);
        const gr = g.createRadialGradient(0, 0, 4, 0, 0, 52); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, '#ffd27a'); gr.addColorStop(0.6, c); gr.addColorStop(1, 'rgba(120,20,0,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 52 + Math.sin(T * 0.4) * 4, 0, TAU); g.fill();
        g.strokeStyle = '#8ff6ff'; g.lineWidth = 2; g.globalAlpha = 0.8; g.beginPath(); g.ellipse(0, 0, 46, 16, T * 0.15, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(0, 0, 46, 16, -T * 0.12 + 1, 0, TAU); g.stroke();
        break;
      }
      case 'kunai': {
        g.translate(this.x, this.y); g.rotate(Math.atan2(this.vy, this.vx));
        g.strokeStyle = c; g.globalAlpha = 0.5; g.lineWidth = 6; g.beginPath(); g.moveTo(-40, 0); g.lineTo(0, 0); g.stroke(); g.globalAlpha = 1;
        poly(g, [[-14, -3], [8, -4], [20, 0], [8, 4], [-14, 3]], '#d5dae8', { ol: 1.5 }); circ(g, -18, 0, 4, '#2c2d40', { ol: 1.2 });
        break;
      }
      case 'shuriken': {
        g.translate(this.x, this.y); g.rotate(this.rot);
        g.shadowColor = c; g.shadowBlur = 12;
        poly(g, [[0, -16], [4, -4], [16, 0], [4, 4], [0, 16], [-4, 4], [-16, 0], [-4, -4]], '#cfd4e6', { ol: 1.5 }); g.shadowBlur = 0; circ(g, 0, 0, 3, '#2c2d40', { ol: 1 });
        break;
      }
      case 'pillar': {
        if (this.delay > 0) {
          const k = 1 - this.delay / 30; g.globalCompositeOperation = 'lighter';
          g.strokeStyle = c; g.globalAlpha = 0.5 + 0.5 * Math.sin(T * 0.8); g.lineWidth = 3;
          g.beginPath(); g.ellipse(this.x, GROUND, 50 * k + 10, 12 * k + 3, 0, 0, TAU); g.stroke();
          g.globalAlpha = 0.15; g.fillStyle = c; g.fillRect(this.x - 30 * k, -300, 60 * k, GROUND + 300);
        } else {
          const k = this.life / this.max; g.globalCompositeOperation = 'lighter';
          const gr = g.createLinearGradient(this.x - this.w, 0, this.x + this.w, 0);
          gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.35, c); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(0.65, c); gr.addColorStop(1, 'rgba(0,0,0,0)');
          g.globalAlpha = k; g.fillStyle = gr; g.fillRect(this.x - this.w, -400, this.w * 2, GROUND + 400);
          drawBolt(g, this.x + rand(-10, 10), -400, this.x, GROUND, '#ffffff', 5, 40, 5);
        }
        break;
      }
      case 'quake': case 'quakeShort': {
        g.translate(this.x, GROUND);
        for (let i = 0; i < 4; i++) { const hh = 22 + ((T * 7 + i * 13) % 30); poly(g, [[-30 + i * 16, 0], [-22 + i * 16, -hh], [-12 + i * 16, 0]], '#4a3c34', { ol: 1.5 }); }
        g.globalCompositeOperation = 'lighter'; g.fillStyle = c; g.globalAlpha = 0.5; g.beginPath(); g.ellipse(0, 0, 45, 10, 0, 0, TAU); g.fill();
        break;
      }
      case 'beam': {
        const r = this.rect(), k = Math.min(1, this.t / 6), fade = Math.min(1, this.life / 12);
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = fade;
        const hh = this.h * k * (0.9 + 0.1 * Math.sin(T * 1.3));
        const gr = g.createLinearGradient(0, this.y - hh, 0, this.y + hh);
        gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.3, c); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(0.7, c); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(r.x, this.y - hh, r.w, hh * 2);
        g.fillStyle = '#ffffff'; g.fillRect(r.x, this.y - hh * 0.18, r.w, hh * 0.36);
        const ox = this.owner.facing > 0 ? r.x : r.x + r.w;
        const og = g.createRadialGradient(ox, this.y, 0, ox, this.y, 120); og.addColorStop(0, '#fff'); og.addColorStop(0.4, c); og.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = og; g.beginPath(); g.arc(ox, this.y, 120, 0, TAU); g.fill();
        for (let i = 0; i < 3; i++) { const x1 = ox, x2 = ox + this.owner.facing * rand(300, 1400); drawBolt(g, x1, this.y + rand(-30, 30), x2, this.y + rand(-80, 80), c, 2.5, 50, 5); }
        break;
      }
      case 'log': {
        g.translate(this.x, this.y); g.rotate(this.t * 0.15);
        limb(g, [-22, 0], [22, 0], 11, 11, '#8a5a32', { ol: 2.4 }); circ(g, 22, 0, 8, '#c8955f', { ol: 2 });
        break;
      }
    }
    g.restore();
  }
}
