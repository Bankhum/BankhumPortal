/**
 * Runs before every /api/* request.
 * On the very first request it creates the D1 tables (binding "DB") and loads the
 * click history migrated from the Google Sheet "Bankhum Portal Stats" (332 clicks,
 * 30 Sep – 10 Oct 2026). A row in the meta table works as a lock so this happens once.
 *
 * To add a new trackable system later, add a row to SYSTEMS below and bump SYSTEMS_VERSION;
 * it will be inserted on the next request (existing rows are left untouched).
 */
const SYSTEMS_VERSION = 'systems_v2';
const SYSTEMS = [["website", "เว็บไซต์โรงเรียน", "School Website", "https://www.bankhum.ac.th", 1], ["salary", "ระบบแจ้งผลการเลื่อนขั้นเงินเดือน", "Salary Increment Results", "https://money.bankhum.ac.th/", 2], ["document", "ระบบงานสารบรรณ", "E-Sarabun", "https://sarabun.bankhum.ac.th/", 3], ["information", "ระบบสารสนเทศโรงเรียน", "School Information", "https://bankhum.com/login.php", 4], ["attendance", "ระบบลงเวลาครู", "Teacher Attendance", "https://zlink.minervaiot.com/login", 5], ["finance", "ระบบบริหารการเงินและพัสดุโรงเรียน", "Finance & Supplies", null, 6], ["supervision", "ระบบนิเทศการจัดกิจกรรมการเรียนการสอน", "Teaching Supervision", null, 7], ["lessonplan", "สร้างแผนการสอนออนไลน์", "Online Lesson Plans", null, 8], ["assessment-system", "ระบบวัดผลและประเมินผลโรงเรียน", "Assessment System", "https://bankhum.krusarawut.com/login.php", 9], ["sis", "สารสนเทศนักเรียน (ใหม่)", "Student Information (New)", "https://sis.bankhum.ac.th/", 10], ["school-email", "อีเมล์ นักเรียน/ครู", "Student/Teacher Email", "https://email.bankhum.ac.th", 11], ["savings", "ระบบออมทรัพย์โรงเรียน", "School Savings", null, 12], ["goodstudent", "ระบบสะสมความดีนักเรียน", "Good Deeds Points", null, 13], ["quality-school", "โรงเรียนคุณภาพ", "Quality School", "https://sites.google.com/bankhum.ac.th/onesqa5/ONESQA", 14], ["onesqa5", "ประเมิน สมศ. รอบ 5", "ONESQA Round 5", "https://sites.google.com/bankhum.ac.th/oneqa2568/ONESQA", 15], ["sarabun-line", "LINE E-SaraBun", "LINE E-SaraBun", "https://lin.ee/pUEv7V7", 16], ["inno", "INNO BANKHUM นวัตกรรมการเรียนการสอน", "INNO Bankhum Teaching Innovations", "https://inno.bankhum.ac.th/", 17]];

