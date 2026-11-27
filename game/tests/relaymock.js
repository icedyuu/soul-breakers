// Minimal stand-in for Supabase Realtime (Phoenix protocol, vsn 1.0.0): phx_join, heartbeat,
// broadcast fan-out to the other sockets on the same topic (self: false). Used by netplay.js
// (SB_NET_RELAY=1) to test the WebSocket relay fallback. Counts messages for the rate check.
const path = require('path');
const WS_MOD = process.env.SB_WS_MODULE || path.resolve(process.env.SB_PEER_MODULE || '', '../ws');
exports.start = port => {
  const { WebSocketServer } = require(WS_MOD);
  const wss = new WebSocketServer({ port });
  const topics = new Map(), stats = { msgs: 0, maxPerSec: 0, sec: 0, cur: 0 };
  wss.on('connection', ws => {
    ws.topics = new Set();
    ws.on('message', buf => {
      let d; try { d = JSON.parse(buf); } catch (e) { return; }
      const reply = st => ws.send(JSON.stringify({ topic: d.topic, event: 'phx_reply', payload: { status: st, response: {} }, ref: d.ref, join_ref: d.join_ref }));
      if (d.event === 'phx_join') { if (!topics.has(d.topic)) topics.set(d.topic, new Set()); topics.get(d.topic).add(ws); ws.topics.add(d.topic); return reply('ok'); }
      if (d.event === 'heartbeat') return reply('ok');
      if (d.event === 'broadcast') {
        const s = Math.floor(Date.now() / 1000); if (s !== stats.sec) { stats.sec = s; stats.cur = 0; } stats.cur++; stats.msgs++; stats.maxPerSec = Math.max(stats.maxPerSec, stats.cur);
        const out = JSON.stringify({ topic: d.topic, event: 'broadcast', payload: d.payload, ref: null });
        for (const o of topics.get(d.topic) || []) if (o !== ws && o.readyState === 1) o.send(out);
      }
    });
    ws.on('close', () => { for (const t of ws.topics) topics.get(t).delete(ws); });
  });
  return { stats, close: () => wss.close() };
};
