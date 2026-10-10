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

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'D1 binding "DB" is not configured' }, 500);
  let body = {};
  try { body = JSON.parse(await request.text()); } catch (_) { body = {}; }
  const id = String(body.id || '').trim().slice(0, 64);
  const target = String(body.url || '').slice(0, 1000);
  if (!id) return json({ ok: false, error: 'missing id' }, 400);

  const sys = await env.DB.prepare('SELECT id, url FROM systems WHERE id = ? AND active = 1').bind(id).first();
  if (!sys) return json({ ok: false, error: 'unknown system id' }, 400);

  await env.DB.prepare(
    "INSERT INTO clicks (ts, system_id, url, source) VALUES (datetime('now', '+7 hours'), ?, ?, 'web')"
  ).bind(id, target || sys.url).run();

  return json({ ok: true });
}
