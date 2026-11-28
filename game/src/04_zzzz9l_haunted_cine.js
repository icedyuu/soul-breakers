// ============================ HAUNTED FOUR — THE GOLDEN SPRINGLOCK (shared ultimate cinematic) ============================
// Same timeline, damage and look for all four forms. The animatronic freezes, its eyes glow, it sinks into the dark →
// silence, a faint mechanical tick → four ghost children fade in around the foe (bear / rabbit / chicken / fox masks),
// closing in → an empty golden rabbit suit (an ORIGINAL design: one bent ear, stitched patches, teal bow tie, heart plate)
// stands behind the foe → the ghosts restrain them and push them inside → the suit closes → click… click… (camera cuts,
// distortion) → SNAP (white flash, freeze) → the suit stands still, its eyes light up, a last creak, it falls to its
// knees → it crumbles into golden dust, the foe drops out, the animatronic is back. Stylized horror, no gore.
// Scripted by frame number only (no randomness), so it replays exactly online.
const HF_ULTT = { glow: 10, fade: 30, gone: 60, ghosts: [70, 84, 98, 112], close: 126, suit: 146, restrain: 172, push: 186, inside: 208,
  clicks: [222, 236, 248, 258, 266, 272], snap: 286, still: 300, eyes: 310, creak: 326, kneel: 334, dust: 356, back: 362, end: 384 };
