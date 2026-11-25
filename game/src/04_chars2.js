// ===================== NEW CHARACTERS: FROGS & CONDUCTOR =====================
// Projectile kinds registered here are updated/drawn by Proj via EXTRA_PROJ.
const EXTRA_PROJ = {};

function ell(g, x, y, rx, ry, col, R, rot = 0) {
  g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU);
  if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = R.ol * 2; g.stroke(); }
  g.fillStyle = R.mono || col; g.fill();
}

// ============================ THE FROG TRINITY ============================
// Three frogs rendered from one pose: g* = Gamaoh (big), p* = Pipi (small), k* = Kero-Sensei (medium).
const FROG = {
  big: {
    w: 92, h: 100, col: '#4f7a2e', dark: '#355a1c', belly: '#d8d09a', iris: '#c8501a', eye: 'angry', mouth: 'teeth', arm: 0.1, fist: 0.15, rest: [0.5, -0.62],
    accBody(g, w, h, R, T, f) {
      if (R.mono) return;
      const inf = clamp(f.inflate || 0, 0, 1.6);
      g.save(); g.beginPath(); g.ellipse(0, -0.42 * h, 0.46 * w * (1 + inf * 0.35), 0.4 * h * (1 + inf * 0.2), 0, 0, TAU); g.clip();
      g.fillStyle = '#e8dcc0'; g.fillRect(-w, -0.33 * h, 2 * w, 0.12 * h);
      g.strokeStyle = 'rgba(120,100,70,0.6)'; g.lineWidth = 1.5; for (let x = -0.4; x < 0.5; x += 0.1) { g.beginPath(); g.moveTo(x * w, -0.33 * h); g.lineTo(x * w + 5, -0.21 * h); g.stroke(); }
      g.strokeStyle = OUTLINE; g.lineWidth = 2; g.strokeRect(-w, -0.33 * h, 2 * w, 0.12 * h);
      g.restore();
      poly(g, [[0.2 * w, -0.22 * h], [0.32 * w, -0.22 * h], [0.3 * w, -0.08 * h], [0.22 * w, -0.08 * h]], '#e8dcc0', R, 3);
    },
    accHead(g, w, h, R, T, f, expr) {
      ell(g, 0.05 * w, -1.08 * h, 0.08 * w, 0.06 * h, '#26401a', R);
      if (R.mono) return;
      g.strokeStyle = '#e8dcc0'; g.lineWidth = 2; g.beginPath(); g.moveTo(-0.02 * w, -1.04 * h); g.lineTo(0.12 * w, -1.04 * h); g.stroke();
      g.strokeStyle = '#a33'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(0.2 * w, -1.12 * h); g.lineTo(0.4 * w, -0.9 * h); g.stroke();
    },
  },
  small: {
    w: 40, h: 42, col: '#8fe04a', dark: '#5fb02a', belly: '#f4f8b8', iris: '#e0263a', eye: 'sparkle', mouth: 'open', arm: 0.1, fist: 0.09,
    accHead(g, w, h, R, T) {
      if (R.mono) return;
      const fl = Math.sin(T * 0.4) * 3;
      poly(g, [[-0.35 * w, -0.66 * h], [-0.95 * w, -0.7 * h + fl], [-0.85 * w, -0.5 * h + fl], [-0.3 * w, -0.56 * h]], '#e0263a', R, 3);
      limb(g, [-0.38 * w, -0.62 * h], [0.42 * w, -0.6 * h], 0.07 * h, 0.07 * h, '#e0263a', R);
    },
  },
  mid: {
    w: 64, h: 72, col: '#3aa79a', dark: '#24786e', belly: '#c6ecd8', iris: '#1a6a9a', eye: 'glasses', mouth: 'smirk', arm: 0.1, fist: 0.09,
    accHead(g, w, h, R, T) {
      if (R.mono) { poly(g, [[-0.25 * w, -1.18 * h], [0.15 * w, -1.28 * h], [0.5 * w, -1.18 * h], [0.1 * w, -1.08 * h]], null, R); return; }
      g.strokeStyle = '#2a2a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-0.02 * w, -1.0 * h); g.lineTo(0.16 * w, -1.0 * h); g.stroke();
      poly(g, [[-0.25 * w, -1.18 * h], [0.15 * w, -1.28 * h], [0.5 * w, -1.18 * h], [0.1 * w, -1.08 * h]], '#1d1d26', R, 3);
      circ(g, 0.12 * w, -1.18 * h, 2.5, '#f0c040', R);
      const tw = Math.sin(T * 0.08) * 3;
      g.strokeStyle = '#f0c040'; g.lineWidth = 2; g.beginPath(); g.moveTo(0.12 * w, -1.18 * h); g.quadraticCurveTo(-0.2 * w, -1.15 * h, -0.28 * w + tw, -0.98 * h); g.stroke();
      g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.moveTo(0.52 * w, -0.78 * h); g.quadraticCurveTo(0.62 * w, -0.68 * h, 0.72 * w, -0.74 * h); g.moveTo(0.52 * w, -0.78 * h); g.quadraticCurveTo(0.44 * w, -0.66 * h, 0.34 * w, -0.72 * h); g.stroke();
    },
  },
};
// chibi glossy iris: coloured gradient, dark pupil, two white highlights
function frogIris(g, x, y, w, h, col, pc, glow) {
  const gr = g.createLinearGradient(0, y - h, 0, y + h); gr.addColorStop(0, '#10101c'); gr.addColorStop(0.5, glow ? pc : (col || '#3a2a18')); gr.addColorStop(1, '#ffffff');
  g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, TAU); g.fill(); g.shadowBlur = 0;
  g.fillStyle = 'rgba(10,6,20,0.85)'; g.beginPath(); g.ellipse(x + w * 0.08, y, w * 0.45, h * 0.48, 0, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x - w * 0.32, y - h * 0.4, w * 0.34, h * 0.26, -0.3, 0, TAU); g.fill();
  g.beginPath(); g.arc(x + w * 0.4, y + h * 0.46, w * 0.16, 0, TAU); g.fill();
}
function frogEye(g, ex, ey, er, sp, o, T, glowCol) {
  const expr = o.expr || 'normal';
  g.lineCap = 'round';
  if (expr === 'hurt' || expr === 'ko') {
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, er * 0.78, 0, TAU); g.fill();
    g.strokeStyle = OUTLINE; g.lineWidth = 2.4; g.beginPath();
    if (expr === 'hurt') { g.moveTo(ex - er * 0.45, ey - er * 0.4); g.lineTo(ex + er * 0.3, ey); g.lineTo(ex - er * 0.45, ey + er * 0.4); }
    else { g.moveTo(ex - er * 0.4, ey - er * 0.4); g.lineTo(ex + er * 0.4, ey + er * 0.4); g.moveTo(ex + er * 0.4, ey - er * 0.4); g.lineTo(ex - er * 0.4, ey + er * 0.4); }
    g.stroke(); return;
  }
  g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, er * 0.8, 0, TAU); g.fill();
  const blink = (T + Math.floor(ex * 7)) % 190 < 6;
  if (blink || expr === 'closed') { g.strokeStyle = OUTLINE; g.lineWidth = 2.2; g.beginPath(); g.moveTo(ex - er * 0.6, ey + 1); g.quadraticCurveTo(ex, ey + er * 0.4, ex + er * 0.6, ey + 1); g.stroke(); return; }
  const pc = o.glow ? glowCol : OUTLINE;
  if (o.glow) { g.shadowColor = glowCol; g.shadowBlur = 10; }
  if (sp.eye === 'sparkle') {
    frogIris(g, ex + er * 0.12, ey + er * 0.04, er * 0.56, er * 0.64, sp.iris, pc, o.glow); g.shadowBlur = 0;
  } else if (sp.eye === 'angry') {
    frogIris(g, ex + er * 0.22, ey + er * 0.14, er * 0.4, er * 0.48, sp.iris, pc, o.glow); g.shadowBlur = 0;
    g.fillStyle = sp.col; g.beginPath(); g.moveTo(ex - er, ey - er * 1.1); g.lineTo(ex + er * 1.1, ey - er * 1.1); g.lineTo(ex + er * 1.1, ey - er * 0.05); g.lineTo(ex - er, ey - er * 0.55); g.closePath(); g.fill();
    g.strokeStyle = OUTLINE; g.lineWidth = 2.6; g.beginPath(); g.moveTo(ex - er * 0.85, ey - er * 0.55); g.lineTo(ex + er * 0.95, ey - er * 0.05); g.stroke();
  } else {
    frogIris(g, ex + er * 0.18, ey + er * 0.08, er * 0.38, er * 0.46, sp.iris, pc, o.glow); g.shadowBlur = 0;
    g.strokeStyle = '#2a2a2a'; g.lineWidth = 2.4; g.beginPath(); g.arc(ex, ey, er * 0.98, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(ex - er * 0.55, ey - er * 0.2); g.lineTo(ex - er * 0.15, ey - er * 0.6); g.stroke();
  }
}
function drawFrog(g, sp, f, R, o) {
  const w = sp.w, h = sp.h, T = o.T || 0, expr = o.expr || 'normal';
  g.save(); g.translate(f.x, f.y); g.rotate(f.rot || 0);
  const sq = clamp(f.sq || 0, -0.5, 0.6); g.scale(1 + sq * 0.25, 1 - sq * 0.4);
  const inf = clamp(f.inflate || 0, 0, 1.6), kick = f.kick || 0, punch = clamp(f.punch || 0, -1, 1.2), guard = f.guard || 0;
  if (kick > 0.3) {
    limb(g, [-0.1 * w, -0.3 * h], [(0.75 * kick + 0.1) * w, -0.34 * h], 0.16 * w, 0.1 * w, sp.dark, R);
    ell(g, (0.8 * kick + 0.14) * w, -0.34 * h, 0.15 * w, 0.07 * w, sp.dark, R);
  } else {
    ell(g, -0.24 * w, -0.05 * h, 0.3 * w, 0.07 * h, sp.dark, R);
    ell(g, -0.22 * w, -0.25 * h, 0.3 * w, 0.22 * h, sp.dark, R, -0.3);
  }
  ell(g, 0, -0.42 * h, 0.46 * w * (1 + inf * 0.35), 0.4 * h * (1 + inf * 0.2), sp.col, R);
  if (!R.mono) { g.fillStyle = sp.dark; for (const [sx, sy, sr] of [[-0.26, -0.52, 0.07], [-0.08, -0.64, 0.05], [-0.32, -0.33, 0.05]]) { g.beginPath(); g.arc(sx * w, sy * h, sr * w, 0, TAU); g.fill(); } }
  ell(g, 0.16 * w, -0.36 * h, 0.27 * w * (1 + inf * 0.7), 0.28 * h * (1 + inf * 0.35), sp.belly, R);
  if (inf > 0.3 && !R.mono) { g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; g.beginPath(); g.arc(0.25 * w, -0.45 * h, 0.15 * w, -2.2, -1.2); g.stroke(); }
  ell(g, 0.3 * w, -0.04 * h, 0.2 * w, 0.06 * h, sp.dark, R);
  if (sp.accBody) sp.accBody(g, w, h, R, T, f);
  ell(g, 0.08 * w, -0.8 * h, 0.47 * w, 0.25 * h, sp.col, R);
  if (!R.mono) { g.fillStyle = sp.belly; g.beginPath(); g.ellipse(0.22 * w, -0.7 * h, 0.28 * w, 0.1 * h, 0, 0, Math.PI); g.fill(); }
  const er = (sp.eye === 'sparkle' ? 0.25 : 0.19) * w, eyes = [[-0.1 * w, -1.0 * h], [0.3 * w, -1.0 * h]];
  for (const [ex, ey] of eyes) ell(g, ex, ey, er, er, sp.col, R);
  if (!R.mono) {
    for (const [ex, ey] of eyes) frogEye(g, ex, ey, er, sp, o, T, o.glowCol || '#7dff5a');
    g.fillStyle = 'rgba(255,110,150,0.35)'; g.beginPath(); g.ellipse(0.46 * w, -0.84 * h, 0.09 * w, 0.035 * h, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(-0.16 * w, -0.86 * h, 0.06 * w, 0.03 * h, 0, 0, TAU); g.fill();
    // mouth
    const shout = expr === 'shout' || expr === 'hurt' || (f.tongue || 0) > 4;
    g.strokeStyle = OUTLINE; g.lineWidth = 2.2; g.lineCap = 'round';
    if (shout) { g.fillStyle = '#5a0f1c'; g.beginPath(); g.ellipse(0.4 * w, -0.72 * h, 0.14 * w, 0.07 * h, 0, 0, TAU); g.fill(); g.stroke(); }
    else if (sp.mouth === 'teeth') {
      g.beginPath(); g.moveTo(-0.15 * w, -0.76 * h); g.quadraticCurveTo(0.2 * w, -0.66 * h, 0.54 * w, -0.78 * h); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0.2 * w, -0.72 * h); g.lineTo(0.48 * w, -0.77 * h); g.lineTo(0.44 * w, -0.71 * h); g.lineTo(0.22 * w, -0.68 * h); g.closePath(); g.fill(); g.lineWidth = 1.4; g.stroke();
    } else if (sp.mouth === 'open') {
      g.fillStyle = '#5a0f1c'; g.beginPath(); g.moveTo(0.05 * w, -0.76 * h); g.quadraticCurveTo(0.3 * w, -0.56 * h, 0.55 * w, -0.78 * h); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#ff7f9a'; g.beginPath(); g.ellipse(0.32 * w, -0.68 * h, 0.08 * w, 0.04 * h, 0, 0, TAU); g.fill();
    } else { g.beginPath(); g.moveTo(-0.1 * w, -0.76 * h); g.quadraticCurveTo(0.25 * w, -0.72 * h, 0.5 * w, -0.8 * h); g.lineTo(0.56 * w, -0.86 * h); g.stroke(); }
  }
  // arm
  const sh = [0.18 * w, -0.55 * h];
  let hand;
  if (guard > 0.3) hand = [0.44 * w, -0.88 * h];
  else if (guard < -0.3) hand = [0.62 * w, -1.28 * h];
  else { const p2 = clamp(punch, 0, 1.2), rx = sp.rest ? sp.rest[0] : 0.38, ry = sp.rest ? sp.rest[1] : -0.3; hand = [lerp(rx * w, 1.15 * w, p2), lerp(ry * h, -0.56 * h, Math.min(1, p2))]; if (punch < 0) hand = [0.05 * w, -0.45 * h]; }
  const elbow = [lerp(sh[0], hand[0], 0.5) - 0.06 * w, lerp(sh[1], hand[1], 0.5) + 0.12 * h * (1 - clamp(punch, 0, 1))];
  limb(g, sh, elbow, sp.arm * w * 1.15, sp.arm * w, sp.col, R);
  limb(g, elbow, hand, sp.arm * w, sp.arm * 0.85 * w, sp.col, R);
  circ(g, hand[0], hand[1], sp.fist * w, sp.col, R);
  if (sp.accHead) sp.accHead(g, w, h, R, T, f, expr);
  // tongue
  const tl = f.tongue || 0;
  if (tl > 4) {
    const a = f.tongueA || 0, sx = 0.5 * w, sy = -0.73 * h, L = tl / (1 + sq * 0.25);
    const tx = sx + Math.cos(a) * L, ty = sy + Math.sin(a) * L / (1 - sq * 0.4);
    const bend = Math.sin(T * 0.6) * 5 - 8;
    g.lineCap = 'round'; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo((sx + tx) / 2, (sy + ty) / 2 + bend, tx, ty);
    if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = 9; g.stroke(); }
    g.strokeStyle = R.mono || '#ff6f91'; g.lineWidth = 5; g.stroke();
    circ(g, tx, ty, 6.5, '#ff8fab', R);
  }
  g.restore();
}
function frogLayout(p, T) {
  const wk = Math.abs(p.wk || 0), wc = Math.abs(p.wc || 0);
  const bigSq = (p.gs || 0) + Math.sin(T * 0.06) * 0.03;
  const bigTop = -FROG.big.h * (1 - 0.4 * clamp(bigSq, -0.5, 0.6)) + 6;
  return {
    big: { x: p.gx, y: p.gy - wk * 7, rot: p.gr, sq: bigSq, punch: p.gp, guard: p.gg, inflate: p.gb },
    small: { x: p.gx + 6 + p.px, y: p.gy + bigTop + p.py - Math.abs(Math.sin(T * 0.25)) * 4 - wc * 16, rot: p.pr, kick: p.pp },
    mid: { x: -74 + p.kx, y: p.ky - Math.abs(Math.sin(Math.asin(clamp(p.wk || 0, -1, 1)) + 1.2)) * 9 * Math.min(1, wk + wc), rot: p.kr + Math.sin(T * 0.04) * 0.04, sq: p.ks, tongue: p.kp, guard: p.gg * 0.6 },
  };
}
function drawFrogTrinity(g, ch, p, x, y, facing, o) {
  const s = ch.scale * (o.scale || 1), T = o.T || 0, R = { mono: o.mono || null, ol: 2.2 };
  const oo = { ...o, glowCol: (o.pal || ch.colors).accent };
  g.save(); g.translate(x, y); g.scale(facing * s, s); g.lineJoin = 'round'; g.lineCap = 'round';
  if (p.rot) { g.translate(0, -50); g.rotate(p.rot); g.translate(0, 50); }
  const L = frogLayout(p, T);
  drawFrog(g, FROG.mid, L.mid, R, oo);
  drawFrog(g, FROG.big, L.big, R, oo);
  if ((p.ph || 0) < 0.5) drawFrog(g, FROG.small, L.small, R, oo);
  g.restore();
}
function frogWorld(F, which) {
  const L = frogLayout(F.pose, F.T)[which];
  return [F.x + F.facing * L.x * F.s, F.y + (L.y - (which === 'big' ? 50 : which === 'mid' ? 36 : 20)) * F.s];
}

