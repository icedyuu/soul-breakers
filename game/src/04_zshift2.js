// ===================== THE BEAST SHIFTER — PART 2: NUE, FORMS, SYSTEM =====================
// NUE carries five beasts. SP2 transforms into a RANDOM beast drawn from a fair 5-beast bag:
// every beast appears once per cycle, never twice in a row; the remaining pool is always shown on the HUD.
// Each form is a full character object (own moves, movement, hurtbox, defence, art) swapped onto the fighter.
const BEAST_IDS = ['drake', 'wolf', 'serpent', 'stag', 'raven'];
const TF_DUR = 600, TF_CD = 540, TF_START = 240, TF_EXT_MAX = 150;
const BEAST_INFO = {
  drake: { name: 'THE DRAKE', jp: '焔竜', col: '#ff6a1a', arch: 'HEAVY HITTER', stats: 'Speed ★☆☆ · Power ★★★ · Range ★★☆', sound: 'roar',
    def: 'DRAGON SCALES — takes 20% less damage. Horn Ram and Claw Devastation absorb one hit (armor).', route: 'L+H → SP1 Claw Devastation → SP2 Infernal Crash' },
  wolf: { name: 'PHANTOM WOLF', jp: '幻狼', col: '#8f7bff', arch: 'RUSHDOWN', stats: 'Speed ★★★ · Power ★☆☆ · Range ★☆☆', sound: 'howl',
    def: 'PHANTOM BODY — dashes and backdashes are fully invulnerable. Double jump, juggle limit 8.', route: '↓→SP1 Phantom Dash → SP1 Lunar Claws → SP2 Ghost Hunt' },
  serpent: { name: 'ABYSSAL SERPENT', jp: '深淵蛇', col: '#3ad8ff', arch: 'ZONER', stats: 'Speed ★☆☆ · Power ★★☆ · Range ★★★', sound: 'hiss',
    def: 'COIL GUARD — blocking takes no chip damage, recovers faster and shoves the attacker away.', route: 'SP2 Abyssal Coil → SP1 Void Fang → ↓→SP1 Tidal Surge' },
  stag: { name: 'CELESTIAL STAG', jp: '天鹿', col: '#ffd84a', arch: 'COUNTER FIGHTER', stats: 'Speed ★★☆ · Power ★★☆ · Range ★★☆', sound: 'chime',
    def: 'SACRED PARRY — tap BLOCK just before a hit: no blockstun and the attacker staggers. Long invulnerable backdash.', route: 'SP2 Divine Reflection (counter) → SP1 Sacred Antlers → ↓→SP1 Celestial Barrier' },
  raven: { name: 'NIGHTMARE RAVEN', jp: '夢魔鴉', col: '#c44aff', arch: 'AERIAL', stats: 'Speed ★★☆ · Power ★★☆ · Range ★★☆', sound: 'caw',
    def: 'FEATHER VEIL — press BLOCK in the air for an invulnerable air dash. Hold ↑ to glide. Double jump.', route: 'L+H (↑) → air SP1 Raven Dive → ↓→SP1 Feather Storm' },
};

// ---------------------------------- transformation core ----------------------------------
function beastBagDraw(F) {
  const B = F.beast;
  if (!B.bag.length) {
    B.bag = shuffleArr(BEAST_IDS.slice()); B.used = [];
    if (B.bag[0] === B.last) { const j = 1 + Math.floor(Math.random() * (B.bag.length - 1)); [B.bag[0], B.bag[j]] = [B.bag[j], B.bag[0]]; }
  }
  const id = B.bag.shift(); B.last = id; B.used.push(id); return id;
}
function setForm(F, id) {
  const B = F.beast; B.form = id;
  F.ch = id ? BEAST_FORMS[id] : NUE;
  F.cd = {}; F.airUsed = {}; F.counterActive = false; F.airDashUsed = false;
  const key = id || 'human'; B.perf[key] = B.perf[key] || new Set(); F.performed = B.perf[key];
}
function beginTransform(F, quick) {
  const B = F.beast; B.pending = beastBagDraw(F); B.rollT = 0; B.rollMax = quick ? 6 : 20;
  Sound.play('shift'); FX.ring(F.x, GROUND, NUE.colors.accent, 10, 120, 20, 5, 0.25);
  if (!quick) { FX.flashScreen('#000000', 22, 0.35); FX.speedlines(20, W / 2, H / 2, BEAST_INFO[B.pending].col, 40); }
}
function completeTransform(F) {
  const B = F.beast, id = B.pending; if (!id || B.form) return;
  B.pending = null; setForm(F, id);
  B.t = B.max = TF_DUR + (B.bonusT || 0); B.bonusT = 0; B.ext = 0;
  const inf = BEAST_INFO[id], col = inf.col;
  FX.flashScreen(col, 10, 0.55); FX.shakeIt(12); FX.impactFrame(2);
  FX.ring(F.x, F.y - 100, '#ffffff', 20, 260, 20, 10); FX.ring(F.x, F.y - 100, col, 10, 200, 18, 8); FX.burst(F.x, F.y - 100, col, 34, 12);
  FX.announce(inf.name, { sub: inf.jp + ' · ' + inf.arch, size: 54, life: 60, y: 200, color: '#ffffff', glow: col });
  Sound.play(inf.sound); Sound.play('impactBig');
  if (BT && BT.hitstop !== undefined) BT.hitstop = Math.max(BT.hitstop, 6);
}
function nueRevert(F, voluntary) {
  const B = F.beast, id = B.form; if (!id) return;
  const col = BEAST_INFO[id].col;
  setForm(F, null); B.cdMax = TF_CD; B.cd = Math.round(TF_CD * (voluntary ? 0.75 : 1)); B.t = 0; B.hold = false;
  FX.dust(F.x, F.y - 70, 22, 'rgba(210,200,240,0.55)'); FX.ring(F.x, F.y - 90, col, 20, 170, 18, 6); FX.burst(F.x, F.y - 90, col, 20, 8);
  FX.wtext(F.x, F.y - 235 * F.s, voluntary ? 'SEAL RELEASE!' : 'SEALED', { size: 26, color: '#ffffff', stroke: col, life: 40 });
  Sound.play('teleport');
  if (F.state === 'idle' || F.state === 'walk' || F.state === 'crouch') F.toIdle();
}
function nueFeed(F, n, label = 'FRENZY') {
  const B = F.beast; if (!B || !B.form || B.ext >= TF_EXT_MAX) return;
  const add = Math.min(n, TF_EXT_MAX - B.ext); B.ext += add; B.t += add;
  FX.wtext(F.x, F.y - 250 * F.s, `${label} +${(add / 60).toFixed(1)}s`, { size: 18, color: '#ffffff', stroke: BEAST_INFO[B.form].col, life: 34 });
}

