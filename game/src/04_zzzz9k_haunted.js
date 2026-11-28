// ===================== HAUNTED FOUR — The Midnight Band (fighter #25, 2026-11-28) =====================
// One select slot, four ORIGINAL haunted animatronics (inspired by the classic pizzeria-band horror idea, own names,
// faces and outfits). Selecting the slot rolls ONE of the four at match start (25 % each, independently per player),
// and the form stays for the whole match (no switching in the fight, unlike Nue):
//   BARNABY (brown bear, ALL-ROUNDER) · RIFF (purple rabbit, GRAPPLER) · SUNNY (yellow chicken, ZONER, cupcake)
//   RUSTY (red pirate fox, RUSHDOWN). Each form is a full fighter (own rig details, normals, six specials, stats,
//   balance, HUD, sounds). All four share the ultimate THE GOLDEN SPRINGLOCK (04_zzzz9l_haunted_cine.js).
// The roll uses Math.random inside the Battle (seeded NetRng online and in replays → both peers get the same form).
// Tests can force forms with the global HF_FORCE ('bear' or ['bear','fox'] for P1/P2).
// Forms are Object.create(HAUNTED) like Nue's beast forms, so every id-keyed system (mastery, cosmetics, unlocks,
// story, trials) treats them as the 'haunted' slot.

const HF_IDS = ['bear', 'rabbit', 'chicken', 'fox'];
const HF_CFG = {
  showtime: { t: 300, haste: 0.3, dmg: 1.08 },          // Barnaby SP2 buff
  ooo: { t: 240, haste: 0.35, walk: 1.35 },             // Rusty OUT OF ORDER
  power: { t: 360, grab: 1.25, dmg: 1.08, walk: 1.1 },  // Riff ENDOSKELETON POWER
  cupBack: 22,                                          // frames until Sunny's cupcake hops back into her hand
  guard: { life: 300, every: 56, range: 360, bite: 76 },
};
const HF_ENDO = '#8c919c', HF_ENDO2 = '#5c606a', HF_BOLT = '#c9ced8';
let HF_FORCE = null;

// ---------------------------------- shared drawing ----------------------------------
function hfBolt(g, x, y, r, R) { if (R.mono) return; g.fillStyle = HF_BOLT; g.strokeStyle = OUTLINE; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke(); g.fillStyle = HF_ENDO2; g.fillRect(x - r * 0.6, y - 0.5, r * 1.2, 1); }
// animatronic face: plate eyes with glowing pupils, heavy eyelids, a muzzle / beak with a hinged jaw seam
function hfFace(kind) {
  return function (g, r, c, o) {
    const e = o.expr || 'normal', hurt = e === 'hurt' || e === 'ko', open = e === 'shout' || hurt || c.jaw;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    // muzzle / beak
    if (kind === 'chicken') {
      const jy = open ? 0.16 : 0;
      g.fillStyle = c.beak; g.strokeStyle = OUTLINE; g.lineWidth = 0.05 * r;
      g.beginPath(); g.moveTo(0.62 * r, 0.3 * r); g.quadraticCurveTo(1.32 * r, 0.36 * r, 1.36 * r, 0.5 * r); g.quadraticCurveTo(1.0 * r, 0.56 * r, 0.62 * r, 0.56 * r); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(0.64 * r, (0.6 + jy) * r); g.quadraticCurveTo(1.18 * r, (0.6 + jy) * r, 1.24 * r, (0.66 + jy) * r); g.quadraticCurveTo(0.96 * r, (0.86 + jy) * r, 0.62 * r, (0.8 + jy) * r); g.closePath(); g.fill(); g.stroke();
      if (open) { g.fillStyle = '#1a0a10'; g.beginPath(); g.moveTo(0.66 * r, 0.57 * r); g.lineTo(1.2 * r, 0.6 * r); g.lineTo(0.66 * r, (0.6 + jy) * r); g.closePath(); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(0.9 * r, 0.38 * r, 0.16 * r, 0.04 * r, 0.05, 0, TAU); g.fill();
    } else {
      const long = kind === 'fox' ? 1.18 : 1, mx = 0.74 * r * (kind === 'fox' ? 1.06 : 1), my = 0.52 * r;
      g.fillStyle = c.muzzle; g.strokeStyle = OUTLINE; g.lineWidth = 0.05 * r;
      g.beginPath(); g.ellipse(mx, my, 0.36 * r * long, 0.27 * r, 0, 0, TAU); g.fill(); g.stroke();
      // hinged jaw: a seam line, and when open a dark mouth with blunt plate "teeth"
      if (open) {
        g.fillStyle = '#140810'; g.beginPath(); g.moveTo(0.42 * r, 0.6 * r); g.lineTo((0.74 + 0.4 * long) * r, 0.58 * r); g.lineTo((0.66 + 0.3 * long) * r, 0.98 * r); g.lineTo(0.44 * r, 0.88 * r); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#e8e2d0'; for (let i = 0; i < 4; i++) { const tx = (0.48 + i * 0.13 * long) * r; g.fillRect(tx, 0.6 * r, 0.07 * r, 0.09 * r); g.fillRect(tx + 0.02 * r, 0.82 * r, 0.06 * r, 0.07 * r); }
      } else {
        g.strokeStyle = OUTLINE; g.lineWidth = 0.04 * r; g.beginPath(); g.moveTo(0.44 * r, 0.66 * r); g.quadraticCurveTo(0.8 * r, 0.74 * r, (0.72 + 0.36 * long) * r, 0.6 * r); g.stroke();
        g.fillStyle = 'rgba(232,226,208,0.9)'; for (let i = 0; i < 3; i++) g.fillRect((0.56 + i * 0.14 * long) * r, 0.66 * r, 0.06 * r, 0.05 * r);
      }
      g.fillStyle = c.nose || '#1a1218'; g.beginPath(); g.ellipse(mx + 0.3 * r * long, my - 0.1 * r, 0.11 * r, 0.075 * r, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.arc(mx + 0.27 * r * long, my - 0.13 * r, 0.025 * r, 0, TAU); g.fill();
    }
    // eyes: white plates, glowing pupils, heavy mechanical lids
    const ey = 0.06 * r, eyes = [[0.42 * r, 0.21 * r, 0.27 * r, false], [0.9 * r, 0.08 * r, 0.23 * r, true]];
    const glow = c.eyeGlow || o.glow;
    for (const [ex, w, h, far] of eyes) {
      if (far && c.patch) continue;
      g.fillStyle = c.sclera || '#f2efe6'; g.strokeStyle = OUTLINE; g.lineWidth = 0.045 * r;
      g.beginPath(); g.ellipse(ex, ey, w, h, 0, 0, TAU); g.fill(); g.stroke();
      if (hurt) {
        g.strokeStyle = OUTLINE; g.lineWidth = 0.06 * r; g.beginPath(); g.moveTo(ex - w * 0.6, ey - h * 0.5); g.lineTo(ex + w * 0.6, ey + h * 0.5); g.moveTo(ex + w * 0.6, ey - h * 0.5); g.lineTo(ex - w * 0.6, ey + h * 0.5); g.stroke();
      } else {
        const pc = glow ? c.eyeHot || c.eye : c.eye, pr = (far ? 0.42 : 0.38) * w;
        if (glow && FX.hq) { g.shadowColor = pc; g.shadowBlur = 10; }
        g.fillStyle = c.iris || '#141018'; g.beginPath(); g.ellipse(ex + w * 0.18, ey + h * 0.08, w * 0.62, h * 0.66, 0, 0, TAU); g.fill();
        g.fillStyle = pc; g.beginPath(); g.arc(ex + w * 0.22, ey + h * 0.1, pr, 0, TAU); g.fill();
        g.shadowBlur = 0; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(ex + w * 0.06, ey - h * 0.12, pr * 0.42, 0, TAU); g.fill();
      }
      // eyelid plate (lower = more menacing)
      const lid = e === 'grin' ? 0.62 : e === 'shout' ? 0.3 : c.eyeGlow ? 0.5 : 0.42;
      g.fillStyle = c.lid || c.skin; g.beginPath(); g.ellipse(ex, ey - h * (1 - lid), w * 1.12, h * lid * 1.05, 0, Math.PI, TAU); g.lineTo(ex + w * 1.12, ey - h * (1 - lid)); g.closePath(); g.fill();
      g.strokeStyle = OUTLINE; g.lineWidth = 0.05 * r; g.beginPath(); g.moveTo(ex - w * 1.05, ey - h * (1 - lid) + 0.5); g.lineTo(ex + w * 1.05, ey - h * (1 - lid) + 0.5); g.stroke();
    }
    if (c.patch) {   // Rusty: black eyepatch over the far eye, strap across the head
      g.fillStyle = '#141018'; g.strokeStyle = OUTLINE; g.lineWidth = 0.04 * r; g.beginPath(); g.ellipse(0.92 * r, 0.06 * r, 0.14 * r, 0.24 * r, 0.1, 0, TAU); g.fill(); g.stroke();
      g.strokeStyle = '#141018'; g.lineWidth = 0.07 * r; g.beginPath(); g.moveTo(0.86 * r, -0.16 * r); g.quadraticCurveTo(0.2 * r, -0.62 * r, -0.7 * r, -0.4 * r); g.stroke();
    }
    // cheek blush plates (animatronic paint, slightly scratched)
    if (kind !== 'fox') { g.fillStyle = c.blush || 'rgba(255,110,150,0.4)'; g.beginPath(); g.ellipse(0.2 * r, 0.5 * r, 0.12 * r, 0.06 * r, 0, 0, TAU); g.fill(); }
    // wear and tear: a crack line and a scuff
    g.strokeStyle = 'rgba(20,10,16,0.55)'; g.lineWidth = 0.03 * r; g.beginPath(); g.moveTo(-0.2 * r, -0.62 * r); g.lineTo(-0.08 * r, -0.44 * r); g.lineTo(-0.16 * r, -0.3 * r); g.stroke();
    g.restore();
  };
}
// fur torso: lighter belly patch, a torn panel that shows the endoskeleton, bolts
function hfTorso(g, L, bw, c, R, o) {
  if (c.belly) { g.fillStyle = c.belly; g.beginPath(); g.ellipse(2 * bw, -L * 0.42, 9 * bw, L * 0.36, 0, 0, TAU); g.fill(); }
  // torn panel with wires (damage)
  g.fillStyle = HF_ENDO2; g.beginPath(); g.moveTo(-12 * bw, -L * 0.74); g.lineTo(-5 * bw, -L * 0.8); g.lineTo(-3 * bw, -L * 0.62); g.lineTo(-7 * bw, -L * 0.52); g.lineTo(-12 * bw, -L * 0.56); g.closePath(); g.fill();
  g.strokeStyle = HF_ENDO; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-11 * bw, -L * 0.7); g.lineTo(-5 * bw, -L * 0.66); g.moveTo(-10 * bw, -L * 0.6); g.lineTo(-6 * bw, -L * 0.58); g.stroke();
  g.strokeStyle = '#d04a3a'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(-9 * bw, -L * 0.76); g.quadraticCurveTo(-8 * bw, -L * 0.64, -4 * bw, -L * 0.6); g.stroke();
  // stitched seam down the side
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1; for (let i = 0; i < 4; i++) { const y = -L * (0.2 + i * 0.16); g.beginPath(); g.moveTo(10 * bw, y); g.lineTo(13 * bw, y - 3); g.stroke(); }
}
// big round animatronic foot (Rusty: bare endoskeleton shin + metal foot)
function hfFoot(g, K, F, c, R, back, b) {
  if (c.endoShin) {
    limb(g, K, F, 3.6 * b, 3 * b, R.mono || HF_ENDO, R, back);
    hfBolt(g, K[0], K[1], 3.2 * b, R);
    poly(g, [[F[0] - 7 * b, F[1] - 5 * b], [F[0] + 15 * b, F[1] - 3 * b], [F[0] + 18 * b, F[1] + 4 * b], [F[0] - 8 * b, F[1] + 4 * b]], R.mono || HF_ENDO2, R);
    if (!R.mono) for (let i = 0; i < 3; i++) { g.fillStyle = HF_BOLT; g.fillRect(F[0] + (8 + i * 4) * b, F[1] - 1, 2.4, 4); }
  } else {
    limb(g, K, F, 8.6 * b, 7.6 * b, c.leg, R, back);
    g.beginPath(); g.ellipse(F[0] + 6 * b, F[1] + 0.5 * b, 15 * b, 7.5 * b, 0, 0, TAU);
    if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = R.ol * 2; g.stroke(); }
    g.fillStyle = R.mono || c.foot || c.leg; g.fill();
    if (!R.mono) { g.fillStyle = c.pad || 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(F[0] + 9 * b, F[1] + 3 * b, 8 * b, 3 * b, 0, 0, TAU); g.fill(); }
  }
  if (back && !R.mono) { g.fillStyle = 'rgba(10,0,26,0.3)'; g.beginPath(); g.ellipse(F[0] + 6 * b, F[1] + 0.5 * b, 15 * b, 7.5 * b, 0, 0, TAU); g.fill(); }
}
function hfBowtie(g, sk, col, R, w = 1) {
  const n = sk.neck, x = n[0] + 4, y = n[1] + 6;
  poly(g, [[x - 11 * w, y - 6], [x, y], [x - 11 * w, y + 6]], R.mono || col, R, 2); poly(g, [[x + 11 * w, y - 6], [x, y], [x + 11 * w, y + 6]], R.mono || col, R, 2);
  if (!R.mono) circ(g, x, y, 3.2, col, R);
}
// metal elbow / knee joints peeking out of the fur
function hfJoints(g, sk, p, c, R) { if (R.mono) return; hfBolt(g, sk.fe[0], sk.fe[1], 3, R); if (!c.endoShin) hfBolt(g, sk.fk[0], sk.fk[1], 3.2, R); }

