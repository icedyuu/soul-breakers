// ============ PIXEL WORLD for STAGES2 (school, clock, forge): lighting + animated pixel details ============
// Visual only: everything here runs at draw time and never touches gameplay state.
function pxLine(B, x0, y0, x1, y1, w, col) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))), o = Math.floor(w / 2); B.fillStyle = col;
  for (let i = 0; i <= n; i++) B.fillRect(Math.round(x0 + (x1 - x0) * i / n) - o, Math.round(y0 + (y1 - y0) * i / n) - o, w, w);
}
function pxDisc(B, cx, cy, r, col) {
  B.fillStyle = col; const R = Math.round(r);
  for (let dy = -R; dy <= R; dy++) { const hw = Math.round(Math.sqrt(R * R - dy * dy)); B.fillRect(Math.round(cx) - hw, Math.round(cy) + dy, hw * 2 + 1, 1); }
}
function pxGear(B, cx, cy, r, teeth, a, col, hole, hi) {
  const t = Math.max(2, Math.round(r * 0.2));
  for (let k = 0; k < teeth; k++) { const aa = a + k * TAU / teeth; B.fillStyle = col; B.fillRect(Math.round(cx + Math.cos(aa) * (r + t * 0.4)) - (t >> 1), Math.round(cy + Math.sin(aa) * (r + t * 0.4)) - (t >> 1), t, t); }
  pxDisc(B, cx, cy, r, col);
  pxDisc(B, cx, cy, r * 0.62, hole);
  for (let k = 0; k < 5; k++) { const aa = a + k * TAU / 5; pxLine(B, cx, cy, cx + Math.cos(aa) * r * 0.62, cy + Math.sin(aa) * r * 0.62, Math.max(2, Math.round(r * 0.14)), col); }
  pxDisc(B, cx, cy, r * 0.2, col);
  if (hi) { B.fillStyle = hi; for (let k = 0; k < 10; k++) { const aa = -2.6 + k * 0.13; B.fillRect(Math.round(cx + Math.cos(aa) * (r - 1)), Math.round(cy + Math.sin(aa) * (r - 1)), 1, 1); } }
}
Object.assign(STAGE_PX, {
  school: {
    rim: { c: [190, 205, 255], dx: 1, dy: -1, s: 0.45 }, amb: { c: [60, 70, 170], s: 0.06 },
    init(st) { st.pxs = { clouds: Array.from({ length: 6 }, (_, i) => ({ x: i * 120 + rand(0, 60), y: rand(20, 110), w: rand(40, 90), v: rand(0.03, 0.08) })) }; },
    sky(B, t, cam, st) {
      // slow clouds drifting across the moon
      for (const c of st.pxs.clouds) {
        c.x += c.v; if (c.x > PW + 100) c.x = -c.w - 20;
        const x = Math.round(c.x), y = Math.round(c.y), w = Math.round(c.w);
        B.fillStyle = 'rgba(30,40,90,0.55)'; B.fillRect(x, y, w, 5); B.fillRect(x + 8, y - 3, w - 22, 3); B.fillRect(x + 4, y + 5, w - 12, 2);
        B.fillStyle = 'rgba(190,200,255,0.18)'; B.fillRect(x + 8, y - 3, w - 22, 1);
      }
    },
    animAt: {
      0(B, t, cam, st) {   // red warning light on the radio tower
        const [x, y] = layerPt(st, 0, st.towerTop[0], st.towerTop[1], cam, PXS);
        if (t % 70 < 35) { B.fillStyle = 'rgba(255,40,60,0.3)'; B.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5); B.fillStyle = '#ff3a4a'; B.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); }
      },
      1(B, t, cam, st) {   // classroom lights switching on and off, one broken fluorescent flickering
        st.win1.forEach(([wx, wy], i) => {
          const flick = i === 0 ? ((t * 7 + (t >> 3) * 13) % 23) < 9 : Math.sin(t * 0.004 + i * 1.7) > 0.55;
          if (!flick) return;
          const [x, y, s] = layerPt(st, 1, wx, wy, cam, PXS), w = Math.round(34 * s), h = Math.round(50 * s);
          B.fillStyle = i === 0 ? '#d8ecff' : '#ffe7a6'; B.fillRect(Math.round(x), Math.round(y), w, h);
          B.fillStyle = i === 0 ? '#9fb8d8' : '#d9b46a'; B.fillRect(Math.round(x + 16 * s), Math.round(y), 1, h); B.fillRect(Math.round(x), Math.round(y + 24 * s), w, 1);
        });
      },
    },
    floorAnim(B, t, cam, gy) {
      B.save(); B.globalCompositeOperation = 'lighter'; B.fillStyle = '#c8d4ff';
      for (let i = 0; i < 14; i++) { B.globalAlpha = 0.05 + 0.04 * Math.sin(t * 0.03 + i * 2); B.fillRect(((i * 57 - Math.round(cam.x * cam.z / PXS)) % 700 + 700) % 700 - 30, gy + 8 + (i * 7) % 34, 10 + (i % 3) * 4, 1); }
      B.restore();
    },
  },
  clock: {
    rim: { c: [255, 190, 110], dx: 0, dy: -1, s: 0.5 }, amb: { c: [170, 95, 35], s: 0.06 },
    init(st) { st.pxs = { dust: Array.from({ length: 50 }, () => ({ x: rand(0, PW), y: rand(0, PH), v: rand(0.04, 0.15), p: rand(0, 50) })) }; },
    animAt: {
      0(B, t, cam, st) {
        const [x, y, s] = layerPt(st, 0, st.face[0], st.face[1], cam, PXS), R = st.face[2] * s;
        // light shafts from the clock face
        B.save(); B.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
          B.globalAlpha = 0.05 + 0.02 * Math.sin(t * 0.015 + i * 2); B.fillStyle = '#ffd08a';
          const x0 = x - R * 0.6 + i * R * 0.6;
          for (let yy = 0; yy < 200; yy += 4) B.fillRect(Math.round(x0 + yy * 0.25 - 8), Math.round(y + yy), 16 + (yy >> 3), 4);
        }
        B.restore();
        // turning gears in front of the face (they mesh: opposite directions)
        const a = t * 0.01;
        pxGear(B, x - R * 0.92, y + R * 0.78, 46 * s, 14, a, '#2a160a', '#170b04', '#ffb35a');
        pxGear(B, x - R * 0.45, y + R * 1.12, 28 * s, 10, -a * 1.6 + 0.2, '#2e190c', '#170b04', '#ffb35a');
        pxGear(B, x + R * 0.95, y + R * 0.7, 40 * s, 12, -a * 1.1, '#2a160a', '#170b04', '#ffb35a');
        // the hands: minute hand sweeps, hour hand creeps
        const am = -Math.PI / 2 - t * 0.004, ah = -0.9 - t * 0.004 / 12;
        pxLine(B, x, y, x + Math.cos(ah) * R * 0.45, y + Math.sin(ah) * R * 0.45, Math.max(4, Math.round(10 * s)), '#1a0c04');
        pxLine(B, x, y, x + Math.cos(am) * R * 0.7, y + Math.sin(am) * R * 0.7, Math.max(3, Math.round(6 * s)), '#1a0c04');
        pxDisc(B, x, y, 9 * s, '#1a0c04'); B.fillStyle = '#ffb35a'; B.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
      },
    },
    floorAnim(B, t, cam, gy) {
      const cx = (W / 2 + FX.sx + cam.z * (STAGE_W / 2 - cam.x)) / PXS;
      B.save(); B.globalCompositeOperation = 'lighter'; B.fillStyle = '#ffb35a';
      for (let r = 0; r < 5; r++) { B.globalAlpha = (0.06 - r * 0.01) * (0.8 + 0.2 * Math.sin(t * 0.02)); B.fillRect(Math.round(cx - 140 + r * 22), gy + 2 + r * 3, 280 - r * 44, 14 - r * 2); }
      B.restore();
    },
    front(B, st, cam, t) {
      B.setTransform(1, 0, 0, 1, 0, 0);
      for (const d of st.pxs.dust) { d.y -= d.v; d.x += Math.sin(t * 0.01 + d.p) * 0.12; if (d.y < -2) { d.y = PH + 2; d.x = rand(0, PW); } if (Math.sin(t * 0.03 + d.p) > -0.2) { B.fillStyle = 'rgba(255,220,160,0.5)'; B.fillRect(Math.round(d.x), Math.round(d.y), 1, 1); } }
      for (let r = 0; r < 6; r++) { B.fillStyle = `rgba(20,8,2,${0.05 * (6 - r) / 6})`; B.fillRect(0, r * 5, PW, 5); }
      B.setTransform(1 / PXS, 0, 0, 1 / PXS, 0, 0);
    },
  },
  forge: {
    rim: { c: [110, 235, 255], dx: -1, dy: -1, s: 0.5 }, amb: { c: [30, 90, 130], s: 0.06 },
    init(st) { st.pxs = { snow: Array.from({ length: 80 }, () => ({ x: rand(0, PW), y: rand(0, PH), v: rand(0.25, 0.7), w: rand(0, 6) })) }; },
    sky(B, t) {   // aurora ribbons
      B.save(); B.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        B.fillStyle = ['#3affc8', '#4ad8ff', '#9a7aff'][i];
        for (let x = 0; x < PW; x += 2) {
          const y = 26 + i * 16 + Math.sin(x * 0.018 + t * 0.006 + i * 1.3) * 12 + Math.sin(x * 0.05 - t * 0.01) * 3;
          B.globalAlpha = (0.05 + 0.04 * Math.sin(x * 0.03 + t * 0.012 + i)) * (i === 2 ? 0.6 : 1);
          B.fillRect(x, Math.round(y), 2, 12 + Math.round(4 * Math.sin(x * 0.04 + i)));
        }
      }
      B.restore();
    },
    animAt: {
      1(B, t, cam, st) { pxRunes(B, t, cam, st, 1, st.runes1, 0); },
      2(B, t, cam, st) { pxRunes(B, t, cam, st, 2, st.runes2, 3); },
    },
    floorAnim(B, t, cam, gy) {
      const cx = (W / 2 + FX.sx + cam.z * (STAGE_W / 2 - cam.x)) / PXS, s = cam.z / PXS;
      B.save(); B.globalCompositeOperation = 'lighter'; B.fillStyle = '#6ff3ff';
      for (let k = 0; k < 48; k++) {
        const a = k * TAU / 48 + t * 0.004, glow = 0.5 + 0.5 * Math.sin(t * 0.05 - k * 0.5);
        B.globalAlpha = 0.08 + 0.22 * glow * glow;
        B.fillRect(Math.round(cx + Math.cos(a) * 228 * s), Math.round(gy + 70 * s + Math.sin(a) * 38 * s), 2, 1);
      }
      B.restore();
    },
    front(B, st, cam, t) {
      B.setTransform(1, 0, 0, 1, 0, 0);
      for (const f of st.pxs.snow) { f.y += f.v; f.x += Math.sin(t * 0.015 + f.w) * 0.25 - 0.12; if (f.y > PH) { f.y = -3; f.x = rand(0, PW); } B.fillStyle = f.w > 4.5 ? '#ffffff' : 'rgba(210,230,255,0.6)'; B.fillRect(Math.round(f.x), Math.round(f.y), f.w > 4.5 ? 2 : 1, f.w > 4.5 ? 2 : 1); }
      for (let r = 0; r < 6; r++) { B.fillStyle = `rgba(60,200,255,${0.025 * (6 - r) / 6})`; B.fillRect(0, PH - 8 - r * 6, PW, 6); }
      B.setTransform(1 / PXS, 0, 0, 1 / PXS, 0, 0);
    },
  },
});
function pxRunes(B, t, cam, st, li, pts, ph) {
  B.save(); B.globalCompositeOperation = 'lighter';
  pts.forEach(([lx, ly], i) => {
    const glow = 0.5 + 0.5 * Math.sin(t * 0.04 - i * 0.6 + ph); if (glow < 0.35) return;
    const [x, y] = layerPt(st, li, lx, ly, cam, PXS);
    B.globalAlpha = 0.18 * glow; B.fillStyle = '#3fdcff'; B.fillRect(Math.round(x) - 4, Math.round(y) - 5, 9, 11);
    B.globalAlpha = 0.5 * glow; B.fillStyle = '#bffaff'; B.fillRect(Math.round(x) - 1, Math.round(y) - 3, 2, 7);
  });
  B.restore();
}