// ---------------------------------- projectiles ----------------------------------
const GHOST_POSE = {};
EXTRA_PROJ.spiritfang = {
  update(p) { if (p.t % 2 === 0) FX.p({ type: 'spark', x: p.x - Math.sign(p.vx) * 24, y: p.y + rand(-14, 14), vx: -p.vx * 0.25, vy: rand(-0.5, 0.5), life: 12, size: 2.5, color: '#7fffe0' }); },
  draw(g, p) {
    const d = Math.sign(p.vx) || 1; g.save(); g.translate(p.x, p.y); g.scale(d, 1); g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(0, 0, 4, 0, 0, 52); gr.addColorStop(0, 'rgba(220,255,245,0.9)'); gr.addColorStop(0.4, 'rgba(54,255,208,0.45)'); gr.addColorStop(1, 'rgba(54,255,208,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 52, 0, TAU); g.fill();
    g.fillStyle = 'rgba(120,255,225,0.85)'; g.beginPath(); g.moveTo(-34, -20); g.quadraticCurveTo(10, -34, 40, -6); g.lineTo(12, -2); g.lineTo(40, 8); g.quadraticCurveTo(6, 30, -34, 18); g.quadraticCurveTo(-20, 0, -34, -20); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(-14, -26); g.lineTo(-6, -44); g.lineTo(0, -24); g.fill(); g.beginPath(); g.ellipse(14, -12, 5, 2.5, -0.2, 0, TAU); g.fill();
    for (let i = 0; i < 3; i++) { g.strokeStyle = `rgba(120,255,225,${0.5 - i * 0.15})`; g.lineWidth = 3; g.beginPath(); g.moveTo(-34, -10 + i * 10); g.lineTo(-70 - i * 12 - Math.sin(p.t * 0.6 + i) * 8, -10 + i * 10); g.stroke(); }
    g.restore();
  },
};
EXTRA_PROJ.dbreath = {
  update(p) { for (let i = 0; i < 2; i++) FX.flame(p.x - p.vx * 2 + rand(-20, 20), p.y + rand(-24, 24), '#ff6a1a', 1, 16, 1.4); if (p.t % 8 === 0) Sound.play('fire'); },
  draw(g, p) {
    const d = Math.sign(p.vx) || 1; g.save(); g.translate(p.x, p.y); g.scale(d, 1); g.globalCompositeOperation = 'lighter';
    const fl = Math.sin(p.t * 0.7) * 4;
    [['#5a0d02', 66], ['#c2240c', 56], ['#ff6a1a', 44], ['#ffd27a', 30], ['#fffbe0', 16]].forEach(([col, r], i) => { g.fillStyle = col; g.globalAlpha = 0.85; g.beginPath(); g.ellipse(-i * 7 + fl * 0.3, 0, r + fl, r * 0.72, 0, 0, TAU); g.fill(); });
    g.globalAlpha = 0.6; g.fillStyle = '#ff8a2a'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(-60 - i * 16, Math.sin(p.t * 0.4 + i) * 14, 22 - i * 3, 14 - i * 2, 0, 0, TAU); g.fill(); }
    g.restore();
  },
};
EXTRA_PROJ.ghostwolf = {
  update(p) { if (p.dive && p.y >= GROUND - 40) { p.dead = true; FX.burst(p.x, GROUND - 20, '#8f7bff', 14, 6); } if (p.t % 3 === 0) FX.p({ type: 'smoke', x: p.x, y: p.y, vx: -p.vx * 0.15, vy: -0.5, life: 20, size: 14, color: 'rgba(120,100,255,0.4)', add: false, grow: 0.5 }); },
  delay(p) { if (p.delay === 1) { Sound.play('howl'); FX.ring(p.x, p.y, '#8f7bff', 10, 80, 12, 4); } },
  draw(g, p) {
    if (p.delay > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.strokeStyle = '#8f7bff'; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, 30 * (1 - p.delay / p.d0) + 6, 0, TAU); g.stroke(); g.restore(); return; }
    const W0 = BEAST_FORMS.wolf; if (!GHOST_POSE.p) GHOST_POSE.p = buildPose(W0, 'phantom');
    const d = Math.sign(p.vx) || 1, ang = p.dive ? Math.atan2(p.vy, Math.abs(p.vx) + 0.01) : 0;
    g.save(); g.globalAlpha = 0.72; g.translate(p.x, p.y + 60); g.rotate(ang * d * 0.8); g.translate(-p.x, -p.y - 60);
    g.save(); g.globalCompositeOperation = 'lighter'; drawWolf(g, W0, GHOST_POSE.p, p.x, p.y + 60, d, { mono: '#6f5cff', T: p.t, noGhost: true, scale: 0.95 }); g.restore();
    drawWolf(g, W0, GHOST_POSE.p, p.x, p.y + 60, d, { pal: { ...W0.colors, body: '#2a2060', body2: '#1a1440' }, T: p.t, noGhost: true, scale: 0.9 });
    g.restore();
  },
};
EXTRA_PROJ.voidfang = {
  update(p) { if (p.t % 2 === 0) FX.p({ type: 'spark', x: p.x, y: p.y, vx: -p.vx * 0.1, vy: rand(-1, 1), life: 10, size: 2, color: '#7ff6ff' }); },
  draw(g, p) {
    const d = Math.sign(p.vx) || 1; g.save(); g.translate(p.x, p.y); g.scale(d, 1);
    g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(-120, 0, 40, 0); gr.addColorStop(0, 'rgba(60,220,255,0)'); gr.addColorStop(1, 'rgba(160,250,255,0.7)');
    g.fillStyle = gr; g.fillRect(-120, -6, 160, 12);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#0b2440'; g.strokeStyle = '#7ff6ff'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(44, 0); g.lineTo(-10, -13); g.lineTo(-4, 0); g.lineTo(-10, 13); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#eaffff'; g.beginPath(); g.moveTo(36, 0); g.lineTo(4, -5); g.lineTo(4, 5); g.fill();
    g.restore();
  },
};
EXTRA_PROJ.tidal = {
  rect(p) { return { x: p.x - p.w / 2, y: GROUND - p.h, w: p.w, h: p.h }; },
  update(p) { if (p.t % 2 === 0) for (let i = 0; i < 3; i++) FX.p({ type: 'spark', x: p.x + rand(-40, 40), y: GROUND - rand(20, 130), vx: p.vx * 0.3 + rand(-1, 1), vy: -rand(1, 4), grav: 0.2, life: 18, size: 3, color: pick(['#bff4ff', '#3ad8ff', '#ffffff']) }); },
  draw(g, p) {
    const d = Math.sign(p.vx) || 1, h = p.h * Math.min(1, p.t / 8) * Math.min(1, p.life / 12);
    g.save(); g.translate(p.x, GROUND); g.scale(d, 1);
    const gr = g.createLinearGradient(0, -h, 0, 0); gr.addColorStop(0, 'rgba(200,250,255,0.95)'); gr.addColorStop(0.35, 'rgba(58,200,255,0.85)'); gr.addColorStop(1, 'rgba(10,40,90,0.9)');
    g.fillStyle = gr; g.strokeStyle = '#eaffff'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-140, 0); g.quadraticCurveTo(-90, -h * 0.3, -40, -h * 0.75); g.quadraticCurveTo(10, -h * 1.1 + Math.sin(p.t * 0.4) * 6, 46, -h * 0.85); g.quadraticCurveTo(30, -h * 0.6, 60, -h * 0.4); g.quadraticCurveTo(60, -h * 0.1, 70, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(-10 + i * 10 + Math.sin(p.t * 0.5 + i) * 3, -h * 0.95 + Math.abs(i - 2.5) * 5, 5, 0, TAU); g.fill(); }
    g.restore();
  },
};
EXTRA_PROJ.coil = {
  update(p) { p.y = p.y0 + Math.sin(p.t * 0.25) * 10; if (p.t % 3 === 0) FX.p({ type: 'spark', x: p.x, y: p.y, vx: -p.vx * 0.2, vy: rand(-1, 1), life: 16, size: 2.5, color: '#5af0ff' }); },
  draw(g, p) {
    const d = Math.sign(p.vx) || 1, pts = [];
    for (let i = 0; i < 12; i++) pts.push([p.x - d * i * 11, p.y + Math.sin(p.t * 0.35 - i * 0.6) * 12]);
    g.save(); g.globalCompositeOperation = 'lighter'; g.shadowColor = '#5af0ff'; g.shadowBlur = FX.hq ? 14 : 0;
    for (let i = pts.length - 1; i >= 0; i--) { g.fillStyle = i % 2 ? 'rgba(90,240,255,0.8)' : 'rgba(176,107,255,0.75)'; g.beginPath(); g.arc(pts[i][0], pts[i][1], 13 - i * 0.8, 0, TAU); g.fill(); }
    g.fillStyle = '#eaffff'; g.beginPath(); g.moveTo(pts[0][0] + d * 24, pts[0][1]); g.lineTo(pts[0][0] - d * 4, pts[0][1] - 12); g.lineTo(pts[0][0] - d * 4, pts[0][1] + 12); g.fill();
    g.restore();
  },
};
EXTRA_PROJ.bind = {
  update(p) { const D = p.target; if (!D || D.state !== 'hit') { p.dead = true; return; } p.x = D.x; p.y = D.y; },
  draw(g, p) {
    const D = p.target; if (!D) return; const k = Math.min(1, p.t / 8), a = Math.min(1, p.life / 12);
    g.save(); g.globalAlpha = a; g.lineWidth = 10; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const yy = D.y - 40 - i * 46, rx = 44 * k, ph = p.t * 0.15 + i;
      g.strokeStyle = '#0b2a44'; g.beginPath(); g.ellipse(D.x, yy, rx, 13, 0, ph, ph + Math.PI); g.stroke();
      g.strokeStyle = '#5af0ff'; g.lineWidth = 4; g.shadowColor = '#5af0ff'; g.shadowBlur = FX.hq ? 10 : 0; g.beginPath(); g.ellipse(D.x, yy, rx, 13, 0, ph, ph + Math.PI); g.stroke(); g.lineWidth = 10; g.shadowBlur = 0;
    }
    g.restore();
  },
};
EXTRA_PROJ.feather = {
  update(p) { if (p.t % 3 === 0) FX.p({ type: 'spark', x: p.x, y: p.y, vx: -p.vx * 0.1, vy: -p.vy * 0.1, life: 10, size: 2, color: '#c44aff' }); if (p.vy > 0 && p.y >= GROUND - 8) { p.dead = true; FX.burst(p.x, GROUND - 6, '#c44aff', 5, 3); } },
  draw(g, p) {
    g.save(); g.translate(p.x, p.y); g.rotate(Math.atan2(p.vy, p.vx));
    g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(196,74,255,0.35)'; g.beginPath(); g.ellipse(-10, 0, 34, 9, 0, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#120c1a'; g.strokeStyle = '#c44aff'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(22, 0); g.quadraticCurveTo(0, -9, -26, -2); g.lineTo(-30, 0); g.lineTo(-26, 2); g.quadraticCurveTo(0, 9, 22, 0); g.fill(); g.stroke();
    g.strokeStyle = '#d8b8ff'; g.lineWidth = 1; g.beginPath(); g.moveTo(22, 0); g.lineTo(-30, 0); g.stroke();
    g.restore();
  },
};
function mkGhost(F, o) { return BT.spawn(Object.assign({ owner: F, kind: 'ghostwolf', w: 90, h: 70, dmg: 30, hs: 24, bs: 12, kb: 3, life: 46, str: 2, clash: 0, color: '#8f7bff', srcKey: 'sp2' }, o, { d0: o.delay || 1 })); }

