// ============================ TUTORIAL (2026-11-26) ============================
// Guided first steps for new players: 10 short lessons on a training stage with Kazuma vs a dummy.
// Movement, jump, dash, L/M/H, block high/low, throw, throw tech, specials (incl. directional ones),
// ultimate and a first combo. Each lesson shows its steps with the right buttons for the device in use
// (keyboard keys from SETTINGS → CONTROLS, controller buttons from SETTINGS → CONTROLLER, or the touch pad:
// DASH button, SP swipes, GRAB, ULT) and highlights the touch buttons. Steps tick off from real game events.
// Skippable: SKIP pill (click / tap) or pause menu → SKIP LESSON / EXIT TUTORIAL.
// Entry points: title menu TUTORIAL, and a one-time offer on the very first launch (fresh save only).
Settings.tutSeen = false; Settings.tutDone = false;
Settings.KEYS.push('tutSeen', 'tutDone');
try { const s = JSON.parse(localStorage.getItem('soulbreakers_v1') || 'null'); if (s) { if ('tutSeen' in s) Settings.tutSeen = s.tutSeen; if ('tutDone' in s) Settings.tutDone = s.tutDone; } } catch (e) { /* storage unavailable */ }

// device the player uses right now: 'touch' | 'pad' | 'kb'
function tutDevice(bt) {
  if (typeof Pad !== 'undefined' && Pad.active()) return 'pad';
  if (bt && bt.touch) return 'touch';
  return 'kb';
}
// names for every input on the current device. F/B are forward/back relative to the fighter's facing.
function tutNames(bt) {
  const dev = tutDevice(bt), fac = bt.p1.facing >= 0 ? 1 : -1;
  const arF = fac > 0 ? '▶' : '◀', arB = fac > 0 ? '◀' : '▶';
  if (dev === 'kb') {
    const k = a => keyName(B(1, a));
    return { dev, F: k(fac > 0 ? 'right' : 'left'), B: k(fac > 0 ? 'left' : 'right'), D: k('down'), U: k('up'), UF: k('up') + ' + ' + k(fac > 0 ? 'right' : 'left'),
      L: k('light'), M: k('medium'), H: k('heavy'), S1: k('sp1'), S2: k('sp2'), BL: k('block'), ULT: [k('sp1'), '+', k('sp2')], GRAB: [k('medium'), '+', k('heavy')] };
  }
  if (dev === 'pad') {
    const btn = a => { const i = Object.keys(Settings.padMap).find(j => Settings.padMap[j] === a); return i == null ? '?' : Pad.name(+i); };
    return { dev, F: arF, B: arB, D: '▼', U: '▲', UF: fac > 0 ? '◥' : '◤',
      L: btn('light'), M: btn('medium'), H: btn('heavy'), S1: btn('sp1'), S2: btn('sp2'), BL: btn('block'), ULT: [btn('ult')], GRAB: [btn('grab')] };
  }
  return { dev, F: 'STICK ' + arF, B: 'STICK ' + arB, D: 'STICK ▼', U: 'STICK ▲', UF: 'STICK ' + (fac > 0 ? '◥' : '◤'), arF, arB,
    L: 'L', M: 'M', H: 'H', S1: 'SP1', S2: 'SP2', BL: 'BLOCK', ULT: ['ULT'], GRAB: ['GRAB'] };
}

