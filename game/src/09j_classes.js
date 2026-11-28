// ---------------- fighter classes: role icon under every select portrait + legend ----------------
// To add a fighter: put its id in FIGHTER_CLASS (or set ch.fclass = 'trickster' in its own file).
const FCLASSES = {
  rushdown: { name: 'RUSHDOWN', jp: '猛攻', col: '#ff5a4a', tip: 'fast pressure up close' },
  zoner: { name: 'ZONER', jp: '遠距離', col: '#4ad0ff', tip: 'keeps you out with projectiles' },
  grappler: { name: 'GRAPPLER', jp: '投げ', col: '#ffa22e', tip: 'slow, tough, huge grabs' },
  trickster: { name: 'TRICKSTER', jp: '奇術', col: '#c98bff', tip: 'mix-ups, chaos and tricks' },
  control: { name: 'CONTROL', jp: '支配', col: '#5ef09a', tip: 'traps, setups and space control' },
  allround: { name: 'ALL-ROUNDER', jp: '万能', col: '#ffd84a', tip: 'solid tools for every range' },
};
const FCLASS_ORDER = ['rushdown', 'zoner', 'grappler', 'trickster', 'control', 'allround'];
const FIGHTER_CLASS = {
  kazuma: 'allround', honored: 'allround', haunted: 'allround',
  yoru: 'rushdown', buzzu: 'rushdown', saint: 'rushdown', aimi: 'rushdown', kuchi: 'rushdown',
  sera: 'zoner', cardmaster: 'zoner', lunaria: 'zoner', hachi: 'zoner',
  goro: 'grappler', borgar: 'grappler',
  frogs: 'trickster', nue: 'trickster', yamika: 'trickster', kanae: 'trickster', jackpot: 'trickster', haze: 'trickster', teke: 'rushdown',
  conductor: 'control', reika: 'control', hollow: 'control', tokine: 'control',
};
function fighterClass(ch) { return (ch && (ch.fclass || FIGHTER_CLASS[ch.id])) || 'allround'; }

// class symbol in a radius-1 box (scaled by k)
function drawClassGlyph(g, cls, x, y, k, col) {
  g.save(); g.translate(x, y); g.scale(k, k); g.fillStyle = g.strokeStyle = col; g.lineWidth = 0.22; g.lineJoin = g.lineCap = 'round';
  g.beginPath();
  if (cls === 'rushdown') {   // lightning bolt
    g.moveTo(0.25, -1); g.lineTo(-0.6, 0.12); g.lineTo(-0.02, 0.12); g.lineTo(-0.3, 1); g.lineTo(0.62, -0.18); g.lineTo(0.05, -0.18); g.closePath(); g.fill();
  } else if (cls === 'zoner') {   // crosshair
    g.arc(0, 0, 0.62, 0, Math.PI * 2); g.moveTo(0, -1); g.lineTo(0, -0.35); g.moveTo(0, 1); g.lineTo(0, 0.35); g.moveTo(-1, 0); g.lineTo(-0.35, 0); g.moveTo(1, 0); g.lineTo(0.35, 0); g.stroke();
    g.beginPath(); g.arc(0, 0, 0.16, 0, Math.PI * 2); g.fill();
  } else if (cls === 'grappler') {   // two arrows crushing in
    g.moveTo(-1, -0.62); g.lineTo(-0.1, 0); g.lineTo(-1, 0.62); g.closePath(); g.moveTo(1, -0.62); g.lineTo(0.1, 0); g.lineTo(1, 0.62); g.closePath(); g.fill();
  } else if (cls === 'trickster') {   // four-point sparkle
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, b = a + Math.PI / 4; g.lineTo(Math.cos(a) * 1.02, Math.sin(a) * 1.02); g.lineTo(Math.cos(b) * 0.3, Math.sin(b) * 0.3); }
    g.closePath(); g.fill();
  } else if (cls === 'control') {   // hourglass
    g.moveTo(-0.68, -0.95); g.lineTo(0.68, -0.95); g.lineTo(0.1, 0); g.lineTo(0.68, 0.95); g.lineTo(-0.68, 0.95); g.lineTo(-0.1, 0); g.closePath(); g.fill();
  } else {   // all-rounder: shield
    g.moveTo(0, -1); g.lineTo(0.82, -0.66); g.quadraticCurveTo(0.8, 0.55, 0, 1); g.quadraticCurveTo(-0.8, 0.55, -0.82, -0.66); g.closePath(); g.fill();
  }
  g.restore();
}
// round badge: dark disc, class-coloured ring and symbol
function drawClassBadge(g, cls, x, y, r, dim) {
  const c = FCLASSES[cls] || FCLASSES.allround;
  g.save(); g.globalAlpha = dim ? 0.55 : 1;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = '#0c0718'; g.fill(); g.lineWidth = Math.max(1.5, r * 0.18); g.strokeStyle = c.col; g.stroke();
  drawClassGlyph(g, cls, x, y, r * 0.58, c.col);
  g.restore();
}