// ---------------------------------- props ----------------------------------
function hfMic(g, x, y, a, R) {   // a stage microphone (handle along a)
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = R.mono || '#26242c'; g.strokeStyle = OUTLINE; g.lineWidth = 1.5; g.beginPath(); g.rect(-3, -2, 26, 5); g.fill(); g.stroke();
  g.fillStyle = R.mono || '#b8bcc8'; g.beginPath(); g.arc(28, 0.5, 6.5, 0, TAU); g.fill(); g.stroke();
  if (!R.mono) { g.strokeStyle = 'rgba(40,40,50,0.6)'; g.lineWidth = 0.8; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(24, i * 3); g.lineTo(33, i * 3); g.stroke(); } g.fillStyle = '#e84a3a'; g.fillRect(6, -1, 3, 3); }
  g.restore();
}
function hfHook(g, x, y, a, R) {   // a pirate hook instead of a hand
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = R.mono || '#3a2a20'; g.strokeStyle = OUTLINE; g.lineWidth = 1.4; g.beginPath(); g.rect(-4, -5, 9, 10); g.fill(); g.stroke();
  g.strokeStyle = R.mono || OUTLINE; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(4, 0); g.lineTo(14, 0); g.arc(20, -6, 7, Math.PI * 0.75, -Math.PI * 0.6, true); g.stroke();
  g.strokeStyle = R.mono || '#cfd3dc'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(4, 0); g.lineTo(14, 0); g.arc(20, -6, 7, Math.PI * 0.75, -Math.PI * 0.6, true); g.stroke();
  if (!R.mono) { g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1; g.beginPath(); g.arc(20, -6, 7, Math.PI * 0.9, Math.PI * 1.4); g.stroke(); }
  g.restore();
}
function hfGuitar(g, x, y, a, R, s = 1) {   // red electric guitar, held by the neck at (x,y), body along a
  g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s);
  g.fillStyle = R.mono || '#2a1a14'; g.strokeStyle = OUTLINE; g.lineWidth = 1.6; g.beginPath(); g.rect(-6, -2.5, 40, 5); g.fill(); g.stroke();   // neck
  g.fillStyle = R.mono || '#1a1218'; g.beginPath(); g.rect(-13, -4, 8, 8); g.fill(); g.stroke();   // head
  g.beginPath(); g.moveTo(32, -7); g.bezierCurveTo(40, -20, 58, -16, 56, -4); g.bezierCurveTo(70, -8, 74, 12, 60, 14); g.bezierCurveTo(56, 22, 38, 20, 34, 10); g.closePath();
  g.fillStyle = R.mono || '#d0283a'; g.fill(); g.stroke();
  if (!R.mono) {
    g.fillStyle = '#f2ece0'; g.beginPath(); g.ellipse(48, 4, 8, 5, -0.3, 0, TAU); g.fill();
    g.fillStyle = '#1a1218'; g.fillRect(44, -2, 3, 12); g.fillRect(52, -1, 3, 11);
    g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = 0.6; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(-6, i * 1.4); g.lineTo(58, i * 1.4); g.stroke(); }
    g.strokeStyle = 'rgba(30,10,10,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(60, 8); g.lineTo(66, 4); g.lineTo(63, 0); g.stroke();   // a crack in the paint
  }
  g.restore();
}
// Sunny's cupcake "Sprinkles": paper cup, pink frosting, one candle, two little eyes (it watches you)
function hfCupcake(g, x, y, s, R, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s); if (o.rot) g.rotate(o.rot);
  g.strokeStyle = OUTLINE; g.lineWidth = 1.6;
  g.fillStyle = R.mono || '#58c0e0'; g.beginPath(); g.moveTo(-9, 0); g.lineTo(9, 0); g.lineTo(7, 11); g.lineTo(-7, 11); g.closePath(); g.fill(); g.stroke();
  if (!R.mono) { g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 3.4, 1); g.lineTo(i * 2.8, 10); g.stroke(); } }
  g.strokeStyle = OUTLINE; g.lineWidth = 1.6;
  g.fillStyle = R.mono || '#ff7ab0'; g.beginPath(); g.moveTo(-11, 1); g.quadraticCurveTo(-13, -7, -6, -9); g.quadraticCurveTo(0, -16, 6, -9); g.quadraticCurveTo(13, -7, 11, 1); g.closePath(); g.fill(); g.stroke();
  if (!R.mono) {
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(-4, -8, 3.5, 1.6, -0.4, 0, TAU); g.fill();
    for (const [sx, sy, sc] of [[-6, -3, '#ffe24a'], [4, -5, '#7affc8'], [7, -1, '#ffffff'], [-1, -10, '#6ac8ff']]) { g.fillStyle = sc; g.fillRect(sx, sy, 2.2, 1.2); }
    // eyes
    const ec = o.angry ? '#ff3a3a' : '#141018';
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(-3.6, -3, 2.6, 0, TAU); g.arc(3.6, -3, 2.6, 0, TAU); g.fill();
    g.fillStyle = ec; g.beginPath(); g.arc(-3.1, -2.6, 1.3, 0, TAU); g.arc(4.1, -2.6, 1.3, 0, TAU); g.fill();
    if (o.angry) { g.strokeStyle = OUTLINE; g.lineWidth = 1; g.beginPath(); g.moveTo(-6, -6.5); g.lineTo(-1.5, -5); g.moveTo(6, -6.5); g.lineTo(1.5, -5); g.stroke(); }
    // candle + flame
    g.fillStyle = '#f6f2ea'; g.strokeStyle = OUTLINE; g.lineWidth = 1; g.fillRect(-1.5, -22, 3, 8); g.strokeRect(-1.5, -22, 3, 8);
    g.fillStyle = '#ff5a8a'; g.fillRect(-1.5, -19, 3, 1.4);
    const fl = 1 + 0.15 * Math.sin((o.T || 0) * 0.6);
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#ffb02a'; g.beginPath(); g.ellipse(0, -26, 2.4 * fl, 4 * fl, 0, 0, TAU); g.fill(); g.fillStyle = '#fff0a0'; g.beginPath(); g.ellipse(0, -25, 1.1, 2, 0, 0, TAU); g.fill(); g.restore();
  }
  g.restore();
}
function hfKitchen(g, x, y, kind, rot, R) {   // supernatural kitchen objects (no blades)
  g.save(); g.translate(x, y); g.rotate(rot); g.strokeStyle = OUTLINE; g.lineWidth = 1.6;
  if (kind === 0) {   // frying pan
    g.fillStyle = '#2a2a32'; g.beginPath(); g.arc(0, 0, 14, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#3e3e48'; g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.fill();
    g.fillStyle = '#4a2a1a'; g.beginPath(); g.rect(13, -3, 20, 6); g.fill(); g.stroke();
  } else if (kind === 1) {   // dinner plate
    g.fillStyle = '#f2efe6'; g.beginPath(); g.ellipse(0, 0, 15, 15, 0, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = '#ffa21a'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.stroke();
  } else {   // wooden rolling pin
    g.fillStyle = '#c89a5a'; g.beginPath(); g.rect(-14, -5, 28, 10); g.fill(); g.stroke(); g.fillStyle = '#8a5a2a'; g.fillRect(-22, -2.5, 8, 5); g.fillRect(14, -2.5, 8, 5);
  }
  g.restore();
}
// floating music notes / ghost wisps
function hfNote(x, y, col) { FX.wtext(x, y, Math.random() < 0.5 ? '♪' : '♫', { size: 22, color: col, stroke: '#140a10', life: 34, vy: -1.1 }); }

// ---------------------------------- the slot (select screen / menus) ----------------------------------
const HAUNTED = {
  id: 'haunted', name: 'HAUNTED FOUR', jp: 'ホーンテッド・フォー', title: 'The Midnight Band', titleJp: '真夜中の楽団',
  style: 'RANDOM · 4 ANIMATRONICS', desc: 'Four haunted animatronics, one slot: each match you become one of them at random — bear, rabbit, chicken or fox.',
  stats: { power: 3, speed: 3, range: 3, defense: 3 },
  scale: 1.0, health: 1000, walk: 4.4, backWalk: 4, jumpV: -17, jumpX: 5, dashV: 14, backdashV: 11, backdashInv: 10, juggleMax: 6,
  voicePitch: 0.5, voiceRate: 0.8,
  colors: { skin: '#8a5a34', top: '#8a5a34', uarm: '#8a5a34', farm: '#8a5a34', hand: '#8a5a34', leg: '#8a5a34', foot: '#8a5a34', accent: '#ffc24a', eye: '#6ad0ff', belt: null, male: 1 },
  afterColors: ['#ffc24a', '#a77bff', '#ffd23a', '#ff3a3a'],
  hurt: { w: 52, h: 174 },
  stance: { t: 0.06, hd: 0.1, fa1: 0.3, fa2: 0.7, ba1: 0.2, ba2: 0.55, fl1: 0.24, fl2: 0.04, bl1: -0.2, bl2: -0.1 },
  poses: {},
  intro: '...', wins: ['...'],
  noEar: true,
};
makeChibi(HAUNTED, { build: { arm: 1.1, leg: 1.04, torso: 1.2 }, colors: {} });
HAUNTED.drawBoot = hfFoot;
const HF_FORMS = {};
// select tile / portrait / cut-in: all four together (back row rabbit + chicken, front row bear + fox)
HAUNTED.drawCustom = function (g, ch, p, x, y, facing, o) {
  const T = o.T || 0, sc = (o.scale || 1) * 0.86;
  const lay = [['rabbit', -30, -14, 0.9], ['chicken', 34, -10, 0.88], ['fox', 22, 6, 0.95], ['bear', -14, 10, 1]];
  for (const [id, dx, dy, k] of lay) {
    const F = HF_FORMS[id]; if (!F) continue;
    const pp = buildPose(F, (o.pose && F.poses[o.pose]) ? o.pose : 'stance');
    const s = (o.scale || 1);
    drawFigure(g, F, pp, x + dx * s * facing, y + dy * s, facing, { ...o, ropes: null, pal: null, scale: sc * k, T: T + dx });
  }
};

// ---------------------------------- form factory ----------------------------------
function hfForm(id, o) {
  const f = Object.create(HAUNTED);
  Object.assign(f, { formId: id, _art: null, _rc: null, _cosPal: null, noEar: true, chibi: true, dims: { ...CHIBI_DIMS }, drawBoot: hfFoot, drawCustom: null, portraitScale: 0.68 }, o);
  f.faceFn = hfFace(id);
  f.colors = { belt: null, cuff: null, male: 1, ...o.colors };
  f.poses = { ...HF_POSES, ...(o.poses || {}) };
  HF_FORMS[id] = f;
  return f;
}
const HF_POSES = {
  dash: { t: 0.5, hd: -0.1, fa1: -0.3, fa2: -0.1, ba1: -0.6, ba2: -0.3, fl1: 0.9, fl2: 0.25, bl1: -0.55, bl2: -0.75 },
  twitch: { t: 0.02, hd: -0.45, fa1: 0.2, fa2: 0.4, ba1: 0.3, ba2: 0.9, fl1: 0.24, fl2: 0.04, bl1: -0.2, bl2: -0.1 },
  slump: { t: 0.35, hd: 0.6, fa1: -0.1, fa2: 0.1, ba1: -0.1, ba2: 0.1, fl1: 0.2, fl2: 0.05, bl1: -0.2, bl2: -0.1 },
  defeat: { ground: 0, hipH: 18, t: 0.3, hd: 0.7, fa1: -0.2, fa2: 0.2, ba1: -0.3, ba2: 0.1, fl1: 1.5, fl2: 1.4, bl1: 1.2, bl2: 2.4 },
  wave: { t: -0.05, hd: -0.1, fa1: 2.7, fa2: 3.4, ba1: 0.2, ba2: 0.5 },
  bow: { t: 0.55, hd: 0.3, fa1: 0.7, fa2: 1.5, ba1: -0.5, ba2: -0.2, fl1: 0.2, bl1: -0.2 },
  intro: { t: 0.02, hd: -0.45, fa1: 0.2, fa2: 0.4, ba1: 0.3, ba2: 0.9, fl1: 0.24, fl2: 0.04, bl1: -0.2, bl2: -0.1 },
  victory: { t: -0.1, hd: -0.2, fa1: 2.7, fa2: 3.4, ba1: 0.6, ba2: 1.2 },
  dive: { base: 'jump', t: 0.6, hd: 0.3, fa1: 2.2, fa2: 2.1 },
};
// palette per state (draw-only, derived from sim state; cached per key)
const HF_PAL = new Map();
function hfPalette(F) {
  const ch = F.ch, key = ch.formId + '|' + (F.hfGlow ? 1 : 0) + (F.hfJaw ? 1 : 0) + '|' + (F.hfProp || '') + '|' + (F.hfCup === 'hand' ? 1 : 0);
  let p = HF_PAL.get(key);
  if (!p) HF_PAL.set(key, p = { ...ch.colors, eyeGlow: F.hfGlow ? 1 : 0, jaw: F.hfJaw ? 1 : 0, prop: F.hfProp || ch.colors.prop || null, cup: F.hfCup === 'hand' ? 1 : 0 });
  return p;
}
// shared per-form gameplay hooks
function hfBuffs(F) { return F.hfBuf || (F.hfBuf = { t: 0, max: 1, k: null }); }
function hfDmg(F) {
  const B = hfBuffs(F); let m = 1;
  if (B.t > 0) m *= B.k === 'show' ? HF_CFG.showtime.dmg : B.k === 'power' ? HF_CFG.power.dmg : 1;
  return m;
}
function hfStartBuff(F, k, t, name, col) {
  const B = hfBuffs(F); B.t = B.max = t; B.k = k;
  FX.ring(F.x, F.y - 100, col, 10, 160, 18, 7, 0.4); FX.burst(F.x, F.y - 100, col, 20, 9); FX.flashScreen(col, 6, 0.25);
  FX.wtext(F.x, F.y - 250 * F.s, name, { size: 30, color: '#ffffff', stroke: col, life: 46 });
}
// grabs: a short scripted hold (cinematic), damage scales with Riff's Endoskeleton Power
const hfGrabMul = A => (hfBuffs(A).t > 0 && hfBuffs(A).k === 'power' ? HF_CFG.power.grab : 1);
function hfGrabMove(o) {
  return Object.assign({ special: 1, lvl: 4, dmg: 1, type: 'unblock', grab: 1, str: 3, sfx: 'grab', poses: ['hug_w', 'grab'] }, o, {
    onHit(F, D) { BT.startCine(F, D, CINE[o.cine], { zoom: o.zoom || 1.2 }); return true; },
  });
}

// ===================================== 1. BARNABY (bear, ALL-ROUNDER) =====================================
const HF_BEAR = hfForm('bear', {
  name: 'BARNABY', jp: 'バーナビー', title: 'The Haunted Showman', titleJp: '呪われた座長', style: 'ALL-ROUNDER', fclass: 'allround',
  desc: 'The band leader: a worn brown bear with a top hat, bow tie and microphone. Solid at every range, no big weakness, no extreme strength.',
  stats: { power: 3, speed: 3, range: 3, defense: 3 },
  scale: 1.0, health: 1000, walk: 4.4, backWalk: 4.0, jumpV: -17, jumpX: 5, dashV: 14, backdashV: 11, backdashInv: 10, juggleMax: 6,
  voicePitch: 0.42, voiceRate: 0.78, defMul: 1,
  colors: { skin: '#8a5a34', lid: '#7a4c2a', top: '#8a5a34', uarm: '#8a5a34', farm: '#8a5a34', hand: '#8a5a34', leg: '#8a5a34', foot: '#7a4c2a', pad: '#c8995e',
    belly: '#c8995e', muzzle: '#d8b07a', earIn: '#c8995e', hat: '#18141c', band: '#b8323a', tie: '#18141c', accent: '#ffc24a', eye: '#6ad0ff', eyeHot: '#ffffff', iris: '#0a1420', blush: 'rgba(255,120,130,0.35)', prop: 'mic' },
  build: { arm: 1.14, leg: 1.06, torso: 1.24 },
  afterColors: ['#ffc24a', '#8a5a34', '#ffe9a0'],
  hurt: { w: 54, h: 174 },
  stance: { t: 0.06, hd: 0.08, fa1: 0.5, fa2: 1.6, ba1: 0.15, ba2: 0.5, fl1: 0.24, fl2: 0.04, bl1: -0.22, bl2: -0.1 },
  poses: {
    mic_w: { t: -0.14, hd: 0.0, fa1: 2.6, fa2: 3.0, ba1: 0.3, ba2: 0.8, fl1: 0.3, bl1: -0.3 },
    mic: { t: 0.32, hd: 0.1, fa1: 1.45, fa2: 1.3, ba1: -0.2, ba2: 0.2, fl1: 0.55, fl2: 0.1, bl1: -0.45, bl2: -0.2 },
    sing: { t: -0.12, hd: -0.25, fa1: 1.0, fa2: 2.7, ba1: 1.5, ba2: 1.6, fl1: 0.3, bl1: -0.25 },
    hug_w: { t: 0.2, hd: 0.05, fa1: 1.7, fa2: 1.5, ba1: 1.6, ba2: 1.4, fl1: 0.5, fl2: 0.1, bl1: -0.4, bl2: -0.2 },
    hug: { t: 0.1, hd: 0.2, fa1: 1.2, fa2: 2.4, ba1: 1.1, ba2: 2.5, fl1: 0.4, bl1: -0.3 },
    stomp_w: { t: -0.15, hd: -0.1, fa1: 1.2, fa2: 1.6, ba1: 1.0, ba2: 1.4, fl1: 1.6, fl2: 0.2, bl1: -0.1, bl2: -0.1 },
    stomp: { t: 0.18, hd: 0.15, fa1: 0.6, fa2: 1.0, ba1: 0.5, ba2: 0.9, fl1: 0.55, fl2: 0.05, bl1: -0.4, bl2: -0.15 },
    showtime: { t: -0.18, hd: -0.3, fa1: 2.9, fa2: 3.1, ba1: 1.5, ba2: 1.7, fl1: 0.3, bl1: -0.3 },
    roar_w: { t: 0.3, hd: 0.3, fa1: 0.6, fa2: 1.4, ba1: 0.5, ba2: 1.3, fl1: 0.4, bl1: -0.35 },
    roar: { t: -0.25, hd: -0.35, fa1: 2.0, fa2: 1.8, ba1: 2.0, ba2: 1.8, fl1: 0.45, fl2: 0.05, bl1: -0.4, bl2: -0.15 },
    victory: { t: -0.12, hd: -0.25, fa1: 1.0, fa2: 2.7, ba1: 2.6, ba2: 3.1 },
  },
  intro: 'Welcome... to the midnight show.',
  wins: ['Thank you, thank you. Same time tomorrow night?', 'The show must go on. It always does.', 'Encore? ...No. You are done.'],
  hairBack(g, r, c, R) {   // round bear ears
    for (const [x, y] of [[-0.62, -0.78], [0.28, -0.98]]) { circ(g, x * r, y * r, 0.3 * r, c.skin, R); if (!R.mono) { g.fillStyle = c.earIn; g.beginPath(); g.arc(x * r + 0.03 * r, y * r + 0.02 * r, 0.16 * r, 0, TAU); g.fill(); } }
  },
  hairFront(g, r, c, R) {   // small black top hat, tilted, with a red band and a scuff
    g.save(); g.translate(0.12 * r, -0.86 * r); g.rotate(0.14);
    poly(g, [[-0.5 * r, 0.06 * r], [0.56 * r, 0.06 * r], [0.56 * r, -0.08 * r], [-0.5 * r, -0.08 * r]], R.mono || c.hat, R, 2);
    poly(g, [[-0.3 * r, -0.06 * r], [0.34 * r, -0.06 * r], [0.3 * r, -0.74 * r], [-0.26 * r, -0.74 * r]], R.mono || c.hat, R, 2);
    if (!R.mono) { g.fillStyle = c.band; g.fillRect(-0.29 * r, -0.24 * r, 0.62 * r, 0.12 * r); g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(-0.22 * r, -0.7 * r, 0.08 * r, 0.4 * r); }
    g.restore();
  },
  neckWear(g, sk, p, c, R) { hfBowtie(g, sk, c.tie, R, 1); },
  torsoDetail: hfTorso,
  shoulderOver: hfJoints,
  weaponFront(g, sk, p, c, R) {
    if (c.prop !== 'mic') return;
    const h = sk.fh, a = Math.atan2(sk.fh[1] - sk.fe[1], sk.fh[0] - sk.fe[0]);
    hfMic(g, h[0] - Math.cos(a) * 4, h[1] - Math.sin(a) * 4, a, R);
  },
});
HF_BEAR.moves = Object.assign(baseNormals({ dmg: 1.0, spd: 0, rng: 1.05 }), {
  sp1: {
    name: 'MIC CHECK', jp: 'マイクチェック', desc: 'A fast swing with the stage microphone. Moderate damage, short hitstun — a reliable combo starter and ender.', special: 1, lvl: 4,
    poses: ['mic_w', 'mic'], st: 8, act: 4, rec: 15, cd: 30, dmg: 66, hs: 24, bs: 13, kb: 4, hb: { x: 10, y: -185, w: 100, h: 74 }, str: 2, sfx: 'micThud',
    sw: { cx: 0, cy: -150, r: 92, a0: -1.7, a1: 0.5, color: '#ffc24a' },
  },
  sp1f: {
    name: 'LULLABY OF THE NIGHT', jp: '夜の子守唄', desc: 'He sings into the mic: rings of distorted sound roll forward (mid range, 2 hits). Armored on startup (absorbs one hit), so it can interrupt an attack. During SHOWTIME the song is louder (3 hits, wider).', special: 1, lvl: 4,
    poses: ['sing', 'sing'], st: 12, act: 1, rec: 18, cd: 70, armor: [1, 13], armorHits: 1, sfx: 'musicBox',
    spawn: { f: 12, fn(F) {
      const show = hfBuffs(F).t > 0 && hfBuffs(F).k === 'show';
      BT.spawn({ owner: F, kind: 'hfWave', x: F.x + F.facing * 60, y: F.y - 120 * F.s, vx: F.facing * 8.5, w: show ? 80 : 64, h: show ? 150 : 124, life: 42, hits: show ? 3 : 2, interval: 8,
        dmg: 30, hs: 18, bs: 10, kb: 2.5, str: 3, clash: 1, color: '#ffc24a', big: show });
      Sound.play('songNote'); hfNote(F.x + F.facing * 30, F.y - 220, '#ffe9a0');
    } },
  },
  counter: hfGrabMove({
    name: 'BEAR HUG', jp: 'ベアハグ', desc: 'Command grab: he wraps the foe in a creaking mechanical squeeze (3 hits) and drops them in the air — follow up with a combo. Short range, beats blocking.',
    poses: ['hug_w', 'hug_w'], st: 7, act: 4, rec: 28, cd: 110, hb: { x: 8, y: -175, w: 72, h: 160 }, cine: 'hfHug', zoom: 1.25,
  }),
  sp2: {
    name: 'SHOWSTOPPER STOMP', jp: 'ショーストッパー', desc: 'A heavy mechanical stomp: a shockwave around his feet hits low on BOTH sides and knocks back. Great against foes rushing in.', special: 1, lvl: 4,
    poses: ['stomp_w', 'stomp'], st: 16, act: 4, rec: 20, cd: 90, dmg: 78, hs: 26, bs: 14, kb: 12, type: 'low', hb: { x: -90, y: -64, w: 290, h: 64 }, str: 3, shake: 10, sfx: 'servo',
    tick(F, f) {
      if (f === 2) { F.vy = -4; F.onGround = false; }
      if (f === 16) { FX.dust(F.x, GROUND, 14); FX.rocks(F.x + F.facing * 30, GROUND, 8); FX.ring(F.x, GROUND - 4, '#ffc24a', 10, 160, 16, 6, 0.25); Sound.play('slam'); Sound.play('servo'); }
    },
  },
  sp2f: {
    name: 'SHOWTIME', jp: 'ショータイム', desc: 'He tips his hat: performance mode for 5 s — faster attacks, +8 % damage, a louder Lullaby, music notes everywhere.', special: 1, lvl: 4,
    poses: ['showtime', 'showtime'], st: 14, act: 1, rec: 14, cd: 720, sfx: 'musicBox',
    spawn: { f: 14, fn(F) { hfStartBuff(F, 'show', HF_CFG.showtime.t, 'SHOWTIME!', '#ffc24a'); Sound.play('songNote'); for (let i = 0; i < 4; i++) hfNote(F.x + rand(-60, 60), F.y - rand(140, 240), '#ffe9a0'); } },
  },
  sp2d: {
    name: 'NIGHTMARE PULSE', jp: '悪夢の鼓動', desc: 'His eyes flare and a pulse of haunted energy rolls out (mid range, front). Moderate damage and a long STUN (big hitstun). Clear tell, long recovery on whiff.', special: 1, lvl: 4,
    poses: ['roar_w', 'roar'], st: 18, act: 5, rec: 26, cd: 300, dmg: 72, hs: 56, bs: 16, kb: 2, hb: { x: -20, y: -230, w: 300, h: 240 }, str: 3, shake: 10, impact: 1, sfx: 'staticHum',
    tick(F, f) {
      F.hfGlow = f <= 30;
      if (f === 18) { FX.ring(F.x + F.facing * 110, F.y - 120, '#6ad0ff', 20, 220, 20, 8, 0.4); FX.ring(F.x + F.facing * 110, F.y - 120, '#ffc24a', 10, 160, 18, 5, 0.4); FX.flashScreen('#081828', 8, 0.4); Sound.play('pulse'); }
    },
    onHit(F, D) { FX.wtext(D.x, D.y - 230 * D.s, 'STUNNED', { size: 26, color: '#6ad0ff', stroke: '#081828', life: 46 }); },
  },
  ult: null,
});
(() => {
  const M = HF_BEAR.moves;
  Object.assign(M.L, { name: 'Paw Jab' }); Object.assign(M.M, { name: 'Stage Kick' }); Object.assign(M.H, { name: 'Mic Drop', poses: ['mic_w', 'mic'] });
  Object.assign(M.cL, { name: 'Low Paw' }); Object.assign(M.cM, { name: 'Shin Kick' }); Object.assign(M.cH, { name: 'Curtain Call' });
  Object.assign(M.jH, { name: 'Falling Hat' }); Object.assign(M.LH, { name: 'Applause Uppercut' }); Object.assign(M.FF, { name: 'Lead Singer Rush' });
})();

// ===================================== 2. RIFF (rabbit, GRAPPLER) =====================================
const HF_RABBIT = hfForm('rabbit', {
  name: 'RIFF', jp: 'リフ', title: 'The Iron Riff', titleJp: '鉄の旋律', style: 'GRAPPLER', fclass: 'grappler',
  desc: 'The guitarist: a big purple rabbit with a red bow tie and a cracked red electric guitar. Slow, almost no range — but his grabs are the most dangerous thing in the pizzeria.',
  stats: { power: 5, speed: 1, range: 1, defense: 4 },
  scale: 1.06, health: 1120, walk: 3.4, backWalk: 3.0, jumpV: -16, jumpX: 4.4, dashV: 11.5, backdashV: 9, backdashInv: 8, juggleMax: 6,
  voicePitch: 0.36, voiceRate: 0.74,
  colors: { skin: '#6a4fc0', lid: '#5a40a8', top: '#6a4fc0', uarm: '#6a4fc0', farm: '#6a4fc0', hand: '#6a4fc0', leg: '#6a4fc0', foot: '#5a40a8', pad: '#a894e0',
    belly: '#a894e0', muzzle: '#b8a6ea', earIn: '#d7a0d8', tie: '#d0283a', accent: '#a77bff', eye: '#ff3a5a', eyeHot: '#ffffff', iris: '#1a0a14', nose: '#d0283a', blush: 'rgba(255,120,170,0.35)', prop: 'guitarBack' },
  build: { arm: 1.22, leg: 1.1, torso: 1.22 },
  afterColors: ['#a77bff', '#6a4fc0', '#d0283a'],
  hurt: { w: 58, h: 180 },
  stance: { t: 0.12, hd: 0.16, fa1: 0.55, fa2: 1.2, ba1: 0.35, ba2: 1.0, fl1: 0.3, fl2: 0.06, bl1: -0.28, bl2: -0.12 },
  poses: {
    grab: { t: 0.32, hd: 0.1, fa1: 1.65, fa2: 1.55, ba1: 1.55, ba2: 1.45, fl1: 0.55, fl2: 0.1, bl1: -0.45, bl2: -0.2 },
    hug_w: { t: 0.28, hd: 0.05, fa1: 1.8, fa2: 1.6, ba1: 1.7, ba2: 1.5, fl1: 0.55, fl2: 0.1, bl1: -0.45, bl2: -0.2 },
    headbutt: { t: 0.5, hd: 0.45, fa1: 1.3, fa2: 2.2, ba1: 1.2, ba2: 2.3, fl1: 0.5, bl1: -0.4 },
    overhead: { t: -0.45, hd: -0.4, fa1: 3.0, fa2: 3.1, ba1: 2.9, ba2: 3.0, fl1: 0.3, fl2: 0.05, bl1: -0.3, bl2: -0.1 },
    power: { t: 0.05, hd: -0.2, fa1: 1.7, fa2: 3.1, ba1: 1.6, ba2: 3.0, fl1: 0.5, fl2: 0.05, bl1: -0.5, bl2: -0.1 },
    guitar_w: { t: -0.35, hd: -0.25, fa1: 3.0, fa2: 2.9, ba1: 2.8, ba2: 2.7, fl1: 0.4, fl2: 0.05, bl1: -0.35, bl2: -0.1 },
    guitar: { t: 0.62, hd: 0.3, fa1: 1.25, fa2: 1.05, ba1: 1.15, ba2: 0.95, fl1: 0.7, fl2: 0.15, bl1: -0.5, bl2: -0.25 },
    crush: { t: 0.2, hd: 0.2, fa1: 1.4, fa2: 2.5, ba1: 1.3, ba2: 2.6, fl1: 0.5, fl2: 0.1, bl1: -0.4, bl2: -0.2 },
    victory: { t: -0.1, hd: -0.25, fa1: 1.6, fa2: 3.1, ba1: 1.6, ba2: 3.0 },
  },
  intro: '...*creak*... *creak*...',
  wins: ['*a long, distorted guitar note*', '...*click*.', 'Backstage is off limits. Forever.'],
  hairBack(g, r, c, R, o) {   // long rabbit ears, the back one bends with his movement
    const T = (o && o.T) || 0, sw = Math.sin(T * 0.05) * 0.05;
    const ear = (bx, by, ang, len, wid) => {
      g.save(); g.translate(bx * r, by * r); g.rotate(ang + sw);
      g.beginPath(); g.ellipse(0, -len * r * 0.5, wid * r, len * r * 0.55, 0, 0, TAU);
      if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = R.ol * 2; g.stroke(); }
      g.fillStyle = R.mono || c.skin; g.fill();
      if (!R.mono) { g.fillStyle = c.earIn; g.beginPath(); g.ellipse(0.02 * r, -len * r * 0.5, wid * 0.5 * r, len * r * 0.42, 0, 0, TAU); g.fill();
        g.fillStyle = HF_ENDO2; g.fillRect(-0.04 * r, -len * r * 0.1, 0.08 * r, 0.1 * r); }   // metal hinge
      g.restore();
    };
    ear(-0.5, -0.7, -0.42, 1.35, 0.24); ear(0.1, -0.86, -0.12, 1.5, 0.26);
  },
  hairFront(g, r, c, R) { if (R.mono) return; g.strokeStyle = 'rgba(20,10,30,0.5)'; g.lineWidth = 0.03 * r; g.beginPath(); g.moveTo(0.3 * r, -0.9 * r); g.lineTo(0.44 * r, -0.7 * r); g.stroke(); },
  neckWear(g, sk, p, c, R) { hfBowtie(g, sk, c.tie, R, 1.1); },
  torsoDetail: hfTorso,
  shoulderOver: hfJoints,
  weaponBack(g, sk, p, c, R) {   // the guitar slung across his back (unless it is in his hands)
    if (c.prop !== 'guitarBack') return;
    const n = sk.neck; hfGuitar(g, n[0] - 16, n[1] - 4, 1.9, R, 0.85);
  },
  weaponFront(g, sk, p, c, R) {
    if (c.prop !== 'guitar') return;
    const h = sk.fh, a = Math.atan2(sk.fh[1] - sk.fe[1], sk.fh[0] - sk.fe[0]);
    hfGuitar(g, h[0], h[1], a, R, 1.05);
  },
});
HF_RABBIT.moves = Object.assign(baseNormals({ dmg: 1.16, spd: 2, rng: 1.06 }), {
  sp1: hfGrabMove({
    name: 'STAGE GRAB', jp: 'ステージ・グラブ', desc: 'Command grab: he snatches the foe, headbutts and knees them and drops them right in front of him, still reeling — the start of a grappling sequence (link a normal or another grab). Short range.',
    st: 6, act: 4, rec: 26, cd: 60, hb: { x: 8, y: -180, w: 74, h: 170 }, cine: 'hfStageGrab',
  }),
  sp1f: hfGrabMove({
    name: 'MECHANICAL THROW', jp: '機械投げ', desc: 'Command grab: over the shoulder and across the stage — they land far BEHIND him (strong knockback, side switch, corner carry).',
    poses: ['hug_w', 'grab'], st: 8, act: 4, rec: 28, cd: 90, hb: { x: 8, y: -180, w: 78, h: 170 }, cine: 'hfMechThrow',
  }),
  counter: hfGrabMove({
    name: 'RABBIT SLAM', jp: 'ラビット・スラム', desc: 'Command grab: he lifts the foe high over his head and slams them into the floor. High damage, hard knockdown.',
    poses: ['hug_w', 'grab'], st: 9, act: 4, rec: 30, cd: 120, hb: { x: 8, y: -180, w: 74, h: 170 }, cine: 'hfRabbitSlam', zoom: 1.15,
  }),
  sp2: {
    name: 'ENDOSKELETON POWER', jp: '骨格の力', desc: 'The suit creaks, the metal underneath takes over: for 6 s his grabs deal +25 % damage, everything else +8 %, he walks faster and his attacks absorb one hit (armor).', special: 1, lvl: 4,
    poses: ['power', 'power'], st: 14, act: 1, rec: 14, cd: 720, sfx: 'servo',
    spawn: { f: 14, fn(F) { hfStartBuff(F, 'power', HF_CFG.power.t, 'ENDOSKELETON POWER', '#ff3a5a'); Sound.play('creak'); Sound.play('servo'); } },
  },
  sp2f: {
    name: 'GUITAR SMASH', jp: 'ギター・スマッシュ', desc: 'He swings the electric guitar overhead like an axe: an OVERHEAD (block standing), high damage, big knockback, armored. Noticeable startup.', special: 1, lvl: 4,
    poses: ['guitar_w', 'guitar'], st: 20, act: 5, rec: 26, cd: 150, dmg: 148, hs: 30, bs: 20, kb: 14, kd: 1, type: 'overhead', armor: [3, 20], armorHits: 1,
    hb: { x: 10, y: -230, w: 150, h: 230 }, str: 4, shake: 14, impact: 1, sfx: 'guitarRiff', sw: { cx: 0, cy: -150, r: 130, a0: -2.2, a1: 0.9, color: '#d0283a' },
    tick(F, f) { if (f === 21) { const x = F.x + F.facing * 130 * F.s; FX.dust(x, GROUND, 10); FX.rocks(x, GROUND, 8); Sound.play('slam'); Sound.play('guitarRiff', 1.4); } },
  },
  sp2d: hfGrabMove({
    name: 'SPRINGLOCK CRUSH', jp: 'スプリングロック・クラッシュ', desc: 'Cinematic command grab: the springlocks inside his suit lock around the foe and snap shut, click by click. Huge damage, long cooldown. Counterplay: slow startup (the gears glow and tick — jump or back off), short range, very long recovery if it misses.',
    poses: ['crush', 'grab'], st: 14, act: 4, rec: 44, cd: 720, hb: { x: 6, y: -180, w: 70, h: 170 }, cine: 'hfCrush', zoom: 1.35,
    tick(F, f) { if (f < 14 && f % 4 === 1) Sound.play('springClick', 0.6); F.hfGlow = f <= 18; },
  }),
  ult: null,
});
(() => {
  const M = HF_RABBIT.moves;
  Object.assign(M.L, { name: 'Heavy Paw' }); Object.assign(M.M, { name: 'Stomp Kick' }); Object.assign(M.H, { name: 'Iron Hammer Fist', poses: ['overhead', 'slam'] });
  Object.assign(M.cL, { name: 'Low Paw' }); Object.assign(M.cM, { name: 'Ankle Crusher' }); Object.assign(M.cH, { name: 'Bass Sweep' });
  Object.assign(M.jH, { name: 'Falling Rabbit' }); Object.assign(M.LH, { name: 'Ear Uppercut' }); Object.assign(M.FF, { name: 'Roadie Tackle' });
})();
HF_RABBIT.armorHits = (F, m) => (hfBuffs(F).t > 0 && hfBuffs(F).k === 'power' && !m.ult ? 1 : 0);
HF_RABBIT.armorBuff = (F, m) => hfBuffs(F).t > 0 && hfBuffs(F).k === 'power' && !m.ult;

// ===================================== 3. SUNNY (chicken, ZONER) =====================================
const HF_CHICKEN = hfForm('chicken', {
  name: 'SUNNY', jp: 'サニー', title: 'The Cupcake Hostess', titleJp: 'カップケーキの女主人', style: 'ZONER', fclass: 'zoner',
  desc: 'The party hostess: a yellow chicken with a white party bib and her cupcake SPRINKLES. The cupcake is her weapon: projectile, bomb, hunter and guard — but she has only ONE. Weak up close.',
  stats: { power: 2, speed: 3, range: 5, defense: 2 },
  scale: 1.0, health: 950, walk: 4.0, backWalk: 4.2, jumpV: -17, jumpX: 5, dashV: 13.5, backdashV: 12, backdashInv: 12, juggleMax: 6,
  voicePitch: 0.95, voiceRate: 0.86, defMul: 1.04,
  colors: { skin: '#f2c230', lid: '#e0ae20', top: '#f2c230', uarm: '#f2c230', farm: '#f2c230', hand: '#f2c230', leg: '#ff9a2a', foot: '#ff8a1a', pad: '#ffc070',
    belly: null, beak: '#ff8a1a', bib: '#f6f2ea', bibText: '#d43a5a', accent: '#ffa21a', eye: '#d05aff', eyeHot: '#ffffff', iris: '#1a0a20', blush: 'rgba(255,110,150,0.45)', prop: null, feather: '#ffd84a' },
  build: { arm: 1.06, leg: 0.98, torso: 1.18 },
  afterColors: ['#ffa21a', '#f2c230', '#ff7ab0'],
  hurt: { w: 52, h: 172 },
  stance: { t: 0.0, hd: 0.06, fa1: 0.9, fa2: 2.2, ba1: 0.2, ba2: 0.6, fl1: 0.2, fl2: 0.04, bl1: -0.18, bl2: -0.1 },
  poses: {
    toss_w: { t: -0.18, hd: -0.05, fa1: 2.7, fa2: 3.1, ba1: 0.8, ba2: 1.2, fl1: 0.25, bl1: -0.35, bl2: -0.1 },
    toss: { t: 0.3, hd: 0.1, fa1: 1.55, fa2: 1.45, ba1: -0.3, ba2: 0.1, fl1: 0.6, fl2: 0.1, bl1: -0.45, bl2: -0.2 },
    lob_w: { t: 0.15, hd: 0.0, fa1: 0.2, fa2: 0.6, ba1: 0.3, ba2: 0.8, fl1: 0.4, bl1: -0.3 },
    lob: { t: -0.2, hd: -0.25, fa1: 2.4, fa2: 2.5, ba1: 0.6, ba2: 1.0, fl1: 0.3, bl1: -0.2 },
    summon: { t: -0.15, hd: -0.3, fa1: 2.5, fa2: 2.8, ba1: 2.4, ba2: 2.7, fl1: 0.28, bl1: -0.25 },
    push: { t: 0.25, hd: 0.05, fa1: 1.6, fa2: 1.6, ba1: 1.5, ba2: 1.5, fl1: 0.5, fl2: 0.1, bl1: -0.4, bl2: -0.2 },
    place: { t: 0.7, hd: 0.3, fa1: 1.0, fa2: 1.1, ba1: 0.4, ba2: 0.7, fl1: 1.1, fl2: -0.3, bl1: 0.2, bl2: -1.0 },
    party: { t: -0.2, hd: -0.35, fa1: 2.8, fa2: 3.2, ba1: 2.7, ba2: 3.1, fl1: 0.3, bl1: -0.3 },
    victory: { t: -0.1, hd: -0.2, fa1: 0.9, fa2: 2.2, ba1: 2.7, ba2: 3.2 },
  },
  intro: 'Party time! Who wants cake?',
  wins: ['Don\'t worry. There\'s always more cake.', 'Sprinkles says you were delicious. ...Kidding. Mostly.', 'Party\'s over! Clean up your mess!'],
  hairFront(g, r, c, R) {   // a little feather tuft on top
    for (const [x, a, l] of [[-0.2, -0.5, 0.42], [0.08, -0.1, 0.5], [0.34, 0.3, 0.38]]) {
      g.save(); g.translate(x * r, -0.92 * r); g.rotate(a); polyR(g, r, [[-0.09, 0], [0, -l], [0.09, 0]], c.feather, R); g.restore();
    }
  },
  neckWear(g, sk, p, c, R) {},
  torsoDetail(g, L, bw, c, R, o) {
    hfTorso(g, L, bw, c, R, o);
    // white party bib with her own slogan
    g.fillStyle = c.bib; g.strokeStyle = OUTLINE; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(-9 * bw, -L * 0.96); g.lineTo(13 * bw, -L * 0.96); g.lineTo(12 * bw, -L * 0.38); g.quadraticCurveTo(2 * bw, -L * 0.24, -8 * bw, -L * 0.38); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(212,58,90,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-6 * bw, -L * 0.9); g.lineTo(10 * bw, -L * 0.9); g.stroke();
    g.save(); g.translate(2 * bw, -L * 0.62); g.rotate(-0.06); g.fillStyle = c.bibText; g.font = `900 ${7 * bw}px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('PARTY', 0, -3.5); g.fillText('TIME!', 0, 4.5); g.restore();
    g.fillStyle = '#ff7ab0'; for (const [x, y] of [[-6, -0.48], [9, -0.46], [-4, -0.8]]) { g.beginPath(); g.arc(x * bw, L * y, 1.4, 0, TAU); g.fill(); }
  },
  drawSkirt(g, sk, p, c, R) {   // stubby tail feathers
    const h = sk.hip; for (let i = 0; i < 3; i++) poly(g, [[h[0] - 12, h[1] - 10 + i * 5], [h[0] - 28 - i * 2, h[1] - 18 + i * 9], [h[0] - 12, h[1] - 2 + i * 5]], R.mono || (i % 2 ? '#e0ae20' : c.feather), R, 2);
  },
  shoulderOver: hfJoints,
  weaponFront(g, sk, p, c, R, o) {
    if (!c.cup) return;
    const h = sk.fh; hfCupcake(g, h[0] + 4, h[1] - 10, 0.85, R, { T: o && o.T });
  },
});
HF_CHICKEN.moves = Object.assign(baseNormals({ dmg: 0.86, spd: 0, rng: 0.98 }), {
  sp1: {
    name: 'CUPCAKE THROW', jp: 'カップケーキ投げ', desc: 'She throws SPRINKLES straight ahead: a fast projectile. The cupcake hops back into her hand after (all SP1 cupcake moves need it in hand).', special: 1, lvl: 4,
    poses: ['toss_w', 'toss'], st: 10, act: 1, rec: 16, cd: 34, sfx: 'cluck', req: F => F.hfCup === 'hand',
    spawn: { f: 10, fn(F) { hfThrowCup(F, { kind: 'hfCup', x: F.x + F.facing * 50, y: F.y - 142 * F.s, vx: F.facing * 14, w: 40, h: 36, life: 70, dmg: 48, hs: 17, bs: 10, kb: 3, str: 2 }); Sound.play('whoosh', 1.2); } },
  },
  sp1f: {
    name: 'CUPCAKE BOMB', jp: 'カップケーキ爆弾', desc: 'A high lob: SPRINKLES explodes on impact or after a short fuse — area damage that launches. Controls space at mid range.', special: 1, lvl: 4,
    poses: ['lob_w', 'lob'], st: 13, act: 1, rec: 18, cd: 90, sfx: 'cluck', req: F => F.hfCup === 'hand',
    spawn: { f: 13, fn(F) {
      const d = F.opp ? clamp(Math.abs(F.opp.x - F.x), 140, 460) : 300;
      hfThrowCup(F, { kind: 'hfBomb', x: F.x + F.facing * 30, y: F.y - 170 * F.s, vx: F.facing * d / 40, vy: -10, grav: 0.5, w: 36, h: 36, life: 70, fuse: 64, dmg: 1, hs: 1, kb: 0, clash: 0, persist: true });
    } },
  },
  counter: {
    name: 'CUPCAKE HUNT', jp: 'カップケーキ狩り', desc: 'SPRINKLES gets angry and chases the foe for 2 s (limited turning — keep moving and it misses). Slow, but it forces them to react.', special: 1, lvl: 4,
    poses: ['toss_w', 'push'], st: 12, act: 1, rec: 18, cd: 120, sfx: 'cluck', req: F => F.hfCup === 'hand',
    spawn: { f: 12, fn(F) { hfThrowCup(F, { kind: 'hfHunt', x: F.x + F.facing * 50, y: F.y - 140 * F.s, vx: F.facing * 6.2, vy: 0, w: 38, h: 36, life: 125, dmg: 56, hs: 20, bs: 12, kb: 4, str: 2 }); } },
  },
  sp2: {
    name: 'KITCHEN NIGHTMARE', jp: '厨房の悪夢', desc: 'A frying pan, a plate and a rolling pin fly out of nowhere in a wide spread — covers the air and the ground in front of her.', special: 1, lvl: 4,
    poses: ['summon', 'push'], st: 15, act: 1, rec: 20, cd: 110, sfx: 'panClang',
    spawn: { f: 15, fn(F) {
      [[10.5, -7.5], [12, -3.5], [11, -0.6]].forEach(([vx, vy], i) => BT.spawn({ owner: F, kind: 'hfDish', obj: i, x: F.x + F.facing * 40, y: F.y - (150 + i * 8) * F.s, vx: F.facing * vx, vy, grav: 0.32, w: 34, h: 30, life: 70, dmg: 30, hs: 16, bs: 9, kb: 3, str: 1, color: '#ffa21a' }));
      Sound.play('panClang'); FX.ring(F.x + F.facing * 40, F.y - 150, '#ffa21a', 8, 80, 12, 4, 0.4);
    } },
  },
  sp2f: {
    name: 'CUPCAKE GUARDIAN', jp: 'カップケーキの守護', desc: 'She puts SPRINKLES on the floor: for 5.5 s it guards that spot on its own — it spits candle flames at the foe in range and bites anyone who comes too close. One guardian at a time; while it guards, her cupcake moves are locked.', special: 1, lvl: 4,
    poses: ['place', 'place'], st: 16, act: 1, rec: 16, cd: 360, sfx: 'cluck', req: F => F.hfCup === 'hand',
    spawn: { f: 16, fn(F) {
      for (const p of BT.projs) if (p.owner === F && p.kind === 'hfGuard') p.dead = true;
      F.hfCup = 'guard';
      BT.spawn({ owner: F, kind: 'hfGuard', x: clamp(F.x + F.facing * 150, 60, STAGE_W - 60), y: GROUND - 20, vx: 0, w: 1, h: 1, life: HF_CFG.guard.life, harmless: true, clash: 0, persist: true, cup: true, ft: 0, bt: 0, dir: F.facing });
      Sound.play('cupPop'); FX.wtext(F.x + F.facing * 150, GROUND - 90, 'GUARD!', { size: 22, color: '#ff7ab0', stroke: '#2a0a18', life: 34 });
    } },
  },
  sp2d: {
    name: 'PARTY TIME!', jp: 'パーティータイム！', desc: 'She calls the whole bakery: a barrage of 7 little cupcakes rains down across the arena, from close to far. Huge coverage, strong zoning, long cooldown.', special: 1, lvl: 4,
    poses: ['party', 'party'], st: 14, act: 1, rec: 22, cd: 420, sfx: 'cupPop',
    tick(F, f) {
      if (f >= 12 && f <= 36 && (f - 12) % 4 === 0) {
        const i = (f - 12) / 4, vx = 3.5 + i * 1.45;
        BT.spawn({ owner: F, kind: 'hfMini', x: F.x + F.facing * 20, y: F.y - 200 * F.s, vx: F.facing * vx, vy: -10.5, grav: 0.42, w: 30, h: 30, life: 80, dmg: 24, hs: 15, bs: 9, kb: 2, str: 1, color: '#ff7ab0', ...(i === 6 ? { launch: -9 } : {}) });
        Sound.play('cupPop', 0.7);
      }
      if (f === 14) FX.wtext(F.x, F.y - 250, 'PARTY TIME!', { size: 30, color: '#ffffff', stroke: '#ff7ab0', life: 40 });
    },
  },
  ult: null,
});
(() => {
  const M = HF_CHICKEN.moves;
  Object.assign(M.L, { name: 'Wing Slap' }); Object.assign(M.M, { name: 'Talon Kick' }); Object.assign(M.H, { name: 'Tray Swing' });
  Object.assign(M.cL, { name: 'Low Peck' }); Object.assign(M.cM, { name: 'Claw Scratch' }); Object.assign(M.cH, { name: 'Tail Sweep' });
  Object.assign(M.jH, { name: 'Belly Flop' }); Object.assign(M.LH, { name: 'Wing Lift' }); Object.assign(M.FF, { name: 'Waddle Rush' });
})();
function hfThrowCup(F, o) { F.hfCup = 'out'; BT.spawn({ owner: F, cup: true, color: '#ff7ab0', ...o }); }

// ===================================== 4. RUSTY (fox, RUSHDOWN) =====================================
const HF_FOX = hfForm('fox', {
  name: 'RUSTY', jp: 'ラスティ', title: 'The Broken Captain', titleJp: '壊れた船長', style: 'RUSHDOWN', fclass: 'rushdown',
  desc: 'The pirate: a red, badly broken fox with a hook, an eyepatch and torn pirate shorts, his endoskeleton showing. The fastest and most aggressive of the four — but fragile, and wide open when he misses.',
  stats: { power: 3, speed: 5, range: 2, defense: 1 },
  scale: 0.98, health: 900, walk: 5.6, backWalk: 4.6, jumpV: -17.5, jumpX: 6, dashV: 18, backdashV: 12, backdashInv: 8, juggleMax: 6,
  voicePitch: 0.62, voiceRate: 1.05, defMul: 1.08,
  colors: { skin: '#b8322a', lid: '#9a2820', top: '#b8322a', uarm: '#b8322a', farm: '#b8322a', hand: '#b8322a', leg: '#b8322a', foot: '#9a2820',
    belly: '#d88a6a', muzzle: '#d88a6a', earIn: '#e8b090', pants: '#5a4030', pants2: '#3e2c22', accent: '#ff3a3a', eye: '#ffd24a', eyeHot: '#ffffff', iris: '#1a0a08', patch: 1, endoShin: 1, prop: 'hook' },
  build: { arm: 1.0, leg: 1.0, torso: 1.02 },
  afterColors: ['#ff3a3a', '#b8322a', '#ffd24a'],
  hurt: { w: 48, h: 170 },
  stance: { t: 0.28, hd: -0.1, fa1: 0.9, fa2: 1.8, ba1: 0.5, ba2: 1.5, fl1: 0.5, fl2: 0.2, bl1: -0.4, bl2: -0.3 },
  poses: {
    hook_w: { t: -0.2, hd: 0.0, fa1: 2.5, fa2: 3.0, ba1: 0.6, ba2: 1.2, fl1: 0.4, fl2: 0.1, bl1: -0.4, bl2: -0.2 },
    hookS: { t: 0.45, hd: 0.0, fa1: 1.45, fa2: 1.0, ba1: -0.3, ba2: 0.1, fl1: 0.65, fl2: 0.15, bl1: -0.5, bl2: -0.3 },
    charge: { t: 0.85, hd: -0.45, fa1: 1.5, fa2: 1.4, ba1: -0.8, ba2: -0.5, fl1: 1.1, fl2: 0.4, bl1: -0.7, bl2: -0.9 },
    amok_a: { t: 0.6, hd: -0.2, fa1: 2.0, fa2: 1.3, ba1: 0.2, ba2: 0.6, fl1: 0.8, fl2: 0.3, bl1: -0.6, bl2: -0.5 },
    amok_b: { t: 0.6, hd: -0.2, fa1: 0.6, fa2: 0.8, ba1: 1.9, ba2: 1.3, fl1: 0.4, fl2: 0.2, bl1: -0.3, bl2: -0.6 },
    plunder: { t: -0.3, hd: -0.3, fa1: 3.0, fa2: 3.0, ba1: 0.4, ba2: 0.8, fl1: 0.5, fl2: 0.1, bl1: -0.3, bl2: -0.2 },
    lurk: { t: 0.9, hd: -0.5, fa1: 0.6, fa2: 1.6, ba1: 0.4, ba2: 1.4, fl1: 1.4, fl2: -0.2, bl1: 0.4, bl2: -1.2 },
    scare_w: { t: 0.7, hd: -0.6, fa1: 1.0, fa2: 1.8, ba1: 0.9, ba2: 1.7, fl1: 1.2, fl2: -0.1, bl1: 0.2, bl2: -1.0 },
    scare: { t: 0.35, hd: -0.45, fa1: 2.4, fa2: 2.1, ba1: 2.3, ba2: 2.0, fl1: 1.0, fl2: 0.4, bl1: -0.7, bl2: -0.6, hipH: 92 },
    ooo: { t: 0.1, hd: -0.6, fa1: 1.2, fa2: 2.6, ba1: 0.4, ba2: 1.4, fl1: 0.3, bl1: -0.3 },
    victory: { t: -0.15, hd: -0.3, fa1: 2.9, fa2: 3.2, ba1: 0.5, ba2: 1.2 },
  },
  intro: 'Arr... the cove be closed... out of order...',
  wins: ['Ye shouldn\'t have stopped running, matey.', 'Out of order? Not tonight!', 'Back to the cove with ye!'],
  hairBack(g, r, c, R) {   // pointed fox ears, one torn
    polyR(g, r, [[-0.82, -0.52], [-0.78, -1.42], [-0.2, -0.86]], c.skin, R);
    polyR(g, r, [[0.0, -0.94], [0.36, -1.66], [0.62, -1.3], [0.54, -0.86]], c.skin, R);
    if (!R.mono) { g.fillStyle = c.earIn; polyR(g, r, [[-0.68, -0.68], [-0.7, -1.18], [-0.36, -0.86]], c.earIn, { mono: null, ol: 0 }); g.fillStyle = HF_ENDO2; g.fillRect(0.38 * r, -1.36 * r, 0.12 * r, 0.12 * r); }
  },
  hairFront(g, r, c, R) {},
  neckWear(g, sk, p, c, R) {   // torn neckerchief
    const n = sk.neck; poly(g, [[n[0] - 9, n[1] + 4], [n[0] + 11, n[1] + 2], [n[0] + 3, n[1] + 16], [n[0] - 1, n[1] + 10]], R.mono || '#2a2030', R, 2);
  },
  torsoDetail(g, L, bw, c, R, o) {
    hfTorso(g, L, bw, c, R, o);
    // a big tear on the chest: ribs of the endoskeleton
    g.fillStyle = '#1a1418'; g.beginPath(); g.moveTo(2 * bw, -L * 0.86); g.lineTo(12 * bw, -L * 0.8); g.lineTo(11 * bw, -L * 0.46); g.lineTo(4 * bw, -L * 0.52); g.closePath(); g.fill();
    g.strokeStyle = HF_ENDO; g.lineWidth = 1.6; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(4 * bw, -L * (0.78 - i * 0.1)); g.lineTo(11 * bw, -L * (0.76 - i * 0.1)); g.stroke(); }
  },
  drawSkirt(g, sk, p, c, R) {   // torn pirate shorts with a jagged hem + rope belt
    const h = sk.hip, k1 = sk.fk, k2 = sk.bk;
    const side = (K, col) => poly(g, [[h[0] - 12, h[1] - 6], [h[0] + 12, h[1] - 6], [lerp(h[0], K[0], 0.7) + 9, lerp(h[1], K[1], 0.7)], [lerp(h[0], K[0], 0.78) + 2, lerp(h[1], K[1], 0.78) + 4], [lerp(h[0], K[0], 0.7) - 3, lerp(h[1], K[1], 0.7)], [lerp(h[0], K[0], 0.8) - 9, lerp(h[1], K[1], 0.8) + 2]], R.mono || col, R, 2);
    side(k2, c.pants2); side(k1, c.pants);
    if (!R.mono) { g.strokeStyle = '#c8a060'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(h[0] - 13, h[1] - 6); g.lineTo(h[0] + 13, h[1] - 7); g.stroke(); }
  },
  shoulderOver: hfJoints,
  weaponFront(g, sk, p, c, R) {
    const h = sk.fh, a = Math.atan2(sk.fh[1] - sk.fe[1], sk.fh[0] - sk.fe[0]);
    hfHook(g, h[0], h[1], a, R);
  },
});
HF_FOX.moves = Object.assign(baseNormals({ dmg: 0.92, spd: -1, rng: 1.0 }), {
  sp1: {
    name: 'PIRATE CHARGE', jp: '海賊突撃', desc: 'A very fast running charge. On hit press SP1 again for PLUNDER (a launching hook uppercut); a hit also cuts his recovery short. A whiff leaves him open.', special: 1, lvl: 4,
    poses: ['charge', 'hookS'], st: 7, act: 14, rec: 20, cd: 60, dmg: 56, hs: 26, bs: 12, kb: 2, hb: { x: 0, y: -170, w: 82, h: 130 }, str: 2, sfx: 'whoosh',
    followups: [{ btn: 'sp1', move: 'rsPlunder', window: 16 }],
    tick(F, f) {
      if (f > 7 && f <= 21 && !F.connected) { F.vx = F.facing * 15.5; F.ctrlVel = true; F.afterimage = Math.max(F.afterimage, 4); if (f % 3 === 0) { FX.dust(F.x - F.facing * 20, GROUND, 2); Sound.play('stepFast'); } }
      if (F.connected && f === 7 + 14 + 6) F.toIdle();
    },
  },
  rsPlunder: {
    name: 'PLUNDER', jp: '略奪', desc: 'Pirate Charge follow-up (SP1 on hit): a rising hook uppercut that launches.', special: 1, lvl: 4.5, sc: 1,
    poses: ['hook_w', 'plunder'], st: 6, act: 5, rec: 20, dmg: 54, hs: 30, bs: 12, kb: 3, launch: -13, hb: { x: 0, y: -230, w: 90, h: 150 }, str: 3, sfx: 'hookScrape',
    sw: { cx: 10, cy: -170, r: 86, a0: 1.2, a1: -1.6, color: '#ff3a3a' },
  },
  sp1f: {
    name: 'HOOK SLASH', jp: 'フック・スラッシュ', desc: 'A fast horizontal slash with the hook: quick startup, short cooldown, a great combo starter.', special: 1, lvl: 4,
    poses: ['hook_w', 'hookS'], st: 5, act: 3, rec: 12, cd: 24, dmg: 56, hs: 21, bs: 11, kb: 3, hb: { x: 10, y: -178, w: 104, h: 62 }, str: 2, sfx: 'hookScrape',
    sw: { cx: 0, cy: -150, r: 96, a0: -1.2, a1: 0.7, color: '#cfd3dc' },
  },
  counter: {
    name: 'RUNNING AMOK', jp: '暴走', desc: 'He sprints forward slashing wildly: 6 hits on the move, catches foes trying to back off. Ends with a knockdown.', special: 1, lvl: 4,
    poses: ['amok_a', 'amok_b'], st: 9, act: 26, rec: 22, cd: 130, dmg: 17, hits: 6, interval: 4, hs: 18, bs: 9, kb: 1, hb: { x: 0, y: -180, w: 96, h: 120 }, str: 2, sfx: 'hookScrape',
    final: { dmg: 34, kb: 10, kd: 1, hs: 28 },
    poseFn(F, f) { return f <= 9 ? 'charge' : f <= 35 ? ((f >> 2) % 2 ? 'amok_a' : 'amok_b') : 'stance'; },
    tick(F, f) { if (f > 9 && f <= 35) { F.vx = F.facing * 8; F.ctrlVel = true; F.afterimage = Math.max(F.afterimage, 3); if (f % 4 === 0) Sound.play('hookScrape', 0.7); } },
  },
  sp2: {
    name: 'OUT OF ORDER', jp: '故障中', desc: 'His systems glitch into overdrive: for 4 s he moves 35 % faster, attacks faster and leaves afterimages.', special: 1, lvl: 4,
    poses: ['ooo', 'ooo'], st: 12, act: 1, rec: 10, cd: 600, sfx: 'glitch',
    spawn: { f: 12, fn(F) { hfStartBuff(F, 'ooo', HF_CFG.ooo.t, 'OUT OF ORDER', '#ff3a3a'); Sound.play('glitch'); } },
  },
  sp2f: {
    name: 'PIRATE\'S AMBUSH', jp: '海賊の待ち伏せ', desc: 'He ducks behind the curtain and vanishes (invulnerable), then bursts out BEHIND the foe with a hook slash — a cross-up against turtling. Telegraphed by the curtain rustle; a far-away foe can walk away.', special: 1, lvl: 4,
    poses: ['lurk', 'hookS'], st: 24, act: 4, rec: 18, cd: 200, dmg: 82, hs: 24, bs: 14, kb: 7, hb: { x: 0, y: -180, w: 100, h: 120 }, invuln: [1, 24], str: 3, sfx: 'curtain',
    poseFn(F, f) { return f <= 22 ? 'lurk' : f <= 30 ? 'hookS' : 'stance'; },
    tick(F, f, O) {
      if (f === 3) { F.hidden = true; FX.p({ type: 'smoke', x: F.x, y: F.y - 90, vx: 0, vy: -0.4, life: 26, size: 22, grow: 0.4, color: 'rgba(60,20,40,0.6)', add: false }); Sound.play('curtain'); }
      if (f > 3 && f < 22) { F.vx = 0; F.ctrlVel = true; }
      if (f === 22) {
        F.hidden = false; const side = Math.sign(O.x - F.x) || F.facing; let x = O.x + side * 70; if (x < 60 || x > STAGE_W - 60) x = O.x - side * 70;
        F.x = clamp(x, 55, STAGE_W - 55); F.facing = O.x > F.x ? 1 : -1; F.afterimage = 10;
        FX.p({ type: 'smoke', x: F.x, y: F.y - 90, vx: 0, vy: -0.4, life: 20, size: 18, grow: 0.4, color: 'rgba(60,20,40,0.6)', add: false }); Sound.play('screechShort');
      }
    },
  },
  sp2d: {
    name: 'JUMPSCARE', jp: 'ジャンプスケア', desc: 'He LUNGES with his jaw wide open and a distorted screech — very short startup, high damage, huge knockback and a wall splat. Punishes anything. Long recovery if it misses.', special: 1, lvl: 4,
    poses: ['scare_w', 'scare'], st: 7, act: 10, rec: 36, cd: 360, dmg: 138, hs: 30, bs: 18, kb: 18, kd: 1, ws: 1, hb: { x: 0, y: -210, w: 110, h: 170 }, str: 4, shake: 16, impact: 2, sfx: 'screech',
    tick(F, f) {
      F.hfJaw = f >= 5 && f <= 30; F.hfGlow = f <= 30;
      if (f > 7 && f <= 17 && !F.connected) { F.vx = F.facing * 16; F.ctrlVel = true; F.afterimage = Math.max(F.afterimage, 5); }
      if (f === 8) { FX.flashScreen('#2a0408', 5, 0.35); FX.shakeIt(6); }
    },
    onHit(F, D) { FX.flashScreen('#ffffff', 4, 0.5); FX.wtext(D.x, D.y - 240 * D.s, 'JUMPSCARE!', { size: 40, color: '#ffffff', stroke: '#ff3a3a', life: 44 }); },
  },
  ult: null,
});
(() => {
  const M = HF_FOX.moves;
  Object.assign(M.L, { name: 'Hook Jab', poses: ['hook_w', 'hookS'] }); Object.assign(M.M, { name: 'Peg Kick' }); Object.assign(M.H, { name: 'Gaff Hook', poses: ['hook_w', 'hookS'] });
  Object.assign(M.cL, { name: 'Bilge Jab' }); Object.assign(M.cM, { name: 'Deck Sweep Kick' }); Object.assign(M.cH, { name: 'Keelhaul' });
  Object.assign(M.jH, { name: 'Boarding Hook', poses: ['dive', 'hookS'] }); Object.assign(M.LH, { name: 'Mast Uppercut' }); Object.assign(M.FF, { name: 'Cannonball Rush' });
})();

// ===================================== shared: ultimate, roll, ticks, look =====================================
const HF_ULT = {
  name: 'THE GOLDEN SPRINGLOCK', jp: '黄金のスプリングロック', desc: 'Ultimate (shared by all four). The animatronic freezes, its eyes glow, it vanishes into the dark. Four ghost children appear around the foe and push them into an empty golden rabbit suit — the springlocks click... click... SNAP. The suit kneels, and the animatronic comes back. THEY ALWAYS COME BACK.', ult: 1, lvl: 6, cost: 100,
  poses: ['twitch', 'push'], st: 12, act: 12, rec: 36, dmg: 20, hs: 40, bs: 20, kb: 1, hb: { x: -10, y: -230, w: 230, h: 230 }, invuln: [0, 18], str: 3, sfx: 'staticHum',
  tick(F, f) { F.hfGlow = true; if (f === 10) Sound.play('springClick'); },
  onHit(F, D) { BT.startCine(F, D, CINE.hfGolden, { zoom: 1.3 }); return true; },
};
for (const f of Object.values(HF_FORMS)) f.moves.ult = { ...HF_ULT, poses: [...HF_ULT.poses] };
HAUNTED.moves = HF_BEAR.moves;   // menus (move list from the select screen) show Barnaby's set; the battle always uses the rolled form

const HF_LOOK = {   // what is in their hands per move (draw-only)
  bear: { def: 'mic' }, rabbit: { def: 'guitarBack', sp2f: 'guitar' }, chicken: { def: null }, fox: { def: 'hook' },
};
function hfRollForm(F) {
  const force = HF_FORCE || (typeof window !== 'undefined' && window.HF_FORCE);
  if (force) { const v = Array.isArray(force) ? force[(F.pid || 1) - 1] : force; if (HF_FORMS[v]) return v; }
  if (BT && BT instanceof Battle && typeof TrialBattle !== 'undefined' && BT instanceof TrialBattle) return 'bear';   // combo trials always use Barnaby
  const B = BT; if (!B) return HF_IDS[Math.floor(Math.random() * 4)];
  const R = B.hfRoll || (B.hfRoll = {});
  if (!R[F.pid]) R[F.pid] = HF_IDS[Math.floor(Math.random() * 4) % 4];
  return R[F.pid];
}
HAUNTED.initFighter = F => {
  const id = hfRollForm(F), ch = HF_FORMS[id];
  F.ch = ch; F.s = ch.scale; F.maxHp = F.hp = F.redHp = ch.health;
  F.pose = buildPose(ch, 'stance'); F.sk = skeleton(F.pose, ch.dims);
  F.hfForm = id; F.hfBuf = { t: 0, max: 1, k: null }; F.hfGlow = false; F.hfJaw = false; F.hfProp = null;
  F.hfCup = 'hand'; F.hfCupT = 0; F.hfStats = { grabs: 0, cups: 0 };
};
for (const f of Object.values(HF_FORMS)) {
  f.initFighter = HAUNTED.initFighter;   // (a fresh Fighter of a form — e.g. a net snapshot rebuild — re-reads the match roll)
  f.palette = hfPalette;
  f.dmgBonus = F => hfDmg(F);
  f.walkMul = F => { const B = hfBuffs(F); return B.t > 0 ? (B.k === 'ooo' ? HF_CFG.ooo.walk : B.k === 'power' ? HF_CFG.power.walk : 1) : 1; };
  f.statePose = F => {
    if (F.state === 'defeat') return F.sf < 24 ? ['hit', 0.2] : ['defeat', 0.07];
    if (F.state === 'victory' && !F.cos) return [F.sf < 30 ? 'twitch' : 'victory', 0.1];
    if (F.state === 'intro' && !F.cos) return [F.sf < 40 ? 'slump' : F.sf < 60 ? 'twitch' : 'intro', 0.14];
    if (F.state === 'dash') return ['dash', 0.4];
    return null;
  };
  f.idlePose = F => { const k = F.T % 360; return k > 300 && k < 312 ? 'twitch' : null; };   // a mechanical twitch now and then
  f.tick = hfTick;
  f.drawExtra = hfDrawExtra;
  f.drawHand = hfHud;
  f.introFx = F => { Sound.play('staticHum'); Sound.play('servo'); F.hfGlow = true; };
  f.applyTrial = (A, tr) => { if (tr && tr.meter) A.meter = 100; };
  f.combos = [];
}
function hfTick(F) {
  const ch = F.ch, B = hfBuffs(F), id = ch.formId, live = BT && BT.phase === 'fight' && !F.ko;
  // buffs
  if (B.t > 0 && live) {
    B.t--;
    if (B.k === 'show') { xpHaste(F, HF_CFG.showtime.haste); if (F.T % 26 === 0) hfNote(F.x + rand(-50, 50), F.y - rand(150, 230) * F.s, '#ffe9a0'); }
    if (B.k === 'ooo') { xpHaste(F, HF_CFG.ooo.haste); F.afterimage = Math.max(F.afterimage, 3); if (F.T % 7 === 0) FX.p({ type: 'spark', x: F.x + rand(-20, 20), y: F.y - rand(60, 160), vx: rand(-2, 2), vy: -rand(1, 3), life: 12, size: 2, color: '#ffd24a' }); }
    if (B.k === 'power' && F.T % 10 === 0) FX.p({ type: 'ember', x: F.x + rand(-30, 30), y: F.y - rand(40, 180), vy: -1.2, life: 18, size: 2.5, color: '#ff3a5a' });
    if (B.t === 0) FX.wtext(F.x, F.y - 230 * F.s, '...power down', { size: 16, color: '#cfc4ee', stroke: '#140a18', life: 30 });
  }
  // look: props, glowing eyes
  if (F.state !== 'cine') {
    const L = HF_LOOK[id]; let prop = L.def;
    if (F.state === 'attack' && L[F.moveKey]) prop = L[F.moveKey];
    F.hfProp = prop;
    if (!(F.state === 'attack' && (F.moveKey === 'sp2d' || F.moveKey === 'ult' || F.moveKey === 'sp2' && id === 'fox'))) { F.hfGlow = B.t > 0 || F.state === 'intro' && F.sf < 70; F.hfJaw = false; }
  }
  // Sunny's cupcake: comes back when the thrown / guarding one is gone
  if (id === 'chicken' && F.hfCup !== 'hand') {
    const out = BT && BT.projs.some(p => p.owner === F && p.cup && !p.dead);
    if (!out) { if (++F.hfCupT >= HF_CFG.cupBack) { F.hfCup = 'hand'; F.hfCupT = 0; Sound.play('cupPop', 0.5); FX.burst(F.handW('f')[0], F.handW('f')[1], '#ff7ab0', 6, 3); } }
    else F.hfCupT = 0;
  }
  // ambience: servo creaks on walk, footsteps per form
  if ((F.state === 'walk' || F.state === 'dash') && F.onGround && live) {
    const every = id === 'fox' ? 9 : id === 'rabbit' ? 20 : 16;
    if (F.T % every === 0) Sound.play(id === 'fox' ? 'stepFast' : 'stepHeavy', id === 'rabbit' ? 1.2 : 0.8);
    if (F.T % 70 === 0) Sound.play('creak', 0.5);
  }
  if (id === 'chicken' && F.state === 'idle' && F.T % 300 === 150) Sound.play('cluck', 0.5);
}
function hfDrawExtra(g, F) {
  // glowing eyes in the dark (a soft halo over the head when the eyes glow)
  if (F.hfGlow && !F.hidden && F.state !== 'cine') {
    const r = F.ch.dims.headR, e = toWorld(F.x, F.y, F.facing, F.s, F.pose, F.sk, ...headPt(F.sk, 0.46 * r, 0.06 * r));
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 + 0.15 * Math.sin(F.T * 0.4); g.fillStyle = F.ch.colors.eye;
    g.beginPath(); g.arc(e[0], e[1], 9, 0, TAU); g.fill(); g.restore();
  }
  // Springlock Crush tell: gears spin by his chest during the startup
  if (F.state === 'attack' && F.moveKey === 'sp2d' && F.ch.formId === 'rabbit' && F.mf < 15) {
    const c = F.chestW(), k = F.mf / 14;
    g.save(); g.strokeStyle = `rgba(255,216,96,${0.4 + 0.5 * k})`; g.lineWidth = 3; g.translate(c[0] + F.facing * 10, c[1] - 10); g.rotate(F.mf * 0.35);
    g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); g.lineTo(Math.cos(a) * 17, Math.sin(a) * 17); } g.stroke();
    g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.stroke(); g.restore();
  }
}

// ---------------------------------- projectiles ----------------------------------
EXTRA_PROJ.hfWave = {   // Lullaby: rings of distorted sound
  update(p) { if (p.t % 6 === 0) FX.p({ type: 'spark', x: p.x, y: p.y + rand(-40, 40), vx: p.vx * 0.2, vy: -0.6, life: 14, size: 2, color: '#ffe9a0' }); if (p.t % 12 === 0) hfNote(p.x, p.y - 50, '#ffe9a0'); },
  draw(g, p) {
    const d = Math.sign(p.vx) || 1, a = Math.min(1, p.life / 12);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const x = p.x - d * i * 18, rr = (p.big ? 74 : 60) - i * 10 + Math.sin(p.t * 0.5 + i) * 4;
      g.strokeStyle = i % 2 ? `rgba(106,208,255,${0.55 * a})` : `rgba(255,194,74,${0.7 * a})`; g.lineWidth = 4 - i;
      g.beginPath(); g.ellipse(x, p.y, rr * 0.36, rr, 0, d > 0 ? -1.2 : Math.PI - 1.2, d > 0 ? 1.2 : Math.PI + 1.2); g.stroke();
    }
    g.restore();
  },
};
EXTRA_PROJ.hfCup = {
  update(p) { if (p.t % 3 === 0) FX.p({ type: 'spark', x: p.x - p.vx * 0.5, y: p.y - 10, vx: 0, vy: -0.3, life: 12, size: 2, color: p.t % 6 ? '#ff7ab0' : '#ffe24a' }); },
  draw(g, p) { hfCupcake(g, p.x, p.y + 4, 1.4, { mono: null }, { rot: Math.sin(p.t * 0.4) * 0.3, T: p.t }); },
};
EXTRA_PROJ.hfBomb = {   // lobbed cupcake: explodes on impact (persist → harmless after the hit) or after the fuse / on the floor
  update(p) {
    p.fuse--;
    const boom = p.harmless || p.fuse <= 0 || p.y >= GROUND - 14;
    if (p.fuse < 20 && p.t % 4 === 0) Sound.play('rTick');
    if (boom && !p.boomed) {
      p.boomed = true; p.dead = true;
      const y = Math.min(p.y, GROUND - 40);
      BT.spawn({ owner: p.owner, kind: 'hfBoom', x: p.x, y, vx: 0, w: 170, h: 150, life: 10, hits: 1, dmg: 72, hs: 26, bs: 14, kb: 5, launch: -10, str: 3, clash: 0, color: '#ff7ab0', cupFx: true, srcKey: 'sp1f' });
      Sound.play('cupBoom'); FX.shakeIt(8); FX.ring(p.x, y, '#ff7ab0', 12, 120, 16, 6, 0.4); FX.burst(p.x, y, '#ffe24a', 26, 10);
      for (let i = 0; i < 14; i++) FX.p({ type: 'spark', x: p.x, y, vx: rand(-6, 6), vy: rand(-7, 1), life: 30, size: 3, color: ['#ff7ab0', '#7affc8', '#ffe24a', '#6ac8ff'][i % 4], grav: 0.25 });
    }
  },
  draw(g, p) { hfCupcake(g, p.x, p.y + 4, 1.4, { mono: null }, { rot: p.t * 0.25, T: p.t, angry: p.fuse < 24 && (p.t >> 2) % 2 }); },
};
EXTRA_PROJ.hfBoom = {
  update(p) {},
  draw(g, p) {
    const k = 1 - p.life / p.max;
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,122,176,${0.5 * (1 - k)})`; g.beginPath(); g.arc(p.x, p.y, 40 + k * 60, 0, TAU); g.fill();
    g.fillStyle = `rgba(255,226,74,${0.6 * (1 - k)})`; g.beginPath(); g.arc(p.x, p.y, 20 + k * 40, 0, TAU); g.fill(); g.restore();
  },
};
EXTRA_PROJ.hfHunt = {   // homing cupcake: keeps its speed, turns at most 0.045 rad per frame
  update(p) {
    const D = p.owner.opp; if (!D || p.t < 8) return;
    const sp = Math.hypot(p.vx, p.vy) || 6, a = Math.atan2(p.vy, p.vx), ty = D.y - 110 * D.s, want = Math.atan2(ty - p.y, D.x - p.x);
    let da = ((want - a + Math.PI * 3) % TAU) - Math.PI; da = clamp(da, -0.045, 0.045);
    const na = a + da; p.vx = Math.cos(na) * sp; p.vy = Math.sin(na) * sp;
    if (p.y > GROUND - 24) { p.y = GROUND - 24; p.vy = Math.min(0, p.vy); }
    if (p.t % 3 === 0) FX.p({ type: 'ember', x: p.x - p.vx, y: p.y - p.vy, vy: -0.3, life: 12, size: 2.2, color: '#ff3a5a' });
  },
  draw(g, p) { hfCupcake(g, p.x, p.y + 4, 1.45, { mono: null }, { rot: Math.sin(p.t * 0.5) * 0.2, T: p.t, angry: true }); },
};
EXTRA_PROJ.hfDish = {
  update(p) { if (p.y > GROUND - 12) { p.dead = true; FX.burst(p.x, GROUND - 10, '#e8e2d0', 8, 4); Sound.play('panClang', 0.5); } },
  draw(g, p) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,162,26,0.18)'; g.beginPath(); g.arc(p.x, p.y, 24, 0, TAU); g.fill(); g.restore();
    hfKitchen(g, p.x, p.y, p.obj, p.t * 0.35 * (p.vx > 0 ? 1 : -1), { mono: null });
  },
};
EXTRA_PROJ.hfMini = {
  update(p) { if (p.y > GROUND - 14) { p.dead = true; FX.burst(p.x, GROUND - 12, '#ff7ab0', 8, 4); Sound.play('cupPop', 0.4); } },
  draw(g, p) { hfCupcake(g, p.x, p.y + 4, 0.95, { mono: null }, { rot: p.t * 0.3, T: p.t }); },
};
EXTRA_PROJ.hfGuard = {   // the cupcake guardian: shoots candle flames, bites at close range
  update(p) {
    const F = p.owner, D = F.opp, C = HF_CFG.guard; p.ft++; if (p.bt > 0) p.bt--;
    if (!D || D.hidden || !BT || BT.phase !== 'fight') return;
    const dx = D.x - p.x, ad = Math.abs(dx); p.dir = Math.sign(dx) || p.dir;
    if (ad < C.bite && p.bt <= 0) {
      p.bt = 70; Sound.play('cupBite');
      BT.spawn({ owner: F, kind: 'hfBite', x: p.x + p.dir * 30, y: GROUND - 50, vx: 0, w: 76, h: 90, life: 6, hits: 1, dmg: 24, hs: 20, bs: 10, kb: 6, str: 1, clash: 0, color: '#ff7ab0', srcKey: 'sp2f' });
    } else if (ad < C.range && p.ft >= 24 && p.ft % C.every === 0) {
      Sound.play('candleFlame');
      BT.spawn({ owner: F, kind: 'hfFlame', x: p.x + p.dir * 16, y: GROUND - 62, vx: p.dir * 7.5, w: 26, h: 26, life: 60, dmg: 26, hs: 16, bs: 9, kb: 2, str: 1, color: '#ffb02a', srcKey: 'sp2f' });
    }
  },
  draw(g, p) {
    const a = Math.min(1, p.life / 20), hop = Math.abs(Math.sin(p.t * 0.12)) * 6;
    g.save(); g.globalAlpha = a;
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(p.x, GROUND - 2, 22, 5, 0, 0, TAU); g.fill();
    if (p.life < 60 && (p.t >> 2) % 2) g.globalAlpha = a * 0.5;
    hfCupcake(g, p.x, GROUND - 34 - hop, 2.0 * (p.dir < 0 ? -1 : 1), { mono: null }, { T: p.t, angry: p.bt > 30 });
    g.restore();
  },
};
EXTRA_PROJ.hfBite = { update(p) {}, draw(g, p) { g.save(); g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, 26, -0.9, 0.9); g.stroke(); g.beginPath(); g.arc(p.x, p.y, 26, Math.PI - 0.9, Math.PI + 0.9); g.stroke(); g.restore(); } };
EXTRA_PROJ.hfFlame = {
  update(p) { FX.flame(p.x - p.vx, p.y, '#ffb02a', 1, 10, 0.8); },
  draw(g, p) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#ffb02a'; g.beginPath(); g.ellipse(p.x, p.y, 10, 7, 0, 0, TAU); g.fill(); g.fillStyle = '#fff0a0'; g.beginPath(); g.ellipse(p.x, p.y, 5, 3.5, 0, 0, TAU); g.fill(); g.restore(); },
};

