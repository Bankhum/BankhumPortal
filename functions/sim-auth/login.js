/** GET /sim-auth/login → Google sign-in, limited to school accounts (hd=bankhum.ac.th). */
import { authReady, sign, setCookie, STATE, DOMAIN } from '../../sim-src/sim-auth-lib.js';

export async function onRequestGet({ env, request }) {
  const u = new URL(request.url);
  if (!authReady(env)) return Response.redirect(u.origin + '/?login=unconfigured', 302);
  const nonce = crypto.randomUUID();
  const q = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: u.origin + '/sim-auth/callback', response_type: 'code',
    scope: 'openid email profile', hd: DOMAIN, prompt: 'select_account', state: nonce });
  return new Response(null, { status: 302, headers: { Location: 'https://accounts.google.com/o/oauth2/v2/auth?' + q,
    'Set-Cookie': setCookie(STATE, await sign(env, { s: nonce, x: Date.now() + 600e3 }), 600), 'Cache-Control': 'no-store' } });
}
