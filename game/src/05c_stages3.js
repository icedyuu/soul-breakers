// ====================== STAGES 3: Dusk Shrine, Throne of Souls ======================
// Same contract as 05_stages.js / 05b_stages2.js. Pixel-mode details live in 07bc_pixstages3.js.
// THRONE OF SOULS is the story boss arena: the final (rival) fight of every Arcade run takes place there.
// All animation here is visual only (no gameplay state), so online lockstep stays deterministic.

// vermilion torii gate, feet at (cx, base)
function toriiShape(g, cx, base, w, h, col, dark) {
  const pw = w * 0.07, px = w * 0.36;
  g.fillStyle = col;
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * px - pw / 2, base); g.lineTo(cx + s * (px - w * 0.02) - pw / 2, base - h); g.lineTo(cx + s * (px - w * 0.02) + pw / 2, base - h); g.lineTo(cx + s * px + pw / 2, base); g.closePath(); g.fill(); }
  g.fillRect(cx - w * 0.43, base - h * 0.78, w * 0.86, h * 0.06);                // nuki (lower beam)
  g.fillRect(cx - w * 0.04, base - h * 0.9, w * 0.08, h * 0.13);                // gakuzuka (centre strut)
  g.beginPath(); g.moveTo(cx - w * 0.5, base - h * 1.02); g.quadraticCurveTo(cx, base - h * 0.9, cx + w * 0.5, base - h * 1.02);
  g.lineTo(cx + w * 0.47, base - h * 0.92); g.quadraticCurveTo(cx, base - h * 0.84, cx - w * 0.47, base - h * 0.92); g.closePath(); g.fill();   // shimaki
  g.fillStyle = dark; g.beginPath(); g.moveTo(cx - w * 0.54, base - h * 1.1); g.quadraticCurveTo(cx, base - h * 0.96, cx + w * 0.54, base - h * 1.1);
  g.lineTo(cx + w * 0.52, base - h * 1.02); g.quadraticCurveTo(cx, base - h * 0.9, cx - w * 0.52, base - h * 1.02); g.closePath(); g.fill();       // kasagi (black top)
  for (const s of [-1, 1]) g.fillRect(cx + s * px - pw * 0.7, base - h * 0.06, pw * 1.4, h * 0.06);   // black feet
}
// stone lantern (tōrō), feet at (x, base); returns the fire box centre
function toroShape(g, x, base, s, col, lit) {
  g.fillStyle = col;
  g.fillRect(x - 26 * s, base - 12 * s, 52 * s, 12 * s); g.fillRect(x - 9 * s, base - 70 * s, 18 * s, 60 * s); g.fillRect(x - 22 * s, base - 82 * s, 44 * s, 12 * s);
  g.fillRect(x - 17 * s, base - 116 * s, 34 * s, 34 * s);
  g.beginPath(); g.moveTo(x - 34 * s, base - 116 * s); g.lineTo(x, base - 142 * s); g.lineTo(x + 34 * s, base - 116 * s); g.closePath(); g.fill();
  g.beginPath(); g.arc(x, base - 146 * s, 6 * s, 0, TAU); g.fill();
  if (lit) { g.save(); g.shadowColor = lit; g.shadowBlur = 22 * s; g.fillStyle = lit; g.fillRect(x - 9 * s, base - 110 * s, 18 * s, 20 * s); g.restore(); }
  else { g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x - 9 * s, base - 110 * s, 18 * s, 20 * s); }
  return [x, base - 100 * s];
}
// a red spider lily (higanbana) clump
function higanbana(g, x, base, r, n) {
  for (let i = 0; i < n; i++) {
    const fx = x + (r() - 0.5) * 60, h = 26 + r() * 30, fy = base - h;
    g.strokeStyle = '#1e2a14'; g.lineWidth = 2; g.beginPath(); g.moveTo(fx, base + 4); g.lineTo(fx + (r() - 0.5) * 6, fy); g.stroke();
    g.strokeStyle = '#d8202a'; g.lineWidth = 1.6;
    for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.42; g.beginPath(); g.moveTo(fx, fy); g.quadraticCurveTo(fx + Math.cos(a) * 9, fy + Math.sin(a) * 9 - 4, fx + Math.cos(a) * 15, fy + Math.sin(a) * 12 + 2); g.stroke(); }
    g.fillStyle = '#ff3a3a'; g.beginPath(); g.arc(fx, fy, 3.5, 0, TAU); g.fill();
  }
}
// sagging wire between two points
function wireSag(g, x0, y0, x1, y1, sag) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1); g.stroke(); }

