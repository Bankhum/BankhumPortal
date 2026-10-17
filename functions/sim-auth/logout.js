/** GET /sim-auth/logout: ends the session and returns to the public view. */
import { whoAmI, audit, setCookie, COOKIE } from '../../sim-src/sim-auth-lib.js';

export async function onRequestGet({ env, request }) {
  const user = await whoAmI(env, request);
  if (user.email) await audit(env, request, user, 'logout');
  return new Response(null, { status: 302, headers: { Location: new URL(request.url).origin + '/', 'Set-Cookie': setCookie(COOKIE, '', 0), 'Cache-Control': 'no-store' } });
}