// swamp-world overlay for the ultimate
function drawSwamp(g, c) {
  const a = c.bgA || 0; if (a <= 0.01) return;
  g.save(); g.globalAlpha = a;
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#020d07'); sky.addColorStop(0.55, '#0d3b22'); sky.addColorStop(0.72, '#5f9a3e'); sky.addColorStop(0.73, '#0c2a18'); sky.addColorStop(1, '#03100a');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const mg = g.createRadialGradient(W / 2, 200, 40, W / 2, 200, 260); mg.addColorStop(0, 'rgba(230,255,170,0.9)'); mg.addColorStop(0.45, 'rgba(160,230,90,0.35)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = mg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#f4ffd0'; g.beginPath(); g.arc(W / 2, 200, 120, 0, TAU); g.fill();
  g.font = `900 180px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(20,70,30,0.55)'; g.fillText('沼', W / 2, 205);
  g.fillStyle = '#03140a';
  for (let i = 0; i < 40; i++) { const x = (i * 97) % W, hh = 120 + ((i * 53) % 140); g.beginPath(); g.moveTo(x - 4, 525); g.quadraticCurveTo(x + 10, 525 - hh * 0.6, x + 18 * Math.sin(i + c.f * 0.03), 525 - hh); g.lineTo(x + 4, 525); g.fill(); }
  for (let i = 0; i < 9; i++) { const x = ((i * 173 + c.f * 0.6) % (W + 200)) - 100, y = 560 + (i % 3) * 45; g.fillStyle = '#2f7a2a'; g.beginPath(); g.ellipse(x, y, 60, 14, 0, 0.3, TAU - 0.1); g.lineTo(x, y); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x - 70, y + 16, 140, 2); }
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 30; i++) { const fx = (i * 211 + Math.sin(c.f * 0.05 + i) * 30) % W, fy = 120 + (i * 137) % 380 + Math.cos(c.f * 0.07 + i) * 15; g.fillStyle = 'rgba(200,255,120,0.8)'; g.beginPath(); g.arc(fx, fy, 2.5, 0, TAU); g.fill(); }
  g.restore();
}

CINE.frogSnare = function (A, D, f, c) {
  const dir = A.facing;
  if (f === 1) { c.d0 = Math.abs(D.x - A.x); D.y = GROUND; Sound.play('slap'); FX.wtext(D.x, D.y - 210, 'SNARED!', { size: 30, color: '#ff8fab', stroke: OUTLINE, life: 40 }); }
  if (f <= 14) { const t = f / 14, dist = lerp(c.d0, 92, easeOut(t)); D.x = A.x + dir * dist; D.forcePose = 'hit'; A.forcePose = { kx: 30, kp: Math.max(40, dist - 30) }; }
  if (f === 18) { A.forcePose = { kx: 30, kp: 50, px: 82, py: 44, pp: 1, pr: 0.3 }; BT.scriptHit(A, D, 28, { str: 2 }); FX.wtext(D.x, D.y - 190, 'PYON!', { size: 32, color: '#fff', stroke: '#2f8a2a', life: 34 }); Sound.play('croak'); }
  if (f === 26) A.forcePose = { gr: -0.35, gp: -0.4, kx: 10, kp: 0, px: 40, py: -20 };
  if (f === 32) { A.forcePose = { gp: 1.1, gr: 0.35, gx: 26, kp: 0 }; BT.scriptHit(A, D, 72, { str: 3 }); FX.shakeIt(10); FX.wtext(D.x, D.y - 210, 'GAMA PUNCH!', { size: 36, color: '#fff', stroke: '#355a1c', life: 40 }); }
  if (f === 40) { BT.release(D, dir * 9, -9); return true; }
};
CINE.frogUlt = function (A, D, f, c) {
  const dir = c.dir ?? (c.dir = A.facing), acc = A.colors.accent;
  if (f === 1) { c.zoom = 1.25; c.bg = drawSwamp; c.bgA = 0; FX.darkTarget = 0.2; Sound.play('charge'); Sound.play('croak'); A.forcePose = 'prejump'; D.forcePose = 'hit'; D.y = GROUND; BT.say(A, 'Formation... SWAMP APOCALYPSE!', 70); }
  c.bgA = f < 150 ? Math.min(1, f / 18) : Math.max(0, 1 - (f - 150) / 20);
  if (f === 14) { Sound.play('boing'); FX.dust(A.x, GROUND, 14); FX.ring(D.x, GROUND, acc, 10, 140, 18, 6, 0.3); }
  if (f >= 14 && f <= 34) { const t = easeOut((f - 14) / 20); D.y = GROUND - t * 230; D.forcePose = 'airhit'; A.y = GROUND - t * 200; A.x = clamp(D.x - dir * 90, 50, STAGE_W - 50); A.forcePose = 'jump'; }
  if (f > 34 && f <= 92) {
    const k = Math.floor((f - 35) / 6), ph = (f - 35) % 6;
    D.y = GROUND - 230 + Math.sin(f * 0.6) * 5; D.forcePose = k % 2 ? 'airhit' : 'hit';
    if (ph === 0) {
      const who = k % 3, side = k % 2 ? -1 : 1;
      A.forcePose = [{ gp: 1.1, gr: 0.35, gx: 26, px: -34, py: -44, kx: -26, ky: -26 }, { px: 118, py: -24, pp: 1, pr: 0.5, gp: -0.3 }, { kx: 118, ky: -62, kp: 66, kr: 0.55, ks: -0.2 }][who];
      A.x = clamp(D.x - side * dir * (who === 0 ? 88 : who === 1 ? 120 : 102), 50, STAGE_W - 50); A.facing = side * dir; A.y = GROUND - 200 + (who === 2 ? -36 : 0);
      BT.scriptHit(A, D, 15, { str: who === 0 ? 3 : 2, sfx: who === 2 ? 'slap' : 'hit' });
      FX.wtext(D.x + rand(-70, 70), D.y - 160, pick(['KERO!', 'GERO!', 'PYON!', 'RIBBIT!', 'ゲロ!', 'ケロ!']), { size: 34, color: '#ffffff', stroke: '#2f8a2a', life: 26, rot: rand(-0.3, 0.3) });
      if (who === 0) { FX.impactFrame(2); Sound.play('croak'); }
      FX.speedlines(6, W / 2, H / 2, '#d8ffb0', 30); A.afterimage = 6;
    }
  }
  if (f === 96) { A.facing = dir; A.x = D.x - dir * 16; A.y = GROUND - 400; A.forcePose = 'pile'; FX.announce('TRINITY FORMATION!', { sub: '三位一体', size: 64, life: 44, y: 170, color: '#d8ffb0', glow: '#2f8a2a' }); Sound.play('charge'); }
  if (f > 96 && f <= 106) { D.y = GROUND - 230; }
  if (f > 106 && f <= 114) { const t = (f - 106) / 8; A.y = lerp(GROUND - 400, GROUND - 40, t * t); D.y = lerp(GROUND - 230, GROUND, t * t); A.forcePose = 'splat'; A.afterimage = 4; }
  if (f === 114) {
    D.y = GROUND; D.forcePose = 'down'; A.y = GROUND - 34;
    BT.scriptHit(A, D, 150, { str: 4 }); FX.impactFrame(5); FX.shakeIt(26); Sound.play('explosion'); Sound.play('splash'); FX.flashScreen('#c8ff9a', 14, 0.7);
    for (let i = 0; i < 80; i++) FX.p({ type: 'spark', x: D.x + rand(-40, 40), y: GROUND - 10, vx: rand(-12, 12), vy: -rand(4, 16), grav: 0.45, life: rand(25, 45), size: rand(3, 6), color: pick(['#7dff5a', '#3aa79a', '#d8ffb0']), add: false, drag: 0.98 });
    FX.ring(D.x, GROUND, acc, 10, 260, 24, 10, 0.25); FX.ring(D.x, GROUND, '#ffffff', 10, 180, 18, 6, 0.25);
    FX.wtext(D.x, GROUND - 300, '沼!!', { size: 110, font: FONT_JP, color: '#fff', stroke: acc, life: 60, vy: -0.3 });
  }
  if (f > 114) { A.forcePose = 'victory'; if (f % 6 === 0) FX.p({ type: 'ember', x: A.x + rand(-60, 60), y: A.y - rand(40, 220), vy: -1, life: 30, size: 3, color: '#fff7a0' }); }
  if (f === 124) { BT.say(A, 'KERO KERO KERO!! ...Ta-daaa!', 80); Sound.play('croak'); FX.wtext(A.x, A.y - 260, 'TA-DAAA!', { size: 54, color: '#ffe14a', stroke: '#2f8a2a', life: 70, vy: -0.2 }); }
  if (f === 172) { BT.release(D, dir * 4, -5); return true; }
};

EXTRA_PROJ.frogball = {
  update(p) { if (p.t % 2 === 0) FX.p({ type: 'spark', x: p.x, y: p.y, vx: -p.vx * 0.2, vy: 0, life: 10, size: 3, color: '#9dff5a' }); if (p.y >= GROUND - 22) { p.dead = true; FX.dust(p.x, GROUND, 8); Sound.play('croak'); } },
  draw(g, p) {
    const d = Math.sign(p.vx) || 1;
    g.translate(p.x, p.y); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(140,255,90,0.35)';
    g.beginPath(); g.ellipse(-d * 30, 0, 40, 14, 0, 0, TAU); g.fill(); g.globalCompositeOperation = 'source-over';
    g.scale(d, 1); g.rotate(p.t * 0.5);
    drawFrog(g, FROG.small, { x: 0, y: 21, rot: 0, kick: 1 }, { ol: 2.2 }, { T: p.t, expr: 'shout' });
  },
};

const FROGS = {
  id: 'frogs', name: 'FROG TRINITY', jp: 'カエル三連星', title: 'The Frog Trinity', titleJp: '蛙三銃士',
  style: 'TRIO / PUPPET', desc: 'Gamaoh the sumo toad, Pipi the hyperactive ninja frog and Kero-Sensei the tongue scholar. Three frogs, one fighter, zero predictability.',
  stats: { power: 3, speed: 4, range: 4, defense: 2 },
  scale: 1.0, health: 980, walk: 4.6, backWalk: 3.9, jumpV: -18, jumpX: 4.8, dashV: 12, doubleJump: true, wide: 1.3,
  dims: { ...DIMS }, build: { arm: 1, leg: 1, torso: 1 },
  colors: { skin: '#4f7a2e', top: '#4f7a2e', leg: '#355a1c', accent: '#7dff5a', eye: '#000' },
  drawCustom: drawFrogTrinity, portraitAnchor: [-14, -86], portraitScale: 0.56,
  voicePitch: 1.9, voiceRate: 1.15,
  stance: {},
  poses: {
    stance: {}, crouch: { gs: 0.32, ks: 0.3, py: 6, kx: 6 }, prejump: { gs: 0.4, ks: 0.38 },
    jump: { gs: -0.22, ks: -0.18, py: -16, pr: 0.25, kr: -0.25, ky: -8 }, fall: { gs: -0.08, py: -26, pr: -0.35, kx: -6, ky: -16, kr: 0.2 },
    flip: { gr: -0.9, pr: 2.5, kr: -0.8, py: -30 }, land: { gs: 0.35, ks: 0.35 },
    dash: { gr: 0.35, gs: -0.1, kx: -24, kr: 0.3, px: 26, py: 34, pr: 0.6 }, backdash: { gr: -0.3, kr: -0.3, py: -14 },
    block: { gg: 1, kx: -10, ks: 0.25, py: 18, pr: -0.2 }, cblock: { gg: 1, gs: 0.3, ks: 0.4, py: 24, kx: -6 },
    hit: { gr: -0.35, kr: -0.4, pr: -0.6, px: -14, py: -14, gp: -0.4 }, hit2: { gr: 0.35, gs: 0.18, kr: 0.3, py: 10, pr: 0.4 },
    chit: { gs: 0.32, ks: 0.3, gr: -0.3, kr: -0.3 },
    airhit: { gr: -0.8, kr: -1.0, pr: -1.6, kx: -24, ky: -24, px: -20, py: -18 },
    down: { gr: -1.45, gy: -30, kr: 1.4, kx: -40, ky: -14, pr: 1.5, px: 70, py: 92 },
    getup: { gs: 0.3, ks: 0.3 },
    kneel: { gs: 0.35, gr: 0.35, kr: 0.6, ks: 0.3, py: 94, px: 50, pr: 0.2 },
    victory: { gs: -0.12, gg: -1, kx: 76, ky: -100, px: -4, py: -78 },
    pile: { gs: -0.12, gg: -1, kx: 76, ky: -100, px: -4, py: -78 },
    intro: { gg: -0.8, kp: 40, py: -12, pr: 0.3 },
    splat: { gr: 1.3, gs: 0.1, kx: 80, ky: 24, kr: 1.4, px: 70, py: 92, pr: 1.6 },
    fL_w: { py: -22, px: 6, pr: -0.3 }, fL: { px: 72, py: 46, pp: 1, pr: 0.25 },
    fM_w: { kx: 22, ks: 0.2, kr: -0.1 }, fM: { kx: 38, kp: 128, kr: 0.05 },
    fH_w: { gr: -0.3, gp: -0.4, gx: -6 }, fH: { gr: 0.32, gp: 1.1, gx: 22, py: 8 },
    fcL: { gs: 0.3, ks: 0.3, px: 62, py: 96, pp: 1, pr: 0.2 },
    fcM_w: { gs: 0.3, ks: 0.35, kx: 20 }, fcM: { gs: 0.3, ks: 0.35, kx: 34, kr: 0.32, kp: 122 },
    fcH_w: { gs: 0.4, gr: 0.2 }, fcH: { gr: 1.25, gx: 46, gy: -20, gs: 0.1, py: 60, px: -40, ks: 0.3 },
    fjL: { px: 48, py: 56, pp: 1, pr: 0.4, gs: -0.15 }, fjM: { kx: 30, ky: -10, kp: 104, kr: 0.75, gs: -0.15 },
    fjH_w: { gr: -0.5, gg: -1, gs: -0.2 }, fjH: { gr: 0.95, gs: 0.15, gp: 1, py: -30 },
    fLH_w: { gs: 0.38, ks: 0.3, gp: -0.3 }, fLH: { gs: -0.25, gg: -1, gy: -12, gr: -0.12, py: -40, pr: -0.8 },
    fFF_w: { gs: 0.3, gr: -0.2 }, fFF: { gr: 0.55, gx: 24, gs: -0.1, px: 66, py: 40, pp: 1, kx: 32, kr: 0.4 },
    cannon_w: { gg: -1, gr: -0.35, px: -40, py: -20, pr: -1 }, cannon: { gp: 1.1, gr: 0.35, ph: 1 },
    snare_w: { kx: 16, ks: 0.25, kr: -0.15 }, snare: { kx: 30, kp: 250, kr: 0.02 },
    belly: { gb: 1, gs: -0.06, kx: -18, py: -6, pr: -0.3 }, bounce: { gb: 1.5, gr: 0.25, gx: 14, gs: -0.15 },
    trip_w: { gs: 0.35, ks: 0.35 },
    pileJump: { gs: -0.2, ks: -0.2, kx: 30, ky: -40, px: 20, py: -30, pr: 1.5, gr: 0.2 },
    pileDive: { gr: 0.8, gs: 0.1, kx: 50, ky: -20, kr: 1.0, px: 50, py: 20, pr: 2.8, gp: 1 },
    ultDash: { gr: 0.45, gx: 20, px: 50, py: 30, pp: 1, kx: 30, kr: 0.4 },
  },
  intro: 'Ribbit! Kero! Hmph! ...We are the FROG TRINITY!',
  wins: ['Kero kero! Three frogs, zero mercy!', 'Pipi: TOO SLOW! Gamaoh: Hmph. Sensei: As calculated.', 'Every year is a leap year for us!'],
  introFx(F) {
    for (let i = 0; i < 3; i++) { FX.ring(F.x + (i - 1) * 50, GROUND, '#7dff5a', 6, 70, 16, 4, 0.3); FX.dust(F.x + (i - 1) * 50, GROUND, 6); }
    Sound.play('croak'); Sound.play('splash'); FX.wtext(F.x, F.y - 230, 'KERO!', { size: 40, color: '#fff', stroke: '#2f8a2a', life: 40 });
  },
  moves: Object.assign(baseNormals({ dmg: 0.95 }), {
    sp1: {
      name: 'TONGUE SNARE', jp: '舌縛り', desc: 'Kero-Sensei’s long tongue grabs and reels the opponent in; Pipi and Gamaoh follow up.', special: 1, lvl: 4, poses: ['snare_w', 'snare'], st: 12, act: 6, rec: 24, dmg: 30, hs: 20, bs: 12, kb: 0,
      hb: { x: 40, y: -90, w: 245, h: 34 }, cd: 75, str: 2, sfx: 'slap',
      onHit(F, D) { BT.startCine(F, D, CINE.frogSnare, { zoom: 1.15 }); return true; },
    },
    sp1f: {
      name: 'FROG CANNON', jp: '蛙大砲', desc: 'Gamaoh hurls Pipi at the opponent in an arc.', special: 1, lvl: 4, poses: ['cannon_w', 'cannon'], st: 14, act: 1, rec: 22, cd: 75, sfx: 'boing',
      tick(F, f) { if (f === 36) { const p = frogWorld(F, 'small'); FX.dust(p[0], p[1], 6, 'rgba(200,255,170,0.6)'); Sound.play('croak'); } },
      spawn: { f: 14, fn(F) { BT.spawn({ owner: F, kind: 'frogball', x: F.x + F.facing * 55, y: F.y - 125, vx: F.facing * 12, vy: -3.5, grav: 0.16, w: 46, h: 46, dmg: 78, hs: 20, bs: 14, kb: 9, life: 70, str: 2, color: '#9dff5a' }); FX.wtext(F.x + F.facing * 40, F.y - 220, 'WHEEE!', { size: 26, color: '#fff', stroke: '#2f8a2a', life: 30 }); } },
    },
    counter: {
      name: 'BELLY BOUNCE', jp: '腹鼓返し', desc: 'Counter. Gamaoh puffs up his belly; any attack bounces back as a launching belly-slam.', special: 1, lvl: 4, counter: 1, poses: ['belly', 'belly'], st: 2, act: 22, rec: 18, cd: 100, sfx: 'boing',
      onCounter(F) { F.startMove('bellyBounce', true); },
    },
    bellyBounce: { name: 'BELLY BOUNCE', jp: '腹鼓', lvl: 5, poses: ['belly', 'bounce'], st: 2, act: 6, rec: 20, dmg: 95, hs: 30, kb: 6, launch: -13, kd: 1, hb: { x: -10, y: -165, w: 118, h: 165 }, invuln: [0, 10], str: 3, shake: 9,
      tick(F, f) { if (f === 3) { Sound.play('boing'); FX.ring(F.x + F.facing * 30, F.y - 60, '#7dff5a', 20, 110, 14, 6); } } },
    sp2: {
      name: 'TRIPLE TROUBLE', jp: '三位一体', desc: 'Pipi dashes low, Sensei leaps in, Gamaoh crashes down: three coordinated hits.', special: 1, lvl: 4, st: 8, act: 26, rec: 18, dmg: 32, hits: 3, interval: 8, hs: 22, bs: 12, kb: 3,
      hb: { x: 15, y: -150, w: 140, h: 150 }, cd: 70, str: 2, sfx: 'croak', final: { dmg: 55, kd: 1, kb: 10, str: 3, shake: 8 },
      poseFn(F, f) {
        if (f <= 8) return 'trip_w';
        if (f <= 16) return { px: 100, py: 96, pp: 1, pr: 0.3, gs: 0.2 };
        if (f <= 24) return { kx: 112, ky: -50, kp: 50, kr: 0.5, py: -10 };
        if (f <= 36) return { gx: 70, gy: -30, gp: 1.1, gr: 0.6, kx: 40 };
        return 'stance';
      },
      tick(F, f) { if (f > 8 && f <= 34) { F.vx = F.facing * 3; F.ctrlVel = true; } if (f === 9 || f === 17 || f === 25) { F.afterimage = 6; Sound.play(f === 17 ? 'slap' : 'whoosh'); } },
    },
    sp2d: {
      name: 'FROG PILE', jp: '蛙山', desc: 'All three leap at the opponent and land on top of them. Overhead, 3 hits.', special: 1, lvl: 4, poses: ['pileJump', 'pileDive'], st: 16, act: 26, rec: 6, dmg: 38, hits: 3, interval: 5, hs: 24, bs: 14, kb: 4, type: 'overhead',
      hb: { x: -40, y: -130, w: 150, h: 130 }, cd: 100, str: 3, landRec: 14, sfx: 'boing', final: { kd: 1, dmg: 50, str: 3 },
      tick(F, f, O) { if (f === 1) { F.vy = -16; F.onGround = false; F.vx = clamp((O.x - F.x) / 37, -8.5, 8.5); FX.dust(F.x, GROUND, 8); } if (f === 16) F.afterimage = 10; },
      onLand(F) { FX.shakeIt(10); FX.dust(F.x, GROUND, 14); FX.ring(F.x, GROUND, '#7dff5a', 10, 150, 16, 6, 0.3); Sound.play('splash'); },
    },
    ult: {
      name: 'SWAMP APOCALYPSE', jp: '沼の黙示録', desc: 'Ultimate. The frogs launch the foe into a swamp dimension for a 9-hit aerial beatdown and a triple-dive finisher.', ult: 1, lvl: 6, cost: 100, poses: ['trip_w', 'ultDash'], st: 8, act: 16, rec: 30, dmg: 35, hs: 40, bs: 20, kb: 6,
      hb: { x: 0, y: -175, w: 105, h: 175 }, invuln: [0, 26], str: 3,
      tick(F, f) { if (f > 8 && f <= 24) { F.vx = F.facing * 14; F.ctrlVel = true; F.afterimage = 6; } },
      onHit(F, D) { BT.startCine(F, D, CINE.frogUlt); return true; },
    },
  }),
};
(() => {
  const M = FROGS.moves;
  Object.assign(M.L, { name: 'Pipi Kick', poses: ['fL_w', 'fL'], hb: { x: 45, y: -108, w: 66, h: 52 } });
  Object.assign(M.M, { name: 'Tongue Lash', poses: ['fM_w', 'fM'], st: 9, act: 5, hb: { x: 20, y: -74, w: 135, h: 30 }, sw: null });
  Object.assign(M.H, { name: 'Gama Smash', poses: ['fH_w', 'fH'], hb: { x: 35, y: -118, w: 88, h: 78 }, sw: { cx: 10, cy: -70, r: 80, a0: -1.0, a1: 0.5, color: '#7dff5a' } });
  Object.assign(M.cL, { name: 'Pipi Low Kick', poses: ['crouch', 'fcL'], hb: { x: 40, y: -50, w: 62, h: 44 } });
  Object.assign(M.cM, { name: 'Low Tongue', poses: ['fcM_w', 'fcM'], hb: { x: 20, y: -46, w: 125, h: 38 } });
  Object.assign(M.cH, { name: 'Belly Slide', poses: ['fcH_w', 'fcH'], hb: { x: 20, y: -56, w: 110, h: 52 }, sw: null });
  Object.assign(M.jL, { poses: ['jump', 'fjL'], hb: { x: 30, y: -98, w: 66, h: 62 } });
  Object.assign(M.jM, { poses: ['jump', 'fjM'], hb: { x: 10, y: -78, w: 102, h: 68 } });
  Object.assign(M.jH, { name: 'Air Body Splash', poses: ['fjH_w', 'fjH'], hb: { x: -5, y: -118, w: 100, h: 118 }, sw: null });
  Object.assign(M.LH, { name: 'Toad Uppercut', poses: ['fLH_w', 'fLH'], hb: { x: 0, y: -205, w: 82, h: 145 } });
  Object.assign(M.FF, { name: 'Stampede', poses: ['fFF_w', 'fFF'], hb: { x: 10, y: -150, w: 100, h: 122 } });
})();

// ============================== THE CONDUCTOR ==============================
function drawTrainSide(g, x, y, d, sc = 1, t = 0, alpha = 0.9) {
  g.save(); g.translate(x, y); g.scale(d * sc, sc); g.globalAlpha = alpha;
  const tr = g.createLinearGradient(-520, 0, -120, 0); tr.addColorStop(0, 'rgba(255,40,60,0)'); tr.addColorStop(1, 'rgba(255,60,80,0.5)');
  g.fillStyle = tr; g.fillRect(-520, -62, 400, 104);
  g.shadowColor = '#ff2a3a'; g.shadowBlur = 26;
  g.fillStyle = 'rgba(248,246,255,0.92)';
  g.beginPath(); g.moveTo(-125, -62); g.lineTo(40, -62); g.quadraticCurveTo(118, -60, 128, 10); g.lineTo(128, 40); g.lineTo(-125, 40); g.closePath(); g.fill();
  g.shadowBlur = 0; g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#c8102e'; g.beginPath(); g.moveTo(-125, -2); g.lineTo(110, -2); g.lineTo(126, 14); g.lineTo(-125, 14); g.closePath(); g.fill();
  g.fillStyle = 'rgba(30,10,40,0.75)'; for (let i = 0; i < 4; i++) g.fillRect(-110 + i * 38, -50, 26, 26);
  g.beginPath(); g.moveTo(52, -52); g.quadraticCurveTo(98, -50, 108, -18); g.lineTo(52, -18); g.closePath(); g.fill();
  g.fillStyle = '#c8102e'; g.beginPath(); g.moveTo(96, 40); g.lineTo(140, 40); g.lineTo(118, 22); g.closePath(); g.fill();
  g.globalCompositeOperation = 'lighter';
  const bm = g.createLinearGradient(128, 0, 420, 0); bm.addColorStop(0, 'rgba(255,240,200,0.7)'); bm.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = bm; g.beginPath(); g.moveTo(122, 22); g.lineTo(420, -30); g.lineTo(420, 80); g.closePath(); g.fill();
  g.fillStyle = '#fff7d0'; g.beginPath(); g.arc(122, 24, 8, 0, TAU); g.fill();
  g.globalCompositeOperation = 'source-over';
  for (const wx of [-95, -45, 25, 75]) {
    g.fillStyle = '#1a1a22'; g.beginPath(); g.arc(wx, 44, 16, 0, TAU); g.fill(); g.strokeStyle = '#ff2a3a'; g.lineWidth = 3; g.stroke();
    g.strokeStyle = '#ddd'; g.lineWidth = 2; g.beginPath(); const a = t * 0.6; g.moveTo(wx + Math.cos(a) * 12, 44 + Math.sin(a) * 12); g.lineTo(wx - Math.cos(a) * 12, 44 - Math.sin(a) * 12); g.stroke();
  }
  g.restore();
}
function drawGiantTrain(g, k, f) {
  const vx = W / 2, vy = 446, sc = 0.05 + Math.pow(k, 3) * 2.8, by = lerp(vy, H + 260, k * k);
  g.save(); g.translate(vx, by); g.scale(sc, sc);
  g.globalCompositeOperation = 'lighter';
  const aura = g.createRadialGradient(0, -150, 20, 0, -150, 420); aura.addColorStop(0, 'rgba(255,60,80,0.55)'); aura.addColorStop(1, 'rgba(255,0,40,0)');
  g.fillStyle = aura; g.fillRect(-420, -570, 840, 840);
  g.globalCompositeOperation = 'source-over';
  g.shadowColor = '#ff2a3a'; g.shadowBlur = 40;
  g.fillStyle = 'rgba(250,248,255,0.95)';
  g.beginPath(); g.moveTo(-170, 0); g.lineTo(-170, -230); g.quadraticCurveTo(-160, -300, 0, -310); g.quadraticCurveTo(160, -300, 170, -230); g.lineTo(170, 0); g.closePath(); g.fill();
  g.shadowBlur = 0;
  g.fillStyle = 'rgba(30,10,40,0.85)'; g.beginPath(); g.moveTo(-120, -250); g.quadraticCurveTo(0, -290, 120, -250); g.lineTo(110, -190); g.lineTo(-110, -190); g.closePath(); g.fill();
  g.fillStyle = '#c8102e'; g.beginPath(); g.moveTo(-170, -150); g.lineTo(0, -60); g.lineTo(170, -150); g.lineTo(170, -110); g.lineTo(0, -20); g.lineTo(-170, -110); g.closePath(); g.fill();
  g.globalCompositeOperation = 'lighter';
  const hl = g.createRadialGradient(0, -130, 5, 0, -130, 160); hl.addColorStop(0, '#ffffff'); hl.addColorStop(0.3, 'rgba(255,240,200,0.9)'); hl.addColorStop(1, 'rgba(255,200,150,0)');
  g.fillStyle = hl; g.beginPath(); g.arc(0, -130, 160, 0, TAU); g.fill();
  for (const sx of [-120, 120]) { g.fillStyle = '#ff3040'; g.beginPath(); g.arc(sx, -40, 16 + Math.sin(f * 0.6) * 3, 0, TAU); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#c8102e'; for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(i * 38 - 14, 0); g.lineTo(i * 38 + 14, 0); g.lineTo(i * 30, 40); g.closePath(); g.fill(); }
  g.restore();
}
function drawStation(g, c) {
  const a = c.bgA || 0; if (a <= 0.01) return;
  const f = c.f;
  g.save(); g.globalAlpha = a;
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#14020a'); sky.addColorStop(0.45, '#6e0a1c'); sky.addColorStop(0.615, '#f6dede'); sky.addColorStop(0.62, '#1c1218'); sky.addColorStop(1, '#07050a');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const vx = W / 2, vy = 446;
  // giant clock
  g.save(); g.translate(vx, 170);
  g.fillStyle = 'rgba(255,250,245,0.9)'; g.beginPath(); g.arc(0, 0, 120, 0, TAU); g.fill();
  g.strokeStyle = '#c8102e'; g.lineWidth = 10; g.stroke(); g.strokeStyle = '#1a1018'; g.lineWidth = 3;
  for (let i = 0; i < 12; i++) { const an = i * TAU / 12; g.beginPath(); g.moveTo(Math.cos(an) * 96, Math.sin(an) * 96); g.lineTo(Math.cos(an) * 110, Math.sin(an) * 110); g.stroke(); }
  g.lineCap = 'round'; g.lineWidth = 7; g.beginPath(); g.moveTo(0, 0); const h1 = f * 0.02 - 1.2; g.lineTo(Math.cos(h1) * 55, Math.sin(h1) * 55); g.stroke();
  g.lineWidth = 4; g.strokeStyle = '#c8102e'; g.beginPath(); g.moveTo(0, 0); const h2 = f * 0.25; g.lineTo(Math.cos(h2) * 92, Math.sin(h2) * 92); g.stroke();
  g.restore();
  // pillars receding
  for (let i = 7; i >= 0; i--) {
    const z = 1 / (1 + i * 0.55), off = 180 + 520 * z, top = vy - 420 * z, bot = vy + (H - vy) * z * 1.1;
    for (const sd of [-1, 1]) {
      const px = vx + sd * off; g.fillStyle = `rgba(${20 + 30 * z},${10 + 8 * z},${18 + 10 * z},1)`; g.fillRect(px - 20 * z, top, 40 * z, bot - top);
      g.fillStyle = '#ff2a3a'; g.globalAlpha = a * (0.5 + 0.5 * Math.sin(f * 0.2 + i)); g.beginPath(); g.arc(px, top + 30 * z, 8 * z, 0, TAU); g.fill(); g.globalAlpha = a;
    }
  }
  // platforms
  g.fillStyle = '#2a2026'; g.beginPath(); g.moveTo(0, H); g.lineTo(vx - 150, vy); g.lineTo(vx - 40, vy); g.lineTo(vx - 330, H); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(W, H); g.lineTo(vx + 150, vy); g.lineTo(vx + 40, vy); g.lineTo(vx + 330, H); g.closePath(); g.fill();
  g.strokeStyle = '#ffd84a'; g.lineWidth = 3; g.beginPath(); g.moveTo(vx - 330, H); g.lineTo(vx - 40, vy); g.moveTo(vx + 330, H); g.lineTo(vx + 40, vy); g.stroke();
  // rails + sleepers
  g.fillStyle = '#3a2c30';
  for (let i = 0; i < 14; i++) { const zz = ((i + (f * 0.25) % 1) / 14), yy = vy + (H - vy) * zz * zz, hw = 20 + 260 * zz * zz; g.fillRect(vx - hw, yy, hw * 2, 3 + 10 * zz); }
  g.strokeStyle = '#cfc8d0'; g.lineWidth = 3; g.beginPath(); g.moveTo(vx - 10, vy); g.lineTo(vx - 190, H); g.moveTo(vx + 10, vy); g.lineTo(vx + 190, H); g.stroke();
  // departure board
  g.fillStyle = '#0c0a10'; g.fillRect(vx + 300, 250, 300, 70); g.strokeStyle = '#c8102e'; g.lineWidth = 3; g.strokeRect(vx + 300, 250, 300, 70);
  g.font = `900 22px ${FONT_JPS}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#ffb020'; g.fillText('終着 FINAL EXPRESS', vx + 316, 272);
  g.fillStyle = '#7dff8a'; g.fillText('定刻  ON TIME', vx + 316, 300);
  // floating tickets
  for (let i = 0; i < 16; i++) { const tx = (i * 151 + f * (1 + i % 3)) % (W + 100) - 50, ty = 80 + (i * 89) % 340 + Math.sin(f * 0.05 + i) * 12; g.save(); g.translate(tx, ty); g.rotate(f * 0.03 + i); g.fillStyle = i % 2 ? '#ffffff' : '#c8102e'; g.fillRect(-12, -6, 24, 12); g.restore(); }
  if (c.train >= 0 && c.train <= 0.62) drawGiantTrain(g, c.train, f);
  g.restore();
}
function drawStationFG(g, c) { if (c.train > 0.62) { g.save(); g.globalAlpha = Math.min(1, c.bgA + 0.3); drawGiantTrain(g, c.train, c.f); g.restore(); } }

