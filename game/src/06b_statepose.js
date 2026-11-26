// Optional per-fighter pose override for non-attack states (e.g. Aimi's multi-step defeat and victory):
// ch.statePose(F) → [pose, rate] or null. forcePose (cinematics) and cosmetic animations still win.
{
  const tp = Fighter.prototype.targetPose;
  Fighter.prototype.targetPose = function () {
    if (this.ch.statePose && !this.forcePose) { const r = this.ch.statePose(this); if (r) return r; }
    return tp.call(this);
  };
}