const HF_GHOSTS = [   // kind, side (±1 relative to the foe, along the attacker's facing), start / close offsets, tint
  { k: 'bear', side: -1, x0: 170, x1: 62, col: '#ffc24a' }, { k: 'rabbit', side: 1, x0: 200, x1: 70, col: '#a77bff' },
  { k: 'chicken', side: -1, x0: 110, x1: 30, col: '#ffd23a', fy: -26 }, { k: 'fox', side: 1, x0: 130, x1: 34, col: '#ff3a3a', fy: -26 },
];
// the golden suit: an original springlock rabbit costume (drawn with the normal rig)
const HF_SUIT = Object.create(HAUNTED);
Object.assign(HF_SUIT, {
  id: 'hfsuit', formId: 'suit', name: 'GOLDEN SUIT', _art: null, _rc: null, noEar: true, chibi: true, dims: { ...CHIBI_DIMS }, drawBoot: hfFoot, drawCustom: null, scale: 1.08,
  build: { arm: 1.16, leg: 1.08, torso: 1.22 },
  colors: { skin: '#d8a840', lid: '#b88a2a', top: '#d8a840', uarm: '#d8a840', farm: '#d8a840', hand: '#d8a840', leg: '#d8a840', foot: '#b88a2a', pad: '#f0d080',
    belly: '#f0d080', muzzle: '#f0d890', earIn: '#c89030', tie: '#2aa8a0', accent: '#ffd860', eye: '#ffd860', eyeHot: '#ffffff', iris: '#0a0806', nose: '#6a3a1a', sclera: '#14100a', belt: null, cuff: null, male: 1 },
  poses: { ...HF_POSES, open: { t: -0.05, hd: -0.15, fa1: 1.3, fa2: 1.3, ba1: 1.2, ba2: 1.2, fl1: 0.3, bl1: -0.3 }, kneel: POSES.kneel || { t: 0.4, hd: 0.5 } },
  stance: { t: 0.04, hd: 0.3, fa1: 0.12, fa2: 0.2, ba1: 0.1, ba2: 0.18, fl1: 0.2, fl2: 0.04, bl1: -0.2, bl2: -0.1 },
  hairBack(g, r, c, R) {   // one tall ear, one bent at the hinge
    g.save(); g.translate(-0.45 * r, -0.7 * r); g.rotate(-0.38);
    g.beginPath(); g.ellipse(0, -0.7 * r, 0.24 * r, 0.76 * r, 0, 0, TAU); if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = R.ol * 2; g.stroke(); } g.fillStyle = R.mono || c.skin; g.fill();
    if (!R.mono) { g.fillStyle = c.earIn; g.beginPath(); g.ellipse(0, -0.7 * r, 0.12 * r, 0.6 * r, 0, 0, TAU); g.fill(); }
    g.restore();
    g.save(); g.translate(0.12 * r, -0.86 * r); g.rotate(-0.1);
    g.beginPath(); g.ellipse(0, -0.42 * r, 0.24 * r, 0.46 * r, 0, 0, TAU); if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = R.ol * 2; g.stroke(); } g.fillStyle = R.mono || c.skin; g.fill();
    g.translate(0, -0.82 * r); g.rotate(1.4);
    g.beginPath(); g.ellipse(0, -0.3 * r, 0.22 * r, 0.36 * r, 0, 0, TAU); if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = R.ol * 2; g.stroke(); } g.fillStyle = R.mono || c.skin; g.fill();
    g.restore();
  },
  hairFront(g, r, c, R) { if (R.mono) return; g.strokeStyle = '#6a4a1a'; g.lineWidth = 0.035 * r; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo((-0.5 + i * 0.12) * r, -0.5 * r); g.lineTo((-0.46 + i * 0.12) * r, -0.38 * r); g.stroke(); } },
  neckWear(g, sk, p, c, R) { hfBowtie(g, sk, c.tie, R, 1.1); },
  torsoDetail(g, L, bw, c, R, o) {
    g.fillStyle = c.belly; g.beginPath(); g.ellipse(2 * bw, -L * 0.42, 9 * bw, L * 0.36, 0, 0, TAU); g.fill();
    // stitched patches
    g.fillStyle = '#c0922e'; g.fillRect(-11 * bw, -L * 0.8, 7 * bw, 8); g.strokeStyle = '#6a4a1a'; g.lineWidth = 0.8; g.setLineDash([2, 2]); g.strokeRect(-11 * bw, -L * 0.8, 7 * bw, 8); g.setLineDash([]);
    // heart-shaped chest plate with a keyhole
    g.fillStyle = '#b8323a'; g.beginPath(); const hx = 4 * bw, hy = -L * 0.7; g.moveTo(hx, hy + 6); g.bezierCurveTo(hx - 8, hy, hx - 5, hy - 7, hx, hy - 3); g.bezierCurveTo(hx + 5, hy - 7, hx + 8, hy, hx, hy + 6); g.fill();
    g.fillStyle = '#1a0a08'; g.fillRect(hx - 0.8, hy - 2, 1.6, 4);
    // springlock latches along the side
    for (let i = 0; i < 4; i++) { g.fillStyle = HF_ENDO; g.fillRect(9 * bw, -L * (0.22 + i * 0.18), 4, 5); }
  },
  shoulderOver(g, sk, p, c, R) { if (R.mono) return; hfBolt(g, sk.fe[0], sk.fe[1], 3, R); hfBolt(g, sk.fk[0], sk.fk[1], 3.2, R); },
  weaponFront: null, weaponBack: null, drawSkirt: null,
});
HF_SUIT.faceFn = hfFace('rabbit');

