// =============================== STAGES ===============================
// Each stage: sky gradient, parallax layers pre-rendered to canvases
// (layer canvas y = screen y + 100), a world-space floor texture, and ambient FX.
const LAYER_PAD = 100;
function layerCanvas(f, fn) {
  const w = Math.ceil(W + (STAGE_W - W) * f + 260), h = H + 200;
  return { f, c: mkCanvas(w, h, (g) => fn(g, w, h)) };
}
function neonText(g, text, x, y, size, color, font = FONT_JPS, vertical = false) {
  g.save(); g.font = `900 ${size}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = color; g.shadowBlur = size * 0.6; g.fillStyle = color;
  if (vertical) [...text].forEach((ch, i) => g.fillText(ch, x, y + i * size * 1.05)); else g.fillText(text, x, y);
  g.shadowBlur = 0; g.fillStyle = '#ffffff'; g.globalAlpha = 0.65;
  if (vertical) [...text].forEach((ch, i) => g.fillText(ch, x, y + i * size * 1.05)); else g.fillText(text, x, y);
  g.restore();
}
function srand(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function bamboo(g, x, base, top, w, col, r) {
  g.fillStyle = col; g.fillRect(x - w / 2, top, w, base - top);
  g.fillStyle = 'rgba(0,0,0,0.35)'; for (let y = base; y > top; y -= rand(50, 90)) g.fillRect(x - w / 2 - 1, y, w + 2, 3);
  g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x - w / 2 + w * 0.2, top, w * 0.15, base - top);
}
function leaves(g, x, y, col, n) {
  g.fillStyle = col;
  for (let i = 0; i < n; i++) { const a = rand(-0.4, Math.PI + 0.4), L = rand(18, 40); g.save(); g.translate(x + rand(-20, 20), y + rand(-20, 20)); g.rotate(a); g.beginPath(); g.ellipse(L / 2, 0, L / 2, 3.5, 0, 0, TAU); g.fill(); g.restore(); }
}

const STAGES = [
  {
    id: 'neon', name: 'NEON DISTRICT', jp: '電脳街', music: 'neon',
    sky: ['#05030f', '#170a30', '#4b1152'],
    build() {
      const base = GROUND + LAYER_PAD - 20;
      this.layers = [
        layerCanvas(0.1, (g, w) => {
          const r = srand(11);
          const hz = g.createLinearGradient(0, base - 300, 0, base); hz.addColorStop(0, 'rgba(255,60,170,0)'); hz.addColorStop(1, 'rgba(255,60,170,0.35)'); g.fillStyle = hz; g.fillRect(0, base - 300, w, 300);
          for (let x = 0; x < w; x += 30 + r() * 50) {
            const bw = 40 + r() * 70, bh = 120 + r() * 300; g.fillStyle = '#140b2b'; g.fillRect(x, base - bh, bw, bh + 40);
            for (let wy = base - bh + 8; wy < base; wy += 12) for (let wx = x + 5; wx < x + bw - 6; wx += 9) if (r() < 0.22) { g.fillStyle = pick(['#ffd27a', '#7ff6ff', '#ff7ad9', '#a58bff']); g.globalAlpha = 0.25 + r() * 0.5; g.fillRect(wx, wy, 4, 5); g.globalAlpha = 1; }
            if (r() < 0.3) { g.fillStyle = '#ff3366'; g.fillRect(x + bw / 2, base - bh - 30, 2, 30); g.shadowColor = '#ff3366'; g.shadowBlur = 8; g.beginPath(); g.arc(x + bw / 2 + 1, base - bh - 30, 3, 0, TAU); g.fill(); g.shadowBlur = 0; }
          }
        }),
        layerCanvas(0.32, (g, w) => {
          const r = srand(23), signs = ['ネオン', '電脳', '魂', 'ラーメン', 'カラオケ', '闘', '夜市', '影'], cols = ['#ff2fa0', '#29f0ff', '#ffe14a', '#9b5cff', '#ff5a2a'];
          for (let x = -20; x < w; x += 110 + r() * 90) {
            const bw = 90 + r() * 80, bh = 240 + r() * 260;
            g.fillStyle = '#0b0618'; g.fillRect(x, base - bh, bw, bh + 40);
            g.fillStyle = '#160c2a'; g.fillRect(x + bw - 10, base - bh, 10, bh);
            for (let wy = base - bh + 14; wy < base - 20; wy += 22) for (let wx = x + 10; wx < x + bw - 16; wx += 18) if (r() < 0.15) { g.fillStyle = 'rgba(255,220,150,0.35)'; g.fillRect(wx, wy, 9, 11); }
            if (r() < 0.75) { const s = pick(signs), c = pick(cols), sz = 26 + r() * 14; g.fillStyle = 'rgba(10,4,20,0.9)'; g.fillRect(x + 8, base - bh + 30, sz + 12, s.length * sz * 1.05 + 14); g.strokeStyle = c; g.lineWidth = 2; g.shadowColor = c; g.shadowBlur = 10; g.strokeRect(x + 8, base - bh + 30, sz + 12, s.length * sz * 1.05 + 14); g.shadowBlur = 0; neonText(g, s, x + 14 + sz / 2, base - bh + 37 + sz / 2, sz, c, FONT_JPS, true); }
          }
          g.strokeStyle = '#05020c'; g.lineWidth = 2;
          for (let i = 0; i < 6; i++) { g.beginPath(); const y = base - 380 + i * 30; g.moveTo(0, y); for (let x = 0; x < w; x += 200) g.quadraticCurveTo(x + 100, y + 40, x + 200, y); g.stroke(); }
          neonText(g, 'NEO KYOTO', w * 0.55, base - 430, 46, '#29f0ff', FONT_T);
        }),
        layerCanvas(0.62, (g, w) => {
          const r = srand(5);
          for (let x = 60; x < w; x += 380 + r() * 300) {
            g.fillStyle = '#07040f'; g.fillRect(x, base - 170, 90, 150); g.beginPath(); g.ellipse(x + 45, base - 170, 45, 14, 0, 0, TAU); g.fill();
            g.fillRect(x + 10, base - 20, 8, 30); g.fillRect(x + 72, base - 20, 8, 30);
            g.fillRect(x + 150, base - 60, 70, 60); g.strokeStyle = '#1a1030'; g.lineWidth = 3; g.beginPath(); g.arc(x + 185, base - 30, 18, 0, TAU); g.stroke();
          }
          g.fillStyle = '#07040f'; g.fillRect(0, base - 40, w, 8); for (let x = 0; x < w; x += 46) g.fillRect(x, base - 40, 4, 60);
          g.strokeStyle = '#ff2fa0'; g.shadowColor = '#ff2fa0'; g.shadowBlur = 12; g.lineWidth = 2; g.beginPath(); g.moveTo(0, base - 36); g.lineTo(w, base - 36); g.stroke(); g.shadowBlur = 0;
        }),
      ];
      this.floor = mkCanvas(STAGE_W + 400, 260, g => {
        const gr = g.createLinearGradient(0, 0, 0, 260); gr.addColorStop(0, '#1a1030'); gr.addColorStop(1, '#06040c'); g.fillStyle = gr; g.fillRect(0, 0, STAGE_W + 400, 260);
        for (let i = 0; i < 70; i++) { const x = rand(0, STAGE_W + 400), c = pick(['#ff2fa0', '#29f0ff', '#9b5cff']); const s = g.createLinearGradient(0, 0, 0, 180); s.addColorStop(0, c); s.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = rand(0.05, 0.18); g.fillStyle = s; g.fillRect(x, 0, rand(4, 18), rand(60, 180)); }
        g.globalAlpha = 1; g.strokeStyle = 'rgba(255,255,255,0.05)'; for (let y = 10; y < 260; y += y * 0.35 + 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(STAGE_W + 400, y); g.stroke(); }
        g.strokeStyle = 'rgba(41,240,255,0.25)'; g.lineWidth = 3; g.beginPath(); g.ellipse(STAGE_W / 2 + 200, 70, 230, 40, 0, 0, TAU); g.stroke();
        g.font = `900 46px ${FONT_JPS}`; g.textAlign = 'center'; g.fillStyle = 'rgba(41,240,255,0.15)'; g.fillText('魂 砕 き', STAGE_W / 2 + 200, 86);
      });
      this.rain = Array.from({ length: 110 }, () => ({ x: rand(0, W), y: rand(0, H), s: rand(14, 22) }));
    },
    update() { for (const d of this.rain) { d.y += d.s; d.x -= d.s * 0.18; if (d.y > H) { d.y = -20; d.x = rand(0, W + 100); } } },
    front(g) {
      g.strokeStyle = 'rgba(170,200,255,0.25)'; g.lineWidth = 1.2; g.beginPath();
      for (const d of this.rain) { g.moveTo(d.x, d.y); g.lineTo(d.x + d.s * 0.18, d.y - d.s * 1.4); }
      g.stroke();
    },
    worldBack(g, t) {
      for (const x of [55, STAGE_W - 55]) { g.fillStyle = '#0a0614'; g.fillRect(x - 8, GROUND - 260, 16, 260); g.fillStyle = '#ff2fa0'; g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 0.1 + x); g.shadowColor = '#ff2fa0'; g.shadowBlur = 16; g.fillRect(x - 2, GROUND - 255, 4, 250); g.shadowBlur = 0; g.globalAlpha = 1; }
    },
  },
  {
    id: 'volcano', name: 'CRIMSON VOLCANO', jp: '紅蓮神殿', music: 'volcano',
    sky: ['#120202', '#4a0a04', '#c2410c'],
    build() {
      const base = GROUND + LAYER_PAD - 20;
      this.layers = [
        layerCanvas(0.08, (g, w) => {
          const cx = w * 0.55;
          g.fillStyle = 'rgba(40,10,10,0.5)'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(cx + rand(-200, 200), base - 520 - rand(0, 150), rand(50, 120), 0, TAU); g.fill(); }
          g.fillStyle = '#2a0806'; g.beginPath(); g.moveTo(cx - 620, base); g.lineTo(cx - 90, base - 420); g.lineTo(cx + 90, base - 420); g.lineTo(cx + 620, base); g.closePath(); g.fill();
          g.save(); g.shadowColor = '#ff6a1a'; g.shadowBlur = 30; g.fillStyle = '#ff7a2a'; g.beginPath(); g.ellipse(cx, base - 420, 90, 14, 0, 0, TAU); g.fill();
          g.strokeStyle = '#ff5a1a'; g.lineWidth = 4; for (let i = 0; i < 6; i++) { g.beginPath(); let x = cx + rand(-60, 60), y = base - 415; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += rand(-30, 30) + (x > cx ? 15 : -15); y += 50; g.lineTo(x, y); } g.stroke(); }
          g.restore();
          g.fillStyle = '#1a0505'; g.beginPath(); g.moveTo(0, base); for (let x = 0; x <= w; x += 80) g.lineTo(x, base - 120 - Math.sin(x * 0.01) * 50 - rand(0, 30)); g.lineTo(w, base); g.closePath(); g.fill();
        }),
        layerCanvas(0.3, (g, w) => {
          for (let x = 80; x < w; x += 420 + rand(0, 200)) {
            g.fillStyle = '#160404';
            for (let tier = 0; tier < 3; tier++) {
              const y = base - 110 - tier * 95, ww = 220 - tier * 45;
              g.fillRect(x - ww / 2 + 20, y, ww - 40, 95);
              g.beginPath(); g.moveTo(x - ww / 2 - 30, y + 10); g.quadraticCurveTo(x - ww / 2, y - 6, x, y - 30); g.quadraticCurveTo(x + ww / 2, y - 6, x + ww / 2 + 30, y + 10); g.closePath(); g.fill();
            }
            g.fillRect(x - 6, base - 420, 12, 60);
            for (let i = 0; i < 4; i++) { g.save(); g.shadowColor = '#ff8a2a'; g.shadowBlur = 16; g.fillStyle = '#ff9a3a'; g.beginPath(); g.ellipse(x - 90 + i * 60, base - 95, 7, 10, 0, 0, TAU); g.fill(); g.restore(); }
          }
        }),
        layerCanvas(0.6, (g, w) => {
          for (let x = 40; x < w; x += 520 + rand(0, 160)) {
            const gr = g.createLinearGradient(x, 0, x + 60, 0); gr.addColorStop(0, '#1d0a08'); gr.addColorStop(0.5, '#3a1510'); gr.addColorStop(1, '#120504');
            g.fillStyle = gr; g.fillRect(x, base - 460, 60, 480);
            g.fillStyle = '#5a1010'; g.fillRect(x - 12, base - 470, 84, 22); g.fillRect(x - 6, base - 20, 72, 30);
            g.strokeStyle = '#2a1410'; g.lineWidth = 5; g.beginPath(); g.moveTo(x + 60, base - 400); g.quadraticCurveTo(x + 200, base - 300, x + 340, base - 410); g.stroke();
          }
        }),
      ];
      this.floor = mkCanvas(STAGE_W + 400, 260, g => {
        const gr = g.createLinearGradient(0, 0, 0, 260); gr.addColorStop(0, '#3a1a14'); gr.addColorStop(1, '#100605'); g.fillStyle = gr; g.fillRect(0, 0, STAGE_W + 400, 260);
        g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2;
        for (let y = 0, h = 14; y < 260; y += h, h *= 1.35) { g.beginPath(); g.moveTo(0, y); g.lineTo(STAGE_W + 400, y); g.stroke(); for (let x = (y % 2) * 40; x < STAGE_W + 400; x += 80 + h * 2) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + h); g.stroke(); } }
        g.save(); g.shadowColor = '#ff5a1a'; g.shadowBlur = 12; g.strokeStyle = '#ff7a2a'; g.lineWidth = 2.5;
        for (let i = 0; i < 26; i++) { let x = rand(0, STAGE_W + 400), y = rand(5, 200); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += rand(-40, 40); y += rand(-10, 15); g.lineTo(x, y); } g.stroke(); }
        g.restore();
      });
    },
    update(bt) {
      const cam = bt.cam;
      if (Math.random() < 0.5) FX.p({ type: 'ember', x: cam.x + rand(-700, 700), y: GROUND + 20, vx: rand(-0.5, 0.8), vy: -rand(1, 3), life: rand(60, 120), size: rand(1.2, 2.8), color: pick(['#ff8a2a', '#ffcc55', '#ff4a1a']), drag: 0.995 });
      for (const x of [260, STAGE_W - 260]) FX.flame(x, GROUND - 120, '#ff7a1a', 2, 12, 2.5);
    },
    worldBack(g) {
      for (const x of [260, STAGE_W - 260]) { poly(g, [[x - 30, GROUND - 120], [x + 30, GROUND - 120], [x + 14, GROUND - 90], [x + 10, GROUND], [x - 10, GROUND], [x - 14, GROUND - 90]], '#2a1410', { ol: 2.5 }); g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(x, GROUND - 140, 0, x, GROUND - 140, 160); gr.addColorStop(0, 'rgba(255,120,40,0.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 160, GROUND - 300, 320, 320); g.restore(); }
    },
    front(g) { const gr = g.createLinearGradient(0, H - 120, 0, H); gr.addColorStop(0, 'rgba(255,80,20,0)'); gr.addColorStop(1, 'rgba(255,80,20,0.12)'); g.fillStyle = gr; g.fillRect(0, H - 120, W, 120); },
  },
  {
    id: 'bamboo', name: 'MOONLIT BAMBOO', jp: '月下竹林', music: 'bamboo',
    sky: ['#02050d', '#0b1a33', '#29466f'],
    moon: true,
    build() {
      const base = GROUND + LAYER_PAD - 20;
      this.layers = [
        layerCanvas(0.1, (g, w) => {
          g.fillStyle = '#0f2036'; g.beginPath(); g.moveTo(0, base); for (let x = 0; x <= w; x += 60) g.lineTo(x, base - 160 - Math.sin(x * 0.006) * 90 - rand(0, 20)); g.lineTo(w, base); g.closePath(); g.fill();
          for (let x = 0; x < w; x += rand(14, 30)) bamboo(g, x, base, base - rand(350, 620), rand(5, 9), '#132a44');
        }),
        layerCanvas(0.35, (g, w) => {
          for (let x = 0; x < w; x += rand(40, 90)) { bamboo(g, x, base, -50, rand(10, 16), '#0e2228'); if (Math.random() < 0.5) leaves(g, x, rand(60, 400), '#12302e', 10); }
          for (let x = 300; x < w; x += 900) {
            g.fillStyle = '#7e1424'; g.fillRect(x, base - 280, 22, 280); g.fillRect(x + 220, base - 280, 22, 280);
            g.fillRect(x - 30, base - 255, 302, 16); g.beginPath(); g.moveTo(x - 50, base - 300); g.quadraticCurveTo(x + 121, base - 280, x + 292, base - 300); g.lineTo(x + 280, base - 278); g.quadraticCurveTo(x + 121, base - 262, x - 38, base - 278); g.closePath(); g.fill();
            g.fillStyle = '#1a1a1e'; g.fillRect(x - 54, base - 306, 350, 8);
          }
        }),
        layerCanvas(0.65, (g, w) => {
          for (let x = 30; x < w; x += rand(180, 320)) { bamboo(g, x, base, -100, rand(18, 26), '#081416'); leaves(g, x, rand(40, 250), '#0b2020', 14); }
          for (let x = 500; x < w; x += 700) { g.fillStyle = '#121418'; g.fillRect(x - 14, base - 90, 28, 90); g.fillRect(x - 30, base - 110, 60, 24); g.beginPath(); g.moveTo(x - 40, base - 110); g.lineTo(x, base - 140); g.lineTo(x + 40, base - 110); g.fill(); g.save(); g.shadowColor = '#ffcf6a'; g.shadowBlur = 18; g.fillStyle = '#ffcf6a'; g.fillRect(x - 10, base - 104, 20, 12); g.restore(); }
        }),
      ];
      this.floor = mkCanvas(STAGE_W + 400, 260, g => {
        const gr = g.createLinearGradient(0, 0, 0, 260); gr.addColorStop(0, '#4a3020'); gr.addColorStop(1, '#120a06'); g.fillStyle = gr; g.fillRect(0, 0, STAGE_W + 400, 260);
        g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 2;
        for (let y = 0, h = 10; y < 260; y += h, h *= 1.3) { g.beginPath(); g.moveTo(0, y); g.lineTo(STAGE_W + 400, y); g.stroke(); }
        for (let i = 0; i < 300; i++) { g.strokeStyle = 'rgba(255,230,190,0.04)'; const y = rand(0, 260); g.beginPath(); g.moveTo(rand(0, STAGE_W + 400), y); g.lineTo(rand(0, STAGE_W + 400), y); g.stroke(); }
        const sh = g.createLinearGradient(0, 0, 0, 40); sh.addColorStop(0, 'rgba(180,210,255,0.18)'); sh.addColorStop(1, 'rgba(180,210,255,0)'); g.fillStyle = sh; g.fillRect(0, 0, STAGE_W + 400, 40);
      });
    },
    update(bt) {
      const cam = bt.cam;
      if (Math.random() < 0.25) FX.p({ type: 'petal', x: cam.x + rand(-700, 800), y: cam.y - 420, vx: rand(-1.4, -0.3), vy: rand(0.8, 1.6), life: 400, size: rand(3, 5.5), color: pick(['#ffb7d5', '#ffc9df', '#f7a1c4']), rot: rand(0, 6), vr: rand(-0.05, 0.05), add: false, drag: 1 });
      if (Math.random() < 0.08) FX.p({ type: 'ember', x: cam.x + rand(-600, 600), y: GROUND - rand(20, 300), vx: rand(-0.4, 0.4), vy: rand(-0.4, 0.4), life: 140, size: 2.2, color: '#d8ff7a', drag: 1 });
    },
  },
];
STAGES.forEach(s => s.build());

function drawStageBG(g, st, cam, t) {
  const sk = g.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, st.sky[0]); sk.addColorStop(0.55, st.sky[1]); sk.addColorStop(1, st.sky[2]);
  g.fillStyle = sk; g.fillRect(0, 0, W, H);
  if (st.moon) {
    const mx = 930 - (cam.x - W / 2) * 0.03, my = 170 - (cam.y - H / 2) * 0.03;
    const gl = g.createRadialGradient(mx, my, 60, mx, my, 330); gl.addColorStop(0, 'rgba(255,240,200,0.35)'); gl.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gl; g.fillRect(mx - 330, my - 330, 660, 660);
    g.fillStyle = '#fff3d6'; g.beginPath(); g.arc(mx, my, 105, 0, TAU); g.fill();
    g.fillStyle = 'rgba(210,190,150,0.35)'; for (const [dx, dy, r] of [[-30, -20, 22], [25, 30, 16], [40, -35, 12], [-10, 45, 10]]) { g.beginPath(); g.arc(mx + dx, my + dy, r, 0, TAU); g.fill(); }
  }
  st.layers.forEach((L, i) => {
    g.save(); g.translate(W / 2 + FX.sx * L.f, H / 2 + FX.sy * L.f); g.scale(cam.z, cam.z); g.translate(-W / 2, -H / 2);
    g.drawImage(L.c, Math.round(-(cam.x - W / 2) * L.f - 130), Math.round(-(cam.y - H / 2) * L.f * 0.6 - LAYER_PAD));
    g.restore();
    if (i === 0 && st.bgAnim) st.bgAnim(g, cam, t);
  });
}
// static thumbnail renders for menus
function stageThumb(st, w, h) {
  return mkCanvas(w, h, g => { g.scale(w / W, h / H); const cam = { x: STAGE_W / 2, y: H / 2, z: 1 }; drawStageBG(g, st, cam, 0); g.translate(W / 2 - cam.x, 0); g.drawImage(st.floor, -200, GROUND); });
}
STAGES.forEach(s => { s.thumb = stageThumb(s, 320, 180); s.wide = stageThumb(s, 1280, 720); });
