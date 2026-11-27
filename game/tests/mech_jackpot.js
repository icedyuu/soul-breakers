// node mech_jackpot.js : Jackpot — LUCK gain/decay, odds, max-LUCK guaranteed jackpot, every gamble tier of all six
// specials (forced via F.jpForce), All In tiers, Double or Nothing buffs, Russian Roulette interrupt/click/crouch,
// House zone avoidable, ultimate normal + MAX ending, skins visual only, determinism with a fixed seed.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const res = await page.evaluate(() => {
    const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
    const fresh = (o = 'kazuma', dist = 200, v1 = 0) => { go(new Battle({ mode: 'versus', stage: 0, p1: T.idx('jackpot'), p2: T.idx(o), v1 })); BT.phase = 'fight'; BT.p1.setState('idle'); BT.p2.setState('idle'); BT.timer = 1e9; const A = BT.p1, D = BT.p2; D.x = A.x + dist; return [A, D]; };
    const play = (A, k, n = 90, force) => { if (force) A.jpForce = force; A.startMove(k); for (let i = 0; i < n; i++) T.frame(); };
    const dmgOf = (k, force, dist = 200, n = 120, pre) => { const [A, D] = fresh('kazuma', dist); if (pre) pre(A, D); play(A, k, n, force); return [D.maxHp - D.hp, A, D]; };
    // gains
    let [A, D] = fresh('kazuma', 90); const l0 = A.luck; play(A, 'L', 30); ok(A.luck > l0, `light hit builds LUCK (${l0} → ${A.luck})`);
    [A, D] = fresh(); A.luck = 50; A.luckT = A.T; T.run(400); ok(A.luck === 50, 'no decay right after a hit'); T.run(200); ok(A.luck < 50, `slow decay later (${A.luck.toFixed(1)})`);
    // odds
    [A, D] = fresh(); A.luck = 0; const o0 = jpOdds(A, 'dice'); A.luck = 90; const o9 = jpOdds(A, 'dice'); A.luck = 100; const oM = jpOdds(A, 'dice');
    ok(o9.bad < o0.bad && o9.jack > o0.jack, `LUCK lowers bad odds (${o0.bad.toFixed(2)}→${o9.bad.toFixed(2)}) and raises jackpot (${o0.jack.toFixed(2)}→${o9.jack.toFixed(2)})`);
    ok(oM.jack === 1 && oM.bad === 0, 'max LUCK = guaranteed jackpot');
    A.luck = 0; A.pity = 3; const oP = jpOdds(A, 'dice'); ok(oP.bad < o0.bad && oP.jack > o0.jack, 'pity improves the odds');
    A.pity = 0; A.hot = 3; const oH = jpOdds(A, 'dice'); ok(oH.jack > o0.jack, 'HOT pips raise jackpot odds');
    // max LUCK → next gamble is a jackpot, spends the luck, for every gamble
    for (const k of ['sp1', 'sp1f', 'counter', 'sp2', 'sp2f']) { [A, D] = fresh('kazuma', 260); A.luck = 100; play(A, k, 140); ok(A.lastBet && A.lastBet.t === 'jackpot' && A.jpStats.maxJ === 1, `${k}: max LUCK → JACKPOT (${A.lastBet && A.lastBet.t}), luck now ${Math.round(A.luck)}`); }
    // statistical: 400 rolls at 0 / 80 LUCK
    const stat = L => { [A, D] = fresh(); let b = 0, j = 0; for (let i = 0; i < 400; i++) { A.luck = L; A.pity = 0; A.hot = 0; const t = jpGamble(A, 'dice'); if (t === 'bad') b++; if (t === 'jackpot') j++; } return [b, j]; };
    const s0 = stat(0), s8 = stat(80); ok(s8[0] < s0[0] && s8[1] >= s0[1], `rolls follow LUCK: bad ${s0[0]}→${s8[0]}, jackpot ${s0[1]}→${s8[1]} /400`);
    // tiers: dice
    const dd = {}; for (const t of ['bad', 'normal', 'good', 'jackpot']) dd[t] = dmgOf('sp1', t, 260)[0];
    ok(dd.bad < dd.normal && dd.normal < dd.good && dd.good < dd.jackpot, `dice damage by tier ${JSON.stringify(dd)}`);
    // flush: royal flush finisher after 3 cards
    const fl = {}; for (const t of ['bad', 'normal', 'good', 'jackpot']) fl[t] = dmgOf('sp1f', t, 260, 140)[0];
    ok(fl.bad <= fl.normal && fl.normal < fl.good && fl.good < fl.jackpot, `royal flush damage by tier ${JSON.stringify(fl)}`);
    [A, D] = fresh('kazuma', 260); play(A, 'sp1f', 60, 'good'); ok(D.state === 'hit' && !D.onGround || D.comboHits >= 4, `royal flush launches (${D.state}, hits ${D.comboHits})`);
    // Double or Nothing
    [A, D] = fresh(); play(A, 'counter', 60, 'normal'); ok(A.donK === 'win' && A.dmgMult > 1.1 && A.hot === 1, `WIN buff dmg ${A.dmgMult.toFixed(2)}`);
    [A, D] = fresh(); play(A, 'counter', 40, 'bad'); ok(A.donK === 'lose' && A.dmgMult < 1 && A.moveKey === 'donLose', `LOSE: weaker + slump (${A.dmgMult.toFixed(2)})`);
    const tk = lose => { const [A, D] = fresh('kazuma', 80); if (lose) { A.donT = 200; A.donK = 'lose'; } A.x = D.x - 80; D.startMove('M'); T.run(40); return A.maxHp - A.hp; }; const t0 = tk(0), t1 = tk(1); ok(t1 > t0 * 1.1, `LOSE: takes more damage (${t0.toFixed(1)} → ${t1.toFixed(1)})`);
    [A, D] = fresh(); play(A, 'counter', 60, 'jackpot'); ok(A.donK === 'jack' && A.dmgMult > 1.25, `ALL ACES dmg ${A.dmgMult.toFixed(2)}`);
    T.run(500); ok(A.donT === 0 && A.dmgMult < 1.01, 'buff runs out');
    // Russian Roulette
    [A, D] = fresh('kazuma', 300); const rb = dmgOf('sp2', 'normal', 300)[0]; ok(rb >= 90, `BANG hits (${rb.toFixed(0)})`);
    [A, D] = fresh('kazuma', 300); D.setState('block'); D.guard = true; D.autoBlock = true; play(A, 'sp2', 70, 'normal'); ok(D.hp < D.maxHp - 50, 'shot is unblockable (standing)');
    [A, D] = fresh('kazuma', 300); D.input.virtual = { l: false, r: false, u: false, d: true, btn: { held: {}, press: new Set() } }; T.run(5); A.jpForce = 'normal'; A.startMove('sp2'); for (let i = 0; i < 70; i++) T.frame(); D.input.virtual = null; ok(D.hp === D.maxHp, 'crouching dodges the shot');
    [A, D] = fresh('kazuma', 300); play(A, 'sp2', 40, 'bad'); ok(A.moveKey === 'rrClick' && A.state === 'attack', '*click* leaves him open'); T.run(60);
    [A, D] = fresh('kazuma', 90); A.jpForce = 'normal'; A.startMove('sp2'); T.run(12); D.startMove('L'); T.run(30); ok(A.state === 'hit' || A.hp < A.maxHp, 'aiming can be interrupted'); ok(BT.projs.filter(p => p.kind === 'jpBullet').length === 0, 'no shot after interrupt');
    const ex = dmgOf('sp2', 'jackpot', 300, 140)[0]; ok(ex > rb, `EXECUTION stronger (${ex.toFixed(0)})`);
    [A, D] = fresh('kazuma', 300); A.luck = 40; play(A, 'sp2', 70, 'normal'); ok(A.luck < 40 && A.lastBet.t === 'normal', `roulette costs LUCK (40 → ${Math.round(A.luck)} incl. hit gains)`);
    // House always wins
    const hs = {}; for (const t of ['bad', 'normal', 'good', 'jackpot']) hs[t] = dmgOf('sp2f', t, 300, 130)[0];
    ok(hs.bad > 0 && hs.bad < hs.good && hs.good < hs.jackpot, `house damage by tier ${JSON.stringify(hs)}`);
    [A, D] = fresh('kazuma', 300); A.jpForce = 'normal'; A.startMove('sp2f'); T.run(24); D.x += 380; T.run(90); ok(D.hp === D.maxHp, 'walking out of the wheel avoids it');
    // All In tiers
    const ai = {}; for (const L of [10, 50, 85, 100]) { const r = dmgOf('sp2d', null, 110, 200, A => { A.luck = L; }); ai[L] = [Math.round(r[0]), r[1].allInL, Math.round(r[1].luck)]; }
    ok(ai[10][0] < ai[50][0] && ai[50][0] < ai[85][0] && ai[85][0] < ai[100][0], `All In scales with LUCK ${JSON.stringify(ai)}`);
    ok(Object.entries(ai).every(([L, v]) => v[2] <= Math.max(5, +L * 0.5)), 'All In spends the LUCK');
    // ultimate: normal vs MAX
    const ult = (L) => { const [A, D] = fresh('kazuma', 110); A.meter = 100; A.luck = L; A.startMove('ult'); let n = 0; while ((A.state === 'attack' || A.state === 'cine' || BT.freeze) && n < 800) { T.frame(); n++; } return [D.maxHp - D.hp, n, A.ultMax, A.jpWinMax, Math.round(A.luck)]; };
    const u0 = ult(30), u1 = ult(100); ok(u0[0] > 200 && u1[0] > u0[0] && u1[2] && !u0[2] && u1[3], `ult ${JSON.stringify(u0)} MAX ${JSON.stringify(u1)}`);
    // skins don't change stats
    const sk = v => { const [A, D] = fresh('kazuma', 260, v); A.jpForce = 'jackpot'; A.startMove('sp1'); for (let i = 0; i < 80; i++) T.frame(); return D.maxHp - D.hp; };
    const s00 = sk(0), s4 = sk(4), s5 = sk(5); ok(s00 === s4 && s00 === s5, `skins visual only (${s00} ${s4} ${s5})`);
    // determinism: same seed → same result
    const run = () => { const mr = Math.random; Math.random = netRandom; try { const [A, D] = fresh('kazuma', 260); NetRng.seed(1234); A.luck = 30; const log = []; for (const k of ['sp1', 'sp1f', 'counter', 'sp2', 'sp2f']) { A.cd = {}; A.startMove(k); for (let i = 0; i < 90; i++) T.frame(); log.push(A.lastBet && A.lastBet.t, Math.round(D.hp)); } return log.join(','); } finally { Math.random = mr; } };
    const r1 = run(), r2 = run(); ok(r1 === r2, `deterministic with a seed (${r1})`);
    // draw everything once (HUD, cines)
    [A, D] = fresh(); A.luck = 100; T.draw(); A.hot = 2; A.donT = 100; A.donK = 'jack'; T.draw();
    return out;
  });
  console.log(res.join('\n'));
  if (errors.length) console.log('ERRORS:\n' + errors.slice(0, 8).join('\n'));
  console.log(res.filter(l => l.startsWith('FAIL')).length ? 'SOME FAILED' : 'ALL OK');
  await browser.close();
})();
