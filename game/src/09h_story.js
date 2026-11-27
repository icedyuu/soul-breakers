// ---------------- STORY MODE (Arcade) ----------------
// Every ARCADE run tells a short story: a scene before fight 1 (the fighter's motive), a rival scene before the
// final fight (the rival is always the last opponent), and an ending per fighter after ARCADE CLEAR.
// Lines: s = 'p' (player's fighter), 'r' (opponent), null (narration). Any key / click advances, ESC / SKIP skips the scene.
// The Hollow never speaks aloud: his lines are telepathy < ... >.
const STORY = {
  kazuma: { riv: 'goro',
    pre: [{ s: 'p', t: 'Word is the strongest fighters in the land are gathering. Good.' }, { s: 'p', t: 'My fists have been itching all year. Let\'s find out who burns brightest!' }],
    vs: [{ s: 'r', t: 'KAZUMA! You still owe me a rematch from the mountain!' }, { s: 'p', t: 'Ha! I was hoping it\'d be you at the end, Goro.' }, { s: 'r', t: 'This time I break you AND your little flame!' }],
    end: [{ s: null, t: 'Kazuma won every fight, but he never cared about the trophy.' }, { s: 'p', t: 'You were all incredible. Same time next year?' }, { s: null, t: 'At dawn he was already training again, the fire in his fists burning brighter than ever.' }] },
  yoru: { riv: 'kuchi',
    pre: [{ s: 'p', t: 'A new contract. Missing people, all taken at night.' }, { s: 'p', t: 'Whoever is behind it... the shadows will find them first.' }],
    vs: [{ s: 'r', t: 'Excuse me... do you think I\'m pretty?' }, { s: 'p', t: 'So you are the one stalking these streets.' }, { s: 'r', t: 'Such a cold answer. Let me give you a smile like mine.' }],
    end: [{ s: null, t: 'The night streets fell quiet. The missing came home one by one.' }, { s: 'p', t: 'Contract complete. Nobody needs to know my name.' }, { s: null, t: 'Only a single lily petal was left behind on the empty rooftop.' }] },
  sera: { riv: 'lunaria',
    pre: [{ s: 'p', t: 'The sky has been dark for nine days. That is no ordinary storm.' }, { s: 'p', t: 'Someone is swallowing the light. I will find them.' }],
    vs: [{ s: 'r', t: 'A little storm mage, come to light a candle in my night?' }, { s: 'p', t: 'Give back the sun, Lunaria.' }, { s: 'r', t: 'Take it from me. If your lightning can reach the moon.' }],
    end: [{ s: null, t: 'Sera\'s Celestial Judgement split the endless night in two.' }, { s: 'p', t: 'Lightning and moonlight... maybe the sky has room for both.' }, { s: null, t: 'The sun rose. For the first time in days, people stopped to watch the clouds.' }] },
  goro: { riv: 'borgar',
    pre: [{ s: 'p', t: 'RAAAGH! They say there is a warrior who can\'t be moved!' }, { s: 'p', t: 'I will see for myself. Then I will move him. Into the ground!' }],
    vs: [{ s: 'r', t: 'So the oni came down from his mountain.' }, { s: 'p', t: 'BORGAR! They call you the unbreakable one. I call that a challenge!' }, { s: 'r', t: 'Stone remembers every fool who said that. Come.' }],
    end: [{ s: null, t: 'Two giants fell back laughing into the dust, both covered in bruises.' }, { s: 'p', t: 'HA! You moved! I saw it! Half a step!' }, { s: null, t: 'Goro returned to his mountain with a new rune carved in his cleaver: a gift from a rival.' }] },
  frogs: { riv: 'buzzu',
    pre: [{ s: 'p', t: 'Pipi: Kero! A tournament! Gamaoh: Hmph. Prize money. Sensei: ...and glory, my students.' }, { s: 'p', t: 'Pipi: FROG TRINITY, HOP OUT!' }],
    vs: [{ s: 'r', t: 'Vrrrm... VRRRRMMM!' }, { s: 'p', t: 'Pipi: Is that a dog? Gamaoh: That is a chainsaw. Sensei: It is both. Stay calm.' }, { s: 'r', t: 'Arf! VRRRRRM!' }],
    end: [{ s: null, t: 'The Frog Trinity won the whole tournament and spent the prize money on a new pond.' }, { s: 'p', t: 'Pipi: Best. Pond. Ever! Gamaoh: Hmph. It is acceptable. Sensei: Lessons resume tomorrow.' }, { s: null, t: 'Buzzu visits sometimes. He is not allowed in the pond.' }] },
  conductor: { riv: 'tokine',
    pre: [{ s: 'p', t: 'Every train in the city is running late. Every clock has stopped at midnight.' }, { s: 'p', t: 'Delays will not be tolerated. I will find the cause.' }],
    vs: [{ s: 'r', t: 'Ufufu. Do you like my clocks? I stopped them all just for fun.' }, { s: 'p', t: 'You are holding up eight hundred passengers.' }, { s: 'r', t: 'Then let\'s see whose timetable wins.' }],
    end: [{ s: null, t: 'The clocks started ticking again at exactly 06:00.' }, { s: 'p', t: 'The Final Express departs on schedule. Please stand clear.' }, { s: null, t: 'For the first time in a week, every train in the city ran on time.' }] },
  cardmaster: { riv: 'yamika',
    pre: [{ s: 'p', t: 'Twenty legendary fighters. Twenty cards my collection is still missing.' }, { s: 'p', t: 'Let us see which of them fate deals me.' }],
    vs: [{ s: 'r', t: 'Halt! You dare collect the Dark Flame Master like a common card?!' }, { s: 'p', t: 'Not common. Ultra rare, if you can prove it.' }, { s: 'r', t: 'The seal on my eye trembles! Prepare yourself!' }],
    end: [{ s: null, t: 'Fudagami\'s album is complete: a card for every fighter he defeated.' }, { s: 'p', t: 'A full set. How... unexpectedly empty it feels.' }, { s: null, t: 'Then a new card appeared in his deck, blank, waiting for a fighter he has not met yet.' }] },
  nue: { riv: 'hollow',
    pre: [{ s: 'p', t: 'The beasts inside me are restless lately. Something calls them.' }, { s: 'p', t: 'Let\'s go find out what. Maybe they\'ll finally get a good meal~' }],
    vs: [{ s: 'r', t: '< ...Five voices. Five hungry voices inside you. >' }, { s: 'p', t: 'Wait, you can hear them? Uh, they don\'t like that.' }, { s: 'r', t: '< I could quiet them. Forever. >' }],
    end: [{ s: null, t: 'Nue won, and The Hollow did not seal a single beast.' }, { s: 'p', t: 'Huh. They\'re all purring. I think they just wanted someone to listen.' }, { s: null, t: 'That night, for the first time in years, Nue slept without dreaming of claws.' }] },
  saint: { riv: 'reika',
    pre: [{ s: 'p', t: 'The strongest blood flows in this tournament. I can smell it.' }, { s: 'p', t: 'A saint must feed. Who will offer themselves first?' }],
    vs: [{ s: 'r', t: 'A vampire who thinks she owns everyone. How familiar.' }, { s: 'p', t: 'Reika. Your will is strong. Your blood must be exquisite.' }, { s: 'r', t: 'Kneel. I will not ask twice.' }],
    end: [{ s: null, t: 'The Blood Saint stood alone in her cathedral, sated at last.' }, { s: 'p', t: 'Such lovely offerings. I will remember each of them.' }, { s: null, t: 'Every year since, a red rose arrives for every fighter she defeated.' }] },
  borgar: { riv: 'goro',
    pre: [{ s: 'p', t: 'The runes on my arms glow when a worthy foe is near.' }, { s: 'p', t: 'They have not stopped glowing in weeks. Good.' }],
    vs: [{ s: 'r', t: 'BORGAR! The mountain that doesn\'t move! I came to move you!' }, { s: 'p', t: 'Many oni have tried. Their names are carved on my hammer.' }, { s: 'r', t: 'Then carve mine BIG!' }],
    end: [{ s: null, t: 'Borgar did not move. Not once, the entire tournament.' }, { s: 'p', t: 'Twenty names. Twenty new runes. The stone will remember all of you.' }, { s: null, t: 'He carved the last rune for Goro, slightly larger than the others.' }] },
  buzzu: { riv: 'reika',
    pre: [{ s: 'p', t: 'Vrrm? ...Sniff sniff. VRRRM!' }, { s: null, t: 'Buzzu smells food. Lots of food. And a tournament full of strong fighters.' }],
    vs: [{ s: 'r', t: 'There you are. Come here, devil dog. Heel.' }, { s: 'p', t: 'Grrrrr... vrrrRRRM!' }, { s: 'r', t: 'I said heel. You belong to me.' }],
    end: [{ s: null, t: 'Buzzu won! Nobody was quite sure how.' }, { s: 'p', t: 'Arf! Arf! VRRRRM!' }, { s: null, t: 'His prize: a whole tray of bread with jam. He ate the tray too.' }] },
  reika: { riv: 'buzzu',
    pre: [{ s: 'p', t: 'Twenty fighters, twenty wills that do not belong to me. Yet.' }, { s: 'p', t: 'By the end of this tournament, they will all obey.' }],
    vs: [{ s: 'r', t: 'VRRRM! VRRRRRM!' }, { s: 'p', t: 'The one dog that never listens. Sit.' }, { s: 'r', t: 'Arf! (does not sit)' }],
    end: [{ s: null, t: 'One by one, every fighter bowed before the Control Devil.' }, { s: 'p', t: 'Good. Now, all of you... stay.' }, { s: null, t: 'Buzzu sat down too. Reika smiled, just a little, when no one was looking.' }] },
  yamika: { riv: 'honored',
    pre: [{ s: 'p', t: 'Fools! The darkness sealed in my right eye demands a worthy sacrifice!' }, { s: 'p', t: 'I shall defeat them all and prove the power of the Wicked Eye!' }],
    vs: [{ s: 'r', t: 'Cool eyepatch. Mine\'s a blindfold, though.' }, { s: 'p', t: 'You! The so-called strongest! Your Infinity is no match for the Dark Flame!' }, { s: 'r', t: 'Alright, alright. Show me what that eye can do.' }],
    end: [{ s: null, t: 'Against all odds, the Wicked Eye stood victorious.' }, { s: 'p', t: 'Bwahaha! Behold! Even the honored one kneels before the Dark Flame Master!' }, { s: null, t: 'Kuon later insisted he tripped. Yamika had the photo framed.' }] },
  lunaria: { riv: 'sera',
    pre: [{ s: 'p', t: 'The night has grown short. The sun dares to linger.' }, { s: 'p', t: 'I will take every hour of daylight back. Starting with the strongest.' }],
    vs: [{ s: 'r', t: 'Lunaria. The sky has been dark for nine days because of you.' }, { s: 'p', t: 'Because of me, it is finally beautiful.' }, { s: 'r', t: 'Then my storm will tear your night apart.' }],
    end: [{ s: null, t: 'The moon rose and did not set.' }, { s: 'p', t: 'Kneel, world. The night has always been mine.' }, { s: null, t: 'Under the eternal moon, the stars shone brighter than anyone had ever seen.' }] },
  honored: { riv: 'hollow',
    pre: [{ s: 'p', t: 'A tournament of the strongest? Cute.' }, { s: 'p', t: 'I\'ll go easy on them. Probably. Someone has to make this interesting.' }],
    vs: [{ s: 'r', t: '< ...Infinity. I can hear it humming in your head. >' }, { s: 'p', t: 'Ooh, a telepath. So you\'re the one who seals techniques.' }, { s: 'r', t: '< Yours would be the loudest fragment I have ever carried. >' }],
    end: [{ s: null, t: 'Kuon won without a scratch, as always.' }, { s: 'p', t: 'Throughout heaven and earth, I alone am... huh. Kind of lonely up here.' }, { s: null, t: 'He started teaching the losers his tricks. They are still waiting for him to go easy on them.' }] },
  hollow: { riv: 'honored',
    pre: [{ s: null, t: 'He hears every fighter long before he sees them: their fears, their hunger, their abilities.' }, { s: 'p', t: '< ...So many voices. One of them has to be strong enough. >' }],
    vs: [{ s: 'r', t: 'So you\'re the one sealing everyone\'s powers. My turn?' }, { s: 'p', t: '< Your Infinity is the loudest thing I have ever heard. >' }, { s: 'r', t: 'Then come and try to seal it.' }],
    end: [{ s: null, t: 'The tournament was over. The noise of every sealed psyche settled in his head.' }, { s: null, t: 'Among the fragments, one voice was clearer than all the others. Hers.' }, { s: 'p', t: '< ...I know. I am still here, too. >' }, { s: null, t: 'He walked home in silence. He never says anything aloud. He never has to.' }] },
  kanae: { riv: 'tokine',
    pre: [{ s: 'p', t: 'A tournament? Ugh, so many smug faces.' }, { s: 'p', t: 'Perfect. Let\'s ruin all of their days.' }],
    vs: [{ s: 'r', t: 'Kanae~ I already know how this ends. You lose.' }, { s: 'p', t: 'You always say that. You were wrong last time, too.' }, { s: 'r', t: 'Was I? Let\'s play again and see.' }],
    end: [{ s: null, t: 'Kanae won, and Tokine actually looked surprised.' }, { s: 'p', t: 'There. Your clock was wrong. Admit it.' }, { s: null, t: 'Tokine never admitted it. They had tea together anyway, thorns and all.' }] },
  tokine: { riv: 'kanae',
    pre: [{ s: 'p', t: 'I have already seen every fight of this tournament.' }, { s: 'p', t: 'Still... it\'s more fun to play it out. Shall we?' }],
    vs: [{ s: 'r', t: 'Let me guess. You already know I lose.' }, { s: 'p', t: 'Ufufu. Of course. But you\'ll try anyway. That\'s why I like you.' }, { s: 'r', t: 'I\'m going to bloom all over your little clock.' }],
    end: [{ s: null, t: 'Every fight ended exactly the way Tokine had foreseen.' }, { s: 'p', t: 'How boring. ...No. How lovely. It was a good game.' }, { s: null, t: 'She set her clocks back to the beginning. Maybe next time, she\'ll be surprised.' }] },
  aimi: { riv: 'kuchi',
    pre: [{ s: 'p', t: 'Someone here keeps looking at my beloved. I saw it.' }, { s: 'p', t: 'Don\'t worry. I\'ll find them. I\'ll find everyone~' }],
    vs: [{ s: 'r', t: 'Excuse me... do you think I\'m pretty?' }, { s: 'p', t: 'Not as pretty as the one I love. Nobody is.' }, { s: 'r', t: 'Wrong answer, sweetheart.' }],
    end: [{ s: null, t: 'Aimi defeated every single rival, real or imagined.' }, { s: 'p', t: 'There. Now nobody will ever get between us. Ever.' }, { s: null, t: 'Somewhere, a diary got a new page. It was full of hearts. Hundreds of them.' }] },
  hachi: { riv: 'kuchi',
    pre: [{ s: null, t: 'A tall shape stands beyond the hedge. The summer air goes cold.' }, { s: 'p', t: '...po... po... po...' }],
    vs: [{ s: 'r', t: 'Oh. Another legend. Are you here to scare my children too?' }, { s: 'p', t: '...po... po...' }, { s: 'r', t: 'Tall and silent. Let\'s see if you still smile after this.' }],
    end: [{ s: null, t: 'Every fighter ran. None of them looked back.' }, { s: 'p', t: '...po... po... po...' }, { s: null, t: 'Villagers say that on hot summer days you can still hear it, just behind the hedge.' }] },
  kuchi: { riv: 'hachi',
    pre: [{ s: null, t: 'A woman in a surgical mask waits at the end of a foggy street.' }, { s: 'p', t: 'Excuse me... may I ask every fighter here something?' }],
    vs: [{ s: 'r', t: '...po... po... po...' }, { s: 'p', t: 'Oh my. So tall. Do you think I\'m pretty?' }, { s: 'r', t: '...po...' }],
    end: [{ s: null, t: 'Each defeated fighter got the same question. None knew the right answer.' }, { s: 'p', t: 'Do you think I\'m pretty...? Hehe. You\'ll tell me next time.' }, { s: null, t: 'Children still walk home in pairs. Just in case.' }] },
  haze: { riv: 'yoru',
    pre: [{ s: 'p', t: 'A tournament of the strongest fighters? ...Sounds exhausting.' }, { s: 'p', t: 'Whatever. Nothing better to do tonight.' }],
    vs: [{ s: 'r', t: 'You hide in smoke. I live in shadow. Your tricks will not work on me.' }, { s: 'p', t: 'Shadow needs light to exist, right? Smoke doesn\'t need anything.' }, { s: 'r', t: 'Then I will cut through it.' }, { s: 'p', t: 'Sure. Try not to breathe.' }],
    end: [{ s: null, t: 'Nobody really saw how the final fight ended. The fog was too thick.' }, { s: 'p', t: 'Champion? Hm. Doesn\'t change much.' }, { s: null, t: 'He lit another one and walked off into the night. The city smelled of rain and smoke until morning.' }] },
  teke: { riv: 'conductor',
    pre: [{ s: null, t: 'The last train left the station long ago. Something is still crawling along the tracks.' }, { s: 'p', t: 'Teke... teke... teke...' }],
    vs: [{ s: 'r', t: 'Passengers are not allowed on the tracks! ...Wait. You have no ticket. You have no legs.' }, { s: 'p', t: 'Conductor... which way did the train go...?' }, { s: 'r', t: 'Leave my railway alone, ghost!' }, { s: 'p', t: 'Teke... teke... I will find it.' }],
    end: [{ s: null, t: 'One by one, the strongest fighters stopped moving. She never did.' }, { s: 'p', t: 'Have you seen... my legs?' }, { s: null, t: 'Late at night, people on the last platform still hear it. Teke... teke... getting closer.' }] },
  jackpot: { riv: 'cardmaster',
    pre: [{ s: 'p', t: 'A tournament where the strongest fighters bet their souls? Now that is my kind of table.' }, { s: 'p', t: 'Place your bets, everyone. The house is open.' }],
    vs: [{ s: 'r', t: 'You again. You use cards like toys, gambler.' }, { s: 'p', t: 'And you treat them like scripture. Cards are only paper. Luck is what you make of it.' }, { s: 'r', t: 'Then let\'s see whose hand holds up.' }, { s: 'p', t: 'Fold now and I\'ll let you keep your deck.' }],
    end: [{ s: null, t: 'Every challenger sat at his table. Every one of them lost.' }, { s: 'p', t: 'Luck had nothing to do with it. I just knew the odds better than you.' }, { s: null, t: 'He flipped a golden coin into the night. It never came down on the wrong side.' }] },
};
const STORY_FALLBACK = {   // fighters added later without their own story
  pre: [{ s: 'p', t: 'The strongest fighters are gathering. I will face every one of them.' }],
  vs: [{ s: 'r', t: 'So you made it this far. This is where it ends.' }, { s: 'p', t: 'Then let\'s end it.' }],
  end: [{ s: null, t: 'The tournament was won. A new legend was born.' }],
};
function storyOf(id) { return STORY[id] || STORY_FALLBACK; }

