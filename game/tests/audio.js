// Audio check: CC0 samples + music load over http (web build), every sound plays without errors,
// music file takes over from the sequencer, and file:// (single-file build) falls back to synthesis.
//   node audio.js [webdir]   (default ../../site; build it with python3 build.py && python3 build_web.py ../site)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const WEB = path.resolve(process.argv[2] || path.join(__dirname, '../../site'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const ARGS = { hit: [[1], [2], [3]], whoosh: [[0.8], [1.2]], ultStart: [['kazuma'], ['honored'], ['tokine'], ['sera'], ['nobody']], saw: [[1]], ding: [[1]] };
(async () => {
  const srv = http.createServer((q, r) => {
    const f = path.join(WEB, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
    if (!f.startsWith(WEB) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    const st = fs.statSync(f), ty = TYPES[path.extname(f)] || 'application/octet-stream', rg = q.headers.range;
    if (rg) { const [a, b] = rg.replace('bytes=', '').split('-'); const s = +a, e = b ? +b : st.size - 1; r.writeHead(206, { 'Content-Type': ty, 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': e - s + 1 }); return fs.createReadStream(f, { start: s, end: e }).pipe(r); }
    r.writeHead(200, { 'Content-Type': ty, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(f).pipe(r);
  }).listen(0);
  const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
  for (const mode of ['http', 'file']) {
    const page = await browser.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/favicon|sw\.js/.test(m.text())) errors.push(m.text()); });
    await page.goto(mode === 'http' ? `http://localhost:${port}/index.html` : 'file://' + path.resolve(__dirname, '../dist/index.html'));
    await page.waitForTimeout(400);
    await page.mouse.click(640, 360);   // unlock
    await page.evaluate(() => { Settings.muted = false; Settings.voice = true; Sound.applyVolume(); });
    await page.waitForTimeout(mode === 'http' ? 2500 : 300);
    const st = await page.evaluate(() => Sound.status());
    const want = await page.evaluate(() => { const u = new Set(); for (const k in AUDIO_FILES.sfx) AUDIO_FILES.sfx[k].f.forEach(f => u.add(f)); return u.size + Object.keys(AUDIO_FILES.voice).length; });
    if (mode === 'http') ok(st.loaded === want && st.fail === 0, `samples decoded ${st.loaded}/${want} (${st.ext}) ${st.failed.join(' ')}`);
    else ok(st.loaded === 0, `file:// uses synthesis only (decoded ${st.loaded})`);
    // every sound, with its arguments
    const n = await page.evaluate(ARGS => { let c = 0; for (const k of Sound.names()) for (const a of (ARGS[k] || [[]])) { Sound.play(k, ...a); c++; } for (const k in AUDIO_FILES.voice) Sound.announce(k, k); Sound.announce('ko', 'K.O.'); return c; }, ARGS);
    await page.waitForTimeout(500);
    ok(errors.length === 0, `${mode}: played ${n} sounds, errors: ${errors.slice(0, 3).join(' | ')}`);
    // music
    const res = {};
    for (const tr of ['menu', 'neon', 'volcano', 'bamboo', 'results']) {
      await page.evaluate(tr => Music.play(tr), tr);
      await page.waitForTimeout(1800);
      res[tr] = await page.evaluate(() => { const el = Sound.musicEl(); return el ? { paused: el.paused, t: +el.currentTime.toFixed(2), src: el.src.split('/').pop() } : null; });
    }
    if (mode === 'http') ok(Object.values(res).every(r => r && !r.paused && r.t > 0.2), 'music files stream: ' + JSON.stringify(res));
    else ok(Object.values(res).every(r => r === null), 'file:// music: sequencer fallback');
    // stress: many hits in one frame stay under the voice cap
    await page.evaluate(() => { for (let i = 0; i < 80; i++) Sound.play('hit', 3); });
    const live = await page.evaluate(() => Sound.status().live);
    ok(live <= 30, `voice cap holds (${live} live)`);
    // mute + volume still apply (no throw)
    await page.evaluate(() => { Settings.muted = true; Sound.applyVolume(); Sound.play('hit', 2); Music.stop(); });
    ok(errors.length === 0, `${mode}: no errors at end`);
    await page.close();
  }
  await browser.close(); srv.close();
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
