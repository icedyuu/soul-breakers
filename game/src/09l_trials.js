// ===================== COMBO TRIALS (title → TRAINING ◀ COMBO TRIALS ▶) =====================
// Five fixed, bot-verified combos per fighter, easy → hard (BASICS, EASY, MEDIUM, HARD, SOUL), data in
// COMBO_TRIALS (src/09l_trials_data.js, built by tests/gen_trials.js — rerun it when moves change).
// A trial clears when the moves of ONE combo on the dummy contain the trial's moves in order (same rule
// as the bot check). The first clear of each trial gives mastery XP (TRIAL_XP); cleared trials are saved
// in the mastery profile (data.ctr = {id: bitmask}), so they sync with the account (merge = union).
const TRIAL_XP = [30, 50, 80, 120, 150];
const TRIAL_TAGCOL = { BASICS: '#cfc4ee', EASY: '#6dffa0', MEDIUM: '#7fe9ff', HARD: '#ff9a4a', SOUL: '#ffd84a' };
let TRIAL_PICK = false;   // title TRAINING item: false = free training, true = combo trials
try { TRIAL_PICK = localStorage.getItem('sb_trial_pick') === '1'; } catch (e) { }

const Trials = {
  list(ch) { return (typeof COMBO_TRIALS !== 'undefined' && COMBO_TRIALS[ch.id]) || []; },
  mask(id) { const c = Mastery.data.ctr; return (c && c[id]) | 0; },
  done(id, i) { return !!(this.mask(id) & (1 << i)); },
  count(ch) { const L = this.list(ch); let n = 0; for (let i = 0; i < L.length; i++) if (this.done(ch.id, i)) n++; return [n, L.length]; },
  clear(ch, i) {
    if (this.done(ch.id, i)) return null;
    const d = Mastery.data; d.ctr = d.ctr || {}; d.ctr[ch.id] = this.mask(ch.id) | (1 << i);
    return Mastery.grant(ch, TRIAL_XP[i] || 50);   // saves (and the account push follows Mastery.save)
  },
  // readable input for a move key of this fighter
  label(ch, k) {
    const m = ch.moves[k] || {}, nm = m.name ? ` (${m.name.replace(/\b\w+/g, w => w[0] + w.slice(1).toLowerCase())})` : '';
    const base = { L: 'L', M: 'M', H: 'H', cL: '↓L', cM: '↓M', cH: '↓H', jL: 'air L', jM: 'air M', jH: 'air H', LH: 'L+H', FF: '→→H' }[k];
    if (base) return k === 'LH' ? 'L+H (launch, hold ↑)' : base;
    const sp = { sp1: 'SP1', sp2: 'SP2', sp1f: '↓→SP1', sp2f: '↓→SP2', counter: '↓←SP1', sp2d: '↓↓SP2', ult: 'SP1+SP2' }[k];
    if (sp) return sp + nm;
    for (const mv of Object.values(ch.moves)) for (const fu of mv.followups || []) if (fu.move === k) {
      const b = { light: 'L', medium: 'M', heavy: 'H', sp1: 'SP1', sp2: 'SP2' }[fu.btn] || fu.btn;
      return ({ f: '→', b: '←', d: '↓' }[fu.dir] || '') + b + nm;
    }
    return (m.name || k);
  },
};
// account sync: cleared trials only ever add up
{
  const im = Mastery.import;
  Mastery.import = function (o) {
    const r = im.call(this, o);
    if (r && o && o.ctr && typeof o.ctr === 'object') { const d = this.data; d.ctr = d.ctr || {}; let ch = false; for (const id in o.ctr) { const v = (d.ctr[id] | 0) | (o.ctr[id] | 0); if (v !== (d.ctr[id] | 0)) { d.ctr[id] = v; ch = true; } } if (ch) this.save(); }
    return r;
  };
}

