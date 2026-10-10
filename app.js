// ===== V22 menu: built from menu.js (window.BANKHUM_MENU) =====
const MENU = Array.isArray(window.BANKHUM_MENU) ? window.BANKHUM_MENU : [];
const modulesRoot = document.getElementById('systems');
const launcherRoot = document.getElementById('moduleLauncher');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const chips = [...document.querySelectorAll('.chip')];
const emptyState = document.getElementById('emptyState');
const resetFilter = document.getElementById('resetFilter');
const systemCount = document.getElementById('systemCount');
const soonCount = document.getElementById('soonCount');
const moduleCount = document.getElementById('moduleCount');
const toast = document.getElementById('toast');
let currentFilter = 'all';

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function currentLang() {
  return document.documentElement.lang === 'en' ? 'en' : 'th';
}

function escapeAttr(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function itemLabel(item, lang) { return lang === 'en' ? (item.en || item.th) : item.th; }

function renderLauncher(lang) {
  if (!launcherRoot) return;
  launcherRoot.innerHTML = MENU.map(mod => {
    const ready = mod.items.filter(i => i.url).length;
    return `<a class="launcher-tile c-${mod.color}" href="#${mod.id}" aria-label="${escapeAttr(lang === 'en' ? mod.en : mod.th)}">
      <span class="launcher-icon"><i data-lucide="${escapeAttr(mod.icon)}"></i></span>
      <span class="launcher-text">
        <strong class="lt-full">${escapeAttr(lang === 'en' ? mod.en : mod.th)}</strong>
        <strong class="lt-short">${escapeAttr(lang === 'en' ? (mod.shortEn || mod.en) : (mod.short || mod.th))}</strong>
        <small>${escapeAttr(mod.code)}</small>
      </span>
      <span class="launcher-count" title="${lang === 'en' ? 'ready' : 'พร้อมใช้งาน'}">${ready}/${mod.items.length}</span>
      ${mod.isNew ? '<span class="launcher-new">NEW</span>' : ''}
    </a>`;
  }).join('');
}

function renderItem(item, mod, lang) {
  const label = escapeAttr(itemLabel(item, lang));
  const search = escapeAttr(`${item.th} ${item.en || ''} ${item.keywords || ''} ${mod.th} ${mod.en} ${mod.code}`.toLowerCase());
  const icon = `<span class="menu-icon"><i data-lucide="${escapeAttr(item.icon || 'circle')}"></i></span>`;
  if (item.url) {
    const external = !item.internal;
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    const stat = item.statId ? ` data-system-id="${escapeAttr(item.statId)}" data-stat-name="${escapeAttr(item.statName || item.th)}"` : '';
    return `<li class="menu-item" data-status="ready" data-search="${search}">
      <a class="menu-tile is-ready" href="${escapeAttr(item.url)}"${attrs}${stat} data-label="${label}">
        ${icon}<span class="menu-label">${label}</span>
        <i class="menu-go" data-lucide="${external ? 'arrow-up-right' : 'chevron-right'}"></i>
      </a>
    </li>`;
  }
  return `<li class="menu-item" data-status="soon" data-search="${search}">
    <button class="menu-tile is-soon" type="button" aria-disabled="true" data-label="${label}">
      ${icon}<span class="menu-label">${label}</span>
      <span class="soon-badge">${lang === 'en' ? 'Soon' : 'เร็วๆ นี้'}</span>
    </button>
  </li>`;
}

function renderModules(lang) {
  if (!modulesRoot) return;
  modulesRoot.innerHTML = MENU.map(mod => {
    const ready = mod.items.filter(i => i.url).length;
    const main = mod.main ? `<a class="module-main" href="${escapeAttr(mod.main.url)}" target="_blank" rel="noopener noreferrer" data-system-id="${escapeAttr(mod.main.statId || '')}" data-label="${escapeAttr(lang === 'en' ? mod.main.en : mod.main.th)}">
        <span>${escapeAttr(lang === 'en' ? mod.main.en : mod.main.th)}</span><i data-lucide="arrow-up-right"></i></a>` : '';
    return `<section class="module c-${mod.color}" id="${mod.id}" data-module="${mod.id}" aria-labelledby="${mod.id}-title">
      <header class="module-head">
        <span class="module-no">${escapeAttr(mod.no)}</span>
        <div class="module-title">
          <h2 id="${mod.id}-title">${escapeAttr(lang === 'en' ? mod.en : mod.th)}</h2>
          <span class="module-code">${escapeAttr(mod.code)}</span>
        </div>
        <span class="module-ready">${ready}/${mod.items.length} ${lang === 'en' ? 'ready' : 'พร้อมใช้'}</span>
      </header>
      <ul class="menu-list">${mod.items.map(item => renderItem(item, mod, lang)).join('')}</ul>
      ${main ? `<div class="module-foot">${main}</div>` : ''}
    </section>`;
  }).join('');
}

function renderMenu() {
  const lang = currentLang();
  renderLauncher(lang);
  renderModules(lang);
  updateCounts();
  applyFilters();
  refreshIcons();
}

function updateCounts() {
  const readyUrls = new Set();
  let soon = 0;
  MENU.forEach(mod => mod.items.forEach(item => {
    if (item.url && !item.internal) readyUrls.add(item.url);
    if (!item.url) soon++;
  }));
  if (systemCount) systemCount.textContent = readyUrls.size;
  if (soonCount) soonCount.textContent = soon;
  if (moduleCount) moduleCount.textContent = MENU.length;
}

function applyFilters() {
  if (!modulesRoot) return;
  const q = (searchInput?.value || '').trim().toLowerCase();
  let visible = 0;
  modulesRoot.querySelectorAll('.module').forEach(mod => {
    let modVisible = 0;
    mod.querySelectorAll('.menu-item').forEach(li => {
      const statusOk = currentFilter === 'all' || li.dataset.status === currentFilter;
      const text = `${li.dataset.search || ''} ${li.textContent}`.toLowerCase();
      const show = statusOk && (!q || text.includes(q));
      li.hidden = !show;
      if (show) modVisible++;
    });
    mod.hidden = modVisible === 0;
    visible += modVisible;
  });
  if (emptyState) emptyState.hidden = visible !== 0;
  if (clearSearch) clearSearch.hidden = !q;
}

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
    chip.classList.add('active');
    chip.setAttribute('aria-pressed', 'true');
    currentFilter = chip.dataset.filter;
    applyFilters();
  });
});

