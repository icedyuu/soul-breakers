// =============================== SCENES ===============================
class MenuList {
  constructor(items, x, y, o = {}) { this.items = items; this.sel = 0; this.x = x; this.y = y; this.w = o.w || 380; this.h = o.h || 52; this.gap = o.gap || 12; this.navKeys = o.navKeys; }
  rect(i) { return { x: this.x - this.w / 2, y: this.y + i * (this.h + this.gap), w: this.w, h: this.h }; }
  update() {
    const n = this.items.length;
    const up = this.navKeys ? pressedAny('ArrowUp') : UI.up() || pressedAny(B(2, 'up'));
    const dn = this.navKeys ? pressedAny('ArrowDown') : UI.down() || pressedAny(B(2, 'down'));
    if (up) { this.sel = (this.sel + n - 1) % n; Sound.play('menuMove'); }
    if (dn) { this.sel = (this.sel + 1) % n; Sound.play('menuMove'); }
    for (let i = 0; i < n; i++) {
      if (!inRect(this.rect(i))) continue;
      if (Mouse.moved && this.sel !== i) { this.sel = i; Sound.play('menuMove'); }
      if (Mouse.clicked) { this.sel = i; return this.items[i]; }
    }
    const ok = this.navKeys ? pressedAny('Enter', 'Space') : UI.ok();
    return ok ? this.items[this.sel] : null;
  }
  draw(g, t) { this.items.forEach((it, i) => drawButton(g, this.rect(i), it.label, it.jp, i === this.sel, t, it.value)); }
}
function drawButton(g, r, label, jp, sel, t, value) {
  if (Settings.pixel) return drawButtonPx(g, r, label, jp, sel, t, value);
  g.save();
  const sk = 16;
  g.beginPath(); g.moveTo(r.x + sk, r.y); g.lineTo(r.x + r.w, r.y); g.lineTo(r.x + r.w - sk, r.y + r.h); g.lineTo(r.x, r.y + r.h); g.closePath();
  if (sel) {
    const gr = g.createLinearGradient(r.x, 0, r.x + r.w, 0); gr.addColorStop(0, '#ff2a55'); gr.addColorStop(1, '#ff8a1a');
    g.fillStyle = gr; g.shadowColor = '#ff3a5a'; g.shadowBlur = 22; g.fill(); g.shadowBlur = 0;
    g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.stroke();
  } else { g.fillStyle = 'rgba(14,8,30,0.82)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1.5; g.stroke(); }
  g.textBaseline = 'middle'; g.textAlign = 'left';
  g.font = `italic 900 ${Math.round(r.h * 0.5)}px ${FONT_T}`;
  strokeText(g, label, r.x + 28 + (sel ? Math.sin(t * 0.2) * 2 + 4 : 0), r.y + r.h / 2 + 1, sel ? '#ffffff' : '#d8cff5', OUTLINE, sel ? 5 : 0);
  if (value !== undefined) { g.textAlign = 'right'; g.font = `800 ${Math.round(r.h * 0.4)}px ${FONT_UI}`; g.fillStyle = sel ? '#fff' : '#ffd84a'; g.fillText(value, r.x + r.w - 30, r.y + r.h / 2 + 1); }
  else if (jp) { g.textAlign = 'right'; g.font = `700 ${Math.round(r.h * 0.32)}px ${FONT_JP}`; g.fillStyle = sel ? 'rgba(255,255,255,0.9)' : 'rgba(200,180,255,0.55)'; g.fillText(jp, r.x + r.w - 30, r.y + r.h / 2 + 1); }
  if (sel) { g.fillStyle = '#ffffff'; g.beginPath(); const ax = r.x - 8 + Math.sin(t * 0.25) * 4, ay = r.y + r.h / 2; g.moveTo(ax, ay - 9); g.lineTo(ax + 12, ay); g.lineTo(ax, ay + 9); g.fill(); }
  g.restore();
}
// big character renders in menus go through the same pixel-art pass as the fighters in battle
function artFigure(g, x, y, sc, fn) { if (!Settings.pixel) return fn(g); PIX.init(); PIX.sprite(g, x - 165 * sc, y - 270 * sc, 330 * sc, 290 * sc, fn); }
function drawButtonPx(g, r, label, jp, sel, t, value) {
  g.save();
  const x = snap2(r.x), y = snap2(r.y), w = snap2(r.w), h = snap2(r.h), bump = sel ? 6 : 0;
  if (sel) pxBox(g, x + bump, y, w, h, '#ff2a55', '#ffffff', { bands: ['#ff9a5a', '#ff6a3a', '#ff3a4a', '#ff2a55', '#e01a50', '#b8103e'] });
  else pxBox(g, x, y, w, h, 'rgba(14,8,30,0.88)', 'rgba(150,130,210,0.45)');
  g.textBaseline = 'middle'; g.textAlign = 'left';
  g.font = `italic 900 ${Math.round(h * 0.5)}px ${FONT_T}`;
  strokeText(g, label, x + 26 + bump, y + h / 2, sel ? '#ffffff' : '#d8cff5', OUTLINE, sel ? 4 : 0);
  if (value !== undefined) { g.textAlign = 'right'; g.font = `800 ${Math.round(h * 0.4)}px ${FONT_UI}`; g.fillStyle = sel ? '#fff' : '#ffd84a'; g.fillText(value, x + w - 26 + bump, y + h / 2 + 1); }
  else if (jp) { g.textAlign = 'right'; g.font = `700 ${Math.round(h * 0.32)}px ${FONT_JP}`; g.fillStyle = sel ? 'rgba(255,255,255,0.9)' : 'rgba(200,180,255,0.55)'; g.fillText(jp, x + w - 26 + bump, y + h / 2 + 1); }
  if (sel) { const ax = x - 14 + ((t >> 3) % 2) * 4, ay = y + h / 2; g.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) g.fillRect(ax + i * 2, ay - 10 + i * 2, 2, 20 - i * 4); }
  g.restore();
}
function drawMenuBG(g, t, tint = '#ff2a55') {
  const idx = Math.floor(t / 520) % STAGES.length, pan = (t % 520) / 520;
  g.drawImage(STAGES[idx].wide, -pan * 80, -20, W + 80, H + 40);
  g.fillStyle = 'rgba(6,3,16,0.7)'; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.06; g.fillStyle = tint;
  for (let i = 0; i < 12; i++) { const x = ((i * 170 + t * 1.5) % (W + 400)) - 200; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 60, 0); g.lineTo(x - 140, H); g.lineTo(x - 200, H); g.fill(); }
  g.restore();
  const v = g.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 800); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.7)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
}
function idlePose(ch, T, spec) {
  if (spec) return buildPose(ch, spec);
  const st = ch.stance;
  return buildPose(ch, { t: (st.t ?? POSE0.t) + Math.sin(T * 0.07) * 0.03, fa2: (st.fa2 ?? POSE0.fa2) + Math.sin(T * 0.07) * 0.07 });
}

