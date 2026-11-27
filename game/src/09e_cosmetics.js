// =============== COSMETICS: animated intros, victory poses, mastery titles, COLLECTION screen ===============
// Unlocked through Mastery (saved in Mastery.data.cos, so an account sync can carry them later).
// Each fighter: 3 intros (CLASSIC + 2 animated) and 3 victory poses (CLASSIC + 2 animated), a title per level.
// Sim-safe: the chosen loadout travels in battle cfg.cos; random picks use Math.random inside the sim
// (seeded during online matches); position offsets / hiding are draw-only.

const COS_UNLOCK = { i: [1, 3, 6], w: [1, 5, 8] };
const COS_KIND = { i: ['INTRO', '登場'], w: ['VICTORY POSE', '勝利'] };
const TITLE_GEN = [['ROOKIE', '新人'], ['FIGHTER', '闘士'], ['CONTENDER', '挑戦者'], ['VETERAN', '古強者'], ['ELITE', '精鋭'], ['ACE', 'エース'], ['CHAMPION', '王者'], ['MASTER', '達人'], ['GRANDMASTER', '宗師']];
const TITLE_TOP = {
  kazuma: ['LIVING INFERNO', '生ける業火'], yoru: ['THE UNSEEN', '見えざる者'], sera: ['EYE OF THE STORM', '嵐の目'], goro: ['TRUE ONI', '真の鬼'],
  frogs: ['KINGS OF THE POND', '沼の王'], conductor: ['THE LAST TRAIN', '最終列車'], cardmaster: ['THE FULL DECK', '全ての札'], nue: ['FIVEFOLD BEAST', '五獣の主'],
  saint: ['BLOOD QUEEN', '血の女王'], borgar: ['MOUNTAIN KING', '山の王'], buzzu: ['GOODEST BOY', '最高の子'], reika: ['ABSOLUTE RULER', '絶対支配者'],
  yamika: ['DARK FLAME MASTER', '黒炎の支配者'], lunaria: ['ETERNAL NIGHT', '永遠の夜'], honored: ['THE STRONGEST', '最強'], hollow: ['THE LAST REMNANT', '最後の残滓'],
  kanae: ['THORN QUEEN', '棘の女王'], tokine: ['NIGHTMARE OF TIME', '時の悪夢'], aimi: ['FOREVER YOURS', '永遠にあなたのもの'],
  hachi: ['EIGHT FEET OF DREAD', '八尺の恐怖'], kuchi: ['AM I PRETTY?', '私、きれい？'], jackpot: ['THE HOUSE ALWAYS WINS', '胴元は必ず勝つ'],
  haze: ['ZERO VISIBILITY', '視界ゼロ'], teke: ['THE LAST TRAIN', '最終電車'],
};
function masteryTitle(ch, lv) { lv = clamp(lv | 0, 1, 10); return lv >= 10 ? (TITLE_TOP[ch.id] || ['SOUL BREAKER', '魂砕き']) : TITLE_GEN[lv - 1]; }

// ---------------- effects used by the animations (positions relative to the fighter's feet) ----------------
const cX = (F, ox = 0) => F.x + F.facing * ox * F.s, cY = (F, oy = 0) => F.y - oy * F.s;
const CFX = {
  burst(F, col, n = 24, sp = 10, oy = 100, type = 'spark', ox = 0) { FX.burst(cX(F, ox), cY(F, oy), col, n, sp, type === 'spark' ? {} : { type, add: type === 'ember', size: rand(4, 8), rot: rand(0, TAU), vr: rand(-0.2, 0.2), card: type === 'card' ? CARD_IDS[randi(0, 7)] : undefined }); },
  ring(F, col, oy = 100, r1 = 170, life = 20, w = 8) { FX.ring(cX(F), cY(F, oy), col, 10, r1 * F.s, life, w); },
  dust(F, n = 14) { FX.dust(F.x, F.y, n); },
  rocks(F, n = 12) { FX.rocks(F.x, F.y, n); },
  rain(F, type, col, n = 14) {
    for (let i = 0; i < n; i++) FX.p({ type, x: F.x + rand(-200, 200) * F.s, y: F.y - rand(260, 430) * F.s, vx: rand(-0.8, 0.8), vy: rand(1.2, 2.8), grav: 0.02, drag: 1, life: rand(60, 95), size: type === 'card' ? 22 : rand(5, 9), rot: rand(0, TAU), vr: rand(-0.12, 0.12), color: col, add: type === 'spark' || type === 'ember', card: type === 'card' ? CARD_IDS[i % CARD_IDS.length] : undefined });
  },
  rise(F, type, col, n = 3, w = 55) {
    for (let i = 0; i < n; i++) FX.p({ type, x: F.x + rand(-w, w) * F.s, y: F.y - rand(0, 30), vx: rand(-0.4, 0.4), vy: -rand(2, 5), life: rand(26, 44), size: rand(3, 7), color: col, drag: 0.98, rot: rand(0, TAU), vr: rand(-0.1, 0.1), add: type === 'spark' || type === 'ember', card: type === 'card' ? CARD_IDS[randi(0, 7)] : undefined });
  },
  orbit(F, col, t, oy = 100, R = 70) { for (let i = 0; i < 3; i++) { const a = t * 0.22 + i * TAU / 3; FX.p({ type: 'ember', x: F.x + Math.cos(a) * R * F.s, y: cY(F, oy) + Math.sin(a) * R * 0.35 * F.s, life: 14, size: 4, color: col }); } },
  bolt(F, col, n = 3) { for (let i = 0; i < n; i++) FX.p({ type: 'bolt', x: F.x + rand(-40, 40), y: F.y - 640, x2: F.x + rand(-10, 10), y2: cY(F, 150), size: 4, life: 14, color: col, jag: 40 }); },
  flame(F, col, n = 4) { FX.flame(F.x + rand(-34, 34) * F.s, cY(F, rand(10, 170)), col, n, 16, 3); },
  slash(F, col, oy = 110, ox = 70) { FX.p({ type: 'slash', x: cX(F, ox), y: cY(F, oy), rot: rand(-0.8, 0.8), size: 60, life: 12, color: col, drag: 1 }); },
  text(F, txt, col, oy = 250) { FX.wtext(F.x, cY(F, oy), txt, { size: 26, color: col, life: 55 }); },
  shake(a) { FX.shakeIt(a); }, flash(col, a = 0.3) { FX.flashScreen(col, 8, a); }, snd(n) { Sound.play(n); },
  after(F, n = 14) { if ('afterimage' in F) F.afterimage = n; },
};

// ---------------- animation description ----------------
// key: [frame, pose, {r: lerp rate, dx, dy: draw offset (fighter units; dx is along facing), e: 'in'|'out' ease into this key, h: hidden, x: expression, fx(F)}]
// pose: a pose name, a pose object, or 'm:<moveKey>[:i]' for that move's pose i (default strike pose).
function cosAnim(n, jp, keys, o = {}) {
  let dx = 0, dy = 0;
  const K = keys.map(([f, p, k = {}]) => { if (k.dx !== undefined) dx = k.dx; if (k.dy !== undefined) dy = k.dy; return { f, p, r: k.r ?? 0.3, dx, dy, e: k.e, h: !!k.h, x: k.x, fx: k.fx }; });
  return { n, jp, keys: K, loop: o.loop || [], line: o.line || null, dur: Math.max(K[K.length - 1].f, ...(o.loop || []).map(l => l[1])) };
}
function cosKeyIdx(def, t) { const K = def.keys; let i = 0; while (i + 1 < K.length && K[i + 1].f <= t) i++; return i; }
function cosKey(def, t) { return def.keys[cosKeyIdx(def, t)]; }
function cosOff(def, t) {
  const K = def.keys, i = cosKeyIdx(def, t), a = K[i], b = K[i + 1];
  if (!b || (b.dx === a.dx && b.dy === a.dy)) return { dx: a.dx, dy: a.dy, h: a.h };
  let k = clamp((t - a.f) / Math.max(1, b.f - a.f), 0, 1);
  k = b.e === 'in' ? k * k : b.e === 'out' ? 1 - (1 - k) * (1 - k) : k;
  return { dx: lerp(a.dx, b.dx, k), dy: lerp(a.dy, b.dy, k), h: a.h };
}
function cosSpec(ch, p) {
  if (typeof p !== 'string') return p;
  if (p.startsWith('m:')) { const [, k, i] = p.split(':'), m = ch.moves && ch.moves[k], ps = m && m.poses; return (ps && (ps[i === undefined ? 1 : +i] || ps[0])) || 'cast'; }
  return (ch.poses && ch.poses[p]) || POSES[p] ? p : 'stance';
}
function cosFire(F, t) {   // effects for frame t of the running animation
  const d = F.cos.def;
  for (const k of d.keys) if (k.f === t && k.fx) k.fx(F, t);
  for (const [a, b, s, fn] of d.loop) if (t >= a && t <= b && (t - a) % s === 0) fn(F, t);
}
function cosTick(F) { const c = F.cos; if (!c.on || c.t > c.def.dur + 400) return; c.t++; cosFire(F, c.t); }

