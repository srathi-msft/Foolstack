'use strict';

const socket = initPhaseGuard('vote');
const role = getSessionRole();

const adminVote = document.getElementById('admin-vote');
const playerVote = document.getElementById('player-vote');
const playerVoteWaiting = document.getElementById('player-vote-waiting');

let selectedAnswerId = null;

if (role === 'admin') {
  // ── Admin view ──────────────────────────────────────────
  adminVote.classList.remove('hidden');

  const voteCountMsg = document.getElementById('vote-count-msg');
  socket.on('vote-count', (data) => {
    voteCountMsg.textContent = `${data.voted} of ${data.total} players voted`;
  });

  const startScoreBtn = document.getElementById('start-score-btn');
  startScoreBtn.addEventListener('click', () => {
    socket.emit('admin-advance-phase', { targetPhase: 'score' });
    startScoreBtn.disabled = true;
  });

} else {
  // ── Player view ─────────────────────────────────────────
  socket.on('vote-data', (data) => {
    document.getElementById('vote-prompt-text').textContent = data.prompt;
    const container = document.getElementById('answers-container');
    container.innerHTML = '';

    data.answers.forEach(a => {
      const card = document.createElement('label');
      card.className = 'answer-card';
      card.innerHTML = `<input type="radio" name="vote" value="${escapeAttr(a.id)}"><span>${escapeHtml(a.text)}</span>`;
      card.addEventListener('click', () => {
        container.querySelectorAll('.answer-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedAnswerId = a.id;
        document.getElementById('submit-vote-btn').disabled = false;
      });
      container.appendChild(card);
    });

    playerVote.classList.remove('hidden');
  });

  // If player reconnects and already voted
  socket.on('already-voted', () => {
    playerVote.classList.add('hidden');
    playerVoteWaiting.classList.remove('hidden');
  });

  document.getElementById('submit-vote-btn').addEventListener('click', () => {
    if (!selectedAnswerId) return;
    socket.emit('submit-vote', { answerId: selectedAnswerId });
    playerVote.classList.add('hidden');
    playerVoteWaiting.classList.remove('hidden');
  });
}

socket.on('error', (data) => showError(data.message || 'An error occurred'));

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/[&"'<>]/g, c => ({ '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' }[c]));
}
