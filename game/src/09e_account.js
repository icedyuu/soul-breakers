// ===================== ACCOUNTS · CLOUD SAVE · ONLINE RANKINGS · ADMIN =====================
// Free backend: a Supabase project (Postgres) set up with cloud/supabase_setup.sql. The game only
// talks to its database functions (POST /rest/v1/rpc/sb_*) with the public key; the tables are not
// readable or writable directly. Accounts are a username + password (no e-mail).
//  · Cloud save: the Mastery profile (XP, colour picks) syncs to the account; the server merges per
//    fighter (higher XP wins). The hidden cheat never uploads: unlockAll keeps the real XP in d.clean.
//  · Rankings: after an ONLINE match both players report the result with the same match key; the
//    server rates it (Elo) only when both reports agree. Local play never needs an account.
//  · Admin (accounts in sb_admins): give a player mastery levels (unlock colours), ban, new password.
// Nothing here runs inside the battle sim (fetch callbacks only touch the profile), so lockstep is safe.
const CLOUD_CFG = { url: 'https://pugmlvxaadjiuazlmyra.supabase.co', key: 'sb_publishable_YZqAok3mCqwvkug-Z5G_FQ_1MWAbToU' };
const CLOUD_ERR = {
  BAD_NAME: 'Name: 3–16 letters, numbers or _', BAD_PASSWORD: 'Password: 6–64 characters', NAME_TAKEN: 'That name is already taken.',
  WRONG_LOGIN: 'Wrong name or password.', LOCKED: 'Too many wrong tries. Wait 5 minutes.', TOO_MANY: 'Too many new accounts from here. Try again later.',
  SESSION_EXPIRED: 'Please log in again.', BANNED: 'This account is banned.', NOT_ADMIN: 'Admins only.', NO_USER: 'No player with that name.',
  BAD_GRANT: 'Invalid choice.', BAD_SAVE: 'Save data rejected.', NET: "Can't reach the account server. Check your internet.",
};
const cloudErr = e => CLOUD_ERR[e && e.message] || CLOUD_ERR.NET;

