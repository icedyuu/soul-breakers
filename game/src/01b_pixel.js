// ============================ PIXEL-ART RENDERING ============================
// The world is rendered at 640×360 (1 art pixel = 2 logical pixels) and upscaled without smoothing.
// pxProcess() turns anti-aliased vector art into pixel art: hard (ordered-dithered) alpha, a reduced
// colour palette with Bayer dithering, an automatic 1-px outline and a stage-coloured rim light.
const PX_FAMILY = 'PixelArcade';
const PXS = 2, PW = W / PXS, PH = H / PXS, PX_ZOOM = 1.15;
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const OUT_RGB = [18, 10, 22];
const PX_LUT = new Map(), PX_THR = BAYER4.map(b => Math.floor(b * 255));
function pxLut(step) {
  let L = PX_LUT.get(step); if (L) return L;
  L = new Uint8Array(256 * 16);
  for (let v = 0; v < 256; v++) for (let k = 0; k < 16; k++) L[v * 16 + k] = Math.min(255, Math.floor((v + BAYER4[k] * step) / step) * step);
  PX_LUT.set(step, L); return L;
}
// region version: (rx, ry) is where the w×h block sits in the canvas; dithering uses absolute coords so it never crawls
function pxProcess(g, w, h, o = {}, rx = 0, ry = 0) {
  rx = Math.max(0, Math.floor(rx)); ry = Math.max(0, Math.floor(ry));
  w = Math.min(Math.ceil(w), g.canvas.width - rx); h = Math.min(Math.ceil(h), g.canvas.height - ry);
  if (w <= 0 || h <= 0) return;
  const img = g.getImageData(rx, ry, w, h), d = img.data, u32 = new Uint32Array(d.buffer), L = pxLut(o.step || 22), solidA = o.solidA || 150;
  const solid = o.outline || o.rim ? new Uint8Array(w * h) : null, hard = o.hardAlpha ? 1.6 : 1;
  const amb = o.amb, ar = amb ? amb.c[0] : 0, ag = amb ? amb.c[1] : 0, ab = amb ? amb.c[2] : 0, as = amb ? amb.s : 0;
  let bx0 = w, bx1 = -1, by0 = h, by1 = -1;
  for (let y = 0, k = 0; y < h; y++) {
    const by = ((y + ry) & 3) * 4;
    for (let x = 0; x < w; x++, k++) {
      if (u32[k] === 0) continue;
      const i = k * 4, a = d[i + 3]; if (a === 0) continue;
      const bi = by + ((x + rx) & 3);
      if (a < 250 && a <= PX_THR[bi] * hard) { u32[k] = 0; continue; }
      if (solid && a > solidA) { solid[k] = 1; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
      let r = d[i], gg = d[i + 1], bb = d[i + 2];
      if (as) { r += (ar - r) * as; gg += (ag - gg) * as; bb += (ab - bb) * as; }
      d[i] = L[(r | 0) * 16 + bi]; d[i + 1] = L[(gg | 0) * 16 + bi]; d[i + 2] = L[(bb | 0) * 16 + bi]; d[i + 3] = 255;
    }
  }
  const X0 = Math.max(1, bx0 - 1), X1 = Math.min(w - 2, bx1 + 1), Y0 = Math.max(1, by0 - 1), Y1 = Math.min(h - 2, by1 + 1);
  if (o.rim && bx1 >= 0) {
    const { c, dx, dy, s } = o.rim, off = dy * w + dx;
    for (let y = Y0; y <= Y1; y++) for (let x = X0, k = y * w + X0; x <= X1; x++, k++) {
      if (!solid[k] || solid[k + off]) continue;
      const i = k * 4; d[i] += (c[0] - d[i]) * s; d[i + 1] += (c[1] - d[i + 1]) * s; d[i + 2] += (c[2] - d[i + 2]) * s;
    }
  }
  if (o.outline && bx1 >= 0) {
    const OUT = (255 << 24) | (OUT_RGB[2] << 16) | (OUT_RGB[1] << 8) | OUT_RGB[0], ox0 = Math.max(0, bx0 - 1), ox1 = Math.min(w - 1, bx1 + 1);
    for (let y = Math.max(0, by0 - 1); y <= Math.min(h - 1, by1 + 1); y++) for (let x = ox0, k = y * w + ox0; x <= ox1; x++, k++) {
      if (solid[k] || u32[k] !== 0) continue;
      if ((x > 0 && solid[k - 1]) || (x < w - 1 && solid[k + 1]) || (y > 0 && solid[k - w]) || (y < h - 1 && solid[k + w])) u32[k] = OUT;
    }
  }
  g.putImageData(img, rx, ry);
}
function cpuCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true }); return g; }
const PIX = {
  L: null, spr: null, cacheMap: new Map(),
  init() {
    if (this.L) return;
    const bg = document.createElement('canvas'); bg.width = PW; bg.height = PH;
    this.L = { bg: bg.getContext('2d'), a: cpuCanvas(PW, PH), c: cpuCanvas(PW, PH) };
    this.spr = cpuCanvas(PW, PH);
  },
  begin(g, clear = true) { g.setTransform(1, 0, 0, 1, 0, 0); if (clear) g.clearRect(0, 0, PW, PH); g.imageSmoothingEnabled = false; g.setTransform(1 / PXS, 0, 0, 1 / PXS, 0, 0); },
  blit(g, src) { g.save(); g.imageSmoothingEnabled = false; g.drawImage(src.canvas, 0, 0, W, H); g.restore(); },
  // pixelize a static canvas once (portraits, stage layers, thumbnails)
  pixelizeCanvas(src, k, o = {}) {
    const w = Math.max(1, Math.round(src.width * k)), h = Math.max(1, Math.round(src.height * k)), g = cpuCanvas(w, h);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, w, h); pxProcess(g, w, h, o); return g.canvas;
  },
  // draw something in logical coords as pixel art into region (x,y,w,h) of g
  sprite(g, x, y, w, h, fn, o = { outline: true }) {
    x = Math.floor(x / PXS) * PXS; y = Math.floor(y / PXS) * PXS;
    const rw = Math.min(PW, Math.ceil(w / PXS)), rh = Math.min(PH, Math.ceil(h / PXS)), s = this.spr;
    s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, rw, rh);
    s.setTransform(1 / PXS, 0, 0, 1 / PXS, -x / PXS, -y / PXS);
    fn(s); s.setTransform(1, 0, 0, 1, 0, 0); pxProcess(s, rw, rh, o);
    g.save(); g.imageSmoothingEnabled = false; g.drawImage(s.canvas, 0, 0, rw, rh, x, y, rw * PXS, rh * PXS); g.restore();
  },
  // a full-screen layer drawn at pixel resolution (menu backdrops)
  screen(g, fn, o = {}) {
    this.init(); const L = this.L.c;
    this.begin(L); fn(L); L.setTransform(1, 0, 0, 1, 0, 0); pxProcess(L, PW, PH, o); this.blit(g, L);
  },
  // cached pixel-art canvas built from a drawing function
  cache(key, w, h, fn, o = {}) {
    let c = this.cacheMap.get(key); if (c) return c;
    const g = cpuCanvas(Math.ceil(w / PXS), Math.ceil(h / PXS)); g.setTransform(1 / PXS, 0, 0, 1 / PXS, 0, 0); fn(g); g.setTransform(1, 0, 0, 1, 0, 0);
    pxProcess(g, g.canvas.width, g.canvas.height, o); c = g.canvas; this.cacheMap.set(key, c); return c;
  },
};

