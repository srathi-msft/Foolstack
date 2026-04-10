'use strict';

// ── Entities ────────────────────────────────────────────────
// All state lives in memory — lost on server shutdown.

const ADMIN_SENTINEL = '__admin__';

const VALID_PHASES = ['login', 'waiting', 'prompt', 'vote', 'score'];

const PHASE_TRANSITIONS = {
  waiting: 'prompt',
  prompt: 'vote',
  vote: 'score',
  score: 'prompt', // new round
};

// ── GameSession (singleton) ─────────────────────────────────
const session = {
  phase: 'login',
  gameCode: '',
  adminCode: '',
  roundNumber: 0,
  players: new Map(),   // name -> Player
  admin: null,          // Admin | null
  currentRound: null,   // Round | null
};

function initSession(gameCode, adminCode) {
  session.gameCode = gameCode;
  session.adminCode = adminCode;
  session.phase = 'login';
  session.roundNumber = 0;
  session.players.clear();
  session.admin = null;
  session.currentRound = null;
}

// ── Player ──────────────────────────────────────────────────
function createPlayer(name, avatar) {
  return {
    name,
    avatar: avatar || '😀',
    score: 0,
    connected: false,
    socketId: null,
  };
}

function addPlayer(name, avatar) {
  if (session.players.has(name)) return null;
  const player = createPlayer(name, avatar);
  session.players.set(name, player);
  return player;
}

function getPlayer(name) {
  return session.players.get(name) || null;
}

function getConnectedPlayers() {
  const list = [];
  for (const p of session.players.values()) {
    list.push({ name: p.name, avatar: p.avatar, connected: p.connected });
  }
  return list;
}

// ── Admin ───────────────────────────────────────────────────
function setAdmin(name) {
  session.admin = { name, connected: false, socketId: null };
  return session.admin;
}

function getAdmin() {
  return session.admin;
}

// ── Round ───────────────────────────────────────────────────
function createRound() {
  session.roundNumber += 1;
  session.currentRound = {
    roundNumber: session.roundNumber,
    prompt: '',
    adminAnswer: '',
    answers: new Map(),  // playerName -> Answer
    votes: new Map(),    // voterName  -> Vote
  };
  return session.currentRound;
}

function getCurrentRound() {
  return session.currentRound;
}

// ── Answer ──────────────────────────────────────────────────
function addAnswer(authorName, text) {
  const round = session.currentRound;
  if (!round) return null;
  if (round.answers.has(authorName)) return null; // already answered
  const answer = { authorName, text: text.trim(), timestamp: Date.now() };
  round.answers.set(authorName, answer);
  return answer;
}

function getAnswerCount() {
  const round = session.currentRound;
  if (!round) return { answered: 0, total: 0 };
  // Count only player answers (exclude admin sentinel)
  let answered = 0;
  for (const key of round.answers.keys()) {
    if (key !== ADMIN_SENTINEL) answered++;
  }
  return { answered, total: session.players.size };
}

// ── Vote ────────────────────────────────────────────────────
function addVote(voterName, selectedAuthorName) {
  const round = session.currentRound;
  if (!round) return null;
  if (round.votes.has(voterName)) return null; // already voted

  const isAdmin = selectedAuthorName === ADMIN_SENTINEL;
  const points = isAdmin ? 2 : 1;

  const vote = { voterName, selectedAuthorName, pointsAwarded: points };
  round.votes.set(voterName, vote);

  // Award points
  if (isAdmin) {
    // +2 to the voter
    const voter = session.players.get(voterName);
    if (voter) voter.score += 2;
  } else {
    // +1 to the answer author
    const author = session.players.get(selectedAuthorName);
    if (author) author.score += 1;
  }

  return vote;
}

function getVoteCount() {
  const round = session.currentRound;
  if (!round) return { voted: 0, total: 0 };
  return { voted: round.votes.size, total: session.players.size };
}

function hasPlayerAnswered(playerName) {
  const round = session.currentRound;
  return round ? round.answers.has(playerName) : false;
}

function hasPlayerVoted(playerName) {
  const round = session.currentRound;
  return round ? round.votes.has(playerName) : false;
}

// ── Phase transitions ───────────────────────────────────────
function canAdvancePhase(targetPhase) {
  if (targetPhase === 'next-prompt') {
    return session.phase === 'score';
  }
  return PHASE_TRANSITIONS[session.phase] === targetPhase;
}

function advancePhase(targetPhase) {
  if (targetPhase === 'next-prompt') {
    session.phase = 'prompt';
    createRound();
    return 'prompt';
  }
  session.phase = PHASE_TRANSITIONS[session.phase];
  return session.phase;
}

// ── Helpers ─────────────────────────────────────────────────
function isGameStarted() {
  return session.phase !== 'login' && session.phase !== 'waiting';
}

function getPhase() {
  return session.phase;
}

function setPhaseToWaiting() {
  session.phase = 'waiting';
}

module.exports = {
  ADMIN_SENTINEL,
  VALID_PHASES,
  session,
  initSession,
  createPlayer,
  addPlayer,
  getPlayer,
  getConnectedPlayers,
  setAdmin,
  getAdmin,
  createRound,
  getCurrentRound,
  addAnswer,
  getAnswerCount,
  addVote,
  getVoteCount,
  hasPlayerAnswered,
  hasPlayerVoted,
  canAdvancePhase,
  advancePhase,
  isGameStarted,
  getPhase,
  setPhaseToWaiting,
};
