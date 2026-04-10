'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cookie = require('cookie');
const crypto = require('crypto');
const game = require('./game');

// ── Environment configuration (T008) ───────────────────────
const PORT = process.env.PORT || 3000;
const GAME_CODE = process.env.GAME_CODE || 'foolstack';
const ADMIN_CODE = process.env.ADMIN_CODE || 'admin123';
const COOKIE_SECRET = process.env.COOKIE_SECRET || crypto.randomBytes(32).toString('hex');

game.initSession(GAME_CODE, ADMIN_CODE);

// ── Express setup (T005) ───────────────────────────────────
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const server = http.createServer(app);

// ── Session helpers ─────────────────────────────────────────
// Simple HMAC-signed JSON cookie (no external session store)
function signValue(val) {
  return val + '.' + crypto.createHmac('sha256', COOKIE_SECRET).update(val).digest('base64url');
}

function unsignValue(signed) {
  if (!signed || typeof signed !== 'string') return null;
  const idx = signed.lastIndexOf('.');
  if (idx < 1) return null;
  const val = signed.slice(0, idx);
  const expected = signValue(val);
  if (signed.length !== expected.length) return null;
  // Timing-safe comparison
  if (!crypto.timingSafeEqual(Buffer.from(signed), Buffer.from(expected))) return null;
  return val;
}

function setSessionCookie(res, data) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signed = signValue(payload);
  res.setHeader('Set-Cookie', cookie.serialize('foolstack_session', signed, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  }));
}

function parseSessionCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const cookies = cookie.parse(cookieHeader);
  const raw = cookies.foolstack_session;
  if (!raw) return null;
  const payload = unsignValue(raw);
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    return null;
  }
}

// ── Stub login route (T005 — validation filled in T013) ────
app.post('/api/login', (req, res) => {
  const { name, code, avatar } = req.body;

  // Basic input validation
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ ok: false, error: 'Name is required' });
  }

  const trimmedName = name.trim();

  // Admin login path (T016 placeholder — filled in Phase 4)
  if (code === ADMIN_CODE) {
    if (game.getAdmin()) {
      return res.status(400).json({ ok: false, error: 'Admin already connected' });
    }
    game.setAdmin(trimmedName);
    if (game.getPhase() === 'login') {
      game.setPhaseToWaiting();
    }
    setSessionCookie(res, { name: trimmedName, role: 'admin' });
    return res.json({ ok: true, role: 'admin', name: trimmedName, avatar: '' });
  }

  // Player login validation (T013 — filled in Phase 3)
  if (code !== GAME_CODE) {
    return res.status(400).json({ ok: false, error: 'Invalid game code' });
  }

  if (game.isGameStarted()) {
    return res.status(400).json({ ok: false, error: 'Game already in progress' });
  }

  if (game.getPlayer(trimmedName)) {
    return res.status(400).json({ ok: false, error: 'Name already taken' });
  }

  const playerAvatar = (avatar && typeof avatar === 'string') ? avatar : '😀';
  game.addPlayer(trimmedName, playerAvatar);

  if (game.getPhase() === 'login') {
    game.setPhaseToWaiting();
  }

  setSessionCookie(res, { name: trimmedName, role: 'player' });
  return res.json({ ok: true, role: 'player', name: trimmedName, avatar: playerAvatar });
});

// ── Socket.IO setup (T006) ─────────────────────────────────
const io = new Server(server);

// Broadcast helpers
function broadcastPlayerList() {
  const players = game.getConnectedPlayers();
  io.emit('player-list', { players, count: players.filter(p => p.connected).length });
}

function broadcastPhaseUpdate() {
  io.emit('phase-update', { phase: game.getPhase() });
}

// Cookie-based authentication on connection
io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie;
  const sessionData = parseSessionCookie(cookieHeader);
  if (!sessionData || !sessionData.name || !sessionData.role) {
    return next(new Error('Authentication required'));
  }
  socket.sessionData = sessionData;
  next();
});