// ---------------- templates ----------------
// P = { c: main colour, c2: second colour, pt: particle type, snd: signature sound }
function walkSpec(ph) {
  const s1 = Math.sin(ph), c1 = Math.cos(ph), fl1 = 0.1 + 0.42 * s1, bl1 = 0.1 - 0.42 * s1;
  return { wk: s1, wc: c1, fl1, bl1, fl2: fl1 - (0.15 + 0.55 * Math.max(0, -c1)), bl2: bl1 - (0.15 + 0.55 * Math.max(0, c1)) };
}
const TPL = {
  // falls from the sky, lands, strikes, settles
  drop(P, strike, end, o = {}) {
    const big = o.big;
    return [[0, o.air || 'fall', { dy: -640, r: 0.5 }], [o.slow ? 30 : 18, o.air || 'fall', { dy: 0, e: o.slow ? 'out' : 'in', r: 0.5 }],
      [(o.slow ? 30 : 18) + 1, o.land || 'land', { r: 0.6, fx: F => { CFX.dust(F, big ? 22 : 12); CFX.shake(big ? 16 : 6); CFX.ring(F, P.c, 8, big ? 260 : 190, 18, 6); if (big) CFX.rocks(F, 14); CFX.snd(big ? 'slam' : 'land'); } }],
      [(o.slow ? 30 : 18) + 12, strike, { r: 0.5, x: 'shout', fx: F => { CFX.burst(F, P.c, 26, 11, 110, P.pt); CFX.snd(P.snd || 'whoosh'); } }],
      [(o.slow ? 30 : 18) + 36, end, { r: 0.18 }]];
  },
  // appears out of thin air
  warp(P, mid, end, o = {}) {
    return [[0, 'crouch', { h: 1 }], [12, mid || 'crouch', { h: 0, r: 0.7, fx: F => { CFX.burst(F, P.c, 30, 12, 90, P.pt); CFX.ring(F, P.c, 90, 200); CFX.after(F, 16); CFX.snd(o.snd || 'teleport'); CFX.flash(P.c, 0.22); } }],
      [30, o.mid2 || 'raise', { r: 0.35, fx: F => CFX.burst(F, P.c2 || P.c, 14, 7, 150, P.pt) }], [54, end, { r: 0.2 }]];
  },
  // walks (or dashes) in from behind, then a strike
  walk(P, strike, end, o = {}) {
    const n = o.dash ? 3 : 5, step = o.dash ? 5 : 8, K = [];
    for (let i = 0; i < n; i++) K.push([i * step, o.dash ? 'dash' : { base: o.base || 'stance', t: 0.16, ...walkSpec(i * 1.6) }, { r: o.dash ? 0.5 : 0.35, dx: (o.dash ? -460 : -300) * (1 - i / n), fx: o.dash && i === 0 ? F => { CFX.after(F, 18); CFX.snd('whoosh'); } : undefined }]);
    const T = n * step;
    K.push([T, 'stance', { dx: 0, r: 0.4, fx: o.dash ? F => CFX.dust(F, 10) : undefined }]);
    if (strike) K.push([T + 10, strike, { r: 0.5, x: 'shout', fx: F => { CFX.burst(F, P.c, 24, 10, 110, P.pt, 50); CFX.snd(P.snd || 'whoosh'); } }]);
    K.push([T + (strike ? 34 : 16), end, { r: 0.2 }]);
    return K;
  },
  // powers up from a low pose, bursts
  charge(P, low, high, end, o = {}) {
    const T = o.T || 40;
    return { keys: [[0, low || 'kneel', { r: 0.25, x: o.lowExpr, fx: () => CFX.snd(o.snd0 || 'charge') }],
      [T, high || 'raise', { r: 0.45, x: 'shout', fx: F => { CFX.ring(F, P.c, 100, 230, 22, 10); CFX.burst(F, P.c, 34, 13, 100, P.pt); CFX.flash(P.c, 0.3); CFX.shake(8); CFX.snd(o.snd || P.snd || 'energy'); } }],
      [T + 32, end, { r: 0.16 }]],
      loop: [[1, T - 1, 3, F => CFX.rise(F, P.pt, P.c, 2)], ...(o.loop || [])] };
  },
  // shadow-boxes a string of its own moves
  combo(P, list, end, o = {}) {
    const st = o.step || 9, K = list.map((p, i) => [3 + i * st, p, { r: 0.6, x: 'shout', fx: F => { CFX.slash(F, i === list.length - 1 ? P.c : '#ffffff'); CFX.snd(i === list.length - 1 ? (P.snd || 'slash') : 'whoosh'); if (i === list.length - 1) CFX.burst(F, P.c, 22, 10, 110, P.pt, 60); } }]);
    K.unshift([0, 'stance', { r: 0.4 }]);
    K.push([3 + list.length * st + 12, end, { r: 0.18 }]);
    return K;
  },
  // a sequence of the fighter's own gesture poses; list items: pose or [pose, fx, expr]
  poses(P, list, end, o = {}) {
    const st = o.step || 22, K = list.map((it, i) => { const [p, fx, x] = Array.isArray(it) ? it : [it]; return [i * st, p, { r: o.r || 0.22, fx, x }]; });
    if (end) K.push([list.length * st, end, { r: 0.18 }]);
    return K;
  },
  // jumps up in place, lands
  leap(P, end, o = {}) {
    const h = o.h || 210;
    return [[0, 'crouch', { r: 0.5 }], [8, 'jump', { dy: 0, r: 0.5, fx: F => { CFX.dust(F, 8); CFX.snd('jump'); } }], [24, o.air || 'flip', { dy: -h, e: 'out', r: 0.35, fx: F => CFX.after(F, 16) }],
      [36, 'fall', { dy: -h * 0.55, r: 0.35 }], [46, 'land', { dy: 0, e: 'in', r: 0.6, fx: F => { CFX.dust(F, 14); CFX.ring(F, P.c, 8, 200, 18, 6); CFX.snd('land'); if (o.fx) o.fx(F); } }], [60, end, { r: 0.2 }]];
  },
};
const withLoop = (keys, loop) => ({ keys, loop });
function mk(n, jp, body, o = {}) { const b = Array.isArray(body) ? { keys: body } : body; return cosAnim(n, jp, b.keys, { ...o, loop: [...(b.loop || []), ...(o.loop || [])] }); }
const ambient = (pt, col, every = 12, from = 60, to = 200, n = 4) => [from, to, every, F => CFX.rain(F, pt, col, n)];
const aura = (pt, col, every = 4, from = 50, to = 200) => [from, to, every, F => CFX.rise(F, pt, col, 1)];