// arcade ladder: the fighter's rival is always the last opponent
{
  const ac = arcadeCfg;
  arcadeCfg = function (p1, level) {
    const cfg = ac(p1, level), st = STORY[CHARS[p1].id], ri = st ? CHARS.findIndex(c => c.id === st.riv) : -1;
    if (ri >= 0 && ri !== p1) {
      const o = cfg.arcade.order.filter(i => i !== ri).slice(0, ARCADE_LEN - 1); o.push(ri);
      cfg.arcade.order = o; cfg.p2 = o[0];
    }
    return cfg;
  };
}
// the VS screen of an arcade fight, preceded by its story scene (fight 1 and the final fight)
function arcadeVS(cfg) {
  const a = cfg.arcade, st = storyOf(CHARS[cfg.p1].id);
  // the final (rival) fight always takes place in the boss arena; the other fights rotate through the normal stages
  if (a && BOSS_STAGE >= 0) cfg = { ...cfg, stage: a.i === a.order.length - 1 ? BOSS_STAGE : cfg.stage === BOSS_STAGE ? (BOSS_STAGE + 1) % STAGES.length : cfg.stage };
  const L = !a ? null : a.i === 0 ? st.pre : a.i === a.order.length - 1 ? st.vs : null;
  if (!L || !L.length || Settings.story === false) return new VSScene(cfg);
  return new StoryScene(cfg, L, a.i === 0 ? 'PROLOGUE' : 'FINAL BATTLE', () => go(new VSScene(cfg)));
}

