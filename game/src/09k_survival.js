// ===================== SURVIVAL + BOSS RUSH (1P VS CPU → SURVIVAL · BOSS RUSH) =====================
// SURVIVAL: endless one-round fights against random CPU opponents. HP carries over; a win heals
//   SURV_CFG.survival.heal (+ bonus for a perfect fight). The CPU gets harder (Easy → Normal → Hard,
//   then more HP), every 10th fight is a BOSS (buffed, boss arena). Score = wins (then time).
// BOSS RUSH: SURV_CFG.boss.n buffed bosses in a row (glowing LV10 colours, Hard CPU), bigger heals,
//   the last two are always Kuon and The Hollow on the Throne of Souls. Score = bosses beaten (then time).
// Both give mastery XP per win (Mastery.grant), keep a local best (localStorage sb_survival_v1) and
// post to the online leaderboard when logged in (cloud/supabase_survival.sql: sb_surv_submit / sb_surv_top).
// Runs are not stored as replays (HP carries between fights, a single fight could not be replayed alone).
const SURV_CFG = {
  survival: { name: 'SURVIVAL', jp: 'サバイバル', heal: 0.15, perfect: 0.10, bossEvery: 10, desc: 'Endless one-round fights. Your HP carries over, each win heals a little. How far can you go?' },
  boss: { name: 'BOSS RUSH', jp: 'ボスラッシュ', heal: 0.30, perfect: 0.10, n: 7, hpMul: 1.5, dmgMul: 1.2, desc: 'Seven powered-up bosses in a row on HARD. Beat them all as fast as you can.' },
};
const SURV_BOSS_POOL = ['saint', 'lunaria', 'kuchi', 'hachi', 'tokine', 'yamika', 'reika', 'buzzu', 'jackpot', 'haze'];
const SURV_BOSS_FINAL = ['honored', 'hollow'];
Object.assign(CLOUD_ERR, { BAD_SCORE: 'Score rejected by the server.', BAD_MODE: 'Score rejected by the server.' });
const survFmt = f => { const s = Math.floor(f / 60); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

// mastery XP outside the normal results screen (also used by combo trials)
Mastery.grant = function (ch, xp, won) {
  xp = Math.max(0, Math.round(xp));
  const id = ch.id, r = this.rec(id), before = this.info(r.xp);
  r.xp += xp; if (won === true) r.w++; else if (won === false) r.l++;
  const d = this.data; if (d.clean) d.clean[id] = (d.clean[id] | 0) + xp;   // hidden cheat keeps the real XP separately
  const after = this.info(r.xp), unlocks = [];
  for (let v = 1; v < VAR_N; v++) if (!varSpecial(id, v) && before.lv < VAR_UNLOCK[v] && after.lv >= VAR_UNLOCK[v]) unlocks.push(v);
  this.save();
  return { ch, gained: xp, before, after, unlocks };
};

const SurvBest = {
  KEY: 'sb_survival_v1', d: null,
  get data() { if (!this.d) { try { this.d = JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch (e) { this.d = {}; } } return this.d; },
  get(mode) { return this.data[mode] || null; },
  better(a, b) { return !b || a.score > b.score || (a.score === b.score && a.frames < b.frames); },
  put(mode, o) { if (!this.better(o, this.get(mode))) return false; this.data[mode] = o; try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { } return true; },
};
const SurvCloud = {
  submit(mode, score, frames, ch) { return Cloud.rpc('sb_surv_submit', { p_token: Cloud.tok, p_mode: mode, p_score: score, p_frames: frames, p_ch: ch }); },
  top(mode, n = 50) { return Cloud.rpc('sb_surv_top', { p_mode: mode, p_limit: n }); },
};

// ---------------- run state ----------------
function survNewRun(kind, p1) {
  const run = { kind, p1, n: 0, wins: 0, hp: 1, meter: 0, frames: 0, dmg: 0, perfects: 0, xp: 0, xpRes: null, last: [], cfg: null };
  if (kind === 'boss') {
    const own = CHARS[p1].id, idx = id => CHARS.findIndex(c => c.id === id);
    const pool = shuffleArr(SURV_BOSS_POOL.filter(id => id !== own && idx(id) >= 0));
    const fin = SURV_BOSS_FINAL.filter(id => id !== own && idx(id) >= 0);
    const first = pool.slice(0, SURV_CFG.boss.n - fin.length);
    while (first.length + fin.length < SURV_CFG.boss.n) { const c = CHARS.find(c => c.id !== own && !first.includes(c.id) && !fin.includes(c.id)); if (!c) break; first.push(c.id); }
    run.order = [...first, ...fin].map(idx);
  }
  return run;
}
function survStart(kind, p1) { const run = survNewRun(kind, p1); return new SurvivalVSScene(run, survNextCfg(run)); }
function survLevel(run) { return run.kind === 'boss' ? 2 : run.wins < 3 ? 0 : run.wins < 8 ? 1 : 2; }
function survIsBoss(run) { return run.kind === 'boss' || (run.wins + 1) % SURV_CFG.survival.bossEvery === 0; }
function survNextCfg(run) {
  let p2;
  if (run.kind === 'boss') p2 = run.order[run.wins];
  else {
    const pool = CHARS.map((c, i) => i).filter(i => i !== run.p1 && !run.last.includes(i));
    p2 = pool[Math.floor(Math.random() * pool.length)];
    run.last = [...run.last, p2].slice(-4);
  }
  const boss = survIsBoss(run), last = run.kind === 'boss' && run.wins === run.order.length - 1;
  let stage = Math.floor(Math.random() * STAGES.length);
  if (typeof BOSS_STAGE !== 'undefined' && BOSS_STAGE >= 0) stage = (boss && (last || run.kind === 'survival')) ? BOSS_STAGE : stage === BOSS_STAGE ? (BOSS_STAGE + 1) % STAGES.length : stage;
  const hpMul = boss ? SURV_CFG.boss.hpMul : run.wins >= 8 ? Math.min(1.5, 1 + 0.05 * Math.floor((run.wins - 8) / 3 + 1)) : 1;
  const cfg = { mode: 'versus', p1: run.p1, p2, stage, cpu: { level: boss ? 2 : survLevel(run), surv: run.kind }, surv: run, boss, hpMul, dmgMul: boss ? SURV_CFG.boss.dmgMul : 1 };
  if (run.cfg) cfg.v1 = run.cfg.v1;
  cfg.v2 = boss ? 4 : 0;
  run.cfg = cfg;
  return cfg;
}

// ---------------- one fight of a run ----------------
class SurvivalBattle extends Battle {
  constructor(cfg) {
    const on = typeof Replay !== 'undefined' ? Replay.on : undefined;
    if (typeof Replay !== 'undefined') Replay.on = false;   // no replays for runs
    try { super(cfg); } finally { if (typeof Replay !== 'undefined') Replay.on = on; }
    this.survT = 0;
  }
  get run() { return this.cfg.surv; }
  newRound(first) {
    const run = this.cfg.surv, c = this.cfg;
    super.newRound(first && run.n === 0);
    const A = this.p1, B = this.p2;
    A.hp = A.redHp = Math.max(1, Math.round(A.maxHp * run.hp)); A.meter = run.meter;
    if (c.hpMul && c.hpMul !== 1) { B.maxHp = Math.round(B.maxHp * c.hpMul); B.hp = B.redHp = B.maxHp; }
    if (c.dmgMul && c.dmgMul !== 1) { const m = c.dmgMul, d = Object.getOwnPropertyDescriptor(Fighter.prototype, 'dmgMult').get; Object.defineProperty(B, 'dmgMult', { configurable: true, get() { return d.call(this) * m; } }); }
    this.startHp = A.hp;
  }
  updateRoundCall() {
    if (this.pf === 1) {
      const run = this.run, k = run.kind === 'boss' ? `BOSS ${run.wins + 1}/${run.order.length}` : `BATTLE ${run.wins + 1}`;
      FX.announce(this.cfg.boss && run.kind !== 'boss' ? 'BOSS BATTLE' : k, { sub: this.cfg.boss ? '強敵出現' : `第${run.wins + 1}戦`, life: 75, size: 100, glow: this.cfg.boss ? '#a020ff' : '#ff2255', color: '#ffd84a' });
      Sound.play('gong');
      return;
    }
    return super.updateRoundCall();
  }
  doKO(winner) { const w = this.wins; this.wins = [1, 1]; try { super.doKO(winner); } finally { this.wins = w; } }   // every KO is the final one
  update() {
    const was = this.paused;
    super.update();
    if (!this.paused && this.phase === 'fight' && !was) this.run.frames++;
    if (this.paused && this.pauseMenu && !this.pauseMenu.survFix) {
      const m = this.pauseMenu; m.survFix = true;
      m.items = m.items.filter(i => i.id !== 'restart').map(i => i.id === 'select' ? { id: 'giveup', label: 'GIVE UP (END RUN)', jp: '降参' } : i);
      const u = m.update.bind(m);
      m.update = () => { const it = u(); if (it && it.id === 'giveup') { this.paused = false; Sound.play('menuOk'); survEnd(this.run, 'giveup'); return null; } return it; };
    }
  }
  updateRoundEnd() {
    if (this.quote) this.quote.t++;
    if (this.pf === 60 && this.winner !== this.p1) Sound.play('defeat');
    if (this.pf >= 170 || (this.pf > 50 && UI.ok())) { this.quote = null; this.phase = 'matchEnd'; survAfterFight(this); }
  }
  draw(g) {
    super.draw(g);
    if (this.paused) return;
    const run = this.run, txt = run.kind === 'boss' ? `BOSS RUSH · ${run.wins}/${run.order.length}` : `SURVIVAL · ${run.wins} WIN${run.wins === 1 ? '' : 'S'}`;
    g.save(); g.font = `italic 900 18px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const w = g.measureText(txt).width + 34; panel(g, W / 2 - w / 2, 112, w, 28, 'rgba(10,6,24,0.75)', this.cfg.boss ? '#c070ff' : 'rgba(255,216,74,0.6)');
    strokeText(g, txt, W / 2, 127, this.cfg.boss ? '#e0b0ff' : '#ffd84a', OUTLINE, 4);
    g.restore();
  }
}

function survAfterFight(bt) {
  const run = bt.run, A = bt.p1, won = bt.winner === A, set = SURV_CFG[run.kind];
  run.dmg += A.stats.dmg; run.n++;
  if (!won) { survEnd(run, 'ko'); return; }
  run.wins++;
  const perfect = A.hp >= bt.startHp - 0.5; if (perfect) run.perfects++;
  const lvMul = [0.7, 1, 1.4][bt.cfg.cpu.level] || 1;
  run.xp += Math.round((run.kind === 'boss' ? 80 : 40) * lvMul * (bt.cfg.boss && run.kind !== 'boss' ? 2 : 1));
  run.prevHp = A.hp / A.maxHp;
  run.healed = set.heal + (perfect ? set.perfect : 0);
  run.hp = clamp(run.prevHp + run.healed, 0.05, 1); run.meter = A.meter;
  run.perfect = perfect;
  if (run.kind === 'boss' && run.wins >= run.order.length) { survEnd(run, 'clear'); return; }
  go(new SurvivalVSScene(run, survNextCfg(run)));
}
function survEnd(run, why) {
  if (run.ended) return; run.ended = true; run.why = why;
  const ch = CHARS[run.p1], score = run.wins;
  if (why === 'clear') run.xp += 300;
  run.xpRes = run.xp > 0 ? Mastery.grant(ch, run.xp, why === 'clear' ? true : undefined) : null;
  run.score = score;
  run.record = score > 0 && SurvBest.put(run.kind, { score, frames: run.frames, ch: ch.id, at: Date.now() });
  run.online = null;
  if (score > 0 && typeof Cloud !== 'undefined' && Cloud.on) {
    run.online = { st: 'send' };
    SurvCloud.submit(run.kind, score, run.frames, ch.id).then(r => { run.online = { st: 'ok', rank: r && r.rank, best: r && r.best }; })
      .catch(e => { run.online = { st: e.message === 'MISSING_FN' ? 'nosql' : 'err', msg: cloudErr(e) }; });
  }
  go(new SurvivalOverScene(run));
}

// ---------------- between fights: HP heal + next opponent ----------------
class SurvivalVSScene {
  constructor(run, cfg) { this.run = run; this.cfg = cfg; this.t = 0; this.r = {}; Music.play('menu'); if (run.wins) Sound.play('perfect'); }
  update() {
    this.t++;
    if (this.t === 20) { Sound.play('gong'); Sound.speak(`${CHARS[this.cfg.p2].name}`, 0.5, 0.95); }
    if (this.t > 30 && UI.back()) { Sound.play('menuBack'); survEnd(this.run, 'giveup'); return; }
    if (this.t >= 230 || (this.t > 35 && (UI.ok() || Mouse.clicked))) { Mouse.clicked = false; go(new SurvivalBattle(this.cfg)); }
  }
  draw(g) {
    const t = this.t, run = this.run, c = this.cfg, A = CHARS[c.p1], B = CHARS[c.p2], set = SURV_CFG[run.kind];
    drawMenuBG(g, t, c.boss ? '#a020ff' : '#ff2a55');
    drawTitleText(g, set.name, W / 2, 70, 60, '#ffd84a', c.boss ? '#a020ff' : '#ff2a3a');
    g.font = `700 18px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#ffb3c6';
    g.fillText(run.kind === 'boss' ? `${set.jp} — BOSS ${run.wins + 1} / ${run.order.length}` : `${set.jp} — ${run.wins} WINS · NEXT: BATTLE ${run.wins + 1}`, W / 2, 112);
    const [v1, v2] = cfgVariants(c);
    for (const [ch, v, x, f, tag] of [[A, v1, 300, 1, 'YOU'], [B, v2, W - 300, -1, c.boss ? 'BOSS' : 'NEXT']]) {
      const pose = idlePose(ch, t);
      artFigure(g, x, 600, 1.7, g => withVarPal([[ch, v]], () => withArt([varFn(ch, v)], () => {
        if (tag === 'BOSS') { g.save(); g.shadowColor = '#a020ff'; g.shadowBlur = 40; g.globalAlpha = 0.6; drawFigure(g, ch, pose, x, 600, f, { mono: '#a020ff', scale: 1.74 }); g.restore(); }
        drawFigure(g, ch, pose, x, 600, f, { scale: 1.7, T: t, ropes: this.r[ch.id] || (this.r[ch.id] = {}), glow: tag === 'BOSS', expr: tag === 'BOSS' ? 'grin' : 'normal' });
      })));
      g.font = `italic 900 20px ${FONT_T}`; g.textAlign = 'center'; strokeText(g, tag, x, 160, tag === 'BOSS' ? '#e0b0ff' : tag === 'YOU' ? P_COL[1] : P_COL[2], OUTLINE, 4);
      drawTitleText(g, ch.name, x, 640, 40, '#ffffff', ch.colors.accent);
    }
    // HP carried over (+ heal animation)
    const bx = 120, by = 214, bw = 320, k = clamp((t - 25) / 50, 0, 1), before = run.wins ? run.prevHp : run.hp, now = before + (run.hp - before) * k;
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(bx, by - 14, bw, 14);
    g.fillStyle = '#7affc0'; g.fillRect(bx, by - 14, bw * now, 14); g.fillStyle = '#ffd84a'; g.fillRect(bx, by - 14, bw * before, 14);
    g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.strokeRect(bx, by - 14, bw, 14);
    g.font = `800 14px ${FONT_UI}`; g.textAlign = 'left'; g.fillStyle = '#fff'; g.fillText(`HP ${Math.round(now * 100)}%` + (run.wins && run.healed ? `   +${Math.round(run.healed * 100)}% HEAL${run.perfect ? ' (PERFECT!)' : ''}` : ''), bx, by - 22);
    if (c.boss) { g.textAlign = 'right'; g.fillStyle = '#e0b0ff'; g.fillText(`BOSS: HP ×${c.hpMul} · DAMAGE ×${c.dmgMul} · HARD`, W - 120, by - 22); }
    else { g.textAlign = 'right'; g.fillStyle = CPU_LEVELS[c.cpu.level].color; g.fillText(`CPU ${CPU_LEVELS[c.cpu.level].name}${c.hpMul > 1 ? ` · HP ×${c.hpMul.toFixed(2)}` : ''}`, W - 120, by - 22); }
    g.save(); g.translate(W / 2, 380); g.rotate(-0.06); drawTitleText(g, 'VS', 0, 0, 120, '#ffffff', '#ff2a3a'); g.restore();
    g.font = `800 16px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = '#fff';
    g.fillText(`TIME ${survFmt(run.frames)}   ·   XP SO FAR +${run.xp}`, W / 2, 470);
    drawFooter(g, 'F / ENTER / tap: fight   ·   ESC: give up (your score counts)');
  }
}

// ---------------- end of run ----------------
class SurvivalOverScene {
  constructor(run) {
    this.run = run; this.t = 0; this.ropes = {};
    this.menu = new MenuList([{ id: 'again', label: 'TRY AGAIN', jp: '再挑戦' }, { id: 'board', label: 'LEADERBOARD', jp: 'ランキング' }, { id: 'select', label: 'CHARACTER SELECT', jp: 'キャラ選択' }, { id: 'menu', label: 'MAIN MENU', jp: 'メニュー' }], 960, 440, { w: 420, h: 48, gap: 10 });
    Music.play('results'); Sound.play(run.why === 'clear' ? 'victory' : 'defeat');
  }
  update() {
    this.t++; if (this.t < 30) return;
    if (UI.back()) { go(new SurvivalMenuScene()); return; }
    const it = this.menu.update(); if (!it) return;
    Sound.play('menuOk');
    const r = this.run;
    if (it.id === 'again') go(survStart(r.kind, r.p1));
    if (it.id === 'board') go(new SurvivalBoardScene(r.kind));
    if (it.id === 'select') go(new CharSelectScene('versus', survSelectCpu(r.kind)));
    if (it.id === 'menu') go(new TitleScene());
  }
  draw(g) {
    const t = this.t, run = this.run, ch = CHARS[run.p1], c = ch.colors.accent, set = SURV_CFG[run.kind], clear = run.why === 'clear';
    drawMenuBG(g, t, c);
    const v = run.cfg ? cfgVariants(run.cfg)[0] : 0, pose = buildPose(ch, clear ? 'victory' : 'idle');
    artFigure(g, 300, 720, 2.2, g => withVarPal([[ch, v]], () => withArt([varFn(ch, v)], () => drawFigure(g, ch, pose, 300, 720, 1, { scale: 2.2, T: t, ropes: this.ropes, glow: clear, expr: clear ? 'grin' : 'closed' }))));
    drawTitleText(g, clear ? 'BOSS RUSH CLEAR!' : run.why === 'giveup' ? 'RUN OVER' : 'GAME OVER', 960, 76, clear ? 60 : 70, clear ? '#7affc0' : '#ffd84a', clear ? '#18a85a' : '#ff2a3a');
    g.font = `700 18px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#ffb3c6'; g.fillText(`${set.jp} · ${set.name} · ${ch.name}`, 960, 120);
    const x = 690, y = 140, w = 540;
    panel(g, x, y, w, 270);
    g.font = `italic 900 54px ${FONT_T}`; g.textAlign = 'center';
    strokeText(g, run.kind === 'boss' ? `${run.score} / ${run.order.length} BOSSES` : `${run.score} WIN${run.score === 1 ? '' : 'S'}`, x + w / 2, y + 62, '#ffffff', OUTLINE, 5);
    if (run.record) { g.save(); g.translate(x + w - 70, y + 22); g.rotate(0.12); g.font = `italic 900 22px ${FONT_T}`; strokeText(g, 'NEW RECORD!', 0, 0, '#7affc0', OUTLINE, 4); g.restore(); }
    const best = SurvBest.get(run.kind);
    const rows = [['Time', survFmt(run.frames)], ['Damage dealt', Math.round(run.dmg)], ['Perfect fights', run.perfects], ['Your best', best ? `${best.score} · ${survFmt(best.frames)} · ${(chById(best.ch) || { name: '?' }).name}` : '—']];
    rows.forEach(([n, val], i) => {
      const yy = y + 104 + i * 26;
      g.textAlign = 'left'; g.font = `600 16px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.fillText(n, x + 40, yy);
      g.textAlign = 'right'; g.font = `800 16px ${FONT_UI}`; g.fillStyle = '#fff'; g.fillText(String(val), x + w - 40, yy);
    });
    // online + XP
    const o = run.online; let line = '', col = '#cfc4ee';
    if (!o) line = run.score > 0 ? (typeof Cloud !== 'undefined' && Cloud.on ? '' : 'Log in (ACCOUNT on the title screen) to post your score online.') : '';
    else if (o.st === 'send') line = 'Posting your score…';
    else if (o.st === 'ok') { line = `ONLINE RANK #${o.rank || '?'}` + (o.best ? `  ·  your online best ${o.best.score} (${survFmt(o.best.frames)})` : ''); col = '#ffd84a'; }
    else if (o.st === 'nosql') line = 'Online leaderboard not set up yet (run supabase_survival.sql).';
    else { line = o.msg || 'Could not post the score.'; col = '#ff8aa0'; }
    g.textAlign = 'center'; g.font = `800 15px ${FONT_UI}`; g.fillStyle = col; g.fillText(line, x + w / 2, y + 222);
    const X = run.xpRes;
    if (X) {
      g.fillStyle = '#7affc0'; g.font = `800 16px ${FONT_UI}`;
      g.fillText(`MASTERY +${X.gained} XP` + (X.after.lv > X.before.lv ? `  ·  LEVEL UP → LV ${X.after.lv}` : `  ·  LV ${X.after.lv}`) + (X.unlocks.length ? '  ·  NEW COLOR!' : ''), x + w / 2, y + 250);
    }
    this.menu.draw(g, t);
    drawFooter(g, '↑/↓ + ENTER / F   ·   mouse / tap   ·   ESC: back');
  }
}

// ---------------- menu: SURVIVAL / BOSS RUSH / LEADERBOARD ----------------
function survSelectCpu(kind) { return { level: kind === 'boss' ? 2 : 0, arcade: true, surv: kind, label: SURV_CFG[kind].name, sideText: kind === 'boss' ? `${SURV_CFG.boss.n} BOSSES` : 'ENDLESS' }; }
class SurvivalMenuScene {
  constructor() {
    this.t = 0; Music.play('menu');
    this.menu = new MenuList([{ id: 'survival', label: 'SURVIVAL', jp: 'サバイバル' }, { id: 'boss', label: 'BOSS RUSH', jp: 'ボスラッシュ' }, { id: 'board', label: 'LEADERBOARD', jp: 'ランキング' }, { id: 'back', label: 'BACK', jp: '戻る' }], 420, 250, { w: 460, h: 56, gap: 14 });
  }
  update() {
    this.t++;
    if (UI.back()) { Sound.play('menuBack'); go(new CpuSetupScene()); return; }
    const it = this.menu.update(); if (!it) return;
    Sound.play('menuOk');
    if (it.id === 'survival' || it.id === 'boss') go(new CharSelectScene('versus', survSelectCpu(it.id)));
    if (it.id === 'board') go(new SurvivalBoardScene('survival'));
    if (it.id === 'back') go(new CpuSetupScene());
  }
  draw(g) {
    const t = this.t;
    drawMenuBG(g, t, '#a020ff');
    drawTitleText(g, 'SURVIVAL · BOSS RUSH', W / 2, 90, 64, '#ffd84a', '#a020ff');
    g.font = `700 20px ${FONT_JP}`; g.textAlign = 'center'; g.fillStyle = '#e0b0ff'; g.fillText('サバイバル ・ ボスラッシュ', W / 2, 150);
    this.menu.draw(g, t);
    const it = this.menu.items[this.menu.sel], k = it.id === 'boss' ? 'boss' : 'survival';
    const x = 700, y = 240, w = 520;
    panel(g, x, y, w, 300);
    g.textAlign = 'left'; g.font = `italic 900 30px ${FONT_T}`; strokeText(g, SURV_CFG[k].name, x + 34, y + 46, '#ffd84a', OUTLINE, 4);
    g.font = `500 16px ${FONT_UI}`; g.fillStyle = '#e8e0ff'; wrapText(g, SURV_CFG[k].desc, x + 34, y + 84, w - 68, 22);
    const rules = k === 'boss' ? [`Bosses: HP ×${SURV_CFG.boss.hpMul}, damage ×${SURV_CFG.boss.dmgMul}, CPU HARD`, `Heal ${SURV_CFG.boss.heal * 100}% after each boss (+${SURV_CFG.boss.perfect * 100}% perfect)`, 'Mastery XP per boss, +300 XP for the clear']
      : [`Heal ${SURV_CFG.survival.heal * 100}% after each win (+${SURV_CFG.survival.perfect * 100}% if perfect)`, 'CPU: EASY → NORMAL (3 wins) → HARD (8 wins)', `Every ${SURV_CFG.survival.bossEvery}th fight is a BOSS · Mastery XP per win`];
    g.font = `600 15px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; rules.forEach((r, i) => g.fillText('• ' + r, x + 34, y + 160 + i * 24));
    const b = SurvBest.get(k);
    g.font = `800 17px ${FONT_UI}`; g.fillStyle = '#7affc0';
    g.fillText(b ? `YOUR BEST: ${b.score} ${k === 'boss' ? 'BOSSES' : 'WINS'} · ${survFmt(b.frames)} · ${(chById(b.ch) || { name: '?' }).name}` : 'YOUR BEST: —', x + 34, y + 270);
    drawFooter(g, '↑/↓ choose  ·  F / ENTER / tap confirm  ·  ESC back');
  }
}

class SurvivalBoardScene {
  constructor(mode) { this.t = 0; this.mode = mode || 'survival'; this.rows = {}; this.err = {}; this.load(); Music.play('menu'); }
  load() {
    const m = this.mode; if (this.rows[m] || this.err[m] === 'busy') return;
    if (typeof Cloud === 'undefined' || !Cloud.enabled()) { this.err[m] = 'Online leaderboard not available.'; return; }
    this.err[m] = 'busy';
    SurvCloud.top(m, 50).then(r => { this.rows[m] = r || []; this.err[m] = ''; })
      .catch(e => { this.err[m] = e.message === 'MISSING_FN' ? 'Online leaderboard not set up yet (Beni: run cloud/supabase_survival.sql in Supabase).' : cloudErr(e); });
  }
  tabs() { return [['survival', { x: W / 2 - 250, y: 128, w: 240, h: 42 }], ['boss', { x: W / 2 + 10, y: 128, w: 240, h: 42 }]]; }
  backRect() { return { x: W / 2 - 110, y: 640, w: 220, h: 44 }; }
  update() {
    this.t++;
    if (UI.back() || (Mouse.clicked && inRect(this.backRect()))) { Mouse.clicked = false; Sound.play('menuBack'); go(new SurvivalMenuScene()); return; }
    let m = this.mode;
    if (UI.left() || UI.right() || pressedAny('ArrowLeft', 'ArrowRight')) m = m === 'survival' ? 'boss' : 'survival';
    for (const [k, r] of this.tabs()) if (Mouse.clicked && inRect(r)) { m = k; Mouse.clicked = false; }
    if (m !== this.mode) { this.mode = m; Sound.play('menuMove'); this.load(); }
  }
  draw(g) {
    const t = this.t, m = this.mode;
    drawMenuBG(g, t, '#a020ff');
    drawTitleText(g, 'LEADERBOARD', W / 2, 70, 58, '#ffd84a', '#a020ff');
    for (const [k, r] of this.tabs()) drawButton(g, r, SURV_CFG[k].name, null, k === m, t);
    const x = W / 2 - 400, y = 186, w = 800;
    panel(g, x, y, w, 440);
    const rows = this.rows[m], err = this.err[m];
    g.textBaseline = 'alphabetic';
    if (!rows) { g.textAlign = 'center'; g.font = `700 18px ${FONT_UI}`; g.fillStyle = err && err !== 'busy' ? '#ff8aa0' : '#cfc4ee'; wrapText(g, err && err !== 'busy' ? err : 'Loading…', x + 60, y + 60, w - 120, 24); }
    else {
      g.font = `800 13px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.textAlign = 'left';
      g.fillText('#', x + 40, y + 30); g.fillText('PLAYER', x + 90, y + 30); g.fillText('FIGHTER', x + 380, y + 30);
      g.textAlign = 'right'; g.fillText(m === 'boss' ? 'BOSSES' : 'WINS', x + 640, y + 30); g.fillText('TIME', x + w - 40, y + 30);
      if (!rows.length) { g.textAlign = 'center'; g.font = `700 18px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.fillText('No scores yet — be the first!', x + w / 2, y + 90); }
      rows.slice(0, 15).forEach((r, i) => {
        const yy = y + 60 + i * 25, me = typeof Cloud !== 'undefined' && Cloud.name && r.name && r.name.toLowerCase() === Cloud.name.toLowerCase();
        g.font = `800 16px ${FONT_UI}`; g.fillStyle = me ? '#7affc0' : i === 0 ? '#ffd84a' : '#ffffff';
        g.textAlign = 'left'; g.fillText(String(i + 1), x + 40, yy); g.fillText(r.name, x + 90, yy); g.fillText((chById(r.ch) || { name: r.ch }).name, x + 380, yy);
        g.textAlign = 'right'; g.fillText(String(r.score), x + 640, yy); g.fillText(survFmt(r.frames), x + w - 40, yy);
      });
    }
    const b = SurvBest.get(m);
    g.textAlign = 'center'; g.font = `800 16px ${FONT_UI}`; g.fillStyle = '#7affc0';
    g.fillText(b ? `YOUR BEST ON THIS DEVICE: ${b.score} · ${survFmt(b.frames)} · ${(chById(b.ch) || { name: '?' }).name}` : 'YOUR BEST ON THIS DEVICE: —', W / 2, y + 420);
    drawButton(g, this.backRect(), 'BACK', null, inRect(this.backRect()), t);
    drawFooter(g, '←/→ or tap: SURVIVAL / BOSS RUSH   ·   ESC: back');
  }
}

// ---------------- 1P VS CPU menu entry ----------------
{
  const CP = CpuSetupScene.prototype, cu = CP.update;
  CP.update = function () {
    const items = this.menu.items;
    if (!items.some(i => i.id === 'surv')) {
      const bi = items.findIndex(i => i.id === 'back');
      items.splice(bi < 0 ? items.length : bi, 0, { id: 'surv', label: 'SURVIVAL · BOSS RUSH', jp: '挑戦' });
      this.menu.h = 46; this.menu.gap = 10;
    }
    const it = items[this.menu.sel];
    if (it && it.id === 'surv' && (UI.ok() || (Mouse.clicked && inRect(this.menu.rect(this.menu.sel))))) { Sound.play('menuOk'); Mouse.clicked = false; go(new SurvivalMenuScene()); return; }
    return cu.call(this);
  };
}