searchInput?.addEventListener('input', applyFilters);
clearSearch?.addEventListener('click', () => {
  searchInput.value = '';
  searchInput.focus();
  applyFilters();
});

resetFilter?.addEventListener('click', () => {
  currentFilter = 'all';
  searchInput.value = '';
  chips.forEach(c => { const on = c.dataset.filter === 'all'; c.classList.toggle('active', on); c.setAttribute('aria-pressed', String(on)); });
  applyFilters();
  modulesRoot.scrollIntoView({behavior:'smooth'});
});

// Clicks on menu buttons: count usage for real systems, explain "coming soon" ones.
modulesRoot?.addEventListener('click', event => {
  const soon = event.target.closest('.menu-tile.is-soon');
  if (soon) {
    showToast(currentLang() === 'en'
      ? `${soon.dataset.label} is coming soon`
      : `เมนู “${soon.dataset.label}” อยู่ระหว่างเตรียมเปิดใช้งาน`);
    return;
  }
  const link = event.target.closest('a[data-system-id]');
  if (link && link.dataset.systemId) {
    recordUsage(link.dataset.systemId);
    showToast(currentLang() === 'en' ? `Opening ${link.dataset.label}…` : `กำลังเปิด ${link.dataset.label}...`);
  }
});

// ===== V23 usage ranking (Cloudflare Pages Functions + D1: /api/stats, /api/click) =====
const STATS_ENDPOINT = '/api/stats';
const CLICK_ENDPOINT = '/api/click';
const STATS_CACHE_KEY = 'bankhumPortalStatsV23';
const TOP_N = 5;
let statsDays = 0;
let statsExpanded = false;
let lastStats = null;
const recentClicks = {};

