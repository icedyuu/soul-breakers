// ============================== FX ====================================
const ONOMATOPOEIA = ['ドン!', 'バキッ!', 'ズガン!', 'ドゴォ!', 'ガッ!', 'ズドン!', 'ドカッ!'];

function drawBolt(g, x1, y1, x2, y2, color, width, jag = 30, depth = 5) {
  const pts = [[x1, y1], [x2, y2]];
  for (let d = 0; d < depth; d++) {
    for (let i = pts.length - 1; i > 0; i--) {
      const a = pts[i - 1], b = pts[i];
      const mx = (a[0] + b[0]) / 2 + rand(-jag, jag), my = (a[1] + b[1]) / 2 + rand(-jag, jag) * 0.3;
      pts.splice(i, 0, [mx, my]);
    }
    jag *= 0.55;
  }
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.globalCompositeOperation = 'lighter';
  g.strokeStyle = color; g.globalAlpha = 0.45; g.lineWidth = width * 3.5;
  g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
  g.globalAlpha = 1; g.lineWidth = width; g.stroke();
  g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(1, width * 0.4); g.stroke();
  g.restore();
}

function starPath(g, x, y, spikes, r1, r2, rot) {
  g.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 ? r2 * (0.7 + 0.3 * ((i * 7) % 3) / 2) : r1;
    const a = rot + i * Math.PI / spikes;
    g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  g.closePath();
}

function strokeText(g, text, x, y, fill, stroke, lw) {
  g.lineJoin = 'round'; g.miterLimit = 2;
  if (lw) { g.strokeStyle = stroke; g.lineWidth = lw; g.strokeText(text, x, y); }
  g.fillStyle = fill; g.fillText(text, x, y);
}

