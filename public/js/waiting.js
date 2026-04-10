'use strict';

const socket = initPhaseGuard('waiting');

const playerListEl = document.getElementById('player-list');
const playerCountEl = document.getElementById('player-count');
const startBtn = document.getElementById('start-btn');

// Show "Start" button only for admin
const role = getSessionRole();
if (role === 'admin') {
  startBtn.classList.remove('hidden');
}

// ── Player list updates ─────────────────────────────────────
socket.on('player-list', (data) => {
  playerListEl.innerHTML = '';
  data.players.forEach(p => {
    const li = document.createElement('li');
    if (!p.connected) li.classList.add('disconnected');
    li.innerHTML = `<span class="avatar">${p.avatar}</span><span class="name">${escapeHtml(p.name)}</span>`;
    playerListEl.appendChild(li);
  });
  playerCountEl.textContent = `${data.count} player${data.count !== 1 ? 's' : ''} connected`;
});

// ── Admin: Start game ───────────────────────────────────────
startBtn.addEventListener('click', () => {
  socket.emit('admin-advance-phase', { targetPhase: 'prompt' });
  startBtn.disabled = true;
});

// ── Error handling ──────────────────────────────────────────
socket.on('error', (data) => {
  showError(data.message || 'An error occurred');
  startBtn.disabled = false;
});

// ── Utility ─────────────────────────────────────────────────
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
