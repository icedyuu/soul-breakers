// ============================ MASTERY + COLOR VARIANTS ============================
// Per-fighter mastery (XP from Arcade, VS CPU and Online matches, saved on this device) unlocks
// colour variants. A variant is a set of hue/lightness rules applied to every colour the fighter
// draws (palette AND hard-coded hook colours) by a light canvas-colour hook, so all 16 fighters,
// their state palettes, projectiles, portraits and cut-ins recolour without per-file changes.
// Variants are purely visual: the sim never reads them, so online lockstep stays deterministic.
// The profile is one JSON object (Mastery.export/import) so a future account system can sync it.

// ---------------- colour maths ----------------
function rcHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, Math.min(1, s), l];
}
function rcRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function rcParse(v) {
  if (v[0] === '#') {
    const n = v.length;
    if (n === 4 || n === 5) return [parseInt(v[1] + v[1], 16), parseInt(v[2] + v[2], 16), parseInt(v[3] + v[3], 16), n === 5 ? parseInt(v[4] + v[4], 16) / 255 : 1];
    if (n === 7 || n === 9) return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16), n === 9 ? parseInt(v.slice(7, 9), 16) / 255 : 1];
    return null;
  }
  const m = /^(rgba?|hsla?)\(\s*([-\d.]+)[\s,]+([-\d.]+)%?[\s,]+([-\d.]+)%?(?:[\s,/]+([\d.]+))?\s*\)$/.exec(v);
  if (!m) return null;
  const a = m[5] !== undefined ? +m[5] : 1;
  if (m[1][0] === 'r') return [+m[2], +m[3], +m[4], a];
  const [r, g, b] = rcRgb(((+m[2] % 360) + 360) % 360, clamp(+m[3] / 100, 0, 1), clamp(+m[4] / 100, 0, 1)); return [r, g, b, a];
}
const rcHex = n => (n < 16 ? '0' : '') + n.toString(16);
const rcInHue = (h, [a, b]) => a <= b ? h >= a && h <= b : h >= a || h <= b;

// a recolour function for one variant: string -> string, cached; colours it produced pass through
// unchanged (so already-mapped palette colours are never shifted twice)
function rcMaker(V, protect) {
  const cache = new Map(), outs = new Set();
  const prot = protect.map(rcParse).filter(Boolean);
  const mapRGB = (r, g, b) => {
    if (outs.has((r << 16) | (g << 8) | b)) return null;
    for (const p of prot) if (Math.abs(p[0] - r) + Math.abs(p[1] - g) + Math.abs(p[2] - b) < 24) return null;
    let [h, s, l] = rcHsl(r, g, b);
    if (l < 0.06) return null;    // outlines / near-black stay
    const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
    if (l > 0.97 && chroma < 0.04) return null;   // pure white: eye whites, highlights, shines
    for (const R of V.rules) {
      // 'only' = whites/greys/blacks (by chroma, so off-whites count); no flag = coloured (HSL saturation)
      const grey = R.grey === 'only' ? chroma < 0.1 : s < (R.smin ?? 0.12);
      if (grey && !R.grey) continue;
      if (!grey && R.grey === 'only') continue;
      if (R.h && !grey && !rcInHue(h, R.h)) continue;
      if (R.l && (l < R.l[0] || l > R.l[1])) continue;
      if (R.hue !== undefined) h = R.hue;
      if (R.dh) h = ((h + R.dh) % 360 + 360) % 360;
      if (R.ss !== undefined) s = R.ss; else if (R.grey === 'only') s = Math.min(s, 0.1);   // off-whites stay neutral
      if (R.s) s = clamp(s * R.s, 0, 1);
      if (R.inv) l = 1 - l;
      if (R.lm) l *= R.lm;
      if (R.la) l += R.la;
      return rcRgb(h, s, clamp(l, 0, 1));
    }
    return null;
  };
  return v => {
    let o = cache.get(v); if (o !== undefined) return o;
    o = v;
    const c = rcParse(v);
    if (c) {
      const m = mapRGB(c[0] | 0, c[1] | 0, c[2] | 0);
      if (m) { outs.add((m[0] << 16) | (m[1] << 8) | m[2]); o = c[3] >= 1 ? '#' + rcHex(m[0]) + rcHex(m[1]) + rcHex(m[2]) : `rgba(${m[0]},${m[1]},${m[2]},${c[3]})`; }
    }
    if (cache.size > 4000) cache.clear();
    cache.set(v, o); return o;
  };
}

// ---------------- canvas colour hook ----------------
const RC = { fn: null, pal: null, cos: null };   // cos: fighter id whose arcade costume every figure of that fighter wears right now   // pal: {charId: outfit palette} for menu figures drawn in a variant (ch.varColors)
(() => {
  const P = CanvasRenderingContext2D.prototype;
  for (const k of ['fillStyle', 'strokeStyle', 'shadowColor']) {
    const d = Object.getOwnPropertyDescriptor(P, k); if (!d || !d.set) continue;
    Object.defineProperty(P, k, { configurable: true, enumerable: d.enumerable, get: d.get, set(v) { d.set.call(this, RC.fn && typeof v === 'string' ? RC.fn(v) : v); } });
  }
  for (const k of ['createLinearGradient', 'createRadialGradient', 'createConicGradient']) {
    const f = P[k]; if (!f) continue;
    P[k] = function (...a) {
      const gr = f.apply(this, a);
      if (RC.fn) { const fn = RC.fn, add = gr.addColorStop; gr.addColorStop = (o, c) => add.call(gr, o, typeof c === 'string' ? fn(c) : c); }
      return gr;
    };
  }
})();
function withRecolor(fn, body) { const prev = RC.fn; RC.fn = fn; try { return body(); } finally { RC.fn = prev; } }

