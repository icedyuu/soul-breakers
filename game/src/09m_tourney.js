// ===================== TOURNAMENT (title → FIGHT ◀ TOURNAMENT ▶) =====================
// Local single-elimination bracket for 4–8 entrants on one device. Each entrant is a human (picks a
// fighter, plays with the 1P or 2P controls) or a CPU (random fighter, chosen difficulty).
// Human vs human: the upper slot plays with 1P controls, the lower with 2P. Human vs CPU: the human is P1.
// CPU vs CPU: WATCH (two bots fight) or QUICK (instant random result). Matches are normal best-of-3
// battles (recorded as replays like any versus match), no mastery XP (like local versus).
// Byes for 5–7 entrants. The running tournament stays in memory (TOURNEY) so MAIN MENU can be left
// and the setup screen offers CONTINUE.
let TOURNEY = null, TOURNEY_PICK = false;
const TN_CFG = { n: 4, humans: 2, level: 1, watch: false };
try { Object.assign(TN_CFG, JSON.parse(localStorage.getItem('sb_tourney_cfg')) || {}); } catch (e) { }
const TN_SEED = { 4: [0, 3, 1, 2], 8: [0, 7, 3, 4, 1, 6, 2, 5] };

function tnNew(cfg, picks) {
  const n = clamp(cfg.n | 0, 4, 8), size = n <= 4 ? 4 : 8, ents = [];
  for (let i = 0; i < n; i++) {
    const human = i < cfg.humans;
    ents.push({ i, human, name: human ? `PLAYER ${i + 1}` : `CPU ${i + 1 - cfg.humans}`, ch: human ? picks[i] : Math.floor(Math.random() * CHARS.length), v: 0 });
    if (human) ents[i].v = Mastery.pick(CHARS[ents[i].ch].id);
  }
  const order = shuffleArr(ents.slice());   // random draw
  const slots = new Array(size).fill(null);
  order.forEach((e, k) => { slots[TN_SEED[size][k]] = e.i; });   // the first draws get the byes
  const rounds = [], R = Math.log2(size);
  for (let r = 0; r < R; r++) { const m = []; for (let k = 0; k < size >> (r + 1); k++) m.push({ a: r ? undefined : slots[2 * k], b: r ? undefined : slots[2 * k + 1], w: undefined }); rounds.push(m); }
  const T = { cfg: { ...cfg, n }, ents, rounds, size, champ: null, log: [] };
  tnAdvance(T);
  return T;
}
const tnName = (T, i) => i == null ? 'BYE' : T.ents[i].name;
function tnRoundName(T, r) { const left = T.rounds.length - r; return left === 1 ? 'FINAL' : left === 2 ? 'SEMIFINAL' : 'QUARTERFINAL'; }
// resolve byes, move winners up
function tnAdvance(T) {
  for (let r = 0; r < T.rounds.length; r++) for (let k = 0; k < T.rounds[r].length; k++) {
    const m = T.rounds[r][k];
    if (m.w === undefined && m.a !== undefined && m.b !== undefined && (m.a === null || m.b === null)) m.w = m.a === null ? m.b : m.a;   // bye (or empty)
    if (m.w !== undefined && r + 1 < T.rounds.length) { const nx = T.rounds[r + 1][k >> 1]; if (k % 2) nx.b = m.w; else nx.a = m.w; }
  }
  const fin = T.rounds[T.rounds.length - 1][0]; T.champ = fin.w === undefined ? null : fin.w;
}
function tnNext(T) {
  for (let r = 0; r < T.rounds.length; r++) for (let k = 0; k < T.rounds[r].length; k++) { const m = T.rounds[r][k]; if (m.w === undefined && m.a != null && m.b != null) return { r, k, m }; }
  return null;
}
function tnSetWinner(T, nx, w) { nx.m.w = w; T.log.push({ r: nx.r, a: nx.m.a, b: nx.m.b, w }); tnAdvance(T); }
function tnMatchCfg(T, nx) {
  let A = T.ents[nx.m.a], B = T.ents[nx.m.b];
  if (!A.human && B.human) [A, B] = [B, A];   // the human is P1 against a CPU
  const cfg = { mode: 'versus', p1: A.ch, p2: B.ch, stage: Math.floor(Math.random() * STAGES.length), v1: A.v, v2: B.v, tn: { a: A.i, b: B.i } };
  if (!B.human) cfg.cpu = { level: T.cfg.level };
  if (!A.human) cfg.cpu2 = T.cfg.level;   // both CPU: a second bot drives P1
  if (T.rounds.length - nx.r === 1 && typeof BOSS_STAGE !== 'undefined' && BOSS_STAGE >= 0) cfg.stage = BOSS_STAGE;   // the final in the boss arena
  return cfg;
}