io.on('connection', (socket) => {
  const { name, role } = socket.sessionData;

  if (role === 'admin') {
    const admin = game.getAdmin();
    if (admin) {
      admin.connected = true;
      admin.socketId = socket.id;
    }
  } else {
    const player = game.getPlayer(name);
    if (player) {
      player.connected = true;
      player.socketId = socket.id;
    }
  }

  // Send current phase to the connecting client
  socket.emit('phase-update', { phase: game.getPhase() });
  broadcastPlayerList();

  // On reconnect, restore phase-specific state (T014 — reconnection data)
  const currentPhase = game.getPhase();
  const round = game.getCurrentRound();

  if (role === 'player' && round) {
    if (currentPhase === 'prompt') {
      if (game.hasPlayerAnswered(name)) {
        socket.emit('already-answered', {});
      } else if (round.prompt) {
        socket.emit('prompt-data', { prompt: round.prompt, roundNumber: round.roundNumber });
      }
    }
    if (currentPhase === 'vote') {
      if (game.hasPlayerVoted(name)) {
        socket.emit('already-voted', {});
      } else {
        sendVoteDataToPlayer(name);
      }
    }
    if (currentPhase === 'score') {
      sendScoreDataToSocket(socket, buildPlayerScoreData(round, name));
    }
  }

  if (role === 'admin' && round) {
    if (currentPhase === 'prompt') {
      socket.emit('answer-count', game.getAnswerCount());
    }
    if (currentPhase === 'vote') {
      socket.emit('vote-count', game.getVoteCount());
    }
    if (currentPhase === 'score') {
      const { reveal, leaderboard } = buildScoreData(round);
      sendScoreDataToSocket(socket, {
        yourVote: null,
        votesForYourAnswer: 0,
        pointsThisRound: 0,
        reveal,
        leaderboard,
      });
    }
  }

  // ── admin-submit-prompt (T019) ────────────────────────────
  socket.on('admin-submit-prompt', (data) => {
    if (role !== 'admin') return socket.emit('error', { message: 'Not authorized' });
    if (game.getPhase() !== 'prompt') return socket.emit('error', { message: 'Wrong phase' });

    const prompt = data && data.prompt && data.prompt.trim();
    const adminAnswer = data && data.adminAnswer && data.adminAnswer.trim();
    if (!prompt || !adminAnswer) {
      return socket.emit('error', { message: 'Prompt and answer are required' });
    }

    const round = game.getCurrentRound();
    round.prompt = prompt;
    round.adminAnswer = adminAnswer;

    // Store admin answer as an Answer entity
    game.addAnswer(game.ADMIN_SENTINEL, adminAnswer);

    // Broadcast prompt to all players
    io.emit('prompt-data', { prompt, roundNumber: round.roundNumber });
  });

  // ── admin-advance-phase (T018) ────────────────────────────
  socket.on('admin-advance-phase', (data) => {
    if (role !== 'admin') return socket.emit('error', { message: 'Not authorized' });

    const targetPhase = data && data.targetPhase;
    if (!game.canAdvancePhase(targetPhase)) {
      return socket.emit('error', { message: 'Invalid phase transition' });
    }

    if (targetPhase === 'prompt' && game.getPhase() === 'waiting') {
      // Start game: create first round
      game.advancePhase(targetPhase);
      game.createRound();
    } else if (targetPhase === 'vote') {
      // Transition to vote: prepare vote data for each player (T026)
      game.advancePhase(targetPhase);
      sendVoteDataToPlayers();
    } else if (targetPhase === 'score') {
      // Transition to score: prepare score data for each player (T029)
      game.advancePhase(targetPhase);
      sendScoreDataToAll();
    } else if (targetPhase === 'next-prompt') {
      game.advancePhase(targetPhase);
    } else {
      game.advancePhase(targetPhase);
    }

    broadcastPhaseUpdate();
  });

  // ── submit-answer (T024) ──────────────────────────────────
  socket.on('submit-answer', (data) => {
    if (role !== 'player') return socket.emit('error', { message: 'Not authorized' });
    if (game.getPhase() !== 'prompt') return socket.emit('error', { message: 'Wrong phase' });

    const text = data && data.text && data.text.trim();
    if (!text) return socket.emit('error', { message: 'Answer cannot be empty' });

    if (game.hasPlayerAnswered(name)) {
      return socket.emit('error', { message: 'Already answered' });
    }

    game.addAnswer(name, text);

    // Emit answer-count to admin
    const admin = game.getAdmin();
    if (admin && admin.socketId) {
      io.to(admin.socketId).emit('answer-count', game.getAnswerCount());
    }
  });

  // ── submit-vote (T028) ────────────────────────────────────
  socket.on('submit-vote', (data) => {
    if (role !== 'player') return socket.emit('error', { message: 'Not authorized' });
    if (game.getPhase() !== 'vote') return socket.emit('error', { message: 'Wrong phase' });

    if (game.hasPlayerVoted(name)) {
      return socket.emit('error', { message: 'Already voted' });
    }

    const answerId = data && data.answerId;
    if (!answerId) return socket.emit('error', { message: 'No answer selected' });

    // Resolve opaque ID -> author name (stored in socket's voteMap)
    const authorName = socket.voteMap && socket.voteMap.get(answerId);
    if (!authorName) return socket.emit('error', { message: 'Invalid answer selection' });

    // Cannot vote for own answer
    if (authorName === name) return socket.emit('error', { message: 'Cannot vote for your own answer' });

    game.addVote(name, authorName);

    // Emit vote-count to admin
    const admin = game.getAdmin();
    if (admin && admin.socketId) {
      io.to(admin.socketId).emit('vote-count', game.getVoteCount());
    }
  });

  // ── disconnect (T015) ─────────────────────────────────────
  socket.on('disconnect', () => {
    if (role === 'admin') {
      const admin = game.getAdmin();
      if (admin) {
        admin.connected = false;
        admin.socketId = null;
      }
    } else {
      const player = game.getPlayer(name);
      if (player) {
        player.connected = false;
        player.socketId = null;
      }
    }
    broadcastPlayerList();
  });
});