// ---------------- variant designs (index 0 = default; 1-4 unlock at mastery LV 2 / 4 / 7 / 10; 5 = arcade-clear skin) ----------------
const VAR_UNLOCK = [1, 2, 4, 7, 10, 99];   // slot 5 = ARCADE skin (special: clear Arcade with the fighter, see 09cz_arcade.js)
const VAR_N = VAR_UNLOCK.length;
const LIGHT = [0.55, 1], DARK = [0, 0.4];
const VARIANTS = {
  kazuma: [
    { n: 'TIDAL BLUE', rules: [{ dh: 205 }] },
    { n: 'BLACK GI', rules: [{ grey: 'only', l: LIGHT, lm: 0.26 }, { h: [330, 40], hue: 356, s: 1.1 }] },
    { n: 'JADE STORM', rules: [{ h: [320, 60], hue: 150, s: 0.9 }, { grey: 'only', l: LIGHT, hue: 150, ss: 0.25, lm: 0.95 }] },
    { n: 'INFERNO SOVEREIGN', glow: '#ffc23a', rules: [{ grey: 'only', l: [0.5, 1], hue: 20, ss: 0.3, lm: 0.22 }, { h: [320, 70], hue: 44, s: 1.2, la: 0.08 }, { grey: 'also', l: [0.06, 0.5], hue: 20, ss: 0.35 }] },
  ],
  yoru: [
    { n: 'CRIMSON MOON', rules: [{ h: [220, 300], hue: 356 }, { h: [320, 360], hue: 22 }] },
    { n: 'MOONLIT WHITE', rules: [{ grey: 'also', l: [0.06, 0.3], inv: 1, lm: 0.95 }] },
    { n: 'VENOM SHADE', rules: [{ dh: -150 }] },
    { n: 'VOID KUNOICHI', glow: '#5af0ff', rules: [{ grey: 'also', l: [0.06, 0.45], hue: 250, ss: 0.15, lm: 0.45 }, { hue: 188, s: 1.2, la: 0.1 }] },
  ],
  sera: [
    { n: 'SAKURA', rules: [{ h: [180, 250], hue: 335 }] },
    { n: 'DUSK', rules: [{ grey: 'only', l: [0.6, 1], hue: 265, ss: 0.35, lm: 0.78 }, { h: [180, 250], hue: 275 }] },
    { n: 'VERDANT', rules: [{ h: [180, 250], hue: 140, s: 0.85 }] },
    { n: 'CELESTIAL GOLD', glow: '#ffe27a', rules: [{ grey: 'only', l: [0.6, 1], hue: 45, ss: 0.55, lm: 0.93 }, { h: [180, 250], hue: 42, s: 1.1 }, { h: [30, 60], hue: 200 }] },
  ],
  goro: [
    { n: 'FROST ONI', rules: [{ h: [330, 20], hue: 210, la: 0.12 }] },
    { n: 'JADE ONI', rules: [{ h: [330, 20], hue: 130, la: 0.1 }] },
    { n: 'IRON ONI', rules: [{ h: [330, 20], ss: 0.06, la: 0.2 }, { h: [30, 60], ss: 0.05, la: 0.15 }] },
    { n: 'DEMON KING', glow: '#d050ff', rules: [{ h: [330, 20], hue: 285, s: 1.2, la: 0.1 }, { h: [30, 60], hue: 300, la: 0.1 }] },
  ],
  frogs: [
    { n: 'POISON DART', keep: false, rules: [{ h: [60, 210], dh: 100, s: 1.1 }] },
    { n: 'EMBER TOAD', keep: false, rules: [{ h: [60, 210], dh: -110 }] },
    { n: 'GOLDEN', keep: false, rules: [{ h: [60, 210], hue: 48, s: 1.1, la: 0.05 }] },
    { n: 'SPIRIT FROGS', keep: false, glow: '#c070ff', rules: [{ h: [60, 210], dh: 170, s: 1.1 }] },
  ],
  conductor: [
    { n: 'MIDNIGHT LINE', rules: [{ grey: 'only', l: [0.6, 1], hue: 225, ss: 0.35, lm: 0.45 }] },
    { n: 'EMERALD EXPRESS', rules: [{ h: [330, 20], hue: 150 }] },
    { n: 'ROYAL', rules: [{ grey: 'only', l: [0.6, 1], hue: 275, ss: 0.3, lm: 0.5 }, { h: [330, 20], hue: 45 }] },
    { n: 'PHANTOM RAIL', glow: '#5affff', rules: [{ grey: 'only', l: [0.6, 1], lm: 0.16 }, { h: [330, 20], hue: 185, la: 0.1 }] },
  ],
  cardmaster: [
    { n: 'JOKER RED', rules: [{ h: [230, 290], hue: 350 }, { h: [295, 330], hue: 55 }] },
    { n: 'EMERALD ACE', rules: [{ h: [230, 290], hue: 155 }, { h: [295, 330], hue: 50 }] },
    { n: 'IVORY', rules: [{ grey: 'also', l: [0.06, 0.45], inv: 1, lm: 0.9 }] },
    { n: 'HIGH ROLLER', glow: '#ffd24a', rules: [{ h: [230, 290], ss: 0.1, lm: 0.35 }, { h: [295, 330], hue: 45, la: 0.05 }] },
  ],
  nue: [
    { n: 'KITSUNE', rules: [{ h: [150, 200], hue: 25 }, { grey: 'also', l: [0.75, 1], hue: 30, ss: 0.5, lm: 0.97 }] },
    { n: 'BLACK CAT', rules: [{ h: [150, 200], hue: 45 }, { grey: 'also', l: [0.6, 1], lm: 0.25 }] },
    { n: 'SAKURA BEAST', rules: [{ h: [150, 200], hue: 330 }, { grey: 'also', l: [0.75, 1], hue: 330, ss: 0.4 }] },
    { n: 'NIGHTMARE', glow: '#ff3050', rules: [{ grey: 'also', l: [0.6, 1], hue: 270, ss: 0.3, lm: 0.3 }, { h: [150, 200], hue: 0, s: 1.2 }] },
  ],
  saint: [
    { n: 'MOONBLOOD', rules: [{ h: [330, 20], hue: 265 }] },
    { n: 'WHITE ROSE', rules: [{ grey: 'also', l: [0.06, 0.25], inv: 1, lm: 0.82 }] },
    { n: 'GHOUL GREEN', rules: [{ h: [330, 20], hue: 140 }, { h: [30, 60], hue: 90 }] },
    { n: 'SANGUINE EMPRESS', glow: '#ff2040', rules: [{ h: [330, 20], hue: 0, s: 1.3, la: 0.06 }, { h: [30, 60], ss: 0, la: 0.25 }, { grey: 'also', l: [0.06, 0.3], hue: 350, ss: 0.6, lm: 1.7 }] },
  ],
  borgar: [
    { n: 'FROST RUNE', rules: [{ h: [10, 60], l: [0.45, 1], hue: 200 }, { h: [10, 30], l: [0.25, 0.45], hue: 45, la: 0.25 }] },
    { n: 'BLOOD RUNE', rules: [{ h: [30, 60], l: [0.45, 1], hue: 356 }] },
    { n: 'RAVEN', rules: [{ h: [10, 40], l: [0.06, 0.5], ss: 0.05, lm: 0.5 }, { h: [30, 60], l: [0.45, 1], hue: 275, s: 1.1 }] },
    { n: 'VALHALLA', glow: '#7af0ff', rules: [{ h: [30, 60], l: [0.45, 1], hue: 190, s: 1.1, la: 0.1 }, { h: [10, 40], l: [0.06, 0.45], hue: 220, ss: 0.25 }] },
  ],
  buzzu: [
    { n: 'CRIMSON SAW', keep: false, rules: [{ h: [10, 50], hue: 358 }] },
    { n: 'MIDNIGHT', keep: false, rules: [{ h: [10, 50], hue: 232, s: 0.55, lm: 0.85 }] },
    { n: 'TOXIC', keep: false, rules: [{ h: [10, 50], hue: 100, s: 0.75, lm: 0.9 }] },
    { n: 'HELLHOUND', keep: false, glow: '#ff2a1a', rules: [{ h: [10, 50], l: [0, 0.6], ss: 0.06, lm: 0.3 }, { h: [10, 60], hue: 358, s: 1.2 }] },
  ],
  reika: [
    { n: 'ALL BLACK', rules: [{ grey: 'only', l: [0.6, 1], lm: 0.3 }] },
    { n: 'PLATINUM', rules: [{ h: [0, 25], hue: 45, ss: 0.35, la: 0.3 }] },
    { n: 'NAVY AUTHORITY', rules: [{ grey: 'also', l: [0.06, 0.2], hue: 220, ss: 0.45, lm: 1.6 }, { h: [340, 360], hue: 215 }] },
    { n: 'ABSOLUTE CONTROL', glow: '#ff3050', rules: [{ grey: 'only', l: [0.6, 1], hue: 350, ss: 0.6, lm: 0.5 }, { h: [0, 25], ss: 0, la: 0.45 }] },
  ],
  yamika: [
    { n: 'BLOODMOON', rules: [{ h: [200, 320], hue: 352 }] },
    { n: 'LILAC LOLITA', rules: [{ grey: 'also', h: [200, 320], l: [0.06, 0.32], inv: 1, lm: 0.75 }] },
    { n: 'ABYSS TEAL', rules: [{ h: [200, 320], dh: -70 }] },
    { n: 'CHUUNI OVERLORD', glow: '#ffd24a', rules: [{ h: [200, 320], l: DARK, ss: 0, lm: 0.45 }, { h: [200, 320], hue: 48, s: 1.1, la: 0.08 }] },
  ],
  lunaria: [
    { n: 'BLOOD MOON', rules: [{ h: [175, 215], hue: 355 }, { h: [215, 270], hue: 345, s: 0.9 }] },
    { n: 'SOLAR', rules: [{ h: [175, 215], hue: 42 }, { h: [215, 270], hue: 25, s: 0.8 }] },
    { n: 'HARVEST', rules: [{ h: [175, 215], hue: 300 }, { h: [215, 270], hue: 290 }] },
    { n: 'ECLIPSE EMPRESS', glow: '#ffd860', rules: [{ grey: 'only', l: [0.6, 1], hue: 45, ss: 0.75, lm: 0.85 }, { h: [215, 270], ss: 0.05, lm: 0.55 }, { h: [175, 215], hue: 45, s: 1.1 }] },
  ],
  honored: [
    { n: 'RED REVERSAL', rules: [{ h: [180, 235], hue: 355 }] },
    { n: 'HOLLOW PURPLE', rules: [{ h: [180, 235], hue: 280 }] },
    { n: 'WHITE JACKET', rules: [{ grey: 'also', h: [200, 250], l: [0.06, 0.3], inv: 1, lm: 0.95 }] },
    { n: 'INFINITY GOLD', glow: '#ffd860', rules: [{ grey: 'only', l: [0.7, 1], hue: 45, ss: 0.85, lm: 0.85 }, { grey: 'also', l: [0.06, 0.3], hue: 45, ss: 0.05, lm: 0.5 }, { h: [180, 235], hue: 45, s: 1.1 }] },
  ],
  kanae: [
    { n: 'BRUISED BLUE', rules: [{ h: [330, 360], hue: 220 }, { h: [0, 15], hue: 220 }] },
    { n: 'ENVY', rules: [{ h: [330, 360], hue: 130, s: 0.8 }, { h: [0, 15], hue: 130, s: 0.8 }, { h: [220, 250], hue: 150, ss: 0.3 }] },
    { n: 'SCHOOL\'S OUT', rules: [{ h: [220, 250], hue: 25, s: 0.9, lm: 1.5 }, { h: [330, 360], hue: 30 }, { h: [0, 15], hue: 30 }] },
    { n: 'BLACK DAYS', glow: '#ff4a60', rules: [] },   // LV 10: her other look (see KANAE.varColors)
  ],
  tokine: [
    { n: 'MIDNIGHT ROSE', rules: [{ h: [335, 360], hue: 285 }, { h: [0, 12], hue: 285 }] },
    { n: 'GILDED HOUR', rules: [{ h: [335, 360], hue: 40, s: 1.1 }, { h: [0, 12], hue: 40, s: 1.1 }] },
    { n: 'WHITE NIGHTMARE', rules: [{ grey: 'also', h: [280, 360], l: [0.03, 0.2], inv: 1, lm: 0.9 }] },
    { n: 'AFTER SCHOOL', glow: '#ffcf5a', rules: [] },   // LV 10: her school-uniform look (see TOKINE.varColors)
  ],
  aimi: [
    { n: 'LAVENDER VOW', rules: [{ h: [320, 360], hue: 275 }, { h: [0, 12], hue: 275 }] },
    { n: 'MINT DIARY', rules: [{ h: [320, 360], hue: 160, s: 0.8 }, { h: [0, 12], hue: 160, s: 0.8 }, { h: [220, 245], hue: 170, ss: 0.35 }] },
    { n: 'CRIMSON VOW', rules: [{ h: [320, 360], hue: 352, s: 1.1, lm: 0.85 }, { h: [0, 12], hue: 352, s: 1.1, lm: 0.85 }] },
    { n: 'LAST HORIZON', glow: '#ffc0d6', rules: [] },        // LV 10: the long mantle (see AIMI.varColors)
    { n: 'MIDNIGHT DRESS', rules: [], special: 'arcade' },   // her black dress (see AIMI.varColors) — unlocked by clearing Arcade with her
  ],
  hollow: [
    { n: 'CRIMSON SEAL', rules: [{ h: [240, 300], hue: 355 }] },
    { n: 'MIDNIGHT BLUE', rules: [{ h: [240, 300], hue: 195 }, { grey: 'also', l: [0.12, 0.45], hue: 225, ss: 0.35 }] },
    { n: 'TEAL PSYCHE', rules: [{ h: [240, 300], hue: 170 }] },
    { n: 'LAST REMNANT', glow: '#ffd860', rules: [{ grey: 'also', l: [0.12, 0.45], ss: 0, lm: 0.45 }, { h: [240, 300], l: [0.45, 1], hue: 45, s: 1.1, la: 0.05 }] },
  ],
};
// skins with their own unlock condition instead of a mastery level (VARIANTS entry `special`)
function varSpecial(id, vi) { const L = VARIANTS[id], V = L && L[vi - 1]; return (V && V.special) || null; }
function varLockText(ch, vi) { return varSpecial(ch.id, vi) === 'arcade' ? `CLEAR ARCADE WITH ${ch.name}` : `REACH LV ${VAR_UNLOCK[vi]}`; }
// fallback for fighters added later without designs: hue rotations
const VAR_FALLBACK = [{ n: 'ALT I', rules: [{ dh: 120 }] }, { n: 'ALT II', rules: [{ dh: 220 }] }, { n: 'SHADOW', rules: [{ grey: 'also', l: [0.5, 1], lm: 0.35 }] }, { n: 'SOUL', glow: '#ffd860', rules: [{ hue: 45, s: 1.1 }] }];
function varDef(ch, vi) { return vi > 0 ? ((VARIANTS[ch.id] || VAR_FALLBACK)[vi - 1] || null) : null; }
function varName(ch, vi) { const V = varDef(ch, vi); return V ? V.n : 'ORIGINAL'; }
function varFn(ch, vi) {
  const V = varDef(ch, vi); if (!V) return null;
  const c = ch._rc || (ch._rc = []);
  if (c[vi]) return c[vi];
  const sk = ch.colors.skin, hd = ch.colors.hand, near = (a, b) => { const p = rcParse(a), q = rcParse(b); return p && q && Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) < 48; };
  return (c[vi] = rcMaker(V, V.keep === false || !sk ? [] : hd && hd !== sk && near(sk, hd) ? [sk, hd] : [sk]));
}
// mapped copy of a palette object (cached per palette object)
const VAR_PAL = new WeakMap();
function varPal(ch, vi, pal) {
  const fn = varFn(ch, vi); if (!fn || !pal) return pal;
  let m = VAR_PAL.get(pal); if (!m) VAR_PAL.set(pal, m = []);
  if (m[vi]) return m[vi];
  const V = varDef(ch, vi), src = V && V.cos ? { ...pal, ...(V.pal || {}), cos: V.cos } : pal;   // arcade skins: costume colours + parts (09cz_arcade.js)
  const o = {}; for (const k in src) o[k] = typeof src[k] === 'string' && k !== 'cos' ? fn(src[k]) : src[k];
  return (m[vi] = o);
}
function varSwatch(ch, vi) { const fn = varFn(ch, vi) || (v => v), c = (vi && ch.varColors && ch.varColors(vi)) || ch.colors; return [fn(c.top || c.skin || c.accent), fn(c.hair || c.leg || c.accent), fn(c.accent)]; }
// effective variants of a match: a mirror match with identical colours gives P2 the next colour
function cfgVariants(cfg) {
  const v1 = clamp(cfg.v1 | 0, 0, VAR_N - 1); let v2 = clamp(cfg.v2 | 0, 0, VAR_N - 1);
  if (cfg.p1 === cfg.p2 && v1 === v2) v2 = v2 + 1 >= VAR_N - 1 ? 0 : v2 + 1;   // (never hands out the arcade skin)
  return [v1, v2];
}