class TourneyBattle extends Battle {
  constructor(cfg) {
    super(cfg);
    if (cfg.cpu2 !== undefined) {
      this.touch = null;
      const b1 = new CpuBot(this, cfg.cpu2, 0), c = this.cpu, t = c.tick.bind(c);
      c.tick = () => { b1.tick(); t(); };
    }
    this.names = [tnName(TOURNEY, cfg.tn.a), tnName(TOURNEY, cfg.tn.b)];
  }
  update() {
    super.update();
    if (this.paused && this.pauseMenu && !this.pauseMenu.tnFix) {
      const m = this.pauseMenu; m.tnFix = true;
      m.items = m.items.filter(i => i.id !== 'restart').map(i => i.id === 'select' ? { id: 'tnback', label: 'BACK TO BRACKET', jp: '組合せ' } : i);
      const u = m.update.bind(m);
      m.update = () => { const it = u(); if (it && it.id === 'tnback') { this.paused = false; Sound.play('menuOk'); go(new TourneyBracketScene()); return null; } return it; };
    }
  }
  updateRoundEnd() {
    if (this.quote) this.quote.t++;
    if (this.pf === 60 && this.winner) Sound.play('defeat');
    if (this.pf >= 210 || (this.pf > 60 && UI.ok())) {
      this.quote = null; this.timeOut = false;
      if (this.wins[0] >= 2 || this.wins[1] >= 2) {
        this.phase = 'matchEnd';
        const T = TOURNEY, nx = T && tnNext(T), w = this.wins[0] >= 2 ? this.cfg.tn.a : this.cfg.tn.b;
        if (nx && ((nx.m.a === this.cfg.tn.a && nx.m.b === this.cfg.tn.b) || (nx.m.a === this.cfg.tn.b && nx.m.b === this.cfg.tn.a))) tnSetWinner(T, nx, w);
        go(T && T.champ != null ? new TourneyChampScene() : new TourneyBracketScene({ last: w }));
      } else this.newRound(false);
    }
  }
  draw(g) {
    super.draw(g);
    if (this.paused || !TOURNEY) return;
    const nx = tnNext(TOURNEY), rn = nx ? tnRoundName(TOURNEY, nx.r) : '';
    g.save(); g.textBaseline = 'middle'; g.font = `italic 900 15px ${FONT_T}`;
    g.textAlign = 'left'; strokeText(g, this.names[0], 30, 150, P_COL[1], OUTLINE, 3);
    g.textAlign = 'right'; strokeText(g, this.names[1], W - 30, 150, P_COL[2], OUTLINE, 3);
    g.textAlign = 'center'; strokeText(g, 'TOURNAMENT · ' + rn, W / 2, 112, '#ffd84a', OUTLINE, 3);
    g.restore();
  }
}
class TourneyVSScene extends VSScene {
  update() {
    this.t++;
    if (this.t === 26) { Sound.play('impactBig'); Sound.play('slam'); }
    if (this.t >= 175 || (this.t > 30 && UI.ok())) go(new TourneyBattle(this.cfg));
  }
}