const Cloud = {
  KEY: 'sb_account_v1', tok: null, name: null, me: null, sync: 'idle', pushT: 0, busy: 0,
  cfg() { return window.SB_CLOUD_OVERRIDE || CLOUD_CFG; },
  enabled() { const c = this.cfg(); return !!(c.url && c.key && window.fetch); },
  get on() { return this.enabled() && !!this.tok; },
  load() { try { const o = JSON.parse(localStorage.getItem(this.KEY)); if (o && o.tok) { this.tok = o.tok; this.name = o.name; this.me = o.me || null; } } catch (e) { } },
  store() { try { if (this.tok) localStorage.setItem(this.KEY, JSON.stringify({ tok: this.tok, name: this.name, me: this.me && { ...this.me, save: undefined } })); else localStorage.removeItem(this.KEY); } catch (e) { } },
  async rpc(fn, args) {
    const c = this.cfg(), h = { 'content-type': 'application/json', apikey: c.key };
    if (c.key.startsWith('eyJ')) h.authorization = 'Bearer ' + c.key;   // legacy anon JWT key
    const ctl = window.AbortController ? new AbortController() : null, to = ctl && setTimeout(() => ctl.abort(), 12000);
    this.busy++;
    try {
      let r;
      try { r = await fetch(c.url.replace(/\/$/, '') + '/rest/v1/rpc/' + fn, { method: 'POST', headers: h, body: JSON.stringify(args || {}), signal: ctl && ctl.signal }); }
      catch (e) { throw new Error('NET'); }
      const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { }
      if (!r.ok) throw new Error(j && j.code === 'PGRST202' ? 'MISSING_FN' : j && /^[A-Z_]+$/.test(j.message || '') ? j.message : 'NET');
      if (j && typeof j === 'object' && typeof j.error === 'string') throw new Error(j.error);
      return j;
    } finally { this.busy--; if (to) clearTimeout(to); }
  },
  // ---- account ----
  async register(name, pw) { return this.signedIn(await this.rpc('sb_register', { p_name: name, p_pw: pw })); },
  async login(name, pw) { return this.signedIn(await this.rpc('sb_login', { p_name: name, p_pw: pw })); },
  signedIn(r) { this.tok = r.token; this.name = r.me.name; this.applyMe(r.me); this.push(true); return r.me; },
  logout() { const t = this.tok; this.tok = this.name = this.me = null; this.store(); if (t) this.rpc('sb_logout', { p_token: t }).catch(() => { }); },
  async refresh() {
    if (!this.on) return null;
    try { this.applyMe(await this.rpc('sb_me', { p_token: this.tok })); this.push(); return this.me; }
    catch (e) { if (e.message === 'SESSION_EXPIRED' || e.message === 'BANNED') { this.err = cloudErr(e); this.logout(); } this.sync = 'offline'; return null; }
  },
  applyMe(me) {
    if (!me) return;
    if (me.save && me.save.v === 1) this.merge(me.save);
    this.applyGrants(me.grants);
    this.me = { ...me, save: undefined }; this.name = me.name; this.store();
  },
  // ---- mastery sync ----
  merge(save) {
    const d = Mastery.data;
    if (d.clean) for (const id in save.chars || {}) d.clean[id] = Math.max(d.clean[id] | 0, save.chars[id].xp | 0);
    this.importing = true; try { Mastery.import(save); } finally { this.importing = false; }
  },
  xpFor(lv) { let x = 0; for (let l = 1; l < clamp(lv | 0, 1, Mastery.MAX); l++) x += Mastery.need(l); return x; },
  applyGrants(gr) {
    if (!gr) return; let ch = false;
    for (const c of CHARS) {
      const lv = Math.max(gr['*'] | 0, gr[c.id] | 0); if (!lv) continue;
      const r = Mastery.rec(c.id), x = this.xpFor(lv); if (r.xp < x) { r.xp = x; ch = true; }
    }
    // arcade skins given by an admin: grant keys 'arc_<fighter id>' / 'arc_all' (any level)
    const unl = Mastery.data.unl || (Mastery.data.unl = {});
    for (const c of CHARS) if ((gr.arc_all || gr['arc_' + c.id]) && !unl[c.id + ':' + ARC_VI]) { unl[c.id + ':' + ARC_VI] = 1; ch = true; }
    if (ch) { this.importing = true; try { Mastery.save(); } finally { this.importing = false; } }
  },
  // what goes to the cloud: the real progress (the cheat's LV 10 stays on this device)
  exportSave() {
    const o = Mastery.export(), cl = o.clean; delete o.clean;
    if (cl) for (const id in o.chars) o.chars[id].xp = cl[id] | 0;
    return o;
  },
  push(now) { if (!this.on) return; clearTimeout(this.pushT); this.pushT = setTimeout(() => this.pushNow(), now ? 0 : 2500); },
  async pushNow() {
    if (!this.on) return;
    this.sync = 'saving';
    try { const s = await this.rpc('sb_save', { p_token: this.tok, p_data: this.exportSave() }); if (s && s.v === 1) this.merge(s); this.sync = 'saved'; }
    catch (e) { this.sync = 'offline'; if (e.message === 'SESSION_EXPIRED' || e.message === 'BANNED') { this.err = cloudErr(e); this.logout(); } }
  },
  // ---- rankings ----
  async report(key, opp, won, ch) { return this.rpc('sb_report', { p_token: this.tok, p_key: key, p_opp: opp, p_won: won, p_ch: ch }); },
  async result(key) { return this.rpc('sb_result', { p_token: this.tok, p_key: key }); },
  async top(n = 100) { return this.rpc('sb_top', { p_limit: n }); },
};
Cloud.load();

// Mastery hooks: upload after every change, and keep the real XP while the hidden cheat is active
{
  const sv = Mastery.save, ua = Mastery.unlockAll, aw = Mastery.award;
  Mastery.save = function () { const r = sv.call(this); if (!Cloud.importing) Cloud.push(); return r; };
  Mastery.unlockAll = function () { const d = this.data; if (!d.clean) { d.clean = {}; for (const c of CHARS) d.clean[c.id] = this.rec(c.id).xp; } return ua.call(this); };
  Mastery.award = function (bt) { const r = aw.call(this, bt), d = this.data; if (r && d.clean) { d.clean[r.ch.id] = (d.clean[r.ch.id] | 0) + r.gained; this.save(); } return r; };
}

// ---------------- HTML text fields over the canvas (names / passwords need the real keyboard) ----------------
const DomIn = {
  make(type, ph, max, onEnter) {
    const el = document.createElement('input');
    Object.assign(el, { type, placeholder: ph, maxLength: max, spellcheck: false, autocomplete: type === 'password' ? 'current-password' : 'username' });
    el.setAttribute('autocapitalize', 'off'); el.setAttribute('autocorrect', 'off');
    Object.assign(el.style, { position: 'fixed', zIndex: 10, boxSizing: 'border-box', background: 'rgba(10,6,24,0.94)', color: '#ffffff', border: '2px solid rgba(255,120,160,0.75)', borderRadius: '4px', padding: '0 0.6em', outline: 'none', fontFamily: FONT_UI, fontWeight: '700', caretColor: '#ffd84a' });
    el.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); onEnter && onEnter(); } if (e.key === 'Escape') el.blur(); });
    el.addEventListener('focus', () => { el.style.borderColor = '#ffd84a'; }); el.addEventListener('blur', () => { el.style.borderColor = 'rgba(255,120,160,0.75)'; });
    document.body.appendChild(el); return el;
  },
  place(el, r) {
    const c = canvas.getBoundingClientRect(), k = c.width / W;
    el.style.left = c.left + r.x * k + 'px'; el.style.top = c.top + r.y * k + 'px'; el.style.width = r.w * k + 'px'; el.style.height = r.h * k + 'px'; el.style.fontSize = Math.max(12, r.h * 0.44 * k) + 'px';
  },
  kill(...els) { for (const el of els) if (el && el.parentNode) el.parentNode.removeChild(el); },
};
const domTyping = () => document.activeElement && document.activeElement.tagName === 'INPUT';

