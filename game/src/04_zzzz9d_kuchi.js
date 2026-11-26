// ============================ KUCHISAKE-ONNA — THE SLIT-MOUTH WOMAN ============================
// Rushdown / mix-up / technical scissor fighter, from the Japanese urban legend (public-domain folklore): a pale
// woman in a long coat and a surgical mask, with large scissors, who asks "Am I pretty?".
// Stylized horror, no gore: the slit smile is unsettling through its proportions, not through injury detail.
// Systems: BEAUTY (scissor hits, hits right after a feint, cross-ups / lows / overheads, interrupts, the mask) →
//          TRUE SMILE at 100 (6 s, mask off: faster, follow-ups, stronger scissors) · mask state is draw-only
//          · NOW YOU SEE IT afterimages are harmless carriers (only the real one attacks) · Ult THE QUESTION.
const KU = '#e0203a', KU2 = '#5a0614', KUH = '#ffb4c0', KUD = '#120406';
const KU_TS = 360, KU_CALM = 200, KU_MASKOFF = 240;

// ---------------------------------- art ----------------------------------
// expressions (c.ex): null (masked: calm, polite eyes) · smile (unmasked: soft eyes, the long slit smile) ·
//   wide (unmasked: eyes wide, pin-point pupils, smile opened very wide) · angry · hurt / ko. c.mask = 1 draws the mask.
function kuEye(g, x, y, w, h, c, mode, far) {
  g.save();
  g.fillStyle = '#fff8f8'; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, TAU); g.fill();
  const wide = mode === 'wide', gr = g.createLinearGradient(0, y - h, 0, y + h);
  gr.addColorStop(0, c.eye2); gr.addColorStop(0.55, c.eye); gr.addColorStop(1, '#ff8a9a');
  if (wide && FX.hq) { g.shadowColor = KU; g.shadowBlur = 8; }
  g.fillStyle = gr; g.beginPath(); g.ellipse(x + w * 0.06, y + h * 0.05, w * (wide ? 0.6 : 0.84), h * (wide ? 0.62 : 0.88), 0, 0, TAU); g.fill(); g.shadowBlur = 0;
  if (wide) { g.fillStyle = '#100204'; g.beginPath(); g.ellipse(x + w * 0.1, y, w * 0.13, h * 0.14, 0, 0, TAU); g.fill(); }
  else {
    g.fillStyle = 'rgba(30,0,8,0.85)'; g.beginPath(); g.ellipse(x + w * 0.1, y + h * 0.06, w * 0.34, h * 0.4, 0, 0, TAU); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x - w * 0.28, y - h * 0.34, w * 0.28, h * 0.2, -0.3, 0, TAU); g.fill();
  }
  // slightly heavy upper lid (calm, polite) unless wide
  if (!wide) { g.fillStyle = c.skin; g.beginPath(); g.ellipse(x, y - h * 1.02, w * 1.3, h * 0.5, 0, 0, TAU); g.fill(); }
  g.strokeStyle = OUTLINE; g.lineCap = 'round'; g.lineWidth = Math.max(1.6, h * 0.22);
  g.beginPath(); g.moveTo(x - w * 1.12, y - h * (wide ? 0.7 : 0.48)); g.quadraticCurveTo(x, y - h * (wide ? 1.3 : 0.74), x + w * 1.08, y - h * (wide ? 0.72 : 0.5)); g.stroke();
  if (!far) { g.lineWidth = Math.max(1.1, h * 0.13); for (const [a, b] of [[1.0, 1.55], [0.8, 1.3]]) { g.beginPath(); g.moveTo(x - w * a, y - h * (wide ? 0.75 : 0.52)); g.lineTo(x - w * b, y - h * (wide ? 1.05 : 0.8)); g.stroke(); } }
  g.restore();
}
function kuMask(g, r, c, o) {   // the surgical mask over the lower face, ear loop to the ear
  g.save();
  g.strokeStyle = '#d8dce2'; g.lineWidth = 0.035 * r; g.beginPath(); g.moveTo(0.22 * r, 0.42 * r); g.quadraticCurveTo(0.0, 0.2 * r, -0.12 * r, 0.06 * r); g.moveTo(0.22 * r, 0.84 * r); g.quadraticCurveTo(0.02 * r, 0.6 * r, -0.12 * r, 0.24 * r); g.stroke();
  g.fillStyle = c.maskC || '#f2f4f6'; g.strokeStyle = OUTLINE; g.lineWidth = 2; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(0.2 * r, 0.42 * r); g.quadraticCurveTo(0.6 * r, 0.36 * r, 1.05 * r, 0.38 * r); g.quadraticCurveTo(1.12 * r, 0.62 * r, 1.0 * r, 0.86 * r); g.quadraticCurveTo(0.74 * r, 1.04 * r, 0.42 * r, 0.96 * r); g.quadraticCurveTo(0.16 * r, 0.8 * r, 0.2 * r, 0.42 * r); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(120,130,150,0.45)'; g.lineWidth = 0.03 * r;
  for (const y of [0.56, 0.68, 0.8]) { g.beginPath(); g.moveTo(0.26 * r, y * r); g.quadraticCurveTo(0.65 * r, (y + 0.05) * r, 1.04 * r, (y - 0.02) * r); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(0.78 * r, 0.5 * r, 0.16 * r, 0.05 * r, -0.1, 0, TAU); g.fill();
  g.restore();
}
function kuSmile(g, r, wide) {   // the slit smile: a long, thin curve from cheek to cheek, stitched scar lines at the ends
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  const op = wide ? 0.32 : 0.12, x0 = 0.1 * r, y0 = 0.36 * r, x1 = 1.02 * r, y1 = 0.42 * r, mx = 0.66 * r, my = (wide ? 0.86 : 0.8) * r;
  // open mouth: dark crescent between two curves
  g.fillStyle = '#2a0408'; g.strokeStyle = OUTLINE; g.lineWidth = 0.065 * r;
  g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx - 0.06 * r, my - op * r * 0.2, x1, y1); g.quadraticCurveTo(mx, my + op * r, x0, y0); g.closePath(); g.fill(); g.stroke();
  // teeth: a thin white band along the upper edge (two rows when wide)
  g.save(); g.clip();
  g.fillStyle = '#f4ece4'; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx - 0.06 * r, my - op * r * 0.2, x1, y1); g.lineTo(x1, y1 + 0.05 * r); g.quadraticCurveTo(mx - 0.06 * r, my - op * r * 0.2 + 0.07 * r, x0, y0 + 0.05 * r); g.closePath(); g.fill();
  if (wide) { g.beginPath(); g.moveTo(x0 + 0.1 * r, y0 + 0.08 * r); g.quadraticCurveTo(mx, my + op * r - 0.08 * r, x1 - 0.04 * r, y1 + 0.06 * r); g.lineTo(x1 - 0.04 * r, y1 + 0.12 * r); g.quadraticCurveTo(mx, my + op * r + 0.02 * r, x0 + 0.1 * r, y0 + 0.14 * r); g.closePath(); g.fill(); }
  g.strokeStyle = 'rgba(60,20,20,0.5)'; g.lineWidth = 0.02 * r; for (let i = 1; i < 9; i++) { const t = i / 9, x = lerp(x0, x1, t), y = lerp(y0, y1, t) + Math.sin(t * Math.PI) * (my - y0) * 0.9; g.beginPath(); g.moveTo(x, y - 0.06 * r); g.lineTo(x, y + 0.04 * r); g.stroke(); }
  g.restore();
  // scar lines past the corners, with small stitches (stylized, no blood)
  g.strokeStyle = '#8a2a36'; g.lineWidth = 0.035 * r;
  g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(0.05 * r, 0.3 * r, -0.02 * r, 0.22 * r); g.stroke();
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(1.06 * r, 0.34 * r); g.stroke();
  g.lineWidth = 0.022 * r; for (const [x, y] of [[0.1, 0.33], [0.03, 0.27]]) { g.beginPath(); g.moveTo(x * r - 0.03 * r, y * r - 0.04 * r); g.lineTo(x * r + 0.03 * r, y * r + 0.04 * r); g.stroke(); }
  g.restore();
}
function kuFace(g, r, c, o) {
  let e = c.ex || null;
  if (o.expr === 'hurt' || o.expr === 'ko') e = o.expr;
  if (!c.mask && !e) e = 'smile';
  if (e === 'hurt' || e === 'ko') {
    chibiFace(g, r, { ...c, noMouth: 1 }, { ...o, expr: e });
    if (c.mask) kuMask(g, r, c, o); else kuSmile(g, r, false);
    return;
  }
  const ex = 0.5 * r, ey = 0.22 * r, fx = 0.94 * r;
  const mode = e === 'wide' ? 'wide' : 'calm';
  kuEye(g, ex, ey, 0.22 * r, 0.34 * r, c, mode, false);
  kuEye(g, fx, ey - 0.01 * r, 0.08 * r, 0.29 * r, c, mode, true);
  if (e === 'smile' || e === 'wide') {   // lower lids pushed up by the smile
    g.save(); g.fillStyle = c.skin; g.beginPath(); g.ellipse(ex, ey + 0.42 * r, 0.3 * r, 0.14 * r, 0, Math.PI, TAU); g.fill(); g.restore();
  }
  // brows
  g.save(); g.strokeStyle = c.brow; g.lineCap = 'round'; g.lineWidth = 0.045 * r; g.beginPath();
  if (e === 'angry') { g.moveTo(ex - 0.22 * r, ey - 0.6 * r); g.lineTo(ex + 0.22 * r, ey - 0.42 * r); }
  else { g.moveTo(ex - 0.2 * r, ey - 0.54 * r); g.quadraticCurveTo(ex, ey - 0.64 * r, ex + 0.22 * r, ey - 0.56 * r); }
  g.stroke(); g.restore();
  // a faint cheek shadow
  g.fillStyle = 'rgba(150,60,80,0.18)'; g.beginPath(); g.ellipse(0.36 * r, 0.52 * r, 0.15 * r, 0.06 * r, 0, 0, TAU); g.fill();
  if (c.mask) kuMask(g, r, c, o); else kuSmile(g, r, e === 'wide');
}
function kuScissors(g, P, ang, open, c, R, big) {   // large tailor's scissors: two long blades on a pivot, red loop handles
  g.save(); g.translate(P[0], P[1]); g.rotate(ang);
  const L = big ? 64 : 44, o = clamp(open, 0, 1.8) * 0.32;
  const blade = (s) => {
    g.save(); g.rotate(s * o);
    poly(g, [[-2, -2.4 * s], [L * 0.35, -3.6 * s], [L, -0.4 * s], [L * 0.35, 1.2 * s], [-2, 1.6 * s]], R.mono || c.blade, R, 1.6);
    if (!R.mono) { g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1; g.beginPath(); g.moveTo(L * 0.2, -2.6 * s); g.lineTo(L * 0.92, -0.6 * s); g.stroke(); }
    // handle loop
    g.lineWidth = 3.4; g.strokeStyle = OUTLINE; g.beginPath(); g.ellipse(-9, 4 * s, 6.5, 4.4, 0.3 * s, 0, TAU); g.stroke();
    g.lineWidth = 2.2; g.strokeStyle = R.mono || c.handle; g.beginPath(); g.ellipse(-9, 4 * s, 6.5, 4.4, 0.3 * s, 0, TAU); g.stroke();
    g.restore();
  };
  blade(1); blade(-1);
  if (!R.mono) { g.fillStyle = '#6a6e78'; g.strokeStyle = OUTLINE; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 2.6, 0, TAU); g.fill(); g.stroke(); }
  g.restore();
}
const KUCHI = {
  id: 'kuchi', name: 'KUCHISAKE-ONNA', jp: '口裂け女', title: 'The Slit-Mouth Woman', titleJp: '口裂けの女',
  style: 'RUSHDOWN / MIX-UP', desc: 'A quiet, polite woman in a long coat and a surgical mask. She only wants to ask you one question. Then come the scissors — and the terrifying bursts of speed.',
  stats: { power: 4, speed: 5, range: 2, defense: 2 },
  scale: 1.0, health: 950, walk: 4.6, backWalk: 3.9, jumpV: -17, jumpX: 4.8, dashV: 14, backdashV: 10.5, backdashInv: 9, juggleMax: 6,
  voicePitch: 1.1, voiceRate: 0.82,
  colors: {
    skin: '#f8ece6', hair: '#120e14', hair2: '#231a26', top: '#c8b088', leg: '#2a2228', boot: '#2a1a1e', foot: '#2a1a1e', uarm: '#c8b088', farm: '#c8b088', hand: '#f8ece6', cuff: '#a8916a', belt: '#5a4430',
    eye: '#d0142c', eye2: '#4a0010', accent: KU, brow: '#2a1a22', warm: '#2a1a1e', sole: '#120a0c', pad: '#b01428', collar: '#b49a72',
    coat: '#c8b088', coat2: '#a8916a', lining: '#8a1020', scarf: '#b0142a', maskC: '#f2f4f6', blade: '#d8dce4', handle: '#b01020', ex: null, mask: 1,
  },
  afterColors: [KU, '#2a1018', '#ffffff'],
  hurt: { w: 48, h: 168 },
  stance: { t: 0.1, hd: 0.14, fa1: 0.45, fa2: 1.0, ba1: 0.2, ba2: 0.5, fl1: 0.34, fl2: 0.08, bl1: -0.3, bl2: -0.14, kp: 0, gr: 0 },
  poses: {
    tilt: { t: 0.06, hd: 0.62, fa1: 0.45, fa2: 0.95, ba1: 0.2, ba2: 0.5, kp: 0, gr: 0 },
    touch: { t: 0.02, hd: 0.35, fa1: 0.4, fa2: 2.78, ba1: 0.12, ba2: 0.3, kp: 0, gr: 1 },
    unmask: { t: -0.04, hd: 0.12, fa1: 0.75, fa2: 2.1, ba1: 0.1, ba2: 0.3, kp: 0, gr: 1 },
    smile: { t: 0.0, hd: 0.42, fa1: 0.3, fa2: 0.5, ba1: 0.2, ba2: 0.4, kp: 0.35, gr: 0 },
    snip_w: { t: 0.0, hd: 0.05, fa1: -0.35, fa2: 0.25, ba1: 0.5, ba2: 1.0, kp: 1, gr: 0 },
    snip: { t: 0.26, hd: 0.1, fa1: 1.55, fa2: 1.6, ba1: -0.3, ba2: 0.0, fl1: 0.55, bl1: -0.4, kp: 0, gr: 0 },
    slash_w: { t: -0.08, hd: 0.0, fa1: 2.6, fa2: 2.9, ba1: 0.3, ba2: 0.6, kp: 0.9, gr: 0 },
    slash: { t: 0.32, hd: 0.2, fa1: 0.95, fa2: 0.6, ba1: -0.4, ba2: -0.2, fl1: 0.6, bl1: -0.42, kp: 0.1, gr: 0 },
    open_wide: { t: 0.16, hd: -0.12, fa1: 1.45, fa2: 1.52, ba1: 1.3, ba2: 1.42, fl1: 0.4, bl1: -0.32, kp: 1.7, gr: 0 },
    dash_low: { t: 0.62, hd: -0.3, fa1: -0.6, fa2: -0.3, ba1: -0.9, ba2: -0.6, fl1: 1.0, fl2: 0.18, bl1: -0.75, bl2: -1.0, hipH: 72, kp: 0, gr: 0 },
    cover: { base: 'kneel', t: 0.5, hd: 0.62, fa1: 0.5, fa2: 2.85, ba1: 0.1, ba2: 0.1, kp: 0, gr: 1 },
    reach_mask: { base: 'down', fa1: 2.2, fa2: 2.5, gr: 1 },
    victory: { t: 0.0, hd: 0.3, fa1: 0.3, fa2: 0.55, ba1: 0.15, ba2: 0.35, fl1: 0.16, fl2: 0.04, bl1: -0.06, bl2: -0.2, kp: 0.3, gr: 0 },
    intro: { t: 0.04, hd: 0.5, fa1: 0.4, fa2: 2.78, ba1: 0.12, ba2: 0.3, fl1: 0.16, fl2: 0.04, bl1: -0.06, bl2: -0.2, kp: 0, gr: 1 },
    dive: { base: 'jump', t: 0.5, hd: 0.3, fa1: 2.4, fa2: 2.2, kp: 1.2, gr: 0 },
  },
  intro: 'Excuse me… may I ask you something?',
  wins: ['Am I pretty? …You don\'t have to answer anymore.', 'Now we match~', 'Shh. It\'s all right. It will only take a moment.'],
  ropes: [
    { id: 'hairA', at: (sk, r) => headPt(sk, -r * 0.82, -r * 0.25), n: 10, seg: 12, w0: 19, w1: 8, color: 'hair', grav: 0.56, wind: 0.42 },
    { id: 'hairB', at: (sk, r) => headPt(sk, -r * 0.4, -r * 0.66), n: 9, seg: 12, w0: 14, w1: 6, color: 'hair2', grav: 0.6, wind: 0.36 },
    { id: 'scarf', at: sk => [sk.neck[0] - 6, sk.neck[1] + 4], n: 6, seg: 10, w0: 7, w1: 5, color: 'scarf', grav: 0.32, wind: 0.85 },
  ],
  hairBack(g, r, c, R) {
    polyR(g, r, [[0.6, -0.86], [0.0, -1.18], [-0.76, -1.02], [-1.22, -0.42], [-1.24, 0.6], [-1.08, 1.32], [-0.72, 1.36], [-0.5, 0.9], [-0.3, 0.6], [-0.16, 0.4]], c.hair, R);
  },
  hairFront(g, r, c, R) {
    skullHair(g, r, c, R);
    // long side-swept bangs, a long lock framing the face
    polyR(g, r, [[-0.42, -0.94], [0.3, -1.08], [0.98, -0.8], [1.14, -0.3], [1.02, -0.18], [0.86, -0.36], [0.76, -0.06], [0.58, -0.32], [0.44, -0.04], [0.28, -0.38], [0.1, -0.2], [-0.02, -0.5]], c.hair, R);
    polyR(g, r, [[-0.3, -0.42], [0.02, -0.26], [0.08, 0.6], [0.02, 1.3], [-0.14, 1.42], [-0.26, 0.7], [-0.44, 0.0]], c.hair, R);
    polyR(g, r, [[0.96, -0.5], [1.14, -0.1], [1.12, 0.62], [1.0, 0.72], [0.92, 0.12]], c.hair2, R);
    if (!R.mono) { shine(g, r, [[-0.1, -0.9], [0.42, -0.94]], R); }
  },
  neckWear(g, sk, p, c, R) {   // coat collar + a red scarf wound once around the neck
    const n = sk.neck;
    poly(g, [[n[0] - 12, n[1] + 2], [n[0] - 8, n[1] - 6], [n[0] + 10, n[1] - 7], [n[0] + 12, n[1] + 1], [n[0] + 2, n[1] + 6]], R.mono || c.scarf, R, 2);
    poly(g, [[n[0] - 16, n[1] + 14], [n[0] - 12, n[1] + 2], [n[0] - 2, n[1] + 8], [n[0] - 6, n[1] + 22]], R.mono || c.collar, R, 2);
    poly(g, [[n[0] + 13, n[1] + 12], [n[0] + 11, n[1] + 1], [n[0] + 3, n[1] + 8], [n[0] + 7, n[1] + 20]], R.mono || c.collar, R, 2);
  },
  torsoDetail(g, L, bw, c) {   // double-breasted coat front: buttons, belt with buckle
    g.fillStyle = 'rgba(90,70,40,0.25)'; g.fillRect(1 * bw, -L * 0.8, 2, L * 0.8);
    g.fillStyle = '#6a5436'; for (const y of [0.62, 0.42]) for (const x of [-5, 7]) { g.beginPath(); g.arc(x * bw, -L * y, 1.6, 0, TAU); g.fill(); }
    g.fillStyle = c.belt; g.fillRect(-16 * bw, -L * 0.2, 32 * bw, 6);
    g.strokeStyle = '#c8b070'; g.lineWidth = 1.4; g.strokeRect(2 * bw, -L * 0.2 - 0.5, 6, 7);
  },
  drawSkirt(g, sk, p, c, R, o) {   // long coat tails to below the knee (red lining at the opening)
    const T = (o && o.T) || 0, h = sk.hip, fy = Math.max(sk.fk[1], sk.bk[1]) + 22, sw = Math.sin(T * 0.08) * 3, lean = clamp(p.t || 0, -0.5, 0.8), back = -lean * 18;
    const len = Math.max(20, fy - h[1]);
    poly(g, [[h[0] - 14, h[1] - 10], [h[0] - 30 + sw + back, h[1] + len], [h[0] - 4 + sw * 0.6 + back * 0.5, h[1] + len + 6], [h[0] + 2, h[1] + 4]], R.mono || c.lining, R, 2.2);
    poly(g, [[h[0] - 16, h[1] - 10], [h[0] - 36 + sw + back, h[1] + len - 4], [h[0] - 12 + sw * 0.6 + back * 0.6, h[1] + len + 4], [h[0] - 2, h[1] + 6], [h[0] + 6, h[1] + len * 0.5 + 4], [h[0] + 20 + sw * 0.4, h[1] + len - 2], [h[0] + 16, h[1] - 10]], R.mono || c.coat, R, 2.4);
    if (R.mono) return;
    g.strokeStyle = 'rgba(80,60,30,0.35)'; g.lineWidth = 1.4; for (const d of [-10, -22]) { g.beginPath(); g.moveTo(h[0] + d * 0.3, h[1]); g.lineTo(h[0] + d + sw + back * 0.6, h[1] + len - 2); g.stroke(); }
    g.strokeStyle = c.coat2; g.lineWidth = 2; g.beginPath(); g.moveTo(h[0] - 2, h[1] + 6); g.lineTo(h[0] + 6, h[1] + len * 0.5 + 4); g.stroke();
  },
  weaponFront(g, sk, p, c, R) {
    let a = Math.atan2(sk.fh[1] - sk.fe[1], sk.fh[0] - sk.fe[0]);
    const gr = clamp(p.gr || 0, 0, 1); if (gr > 0) a = lerp(a, Math.PI / 2 + 0.15, gr);   // dangling from the fingers while her hand is at her face
    kuScissors(g, sk.fh, a, p.kp || 0, c, R, false);
  },
};
makeChibi(KUCHI, { build: { arm: 0.95, leg: 1.0, torso: 0.98 }, colors: {} });
KUCHI.faceFn = kuFace;