// a ghost child: soft silhouette with a mask hint of "their" animatronic, two white eyes
function hfGhost(g, x, y, s, a, G, T) {
  if (a <= 0.01) return;
  g.save(); g.translate(x, y); g.scale(s, s);
  const bob = Math.sin(T * 0.06 + x * 0.01) * 4;
  g.translate(0, bob);
  g.globalAlpha = a * 0.35; g.globalCompositeOperation = 'lighter';
  const halo = g.createRadialGradient(0, -60, 4, 0, -60, 70); halo.addColorStop(0, G.col); halo.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = halo; g.fillRect(-70, -130, 140, 140);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = a * 0.78;
  g.fillStyle = 'rgba(214,228,255,0.9)'; g.strokeStyle = G.col; g.lineWidth = 2;
  // body: a small child in a long shirt, fading out at the bottom
  const bg = g.createLinearGradient(0, -70, 0, 0); bg.addColorStop(0, 'rgba(214,228,255,0.95)'); bg.addColorStop(1, 'rgba(214,228,255,0)');
  g.fillStyle = bg; g.beginPath(); g.moveTo(-14, -62); g.quadraticCurveTo(-20, -20, -16, 0); g.lineTo(16, 0); g.quadraticCurveTo(20, -20, 14, -62); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(214,228,255,0.6)'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(-13, -56); g.lineTo(-24, -34); g.moveTo(13, -56); g.lineTo(24, -36); g.stroke();
  // head + mask ears
  g.fillStyle = 'rgba(224,234,255,0.95)'; g.strokeStyle = G.col; g.lineWidth = 2;
  const ear = (pts) => { g.beginPath(); pts.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath(); g.fill(); g.stroke(); };
  if (G.k === 'bear') { for (const ex of [-12, 12]) { g.beginPath(); g.arc(ex, -96, 7, 0, TAU); g.fill(); g.stroke(); } }
  else if (G.k === 'rabbit') { for (const ex of [-7, 7]) { g.beginPath(); g.ellipse(ex, -112, 5, 16, ex * 0.02, 0, TAU); g.fill(); g.stroke(); } }
  else if (G.k === 'fox') { ear([[-16, -88], [-12, -110], [-4, -94]]); ear([[16, -88], [12, -110], [4, -94]]); }
  else { for (const [ex, a2] of [[-5, -0.3], [0, 0], [5, 0.3]]) { g.save(); g.translate(ex, -96); g.rotate(a2); ear([[-2.5, 0], [0, -12], [2.5, 0]]); g.restore(); } }
  g.beginPath(); g.arc(0, -78, 18, 0, TAU); g.fill(); g.stroke();
  // eyes: dark hollows with white pinpoints
  g.globalAlpha = a; g.fillStyle = '#0a0814'; g.beginPath(); g.ellipse(-6, -80, 4, 5.5, 0, 0, TAU); g.ellipse(6, -80, 4, 5.5, 0, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(-6, -80, 1.4, 0, TAU); g.arc(6, -80, 1.4, 0, TAU); g.fill();
  g.restore();
}
function hfHash(n) { n = (n ^ 61) ^ (n >>> 16); n = Math.imul(n, 9); n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); return ((n ^ (n >>> 15)) >>> 0) / 4294967296; }