// ------------------------------- TITLE -------------------------------
class TitleScene {
  constructor() {
    this.t = 0; Music.play('menu');
    this.menu = new MenuList([
      { id: 'cpu', label: '1P VS CPU', jp: '一人用' }, { id: 'fight', label: 'FIGHT  1P VS 2P', jp: '対戦' }, { id: 'practice', label: 'PRACTICE', jp: '練習' },
      { id: 'training', label: 'TRAINING', jp: '修行' }, { id: 'howto', label: 'HOW TO PLAY', jp: '遊び方' }, { id: 'settings', label: 'SETTINGS', jp: '設定' },
    ], W / 2, 300, { w: 390, h: 48, gap: 10 });
    this.rL = {}; this.rR = {};
  }
  update() {
    this.t++;
    if (mobileToggleUpdate()) return;
    const it = this.menu.update(); if (!it) return;
    Sound.play('menuOk');
    if (it.id === 'cpu') go(new CpuSetupScene());
    if (it.id === 'fight') go(new CharSelectScene('versus'));
    if (it.id === 'practice') go(new CharSelectScene('practice'));
    if (it.id === 'training') go(new CharSelectScene('training'));
    if (it.id === 'howto') go(new HowToScene());
    if (it.id === 'settings') go(new SettingsScene());
  }
  draw(g) {
    const t = this.t;
    drawMenuBG(g, t);
    for (const [ch, x, f, ropes, sc] of [[KAZUMA, 230, 1, this.rL, 2.05], [GORO, 1060, -1, this.rR, 1.85]]) {
      artFigure(g, x, 790, sc, g => {
        g.save(); g.shadowColor = ch.colors.accent; g.shadowBlur = 40; g.globalAlpha = 0.6;
        drawFigure(g, ch, idlePose(ch, t), x, 790, f, { mono: ch.colors.accent, scale: sc * 1.02 }); g.restore();
        drawFigure(g, ch, idlePose(ch, t), x, 790, f, { scale: sc, T: t, ropes, glow: true, expr: 'normal' });
      });
    }
    g.save(); g.font = `900 230px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = 0.25; g.fillStyle = '#ff1a3a'; g.fillText('魂砕き', W / 2, 160); g.restore();
    drawTitleText(g, 'SOUL BREAKERS', W / 2, 150, 118, '#ffd84a', '#ff2a3a');
    g.font = `700 17px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = '#e8dcff';
    g.fillText('A N I M E   F I G H T I N G   ·   1 – 2   P L A Y E R S   ·   O N E   K E Y B O A R D', W / 2, 236);
    g.font = `700 22px ${FONT_JP}`; g.fillStyle = '#ff8aa0'; g.fillText('— 魂 を 砕 け —', W / 2, 270);
    this.menu.draw(g, t);
    mobileToggleDraw(g, t);
    drawFooter(g, Sound.ac ? '1P: W/S + F    ·    2P: ↑/↓ + K    ·    ENTER / mouse    ·    M: mute' : 'Press any key or click to enable sound   ·   W/S or ↑/↓ + ENTER to choose');
  }
}

// ------------------------- SINGLEPLAYER SETUP -------------------------
const ARCADE_LEN = 6;
function arcadeCfg(p1, level) {
  const order = shuffleArr(CHARS.map((c, i) => i).filter(i => i !== p1)).slice(0, ARCADE_LEN);
  return { mode: 'versus', p1, p2: order[0], stage: Math.floor(Math.random() * STAGES.length), cpu: { level, arcade: true }, arcade: { order, i: 0 } };
}
class CpuSetupScene {
  constructor() {
    this.t = 0; Music.play('menu');
    this.menu = new MenuList([
      { id: 'level', label: 'DIFFICULTY', type: 'choice' }, { id: 'single', label: 'SINGLE MATCH', jp: '一戦' },
      { id: 'arcade', label: `ARCADE  (${ARCADE_LEN} FIGHTS)`, jp: 'アーケード' }, { id: 'back', label: 'BACK', jp: '戻る' },
    ], W / 2, 300, { w: 470, h: 52 });
  }
  setLevel(d) { Settings.cpuLevel = (Settings.cpuLevel + d + CPU_LEVELS.length) % CPU_LEVELS.length; Settings.save(); Sound.play('menuMove'); }
  update() {
    this.t++;
    const lv = this.menu.items[0]; lv.value = '◀  ' + CPU_LEVELS[Settings.cpuLevel].name + '  ▶';
    if (this.menu.sel === 0 && (UI.left() || pressedAny(B(2, 'left')))) this.setLevel(-1);
    if (this.menu.sel === 0 && (UI.right() || pressedAny(B(2, 'right')))) this.setLevel(1);
    if (UI.back()) { Sound.play('menuBack'); go(new TitleScene()); return; }
    const it = this.menu.update(); if (!it) return;
    if (it.id === 'level') { this.setLevel(1); return; }
    Sound.play('menuOk');
    if (it.id === 'single') go(new CharSelectScene('versus', { level: Settings.cpuLevel }));
    if (it.id === 'arcade') go(new CharSelectScene('versus', { level: Settings.cpuLevel, arcade: true }));
    if (it.id === 'back') go(new TitleScene());
  }
  draw(g) {
    const t = this.t, L = CPU_LEVELS[Settings.cpuLevel];
    drawMenuBG(g, t, L.color);
    drawTitleText(g, '1P VS CPU', W / 2, 120, 84, '#ffd84a', '#ff2a3a');
    g.font = `700 22px ${FONT_JP}`; g.textAlign = 'center'; g.fillStyle = '#ffb3c6'; g.fillText('一人用モード — コンピューター対戦', W / 2, 196);
    const info = ['Slower reactions, blocks rarely, short combos. Learn the moves.', 'Blocks and punishes, uses specials and ultimates in combos.', 'Fast reactions, reads lows, anti-airs, bursts and full combos.'][Settings.cpuLevel];
    g.font = `italic 900 26px ${FONT_T}`; strokeText(g, L.name + '  ' + L.jp, W / 2, 248, L.color, OUTLINE, 5);
    g.font = `600 16px ${FONT_UI}`; g.fillStyle = '#e8dcff'; g.fillText(info, W / 2, 276);
    this.menu.draw(g, t);
    drawFooter(g, '↑/↓ choose  ·  ←/→ difficulty  ·  F / ENTER confirm  ·  ESC back   —   Arcade: beat ' + ARCADE_LEN + ' random opponents in a row');
  }
}