// ---------------------------------- beauty ----------------------------------
const KU_PAL = {};
KUCHI.palette = F => {
  const ts = F.tsT > 0, mask = F.kuMask ? 1 : 0, ex = F.kuEx || null, key = (ts ? 't' : '') + mask + (ex || '');
  return KU_PAL[key] || (KU_PAL[key] = { ...KUCHI.colors, mask, ex, accent: ts ? '#ff1030' : KU });
};
function kuGain(F, n, label) {
  if (!F || F.ko || n <= 0 || F.tsT > 0 || F.calmT > 0) return;
  if (F.maskOffT > 0) n *= 1.5;   // mask-related: gains are stronger while the mask is off
  F.bea = clamp((F.bea || 0) + n, 0, 100); F.beaT = F.T;
  if (label) FX.wtext(F.x, F.y - 236 * F.s, label, { size: 18, color: KUH, stroke: KU2, life: 28 });
}
function kuTrueSmile(F) {
  F.tsT = KU_TS; F.bea = 100; F.tsExt = false; F.maskOffT = 0;
  FX.ring(F.x, F.y - 110, KU, 20, 320, 26, 6); FX.ring(F.x, F.y - 110, '#ffffff', 10, 160, 18, 3); FX.flashScreen('#1a0004', 14, 0.55);
  FX.wtext(F.x, F.y - 262, 'TRUE SMILE', { size: 38, color: '#ffffff', stroke: KU2, life: 70 });
  FX.wtext(F.x, F.y - 224, '— 本当の笑顔 —', { size: 22, font: FX_JP(), color: KUH, stroke: KUD, life: 70 });
  Sound.play('maskOff'); Sound.play('fear');
}
const kuSc = m => m && m.sc;
KUCHI.initFighter = F => { F.bea = 0; F.beaT = -999; F.tsT = 0; F.calmT = 0; F.maskOffT = 0; F.kuMask = 1; F.kuEx = null; F.feintT = -99; F.intT = -99; F.mixT = -99; F.tsExt = false; F.kuCine = null; };
KUCHI.walkMul = F => F.tsT > 0 ? 1.25 : 1;
KUCHI.dmgBonus = F => (F.tsT > 0 ? 1.06 : 1) * (F.maskOffT > 0 && F.state === 'attack' && kuSc(F.move) ? 1.1 : 1);
KUCHI.onDealDamage = (A, D) => {
  if (A.ko || A.state === 'cine') return;
  const m = A.state === 'attack' ? A.move : null;
  if (m && !m.ult && A.hitActive) kuGain(A, kuSc(m) ? (m.special || m.followup ? 4 : 2) : 1);
  if (A.T - A.feintT < 45 && A.T - A.mixT > 30) { A.mixT = A.T; kuGain(A, 6, 'FEINT'); }
  else if (A.T - A.mixT > 30 && D.onGround && Math.sign(A.x - D.x) !== D.facing && D.facing !== 0) { A.mixT = A.T; kuGain(A, 5, 'MIX-UP'); }   // hit from behind (cross-up)
  else if (m && (m.type === 'low' || m.type === 'overhead') && A.T - A.mixT > 30) { A.mixT = A.T; kuGain(A, 3); }
  if (D.state === 'attack' && D.move && D.mf <= (D.move.st || 0) + 1 && A.T - A.intT > 30) { A.intT = A.T; kuGain(A, 8, 'INTERRUPTED'); }
};
KUCHI.idlePose = F => { const k = F.T % 560; return k > 300 && k < 350 ? 'touch' : k > 140 && k < 200 ? 'tilt' : null; };
KUCHI.statePose = F => {
  if (F.state === 'defeat') return F.sf < 45 ? ['reach_mask', 0.18] : ['cover', 0.08];
  if (F.state === 'victory' && !F.cos) return [F.sf < 55 ? 'touch' : F.sf < 95 ? 'unmask' : 'smile', 0.1];
  return null;
};
KUCHI.tick = F => {
  const O = F.opp; if (!O) return;
  const live = BT && BT.phase === 'fight' && !F.ko;
  if (F.state !== 'attack' || !['sp1f', 'sp2d'].includes(F.moveKey)) F.hidden = F.state === 'cine' ? F.hidden : false;   // safety: vanishes never leak
  if (F.maskOffT > 0) F.maskOffT--;
  // the mask and expression follow what she is doing (draw-only)
  if (F.state !== 'cine') {
    const s = F.state, k = F.moveKey, ts = F.tsT > 0;
    let mask = !(ts || F.maskOffT > 0), e = null;
    if (s === 'victory') { mask = F.sf < 80; e = F.sf < 80 ? null : F.sf < 150 ? 'smile' : 'wide'; }
    else if (s === 'defeat' || (F.ko && s === 'knockdown')) { mask = false; e = 'angry'; }
    else if (s === 'attack' && k === 'sp2') { mask = F.mf < 26 && !ts; e = F.mf >= 26 ? 'wide' : null; }
    else if (s === 'attack' && (k === 'sp2f' || k === 'sp2d' || k === 'nysFront' || k === 'nysBack' || k === 'nysDrop' || k === 'prettyCut')) e = mask ? null : 'wide';
    else if (!mask) e = s === 'attack' ? 'wide' : 'smile';
    F.kuMask = mask ? 1 : 0; F.kuEx = e;
  }
  if (F.calmT > 0) F.calmT--;
  if (F.tsT > 0) {
    F.tsT--;
    xpHaste(F, 0.2);
    if (F.T % 5 === 0) FX.p({ type: 'spark', x: F.x + rand(-30, 30), y: F.y - rand(20, 190), vx: rand(-0.4, 0.4), vy: -rand(0.3, 1), life: 22, size: rand(1.5, 3), color: F.T % 2 ? KU : '#ff7080' });
    if (F.state === 'walk' || F.state === 'dash' || (F.state === 'attack' && F.move && F.move.special)) F.afterimage = Math.max(F.afterimage, 2);
    if (F.tsT === 0) { F.bea = 0; F.calmT = KU_CALM; FX.wtext(F.x, F.y - 230, '…', { size: 24, color: KUH, stroke: KU2, life: 40 }); Sound.play('maskOff'); }
  } else if (live) {
    if (F.bea >= 100) kuTrueSmile(F);
    else if (F.T - F.beaT > 360 && F.bea > 0) F.bea = Math.max(0, F.bea - 0.05);
    if (F.bea >= 60 && F.T % 18 === 0) Sound.play('breath');
  }
  // the fear debuff on the opponent (THE MASK COMES OFF)
  if (O.kuFearT > 0) { O.kuFearT--; if (O.T % 6 === 0 && !O.hidden) FX.p({ type: 'spark', x: O.x + rand(-26, 26), y: O.y - rand(140, 210), vx: 0, vy: 0.4, life: 18, size: 1.6, color: KU }); }
};
KUCHI.drawBehind = (g, F) => {
  if (F.tsT > 0 && FX.hq) {   // a faint red after-glow while TRUE SMILE runs
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.2 + 0.08 * Math.sin(F.T * 0.3);
    drawFigure(g, F.ch, F.pose, F.x + Math.sin(F.T * 0.8) * 2, F.y, F.facing, { mono: KU, scale: 1.05 }); g.restore();
  }
};
KUCHI.drawExtra = (g, F) => {
  const O = F.opp;
  if (O && O.kuFearT > 0 && !O.hidden && FX.hq) {   // TERRIFIED: they shake, a dark red tint
    g.save(); g.globalAlpha = 0.18 * Math.min(1, O.kuFearT / 20); drawFigure(g, O.ch, O.pose, O.x + Math.sin(O.T * 1.7) * 2, O.y, O.facing, { mono: '#3a0008' }); g.restore();
  }
  // a glint on the scissors now and then
  if (!F.hidden && FX.hq && (F.T % 90 < 6 || (F.state === 'attack' && kuSc(F.move) && F.mf % 8 < 2))) {
    const h = F.handW('f'); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#ffffff'; g.globalAlpha = 0.85;
    const x = h[0] + F.facing * 22, y = h[1] + 4, s = 6; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x, y - 1.4); g.lineTo(x + s, y); g.lineTo(x, y + 1.4); g.closePath(); g.moveTo(x, y - s); g.lineTo(x + 1.4, y); g.lineTo(x, y + s); g.lineTo(x - 1.4, y); g.closePath(); g.fill(); g.restore();
  }
};
KUCHI.introFx = F => { FX.wtext(F.x, F.y - 250, 'excuse me…', { size: 20, color: KUH, stroke: KU2, life: 60, vy: -0.3 }); Sound.play('breath'); };
const KU_POSE = {};
const kuPose = k => KU_POSE[typeof k === 'string' ? k : JSON.stringify(k)] || (KU_POSE[typeof k === 'string' ? k : JSON.stringify(k)] = buildPose(KUCHI, k));
const KU_DECOY = { ...KUCHI.colors, mask: 0, ex: 'wide' };
function kuDrawGhost(g, x, y, face, pose, a, T, o = {}) {
  if (!(a > 0.01)) return;
  const p = kuPose(pose);
  g.save(); g.globalAlpha = a * (o.fake && T % 7 === 0 ? 0.55 : 0.85);   // fakes flicker very slightly
  drawFigure(g, KUCHI, p, x, y, face, { pal: o.pal || KU_DECOY, T, scale: o.scale || 1 });
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * 0.22; drawFigure(g, KUCHI, p, x - face * 6, y, face, { mono: o.fake ? '#5a1830' : KU, scale: (o.scale || 1) * 1.02 });
  g.restore();
}
// ---------------------------------- projectiles ----------------------------------
EXTRA_PROJ.kuchiDecoy = {   // NOW YOU SEE IT: an afterimage approaching from its own direction (harmless; only the real one attacks)
  update(p) {
    const k = Math.min(1, p.t / p.dur); p.x = lerp(p.x0, p.x1, k); p.yy = lerp(p.y0, p.y1, k) - Math.sin(k * Math.PI) * (p.arc || 0);
    if (p.t === p.dur && p.fake) { for (let i = 0; i < 10; i++) FX.p({ type: 'smoke', x: p.x + rand(-20, 20), y: p.yy - rand(20, 170), vx: rand(-2, 2), vy: rand(-1, 1), life: 18, size: rand(5, 9), grow: 0.3, color: 'rgba(40,6,14,0.45)', add: false }); }
  },
  draw(g, p) {
    const a = Math.min(1, p.t / 4) * Math.min(1, p.life / 6), pose = p.t < p.dur ? (p.arc ? 'dive' : 'dash_low') : 'slash_w';
    kuDrawGhost(g, p.x, p.yy == null ? GROUND : p.yy, p.face, pose, a, p.t + (p.fake ? 3 : 0), { fake: p.fake });
    if (!p.fake && p.t % 6 < 2 && FX.hq) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#ffffff'; g.globalAlpha = 0.7 * a; g.beginPath(); g.arc(p.x + p.face * 30, (p.yy || GROUND) - 120, 3, 0, TAU); g.fill(); g.restore(); }   // the real one: a glint on the blades
  },
};
EXTRA_PROJ.kuchiShock = { update() {}, draw(g, p) {   // THE MASK COMES OFF: a psychological shockwave
  const k = 1 - p.life / p.max, r = 40 + k * 260;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = (1 - k) * 0.6; g.strokeStyle = KU; g.lineWidth = 6 * (1 - k) + 1;
  g.beginPath(); g.ellipse(p.x, p.y, r, r * 0.7, 0, 0, TAU); g.stroke();
  g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(p.x, p.y, r * 0.8, r * 0.56, 0, 0, TAU); g.stroke();
  g.restore();
} };
EXTRA_PROJ.kuchiCut = { update() {}, draw(g, p) {   // scissor impact: two crossing blade streaks
  const k = p.life / p.max, d = p.dir || 1;
  g.save(); g.globalCompositeOperation = 'lighter'; g.translate(p.x, p.y); g.scale(d, 1); g.globalAlpha = k;
  g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.moveTo(-40, -30); g.lineTo(40, 26); g.moveTo(-40, 26); g.lineTo(40, -30); g.stroke();
  g.strokeStyle = KU; g.lineWidth = 7; g.globalAlpha = k * 0.45; g.beginPath(); g.moveTo(-44, -32); g.lineTo(44, 28); g.moveTo(-44, 28); g.lineTo(44, -32); g.stroke();
  g.restore();
} };
function kuCutAt(F, D) { const c = D.chestW(); BT.spawn({ owner: F, kind: 'kuchiCut', x: c[0], y: c[1] - 20, vx: 0, w: 1, h: 1, life: 8, harmless: true, clash: 0, dir: F.facing }); Sound.play('snip'); }