function cloudBtn(g, r, label, t, on = true) { g.save(); if (!on) g.globalAlpha = 0.45; drawButton(g, r, label, null, on && inRect(r), t); g.restore(); }
function cloudMsg(g, txt, y, err) {
  if (!txt) return;
  g.save(); g.font = `700 18px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = Math.min(W - 60, g.measureText(txt).width + 40);
  g.fillStyle = err ? 'rgba(80,0,20,0.92)' : 'rgba(0,50,30,0.92)'; g.fillRect(W / 2 - w / 2, y - 20, w, 40);
  g.strokeStyle = err ? '#ff5a7a' : '#5affb0'; g.lineWidth = 2; g.strokeRect(W / 2 - w / 2, y - 20, w, 40);
  g.fillStyle = err ? '#ffd0d8' : '#c8ffe4'; g.fillText(txt, W / 2, y); g.restore();
}
const cloudBackRect = { x: 30, y: H - 90, w: 180, h: 50 };
const chById = id => CHARS.find(c => c.id === id);

// ---------------- ACCOUNT ----------------
class AccountScene {
  constructor(o = {}) {
    this.t = 0; this.mode = 'login'; this.msg = Cloud.err || ''; this.isErr = !!Cloud.err; Cloud.err = ''; this.back = o.back || (() => new TitleScene());
    Music.play('menu');
    if (Cloud.on) { this.busy = true; Cloud.refresh().then(() => { this.busy = false; this.build(); }); }
    this.build();
  }
  build() {
    if (Cloud.on) {
      this.dispose();
      const items = [{ id: 'rank', label: 'RANKINGS', jp: 'ランキング' }];
      if (Cloud.me && Cloud.me.admin) items.push({ id: 'admin', label: 'ADMIN', jp: '管理' });
      items.push({ id: 'logout', label: 'LOG OUT', jp: 'ログアウト' }, { id: 'back', label: 'BACK', jp: '戻る' });
      this.menu = new MenuList(items, 900, 250, { w: 400, h: 52 });
    } else {
      this.menu = new MenuList([{ id: 'rank', label: 'RANKINGS', jp: 'ランキング' }], W / 2, 530, { w: 380, h: 48 });
      if (!this.user && Cloud.enabled()) {
        this.user = DomIn.make('text', 'name', 16, () => this.pw.focus());
        this.pw = DomIn.make('password', 'password', 64, () => this.submit());
        if (Cloud.name) this.user.value = Cloud.name;
      }
    }
  }
  dispose() { DomIn.kill(this.user, this.pw); this.user = this.pw = null; }
  tabRect(i) { return { x: W / 2 - 250 + i * 256, y: 190, w: 244, h: 46 }; }
  fieldRect(i) { return { x: W / 2 - 220, y: 262 + i * 66, w: 440, h: 50 }; }
  okRect() { return { x: W / 2 - 160, y: 400, w: 320, h: 52 }; }
  async submit() {
    if (this.busy || !this.user) return;
    const n = this.user.value.trim(), p = this.pw.value;
    if (!/^[A-Za-z0-9_]{3,16}$/.test(n)) return this.say(CLOUD_ERR.BAD_NAME, true);
    if (p.length < 6) return this.say(CLOUD_ERR.BAD_PASSWORD, true);
    this.busy = true; this.say(this.mode === 'login' ? 'Logging in…' : 'Creating account…');
    try {
      await (this.mode === 'login' ? Cloud.login(n, p) : Cloud.register(n, p));
      Sound.play('victory'); this.say(this.mode === 'login' ? 'Welcome back, ' + Cloud.name + '!' : 'Account created. Welcome, ' + Cloud.name + '!');
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      this.build();
    } catch (e) { Sound.play('menuBack'); this.say(cloudErr(e), true); }
    this.busy = false;
  }
  say(m, err) { this.msg = m; this.isErr = !!err; this.msgT = 0; }
  leave() { this.dispose(); Sound.play('menuBack'); go(this.back()); }
  update() {
    this.t++; this.msgT = (this.msgT | 0) + 1;
    if (Cloud.on) {
      if (Keys.pressed.has('Escape') || UI.back()) return this.leave();
      const it = this.menu.update(); if (!it) return;
      Sound.play('menuOk');
      if (it.id === 'rank') go(new RankScene({ back: () => new AccountScene({ back: this.back }) }));
      if (it.id === 'admin') go(new AdminScene());
      if (it.id === 'logout') { Cloud.logout(); this.say('Logged out. Your progress stays on this device.'); this.build(); }
      if (it.id === 'back') this.leave();
      return;
    }
    if (!domTyping() && (Keys.pressed.has('Escape') || pressedAny(B(1, 'heavy'), B(2, 'heavy')))) return this.leave();
    if (Mouse.clicked) {
      if (inRect(cloudBackRect)) return this.leave();
      for (const i of [0, 1]) if (inRect(this.tabRect(i))) { this.mode = i ? 'register' : 'login'; this.msg = ''; Sound.play('menuMove'); this.pw && (this.pw.autocomplete = i ? 'new-password' : 'current-password'); }
      if (inRect(this.okRect())) this.submit();
    }
    if (!domTyping()) {
      const it = this.menu.update();
      if (it && it.id === 'rank') { this.dispose(); Sound.play('menuOk'); go(new RankScene({ back: () => new AccountScene({ back: this.back }) })); }
      if (it && it.id === 'back') this.leave();
    }
  }
  draw(g) {
    const t = this.t;
    drawMenuBG(g, t, '#8a5aff');
    drawTitleText(g, 'ACCOUNT', W / 2, 80, 76, '#ffd84a', '#8a3aff');
    g.font = `700 20px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d8c8ff'; g.fillText('アカウント · cloud save · online rankings', W / 2, 136);
    if (!Cloud.enabled()) { cloudMsg(g, 'Accounts are not available in this version.', 300, true); drawButton(g, cloudBackRect, 'BACK', null, inRect(cloudBackRect), t); return; }
    if (Cloud.on) this.drawMe(g, t);
    else {
      ['LOG IN', 'NEW ACCOUNT'].forEach((s, i) => drawButton(g, this.tabRect(i), s, null, (this.mode === 'register') === !!i, t));
      if (this.user) { DomIn.place(this.user, this.fieldRect(0)); DomIn.place(this.pw, this.fieldRect(1)); }
      g.font = `700 15px ${FONT_UI}`; g.textAlign = 'right'; g.fillStyle = '#cfc4ee';
      g.fillText('NAME', this.fieldRect(0).x - 14, this.fieldRect(0).y + 25); g.fillText('PASSWORD', this.fieldRect(1).x - 14, this.fieldRect(1).y + 25);
      drawButton(g, this.okRect(), this.busy ? '…' : this.mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT', null, inRect(this.okRect()), t);
      g.font = `600 15px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = 'rgba(230,220,255,0.8)';
      g.fillText(this.mode === 'login' ? 'Log in to save your mastery in the cloud and play ranked online matches.' : 'No e-mail needed. Remember your password: there is no reset by e-mail.', W / 2, 476);
      this.menu.draw(g, t);
    }
    if (this.msg && this.msgT < 600) cloudMsg(g, this.msg, 650, this.isErr);
    if (!Cloud.on) drawButton(g, cloudBackRect, 'BACK', null, inRect(cloudBackRect), t);
    drawFooter(g, Cloud.on ? '↑/↓ + ENTER  ·  mouse / tap' : 'TAB: next field  ·  ENTER: confirm  ·  ESC: back');
  }
  drawMe(g, t) {
    const me = Cloud.me || { name: Cloud.name }, x = 120, y = 200, ch = me.main && chById(me.main);
    panel(g, x, y, 520, 330);
    if (ch) g.drawImage(ch.card, x + 22, y + 24, 100, 186);
    const tx = x + (ch ? 146 : 30);
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    drawTitleText(g, me.name || '', tx, y + 64, 46, '#ffffff', '#8a3aff', 'left');
    if (me.admin) { g.font = `900 14px ${FONT_UI}`; g.fillStyle = '#ffd84a'; g.fillText('★ ADMIN', tx, y + 92); }
    const rows = [['RATING', me.rating ?? '—'], ['RANK', me.rank ? '#' + me.rank : '—'], ['ONLINE W / L', me.wins != null ? `${me.wins} / ${me.losses}` : '—'], ['MAIN', ch ? ch.name : '—']];
    rows.forEach(([k, v], i) => {
      const yy = y + 130 + i * 40;
      g.font = `700 16px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.fillText(k, tx, yy);
      g.font = `900 24px ${FONT_UI}`; g.fillStyle = i === 0 ? '#ffd84a' : '#ffffff'; g.fillText(String(v), tx + 170, yy);
    });
    g.font = `600 15px ${FONT_UI}`; g.fillStyle = 'rgba(220,210,255,0.8)';
    const st = this.busy || Cloud.busy ? 'Syncing…' : Cloud.sync === 'offline' ? 'Offline: progress is kept on this device and synced later.' : 'Mastery + colors are saved to your account.';
    g.fillText(st, x + 30, y + 305);
    this.menu.draw(g, t);
  }
}

