# SOUL BREAKERS — 魂砕き · Project Context

Handoff notes for continuing development of Beni's browser anime fighting game. Upload this file (and the game source) to the Project's knowledge so every new chat starts with the full picture.

## 1. Ground rules (from Beni)

- It must **stay a browser game** — plain HTML5 Canvas + JavaScript. Do **not** migrate to Godot, Unity or any other engine.
- New features must **integrate into the existing systems**; don't rebuild what exists, don't break other characters.
- **Preserve gameplay** (hitboxes, frame data, combos) when doing visual work.
- Keep it **performant** and working at **multiple resolutions**.
- Beni prefers **copy-paste-ready code/commands** over long explanations and often communicates via screenshots.
- Art direction: **2D pixel-anime look** with a **chibi character style** (see §6). New characters must use the chibi kit, not a separate style.

## 2. What the game is

- Local fighting game on one keyboard: 1P vs CPU or 2 players (plus Training mode with a dummy).
- Modes: 1P VS CPU (Single Match / Arcade, Easy/Normal/Hard), Versus, Training (frame data, hitbox view, combo trials, move list), How to Play (7 pages), Settings.
- 6 stages: NEON DISTRICT (neon), CRIMSON VOLCANO (volcano), MOONLIT BAMBOO (bamboo), MIDNIGHT ACADEMY (school), CLOCKWORK SPIRE (clock), RUNE FORGE (forge).
- Round flow: VS screen → rounds with timer → KO → results. Burst, meter ("魂 SOUL"), ultimates with cinematics, counters, juggles with a juggle limit, combo scaling.

### Default controls

| Action | Player 1 | Player 2 |
|---|---|---|
| Move | W A S D | Arrow keys |
| Light / Medium / Heavy | F / V / G | K / J / L |
| Special 1 / Special 2 | R / T | O / P |
| Block | H | I |

Game controllers (Xbox/PlayStation) work too, see §7k. Universal inputs: L+H = launcher, →→+H = dash attack, SP1+SP2 = ultimate (100 meter). Specials use SP1/SP2 alone, with ↓→ (sp1f/sp2f), ↓← (counter) or ↓↓ (sp2d).

## 3. Build & file layout

