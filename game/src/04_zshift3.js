// ===================== THE BEAST SHIFTER — PART 3: SYSTEM HOOKS, HUD, ULTIMATE =====================
const BEAST_ICONS = {};
function beastIcon(id) {
  if (id === 'human') return NUE.portrait || null;
  if (BEAST_ICONS[id]) return BEAST_ICONS[id];
  return (BEAST_ICONS[id] = mkCanvas(96, 96, g => {
    const col = BEAST_INFO[id].col, gr = g.createRadialGradient(48, 48, 6, 48, 48, 52); gr.addColorStop(0, col); gr.addColorStop(1, '#0a0614');
    g.fillStyle = gr; g.beginPath(); g.arc(48, 48, 47, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(48, 48, 45, 0, TAU); g.clip();
    const FC = BEAST_FORMS[id], p = buildPose(FC, 'stance');
    const sc = { drake: 0.34, wolf: 0.46, serpent: 0.4, stag: 0.36, raven: 0.42 }[id], ox = { drake: 54, wolf: 50, serpent: 46, stag: 50, raven: 46 }[id], oy = { drake: 86, wolf: 80, serpent: 94, stag: 92, raven: 88 }[id];
    FC.drawCustom(g, FC, p, ox, oy, 1, { scale: sc / FC.scale, T: 0, noGhost: true });
    g.restore();
  }));
}
function beastAmbience(F) {
  const id = F.beast.form, T = F.T, d = F.facing;
  if (id === 'drake') { if (T % 3 === 0) FX.p({ type: 'ember', x: F.x + d * rand(-70, 50), y: F.y - rand(120, 165), vx: rand(-0.5, 0.5), vy: -rand(1, 2.6), life: 30, size: 2.6, color: pick(['#ff8a2a', '#ffcf5a']) });
    if (T % 24 === 0) FX.p({ type: 'smoke', x: F.x + d * 150, y: F.y - 190, vx: d * 0.6, vy: -0.8, life: 30, size: 8, color: 'rgba(90,80,80,0.45)', add: false, grow: 0.4 }); }
  else if (id === 'wolf') { if (T % 2 === 0 && Math.abs(F.vx) > 2) FX.p({ type: 'smoke', x: F.x - d * 40, y: F.y - rand(30, 90), vx: -F.vx * 0.2, vy: -0.4, life: 22, size: 12, color: 'rgba(120,100,255,0.35)', add: false, grow: 0.5 }); if (T % 9 === 0) FX.p({ type: 'spark', x: F.x + rand(-50, 50), y: F.y - rand(20, 110), vx: 0, vy: -0.8, life: 24, size: 2, color: '#8f7bff' }); }
  else if (id === 'serpent') { if (T % 5 === 0) FX.p({ type: 'spark', x: F.x + d * rand(-30, 60), y: F.y - rand(40, 200), vx: rand(-0.3, 0.3), vy: -rand(0.4, 1.2), life: 40, size: 2.4, color: pick(['#5af0ff', '#9d6bff', '#ffffff']) }); }
  else if (id === 'stag') { if (T % 6 === 0) FX.p({ type: 'spark', x: F.x + rand(-80, 80), y: F.y - rand(40, 240), vx: 0, vy: -0.4, life: 36, size: 2.6, color: pick(['#ffe9a0', '#ffffff']) }); }
  else if (id === 'raven') { if (T % 8 === 0) FX.p({ type: 'shard', x: F.x + rand(-60, 60), y: F.y - rand(80, 180), vx: rand(-0.6, 0.6), vy: rand(0.3, 1), grav: 0.01, life: 70, size: 5, color: pick(['#1a1222', '#2a1a3a']), rot: rand(0, 6), vr: 0.05, add: false }); }
}

NUE.initFighter = F => {
  F.beast = { form: null, t: 0, max: TF_DUR, cd: TF_START, cdMax: TF_START, bag: [], used: [], last: null, ext: 0, pending: null, rollT: 0, rollMax: 20, bonusT: 0, hold: false, perf: { human: F.performed }, comboFlag: false, init: false, perfectSet: false };
};
NUE.tick = F => {
  const B = F.beast; if (!B) return;
  const bt = BT;
  if (!B.init && bt && (bt.p1 === F || bt.p2 === F)) {
    B.init = true;
    if (bt.nueBonus && bt.nueBonus[F.pid]) { bt.nueBonus[F.pid] = false; B.cd = 0; B.bonusT = 120; FX.wtext(F.x, F.y - 250, 'PERFECT INSTINCT — SEAL READY, +2s', { size: 22, color: '#ffffff', stroke: '#1a9a80', life: 90 }); }
  }
  if (B.pending && B.rollT < B.rollMax) B.rollT++;
  const fight = bt && bt.phase === 'fight' && !bt.cine && !bt.freeze, tr = bt && bt.mode === 'training';
  if (fight) {
    if (B.form) { if (!B.hold) B.t -= tr ? 0.5 : 1; if (B.t <= 0 && !['attack', 'cine', 'grabbed'].includes(F.state)) nueRevert(F, false); }
    else if (B.cd > 0 && !B.pending) B.cd = Math.max(0, B.cd - (tr ? 4 : 1));
  }
  // skill rewards: a 4+ hit combo trims the seal cooldown (human) or feeds the beast (+0.75 s)
  const O = F.opp;
  if (O) {
    if (O.comboHits === 0) B.comboFlag = false;
    else if (!B.comboFlag && O.comboHits >= 4) {
      B.comboFlag = true;
      if (B.form) nueFeed(F, 45);
      else if (B.cd > 0 && !B.pending) { B.cd = Math.max(0, B.cd - 60); FX.wtext(F.x, F.y - 250 * F.s, 'INSTINCT −1.0s', { size: 18, color: '#ffffff', stroke: '#1a9a80', life: 34 }); }
    }
    if (!B.perfectSet && O.ko && F.hp >= F.maxHp && bt && bt.mode === 'versus') { B.perfectSet = true; bt.nueBonus = bt.nueBonus || {}; bt.nueBonus[F.pid] = true; }
  }
  if (F.onGround) F.airDashUsed = false;
  if (B.form && !F.hidden && FX.hq) beastAmbience(F);
};
NUE.tryCustom = (F, inp, air, minLvl) => {
  const B = F.beast; if (!B) return false;
  if (inp.p('sp1') && inp.p('sp2')) return false;
  // Nightmare Raven: invulnerable feather air dash
  if (B.form === 'raven' && air && F.state === 'jump' && inp.p('block') && !F.airDashUsed) {
    inp.use('block'); F.airDashUsed = true; F.invuln = Math.max(F.invuln, 14);
    const d = inp.h !== 0 ? inp.h : F.facing; F.vx = d * 13; F.vy = -3; F.afterimage = 12; Sound.play('whoosh', 1.3);
    for (let i = 0; i < 10; i++) FX.p({ type: 'shard', x: F.x, y: F.y - rand(40, 140), vx: -d * rand(1, 4), vy: rand(-1, 1), grav: 0.05, life: 40, size: 5, color: '#1a1222', rot: rand(0, 6), vr: 0.1, add: false });
    return true;
  }
  if (!B.form) {
    // BEAST CANCEL: transform out of an attack that hit — the combo continues with the new beast
    if (F.state === 'attack' && F.connectedHit && inp.p('sp2') && !inp.motion('qcf') && !inp.motion('dd', 22) && F.opp && (F.opp.state === 'hit' || F.opp.state === 'wall')) {
      if (B.cd <= 0 && F.meter >= 25 && !F.move.ult && F.moveKey !== 'tfCancel' && F.moveKey !== 'sp2') { inp.use('sp2'); F.meter -= 25; F.startMove('tfCancel'); return true; }
      if (inp.buf.sp2 === 10) FX.wtext(F.x, F.y - 215 * F.s, B.cd > 0 ? `SEAL ${(B.cd / 60).toFixed(1)}s` : 'NEED 25% METER', { size: 16, color: '#9adfd0', life: 24 });
      return false;
    }
    if (inp.p('sp2') && inp.buf.sp2 === 10 && B.cd > 0 && F.state !== 'attack' && !inp.motion('qcf') && !inp.motion('dd', 22)) FX.wtext(F.x, F.y - 215 * F.s, `SEAL ${(B.cd / 60).toFixed(1)}s`, { size: 16, color: '#9adfd0', life: 24 });
  } else if (F.state === 'attack' && F.connectedHit && inp.p('sp2') && inp.motion('dd', 22) && F.moveKey !== 'sp2d' && F.move.lvl >= 4 && !F.move.ult) {
    // SEAL RELEASE cancel from a special that hit
    inp.use('sp2'); inp.clearMotion(); F.startMove('sp2d'); return true;
  }
  return false;
};
NUE.moves.sp2.req = F => F.beast.cd <= 0 && !F.beast.form && F.state !== 'attack';
NUE.drawExtra = (g, F) => {
  const B = F.beast; if (!B) return;
  if (F.ch.drawExtraForm) F.ch.drawExtraForm(g, F);
  if (!B.pending || B.form) return;
  const k = Math.min(1, B.rollT / B.rollMax), id = B.pending, col = BEAST_INFO[id].col;
  // seal circle
  g.save(); g.translate(F.x, GROUND); g.scale(1, 0.26); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = NUE.colors.accent; g.lineWidth = 5; g.shadowColor = NUE.colors.accent; g.shadowBlur = FX.hq ? 16 : 0;
  g.beginPath(); g.arc(0, 0, 70 + 40 * k, 0, TAU); g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 50 + 30 * k, 0, TAU); g.stroke();
  g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * 4 * Math.PI / 5 + F.T * 0.05; g.lineTo(Math.cos(a) * (70 + 40 * k), Math.sin(a) * (70 + 40 * k)); } g.stroke();
  BEAST_IDS.forEach((b, i) => { const a = -Math.PI / 2 + i * TAU / 5 + F.T * 0.05; g.fillStyle = BEAST_INFO[b].col; g.beginPath(); g.arc(Math.cos(a) * (70 + 40 * k), Math.sin(a) * (70 + 40 * k), 9, 0, TAU); g.fill(); });
  g.restore();
  // the beast's silhouette rising behind her
  const FC = BEAST_FORMS[id];
  g.save(); g.globalAlpha = 0.18 + 0.45 * k; g.globalCompositeOperation = 'lighter';
  FC.drawCustom(g, FC, buildPose(FC, 'raise'), F.x - F.facing * 20, F.y, F.facing, { mono: col, scale: 0.55 + 0.6 * k, T: F.T, noGhost: true }); g.restore();
  // roulette reel: shows what is still in the pool, then lands on the drawn beast
  const pool = [id, ...B.bag], spin = k < 0.8, cur = spin ? pool[(F.T >> 2) % pool.length] : id, ic = beastIcon(cur);
  const cx = F.x, cy = F.y - 250 * F.s;
  g.save(); g.shadowColor = spin ? '#ffffff' : col; g.shadowBlur = FX.hq ? 16 : 0; g.fillStyle = '#0a0614'; g.beginPath(); g.arc(cx, cy, 26, 0, TAU); g.fill(); g.shadowBlur = 0;
  if (ic) { g.save(); g.beginPath(); g.arc(cx, cy, 24, 0, TAU); g.clip(); g.drawImage(ic, cx - 24, cy - 24, 48, 48); g.restore(); }
  g.strokeStyle = spin ? '#ffffff' : col; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 26, 0, TAU); g.stroke();
  g.restore();
};
// ---------------------------------- HUD panel ----------------------------------
const NUE_BADGES = {
  human: [['sp2', 'S2 BEAST'], ['sp1f', '↓→S1 FANG'], ['counter', '↓←S1 RISE'], ['sp2f', '↓→S2 STEP']],
  drake: [['sp1', 'S1 CLAWS'], ['sp1f', '↓→S1 BREATH'], ['sp2', 'S2 CRASH'], ['sp2d', '↓↓S2 RELEASE']],
  wolf: [['sp1', 'S1 LUNAR'], ['sp1f', '↓→S1 DASH'], ['sp2', 'S2 HUNT'], ['sp2d', '↓↓S2 RELEASE']],
  serpent: [['sp1', 'S1 FANG'], ['sp1f', '↓→S1 SURGE'], ['sp2', 'S2 COIL'], ['sp2d', '↓↓S2 RELEASE']],
  stag: [['sp1', 'S1 ANTLERS'], ['sp1f', '↓→S1 BARRIER'], ['sp2', 'S2 REFLECT'], ['sp2d', '↓↓S2 RELEASE']],
  raven: [['sp1', 'S1 DIVE'], ['sp1f', '↓→S1 STORM'], ['sp2', 'S2 WINGS'], ['sp2d', '↓↓S2 RELEASE']],
};
NUE.drawHand = (g, F, side, t) => {
  const B = F.beast; if (!B) return;
  const pw = 330, ph = 68, x0 = side > 0 ? 40 : W - 40 - pw, y0 = 562, id = B.form, col = id ? BEAST_INFO[id].col : NUE.colors.accent;
  g.save();
  g.fillStyle = 'rgba(8,6,20,0.84)'; g.fillRect(x0, y0, pw, ph); g.strokeStyle = col; g.lineWidth = 1.5; g.strokeRect(x0, y0, pw, ph);
  const ix = side > 0 ? x0 + 6 : x0 + pw - 64, tx = side > 0 ? x0 + 72 : x0 + 10, rollId = B.pending ? [B.pending, ...B.bag][(F.T >> 2) % (B.bag.length + 1)] : null;
  const icon = beastIcon(id || (B.pending ? (B.rollT >= B.rollMax * 0.8 ? B.pending : rollId) : 'human'));
  g.save(); g.beginPath(); g.arc(ix + 29, y0 + 34, 28, 0, TAU); g.clip(); g.fillStyle = '#0a0614'; g.fill(); if (icon) g.drawImage(icon, ix + 1, y0 + 6, 56, 56); g.restore();
  g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath(); g.arc(ix + 29, y0 + 34, 28, 0, TAU); g.stroke();
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = `italic 900 16px ${FONT_T}`; strokeText(g, id ? BEAST_INFO[id].name : B.pending ? 'UNSEALING…' : 'HUMAN FORM', tx, y0 + 21, '#ffffff', OUTLINE, 3);
  g.font = `700 11px ${FONT_JP}`; g.fillStyle = col; g.fillText(id ? `${BEAST_INFO[id].jp} · ${BEAST_INFO[id].arch}` : 'ヌエ · 封印 SEAL', tx, y0 + 36);
  // timer / cooldown bar
  const bw = 150, bx = tx, by = y0 + 44, bh = 14;
  let k, label, bc;
  if (id) { k = B.hold ? 1 : clamp(B.t / B.max, 0, 1); label = B.hold ? 'TRIAL ∞' : `${(Math.max(0, B.t) / 60).toFixed(1)}s`; bc = B.t < 120 && !B.hold && (F.T >> 3) % 2 ? '#ffffff' : col; }
  else if (B.pending) { k = B.rollT / B.rollMax; label = 'ROLLING'; bc = '#ffffff'; }
  else if (B.cd > 0) { k = 1 - B.cd / B.cdMax; label = `SEAL ${(B.cd / 60).toFixed(1)}s`; bc = '#3f8a7c'; }
  else { k = 1; label = 'READY · SP2'; bc = (F.T >> 4) % 2 ? col : '#9ffff0'; }
  g.fillStyle = '#05030c'; g.fillRect(bx, by, bw, bh); g.fillStyle = bc; g.fillRect(bx, by, bw * k, bh);
  g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1; g.strokeRect(bx, by, bw, bh);
  g.font = `900 10px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = k > 0.5 && !(id && bc === '#ffffff') ? '#05030c' : '#ffffff'; g.fillText(label, bx + bw / 2, by + 11);
  // pool: beasts still in this cycle (bright) / already drawn (dim) — the next transformation is always one of the bright ones
  const pool = B.bag.length ? B.bag : BEAST_IDS.filter(b => b !== B.last);
  g.font = `800 9px ${FONT_UI}`; g.fillStyle = '#a99ccf'; g.textAlign = 'left'; g.fillText('POOL', bx + bw + 8, by + 3);
  BEAST_IDS.forEach((b, i) => {
    const px = bx + bw + 8 + i * 19, py = by + 5, on = pool.includes(b), ic = beastIcon(b);
    g.save(); g.globalAlpha = on ? 1 : 0.22; g.beginPath(); g.arc(px + 8, py + 6, 8, 0, TAU); g.clip(); if (ic) g.drawImage(ic, px, py - 2, 16, 16); g.restore();
    g.strokeStyle = on ? BEAST_INFO[b].col : 'rgba(255,255,255,0.15)'; g.lineWidth = 1.4; g.beginPath(); g.arc(px + 8, py + 6, 8, 0, TAU); g.stroke();
  });
  g.restore();
  // move badges
  const bl = NUE_BADGES[id || 'human'];
  bl.forEach(([k2, lab], i) => {
    const m = F.ch.moves[k2], ready = m && !(F.cd[k2] > 0) && (!m.req || m.req(F) || F.state === 'attack'), bw2 = 78, bx2 = side > 0 ? 40 + i * (bw2 + 6) : W - 40 - bw2 - i * (bw2 + 6), by2 = 638;
    g.fillStyle = ready ? 'rgba(20,14,40,0.9)' : 'rgba(10,6,16,0.9)'; g.fillRect(bx2, by2, bw2, 18);
    g.strokeStyle = ready ? col : 'rgba(255,255,255,0.15)'; g.lineWidth = 1.2; g.strokeRect(bx2, by2, bw2, 18);
    g.font = `800 9px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = ready ? '#ffffff' : '#666'; g.fillText(lab, bx2 + bw2 / 2, by2 + 9.5);
  });
  g.textBaseline = 'alphabetic';
};
// ---------------------------------- move list pages ----------------------------------
NUE.listPage = (g, x, y, w, page) => {
  if (page === 0) return 0;
  if (page === 6) return 1;
  const id = BEAST_IDS[page - 1], FC = BEAST_FORMS[id], inf = BEAST_INFO[id];
  let yy = y + 64;
  const ic = beastIcon(id); if (ic) g.drawImage(ic, x + 24, yy - 6, 64, 64);
  g.textAlign = 'left'; g.font = `italic 900 24px ${FONT_T}`; strokeText(g, `${page}/5 · ${inf.name}`, x + 100, yy + 18, inf.col, OUTLINE, 4);
  g.font = `700 13px ${FONT_JP}`; g.fillStyle = '#cfc4ee'; g.fillText(`${inf.jp} · ${inf.arch} · ${inf.stats}`, x + 100, yy + 38);
  g.font = `600 12px ${FONT_UI}`; g.fillStyle = '#ffffff'; yy = wrapText(g, inf.def, x + 100, yy + 56, w - 130, 15) + 4;
  const rows = MOVELIST.filter(([k]) => FC.moves[k] && !FC.moves[k].virtual).map(([k, , inp]) => [k, inp]);
  rows.push(...(FC.extraList || []).filter(([k]) => k !== 'sp2d' && FC.moves[k]).map(([k, , inp]) => [k, inp]));
  const rh = Math.min(22, (y + 560 - yy) / rows.length);
  g.font = `800 10px ${FONT_UI}`; g.fillStyle = '#8a80aa'; g.textAlign = 'right'; g.fillText('INPUT', x + w - 26, yy + 4); g.fillText('STARTUP', x + w - 150, yy + 4); g.textAlign = 'left';
  rows.forEach(([k, inp], i) => {
    const m = FC.moves[k], ry = yy + 22 + i * rh;
    if (i % 2 === 0) { g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(x + 18, ry - rh + 7, w - 36, rh - 2); }
    g.font = `${m.special ? 800 : 600} 13px ${FONT_UI}`; g.fillStyle = m.special ? inf.col : '#e8e0ff'; g.fillText(m.name, x + 26, ry);
    g.textAlign = 'right'; g.font = `700 11px ${FONT_UI}`; g.fillStyle = '#a99ccf'; g.fillText(m.st + 'f', x + w - 150, ry);
    g.font = `800 13px ${FONT_UI}`; g.fillStyle = '#ffffff'; g.fillText(inp, x + w - 26, ry); g.textAlign = 'left';
  });
  g.font = `italic 700 12px ${FONT_UI}`; g.fillStyle = '#ffd84a'; g.fillText('ROUTE: ' + inf.route, x + 26, y + 588);
  return true;
};
// ---------------------------------- training trials ----------------------------------
NUE.applyTrial = (F, tr, bt) => {
  const B = F.beast; if (!B) return;
  if (bt && bt.dm) { if (tr && tr.dummy === 'jab') { bt.dm.action = 1; bt.nueSetAct = true; } else if (bt.nueSetAct) { bt.dm.action = 0; bt.nueSetAct = false; } }
  if (!tr) return;
  B.pending = null;
  if (tr.form) { if (B.form !== tr.form) setForm(F, tr.form); B.t = B.max = TF_DUR; B.hold = true; }
  else { if (B.form) setForm(F, null); B.hold = false; B.cd = 0; }
};
NUE.combos = [
  { name: 'Beast Cancel', notation: 'L → M → SP1 (Spirit Claw) → SP2 on hit (Beast Cancel, 25% meter) → L with whichever beast appears', seq: ['L', 'M', 'sp1', 'L'] },
  { name: 'Drake: Inferno', form: 'drake', notation: 'L+H (Wing Upheaval) → SP1 (Claw Devastation) → SP2 (Infernal Crash)', seq: ['LH', 'sp1', 'sp2'] },
  { name: 'Wolf: Ghost Hunt', form: 'wolf', notation: '↓→SP1 (Phantom Dash) → SP1 (Lunar Claws) → SP2 (Ghost Hunt)', seq: ['sp1f', 'sp1', 'sp2'] },
  { name: 'Serpent: Abyss', form: 'serpent', notation: 'SP2 (Abyssal Coil) → SP1 (Void Fang) → ↓→SP1 (Tidal Surge)', seq: ['sp2', 'sp1', 'sp1f'] },
  { name: 'Stag: Judgement', form: 'stag', dummy: 'jab', notation: 'SP2 (Divine Reflection) as the dummy jabs → SP1 (Sacred Antlers) → ↓→SP1 (Celestial Barrier)', seq: ['stagCounter', 'sp1'] },
  { name: 'Raven: Nightfall', form: 'raven', notation: 'L+H (Updraft) → hold ↑ → air SP1 (Raven Dive) → ↓→SP1 (Feather Storm)', seq: ['LH', 'sp1', 'sp1f'] },
  { name: 'Seal Release', form: 'drake', notation: 'H (Horn Ram) → ↓↓SP2 (Seal Release) → ↓←SP1 (Seal Rise, back in human form)', seq: ['H', 'sp2d', 'counter'] },
];
NUE.extraList.push(['sp2d', 'Seal Release (any beast)', '↓↓ SP2']);