// ---------------------------------- grab cinematics ----------------------------------
CINE.hfHug = function (A, D, f) {
  const dir = A.facing, m = hfGrabMul(A);
  if (f === 1) { A.forcePose = 'hug'; D.x = A.x + dir * 54; D.y = GROUND; D.forcePose = 'hit'; Sound.play('grab'); A.hfStats.grabs++; }
  if (f >= 6 && f <= 36 && (f - 6) % 12 === 0) { BT.scriptHit(A, D, 24 * m, { str: 2, sfx: 'hit' }); Sound.play('creak'); FX.shakeIt(5); D.forcePose = (f >> 3) % 2 ? 'hit' : 'hit2'; FX.wtext(D.x, D.y - 200, '*creak*', { size: 16, color: '#ffe9a0', stroke: '#2a1a0a', life: 20 }); }
  if (f === 44) { BT.release(D, dir * 2, -10); return true; }
};
CINE.hfStageGrab = function (A, D, f) {
  const dir = A.facing, m = hfGrabMul(A);
  if (f === 1) { A.forcePose = 'grab'; D.x = A.x + dir * 62; D.y = GROUND; D.forcePose = 'hit'; Sound.play('grab'); A.hfStats.grabs++; }
  if (f >= 4 && f < 14) { A.forcePose = 'lift'; D.y = GROUND - (f - 4) * 4; D.x = A.x + dir * 50; }
  if (f === 14) { A.forcePose = 'headbutt'; BT.scriptHit(A, D, 40 * m, { str: 2, sfx: 'hit' }); FX.shakeIt(6); Sound.play('servo'); }
  if (f === 26) { A.forcePose = 'grab'; BT.scriptHit(A, D, 42 * m, { str: 3, sfx: 'kick' }); FX.shakeIt(8); }
  if (f === 34) { D.y = GROUND; D.x = A.x + dir * 72; D.forcePose = null; D.setState('hit'); D.onGround = true; D.vx = dir * 1.5; D.vy = 0; D.hitstun = 28; D.juggle = 3; return true; }
};
CINE.hfMechThrow = function (A, D, f) {
  const dir = A.facing, m = hfGrabMul(A);
  if (f === 1) { A.forcePose = 'grab'; D.x = A.x + dir * 60; D.y = GROUND; D.forcePose = 'hit'; Sound.play('grab'); A.hfStats.grabs++; }
  if (f >= 6 && f <= 22) { const t = (f - 6) / 16, a = lerp(0.2, Math.PI - 0.2, t); A.forcePose = t < 0.5 ? 'lift' : 'overhead'; D.x = A.x + dir * Math.cos(a) * 64; D.y = GROUND - 40 - Math.sin(a) * 150; D.forcePose = 'airhit'; }
  if (f === 23) {
    A.forcePose = 'slam'; D.x = A.x - dir * 70; D.y = GROUND - 20;
    BT.scriptHit(A, D, 96 * m, { str: 4, sfx: 'slam' }); FX.shakeIt(14); FX.dust(D.x, GROUND, 12); FX.ring(D.x, GROUND, '#a77bff', 10, 150, 16, 6, 0.25); Sound.play('servo');
    BT.release(D, -dir * 11, -7); return true;
  }
};
CINE.hfRabbitSlam = function (A, D, f) {
  const dir = A.facing, m = hfGrabMul(A);
  if (f === 1) { A.forcePose = 'grab'; D.x = A.x + dir * 62; D.y = GROUND; D.forcePose = 'hit'; Sound.play('grab'); A.hfStats.grabs++; }
  if (f >= 4 && f <= 24) { const t = (f - 4) / 20; A.forcePose = 'overhead'; D.x = A.x + dir * lerp(62, 10, t); D.y = GROUND - lerp(0, 230, t); D.forcePose = 'airhit'; }
  if (f === 25) Sound.play('creak');
  if (f === 32) {
    A.forcePose = 'slam'; D.x = A.x + dir * 84; D.y = GROUND; D.forcePose = 'down';
    BT.scriptHit(A, D, 150 * m, { str: 4, sfx: 'slam' }); FX.shakeIt(18); FX.rocks(D.x, GROUND, 14); FX.dust(D.x, GROUND, 14); FX.ring(D.x, GROUND, '#a77bff', 10, 180, 18, 6, 0.25); FX.impactFrame(1);
  }
  if (f === 46) { BT.release(D, dir * 3, -5); return true; }
};
CINE.hfCrush = function (A, D, f, c) {
  const dir = A.facing, m = hfGrabMul(A);
  if (f === 1) { A.forcePose = 'crush'; D.x = A.x + dir * 58; D.y = GROUND; D.forcePose = 'hit'; Sound.play('grab'); FX.darkTarget = 0.55; c.lock = 0; c.fg = hfCrushFg; c.D = D; A.hfStats.grabs++; }
  if (f >= 10 && f <= 58 && (f - 10) % 12 === 0) {
    c.lock++; BT.scriptHit(A, D, 22 * m, { str: 2, sfx: 'hit' }); Sound.play('springClick'); FX.shakeIt(6); D.forcePose = c.lock % 2 ? 'hit2' : 'hit';
    FX.wtext(D.x + rand(-30, 30), D.y - 190 - c.lock * 6, '*click*', { size: 18, color: '#ffd860', stroke: '#2a1a0a', life: 22 });
  }
  if (f === 72) { BT.scriptHit(A, D, 70 * m, { str: 4, sfx: 'slam' }); Sound.play('springSnap'); FX.flashScreen('#ffd860', 6, 0.5); FX.shakeIt(16); FX.impactFrame(2); c.lock = 6; }
  if (f === 88) { FX.darkTarget = 0; BT.release(D, dir * 6, -8); return true; }
};
function hfCrushFg(g, c) {   // the springlock brackets around the trapped foe
  const cam = BT && BT.cam; if (!cam || !c.D) return;
  const D = c.D, n = c.lock || 0;
  g.save(); cam.apply(g);
  for (let i = 0; i < Math.min(n, 5); i++) {
    const y = D.y - 30 - i * 32;
    g.strokeStyle = '#2a1a0a'; g.lineWidth = 7; g.beginPath(); g.ellipse(D.x, y, 34, 9, 0, 0, TAU); g.stroke();
    g.strokeStyle = i === n - 1 ? '#fff2b0' : '#d8a840'; g.lineWidth = 4; g.beginPath(); g.ellipse(D.x, y, 34, 9, 0, 0, TAU); g.stroke();
    g.fillStyle = '#8c919c'; g.fillRect(D.x - 4, y - 6, 8, 12);
  }
  g.restore();
}