// portraits / cards / cut-ins per variant (built on first use)
const VAR_ART = { portrait: [300, 300, { scale: 3.0 }, 1 / 3], card: [100, 186, { scale: 2.1, hy: 0.4, hx: 0.45 }, 0.5], cutin: [760, 190, { scale: 6.5, hx: 0.4, hy: 0.5, glow: true, expr: 'shout', bg1: '#000000' }, 0.5] };
function chArt(ch, vi, k) {
  const fn = vi ? varFn(ch, vi) : null; if (!fn) return ch[k];
  const A = ch._art || (ch._art = {}), key = vi + k, px = Settings.pixel;
  let e = A[key];
  if (!e) {
    const [w, h, o] = VAR_ART[k], mr = Math.random;
    if (typeof NetRng !== 'undefined') Math.random = NetRng.orig;   // never touch the online sim RNG
    const vp = ch.varColors && ch.varColors(vi), o2 = vp ? { ...o, pal: vp } : o;   // ch.varColors(vi): optional outfit palette for a variant (Kanae / Tokine LV 10)
    try { e = A[key] = { hd: withRecolor(fn, () => makePortrait(ch, w, h, o2)), px: null }; } finally { Math.random = mr; }
  }
  if (!px) return e.hd;
  return e.px || (e.px = PIX.pixelizeCanvas(e.hd, VAR_ART[k][3], { outline: true, step: 18 }));
}

