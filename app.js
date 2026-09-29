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

  const activeRows = sorted.filter(row => row.count > 0);
  const palette = ['#0f7a5a','#2f80ed','#f2994a','#9b51e0','#eb5757','#27ae60','#56ccf2','#f2c94c','#6fcf97','#bb6bd9','#f299c1','#2d9cdb','#b08968','#8e9aaf','#e76f51','#00b894'];
  let cumulative = 0;
  const segments = activeRows.map((row, idx) => {
    const percent = (row.count / total) * 100;
    const start = cumulative;
    cumulative += percent;
    return { ...row, percent, color: palette[idx % palette.length], start, end: cumulative };
  });

  const gradient = segments.map(seg => `${seg.color} ${seg.start.toFixed(2)}% ${seg.end.toFixed(2)}%`).join(', ');
  const legend = sorted.map((row, idx) => {
    const seg = segments.find(s => s.id === row.id);
    const color = seg ? seg.color : '#d9e5de';
    const percent = total ? ((row.count / total) * 100).toFixed(1) : '0.0';
    return `<div class="pie-legend-item ${row.count ? '' : 'is-zero'}">
      <span class="pie-legend-color" style="background:${color}"></span>
      <div class="pie-legend-text">
        <strong title="${escapeHtml(row.name)}">${escapeHtml(row.name)}</strong>
        <small>${row.count.toLocaleString('th-TH')} ครั้ง · ${percent}%</small>
      </div>
    </div>`;
  }).join('');

  chart.innerHTML = `<div class="pie-dashboard">
    <div class="pie-chart-wrap">
      <div class="pie-chart" style="background:conic-gradient(${gradient})" role="img" aria-label="แผนภูมิวงกลมแสดงการใช้งานระบบทั้งหมด ${total} ครั้ง"></div>
      <div class="pie-chart-total"><span>ทั้งหมด</span><strong>${total.toLocaleString('th-TH')}</strong><small>ครั้ง</small></div>
    </div>
    <div class="pie-legend">${legend}</div>
  </div>`;
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
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
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