function menuItemByStatId(id) {
  for (const mod of MENU) {
    const item = mod.items.find(i => i.statId === id);
    if (item) return { item, mod };
  }
  return null;
}

function recordUsage(systemId) {
  if (!systemId) return;
  const now = Date.now();
  if (recentClicks[systemId] && now - recentClicks[systemId] < 3000) return; // ignore rapid double taps
  recentClicks[systemId] = now;
  const body = JSON.stringify({ id: systemId, url: menuItemByStatId(systemId)?.item.url || '' });
  // sendBeacon still delivers when the page is navigating away to the opened system
  const sent = navigator.sendBeacon && navigator.sendBeacon(CLICK_ENDPOINT, new Blob([body], { type: 'text/plain' }));
  if (!sent) fetch(CLICK_ENDPOINT, { method: 'POST', body, keepalive: true }).catch(() => {});
}

function readStatsCache(days) {
  try { return JSON.parse(localStorage.getItem(`${STATS_CACHE_KEY}_${days}`)); } catch (_) { return null; }
}
function writeStatsCache(days, data) {
  try { localStorage.setItem(`${STATS_CACHE_KEY}_${days}`, JSON.stringify(data)); } catch (_) {}
}

async function fetchStats(days) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(`${STATS_ENDPOINT}?days=${days}`, { signal: ctrl.signal, cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.ok) { writeStatsCache(days, data); return { data, live: true }; }
    } catch (_) {
    } finally { clearTimeout(timer); }
    if (attempt < 3) await new Promise(r => setTimeout(r, 600 * attempt));
  }
  const cached = readStatsCache(days);
  return cached ? { data: cached, live: false } : null;
}