// ---------------- per-fighter content ----------------
const COS = {};
function cosAdd(id, P, f) { COS[id] = f(P); }
cosAdd('kazuma', { c: '#ff5a1f', c2: '#ffd84a', pt: 'ember', snd: 'fire' }, P => ({
  i: [mk('FLAME DESCENT', '炎降臨', TPL.drop(P, 'm:sp1', 'intro', { big: true }), { line: 'Heads up! Here comes the fire!' }),
    mk('KNUCKLE WARM-UP', '拳の準備', TPL.combo(P, ['m:L', 'm:M', 'm:H', 'm:sp1'], 'intro'), { line: 'Okay, warmed up. Who is next?' })],
  w: [mk('BURNING SUMMIT', '燃える頂', TPL.charge(P, 'kneel', 'victory', 'victory', { loop: [aura('flame', '#ff7a1a', 3, 1, 70)] }), { loop: [aura('ember', '#ffd84a', 6, 72, 220)] }),
    mk('NEVER STOP TRAINING', '修行は続く', TPL.combo(P, ['m:L', 'm:L', 'm:H', 'm:sp2'], 'victory'), { line: 'Again! One more round of training!' })],
}));
cosAdd('yoru', { c: '#b45cff', c2: '#ffb0e8', pt: 'petal', snd: 'slash' }, P => ({
  i: [mk('SHADOW ENTRY', '影入り', TPL.warp(P, 'crouch', 'intro', { mid2: 'intro' }), { line: 'I was here the whole time.' }),
    mk('MOONLIT LEAP', '月夜跳び', TPL.leap(P, 'intro', { h: 260, fx: F => CFX.burst(F, '#ffb0e8', 20, 9, 60, 'petal') }), { line: 'The moon is high. Perfect.' })],
  w: [mk('PETAL VEIL', '花びらの帳', TPL.poses(P, ['intro', ['victory', F => CFX.rain(F, 'petal', '#ffb0e8', 18)]], null, { step: 30 }), { loop: [ambient('petal', '#d9a0ff', 14, 40, 220, 3)] }),
    mk('VANISH', '消失', [...TPL.combo(P, ['m:L', 'm:H'], 'victory'), [70, 'crouch', { r: 0.5, fx: F => { CFX.burst(F, P.c, 30, 10, 90, 'petal'); CFX.snd('teleport'); } }], [74, 'crouch', { h: 1 }]], { line: 'Gone. Like the wind.' })],
}));
cosAdd('sera', { c: '#3fd8ff', c2: '#ffffff', pt: 'spark', snd: 'thunder' }, P => ({
  i: [mk('STORM ARRIVAL', '嵐の到来', TPL.warp(P, 'cast', 'intro', { snd: 'thunder' }).map((k, i) => i === 1 ? [k[0], k[1], { ...k[2], fx: F => { k[2].fx(F); CFX.bolt(F, P.c, 4); } }] : k), { line: 'Did someone call for a storm?' }),
    mk('ELEMENT DANCE', '元素の舞', TPL.combo(P, ['m:sp1', 'm:sp1f', 'm:sp2', 'raise'], 'intro', { step: 12 }))],
  w: [mk('CELESTIAL CHOIR', '天の合唱', TPL.charge(P, 'cast', 'raise', 'victory', { loop: [[10, 38, 9, F => CFX.bolt(F, P.c, 1)]] }), { loop: [ambient('spark', '#bff4ff', 10, 70, 220, 3)] }),
    mk('STUDY TIME', '勉強の時間', TPL.poses(P, ['cast', 'intro', ['victory', F => CFX.ring(F, P.c, 150, 120)]], null, { step: 26 }), { line: 'Lesson one: never fight a sage in the rain.' })],
}));
cosAdd('goro', { c: '#ff3b1f', c2: '#ffb03a', pt: 'shard', snd: 'slam' }, P => ({
  i: [mk('METEOR LANDING', '隕石着地', TPL.drop(P, 'slam', 'intro', { big: true }), { line: 'GORO HAS ARRIVED!' }),
    mk('ONI ROAR', '鬼の咆哮', TPL.charge(P, 'crouch', 'victory', 'intro', { snd: 'roar', T: 36 }), { line: 'RAAAAAAGH!' })],
  w: [mk('MOUNTAIN SPLITTER', '山割り', TPL.combo(P, ['m:H:0', 'slam'], 'victory', { step: 16 }).map(k => k[1] === 'slam' ? [k[0], k[1], { ...k[2], fx: F => { k[2].fx(F); CFX.rocks(F, 18); CFX.shake(14); } }] : k)),
    mk('UNSTOPPABLE', '止められぬ', TPL.leap(P, 'victory', { h: 160, fx: F => { CFX.rocks(F, 16); CFX.shake(12); } }), { loop: [aura('ember', '#ffb03a', 8, 60, 200)] })],
}));
cosAdd('frogs', { c: '#7dff5a', c2: '#ffe95a', pt: 'spark', snd: 'croak' }, P => ({
  i: [mk('LILY PAD DROP', '蓮の葉落下', TPL.drop(P, 'fM', 'intro'), { line: 'Kero! Did somebody order frogs?' }),
    mk('FROG PILE-UP', '蛙の山', TPL.poses(P, ['crouch', ['pile', F => { CFX.burst(F, P.c, 18, 8, 150); CFX.snd('boing'); }], ['jump', F => CFX.snd('croak')], 'land'], 'intro', { step: 16, r: 0.4 }), { line: 'Ribbit! Kero! Hmph! Formation complete!' })],
  w: [mk('TRIPLE CROAK', '三重の鳴き', TPL.poses(P, [['belly', F => CFX.snd('croak')], ['bounce', F => CFX.burst(F, P.c2, 16, 8, 80)], ['victory', F => CFX.snd('croak')]], null, { step: 18, r: 0.4 })),
    mk('SWAMP PARTY', '沼パーティー', TPL.leap(P, 'victory', { h: 220, air: 'jump', fx: F => FX.p({ type: 'splat', x: F.x, y: F.y, life: 60, size: 40, color: '#4fb83a', add: false, drag: 1 }) }), { loop: [ambient('spark', '#c8ff9a', 14, 60, 200, 3)] })],
}));
cosAdd('conductor', { c: '#ff2a3a', c2: '#ffd84a', pt: 'spark', snd: 'whistle' }, P => ({
  i: [mk('LAST STOP', '終点到着', TPL.walk(P, 'whistle', 'intro', { base: 'stance' }), { line: 'Next stop: your defeat. Mind the gap.' }),
    mk('PUNCTUAL', '定刻通り', TPL.poses(P, ['watch', ['whistle', F => CFX.snd('whistle')], ['signal', F => CFX.burst(F, P.c2, 14, 7, 160)]], 'intro', { step: 24 }), { line: 'Exactly on time. As always.' })],
  w: [mk('ALL CLEAR', '出発進行', TPL.poses(P, [['signal', F => CFX.snd('whistle')], 'point', ['victory', F => CFX.ring(F, P.c2, 120, 150)]], null, { step: 24 })),
    mk('TICKET CHECK', '検札', TPL.combo(P, ['jabC', 'swingC', 'thrust'], 'watch', { step: 11 }), { line: 'Ticket punched. Have a pleasant journey home.' })],
}));
cosAdd('cardmaster', { c: '#ff4fd8', c2: '#ffd84a', pt: 'card', snd: 'energy' }, P => ({
  i: [mk('DEALER’S ENTRANCE', '配り手の登場', TPL.warp(P, 'present', 'intro', { snd: 'chime' }).map((k, i) => i === 1 ? [k[0], k[1], { ...k[2], fx: F => { k[2].fx(F); CFX.rain(F, 'card', P.c, 10); } }] : k), { line: 'The table is set. Shall we play?' }),
    mk('HIGH STAKES', '大勝負', TPL.poses(P, ['examine', 'present', ['throwUp', F => { CFX.burst(F, P.c, 10, 8, 160, 'card'); CFX.snd('whoosh'); }]], 'intro', { step: 22 }))],
  w: [mk('FULL HOUSE', 'フルハウス', TPL.poses(P, [['present', F => CFX.rain(F, 'card', P.c, 16)], 'victory'], null, { step: 34 }), { loop: [ambient('card', P.c, 18, 50, 200, 3)], line: 'A full house. You never had a chance.' }),
    mk('SHUFFLE FLOURISH', '華麗なシャッフル', TPL.combo(P, ['throwC', 'cardStrike', 'summon'], 'victory', { step: 12 }))],
}));
cosAdd('nue', { c: '#36ffd0', c2: '#ffb0f0', pt: 'spark', snd: 'chime' }, P => ({
  i: [mk('SPIRIT POUNCE', '霊獣の跳躍', TPL.leap(P, 'intro', { h: 240, air: 'ascend' }), { line: 'Pounce! Did I scare you? A little?' }),
    mk('WINK WINK', 'ウインク', TPL.poses(P, [['nueWink', F => { CFX.burst(F, P.c2, 12, 6, 190, 'petal'); CFX.snd('chime'); }, 'grin'], 'intro'], null, { step: 36 }))],
  w: [mk('BEAST PARADE', '獣の行進', TPL.charge(P, 'crouch', 'raise', 'victory', { loop: [[2, 38, 6, (F, t) => CFX.burst(F, ['#ff7a1a', '#9ad8ff', '#5affc0', '#ffe08a', '#b07aff'][(t / 6 | 0) % 5], 6, 6, 120)]] })),
    mk('WINK & WAVE', 'またね', TPL.poses(P, ['victory', ['nueWink', F => CFX.rain(F, 'petal', P.c2, 14), 'grin'], 'victory'], null, { step: 34 }), { line: 'Bye bye~ The beasts say thanks for the snack.' })],
}));
cosAdd('saint', { c: '#ff1f3d', c2: '#2a0010', pt: 'blood', snd: 'bats' }, P => ({
  i: [mk('BAT SWARM', '蝙蝠の群れ', TPL.warp(P, 'mist', 'intro', { snd: 'bats' }).map((k, i) => i === 1 ? [k[0], k[1], { ...k[2], fx: F => { k[2].fx(F); for (let j = 0; j < 14; j++) FX.p({ type: 'bat', x: F.x + rand(-60, 60), y: F.y - rand(60, 180), vx: rand(-7, 7), vy: -rand(2, 6), life: 40, size: 9, color: '#1a0008', add: false, drag: 0.98, rot: rand(0, 1) }); } }] : k), { line: 'Did you miss me, darling?' }),
    mk('BLOOD MOON', '血の月', TPL.charge(P, 'kneel', 'cross', 'intro', { snd: 'drain' }))],
  w: [mk('NOCTURNE BOW', '夜想曲の礼', TPL.poses(P, ['cross', ['bloom', F => CFX.rain(F, 'petal', '#c8102e', 16)], 'victory'], null, { step: 28 }), { loop: [ambient('petal', '#ff3a50', 15, 60, 220, 3)] }),
    mk('THE FEAST', '饗宴', TPL.poses(P, [['bite', F => { CFX.burst(F, P.c, 16, 8, 150, 'blood'); CFX.snd('drain'); }], 'conduct', 'victory'], null, { step: 30 }), { line: 'Exquisite. My compliments to the loser.' })],
}));
cosAdd('borgar', { c: '#ffa21a', c2: '#7ad8ff', pt: 'shard', snd: 'slam' }, P => ({
  i: [mk('AVALANCHE', '雪崩', TPL.drop(P, 'flex', 'intro', { big: true }), { line: 'The mountain came to you.' }),
    mk('RUNE FLEX', 'ルーンの誇示', TPL.poses(P, [['flex', F => { CFX.ring(F, P.c2, 120, 160); CFX.snd('rune'); }], ['roar', F => { CFX.shake(10); CFX.snd('roar'); }, 'shout']], 'intro', { step: 30 }))],
  w: [mk('MOUNTAIN POSE', '山の構え', TPL.poses(P, [['flex', F => CFX.ring(F, P.c2, 120, 160)], 'victory', 'flex'], null, { step: 30 }), { loop: [aura('spark', '#7ad8ff', 6, 0, 200)], line: 'Feel these runes? Earned every one.' }),
    mk('WRATH ROAR', '憤怒の咆哮', TPL.charge(P, 'crouch', 'roar', 'victory', { snd: 'roar' }))],
}));
cosAdd('buzzu', { c: '#ffb02a', c2: '#ff3a3a', pt: 'spark', snd: 'saw' }, P => ({
  i: [mk('REV UP', '空ぶかし', TPL.charge(P, 'pull', 'roar2', 'intro', { snd0: 'rev', snd: 'saw', T: 34, loop: [[2, 32, 4, F => CFX.burst(F, '#ffe08a', 4, 6, 140)]] })),
    mk('ZOOMIES', '全力ダッシュ', TPL.walk(P, 'sawW', 'intro', { dash: true }), { line: 'Vrrm vrrm! Arf!' })],
  w: [mk('HAPPY WAGS', '尻尾ふりふり', [...TPL.leap(P, 'victory', { h: 120, air: 'leap' }), ...TPL.leap(P, 'victory', { h: 150, air: 'leap' }).map(([f, p, o]) => [f + 60, p, o])], { line: 'Arf arf! (very proud of itself)' }),
    mk('FRENZY', '狂乱', TPL.combo(P, ['fz1', 'fz2', 'fz1', 'fz2', 'roar2'], 'victory', { step: 7 }))],
}));
cosAdd('reika', { c: '#c41e36', c2: '#ffd0d8', pt: 'spark', snd: 'energy' }, P => ({
  i: [mk('SOVEREIGN DESCENT', '支配者の降臨', TPL.drop(P, 'command', 'intro', { slow: true, air: 'float', land: 'float' }), { line: 'You may look at me. Briefly.' }),
    mk('COMMAND', '命令', TPL.poses(P, ['point_w', ['point', F => { CFX.ring(F, P.c, 150, 140); CFX.snd('energy'); }], 'command'], 'intro', { step: 24 }), { line: 'Kneel.' })],
  w: [mk('BOW TO ME', '跪け', TPL.poses(P, [['dominate', F => { CFX.ring(F, P.c, 40, 260, 26, 6); CFX.shake(6); }], 'victory'], null, { step: 36 })),
    mk('MARKED', '刻印', TPL.poses(P, [['mark', F => CFX.burst(F, P.c, 12, 6, 150)], 'clench', 'victory'], null, { step: 26 }), { loop: [aura('ember', P.c, 7, 60, 200)], line: 'You belong to me now.' })],
}));
cosAdd('yamika', { c: '#b04cff', c2: '#ff4fd8', pt: 'flame', snd: 'fire' }, P => ({
  i: [mk('DARK FLAME RISING', '黒炎の目覚め', TPL.charge(P, 'eyecover', 'peek', 'intro', { loop: [[2, 38, 3, F => CFX.flame(F, '#7a1aff', 2)]] }), { line: 'Stay back! My right eye... it is awakening!' }),
    mk('PHANTOM ENTRY', '幻影の登場', TPL.warp(P, 'vanish', 'intro', { mid2: 'summon' }))],
  w: [mk('FORBIDDEN RITUAL', '禁断の儀式', TPL.poses(P, ['ritual', ['sigil', F => CFX.ring(F, P.c, 10, 220, 30, 5)], 'victory'], null, { step: 28 }), { loop: [aura('ember', P.c2, 6, 0, 200)] }),
    mk('SEALED AGAIN', '再封印', TPL.poses(P, ['eyecover', 'peek', ['victory', F => CFX.burst(F, P.c, 16, 8, 180)]], null, { step: 26 }), { line: 'Phew... the seal holds. You got lucky.' })],
}));
cosAdd('lunaria', { c: '#7ff0ff', c2: '#c8b0ff', pt: 'spark', snd: 'chime' }, P => ({
  i: [mk('MOONFALL', '月落ち', TPL.drop(P, 'veil', 'intro', { slow: true, air: 'veil', land: 'veil' }), { line: 'The night descends. So do I.' }),
    mk('SKY GAZE', '天を仰ぐ', TPL.poses(P, ['skyglance', ['raise', F => { CFX.ring(F, P.c, 200, 140); CFX.snd('chime'); }]], 'intro', { step: 30 }))],
  w: [mk('ETERNAL NIGHT', '永遠の夜', TPL.charge(P, 'veil', 'raise', 'victory'), { loop: [ambient('spark', '#e0faff', 9, 60, 220, 3)] }),
    mk('DOMINION', '天の支配', TPL.poses(P, [['dominion', F => CFX.ring(F, P.c2, 40, 280, 30, 5)], 'victory'], null, { step: 36 }), { line: 'Every star bows. You should too.' })],
}));
cosAdd('honored', { c: '#5ad8ff', c2: '#ff4a6a', pt: 'spark', snd: 'zap' }, P => ({
  i: [mk('SPATIAL STEP', '空間跳躍', TPL.warp(P, 'step', 'intro'), { line: 'Relax. I am just here to stretch.' }),
    mk('ADJUSTMENT', '目隠し直し', TPL.poses(P, ['adjust', ['smile', F => CFX.burst(F, P.c, 10, 5, 190)]], 'intro', { step: 34 }), { line: 'Throughout heaven and earth...' })],
  w: [mk('INFINITY', '無限', TPL.poses(P, [['infinity', F => { CFX.ring(F, P.c, 110, 130, 30, 4); CFX.ring(F, '#ffffff', 110, 90, 30, 3); }], 'touch', 'victory'], null, { step: 30 }), { line: 'You could not even touch me.' }),
    mk('BLUE, RED, PURPLE', '蒼・赫・茈', TPL.poses(P, [['blue', F => CFX.burst(F, '#3a7aff', 18, 8, 120, 'spark', 60)], ['red', F => CFX.burst(F, '#ff2a3a', 18, 8, 120, 'spark', 60)], ['purple', F => { CFX.burst(F, '#b04cff', 30, 12, 120, 'spark', 60); CFX.flash('#b04cff', 0.25); CFX.snd('boom'); }], 'victory'], null, { step: 20, r: 0.35 }))],
}));
cosAdd('hollow', { c: '#b996ff', c2: '#2a1a4a', pt: 'spark', snd: 'psi' }, P => ({
  i: [mk('MANIFEST', '顕現', TPL.warp(P, 'manifest', 'intro', { snd: 'psi' })),
    mk('QUIET TILT', '静かな首傾げ', TPL.poses(P, ['tilt', ['point', F => { CFX.ring(F, P.c, 120, 120); CFX.snd('psi'); }]], 'intro', { step: 32 }), { line: 'Your ability... I can see its outlet.' })],
  w: [mk('SEALED', '封印完了', TPL.poses(P, [['seal', F => CFX.ring(F, P.c, 110, 150, 26, 6)], ['release', F => CFX.burst(F, P.c, 20, 9, 120)], 'victory'], null, { step: 28 }), { line: 'Sealed. It will not come back.' }),
    mk('OVERLOAD', '過負荷', TPL.charge(P, 'tilt', 'overload', 'victory', { snd: 'psi' }), { loop: [aura('spark', P.c, 6, 70, 200)] })],
}));
cosAdd('kanae', { c: '#e0283c', c2: '#ffb0c0', pt: 'petal', snd: 'slap' }, P => ({
  i: [mk('BORED ENTRANCE', '退屈な登場', TPL.walk(P, null, 'bored', { base: 'bored' }), { line: 'Ugh. You again? Fine.' }),
    mk('PROVOKE', '挑発', TPL.poses(P, ['taunt', ['grin', F => CFX.text(F, 'come on~', P.c2), 'grin']], 'intro', { step: 30 }))],
  w: [mk('NOT EVEN CLOSE', '惜しくもない', TPL.poses(P, ['look_down', 'stare', 'victory'], null, { step: 30 }), { line: 'That was it? Not even close.' }),
    mk('SPITEFUL BLOOM', '棘の開花', TPL.poses(P, [['gesture', F => CFX.rain(F, 'petal', P.c, 18)], 'victory'], null, { step: 36 }), { loop: [ambient('petal', P.c2, 14, 50, 220, 3)] })],
}));
cosAdd('tokine', { c: '#d01a34', c2: '#ffd84a', pt: 'spark', snd: 'tick' }, P => ({
  i: [mk('CLOCKWORK CURTSY', '時計仕掛けの礼', TPL.warp(P, 'curtsy', 'intro', { snd: 'rewind', mid2: 'curtsy' }), { line: 'Ara ara. Shall we dance until midnight?' }),
    mk('REWIND', '巻き戻し', TPL.poses(P, [['rewind', F => { CFX.ring(F, P.c2, 120, 170, 30, 4); CFX.snd('rewind'); }], 'glance'], 'intro', { step: 30 }))],
  w: [mk('AIM HIGH', '天を撃つ', TPL.poses(P, ['aim_up', ['aim_up', F => { CFX.burst(F, P.c2, 14, 9, 230); CFX.snd('gunshot'); }], 'victory'], null, { step: 22 })),
    mk('TIME’S UP', '時間切れ', TPL.poses(P, ['adjust', ['curtsy', F => CFX.ring(F, P.c2, 120, 180, 30, 4)], 'victory'], null, { step: 30 }), { loop: [[30, 200, 15, F => CFX.snd('tock')]], line: 'Tick, tock. Your time is up.' })],
}));
cosAdd('aimi', { c: '#ff4f8b', c2: '#ffc0d6', pt: 'spark', snd: 'heart' }, P => ({
  i: [mk('FOUND YOU', 'みつけた', TPL.warp(P, 'stare', 'intro', { snd: 'aimiVanish', mid2: 'wave' }), { line: 'Found you~ You can\'t hide from me.' }),
    mk('SAFETY OFF', '安全装置', TPL.poses(P, ['draw', ['aim', F => { CFX.ring(F, P.c, 140, 120, 18, 4); CFX.snd('cock'); }], 'hairfix'], 'intro', { step: 30 }), { line: 'Just you and me. Nobody else.' })],
  w: [mk('ALL MINE', 'ぜんぶ私の', TPL.poses(P, ['victory', ['claim', F => CFX.ring(F, P.c, 120, 160, 26, 5)], 'stare'], null, { step: 36 }), { line: 'Now you\'re all mine~' }),
    mk('LOVE LETTER', '恋文', TPL.poses(P, ['aim_up', ['aim_up', F => { CFX.burst(F, P.c2, 14, 9, 230); CFX.snd('pistol'); }], 'victory'], null, { step: 24 }), { loop: [ambient('spark', P.c, 12, 60, 220, 3)] })],
}));
cosAdd('hachi', { c: '#dfe6ff', c2: '#ffffff', pt: 'spark', snd: 'po' }, P => ({
  i: [mk('DISTANT FIGURE', '遠くの人影', TPL.warp(P, 'tilt', 'intro', { snd: 'hachiDistort', mid2: 'tilt' }), { line: '…po… po… po…' }),
    mk('THE WATCHER', '見つめる者', TPL.poses(P, ['look_down', ['look_up', F => { CFX.ring(F, P.c, 150, 160, 30, 3); CFX.snd('po'); }], 'tilt'], 'intro', { step: 40 }))],
  w: [mk('PO… PO…', 'ぽ…ぽ…', TPL.poses(P, ['victory', ['tilt', F => CFX.snd('po')], 'victory'], null, { step: 44 }), { line: '…po… po…' }),
    mk('NOWHERE TO HIDE', '逃げ場はない', TPL.poses(P, ['raise', ['reach', F => { CFX.ring(F, P.c, 140, 200, 30, 4); CFX.snd('hachiReach'); }], 'tilt'], null, { step: 36 }), { loop: [ambient('spark', P.c, 16, 60, 220, 2)] })],
}));
cosAdd('jackpot', { c: '#ffcf3a', c2: '#c8102e', pt: 'spark', snd: 'coin' }, P => ({
  i: [mk('HIGH STAKES', '大勝負', TPL.walk(P, null, 'tip_hat', {}), { line: 'Place your bets. The house is open.' }),
    mk('SHUFFLE UP', 'シャッフル', TPL.poses(P, ['fan_w', ['fan', F => { CFX.burst(F, P.c, 14, 8, 150); CFX.snd('cardFlick'); }], 'tip_hat'], 'intro', { step: 30 }), { line: 'Cut the deck. Let\'s play.' })],
  w: [mk('HOUSE WINS', '胴元の勝ち', TPL.poses(P, ['coin_flip', ['coin_catch', F => { CFX.ring(F, P.c, 120, 160, 26, 5); CFX.snd('coin'); }], 'tip_hat'], null, { step: 34 }), { line: 'The house always wins.' }),
    mk('LUCKY SEVEN', 'ラッキーセブン', TPL.poses(P, ['snap_w', ['celebrate', F => { CFX.burst(F, P.c, 18, 10, 200); CFX.snd('jackpot'); }], 'tip_hat'], null, { step: 28 }), { loop: [ambient('spark', P.c, 14, 60, 220, 2)] })],
}));
cosAdd('haze', { c: '#4ff0e0', c2: '#8a5cc8', pt: 'smoke', snd: 'exhale' }, P => ({
  i: [mk('LIGHT UP', '一服', TPL.poses(P, ['light', ['drag', F => CFX.snd('flick')], ['exhale', F => { hzExhale(F, 10, null, 1, 10); CFX.snd('exhale'); }], 'stance'], null, { step: 30 }), { line: 'Ugh. Fine. Let\'s get this over with.' }),
    mk('OUT OF THE FOG', '霧の中から', TPL.warp(P, 'glide', 'stance', { snd: 'poof', mid2: 'pocket' }), { line: '...you were waiting for me? Weird.' })],
  w: [mk('SMOKE RINGS', '煙の輪', TPL.poses(P, ['drag', ['exhale', F => { CFX.ring(F, '#c8c4d8', 190, 70, 30, 4); CFX.ring(F, '#c8c4d8', 205, 50, 36, 3); CFX.snd('exhale'); }], 'lean'], null, { step: 34 }), { line: 'Anyway...' }),
    mk('NAP TIME', '昼寝', TPL.poses(P, ['pocket', ['sitdown', F => { CFX.dust(F, 10); CFX.snd('poof'); }], 'sitdown'], null, { step: 30 }), { loop: [[40, 220, 14, F => hzExhale(F, 2, null, 0.5, 8)]] })],
}));
cosAdd('teke', { c: '#ff2a3a', c2: '#e4e2ea', pt: 'ember', snd: 'teke' }, P => ({
  i: [mk('TEKE TEKE', 'テケテケ', TPL.walk(P, 'claw', 'stance', { dash: true }), { line: 'Teke... teke... teke...' }),
    mk('LAST STOP', '終点', TPL.poses(P, ['still', ['look', F => CFX.snd('crossing')], ['turn', F => { CFX.snd('teke'); CFX.flash('#ff2a3a', 0.15); }], 'stance'], null, { step: 36 }), { line: 'Is this your stop...?' })],
  w: [mk('MY LEGS...', '私の脚…', TPL.poses(P, ['look', ['tilt', F => CFX.snd('teke')], 'tilt'], null, { step: 40 }), { line: 'Have you seen... my legs?' }),
    mk('LAST TRAIN', '最終電車', TPL.poses(P, ['reap_w', ['reap', F => { CFX.burst(F, P.c, 18, 10, 60); CFX.snd('sickle'); }], 'victory'], null, { step: 30 }), { loop: [ambient('ember', P.c, 14, 60, 220, 2)] })],
}));
cosAdd('kuchi', { c: '#e0203a', c2: '#ffb4c0', pt: 'spark', snd: 'snip' }, P => ({
  i: [mk('EXCUSE ME', 'すみません', TPL.walk(P, null, 'touch', {}), { line: 'Excuse me… may I ask you something?' }),
    mk('SUDDEN STEP', '突然の一歩', TPL.warp(P, 'dash_low', 'intro', { snd: 'kuchiVanish', mid2: 'tilt' }))],
  w: [mk('NOW WE MATCH', 'おそろい', TPL.poses(P, ['touch', 'unmask', ['smile', F => CFX.snd('fear')]], null, { step: 36 }), { line: 'Now we match~' }),
    mk('SNIP SNIP', 'ちょきちょき', TPL.poses(P, ['snip_w', ['snip', F => { CFX.burst(F, P.c2, 10, 7, 170); CFX.snd('snip'); }], 'victory'], null, { step: 24 }), { loop: [ambient('spark', P.c, 14, 60, 220, 2)] })],
}));
// any fighter added later without its own set gets a generic one in its colours
function cosFallback(ch) {
  const P = { c: ch.colors.accent, c2: '#ffffff', pt: 'spark' };
  return { i: [mk('GRAND ENTRANCE', '登場', TPL.drop(P, 'm:sp1', 'intro')), mk('POWER UP', '覚醒', TPL.charge(P, 'kneel', 'raise', 'intro'))],
    w: [mk('SHOWTIME', '見せ場', TPL.combo(P, ['m:L', 'm:M', 'm:H'], 'victory')), mk('VICTORY LEAP', '勝利の跳躍', TPL.leap(P, 'victory'))] };
}
function cosList(ch, k) { const e = COS[ch.id] || (COS[ch.id] = cosFallback(ch)); return [null, ...e[k]]; }
function cosName(ch, k, i) { const d = cosList(ch, k)[i]; return d ? d.n : 'CLASSIC'; }