// ---------------------------------- moves ----------------------------------
KUCHI.moves = Object.assign(baseNormals({ dmg: 0.98, spd: -1, rng: 0.95 }), {
  sp1: {
    name: 'SCISSOR STRIKE', jp: '鋏の一閃', desc: 'She draws the scissors and cuts twice — a fast horizontal slash and a second snip. Good combo starter, slightly punishable on block. +3 Beauty per hit. True Smile: press SP1 again on hit for a third, launching cut.', special: 1, lvl: 4, sc: 1,
    poses: ['snip_w', 'slash'], st: 6, act: 12, rec: 17, cd: 40, dmg: 30, hits: 2, interval: 7, hs: 18, bs: 9, kb: 2, hb: { x: 0, y: -165, w: 104, h: 76 }, str: 2, sfx: 'snip',
    final: { dmg: 36, kb: 6, hs: 24 },
    poseFn(F, f) { return f <= 6 ? 'snip_w' : f <= 12 ? 'slash' : f <= 22 ? 'snip' : 'stance'; },
    tick(F, f) { if (f <= 6) { F.vx = F.facing * 4; F.ctrlVel = true; } if (f === 7 || f === 14) Sound.play('snip'); },
    onHit(A, D) { kuCutAt(A, D); },
  },
  snipSnap: {
    name: 'SNIP SNAP', jp: 'ちょきん', desc: 'True Smile follow-up after Scissor Strike hits (SP1): a rising cut that launches.', followup: 1, lvl: 4.5, sc: 1,
    poses: ['slash_w', 'snip'], st: 5, act: 4, rec: 18, dmg: 44, hs: 30, bs: 10, kb: 3, launch: -12, hb: { x: 0, y: -200, w: 96, h: 120 }, str: 3, sfx: 'shear',
    onHit(A, D) { kuCutAt(A, D); },
  },
  sp1f: {
    name: 'VANISHING STEP', jp: '消える足音', desc: 'A dark distortion: she disappears (short, 7 f) and reappears close to them — BEHIND them by default (cross-up), in FRONT if you hold ←. Then a quick cut. Max ~380 px. She is visible and hittable for 5 f before the cut. +5 Beauty (feint bonus on hit). Clear cooldown.', special: 1, lvl: 4, sc: 1,
    poses: ['dash_low', 'slash'], st: 17, act: 4, rec: 20, cd: 150, dmg: 54, hs: 24, bs: 12, kb: 5, hb: { x: 0, y: -168, w: 92, h: 120 }, str: 2, sfx: 'kuchiVanish',
    onStart(F) { F.stepFront = F.input.fwd < 0; },
    poseFn(F, f) { return f <= 12 ? 'dash_low' : f <= 16 ? 'slash_w' : f <= 26 ? 'slash' : 'stance'; },
    tick(F, f) {
      const O = F.opp;
      if (f === 5) { F.hidden = true; F.vx = 0; for (let i = 0; i < 12; i++) FX.p({ type: 'smoke', x: F.x + rand(-20, 20), y: F.y - rand(20, 170), vx: rand(-1.5, 1.5), vy: rand(-1, 0.5), life: 20, size: rand(5, 9), grow: 0.3, color: 'rgba(40,6,14,0.5)', add: false }); Sound.play('kuchiVanish'); }
      if (f === 12) {
        const d = Math.sign(O.x - F.x) || F.facing, side = F.stepFront ? -d : d, tx = O.x + side * 70, dx = tx - F.x, max = 380;
        F.x = clamp(Math.abs(dx) > max ? F.x + Math.sign(dx) * max : tx, 50, STAGE_W - 50); F.facing = Math.sign(O.x - F.x) || F.facing;
        F.hidden = false; F.afterimage = 6; F.feintT = F.T; FX.ring(F.x, F.y - 100, KU, 70, 8, 10, 3); Sound.play('whoosh', 1.2);
      }
      if (f === 16) Sound.play('shear');
    },
    onStartCD(F) { },
    onHit(A, D) { kuGain(A, 5); kuCutAt(A, D); },
  },
  counter: {
    name: 'ARE YOU PRETTY?', jp: '私、きれい？', desc: 'She steps closer, tilts her head, touches her mask and asks: "Am I pretty?" — a counter window (f11–36). Strike her in it (melee or projectile) and she answers with a fast double cut that launches (+14 Beauty). Grabs, unblockables and ultimates beat it. If nobody answers, she follows up with a quick cut when close (a feint), or simply returns to neutral.', special: 1, lvl: 4,
    counter: 1, counterNoGrab: 1, poses: ['touch', 'tilt'], st: 10, act: 26, rec: 14, cd: 160, sfx: 'breath',
    poseFn(F, f) { return f <= 10 ? 'touch' : f <= 36 ? 'tilt' : 'stance'; },
    tick(F, f) {
      if (f === 1) F.askHit = false;
      if (f <= 10) { F.vx = F.facing * 2.2; F.ctrlVel = true; }
      if (f === 12) { FX.wtext(F.x + F.facing * 20, F.y - 236, 'Am I pretty?', { size: 22, color: '#ffffff', stroke: KU2, life: 46 }); Sound.speak('Am I pretty?', 1.15, 0.85); }
      if (f === 37 && !F.askHit) { F.feintT = F.T; if (Math.abs(F.opp.x - F.x) < 150) F.startMove('prettyFollow', true); }
    },
    onCounter(F, A, proj) {
      F.askHit = true; kuGain(F, 14, 'WRONG ANSWER'); F.afterimage = 10; Sound.play('shear');
      if (proj && Math.abs(A.x - F.x) > 240) { F.feintT = F.T; return; }   // a projectile from far away: she just tilts out of it
      F.startMove('prettyCut', true);
    },
  },
  prettyCut: {
    name: 'WRONG ANSWER', jp: '答え違い', desc: 'Counter attack of Are You Pretty?: two fast cuts, the second launches.', lvl: 5, sc: 1,
    poses: ['slash_w', 'slash'], st: 4, act: 8, rec: 18, dmg: 36, hits: 2, interval: 5, hs: 22, bs: 10, kb: 3, hb: { x: 0, y: -175, w: 110, h: 110 }, invuln: [0, 8], str: 3, sfx: 'shear',
    final: { launch: -11, dmg: 40, hs: 28 },
    tick(F, f) { if (f <= 4) { F.vx = F.facing * 7; F.ctrlVel = true; } },
    onHit(A, D) { kuCutAt(A, D); },
  },
  prettyFollow: {
    name: 'NO ANSWER?', jp: '無言？', desc: 'Nobody answered Are You Pretty?: she steps in with a quick cut.', lvl: 4.5, sc: 1,
    poses: ['snip_w', 'snip'], st: 6, act: 4, rec: 16, dmg: 40, hs: 20, bs: 10, kb: 4, hb: { x: 0, y: -165, w: 96, h: 70 }, str: 2, sfx: 'snip',
    tick(F, f) { if (f <= 6) { F.vx = F.facing * 6; F.ctrlVel = true; } },
    onHit(A, D) { kuCutAt(A, D); },
  },
  sp2: {
    name: 'THE MASK COMES OFF', jp: 'マスクを外す', desc: 'She slowly reaches for the mask, pulls it down and smiles. A psychological shockwave (~280 px) leaves the opponent TERRIFIED (slower walk for 1.5 s). +30 Beauty, and for 4 s her Beauty gains are ×1.5 and scissor attacks deal +10%. Slow startup, long cooldown. During True Smile it instead extends True Smile once (no stacking).', special: 1, lvl: 4,
    poses: ['touch', 'unmask'], st: 30, act: 1, rec: 18, cd: 600, sfx: 'maskOff',
    poseFn(F, f) { return f <= 14 ? 'touch' : f <= 30 ? 'unmask' : f <= 44 ? 'smile' : 'stance'; },
    tick(F, f) {
      const O = F.opp;
      if (f === 16) Sound.play('maskOff');
      if (f === 30) {
        if (F.tsT > 0) {
          if (!F.tsExt) { F.tsExt = true; F.tsT += 90; FX.wtext(F.x, F.y - 240, 'SMILE~', { size: 22, color: '#ffffff', stroke: KU2, life: 40 }); }
        } else { F.maskOffT = KU_MASKOFF; kuGain(F, 20, 'THE MASK COMES OFF'); }   // ×1.5 while the mask is off = +30
        BT.spawn({ owner: F, kind: 'kuchiShock', x: F.x, y: F.y - 110, vx: 0, w: 1, h: 1, life: 26, harmless: true, clash: 0 });
        FX.flashScreen('#1a0004', 8, 0.35); Sound.play('fear');
        if (Math.abs(O.x - F.x) < 280 && !O.hidden && O.invuln <= 0 && O.state !== 'cine') {
          O.slowT = Math.max(O.slowT, 90); O.kuFearT = 90;
          FX.wtext(O.x, O.y - 240 * O.s, 'TERRIFIED', { size: 22, color: '#ffffff', stroke: KU2, life: 40 });
        }
      }
    },
  },
  sp2f: {
    name: 'OPEN WIDE', jp: '大きく開けて', desc: 'Command grab: she suddenly rushes forward with the scissors wide open (clear 14 f approach). If she catches them: two cuts and a strong kick (150 damage, 175 in True Smile). Unblockable, beats blocking; jump, back off or hit her during the rush. Long recovery and cooldown.', special: 1, lvl: 4, sc: 1,
    poses: ['dash_low', 'open_wide'], st: 14, act: 6, rec: 30, cd: 330, dmg: 1, type: 'unblock', grab: 1, hb: { x: 0, y: -172, w: 84, h: 166 }, str: 3, sfx: 'snip',
    poseFn(F, f) { return f <= 10 ? 'dash_low' : f <= 26 ? 'open_wide' : 'stance'; },
    tick(F, f) { if (f >= 3 && f <= 16) { F.vx = F.facing * (F.tsT > 0 ? 12.5 : 11.5); F.ctrlVel = true; F.afterimage = Math.max(F.afterimage, 3); } if (f === 3) Sound.play('whoosh', 1.4); },
    onHit(F, D) { BT.startCine(F, D, CINE.kuchiOpen, { zoom: 1.35 }); return true; },
  },
  sp2d: {
    name: 'NOW YOU SEE IT', jp: '見えた？', desc: 'She melts into a dark distortion; three afterimages rush in from different directions — in front, behind, and dropping from above. Only one is really her (a faint glint on her blades; the fakes flicker): she attacks from that spot (front = mid, behind = cross-up, above = overhead). Block correctly or back off. +6 Beauty on hit.', special: 1, lvl: 4,
    poses: ['tilt', 'tilt'], st: 30, act: 1, rec: 1, cd: 300, sfx: 'kuchiVanish',
    poseFn(F, f) { return 'tilt'; },
    tick(F, f) {
      const O = F.opp;
      if (f === 1) F.nysReal = Math.floor(Math.random() * 3);   // seeded online (NetRng)
      if (f === 6) {
        F.hidden = true; F.vx = 0; Sound.play('kuchiVanish'); FX.flashScreen('#120004', 5, 0.25);
        for (let i = 0; i < 14; i++) FX.p({ type: 'smoke', x: F.x + rand(-22, 22), y: F.y - rand(20, 170), vx: rand(-2, 2), vy: rand(-1, 0.5), life: 22, size: rand(5, 10), grow: 0.3, color: 'rgba(40,6,14,0.5)', add: false });
        const d = Math.sign(O.x - F.x) || F.facing, ox = clamp(O.x, 120, STAGE_W - 120);
        const spots = [{ x: ox - d * 78, arc: 0 }, { x: ox + d * 78, arc: 0 }, { x: ox - d * 40, arc: 180 }];
        F.nysSpots = spots;
        spots.forEach((s, i) => BT.spawn({ owner: F, kind: 'kuchiDecoy', x: F.x, y: GROUND, x0: F.x + (i === 1 ? d * 40 : -d * 20), x1: clamp(s.x, 50, STAGE_W - 50), y0: GROUND, y1: GROUND, yy: GROUND, arc: s.arc, dur: 18, vx: 0, w: 1, h: 1, life: i === F.nysReal ? 19 : 26, harmless: true, clash: 0, fake: i !== F.nysReal, face: Math.sign(ox - s.x) || d }));
      }
      if (f === 24 && F.nysSpots) {
        const s = F.nysSpots[F.nysReal] || F.nysSpots[0];
        F.x = clamp(s.x, 50, STAGE_W - 50); F.facing = Math.sign(O.x - F.x) || F.facing; F.hidden = false; F.afterimage = 6;
        F.startMove(['nysFront', 'nysBack', 'nysDrop'][F.nysReal] || 'nysFront', true);
      }
    },
  },
  nysFront: {
    name: 'NOW YOU SEE IT (FRONT)', jp: '見えた？', desc: 'The real one, in front.', lvl: 4.5, sc: 1,
    poses: ['slash_w', 'slash'], st: 6, act: 5, rec: 22, dmg: 66, hs: 26, bs: 12, kb: 8, hb: { x: 0, y: -175, w: 100, h: 130 }, str: 3, sfx: 'shear',
    onHit(A, D) { kuGain(A, 6, 'NOW YOU SEE IT'); kuCutAt(A, D); },
  },
  nysBack: {
    name: 'NOW YOU SEE IT (BEHIND)', jp: '見えた？', desc: 'The real one, behind them (cross-up).', lvl: 4.5, sc: 1,
    poses: ['slash_w', 'slash'], st: 6, act: 5, rec: 22, dmg: 62, hs: 26, bs: 12, kb: 8, hb: { x: 0, y: -175, w: 100, h: 130 }, str: 3, sfx: 'shear',
    onHit(A, D) { kuGain(A, 6, 'NOW YOU SEE IT'); kuCutAt(A, D); },
  },
  nysDrop: {
    name: 'NOW YOU SEE IT (ABOVE)', jp: '見えた？', desc: 'The real one, dropping from above (overhead).', lvl: 4.5, sc: 1, type: 'overhead',
    poses: ['dive', 'slash'], st: 7, act: 5, rec: 22, dmg: 60, hs: 26, bs: 12, kb: 6, hb: { x: 0, y: -195, w: 96, h: 150 }, str: 3, sfx: 'shear',
    onHit(A, D) { kuGain(A, 6, 'NOW YOU SEE IT'); kuCutAt(A, D); },
  },
  ult: {
    name: 'THE QUESTION', jp: '問いかけ', desc: 'Ultimate. She steps right up to them (short reach). If it connects: the world goes dark and she asks — "Am I pretty?" The mask comes down. Then she is behind them, beside them, everywhere, faster and faster… and asks one final time.', ult: 1, lvl: 6, cost: 100, sc: 1,
    poses: ['touch', 'snip'], st: 9, act: 6, rec: 34, dmg: 20, hs: 40, bs: 20, kb: 1, hb: { x: 0, y: -200, w: 124, h: 200 }, invuln: [0, 15], str: 3, sfx: 'breath',
    tick(F, f) { if (f <= 8) { F.vx = F.facing * 6; F.ctrlVel = true; } },
    onHit(F, D) { BT.startCine(F, D, CINE.kuchi, { zoom: 1.5 }); return true; },
  },
});
addFollowup(KUCHI, 'sp1', { btn: 'sp1', move: 'snipSnap', noMotion: true, cond: F => F.tsT > 0 });
(() => {
  const M = KUCHI.moves;
  Object.assign(M.L, { name: 'Snip', sc: 1, poses: ['snip_w', 'snip'], sfx: 'snip' });
  Object.assign(M.M, { name: 'Heel Kick' });
  Object.assign(M.H, { name: 'Shear', sc: 1, poses: ['slash_w', 'slash'], sfx: 'shear', hb: { x: 15, y: -182, w: 92, h: 70 } });
  Object.assign(M.cL, { name: 'Low Snip', sc: 1 });
  Object.assign(M.cM, { name: 'Shin Kick' });
  Object.assign(M.cH, { name: 'Hem Cut', sc: 1 });
  Object.assign(M.jH, { name: 'Falling Shears', sc: 1, poses: ['dive', 'slash'] });
  Object.assign(M.LH, { name: 'Rising Cut', sc: 1, poses: ['slash_w', 'snip'] });
  Object.assign(M.FF, { name: 'Sudden Rush', sc: 1, poses: ['dash_low', 'snip'], vx: 12 });
})();
// the True Smile cooldown bonus on Vanishing Step
{ const m = KUCHI.moves.sp1f, os = m.onStart; m.onStart = F => { os(F); if (F.tsT > 0) F.kuHalfCD = true; }; m.tick = (t => (F, f) => { t(F, f); if (f === 2 && F.kuHalfCD) { F.cd.sp1f = Math.round((m.cd || 0) / 2); F.kuHalfCD = false; } })(m.tick); delete m.onStartCD; }
// CPU hints
KUCHI.moves.sp1f.__ai = { reach: 380, kind: 'melee', anti: false, st: 17, low: false, over: false };
KUCHI.moves.counter.__ai = { reach: 160, kind: 'counter', anti: false, st: 10, low: false, over: false };
KUCHI.moves.sp2.__ai = { reach: 260, kind: 'buff', anti: false, st: 30, low: false, over: false };
KUCHI.moves.sp2f.__ai = { reach: 200, kind: 'grab', anti: false, st: 14, low: false, over: false };
KUCHI.moves.sp2d.__ai = { reach: 420, kind: 'melee', anti: false, st: 30, low: false, over: false };
KUCHI.combos = [
  { name: 'Scissor Strike', notation: 'L → M → SP1 (Scissor Strike)', seq: ['L', 'M', 'sp1'] },
  { name: 'Shear Cut', notation: 'M → H (Shear) → SP1 (Scissor Strike)', seq: ['M', 'H', 'sp1'] },
  { name: 'Vanishing Step', notation: 'M → H → ↓→SP1 (Vanishing Step)', seq: ['M', 'H', 'sp1f'] },
  { name: 'Snip Snap', notation: 'True Smile: M → SP1 → SP1 (Snip Snap)', seq: ['M', 'sp1', 'snipSnap'], ts: 1 },
  { name: 'The Question', notation: 'L → M → SP1+SP2 (Ultimate)', seq: ['L', 'M', 'ult'], meter: 1 },
];
KUCHI.applyTrial = (A, tr) => { if (!tr) return; if (tr.meter) A.meter = 100; if (tr.ts) { A.tsT = 99999; A.bea = 100; } };

