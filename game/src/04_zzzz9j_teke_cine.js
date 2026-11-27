// ============================ TEKE TEKE — THE LAST TRAIN (ultimate cinematic) ============================
// Darkness + a railway crossing alarm → she stops, slowly turns her head, the camera pushes in: "Teke… teke…" →
// the arena becomes an abandoned night station; the foe tries to back away, she vanishes and reappears around them →
// two headlights in the dark, the train gets louder → she grabs them with one arm and raises the sickle → the last
// train rushes through the station and at the exact moment it passes she cuts (white flash, stylized impact, no gore) →
// silence; she crawls away, stops, turns her head to the camera: "Teke… teke…" → cut to black.
// Scripted by frame number (no randomness in the outcome), so replays and online matches stay in sync.
const TK_ULT = { turn: 22, face: 40, teke1: 58, station: 92, chase: 108, hops: [116, 134, 150, 164, 176, 188], lights: 196, grab: 232, raise: 248, train: 258, cut: 272, gone: 300, crawl: 306, stop: 344, look: 354, teke2: 362, black: 384, end: 398 };
CINE.teke = function (A, D, f, c) {
  const U = TK_ULT, dir = c.dir || A.facing;
  if (f === 1) {
    A.x = clamp(A.x, 300, STAGE_W - 300); D.x = clamp(A.x + A.facing * 200, 80, STAGE_W - 80); D.y = GROUND; A.y = GROUND; D.facing = -A.facing;
    c.dir = A.facing; c.ox = A.x; c.maxF = U.end + 8; c.A = A; c.D = D;
    A.forcePose = 'still'; D.forcePose = 'stance';
    c.zoom = 1.35; c.camX = (A.x + D.x) / 2; c.camY = GROUND - 140;
    c.bg = tkStationBg; c.fg = tkUltFg; c.bgA = 0; c.dark = 0; c.lights = 0; c.train = -1; c.flash = 0; c.black = 0; c.bars = 0; c.cut = 0;
    FX.darkTarget = 0.85; A.tkEx = null; A.tkExT = 999;
  }
  c.bars = Math.min(1, c.bars + 0.05);
  // --- 1: darkness and the crossing alarm; she stops moving and slowly turns her head ---
  if (f < U.station) c.dark = Math.min(1, c.dark + 0.04);
  if (f % 22 === 1 && f < U.gone) Sound.play('crossing', f < U.station ? 0.5 : 0.8);
  if (f >= U.turn && f < U.station) {
    const k = clamp((f - U.turn) / 30, 0, 1);
    A.forcePose = { base: 'still', hd: lerp(-0.66, 0.35, k * k), t: 0.8 - 0.2 * k };
    if (f >= U.face) { const sk = A.sk, r = A.ch.dims.headR, h = toWorld(A.x, A.y, A.facing, A.s, A.pose, sk, ...headPt(sk, 0.4 * r, 0.2 * r)); c.zoom = lerp(c.zoom, 2.7, 0.07); c.camX = lerp(c.camX, h[0], 0.12); c.camY = lerp(c.camY, h[1], 0.12); }
    if (f === U.face) { A.tkEx = 'wide'; Sound.play('ghostBreath'); }
  }
  if (f === U.teke1) { BT.say(A, 'Teke… teke…', 60); Sound.play('teke', 0.6, 0.8); }
  if (f === U.teke1 + 16) Sound.play('teke', 0.7, 0.85);
  // --- 2: the abandoned night station; the foe tries to escape, she appears around them ---
  if (f >= U.station) { c.bgA = Math.min(1, c.bgA + 0.06); FX.darkTarget = 0; }
  if (f === U.station) { A.tkEx = 'grin'; c.zoom = 1.25; c.camX = (A.x + D.x) / 2; c.camY = GROUND - 150; Sound.play('tekeFast'); }
  if (f >= U.chase && f < U.grab) {
    if (f < U.lights + 20) { D.x = clamp(D.x + dir * 1.6, 70, STAGE_W - 70); D.forcePose = { base: 'block', t: -0.2, hd: 0.3 }; D.facing = -dir; }
    c.camX = lerp(c.camX, D.x, 0.08);
  }
  U.hops.forEach((h, i) => {
    if (f === h - 3) { A.hidden = true; FX.dust(A.x, GROUND, 6); }
    if (f === h) {
      const side = i % 2 ? -1 : 1, off = [90, 130, 70, 150, 80, 110][i];
      A.hidden = false; A.x = clamp(D.x + side * dir * off, 50, STAGE_W - 50); A.facing = D.x > A.x ? 1 : -1;
      A.forcePose = i % 2 ? 'rush' : 'look'; A.afterimage = 10; FX.dust(A.x, GROUND, 8); Sound.play(i % 2 ? 'tekeFast' : 'teke', 0.8, 1 + i * 0.05);
      D.facing = A.x > D.x ? 1 : -1;
      if (i % 2 === 1) { BT.scriptHit(A, D, 14, { str: 2, sfx: 'hit' }); D.forcePose = 'hit'; FX.swoosh(A, { cx: 0, cy: -90, r: 80, a0: -1.6, a1: 0.6, color: TT }); Sound.play('sickle'); }
    }
  });
  // --- 3: the train: headlights in the dark, louder and louder ---
  if (f === U.lights) { Sound.play('trainHorn'); c.lights = 0.01; }
  if (c.lights > 0 && f < U.train) c.lights = Math.min(1, c.lights + 0.012);
  if (f === U.lights + 24) Sound.play('trainHorn', 1.2);
  if (f === U.grab) {
    A.hidden = false; A.x = clamp(D.x - dir * 64, 50, STAGE_W - 50); A.facing = dir; D.facing = -dir; A.forcePose = 'grab'; D.forcePose = 'airhit'; D.y = GROUND - 20;
    A.afterimage = 12; Sound.play('grab'); FX.dust(A.x, GROUND, 10); c.zoom = 1.6; c.camX = (A.x + D.x) / 2; c.camY = GROUND - 150; A.tkEx = 'wide';
  }
  if (f > U.grab && f < U.cut) { D.x = A.x + dir * 62; D.y = GROUND - 26; }
  if (f === U.raise) { A.forcePose = 'hold'; Sound.play('ghostBreath'); }
  if (f === U.train) { c.train = 0; Sound.play('trainPass', 1.3); Sound.play('trainHorn', 1.4); FX.shakeIt(10); }
  if (c.train >= 0) { c.train = Math.min(1.2, c.train + 1 / 34); if (f % 3 === 0) FX.shakeIt(6); }
  // --- 4: at the exact moment the train passes: the cut ---
  if (f === U.cut) {
    A.forcePose = 'arc'; A.afterimage = 10;
    BT.scriptHit(A, D, 172, { str: 4, sfx: 'explosion' }); FX.impactFrame(5); FX.shakeIt(28); Sound.play('sickle', 1.6); Sound.play('impactBig');
    c.flash = 1; c.cut = 1; D.forcePose = 'airhit'; c.fly = { x0: D.x, t: 0 };
    FX.wtext(D.x, D.y - 270, '終電', { size: 96, font: FX_JP(), color: '#ffffff', stroke: TTG, life: 64, vy: -0.3 });
  }
  if (c.fly) { c.fly.t++; const t = Math.min(1, c.fly.t / 26); D.x = clamp(c.fly.x0 + dir * 300 * t, 60, STAGE_W - 60); D.y = GROUND - Math.sin(t * Math.PI) * 120; if (t >= 1) { D.y = GROUND; D.forcePose = 'down'; c.fly = null; } }
  if (c.cut > 0) c.cut = Math.max(0, c.cut - 0.03);
  // --- 5: silence; she crawls away, stops, turns her head to the camera ---
  if (f === U.gone) { c.train = -1; c.lights = 0; A.forcePose = 'still'; A.tkEx = null; }
  if (f >= U.crawl && f < U.stop) { A.facing = -dir; A.x = clamp(A.x - dir * 1.4, 50, STAGE_W - 50); A.forcePose = tkCrawlPose((f - U.crawl) * 0.26, 0, false); if ((f - U.crawl) % 12 === 0) Sound.play('teke', 0.3, 0.9); c.camX = lerp(c.camX, A.x, 0.05); c.zoom = lerp(c.zoom, 1.5, 0.05); }
  if (f === U.stop) A.forcePose = 'still';
  if (f >= U.look) {
    const k = clamp((f - U.look) / 6, 0, 1);   // a sudden, jerky turn toward the camera
    A.forcePose = { base: 'still', hd: lerp(-0.66, 1.2, k), t: 0.7 }; A.tkEx = 'wide';
    const sk = A.sk, r = A.ch.dims.headR, h = toWorld(A.x, A.y, A.facing, A.s, A.pose, sk, ...headPt(sk, 0.3 * r, 0.2 * r));
    c.zoom = lerp(c.zoom, 3.0, 0.12); c.camX = lerp(c.camX, h[0], 0.2); c.camY = lerp(c.camY, h[1], 0.2);
  }
  if (f === U.teke2) { BT.say(A, 'Teke… teke…', 30); Sound.play('teke', 0.8, 0.75); }
  if (f >= U.black) c.black = Math.min(1, c.black + 0.34);
  c.flash = Math.max(0, c.flash - 0.06);
  if (f >= U.end) {
    A.hidden = false; A.x = c.ox; A.facing = D.x > A.x ? 1 : -1; A.tkEx = null; A.tkExT = 0; FX.darkTarget = 0;
    BT.release(D, dir * 2, -3); return true;
  }
};
// the abandoned station at night: cold moonlight, a dead platform, flickering lamps, rails into the dark
function tkStationBg(g, c) {
  const a = c.bgA || 0; if (a <= 0.01) return;
  const f = c.f;
  g.save(); g.globalAlpha = a;
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#04050c'); sky.addColorStop(0.5, '#0e1424'); sky.addColorStop(0.62, '#1a1c2a'); sky.addColorStop(0.63, '#0a0a10'); sky.addColorStop(1, '#030306');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(220,230,255,0.85)'; g.beginPath(); g.arc(W * 0.78, 110, 34, 0, TAU); g.fill();   // the moon
  g.fillStyle = '#0e1424'; g.beginPath(); g.arc(W * 0.78 + 12, 104, 30, 0, TAU); g.fill();
  const vx = W / 2, vy = 450;
  // roof + pillars receding
  g.fillStyle = '#07080e'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 60); g.lineTo(vx + 120, vy - 170); g.lineTo(vx - 120, vy - 170); g.lineTo(0, 60); g.closePath(); g.fill();
  for (let i = 6; i >= 0; i--) {
    const z = 1 / (1 + i * 0.6), off = 160 + 560 * z, top = vy - 170 - 260 * z * 0.4, bot = vy + (H - vy) * z;
    for (const sd of [-1, 1]) {
      const px = vx + sd * off; g.fillStyle = `rgb(${12 + 18 * z},${12 + 18 * z},${20 + 22 * z})`; g.fillRect(px - 16 * z, top, 32 * z, bot - top);
      const fl = ((f >> 2) + i * 3) % 11 ? 1 : 0.2;   // dying platform lamps
      g.globalAlpha = a * 0.8 * fl; g.fillStyle = '#e8f0ff'; g.fillRect(px - 26 * z, top + 40 * z, 52 * z, 6 * z);
      if (FX.hq) { const lg = g.createRadialGradient(px, top + 46 * z, 0, px, top + 46 * z, 120 * z); lg.addColorStop(0, 'rgba(200,220,255,0.18)'); lg.addColorStop(1, 'rgba(200,220,255,0)'); g.fillStyle = lg; g.fillRect(px - 120 * z, top - 70 * z, 240 * z, 240 * z); }
      g.globalAlpha = a;
    }
  }
  // station sign
  g.fillStyle = '#d8dce8'; g.fillRect(vx - 110, 150, 220, 46); g.fillStyle = '#12141c'; g.fillRect(vx - 104, 156, 208, 34);
  g.font = `700 22px ${FONT_JP || 'sans-serif'}`; g.textAlign = 'center'; g.fillStyle = '#d8dce8'; g.fillText('終 点', vx, 182);
  g.fillStyle = '#b0182c'; g.fillRect(vx - 104, 190, 208, 4);
  // platforms + yellow safety line, rails into the vanishing point
  g.fillStyle = '#16141c'; g.beginPath(); g.moveTo(0, H); g.lineTo(vx - 140, vy); g.lineTo(vx - 36, vy); g.lineTo(vx - 300, H); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(W, H); g.lineTo(vx + 140, vy); g.lineTo(vx + 36, vy); g.lineTo(vx + 300, H); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(232,192,32,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(vx - 300, H); g.lineTo(vx - 36, vy); g.moveTo(vx + 300, H); g.lineTo(vx + 36, vy); g.stroke();
  g.strokeStyle = '#4a4c58'; g.lineWidth = 2; g.beginPath(); g.moveTo(vx - 150, H); g.lineTo(vx - 8, vy); g.moveTo(vx + 150, H); g.lineTo(vx + 8, vy); g.stroke();
  for (let i = 0; i < 10; i++) { const k = i / 10, y = lerp(vy, H, k * k), w = lerp(10, 180, k * k); g.fillStyle = '#1c1618'; g.fillRect(vx - w, y, w * 2, 2 + 6 * k); }
  // the crossing lamp above the tunnel mouth (alternating red)
  const on = (f >> 3) % 2;
  for (const [lx, l] of [[-16, on], [16, 1 - on]]) { g.fillStyle = l ? '#ff2a3a' : '#3a0a10'; g.beginPath(); g.arc(vx + lx, vy - 120, 7, 0, TAU); g.fill(); }
  g.restore();
}
function tkUltFg(g, c) {
  const cam = BT && BT.cam; if (!cam) return;
  const T = c.f, A = c.A, D = c.D, z = cam.z;
  // darkness vignette in the opening
  if (c.dark > 0.01 && c.bgA < 1) { g.fillStyle = `rgba(2,0,6,${0.55 * c.dark * (1 - c.bgA)})`; g.fillRect(0, 0, W, H); }
  // headlights in the dark tunnel (screen space, from the vanishing point)
  if (c.lights > 0.01) {
    const k = c.lights, x = W / 2, y = 400, r = 6 + k * k * 70;
    g.save(); g.globalCompositeOperation = 'lighter';
    const hg = g.createRadialGradient(x, y, 0, x, y, r * 5); hg.addColorStop(0, `rgba(255,250,220,${0.5 + 0.4 * k})`); hg.addColorStop(1, 'rgba(255,230,180,0)');
    g.fillStyle = hg; g.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
    g.fillStyle = '#fffbea'; for (const sx of [-1, 1]) { g.beginPath(); g.arc(x + sx * r * 0.9, y, r * 0.35, 0, TAU); g.fill(); }
    g.restore();
  }
  // the last train rushing through the station, right in front of the camera
  if (c.train >= 0) {
    const t = c.train, d = c.dir || 1, L = 2400, front = W / 2 - d * (W / 2 + 200) + d * (W + L + 400) * t;
    g.save(); g.globalAlpha = Math.min(1, (1.2 - t) * 4); tkGhostTrain(g, front, H + 40, d, L, T, 2.4); g.restore();
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.25 * Math.sin(Math.min(1, t) * Math.PI); g.fillStyle = '#ffe8c8'; g.fillRect(0, 0, W, H); g.restore();
    for (let i = 0; i < 8; i++) { const y = (i * 97 + T * 41) % H; g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, y, W, 2); }
  }
  // the cut: one horizontal line across the whole screen, then the flash
  if (c.cut > 0.01) {
    const [, cy] = cam.toScreen(D.x, D.y - 100 * D.s);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, c.cut * 1.4);
    g.fillStyle = '#ff2a3a'; g.fillRect(0, cy - 10 * c.cut, W, 20 * c.cut); g.fillStyle = '#ffffff'; g.fillRect(0, cy - 3 * c.cut, W, 6 * c.cut);
    g.restore();
  }
  if (c.bars > 0.01) { g.fillStyle = '#000'; g.fillRect(0, 0, W, 54 * c.bars); g.fillRect(0, H - 54 * c.bars, W, 54 * c.bars); }
  if (c.flash > 0.01) { g.save(); g.globalAlpha = c.flash * 0.85; g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.restore(); }
  if (c.black > 0.01) { g.fillStyle = `rgba(0,0,0,${c.black})`; g.fillRect(0, 0, W, H); }
}
