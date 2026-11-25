// ============================== THE CARDMASTER ==============================
// Card hand system: deck of 8 unique cards, hand of 3, refill timers, visible NEXT card,
// cycle selection (SP2), play (SP1), Deck Shuffle, Card Storm, Wild Card, Summoner's Command.
const CARD_DEFS = {
  blade: { name: 'BLADE CARD', jp: '刃札', cat: 'ATTACK', col: '#ff4a5a', draw: 45, desc: 'Fast spinning card projectile. Low damage. Works in the air (thrown downward).' },
  meteor: { name: 'METEOR CARD', jp: '隕石札', cat: 'ATTACK', col: '#ff8a2a', draw: 130, desc: 'A meteor crashes where the opponent stood (or into your Gravity zone). Slow, heavy, launches.' },
  beast: { name: 'SHADOW BEAST', jp: '影獣', cat: 'CREATURE', col: '#a05cff', draw: 90, desc: 'A shadow wolf charges and bites twice; the second bite launches.' },
  dragon: { name: 'DRAGON CARD', jp: '竜札', cat: 'CREATURE', col: '#ff3a6a', draw: 160, desc: 'A dragon rises behind you and breathes fire along the ground (6 hits, jump it).' },
  mirror: { name: 'MIRROR TRAP', jp: '鏡罠', cat: 'TRAP', col: '#2ad0ff', draw: 110, desc: 'Hidden glyph in front of you for 7 s. When the opponent steps near, mirror shards launch them.' },
  gravity: { name: 'GRAVITY CARD', jp: '重力札', cat: 'TRAP', col: '#4a7bff', draw: 120, desc: 'Gravity well at the opponent: pulls them in, halves walk speed and makes juggles float longer.' },
  shield: { name: 'SHIELD CARD', jp: '盾札', cat: 'SUPPORT', col: '#ffd23a', draw: 140, desc: 'Card barrier in front of you: destroys projectiles and absorbs a melee hit.' },
  reversal: { name: 'REVERSAL CARD', jp: '反転札', cat: 'SUPPORT', col: '#3aff9a', draw: 120, desc: 'Counter stance: reflects projectiles; melee attackers are teleported past and launched.' },
};
const CARD_IDS = Object.keys(CARD_DEFS);

