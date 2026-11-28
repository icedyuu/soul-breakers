// ============================ HAZE — THE SMOKE DEALER ============================
// Trickster / technical / area control. A relaxed, bored street kid in an oversized smoke-print hoodie who fights
// because there is nothing better to do. Four smoking devices, four jobs:
//   · CIGARETTE  — fast interrupt stream (Nicotine Rush) and a counter (Secondhand)
//   · SHISHA     — a big lingering cloud (Cloud Nine)
//   · VAPE       — evasive dash with a follow-up kick; inside smoke it becomes a SMOKE STEP behind the foe
//   · BONG       — slow, huge knockback burst (Heavy Hit)
//   · all four   — HOTBOX: a walled smoke zone (they are slowed, he is faster); ↓→SP2 again = CLEAR THE ROOM (collapse)
// SMOKE rules (HZ_CFG): his smoke covers whoever stands in it (he is CONCEALED, only his eyes and ember glow),
// an opponent who stands still in it without guarding starts COUGHING (short stagger, then 3 s immunity),
// the CPU reacts slower inside it. Zones are harmless projectiles (kind 'hzSmoke') with fixed lifetimes, one cloud
// and one hotbox at a time, never more than ~40% of the screen. Full fog only in the ultimate (04_zzzz9h_haze_cine.js).
// Determinism: no randomness in the simulation outcome; rand() is only used for particles.
const HZ = '#4ff0e0', HZP = '#8a5cc8', HZG = '#6fcf8f', HZD = '#121016', HZW = '#e8e4f0';
const HZ_CFG = {
  cloud: { w0: 50, w: 215, h: 270, life: 330, grow: 60, drift: 0.35, ahead: 170 },   // Cloud Nine (half-width, height, frames)
  hotbox: { w: 245, h: 300, life: 360, cd: 540, ahead: 70, slow: 1, walk: 1.3 },        // Hotbox; cd starts when it ends
  trail: { w: 46, h: 190, life: 46 },                                                   // vape trail puffs
  cough: { cloud: 1.15, hotbox: 1.5, decay: 2.5, stun: 26, immune: 180 },              // cough build per frame in smoke / stagger frames
  blind: 10,                                                                            // extra CPU reaction frames in smoke
  collapse: { dmg: 78, delay: 12 },
};

