const cards = [...document.querySelectorAll('.system-card')];
const sections = [...document.querySelectorAll('.system-section')];
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const chips = [...document.querySelectorAll('.chip')];
const emptyState = document.getElementById('emptyState');
const resetFilter = document.getElementById('resetFilter');
const systemCount = document.getElementById('systemCount');
const toast = document.getElementById('toast');
let currentFilter = 'all';

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

systemCount.textContent = cards.length;

function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();
  let visible = 0;

  cards.forEach(card => {
    const category = card.dataset.category;
    const text = `${card.innerText} ${card.dataset.search || ''}`.toLowerCase();
    const categoryMatch = currentFilter === 'all' || category === currentFilter;
    const textMatch = !q || text.includes(q);
    const show = categoryMatch && textMatch;
    card.hidden = !show;
    if (show) visible++;
  });

  sections.forEach(section => {
    const hasVisible = [...section.querySelectorAll('.system-card')].some(card => !card.hidden);
    section.hidden = !hasVisible;
  });

  emptyState.hidden = visible !== 0;
  clearSearch.hidden = !q;
  systemCount.textContent = visible;
}

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    applyFilters();
  });
});

searchInput.addEventListener('input', applyFilters);
clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  searchInput.focus();
  applyFilters();
});

resetFilter.addEventListener('click', () => {
  currentFilter = 'all';
  searchInput.value = '';
  chips.forEach(c => c.classList.toggle('active', c.dataset.filter === 'all'));
  applyFilters();
  document.getElementById('systems').scrollIntoView({behavior:'smooth'});
});

// ===== Global usage statistics =====
const STATS_API_URL = (window.BANKHUM_CONFIG?.STATS_API_URL || '').trim();
const LOCAL_FALLBACK_KEY = 'bankhumPortalUsageFallbackV13';
const todayKey = () => new Date().toLocaleDateString('en-CA');
let globalStatsCache = null;

function getSystemMeta() {
  const map = new Map();
  cards.forEach(card => {
    const id = card.dataset.systemId;
    if (!id || map.has(id)) return;
    map.set(id, {
      id,
      name: card.querySelector('h3')?.textContent.trim() || 'ระบบ',
      url: card.querySelector('.card-link')?.href || ''
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
  try {
    const data = await jsonp(STATS_API_URL);
    if (data && data.ok) return data;
  } catch (_) {}
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
  const points=rows.map((row,i)=>{const cx=x(i),cy=y(row.count);return `<g><circle cx="${cx}" cy="${cy}" r="4.5" class="chart-point"></circle><circle cx="${cx}" cy="${cy}" r="13" class="chart-point-hit"><title>${escapeHtml(row.name)}: ${row.count.toLocaleString('th-TH')} ครั้ง</title></circle><text x="${cx}" y="${cy-12}" text-anchor="middle" class="chart-point-label">${row.count}</text></g>`}).join('');
  return `<div class="line-dashboard graph-only"><div class="line-chart-wrap"><svg viewBox="0 0 ${width} ${height}" class="line-chart" role="img" aria-label="กราฟเส้นสถิติการเปิดระบบ รวม ${total} ครั้ง"><defs><linearGradient id="usageAreaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(15,122,90,0.30)"></stop><stop offset="100%" stop-color="rgba(15,122,90,0.03)"></stop></linearGradient><linearGradient id="usageStroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#0f7a5a"></stop><stop offset="100%" stop-color="#39a57f"></stop></linearGradient></defs>${yLabels}<polyline points="${areaPoints}" class="chart-area"></polyline><polyline points="${linePoints}" class="chart-line"></polyline>${points}${xLabels}</svg></div></div>`;
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
    if (badge) badge.innerHTML = '<i data-lucide="hard-drive"></i> ยังไม่เชื่อมฐานข้อมูลกลาง';
  }

  chart.innerHTML = lineChartHtml(rows);
  refreshIcons();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

// Mobile navigation highlight
const mobileLinks = [...document.querySelectorAll('.mobile-nav-item')];
const targets = ['home','management','academic','student','assessment','dashboard']
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

// Feedback + count each outbound system click
cards.forEach(card => {
  const link = card.querySelector('.card-link');
  if (!link) return;
  link.addEventListener('click', () => {
    recordUsage(card.dataset.systemId);
    showToast(`กำลังเปิด ${card.querySelector('h3')?.textContent || 'ระบบ'}...`);
  });
});

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
      const reg = await navigator.serviceWorker.register('./sw.js?v=14', { updateViaCache: 'none' });
      await reg.update();
    } catch (_) {}
  });
}

refreshIcons();
applyFilters();
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