// step: { name, n (count or frames), keys(d) → chips ('+', '→', ',' are plain text), touch: [button ids to highlight], ev / poll }
const TUT_LESSONS = [
  { title: 'MOVE', jp: '移動', tip: 'Walk towards the dummy and back. Hold down to crouch.', steps: [
    { name: 'Walk forward (hold)', n: 40, frames: 1, keys: d => [d.F], poll: bt => bt.p1.state === 'walk' && bt.p1.input.fwd > 0 },
    { name: 'Walk back (hold)', n: 40, frames: 1, keys: d => [d.B], poll: bt => bt.p1.state === 'walk' && bt.p1.input.fwd < 0 },
    { name: 'Crouch (hold)', n: 25, frames: 1, keys: d => [d.D], poll: bt => bt.p1.state === 'crouch' },
  ] },
  { title: 'JUMP', jp: '跳躍', tip: 'Jumps get you over low attacks and projectiles.', steps: [
    { name: 'Jump', n: 2, keys: d => [d.U], ev: 'jump' },
    { name: 'Jump forward', n: 1, keys: d => d.dev === 'kb' ? [d.U, '+', d.F] : [d.UF], ev: 'jumpF' },
  ] },
  { title: 'DASH', jp: 'ダッシュ', tip: 'Dash in fast, back dash to escape pressure.', steps: [
    { name: 'Dash forward', n: 2, keys: d => d.dev === 'touch' ? ['DASH'] : [d.F, d.F], hint: d => d.dev === 'touch' ? 'or flick the stick forward twice' : 'tap forward twice', touch: ['dash'], ev: 'dash' },
    { name: 'Back dash', n: 1, keys: d => d.dev === 'touch' ? [d.B, '+', 'DASH'] : [d.B, d.B], hint: d => d.dev === 'touch' ? 'hold the stick back, tap DASH' : 'tap back twice', touch: ['dash'], ev: 'backdash' },
  ] },
  { title: 'ATTACKS', jp: '通常技', tip: 'Light is fast, Medium is safe, Heavy hits hard. Crouch + Heavy sweeps.', steps: [
    { name: 'Light attack', n: 1, keys: d => [d.L], touch: ['light'], ev: 'move:L' },
    { name: 'Medium attack', n: 1, keys: d => [d.M], touch: ['medium'], ev: 'move:M' },
    { name: 'Heavy attack', n: 1, keys: d => [d.H], touch: ['heavy'], ev: 'move:H' },
    { name: 'Sweep (low)', n: 1, keys: d => [d.D, '+', d.H], touch: ['heavy'], ev: 'move:cH' },
  ] },
  { title: 'BLOCK', jp: '防御', tip: 'The dummy attacks now! Hold BLOCK. Low kicks must be blocked crouching.', dummy: ['attackHigh', 'attackLow'], steps: [
    { name: 'Block high attacks', n: 3, keys: d => [d.BL], hint: () => 'hold it', touch: ['block'], ev: 'blockHigh' },
    { name: 'Block low kicks crouching', n: 2, keys: d => [d.D, '+', d.BL], touch: ['block'], ev: 'blockLow' },
  ] },
  { title: 'THROW', jp: '投げ', tip: 'The dummy blocks everything. A throw beats blocking, but only up close.', dummy: ['guard'], steps: [
    { name: 'Throw (stand close)', n: 2, keys: d => d.GRAB, hint: d => d.dev === 'kb' ? 'both at once' : '', touch: ['grab'], ev: 'throw' },
  ] },
  { title: 'THROW TECH', jp: '投げ抜け', tip: 'Now the dummy grabs you. Escape with the throw input right when you get grabbed.', dummy: ['thrower'], steps: [
    { name: 'Break the throw', n: 2, keys: d => d.GRAB, hint: () => 'press when grabbed', touch: ['grab'], ev: 'tech' },
  ] },
  { title: 'SPECIALS', jp: '必殺技', tip: 'Every fighter has 6 specials on SP1 / SP2. Directions change the move.', steps: [
    { name: 'Special 1', n: 1, keys: d => d.dev === 'touch' ? ['SP1'] : [d.S1], hint: d => d.dev === 'touch' ? 'tap' : '', touch: ['sp1'], ev: 'move:sp1' },
    { name: 'Forward special', n: 1, keys: d => d.dev === 'touch' ? ['SP1', 'swipe ' + d.arF] : [d.D, ',', d.F, '+', d.S1], hint: d => d.dev === 'touch' ? '' : 'down, forward', touch: ['sp1'], ev: 'move:sp1f' },
    { name: 'Counter stance', n: 1, keys: d => d.dev === 'touch' ? ['SP1', 'swipe ' + d.arB] : [d.D, ',', d.B, '+', d.S1], hint: d => d.dev === 'touch' ? '' : 'down, back', touch: ['sp1'], ev: 'move:counter' },
    { name: 'Special 2', n: 1, keys: d => d.dev === 'touch' ? ['SP2'] : [d.S2], hint: d => d.dev === 'touch' ? 'tap' : '', touch: ['sp2'], ev: 'move:sp2' },
    { name: 'Down special', n: 1, keys: d => d.dev === 'touch' ? ['SP2', 'swipe ▼'] : [d.D, ',', d.D, '+', d.S2], hint: d => d.dev === 'touch' ? '' : 'down twice', touch: ['sp2'], ev: 'move:sp2d' },
  ] },
  { title: 'ULTIMATE', jp: '超必殺技', tip: 'The 魂 SOUL gauge fills when you hit or block. Full gauge = ultimate!', steps: [
    { name: 'Ultimate (full gauge)', n: 1, keys: d => d.ULT, touch: ['ult'], ev: 'move:ult' },
  ] },
  { title: 'FIRST COMBO', jp: '連続技', tip: 'Stand close. Chain attacks: press the next one while the last one hits.', steps: [
    { name: 'Light → Medium → Heavy', n: 1, keys: d => [d.L, '→', d.M, '→', d.H], touch: ['light', 'medium', 'heavy'], ev: 'combo3' },
    { name: '... → Special 1 (4 hits)', n: 1, keys: d => [d.L, '→', d.M, '→', d.H, '→', d.dev === 'touch' ? 'SP1' : d.S1], touch: ['light', 'medium', 'heavy', 'sp1'], ev: 'combo4' },
  ] },
];
const TUT_SKIP = { x: W / 2 + 268, y: 152, w: 104, h: 30 };

