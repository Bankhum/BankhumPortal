/**
 * GET /sim-api/attendance: today's attendance per class from BANKHUM SIS (TEACHER, EXECUTIVE, ADMIN only).
 * Counts only. The SIS feed has no names, so none are shown here either.
 * Attendance tells who checked in today; it is not evidence of where anyone is right now.
 */
import { whoAmI, atLeast, audit, json } from '../../sim-src/sim-auth-lib.js';
const SIS = 'https://sis.bankhum.ac.th/api/sim/today';

export async function onRequestGet({ env, request }) {
  const user = await whoAmI(env, request);
  if (!atLeast(user.role, 'TEACHER')) { await audit(env, request, user, 'denied', 'attendance'); return json({ ok: false, error: 'login required' }, 401); }
  await audit(env, request, user, 'view', 'attendance');
  if (!env.SIM_FEED_TOKEN) return json({ ok: false, status: 'unconfigured' }, 503);
  let d;
  try {
    const r = await fetch(SIS, { headers: { Authorization: `Bearer ${env.SIM_FEED_TOKEN}` } });
    if (!r.ok) return json({ ok: false, status: 'error', error: `SIS ${r.status}` }, 502);
    d = await r.json();
  } catch { return json({ ok: false, status: 'error', error: 'SIS unreachable' }, 502); }
  const by = {};
  for (const x of d.rooms || []) by[x.cls + "|" + x.room] = { cls: x.cls, room: x.room, enrolled: x.enrolled, present: 0, late: 0, absent: 0, leave: 0 };
  // SIS statuses: PRESENT, LATE, LEAVE, SICK, ABSENT (sick counts as leave here)
  const KEY = { PRESENT: 'present', LATE: 'late', ABSENT: 'absent', LEAVE: 'leave', SICK: 'leave' };
  for (const s of d.scans || []) { const o = by[s.cls + "|" + s.room], k = KEY[String(s.status).toUpperCase()]; if (o && k) o[k]++; }
  for (const o of Object.values(by)) o.no_record = Math.max(0, o.enrolled - o.present - o.late - o.absent - o.leave);
  return json({ ok: true, date: d.date, classes: Object.values(by), sis_generated_at: d.generated_at, fetched_at: new Date().toISOString() });
}