// --------------------------- CHARACTER SELECT ---------------------------
class CharSelectScene {
  constructor(mode, cpu) { this.mode = mode; this.cpu = cpu || null; this.single = mode !== 'versus' || !!this.cpu; this.t = 0; this.cur = [0, 1]; this.ready = [false, false]; this.ropes = [{}, {}]; this.readyT = 0; Music.play('menu'); }
  get cols() { return CHARS.length > 8 ? Math.ceil(CHARS.length / 2) : 4; }
  cardRect(i) {   // 2 rows; up to 8 fighters use the classic 4-wide grid, more fighters narrow the cards to fit
    const C = this.cols, col = i % C, row = Math.floor(i / C), cw = C > 4 ? Math.min(100, Math.floor(452 / C) - 6) : 100, gap = C > 4 ? 6 : 8, x0 = W / 2 - (C * cw + (C - 1) * gap) / 2;
    return { x: x0 + col * (cw + gap), y: 168 + row * 200, w: cw, h: 186 };
  }
  activeSlot() { return this.single ? (this.ready[0] ? 1 : 0) : null; }
  confirm(s) { this.ready[s] = true; Sound.play('menuOk'); Sound.play('impactBig'); Sound.speak(CHARS[this.cur[s]].name, 0.6, 1); this.ropes[s] = {}; }
  move(s, c) { if (c !== this.cur[s]) { this.cur[s] = c; this.ropes[s] = {}; Sound.play('menuMove'); } }
  update() {
    this.t++;
    const slots = this.single ? [this.activeSlot()] : [0, 1];
    for (const s of slots) {
      if (this.ready[s]) continue;
      const pid = this.single ? 1 : s + 1;
      const extra = k => this.single && pressedAny(k);
      const L = UI.p(pid, 'left') || extra('ArrowLeft'), R = UI.p(pid, 'right') || extra('ArrowRight'), U = UI.p(pid, 'up') || extra('ArrowUp'), D = UI.p(pid, 'down') || extra('ArrowDown');
      let c = this.cur[s];
      const n = CHARS.length, C = this.cols, row = Math.floor(c / C), rowN = Math.min(C, n - row * C), col = c % C;
      if (L) c = row * C + (col + rowN - 1) % rowN;
      if (R) c = row * C + (col + 1) % rowN;
      if (U || D) { const other = row ? 0 : 1, oN = Math.min(C, n - other * C); c = other * C + Math.min(col, oN - 1); }
      this.move(s, c);
      if (UI.p(pid, 'medium')) { this.randomPick(s); return; }
      if (UI.pOk(pid) || (this.single && UI.ok())) { this.confirm(s); this.arcadePick(); return; }
    }
    const ms = this.single ? this.activeSlot() : (!this.ready[0] ? 0 : !this.ready[1] ? 1 : null);
    if (ms !== null && Mouse.clicked && inRect(this.randRect())) { this.randomPick(ms); return; }
    if (ms !== null) for (let i = 0; i < CHARS.length; i++) {
      if (!inRect(this.cardRect(i))) continue;
      if (Mouse.moved) this.move(ms, i);
      if (Mouse.clicked) { this.move(ms, i); this.confirm(ms); this.arcadePick(); return; }
    }
    if (!this.single) for (const pid of [1, 2]) if (this.ready[pid - 1] && UI.pBack(pid) && !(this.ready[0] && this.ready[1] && this.readyT > 30)) { this.ready[pid - 1] = false; Sound.play('menuBack'); }
    if (this.single && UI.back()) {
      if (this.ready[1] && !this.cpu?.arcade) this.ready[1] = false; else if (this.ready[0]) this.ready[0] = this.ready[1] = false; else { go(this.cpu ? new CpuSetupScene() : new TitleScene()); return; }
      Sound.play('menuBack');
    } else if (!this.single && Keys.pressed.has('Escape') && !this.ready[0] && !this.ready[1]) { Sound.play('menuBack'); go(new TitleScene()); return; }
    if (this.ready[0] && this.ready[1]) { if (++this.readyT > 50) go(this.cpu?.arcade ? new VSScene(arcadeCfg(this.cur[0], this.cpu.level)) : new StageSelectScene({ mode: this.mode, p1: this.cur[0], p2: this.cur[1], cpu: this.cpu })); } else this.readyT = 0;
  }
  randRect() { return { x: W / 2 - 90, y: 562, w: 180, h: 36 }; }
  randomPick(s) {   // RANDOM: pick a fighter and confirm it straight away
    let c = Math.floor(Math.random() * CHARS.length); if (CHARS.length > 1 && c === this.cur[s]) c = (c + 1 + Math.floor(Math.random() * (CHARS.length - 1))) % CHARS.length;
    this.move(s, c); this.confirm(s); this.arcadePick(); 
  }
  arcadePick() { if (this.cpu?.arcade && this.ready[0] && !this.ready[1]) { this.cur[1] = (this.cur[0] + 1) % CHARS.length; this.ready[1] = true; } }   // arcade: opponents come from the ladder
  draw(g) {
    const t = this.t;
    drawMenuBG(g, t);
    g.save(); g.globalAlpha = 0.28;
    let gr = g.createLinearGradient(0, 0, 460, 0); gr.addColorStop(0, '#ff1a3a'); gr.addColorStop(1, 'rgba(255,26,58,0)'); g.fillStyle = gr; g.fillRect(0, 0, 460, H);
    gr = g.createLinearGradient(W, 0, W - 460, 0); gr.addColorStop(0, '#1a8aff'); gr.addColorStop(1, 'rgba(26,138,255,0)'); g.fillStyle = gr; g.fillRect(W - 460, 0, 460, H);
    g.restore();
    drawTitleText(g, 'SELECT YOUR FIGHTER', W / 2, 62, 50, '#ffd84a', '#ff2a3a');
    g.font = `700 20px ${FONT_JP}`; g.textAlign = 'center'; g.fillStyle = '#ffb3c6'; g.fillText(`キャラクター選択 — ${this.cpu ? (this.cpu.arcade ? 'ARCADE' : 'VS CPU') + ' · ' + CPU_LEVELS[this.cpu.level].name : this.mode.toUpperCase()}`, W / 2, 108);
    for (let s = 0; s < 2; s++) this.drawSide(g, s, t);
    for (let i = 0; i < CHARS.length; i++) {
      const r = this.cardRect(i), ch = CHARS[i];
      g.save(); g.beginPath(); g.rect(r.x, r.y, r.w, r.h); g.clip(); { const cd = ch.card, k = cd.width / 100, sw = Math.min(cd.width, r.w * k); g.drawImage(cd, (cd.width - sw) / 2, 0, sw, cd.height, r.x, r.y, r.w, r.h); }
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(r.x, r.y + r.h - 40, r.w, 40);
      g.font = `italic 900 24px ${FONT_T}`; const nw0 = g.measureText(ch.name).width; g.font = `italic 900 ${Math.min(24, Math.floor(24 * (r.w - 14) / nw0))}px ${FONT_T}`;
      g.textAlign = 'center'; g.textBaseline = 'middle'; strokeText(g, ch.name, r.x + r.w / 2, r.y + r.h - 24, '#fff', OUTLINE, 4);
      g.font = `700 11px ${FONT_UI}`; { const st = ch.style.split(' / ')[0], fs = Math.min(11, 11 * (r.w - 8) / Math.max(1, g.measureText(st).width)); g.font = `700 ${fs.toFixed(1)}px ${FONT_UI}`; g.fillStyle = ch.colors.accent; g.fillText(st, r.x + r.w / 2, r.y + r.h - 7); }
      g.restore();
      g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.strokeRect(r.x, r.y, r.w, r.h);
    }
    for (let s = 0; s < 2; s++) {
      if (this.single && s === 1 && (!this.ready[0] || this.cpu?.arcade)) continue;
      const r = this.cardRect(this.cur[s]), col = s ? P_COL[2] : P_COL[1], both = this.cur[0] === this.cur[1] && !(this.single && !this.ready[0]);
      const o = both ? (s ? 6 : -6) : 0;
      g.save(); g.strokeStyle = col; g.lineWidth = this.ready[s] ? 6 : 4; g.shadowColor = col; g.shadowBlur = 16 + Math.sin(t * 0.2) * 6;
      g.strokeRect(r.x - 4 + o, r.y - 4 + o, r.w + 8, r.h + 8); g.restore();
      g.fillStyle = col; const tx = s ? r.x + r.w - 40 + o : r.x - 4 + o; g.fillRect(tx, r.y - 22 + o, 44, 22);
      g.font = `italic 900 18px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
      g.fillText(this.single ? (s ? 'CPU' : '1P') : s ? '2P' : '1P', tx + 22, r.y - 11 + o);
    }
    { const r = this.randRect(), hot = inRect(r) && (this.single ? this.activeSlot() !== null && !this.ready[this.activeSlot()] : !(this.ready[0] && this.ready[1]));
      drawButton(g, r, '? RANDOM', null, hot, t); }
    const hint = this.cpu ? (this.ready[0] ? 'Choose the CPU OPPONENT  ·  F / ENTER: confirm  ·  G / ESC: back' : 'Choose YOUR fighter  ·  A/D/W/S or arrows  ·  F / ENTER: confirm  ·  V: random  ·  ESC: back')
      : this.single ? (this.ready[0] ? 'Choose the training DUMMY  ·  F / ENTER: confirm  ·  G / ESC: back' : 'Choose YOUR fighter  ·  A/D/W/S or arrows  ·  F / ENTER: confirm  ·  V: random  ·  ESC: back')
      : '1P: A/D/W/S + F (G back, V random)   ·   2P: ARROWS + K (L back, J random)   ·   ESC: menu';
    drawFooter(g, hint);
  }
  drawSide(g, s, t) {
    const ch = CHARS[this.cur[s]], left = s === 0, rdy = this.ready[s];
    const hidden = this.single && s === 1 && (!this.ready[0] || this.cpu?.arcade);
    const fx = left ? 236 : W - 236;
    if (!hidden) {
      const pose = rdy ? buildPose(ch, 'victory') : idlePose(ch, t);
      artFigure(g, fx, 565, 1.6, g => {
        if (rdy) { g.save(); g.shadowColor = ch.colors.accent; g.shadowBlur = 30; g.globalAlpha = 0.5 + 0.2 * Math.sin(t * 0.2); drawFigure(g, ch, pose, fx, 565, left ? 1 : -1, { mono: ch.colors.accent, scale: 1.62 }); g.restore(); }
        drawFigure(g, ch, pose, fx, 565, left ? 1 : -1, { scale: 1.6, T: t, ropes: this.ropes[s], glow: rdy, expr: rdy ? (ch.id === 'yoru' ? 'closed' : ch.id === 'goro' ? 'shout' : 'grin') : 'normal' });
      });
    }
    const x = left ? 34 : W - 34; g.textAlign = left ? 'left' : 'right';
    const label = this.cpu ? (s ? 'CPU · ' + CPU_LEVELS[this.cpu.level].name : 'PLAYER') : this.single ? (s ? 'DUMMY' : 'PLAYER') : s ? 'PLAYER 2' : 'PLAYER 1';
    g.font = `900 15px ${FONT_UI}`; g.textBaseline = 'alphabetic'; g.fillStyle = s ? P_COL[2] : P_COL[1]; g.fillText(label, x, 140);
    if (hidden) { g.font = `italic 900 30px ${FONT_T}`; g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillText(this.cpu?.arcade ? `${ARCADE_LEN} OPPONENTS` : 'WAITING…', x, 190); return; }
    g.font = `italic 900 60px ${FONT_T}`; const nmW = g.measureText(ch.name).width;
    drawTitleText(g, ch.name, x, 184, Math.min(60, Math.floor(60 * 300 / nmW)), '#ffffff', ch.colors.accent, left ? 'left' : 'right');
    g.font = `700 19px ${FONT_JP}`; g.textBaseline = 'alphabetic'; strokeText(g, `${ch.jp} · ${ch.titleJp}`, x, 238, '#ffffff', OUTLINE, 4);
    { const tl = `${ch.title.toUpperCase()} — ${ch.style}`; g.font = `italic 800 16px ${FONT_UI}`; const tw = g.measureText(tl).width; g.font = `italic 800 ${Math.min(16, Math.floor(16 * 360 / tw))}px ${FONT_UI}`; strokeText(g, tl, x, 260, ch.colors.accent, OUTLINE, 4); }
    const stats = [['POWER', ch.stats.power], ['SPEED', ch.stats.speed], ['RANGE', ch.stats.range], ['DEFENSE', ch.stats.defense]];
    stats.forEach(([n, v], i) => {
      const col = i % 2, row = i >> 1, sx = left ? 34 + col * 205 : W - 421 + col * 205, by = 588 + row * 26;
      g.textAlign = 'left'; g.font = `800 12px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.fillText(n, sx, by + 10);
      for (let k = 0; k < 5; k++) { g.fillStyle = k < v ? ch.colors.accent : 'rgba(255,255,255,0.12)'; g.fillRect(sx + 72 + k * 22, by, 18, 11); }
    });
    g.font = `500 13px ${FONT_UI}`; g.fillStyle = '#e8e0ff'; g.textAlign = 'left';
    wrapText(g, ch.desc, left ? 34 : W - 34 - 400, 655, 400, 17);
    if (rdy) {
      g.save(); g.translate(fx, 430); g.rotate(-0.15);
      drawTitleText(g, 'READY!', 0, 0, 64, '#ffd84a', '#ff2a3a'); g.font = `900 22px ${FONT_JP}`; g.textAlign = 'center'; strokeText(g, '準備完了', 0, 44, '#fff', OUTLINE, 5);
      g.restore();
    }
  }
}

