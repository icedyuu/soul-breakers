// ================================ HUD =================================
const P_COL = { 1: '#ff3b5c', 2: '#3bb7ff' };
function drawTitleText(g, text, x, y, size, color = '#ffffff', glow = '#ff2a55', align = 'center') {
  g.save(); g.translate(x, y); if (!Settings.pixel) g.transform(1, 0, -0.16, 1, 0, 0);
  g.font = `italic 900 ${size}px ${FONT_T}`; g.textAlign = align; g.textBaseline = 'middle';
  const gr = g.createLinearGradient(0, -size / 2, 0, size / 2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, color); gr.addColorStop(1, glow);
  g.shadowColor = glow; g.shadowBlur = Settings.pixel ? 0 : size * 0.35;
  strokeText(g, text, 0, 0, gr, OUTLINE, Math.max(4, size * 0.12));
  g.restore();
}
function drawFooter(g, text) { g.font = `600 16px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(220,210,255,0.75)'; g.fillText(text, W / 2, H - 22); }
function panel(g, x, y, w, h, col = 'rgba(10,6,24,0.82)', border = 'rgba(255,255,255,0.15)') {
  if (Settings.pixel) return pxBox(g, x, y, w, h, col, border);
  g.fillStyle = col; g.beginPath(); g.moveTo(x + 14, y); g.lineTo(x + w, y); g.lineTo(x + w - 14, y + h); g.lineTo(x, y + h); g.closePath(); g.fill();
  g.strokeStyle = border; g.lineWidth = 1.5; g.stroke();
}
// ---------- pixel-art HUD pieces ----------
function pxHealthBar(g, F, bt, t, x0, y, w, h) {
  const rows = h / 2, rr = F.redHp / F.maxHp, r = F.hp / F.maxHp, low = r < 0.3, col = P_COL[F.pid];
  const blink = low && (t >> 3) % 2;
  const band = i => low ? (i < 2 ? (blink ? '#ffd0d0' : '#ff9a9a') : i < 7 ? (blink ? '#ff4a4a' : '#ff2a3a') : '#a8101e') : i < 2 ? '#fff9d0' : i < 5 ? '#ffe14a' : i < 10 ? '#ffb326' : '#e8761a';
  // frame: drop shadow, border rows, slanted edges
  for (let i = -2; i <= rows + 1; i++) {
    const yy = y + i * 2, sh = snap2(i * 2 * 0.6), xl = x0 - sh;
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(xl - 2, yy + 4, w + 8, 2);
    if (i < 0 || i >= rows) { g.fillStyle = i === -2 || i === rows + 1 ? '#05020a' : col; g.fillRect(xl - 4, yy, w + 8, 2); continue; }
    g.fillStyle = col; g.fillRect(xl - 4, yy, 4, 2); g.fillRect(xl + w, yy, 4, 2);
    g.fillStyle = '#0c0614'; g.fillRect(xl, yy, w, 2);
    g.fillStyle = i === 0 ? '#ff7a8a' : '#c4102e'; g.fillRect(xl, yy, snap2(w * rr), 2);
    g.fillStyle = band(i); g.fillRect(xl, yy, snap2(w * r), 2);
    g.fillStyle = 'rgba(0,0,0,0.35)'; for (let s = 1; s < 10; s++) g.fillRect(xl + snap2(w * s / 10), yy, 2, 2);
  }
  // round pips
  for (let i = 0; i < 2; i++) { const won = bt.wins[F.pid - 1] > i; pxDiamond(g, x0 + w - 30 - i * 26, y + h + 16, 8, won ? '#ffd84a' : '#1a1028', won ? '#fff6c0' : '#4a3a6a'); }
}
function pxPortrait(g, F, px, py, side) {
  const x = px - 46, y = py - 46, col = P_COL[F.pid];
  pxBox(g, x, y, 92, 92, '#000000', col, { n: 8 });
  g.save(); g.beginPath(); g.rect(x + 4, y + 4, 84, 84); g.clip(); g.imageSmoothingEnabled = false;
  const img = chArt(F.ch, F.variant, 'portrait');
  if (side > 0) g.drawImage(img, px - 60, py - 60, 120, 120); else { g.translate(px, py); g.scale(-1, 1); g.drawImage(img, -60, -60, 120, 120); }
  g.restore();
  pxBox(g, side > 0 ? x + 58 : x - 2, y + 74, 36, 20, col, '#ffffff', { n: 2, shadow: false });
  g.font = `900 14px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText(F.pid + 'P', (side > 0 ? x + 58 : x - 2) + 18, y + 84);
}
function pxSoulGauge(g, F, mx, my, mw, mh, side, t) {
  const full = F.meter >= 100, mr = F.meter / 100, c = F.colors.accent;
  pxBox(g, mx - 6, my - 6, mw + 12, mh + 12, 'rgba(8,4,18,0.9)', full && (t >> 3) % 2 ? '#ffffff' : 'rgba(255,255,255,0.25)');
  const segW = (mw - 6) / 4;
  for (let i = 0; i < 4; i++) {
    const k = clamp(mr * 4 - i, 0, 1), sx = side > 0 ? mx + i * (segW + 2) : mx + mw - (i + 1) * (segW + 2) + 2, fw = snap2(segW * k);
    g.fillStyle = '#05020c'; g.fillRect(snap2(sx), my, snap2(segW), mh);
    if (fw <= 0) continue;
    const fx = side > 0 ? snap2(sx) : snap2(sx + segW - fw);
    g.fillStyle = c; g.fillRect(fx, my, fw, mh);
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(fx, my, fw, 4); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(fx, my + mh - 4, fw, 4);
    if (full) { g.fillStyle = `rgba(255,255,255,${(t >> 2) % 2 ? 0.35 : 0})`; g.fillRect(fx, my, fw, mh); }
  }
}
function hexPath(g, x, y, r) { g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + Math.PI / 6; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); }
function wrapText(g, text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; } else line = t; }
  if (line) g.fillText(line, x, y); return y + lh;
}

