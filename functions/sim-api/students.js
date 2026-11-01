/**
 * GET /sim-api/students?q=: search the school roster by name, student ID or class (TEACHER, EXECUTIVE, ADMIN only).
 * Names come live from BANKHUM SIS (/api/export/students, key SIS_EXPORT_KEY kept server side), never from the public page or the repository.
 * If SIS_EXPORT_KEY is not set, falls back to the D1 database bound as SIM_DB (table sim_roster).
 * Returns class, number, ID and name. No location: the roster says which class a student is in, not where they are.
 */
import { whoAmI, atLeast, audit, json } from '../../sim-src/sim-auth-lib.js';
const SIS = 'https://sis.bankhum.ac.th/api/export/students';
let cached = null;   // { at, rows } per isolate, 5 minutes

async function sisRoster(env) {
  if (cached && Date.now() - cached.at < 300000) return cached.rows;
  const r = await fetch(SIS, { headers: { 'x-api-key': env.SIS_EXPORT_KEY } });
  if (!r.ok) throw new Error(`SIS ${r.status}`);
  const d = await r.json(), term = `${d.term_no}/${d.year_be}`;
  const rows = (d.students || []).map(s => ({
    cls: s.room > 1 ? `${s.grade}/${s.room}` : s.grade, no: s.roll_no, student_id: s.code,
    name: `${s.prefix}${s.first} ${s.last}`.trim(), nickname: s.nickname, gender: s.gender, term }));
  cached = { at: Date.now(), rows };
  return rows;
}

export async function onRequestGet({ env, request }) {
  const user = await whoAmI(env, request);
  if (!atLeast(user.role, 'TEACHER')) { await audit(env, request, user, 'denied', 'students'); return json({ ok: false, error: 'login required' }, 401); }
  const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 40);
  if (q.length < 2) return json({ ok: false, error: 'พิมพ์อย่างน้อย 2 ตัวอักษร' }, 400);
  await audit(env, request, user, 'search', 'students: ' + q);
  if (env.SIS_EXPORT_KEY) {
    try {
      const words = q.toLowerCase().split(/\s+/).filter(Boolean);
      const rows = (await sisRoster(env)).filter(x => x.student_id === q || x.cls === q
        || words.every(w => `${x.name} ${x.nickname}`.toLowerCase().includes(w))).slice(0, 50);
      return json({ ok: true, source: 'sis', rows: rows.map(({ nickname, ...x }) => x) });
    } catch (e) { return json({ ok: false, status: 'error', error: 'ติดต่อ SIS ไม่ได้' }, 502); }
  }
  if (!env.SIM_DB) return json({ ok: false, status: 'unconfigured' }, 503);
  try {
    const like = '%' + q.replace(/[%_\\]/g, c => '\\' + c) + '%';
    const r = await env.SIM_DB.prepare(
      "SELECT cls, no, student_id, name, gender, term FROM sim_roster WHERE name LIKE ?1 ESCAPE '\\' OR student_id = ?2 OR cls = ?2 ORDER BY cls, no LIMIT 50"
    ).bind(like, q).all();
    return json({ ok: true, rows: r.results });
  } catch (e) { return json({ ok: false, status: 'unconfigured', error: 'roster table missing' }, 503); }
}
