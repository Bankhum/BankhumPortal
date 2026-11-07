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
    const res = await fetch(NEWS_ORIGIN + '/', { cf: { cacheTtl: 300, cacheEverything: true } });
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
    // + issues published later via the newsletter admin page / Google Drive sync (stored in its D1)
    try {
      const r = await fetch(NEWS_ORIGIN + '/api/issues', { cf: { cacheTtl: 120, cacheEverything: true } });
      if (r.ok) {
        const d = await r.json();
        const del = new Set(d.deleted || []);
        const by = new Map((d.items || []).map(x => [x.id, x]));
        for (let i = issues.length - 1; i >= 0; i--) {
          const x = issues[i];
          if (del.has(x.id)) issues.splice(i, 1);
          else if (by.has(x.id)) { issues[i] = { ...by.get(x.id) }; by.delete(x.id); }
        }
        for (const x of by.values()) if (!del.has(x.id)) issues.push({ ...x });
      }
    } catch (_) {}
    if (!issues.length) return null;
    // dates may come in Buddhist years (e.g. 2569-11-05) from the AI reader — normalise to CE
    for (const it of issues) {
      const m = /^(\d{4})(-\d{2}-\d{2})/.exec(it.date || '');
      if (m && +m[1] > 2400) it.date = (+m[1] - 543) + m[2];
    }
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