// ---------------- mastery profile ----------------
const Mastery = {
  KEY: 'sb_profile_v1', MAX: 10, d: null,
  need(lv) { return 120 + 80 * (lv - 1); },       // XP from lv to lv+1 (LV 10 = 3960 XP in total)
  info(xp) { let lv = 1, x = xp; while (lv < this.MAX && x >= this.need(lv)) { x -= this.need(lv); lv++; } return { lv, x, n: lv < this.MAX ? this.need(lv) : 0, xp }; },
  fresh() { return { v: 1, profile: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e9).toString(36), upd: 0, chars: {}, pick: {} }; },
  load() {
    let d = null; try { d = JSON.parse(localStorage.getItem(this.KEY)); } catch (e) { }
    this.d = d && d.v === 1 && d.chars ? d : this.fresh(); if (!this.d.pick) this.d.pick = {};
    this.migrate(this.d);
    return this.d;
  },
  // Aimi's MIDNIGHT DRESS moved from slot 3 to the arcade slot 5 (all fighters now have their arcade skin in slot 5)
  migrate(d) {
    if (d.unl && d.unl['aimi:3']) { delete d.unl['aimi:3']; d.unl['aimi:5'] = 1; if ((d.pick.aimi | 0) === 3) d.pick.aimi = 5; }
  },
  get data() { return this.d || this.load(); },
  save() { this.data.upd = Date.now(); try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch (e) { } },
  rec(id) { const c = this.data.chars; return c[id] || (c[id] = { xp: 0, w: 0, l: 0 }); },
  level(id) { return this.info(this.rec(id).xp).lv; },
  unlocked(id, vi) {
    if (vi <= 0) return true;
    const sp = varSpecial(id, vi);   // a skin with its own unlock condition (not a level): saved in data.unl, the hidden cheat opens it too
    if (sp) return !!((this.data.unl && this.data.unl[id + ':' + vi]) || this.data.clean);
    return this.level(id) >= VAR_UNLOCK[vi];
  },
  pick(id) { const v = this.data.pick[id] | 0; return this.unlocked(id, v) ? v : 0; },
  setPick(id, vi) { if (this.data.pick[id] !== vi) { this.data.pick[id] = vi; this.save(); } },
  // XP for the local player at the end of a match; returns what the results screen shows
  award(bt) {
    const c = bt.cfg; let side, src;
    if (c.online) { side = bt.lp | 0; src = 'online'; } else if (c.cpu) { side = 0; src = c.cpu.arcade ? 'arcade' : 'cpu'; } else return null;
    if (bt.mode !== 'versus' || bt.practice) return null;
    const F = side ? bt.p2 : bt.p1, rw = bt.wins[side], ro = bt.wins[1 - side], won = rw >= 2;
    const mul = src === 'online' ? 1.5 : [0.7, 1, 1.4][c.cpu.level] || 1;
    let xp = (won ? 80 : 30) + 15 * rw + (won && ro === 0 ? 25 : 0);
    if (src === 'cpu') xp *= 0.4;
    xp *= mul;
    const clear = src === 'arcade' && won && c.arcade && c.arcade.i + 1 >= c.arcade.order.length;
    if (clear) xp += 200 * mul;
    xp = Math.round(xp);
    const id = F.ch.id, r = this.rec(id), before = this.info(r.xp);
    r.xp += xp; if (won) r.w++; else r.l++;
    const after = this.info(r.xp), unlocks = [];
    for (let v = 1; v < VAR_N; v++) if (!varSpecial(id, v) && before.lv < VAR_UNLOCK[v] && after.lv >= VAR_UNLOCK[v]) unlocks.push(v);
    if (clear) for (let v = 1; v < VAR_N; v++) if (varSpecial(id, v) === 'arcade' && !this.unlocked(id, v)) { (this.data.unl || (this.data.unl = {}))[id + ':' + v] = 1; unlocks.push(v); }
    this.save();
    return { ch: F.ch, gained: xp, before, after, unlocks, src, clear };
  },
  // for a future account system: the whole profile as JSON, and a merge that never loses progress
  export() { return JSON.parse(JSON.stringify(this.data)); },
  import(o) {
    if (!o || o.v !== 1 || !o.chars) return false;
    const d = this.data;
    for (const id in o.chars) { const a = this.rec(id), b = o.chars[id]; if ((b.xp | 0) > a.xp) Object.assign(a, { xp: b.xp | 0, w: b.w | 0, l: b.l | 0 }); }
    if (o.unl && typeof o.unl === 'object') { d.unl = d.unl || {}; for (const k in o.unl) if (o.unl[k]) d.unl[k === 'aimi:3' ? 'aimi:5' : k] = 1; }   // special skin unlocks only ever add
    const pk = { ...(o.pick || {}) }; if (o.unl && o.unl['aimi:3'] && (pk.aimi | 0) === 3) pk.aimi = 5;
    Object.assign(d.pick, pk); this.save(); return true;
  },
};

