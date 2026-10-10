/**
 * POST /api/click   body: {"id":"document","url":"https://..."}  (JSON or text/plain, works with sendBeacon)
 * Records one use of a system. Only IDs that exist in the systems table are accepted.
 */
function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });
}

function clampDays(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 3650) : 0;
}

// Anyone can call this endpoint, so cap clicks per IP (keeps a script from flooding D1 and skewing the stats).
const CLICK_LIMIT = 30;        // clicks per IP
const CLICK_WINDOW = 600;      // per 10 minutes
let limitTable = false;

async function tooManyClicks(request, db) {
  if (!limitTable) {
    await db.prepare('CREATE TABLE IF NOT EXISTS click_limits (k TEXT PRIMARY KEY, n INTEGER NOT NULL, exp INTEGER NOT NULL)').run();
    limitTable = true;
  }
  const now = Math.floor(Date.now() / 1000);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  const ipHash = [...new Uint8Array(digest)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
  const key = ipHash + ':' + Math.floor(now / CLICK_WINDOW);
  const row = await db.prepare(
    'INSERT INTO click_limits (k, n, exp) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = n + 1 RETURNING n'
  ).bind(key, now + CLICK_WINDOW).first();
  if (Math.random() < 0.02) await db.prepare('DELETE FROM click_limits WHERE exp < ?').bind(now).run();
  return row.n > CLICK_LIMIT;
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'D1 binding "DB" is not configured' }, 500);
  let body = {};
  try { body = JSON.parse(await request.text()); } catch (_) { body = {}; }
  const id = String(body.id || '').trim().slice(0, 64);
  const target = String(body.url || '').slice(0, 1000);
  if (!id) return json({ ok: false, error: 'missing id' }, 400);

  if (await tooManyClicks(request, env.DB)) return json({ ok: false, error: 'too many clicks' }, 429);

  const sys = await env.DB.prepare('SELECT id, url FROM systems WHERE id = ? AND active = 1').bind(id).first();
  if (!sys) return json({ ok: false, error: 'unknown system id' }, 400);

  await env.DB.prepare(
    "INSERT INTO clicks (ts, system_id, url, source) VALUES (datetime('now', '+7 hours'), ?, ?, 'web')"
  ).bind(id, target || sys.url).run();

  return json({ ok: true });
}
