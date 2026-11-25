// ================== SHARED HELPERS FOR BORGAR · BUZZU · REIKA (expansion fighters) ==================
// Small, self-contained helpers on top of the existing systems (chibi kit, HUD, FX). No engine rewrites.

// HASTE: speeds up a fighter's attacks without skipping hit frames — extra frames are only taken
// during startup of simple moves (no tick/spawn scripts) and during recovery of any move.
function xpHaste(F, k) {
  if (F.state !== 'attack' || !F.move || F.move.ult || k <= 0) return;
  const m = F.move, f = F.mf, every = Math.max(2, Math.round(1 / k));
  if (F.T % every) return;
  const rec = f > m.st + m.act + 1 && f < m.st + m.act + m.rec - 1;
  const start = f > 1 && f < m.st - 1 && !m.tick && !m.spawn && !m.poseFn;
  if (rec || start) F.mf++;
}
// gentle heal used by Buzzu's Blood Consumption (shows a floating +N)
function xpHeal(F, amt) {
  if (F.ko || amt <= 0) return 0; const h = Math.min(F.maxHp - F.hp, amt); if (h <= 0) return 0;
  F.hp += h; FX.wtext(F.x + rand(-16, 16), F.y - 210 * F.s, '+' + Math.round(h), { size: 22, color: '#9dff9a', stroke: '#0a3010', life: 36, vy: -0.8 }); return h;
}
// Resource panel + six special badges (with cooldown fill), styled like Vespera's blood panel.
// o = { col, col2, icon, title, sub, k (0..1), label, pips:[on,max,label] , badges:[[key,label]...] }
function xpPanel(g, F, side, t, o) {
  const pw = 330, ph = 64, x0 = side > 0 ? 40 : W - 40 - pw, y0 = 560, col = o.col;
  g.save();
  g.fillStyle = 'rgba(10,6,12,0.86)'; g.fillRect(x0, y0, pw, ph); g.strokeStyle = col; g.lineWidth = 1.5; g.strokeRect(x0, y0, pw, ph);
  const ix = side > 0 ? x0 + 8 : x0 + pw - 58, iy = y0 + 7, k = clamp(o.k, 0, 1);
  g.save(); g.beginPath(); g.arc(ix + 25, iy + 25, 24, 0, TAU); g.clip(); g.fillStyle = '#0c0808'; g.fillRect(ix, iy, 50, 50);
  g.fillStyle = col; g.fillRect(ix, iy + 50 * (1 - k), 50, 50 * k); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(ix + 6, iy + 50 * (1 - k), 38, 2); g.restore();
  g.strokeStyle = o.flash && (t >> 3) % 2 ? '#ffffff' : col; g.lineWidth = 2.5; g.beginPath(); g.arc(ix + 25, iy + 25, 24, 0, TAU); g.stroke();
  g.font = `italic 900 18px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle'; strokeText(g, o.icon, ix + 25, iy + 26, '#ffffff', OUTLINE, 3); g.textBaseline = 'alphabetic';
  const tx = side > 0 ? x0 + 68 : x0 + 10;
  g.textAlign = 'left'; g.font = `italic 900 15px ${FONT_T}`; strokeText(g, o.title, tx, y0 + 19, o.flash ? (o.col2 || '#ffffff') : '#ffffff', OUTLINE, 3);
  g.font = `700 10px ${FONT_UI}`; g.fillStyle = col; g.fillText(o.sub, tx, y0 + 33);
  const bw = 160, bx = tx, by = y0 + 41, bh = 13;
  g.fillStyle = '#080406'; g.fillRect(bx, by, bw, bh); g.fillStyle = o.flash && (t >> 2) % 2 ? (o.col2 || '#ffffff') : col; g.fillRect(bx, by, bw * k, bh);
  if (o.marks) { g.fillStyle = 'rgba(0,0,0,0.6)'; for (const mk of o.marks) g.fillRect(bx + bw * mk - 1, by, 2, bh); }
  g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1; g.strokeRect(bx, by, bw, bh);
  g.font = `900 10px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = k > 0.55 ? '#140608' : '#ffffff'; g.fillText(o.label, bx + bw / 2, by + 10);
  if (o.pips) {
    const [n, max, lab] = o.pips; g.font = `800 9px ${FONT_UI}`; g.fillStyle = '#d0c4c8'; g.textAlign = 'left'; g.fillText(lab, bx + bw + 8, by + 2);
    for (let i = 0; i < max; i++) { g.fillStyle = i < n ? col : 'rgba(255,255,255,0.12)'; g.fillRect(bx + bw + 9 + i * 12, by + 4, 9, 9); }
  }
  g.restore();
  const bs = o.badges, bw2 = (pw - (bs.length - 1) * 4) / bs.length;
  bs.forEach(([k2, lab], i) => {
    const m = F.ch.moves[k2], cd = F.cd[k2] || 0, sealed = F.sealT > 0 && (F.sealK === k2 || F.sealK2 === k2), ready = cd <= 0 && !sealed && (!m.req || m.req(F)), bx2 = side > 0 ? 40 + i * (bw2 + 4) : W - 40 - bw2 - i * (bw2 + 4), by2 = 630;
    g.fillStyle = ready ? 'rgba(30,14,14,0.9)' : 'rgba(10,6,8,0.9)'; g.fillRect(bx2, by2, bw2, 20);
    if (cd > 0 && m.cd) { g.fillStyle = 'rgba(120,120,140,0.35)'; g.fillRect(bx2, by2 + 20 * (1 - cd / m.cd), bw2, 20 * cd / m.cd); }
    g.strokeStyle = ready ? col : 'rgba(255,255,255,0.15)'; g.lineWidth = 1.2; g.strokeRect(bx2, by2, bw2, 20);
    g.font = `800 8.5px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = ready ? '#ffffff' : '#666';
    if (sealed) { g.strokeStyle = '#b48cff'; g.lineWidth = 1.6; g.strokeRect(bx2 + 1, by2 + 1, bw2 - 2, 18); g.beginPath(); g.moveTo(bx2 + 3, by2 + 3); g.lineTo(bx2 + bw2 - 3, by2 + 17); g.stroke(); }   // locked by The Hollow's seal
    const [a, b] = lab.split('|'); g.fillText(a, bx2 + bw2 / 2, by2 + (b ? 6 : 10.5)); if (b) g.fillText(b, bx2 + bw2 / 2, by2 + 15);
  });
  g.textBaseline = 'alphabetic';
}
// How-to page renderer shared by the three expansion fighters
function xpHowTo(g, title, col, rows, foot) {
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = `italic 900 20px ${FONT_T}`; strokeText(g, title, 100, 152, col, OUTLINE, 4);
  const rh = Math.min(38, 330 / rows.length);
  rows.forEach(([a, b], i) => {
    const y = 186 + i * rh; g.fillStyle = i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)'; g.fillRect(96, y - 21, 1088, rh - 4);
    g.font = `900 14px ${FONT_UI}`; g.fillStyle = '#ffd84a'; g.fillText(a, 110, y); g.font = `600 13px ${FONT_UI}`; g.fillStyle = '#ffffff'; g.fillText(b, 300, y);
  });
  g.font = `500 14px ${FONT_UI}`; g.fillStyle = '#ffe2c4'; wrapText(g, foot, 110, 186 + rows.length * rh + 16, 1060, 19);
}
// round paw/boot pads in the chibi style (used by Buzzu's paws)
function xpPad(g, x, y, r, col) { g.fillStyle = col; g.strokeStyle = OUTLINE; g.lineWidth = 1.4; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, TAU); g.fill(); }
