// Verified combo list (pause menu → COMBO LIST). Generated from COMBOS.md + player guide (bot-verified 2026-11-26):
// sections [title, rows]; row = [tag, notation, dmg % of 1000 HP, hits (0 = n/a), note]
const COMBO_BOOK = {"kazuma":[["",[["EASY","L → M → H → SP1 (Blazing Knuckle)",24,4,"any range"],["MEDIUM","L → L → M → H → SP1 (Blazing Knuckle) → SP1 (Second Blaze)",28,6,""],["HARD","L → M → L+H → hold ↑ → L (air) → M (air) → H (air)",24,6,"not vs Borgar / Buzzu"],["SOUL","L → L → L → M → H → ↓→SP2 (Flame Cyclone) → SP1+SP2 (Hundred Inferno Fists)",53,20,""]]]],
"yoru":[["",[["EASY","L → M → H → ↓↓SP2 (Falling Moon)",22,4,""],["MEDIUM","L → L → M → H → SP2 (Shadow Step) → SP2 (Shadow Return)",24,6,""],["HARD","M → L+H → hold ↑ → M (air) → H (air)",20,4,"not vs Borgar / Buzzu"],["SOUL","M → H → SP2 (Shadow Step) → SP1+SP2 (Thousand Petal Dance)",61,15,"any range"]]]],
"sera":[["",[["EASY","L → M → H → ↓↓SP2 (Storm Call)",27,5,"any range"],["MEDIUM","L → L → M → H → ↓↓SP2 (Storm Call)",28,6,"any range"],["HARD","L → M → L+H → hold ↑ → L (air) → M (air) → H (air)",25,6,"not vs Borgar / Buzzu"],["SOUL","L → L → L → M → H → SP1+SP2 (Celestial Judgement)",35,15,""]]]],
"goro":[["",[["EASY","L → M → H → SP2 (Skybreaker)",24,4,"not vs Borgar · any range"],["MEDIUM","L → L → L → M → H → SP1 (Oni Charge) → SP2 (Oni Toss)",28,7,"not vs Borgar · any range"],["HARD","L → M → L+H → hold ↑ → L (air) → M (air) → H (air)",23,6,"not vs Borgar / Buzzu"]]]],
"frogs":[["",[["EASY","L → M → H → SP1 (Tongue Snare)",25,6,"any range"],["MEDIUM","L → L → L → M → H → SP1 (Tongue Snare)",27,8,""],["HARD","L → M → L+H → hold ↑ → L (air) → M (air) → H (air)",20,6,""],["SOUL","M → H → ↓→SP2 (Leapfrog) → SP1+SP2 (Swamp Apocalypse)",48,15,""]]]],
"conductor":[["",[["EASY","L → M → H → ↓→SP2 (Pantograph Spark)",19,4,""],["MEDIUM","L → L → M → H → SP2 (Express Delivery) → SP1 (Through Train)",22,6,"any range"],["HARD","L → M → L+H → hold ↑ → L (air) → M (air) → H (air)",20,6,"not vs Borgar / Buzzu"],["SOUL","L → L → M → H → ↓→SP2 (Pantograph Spark) → SP1+SP2 (The Final Express)",45,8,""]]]],
"cardmaster":[["ANY HAND",[["","L → L → L → M → H → ↓→SP1",21,0,""],["","L → M → L+H → hold ↑ → L → M → H (air)",21,0,"not vs Borgar / Buzzu"],["SOUL","L → L → L → M → H → SP1+SP2",53,0,""]]],["SHADOW BEAST IN HAND",[["","M → H → ↓→SP2",29,0,""],["","L → M → H → ↓→SP2",29,0,"any range"],["SOUL","M → H → ↓→SP2 → SP1+SP2",64,0,"strongest"]]],["DRAGON IN HAND",[["","H → ↓→SP2",28,19,""],["SOUL","L → L → L → M → H → ↓→SP2 → SP1+SP2",62,0,""]]],["2+ CREATURES (STAMPEDE)",[["","L → L → L → M → H → ↓←SP1",23,0,""]]],["2+ TRAPS (LOCKDOWN)",[["","L → L → L → M → H → ↓←SP1",21,0,""],["SOUL","L → L → M → H → ↓←SP1 → SP1+SP2",56,0,""]]]],
"nue":[["HUMAN FORM",[["EASY","L → M → H → ↓↓SP2 (Seal Drop)",19,4,""],["MEDIUM","L → L → L → M → H → ↓↓SP2 (Seal Drop)",20,6,""],["HARD","L → M → L+H → hold ↑ → L (air) → M (air) → H (air)",20,6,"not vs Borgar / Buzzu"],["SOUL","L → L → L → M → H → SP1 (Spirit Claw) → SP1+SP2 (Primal Ascension)",49,22,""]]],["FORM: THE DRAKE",[["","L → L → M → H → SP1 → SP2",31,0,""],["","L → M → H → SP2",29,0,""],["","M → H → SP1 → SP2",30,0,""]]],["FORM: PHANTOM WOLF",[["","L → L → L → M → H → ↓→SP1 → SP1",21,0,""],["","L → M → H → ↓→SP1 → SP1",20,0,""],["","L → L → L → M → H → SP1 → SP2",19,0,""]]],["FORM: ABYSSAL SERPENT",[["","L → M → L+H → hold ↑ → L → M → H (air)",23,0,""],["","L → L → L → M → H → ↓→SP1",22,0,""],["","L → M → H → ↓→SP1",21,0,""]]],["FORM: CELESTIAL STAG",[["","L → M → L+H → hold ↑ → L → M → H (air)",22,0,""],["","L → M → H → SP1",21,0,""],["","↓L → M → H → SP1",21,0,""]]],["FORM: NIGHTMARE RAVEN",[["","L → L → L → M → H → SP1 → ↓→SP1",22,0,""],["","L → M → H → SP1 → ↓→SP1",21,0,""],["","L → M → L+H → hold ↑ → L → M → H (air)",21,0,""]]]],
"saint":[["",[["EASY","L → M → H → SP1 (Crimson Claw)",15,4,"any range"],["MEDIUM","L → L → M → H → SP1 (Crimson Claw) → SP1 (Second Fang)",18,6,""],["HARD","M → ↓→SP1 (Blood Whip) → ↓↓SP2 (Hemorrhage)",11,3,"any range"],["SOUL","L → L → M → H → SP1 (Crimson Claw) → SP1+SP2 (Crimson Nocturne)",36,15,""]]]],
"borgar":[["",[["EASY","L → M → H → ↓→SP2 (Mountain Breaker)",26,4,"any range"],["MEDIUM","L → L → M → H → ↓→SP2 (Mountain Breaker)",26,5,""],["HARD","M → ↓←SP1 (Rune Uppercut) → M (air) → H (air)",22,4,"any range"],["SOUL","L → L → M → H → ↓←SP1 (Rune Uppercut) → SP1+SP2 (Wrath Of The Mountain)",48,13,""]]]],
"buzzu":[["",[["EASY","L → M → H → ↓→SP1 (Saw Frenzy)",13,10,"any range"],["MEDIUM","L → L → L → M → H → ↓→SP1 (Saw Frenzy)",15,12,""],["HARD","L → M → H → SP1 (Chainsaw Dash) → ↓→SP1 (Saw Frenzy)",14,11,"any range"],["SOUL","L → L → L → M → H → ↓→SP2 (Blood Consumption) → SP1+SP2 (Chainsaw Rampage)",36,19,""]]]],
"reika":[["",[["EASY","L → M → H → ↓←SP1 (Crushing Pressure)",25,6,"any range"],["MEDIUM","L → L → L → M → H → ↓←SP1 (Crushing Pressure)",26,8,""],["HARD","L → M → ↓→SP1 (Command) → H → ↓←SP1 (Crushing Pressure)",25,7,"any range"],["SOUL","L → L → L → M → H → ↓→SP1 (Command) → SP1+SP2 (Absolute Control)",56,15,""]]]],
"yamika":[["",[["EASY","L → M → H → SP1 (Forbidden Dark Flame)",22,4,"any range"],["MEDIUM","L → L → L → M → H → SP1 (Forbidden Dark Flame)",23,6,""],["HARD","↓→SP2 (Tyrant's Grasp) → H → SP1 (Forbidden Dark Flame)",22,3,"any range"],["SOUL","L → L → L → M → H → SP1+SP2 (The Unsealed Wicked Eye)",48,12,""]]]],
"lunaria":[["",[["EASY","L → M → H → SP2 (Eclipse Spear)",27,4,"any range"],["MEDIUM","L → L → M → H → SP2 (Eclipse Spear)",27,5,""],["HARD","↓←SP1 (Lunar Chains) → H → SP1 (Crescent Moon)",20,3,"any range"],["SOUL","L → L → L → M → H → ↓←SP1 (Lunar Chains) → SP1+SP2 (Eternal Night)",54,15,""]]]],
"honored":[["",[["EASY","L → M → H → ↓→SP2 (Red: Reversal)",31,4,"any range"],["MEDIUM","L → L → L → M → H → ↓→SP2 (Red: Reversal)",32,6,""],["HARD","L → M → L+H → hold ↑ → L (air) → M (air) → H (air)",30,6,"not vs Borgar / Buzzu"],["SOUL","L → L → L → M → H → SP2 (Blue: Maximum) → SP1+SP2 (Domain Expansion: Unlimited Void)",59,18,""]]]],
"hollow":[["",[["EASY","L → M → H → SP1 (Psychic Burst)",26,4,"any range"],["MEDIUM","L → L → L → M → H → SP1 (Psychic Burst)",28,6,""],["HARD","M → L+H → hold ↑ → M (air) → H (air)",27,4,""],["SOUL","L → L → L → M → H → SP1+SP2 (The Last Remnant)",54,13,""]]]],
"kanae":[["",[["EASY","L → M → H → ↓→SP2 (No More Pretending)",29,6,""],["MEDIUM","L → L → L → M → H → ↓→SP2 (No More Pretending)",29,8,""],["HARD","L → M → L+H → hold ↑ → L (air) → M (air) → H (air)",27,6,"not vs Borgar / Buzzu"],["SOUL","L → L → L → M → H → SP1 (Impulse) → SP1+SP2 (The Spiteful Bloom)",55,12,""]]]],
"tokine":[["",[["EASY","L → M → H → ↓→SP1 (Second Hour: Slow)",23,4,"any range"],["MEDIUM","L → L → L → M → H → ↓→SP1 (Second Hour: Slow)",25,6,""],["HARD","L → M → L+H → hold ↑ → L (air) → M (air) → H (air)",26,6,"not vs Borgar / Buzzu"],["SOUL","L → L → L → M → H → SP1+SP2 (Endless Nightmare)",52,20,""]]]],
"aimi":[["",[["EASY","L → M → H → SP1 → SP1",27,0,"any range"],["MEDIUM","L → L → M → H → SP1 → SP1",27,0,""],["HARD","L → M → L+H → hold ↑ → L → M → H (air)",25,0,"not vs Borgar / Buzzu"],["SOUL","L → L → M → H → ↓←SP1 → SP1+SP2",50,0,""]]]],
"hachi":[["",[["EASY","L → M → H → SP2",28,0,"any range"],["MEDIUM","L → L → L → M → H → SP2",29,0,"any range"],["HARD","M → L+H → hold ↑ → M → H (air)",26,0,"hits everyone"],["SOUL","L → L → L → M → H → SP2 → SP1+SP2",35,0,""]]]],
"jackpot":[["",[["EASY","L → M → H → SP1 (Loaded Dice)",19,4,"the die decides the damage"],["MEDIUM","L → L → M → H → ↓→SP1 (Royal Flush)",25,10,"more with a Royal Flush"],["HARD","L → M → L+H → hold ↑ → L → M → H (air)",24,6,"not vs Borgar / Buzzu"],["SOUL","L → L → L → M → H → SP1+SP2 (The Final Bet)",29,14,"MAX at 100 LUCK"]]],["LUCK",[["70+","L → M → H → ↓↓SP2 (All In — High Roller)",28,5,"spends all LUCK"],["100","L → M → H → ↓↓SP2 (All In — JACKPOT)",36,8,"cinematic · spends all LUCK"]]]],
"teke":[["",[["EASY","L → M → H → SP2 (Half and Half)",21,4,"works vs everyone"],["MEDIUM","L → L → L → M → H → ↓↓SP2 (Endless Crawl)",20,9,"more hits with Momentum"],["HARD","L → L → M → L+H → hold ↑ → L → M → H (air)",19,7,"hits everyone"],["SOUL","L → L → L → M → H → SP1 → L → SP1+SP2 (The Last Train)",39,12,"cinematic"]]],["MOMENTUM",[["MAX","L → L → L → M → H → SP1 → L → SP1 (No Escape)",23,8,"UNSTOPPABLE only"],["MAX","L → M → H → SP2 (Half and Half)",23,4,"+12% finisher damage"]]]],
"haze":[["",[["EASY","L → M → H → SP1 (Nicotine Rush)",18,4,"any range"],["MEDIUM","L → L → M → H → SP2 (Heavy Hit)",24,5,"huge knockback · wall splat"],["HARD","M → L+H → hold ↑ → M → H (air)",20,4,"hits everyone"],["SOUL","L → L → L → M → H → SP1+SP2 (Zero Visibility)",41,15,""]]],["SMOKE",[["HOTBOX","in his Hotbox: L → M → H → SP2 (Heavy Hit, fast pull)",24,4,"they are slowed inside"],["COUGH","foe coughs in his smoke → L → M → H → SP2",24,4,"stand still unguarded = cough"],["STEP","foe in smoke: ↓←SP1 (Smoke Step) → L (Vapor Kick)",5,1,"he steps out behind them"]]]],
"kuchi":[["",[["EASY","L → M → H → SP1",20,0,""],["MEDIUM","L → L → L → M → H → ↓→SP1",21,0,""],["HARD","L → M → L+H → hold ↑ → L → M → H (air)",23,0,"not vs Borgar / Buzzu"],["SOUL","L → L → L → M → H → ↓→SP1 → SP1+SP2",34,0,""]]]]};

