'use strict';

const socket = initPhaseGuard('score');
const role = getSessionRole();

const yourVoteInfo = document.getElementById('your-vote-info');
const pointsInfo = document.getElementById('points-info');
const revealList = document.getElementById('reveal-list');
const leaderboardBody = document.getElementById('leaderboard-body');
const nextRoundBtn = document.getElementById('next-round-btn');

if (role === 'admin') {
  nextRoundBtn.classList.remove('hidden');
  nextRoundBtn.addEventListener('click', () => {
    socket.emit('admin-advance-phase', { targetPhase: 'next-prompt' });
    nextRoundBtn.disabled = true;
  });
}

socket.on('score-data', (data) => {
  // Your vote (players only)
  if (data.yourVote) {
    yourVoteInfo.classList.remove('hidden');
    const adminBadge = data.yourVote.wasAdmin ? ' <strong>(Admin\'s answer! +2)</strong>' : '';
    yourVoteInfo.innerHTML = `You voted for: "<em>${escapeHtml(data.yourVote.answerText)}</em>" by ${escapeHtml(data.yourVote.authorName)}${adminBadge}`;
  }

  // Points this round
  if (role !== 'admin') {
    pointsInfo.classList.remove('hidden');
    pointsInfo.innerHTML = `<strong>+${data.pointsThisRound}</strong> points this round &nbsp;|&nbsp; <strong>${data.votesForYourAnswer}</strong> vote${data.votesForYourAnswer !== 1 ? 's' : ''} for your answer`;
  }

  // Reveal all answers
  revealList.innerHTML = '';
  data.reveal.forEach(r => {
    const li = document.createElement('li');
    if (r.isAdmin) li.classList.add('admin-answer');
    li.innerHTML = `
      <span>${escapeHtml(r.answerText)} — <em>${escapeHtml(r.authorName)}</em>${r.isAdmin ? ' 🎭' : ''}</span>
      <span class="votes-badge">${r.voteCount} vote${r.voteCount !== 1 ? 's' : ''}</span>
    `;
    revealList.appendChild(li);
  });

  // Leaderboard
  leaderboardBody.innerHTML = '';
  data.leaderboard.forEach((p, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i + 1}</td><td>${p.avatar} ${escapeHtml(p.name)}</td><td>${p.score}</td>`;
    leaderboardBody.appendChild(tr);
  });
});

socket.on('error', (data) => showError(data.message || 'An error occurred'));

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
