// ============================ JACKPOT — cinematics ============================
// THE FINAL BET (ultimate, normal + MAX LUCK version) and ALL IN — JACKPOT. All randomness-free: the outcome of the
// ultimate is always the JACKPOT field (the ball is "rigged"); only draw-time visuals animate with the cine frame.
const JP_SIT = { ground: 0, hipH: 58, t: -0.04, hd: 0.06, fl1: 1.45, fl2: 0.05, bl1: 1.38, bl2: 0.0, fa1: 1.2, fa2: 1.7, ba1: 1.0, ba2: 1.6 };
function jpCineTimes(max) {
  return max ? { cards: 80, dice: 150, wheel: 196, reels: 250, land: 372, stand: 384, snap: 398, hit: 410, out: 432, end: 500 }
    : { cards: 80, dice: 150, wheel: 196, reels: 9999, land: 330, stand: 338, snap: 352, hit: 360, out: 378, end: 420 };
}
CINE.jackpot = function (A, D, f, c) {
  const dir = A.facing;
  if (f === 1) {
    A.x = clamp(A.x, 300, STAGE_W - 300); D.x = clamp(A.x + dir * 210, 90, STAGE_W - 90); D.y = GROUND; A.y = GROUND;
    D.facing = -dir; A.forcePose = 'coin_flip'; D.forcePose = 'stance';
    c.max = !!A.ultMax; c.P = jpCineTimes(c.max); c.maxF = c.P.end + 10; c.A = A; c.D = D; c.dir = dir;
    c.zoom = 1.5; c.camX = A.x + dir * 20; c.camY = GROUND - 170; c.bg = jpCineBg; c.fg = jpCineFg;
    c.casino = 0; c.coin = { y: 0, on: 0 }; c.flying = []; c.dice = []; c.slot = 0; c.reels = [0, 0, 0]; c.reelStop = 0;
    c.wheel = { show: 0, a: 0, v: 0.02, ball: 0, bv: 0.05 }; c.landed = 0; c.boom = 0; c.flash = 0; c.bars = 0; c.big = null; c.cardHits = 0; c.diceHits = 0; c.rain = [];
    A.jpCine = { ex: null }; FX.darkTarget = 0; Sound.play('coin');
  }
  const P = c.P, mx = c.max;
  const face = ex => { A.jpCine = { ex }; };
  // --- 1: THE COIN — flipped high, the camera follows it, it lands in his palm ---
  if (f <= 56) {
    const t = clamp((f - 4) / 36, 0, 1);
    c.coin.on = f >= 4 && f < 40 ? 1 : 0; c.coin.y = Math.sin(t * Math.PI) * 300;
    const h = A.handW('f'); c.coin.x = h[0]; c.coin.hy = h[1];
    if (f >= 4 && f < 40) { c.zoom = mx ? 2.4 : 2.1; c.camY = h[1] - c.coin.y * 0.75; c.camX = h[0]; }
    if (f === 20 && mx) FX.wtext(A.x, A.y - 300, 'MAX BET', { size: 40, color: '#fff2b0', stroke: JP2, life: 40 });
    if (f === 40) { A.forcePose = 'coin_catch'; Sound.play('coin'); c.zoom = 1.9; c.camX = A.x + dir * 30; c.camY = A.y - 190; face('cold'); }
    if (f === 44) { FX.wtext(A.x + dir * 20, A.y - 262, 'Let\'s see how lucky you really are.', { size: 22, color: '#ffffff', stroke: JPD, life: 50 }); Sound.speak('Let\'s see how lucky you really are.', A.ch.voicePitch, A.ch.voiceRate); }
  }
  // --- 2: THE CASINO — the world turns into his casino; they sit at his poker table ---
  if (f === 58) { c.flash = 1; Sound.play('jackpot', 0.6); Sound.play('slot'); }
  if (f >= 58) c.casino = Math.min(1, c.casino + 0.06);
  if (f === 64) { A.forcePose = 'sit'; D.forcePose = JP_SIT; face(null); c.zoom = mx ? 0.95 : 1.2; c.camX = (A.x + D.x) / 2; c.camY = GROUND - 170; }
  if (f > 64 && f < P.wheel) { c.zoom = lerp(c.zoom, mx ? 1.35 : 1.25, 0.03); if (mx) c.camX = lerp(c.camX, (A.x + D.x) / 2 + Math.sin(f * 0.03) * 60, 0.05); }
  // --- 3: CARDS fly through the casino and cut them; DICE roll across the floor; the slots light up ---
  if (f >= P.cards && f < P.cards + 70 && (f - P.cards) % 4 === 0) {
    for (let i = 0; i < (mx ? 3 : 2); i++) c.flying.push({ x: -60 - i * 40, y: 120 + ((f * 37 + i * 91) % 380), vx: 18 + ((f + i * 7) % 9), vy: ((f * 13 + i * 29) % 9 - 4) * 0.4, r: (f * 0.7 + i) % TAU, gold: mx || (f + i) % 3 === 0, t: 0 });
  }
  if (f >= P.cards + 10 && f < P.cards + 70 && (f - P.cards - 10) % 10 === 0 && c.cardHits < (mx ? 8 : 6)) { c.cardHits++; D.forcePose = (c.cardHits % 2) ? { ...JP_SIT, t: -0.3, hd: -0.3 } : JP_SIT; BT.scriptHit(A, D, mx ? 9 : 8, { str: 1, sfx: 'slash' }); }
  for (const q of c.flying) { q.x += q.vx; q.y += q.vy; q.r += 0.3; q.t++; }
  c.flying = c.flying.filter(q => q.x < W + 80);
  if (f === P.cards + 20) c.slot = 1;
  if (f === P.dice || f === P.dice + 14 || (mx && f === P.dice + 28)) { c.dice.push({ x: (dir > 0 ? A.x - 260 : A.x + 260), face: 1 + (f % 6), t: 0, big: 1 }); Sound.play('dice'); }
  for (const q of c.dice) { q.t++; q.x += dir * 16; if (!q.hit && Math.abs(q.x - D.x) < 40) { q.hit = 1; c.diceHits++; BT.scriptHit(A, D, 14, { str: 2, sfx: 'kick' }); FX.shakeIt(6); } }
  // --- 4: THE WHEEL — a giant roulette wheel rises behind him and spins faster and faster ---
  if (f === P.wheel) { Sound.play('slot'); c.zoom = 1.05; c.camX = (A.x + D.x) / 2 - dir * 40; c.camY = GROUND - 230; }
  if (f >= P.wheel) { c.wheel.show = Math.min(1, c.wheel.show + 0.05); }
  const spinEnd = P.land - 50;
  if (f >= P.wheel && f < spinEnd) { c.wheel.v = Math.min(mx ? 0.6 : 0.45, c.wheel.v + 0.006); c.wheel.bv = -c.wheel.v * 1.4; }
  else if (f >= spinEnd && f < P.land) { const k = (f - spinEnd) / 50; c.wheel.v = lerp(c.wheel.v, 0.01, 0.06); c.wheel.bv = lerp(c.wheel.bv, 0, 0.08); c.wheel.drop = k; }
  c.wheel.a += c.wheel.v; c.wheel.ball += c.wheel.bv;
  if (f >= P.wheel && f < P.land && f % Math.max(2, Math.round(2 + (f >= spinEnd ? (f - spinEnd) / 5 : 0))) === 0) Sound.play('rTick');
  // max: three slot reels stop on 7 – 7 – 7 one after another
  if (f >= P.reels && f < P.reels + 90) { const s = f - P.reels; for (let i = 0; i < 3; i++) if (s === 30 + i * 22) { c.reels[i] = 1; Sound.play('chips'); FX.shakeIt(4); } }
  // the camera follows the ball
  if (f >= spinEnd && f < P.land + 12) {   // the camera follows the ball down into the JACKPOT pocket
    const wp = jpWheelPos(c), pa = c.wheel.a + TAU / 37 / 2, k = clamp((f - spinEnd) / 40, 0, 1), tx = wp[0] + Math.cos(pa) * 230 * 0.86 * k, ty = wp[1] + Math.sin(pa) * 230 * 0.86 * k;
    c.zoom = lerp(c.zoom, mx ? 2.4 : 2.1, 0.05); c.camX = lerp(c.camX, tx, 0.1); c.camY = lerp(c.camY, ty, 0.1);
  }
  if (f === P.land) {
    c.landed = 1; c.wheel.v = 0; c.wheel.bv = 0; Sound.play('jackpot'); c.flash = 0.8;
    const wp = jpWheelPos(c); FX.wtext(wp[0], wp[1] - 230, 'JACKPOT', { size: mx ? 64 : 52, color: '#fff2b0', stroke: JP2, life: 60 });
    if (mx) FX.wtext(wp[0], wp[1] - 172, '大当たり', { size: 34, font: FX_JP(), color: JP, stroke: JPD, life: 60 });
  }
  // --- 5: THE SNAP — he stands, snaps his fingers; a golden casino explosion swallows them ---
  if (f === P.stand) { A.forcePose = 'snap_w'; D.forcePose = 'stance'; c.zoom = 1.35; c.camX = (A.x + D.x) / 2; c.camY = GROUND - 160; face('cold'); }
  if (f === P.snap) { A.forcePose = mx ? 'coin_flip' : 'snap'; Sound.play(mx ? 'coin' : 'snap'); if (mx) c.big = { t: 0 }; }
  if (c.big) { c.big.t++; }
  if (f === P.hit) {
    A.forcePose = mx ? 'celebrate' : 'snap'; D.forcePose = 'hit';
    BT.scriptHit(A, D, mx ? 210 : 180, { str: 4, sfx: 'explosion' }); FX.impactFrame(mx ? 6 : 4); FX.shakeIt(mx ? 34 : 26); Sound.play('impactBig'); Sound.play('explosion');
    c.boom = 1; c.flash = 1;
    for (let i = 0; i < (mx ? 80 : 50); i++) FX.p({ type: 'shard', x: D.x + rand(-40, 40), y: D.y - rand(40, 200), vx: rand(-12, 12), vy: rand(-14, 2), grav: 0.4, drag: 0.98, life: rand(30, 60), size: rand(4, 8), color: i % 3 ? JP : '#fff2b0', rot: rand(0, TAU), vr: rand(-0.4, 0.4) });
    FX.wtext(D.x, D.y - 280, mx ? 'MAX JACKPOT' : 'THE HOUSE ALWAYS WINS', { size: mx ? 56 : 40, color: '#fff2b0', stroke: JP2, life: 70, vy: -0.3 });
    if (mx) for (let i = 0; i < 40; i++) c.rain.push({ x: (i * 97) % W, y: -((i * 53) % 300), v: 6 + (i % 5), s: (i * 0.37) % TAU });
  }
  if (f > P.hit) { c.boom = Math.max(0, c.boom - 0.02); D.forcePose = 'hit2'; }
  for (const q of c.rain) { q.y += q.v; q.s += 0.2; }
  // --- 6: THE ROOM RETURNS — he adjusts his gloves ---
  if (f >= P.out) { c.casino = Math.max(0, c.casino - 0.04); c.wheel.show = Math.max(0, c.wheel.show - 0.05); c.slot = 0; c.zoom = lerp(c.zoom, 1.3, 0.06); }
  if (f === P.out + 6) { A.forcePose = 'gloves'; face(null); D.forcePose = 'kneel'; }
  if (f === P.out + 26 && mx) { A.forcePose = 'tip_hat'; A.jpCine = { ex: 'grin' }; }
  c.flash = Math.max(0, c.flash - 0.05); c.bars = mx ? Math.min(1, (c.bars || 0) + 0.04) * (f < P.out + 20 ? 1 : 0.9) : 0;
  if (f >= P.end) {
    A.jpCine = null; FX.darkTarget = 0; if (mx) A.jpWinMax = true;
    BT.release(D, dir * 4, -5); return true;
  }
};
function jpWheelPos(c) { const A = c.A; return [A.x - c.dir * 40, GROUND - 300]; }   // world position of the big wheel (behind him)

