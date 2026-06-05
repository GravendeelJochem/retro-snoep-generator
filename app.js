// ── STANDAARD WAARDEN ────────────────────────────────────────────────────

const DEFAULT_NAMES = [
  'Teamlid 1', 'Teamlid 2', 'Teamlid 3', 'Teamlid 4',
  'Teamlid 5', 'Teamlid 6', 'Teamlid 7',
];

const DEFAULT_CANDIES = [
  'Haribo Goudbeertjes 🐻',
  'Drop 🖤',
  'Haribo Mix 🌈',
];

// ── STORAGE HELPER ────────────────────────────────────────────────────

const Storage = {
  get:       (key, fallback = null) => JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback,
  set:       (key, value)           => localStorage.setItem(key, JSON.stringify(value)),
  getString: (key)                  => localStorage.getItem(key),
  setString: (key, value)           => localStorage.setItem(key, value),
  remove:    (key)                  => localStorage.removeItem(key),
};

// ── STATE ────────────────────────────────────────────────────────────────

let names      = Storage.get('retro_names')    ?? [...DEFAULT_NAMES];
let candies    = Storage.get('retro_candies')  ?? [...DEFAULT_CANDIES];
let history    = Storage.get('retro_history')  ?? [];
let lastWinner = Storage.getString('retro_last_winner');
let spinning   = false;

// ── TABS ────────────────────────────────────────────────────────────────

function switchTab(panelId, clickedTab) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('panel-' + panelId).classList.add('active');
  clickedTab.classList.add('active');

  if (panelId === 'teamleden') renderNameGrid();
  if (panelId === 'snoep')     renderCandyList();
}

// ── TEAMLEDEN ────────────────────────────────────────────────────────

function renderNameGrid() {
  document.getElementById('nameGrid').innerHTML = names.map((n, i) => `
    <div class="candy-row" data-index="${i}">
      <div class="num-badge" style="flex-shrink:0">${i + 1}</div>
      <input type="text" id="name-${i}" value="${escHtml(n)}" placeholder="Naam ${i + 1}">
      <button class="delete-btn" data-action="remove-member">✕</button>
    </div>`
  ).join('');
}

function addMember() {
  names.push('');
  renderNameGrid();
  document.getElementById('name-' + (names.length - 1))?.focus();
}

function removeMember(i) {
  if (names.length <= 1) { showToast('⚠️ Je hebt minimaal 1 teamlid nodig!'); return; }
  names.splice(i, 1);
  persistNames();
  renderNameGrid();
}

function persistNames() {
  Storage.set('retro_names', names.filter(n => n.trim()));
  showAutoSaved();
}

function saveNames() {
  persistNames();
  showToast('✅ Teamleden opgeslagen!');
}

// ── SNOEPLIJST ──────────────────────────────────────────────────────

function renderCandyList() {
  document.getElementById('candyList').innerHTML = candies.map((c, i) => `
    <div class="candy-row" data-index="${i}">
      <input type="text" id="candy-${i}" value="${escHtml(c)}" placeholder="Snoepnaam">
      <button class="delete-btn" data-action="remove-candy">✕</button>
    </div>`
  ).join('');
}

function addCandy() {
  candies.push('');
  renderCandyList();
  document.getElementById('candy-' + (candies.length - 1))?.focus();
}

function removeCandy(i) {
  candies.splice(i, 1);
  persistCandies();
  renderCandyList();
}

function persistCandies() {
  Storage.set('retro_candies', candies.filter(c => c.trim()));
  showAutoSaved();
}

function saveCandies() {
  persistCandies();
  showToast('✅ Snoeplijst opgeslagen!');
}

// ── GESCHIEDENIS ─────────────────────────────────────────────────