const STAGES3 = [
  {
    id: 'shrine', name: 'DUSK SHRINE', jp: '黄昏の社', music: 'shrine',
    sky: ['#1b0f2e', '#7a2c46', '#f08a3c'],
    build() {
      const base = GROUND + LAYER_PAD - 20;
      this.layers = [
        layerCanvas(0.1, (g, w) => {
          const r = srand(23);
          // the setting sun, half behind the hills, with a hazy band
          const sx = w * 0.64, sy = base - 150, R = 92; this.sun = [sx, sy, R];
          const halo = g.createRadialGradient(sx, sy, R * 0.6, sx, sy, R * 3.2); halo.addColorStop(0, 'rgba(255,190,90,0.55)'); halo.addColorStop(1, 'rgba(255,120,60,0)');
          g.fillStyle = halo; g.fillRect(sx - R * 3.2, sy - R * 3.2, R * 6.4, R * 6.4);
          const sg = g.createLinearGradient(0, sy - R, 0, sy + R); sg.addColorStop(0, '#fff1b0'); sg.addColorStop(1, '#ff7a2a');
          g.fillStyle = sg; g.beginPath(); g.arc(sx, sy, R, 0, TAU); g.fill();
          g.fillStyle = 'rgba(160,50,70,0.35)'; for (const [dy, hh] of [[-30, 5], [-8, 7], [16, 6]]) g.fillRect(sx - R * 1.5, sy + dy, R * 3, hh);
          // two ranges of hills
          for (const [col, hi, amp, seed] of [['#4a1f3e', 190, 60, 1], ['#2e1430', 120, 40, 2]]) {
            g.fillStyle = col; g.beginPath(); g.moveTo(0, base + 40);
            for (let x = 0; x <= w; x += 30) g.lineTo(x, base - hi - Math.sin(x * 0.004 + seed * 2) * amp - Math.sin(x * 0.013 + seed) * amp * 0.35);
            g.lineTo(w, base + 40); g.closePath(); g.fill();
          }
          // distant steel pylons with high-voltage lines
          const py = [], top = base - 260;
          for (let x = 80; x < w; x += 360 + r() * 60) {
            py.push(x); g.fillStyle = '#1e0e22';
            g.beginPath(); g.moveTo(x - 18, base - 80); g.lineTo(x - 3, top); g.lineTo(x + 3, top); g.lineTo(x + 18, base - 80); g.closePath(); g.fill();
            g.fillRect(x - 26, top + 22, 52, 4); g.fillRect(x - 20, top + 48, 40, 4);
            g.strokeStyle = '#1e0e22'; g.lineWidth = 1.5; for (let y = base - 90; y > top + 20; y -= 26) { const k = (base - 80 - y) / (base - 80 - top) * 15; g.beginPath(); g.moveTo(x - 18 + k, y); g.lineTo(x + 18 - k - 2, y - 26); g.stroke(); }
          }
          g.strokeStyle = 'rgba(30,14,34,0.8)'; g.lineWidth = 1.2;
          for (let i = 0; i < py.length - 1; i++) for (const [dx, dy] of [[-26, 24], [26, 24], [-20, 50], [20, 50]]) wireSag(g, py[i] + dx, top + dy, py[i + 1] + dx, top + dy, 34);
        }),
        layerCanvas(0.32, (g, w) => {
          const r = srand(8), wt = base - 130;
          // flooded rice paddies mirroring the sky
          const wg = g.createLinearGradient(0, wt, 0, base + 40); wg.addColorStop(0, '#f29a52'); wg.addColorStop(0.35, '#b2485a'); wg.addColorStop(1, '#3a1a34');
          g.fillStyle = wg; g.fillRect(0, wt, w, base + 40 - wt);
          const sx = this.sun[0] * 1.1; g.fillStyle = 'rgba(255,230,150,0.35)'; for (let y = wt + 4; y < base + 30; y += 7) { const ww = 30 + (y - wt) * 0.5 + r() * 20; g.fillRect(sx - ww / 2, y, ww, 3); }
          // embankments + seedling rows
          for (let k = 0, y = wt + 8; y < base + 40; k++, y += 12 + k * 5) {
            g.fillStyle = 'rgba(42,20,36,0.8)'; g.fillRect(0, y, w, 2 + k * 0.6);
            g.fillStyle = 'rgba(40,40,26,0.7)'; for (let x = r() * 20; x < w; x += 14 + k * 2) g.fillRect(x, y - 3 - k, 1.5 + k * 0.3, 3 + k);
          }
          // farmhouse with a thatched roof and one warm window
          const fx = w * 0.16; g.fillStyle = '#1c0d1c'; g.fillRect(fx - 90, wt - 70, 180, 80);
          g.beginPath(); g.moveTo(fx - 120, wt - 66); g.lineTo(fx - 60, wt - 150); g.lineTo(fx + 60, wt - 150); g.lineTo(fx + 120, wt - 66); g.closePath(); g.fill();
          g.save(); g.shadowColor = '#ffc46a'; g.shadowBlur = 14; g.fillStyle = '#ffc46a'; g.fillRect(fx + 30, wt - 46, 26, 18); g.restore();
          g.fillStyle = '#1c0d1c'; g.fillRect(fx + 42, wt - 46, 2, 18);
          // tall hedge (somebody very tall sometimes looks over it in pixel mode)
          const hx = w * 0.66, ht = wt - 96; this.hedge = [hx, ht, 360];
          g.fillStyle = '#1a1420'; g.beginPath(); g.moveTo(hx - 180, wt + 6); g.lineTo(hx - 180, ht + 16);
          for (let x = hx - 180; x <= hx + 180; x += 20) g.quadraticCurveTo(x + 10, ht - 8 - r() * 6, x + 20, ht + 4 + r() * 4);
          g.lineTo(hx + 180, wt + 6); g.closePath(); g.fill();
          g.fillStyle = 'rgba(255,150,100,0.14)'; for (let x = hx - 170; x < hx + 170; x += 20) { g.beginPath(); g.arc(x + 10, ht + 2, 8, Math.PI * 1.1, Math.PI * 1.7); g.fill(); }
          // wooden utility poles along the farm road, with crows on the wires
          const poles = []; this.wire = [];
          for (let x = 60; x < w; x += 300 + r() * 40) {
            poles.push(x); g.fillStyle = '#1a0c16'; g.fillRect(x - 5, wt - 300, 10, 330); g.fillRect(x - 40, wt - 280, 80, 6); g.fillRect(x - 30, wt - 250, 60, 5);
            for (const dx of [-34, -14, 14, 34]) g.fillRect(x + dx - 2, wt - 288, 4, 8);
          }
          g.strokeStyle = 'rgba(26,12,22,0.9)'; g.lineWidth = 1.4;
          for (let i = 0; i < poles.length - 1; i++) {
            for (const [dx, dy] of [[-34, -282], [34, -282], [-24, -248], [24, -248]]) wireSag(g, poles[i] + dx, wt + dy, poles[i + 1] + dx, wt + dy, 22);
            if (r() < 0.7) { const t = 0.3 + r() * 0.4, x = poles[i] - 34 + (poles[i + 1] - poles[i]) * t, y = wt - 282 + 22 * 4 * t * (1 - t) * 0.5; this.wire.push([x, y]);
              g.fillStyle = '#120812'; g.beginPath(); g.ellipse(x, y - 6, 5, 6, 0.3, 0, TAU); g.fill(); g.beginPath(); g.arc(x + 4, y - 12, 3.4, 0, TAU); g.fill(); g.beginPath(); g.moveTo(x + 6, y - 13); g.lineTo(x + 11, y - 11); g.lineTo(x + 6, y - 10); g.fill(); g.fillRect(x - 9, y - 4, 6, 2); }
          }
        }),
        layerCanvas(0.62, (g, w) => {
          const r = srand(31), cx = w * 0.5;
          // old cedars framing the shrine, a sacred rope around the big one
          for (const [x, tw] of [[70, 70], [w - 120, 90]]) {
            g.fillStyle = '#1a0c12'; g.fillRect(x - tw / 2, -40, tw, base + 80);
            g.fillStyle = 'rgba(255,140,90,0.12)'; g.fillRect(x + tw * 0.22, -40, tw * 0.14, base + 80);
            g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; for (let y = 0; y < base; y += 18 + r() * 30) { g.beginPath(); g.moveTo(x - tw / 2 + r() * tw * 0.3, y); g.lineTo(x - tw / 2 + r() * tw * 0.3, y + 30 + r() * 30); g.stroke(); }
          }
          const tx = w - 120, ty = base - 260;
          g.strokeStyle = '#c9b27a'; g.lineWidth = 9; g.beginPath(); g.moveTo(tx - 48, ty); g.quadraticCurveTo(tx, ty + 14, tx + 48, ty); g.stroke();
          g.fillStyle = '#f2ecdc'; for (const dx of [-26, 0, 26]) { g.beginPath(); g.moveTo(tx + dx - 4, ty + 8); g.lineTo(tx + dx + 4, ty + 8); g.lineTo(tx + dx, ty + 20); g.lineTo(tx + dx + 5, ty + 20); g.lineTo(tx + dx, ty + 32); g.lineTo(tx + dx - 5, ty + 26); g.closePath(); g.fill(); }
          // the torii frames the arena
          toriiShape(g, cx, base + 10, 640, 470, '#b8301e', '#1a0e10');
          g.fillStyle = 'rgba(255,170,100,0.22)'; g.fillRect(cx - 640 * 0.36 + 10, base - 455, 8, 460); g.fillRect(cx + 640 * 0.36 + 10, base - 455, 8, 460);
          // shimenawa + zigzag shide hanging from the lower beam
          const ny = base + 10 - 470 * 0.72;
          g.strokeStyle = '#d8c48a'; g.lineWidth = 8; g.beginPath(); g.moveTo(cx - 200, ny); g.quadraticCurveTo(cx, ny + 46, cx + 200, ny); g.stroke();
          g.strokeStyle = 'rgba(120,90,40,0.6)'; g.lineWidth = 2; for (let x = cx - 190; x < cx + 190; x += 12) { const y = ny + 46 * (1 - Math.pow((x - cx) / 200, 2)) * 0.5; g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x + 6, y + 4); g.stroke(); }
          this.shide = [];
          g.fillStyle = '#f4efe2'; for (const dx of [-130, -45, 45, 130]) { const x = cx + dx, y = ny + 46 * (1 - Math.pow(dx / 200, 2)) * 0.5; this.shide.push([x, y]); g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x + 5, y); g.lineTo(x, y + 14); g.lineTo(x + 6, y + 14); g.lineTo(x, y + 28); g.lineTo(x + 6, y + 28); g.lineTo(x - 2, y + 42); g.lineTo(x - 6, y + 32); g.lineTo(x, y + 30); g.lineTo(x - 6, y + 16); g.closePath(); g.fill(); }
          // stone lanterns along the approach
          this.toro = [];
          for (const [x, s] of [[cx - 420, 1.15], [cx + 420, 1.15], [cx - 660, 0.85], [cx + 760, 0.85]]) this.toro.push(toroShape(g, x, base + 10, s, '#2a2028', '#ffb45a'));
          // small wayside shrine with jizō statues in red bibs
          const hx = cx + 600; g.fillStyle = '#2a140e'; g.fillRect(hx - 40, base - 70, 80, 80); g.fillStyle = '#140808'; g.beginPath(); g.moveTo(hx - 60, base - 66); g.lineTo(hx, base - 108); g.lineTo(hx + 60, base - 66); g.closePath(); g.fill();
          g.fillStyle = '#0a0404'; g.fillRect(hx - 22, base - 52, 44, 50); g.fillStyle = '#ffcf6a'; g.globalAlpha = 0.5; g.fillRect(hx - 4, base - 40, 8, 10); g.globalAlpha = 1;
          for (const [dx, s] of [[-110, 1], [-80, 0.9], [-52, 0.8]]) {
            const x = hx + dx; g.fillStyle = '#3a3238'; g.beginPath(); g.ellipse(x, base - 14 * s, 13 * s, 22 * s, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(x, base - 40 * s, 10 * s, 0, TAU); g.fill();
            g.fillStyle = '#c41e26'; g.beginPath(); g.moveTo(x - 12 * s, base - 30 * s); g.lineTo(x + 12 * s, base - 30 * s); g.lineTo(x, base - 12 * s); g.closePath(); g.fill();
          }
          // concrete pole with a street lamp at the road (it flickers in pixel mode)
          const lx = 190; this.lamp = [lx + 40, base - 360];
          g.fillStyle = '#241a22'; g.fillRect(lx - 7, base - 380, 14, 400); g.fillRect(lx, base - 372, 44, 5); g.fillRect(lx + 30, base - 366, 20, 6);
          g.save(); g.globalCompositeOperation = 'lighter'; const lg = g.createRadialGradient(lx + 40, base - 360, 0, lx + 40, base - 300, 170); lg.addColorStop(0, 'rgba(255,240,190,0.4)'); lg.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = lg; g.fillRect(lx - 140, base - 400, 360, 420); g.restore();
          // red spider lilies along the path
          for (const x of [cx - 560, cx - 260, cx + 280, cx + 520, 220, w - 260]) higanbana(g, x, base + 12, r, 5 + Math.floor(r() * 4));
          // low wooden fence of the shrine grounds
          g.fillStyle = '#1c0e12'; g.fillRect(0, base - 34, cx - 300, 5); g.fillRect(cx + 300, base - 34, w, 5);
          for (let x = 10; x < w; x += 46) if (Math.abs(x - cx) > 300) g.fillRect(x, base - 44, 6, 60);
        }),
      ];
      this.floor = mkCanvas(STAGE_W + 400, 260, g => {
        const FW = STAGE_W + 400, gr = g.createLinearGradient(0, 0, 0, 260); gr.addColorStop(0, '#6e4a4c'); gr.addColorStop(1, '#160a12'); g.fillStyle = gr; g.fillRect(0, 0, FW, 260);
        // raked gravel
        for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${pick(['255,220,200', '20,8,14'])},${rand(0.05, 0.14)})`; g.fillRect(rand(0, FW), rand(0, 260), 2, 2); }
        // the stone path (sandō) across the arena
        const cx = STAGE_W / 2 + 200; g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 2;
        for (let y = 0, h = 12, row = 0; y < 180; y += h, h *= 1.3, row++) {
          const hw = 1150 + y * 0.6; g.fillStyle = `rgba(160,130,130,${0.18 + row * 0.02})`; g.fillRect(cx - hw, y, hw * 2, h - 2);
          for (let x = cx - hw + (row % 2) * 70; x < cx + hw; x += 140) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + h - 2); g.stroke(); }
        }
        // fallen maple leaves
        for (let i = 0; i < 90; i++) { g.fillStyle = pick(['#c8302a', '#e0602a', '#a01c22', '#e8902a']); g.globalAlpha = rand(0.4, 0.8); g.beginPath(); g.ellipse(rand(0, FW), rand(6, 240), rand(3, 6), rand(2, 3), rand(0, 3), 0, TAU); g.fill(); }
        g.globalAlpha = 1; g.fillStyle = '#2a141c'; g.fillRect(0, 0, FW, 5);
        const sh = g.createLinearGradient(0, 0, 0, 44); sh.addColorStop(0, 'rgba(255,170,110,0.22)'); sh.addColorStop(1, 'rgba(255,170,110,0)'); g.fillStyle = sh; g.fillRect(0, 5, FW, 44);
      });
    },
    update(bt) {
      const cam = bt.cam;
      if (Math.random() < 0.14) FX.p({ type: 'petal', x: cam.x + rand(-700, 800), y: cam.y - 420, vx: rand(-1.2, -0.2), vy: rand(0.6, 1.3), life: 440, size: rand(3.5, 5.5), color: pick(['#d8342a', '#ea6a2a', '#b2202a', '#f0962e']), rot: rand(0, 6), vr: rand(-0.06, 0.06), add: false, drag: 1 });
      if (Math.random() < 0.05) FX.p({ type: 'ember', x: cam.x + rand(-600, 600), y: GROUND - rand(40, 260), vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.1), life: 150, size: 1.8, color: '#ffd08a', drag: 1 });
    },
    front(g) {
      // low evening mist over the ground
      const mg = g.createLinearGradient(0, H - 170, 0, H); mg.addColorStop(0, 'rgba(230,150,160,0)'); mg.addColorStop(1, 'rgba(120,60,100,0.28)'); g.fillStyle = mg; g.fillRect(0, H - 170, W, 170);
    },
  },
  {
    id: 'throne', name: 'THRONE OF SOULS', jp: '魂の玉座', music: 'boss', boss: true,
    sky: ['#030106', '#1e0416', '#55091e'],
    build() {
      const base = GROUND + LAYER_PAD - 20;
      this.layers = [
        layerCanvas(0.08, (g, w) => {
          const r = srand(66);
          // red void with a black eclipse
          const ex = w * 0.5, ey = base - 450, R = 120; this.ecl = [ex, ey, R];
          const co = g.createRadialGradient(ex, ey, R * 0.9, ex, ey, R * 2.1); co.addColorStop(0, 'rgba(255,80,90,0.85)'); co.addColorStop(0.3, 'rgba(220,30,70,0.3)'); co.addColorStop(1, 'rgba(120,0,40,0)');
          g.fillStyle = co; g.fillRect(ex - R * 3, ey - R * 3, R * 6, R * 6);
          g.strokeStyle = 'rgba(255,120,120,0.25)'; g.lineWidth = 2; for (let k = 0; k < 40; k++) { const a = r() * TAU, l = R * (1.2 + r() * 1.3); g.beginPath(); g.moveTo(ex + Math.cos(a) * R, ey + Math.sin(a) * R); g.lineTo(ex + Math.cos(a) * l, ey + Math.sin(a) * l); g.stroke(); }
          g.fillStyle = '#050003'; g.beginPath(); g.arc(ex, ey, R, 0, TAU); g.fill();
          g.strokeStyle = '#ffd0c0'; g.lineWidth = 3; g.beginPath(); g.arc(ex, ey, R, 0, TAU); g.stroke();
          // floating rock islands with ruined spires
          for (const [x, y, s] of [[w * 0.12, base - 300, 1], [w * 0.82, base - 360, 1.3], [w * 0.3, base - 520, 0.6], [w * 0.7, base - 200, 0.8], [w * 0.95, base - 560, 0.5]]) {
            g.fillStyle = '#16040e'; g.beginPath(); g.moveTo(x - 80 * s, y); g.lineTo(x + 80 * s, y); g.lineTo(x + 30 * s, y + 60 * s); g.lineTo(x, y + 110 * s); g.lineTo(x - 30 * s, y + 50 * s); g.closePath(); g.fill();
            g.fillRect(x - 40 * s, y - 70 * s, 14 * s, 70 * s); g.fillRect(x + 14 * s, y - 110 * s, 18 * s, 110 * s); g.beginPath(); g.moveTo(x + 10 * s, y - 110 * s); g.lineTo(x + 23 * s, y - 150 * s); g.lineTo(x + 36 * s, y - 110 * s); g.fill();
            g.fillStyle = 'rgba(255,70,90,0.3)'; g.fillRect(x - 80 * s, y - 2, 160 * s, 3);
          }
          // far horizon of broken towers
          g.fillStyle = '#12020a'; for (let x = 0; x < w; x += 20 + r() * 50) { const hh = 40 + r() * 140; g.fillRect(x, base - hh, 16 + r() * 30, hh + 40); }
          const hz = g.createLinearGradient(0, base - 200, 0, base); hz.addColorStop(0, 'rgba(255,40,80,0)'); hz.addColorStop(1, 'rgba(255,40,80,0.25)'); g.fillStyle = hz; g.fillRect(0, base - 200, w, 240);
        }),
        layerCanvas(0.3, (g, w) => {
          const r = srand(14), cx = w * 0.5;
          // ruined colonnade around the arena
          g.fillStyle = '#1e0812';
          for (let x = 20, i = 0; x < w; x += 150, i++) {
            const broken = r() < 0.3, hh = broken ? 120 + r() * 140 : 330;
            g.fillRect(x, base - hh, 46, hh + 40);
            if (!broken) { g.fillRect(x - 8, base - 340, 62, 14); if (x + 150 < w) { g.beginPath(); g.moveTo(x + 46, base - 290); g.arc(x + 98, base - 290, 52, Math.PI, 0); g.lineTo(x + 150, base - 330); g.lineTo(x + 46, base - 330); g.closePath(); g.fill(); } }
            else { g.beginPath(); g.moveTo(x, base - hh); g.lineTo(x + 14, base - hh - 18); g.lineTo(x + 30, base - hh - 6); g.lineTo(x + 46, base - hh - 22); g.lineTo(x + 46, base - hh); g.fill(); }
          }
          g.fillStyle = 'rgba(255,90,110,0.12)'; for (let x = 20; x < w; x += 150) g.fillRect(x + 34, base - 330, 6, 360);
          // hooded colossi with swords flank the throne
          for (const s of [-1, 1]) {
            const x = cx + s * 300; g.fillStyle = '#16050d';
            g.beginPath(); g.moveTo(x - 70, base + 20); g.lineTo(x - 60, base - 330); g.quadraticCurveTo(x, base - 450, x + 60, base - 330); g.lineTo(x + 70, base + 20); g.closePath(); g.fill();
            g.fillStyle = '#05000a'; g.beginPath(); g.ellipse(x, base - 345, 26, 34, 0, 0, TAU); g.fill();
            g.fillStyle = '#ff3a5a'; g.fillRect(x - 13, base - 350, 7, 3); g.fillRect(x + 6, base - 350, 7, 3);
            g.fillStyle = '#16050d'; g.fillRect(x - s * 90 - 6, base - 420, 12, 420); g.fillRect(x - s * 90 - 30, base - 300, 60, 10);
            g.fillStyle = 'rgba(255,90,110,0.25)'; g.fillRect(x - s * 90 - 1, base - 420, 2, 110);
          }
          // the throne
          g.fillStyle = '#12030b'; g.fillRect(cx - 60, base - 200, 120, 130);
          g.beginPath(); g.moveTo(cx - 70, base - 192); g.lineTo(cx - 44, base - 252); g.lineTo(cx, base - 226); g.lineTo(cx + 44, base - 252); g.lineTo(cx + 70, base - 192); g.closePath(); g.fill();
          g.fillRect(cx - 100, base - 120, 200, 40); g.fillRect(cx - 130, base - 80, 260, 120); g.fillRect(cx - 160, base - 30, 320, 70);
          g.fillStyle = 'rgba(255,60,100,0.3)'; g.fillRect(cx - 130, base - 80, 260, 3); g.fillRect(cx - 160, base - 30, 320, 3);
          // the cracked soul crystal above the throne, chained to the colossi
          const kx = cx, ky = base - 370; this.crystal = [kx, ky];
          g.strokeStyle = '#2a0a16'; g.lineWidth = 6; g.setLineDash([12, 5]);
          for (const [x1, y1] of [[cx - 320, base - 400], [cx + 320, base - 400], [cx - 640, base - 330], [cx + 640, base - 330]]) { g.beginPath(); g.moveTo(kx, ky); g.quadraticCurveTo((kx + x1) / 2, Math.max(ky, y1) + 60, x1, y1); g.stroke(); }
          g.setLineDash([]);
          const gl = g.createRadialGradient(kx, ky, 10, kx, ky, 190); gl.addColorStop(0, 'rgba(255,80,160,0.55)'); gl.addColorStop(1, 'rgba(255,40,120,0)'); g.fillStyle = gl; g.fillRect(kx - 190, ky - 190, 380, 380);
          const cg = g.createLinearGradient(kx - 40, ky - 90, kx + 40, ky + 90); cg.addColorStop(0, '#ffd0f0'); cg.addColorStop(0.45, '#ff4aa8'); cg.addColorStop(1, '#5a0a3a');
          g.fillStyle = cg; g.beginPath(); g.moveTo(kx, ky - 96); g.lineTo(kx + 44, ky - 10); g.lineTo(kx + 14, ky + 92); g.lineTo(kx - 18, ky + 88); g.lineTo(kx - 46, ky - 6); g.closePath(); g.fill();
          g.strokeStyle = '#2a0418'; g.lineWidth = 3; g.beginPath(); g.moveTo(kx - 6, ky - 80); g.lineTo(kx + 8, ky - 30); g.lineTo(kx - 10, ky + 6); g.lineTo(kx + 6, ky + 60); g.moveTo(kx + 8, ky - 30); g.lineTo(kx + 30, ky - 14); g.stroke();
          g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.moveTo(kx - 6, ky - 84); g.lineTo(kx - 34, ky - 8); g.lineTo(kx - 24, ky - 8); g.closePath(); g.fill();
        }),
        layerCanvas(0.6, (g, w) => {
          const r = srand(29);
          // near pillars with torn banners
          for (const [x, hh, ban] of [[60, 520, true], [w - 170, 560, true], [w * 0.5 - 700, 260, false], [w * 0.5 + 620, 220, false]]) {
            g.fillStyle = '#16050c'; g.fillRect(x, base - hh, 100, hh + 40); g.fillRect(x - 14, base - hh, 128, 20); g.fillRect(x - 14, base - 20, 128, 40);
            g.fillStyle = 'rgba(255,80,110,0.14)'; g.fillRect(x + 76, base - hh + 20, 8, hh - 40);
            if (!ban) { g.fillStyle = '#16050c'; g.beginPath(); g.moveTo(x, base - hh); g.lineTo(x + 30, base - hh - 30); g.lineTo(x + 60, base - hh - 8); g.lineTo(x + 100, base - hh - 36); g.lineTo(x + 100, base - hh); g.fill(); continue; }
            const by = base - hh + 40; g.fillStyle = '#5a0a1e'; g.beginPath(); g.moveTo(x + 10, by); g.lineTo(x + 90, by); g.lineTo(x + 90, by + 250); g.lineTo(x + 70, by + 220); g.lineTo(x + 56, by + 270); g.lineTo(x + 38, by + 230); g.lineTo(x + 10, by + 260); g.closePath(); g.fill();
            g.save(); g.strokeStyle = '#ff7a9a'; g.shadowColor = '#ff2a6a'; g.shadowBlur = 10; g.lineWidth = 3; const sy = by + 100;
            g.beginPath(); g.arc(x + 50, sy, 24, 0, TAU); g.moveTo(x + 50, sy - 34); g.lineTo(x + 50, sy + 34); g.moveTo(x + 34, sy - 8); g.lineTo(x + 50, sy + 6); g.lineTo(x + 66, sy - 8); g.stroke(); g.restore();
          }
          // overhead chains
          g.strokeStyle = '#120208'; g.lineWidth = 4;
          for (const [x0, x1, y0, sag] of [[0, w * 0.45, 40, 120], [w * 0.55, w, 60, 100]]) for (let k = 0; k <= 30; k++) { const t = k / 30, x = x0 + (x1 - x0) * t, y = y0 + Math.sin(t * Math.PI) * sag; g.beginPath(); g.ellipse(x, y, k % 2 ? 3 : 7, 5, 0, 0, TAU); g.stroke(); }
          // rubble along the edge of the arena
          g.fillStyle = '#120309'; for (let x = 0; x < w; x += 30 + r() * 70) { const s = 10 + r() * 26; g.beginPath(); g.moveTo(x, base + 20); g.lineTo(x + s * 0.3, base - s); g.lineTo(x + s, base - s * 0.6); g.lineTo(x + s * 1.3, base + 20); g.closePath(); g.fill(); }
        }),
      ];
      this.floor = mkCanvas(STAGE_W + 400, 260, g => {
        const FW = STAGE_W + 400, gr = g.createLinearGradient(0, 0, 0, 260); gr.addColorStop(0, '#3a1424'); gr.addColorStop(1, '#08020a'); g.fillStyle = gr; g.fillRect(0, 0, FW, 260);
        g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 2;
        for (let y = 0, h = 14, row = 0; y < 260; y += h, h *= 1.34, row++) { g.beginPath(); g.moveTo(0, y); g.lineTo(FW, y); g.stroke(); for (let x = (row % 2) * 80; x < FW; x += 160 + h) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + h); g.stroke(); } }
        g.save(); g.shadowColor = '#ff2a5a'; g.shadowBlur = 10; g.strokeStyle = '#ff4a6a'; g.lineWidth = 2;
        for (let i = 0; i < 16; i++) { let x = rand(0, FW), y = rand(10, 220); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += rand(-50, 50); y += rand(-8, 14); g.lineTo(x, y); } g.stroke(); }
        // the seal around the throne's arena
        const cx = STAGE_W / 2 + 200; g.strokeStyle = 'rgba(255,70,130,0.42)'; g.lineWidth = 3;
        g.beginPath(); g.ellipse(cx, 74, 300, 48, 0, 0, TAU); g.stroke(); g.lineWidth = 2; g.beginPath(); g.ellipse(cx, 74, 250, 39, 0, 0, TAU); g.stroke();
        g.beginPath(); for (let k = 0; k <= 5; k++) { const a = -Math.PI / 2 + k * TAU * 2 / 5, x = cx + Math.cos(a) * 250, y = 74 + Math.sin(a) * 39; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
        g.restore();
        const sh = g.createLinearGradient(0, 0, 0, 40); sh.addColorStop(0, 'rgba(255,80,120,0.22)'); sh.addColorStop(1, 'rgba(255,80,120,0)'); g.fillStyle = sh; g.fillRect(0, 0, FW, 40);
      });
    },
    update(bt) {
      const cam = bt.cam;
      if (Math.random() < 0.3) FX.p({ type: 'ember', x: cam.x + rand(-700, 700), y: GROUND + 10, vx: rand(-0.3, 0.3), vy: -rand(0.6, 1.8), life: rand(90, 170), size: rand(1.2, 2.6), color: pick(['#ff6aa8', '#ff3a6a', '#ffb0d8']), drag: 0.995 });
      for (const x of [260, STAGE_W - 260]) FX.flame(x, GROUND - 112, '#ff3a7a', 1, 10, 2.4);
    },
    bgAnim(g, cam, t) {
      // the eclipse corona breathes (vector mode)
      const [x, y, s] = layerPt(this, 0, this.ecl[0], this.ecl[1], cam), R = this.ecl[2] * s, p = 0.5 + 0.5 * Math.sin(t * 0.03);
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,90,110,${0.15 + 0.2 * p})`; g.lineWidth = 6 * s; g.beginPath(); g.arc(x, y, R * (1.06 + 0.04 * p), 0, TAU); g.stroke(); g.restore();
    },
    worldBack(g) {
      for (const x of [260, STAGE_W - 260]) {
        poly(g, [[x - 36, GROUND - 112], [x + 36, GROUND - 112], [x + 22, GROUND - 88], [x + 12, GROUND], [x - 12, GROUND], [x - 22, GROUND - 88]], '#2a0a18', { ol: 2.5 });
        g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(x, GROUND - 130, 0, x, GROUND - 130, 160); gr.addColorStop(0, 'rgba(255,60,130,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 160, GROUND - 290, 320, 320); g.restore();
      }
    },
    front(g) {
      const v = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95); v.addColorStop(0, 'rgba(40,0,16,0)'); v.addColorStop(1, 'rgba(40,0,16,0.5)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
    },
  },
];
STAGES3.forEach(s => { s.build(); s.thumb = stageThumb(s, 320, 180); s.wide = stageThumb(s, 1280, 720); STAGES.push(s); });
const BOSS_STAGE = STAGES.findIndex(s => s.boss);
