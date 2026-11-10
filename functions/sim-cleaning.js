/**
 * GET /sim-cleaning — เวรทำความสะอาดกลุ่มสีจาก BANKHUM SIS ให้ BANKHUM CAMPUS SIM
 *   สี · โซนที่แต่ละสีรับผิดชอบสัปดาห์นี้ · สีของนักเรียน (ชั้น + เลขที่ ไม่มีชื่อ) · ผลตรวจวันนี้ · คะแนนสัปดาห์/เดือน/แต้มทั้งปี · ครูเวร (ชื่อต้น)
 *   ?date=YYYY-MM-DD ดูวันย้อนหลัง · แคช 60 วินาที (ย้อนหลัง 10 นาที) · ใช้ SIM_FEED_TOKEN เดียวกับ /sim-feed
 */
const SIS = 'https://sis.bankhum.ac.th/api/sim/cleaning';
const out = (body, status = 200, age = 60) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${age}` } });

export async function onRequestGet({ env, request, waitUntil }) {
  if (!env.SIM_FEED_TOKEN) return out({ ok: false, error: 'SIM_FEED_TOKEN not set' }, 503);
  const today = new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10), qd = new URL(request.url).searchParams.get('date') || '';
  const date = /^\d{4}-\d\d-\d\d$/.test(qd) && qd < today ? qd : null, qs = date ? `?date=${date}` : '';
  const cache = caches.default, key = new Request(new URL('/sim-cleaning' + qs, request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  let d;
  try {
    const r = await fetch((env.SIS_CLEANING_URL || SIS) + qs, { headers: { Authorization: `Bearer ${env.SIM_FEED_TOKEN}` }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) return out({ ok: false, error: 'SIS ' + r.status }, 502, 30);
    d = await r.json();
  } catch (e) { return out({ ok: false, error: 'SIS unreachable' }, 502, 30); }
  // เลือกเฉพาะฟิลด์ที่ใช้ กันข้อมูลอื่นหลุดออกมาถ้า SIS เปลี่ยนรูปแบบ
  const s = (v, n = 80) => typeof v === 'string' ? v.slice(0, n) : '', num = v => v === null || v === undefined || v === '' || !isFinite(+v) ? null : +v;
  const arr = a => Array.isArray(a) ? a : [], hm = v => typeof v === 'string' && /^\d\d:\d\d/.test(v) ? v.slice(0, 5) : null;
  const fresh = out({ ok: true, date: s(d.date, 10), deadline: hm(d.deadline), week: num(d.week), monday: s(d.monday, 10),
    houses: arr(d.houses).map(h => ({ id: +h.id, name: s(h.name, 30), color: /^#[0-9a-f]{6}$/i.test(h.color) ? h.color : '#888888' })),
    zones: arr(d.zones).map(z => ({ id: +z.id, name: s(z.name), detail: s(z.detail, 120) })),
    rotation: arr(d.rotation).map(x => ({ zone_id: +x.zone_id, house_id: +x.house_id })),
    members: arr(d.members).map(m => ({ cls: s(m.cls, 20), room: s(m.room, 20), no: num(m.no), h: +m.h })),
    inspections: arr(d.inspections).map(x => ({ zone_id: +x.zone_id, house_id: +x.house_id, total: num(x.total), max: num(x.max), pct: num(x.pct),
      members: num(x.members), present: num(x.present), done_at: hm(x.done_at) })),
    scores: arr(d.scores).map(x => ({ id: +x.id, week: num(x.week), month: num(x.month), month_rank: num(x.month_rank), month_points: num(x.month_points) || 0, year_points: num(x.year_points) || 0 })),
    duty: arr(d.duty).map(x => ({ teacher: s(x.teacher, 40), point: s(x.point, 60) })),
    fetched_at: new Date().toISOString() }, 200, date ? 600 : 60);
  waitUntil(cache.put(key, fresh.clone()));
  return fresh;
}