function drawHUD(g, bt) {
  const t = bt.pf;
  const sides = [[bt.p1, 1], [bt.p2, -1]];
  for (const [F, side] of sides) {
    const x0 = 112, y = 30, w = 450, h = 28;
    const hpShape = () => { g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + w, y); g.lineTo(x0 + w - h * 0.6, y + h); g.lineTo(x0 - h * 0.6, y + h); g.closePath(); };
    g.save();
    if (side < 0) { g.translate(W, 0); g.scale(-1, 1); }
    if (Settings.pixel) { pxHealthBar(g, F, bt, t, x0, y, w, h); g.restore(); }
    else {
    g.fillStyle = 'rgba(8,4,18,0.85)'; hpShape(); g.fill();
    g.save(); hpShape(); g.clip();
    const rr = F.redHp / F.maxHp, r = F.hp / F.maxHp;
    g.fillStyle = '#ff2b3b'; g.fillRect(x0 - 20, y, (w + 20) * rr, h);
    const low = r < 0.3;
    const gr = g.createLinearGradient(0, y, 0, y + h);
    if (low) { const p = 0.6 + 0.4 * Math.sin(t * 0.3); gr.addColorStop(0, `rgba(255,${120 * p | 0},80,1)`); gr.addColorStop(1, '#c4101e'); }
    else { gr.addColorStop(0, '#fff5a8'); gr.addColorStop(0.45, '#ffd23a'); gr.addColorStop(1, '#ff8a10'); }
    g.fillStyle = gr; g.fillRect(x0 - 20, y, (w + 20) * r, h);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x0 - 20, y + 2, (w + 20) * r, 4);
    g.restore();
    hpShape(); g.strokeStyle = P_COL[F.pid]; g.lineWidth = 2.5; g.shadowColor = P_COL[F.pid]; g.shadowBlur = 10; g.stroke(); g.shadowBlur = 0;
    // round markers
    for (let i = 0; i < 2; i++) {
      const cx = x0 + w - 30 - i * 26, cy = y + h + 16;
      g.beginPath(); g.moveTo(cx, cy - 8); g.lineTo(cx + 8, cy); g.lineTo(cx, cy + 8); g.lineTo(cx - 8, cy); g.closePath();
      const won = bt.wins[F.pid - 1] > i; g.fillStyle = won ? '#ffd84a' : 'rgba(20,10,30,0.8)'; g.fill(); g.strokeStyle = won ? '#fff6c0' : 'rgba(255,255,255,0.3)'; g.lineWidth = 1.5; g.stroke();
      if (won) { g.shadowColor = '#ffd84a'; g.shadowBlur = 12; g.fill(); g.shadowBlur = 0; }
    }
    g.restore();
    }
    // portrait
    const px = side > 0 ? 58 : W - 58, py = 50;
    if (Settings.pixel) pxPortrait(g, F, px, py, side);
    else {
    g.save(); hexPath(g, px, py, 46); g.fillStyle = '#000'; g.fill(); g.clip();
    const img = chArt(F.ch, F.variant, 'portrait');
    if (side > 0) g.drawImage(img, px - 60, py - 60, 120, 120); else { g.translate(px, py); g.scale(-1, 1); g.drawImage(img, -60, -60, 120, 120); }
    g.restore();
    hexPath(g, px, py, 46); g.strokeStyle = P_COL[F.pid]; g.lineWidth = 3; g.stroke();
    }
    // names
    g.textBaseline = 'alphabetic'; g.textAlign = side > 0 ? 'left' : 'right';
    const nx = side > 0 ? 106 : W - 106;
    g.font = `italic 900 24px ${FONT_T}`; strokeText(g, F.ch.name, nx, 90, '#ffffff', OUTLINE, 5);
    const nmw = g.measureText(F.ch.name).width;
    g.font = `700 15px ${FONT_JP}`; strokeText(g, F.ch.jp + ' · ' + F.ch.titleJp, nx + side * (nmw + 14), 89, '#d9c8ff', OUTLINE, 4);
    g.font = `900 12px ${FONT_UI}`; strokeText(g, F.burstReady ? '◆ BURST READY' : '◇ BURST USED', nx, 110, F.burstReady ? '#ffffff' : '#666', OUTLINE, 3);
    if (bt.cpu && F.pid === 2) { g.font = `italic 900 17px ${FONT_T}`; strokeText(g, 'CPU · ' + CPU_LEVELS[bt.cpu.level].name, nx - 128, 110, CPU_LEVELS[bt.cpu.level].color, OUTLINE, 3); }
    if (F.rage > 0) { g.font = `italic 900 18px ${FONT_T}`; strokeText(g, `RAGE  鬼神 ${Math.ceil(F.rage / 60)}`, nx, 134, '#ff4a3a', OUTLINE, 4); }
    // soul gauge
    const mx = side > 0 ? 40 : W - 40 - 330, my = 684, mw = 330, mh = 16;
    const full = F.meter >= 100, mr = F.meter / 100;
    if (Settings.pixel) pxSoulGauge(g, F, mx, my, mw, mh, side, t);
    else {
    panel(g, mx - 6, my - 6, mw + 12, mh + 12, 'rgba(8,4,18,0.85)', 'rgba(255,255,255,0.2)');
    const mg = g.createLinearGradient(mx, 0, mx + mw, 0); mg.addColorStop(0, '#ffffff'); mg.addColorStop(0.2, F.colors.accent); mg.addColorStop(1, full ? '#ffffff' : F.colors.accent);
    g.fillStyle = mg; if (side > 0) g.fillRect(mx, my, mw * mr, mh); else g.fillRect(mx + mw * (1 - mr), my, mw * mr, mh);
    if (full) { g.save(); g.globalAlpha = 0.4 + 0.4 * Math.sin(t * 0.3); g.shadowColor = F.colors.accent; g.shadowBlur = 20; g.fillRect(mx, my, mw, mh); g.restore(); }
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 2; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(mx + mw * i / 4, my); g.lineTo(mx + mw * i / 4, my + mh); g.stroke(); }
    }
    g.font = `900 13px ${FONT_UI}`; g.textAlign = side > 0 ? 'left' : 'right'; g.textBaseline = 'middle';
    strokeText(g, full ? '魂 ULTIMATE READY — SP1+SP2' : `魂 SOUL ${Math.floor(F.meter)}%`, side > 0 ? mx + 6 : mx + mw - 6, my - 16, full ? (t % 20 < 10 ? '#ffffff' : F.colors.accent) : '#cfc4ee', OUTLINE, 4);
    // special move indicators
    const specials = [['sp1', 'SP1'], ['sp1f', '↓→SP1'], ['counter', '↓←SP1'], ['sp2', 'SP2'], ['sp2f', '↓→SP2'], ['sp2d', '↓↓SP2']];
    if (F.ch.drawHand) F.ch.drawHand(g, F, side, t);
    else specials.forEach(([k, lab], i) => {
      const m = F.ch.moves[k]; if (!m) return;
      const bw = 62, bh = 24, bx = side > 0 ? 40 + i * (bw + 4) : W - 40 - bw - i * (bw + 4), by = 622;
      const cd = F.cd[k] || 0, ready = cd <= 0;
      g.fillStyle = ready ? 'rgba(20,12,40,0.88)' : 'rgba(10,6,16,0.9)'; g.fillRect(bx, by, bw, bh);
      if (!ready) { g.fillStyle = 'rgba(120,120,140,0.35)'; g.fillRect(bx, by + bh * (1 - cd / m.cd), bw, bh * cd / m.cd); }
      g.strokeStyle = ready ? F.colors.accent : 'rgba(255,255,255,0.15)'; g.lineWidth = 1.5; g.strokeRect(bx, by, bw, bh);
      g.font = `700 12px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = ready ? '#ffffff' : '#777'; g.fillText(lab, bx + bw / 2, by + bh / 2 + 1);
    });
  }
  // timer
  if (Settings.pixel) { pxBox(g, W / 2 - 50, 4, 100, 92, '#0a0614', '#ffd84a', { n: 8, bands: ['#1a1030', '#140c26', '#100a1e', '#0c0818', '#0a0614', '#0a0614'] }); g.fillStyle = '#ffd84a'; g.fillRect(W / 2 - 30, 76, 60, 2); }
  else { g.save(); hexPath(g, W / 2, 50, 46); g.fillStyle = 'rgba(8,4,18,0.92)'; g.fill(); g.strokeStyle = '#ffd84a'; g.lineWidth = 3; g.shadowColor = '#ffb020'; g.shadowBlur = 12; g.stroke(); g.restore(); }
  const secs = bt.timer === Infinity ? '∞' : String(Math.max(0, Math.ceil(bt.timer / 60)));
  const lowT = bt.timer !== Infinity && bt.timer < 600;
  g.font = `italic 900 ${secs === '∞' ? 50 : 46}px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  strokeText(g, secs, W / 2, 52, lowT && t % 30 < 15 ? '#ff4a4a' : '#ffffff', OUTLINE, 6);
  g.font = `700 12px ${FONT_JP}`; g.fillStyle = '#ffd84a'; g.fillText(bt.practice ? (bt.mode === 'training' ? '修行' : '練習') : `第${KANJI_NUM[Math.min(9, bt.round)]}戦`, W / 2, 86);
  drawComboHUD(g, bt);
  if (bt.practice && !bt.cine) drawPracticePanel(g, bt);
}

function drawPracticePanel(g, bt) {
  const D = bt.p2, A = bt.p1, dm = bt.dm;
  const ST = ['STAND', 'CROUCH', 'JUMP'], GD = ['NO BLOCK', 'BLOCK ALL', 'BLOCK AFTER HIT', 'RANDOM BLOCK'], AC = ['IDLE', 'JAB (CH test)', 'BURST @4 HITS'];
  // panels fade out when a fighter stands behind them (corner/wall combos stay visible)
  const sx = [A, D].map(F => bt.cam.toScreen(F.x, F.y)[0]);
  const fadeL = sx.some(x => x < 360) ? 0.28 : 1, fadeR = sx.some(x => x > W - 360) ? 0.28 : 1;
  bt.panelFadeL = lerp(bt.panelFadeL ?? 1, fadeL, 0.2); bt.panelFadeR = lerp(bt.panelFadeR ?? 1, fadeR, 0.2);
  g.save(); g.globalAlpha = bt.panelFadeL;
  panel(g, 24, 120, 300, 206);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = `italic 900 20px ${FONT_T}`; strokeText(g, bt.mode === 'training' ? 'TRAINING  修行' : 'PRACTICE  練習', 40, 146, '#ffd84a', OUTLINE, 4);
  const lines = [
    ['Last hit', `${Math.round(D.lastDmg)} dmg`], ['Combo', `${D.comboHits} hits · ${Math.round(D.comboDmg)} dmg`],
    ['Scaling', D.comboRaw > 0 ? `${Math.round(D.comboDmg / D.comboRaw * 100)}%` : '100%'], ['Juggle', `${D.juggle} / ${A.ch.juggleMax || 6}`],
    ['Max combo', `${A.stats.maxCombo} hits`], ['Dummy', `${ST[dm.stance]} · ${GD[dm.guard]}`], ['Action', AC[dm.action]],
    ['Meter ∞ · Burst', `${bt.infMeter ? 'ON' : 'OFF'} · ${D.burstReady ? 'ready' : 'used'}`],
  ];
  g.font = `600 13px ${FONT_UI}`;
  lines.forEach(([a, b], i) => { g.fillStyle = '#a99ccf'; g.fillText(a, 40, 170 + i * 19); g.fillStyle = '#ffffff'; g.fillText(b, 150, 170 + i * 19); });
  drawInputHistory(g, A, 24, 334, 216);
  g.restore();
  g.font = `600 12px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = 'rgba(230,220,255,0.9)';
  g.fillText('[1] Stance  [2] Guard  [3] Action  [4] Meter ∞  [5] Reset  [6] Reset at wall  [7] Hitboxes', W / 2, 110);
  g.fillText(bt.mode === 'training' ? '[8] Moves / Trials / Frame data  [9] Next trial  [0] Prev   ·   ESC: menu & move list' : 'BLOCK+HEAVY while hit = Soul Burst   ·   ESC: menu & move list', W / 2, 126);
  if (bt.mode === 'training') { g.save(); g.globalAlpha = bt.panelFadeR; drawTrainingPanel(g, bt); g.restore(); }
}

function drawCutIn(g, fr) {
  const F = fr.F, m = fr.m, t = fr.f, dur = fr.dur, c = F.colors.accent;
  const inK = easeOut(t / 10), outK = t > dur - 10 ? (t - (dur - 10)) / 10 : 0, left = F.pid === 1;
  const bandH = 190;
  g.save(); g.globalAlpha = 1 - outK;
  g.translate(W / 2, H * 0.43); g.rotate(-0.05); g.translate(-W / 2, 0);
  g.translate(left ? lerp(-W, 0, inK) : lerp(W, 0, inK), 0);
  g.fillStyle = '#000'; g.fillRect(-100, -bandH / 2 - 8, W + 200, bandH + 16);
  g.fillStyle = c; g.fillRect(-100, -bandH / 2 - 10, W + 200, 6); g.fillRect(-100, bandH / 2 + 4, W + 200, 6);
  g.save(); g.beginPath(); g.rect(-100, -bandH / 2, W + 200, bandH); g.clip();
  const img = chArt(F.ch, F.variant, 'cutin');
  if (left) g.drawImage(img, t * 0.7 - 20, -bandH / 2);
  else { g.translate(W, 0); g.scale(-1, 1); g.drawImage(img, t * 0.7 - 20, -bandH / 2); }
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,255,255,0.22)';
  for (let i = 0; i < 16; i++) g.fillRect(rand(-100, W), rand(-bandH / 2, bandH / 2), rand(80, 320), 2);
  g.restore();
  g.textAlign = left ? 'right' : 'left'; g.textBaseline = 'alphabetic';
  const tx = left ? W - 50 : 50;
  g.save(); g.translate(tx, 0); g.transform(1, 0, -0.18, 1, 0, 0);
  g.font = `900 18px ${FONT_UI}`; strokeText(g, '奥義 · ULTIMATE', 0, -48, c, OUTLINE, 4);
  g.font = `italic 900 ${m.name.length > 18 ? 46 : 56}px ${FONT_T}`; g.shadowColor = c; g.shadowBlur = 24;
  const gr = g.createLinearGradient(0, -40, 0, 10); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, c);
  strokeText(g, m.name, 0, 10, gr, OUTLINE, 8); g.shadowBlur = 0;
  g.font = `900 40px ${FONT_JP}`; strokeText(g, m.jp, 0, 62, '#ffffff', OUTLINE, 7);
  g.restore();
  g.restore();
}

function speechBox(g, x, y, w, name, jp, text, col, alpha = 1) {
  g.save(); g.globalAlpha = alpha;
  panel(g, x, y, w, 84, 'rgba(8,4,20,0.9)', col);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = `italic 900 22px ${FONT_T}`; strokeText(g, name, x + 26, y + 28, col, OUTLINE, 4);
  const nw = g.measureText(name).width;
  g.font = `700 14px ${FONT_JP}`; g.fillStyle = '#cbb8ff'; g.fillText(jp, x + 40 + nw, y + 27);
  g.font = `italic 600 21px ${FONT_UI}`; g.fillStyle = '#ffffff'; g.fillText('“' + text + '”', x + 26, y + 62);
  g.restore();
}
function drawQuote(g, bt) {
  const q = bt.quote, F = q.F, a = Math.min(1, (q.t - 20) / 12);
  speechBox(g, W / 2 - 380, H - 200, 760, F.ch.name, F.ch.titleJp, q.text, F.colors.accent, a);
}
function drawIntroCard(g, bt) {
  const f = bt.pf, F = f < 100 ? bt.p1 : bt.p2, lf = f < 100 ? f : f - 100;
  const k = easeOut(lf / 14), left = F.pid === 1;
  g.save();
  const x = left ? lerp(-500, 60, k) : lerp(W + 500, W - 60, k);
  g.textAlign = left ? 'left' : 'right';
  drawTitleText(g, F.ch.name, x, 210, 96, '#ffffff', F.colors.accent, left ? 'left' : 'right');
  g.font = `900 34px ${FONT_JP}`; g.textBaseline = 'middle'; strokeText(g, `${F.ch.jp}  ${F.ch.titleJp}`, x, 280, '#ffffff', OUTLINE, 6);
  g.font = `italic 700 22px ${FONT_UI}`; strokeText(g, F.ch.title.toUpperCase() + ' — ' + F.ch.style, x, 318, F.colors.accent, OUTLINE, 5);
  g.restore();
  if (lf > 25) speechBox(g, W / 2 - 380, H - 200, 760, F.ch.name, F.ch.titleJp, F.ch.intro, F.colors.accent, Math.min(1, (lf - 25) / 10));
  drawFooter(g, 'ENTER / F / K to skip');
}

function drawMoveList(g, ch, x, y, w, label, page = 0) {
  if (ch.baseCh) ch = ch.baseCh; // shape-shifters always show their full list
  panel(g, x, y, w, 600, 'rgba(10,6,26,0.94)', ch.colors.accent);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = `italic 900 30px ${FONT_T}`; strokeText(g, `${label} · ${ch.name}`, x + 26, y + 40, '#ffffff', OUTLINE, 5);
  const hw = g.measureText(`${label} · ${ch.name}`).width;
  g.font = `700 18px ${FONT_JP}`; g.fillStyle = ch.colors.accent; g.fillText(`${ch.titleJp} — ${ch.style}`, x + 44 + hw, y + 38);
  page = page % listPages(ch);
  if (ch.listPage) { const r = ch.listPage(g, x, y, w, page); if (r === true) return; if (typeof r === 'number') page = r; }
  if (page === 0) {
    const rows = MOVELIST.filter(([k]) => ch.moves[k]);
    const rh = Math.min(30.5, 500 / rows.length);
    g.font = `800 11px ${FONT_UI}`; g.fillStyle = '#8a80aa'; g.textAlign = 'right'; g.fillText('INPUT', x + w - 26, y + 58); g.fillText('STARTUP', x + w - 150, y + 58); g.textAlign = 'left';
    rows.forEach(([k, lab, inp], i) => {
      const m = ch.moves[k], yy = y + 80 + i * rh;
      if (i % 2 === 0) { g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(x + 18, yy - rh + 9, w - 36, rh - 2); }
      g.font = `${m.special || m.ult ? 800 : 600} 14px ${FONT_UI}`; g.fillStyle = m.ult ? '#ffd84a' : m.special ? ch.colors.accent : '#e8e0ff';
      g.fillText(lab || m.name, x + 26, yy);
      if (m.jp && (m.special || m.ult)) { const lw = g.measureText(lab || m.name).width; g.font = `600 12px ${FONT_JP}`; g.fillStyle = '#a99ccf'; g.fillText(m.jp, x + 34 + lw, yy); }
      g.textAlign = 'right'; g.font = `700 12px ${FONT_UI}`; g.fillStyle = '#a99ccf'; g.fillText(m.virtual ? '—' : m.st + 'f', x + w - 150, yy);
      g.font = `800 14px ${FONT_UI}`; g.fillStyle = '#ffffff'; g.fillText(inp, x + w - 26, yy); g.textAlign = 'left';
    });
    g.font = `italic 500 12px ${FONT_UI}`; g.fillStyle = '#a99ccf';
    g.fillText('→ = toward opponent · ← = away.  Page → for follow-ups & example combos.', x + 26, y + 588);
  } else if (page === 1) {
    let yy = y + 72;
    g.font = `italic 900 20px ${FONT_T}`; strokeText(g, 'FOLLOW-UPS & TARGET COMBOS', x + 26, yy, '#ffd84a', OUTLINE, 4); yy += 26;
    for (const [k, lab, inp] of (ch.extraList || []).filter(([k]) => !k.startsWith('card_'))) {
      g.font = `700 14px ${FONT_UI}`; g.fillStyle = ch.colors.accent; g.fillText(lab, x + 30, yy);
      g.textAlign = 'right'; g.fillStyle = '#ffffff'; g.fillText(inp, x + w - 26, yy); g.textAlign = 'left'; yy += 22;
    }
    yy += 6; g.font = `600 13px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; yy = wrapText(g, `Juggle limit: ${ch.juggleMax || 6} points  ·  Universal: L→M→H→Special→Ultimate, L+H launcher, M+H throw (tech: M+H), BLOCK+H burst`, x + 30, yy, w - 60, 16) + 12;
    g.font = `italic 900 20px ${FONT_T}`; strokeText(g, 'EXAMPLE COMBOS', x + 26, yy, '#ffd84a', OUTLINE, 4); yy += 26;
    (ch.combos || []).forEach((c, i) => {
      g.font = `800 15px ${FONT_UI}`; g.fillStyle = '#ffffff'; g.fillText(`${i + 1}. ${c.name}`, x + 30, yy); yy += 19;
      g.font = `600 13px ${FONT_UI}`; g.fillStyle = '#ffd84a'; yy = wrapText(g, c.notation, x + 46, yy, w - 80, 16);
      if (c.pre) { g.fillStyle = '#7fe9ff'; g.fillText('setup: ' + c.pre.map(k => ch.moves[k] ? ch.moves[k].name : k).join(', '), x + 46, yy); yy += 16; }
      yy += 6;
    });
  } else {
    let yy = y + 72;
    g.font = `italic 900 20px ${FONT_T}`; strokeText(g, 'CARD DECK (8)', x + 26, yy, '#ffd84a', OUTLINE, 4); yy += 18;
    for (const id of CARD_IDS) {
      const d = CARD_DEFS[id];
      drawCard(g, x + 44, yy + 22, 26, 36, id, {});
      g.font = `800 14px ${FONT_UI}`; g.fillStyle = d.col; g.fillText(`${d.name}  ·  ${d.cat}`, x + 68, yy + 14);
      g.font = `500 12px ${FONT_UI}`; g.fillStyle = '#e8e0ff'; wrapText(g, d.desc, x + 68, yy + 30, w - 100, 14);
      yy += 58;
    }
  }
}

