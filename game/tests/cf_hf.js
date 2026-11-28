// combo finder: node tests/combofind.js [ids] -> JSON of verified combos per fighter
// Every candidate is played by a bot in training mode against a dummy set to "block after first hit"
// (guard 2), so a combo only passes if the dummy never gets a chance to block or act between hits.
const { open } = require('./harness');
const fs = require('fs');
(async () => {
  const { browser, page, errors } = await open();
  await page.evaluate(() => {
    window.runSeq = function (id, oppId, seq, delay = 0) {
      const log = [];
      HF_FORCE = window.FORM || null; T.start(id, oppId, "training");
      BT.dm.guard = window.GUARD ?? 2;
      const A = BT.p1, D = BT.p2, ch = A.ch;
      A.meter = 100; A.starts = 0; const _sm = A.startMove; A.startMove = function (...a) { this.starts++; return _sm.apply(this, a); };
      const fwd = () => A.facing > 0 ? 'right' : 'left', back = () => A.facing > 0 ? 'left' : 'right';
      const hold = (...d) => { T.held = new Set(d); };
      let ended = false, best = [], resets = 0, last = 0, blocked = false, dmg = 0, hits = 0, started = 0;
      const fr = (press = []) => {
        T.frame(press); const cm = D.comboMoves;
        if (cm.length < last) ended = true; else if (ended && cm.length) { resets++; ended = false; } last = cm.length; if (cm.length) { best = cm.slice(); dmg = Math.max(dmg, D.comboDmg); hits = Math.max(hits, D.comboHits); }
        if (D.lastHitT >= 0 && D.state === 'block' && started) blocked = true;
      };
      const wait = (cond, max = 120) => { for (let i = 0; i < max; i++) { if (cond()) return true; fr(); } return cond(); };
      const findFu = k => { for (const [mk, m] of Object.entries(ch.moves)) for (const fu of m.followups || []) if (fu.move === k) return fu; return null; };
      function input(k) {
        const B = { L: 'light', M: 'medium', H: 'heavy', jL: 'light', jM: 'medium', jH: 'heavy' };
        if (B[k]) { fr([B[k]]); return; }
        if (k === 'LH') { fr(['light', 'heavy']); return; }
        if (k === 'cL' || k === 'cM' || k === 'cH') { hold('down'); fr([{ cL: 'light', cM: 'medium', cH: 'heavy' }[k]]); fr(); hold(); return; }
        if (k === 'FF') { hold(fwd()); fr(); hold(); fr(); hold(fwd()); fr(['heavy']); hold(); return; }
        if (k === 'sp1' || k === 'sp2') { hold(); fr([k]); return; }
        if (k === 'sp1f' || k === 'sp2f') { hold('down'); fr(); hold('down', fwd()); fr(); hold(fwd()); fr([k.slice(0, 3)]); hold(); return; }
        if (k === 'counter') { hold('down'); fr(); hold('down', back()); fr(); hold(back()); fr(['sp1']); hold(); return; }
        if (k === 'sp2d') { hold('down'); fr(); hold(); fr(); hold('down'); fr(['sp2']); hold(); fr(); return; }
        if (k === 'ult') { hold(); fr(['sp1', 'sp2']); return; }
        const fu = findFu(k);
        if (fu) { if (fu.dir === 'f') hold(fwd()); if (fu.dir === 'b') hold(back()); if (fu.dir === 'd') hold('down'); fr([fu.btn]); hold(); return; }
        if (ch.trialInput && ch.trialInput[k]) { ch.trialInput[k]({ fr, hold, fwd, back }); return; }
        log.push('noinput ' + k);
      }
      const doMove = (k) => {
        const air = /^j[LMH]$/.test(k) || (ch.moves[k] && ch.moves[k].air && ch.moves[k].air !== 'both' && !A.onGround);
        if (air && A.onGround) { hold('up'); wait(() => !A.onGround, 30); hold(); for (let i = 0; i < 7; i++) fr(); }
        const sameNow = A.state === 'attack' && A.moveKey === k;
        for (let tries = 0; tries < 6; tries++) {
          const st0 = A.starts;
          input(k); wait(() => BT.hitstop <= 0 && !BT.freeze, 40);
          if (wait(() => (A.state === 'attack' && A.moveKey === k && (!sameNow || A.starts > st0)) || A.state === 'cine', 6)) return true;
        }
        log.push('nostart ' + k); return false;
      };
      hold(fwd()); wait(() => Math.abs(D.x - A.x) < (window.APPROACH || 95), 200); hold(); fr();
      let prev = null, okStart = true;
      for (const k of seq) {
        if (prev) {
          const pm = ch.moves[prev], air = /^j/.test(k);
          if (air && pm && pm.jc) wait(() => A.connectedHit || A.state !== 'attack', 60);
          else {
            wait(() => (A.connectedHit && A.mf > (pm ? pm.st : 0)) || A.state === 'cine' || BT.cine || A.state !== 'attack', 80);
            for (let i = 0; i < delay && A.state === 'attack'; i++) fr();
          }
          if (BT.cine) wait(() => !BT.cine, 400);
        }
        if (!doMove(k)) { okStart = false; break; }
        started = 1; prev = k;
      }
      wait(() => D.comboHits === 0 && !BT.cine && A.actionable(), 400);
      // subsequence check
      let i = 0; for (const k of best) if (i < seq.length && k === seq[i]) i++;
      const ok = okStart && resets === 0 && !blocked && i === seq.length;
      return { ok, dmg: Math.round(dmg), hits, resets, blocked, matched: i, moves: best.join(','), log: log.join('|') };
    };
  });
  await page.evaluate(f => window.FORM = f, process.env.FORM || null); await page.evaluate(a => window.APPROACH = a, +(process.env.AP || 70));
  const ids = process.argv[2] ? process.argv[2].split(',') : await page.evaluate(() => CHARS.map(c => c.id));
  const out = {};
  for (const id of ids) {
    const info = await page.evaluate(id => {
      const ch = window.FORM ? HF_FORMS[window.FORM] : CHARS.find(c => c.id === id), mv = ch.moves;
      const meta = {};
      for (const [k, m] of Object.entries(mv)) meta[k] = { name: m.name, lvl: m.lvl, dmg: m.dmg, cat: m.cat, cost: m.cost || 0, ult: !!m.ult, fu: (m.followups || []).map(f => f.move), counter: !!m.counter, special: !!m.special, followup: !!m.followup, air: m.air || 0, cd: m.cd || 0 };
      return { name: ch.name, meta, trials: (ch.combos || []).map(c => ({ name: c.name, notation: c.notation, seq: c.seq, pre: c.pre })) };
    }, id);
    const M = info.meta, has = k => !!M[k];
    const specials = ['sp1', 'sp1f', 'counter', 'sp2', 'sp2f', 'sp2d'].filter(has).filter(k => !M[k].counter);
    const fuOf = k => (M[k] ? M[k].fu : []).filter(has);
    const cands = new Set();
    const starters = [[], ['L'], ['L', 'L'], ['L', 'L', 'L'], ['cL'], ['cL', 'cL']];
    const m1 = [[], ['M'], ['cM']], m2 = [[], ['H'], ['cH']];
    for (const s of starters) for (const a of m1) for (const b of m2) {
      const base = [...s, ...a, ...b]; if (!base.length) continue;
      // normal followups (target combos)
      const lastK = base[base.length - 1];
      for (const f of fuOf(lastK)) if (!M[f].special) { cands.add(JSON.stringify([...base, f])); }
      if (base.length >= 2) cands.add(JSON.stringify(base));
      for (const sp of [...specials, 'FF', 'LH'].filter(has)) {
        const c = [...base, sp]; cands.add(JSON.stringify(c));
        for (const f of fuOf(sp)) { cands.add(JSON.stringify([...c, f])); if (has('ult')) cands.add(JSON.stringify([...c, f, 'ult'])); }
        if (has('ult') && M[sp].special) cands.add(JSON.stringify([...c, 'ult']));
      }
      if (has('ult')) cands.add(JSON.stringify([...base, 'ult']));
    }
    if (has('LH')) { cands.add(JSON.stringify(['LH', 'jL', 'jM', 'jH'])); cands.add(JSON.stringify(['L', 'M', 'LH', 'jL', 'jM', 'jH'])); cands.add(JSON.stringify(['M', 'LH', 'jM', 'jH'])); }
    for (const t of info.trials) if (!t.pre) cands.add(JSON.stringify(t.seq));
    const res = [];
    for (const cj of cands) {
      const seq = JSON.parse(cj);
      const r = await page.evaluate(([id, seq]) => runSeq(id, 'kazuma', seq, 0), [id, seq]);
      if (r.ok) {
        const r2 = await page.evaluate(([id, seq]) => runSeq(id, 'kazuma', seq, 4), [id, seq]);
        r.lenient = r2.ok;
        res.push({ seq, ...r });
      }
    }
    out[id] = { name: info.name, meta: info.meta, trials: info.trials, ok: res, tested: cands.size };
    console.log(id, 'tested', cands.size, 'ok', res.length, 'errors', errors.length);
  }
  fs.writeFileSync(process.env.OUT || 'combofind.json', JSON.stringify(out));
  console.log('errors', errors.slice(0, 5));
  await browser.close();
})();
