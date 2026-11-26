// ====================== STAGES 2: Midnight Academy, Clockwork Spire, Rune Forge ======================
// Same contract as 05_stages.js (layers / floor / update / worldBack / front). Optional extra hook:
// bgAnim(g, cam, t) is drawn right after the far layer in vector mode (pixel mode: STAGE_PX in 07bb).
// All animation here is visual only (no gameplay state), so online lockstep stays deterministic.

// screen position of a point on layer i (layer-canvas coords); d = 1 for screen px, PXS for art px
function layerPt(st, i, lx, ly, cam, d = 1) {
  const L = st.layers[i], X = -(cam.x - W / 2) * L.f - 130 + lx, Y = -(cam.y - H / 2) * L.f * 0.6 - LAYER_PAD + ly;
  return [(W / 2 + FX.sx * L.f + cam.z * (X - W / 2)) / d, (H / 2 + FX.sy * L.f + cam.z * (Y - H / 2)) / d, cam.z / d];
}
function gearShape(g, x, y, r, teeth, a, col) {
  const th = Math.max(4, r * 0.15), d = TAU / teeth;
  g.fillStyle = col; g.beginPath();
  for (let k = 0; k < teeth; k++) {
    const a0 = a + k * d;
    for (const [aa, rr] of [[a0, r - th], [a0 + d * 0.12, r], [a0 + d * 0.44, r], [a0 + d * 0.56, r - th]]) g.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr);
  }
  g.closePath(); g.fill();
  g.save(); g.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 5; k++) { const a0 = a + k * TAU / 5 + 0.2, a1 = a + (k + 1) * TAU / 5 - 0.2; g.beginPath(); g.arc(x, y, r * 0.66, a0, a1); g.arc(x, y, r * 0.32, a1, a0, true); g.closePath(); g.fill(); }
  g.beginPath(); g.arc(x, y, r * 0.09, 0, TAU); g.fill();
  g.restore();
}
function stRune(g, x, y, s, r) {
  // a small angular rune made of 2–3 strokes
  g.beginPath(); g.moveTo(x, y - s); g.lineTo(x, y + s);
  const k = Math.floor(r() * 4);
  if (k === 0) { g.moveTo(x, y - s); g.lineTo(x + s * 0.7, y - s * 0.3); g.lineTo(x, y + s * 0.2); }
  else if (k === 1) { g.moveTo(x - s * 0.6, y - s * 0.5); g.lineTo(x + s * 0.6, y + s * 0.1); g.moveTo(x + s * 0.6, y - s * 0.5); g.lineTo(x - s * 0.6, y + s * 0.1); }
  else if (k === 2) { g.moveTo(x, y - s * 0.2); g.lineTo(x + s * 0.6, y - s * 0.8); g.moveTo(x, y + s * 0.3); g.lineTo(x - s * 0.6, y - s * 0.3); }
  else { g.moveTo(x - s * 0.6, y + s); g.lineTo(x, y + s * 0.3); g.lineTo(x + s * 0.6, y + s); }
  g.stroke();
}
const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