// ----------------------------- STAGE SELECT -----------------------------
class StageSelectScene {
  constructor(cfg) { this.cfg = cfg; this.sel = 0; this.t = 0; }
  // 3 columns, as many rows as needed (6 stages → 2 rows)
  rect(i) { const sel = i === this.sel, rows = Math.ceil(STAGES.length / 3); const w = sel ? 312 : 288, h = sel ? 176 : 162; const cx = 240 + (i % 3) * 400, cy = rows > 1 ? 232 + Math.floor(i / 3) * 236 : 340; return { x: cx - w / 2, y: cy - h / 2, w, h }; }
  update() {
    this.t++;
    const n = STAGES.length;
    if (UI.left() || pressedAny(B(2, 'left'))) { this.sel = (this.sel + n - 1) % n; Sound.play('menuMove'); }
    if (UI.right() || pressedAny(B(2, 'right'))) { this.sel = (this.sel + 1) % n; Sound.play('menuMove'); }
    if (n > 3 && (UI.up() || UI.down() || pressedAny(B(2, 'up')) || pressedAny(B(2, 'down')))) { this.sel = Math.min(n - 1, (this.sel + 3) % (Math.ceil(n / 3) * 3)); Sound.play('menuMove'); }
    for (let i = 0; i < n; i++) if (inRect(this.rect(i))) { if (Mouse.moved && this.sel !== i) { this.sel = i; Sound.play('menuMove'); } if (Mouse.clicked) { this.sel = i; this.go(); return; } }
    if (UI.ok()) { this.go(); return; }
    if (UI.back()) { Sound.play('menuBack'); go(new CharSelectScene(this.cfg.mode, this.cfg.cpu)); }
  }
  go() {
    Sound.play('menuOk');
    const cfg = { ...this.cfg, stage: this.sel };
    go(this.cfg.mode === 'versus' ? new VSScene(cfg) : new Battle(cfg));
  }
  draw(g) {
    const t = this.t, st = STAGES[this.sel];
    g.drawImage(st.wide, 0, 0, W, H); g.fillStyle = 'rgba(6,3,16,0.55)'; g.fillRect(0, 0, W, H);
    drawTitleText(g, 'SELECT STAGE', W / 2, 70, 56, '#ffd84a', '#ff2a3a');
    g.font = `700 20px ${FONT_JP}`; g.textAlign = 'center'; g.fillStyle = '#ffb3c6'; g.fillText('ステージ選択', W / 2, 116);
    STAGES.forEach((s, i) => {
      const r = this.rect(i), sel = i === this.sel;
      g.save(); if (sel) { g.shadowColor = '#ff2a55'; g.shadowBlur = 30; }
      g.drawImage(s.thumb, r.x, r.y, r.w, r.h); g.restore();
      g.strokeStyle = sel ? '#ffffff' : 'rgba(255,255,255,0.3)'; g.lineWidth = sel ? 4 : 2; g.strokeRect(r.x, r.y, r.w, r.h);
      g.textAlign = 'center'; g.font = `italic 900 ${sel ? 26 : 21}px ${FONT_T}`; g.textBaseline = 'alphabetic';
      strokeText(g, s.name, r.x + r.w / 2, r.y + r.h + 30, sel ? '#ffffff' : '#bbb', OUTLINE, 5);
      g.font = `700 16px ${FONT_JP}`; g.fillStyle = sel ? '#ff8aa0' : '#888'; g.fillText(s.jp, r.x + r.w / 2, r.y + r.h + 50);
    });
    drawFooter(g, '← → ↑ ↓  choose   ·   ENTER / F / K  confirm   ·   ESC / G  back');
  }
}