class StoryScene {
  constructor(cfg, lines, head, next, ending) {
    this.cfg = cfg; this.lines = lines; this.head = head; this.next = next; this.ending = ending;
    this.i = 0; this.c = 0; this.t = 0; this.done = false; this.ropes = {};
    this.a = CHARS[cfg.p1]; this.b = CHARS[cfg.p2];
    this.skipR = { x: W - 150, y: 18, w: 128, h: 40 };
    if (ending) Music.play('results'); else Music.play('menu');
  }
  get line() { return this.lines[this.i]; }
  finish() { if (this.done) return; this.done = true; Sound.play('menuOk'); this.next(); }
  update() {
    this.t++;
    const L = this.line; if (!L) return this.finish();
    this.c = Math.min(L.t.length, this.c + 1.4);
    if (this.t < 12) return;
    if (UI.back() || (Mouse.clicked && inRect(this.skipR))) { Mouse.clicked = false; return this.finish(); }
    const adv = UI.ok() || Mouse.clicked || pressedAny(B(1, 'medium'), B(2, 'medium'));
    Mouse.clicked = false;
    if (!adv) return;
    if (this.c < L.t.length) { this.c = L.t.length; return; }
    Sound.play('menuMove');
    if (++this.i >= this.lines.length) return this.finish();
    this.c = 0;
  }
  speaker(L) { return L.s === 'p' ? this.a : L.s === 'r' ? this.b : null; }
  drawPortrait(g, ch, x, side, lit, vi) {
    if (!ch || !ch.portrait) return;
    const s = 380, y = H - 210 - s;
    g.save(); g.globalAlpha = lit ? 1 : 0.35;
    if (side < 0) { g.translate(x + s, 0); g.scale(-1, 1); x = 0; }
    g.shadowColor = ch.colors.accent; g.shadowBlur = lit ? 30 : 0;
    g.drawImage(ch.portrait, x, y + (lit ? 0 : 10), s, s);
    g.restore();
  }
  draw(g) {
    const t = this.t, L = this.line || this.lines[this.lines.length - 1], sp = this.speaker(L), [v1, v2] = cfgVariants(this.cfg);
    const acc = (sp || this.a).colors.accent;
    drawMenuBG(g, t, acc);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, W, H);
    if (this.ending) {
      const ch = this.a;
      withVarPal([[ch, v1]], () => withArt([varFn(ch, v1)], () => artFigure(g, 300, 720, 2.3, g => {
        g.save(); g.shadowColor = ch.colors.accent; g.shadowBlur = 40; g.globalAlpha = 0.5; drawFigure(g, ch, buildPose(ch, 'victory'), 300, 720, 1, { mono: ch.colors.accent, scale: 2.32 }); g.restore();
        drawFigure(g, ch, buildPose(ch, 'victory'), 300, 720, 1, { scale: 2.3, T: t, ropes: this.ropes, glow: true });
      })));
    } else {
      const usesR = this.lines.some(l => l.s === 'r');
      this.drawPortrait(g, this.a, 40, 1, L.s !== 'r', v1);
      if (usesR) this.drawPortrait(g, this.b, W - 420, -1, L.s === 'r', v2);
    }
    // header
    g.textBaseline = 'middle';
    drawTitleText(g, this.ending ? `${this.a.name} · ENDING` : this.head, this.ending ? 920 : W / 2, this.ending ? 200 : 56, this.ending ? 46 : 50, '#ffd84a', '#ff2a3a');
    if (!this.ending && this.cfg.arcade) { g.font = `700 16px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = '#e8dcff'; g.fillText(`ARCADE · FIGHT ${this.cfg.arcade.i + 1}/${this.cfg.arcade.order.length}`, W / 2, 98); }
    // skip button
    const r = this.skipR; drawButton(g, r, 'SKIP', null, inRect(r), t);
    // text box
    const bx = this.ending ? 600 : 90, by = H - 196, bw = this.ending ? W - 640 : W - 180, bh = 150;
    panel(g, bx, by, bw, bh, 'rgba(10,6,24,0.92)', acc);
    const name = sp ? sp.name : '';
    if (name) { g.font = `italic 900 24px ${FONT_T}`; g.textAlign = L.s === 'r' ? 'right' : 'left'; strokeText(g, name, L.s === 'r' ? bx + bw - 24 : bx + 24, by - 4, '#ffffff', sp.colors.accent, 5); }
    const tele = sp && sp.mute && L.t.startsWith('<');
    g.font = `${L.s ? '600' : 'italic 600'} 22px ${FONT_UI}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillStyle = tele ? '#d6b8ff' : L.s ? '#ffffff' : '#ffe9a8';
    wrapText(g, L.t.slice(0, Math.floor(this.c)), bx + 28, by + 46, bw - 56, 32);
    if (this.c >= L.t.length && t % 40 < 26) { g.font = `900 18px ${FONT_UI}`; g.textAlign = 'right'; g.fillStyle = '#ffd84a'; g.fillText('▼', bx + bw - 20, by + bh - 16); }
    g.textBaseline = 'middle'; g.font = `600 13px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = 'rgba(220,210,255,0.7)';
    g.fillText(`${this.i + 1}/${this.lines.length}   ·   ${Settings.mobile ? 'TAP: next   ·   SKIP: skip scene' : 'F / ENTER / click: next   ·   ESC: skip'}`, W / 2, H - 22);
  }
}

// results after ARCADE CLEAR: first button plays the fighter's ending
{
  const RP = ResultsScene.prototype, ru = RP.update;
  RP.update = function () {
    if (this.arcClear && !this.endItem && !(this instanceof NetResultsScene)) {
      this.endItem = { id: 'ending', label: 'STORY ENDING', jp: 'エンディング' };
      this.menu.items.unshift(this.endItem); this.menu.sel = 0;
      const mu = this.menu.update; this.menu.update = () => (this.pickIt = mu.call(this.menu));
    }
    this.pickIt = null;
    const r = ru.call(this);
    if (scene === this && this.pickIt && this.pickIt.id === 'ending') {
      const cfg = this.bt.cfg;
      go(new StoryScene(cfg, storyOf(CHARS[cfg.p1].id).end, 'ENDING', () => go(new CharSelectScene('versus', cfg.cpu)), true));
    }
    return r;
  };
}