// ---------------------------------- ULTIMATE: PRIMAL ASCENSION ----------------------------------
const PRIMAL_POSE = {};
function drawPrimalBG(g, c) {
  const a = c.bgA || 0; if (a <= 0.01) return;
  g.save(); g.globalAlpha = a;
  const gr = g.createRadialGradient(W / 2, H * 0.55, 40, W / 2, H / 2, 820); gr.addColorStop(0, '#2a0f3a'); gr.addColorStop(0.5, '#0c0518'); gr.addColorStop(1, '#000000');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 20; i++) { const an = i * TAU / 20 + c.f * 0.004; g.strokeStyle = i % 2 ? 'rgba(54,255,208,0.06)' : 'rgba(196,74,255,0.05)'; g.lineWidth = 40; g.beginPath(); g.moveTo(W / 2, H * 0.6); g.lineTo(W / 2 + Math.cos(an) * 1200, H * 0.6 + Math.sin(an) * 1200); g.stroke(); }
  g.globalCompositeOperation = 'source-over';
  g.font = `900 300px ${FONT_JP}`; g.fillStyle = 'rgba(255,255,255,0.05)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('獣', W / 2, H / 2 - 30);
  if (c.sil > 0 && BT) {
    const [sx, sy] = BT.cam.toScreen(c.A.x, GROUND), z = BT.cam.z, slots = [[-330, 20], [-175, -70], [0, -120], [175, -70], [330, 20]];
    BEAST_IDS.forEach((id, i) => {
      const FC = BEAST_FORMS[id], conv = c.conv || 0, [ox, oy] = slots[i];
      if (!PRIMAL_POSE[id]) PRIMAL_POSE[id] = buildPose(FC, 'victory');
      g.save(); g.globalAlpha = a * c.sil * (1 - conv * 0.75); g.globalCompositeOperation = 'lighter';
      FC.drawCustom(g, FC, PRIMAL_POSE[id], sx + ox * z * (1 - conv), sy + oy * z * (1 - conv) - 20, c.dir, { mono: BEAST_INFO[id].col, scale: z * 1.2 * (1 - conv * 0.6) / FC.scale, T: c.f, noGhost: true });
      g.restore();
    });
  }
  g.restore();
}
function drawPrimalFG(g, c) {
  if (!BT || !(c.hy > 0)) return;
  const A = c.A, D = c.D, dir = c.dir;
  g.save(); BT.cam.apply(g);
  g.save(); g.globalAlpha = Math.min(1, c.hy); drawHybrid(g, A.x - dir * 30, GROUND, 1.1 * (0.55 + 0.45 * Math.min(1, c.hy)), dir, c.f, { jaw: c.jaw ?? 0.3, bite: c.bite, claw: c.claw }); g.restore();
  if (c.coil > 0) {
    g.save(); g.globalAlpha = Math.min(1, c.coil); g.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const yy = D.y - 30 - i * 40, ph = c.f * 0.2 + i;
      g.strokeStyle = '#0b2a44'; g.lineWidth = 18; g.beginPath(); g.ellipse(D.x, yy, 56, 16, 0, ph, ph + Math.PI * 1.2); g.stroke();
      g.strokeStyle = '#5af0ff'; g.lineWidth = 6; g.shadowColor = '#5af0ff'; g.shadowBlur = FX.hq ? 14 : 0; g.beginPath(); g.ellipse(D.x, yy, 56, 16, 0, ph, ph + Math.PI * 1.2); g.stroke(); g.shadowBlur = 0; }
    g.restore();
  }
  if (c.breath > 0) {
    const hx = A.x + dir * 165, hy = GROUND - 215, gr = g.createLinearGradient(hx, hy, D.x, D.y - 100);
    gr.addColorStop(0, 'rgba(255,250,210,0.95)'); gr.addColorStop(0.5, 'rgba(255,140,40,0.8)'); gr.addColorStop(1, 'rgba(255,40,0,0.5)');
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = gr; g.lineCap = 'round'; g.lineWidth = 70 + Math.sin(c.f * 0.8) * 10; g.beginPath(); g.moveTo(hx, hy); g.lineTo(D.x + dir * 40, D.y - 100); g.stroke(); g.restore();
  }
  if (c.slash > 0) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const k = ((c.f + i * 5) % 20) / 20; g.strokeStyle = i % 2 ? 'rgba(191,180,255,0.9)' : 'rgba(255,255,255,0.9)'; g.lineWidth = 7 * (1 - k); g.beginPath(); g.moveTo(D.x - 120 + i * 20, D.y - 220 + i * 25); g.lineTo(D.x + 120 - i * 10, D.y - 40 - i * 15); g.stroke(); }
    g.restore();
  }
  g.restore();
}
CINE.nue = function (A, D, f, c) {
  const dir = c.dir ?? (c.dir = A.facing);
  if (f === 1) {
    c.zoom = 1.1; D.x = clamp(A.x + dir * 260, 80, STAGE_W - 80); if (Math.abs(D.x - A.x) < 200) A.x = clamp(D.x - dir * 260, 80, STAGE_W - 80);
    c.camX = clamp((A.x + D.x) / 2, 600, STAGE_W - 600); c.camY = GROUND - 220; c.bg = drawPrimalBG; c.fg = drawPrimalFG; c.bgA = 0; c.sil = 0; c.conv = 0; c.hy = 0;
    D.y = GROUND; D.forcePose = 'hit'; A.forcePose = 'tf_w'; A.facing = dir; D.facing = -dir; Sound.play('charge');
    BT.say(A, 'Everyone wants out today? ...Fine. Go play.', 80);
  }
  c.bgA = f < 214 ? Math.min(1, f / 20) : Math.max(0, 1 - (f - 214) / 22);
  if (f < 24 && f % 2 === 0) { const an = rand(0, TAU); FX.p({ type: 'spark', x: A.x + Math.cos(an) * 160, y: A.y - 100 + Math.sin(an) * 120, vx: -Math.cos(an) * 7, vy: -Math.sin(an) * 5, life: 22, size: 3, color: pick(BEAST_IDS.map(b => BEAST_INFO[b].col)) }); }
  if (f === 24) { A.forcePose = 'ascend'; Sound.play('shift'); FX.flashScreen(NUE.colors.accent, 8, 0.45); FX.speedlines(30, W / 2, H / 2, '#ffffff', 50); }
  if (f >= 24 && f <= 56) c.sil = (f - 24) / 32;
  [[28, 'roar'], [34, 'howl'], [40, 'hiss'], [46, 'chime'], [52, 'caw']].forEach(([ff, snd]) => { if (f === ff) Sound.play(snd); });
  if (f >= 60 && f <= 74) c.conv = (f - 60) / 14;
  if (f === 74) {
    FX.flashScreen('#ffffff', 14, 0.9); FX.impactFrame(4); FX.shakeIt(24); A.hidden = true; c.hy = 0.02; c.sil = 0; Sound.play('roar'); Sound.play('explosion');
    FX.announce('PRIMAL ASCENSION', { sub: '原初昇華', size: 64, life: 70, y: 170, color: '#ffffff', glow: '#c44aff' });
  }
  if (f > 74 && f <= 88) c.hy = (f - 74) / 14;
  const lift = t => { D.y = lerp(D.y, GROUND - t, 0.25); };
  if (f >= 86 && f < 182) { lift(f < 108 ? 110 : 140); D.forcePose = f % 8 < 4 ? 'airhit' : 'hit'; }
  // stage 1 — raven wings: feather storm
  if (f >= 86 && f < 108) { if (f % 2 === 0) FX.p({ type: 'shard', x: A.x + dir * rand(-40, 120), y: GROUND - rand(160, 320), vx: (D.x - A.x) / 14 + rand(-2, 2), vy: rand(-1, 3), life: 22, size: 7, color: pick(['#1a1222', '#c44aff']), rot: rand(0, 6), vr: 0.2, add: false }); }
  if ([88, 94, 100, 106].includes(f)) BT.scriptHit(A, D, 13, { str: 2, sfx: 'slash' });
  // stage 2 — serpent tail coils and crushes
  if (f >= 110 && f < 132) c.coil = Math.min(1, (f - 110) / 6); else c.coil = 0;
  if ([112, 120, 128].includes(f)) { BT.scriptHit(A, D, 15, { str: 3 }); Sound.play('hiss'); FX.wtext(D.x, D.y - 240, 'ギリッ', { size: 40, font: FONT_JP, color: '#5af0ff', stroke: OUTLINE, life: 16 }); }
  // stage 3 — phantom wolf claws
  c.slash = f >= 134 && f < 154 ? 1 : 0;
  if ([136, 141, 146, 151].includes(f)) { BT.scriptHit(A, D, 12, { str: 2, sfx: 'slash' }); c.claw = c.claw ? 0 : 1.5; }
  // stage 4 — drake breath
  c.breath = f >= 156 && f < 178 ? 1 : 0; c.jaw = c.breath ? 1 : 0.3;
  if (f === 156) Sound.play('fire');
  if ([158, 164, 170].includes(f)) { BT.scriptHit(A, D, 16, { str: 3, sfx: 'fire' }); FX.flame(D.x, D.y - 100, '#ff6a1a', 16, 40, 3); }
  // stage 5 — stag antlers: the finishing gore
  if (f === 178) { c.bite = 1; Sound.play('chime'); }
  if (f === 182) {
    BT.scriptHit(A, D, 110, { str: 4 }); FX.impactFrame(5); FX.shakeIt(26); Sound.play('explosion'); FX.flashScreen('#fff2a8', 14, 0.75);
    FX.ring(D.x, D.y - 100, '#ffd84a', 20, 320, 26, 12); FX.ring(D.x, D.y - 100, '#c44aff', 20, 240, 20, 8);
    FX.wtext(D.x, D.y - 300, '原初!!', { size: 110, font: FONT_JP, color: '#ffffff', stroke: '#c44aff', life: 60, vy: -0.3 });
  }
  if (f > 182 && f <= 196) { const t = (f - 182) / 14; D.y = GROUND - 140 - Math.sin(t * Math.PI) * 120; D.forcePose = 'airhit'; }
  if (f > 196 && f <= 210) { const t = (f - 196) / 14; D.y = lerp(GROUND - 140, GROUND, t * t); }
  if (f === 210) { D.y = GROUND; D.forcePose = 'down'; FX.dust(D.x, GROUND, 14); Sound.play('slam'); }
  // the beasts return into her
  if (f >= 190 && f <= 204) { c.hy = 1 - (f - 190) / 14; c.bite = 0; if (f % 2 === 0) BEAST_IDS.forEach(id => FX.p({ type: 'spark', x: A.x + rand(-160, 160), y: GROUND - rand(80, 300), vx: 0, vy: 0, life: 14, size: 5, color: BEAST_INFO[id].col })); }
  if (f === 204) { c.hy = 0; A.hidden = false; A.forcePose = 'nueWink'; FX.ring(A.x, A.y - 100, NUE.colors.accent, 10, 160, 16, 6); Sound.play('perfect'); }
  if (f === 214) BT.say(A, 'Oops~ they got a little excited. ...You okay down there?', 110);
  if (f === 282) { BT.release(D, dir * 3, -4); return true; }
};

// ---------------------------------- registration ----------------------------------
CHARS.push(NUE);
[NUE, ...Object.values(BEAST_FORMS)].forEach(finalizeMoves);