// ---------------------------------- HUD ----------------------------------
const HF_HUD = {
  bear: { cls: 'ALL-ROUNDER', buff: 'show', bn: 'SHOWTIME', badges: [['sp1', 'S1|MIC CHECK'], ['sp1f', '↓→S1|LULLABY'], ['counter', '↓←S1|BEAR HUG'], ['sp2', 'S2|STOMP'], ['sp2f', '↓→S2|SHOWTIME'], ['sp2d', '↓↓S2|NIGHTMARE']] },
  rabbit: { cls: 'GRAPPLER', buff: 'power', bn: 'ENDO POWER', badges: [['sp1', 'S1|GRAB'], ['sp1f', '↓→S1|THROW'], ['counter', '↓←S1|SLAM'], ['sp2', 'S2|POWER'], ['sp2f', '↓→S2|GUITAR'], ['sp2d', '↓↓S2|SPRINGLOCK']] },
  chicken: { cls: 'ZONER', buff: null, bn: '', badges: [['sp1', 'S1|CUPCAKE'], ['sp1f', '↓→S1|BOMB'], ['counter', '↓←S1|HUNT'], ['sp2', 'S2|KITCHEN'], ['sp2f', '↓→S2|GUARDIAN'], ['sp2d', '↓↓S2|PARTY!']] },
  fox: { cls: 'RUSHDOWN', buff: 'ooo', bn: 'OUT OF ORDER', badges: [['sp1', 'S1|CHARGE'], ['sp1f', '↓→S1|HOOK'], ['counter', '↓←S1|AMOK'], ['sp2', 'S2|OVERDRIVE'], ['sp2f', '↓→S2|AMBUSH'], ['sp2d', '↓↓S2|SCARE']] },
};
function hfHud(g, F, side, t) {
  const ch = F.ch, H = HF_HUD[ch.formId], B = hfBuffs(F), col = ch.colors.accent, on = B.t > 0;
  let sub, k, label;
  if (ch.formId === 'chicken') {
    const st = F.hfCup;
    label = st === 'hand' ? 'IN HAND' : st === 'guard' ? 'GUARDING' : 'THROWN';
    k = st === 'hand' ? 1 : st === 'guard' ? Math.max(0, ...BT.projs.filter(p => p.owner === F && p.kind === 'hfGuard').map(p => p.life / p.max)) : Math.min(1, F.hfCupT / HF_CFG.cupBack);
    sub = 'SPRINKLES · ' + (st === 'hand' ? 'ready — SP1 moves use it' : st === 'guard' ? 'guarding its spot' : 'hopping back…');
  } else {
    if (ch.formId === 'bear') label = on ? `SHOWTIME ${(B.t / 60).toFixed(1)}s` : '↓→S2 = SHOWTIME';
    if (ch.formId === 'rabbit') label = on ? `POWER ${(B.t / 60).toFixed(1)}s` : 'S2 = ENDO POWER';
    if (ch.formId === 'fox') label = on ? `OVERDRIVE ${(B.t / 60).toFixed(1)}s` : 'S2 = OUT OF ORDER';
    k = on ? B.t / B.max : 0;
    sub = ch.formId === 'rabbit' ? `grabs ${on ? '+25 %' : 'ready'} · armor ${on ? 'ON' : 'off'}` : ch.formId === 'fox' ? 'fast · fragile · stay on them' : 'answers for every range';
  }
  xpPanel(g, F, side, t, { col, col2: '#ffffff', icon: ch.name[0], flash: on, title: `${ch.name} · ${H.cls}`, sub, k, label, badges: H.badges });
  // the rolled form's class badge next to the panel
  if (typeof drawClassBadge === 'function') { const pw = 330, x0 = side > 0 ? 40 : W - 40 - pw; drawClassBadge(g, ch.fclass, side > 0 ? x0 + pw - 14 : x0 + 14, 560 + 14, 10, false); }
}
HAUNTED.drawHand = hfHud;