CINE.conductor = function (A, D, f, c) {
  const dir = c.dir ?? (c.dir = A.facing);
  if (f === 1) {
    c.zoom = 1.2; c.camX = clamp(A.x + dir * 150, 260, STAGE_W - 260); c.bg = drawStation; c.fg = drawStationFG; c.bgA = 0; c.train = -1;
    D.y = GROUND; D.x = clamp(A.x + dir * 110, 60, STAGE_W - 60); D.forcePose = 'hit'; A.forcePose = 'watch'; Sound.play('tick'); BT.say(A, 'Hm. You are three seconds late.', 70);
  }
  if (f === 36) { A.forcePose = 'gloves'; Sound.play('clack'); }
  if (f === 46) Sound.play('clack');
  if (f === 58) { A.forcePose = 'whistle'; Sound.play('whistle'); FX.flashScreen('#ffffff', 10, 0.5); FX.darkTarget = 0; }
  if (f >= 58 && f < 150) c.bgA = Math.min(1, (f - 58) / 14);
  if (f === 66) Sound.play('trainRumble');
  if (f >= 66 && f < 150) c.train = clamp((f - 66) / 70, 0, 1.25);
  if (f === 80) Sound.play('trainRumble');
  if (f === 96) { Sound.play('horn'); A.forcePose = 'swingC_w'; }
  if (f === 104) { A.forcePose = 'swingC'; BT.scriptHit(A, D, 70, { str: 3 }); FX.shakeIt(10); FX.swoosh(A, { cx: -5, cy: -140, r: 118, a0: -2.0, a1: 0.6, color: '#ffffff' }); c.dx0 = D.x; Sound.play('clack'); }
  if (f > 104 && f <= 122) { const t = (f - 104) / 18; D.x = lerp(c.dx0, c.camX, easeOut(t)); D.y = GROUND - Math.sin(t * Math.PI * 0.5) * 120; D.forcePose = 'airhit'; }
  if (f === 112) Sound.play('horn');
  if (f === 136) {
    BT.scriptHit(A, D, 200, { str: 4 }); FX.impactFrame(6); FX.shakeIt(30); Sound.play('explosion'); Sound.play('impactBig'); FX.flashScreen('#ff2a3a', 16, 0.8);
    for (let i = 0; i < 90; i++) FX.p({ type: 'spark', x: D.x + rand(-30, 30), y: D.y - 80 + rand(-30, 30), vx: rand(-16, 16), vy: rand(-14, 8), life: rand(20, 40), size: rand(3, 7), color: pick(['#ff2a3a', '#ffffff', '#ffb0b8']), drag: 0.95 });
    FX.ring(D.x, D.y - 80, '#ff2a3a', 20, 320, 26, 12); FX.ring(D.x, D.y - 80, '#ffffff', 20, 220, 20, 8);
    FX.wtext(D.x, D.y - 280, '定刻!!', { size: 110, font: FONT_JP, color: '#ffffff', stroke: '#c8102e', life: 60, vy: -0.3 });
  }
  if (f === 150) { D.y = GROUND; D.x = clamp(c.camX + dir * 120, 60, STAGE_W - 60); D.forcePose = 'down'; c.train = -1; }
  if (f >= 150) c.bgA = Math.max(0, 1 - (f - 150) / 20);
  if (f === 168) { A.forcePose = 'watch'; Sound.play('tick'); BT.say(A, 'Right on schedule.', 110); }
  if (f === 232) { BT.release(D, dir * 3, -4); return true; }
};