class TrialBattle extends Battle {
  constructor(p1, idx) {
    const ch = CHARS[p1], dummy = Math.max(0, CHARS.findIndex(c => c.id === (ch.id === 'kazuma' ? 'goro' : 'kazuma')));
    super({ mode: 'practice', trials: true, p1, p2: dummy, stage: 0, v1: Mastery.pick(ch.id) });
    this.trialMode = true;   // hides the practice panel (own panel below)
    this.list = Trials.list(ch);
    const first = this.list.findIndex((_, i) => !Trials.done(ch.id, i));
    this.setTrial(idx ?? (first < 0 ? 0 : first));
  }
  setTrial(i) {
    const n = this.list.length; if (!n) return;
    this.ti = (i + n) % n; this.tprog = 0; this.tbest = 0; this.tclearT = 0; this.tmsg = null;
    this.resetPositions(false); this.p1.meter = 100;
  }
  get trial() { return this.list[this.ti]; }
  update() {
    const wasPaused = this.paused;
    super.update();
    if (this.paused && this.pauseMenu && !this.pauseMenu.trFix) {
      const m = this.pauseMenu; m.trFix = true;
      const at = m.items.findIndex(i => i.id === 'list') + 1;
      m.items.splice(at, 0, { id: 'trnext', label: 'NEXT TRIAL', jp: '次へ' }, { id: 'trprev', label: 'PREVIOUS TRIAL', jp: '前へ' });
      m.items = m.items.filter(i => i.id !== 'restart').map(i => i.id === 'select' ? { ...i, id: 'trsel' } : i);
      if (m.items.length > 7) { m.h = 44; m.gap = 8; m.y = 190; }
      const u = m.update.bind(m);
      m.update = () => {
        const it = u(); if (!it) return null;
        if (it.id === 'trnext' || it.id === 'trprev') { this.paused = false; Sound.play('menuOk'); this.setTrial(this.ti + (it.id === 'trnext' ? 1 : -1)); return null; }
        if (it.id === 'trsel') { this.paused = false; Sound.play('menuOk'); const s = new CharSelectScene('training'); s.trials = true; go(s); return null; }
        return it;
      };
    }
    if (this.paused || wasPaused || scene !== this || !this.trial) return;
    // keyboard shortcuts like training: 9 next, 0 previous; tap / click the arrows on the panel
    const P = Keys.pressed;
    if (P.has('Digit9')) { this.setTrial(this.ti + 1); Sound.play('menuMove'); return; }
    if (P.has('Digit0')) { this.setTrial(this.ti - 1); Sound.play('menuMove'); return; }
    if (Mouse.clicked) for (const [d, r] of this.arrowRects()) if (inRect(r)) { Mouse.clicked = false; this.setTrial(this.ti + d); Sound.play('menuMove'); return; }
    this.checkTrialRun();
  }
  checkTrialRun() {
    const D = this.p2, seq = this.trial.seq;
    if (this.tclearT) { if (++this.tclearT > 110 && D.comboHits === 0) { const n = this.list.length; let nx = this.ti + 1; for (let k = 1; k <= n; k++) { const j = (this.ti + k) % n; if (!Trials.done(this.p1.ch.id, j)) { nx = j; break; } } this.setTrial(nx); } return; }
    let i = 0; for (const k of D.comboMoves) if (i < seq.length && k === seq[i]) i++;
    this.tprog = D.comboHits ? i : 0; this.tbest = Math.max(this.tbest, this.tprog);
    if (i >= seq.length && D.comboHits) {
      this.tclearT = 1;
      const res = Trials.clear(this.p1.ch, this.ti);
      this.tmsg = res ? `+${res.gained} MASTERY XP` + (res.after.lv > res.before.lv ? ` · LEVEL UP → LV ${res.after.lv}` : '') + (res.unlocks.length ? ' · NEW COLOR!' : '') : 'ALREADY CLEARED';
      FX.announce('TRIAL CLEAR!', { sub: this.trial.tier, size: 76, life: 100, y: 230, color: '#bfffd0', glow: '#18a85a' }); Sound.play('victory');
    }
  }
  arrowRects() { return [[-1, { x: 18, y: 152, w: 44, h: 36 }], [1, { x: 362, y: 152, w: 44, h: 36 }]]; }
  draw(g) {
    super.draw(g);
    if (this.paused || !this.trial) return;
    const ch = this.p1.ch, tr = this.trial, x = 18, y = 152, w = 388;
    const steps = tr.seq.map(k => Trials.label(ch, k));
    g.save(); g.font = `700 14px ${FONT_UI}`;
    const lines = []; let line = [];
    steps.forEach((s, i) => { line.push(i); if (line.length >= 3 || i === steps.length - 1) { lines.push(line); line = []; } });
    const h = 108 + lines.length * 26 + 30;
    panel(g, x, y, w, h, 'rgba(10,6,24,0.82)', TRIAL_TAGCOL[tr.tier]);
    for (const [d, r] of this.arrowRects()) drawButton(g, r, d < 0 ? '◀' : '▶', null, inRect(r), this.pf);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `italic 900 20px ${FONT_T}`; strokeText(g, `COMBO TRIAL ${this.ti + 1}/${this.list.length}`, x + w / 2, y + 20, '#ffffff', OUTLINE, 4);
    g.font = `italic 900 15px ${FONT_T}`; strokeText(g, tr.tier + (Trials.done(ch.id, this.ti) ? '  ✔ CLEARED' : `  · +${TRIAL_XP[this.ti] || 50} XP`), x + w / 2, y + 44, TRIAL_TAGCOL[tr.tier], OUTLINE, 3);
    // step chips
    g.textAlign = 'left';
    lines.forEach((ln, li) => {
      let cx = x + 18; const cy = y + 72 + li * 26;
      for (const i of ln) {
        const t = (i ? '→ ' : '') + steps[i], on = i < Math.max(this.tprog, this.tclearT ? steps.length : 0), cur = i === this.tprog && !this.tclearT;
        g.font = `700 14px ${FONT_UI}`; const tw = Math.min(g.measureText(t).width, w - 36);
        g.fillStyle = on ? '#18a85a' : cur ? 'rgba(255,216,74,0.25)' : 'rgba(255,255,255,0.08)'; g.fillRect(cx - 4, cy - 11, tw + 8, 22);
        g.fillStyle = on ? '#ffffff' : cur ? '#ffd84a' : '#e8e0ff'; g.fillText(t, cx, cy + 1, w - 36);
        cx += tw + 12;
      }
    });
    const by = y + 72 + lines.length * 26 + 6;
    g.font = `600 13px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.textAlign = 'center';
    g.fillText(`${tr.hits} hits · ${Math.round(tr.dmg / 10)}% damage · best try ${this.tbest}/${steps.length}`, x + w / 2, by + 8);
    // dots: cleared trials
    for (let i = 0; i < this.list.length; i++) { const dx = x + w / 2 + (i - (this.list.length - 1) / 2) * 22, dy = by + 32; g.beginPath(); g.arc(dx, dy, 7, 0, 7); g.fillStyle = Trials.done(ch.id, i) ? TRIAL_TAGCOL[this.list[i].tier] : 'rgba(255,255,255,0.12)'; g.fill(); if (i === this.ti) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); } }
    if (this.tmsg) { g.font = `italic 900 22px ${FONT_T}`; strokeText(g, this.tmsg, W / 2, 300, '#7affc0', OUTLINE, 5); }
    g.font = `600 12px ${FONT_UI}`; g.fillStyle = 'rgba(220,210,255,0.7)'; g.fillText('◀ ▶ / 9 · 0 / pause menu: change trial   ·   meter refills', x + w / 2, y + h + 14);
    g.restore();
  }
}

// ---------------- title: TRAINING ◀ FREE / COMBO TRIALS ▶ ----------------
{
  const TP = TitleScene.prototype, up = TP.update, dr = TP.draw;
  TP.trialMenu = function () {
    const it = this.menu.items.find(i => i.id === 'training'); if (!it) return null;
    it.type = 'choice'; it.value = TRIAL_PICK ? '◀ COMBO TRIALS ▶' : '◀ FREE ▶';
    return it;
  };
  TP.update = function () {
    const it = this.trialMenu();
    if (it && this.menu.items[this.menu.sel] === it) {
      const r = this.menu.rect(this.menu.items.indexOf(it)), onVal = Mouse.clicked && inRect(r) && Mouse.x > r.x + r.w * 0.45;
      if (UI.left() || UI.right() || onVal) { TRIAL_PICK = !TRIAL_PICK; try { localStorage.setItem('sb_trial_pick', TRIAL_PICK ? '1' : '0'); } catch (e) { } Sound.play('menuMove'); this.trialMenu(); Mouse.clicked = false; return; }
    }
    const prev = scene, res = up.call(this);
    if (TRIAL_PICK && scene !== prev && scene instanceof CharSelectScene && scene.mode === 'training') scene.trials = true;
    return res;
  };
  TP.draw = function (g) { this.trialMenu(); return dr.call(this, g); };
}
// ---------------- character select: pick a fighter → straight into the trials ----------------
{
  const P = CharSelectScene.prototype, up = P.update, ds = P.drawSide;
  P.update = function () {
    if (this.trials && this.ready[0]) { if (++this.readyT > 40) go(new TrialBattle(this.cur[0])); return; }
    return up.call(this);
  };
  P.drawSide = function (g, s, t) {
    if (!this.trials || s !== 1) return ds.call(this, g, s, t);
    const ch = CHARS[this.cur[0]], [n, all] = Trials.count(ch), x = W - 34;
    g.textAlign = 'right'; g.textBaseline = 'alphabetic';
    g.font = `900 15px ${FONT_UI}`; g.fillStyle = P_COL[2]; g.fillText('COMBO TRIALS', x, 140);
    g.font = `italic 900 30px ${FONT_T}`; strokeText(g, `${n} / ${all} CLEARED`, x, 190, n >= all && all ? '#ffd84a' : '#ffffff', OUTLINE, 4);
    Trials.list(ch).forEach((tr, i) => {
      const yy = 236 + i * 30, done = Trials.done(ch.id, i);
      g.font = `italic 900 16px ${FONT_T}`; strokeText(g, `${done ? '✔ ' : ''}${tr.tier}  +${TRIAL_XP[i]} XP`, x, yy, done ? '#7affc0' : TRIAL_TAGCOL[tr.tier], OUTLINE, 3);
    });
    let tot = 0, all2 = 0; for (const c of CHARS) { const [a, b] = Trials.count(c); tot += a; all2 += b; }
    g.font = `700 14px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.fillText(`ALL FIGHTERS: ${tot} / ${all2}`, x, 410);
  };
}
