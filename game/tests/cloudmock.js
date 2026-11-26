// Minimal stand-in for Supabase's REST API (PostgREST /rest/v1/rpc/<fn>) on a LOCAL Postgres that has
// cloud/supabase_setup.sql loaded. Calls run as role `anon`, like the real thing, so grants are tested too.
//   start(port) -> server.   env SB_PG = connection string (default: local socket /tmp/pgsb, port 5433)
const http = require('http');
const PG = process.env.SB_PG_MODULE || require.resolve('pg', { paths: [process.cwd(), __dirname, '/tmp/claude-0/sbnode'] });
const { Pool } = require(PG);
function start(port = 9200, opts = {}) {
  const pool = new Pool({ connectionString: process.env.SB_PG || 'postgresql://postgres@localhost:5433/postgres?host=/tmp/pgsb' });
  const srv = http.createServer(async (q, r) => {
    r.setHeader('access-control-allow-origin', '*'); r.setHeader('access-control-allow-headers', '*'); r.setHeader('access-control-allow-methods', 'POST, OPTIONS');
    if (q.method === 'OPTIONS') { r.statusCode = 204; return r.end(); }
    const m = /^\/rest\/v1\/rpc\/([a-z_]+)$/.exec(q.url);
    if (!m || q.method !== 'POST' || !q.headers.apikey) { r.statusCode = 404; return r.end('{"message":"not found"}'); }
    let body = ''; for await (const c of q) body += c;
    let args = {}; try { args = body ? JSON.parse(body) : {}; } catch (e) { r.statusCode = 400; return r.end('{"message":"bad json"}'); }
    if (opts.delay) await new Promise(res => setTimeout(res, opts.delay));
    if (srv.down) { r.statusCode = 503; return r.end('{"message":"down"}'); }
    const keys = Object.keys(args), cl = await pool.connect();
    try {
      await cl.query('begin');
      await cl.query("select set_config('request.headers', $1, true)", [JSON.stringify({ 'x-forwarded-for': q.headers['x-test-ip'] || '127.0.0.1' })]);
      await cl.query('set local role anon');
      const sql = `select ${m[1]}(${keys.map((k, i) => `${k} := $${i + 1}`).join(', ')}) as r`;
      const res = await cl.query(sql, keys.map(k => args[k] !== null && typeof args[k] === 'object' ? JSON.stringify(args[k]) : args[k]));
      await cl.query('commit');
      const v = res.rows[0].r;
      srv.calls = (srv.calls || 0) + 1;
      if (v === null || v === undefined || v === '') { r.statusCode = 204; return r.end(); }
      r.setHeader('content-type', 'application/json'); r.end(JSON.stringify(v));
    } catch (e) {
      await cl.query('rollback').catch(() => { });
      r.statusCode = 400; r.setHeader('content-type', 'application/json'); r.end(JSON.stringify({ code: e.code, message: e.message }));
    } finally { cl.release(); }
  }).listen(port);
  srv.pool = pool;
  srv.sql = async (s, p) => (await pool.query(s, p)).rows;
  srv.shut = async () => { srv.close(); await pool.end(); };
  return srv;
}
module.exports = { start };