// ---------------------------------- ALL IN — JACKPOT ----------------------------------
CINE.jpAllIn = function (A, D, f, c) {
  const dir = A.facing;
  if (f === 1) {
    D.x = clamp(A.x + dir * 120, 60, STAGE_W - 60); D.y = GROUND; D.forcePose = 'hit'; A.forcePose = 'allin';
    c.A = A; c.D = D; c.dir = dir; c.bg = null; c.fg = jpAllInFg; c.reels = [0, 0, 0]; c.flash = 0; c.boom = 0;
    c.zoom = 1.45; c.camX = (A.x + D.x) / 2; c.camY = GROUND - 190; FX.darkTarget = 0.55; Sound.play('slot');
  }
  for (let i = 0; i < 3; i++) if (f === 26 + i * 14) { c.reels[i] = 1; Sound.play('chips'); BT.scriptHit(A, D, 22, { str: 2, sfx: 'hit' }); D.forcePose = i % 2 ? 'hit' : 'hit2'; FX.shakeIt(5); }
  if (f === 70) { Sound.play('jackpot'); c.flash = 0.7; FX.wtext(D.x, D.y - 330, '7 7 7', { size: 54, color: '#fff2b0', stroke: JP2, life: 50 }); A.forcePose = 'snap'; A.jpCine = { ex: 'grin' }; }
  if (f >= 70 && f < 96 && f % 2 === 0) for (let i = 0; i < 4; i++) FX.p({ type: 'shard', x: D.x + rand(-90, 90), y: D.y - 330, vx: rand(-1, 1), vy: rand(2, 6), grav: 0.4, drag: 0.99, life: 40, size: rand(4, 7), color: i % 2 ? JP : '#fff2b0', rot: rand(0, TAU), vr: 0.3 });
  if (f === 96) {
    A.forcePose = 'allin'; BT.scriptHit(A, D, 100, { str: 4, sfx: 'explosion' }); FX.impactFrame(4); FX.shakeIt(24); Sound.play('impactBig');
    c.boom = 1; c.flash = 1; for (let i = 0; i < 40; i++) FX.flame(D.x + rand(-70, 70), D.y - rand(0, 240), i % 2 ? JP : JP2, 1, 10, 6);
    FX.wtext(D.x, D.y - 280, 'ALL IN — JACKPOT', { size: 42, color: '#fff2b0', stroke: JP2, life: 60, vy: -0.3 });
  }
  c.boom = Math.max(0, c.boom - 0.03); c.flash = Math.max(0, c.flash - 0.05);
  if (f >= 118) { A.jpCine = null; FX.darkTarget = 0; BT.release(D, dir * 9, -12); return true; }
};
function jpSlotMachine(g, x, y, s, reels, t, glow) {   // a slot machine (screen space); reels[i] = 1 → stopped on 7
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#3a0810'; g.strokeStyle = JP; g.lineWidth = 3; g.beginPath(); g.rect(-60, -70, 120, 120); g.fill(); g.stroke();
  g.fillStyle = '#5a0c18'; g.beginPath(); g.ellipse(0, -70, 60, 18, 0, Math.PI, TAU); g.fill(); g.stroke();
  g.font = `italic 900 13px ${FONT_T}`; g.textAlign = 'center'; strokeText(g, 'JACKPOT', 0, -72, JP, OUTLINE, 3);
  for (let i = 0; i < 3; i++) {
    const rx = -36 + i * 36; g.fillStyle = '#fbf6ee'; g.fillRect(rx - 15, -46, 30, 52); g.strokeStyle = OUTLINE; g.lineWidth = 2; g.strokeRect(rx - 15, -46, 30, 52);
    g.save(); g.beginPath(); g.rect(rx - 15, -46, 30, 52); g.clip();
    if (reels[i]) { g.font = `900 34px ${FONT_UI}`; g.fillStyle = '#d0102a'; g.fillText('7', rx, -7); }
    else { const off = (t * 9 + i * 17) % 40; g.font = `900 22px ${FONT_UI}`; for (let k = -1; k < 3; k++) { g.fillStyle = ['#d0102a', '#16101a', '#1d9a50', JP][(k + i + Math.floor(t / 4)) & 3]; g.fillText(['7', '♠', '♣', '$'][(k + i + Math.floor(t / 4)) & 3], rx, -30 + k * 40 + off - 20); } }
    g.restore();
  }
  for (let i = 0; i < 8; i++) { g.fillStyle = (t >> 2) % 2 === i % 2 || glow ? JP : '#6a4a10'; g.beginPath(); g.arc(-52 + i * 15, 40, 3.5, 0, TAU); g.fill(); }
  g.restore();
}
function jpAllInFg(g, c) {
  const cam = BT && BT.cam; if (!cam) return;
  const [sx, sy] = cam.toScreen(c.D.x, c.D.y - 300);
  jpSlotMachine(g, sx, sy, cam.z * 0.95, c.reels, c.f, c.reels[2]);
  if (c.boom > 0.01) { g.save(); g.globalCompositeOperation = 'lighter'; const [bx, by] = cam.toScreen(c.D.x, c.D.y - 110); const r = (1 - c.boom) * 500 + 60; const gr = g.createRadialGradient(bx, by, 10, bx, by, r); gr.addColorStop(0, `rgba(255,240,180,${c.boom})`); gr.addColorStop(0.5, `rgba(255,200,60,${c.boom * 0.6})`); gr.addColorStop(1, 'rgba(255,120,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
  if (c.flash > 0.01) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = c.flash * 0.6; g.fillStyle = '#ffe8a0'; g.fillRect(0, 0, W, H); g.restore(); }
}

// ---------------------------------- the casino dimension (screen space) ----------------------------------
function jpCineBg(g, c) {
  if (c.casino <= 0.01) return;
  const cam = BT && BT.cam, T = c.f, a = c.casino;
  g.save(); g.globalAlpha = a;
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#12040a'); gr.addColorStop(0.55, '#3a0a16'); gr.addColorStop(0.56, '#0d3a22'); gr.addColorStop(1, '#06180e');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // pillars and chandeliers
  for (let i = 0; i < 6; i++) {
    const x = ((i * 260 - (cam ? cam.x * 0.15 : 0)) % (W + 260) + W + 260) % (W + 260) - 130;
    g.fillStyle = '#2a0a12'; g.fillRect(x - 24, 0, 48, H * 0.56); g.fillStyle = '#6a4a10'; g.fillRect(x - 28, H * 0.52, 56, 10); g.fillRect(x - 28, 40, 56, 8);
    const cx = x + 130, cy = 70 + Math.sin(T * 0.03 + i) * 3;
    g.save(); g.globalCompositeOperation = 'lighter'; const lg = g.createRadialGradient(cx, cy, 2, cx, cy, 70); lg.addColorStop(0, 'rgba(255,230,150,0.7)'); lg.addColorStop(1, 'rgba(255,180,60,0)'); g.fillStyle = lg; g.fillRect(cx - 70, cy - 70, 140, 140); g.restore();
    g.fillStyle = JP; for (let k = -2; k <= 2; k++) { g.beginPath(); g.arc(cx + k * 12, cy + Math.abs(k) * 4, 3, 0, TAU); g.fill(); }
  }
  // slot machines along the back wall: flashing once the slots light up
  const sy = H * 0.5;
  for (let i = 0; i < 9; i++) jpSlotMachine(g, 70 + i * 142, sy - 30, 0.55, c.max && c.reels ? c.reels : [0, 0, 0], c.slot ? T + i * 5 : 0, c.slot && ((T >> 3) + i) % 3 === 0);
  // felt floor pattern
  g.strokeStyle = 'rgba(255,207,58,0.12)'; g.lineWidth = 2; for (let i = -10; i < 20; i++) { g.beginPath(); g.moveTo(W / 2 + i * 90, H * 0.56); g.lineTo(W / 2 + i * 260, H); g.stroke(); }
  // the giant roulette wheel behind him
  if (c.wheel.show > 0.01 && cam) {
    const [wx, wy] = cam.toScreen(...jpWheelPos(c)), R = 230 * cam.z * c.wheel.show;
    jpBigWheel(g, wx, wy, R, c.wheel.a, c.wheel.ball, c.wheel.drop || 0, c.landed, c.max, T);
  }
  g.restore();
}
function jpBigWheel(g, x, y, R, a, ball, drop, landed, max, T) {
  g.save(); g.translate(x, y);
  if (FX.hq) { g.save(); g.globalCompositeOperation = 'lighter'; const lg = g.createRadialGradient(0, 0, R * 0.6, 0, 0, R * 1.35); lg.addColorStop(0, 'rgba(255,200,60,0.35)'); lg.addColorStop(1, 'rgba(255,120,0,0)'); g.fillStyle = lg; g.fillRect(-R * 1.4, -R * 1.4, R * 2.8, R * 2.8); g.restore(); }
  g.fillStyle = '#3a2410'; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill(); g.strokeStyle = JP; g.lineWidth = R * 0.05; g.stroke();
  const N = 37;
  for (let i = 0; i < N; i++) {
    const a0 = a + i * TAU / N, a1 = a0 + TAU / N, col = i === 0 ? JP : i % 2 ? '#c8102e' : '#16141a';
    g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R * 0.9, a0, a1); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,207,58,0.5)'; g.lineWidth = 1; g.stroke();
    if (R > 120) { g.save(); g.rotate(a0 + TAU / N / 2); g.fillStyle = i === 0 ? '#7a1010' : '#ffffff'; g.font = `900 ${Math.round(R * 0.05)}px ${FONT_UI}`; g.textAlign = 'center'; g.fillText(i === 0 ? '★' : String(i), R * 0.8, R * 0.018); g.restore(); }
  }
  if (max) {   // the MAX wheel: an inner ring turning the other way
    for (let i = 0; i < 12; i++) { const a0 = -a * 1.6 + i * TAU / 12; g.fillStyle = i % 2 ? JP : '#7a1010'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R * 0.58, a0, a0 + TAU / 12); g.closePath(); g.fill(); }
  }
  g.fillStyle = '#5a3a14'; g.beginPath(); g.arc(0, 0, R * 0.38, 0, TAU); g.fill(); g.strokeStyle = JP; g.lineWidth = R * 0.03; g.stroke();
  for (let i = 0; i < 4; i++) { g.save(); g.rotate(a * 0.5 + i * Math.PI / 2); g.fillStyle = JP; g.fillRect(-R * 0.02, -R * 0.34, R * 0.04, R * 0.3); g.restore(); }
  g.fillStyle = JP; g.beginPath(); g.arc(0, 0, R * 0.08, 0, TAU); g.fill();
  // the ball: on the rim while spinning, dropping into the JACKPOT pocket (index 0) at the end
  const target = a + TAU / N / 2, ba = landed ? target : lerp(ball, target, drop * drop), br = R * lerp(0.96, 0.82, landed ? 1 : drop);
  g.fillStyle = '#ffffff'; g.shadowColor = '#ffffff'; g.shadowBlur = FX.hq ? 10 : 0; g.beginPath(); g.arc(Math.cos(ba) * br, Math.sin(ba) * br, R * 0.035, 0, TAU); g.fill(); g.shadowBlur = 0;
  if (landed) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#fff2b0'; g.lineWidth = R * 0.03; g.globalAlpha = 0.6 + 0.4 * Math.sin(T * 0.5); g.beginPath(); g.arc(0, 0, R * 0.92, a, a + TAU / N); g.stroke(); g.restore(); }
  g.restore();
}
function jpCineFg(g, c) {
  const cam = BT && BT.cam; if (!cam) return;
  const T = c.f;
  // the coin (phase 1)
  if (c.coin && c.coin.on) { const [sx, sy] = cam.toScreen(c.coin.x, c.coin.hy - c.coin.y); jpCoin(g, sx, sy, 9 * cam.z, T * 0.8, null, true); }
  // the poker table between them (covers their legs: they are seated)
  if (c.casino > 0.01 && c.A.forcePose === 'sit') {
    const mx = (c.A.x + c.D.x) / 2, [tx, ty] = cam.toScreen(mx, GROUND - 74), tw = 300 * cam.z, th = 74 * cam.z;
    g.save(); g.globalAlpha = c.casino;
    g.fillStyle = '#3a1a0a'; g.fillRect(tx - tw * 0.42, ty, tw * 0.1, th); g.fillRect(tx + tw * 0.32, ty, tw * 0.1, th);
    g.fillStyle = '#5a2a10'; g.beginPath(); g.ellipse(tx, ty, tw / 2 + 8 * cam.z, 26 * cam.z, 0, 0, TAU); g.fill();
    g.fillStyle = JPG; g.beginPath(); g.ellipse(tx, ty - 3 * cam.z, tw / 2 - 6 * cam.z, 20 * cam.z, 0, 0, TAU); g.fill();
    g.strokeStyle = JP; g.lineWidth = 2; g.stroke();
    for (let i = 0; i < 5; i++) jpCard(g, tx - 60 * cam.z + i * 30 * cam.z, ty - 4 * cam.z, 18 * cam.z, 12 * cam.z, '', 0, false, 0, null);
    jpStack(g, tx - 110 * cam.z, ty - 6 * cam.z, 5, { mono: null }); jpStack(g, tx + 110 * cam.z, ty - 6 * cam.z, 3, { mono: null });
    g.restore();
  }
  // flying cards
  for (const q of c.flying) jpCard(g, q.x, q.y, 22, 30, ['A', 'K', 'Q', 'J', '7'][q.t % 5], q.t % 4, q.gold, q.r, null);
  // dice rolling across the floor
  for (const q of c.dice) { const [sx, sy] = cam.toScreen(q.x, GROUND - 40); jpDie(g, sx, sy, 70 * cam.z, 1 + ((q.t >> 2) % 6), q.t * 0.3 * c.dir, c.max, null); }
  // the MAX ending: a giant golden coin falls on them
  if (c.big && c.big.t < 20) { const k = c.big.t / 12, [sx, sy] = cam.toScreen(c.D.x, lerp(GROUND - 700, GROUND - 120, Math.min(1, k))); jpCoin(g, sx, sy, 90 * cam.z, c.big.t * 0.2, null, true); }
  // coin rain (MAX)
  for (const q of c.rain) if (q.y > -20 && q.y < H + 20) jpCoin(g, q.x, q.y, 8, q.s, null, false);
  // golden explosion
  if (c.boom > 0.01) {
    const [bx, by] = cam.toScreen(c.D.x, c.D.y - 110), r = (1 - c.boom) * (c.max ? 900 : 650) + 80;
    g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(bx, by, 10, bx, by, r); gr.addColorStop(0, `rgba(255,245,200,${c.boom})`); gr.addColorStop(0.45, `rgba(255,200,60,${c.boom * 0.7})`); gr.addColorStop(1, 'rgba(255,120,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (c.max && FX.hq) { g.strokeStyle = `rgba(255,230,140,${c.boom})`; g.lineWidth = 6; for (let i = 0; i < 16; i++) { const a = i * TAU / 16 + T * 0.02; g.beginPath(); g.moveTo(bx + Math.cos(a) * 60, by + Math.sin(a) * 60); g.lineTo(bx + Math.cos(a) * r, by + Math.sin(a) * r); g.stroke(); } }
    g.restore();
  }
  // MAX: cinematic letterbox
  if (c.bars > 0.01) { g.fillStyle = '#000'; g.fillRect(0, 0, W, 60 * c.bars); g.fillRect(0, H - 60 * c.bars, W, 60 * c.bars); }
  if (c.flash > 0.01) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = c.flash * 0.7; g.fillStyle = '#ffe8a0'; g.fillRect(0, 0, W, H); g.restore(); }
}
// the cine drives his face directly
{ const t = JACKPOT.tick; JACKPOT.tick = F => { t(F); if (F.state === 'cine' && F.jpCine) { F.jpEx = F.jpCine.ex; F.jpProp = F.forcePose === 'coin_flip' || F.forcePose === 'coin_catch' ? 'coin' : F.forcePose === 'allin' ? 'stack' : null; } }; }