// ---------------- fighters: palette, drawing, projectiles ----------------
{
  const cg = Object.getOwnPropertyDescriptor(Fighter.prototype, 'colors').get;
  Object.defineProperty(Fighter.prototype, 'colors', { configurable: true, get() { const c = cg.call(this); return this.variant ? varPal(this.ch, this.variant, c) : c; } });
  const fd = Fighter.prototype.draw;
  Fighter.prototype.draw = function (g) {
    const fn = this.variant ? varFn(this.ch, this.variant) : null;
    if (!fn) return fd.call(this, g);
    const V0 = varDef(this.ch, this.variant), pc = RC.cos; RC.cos = V0 && V0.cos ? this.ch.id : null;
    try { withRecolor(fn, () => fd.call(this, g)); } finally { RC.cos = pc; }
    const V = varDef(this.ch, this.variant);
    if (V.glow && !this.hidden) {     // top-tier colour: rising soul sparks (draw-only, deterministic from T)
      const T = this.T, s = this.s;
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = V.glow;
      for (let i = 0; i < 7; i++) {
        const ph = ((T * 0.8 + i * 41) % 96) / 96, x = this.x + Math.sin(i * 2.3 + T * 0.035) * 44 * s, y = this.y - 10 * s - ph * 200 * s, z = (i % 3 ? 2.5 : 4) * (1 - ph * 0.5);
        g.globalAlpha = Math.sin(ph * Math.PI) * 0.75; g.fillRect(x - z / 2, y - z / 2, z, z);
      }
      g.restore();
    }
  };
  const pd = Proj.prototype.draw;
  Proj.prototype.draw = function (g) {
    const o = this.owner, fn = o && o.variant ? varFn(o.ch, o.variant) : null;
    return fn ? withRecolor(fn, () => pd.call(this, g)) : pd.call(this, g);
  };
  const nr = Battle.prototype.newRound;
  Battle.prototype.newRound = function (first) {
    const r = nr.call(this, first);
    const [v1, v2] = cfgVariants(this.cfg); this.p1.variant = v1; this.p2.variant = v2;
    return r;
  };
}