// ---------------------------------- cinematics ----------------------------------
// OPEN WIDE (command grab)
CINE.kuchiOpen = function (A, D, f, c) {
  const dir = A.facing, ts = A.tsT > 0;
  if (f === 1) { D.x = clamp(A.x + dir * 72, 60, STAGE_W - 60); D.y = GROUND; D.forcePose = 'hit'; A.forcePose = 'open_wide'; A.kuMask = 0; A.kuEx = 'wide'; c.zoom = 1.4; FX.darkTarget = 0.35; Sound.play('snip'); }
  if (f === 14) { A.forcePose = 'slash'; BT.scriptHit(A, D, 40, { str: 2, sfx: 'shear' }); kuCutAt(A, D); D.forcePose = 'hit2'; }
  if (f === 26) { A.forcePose = 'slash_w'; }
  if (f === 32) { A.forcePose = 'snip'; BT.scriptHit(A, D, 40, { str: 2, sfx: 'shear' }); kuCutAt(A, D); D.forcePose = 'hit'; FX.shakeIt(6); }
  if (ts && f === 42) { A.forcePose = 'slash'; BT.scriptHit(A, D, 25, { str: 2, sfx: 'shear' }); kuCutAt(A, D); }
  if (f === 52) A.forcePose = 'kick_w';
  if (f === 58) { A.forcePose = 'kick'; BT.scriptHit(A, D, 70, { str: 3 }); FX.shakeIt(12); FX.impactFrame(2); }
  if (f >= 64) { kuGain(A, 8); FX.darkTarget = 0; A.kuEx = null; BT.release(D, dir * 13, -7); return true; }
};
// THE QUESTION
CINE.kuchi = function (A, D, f, c) {
  const dir = A.facing;
  if (f === 1) {
    A.x = clamp(A.x, 240, STAGE_W - 240); D.x = clamp(A.x + dir * 120, 120, STAGE_W - 120); D.y = GROUND; D.forcePose = 'stance'; A.forcePose = 'stance';
    c.ax0 = A.x; c.df0 = D.facing; c.zoom = 1.5; c.camX = (A.x + D.x) / 2; c.camY = GROUND - 150; c.bg = KUCHI.cineBg; c.fg = KUCHI.cineFg; c.A = A; c.D = D;
    c.dark = 0; c.close = 0; c.glints = []; c.ghosts = []; c.cuts = []; c.flash = 0; c.dist = 0; c.red = 0;
    A.kuCine = { mask: 1, ex: null };
    FX.darkTarget = 0; Sound.play('breath');
  }
  const setFace = (mask, ex) => { A.kuCine = { mask, ex }; };
  // --- 1: THE ENCOUNTER — dark; masked; she tilts her head; "Am I pretty?"; silence ---
  if (f <= 40) c.dark = f / 40 * 0.7;
  if (f === 14) A.forcePose = 'tilt';
  if (f >= 10 && f < 70) { const k = easeInOut((f - 10) / 60); c.zoom = lerp(1.5, 2.1, k); c.camX = lerp((A.x + D.x) / 2, A.x + dir * 10, k); c.camY = lerp(GROUND - 150, A.y - 175, k); }
  if (f === 30) { FX.wtext(A.x + dir * 30, A.y - 236, 'Am I pretty?', { size: 26, color: '#ffffff', stroke: KU2, life: 50 }); Sound.speak('Am I pretty?', 1.1, 0.8); }
  // --- 2: THE MASK — she pulls it down; the slit smile; a close-up ---
  if (f === 70) A.forcePose = 'touch';
  if (f === 86) { A.forcePose = 'unmask'; Sound.play('maskOff'); }
  if (f === 98) { setFace(0, 'smile'); c.close = 1; Sound.play('fear'); }
  if (f >= 98 && f < 128) { c.zoom = lerp(c.zoom, 2.6, 0.1); c.camY = lerp(c.camY, A.y - 205, 0.12); }
  if (f === 118) setFace(0, 'wide');
  // --- 3: THE PURSUIT — gone; behind them, beside them, in front… faster; afterimages surround them ---
  if (f === 130) { A.hidden = true; c.close = 0; c.zoom = 1.35; c.camX = D.x; c.camY = GROUND - 150; Sound.play('kuchiVanish'); A.forcePose = 'slash_w'; }
  if (f >= 134 && f <= 150) { D.forcePose = 'stance'; if (f === 142) D.facing = -D.facing; if (f === 150) D.facing = c.df0; }
  const pops = [152, 172, 188, 200, 209, 216, 221, 225];
  const offs = [-dir * 90, -70, 90, -110, 120, -60, 70, -95];
  for (let i = 0; i < pops.length; i++) if (f === pops[i]) { const ox = offs[i]; c.ghosts.push({ x: D.x + ox, f: f, face: Math.sign(-ox) || 1, i }); c.glints.push({ x: D.x + ox * 0.6, y: GROUND - 150, t: 0 }); Sound.play(i % 2 ? 'snip' : 'whoosh', 1.3); FX.shakeIt(2); }
  for (const q of c.glints) q.t++;
  // --- 4: THE ATTACK — the afterimages vanish; the real one is right in front of them; a flurry of cuts ---
  if (f === 232) { c.ghosts = []; A.hidden = false; A.x = clamp(D.x - D.facing * 86, 60, STAGE_W - 60); A.facing = Math.sign(D.x - A.x) || 1; setFace(0, 'wide'); c.zoom = 1.5; c.camX = (A.x + D.x) / 2; Sound.play('shear'); }
  if (f >= 236 && f <= 286) {
    A.forcePose = (f >> 2) % 2 ? 'slash' : 'snip'; D.forcePose = (f >> 2) % 2 ? 'hit' : 'hit2'; A.afterimage = 4;
    if ((f - 236) % 5 === 0) { BT.scriptHit(A, D, 11, { str: 1, sfx: 'snip' }); const ch = D.chestW(); c.cuts.push({ x: ch[0] + rand(-30, 30), y: ch[1] + rand(-50, 30), a: rand(-1, 1), t: 0 }); FX.shakeIt(3); }
    c.camX = lerp(c.camX, (A.x + D.x) / 2 + Math.sin(f * 0.6) * 12, 0.3); c.red = Math.min(0.5, c.red + 0.02);
  }
  for (const q of c.cuts) q.t++;
  c.cuts = c.cuts.filter(q => q.t < 10);
  // --- 5: THE FINAL SMILE — she stops right in front of them; "Am I pretty?" one last time; the final cut ---
  if (f === 290) { A.forcePose = 'smile'; D.forcePose = 'hit'; setFace(0, 'wide'); c.red = 0.2; }
  if (f >= 290 && f < 330) { c.zoom = lerp(c.zoom, 2.3, 0.08); c.camX = lerp(c.camX, A.x + dir * 10, 0.1); c.camY = lerp(c.camY, A.y - 190, 0.1); }
  if (f === 300) { FX.wtext(A.x + dir * 30, A.y - 240, 'Am I pretty?', { size: 30, color: '#ffffff', stroke: KU2, life: 40 }); Sound.speak('Am I pretty?', 1.0, 0.7); }
  if (f === 326) { A.forcePose = 'slash_w'; c.zoom = 1.5; c.camX = (A.x + D.x) / 2; c.camY = GROUND - 150; }
  if (f === 332) {
    A.forcePose = 'slash'; BT.scriptHit(A, D, 150, { str: 4, sfx: 'shear' }); FX.impactFrame(5); FX.shakeIt(26); Sound.play('shear'); Sound.play('impactBig');
    c.flash = 1; c.dist = 1; const ch = D.chestW(); c.cuts.push({ x: ch[0], y: ch[1], a: 0.6, t: -6, big: 1 }); c.cuts.push({ x: ch[0], y: ch[1], a: -0.6, t: -6, big: 1 });
    FX.wtext(D.x, D.y - 260, '口裂け', { size: 64, font: FX_JP(), color: '#ffffff', stroke: KU, life: 60, vy: -0.3 });
  }
  if (c.flash > 0) c.flash = Math.max(0, c.flash - 0.06);
  if (c.dist > 0) c.dist = Math.max(0, c.dist - 0.025);
  // --- 6: AFTERMATH — the world returns; she calmly puts the mask back on; she tilts her head; they fall ---
  if (f > 334) { c.dark = Math.max(0, c.dark - 0.03); c.red = Math.max(0, c.red - 0.02); c.zoom = lerp(c.zoom, 1.3, 0.06); c.camX = lerp(c.camX, (A.x + D.x) / 2, 0.06); c.camY = lerp(c.camY, GROUND - 160, 0.08); }
  if (f === 350) { A.forcePose = 'touch'; Sound.play('maskOff'); }
  if (f === 364) setFace(1, null);
  if (f === 374) A.forcePose = 'tilt';
  if (f === 360) D.forcePose = 'kneel';
  if (f >= 392) { D.facing = c.df0; A.kuCine = null; FX.darkTarget = 0; BT.release(D, dir * 3, -4); return true; }
};
KUCHI.cineBg = (g, c) => {   // darkness behind the fighters
  if (c.dark > 0.01) {
    g.save(); g.globalAlpha = Math.min(0.9, c.dark);
    const gr = g.createRadialGradient(W / 2, H * 0.55, 40, W / 2, H * 0.55, W * 0.7); gr.addColorStop(0, '#1a0a10'); gr.addColorStop(1, '#030102');
    g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  }
};
KUCHI.cineFg = (g, c) => {
  const cam = BT && BT.cam; if (!cam) return;
  const z = cam.z;
  // afterimages surrounding them, appearing faster and faster
  for (const q of c.ghosts) {
    const [sx, sy] = cam.toScreen(q.x, GROUND), age = c.f - q.f;
    kuDrawGhost(g, sx, sy, q.face, q.i % 2 ? 'slash_w' : 'dash_low', Math.min(1, age / 3) * 0.85, c.f + q.i, { scale: z, fake: true, pal: KU_DECOY });
  }
  // light catching the scissors between appearances
  for (const q of c.glints) if (q.t < 10) {
    const [sx, sy] = cam.toScreen(q.x, q.y), s = (10 - q.t) * 2.2 * z;
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#ffffff'; g.globalAlpha = 1 - q.t / 10;
    g.beginPath(); g.moveTo(sx - s, sy); g.lineTo(sx, sy - s * 0.2); g.lineTo(sx + s, sy); g.lineTo(sx, sy + s * 0.2); g.closePath(); g.moveTo(sx, sy - s); g.lineTo(sx + s * 0.2, sy); g.lineTo(sx, sy + s); g.lineTo(sx - s * 0.2, sy); g.closePath(); g.fill(); g.restore();
  }
  // cut streaks
  for (const q of c.cuts) if (q.t >= 0) {
    const [sx, sy] = cam.toScreen(q.x, q.y), L = (q.big ? 220 : 70) * z, k = 1 - q.t / 10;
    g.save(); g.globalCompositeOperation = 'lighter'; g.translate(sx, sy); g.rotate(q.a); g.globalAlpha = k;
    g.strokeStyle = '#ffffff'; g.lineWidth = (q.big ? 5 : 2.5) * z; g.beginPath(); g.moveTo(-L, 0); g.lineTo(L, 0); g.stroke();
    g.strokeStyle = KU; g.globalAlpha = k * 0.5; g.lineWidth = (q.big ? 14 : 6) * z; g.beginPath(); g.moveTo(-L * 0.9, 0); g.lineTo(L * 0.9, 0); g.stroke(); g.restore();
  }
  // the close-up: a soft dark frame around her face
  if (c.close > 0.01) { g.save(); const gr = g.createRadialGradient(W / 2, H * 0.42, H * 0.18, W / 2, H * 0.42, W * 0.6); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,0,4,0.75)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
  if (c.red > 0.01) { g.save(); g.globalAlpha = c.red * 0.5; const gr = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75); gr.addColorStop(0, 'rgba(120,0,20,0)'); gr.addColorStop(1, 'rgba(120,0,20,1)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
  if (c.dist > 0.01 && FX.hq) {   // a brief visual distortion: horizontal tears across the screen
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = c.dist * 0.5;
    for (let i = 0; i < 8; i++) { const y = (i * 97 + c.f * 13) % H, off = Math.sin(c.f * 0.9 + i * 2) * 40 * c.dist; g.fillStyle = i % 2 ? 'rgba(255,40,70,0.5)' : 'rgba(255,255,255,0.35)'; g.fillRect(off, y, W, 4 + (i % 3) * 3); }
    g.restore();
  }
  if (c.flash > 0.01) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = c.flash * 0.8; g.fillStyle = '#ffd0d8'; g.fillRect(0, 0, W, H); g.restore(); }
};
// the ult drives the mask directly (A.kuCine) while the cine runs
{ const t = KUCHI.tick; KUCHI.tick = F => { t(F); if (F.state === 'cine' && F.kuCine) { F.kuMask = F.kuCine.mask; F.kuEx = F.kuCine.ex; } }; }

