// ===================== PIXEL WORLD: stages, lighting, battle rendering =====================
// Per-arena art direction: rim light colour/direction applied to fighters, an ambient tint,
// and animated pixel-level details drawn straight into the 640×360 layer.
const STAGE_PX = {
  neon: {
    rim: { c: [255, 96, 214], dx: 1, dy: -1, s: 0.5 }, amb: { c: [110, 60, 190], s: 0.05 },
    init(st) {
      st.pxs = {
        win: Array.from({ length: 90 }, () => ({ x: rand(0, 700), y: rand(60, 250), c: pick(['#ffd27a', '#7ff6ff', '#ff7ad9', '#a58bff']), p: rand(0, 50), s: rand(0.02, 0.08) })),
        drones: [{ x: 50, y: 36, v: 0.35, c: '#ff3366' }, { x: 520, y: 58, v: -0.25, c: '#29f0ff' }, { x: 300, y: 22, v: 0.18, c: '#ffe14a' }],
        rain: Array.from({ length: 120 }, () => ({ x: rand(0, PW), y: rand(0, PH), s: rand(5, 9) })),
      };
    },
    anim(B, t, cam, st) {
      const P = st.pxs, ox = -(cam.x - W / 2) * 0.1 * 0.575;
      for (const w of P.win) if (Math.sin(t * w.s + w.p) > 0.55) { B.fillStyle = w.c; B.fillRect(((Math.round(w.x + ox) % 700) + 700) % 700 - 30, w.y, 2, 2); }
      for (const d of P.drones) {
        d.x += d.v; if (d.x > PW + 20) d.x = -20; if (d.x < -20) d.x = PW + 20;
        const x = Math.round(d.x), y = d.y + Math.round(Math.sin(t * 0.03 + d.y) * 2);
        B.fillStyle = '#0a0614'; B.fillRect(x - 4, y, 9, 2); B.fillRect(x - 1, y - 1, 3, 1);
        if (t % 40 < 20) { B.fillStyle = d.c; B.fillRect(x + (d.v > 0 ? 4 : -4), y, 1, 1); B.globalAlpha = 0.25; B.fillRect(x - 6, y + 2, 13, 1); B.globalAlpha = 1; }
      }
    },
    floorAnim(B, t, cam, gy) {
      // neon reflections shimmering on the wet street
      const ox = Math.round(-(cam.x) * cam.z / PXS);
      B.save(); B.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 46; i++) {
        const wx = ((i * 53 + ox) % 700 + 700) % 700 - 30, y = gy + 4 + (i * 7) % 40, len = 3 + (i % 4) * 2;
        B.globalAlpha = 0.12 + 0.1 * Math.sin(t * 0.08 + i); B.fillStyle = ['#ff2fa0', '#29f0ff', '#9b5cff', '#ffe14a'][i % 4];
        B.fillRect(wx + Math.round(Math.sin(t * 0.05 + i) * 1.5), y, len, 1);
      }
      B.restore();
    },
    front(B, st, cam, t) {
      B.setTransform(1, 0, 0, 1, 0, 0); B.fillStyle = 'rgba(180,205,255,0.35)';
      for (const d of st.pxs.rain) { d.y += d.s; d.x -= d.s * 0.2; if (d.y > PH) { d.y = -8; d.x = rand(0, PW + 40); } B.fillRect(Math.round(d.x), Math.round(d.y), 1, 4); }
      for (const d of st.pxs.rain) if (d.y > PH - 60 && d.s > 8 && (t + d.x) % 9 < 1) { B.fillRect(Math.round(d.x) - 1, PH - 12 - (d.x % 30), 3, 1); }
      B.setTransform(1 / PXS, 0, 0, 1 / PXS, 0, 0);
    },
  },
  volcano: {
    rim: { c: [255, 150, 60], dx: 0, dy: 1, s: 0.55 }, amb: { c: [200, 60, 20], s: 0.06 },
    init(st) { st.pxs = { ash: Array.from({ length: 70 }, () => ({ x: rand(0, PW), y: rand(0, PH), v: rand(0.2, 0.6), w: rand(0, 6) })), puffs: [] }; },
    anim(B, t, cam, st) {
      const P = st.pxs, L = st.layers[0], w0 = L.c.width, base = GROUND + LAYER_PAD - 20;
      const X = -(cam.x - W / 2) * L.f - 130 + w0 * 0.55, Y = -(cam.y - H / 2) * L.f * 0.6 - LAYER_PAD + base - 420;
      const cx = (W / 2 + cam.z * (X - W / 2)) / PXS, cy = (H / 2 + cam.z * (Y - H / 2)) / PXS;
      if (t % 5 === 0) P.puffs.push({ x: rand(-20, 20), y: 0, r: rand(3, 6), v: rand(0.25, 0.5), life: 160 });
      for (const p of P.puffs) { p.y -= p.v; p.x += 0.12; p.r += 0.04; p.life--; }
      P.puffs = P.puffs.filter(p => p.life > 0);
      for (const p of P.puffs) { const k = p.life / 160, r = Math.round(p.r); B.fillStyle = k > 0.8 ? '#ff7a2a' : k > 0.55 ? '#5a1a12' : '#2a0c0a'; B.globalAlpha = Math.min(1, k * 1.5) * 0.85;
        B.fillRect(Math.round(cx + p.x) - r, Math.round(cy + p.y) - r + 1, r * 2, r * 2 - 2); B.fillRect(Math.round(cx + p.x) - r + 1, Math.round(cy + p.y) - r, r * 2 - 2, r * 2); }
      B.globalAlpha = 1;
      // the crater breathes
      B.save(); B.globalCompositeOperation = 'lighter'; const pul = 0.5 + 0.5 * Math.sin(t * 0.04);
      for (let i = 0; i < 5; i++) { B.globalAlpha = (0.10 - i * 0.018) * (0.6 + 0.4 * pul); B.fillStyle = '#ff5a1a'; B.fillRect(Math.round(cx) - 30 - i * 10, Math.round(cy) - 6 - i * 4, 60 + i * 20, 12 + i * 8); }
      B.restore();
    },
    floorAnim(B, t, cam, gy) {
      B.save(); B.globalCompositeOperation = 'lighter';
      for (let r = 0; r < 6; r++) { B.globalAlpha = (0.09 - r * 0.014) * (0.7 + 0.3 * Math.sin(t * 0.05 + r)); B.fillStyle = '#ff4a10'; B.fillRect(0, gy - 2 - r * 3, PW, 2); }
      B.restore();
    },
    front(B, st, cam, t) {
      B.setTransform(1, 0, 0, 1, 0, 0);
      for (const a of st.pxs.ash) { a.y += a.v; a.x += Math.sin(t * 0.02 + a.w) * 0.3 - 0.1; if (a.y > PH) { a.y = -4; a.x = rand(0, PW); } B.fillStyle = a.w > 4 ? '#ff9a4a' : '#6a5a58'; B.fillRect(Math.round(a.x), Math.round(a.y), 1, 1); }
      for (let r = 0; r < 8; r++) { B.fillStyle = `rgba(255,70,20,${0.035 * (8 - r) / 8})`; B.fillRect(0, PH - 8 - r * 6, PW, 6); }
      B.setTransform(1 / PXS, 0, 0, 1 / PXS, 0, 0);
    },
  },
  bamboo: {
    rim: { c: [205, 222, 255], dx: 1, dy: -1, s: 0.45 }, amb: { c: [50, 80, 150], s: 0.06 },
    init(st) { st.pxs = { flies: Array.from({ length: 34 }, () => ({ x: rand(0, PW), y: rand(150, 330), p: rand(0, 50), vx: rand(-0.2, 0.2), vy: rand(-0.15, 0.15) })) }; },
    anim(B, t, cam) {
      // moonbeams through the canopy
      B.save(); B.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const x0 = ((i * 190 - (cam.x - W / 2) * 0.2 * 0.575 + t * 0.05) % 760 + 760) % 760 - 60;
        B.globalAlpha = 0.045 + 0.02 * Math.sin(t * 0.01 + i); B.fillStyle = '#cfe2ff';
        for (let y = 0; y < 300; y += 4) B.fillRect(Math.round(x0 - y * 0.35), y, 18 + (y >> 4), 4);
      }
      B.restore();
    },
    floorAnim(B, t, cam, gy) {
      B.save(); B.globalCompositeOperation = 'lighter'; B.globalAlpha = 0.07; B.fillStyle = '#cfe2ff';
      for (let i = 0; i < 12; i++) B.fillRect(((i * 61 - Math.round(cam.x * cam.z / PXS)) % 700 + 700) % 700 - 30, gy + 6 + (i * 5) % 30, 14, 1);
      B.restore();
    },
    front(B, st, cam, t) {
      B.setTransform(1, 0, 0, 1, 0, 0);
      for (const f of st.pxs.flies) {
        f.x += f.vx + Math.sin(t * 0.03 + f.p) * 0.15; f.y += f.vy + Math.cos(t * 0.025 + f.p) * 0.1;
        if (f.x < -4) f.x = PW + 4; if (f.x > PW + 4) f.x = -4; if (f.y < 120) f.vy = Math.abs(f.vy); if (f.y > 340) f.vy = -Math.abs(f.vy);
        const on = Math.sin(t * 0.06 + f.p) > 0.2; if (!on) continue;
        B.fillStyle = 'rgba(216,255,122,0.25)'; B.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 1, 3, 3);
        B.fillStyle = '#e8ff9a'; B.fillRect(Math.round(f.x), Math.round(f.y), 1, 1);
      }
      B.setTransform(1 / PXS, 0, 0, 1 / PXS, 0, 0);
    },
  },
};