Single self-contained HTML file. `build.py` concatenates every `src/*.js` **in sorted filename order** into `dist/index.html` (function declarations are hoisted; `class` and `const` are not — a file can't use a class declared in a later file at load time).

```bash
cd game && python3 build.py   # → dist/index.html
```

| File | Purpose |
|---|---|
| `00_core.js` | Constants (W=1280, H=720, GROUND, STAGE_W), input (`PlayerInput`, `DEFAULT_BINDS`), `Settings` (persisted: master, music, sfx, muted, voice, shake, fx, roundTime, pixel), fonts (`FONT_T` starts with the bitmap `PixelArcade`) |
| `01_audio.js` | Web-Audio SFX (`Sound.play(name)`: CC0 samples with procedural fallback, §7l), music (files + procedural sequencer), announcer, speech voice lines (`voicePitch`/`voiceRate` per char) |
| `01a_audio_files.js` | `AUDIO_FILES`: which samples/music back which sound names (§7l) |
| `01b_pixel.js` | Pixel pipeline: `PIX` (640×360 world buffer, PXS=2), `pxProcess` (dithered alpha, Bayer-dithered colour quantization LUT, 1-px outline, rim light), `PX_GLYPHS` bitmap font patched into canvas text calls, UI primitives `pxBox`, `pxDiamond`, `snap2` |
| `02_fx.js` | Particles (`FX.p({type,...})`: ember, spark, smoke, petal, shard, slash, card, **blood, splat, bat, bblade**…), rings, bursts, world text (`FX.wtext`), shake, flash, impact frames, screen callouts |
| `03_render.js` | Procedural skeletal character renderer: `drawFigure`, `skeleton`, `buildPose`, `POSES`, `POSE_KEYS`, head/face/limb drawing, ropes (hair/cloth physics), `makePortrait` |
| `04_chars.js` | Kazuma, Yoru, Sera, Goro; `baseNormals()`, `CINE` cinematics, `MOVELIST` |
| `04_chars2.js` | Frog Trinity, Conductor (Tetsumichi) |
| `04_combos.js` | Combo trials, `addFollowup`, `finalizeMoves` |
| `04_zcard.js` | Fudagami / Cardmaster (deck & card system) |
| `04_zshift1/2/3.js` | Nue / Beast Shifter (beast art, forms, transformation system, HUD) |
| `04_zz_chibi.js` | **Chibi style kit** + chibi redesigns of Nue, Sera, Fudagami |
| `04_zz_chibi2.js` | Chibi redesigns of Kazuma, Yoru, Goro, Tetsumichi (+ Frog Trinity flag; frog eyes/blush live in `04_chars2.js`) |
| `04_zzz_saint.js` | Vespera / Blood Saint |
| `04_zzzz0_kit.js` | Shared helpers for the expansion fighters: `xpHaste` (attack speed-up that never skips hit frames), `xpHeal`, `xpPanel` (resource gauge + 6 cooldown badges), `xpHowTo`, `xpPad` |
| `04_zzzz1_borgar.js` | Borgar / Rune Berserker |
| `04_zzzz2_buzzu.js` | Buzzu / Chainsaw Beast |
| `04_zzzz3_reika.js` | Reika / Control Devil |
| `04_zzzz4_yamika.js` | Yamika / The Wicked Eye |
| `04_zzzz5_lunaria.js` | Lunaria / The Moon Sovereign |
| `04_zzzz6_honored.js` | Kuon / The Honored One |
| `04_zzzz9b_aimi.js` | Aimi / The Devoted Gaze (§7n) |
| `06b_statepose.js` | optional `ch.statePose(F)` hook: per-fighter poses for non-attack states (Aimi's defeat/victory) |
| `04_zzzz7_hollow.js` | The Hollow / The Psychic Sealer (+ the Remnant figure and shadow fragments used by his moves) |
| `05_stages.js` | Stage definitions (vector) |
| `05b_stages2.js` | Stages 4–6 (school, clock, forge), pushed onto `STAGES`; helper `layerPt` (layer coords → screen/art px), optional `bgAnim` hook (vector, after the far layer) |
| `06_fighter.js` | `Fighter` class: states, movement, attacks, cancels, follow-ups, projectiles (`Proj`, `EXTRA_PROJ` registry) |
| `07_battle.js` | `Battle`: rounds, hit resolution (`resolveHit`, `applyDamage`), cinematics (`startCine`, `scriptHit`, `release`), camera, training mode |
| `07b_pixworld.js` | Pixel-mode stage layers (`STAGE_PX`) and `drawWorldPixel` |
| `07bb_pixstages2.js` | `STAGE_PX` entries for stages 4–6 (extra hooks: `sky` after the sky, `animAt[i]` after layer i) |
| `07c_cpu.js` | CPU opponent: `CPU_LEVELS`, `cpuProfile(move)`, `CpuBot` (see §7c) |
| `07d_touch.js` | MOBILE touch controls: `TouchPad` (virtual stick + buttons for P1 in singleplayer), title-screen MOBILE toggle (see §7d) |
| `08_hud.js` | HUD: health/soul gauges, portraits, timer, combo counter, training panels, move list pages |
| `09_scenes.js` | Title, `CpuSetupScene` (difficulty + Single/Arcade), character select (2-row grid, 5 columns when >8 fighters, RANDOM button), VS, results (arcade NEXT FIGHT / CONTINUE), how-to, settings |
| `09a_peerjs.js`, `09b_net.js` | ONLINE 1v1: PeerJS lib, `Net`, lobby, net select/VS/battle/results (see §7h) |
| `09c_mastery.js` | MASTERY + COLOR VARIANTS: canvas recolour hook, `VARIANTS` designs, `Mastery` profile (localStorage), select picker, results XP panel, online variant sync (see §7i) |
| `09d_gamepad.js` | Game controllers via the Gamepad API: `Pad` (presses bound keyboard codes), `PadScene` (SETTINGS → CONTROLLER remapping), see §7k |
| `09e_cosmetics.js` | COSMETICS: animated intros + victory poses per fighter, mastery titles, COLLECTION screen, online loadout sync (see §7m) |
| `10_main.js` | Boot, main loop (fixed 60 fps), resize (`VIEW_K` device-resolution scaling 1–3×), portrait/card/cut-in generation |

## 4. Engine essentials

### Rendering
- Logical resolution 1280×720; the canvas backing store scales with `VIEW_K` for sharp output at 1080p and HiDPI.
- **Pixel mode (default ON, toggle in Settings):** world rendered at 640×360, fighters and effects run through `pxProcess` (outline + rim light + palette quantization), stages pre-pixelized. Vector mode still works (`Settings.pixel = false`).
- Characters are fully procedural (no sprite sheets): a skeleton posed by joint angles, drawn with hooks.

### Pose convention
Angles use `(sin a, cos a)`: `a = 0` points **down**, `π/2` points **forward**, `π` points **up**. Keys: `t` torso lean (+ forward), `hd` head tilt, `fa1/fa2` front upper/forearm, `ba1/ba2` back arm, `fl1/fl2` front thigh/shin, `bl1/bl2` back leg; `ground: 0` + `hipH` for floating poses; `base: 'jump'` inherits a base pose. Only keys in `POSE_KEYS` are interpolated.

### Character definition (object pushed onto `CHARS`)
```js
{ id, name, jp, title, titleJp, style, desc, stats:{power,speed,range,defense},
  health, walk, backWalk, jumpV, jumpX, dashV, juggleMax, dims, build, colors, afterColors,
  stance, poses:{...}, intro, wins:[...], ropes:[...],
  // draw hooks
  hairBack, hairFront, neckWear, torsoDetail, torsoOver, drawSkirt, shoulderOver, weaponBack, weaponFront, faceFn, drawBoot,
  // gameplay hooks
  moves, combos, extraList, tick(F), drawExtra(g,F), drawHand(g,F,side,t) /* HUD panel */, initFighter(F),
  applyTrial(A,tr), onDealDamage(A,D,dmg,B), dmgBonus(F), walkMul(F), introFx(F) }
```
Register with `CHARS.push(X); finalizeMoves(X);`.

### Moves
Frame data: `st` startup, `act` active, `rec` recovery, `dmg`, `hs`/`bs` hit/block stun, `kb` knockback, `launch`, `kd` knockdown, `hb` hitbox `{x,y,w,h}` (relative, facing-mirrored), `lvl` cancel level (normals 1–3, specials 4, follow-ups 4.5+, ultimate 6 — a move can cancel into a higher `lvl` on hit), `cd` cooldown, `invuln:[a,b]`, `pass` (pass-through frames), `air`, `grab`/`type:'unblock'`, `counter`+`onCounter`, `spawn:{f, fn}` for projectiles, `tick(F,f)`, `onStart`, `onHit(A,D)`, `sw` swoosh trail, `sfx`, `poses:[windup, strike]`.
Follow-ups: `addFollowup(CH, 'sp1', { btn:'sp1', move:'secondFang', any?, cond? })`.
Combo trials: `{ name, notation, seq:[moveKeys], pre?:[...] }` — checked by the training trial system.

### Cinematics
`BT.startCine(A, D, CINE.x, {zoom})`; `CINE.x(A, D, f, c)` runs per frame, uses `BT.scriptHit`, `forcePose`, `hidden`, `FX.darkTarget`, and returns `true` when finished (`BT.release(D, vx, vy)`).

## 5. Roster (21 fighters)

| # | Name | Title | Archetype | HP | Style |
|---|---|---|---|---|---|
| 1 | KAZUMA カズマ | The Crimson Fist 紅蓮の拳 | Brawler | 1000 | **chibi** |
| 2 | YORU ヨル | The Shadow Lily 影百合 | Ninja | 900 | **chibi** |
| 3 | SERA セラ | The Storm Sage 嵐の賢者 | Elementalist | 950 | **chibi** |
| 4 | GORO ゴロウ | The Iron Oni 鉄の鬼 | Berserker | 1150 | **chibi** |
| 5 | FROG TRINITY カエル三連星 | The Frog Trinity 蛙三銃士 | Trio / Puppet | 980 | **chibi** |
| 6 | TETSUMICHI テツミチ | The Final Conductor 終着の車掌 | Conductor | 980 | **chibi** |
| 7 | FUDAGAMI フダガミ | The Cardmaster 札の覇者 | Summoner / Zoner | 940 | **chibi** |
| 8 | NUE ヌエ | The Beast Shifter 獣宿し | Shapeshifter | 1000 | **chibi** |
| 9 | VESPERA ヴェスペラ | The Blood Saint 血の聖女 | Vampire | 940 | **chibi** |
| 10 | BORGAR ボルガル | The Rune Berserker 刻印の狂戦士 | Grappler / Tank | 1200 | **chibi** |
| 11 | BUZZU ブッズ | The Chainsaw Beast 鋸の魔獣 | Rushdown / Devil | 870 (takes +5%) | **chibi** |
| 12 | REIKA レイカ | The Control Devil 支配の悪魔 | Zoner / Control | 900 | **chibi** |
| 13 | YAMIKA ヤミカ | The Wicked Eye 邪眼の魔導士 | Trickster / Caster | 940 | **chibi** |
| 14 | LUNARIA ルナリア | The Moon Sovereign 月の女王 | Dark Mage / Zoner | 950 | **chibi** |
| 15 | KUON クオン | The Honored One 天上の者 | Space / Rushdown | 980 | **chibi** |
| 16 | THE HOLLOW ホロウ | The Psychic Sealer 封印の虚 | Technical / Anti-Ability | 960 | **chibi** |
| 17 | KANAE カナエ | The Spiteful Bloom 棘の花 | Trickster / Counter | 990 | **chibi** |
| 18 | TOKINE トキネ | The Nightmare Clock 刻の悪夢 | Time / Clones | 990 | **chibi** |
| 19 | AIMI アイミ | The Devoted Gaze 執愛の瞳 | Rushdown / Guns | 960 | **chibi** |
| 20 | HACHISHAKUSAMA 八尺様 | The Eight-Foot Tall Woman 八尺の女 | Zoner / Space Control | 1050 | **chibi** (tall) |
| 21 | KUCHISAKE-ONNA 口裂け女 | The Slit-Mouth Woman 口裂けの女 | Rushdown / Mix-up | 1000 | **chibi** |

### Signature specials & ultimates
- **Kazuma:** Blazing Knuckle → Second Blaze, Burst Shot, Iron Wall (counter), Rising Flame, Flame Cyclone (↓→SP2), Earth Breaker, Burning Hammer · Ult **Hundred Inferno Fists**.
- **Yoru:** Kunai, Shuriken Storm, Utsusemi (counter), Shadow Step → Shadow Return, Shadow Bind (↓→SP2), Falling Moon, Thousand Needles · Ult **Thousand Petal Dance**.
- **Sera:** Flame Orb (+ Detonate), Thunder Spear, Mirror Ward, Flame Ring, Gale Step (↓→SP2), Storm Call, Staff Flurry; staff drawn in `weaponBack` along `p.sa` (length 84, used by `staffTop()`) · Ult **Celestial Judgement**.
- **Goro:** Oni Charge, Oni Crusher, Unbreakable (armor counter), Skybreaker, Oni Roar (↓→SP2), Quake, Twin Cleaver, Oni Toss · Ult **Demon Awakening**.
- **Frog Trinity:** Tongue Snare/Yank, Frog Cannon, Belly Bounce, Triple Trouble, Leapfrog (↓→SP2), Frog Pile, Frog Relay · Ult **Swamp Apocalypse**.
- **Tetsumichi:** All Aboard!, Railway Crossing, Ticket Punch, Express Delivery, Pantograph Spark (↓→SP2), Last Departure, Semaphore Rush, Through Train · Ult **The Final Express**.
- **Fudagami:** deck/hand system — Play Card / Cycle Card with 8 cards (Blade, Meteor, Shadow Beast, Dragon, Mirror Trap, Gravity, Shield, Reversal), Card Storm, Wild Card, Summoner's Command, Deck Shuffle · Ult **The Final Collection**. Card fan/single card via `cf`/`cs` pose keys.
- **Nue:** human form + 5 random beast forms from a fair shuffle bag (Drake, Phantom Wolf, Abyssal Serpent, Celestial Stag, Nightmare Raven), Beast Unleash (SP2), Beast Cancel, Seal Drop (↓↓SP2, human form), Seal Release / Seal Rise, timer & cooldown, form-specific moves · Ult **Primal Ascension**. Forms are `Object.create(NUE)` via `mkForm`, so they inherit Nue's look.
- **Vespera:** see §7.
- **Borgar / Buzzu / Reika:** see §7b.
- **Yamika / Lunaria:** see §7e.
- **Kuon:** see §7f.
- **The Hollow:** see §7g.
- **Kanae / Tokine:** see §7j.
- **Aimi:** see §7n.
- **Hachishakusama / Kuchisake-onna:** see §7q.

All characters have 3–7 combo trials (74 total).

**Six specials for everyone (2026-11-26, `04_zzzza_six.js`):** every fighter now fills all six slots SP1, ↓→SP1, ↓←SP1, SP2, ↓→SP2, ↓↓SP2. The classics got a ↓→SP2: Kazuma Flame Cyclone (4-hit travelling spin kick), Yoru Shadow Bind (low ground shadow, long hitstun "BOUND"), Sera Gale Step (wind blast + invulnerable backwards escape), Goro Oni Roar (armored roar, erases projectiles in front, dizzies), Frog Trinity Leapfrog (invulnerable anti-air launcher), Tetsumichi Pantograph Spark (invulnerable anti-air launcher). Nue's human form got ↓↓SP2 Seal Drop (overhead leap slam, −1.5 s seal cooldown on hit); beast forms keep their own sets. Fudagami and Vespera already had six. The default HUD badge row now shows ↓→SP2 too. Existing moves unchanged.

## 6. Chibi style kit (`04_zz_chibi.js`)

Style reference: big-headed pastel chibi, huge glossy eyes, cat-ear beanie, headphones, small wings, pleated plaid skirt, fluffy leg warmers, oversized platform boots with round pads, soft low-poly/pixel shading.

- `CHIBI_DIMS = { thigh:33, shin:31, torso:44, neck:4, headR:26, uarm:25, farm:23, footLift:11 }`
- `makeChibi(ch, {colors, build})` sets `chibi:true`, dims, `faceFn: chibiFace`, `drawBoot: chunkyBoot`, `portraitScale: 0.68`.
- Building blocks: `chibiEye`, `chibiFace` (expressions: normal, shout, grin ":3", closed, hurt `><`, ko `XX`), `chunkyBoot` (leg warmer + boot + sole + round pads), `catBeanie(g,r,c,R,emblem)`, `headphones` (draws `skullHair` first), `skullHair`, `featherWings`, `plaidSkirt`, `highCollar`.
- Colour keys used by the kit: `eye, eye2, brow, warm, sole, pad, collar, plaid, plaid2, plaidLine, hat, hat2, earIn, phones, phones2, wing, wingAlt, wing2, wingTip, male`.
- Engine hooks added for it in `03_render.js`: `ch.faceFn`, chibi jaw when `ch.chibi`, `ch.drawBoot` inside `drawLeg`, `dims.footLift` in `buildPose`.
- Chibi designs: **Nue** (lavender hair, white beanie, dark headphones, white hoodie, grey plaid, white-teal wings, fluffy tail), **Sera** (light-blue ponytail, star headband, white headphones, sailor collar, navy plaid with gold, angel wings), **Fudagami** (dark beanie with gold ♠, gold headphones, short purple hoodie-coat, floating card fans as "wings").
- Second wave (`04_zz_chibi2.js`, visual only, all frame data/hitboxes/trials unchanged): **Kazuma** (spiky red hair, red headband with metal plate and tails, open white gi with flame emblem, black belt, red wraps, white/red platform sneakers), **Yoru** (purple ponytail, ninja mask under the big violet eyes, hitai-ate, lily hair pin, crimson scarf, dark pleated skirt, dark platform tabi), **Goro** (wild black mane, oni horns, tiny fangs, prayer beads, armor plates; cleaver drawn in `weaponBack` while it rests behind the head, `weaponFront` otherwise, ~12% shorter; `rageColors` rebuilt after the redesign), **Tetsumichi** (white conductor cap with red band and gold badge, monocle, red bow tie, short white coat with tails, black/red platform shoes), **Frog Trinity** (still `drawCustom`; bigger glossy chibi irises via `frogIris`, per-frog iris colours, blush).
- Shared helpers there: `chibiFaceBold` (chibi face + thick brows via `c.thickBrow`, fangs via `c.fang`), `chibiShorts`.
- All 16 fighters use the chibi style.

## 7. Vespera — The Blood Saint (`04_zzz_saint.js`)

Gothic vampire aristocrat (inspired by Alucard / DIO), aggressive close-range lifesteal fighter, chibi style.

**Look:** long silver-white hair with crimson tips, blunt hime fringe, crimson slit-pupil eyes with half-lowered lids, one-fang smirk, beauty mark; black lace headdress with bat-wing bow (silhouette "ears"), crimson rose over the ear (where others wear headphones), small bat wings, plum-black gothic dress with crimson corset lacing, crimson petticoat ruffle, gold trim, black gloves with crimson claws, black high boots on the chibi platform soles. Palette: crimson / black / silver-white / dark gold.

**Systems:**
- **Lifesteal:** heals 12% of damage dealt (24% in Frenzy) via the `onDealDamage` hook.
- **BLOOD gauge (0–100):** +7 per hit, +3 per cinematic hit, also fed by bleed; drains 0.12/frame after 150 frames without hitting.
- **BLOOD FRENZY:** at 100 → 420 frames: ×1.12 damage (`dmgBonus`), ×1.15 walk (`walkMul`), double lifesteal, every hit adds Bleed, crimson afterimages & heartbeat.
- **BLEED:** stacks on the opponent (max 5, 300 frames, refreshed): 0.045 HP/frame per stack, never lethal (stops at 1 HP).

**Moves:**
| Input | Move | Notes |
|---|---|---|
| SP1 | Crimson Claw 紅爪 | dashing claw, +1 Bleed; SP1 again → **Second Fang** (launcher, +1 Bleed) |
| ↓→SP1 | Blood Whip 血鞭 | ~220 px reach, pulls victim in, +1 Bleed, cancels into Hemorrhage |
| ↓←SP1 | Crimson Veil 紅の帳 | counter (also catches projectiles) → **Thorn Bloom** spikes around her, launch, +2 Bleed |
| SP2 | Mist Step 霧歩 | invulnerable pass-through dash (also in air); press L/M/H late in the dash to strike out of the mist |
| ↓→SP2 | Thirst 渇き | unblockable bite grab cinematic, big heal, +25 Blood, +2 Bleed |
| ↓↓SP2 | Hemorrhage 血華 | blood spikes under the victim: 34 + 24 per Bleed stack (consumed), 2+ stacks launch, heals |
| SP1+SP2 | **Crimson Nocturne 紅月夜想曲** | ult: lunge → "the night stops", blood blades hang around the victim, snap → all fall, bite, finishing rake |

Normals renamed: Lady's Slap, Heel Strike, Crimson Rake, Thorn Sweep, Rising Talon, Night Lunge, Raven Dive.
Trials: First Blood · Leash & Harvest · Mist Waltz · Moonlit Ascent · Crimson Nocturne.
HUD panel: blood vial + gauge (Frenzy timer), opponent Bleed drops, cooldown badges. How-to page 7/7.

Generic engine hooks added for her (no effect on others): `onDealDamage` in `Battle.applyDamage`, `ch.dmgBonus` in `Fighter.dmgMult`, `ch.walkMul` in walk speed; FX particle types `blood`, `splat`, `bat`, `bblade`; sounds `drain`, `bats`, `spike`, `heart`.

## 7b. Expansion fighters (Borgar, Buzzu, Reika)

All three use the chibi kit, the 6-special layout and a HUD panel from `xpPanel` (gauge + six cooldown badges), plus a How-to page via `ch.howTo`.

Input layout: SP1, ↓→SP1, ↓←SP1 (slot `counter`), SP2, ↓→SP2, ↓↓SP2, SP1+SP2 ult.

- **Borgar (1200 HP, walk 3.25, slow):** Rune Fury fills when he takes damage (×0.13) and when he lands hits (+9 heavy, +3 light). At 100, or via Berserker's Wrath (needs 40+), he goes Berserk: +20% on heavies/specials, +8% elsewhere, faster walk, armor on heavy normals.
  - SP1 Rune Ram: dash command grab (cine `CINE.borgarRam`).
  - ↓→SP1 Earthquake Hammer: low `runeQuake` shockwave, knockdown.
  - ↓←SP1 Rune Uppercut: launcher, upper-body invuln, jump-cancel.
  - SP2 Stone Skin: 5 s, −30% damage, armor on heavies.
  - ↓→SP2 Mountain Breaker: armored overhead, wall splat.
  - ↓↓SP2 Berserker's Wrath.
  - Ult **Wrath of the Mountain**.
  - The hammer is drawn in `weaponFront` along `p.fa2`.
- **Buzzu (870 HP, `defMul` 1.05, walk 5.3):** Engine Heat: +6 per hit, about +2 on block, decays when idle. At 40 and 75 heat his attacks get faster through `xpHaste`. At 100 he Overheats for 5 s (+10% damage).
  - SP1 Chainsaw Dash: combo starter.
  - ↓→SP1 Saw Frenzy.
  - ↓←SP1 Demonic Leap: overhead, also usable in the air.
  - SP2 Engine Overdrive.
  - ↓→SP2 Blood Consumption: heals 6%.
  - ↓↓SP2 Full Devil Mode: needs 50+ heat. Gives arm blades and new L/M/H (`dL`/`dM`/`dH` chosen through `ch.tryCustom`).
  - Ult **Chainsaw Rampage**.
- **Reika (900 HP, walk 3.9):** Authority: +7 per hit and +6 per control, −6 when she is hit, decays. At 100, or via Absolute Authority (needs 40+), she enters Dominance for 7 s: +10% damage, faster cooldowns, a double Invisible Force, longer Command and a 4-hit Crush.
  - SP1 Invisible Force: `psiWave`.
  - ↓→SP1 Command: delayed `command` projectile at the foe's position. Applies a kneel `forcePose`, `cmdT` stun and `slowT` half-speed.
  - ↓←SP1 Crushing Pressure: delayed `crush` sphere, 3–4 hits, then a spike.
  - SP2 Controlled Movement: glide in, or away with ← (invulnerable). Can be cancelled into normals (`glideCancel`).
  - ↓→SP2 Bloodline Mark: +15% damage for 6 s; her next control move detonates it.
  - ↓↓SP2 Absolute Authority.
  - Ult **Absolute Control**: a cine with a screen-space `c.fg` overlay.
  - The finger gesture reuses pose key `pw`.

**Generic engine hooks added** (none of them affect other fighters):
- `ch.defMul` may be a function `(D, A)`.
- `ch.armorBuff(F, m)` and `ch.armorHits(F, m)` in `Fighter.armorActive` / `startMove`.
- `ch.palette(F)` overrides the `colors` getter.
- `ch.howTo = { title, draw }` adds a How-to page.
- `ch.trialInput` is used by the test bot.
- New sounds: `saw`, `rev`, `rune`, `crush`, `psi`.

**Bug fixed (pre-existing):** a time-over during the winner's attack cleared `move` but left the state as `attack`, which crashed `attackUpdate`. `attackUpdate` now falls back to idle.

## 7c. Singleplayer / CPU opponent (`07c_cpu.js`)

- Title → **1P VS CPU** → `CpuSetupScene`: difficulty (←/→, saved as `Settings.cpuLevel`), **Single Match** (pick own fighter + CPU fighter + stage) or **Arcade** (pick own fighter, then 6 random opponents in a row on rotating stages; lose → CONTINUE retries the same fight, win all → ARCADE CLEAR).
- Battle config: `{ mode:'versus', cpu:{ level, arcade? }, arcade?:{ order, i } }`. Battle stays a normal versus match; `Battle` creates `this.cpu = new CpuBot(bt, level)` and calls `cpu.tick()` before input update each sim step. HUD shows "CPU · LEVEL" under P2's name; results label YOU / CPU.
- **Input path:** the bot writes directions and buttons into `PlayerInput.virtual` (`{l,r,u,d, btn:{held, press:Set}}`), so motions (qcf/qcb/dd/ff), buffers, cooldowns, meter, cancels and follow-ups work exactly like a human's. `PlayerInput` only uses `virtual.btn` while `enabled`.
- **No cheating:** it sees the opponent and projectiles through a delayed snapshot (`react` frames: 26/16/10) and never reads human inputs. It reads its own state (cooldowns, meter) like a player reads the HUD.
- Behaviour: blocks seen attacks/projectiles (chance per level, crouch-blocks lows with `lowRead`), jumps away from unblockables, counters (Normal/Hard), anti-airs with invulnerable launch specials or L+H, chains L→M→H→special/ult on hit (`depth` 1/2/4), uses character follow-ups, zones with projectiles at range, uses buffs, dash/jump-ins, low mix-ups vs blockers, Soul Burst in long combos (Normal/Hard). Moves are classified generically by `cpuProfile` (reach, proj/melee/grab/buff/counter/anti-air) so new fighters work without extra code.
- `CpuBot(bt, level, side)` — side 0 drives P1 (used by the bot-vs-bot test).
- Measured (bot vs bot, 24 matches each): Hard beats Easy 24/24, Normal beats Easy ~24/24, Hard beats Normal ~22/24.
- **Character select RANDOM:** button under the grid (mouse) or Medium (P1 V / P2 J) picks and confirms a random fighter, works in Versus, VS CPU, Practice and Training.
- Bug fixed (pre-existing, found by the bot test): Yoru's ultimate could teleport her outside the stage near a wall; positions are now clamped.

## 7d. Mobile touch controls (`07d_touch.js`)

- Title screen: **MOBILE: ON/OFF** button top-right (`Settings.mobile`, saved; defaults to ON on touch phones via `pointer: coarse`).
- Only for singleplayer: VS CPU (Single + Arcade), Practice, Training. 2P Versus never uses it. `Battle` calls `TouchPad.attach(this)` (sets `inputs[0].virtual`), `TouchPad.tick(bt)` in `stepSim` right after the CPU bot, `TouchPad.draw` after the HUD.
- Same input path as the CPU bot (`PlayerInput.virtual`), so motions, buffers, cancels and follow-ups are unchanged. P1 keyboard keys are merged in, so a keyboard still works with MOBILE on.
- Layout (logical 1280×720): floating stick on the left half (8-way, deadzone 20), buttons right: L, M, H, SP1, SP2, BLOCK, ULT (= SP1+SP2, glows at 100 meter); pause pill under the timer (sends Escape), RESET pill in Practice/Training (sends Digit5). Fingers can slide between buttons; multitouch works.
- Shortcuts for touch SP buttons: SP1 + stick forward = ↓→SP1, SP1 + back = ↓←SP1 (counter), SP2 + forward = ↓→SP2, SP2 + down = ↓↓SP2 (injected as a 3-frame motion). Real stick motions also work. Tap anywhere skips intro / round end.
- Canvas gets `touch-action: none`; pinch/double-tap zoom and scrolling are blocked during battle. Outside battle (menus, pause menu) taps stay normal mouse clicks. Portrait phones get a "turn your phone sideways" banner in battle.
- Training dummy options ([1]–[0]) still need a keyboard.

## 7e. Yamika (The Wicked Eye) and Lunaria (The Moon Sovereign)

Both are original designs (Yamika inspired by a chuunibyou eyepatch girl, Lunaria by a dark lunar queen, as a humanoid), built on the chibi kit with the expansion layout (SP1, ↓→SP1, ↓←SP1, SP2, ↓→SP2, ↓↓SP2, ult), an `xpPanel` HUD, How-to pages and 5 trials each.

- **Yamika (940 HP, walk 4.3):** navy bob with small side ponytails, black eyepatch with a hand-drawn pentagram over the far eye (strap across the head), sailor uniform with violet ribbon, cross choker, tattered half-cape, dark plaid skirt. Idle gestures via `ch.idlePose` (covers her eye, peeks around).
  - **CHUUNI ENERGY:** +2 per hit, +6 per spell hit, +12 when a Mystic Seal triggers, +6 bonus for chaining a *different* spell within 2.5 s ("CHAIN CAST"). ×1.5 inside Reality Distortion. At 100 → **WICKED AWAKENING** (7 s): glowing eye, two Dark Flames, instant seals (2 at once), 3-bite beast, Shadow Step leaves an exploding decoy.
  - SP1 Forbidden Dark Flame (`darkFlame`). ↓→SP1 Mystic Seal: trap (`mysticSeal`) 120 px ahead, arms after 22 f, lasts 5 s, explodes + pops up. ↓←SP1 Shadow Step: vanish and reappear 230 px back (arrival burst); SP1 during the smoke = **Phantom Return** (`stepIn`, cross-up behind the foe).
  - SP2 Darkness Summoning: shadow beast (`shadeBeast`) rises, chases, bites twice (2nd launches). ↓→SP2 Tyrant's Grasp: hands (`grasp`) where the foe stands after a 22 f warning, pin `graspT` 40 f. ↓↓SP2 Reality Distortion: 7 s harmless field (`distort`, `F.fieldP`): homing flames, instant seals, longer steps, bigger hands, enemy projectiles slowed ×0.55, energy ×1.5.
  - Ult **The Unsealed Wicked Eye** (`CINE.yamika`, `YAMIKA.cineFg`): a cut-in panel draws her head with the real renderer at 7×; her hand rises and tears off the patch, the hidden gold/violet eye blazes; energy surge; 4 portals and demons surround and strike; a colossal demon delivers the final blow (~258 dmg). Palette `unseal` shows the eye for a moment after.
- **Lunaria (950 HP, walk 3.6, slow):** long star-flecked midnight mane, silver crown with a slender horn-like spire and crescent, icy cyan slit eyes with royal half-lids, navy armour with a crescent breastplate, gorget, pauldron, gown skirt with silver hem, long cape with a starry lining, small dark wings. Idle: looks to the sky.
  - **LUNAR POWER:** +2 per hit, +6 crescent/veil, +10 chains, +8 spear, +5 Nightfall strike, +4 extra when the foe stands in her Nightfall. ×2 during Celestial Dominion. At 100 → **ECLIPSE FORM** (7 s): darker palette, dark crescent halo behind her head, twin crescents, longer chains that drag, launching spear, wider Nightfall and veil burst, SP1 cooldowns ×0.75.
  - SP1 Crescent Moon (`crescent`). ↓→SP1 Shadow Veil: reappear 230 px back, the shadow left behind (`veilShade`) bursts after 20 f. ↓←SP1 Lunar Chains (`moonChains`): runes under the foe, chains bind (`chainT`).
  - SP2 Eclipse Spear (`eclipseSpear`, 24 f startup, 108 dmg, wall-splat). ↓→SP2 Nightfall (`nightfall`, `F.nightP`): 4 s zone, strike every 42 f, +12 dmg if the victim did not move. ↓↓SP2 Celestial Dominion: 5 s buff (returning crescents, wider chains that slow, double gain), no raw damage boost.
  - Ult **Eternal Night** (`CINE.lunaria`, `cineBg` + `cineFg`): night sky replaces the stage, the camera tilts up to a giant moon anchored above her, an eclipse covers it (corona), shadows spread, celestial hits, lunar runes fill the sky, a colossal dark crescent falls on the opponent (~268 dmg), moonlight flash then darkness, the moon lingers behind her (`F.moonT`). Victory also shows a crescent moon behind her.
- **Generic hooks added (no effect on others):** `ch.idlePose(F)` returns an optional idle pose; a character's `poses.defeat` replaces the default kneel on defeat. Both in `Fighter.targetPose`.
- Balance check (bot vs bot, Normal, each vs the whole roster both sides): Yamika 11/26, Lunaria 11/26, Reika 7/26.

## 7f. Kuon — The Honored One (`04_zzzz6_honored.js`)

Original design inspired by a famous blindfolded sorcerer (Gojo-like look and Limitless-style powers, own name and model). Chibi kit, expansion layout, `xpPanel` HUD (icon ∞), How-to page, 5 trials.

- **Look:** tall spiky white hair pushed up by a black blindfold (knot + two tails as ropes), smirking mouth, high-collar navy-black uniform with buttons and short tunic tails, black platform boots with icy-blue pads. Without the blindfold (Unveiled, ult, defeat/KO) the hair falls over the forehead and big icy-blue eyes with white lashes show. Idle: adjusts the blindfold, smiles at the opponent. Victory: hand at the blindfold. Defeat: blindfold slips, genuinely surprised face. Palette flags `bare/unv/shock` via `ch.palette` (cached).
- **Stats:** 980 HP, walk 4.6, normals ×1.0.
- **LIMITLESS (0–100):** +2 per hit, Blue +6 (Max +4 per hit), Red +8, Purple +5, Infinity stop +12 (held projectile +6), Blue × Red within 150 f = +10 "ATTRACT × REPEL", ult +15; decays after 4 s idle. 50 = FOCUSED (wider/stronger Blue pull, Infinity window +8 f, Spatial Step cd ×0.7). 100 = **UNVEILED** 7 s (blindfold off, glowing eyes): 3-hit Blue, Red launches, Infinity reflects projectiles, melee stop lasts longer, Purple is free and spawns at f28 instead of f40, Step cd ×0.5. Afterwards the gauge resets to 0.
- SP1 **Blue: Attraction** (`blueOrb`): fixed orb 220 px ahead (hold ← = 120 px), 6 f delay, pulls a non-guarding foe toward its centre (`honPull`), 2 hits × 24. ↓→SP2 during it (after an orb hit) = Red follow-up.
- ↓→SP1 **Spatial Step:** invisible f3–5, reappears 72 px behind a foe within 380 px (turns around) or 240 px forward; invuln 1–9, 16 f total, cd 80.
- ↓←SP1 **Infinity** (counter slot, `counterNoGrab`): 30 f window. Melee attackers freeze (`infFreezeT`, hitstun 32/40, BT.slow), Kuon skips to the last 6 f of recovery and may cancel. Enemy projectiles within 280 px slow ×0.78/f and hang in the air (`F.infHeld`), dissolving when the window ends. Grabs, unblockables and ults go through. cd 150.
- SP2 **Blue: Maximum:** big orb 210 px ahead, 16 f + 8 f delay, pull radius 260 (320 Focused), weak pull even through block, 4 × 13 + collapse 40 that launches. cd 210.
- ↓→SP2 **Red: Reversal** (`redOrb`): 20 f startup with red charge, 100 dmg, kb 15, knockdown + wall-splat (Unveiled: launch). cd 240.
- ↓↓SP2 **Hollow Purple** (`hollowPurple`): needs 30 Limitless (`req`, consumes 30), 40 f startup, `crush` (erases projectiles), 3 × 48 then knockdown + wall-splat, 42 f recovery, cd 540.
- Ult **Domain Expansion: Unlimited Void** (`CINE.honored`, `cineBg` + `cineFg`): wide hitbox both sides; camera closes in, he slides the blindfold off and raises his hand ("Domain Expansion."), a circular void spreads from his hand and swallows the stage, starfield + gigantic glowing sphere, camera pulls out (無量空処 / UNLIMITED VOID), the victim hangs while streams of glyphs pour into them (7 small hits), he appears in front and ends it with one touch (160), the domain collapses, he pulls the blindfold back up. ~250 dmg.
- **Engine hook (no effect on others):** `move.counterNoGrab` in `Battle.resolveHit` lets grabs beat that counter.
- CPU hints: `moves.sp1/sp2.__ai` (orbs are placed, not thrown). Bot-vs-bot roster rate ~5–6/28 (like Reika); a hands-on balance pass is still open.
- Tests: `tests/mech_honored.js` (Infinity vs melee/projectile/grab/unblockable, Step, Blue pull, Purple req, Unveiled, ult cleanup), `tests/shots4.js` (previews). `mobile.js` now fills the gauge before testing ↓↓SP2.

## 7g. The Hollow — The Psychic Sealer (`04_zzzz7_hollow.js`)

Beni's own original manga character. A man with a completely featureless head (no eyes, mouth, nose or ears) who never speaks (telepathy only) and seals other people's abilities; fragments of every sealed psyche stay in his head, and almost the entire psyche of his late wife is among them. Chibi kit, expansion layout, `xpPanel` HUD (icon 念), How-to page, 5 trials.

- **Look:** smooth pale head with cold shading (`coldSkin`) and a thin dark fissure that glows violet as Fragments grow; heavy frayed scarf (two rope tails), layered worn charcoal coat with a lighter inner layer, torn coat tails, oversized front sleeve, dark platform boots. Idle: unnaturally still, the head sometimes tilts; dark particles leave his head (more with more Fragments). Hit: particles scatter and the body distorts (no face reaction). Victory: he stands still while his wife appears faintly behind him. Defeat: kneels, fragments pour out of his head and faint silhouettes surround him. `mute: true` — he never speaks aloud (intro/wins shown as `< ... >` telepathy).
- **Stats:** 960 HP, walk 3.6 (slow), normals ×1.0 with +1 startup (`spd: 1`).
- **PSYCHIC FRAGMENTS (0–100):** +1.5 per hit, Burst +8 (+12 vs marked), Detection +6, Seal +22, Fragment hits +6, interrupting a special/ult mid-use +10 ("INTERRUPT"), dodging a live attack with Step +8 ("EVADED"); fades after 5 s idle. At 100 → **PSYCHIC OVERLOAD** 7 s; ↓↓SP2 with 40+ → 4–7 s (240 + (frag−40)×3 f). Overload: +8% damage, bigger Burst, faster Detection + 7 s mark, Step shockwave (30), Seal locks two specials (+1 s), two Fragments, interrupted specials are sealed 1.5 s, new Fragments extend the timer. Then **EXHAUSTED** 3 s (no gain).
- SP1 **Psychic Burst** (`psyWave`): 11 f, short force wave ~210 px, 56 dmg (68 Overload), kb 7.5, cd 45.
- ↓→SP1 **Outlet Detection** (`psyThread`): thin line ~400 px, 14 dmg, blockable; on hit MARK 5 s (`D.hlwMarkT`, outline + lines + sigil). cd 90.
- ↓←SP1 **Psychic Step** (counter slot, not a counter): vanish f3, reappear f7 ~190 px forward (stops 72 px before the foe) or 200 px back (hold ←); invuln 2–10 only, cd 100 (60 in Overload).
- SP2 **Outlet Seal** (`sealSigil`): the sigil appears at the foe's position at f8 (300 px, 420 vs marked) and closes at f20; 42 dmg, restrains (hs 38). On a clean hit it locks the victim's **last used special slot** for 150 f (210 if marked, mark consumed; +60 f and a second slot in Overload). cd 330.
- ↓→SP2 **Fragment Manifestation** (`fragShade`): a faceless shadow (HFRAG, not the wife) rises behind him and lunges: 30 + 50 (launch). cd 300.
- ↓↓SP2 **Psychic Overload:** needs 40, cd 600, invuln during the 16 f startup.
- Ult **The Last Remnant** (`CINE.hollow`, `cineBg` + `cineFg`, ~314 f, 240 dmg): Silence (darkness, stillness, particles from his head) → a rift opens in his shadow, her black silhouette (mostly hair) seeps out and becomes a woman (`REMNANT` chibi: extremely long straight black hair, hime fringe, unnaturally white skin, half-lidded sad eyes, plain white dress) who rests a hand on his shoulder → her hair crosses the stage, coils around the opponent and lifts them, she glides over and drains them (hand on the forehead, 6×10), the battlefield loses its colours → she looks back at him, he releases the burst, implosion + white-out explosion (160) → the world returns, she lowers her head (eyes closed) and dissolves into his head. She is drawn through `ch.drawBehind`.
- **Generic engine hooks (no effect on others):** `Fighter.sealK/sealK2/sealT/sealMax` checked in `canUse` (shows "SEALED" when pressed) and `lastSpK/lastSpK2` set in `startMove` (`SEAL_SLOTS`); `xpPanel` crosses out a sealed badge; `ch.drawBehind(g, F)` in `Fighter.draw`; `ch.noEar` in `drawHead`; `ch.mute` skips speech in `Battle.say`, `superFreeze` and `introFx`. Moves that bypass `canUse` (follow-ups, Sera's Detonate, Nue's form cancels) are not sealed.
- The opponent's status is drawn by The Hollow's `drawHand` on the opponent's side (y 528): "封 SEALED: <MOVE> 2.1s" with a bar, or "OUTLET MARKED". Above their head: 封 with a countdown ring.
- Limitation: there is no roster-wide transformation/defensive-state system, so the Seal works on special slots only (it can't end Nue's forms, Buzzu's Devil Mode etc.).
- Balance (bot vs bot, Normal, vs the whole roster both sides): 9/30, in the range of Yamika/Lunaria. The bot doesn't play around the seal; a hands-on pass is open.
- Tests: `tests/mech_hollow.js` (seal vs 6 fighters, mark range/duration, Overload manual/auto/exhaustion, Step evade, ult vs 6 fighters + cleanup), `tests/shots5.js` (previews). `mobile.js` fills his gauge for the ↓↓SP2 check.

## 7h. ONLINE 1v1 + web app (`09a_peerjs.js`, `09b_net.js`, `build_web.py`)

- Live at **https://icedyuu.github.io/soul-breakers/** (GitHub Pages, repo `icedyuu/soul-breakers`: site files in the root, full source in `game/`). Installable PWA: manifest (fullscreen, landscape), icons (`web_icons/`, made by `tests/icons.js`), service worker (`sw.js`: page network-first, rest cache-first → singleplayer works offline). Deploy: `python3 build.py && python3 build_web.py <repo root>`, commit, push to `main`.
- Title → **ONLINE 1 VS 1** → `NetLobbyScene`: CREATE ROOM (6-digit code, SHARE/COPY invite link `?join=123456`) or JOIN ROOM (on-screen keypad or digit keys). Free: PeerJS public signaling (0.peerjs.com) + PeerJS' free TURN fallback; WebRTC data channel peer-to-peer, no accounts. PeerJS 1.5.4 is inlined (`09a_peerjs.js`). `?peerhost=&peerport=` points at another PeerJS server (tests use a local one).
- Flow: `NetSelectScene` (extends CharSelectScene; own pick left, rival right, live cursor) → host sends `start` {p1 host, p2 guest, stage, seed, delay, roundTime} → `NetVSScene` → `NetBattle` (extends Battle) → `NetResultsScene` (REMATCH needs both, CHARACTER SELECT, LEAVE).
- Netcode: delay-based lockstep. Each frame one int per player (dirs, 6 held, 6 pressed, OK bit) is sent and applied `delay` frames later (2–9, from ping). `netEnter()` makes the sim deterministic: `Math.random` = shared seeded PRNG (`NetRng`), empty `Keys.pressed`, fixed roundTime/fx/shake. Audio, `FX.update` (screen shake) and stage `update()` (ambience, e.g. neon rain) always use the real Math.random. **New code that runs during the sim must not use per-device state (load-time randoms, draw-time state) for gameplay.**
- Every 60 frames a state hash is compared; on mismatch the host sends its fighter/input/battle primitive state (`snapshot`) and the guest adopts it at an agreed frame (soft resync; HUD shows "sync N"). Pause button / ESC opens a menu but the match keeps running (MOVE LIST, LEAVE). Disconnect or 7 s silence → lobby with a message. Different game versions are refused (build id from roster).
- Local fighter: host = P1, guest = P2. Input from MOBILE pad (TouchPad drives the local fighter) or keyboard (P1 keys or arrows/P2 keys).
- Tests: `netplay.js [matches]` (local PeerJS server via `SB_PEER_MODULE`=path to npm `peer`, two pages, bots play full matches over the real connection, per-frame hash compare, rematch, disconnect; `SB_DESYNC=1` tests the resync, `SB_STAGE=n`), `netsync.js [frames] [ring|all]` (all fighter pairings, two pages with different render timing/history must produce identical hashes), `netshots.js` (screens).

## 7i. Mastery + colour variants (`09c_mastery.js`)

- **Mastery** per fighter, saved on the device in `localStorage['sb_profile_v1']` = `{v:1, profile, upd, chars:{id:{xp,w,l}}, pick:{id:variant}}`. `Mastery.export()` / `Mastery.import(obj)` (merge keeps the higher XP) are the hooks for a future account/cloud sync.
- Levels 1–10, XP to next level `120 + 80·(lv−1)` (LV 10 = 3960 XP). XP per match for the LOCAL player only: win 80 / loss 30, +15 per round won, +25 flawless win; × difficulty (Easy 0.7, Normal 1, Hard 1.4); Single VS CPU × 0.4; Arcade clear +200 × difficulty; Online × 1.5. Local 2P versus and Training give none. Awarded when `ResultsScene` opens (`this.mx`), panel bottom-left with animated bar, LEVEL UP and "NEW COLOR UNLOCKED" toasts.
- **Colour variants**: 4 per fighter (`VARIANTS[id]`, index 1–4; 0 = original), unlocked at LV 2 / 4 / 7 / 10 (`VAR_UNLOCK`). LV 10 tier has `glow` → rising soul sparks around the fighter (draw-only). A variant is a list of HSL rules (`h` hue range, `l` lightness range, `grey:'only'|'also'`, `hue`/`dh`/`ss`/`s`/`lm`/`la`/`inv`); skin (and a skin-like hand colour) and pure white/near-black are protected; `keep:false` recolours skin too (Frogs, Buzzu). New fighters without designs fall back to `VAR_FALLBACK`.
- How it works: `CanvasRenderingContext2D` fillStyle/strokeStyle/shadowColor + gradient stops go through `RC.fn` while a variant fighter/projectile/portrait is drawn (`withRecolor`); `Fighter.colors` returns the mapped palette (FX, HUD accents); `chArt(ch, v, 'portrait'|'card'|'cutin')` builds variant art lazily. Purely visual: the sim never reads variants.
- Select: `SP1`/`SP2` (P1 R/T, P2 O/P) cycle unlocked colours, or tap/click a swatch (locked ones show the level); the last pick per fighter is remembered. Battle cfg carries `v1`/`v2`; mirror match with the same colour gives P2 the next colour (`cfgVariants`). CPU and dummy use the original colours.
- Online: the `sel` message carries `v` (colour) and `lv` (mastery level shown for the rival); the host puts `v1`/`v2` into the `start` cfg, so both peers draw both colours, even locked ones.
- **Hidden cheat** (Beni's request): in SETTINGS hover the mouse over TOGGLE FULLSCREEN and type `cheat` → every fighter set to LV 10, all colours unlocked (`Mastery.unlockAll()`), with a CHEAT ACTIVATED banner. While the word is being typed over that button, key presses are swallowed so settings don't change. Test: `tests/cheat.js`.
- Tests: `mastery.js` (picker, cfg, mirror rule, awards, unlock, art, export/import; shots to `../shots_mastery/`), `variants.js [ids|all] [out] [pixel]` (sheet of all variants), `varstress.js` (every fighter × every colour drawn with random inputs + draw cost), `netplay.js` now also checks that colours sync.

## 7j. Kanae (The Spiteful Bloom) and Tokine (The Nightmare Clock) (`04_zzzz8_kanae.js`, `04_zzzz9_tokine.js`)

Beni's request: a Nakamura-inspired and a Kurumi-inspired fighter from his reference images. Like Kuon/Vespera they are ORIGINAL inspired characters with own names; Kanae's ult flower is an original eye-flower, not the manga design.
- **Kanae** (red messy bob, thin glasses, school shirt + plaid skirt; LV10 "BLACK DAYS" = longer black hair, dark t-shirt, calm face). Resource **REBELLION** `F.reb` 0–100: counter +18 (+50% in Break the Rules, +6 vs marked), interrupt +10, punish +5, feint payoff +6, backdash dodge +6, Pact "their move" +4. Decays only below 100. At 100 ↓↓SP2 → **UNRESTRAINED** (`unrT` 360f: walk ×1.3, dmg ×1.08, follow-ups), then SPENT 150f (no gain). Base `dmgBonus` 1.08.
  - SP1 Impulse (rush kick, → Knee & Stomp follow-up in BTR/UNR), ↓→SP1 Disgust (feint: hold block f9–12 to cancel; hold ↓ at f13 = low, else overhead), ↓←SP1 Provocation (counter, `counterNoGrab`), SP2 The Pact (mark 360f), ↓→SP2 No More Pretending (3-hit punish), ↓↓SP2 Break the Rules (240f, costs 25; at 100 upgrades to UNRESTRAINED).
  - Ult **The Spiteful Bloom** `CINE.kanae` ~336f, 250 dmg: world desaturates (`saturation` composite), the eye-flower grows from the ground, captures, closes, blooms, kick; leaves a small seed flower. `kanFlower()` draws the flower.
- **Tokine** (gothic red/black dress, mini clock top hat, twin tails, crimson + gold clock eye, flintlock pistol/musket; LV10 "AFTER SCHOOL" = black sailor uniform, no hat, fringe over the gold eye). Resource **TIME** `F.time` (specials, clone hits, interrupts). At 100 → **TIME SOVEREIGNTY** (`sovT` 420f: half costs, half gain, extra clones), then time = 20. Base `dmgBonus` 1.1.
  - **Clones** are sim entities in `F.clones` `{x,y,face,t,at,kind,dmg,life}`; cap 4 (oldest fades), they fire `tokBullet`/`tokSlash` projectiles, shatter if hit before acting, cleared on KO/round end.
  - SP1 Haste (150f, `xpHaste`), ↓→SP1 Slow bullet (`slowT` + slower recovery), ↓←SP1 Temporal Clone (15: kick if <170 px else shot), SP2 Stop (30: freezes the foe ~38f, 240f re-freeze lock), ↓→SP2 Echoes (40: 3 clones, 4 in Sovereignty), ↓↓SP2 Rewind (20: returns to the marked spot after 80f unless hit; "BROKEN").
  - Ult **Endless Nightmare** `CINE.tokine` ~344f, ~254 dmg: giant roman-numeral clock, nightmare dimension, 7 clones fire in sequence, collapse, slow final bullet, shatter.
- Generic hooks added: `ch.varColors(vi)` returns an outfit palette for a colour variant (used by `chArt`), `makePortrait` passes `opts.pal`; menu figures (select, VS, results) get the outfit via `withVarPal` → `RC.pal[ch.id]` read in `drawFigure`. Palettes switch to the alt look when `F.variant===4`. New sounds in `01_audio.js`: kick, gunshot, tock, bell, gear, rewind, bloom.
- CPU: Tokine's Rewind is a 'virtual' move for the bot. Roster win rate (Normal bots): Kanae ~41%, Tokine ~44%.
- Tests: `mech_kanae.js`, `mech_tokine.js`, plus trials/specials/fuzz/cpu/mobile (`SB_P1=kanae|tokine`)/netsync.

## 7k. Game controllers (`09d_gamepad.js`)

- Browser Gamepad API, no extra service: Xbox, PlayStation (detected by id → button names CROSS/CIRCLE/…, L1/R1) and generic "standard" pads, on PC and phones (USB/Bluetooth). Controller 1 = P1, controller 2 = P2.
- **How it works:** `Pad.poll()` (first line of `tick()` in `10_main.js`) presses the player's bound KEYBOARD codes in `Keys.down`/`Keys.pressed`. So menus, battles, Training, VS CPU, the MOBILE pad (merges P1 keys) and ONLINE (`NetBattle.sample` reads Keys) need no changes, lockstep stays deterministic. Keyboard holds are tracked (`Pad.kb`) so releasing the pad never drops a held key. Buttons still held when the context changes (menu → battle, pause) are latched until released.
- **Battle layout** (remappable, `Settings.padMap` = button index → action, saved): X/□ Light, Y/△ Medium, B/○ Heavy, A/✕ SP1, RB/R1 SP2, LB/L1 + LT/L2 Block, RT/R2 ULT (= SP1+SP2), MENU/OPTIONS pause (Escape), VIEW/SHARE = reset positions in Training (Digit5). Stick and d-pad move.
- **Menus** (fixed): A OK (light + Enter for P1), B back (heavy + Escape for P1), X = medium (RANDOM in select), LB/RB = SP1/SP2 (colour cycling), Start = OK / pause.
- SETTINGS → **CONTROLLER →** (`PadScene`, added to the Settings list by a prototype patch): shows connected pads, remap per action (press a button, conflicts are swapped), reset defaults. How to Play → CONTROLS shows a controller line. Connect/disconnect toast (`Pad.draw`). The MOBILE touch overlay hides while a controller was used in the last 20 s. ONLINE join keypad: d-pad cursor, A types, B deletes/leaves.
- Not covered: Training dummy option keys [1]–[0] still need a keyboard.
- Test: `tests/gamepad.js` (fake `navigator.getGamepads`: menus, settings page, remap/swap/reset, two-cursor select, light attack, walking, ULT, pause/resume, P2 pad, keyboard+pad, keypad; shots to `../shots_gamepad/`).

## 7l. Audio: CC0 samples + music (`01_audio.js`, `01a_audio_files.js`, `audio/`)

- `audio/` holds CC0 files only (Kenney Impact/Interface/RPG/Sci-fi/Voiceover-Fighter packs; OpenGameArt CC0 music by HydroGene, Adiutorium, Spring Spring, Kistol, Juhani Junkala). Sources + licenses: `audio/CREDITS.txt`. Every file exists as `.ogg` and `.mp3`; the browser picks ogg if it can decode Vorbis, else mp3 (older Safari/iOS). Re-encode from the raw packs with `tools/make_audio.py <dir>` (ffmpeg; mono effects, loudness-normalised music).
- `AUDIO_FILES` (`01a_audio_files.js`) maps existing `Sound.play` names to sample variants (`f`, `v` volume, `r` rate, `j` jitter, `w` reverb send, `syn` extra synth layer, `pick(args)` e.g. hit strength → light/heavy punch). **Names not listed, or not loaded yet, play their procedural version** — so the single-file build (artifact, file://) still has full sound. Character-specific sounds stay procedural.
- SFX + announcer are fetched and decoded right after the first click/touch (`Sound.unlock`), ~0.5 MB. Voice cap ~28 samples. Shared convolver reverb (`rvbSend`); osc/noise take a number as `dest` = reverb amount.
- `Sound.announce(key, text)`: Kenney announcer for round 1–5 / final round / fight / time, speech synthesis fallback (K.O., names, "X wins"). Respects Settings.voice.
- New `ultStart(id)` sound in `Battle.superFreeze`: riser + sub swell + per-fighter element colour (`ULT_FLAVOR`).
- Music: `Music.play(name)` starts the sequencer at once and streams `audio/music/<name>` through ONE reused `<audio>` element (iOS: started inside the unlock touch) into the music bus; when it plays the sequencer stops and the file fades in. Errors/offline → sequencer keeps playing.
- Audio never consumes the sim RNG (own PRNG; `Sound.announce` is also wrapped in `09b_net.js`).
- Web build: `build_web.py` copies `audio/` into the site; `sw.js` caches sfx/voice on first use (offline), music goes to the network (range requests). The cache version hashes the audio files too.
- Test: `tests/audio.js [webdir]` (local http server: all samples decode, every sound/announcer plays, all 5 tracks stream, voice cap, file:// fallback).

## 7m. Cosmetics: intros, victory poses, titles (`09e_cosmetics.js`)

- Every fighter has 3 intros and 3 victory poses: index 0 = CLASSIC (the old static `intro`/`victory` pose + `introFx`), 1–2 = animated, unlocked by Mastery: intros LV 1/3/6, victory poses LV 1/5/8 (`COS_UNLOCK`). Colours stay at LV 2/4/7/10, so every level unlocks something.
- **Titles** per mastery level: LV 1–9 shared (ROOKIE … GRANDMASTER, `TITLE_GEN`), LV 10 unique per fighter (`TITLE_TOP`, e.g. Kazuma LIVING INFERNO, The Hollow THE LAST REMNANT). `masteryTitle(ch, lv)`. Shown on the select screen (next to MASTERY LV), VS screen, intro card, COLLECTION, and as NEW TITLE / NEW INTRO / NEW VICTORY POSE toasts on the results screen.
- Animations are keyframe lists built from the fighter's OWN poses and move poses (`cosAnim`, templates in `TPL`: drop, warp, walk/dash, charge, combo, poses, leap) + effects in the fighter's colours (`CFX`). Key: `[frame, pose|'m:<move>[:i]', {r, dx, dy, e, h, x, fx}]`; `dx/dy/h` are DRAW-ONLY offsets/hiding (Fighter.draw wrapper), so x/y and hitboxes never change. Content table: `cosAdd(id, P, …)`; fighters without an entry get `cosFallback`.
- **Loadout** saved in the mastery profile: `Mastery.data.cos = {id: {i, w}}` (-1 = RANDOM among unlocked, default). `Mastery.import` merges it, so the future account sync carries it. Picked in **COLLECTION** (title menu): fighter / intro / victory / title rows, live preview (`CosPlayer`), locked ones can be previewed.
- Battle: `cfg.cos = [{lv, i:[allowed], w:[allowed]}, …]` (local: built from the profile each first round, `cosAuto`; CPU: all three, lv 0). Intro picked in `newRound(first)`, victory pose in `updateKO` (pf 150), both with `Math.random` = seeded NetRng online. Intro still skippable (ENTER/F/K, OK bit online). The results screen replays the winner's victory pose with effects.
- Online: `sel` carries `cs` (loadout), host puts both into the `start` cfg (`cos`), guest + rematch reuse it; `Cos.clean` sanitises. `netsync.js` now runs with random intros/victories.
- Test: `tests/cosmetics.js [ids|all] [-shots]` (every fighter × every intro/victory, pixel + vector, NaN/flow checks, skip, loadout rules; shots to `../../shots_cosmetics/`).

## 7n. Aimi — The Devoted Gaze (`04_zzzz9b_aimi.js`)

Beni asked for "Yuno Gasai (Future Diary)". Like Kanae/Tokine she is an ORIGINAL yandere-archetype fighter with her own name, title and outfits (no copied uniform / dress / cloak designs).
- Look: long pink twin tails (ropes `tailB`/`tailF` + static root in `hairBack`), magenta eyes, school blouse + navy vest + red ribbon tie, navy plaid skirt with a pink flip phone charm, compact pistol with a heart sticker (`aimGun`). Face `aimFace` expressions: normal, smile, calm, stare (pin-point pupils), grin, crazy (shadow over the eyes), smirk, angry; picked per action in `tick` (`F.aimEx`).
- **Skins** = Mastery colour slots (purely visual): 0 school · 1 LAVENDER VOW (LV 2) · 2 MINT DIARY (LV 4) · 3 CRIMSON VOW (LV 7) · 5 **MIDNIGHT DRESS** (arcade skin: black dress, crimson lacing, rose choker, long gloves; was slot 3 until 2026-11-26, old saves/cloud keys `aimi:3` are migrated to `aimi:5`) · 4 **LAST HORIZON** (LV 10: long dark mantle over a white dress, gold heart-lock clasp). Outfits via `AIMI.varColors(vi)` (`AIM_DRESS`, `AIM_CLOAK`).
- **Special unlock (generic):** a `VARIANTS` entry can carry `special: 'arcade'` → `Mastery.unlocked` checks `Mastery.data.unl['<id>:<vi>']` instead of a level. Set by `Mastery.award` on an Arcade clear with that fighter (toast "NEW SKIN UNLOCKED"), merged additively by `Mastery.import` (so the cloud save keeps it; the server keeps top-level keys of the newest upload). The hidden cheat opens it at runtime (`data.clean`) without writing `unl`. Swatch shows ★, message "CLEAR ARCADE WITH AIMI". `varSwatch` now uses `varColors` for outfit skins.
- **OBSESSION** `F.obs` 0–100: melee hits +2 (specials/follow-ups +4), gun hits +3–5, combos past 4 hits +1, interrupting a startup +8 ("INTERRUPTED", 30f lock), hitting an opponent who backdashed/walked away in the last 45 f +6 ("DON'T RUN~", 60f lock). Fades only after 6 s without gain. At 100 → **UNSTABLE LOVE** (`ulT` 330 f): `xpHaste` 0.25, walk ×1.15, dmg ×1.06, red aura + cracked hearts + stare/crazy faces, Deadly Accuracy faster/heavier (beats normal projectiles), Point-Blank launches, Pursuit +1 hit, Rain 7 rounds, No Escape wider + 3 hits. Then `calmT` 240 f with no gain.
- Normals: Sweet Jab, Ribbon Kick, **H = HEARTSHOT** (pistol, 128 px reach, st 14), Rising Heel, Lovestruck Lunge. Base `baseNormals({ dmg: 0.96, spd: -1 })`.
- SP1 **Predatory Dash** (low rush + knee, st 10) → SP1 follow-up **Stay With Me** (point-blank shot, kd) · ↓→SP1 **Deadly Accuracy** (one round ~700 px, st 14) · ↓←SP1 **Point-Blank** (step-in shot, short range, 96 dmg, rec 28) · SP2 **Obsessive Pursuit** (vanish f4–13 = `hidden`, reappears 74 px in front of the foe, max 460 px travel, 4 blockable hits + heel drop `final`; the count starts at 1 outside UL) · ↓→SP2 **Rain of Bullets** (5 rounds every 7 f, last heavy) · ↓↓SP2 **No Escape** (`aimiZone`: 26 f warning circle, then 2 hits while inside, launch -7).
- Ult **THE SKY BREAKS** `CINE.aimi` ~362 f, 230 dmg (20+40+170): calm look → glitch + vanish → opponent looks around (facing flips, restored) → camera rises, sky darkens and cracks → jagged opening tears open (fragments, light rays) → giant Aimi beyond it (silhouette → colours, glowing eye) → giant hand (`cineFg`) reaches down, closes, lifts them → the sky closes (flash + shockwave) → she is back at her spot fixing her hair, smirks. All random geometry is made at f 1 (sim), draws never use Math.random.
- Defeat/victory via `statePose`: fall → tries to push up → kneels with a fist (angry face); victory: sweet → "claim" reach toward the opponent → hair fix with a smirk.
- Sounds (procedural, `01_audio.js`): pistol, cock, aimiLove, aimiVanish, aimiReach, rift, skyCrack, skyTear, skyClose; ULT_FLAVOR 'love'. Cosmetics: intros FOUND YOU / SAFETY OFF, victories ALL MINE / LOVE LETTER, LV 10 title FOREVER YOURS.
- Balance: `BALANCE.aimi = { dmg: 1.12 }` → ~56% in the bot round robin (3 reps vs all 18).
- Tests: `mech_aimi.js` (gains, UL/calm, Rain count, Pursuit range/hits/hidden leak, No Escape warning/avoid, skins = same stats, arcade unlock + import + cheat, ult cleanup), `aimi_look.js` (skins/faces/pose sheet), `aimi_ult.js [out] [px] [skin]` (ult frames), `aimi_battle.js` (battle + select previews).

## 7o. Arcade skins for every fighter (`09cz_arcade.js`, 2026-11-26)

Beni: "can the others also get arcade skins you get when you clear it? e.g. The Hollow with a veil, a crown and a long mantle".
- Every fighter now has **6 colour slots** (`VAR_UNLOCK = [1,2,4,7,10,99]`, `VAR_N = 6`); **slot 5 = ARCADE skin** (`special: 'arcade'`), unlocked by clearing Arcade with that fighter (`Mastery.data.unl['<id>:5']`, same path as Aimi's dress). Swatch ★, toast "NEW SKIN UNLOCKED", cloud-merged, cheat opens them. The mirror rule never hands out slot 5 (4/5 → 0).
- A costume (`ARC[id]`) = extra palette keys (`pal`, k-prefixed: kc cape, kl lining, kt trim…) merged by `varPal` (battle) and `ch.varColors(5)` (menus/portraits/cut-ins) with a `cos` marker, plus parts drawn by `drawFigure` at fixed layers: `back` (behind everything), `skirt` (after the skirt), `neck`, `headBack`/`head` (head space, around hairBack/hairFront), `front` (over the front arm), optional extra `ropes`. Silhouettes/afterimages of the fighter wear it too (`RC.cos` set during `Fighter.draw`). Frog Trinity: `FROGS.drawCustom` wrapper (crowns + cape on the big frog). Helpers: `cosCape`, `cosDrape`, `cosCrown`, `cosFur`, `cosEpaulette`, `cosRose`, `cosHorn`.
- Designs (all original): Kazuma CHAMPION'S ROBE · Yoru FOX SHRINE · Sera STARFALL WITCH · Goro RED SHOGUN · Frogs FROG ROYALS · Tetsumichi ROYAL EXPRESS · Fudagami PHANTOM MAGICIAN · Nue WILD MONARCH · Vespera MIDNIGHT COUNTESS · Borgar WOLF JARL · Buzzu DEVIL PRINCE · Reika SUPREME COMMANDER · Yamika ABYSS QUEEN · Lunaria SILVER ARCHON · Kuon HEAVEN'S HAORI · **The Hollow THE VEILED KING** (Beni's idea: sheer veil over the face and down the back, pale iron crown with violet gems, floor-length torn mantle) · Kanae THORN QUEEN · Tokine MIDNIGHT ORACLE · Aimi MIDNIGHT DRESS.
- COLLECTION has a new SKIN row (cycle all 6, locked ones preview only, sets the pick). Admin: GIVE ARCADE SKIN → grant key `arc_<id>` / `arc_all` (no SQL change: the existing regex/level check accepts it), applied in `Cloud.applyGrants`.
- Tests: `mech_arcade.js` (unlock, import + Aimi migration, admin grants, mirror rule, every fighter fights + ults in it vector/pixel, select/VS/collection shots `../shots_arcade_*.png`), `arcade_look.js` (sheet), `arcade_preview.js` (poster), `ultdraw.js` with `SB_V=5`.

## 7p. Friends list, online status, match invites (`09f_friends.js`, `cloud/supabase_friends.sql`, 2026-11-26)

Beni: "a friends list so you see if friends are online and can invite them to play".
- Needs an account. Add-on SQL `cloud/supabase_friends.sql` (run once in the Supabase SQL Editor after `supabase_setup.sql`; rerunnable): `sb_users.online_at/status`, tables `sb_friends (uid,fid)` (friendship = both rows exist, one row = request) and `sb_invites (src,dst,room,ans,at)`; RPCs `sb_friends(token,status)` (= the ping, returns friends/incoming/outgoing/invites/sent), `sb_friend_add`, `sb_friend_remove`, `sb_invite(token,name,room)` (room '' = cancel, friends only, 6 digits), `sb_invite_answer`. Online = ping < 50 s old; invites live 90 s (inviter re-sends every 75 s while the room waits).
- Client `Friends` polls every 20 s (4 s on the FRIENDS / invite screens), not while the tab is hidden; status 'match' during fights. FRIENDS screen: from ONLINE lobby menu and ACCOUNT menu (text field to add by name; rows invites → requests → friends (online first) → sent requests; ↑/↓ + ←/→ + ENTER or mouse; REMOVE asks twice). INVITE = `FriendInviteScene` (NetLobbyScene subclass: CREATE ROOM + send code; shows sent / said no). Invite pop-up (JOIN / NO) on any menu via `Pad.poll`/`Pad.draw` hooks, hidden in fights and online rooms. Title shows "● N friends online · N requests" under the ACCOUNT chip.
- Test: `tests/friends.js` (two browsers + local PeerServer + cloudmock; needs both SQL files loaded).

## 7q. Urban legends: Hachishakusama and Kuchisake-onna (`04_zzzz9c_hachi.js`, `04_zzzz9d_kuchi.js`, 2026-11-26)

Beni asked for two fighters from public-domain Japanese urban legends; the real names are used. Both stylised and non-gory.

**HACHISHAKUSAMA** (`hachi`), zoner / space control. Tall chibi (own dims, scale 1.1, hurt box 196), white wide-brim hat with black band, long white dress, long black hair (3 ropes), face hidden under the hat shadow until she "reveals" (`hacFace` normal/reveal/hurt/ko). Slow, deliberate timings; `mute` voice, procedural "po… po… po…" (`Sound.po`).
- **PRESENCE** `F.pres` 0–100 (`hacGain`): apparition / shadow / reach hits, keeping the foe at 200–500 px or cornered, the foe standing still (+6), every step/jump/special of a WATCHED foe. Decays after 6 s. At 100 → **FULL MANIFESTATION** (`manT` 480 f): longer reach (560), double apparition strikes, extra shadow arms, Shadow Claw follow-up.
- Apparitions are real attackers: harmless carrier projectile `hachiApp` (max 3, dispel by hitting it, tracks a marked foe ≤170 px) that strikes via a `hachiStrike` hitbox.
- SP1 **Po… Po… Po…** (apparition right behind the foe, ≤560 px) · ↓→SP1 **Unnatural Reach** (arm `hachiArm`, st 20, pulls) · ↓←SP1 **The White Apparition** (placed apparition; hold →/← for 420/120 px instead of 260) · SP2 **The Distance Disappears** (hidden f8–23, `hachiFlicker` shows the landing spot, strike; Manifestation → SP2 follow-up **Shadow Claw**) · ↓→SP2 **Shadow of the Eight Feet** (3/4/5 `hachiShadow` arms with warning pools, slow) · ↓↓SP2 **The Watcher** (mark ≤700 px, 6 s, no damage).
- Ult **THE EIGHT-FOOT TALL NIGHTMARE** `CINE.hachi` ~452 f, 7 phases (silence · po po po · she is gone · distant white figures · the impossible distance · the grab + giant silhouette · the darkness under her shadow), 240 dmg (20+40+180). Defeat dissolve `hachiFade`.
- Skins: SUMMER DUSK, MOURNING, RED SUMMER, TRUE FORM (LV 10, glow), arcade **WHITE SHRINE** (white cape with red lining, red cord, paper shide). Cosmetics: intros DISTANT FIGURE / THE WATCHER, wins PO… PO… / NOWHERE TO HIDE, LV 10 title EIGHT FEET OF DREAD.

**KUCHISAKE-ONNA** (`kuchi`), rushdown / mix-up with scissors. Long beige coat (tails in `drawSkirt`), red scarf, surgical mask; with the mask down a stylised wide smile with stitch marks (`kuSmile`), no blood. Big scissors (`kuScissors`, pose keys `kp` open / `gr` dangling).
- **BEAUTY** `F.bea` 0–100 (`kuGain`, ×1.5 while the mask is off): scissor hits (`sc:1`), feints (hit within 45 f of `feintT`), cross-ups, low/overhead mix-ups, interrupts. At 100 → **TRUE SMILE** (`tsT` 360 f): mask off, faster, Snip Snap follow-up, Vanishing Step half cooldown, stronger scissors; then calm 200 f. `kuFearT` = TERRIFIED (slower walk).
- SP1 **Scissor Strike** (2 cuts; True Smile → SP1 **Snip Snap** launcher) · ↓→SP1 **Vanishing Step** (hidden f5–11, behind by default, front with ←) · ↓←SP1 **Are You Pretty?** (counter f11–36 → Wrong Answer; unanswered → No Answer? cut when close) · SP2 **The Mask Comes Off** (shockwave 280 px → TERRIFIED, +30 Beauty, extends True Smile once) · ↓→SP2 **Open Wide** (rush command grab → `CINE.kuchiOpen`, 150/175 dmg) · ↓↓SP2 **Now You See It** (3 `kuchiDecoy` afterimages front/behind/above, one real: mid / cross-up / overhead).
- Ult **THE QUESTION** `CINE.kuchi` ~392 f, 6 phases (darkness · "Am I pretty?" · mask comes down · behind / beside / everywhere, faster · final question · 口裂け).
- Skins: CHARCOAL / NAVY / CRIMSON COAT, TRUE SMILE (LV 10, glow), arcade **SCARLET NIGHT** (red coat, black mask, cloche hat with a rose, cape). Cosmetics: intros EXCUSE ME / SUDDEN STEP, wins NOW WE MATCH / SNIP SNIP, LV 10 title AM I PRETTY?.
- Balance: `BALANCE.hachi = { dmg: 1.2, hp: 1050 }` (bot plays her slow kit badly; 25% → 55% over 2 reps), `BALANCE.kuchi = { dmg: 1.0 }` (50%). `balance.js` now takes `SB_ONLY=hachi,kuchi` to run only matches involving those fighters.
- Select screen: long names / title lines are now scaled to fit beside the grid.
- Tests: `horror_look.js <id>` (lineup, faces, pose sheet, 6 skins), `horror_battle.js [out]` (battle + select previews); both pass trials, specials, fuzz, corner, ultdraw (incl. `SB_V=5`), cosmetics, mech_arcade, cpu, menus, mobile.

## 7r. Universal throw / grab for every fighter (`04_zzzzd_throw.js`, 2026-11-26)
- Input: **M + H** together (lenient: M or H started ≤3 frames earlier converts, from neutral only, not from a cancel). Touch: GRAB button (bottom right, presses M+H). Controller: LT by default (old saved maps with LT = Block are migrated). Hold ← for a back throw.
- Rules: move `THROW` (st 5, act 3, rec 24, range ≈ shorter than a jab, `throw: 1, grab: 1, type: 'unblock'`) added to every fighter + Nue's beast forms. Beats blocking and counter stances; can't grab airborne foes, hitstun, blockstun, wall splat, getup/invuln. Whiff = 32 frames, punishable.
- TECH: defender presses M + H within the first 10 cine frames (`THROW_TECH`), or both throw at once → "TECH!", both pushed apart, no damage. Stats: `F.stats.techs`.
- Animation: `CINE.throwT` with 5 templates (toss / slam / knee / blast / spin), per-fighter name + accent colour + own heavy pose (`THROW_STYLE`). Damage 100 × fighter damage multiplier. Deterministic (no Math.random in sim).
- CPU: throws when close and the foe stands/blocks (`throw` per level), guesses a tech (`tech`: 8 / 30 / 50 %).
- Engine hooks: `Battle.endCine` takes `cine.landT`; `checkHits` skips throws vs block/wall/burst; Move lists, HOW TO PLAY (commands + advanced) mention it. Test: `tests/throw.js` (every fighter: idle, block, tech, whiff, jump, contact range, back throw, lenient press, clash, CPU), screenshots `tests/throwshots.js`.

## 8. History of requests (in order)

1. Original anime fighting game (Kazuma, Yoru, Sera, Goro).
2. Frog Trinity and Conductor characters.
3. Advanced combo system + Cardmaster (Fudagami).
4. Nue, the Beast Shifter (5 random beasts, Primal Ascension).
5. 2D pixel-anime visual overhaul (browser-only, gameplay preserved, multi-resolution, arcade UI).
6. Audio: discussed better SFX/voices; ElevenLabs connector failed (OAuth "Invalid scopes: webhooks_write") → **skipped for now**.
7. Chibi redesign of Nue, Fudagami and Sera from a style reference image.
8. Vespera, The Blood Saint, in chibi style.
9. Three expansion fighters in chibi style: Borgar (Rune Berserker), Buzzu (Chainsaw Beast, Pochita-inspired but original), Reika (Control Devil, Makima-inspired but original). Each has 3 SP1 + 3 SP2 specials, a unique mechanic, a cinematic ult, a HUD panel, trials and a How-to page.
10. Chibi redesign of the last 5 classic fighters (Kazuma, Yoru, Goro, Frog Trinity, Tetsumichi), visual only. Also clamped the Frog Trinity's ultimate so the frogs can't leave the stage near a wall (cosmetic, found by fuzz).
11. Singleplayer mode vs CPU (Easy/Normal/Hard, Single Match + Arcade ladder) and a RANDOM button in character select.
12. MOBILE mode: touch controls for singleplayer (stick, L/M/H, SP1/SP2, Block, Ult, direction shortcuts, pause).
13. Two new fighters: Yamika, The Wicked Eye (chuunibyou trickster) and Lunaria, The Moon Sovereign (humanoid lunar queen), with ult cinematics centred on the eyepatch reveal and the eclipse.
14. Kuon, The Honored One (Gojo-inspired space manipulator) with the cinematic Domain Expansion: Unlimited Void.
15. The Hollow, The Psychic Sealer (Beni's original manga character): Psychic Fragments, Outlet Seal (locks the last used special), Psychic Overload and the ult The Last Remnant with his wife.
16. ONLINE 1v1 between two devices (free PeerJS/WebRTC, lockstep netcode) + installable web app on GitHub Pages (icedyuu.github.io/soul-breakers).
17. Mastery system (per-fighter levels from Arcade / VS CPU / Online, saved locally, ready for future accounts) + 4 unlockable colour variants per fighter, shown to the online opponent.
18. Kanae, The Spiteful Bloom (Nakamura-inspired trickster/counter, REBELLION + UNRESTRAINED, eye-flower ult) and Tokine, The Nightmare Clock (Kurumi-inspired time/clone fighter, TIME + SOVEREIGNTY, clock ult), each with an LV10 alt outfit.
19. Game controller support (Xbox/PlayStation/generic via the Gamepad API, P1/P2, menus, online, remapping in SETTINGS → CONTROLLER).
20. Better audio: CC0 sound effects (Kenney), announcer voice, CC0 music per menu/stage/results, richer synthesized ultimates; procedural sound stays as fallback (§7l).
21. Six specials for every fighter: new ↓→SP2 moves for the six classics and ↓↓SP2 Seal Drop for Nue (see §5).
22. Cosmetics (2026-11-26): 2 animated intros + 2 victory poses per fighter, mastery titles (unique LV 10 title per fighter), COLLECTION screen (§7m).
23. Aimi, The Devoted Gaze (2026-11-26): Beni's "Yuno Gasai" request as an original yandere fighter — OBSESSION / UNSTABLE LOVE, pistol kit, THE SKY BREAKS ult, school / MIDNIGHT DRESS (Arcade clear) / LAST HORIZON (LV 10) skins (§7n).
24. Arcade skins for every fighter (2026-11-26): one costume per fighter unlocked by clearing Arcade with them, The Hollow's THE VEILED KING (veil, crown, long mantle) as Beni described (§7o).
25. Friends list (2026-11-26): add friends by account name, see who is online, invite them to an ONLINE 1 VS 1 with one click (§7p).
26. Two urban-legend fighters (2026-11-26): Hachishakusama (zoner, PRESENCE → FULL MANIFESTATION, 7-phase ult) and Kuchisake-onna (scissor rushdown, BEAUTY → TRUE SMILE, 6-phase ult) (§7q).
27. Universal throw for all 21 fighters (2026-11-26): M + H, throw tech, back throw, GRAB touch button, LT on controllers, CPU throws/techs (§7r).

## 9. Open ideas / possible next steps

- Audio: listen and tune volumes / track choices (bamboo track is cosy rather than night-time; loops not checked by ear). Optional: KO/name announcer lines.
- Hands-on balance pass for Vespera, Borgar, Buzzu, Reika, Yamika, Lunaria, Kuon, The Hollow, Kanae, Tokine, Aimi, Hachishakusama and Kuchisake-onna (verified by automated trials and stress tests, not by human play).

## 10. Testing approach used so far

Headless Chromium (Playwright) scripts: build → syntax check → render pose sheets (vector + pixel) → combo-trial macros for every character → random-input "fuzz" matchups looking for errors/infinites → screenshots of select, battle, cinematics, HUD, how-to. Keep doing this after every change.

The test scripts are in `tests/` inside the source zip. Run each with node and Playwright.
- `harness.js` exposes `T.start/frame/draw`. Set `SB_DIST` to test another build.
- `trials.js ids [-v]` runs the combo-trial bot. Known bot limits, present in the original build too: some Sera, Frog, Cardmaster and Nue trials need inputs the bot can't make.
- `specials.js id [shots]` runs every move at two ranges, standing and guarding, and saves ult screenshots.
- `fuzz.js [frames]` plays random-input matchups of each fighter in `SB_FUZZ` (default borgar,buzzu,reika) against the whole roster, checking errors, NaN, out-of-bounds positions, stuck cines/hitstun and forcePose leaks.
- `cpu.js [all|rate|roster ids]` plays full bot-vs-bot matches (every fighter at every level; or win rates between levels), checking errors, NaN, out-of-bounds and hangs. `menus.js` walks title → VS CPU → select (random) → battle → arcade results and saves screenshots to `../shots_cpu/`.
- `mobile.js` opens the game as an iPhone in landscape and drives the pad with real multitouch (CDP): walk, L, SP shortcuts, ULT, block, jump, pause/resume, no pad in 2P, Training, portrait banner; screenshots go to `../shots_mobile/`. `SB_MOBILE=1` makes `harness.js` run any test with MOBILE on (keyboard goes through the pad path).
- `SB_P1=<id> node mobile.js` runs the touch checks with another fighter (shots to `../shots_mobile_<id>/`).
- `mech_new.js` checks Yamika/Lunaria mechanics (Phantom Return, field effects, Awakening, Eclipse, Dominion boomerang, Nightfall, leaks). `ultshots.js id frames` captures cinematic frames; `shots3.js` takes the Yamika/Lunaria previews.
- `poses.js id` renders a pose sheet.
- `shots.js` takes screenshots of select, battle, move list and How-to; `shots2.js` does select + battles for the redesigned classics.
- `lineup.js ids [out] [pose]` draws a stance lineup; `heads.js ids` a big close-up of the heads.
- Default build path is `../dist/index.html` (run the scripts from `tests/`).

### New stages (2026-11-26)
- MIDNIGHT ACADEMY (夜の学園): school rooftop at night, moon, fence, sakura in the courtyard, tournament banner; pixel: drifting clouds, blinking radio tower, classroom lights switching, one flickering fluorescent. Music: menu track.
- CLOCKWORK SPIRE (時計塔): inside a clock tower, giant backlit clock face (mirrored numerals), gears, chains, lanterns; pixel: moving hands, meshing gears, light shafts, dust. Music: neon track.
- RUNE FORGE (霊峰鍛冶場): forge hall carved into a snowy mountain, glowing gate, rune monoliths, cyan rune braziers, rune circle on the floor; pixel: aurora, pulsing runes, snow, sparks. Music: volcano track.
- Stage select is a 3×2 grid (↑/↓ switches rows). All stage animation is visual only (netplay hashes identical on all new stages). Test: `tests/stages.js` (every stage vector+pixel, draw cost, select nav; shots to `../shots_stages/`).

### Hollow ultimate freeze fix (2026-11-26)
- Bug: during THE LAST REMNANT the rift ellipse's width was `46*k + sin(T)*3`; while the rift opened/closed (small k) it could go negative depending on the frame timer, so `ctx.ellipse` threw mid-draw. The main loop caught it, but the draw's open `ctx.save()`s piled up every frame → lag that looked like a crash ("sometimes", because it depended on timing).
- Fix: radius = `max(0.1, k*(46 + sin*3))` (same look). Main loop now resets the canvas state (`ctx.reset()` / `canvas.width = canvas.width`) after any draw exception, so a future draw bug can't snowball.
- Tests: `tests/ultdraw.js [id…]` plays every ultimate from 6 start timings × both sides × pixel/vector on a tiny canvas and fails on any draw exception (the old build fails it). `tests/ultperf.js [id…] [-px|-vec] [-p1] [-v=N]` times every ult frame (env `SB_DPR=3` in harness.js simulates a high-DPI screen).

### Accounts, cloud save, online rankings, admin (2026-11-26, `09e_account.js`, `cloud/supabase_setup.sql`)
- Backend: Beni's free **Supabase** project `https://pugmlvxaadjiuazlmyra.supabase.co` (West EU). The game holds only the public publishable key (`CLOUD_CFG`). Database set up by pasting `cloud/supabase_setup.sql` into the Supabase SQL Editor (safe to run again). All tables have RLS on with no policies: the game can only call the `sb_*` functions via `POST /rest/v1/rpc/<fn>` (plain fetch, no library). Free projects pause after ~1 week without traffic (resume in the dashboard).
- Accounts: username (3–16, A–Z 0–9 _) + password (6–64), no e-mail. bcrypt (pgcrypto), random 48-hex session token in `localStorage['sb_account_v1']`. 5 wrong passwords → 5 min lock; max 5 new accounts per IP per hour.
- Title: ACCOUNT chip top-left (name + rating when logged in) → `AccountScene` (log in / new account with real HTML `<input>`s over the canvas, `DomIn`; profile panel; RANKINGS; ADMIN; LOG OUT). `go()` calls `scene.dispose()` so the inputs are removed. `RankScene` shows the top 100 (12 per page). Local play never needs an account; offline just keeps progress on the device.
- Cloud save: every `Mastery.save()` uploads the profile (debounced 2.5 s) via `sb_save`; the server merges per fighter (higher XP wins) and returns the merged save, which is imported. Login/refresh pulls the cloud save. **Hidden cheat** stays local: `unlockAll` stores the real XP in `Mastery.data.clean`, new XP is added there too, and the upload uses the clean values.
- Ranked: on connect both peers send `{t:'acct', u:name}`. Match key = `room-seed-matchNo` (set in `netStartMatch`). In `NetResultsScene` both report (`sb_report`); the server rates (Elo K 32, start 1000) only when both reports name each other with opposite results; advisory lock handles simultaneous reports. Max 5 rated matches per pair per 24 h. Results screen shows "RANKED · +16 → 1016" (or why it was unranked); select screen shows RANKED/UNRANKED. Rage-quit (disconnect before the result) leaves the match unrated.
- Admin: usernames in table `sb_admins` (the SQL adds `beni`). ADMIN screen: give a fighter or ALL a mastery level (grant = XP floor, applied on the player's next refresh/login), look up, set a new password, ban/unban (banned players are hidden from rankings).
- Tests: `cloudsql.js` (server rules), `account.js` (UI, sync, cheat, admin, rankings, offline), `SB_CLOUD=1 netplay.js` (two browsers play ranked matches, both must be rated). They need a local Postgres with the SQL loaded and npm `pg`; `tests/cloudmock.js` stands in for Supabase's REST API (calls run as role `anon`, so grants are tested).

## Character select redesign + fighter unlocks (2026-11-26)
- Select screen (`09_scenes.js` CharSelectScene): centre grid of face tiles (`ch.portrait` zoomed on the head), rows of 7 (`cols`/`rows`/`cardRect` scale for more fighters, 4 rows from 22+), big info panels stay on both sides, RANDOM under the grid. Up/Down wraps through all rows. `locked(i)` hook: lock icon, cannot confirm, RANDOM skips it.
- Unlocks (`09g_unlock.js`, `Roster`): only YOUR fighter in ARCADE / 1P VS CPU is locked (CPU opponent, local versus, online, practice, training = everyone). Free: the 9 originals (`FREE_FIGHTERS`). Each Arcade clear unlocks one random locked fighter (results toast). When any fighter reaches mastery `FREE_PICK_LV` (3) the player gets ONE free pick: confirm a locked fighter → "USE YOUR FREE PICK?" dialog.
- Saved in the mastery profile: `fu {id:1}`, `fuAll`, `fuFree` (picks used), `fuV` (new-format flag). Migration: a profile/account save without `fuV` that already has XP/wins gets `fuAll` (old players keep everyone). Account sync only adds. Cheat (`data.clean`) opens all on this device only. Admin: GIVE LEVEL (fighter or ALL) also unlocks; grant keys `f_<id>`/`f_all` work too.
- Test: `tests/unlock.js`.

## Ranked seasons + online rematch polish (2026-11-26)
- SQL add-on `cloud/supabase_ranked.sql` (run after setup.sql; rerunnable). Columns on sb_users: `sw`/`sl` (season W/L), `peak`, `badges` [{s,t,p}]. Tables `sb_seasons`, `sb_season_results`. Season = calendar month, always ≥ ~2 weeks (season 1 ends 2027-01-01 UTC). Lazy rollover in `sb_season_tick()` (called by sb_season_top / sb_season_me and a BEFORE INSERT trigger on sb_matches): players with 3+ season matches get a badge for their PEAK tier (place 1 = CHAMPION crown), then ratings move halfway to 1000 and sw/sl reset. A BEFORE UPDATE trigger on sb_users counts sw/sl/peak from sb_report's wins/losses changes, so sb_report itself is unchanged. Admin RPC `sb_admin_season_end(token)`.
- Tiers from rating (client `TIERS` in 09e_account.js, SQL `sb_tier`): BRONZE <1050 ≤ SILVER <1125 ≤ GOLD <1200 ≤ PLATINUM <1300 ≤ DIAMOND <1400 ≤ MASTER. `drawTierBadge` shield icon.
- Client: rankings show the current season (falls back to sb_top when the add-on is missing: MISSING_FN), account screen shows tier + season box + earned badges, title shows tier, friends list tier badge, online select shows both tiers, results show tier + PROMOTED / DOWN TO. Season-end reward pop-up on the title screen once per season (localStorage `sb_season_seen_<name>`).
- Rematch (already existed, both must accept): now "RIVAL WANTS A REMATCH!" banner + ACCEPT REMATCH label, and SERIES x – y per room.
- Test: tests/ranked.js (SQL + screens; local Postgres with all three SQL files). Phone test checklist: /mnt/project-files/soul-breakers/HANDY_ONLINE_TEST.md.
## Story mode for Arcade (`09h_story.js`, 2026-11-26)
- `STORY[id]` per fighter: `riv` (rival id), `pre` (PROLOGUE before fight 1), `vs` (FINAL BATTLE scene with the rival), `end` (ending after ARCADE CLEAR). Lines `{ s: 'p'|'r'|null, t }` (null = narration). `STORY_FALLBACK` for fighters added later without a story.
- `arcadeCfg` is wrapped: the rival is always the last of the `ARCADE_LEN` opponents. `arcadeVS(cfg)` (used by character select + NEXT FIGHT) returns a `StoryScene` before fight 1 / the final fight, else the VSScene.
- `StoryScene`: portraits (speaker lit), typewriter text box, any key/click = next, ESC / G / SKIP button = skip scene. Ending: victory figure (with colour variant) + text box; then back to character select. Results after ARCADE CLEAR gets a first button STORY ENDING (not online).
- The Hollow's lines are telepathy `< ... >` (violet). Hachishakusama only says "po... po...". Rivals: Kazuma↔Goro, Borgar→Goro, Goro→Borgar, Sera↔Lunaria, Kanae↔Tokine, Reika↔Buzzu, Kuon↔Hollow, Nue→Hollow, Yamika→Kuon, Yoru/Aimi/Hachi→Kuchi, Kuchi→Hachi, Frogs→Buzzu, Tetsumichi→Tokine, Fudagami→Yamika, Vespera→Reika.
- Test: `tests/story.js` (rival order for all 21, every scene draws, prologue/skip/rival/ending flow). `tests/menus.js` skips the prologue.
### Combo list + training options + Buzzu hurtbox (2026-11-26, src/09h_combobook.js)
- Pause menu → COMBO LIST: verified combos for all 21 fighters (COMBO_BOOK, generated from COMBOS.md + player guide; Nue per form, Fudagami per hand), EASY/MEDIUM/HARD/SOUL, damage % and hits, pages with ←/→. Also in the online pause menu.
- Pause menu (practice/training) → TRAINING OPTIONS: dummy stance/guard/action, new DUMMY THROW TECH, meter refill, hitboxes, reset (works with touch/controller; number keys 1–7 still work). Practice panel shows live/last combo with % of HP and best combo damage.
- Buzzu hurtbox now normal size (h 170, crouch 112, air 136/160): standard combos hit him (46/54 bot combos vs 11/54 before; launcher air combos still miss him). Balance re-tuned: buzzu dmg 0.98, hp 960 (bot win rate ~55%, was 25% with the new box at the old values).
- Tests: tests/combobook.js (menu flow, all pages draw, dummy tech, Buzzu hit, last combo).

### Tutorial for new players (2026-11-27, `src/09i_tutorial.js`)
- `TutorialBattle extends Battle` (mode 'practice', Kazuma vs Yoru dummy, stage 0): 10 lessons in `TUT_LESSONS` (move, jump, dash, L/M/H + sweep, block high/low with an attacking dummy, throw vs a blocking dummy, throw tech vs a throwing dummy, 5 specials, ultimate, first combo L→M→H→SP1). Steps tick off from real events (startMove keys, state changes, blocks in `resolveHit`, throw cine, `stats.techs`, `comboHits`).
- Prompts follow the device in use (`tutNames`): keyboard keys from the binds, controller buttons from `Settings.padMap`, touch names (DASH, SP swipes, GRAB, ULT) + pulsing rings on the touch buttons. Tech window is 24 frames inside the tutorial (normal 10).
- SKIP pill (click/tap) and pause menu SKIP LESSON / EXIT TUTORIAL. End screen: PRACTICE / 1P VS CPU / TUTORIAL AGAIN / MAIN MENU. Practice panel hidden while `bt.tutorial`.
- Title: TUTORIAL item (NEW / ✔) and a one-time "NEW HERE?" offer on a fresh save (no mastery data, not logged in, no invite link; skipped under `navigator.webdriver` unless `window.SB_TUT_OFFER`). Saved flags `Settings.tutSeen`, `Settings.tutDone`.
- Test: `tests/tutorial.js` (plays all lessons with keyboard, offer, skip, pause, controller + touch prompts; shots to `../shots_tut/`).