HAUNTED.howTo = {
  title: 'HAUNTED FOUR',
  draw(g) {
    xpHowTo(g, 'HAUNTED FOUR — THE MIDNIGHT BAND (random form at fight start)', '#ffc24a', [
      ['RANDOM', 'Pick the slot: when the fight starts you become ONE animatronic (25 % each, rolled per player), fixed for the whole match.'],
      ['BARNABY', 'Bear · ALL-ROUNDER — Mic Check, Lullaby (armored sound wave), Bear Hug (grab), Stomp (low, both sides), Showtime (buff), Nightmare Pulse (stun).'],
      ['RIFF', 'Rabbit · GRAPPLER — Stage Grab, Mechanical Throw, Rabbit Slam, Endoskeleton Power (grab buff + armor), Guitar Smash (overhead), Springlock Crush.'],
      ['SUNNY', 'Chicken · ZONER — one cupcake: Throw, Bomb, Hunt (homing), Guardian (turret). Kitchen Nightmare + Party Time! barrage. Weak up close.'],
      ['RUSTY', 'Fox · RUSHDOWN — Pirate Charge (→ SP1 Plunder), Hook Slash, Running Amok, Out of Order (speed), Pirate\'s Ambush (cross-up), Jumpscare.'],
      ['ULTIMATE', 'THE GOLDEN SPRINGLOCK (all four, SP1+SP2): four ghost children lock the foe in a golden rabbit suit. Click… click… SNAP.'],
    ], 'Four animatronics, four fighting styles, four nightmares — one shared fate. They always come back.');
  },
};