// ---------------------------------- human form: NUE ----------------------------------
const NUE = {
  id: 'nue', name: 'NUE', jp: 'ヌエ', title: 'The Beast Shifter', titleJp: '獣宿し',
  style: 'SHAPESHIFTER', desc: 'A shrine maiden with five mythical beasts sealed in her body. SP2 sets one loose — but she never knows which one. Playful, chaotic and a little too fond of her monsters.',
  stats: { power: 3, speed: 4, range: 3, defense: 2 },
  scale: 0.96, health: 1000, walk: 4.8, backWalk: 4.2, jumpV: -17, jumpX: 5, dashV: 13, juggleMax: 6,
  dims: { ...DIMS, headR: 16.5 }, build: { arm: 0.88, leg: 0.95, torso: 0.9 },
  colors: { skin: '#f6d9c8', hair: '#e9ecf8', top: '#2a2350', leg: '#1a1628', boot: '#2a2350', foot: '#14112a', uarm: '#2a2350', farm: '#ece4d6', hand: '#f6d9c8', cuff: '#36ffd0', belt: '#36ffd0', eye: '#ffc23a', accent: '#36ffd0', brow: '#b8bcd6', shirt: '#14112a', fur: '#f4efe4' },
  voicePitch: 1.3, voiceRate: 1.05, listPagesN: 7,
  stance: { t: 0.2, hd: -0.1, fa1: 0.85, fa2: 2.25, ba1: 0.5, ba2: 2.45, fl1: 0.58, fl2: 0.05, bl1: -0.45, bl2: -0.38 },
  poses: {
    intro: { t: 0.05, hd: 0.25, fa1: 2.0, fa2: 3.3, ba1: 0.45, ba2: 0.9, fl1: 0.25, fl2: 0, bl1: -0.18, bl2: -0.1 },
    victory: { t: -0.05, hd: 0.2, fa1: 2.0, fa2: 3.35, ba1: 0.4, ba2: 0.95, fl1: 0.3, fl2: 0.25, bl1: -0.2, bl2: -0.1 },
    nueWink: { t: -0.05, hd: 0.2, fa1: 2.0, fa2: 3.35, ba1: 0.4, ba2: 0.95, fl1: 0.3, fl2: 0.25, bl1: -0.2, bl2: -0.1 },
    tf_w: { t: 0.45, hd: 0.45, fa1: 0.4, fa2: 2.6, ba1: 0.3, ba2: 2.7, fl1: 1.2, fl2: -0.1, bl1: 0.4, bl2: -1.2 },
    tf: { t: -0.25, hd: -0.5, fa1: 2.3, fa2: 2.6, ba1: 2.4, ba2: 2.8, fl1: 0.4, fl2: 0.1, bl1: -0.4, bl2: -0.2 },
    ascend: { t: -0.3, hd: -0.6, fa1: 2.0, fa2: 2.2, ba1: 2.1, ba2: 2.4, fl1: 0.35, fl2: 0.1, bl1: -0.35, bl2: -0.2 },
    dodge: { t: 0.75, hd: -0.35, fa1: -0.6, fa2: -0.3, ba1: -0.9, ba2: -0.6, fl1: 1.35, fl2: 0.25, bl1: -1.0, bl2: -1.25 },
    clawSwipe_w: { t: -0.15, fa1: 2.6, fa2: 3.0, ba1: 2.2, ba2: 2.8, fl1: 0.3, bl1: -0.3 },
    clawSwipe: { t: 0.45, fa1: 1.1, fa2: 0.6, ba1: 1.3, ba2: 0.8, fl1: 0.8, fl2: 0.2, bl1: -0.6, bl2: -0.4 },
    sealRise: { base: 'upper', fl1: 1.6, fl2: 0.5, t: -0.2 },
  },
  intro: 'Five of them live in here. Wanna guess which one comes out to play?',
  wins: ['Aww, that’s it? The drake was really looking forward to you.', 'Shh, shh... they’re sleeping again. You should run while you can.', 'Next time bring a friend. They get hungry.'],
  introFx(F) { BEAST_IDS.forEach((id, i) => { for (let k = 0; k < 6; k++) FX.p({ type: 'spark', x: F.x + Math.cos(i * 1.26) * 60, y: F.y - 120 + Math.sin(i * 1.26) * 60, vx: rand(-3, 3), vy: -rand(1, 4), life: 40, size: 4, color: BEAST_INFO[id].col }); }); Sound.play('chime'); },
  ropes: [
    { id: 'hair', at: sk => [sk.head[0] - 13, sk.head[1] - 6], n: 8, seg: 11, w0: 11, w1: 3, color: 'hair', grav: 0.5, wind: 0.5 },
    { id: 'sash', at: sk => [sk.hip[0] - 12, sk.hip[1] - 6], n: 6, seg: 10, w0: 5, w1: 3, color: 'belt', grav: 0.45, wind: 0.65 },
  ],
  hairBack(g, r, c, R) { polyR(g, r, [[0.5, -0.9], [-0.2, -1.25], [-1.0, -1.05], [-1.75, -0.55], [-1.3, -0.25], [-1.95, 0.3], [-1.2, 0.38], [-1.65, 0.95], [-0.8, 0.72], [-0.9, 1.35], [-0.3, 0.8]], c.hair, R); },
  hairFront(g, r, c, R, o) {
    polyR(g, r, [[-0.6, -0.75], [-0.78, -1.85], [-0.02, -0.95]], c.hair, R); polyR(g, r, [[-0.05, -0.95], [0.28, -1.9], [0.58, -0.82]], c.hair, R);
    if (!R.mono) { g.fillStyle = '#ff9fc0'; g.beginPath(); g.moveTo(-0.55 * r, -0.9 * r); g.lineTo(-0.68 * r, -1.55 * r); g.lineTo(-0.2 * r, -1.0 * r); g.fill(); g.beginPath(); g.moveTo(0.05 * r, -1.0 * r); g.lineTo(0.27 * r, -1.6 * r); g.lineTo(0.45 * r, -0.92 * r); g.fill(); }
    polyR(g, r, [[0.35, -1.05], [1.18, -0.55], [1.06, 0.2], [0.88, -0.2], [0.72, 0.48], [0.52, -0.33], [0.3, 0.3], [0.12, -0.5], [-0.35, -1.0]], c.hair, R);
    if (R.mono) return;
    g.strokeStyle = c.accent; g.lineWidth = 0.11 * r; g.beginPath(); g.moveTo(0.2 * r, -1.0 * r); g.quadraticCurveTo(0.75 * r, -0.65 * r, 0.74 * r, 0.3 * r); g.stroke();
    const gl = o && o.glow ? 1 : 0.55;
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = c.accent; g.globalAlpha = gl; g.shadowColor = c.accent; g.shadowBlur = FX.hq ? 8 : 0; g.lineWidth = 0.07 * r;
    g.beginPath(); g.moveTo(0.42 * r, 0.32 * r); g.lineTo(0.6 * r, 0.44 * r); g.moveTo(0.38 * r, 0.44 * r); g.lineTo(0.56 * r, 0.56 * r); g.stroke(); g.restore();
  },
  neckWear(g, sk, p, c, R) {
    for (let i = 0; i < 5; i++) circ(g, sk.neck[0] - 12 + i * 5, sk.neck[1] + 4 - Math.abs(i - 2) * 2, 6, c.fur, R);
    if (!R.mono) { g.fillStyle = '#fffbea'; g.strokeStyle = OUTLINE; g.lineWidth = 1; g.beginPath(); g.moveTo(sk.neck[0] + 2, sk.neck[1] + 8); g.lineTo(sk.neck[0] + 5, sk.neck[1] + 17); g.lineTo(sk.neck[0] + 8, sk.neck[1] + 8); g.closePath(); g.fill(); g.stroke(); }
  },
  torsoDetail(g, L, bw, c, R, o) {
    g.fillStyle = c.shirt; g.beginPath(); g.moveTo(2 * bw, -L - 4); g.lineTo(14 * bw, -L - 2); g.lineTo(13 * bw, -L * 0.45); g.lineTo(3 * bw, -L * 0.45); g.closePath(); g.fill();
    g.fillStyle = c.skin; g.fillRect(-10 * bw, -L * 0.42, 22 * bw, L * 0.32);
    g.strokeStyle = c.fur; g.lineWidth = 3; g.beginPath(); g.moveTo(2 * bw, -L - 4); g.lineTo(4 * bw, -L * 0.42); g.stroke();
    const T = (o && o.T) || 0, cx = 8 * bw, cy = -L * 0.74, pul = 0.6 + 0.4 * Math.sin(T * 0.08);
    g.save(); g.globalCompositeOperation = 'lighter'; g.shadowColor = c.accent; g.shadowBlur = FX.hq ? 10 : 0; g.globalAlpha = (o && o.glow) ? 1 : pul;
    g.strokeStyle = c.accent; g.lineWidth = 1.4; g.beginPath(); g.arc(cx, cy, 6.5, 0, TAU); g.stroke();
    BEAST_IDS.forEach((id, i) => { const a = -Math.PI / 2 + i * TAU / 5; g.fillStyle = BEAST_INFO[id].col; g.beginPath(); g.arc(cx + Math.cos(a) * 6.5, cy + Math.sin(a) * 6.5, 1.7, 0, TAU); g.fill(); });
    g.restore();
  },
  torsoOver(g, L, bw, c, R) {
    if (R.mono) return;
    g.fillStyle = c.belt; g.strokeStyle = OUTLINE; g.lineWidth = 2; g.beginPath(); g.moveTo(-12 * bw, -12); g.lineTo(12 * bw, -13); g.lineTo(11 * bw, 1); g.lineTo(-12 * bw, 2); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#d62a5a'; g.beginPath(); g.arc(-8 * bw, -5, 3.4, 0, TAU); g.fill(); g.stroke();
  },
  drawSkirt(g, sk, p, c, R) {
    const hb = [sk.hip[0] - 15, sk.hip[1] - 4], kb = [sk.bk[0] - 8, lerp(sk.hip[1], sk.bk[1], 0.62)], kf = [lerp(sk.hip[0], sk.fk[0], 0.55) + 6, lerp(sk.hip[1], sk.fk[1], 0.55)], hf = [sk.hip[0] + 12, sk.hip[1] - 4];
    poly(g, [hb, kb, kf, hf], c.top, R);
    if (!R.mono) { g.strokeStyle = c.fur; g.lineWidth = 4; g.beginPath(); g.moveTo(...kb); g.lineTo(...kf); g.stroke(); }
  },
  weaponFront(g, sk, p, c, R, o) {
    if (R.mono) return;
    const E = sk.fe, Hd = sk.fh, gl = o && o.glow ? 1 : 0.5;
    glowLine(g, [lerpP(E, Hd, 0.15), addP(lerpP(E, Hd, 0.35), [3, -3]), lerpP(E, Hd, 0.55), addP(lerpP(E, Hd, 0.75), [3, -3])], `rgba(54,255,208,${gl})`, 1.6, R, 8);
    const T = (o && o.T) || 0, sw = Math.sin(T * 0.1) * 4;
    g.fillStyle = '#fff3d6'; g.strokeStyle = OUTLINE; g.lineWidth = 1; g.beginPath(); g.moveTo(Hd[0] - 3, Hd[1] - 2); g.lineTo(Hd[0] + 3, Hd[1] - 2); g.lineTo(Hd[0] + 4 + sw, Hd[1] + 20); g.lineTo(Hd[0] - 2 + sw, Hd[1] + 20); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#c8223a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(Hd[0] + sw * 0.5, Hd[1] + 3); g.lineTo(Hd[0] + 1 + sw * 0.8, Hd[1] + 16); g.stroke();
  },
  weaponBack(g, sk, p, c, R, o) { if (R.mono) return; const E = sk.be, Hd = sk.bh; glowLine(g, [lerpP(E, Hd, 0.2), addP(lerpP(E, Hd, 0.45), [3, -3]), lerpP(E, Hd, 0.7)], `rgba(54,255,208,${o && o.glow ? 0.8 : 0.35})`, 1.4, R, 6); },
};

