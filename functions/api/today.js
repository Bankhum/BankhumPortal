/**
 * GET /api/today
 * Public "วันนี้ที่บ้านคุ้ม" summary. Aggregates only — no names, no per-person data.
 *  - portal system usage today vs yesterday (from D1 clicks, Thai time)
 *  - latest newsletter + issues this month (read from the public newsletter archive)
 */
const NEWS_ORIGIN = 'https://new.bankhum.ac.th';

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });
}

async function usage(db) {
  const today = "date('now', '+7 hours')";
  const [totals, top] = await db.batch([
    db.prepare(`
      SELECT
        SUM(CASE WHEN substr(ts, 1, 10) = ${today} THEN 1 ELSE 0 END) AS today,
        SUM(CASE WHEN substr(ts, 1, 10) = date('now', '+7 hours', '-1 day') THEN 1 ELSE 0 END) AS yesterday,
        COUNT(DISTINCT CASE WHEN substr(ts, 1, 10) = ${today} THEN system_id END) AS systems_today
      FROM clicks
      WHERE ts >= date('now', '+7 hours', '-1 day')`),
    db.prepare(`
      SELECT c.system_id AS id, s.name_th, s.name_en, COUNT(*) AS count
      FROM clicks c JOIN systems s ON s.id = c.system_id
      WHERE substr(c.ts, 1, 10) = ${today}
      GROUP BY c.system_id
      ORDER BY count DESC
      LIMIT 3`),
  ]);
  const t = totals.results[0] || {};
  return {
    today: t.today || 0,
    yesterday: t.yesterday || 0,
    systemsToday: t.systems_today || 0,
    top: top.results || [],
  };
}

async function newsletters() {
  try {
    const res = await fetch(NEWS_ORIGIN + '/', { cf: { cacheTtl: 600, cacheEverything: true } });
    if (!res.ok) return null;
    const html = await res.text();
    const start = html.indexOf('/*ISSUES*/');
    const end = html.indexOf('/*/ISSUES*/');
    if (start < 0 || end < 0) return null;
    const block = html.slice(start, end);
    // each issue is a flat JSON object on its own line
    const issues = (block.match(/\{"id":[^{}]*\}/g) || [])
      .map(s => { try { return JSON.parse(s); } catch (_) { return null; } })
      .filter(Boolean);
    if (!issues.length) return null;
    issues.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.n || 0) - (a.n || 0));
    const latest = issues[0];
    const thisMonth = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 7);
    const abs = p => (p ? (/^https?:/.test(p) ? p : `${NEWS_ORIGIN}/${p.replace(/^\//, '')}`) : '');
    return {
      total: issues.length,
      thisMonth: issues.filter(i => (i.date || '').startsWith(thisMonth)).length,
      latest: {
        issue: latest.issue || '',
        title: latest.title || '',
        date: latest.date || '',
        thumb: abs(latest.thumb || latest.image),
        url: `${NEWS_ORIGIN}/`,
      },
    };
  } catch (_) {
    return null;
  }
}

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ ok: false, error: 'D1 binding "DB" is not configured' }, 500);
  const [u, n] = await Promise.all([usage(env.DB), newsletters()]);
  return json(
    {
      ok: true,
      date: new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10),
      updated: new Date().toISOString(),
      usage: u,
      newsletter: n,
    },
    200,
    { 'Cache-Control': 'public, max-age=60' }
  );
}