// ---------------- setup ----------------
class TourneySetupScene {
  constructor() {
    this.t = 0; Music.play('menu');
    const items = [];
    if (TOURNEY && TOURNEY.champ == null) items.push({ id: 'cont', label: 'CONTINUE TOURNAMENT', jp: '続ける' });
    items.push({ id: 'n', label: 'ENTRANTS', type: 'choice' }, { id: 'humans', label: 'HUMAN PLAYERS', type: 'choice' }, { id: 'level', label: 'CPU LEVEL', type: 'choice' }, { id: 'watch', label: 'CPU VS CPU', type: 'choice' },
      { id: 'start', label: 'START NEW TOURNAMENT', jp: '開始' }, { id: 'back', label: 'BACK', jp: '戻る' });
    this.menu = new MenuList(items, W / 2, 210, { w: 560, h: 48, gap: 10 });
  }
  val() {
    const c = TN_CFG; c.humans = clamp(c.humans, 0, c.n);
    for (const it of this.menu.items) {
      if (it.id === 'n') it.value = `◀  ${c.n}  ▶`;
      if (it.id === 'humans') it.value = `◀  ${c.humans}  ▶`;
      if (it.id === 'level') it.value = `◀  ${CPU_LEVELS[c.level].name}  ▶`;
      if (it.id === 'watch') it.value = c.watch ? '◀  WATCH  ▶' : '◀  QUICK RESULT  ▶';
    }
  }
  change(id, d) {
    const c = TN_CFG;
    if (id === 'n') c.n = clamp(c.n + d, 4, 8);
    else if (id === 'humans') c.humans = (c.humans + d + c.n + 1) % (c.n + 1);
    else if (id === 'level') c.level = (c.level + d + CPU_LEVELS.length) % CPU_LEVELS.length;
    else if (id === 'watch') c.watch = !c.watch;
    else return false;
    try { localStorage.setItem('sb_tourney_cfg', JSON.stringify(c)); } catch (e) { }
    Sound.play('menuMove'); this.val(); return true;
  }
  update() {
    this.t++; this.val();
    if (UI.back()) { Sound.play('menuBack'); go(new TitleScene()); return; }
    const cur = this.menu.items[this.menu.sel];
    if (UI.left() || pressedAny(B(2, 'left'))) { if (this.change(cur.id, -1)) return; }
    if (UI.right() || pressedAny(B(2, 'right'))) { if (this.change(cur.id, 1)) return; }
    const it = this.menu.update(); if (!it) return;
    if (this.change(it.id, 1)) return;
    Sound.play('menuOk');
    if (it.id === 'cont') go(new TourneyBracketScene());
    if (it.id === 'back') go(new TitleScene());
    if (it.id === 'start') { const cfg = { ...TN_CFG }; if (cfg.humans) go(tnPickScene(cfg, [], 0)); else { TOURNEY = tnNew(cfg, []); go(new TourneyBracketScene()); } }
  }
  draw(g) {
    const t = this.t, c = TN_CFG; this.val();
    drawMenuBG(g, t, '#ffd84a');
    drawTitleText(g, 'TOURNAMENT', W / 2, 90, 76, '#ffd84a', '#ff2a3a');
    g.font = `700 20px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#ffb3c6'; g.fillText('トーナメント — 4〜8人', W / 2, 150);
    this.menu.draw(g, t);
    g.font = `600 15px ${FONT_UI}`; g.fillStyle = '#e8dcff';
    g.fillText(`${c.humans} human${c.humans === 1 ? '' : 's'} pick a fighter, ${c.n - c.humans} CPU${c.n - c.humans === 1 ? '' : 's'} get a random one · random draw · single elimination, best of 3${c.n & (c.n - 1) ? ' · byes for some' : ''}`, W / 2, 640);
    g.fillText('Human vs human: upper name uses 1P controls, lower name 2P controls. Human vs CPU: you are 1P.', W / 2, 664);
    drawFooter(g, '↑/↓ choose  ·  ←/→ change  ·  F / ENTER / tap confirm  ·  ESC back');
  }
}
function tnPickScene(cfg, picks, k) { const s = new CharSelectScene('tournament'); s.tnPick = { cfg, picks, k }; return s; }
{
  const P = CharSelectScene.prototype, up = P.update, ds = P.drawSide;
  P.update = function () {
    const tp = this.tnPick; if (!tp) return up.call(this);
    if (this.ready[0]) {
      if (++this.readyT > 35) {
        const picks = [...tp.picks, this.cur[0]];
        if (tp.k + 1 < tp.cfg.humans) go(tnPickScene(tp.cfg, picks, tp.k + 1));
        else { TOURNEY = tnNew(tp.cfg, picks); go(new TourneyBracketScene()); }
      }
      return;
    }
    if (UI.back() && !this.ready[0]) { Sound.play('menuBack'); go(tp.k ? tnPickScene(tp.cfg, tp.picks.slice(0, -1), tp.k - 1) : new TourneySetupScene()); return; }
    return up.call(this);
  };
  P.drawSide = function (g, s, t) {
    const tp = this.tnPick; if (!tp || s !== 1) return ds.call(this, g, s, t);
    const x = W - 34; g.textAlign = 'right'; g.textBaseline = 'alphabetic';
    g.font = `900 15px ${FONT_UI}`; g.fillStyle = P_COL[2]; g.fillText('TOURNAMENT', x, 140);
    g.font = `italic 900 30px ${FONT_T}`; strokeText(g, `PLAYER ${tp.k + 1} PICKS`, x, 190, '#ffd84a', OUTLINE, 4);
    g.font = `700 15px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.fillText(`${tp.k + 1} of ${tp.cfg.humans} humans · ${tp.cfg.n} entrants`, x, 218);
    tp.picks.forEach((ci, i) => { g.font = `italic 900 17px ${FONT_T}`; strokeText(g, `PLAYER ${i + 1}: ${CHARS[ci].name}`, x, 260 + i * 26, '#ffffff', OUTLINE, 3); });
  };
}

