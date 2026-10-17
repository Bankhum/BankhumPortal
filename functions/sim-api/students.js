/**
 * GET /sim-api/students?q=: search the school roster by name, student ID or class (TEACHER, EXECUTIVE, ADMIN only).
 * Names live only in the D1 database bound as SIM_DB (table sim_roster), never in the public page or the repository.
 * Returns class, number, ID and name. No location: the roster says which class a student is in, not where they are.
 */
import { whoAmI, atLeast, audit, json } from '../../sim-src/sim-auth-lib.js';

export async function onRequestGet({ env, request }) {
  const user = await whoAmI(env, request);
  if (!atLeast(user.role, 'TEACHER')) { await audit(env, request, user, 'denied', 'students'); return json({ ok: false, error: 'login required' }, 401); }
  const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 40);
  if (q.length < 2) return json({ ok: false, error: 'พิมพ์อย่างน้อย 2 ตัวอักษร' }, 400);
  await audit(env, request, user, 'search', 'students: ' + q);
  if (!env.SIM_DB) return json({ ok: false, status: 'unconfigured' }, 503);
  try {
    const like = '%' + q.replace(/[%_\\]/g, c => '\\' + c) + '%';
    const r = await env.SIM_DB.prepare(
      "SELECT cls, no, student_id, name, gender, term FROM sim_roster WHERE name LIKE ?1 ESCAPE '\\' OR student_id = ?2 OR cls = ?2 ORDER BY cls, no LIMIT 50"
    ).bind(like, q).all();
    return json({ ok: true, rows: r.results });
  } catch (e) { return json({ ok: false, status: 'unconfigured', error: 'roster table missing' }, 503); }
}
