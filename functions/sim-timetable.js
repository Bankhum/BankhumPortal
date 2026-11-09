/**
 * GET /sim-timetable — ตารางสอนจาก BANKHUM SIS ให้ BANKHUM CAMPUS SIM ใช้แทนตารางที่ฝังไว้ในหน้าเว็บ
 *   ค่าเริ่มต้น ภาคเรียนที่ 2 ของปีการศึกษาปัจจุบัน (เปลี่ยนได้ด้วยตัวแปร SIM_TERM_NO หรือ ?term_no=)
 *   ส่งเฉพาะ ชั้น · วัน · คาบ · วิชา · ชื่อครู (ไม่มีข้อมูลนักเรียน) · แคช 10 นาที
 */
const SIS = 'https://sis.bankhum.ac.th/api/sim/timetable';
const out = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=600' } });

export async function onRequestGet({ env, request, waitUntil }) {
  if (!env.SIM_FEED_TOKEN) return out({ ok: false, error: 'SIM_FEED_TOKEN not set' }, 503);
  const q = new URL(request.url).searchParams.get('term_no'), term = ['1', '2', '3'].includes(q) ? q : String(env.SIM_TERM_NO || 2);
  const cache = caches.default, key = new Request(new URL('/sim-timetable?term_no=' + term, request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  let d;
  try {
    const r = await fetch(`${env.SIS_TIMETABLE_URL || SIS}?term_no=${term}`, { headers: { Authorization: `Bearer ${env.SIM_FEED_TOKEN}` }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) return out({ ok: false, error: 'SIS ' + r.status }, 502);
    d = await r.json();
  } catch (e) { return out({ ok: false, error: 'SIS unreachable' }, 502); }
  // เลือกเฉพาะฟิลด์ที่ใช้ กันข้อมูลอื่นหลุดออกมาถ้า SIS เปลี่ยนรูปแบบ
  const str = v => typeof v === 'string' ? v.slice(0, 80) : '';
  const fresh = out({ ok: true, term: d.term && { year_be: +d.term.year_be || null, term_no: +d.term.term_no || null },
    periods: (d.periods || []).map(p => ({ no: +p.no, start: str(p.start), end: str(p.end) })),
    slots: (d.slots || []).filter(s => s.d >= 1 && s.d <= 5).map(s => ({ cls: str(s.cls), d: +s.d, p: +s.p, subject: str(s.subject), lead: !!s.lead,
      teacher: str(s.teacher), teacher_full: str(s.teacher_full), deputy: !!s.deputy })),
    fetched_at: new Date().toISOString() });
  waitUntil(cache.put(key, fresh.clone()));
  return fresh;
}
