// ===================== FRIENDS · ONLINE STATUS · MATCH INVITES =====================
// Needs an account (09e_account.js) and cloud/supabase_friends.sql on the Supabase project.
//  · Add a friend by account name; it becomes a friendship once both added each other.
//  · The game pings sb_friends every 20 s (every 4 s while the FRIENDS screen / an invite is open);
//    a friend counts as online when their game pinged in the last 50 s. Hidden tabs don't ping.
//  · INVITE opens an online room (CREATE ROOM) and sends its 6-digit code to the friend; they get a
//    pop-up (any menu) or see it at the top of their FRIENDS list and JOIN with one click.
// Nothing here touches the battle sim (fetch callbacks only), so lockstep stays safe.
Object.assign(CLOUD_ERR, {
  SELF: "That's you!", FRIEND_LIMIT: 'Your friends list is full (100).', NOT_FRIENDS: 'You can only invite friends (both added each other).',
  BAD_ROOM: 'Invalid room.', MISSING_FN: 'Friends are not set up on the server yet (supabase_friends.sql).',
});

const Friends = {
  d: null, who: null, err: '', at: 0, busy: false, seen: new Set(), toast: null,
  get list() { return this.d && this.who === Cloud.name ? this.d : null; },
  online() { const d = this.list; return d ? d.friends.filter(f => f.online).length : 0; },
  requests() { const d = this.list; return d ? d.incoming.length : 0; },
  status() { return (typeof Net !== 'undefined' && Net.status === 'connected') || scene instanceof Battle ? 'match' : 'menu'; },
  async poll() {
    if (!Cloud.on || this.busy) return;
    this.busy = true; this.at = Date.now();
    const who = Cloud.name;
    try { const d = await Cloud.rpc('sb_friends', { p_token: Cloud.tok, p_status: this.status() }); if (d && d.friends && who === Cloud.name) { this.d = d; this.who = who; this.err = ''; this.onData(); } }
    catch (e) {
      this.err = cloudErr(e);
      if (e.message === 'SESSION_EXPIRED' || e.message === 'BANNED') { Cloud.err = this.err; Cloud.logout(); this.d = null; }
    }
    this.busy = false;
  },
  onData() {
    const inv = this.d.invites;
    for (const iv of inv) { const k = iv.from + ':' + iv.room; if (!this.seen.has(k)) { this.seen.add(k); this.toast = { ...iv, t: 0 }; if (this.toastOk()) Sound.play('menuOk'); } }
    if (this.toast && !inv.some(i => i.from === this.toast.from && i.room === this.toast.room)) this.toast = null;
  },
  tick() {
    if (!Cloud.on) { this.d = null; this.toast = null; return; }
    if (document.hidden) return;
    const fast = scene instanceof FriendsScene || scene instanceof FriendInviteScene;
    if (Date.now() - this.at >= (fast ? 4000 : 20000)) this.poll();
  },
  async call(fn, args) { const r = await Cloud.rpc(fn, { p_token: Cloud.tok, ...args }); this.at = 0; return r; },
  answer(iv, yes) {
    Cloud.rpc('sb_invite_answer', { p_token: Cloud.tok, p_from: iv.from, p_accept: yes }).catch(() => { });
    if (this.d) this.d.invites = this.d.invites.filter(i => i !== iv && !(i.from === iv.from && i.room === iv.room));
    if (this.toast && this.toast.from === iv.from) this.toast = null;
    if (yes) { Sound.play('menuOk'); Net.close(); go(new NetLobbyScene({ join: iv.room })); } else Sound.play('menuBack');
  },
  // invite pop-up: on every menu screen, not in a fight / online room / the FRIENDS screen (it lists them)
  toastOk() {
    return !(scene instanceof Battle) && !(scene instanceof FriendsScene) && Net.status !== 'connected' &&
      !(scene instanceof NetLobbyScene && scene.mode !== 'menu');
  },
  tRect() { return { x: W / 2 - 330, y: 74, w: 660, h: 70 }; },
  tBtn(i) { const r = this.tRect(); return { x: r.x + r.w - (i ? 120 : 270), y: r.y + 15, w: i ? 100 : 140, h: 40 }; },
  toastInput() {
    const ts = this.toast; if (!ts || !this.toastOk()) return;
    if (++ts.t > 60 * 90) { this.toast = null; return; }
    if (!Mouse.clicked) return;
    if (inRect(this.tBtn(0))) { Mouse.clicked = false; this.answer(ts, true); }
    else if (inRect(this.tBtn(1))) { Mouse.clicked = false; this.answer(ts, false); }
  },
  toastDraw(g) {
    const ts = this.toast; if (!ts || !this.toastOk()) return;
    const r = this.tRect(), a = Math.min(1, ts.t / 12);
    g.save(); g.globalAlpha = a;
    panel(g, r.x, r.y, r.w, r.h, 'rgba(14,8,30,0.95)', '#ffd84a');
    g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = `900 20px ${FONT_UI}`; g.fillStyle = '#ffd84a'; g.fillText('⚔ ' + ts.from, r.x + 20, r.y + 24);
    g.font = `700 15px ${FONT_UI}`; g.fillStyle = '#e8dcff'; g.fillText('invites you to an ONLINE 1 VS 1!', r.x + 20, r.y + 48);
    drawButton(g, this.tBtn(0), 'JOIN', null, inRect(this.tBtn(0)) || (ts.t >> 4) % 2 === 0, ts.t);
    drawButton(g, this.tBtn(1), 'NO', null, inRect(this.tBtn(1)), ts.t);
    g.restore();
  },
};
setInterval(() => Friends.tick(), 1000);
{
  const pp = Pad.poll, pd = Pad.draw;
  Pad.poll = function () { const r = pp.call(this); Friends.toastInput(); return r; };
  Pad.draw = function (g) { const r = pd.call(this, g); Friends.toastDraw(g); return r; };
}