// ---------------------------------- human moves ----------------------------------
NUE.moves = Object.assign(baseNormals({ dmg: 0.88, spd: -1 }), {
  sp1: { name: 'SPIRIT CLAW', jp: '霊爪', desc: 'Two quick swipes of beast energy.', special: 1, lvl: 4, poses: ['clawSwipe_w', 'clawSwipe'], st: 7, act: 9, rec: 16, dmg: 30, hits: 2, interval: 5, hs: 20, bs: 12, kb: 3,
    hb: { x: 15, y: -185, w: 118, h: 125 }, final: { dmg: 40, kb: 7, str: 3 }, str: 2, sfx: 'slash', sw: { cx: 10, cy: -130, r: 90, a0: -1.8, a1: 0.7, color: '#36ffd0' },
    tick(F, f) { if (f <= 10) { F.vx = F.facing * 7; F.ctrlVel = true; } } },
  sp1f: { name: 'SPIRIT FANG', jp: '霊牙', desc: 'Throws a howling beast-spirit projectile.', special: 1, lvl: 4, poses: ['cast_w', 'cast'], st: 13, act: 1, rec: 20, cd: 50, sfx: 'energy',
    spawn: { f: 13, fn(F) { BT.spawn({ owner: F, kind: 'spiritfang', x: F.x + F.facing * 70, y: F.y - 125, vx: F.facing * 11, w: 70, h: 58, dmg: 62, hs: 20, bs: 13, kb: 6, life: 120, str: 2, color: '#36ffd0' }); } } },
  counter: { name: 'SEAL RISE', jp: '封昇', desc: 'Invulnerable rising flip kick wrapped in beast energy. Anti-air.', special: 1, lvl: 4, poses: ['upper_w', 'sealRise'], st: 5, act: 8, rec: 24, dmg: 82, hs: 30, bs: 14, kb: 3, launch: -14,
    hb: { x: 5, y: -265, w: 95, h: 245 }, invuln: [0, 6], cd: 40, str: 3, sfx: 'whoosh', sw: { cx: 20, cy: -160, r: 90, a0: 1.4, a1: -1.6, color: '#36ffd0' } },
  sp2: { name: 'BEAST UNLEASH', jp: '獣化', desc: 'Transforms into a RANDOM beast for 10 s. Then the seal needs 9 s to recharge.', special: 1, lvl: 4, poses: ['tf_w', 'tf'], st: 20, act: 1, rec: 10,
    req: F => F.beast.cd <= 0 && !F.beast.form, onStart(F) { beginTransform(F, false); }, tick(F, f) { if (f === 20) completeTransform(F); } },
  tfCancel: { name: 'BEAST CANCEL', jp: '獣化キャンセル', desc: 'Transform out of an attack that hit (25% meter). The combo continues with the new beast.', special: 1, lvl: 4, poses: ['tf', 'tf'], st: 6, act: 1, rec: 4,
    onStart(F) {
      beginTransform(F, true); const O = F.opp;
      if (O.onGround) O.hitstun = Math.max(O.hitstun, 30); else O.vy = Math.min(O.vy, -5);
      BT.hitstop = Math.max(BT.hitstop, 8); FX.wtext(F.x, F.y - 250 * F.s, 'BEAST CANCEL!', { size: 30, color: '#ffffff', stroke: '#36ffd0', life: 40 });
    }, tick(F, f) { if (f === 6) completeTransform(F); } },
  sp2f: { name: 'SPIRIT STEP', jp: '霊歩', desc: 'Unique dodge: vanishes into spirit mist and slides through the opponent, fully invulnerable.', special: 1, lvl: 4, poses: ['dodge', 'dodge'], st: 3, act: 14, rec: 8, cd: 40, pass: 18, invuln: [1, 17], sfx: 'teleport',
    tick(F, f) { if (f >= 3 && f <= 16) { F.vx = F.facing * 15; F.ctrlVel = true; F.afterimage = 6; if (f % 2) FX.p({ type: 'smoke', x: F.x, y: F.y - rand(30, 150), vx: -F.facing * 2, vy: -0.5, life: 18, size: 12, color: 'rgba(54,255,208,0.35)', add: false, grow: 0.4 }); }
      if (f === 17 && (F.opp.x - F.x) * F.facing < 0) F.facing = -F.facing; } },
  ult: { name: 'PRIMAL ASCENSION', jp: '原初昇華', desc: 'Ultimate (human form). Releases all five beasts at once as a primal hybrid.', ult: 1, lvl: 6, cost: 100, poses: ['tf_w', 'ascend'], st: 12, act: 10, rec: 30, invuln: [0, 22], dmg: 40, hs: 40, kb: 2,
    hb: { x: 0, y: -210, w: 150, h: 210 }, str: 9, tick(F, f) { if (f >= 8 && f <= 20) { F.vx = F.facing * 13; F.ctrlVel = true; F.afterimage = 6; } },
    onHit(F, D) { BT.startCine(F, D, CINE.nue, { zoom: 1.18 }); return true; } },
});
(() => {
  const M = NUE.moves;
  Object.assign(M.L, { name: 'Kitten Jab' }); Object.assign(M.M, { name: 'Fox Kick' }); Object.assign(M.H, { name: 'Tiger Palm', sw: { cx: -10, cy: -140, r: 82, a0: -1.4, a1: 0.4, color: '#36ffd0' } });
  Object.assign(M.LH, { name: 'Rising Fang Kick' }); Object.assign(M.FF, { name: 'Pounce' });
})();
NUE.extraList = [['tfCancel', 'Beast Cancel (25% meter)', 'SP2 on hit']];

// ---------------------------------- shared beast poses ----------------------------------
const BEAST_POSES = {
  crouch: { bq: 0.8 }, cblock: { bq: 0.8, bh: -0.25, bp: -0.12 }, prejump: { bq: 0.6 }, land: { bq: 0.5 },
  jump: { bq: 0.2, bf: 0.4, bb: 0.6, bw: 0.7 }, fall: { bq: 0.1, bf: 0.3, bb: 0.4, bw: 0.5 }, flip: { bq: 0.4, bw: 0.9, bf: 0.6 },
  dash: { bp: 0.18, bh: 0.3, bx: 10, bq: 0.3 }, backdash: { bp: -0.15, bh: -0.3, bx: -6 },
  block: { bp: -0.12, bh: -0.35, bx: -6, bq: 0.2 },
  hit: { bp: -0.22, bh: -0.5, bj: 0.7, bx: -12 }, hit2: { bp: 0.18, bh: 0.4, bj: 0.6, bx: -8 }, chit: { bq: 0.7, bh: -0.3, bj: 0.6 },
  airhit: { bh: -0.5, bj: 0.7, bw: 0.3 }, down: { bq: 1.3, bv: 12, bh: 0.6, bj: 0.4, bw: 0, rot: 0 }, getup: { bq: 0.6 },
  raise: { bh: -0.7, bj: 0.9, bw: 1, bp: -0.2 }, kneel: { bq: 1.1, bh: 0.5 }, victory: { bh: -0.8, bj: 1, bw: 1, bp: -0.25 }, intro: { bh: -0.6, bj: 0.8, bw: 1 },
  jab_w: { bh: -0.2, bx: -4 }, jab: { bh: 0.3, bj: 0.9, bx: 14 }, kick_w: { bf: 0.6, bx: -4 }, kick: { bf: 1.5, bx: 10 },
  hook_w: { bf: 2.2, bp: -0.2, bx: -8 }, hook: { bf: 1.0, bp: 0.2, bh: 0.3, bx: 16 },
  cjab: { bq: 0.8, bh: 0.35, bj: 0.8, bx: 10 }, ckick_w: { bq: 0.8, bf: 0.4 }, ckick: { bq: 0.8, bf: 1.3, bx: 8 },
  sweep_w: { bq: 0.8, bt: -0.4 }, sweep: { bq: 0.9, bt: 0.8, bf: 1.2, bx: 6 },
  jpunch: { bh: 0.4, bj: 0.8, bw: 0.6, bx: 6 }, jkick: { bf: 1.4, bb: 0.8, bw: 0.7 }, jheavy_w: { bf: 2.2, bw: 1, bp: -0.2 }, jheavy: { bf: 0.9, bp: 0.4, bh: 0.5, bw: 0.4 },
  upper_w: { bq: 0.6, bh: 0.4 }, upper: { bh: -0.8, bp: -0.35, bf: 2.0, bv: -16, bj: 0.6 }, lunge_w: { bq: 0.5, bp: 0.2 }, lunge: { bp: 0.25, bh: 0.4, bj: 0.9, bx: 20, bf: 1.3 },
};
const hb4 = (x, y, w, h) => ({ x, y, w, h });
function nm(name, lvl, st, act, rec, dmg, hs, bs, kb, hb, poses, x = {}) { return Object.assign({ name, lvl, st, act, rec, dmg, hs, bs, kb, hb: hb4(...hb), poses, str: lvl >= 3 ? 3 : lvl }, x); }
// standard frame of normals; each beast supplies its own numbers
function beastNormals(t) {
  const P = { L: ['jab_w', 'jab'], M: ['kick_w', 'kick'], H: ['hook_w', 'hook'], cL: ['crouch', 'cjab'], cM: ['ckick_w', 'ckick'], cH: ['sweep_w', 'sweep'], jL: ['jump', 'jpunch'], jM: ['jump', 'jkick'], jH: ['jheavy_w', 'jheavy'], LH: ['upper_w', 'upper'], FF: ['lunge_w', 'lunge'] };
  const LV = { L: 1, M: 2, H: 3, cL: 1, cM: 2, cH: 3, jL: 1, jM: 2, jH: 3, LH: 3, FF: 3 };
  const EX = { cL: { crouch: 1 }, cM: { crouch: 1, type: 'low' }, cH: { crouch: 1, type: 'low', kd: 1 }, jL: { air: 1, type: 'overhead' }, jM: { air: 1, type: 'overhead' }, jH: { air: 1, type: 'overhead' }, FF: { kd: 1 } };
  const out = {};
  for (const [k, r] of Object.entries(t)) { const [name, st, act, rec, dmg, hs, bs, kb, hb, x] = r; out[k] = nm(name, LV[k], st, act, rec, dmg, hs, bs, kb, hb, P[k], { ...(EX[k] || {}), ...(x || {}) }); }
  return out;
}
function releaseMove() {
  return { name: 'SEAL RELEASE', jp: '封印解放', desc: 'Ends the transformation early with a launching shockwave. Seal cooldown −25%. Can cancel a special that hit.', special: 1, lvl: 3.5, poses: ['raise', 'raise'],
    st: 8, act: 6, rec: 16, dmg: 60, hs: 30, bs: 14, kb: 0.5, launch: -13, kd: 1, hb: hb4(-90, -235, 240, 235), str: 3, shake: 10, sfx: 'thunder',
    onHit(F, D) { D.vx = -F.facing * clamp((Math.abs(D.x - F.x) - 80) / 12, 0, 6); }, // the seal's backdraft pulls the victim in
    tick(F, f) { if (f === 8) nueRevert(F, true); if (f === 9) { FX.ring(F.x, F.y - 100, '#ffffff', 20, 220, 16, 8); FX.ring(F.x, F.y - 100, NUE.colors.accent, 10, 170, 14, 6); } } };
}
function mkForm(id, o) {
  const f = Object.create(NUE);
  Object.assign(f, { formId: id, baseCh: NUE, listPagesN: 7 }, o);
  f.poses = Object.assign({}, BEAST_POSES, o.poses || {});
  f.moves.sp2d = releaseMove();
  return f;
}
const feedHit = n => function (F) { if (F.hitCount >= (this.hits || 1)) nueFeed(F, n); };