// ---------------------------------- HUD + how-to ----------------------------------
function kuScissorIcon(g, x, y, s, col) {
  g.save(); g.translate(x, y); g.rotate(-0.6); g.strokeStyle = OUTLINE; g.lineWidth = 1.2; g.fillStyle = col;
  for (const sg of [1, -1]) { g.save(); g.rotate(sg * 0.32); g.beginPath(); g.moveTo(0, -1.5 * sg); g.lineTo(s * 1.4, -0.3 * sg); g.lineTo(0, 1.2 * sg); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(-s * 0.45, sg * s * 0.18, s * 0.3, s * 0.2, 0, 0, TAU); g.lineWidth = 2; g.strokeStyle = KU; g.stroke(); g.restore(); }
  g.restore();
}
KUCHI.drawHand = (g, F, side, t) => {
  const ts = F.tsT > 0, calm = F.calmT > 0, off = F.maskOffT > 0;
  xpPanel(g, F, side, t, {
    col: ts ? '#ff1030' : KU, col2: '#ffffff', icon: '', flash: ts,
    title: ts ? 'TRUE SMILE' : calm ? 'BEAUTY · MASK ON' : off ? 'BEAUTY · MASK OFF' : 'BEAUTY',
    sub: ts ? '本当の笑顔 · FASTER · FOLLOW-UPS · SHARPER' : calm ? 'composing herself… no gain' : off ? '×1.5 gain · scissors +10%' : '美 · scissors, feints, cross-ups, interrupts',
    k: ts ? F.tsT / KU_TS : (F.bea || 0) / 100, label: ts ? `${(F.tsT / 60).toFixed(1)}s` : `${Math.floor(F.bea || 0)}`, marks: [0.6],
    badges: [['sp1', 'S1|SCISSOR'], ['sp1f', '↓→S1|VANISH'], ['counter', '↓←S1|PRETTY?'], ['sp2', 'S2|MASK'], ['sp2f', '↓→S2|OPEN'], ['sp2d', '↓↓S2|SEE IT']],
  });
  const pw = 330, x0 = side > 0 ? 40 : W - 40 - pw, ix = side > 0 ? x0 + 30 : x0 + pw - 36, iy = 560 + 36;
  kuScissorIcon(g, ix, iy, 11, ts ? '#ffffff' : (F.bea || 0) >= 60 ? '#ffd0d8' : 'rgba(255,255,255,0.6)');
};
KUCHI.howTo = {
  title: 'KUCHISAKE-ONNA',
  draw(g) {
    xpHowTo(g, 'KUCHISAKE-ONNA — THE SLIT-MOUTH WOMAN', KU, [
      ['BEAUTY', 'Grows with scissor hits (+2, specials +4), hits right after a feint (+6), cross-ups (+5), lows/overheads (+3), interrupts (+8) and The Mask Comes Off (+30). ×1.5 while the mask is off.'],
      ['TRUE SMILE', 'At 100: 6 s with the mask off — faster attacks and walk, +6% damage, Scissor Strike → SP1 Snip Snap, half Vanishing Step cooldown, stronger Open Wide. Then the mask goes back on.'],
      ['SP1', 'Scissor Strike — fast two-cut combo starter. Slightly punishable on block.'],
      ['↓→ SP1', 'Vanishing Step — vanishes and reappears behind them (hold ← for in front), then a quick cut.'],
      ['↓← SP1', 'Are You Pretty? — counter window; attack her and she cuts back. Nobody answers: a quick feint cut.'],
      ['SP2', 'The Mask Comes Off — slow; terrifies them (slower), big Beauty gain, stronger scissors for 4 s.'],
      ['↓→ SP2', 'Open Wide — rushing command grab with the scissors wide open. Beats blocking; jump it.'],
      ['↓↓ SP2', 'Now You See It — three afterimages (front / behind / above); only the glinting one is real.'],
    ], 'Get close and stay unpredictable: feints, cross-ups, then the scissors. She has no real ranged tool. Ultimate (SP1+SP2): THE QUESTION.');
  },
};

CHARS.push(KUCHI);
finalizeMoves(KUCHI);