// ---------------- RANKINGS ----------------
class RankScene {
  constructor(o = {}) {
    this.t = 0; this.page = 0; this.rows = null; this.err = ''; this.back = o.back || (() => new TitleScene());
    Music.play('menu');
    if (!Cloud.enabled()) this.err = 'Accounts are not available in this version.';
    else Cloud.top(100).then(r => { this.rows = r || []; }).catch(e => { this.err = cloudErr(e); });
    if (Cloud.on) Cloud.refresh();
  }
  get pages() { return Math.max(1, Math.ceil((this.rows || []).length / 12)); }
  navRect(i) { return { x: W / 2 + (i ? 330 : -470), y: H - 90, w: 140, h: 50 }; }
  update() {
    this.t++;
    if (Keys.pressed.has('Escape') || UI.back() || (Mouse.clicked && inRect(cloudBackRect)) || (UI.ok() && this.t > 10)) { Sound.play('menuBack'); go(this.back()); return; }
    const d = (UI.right() || (Mouse.clicked && inRect(this.navRect(1)))) - (UI.left() || (Mouse.clicked && inRect(this.navRect(0))));
    if (d) { const p = clamp(this.page + d, 0, this.pages - 1); if (p !== this.page) { this.page = p; Sound.play('menuMove'); } }
  }
  draw(g) {
    const t = this.t;
    drawMenuBG(g, t, '#ffd84a');
    drawTitleText(g, 'RANKINGS', W / 2, 70, 70, '#ffd84a', '#ff8a1a');
    g.font = `700 18px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffe9a8'; g.fillText('ランキング · ranked online 1 VS 1', W / 2, 120);
    const x = 190, y = 150, w = W - 380;
    panel(g, x, y, w, 470);
    g.font = `800 14px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.textAlign = 'left';
    const cols = [[x + 30, '#'], [x + 100, 'PLAYER'], [x + 420, 'MAIN'], [x + 650, 'RATING'], [x + 790, 'W / L']];
    cols.forEach(([cx, s]) => g.fillText(s, cx, y + 26));
    if (this.err) cloudMsg(g, this.err, y + 220, true);
    else if (!this.rows) { g.textAlign = 'center'; g.font = `700 20px ${FONT_UI}`; g.fillStyle = '#fff'; g.fillText('Loading' + '.'.repeat(1 + (t >> 4) % 3), W / 2, y + 220); }
    else if (!this.rows.length) { g.textAlign = 'center'; g.font = `700 20px ${FONT_UI}`; g.fillStyle = '#fff'; g.fillText('No ranked matches yet. Log in and win an ONLINE 1 VS 1 match!', W / 2, y + 220); }
    else {
      const me = (Cloud.name || '').toLowerCase();
      this.rows.slice(this.page * 12, this.page * 12 + 12).forEach((r, i) => {
        const n = this.page * 12 + i + 1, yy = y + 62 + i * 34, mine = r.name.toLowerCase() === me, ch = r.main && chById(r.main);
        if (mine) { g.fillStyle = 'rgba(255,216,74,0.2)'; g.fillRect(x + 10, yy - 16, w - 20, 32); }
        else if (i % 2) { g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(x + 10, yy - 16, w - 20, 32); }
        g.textAlign = 'left';
        g.font = `italic 900 22px ${FONT_T}`; g.fillStyle = n === 1 ? '#ffd84a' : n === 2 ? '#e0e6f0' : n === 3 ? '#ff9a5a' : '#ffffff'; g.fillText(String(n), cols[0][0], yy);
        g.font = `800 19px ${FONT_UI}`; g.fillStyle = mine ? '#ffd84a' : '#ffffff'; g.fillText(r.name, cols[1][0], yy);
        g.font = `600 16px ${FONT_UI}`; g.fillStyle = ch ? ch.colors.accent : '#9a90c0'; g.fillText(ch ? ch.name : '—', cols[2][0], yy);
        g.font = `900 20px ${FONT_UI}`; g.fillStyle = '#ffd84a'; g.fillText(String(r.rating), cols[3][0], yy);
        g.font = `700 17px ${FONT_UI}`; g.fillStyle = '#e8dcff'; g.fillText(`${r.wins} / ${r.losses}`, cols[4][0], yy);
      });
    }
    const me = Cloud.on && Cloud.me;
    g.textAlign = 'center'; g.font = `700 17px ${FONT_UI}`; g.fillStyle = '#e8dcff';
    g.fillText(me ? `You: ${me.name} · ${me.rank ? '#' + me.rank + ' · ' : ''}${me.rating} rating · ${me.wins} W / ${me.losses} L` : 'Log in (ACCOUNT on the title screen) to appear in the rankings.', W / 2, 646);
    if (this.pages > 1) { cloudBtn(g, this.navRect(0), '◀ PREV', t, this.page > 0); cloudBtn(g, this.navRect(1), 'NEXT ▶', t, this.page < this.pages - 1); g.fillText(`${this.page + 1} / ${this.pages}`, W / 2, H - 65); }
    drawButton(g, cloudBackRect, 'BACK', null, inRect(cloudBackRect), t);
    drawFooter(g, '←/→ pages  ·  ESC / ENTER: back');
  }
}