// ---------------------------- card art ----------------------------
function rrect(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
function drawEmblem(g, id, r) {
  g.fillStyle = '#ffffff'; g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(1, r * 0.18); g.lineCap = 'round'; g.lineJoin = 'round';
  switch (id) {
    case 'blade': g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.28, r * 0.35); g.lineTo(-r * 0.28, r * 0.35); g.closePath(); g.fill(); g.fillRect(-r * 0.5, r * 0.35, r, r * 0.15); g.fillRect(-r * 0.1, r * 0.5, r * 0.2, r * 0.45); break;
    case 'meteor': g.beginPath(); g.arc(r * 0.25, r * 0.25, r * 0.5, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-r, -r); g.lineTo(0, 0); g.moveTo(-r * 0.4, -r); g.lineTo(r * 0.2, -r * 0.1); g.moveTo(-r, -r * 0.4); g.lineTo(-r * 0.1, r * 0.2); g.stroke(); break;
    case 'beast': g.beginPath(); g.arc(0, r * 0.3, r * 0.42, 0, TAU); g.fill(); for (const [px, py] of [[-0.55, -0.3], [-0.2, -0.65], [0.2, -0.65], [0.55, -0.3]]) { g.beginPath(); g.arc(px * r, py * r, r * 0.2, 0, TAU); g.fill(); } break;
    case 'dragon': g.beginPath(); g.moveTo(0, -r); g.quadraticCurveTo(r * 0.9, -r * 0.1, r * 0.4, r); g.quadraticCurveTo(0, r * 0.4, -r * 0.4, r); g.quadraticCurveTo(-r * 0.9, -r * 0.1, 0, -r); g.fill(); break;
    case 'mirror': g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.7, 0); g.lineTo(0, r); g.lineTo(-r * 0.7, 0); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(-r * 0.2, -r * 0.4); g.lineTo(r * 0.15, -r * 0.1); g.stroke(); break;
    case 'gravity': g.beginPath(); for (let a = 0; a < 9; a += 0.2) { const rr = r * (1 - a / 9); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.stroke(); break;
    case 'shield': g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 - Math.PI / 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.35, 0, TAU); g.fill(); break;
    case 'reversal': g.beginPath(); g.arc(0, 0, r * 0.7, -2.6, 0.3); g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.7, 0.55, 3.4); g.stroke(); g.beginPath(); g.moveTo(r * 0.75, r * 0.05); g.lineTo(r * 0.95, -r * 0.35); g.lineTo(r * 0.45, -r * 0.2); g.fill(); break;
    default: g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.42 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill();
  }
}
function drawCard(g, cx, cy, w, h, id, o = {}) {
  const d = CARD_DEFS[id], rare = id === 'rare', back = id === 'back';
  g.save(); g.translate(cx, cy); g.rotate(o.rot || 0); if (o.flip !== undefined) g.scale(Math.cos(o.flip) || 0.05, 1);
  if (o.pivot) g.translate(0, -h / 2);
  if (o.glow) { g.shadowColor = rare ? '#ffd23a' : d ? d.col : '#ff4fd8'; g.shadowBlur = o.glow; }
  rrect(g, -w / 2, -h / 2, w, h, w * 0.12); g.fillStyle = rare ? '#ffe9a0' : '#f6f1e6'; g.fill(); g.shadowBlur = 0;
  g.strokeStyle = '#120a16'; g.lineWidth = Math.max(1, w * 0.04); g.stroke();
  const iw = w * 0.84, ih = h * 0.86;
  rrect(g, -iw / 2, -ih / 2, iw, ih, w * 0.08);
  if (back) { const gr = g.createLinearGradient(0, -ih / 2, 0, ih / 2); gr.addColorStop(0, '#3a1f6e'); gr.addColorStop(1, '#1a0b33'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#f2c14e'; g.lineWidth = Math.max(0.8, w * 0.05); g.beginPath(); g.moveTo(0, -ih * 0.35); g.lineTo(iw * 0.3, 0); g.lineTo(0, ih * 0.35); g.lineTo(-iw * 0.3, 0); g.closePath(); g.stroke(); g.restore(); return; }
  const col = rare ? '#ffb020' : d.col, gr = g.createLinearGradient(0, -ih / 2, 0, ih / 2); gr.addColorStop(0, col); gr.addColorStop(1, rare ? '#7a3a00' : '#1a0b2a');
  g.fillStyle = gr; g.fill();
  if (rare) { g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * w * 0.2, -ih / 2); g.lineTo(i * w * 0.2 + w * 0.3, ih / 2); g.stroke(); } g.globalCompositeOperation = 'source-over'; }
  g.save(); g.translate(0, -h * 0.06); drawEmblem(g, id, w * 0.26); g.restore();
  if (w >= 26) {
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(-iw / 2, ih / 2 - h * 0.2, iw, h * 0.2);
    g.font = `900 ${Math.max(6, Math.floor(w * 0.13))}px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff';
    g.fillText(rare ? 'LEGEND' : d.name.split(' ')[0], 0, ih / 2 - h * 0.1);
    g.fillStyle = rare ? '#120a16' : 'rgba(255,255,255,0.85)'; g.font = `900 ${Math.max(5, Math.floor(w * 0.1))}px ${FONT_UI}`; g.fillText(rare ? 'SSR' : d.cat, 0, -ih / 2 + h * 0.07);
  }
  g.restore();
}

// ---------------------------- creature art ----------------------------
function drawBeast(g, x, y, s, dir, t, alpha = 1) {
  g.save(); g.translate(x, y); g.scale(dir * s, s); g.globalAlpha *= alpha;
  const R = { ol: 2 };
  for (let i = 0; i < 4; i++) { const a = Math.sin(t * 0.5 + i * 1.6) * 0.7, lx = -30 + i * 20; limb(g, [lx, -30], [lx + Math.sin(a) * 18, 0], 6, 4, '#1d1030', R); }
  poly(g, [[-55, -60], [-40, -80], [-30, -62], [-18, -86], [-6, -64], [8, -84], [16, -62], [30, -70], [40, -48], [-50, -40]], '#4a1f8a', R);
  ell(g, -4, -42, 50, 24, '#1d1030', R);
  poly(g, [[-52, -50], [-92, -72 + Math.sin(t * 0.4) * 6], [-70, -44]], '#1d1030', R);
  poly(g, [[28, -66], [36, -96], [46, -70]], '#1d1030', R);
  poly(g, [[22, -64], [72, -54], [84, -42], [56, -30], [24, -32]], '#1d1030', R);
  g.save(); g.shadowColor = '#ff4fd8'; g.shadowBlur = 12; g.fillStyle = '#ff7ae6'; g.beginPath(); g.ellipse(50, -52, 6, 3.5, 0.2, 0, TAU); g.fill(); g.restore();
  g.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(60 + i * 8, -38); g.lineTo(64 + i * 8, -30); g.lineTo(68 + i * 8, -38); g.fill(); }
  g.restore();
}
function drawDragonHead(g, x, y, s, dir, open, alpha = 1) {
  g.save(); g.translate(x, y); g.scale(dir * s, s); g.globalAlpha *= alpha;
  const R = { ol: 2.5 }, body = '#b81d3a', dark = '#6a0a1e';
  poly(g, [[-70, -40], [-110, -95], [-60, -48]], '#f0e6cc', R); poly(g, [[-40, -48], [-62, -110], [-24, -50]], '#f0e6cc', R);
  poly(g, [[-80, -30], [-20, -58], [50, -46], [104, -16], [70, 0], [-70, 14]], body, R);
  g.save(); g.translate(-60, 10); g.rotate(open * 0.35); poly(g, [[0, 0], [110, 2], [140, 20], [70, 36], [6, 26]], dark, R); g.restore();
  g.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(20 + i * 16, 2); g.lineTo(26 + i * 16, 14); g.lineTo(32 + i * 16, 2); g.fill(); }
  g.save(); g.shadowColor = '#ffd23a'; g.shadowBlur = 14; g.fillStyle = '#ffe14a'; g.beginPath(); g.ellipse(20, -34, 9, 5, -0.2, 0, TAU); g.fill(); g.fillStyle = '#111'; g.fillRect(18, -38, 3, 8); g.restore();
  poly(g, [[-80, -30], [-120, -20], [-95, -6], [-130, 4], [-80, 10]], body, R);
  g.restore();
}
function drawMeteorRock(g, x, y, r, t) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const tr = g.createLinearGradient(x - r * 5, y - r * 6, x, y); tr.addColorStop(0, 'rgba(255,120,30,0)'); tr.addColorStop(1, 'rgba(255,180,80,0.8)');
  g.strokeStyle = tr; g.lineWidth = r * 1.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - r * 5, y - r * 6); g.lineTo(x, y); g.stroke();
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#5a3020'; g.strokeStyle = '#120a16'; g.lineWidth = 3; g.beginPath();
  for (let i = 0; i < 9; i++) { const a = i * TAU / 9 + t * 0.1, rr = r * (0.8 + ((i * 37) % 5) / 20); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#ff9a3a'; g.beginPath(); g.arc(x + r * 0.2, y + r * 0.2, r * 0.35, 0, TAU); g.fill();
  g.restore();
}

// ---------------------------- hand management ----------------------------
function cardInit(F) {
  F.cards = { hand: [null, null, null], refill: [0, 0, 0], refillMax: [1, 1, 1], sel: 0, deck: shuffleArr(CARD_IDS.slice()), discard: [] };
  for (let i = 0; i < 3; i++) F.cards.hand[i] = F.cards.deck.shift();
}
function cardDraw(F) {
  const C = F.cards;
  if (!C.deck.length) { C.deck = shuffleArr(CARD_IDS.filter(id => !C.hand.includes(id))); C.discard = []; }
  return C.deck.shift();
}
function cardConsume(F, slot) {
  const C = F.cards, id = C.hand[slot]; if (!id) return;
  C.hand[slot] = null; C.refillMax[slot] = C.refill[slot] = CARD_DEFS[id].draw; C.discard.push(id); F.lastCard = { id, slot };
  for (let k = 1; k <= 3; k++) { const j = (slot + k) % 3; if (C.hand[j]) { C.sel = j; break; } }
  F.performed.add('sp1');
  FX.p({ type: 'card', card: id, x: F.x + F.facing * 20, y: F.y - 175 * F.s, vx: 0, vy: -1.4, life: 30, size: 46, rot: 0, vr: 0, add: false });
}
function cardProj(F, o) { return BT.spawn(Object.assign({ owner: F, color: (CARD_DEFS[o.card] || {}).col || '#ff4fd8', clash: 1, str: 1 }, o)); }
function spawnBlade(F, o = {}) {
  const air = !F.onGround;
  return cardProj(F, Object.assign({ kind: 'card', card: 'blade', x: F.x + F.facing * 40, y: F.y - (air ? 100 : 130), vx: F.facing * (air ? 12 : 16), vy: air ? 7 : 0, w: 34, h: 24, dmg: 40, hs: 18, bs: 11, kb: 4, life: 90, str: 1 }, o));
}
function spawnMeteor(F, tx, delay = 34, mult = 1) {
  return cardProj(F, { kind: 'meteor', card: 'meteor', persist: 1, x: tx, y: GROUND - 160, w: 150, h: 320, delay, d0: delay, life: 14, dmg: 110 * mult, hs: 30, bs: 16, kb: 4, launch: -11, kd: 1, str: 3, clash: 0 });
}
function spawnBeast(F, v = 9.5, mult = 1, delay = 0) {
  return cardProj(F, { kind: 'beast', card: 'beast', x: F.x + F.facing * 30, y: GROUND - 45, vx: F.facing * v, w: 90, h: 80, hits: 2, interval: 14, dmg: 34 * mult, hs: 22, bs: 12, kb: 3, life: 110, str: 2, delay, d0: delay, final: { launch: -11, kd: 1, dmg: 40 * mult, str: 3 } });
}
function spawnDragon(F, mult = 1) {
  return cardProj(F, { kind: 'dragon', card: 'dragon', persist: 1, x: F.x - F.facing * 30, y: GROUND - 80, dir: F.facing, delay: 14, d0: 14, life: 52, hits: 6, interval: 8, dmg: 17 * mult, hs: 18, bs: 8, kb: 2, w: 620, h: 70, str: 2, clash: 0, final: { kd: 1, launch: -8, dmg: 24 * mult, str: 3 } });
}
function spawnMirror(F, x, armed) {
  BT.projs.filter(p => p.owner === F && p.kind === 'mirror').forEach(p => (p.dead = true));
  const p = cardProj(F, { kind: 'mirror', card: 'mirror', persist: 1, harmless: true, x: clamp(x, 60, STAGE_W - 60), y: GROUND - 85, w: 120, h: 170, life: 420, dmg: 62, hs: 30, bs: 16, kb: 3, launch: -13, kd: 1, str: 3, clash: 0 });
  if (armed) p.armT = 8; return p;
}
function spawnGravity(F, x) {
  BT.projs.filter(p => p.owner === F && p.kind === 'gravity').forEach(p => (p.dead = true));
  return cardProj(F, { kind: 'gravity', card: 'gravity', persist: 1, harmless: true, x: clamp(x, 120, STAGE_W - 120), y: GROUND - 110, w: 340, h: 260, life: 150, clash: 0 });
}
function wildType(ids) {
  const cnt = {}; ids.forEach(id => { const c = CARD_DEFS[id].cat; cnt[c] = (cnt[c] || 0) + 1; });
  if (Object.keys(cnt).length >= 3) return 'ROYAL FLUSH';
  if (cnt.CREATURE >= 2) return 'STAMPEDE'; if (cnt.ATTACK >= 2) return 'ARSENAL'; if (cnt.TRAP >= 2) return 'LOCKDOWN'; if (cnt.SUPPORT >= 2) return 'FORTRESS';
  return 'JOKER';
}
const WILD = {
  'ROYAL FLUSH'(F) { BT.spawn({ owner: F, kind: 'beam', follow: 1, x: F.x, y: F.y - 118 * F.s, w: 1100, h: 120, life: 44, hits: 6, interval: 6, dmg: 22, hs: 22, bs: 10, kb: 1.5, str: 2, clash: 0, color: '#ffd23a', final: { dmg: 55, launch: -12, kd: 1, str: 4, shake: 14, impact: 3 } }); Sound.play('thunder'); Sound.play('explosion'); FX.shakeIt(10); },
  STAMPEDE(F) { [8.5, 10.5, 12.5].forEach((v, i) => spawnBeast(F, v, 0.9, i * 10)); Sound.play('charge'); },
  ARSENAL(F, O) { [-110, 0, 110].forEach((dx, i) => spawnMeteor(F, clamp(O.x + dx, 60, STAGE_W - 60), 18 + i * 8, 0.7)); spawnBlade(F); },
  LOCKDOWN(F, O) { spawnGravity(F, O.x); spawnMirror(F, O.x, true); },
  FORTRESS(F) { F.shieldT = 300; F.shieldHP = 3; F.hp = Math.min(F.maxHp, F.hp + 60); F.meter = Math.min(100, F.meter + 25); Sound.play('perfect'); FX.ring(F.x, F.y - 100, '#ffd23a', 20, 160, 20, 6); },
  JOKER(F, O) { const k = pick(['ROYAL FLUSH', 'STAMPEDE', 'ARSENAL', 'LOCKDOWN']); FX.wtext(F.x, F.y - 260, 'JOKER → ' + k, { size: 26, color: '#ffffff', stroke: '#ff4fd8', life: 50 }); WILD[k](F, O); },
};

// ---------------------------- projectiles ----------------------------
EXTRA_PROJ.card = {
  update(p) { if (p.t % 2 === 0) FX.p({ type: 'spark', x: p.x, y: p.y, vx: -p.vx * 0.15, vy: 0, life: 8, size: 2.5, color: p.color }); if (p.vy > 0 && p.y >= GROUND - 10) { p.dead = true; FX.burst(p.x, GROUND - 10, p.color, 6, 4); } },
  draw(g, p) { drawCard(g, p.x, p.y, 22, 30, p.card, { rot: Math.atan2(p.vy, p.vx) + Math.PI / 2, flip: p.t * 0.6, glow: 10 }); },
};
EXTRA_PROJ.rare = {
  update(p) { if (p.t % 2 === 0) FX.p({ type: 'ember', x: p.x + rand(-20, 20), y: p.y + rand(-20, 20), vx: -p.vx * 0.1, vy: rand(-1, 1), life: 16, size: 3, color: '#ffd23a' }); },
  draw(g, p) { drawCard(g, p.x, p.y, 40, 56, 'rare', { rot: p.t * 0.3, glow: 30 }); },
};
EXTRA_PROJ.meteor = {
  delay(p) { if (p.delay === 0) { Sound.play('explosion'); FX.shakeIt(14); FX.rocks(p.x, GROUND, 16); FX.ring(p.x, GROUND, '#ff8a2a', 10, 200, 18, 8, 0.25); for (let i = 0; i < 30; i++) FX.flame(p.x + rand(-60, 60), GROUND - rand(0, 140), '#ff7a1a', 1, 8, 3); } },
  update() {},
  draw(g, p) {
    if (p.delay > 0) {
      const k = 1 - p.delay / p.d0;
      g.save(); g.strokeStyle = '#ff4a2a'; g.lineWidth = 3; g.globalAlpha = 0.5 + 0.5 * Math.sin(p.t * 0.7); g.beginPath(); g.ellipse(p.x, GROUND, 60, 12, 0, 0, TAU); g.stroke();
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(p.x, GROUND, 60 * k, 12 * k, 0, 0, TAU); g.fill(); g.restore();
      drawMeteorRock(g, p.x - 340 * (1 - k), GROUND - 60 - 780 * (1 - k), 26 + 10 * k, p.t);
    } else {
      const k = 1 - p.life / p.max; g.save(); g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(p.x, GROUND - 60, 0, p.x, GROUND - 60, 190); gr.addColorStop(0, 'rgba(255,255,220,0.95)'); gr.addColorStop(0.4, 'rgba(255,140,40,0.7)'); gr.addColorStop(1, 'rgba(255,40,0,0)');
      g.globalAlpha = 1 - k; g.fillStyle = gr; g.beginPath(); g.arc(p.x, GROUND - 60, 80 + 110 * easeOut(k), 0, TAU); g.fill(); g.restore();
    }
  },
};
EXTRA_PROJ.beast = {
  update(p) { if (p.t % 3 === 0) FX.p({ type: 'smoke', x: p.x - Math.sign(p.vx) * 40, y: p.y - 30, vx: -p.vx * 0.2, vy: -0.6, life: 22, size: 12, color: 'rgba(80,30,140,0.55)', add: false, grow: 0.4 }); },
  draw(g, p) { if (p.delay > 0) return; drawBeast(g, p.x, p.y + 45, 1, Math.sign(p.vx) || 1, p.t, Math.min(1, p.t / 6)); },
};
EXTRA_PROJ.dragon = {
  rect(p) { const mx = p.x + p.dir * 95; return { x: p.dir > 0 ? mx : mx - p.w, y: GROUND - 120, w: p.w, h: p.h }; },
  delay(p) { if (p.delay === 6) Sound.play('fire'); },
  update(p) { if (p.t % 2 === 0) for (let i = 0; i < 4; i++) FX.flame(p.x + p.dir * (110 + rand(0, 560)), GROUND - 85 + rand(-25, 25), '#ff6a2a', 1, 8, 1.2); if (p.t % 12 === 0) Sound.play('fire'); },
  draw(g, p) {
    const em = p.delay > 0 ? 1 - p.delay / p.d0 : 1, fade = p.delay > 0 ? 1 : Math.min(1, p.life / 10);
    g.save(); g.globalAlpha = fade;
    g.strokeStyle = '#ff4fd8'; g.lineWidth = 3; g.globalCompositeOperation = 'lighter'; g.beginPath(); g.ellipse(p.x, GROUND, 70 * em, 14 * em, 0, 0, TAU); g.stroke(); g.globalCompositeOperation = 'source-over';
    const hx = p.x + p.dir * 40, hy = GROUND - 40 - 120 * em;
    g.strokeStyle = '#120a16'; g.lineWidth = 34; g.lineCap = 'round'; g.beginPath(); g.moveTo(p.x, GROUND); g.quadraticCurveTo(p.x - p.dir * 50, GROUND - 90 * em, hx, hy); g.stroke();
    g.strokeStyle = '#b81d3a'; g.lineWidth = 28; g.stroke();
    drawDragonHead(g, hx + p.dir * 10, hy, 0.8 * em, p.dir, p.delay > 0 ? 0.2 : 1);
    if (p.delay <= 0) {
      const r = this.rect(p); g.globalCompositeOperation = 'lighter';
      const gr = g.createLinearGradient(r.x, 0, r.x + r.w, 0);
      if (p.dir > 0) { gr.addColorStop(0, 'rgba(255,250,200,0.9)'); gr.addColorStop(0.5, 'rgba(255,120,40,0.6)'); gr.addColorStop(1, 'rgba(255,40,0,0)'); }
      else { gr.addColorStop(1, 'rgba(255,250,200,0.9)'); gr.addColorStop(0.5, 'rgba(255,120,40,0.6)'); gr.addColorStop(0, 'rgba(255,40,0,0)'); }
      g.fillStyle = gr; g.beginPath(); const mx = p.dir > 0 ? r.x : r.x + r.w;
      g.moveTo(mx, hy + 10); g.lineTo(mx + p.dir * r.w, GROUND - 130 + Math.sin(p.t) * 8); g.lineTo(mx + p.dir * r.w, GROUND - 30); g.closePath(); g.fill();
    }
    g.restore();
  },
};
EXTRA_PROJ.mirror = {
  trigger(p) { p.triggered = true; p.harmless = false; p.life = 14; p.max = 14; Sound.play('slash'); Sound.play('block'); for (let i = 0; i < 24; i++) FX.p({ type: 'shard', x: p.x + rand(-40, 40), y: GROUND - 5, vx: rand(-4, 4), vy: -rand(6, 15), life: rand(25, 40), size: rand(4, 9), color: pick(['#bff4ff', '#2ad0ff', '#ffffff']), grav: 0.4, rot: rand(0, 6), vr: 0.3, add: false }); },
  update(p) {
    if (p.triggered) return;
    if (p.armT !== undefined && --p.armT <= 0) { this.trigger(p); return; }
    const D = p.owner.opp;
    if (D && Math.abs(D.x - p.x) < 70 && D.y > GROUND - 40 && !['knockdown', 'grabbed', 'cine', 'getup'].includes(D.state)) this.trigger(p);
  },
  draw(g, p) {
    g.save(); g.globalCompositeOperation = 'lighter';
    if (!p.triggered) {
      g.globalAlpha = 0.35 + 0.2 * Math.sin(p.t * 0.12); g.strokeStyle = '#2ad0ff'; g.lineWidth = 2;
      g.beginPath(); g.ellipse(p.x, GROUND, 58, 11, 0, 0, TAU); g.stroke();
      for (let i = 0; i < 2; i++) { g.beginPath(); for (let k = 0; k < 3; k++) { const a = k * TAU / 3 + i * Math.PI / 3 + p.t * 0.01; g.lineTo(p.x + Math.cos(a) * 48, GROUND + Math.sin(a) * 9); } g.closePath(); g.stroke(); }
    } else {
      const k = 1 - p.life / p.max; g.globalAlpha = 1 - k;
      for (let i = 0; i < 7; i++) { const x = p.x + (i - 3) * 16, hh = (60 + (i % 3) * 40) * easeOut(Math.min(1, k * 3)); g.fillStyle = i % 2 ? '#bff4ff' : '#2ad0ff'; g.beginPath(); g.moveTo(x - 8, GROUND); g.lineTo(x, GROUND - hh); g.lineTo(x + 8, GROUND); g.fill(); }
    }
    g.restore();
  },
};
EXTRA_PROJ.gravity = {
  update(p) {
    const D = p.owner.opp; if (!D || ['grabbed', 'cine', 'knockdown'].includes(D.state)) return;
    const dx = p.x - D.x;
    if (Math.abs(dx) < 175) {
      D.slowT = 2;
      if (D.onGround && ['idle', 'walk', 'crouch', 'block'].includes(D.state)) D.x += Math.sign(dx) * 1.6;
      if (!D.onGround) { D.vx = D.vx * 0.92 + Math.sign(dx) * 0.5; if (D.vy > 0) D.vy *= 0.84; }
      if (p.t % 3 === 0) FX.p({ type: 'spark', x: D.x + rand(-40, 40), y: D.y - rand(20, 160), vx: Math.sign(dx) * 3, vy: 0, life: 10, size: 2, color: '#8fa8ff' });
    }
    if (p.t % 2 === 0) { const a = rand(0, TAU); FX.p({ type: 'spark', x: p.x + Math.cos(a) * 150, y: p.y + Math.sin(a) * 100, vx: -Math.cos(a) * 5, vy: -Math.sin(a) * 4, life: 14, size: 2.5, color: '#6a8cff' }); }
  },
  draw(g, p) {
    const fade = Math.min(1, p.life / 20, p.t / 10);
    g.save(); g.globalAlpha = fade;
    const gr = g.createRadialGradient(p.x, p.y, 10, p.x, p.y, 170); gr.addColorStop(0, 'rgba(10,0,30,0.75)'); gr.addColorStop(0.6, 'rgba(60,40,160,0.25)'); gr.addColorStop(1, 'rgba(60,40,160,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(p.x, p.y, 170, 130, 0, 0, TAU); g.fill();
    g.strokeStyle = '#8fa8ff'; g.lineWidth = 2; g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(p.x, p.y, 150 - i * 30, 110 - i * 22, p.t * 0.03 * (i % 2 ? 1 : -1), i, i + 4); g.stroke(); }
    g.restore();
  },
};

// ---------------------------- the Final Collection cinematic ----------------------------
function drawCardVoid(g, c) {
  const a = c.bgA || 0; if (a <= 0.01) return;
  g.save(); g.globalAlpha = a;
  const gr = g.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 800); gr.addColorStop(0, '#3a0b4a'); gr.addColorStop(0.6, '#12041f'); gr.addColorStop(1, '#030106');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(242,193,78,0.18)'; g.lineWidth = 1;
  for (let i = -10; i < 30; i++) { g.beginPath(); g.moveTo(i * 80 + (c.f % 80), 0); g.lineTo(i * 80 - 400 + (c.f % 80), H); g.moveTo(i * 80 - (c.f % 80), 0); g.lineTo(i * 80 + 400 - (c.f % 80), H); g.stroke(); }
  g.globalAlpha = a * 0.28;
  for (let i = 0; i < 10; i++) { const x = (i * 157 + c.f * (0.6 + (i % 3) * 0.3)) % (W + 200) - 100, y = 90 + (i * 131) % 480; drawCard(g, x, y, 70, 98, i % 3 ? 'back' : CARD_IDS[i % 8], { rot: Math.sin(c.f * 0.02 + i) * 0.4 }); }
  g.globalAlpha = a;
  g.font = `900 120px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(255,79,216,0.12)'; g.fillText('最終蒐集', W / 2, 120);
  g.restore();
}
function drawCardFG(g, c) {
  if (!BT) return;
  g.save(); BT.cam.apply(g);
  const px = c.camX, py = GROUND - 400, A = c.A, D = c.D;
  if (c.portal > 0) {
    const r = 230 * c.portal;
    g.save(); g.translate(px, py); g.globalCompositeOperation = 'lighter';
    const vg = g.createRadialGradient(0, 0, 0, 0, 0, r); vg.addColorStop(0, 'rgba(255,255,255,0.95)'); vg.addColorStop(0.3, 'rgba(255,79,216,0.7)'); vg.addColorStop(0.75, 'rgba(90,30,200,0.5)'); vg.addColorStop(1, 'rgba(40,0,80,0)');
    g.fillStyle = vg; g.beginPath(); g.ellipse(0, 0, r, r * 0.8, 0, 0, TAU); g.fill();
    for (let i = 0; i < 3; i++) { g.save(); g.rotate(c.f * 0.03 * (i % 2 ? -1 : 1)); g.strokeStyle = i === 1 ? '#f2c14e' : '#ff4fd8'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, r * (1 - i * 0.18), r * 0.8 * (1 - i * 0.18), 0, 0, TAU); g.stroke();
      for (let k = 0; k < 12; k++) { const an = k * TAU / 12; g.save(); g.translate(Math.cos(an) * r * (1 - i * 0.18), Math.sin(an) * r * 0.8 * (1 - i * 0.18)); g.rotate(an); g.fillStyle = '#f2c14e'; g.fillRect(-4, -4, 8, 8); g.restore(); }
      g.restore(); }
    g.restore();
  }
  if (c.dragon > 0 && c.dragon < 1) {
    const t = c.dragon, hx = lerp(px, D.x - c.dir * 60, easeOut(Math.min(1, t * 2))), hy = lerp(py, D.y - 230, easeOut(Math.min(1, t * 2)));
    g.strokeStyle = '#b81d3a'; g.lineWidth = 40; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + 160, py + 60, hx, hy); g.stroke();
    drawDragonHead(g, hx, hy, 1.3, c.dir, 1);
    if (t > 0.3) { g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(hx, hy, D.x, D.y - 100); gr.addColorStop(0, 'rgba(255,250,200,0.9)'); gr.addColorStop(1, 'rgba(255,80,20,0.5)'); g.strokeStyle = gr; g.lineWidth = 70; g.beginPath(); g.moveTo(hx + c.dir * 80, hy + 10); g.lineTo(D.x, D.y - 100); g.stroke(); g.restore(); }
  }
  if (c.beasts > 0 && c.beasts < 1) for (let i = 0; i < 3; i++) { const t = clamp(c.beasts * 1.6 - i * 0.3, 0, 1); if (t <= 0 || t >= 1) continue; drawBeast(g, lerp(px + (i - 1) * 80, D.x, t), lerp(py, D.y - 60, t) + 45, 1.2, D.x > px ? 1 : -1, c.f + i * 7); }
  if (c.meteors > 0 && c.meteors < 1) for (let i = 0; i < 4; i++) { const t = clamp(c.meteors * 1.8 - i * 0.25, 0, 1); if (t <= 0 || t >= 1) continue; drawMeteorRock(g, lerp(px + (i - 1.5) * 90, D.x + (i - 1.5) * 20, t), lerp(py, D.y - 100, t), 30, c.f); }
  if (c.cardP) drawCard(g, c.cardP.x, c.cardP.y, 56, 78, 'rare', { rot: c.cardRot || 0, glow: 34 });
  g.restore();
}
CINE.cardmaster = function (A, D, f, c) {
  const dir = c.dir ?? (c.dir = A.facing);
  if (f === 1) {
    c.zoom = 1.15; c.camX = clamp((A.x + D.x) / 2, 420, STAGE_W - 420); c.camY = GROUND - 220; c.bg = drawCardVoid; c.fg = drawCardFG; c.bgA = 0; c.portal = 0;
    D.y = GROUND; D.forcePose = 'hit'; A.forcePose = 'present'; Sound.play('charge');
    BT.say(A, 'Behold. A card printed only once.', 70);
  }
  c.bgA = f < 200 ? Math.min(1, f / 16) : Math.max(0, 1 - (f - 200) / 20);
  if (f === 30) { A.forcePose = 'throwUp'; Sound.play('whoosh'); }
  if (f >= 30 && f <= 50) { const t = (f - 30) / 20; c.cardP = { x: lerp(A.x + dir * 20, c.camX, t), y: lerp(A.y - 170, GROUND - 400, easeOut(t)) }; c.cardRot = f * 0.4; }
  if (f === 50) { Sound.play('explosion'); FX.flashScreen('#ff9ff0', 10, 0.5); FX.shakeIt(12); }
  if (f >= 50 && f <= 64) c.portal = (f - 50) / 14;
  if (f > 50 && f < 150) { c.cardRot = f * 0.15; if (f % 2 === 0) FX.p({ type: 'card', card: CARD_IDS[f % 8], x: c.camX + rand(-200, 200), y: GROUND - 400 + rand(-120, 120), vx: (D.x - c.camX) / 40 + rand(-2, 2), vy: rand(3, 7), life: 40, size: 28, rot: rand(0, 6), vr: 0.25, add: false }); }
  if (f >= 56 && f < 142) { const t = clamp((f - 56) / 12, 0, 1); D.y = GROUND - 140 * t + Math.sin(f * 0.7) * 4; D.forcePose = f % 8 < 4 ? 'airhit' : 'hit'; }
  if (f >= 64 && f <= 98) c.dragon = (f - 64) / 34; else c.dragon = 0;
  if ([70, 77, 84, 91].includes(f)) { BT.scriptHit(A, D, 15, { str: 2, sfx: 'fire' }); FX.flame(D.x, D.y - 100, '#ff6a2a', 20, 40, 3); }
  if (f >= 88 && f <= 118) c.beasts = (f - 88) / 30; else c.beasts = 0;
  if ([96, 104, 112].includes(f)) BT.scriptHit(A, D, 16, { str: 2, sfx: 'slash' });
  if (f >= 108 && f <= 138) c.meteors = (f - 108) / 30; else c.meteors = 0;
  if ([116, 122, 128, 134].includes(f)) { BT.scriptHit(A, D, 14, { str: 3 }); FX.rocks(D.x, D.y - 60, 6); }
  if (f === 142) {
    BT.scriptHit(A, D, 125, { str: 4 }); FX.impactFrame(5); FX.shakeIt(26); Sound.play('explosion'); FX.flashScreen('#ff4fd8', 14, 0.7);
    FX.ring(D.x, D.y - 100, '#ffd23a', 20, 320, 26, 12); FX.ring(D.x, D.y - 100, '#ff4fd8', 20, 240, 20, 8);
    FX.wtext(D.x, D.y - 300, '神札!!', { size: 110, font: FONT_JP, color: '#ffffff', stroke: '#ff4fd8', life: 60, vy: -0.3 });
  }
  if (f > 142 && f <= 152) { const t = (f - 142) / 10; D.y = lerp(GROUND - 140, GROUND, t * t); }
  if (f === 152) D.forcePose = 'down';
  if (f >= 150 && f <= 164) c.portal = 1 - (f - 150) / 14;
  if (f > 152 && f <= 172) { const t = (f - 152) / 20, h = A.handW('f'); c.cardP = { x: lerp(c.camX, h[0], t), y: lerp(GROUND - 400, h[1], easeOut(t)) }; c.cardRot = (1 - t) * 8; }
  if (f === 172) { c.cardP = null; A.forcePose = 'examine'; Sound.play('perfect'); BT.say(A, 'Another rare addition to my collection.', 110); }
  if (f === 238) { BT.release(D, dir * 3, -4); return true; }
};

