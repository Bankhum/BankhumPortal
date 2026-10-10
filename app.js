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

// ===== Global usage statistics =====
const STATS_API_URL = (window.BANKHUM_CONFIG?.STATS_API_URL || 'https://script.google.com/macros/s/AKfycbw_Q22NTyv1on8uF77sLSHzHK9JuzLUCq4S-mUU1Nai6eKIr4tdrsp6xp-GFON92Ii0/exec').trim();
const LOCAL_FALLBACK_KEY = 'bankhumPortalUsageFallbackV15';
const todayKey = () => new Date().toLocaleDateString('en-CA');
let globalStatsCache = null;

function getSystemMeta() {
  const map = new Map();
  MENU.forEach(mod => {
    if (mod.main?.statId && mod.main.url) {
      const first = mod.items.find(i => i.statId === mod.main.statId);
      if (!map.has(mod.main.statId)) map.set(mod.main.statId, { id: mod.main.statId, name: first?.statName || first?.th || mod.th, url: mod.main.url });
    }
    mod.items.forEach(item => {
      if (!item.url || !item.statId || map.has(item.statId)) return;
      map.set(item.statId, { id: item.statId, name: item.statName || item.th, url: item.url });
    });
  });
  return [...map.values()];
}

function loadLocalFallback() {
  try { return JSON.parse(localStorage.getItem(LOCAL_FALLBACK_KEY) || '{}'); }
  catch (_) { return {}; }
}
function saveLocalFallback(data) { localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(data)); }

function recordUsage(systemId) {
  if (!systemId) return;
  const meta = getSystemMeta().find(item => item.id === systemId);
  if (!meta) return;

  // Fire-and-forget request: Google Apps Script receives every click from every visitor.
  if (STATS_API_URL) {
    const qs = new URLSearchParams({
      action: 'click',
      id: meta.id,
      name: meta.name,
      url: meta.url,
      t: String(Date.now())
    });
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.src = `${STATS_API_URL}?${qs.toString()}`;
  } else {
    // Local fallback until the central endpoint is configured.
    const local = loadLocalFallback();
    local[systemId] = (Number(local[systemId]) || 0) + 1;
    saveLocalFallback(local);
    globalStatsCache = null;
    renderDashboard();
  }
}

