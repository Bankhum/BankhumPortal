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
const out = (body, status = 200, age = 30) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${age}` } });

async function get(url, token) {
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(4000) });
    return r.ok ? { ok: true, d: await r.json() } : { ok: false, error: String(r.status) };
  } catch (e) { return { ok: false, error: 'unreachable' }; }
}

export async function onRequestGet({ env, request, waitUntil }) {
  if (!env.SIM_FEED_TOKEN) return out({ ok: false, error: 'SIM_FEED_TOKEN not set' }, 503);
  // ?date=YYYY-MM-DD ดูวันย้อนหลัง (ไม่ใส่ = วันนี้) · ส่งต่อให้ SIS และสารบรรณ
  const today = new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10), qd = new URL(request.url).searchParams.get('date') || '';
  const date = /^\d{4}-\d\d-\d\d$/.test(qd) && qd < today ? qd : null, qs = date ? `?date=${date}` : '';
  const cache = caches.default, key = new Request(new URL('/sim-feed' + qs, request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  const [sis, sb] = await Promise.all([get((env.SIS_URL || SIS) + qs, env.SIM_FEED_TOKEN), get((env.SARABAN_URL || SARABAN) + qs, env.SIM_FEED_TOKEN)]);
  if (!sis.ok && !sb.ok) return out({ ok: false, error: `SIS ${sis.error} · สารบรรณ ${sb.error}` }, 502);
  // ต้นทางรุ่นเก่าที่ไม่รู้จัก ?date จะส่งของวันนี้มา → ทิ้ง ไม่ให้เอาวันนี้ไปแสดงเป็นวันอื่น
  const d = sis.ok && (!date || sis.d.date === date) ? sis.d : {}, t = sb.ok && (!date || sb.d.date === date) ? sb.d : null;
  // เลือกเฉพาะฟิลด์ที่เป็นตัวเลข/เวลา กันข้อมูลอื่นหลุดออกมาถ้าฝั่งต้นทางเปลี่ยนรูปแบบ
  const hhmm = a => (Array.isArray(a) ? a : []).filter(x => /^\d\d:\d\d$/.test(x));
  const M = ['sig', 'photo', 'finger'], ck = a => (Array.isArray(a) ? a : []).filter(x => x && /^\d\d:\d\d$/.test(x.t)).map(x => ({ t: x.t, m: M.includes(x.m) ? x.m : null }));
  const fresh = out({ ok: true, date: date || d.date || t?.date, late_after: d.late_after, rooms: d.rooms || [], scans: d.scans || [],
    teachers: t && { total: +t.total || 0, scanned: +t.scanned || 0, late: +t.late || 0, left: +t.left || 0, start: t.start, times: hhmm(t.times), out_times: hhmm(t.out_times), checkins: ck(t.checkins), checkouts: ck(t.checkouts) },
    sources: { sis: sis.ok ? (d.date ? true : 'no-date') : sis.error, saraban: sb.ok ? (t ? true : 'no-date') : sb.error },
    sis_generated_at: d.generated_at, fetched_at: new Date().toISOString() }, 200, date ? 600 : 30);   // วันย้อนหลังไม่เปลี่ยนแล้ว แคช 10 นาที
  waitUntil(cache.put(key, fresh.clone()));
  return fresh;
}