// ---------------------------------- smoke sprites + helpers ----------------------------------
const HZ_PUFF = {};
function hzPuff(col) {   // a soft round puff, rendered once per colour
  return HZ_PUFF[col] || (HZ_PUFF[col] = mkCanvas(96, 96, g => {
    const gr = g.createRadialGradient(48, 48, 2, 48, 48, 47);
    gr.addColorStop(0, col); gr.addColorStop(0.45, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.globalAlpha = 1; g.fillRect(0, 0, 96, 96);
  }));
}
// rgba() with a fixed alpha so the sprite gradient keeps its edge softness
const HZ_SMK = ['rgba(74,68,92,0.9)', 'rgba(92,78,120,0.9)', 'rgba(70,104,88,0.9)', 'rgba(110,104,124,0.9)'];
function hzBlob(g, x, y, r, col, a) { if (a <= 0.005 || r < 2) return; g.globalAlpha = Math.min(1, a); g.drawImage(hzPuff(col), x - r, y - r, r * 2, r * 2); }
function hzZones(F, sub) { const out = []; if (!BT) return out; for (const p of BT.projs) if (p.kind === 'hzSmoke' && p.owner === F && !p.dead && (!sub || p.sub === sub)) out.push(p); return out; }
function hzZoneAt(F, X, sub) {   // the zone of F's smoke that X stands in (feet inside the width, not above its top)
  if (!X || !BT) return null; let hit = null;
  for (const p of BT.projs) if (p.kind === 'hzSmoke' && p.owner === F && !p.dead && (!sub || p.sub === sub) && p.dens > 0.25 && Math.abs(X.x - p.x) < p.zw * 0.92 && X.y > GROUND - p.zh * 0.8) hit = p;
  return hit;
}
function hzMouth(F) {   // world position of his mouth
  if (!F.sk) return [F.x + F.facing * 20 * F.s, F.y - 150 * F.s];   // not drawn yet (cosmetic intro on its first frame)
  const sk = F.sk, r = F.ch.dims.headR, hp = headPt(sk, 0.78 * r, 0.62 * r);
  return toWorld(F.x, F.y, F.facing, F.s, F.pose, sk, hp[0], hp[1]);
}
function hzExhale(F, n, col, sp = 1.4, size = 6) {   // a short puff from his mouth
  const m = hzMouth(F);
  for (let i = 0; i < n; i++) FX.p({ type: 'smoke', x: m[0] + F.facing * rand(0, 6), y: m[1] + rand(-3, 3), vx: F.facing * rand(0.6, 1.6) * sp, vy: -rand(0.2, 0.9), life: rand(26, 42), size: rand(size * 0.6, size), grow: 0.22, drag: 0.96, color: col || 'rgba(200,196,214,0.38)', add: false });
}
function hzPoof(x, y, big, col) {   // a vanish/appear smoke burst
  const n = big ? 22 : 12;
  for (let i = 0; i < n; i++) { const a = i * TAU / n; FX.p({ type: 'smoke', x: x + Math.cos(a) * 10, y: y + Math.sin(a) * 26, vx: Math.cos(a) * rand(1.5, 3.5), vy: Math.sin(a) * rand(0.8, 2) - 0.4, life: rand(26, 40), size: rand(12, 20) * (big ? 1.3 : 1), grow: 0.4, drag: 0.92, color: col || (i % 3 ? 'rgba(90,82,112,0.55)' : 'rgba(80,120,100,0.5)'), add: false }); }
  FX.ring(x, y, HZ, 8, big ? 110 : 70, 14, 3, 0.6);
}

// ---------------------------------- props ----------------------------------
function hzEmber(g, x, y, r, hot) {   // the glowing tip of a cigarette / bowl
  g.save(); g.globalCompositeOperation = 'lighter';
  if (FX.hq) { const gr = g.createRadialGradient(x, y, 0, x, y, r * (hot ? 4 : 2.6)); gr.addColorStop(0, 'rgba(255,170,80,0.85)'); gr.addColorStop(1, 'rgba(255,60,20,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * (hot ? 4 : 2.6), 0, TAU); g.fill(); }
  g.fillStyle = hot ? '#fff0c0' : '#ff8a3a'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.restore();
}
function hzCig(g, x, y, ang, len, R, hot) {   // a cigarette: white paper, tan filter, ember
  g.save(); g.translate(x, y); g.rotate(ang);
  g.lineCap = 'butt';
  if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = 4.4; g.beginPath(); g.moveTo(-1, 0); g.lineTo(len + 1, 0); g.stroke(); }
  g.strokeStyle = R.mono || '#f4f0ea'; g.lineWidth = 2.8; g.beginPath(); g.moveTo(0, 0); g.lineTo(len, 0); g.stroke();
  if (!R.mono) { g.strokeStyle = '#d89a56'; g.beginPath(); g.moveTo(0, 0); g.lineTo(len * 0.3, 0); g.stroke(); g.restore(); hzEmber(g, x + Math.cos(ang) * len, y + Math.sin(ang) * len, 1.8, hot); return; }
  g.restore();
}
function hzVape(g, x, y, ang, R, glow) {   // a sleek box vape with a cyan LED strip
  g.save(); g.translate(x, y); g.rotate(ang);
  poly(g, [[-4, -9], [4, -9], [4.5, 8], [-4.5, 8]], R.mono || '#2a2832', R, 1.4);
  poly(g, [[-2, -13], [2, -13], [2.5, -9], [-2.5, -9]], R.mono || '#5a5864', R, 1.2);
  if (!R.mono) { g.save(); g.globalCompositeOperation = 'lighter'; if (FX.hq && glow) { g.shadowColor = HZ; g.shadowBlur = 8; } g.fillStyle = glow ? HZ : '#2a8a84'; g.fillRect(-1, -6, 2, 11); g.restore(); }
  g.restore();
}
function hzBong(g, x, y, R, fill, T) {   // a glass bong: bulb base, tall tube, side bowl; purple water, green smoke inside
  g.save(); g.translate(x, y);
  const m = R.mono;
  if (m) { poly(g, [[-5, -34], [5, -34], [5, 2], [11, 8], [11, 18], [-11, 18], [-11, 8], [-5, 2]], m, R, 1.6); g.restore(); return; }
  g.fillStyle = 'rgba(170,220,255,0.22)'; g.strokeStyle = 'rgba(220,240,255,0.85)'; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(-5, -36); g.lineTo(-5, 2); g.quadraticCurveTo(-13, 8, -12, 15); g.quadraticCurveTo(0, 24, 12, 15); g.quadraticCurveTo(13, 8, 5, 2); g.lineTo(5, -36); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = 'rgba(138,92,200,0.7)'; g.beginPath(); g.moveTo(-11, 10); g.quadraticCurveTo(0, 7 + Math.sin((T || 0) * 0.5) * 1.5, 11, 10); g.quadraticCurveTo(10, 20, 0, 20); g.quadraticCurveTo(-10, 20, -11, 10); g.fill();
  if (fill > 0) { g.fillStyle = `rgba(111,207,143,${0.25 + 0.45 * fill})`; g.fillRect(-4, -34 + 32 * (1 - fill), 8, 32 * fill); }
  g.strokeStyle = 'rgba(220,240,255,0.85)'; g.lineWidth = 2; g.beginPath(); g.moveTo(6, 9); g.lineTo(15, 1); g.stroke();
  g.fillStyle = '#3a3640'; g.beginPath(); g.ellipse(16, 0, 4, 2.4, -0.7, 0, TAU); g.fill();
  if (fill > 0) hzEmber(g, 16, -1, 1.6 + fill, fill > 0.7);
  g.strokeStyle = HZ; g.globalAlpha = 0.6; g.lineWidth = 1; g.beginPath(); g.moveTo(-3, -30); g.lineTo(-3, -6); g.stroke();
  g.restore();
}
function hzHookah(g, x, y, R, mouth, hot) {   // a small shisha held by its neck: glass vase, brass stem, bowl with coals, hose to the mouth
  const m = R.mono;
  g.save(); g.translate(x, y);
  if (m) { poly(g, [[-3, -26], [3, -26], [3, 4], [12, 12], [10, 26], [-10, 26], [-12, 12], [-3, 4]], m, R, 1.6); g.restore(); return; }
  g.fillStyle = 'rgba(138,92,200,0.75)'; g.strokeStyle = OUTLINE; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(-4, 4); g.quadraticCurveTo(-15, 10, -12, 22); g.quadraticCurveTo(0, 30, 12, 22); g.quadraticCurveTo(15, 10, 4, 4); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.ellipse(-6, 14, 2.5, 5, 0.3, 0, TAU); g.fill();
  g.fillStyle = '#b08a3a'; g.fillRect(-2, -24, 4, 28); g.strokeRect(-2, -24, 4, 28);
  g.fillStyle = '#c8a050'; g.beginPath(); g.ellipse(0, -10, 9, 2.6, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = '#5a3a2a'; g.beginPath(); g.moveTo(-6, -24); g.lineTo(6, -24); g.lineTo(4, -31); g.lineTo(-4, -31); g.closePath(); g.fill(); g.stroke();
  hzEmber(g, -1.5, -32, 1.6, hot); hzEmber(g, 2, -32, 1.4, hot);
  g.restore();
  if (mouth) {   // the hose (body space)
    g.strokeStyle = OUTLINE; g.lineWidth = 3.6; g.beginPath(); g.moveTo(x + 3, y - 6); g.bezierCurveTo(x + 26, y + 10, mouth[0] + 4, mouth[1] + 40, mouth[0], mouth[1] + 2); g.stroke();
    g.strokeStyle = '#5a4a6a'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#c8a050'; g.beginPath(); g.arc(mouth[0], mouth[1] + 2, 2.2, 0, TAU); g.fill();
  }
}
function hzLighter(g, x, y, R, lit, T) {   // a steel flip lighter
  poly(g, [[x - 4, y - 5], [x + 4, y - 5], [x + 4, y + 6], [x - 4, y + 6]], R.mono || '#b8bcc8', R, 1.2);
  if (R.mono || !lit) return;
  g.save(); g.globalCompositeOperation = 'lighter'; const fl = 1 + Math.sin((T || 0) * 0.9) * 0.15;
  g.fillStyle = 'rgba(255,170,60,0.9)'; g.beginPath(); g.ellipse(x, y - 10 * fl, 2.6, 5 * fl, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(120,200,255,0.8)'; g.beginPath(); g.ellipse(x, y - 7, 1.4, 2.2, 0, 0, TAU); g.fill(); g.restore();
}

// ---------------------------------- face + art ----------------------------------
// c.ex: null (bored, heavy lids) · 'amused' (one-sided smirk) · 'focus' (narrow, cold) · 'blow' (exhaling, lips round) ·
// 'meh' (defeat: unimpressed, overrides the hurt face) · c.mcig: cigarette in the mouth · c.eyeGlow: glowing eyes (concealed)
function hzFace(g, r, c, o) {
  let e = c.ex || null; const oe = o.expr;
  if ((oe === 'hurt' || oe === 'ko') && e !== 'meh') { chibiFace(g, r, c, o); return; }
  const ex = 0.5 * r, ey = 0.27 * r, fx = 0.94 * r;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  const oo = { ...o };
  chibiEye(g, fx, ey - 0.01 * r, 0.075 * r, 0.28 * r, c, oo, true);
  chibiEye(g, ex, ey, 0.23 * r, 0.34 * r, c, oo, false);
  // heavy, bored upper lids (lower when focused, a little higher when amused)
  const k = e === 'focus' ? 0.66 : e === 'amused' ? 0.44 : e === 'meh' ? 0.6 : 0.54;
  g.fillStyle = c.skin; g.beginPath(); g.ellipse(ex, ey - 0.34 * r * (1.25 - k), 0.32 * r, 0.36 * r * k, 0, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(fx, ey - 0.28 * r * (1.25 - k), 0.12 * r, 0.3 * r * k, 0, 0, TAU); g.fill();
  const ly = ey - 0.34 * r * (1.25 - k) + 0.36 * r * k;
  g.strokeStyle = OUTLINE; g.lineWidth = 0.075 * r; g.beginPath(); g.moveTo(ex - 0.25 * r, ly - 0.02 * r); g.quadraticCurveTo(ex, ly + 0.05 * r, ex + 0.25 * r, ly - 0.04 * r); g.stroke();
    if (c.eyeGlow) {   // concealed: the eyes glow through the smoke
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = HZ; g.globalAlpha = 0.8;
    g.beginPath(); g.ellipse(ex + 0.02 * r, ey + 0.08 * r, 0.12 * r, 0.06 * r, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(fx, ey + 0.08 * r, 0.04 * r, 0.05 * r, 0, 0, TAU); g.fill(); g.restore();
  }
  // round purple shades pushed down the nose — the eyes look over them
  g.fillStyle = 'rgba(120,80,190,0.55)'; g.strokeStyle = '#1a1420'; g.lineWidth = 0.05 * r;
  g.beginPath(); g.ellipse(ex + 0.04 * r, ey + 0.1 * r, 0.25 * r, 0.17 * r, 0, Math.PI * 1.02, Math.PI * 1.98, true); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(fx + 0.02 * r, ey + 0.09 * r, 0.08 * r, 0.15 * r, 0, Math.PI * 1.02, Math.PI * 1.98, true); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(ex + 0.29 * r, ey + 0.1 * r); g.lineTo(fx - 0.06 * r, ey + 0.09 * r); g.stroke();
  g.strokeStyle = 'rgba(79,240,224,0.75)'; g.lineWidth = 0.035 * r; g.beginPath(); g.moveTo(ex - 0.06 * r, ey + 0.16 * r); g.lineTo(ex + 0.08 * r, ey + 0.2 * r); g.stroke();
  // brows: flat and lazy; one raised when amused
  g.strokeStyle = c.brow || OUTLINE; g.lineWidth = 0.055 * r; g.beginPath();
  if (e === 'amused') { g.moveTo(ex - 0.22 * r, ey - 0.5 * r); g.quadraticCurveTo(ex, ey - 0.66 * r, ex + 0.24 * r, ey - 0.56 * r); }
  else if (e === 'focus') { g.moveTo(ex - 0.22 * r, ey - 0.46 * r); g.lineTo(ex + 0.24 * r, ey - 0.4 * r); }
  else { g.moveTo(ex - 0.22 * r, ey - 0.5 * r); g.lineTo(ex + 0.24 * r, ey - 0.48 * r); }
  g.stroke();
  // mouth
  const mx = 0.72 * r, my = 0.74 * r; g.strokeStyle = OUTLINE; g.lineWidth = 0.05 * r;
  if (e === 'blow') { g.fillStyle = '#3a1a24'; g.beginPath(); g.ellipse(mx + 0.04 * r, my, 0.05 * r, 0.06 * r, 0, 0, TAU); g.fill(); g.stroke(); }
  else if (e === 'amused') { g.beginPath(); g.moveTo(mx - 0.1 * r, my + 0.02 * r); g.quadraticCurveTo(mx + 0.02 * r, my + 0.05 * r, mx + 0.14 * r, my - 0.07 * r); g.stroke(); }
  else { g.beginPath(); g.moveTo(mx - 0.08 * r, my + 0.02 * r); g.lineTo(mx + 0.11 * r, my + 0.01 * r); g.stroke(); }
  if (c.mcig) hzCig(g, mx + 0.1 * r, my + 0.01 * r, 0.42, 0.46 * r, { mono: null }, c.mcig > 1);
  g.restore();
}
const HAZE = {
  id: 'haze', name: 'HAZE', jp: 'ヘイズ', title: 'The Smoke Dealer', titleJp: '煙の売人',
  style: 'TRICKSTER / AREA CONTROL', desc: 'A relaxed, eccentric street smoker who fights like he is killing time. Cigarette, shisha, vape and bong each do a different job: interrupt, cloud, dash, blast. He controls what you see, where you can move and when you can attack.',
  stats: { power: 2, speed: 4, range: 3, defense: 2 },
  scale: 1.0, health: 980, walk: 4.5, backWalk: 4.1, jumpV: -17, jumpX: 5, dashV: 14.5, backdashV: 11, backdashInv: 10, juggleMax: 6,
  voicePitch: 0.72, voiceRate: 0.82,
  colors: {
    skin: '#f2ddd0', hair: '#2c2a33', hair2: '#3a3842', tip: HZG, top: '#4a4656', uarm: '#4a4656', farm: '#4a4656', cuff: HZP, hand: '#f2ddd0',
    leg: '#2a2830', boot: '#34323a', foot: '#34323a', warm: '#2a2830', sole: HZ, pad: HZP,
    eye: '#86e8c4', eye2: '#1e4a3a', brow: '#2c2a33', accent: HZ, collar: '#3a3644', male: 1,
    hood: '#3a3644', print: HZG, print2: HZP, string: '#d8d4e0', chain: '#c8ccd8', pocket: '#3e3a48',
    ex: null, prop: null, mcig: 0, eyeGlow: 0,
  },
  afterColors: [HZ, HZP, HZG],
  hurt: { w: 50, h: 172 },
  stance: { t: 0.08, hd: 0.16, fa1: 0.35, fa2: 1.9, ba1: 0.12, ba2: 0.55, fl1: 0.22, fl2: 0.05, bl1: -0.18, bl2: -0.1 },
  poses: {
    dash: { t: 0.42, hd: 0.0, fa1: -0.35, fa2: -0.1, ba1: -0.6, ba2: -0.3, fl1: 0.9, fl2: 0.25, bl1: -0.55, bl2: -0.75 },
    drag: { t: 0.02, hd: -0.04, fa1: 0.9, fa2: 3.25, ba1: 0.12, ba2: 0.55, fl1: 0.2, fl2: 0.05, bl1: -0.16, bl2: -0.1 },
    exhale: { t: -0.08, hd: -0.3, fa1: 0.45, fa2: 1.6, ba1: 0.12, ba2: 0.55, fl1: 0.2, fl2: 0.05, bl1: -0.16, bl2: -0.1 },
    flick_w: { t: -0.04, hd: 0.1, fa1: 0.2, fa2: 2.6, ba1: 0.12, ba2: 0.55 },
    flick: { t: 0.22, hd: 0.1, fa1: 1.55, fa2: 1.6, ba1: 0.0, ba2: 0.4, fl1: 0.5, bl1: -0.4 },
    push: { t: 0.18, hd: 0.06, fa1: 1.5, fa2: 1.55, ba1: 0.12, ba2: 0.55, fl1: 0.48, fl2: 0.08, bl1: -0.36, bl2: -0.12 },
    shisha_w: { t: 0.0, hd: -0.02, fa1: 0.85, fa2: 3.2, ba1: 0.35, ba2: 0.9, fl1: 0.22, bl1: -0.18 },
    shisha: { t: -0.12, hd: -0.34, fa1: 0.4, fa2: 1.3, ba1: 0.35, ba2: 0.9, fl1: 0.28, bl1: -0.22 },
    vape_w: { t: 0.1, hd: 0.0, fa1: 0.9, fa2: 3.2, ba1: 0.2, ba2: 0.6, fl1: 0.5, fl2: 0.2, bl1: -0.3 },
    glide: { t: 0.48, hd: -0.05, fa1: -0.4, fa2: -0.2, ba1: -0.7, ba2: -0.4, fl1: 1.0, fl2: 0.3, bl1: -0.6, bl2: -0.8, hipH: 80 },
    glideBack: { t: -0.3, hd: 0.2, fa1: 1.1, fa2: 2.2, ba1: 0.4, ba2: 0.9, fl1: 0.6, fl2: 0.9, bl1: -0.2, bl2: 0.1, hipH: 84 },
    vkick_w: { t: -0.1, hd: 0.1, fa1: 0.2, fa2: 1.0, ba1: -0.3, ba2: 0.3, fl1: 1.1, fl2: -0.2, bl1: -0.2, bl2: -0.1 },
    vkick: { t: -0.3, hd: 0.2, fa1: 0.3, fa2: 1.2, ba1: -0.5, ba2: 0.4, fl1: 1.75, fl2: 1.7, bl1: -0.1, bl2: -0.05 },
    bong_w: { t: 0.32, hd: 0.36, fa1: 0.75, fa2: 2.2, ba1: 0.95, ba2: 1.9, fl1: 0.75, fl2: 0.2, bl1: -0.3, bl2: -0.5, hipH: 66 },
    bong_pull: { t: 0.28, hd: 0.3, fa1: 0.7, fa2: 2.3, ba1: 0.9, ba2: 2.0, fl1: 0.75, fl2: 0.2, bl1: -0.3, bl2: -0.5, hipH: 64 },
    bong: { t: -0.18, hd: -0.28, fa1: 0.2, fa2: 0.5, ba1: -0.6, ba2: -0.3, fl1: 0.55, fl2: 0.12, bl1: -0.45, bl2: -0.2 },
    hotbox_w: { t: -0.1, hd: -0.2, fa1: 0.9, fa2: 3.2, ba1: 0.5, ba2: 1.2, fl1: 0.26, bl1: -0.2 },
    hotbox: { t: -0.06, hd: -0.18, fa1: 2.1, fa2: 2.4, ba1: 2.2, ba2: 2.6, fl1: 0.35, fl2: 0.05, bl1: -0.3, bl2: -0.1 },
    snap: { t: 0.04, hd: 0.14, fa1: 1.25, fa2: 2.75, ba1: 0.12, ba2: 0.55 },
    wait: { t: 0.04, hd: 0.22, fa1: 0.15, fa2: 0.45, ba1: 0.12, ba2: 0.5, fl1: 0.16, fl2: 0.04, bl1: -0.14, bl2: -0.12 },
    elbow_w: { t: -0.2, hd: 0.1, fa1: 2.4, fa2: 0.8, ba1: 0.2, ba2: 0.6, fl1: 0.4, bl1: -0.3 },
    elbow: { t: 0.42, hd: 0.0, fa1: 1.4, fa2: 0.2, ba1: -0.4, ba2: 0.1, fl1: 0.6, fl2: 0.1, bl1: -0.45, bl2: -0.2 },
    palm: { t: 0.3, hd: 0.06, fa1: 1.6, fa2: 1.62, ba1: 1.2, ba2: 1.5, fl1: 0.56, fl2: 0.1, bl1: -0.42, bl2: -0.16 },
    lean: { t: -0.1, hd: 0.26, fa1: 0.1, fa2: 0.4, ba1: 0.12, ba2: 0.5, fl1: 0.32, fl2: 0.2, bl1: -0.05, bl2: -0.05 },
    pocket: { t: 0.02, hd: 0.3, fa1: 0.18, fa2: 0.5, ba1: 0.12, ba2: 0.5, fl1: 0.2, fl2: 0.05, bl1: -0.16, bl2: -0.1 },
    light: { t: 0.06, hd: 0.3, fa1: 0.95, fa2: 3.3, ba1: 0.75, ba2: 3.1, fl1: 0.2, fl2: 0.05, bl1: -0.16, bl2: -0.1 },
    sitdown: { ground: 0, hipH: 16, t: -0.32, hd: 0.36, fa1: 0.95, fa2: 1.85, ba1: -0.75, ba2: -0.55, fl1: 1.45, fl2: 1.3, bl1: 1.15, bl2: 2.4 },
    defeat: { ground: 0, hipH: 16, t: -0.32, hd: 0.36, fa1: 0.95, fa2: 1.85, ba1: -0.75, ba2: -0.55, fl1: 1.45, fl2: 1.3, bl1: 1.15, bl2: 2.4 },
    intro: { t: 0.06, hd: 0.3, fa1: 0.95, fa2: 3.3, ba1: 0.75, ba2: 3.1, fl1: 0.2, fl2: 0.05, bl1: -0.16, bl2: -0.1 },
    victory: { t: -0.1, hd: 0.26, fa1: 0.1, fa2: 0.4, ba1: 0.12, ba2: 0.5, fl1: 0.32, fl2: 0.2, bl1: -0.05, bl2: -0.05 },
    dive: { base: 'jump', t: 0.5, hd: 0.3, fa1: 2.3, fa2: 2.1 },
  },
  intro: 'Ugh. Fine. Let\'s get this over with.',
  wins: ['That\'s it? I didn\'t even finish my smoke.', 'You were swinging at air. Literally.', 'Anyway... where was I.'],
  hairBack(g, r, c, R) {   // messy, shaggy back hair
    polyR(g, r, [[0.4, -0.96], [-0.2, -1.16], [-0.86, -0.96], [-1.22, -0.5], [-1.3, 0.1], [-1.2, 0.5], [-1.38, 0.68], [-0.98, 0.7], [-0.8, 0.9], [-0.5, 0.42]], c.hair, R);
  },
  hairFront(g, r, c, R) {
    skullHair(g, r, c, R);
    // tousled fringe falling over the forehead and one eye; spikes all over
    polyR(g, r, [[-0.72, -0.82], [-0.5, -1.22], [-0.2, -1.04], [0.0, -1.3], [0.3, -1.06], [0.62, -1.18], [0.74, -0.9], [1.08, -0.86], [1.06, -0.56],
      [1.16, -0.2], [0.94, -0.36], [0.92, 0.02], [0.76, -0.3], [0.62, -0.02], [0.5, -0.38], [0.3, -0.14], [0.2, -0.5], [-0.12, -0.58], [-0.42, -0.6]], c.hair, R);
    if (R.mono) return;
    g.fillStyle = c.hair2; g.beginPath(); g.moveTo(0.1 * r, -1.0 * r); g.lineTo(0.5 * r, -0.62 * r); g.lineTo(0.3 * r, -0.62 * r); g.closePath(); g.fill();
    // smoky green tips
    g.fillStyle = c.tip; g.globalAlpha = 0.9;
    for (const [x, y, w] of [[1.16, -0.2, 0.1], [0.92, 0.02, 0.09], [0.62, -0.02, 0.09], [0.3, -0.14, 0.08], [-0.5, -1.22, 0.08], [0.0, -1.3, 0.08], [0.62, -1.18, 0.08]]) {
      g.beginPath(); g.moveTo(x * r, y * r); g.lineTo((x - w) * r, (y - 0.16) * r); g.lineTo((x + w) * r, (y - 0.2) * r); g.closePath(); g.fill();
    }
    g.globalAlpha = 1;
    // cyan ear cuff
    g.strokeStyle = HZ; g.lineWidth = 0.06 * r; g.beginPath(); g.arc(-0.16 * r, 0.24 * r, 0.11 * r, 0.6, 3.4); g.stroke();
  },
  weaponBack(g, sk, p, c, R, o) {
    // the hood, bunched up behind his neck and shoulders
    const n = sk.neck;
    poly(g, [[n[0] - 22, n[1] + 10], [n[0] - 25, n[1] - 8], [n[0] - 14, n[1] - 18], [n[0] - 2, n[1] - 14], [n[0] + 4, n[1] - 2], [n[0] - 4, n[1] + 12]], R.mono || c.hood, R, 2);
    if (!R.mono) { g.strokeStyle = c.print2; g.lineWidth = 1.4; g.beginPath(); g.moveTo(n[0] - 20, n[1] + 4); g.quadraticCurveTo(n[0] - 18, n[1] - 12, n[0] - 4, n[1] - 12); g.stroke(); }
    if (c.prop === 'hookah') hzHookah(g, sk.bh[0] + 2, sk.bh[1] + 8, R, headPt(sk, 0.86 * 26, 0.7 * 26), c.hot);
  },
  neckWear(g, sk, p, c, R) {   // hoodie collar + a silver chain with a glowing pendant
    const n = sk.neck;
    poly(g, [[n[0] - 10, n[1] + 6], [n[0] - 8, n[1] - 4], [n[0] + 10, n[1] - 3], [n[0] + 12, n[1] + 6], [n[0] + 2, n[1] + 10]], R.mono || c.collar, R, 2);
    if (R.mono) return;
    g.strokeStyle = c.chain; g.lineWidth = 1.2; g.beginPath(); g.moveTo(n[0] - 6, n[1] + 4); g.quadraticCurveTo(n[0] + 3, n[1] + 16, n[0] + 10, n[1] + 4); g.stroke();
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = HZ; if (FX.hq) { g.shadowColor = HZ; g.shadowBlur = 6; } g.fillRect(n[0] + 1.5, n[1] + 11, 3, 5); g.restore();
  },
  torsoDetail(g, L, bw, c, R, o) {   // oversized hoodie: smoke-swirl print, drawstrings, kangaroo pocket
    const T = (o && o.T) || 0;
    g.strokeStyle = c.print; g.lineWidth = 2.6; g.globalAlpha = 0.95;
    g.beginPath(); g.moveTo(-6 * bw, -L * 0.52); g.bezierCurveTo(-2 * bw, -L * 0.7, 6 * bw, -L * 0.48, 4 * bw, -L * 0.66);
    g.bezierCurveTo(2 * bw, -L * 0.8, 10 * bw, -L * 0.82, 11 * bw, -L * 0.68); g.stroke();
    g.strokeStyle = c.print2; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-8 * bw, -L * 0.6); g.bezierCurveTo(-4 * bw, -L * 0.76, 2 * bw, -L * 0.6, 0, -L * 0.74); g.stroke();
    g.globalAlpha = 1;
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = HZ; g.globalAlpha = 0.35 + 0.2 * Math.sin(T * 0.05); g.lineWidth = 1.2;
    g.beginPath(); g.arc(9 * bw, -L * 0.74, 2.6, 0, TAU); g.stroke(); g.restore();
    g.fillStyle = c.pocket; g.beginPath(); g.moveTo(-9 * bw, -L * 0.32); g.lineTo(9 * bw, -L * 0.32); g.lineTo(11 * bw, -L * 0.04); g.lineTo(-11 * bw, -L * 0.04); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = c.string; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(3 * bw, -L * 0.98); g.lineTo(2 * bw, -L * 0.62); g.moveTo(9 * bw, -L * 0.98); g.lineTo(10 * bw, -L * 0.6); g.stroke();
    g.fillStyle = HZ; g.fillRect(1 * bw, -L * 0.63, 2.4, 3.6); g.fillRect(9 * bw, -L * 0.61, 2.4, 3.6);
  },
  torsoOver(g, L, bw, c, R) { if (R.mono) return; poly(g, [[-13 * bw, -6], [12 * bw, -7], [12 * bw, 4], [-13 * bw, 5]], c.hood, R, 2); },   // ribbed hem of the oversized hoodie
  weaponFront(g, sk, p, c, R, o) {
    const pr = c.prop; if (!pr) return;
    const h = sk.fh, T = (o && o.T) || 0, a = Math.atan2(sk.fh[1] - sk.fe[1], sk.fh[0] - sk.fe[0]);
    if (pr === 'cig') hzCig(g, h[0] + Math.cos(a) * 3, h[1] + Math.sin(a) * 3 - 1, a - 0.9, 11, R, c.hot);
    else if (pr === 'vape') hzVape(g, h[0] + Math.cos(a) * 4, h[1] + Math.sin(a) * 4, a + Math.PI / 2, R, true);
    else if (pr === 'bong') hzBong(g, h[0] + 6, h[1] + 4, R, c.fill || 0, T);
    else if (pr === 'lighter') hzLighter(g, h[0] + 2, h[1] - 4, R, true, T);
  },
};
makeChibi(HAZE, { build: { arm: 1.04, leg: 1.0, torso: 1.12 }, colors: {} });
HAZE.faceFn = hzFace;
HAZE.colors.belt = null;

// ---------------------------------- state → look ----------------------------------
const HZ_PAL = {};
HAZE.palette = F => {
  const key = (F.hzProp || '') + '|' + (F.hzEx || '') + '|' + (F.hzMC || 0) + '|' + (F.hzHot ? 1 : 0) + '|' + (F.hzFill || 0) + '|' + (F.hzGlow ? 1 : 0);
  return HZ_PAL[key] || (HZ_PAL[key] = { ...HAZE.colors, prop: F.hzProp || null, ex: F.hzEx || null, mcig: F.hzMC || 0, hot: !!F.hzHot, fill: F.hzFill || 0, eyeGlow: F.hzGlow ? 1 : 0 });
};
// what he holds / his face per move and frame (draw-only, derived from sim state)
const HZ_LOOK = {
  L: f => ['cig', null], jL: () => ['cig', null], cL: () => ['cig', null], H: f => ['cig', 'focus'],
  sp1: f => f <= 8 ? ['cig', null, 0, f > 3] : ['cig', 'blow'],
  sp1f: f => f <= 20 ? ['hookah', null, 0, f > 6] : f <= 44 ? ['hookah', 'blow', 0, true] : ['hookah', null],
  counter: f => ['vape', 'focus'], smokeStep: f => ['vape', 'amused'], vaporKick: f => ['vape', 'focus'],
  sp2: f => f <= 27 ? ['bong', 'focus', 0, f > 10, Math.min(3, Math.floor(f / 7))] : ['bong', 'blow'], sp2hb: f => f <= 19 ? ['bong', 'focus', 0, f > 6, Math.min(3, Math.floor(f / 5))] : ['bong', 'blow'],
  sp2f: f => f <= 16 ? ['vape', 'blow', 2] : [null, 'amused', 1], hzClear: f => [null, 'amused', 1],
  sp2d: f => [null, null, 2], secondhand: f => [null, 'focus', 1],
  ult: f => ['cig', 'blow'],
};
HAZE.initFighter = F => {
  F.hzProp = 'cig'; F.hzEx = null; F.hzMC = 0; F.hzHot = false; F.hzFill = 0; F.hzGlow = false; F.hzExT = 0;
  F.hzConc = null; F.hzCine = null; F.hzStats = { cough: 0, step: 0, counter: 0, clouds: 0, hotbox: 0 }; F.hzHB = 0; F.hzDir = 1;
};
HAZE.walkMul = F => F.hzConc && F.hzConc.sub === 'hotbox' ? HZ_CFG.hotbox.walk : 1;
HAZE.idlePose = F => { const k = F.T % 420; return k > 260 && k < 300 ? 'drag' : k >= 300 && k < 340 ? 'exhale' : null; };
HAZE.statePose = F => {
  if (F.state === 'defeat') return F.sf < 26 ? ['hit', 0.2] : ['defeat', 0.07];
  if (F.state === 'victory' && !F.cos) return [F.sf < 34 ? 'drag' : F.sf < 80 ? 'exhale' : 'lean', 0.1];
  if (F.state === 'intro' && !F.cos) return [F.sf < 50 ? 'light' : F.sf < 80 ? 'drag' : 'exhale', 0.12];
  if (F.state === 'dash') return ['dash', 0.4];
  return null;
};
HAZE.cpuBlind = (F, O) => (hzZoneAt(F, O) || (F.hzConc && F.hzConc.sub !== 'trail') ? HZ_CFG.blind : 0);   // 07c_cpu.js: slower reactions in his smoke
HAZE.tick = F => {
  const O = F.opp; if (!O) return;
  const live = BT && BT.phase === 'fight' && !F.ko;
  // look: prop, face, cigarette in the mouth
  if (F.state !== 'cine') {
    const s = F.state, k = F.moveKey, f = F.mf;
    let L = null;
    if (s === 'attack') L = HZ_LOOK[k] ? HZ_LOOK[k](f) : ['cig', null];
    else if (s === 'idle' || s === 'walk' || s === 'crouch' || s === 'jump' || s === 'land' || s === 'prejump' || s === 'dash' || s === 'backdash') L = ['cig', null];
    else if (s === 'intro') L = F.sf < 46 ? ['lighter', null, 1] : ['cig', null];
    else if (s === 'victory') L = [F.sf < 80 ? 'cig' : null, F.sf < 34 ? null : F.sf < 80 ? 'blow' : 'amused', F.sf >= 80 ? 1 : 0];
    else if (s === 'defeat') L = [null, 'meh', F.sf > 40 ? 1 : 0];
    else L = [null, null];
    F.hzProp = L[0]; F.hzMC = L[2] || 0; F.hzHot = !!L[3]; F.hzFill = L[4] || 0;
    if (F.hzExT > 0) { F.hzExT--; } else F.hzEx = L[1];
    if (s === 'idle' && F.T % 420 >= 300 && F.T % 420 < 330 && F.T % 3 === 0) hzExhale(F, 1, null, 0.8, 5);
    if (s === 'victory' && F.sf >= 34 && F.sf < 80 && F.sf % 2 === 0 && !F.cos) hzExhale(F, 2, null, 0.6, 9);
    if (s === 'dash' && F.T % 2 === 0) FX.p({ type: 'smoke', x: F.x - F.facing * 24, y: F.y - rand(30, 120), vx: -F.facing * 1.2, vy: -0.3, life: 20, size: rand(6, 10), grow: 0.3, color: F.T % 4 ? 'rgba(79,240,224,0.28)' : 'rgba(138,92,200,0.3)', add: false });
    if (F.hzProp === 'cig' && F.T % 9 === 0 && !F.hidden) { const h = F.handW('f'); FX.p({ type: 'smoke', x: h[0] + F.facing * 6, y: h[1] - 10, vx: rand(-0.15, 0.15), vy: -rand(0.5, 0.9), life: 40, size: 2.4, grow: 0.12, drag: 0.99, color: 'rgba(210,206,224,0.35)', add: false }); }
    if (F.T % 14 === 0 && !F.hidden && (s === 'idle' || s === 'walk')) FX.p({ type: 'smoke', x: F.x - F.facing * rand(4, 22), y: F.y - 150 * F.s, vx: -F.facing * 0.2, vy: -0.5, life: 34, size: 4, grow: 0.15, color: 'rgba(111,207,143,0.22)', add: false });   // supernatural smoke wisps rising off the hood
  }
  // smoke zones: concealment, cough, hotbox slow, cooldown bookkeeping
  F.hzConc = live ? hzZoneAt(F, F) : null;
  F.hzGlow = !!F.hzConc && F.hzConc.sub !== 'trail';
  const hb = hzZones(F, 'hotbox')[0];
  if (hb && !hb.dying) F.cd.sp2f = 0;   // while a Hotbox stands, ↓→SP2 is CLEAR THE ROOM
  else if (F.hzHB) { F.hzHB = 0; F.cd.sp2f = Math.max(F.cd.sp2f || 0, HZ_CFG.hotbox.cd); }
  if (hb && !hb.dying) F.hzHB = 1;
  if (!live) return;
  const z = hzZoneAt(F, O);
  if (O.hzCoughCd > 0) O.hzCoughCd--;
  if (z && z.sub !== 'trail') {
    O.hzBlindT = 2;
    if (z.sub === 'hotbox' && HZ_CFG.hotbox.slow) O.slowT = Math.max(O.slowT, 2);
    const free = (O.state === 'idle' || O.state === 'walk' || O.state === 'crouch') && !O.guard && O.onGround;
    if (free && !(O.hzCoughCd > 0)) {
      O.hzCough = (O.hzCough || 0) + HZ_CFG.cough[z.sub === 'hotbox' ? 'hotbox' : 'cloud'];
      if (O.hzCough >= 60 && O.T % 10 === 0) FX.wtext(O.x, O.y - 222 * O.s, 'cough…', { size: 16, color: '#c8c4d8', stroke: HZD, life: 18 });
      if (O.hzCough >= 100) hzCough(F, O);
    }
  } else if (O.hzCough > 0) O.hzCough = Math.max(0, O.hzCough - HZ_CFG.cough.decay);
  if (O.hzBlindT > 0 && !z) O.hzBlindT--;
};
function hzCough(F, O) {
  const C = HZ_CFG.cough;
  O.hzCough = 0; O.hzCoughCd = C.immune; O.move = null; O.hitActive = false; O.guard = false; O.vx = 0;
  O.setState('hit'); O.hitstun = C.stun; O.crouchHit = false;
  FX.wtext(O.x, O.y - 232 * O.s, 'COUGH! COUGH!', { size: 26, color: '#ffffff', stroke: '#4a3a6a', life: 40 });
  const c = O.chestW(); for (let i = 0; i < 8; i++) FX.p({ type: 'smoke', x: c[0] + O.facing * 16, y: c[1] - 60 * O.s, vx: O.facing * rand(0.5, 2), vy: -rand(0.2, 1), life: 26, size: rand(5, 9), grow: 0.3, color: 'rgba(160,150,180,0.45)', add: false });
  Sound.play('cough'); F.hzStats.cough++; F.hzEx = 'amused'; F.hzExT = 40;
}
HAZE.drawExtra = (g, F) => {
  // SECONDHAND: the ember glows brighter while he waits for the hit (a readable counter tell)
  if (F.state === 'attack' && F.moveKey === 'sp2d' && F.counterActive && !F.hidden) {
    const m = hzMouth(F), k = 0.6 + 0.4 * Math.sin(F.T * 0.5);
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,140,60,${0.35 * k})`; g.beginPath(); g.arc(m[0] + F.facing * 14, m[1] + 6, 14, 0, TAU); g.fill(); g.restore();
  }
  // HEAVY HIT: the bowl flares, bubbles rise — a big tell before the blast
  if (F.state === 'attack' && (F.moveKey === 'sp2' || F.moveKey === 'sp2hb') && F.mf < (F.move.st)) {
    const h = F.handW('f'), k = F.mf / F.move.st;
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(150,90,230,${0.15 + 0.35 * k})`; g.beginPath(); g.ellipse(h[0], h[1] - 6, 26 + k * 20, 30 + k * 26, 0, 0, TAU); g.fill(); g.restore();
  }
};
HAZE.introFx = F => { FX.wtext(F.x, F.y - 250, '*click* … fsss', { size: 18, color: '#c8c4d8', stroke: HZD, life: 60, vy: -0.3 }); Sound.play('flick'); };

// ---------------------------------- smoke zones ----------------------------------
EXTRA_PROJ.hzSmoke = {
  rect(p) { return { x: p.x - p.zw, y: GROUND - p.zh, w: p.zw * 2, h: p.zh }; },
  update(p) {
    p.life++;   // the life counter is driven below (so the Proj base never kills it early)
    p.age = (p.age || 0) + 1;
    const C = HZ_CFG[p.sub] || HZ_CFG.trail;
    if (p.sub === 'cloud') { const k = Math.min(1, p.age / C.grow); p.zw = lerp(C.w0, C.w, 1 - (1 - k) * (1 - k)); p.x = clamp(p.x + p.dir * C.drift * (1 - k * 0.6), 60, STAGE_W - 60); }
    const left = p.ttl - p.age, fadeIn = p.sub === 'trail' ? 4 : 14, fadeOut = p.sub === 'trail' ? 26 : 50;
    p.dens = Math.min(1, p.age / fadeIn, Math.max(0, left) / fadeOut);
    if (p.dying) p.dens = Math.min(p.dens, Math.max(0, 1 - (p.age - p.dying) / 14));
    if (left <= 0 || (p.dying && p.age - p.dying > 14)) p.dead = true;
    if (p.sub === 'hotbox' && p.age % 3 === 0 && p.dens > 0.3) {   // smoke curling up the walls
      const sd = p.age % 6 ? -1 : 1;
      FX.p({ type: 'smoke', x: p.x + sd * p.zw * rand(0.82, 1), y: GROUND - rand(0, 30), vx: -sd * rand(0, 0.4), vy: -rand(1.2, 2.4), life: 50, size: rand(8, 14), grow: 0.25, drag: 0.99, color: p.age % 9 ? 'rgba(90,76,120,0.38)' : 'rgba(80,140,110,0.34)', add: false });
    }
  },
  draw(g, p) {
    const d = p.dens * (BT && BT.cine && BT.cine.A !== p.owner ? 0.3 : 1); if (d <= 0.01) return;
    const t = p.age, x = p.x, top = GROUND - p.zh, n = p.seed || 0;
    if (p.sub === 'cloud') {
      for (let i = 0; i < 18; i++) {
        const ph = i * 2.39 + n, ox = Math.sin(ph * 1.7 + t * 0.012) * p.zw * 0.72, oy = Math.cos(ph + t * 0.016) * p.zh * 0.3;
        const r = p.zw * (0.38 + 0.16 * Math.sin(ph * 3.1 + t * 0.02)), y = GROUND - p.zh * 0.5 + oy + (i % 3) * 18;
        hzBlob(g, x + ox, y, r, HZ_SMK[i % 4], d * 0.42);
      }
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) { const ph = i * 1.9 + n; hzBlob(g, x + Math.sin(ph + t * 0.02) * p.zw * 0.6, GROUND - p.zh * (0.3 + 0.12 * i), p.zw * 0.25, i % 2 ? 'rgba(79,240,224,0.5)' : 'rgba(111,207,143,0.5)', d * 0.12); }
    } else if (p.sub === 'hotbox') {
      // light haze inside, dense rolling walls on both sides and a ceiling — the zone is always clearly marked
      g.globalAlpha = d * 0.24; const gr = g.createLinearGradient(0, top, 0, GROUND); gr.addColorStop(0, 'rgba(60,50,80,1)'); gr.addColorStop(1, 'rgba(50,70,62,0.6)');
      g.fillStyle = gr; g.fillRect(x - p.zw, top, p.zw * 2, p.zh);
      for (let s = -1; s <= 1; s += 2) for (let i = 0; i < 7; i++) {
        const y = GROUND - (i + 0.5) * p.zh / 7 + Math.sin(t * 0.05 + i) * 6, wob = Math.sin(t * 0.04 + i * 1.3 + s) * 10;
        hzBlob(g, x + s * (p.zw - 10) + wob, y, 46 + (i % 2) * 10, HZ_SMK[(i + (s > 0 ? 1 : 0)) % 4], d * 0.55);
      }
      for (let i = 0; i < 6; i++) hzBlob(g, x - p.zw + (i + 0.5) * p.zw / 3 + Math.sin(t * 0.03 + i) * 12, top + 14, 50, HZ_SMK[i % 4], d * 0.45);
      for (let i = 0; i < 4; i++) { const k = ((t * 1.2 + i * 60) % 240) / 240; hzBlob(g, x - p.zw + k * p.zw * 2, GROUND - p.zh * (0.25 + 0.15 * i), 34, HZ_SMK[i % 4], d * 0.22 * Math.sin(k * Math.PI)); }   // wisps drifting through
      g.globalAlpha = 1; g.globalCompositeOperation = 'lighter';
      const pul = 0.35 + 0.25 * Math.sin(t * 0.12), warn = p.ttl - p.age < 60;
      g.strokeStyle = warn && (t >> 3) % 2 ? 'rgba(255,255,255,0.6)' : `rgba(150,92,230,${pul * d})`; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x - p.zw, GROUND); g.lineTo(x - p.zw, top + 20); g.moveTo(x + p.zw, GROUND); g.lineTo(x + p.zw, top + 20); g.stroke();
      g.strokeStyle = `rgba(111,207,143,${0.5 * d})`; g.lineWidth = 2; g.beginPath(); g.moveTo(x - p.zw, GROUND - 2); g.lineTo(x + p.zw, GROUND - 2); g.stroke();
    } else {   // vape trail
      for (let i = 0; i < 3; i++) hzBlob(g, x + (i - 1) * p.zw * 0.5, GROUND - 60 - i * 34, p.zw * 0.9, i % 2 ? 'rgba(79,240,224,0.7)' : 'rgba(138,92,200,0.7)', d * 0.3);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // the topmost zone he hides in draws his eyes (and the ember) on top of the smoke so he can always be tracked
    const F = p.owner;
    if (F.hzConc === p && p.sub !== 'trail' && !F.hidden && F.state !== 'cine') {
      const r = F.ch.dims.headR, sk = F.sk, e1 = toWorld(F.x, F.y, F.facing, F.s, F.pose, sk, ...headPt(sk, 0.52 * r, 0.33 * r)), e2 = toWorld(F.x, F.y, F.facing, F.s, F.pose, sk, ...headPt(sk, 0.94 * r, 0.32 * r));
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.9 * d;
      g.fillStyle = HZ; g.beginPath(); g.ellipse(e1[0], e1[1], 4.5, 2.2, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(e2[0], e2[1], 2, 2, 0, 0, TAU); g.fill();
      if (FX.hq) { g.globalAlpha = 0.25 * d; g.beginPath(); g.arc(e1[0], e1[1], 12, 0, TAU); g.fill(); }
      if (F.hzProp === 'cig') { const h = F.handW('f'); g.globalAlpha = d; hzEmber(g, h[0] + F.facing * 8, h[1] - 8, 1.8, false); }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
  },
};
function hzSpawnZone(F, sub, x, extra = {}) {
  const C = HZ_CFG[sub];
  if (sub !== 'trail') for (const z of hzZones(F, sub)) if (!z.dying) { z.dying = z.age; }   // one of each at a time
  return BT.spawn({ owner: F, kind: 'hzSmoke', sub, x: clamp(x, 70, STAGE_W - 70), y: GROUND - C.h / 2, vx: 0, w: 1, h: 1, life: 99999, harmless: true, clash: 0,
    zw: sub === 'cloud' ? C.w0 : C.w, zh: C.h, ttl: C.life, age: 0, dens: 0, dir: F.facing, seed: (F.T % 97) * 0.37, ...extra });
}
// collapse of the Hotbox (CLEAR THE ROOM): the smoke walls slam inward and burst in the middle
EXTRA_PROJ.hzCollapse = {
  rect(p) { const z = p.zone; return { x: p.x - p.zw, y: GROUND - p.zh, w: p.zw * 2, h: p.zh }; },
  delay(p) { const k = 1 - p.delay / p.delay0; if (p.delay % 4 === 0) Sound.play('whoosh', 0.7); p.k = k; },
  update(p) { if (!p.fired) { p.fired = true; FX.shakeIt(12); Sound.play('smokeBoom'); hzPoof(p.x, GROUND - 110, true); FX.ring(p.x, GROUND - 110, HZP, 20, p.zw * 1.1, 20, 8, 0.5); FX.ring(p.x, GROUND - 110, HZG, 10, p.zw * 0.7, 16, 5, 0.5); } p.k = 1; },
  draw(g, p) {
    const k = p.k || 0, inner = p.zw * (1 - k * k);
    for (let s = -1; s <= 1; s += 2) for (let i = 0; i < 6; i++) hzBlob(g, p.x + s * inner, GROUND - (i + 0.5) * p.zh / 6, 50, HZ_SMK[i % 4], 0.65);
    g.globalAlpha = 1;
    if (p.delay <= 0) { const a = Math.max(0, p.life / p.max); hzBlob(g, p.x, GROUND - 120, 150 * (1.4 - a * 0.4), 'rgba(110,84,160,0.9)', a * 0.8); g.globalAlpha = 1; }
  },
};

// ---------------------------------- projectiles ----------------------------------
EXTRA_PROJ.hzStream = {   // NICOTINE RUSH: a narrow, dense supernatural smoke stream with an ember-green core
  update(p) {
    if (p.t % 2 === 0) FX.p({ type: 'smoke', x: p.x - p.vx * 0.6, y: p.y + Math.sin(p.t * 0.8) * 5, vx: -p.vx * 0.06, vy: -0.25, life: 24, size: rand(4, 7), grow: 0.25, drag: 0.95, color: p.t % 4 ? 'rgba(200,196,214,0.4)' : 'rgba(111,207,143,0.35)', add: false });
  },
  draw(g, p) {
    const d = Math.sign(p.vx) || 1, k = Math.min(1, p.t / 4);
    for (let i = 0; i < 7; i++) { const bx = p.x - d * i * 15 * k, by = p.y + Math.sin(p.t * 0.7 - i * 0.9) * (2 + i * 1.3); hzBlob(g, bx, by, 13 - i * 0.9, i % 2 ? 'rgba(190,186,208,0.9)' : 'rgba(150,140,180,0.9)', 0.7 - i * 0.07); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'lighter';
    g.strokeStyle = 'rgba(111,207,143,0.75)'; g.lineWidth = 2.2; g.beginPath();
    for (let i = 0; i <= 10; i++) { const bx = p.x - d * i * 10, by = p.y + Math.sin(p.t * 0.9 - i * 0.7) * 4; i ? g.lineTo(bx, by) : g.moveTo(bx, by); } g.stroke();
    g.fillStyle = '#ffd8a0'; g.beginPath(); g.arc(p.x + d * 4, p.y, 3, 0, TAU); g.fill();
  },
};
EXTRA_PROJ.hzBlast = {   // HEAVY HIT visual (the hitbox is the move): a rolling purple-green smoke explosion
  update(p) { p.x += p.dir * 1.2; },
  draw(g, p) {
    const k = 1 - p.life / p.max, a = Math.min(1, p.life / 10);
    for (let i = 0; i < 9; i++) { const ang = i * TAU / 9 + k * 0.6, rr = 30 + k * 90; hzBlob(g, p.x + Math.cos(ang) * rr * 0.9, p.y + Math.sin(ang) * rr * 0.55, 40 + k * 46, i % 2 ? 'rgba(92,62,140,0.9)' : 'rgba(60,110,84,0.9)', 0.6 * a); }
    hzBlob(g, p.x, p.y, 60 + k * 50, 'rgba(40,30,56,0.95)', 0.7 * a);
    g.globalAlpha = 1; g.globalCompositeOperation = 'lighter'; hzBlob(g, p.x, p.y, 40 + k * 30, 'rgba(180,120,255,0.9)', 0.35 * a * (1 - k));
  },
};
EXTRA_PROJ.hzDecoy = {   // a smoke silhouette left behind (vanish spots, Secondhand, the ultimate)
  update(p) { p.y -= 0.15; },
  draw(g, p) {
    const a = Math.min(1, p.life / p.max * 1.4) * (p.alpha || 0.55), F = p.owner;
    g.globalAlpha = a; drawFigure(g, F.ch, p.pose, p.x, p.fy, p.facing, { mono: '#3a3448' });
    g.globalAlpha = a * 0.5; drawFigure(g, F.ch, p.pose, p.x + Math.sin(p.t * 0.3) * 3, p.fy - 2, p.facing, { mono: '#6a5a8a', scale: 1.03 });
    g.globalAlpha = 1;
    for (let i = 0; i < 4; i++) hzBlob(g, p.x + (i - 1.5) * 16, p.fy - 40 - i * 36 - p.t * 0.6, 26, HZ_SMK[i % 4], a * 0.5);
    g.globalAlpha = 1;
  },
};
function hzDecoy(F, life = 40) { BT.spawn({ owner: F, kind: 'hzDecoy', x: F.x, y: F.y - 100, fy: F.y, vx: 0, w: 1, h: 1, life, harmless: true, clash: 0, pose: { ...F.pose }, facing: F.facing }); }
function hzWarpBehind(F, O, gap = 82) {   // reappear on the far side of O (front if the far side is a wall)
  const side = Math.sign(O.x - F.x) || F.facing;
  let x = O.x + side * gap;
  if (x < 60 || x > STAGE_W - 60) x = O.x - side * gap;
  F.x = clamp(x, 55, STAGE_W - 55); F.facing = O.x > F.x ? 1 : -1; F.y = GROUND; F.vy = 0; F.onGround = true;
}

// ---------------------------------- moves ----------------------------------
HAZE.moves = Object.assign(baseNormals({ dmg: 0.95, spd: 0, rng: 1.04 }), {
  sp1: {
    name: 'NICOTINE RUSH', jp: 'ニコチン・ラッシュ', desc: 'A quick drag and a narrow, fast stream of supernatural smoke. Low damage and short hitstun, but it comes out fast — use it to interrupt.', special: 1, lvl: 4,
    poses: ['drag', 'push'], st: 9, act: 1, rec: 15, cd: 40, sfx: 'inhale',
    poseFn(F, f) { return f <= 8 ? 'drag' : f <= 22 ? 'push' : 'stance'; },
    spawn: { f: 9, fn(F) {
      const m = hzMouth(F);
      BT.spawn({ owner: F, kind: 'hzStream', x: m[0] + F.facing * 30, y: F.y - 140 * F.s, vx: F.facing * 17, w: 74, h: 26, life: 42, hits: 1, dmg: 36, hs: 13, bs: 9, kb: 2.5, str: 1, clash: 1, color: '#c8c4d8' });
      Sound.play('exhale'); hzExhale(F, 4, null, 2);
    } },
  },
  sp1f: {
    name: 'CLOUD NINE', jp: 'クラウド・ナイン', desc: 'A long pull from his shisha, then a huge, slowly expanding cloud in front of him (5.5 s). Whoever stands inside is covered (he can hide in it — only his eyes glow); a foe who stays in it without guarding starts COUGHING. The CPU reacts slower inside. One cloud at a time.', special: 1, lvl: 4,
    poses: ['shisha_w', 'shisha'], st: 20, act: 1, rec: 16, cd: 360, sfx: 'bubble',
    poseFn(F, f) { return f <= 20 ? 'shisha_w' : f <= 40 ? 'shisha' : 'stance'; },
    tick(F, f) { if (f === 4) Sound.play('inhale'); if (f > 20 && f <= 40 && f % 2 === 0) hzExhale(F, 2, 'rgba(150,130,190,0.4)', 2.2, 10); },
    spawn: { f: 20, fn(F) { hzSpawnZone(F, 'cloud', F.x + F.facing * HZ_CFG.cloud.ahead); Sound.play('exhale'); F.hzStats.clouds++; } },
  },
  counter: {
    name: 'VAPOR DASH', jp: 'ベイパー・ダッシュ', desc: 'A burst of vapor and a fast dash, briefly invulnerable, passing through the foe and leaving a vapor trail. Default: BACKWARD (↓←); hold → in the startup to dash FORWARD. Press L / M / H during it for VAPOR KICK. If the foe stands in his smoke, it becomes a SMOKE STEP: he vanishes and steps out behind them.', special: 1, lvl: 4,
    poses: ['vape_w', 'glide'], st: 3, act: 14, rec: 12, cd: 54, sfx: 'vapeHiss', invuln: [1, 9], pass: 16, dmg: 0,
    poseFn(F, f) { return f <= 3 ? 'vape_w' : f <= 17 ? (F.hzDir > 0 ? 'glide' : 'glideBack') : 'stance'; },
    followups: [{ btn: 'light', move: 'vaporKick', any: 1, window: 4 }, { btn: 'medium', move: 'vaporKick', any: 1, window: 4 }, { btn: 'heavy', move: 'vaporKick', any: 1, window: 4 }],
    tick(F, f, O) {
      if (f === 1) {
        if (hzZoneAt(F, O) && Math.abs(O.x - F.x) < 520) { F.startMove('smokeStep', true); return; }
        F.hzDir = -1;
      }
      if (f <= 4 && F.input.fwd > 0) F.hzDir = 1;
      if (f >= 3 && f <= 17) {
        F.vx = F.hzDir * F.facing * (f < 12 ? 16 : 9); F.ctrlVel = true; F.afterimage = Math.max(F.afterimage, 4);
        if (f % 4 === 0) hzSpawnZone(F, 'trail', F.x);
        if (f === 3) { hzExhale(F, 6, 'rgba(79,240,224,0.4)', -1.5, 9); FX.ring(F.x, F.y - 100, HZ, 8, 70, 12, 3, 0.4); }
      }
    },
  },
  smokeStep: {
    name: 'SMOKE STEP', jp: '煙歩', desc: 'Vapor Dash while the foe stands in his smoke: he vanishes into it and steps out right behind them (L / M / H = Vapor Kick).', special: 1, lvl: 4,
    poses: ['vape_w', 'stance'], st: 12, act: 4, rec: 12, dmg: 0, invuln: [0, 13],
    followups: [{ btn: 'light', move: 'vaporKick', any: 1, window: 10 }, { btn: 'medium', move: 'vaporKick', any: 1, window: 10 }, { btn: 'heavy', move: 'vaporKick', any: 1, window: 10 }],
    poseFn(F, f) { return f <= 12 ? 'vape_w' : 'stance'; },
    tick(F, f, O) {
      if (f === 1) { hzDecoy(F, 36); hzPoof(F.x, F.y - 100); F.hidden = true; Sound.play('poof'); F.hzStats.step++; }
      if (f >= 1 && f < 12) { F.vx = 0; F.ctrlVel = true; }
      if (f === 12) { F.hidden = false; hzWarpBehind(F, O, 78); hzPoof(F.x, F.y - 100); F.afterimage = 8; F.hzEx = 'amused'; F.hzExT = 30; Sound.play('vapeHiss'); }
    },
  },
  vaporKick: {
    name: 'VAPOR KICK', jp: '蒸気蹴り', desc: 'Follow-up of Vapor Dash / Smoke Step: a spinning kick out of the vapor.', special: 1, lvl: 4.5, sc: 1,
    poses: ['vkick_w', 'vkick'], st: 5, act: 4, rec: 15, dmg: 54, hs: 22, bs: 12, kb: 6, hb: { x: 0, y: -150, w: 104, h: 70 }, str: 2, sfx: 'whoosh',
    tick(F, f) { if (f <= 5) { F.vx = F.facing * 5; F.ctrlVel = true; } if (f === 6) hzExhale(F, 3, 'rgba(79,240,224,0.35)', 1.6, 8); },
  },
  sp2: {
    name: 'HEAVY HIT', jp: 'ヘビー・ヒット', desc: 'He pulls hard on a glass bong (long, clearly visible startup — the bowl flares and the water bubbles), then blows a massive purple-green smoke burst: high damage, huge knockback, wall splat. Wide open if it misses. Inside his Hotbox the pull is much faster.', special: 1, lvl: 4,
    poses: ['bong_w', 'bong'], st: 28, act: 6, rec: 28, cd: 150, sfx: 'bubble',
    dmg: 116, hs: 30, bs: 18, kb: 16, kd: 1, ws: 1, str: 4, shake: 14, impact: 2, hb: { x: 0, y: -210, w: 172, h: 200 },
    poseFn(F, f) { return f <= 8 ? 'bong_w' : f <= 28 ? 'bong_pull' : f <= 44 ? 'bong' : 'stance'; },
    onStart(F) { if (F.hzConc && F.hzConc.sub === 'hotbox') F.startMove('sp2hb', true); },
    tick(F, f) { hzBongTick(F, f, 28); },
  },
  sp2hb: {
    name: 'HEAVY HIT (HOTBOX)', jp: 'ヘビー・ヒット', desc: 'Heavy Hit inside his Hotbox: a much faster pull.', special: 1, lvl: 4,
    poses: ['bong_w', 'bong'], st: 18, act: 6, rec: 26, sfx: 'bubble',
    dmg: 116, hs: 30, bs: 18, kb: 16, kd: 1, ws: 1, str: 4, shake: 14, impact: 2, hb: { x: 0, y: -210, w: 172, h: 200 },
    poseFn(F, f) { return f <= 6 ? 'bong_w' : f <= 18 ? 'bong_pull' : f <= 34 ? 'bong' : 'stance'; },
    tick(F, f) { hzBongTick(F, f, 18); },
  },
  sp2f: {
    name: 'HOTBOX', jp: 'ホットボックス', desc: 'Cigarette in the mouth, vape in hand, shisha smoke from his sleeves: he walls off a section of the arena with thick smoke for 6 s. Inside, the foe is slowed (and coughs if he stands still without guarding); HAZE walks faster, Vapor Dash becomes Smoke Step and Heavy Hit charges faster. Press ↓→SP2 again to CLEAR THE ROOM: the walls collapse inward (launches anyone inside). Cooldown starts when the Hotbox ends.', special: 1, lvl: 4,
    poses: ['hotbox_w', 'hotbox'], st: 16, act: 1, rec: 18, cd: 0, sfx: 'inhale',
    poseFn(F, f) { return f <= 16 ? 'hotbox_w' : f <= 34 ? 'hotbox' : 'stance'; },
    onStart(F) { if (hzZones(F, 'hotbox').some(z => !z.dying)) F.startMove('hzClear', true); },
    tick(F, f) {
      if (f > 16 && f <= 32 && f % 2 === 0) { const a = (f - 16) * 0.4; FX.p({ type: 'smoke', x: F.x + Math.cos(a) * 60, y: F.y - 110 + Math.sin(a) * 50, vx: Math.cos(a) * 3, vy: Math.sin(a) * 1.5, life: 30, size: 14, grow: 0.4, color: 'rgba(100,80,140,0.45)', add: false }); }
    },
    spawn: { f: 16, fn(F) { hzSpawnZone(F, 'hotbox', F.x + F.facing * HZ_CFG.hotbox.ahead); Sound.play('exhale'); Sound.play('smokeBoom', 0.5); F.hzStats.hotbox++; FX.wtext(F.x, F.y - 250, 'HOTBOX', { size: 28, color: '#d8c8ff', stroke: HZD, life: 40 }); } },
  },
  hzClear: {
    name: 'CLEAR THE ROOM', jp: '換気', desc: 'Hotbox follow-up (↓→SP2 while it stands): a snap, and the smoke walls collapse inward — a launching hit on anyone inside. Ends the Hotbox.', special: 1, lvl: 4,
    poses: ['snap', 'snap'], st: 10, act: 1, rec: 20, sfx: 'snap',
    spawn: { f: 6, fn(F) {
      const z = hzZones(F, 'hotbox').find(q => !q.dying); if (!z) return;
      const C = HZ_CFG.collapse;
      BT.spawn({ owner: F, kind: 'hzCollapse', x: z.x, y: GROUND - z.zh / 2, vx: 0, w: 1, h: 1, zw: z.zw, zh: z.zh, delay: C.delay, delay0: C.delay, life: 12, hits: 1, persist: true,
        dmg: C.dmg, hs: 30, bs: 14, kb: 3, launch: -11, str: 3, clash: 0, color: HZP, srcKey: 'hzClear' });
      z.dying = z.age + C.delay; Sound.play('snap');
    } },
  },
  sp2d: {
    name: 'SECONDHAND', jp: 'セカンドハンド', desc: 'He takes a drag and waits, ember glowing (counter window f9–34). If they attack him in it, he bursts into smoke, leaves a smoke decoy and steps out BEHIND them with a fast two-hit punish that launches. Projectiles from far away just get swallowed by the smoke. Throws, grabs, unblockables and ultimates beat it; if nothing comes, he is wide open.', special: 1, lvl: 4,
    counter: 1, counterNoGrab: 1, poses: ['drag', 'wait'], st: 8, act: 26, rec: 26, cd: 210, sfx: 'inhale',
    poseFn(F, f) { return f <= 8 ? 'drag' : f <= 34 ? 'wait' : f <= 46 ? 'exhale' : 'stance'; },
    tick(F, f) { if (f === 36) hzExhale(F, 5, null, 0.6, 7); },
    onCounter(F, A, proj) {
      F.hzStats.counter++; F.hzEx = 'amused'; F.hzExT = 40;
      if (proj && Math.abs(A.x - F.x) > 260) { hzPoof(F.x, F.y - 110); Sound.play('poof'); return; }   // far projectile: swallowed by the smoke
      F.startMove('secondhand', true);
    },
  },
  secondhand: {
    name: 'SECONDHAND SMOKE', jp: '副流煙', desc: 'Counter attack of Secondhand: vanish, step out behind them, two fast hits (the second launches).', lvl: 5, sc: 1,
    poses: ['elbow_w', 'elbow'], st: 12, act: 8, rec: 18, dmg: 34, hits: 2, interval: 4, hs: 24, bs: 10, kb: 1, hb: { x: -10, y: -180, w: 130, h: 130 }, invuln: [0, 14], str: 3, sfx: 'whoosh',
    final: { launch: -11, dmg: 46, hs: 30, kb: 4 },
    poseFn(F, f) { return f <= 10 ? 'wait' : f <= 15 ? 'elbow_w' : f <= 26 ? (f <= 17 ? 'elbow' : 'palm') : 'stance'; },
    tick(F, f, O) {
      if (f === 1) { hzDecoy(F, 44); hzPoof(F.x, F.y - 110, true); F.hidden = true; Sound.play('poof'); }
      if (f < 10) { F.vx = 0; F.ctrlVel = true; }
      if (f === 10) { F.hidden = false; hzWarpBehind(F, O, 76); hzPoof(F.x, F.y - 110); F.afterimage = 10; }
      if (f === 18) { hzExhale(F, 6, 'rgba(200,196,214,0.5)', 2.4, 10); }
    },
  },
  ult: {
    name: 'ZERO VISIBILITY', jp: '視界ゼロ', desc: 'Ultimate. He stands completely still, takes the deepest drag of his life and exhales — the whole arena vanishes in fog. Glowing eyes, attacks from every direction, shadow silhouettes, then one last calm exhale straight into their face launches them across the arena.', ult: 1, lvl: 6, cost: 100,
    poses: ['drag', 'push'], st: 12, act: 10, rec: 34, dmg: 20, hs: 40, bs: 20, kb: 1, hb: { x: 0, y: -220, w: 200, h: 220 }, invuln: [0, 16], str: 3, sfx: 'inhale',
    poseFn(F, f) { return f <= 12 ? 'drag' : f <= 30 ? 'push' : 'stance'; },
    tick(F, f) { if (f === 12) { hzExhale(F, 12, 'rgba(150,130,190,0.5)', 3, 14); Sound.play('exhale'); } },
    onHit(F, D) { BT.startCine(F, D, CINE.haze, { zoom: 1.5 }); return true; },
  },
});
function hzBongTick(F, f, st) {
  const h = F.handW('f');
  if (f === 2) Sound.play('flick');
  if (f > 4 && f < st && f % 3 === 0) { Sound.play('bubble'); FX.p({ type: 'smoke', x: h[0] + F.facing * 6, y: h[1] - 4 - rand(0, 26), vx: 0, vy: -0.6, life: 14, size: 2.5, color: 'rgba(200,170,255,0.6)', add: true }); }
  if (f === st) {
    Sound.play('smokeBoom');
    BT.spawn({ owner: F, kind: 'hzBlast', x: F.x + F.facing * 100, y: F.y - 110, dir: F.facing, vx: 0, w: 1, h: 1, life: 40, harmless: true, clash: 0 });
    hzExhale(F, 10, 'rgba(110,80,160,0.55)', 4, 16); FX.ring(F.x + F.facing * 90, F.y - 110, HZP, 20, 160, 18, 7, 0.6);
  }
}
(() => {
  const M = HAZE.moves;
  Object.assign(M.L, { name: 'Ash Flick', poses: ['flick_w', 'flick'], sw: { cx: 0, cy: -150, r: 70, a0: -0.6, a1: 0.2, color: '#c8c4d8' } });
  Object.assign(M.M, { name: 'Lazy Kick' });
  Object.assign(M.H, { name: 'Burn Out', poses: ['flick_w', 'push'], hb: { x: 15, y: -182, w: 94, h: 60 }, sw: { cx: -10, cy: -140, r: 82, a0: -1.4, a1: 0.4, color: HZ } });
  Object.assign(M.cL, { name: 'Low Ash' });
  Object.assign(M.cM, { name: 'Ankle Burn' });
  Object.assign(M.cH, { name: 'Smoke Sweep' });
  Object.assign(M.jH, { name: 'Falling Ash', poses: ['dive', 'flick'] });
  Object.assign(M.LH, { name: 'Updraft' });
  Object.assign(M.FF, { name: 'Rolling Fog', poses: ['glide', 'push'] });
})();
// CPU hints
HAZE.moves.sp1.__ai = { reach: 620, kind: 'proj', anti: false, st: 9, low: false, over: false };
HAZE.moves.sp1f.__ai = { reach: 420, kind: 'buff', anti: false, st: 20, low: false, over: false };
HAZE.moves.counter.__ai = { reach: 260, kind: 'buff', anti: false, st: 3, low: false, over: false };
HAZE.moves.sp2.__ai = { reach: 175, kind: 'melee', anti: false, st: 28, low: false, over: false };
HAZE.moves.sp2f.__ai = { reach: 320, kind: 'buff', anti: false, st: 16, low: false, over: false };
HAZE.moves.sp1f.cpuOk = F => !hzZones(F, 'cloud').some(z => !z.dying);
HAZE.moves.sp2f.cpuOk = F => { const z = hzZones(F, 'hotbox').find(q => !q.dying); return z ? !!hzZoneAt(F, F.opp, 'hotbox') : true; };
HAZE.moves.counter.cpuOk = F => !!hzZoneAt(F, F.opp);   // the bot only uses it as Smoke Step
HAZE.combos = [
  { name: 'Nicotine Rush', notation: 'L → M → SP1 (Nicotine Rush)', seq: ['L', 'M', 'sp1'] },
  { name: 'Heavy Hit', notation: 'L → M → H → SP2 (Heavy Hit)', seq: ['L', 'M', 'H', 'sp2'] },
  { name: 'Burn Out', notation: 'L → L → M → H → SP1', seq: ['L', 'L', 'M', 'H', 'sp1'] },
  { name: 'Zero Visibility', notation: 'L → M → SP1+SP2 (Ultimate)', seq: ['L', 'M', 'ult'], meter: 1 },
];
HAZE.applyTrial = (A, tr) => { if (tr && tr.meter) A.meter = 100; };

// ---------------------------------- HUD + how-to ----------------------------------
HAZE.drawHand = (g, F, side, t) => {
  const cl = hzZones(F, 'cloud').find(z => !z.dying), hb = hzZones(F, 'hotbox').find(z => !z.dying);
  const kc = cl ? Math.max(0, 1 - cl.age / cl.ttl) : 0, kh = hb ? Math.max(0, 1 - hb.age / hb.ttl) : 0;
  const conc = !!F.hzConc && F.hzConc.sub !== 'trail';
  xpPanel(g, F, side, t, {
    col: conc ? HZ : '#b8a8d8', col2: '#ffffff', icon: '', flash: conc,
    title: conc ? 'SMOKE · CONCEALED' : hb ? 'SMOKE · HOTBOX' : cl ? 'SMOKE · CLOUD NINE' : 'SMOKE · CLEAR',
    sub: hb ? `煙 · HOTBOX ${(hb.ttl - hb.age) / 60 > 0 ? ((hb.ttl - hb.age) / 60).toFixed(1) : 0}s · ↓→S2 = CLEAR THE ROOM` : cl ? `煙 · CLOUD ${((cl.ttl - cl.age) / 60).toFixed(1)}s · hide in it, make them cough` : '煙 · ↓→S1 cloud · ↓→S2 hotbox',
    k: Math.max(kc, kh), label: hb ? 'HOTBOX' : cl ? 'CLOUD' : '—',
    badges: [['sp1', 'S1|RUSH'], ['sp1f', '↓→S1|CLOUD 9'], ['counter', '↓←S1|VAPOR'], ['sp2', 'S2|HEAVY HIT'], ['sp2f', hb ? '↓→S2|CLEAR!' : '↓→S2|HOTBOX'], ['sp2d', '↓↓S2|2ND HAND']],
  });
  const pw = 330, x0 = side > 0 ? 40 : W - 40 - pw, ix = side > 0 ? x0 + 33 : x0 + pw - 33, iy = 560 + 32;
  g.save(); hzCig(g, ix - 9, iy + 3, -0.35, 18, { mono: null }, conc); g.restore();
  for (let i = 0; i < 3; i++) { g.save(); hzBlob(g, ix + 8 + Math.sin(t * 0.05 + i) * 3, iy - 6 - i * 6 - ((t * 0.4 + i * 7) % 8), 6 + i * 2, 'rgba(200,196,214,0.9)', 0.5 - i * 0.12); g.restore(); }
};
HAZE.howTo = {
  title: 'HAZE',
  draw(g) {
    xpHowTo(g, 'HAZE — THE SMOKE DEALER', HZ, [
      ['SMOKE', 'His smoke covers whoever stands in it. Inside it HE is concealed (only his eyes glow) and the CPU reacts slower. Foes who stand still in it without guarding COUGH (short stagger).'],
      ['SP1', 'Nicotine Rush (cigarette) — fast, narrow smoke stream. Low damage, great interrupt.'],
      ['↓→ SP1', 'Cloud Nine (shisha) — a big expanding cloud for 5.5 s. Hide in it, set up mix-ups.'],
      ['↓← SP1', 'Vapor Dash (vape) — evasive dash (back; hold → for forward). L/M/H = Vapor Kick. Foe in smoke = SMOKE STEP behind them.'],
      ['SP2', 'Heavy Hit (bong) — slow, huge knockback. Faster inside his Hotbox.'],
      ['↓→ SP2', 'Hotbox — walls of smoke for 6 s: they are slowed, he is faster. Again = CLEAR THE ROOM (collapse, launches).'],
      ['↓↓ SP2', 'Secondhand (cigarette) — counter: vanish, step out behind them, two hits. Open if it whiffs.'],
    ], 'Set the smoke, hide, make them guess. Ultimate (SP1+SP2): ZERO VISIBILITY — the whole arena disappears.');
  },
};

CHARS.push(HAZE);
finalizeMoves(HAZE);
