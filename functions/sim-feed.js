/**
 * GET /sim-feed — ผลสแกนหน้าวันนี้แบบไม่ระบุตัวตน (ชั้น · เลขที่ · เพศ · สถานะ · เวลา) จาก BANKHUM SIS
 * ให้ BANKHUM CAMPUS SIM ใช้แทนข้อมูลจำลอง รหัส SIM_FEED_TOKEN เก็บไว้ฝั่งเซิร์ฟเวอร์ (Pages → Settings → Variables and Secrets)
 * ไม่มีชื่อนักเรียนในข้อมูลนี้ จึงเปิดให้หน้าเว็บสาธารณะเรียกได้ · แคช 30 วินาที
 */
const SIS = 'https://sis.bankhum.ac.th/api/sim/today';
const out = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=30' } });

export async function onRequestGet({ env, request, waitUntil }) {
  if (!env.SIM_FEED_TOKEN) return out({ ok: false, error: 'SIM_FEED_TOKEN not set' }, 503);
  const cache = caches.default, key = new Request(new URL('/sim-feed', request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  let res;
  try { res = await fetch(SIS, { headers: { Authorization: `Bearer ${env.SIM_FEED_TOKEN}` } }); }
  catch (e) { return out({ ok: false, error: 'SIS unreachable' }, 502); }
  if (!res.ok) return out({ ok: false, error: `SIS ${res.status}` }, 502);
  const d = await res.json();
  const fresh = out({ ok: true, date: d.date, late_after: d.late_after, rooms: d.rooms, scans: d.scans, teachers: d.teachers || null, sis_generated_at: d.generated_at, fetched_at: new Date().toISOString() });
  waitUntil(cache.put(key, fresh.clone()));
  return fresh;
}