function formatThaiDate(ts, lang) {
  if (!ts) return '';
  const d = new Date(ts.replace(' ', 'T') + '+07:00');
  return d.toLocaleString(lang === 'en' ? 'en-GB' : 'th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
}

function rankingHtml(data, lang) {
  const items = (data.items || []).filter(i => i.count > 0);
  if (!items.length) {
    return `<div class="usage-empty">${lang === 'en' ? 'No usage recorded in this period yet.' : 'ยังไม่มีการใช้งานในช่วงเวลานี้'}</div>`;
  }
  const max = items[0].count;
  const total = data.total || items.reduce((s, i) => s + i.count, 0);
  const shown = statsExpanded ? items : items.slice(0, TOP_N);
  const rows = shown.map((it, idx) => {
    const rank = idx + 1;
    const found = menuItemByStatId(it.id);
    const color = found ? found.mod.color : 'green';
    const icon = found ? found.item.icon : 'circle';
    const name = lang === 'en' ? (it.name_en || it.name_th) : it.name_th;
    const pct = total ? Math.round((it.count / total) * 100) : 0;
    const width = Math.max(2, (it.count / max) * 100);
    const last = it.last_used ? `${lang === 'en' ? 'Last used' : 'ใช้ล่าสุด'} ${formatThaiDate(it.last_used, lang)}` : '';
    return `<li class="rank-row${rank <= 3 ? ' is-top' : ''}" title="${escapeAttr(`${name}: ${it.count.toLocaleString()} ${lang === 'en' ? 'opens' : 'ครั้ง'} (${pct}%)`)}">
      <span class="rank-no rank-${rank}">${rank}</span>
      <span class="rank-icon c-${color}"><i data-lucide="${escapeAttr(icon)}"></i></span>
      <div class="rank-main">
        <div class="rank-line">
          <strong class="rank-name">${escapeAttr(name)}</strong>
          <span class="rank-value"><b>${it.count.toLocaleString()}</b> ${lang === 'en' ? 'opens' : 'ครั้ง'}<small>${pct}%</small></span>
        </div>
        <div class="rank-track" aria-hidden="true"><span class="rank-fill" style="width:${width}%"></span></div>
        ${last ? `<small class="rank-last">${escapeAttr(last)}</small>` : ''}
      </div>
    </li>`;
  }).join('');
  const more = items.length > TOP_N
    ? `<button class="rank-toggle" id="rankToggle" type="button" aria-expanded="${statsExpanded}">
        <span>${statsExpanded
          ? (lang === 'en' ? 'Show top 5 only' : 'แสดงเฉพาะ 5 อันดับแรก')
          : (lang === 'en' ? `Show all ${items.length} systems` : `แสดงทั้งหมด ${items.length} ระบบ`)}</span>
        <i data-lucide="${statsExpanded ? 'chevron-up' : 'chevron-down'}"></i>
      </button>`
    : '';
  return `<div class="rank-summary">
      <div><span>${lang === 'en' ? 'Total opens' : 'เปิดใช้งานรวม'}</span><strong>${total.toLocaleString()}</strong></div>
      <div><span>${lang === 'en' ? 'Systems used' : 'ระบบที่มีการใช้งาน'}</span><strong>${items.length}</strong></div>
      <div><span>${lang === 'en' ? 'Most used' : 'ใช้มากที่สุด'}</span><strong class="rank-summary-top">${escapeAttr(lang === 'en' ? (items[0].name_en || items[0].name_th) : items[0].name_th)}</strong></div>
    </div>
    <ol class="rank-list">${rows}</ol>${more}`;
}

function paintDashboard() {
  const box = document.getElementById('usageChart');
  if (!box || !lastStats) return;
  const lang = currentLang();
  box.innerHTML = rankingHtml(lastStats.data, lang);
  const badge = document.getElementById('statsSourceBadge');
  if (badge) {
    const time = new Date(lastStats.data.updated).toLocaleTimeString(lang === 'en' ? 'en-GB' : 'th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
    badge.classList.toggle('is-offline', !lastStats.live);
    badge.innerHTML = lastStats.live
      ? `<i data-lucide="cloud"></i> ${lang === 'en' ? 'Live' : 'ข้อมูลล่าสุด'} ${time}`
      : `<i data-lucide="cloud-off"></i> ${lang === 'en' ? 'Saved data' : 'ข้อมูลที่บันทึกไว้'} ${time}`;
  }
  document.getElementById('rankToggle')?.addEventListener('click', () => {
    statsExpanded = !statsExpanded;
    paintDashboard();
    if (!statsExpanded) document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
  });
  refreshIcons();
}

async function renderDashboard() {
  const box = document.getElementById('usageChart');
  if (!box) return;
  const days = statsDays;
  const cached = readStatsCache(days);
  if (cached && !lastStats) { lastStats = { data: cached, live: false }; paintDashboard(); }
  else if (!lastStats) box.innerHTML = `<div class="usage-empty">${currentLang() === 'en' ? 'Loading statistics…' : 'กำลังโหลดสถิติ...'}</div>`;
  const result = await fetchStats(days);
  if (days !== statsDays) return; // period changed while loading
  if (result) { lastStats = result; paintDashboard(); }
  else if (!lastStats) {
    box.innerHTML = `<div class="usage-empty">${currentLang() === 'en' ? 'Could not load statistics. Please try again.' : 'โหลดสถิติไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'}
      <button class="rank-retry" type="button" onclick="renderDashboard()">${currentLang() === 'en' ? 'Retry' : 'ลองใหม่'}</button></div>`;
  }
}

document.querySelectorAll('[data-stats-days]').forEach(btn => {
  btn.addEventListener('click', () => {
    statsDays = parseInt(btn.dataset.statsDays, 10) || 0;
    document.querySelectorAll('[data-stats-days]').forEach(b => {
      const on = b === btn; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on));
    });
    lastStats = null;
    statsExpanded = false;
    renderDashboard();
  });
});
setInterval(() => { if (document.visibilityState === 'visible') renderDashboard(); }, 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') renderDashboard(); });

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

renderMenu();

// Mobile navigation highlight
const mobileLinks = [...document.querySelectorAll('.mobile-nav-item')];
const targets = ['home','systems','mod-sarabun','mod-student','dashboard']
  .map(id => document.getElementById(id))
  .filter(Boolean);

const observer = new IntersectionObserver(entries => {
  const entry = entries
    .filter(e => e.isIntersecting)
    .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!entry) return;
  mobileLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
  });
}, {rootMargin:'-30% 0px -55% 0px', threshold:[0.05,0.2,0.5]});
targets.forEach(el => observer.observe(el));

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
}