class TutorialBattle extends Battle {
  constructor() {
    const p1 = Math.max(0, CHARS.findIndex(c => c.id === 'kazuma')), p2 = Math.max(0, CHARS.findIndex(c => c.id === 'yoru'));
    super({ mode: 'practice', tutorial: true, p1, p2, stage: 0 });
    this.tutorial = true; this.les = 0; this.prog = []; this.clearT = 0; this.done = false; this.endMenu = null; this.dAI = { t: 0 };
    this.startLesson(0);
  }
  get lesson() { return TUT_LESSONS[this.les]; }
  stepIdx() { return this.prog.findIndex((c, i) => c < this.lesson.steps[i].n); }
  startLesson(i) {
    this.les = i; this.prog = TUT_LESSONS[i].steps.map(() => 0); this.clearT = 0; this.dAI = { t: 0 };
    this.resetPositions(false); this.p1.meter = TUT_LESSONS[i].title === 'ULTIMATE' ? 100 : this.p1.meter;
    FX.announce(`LESSON ${i + 1}`, { sub: TUT_LESSONS[i].title, size: 70, life: 70, y: H / 2 + 40, color: '#ffd84a', glow: '#ff2a55' });
  }
  newRound(first) {
    super.newRound(first);
    const bt = this, A = this.p1, sm = A.startMove;
    A.startMove = function (k, forced) { const r = sm.call(this, k, forced); bt.tutEv('move:' + k); return r; };
    this.prevSt = A.state; this.prevCine = null;
  }
  tutEv(ev) {
    if (!this.prog || this.clearT || this.done) return;
    const i = this.stepIdx(); if (i < 0) return;
    const s = this.lesson.steps[i]; if (s.ev !== ev) return;
    this.prog[i]++;
    if (this.prog[i] >= s.n) { Sound.play('menuOk'); FX.wtext(this.p1.x, this.p1.y - 250, 'GOOD!', { size: 30, color: '#bfffd0', stroke: '#18a85a', life: 40 }); }
    this.checkClear();
  }
  checkClear() {
    if (this.stepIdx() >= 0 || this.clearT) return;
    this.clearT = 1; Sound.play('perfect');
    FX.announce('CLEAR!', { sub: 'よし！', size: 96, life: 70, y: H / 2 - 60, color: '#bfffd0', glow: '#18a85a' });
  }
  nextLesson() {
    if (this.les + 1 < TUT_LESSONS.length) { this.startLesson(this.les + 1); return; }
    this.done = true; this.phase = 'matchEnd'; Settings.tutDone = true; Settings.tutSeen = true; Settings.save();
    Sound.play('victory');
    this.endMenu = new MenuList([{ id: 'practice', label: 'PRACTICE  (any fighter)', jp: '練習' }, { id: 'cpu', label: '1P VS CPU', jp: '一人用' }, { id: 'again', label: 'TUTORIAL AGAIN', jp: '再挑戦' }, { id: 'menu', label: 'MAIN MENU', jp: 'メニュー' }], W / 2, 330, { w: 460, h: 48, gap: 10 });
  }
  resolveHit(A, D, hd, o) {
    const r = super.resolveHit(A, D, hd, o);
    if (D === this.p1 && D.state === 'block' && D.blockstun > 0) this.tutEv(hd.type === 'low' ? 'blockLow' : 'blockHigh');
    return r;
  }
  update() {
    if (this.done) {
      this.pf++; this.inputs[0].enabled = this.inputs[1].enabled = false; this.stepSim(); this.cam.update(this);
      const it = this.endMenu.update(); if (!it) return;
      Sound.play('menuOk'); FX.reset();
      if (it.id === 'practice') go(new CharSelectScene('practice'));
      if (it.id === 'cpu') go(new CpuSetupScene());
      if (it.id === 'again') go(new TutorialBattle());
      if (it.id === 'menu') go(new TitleScene());
      return;
    }
    if (!this.paused && (this.tutSkip || (Mouse.clicked && inRect(TUT_SKIP)))) { this.tutSkip = false; Mouse.clicked = false; Sound.play('menuOk'); this.nextLesson(); return; }
    super.update();
    if (this.paused) { tutPatchPause(this); return; }
    if (scene !== this) return;
    const A = this.p1, st = A.state;
    // state-change events
    if (st !== this.prevSt) {
      if (st === 'jump' && this.prevSt !== 'jump') { if (A.vx * A.facing > 1) this.tutEv('jumpF'); this.tutEv('jump'); }
      if (st === 'dash') this.tutEv('dash');
      if (st === 'backdash') this.tutEv('backdash');
    }
    this.prevSt = st;
    const c = this.cine;
    if (c && c !== this.prevCine && c.thr && c.A === A) this.tutEv('throw');
    this.prevCine = c;
    if ((A.stats.techs || 0) > (this.techs || 0)) { this.techs = A.stats.techs; this.tutEv('tech'); }
    const D = this.p2;
    if (D.comboHits >= 3) this.tutEv('combo3');
    if (D.comboHits >= 4) this.tutEv('combo4');
    // hold-type steps count frames
    const i = this.stepIdx();
    if (i >= 0 && !this.clearT) { const s = this.lesson.steps[i]; if (s.poll && s.poll(this)) { this.prog[i]++; if (this.prog[i] >= s.n) Sound.play('menuOk'); this.checkClear(); } }
    if (this.clearT && ++this.clearT > 80) this.nextLesson();
  }
  practiceUpdate() {
    super.practiceUpdate();
    const A = this.p1, D = this.p2, ai = this.dAI, les = this.lesson, v = this.inputs[1].virtual;
    for (const k in A.cd) if (A.cd[k] > 20) A.cd[k] = 20;
    if (les.title === 'ULTIMATE' && A.meter < 100 && !(A.state === 'attack' && A.move && A.move.ult) && !this.cine) A.meter = Math.min(100, A.meter + 3);
    if (!les.dummy || this.clearT || this.done) return;
    const i = this.stepIdx(), role = les.dummy[Math.min(Math.max(0, i), les.dummy.length - 1)];
    if (role === 'guard') { D.autoBlock = true; return; }
    ai.t++;
    const dist = Math.abs(D.x - A.x), want = role === 'thrower' ? 66 : 84;
    const free = D.onGround && FREE_GROUND.includes(D.state) && !this.cine;
    if (free && dist > want) { if (D.x > A.x) v.l = true; else v.r = true; return; }
    if (!free || ai.t < (role === 'thrower' ? 80 : 55)) return;
    if (role === 'thrower' && !(A.onGround && FREE_GROUND.includes(A.state))) return;
    ai.t = 0;
    D.facing = A.x > D.x ? 1 : -1;
    D.startMove(role === 'attackLow' ? 'cM' : role === 'thrower' ? 'THROW' : 'L');
  }
  draw(g) {
    super.draw(g);
    if (this.paused) return;
    if (this.done) { this.drawEnd(g); return; }
    this.drawPanel(g);
  }
  drawPanel(g) {
    const les = this.lesson, d = tutNames(this), cur = this.stepIdx();
    const x = W / 2 - 380, y = 146, w = 760, rows = les.steps.length, h = 74 + rows * 34;
    g.save();
    panel(g, x, y, w, h, 'rgba(10,6,24,0.86)', 'rgba(255,216,74,0.5)');
    g.textBaseline = 'middle'; g.textAlign = 'left';
    const ttl = `LESSON ${this.les + 1}/${TUT_LESSONS.length} · ${les.title}`;
    g.font = `italic 900 22px ${FONT_T}`; const tw0 = g.measureText(ttl).width; strokeText(g, ttl, x + 22, y + 22, '#ffd84a', OUTLINE, 4);
    g.font = `700 13px ${FONT_JP}`; g.fillStyle = 'rgba(255,170,190,0.8)'; g.fillText(les.jp, x + 36 + tw0, y + 23);
    g.font = `700 15px ${FONT_UI}`; g.fillStyle = '#e8dcff'; g.fillText(les.tip, x + 22, y + 50);
    les.steps.forEach((s, i) => {
      const ry = y + 84 + i * 34, ok = this.prog[i] >= s.n, on = i === cur;
      g.globalAlpha = ok ? 0.55 : on ? 1 : 0.4;
      g.font = `900 18px ${FONT_UI}`; g.fillStyle = ok ? '#5affb0' : on ? '#ffd84a' : '#a89ec8';
      g.fillText(ok ? '✔' : on ? '▶' : '•', x + 24, ry);
      g.font = `800 16px ${FONT_UI}`; g.fillStyle = '#ffffff'; g.fillText(s.name, x + 50, ry);
      // chips
      let cx = x + 310;
      for (const c of s.keys(d)) {
        if (c === '+' || c === '→' || c === ',') { g.font = `900 16px ${FONT_UI}`; g.fillStyle = '#ffd84a'; g.fillText(c, cx, ry); cx += g.measureText(c).width + 8; continue; }
        g.font = `900 14px ${FONT_UI}`; const tw = g.measureText(c).width + 18;
        g.fillStyle = on ? 'rgba(255,216,74,0.18)' : 'rgba(255,255,255,0.08)'; g.strokeStyle = on ? '#ffd84a' : 'rgba(255,255,255,0.35)'; g.lineWidth = 2;
        g.beginPath(); g.roundRect ? g.roundRect(cx, ry - 13, tw, 26, 6) : g.rect(cx, ry - 13, tw, 26); g.fill(); g.stroke();
        g.fillStyle = '#ffffff'; g.fillText(c, cx + 9, ry + 1); cx += tw + 6;
      }
      const hint = s.hint && s.hint(d);
      if (hint) { g.font = `700 12px ${FONT_UI}`; g.fillStyle = '#c8bce8'; g.fillText(hint, cx + 4, ry + 1); }
      // progress
      g.textAlign = 'right'; g.font = `800 14px ${FONT_UI}`; g.fillStyle = ok ? '#5affb0' : '#ffffff';
      g.fillText(s.frames ? `${Math.min(100, Math.round(this.prog[i] / s.n * 100))}%` : `${Math.min(this.prog[i], s.n)}/${s.n}`, x + w - 22, ry);
      g.textAlign = 'left';
    });
    g.globalAlpha = 1;
    // skip pill
    const r = TUT_SKIP, hov = inRect(r);
    g.fillStyle = hov ? 'rgba(255,90,120,0.9)' : 'rgba(30,16,56,0.9)'; g.strokeStyle = '#ffffff'; g.lineWidth = 1.5;
    g.beginPath(); g.roundRect ? g.roundRect(r.x, r.y, r.w, r.h, 8) : g.rect(r.x, r.y, r.w, r.h); g.fill(); g.stroke();
    g.textAlign = 'center'; g.font = `900 14px ${FONT_UI}`; g.fillStyle = '#ffffff'; g.fillText('SKIP  ▶▶', r.x + r.w / 2, r.y + r.h / 2 + 1);
    g.restore();
    // touch: pulse the buttons for the current step
    if (this.touch && d.dev === 'touch' && cur >= 0 && typeof TOUCH_BTNS !== 'undefined') {
      const want = les.steps[cur].touch || [];
      g.save(); g.strokeStyle = '#ffd84a'; g.lineWidth = 5;
      for (const b of TOUCH_BTNS) if (want.includes(b.a)) { g.globalAlpha = 0.5 + 0.4 * Math.sin(this.pf * 0.18); g.beginPath(); g.arc(b.x, b.y, b.r + 10 + 3 * Math.sin(this.pf * 0.18), 0, TAU); g.stroke(); }
      if (!want.length) { g.globalAlpha = 0.5 + 0.4 * Math.sin(this.pf * 0.18); g.beginPath(); g.arc(STICK.x, STICK.y, STICK.R + 12, 0, TAU); g.stroke(); }
      g.restore();
    }
  }
  drawEnd(g) {
    g.save(); g.fillStyle = 'rgba(5,2,14,0.72)'; g.fillRect(0, 0, W, H);
    drawTitleText(g, 'TUTORIAL COMPLETE!', W / 2, 170, 72, '#bfffd0', '#18a85a');
    g.font = `700 18px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = '#e8dcff';
    g.fillText('You know the basics. Every fighter plays differently: try them in PRACTICE,', W / 2, 250);
    g.fillText('check the COMBO LIST in the pause menu, then fight the CPU.', W / 2, 278);
    this.endMenu.draw(g, this.pf);
    g.restore();
  }
}
// pause menu in the tutorial: SKIP LESSON, no character select / training options, MAIN MENU = exit
function tutPatchPause(bt) {
  const m = bt.pauseMenu; if (!m || m._tut) return;
  if (typeof cbPatchMenu === 'function') cbPatchMenu(bt);
  m._tut = 1;
  m.items = m.items.filter(it => it.id !== 'select' && it.id !== 'topts');
  m.items.splice(1, 0, { id: 'tskip', label: 'SKIP LESSON', jp: '次へ' });
  const mi = m.items.find(it => it.id === 'menu'); if (mi) { mi.label = 'EXIT TUTORIAL'; }
  const mu = m.update.bind(m);
  m.update = () => {
    const it = mu();
    if (it && it.id === 'tskip') { Sound.play('menuOk'); bt.paused = false; bt.nextLesson(); return null; }
    if (it && it.id === 'menu') { Settings.tutSeen = true; Settings.save(); }
    return it;
  };
}
// touch: the SKIP pill is tappable during the battle
{
  const _down = TouchPad.down;
  TouchPad.down = function (id, p) {
    if (this.bt && this.bt.tutorial && !this.bt.done && this.inR(p, TUT_SKIP)) { this.bt.tutSkip = true; this.touches.set(id, { kind: 'none' }); return; }
    return _down.call(this, id, p);
  };
}
// the tech window is wider for beginners while the tutorial teaches it
{
  const _thr = CINE.throwT;
  CINE.throwT = function (A, D, f, c) {
    if (BT && BT.tutorial && D === BT.p1 && f > 1 && f <= 24 && !c.clash && D.input.p('medium') && D.input.p('heavy')) { D.input.use('medium'); D.input.use('heavy'); return throwTech(A, D, c); }
    return _thr(A, D, f, c);
  };
}

// ---------------- title: TUTORIAL menu item + one-time offer on the first launch ----------------
function tutFreshPlayer() {
  try { if (typeof Mastery !== 'undefined' && Mastery.d && Object.keys(Mastery.d.chars || {}).length) return false; } catch (e) { }
  if (typeof Cloud !== 'undefined' && Cloud.on) return false;
  if (typeof netJoinPending !== 'undefined' && netJoinPending) return false;
  if (navigator.webdriver && !window.SB_TUT_OFFER) return false;   // headless tests start on the plain title
  return true;
}
{
  const TP = TitleScene.prototype, up = TP.update, dr = TP.draw;
  TP.tutMenu = function () {
    if (this.tutAdded) return;
    this.netMenu && this.netMenu(); this.cosMenu && this.cosMenu();
    this.tutAdded = true;
    const m = this.menu, items = m.items;
    if (!items.some(i => i.id === 'tutorial')) {
      const hi = items.findIndex(i => i.id === 'howto');
      items.splice(hi < 0 ? items.length - 1 : hi, 0, { id: 'tutorial', label: 'TUTORIAL', jp: '入門', value: Settings.tutDone ? '✔' : 'NEW' });
    }
    if (items.length > 8) { m.y = 290; m.h = 36; m.gap = 5; }
    const mu = m.update.bind(m);
    m.update = () => { const it = mu(); if (it && it.id === 'tutorial') { Sound.play('menuOk'); Settings.tutSeen = true; Settings.save(); go(new TutorialBattle()); return null; } return it; };
    if (!Settings.tutSeen && !TP.tutAsked && tutFreshPlayer()) {
      TP.tutAsked = true;
      this.tutOffer = new MenuList([{ id: 'yes', label: 'START TUTORIAL', jp: '入門' }, { id: 'no', label: 'NOT NOW', jp: '後で' }], W / 2, 400, { w: 420, h: 50, gap: 12 });
    }
  };
  TP.update = function () {
    this.tutMenu();
    if (this.tutOffer) {
      this.t++;
      const it = this.tutOffer.update() || (UI.back() ? { id: 'no' } : null);
      if (it) {
        Sound.play(it.id === 'yes' ? 'menuOk' : 'menuBack'); Mouse.clicked = false; this.tutOffer = null;
        Settings.tutSeen = true; Settings.save();
        if (it.id === 'yes') go(new TutorialBattle());
      }
      return;
    }
    return up.call(this);
  };
  TP.draw = function (g) {
    this.tutMenu();
    dr.call(this, g);
    if (!this.tutOffer) return;
    g.save(); g.fillStyle = 'rgba(5,2,14,0.75)'; g.fillRect(0, 0, W, H);
    panel(g, W / 2 - 330, 220, 660, 290, 'rgba(14,8,30,0.95)', 'rgba(255,216,74,0.6)');
    drawTitleText(g, 'NEW HERE?', W / 2, 270, 52, '#ffd84a', '#ff2a3a');
    g.font = `700 17px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#e8dcff';
    g.fillText('A short tutorial teaches moving, blocking, throws, specials and combos.', W / 2, 330);
    g.fillText('About 5 minutes. You can find it later in the main menu.', W / 2, 356);
    this.tutOffer.draw(g, this.t);
    g.restore();
  };
}