// ---------------------------- character ----------------------------
const CARDMASTER = {
  id: 'cardmaster', name: 'FUDAGAMI', jp: 'フダガミ', title: 'The Cardmaster', titleJp: '札の覇者',
  style: 'SUMMONER / ZONER', desc: 'A collector who never throws a punch he can replace with a card. Plays a hand of 3 from a deck of 8: blades, meteors, beasts, dragons, traps and shields.',
  stats: { power: 2, speed: 3, range: 5, defense: 2 },
  scale: 1.0, health: 940, walk: 4.2, backWalk: 3.8, jumpV: -17, jumpX: 4.4, dashV: 11, juggleMax: 6,
  dims: { ...DIMS, headR: 16.5 }, build: { arm: 0.9, leg: 0.95, torso: 0.95 },
  colors: { skin: '#f1d2bd', hair: '#1c2238', top: '#2b1d4f', leg: '#17131f', boot: '#0e0b14', foot: '#0e0b14', uarm: '#2b1d4f', farm: '#2b1d4f', hand: '#17131f', cuff: '#f2c14e', belt: '#0e0b14', eye: '#ff4fd8', accent: '#ff4fd8', gold: '#f2c14e', shirt: '#e2def0', brow: '#1c2238' },
  voicePitch: 0.8, voiceRate: 0.95, cardList: true,
  stance: { t: 0.06, hd: -0.1, fa1: 0.55, fa2: 2.05, ba1: 0.35, ba2: 2.35, fl1: 0.3, fl2: 0.1, bl1: -0.25, bl2: -0.1, cf: 1 },
  poses: {
    victory: { t: 0.0, hd: 0.12, fa1: 0.85, fa2: 2.75, cs: 2.2, cf: 0, ba1: -0.35, ba2: 0.4, fl1: 0.18, fl2: 0.05, bl1: -0.18, bl2: -0.05 },
    examine: { t: 0.0, hd: 0.12, fa1: 0.85, fa2: 2.75, cs: 2.2, cf: 0, ba1: -0.35, ba2: 0.4, fl1: 0.18, fl2: 0.05, bl1: -0.18, bl2: -0.05 },
    intro: { t: 0.0, hd: -0.2, fa1: 1.6, fa2: 1.7, cf: 1, ba1: 0.3, ba2: 2.3 },
    present: { t: -0.1, hd: -0.25, fa1: 2.75, fa2: 3.05, cs: 2.2, cf: 0, ba1: 0.2, ba2: 0.6 },
    throwUp: { t: -0.15, hd: -0.45, fa1: 2.9, fa2: 3.1, cs: 0, cf: 0, ba1: 0.2, ba2: 0.6 },
    throwC_w: { t: -0.05, fa1: -0.5, fa2: 0.9, cs: 1, cf: 0, ba1: 0.4, ba2: 2.3 },
    throwC: { t: 0.3, fa1: 1.7, fa2: 1.45, cs: 0, cf: 0, ba1: -0.5, ba2: 0.4, fl1: 0.55, fl2: 0.2, bl1: -0.5, bl2: -0.3 },
    summon: { t: -0.1, hd: -0.2, fa1: 2.0, fa2: 2.3, ba1: 1.8, ba2: 2.1, cs: 1, cf: 0 },
    counterCM: { t: -0.05, fa1: 1.2, fa2: 2.4, ba1: 1.0, ba2: 2.6, cs: 1.6, cf: 0 },
    cardStrike_w: { t: -0.25, fa1: 2.6, fa2: 3.0, cs: 1.6, cf: 0 },
    cardStrike: { t: 0.45, fa1: 1.45, fa2: 1.3, cs: 1.6, cf: 0, fl1: 0.65, fl2: 0.2, bl1: -0.55, bl2: -0.35 },
  },
  intro: 'Let us see which card fate deals you.',
  wins: ['Another rare addition to my collection.', 'You were never more than a common card.', 'Checkmate. Wrong game? No — wrong opponent.'],
  introFx(F) { for (let i = 0; i < 16; i++) FX.p({ type: 'card', card: CARD_IDS[i % 8], x: F.x, y: F.y - 120, vx: rand(-7, 7), vy: -rand(3, 9), grav: 0.3, life: 40, size: 26, rot: rand(0, 6), vr: rand(-0.3, 0.3), add: false }); Sound.play('energy'); },
  ropes: [
    { id: 'coat1', at: sk => [sk.hip[0] - 10, sk.hip[1] - 4], n: 7, seg: 10, w0: 9, w1: 7, color: 'top', grav: 0.55, wind: 0.4 },
    { id: 'coat2', at: sk => [sk.hip[0] - 5, sk.hip[1] - 2], n: 6, seg: 10, w0: 7, w1: 6, color: 'top', grav: 0.6, wind: 0.3 },
  ],
  hairBack(g, r, c, R) { polyR(g, r, [[0.6, -0.85], [0.1, -1.3], [-0.6, -1.15], [-1.55, -0.75], [-1.0, -0.35], [-1.6, 0.05], [-0.95, 0.22], [-1.3, 0.65], [-0.5, 0.6]], c.hair, R); },
  hairFront(g, r, c, R) {
    polyR(g, r, [[0.4, -1.02], [1.15, -0.6], [1.02, 0.12], [0.86, -0.25], [0.72, 0.42], [0.52, -0.42], [0.0, -1.08]], c.hair, R);
    if (R.mono) return;
    g.strokeStyle = '#ff4fd8'; g.lineWidth = 0.1 * r; g.beginPath(); g.moveTo(0.3 * r, -0.98 * r); g.quadraticCurveTo(0.8 * r, -0.6 * r, 0.82 * r, 0.05 * r); g.stroke();
    g.fillStyle = '#ff4fd8'; g.fillRect(-0.22 * r, 0.42 * r, 0.16 * r, 0.24 * r); g.strokeStyle = OUTLINE; g.lineWidth = 1; g.strokeRect(-0.22 * r, 0.42 * r, 0.16 * r, 0.24 * r);
  },
  neckWear(g, sk, p, c, R) {
    poly(g, [[sk.neck[0] - 9, sk.neck[1] + 6], [sk.neck[0] - 12, sk.neck[1] - 14], [sk.neck[0] - 2, sk.neck[1] - 4]], c.top, R, 3);
    if (!R.mono) { g.strokeStyle = c.gold; g.lineWidth = 1.5; g.beginPath(); g.moveTo(sk.neck[0] - 12, sk.neck[1] - 14); g.lineTo(sk.neck[0] - 2, sk.neck[1] - 4); g.stroke(); }
  },
  torsoDetail(g, L, bw, c) {
    g.fillStyle = c.shirt; g.beginPath(); g.moveTo(4 * bw, -L - 4); g.lineTo(16 * bw, -L - 2); g.lineTo(16 * bw, 4); g.lineTo(8 * bw, 4); g.lineTo(6 * bw, -L * 0.5); g.closePath(); g.fill();
    g.strokeStyle = c.gold; g.lineWidth = 2.5; g.beginPath(); g.moveTo(4 * bw, -L - 4); g.lineTo(6 * bw, -L * 0.5); g.lineTo(8 * bw, 4); g.stroke();
    g.fillStyle = '#ff4fd8'; g.beginPath(); g.moveTo(10 * bw, -L * 0.95); g.lineTo(13 * bw, -L * 0.85); g.lineTo(10 * bw, -L * 0.6); g.lineTo(8 * bw, -L * 0.85); g.closePath(); g.fill();
  },
  torsoOver(g, L, bw, c, R) {
    if (R.mono) return;
    ['#ff4a5a', '#a05cff', '#2ad0ff', '#ffd23a', '#3aff9a'].forEach((col, i) => { g.save(); g.translate(-10 * bw + i * 5 * bw, -4); g.rotate(-0.2 + i * 0.1); g.fillStyle = '#f6f1e6'; g.fillRect(-3, -7, 6, 9); g.fillStyle = col; g.fillRect(-2, -6, 4, 7); g.restore(); });
    g.save(); g.shadowColor = '#ff4fd8'; g.shadowBlur = 10; poly(g, [[-16 * bw, -10], [-9 * bw, -10], [-9 * bw, 6], [-16 * bw, 6]], '#3a1f6e', R, 2); g.restore();
  },
  drawSkirt(g, sk, p, c, R, o) {
    const fl = Math.sin((o.T || 0) * 0.12) * 3;
    const hb = [sk.hip[0] - 16, sk.hip[1] - 6], kb = [sk.bk[0] - 18 + fl, sk.bk[1] + 36], mid = [lerp(sk.bk[0], sk.fk[0], 0.4) - 6, Math.max(sk.bk[1], sk.fk[1]) + 26 - fl], hf = [sk.hip[0] + 2, sk.hip[1] - 2];
    poly(g, [hb, kb, mid, hf], c.top, R);
    if (!R.mono) { g.strokeStyle = c.gold; g.lineWidth = 2.5; g.beginPath(); g.moveTo(kb[0], kb[1]); g.lineTo(mid[0], mid[1]); g.stroke(); }
  },
  weaponFront(g, sk, p, c, R, o) {
    const [hx, hy] = sk.fh, a = p.fa2, dx = Math.sin(a), dy = Math.cos(a), T = o.T || 0;
    if (p.cs > 0.4) {
      const big = p.cs > 1.4, rare = p.cs > 1.9, w = big ? 28 : 12, h = big ? 40 : 17;
      if (R.mono) { g.save(); g.translate(hx + dx * h * 0.45, hy + dy * h * 0.45); g.rotate(Math.atan2(dy, dx) - Math.PI / 2); g.fillStyle = R.mono; g.fillRect(-w / 2, -h / 2, w, h); g.restore(); }
      else drawCard(g, hx + dx * h * 0.45, hy + dy * h * 0.45, w, h, rare ? 'rare' : big ? 'blade' : 'back', { rot: Math.atan2(dy, dx) - Math.PI / 2, glow: big ? 18 : 0 });
    }
    if (p.cf > 0.5 && !R.mono) {
      for (let i = 0; i < 4; i++) drawCard(g, hx + 4, hy - 2, 11, 16, 'back', { rot: -0.6 + i * 0.32 + Math.sin(T * 0.05 + i) * 0.04, pivot: true });
      const ph = (T % 56) / 56;
      if (ph < 0.55) { const k = ph / 0.55, [bx, by] = sk.bh; drawCard(g, lerp(bx, hx, k), lerp(by, hy, k) - Math.sin(k * Math.PI) * 30, 10, 14, 'back', { rot: k * 7 }); }
    }
  },
  weaponBack(g, sk, p, c, R) {
    if (p.cf < 0.5 || R.mono) return;
    const [hx, hy] = sk.bh;
    for (let i = 0; i < 3; i++) drawCard(g, hx + i * 0.8, hy - 4 - i * 1.2, 11, 16, 'back', { rot: 0.2 });
  },
  initFighter(F) { cardInit(F); },
  tick(F) {
    const C = F.cards; if (!C) return;
    const sp = BT && BT.mode === 'training' ? 4 : 1;
    for (let i = 0; i < 3; i++) if (!C.hand[i]) { C.refill[i] -= sp; if (C.refill[i] <= 0) { C.hand[i] = cardDraw(F); if (BT && BT.phase === 'fight') FX.p({ type: 'card', card: C.hand[i], x: F.x, y: F.y - 210 * F.s, vy: -1, life: 22, size: 22, rot: 0, add: false }); } }
    if (!C.hand[C.sel]) { const n = C.hand.findIndex(Boolean); if (n >= 0) C.sel = n; }
    if (F.shieldT > 0) F.shieldT--;
  },
  refundCard(F) { const C = F.cards, L = F.lastCard; if (!L || C.hand[L.slot]) return; C.hand[L.slot] = L.id; C.refill[L.slot] = 0; C.discard.pop(); C.sel = L.slot; },
  tryCustom(F, inp, air, minLvl) {
    const C = F.cards;
    if (inp.p('sp1') && inp.p('sp2')) return false;
    if (inp.p('sp2') && inp.buf.sp2 <= 8 && !inp.motion('dd', 22) && !inp.motion('qcf')) {
      inp.use('sp2');
      for (let k = 1; k <= 3; k++) { const j = (C.sel + k) % 3; if (C.hand[j]) { C.sel = j; break; } }
      F.performed.add('sp2'); Sound.play('menuMove');
      if (C.hand[C.sel]) FX.p({ type: 'card', card: C.hand[C.sel], x: F.x, y: F.y - 232 * F.s, vy: -0.6, life: 14, size: 30, rot: 0, add: false });
      return false;
    }
    if (inp.p('sp1') && inp.buf.sp1 <= 8 && !inp.motion('qcf') && !inp.motion('qcb')) {
      const id = C.hand[C.sel];
      if (!id) { if (inp.buf.sp1 === 8) FX.wtext(F.x, F.y - 215 * F.s, 'NO CARD', { size: 16, color: '#9aa', life: 24 }); return false; }
      const k = 'card_' + id;
      if (F.canUse(k, air, minLvl)) { inp.use('sp1'); inp.clearMotion(); cardConsume(F, C.sel); F.startMove(k); return true; }
    }
    return false;
  },
  drawExtra(g, F) {
    if (F.shieldT > 0) {
      const x = F.x + F.facing * 58 * F.s, a = Math.min(1, F.shieldT / 20) * (0.6 + 0.15 * Math.sin(F.T * 0.4));
      g.save(); g.globalAlpha = a; for (let i = 0; i < 3; i++) drawCard(g, x + F.facing * i * 3, F.y - 40 - i * 56, 40, 56, 'shield', { glow: 14 }); g.restore();
    }
    const C = F.cards; if (!C || F.hidden || F.ko) return;
    const id = C.hand[C.sel];
    if (id && BT && BT.phase === 'fight' && F.state !== 'cine') { g.save(); g.globalAlpha = 0.85; drawCard(g, F.x, F.y - 236 * F.s + Math.sin(F.T * 0.08) * 3, 18, 25, id, { glow: 8 }); g.restore(); }
  },
  drawHand(g, F, side, t) {
    const C = F.cards; if (!C) return;
    const cw = 44, ch = 60, gap = 8, y0 = 566;
    for (let i = 0; i < 3; i++) {
      const x = side > 0 ? 40 + i * (cw + gap) : W - 40 - cw - i * (cw + gap), id = C.hand[i], sel = C.sel === i, y = y0 - (sel ? 8 : 0);
      if (id) drawCard(g, x + cw / 2, y + ch / 2, cw, ch, id, { glow: sel ? 18 : 0 });
      else {
        g.fillStyle = 'rgba(10,6,20,0.85)'; g.fillRect(x, y, cw, ch);
        const k = clamp(1 - C.refill[i] / C.refillMax[i], 0, 1); g.fillStyle = 'rgba(255,79,216,0.35)'; g.fillRect(x, y + ch * (1 - k), cw, ch * k);
        g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 1; g.strokeRect(x, y, cw, ch);
        g.font = `800 9px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#cfc4ee'; g.fillText('DRAW', x + cw / 2, y + ch / 2);
      }
      if (sel) { g.strokeStyle = '#ffffff'; g.lineWidth = 2.5; g.strokeRect(x - 2, y - 2, cw + 4, ch + 4); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x + cw / 2 - 6, y + ch + 6); g.lineTo(x + cw / 2 + 6, y + ch + 6); g.lineTo(x + cw / 2, y + ch + 1); g.fill(); }
    }
    const nx = side > 0 ? 40 + 3 * (cw + gap) + 4 : W - 40 - 3 * (cw + gap) - 4 - 30, nid = C.deck[0];
    g.font = `900 10px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#ffd84a'; g.fillText('NEXT', nx + 15, y0 + 4);
    drawCard(g, nx + 15, y0 + 34, 30, 42, nid || 'back', {});
    const badges = [['sp1f', '↓→S1 STORM'], ['counter', '↓←S1 WILD'], ['sp2f', '↓→S2 SUMMON'], ['sp2d', '↓↓S2 SHUFFLE']];
    badges.forEach(([k, lab], i) => {
      const m = F.ch.moves[k], ready = !(F.cd[k] > 0) && (!m.req || m.req(F)), bw = 70, bx = side > 0 ? 40 + i * (bw + 4) : W - 40 - bw - i * (bw + 4), by = 640;
      g.fillStyle = ready ? 'rgba(40,14,60,0.9)' : 'rgba(10,6,16,0.9)'; g.fillRect(bx, by, bw, 18);
      g.strokeStyle = ready ? '#ff4fd8' : 'rgba(255,255,255,0.15)'; g.lineWidth = 1.2; g.strokeRect(bx, by, bw, 18);
      g.font = `800 9px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = ready ? '#ffffff' : '#666'; g.fillText(lab, bx + bw / 2, by + 9.5);
    });
  },
  moves: Object.assign(baseNormals({ dmg: 0.8 }), {
    sp1: { name: 'PLAY CARD', jp: 'カード発動', desc: 'Plays the highlighted card from your hand.', special: 1, lvl: 4, virtual: 1, st: 1, act: 0, rec: 0 },
    sp2: { name: 'CYCLE CARD', jp: '選択', desc: 'Moves the highlight to the next card in your hand (instant).', special: 1, lvl: 4, virtual: 1, st: 0, act: 0, rec: 0 },
    sp1f: {
      name: 'CARD STORM', jp: '札嵐', desc: 'Throws five cards from his coat in rapid succession. Doesn’t use your hand.', special: 1, lvl: 4, poses: ['throwC_w', 'throwC'], st: 10, act: 1, rec: 22, cd: 110, sfx: 'kunai',
      tick(F, f) { if (f >= 10 && f <= 22 && (f - 10) % 3 === 0) { spawnBlade(F, { dmg: 15, hs: 15, kb: 2, w: 30, vy: (F.onGround ? 0 : 7) + rand(-1.2, 1.2), card: CARD_IDS[(f >> 1) % 8], srcKey: 'sp1f' }); Sound.play('kunai'); } },
    },
    counter: {
      name: 'WILD CARD', jp: '切り札', desc: 'Spends your whole hand (2+ cards). Effect depends on the mix: 3 categories = Royal Flush beam, 2 creatures = Stampede, 2 attacks = Arsenal, 2 traps = Lockdown, 2 supports = Fortress.', special: 1, lvl: 4,
      poses: ['summon', 'summon'], st: 16, act: 1, rec: 34, cd: 60, sfx: 'energy', req: F => F.cards.hand.filter(Boolean).length >= 2,
      onStart(F) {
        const C = F.cards, ids = C.hand.filter(Boolean); F.wild = wildType(ids);
        ids.forEach((id, i) => FX.p({ type: 'card', card: id, x: F.x + (i - 1) * 40, y: F.y - 200, vx: (i - 1) * 2, vy: -2, life: 30, size: 40, rot: 0, vr: 0.2, add: false }));
        for (let i = 0; i < 3; i++) if (C.hand[i]) { C.discard.push(C.hand[i]); C.hand[i] = null; C.refillMax[i] = C.refill[i] = 110 + i * 20; }
        FX.announce(F.wild, { sub: '切り札', size: 56, life: 50, y: 190, color: '#fff2a8', glow: '#ff4fd8' });
      },
      spawn: { f: 16, fn(F, O) { WILD[F.wild](F, O); } },
    },
    sp2f: {
      name: "SUMMONER'S COMMAND", jp: '召喚命令', desc: 'Plays every creature card in your hand at once with +15% power.', special: 1, lvl: 4, poses: ['summon', 'summon'], st: 12, act: 1, rec: 22, cd: 90, sfx: 'charge',
      req: F => F.cards.hand.some(id => id && CARD_DEFS[id].cat === 'CREATURE'),
      onStart(F) { const C = F.cards; F.cmd = []; for (let i = 0; i < 3; i++) if (C.hand[i] && CARD_DEFS[C.hand[i]].cat === 'CREATURE') { F.cmd.push(C.hand[i]); cardConsume(F, i); } },
      spawn: { f: 12, fn(F) { for (const id of F.cmd) { if (id === 'beast') spawnBeast(F, 10, 1.15); if (id === 'dragon') spawnDragon(F, 1.15); } } },
    },
    sp2d: {
      name: 'DECK SHUFFLE', jp: '再配', desc: 'Returns your hand to the deck, shuffles and draws 3 fresh cards instantly.', special: 1, lvl: 4, poses: ['summon', 'stance'], st: 6, act: 1, rec: 12, cd: 200, sfx: 'whoosh',
      onStart(F) {
        const C = F.cards; C.deck = shuffleArr(CARD_IDS.slice()); C.discard = []; C.sel = 0;
        for (let i = 0; i < 3; i++) { C.hand[i] = C.deck.shift(); C.refill[i] = 0; }
        for (let i = 0; i < 14; i++) FX.p({ type: 'card', card: 'back', x: F.x, y: F.y - 130, vx: rand(-6, 6), vy: -rand(2, 7), grav: 0.3, life: 30, size: 24, rot: rand(0, 6), vr: rand(-0.3, 0.3), add: false });
        FX.wtext(F.x, F.y - 240, 'SHUFFLE!', { size: 28, color: '#fff', stroke: '#ff4fd8', life: 30 });
      },
    },
    ult: {
      name: 'THE FINAL COLLECTION', jp: '最終蒐集', desc: 'Ultimate. Throws a legendary card; on hit it opens a portal that unleashes every legend in his collection.', ult: 1, lvl: 6, cost: 100,
      poses: ['present', 'throwC'], st: 12, act: 1, rec: 34, invuln: [0, 14],
      spawn: { f: 12, fn(F) { cardProj(F, { kind: 'rare', card: 'rare', x: F.x + F.facing * 50, y: F.y - 130, vx: F.facing * 20, w: 60, h: 60, dmg: 40, hs: 40, bs: 20, kb: 4, life: 80, str: 9, clash: 1, ult: 1, projOnHit: 1, onHit(A, D) { BT.startCine(A, D, CINE.cardmaster, { zoom: 1.15 }); return true; } }); Sound.play('energy'); } },
    },
    card_blade: { name: 'BLADE CARD', jp: '刃札', card: 'blade', special: 1, cardMove: 1, lvl: 4, air: 'both', poses: ['throwC_w', 'throwC'], st: 7, act: 1, rec: 14, sfx: 'kunai', spawn: { f: 7, fn(F) { spawnBlade(F); } } },
    card_meteor: { name: 'METEOR CARD', jp: '隕石札', card: 'meteor', special: 1, cardMove: 1, lvl: 4, poses: ['summon', 'summon'], st: 16, act: 1, rec: 20, sfx: 'charge',
      spawn: { f: 16, fn(F, O) { const gv = BT.projs.find(p => p.owner === F && p.kind === 'gravity' && !p.dead); spawnMeteor(F, gv ? gv.x : clamp(O.x, F.x - 700, F.x + 700)); } } },
    card_beast: { name: 'SHADOW BEAST', jp: '影獣', card: 'beast', special: 1, cardMove: 1, lvl: 4, poses: ['summon', 'throwC'], st: 12, act: 1, rec: 18, sfx: 'teleport', spawn: { f: 12, fn(F) { spawnBeast(F); } } },
    card_dragon: { name: 'DRAGON CARD', jp: '竜札', card: 'dragon', special: 1, cardMove: 1, lvl: 4, poses: ['summon', 'summon'], st: 18, act: 1, rec: 24, sfx: 'charge', spawn: { f: 18, fn(F) { spawnDragon(F); } } },
    card_mirror: { name: 'MIRROR TRAP', jp: '鏡罠', card: 'mirror', special: 1, cardMove: 1, lvl: 4, poses: ['throwC_w', 'throwC'], st: 10, act: 1, rec: 12, sfx: 'perfect', spawn: { f: 10, fn(F) { spawnMirror(F, F.x + F.facing * 170); } } },
    card_gravity: { name: 'GRAVITY CARD', jp: '重力札', card: 'gravity', special: 1, cardMove: 1, lvl: 4, poses: ['summon', 'summon'], st: 14, act: 1, rec: 18, sfx: 'energy', spawn: { f: 14, fn(F, O) { spawnGravity(F, clamp(O.x, F.x - 600, F.x + 600)); } } },
    card_shield: { name: 'SHIELD CARD', jp: '盾札', card: 'shield', special: 1, cardMove: 1, lvl: 4, poses: ['summon', 'counterCM'], st: 4, act: 1, rec: 8, sfx: 'perfect', onStart(F) { F.shieldT = 200; F.shieldHP = 2; } },
    card_reversal: { name: 'REVERSAL CARD', jp: '反転札', card: 'reversal', special: 1, lvl: 4, counter: 1, reflect: 1, poses: ['counterCM', 'counterCM'], st: 2, act: 26, rec: 16, sfx: 'counter',
      onCounter(F, A, proj) {
        if (proj) { proj.owner = F; proj.vx = -proj.vx * 1.3; proj.vy = -proj.vy; proj.hitT = 0; proj.life = Math.max(proj.life, 80); FX.ring(F.x + F.facing * 40, F.y - 110, '#3aff9a', 20, 120, 16, 5); F.mf = F.move.st + F.move.act; }
        else { F.x = clamp(A.x - A.facing * 75, 60, STAGE_W - 60); F.facing = A.x > F.x ? 1 : -1; F.afterimage = 10; Sound.play('teleport'); F.startMove('reversalStrike', true); }
      } },
    reversalStrike: { name: 'REVERSAL STRIKE', jp: '反転斬', lvl: 5, poses: ['throwC_w', 'cardStrike'], st: 3, act: 5, rec: 20, dmg: 75, hs: 30, kb: 3, launch: -14, kd: 1, hb: { x: -5, y: -205, w: 112, h: 185 }, invuln: [0, 10], str: 3, sw: { cx: -10, cy: -130, r: 100, a0: -1.8, a1: 0.6, color: '#3aff9a' } },
  }),
};
(() => {
  const M = CARDMASTER.moves;
  Object.assign(M.L, { name: 'Card Flick', poses: ['jab_w', { base: 'jab', cs: 1, cf: 0 }] });
  Object.assign(M.M, { name: 'Coat Kick' });
  Object.assign(M.H, { name: 'CARD STRIKE', poses: ['cardStrike_w', 'cardStrike'], dmg: 80, hb: { x: 15, y: -205, w: 120, h: 145 }, sw: { cx: -10, cy: -135, r: 112, a0: -1.9, a1: 0.6, color: '#ff4fd8' } });
  Object.assign(M.LH, { name: 'Ace Upper', poses: ['upper_w', { base: 'upper', cs: 1.6, cf: 0 }] });
  Object.assign(M.cM, { name: 'Low Card Swipe', poses: ['crouch', { base: 'cjab', fa1: 1.5, fa2: 1.6, cs: 1, cf: 0 }], hb: { x: 15, y: -46, w: 98, h: 36 } });
  Object.assign(M.jH, { name: 'Card Dive', poses: ['jheavy_w', { base: 'jheavy', cs: 1.6, cf: 0 }] });
})();
CARDMASTER.extraList = [
  ['card_blade', 'Blade Card', 'SP1 (in hand)'], ['card_meteor', 'Meteor Card', 'SP1 (in hand)'], ['card_beast', 'Shadow Beast', 'SP1 (in hand)'], ['card_dragon', 'Dragon Card', 'SP1 (in hand)'],
  ['card_mirror', 'Mirror Trap', 'SP1 (in hand)'], ['card_gravity', 'Gravity Card', 'SP1 (in hand)'], ['card_shield', 'Shield Card', 'SP1 (in hand)'], ['card_reversal', 'Reversal Card', 'SP1 (in hand)'],
  ['reversalStrike', 'Reversal Strike (launch)', 'Reversal counters melee'],
];
CARDMASTER.combos = [
  { name: 'Blade Rush', notation: 'L → M → SP1 (Blade Card) → SP1 (Shadow Beast, card chain)', seq: ['L', 'M', 'card_blade', 'card_beast'], hand: ['blade', 'beast', 'meteor'] },
  { name: 'Gravity Meteor', notation: 'SP1 (Gravity Card) → SP1 (Meteor Card lands in the gravity well)', seq: ['card_meteor'], pre: ['card_gravity'], hand: ['gravity', 'meteor', 'blade'] },
  { name: 'Dragon Storm', notation: 'L+H (Ace Upper) → SP1 (Dragon Card) → ↓→SP1 (Card Storm)', seq: ['LH', 'card_dragon', 'sp1f'], hand: ['dragon', 'blade', 'shield'] },
  { name: 'Summoner', notation: '↓→SP2 (Summoner’s Command with Beast + Dragon) — creatures hit together', seq: ['sp2f', 'sp2f'], hand: ['beast', 'dragon', 'mirror'] },
];

CHARS.push(CARDMASTER);
CHARS.forEach(finalizeMoves);
