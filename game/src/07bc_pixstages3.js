// ============ PIXEL WORLD for STAGES3 (shrine, throne): lighting + animated pixel details ============
// Visual only: everything here runs at draw time and never touches gameplay state.
Object.assign(STAGE_PX, {
  shrine: {
    rim: { c: [255, 170, 110], dx: 1, dy: -1, s: 0.5 }, amb: { c: [130, 50, 90], s: 0.06 },
    init(st) {
      st.pxs = {
        clouds: Array.from({ length: 5 }, (_, i) => ({ x: i * 150 + rand(0, 60), y: rand(18, 90), w: rand(50, 110), v: rand(0.02, 0.05) })),
        crows: [], leaves: Array.from({ length: 26 }, () => ({ x: rand(0, PW), y: rand(0, PH), v: rand(0.3, 0.7), p: rand(0, 50), c: pick(['#d8342a', '#ea6a2a', '#f0962e', '#a8202a']) })),
      };
    },
    sky(B, t, cam, st) {
      // long thin dusk clouds lit from below
      for (const c of st.pxs.clouds) {
        c.x += c.v; if (c.x > PW + 120) c.x = -c.w - 20;
        const x = Math.round(c.x), y = Math.round(c.y), w = Math.round(c.w);
        B.fillStyle = 'rgba(90,30,70,0.5)'; B.fillRect(x, y, w, 3); B.fillRect(x + 10, y - 2, w - 30, 2);
        B.fillStyle = 'rgba(255,170,110,0.45)'; B.fillRect(x + 4, y + 3, w - 10, 1);
      }
    },
    animAt: {
      0(B, t, cam, st) {
        // the sun shimmers + a flock of crows crosses the sky now and then
        const [x, y, s] = layerPt(st, 0, st.sun[0], st.sun[1], cam, PXS), R = st.sun[2] * s;
        B.save(); B.globalCompositeOperation = 'lighter'; B.fillStyle = '#ffb060';
        for (let i = 0; i < 4; i++) { B.globalAlpha = 0.06 + 0.04 * Math.sin(t * 0.02 + i); B.fillRect(Math.round(x - R * 1.6 + Math.sin(t * 0.01 + i) * 6), Math.round(y - R * 0.3 + i * R * 0.25), Math.round(R * 3.2), 1); }
        B.restore();
        const P = st.pxs;
        if (t % 900 === 120 || !P.crows.length && t % 900 > 120 && t % 900 < 130) P.crows = Array.from({ length: 5 }, (_, i) => ({ x: -20 - i * 14 - rand(0, 10), y: 50 + i * 5 + rand(-4, 4), v: rand(0.7, 0.9), p: rand(0, 6) }));
        for (const c of P.crows) {
          c.x += c.v; c.y += Math.sin(t * 0.03 + c.p) * 0.1;
          const X = Math.round(c.x), Y = Math.round(c.y), up = Math.floor(t / 8 + c.p) % 2;
          B.fillStyle = '#1a0a16'; B.fillRect(X - 1, Y, 3, 1);
          if (up) { B.fillRect(X - 3, Y - 1, 2, 1); B.fillRect(X + 2, Y - 1, 2, 1); } else { B.fillRect(X - 3, Y + 1, 2, 1); B.fillRect(X + 2, Y + 1, 2, 1); }
        }
        P.crows = P.crows.filter(c => c.x < PW + 30);
      },
      1(B, t, cam, st) {
        // glints on the paddy water
        B.save(); B.globalCompositeOperation = 'lighter'; B.fillStyle = '#ffe0a0';
        for (let i = 0; i < 18; i++) {
          if (Math.sin(t * 0.05 + i * 2.3) < 0.6) continue;
          const [x, y] = layerPt(st, 1, (i * 97) % 1700 + 30, GROUND + LAYER_PAD - 20 - 120 + (i * 13) % 110, cam, PXS);
          B.globalAlpha = 0.35; B.fillRect(Math.round(x), Math.round(y), 2 + (i % 3), 1);
        }
        B.restore();
        // ...and every so often something very tall peers over the hedge. ぽぽぽ
        const ph = t % 1500; if (ph < 900 || ph > 1380) return;
        const k = ph < 960 ? (ph - 900) / 60 : ph > 1320 ? (1380 - ph) / 60 : 1;
        const [hx, hy, s] = layerPt(st, 1, st.hedge[0] + 90, st.hedge[1], cam, PXS), top = Math.round(hy);
        const rise = Math.round(14 * s * 1.7 * k), X = Math.round(hx), Y = top - rise;
        const part = (x, y, w, h, c) => { const y1 = Math.min(y + h, top); if (y1 > y) { B.fillStyle = c; B.fillRect(x, y, w, y1 - y); } };
        part(X - 4, Y + 5, 8, 9, '#f2eee8');           // face + shoulders of the white dress
        part(X - 5, Y + 4, 2, 12, '#120a10'); part(X + 3, Y + 4, 2, 12, '#120a10');   // long black hair
        part(X - 2, Y + 7, 1, 1, '#120a10'); part(X + 1, Y + 7, 1, 1, '#120a10');
        part(X - 3, Y, 6, 3, '#f8f4ee');               // hat crown
        part(X - 8, Y + 3, 16, 1, '#ffffff');          // wide brim
      },
      2(B, t, cam, st) {
        // lantern flames breathe, the street lamp flickers, the paper streamers sway
        B.save(); B.globalCompositeOperation = 'lighter';
        st.toro.forEach(([lx, ly], i) => {
          const [x, y, s] = layerPt(st, 2, lx, ly, cam, PXS), f = 0.6 + 0.4 * Math.sin(t * 0.13 + i * 1.7) * Math.sin(t * 0.07 + i);
          B.globalAlpha = 0.12 * f; B.fillStyle = '#ffb45a'; B.fillRect(Math.round(x - 14 * s), Math.round(y - 12 * s), Math.round(28 * s), Math.round(26 * s));
          B.globalAlpha = 0.5 * f; B.fillStyle = '#fff0b0'; B.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 3);
        });
        const on = !((t % 260 > 200 && (t >> 2) % 3 === 0) || (t % 260 > 238));
        const [lx, ly, ls] = layerPt(st, 2, st.lamp[0], st.lamp[1], cam, PXS);
        if (on) { B.globalAlpha = 0.18; B.fillStyle = '#fff0c0'; for (let r = 0; r < 4; r++) B.fillRect(Math.round(lx - (6 + r * 8) * ls), Math.round(ly + r * 14 * ls), Math.round((12 + r * 16) * ls), Math.round(14 * ls)); }
        else { B.globalCompositeOperation = 'source-over'; B.globalAlpha = 0.55; B.fillStyle = '#1c0e18'; B.fillRect(Math.round(lx - 30 * ls), Math.round(ly - 6 * ls), Math.round(60 * ls), Math.round(80 * ls)); }
        B.restore();
        B.fillStyle = '#f4efe2';
        st.shide.forEach(([sx, sy], i) => { const [x, y, s] = layerPt(st, 2, sx, sy + 42, cam, PXS); B.fillRect(Math.round(x + Math.sin(t * 0.04 + i) * 1.5) - 1, Math.round(y), 2, Math.max(1, Math.round(3 * s))); });
      },
    },
    floorAnim(B, t, cam, gy) {
      B.save(); B.globalCompositeOperation = 'lighter'; B.fillStyle = '#ffb070';
      for (let i = 0; i < 12; i++) { B.globalAlpha = 0.05 + 0.03 * Math.sin(t * 0.025 + i * 2); B.fillRect(((i * 59 - Math.round(cam.x * cam.z / PXS)) % 700 + 700) % 700 - 30, gy + 4 + (i * 7) % 30, 12 + (i % 3) * 5, 1); }
      B.restore();
    },
    front(B, st, cam, t) {
      B.setTransform(1, 0, 0, 1, 0, 0);
      for (const l of st.pxs.leaves) {
        l.y += l.v; l.x += Math.sin(t * 0.03 + l.p) * 0.4 - 0.25; if (l.y > PH) { l.y = -3; l.x = rand(0, PW + 40); }
        B.fillStyle = l.c; const f = Math.floor(t / 10 + l.p) % 3; B.fillRect(Math.round(l.x), Math.round(l.y), f === 1 ? 1 : 2, f === 1 ? 2 : 1);
      }
      // low mist bands drifting over the ground
      for (let r = 0; r < 4; r++) { B.fillStyle = `rgba(220,150,170,${0.04 + r * 0.012})`; const o = Math.round(Math.sin(t * 0.004 + r) * 30); B.fillRect(o - 40, PH - 46 + r * 10, PW + 80, 10); }
      B.setTransform(1 / PXS, 0, 0, 1 / PXS, 0, 0);
    },
  },
  throne: {
    rim: { c: [255, 80, 140], dx: 0, dy: -1, s: 0.55 }, amb: { c: [130, 20, 60], s: 0.07 },
    init(st) {
      st.pxs = {
        motes: Array.from({ length: 60 }, () => ({ x: rand(0, PW), y: rand(0, PH), v: rand(0.15, 0.5), p: rand(0, 50) })),
        bolt: null,
      };
    },
    sky(B, t, cam, st) {
      // red lightning in the void, now and then
      const P = st.pxs;
      if (t % 420 === 60 || t % 420 === 70) { const pts = []; let x = rand(40, PW - 40), y = 0; while (y < 140) { pts.push([x, y]); x += rand(-14, 14); y += rand(8, 18); } P.bolt = { pts, life: 10 }; }
      if (P.bolt && P.bolt.life > 0) {
        const k = P.bolt.life / 10; P.bolt.life--;
        B.fillStyle = `rgba(255,60,90,${0.12 * k})`; B.fillRect(0, 0, PW, PH);
        for (let i = 1; i < P.bolt.pts.length; i++) pxLine(B, ...P.bolt.pts[i - 1], ...P.bolt.pts[i], 1, k > 0.5 ? '#ffd0d8' : '#ff4a6a');
      }
    },
    animAt: {
      0(B, t, cam, st) {
        const [x, y, s] = layerPt(st, 0, st.ecl[0], st.ecl[1], cam, PXS), R = st.ecl[2] * s, p = 0.5 + 0.5 * Math.sin(t * 0.03);
        B.save(); B.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 48; k++) {
          const a = k * TAU / 48 + t * 0.002, l = R * (1.08 + 0.18 * (0.5 + 0.5 * Math.sin(t * 0.05 + k * 1.9)));
          B.globalAlpha = 0.15 + 0.2 * p; B.fillStyle = '#ff6a7a'; B.fillRect(Math.round(x + Math.cos(a) * l), Math.round(y + Math.sin(a) * l), 1, 1);
        }
        B.restore();
        pxDisc(B, x, y, R - 1, '#050003');
        B.fillStyle = '#ffd0c0'; for (let k = 0; k < 64; k++) { const a = k * TAU / 64; if (Math.sin(a * 3 + t * 0.02) > -0.3) B.fillRect(Math.round(x + Math.cos(a) * R), Math.round(y + Math.sin(a) * R), 1, 1); }
      },
      1(B, t, cam, st) {
        // the soul crystal pulses, shards orbit it
        const [x, y, s] = layerPt(st, 1, st.crystal[0], st.crystal[1], cam, PXS), p = 0.5 + 0.5 * Math.sin(t * 0.045);
        B.save(); B.globalCompositeOperation = 'lighter';
        for (let r = 0; r < 4; r++) { B.globalAlpha = (0.05 + 0.05 * p) * (4 - r) / 4; B.fillStyle = '#ff4aa8'; pxDisc(B, x, y, (30 + r * 14) * s * (1 + 0.1 * p), '#ff4aa8'); }
        B.globalAlpha = 0.4 + 0.4 * p; B.fillStyle = '#ffe0f4'; B.fillRect(Math.round(x) - 1, Math.round(y - 40 * s), 2, Math.round(70 * s));
        B.restore();
        for (let k = 0; k < 6; k++) {
          const a = t * 0.012 + k * TAU / 6, ox = Math.cos(a) * 95 * s, oy = Math.sin(a) * 24 * s, front = Math.sin(a) > 0;
          B.fillStyle = front ? '#ff8ac8' : '#7a1a4a'; const X = Math.round(x + ox), Y = Math.round(y + oy + 30 * s);
          B.fillRect(X, Y - 2, 2, 5); B.fillRect(X - 1, Y, 4, 1);
        }
      },
    },
    floorAnim(B, t, cam, gy) {
      const cx = (W / 2 + FX.sx + cam.z * (STAGE_W / 2 - cam.x)) / PXS, s = cam.z / PXS;
      B.save(); B.globalCompositeOperation = 'lighter'; B.fillStyle = '#ff4a8a';
      for (let k = 0; k < 56; k++) {
        const a = k * TAU / 56 - t * 0.003, glow = 0.5 + 0.5 * Math.sin(t * 0.06 + k * 0.45);
        B.globalAlpha = 0.06 + 0.24 * glow * glow;
        B.fillRect(Math.round(cx + Math.cos(a) * 300 * s), Math.round(gy + 74 * s + Math.sin(a) * 48 * s), 2, 1);
      }
      B.restore();
    },
    front(B, st, cam, t) {
      B.setTransform(1, 0, 0, 1, 0, 0);
      for (const m of st.pxs.motes) {
        m.y -= m.v; m.x += Math.sin(t * 0.02 + m.p) * 0.2; if (m.y < -2) { m.y = PH + 2; m.x = rand(0, PW); }
        if (Math.sin(t * 0.04 + m.p) > -0.3) { B.fillStyle = m.p > 25 ? 'rgba(255,140,200,0.7)' : 'rgba(255,80,120,0.5)'; B.fillRect(Math.round(m.x), Math.round(m.y), 1, m.p > 40 ? 2 : 1); }
      }
      for (let r = 0; r < 6; r++) { B.fillStyle = `rgba(30,0,12,${0.06 * (6 - r) / 6})`; B.fillRect(0, r * 5, PW, 5); B.fillRect(0, PH - 5 - r * 5, PW, 5); }
      B.setTransform(1 / PXS, 0, 0, 1 / PXS, 0, 0);
    },
  },
});