// "YYYY-MM-DD HH:MM:SS|system_id" separated by ";" — Thai time (UTC+7)
const SEED = "2026-09-30 20:53:53|onesqa5;2026-09-30 20:54:07|quality-school;2026-09-30 20:54:48|document;2026-09-30 20:54:56|information;2026-09-30 20:55:01|attendance;2026-09-30 20:55:04|finance;2026-09-30 20:55:08|supervision;2026-09-30 20:55:13|lessonplan;2026-09-30 20:55:17|assessment-system;2026-09-30 20:55:20|savings;2026-09-30 20:55:24|goodstudent;2026-09-30 20:55:28|assessment-system;2026-09-30 20:55:31|quality-school;2026-09-30 20:58:48|website;2026-09-30 20:59:16|website;2026-09-30 21:00:46|salary;2026-09-30 21:20:56|savings;2026-09-30 21:21:21|savings;2026-09-30 21:32:53|salary;2026-10-01 00:51:30|school-email;2026-10-01 00:58:15|school-email;2026-10-01 00:59:53|school-email;2026-10-01 01:09:50|savings;2026-10-01 01:12:23|school-email;2026-10-01 01:13:32|school-email;2026-10-01 01:15:01|goodstudent;2026-10-01 01:23:17|school-email;2026-10-01 01:24:28|savings;2026-10-01 01:24:31|school-email;2026-10-01 01:24:41|assessment-system;2026-10-01 01:24:43|quality-school;2026-10-01 01:24:46|onesqa5;2026-10-01 02:25:32|goodstudent;2026-10-01 02:26:05|goodstudent;2026-10-01 09:12:47|attendance;2026-10-01 10:44:03|school-email;2026-10-01 10:44:03|document;2026-10-01 10:44:04|school-email;2026-10-01 10:44:04|school-email;2026-10-01 10:44:04|school-email;2026-10-01 10:44:05|school-email;2026-10-01 10:44:05|school-email;2026-10-01 10:44:05|school-email;2026-10-01 10:44:05|school-email;2026-10-01 10:44:06|school-email;2026-10-01 10:44:06|school-email;2026-10-01 10:44:07|school-email;2026-10-01 10:44:08|school-email;2026-10-01 10:44:10|school-email;2026-10-01 10:44:14|school-email;2026-10-01 10:44:18|document;2026-10-01 10:44:24|school-email;2026-10-01 10:44:34|school-email;2026-10-01 10:44:40|school-email;2026-10-01 10:44:40|school-email;2026-10-01 10:44:41|school-email;2026-10-01 10:45:56|school-email;2026-10-01 10:46:35|school-email;2026-10-01 10:46:54|school-email;2026-10-01 10:46:56|school-email;2026-10-01 10:46:59|school-email;2026-10-01 10:47:17|school-email;2026-10-01 10:48:06|school-email;2026-10-01 10:48:32|school-email;2026-10-01 10:50:08|school-email;2026-10-01 10:50:14|school-email;2026-10-01 10:50:17|school-email;2026-10-01 10:50:28|school-email;2026-10-01 10:50:55|school-email;2026-10-01 10:51:14|school-email;2026-10-01 10:51:23|school-email;2026-10-01 10:52:39|school-email;2026-10-01 10:53:16|school-email;2026-10-01 10:53:40|school-email;2026-10-01 10:54:34|school-email;2026-10-01 10:55:00|school-email;2026-10-01 10:56:10|school-email;2026-10-01 10:57:17|school-email;2026-10-01 10:58:41|school-email;2026-10-01 10:59:58|school-email;2026-10-01 11:00:23|school-email;2026-10-01 11:01:36|school-email;2026-10-01 11:02:38|school-email;2026-10-01 11:03:43|school-email;2026-10-01 11:05:13|school-email;2026-10-01 11:06:28|school-email;2026-10-01 11:06:51|school-email;2026-10-01 11:07:06|school-email;2026-10-01 11:07:55|school-email;2026-10-01 11:08:23|school-email;2026-10-01 11:16:38|school-email;2026-10-01 11:20:42|school-email;2026-10-01 11:24:41|school-email;2026-10-01 11:24:51|school-email;2026-10-01 11:29:17|school-email;2026-10-01 11:36:07|school-email;2026-10-01 13:06:21|website;2026-10-01 13:06:22|salary;2026-10-01 13:06:55|savings;2026-10-01 13:07:42|school-email;2026-10-01 13:07:45|savings;2026-10-01 13:07:50|goodstudent;2026-10-01 13:07:53|school-email;2026-10-01 13:08:47|school-email;2026-10-01 13:08:55|savings;2026-10-01 13:08:56|school-email;2026-10-01 13:12:57|quality-school;2026-10-01 13:14:05|school-email;2026-10-01 13:30:37|school-email;2026-10-01 13:33:21|school-email;2026-10-01 13:33:59|school-email;2026-10-01 13:42:51|school-email;2026-10-01 13:56:44|information;2026-10-01 13:56:45|attendance;2026-10-01 13:56:49|finance;2026-10-01 13:56:52|supervision;2026-10-01 13:56:57|assessment-system;2026-10-01 13:57:16|savings;2026-10-01 13:57:19|savings;2026-10-01 13:58:39|lessonplan;2026-10-01 19:52:23|website;2026-10-01 19:53:11|school-email;2026-10-01 22:55:19|salary;2026-10-02 08:47:14|salary;2026-10-02 08:48:00|school-email;2026-10-02 08:54:28|school-email;2026-10-02 10:01:29|salary;2026-10-02 10:37:02|school-email;2026-10-02 10:50:30|document;2026-10-02 10:50:32|document;2026-10-02 10:50:33|document;2026-10-02 10:50:35|document;2026-10-02 10:50:38|document;2026-10-02 10:50:58|document;2026-10-02 10:51:01|document;2026-10-02 10:51:03|document;2026-10-02 10:51:06|document;2026-10-02 10:53:39|salary;2026-10-02 12:36:02|savings;2026-10-02 12:36:04|savings;2026-10-02 12:36:05|savings;2026-10-02 12:36:06|lessonplan;2026-10-02 12:36:07|savings;2026-10-02 12:36:07|savings;2026-10-02 12:36:07|savings;2026-10-02 12:36:07|savings;2026-10-02 12:36:08|savings;2026-10-02 12:36:08|savings;2026-10-02 12:36:08|savings;2026-10-02 12:36:08|savings;2026-10-02 12:36:08|savings;2026-10-02 12:36:09|savings;2026-10-02 12:36:10|savings;2026-10-02 12:36:10|savings;2026-10-02 12:36:11|information;2026-10-02 12:36:38|savings;2026-10-02 12:36:50|document;2026-10-02 12:37:25|school-email;2026-10-02 12:37:25|school-email;2026-10-02 12:37:25|school-email;2026-10-02 12:37:26|school-email;2026-10-02 12:37:27|school-email;2026-10-02 12:37:27|school-email;2026-10-02 12:37:27|school-email;2026-10-02 12:37:27|school-email;2026-10-02 12:37:29|school-email;2026-10-02 12:37:30|school-email;2026-10-02 12:37:31|school-email;2026-10-02 12:37:34|school-email;2026-10-02 12:37:45|document;2026-10-02 12:37:53|school-email;2026-10-02 12:38:16|information;2026-10-02 12:38:28|school-email;2026-10-02 12:38:49|school-email;2026-10-02 12:39:27|school-email;2026-10-02 12:39:50|school-email;2026-10-02 12:41:10|school-email;2026-10-02 12:41:17|school-email;2026-10-02 12:41:37|school-email;2026-10-02 12:42:11|school-email;2026-10-02 12:44:18|school-email;2026-10-02 12:50:31|school-email;2026-10-02 12:55:02|school-email;2026-10-02 13:04:55|school-email;2026-10-02 13:11:44|school-email;2026-10-02 13:14:27|school-email;2026-10-02 13:14:30|school-email;2026-10-02 13:14:31|school-email;2026-10-02 13:14:36|school-email;2026-10-02 13:14:39|school-email;2026-10-02 13:14:44|school-email;2026-10-02 13:14:52|school-email;2026-10-02 13:15:59|school-email;2026-10-02 13:16:55|savings;2026-10-02 13:18:41|goodstudent;2026-10-02 13:20:16|school-email;2026-10-02 13:34:13|document;2026-10-02 13:37:43|school-email;2026-10-02 13:40:00|school-email;2026-10-02 16:28:56|savings;2026-10-02 16:29:19|school-email;2026-10-02 18:17:17|savings;2026-10-02 18:18:37|school-email;2026-10-02 18:19:23|school-email;2026-10-03 09:46:25|salary;2026-10-04 09:48:20|document;2026-10-04 09:55:58|information;2026-10-04 09:56:06|assessment-system;2026-10-04 10:02:18|document;2026-10-04 10:04:50|document;2026-10-04 10:06:41|document;2026-10-04 10:07:04|document;2026-10-04 10:07:29|information;2026-10-04 10:07:53|document;2026-10-04 10:08:39|website;2026-10-04 10:09:00|document;2026-10-04 14:42:44|salary;2026-10-04 21:22:13|lessonplan;2026-10-05 08:56:17|salary;2026-10-05 10:33:53|savings;2026-10-05 10:34:22|school-email;2026-10-05 10:37:58|school-email;2026-10-05 10:39:22|school-email;2026-10-05 10:45:27|school-email;2026-10-05 21:14:11|document;2026-10-06 10:42:50|school-email;2026-10-06 10:43:11|school-email;2026-10-06 13:05:05|website;2026-10-06 13:05:55|savings;2026-10-06 15:23:11|savings;2026-10-06 15:29:26|savings;2026-10-06 16:36:05|website;2026-10-06 16:36:51|savings;2026-10-06 19:09:16|document;2026-10-06 20:58:58|school-email;2026-10-06 21:56:02|document;2026-10-06 21:56:05|information;2026-10-06 21:58:19|document;2026-10-06 21:58:28|salary;2026-10-06 22:29:33|school-email;2026-10-06 22:29:41|school-email;2026-10-06 22:29:54|document;2026-10-06 22:52:09|document;2026-10-06 22:52:16|document;2026-10-06 23:53:28|document;2026-10-07 09:29:19|savings;2026-10-07 11:17:53|savings;2026-10-07 11:36:45|savings;2026-10-07 11:48:43|savings;2026-10-07 12:08:39|savings;2026-10-07 13:34:58|savings;2026-10-07 13:45:43|savings;2026-10-07 13:57:15|savings;2026-10-07 13:58:00|document;2026-10-07 14:11:40|document;2026-10-07 14:30:22|salary;2026-10-07 14:30:35|document;2026-10-07 14:30:47|attendance;2026-10-07 14:57:45|assessment-system;2026-10-07 14:57:59|document;2026-10-07 15:09:10|document;2026-10-07 16:25:29|document;2026-10-08 08:10:03|document;2026-10-08 08:15:10|document;2026-10-08 09:08:16|savings;2026-10-08 11:46:52|savings;2026-10-08 12:24:47|savings;2026-10-08 13:51:36|document;2026-10-08 14:32:46|document;2026-10-08 15:14:55|document;2026-10-08 16:26:03|sis;2026-10-08 16:41:09|salary;2026-10-08 16:47:55|sis;2026-10-08 16:49:45|document;2026-10-08 16:52:43|document;2026-10-08 17:00:10|document;2026-10-08 17:00:24|information;2026-10-08 17:00:27|attendance;2026-10-08 17:00:33|finance;2026-10-08 17:00:37|supervision;2026-10-08 17:00:43|lessonplan;2026-10-08 17:00:45|assessment-system;2026-10-08 17:00:50|sis;2026-10-08 17:14:06|document;2026-10-08 17:26:09|sis;2026-10-08 17:26:52|sis;2026-10-08 18:07:05|supervision;2026-10-08 18:07:13|sis;2026-10-08 18:07:41|assessment-system;2026-10-08 18:07:44|sis;2026-10-08 18:07:52|document;2026-10-08 18:10:36|assessment-system;2026-10-08 18:10:43|document;2026-10-08 18:10:44|information;2026-10-08 18:10:58|document;2026-10-08 18:11:48|document;2026-10-08 18:11:54|document;2026-10-08 18:12:04|document;2026-10-08 18:12:07|information;2026-10-08 18:12:57|document;2026-10-08 18:14:17|sis;2026-10-08 18:14:22|document;2026-10-08 18:14:28|document;2026-10-08 18:14:30|document;2026-10-08 18:14:35|document;2026-10-08 18:15:56|document;2026-10-08 18:16:59|document;2026-10-08 18:20:07|document;2026-10-08 18:21:21|document;2026-10-08 18:21:45|document;2026-10-08 18:22:43|document;2026-10-08 18:23:09|document;2026-10-08 18:25:01|document;2026-10-08 18:25:17|document;2026-10-08 18:27:45|document;2026-10-08 18:34:07|document;2026-10-08 18:36:42|document;2026-10-08 18:36:57|school-email;2026-10-08 18:39:54|savings;2026-10-08 18:40:15|savings;2026-10-08 18:41:46|savings;2026-10-08 18:44:15|savings;2026-10-08 18:55:44|savings;2026-10-08 23:28:07|savings;2026-10-08 23:28:37|savings;2026-10-09 09:49:57|document;2026-10-09 15:50:44|information;2026-10-09 15:51:01|sis;2026-10-09 16:14:30|sis;2026-10-09 16:38:13|sis;2026-10-09 18:17:19|savings;2026-10-10 00:21:18|sis";

