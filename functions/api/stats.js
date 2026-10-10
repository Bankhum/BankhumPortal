/**
 * GET /api/stats?days=0|7|30
 * Usage count per system, ranked from most to least used.
 * days=0 (default) = all time. Times in D1 are stored as Thai time (UTC+7).
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

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'D1 binding "DB" is not configured' }, 500);
  const url = new URL(request.url);
  const days = clampDays(url.searchParams.get('days'));
  const since = days > 0 ? `AND c.ts >= datetime('now', '+7 hours', '-${days} days')` : '';

  const { results } = await env.DB.prepare(`
    SELECT s.id, s.name_th, s.name_en, COUNT(c.id) AS count, MAX(c.ts) AS last_used
    FROM systems s
    LEFT JOIN clicks c ON c.system_id = s.id ${since}
    WHERE s.active = 1
    GROUP BY s.id
    ORDER BY count DESC, s.sort_order ASC
  `).all();

  const total = results.reduce((sum, r) => sum + r.count, 0);
  return json(
    { ok: true, days, total, updated: new Date().toISOString(), items: results },
    200,
    { 'Cache-Control': 'public, max-age=15' }
  );
}
