/**
 * GET /sim-api/teachers?date=: per-teacher check-in times from the saraban system (TEACHER, EXECUTIVE, ADMIN only).
 * Name, in/out time and method (finger/photo/sig/manual). No signature, photo or GPS: the saraban feed never sends them.
 * Public visitors get 401 and keep seeing only the anonymous totals from /sim-feed.
 */
import { whoAmI, atLeast, audit, json } from '../../sim-src/sim-auth-lib.js';
const SARABAN = 'https://sarabun.bankhum.ac.th/api/sim/teachers-today';

export async function onRequestGet({ env, request }) {
  const user = await whoAmI(env, request);
  if (!atLeast(user.role, 'TEACHER')) return json({ ok: false, error: 'login required' }, 401);
  if (!env.SIM_FEED_TOKEN) return json({ ok: false, status: 'unconfigured' }, 503);
  const q = new URL(request.url).searchParams.get('date') || '', date = /^\d{4}-\d\d-\d\d$/.test(q) ? q : '';
  await audit(env, request, user, 'view', 'teachers ' + (date || 'today'));
  try {
    const r = await fetch((env.SARABAN_URL || SARABAN) + '?names=1' + (date ? '&date=' + date : ''), { headers: { Authorization: `Bearer ${env.SIM_FEED_TOKEN}` }, signal: AbortSignal.timeout(4000) });
    if (!r.ok) return json({ ok: false, error: 'saraban ' + r.status }, 502);
    const d = await r.json();
    if (!Array.isArray(d.people)) return json({ ok: false, status: 'old-worker' }, 502);   // สารบรรณยังใช้ worker.js รุ่นเก่า
    const t = x => /^\d\d:\d\d$/.test(x || '') ? x : null, m = x => ['finger', 'photo', 'sig', 'manual'].includes(x) ? x : null;
    return json({ ok: true, date: d.date, start: d.start, people: d.people.map(p => ({ name: String(p.name || '').slice(0, 80), in: t(p.in), out: t(p.out), m_in: m(p.m_in), m_out: m(p.m_out) })) },
      200, { 'cache-control': 'private, no-store' });
  } catch (e) { return json({ ok: false, error: String(e.message || e).slice(0, 100) }, 502); }
}