// ---------------------------------- 1. DRAKE ----------------------------------
const DRAKE = mkForm('drake', {
  drawCustom: drawDrake, hurt: { w: 118, h: 182, ch: 150, air: 150, airTop: 175 },
  walk: 2.6, backWalk: 2.2, jumpV: -14, jumpX: 3.6, dashV: 8.5, juggleMax: 6, defMul: 0.8, grav: 1.1,
  colors: { body: '#2b1c26', body2: '#1a1118', belly: '#7a3324', horn: '#e9dcc0', claw: '#f1e6d0', accent: '#ff6a1a', eye: '#ffd23a', wing: '#5a2432', wing2: '#3a1822', skin: '#2b1c26', hair: '#2b1c26' },
  stance: { bp: 0, bh: 0, bj: 0.1, bf: 0, bb: 0, bw: 0.15, bt: 0, bq: 0, bx: 0, bv: 0 },
  poses: {
    hook_w: { bh: -0.4, bx: -12, bq: 0.3 }, hook: { bh: 0.6, bx: 28, bp: 0.25, bj: 0.4 }, upper: { bw: 1, bf: 2.1, bv: -20, bh: -0.6, bj: 0.7 },
    claw_a: { bf: 2.2, bp: -0.15, bx: 6, bh: 0.1, bj: 0.5 }, claw_b: { bf: 0.8, bp: 0.22, bx: 24, bh: 0.35, bj: 0.6 },
    breath_w: { bh: -0.5, bj: 0.3, bp: -0.15, bx: -8, bw: 0.6 }, breath: { bh: 0.15, bj: 1, bp: 0.12, bx: 10, bw: 0.8 },
    crash_up: { bv: -130, bw: 1, bf: 1.8, bp: -0.25, bh: -0.3, bj: 0.6 }, crash: { bq: 0.6, bf: 0.6, bp: 0.35, bh: 0.5, bj: 0.9, bw: 0.3 },
    victory: { bh: -0.95, bj: 1, bw: 1, bp: -0.35, bv: -10, bf: 1.6 }, hit: { bp: -0.15, bh: -0.6, bj: 0.9, bx: -8, bw: 0.6 },
  },
  wins: ['The Drake says you were crunchy. I said that’s rude.', 'Too hot to handle? Mm, that’s fair.'],
  moves: Object.assign(beastNormals({
    L: ['Fang Snap', 7, 3, 11, 46, 16, 11, 3, [70, -205, 95, 60]],
    M: ['Claw Rake', 10, 4, 15, 72, 19, 13, 4.5, [55, -165, 110, 85], { sw: { cx: 40, cy: -110, r: 90, a0: -1.6, a1: 0.9, color: '#ff6a1a' } }],
    H: ['Horn Ram', 16, 5, 22, 120, 24, 17, 10, [60, -220, 125, 125], { armor: [3, 20], armorHits: 1, shake: 7 }],
    cL: ['Low Snap', 7, 3, 11, 40, 15, 10, 2.5, [60, -115, 90, 50]],
    cM: ['Low Claw', 10, 4, 16, 62, 18, 12, 3, [50, -60, 120, 50]],
    cH: ['Tail Sweep', 14, 6, 26, 95, 30, 15, 6, [-110, -60, 285, 55]],
    jL: ['Air Bite', 6, 6, 8, 44, 16, 10, 3, [50, -160, 95, 65]],
    jM: ['Air Claw', 8, 6, 10, 64, 18, 12, 4, [30, -120, 115, 85]],
    jH: ['Meteor Stomp', 11, 6, 12, 95, 22, 15, 6, [-20, -90, 155, 90], { spike: 1 }],
    LH: ['Wing Upheaval', 12, 5, 24, 70, 30, 14, 2, [20, -255, 125, 185], { launch: -12, str: 2 }],
    FF: ['Charging Ram', 13, 7, 22, 100, 26, 14, 12, [50, -195, 115, 115], { vx: 9 }],
  }), {
    sp1: { name: 'CLAW DEVASTATION', jp: '焔爪連撃', desc: 'Three advancing claw blows. Armored on startup.', special: 1, lvl: 4, st: 13, act: 26, rec: 20, hits: 3, interval: 9, dmg: 40, hs: 22, bs: 14, kb: 3, jg: 1,
      hb: hb4(30, -205, 145, 185), final: { dmg: 58, kb: 6, launch: -11, str: 3 }, armor: [0, 13], armorHits: 1, cd: 45, str: 2, sfx: 'slash',
      poseFn: (F, f) => f <= 13 ? 'claw_a' : ((f - 13) % 18 < 9 ? 'claw_b' : 'claw_a'), poseRate: 0.55,
      tick(F, f) { if (f > 13 && f < 38) { F.vx = F.facing * 4; F.ctrlVel = true; } if (f > 13 && (f - 14) % 9 === 0 && f < 40) FX.swoosh(F, { cx: 50, cy: -130, r: 95, a0: -1.6, a1: 0.9, color: '#ff6a1a' }); } },
    sp1f: { name: 'DRAGON BREATH', jp: '竜の息吹', desc: 'A massive fireball.', special: 1, lvl: 4, poses: ['breath_w', 'breath'], st: 18, act: 1, rec: 26, cd: 80, sfx: 'fire',
      spawn: { f: 18, fn(F) { BT.spawn({ owner: F, kind: 'dbreath', x: F.x + F.facing * 110, y: F.y - 160, vx: F.facing * 10, w: 96, h: 74, dmg: 92, hs: 24, bs: 16, kb: 9, life: 95, str: 3, color: '#ff6a1a', projOnHit: 1, onHit(A) { nueFeed(A, 30); } }); FX.flashScreen('#ff6a1a', 4, 0.25); } } },
    sp2: { name: 'INFERNAL CRASH', jp: '獄炎墜', desc: 'Leaps and crashes down in an explosion. Extends the transformation on hit.', special: 1, lvl: 4, st: 13, act: 8, rec: 30, dmg: 135, hs: 30, bs: 18, kb: 6, launch: -12, kd: 1,
      hb: hb4(-85, -230, 320, 240), invuln: [4, 12], cd: 90, str: 4, shake: 14, sfx: 'whoosh',
      poseFn: (F, f) => f < 3 ? 'crouch' : f < 12 ? { base: 'crash_up', bv: -110 * Math.sin(((f - 3) / 9) * Math.PI) } : 'crash', poseRate: 0.6,
      tick(F, f) { if (f >= 3 && f < 12) { F.vx = F.facing * 6; F.ctrlVel = true; } if (f === 13) { Sound.play('explosion'); FX.shakeIt(16); FX.ring(F.x, GROUND, '#ff6a1a', 20, 260, 20, 10, 0.25); FX.rocks(F.x, GROUND, 18); for (let i = 0; i < 28; i++) FX.flame(F.x + rand(-150, 150), GROUND - rand(0, 120), '#ff6a1a', 1, 8, 3); } },
      onHit(F) { nueFeed(F, 60); } },
  }),
});
addFollowup(DRAKE, 'sp1', { btn: 'sp2', move: 'sp2', noMotion: 1 });
DRAKE.extraList = [['sp2d', 'Seal Release', '↓↓ SP2']];

