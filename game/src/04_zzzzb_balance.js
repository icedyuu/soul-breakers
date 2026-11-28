// Balance pass (2026-11-26, re-tuned after the higher jumps in 04_zzzzc_jump.js): per-fighter tuning measured with tests/balance.js (full bot-vs-bot round robin).
// dmg: multiplies all damage the fighter deals; hp: replaces base health. Kits, frame data and identities stay untouched.
const BALANCE = {
  goro:    { dmg: 0.76, hp: 1030 },
  borgar:  { dmg: 0.84, hp: 1130 },
  saint:   { dmg: 0.72 },
  buzzu:   { dmg: 0.98, hp: 960 },   // re-tuned with the bigger hurtbox (09h_combobook.js)
  conductor: { dmg: 0.86 },
  frogs:   { dmg: 0.91 },
  nue:     { dmg: 0.97 },
  kazuma:  { dmg: 0.99 },
  tokine:  { dmg: 1.10 },
  aimi:    { dmg: 1.12 },
  hachi:   { dmg: 1.2, hp: 1050 },
  kuchi:   { dmg: 1.0 },
  jackpot: { dmg: 1.08, hp: 1020 },
  haze:    { dmg: 1.25, hp: 1050 },
  teke:    { dmg: 0.84, hp: 900 },
  // HAUNTED FOUR: one entry per rolled form (key haunted_<form>)
  haunted_bear:    { dmg: 1.0, hp: 1000 },
  haunted_rabbit:  { dmg: 0.94, hp: 1080 },
  haunted_chicken: { dmg: 1.12, hp: 1040 },
  haunted_fox:     { dmg: 1.0, hp: 900 },
  yoru:    { dmg: 1.08 },
  yamika:  { dmg: 1.12 },
  kanae:   { dmg: 1.12 },
  lunaria: { dmg: 1.20 },
  cardmaster: { dmg: 1.14 },
  sera:    { dmg: 1.20 },
  reika:   { dmg: 1.28, hp: 980 },
  hollow:  { dmg: 1.27, hp: 1010 },
  honored: { dmg: 1.32, hp: 1040 },
};
for (const ch of [...CHARS, ...Object.values(typeof HF_FORMS !== 'undefined' ? HF_FORMS : {})]) {
  const b = BALANCE[ch.formId && ch.id === 'haunted' ? 'haunted_' + ch.formId : ch.id]; if (!b) continue;
  if (b.hp) ch.health = b.hp;
  if (b.dmg && b.dmg !== 1) { const base = ch.dmgBonus, m = b.dmg; ch.dmgBonus = base ? F => base(F) * m : () => m; }
}