// PWA install
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});
window.addEventListener('appinstalled', () => showToast('ติดตั้ง Bankhum School Portal สำเร็จ'));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js?v=24', { updateViaCache: 'none' });
      await reg.update();
    } catch (_) {}
  });
}

refreshIcons();
renderDashboard();


// ===== V7 Hotline chat =====
const hotlineToggle = document.getElementById('hotlineToggle');
const hotlinePanel = document.getElementById('hotlinePanel');
const hotlineClose = document.getElementById('hotlineClose');
const hotlineMessage = document.getElementById('hotlineMessage');
const hotlineCount = document.getElementById('hotlineCount');
const hotlineSend = document.getElementById('hotlineSend');
const hotlineTopics = [...document.querySelectorAll('[data-hotline-topic]')];

function setHotline(open) {
  if (!hotlinePanel || !hotlineToggle) return;
  hotlinePanel.hidden = !open;
  hotlineToggle.setAttribute('aria-expanded', String(open));
  if (open) setTimeout(() => hotlineMessage?.focus(), 80);
}

hotlineToggle?.addEventListener('click', () => setHotline(hotlinePanel.hidden));
hotlineClose?.addEventListener('click', () => setHotline(false));

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && hotlinePanel && !hotlinePanel.hidden) setHotline(false);
});

hotlineMessage?.addEventListener('input', () => {
  hotlineCount.textContent = String(hotlineMessage.value.length);
});

hotlineTopics.forEach(button => {
  button.addEventListener('click', () => {
    const topic = button.dataset.hotlineTopic || '';
    hotlineMessage.value = topic + (hotlineMessage.value.trim() ? `\n${hotlineMessage.value.trim()}` : '\n');
    hotlineCount.textContent = String(hotlineMessage.value.length);
    hotlineMessage.focus();
  });
});

hotlineSend?.addEventListener('click', async () => {
  const message = hotlineMessage?.value.trim() || '';
  if (!message) {
    showToast('กรุณาพิมพ์ข้อความก่อนส่ง');
    hotlineMessage?.focus();
    return;
  }

  const fullMessage = `สายด่วนโรงเรียนบ้านคุ้ม (ประสารราษฎร์วิทยา)\n${message}`;
  let copied = false;
  try {
    await navigator.clipboard.writeText(fullMessage);
    copied = true;
  } catch (_) {
    try {
      const temp = document.createElement('textarea');
      temp.value = fullMessage;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      copied = document.execCommand('copy');
      temp.remove();
    } catch (_) {}
  }

  showToast(copied ? 'คัดลอกข้อความแล้ว กำลังเปิด Facebook...' : 'กำลังเปิด Facebook ของโรงเรียน...');
  window.open('https://m.me/bkspage', '_blank', 'noopener,noreferrer');
});

refreshIcons();




// ===== V20 light / dark theme switch =====
const THEME_KEY = 'bankhumPortalThemeV1';
const themeToggle = document.getElementById('themeToggle');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
  themeToggle?.setAttribute('aria-label', next === 'dark' ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด');
  themeToggle?.setAttribute('title', next === 'dark' ? 'ธีมสว่าง' : 'ธีมมืด');
  if (themeColorMeta) themeColorMeta.setAttribute('content', next === 'dark' ? '#0b1712' : '#0f7a5a');
  refreshIcons();
}

themeToggle?.addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});

const savedTheme = localStorage.getItem(THEME_KEY);
const preferredDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(savedTheme || (preferredDark ? 'dark' : 'light'));