// ---------------------------------- 2. PHANTOM WOLF ----------------------------------
const WOLF = mkForm('wolf', {
  drawCustom: drawWolf, hurt: { w: 104, h: 118, ch: 96, air: 110, airTop: 130 },
  walk: 6.4, backWalk: 5.2, jumpV: -15.5, jumpX: 6.4, dashV: 18, doubleJump: true, dashInv: 14, backdashInv: 18, backdashV: 11, juggleMax: 8, grav: 1.05, defMul: 1.05,
  colors: { body: '#1d1a3a', body2: '#120f26', mark: '#8f7bff', mark2: '#6ff0ff', eye: '#9ff6ff', claw: '#e8e6ff', accent: '#8f7bff', skin: '#1d1a3a', hair: '#1d1a3a' },
  stance: { bp: 0.05, bh: 0.1, bj: 0.15, bf: 0, bb: 0, bw: 0, bt: 0, bq: 0.15, bx: 0, bv: 0 },
  poses: {
    claws_a: { bf: 1.8, bp: -0.2, bv: -12, bx: 8, bj: 0.5 }, claws_b: { bf: 0.6, bp: 0.25, bx: 18, bh: 0.3, bj: 0.8 },
    phantom: { bp: 0.2, bq: 0.4, bx: 20, bh: 0.35, bj: 0.6, bf: 1.0 }, howl: { bh: -1.2, bj: 0.8, bq: 0.25, bp: -0.2 },
    victory: { bh: -1.25, bj: 0.8, bq: 0.3, bp: -0.25 }, hit: { bp: -0.3, bh: -0.6, bj: 0.8, bx: -16, bq: 0.2 }, jump: { bf: 0.9, bb: 0.9, bp: -0.1 }, fall: { bf: 0.5, bb: 0.5, bp: 0.15 },
  },
  wins: ['Too slow~! The wolf didn’t even break a sweat.', 'Ghost hunt complete. You were the ghost.'],
  moves: Object.assign(beastNormals({
    L: ['Snap', 4, 3, 8, 28, 15, 10, 2, [50, -120, 80, 50]],
    M: ['Claw Swipe', 6, 4, 11, 44, 17, 12, 3, [40, -130, 95, 80], { sw: { cx: 40, cy: -80, r: 70, a0: -1.6, a1: 0.9, color: '#8f7bff' } }],
    H: ['Pounce Bite', 10, 5, 17, 76, 22, 15, 8, [50, -135, 110, 95], { vx: 7 }],
    cL: ['Ankle Bite', 4, 3, 8, 26, 14, 10, 2, [50, -75, 80, 45]],
    cM: ['Low Rake', 6, 4, 12, 40, 17, 11, 3, [40, -48, 105, 44]],
    cH: ['Slide Sweep', 9, 8, 20, 64, 28, 14, 5, [40, -45, 110, 45], { vx: 9 }],
    jL: ['Air Snap', 4, 6, 6, 28, 15, 10, 3, [40, -105, 80, 65]],
    jM: ['Air Claws', 5, 6, 8, 42, 17, 11, 4, [30, -95, 95, 75], { ajc: 1 }],
    jH: ['Crescent Dive', 8, 6, 10, 62, 20, 13, 5, [10, -85, 110, 85], { spike: 1 }],
    LH: ['Rising Fang', 7, 4, 20, 52, 30, 14, 2, [30, -215, 90, 195], { launch: -15, jc: 1, str: 2 }],
    FF: ['Spectral Lunge', 8, 6, 16, 70, 26, 14, 9, [40, -125, 110, 95], { vx: 13 }],
  }), {
    sp1: { name: 'LUNAR CLAWS', jp: '月爪乱舞', desc: 'Five rapid crescent slashes.', special: 1, lvl: 4, st: 7, act: 22, rec: 16, hits: 5, interval: 4, dmg: 15, hs: 18, bs: 10, kb: 2, jg: 0.5,
      hb: hb4(20, -165, 125, 155), final: { dmg: 30, kb: 6, str: 3 }, cd: 30, str: 2, sfx: 'slash',
      poseFn: (F, f) => f <= 7 ? 'crouch' : ((f >> 2) % 2 ? 'claws_a' : 'claws_b'), poseRate: 0.6,
      tick(F, f) { if (f > 7 && f < 30) { F.vx = F.facing * 3; F.ctrlVel = true; if ((f - 8) % 4 === 0) { FX.swoosh(F, { cx: 50, cy: -90, r: 70, a0: f % 8 ? -1.8 : 1.2, a1: f % 8 ? 0.9 : -1.4, color: '#bfb4ff' }); Sound.play('slash'); } } } },
    sp1f: { name: 'PHANTOM DASH', jp: '幻影走', desc: 'Dashes THROUGH the opponent (invulnerable), striking on the way and turning around.', special: 1, lvl: 4, poses: ['phantom', 'phantom'], st: 5, act: 10, rec: 14, dmg: 58, hs: 32, bs: 12, kb: 1,
      hb: hb4(-70, -135, 155, 125), pass: 16, invuln: [0, 16], cd: 35, str: 2, sfx: 'teleport',
      tick(F, f) { if (f >= 5 && f <= 14) { F.vx = F.facing * 24; F.ctrlVel = true; F.afterimage = 8; } if (f === 15 && (F.opp.x - F.x) * F.facing < 0) F.facing = -F.facing; } },
    sp2: { name: 'GHOST HUNT', jp: '亡霊狩り', desc: 'Three phantom wolves strike from behind, above and in front.', special: 1, lvl: 4, poses: ['howl', 'howl'], st: 10, act: 1, rec: 22, cd: 100, sfx: 'howl',
      spawn: { f: 10, fn(F, O) { const d = F.facing;
        mkGhost(F, { x: clamp(O.x + d * 170, 30, STAGE_W - 30), y: GROUND - 60, vx: -d * 17, delay: 1 });
        mkGhost(F, { x: O.x - d * 20, y: GROUND - 300, vx: d * 2, vy: 19, delay: 6, dive: 1 });
        mkGhost(F, { x: F.x + d * 40, y: GROUND - 60, vx: d * 17, delay: 12, final: { launch: -12, kd: 1, dmg: 40, str: 3 }, projOnHit: 1, onHit(A) { nueFeed(A, 40); } }); } } },
  }),
});
addFollowup(WOLF, 'sp1f', { btn: 'sp1', move: 'sp1', noMotion: 1 });
addFollowup(WOLF, 'sp1', { btn: 'sp2', move: 'sp2', noMotion: 1 });
WOLF.extraList = [['sp2d', 'Seal Release', '↓↓ SP2']];

// ---------------------------------- 3. ABYSSAL SERPENT ----------------------------------
const SERPENT = mkForm('serpent', {
  drawCustom: drawSerpent, hurt: { w: 82, h: 210, ch: 150, air: 160, airTop: 195 },
  walk: 3.2, backWalk: 3.0, jumpV: -14.5, jumpX: 3.6, dashV: 9, juggleMax: 5,
  colors: { body: '#0f2c44', body2: '#091d2e', belly: '#3ec2c4', mark: '#5af0ff', fin: '#9d6bff', eye: '#eaffff', horn: '#d8f8ff', accent: '#3ad8ff', skin: '#0f2c44', hair: '#0f2c44' },
  stance: { bp: 0, bh: 0, bj: 0.1, bf: 0, bb: 0, bw: 0.3, bt: 0, bq: 0, bx: 0, bv: 0 },
  poses: {
    jab_w: { bh: -0.2, bj: 0.3 }, jab: { bh: 0.25, bj: 1, bx: 26 }, kick_w: { bt: -0.6 }, kick: { bt: 1.0, bx: 8, bh: -0.1 },
    hook_w: { bh: -0.5, bv: -24, bj: 0.5, bw: 1 }, hook: { bh: 1.0, bx: 40, bj: 0.8 }, sweep: { bt: 1.2, bq: 0.9, bh: 0.4 },
    upper_w: { bq: 0.7, bh: 0.6 }, upper: { bh: -0.6, bv: -60, bj: 0.9, bw: 1 },
    fang_w: { bh: -0.3, bj: 0.2 }, fang: { bh: 0.2, bj: 1, bx: 16 }, tidal_w: { bw: 1, bh: -0.4, bv: -10 }, tidal: { bh: 0.55, bj: 0.6, bq: 0.4, bw: 1 },
    coil_w: { bw: 0.6, bh: -0.2, bp: 0.3 }, coil: { bh: 0.7, bx: 30, bj: 0.9, bt: 0.6 },
    victory: { bw: 1, bv: -24, bj: 0.85, bh: -0.35 }, hit: { bh: -0.6, bj: 0.8, bx: -18, bp: 0.4 }, down: { bq: 1.6, bh: 1.2, bj: 0.4, bv: 0 },
  },
  onGuard(D, A, hd, o, perfect, dir) {
    D.setState('block'); D.guard = true; D.move = null; D.hitActive = false;
    D.blockstun = Math.round((hd.bs || 12) * (perfect ? 0.4 : 0.7));
    D.vx = dir * (hd.kb || 4) * 0.35;
    if (!o.proj && A.onGround) A.vx = -dir * Math.max(8, (hd.kb || 4) * 1.4);
    D.meter = Math.min(100, D.meter + (perfect ? 12 : 4)); A.meter = Math.min(100, A.meter + 2);
    FX.blockSpark(o.x, o.y, perfect, '#3ad8ff'); Sound.play(perfect ? 'perfect' : 'block'); BT.hitstop = Math.max(BT.hitstop, perfect ? 9 : 5);
    FX.ring(D.x + D.facing * 30, D.y - 90, '#3ad8ff', 10, 70, 10, 3); D.stats.blocks++;
    if (perfect) { D.stats.perfect++; FX.wtext(D.x, D.y - 230 * D.s, 'COIL GUARD!', { size: 28, color: '#ffffff', stroke: '#1a8ab0', life: 40 }); }
    return 'blocked';
  },
  wins: ['The abyss says hi. Don’t say hi back.', 'Coiled, crushed, collected~'],
  moves: Object.assign(beastNormals({
    L: ['Fang Flick', 6, 3, 10, 34, 15, 11, 3, [60, -215, 125, 45]],
    M: ['Tail Whip', 9, 4, 14, 56, 18, 12, 4, [40, -125, 178, 48]],
    H: ['Abyss Hammer', 15, 5, 22, 105, 24, 17, 8, [50, -285, 145, 285], { shake: 6 }],
    cL: ['Low Hiss', 6, 3, 10, 30, 14, 10, 2.5, [50, -85, 98, 45]],
    cM: ['Tail Sweep', 9, 4, 15, 50, 17, 11, 3, [40, -42, 172, 38]],
    cH: ['Coil Trip', 13, 6, 24, 80, 30, 14, 5, [30, -48, 195, 44]],
    jL: ['Air Fang', 6, 6, 8, 36, 15, 10, 3, [40, -145, 105, 65]],
    jM: ['Air Whip', 8, 6, 10, 54, 17, 11, 4, [20, -105, 155, 65]],
    jH: ['Falling Abyss', 11, 6, 12, 86, 21, 14, 6, [10, -115, 135, 115], { spike: 1 }],
    LH: ['Pillar Strike', 11, 5, 22, 64, 30, 14, 2, [10, -345, 115, 325], { launch: -15, jc: 1, str: 2 }],
    FF: ['Lunge Strike', 11, 6, 20, 84, 26, 14, 9, [50, -205, 145, 95], { vx: 8 }],
  }), {
    sp1: { name: 'VOID FANG', jp: '虚空牙', desc: 'Very fast piercing projectile (beats weaker projectiles).', special: 1, lvl: 4, poses: ['fang_w', 'fang'], st: 9, act: 1, rec: 18, cd: 30, sfx: 'kunai',
      spawn: { f: 9, fn(F) { BT.spawn({ owner: F, kind: 'voidfang', x: F.x + F.facing * 80, y: F.y - 185, vx: F.facing * 21, w: 80, h: 28, dmg: 52, hs: 32, bs: 12, kb: 4, life: 70, str: 3, color: '#7ff6ff' }); Sound.play('hiss'); } } },
    sp1f: { name: 'TIDAL SURGE', jp: '深淵津波', desc: 'A wave rolls across the whole arena and launches.', special: 1, lvl: 4, poses: ['tidal_w', 'tidal'], st: 12, act: 1, rec: 24, cd: 100, sfx: 'splash',
      spawn: { f: 12, fn(F) { BT.spawn({ owner: F, kind: 'tidal', x: F.x + F.facing * 90, y: GROUND - 65, vx: F.facing * 14, w: 100, h: 135, dmg: 72, hs: 30, bs: 14, kb: 3, launch: -11, kd: 1, life: 140, str: 3, clash: 0, color: '#3ad8ff', projOnHit: 1, onHit(A) { nueFeed(A, 40); } }); FX.shakeIt(6); } } },
    sp2: { name: 'ABYSSAL COIL', jp: '深淵の縛', desc: 'An energy serpent that binds the opponent in place (long hitstun once per combo).', special: 1, lvl: 4, poses: ['coil_w', 'coil'], st: 14, act: 1, rec: 22, cd: 150, sfx: 'hiss',
      spawn: { f: 14, fn(F) { const y = F.y - 105; BT.spawn({ owner: F, kind: 'coil', x: F.x + F.facing * 70, y, y0: y, vx: F.facing * 9, w: 74, h: 64, dmg: 30, hs: 20, bs: 12, kb: 0, life: 110, str: 2, color: '#5af0ff', projOnHit: 1,
        onHit(A, D) { if (D.comboHits <= 1 && D.onGround) { D.hitstun = Math.max(D.hitstun, 78); D.vx = 0; BT.spawn({ owner: A, kind: 'bind', target: D, x: D.x, y: D.y, harmless: true, persist: 1, life: 78, clash: 0 }); FX.wtext(D.x, D.y - 240, 'BOUND!', { size: 30, color: '#ffffff', stroke: '#1a8ab0', life: 40 }); } } }); } } },
  }),
});
addFollowup(SERPENT, 'sp1', { btn: 'sp1', motion: 'qcf', move: 'sp1f', any: 1, cond: F => F.opp.state === 'hit' });
SERPENT.extraList = [['sp2d', 'Seal Release', '↓↓ SP2']];