function renderHistory() {
  const list = document.getElementById('historyList');
  if (!history.length) {
    list.innerHTML = '<div class="empty-state">Nog geen rondes gespeeld.</div>';
    return;
  }
  list.innerHTML = [...history].reverse().map(h => `
    <div class="history-item">
      <div class="dot"></div>
      <span>
        <strong>${escHtml(h.person)}</strong> bracht
        <strong>${escHtml(h.candy)}</strong> &mdash;
        <small style="color:#777">${h.date}</small>
      </span>
    </div>`
  ).join('');
}

function clearHistory() {
  if (!confirm('Geschiedenis wissen?')) return;
  history = [];
  Storage.remove('retro_history');
  renderHistory();
}

// ── SPIN ────────────────────────────────────────────────────────────────

function spin() {
  if (spinning) return;

  const allNames     = names.filter(n => n.trim());
  const validCandies = candies.filter(c => c.trim());

  if (!allNames.length)     { showToast('⚠️ Voeg eerst teamleden toe!');    return; }
  if (!validCandies.length) { showToast('⚠️ Voeg eerst snoepsoorten toe!'); return; }

  // Sluit vorige winner uit, tenzij er maar één persoon is
  const validNames = allNames.length > 1 && lastWinner
    ? allNames.filter(n => n !== lastWinner)
    : allNames;

  spinning = true;
  document.getElementById('spinBtn').disabled = true;
  document.getElementById('resultCard').classList.remove('show');
  document.getElementById('slot-person').classList.remove('winner');
  document.getElementById('slot-candy').classList.remove('winner');

  const finalPerson = validNames[Math.floor(Math.random() * validNames.length)];
  const finalCandy  = validCandies[Math.floor(Math.random() * validCandies.length)];

  animateSlot('slot-person-inner', validNames, finalPerson, 2000, () => {
    document.getElementById('slot-person').classList.add('winner');
  });

  animateSlot('slot-candy-inner', validCandies, finalCandy, 2400, () => {
    document.getElementById('slot-candy').classList.add('winner');

    document.getElementById('resultPerson').textContent = '🎉 ' + finalPerson;
    document.getElementById('resultCandy').textContent  = finalCandy;
    document.getElementById('resultCard').classList.add('show');

    history.push({
      person: finalPerson,
      candy:  finalCandy,
      date:   new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }),
    });
    Storage.set('retro_history', history);
    renderHistory();

    lastWinner = finalPerson;
    Storage.setString('retro_last_winner', finalPerson);
    renderLastWinnerBadge();

    launchConfetti();
    spinning = false;
    document.getElementById('spinBtn').disabled = false;
  });
}

function animateSlot(innerId, items, finalValue, duration, onDone) {
  const inner = document.getElementById(innerId);
  const totalCycles = Math.floor(duration / 80);
  let count = 0;

  function step() {
    if (count >= totalCycles) {
      inner.innerHTML = `<div class="slot-item">${escHtml(finalValue)}</div>`;
      onDone?.();
      return;
    }
    const progress = count / totalCycles;
    const delay    = 60 + progress * progress * 180;
    inner.innerHTML = `<div class="slot-item">${escHtml(items[Math.floor(Math.random() * items.length)])}</div>`;
    count++;
    setTimeout(step, delay);
  }

  step();
}

// ── CONFETTI ────────────────────────────────────────────────────────

