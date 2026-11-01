/**
 * GET /sim-feed — ข้อมูลจริงของวันนี้แบบไม่ระบุตัวตน ให้ BANKHUM CAMPUS SIM ใช้แทนข้อมูลจำลอง
 *   นักเรียน: BANKHUM SIS (ชั้น · เลขที่ · เพศ · สถานะ · เวลา)
 *   ครู: ระบบลงเวลาผ่านมือถือในระบบสารบรรณ (จำนวน + เวลามา/กลับ ไม่มีชื่อ ลายเซ็น หรือพิกัด)
 * รหัส SIM_FEED_TOKEN เก็บไว้ฝั่งเซิร์ฟเวอร์ (Pages → Settings → Variables and Secrets) ใช้ค่าเดียวกันกับ SIS และสารบรรณ
 * ฝั่งไหนยังไม่เปิดหรือติดต่อไม่ได้ ก็ส่งเฉพาะฝั่งที่ได้ (หน้าเว็บใช้ค่าจำลองแทนส่วนที่ขาด)
 * ไม่มีชื่อนักเรียน/ครูในข้อมูลนี้ จึงเปิดให้หน้าเว็บสาธารณะเรียกได้ · แคช 30 วินาที
 */
const SIS = 'https://sis.bankhum.ac.th/api/sim/today';
const SARABAN = 'https://sarabun.bankhum.ac.th/api/sim/teachers-today';
const out = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=30' } });

async function get(url, token) {
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(4000) });
    return r.ok ? { ok: true, d: await r.json() } : { ok: false, error: String(r.status) };
  } catch (e) { return { ok: false, error: 'unreachable' }; }
}

export async function onRequestGet({ env, request, waitUntil }) {
  if (!env.SIM_FEED_TOKEN) return out({ ok: false, error: 'SIM_FEED_TOKEN not set' }, 503);
  const cache = caches.default, key = new Request(new URL('/sim-feed', request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  const [sis, sb] = await Promise.all([get(env.SIS_URL || SIS, env.SIM_FEED_TOKEN), get(env.SARABAN_URL || SARABAN, env.SIM_FEED_TOKEN)]);
  if (!sis.ok && !sb.ok) return out({ ok: false, error: `SIS ${sis.error} · สารบรรณ ${sb.error}` }, 502);
  const d = sis.ok ? sis.d : {}, t = sb.ok ? sb.d : null;
  // เลือกเฉพาะฟิลด์ที่เป็นตัวเลข/เวลา กันข้อมูลอื่นหลุดออกมาถ้าฝั่งต้นทางเปลี่ยนรูปแบบ
  const hhmm = a => (Array.isArray(a) ? a : []).filter(x => /^\d\d:\d\d$/.test(x));
  const fresh = out({ ok: true, date: d.date || t?.date, late_after: d.late_after, rooms: d.rooms || [], scans: d.scans || [],
    teachers: t && { total: +t.total || 0, scanned: +t.scanned || 0, late: +t.late || 0, left: +t.left || 0, start: t.start, times: hhmm(t.times), out_times: hhmm(t.out_times) },
    sources: { sis: sis.ok || sis.error, saraban: sb.ok || sb.error },
    sis_generated_at: d.generated_at, fetched_at: new Date().toISOString() });
  waitUntil(cache.put(key, fresh.clone()));
  return fresh;
}