// ---------------- loadout (saved with the mastery profile) ----------------
const Cos = {
  N: 3,
  get(id) { const d = Mastery.data; if (!d.cos) d.cos = {}; return d.cos[id] || { i: -1, w: -1 }; },   // -1 = random among unlocked
  set(id, k, v) { const d = Mastery.data; if (!d.cos) d.cos = {}; d.cos[id] = { ...this.get(id), [k]: v }; Mastery.save(); },
  open(id, k, idx, lv) { return (lv ?? Mastery.level(id)) >= COS_UNLOCK[k][idx]; },
  allowed(id, k, lv) { const sel = this.get(id)[k], open = [0, 1, 2].filter(i => this.open(id, k, i, lv)); return sel >= 0 && open.includes(sel) ? [sel] : open; },
  loadout(ch) { const lv = Mastery.level(ch.id); return { lv, i: this.allowed(ch.id, 'i', lv), w: this.allowed(ch.id, 'w', lv) }; },
  cpu() { return { lv: 0, i: [0, 1, 2], w: [0, 1, 2] }; },
  clean(c) {   // sanitise a loadout from the network
    if (!c || typeof c !== 'object') return { lv: 0, i: [0], w: [0] };
    const L = a => { const r = (Array.isArray(a) ? a : []).map(x => x | 0).filter(x => x >= 0 && x < 3).slice(0, 3); return r.length ? r : [0]; };
    return { lv: clamp(c.lv | 0, 0, 10), i: L(c.i), w: L(c.w) };
  },
  pickIdx(list) { return !list || !list.length ? 0 : list.length === 1 ? list[0] : list[Math.floor(Math.random() * list.length)]; },
};
{
  const im = Mastery.import;
  Mastery.import = function (o) { const r = im.call(this, o); if (r && o.cos && typeof o.cos === 'object') { const d = this.data; d.cos = Object.assign(d.cos || {}, o.cos); this.save(); } return r; };
}