// ── Vote-data preparation (T026) ────────────────────────────
function buildVoteAnswersForPlayer(round, playerName) {
  // Build ordered answer list (FIFO by timestamp)
  const allAnswers = [];
  for (const [authorName, answer] of round.answers) {
    allAnswers.push({ authorName, text: answer.text, timestamp: answer.timestamp });
  }

  // Sort FIFO (admin answer excluded from sort — inserted at random position)
  const playerAnswers = allAnswers.filter(a => a.authorName !== game.ADMIN_SENTINEL);
  const adminAnswerEntry = allAnswers.find(a => a.authorName === game.ADMIN_SENTINEL);

  playerAnswers.sort((a, b) => a.timestamp - b.timestamp);

  // Exclude the player's own answer
  const filtered = playerAnswers.filter(a => a.authorName !== playerName);

  // Insert admin answer at random position
  const withAdmin = [...filtered];
  if (adminAnswerEntry) {
    const randIdx = Math.floor(Math.random() * (withAdmin.length + 1));
    withAdmin.splice(randIdx, 0, adminAnswerEntry);
  }

  // Generate opaque IDs and build a mapping
  const voteMap = new Map();
  const answers = withAdmin.map(a => {
    const id = crypto.randomBytes(8).toString('hex');
    voteMap.set(id, a.authorName);
    return { id, text: a.text };
  });

  return { answers, voteMap };
}

