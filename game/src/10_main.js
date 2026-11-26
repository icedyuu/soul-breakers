// ================================ MAIN ================================
let scene = null, muteToast = 0;
function go(s) { if (scene && scene !== s && scene.dispose) scene.dispose(); scene = s; Keys.pressed.clear(); Mouse.clicked = false; }
let VIEW_K = 1;
function resize() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H), dpr = window.devicePixelRatio || 1;
  canvas.style.width = Math.floor(W * s) + 'px'; canvas.style.height = Math.floor(H * s) + 'px';
  // render at the real screen resolution so pixel art stays crisp (capped for performance)
  VIEW_K = clamp(s * dpr, 1, 3); canvas.width = Math.round(W * VIEW_K); canvas.height = Math.round(H * VIEW_K);
}
window.addEventListener('resize', resize); resize();

// pre-render portraits used by menus / HUD / ultimate cut-ins
CHARS.forEach(ch => {
  ch.portrait = makePortrait(ch, 300, 300, { scale: 3.0 });
  ch.card = makePortrait(ch, 100, 186, { scale: 2.1, hy: 0.4, hx: 0.45 });
  ch.cutin = makePortrait(ch, 760, 190, { scale: 6.5, hx: 0.4, hy: 0.5, glow: true, expr: 'shout', bg1: '#000000' });
  for (const [k, f] of [['portrait', 1 / 3], ['card', 0.5], ['cutin', 0.5]]) {
    const hd = ch[k]; let px = null;
    Object.defineProperty(ch, k, { configurable: true, get() { return Settings.pixel ? (px || (px = PIX.pixelizeCanvas(hd, f, { outline: true, step: 18 }))) : hd; } });
  }
});

function globalKeys() {
  const bound = ACTIONS.some(a => Settings.binds[1][a] === 'KeyM' || Settings.binds[2][a] === 'KeyM');
  if (Keys.pressed.has('KeyM') && !bound && !Keys.rebind) { Settings.muted = !Settings.muted; Sound.applyVolume(); Settings.save(); muteToast = 90; }
}
let errShown = null;
function tick() {
  Pad.poll();
  globalKeys();
  scene.update();
}
let last = performance.now(), acc = 0;
function frame(now) {
  let dt = now - last; last = now; if (dt > 250) dt = 250;
  acc += dt; let n = 0;
  try {
    while (acc >= STEP && n < 4) { tick(); Keys.pressed.clear(); Mouse.clicked = false; Mouse.moved = false; acc -= STEP; n++; }
    if (n >= 4) acc = 0;
    ctx.setTransform(VIEW_K, 0, 0, VIEW_K, 0, 0); ctx.imageSmoothingEnabled = !Settings.pixel; ctx.save(); scene.draw(ctx); ctx.restore();
    Pad.draw(ctx);
    if (muteToast > 0) {
      muteToast--; ctx.save(); ctx.globalAlpha = Math.min(1, muteToast / 20); ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(W - 200, H - 70, 180, 40);
      ctx.font = `800 18px ${FONT_UI}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(Settings.muted ? '🔇 MUTED' : '🔊 SOUND ON', W - 110, H - 50); ctx.restore();
    }
  } catch (e) {
    if (!errShown) { errShown = e; console.error(e); }
    acc = 0;
    // a draw that throws mid-way leaves its ctx.save()s open; reset the canvas state so they can't pile up frame after frame
    if (ctx.reset) ctx.reset(); else canvas.width = canvas.width;
  }
  requestAnimationFrame(frame);
}
go(new TitleScene());
requestAnimationFrame(frame);