// ---------------- battle hooks ----------------
{
  const BP = Battle.prototype, FP = Fighter.prototype;
  const nr = BP.newRound;
  BP.newRound = function (first) {
    const c = this.cfg;
    if (first && !c.online && this.mode === 'versus' && (!c.cos || c.cosAuto)) { c.cos = [Cos.loadout(CHARS[c.p1]), c.cpu ? Cos.cpu() : Cos.loadout(CHARS[c.p2])]; c.cosAuto = true; }
    if (first && c.online && Array.isArray(c.cos)) c.cos = [Cos.clean(c.cos[0]), Cos.clean(c.cos[1])];
    const r = nr.call(this, first);
    if (first && this.phase === 'intro') {
      [this.p1, this.p2].forEach((F, i) => {
        const lo = c.cos && c.cos[i], def = cosList(F.ch, 'i')[Cos.pickIdx(lo && lo.i)];
        if (def) F.cos = { def, t: 0, st: 'intro', on: false };
      });
    }
    return r;
  };
  const ifx = BP.introFx;
  BP.introFx = function (F) {
    if (!F.cos || F.cos.st !== 'intro') return ifx.call(this, F);
    F.cos.on = true; cosFire(F, 0);
    const line = F.cos.def.line || F.ch.intro;
    if (!F.ch.mute && line) Sound.speak(line, F.ch.voicePitch ?? (F.ch.id === 'goro' ? 0.3 : F.ch.id === 'sera' || F.ch.id === 'yoru' ? 1.2 : 0.8), F.ch.voiceRate ?? 1);
  };
  const ui = BP.updateIntro;
  BP.updateIntro = function () { for (const F of [this.p1, this.p2]) if (F.cos && F.state === 'intro') cosTick(F); return ui.call(this); };
  const uk = BP.updateKO;
  BP.updateKO = function () {
    const r = uk.call(this), W1 = this.winner;
    if (this.phase === 'roundEnd' && this.pf === 0 && W1 && W1.state === 'victory' && !(W1.cos && W1.cos.st === 'victory')) {
      const lo = this.cfg.cos && this.cfg.cos[W1.pid - 1], idx = Cos.pickIdx(lo && lo.w), def = cosList(W1.ch, 'w')[idx];
      W1.cosW = idx; W1.cos = null;
      if (def) { W1.cos = { def, t: 0, st: 'victory', on: true }; cosFire(W1, 0); if (def.line && this.quote) this.quote.text = def.line; }
    }
    return r;
  };
  const ure = BP.updateRoundEnd;
  BP.updateRoundEnd = function () { const W1 = this.winner; if (W1 && W1.cos && W1.state === 'victory') cosTick(W1); return ure.call(this); };

  const tp = FP.targetPose;
  FP.targetPose = function () { const c = this.cos; if (c && c.st === this.state && !this.forcePose) { const k = cosKey(c.def, c.t); return [cosSpec(this.ch, k.p), k.r]; } return tp.call(this); };
  const ex = FP.expr;
  FP.expr = function () { const c = this.cos; if (c && c.st === this.state) { const k = cosKey(c.def, c.t); if (k.x) return k.x; } return ex.call(this); };
  const dr = FP.draw;
  FP.draw = function (g) {
    const c = this.cos; if (!c || c.st !== this.state) return dr.call(this, g);
    const o = cosOff(c.def, c.t); if (o.h) return;
    const x = this.x, y = this.y; this.x += o.dx * this.facing * this.s; this.y += o.dy * this.s;
    try { return dr.call(this, g); } finally { this.x = x; this.y = y; }
  };
}