// ---------------------------------- Buzzu hurtbox fix ----------------------------------
// He was so short (125 px) that standing L / H of most fighters flew over him, which made him nearly combo-proof.
// Now he uses the normal standing/air hurtbox (scaled) and a slightly taller crouch box; his look is unchanged.
BUZZU.hurt = { w: 54, h: 170, ch: 112, air: 136, airTop: 160 };

// ---------------------------------- combo list drawing ----------------------------------
const CB_TAGCOL = { EASY: '#6dffa0', MEDIUM: '#7fe9ff', HARD: '#ff9a4a', SOUL: '#ffd84a', '': '#cfc4ee' };
function cbLines(g, text, maxW) {
  const out = []; let line = '';
  for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }
  if (line) out.push(line); return out;
}
function comboBookPages(g, ch, w) {
  const id = (ch.baseCh || ch).id, book = COMBO_BOOK[id] || [], items = [];
  g.font = `700 14px ${FONT_UI}`;
  for (const [title, rows] of book) {
    if (title) items.push({ h: 30, title });
    for (const r of rows) { const ls = cbLines(g, r[1], w - 230); items.push({ h: ls.length * 18 + (r[4] ? 16 : 0) + 10, r, ls }); }
  }
  const pages = [[]]; let used = 0, MAXH = 470;
  items.forEach((it, i) => {
    const need = it.h + (it.title && items[i + 1] ? items[i + 1].h : 0);   // keep a section title with its first combo
    if (used + need > MAXH && pages[pages.length - 1].length) { pages.push([]); used = 0; }
    pages[pages.length - 1].push(it); used += it.h;
  });
  return pages;
}
function comboBookPageCount(ch) { return comboBookPages(ctx, ch, 590).length; }
function drawComboBook(g, ch, x, y, w, label, page = 0) {
  if (ch.baseCh) ch = ch.baseCh;
  panel(g, x, y, w, 600, 'rgba(10,6,26,0.94)', ch.colors.accent);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = `italic 900 30px ${FONT_T}`; strokeText(g, `${label} · ${ch.name}`, x + 26, y + 40, '#ffffff', OUTLINE, 5);
  const pages = comboBookPages(g, ch, w), pg = pages[page % pages.length] || [];
  g.font = `800 12px ${FONT_UI}`; g.fillStyle = '#8a80aa'; g.fillText('COMBO LIST  連続技', x + 26, y + 62);
  g.textAlign = 'right'; g.fillText(pages.length > 1 ? `PAGE ${page % pages.length + 1}/${pages.length}   DAMAGE` : 'DAMAGE', x + w - 26, y + 62); g.textAlign = 'left';
  let yy = y + 92;
  if (!pg.length) { g.font = `600 14px ${FONT_UI}`; g.fillStyle = '#a99ccf'; g.fillText('No verified combos yet.', x + 26, yy); }
  for (const it of pg) {
    if (it.title) { g.font = `italic 900 16px ${FONT_T}`; strokeText(g, it.title, x + 26, yy + 6, ch.colors.accent, OUTLINE, 3); yy += it.h; continue; }
    const [tag, , dmg, hits, note] = it.r;
    g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(x + 18, yy - 15, w - 36, it.h - 4);
    g.font = `900 11px ${FONT_UI}`; g.fillStyle = CB_TAGCOL[tag] || '#cfc4ee'; g.fillText(tag || '•', x + 26, yy);
    g.font = `700 14px ${FONT_UI}`; g.fillStyle = tag === 'SOUL' ? '#ffe9a0' : '#ffffff';
    it.ls.forEach((l, i) => g.fillText(l, x + 92, yy + i * 18));
    g.textAlign = 'right'; g.font = `italic 900 17px ${FONT_UI}`; g.fillStyle = tag === 'SOUL' ? '#ffd84a' : '#ff8aa0'; g.fillText(dmg + ' %', x + w - 26, yy + 1);
    if (hits) { g.font = `600 11px ${FONT_UI}`; g.fillStyle = '#a99ccf'; g.fillText(hits + ' hits', x + w - 84, yy); }
    g.textAlign = 'left';
    if (note) { g.font = `italic 600 11px ${FONT_UI}`; g.fillStyle = '#a99ccf'; g.fillText(note, x + 92, yy + it.ls.length * 18 - 2); }
    yy += it.h;
  }
  g.font = `italic 500 12px ${FONT_UI}`; g.fillStyle = '#a99ccf';
  wrapText(g, 'Every combo was played by a bot against a dummy that blocks after the first hit. → = toward the opponent. SOUL = needs 100% Soul. Damage = % of a normal life bar.', x + 26, y + 566, w - 52, 15);
}