{
  const P = CharSelectScene.prototype, dg = P.drawGrid;
  P.drawGrid = function (g, t) {
    dg.call(this, g, t);
    // badges in a second pass so they can sit on the bottom edge of each tile
    for (let i = 0; i < CHARS.length; i++) { const r = this.cardRect(i); drawClassBadge(g, fighterClass(CHARS[i]), r.x + r.w / 2, r.y + r.h - 2, 11, this.locked(i)); }
    this.drawClassLegend(g, t);
  };
  P.legendBoxes = function () {   // free space beside the short last row of the grid
    const C = this.cols, n = CHARS.length, a = this.cardRect(0), e = this.cardRect(Math.min(n, C) - 1);
    const x0 = a.x - 6, x1 = e.x + e.w + 6, last = this.cardRect(n - 1), first = this.cardRect(n - 1 - (n - 1) % C);
    if (n % C === 0 || first.x - x0 < 120) return null;
    return [{ x: x0, y: last.y, w: first.x - 12 - x0, h: last.h }, { x: last.x + last.w + 12, y: last.y, w: x1 - last.x - last.w - 12, h: last.h }];
  };
  P.drawClassLegend = function (g, t) {
    const hot = new Set();
    for (let s = 0; s < 2; s++) if (!(this.single && s === 1 && (!this.ready[0] || this.cpu?.arcade))) hot.add(fighterClass(CHARS[this.cur[s]]));
    const boxes = this.legendBoxes();
    g.save(); g.textBaseline = 'middle';
    const entry = (cls, x, y, al, fs) => {
      const c = FCLASSES[cls], on = hot.has(cls);
      const bx = al === 'right' ? x - 11 : x + 11;
      drawClassBadge(g, cls, bx, y, on ? 11 : 10, false);
      g.font = `italic 900 ${fs}px ${FONT_UI}`; g.textAlign = al;
      strokeText(g, c.name, al === 'right' ? x - 28 : x + 28, y + 1, on ? c.col : '#d8d0f0', OUTLINE, 4);
    };
    if (boxes) {   // three classes on each side of the last row
      boxes.forEach((b, side) => {
        const fs = b.w < 150 ? 12 : 15, step = Math.min(28, b.h / 3);
        for (let k = 0; k < 3; k++) {
          const cls = FCLASS_ORDER[side * 3 + k], y = b.y + b.h / 2 + (k - 1) * step;
          entry(cls, side ? b.x + 4 : b.x + b.w - 4, y, side ? 'left' : 'right', fs);
        }
      });
    } else {   // full rows: two lines of three under RANDOM (between the stat blocks)
      const y = this.randRect().y + 54, cw = 138, x0 = W / 2 - cw * 1.5;
      FCLASS_ORDER.forEach((cls, k) => entry(cls, x0 + (k % 3) * cw + 4, y + (k / 3 | 0) * 24, 'left', 12));
    }
    g.restore();
  };
}