// ------------------------------ VS SCREEN ------------------------------
class VSScene {
  constructor(cfg) {
    this.cfg = cfg; this.t = 0; this.r = [{}, {}];
    this.a = CHARS[cfg.p1]; this.b = CHARS[cfg.p2];
    Sound.play('gong'); Sound.speak(`${this.a.name} versus ${this.b.name}`, 0.5, 0.95);
  }
  update() {
    this.t++;
    if (this.t === 26) { Sound.play('impactBig'); Sound.play('slam'); }
    if (this.t >= 175 || (this.t > 30 && UI.ok())) go(new Battle(this.cfg));
  }
  draw(g) {
    const t = this.t, A = this.a, Bc = this.b;
    const shake = t >= 26 && t < 40 ? (40 - t) * 0.8 : 0;
    g.save(); g.translate(rand(-shake, shake), rand(-shake, shake));
    let gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#3a0010'); gr.addColorStop(1, '#14040a'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(-20, -20); g.lineTo(W * 0.58, -20); g.lineTo(W * 0.42, H + 20); g.lineTo(-20, H + 20); g.fill();
    gr = g.createLinearGradient(W, 0, 0, H); gr.addColorStop(0, '#001a3a'); gr.addColorStop(1, '#040a14'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(W * 0.58, -20); g.lineTo(W + 20, -20); g.lineTo(W + 20, H + 20); g.lineTo(W * 0.42, H + 20); g.fill();
    g.save(); g.globalAlpha = 0.25; g.strokeStyle = '#fff';
    for (let i = 0; i < 30; i++) { const y = rand(0, H); g.lineWidth = rand(1, 3); g.beginPath(); g.moveTo(rand(-200, W), y); g.lineTo(rand(0, W + 200), y - 80); g.stroke(); }
    g.restore();
    const ka = easeOut(t / 20);
    g.save(); g.beginPath(); g.moveTo(-20, -20); g.lineTo(W * 0.58, -20); g.lineTo(W * 0.42, H + 20); g.lineTo(-20, H + 20); g.clip();
    artFigure(g, lerp(-300, 330, ka), 860, 2.6, g => drawFigure(g, A, buildPose(A, A.poses.intro ? 'intro' : 'stance'), lerp(-300, 330, ka), 860, 1, { scale: 2.6, T: t, ropes: this.r[0], glow: true, expr: 'shout' }));
    g.restore();
    g.save(); g.beginPath(); g.moveTo(W * 0.58, -20); g.lineTo(W + 20, -20); g.lineTo(W + 20, H + 20); g.lineTo(W * 0.42, H + 20); g.clip();
    artFigure(g, lerp(W + 300, W - 330, ka), 860, 2.6, g => drawFigure(g, Bc, buildPose(Bc, Bc.poses.intro ? 'intro' : 'stance'), lerp(W + 300, W - 330, ka), 860, -1, { scale: 2.6, T: t, ropes: this.r[1], glow: true, expr: 'shout' }));
    g.restore();
    g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.shadowColor = '#fff'; g.shadowBlur = 20; g.beginPath(); g.moveTo(W * 0.58, -20); g.lineTo(W * 0.42, H + 20); g.stroke(); g.shadowBlur = 0;
    const kn = easeOut((t - 8) / 16);
    drawTitleText(g, A.name, lerp(-400, 50, kn), 590, 90, '#ffffff', A.colors.accent, 'left');
    g.font = `900 28px ${FONT_JP}`; g.textAlign = 'left'; strokeText(g, `${A.jp} · ${A.titleJp}`, lerp(-400, 60, kn), 650, '#ffffff', OUTLINE, 5);
    drawTitleText(g, Bc.name, lerp(W + 400, W - 50, kn), 130, 90, '#ffffff', Bc.colors.accent, 'right');
    g.font = `900 28px ${FONT_JP}`; g.textAlign = 'right'; strokeText(g, `${Bc.jp} · ${Bc.titleJp}`, lerp(W + 400, W - 60, kn), 190, '#ffffff', OUTLINE, 5);
    if (t >= 22) {
      const k = Math.min(1, (t - 22) / 6), sc = lerp(4, 1, easeOut(k));
      g.save(); g.translate(W / 2, H / 2); g.scale(sc, sc);
      g.font = `900 260px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = 0.35; g.fillStyle = '#ff1a3a'; g.fillText('対', 0, 0); g.globalAlpha = 1;
      drawTitleText(g, 'VS', 0, 0, 170, '#ffd84a', '#ff2a3a');
      g.restore();
    }
    g.restore();
    const st = STAGES[this.cfg.stage];
    g.font = `700 16px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = '#e8dcff'; g.fillText(`STAGE: ${st.name}  ${st.jp}   ·   BEST OF 3`, W / 2, H - 22);
  }
}

// ------------------------------- RESULTS -------------------------------
class ResultsScene {
  constructor(bt) {
    this.bt = bt; this.t = 0; this.ropes = {};
    this.win = bt.wins[0] >= 2 ? bt.p1 : bt.p2; this.lose = this.win.opp;
    this.quote = pick(this.win.ch.wins);
    const cpu = bt.cfg.cpu, arc = bt.cfg.arcade, won = this.win.pid === 1;
    this.arcClear = arc && won && arc.i + 1 >= arc.order.length;
    const first = !arc ? { id: 'rematch', label: 'REMATCH', jp: '再戦' } : this.arcClear ? null : won ? { id: 'next', label: `NEXT FIGHT  ${arc.i + 2}/${arc.order.length}`, jp: '次へ' } : { id: 'rematch', label: 'CONTINUE', jp: '再挑戦' };
    this.menu = new MenuList([first, { id: 'select', label: 'CHARACTER SELECT', jp: 'キャラ選択' }, { id: 'menu', label: 'MAIN MENU', jp: 'メニュー' }].filter(Boolean), 960, 500, { w: 420, h: 50 });
    if (cpu) this.names = ['YOU', 'CPU'];
    Music.play('results'); Sound.play('victory');
  }
  update() {
    this.t++;
    if (this.t < 30) return;
    const it = this.menu.update(); if (!it) return;
    Sound.play('menuOk');
    if (it.id === 'rematch') go(new Battle({ ...this.bt.cfg }));
    if (it.id === 'next') { const c = this.bt.cfg, a = c.arcade; go(new VSScene({ ...c, p2: a.order[a.i + 1], stage: (c.stage + 1) % STAGES.length, arcade: { ...a, i: a.i + 1 } })); }
    if (it.id === 'select') go(new CharSelectScene('versus', this.bt.cfg.cpu));
    if (it.id === 'menu') go(new TitleScene());
  }
  draw(g) {
    const t = this.t, F = this.win, ch = F.ch, c = ch.colors.accent;
    drawMenuBG(g, t, c);
    const gr = g.createLinearGradient(0, 0, 640, 0); gr.addColorStop(0, c + '66'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 640, H);
    artFigure(g, 300, 720, 2.3, g => {
      g.save(); g.shadowColor = c; g.shadowBlur = 40; g.globalAlpha = 0.5; drawFigure(g, ch, buildPose(ch, 'victory'), 300, 720, 1, { mono: c, scale: 2.32 }); g.restore();
      drawFigure(g, ch, buildPose(ch, 'victory'), 300, 720, 1, { scale: 2.3, T: t, ropes: this.ropes, glow: true, expr: ch.id === 'yoru' ? 'closed' : ch.id === 'goro' ? 'shout' : 'grin' });
    });
    g.save(); g.font = `900 200px ${FONT_JP}`; g.textAlign = 'center'; g.globalAlpha = 0.22; g.fillStyle = c; g.fillText('勝者', 960, 210); g.restore();
    drawTitleText(g, 'WINNER', 960, 92, 84, '#ffd84a', '#ff2a3a');
    drawTitleText(g, `${ch.name}`, 960, 170, 60, '#ffffff', c);
    g.font = `700 18px ${FONT_JP}`; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(`${this.names ? this.names[F.pid - 1] : 'PLAYER ' + F.pid} · ${ch.titleJp} · ${ch.title}`, 960, 214);
    if (this.arcClear) { g.save(); g.translate(330, 120); g.rotate(-0.08); drawTitleText(g, 'ARCADE CLEAR!', 0, 0, 58, '#7affc0', '#18a85a'); g.restore(); }
    else if (this.bt.cfg.arcade) { g.font = `italic 900 22px ${FONT_T}`; g.textAlign = 'left'; strokeText(g, `ARCADE · FIGHT ${this.bt.cfg.arcade.i + 1}/${this.bt.cfg.arcade.order.length} · ${CPU_LEVELS[this.bt.cfg.cpu.level].name}`, 30, 40, '#ffd84a', OUTLINE, 4); }
    g.font = `italic 600 19px ${FONT_UI}`; g.fillStyle = '#ffe9a8'; g.fillText('“' + this.quote + '”', 960, 248);
    const x = 690, y = 270, w = 540;
    panel(g, x, y, w, 210);
    const p1 = this.bt.p1, p2 = this.bt.p2, s1 = p1.stats, s2 = p2.stats;
    g.font = `italic 900 18px ${FONT_T}`; g.textAlign = 'center';
    g.fillStyle = P_COL[1]; g.fillText(`${this.names ? 'YOU' : 'P1'} ${p1.ch.name}`, x + 330, y + 28); g.fillStyle = P_COL[2]; g.fillText(`${this.names ? 'CPU' : 'P2'} ${p2.ch.name}`, x + 455, y + 28);
    const rows = [['Damage dealt', Math.round(s1.dmg), Math.round(s2.dmg)], ['Hits landed', s1.hits, s2.hits], ['Max combo', s1.maxCombo, s2.maxCombo], ['Specials used', s1.specials, s2.specials], ['Perfect blocks', s1.perfect, s2.perfect], ['Counter hits', s1.counters, s2.counters], ['Rounds won', this.bt.wins[0], this.bt.wins[1]]];
    rows.forEach(([n, a, b], i) => {
      const yy = y + 54 + i * 22;
      g.textAlign = 'left'; g.font = `600 15px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.fillText(n, x + 34, yy);
      g.textAlign = 'center'; g.font = `800 15px ${FONT_UI}`;
      g.fillStyle = a > b ? '#ffd84a' : '#ffffff'; g.fillText(a, x + 330, yy); g.fillStyle = b > a ? '#ffd84a' : '#ffffff'; g.fillText(b, x + 455, yy);
    });
    this.menu.draw(g, t);
    drawFooter(g, '↑/↓ + ENTER / F / K   ·   mouse');
  }
}

// ------------------------------ HOW TO PLAY ------------------------------
class HowToScene {
  constructor() { this.t = 0; this.page = 0; this.extra = CHARS.filter(c => c.howTo); this.pages = ['CONTROLS', 'COMBAT SYSTEM', 'ADVANCED COMBOS', 'COMMAND INPUTS', 'CARDMASTER', 'BEAST SHIFTER', 'BLOOD SAINT', ...this.extra.map(c => c.howTo.title)]; }   // characters may add a page via ch.howTo = { title, draw(g) }
  update() {
    this.t++;
    if (UI.left() || pressedAny(B(2, 'left'))) { this.page = (this.page + this.pages.length - 1) % this.pages.length; Sound.play('menuMove'); }
    if (UI.right() || pressedAny(B(2, 'right')) || UI.ok()) { this.page = (this.page + 1) % this.pages.length; Sound.play('menuMove'); }
    if (Mouse.clicked) { if (Mouse.x < 120) this.page = (this.page + this.pages.length - 1) % this.pages.length; else if (Mouse.x > W - 120) this.page = (this.page + 1) % this.pages.length; else if (Mouse.y > H - 60) { go(new TitleScene()); return; } Sound.play('menuMove'); }
    if (pressedAny('Escape', 'Backspace', B(1, 'heavy'), B(2, 'heavy'))) { Sound.play('menuBack'); go(new TitleScene()); }
  }
  draw(g) {
    const t = this.t;
    drawMenuBG(g, t);
    drawTitleText(g, 'HOW TO PLAY', W / 2, 56, 50, '#ffd84a', '#ff2a3a');
    g.font = `700 18px ${FONT_JP}`; g.textAlign = 'center'; g.fillStyle = '#ffb3c6'; g.fillText(`遊び方 — ${this.page + 1}/${this.pages.length} · ${this.pages[this.page]}`, W / 2, 98);
    panel(g, 70, 120, W - 140, 535);
    g.font = `900 40px ${FONT_UI}`; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.fillText('◀', 50, H / 2); g.fillText('▶', W - 50, H / 2);
    [this.drawControls, this.drawSystem, this.drawAdvanced, this.drawCommands, this.drawCards, this.drawShifter, drawSaintHowTo, ...this.extra.map(c => c.howTo.draw)][this.page].call(this, g);
    drawFooter(g, '← / →  page   ·   ESC  back   ·   click arrows');
  }
  drawControls(g) {
    g.textBaseline = 'alphabetic';
    for (const p of [1, 2]) {
      const x = p === 1 ? 140 : 700;
      g.textAlign = 'left'; g.font = `italic 900 30px ${FONT_T}`; strokeText(g, `PLAYER ${p}`, x, 170, P_COL[p], OUTLINE, 5);
      ACTIONS.forEach((a, i) => {
        const y = 210 + i * 36;
        g.fillStyle = i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)'; g.fillRect(x - 10, y - 24, 440, 34);
        g.font = `600 18px ${FONT_UI}`; g.fillStyle = '#e8e0ff'; g.fillText(ACTION_LABELS[a], x, y);
        g.textAlign = 'right'; g.font = `900 20px ${FONT_UI}`; g.fillStyle = '#ffd84a'; g.fillText(keyLabel(Settings.binds[p][a]), x + 420, y); g.textAlign = 'left';
      });
    }
    g.font = `500 15px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = '#cfc4ee';
    g.fillText('Both players play at the same time on one keyboard. Rebind any key in SETTINGS → KEY BINDINGS.  ESC pauses · M toggles mute.', W / 2, 600);
    g.fillText('Tip: some keyboards cannot register many keys at once ("ghosting"). If inputs drop, rebind to keys that are farther apart.', W / 2, 626);
  }
  drawSystem(g) {
    const items = [
      ['BLOCK', 'Hold BLOCK to guard. Stand-block high & overhead attacks (air attacks, some specials). Crouch-block (BLOCK + ↓) low attacks like sweeps.'],
      ['PERFECT BLOCK', 'Press BLOCK just before an attack lands (≈8 frames): no chip damage, shorter blockstun, bonus Soul Gauge.'],
      ['COUNTER HIT', 'Hitting an opponent during the startup/active frames of their attack deals +20% damage and longer hitstun.'],
      ['COMBOS', 'Chain normals Light → Medium → Heavy → Special. Specials cancel into the Ultimate. Damage scales down over long combos.'],
      ['LAUNCHER', 'Light + Heavy launches. On hit hold UP to jump-cancel and continue with an air combo (air L → M → H).'],
      ['SOUL GAUGE 魂', 'Fills by attacking, taking damage and blocking. At 100% press SP1 + SP2 together for an Ultimate with a cinematic finisher.'],
      ['COUNTERS & ARMOR', 'Each fighter has a counter move (↓← + SP1). Armored moves (Goro) absorb hits but lose to grabs. Grabs are unblockable.'],
      ['MOVEMENT', 'Double-tap → to dash, double-tap ← to back-dash (briefly invulnerable). Yoru can double jump. Specials have cooldowns.'],
    ];
    items.forEach(([h, d], i) => {
      const y = 156 + i * 63;
      g.textAlign = 'left'; g.font = `italic 900 22px ${FONT_T}`; strokeText(g, h, 110, y, '#ffd84a', OUTLINE, 4);
      g.font = `500 15px ${FONT_UI}`; g.fillStyle = '#ece6ff'; wrapText(g, d, 110, y + 23, W - 200, 18);
    });
  }
  drawAdvanced(g) {
    const items = [
      ['CHAINS & CANCEL WINDOWS', 'L → M → H → Special → Ultimate. Two lights chain together. Each attack can only be cancelled for a short window (≈9–13 frames) after it connects — mashing early or late won’t work.'],
      ['TARGET COMBOS & FOLLOW-UPS', 'Every fighter has its own routes: e.g. Kazuma H → →+H, Yoru L L L, Sera M M, Goro H H, Frogs/Conductor M → →+H. Many specials have a follow-up: press SP again on hit (see MOVE LIST page 2).'],
      ['LINKS', 'Start a new attack from neutral as your recovery ends while the opponent is still in hitstun = LINK. Press within 2 frames of recovering for a PERFECT LINK (+10% damage, bonus meter).'],
      ['BLOCK STRINGS', 'On block only light/medium chains and special cancels work. Launchers, jump-cancels and follow-ups need a real hit.'],
      ['LAUNCHERS & JUGGLES', 'L+H launches; hold ↑ on hit to jump-cancel into an air combo. Each fighter has a juggle limit (Goro 4 · Sera 5 · Kazuma/Conductor/Cardmaster 6 · Frogs 7 · Yoru 8). Juggled foes fall faster with every hit.'],
      ['WALL & GROUND BOUNCE', 'Heavy hits that carry the opponent into the arena edge cause a WALL SPLAT (once per combo) — keep hitting them off the wall. Some moves cause a single ground BOUNCE.'],
      ['COUNTER & PUNISH', 'Hit someone during their startup: COUNTER HIT (+20%, extra hitstun, heavies STAGGER). Hit them during recovery: PUNISH (+10%).'],
      ['SCALING & DETERIORATION', 'Damage scales down every hit (to 35%); hitstun shrinks in long combos and after 5 s. No infinites. 30%+ HP in one combo = PERFECT COMBO.'],
      ['THROWS', 'M + H up close grabs anyone standing or crouching on the ground, even while blocking. Throws lose to attacks and jumps. When grabbed, press M + H quickly to TECH (escape). Hold ← to throw backwards. A missed throw is easy to punish.'],
      ['SOUL BURST (combo breaker)', 'Once per round, press BLOCK + HEAVY while being comboed to blast the attacker away.'],
    ];
    items.forEach(([h, d], i) => {
      const y = 150 + i * 56;
      g.textAlign = 'left'; g.font = `italic 900 19px ${FONT_T}`; strokeText(g, h, 100, y, '#ffd84a', OUTLINE, 4);
      g.font = `500 14px ${FONT_UI}`; g.fillStyle = '#ece6ff'; wrapText(g, d, 100, y + 20, W - 200, 16);
    });
  }
  drawCards(g) {
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    const ctr = [['SP1', 'Play the highlighted card'], ['SP2', 'Highlight the next card (instant)'], ['↓→ SP1', 'Card Storm — 5 cards, no hand needed'], ['↓← SP1', 'Wild Card — spend 2+ cards, effect = card mix'], ['↓→ SP2', 'Summoner’s Command — all creatures at once'], ['↓↓ SP2', 'Deck Shuffle — redraw 3 cards'], ['SP1+SP2', 'The Final Collection (ultimate)']];
    g.font = `italic 900 20px ${FONT_T}`; strokeText(g, 'FUDAGAMI — HAND OF 3, DECK OF 8', 100, 156, '#ff8ad8', OUTLINE, 4);
    ctr.forEach(([a, b], i) => { const y = 186 + i * 25; g.font = `900 15px ${FONT_UI}`; g.fillStyle = '#ffd84a'; g.fillText(a, 100, y); g.font = `600 14px ${FONT_UI}`; g.fillStyle = '#ffffff'; g.fillText(b, 190, y); });
    g.font = `500 13px ${FONT_UI}`; g.fillStyle = '#cfc4ee';
    wrapText(g, 'Played cards leave empty slots that refill on their own (strong cards take longer). The NEXT card is always visible, so you can plan. After a card resolves you may chain one more card. Each card exists once in the deck — no unlimited summons.', 100, 372, 520, 16);
    CARD_IDS.forEach((id, i) => {
      const d = CARD_DEFS[id], col = i % 2, row = Math.floor(i / 2), x = 660 + col * 270, y = 150 + row * 108;
      drawCard(g, x + 22, y + 36, 40, 56, id, {});
      g.font = `800 13px ${FONT_UI}`; g.fillStyle = d.col; g.fillText(d.name, x + 50, y + 16);
      g.font = `700 10px ${FONT_UI}`; g.fillStyle = '#a99ccf'; g.fillText(d.cat, x + 50, y + 30);
      g.font = `500 11px ${FONT_UI}`; g.fillStyle = '#e8e0ff'; wrapText(g, d.desc, x + 50, y + 45, 205, 13);
    });
  }
  drawShifter(g) {
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.font = `italic 900 20px ${FONT_T}`; strokeText(g, 'NUE — FIVE BEASTS, ONE RANDOM PICK', 100, 156, '#36ffd0', OUTLINE, 4);
    const ctr = [['SP2', 'Transform into a RANDOM beast (10 s), then the seal recharges (9 s)'], ['SP2 on hit', 'Beast Cancel: transform mid-combo (25% meter) and keep going'],
      ['↓↓ SP2', 'Seal Drop (human): overhead, seal −1.5 s · Seal Release (beast): shockwave, cooldown −25%'], ['↓→ SP2', 'Spirit Step: invulnerable dodge through the opponent'], ['SP1+SP2', 'Primal Ascension (ultimate, human form)']];
    ctr.forEach(([a, b], i) => { const y = 186 + i * 25; g.font = `900 15px ${FONT_UI}`; g.fillStyle = '#ffd84a'; g.fillText(a, 100, y); g.font = `600 13px ${FONT_UI}`; g.fillStyle = '#ffffff'; g.fillText(b, 196, y); });
    g.font = `500 13px ${FONT_UI}`; g.fillStyle = '#cfc4ee';
    wrapText(g, 'You cannot pick the beast. The draw is a fair bag: each beast appears once every five transformations and never twice in a row — the POOL icons on the HUD show what can still come out. A 4+ hit combo trims 1 s off the seal (or adds 0.75 s to the current beast), finishers like Infernal Crash or Ghost Hunt extend the beast, and winning a round without taking damage starts the next round with the seal ready.', 100, 326, 520, 16);
    BEAST_IDS.forEach((id, i) => {
      const inf = BEAST_INFO[id], y = 150 + i * 88, x = 660, ic = beastIcon(id);
      if (ic) g.drawImage(ic, x, y, 60, 60);
      g.font = `italic 900 16px ${FONT_T}`; strokeText(g, inf.name, x + 72, y + 16, inf.col, OUTLINE, 3);
      g.font = `700 11px ${FONT_JP}`; g.fillStyle = '#a99ccf'; g.fillText(`${inf.jp} · ${inf.arch}`, x + 72, y + 31);
      g.font = `500 11px ${FONT_UI}`; g.fillStyle = '#e8e0ff'; const yy = wrapText(g, inf.def, x + 72, y + 46, 440, 13);
      g.fillStyle = '#ffd84a'; g.fillText(inf.route, x + 72, yy);
    });
  }
  drawCommands(g) {
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.font = `500 16px ${FONT_UI}`; g.fillStyle = '#ece6ff';
    g.fillText('Directions are relative to where your fighter faces:  → = toward opponent,  ← = away.  Press the arrows in order, then the button.', 110, 160);
    const rows = [['↓ → + SP1', 'Projectile / signature special (quarter-circle forward)'], ['↓ ← + SP1', 'Counter / defensive special'], ['SP1', 'Special A'], ['SP2', 'Special B'], ['↓ ↓ + SP2', 'Ground special (slam / quake / storm)'], ['→ → + H', 'Dash attack'], ['L + H', 'Launcher'], ['M + H', 'THROW — beats block; press M + H right away to tech one (← = back throw)'], ['SP1 + SP2', 'ULTIMATE — needs a full Soul Gauge'], ['↓ + M / ↓ + H', 'Low attacks — must be crouch-blocked']];
    rows.forEach(([a, b], i) => {
      const y = 205 + i * 34;
      g.fillStyle = i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)'; g.fillRect(100, y - 24, W - 200, 32);
      g.font = `900 20px ${FONT_UI}`; g.fillStyle = '#ffd84a'; g.fillText(a, 120, y);
      g.font = `600 17px ${FONT_UI}`; g.fillStyle = '#ffffff'; g.fillText(b, 360, y);
    });
    g.font = `500 15px ${FONT_UI}`; g.fillStyle = '#cfc4ee';
    g.fillText('Each character’s full move list with names is in TRAINING mode and in the pause menu (ESC → MOVE LIST).', 110, 535);
    g.fillText('Example: facing right, Kazuma’s BURST SHOT = tap S, then D, then press R (Player 1 default keys).', 110, 562);
  }
}

// ------------------------------- SETTINGS -------------------------------
class SettingsScene {
  constructor() {
    this.t = 0;
    this.items = [
      { id: 'master', label: 'MASTER VOLUME', type: 'slider' }, { id: 'music', label: 'MUSIC VOLUME', type: 'slider' }, { id: 'sfx', label: 'SFX VOLUME', type: 'slider' },
      { id: 'muted', label: 'MUTE  (M)', type: 'bool' }, { id: 'voice', label: 'ANNOUNCER VOICE', type: 'bool' }, { id: 'shake', label: 'SCREEN SHAKE', type: 'bool' },
      { id: 'pixel', label: 'PIXEL ART STYLE', type: 'bool' }, { id: 'fx', label: 'EFFECTS QUALITY', type: 'choice', opts: ['HIGH', 'LOW'] }, { id: 'roundTime', label: 'ROUND TIME', type: 'choice', opts: [99, 60, 0] },
      { id: 'fullscreen', label: 'TOGGLE FULLSCREEN', type: 'action' }, { id: 'binds', label: 'KEY BINDINGS  →', type: 'action' }, { id: 'back', label: 'BACK', type: 'action' },
    ];
    this.menu = new MenuList(this.items, W / 2, 108, { w: 640, h: 38, gap: 6 });
  }
  valueOf(it) {
    const v = Settings[it.id];
    if (it.type === 'slider') return '▮'.repeat(Math.round(v * 10)) + '▯'.repeat(10 - Math.round(v * 10)) + `  ${Math.round(v * 100)}%`;
    if (it.type === 'bool') return v ? 'ON' : 'OFF';
    if (it.type === 'choice') return it.id === 'roundTime' ? (v ? `◀ ${v} s ▶` : '◀ ∞ ▶') : `◀ ${v} ▶`;
    return undefined;
  }
  change(it, d) {
    if (it.type === 'slider') Settings[it.id] = clamp(Math.round((Settings[it.id] + d * 0.1) * 10) / 10, 0, 1);
    else if (it.type === 'bool') Settings[it.id] = !Settings[it.id];
    else if (it.type === 'choice') { const i = it.opts.indexOf(Settings[it.id]); Settings[it.id] = it.opts[(i + d + it.opts.length) % it.opts.length]; }
    else return;
    Settings.save(); Sound.applyVolume(); Sound.play('menuMove');
  }
  update() {
    this.t++;
    this.items.forEach(it => it.value = this.valueOf(it));
    const cur = this.items[this.menu.sel];
    if (UI.left() || pressedAny(B(2, 'left'))) this.change(cur, -1);
    if (UI.right() || pressedAny(B(2, 'right'))) this.change(cur, 1);
    if (UI.back()) { Sound.play('menuBack'); go(new TitleScene()); return; }
    const it = this.menu.update(); if (!it) return;
    if (it.type === 'action') {
      Sound.play('menuOk');
      if (it.id === 'back') go(new TitleScene());
      if (it.id === 'binds') go(new BindScene());
      if (it.id === 'fullscreen') { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { /* ignore */ } }
    } else if (it.type === 'slider' && Mouse.clicked) {
      const r = this.menu.rect(this.menu.sel); const k = (Mouse.x - (r.x + r.w * 0.45)) / (r.w * 0.5); if (k >= 0) { Settings[it.id] = clamp(Math.round(k * 10) / 10, 0, 1); Settings.save(); Sound.applyVolume(); Sound.play('menuMove'); }
    } else this.change(it, 1);
  }
  draw(g) {
    drawMenuBG(g, this.t);
    drawTitleText(g, 'SETTINGS', W / 2, 52, 50, '#ffd84a', '#ff2a3a');
    g.font = `700 16px ${FONT_JP}`; g.textAlign = 'center'; g.fillStyle = '#ffb3c6'; g.fillText('設定', W / 2, 90);
    this.menu.draw(g, this.t);
    drawFooter(g, '↑/↓ select   ·   ← / → change   ·   ENTER toggle   ·   ESC back   ·   settings are saved automatically');
  }
}

class BindScene {
  constructor() { this.t = 0; this.row = 0; this.col = 0; this.waiting = false; this.msg = ''; }
  rows() { return ACTIONS.length + 2; }
  cell(r, c) { return { x: 380 + c * 280, y: 118 + r * 41, w: 260, h: 36 }; }
  start() {
    this.waiting = true; Sound.play('menuOk');
    const p = this.col + 1, a = ACTIONS[this.row];
    Keys.rebind = code => {
      this.waiting = false;
      if (code === 'Escape') { this.msg = 'Cancelled.'; return; }
      if (['Enter', 'F5', 'F11', 'F12', 'KeyM', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7'].includes(code)) { this.msg = `${keyLabel(code)} is reserved by the game.`; Sound.play('menuBack'); return; }
      const old = Settings.binds[p][a];
      for (const q of [1, 2]) for (const b of ACTIONS) if (Settings.binds[q][b] === code && !(q === p && b === a)) { Settings.binds[q][b] = old; this.msg = `Swapped with P${q} ${ACTION_LABELS[b]}.`; }
      Settings.binds[p][a] = code; Settings.save(); Sound.play('menuOk');
      if (!this.msg.startsWith('Swapped')) this.msg = `P${p} ${ACTION_LABELS[a]} → ${keyLabel(code)}`;
    };
  }
  update() {
    this.t++;
    if (this.waiting) return;
    const n = this.rows();
    if (pressedAny('ArrowUp')) { this.row = (this.row + n - 1) % n; Sound.play('menuMove'); }
    if (pressedAny('ArrowDown')) { this.row = (this.row + 1) % n; Sound.play('menuMove'); }
    if (pressedAny('ArrowLeft', 'ArrowRight')) { this.col = 1 - this.col; Sound.play('menuMove'); }
    for (let r = 0; r < n; r++) for (let c = 0; c < 2; c++) {
      if (r >= ACTIONS.length && c === 1) continue;
      const rc = r >= ACTIONS.length ? { x: 380, y: 118 + r * 41 + 8, w: 540, h: 34 } : this.cell(r, c);
      if (inRect(rc)) { if (Mouse.moved) { this.row = r; this.col = c; } if (Mouse.clicked) { this.row = r; this.col = c; this.activate(); return; } }
    }
    if (pressedAny('Enter', 'Space')) { this.activate(); return; }
    if (pressedAny('Escape', 'Backspace')) { Sound.play('menuBack'); go(new SettingsScene()); }
  }
  activate() {
    if (this.row === ACTIONS.length) { Settings.binds = JSON.parse(JSON.stringify(DEFAULT_BINDS)); Settings.save(); this.msg = 'Defaults restored.'; Sound.play('menuOk'); return; }
    if (this.row === ACTIONS.length + 1) { Sound.play('menuBack'); go(new SettingsScene()); return; }
    this.msg = ''; this.start();
  }
  draw(g) {
    drawMenuBG(g, this.t);
    drawTitleText(g, 'KEY BINDINGS', W / 2, 46, 44, '#ffd84a', '#ff2a3a');
    g.font = `italic 900 22px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = P_COL[1]; g.fillText('PLAYER 1', 510, 96); g.fillStyle = P_COL[2]; g.fillText('PLAYER 2', 790, 96);
    ACTIONS.forEach((a, r) => {
      g.textAlign = 'right'; g.font = `700 17px ${FONT_UI}`; g.fillStyle = '#e8e0ff'; g.fillText(ACTION_LABELS[a], 360, 118 + r * 41 + 18);
      for (let c = 0; c < 2; c++) {
        const rc = this.cell(r, c), sel = this.row === r && this.col === c;
        g.fillStyle = sel ? (this.waiting ? '#ff2a55' : 'rgba(255,60,90,0.55)') : 'rgba(14,8,30,0.85)'; g.fillRect(rc.x, rc.y, rc.w, rc.h);
        g.strokeStyle = sel ? '#fff' : 'rgba(255,255,255,0.2)'; g.lineWidth = sel ? 2 : 1; g.strokeRect(rc.x, rc.y, rc.w, rc.h);
        g.textAlign = 'center'; g.font = `900 18px ${FONT_UI}`; g.fillStyle = '#fff';
        g.fillText(sel && this.waiting ? 'PRESS A KEY… (ESC cancels)' : keyLabel(Settings.binds[c + 1][a]), rc.x + rc.w / 2, rc.y + rc.h / 2 + 1);
      }
    });
    ['RESET TO DEFAULTS', 'BACK'].forEach((lab, i) => {
      const r = ACTIONS.length + i, rc = { x: 380, y: 118 + r * 41 + 8, w: 540, h: 34 }, sel = this.row === r;
      drawButton(g, rc, lab, null, sel, this.t);
    });
    if (this.msg) { g.font = `700 16px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = '#ffd84a'; g.fillText(this.msg, W / 2, 662); }
    drawFooter(g, 'ARROWS move   ·   ENTER rebind   ·   ESC back   ·   conflicting keys are swapped automatically');
  }
}