function sendVoteDataToPlayer(playerName) {
  const round = game.getCurrentRound();
  if (!round) return;

  const player = game.getPlayer(playerName);
  if (!player || !player.connected || !player.socketId) return;

  const { answers, voteMap } = buildVoteAnswersForPlayer(round, playerName);

  const playerSocket = io.sockets.sockets.get(player.socketId);
  if (playerSocket) {
    playerSocket.voteMap = voteMap;
    playerSocket.emit('vote-data', { prompt: round.prompt, answers });
  }
}

function sendVoteDataToPlayers() {
  const round = game.getCurrentRound();
  if (!round) return;

  for (const [playerName, player] of game.session.players) {
    if (!player.connected || !player.socketId) continue;

    const { answers, voteMap } = buildVoteAnswersForPlayer(round, playerName);

    const playerSocket = io.sockets.sockets.get(player.socketId);
    if (playerSocket) {
      playerSocket.voteMap = voteMap;
      playerSocket.emit('vote-data', { prompt: round.prompt, answers });
    }
  }
}

// ── Score-data preparation (T029 + T031) ────────────────────
function buildScoreData(round) {
  // Build reveal list
  const reveal = [];
  for (const [authorName, answer] of round.answers) {
    let voteCount = 0;
    for (const vote of round.votes.values()) {
      if (vote.selectedAuthorName === authorName) voteCount++;
    }
    reveal.push({
      answerText: answer.text.length > 80 ? answer.text.slice(0, 80) + '…' : answer.text,
      authorName: authorName === game.ADMIN_SENTINEL ? '🎭 Admin' : authorName,
      isAdmin: authorName === game.ADMIN_SENTINEL,
      voteCount,
    });
  }

  // Build leaderboard (top 5)
  const leaderboard = [...game.session.players.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(p => ({ name: p.name, avatar: p.avatar, score: p.score }));

  return { reveal, leaderboard };
}

function buildPlayerScoreData(round, playerName) {
  const { reveal, leaderboard } = buildScoreData(round);

  const vote = round.votes.get(playerName);
  let yourVote = null;
  if (vote) {
    const votedAnswer = round.answers.get(vote.selectedAuthorName);
    yourVote = {
      answerText: votedAnswer ? votedAnswer.text : '',
      authorName: vote.selectedAuthorName === game.ADMIN_SENTINEL ? '🎭 Admin' : vote.selectedAuthorName,
      wasAdmin: vote.selectedAuthorName === game.ADMIN_SENTINEL,
    };
  }

  let votesForYourAnswer = 0;
  if (round.answers.has(playerName)) {
    for (const v of round.votes.values()) {
      if (v.selectedAuthorName === playerName) votesForYourAnswer++;
    }
  }

  const pointsThisRound = vote ? vote.pointsAwarded : 0;

  return { yourVote, votesForYourAnswer, pointsThisRound, reveal, leaderboard };
}

function sendScoreDataToSocket(targetSocket, scoreData) {
  targetSocket.emit('score-data', scoreData);
}

function sendScoreDataToAll() {
  const round = game.getCurrentRound();
  if (!round) return;

  for (const [playerName, player] of game.session.players) {
    if (!player.connected || !player.socketId) continue;
    const playerSocket = io.sockets.sockets.get(player.socketId);
    if (playerSocket) {
      sendScoreDataToSocket(playerSocket, buildPlayerScoreData(round, playerName));
    }
  }

  // Send to admin (T031)
  const admin = game.getAdmin();
  if (admin && admin.connected && admin.socketId) {
    const { reveal, leaderboard } = buildScoreData(round);
    const adminSocket = io.sockets.sockets.get(admin.socketId);
    if (adminSocket) {
      sendScoreDataToSocket(adminSocket, {
        yourVote: null,
        votesForYourAnswer: 0,
        pointsThisRound: 0,
        reveal,
        leaderboard,
      });
    }
  }
}

// ── Start server ────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`FoolStack server running on http://localhost:${PORT}`);
  console.log(`Game code: ${GAME_CODE} | Admin code: ${ADMIN_CODE}`);
});
