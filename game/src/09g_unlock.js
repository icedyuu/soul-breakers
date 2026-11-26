// ---------------- FIGHTER UNLOCKS ----------------
// New players start with the 9 original fighters in ARCADE and 1P VS CPU. The others unlock:
//  · every ARCADE clear unlocks one random locked fighter
//  · once ANY fighter reaches mastery LV FREE_PICK_LV, the player gets one FREE PICK: unlock any fighter they like
// Local VERSUS, ONLINE, PRACTICE and TRAINING always have everyone (the CPU opponent can be any fighter, too).
// Saved in the mastery profile (synced by accounts): fu = { id: 1 }, fuAll = everything open, fuFree = free picks used.
// Old profiles that already played keep everything (migration). The hidden cheat opens everything on this device only.
// Admin: GIVE LEVEL (fighter or ALL) also unlocks that fighter; grant keys 'f_<id>' / 'f_all' work as well.
const FREE_FIGHTERS = ['kazuma', 'yoru', 'sera', 'goro', 'frogs', 'conductor', 'cardmaster', 'nue', 'saint'];
const FREE_PICK_LV = 3;
const Roster = {
  get d() { return Mastery.data; },
  open(id) { const d = this.d; return FREE_FIGHTERS.includes(id) || !!(d.fuAll || d.clean || (d.fu && d.fu[id])); },
  openIdx(i) { return this.open(CHARS[i].id); },
  lockedIds() { return CHARS.filter(c => !this.open(c.id)).map(c => c.id); },
  topLevel() { let m = 1; for (const c of CHARS) m = Math.max(m, Mastery.level(c.id)); return m; },
  freePicks() { return (this.topLevel() >= FREE_PICK_LV ? 1 : 0) - (this.d.fuFree | 0); },
  freeReady() { return this.freePicks() > 0 && this.lockedIds().length > 0; },
  unlock(id, free) { const d = this.d; (d.fu || (d.fu = {}))[id] = 1; if (free) d.fuFree = (d.fuFree | 0) + 1; Mastery.save(); },
  played(o) { return Object.values(o.chars || {}).some(r => (r.xp | 0) > 0 || (r.w | 0) > 0 || (r.l | 0) > 0); },
};
{
  // migration: profiles from before this system keep every fighter
  const ld = Mastery.load, fr = Mastery.fresh;
  Mastery.fresh = function () { const d = fr.call(this); d.fuV = 1; return d; };
  const mig = d => { if (!d.fuV) { d.fuV = 1; if (Roster.played(d)) d.fuAll = 1; try { localStorage.setItem(Mastery.KEY, JSON.stringify(d)); } catch (e) { } } return d; };
  Mastery.load = function () { return mig(ld.call(this)); };
  if (Mastery.d) mig(Mastery.d);
  // account sync: unlocks only ever add up
  const im = Mastery.import;
  Mastery.import = function (o) {
    const d = this.data, wasOld = o && o.v === 1 && !o.fuV && Roster.played(o);
    const r = im.call(this, o);
    if (r) {
      if (o.fuAll || wasOld) d.fuAll = 1;
      if (o.fu && typeof o.fu === 'object') { d.fu = d.fu || {}; for (const k in o.fu) if (o.fu[k] && chById(k)) d.fu[k] = 1; }
      d.fuFree = Math.max(d.fuFree | 0, o.fuFree | 0);
      this.save();
    }
    return r;
  };
  // admin grants
  const ag = Cloud.applyGrants;
  Cloud.applyGrants = function (gr) {
    ag.call(this, gr);
    if (!gr) return;
    const d = Mastery.data; let ch = false;
    for (const c of CHARS) if ((gr['*'] || gr[c.id] || gr.f_all || gr['f_' + c.id]) && !Roster.open(c.id)) { (d.fu || (d.fu = {}))[c.id] = 1; ch = true; }
    if (ch) { this.importing = true; try { Mastery.save(); } finally { this.importing = false; } }
  };
  // arcade clear: one random locked fighter
  const aw = Mastery.award;
  Mastery.award = function (bt) {
    const freeBefore = Roster.freeReady();
    const r = aw.call(this, bt);
    if (r && r.clear) { const L = Roster.lockedIds(); if (L.length) { const id = L[Math.floor(Math.random() * L.length)]; Roster.unlock(id); r.fighter = chById(id); } }
    if (r && !freeBefore && Roster.freeReady()) r.freePick = true;
    return r;
  };
}

