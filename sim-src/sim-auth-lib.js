/**
 * BANKHUM CAMPUS SIM: login and roles, used by functions/sim-auth/* and functions/sim-api/*.
 * Login is Google with a school account (@bankhum.ac.th), checked on the server.
 * No password is ever handled here. The session is an HMAC-signed cookie (8 hours).
 *
 * Settings (Pages → Settings → Variables and Secrets):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET  OAuth client (Web application) from Google Cloud Console
 *   SIM_SESSION_SECRET                      any long random string
 *   SIM_EXECUTIVES, SIM_ADMINS              comma-separated school emails; everyone else @bankhum.ac.th is TEACHER
 *   SIM_DB (D1 binding, database "bankhum-campus-sim")  audit log + student roster; without it the log goes to the Functions log
 */
export const DOMAIN = 'bankhum.ac.th';
export const ROLES = ['PUBLIC', 'TEACHER', 'EXECUTIVE', 'ADMIN'];
const COOKIE = 'sim_session', STATE = 'sim_state', HOURS = 8;

export const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });

export const authReady = env => !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.SIM_SESSION_SECRET);

const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
async function hmac(secret, data) {
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', k, enc.encode(data)));
}
function same(a, b) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }

export async function sign(env, obj) { const p = b64u(enc.encode(JSON.stringify(obj))); return p + '.' + await hmac(env.SIM_SESSION_SECRET, p); }
export async function verify(env, tok) {
  if (!tok || !env.SIM_SESSION_SECRET) return null;
  const [p, s] = tok.split('.'); if (!p || !s || !same(s, await hmac(env.SIM_SESSION_SECRET, p))) return null;
  try { const o = JSON.parse(new TextDecoder().decode(unb64u(p))); return o.x > Date.now() ? o : null; } catch { return null; }
}
export const cookies = req => Object.fromEntries((req.headers.get('Cookie') || '').split(/;\s*/).filter(Boolean).map(c => { const i = c.indexOf('='); return [c.slice(0, i), c.slice(i + 1)]; }));
export const setCookie = (n, v, maxAge) => `${n}=${v}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
export { COOKIE, STATE, HOURS };

const list = s => (s || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
export function roleFor(env, email) {
  email = email.toLowerCase();
  if (!email.endsWith('@' + DOMAIN)) return 'PUBLIC';
  if (list(env.SIM_ADMINS).includes(email)) return 'ADMIN';
  if (list(env.SIM_EXECUTIVES).includes(email)) return 'EXECUTIVE';
  return 'TEACHER';
}
export const atLeast = (role, need) => ROLES.indexOf(role) >= ROLES.indexOf(need);

/** The signed-in user, or a PUBLIC visitor. The role is looked up again on every request, so removing someone from SIM_ADMINS takes effect at once. */
export async function whoAmI(env, req) {
  const s = await verify(env, cookies(req)[COOKIE]);
  return s ? { email: s.e, name: s.n, role: roleFor(env, s.e) } : { role: 'PUBLIC' };
}

export async function audit(env, req, user, action, detail = '') {
  const row = { ts: new Date().toISOString(), email: user.email || null, role: user.role, action, detail: String(detail).slice(0, 200),
    ip: req.headers.get('CF-Connecting-IP') || null };
  try {
    if (env.SIM_DB) {
      await env.SIM_DB.prepare('CREATE TABLE IF NOT EXISTS sim_audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, email TEXT, role TEXT, action TEXT, detail TEXT, ip TEXT)').run();
      await env.SIM_DB.prepare('INSERT INTO sim_audit_log (ts, email, role, action, detail, ip) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(row.ts, row.email, row.role, row.action, row.detail, row.ip).run();
    } else console.log('SIM_AUDIT', JSON.stringify(row));
  } catch (e) { console.log('SIM_AUDIT_FAIL', JSON.stringify(row), String(e)); }
}