// pre-pixelize the stage art once (layers at the default camera zoom map 1:1 onto art pixels)
function stagePxBuild(st) {
  if (st.px) return st.px;
  const k = PX_ZOOM / PXS, sky = cpuCanvas(PW, PH);
  const gr = sky.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, st.sky[0]); gr.addColorStop(0.55, st.sky[1]); gr.addColorStop(1, st.sky[2]);
  sky.fillStyle = gr; sky.fillRect(0, 0, PW, PH);
  if (st.moon) {
    const mx = 465, my = 85, gl = sky.createRadialGradient(mx, my, 30, mx, my, 165); gl.addColorStop(0, 'rgba(255,240,200,0.35)'); gl.addColorStop(1, 'rgba(255,240,200,0)');
    sky.fillStyle = gl; sky.fillRect(mx - 165, my - 165, 330, 330); sky.fillStyle = '#fff3d6'; sky.beginPath(); sky.arc(mx, my, 52, 0, TAU); sky.fill();
    sky.fillStyle = 'rgba(210,190,150,0.45)'; for (const [dx, dy, r] of [[-15, -10, 11], [12, 15, 8], [20, -18, 6], [-5, 22, 5]]) { sky.beginPath(); sky.arc(mx + dx, my + dy, r, 0, TAU); sky.fill(); }
  }
  // a few pixel stars
  for (let i = 0; i < 70; i++) { sky.fillStyle = `rgba(255,255,255,${rand(0.2, 0.8)})`; sky.fillRect(Math.floor(rand(0, PW)), Math.floor(rand(0, PH * 0.45)), 1, 1); }
  pxProcess(sky, PW, PH, { step: 10 });
  st.px = { sky: sky.canvas, layers: st.layers.map(L => PIX.pixelizeCanvas(L.c, k, { step: 16 })), floor: PIX.pixelizeCanvas(st.floor, k, { step: 14 }) };
  const SP = STAGE_PX[st.id]; if (SP && SP.init) SP.init(st);
  return st.px;
}
function drawStageBGPx(B, st, cam, t) {
  const P = stagePxBuild(st), SP = STAGE_PX[st.id] || {}, sc = cam.z / PX_ZOOM;
  B.setTransform(1, 0, 0, 1, 0, 0); B.imageSmoothingEnabled = false;
  B.drawImage(P.sky, 0, 0);
  st.layers.forEach((L, i) => {
    const img = P.layers[i], X = -(cam.x - W / 2) * L.f - 130, Y = -(cam.y - H / 2) * L.f * 0.6 - LAYER_PAD;
    const lx = (W / 2 + FX.sx * L.f + cam.z * (X - W / 2)) / PXS, ly = (H / 2 + FX.sy * L.f + cam.z * (Y - H / 2)) / PXS;
    B.drawImage(img, Math.round(lx), Math.round(ly), Math.round(img.width * sc), Math.round(img.height * sc));
    if (i === 0 && SP.anim) SP.anim(B, t, cam, st);
  });
  const fx = (W / 2 + FX.sx + cam.z * (-200 - cam.x)) / PXS, fy = (H / 2 + FX.sy + cam.z * (GROUND - cam.y)) / PXS;
  B.drawImage(P.floor, Math.round(fx), Math.round(fy), Math.round(P.floor.width * sc), Math.round(P.floor.height * sc));
  if (SP.floorAnim) SP.floorAnim(B, t, cam, Math.round(fy));
}
// pixelized versions of the stage previews used by menus
STAGES.forEach(st => {
  const thumbHD = st.thumb, wideHD = st.wide; let tp = null, wp = null;
  Object.defineProperty(st, 'thumb', { get() { return Settings.pixel ? (tp || (tp = PIX.pixelizeCanvas(thumbHD, 0.5, { step: 16 }))) : thumbHD; } });
  Object.defineProperty(st, 'wide', { get() { return Settings.pixel ? (wp || (wp = PIX.pixelizeCanvas(wideHD, 0.5, { step: 16 }))) : wideHD; } });
});

