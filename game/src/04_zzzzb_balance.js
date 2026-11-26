// Balance pass (2026-11-26): per-fighter tuning measured with tests/balance.js (full bot-vs-bot round robin).
// dmg: multiplies all damage the fighter deals; hp: replaces base health. Kits, frame data and identities stay untouched.
const BALANCE = {
  goro:    { dmg: 0.78, hp: 1030 },
  borgar:  { dmg: 0.84, hp: 1130 },
  saint:   { dmg: 0.78 },
  buzzu:   { dmg: 0.82 },
  conductor: { dmg: 0.86 },
  frogs:   { dmg: 0.94 },
  nue:     { dmg: 0.97 },
  kazuma:  { dmg: 0.99 },
  tokine:  { dmg: 1.10 },
  yoru:    { dmg: 1.08 },
  yamika:  { dmg: 1.14 },
  kanae:   { dmg: 1.08 },
  lunaria: { dmg: 1.14 },
  cardmaster: { dmg: 1.14 },
  sera:    { dmg: 1.15 },
  reika:   { dmg: 1.28, hp: 980 },
  hollow:  { dmg: 1.27, hp: 1010 },
  honored: { dmg: 1.30, hp: 1040 },
};
for (const ch of CHARS) {
  const b = BALANCE[ch.id]; if (!b) continue;
  if (b.hp) ch.health = b.hp;
  if (b.dmg && b.dmg !== 1) { const base = ch.dmgBonus, m = b.dmg; ch.dmgBonus = base ? F => base(F) * m : () => m; }
}