const FX = {
  parts: [], sparks: [], swooshes: [], wtexts: [], anns: [], callouts: [], lines: [], rings: [],
  shake: 0, sx: 0, sy: 0, flash: null, impact: 0, dark: 0, darkTarget: 0,
  reset() { this.parts = []; this.sparks = []; this.swooshes = []; this.wtexts = []; this.anns = []; this.callouts = []; this.lines = []; this.rings = []; this.shake = 0; this.flash = null; this.impact = 0; this.dark = 0; this.darkTarget = 0; },
  get hq() { return Settings.fx === 'HIGH'; },
  p(o) {
    if (this.parts.length > (this.hq ? 900 : 350)) return;
    const q = { x: 0, y: 0, vx: 0, vy: 0, life: 30, size: 4, color: '#fff', type: 'spark', grav: 0, drag: 0.94, rot: 0, vr: 0, add: true, grow: 0 };
    Object.assign(q, o); q.max = q.life; this.parts.push(q);
  },
  burst(x, y, color, n, speed, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), s = rand(speed * 0.3, speed);
      this.p({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(10, 24), size: rand(2, 4.5), color, type: 'spark', ...o });
    }
  },
  flame(x, y, color = '#ff7a1a', n = 2, spread = 8, up = 2.2) {
    for (let i = 0; i < n; i++) this.p({ x: x + rand(-spread, spread), y: y + rand(-spread, spread), vx: rand(-0.6, 0.6), vy: -rand(up * 0.5, up), life: rand(14, 26), size: rand(5, 11), color, type: 'flame', drag: 0.96 });
  },
  dust(x, y, n = 8, color = 'rgba(200,190,180,0.5)') {
    for (let i = 0; i < n; i++) this.p({ x: x + rand(-20, 20), y: y - rand(0, 6), vx: rand(-3, 3), vy: -rand(0.3, 1.8), life: rand(20, 36), size: rand(6, 12), color, type: 'smoke', add: false, grow: 0.35, drag: 0.92 });
  },
  rocks(x, y, n = 10, color = '#6b5a4e') {
    for (let i = 0; i < n; i++) this.p({ x: x + rand(-30, 30), y, vx: rand(-5, 5), vy: -rand(4, 12), life: rand(30, 50), size: rand(4, 9), color, type: 'shard', grav: 0.5, drag: 0.99, rot: rand(0, TAU), vr: rand(-0.3, 0.3), add: false });
  },
  ring(x, y, color, r0 = 10, r1 = 90, life = 16, w = 6, flat = 1) { this.rings.push({ x, y, color, r0, r1, life, max: life, w, flat }); },
  hitSpark(x, y, str, color = '#ffd34a') {
    this.sparks.push({ x, y, str, color, t: 0, max: 8 + str * 3, rot: rand(0, TAU) });
    this.burst(x, y, color, 5 + str * 4, 4 + str * 3);
    this.burst(x, y, '#ffffff', 3 + str * 2, 3 + str * 2);
    if (str >= 3) this.ring(x, y, color, 12, 70 + str * 15, 14, 5);
    if (str >= 3 && Math.random() < 0.75) this.wtext(x + rand(-30, 30), y - 60, pick(ONOMATOPOEIA), { size: 34 + str * 5, color: '#fff', stroke: color, font: FONT_JPS, life: 32, rot: rand(-0.3, 0.3), vy: -0.6 });
  },
  blockSpark(x, y, perfect, color) {
    this.sparks.push({ x, y, str: 1, color: perfect ? '#7dfcff' : '#9bb8ff', t: 0, max: 10, rot: 0, shield: true, perfect });
    this.burst(x, y, perfect ? '#bffcff' : '#88aaff', perfect ? 14 : 6, perfect ? 8 : 4);
    if (perfect) this.ring(x, y, '#7dfcff', 20, 110, 18, 4);
  },
  swoosh(F, o) {
    // crescent slash trail in fighter-local coordinates
    this.swooshes.push({ F, x: F.x, y: F.y, facing: F.facing, s: F.s, cx: o.cx || 20, cy: o.cy || -110, r: o.r || 70, a0: o.a0, a1: o.a1, w: o.w || 22, color: o.color || F.ch.colors.accent, t: 0, max: o.life || 9 });
  },
  wtext(x, y, text, o = {}) { this.wtexts.push({ x, y, text, t: 0, life: o.life || 40, size: o.size || 28, color: o.color || '#fff', stroke: o.stroke || OUTLINE, font: o.font || FONT_T, rot: o.rot || 0, vy: o.vy ?? -0.8 }); },
  announce(text, o = {}) { this.anns.push({ text, sub: o.sub || '', t: 0, life: o.life || 70, size: o.size || 120, color: o.color || '#fff', glow: o.glow || '#ff3355', y: o.y || H / 2 - 40, style: o.style || 'slam' }); },
  callout(side, text, sub, color) {
    this.callouts = this.callouts.filter(c => c.side !== side);
    this.callouts.push({ side, text, sub, color, t: 0, life: 80 });
  },
  speedlines(life, cx = W / 2, cy = H / 2, color = '#ffffff', n = 46) { this.lines.push({ life, max: life, cx, cy, color, n }); },
  shakeIt(a) { if (Settings.shake) this.shake = Math.max(this.shake, a); },
  flashScreen(color, life = 8, alpha = 0.6) { this.flash = { color, life, max: life, alpha }; },
  impactFrame(n = 3) { this.impact = Math.max(this.impact, n); },

  update(frozen = false) {
    if (this.shake > 0.3) { this.sx = rand(-this.shake, this.shake); this.sy = rand(-this.shake, this.shake) * 0.7; this.shake *= 0.86; } else { this.shake = 0; this.sx = this.sy = 0; }
    this.dark = lerp(this.dark, this.darkTarget, 0.15);
    if (this.flash && --this.flash.life <= 0) this.flash = null;
    if (this.impact > 0) this.impact--;
    for (const a of this.anns) a.t++;
    this.anns = this.anns.filter(a => a.t < a.life);
    for (const c of this.callouts) c.t++;
    this.callouts = this.callouts.filter(c => c.t < c.life);
    for (const l of this.lines) l.life--;
    this.lines = this.lines.filter(l => l.life > 0);
    if (frozen) return;
    for (const q of this.parts) {
      q.vx *= q.drag; q.vy = q.vy * q.drag + q.grav; q.x += q.vx; q.y += q.vy; q.rot += q.vr; q.life--; q.size += q.grow;
      if (q.type === 'petal') { q.vx += Math.sin(q.life * 0.1 + q.rot) * 0.05; }
      if (q.type === 'shard' && q.y > GROUND) { q.y = GROUND; q.vy *= -0.3; q.vx *= 0.6; }
      if (q.type === 'blood' && q.y > GROUND - 2) { q.type = 'splat'; q.y = GROUND - 1; q.vx = q.vy = q.grav = 0; q.size *= 1.6; q.life = q.max = Math.min(q.life + 20, 50); }
      if (q.type === 'bat') q.vx += Math.sin(q.life * 0.3 + q.rot) * 0.15;
    }
    this.parts = this.parts.filter(q => q.life > 0);
    for (const s of this.sparks) s.t++;
    this.sparks = this.sparks.filter(s => s.t < s.max);
    for (const s of this.swooshes) s.t++;
    this.swooshes = this.swooshes.filter(s => s.t < s.max);
    for (const t of this.wtexts) { t.t++; t.y += t.vy; }
    this.wtexts = this.wtexts.filter(t => t.t < t.life);
    for (const r of this.rings) r.life--;
    this.rings = this.rings.filter(r => r.life > 0);
  },

  drawParticles(g, behind) {
    for (const q of this.parts) {
      if (!!q.behind !== behind) continue;
      const k = q.life / q.max;
      g.globalCompositeOperation = q.add ? 'lighter' : 'source-over';
      g.globalAlpha = Math.min(1, k * 1.5);
      switch (q.type) {
        case 'spark':
          g.strokeStyle = q.color; g.lineWidth = q.size * k + 0.5; g.lineCap = 'round';
          g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(q.x - q.vx * 2.2, q.y - q.vy * 2.2); g.stroke(); break;
        case 'flame': {
          const r = q.size * (0.4 + k * 0.8);
          g.fillStyle = k > 0.7 ? '#fff3b0' : k > 0.45 ? q.color : k > 0.2 ? '#c2240c' : '#3a0a06';
          g.beginPath(); g.arc(q.x, q.y, r, 0, TAU); g.fill(); break;
        }
        case 'ember':
          g.fillStyle = q.color; g.beginPath(); g.arc(q.x, q.y, q.size * (0.5 + 0.5 * Math.sin(q.life * 0.5)), 0, TAU); g.fill(); break;
        case 'smoke':
          g.globalAlpha = k * 0.6; g.fillStyle = q.color; g.beginPath(); g.arc(q.x, q.y, q.size, 0, TAU); g.fill(); break;
        case 'petal':
          g.save(); g.translate(q.x, q.y); g.rotate(q.rot); g.fillStyle = q.color; g.beginPath(); g.ellipse(0, 0, q.size, q.size * 0.55, 0, 0, TAU); g.fill(); g.restore(); break;
        case 'shard':
          g.save(); g.translate(q.x, q.y); g.rotate(q.rot); g.fillStyle = q.color; g.strokeStyle = OUTLINE; g.lineWidth = 1.5;
          g.beginPath(); g.moveTo(-q.size, q.size * 0.6); g.lineTo(0, -q.size); g.lineTo(q.size, q.size * 0.5); g.closePath(); g.fill(); g.stroke(); g.restore(); break;
        case 'blood': {   // teardrop oriented along its velocity, dark core + highlight
          const a = Math.atan2(q.vy, q.vx), sp = Math.min(2.2, 1 + Math.hypot(q.vx, q.vy) * 0.08), r = q.size;
          g.save(); g.translate(q.x, q.y); g.rotate(a); g.fillStyle = q.color; g.beginPath(); g.moveTo(r * 1.1, 0); g.quadraticCurveTo(0, -r, -r * 1.6 * sp, 0); g.quadraticCurveTo(0, r, r * 1.1, 0); g.fill();
          g.fillStyle = 'rgba(255,190,200,0.6)'; g.beginPath(); g.arc(r * 0.2, -r * 0.3, r * 0.3, 0, TAU); g.fill(); g.restore(); break;
        }
        case 'splat':
          g.fillStyle = q.color; g.beginPath(); g.ellipse(q.x, q.y, q.size * 1.4, q.size * 0.32, 0, 0, TAU); g.fill(); break;
        case 'bat': {   // tiny flapping bat silhouette
          const fl = Math.sin(q.life * 0.9 + q.rot * 5), s2 = q.size; g.save(); g.translate(q.x, q.y); g.scale(q.vx < 0 ? -1 : 1, 1); g.fillStyle = q.color;
          g.beginPath(); g.moveTo(0, -s2 * 0.3); g.quadraticCurveTo(s2 * 0.9, -s2 * (0.9 * fl + 0.2), s2 * 1.9, -s2 * fl * 0.6); g.quadraticCurveTo(s2 * 1.3, s2 * 0.1, s2 * 1.0, s2 * 0.2); g.quadraticCurveTo(s2 * 0.5, 0, 0, s2 * 0.5);
          g.quadraticCurveTo(-s2 * 0.5, 0, -s2 * 1.0, s2 * 0.2); g.quadraticCurveTo(-s2 * 1.3, s2 * 0.1, -s2 * 1.9, -s2 * fl * 0.6); g.quadraticCurveTo(-s2 * 0.9, -s2 * (0.9 * fl + 0.2), 0, -s2 * 0.3); g.fill();
          g.fillStyle = '#ff3a50'; g.fillRect(-s2 * 0.25, -s2 * 0.1, s2 * 0.15, s2 * 0.15); g.fillRect(s2 * 0.1, -s2 * 0.1, s2 * 0.15, s2 * 0.15); g.restore(); break;
        }
        case 'bblade': {   // crimson blood blade (needle) pointing along rot
          g.save(); g.translate(q.x, q.y); g.rotate(q.rot); const L2 = q.size;
          g.fillStyle = '#3a0010'; g.beginPath(); g.moveTo(L2, 0); g.lineTo(-L2 * 0.7, -L2 * 0.16); g.lineTo(-L2, 0); g.lineTo(-L2 * 0.7, L2 * 0.16); g.closePath(); g.fill();
          g.fillStyle = q.color; g.beginPath(); g.moveTo(L2 * 0.92, 0); g.lineTo(-L2 * 0.62, -L2 * 0.1); g.lineTo(-L2 * 0.85, 0); g.lineTo(-L2 * 0.62, L2 * 0.1); g.closePath(); g.fill();
          g.fillStyle = 'rgba(255,220,225,0.8)'; g.fillRect(-L2 * 0.4, -L2 * 0.035, L2 * 1.1, L2 * 0.05); g.restore(); break;
        }
        case 'card':
          drawCard(g, q.x, q.y, q.size * 0.7, q.size, q.card || 'back', { rot: q.rot }); break;
        case 'bolt':
          if (q.life % 2 === 0) drawBolt(g, q.x, q.y, q.x2, q.y2, q.color, q.size, q.jag || 20, 4); break;
        case 'slash': {
          g.save(); g.translate(q.x, q.y); g.rotate(q.rot);
          const len = q.size * (1.2 - k * 0.2);
          g.fillStyle = q.color; g.beginPath(); g.moveTo(-len, 0); g.quadraticCurveTo(0, -8 * k - 2, len, 0); g.quadraticCurveTo(0, 3 * k + 1, -len, 0); g.fill();
          g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-len * 0.8, 0); g.quadraticCurveTo(0, -3 * k - 1, len * 0.8, 0); g.quadraticCurveTo(0, 1, -len * 0.8, 0); g.fill();
          g.restore(); break;
        }
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  },

  drawWorld(g) {
    // rings
    for (const r of this.rings) {
      const k = 1 - r.life / r.max;
      g.globalAlpha = 1 - k; g.strokeStyle = r.color; g.lineWidth = r.w * (1 - k) + 1;
      g.globalCompositeOperation = 'lighter';
      g.beginPath(); g.ellipse(r.x, r.y, lerp(r.r0, r.r1, easeOut(k)), lerp(r.r0, r.r1, easeOut(k)) * r.flat, 0, 0, TAU); g.stroke();
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // slash trails
    for (const s of this.swooshes) {
      const k = s.t / s.max;
      g.save(); g.translate(s.x, s.y); g.scale(s.facing * s.s, s.s);
      g.globalCompositeOperation = 'lighter';
      const a0 = s.a0, a1 = lerp(s.a0, s.a1, Math.min(1, (s.t + 2) / 4));
      g.globalAlpha = 1 - k;
      g.fillStyle = s.color;
      g.beginPath(); g.arc(s.cx, s.cy, s.r, a0, a1, a1 < a0); g.arc(s.cx + 6, s.cy, s.r - s.w * (1 - k), a1, a0, a1 >= a0); g.closePath(); g.fill();
      g.fillStyle = '#ffffff'; g.globalAlpha = (1 - k) * 0.9;
      g.beginPath(); g.arc(s.cx, s.cy, s.r, a0, a1, a1 < a0); g.arc(s.cx + 3, s.cy, s.r - s.w * 0.35 * (1 - k), a1, a0, a1 >= a0); g.closePath(); g.fill();
      g.restore();
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // hit sparks (manga starburst)
    for (const s of this.sparks) {
      const k = s.t / s.max, e = easeOut(Math.min(1, s.t / 4));
      g.save(); g.translate(s.x, s.y);
      if (s.shield) {
        g.globalAlpha = 1 - k; g.strokeStyle = s.color; g.lineWidth = 4; g.globalCompositeOperation = 'lighter';
        g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + Math.PI / 6; g.lineTo(Math.cos(a) * (26 + 20 * e), Math.sin(a) * (34 + 26 * e)); } g.closePath(); g.stroke();
        g.fillStyle = s.color; g.globalAlpha = (1 - k) * 0.25; g.fill();
      } else {
        const R = (26 + s.str * 16) * e;
        g.globalAlpha = 1 - k * k;
        g.fillStyle = s.color; starPath(g, 0, 0, 10 + s.str * 2, R, R * 0.35, s.rot); g.fill();
        g.fillStyle = '#ffffff'; starPath(g, 0, 0, 8 + s.str * 2, R * 0.72, R * 0.22, s.rot + 0.2); g.fill();
        if (s.t < 3) { g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, R * 0.45, 0, TAU); g.fill(); }
      }
      g.restore();
    }
    g.globalAlpha = 1;
    // world texts (onomatopoeia, damage numbers)
    for (const t of this.wtexts) {
      const k = t.t / t.life; const sc = t.t < 5 ? 1.6 - t.t * 0.12 : 1;
      g.save(); g.translate(t.x, t.y); g.rotate(t.rot); g.scale(sc, sc);
      g.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      g.font = `900 ${t.size}px ${t.font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      strokeText(g, t.text, 0, 0, t.color, t.stroke, Math.max(4, t.size * 0.18));
      g.restore();
    }
    g.globalAlpha = 1;
  },

  drawScreen(g, part) {
    const fx = part !== 'text', txt = part !== 'fx', px = Settings.pixel;
    // anime speed lines
    if (fx) for (const l of this.lines) {
      const k = l.life / l.max;
      g.save(); g.globalAlpha = Math.min(1, k * 2) * 0.75; g.fillStyle = l.color;
      for (let i = 0; i < l.n; i++) {
        const a = rand(0, TAU), r0 = rand(260, 420), r1 = 900, wd = rand(0.004, 0.016);
        g.beginPath();
        g.moveTo(l.cx + Math.cos(a) * r0, l.cy + Math.sin(a) * r0);
        g.lineTo(l.cx + Math.cos(a - wd) * r1, l.cy + Math.sin(a - wd) * r1);
        g.lineTo(l.cx + Math.cos(a + wd) * r1, l.cy + Math.sin(a + wd) * r1);
        g.fill();
      }
      g.restore();
    }
    if (fx && this.flash) { g.globalAlpha = this.flash.alpha * this.flash.life / this.flash.max; g.fillStyle = this.flash.color; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    // move-name callouts
    if (txt) for (const c of this.callouts) {
      const k = c.t / c.life, slide = easeOut(c.t / 10);
      const left = c.side === 1;
      const x = left ? lerp(-420, 40, slide) : lerp(W + 420, W - 40, slide);
      g.save(); g.globalAlpha = k > 0.8 ? (1 - k) / 0.2 : 1;
      g.textAlign = left ? 'left' : 'right'; g.textBaseline = 'alphabetic';
      g.translate(x, 150); if (!px) g.transform(1, 0, -0.18, 1, 0, 0);
      const grd = g.createLinearGradient(0, -40, 0, 4); grd.addColorStop(0, '#ffffff'); grd.addColorStop(1, c.color);
      g.font = `italic 900 40px ${FONT_T}`;
      g.shadowColor = c.color; g.shadowBlur = px ? 0 : 18;
      strokeText(g, c.text, 0, 0, grd, OUTLINE, 8);
      g.shadowBlur = 0;
      g.font = `700 22px ${FONT_JP}`;
      strokeText(g, c.sub, left ? 6 : -6, 30, '#ffffff', OUTLINE, 5);
      g.restore();
    }
    // big announcements
    if (txt) for (const a of this.anns) {
      const k = a.t / a.life;
      g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
      let sc = 1, al = 1;
      if (a.style === 'slam') { sc = a.t < 8 ? lerp(3.2, 1, easeOut(a.t / 8)) : 1 + (a.t - 8) * 0.0015; }
      else if (a.style === 'slide') { sc = 1; }
      if (k > 0.82) al = (1 - k) / 0.18;
      g.globalAlpha = al;
      g.translate(W / 2 + (a.style === 'slide' ? lerp(-W, 0, easeOut(a.t / 12)) : 0), a.y);
      g.scale(sc, sc); if (!px) g.transform(1, 0, -0.15, 1, 0, 0);
      g.font = `italic 900 ${a.size}px ${FONT_T}`;
      g.shadowColor = a.glow; g.shadowBlur = px ? 0 : 30;
      const grd = g.createLinearGradient(0, -a.size / 2, 0, a.size / 2);
      grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.55, a.color); grd.addColorStop(1, a.glow);
      strokeText(g, a.text, 0, 0, grd, OUTLINE, a.size * 0.12);
      g.shadowBlur = 0;
      if (a.sub) { g.font = `900 ${a.size * 0.32}px ${FONT_JP}`; strokeText(g, a.sub, 0, a.size * 0.68, '#ffffff', OUTLINE, 7); }
      g.restore();
    }
    // impact frame: inverted manga-style flash
    if (fx && this.impact > 0) {
      g.save(); g.globalCompositeOperation = 'difference'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over';
      if (this.impact % 2 === 0) { g.globalAlpha = 0.35; g.fillStyle = '#ff1030'; g.fillRect(0, 0, W, H); }
      g.restore();
    }
  },
};
