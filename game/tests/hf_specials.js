// node hf_specials.js [form] : every special of every HAUNTED FOUR form at 2 ranges vs standing / guarding Kazuma
const { open } = require('./harness');
(async () => {
  const only = process.argv[2];
  const { browser, page, errors } = await open();
  const res = await page.evaluate(only => {
    const out = [];
    for (const form of HF_IDS.filter(f => !only || f === only)) {
      HF_FORCE = form;
      const keys = ['sp1', 'sp1f', 'counter', 'sp2', 'sp2f', 'sp2d', 'ult', 'H', 'FF', 'LH', 'THROW'];
      for (const k of keys) for (const dist of [100, 260]) for (const guard of [0, 2]) {
        T.start('haunted', 'kazuma', 'versus'); const A = BT.p1, D = BT.p2; BT.timer = 1e9; A.meter = 100;
        if (A.ch.formId !== form) { out.push('WRONG FORM ' + A.ch.formId); continue; }
        D.x = A.x + dist; T.run(3);
        const hp0 = D.hp; let cine = false, hit = false, blk = false, maxF = 0;
        A.startMove(k);
        for (let i = 0; i < 520; i++) { D.autoBlock = !!guard; T.frame(); if (BT.cine) cine = true; if (D.state === 'hit' || D.state === 'grabbed') hit = true; if (D.state === 'block') blk = true; if (A.state === 'attack' || A.state === 'cine') maxF = i; }
        out.push(`${form.padEnd(8)}${k.padEnd(8)} d${dist} ${guard ? 'GUARD' : 'stand'}: ${hit ? 'HIT' : blk ? 'BLOCK' : 'whiff'}${cine ? '+CINE' : ''} dmg ${Math.round(hp0 - D.hp)} frames ${maxF} A ${A.state}${A.hidden ? ' HIDDEN' : ''}${A.forcePose ? ' FP' : ''} D ${D.state}${D.hidden ? ' HIDDEN' : ''}`);
      }
    }
    HF_FORCE = null;
    return out.join('\n');
  }, only);
  console.log(res);
  console.log('errors', errors.slice(0, 8));
  await browser.close();
})();
