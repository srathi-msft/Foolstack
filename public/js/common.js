'use strict';

// ── Phase → page mapping ────────────────────────────────────
const PHASE_PAGES = {
  login: '/index.html',
  waiting: '/waiting.html',
  prompt: '/prompt.html',
  vote: '/vote.html',
  score: '/score.html',
};

// ── Auth guard (T033 — hardened) ─────────────────────────────
function checkAuth() {
  const current = window.location.pathname;
  const normalizedCurrent = current === '/' ? '/index.html' : current;
  // Login page never needs auth
  if (normalizedCurrent === '/index.html') return true;
  // For all other pages, check if user logged in via sessionStorage
  if (!sessionStorage.getItem('foolstack_role')) {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

// ── Socket.IO connection ────────────────────────────────────
let _sharedSocket = null;

function connectSocket() {
  if (_sharedSocket) return _sharedSocket;
  _sharedSocket = io();
  return _sharedSocket;
}

// ── Phase guard (T032 — hardened) ────────────────────────────
function initPhaseGuard(expectedPhase) {
  if (!checkAuth()) return null;

  const s = connectSocket();

  s.on('phase-update', (data) => {
    if (!data || !data.phase) return;
    const target = PHASE_PAGES[data.phase];
    if (!target) return;

    const current = window.location.pathname;
    const normalizedCurrent = current === '/' ? '/index.html' : current;

    if (normalizedCurrent !== target) {
      window.location.href = target;
    }
  });

  // Handle auth failures at socket level
  s.on('connect_error', (err) => {
    if (err.message === 'Authentication required') {
      sessionStorage.clear();
      window.location.href = '/index.html';
    }
  });

  return s;
}

// ── Error display helper ────────────────────────────────────
function showError(msg) {
  let el = document.querySelector('.error-msg');
  if (!el) {
    el = document.createElement('div');
    el.className = 'error-msg';
    const container = document.querySelector('.container');
    if (container) container.prepend(el);
    else document.body.prepend(el);
  }
  el.textContent = msg;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 5000);
}

// ── Session info from cookie ────────────────────────────────
function getSessionRole() {
  // The cookie is httpOnly so we can't read it from JS.
  // We'll store role in sessionStorage after login instead.
  return sessionStorage.getItem('foolstack_role') || null;
}

function setSessionRole(role) {
  sessionStorage.setItem('foolstack_role', role);
}

function getSessionName() {
  return sessionStorage.getItem('foolstack_name') || null;
}

function setSessionName(name) {
  sessionStorage.setItem('foolstack_name', name);
}
