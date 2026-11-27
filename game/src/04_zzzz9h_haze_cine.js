// ============================ HAZE — ZERO VISIBILITY (ultimate cinematic) ============================
// Stillness → the deepest drag (camera pushes in to his face) → a slow exhale that swallows the whole arena in fog →
// two glowing eyes → strikes from behind / above / the other side, each time he dissolves back into the fog →
// shadow silhouettes all around them → he steps out right in front of them, takes a small drag and blows one
// concentrated blast into their face that launches them across the arena → the fog thins, he is back at his spot,
// pockets the cigarette: "Anyway…". Everything is scripted by frame number (no randomness), so it replays exactly.
const HZ_ULT = { drag: 24, exhale: 70, fogFull: 112, eyes: 114, strikes: [136, 156, 174, 190, 206, 222, 236, 248], silFrom: 168, final: 268, blow: 290, hit: 296, clear: 318, back: 340, anyway: 348, end: 392 };
const HZ_STRIKE = [   // side: +1 = the far side (behind them), -1 = his side; air: hit from above
  { side: 1, pose: 'elbow', hp: 'hit' }, { side: -1, pose: 'kick', hp: 'hit2' }, { side: 1, pose: 'vkick', hp: 'hit', air: 1 },
  { side: -1, pose: 'palm', hp: 'hit2' }, { side: 1, pose: 'hook', hp: 'hit' }, { side: -1, pose: 'vkick', hp: 'hit2', air: 1 },
  { side: 1, pose: 'elbow', hp: 'hit' }, { side: -1, pose: 'upper', hp: 'airhit' },
];
CINE.haze = function (A, D, f, c) {
  const U = HZ_ULT, dir = c.dir || A.facing;
  if (f === 1) {
    for (const z of hzZones(A)) z.dead = true;   // the ultimate's fog replaces his smoke zones
    A.x = clamp(A.x, 260, STAGE_W - 260); D.x = clamp(A.x + A.facing * 190, 80, STAGE_W - 80); D.y = GROUND; A.y = GROUND; D.facing = -A.facing;
    c.dir = A.facing; c.ox = A.x; c.maxF = U.end + 10; c.A = A; c.D = D;
    A.forcePose = 'stance'; D.forcePose = 'stance';
    c.zoom = 1.5; c.camX = (A.x + D.x) / 2; c.camY = GROUND - 170;
    c.fog = 0; c.eyes = []; c.sil = []; c.blast = 0; c.flash = 0; c.hole = 1; c.bars = 0; c.ember = 0; c.fogX = D.x;
    c.fg = hzUltFg; c.bg = null; FX.darkTarget = 0;
    A.hzProp = 'cig'; A.hzEx = null; A.hzMC = 0; A.hzHot = false; A.hzGlow = false;
  }
  const look = (prop, ex, hot, mc) => { A.hzProp = prop; A.hzEx = ex; A.hzHot = !!hot; A.hzMC = mc || 0; };
  c.bars = Math.min(1, c.bars + 0.05);
  // --- 1: STILLNESS, then the deepest drag; the camera pushes in to his face ---
  if (f === 8) Sound.play('flick');
  if (f >= U.drag && f < U.exhale) {
    if (f === U.drag) { A.forcePose = 'drag'; Sound.play('inhale'); Sound.play('inhale'); }
    look('cig', 'focus', true);
    c.ember = Math.min(1, c.ember + 0.035);
    const m = hzMouth(A); c.zoom = lerp(c.zoom, 2.9, 0.06); c.camX = lerp(c.camX, m[0], 0.12); c.camY = lerp(c.camY, m[1] + 6, 0.12);
    if (f === U.drag + 18) { BT.say(A, 'You can\'t fight what you can\'t see.', 70); Sound.speak('You can\'t fight what you can\'t see.', A.ch.voicePitch, A.ch.voiceRate); }
  }
  // --- 2: THE EXHALE — fog pours out and swallows the arena ---
  if (f === U.exhale) { A.forcePose = 'exhale'; look('cig', 'blow'); Sound.play('exhale'); Sound.play('fogRoll'); c.ember = 0.3; }
  if (f > U.exhale && f < U.fogFull) {
    c.fog = Math.min(1, (f - U.exhale) / (U.fogFull - U.exhale - 6));
    c.zoom = lerp(c.zoom, 1.15, 0.05); c.camX = lerp(c.camX, (A.x + D.x) / 2, 0.06); c.camY = lerp(c.camY, GROUND - 180, 0.06);
    if (f % 2 === 0) hzExhale(A, 3, 'rgba(150,140,180,0.5)', 3.5, 16);
  }
  if (f === U.fogFull - 4) { A.hidden = true; D.forcePose = 'stance'; }
  // --- 3: the fog: they look around; two eyes open in the dark ---
  if (f >= U.fogFull && f < U.strikes[0]) { D.forcePose = { base: 'stance', hd: Math.sin(f * 0.15) * 0.4, t: -0.05 }; c.fogX = lerp(c.fogX, D.x, 0.2); }
  if (f === U.eyes) { c.eyes.push({ x: -dir * 230, y: -130, t: 0, life: 22, big: 1 }); Sound.play('poof', 0.5); }
  // --- 4: strikes from every direction; each time he dissolves back into the fog ---
  U.strikes.forEach((s, i) => {
    const S = HZ_STRIKE[i];
    if (f === s - 6 && i > 2) c.eyes.push({ x: S.side * dir * 120, y: S.air ? -230 : -140, t: 0, life: 8 });
    if (f === s) {
      A.hidden = false; A.x = clamp(D.x + S.side * dir * 72, 50, STAGE_W - 50); A.facing = D.x > A.x ? 1 : -1;
      A.y = S.air ? GROUND - 70 : GROUND; A.forcePose = S.pose; A.afterimage = 8; look(null, 'focus');
      hzPoof(A.x, A.y - 100);
      BT.scriptHit(A, D, i === U.strikes.length - 1 ? 22 : 15, { str: i % 3 === 2 ? 3 : 2, sfx: i % 2 ? 'kick' : 'hit' });
      D.forcePose = S.hp; D.facing = A.x > D.x ? 1 : -1; FX.shakeIt(7); FX.speedlines(8, ...BT.cam.toScreen(D.x, D.y - 110), '#ffffff', 30);
      if (i % 3 === 2) FX.impactFrame(1);
      c.camX = lerp(c.camX, D.x, 0.5);
    }
    if (f === s + 6) { hzPoof(A.x, A.y - 100); A.hidden = true; A.y = GROUND; Sound.play('poof', 0.4); }
  });
  // shadow silhouettes appear all around them (some of them are where the next strike comes from)
  if (f >= U.silFrom && f < U.final && (f - U.silFrom) % 12 === 0) {
    const k = (f - U.silFrom) / 12, side = k % 2 ? 1 : -1;
    c.sil.push({ x: D.x + side * (110 + (k * 37) % 120), t: 0, life: 40, facing: -side, pose: ['stance', 'wait', 'lean', 'pocket'][k % 4] });
  }
  // --- 5: THE FINAL DRAG — he simply appears right in front of them ---
  if (f === U.final) {
    A.hidden = false; A.x = clamp(D.x - dir * 96, 50, STAGE_W - 50); A.y = GROUND; A.facing = dir; D.facing = -dir; D.x = A.x + dir * 96;
    A.forcePose = 'drag'; look('cig', null, true); D.forcePose = 'hit2'; c.sil = [];
    hzPoof(A.x, A.y - 100); Sound.play('inhale'); c.zoom = 1.75; c.camX = (A.x + D.x) / 2; c.camY = GROUND - 170;
  }
  if (f > U.final && f < U.blow) { c.hole = Math.min(1.8, c.hole + 0.04); c.zoom = lerp(c.zoom, 1.9, 0.05); }
  if (f === U.blow) { A.forcePose = 'push'; look('cig', 'blow'); Sound.play('exhale'); c.blast = 0.01; A.hzEx = 'blow'; }
  if (c.blast > 0) c.blast = Math.min(1.6, c.blast + 0.06);
  if (f === U.hit) {
    BT.scriptHit(A, D, 92, { str: 4, sfx: 'explosion' }); FX.impactFrame(4); FX.shakeIt(26); Sound.play('smokeBoom'); Sound.play('impactBig');
    c.flash = 0.8; D.forcePose = 'airhit'; c.fly = { x0: D.x, t: 0 };
    FX.wtext(D.x, D.y - 280, 'ZERO VISIBILITY', { size: 46, color: '#e8f8ff', stroke: '#3a2a5a', life: 70, vy: -0.3 });
  }
  if (c.fly) {   // launched across the arena in an arc
    c.fly.t++; const t = Math.min(1, c.fly.t / 34);
    D.x = clamp(c.fly.x0 + dir * 420 * t, 60, STAGE_W - 60); D.y = GROUND - Math.sin(t * Math.PI) * 150;
    if (t >= 1) { D.y = GROUND; D.forcePose = 'down'; }
    if (c.fly.t % 2 === 0) FX.p({ type: 'smoke', x: D.x - dir * 20, y: D.y - 100, vx: -dir, vy: -0.4, life: 30, size: rand(10, 16), grow: 0.3, color: 'rgba(120,100,160,0.45)', add: false });
    c.camX = lerp(c.camX, (A.x + D.x) / 2, 0.1); c.zoom = lerp(c.zoom, 1.15, 0.06);
  }
  // --- 6: the fog thins; he is back at his spot, pockets the cigarette ---
  if (f >= U.clear) { c.fog = Math.max(0, c.fog - 0.03); c.blast = Math.max(0, c.blast - 0.06); }
  if (f === U.back) { hzPoof(A.x, A.y - 100); A.x = c.ox; A.facing = D.x > A.x ? 1 : -1; A.forcePose = 'pocket'; look(null, null, false, 1); hzPoof(A.x, A.y - 100); }
  if (f === U.anyway) { BT.say(A, 'Anyway...', 40); Sound.speak('Anyway...', A.ch.voicePitch, A.ch.voiceRate * 0.9); A.hzEx = 'amused'; }
  if (f > U.anyway && f % 5 === 0) hzExhale(A, 1, null, 0.5, 6);
  for (const e of c.eyes) e.t++; c.eyes = c.eyes.filter(e => e.t < e.life);
  for (const s of c.sil) s.t++; c.sil = c.sil.filter(s => s.t < s.life);
  c.flash = Math.max(0, c.flash - 0.05);
  if (f >= U.clear) c.bars = Math.max(0, c.bars - 0.1);
  if (f >= U.end) { A.hidden = false; A.hzGlow = false; FX.darkTarget = 0; BT.release(D, dir * 2, -3); return true; }
};
function hzUltFg(g, c) {
  const cam = BT && BT.cam; if (!cam) return;
  const T = c.f, A = c.A, D = c.D, z = cam.z, fog = c.fog;
  if (fog > 0.01) {
    // the fog: dense everywhere, thinner around the opponent so the strikes stay readable
    const [dx, dy] = cam.toScreen(D.x, D.y - 110), hr = 230 * z * c.hole;
    const gr = g.createRadialGradient(dx, dy, hr * 0.15, dx, dy, hr * 1.6);
    gr.addColorStop(0, `rgba(36,32,46,${0.3 * fog})`); gr.addColorStop(0.5, `rgba(34,30,44,${0.75 * fog})`); gr.addColorStop(1, `rgba(26,24,34,${0.96 * fog})`);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) {   // rolling fog banks
      const ph = i * 2.39, x = ((i * 157 + T * (0.6 + (i % 4) * 0.25) * (i % 2 ? 1 : -1)) % (W + 400) + W + 400) % (W + 400) - 200;
      const y = 60 + (i * 97) % (H - 80) + Math.sin(T * 0.02 + ph) * 20;
      hzBlob(g, x, y, 130 + (i % 5) * 34, HZ_SMK[i % 4], 0.32 * fog);
    }
    g.globalAlpha = 1;
    // shadow silhouettes in the fog, each with two cyan eyes
    g.save(); cam.apply(g);
    for (const s of c.sil) {
      const a = Math.min(1, s.t / 8, (s.life - s.t) / 10) * fog, p = buildPose(A.ch, s.pose);
      g.globalAlpha = a * 0.75; const sk = drawFigure(g, A.ch, p, s.x, GROUND, s.facing, { mono: '#15131c' });
      const r = A.ch.dims.headR, e = toWorld(s.x, GROUND, s.facing, A.s, p, sk, ...headPt(sk, 0.52 * r, 0.33 * r));
      g.globalAlpha = a; g.globalCompositeOperation = 'lighter'; g.fillStyle = HZ; g.beginPath(); g.ellipse(e[0], e[1], 4.5, 2, 0, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(e[0] + s.facing * 13, e[1] - 1, 2, 2, 0, 0, TAU); g.fill(); g.globalCompositeOperation = 'source-over';
    }
    g.restore(); g.globalAlpha = 1;
    // glowing eyes (relative to the opponent)
    for (const e of c.eyes) {
      const k = Math.min(1, e.t / 4, (e.life - e.t) / 5), [ex, ey] = cam.toScreen(D.x + e.x, GROUND + e.y), s = (e.big ? 1.8 : 1.1) * z;
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = k;
      if (FX.hq) { const gg = g.createRadialGradient(ex, ey, 0, ex, ey, 60 * s); gg.addColorStop(0, 'rgba(79,240,224,0.5)'); gg.addColorStop(1, 'rgba(79,240,224,0)'); g.fillStyle = gg; g.fillRect(ex - 60 * s, ey - 60 * s, 120 * s, 120 * s); }
      g.fillStyle = '#c8fff8';
      for (const sx of [-14, 14]) { g.beginPath(); g.ellipse(ex + sx * s, ey, 9 * s, 3.2 * s * k, sx > 0 ? -0.12 : 0.12, 0, TAU); g.fill(); }
      g.restore();
    }
  }
  // the final concentrated blast: a cone of smoke from his mouth into their face
  if (c.blast > 0.01) {
    const m = hzMouth(A), [mx, my] = cam.toScreen(m[0], m[1]), [tx, ty] = cam.toScreen(D.x + A.facing * 120 * Math.min(1, c.blast), D.y - 120);
    const n = 12, a = Math.min(1, c.blast) * (c.f > HZ_ULT.clear ? Math.max(0, 1 - (c.f - HZ_ULT.clear) / 20) : 1);
    for (let i = 0; i < n; i++) { const k = i / (n - 1), x = lerp(mx, tx, k * Math.min(1, c.blast)), y = lerp(my, ty, k * Math.min(1, c.blast)) + Math.sin(T * 0.4 + i) * 4 * z; hzBlob(g, x, y, (10 + k * 90) * z, i % 2 ? 'rgba(150,140,190,0.95)' : 'rgba(110,170,140,0.9)', a * (0.55 + 0.3 * k)); }
    g.globalAlpha = 1; g.save(); g.globalCompositeOperation = 'lighter'; hzBlob(g, tx, ty, 110 * z * Math.min(1, c.blast), 'rgba(79,240,224,0.9)', a * 0.3); g.restore(); g.globalAlpha = 1;
  }
  if (c.bars > 0.01) { g.fillStyle = '#000'; g.fillRect(0, 0, W, 54 * c.bars); g.fillRect(0, H - 54 * c.bars, W, 54 * c.bars); }
  if (c.flash > 0.01) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = c.flash * 0.6; g.fillStyle = '#d8fff8'; g.fillRect(0, 0, W, H); g.restore(); }
}