// ---------------- ADMIN (give mastery levels / colours, ban, new password) ----------------
class AdminScene {
  constructor() {
    this.t = 0; this.ci = -1; this.lv = 10; this.out = ''; this.isErr = false; this.busy = false;
    this.user = DomIn.make('text', 'player name', 16, () => this.run('look'));
    this.npw = DomIn.make('text', 'new password (6+)', 64, () => this.run('pw'));
    this.npw.autocomplete = 'off';
    Music.play('menu');
  }
  dispose() { DomIn.kill(this.user, this.npw); this.user = this.npw = null; }
  arrow(row, i) { return { x: W / 2 + (i ? 200 : -260), y: 250 + row * 70, w: 60, h: 50 }; }
  btn(i) { const c = i % 3, r = Math.floor(i / 3); return { x: W / 2 - 430 + c * 300, y: 400 + r * 64, w: 260, h: 50 }; }
  get acts() { return [['grant', 'GIVE LEVEL'], ['arc', 'GIVE ARCADE SKIN'], ['look', 'LOOK UP'], ['pw', 'SET PASSWORD'], ['ban', 'BAN'], ['unban', 'UNBAN']]; }
  async run(a) {
    if (this.busy) return;
    const u = this.user.value.trim(); if (!u) { this.out = 'Type a player name first.'; this.isErr = true; return; }
    this.busy = true; this.out = '…'; this.isErr = false;
    try {
      const T = Cloud.tok; let r;
      if (a === 'grant') { const id = this.ci < 0 ? '*' : CHARS[this.ci].id; r = await Cloud.rpc('sb_admin_grant', { p_token: T, p_user: u, p_ch: id, p_lv: this.lv }); this.out = `${r.name}: ${this.ci < 0 ? 'ALL FIGHTERS' : CHARS[this.ci].name} → LV ${this.lv} (fighter unlocked too). Unlocks on their next login.`; }
      if (a === 'arc') { const id = this.ci < 0 ? 'arc_all' : 'arc_' + CHARS[this.ci].id; r = await Cloud.rpc('sb_admin_grant', { p_token: T, p_user: u, p_ch: id, p_lv: 1 }); this.out = `${r.name}: ARCADE SKIN for ${this.ci < 0 ? 'ALL FIGHTERS' : CHARS[this.ci].name}. Unlocks on their next login.`; }
      if (a === 'look') { r = await Cloud.rpc('sb_admin_user', { p_token: T, p_user: u }); const gn = k => k === '*' ? 'ALL' : k === 'arc_all' ? 'ARCADE SKINS: ALL' : k.startsWith('arc_') ? 'ARCADE SKIN: ' + (chById(k.slice(4)) || { name: k }).name : (chById(k) || { name: k }).name;
        const gr = Object.entries(r.grants || {}).map(([k, v]) => k.startsWith('arc_') ? gn(k) : `${gn(k)} ${v}`).join(', '); this.out = `${r.name} · rating ${r.rating} · ${r.wins} W / ${r.losses} L${r.banned ? ' · BANNED' : ''} · given: ${gr || 'nothing'}`; }
      if (a === 'pw') { const p = this.npw.value; if (p.length < 6) throw new Error('BAD_PASSWORD'); r = await Cloud.rpc('sb_admin_setpw', { p_token: T, p_user: u, p_pw: p }); this.out = `New password set for ${r.name}.`; this.npw.value = ''; }
      if (a === 'ban' || a === 'unban') { r = await Cloud.rpc('sb_admin_ban', { p_token: T, p_user: u, p_ban: a === 'ban' }); this.out = `${r.name} is ${r.banned ? 'banned' : 'unbanned'}.`; }
      Sound.play('menuOk');
      if (u.toLowerCase() === (Cloud.name || '').toLowerCase()) Cloud.refresh();
    } catch (e) { this.out = cloudErr(e); this.isErr = true; Sound.play('menuBack'); }
    this.busy = false;
  }
  update() {
    this.t++;
    const leave = () => { this.dispose(); Sound.play('menuBack'); go(new AccountScene()); };
    if (!domTyping() && (Keys.pressed.has('Escape') || pressedAny(B(1, 'heavy')))) return leave();
    if (!domTyping()) {
      if (UI.left() || UI.right()) { this.ci = ((this.ci + 1 + (UI.right() ? 1 : -1)) % (CHARS.length + 1) + CHARS.length + 1) % (CHARS.length + 1) - 1; Sound.play('menuMove'); }
      if (UI.up() || UI.down()) { this.lv = clamp(this.lv + (UI.up() ? 1 : -1), 1, 10); Sound.play('menuMove'); }
    }
    if (!Mouse.clicked) return;
    if (inRect(cloudBackRect)) return leave();
    for (const i of [0, 1]) {
      if (inRect(this.arrow(0, i))) { this.ci = ((this.ci + 1 + (i ? 1 : -1)) % (CHARS.length + 1) + CHARS.length + 1) % (CHARS.length + 1) - 1; Sound.play('menuMove'); }
      if (inRect(this.arrow(1, i))) { this.lv = clamp(this.lv + (i ? 1 : -1), 1, 10); Sound.play('menuMove'); }
    }
    this.acts.forEach(([a], i) => { if (inRect(this.btn(i))) this.run(a); });
  }
  draw(g) {
    const t = this.t;
    drawMenuBG(g, t, '#ffd84a');
    drawTitleText(g, 'ADMIN', W / 2, 70, 70, '#ffd84a', '#ff2a3a');
    g.font = `700 17px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffe9a8';
    g.fillText('Give a player mastery levels (unlocks colours) or arcade skins, look them up, set a new password, or ban.', W / 2, 120);
    DomIn.place(this.user, { x: W / 2 - 430, y: 160, w: 440, h: 50 }); DomIn.place(this.npw, { x: W / 2 + 30, y: 160, w: 400, h: 50 });
    const rows = [['FIGHTER', this.ci < 0 ? 'ALL FIGHTERS' : CHARS[this.ci].name], ['LEVEL', 'LV ' + this.lv + (this.lv >= 10 ? ' (all colours)' : this.lv >= 7 ? ' (3 colours)' : this.lv >= 4 ? ' (2 colours)' : this.lv >= 2 ? ' (1 colour)' : '')]];
    rows.forEach(([k, v], r) => {
      const a = this.arrow(r, 0), y = a.y + 25;
      g.font = `700 16px ${FONT_UI}`; g.textAlign = 'right'; g.fillStyle = '#cfc4ee'; g.fillText(k, a.x - 20, y);
      drawButton(g, a, '◀', null, inRect(a), t); drawButton(g, this.arrow(r, 1), '▶', null, inRect(this.arrow(r, 1)), t);
      g.font = `900 24px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText(v, W / 2, y);
    });
    this.acts.forEach(([, s], i) => drawButton(g, this.btn(i), s, null, inRect(this.btn(i)), t));
    if (this.out) cloudMsg(g, this.out, 600, this.isErr);
    drawButton(g, cloudBackRect, 'BACK', null, inRect(cloudBackRect), t);
    drawFooter(g, '←/→ fighter  ·  ↑/↓ level  ·  click a button  ·  ENTER in the name field: look up  ·  ESC: back');
  }
}