// ------------------------------ bitmap arcade font ------------------------------
// 5×7 glyphs, rendered bold (horizontal dilation) and optionally slanted; any canvas text whose font
// family is PixelArcade is drawn with it (characters it lacks fall back to the next font in the list).
const PX_GLYPHS = (() => {
  const G = {
    A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|#...#|####.|#...#|#...#|####.', C: '.####|#....|#....|#....|#....|#....|.####', D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
    E: '#####|#....|#....|####.|#....|#....|#####', F: '#####|#....|#....|####.|#....|#....|#....', G: '.####|#....|#....|#..##|#...#|#...#|.####', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
    I: '#####|..#..|..#..|..#..|..#..|..#..|#####', J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..', K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
    M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|##..#|#.#.#|#..##|#...#|#...#|#...#', O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.', P: '####.|#...#|#...#|####.|#....|#....|#....',
    Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#', S: '.####|#....|#....|.###.|....#|....#|####.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
    U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.', V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..', W: '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
    Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
    0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', 1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.', 2: '.###.|#...#|....#|...#.|..#..|.#...|#####', 3: '####.|....#|....#|.###.|....#|....#|####.',
    4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 5: '#####|#....|####.|....#|....#|#...#|.###.', 6: '.###.|#....|#....|####.|#...#|#...#|.###.', 7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
    8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.', 9: '.###.|#...#|#...#|.####|....#|....#|.###.',
    '.': '.....|.....|.....|.....|.....|.....|..#..', ',': '.....|.....|.....|.....|.....|..#..|.#...', '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..', '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
    ':': '.....|..#..|.....|.....|.....|..#..|.....', ';': '.....|..#..|.....|.....|.....|..#..|.#...', '-': '.....|.....|.....|.###.|.....|.....|.....', '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
    '=': '.....|.....|#####|.....|#####|.....|.....', '/': '....#|...#.|...#.|..#..|.#...|.#...|#....', '(': '...#.|..#..|.#...|.#...|.#...|..#..|...#.', ')': '.#...|..#..|...#.|...#.|...#.|..#..|.#...',
    "'": '..#..|..#..|.....|.....|.....|.....|.....', '"': '.#.#.|.#.#.|.....|.....|.....|.....|.....', '#': '.#.#.|#####|.#.#.|.#.#.|.#.#.|#####|.#.#.', '%': '##..#|##.#.|...#.|..#..|.#...|.#.##|#..##',
    '&': '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#', '×': '.....|#...#|.#.#.|..#..|.#.#.|#...#|.....', '·': '.....|.....|.....|..#..|.....|.....|.....', '—': '.....|.....|.....|#####|.....|.....|.....',
    '~': '.....|.....|.#...|#.#.#|...#.|.....|.....', '…': '.....|.....|.....|.....|.....|.....|#.#.#', '→': '.....|..#..|...#.|#####|...#.|..#..|.....', '←': '.....|..#..|.#...|#####|.#...|..#..|.....',
    '↑': '..#..|.###.|#.#.#|..#..|..#..|..#..|.....', '↓': '.....|..#..|..#..|..#..|#.#.#|.###.|..#..', '<': '...#.|..#..|.#...|#....|.#...|..#..|...#.', '>': '.#...|..#..|...#.|....#|...#.|..#..|.#...',
    '*': '.....|#.#.#|.###.|#####|.###.|#.#.#|.....', '_': '.....|.....|.....|.....|.....|.....|#####', '∞': '.......|.##.##.|#..#..#|#..#..#|#..#..#|.##.##.|.......', '◆': '..#..|.###.|#####|.###.|..#..|.....|.....',
    '◇': '..#..|.#.#.|#...#|.#.#.|..#..|.....|.....', '★': '..#..|..#..|#####|.###.|.#.#.|#...#|.....', '[': '.###.|.#...|.#...|.#...|.#...|.#...|.###.', ']': '.###.|...#.|...#.|...#.|...#.|...#.|.###.',
    '✓': '.....|....#|...#.|#.#..|.#...|.....|.....', '▶': '#....|##...|###..|####.|###..|##...|#....', '◀': '....#|...##|..###|.####|..###|...##|....#',
  };
  G['’'] = G["'"]; G['‘'] = G["'"]; G['“'] = G['"']; G['”'] = G['"']; G['–'] = G['—']; G['−'] = G['-'];
  const out = {};
  for (const [ch, s] of Object.entries(G)) {
    const rows = s.split('|').map(r => [...r].map(c => c === '#'));
    let mn = 9, mx = -1; rows.forEach(r => r.forEach((on, x) => { if (on) { mn = Math.min(mn, x); mx = Math.max(mx, x); } }));
    const fixed = /[A-Z0-9]/.test(ch); if (fixed) { mn = 0; mx = 4; } if (mx < 0) { mn = 0; mx = 2; }
    const variant = slant => {
      const runs = [];
      rows.forEach((r, y) => {
        const thin = ch === '∞', on = Array(10).fill(false); r.forEach((v, x) => { if (v) { on[x - mn] = true; if (!thin) on[x - mn + 1] = true; } }); // bold: dilate right
        const off = slant ? Math.floor((6 - y) / 3) : 0;
        for (let x = 0; x < 10;) { if (!on[x]) { x++; continue; } let e = x; while (e < 10 && on[e]) e++; runs.push([x + off, y, e - x]); x = e; }
      });
      return runs;
    };
    out[ch] = { w: mx - mn + (ch === '∞' ? 1 : 2), runs: [variant(false), variant(true)] };
  }
  out[' '] = { w: 3, runs: [[], []] };
  return out;
})();
const pxNative = { fill: CanvasRenderingContext2D.prototype.fillText, stroke: CanvasRenderingContext2D.prototype.strokeText, measure: CanvasRenderingContext2D.prototype.measureText };
function pxFontInfo(g) {
  const f = g.font, m = f.match(/(\d+(?:\.\d+)?)px/), size = m ? +m[1] : 16, t = g.getTransform(), sc = Math.hypot(t.a, t.b) || 1;
  const ud = Math.max(1, Math.round(size * sc / 11)), u = ud / sc;   // integer device pixels per glyph pixel
  return { size, u, italic: /italic/.test(f), fallback: f.replace(new RegExp(PX_FAMILY + '\\s*,?\\s*'), '') };
}
function pxSegments(text) {
  const segs = []; let cur = null;
  for (const ch of String(text)) {
    const c = PX_GLYPHS[ch] ? ch : PX_GLYPHS[ch.toUpperCase()] && ch.toUpperCase().length === 1 ? ch.toUpperCase() : null, px = !!c;
    if (!cur || cur.px !== px) { cur = { px, s: '' }; segs.push(cur); }
    cur.s += px ? c : ch;
  }
  return segs;
}
function pxMeasure(g, text) {
  const fi = pxFontInfo(g); let w = 0;
  for (const sg of pxSegments(text)) {
    if (sg.px) { for (const ch of sg.s) w += (PX_GLYPHS[ch].w + 1) * fi.u; w += fi.italic ? fi.u : 0; }
    else { const f = g.font; g.font = fi.fallback; w += pxNative.measure.call(g, sg.s).width; g.font = f; }
  }
  return { w, fi };
}
function pxDraw(g, text, x, y, mode) {
  const { w, fi } = pxMeasure(g, text), u = fi.u, H7 = 7 * u;
  const al = g.textAlign, bl = g.textBaseline;
  let x0 = al === 'center' ? x - w / 2 : (al === 'right' || al === 'end') ? x - w : x;
  let top = bl === 'middle' ? y - H7 / 2 : (bl === 'top' || bl === 'hanging') ? y : (bl === 'bottom' || bl === 'ideographic') ? y - H7 - u : y - H7;
  const t = g.getTransform(), plain = !t.b && !t.c;
  if (plain) { x0 = Math.round(x0 * t.a) / t.a; top = Math.round(top * t.d) / t.d; }
  const path = new Path2D(), natives = []; let cx = x0;
  for (const sg of pxSegments(text)) {
    if (sg.px) { for (const ch of sg.s) { const G = PX_GLYPHS[ch]; for (const [rx, ry, rl] of G.runs[fi.italic ? 1 : 0]) path.rect(cx + rx * u, top + ry * u, rl * u, u); cx += (G.w + 1) * u; } if (fi.italic) cx += u; }
    else { const f = g.font; g.font = fi.fallback; const ww = pxNative.measure.call(g, sg.s).width; g.font = f; natives.push([sg.s, cx]); cx += ww; }
  }
  const drawNatives = fn => { if (!natives.length) return; const f = g.font, a = g.textAlign, b = g.textBaseline; g.font = fi.fallback; g.textAlign = 'left'; g.textBaseline = 'middle'; for (const [s, nx] of natives) fn.call(g, s, nx, top + H7 / 2); g.font = f; g.textAlign = a; g.textBaseline = b; };
  if (mode === 'stroke') {
    const o = Math.max(u, Math.round(g.lineWidth / 2 / u) * u), fs = g.fillStyle, sb = g.shadowBlur; g.fillStyle = g.strokeStyle; g.shadowBlur = 0;
    for (const [dx, dy] of [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, -o], [-o, o], [o, o], [0, o + u], [o, o + u]]) { g.translate(dx, dy); g.fill(path); g.translate(-dx, -dy); }
    g.fillStyle = fs; g.shadowBlur = sb; drawNatives(pxNative.stroke);
  } else { g.fill(path); drawNatives(pxNative.fill); }
}
CanvasRenderingContext2D.prototype.fillText = function (t, x, y, mw) { if (Settings.pixel && this.font.includes(PX_FAMILY)) return pxDraw(this, t, x, y, 'fill'); return pxNative.fill.call(this, t, x, y, mw); };
CanvasRenderingContext2D.prototype.strokeText = function (t, x, y, mw) { if (Settings.pixel && this.font.includes(PX_FAMILY)) return pxDraw(this, t, x, y, 'stroke'); return pxNative.stroke.call(this, t, x, y, mw); };
CanvasRenderingContext2D.prototype.measureText = function (t) {
  if (Settings.pixel && this.font.includes(PX_FAMILY)) { const { w, fi } = pxMeasure(this, t); return { width: w, actualBoundingBoxAscent: 7 * fi.u, actualBoundingBoxDescent: 0, actualBoundingBoxLeft: 0, actualBoundingBoxRight: w }; }
  return pxNative.measure.call(this, t);
};