// ------------------------------ battle rendering ------------------------------
// screen-space bounding box (art pixels) of everything drawn in the effects pass; null when nothing is there
function fxBounds(bt, cam) {
  if (bt.cine || bt.freeze) return [0, 0, PW, PH];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, any = false;
  const add = (x, y, r) => { const [a, b] = cam.toScreen(x, y), rr = r * cam.z; x0 = Math.min(x0, a - rr); x1 = Math.max(x1, a + rr); y0 = Math.min(y0, b - rr); y1 = Math.max(y1, b + rr); any = true; };
  for (const p of bt.projs) { if (p.kind === 'beam' || p.kind === 'dragon' || p.kind === 'tidal' || p.kind === 'train' || p.w > 300) return [0, 0, PW, PH]; add(p.x, p.y, Math.max(p.w, p.h) + 140); }
  for (const q of FX.parts) if (!q.behind) add(q.x, q.y, (q.size || 4) * 3 + 20);
  for (const s of FX.sparks) add(s.x, s.y, 120);
  for (const s of FX.swooshes) add(s.x, s.y, 220);
  for (const r of FX.rings) add(r.x, r.y, r.r1 + 20);
  for (const t of FX.wtexts) add(t.x, t.y, t.size * 5);
  if (bt.showBoxes) return [0, 0, PW, PH];
  if (!any) return null;
  return [Math.max(0, Math.floor(x0 / PXS)), Math.max(0, Math.floor(y0 / PXS)), Math.min(PW, Math.ceil(x1 / PXS)), Math.min(PH, Math.ceil(y1 / PXS))];
}
Battle.prototype.drawWorldPixel = function (g) {
  PIX.init();
  const L = PIX.L, B = L.bg, cam = this.cam, t = this.pf, st = this.stage, SP = STAGE_PX[st.id] || {};
  drawStageBGPx(B, st, cam, t);
  B.setTransform(1 / PXS, 0, 0, 1 / PXS, 0, 0);
  if (this.cine && this.cine.bg) this.cine.bg(B, this.cine);
  if (FX.dark > 0.01) { B.fillStyle = `rgba(4,2,12,${FX.dark})`; B.fillRect(0, 0, W, H); }
  B.save(); cam.apply(B);
  if (st.worldBack) st.worldBack(B, this.pf);
  FX.drawParticles(B, true);
  B.restore();
  // pass 1: fighters → hard pixels, outline, arena rim light
  const A = L.a; PIX.begin(A); A.save(); cam.apply(A);
  const order = this.p2.state === 'attack' || this.p2.state === 'cine' ? [this.p1, this.p2] : [this.p2, this.p1];
  for (const F of order) F.draw(A);
  A.restore(); A.setTransform(1, 0, 0, 1, 0, 0);
  // only the columns around the fighters need processing
  const ext = [this.p1, this.p2].map(F => { const m = (F.ch.drawCustom ? 330 : 190) * cam.z, x = cam.toScreen(F.x, F.y)[0]; return [(x - m) / PXS, (x + m) / PXS]; });
  const x0 = Math.max(0, Math.floor(Math.min(ext[0][0], ext[1][0]))), x1 = Math.min(PW, Math.ceil(Math.max(ext[0][1], ext[1][1])));
  const full = !!(this.cine || this.freeze);
  pxProcess(A, full ? PW : x1 - x0, PH, { outline: true, rim: this.cine && this.cine.bg ? null : SP.rim, amb: SP.amb }, full ? 0 : x0, 0);
  B.setTransform(1, 0, 0, 1, 0, 0); B.drawImage(A.canvas, 0, 0);
  // pass 2: projectiles, slashes, sparks, particles → dithered pixel effects
  const C = L.c; PIX.begin(C); C.save(); cam.apply(C);
  for (const p of this.projs) p.draw(C);
  FX.drawWorld(C); FX.drawParticles(C, false);
  if (this.showBoxes) this.drawBoxes(C);
  C.restore();
  if (this.cine && this.cine.fg) this.cine.fg(C, this.cine);
  C.setTransform(1, 0, 0, 1, 0, 0);
  const box = fxBounds(this, cam);
  if (box) pxProcess(C, box[2] - box[0], box[3] - box[1], { step: 26 }, box[0], box[1]);
  B.setTransform(1, 0, 0, 1, 0, 0); B.drawImage(C.canvas, 0, 0);
  B.setTransform(1 / PXS, 0, 0, 1 / PXS, 0, 0);
  if (SP.front) SP.front(B, st, cam, t); else if (st.front) st.front(B);
  FX.drawScreen(B, 'fx');
  B.setTransform(1, 0, 0, 1, 0, 0);
  PIX.blit(g, B);
  FX.drawScreen(g, 'text');
};
