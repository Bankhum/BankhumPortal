/** GET /sim-auth/me: who is signed in and their role (PUBLIC when nobody is). */
import { authReady, whoAmI, json } from '../../sim-src/sim-auth-lib.js';

export async function onRequestGet({ env, request }) {
  return json({ ...(await whoAmI(env, request)), login_available: authReady(env) });
}