// ------------------------------ pixel UI primitives ------------------------------
const snap2 = v => Math.round(v / 2) * 2;
function pxNotchPath(x, y, w, h, n = 4) {
  const p = new Path2D(), s = n / 2;
  p.moveTo(x + n, y); p.lineTo(x + w - n, y); p.lineTo(x + w - n, y + s); p.lineTo(x + w - s, y + s); p.lineTo(x + w - s, y + n); p.lineTo(x + w, y + n);
  p.lineTo(x + w, y + h - n); p.lineTo(x + w - s, y + h - n); p.lineTo(x + w - s, y + h - s); p.lineTo(x + w - n, y + h - s); p.lineTo(x + w - n, y + h);
  p.lineTo(x + n, y + h); p.lineTo(x + n, y + h - s); p.lineTo(x + s, y + h - s); p.lineTo(x + s, y + h - n); p.lineTo(x, y + h - n);
  p.lineTo(x, y + n); p.lineTo(x + s, y + n); p.lineTo(x + s, y + s); p.lineTo(x + n, y + s); p.closePath(); return p;
}
// arcade panel: notched corners, 2-px border, bevel highlight, hard drop shadow
function pxBox(g, x, y, w, h, fill, border, o = {}) {
  x = snap2(x); y = snap2(y); w = snap2(w); h = snap2(h);
  const n = o.n ?? 4, outer = pxNotchPath(x, y, w, h, n);
  if (o.shadow !== false) { g.save(); g.translate(4, 4); g.fillStyle = 'rgba(0,0,0,0.45)'; g.fill(outer); g.restore(); }
  g.fillStyle = fill; g.fill(outer);
  if (o.bands) { const bh = snap2(Math.max(2, h / o.bands.length)); g.save(); g.clip(outer); o.bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(x, y + i * bh, w, bh); }); g.restore(); }
  if (!o.flat) { g.fillStyle = 'rgba(255,255,255,0.13)'; g.fillRect(x + n, y + 2, w - 2 * n, 2); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + n, y + h - 4, w - 2 * n, 2); }
  if (border) { const inner = pxNotchPath(x + 2, y + 2, w - 4, h - 4, Math.max(2, n - 2)), p = new Path2D(); p.addPath(outer); p.addPath(inner); g.fillStyle = border; g.fill(p, 'evenodd'); }
}
function pxDiamond(g, cx, cy, r, fill, border) {
  cx = snap2(cx); cy = snap2(cy);
  for (let i = -r; i <= r; i += 2) { const half = r - Math.abs(i); if (border) { g.fillStyle = border; g.fillRect(cx - half - 2, cy + i, half * 2 + 4, 2); } }
  for (let i = -r + 2; i <= r - 2; i += 2) { const half = r - 2 - Math.abs(i); g.fillStyle = fill; g.fillRect(cx - half - 2, cy + i, half * 2 + 4, 2); }
}