function launchConfetti() {
  const colors = ['#ffc832', '#ff6b35', '#23c55e', '#3b82f6', '#a855f7', '#ec4899', '#fff'];
  for (let i = 0; i < 80; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    // Dynamische waarden moeten inline blijven — geen vaste CSS-klasse mogelijk
    el.style.cssText = `
      left: ${Math.random() * 100}vw;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation-duration: ${1.5 + Math.random() * 2}s;
      animation-delay: ${Math.random() * 0.5}s;
    `;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ── TOAST & AUTO-SAVE INDICATOR ──────────────────────────────────────

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

let autoSavedTimer = null;

function showAutoSaved() {
  const el = document.getElementById('autosaved-indicator');
  clearTimeout(autoSavedTimer);
  el.classList.add('visible');
  autoSavedTimer = setTimeout(() => el.classList.remove('visible'), 1800);
}

// ── EXPORT / IMPORT ──────────────────────────────────────────────────

function exportSettings() {
  const data = {
    versie: 1,
    teamleden:  names.filter(n => n.trim()),
    snoeplijst: candies.filter(c => c.trim()),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'snoep-generator-instellingen.json' });
  a.click();
  URL.revokeObjectURL(url);
}

function importSettings(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data.teamleden) || !Array.isArray(data.snoeplijst)) {
        showToast('⚠️ Ongeldig bestand — verwacht teamleden en snoeplijst.');
        return;
      }
      names   = data.teamleden.filter(n => typeof n === 'string' && n.trim());
      candies = data.snoeplijst.filter(c => typeof c === 'string' && c.trim());
      Storage.set('retro_names',   names);
      Storage.set('retro_candies', candies);
      showToast(`✅ Geïmporteerd: ${names.length} teamleden, ${candies.length} snoepsoorten`);
      renderLastWinnerBadge();
    } catch {
      showToast('⚠️ Bestand kon niet worden gelezen.');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ── LAATSTE WINNER BADGE ──────────────────────────────────────────────

function renderLastWinnerBadge() {
  let badge = document.getElementById('last-winner-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id        = 'last-winner-badge';
    badge.className = 'last-winner-badge';
    const slotMachine = document.querySelector('.slot-machine');
    slotMachine.insertBefore(badge, slotMachine.firstChild);
  }

  badge.innerHTML = lastWinner && names.filter(n => n.trim()).length > 1
    ? `<span class="last-winner-chip">⏭ <strong>${escHtml(lastWinner)}</strong> doet deze ronde niet mee</span>`
    : '';
}

// ── HULPFUNCTIE ─────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── EVENT LISTENERS ───────────────────────────────────────────────────

function bindEvents() {
  // Tabs
  document.getElementById('tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab[data-panel]');
    if (tab) switchTab(tab.dataset.panel, tab);
  });

  // Generator
  document.getElementById('spinBtn').addEventListener('click', spin);
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
  document.getElementById('exportBtn').addEventListener('click', exportSettings);
  document.getElementById('importInput').addEventListener('change', importSettings);

  // Teamleden
  document.getElementById('addMemberBtn').addEventListener('click', addMember);
  document.getElementById('saveNamesBtn').addEventListener('click', saveNames);

  const nameGrid = document.getElementById('nameGrid');
  nameGrid.addEventListener('input', (e) => {
    if (!e.target.matches('input[type="text"]')) return;
    const i = parseInt(e.target.id.replace('name-', ''), 10);
    names[i] = e.target.value;
  });
  nameGrid.addEventListener('focusout', (e) => {
    if (e.target.matches('input[type="text"]')) persistNames();
  });
  nameGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="remove-member"]');
    if (btn) removeMember(parseInt(btn.closest('[data-index]').dataset.index, 10));
  });

  // Snoeplijst
  document.getElementById('addCandyBtn').addEventListener('click', addCandy);
  document.getElementById('saveCandiesBtn').addEventListener('click', saveCandies);

  const candyList = document.getElementById('candyList');
  candyList.addEventListener('input', (e) => {
    if (!e.target.matches('input[type="text"]')) return;
    const i = parseInt(e.target.id.replace('candy-', ''), 10);
    candies[i] = e.target.value;
  });
  candyList.addEventListener('focusout', (e) => {
    if (e.target.matches('input[type="text"]')) persistCandies();
  });
  candyList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="remove-candy"]');
    if (btn) removeCandy(parseInt(btn.closest('[data-index]').dataset.index, 10));
  });
}

// ── INIT ────────────────────────────────────────────────────────────────

function init() {
  bindEvents();
  renderHistory();
  renderLastWinnerBadge();
}

init();
