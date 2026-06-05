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

// ── STATE ────────────────────────────────────────────────────────────────

let names      = JSON.parse(localStorage.getItem('retro_names')    || 'null') || [...DEFAULT_NAMES];
let candies    = JSON.parse(localStorage.getItem('retro_candies') || 'null') || [...DEFAULT_CANDIES];
let history    = JSON.parse(localStorage.getItem('retro_history') || '[]');
let lastWinner = localStorage.getItem('retro_last_winner')        || null;
let spinning   = false;

// ── TABS ────────────────────────────────────────────────────────────────

function switchTab(id, clickedEl) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  clickedEl.classList.add('active');

  if (id === 'teamleden') renderNameGrid();
  if (id === 'snoep')     renderCandyList();
}

// ── TEAMLEDEN ────────────────────────────────────────────────────────

function renderNameGrid() {
  const grid = document.getElementById('nameGrid');
  grid.innerHTML = names.map((n, i) => `
    <div class="candy-row" id="name-row-${i}">
      <div class="num-badge" style="flex-shrink:0">${i + 1}</div>
      <input type="text" id="name-${i}" value="${escHtml(n)}" placeholder="Naam ${i + 1}"
        oninput="names[${i}] = this.value"
        onblur="persistNames()">
      <button class="delete-btn" onclick="removeMember(${i})">✕</button>
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
  localStorage.setItem('retro_names', JSON.stringify(names.filter(n => n.trim())));
  showAutoSaved();
}

function saveNames() {
  persistNames();
  showToast('✅ Teamleden opgeslagen!');
}

// ── SNOEPLIJST ──────────────────────────────────────────────────────

function renderCandyList() {
  const list = document.getElementById('candyList');
  list.innerHTML = candies.map((c, i) => `
    <div class="candy-row" id="candy-row-${i}">
      <input type="text" id="candy-${i}" value="${escHtml(c)}" placeholder="Snoepnaam"
        oninput="candies[${i}] = this.value"
        onblur="persistCandies()">
      <button class="delete-btn" onclick="removeCandy(${i})">✕</button>
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
  localStorage.setItem('retro_candies', JSON.stringify(candies.filter(c => c.trim())));
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
  localStorage.removeItem('retro_history');
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
    localStorage.setItem('retro_history', JSON.stringify(history));
    renderHistory();

    lastWinner = finalPerson;
    localStorage.setItem('retro_last_winner', finalPerson);
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
  let el = document.getElementById('autosaved-indicator');
  if (!el) {
    el = document.createElement('div');
    el.id = 'autosaved-indicator';
    el.style.cssText = `
      position: fixed; top: 1rem; right: 1rem;
      background: rgba(35,197,94,0.15);
      border: 1px solid rgba(35,197,94,0.4);
      color: #23c55e; padding: 0.4rem 0.9rem;
      border-radius: 2rem; font-size: 0.8rem; font-weight: 600;
      opacity: 0; transition: opacity 0.3s; pointer-events: none;
      z-index: 9997;
    `;
    el.textContent = '✓ Automatisch opgeslagen';
    document.body.appendChild(el);
  }
  clearTimeout(autoSavedTimer);
  el.style.opacity = '1';
  autoSavedTimer = setTimeout(() => { el.style.opacity = '0'; }, 1800);
}

// ── EXPORT / IMPORT ──────────────────────────────────────────────────

function exportSettings() {
  const data = {
    versie: 1,
    teamleden: names.filter(n => n.trim()),
    snoeplijst: candies.filter(c => c.trim()),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'snoep-generator-instellingen.json';
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

      localStorage.setItem('retro_names',   JSON.stringify(names));
      localStorage.setItem('retro_candies', JSON.stringify(candies));

      showToast(`✅ Geïmporteerd: ${names.length} teamleden, ${candies.length} snoepsoorten`);
      renderLastWinnerBadge();
    } catch {
      showToast('⚠️ Bestand kon niet worden gelezen.');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ── HULPFUNCTIE ─────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── LAATSTE WINNER BADGE ──────────────────────────────────────────────

function renderLastWinnerBadge() {
  let badge = document.getElementById('last-winner-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'last-winner-badge';
    badge.style.cssText = `
      text-align: center; margin-bottom: 1rem;
      font-size: 0.85rem; color: #aaa;
    `;
    const slotMachine = document.querySelector('.slot-machine');
    slotMachine.insertBefore(badge, slotMachine.firstChild);
  }

  if (lastWinner && names.filter(n => n.trim()).length > 1) {
    badge.innerHTML = `
      <span style="
        background: rgba(255,107,53,0.15);
        border: 1px solid rgba(255,107,53,0.4);
        color: #ff6b35; padding: 0.3rem 0.85rem;
        border-radius: 2rem; font-size: 0.8rem;
      ">⏭ <strong>${escHtml(lastWinner)}</strong> doet deze ronde niet mee</span>`;
  } else {
    badge.innerHTML = '';
  }
}

// ── INIT ────────────────────────────────────────────────────────────────

renderHistory();
renderLastWinnerBadge();
