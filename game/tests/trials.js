// combo-trial bot: node trials.js id1,id2 ...   (plays every trial of each character in training mode)
const { open } = require('./harness');
(async () => {
  const ids = (process.argv[2] || 'borgar').split(',');
  const verbose = process.argv.includes('-v');
  const { browser, page, errors } = await open();
  let fails = 0;
  for (const id of ids) {
    const n = await page.evaluate(id => (CHARS.find(c => c.id === id).combos || []).length, id);
    for (let ti = 0; ti < n; ti++) {
      const res = await page.evaluate(([id, ti]) => {
        const log = [];
        T.start(id, 'kazuma', 'training');
        BT.trialIdx = ti; BT.applyTrialHand();
        const A = BT.p1, ch = A.ch, tr = ch.combos[ti];
        const fwd = () => A.facing > 0 ? 'right' : 'left', back = () => A.facing > 0 ? 'left' : 'right';
        const hold = (...d) => { T.held = new Set(d); };
        let best = [], hist = [], last = 0; const fr = (press = []) => { T.frame(press); const cm = BT.p2.comboMoves; if (cm.length < last) hist.push(best.join(',')); last = cm.length; if (cm.length) best = cm.slice(); };
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
          log.push('no input for ' + k);
        }
        const doMove = (k, prev) => {
          const air = /^j[LMH]$/.test(k) || (ch.moves[k] && ch.moves[k].air && ch.moves[k].air !== 'both' && !A.onGround);
          if (air && A.onGround) {   // jump-cancel / jump first
            hold('up'); wait(() => !A.onGround, 30); hold(); for (let i = 0; i < 7; i++) fr();
          }
          for (let tries = 0; tries < 12; tries++) {
            input(k); wait(() => BT.hitstop <= 0 && !BT.freeze, 40);
            if (wait(() => A.state === 'attack' && A.moveKey === k || A.state === 'cine', 6)) return true;
          }
          log.push(`failed to start ${k} (state ${A.state} ${A.moveKey} mf ${A.mf} cd ${A.cd[k] || 0})`); return false;
        };
        const approach = (d = 95) => { hold(fwd()); wait(() => Math.abs(BT.p2.x - A.x) < d, 200); hold(); fr(); };
        // setup moves (tr.range = distance the setup is done from)
        if (tr.pre && tr.range) approach(tr.range);
        for (const k of tr.pre || []) { doMove(k); wait(() => A.actionable(), 120); for (let i = 0; i < 4; i++) fr(); }
        approach();
        let prev = null;
        for (const k of tr.seq) {
          if (prev) {
            const pm = ch.moves[prev], air = /^j/.test(k);
            if (air && pm && pm.jc) { wait(() => A.connectedHit || A.state !== 'attack', 60); }
            else wait(() => (A.connectedHit && A.mf > (pm ? pm.st : 0)) || A.state === 'cine' || BT.cine || !['attack'].includes(A.state), 80);
            if (BT.cine) wait(() => !BT.cine, 400);
          }
          if (!doMove(k, prev)) break;
          prev = k;
        }
        wait(() => BT.trialDone.has(ch.id + ':' + ti), 300);
        return { name: tr.name, ok: BT.trialDone.has(ch.id + ':' + ti), log, moves: [...hist, best.join(',')].join(' | ') + ' A:' + A.state + '/' + A.moveKey, prog: BT.trialProg };
      }, [id, ti]);
      if (!res.ok) fails++;
      console.log(`${res.ok ? 'PASS' : 'FAIL'} ${id} #${ti + 1} ${res.name}  prog=${res.prog} ${res.log.join(' | ')} ${res.ok && !verbose ? '' : res.moves}`);
    }
  }
  console.log('errors', errors.slice(0, 5), 'fails', fails);
  await browser.close();
  process.exit(fails || errors.length ? 1 : 0);
})();
