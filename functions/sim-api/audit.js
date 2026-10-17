/** GET /sim-api/audit: the latest 100 audit entries (ADMIN only). */
import { whoAmI, atLeast, audit, json } from '../../sim-src/sim-auth-lib.js';

export async function onRequestGet({ env, request }) {
  const user = await whoAmI(env, request);
  if (!atLeast(user.role, 'ADMIN')) { await audit(env, request, user, 'denied', 'audit'); return json({ ok: false, error: 'admin only' }, 403); }
  await audit(env, request, user, 'view', 'audit');
  if (!env.SIM_DB) return json({ ok: true, stored: false, rows: [] });
  const r = await env.SIM_DB.prepare('SELECT ts, email, role, action, detail FROM sim_audit_log ORDER BY id DESC LIMIT 100').all();
  return json({ ok: true, stored: true, rows: r.results });
}
