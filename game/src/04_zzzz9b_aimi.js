// ============================ AIMI — THE DEVOTED GAZE ============================
// Rushdown / ranged pressure. An ORIGINAL yandere-archetype design (own name, own outfits): a sweet pink-haired
// schoolgirl with long twin tails, a compact pistol and a stare that never leaves her opponent.
// Systems: OBSESSION (hits, gun hits, combos, interrupts, catching a retreating opponent) → UNSTABLE LOVE at 100
//          (5.5 s: faster attacks, stronger gun, extra hits, then a short calm with no gain) · pistol normals + 6 specials ·
//          Ult THE SKY BREAKS (she vanishes, tears the sky open and reaches through it with a giant hand).
// Skins (purely visual, Mastery colour slots): 0 school uniform · 1–2 recolours · 3 MIDNIGHT DRESS (clear Arcade with her)
//          · 4 LAST HORIZON cloak (Mastery LV 10).
const AM = '#ff4f8b', AM2 = '#6e0a2c', AMH = '#ffc0d6', AMR = '#ff1f4a', AMD = '#14060c';
const AIM_UL = 330, AIM_CALM = 240;

// ---------------------------------- art ----------------------------------
function aimEye(g, x, y, w, h, c, mode, far) {   // mode: 'sweet' | 'stare' (tiny pupil, no shine) | 'wild' (glowing, shaking pupil)
  g.save();
  g.fillStyle = '#fffafc'; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, TAU); g.fill();
  const wild = mode === 'wild', stare = mode === 'stare' || wild;
  const iris = wild ? AMR : c.eye, gr = g.createLinearGradient(0, y - h, 0, y + h);
  gr.addColorStop(0, c.eye2); gr.addColorStop(0.5, iris); gr.addColorStop(1, wild ? '#ffd0dc' : '#ffe0ea');
  if (wild && FX.hq) { g.shadowColor = AMR; g.shadowBlur = 9; }
  const ir = stare ? 0.62 : 0.86;
  g.fillStyle = gr; g.beginPath(); g.ellipse(x + w * 0.06, y + h * 0.04, w * ir, h * (stare ? 0.66 : 0.9), 0, 0, TAU); g.fill(); g.shadowBlur = 0;
  if (stare) {   // a thin dark ring and a pin-point pupil
    g.strokeStyle = c.eye2; g.lineWidth = Math.max(0.8, w * 0.1); g.beginPath(); g.ellipse(x + w * 0.06, y + h * 0.04, w * ir, h * 0.66, 0, 0, TAU); g.stroke();
    g.fillStyle = '#12020a'; g.beginPath(); g.ellipse(x + w * 0.1, y + h * 0.02, w * 0.14, h * 0.16, 0, 0, TAU); g.fill();
    if (!wild) { g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(x - w * 0.24, y - h * 0.3, w * 0.12, 0, TAU); g.fill(); }
  } else {
    g.fillStyle = 'rgba(40,0,16,0.85)'; g.beginPath(); g.ellipse(x + w * 0.1, y + h * 0.04, w * 0.38, h * 0.42, 0, 0, TAU); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x - w * 0.3, y - h * 0.36, w * 0.34, h * 0.24, -0.3, 0, TAU); g.fill();
    g.beginPath(); g.arc(x + w * 0.42, y + h * 0.46, w * 0.16, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,160,200,0.5)'; g.beginPath(); g.ellipse(x + w * 0.1, y + h * 0.5, w * 0.4, h * 0.16, 0, 0, TAU); g.fill();   // soft pink reflection
  }
  g.strokeStyle = OUTLINE; g.lineCap = 'round'; g.lineWidth = Math.max(1.6, h * 0.24);
  g.beginPath(); g.moveTo(x - w * 1.15, y - h * 0.62); g.quadraticCurveTo(x, y - h * 1.32, x + w * 1.08, y - h * 0.72); g.stroke();
  if (!far) { g.lineWidth = Math.max(1.2, h * 0.14); g.beginPath(); g.moveTo(x - w * 1.0, y - h * 0.7); g.lineTo(x - w * 1.55, y - h * 1.02); g.stroke(); g.beginPath(); g.moveTo(x - w * 0.8, y - h * 0.86); g.lineTo(x - w * 1.25, y - h * 1.28); g.stroke(); }
  g.restore();
}
// expressions: normal (sweet), smile (^^), calm (half-lidded), stare (obsessive), grin (aggressive smile), crazy (wild + shadow),
//              smirk (small unsettling smile), angry (frustrated), hurt / ko (shared chibi face)
function aimFace(g, r, c, o) {
  let e = c.ex || o.expr || 'normal';
  if (o.expr === 'hurt' || o.expr === 'ko') e = o.expr;
  if (e === 'shout') e = c.ul ? 'crazy' : 'grin';
  if (e === 'hurt' || e === 'ko') { chibiFace(g, r, c, { ...o, expr: e }); return; }
  const ex = 0.5 * r, ey = 0.26 * r, fx = 0.94 * r, mx = 0.72 * r, my = 0.72 * r;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  // blush: soft for sweet faces, a deeper flush when she is obsessive
  const flush = e === 'stare' || e === 'crazy' || e === 'smirk';
  g.fillStyle = flush ? 'rgba(255,40,90,0.42)' : 'rgba(255,110,150,0.3)';
  g.beginPath(); g.ellipse(0.34 * r, 0.56 * r, 0.16 * r, 0.065 * r, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(0.93 * r, 0.52 * r, 0.06 * r, 0.05 * r, 0, 0, TAU); g.fill();
  if (flush) { g.strokeStyle = 'rgba(200,20,70,0.5)'; g.lineWidth = 0.025 * r; for (const d of [-0.08, 0, 0.08]) { g.beginPath(); g.moveTo(0.28 * r + d * r, 0.5 * r); g.lineTo(0.24 * r + d * r, 0.6 * r); g.stroke(); } }
  if (e === 'smile') {   // closed happy eyes
    g.strokeStyle = OUTLINE; g.lineWidth = 0.08 * r;
    g.beginPath(); g.moveTo(ex - 0.2 * r, ey + 0.08 * r); g.quadraticCurveTo(ex, ey - 0.16 * r, ex + 0.22 * r, ey + 0.06 * r); g.stroke();
    g.lineWidth = 0.06 * r; g.beginPath(); g.moveTo(fx - 0.07 * r, ey + 0.06 * r); g.quadraticCurveTo(fx, ey - 0.08 * r, fx + 0.06 * r, ey + 0.04 * r); g.stroke();
  } else {
    const mode = e === 'crazy' ? 'wild' : e === 'stare' || e === 'smirk' || c.ul ? 'stare' : 'sweet';
    aimEye(g, ex, ey, 0.23 * r, 0.37 * r, c, mode, false);
    aimEye(g, fx, ey - 0.01 * r, 0.08 * r, 0.31 * r, c, mode, true);
    if (e === 'calm') {   // heavy lids
      g.fillStyle = c.skin; g.beginPath(); g.ellipse(ex, ey - 0.3 * r, 0.3 * r, 0.22 * r, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(fx, ey - 0.3 * r, 0.12 * r, 0.2 * r, 0, 0, TAU); g.fill();
      g.strokeStyle = OUTLINE; g.lineWidth = 0.07 * r; g.beginPath(); g.moveTo(ex - 0.24 * r, ey - 0.1 * r); g.quadraticCurveTo(ex, ey - 0.06 * r, ex + 0.24 * r, ey - 0.12 * r); g.stroke();
    }
    if (e === 'grin') { g.fillStyle = c.skin; g.beginPath(); g.ellipse(ex, ey + 0.4 * r, 0.3 * r, 0.14 * r, 0, Math.PI, TAU); g.fill(); }   // smiling lower lids
    if (e === 'crazy') {   // a shadow falls over her eyes
      const sh = g.createLinearGradient(0, -0.4 * r, 0, 0.3 * r); sh.addColorStop(0, 'rgba(40,0,20,0.55)'); sh.addColorStop(1, 'rgba(40,0,20,0)');
      g.fillStyle = sh; g.fillRect(-0.1 * r, -0.45 * r, 1.2 * r, 0.75 * r);
      g.strokeStyle = 'rgba(60,0,30,0.55)'; g.lineWidth = 0.02 * r; for (let i = 0; i < 6; i++) { const x = 0.15 * r + i * 0.15 * r; g.beginPath(); g.moveTo(x, -0.3 * r); g.lineTo(x - 0.04 * r, -0.05 * r); g.stroke(); }
    }
    // brows
    g.strokeStyle = c.brow; g.lineWidth = 0.045 * r; g.beginPath();
    if (e === 'angry') { g.moveTo(ex - 0.22 * r, ey - 0.6 * r); g.lineTo(ex + 0.22 * r, ey - 0.44 * r); }
    else if (e === 'stare' || e === 'crazy' || e === 'smirk') { g.moveTo(ex - 0.2 * r, ey - 0.5 * r); g.quadraticCurveTo(ex, ey - 0.62 * r, ex + 0.22 * r, ey - 0.58 * r); }   // raised, soft — the scary part is that she looks happy
    else { g.moveTo(ex - 0.2 * r, ey - 0.5 * r); g.quadraticCurveTo(ex, ey - 0.58 * r, ex + 0.22 * r, ey - 0.52 * r); }
    g.stroke();
  }
  // mouth
  g.strokeStyle = OUTLINE; g.lineWidth = 0.045 * r;
  if (e === 'crazy') {   // wide open smile with teeth
    g.fillStyle = '#5a0a22'; g.beginPath(); g.moveTo(mx - 0.16 * r, my - 0.06 * r); g.quadraticCurveTo(mx, my + 0.2 * r, mx + 0.14 * r, my - 0.08 * r); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ffffff'; g.fillRect(mx - 0.11 * r, my - 0.05 * r, 0.22 * r, 0.035 * r);
  } else if (e === 'grin') {
    g.fillStyle = '#6a1030'; g.beginPath(); g.moveTo(mx - 0.12 * r, my - 0.04 * r); g.quadraticCurveTo(mx, my + 0.13 * r, mx + 0.11 * r, my - 0.05 * r); g.closePath(); g.fill(); g.stroke();
  } else if (e === 'smile' || e === 'normal') {
    g.beginPath(); g.moveTo(mx - 0.1 * r, my - 0.03 * r); g.quadraticCurveTo(mx, my + 0.08 * r, mx + 0.1 * r, my - 0.04 * r); g.stroke();
  } else if (e === 'smirk' || e === 'stare') {   // a thin, too-wide smile
    g.beginPath(); g.moveTo(mx - 0.15 * r, my - 0.06 * r); g.quadraticCurveTo(mx - 0.02 * r, my + 0.05 * r, mx + 0.13 * r, my - 0.07 * r); g.stroke();
  } else if (e === 'angry') {
    g.fillStyle = '#5a1020'; g.beginPath(); g.moveTo(mx - 0.09 * r, my + 0.02 * r); g.lineTo(mx + 0.09 * r, my); g.lineTo(mx + 0.07 * r, my + 0.06 * r); g.lineTo(mx - 0.07 * r, my + 0.07 * r); g.closePath(); g.fill(); g.stroke();
  } else { g.beginPath(); g.moveTo(mx - 0.05 * r, my); g.lineTo(mx + 0.06 * r, my - 0.01 * r); g.stroke(); }   // calm
  g.restore();
}
function aimGun(g, P, ang, c, R, big) {   // compact pistol: dark slide, black grip with a little pink heart sticker
  g.save(); g.translate(P[0], P[1]); g.rotate(ang);
  const L = big ? 30 : 26, h = 4.6;
  poly(g, [[-3, -h], [L, -h], [L + 1, -1], [L, h * 0.35], [3, h * 0.6], [-3, h * 0.6]], R.mono || c.gun, R, 1.8);   // slide + barrel
  poly(g, [[-2, 0], [6, 0], [3, 13], [-5, 12]], R.mono || c.grip, R, 1.8);                                           // grip
  if (!R.mono) {
    g.strokeStyle = '#6a6a7a'; g.lineWidth = 1; for (const x of [4, 7, 10]) { g.beginPath(); g.moveTo(x, -h + 1); g.lineTo(x, -1); g.stroke(); }   // serrations
    g.strokeStyle = OUTLINE; g.lineWidth = 1.2; g.beginPath(); g.arc(8, 3.4, 3.4, 0, Math.PI); g.stroke();   // trigger guard
    g.fillStyle = c.heart || AM; g.beginPath(); g.moveTo(0.4, 7.5); g.bezierCurveTo(-2.6, 5, -1.2, 3, 0.4, 4.6); g.bezierCurveTo(2, 3, 3.4, 5, 0.4, 7.5); g.fill();
  }
  g.restore();
}
function aimTie(g, x, y, c, R, k) {   // hair tie: two small baubles + a ribbon (skin-dependent)
  if (R.mono) return;
  g.save(); g.translate(x, y); g.strokeStyle = OUTLINE; g.lineWidth = 1;
  g.fillStyle = c.tie; g.beginPath(); g.moveTo(0, 0); g.lineTo(-7 * k, -5 * k); g.lineTo(-7 * k, 5 * k); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(0, 0); g.lineTo(7 * k, -5 * k); g.lineTo(7 * k, 5 * k); g.closePath(); g.fill(); g.stroke();
  if (c.rose) { g.fillStyle = c.rose; g.beginPath(); g.arc(0, 0, 4 * k, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = '#4a0010'; g.beginPath(); g.arc(0.5 * k, -0.4 * k, 2 * k, 0.5, 5); g.stroke(); }
  else { g.fillStyle = c.tie2; g.beginPath(); g.arc(0, -2.6 * k, 2.6 * k, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(0, 2.6 * k, 2.6 * k, 0, TAU); g.fill(); g.stroke(); }
  g.restore();
}
const AIMI = {
  id: 'aimi', name: 'AIMI', jp: 'アイミ', title: 'The Devoted Gaze', titleJp: '執愛の瞳',
  style: 'RUSHDOWN / GUNS', desc: 'A sweet, smiling girl who has decided her opponent belongs to her. She chases relentlessly and mixes quick strikes with pistol shots.',
  stats: { power: 4, speed: 4, range: 3, defense: 2 },
  scale: 1.0, health: 960, walk: 4.3, backWalk: 3.6, jumpV: -17, jumpX: 4.6, dashV: 12.5, backdashV: 10, backdashInv: 9, juggleMax: 6,
  voicePitch: 1.35, voiceRate: 0.95,
  colors: {
    skin: '#fde9e2', hair: '#f58fb5', hair2: '#e86e9e', top: '#f7f5fa', leg: '#fde9e2', boot: '#2a1820', foot: '#2a1820', uarm: '#f7f5fa', farm: '#f7f5fa', hand: '#fde9e2', cuff: '#262a46', belt: '#262a46',
    eye: '#e8265e', eye2: '#3a0016', accent: AM, brow: '#c9587e', warm: '#f6f4f8', sole: '#3a1a26', pad: AM, collar: '#262a46',
    plaid: '#2c3150', plaid2: '#1f2340', plaidLine: '#ff86ae', vest: '#262a46', ribbon: '#e0123c', tie: '#e0123c', tie2: '#ff9ab8',
    gun: '#2c2c36', grip: '#16141a', heart: AM, phone: '#ff9ac0', ul: false, ex: null, skin3: 0, skin4: 0,
  },
  afterColors: [AM, '#ffffff', AMR],
  hurt: { w: 50, h: 168 },
  stance: { t: 0.1, hd: 0.04, fa1: 0.32, fa2: 0.62, ba1: 0.5, ba2: 2.3, fl1: 0.32, fl2: 0.06, bl1: -0.26, bl2: -0.16 },
  poses: {
    hairfix: { t: -0.02, hd: 0.22, fa1: 0.3, fa2: 0.55, ba1: 2.1, ba2: 3.5 },
    stare: { t: 0.0, hd: 0.3, fa1: 0.1, fa2: 0.12, ba1: -0.06, ba2: 0.06, fl1: 0.12, fl2: 0.04, bl1: -0.1, bl2: -0.08 },
    reach: { t: 0.06, hd: 0.1, fa1: 0.95, fa2: 1.2, ba1: 0.5, ba2: 2.3 },
    draw: { t: -0.04, hd: 0.05, fa1: -0.55, fa2: -0.25, ba1: 0.6, ba2: 2.2, fl1: 0.3, fl2: 0.06, bl1: -0.26, bl2: -0.16 },
    aim: { t: 0.04, hd: 0.02, fa1: 1.55, fa2: 1.58, ba1: 0.4, ba2: 2.2, fl1: 0.36, fl2: 0.06, bl1: -0.28, bl2: -0.12 },
    aim2: { t: 0.06, hd: 0.0, fa1: 1.52, fa2: 1.57, ba1: 1.38, ba2: 1.52, fl1: 0.42, fl2: 0.06, bl1: -0.34, bl2: -0.14 },
    aim_low: { t: 0.16, hd: 0.3, fa1: 0.95, fa2: 0.85, ba1: 0.9, ba2: 0.9, fl1: 0.46, fl2: 0.1, bl1: -0.36, bl2: -0.16 },
    aim_up: { t: -0.12, hd: -0.25, fa1: 2.5, fa2: 2.7, ba1: 0.3, ba2: 1.8 },
    recoil: { t: -0.08, hd: -0.12, fa1: 1.85, fa2: 2.05, ba1: 1.5, ba2: 1.8, fl1: 0.3, fl2: 0.06, bl1: -0.3, bl2: -0.12 },
    crouch_run: { t: 0.62, hd: -0.32, fa1: 0.1, fa2: 0.3, ba1: -0.9, ba2: -0.6, fl1: 1.0, fl2: 0.18, bl1: -0.75, bl2: -1.0, hipH: 72 },
    knee: { t: 0.2, hd: 0.0, fa1: 0.4, fa2: 0.8, ba1: -0.5, ba2: -0.2, fl1: 1.7, fl2: 0.35, bl1: -0.2, bl2: -0.1 },
    heel: { t: -0.3, hd: 0.1, fa1: 0.9, fa2: 1.4, ba1: -0.6, ba2: 0.1, fl1: 2.35, fl2: 2.5, bl1: -0.08, bl2: -0.04 },
    spin: { t: 0.3, hd: -0.1, fa1: 1.6, fa2: 1.6, ba1: -1.4, ba2: -1.3, fl1: 0.6, fl2: 0.2, bl1: -0.6, bl2: -0.3 },
    peek: { t: 0.42, hd: 0.55, fa1: 0.25, fa2: 0.08, ba1: 0.4, ba2: 0.3 },
    victory: { t: -0.04, hd: 0.3, fa1: 0.95, fa2: 2.7, ba1: 0.75, ba2: 2.8, fl1: 0.16, fl2: 0.04, bl1: -0.04, bl2: -0.2 },
    claim: { t: 0.08, hd: 0.2, fa1: 1.35, fa2: 1.6, ba1: 0.7, ba2: 2.7, fl1: 0.2, fl2: 0.04, bl1: -0.1, bl2: -0.1 },
    defeat: { base: 'kneel', t: 0.55, hd: 0.45, fa1: 0.15, fa2: 0.05, ba1: -0.1, ba2: -0.05 },
    defeat2: { base: 'kneel', t: 0.22, hd: -0.12, fa1: 0.75, fa2: 2.0, ba1: 0.12, ba2: 0.02 },
    intro: { t: -0.04, hd: 0.3, fa1: -0.4, fa2: -0.15, ba1: -0.45, ba2: -0.2, fl1: 0.1, fl2: 0.06, bl1: -0.06, bl2: -0.24 },
    wave: { t: -0.04, hd: 0.25, fa1: -0.4, fa2: -0.15, ba1: 2.4, ba2: 3.1 },
  },
  intro: 'Found you~ Don\'t worry. I\'ll never let you go.',
  wins: ['You looked at me. So now you\'re mine~', 'See? We\'re together now. Forever.', 'Don\'t cry. I\'ll take good care of you.'],
  ropes: [
    { id: 'tailB', at: (sk, r) => headPt(sk, -r * 0.8, -r * 0.5), n: 9, seg: 12, w0: 15, w1: 6, color: 'hair', grav: 0.55, wind: 0.5 },
    { id: 'tailF', at: (sk, r) => headPt(sk, r * 0.02, -r * 0.92), n: 8, seg: 12, w0: 12, w1: 5, color: 'hair2', grav: 0.58, wind: 0.42 },
  ],
  hairBack(g, r, c, R, o) {
    const sw = Math.sin((o && o.T || 0) * 0.05) * 0.04;
    polyR(g, r, [[0.62, -0.88], [0.0, -1.2], [-0.74, -1.06], [-1.22, -0.46], [-1.26, 0.5], [-1.12 + sw, 1.2], [-0.82 + sw, 1.32], [-0.6, 0.9], [-0.36, 0.7], [-0.2, 0.46]], c.hair, R);
    if (!c.hood) polyR(g, r, [[-0.66, -0.74], [-1.2, -0.66], [-1.62 + sw, -0.1], [-1.66 + sw, 0.8], [-1.42 + sw, 1.5], [-1.24, 0.8], [-1.1, 0.0], [-0.86, -0.36]], c.hair2, R);   // root of the near twin tail (the rope continues it)
  },
  hairFront(g, r, c, R, o) {
    skullHair(g, r, c, R);
    polyR(g, r, [[-0.38, -0.98], [0.3, -1.08], [0.96, -0.78], [1.15, -0.2], [1.0, -0.02], [0.9, -0.26], [0.78, 0.04], [0.64, -0.3], [0.5, -0.02], [0.36, -0.34], [0.2, -0.12], [0.08, -0.46]], c.hair, R);   // choppy fringe
    polyR(g, r, [[-0.18, -0.4], [0.12, -0.22], [0.2, 0.6], [0.12, 1.18], [-0.08, 1.3], [-0.16, 0.66], [-0.32, 0.0]], c.hair, R);   // side lock in front of the ear
    polyR(g, r, [[0.96, -0.5], [1.12, -0.1], [1.1, 0.5], [0.98, 0.62], [0.92, 0.12]], c.hair2, R);   // far side lock
    if (!R.mono) { shine(g, r, [[-0.1, -0.88], [0.46, -0.9]], R); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.05 * r; g.beginPath(); g.arc(0.1 * r, -0.3 * r, 0.8 * r, -2.2, -1.5); g.stroke(); }
    if (c.hood) return;
    aimTie(g, -0.8 * r, -0.5 * r, c, R, r / 26);
    aimTie(g, 0.02 * r, -0.92 * r, c, R, r / 30);
  },
  neckWear(g, sk, p, c, R) {
    const n = sk.neck;
    if (c.skin3) {   // MIDNIGHT DRESS: black lace choker with a red rose
      poly(g, [[n[0] - 9, n[1] - 4], [n[0] + 9, n[1] - 6], [n[0] + 10, n[1] - 1], [n[0] - 9, n[1] + 1]], R.mono || '#120c12', R, 2);
      if (R.mono) return;
      g.fillStyle = '#c8103a'; g.strokeStyle = OUTLINE; g.lineWidth = 1; g.beginPath(); g.arc(n[0] + 4, n[1] - 2, 4, 0, TAU); g.fill(); g.stroke();
      g.strokeStyle = '#5a0016'; g.beginPath(); g.arc(n[0] + 4.5, n[1] - 2.5, 2, 0.5, 5); g.stroke();
      return;
    }
    if (c.skin4) {   // LAST HORIZON: high collar of the under-dress + heart-lock clasp
      poly(g, [[n[0] - 10, n[1] + 6], [n[0] - 9, n[1] - 6], [n[0] + 9, n[1] - 8], [n[0] + 11, n[1] + 4]], R.mono || c.collar, R, 2.5);
      return;
    }
    // school: navy sailor-style collar edge + red ribbon tie
    poly(g, [[n[0] - 16, n[1] + 12], [n[0] - 11, n[1] - 5], [n[0] + 9, n[1] - 8], [n[0] + 13, n[1] + 8], [n[0] + 1, n[1] + 3]], R.mono || c.collar, R, 3);
    if (R.mono) return;
    g.strokeStyle = '#f7f5fa'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(n[0] - 14, n[1] + 9); g.lineTo(n[0] - 10, n[1] - 3); g.stroke();
    g.fillStyle = c.ribbon; g.strokeStyle = OUTLINE; g.lineWidth = 1;
    g.beginPath(); g.moveTo(n[0] + 2, n[1] + 6); g.lineTo(n[0] - 7, n[1] + 1); g.lineTo(n[0] - 6, n[1] + 11); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(n[0] + 2, n[1] + 6); g.lineTo(n[0] + 11, n[1] + 1); g.lineTo(n[0] + 10, n[1] + 11); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(n[0] + 1, n[1] + 7); g.lineTo(n[0] - 3, n[1] + 20); g.lineTo(n[0] + 2, n[1] + 18); g.lineTo(n[0] + 6, n[1] + 21); g.lineTo(n[0] + 4, n[1] + 7); g.closePath(); g.fill(); g.stroke();
  },
  torsoDetail(g, L, bw, c) {
    if (c.skin3) {   // black bodice: red cross-lacing
      g.fillStyle = '#2a0a14'; g.fillRect(-2 * bw, -L + 8, 6 * bw, L - 10);
      g.strokeStyle = '#d0143c'; g.lineWidth = 1;
      for (let i = 0; i < 4; i++) { const y = -L + 11 + i * (L - 14) / 4; g.beginPath(); g.moveTo(-2 * bw, y); g.lineTo(4 * bw, y + 5); g.moveTo(4 * bw, y); g.lineTo(-2 * bw, y + 5); g.stroke(); }
      return;
    }
    if (c.skin4) { g.fillStyle = 'rgba(120,90,140,0.18)'; g.fillRect(-14 * bw, -L * 0.55, 28 * bw, 6); return; }
    // school: navy vest over the white blouse, three small buttons
    g.fillStyle = c.vest; g.beginPath(); g.moveTo(-16 * bw, -L * 0.72); g.lineTo(-3 * bw, -L * 0.55); g.lineTo(6 * bw, -L * 0.72); g.lineTo(16 * bw, -L * 0.62); g.lineTo(16 * bw, 6); g.lineTo(-16 * bw, 6); g.closePath(); g.fill();
    g.fillStyle = '#d8d0e0'; for (const y of [0.42, 0.26, 0.1]) { g.beginPath(); g.arc(3 * bw, -L * y, 1.4, 0, TAU); g.fill(); }
  },
  torsoOver(g, L, bw, c, R) { if (!R.mono && c.skin3) { g.fillStyle = '#c8103a'; g.fillRect(-13 * bw, -7, 26 * bw, 4); } },
  drawSkirt(g, sk, p, c, R, o) {
    const T = (o && o.T) || 0, h = sk.hip;
    if (c.skin3) {   // MIDNIGHT DRESS: long flared black skirt with a crimson underlayer and a lace hem
      const fl = Math.sin(T * 0.07) * 3;
      const lay = (w, d, col) => poly(g, [[h[0] - 15, h[1] - 9], [h[0] - w + fl, h[1] + d], [h[0] - w * 0.35 + fl, h[1] + d + 7], [h[0] + w * 0.35 + fl, h[1] + d + 5], [h[0] + w + fl * 0.6, h[1] + d - 3], [h[0] + 15, h[1] - 9]], R.mono || col, R, 2.6);
      lay(40, 46, '#9a0c2c'); lay(36, 40, '#141016');
      if (R.mono) return;
      g.strokeStyle = '#3a2a36'; g.lineWidth = 2.4; g.setLineDash([3, 2]);
      g.beginPath(); g.moveTo(h[0] - 36 + fl, h[1] + 40); g.lineTo(h[0] - 12 + fl, h[1] + 47); g.lineTo(h[0] + 12 + fl, h[1] + 45); g.lineTo(h[0] + 36 + fl * 0.6, h[1] + 37); g.stroke(); g.setLineDash([]);
      g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1.2; for (const x of [-14, 0, 14]) { g.beginPath(); g.moveTo(h[0] + x * 0.5, h[1] - 6); g.lineTo(h[0] + x * 1.6 + fl, h[1] + 40); g.stroke(); }
      return;
    }
    if (c.skin4) {   // LAST HORIZON: a simple white under-dress to the knee
      const fl = Math.sin(T * 0.08) * 2;
      poly(g, [[h[0] - 14, h[1] - 8], [h[0] - 26 + fl, h[1] + 34], [h[0] + fl, h[1] + 39], [h[0] + 27 + fl * 0.6, h[1] + 32], [h[0] + 14, h[1] - 8]], R.mono || c.dress, R, 2.4);
      if (!R.mono) { g.strokeStyle = 'rgba(120,90,140,0.35)'; g.lineWidth = 1.2; for (const x of [-8, 6]) { g.beginPath(); g.moveTo(h[0] + x, h[1] - 4); g.lineTo(h[0] + x * 2 + fl, h[1] + 34); g.stroke(); } }
      return;
    }
    plaidSkirt(g, sk, c, R, o);
    if (R.mono) return;
    // a little pink flip phone on a heart strap clipped to her skirt
    const x = h[0] + 12, y = h[1] - 2, sw = Math.sin(T * 0.09) * 1.5;
    g.strokeStyle = '#ff6a9a'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1 + sw, y + 7); g.stroke();
    poly(g, [[x - 2 + sw, y + 7], [x + 5 + sw, y + 7], [x + 5 + sw, y + 18], [x - 2 + sw, y + 18]], c.phone, R, 1.4);
    g.fillStyle = '#ffffff'; g.fillRect(x - 0.5 + sw, y + 9, 4, 3);
  },
  weaponBack(g, sk, p, c, R, o) {
    if (!c.skin4) return;
    // LAST HORIZON: a long dark mantle hanging from the shoulders, plum lining, ragged hem that sways
    const T = (o && o.T) || 0, n = sk.neck, hp = sk.hip, sw = Math.sin(T * 0.06) * 4, lean = p.t || 0;
    const pts = [[n[0] - 15, n[1] + 2], [n[0] + 8, n[1] - 2], [hp[0] + 10, hp[1] + 10], [hp[0] + 4 + sw * 0.5, hp[1] + 70]];
    for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([lerp(hp[0] + 2, hp[0] - 44 - lean * 30, t) + sw * (0.4 + t), hp[1] + 70 - t * 10 + (i % 2 ? -7 : 2)]); }
    pts.push([n[0] - 32 - lean * 20 + sw * 0.6, n[1] + 40]);
    poly(g, pts, R.mono || c.cloak, R, 2.6);
    if (R.mono) return;
    g.fillStyle = c.lining; g.globalAlpha = 0.85; g.beginPath(); g.moveTo(hp[0] + 6, hp[1] + 16); g.lineTo(hp[0] + 3 + sw * 0.5, hp[1] + 64); g.lineTo(hp[0] - 6 + sw * 0.5, hp[1] + 62); g.closePath(); g.fill(); g.globalAlpha = 1;
    g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1.4; for (const d of [-10, -22]) { g.beginPath(); g.moveTo(n[0] + d * 0.4, n[1] + 6); g.lineTo(hp[0] + d + sw, hp[1] + 60); g.stroke(); }
    // folded hood behind the neck
    poly(g, [[n[0] - 18, n[1] - 4], [n[0] - 4, n[1] - 10], [n[0] + 4, n[1] + 2], [n[0] - 10, n[1] + 10], [n[0] - 22, n[1] + 6]], c.cloak, R, 2);
  },
  shoulderOver(g, sk, p, c, R) {
    if (!c.skin4) return;
    // the mantle's front edge over the near shoulder + a gold heart-lock clasp
    const n = sk.neck, s = sk.sF;
    poly(g, [[n[0] - 6, n[1] - 4], [s[0] + 12, s[1] - 4], [s[0] + 14, s[1] + 16], [s[0] + 2, s[1] + 22], [n[0] - 2, n[1] + 16]], R.mono || c.cloak, R, 2.4);
    if (R.mono) return;
    g.strokeStyle = c.lining; g.lineWidth = 2; g.beginPath(); g.moveTo(s[0] + 13, s[1] + 14); g.lineTo(s[0] + 2, s[1] + 20); g.stroke();
    const x = n[0] + 3, y = n[1] + 6;
    g.fillStyle = '#e0b84e'; g.strokeStyle = OUTLINE; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y + 5); g.bezierCurveTo(x - 6, y, x - 3, y - 4, x, y - 1); g.bezierCurveTo(x + 3, y - 4, x + 6, y, x, y + 5); g.fill(); g.stroke();
    g.fillStyle = '#3a2a10'; g.fillRect(x - 0.6, y, 1.2, 2.4);
  },
  weaponFront(g, sk, p, c, R) { const a = Math.atan2(sk.fh[1] - sk.fe[1], sk.fh[0] - sk.fe[0]); aimGun(g, sk.fh, a, c, R, false); },
};
makeChibi(AIMI, { build: { arm: 0.95, leg: 0.97, torso: 0.97 }, colors: {} });
AIMI.faceFn = aimFace;
// skin 5 — MIDNIGHT DRESS (clear Arcade with her): black dress, sleeveless with long black gloves, crimson lacing, rose choker
const AIM_DRESS = { ...AIMI.colors, skin3: 1, top: '#141016', uarm: '#fde9e2', farm: '#141016', cuff: '#141016', belt: null, collar: '#141016', warm: '#1a1418', boot: '#0e0a0e', foot: '#0e0a0e', sole: '#3a0a18', pad: '#c8103a',
  tie: '#141016', tie2: '#c8103a', rose: '#c8103a', gun: '#1a1a20', grip: '#3a0a18', heart: '#c8103a', accent: '#ff3a64' };
// skin 4 — LAST HORIZON (Mastery LV 10): long dark mantle over a white dress, gold heart-lock clasp
const AIM_CLOAK = { ...AIMI.colors, skin4: 1, top: '#efe8f0', uarm: '#2c2232', farm: '#2c2232', cuff: '#e0b84e', belt: null, collar: '#efe8f0', dress: '#efe8f0', cloak: '#2c2232', lining: '#7a1a44', warm: '#2c2232', boot: '#3a2a22', foot: '#3a2a22', sole: '#1a1210', pad: '#e0b84e',
  tie: '#2c2232', tie2: '#e0b84e', accent: '#ff6a9a' };
AIMI.varColors = vi => vi === 5 ? AIM_DRESS : vi === 4 ? AIM_CLOAK : null;

// ---------------------------------- obsession ----------------------------------
const AIM_PAL = {};
AIMI.palette = F => {
  const ul = F.ulT > 0, ex = F.aimEx || null, v = F.variant === 5 ? 3 : F.variant === 4 ? 4 : 0, key = v + (ul ? 'u' : '') + (ex || '');
  return AIM_PAL[key] || (AIM_PAL[key] = { ...(v === 3 ? AIM_DRESS : v === 4 ? AIM_CLOAK : AIMI.colors), ul, ex, accent: ul ? AMR : v === 3 ? AIM_DRESS.accent : v === 4 ? AIM_CLOAK.accent : AM });
};
function aimGain(F, n, label) {
  if (!F || F.ko || n <= 0 || F.ulT > 0 || F.calmT > 0) return;
  F.obs = clamp((F.obs || 0) + n, 0, 100); F.obsT = F.T;
  if (label) FX.wtext(F.x, F.y - 238 * F.s, label, { size: 18, color: AMH, stroke: AM2, life: 28 });
}
function aimUnstable(F) {
  F.ulT = AIM_UL; F.obs = 100;
  FX.ring(F.x, F.y - 110, AMR, 20, 330, 26, 6); FX.ring(F.x, F.y - 110, '#ffffff', 10, 170, 18, 3); FX.flashScreen('#3a0010', 14, 0.5);
  FX.wtext(F.x, F.y - 262, 'UNSTABLE LOVE', { size: 36, color: '#ffffff', stroke: AM2, life: 70 });
  FX.wtext(F.x, F.y - 224, '— 狂愛 —', { size: 22, font: FX_JP(), color: AMH, stroke: AMD, life: 70 });
  Sound.play('heart'); Sound.play('aimiLove');
}
AIMI.initFighter = F => { F.obs = 0; F.obsT = -999; F.ulT = 0; F.calmT = 0; F.intT = -99; F.runT = -99; F.chaseT = -99; F.aimEx = null; F.zoneCD = 0; };
AIMI.walkMul = F => F.ulT > 0 ? 1.15 : 1;
AIMI.dmgBonus = F => F.ulT > 0 ? 1.06 : 1;
AIMI.onDealDamage = (A, D) => {
  if (A.ko || A.state === 'cine') return;
  const melee = A.state === 'attack' && A.hitActive && A.move && !A.move.ult;
  if (melee) aimGain(A, A.move.special || A.move.followup ? 4 : 2);
  if (D.comboHits >= 4) aimGain(A, 1);
  // interrupting an attack during its startup
  if (D.state === 'attack' && D.move && D.mf <= (D.move.st || 0) + 1 && A.T - A.intT > 30) { A.intT = A.T; aimGain(A, 8, 'INTERRUPTED'); }
  // catching them while they run away
  if (A.T - A.runT < 45 && A.T - A.chaseT > 60) { A.chaseT = A.T; aimGain(A, 6, 'DON\'T RUN~'); }
};
AIMI.idlePose = F => { const k = F.T % 600; return k > 400 && k < 460 ? 'hairfix' : k > 170 && k < 240 ? 'stare' : k > 520 && k < 548 ? 'reach' : null; };
AIMI.tick = F => {
  const O = F.opp; if (!O) return;
  const live = BT && BT.phase === 'fight' && !F.ko;
  if (F.state !== 'attack' || F.moveKey !== 'sp2') F.hidden = F.state === 'cine' ? F.hidden : false;   // safety: the Pursuit vanish never leaks
  // expressions follow what she is doing
  if (F.state !== 'cine') {
    const s = F.state, k = F.moveKey, ul = F.ulT > 0;
    let e = null;
    if (s === 'victory') e = F.sf < 70 ? 'smile' : F.sf < 150 ? 'stare' : 'smirk';
    else if (s === 'defeat') e = F.sf < 50 ? null : 'angry';
    else if (s === 'attack') e = k === 'sp1f' || k === 'H' ? (ul ? 'crazy' : 'stare') : k === 'sp2f' || k === 'sp2' || k === 'sp2d' || k === 'counter' ? 'crazy' : ul ? 'crazy' : 'grin';
    else if (s === 'idle') { const k2 = F.T % 600; e = k2 > 400 && k2 < 460 ? 'smile' : (k2 > 170 && k2 < 240) || ul ? 'stare' : null; }
    else if (s === 'walk' || s === 'dash') e = ul ? 'stare' : null;
    F.aimEx = e;
  }
  // the opponent backing off (for "don't run")
  if (live && (O.state === 'backdash' || (O.state === 'walk' && Math.sign(O.vx) === Math.sign(O.x - F.x) && Math.abs(O.vx) > 0.5))) F.runT = F.T;
  if (F.zoneCD > 0) F.zoneCD--;
  if (F.calmT > 0) F.calmT--;
  if (F.ulT > 0) {
    F.ulT--;
    xpHaste(F, 0.25);
    if (F.T % 5 === 0) FX.p({ type: 'spark', x: F.x + rand(-34, 34), y: F.y - rand(20, 200), vx: rand(-0.4, 0.4), vy: -rand(0.3, 1), life: 24, size: rand(1.5, 3), color: F.T % 2 ? AMR : AM });
    if (F.state === 'walk' || F.state === 'dash') F.afterimage = Math.max(F.afterimage, 2);
    if (F.ulT === 0) { F.obs = 0; F.calmT = AIM_CALM; FX.wtext(F.x, F.y - 230, '…ehehe', { size: 20, color: AMH, stroke: AM2, life: 40 }); }
  } else if (live) {
    if (F.obs >= 100) aimUnstable(F);
    else if (F.T - F.obsT > 360 && F.obs > 0) F.obs = Math.max(0, F.obs - 0.05);   // only fades if she stops engaging
    if (F.obs >= 60 && F.T % 14 === 0) FX.p({ type: 'spark', x: F.x + rand(-28, 28), y: F.y - rand(30, 180), vx: 0, vy: -0.6, life: 20, size: 1.6, color: AM });
  }
};
// defeat: falls, tries to push herself up, ends kneeling with a clenched fist; victory: sweet → possessive reach
// (generic hook ch.statePose(F) → [pose, rate] | null lives in 06b_statepose.js)
AIMI.statePose = F => {
  if (F.state === 'defeat') return F.sf < 40 ? ['down', 0.2] : F.sf < 100 ? [F.sf % 40 < 20 ? 'defeat' : { base: 'defeat', t: 0.45, fa2: 0.3 }, 0.12] : ['defeat2', 0.08];
  if (F.state === 'victory' && !F.cos) return [F.sf < 70 ? 'victory' : F.sf < 150 ? 'claim' : 'hairfix', 0.1];
  return null;
};
AIMI.drawBehind = (g, F) => {
  if (F.ulT > 0 && FX.hq && !F.hidden) {   // subtle red aura while UNSTABLE LOVE runs
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.22 + 0.1 * Math.sin(F.T * 0.25);
    drawFigure(g, F.ch, F.pose, F.x + Math.sin(F.T * 0.7) * 2, F.y, F.facing, { mono: AMR, scale: 1.06 }); g.restore();
  }
};
AIMI.drawExtra = (g, F) => {
  if (F.hidden || !FX.hq) return;
  const k = F.ulT > 0 ? 1 : (F.obs || 0) >= 60 ? 0.4 : 0;
  if (k > 0) {   // little hearts orbit her, cracked while she is unstable
    g.save(); g.globalAlpha = 0.35 + 0.4 * k;
    const n = F.ulT > 0 ? 3 : 1;
    for (let i = 0; i < n; i++) { const a = F.T * 0.035 + i * TAU / n; aimHeart(g, F.x + Math.cos(a) * 50, F.y - 115 + Math.sin(a) * 64, 6, F.ulT > 0 ? AMR : AM, F.ulT > 0); }
    g.restore();
  }
};
function aimHeart(g, x, y, s, col, crack) {
  g.save(); g.translate(x, y); g.fillStyle = col;
  g.beginPath(); g.moveTo(0, s * 0.9); g.bezierCurveTo(-s * 1.3, -s * 0.1, -s * 0.6, -s * 1.1, 0, -s * 0.35); g.bezierCurveTo(s * 0.6, -s * 1.1, s * 1.3, -s * 0.1, 0, s * 0.9); g.fill();
  if (crack) { g.strokeStyle = AMD; g.lineWidth = Math.max(1, s * 0.16); g.beginPath(); g.moveTo(0, -s * 0.35); g.lineTo(-s * 0.2, 0); g.lineTo(s * 0.18, s * 0.25); g.lineTo(0, s * 0.7); g.stroke(); }
  g.restore();
}
AIMI.introFx = F => { FX.wtext(F.x, F.y - 250, 'found you~', { size: 22, color: AMH, stroke: AM2, life: 60, vy: -0.3 }); Sound.play('heart'); };

// ---------------------------------- projectiles ----------------------------------
EXTRA_PROJ.aimiBullet = {   // a small bright round with a pink tracer
  update(p) { if (p.t % 2 === 0) FX.p({ type: 'spark', x: p.x - p.vx * 0.6, y: p.y - p.vy * 0.6, vx: -p.vx * 0.04, vy: 0, life: 8, size: p.big ? 2.4 : 1.6, color: p.ul ? AMR : AM }); },
  draw(g, p) {
    const a = Math.atan2(p.vy, p.vx); g.save(); g.translate(p.x, p.y); g.rotate(a); g.globalCompositeOperation = 'lighter';
    const L = p.big ? 46 : 32;
    const gr = g.createLinearGradient(-L, 0, 0, 0); gr.addColorStop(0, 'rgba(255,79,139,0)'); gr.addColorStop(1, p.ul ? 'rgba(255,40,80,0.9)' : 'rgba(255,120,170,0.85)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(-L, 0); g.lineTo(0, -(p.big ? 4 : 2.6)); g.lineTo(0, p.big ? 4 : 2.6); g.closePath(); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(0, 0, p.big ? 7 : 5, p.big ? 3.6 : 2.6, 0, 0, TAU); g.fill();
    if (p.big) { g.globalAlpha = 0.5; g.strokeStyle = AMR; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.stroke(); }
    g.restore();
  },
};
EXTRA_PROJ.aimiMuzzle = { update() {}, draw(g, p) {
  const k = p.life / 6; g.save(); g.globalCompositeOperation = 'lighter'; g.translate(p.x, p.y); g.scale(p.dir || 1, 1);
  g.globalAlpha = k; g.fillStyle = '#fff4c8'; g.beginPath(); g.moveTo(0, -6); g.lineTo(26 + p.size, 0); g.lineTo(0, 6); g.closePath(); g.fill();
  g.fillStyle = '#ffb030'; g.beginPath(); g.moveTo(2, -10); g.lineTo(14, 0); g.lineTo(2, 10); g.lineTo(8, 0); g.closePath(); g.fill(); g.restore();
} };
EXTRA_PROJ.aimiZone = {   // NO ESCAPE: a clear red warning circle, then the ground bursts (hits while they stay inside)
  delay(p) { if (p.delay % 6 === 0) Sound.play('tick'); },
  update(p) {
    if (p.t % 3 === 0) FX.p({ type: 'ember', x: p.x + rand(-p.w / 2, p.w / 2), y: GROUND - rand(0, 10), vx: 0, vy: -rand(2, 6), life: 18, size: rand(2, 4), color: p.t % 2 ? AMR : AM });
    if (p.t === 1) { FX.shakeIt(6); FX.dust(p.x, GROUND, 10); FX.ring(p.x, GROUND - 10, AMR, 10, p.w * 0.7, 14, 6, 0.3); Sound.play('explosion'); }
  },
  draw(g, p) {
    const T = p.t, w = p.w / 2, warn = p.delay > 0;
    g.save(); g.globalCompositeOperation = 'lighter';
    g.globalAlpha = warn ? 0.45 + 0.35 * Math.sin(p.delay * 0.6) : Math.min(1, p.life / 12) * 0.85;
    g.strokeStyle = warn ? AMR : AM; g.lineWidth = warn ? 3 : 4; g.beginPath(); g.ellipse(p.x, GROUND - 2, w, 16, 0, 0, TAU); g.stroke();
    if (warn) {   // crosshair + ticks
      g.lineWidth = 2; g.beginPath(); g.moveTo(p.x - w * 0.5, GROUND - 2); g.lineTo(p.x + w * 0.5, GROUND - 2); g.moveTo(p.x, GROUND - 12); g.lineTo(p.x, GROUND + 8); g.stroke();
      const k = 1 - p.delay / (p.delay0 || 26); g.globalAlpha = 0.25; g.fillStyle = AMR; g.beginPath(); g.ellipse(p.x, GROUND - 2, w * k, 16 * k, 0, 0, TAU); g.fill();
    } else {
      const gr = g.createLinearGradient(0, GROUND, 0, GROUND - p.h * 1.2); gr.addColorStop(0, 'rgba(255,40,80,0.7)'); gr.addColorStop(1, 'rgba(255,40,80,0)');
      g.fillStyle = gr; g.fillRect(p.x - w, GROUND - p.h * 1.2, w * 2, p.h * 1.2);
      g.strokeStyle = '#ffd0dc'; g.lineWidth = 2;
      for (let i = 0; i < 5; i++) { const x = p.x - w + (i + 0.5) * w * 0.4, hh = (20 + ((T * 7 + i * 13) % 30)) ; g.beginPath(); g.moveTo(x, GROUND); g.lineTo(x + 4, GROUND - hh); g.stroke(); }
    }
    g.restore();
  },
};

// ---------------------------------- moves ----------------------------------
const aimFlash = (F, big) => {
  const h = F.handW('f');
  BT.spawn({ owner: F, kind: 'aimiMuzzle', x: h[0] + F.facing * 18, y: h[1] - 4, vx: F.facing * 0.001, w: 1, h: 1, life: 6, harmless: true, clash: 0, dir: F.facing, size: big ? 14 : 0 });
  FX.p({ type: 'smoke', x: h[0] + F.facing * 22, y: h[1] - 4, vx: F.facing * 1.2, vy: -0.4, life: 18, size: 7, grow: 0.3, color: 'rgba(210,200,205,0.45)', add: false });
};
function aimShoot(F, o) {   // one pistol round from her front hand
  const h = F.handW('f'), ul = F.ulT > 0;
  BT.spawn(Object.assign({ owner: F, kind: 'aimiBullet', x: h[0] + F.facing * 26, y: h[1] - 4, vx: F.facing * 18, w: 34, h: 22, life: 40, hits: 1, clash: 1, str: 1, ul,
    dmg: 40, hs: 18, bs: 9, kb: 3, color: AM, srcKey: F.moveKey, projOnHit: 1 }, o));
  Sound.play('pistol'); aimFlash(F, o && o.big);
}
AIMI.moves = Object.assign(baseNormals({ dmg: 0.96, spd: -1, rng: 1.0 }), {
  sp1: {
    name: 'PREDATORY DASH', jp: '捕食の疾走', desc: 'She drops low, smiles, and closes the distance in an instant, ending in a hard knee. Good combo starter: press SP1 again on hit for STAY WITH ME (point-blank follow-up shot). Blockable, punishable up close. +4 Obsession on hit.', special: 1, lvl: 4,
    poses: ['crouch_run', 'knee'], st: 10, act: 6, rec: 18, cd: 50, dmg: 66, hs: 28, bs: 12, kb: 4, hb: { x: 0, y: -150, w: 76, h: 90 }, str: 2, sfx: 'whoosh',
    poseFn(F, f) { return f <= 10 ? 'crouch_run' : f <= 22 ? 'knee' : 'stance'; },
    tick(F, f) { if (f >= 3 && f <= 15) { F.vx = F.facing * (F.ulT > 0 ? 14.5 : 13); F.ctrlVel = true; F.afterimage = Math.max(F.afterimage, 4); } if (f === 3) Sound.play('whoosh', 1.3); },
    onHit(A, D) { Sound.play('kick'); if (A.ulT > 0) D.hitstun = Math.max(D.hitstun, 34); },
  },
  dashShot: {
    name: 'STAY WITH ME', jp: '離さない', desc: 'Follow-up after Predatory Dash hits (SP1): she presses the pistol to them and fires. Knockdown.', followup: 1, lvl: 4.5,
    poses: ['aim', 'recoil'], st: 7, act: 3, rec: 24, dmg: 58, hs: 30, bs: 12, kb: 12, kd: 1, hb: { x: 0, y: -170, w: 96, h: 70 }, str: 3, sfx: 'pistol',
    tick(F, f) { if (f === 7) aimFlash(F, true); },
    onHit(A, D) { aimGain(A, 3); FX.shakeIt(5); },
  },
  sp1f: {
    name: 'DEADLY ACCURACY', jp: '必中', desc: 'She reaches back, raises the pistol with a confident look and fires one precise round (~700 px). Readable 14 f startup; blockable and can be jumped. +5 Obsession on hit. Unstable Love: faster, heavier round that beats normal projectiles.', special: 1, lvl: 4,
    poses: ['draw', 'aim'], st: 14, act: 1, rec: 20, cd: 55, sfx: 'cock',
    poseFn(F, f) { return f <= 6 ? 'draw' : f <= 14 ? 'aim' : f <= 22 ? 'recoil' : 'stance'; },
    spawn: { f: 14, fn(F) {
      const ul = F.ulT > 0;
      aimShoot(F, { vx: F.facing * (ul ? 22 : 18), dmg: ul ? 60 : 50, big: ul, str: ul ? 2 : 1, hs: 20, kb: 4, onHit(A) { aimGain(A, 5); } });
    } },
  },
  counter: {
    name: 'POINT-BLANK', jp: '零距離', desc: 'She steps in fast and fires straight into them. Short range only (it can\'t reach from afar) and higher damage than Deadly Accuracy; pushes them away. Long recovery if it misses. Unstable Love: launches for a follow-up.', special: 1, lvl: 4,
    poses: ['reach', 'recoil'], st: 9, act: 3, rec: 28, cd: 80, dmg: 96, hs: 26, bs: 14, kb: 13, hb: { x: 0, y: -175, w: 74, h: 80 }, str: 3, shake: 6, sfx: 'cock',
    tick(F, f) { if (f <= 7) { F.vx = F.facing * 8; F.ctrlVel = true; } if (f === 9) { Sound.play('pistol'); aimFlash(F, true); } },
    onHit(A, D) { aimGain(A, 5); Sound.play('impactBig'); if (A.ulT > 0) { D.vy = -11; D.onGround = false; D.y = Math.min(D.y, GROUND - 1); D.kdOnLand = true; } },
  },
  sp2: {
    name: 'OBSESSIVE PURSUIT', jp: '執着の追跡', desc: 'She blinks out of sight (briefly untouchable) and reappears right in front of them — up to ~460 px away — for a 4-hit flurry ending in a heel drop. Every hit can be blocked; jumping or leaving her range makes it miss. +8 Obsession on hit. Unstable Love: a 5th hit.', special: 1, lvl: 4,
    poses: ['crouch_run', 'jab'], st: 16, act: 30, rec: 22, cd: 300, dmg: 22, hits: 5, interval: 6, hs: 18, bs: 10, kb: 1.5, hb: { x: 0, y: -175, w: 86, h: 130 }, str: 2, sfx: 'teleport',
    final: { dmg: 40, kb: 9, kd: 1, hs: 30, str: 3 },
    onStart(F) { F.purHit = false; F.purUl = F.ulT > 0; },
    poseFn(F, f) { if (f <= 16) return f <= 4 ? 'crouch_run' : 'stance'; const k = ((f - 16) / 6) | 0; return ['jab', 'kick', 'jab2', 'spin', 'heel'][Math.min(4, k)] || 'heel'; },
    tick(F, f) {
      const O = F.opp;
      if (f === 16 && !F.purUl && F.hitCount === 0) F.hitCount = 1;   // 4 hits normally (the count starts at 1), 5 in Unstable Love; the last one is always the heel drop
      if (f === 4) { F.hidden = true; FX.ring(F.x, F.y - 100, AM, 60, 6, 10, 3); for (let i = 0; i < 12; i++) FX.p({ type: 'spark', x: F.x + rand(-20, 20), y: F.y - rand(20, 180), vx: rand(-3, 3), vy: rand(-2, 2), life: 14, size: 2, color: i % 2 ? AM : '#ffffff' }); }
      if (f === 13) {
        const d = Math.sign(O.x - F.x) || F.facing, tx = O.x - d * 74, max = 460;
        F.x = clamp(Math.abs(tx - F.x) > max ? F.x + d * max : tx, 50, STAGE_W - 50); F.facing = d; F.vx = 0;
        F.hidden = false; F.afterimage = 8; FX.ring(F.x, F.y - 100, AMR, 8, 70, 10, 3); Sound.play('whoosh', 0.8);
      }
      if (f > 16 && (f - 17) % 6 === 0) Sound.play('whoosh', 1.2);
    },
    onHit(A, D) { if (!A.purHit) { A.purHit = true; aimGain(A, 8); } },
  },
  sp2f: {
    name: 'RAIN OF BULLETS', jp: '弾丸の雨', desc: 'She plants her feet, takes a two-handed stance and empties the magazine: 5 visible rounds in a steady rhythm (7 in Unstable Love), the last one heavier with strong knockback. Each round can be blocked; jump or crouch-dash between them. Long cooldown.', special: 1, lvl: 4,
    poses: ['aim2', 'aim2'], st: 16, act: 46, rec: 14, cd: 360, sfx: 'cock',
    poseFn(F, f) { const n = F.rainN || 5, last = 16 + (n - 1) * 7; if (f < 16 || f > last + 10) return f < 16 ? 'aim2' : 'stance'; return (f - 16) % 7 < 3 ? 'recoil' : 'aim2'; },
    onStart(F) { F.rainN = F.ulT > 0 ? 7 : 5; },
    tick(F, f) {
      const n = F.rainN || 5;
      if (f >= 16 && (f - 16) % 7 === 0 && (f - 16) / 7 < n) {
        const i = (f - 16) / 7, last = i === n - 1;
        aimShoot(F, last ? { dmg: 34, kb: 10, hs: 26, bs: 12, big: true, str: 2, w: 40, h: 26, onHit(A) { aimGain(A, 3); } } : { dmg: 15, kb: 1.5, hs: 15, bs: 7, onHit(A) { aimGain(A, 2); } });
        if (last) FX.shakeIt(4);
      }
    },
  },
  sp2d: {
    name: 'NO ESCAPE', jp: '逃げ場なし', desc: 'She aims at the ground where they stand (up to ~520 px ahead) and fires: a red warning circle appears, ~0.45 s later the spot bursts and keeps biting (2 hits, 3 in Unstable Love) while they stay inside. Step out or jump to avoid it. Long cooldown.', special: 1, lvl: 4,
    poses: ['aim_low', 'recoil'], st: 18, act: 1, rec: 22, cd: 420, sfx: 'cock',
    spawn: { f: 18, fn(F) {
      const O = F.opp, d = F.facing, dist = clamp((O.x - F.x) * d, 120, 520), x = clamp(F.x + d * dist, 80, STAGE_W - 80), ul = F.ulT > 0;
      BT.spawn({ owner: F, kind: 'aimiZone', x, y: GROUND - 40, vx: 0, w: ul ? 190 : 160, h: 80, delay: 26, delay0: 26, life: ul ? 76 : 52, hits: ul ? 3 : 2, interval: 24, clash: 0, persist: true,
        dmg: 36, hs: 24, bs: 12, kb: 3, launch: -7, str: 2, color: AMR, srcKey: 'sp2d', projOnHit: 1, onHit(A) { aimGain(A, 4); } });
      Sound.play('pistol'); aimFlash(F, true);
      const h = F.handW('f'); FX.p({ type: 'bolt', x: h[0] + d * 20, y: h[1], x2: x, y2: GROUND, size: 2, life: 5, color: AMH });
    } },
  },
  ult: {
    name: 'THE SKY BREAKS', jp: '空が裂ける', desc: 'Ultimate. She looks at them very calmly. If her reach connects she vanishes — the battlefield goes quiet, the sky cracks and tears open, and she appears beyond it, gigantic, reaching down to take them. The sky closes on them.', ult: 1, lvl: 6, cost: 100,
    poses: ['stare', 'reach'], st: 12, act: 6, rec: 34, dmg: 20, hs: 40, bs: 20, kb: 1, hb: { x: 0, y: -200, w: 170, h: 200 }, invuln: [0, 16], str: 3, sfx: 'heart',
    onHit(F, D) { BT.startCine(F, D, CINE.aimi, { zoom: 1.4 }); return true; },
  },
});
addFollowup(AIMI, 'sp1', { btn: 'sp1', move: 'dashShot', noMotion: true });
(() => {
  const M = AIMI.moves;
  Object.assign(M.L, { name: 'Sweet Jab' });
  Object.assign(M.M, { name: 'Ribbon Kick' });
  Object.assign(M.H, { name: 'HEARTSHOT', poses: ['aim', 'recoil'], st: 14, hb: { x: 15, y: -176, w: 128, h: 46 }, sfx: 'pistol',
    tick(F, f) { if (f === 14) aimFlash(F, false); }, onHit(A) { aimGain(A, 3); } });
  Object.assign(M.cL, { name: 'Low Poke' });
  Object.assign(M.cM, { name: 'Ankle Kick' });
  Object.assign(M.cH, { name: 'Twin-tail Sweep' });
  Object.assign(M.jH, { name: 'Falling Grip', poses: ['jheavy_w', 'jheavy'] });
  Object.assign(M.LH, { name: 'Rising Heel', poses: ['upper_w', 'heel'] });
  Object.assign(M.FF, { name: 'Lovestruck Lunge', poses: ['crouch_run', 'knee'] });
})();
// CPU hints
AIMI.moves.counter.__ai = { reach: 140, kind: 'melee', anti: false, st: 9, low: false, over: false };
AIMI.moves.sp2.__ai = { reach: 470, kind: 'melee', anti: false, st: 17, low: false, over: false };
AIMI.moves.sp2d.__ai = { reach: 520, kind: 'proj', anti: false, st: 44, low: false, over: false };
AIMI.combos = [
  { name: 'Stay With Me', notation: 'M → H (Heartshot) → SP1 (Predatory Dash) → SP1 (Stay With Me)', seq: ['M', 'H', 'sp1', 'dashShot'] },
  { name: 'Deadly Accuracy', notation: 'M → H → ↓→SP1 (Deadly Accuracy)', seq: ['M', 'H', 'sp1f'] },
  { name: 'Point-Blank', notation: 'L → M → ↓←SP1 (Point-Blank)', seq: ['L', 'M', 'counter'] },
  { name: 'Obsessive Pursuit', notation: 'M → H → SP2 (Obsessive Pursuit)', seq: ['M', 'H', 'sp2'] },
  { name: 'The Sky Breaks', notation: 'M → H → SP1+SP2 (Ultimate)', seq: ['M', 'H', 'ult'], meter: 1 },
];
AIMI.applyTrial = (A, tr) => { if (!tr) return; if (tr.meter) A.meter = 100; };

// ---------------------------------- cinematic: THE SKY BREAKS ----------------------------------
// Pure presentation on top of the existing cine system: the camera, the sky tear and the giant are drawn in screen space
// (cineBg / cineFg); all random geometry is made at frame 1 (sim side), the draw functions never touch Math.random.
const AIM_GIANT_POSE = { t: 0.42, hd: 0.45, fa1: 0.35, fa2: 0.2, ba1: 0.2, ba2: 2.3, fl1: 0.2, fl2: 0.1, bl1: -0.1, bl2: -0.1 };
CINE.aimi = function (A, D, f, c) {
  const dir = A.facing;
  if (f === 1) {
    A.x = clamp(A.x, 260, STAGE_W - 260); D.x = clamp(A.x + dir * 210, 120, STAGE_W - 120); D.y = GROUND; D.forcePose = 'hit'; A.forcePose = 'stare'; A.aimEx = 'calm';
    c.ax0 = A.x; c.df0 = D.facing; c.zoom = 1.4; c.camX = (A.x + D.x) / 2; c.camY = GROUND - 150; c.bg = AIMI.cineBg; c.fg = AIMI.cineFg; c.A = A; c.D = D;
    c.sky = 0; c.crack = 0; c.open = 0; c.giant = 0; c.col = 0; c.hand = 0; c.grip = 0; c.flash = 0; c.quiet = 0; c.glitch = 0; c.shock = 0; c.eye = 0;
    c.tx = D.x; c.ty = GROUND - 610;   // the tear's world position, right above the opponent
    c.jag = []; for (let i = 0; i < 30; i++) c.jag.push(rand(0.72, 1.3));
    c.cracks = []; for (let i = 0; i < 11; i++) { const a = i / 11 * TAU + rand(-0.2, 0.2), pts = [[0, 0]]; let x = 0, y = 0, aa = a; for (let j = 0; j < 6; j++) { aa += rand(-0.5, 0.5); const L = rand(30, 70); x += Math.cos(aa) * L; y += Math.sin(aa) * L * 0.6; pts.push([x, y]); } c.cracks.push(pts); }
    c.frags = []; c.stars = []; for (let i = 0; i < 70; i++) c.stars.push([Math.random() * W, Math.random() * H * 0.8, Math.random() * 1.5 + 0.5]);
    c.sw = []; for (let i = 0; i < 14; i++) c.sw.push([rand(0, TAU), rand(0.2, 1), rand(0.4, 1.2)]);
    FX.darkTarget = 0; Sound.play('heart');
  }
  // --- 1: she looks at them, unusually calm; then she is simply gone ---
  if (f === 18) A.aimEx = 'smirk';
  if (f === 34) { c.glitch = 14; Sound.play('aimiVanish'); }
  if (f === 40) { A.hidden = true; c.quiet = 1; for (let i = 0; i < 16; i++) FX.p({ type: 'spark', x: A.x + rand(-26, 26), y: A.y - rand(10, 190), vx: rand(-2, 2), vy: -rand(0.5, 2.5), life: 22, size: 2, color: i % 2 ? AM : '#ffffff' }); }
  if (c.glitch > 0) c.glitch--;
  // the opponent looks around — nothing there
  if (f >= 44 && f <= 96) { D.forcePose = 'stance'; if (f === 58 || f === 80) D.facing = -D.facing; if (f === 92) D.facing = c.df0; }
  if (f >= 40 && f < 80) { const k = easeOut((f - 40) / 40); c.zoom = lerp(1.4, 1.1, k); c.camX = lerp(c.camX, D.x, 0.08); }
  // --- 2: the camera drifts upward; the sky darkens and cracks ---
  if (f >= 80 && f < 140) { const k = easeInOut((f - 80) / 60); c.zoom = lerp(1.1, 0.85, k); c.camY = lerp(GROUND - 150, GROUND - 470, k); c.camX = lerp(c.camX, D.x, 0.1); }
  if (f >= 70 && f <= 120) c.sky = (f - 70) / 50;
  if (f === 90) Sound.play('rift');
  if (f >= 100 && f <= 140) c.crack = (f - 100) / 40;
  if (f === 100 || f === 112 || f === 126) { Sound.play('skyCrack'); FX.shakeIt(3); }
  // --- 3: the sky tears open like a surface; fragments break away; light pours out ---
  if (f === 140) { Sound.play('skyTear'); FX.shakeIt(10); }
  if (f >= 140 && f <= 176) c.open = easeOut((f - 140) / 36);
  if (f >= 140 && f < 176 && f % 2 === 0) { const a = rand(0, TAU); c.frags.push({ a, r: 1, v: rand(0.006, 0.016), fall: 0, s: rand(10, 26), rot: rand(0, TAU), vr: rand(-0.08, 0.08) }); }
  for (const q of c.frags) { q.r += q.v; q.fall += 0.9 + q.r; q.rot += q.vr; }
  // --- 4: she appears beyond the opening: a silhouette first, then her colours; she looks down ---
  if (f >= 168 && f <= 196) c.giant = (f - 168) / 28;
  if (f >= 192 && f <= 222) c.col = (f - 192) / 30;
  if (f === 180 || f === 204) Sound.play('heart');
  if (f >= 214) c.eye = Math.min(1, (f - 214) / 10);
  // --- 5: one hand reaches through the sky and closes around them ---
  if (f >= 222 && f < 262) { const k = easeInOut((f - 222) / 40); c.zoom = lerp(0.85, 0.72, k); c.camY = lerp(GROUND - 470, GROUND - 360, k); }
  if (f === 224) { Sound.play('rift'); Sound.play('aimiReach'); }
  if (f >= 226 && f <= 256) c.hand = aimEaseIn((f - 226) / 30);
  if (f === 256) { D.forcePose = 'airhit'; c.grip = 0.01; BT.scriptHit(A, D, 40, { str: 3, sfx: 'grab' }); Sound.play('impactBig'); FX.shakeIt(16); FX.impactFrame(3); FX.flashScreen('#ffffff', 6, 0.4); }
  if (c.grip > 0 && c.grip < 1) c.grip = Math.min(1, c.grip + 0.14);
  // lifted toward the opening; the opening widens
  if (f > 262 && f <= 300) { const k = easeInOut((f - 262) / 38); D.y = GROUND - 380 * k; c.open = 1 + 0.35 * k; c.camY = lerp(GROUND - 360, GROUND - 470, k); }
  // --- 6: the sky collapses on them ---
  if (f === 300) {
    BT.scriptHit(A, D, 170, { str: 4 }); FX.impactFrame(6); FX.shakeIt(30); Sound.play('skyClose'); Sound.play('explosion');
    c.flash = 1; c.shock = 0.01; FX.wtext(D.x, D.y - 120, '空が裂ける', { size: 60, font: FX_JP(), color: '#ffffff', stroke: AM2, life: 64, vy: -0.3 });
  }
  if (f > 300 && f <= 312) { c.open = Math.max(0, c.open - 0.14); c.hand = Math.max(0, c.hand - 0.1); }
  if (f > 300) { c.flash = Math.max(0, c.flash - 0.05); c.giant = Math.max(0, c.giant - 0.1); }
  if (c.shock > 0) c.shock = Math.min(1.2, c.shock + 0.045);
  if (f > 306) { c.sky = Math.max(0, c.sky - 0.04); c.crack = Math.max(0, c.crack - 0.06); }
  // --- 7: everything is ordinary again; she is back where she stood, fixing her hair ---
  if (f === 312) { A.hidden = false; A.x = c.ax0; A.forcePose = 'hairfix'; A.aimEx = 'smile'; c.quiet = 0; c.grip = 0; }
  if (f > 312) {
    c.zoom = lerp(c.zoom, 1.3, 0.08); c.camX = lerp(c.camX, (A.x + D.x) / 2, 0.08); c.camY = lerp(c.camY, GROUND - 160, 0.1);
    if (D.y < GROUND) { c.dvy = (c.dvy || 0) + 1.1; D.y = Math.min(GROUND, D.y + c.dvy); if (D.y >= GROUND) { FX.dust(D.x, GROUND, 14); FX.shakeIt(8); Sound.play('slam'); } }
  }
  if (f === 340) { A.forcePose = 'stare'; A.aimEx = 'smirk'; }
  if (f >= 362) { D.facing = c.df0; D.y = GROUND; BT.release(D, dir * 2, -3); FX.darkTarget = 0; A.aimEx = null; return true; }
};
const aimEaseIn = t => { t = clamp(t, 0, 1); return t * t; };
function aimTearPath(g, c, sx, sy, R) {   // the jagged opening, wider than tall
  const n = c.jag.length; g.beginPath();
  for (let i = 0; i < n; i++) { const a = i / n * TAU, j = c.jag[i], x = sx + Math.cos(a) * R * 1.7 * j, y = sy + Math.sin(a) * R * 0.85 * j; i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.closePath();
}
AIMI.cineBg = (g, c) => {   // screen space, behind the fighters: night sky, cracks, the opening and the giant beyond it
  const cam = BT && BT.cam; if (!cam) return;
  if (c.sky > 0.01) {
    g.save(); g.globalAlpha = Math.min(1, c.sky);
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#07020c'); gr.addColorStop(0.6, '#1c0718'); gr.addColorStop(1, '#3a0c22');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#ffd8e6'; for (const s of c.stars) { g.globalAlpha = Math.min(1, c.sky) * (0.3 + 0.3 * Math.sin(c.f * 0.05 + s[0])); g.fillRect(s[0], s[1], s[2], s[2]); }
    g.restore();
  }
  const [sx, sy] = cam.toScreen(c.tx, c.ty), z = cam.z, R = 260 * z * c.open;
  // cracks spread across the sky
  if (c.crack > 0.01) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    for (let pass = 0; pass < 2; pass++) {
      g.strokeStyle = pass ? '#ffffff' : AM; g.lineWidth = (pass ? 1.6 : 6) * z; g.globalAlpha = pass ? 0.9 : 0.45;
      for (const cr of c.cracks) {
        const nseg = (cr.length - 1) * Math.min(1, c.crack * 1.2); g.beginPath();
        for (let i = 0; i <= Math.ceil(nseg); i++) { const p = cr[Math.min(i, cr.length - 1)], t = Math.min(1, nseg - i + 1), q = cr[Math.max(0, i - 1)], x = i ? lerp(q[0], p[0], t) : p[0], y = i ? lerp(q[1], p[1], t) : p[1]; i ? g.lineTo(sx + x * 2.6 * z, sy + y * 2.6 * z) : g.moveTo(sx + x * 2.6 * z, sy + y * 2.6 * z); }
        g.stroke();
      }
    }
    g.restore();
  }
  if (R > 1) {
    // the otherworldly space beyond: hot light, a slow spiral, drifting motes
    g.save(); aimTearPath(g, c, sx, sy, R); g.clip();
    const gr = g.createRadialGradient(sx, sy, 0, sx, sy, R * 1.8); gr.addColorStop(0, '#fff6fa'); gr.addColorStop(0.25, '#ff9ec2'); gr.addColorStop(0.6, '#a01a5a'); gr.addColorStop(1, '#2a0630');
    g.fillStyle = gr; g.fillRect(sx - R * 2, sy - R * 1.2, R * 4, R * 2.4);
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,200,225,0.35)'; g.lineWidth = 2 * z;
    for (const [a0, rr, sp] of c.sw) { const a = a0 + c.f * 0.01 * sp; g.beginPath(); g.ellipse(sx, sy, R * 1.6 * rr, R * 0.8 * rr, a * 0.2, a, a + 1.6); g.stroke(); }
    g.globalCompositeOperation = 'source-over';
    // the giant: silhouette first, then her colours; she looks down at them
    if (c.giant > 0.01 && c.A) {
      const S = 4.6 * z, gx = sx - c.A.facing * 30 * z, gy = sy + 640 * z, pal = c.A.colors;
      g.globalAlpha = Math.min(1, c.giant);
      drawFigure(g, c.A.ch, aimGiantPose(), gx, gy, c.A.facing, { mono: '#16040e', scale: S });
      if (c.col > 0.01) { g.globalAlpha = Math.min(1, c.giant) * Math.min(1, c.col); drawFigure(g, c.A.ch, aimGiantPose(), gx, gy, c.A.facing, { pal: { ...pal, ex: 'stare', ul: true }, scale: S, T: c.f, expr: 'normal' }); }
      if (c.eye > 0.01 && FX.hq) {   // her eyes catch the light
        const sk = skeleton(aimGiantPose(), c.A.ch.dims), hp = headPt(sk, c.A.ch.dims.headR * 0.5, c.A.ch.dims.headR * 0.26), ex = gx + c.A.facing * hp[0] * S, ey = gy + hp[1] * S;
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = c.eye * (0.6 + 0.3 * Math.sin(c.f * 0.4));
        const eg = g.createRadialGradient(ex, ey, 0, ex, ey, 40 * z); eg.addColorStop(0, 'rgba(255,60,110,0.9)'); eg.addColorStop(1, 'rgba(255,60,110,0)'); g.fillStyle = eg; g.fillRect(ex - 40 * z, ey - 40 * z, 80 * z, 80 * z);
      }
    }
    g.restore();
    // bright torn edge
    g.save(); g.globalCompositeOperation = 'lighter'; aimTearPath(g, c, sx, sy, R);
    g.strokeStyle = AM; g.lineWidth = 10 * z; g.globalAlpha = 0.5; g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 3 * z; g.globalAlpha = 1; g.stroke();
    // light rays falling to the ground
    g.globalAlpha = 0.12 * Math.min(1, c.open); g.fillStyle = '#ffc0d8';
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(sx + i * R * 0.5, sy + R * 0.3); g.lineTo(sx + i * R * 1.3 - R * 0.3, H); g.lineTo(sx + i * R * 1.3 + R * 0.3, H); g.closePath(); g.fill(); }
    g.restore();
  }
  // fragments of the sky breaking away from the edge
  if (c.frags.length && c.open > 0.01) {
    g.save();
    for (const q of c.frags) {
      const R0 = 260 * z * Math.max(c.open, 0.6), x = sx + Math.cos(q.a) * R0 * 1.7 * q.r, y = sy + Math.sin(q.a) * R0 * 0.85 * q.r + q.fall * z;
      if (y > H + 40) continue;
      g.save(); g.translate(x, y); g.rotate(q.rot); const s = q.s * z;
      g.fillStyle = '#1c0718'; g.strokeStyle = AMH; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-s, -s * 0.4); g.lineTo(s * 0.6, -s * 0.7); g.lineTo(s, s * 0.5); g.lineTo(-s * 0.3, s * 0.6); g.closePath(); g.fill(); g.stroke();
      g.restore();
    }
    g.restore();
  }
};
const AIM_GP = {}; function aimGiantPose() { return AIM_GP.p || (AIM_GP.p = buildPose(AIMI, AIM_GIANT_POSE)); }
AIMI.cineFg = (g, c) => {   // in front of everything: the giant hand, the vanish glitch, the closing flash and shockwave
  const cam = BT && BT.cam; if (!cam) return;
  const z = cam.z;
  if (c.glitch > 0 && c.A) {   // a spatial "skip" where she stands
    const [ax, ay] = cam.toScreen(c.A.x, c.A.y - 100);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) { const y = ay - 110 * z + i * 32 * z + ((c.f * 7 + i * 13) % 20), off = Math.sin(c.f * 1.7 + i) * 22 * z; g.fillStyle = i % 2 ? 'rgba(255,79,139,0.45)' : 'rgba(120,220,255,0.3)'; g.fillRect(ax - 60 * z + off, y, 120 * z, 6 * z); }
    g.restore();
  }
  if (c.hand > 0.01 && c.D) {
    const [sx, sy] = cam.toScreen(c.tx, c.ty), ch = c.D.chestW(), [dx, dy] = cam.toScreen(ch[0], ch[1]);
    const x0 = sx + c.A.facing * 10 * z, y0 = sy + 205 * z * Math.max(0.6, Math.min(1, c.open)), x1 = lerp(x0, dx, c.hand), y1 = lerp(y0, dy - 30 * z, c.hand);
    const ang = Math.atan2(y1 - y0, x1 - x0), wA = 70 * z, wH = 52 * z, pal = c.A.colors;
    g.save();
    // sleeve / arm from the opening
    g.lineCap = 'round'; g.strokeStyle = OUTLINE; g.lineWidth = wA + 6; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    const ag = g.createLinearGradient(x0, y0, x1, y1); ag.addColorStop(0, pal.farm); ag.addColorStop(0.75, pal.farm); ag.addColorStop(0.85, pal.cuff || pal.farm); ag.addColorStop(1, pal.hand);
    g.strokeStyle = ag; g.lineWidth = wA; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    // the hand: palm + four fingers that close around them, thumb from the other side
    g.translate(x1, y1); g.rotate(ang - Math.PI / 2);
    const k = c.grip, fill = pal.hand;
    g.fillStyle = fill; g.strokeStyle = OUTLINE; g.lineWidth = 3;
    g.beginPath(); g.ellipse(0, wH * 0.4, wH * 0.75, wH * 0.65, 0, 0, TAU); g.fill(); g.stroke();
    for (let i = 0; i < 4; i++) {
      const bx = (i - 1.5) * wH * 0.36, a = -0.15 + (i - 1.5) * 0.12, L = wH * (1.05 + (i === 1 || i === 2 ? 0.15 : 0)), curl = k * 1.9;
      g.save(); g.translate(bx, wH * 0.85); g.rotate(a);
      g.beginPath(); g.moveTo(-wH * 0.15, 0); g.quadraticCurveTo(-wH * 0.18 - curl * wH * 0.2, L * 0.6, -curl * wH * 0.45, L * (1 - k * 0.45)); g.lineTo(wH * 0.15 - curl * wH * 0.45, L * (1 - k * 0.45)); g.quadraticCurveTo(wH * 0.18 - curl * wH * 0.1, L * 0.5, wH * 0.15, 0); g.closePath();
      g.fill(); g.stroke(); g.restore();
    }
    g.save(); g.translate(wH * 0.7, wH * 0.4); g.rotate(-0.6 + k * 1.3); g.beginPath(); g.ellipse(0, wH * 0.35, wH * 0.17, wH * 0.45, 0, 0, TAU); g.fill(); g.stroke(); g.restore();
    g.restore();
  }
  if (c.flash > 0.01) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = c.flash; const gr = g.createRadialGradient(W / 2, H * 0.3, 10, W / 2, H * 0.3, W); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.4, '#ff9ec2'); gr.addColorStop(1, 'rgba(160,20,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
  if (c.shock > 0.01 && c.shock < 1.2) {
    const [sx, sy] = cam.toScreen(c.D ? c.D.x : c.tx, GROUND), r = c.shock * W;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.max(0, 1 - c.shock); g.strokeStyle = AMH; g.lineWidth = 12 * (1.2 - c.shock); g.beginPath(); g.ellipse(sx, sy, r, r * 0.22, 0, 0, TAU); g.stroke(); g.restore();
  }
  if (c.quiet > 0.01) { g.save(); const gr = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
};

// ---------------------------------- HUD + how-to ----------------------------------
AIMI.drawHand = (g, F, side, t) => {
  const ul = F.ulT > 0, calm = F.calmT > 0;
  xpPanel(g, F, side, t, {
    col: ul ? AMR : AM, col2: '#ffffff', icon: '', flash: ul,
    title: ul ? 'UNSTABLE LOVE' : calm ? 'OBSESSION · CALM' : 'OBSESSION',
    sub: ul ? '狂愛 · FASTER · STRONGER GUN · EXTRA HITS' : calm ? 'catching her breath… no gain' : '執着 · hit, shoot, chase, interrupt',
    k: ul ? F.ulT / AIM_UL : (F.obs || 0) / 100, label: ul ? `${(F.ulT / 60).toFixed(1)}s` : `${Math.floor(F.obs || 0)}`, marks: [0.6],
    badges: [['sp1', 'S1|DASH'], ['sp1f', '↓→S1|SHOT'], ['counter', '↓←S1|POINT'], ['sp2', 'S2|PURSUIT'], ['sp2f', '↓→S2|RAIN'], ['sp2d', '↓↓S2|NO ESC']],
  });
  // the gauge icon: a heart that fills (and cracks in Unstable Love)
  const pw = 330, x0 = side > 0 ? 40 : W - 40 - pw, ix = side > 0 ? x0 + 33 : x0 + pw - 33, iy = 560 + 34;
  g.save(); g.globalAlpha = 0.95; aimHeart(g, ix, iy, 13, ul ? '#ffffff' : (F.obs || 0) >= 60 ? '#ffd0e0' : 'rgba(255,255,255,0.55)', ul); g.restore();
};
AIMI.howTo = {
  title: 'AIMI',
  draw(g) {
    xpHowTo(g, 'AIMI — THE DEVOTED GAZE', AM, [
      ['OBSESSION', 'Grows when she lands hits (+2, specials +4), gun hits (+3–5), long combos, interrupts a startup (+8) or catches a retreating opponent (+6). Fades only if she stops engaging.'],
      ['UNSTABLE LOVE', 'At 100: 5.5 s of faster attacks and walk, +6% damage, stronger shots, Pursuit +1 hit, Rain 7 rounds, Point-Blank launches. Then a 4 s calm with no gain.'],
      ['SP1', 'Predatory Dash — fast low rush into a knee (combo starter). SP1 again on hit: Stay With Me (point-blank shot, knockdown).'],
      ['↓→ SP1', 'Deadly Accuracy — one precise pistol round (~700 px), 14 f startup. Blockable / jumpable.'],
      ['↓← SP1', 'Point-Blank — steps in and fires into them. Short range, big damage, long recovery on a miss.'],
      ['SP2', 'Obsessive Pursuit — blinks out, reappears in front of them (max ~460 px) for a blockable 4-hit flurry.'],
      ['↓→ SP2', 'Rain of Bullets — 5 rounds in rhythm, the last one heavy. Blockable; jump or dash between rounds.'],
      ['↓↓ SP2', 'No Escape — red warning circle where they stand, then the ground bursts while they stay inside.'],
    ], 'Pressure with shots, then chase. M → H → SP1 → SP1 is her bread and butter. Ultimate (SP1+SP2): THE SKY BREAKS.');
  },
};

CHARS.push(AIMI);
finalizeMoves(AIMI);
