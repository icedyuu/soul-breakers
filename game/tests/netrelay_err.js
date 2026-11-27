// Error paths of the online lobby: wrong code over the relay, relay-only host (PeerJS unreachable),
// and no way through at all (no WebRTC, no relay) → clear message.
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const DIST = process.env.SB_DIST || path.resolve(__dirname, '../dist/index.html'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const R = require('./relaymock').start(9216);
  const srv = http.createServer((q, r) => { r.setHeader('content-type', 'text/html'); r.end(fs.readFileSync(DIST)); }).listen(9217);
  const b = await chromium.launch(); let ok = true;
  const page = async (relay) => { const p = await (await b.newContext()).newPage(); await p.addInitScript(u => { localStorage.clear(); window.SB_NET_NOP2P = 1; window.SB_RELAY_URL = u; }, relay ? 'ws://127.0.0.1:9216/x' : 'ws://127.0.0.1:9299/x'); await p.goto('http://127.0.0.1:9217/'); await p.waitForTimeout(300); return p; };
  const wait = async (p, ms) => { for (let t = 0; t < ms; t += 250) { await sleep(250); const s = await p.evaluate(() => Net.status); if (s !== 'connecting' && s !== 'opening') break; } return p.evaluate(() => Net.status + ': ' + Net.err); };
  let g = await page(true); await g.evaluate(() => Net.join('123456')); let m = await wait(g, 23000); console.log('wrong code:', m); ok = ok && /No answer from room 123456/.test(m);
  g = await page(false); await g.evaluate(() => Net.join('123456')); m = await wait(g, 23000); console.log('blocked:', m); ok = ok && /phone hotspot/.test(m);
  const h = await page(true); await h.evaluate(() => Net.host()); await wait(h, 5000); const code = await h.evaluate(() => Net.status === 'waiting' && Net.code); console.log('relay-only host waiting:', code);
  g = await page(true); await g.evaluate(c => Net.join(c), code); m = await wait(g, 10000); console.log('relay-only join:', m); ok = ok && !!code && /^connected/.test(m);
  const g3 = await page(true); await g3.evaluate(c => Net.join(c), code); m = await wait(g3, 10000); console.log('third device:', m); ok = ok && /already full/.test(m);
  console.log(ok ? 'NETRELAY_ERR PASS' : 'NETRELAY_ERR FAIL'); await b.close(); srv.close(); R.close(); process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