// figures drawn through artFigure() (select, VS, results) take the next recolour from RC_ART
let RC_ART = null;
{
  const af = artFigure;
  artFigure = function (g, x, y, sc, fn) { const f = RC_ART && RC_ART.length ? RC_ART.shift() : null; return f ? withRecolor(f, () => af(g, x, y, sc, fn)) : af(g, x, y, sc, fn); };
}
function withVarPal(pairs, body) {   // pairs [[ch, vi], ...]: menu figures of these fighters use their variant outfit (ch.varColors)
  const m = {}; for (const [ch, vi] of pairs) { const p = ch && ch.varColors && ch.varColors(vi); if (!p) continue; m[ch.id] = m[ch.id] === undefined ? p : null; }
  const prev = RC.pal; RC.pal = m; try { return body(); } finally { RC.pal = prev; }
}
function withArt(list, body) { const prev = RC_ART; RC_ART = list; try { return body(); } finally { RC_ART = prev; } }

// ---------------- character select: mastery bar + colour picker ----------------
function drawMasteryBar(g, x, y, w, id, right, lvOverride) {
  const inf = Mastery.info(Mastery.rec(id).xp), lv = lvOverride || inf.lv, max = lv >= Mastery.MAX;
  g.save(); g.textBaseline = 'middle'; g.textAlign = right ? 'right' : 'left';
  g.font = `italic 900 15px ${FONT_T}`; strokeText(g, `MASTERY LV ${lv}${max ? ' ★' : ''}`, x, y, max ? '#ffd84a' : '#ffffff', OUTLINE, 4);
  if (!lvOverride) {
    const bx = right ? x - w : x, by = y + 11, k = max ? 1 : inf.x / inf.n;
    g.fillStyle = 'rgba(8,4,18,0.85)'; g.fillRect(bx - 1, by - 1, w + 2, 9);
    const gr = g.createLinearGradient(bx, 0, bx + w, 0); gr.addColorStop(0, '#ffd84a'); gr.addColorStop(1, '#ff6a2a'); g.fillStyle = gr; g.fillRect(bx, by, w * k, 7);
    g.font = `700 11px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.textAlign = right ? 'left' : 'right';
    g.fillText(max ? 'MAX' : `${inf.x}/${inf.n} XP`, right ? x - w : x + w, y);
  }
  g.restore();
}
function swatchRect(s, vi) { const left = s === 0, sz = 26, gap = 6; return { x: left ? 34 + vi * (sz + gap) : W - 34 - (VAR_N - vi) * (sz + gap) + gap, y: 294, w: sz, h: 22 }; }
{
  const P = CharSelectScene.prototype;
  P.vsInit = function () { if (!this.vs) { this.vs = [0, 0]; this.vc = [-1, -1]; } };
  P.localSlot = function (s) { return this.single || this instanceof NetSelectScene ? s === 0 : true; };
  P.syncVs = function () {
    this.vsInit();
    for (let s = 0; s < 2; s++) {
      if (this.vc[s] === this.cur[s]) continue;
      this.vc[s] = this.cur[s];
      if (this.localSlot(s)) this.vs[s] = Mastery.pick(CHARS[this.cur[s]].id);
      else if (!(this instanceof NetSelectScene)) this.vs[s] = 0;
    }
  };
  P.cycleVs = function (s, d) {
    const id = CHARS[this.cur[s]].id; let v = this.vs[s];
    for (let k = 0; k < VAR_N; k++) { v = (v + d + VAR_N) % VAR_N; if (Mastery.unlocked(id, v)) break; }
    if (v !== this.vs[s]) { this.vs[s] = v; Mastery.setPick(id, v); this.ropes[s] = {}; Sound.play('menuMove'); }
  };
  const up = P.update;
  P.update = function () {
    this.syncVs();
    const slots = this.single ? [this.ready[0] ? null : 0] : [0, 1];
    for (const s of slots) {
      if (s === null || this.ready[s]) continue;
      const pid = this.single ? 1 : s + 1;
      if (UI.p(pid, 'sp1')) this.cycleVs(s, -1);
      if (UI.p(pid, 'sp2')) this.cycleVs(s, 1);
      if (Mouse.clicked) for (let v = 0; v < VAR_N; v++) if (inRect(swatchRect(s, v))) {
        Mouse.clicked = false;
        const id = CHARS[this.cur[s]].id;
        if (Mastery.unlocked(id, v)) { if (v !== this.vs[s]) { this.vs[s] = v; Mastery.setPick(id, v); this.ropes[s] = {}; Sound.play('menuMove'); } }
        else { this.lockMsg = { s, v, t: 70 }; Sound.play('menuBack'); }
      }
    }
    if (this.lockMsg && --this.lockMsg.t <= 0) this.lockMsg = null;
    const vs = this.vs.slice();
    up.call(this);
    this.syncVs();
    if (scene !== this && scene && scene.cfg && !(this instanceof NetSelectScene)) { scene.cfg.v1 = vs[0]; scene.cfg.v2 = this.single ? 0 : vs[1]; }
  };
  const ds = P.drawSide;
  P.drawSide = function (g, s, t) {
    this.syncVs();
    const ch = CHARS[this.cur[s]], vi = this.vs[s];
    withVarPal([[ch, vi]], () => withArt([varFn(ch, vi)], () => ds.call(this, g, s, t)));
    const hidden = this.single && s === 1 && (!this.ready[0] || this.cpu?.arcade);
    const net = this instanceof NetSelectScene;
    if (hidden || (!this.localSlot(s) && !net)) return;
    const left = s === 0, x = left ? 34 : W - 34, local = this.localSlot(s);
    g.save();
    g.fillStyle = 'rgba(8,4,20,0.6)'; g.fillRect(left ? 26 : W - 26 - 300, 268, 300, 68);
    drawMasteryBar(g, x, 278, 230, ch.id, !left, local ? 0 : (this.rlv || 1));
    for (let v = 0; v < VAR_N; v++) {
      const r = swatchRect(s, v), open = !local || Mastery.unlocked(ch.id, v), sel = v === vi;
      if (!local && !sel) continue;
      const sw = varSwatch(ch, v);
      g.globalAlpha = open ? 1 : 0.35;
      g.fillStyle = sw[0]; g.fillRect(r.x, r.y, r.w, r.h / 2); g.fillStyle = sw[1]; g.fillRect(r.x, r.y + r.h / 2, r.w * 0.6, r.h / 2); g.fillStyle = sw[2]; g.fillRect(r.x + r.w * 0.6, r.y + r.h / 2, r.w * 0.4, r.h / 2);
      g.globalAlpha = 1;
      if (varDef(ch, v) && varDef(ch, v).glow) { g.fillStyle = '#ffd84a'; g.fillRect(r.x + r.w - 6, r.y - 3, 6, 6); }
      if (!open) { g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(r.x, r.y, r.w, r.h); g.font = `800 10px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText(varSpecial(ch.id, v) ? '★' : 'LV' + VAR_UNLOCK[v], r.x + r.w / 2, r.y + r.h / 2 + 1); }
      g.lineWidth = sel ? 3 : 1.5; g.strokeStyle = sel ? '#ffffff' : 'rgba(255,255,255,0.3)'; g.strokeRect(r.x, r.y, r.w, r.h);
    }
    const lm = this.lockMsg && this.lockMsg.s === s ? this.lockMsg : null;
    g.font = `italic 800 13px ${FONT_UI}`; g.textBaseline = 'middle'; g.textAlign = left ? 'left' : 'right';
    const nx = local ? (left ? 34 + VAR_N * 32 + 4 : W - 34 - VAR_N * 32 - 4) : (left ? 34 + 34 : W - 34 - 34);
    const txt = lm ? `${varName(ch, lm.v)} · ${varLockText(ch, lm.v)}` : varName(ch, vi);
    strokeText(g, txt, nx, 305, lm ? '#ff9ab0' : vi ? '#ffd84a' : '#e8e0ff', OUTLINE, 3);
    if (local && !this.ready[s]) {
      const keys = Settings.mobile ? 'TAP A COLOR' : this.single || s === 0 ? `COLOR: ${keyName(B(1, 'sp1'))} / ${keyName(B(1, 'sp2'))}` : `COLOR: ${keyName(B(2, 'sp1'))} / ${keyName(B(2, 'sp2'))}`;
      g.font = `700 11px ${FONT_UI}`; g.fillStyle = '#a89cd0'; g.fillText(keys, x, 326);
    }
    g.restore();
  };
}
function keyName(code) { return !code ? '?' : code.startsWith('Key') ? code.slice(3) : code.startsWith('Digit') ? code.slice(5) : code.replace('Arrow', ''); }

