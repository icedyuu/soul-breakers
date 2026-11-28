// Jump pass (2026-11-26): every fighter jumps higher and a little farther so a cornered fighter can always
// jump over the opponent (corner escape without teleport). One factor for all, so relative differences stay.
const JUMP_TUNE = { v: 1.1, x: 1.12 };
for (const ch of [...CHARS, ...Object.values(typeof HF_FORMS !== 'undefined' ? HF_FORMS : {})]) { ch.jumpV *= JUMP_TUNE.v; ch.jumpX *= JUMP_TUNE.x; }