// ---------------- bracket ----------------
class TourneyBracketScene {
  constructor(o = {}) {
    this.t = 0; this.o = o; this.msg = o.last != null && TOURNEY ? `${tnName(TOURNEY, o.last)} WINS!` : ''; this.msgT = this.msg ? 150 : 0;
    this.menu = new MenuList([{ id: 'play', label: 'NEXT MATCH', jp: '次の試合' }, { id: 'quit', label: 'MAIN MENU', jp: 'メニュー' }], W / 2, 650, { w: 300, h: 44, gap: 8 });
    this.menu.rect = function (i) { return { x: W / 2 - 310 + i * 320, y: this.y, w: this.w, h: this.h }; };
    Music.play('menu');
  }
  update() {
    this.t++; if (this.msgT > 0) this.msgT--;
    const T = TOURNEY; if (!T) { go(new TourneySetupScene()); return; }
    if (T.champ != null) { go(new TourneyChampScene()); return; }
    if (UI.back()) { Sound.play('menuBack'); go(new TitleScene()); return; }
    if (UI.left() || UI.right()) { this.menu.sel = 1 - this.menu.sel; Sound.play('menuMove'); }
    const it = this.menu.update(); if (!it) return;
    Sound.play('menuOk');
    if (it.id === 'quit') { go(new TitleScene()); return; }
    const nx = tnNext(T); if (!nx) return;
    const A = T.ents[nx.m.a], Bq = T.ents[nx.m.b];
    if (!A.human && !Bq.human && !T.cfg.watch) {   // quick result
      const w = Math.random() < 0.5 ? nx.m.a : nx.m.b; tnSetWinner(T, nx, w);
      this.msg = `${tnName(T, w)} BEATS ${tnName(T, w === nx.m.a ? nx.m.b : nx.m.a)} (QUICK RESULT)`; this.msgT = 150; Sound.play('impactBig');
      if (T.champ != null) go(new TourneyChampScene());
      return;
    }
    go(new TourneyVSScene(tnMatchCfg(T, nx)));
  }
  slotRect(r, k) {
    const T = TOURNEY, R = T.rounds.length, colW = R === 3 ? 300 : 360, x0 = R === 3 ? 60 : 160, top = 150, bot = 600;
    const n = T.size >> r, h = (bot - top) / n, y = top + h * (k + 0.5);
    return { x: x0 + r * colW, y: y - 19, w: 230, h: 38 };
  }
  drawEntrant(g, i, x, y, w, h, st) {
    const T = TOURNEY;
    g.fillStyle = st === 'win' ? 'rgba(24,168,90,0.35)' : st === 'out' ? 'rgba(20,10,30,0.7)' : 'rgba(14,8,30,0.85)'; g.fillRect(x, y, w, h);
    g.strokeStyle = st === 'next' ? '#ffd84a' : 'rgba(255,255,255,0.25)'; g.lineWidth = st === 'next' ? 2.5 : 1; g.strokeRect(x, y, w, h);
    g.textBaseline = 'middle'; g.textAlign = 'left';
    if (i == null) { g.font = `italic 800 14px ${FONT_UI}`; g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillText(i === null ? 'BYE' : '—', x + 12, y + h / 2); return; }
    const e = T.ents[i], ch = CHARS[e.ch], pt = ch.portrait, k = pt.width / 300, sw = 150 * k;
    g.save(); g.globalAlpha = st === 'out' ? 0.4 : 1; g.drawImage(pt, 126 * k - sw / 2, 120 * k - sw * 0.42, sw, sw, x + 2, y + 2, h - 4, h - 4); g.restore();
    g.font = `italic 900 14px ${FONT_T}`; g.fillStyle = st === 'out' ? 'rgba(255,255,255,0.4)' : e.human ? '#ffffff' : '#cfc4ee'; g.fillText(e.name, x + h + 6, y + 12, w - h - 10);
    g.font = `700 11px ${FONT_UI}`; g.fillStyle = st === 'out' ? 'rgba(255,255,255,0.3)' : ch.colors.accent; g.fillText(ch.name, x + h + 6, y + 27, w - h - 10);
  }
  draw(g) {
    const t = this.t, T = TOURNEY; if (!T) return;
    drawMenuBG(g, t, '#ffd84a');
    drawTitleText(g, 'TOURNAMENT', W / 2, 56, 52, '#ffd84a', '#ff2a3a');
    const nx = tnNext(T);
    g.font = `700 17px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#ffb3c6';
    g.fillText(nx ? `NEXT: ${tnRoundName(T, nx.r)} — ${tnName(T, nx.m.a)} vs ${tnName(T, nx.m.b)}` : '', W / 2, 100);
    if (nx) { const a = T.ents[nx.m.a], b = T.ents[nx.m.b]; g.font = `600 14px ${FONT_UI}`; g.fillStyle = '#e8dcff';
      g.fillText(a.human && b.human ? `${a.name}: 1P controls  ·  ${b.name}: 2P controls` : a.human || b.human ? `${(a.human ? a : b).name} plays with the 1P controls` : T.cfg.watch ? 'CPU vs CPU — watch the fight' : 'CPU vs CPU — quick result', W / 2, 124); }
    // round headers + lines + slots
    for (let r = 0; r < T.rounds.length; r++) {
      const r0 = this.slotRect(r, 0); g.font = `italic 900 14px ${FONT_T}`; g.textAlign = 'center'; strokeText(g, tnRoundName(T, r), r0.x + r0.w / 2, 140, '#ffd84a', OUTLINE, 3);
      T.rounds[r].forEach((m, k) => {
        const ra = this.slotRect(r, 0), isNext = nx && nx.r === r && nx.k === k;
        const A = { x: ra.x, y: this.matchY(r, k, 0), w: ra.w, h: 38 }, Bs = { x: ra.x, y: this.matchY(r, k, 1), w: ra.w, h: 38 };
        g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 2;
        if (r + 1 < T.rounds.length) { const mx = A.x + A.w, my = (A.y + Bs.y + 38) / 2, nxR = this.slotRect(r + 1, 0); g.beginPath(); g.moveTo(mx, A.y + 19); g.lineTo(mx + 20, A.y + 19); g.lineTo(mx + 20, Bs.y + 19); g.lineTo(mx, Bs.y + 19); g.moveTo(mx + 20, my); g.lineTo(nxR.x, my); g.stroke(); }
        for (const [i, rc, side] of [[m.a, A, 'a'], [m.b, Bs, 'b']]) {
          const st = m.w === undefined ? (isNext ? 'next' : '') : m.w === i ? 'win' : 'out';
          this.drawEntrant(g, i, rc.x, rc.y, rc.w, rc.h, st);
        }
      });
    }
    // champion slot
    { const r = T.rounds.length - 1, A = this.matchY(r, 0, 0), Bs = this.matchY(r, 0, 1), x = this.slotRect(r, 0).x + 230 + 40, y = (A + Bs + 38) / 2;
      g.font = `italic 900 18px ${FONT_T}`; g.textAlign = 'left'; g.textBaseline = 'middle'; strokeText(g, '🏆 CHAMPION', Math.min(x, W - 200), y, '#ffd84a', OUTLINE, 4); }
    if (this.msgT > 0 && this.msg) { g.save(); g.globalAlpha = Math.min(1, this.msgT / 30); g.font = `italic 900 30px ${FONT_T}`; g.textAlign = 'center'; strokeText(g, this.msg, W / 2, 616, '#7affc0', OUTLINE, 5); g.restore(); }
    this.menu.draw(g, t);
    drawFooter(g, 'F / ENTER / tap: next match  ·  ESC: main menu (the tournament is kept)');
  }
  matchY(r, k, side) {   // y of the two entrants of match k in round r
    const top = 150, bot = 600, n = TOURNEY.rounds[r].length, h = (bot - top) / n, cy = top + h * (k + 0.5);
    return side ? cy + 3 : cy - 41;
  }
}

class TourneyChampScene {
  constructor() {
    this.t = 0; this.ropes = {};
    this.menu = new MenuList([{ id: 'again', label: 'NEW TOURNAMENT', jp: '新大会' }, { id: 'menu', label: 'MAIN MENU', jp: 'メニュー' }], 960, 520, { w: 420, h: 50 });
    Music.play('results'); Sound.play('victory');
  }
  update() {
    this.t++; if (this.t < 40) return;
    const it = this.menu.update(); if (!it) return;
    Sound.play('menuOk'); TOURNEY = null;
    go(it.id === 'again' ? new TourneySetupScene() : new TitleScene());
  }
  draw(g) {
    const t = this.t, T = TOURNEY; if (!T || T.champ == null) return;
    const e = T.ents[T.champ], ch = CHARS[e.ch], c = ch.colors.accent;
    drawMenuBG(g, t, c);
    artFigure(g, 330, 720, 2.3, g => withVarPal([[ch, e.v]], () => withArt([varFn(ch, e.v)], () => drawFigure(g, ch, buildPose(ch, 'victory'), 330, 720, 1, { scale: 2.3, T: t, ropes: this.ropes, glow: true, expr: 'grin' }))));
    drawTitleText(g, 'CHAMPION', 960, 100, 90, '#ffd84a', '#ff2a3a');
    drawTitleText(g, e.name, 960, 190, 56, '#ffffff', c);
    g.font = `italic 800 20px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = c; g.fillText(`${ch.name} · ${ch.title}`, 960, 236);
    // final + semifinal losers
    const R = T.rounds.length, fin = T.rounds[R - 1][0], second = fin.a === T.champ ? fin.b : fin.a;
    g.font = `800 18px ${FONT_UI}`; g.fillStyle = '#e8dcff';
    g.fillText(`2nd: ${tnName(T, second)} (${CHARS[T.ents[second].ch].name})`, 960, 300);
    if (R > 1) { const semis = T.rounds[R - 2].map(m => m.w === m.a ? m.b : m.a).filter(i => i != null); g.fillText(`3rd: ${semis.map(i => tnName(T, i)).join(' & ')}`, 960, 330); }
    g.font = `600 15px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.fillText(`${T.ents.length} entrants · ${T.log.length} matches`, 960, 370);
    this.menu.draw(g, t);
    drawFooter(g, '↑/↓ + ENTER / tap');
  }
}

// ---------------- title: FIGHT ◀ 1 VS 1 / 2 VS 2 TAG / TOURNAMENT ▶ ----------------
{
  const TP = TitleScene.prototype, up = TP.update, tm = TP.tagMenu;
  TP.tagMenu = function () { const it = tm.call(this); if (it && TOURNEY_PICK) it.value = '◀ TOURNEY ▶'; return it; };
  TP.update = function () {
    const it = this.menu.items.find(i => i.id === 'fight');
    if (it && this.menu.items[this.menu.sel] === it) {
      const r = this.menu.rect(this.menu.items.indexOf(it)), onVal = Mouse.clicked && inRect(r) && Mouse.x > r.x + r.w * 0.55;
      const d = UI.left() ? -1 : UI.right() || onVal ? 1 : 0;
      if (d) {   // cycle 1 VS 1 → 2 VS 2 TAG → TOURNAMENT
        const s = (TOURNEY_PICK ? 2 : TAG_VS ? 1 : 0) + d, n = (s + 3) % 3;
        TAG_VS = n === 1; TOURNEY_PICK = n === 2; Sound.play('menuMove'); Mouse.clicked = false; this.tagMenu(); return;
      }
      if (TOURNEY_PICK && (UI.ok() || (Mouse.clicked && inRect(r)))) { Mouse.clicked = false; Sound.play('menuOk'); go(new TourneySetupScene()); return; }
    }
    return up.call(this);
  };
}