// ===== V17 Thai / English language switch =====
const LANGUAGE_KEY = 'bankhumPortalLanguageV1';
const languageToggle = document.getElementById('languageToggle');
const thToEn = new Map([
  ['หน้าหลัก','Home'],['บริหารงาน','Management'],['วิชาการ','Academic'],['นักเรียน','Students'],['งานประเมินต่างๆ','Evaluation'],['สถิติการใช้งาน','Usage stats'],
  ['ติดตั้งแอป','Install app'],['ศูนย์รวมระบบออนไลน์','Online Systems Hub'],['โรงเรียนบ้านคุ้ม','Bankhum School'],
  ['เข้าถึงระบบงานสำคัญของโรงเรียนได้จากหน้าเดียว ใช้งานง่าย สบายตา และรองรับทั้งคอมพิวเตอร์ แท็บเล็ต และโทรศัพท์มือถือ','Access the school’s key online systems from one place. Easy to use and optimized for computers, tablets, and phones.'],
  ['ดูระบบทั้งหมด','View all systems'],['ระบบพร้อมใช้งาน','systems available'],['รองรับมือถือ','mobile ready'],['เข้าถึงระบบ','open systems'],
  ['ทั้งหมด','All'],['ระบบหลัก','Main'],['บริหารงาน','Management'],['งานประเมิน','Evaluation'],
  ['เว็บไซต์และระบบหลัก','Main websites and systems'],['ระบบที่ใช้งานบ่อยและควรเข้าถึงได้อย่างรวดเร็ว','Frequently used systems for quick access.'],
  ['เว็บไซต์โรงเรียน','School website'],['เว็บไซต์หลักสำหรับข่าวสาร ประกาศ กิจกรรม และข้อมูลของโรงเรียนบ้านคุ้ม (ประสารราษฎร์วิทยา)','Official website for school news, announcements, activities, and information.'],['เข้าเว็บไซต์โรงเรียน','Open school website'],
  ['ระบบแจ้งผลการเลื่อนขั้นเงินเดือน','Salary increment results'],['ตรวจสอบผลการเลื่อนขั้นเงินเดือนสำหรับครูและบุคลากรของโรงเรียน','Check salary increment results for teachers and school staff.'],['เปิดระบบ','Open system'],
  ['ระบบบริหารงานโรงเรียน','School management systems'],['งานสารบรรณ สารสนเทศ และการบริหารบุคลากร','Document, information, finance, and personnel management.'],
  ['ระบบงานสารบรรณ','Document management'],['จัดการหนังสือราชการ เอกสารรับ–ส่ง และงานสารบรรณของโรงเรียน','Manage official correspondence and school documents.'],['เข้าระบบสารบรรณ','Open documents'],
  ['ระบบสารสนเทศโรงเรียน','School information system'],['บริหารและรวบรวมข้อมูลสารสนเทศเพื่อสนับสนุนการดำเนินงานของโรงเรียน','Manage school information and operational data.'],['เข้าระบบสารสนเทศ','Open information system'],
  ['ระบบลงเวลาครู','Teacher attendance'],['ระบบลงเวลาเข้า–ออกสำหรับครูและบุคลากรของโรงเรียน','Clock-in/out system for teachers and staff.'],['เข้าสู่ระบบลงเวลา','Open attendance'],
  ['ระบบบริหารการเงินและพัสดุโรงเรียน','Finance and procurement'],['ระบบสำหรับบริหารงานการเงิน งบประมาณ และงานพัสดุของโรงเรียน','Manage school finance, budget, and procurement.'],['เปิดระบบการเงินและพัสดุ','Open finance system'],
  ['ระบบงานวิชาการ','Academic systems'],['สนับสนุนการจัดการเรียนรู้ การนิเทศ และการจัดทำแผนการสอน','Support instruction, supervision, lesson planning, and assessment.'],
  ['ระบบนิเทศการจัดกิจกรรมการเรียนการสอน','Teaching supervision'],['บันทึกและติดตามการนิเทศการจัดกิจกรรมการเรียนรู้ภายในโรงเรียน','Record and track classroom supervision.'],['เปิดระบบนิเทศ','Open supervision'],
  ['สร้างแผนการสอนออนไลน์','Online lesson planning'],['เครื่องมือสำหรับจัดทำแผนการจัดการเรียนรู้ออนไลน์อย่างสะดวกและเป็นระบบ','Create and manage online lesson plans.'],['สร้างแผนการสอน','Create lesson plan'],
  ['ระบบวัดผลและประเมินผลโรงเรียน','Assessment system'],['ระบบสำหรับงานวัดผล ประเมินผล และจัดการข้อมูลผลการเรียนของโรงเรียน','Manage assessment and student achievement data.'],['เข้าสู่ระบบวัดผล','Open assessment'],
  ['ระบบสำหรับนักเรียน','Student systems'],['ระบบส่งเสริมการออม คุณลักษณะที่ดี และการมีส่วนร่วมของนักเรียน','Student savings, positive behavior, email, and related services.'],
  ['อีเมล์ นักเรียน/ครู','Student/Teacher Email'],['ค้นหาและเข้าใช้งานอีเมล์โรงเรียนสำหรับนักเรียนและครู โรงเรียนบ้านคุ้ม','Find and access school email accounts for students and teachers.'],['เปิดระบบอีเมล์','Open email'],
  ['ระบบออมทรัพย์โรงเรียน','School savings'],['บันทึกและจัดการข้อมูลการออมทรัพย์ของนักเรียนอย่างเป็นระบบ','Record and manage student savings.'],['เปิดระบบออมทรัพย์','Open savings'],
  ['ระบบสะสมความดีนักเรียน','Good behavior points'],['บันทึกกิจกรรมและคะแนนความดี เพื่อส่งเสริมพฤติกรรมเชิงบวกของนักเรียน','Record activities and positive behavior points.'],['เปิดระบบสะสมความดี','Open behavior system'],
  ['ช่องทางเข้าระบบวัดผลและประเมินผล สำหรับนักเรียนและผู้เกี่ยวข้อง','Assessment access for students and related users.'],
  ['รวมเว็บไซต์และระบบสำหรับการประเมินคุณภาพของสถานศึกษา','Quality assurance and school evaluation resources.'],
  ['โรงเรียนคุณภาพ','Quality School'],['ข้อมูลและเอกสารที่เกี่ยวข้องกับการดำเนินงานโรงเรียนคุณภาพ','Quality School information and supporting documents.'],['เปิดเว็บไซต์โรงเรียนคุณภาพ','Open Quality School'],
  ['ประเมิน สมศ. รอบ 5','ONESQA Round 5'],['ข้อมูล เอกสาร และหลักฐานประกอบการประเมินคุณภาพภายนอก สมศ. รอบ 5','Documents and evidence for ONESQA external quality assessment Round 5.'],['เปิดเว็บไซต์ประเมิน สมศ.','Open ONESQA'],
  ['อันดับระบบที่ใช้งานมากที่สุด','Most used systems'],['เรียงจากจำนวนครั้งที่เปิดใช้งานจริงของผู้ใช้ทุกคน','Ranked by how often everyone opens each system.'],['จัดอันดับระบบที่ถูกเปิดใช้งานมากที่สุด อัปเดตอัตโนมัติทุก 1 นาที','Systems ranked by usage, refreshed every minute.'],['30 วัน','30 days'],['7 วัน','7 days'],
  ['ไม่พบระบบที่ค้นหา','No systems found'],['ลองเปลี่ยนคำค้น หรือเลือกหมวดหมู่อื่น','Try another search term or category.'],['แสดงระบบทั้งหมด','Show all systems'],
  ['การใช้งานแต่ละระบบ','Usage by system'],['กราฟเส้นแสดงจำนวนครั้งการใช้งานของแต่ละระบบ','Line chart showing total usage for each system.'],['สถิติรวมทุกผู้ใช้','All-user statistics'],
  ['พัฒนาโดย','Developed by'],['นายดีลาภ ปราบสงบ','Mr. Deelarp Prabsangob'],['ครูชำนาญการพิเศษ','Senior Professional Level Teacher'],['© 2026 โรงเรียนบ้านคุ้ม (ประสารราษฎร์วิทยา) · All rights reserved.','© 2026 Bankhum School · All rights reserved.'],
  ['บริหาร','Manage'],['ประเมิน','Evaluate'],['สถิติ','Stats'],['สายด่วน','Hotline'],['สายด่วนโรงเรียนบ้านคุ้ม','Bankhum School Hotline'],['ช่องทางติดต่อออนไลน์','Online contact'],
  ['สวัสดีครับ 👋 ต้องการติดต่อโรงเรียนเรื่องใด เลือกหัวข้อหรือพิมพ์ข้อความได้เลย','Hello 👋 Choose a topic or type your message to contact the school.'],
  ['สอบถามข้อมูล','General inquiry'],['แจ้งปัญหาระบบ','System issue'],['เรื่องเร่งด่วน','Urgent'],['ข้อความถึงโรงเรียน','Message to school'],['ส่งต่อผ่าน Facebook Messenger','Send via Facebook Messenger'],
  ['ระบบจะคัดลอกข้อความของคุณ แล้วเปิดช่องทาง Facebook ของโรงเรียนเพื่อส่งข้อความต่อ','Your message will be copied, then the school Facebook Messenger will open.'],
  // V22 portal layout
  ['ระบบงาน','Systems'],['สารบรรณ','Sarabun'],['ศูนย์รวมระบบบริหารสถานศึกษา','School Management Portal'],
  ['“หนึ่งพอร์ทัล ครบทุกงาน เชื่อมทุกข้อมูล เพื่อการบริหารที่ทันสมัย”','“One portal for every task, connecting all data for modern school management.”'],
  ['เข้าถึงระบบงานสำคัญของโรงเรียนได้จากหน้าเดียว ใช้งานง่าย รองรับทั้งคอมพิวเตอร์ แท็บเล็ต และโทรศัพท์มือถือ','Access the school’s key systems from one place, on computers, tablets, and phones.'],
  ['กลุ่มงาน','work groups'],['เมนูเตรียมเปิดใช้','menus coming soon'],
  ['ระบบหลักของโรงเรียนบ้านคุ้ม','Bankhum School core systems'],['เลือกกลุ่มงานเพื่อไปยังเมนูที่ต้องการ','Choose a work group to jump to its menus.'],
  ['พร้อมใช้งาน','Ready'],['เร็วๆ นี้','Coming soon'],
  ['Bankhum School Portal · ศูนย์รวมระบบบริหารสถานศึกษา','Bankhum School Portal · School management hub'],
  ['“บริหารดี ครูมีความสุข นักเรียนคุณภาพ โรงเรียนพัฒนาอย่างยั่งยืน”','“Good management, happy teachers, quality students, sustainable school.”']
]);
const enToTh = new Map([...thToEn.entries()].map(([th,en]) => [en,th]));