CHARS.push(HAUNTED);
for (const f of Object.values(HF_FORMS)) finalizeMoves(f);
// CPU hints
HF_BEAR.moves.sp2f.__ai = { reach: 400, kind: 'buff', anti: false, st: 14, low: false, over: false };
HF_RABBIT.moves.sp2.__ai = { reach: 300, kind: 'buff', anti: false, st: 14, low: false, over: false };
HF_FOX.moves.sp2.__ai = { reach: 420, kind: 'buff', anti: false, st: 12, low: false, over: false };
HF_FOX.moves.sp2f.__ai = { reach: 520, kind: 'melee', anti: false, st: 24, low: false, over: false };
HF_CHICKEN.moves.sp2f.__ai = { reach: 520, kind: 'buff', anti: false, st: 16, low: false, over: false };
HF_CHICKEN.moves.sp1f.__ai = { reach: 480, kind: 'proj', anti: false, st: 13, low: false, over: false };
HF_CHICKEN.moves.sp2d.__ai = { reach: 640, kind: 'proj', anti: false, st: 14, low: false, over: false };
HF_CHICKEN.moves.counter.__ai = { reach: 620, kind: 'proj', anti: false, st: 12, low: false, over: false };
HF_BEAR.moves.sp2f.cpuOk = F => hfBuffs(F).t <= 0;
HF_RABBIT.moves.sp2.cpuOk = F => hfBuffs(F).t <= 0;
HF_FOX.moves.sp2.cpuOk = F => hfBuffs(F).t <= 0;