// ---------------------------------- 4. CELESTIAL STAG ----------------------------------
const STAG = mkForm('stag', {
  drawCustom: drawStag, hurt: { w: 100, h: 195, ch: 140, air: 150, airTop: 185 },
  walk: 4.0, backWalk: 4.6, jumpV: -17.5, jumpX: 4.8, dashV: 11, backdashV: 12.5, backdashInv: 20, juggleMax: 5, defMul: 0.95,
  colors: { body: '#f2eee2', body2: '#cfc6b0', belly: '#fffaf0', gold: '#e8c35a', antler: '#ffe9a0', mark: '#fff2a8', eye: '#ffb02e', hoof: '#5a4a30', accent: '#ffd84a', skin: '#f2eee2', hair: '#f2eee2' },
  stance: { bp: 0, bh: 0, bj: 0, bf: 0, bb: 0, bw: 0.25, bt: 0, bq: 0, bx: 0, bv: 0 },
  poses: {
    jab_w: { bh: -0.3 }, jab: { bh: 0.6, bx: 18, bw: 0.6 }, hook_w: { bh: 0.6, bq: 0.4 }, hook: { bh: -0.75, bp: -0.3, bw: 1, bx: 10 },
    sweep_w: { bq: 0.5, bp: 0.2 }, sweep: { bb: 1.2, bp: 0.3, bh: 0.35, bq: 0.4 }, upper: { bh: -0.8, bp: -0.4, bv: -26, bw: 1, bf: 1.4 },
    antlers_w: { bq: 0.6, bh: 0.6, bp: 0.15 }, antlers: { bp: -0.45, bh: -0.6, bv: -30, bw: 1, bf: 1.4 },
    barrier: { bw: 1, bh: -0.3, bp: -0.15 }, reflect: { bw: 1, bh: 0.35, bq: 0.35 }, gore: { bh: 0.8, bx: 26, bw: 1, bp: 0.15 },
    victory: { bp: -0.45, bf: 1.6, bw: 1, bh: -0.5, bv: -10 }, hit: { bp: -0.3, bh: -0.7, bj: 0.4, bx: -12, bf: 0.6 }, block: { bw: 0.8, bh: 0.2, bq: 0.2, bx: -6 },
  },
  onGuard(D, A, hd, o, perfect, dir) {
    if (!perfect || hd.ult) return null;
    D.setState('idle'); D.guard = false; D.blockstun = 0; D.invuln = Math.max(D.invuln, 4);
    if (!o.proj && A.state === 'attack' && A.onGround) { A.setState('hit'); A.hitstun = 16; A.move = null; A.hitActive = false; A.vx = -dir * 3; A.crouchHit = false; }
    D.meter = Math.min(100, D.meter + 10); D.stats.perfect++;
    FX.wtext(D.x, D.y - 240 * D.s, 'SACRED PARRY!', { size: 34, color: '#ffffff', stroke: '#c89a20', life: 45 }); FX.ring(D.x + D.facing * 40, D.y - 110, '#ffd84a', 10, 120, 14, 5);
    FX.flashScreen('#fff2a8', 5, 0.3); Sound.play('chime'); BT.hitstop = Math.max(BT.hitstop, 10);
    return 'parried';
  },
  drawExtraForm(g, F) {
    if (F.shieldT > 0) {
      const x = F.x + F.facing * 70 * F.s, a = Math.min(1, F.shieldT / 20) * (0.55 + 0.15 * Math.sin(F.T * 0.3));
      g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#ffe9a0'; g.lineWidth = 3; g.shadowColor = '#ffd84a'; g.shadowBlur = FX.hq ? 14 : 0;
      for (let i = 0; i < F.shieldHP; i++) { g.beginPath(); for (let k = 0; k < 6; k++) { const an = k * TAU / 6 + Math.PI / 6; g.lineTo(x + F.facing * i * 8 + Math.cos(an) * 34, F.y - 110 + Math.sin(an) * 100); } g.closePath(); g.stroke(); }
      g.fillStyle = 'rgba(255,240,170,0.15)'; g.fill(); g.restore();
    }
  },
  wins: ['The stars were watching. They saw everything~', 'Perfectly countered. The stag is very smug about it.'],
  moves: Object.assign(beastNormals({
    L: ['Antler Tap', 5, 3, 9, 34, 15, 11, 3, [50, -220, 95, 65]],
    M: ['Fore-hoof', 8, 4, 13, 54, 18, 12, 4, [40, -155, 98, 75]],
    H: ['Crescent Antlers', 13, 6, 20, 92, 23, 16, 9, [20, -265, 138, 155], { sw: { cx: 40, cy: -200, r: 110, a0: 1.2, a1: -1.6, color: '#ffd84a' } }],
    cL: ['Hoof Tap', 5, 3, 9, 30, 14, 10, 2.5, [40, -95, 85, 45]],
    cM: ['Low Hoof', 8, 4, 14, 48, 17, 11, 3, [40, -48, 102, 44]],
    cH: ['Hind Kick', 12, 5, 24, 80, 30, 14, 6, [40, -60, 122, 55]],
    jL: ['Air Antler', 5, 6, 7, 32, 15, 10, 3, [30, -135, 95, 65]],
    jM: ['Air Hoof', 7, 6, 9, 50, 17, 11, 4, [20, -95, 105, 75]],
    jH: ['Star Stomp', 10, 6, 11, 82, 21, 14, 6, [0, -85, 125, 95], { spike: 1 }],
    LH: ['Rising Antlers', 9, 4, 22, 60, 30, 14, 2, [10, -305, 105, 245], { launch: -15, jc: 1, str: 2 }],
    FF: ['Celestial Charge', 11, 7, 20, 84, 26, 14, 10, [50, -215, 115, 125], { vx: 10 }],
  }), {
    sp1: { name: 'SACRED ANTLERS', jp: '聖角', desc: 'Invulnerable upward antler strike. Anti-air launcher.', special: 1, lvl: 4, poses: ['antlers_w', 'antlers'], st: 6, act: 8, rec: 24, dmg: 92, hs: 32, bs: 14, kb: 2, launch: -16,
      hb: hb4(10, -325, 125, 305), invuln: [0, 9], cd: 40, str: 3, shake: 7, sfx: 'chime', sw: { cx: 30, cy: -200, r: 120, a0: 1.3, a1: -1.7, color: '#ffe9a0' } },
    sp1f: { name: 'CELESTIAL BARRIER', jp: '天鹿結界', desc: 'A golden barrier in front of you absorbs 3 hits or projectiles for 4 s.', special: 1, lvl: 4, poses: ['barrier', 'barrier'], st: 6, act: 1, rec: 12, cd: 300, sfx: 'chime',
      onStart(F) { F.shieldT = 240; F.shieldHP = 3; FX.ring(F.x + F.facing * 60, F.y - 110, '#ffd84a', 10, 120, 16, 5); } },
    sp2: { name: 'DIVINE REFLECTION', jp: '神鏡', desc: 'Counter stance: reflects projectiles; melee attackers eat a PERFECT COUNTER.', special: 1, lvl: 4, counter: 1, reflect: 1, poses: ['reflect', 'reflect'], st: 2, act: 24, rec: 18, cd: 70, sfx: 'counter',
      onCounter(F, A, proj) {
        if (proj) { proj.owner = F; proj.vx = -proj.vx * 1.4; proj.vy = -proj.vy; proj.hitT = 0; proj.life = Math.max(proj.life, 70); proj.color = '#ffd84a'; FX.ring(F.x + F.facing * 40, F.y - 110, '#ffd84a', 20, 120, 16, 5); F.mf = F.move.st + F.move.act; }
        else { F.x = clamp(F.x, 60, STAGE_W - 60); F.startMove('stagCounter', true); FX.wtext(F.x, F.y - 260 * F.s, 'PERFECT COUNTER!', { size: 34, color: '#ffffff', stroke: '#c89a20', life: 45 }); Sound.play('chime'); }
      } },
    stagCounter: { name: 'PERFECT COUNTER', jp: '天罰', lvl: 5, poses: ['reflect', 'gore'], st: 2, act: 5, rec: 14, dmg: 45, hs: 44, bs: 10, kb: 1, hb: hb4(0, -235, 135, 235), invuln: [0, 8], str: 3, shake: 8 },
  }),
});
STAG.moves.counter = STAG.moves.sp2;
addFollowup(STAG, 'stagCounter', { btn: 'sp1', move: 'sp1', noMotion: 1 });
addFollowup(STAG, 'sp1', { btn: 'sp1', motion: 'qcf', move: 'sp1f', any: 1 });
STAG.extraList = [['stagCounter', 'Perfect Counter', 'Divine Reflection vs melee'], ['sp2d', 'Seal Release', '↓↓ SP2']];