function drawComboHUD(g, bt) {
  const prac = bt.practice;
  bt.comboShow.forEach((c, i) => {
    if (!c) return;
    const left = i === 0, x = left ? (prac ? 175 : 70) : W - 70, y = prac ? 430 : 250;
    const k = c.t > 70 ? 1 - (c.t - 70) / 20 : 1, pop = c.t < 6 ? 1.35 - c.t * 0.06 : 1;
    g.save(); g.globalAlpha = Math.max(0, k); g.translate(x, y); g.scale(pop, pop); g.transform(1, 0, -0.15, 1, 0, 0);
    g.textAlign = left ? 'left' : 'right'; g.textBaseline = 'alphabetic';
    const col = (left ? bt.p1 : bt.p2).colors.accent, sg = left ? 1 : -1;
    g.font = `italic 900 92px ${FONT_T}`; g.shadowColor = col; g.shadowBlur = 20;
    const gr = g.createLinearGradient(0, -80, 0, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, col);
    strokeText(g, String(c.hits), 0, 0, gr, OUTLINE, 9); g.shadowBlur = 0;
    const nw = g.measureText(String(c.hits)).width;
    g.font = `italic 900 30px ${FONT_T}`; strokeText(g, 'HIT COMBO', sg * (nw + 10), -8, '#ffffff', OUTLINE, 6);
    g.font = `900 22px ${FONT_JP}`; strokeText(g, `${c.hits}連撃`, sg * (nw + 12), -46, col, OUTLINE, 5);
    g.font = `800 17px ${FONT_UI}`;
    strokeText(g, `${Math.round(c.dmg)} DMG · ${Math.round(c.pct * 100)}% HP · SCALING ${Math.round((c.raw > 0 ? c.dmg / c.raw : 1) * 100)}%`, 4 * sg, 28, '#ffd84a', OUTLINE, 4);
    const tags = [];
    if (c.flags.counter) tags.push(['COUNTER HIT', '#ffe14a']); if (c.flags.air) tags.push(['AIR COMBO', '#7fe9ff']);
    if (c.flags.wall) tags.push(['WALL COMBO', '#c9a2ff']); if (c.flags.bounce) tags.push(['BOUNCE', '#ffffff']); if (c.flags.link) tags.push(['LINK', '#7dfcff']);
    g.font = `italic 900 18px ${FONT_T}`; let tx = 4 * sg;
    for (const [tg, tc] of tags) { strokeText(g, tg, tx, 54, tc, OUTLINE, 4); tx += sg * (g.measureText(tg).width + 14); }
    g.font = `700 13px ${FONT_UI}`; strokeText(g, `JUGGLE ${c.juggle}/${c.jmax}`, 4 * sg, 76, '#cfc4ee', OUTLINE, 3);
    g.restore();
  });
  bt.comboEnd.forEach((e, i) => {
    if (!e || e.t > 140) return;
    const left = i === 0, x = left ? (prac ? 175 : 70) : W - 70, y = (prac ? 430 : 250) + 108;
    const a = e.t < 8 ? e.t / 8 : e.t > 115 ? (140 - e.t) / 25 : 1, sl = easeOut(e.t / 10);
    g.save(); g.globalAlpha = a; g.translate(x + (left ? -1 : 1) * (1 - sl) * 120, y); g.transform(1, 0, -0.15, 1, 0, 0);
    g.textAlign = left ? 'left' : 'right'; g.textBaseline = 'alphabetic';
    const col = e.perfect ? '#fff2a8' : '#ffffff';
    g.font = `italic 900 ${e.perfect ? 30 : 24}px ${FONT_T}`;
    strokeText(g, e.perfect ? 'PERFECT COMBO!' : 'COMBO END', 0, 0, col, OUTLINE, 5);
    g.font = `800 15px ${FONT_UI}`;
    strokeText(g, `${e.hits} HITS · ${Math.round(e.dmg)} DMG (${Math.round(e.pct * 100)}%) · SCALED TO ${Math.round(e.scale * 100)}%`, 0, 22, '#ffd84a', OUTLINE, 4);
    g.restore();
  });
}
const BTN_CHIP = { light: ['L', '#7fe9ff'], medium: ['M', '#ffd84a'], heavy: ['H', '#ff5a5a'], sp1: ['S1', '#c9a2ff'], sp2: ['S2', '#ff8ad8'], block: ['B', '#9aff9a'] };
const ARROWS = { 1: '↙', 2: '↓', 3: '↘', 4: '←', 5: '•', 6: '→', 7: '↖', 8: '↑', 9: '↗' };
function drawInputHistory(g, F, x, y, h) {
  panel(g, x, y, 136, h, 'rgba(10,6,24,0.7)');
  g.textAlign = 'left'; g.textBaseline = 'middle'; g.font = `900 12px ${FONT_UI}`; g.fillStyle = '#ffd84a'; g.fillText('INPUT HISTORY', x + 16, y + 14);
  const log = F.input.log, rows = Math.floor((h - 30) / 19);
  for (let i = 0; i < Math.min(rows, log.length); i++) {
    const idx = log.length - 1 - i, e = log[idx], nf = idx === log.length - 1 ? F.input.f : log[idx + 1].f, yy = y + 34 + i * 19;
    g.font = `600 11px ${FONT_UI}`; g.fillStyle = '#8a80aa'; g.textAlign = 'right'; g.fillText(String(Math.min(99, nf - e.f)), x + 34, yy);
    g.textAlign = 'left'; g.font = `900 15px ${FONT_UI}`; g.fillStyle = '#ffffff'; g.fillText(ARROWS[e.d], x + 40, yy);
    let bx = x + 58;
    for (const b of e.b) { const [lab, c] = BTN_CHIP[b]; g.fillStyle = c; g.beginPath(); g.arc(bx + 8, yy, 8, 0, TAU); g.fill(); g.fillStyle = '#111'; g.font = `900 9px ${FONT_UI}`; g.textAlign = 'center'; g.fillText(lab, bx + 8, yy + 0.5); g.textAlign = 'left'; bx += 18; }
  }
}
function drawTrainingPanel(g, bt) {
  const A = bt.p1, D = bt.p2, ch = A.ch, x = W - 318, y = 112, w = 300, hh = 500;
  panel(g, x, y, w, hh, 'rgba(10,6,24,0.68)');
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  ['MOVES', 'TRIALS', 'FRAME DATA'].forEach((v, i) => { g.font = `italic 900 ${bt.panel === i ? 17 : 13}px ${FONT_T}`; strokeText(g, v, x + 22 + i * 86, y + 24, bt.panel === i ? '#ffd84a' : '#8a80aa', OUTLINE, 3); });
  g.font = `600 11px ${FONT_UI}`; g.fillStyle = '#8a80aa'; g.fillText('[8] switch view', x + 22, y + 40);
  if (bt.panel === 0) {
    const rows = MOVELIST.concat(ch.extraList || []).filter(([k]) => ch.moves[k]);
    const done = rows.filter(([k]) => A.performed.has(k)).length;
    g.font = `800 12px ${FONT_UI}`; g.fillStyle = '#ffd84a'; g.textAlign = 'right'; g.fillText(`${done}/${rows.length}`, x + w - 18, y + 40); g.textAlign = 'left';
    const rh = Math.min(17, (hh - 60) / rows.length);
    rows.forEach(([k, label, inp], i) => {
      const m = ch.moves[k], yy = y + 58 + i * rh, ok = A.performed.has(k), shortInp = k === 'ult' ? 'SP1+SP2' : inp;
      let name = (label || m.name).replace(/ \(.*\)/, '');
      g.font = `600 11px ${FONT_UI}`;
      while (g.measureText(name).width > w - 128 && name.length > 4) name = name.slice(0, -2) + '…';
      g.fillStyle = ok ? '#6dffa0' : '#e8e0ff'; g.fillText((ok ? '✔ ' : '○ ') + name, x + 20, yy);
      g.textAlign = 'right'; g.fillStyle = ok ? '#6dffa0' : '#ffd84a'; g.font = `700 11px ${FONT_UI}`; g.fillText(shortInp, x + w - 18, yy); g.textAlign = 'left';
    });
  } else if (bt.panel === 1) {
    const list = ch.combos || [];
    g.font = `600 11px ${FONT_UI}`; g.fillStyle = '#8a80aa'; g.fillText('[9] next trial   [0] previous', x + 120, y + 40);
    let yy = y + 64;
    list.forEach((tr, i) => {
      const sel = i === bt.trialIdx, done = bt.trialDone.has(ch.id + ':' + i);
      g.font = `italic 900 ${sel ? 16 : 13}px ${FONT_T}`; strokeText(g, `${done ? '✔' : i + 1 + '.'} ${tr.name}`, x + 20, yy, done ? '#6dffa0' : sel ? '#ffffff' : '#a99ccf', OUTLINE, 3);
      yy += 18; g.font = `600 12px ${FONT_UI}`; g.fillStyle = sel ? '#ffd84a' : '#8a80aa';
      yy = wrapText(g, tr.notation, x + 26, yy, w - 46, 15);
      if (sel) {
        let cx = x + 26;
        tr.seq.forEach((st, j) => {
          const m = ch.moves[st], lab = st === 'proj' ? 'proj' : (m ? (m.name.length > 12 ? st : m.name) : st);
          g.font = `800 10px ${FONT_UI}`; const tw = g.measureText(lab).width + 12;
          if (cx + tw > x + w - 14) { cx = x + 26; yy += 20; }
          g.fillStyle = j < bt.trialProg ? '#18a85a' : 'rgba(255,255,255,0.12)'; g.fillRect(cx, yy - 10, tw, 16);
          g.fillStyle = '#fff'; g.fillText(lab, cx + 6, yy + 2); cx += tw + 5;
        });
        yy += 16;
        if (tr.pre) { g.font = `600 11px ${FONT_UI}`; g.fillStyle = '#7fe9ff'; g.fillText('Setup first: ' + tr.pre.map(k => ch.moves[k] ? ch.moves[k].name : k).join(', '), x + 26, yy); yy += 14; }
        if (tr.hand) { g.font = `600 11px ${FONT_UI}`; g.fillStyle = '#ff8ad8'; yy = wrapText(g, 'Hand set to: ' + tr.hand.map(id => CARD_DEFS[id].name).join(' · '), x + 26, yy, w - 44, 13) + 2; }
      }
      yy += 10;
    });
    g.font = `500 11px ${FONT_UI}`; g.fillStyle = '#a99ccf'; wrapText(g, 'Steps light up as each attack of the route hits. Reset with [5] (or [6] at the wall).', x + 20, y + hh - 34, w - 40, 14);
  } else {
    const fd = A.lastFD;
    g.font = `600 13px ${FONT_UI}`;
    const rows = fd ? [
      ['Move', fd.name], ['Category', (fd.cat || '-').toUpperCase()], ['Startup', fd.st + 'f'], ['Active', fd.act + 'f'], ['Recovery', fd.rec + 'f'],
      ['Total', fd.st + fd.act + fd.rec + 'f'], ['On hit', fd.onHit === null ? '—' : typeof fd.onHit === 'string' ? fd.onHit : (fd.onHit >= 0 ? '+' : '') + fd.onHit],
      ['On block', fd.onBlock === null ? '—' : (fd.onBlock >= 0 ? '+' : '') + fd.onBlock], ['Cancel window', fd.cw + 'f after active'], ['Juggle cost', String(fd.jg)],
      ['Started by', fd.cancelled ? 'cancel' : 'neutral / link'],
    ] : [['Move', 'perform an attack…']];
    rows.forEach(([a, b], i) => { g.fillStyle = '#a99ccf'; g.fillText(a, x + 22, y + 70 + i * 24); g.fillStyle = '#ffffff'; g.fillText(String(b), x + 140, y + 70 + i * 24); });
    g.fillStyle = '#ffd84a'; g.fillText(`${ch.name} juggle limit: ${ch.juggleMax || 6}`, x + 22, y + 70 + 12 * 24);
    g.fillStyle = '#cfc4ee'; g.fillText(`Dummy hitstun left: ${D.state === 'hit' ? D.hitstun : 0}f`, x + 22, y + 70 + 13 * 24);
    g.font = `500 11px ${FONT_UI}`; g.fillStyle = '#a99ccf'; wrapText(g, 'Advantage = target hit/blockstun minus your remaining frames. Positive means you can act first.', x + 22, y + hh - 50, w - 44, 14);
  }
}
function listPages(ch) { if (ch.baseCh) ch = ch.baseCh; return ch.listPagesN || (ch.cardList ? 3 : 2); }