let ready = false;

async function alreadySeeded(db) {
  try {
    const row = await db.prepare("SELECT v FROM meta WHERE k = 'seed_sheet_v1'").first();
    return !!row;
  } catch (_) {
    return false; // tables do not exist yet
  }
}

async function ensureDatabase(db) {
  if (ready) return;
  if (!(await alreadySeeded(db))) {
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS systems (
        id TEXT PRIMARY KEY, name_th TEXT NOT NULL, name_en TEXT NOT NULL, url TEXT,
        sort_order INTEGER NOT NULL DEFAULT 999, active INTEGER NOT NULL DEFAULT 1)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL, system_id TEXT NOT NULL,
        url TEXT, source TEXT NOT NULL DEFAULT 'web')`),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_clicks_system ON clicks(system_id)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_clicks_ts ON clicks(ts)'),
      db.prepare('CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)'),
    ]);
    // One transaction: history rows are only inserted while the seed marker is absent,
    // and the marker is written last, so concurrent first requests cannot double-import.
    const rows = SEED.split(';').map(r => r.split('|'));
    const stmts = [];
    for (let i = 0; i < rows.length; i += 40) {
      const chunk = rows.slice(i, i + 40);
      stmts.push(db.prepare(
        'INSERT INTO clicks (ts, system_id, source) SELECT column1, column2, \'sheet\' FROM (VALUES ' +
        chunk.map(() => '(?, ?)').join(', ') +
        ") WHERE NOT EXISTS (SELECT 1 FROM meta WHERE k = 'seed_sheet_v1')"
      ).bind(...chunk.flat()));
    }
    stmts.push(db.prepare("INSERT OR IGNORE INTO meta (k, v) VALUES ('seed_sheet_v1', datetime('now'))"));
    await db.batch(stmts);
  }
  // keep the systems list up to date (only missing ids are added)
  const sysDone = await db.prepare('SELECT v FROM meta WHERE k = ?').bind(SYSTEMS_VERSION).first();
  if (!sysDone) {
    await db.batch([
      ...SYSTEMS.map(([id, th, en, url, order]) =>
        db.prepare('INSERT OR IGNORE INTO systems (id, name_th, name_en, url, sort_order) VALUES (?, ?, ?, ?, ?)')
          .bind(id, th, en, url, order)),
      db.prepare("INSERT OR IGNORE INTO meta (k, v) VALUES (?, datetime('now'))").bind(SYSTEMS_VERSION),
    ]);
  }
  ready = true;
}

export async function onRequest(context) {
  if (!context.env.DB) {
    return new Response(JSON.stringify({ ok: false, error: 'D1 binding "DB" is not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }
  try {
    try {
      await ensureDatabase(context.env.DB);
    } catch (_) {
      // another request may have been setting up at the same moment — try once more
      await new Promise(r => setTimeout(r, 300));
      await ensureDatabase(context.env.DB);
    }
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'database setup failed: ' + String(err && err.message || err) }), {
      status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }
  return context.next();
}