// ---------------------------------- 5. NIGHTMARE RAVEN ----------------------------------
const RAVEN = mkForm('raven', {
  drawCustom: drawRaven, hurt: { w: 92, h: 165, ch: 112, air: 125, airTop: 155 },
  walk: 4.4, backWalk: 4.0, jumpV: -18.5, jumpX: 5.2, dashV: 12, doubleJump: true, grav: 0.82, glide: 2.2, juggleMax: 8, defMul: 1.05,
  colors: { body: '#251b32', body2: '#140e1c', sheen: '#7a5cb0', beak: '#2a2430', beak2: '#4a3a50', eye: '#ff2a55', talon: '#cdbfa8', leg: '#3a3240', leg2: '#241e2a', accent: '#c44aff', skin: '#15101c', hair: '#15101c' },
  stance: { bp: 0, bh: 0, bj: 0, bf: 0, bb: 0, bw: 0.1, bt: 0, bq: 0, bx: 0, bv: 0 },
  poses: {
    jump: { bw: 1, bb: 0.6 }, fall: { bw: 0.85, bb: 0.5 }, flip: { bw: 1, bb: 0.9 },
    kick_w: { bb: 0.5 }, kick: { bb: 1.5, bp: -0.2 }, jkick: { bb: 1.6, bw: 1 }, sweep: { bw: 1, bq: 0.6, bp: 0.2 },
    hook_w: { bw: 1, bv: -6, bh: -0.3 }, hook: { bw: 0.1, bp: 0.45, bh: 0.4, bx: 12 }, upper: { bw: 1, bv: -24, bh: -0.6, bb: 0.8 },
    jheavy_w: { bw: 1, bp: -0.3 }, jheavy: { bw: 0.15, bp: 0.6, bh: 0.5 },
    dive_up: { bw: 1, bv: -10, bh: -0.3 }, dive: { bp: 0.9, bh: 0.6, bb: 1.4, bw: 0.2, bx: 10 }, storm: { bw: 1, bh: 0.2, bj: 0.6 },
    swings_a: { bw: 1, bb: 1.2, bp: -0.2 }, swings_b: { bw: 0.15, bp: 0.5, bh: 0.4, bb: 0.6 },
    victory: { bw: 1, bh: -0.7, bj: 0.9, bp: -0.2 }, hit: { bw: 0.9, bh: -0.6, bj: 0.8, bx: -14, bp: -0.3 }, airhit: { bw: 1, bh: -0.5, bj: 0.8 },
  },
  wins: ['Nevermore~ ...sorry, couldn’t resist.', 'You looked up. That was your mistake.'],
  moves: Object.assign(beastNormals({
    L: ['Beak Peck', 5, 3, 9, 32, 15, 11, 3, [50, -190, 85, 50]],
    M: ['Talon Kick', 7, 4, 12, 50, 17, 12, 4, [40, -115, 98, 75]],
    H: ['Wing Slam', 12, 5, 20, 86, 23, 16, 9, [10, -235, 135, 175]],
    cL: ['Low Peck', 5, 3, 9, 28, 14, 10, 2.5, [45, -95, 82, 45]],
    cM: ['Talon Rake', 7, 4, 13, 44, 17, 11, 3, [40, -48, 102, 44]],
    cH: ['Wing Sweep', 11, 6, 22, 74, 30, 14, 5, [-40, -55, 205, 50]],
    jL: ['Air Peck', 4, 6, 7, 32, 15, 10, 3, [40, -135, 92, 65]],
    jM: ['Raking Talons', 6, 7, 8, 48, 17, 11, 4, [20, -95, 102, 85], { ajc: 1 }],
    jH: ['Wing Crash', 9, 6, 11, 76, 21, 14, 6, [-10, -145, 145, 135], { spike: 1 }],
    LH: ['Updraft', 9, 5, 20, 56, 30, 14, 2, [0, -265, 125, 245], { launch: -15.5, jc: 1, str: 2 }],
    FF: ['Shadow Swoop', 9, 7, 18, 74, 26, 14, 9, [40, -155, 112, 105], { vx: 12 }],
  }), {
    sp1: { name: 'RAVEN DIVE', jp: '鴉墜', desc: 'Dives talons-first (from the ground it hops up first). Works in the air.', special: 1, lvl: 4, air: 'both', st: 8, act: 30, rec: 14, landRec: 10, dmg: 40, hits: 2, interval: 7, hs: 24, bs: 12, kb: 3, jg: 1,
      hb: hb4(0, -125, 115, 115), final: { dmg: 50, kd: 1, str: 3 }, cd: 30, str: 2, sfx: 'caw',
      poseFn: (F, f) => f <= 8 ? 'dive_up' : 'dive', poseRate: 0.45,
      onStart(F) { F.diveGround = F.onGround; if (F.onGround) { F.onGround = false; F.vy = -13; F.y = GROUND - 1; } else F.vy = Math.min(F.vy, -2); },
      tick(F, f) { if (f > 8) { F.vx = F.facing * 11; F.vy = 13; F.ctrlVel = true; F.afterimage = 4; } else { F.vx = F.facing * 2; F.ctrlVel = true; } } },
    sp1f: { name: 'FEATHER STORM', jp: '羽嵐', desc: 'A fan of five razor feathers (angled down in the air).', special: 1, lvl: 4, air: 'both', poses: ['storm', 'storm'], st: 10, act: 1, rec: 18, landRec: 6, cd: 50, sfx: 'whoosh',
      onStart(F) { if (!F.onGround) F.vy = Math.min(F.vy, -3); },
      spawn: { f: 10, fn(F) { const air = !F.onGround, base = air ? 0.55 : 0;
        for (let i = 0; i < 5; i++) { const an = base + (i - 2) * 0.17; BT.spawn({ owner: F, kind: 'feather', x: F.x + F.facing * 50, y: F.y - (air ? 90 : 135), vx: F.facing * Math.cos(an) * 14, vy: Math.sin(an) * 14, w: 34, h: 22, dmg: 18, hs: 16, bs: 9, kb: 2, life: 70, str: 1, color: '#c44aff', srcKey: 'sp1f' }); }
        if (air) F.vy = -4; Sound.play('caw'); } } },
    sp2: { name: 'SHADOW WINGS', jp: '影翼', desc: 'A rising flurry of wing slashes that ends in a spike. Works in the air.', special: 1, lvl: 4, air: 'both', st: 6, act: 26, rec: 14, landRec: 8, hits: 6, interval: 4, dmg: 16, hs: 18, bs: 10, kb: 2, jg: 0.5,
      hb: hb4(-20, -205, 152, 205), final: { dmg: 40, launch: -10, str: 3 }, cd: 60, str: 2, sfx: 'whoosh',
      poseFn: (F, f) => (f >> 2) % 2 ? 'swings_a' : 'swings_b', poseRate: 0.6,
      onStart(F) { if (F.onGround) { F.onGround = false; F.vy = -9; F.y = GROUND - 1; } },
      tick(F, f) { if (f > 6 && f < 32) { F.vy = -2.5; F.vx = F.facing * 3; F.ctrlVel = true; if (f % 4 === 0) FX.swoosh(F, { cx: 40, cy: -110, r: 95, a0: f % 8 ? -1.8 : 1.4, a1: f % 8 ? 1.0 : -1.4, color: '#c44aff' }); } },
      onHit(F) { if (F.hitCount >= 6) nueFeed(F, 40); } },
  }),
});
addFollowup(RAVEN, 'sp1', { btn: 'sp1', motion: 'qcf', move: 'sp1f', any: 0 });
RAVEN.extraList = [['sp2d', 'Seal Release', '↓↓ SP2']];

const BEAST_FORMS = { drake: DRAKE, wolf: WOLF, serpent: SERPENT, stag: STAG, raven: RAVEN };