const STAGES2 = [
  {
    id: 'school', name: 'MIDNIGHT ACADEMY', jp: '夜の学園', music: 'school',
    sky: ['#03040f', '#111b40', '#3b3a72'],
    moon: true,
    build() {
      const base = GROUND + LAYER_PAD - 20;
      this.layers = [
        layerCanvas(0.1, (g, w) => {
          const r = srand(41);
          const hz = g.createLinearGradient(0, base - 260, 0, base); hz.addColorStop(0, 'rgba(120,140,255,0)'); hz.addColorStop(1, 'rgba(140,150,255,0.22)'); g.fillStyle = hz; g.fillRect(0, base - 260, w, 260);
          for (let x = -10; x < w; x += 22 + r() * 40) {
            const bw = 28 + r() * 60, bh = 60 + r() * 170; g.fillStyle = '#0c1230'; g.fillRect(x, base - bh, bw, bh + 40);
            for (let wy = base - bh + 8; wy < base; wy += 11) for (let wx = x + 4; wx < x + bw - 5; wx += 8) if (r() < 0.16) { g.fillStyle = r() < 0.8 ? '#ffe2a0' : '#9fd8ff'; g.globalAlpha = 0.25 + r() * 0.45; g.fillRect(wx, wy, 3, 4); g.globalAlpha = 1; }
          }
          // radio tower on the skyline
          const tx = w * 0.3; this.towerTop = [tx, base - 470];
          g.fillStyle = '#0a0f26'; g.beginPath(); g.moveTo(tx - 26, base); g.lineTo(tx - 4, base - 420); g.lineTo(tx + 4, base - 420); g.lineTo(tx + 26, base); g.closePath(); g.fill();
          g.fillRect(tx - 24, base - 300, 48, 14); g.fillRect(tx - 1.5, base - 470, 3, 60);
          g.strokeStyle = '#0a0f26'; g.lineWidth = 2; for (let y = base - 20; y > base - 400; y -= 34) { const k = (base - y) / 420 * 22; g.beginPath(); g.moveTo(tx - 26 + k, y); g.lineTo(tx + 26 - k - 2, y - 34); g.stroke(); }
        }),
        layerCanvas(0.32, (g, w) => {
          const r = srand(7), x0 = 60, x1 = w - 60, top = base - 290, cx = w * 0.5; this.win1 = [];
          g.fillStyle = '#0a1226'; for (let x = 0; x < w; x += 50 + r() * 40) { g.beginPath(); g.arc(x, base - 300 + r() * 30, 40 + r() * 30, 0, TAU); g.fill(); }
          g.fillStyle = '#141a36'; g.fillRect(x0, top, x1 - x0, 330);
          g.fillStyle = '#20284e'; g.fillRect(x0 - 10, top - 10, x1 - x0 + 20, 12);
          // clock tower on the roof
          g.fillStyle = '#141a36'; g.fillRect(cx - 70, top - 120, 140, 125);
          g.fillStyle = '#20284e'; g.beginPath(); g.moveTo(cx - 84, top - 118); g.lineTo(cx, top - 170); g.lineTo(cx + 84, top - 118); g.closePath(); g.fill();
          g.fillStyle = '#e9e3c9'; g.beginPath(); g.arc(cx, top - 58, 34, 0, TAU); g.fill();
          g.strokeStyle = '#2a3058'; g.lineWidth = 5; g.stroke();
          g.strokeStyle = '#1a1a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, top - 58); g.lineTo(cx, top - 84); g.moveTo(cx, top - 58); g.lineTo(cx + 16, top - 50); g.stroke();
          for (let fl = 0; fl < 3; fl++) for (let x = x0 + 26; x < x1 - 50; x += 46) {
            const y = top + 26 + fl * 92, lit = r() < 0.14;
            if (lit) { g.fillStyle = 'rgba(255,220,140,0.18)'; g.fillRect(x - 5, y - 5, 44, 60); }
            g.fillStyle = lit ? '#ffe7a6' : '#0b1028'; g.fillRect(x, y, 34, 50);
            g.fillStyle = lit ? '#d9b46a' : '#232a52'; g.fillRect(x + 16, y, 2, 50); g.fillRect(x, y + 24, 34, 2);
            if (!lit && r() < 0.1) this.win1.push([x, y]);
          }
          // tournament banner hanging from the roof
          const bx = cx + 250; g.fillStyle = '#e8e4da'; g.fillRect(bx, top + 4, 44, 220); g.fillStyle = '#b8202e'; g.fillRect(bx, top + 4, 44, 6);
          g.font = `900 30px ${FONT_JPS}`; g.textAlign = 'center'; g.textBaseline = 'middle'; [...'祝全国大会'].forEach((ch, i) => g.fillText(ch, bx + 22, top + 34 + i * 40));
          // sakura trees in the courtyard, lit by the moon
          for (let x = 150; x < w; x += 340 + r() * 220) {
            g.fillStyle = '#120a14'; g.fillRect(x - 6, base - 170, 12, 190); g.beginPath(); g.moveTo(x, base - 120); g.lineTo(x - 50, base - 190); g.lineTo(x - 44, base - 196); g.lineTo(x + 2, base - 136); g.fill();
            for (let i = 0; i < 46; i++) { const a = r() * TAU, d = r() * 80; g.fillStyle = r() < 0.5 ? '#c97aa6' : '#f2b4d0'; g.globalAlpha = 0.35 + r() * 0.35; g.beginPath(); g.arc(x + Math.cos(a) * d * 1.2, base - 200 + Math.sin(a) * d * 0.6, 14 + r() * 16, 0, TAU); g.fill(); }
            g.globalAlpha = 1;
          }
        }),
        layerCanvas(0.62, (g, w) => {
          const top = base - 150;
          // rooftop fence: mesh, rails, posts
          g.save(); g.beginPath(); g.rect(0, top, w, 170); g.clip();
          g.strokeStyle = 'rgba(150,170,230,0.2)'; g.lineWidth = 1.2; g.beginPath();
          for (let x = -200; x < w + 200; x += 14) { g.moveTo(x, top); g.lineTo(x + 170, top + 170); g.moveTo(x, top); g.lineTo(x - 170, top + 170); }
          g.stroke(); g.restore();
          g.fillStyle = '#1a2042'; g.fillRect(0, top - 6, w, 6); g.fillRect(0, base - 40, w, 4);
          for (let x = 20; x < w; x += 150) g.fillRect(x, top - 8, 6, 190);
          // stairwell hut with a lit door window
          g.fillStyle = '#0a0d1e'; g.fillRect(140, base - 270, 230, 290); g.fillStyle = '#141a34'; g.fillRect(128, base - 284, 254, 16);
          g.fillStyle = '#05070f'; g.fillRect(280, base - 160, 60, 180);
          g.save(); g.shadowColor = '#ffd98a'; g.shadowBlur = 20; g.fillStyle = '#ffd98a'; g.fillRect(292, base - 150, 36, 26); g.restore();
          g.fillStyle = '#20284e'; g.fillRect(150, base - 200, 70, 40); g.fillStyle = '#8fa3ff'; g.globalAlpha = 0.25; g.fillRect(156, base - 194, 58, 28); g.globalAlpha = 1;
          // water tank on stilts
          const tx = w - 520; g.fillStyle = '#0b0f22';
          for (const lx of [tx + 10, tx + 150]) g.fillRect(lx, base - 230, 8, 250);
          g.fillRect(tx, base - 360, 168, 130); g.beginPath(); g.ellipse(tx + 84, base - 360, 84, 16, 0, 0, TAU); g.fill();
          g.strokeStyle = '#0b0f22'; g.lineWidth = 3; g.beginPath(); g.moveTo(tx + 14, base - 120); g.lineTo(tx + 154, base - 228); g.moveTo(tx + 154, base - 120); g.lineTo(tx + 14, base - 228); g.stroke();
          g.fillStyle = 'rgba(170,190,255,0.12)'; g.fillRect(tx + 120, base - 360, 20, 130);
        }),
      ];
      this.floor = mkCanvas(STAGE_W + 400, 260, g => {
        const FW = STAGE_W + 400, gr = g.createLinearGradient(0, 0, 0, 260); gr.addColorStop(0, '#3d4466'); gr.addColorStop(1, '#0c0e1c'); g.fillStyle = gr; g.fillRect(0, 0, FW, 260);
        g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 2;
        for (let y = 0, h = 12; y < 260; y += h, h *= 1.32) { g.beginPath(); g.moveTo(0, y); g.lineTo(FW, y); g.stroke(); for (let x = 0; x < FW; x += 60 + h * 3) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + h); g.stroke(); } }
        for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(170,190,255,${rand(0.05, 0.11)})`; g.beginPath(); g.ellipse(rand(0, FW), rand(20, 200), rand(40, 120), rand(5, 14), 0, 0, TAU); g.fill(); }
        g.fillStyle = '#1a1e36'; g.fillRect(0, 0, FW, 6);
        const sh = g.createLinearGradient(0, 0, 0, 40); sh.addColorStop(0, 'rgba(190,205,255,0.16)'); sh.addColorStop(1, 'rgba(190,205,255,0)'); g.fillStyle = sh; g.fillRect(0, 6, FW, 40);
      });
    },
    update(bt) {
      const cam = bt.cam;
      if (Math.random() < 0.16) FX.p({ type: 'petal', x: cam.x + rand(-700, 800), y: cam.y - 420, vx: rand(-1.6, -0.4), vy: rand(0.7, 1.4), life: 420, size: rand(3, 5), color: pick(['#ffb7d5', '#ffc9df', '#f7a1c4']), rot: rand(0, 6), vr: rand(-0.05, 0.05), add: false, drag: 1 });
    },
  },
  {
    id: 'clock', name: 'CLOCKWORK SPIRE', jp: '時計塔', music: 'clock',
    sky: ['#0b0604', '#2a160a', '#5a3214'],
    build() {
      const base = GROUND + LAYER_PAD - 20;
      this.layers = [
        layerCanvas(0.1, (g, w, h) => {
          const r = srand(19);
          g.fillStyle = '#1e1009'; g.fillRect(0, 0, w, h);
          g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 2;
          for (let y = 0, row = 0; y < h; y += 24, row++) for (let x = (row % 2) * -26; x < w; x += 52) { g.fillStyle = `rgba(110,55,25,${r() * 0.16})`; g.fillRect(x, y, 52, 24); g.strokeRect(x, y, 52, 24); }
          const cx = w * 0.5, cy = base - 360, R = 205; this.face = [cx, cy, R];
          const halo = g.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.6); halo.addColorStop(0, 'rgba(255,170,80,0.28)'); halo.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = halo; g.fillRect(cx - R * 1.6, cy - R * 1.6, R * 3.2, R * 3.2);
          const gl = g.createRadialGradient(cx, cy - 40, 20, cx, cy, R); gl.addColorStop(0, '#ffe6b0'); gl.addColorStop(0.55, '#d98a3a'); gl.addColorStop(1, '#7a3a12');
          g.fillStyle = gl; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
          g.strokeStyle = '#2a1508'; g.lineWidth = 6; for (const k of [0.62, 0.26]) { g.beginPath(); g.arc(cx, cy, R * k, 0, TAU); g.stroke(); }
          g.lineWidth = 5; for (let k = 0; k < 12; k++) { const a = k * TAU / 12 + TAU / 24; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.26, cy + Math.sin(a) * R * 0.26); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke(); }
          g.font = `900 28px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(60,26,8,0.85)';
          ROMAN.forEach((n, k) => { const a = -Math.PI / 2 - k * TAU / 12; g.save(); g.translate(cx + Math.cos(a) * R * 0.81, cy + Math.sin(a) * R * 0.81); g.scale(-1, 1); g.fillText(n, 0, 0); g.restore(); });
          g.strokeStyle = '#3a2212'; g.lineWidth = 20; g.beginPath(); g.arc(cx, cy, R + 10, 0, TAU); g.stroke();
          g.strokeStyle = 'rgba(255,200,120,0.25)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R + 20, -2.6, -0.6); g.stroke();
        }),
        layerCanvas(0.32, (g, w) => {
          const r = srand(3);
          g.fillStyle = '#2a170a'; for (const x of [300, w - 330]) g.fillRect(x - 9, 0, 18, base + 40);
          g.fillRect(0, base - 520, w, 14);
          for (const [x, y, R, n] of [[90, base - 420, 210, 24], [w - 120, base - 380, 240, 28], [w * 0.5 - 540, base - 70, 130, 16], [w * 0.5 + 580, base - 110, 150, 18]]) {
            gearShape(g, x, y, R, n, r() * TAU, '#26150a');
            g.strokeStyle = 'rgba(255,170,80,0.22)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, R * 0.86, -2.7, -1.3); g.stroke();
          }
        }),
        layerCanvas(0.62, (g, w) => {
          g.fillStyle = '#120904'; g.fillRect(0, 96, w, 50);
          for (const x of [110, w - 290]) { g.beginPath(); g.moveTo(x, 146); g.lineTo(x + 160, 146); g.lineTo(x + 30, 330); g.lineTo(x, 330); g.closePath(); g.fill(); }
          for (const x of [40, w - 80]) g.fillRect(x, 96, 40, base);
          // hanging chains with counterweights
          g.strokeStyle = '#1e120a'; g.lineWidth = 4;
          for (const [x, len] of [[w * 0.28, 330], [w * 0.74, 250]]) {
            for (let y = 146; y < 146 + len; y += 16) { g.beginPath(); g.ellipse(x, y + 8, (y / 16) % 2 ? 3 : 6, 8, 0, 0, TAU); g.stroke(); }
            g.fillStyle = '#120904'; g.fillRect(x - 22, 146 + len, 44, 70); g.fillStyle = 'rgba(255,180,90,0.15)'; g.fillRect(x + 12, 146 + len, 6, 70); g.fillStyle = '#120904';
          }
          // lanterns
          for (const x of [w * 0.14, w * 0.88]) { g.fillRect(x - 1, 146, 2, 120); g.save(); g.shadowColor = '#ffb35a'; g.shadowBlur = 24; g.fillStyle = '#ffb35a'; g.fillRect(x - 10, 266, 20, 28); g.restore(); g.fillStyle = '#120904'; g.fillRect(x - 13, 262, 26, 5); g.fillRect(x - 13, 292, 26, 5); }
          // railing at the edge of the walkway
          g.fillRect(0, base - 64, w, 7); for (let x = 0; x < w; x += 42) g.fillRect(x, base - 60, 5, 80);
        }),
      ];
      this.floor = mkCanvas(STAGE_W + 400, 260, g => {
        const FW = STAGE_W + 400, gr = g.createLinearGradient(0, 0, 0, 260); gr.addColorStop(0, '#5a3418'); gr.addColorStop(1, '#140a04'); g.fillStyle = gr; g.fillRect(0, 0, FW, 260);
        g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2;
        for (let y = 0, h = 11, row = 0; y < 260; y += h, h *= 1.3, row++) { g.beginPath(); g.moveTo(0, y); g.lineTo(FW, y); g.stroke(); for (let x = (row % 2) * 90; x < FW; x += 180) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + h); g.stroke(); } }
        for (let i = 0; i < 260; i++) { g.strokeStyle = 'rgba(255,210,160,0.035)'; const y = rand(0, 260), x = rand(0, FW); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(40, 200), y); g.stroke(); }
        const cx = STAGE_W / 2 + 200; g.strokeStyle = 'rgba(255,190,90,0.32)'; g.lineWidth = 4; g.beginPath(); g.ellipse(cx, 72, 240, 40, 0, 0, TAU); g.stroke(); g.lineWidth = 2; g.beginPath(); g.ellipse(cx, 72, 200, 32, 0, 0, TAU); g.stroke();
        for (let k = 0; k < 12; k++) { const a = k * TAU / 12; g.fillStyle = 'rgba(255,190,90,0.3)'; g.fillRect(cx + Math.cos(a) * 220 - 3, 72 + Math.sin(a) * 36 - 2, 6, 4); }
        const sh = g.createLinearGradient(0, 0, 0, 36); sh.addColorStop(0, 'rgba(255,190,110,0.2)'); sh.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = sh; g.fillRect(0, 0, FW, 36);
      });
    },
    update(bt) {
      const cam = bt.cam;
      if (Math.random() < 0.3) FX.p({ type: 'ember', x: cam.x + rand(-700, 700), y: GROUND - rand(30, 420), vx: rand(-0.25, 0.25), vy: rand(-0.2, 0.15), life: rand(120, 220), size: rand(1, 2), color: pick(['#ffd79a', '#ffe9c2', '#e8a860']), drag: 1 });
    },
    bgAnim(g, cam, t) {
      // clock hands (vector mode)
      const [x, y, s] = layerPt(this, 0, this.face[0], this.face[1], cam), R = this.face[2] * s;
      const am = -Math.PI / 2 - t * 0.004, ah = -0.9 - t * 0.004 / 12;
      g.save(); g.lineCap = 'round'; g.strokeStyle = '#1a0c04';
      g.lineWidth = 14 * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ah) * R * 0.45, y + Math.sin(ah) * R * 0.45); g.stroke();
      g.lineWidth = 8 * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(am) * R * 0.7, y + Math.sin(am) * R * 0.7); g.stroke();
      g.fillStyle = '#1a0c04'; g.beginPath(); g.arc(x, y, 18 * s, 0, TAU); g.fill();
      g.restore();
    },
  },
  {
    id: 'forge', name: 'RUNE FORGE', jp: '霊峰鍛冶場', music: 'forge',
    sky: ['#02040a', '#0a1a2c', '#1f4a5e'],
    build() {
      const base = GROUND + LAYER_PAD - 20;
      this.layers = [
        layerCanvas(0.08, (g, w) => {
          const r = srand(77);
          for (const [col, hi, lo, step] of [['#10243a', 470, 280, 150], ['#0a1828', 300, 170, 110]]) {
            const peaks = []; for (let x = -60; x <= w + 60; x += step * (0.7 + r() * 0.6)) peaks.push([x, base - lo - r() * (hi - lo)]);
            g.fillStyle = col; g.beginPath(); g.moveTo(-60, base + 40);
            peaks.forEach(([x, y], i) => { if (i) { const [px, py] = peaks[i - 1]; g.lineTo((px + x) / 2, Math.max(py, y) + 40 + r() * 50); } g.lineTo(x, y); });
            g.lineTo(w + 60, base + 40); g.closePath(); g.fill();
            g.fillStyle = col === '#10243a' ? 'rgba(205,230,255,0.75)' : 'rgba(170,205,240,0.45)';
            for (const [x, y] of peaks) { const d = 26 + r() * 22; g.beginPath(); g.moveTo(x, y); g.lineTo(x + d * 0.9, y + d); g.lineTo(x + d * 0.35, y + d * 0.8); g.lineTo(x, y + d * 1.1); g.lineTo(x - d * 0.4, y + d * 0.75); g.lineTo(x - d * 0.8, y + d); g.closePath(); g.fill(); }
          }
        }),
        layerCanvas(0.3, (g, w) => {
          const r = srand(5), cx = w * 0.5, top = base - 360; this.runes1 = [];
          // the mountain hall carved into the rock
          g.fillStyle = '#132232'; g.beginPath(); g.moveTo(0, base + 40); g.lineTo(0, base - 180);
          for (let x = 0; x <= w; x += 60) g.lineTo(x, base - 190 - Math.pow(Math.sin(x / w * Math.PI), 3) * 200 - r() * 30);
          g.lineTo(w, base + 40); g.closePath(); g.fill();
          g.save(); g.clip(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; for (let y = base - 420, row = 0; y < base + 40; y += 30, row++) for (let x = (row % 2) * 40 - 40; x < w; x += 80) g.strokeRect(x, y, 80, 30); g.restore();
          // forge glow inside the gate
          const fg = g.createRadialGradient(cx, base - 20, 10, cx, base - 60, 260); fg.addColorStop(0, '#ffcf6a'); fg.addColorStop(0.35, '#ff7a24'); fg.addColorStop(1, '#2a0e06');
          g.fillStyle = fg; g.beginPath(); g.moveTo(cx - 130, base + 40); g.lineTo(cx - 130, base - 180); g.arc(cx, base - 180, 130, Math.PI, 0); g.lineTo(cx + 130, base + 40); g.closePath(); g.fill();
          // arch stones + pillars with rune bands
          g.strokeStyle = '#1d2c3a'; g.lineWidth = 22; g.beginPath(); g.moveTo(cx - 141, base + 40); g.lineTo(cx - 141, base - 180); g.arc(cx, base - 180, 141, Math.PI, 0); g.lineTo(cx + 141, base + 40); g.stroke();
          g.fillStyle = '#1b2c3c'; for (const px of [cx - 300, cx + 240]) { g.fillRect(px, top + 40, 60, 360); g.fillRect(px - 12, top + 28, 84, 20); g.fillRect(px - 12, base - 20, 84, 30); }
          g.save(); g.strokeStyle = '#7ff4ff'; g.shadowColor = '#3fdcff'; g.shadowBlur = 12; g.lineWidth = 2.5;
          for (let k = 0; k < 11; k++) { const a = Math.PI + (k + 0.5) * Math.PI / 11, x = cx + Math.cos(a) * 141, y = base - 180 + Math.sin(a) * 141; stRune(g, x, y, 7, r); this.runes1.push([x, y]); }
          for (const px of [cx - 270, cx + 270]) for (let y = top + 80; y < base - 40; y += 44) { stRune(g, px, y, 9, r); this.runes1.push([px, y]); }
          g.restore();
          // chimneys venting forge light
          for (const x of [cx - 420, cx + 400]) { g.fillStyle = '#0b141e'; g.fillRect(x, top - 120, 44, 140); g.save(); g.globalCompositeOperation = 'lighter'; const cg = g.createRadialGradient(x + 22, top - 124, 0, x + 22, top - 124, 60); cg.addColorStop(0, 'rgba(255,140,50,0.5)'); cg.addColorStop(1, 'rgba(255,140,50,0)'); g.fillStyle = cg; g.fillRect(x - 40, top - 190, 124, 130); g.restore(); }
        }),
        layerCanvas(0.6, (g, w) => {
          const r = srand(13); this.runes2 = [];
          // rune monoliths
          for (const [x, hh] of [[110, 330], [w - 210, 380], [w * 0.5 - 520, 230], [w * 0.5 + 470, 260]]) {
            g.fillStyle = '#16232f'; g.beginPath(); g.moveTo(x, base + 20); g.lineTo(x + 6, base - hh + 30); g.lineTo(x + 40, base - hh); g.lineTo(x + 86, base - hh + 24); g.lineTo(x + 92, base + 20); g.closePath(); g.fill();
            g.fillStyle = 'rgba(160,220,255,0.14)'; g.fillRect(x + 8, base - hh + 30, 10, hh - 40);
            g.save(); g.strokeStyle = '#6ff3ff'; g.shadowColor = '#3fdcff'; g.shadowBlur = 10; g.lineWidth = 3;
            for (let y = base - hh + 60; y < base - 30; y += 46) { stRune(g, x + 46, y, 11, r); this.runes2.push([x + 46, y]); }
            g.restore();
          }
          // giant anvil on a stump
          const ax = w * 0.5 - 330; g.fillStyle = '#0d1620';
          g.fillRect(ax - 40, base - 80, 80, 100); g.beginPath(); g.moveTo(ax - 120, base - 130); g.lineTo(ax + 90, base - 130); g.quadraticCurveTo(ax + 170, base - 128, ax + 190, base - 112); g.lineTo(ax + 70, base - 100); g.lineTo(ax + 40, base - 80); g.lineTo(ax - 50, base - 80); g.lineTo(ax - 80, base - 100); g.lineTo(ax - 120, base - 104); g.closePath(); g.fill();
          g.fillStyle = 'rgba(255,170,80,0.35)'; g.fillRect(ax - 116, base - 130, 200, 3);
          // hanging chains and hooks
          g.strokeStyle = '#0a1018'; g.lineWidth = 4;
          for (const x of [w * 0.22, w * 0.78]) { for (let y = 60; y < 360; y += 16) { g.beginPath(); g.ellipse(x, y, (y / 16) % 2 ? 2.5 : 5, 8, 0, 0, TAU); g.stroke(); } g.beginPath(); g.arc(x, 372, 12, -Math.PI / 2, Math.PI * 0.9); g.stroke(); }
        }),
      ];
      this.floor = mkCanvas(STAGE_W + 400, 260, g => {
        const FW = STAGE_W + 400, gr = g.createLinearGradient(0, 0, 0, 260); gr.addColorStop(0, '#2c3a48'); gr.addColorStop(1, '#070b10'); g.fillStyle = gr; g.fillRect(0, 0, FW, 260);
        g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 2;
        for (let y = 0, h = 16, row = 0; y < 260; y += h, h *= 1.36, row++) { g.beginPath(); g.moveTo(0, y); g.lineTo(FW, y); g.stroke(); for (let x = rand(0, 60); x < FW; x += rand(70, 140) + h * 2) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-8, 8), y + h); g.stroke(); } }
        // molten seams
        g.save(); g.shadowColor = '#ffb040'; g.shadowBlur = 10; g.strokeStyle = '#ffb347'; g.lineWidth = 2;
        for (let i = 0; i < 14; i++) { let x = rand(0, FW), y = rand(10, 200); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += rand(-40, 40); y += rand(-8, 12); g.lineTo(x, y); } g.stroke(); }
        g.restore();
        // rune circle in the middle of the arena
        const cx = STAGE_W / 2 + 200, rr = srand(9); g.save(); g.strokeStyle = 'rgba(111,243,255,0.35)'; g.shadowColor = '#3fdcff'; g.shadowBlur = 12; g.lineWidth = 3;
        g.beginPath(); g.ellipse(cx, 70, 250, 42, 0, 0, TAU); g.stroke(); g.lineWidth = 2; g.beginPath(); g.ellipse(cx, 70, 205, 33, 0, 0, TAU); g.stroke();
        g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * TAU / 6 - Math.PI / 2; const x = cx + Math.cos(a) * 205, y = 70 + Math.sin(a) * 33; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.stroke();
        g.save(); g.translate(cx, 70); g.scale(1, 0.17); for (let k = 0; k < 16; k++) { const a = k * TAU / 16; stRune(g, Math.cos(a) * 228, Math.sin(a) * 228, 8, rr); } g.restore();
        g.restore();
      });
      this.snow = Array.from({ length: 70 }, () => ({ x: rand(0, W), y: rand(0, H), v: rand(0.6, 1.6), w: rand(0, 6) }));
    },
    update(bt) {
      const cam = bt.cam;
      for (const s of this.snow) { s.y += s.v; s.x += Math.sin(bt.pf * 0.02 + s.w) * 0.4 - 0.2; if (s.y > H) { s.y = -6; s.x = rand(0, W); } }
      if (Math.random() < 0.35) FX.p({ type: 'ember', x: cam.x + rand(-700, 700), y: GROUND + 10, vx: rand(-0.4, 0.4), vy: -rand(1, 2.6), life: rand(50, 100), size: rand(1, 2.4), color: pick(['#ffcf6a', '#ffb347', '#ff8a2a']), drag: 0.99 });
      for (const x of [260, STAGE_W - 260]) FX.flame(x, GROUND - 108, '#5fe0ff', 1, 10, 2.2);
    },
    worldBack(g) {
      for (const x of [260, STAGE_W - 260]) {
        poly(g, [[x - 34, GROUND - 108], [x + 34, GROUND - 108], [x + 20, GROUND - 84], [x + 12, GROUND], [x - 12, GROUND], [x - 20, GROUND - 84]], '#1a2632', { ol: 2.5 });
        g.save(); g.strokeStyle = '#7ff4ff'; g.lineWidth = 2; g.globalAlpha = 0.8; stRune(g, x, GROUND - 50, 9, srand(x)); g.restore();
        g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(x, GROUND - 130, 0, x, GROUND - 130, 150); gr.addColorStop(0, 'rgba(80,220,255,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 150, GROUND - 280, 300, 300); g.restore();
      }
    },
    front(g) {
      g.fillStyle = 'rgba(230,240,255,0.7)';
      for (const s of this.snow) g.fillRect(s.x, s.y, s.w > 4 ? 3 : 2, s.w > 4 ? 3 : 2);
    },
  },
];
STAGES2.forEach(s => { s.build(); s.thumb = stageThumb(s, 320, 180); s.wide = stageThumb(s, 1280, 720); STAGES.push(s); });