// ---------------- VS screen + results ----------------
{
  const vd = VSScene.prototype.draw;
  VSScene.prototype.draw = function (g) { const [v1, v2] = cfgVariants(this.cfg); return withVarPal(this.a === this.b ? [] : [[this.a, v1], [this.b, v2]], () => withArt([varFn(this.a, v1), varFn(this.b, v2)], () => vd.call(this, g))); };

  const RP = ResultsScene.prototype, ru = RP.update, rd = RP.draw;
  RP.update = function () {
    if (!this.mx && !this.mxDone) { this.mxDone = true; this.mx = Mastery.award(this.bt); }
    return ru.call(this);
  };
  RP.draw = function (g) {
    if (!this.mxDone) { this.mxDone = true; this.mx = Mastery.award(this.bt); }
    const F = this.win;
    withVarPal([[F.ch, F.variant]], () => withArt([varFn(F.ch, F.variant)], () => rd.call(this, g)));
    if (this.mx) drawMasteryGain(g, this.mx, this.t);
  };
}
function drawMasteryGain(g, M, t) {
  const x = 24, y = 606, w = 560, h = 84, k = clamp((t - 30) / 70, 0, 1), e = 1 - Math.pow(1 - k, 3);
  const xp = Math.round(M.before.xp + (M.after.xp - M.before.xp) * e), inf = Mastery.info(xp), max = inf.lv >= Mastery.MAX;
  g.save();
  panel(g, x, y, w, h, 'rgba(10,6,24,0.88)', 'rgba(255,216,74,0.5)');
  g.textBaseline = 'middle'; g.textAlign = 'left';
  g.font = `italic 900 20px ${FONT_T}`; strokeText(g, `${M.ch.name} MASTERY`, x + 18, y + 22, '#ffffff', OUTLINE, 4);
  g.font = `italic 900 26px ${FONT_T}`; strokeText(g, `LV ${inf.lv}`, x + 18, y + 56, max ? '#ffd84a' : '#ffffff', OUTLINE, 5);
  const bx = x + 110, by = y + 50, bw = 300;
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(bx - 2, by - 2, bw + 4, 16);
  const gr = g.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#ffd84a'); gr.addColorStop(1, '#ff6a2a'); g.fillStyle = gr; g.fillRect(bx, by, bw * (max ? 1 : inf.x / inf.n), 12);
  g.font = `700 13px ${FONT_UI}`; g.fillStyle = '#e8e0ff'; g.fillText(max ? 'MAX LEVEL' : `${inf.x} / ${inf.n} XP`, bx, by - 12);
  g.textAlign = 'right'; g.font = `italic 900 22px ${FONT_T}`; strokeText(g, `+${M.gained} XP`, x + w - 18, y + 26, '#7affc0', OUTLINE, 4);
  g.font = `700 12px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.fillText(M.src === 'online' ? 'ONLINE MATCH' : M.src === 'arcade' ? (M.clear ? 'ARCADE CLEAR BONUS' : 'ARCADE') : 'VS CPU', x + w - 18, y + 50);
  if (M.after.lv > M.before.lv && k >= 1) { g.font = `italic 900 18px ${FONT_T}`; strokeText(g, 'LEVEL UP!', x + w - 18, y + 70, t % 20 < 12 ? '#ffd84a' : '#ffffff', OUTLINE, 4); }
  g.restore();
  // unlock toasts
  if (k < 1) return;
  M.unlocks.forEach((v, i) => {
    const a = clamp((t - 100 - i * 20) / 12, 0, 1); if (a <= 0) return;
    const tx = x, ty = y - 96 - i * 92, tw = 420, th = 84;
    g.save(); g.globalAlpha = a; g.translate((1 - a) * -60, 0);
    panel(g, tx, ty, tw, th, 'rgba(30,14,4,0.92)', '#ffd84a');
    const cd = chArt(M.ch, v, 'card'); g.drawImage(cd, tx + 8, ty + 6, 39, 72);
    g.textBaseline = 'middle'; g.textAlign = 'left';
    g.font = `italic 900 18px ${FONT_T}`; strokeText(g, M.ch.varColors && M.ch.varColors(v) ? 'NEW SKIN UNLOCKED!' : 'NEW COLOR UNLOCKED!', tx + 60, ty + 22, t % 30 < 18 ? '#ffd84a' : '#ffffff', OUTLINE, 4);
    g.font = `italic 900 22px ${FONT_T}`; strokeText(g, varName(M.ch, v), tx + 60, ty + 50, '#ffffff', OUTLINE, 4);
    g.font = `700 12px ${FONT_UI}`; g.fillStyle = '#ffe2a8'; g.fillText(`${M.ch.name} · choose it in character select`, tx + 60, ty + 72);
    g.restore();
  });
}

// ---------------- online: send the chosen colour + mastery level during character select ----------------
{
  const ns = Net.send.bind(Net);
  Net.send = function (o) {
    const sc = scene;
    if (o && sc instanceof NetSelectScene) {
      sc.vsInit();
      if (o.t === 'sel') { o.v = sc.vs[0]; o.lv = Mastery.level(CHARS[sc.cur[0]].id); sc.sentV = o.v + ':' + sc.cur[0]; }
      if (o.t === 'start' && o.cfg) { o.cfg.v1 = sc.vs[0]; o.cfg.v2 = sc.vs[1]; }
    }
    return ns(o);
  };
  const NP = NetSelectScene.prototype, nu = NP.update, no = NP.onNet;
  NP.onNet = function (d) {
    if (d.t === 'sel') { this.vsInit(); this.vs[1] = clamp(d.v | 0, 0, VAR_N - 1); this.rlv = clamp(d.lv | 0, 1, Mastery.MAX); this.ropes[1] = {}; }
    return no.call(this, d);
  };
  NP.update = function () {
    this.vsInit();
    const rs = Net.remoteSel; if (!this.rsInit && rs) { this.rsInit = true; this.vs[1] = clamp(rs.v | 0, 0, VAR_N - 1); this.rlv = rs.lv | 0; this.vc[1] = this.cur[1]; }
    const r = nu.call(this);
    if (scene === this && this.sentV !== undefined && this.sentV !== this.vs[0] + ':' + this.cur[0]) Net.send({ t: 'sel', cur: this.cur[0], ready: this.ready[0] });
    return r;
  };
}

// ---------------- hidden cheat: in SETTINGS, hover "TOGGLE FULLSCREEN" with the mouse and type C-H-E-A-T ----------------
Mastery.unlockAll = function () { let max = 0; for (let lv = 1; lv < this.MAX; lv++) max += this.need(lv); for (const c of CHARS) { const r = this.rec(c.id); if (r.xp < max) r.xp = max; } this.save(); };
{
  const SP = SettingsScene.prototype, su = SP.update, sd = SP.draw, WORD = ['KeyC', 'KeyH', 'KeyE', 'KeyA', 'KeyT'];
  SP.update = function () {
    const i = this.items.findIndex(it => it.id === 'fullscreen'), hover = i >= 0 && inRect(this.menu.rect(i));
    if (!hover) this.cheatN = 0;
    else for (const k of Keys.pressed) {
      if (!k.startsWith('Key')) continue;
      this.cheatN = k === WORD[this.cheatN | 0] ? (this.cheatN | 0) + 1 : k === WORD[0] ? 1 : 0;
      if (this.cheatN === WORD.length) { this.cheatN = 0; Mastery.unlockAll(); this.cheatT = 150; Sound.play('victory'); Sound.play('impactBig'); }
    }
    if (hover && (this.cheatN | 0) > 0) { Keys.pressed.clear(); Mouse.clicked = false; }   // typing the word must not change settings
    if (this.cheatT > 0) this.cheatT--;
    return su.call(this);
  };
  SP.draw = function (g) {
    sd.call(this, g);
    const t = this.cheatT | 0; if (t <= 0) return;
    const a = Math.min(1, t / 20, (150 - t) / 8);
    g.save(); g.globalAlpha = a * 0.35 * (t > 135 ? 1 : 0.4); g.fillStyle = '#ffd84a'; g.fillRect(0, 0, W, H); g.globalAlpha = a;
    g.fillStyle = 'rgba(10,6,24,0.9)'; g.fillRect(0, H / 2 - 70, W, 140);
    g.save(); g.translate(W / 2, H / 2 - 18); g.scale(1 + Math.max(0, t - 135) * 0.04, 1 + Math.max(0, t - 135) * 0.04);
    drawTitleText(g, 'CHEAT ACTIVATED!', 0, 0, 64, t % 16 < 9 ? '#ffd84a' : '#ffffff', '#ff2a3a'); g.restore();
    g.font = `800 20px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff';
    g.fillText('ALL FIGHTERS MASTERY LV 10 · ALL COLORS UNLOCKED', W / 2, H / 2 + 38);
    for (let k = 0; k < 24; k++) { const ph = ((150 - t) * 3 + k * 53) % 300; g.fillStyle = k % 2 ? '#ffd84a' : '#ff6a2a'; g.fillRect((k * 97) % W, H / 2 + 70 + ph - 300, 6, 6); }
    g.restore();
  };
}