function translateTextNodes(root, map) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const raw = node.nodeValue;
    const trimmed = raw.trim();
    if (!trimmed || !map.has(trimmed)) return;
    node.nodeValue = raw.replace(trimmed, map.get(trimmed));
  });
}

function setLanguage(lang) {
  const current = document.documentElement.lang === 'en' ? 'en' : 'th';
  if (current !== lang) translateTextNodes(document.body, lang === 'en' ? thToEn : enToTh);
  document.documentElement.lang = lang;
  localStorage.setItem(LANGUAGE_KEY, lang);
  document.querySelector('.lang-th')?.classList.toggle('active', lang === 'th');
  document.querySelector('.lang-en')?.classList.toggle('active', lang === 'en');
  if (searchInput) searchInput.placeholder = lang === 'en' ? 'Search menus, e.g. salary, sarabun, grades, savings…' : 'ค้นหาเมนู เช่น เงินเดือน, สารบรรณ, วัดผล, ออมทรัพย์...';
  renderMenu();
  paintDashboard();
  if (hotlineMessage) hotlineMessage.placeholder = lang === 'en' ? 'Type your message…' : 'พิมพ์รายละเอียดที่ต้องการติดต่อ...';
  languageToggle?.setAttribute('aria-label', lang === 'en' ? 'Switch to Thai' : 'Switch to English');
  refreshIcons();
}

languageToggle?.addEventListener('click', () => {
  setLanguage(document.documentElement.lang === 'en' ? 'th' : 'en');
});

setLanguage(localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'th');