// ---------------- character select: locks only for YOUR fighter in ARCADE / 1P VS CPU ----------------
{
  const P = CharSelectScene.prototype, up = P.update, cf = P.confirm, dr = P.draw, ds = P.drawSide;
  P.lockMode = function () { return !!this.cpu && !(this instanceof NetSelectScene) && !this.ready[0]; };
  P.locked = function (i) { return this.lockMode() && !Roster.openIdx(i); };
  P.confirm = function (s) {
    if (s === 0 && this.locked(this.cur[s])) {
      if (Roster.freeReady()) { this.ask = { i: this.cur[s], t: 0 }; Sound.play('menuMove'); }
      else { this.lockT = 70; Sound.play('menuBack'); }
      return;
    }
    return cf.call(this, s);
  };
  P.askRects = function () { return [{ x: W / 2 - 200, y: 420, w: 180, h: 44 }, { x: W / 2 + 20, y: 420, w: 180, h: 44 }]; };
  P.update = function () {
    if (this.lockT) this.lockT--;
    if (this.ask) {
      this.t++; this.ask.t++;
      const [yes, no] = this.askRects();
      const ok = UI.pOk(1) || UI.ok() || (Mouse.clicked && inRect(yes)), back = UI.back() || (Mouse.clicked && inRect(no));
      Mouse.clicked = false;
      if (ok && this.ask.t > 2) { const ch = CHARS[this.ask.i]; Roster.unlock(ch.id, true); this.ask = null; this.flash = { i: ch, t: 80 }; Sound.play('menuOk'); Sound.play('impactBig'); }
      else if (back) { this.ask = null; Sound.play('menuBack'); }
      return;
    }
    if (this.flash && --this.flash.t <= 0) this.flash = null;
    return up.call(this);
  };
  P.drawSide = function (g, s, t) {
    ds.call(this, g, s, t);
    if (s !== 0 || !this.locked(this.cur[0])) return;
    const ch = CHARS[this.cur[0]];
    g.save(); g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(8,4,20,0.82)'; g.fillRect(26, 346, 330, 64); g.strokeStyle = '#ffd84a'; g.lineWidth = 2; g.strokeRect(26, 346, 330, 64);
    drawLockIcon(g, 52, 380, 1.1);
    g.font = `italic 900 22px ${FONT_T}`; strokeText(g, 'LOCKED', 78, 366, '#ffd84a', OUTLINE, 4);
    g.font = `700 11px ${FONT_UI}`; g.fillStyle = (this.lockT | 0) % 20 > 10 ? '#ff9ab0' : '#e8e0ff';
    g.fillText(Roster.freeReady() ? `Confirm: unlock with your FREE PICK` : 'Clear ARCADE to unlock new fighters', 78, 390);
    if (!Roster.freeReady()) g.fillText(`or any fighter at Mastery LV ${FREE_PICK_LV} = 1 free pick`, 78, 404);
    g.restore();
  };
  P.draw = function (g) {
    dr.call(this, g);
    const t = this.t;
    // status line under RANDOM (only where locks apply)
    if (this.lockMode()) {
      const L = Roster.lockedIds().length, rr = this.randRect();
      if (L) {
        const fp = Roster.freeReady();
        g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 13px ${FONT_UI}`;
        g.fillStyle = fp ? (t % 40 < 26 ? '#ffd84a' : '#ffffff') : '#cfc4ee';
        g.fillText(fp ? '★ FREE PICK READY: choose any locked fighter to unlock it' : `${CHARS.length - L} / ${CHARS.length} FIGHTERS UNLOCKED`, W / 2, rr.y + rr.h + 22);
        if (!fp) { g.font = `600 12px ${FONT_UI}`; g.fillStyle = '#a89cd0'; g.fillText('Arcade clear = new fighter  ·  versus, online & training: everyone', W / 2, rr.y + rr.h + 42); }
        g.restore();
      }
    }
    if (this.flash) {
      const a = Math.min(1, this.flash.t / 20);
      g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(8,4,20,0.85)'; g.fillRect(W / 2 - 260, 300, 520, 90); g.strokeStyle = '#ffd84a'; g.lineWidth = 3; g.strokeRect(W / 2 - 260, 300, 520, 90);
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `italic 900 18px ${FONT_T}`; strokeText(g, 'NEW FIGHTER UNLOCKED!', W / 2, 326, '#ffd84a', OUTLINE, 4);
      drawTitleText(g, this.flash.i.name, W / 2, 362, 34, '#ffffff', this.flash.i.colors.accent);
      g.restore();
    }
    if (this.ask) {
      const ch = CHARS[this.ask.i], [yes, no] = this.askRects();
      g.save(); g.fillStyle = 'rgba(4,2,10,0.72)'; g.fillRect(0, 0, W, H);
      panel(g, W / 2 - 300, 230, 600, 260, 'rgba(14,8,30,0.96)', '#ffd84a');
      g.drawImage(ch.portrait, W / 2 - 280, 250, 120, 120);
      g.textAlign = 'left'; g.textBaseline = 'middle';
      g.font = `italic 900 18px ${FONT_T}`; strokeText(g, 'USE YOUR FREE PICK?', W / 2 - 145, 272, '#ffd84a', OUTLINE, 4);
      g.font = `italic 900 40px ${FONT_T}`; const nw = g.measureText(ch.name).width;
      drawTitleText(g, ch.name, W / 2 - 145, 318, Math.min(40, Math.floor(40 * 420 / nw)), '#ffffff', ch.colors.accent, 'left');
      g.font = `700 14px ${FONT_UI}`; g.fillStyle = '#e8e0ff'; g.fillText(`${ch.title.toUpperCase()} — ${ch.style}`, W / 2 - 145, 356);
      g.font = `600 13px ${FONT_UI}`; g.fillStyle = '#a89cd0'; g.fillText('You only get one free pick. Other fighters unlock by clearing Arcade.', W / 2 - 280, 396);
      drawButton(g, yes, 'UNLOCK', null, inRect(yes), t); drawButton(g, no, 'NOT NOW', null, inRect(no), t);
      g.textAlign = 'center'; g.font = `700 11px ${FONT_UI}`; g.fillStyle = '#a89cd0'; g.fillText(Settings.mobile ? 'TAP A BUTTON' : 'F / ENTER: unlock   ·   G / ESC: not now', W / 2, 478);
      g.restore();
    }
  };
}

// ---------------- results: tell the player about a new fighter / free pick ----------------
{
  const RP = ResultsScene.prototype, rd = RP.draw;
  RP.draw = function (g) {
    rd.call(this, g);
    const M = this.mx; if (!M || !(M.fighter || M.freePick)) return;
    const a = clamp((this.t - 120) / 14, 0, 1); if (a <= 0) return;
    const tw = 440, th = 74, tx = W - tw - 24;
    g.save(); g.globalAlpha = a; g.translate((1 - a) * 60, 0); g.textBaseline = 'middle'; g.textAlign = 'left';
    let ty = 12;
    if (M.fighter) {
      panel(g, tx, ty, tw, th, 'rgba(30,14,4,0.92)', '#ffd84a');
      g.drawImage(M.fighter.portrait, tx + 8, ty + 7, 60, 60);
      g.font = `italic 900 18px ${FONT_T}`; strokeText(g, 'NEW FIGHTER UNLOCKED!', tx + 80, ty + 24, this.t % 30 < 18 ? '#ffd84a' : '#ffffff', OUTLINE, 4);
      g.font = `italic 900 24px ${FONT_T}`; strokeText(g, M.fighter.name, tx + 80, ty + 52, '#ffffff', OUTLINE, 4);
      ty += th + 8;
    }
    if (M.freePick) {
      panel(g, tx, ty, tw, th, 'rgba(30,14,4,0.92)', '#ffd84a');
      g.font = `italic 900 18px ${FONT_T}`; strokeText(g, `MASTERY LV ${FREE_PICK_LV}: FREE PICK EARNED!`, tx + 18, ty + 24, this.t % 30 < 18 ? '#ffd84a' : '#ffffff', OUTLINE, 4);
      g.font = `700 13px ${FONT_UI}`; g.fillStyle = '#ffe2a8'; g.fillText('Unlock any fighter you like in character select.', tx + 18, ty + 52);
    }
    g.restore();
  };
}