// ---------------- title screen: ACCOUNT chip (top left) ----------------
const ACCT_BTN = { x: 22, y: 22, w: 300, h: 46 };
{
  const TP = TitleScene.prototype, up = TP.update, dr = TP.draw;
  TP.update = function () {
    if (Cloud.enabled() && Mouse.clicked && inRect(ACCT_BTN)) { Sound.play('menuOk'); Mouse.clicked = false; go(new AccountScene()); return; }
    return up.call(this);
  };
  TP.draw = function (g) {
    dr.call(this, g);
    if (!Cloud.enabled()) return;
    const me = Cloud.on && Cloud.me;
    drawButton(g, ACCT_BTN, Cloud.on ? (Cloud.name || 'ACCOUNT') : 'LOGIN · RANKINGS', null, inRect(ACCT_BTN), this.t, me ? String(me.rating) : undefined);
    g.save(); g.font = `700 13px ${FONT_UI}`; g.textAlign = 'left'; g.fillStyle = '#e8dcff'; g.globalAlpha = 0.8;
    g.fillText(Cloud.on ? (me && me.rank ? `rank #${me.rank} · account & rankings` : 'account & rankings') : 'cloud save + online rankings', ACCT_BTN.x + 16, ACCT_BTN.y + ACCT_BTN.h + 16); g.restore();
  };
}
if (Cloud.on) setTimeout(() => Cloud.refresh(), 800);