function jsonp(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const callback = `bankhumStats_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timer = setTimeout(() => cleanup(new Error('timeout')), timeout);
    function cleanup(error, data) {
      clearTimeout(timer);
      try { delete window[callback]; } catch (_) {}
      script.remove();
      error ? reject(error) : resolve(data);
    }
    window[callback] = data => cleanup(null, data);
    const sep = url.includes('?') ? '&' : '?';
    script.src = `${url}${sep}action=stats&callback=${encodeURIComponent(callback)}&t=${Date.now()}`;
    script.onerror = () => cleanup(new Error('load error'));
    document.head.appendChild(script);
  });
}

async function loadGlobalStats() {
  if (!STATS_API_URL) return null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const data = await jsonp(STATS_API_URL, 12000);
      if (data && data.ok) return data;
    } catch (_) {}
    if (attempt < 3) await new Promise(r => setTimeout(r, 700 * attempt));
  }
  return null;
}

function lineChartHtml(rows) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const maxValue = Math.max(1, ...rows.map(r => r.count));
  const roundedMax = maxValue <= 5 ? 5 : Math.ceil(maxValue / 5) * 5;
  const width = 920, height = 340;
  const padding = { top: 18, right: 26, bottom: 98, left: 48 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const gap = rows.length > 1 ? innerWidth / (rows.length - 1) : 0;
  const x = i => rows.length === 1 ? padding.left + innerWidth / 2 : padding.left + i * gap;
  const y = value => padding.top + innerHeight - ((value / roundedMax) * innerHeight);
  const linePoints = rows.map((row, i) => `${x(i)},${y(row.count)}`).join(' ');
  const areaPoints = `${padding.left},${padding.top + innerHeight} ${linePoints} ${padding.left + innerWidth},${padding.top + innerHeight}`;
  const ticks = 5;
  const yLabels = Array.from({length:ticks+1},(_,i)=>{
    const value=Math.round((roundedMax/ticks)*(ticks-i)); const py=y(value);
    return `<g><line x1="${padding.left}" y1="${py}" x2="${padding.left+innerWidth}" y2="${py}" class="chart-grid"></line><text x="${padding.left-10}" y="${py+4}" text-anchor="end" class="chart-y-label">${value}</text></g>`;
  }).join('');
  const xLabels=rows.map((row,i)=>{const label=escapeHtml(row.name.length>18?row.name.slice(0,18)+'…':row.name);const px=x(i);return `<text x="${px}" y="${padding.top+innerHeight+22}" text-anchor="end" transform="rotate(-35 ${px} ${padding.top+innerHeight+22})" class="chart-x-label">${label}</text>`}).join('');
  const brightColors=['#00b894','#0984e3','#6c5ce7','#e84393','#fdcb6e','#e17055','#00cec9','#a29bfe','#ff7675','#55efc4','#74b9ff','#fd79a8','#f6b93b','#20bf6b','#eb3b5a','#8854d0'];
  const points=rows.map((row,i)=>{const cx=x(i),cy=y(row.count);const color=brightColors[i%brightColors.length];return `<g><circle cx="${cx}" cy="${cy}" r="6" fill="${color}" class="chart-point-color"></circle><circle cx="${cx}" cy="${cy}" r="14" class="chart-point-hit"><title>${escapeHtml(row.name)}: ${row.count.toLocaleString('th-TH')} ครั้ง</title></circle><text x="${cx}" y="${cy-14}" text-anchor="middle" fill="${color}" class="chart-point-label-color">${row.count}</text></g>`}).join('');
  return `<div class="line-dashboard graph-only"><div class="line-chart-wrap"><svg viewBox="0 0 ${width} ${height}" class="line-chart" role="img" aria-label="กราฟเส้นสถิติการเปิดระบบ รวม ${total} ครั้ง"><defs><linearGradient id="usageAreaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#74b9ff" stop-opacity="0.36"></stop><stop offset="48%" stop-color="#55efc4" stop-opacity="0.18"></stop><stop offset="100%" stop-color="#fd79a8" stop-opacity="0.04"></stop></linearGradient><linearGradient id="usageStroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#00b894"></stop><stop offset="24%" stop-color="#0984e3"></stop><stop offset="48%" stop-color="#6c5ce7"></stop><stop offset="72%" stop-color="#e84393"></stop><stop offset="100%" stop-color="#f39c12"></stop></linearGradient></defs>${yLabels}<polyline points="${areaPoints}" class="chart-area"></polyline><polyline points="${linePoints}" class="chart-line"></polyline>${points}${xLabels}</svg></div></div>`;
}

async function renderDashboard() {
  const chart = document.getElementById('usageChart');
  const badge = document.getElementById('statsSourceBadge');
  const meta = getSystemMeta();
  chart.innerHTML = '<div class="usage-empty">กำลังโหลดสถิติ...</div>';

  let rows;
  if (STATS_API_URL) {
    const data = await loadGlobalStats();
    if (data) {
      const counts = data.counts || {};
      rows = meta.map(item => ({...item, count:Number(counts[item.id])||0}));
      if (badge) badge.innerHTML = '<i data-lucide="cloud"></i> สถิติรวมทุกผู้ใช้';
    }
  }
  if (!rows) {
    const local = loadLocalFallback();
    rows = meta.map(item => ({...item, count:Number(local[item.id])||0}));
    if (badge) badge.innerHTML = '<i data-lucide="cloud-off"></i> เชื่อมสถิติกลางไม่สำเร็จ';
  }

  chart.innerHTML = lineChartHtml(rows);
  refreshIcons();
}

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
      const reg = await navigator.serviceWorker.register('./sw.js?v=22', { updateViaCache: 'none' });
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
  if (hotlineMessage) hotlineMessage.placeholder = lang === 'en' ? 'Type your message…' : 'พิมพ์รายละเอียดที่ต้องการติดต่อ...';
  languageToggle?.setAttribute('aria-label', lang === 'en' ? 'Switch to Thai' : 'Switch to English');
  refreshIcons();
}

languageToggle?.addEventListener('click', () => {
  setLanguage(document.documentElement.lang === 'en' ? 'th' : 'en');
});

setLanguage(localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'th');
