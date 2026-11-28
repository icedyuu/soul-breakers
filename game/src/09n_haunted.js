// ---------------- HAUNTED FOUR: match-level roll + art for the four forms ----------------
// The form is rolled once per MATCH (see hfRollForm in 04_zzzz9k_haunted.js): a fresh match (first round,
// restart, rematch) clears the roll; later rounds and tag-ins reuse it.
{
  const BP = Battle.prototype, nr = BP.newRound;
  BP.newRound = function (first) { if (first) this.hfRoll = null; return nr.call(this, first); };
}
// portraits / cards / cut-ins of the forms (and the golden suit), built on first use like the roster's
for (const ch of Object.values(HF_FORMS)) {
  const A = {};
  for (const [k, w, h, o, f] of [['portrait', 300, 300, { scale: 3.0 }, 1 / 3], ['card', 100, 186, { scale: 2.1, hy: 0.4, hx: 0.45 }, 0.5], ['cutin', 760, 190, { scale: 6.5, hx: 0.4, hy: 0.5, glow: true, expr: 'shout', bg1: '#000000' }, 0.5]]) {
    Object.defineProperty(ch, k, { configurable: true, get() {
      let e = A[k];
      if (!e) { const mr = Math.random; if (typeof NetRng !== 'undefined') Math.random = NetRng.orig; try { e = A[k] = { hd: makePortrait(ch, w, h, o), px: null }; } finally { Math.random = mr; } }
      return Settings.pixel ? (e.px || (e.px = PIX.pixelizeCanvas(e.hd, f, { outline: true, step: 18 }))) : e.hd;
    } });
  }
}