// ---------------- intro card / VS / select / results: titles ----------------
function titleLine(ch, lv) { const [t, j] = masteryTitle(ch, lv); return `LV ${lv} · ${t}  ${j}`; }
{
  const dic = drawIntroCard;
  drawIntroCard = function (g, bt) {
    const f = bt.pf, F = f < 100 ? bt.p1 : bt.p2, line = F.cos && F.cos.st === 'intro' && F.cos.def.line;
    if (!line) dic(g, bt);
    else { const ci = F.ch.intro; F.ch.intro = line; try { dic(g, bt); } finally { F.ch.intro = ci; } }
    const lo = bt.cfg.cos && bt.cfg.cos[F.pid - 1]; if (!lo || !lo.lv) return;
    const lf = f < 100 ? f : f - 100, k = easeOut((lf - 6) / 14), left = F.pid === 1;
    const x = left ? lerp(-500, 60, k) : lerp(W + 500, W - 60, k);
    g.save(); g.textBaseline = 'middle'; g.textAlign = left ? 'left' : 'right'; g.font = `italic 900 22px ${FONT_T}`;
    strokeText(g, titleLine(F.ch, lo.lv), x, 352, lo.lv >= 10 ? '#ffd84a' : '#ffffff', OUTLINE, 5);
    const cn = F.cos && F.cos.st === 'intro' ? F.cos.def.n : null;
    if (cn) { g.font = `700 14px ${FONT_UI}`; g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillText('INTRO · ' + cn, x, 378); }
    g.restore();
  };
  const vd = VSScene.prototype.draw;
  VSScene.prototype.draw = function (g) {
    vd.call(this, g);
    const c = this.cfg; if (c.online || c.mode !== 'versus') return;
    const t = this.t, kn = easeOut((t - 8) / 16);
    const lv1 = Mastery.level(this.a.id), lv2 = c.cpu ? 0 : Mastery.level(this.b.id);
    g.save(); g.font = `italic 900 20px ${FONT_T}`; g.textBaseline = 'middle';
    g.textAlign = 'left'; strokeText(g, titleLine(this.a, lv1), lerp(-400, 62, kn), 684, lv1 >= 10 ? '#ffd84a' : '#ffffff', OUTLINE, 5);
    if (lv2) { g.textAlign = 'right'; strokeText(g, titleLine(this.b, lv2), lerp(W + 400, W - 62, kn), 224, lv2 >= 10 ? '#ffd84a' : '#ffffff', OUTLINE, 5); }
    g.restore();
  };
  // select screen: show the title next to the mastery level
  const dmb = drawMasteryBar;
  drawMasteryBar = function (g, x, y, w, id, right, lvOverride) {
    dmb(g, x, y, w, id, right, lvOverride);
    const ch = CHARS.find(c => c.id === id); if (!ch) return;
    const lv = lvOverride || Mastery.level(id), [t] = masteryTitle(ch, lv);
    g.save(); g.font = `italic 900 15px ${FONT_T}`; const off = g.measureText(`MASTERY LV ${lv}${lv >= 10 ? ' ★' : ''}`).width + 10;
    g.textBaseline = 'middle'; g.textAlign = right ? 'right' : 'left';
    let fs = 13; g.font = `italic 800 13px ${FONT_UI}`;
    const avail = w - off - (lvOverride ? -40 : 62);
    while (fs > 8 && g.measureText(t).width > avail) { fs--; g.font = `italic 800 ${fs}px ${FONT_UI}`; }
    strokeText(g, t, right ? x - off : x + off, y, lv >= 10 ? '#ffd84a' : '#ffc48a', OUTLINE, 3); g.restore();
  };
}

