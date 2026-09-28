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

// ===== Local usage statistics =====
const STATS_KEY = 'bankhumPortalUsageV1';
const todayKey = () => new Date().toLocaleDateString('en-CA');

function getSystemMeta() {
  return cards.map(card => ({
    id: card.dataset.systemId,
    name: card.querySelector('h3')?.textContent.trim() || 'ระบบ',
    url: card.querySelector('.card-link')?.href || ''
  })).filter(item => item.id);
}

function emptyStats() {
  const systems = {};
  getSystemMeta().forEach(item => systems[item.id] = {count:0, days:{}, lastUsed:null});
  return {systems, lastSystemId:null, lastUsed:null};
}

function loadStats() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATS_KEY) || 'null');
    const stats = parsed && parsed.systems ? parsed : emptyStats();
    getSystemMeta().forEach(item => {
      if (!stats.systems[item.id]) stats.systems[item.id] = {count:0, days:{}, lastUsed:null};
      if (!stats.systems[item.id].days) stats.systems[item.id].days = {};
    });
    return stats;
  } catch (_) {
    return emptyStats();
  }
}

function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function recordUsage(systemId) {
  if (!systemId) return;
  const stats = loadStats();
  const now = new Date();
  const day = todayKey();
  const entry = stats.systems[systemId] || {count:0, days:{}, lastUsed:null};
  entry.count = (Number(entry.count) || 0) + 1;
  entry.days[day] = (Number(entry.days[day]) || 0) + 1;
  entry.lastUsed = now.toISOString();
  stats.systems[systemId] = entry;
  stats.lastSystemId = systemId;
  stats.lastUsed = now.toISOString();
  saveStats(stats);
  renderDashboard();
}

function formatShortDate(iso) {
  if (!iso) return 'ยังไม่มีข้อมูล';
  try {
    return new Intl.DateTimeFormat('th-TH', {
      day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'
    }).format(new Date(iso));
  } catch (_) { return '-'; }
}

function renderDashboard() {
  const stats = loadStats();
  const meta = getSystemMeta();
  const day = todayKey();
  const rows = meta.map(item => {
    const entry = stats.systems[item.id] || {count:0, days:{}, lastUsed:null};
    return {...item, count:Number(entry.count)||0, today:Number(entry.days?.[day])||0, lastUsed:entry.lastUsed};
  });
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const todayTotal = rows.reduce((sum, row) => sum + row.today, 0);
  const sorted = [...rows].sort((a,b) => b.count - a.count || a.name.localeCompare(b.name,'th'));
  const top = sorted[0] && sorted[0].count > 0 ? sorted[0] : null;
  const last = stats.lastSystemId ? rows.find(r => r.id === stats.lastSystemId) : null;

  document.getElementById('totalClicks').textContent = total.toLocaleString('th-TH');
  document.getElementById('todayClicks').textContent = todayTotal.toLocaleString('th-TH');
  document.getElementById('topSystem').textContent = top ? top.name : '-';
  document.getElementById('topSystemCount').textContent = top ? `${top.count.toLocaleString('th-TH')} ครั้ง` : 'ยังไม่มีข้อมูล';
  document.getElementById('lastUsed').textContent = last ? last.name : '-';
  document.getElementById('lastUsedTime').textContent = stats.lastUsed ? formatShortDate(stats.lastUsed) : 'ยังไม่มีข้อมูล';

  const chart = document.getElementById('usageChart');
  if (!total) {
    chart.innerHTML = '<div class="usage-empty">ยังไม่มีสถิติ — ลองกดเปิดระบบด้านล่าง แล้วข้อมูลจะปรากฏที่นี่อัตโนมัติ</div>';
    return;
  }
  const max = Math.max(...sorted.map(r => r.count), 1);
  chart.innerHTML = sorted.map((row, index) => {
    const width = row.count ? Math.max((row.count / max) * 100, 3) : 0;
    return `<div class="usage-row">
      <div class="usage-name"><b class="usage-rank">${index + 1}</b><span title="${escapeHtml(row.name)}">${escapeHtml(row.name)}</span></div>
      <div class="usage-track"><div class="usage-fill" style="width:${width}%"></div></div>
      <div class="usage-value">${row.count.toLocaleString('th-TH')} ครั้ง</div>
    </div>`;
  }).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

const resetStats = document.getElementById('resetStats');
resetStats?.addEventListener('click', () => {
  if (!confirm('ต้องการล้างสถิติการใช้งานที่บันทึกในอุปกรณ์นี้หรือไม่?')) return;
  localStorage.removeItem(STATS_KEY);
  renderDashboard();
  showToast('ล้างสถิติในอุปกรณ์นี้แล้ว');
});

// Mobile navigation highlight
const mobileLinks = [...document.querySelectorAll('.mobile-nav-item')];
const targets = ['home','dashboard','management','academic','student']
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
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

refreshIcons();
applyFilters();
renderDashboard();