// ---------------- ONLINE: exchange account names, report ranked results ----------------
{
  const rx = Net.rx, rs = Net.reset;
  Net.reset = function () { this.rival = null; this.acctSent = false; return rs.call(this); };
  Net.rx = function (d) {
    if (d && d.t === 'acct') { this.rival = typeof d.u === 'string' && /^[A-Za-z0-9_]{3,16}$/.test(d.u) ? d.u : null; this.rivalR = d.r | 0; return; }
    const r = rx.call(this, d);
    if (d && d.t === 'hello' && this.status === 'connected' && !this.acctSent) Net.sendAcct();
    return r;
  };
  Net.sendAcct = function () { this.acctSent = true; this.send({ t: 'acct', u: Cloud.on ? Cloud.name : null, r: Cloud.on && Cloud.me ? Cloud.me.rating : 0 }); };
  Net.ranked = () => !!(Cloud.on && Net.rival);
  const nsm = netStartMatch;
  netStartMatch = function (cfg, m) { Net.rankKey = `${Net.code}-${cfg.seed}-${m}`; Net.rankedNow = Net.ranked(); return nsm(cfg, m); };

  const NR = NetResultsScene.prototype, nu = NR.update, nd = NR.draw;
  NR.rankInit = function () {
    if (this.rk) return; this.rk = { s: Net.rankedNow ? 'sending' : Cloud.on ? 'rivalguest' : Cloud.enabled() ? 'guest' : 'off' };
    if (!Net.rankedNow) return;
    const key = Net.rankKey, me = this.bt.lp ? this.bt.p2 : this.bt.p1, rk = this.rk;
    const done = r => { Object.assign(rk, r, { s: r.status }); if (r.status === 'rated') { Sound.play('menuOk'); Cloud.refresh(); } };
    const poll = n => setTimeout(() => Cloud.result(key).then(r => r.status === 'pending' && n > 0 ? poll(n - 1) : done(r)).catch(() => n > 0 ? poll(n - 1) : done({ status: 'error' })), 1500);
    const send = n => Cloud.report(key, Net.rival, this.won, me.ch.id).then(r => r.status === 'pending' ? poll(12) : done(r)).catch(e => n > 0 ? setTimeout(() => send(n - 1), 2000) : done({ status: 'error', err: cloudErr(e) }));
    send(2);
  };
  NR.update = function () { this.rankInit(); return nu.call(this); };
  NR.draw = function (g) {
    nd.call(this, g); this.rankInit();
    const k = this.rk, s = k.s; if (s === 'off') return;
    const txt = {
      sending: 'RANKED · sending result…', pending: 'RANKED · waiting for your rival’s result…',
      rated: `RANKED · ${k.delta >= 0 ? '+' : ''}${k.delta} → ${k.rating}`, mismatch: 'Not ranked: the two results did not match.',
      limit: 'Not ranked: max 5 ranked matches per day vs the same player.', unranked: 'Not ranked.', unknown: 'Not ranked.',
      error: k.err || 'Ranked result could not be sent.', guest: 'Log in (ACCOUNT on the title screen) to play ranked.', rivalguest: 'Unranked: your rival is not logged in.',
    }[s] || '';
    g.save(); g.translate(330, 178); g.rotate(-0.08);
    g.font = `italic 900 ${s === 'rated' ? 30 : 18}px ${s === 'rated' ? FONT_T : FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const w = g.measureText(txt).width + 36; g.fillStyle = 'rgba(8,4,20,0.85)'; g.fillRect(-w / 2, -22, w, 44);
    g.strokeStyle = s === 'rated' ? (k.delta >= 0 ? '#5affb0' : '#ff7a9a') : 'rgba(255,255,255,0.3)'; g.lineWidth = 2; g.strokeRect(-w / 2, -22, w, 44);
    g.fillStyle = s === 'rated' ? (k.delta >= 0 ? '#7affc0' : '#ff9ab0') : '#e8dcff'; g.fillText(txt, 0, 1);
    if (Net.rival && s !== 'guest') { g.font = `700 14px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.fillText('vs ' + Net.rival, 0, 38); }
    g.restore();
  };

  // lobby + select: show whether the match will be ranked
  const LD = NetLobbyScene.prototype.draw;
  NetLobbyScene.prototype.draw = function (g) {
    LD.call(this, g);
    if (!Cloud.enabled() || this.mode !== 'menu') return;
    g.save(); g.font = `700 16px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = Cloud.on ? '#ffd84a' : '#cfc4ee';
    g.fillText(Cloud.on ? `Logged in as ${Cloud.name}: matches vs logged-in players count for the RANKINGS.` : 'Tip: log in (ACCOUNT on the title screen) to play ranked matches.', W / 2, 560); g.restore();
  };
  const SD = NetSelectScene.prototype.draw;
  NetSelectScene.prototype.draw = function (g) {
    SD.call(this, g);
    if (!Cloud.enabled()) return;
    const txt = Net.ranked() ? `RANKED  ·  ${Cloud.name} vs ${Net.rival}${Net.rivalR ? ' (' + Net.rivalR + ')' : ''}` : Cloud.on ? 'UNRANKED  ·  rival not logged in' : 'UNRANKED  ·  log in for ranked';
    g.save(); g.font = `900 15px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const w = g.measureText(txt).width + 28; g.fillStyle = 'rgba(8,4,20,0.85)'; g.fillRect(W / 2 - w / 2, H - 62, w, 24);
    g.fillStyle = Net.ranked() ? '#ffd84a' : '#cfc4ee'; g.fillText(txt, W / 2, H - 50); g.restore();
  };
}