// ---------------------------------- pause menu: COMBO LIST + TRAINING OPTIONS ----------------------------------
const TR_STANCE = ['STAND', 'CROUCH', 'JUMP'], TR_GUARD = ['NO BLOCK', 'BLOCK ALL', 'AFTER 1ST HIT', 'RANDOM'], TR_ACTION = ['IDLE', 'JAB', 'BURST @4 HITS'];
function cbPatchMenu(bt) {
  const m = bt.pauseMenu; if (!m || m._cb) return; m._cb = 1;
  const i = m.items.findIndex(it => it.id === 'list');
  m.items.splice(i + 1, 0, { id: 'combos', label: 'COMBO LIST', jp: '連続技' });
  if (bt.practice) m.items.splice(i + 2, 0, { id: 'topts', label: bt.mode === 'training' ? 'TRAINING OPTIONS' : 'PRACTICE OPTIONS', jp: '練習設定' });
  if (m.items.length > 5) { m.h = 46; m.gap = 8; m.y = 232; }
}
function cbOptsMenu(bt) {
  return new MenuList([
    { id: 'stance', label: 'DUMMY STANCE', jp: '体勢' }, { id: 'guard', label: 'DUMMY GUARD', jp: '防御' },
    { id: 'action', label: 'DUMMY ACTION', jp: '行動' }, { id: 'tech', label: 'DUMMY THROW TECH', jp: '投げ抜け' },
    { id: 'meter', label: 'SOUL METER REFILL', jp: '魂' }, { id: 'boxes', label: 'SHOW HITBOXES', jp: '判定' },
    { id: 'reset', label: 'RESET POSITIONS', jp: '位置' }, { id: 'wall', label: 'RESET AT WALL', jp: '壁' }, { id: 'back', label: 'BACK', jp: '戻る' },
  ], W / 2, 120, { w: 560, h: 46, gap: 8 });
}
function cbOptsValues(bt) {
  const v = { stance: TR_STANCE[bt.dm.stance], guard: TR_GUARD[bt.dm.guard], action: TR_ACTION[bt.dm.action], tech: bt.dm.tech ? 'ON' : 'OFF', meter: bt.infMeter ? 'ON' : 'OFF', boxes: bt.showBoxes ? 'ON' : 'OFF' };
  for (const it of bt.optsMenu.items) it.value = v[it.id];
}
function cbComboKeys(bt) {   // shared by local + online pause: ←/→ page, anything else closes
  const np = bt._cbPages || 1;
  if (UI.left() || pressedAny(B(2, 'left'))) { bt.cbPage = (bt.cbPage + np - 1) % np; Sound.play('menuMove'); }
  else if (UI.right() || pressedAny(B(2, 'right'))) { bt.cbPage = (bt.cbPage + 1) % np; Sound.play('menuMove'); }
  else if (UI.back() || UI.ok() || Mouse.clicked || Keys.pressed.has('Escape')) { bt.showCombos = false; Sound.play('menuBack'); }
}
function cbReplay(bt, it, fn) {   // run the original pause handler with this frame's menu result (no double navigation)
  const m = bt.pauseMenu, orig = m.update; m.update = () => it;
  try { return fn.call(bt); } finally { m.update = orig; }
}
{
  const _up = Battle.prototype.updatePause, _dp = Battle.prototype.drawPause;
  Battle.prototype.updatePause = function () {
    cbPatchMenu(this);
    if (this.showCombos) return cbComboKeys(this);
    if (this.showOpts) {
      if (Keys.pressed.has('Escape') || UI.back()) { this.showOpts = false; Sound.play('menuBack'); return; }
      const it = this.optsMenu.update(); if (!it) return;
      Sound.play('menuOk'); const dm = this.dm;
      switch (it.id) {
        case 'stance': dm.stance = (dm.stance + 1) % 3; break;
        case 'guard': dm.guard = (dm.guard + 1) % 4; break;
        case 'action': dm.action = (dm.action + 1) % 3; break;
        case 'tech': dm.tech = !dm.tech; break;
        case 'meter': this.infMeter = !this.infMeter; break;
        case 'boxes': this.showBoxes = !this.showBoxes; break;
        case 'reset': case 'wall': this.showOpts = false; this.paused = false; this.resetPositions(it.id === 'wall'); break;
        case 'back': this.showOpts = false; break;
      }
      return;
    }
    if (this.showList || Keys.pressed.has('Escape') || !this.pauseMenu) return _up.call(this);
    const it = this.pauseMenu.update();
    if (it && it.id === 'combos') { this.showCombos = true; this.cbPage = 0; Sound.play('menuOk'); return; }
    if (it && it.id === 'topts') { this.showOpts = true; this.optsMenu = this.optsMenu || cbOptsMenu(this); Sound.play('menuOk'); return; }
    return cbReplay(this, it, _up);
  };
  Battle.prototype.drawPause = function (g) {
    cbPatchMenu(this);
    if (this.showCombos) {
      g.fillStyle = 'rgba(5,2,14,0.78)'; g.fillRect(0, 0, W, H);
      this._cbPages = Math.max(comboBookPages(g, this.p1.ch, 590).length, comboBookPages(g, this.p2.ch, 590).length);
      drawComboBook(g, this.p1.ch, 40, 60, 590, 'P1', this.cbPage); drawComboBook(g, this.p2.ch, 650, 60, 590, this.practice ? 'DUMMY' : 'P2', this.cbPage);
      drawFooter(g, (this._cbPages > 1 ? '← / →  page   ·   ' : '') + 'any button: close   ·   practise them in TRAINING');
      return;
    }
    if (this.showOpts) {
      g.fillStyle = 'rgba(5,2,14,0.82)'; g.fillRect(0, 0, W, H);
      drawTitleText(g, this.mode === 'training' ? 'TRAINING' : 'PRACTICE', W / 2, 72, 56, '#ffffff', '#ffb020');
      cbOptsValues(this); this.optsMenu.draw(g, this.pf);
      drawFooter(g, 'ENTER / click: change   ·   ESC: back');
      return;
    }
    return _dp.call(this, g);
  };
  // last + best combo for the practice panel; dummy throw tech
  const _pu = Battle.prototype.practiceUpdate;
  Battle.prototype.practiceUpdate = function () {
    _pu.call(this);
    const D = this.p2;
    if (D.comboHits > 0) this._curCombo = { hits: D.comboHits, dmg: D.comboDmg };
    else if (this._curCombo) { this.lastCombo = this._curCombo; this.bestComboDmg = Math.max(this.bestComboDmg || 0, this._curCombo.dmg); this._curCombo = null; }
  };
}
if (typeof NetBattle !== 'undefined') {
  const _ul = NetBattle.prototype.updateLeave, _dp = NetBattle.prototype.drawPause;
  NetBattle.prototype.updateLeave = function () {
    cbPatchMenu(this);
    if (this.showCombos) return cbComboKeys(this);
    if (this.showList || Keys.pressed.has('Escape') || !this.pauseMenu) return _ul.call(this);
    const it = this.pauseMenu.update();
    if (it && it.id === 'combos') { this.showCombos = true; this.cbPage = 0; Sound.play('menuOk'); return; }
    return cbReplay(this, it, _ul);
  };
  NetBattle.prototype.drawPause = function (g) {
    cbPatchMenu(this);
    if (this.showCombos) {
      g.fillStyle = 'rgba(5,2,14,0.72)'; g.fillRect(0, 0, W, H);
      this._cbPages = comboBookPages(g, this.me.ch, 590).length;
      drawComboBook(g, this.me.ch, 345, 60, 590, 'YOU', this.cbPage);
      drawFooter(g, (this._cbPages > 1 ? '← / →  page   ·   ' : '') + 'any button: close   ·   the match keeps running!');
      return;
    }
    return _dp.call(this, g);
  };
}
{
  const _thr = CINE.throwT;
  CINE.throwT = function (A, D, f, c) {
    if (f === 4 && BT && BT.practice && D === BT.p2 && BT.dm && BT.dm.tech && !c.clash) return throwTech(A, D, c);
    return _thr(A, D, f, c);
  };
}