// ---------------- FRIENDS screen ----------------
class FriendsScene {
  constructor(o = {}) {
    this.t = 0; this.sel = 0; this.act = 0; this.msg = o.msg || ''; this.isErr = !!o.err; this.msgT = 0; this.confirm = null; this.busy = false;
    this.back = o.back || (() => new TitleScene());
    Music.play('menu');
    Friends.at = 0;
    if (Cloud.on) { this.inp = DomIn.make('text', 'add a friend: account name', 16, () => this.add()); this.inp.autocomplete = 'off'; }
  }
  dispose() { DomIn.kill(this.inp); this.inp = null; }
  say(m, err) { this.msg = m; this.isErr = !!err; this.msgT = 0; }
  rows() {
    const d = Friends.list; if (!d) return [];
    const out = [];
    for (const iv of d.invites) out.push({ k: 'inv', name: iv.from, iv, sub: 'invites you to an ONLINE 1 VS 1!', acts: [['join', 'JOIN'], ['no', 'NO']] });
    for (const n of d.incoming) out.push({ k: 'req', name: n, sub: 'wants to be your friend', acts: [['acc', 'ACCEPT'], ['rem', 'DECLINE']] });
    for (const f of d.friends) {
      const free = f.online && f.status !== 'match';
      out.push({ k: 'fr', name: f.name, f, sub: !f.online ? 'offline' : f.status === 'match' ? 'ONLINE · in a fight' : 'ONLINE', acts: free ? [['invite', 'INVITE'], ['rem', 'REMOVE']] : [['rem', 'REMOVE']] });
    }
    for (const n of d.outgoing) out.push({ k: 'out', name: n, sub: 'request sent · waiting for them to add you back', acts: [['rem', 'CANCEL']] });
    return out;
  }
  async add() {
    if (!this.inp || this.busy) return;
    const n = this.inp.value.trim();
    if (!/^[A-Za-z0-9_]{3,16}$/.test(n)) return this.say(CLOUD_ERR.BAD_NAME, true);
    this.busy = true;
    try {
      const r = await Friends.call('sb_friend_add', { p_name: n });
      this.inp.value = ''; Sound.play('menuOk');
      this.say(r.status === 'friends' ? `You and ${r.name} are friends now!` : `Friend request sent to ${r.name}. They need to add you too.`);
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    } catch (e) { Sound.play('menuBack'); this.say(cloudErr(e), true); }
    this.busy = false;
  }
  async run(row, a) {
    if (!row || this.busy) return;
    if (a === 'join' || a === 'no') return Friends.answer(row.iv, a === 'join');
    if (a === 'invite') { Sound.play('menuOk'); go(new FriendInviteScene(row.name, this.back)); return; }
    if (a === 'rem' && row.k === 'fr' && this.confirm !== row.name) { this.confirm = row.name; Sound.play('menuMove'); this.say(`Remove ${row.name}? Press REMOVE again.`, true); return; }
    this.busy = true; this.confirm = null;
    try {
      if (a === 'acc') { await Friends.call('sb_friend_add', { p_name: row.name }); this.say(`You and ${row.name} are friends now!`); Sound.play('menuOk'); }
      if (a === 'rem') { await Friends.call('sb_friend_remove', { p_name: row.name }); this.say(row.k === 'fr' ? `${row.name} removed.` : row.k === 'req' ? 'Request declined.' : 'Request cancelled.'); Sound.play('menuBack'); }
      await Friends.poll();
    } catch (e) { Sound.play('menuBack'); this.say(cloudErr(e), true); }
    this.busy = false;
  }
  // layout
  get top() { return Math.max(0, Math.min(this.sel - 3, this.rows().length - 8)); }
  rowY(i) { return 236 + (i - this.top) * 46; }
  actRect(i, j, n) { return { x: 1170 - (n - j) * 150, y: this.rowY(i) + 4, w: 140, h: 36 }; }
  addRect() { return { x: W / 2 + 130, y: 164, w: 200, h: 46 }; }
  fieldRect() { return { x: W / 2 - 330, y: 164, w: 440, h: 46 }; }
  loginRect() { return { x: W / 2 - 160, y: 360, w: 320, h: 54 }; }
  leave() { Sound.play('menuBack'); go(this.back()); }
  update() {
    this.t++; this.msgT++;
    if (!Cloud.on) {
      if (Keys.pressed.has('Escape') || UI.back() || (Mouse.clicked && inRect(cloudBackRect))) return this.leave();
      if (Cloud.enabled() && (UI.ok() || (Mouse.clicked && inRect(this.loginRect())))) { Sound.play('menuOk'); const b = this.back; go(new AccountScene({ back: () => new FriendsScene({ back: b }) })); }
      return;
    }
    const rows = this.rows(), typing = domTyping();
    if (this.sel >= rows.length) this.sel = Math.max(0, rows.length - 1);
    if (!typing) {
      if (Keys.pressed.has('Escape') || UI.back()) return this.leave();
      if (UI.up() && rows.length) { this.sel = (this.sel + rows.length - 1) % rows.length; this.act = 0; this.confirm = null; Sound.play('menuMove'); }
      if (UI.down() && rows.length) { this.sel = (this.sel + 1) % rows.length; this.act = 0; this.confirm = null; Sound.play('menuMove'); }
      const r = rows[this.sel];
      if (r && (UI.left() || UI.right())) { this.act = (this.act + (UI.right() ? 1 : r.acts.length - 1)) % r.acts.length; Sound.play('menuMove'); }
      if (r && UI.ok()) return this.run(r, r.acts[Math.min(this.act, r.acts.length - 1)][0]);
    }
    if (!Mouse.clicked) return;
    if (inRect(cloudBackRect)) return this.leave();
    if (inRect(this.addRect())) return this.add();
    const top = this.top;
    for (let i = top; i < Math.min(rows.length, top + 8); i++)
      rows[i].acts.forEach(([a], j) => { if (inRect(this.actRect(i, j, rows[i].acts.length))) { this.sel = i; this.act = j; this.run(rows[i], a); } });
  }
  draw(g) {
    const t = this.t;
    drawMenuBG(g, t, '#18c88a');
    drawTitleText(g, 'FRIENDS', W / 2, 76, 72, '#ffd84a', '#18a85a');
    g.font = `700 18px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#9affd0';
    g.fillText('フレンド · see who is online · invite to ONLINE 1 VS 1', W / 2, 128);
    if (!Cloud.on) {
      cloudMsg(g, Cloud.enabled() ? 'Log in to your account to add friends.' : 'Accounts are not available in this version.', 290, true);
      if (Cloud.enabled()) drawButton(g, this.loginRect(), 'LOG IN', null, true, t);
      drawButton(g, cloudBackRect, 'BACK', null, inRect(cloudBackRect), t);
      drawFooter(g, 'ENTER: log in  ·  ESC: back'); return;
    }
    if (this.inp) DomIn.place(this.inp, this.fieldRect());
    drawButton(g, this.addRect(), this.busy ? '…' : 'ADD', null, inRect(this.addRect()), t);
    panel(g, 90, 222, W - 180, 382);
    const rows = this.rows(), d = Friends.list, top = this.top;
    g.textBaseline = 'middle';
    if (!d) { g.textAlign = 'center'; g.font = `700 20px ${FONT_UI}`; g.fillStyle = '#fff'; g.fillText(Friends.err || 'Loading' + '.'.repeat(1 + (t >> 4) % 3), W / 2, 410); }
    else if (!rows.length) {
      g.textAlign = 'center'; g.font = `700 20px ${FONT_UI}`; g.fillStyle = '#fff'; g.fillText('No friends yet. Type a friend’s account name above and press ADD.', W / 2, 390);
      g.font = `600 16px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.fillText(`Your name to share: ${Cloud.name}`, W / 2, 426);
    }
    for (let i = top; i < Math.min(rows.length, top + 8); i++) {
      const r = rows[i], y = this.rowY(i), sel = i === this.sel, cy = y + 22;
      if (sel) { g.fillStyle = 'rgba(255,216,74,0.16)'; g.fillRect(100, y, W - 200, 44); } else if (i % 2) { g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(100, y, W - 200, 44); }
      const on = r.k === 'fr' ? r.f.online : r.k === 'inv';
      g.beginPath(); g.arc(126, cy, 8, 0, Math.PI * 2);
      g.fillStyle = r.k === 'inv' ? '#ffd84a' : r.k === 'req' ? '#7ad8ff' : r.k === 'out' ? '#9a90c0' : on ? (r.f.status === 'match' ? '#ff9a3a' : '#3aff8a') : '#5a5470'; g.fill();
      g.textAlign = 'left';
      g.font = `800 20px ${FONT_UI}`; g.fillStyle = r.k === 'inv' ? '#ffd84a' : '#ffffff'; g.fillText(r.name, 146, cy);
      g.font = `600 15px ${FONT_UI}`; g.fillStyle = on ? (r.k === 'fr' && r.f.status === 'match' ? '#ffc08a' : '#9affc0') : '#cfc4ee'; g.fillText(r.sub, 370, cy);
      if (r.k === 'fr') {
        const ch = r.f.main && chById(r.f.main);
        drawTierBadge(g, 578, cy + 1, 10, tierOf(r.f.rating));
        g.font = `900 17px ${FONT_UI}`; g.fillStyle = tierOf(r.f.rating).c; g.textAlign = 'left'; g.fillText(String(r.f.rating), 594, cy);
        if (ch) { g.font = `600 15px ${FONT_UI}`; g.fillStyle = ch.colors.accent; g.fillText(ch.name, 660, cy); }
      }
      r.acts.forEach(([a, s], j) => {
        const rr = this.actRect(i, j, r.acts.length), hot = inRect(rr) || (sel && j === Math.min(this.act, r.acts.length - 1));
        cloudBtn(g, rr, a === 'rem' && this.confirm === r.name ? 'SURE?' : s, t, !(a === 'invite' && Net.status === 'connected'));
        if (hot) { g.save(); g.strokeStyle = '#ffd84a'; g.lineWidth = 2; g.strokeRect(rr.x - 2, rr.y - 2, rr.w + 4, rr.h + 4); g.restore(); }
      });
    }
    if (rows.length > 8) { g.textAlign = 'center'; g.font = `700 14px ${FONT_UI}`; g.fillStyle = '#cfc4ee'; g.fillText(`${top + 1}–${Math.min(rows.length, top + 8)} of ${rows.length}`, W / 2, 594); }
    if (d) { g.textAlign = 'right'; g.font = `700 15px ${FONT_UI}`; g.fillStyle = '#9affc0'; g.fillText(`● ${Friends.online()} online`, W - 100, 640); g.fillStyle = '#cfc4ee'; g.textAlign = 'left'; g.fillText(`You: ${Cloud.name}`, 240, 640); }
    if (this.msg && this.msgT < 480) cloudMsg(g, this.msg, 672, this.isErr);
    drawButton(g, cloudBackRect, 'BACK', null, inRect(cloudBackRect), t);
    drawFooter(g, '↑/↓ friend  ·  ←/→ + ENTER: action  ·  mouse / tap  ·  ESC: back');
  }
}

