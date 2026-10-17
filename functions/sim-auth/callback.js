/**
 * GET /sim-auth/callback: Google returns here. The code is exchanged on the server with the client secret,
 * and only a verified @bankhum.ac.th account gets a session. Anyone else stays PUBLIC.
 */
import { authReady, sign, verify, cookies, setCookie, STATE, COOKIE, HOURS, DOMAIN, roleFor, audit } from '../../sim-src/sim-auth-lib.js';

export async function onRequestGet({ env, request }) {
  const u = new URL(request.url), back = r => new Response(null, { status: 302, headers: [
    ['Location', u.origin + '/?login=' + r], ['Set-Cookie', setCookie(STATE, '', 0)], ['Cache-Control', 'no-store']] });
  if (!authReady(env)) return back('unconfigured');
  const st = await verify(env, cookies(request)[STATE]);
  if (!st || st.s !== u.searchParams.get('state') || !u.searchParams.get('code')) return back('failed');
  let tok;
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code: u.searchParams.get('code'), client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: u.origin + '/sim-auth/callback', grant_type: 'authorization_code' }) });
    if (!r.ok) return back('failed');
    tok = await r.json();
  } catch { return back('failed'); }
  // The ID token came straight from Google's token endpoint over TLS, so its claims can be read without re-checking the signature.
  let c;
  try { c = JSON.parse(atob(tok.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch { return back('failed'); }
  const okIss = c.iss === 'https://accounts.google.com' || c.iss === 'accounts.google.com';
  const email = String(c.email || '').toLowerCase();
  if (!okIss || c.aud !== env.GOOGLE_CLIENT_ID || c.exp * 1000 < Date.now() || !c.email_verified || c.hd !== DOMAIN || !email.endsWith('@' + DOMAIN)) {
    await audit(env, request, { role: 'PUBLIC', email: null }, 'login_denied', 'not a school account');
    return back('denied');
  }
  const user = { email, name: c.name || email, role: roleFor(env, email) };
  await audit(env, request, user, 'login');
  return new Response(null, { status: 302, headers: [
    ['Location', u.origin + '/?login=ok'], ['Cache-Control', 'no-store'],
    ['Set-Cookie', setCookie(STATE, '', 0)],
    ['Set-Cookie', setCookie(COOKIE, await sign(env, { e: email, n: user.name, x: Date.now() + HOURS * 3600e3 }), HOURS * 3600)]] });
}