// results: the winner plays the victory pose it used, + unlock toasts for titles / intros / victory poses
class CosPlayer {   // menu-side player: own pose state, effects in screen space
  constructor(ch, def, st) { this.ch = ch; this.set(def, st); this.ropes = {}; }
  set(def, st) { this.cos = def ? { def, t: 0, st, on: true } : null; this.st = st; this.pose = buildPose(this.ch, def ? cosSpec(this.ch, def.keys[0].p) : st); this.T = 0; this.fired = false; }
  step(x, y, s, facing = 1) {
    this.T++; const c = this.cos;
    const F = this.fx || (this.fx = { ch: this.ch, colors: this.ch.colors, cos: c }); Object.assign(F, { x, y, s, facing, cos: c });
    let spec = this.st, r = 0.12;
    if (c) {
      if (!this.fired) { this.fired = true; cosFire(F, 0); } else cosTick(F);
      const k = cosKey(c.def, c.t); spec = cosSpec(this.ch, k.p); r = k.r;
    }
    const tgt = buildPose(this.ch, spec); for (const k of POSE_KEYS) this.pose[k] = lerp(this.pose[k], tgt[k], r);
  }
  draw(g, x, y, sc, facing = 1, o = {}) {
    const c = this.cos, off = c ? cosOff(c.def, c.t) : { dx: 0, dy: 0 };
    if (off.h) return;
    const k = c ? cosKey(c.def, c.t) : null, expr = (k && k.x) || (this.st === 'victory' ? 'grin' : 'normal');
    const px = x + off.dx * facing * sc, py = y + off.dy * sc;
    g.save(); g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(x, y + 4, 46 * sc * (this.ch.wide || 1) / (1 + Math.max(0, -off.dy) / 260), 9 * sc, 0, 0, TAU); g.fill(); g.restore();
    artFigure(g, px, py, sc, g => {
      if (o.glow) { g.save(); g.shadowColor = this.ch.colors.accent; g.shadowBlur = 40; g.globalAlpha = 0.5; drawFigure(g, this.ch, this.pose, px, py, facing, { mono: this.ch.colors.accent, scale: sc * 1.01 }); g.restore(); }
      drawFigure(g, this.ch, this.pose, px, py, facing, { scale: sc, T: this.T, ropes: this.ropes, glow: true, expr });
    });
  }
}
{
  const RP = ResultsScene.prototype, ru = RP.update, rd = RP.draw;
  RP.update = function () {
    const r = ru.call(this);
    if (scene === this) {
      if (this.cp === undefined) { const F = this.win; this.cp = F.cosW ? new CosPlayer(F.ch, cosList(F.ch, 'w')[F.cosW], 'victory') : null; if (this.cp) { FX.reset(); this.cp.pose = buildPose(F.ch, 'victory'); } }
      if (this.cp) { this.cp.step(300, 720, 2.3); FX.update(); }
    }
    return r;
  };
  RP.draw = function (g) {
    const cp = this.cp;
    if (!cp) { rd.call(this, g); }
    else {   // swap the static winner figure for the animated one
      const af = artFigure; let done = false;
      artFigure = function (g2, x, y, sc, fn) { if (!done && Math.abs(x - 300) < 1 && Math.abs(sc - 2.3) < 0.01) { done = true; cp.draw(g2, 300, 720, 2.3, 1, { glow: true }); g2.save(); FX.drawParticles(g2, false); g2.restore(); return; } return af(g2, x, y, sc, fn); };
      try { rd.call(this, g); } finally { artFigure = af; }
    }
    if (this.mx) drawCosUnlocks(g, this.mx, this.t);
  };
}
function cosUnlocksOf(M) {
  const out = [], a = M.before.lv, b = M.after.lv;
  for (let lv = a + 1; lv <= b; lv++) {
    out.push({ k: 't', lv, label: 'NEW TITLE', name: masteryTitle(M.ch, lv)[0] });
    for (const k of ['i', 'w']) COS_UNLOCK[k].forEach((u, i) => { if (u === lv && i > 0) out.push({ k, i, label: k === 'i' ? 'NEW INTRO' : 'NEW VICTORY POSE', name: cosName(M.ch, k, i) }); });
  }
  return out;
}
function drawCosUnlocks(g, M, t) {
  if (!M.cosU) M.cosU = cosUnlocksOf(M);
  const L = M.cosU; if (!L.length) return;
  const k0 = clamp((t - 30) / 70, 0, 1); if (k0 < 1) return;
  const base = 100 + M.unlocks.length * 20;
  L.slice(0, 4).forEach((u, i) => {
    const a = clamp((t - base - i * 16) / 12, 0, 1); if (a <= 0) return;
    const tw = 330, th = 50, tx = 24, ty = 606 - 8 - M.unlocks.length * 92 - (i + 1) * 58;
    g.save(); g.globalAlpha = a; g.translate((1 - a) * 60, 0);
    panel(g, tx, ty, tw, th, 'rgba(26,10,40,0.92)', u.k === 't' ? '#ffd84a' : '#b996ff');
    g.textBaseline = 'middle'; g.textAlign = 'left';
    g.font = `italic 900 13px ${FONT_T}`; strokeText(g, u.label + '!', tx + 14, ty + 16, t % 30 < 18 ? '#ffd84a' : '#ffffff', OUTLINE, 3);
    g.font = `italic 900 19px ${FONT_T}`; strokeText(g, u.name, tx + 14, ty + 35, '#ffffff', OUTLINE, 4);
    g.restore();
  });
  if (L.length > 4) { g.save(); g.font = `700 12px ${FONT_UI}`; g.textAlign = 'right'; g.fillStyle = '#cfc4ee'; g.fillText(`+${L.length - 4} more · see COLLECTION`, 354, 606 - 8 - M.unlocks.length * 92 - 4 * 58 - 10); g.restore(); }
}

// ---------------- online: send the loadout during character select; host puts both into the start cfg ----------------
{
  const ns = Net.send.bind(Net);
  Net.send = function (o) {
    const sc = scene;
    if (o && sc instanceof NetSelectScene) {
      if (o.t === 'sel') o.cs = Cos.loadout(CHARS[sc.cur[0]]);
      if (o.t === 'start' && o.cfg) o.cfg.cos = [Cos.loadout(CHARS[sc.cur[0]]), Cos.clean(sc.rcos || (Net.remoteSel && Net.remoteSel.cs))];
    }
    return ns(o);
  };
  const NP = NetSelectScene.prototype, no = NP.onNet;
  NP.onNet = function (d) { if (d.t === 'sel' && d.cs) this.rcos = d.cs; if (d.t === 'start' && d.cfg && d.cfg.cos) d.cfg.cos = d.cfg.cos.map(c => Cos.clean(c)); return no.call(this, d); };
}

