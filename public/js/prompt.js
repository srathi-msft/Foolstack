'use strict';

const socket = initPhaseGuard('prompt');
const role = getSessionRole();

const adminPromptForm = document.getElementById('admin-prompt-form');
const adminWaiting = document.getElementById('admin-waiting');
const playerPrompt = document.getElementById('player-prompt');
const playerWaiting = document.getElementById('player-waiting');

if (role === 'admin') {
  // ── Admin view ──────────────────────────────────────────
  adminPromptForm.classList.remove('hidden');

  const submitPromptBtn = document.getElementById('submit-prompt-btn');
  const promptInput = document.getElementById('prompt-input');
  const adminAnswerInput = document.getElementById('admin-answer-input');

  submitPromptBtn.addEventListener('click', () => {
    const prompt = promptInput.value.trim();
    const adminAnswer = adminAnswerInput.value.trim();
    if (!prompt || !adminAnswer) return;

    socket.emit('admin-submit-prompt', { prompt, adminAnswer });
    adminPromptForm.classList.add('hidden');
    adminWaiting.classList.remove('hidden');
  });

  // Answer count updates
  const answerCountMsg = document.getElementById('answer-count-msg');
  socket.on('answer-count', (data) => {
    answerCountMsg.textContent = `${data.answered} of ${data.total} players answered`;
  });

  // Begin vote phase
  const beginVoteBtn = document.getElementById('begin-vote-btn');
  beginVoteBtn.addEventListener('click', () => {
    socket.emit('admin-advance-phase', { targetPhase: 'vote' });
    beginVoteBtn.disabled = true;
  });

} else {
  // ── Player view ─────────────────────────────────────────
  socket.on('prompt-data', (data) => {
    document.getElementById('prompt-text').textContent = data.prompt;
    playerPrompt.classList.remove('hidden');
  });

  // If player reconnects and already answered
  socket.on('already-answered', () => {
    playerPrompt.classList.add('hidden');
    playerWaiting.classList.remove('hidden');
  });

  const submitAnswerBtn = document.getElementById('submit-answer-btn');
  const answerInput = document.getElementById('answer-input');

  submitAnswerBtn.addEventListener('click', () => {
    const text = answerInput.value.trim();
    if (!text) return;

    socket.emit('submit-answer', { text });
    playerPrompt.classList.add('hidden');
    playerWaiting.classList.remove('hidden');
  });
}

socket.on('error', (data) => showError(data.message || 'An error occurred'));