CINE.hfGolden = function (A, D, f, c) {
  const U = HF_ULTT, dir = c.dir || A.facing;
  if (f === 1) {
    A.x = clamp(A.x, 240, STAGE_W - 240); D.x = clamp(A.x + A.facing * 170, 160, STAGE_W - 160); D.y = GROUND; A.y = GROUND; D.facing = -A.facing;
    c.dir = A.facing; c.ax = A.x; c.maxF = U.end + 10; c.A = A; c.D = D; c.fg = hfGoldenFg; c.bg = null;
    c.zoom = 1.3; c.camX = (A.x + D.x) / 2; c.camY = GROUND - 160;
    c.suitX = clamp(D.x + A.facing * 84, 90, STAGE_W - 90); c.suitA = 0; c.suitPose = 'open'; c.suitShake = 0; c.suitEyes = 0; c.dust = 0;
    c.ghostA = [0, 0, 0, 0]; c.gx = HF_GHOSTS.map(G => G.x0); c.aEyes = 0; c.glitch = 0; c.bars = 0; c.flash = 0; c.lock = 0;
    A.forcePose = 'stance'; D.forcePose = 'stance'; A.hfGlow = true; FX.darkTarget = 0.45;
    Sound.play('servo');
    for (const p of BT.projs) if (p.owner === A) p.dead = true;   // the stage goes quiet: his cupcakes / waves vanish
  }
  c.bars = Math.min(1, c.bars + 0.05);
  // --- 1: it stops moving, the eyes glow, it sinks into the darkness ---
  if (f === U.glow) { A.forcePose = 'twitch'; Sound.play('staticHum'); c.aEyes = 1; }
  if (f >= U.glow && f < U.gone) { FX.darkTarget = lerp(0.45, 0.9, (f - U.glow) / (U.gone - U.glow)); c.zoom = lerp(c.zoom, 1.9, 0.05); c.camX = lerp(c.camX, A.x, 0.1); c.camY = lerp(c.camY, GROUND - 210, 0.1); }
  if (f === U.fade) { A.forcePose = 'slump'; Sound.play('creak'); }
  if (f === U.gone) { A.hidden = true; FX.p({ type: 'smoke', x: A.x, y: A.y - 100, vx: 0, vy: -0.3, life: 40, size: 30, grow: 0.3, color: 'rgba(10,6,16,0.7)', add: false }); Sound.play('springClick', 0.35); }
  if (f > U.gone) c.aEyes = Math.max(0, c.aEyes - 0.06);
  // --- 2: silence, then the four ghost children appear around the foe ---
  if (f > U.gone && f < U.suit) { c.zoom = lerp(c.zoom, 1.45, 0.05); c.camX = lerp(c.camX, D.x, 0.06); c.camY = lerp(c.camY, GROUND - 150, 0.06); D.forcePose = { base: 'stance', hd: Math.sin(f * 0.09) * 0.45, t: -0.08 }; }
  U.ghosts.forEach((g0, i) => { if (f === g0) Sound.play('whisper'); if (f >= g0) c.ghostA[i] = Math.min(1, c.ghostA[i] + 0.025); });
  if (f >= U.close && f < U.push) HF_GHOSTS.forEach((G, i) => { c.gx[i] = lerp(c.gx[i], G.x1, 0.05); });
  // --- 3: the golden suit, the restraint, the push ---
  if (f === U.suit) { Sound.play('creak'); Sound.play('springClick', 0.5); FX.flashScreen('#3a2a08', 8, 0.3); }
  if (f >= U.suit) c.suitA = Math.min(1, c.suitA + 0.05);
  if (f >= U.suit && f < U.inside) { c.zoom = lerp(c.zoom, 1.35, 0.06); c.camX = lerp(c.camX, (D.x + c.suitX) / 2, 0.08); }
  if (f === U.restrain) { D.forcePose = 'hit'; FX.shakeIt(8); Sound.play('ghostBreath'); }
  if (f > U.restrain && f < U.push) D.forcePose = (f >> 2) % 2 ? 'hit' : 'hit2';
  if (f >= U.push && f < U.inside) {
    const t = (f - U.push) / (U.inside - U.push);
    D.x = lerp(D.x, c.suitX, 0.12); D.forcePose = 'airhit';
    HF_GHOSTS.forEach((G, i) => { c.gx[i] = lerp(c.gx[i], G.side < 0 ? 20 : -10, 0.1); });
    if (f % 6 === 0) Sound.play('ghostBreath');
    c.glitch = 0.3 * t;
  }
  if (f === U.inside) { D.hidden = true; D.x = c.suitX; c.suitPose = 'stance'; Sound.play('slam'); Sound.play('springClick'); FX.shakeIt(10); FX.flashScreen('#000000', 6, 0.6); c.lock = 1; }
  // --- 4: click... click... (sudden camera cuts, distortion) ---
  U.clicks.forEach((cf, i) => {
    if (f === cf) {
      Sound.play('springClick'); BT.scriptHit(A, D, 22, { str: 2, sfx: 'hit' }); c.suitShake = 8; c.lock = i + 2; FX.shakeIt(6);
      const close = i % 2 === 0, cam = BT.cam;   // hard cut: snap the camera, no easing
      c.zoom = close ? 2.5 : 1.5; c.camX = c.suitX + (close ? dir * 6 : 0); c.camY = close ? GROUND - 205 : GROUND - 150;
      cam.z = c.zoom; cam.x = c.camX; cam.y = c.camY;
      c.glitch = 0.6 + i * 0.06;
      FX.wtext(c.suitX + rand(-40, 40), GROUND - 260 - i * 8, '*click*', { size: 20 + i * 2, color: '#ffd860', stroke: '#1a0a04', life: 24 });
    }
  });
  if (f > U.inside && f < U.snap) c.glitch = Math.max(0.15, c.glitch - 0.03);
  if (c.suitShake > 0) c.suitShake--;
  // --- 5: SNAP ---
  if (f === U.snap) {
    Sound.play('springSnap'); Sound.play('impactBig'); BT.scriptHit(A, D, 100, { str: 4, sfx: 'slam' });
    FX.flashScreen('#ffffff', 10, 0.9); FX.impactFrame(4); FX.shakeIt(22); BT.hitstop = Math.max(BT.hitstop, 12); c.glitch = 1; c.suitShake = 14; c.lock = 9;
    c.zoom = 2.9; c.camX = c.suitX + dir * 6; c.camY = GROUND - 210; BT.cam.z = c.zoom; BT.cam.x = c.camX; BT.cam.y = c.camY;
    FX.wtext(c.suitX, GROUND - 300, 'SNAP', { size: 70, color: '#ffffff', stroke: '#b8323a', life: 50, vy: -0.2 });
  }
  // --- 6: stillness, the eyes light up, it falls to its knees ---
  if (f > U.snap) c.glitch = Math.max(0, c.glitch - 0.04);
  if (f >= U.still && f < U.dust) { c.zoom = lerp(c.zoom, 1.7, 0.05); c.camY = lerp(c.camY, GROUND - 170, 0.05); }
  if (f === U.eyes) { Sound.play('staticHum'); }
  if (f >= U.eyes) c.suitEyes = Math.min(1, c.suitEyes + 0.06);
  if (f === U.creak) Sound.play('creak');
  if (f === U.kneel) { c.suitPose = 'kneel'; Sound.play('slam', 0.7); FX.dust(c.suitX, GROUND, 10); FX.shakeIt(8); }
  // --- 7: the suit crumbles, the foe drops out, the animatronic is back ---
  if (f >= U.dust) {
    c.dust = Math.min(1, c.dust + 0.06); c.suitA = Math.max(0, 1 - c.dust);
    if (f % 2 === 0) for (let i = 0; i < 3; i++) FX.p({ type: 'ember', x: c.suitX + rand(-34, 34), y: GROUND - rand(10, 190), vy: -rand(0.5, 2), vx: rand(-0.6, 0.6), life: 34, size: 2.6, color: i % 2 ? '#ffd860' : '#d8a840' });
    HF_GHOSTS.forEach((G, i) => { c.ghostA[i] = Math.max(0, c.ghostA[i] - 0.06); });
    c.zoom = lerp(c.zoom, 1.25, 0.06); c.camX = lerp(c.camX, (c.ax + c.suitX) / 2, 0.06);
  }
  if (f === U.dust) { D.hidden = false; D.x = c.suitX; D.forcePose = 'down'; FX.darkTarget = 0.35; }
  if (f === U.back) {
    A.hidden = false; A.x = c.ax; A.facing = D.x > A.x ? 1 : -1; A.forcePose = 'twitch'; A.hfGlow = true;
    FX.p({ type: 'smoke', x: A.x, y: A.y - 100, vx: 0, vy: -0.3, life: 30, size: 26, grow: 0.3, color: 'rgba(10,6,16,0.6)', add: false });
    Sound.play('servo'); FX.wtext(A.x, A.y - 250, 'THEY ALWAYS COME BACK', { size: 24, color: '#ffffff', stroke: A.ch.colors.accent, life: 60 });
  }
  if (f === U.back + 10) A.forcePose = 'stance';
  if (f >= U.end) { FX.darkTarget = 0; A.hfGlow = false; BT.release(D, dir * 3, -6); return true; }
};
function hfGoldenFg(g, c) {
  const cam = BT && BT.cam; if (!cam) return;
  const T = c.f, A = c.A, D = c.D, dir = c.dir;
  g.save(); cam.apply(g);
  // the animatronic's eyes, left floating in the dark after it vanished
  if (c.aEyes > 0.02 && A.hidden) {
    const r = A.ch.dims.headR, e = toWorld(A.x, A.y, A.facing, A.s, A.pose, A.sk, ...headPt(A.sk, 0.46 * r, 0.06 * r));
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = c.aEyes; g.fillStyle = A.ch.colors.eye;
    g.beginPath(); g.arc(e[0], e[1], 3, 0, TAU); g.arc(e[0] + A.facing * 13, e[1] - 2, 2.2, 0, TAU); g.fill();
    g.globalAlpha = c.aEyes * 0.3; g.beginPath(); g.arc(e[0], e[1], 14, 0, TAU); g.fill(); g.restore();
  }
  // the golden suit (behind the foe until they are inside)
  if (c.suitA > 0.01) {
    const shake = c.suitShake > 0 ? Math.sin(T * 2.3) * c.suitShake * 0.4 : 0, sx = c.suitX + shake;
    const p = buildPose(HF_SUIT, c.suitPose === 'kneel' ? 'kneel' : c.suitPose === 'open' ? 'open' : 'stance');
    g.save(); g.globalAlpha = c.suitA;
    const pal = { ...HF_SUIT.colors, eyeGlow: c.suitEyes > 0.5 ? 1 : 0, sclera: c.suitEyes > 0.1 ? '#f2efe6' : '#14100a', eye: '#ffd860' };
    const sk = drawFigure(g, HF_SUIT, p, sx, GROUND, -dir, { pal, T, expr: 'normal' });
    // open back panel while it waits; latches while it closes
    if (c.suitPose === 'open') { const ch2 = toWorld(sx, GROUND, -dir, HF_SUIT.scale, p, sk, sk.hip[0], sk.hip[1] - 30); g.fillStyle = 'rgba(10,6,4,0.85)'; g.beginPath(); g.ellipse(ch2[0], ch2[1], 16, 28, 0, 0, TAU); g.fill(); }
    if (c.lock > 0 && c.suitA > 0.5) {
      for (let i = 0; i < Math.min(6, c.lock); i++) {
        const y = GROUND - 40 - i * 30, w = 30 - Math.abs(i - 2.5) * 2;
        g.strokeStyle = i === c.lock - 2 ? '#fff6c0' : '#8c919c'; g.lineWidth = 3; g.beginPath(); g.moveTo(sx - w, y); g.lineTo(sx - w + 8, y - 4); g.moveTo(sx + w, y); g.lineTo(sx + w - 8, y - 4); g.stroke();
      }
    }
    if (c.suitEyes > 0.02) {
      const r = HF_SUIT.dims.headR, e = toWorld(sx, GROUND, -dir, HF_SUIT.scale, p, sk, ...headPt(sk, 0.46 * r, 0.06 * r));
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = c.suitEyes * c.suitA * 0.5; g.fillStyle = '#ffd860'; g.beginPath(); g.arc(e[0], e[1], 16, 0, TAU); g.fill(); g.globalCompositeOperation = 'source-over';
    }
    g.restore();
  }
  // the four ghost children
  HF_GHOSTS.forEach((G, i) => {
    const a = c.ghostA[i]; if (a <= 0.01) return;
    const x = (c.dust > 0 ? c.suitX : D.x) + G.side * dir * c.gx[i], y = GROUND + (G.fy || 0);
    hfGhost(g, x, y, 1.0 + (G.fy ? -0.08 : 0), a, G, T + i * 40);
  });
  g.restore();
  // screen: letterbox, distortion bars and tint (deterministic hash, no RNG)
  const bh = 64 * c.bars; g.fillStyle = '#000'; g.fillRect(0, 0, W, bh); g.fillRect(0, H - bh, W, bh);
  if (c.glitch > 0.02) {
    g.save(); g.globalAlpha = 0.18 * c.glitch; g.fillStyle = '#ff2a4a'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) { const h0 = hfHash(T * 7 + i * 131); if (h0 > c.glitch) continue; const y = hfHash(T * 13 + i) * H, hh = 4 + hfHash(T + i * 7) * 22; g.globalAlpha = 0.25 * c.glitch; g.fillStyle = i % 2 ? '#2affe0' : '#ffd860'; g.fillRect(0, y, W, hh); }
    g.restore();
    g.save(); g.globalAlpha = 0.12 * c.glitch; g.fillStyle = '#000'; for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1); g.restore();   // scanlines
  }
}