// ---------------- COLLECTION screen (title menu) ----------------
class CollectionScene {
  constructor(ci = 0) {
    this.t = 0; this.ci = ci; this.row = 1; this.sel = { i: 0, w: 0 }; this.lock = null;
    Music.play('menu'); this.load();
  }
  get ch() { return CHARS[this.ci]; }
  load() {
    const c = Cos.get(this.ch.id); this.sel = { i: c.i, w: c.w }; this.lv = Mastery.level(this.ch.id); this.vs = Mastery.pick(this.ch.id); this.vlock = null;
    this.preview(this.row === 2 ? 'w' : 'i');
  }
  preview(k) {
    FX.reset(); this.pk = k;
    const v = this.sel[k], idx = v < 0 ? (this.t >> 4) % 3 : v, def = cosList(this.ch, k)[idx];
    this.pIdx = idx;
    this.cp = new CosPlayer(this.ch, def, k === 'i' ? 'intro' : 'victory');
  }
  rowRects() { return [0, 1, 2, 3, 4].map(r => ({ x: 620, y: 140 + r * 92, w: 620, h: 84 })); }
  arrowRects(r) { const R = this.rowRects()[r]; return [{ x: R.x + 8, y: R.y + 24, w: 44, h: 52 }, { x: R.x + R.w - 52, y: R.y + 24, w: 44, h: 52 }]; }
  change(d) {
    const r = this.row;
    if (r === 0) { this.ci = (this.ci + d + CHARS.length) % CHARS.length; this.load(); Sound.play('menuMove'); return; }
    if (r === 3) return;
    if (r === 4) {   // SKIN: every colour + the arcade skin; locked ones can be previewed
      const id = this.ch.id; this.vs = ((this.vs ?? Mastery.pick(id)) + d + VAR_N) % VAR_N; Sound.play('menuMove');
      if (Mastery.unlocked(id, this.vs)) { Mastery.setPick(id, this.vs); this.vlock = null; } else this.vlock = { v: this.vs, t: 90 };
      return;
    }
    const k = r === 1 ? 'i' : 'w', id = this.ch.id;
    let v = this.sel[k] + d; if (v < -1) v = 2; if (v > 2) v = -1;
    this.sel[k] = v; Sound.play('menuMove');
    if (v < 0 || Cos.open(id, k, v)) { Cos.set(id, k, v); this.lock = null; } else this.lock = { k, v, t: 90 };
    this.preview(k);
  }
  update() {
    this.t++;
    if (this.lock && --this.lock.t <= 0) this.lock = null;
    if (UI.back()) { Sound.play('menuBack'); FX.reset(); go(new TitleScene()); return; }
    if (UI.up()) { this.row = (this.row + 5) % 6; Sound.play('menuMove'); if (this.row === 1 || this.row === 2) this.preview(this.row === 1 ? 'i' : 'w'); }
    if (UI.down()) { this.row = (this.row + 1) % 6; Sound.play('menuMove'); if (this.row === 1 || this.row === 2) this.preview(this.row === 1 ? 'i' : 'w'); }
    if (this.vlock && --this.vlock.t <= 0) this.vlock = null;
    if (this.row < 5) { if (UI.left()) this.change(-1); if (UI.right()) this.change(1); }
    if (UI.ok()) { if (this.row === 5) { Sound.play('menuBack'); FX.reset(); go(new TitleScene()); return; } this.preview(this.pk); Sound.play('menuOk'); }
    if (Mouse.clicked) {
      for (let r = 0; r < 5; r++) {
        const [a, b] = this.arrowRects(r);
        if (inRect(a) || inRect(b)) { this.row = r; this.change(inRect(a) ? -1 : 1); Mouse.clicked = false; break; }
        if (inRect(this.rowRects()[r])) { this.row = r; if (r === 1 || r === 2) this.preview(r === 1 ? 'i' : 'w'); Sound.play('menuMove'); Mouse.clicked = false; break; }
      }
      if (Mouse.clicked && inRect(this.backRect())) { Mouse.clicked = false; FX.reset(); go(new TitleScene()); return; }
      if (Mouse.clicked && inRect({ x: 40, y: 140, w: 520, h: 520 })) { Mouse.clicked = false; this.preview(this.pk); }
    }
    // replay the preview in a loop; RANDOM cycles through the unlocked ones
    if (this.cp.cos ? this.cp.cos.t > this.cp.cos.def.dur + 70 : this.cp.T > 120) {
      const k = this.pk, v = this.sel[k];
      if (v < 0) { const open = [0, 1, 2].filter(i => Cos.open(this.ch.id, k, i)); const n = open[(open.indexOf(this.pIdx) + 1) % open.length] ?? 0; FX.reset(); this.pIdx = n; this.cp = new CosPlayer(this.ch, cosList(this.ch, k)[n], k === 'i' ? 'intro' : 'victory'); }
      else this.preview(k);
    }
    this.cp.step(300, 640, 1.9); FX.update();
  }
  backRect() { return { x: 620 + 310 - 130, y: 612, w: 260, h: 44 }; }
  draw(g) {
    const t = this.t, ch = this.ch, c = ch.colors.accent;
    drawMenuBG(g, t, c);
    drawTitleText(g, 'COLLECTION', W / 2, 62, 64, '#ffd84a', '#ff2a3a');
    g.font = `700 18px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ff8aa0'; g.fillText('コレクション · intros, victory poses and titles unlock with MASTERY', W / 2, 106);
    // preview stage
    panel(g, 40, 140, 520, 520, 'rgba(8,4,20,0.7)', c + '88');
    g.save(); g.beginPath(); g.rect(42, 142, 516, 516); g.clip();
    const gr = g.createRadialGradient(300, 520, 20, 300, 520, 320); gr.addColorStop(0, c + '55'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(42, 142, 516, 516);
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(42, 640, 516, 2);
    { const vi = this.vs | 0; withVarPal([[ch, vi]], () => withArt([varFn(ch, vi)], () => { const pc = RC.cos; RC.cos = vi === ARC_VI && varDef(ch, vi) && varDef(ch, vi).cos ? ch.id : null; try { this.cp.draw(g, 300, 640, 1.9, 1); } finally { RC.cos = pc; } })); }
    g.save(); FX.drawParticles(g, false); g.restore();
    g.restore();
    const k = this.pk, lockedPrev = !Cos.open(ch.id, k, this.pIdx);
    g.font = `italic 900 18px ${FONT_T}`; g.textAlign = 'center'; strokeText(g, `${COS_KIND[k][0]}: ${cosName(ch, k, this.pIdx)}${lockedPrev ? '  (LOCKED)' : ''}`, 300, 168, lockedPrev ? '#ff9ab0' : '#ffffff', OUTLINE, 4);
    g.font = `600 13px ${FONT_UI}`; g.fillStyle = 'rgba(230,220,255,0.7)'; g.fillText('click / ENTER: replay', 300, 190);
    // rows
    const R = this.rowRects(), lv = this.lv;
    R.forEach((r, i) => {
      const on = this.row === i;
      panel(g, r.x, r.y, r.w, r.h, on ? 'rgba(40,16,60,0.92)' : 'rgba(12,6,28,0.82)', on ? '#ffffff' : 'rgba(255,255,255,0.15)');
      if (i < 3 || i === 4) for (const [j, a] of this.arrowRects(i).entries()) { g.font = `900 30px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = on ? '#ffd84a' : 'rgba(255,255,255,0.4)'; g.fillText(j ? '▶' : '◀', a.x + a.w / 2, a.y + a.h / 2 + 2); }
      g.textAlign = 'left'; g.font = `800 13px ${FONT_UI}`; g.fillStyle = '#a89cd0';
      g.fillText(['FIGHTER', 'INTRO  登場', 'VICTORY POSE  勝利', 'TITLE  称号', 'SKIN  衣装'][i], r.x + 18, r.y + 18);
      g.textAlign = 'center';
      if (i === 0) {
        g.font = `italic 900 32px ${FONT_T}`; strokeText(g, ch.name, r.x + r.w / 2, r.y + 44, '#ffffff', OUTLINE, 5);
        g.font = `700 14px ${FONT_JP}`; g.fillStyle = c; g.fillText(`${ch.jp} · ${ch.title}  ·  ${this.ci + 1}/${CHARS.length}`, r.x + r.w / 2, r.y + 72);
      } else if (i < 3) {
        const kk = i === 1 ? 'i' : 'w', v = this.sel[kk], lk = this.lock && this.lock.k === kk ? this.lock : null;
        const name = v < 0 ? 'RANDOM' : cosName(ch, kk, v), open = v < 0 || Cos.open(ch.id, kk, v);
        g.font = `italic 900 28px ${FONT_T}`; strokeText(g, name, r.x + r.w / 2, r.y + 44, open ? '#ffffff' : '#ff9ab0', OUTLINE, 5);
        g.font = `700 13px ${FONT_UI}`;
        const sub = v < 0 ? 'a random unlocked one each match' : open ? (cosList(ch, kk)[v] ? cosList(ch, kk)[v].jp + '  ·  EQUIPPED' : 'the original  ·  EQUIPPED') : `LOCKED · REACH MASTERY LV ${COS_UNLOCK[kk][v]}`;
        g.fillStyle = open ? '#7affc0' : '#ff9ab0'; g.fillText(lk ? `LOCKED · REACH MASTERY LV ${COS_UNLOCK[kk][lk.v]} (preview only)` : sub, r.x + r.w / 2, r.y + 70);
        // pips: which of the three are unlocked
        for (let p = 0; p < 3; p++) { const ok = Cos.open(ch.id, kk, p); g.fillStyle = ok ? (v === p ? '#ffd84a' : '#ffffff') : 'rgba(255,255,255,0.2)'; g.fillRect(r.x + r.w - 110 + p * 22, r.y + 12, 16, 8); }
      } else if (i === 4) {
        const v = this.vs | 0, open = Mastery.unlocked(ch.id, v), sp = varSpecial(ch.id, v);
        g.font = `italic 900 26px ${FONT_T}`; strokeText(g, varName(ch, v), r.x + r.w / 2, r.y + 44, open ? (sp ? '#ffd84a' : '#ffffff') : '#ff9ab0', OUTLINE, 5);
        g.font = `700 13px ${FONT_UI}`; g.fillStyle = open ? '#7affc0' : '#ff9ab0';
        g.fillText(open ? (sp ? 'ARCADE SKIN  ·  EQUIPPED' : 'EQUIPPED') : `LOCKED · ${varLockText(ch, v)} (preview only)`, r.x + r.w / 2, r.y + 70);
        for (let q = 0; q < VAR_N; q++) { const ok = Mastery.unlocked(ch.id, q); g.fillStyle = ok ? (v === q ? '#ffd84a' : '#ffffff') : 'rgba(255,255,255,0.2)'; g.fillRect(r.x + r.w - 154 + q * 22, r.y + 12, 16, 8); }
      } else {
        const [tt, tj] = masteryTitle(ch, lv), nx = lv < 10 ? masteryTitle(ch, lv + 1) : null;
        g.font = `italic 900 28px ${FONT_T}`; strokeText(g, `${tt}  ${tj}`, r.x + r.w / 2, r.y + 44, lv >= 10 ? '#ffd84a' : '#ffffff', OUTLINE, 5);
        g.font = `700 13px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.fillText(`MASTERY LV ${lv}${nx ? `  ·  next: ${nx[0]} at LV ${lv + 1}` : '  ·  highest title!'}${lv < 10 ? `  ·  LV 10: ${masteryTitle(ch, 10)[0]}` : ''}`, r.x + r.w / 2, r.y + 70);
      }
    });
    const b = this.backRect();
    drawButton(g, b, 'BACK', '戻る', this.row === 5, t);
    drawFooter(g, Settings.mobile ? 'tap ◀ ▶ to change' : '↑/↓ row   ·   ←/→ change   ·   ENTER replay   ·   ESC back');
  }
}
{
  const up = TitleScene.prototype.update, dr = TitleScene.prototype.draw;
  TitleScene.prototype.cosMenu = function () {
    if (this.cosAdded) return; this.cosAdded = true;
    const m = this.menu, items = m.items;
    if (!items.some(i => i.id === 'collection')) items.splice(items.findIndex(i => i.id === 'howto'), 0, { id: 'collection', label: 'COLLECTION', jp: 'コレクション' });
    m.y = 292; m.h = 40; m.gap = 6;
    const mu = m.update.bind(m);
    m.update = () => { const it = mu(); if (it && it.id === 'collection') { Sound.play('menuOk'); go(new CollectionScene()); return null; } return it; };
  };
  TitleScene.prototype.update = function () { this.netMenu && this.netMenu(); this.cosMenu(); return up.call(this); };
  TitleScene.prototype.draw = function (g) { this.netMenu && this.netMenu(); this.cosMenu(); return dr.call(this, g); };
}