// ---------------- INVITE: open a room and send its code to the friend ----------------
class FriendInviteScene extends NetLobbyScene {
  constructor(name, back) {
    super(); this.friend = name; this.fback = back; this.inv = 'wait'; this.error = '';
    Net.host(); this.mode = 'hosting';
  }
  send() {
    const code = Net.code; this.inv = 'sending';
    Friends.call('sb_invite', { p_name: this.friend, p_room: code })
      .then(() => { if (this.inv === 'sending') { this.inv = 'sent'; this.sentAt = Date.now(); } })
      .catch(e => { this.inv = 'err'; this.error = cloudErr(e); });
  }
  cancel() { if (this.inv === 'sent' || this.inv === 'sending') Cloud.rpc('sb_invite', { p_token: Cloud.tok, p_name: this.friend, p_room: '' }).catch(() => { }); this.inv = 'off'; }
  update() {
    if (this.inv === 'wait' && Net.status === 'waiting' && Net.code && Cloud.on) this.send();
    if (this.inv === 'sent') {
      const s = Friends.list && Friends.list.sent.find(x => x.to.toLowerCase() === this.friend.toLowerCase() && x.room === Net.code);
      if (s && s.ans === 'no') { this.inv = 'no'; Sound.play('menuBack'); }
      else if (Date.now() - this.sentAt > 75000) this.send();   // keep the invite alive while the room waits
    }
    const m = this.mode; super.update();
    if (scene !== this) { if (Net.status !== 'connected') this.cancel(); return; }
    if (m !== 'menu' && this.mode === 'menu') {
      const err = this.error; this.cancel(); Net.close();
      go(new FriendsScene({ back: this.fback, msg: err, err: !!err }));
    }
  }
  draw(g) {
    super.draw(g);
    if (this.mode !== 'hosting') return;
    const txt = { wait: 'Opening a room…', sending: `Inviting ${this.friend}…`, sent: `Invite sent to ${this.friend}! Waiting for them to join…`, no: `${this.friend} said no.`, err: '' }[this.inv];
    if (!txt) return;
    g.save(); g.fillStyle = 'rgba(8,4,20,0.92)'; g.fillRect(W / 2 - 330, 586, 660, 40); g.strokeStyle = this.inv === 'no' ? '#ff7a9a' : '#ffd84a'; g.strokeRect(W / 2 - 330, 586, 660, 40);
    g.font = `800 18px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = this.inv === 'no' ? '#ffd0d8' : '#ffd84a'; g.fillText(txt, W / 2, 607); g.restore();
  }
}

// ---------------- entry points: ONLINE lobby menu, ACCOUNT menu, title chip ----------------
{
  const LP = NetLobbyScene.prototype, lu = LP.update, ld = LP.draw;
  LP.friendMenu = function () {
    if (this.frAdded || !Cloud.enabled() || this instanceof FriendInviteScene) return; this.frAdded = true;
    const m = this.menu; m.items.splice(2, 0, { id: 'friends', label: 'FRIENDS', jp: 'フレンド', value: Friends.list ? `${Friends.online()} ON` : undefined });
    m.y = 296; m.h = 48; m.gap = 10;
    const mu = m.update.bind(m);
    m.update = () => { const it = mu(); if (it && it.id === 'friends') { Net.close(); Sound.play('menuOk'); go(new FriendsScene({ back: () => new NetLobbyScene() })); return null; } return it; };
  };
  LP.update = function () { this.friendMenu(); return lu.call(this); };
  LP.draw = function (g) {
    this.friendMenu();
    const fi = this.menu.items.find(i => i.id === 'friends'); if (fi) fi.value = Friends.list ? `${Friends.online()} ON` : undefined;
    return ld.call(this, g);
  };

  const AP = AccountScene.prototype, ab = AP.build;
  AP.build = function () {
    ab.call(this);
    if (!Cloud.on) return;
    const m = this.menu; m.items.splice(1, 0, { id: 'friends', label: 'FRIENDS', jp: 'フレンド' });
    const mu = m.update.bind(m), back = this.back;
    m.update = () => { const it = mu(); if (it && it.id === 'friends') { Sound.play('menuOk'); go(new FriendsScene({ back: () => new AccountScene({ back }) })); return null; } return it; };
  };

  const TP = TitleScene.prototype, td = TP.draw;
  TP.draw = function (g) {
    td.call(this, g);
    if (!Cloud.on || !Friends.list) return;
    const n = Friends.online(), rq = Friends.requests();
    g.save(); g.font = `800 13px ${FONT_UI}`; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillStyle = n ? '#5affb0' : '#a89ec8'; g.fillText(`● ${n} friend${n === 1 ? '' : 's'} online${rq ? `  ·  ${rq} friend request${rq === 1 ? '' : 's'}` : ''}`, ACCT_BTN.x + 16, ACCT_BTN.y + ACCT_BTN.h + 36);
    g.restore();
  };
}