EXTRA_PROJ.train = {
  update(p) { if (p.t % 3 === 0) FX.p({ type: 'smoke', x: p.x + Math.sign(p.vx) * 60, y: p.y - 70, vx: -p.vx * 0.2, vy: -rand(1, 2.5), life: 30, size: rand(10, 18), color: 'rgba(255,230,235,0.6)', add: false, grow: 0.6 }); if (p.t % 2 === 0) FX.dust(p.x, GROUND, 1); },
  draw(g, p) { drawTrainSide(g, p.x, p.y, Math.sign(p.vx) || 1, 1, p.t); },
};
EXTRA_PROJ.crossing = {
  delay(p) {
    if (p.delay % 14 === 0 && p.delay > 0) Sound.play('ding', p.delay % 28 === 0 ? 1 : 0.84);
    if (p.delay === 6) Sound.play('horn');
    if (p.delay === 0) { Sound.play('trainRumble'); FX.shakeIt(10); }
  },
  update(p) { if (p.t % 2 === 0) FX.p({ type: 'spark', x: p.x + rand(-100, 100), y: GROUND - rand(10, 160), vx: p.dir * 18, vy: 0, life: 8, size: 3, color: pick(['#ff2a3a', '#ffffff']) }); },
  draw(g, p) {
    const t = p.t, lower = Math.min(1, t / 16);
    for (const sx of [-95, 95]) {
      const px = p.x + sx;
      g.fillStyle = '#1e1e24'; g.fillRect(px - 4, GROUND - 175, 8, 175);
      g.save(); g.translate(px, GROUND - 165);
      for (const an of [0.6, -0.6]) { g.save(); g.rotate(an); g.fillStyle = '#ffffff'; g.fillRect(-28, -5, 56, 10); g.strokeStyle = '#c8102e'; g.lineWidth = 2; g.strokeRect(-28, -5, 56, 10); g.restore(); }
      g.restore();
      const on = Math.floor(t / 8) % 2;
      [[-10, 0], [10, 1]].forEach(([lx, i]) => { g.save(); const lit = on === i && p.delay > 0; g.shadowColor = '#ff2020'; g.shadowBlur = lit ? 18 : 0; g.fillStyle = lit ? '#ff3030' : '#4a1414'; g.beginPath(); g.arc(px + lx, GROUND - 132, 6.5, 0, TAU); g.fill(); g.restore(); });
      const dirIn = sx < 0 ? 1 : -1, an = (1 - lower) * Math.PI / 2;
      g.save(); g.translate(px, GROUND - 98); g.rotate(dirIn * -an);
      for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#c8102e'; g.fillRect(dirIn > 0 ? i * 14 : -(i + 1) * 14, -4, 14, 8); }
      g.restore();
    }
    if (p.delay <= 0) { const k = 1 - p.life / p.max; drawTrainSide(g, p.x + (k * 2 - 1) * 650 * p.dir, GROUND - 78, p.dir, 1.1, t, 0.95); }
  },
};
EXTRA_PROJ.signal = {
  delay(p) {
    if (p.delay > 30 && p.owner.opp) p.x = lerp(p.x, p.owner.opp.x, 0.07);
    if (p.delay === 36 || p.delay === 18) Sound.play('ding', p.delay === 18 ? 0.7 : 1.2);
    if (p.delay === 0) { Sound.play('slam'); Sound.play('explosion'); FX.shakeIt(16); FX.flashScreen('#ff2a3a', 8, 0.4); FX.ring(p.x, GROUND, '#ff2a3a', 10, 180, 18, 8, 0.25); FX.rocks(p.x, GROUND, 14); }
  },
  update() {},
  draw(g, p) {
    const sy = GROUND - 380, ph = p.delay > 36 ? 0 : p.delay > 18 ? 1 : 2, t = p.t;
    g.fillStyle = '#16161c'; g.fillRect(p.x - 5, sy - 500, 10, 440); g.fillRect(p.x - 70, sy - 70, 140, 10);
    g.fillStyle = '#121216'; g.beginPath(); g.roundRect ? g.roundRect(p.x - 26, sy - 62, 52, 148, 12) : g.rect(p.x - 26, sy - 62, 52, 148); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.stroke();
    [['#2aff6a', 0], ['#ffd02a', 1], ['#ff2a3a', 2]].forEach(([col, i]) => {
      const lit = ph === i && (i < 2 || t % 6 < 4 || p.delay <= 0); g.save();
      g.shadowColor = col; g.shadowBlur = lit ? 26 : 0; g.fillStyle = lit ? col : 'rgba(60,60,60,0.9)';
      g.beginPath(); g.arc(p.x, sy - 34 + i * 44, 15, 0, TAU); g.fill(); g.restore();
    });
    g.save(); g.globalCompositeOperation = 'lighter';
    if (p.delay > 0) {
      g.strokeStyle = ['#2aff6a', '#ffd02a', '#ff2a3a'][ph]; g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 0.6); g.lineWidth = 3;
      g.beginPath(); g.ellipse(p.x, GROUND, 60, 12, 0, 0, TAU); g.stroke();
      g.globalAlpha = 0.12; g.fillStyle = g.strokeStyle; g.fillRect(p.x - 50, sy + 90, 100, GROUND - sy - 90);
    } else {
      const k = p.life / p.max;
      const gr = g.createLinearGradient(p.x - 80, 0, p.x + 80, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.3, '#ff2a3a'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(0.7, '#ff2a3a'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = k; g.fillStyle = gr; g.fillRect(p.x - 80, sy + 90, 160, GROUND - sy - 90);
      drawBolt(g, p.x, sy + 90, p.x + rand(-10, 10), GROUND, '#ffffff', 5, 30, 4);
    }
    g.restore();
  },
};

const CONDUCTOR = {
  id: 'conductor', name: 'TETSUMICHI', jp: 'テツミチ', title: 'The Final Conductor', titleJp: '終着の車掌',
  style: 'CONDUCTOR', desc: 'Chief conductor of a train that runs between worlds. Precise, theatrical and never late: commands spectral trains, crossings and signals.',
  stats: { power: 3, speed: 4, range: 4, defense: 3 },
  scale: 1.03, health: 980, walk: 4.5, backWalk: 3.9, jumpV: -17, jumpX: 4.4, dashV: 12.5,
  dims: { ...DIMS, headR: 16.5 }, build: { arm: 0.92, leg: 0.95, torso: 0.96 },
  colors: { skin: '#f4d6c0', hair: '#15151c', top: '#f4f2ee', leg: '#1b1b24', boot: '#0b0b0f', foot: '#0b0b0f', uarm: '#f4f2ee', farm: '#f4f2ee', hand: '#ffffff', cuff: '#c8102e', belt: '#1b1b24', eye: '#c8102e', accent: '#ff2a3a', red: '#c8102e', gold: '#e8b84a', brow: '#15151c' },
  afterColors: ['#ff2a3a', '#ffffff'], voicePitch: 0.45, voiceRate: 0.9,
  stance: { t: 0.04, hd: -0.1, fa1: 0.45, fa2: 1.25, wa: 2.25, ba1: -0.35, ba2: 0.55, fl1: 0.22, fl2: 0.08, bl1: -0.2, bl2: -0.08 },
  poses: {
    victory: { t: 0.0, hd: 0.28, fa1: 0.2, fa2: 0.1, wa: 0.15, wl: 0, ba1: 0.95, ba2: 2.75, pw: 1, fl1: 0.15, fl2: 0.05, bl1: -0.15, bl2: -0.05 },
    watch: { t: 0.0, hd: 0.28, fa1: 0.2, fa2: 0.1, wa: 0.15, wl: 0, ba1: 0.95, ba2: 2.75, pw: 1, fl1: 0.15, fl2: 0.05, bl1: -0.15, bl2: -0.05 },
    intro: { t: 0.02, hd: 0.12, fa1: 0.95, fa2: 2.2, ba1: 0.85, ba2: 2.0, wa: 3.0 },
    gloves: { t: 0.02, hd: 0.15, fa1: 0.95, fa2: 2.25, ba1: 0.8, ba2: 1.95, wa: 3.0 },
    whistle: { t: -0.05, hd: -0.25, ba1: 0.72, ba2: 2.95, fa1: 0.4, fa2: 1.0, wa: 1.2 },
    signal: { t: -0.1, hd: -0.3, fa1: 2.8, fa2: 3.05, wa: 3.1, wl: 1, ba1: 0.3, ba2: 0.6 },
    point: { t: 0.12, fa1: 1.5, fa2: 1.55, wa: 1.57, wl: 0.3, ba1: -0.35, ba2: 0.55 },
    jabC: { base: 'jab', wa: 1.57, wl: 0.22 },
    swingC_w: { t: -0.22, fa1: 2.6, fa2: 3.0, wa: 3.7, wl: 1, ba1: -0.4, ba2: 0.5 },
    swingC: { t: 0.45, hd: 0.1, fa1: 1.45, fa2: 1.3, wa: 1.5, wl: 1, fl1: 0.65, bl1: -0.55, ba1: -0.4, ba2: 0.5 },
    thrust: { base: 'lunge', wa: 1.57, wl: 1 },
    counterC: { t: -0.06, hd: 0.05, fa1: 1.05, fa2: 2.7, wa: 3.05, wl: 0.5, ba1: 0.4, ba2: 1.2 },
    lowC: { base: 'crouch', fa1: 1.25, fa2: 1.55, wa: 1.72, wl: 0.65 },
    jC: { base: 'jheavy', wa: 1.0, wl: 0.6 },
  },
  intro: 'Departure in three... two... one. Please stand clear.',
  wins: ['Right on schedule.', 'Your ticket has been punched. Permanently.', 'Delays will not be tolerated.'],
  introFx(F) {
    Sound.play('whistle');
    for (let i = 0; i < 16; i++) FX.p({ type: 'smoke', x: F.x + rand(-60, 60), y: GROUND - rand(0, 30), vx: rand(-2, 2), vy: -rand(1, 3), life: rand(30, 50), size: rand(12, 22), color: 'rgba(255,240,245,0.6)', add: false, grow: 0.5 });
    FX.wtext(F.x, F.y - 240, 'DEPARTURE.', { size: 34, color: '#ffffff', stroke: '#c8102e', life: 50 });
  },
  ropes: [
    { id: 'tail1', at: sk => [sk.hip[0] - 9, sk.hip[1] - 6], n: 5, seg: 9, w0: 7, w1: 6, color: 'top', grav: 0.55, wind: 0.4 },
    { id: 'tail2', at: sk => [sk.hip[0] - 5, sk.hip[1] - 4], n: 5, seg: 9, w0: 6, w1: 5, color: 'top', grav: 0.6, wind: 0.3 },
  ],
  hairBack(g, r, c, R) { polyR(g, r, [[-0.9, -0.45], [-1.08, 0.3], [-0.6, 0.58], [-0.35, -0.2]], c.hair, R); },
  hairFront(g, r, c, R) {
    polyR(g, r, [[0.05, -0.4], [0.28, 0.38], [0.05, 0.22]], c.hair, R);
    polyR(g, r, [[-1.08, -0.42], [-0.95, -1.25], [0.72, -1.32], [1.02, -0.55]], '#f7f7f7', R);
    polyR(g, r, [[-1.08, -0.44], [1.02, -0.56], [1.0, -0.32], [-1.04, -0.2]], c.red, R);
    polyR(g, r, [[0.7, -0.44], [1.5, -0.32], [1.46, -0.22], [0.7, -0.28]], '#111116', R);
    if (R.mono) return;
    circ(g, 0.55 * r, -0.92 * r, 0.17 * r, c.gold, R);
    g.fillStyle = c.red; g.beginPath(); g.arc(0.55 * r, -0.92 * r, 0.07 * r, 0, TAU); g.fill();
    g.strokeStyle = c.gold; g.lineWidth = 2; g.beginPath(); g.moveTo(0.36 * r, -0.92 * r); g.lineTo(0.12 * r, -0.98 * r); g.moveTo(0.74 * r, -0.92 * r); g.lineTo(0.98 * r, -0.98 * r); g.stroke();
    g.strokeStyle = c.gold; g.lineWidth = 2.2; g.beginPath(); g.arc(0.52 * r, 0.06 * r, 0.3 * r, 0, TAU); g.stroke();
    g.lineWidth = 1.2; g.beginPath(); g.moveTo(0.3 * r, 0.26 * r); g.quadraticCurveTo(0.0, 0.8 * r, -0.2 * r, 0.3 * r); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.arc(0.52 * r, 0.06 * r, 0.22 * r, -2.4, -1.6); g.stroke();
  },
  neckWear(g, sk, p, c, R) {
    limb(g, [sk.neck[0] - 5, sk.neck[1] + 3], [sk.neck[0] + 6, sk.neck[1] + 1], 6.5, 6, '#ffffff', R);
    circ(g, sk.neck[0] + 6, sk.neck[1] + 5, 3.4, c.red, R);
  },
  torsoDetail(g, L, bw, c) {
    g.fillStyle = c.red; g.beginPath(); g.moveTo(6 * bw, -L - 1); g.lineTo(11 * bw, -L * 0.94); g.lineTo(10 * bw, -L * 0.5); g.lineTo(8 * bw, -L * 0.42); g.lineTo(6 * bw, -L * 0.5); g.closePath(); g.fill();
    g.strokeStyle = c.red; g.lineWidth = 3; g.beginPath(); g.moveTo(13 * bw, -L * 0.85); g.lineTo(11 * bw, 3); g.stroke();
    g.fillStyle = c.gold; for (const y of [-0.34, -0.2, -0.06]) { g.beginPath(); g.arc(4 * bw, y * L, 2.2, 0, TAU); g.fill(); }
    g.strokeStyle = c.gold; g.lineWidth = 1.6; g.beginPath(); g.moveTo(4 * bw, -L * 0.3); g.quadraticCurveTo(-4 * bw, -L * 0.18, -9 * bw, -L * 0.24); g.stroke();
    g.fillStyle = c.red; g.fillRect(-14 * bw, -L * 0.62, 6 * bw, 9);
  },
  shoulderOver(g, sk, p, c, R) {
    const [x, y] = sk.sF; g.save(); g.translate(x, y); g.rotate(p.fa1 * 0.3 - 0.1);
    poly(g, [[-11, -5], [13, -6], [14, 3], [-12, 4]], c.red, R, 3);
    if (!R.mono) { g.strokeStyle = c.gold; g.lineWidth = 1.5; for (let i = -10; i <= 12; i += 4) { g.beginPath(); g.moveTo(i, 4); g.lineTo(i, 9); g.stroke(); } }
    g.restore();
  },
  weaponFront(g, sk, p, c, R) {
    const [hx, hy] = sk.fh, a = p.wa, dx = Math.sin(a), dy = Math.cos(a), wl = clamp(p.wl, 0, 1.2), L = 30 + wl * 92;
    const tip = [hx + dx * L, hy + dy * L];
    if (wl < 0.35) {
      limb(g, [hx - dx * 6, hy - dy * 6], tip, 2.3, 2, '#141418', R);
      circ(g, tip[0], tip[1], 2.8, '#ffffff', R);
      if (!R.mono) { g.fillStyle = c.gold; g.beginPath(); g.arc(hx + dx * 7, hy + dy * 7, 3, 0, TAU); g.fill(); }
    } else {
      limb(g, [hx - dx * 6, hy - dy * 6], tip, 3.8, 3.4, '#ffffff', R);
      if (!R.mono) {
        g.strokeStyle = c.red; g.lineWidth = 6.6; g.lineCap = 'butt';
        for (let s = 10; s < L - 6; s += 26) { const e = Math.min(L - 6, s + 13); g.beginPath(); g.moveTo(hx + dx * s, hy + dy * s); g.lineTo(hx + dx * e, hy + dy * e); g.stroke(); }
        g.lineCap = 'round';
        g.save(); g.shadowColor = '#ff2a3a'; g.shadowBlur = 16; circ(g, tip[0], tip[1], 5, '#ff3a4a', R); g.restore();
      }
    }
  },
  weaponBack(g, sk, p, c, R) {
    if (p.pw < 0.5 || R.mono) return;
    const [hx, hy] = sk.bh;
    g.strokeStyle = c.gold; g.lineWidth = 1.4; g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo(hx - 10, hy + 30, sk.hip[0] + 4, sk.hip[1] - 14); g.stroke();
    g.save(); g.shadowColor = '#ffd870'; g.shadowBlur = 12; circ(g, hx + 4, hy - 6, 8, c.gold, R); g.restore();
    g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(hx + 4, hy - 6, 6, 0, TAU); g.fill();
    g.strokeStyle = '#222'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(hx + 4, hy - 6); g.lineTo(hx + 4, hy - 10.5); g.moveTo(hx + 4, hy - 6); g.lineTo(hx + 7.5, hy - 4.5); g.stroke();
  },
  moves: Object.assign(baseNormals({ dmg: 1.0, rng: 1.08 }), {
    sp1: {
      name: 'ALL ABOARD!', jp: '発車', desc: 'Whistles up a spectral train that charges across the whole arena. Crushes projectiles — jump over it!', special: 1, lvl: 4, poses: ['whistle', 'whistle'], st: 20, act: 1, rec: 28, cd: 110, sfx: 'whistle',
      tick(F, f) { if (f === 4) { FX.wtext(F.x, F.y - 235 * F.s, 'ALL ABOARD!', { size: 34, color: '#ffffff', stroke: '#c8102e', life: 40 }); Sound.speak('All aboard!', 0.45, 1); } if (f % 3 === 0 && f < 20) FX.p({ type: 'smoke', x: F.x + F.facing * 10, y: F.y - 170 * F.s, vx: rand(-1, 1), vy: -2, life: 24, size: 8, color: 'rgba(255,255,255,0.5)', add: false, grow: 0.4 }); },
      spawn: { f: 20, fn(F) { BT.spawn({ owner: F, kind: 'train', persist: 1, x: F.x - F.facing * 260, y: GROUND - 78, vx: F.facing * 15, w: 250, h: 150, dmg: 88, hs: 26, bs: 16, kb: 12, kd: 1, life: 150, str: 3, clash: 0, crush: 1, color: '#ff2a3a' }); Sound.play('trainRumble'); Sound.play('horn'); } },
    },
    sp1f: {
      name: 'RAILWAY CROSSING', jp: '踏切', desc: 'Barriers drop around the opponent and trap them while the bell rings; a train then tears through. Jump out or block.', special: 1, lvl: 4, poses: ['point', 'point'], st: 12, act: 1, rec: 24, cd: 150, sfx: 'ding',
      spawn: { f: 12, fn(F, O) { const tx = clamp(O.x, F.x - 700, F.x + 700); const p = BT.spawn({ owner: F, kind: 'crossing', persist: 1, x: tx, y: GROUND - 90, w: 190, h: 180, delay: 52, life: 12, dmg: 92, hs: 30, bs: 16, kb: 4, launch: -12, kd: 1, str: 3, clash: 0, color: '#ff2a3a', dir: O.x >= F.x ? 1 : -1 }); p.trapped = Math.abs(O.x - tx) < 100 && O.onGround; FX.wtext(tx, GROUND - 230, 'CROSSING CLOSED', { size: 26, color: '#ffffff', stroke: '#c8102e', life: 40 }); } },
    },
    counter: {
      name: 'TICKET PUNCH', jp: '改札', desc: 'Counter. Catches an attack with the baton: “Ticket, please.” — then a precise lance thrust.', special: 1, lvl: 4, counter: 1, poses: ['counterC', 'counterC'], st: 2, act: 22, rec: 16, cd: 100, sfx: 'clack',
      onCounter(F) { FX.wtext(F.x, F.y - 240 * F.s, 'TICKET, PLEASE.', { size: 28, color: '#ffffff', stroke: '#c8102e', life: 45 }); Sound.play('clack'); F.startMove('ticketPunch', true); },
    },
    ticketPunch: { name: 'TICKET PUNCH', jp: '改札鋏', lvl: 5, poses: ['counterC', 'thrust'], st: 3, act: 5, rec: 20, dmg: 98, hs: 30, kb: 14, kd: 1, hb: { x: 10, y: -172, w: 150, h: 56 }, invuln: [0, 10], str: 3, shake: 9,
      tick(F, f) { if (f === 4) Sound.play('clack'); } },
    sp2: {
      name: 'EXPRESS DELIVERY', jp: '特急便', desc: 'Vanishes, leaving a red-and-white afterimage, and reappears behind the opponent (hold ← to appear in front) with a baton strike.', special: 1, lvl: 4, poses: ['crouch', 'thrust'], st: 14, act: 4, rec: 16, dmg: 82, hs: 24, bs: 14, kb: 10,
      hb: { x: 0, y: -178, w: 138, h: 62 }, cd: 85, str: 3, invuln: [3, 13], sfx: 'whistle',
      onStart(F) { F.expFront = [1, 4, 7].includes(F.input.dir); F.afterimage = 14; },
      tick(F, f, O) {
        if (f === 4) { F.hidden = true; FX.burst(F.x, F.y - 100, '#ff2a3a', 12, 6); FX.burst(F.x, F.y - 100, '#ffffff', 10, 6); Sound.play('teleport'); F.exp0 = F.x; }
        if (f === 12) {
          const side = O.x > F.x ? 1 : -1, nx = clamp(F.expFront ? O.x - side * 95 : O.x + side * 85, 50, STAGE_W - 50);
          for (let i = 0; i < 14; i++) FX.p({ type: 'spark', x: lerp(F.exp0, nx, i / 13), y: F.y - 100 + rand(-30, 30), vx: Math.sign(nx - F.exp0) * 10, vy: 0, life: 12, size: 4, color: i % 2 ? '#ff2a3a' : '#ffffff' });
          F.x = nx; F.facing = O.x > F.x ? 1 : -1; F.hidden = false; F.afterimage = 10; FX.wtext(F.x, F.y - 230, 'EXPRESS!', { size: 28, color: '#fff', stroke: '#c8102e', life: 30 });
        }
      },
    },
    sp2d: {
      name: 'LAST DEPARTURE', jp: '最終発車', desc: 'A giant signal tracks the opponent: green, yellow... RED — then crashes down. Overhead: block standing.', special: 1, lvl: 4, poses: ['signal', 'signal'], st: 14, act: 1, rec: 24, cd: 160, sfx: 'ding',
      spawn: { f: 14, fn(F, O) { BT.spawn({ owner: F, kind: 'signal', persist: 1, x: O.x, y: GROUND - 150, w: 110, h: 300, delay: 56, life: 14, dmg: 105, hs: 30, bs: 18, kb: 3, launch: -10, kd: 1, type: 'overhead', str: 3, clash: 0, color: '#ff2a3a' }); FX.wtext(F.x, F.y - 235, 'LAST DEPARTURE.', { size: 28, color: '#ffffff', stroke: '#c8102e', life: 40 }); } },
    },
    ult: {
      name: 'THE FINAL EXPRESS', jp: '終着特急', desc: 'Ultimate. Checks his watch, whistles the arena into a phantom station and bats the foe into an oncoming train.', ult: 1, lvl: 6, cost: 100, poses: ['lunge_w', 'thrust'], st: 8, act: 16, rec: 30, dmg: 35, hs: 40, bs: 20, kb: 6,
      hb: { x: 0, y: -185, w: 130, h: 170 }, invuln: [0, 26], str: 3,
      tick(F, f) { if (f > 8 && f <= 24) { F.vx = F.facing * 15; F.ctrlVel = true; F.afterimage = 6; } },
      onHit(F, D) { BT.startCine(F, D, CINE.conductor, { zoom: 1.2 }); return true; },
    },
  }),
};
(() => {
  const M = CONDUCTOR.moves;
  Object.assign(M.L, { name: 'Baton Jab', poses: ['jab_w', 'jabC'] });
  Object.assign(M.M, { name: 'Polished Kick' });
  Object.assign(M.H, { name: 'Barrier Swing', poses: ['swingC_w', 'swingC'], st: 14, hb: { x: 15, y: -205, w: 128, h: 145 }, sw: { cx: -5, cy: -140, r: 118, a0: -2.0, a1: 0.6, color: '#ffffff' } });
  Object.assign(M.cM, { name: 'Low Baton Sweep', poses: ['crouch', 'lowC'], hb: { x: 20, y: -46, w: 118, h: 36 } });
  Object.assign(M.jH, { name: 'Air Baton Drop', poses: ['jheavy_w', 'jC'], hb: { x: 5, y: -128, w: 102, h: 102 } });
})();

CHARS.push(FROGS, CONDUCTOR);
