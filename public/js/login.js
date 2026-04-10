'use strict';

const EMOJIS = [
  '😀','😎','🤠','🥳','😈','👻','🤖','🦊','🐱','🐶',
  '🦄','🐸','🎃','🌟','🍕','🎸','🚀','💎','🔥','🎯',
];

const grid = document.getElementById('emoji-grid');
let selectedAvatar = EMOJIS[0];

EMOJIS.forEach(emoji => {
  const span = document.createElement('span');
  span.textContent = emoji;
  if (emoji === selectedAvatar) span.classList.add('selected');
  span.addEventListener('click', () => {
    grid.querySelectorAll('span').forEach(s => s.classList.remove('selected'));
    span.classList.add('selected');
    selectedAvatar = emoji;
  });
  grid.appendChild(span);
});

const form = document.getElementById('login-form');
const errorEl = document.getElementById('error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const code = document.getElementById('code').value.trim();

  if (!name || !code) return;

  const btn = form.querySelector('button');
  btn.disabled = true;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, code, avatar: selectedAvatar }),
    });

    const data = await res.json();

    if (!data.ok) {
      errorEl.textContent = data.error || 'Login failed';
      errorEl.classList.add('visible');
      btn.disabled = false;
      return;
    }

    // Store role + name in sessionStorage (cookie is httpOnly)
    sessionStorage.setItem('foolstack_role', data.role);
    sessionStorage.setItem('foolstack_name', data.name);

    window.location.href = '/waiting.html';
  } catch {
    errorEl.textContent = 'Connection error. Please try again.';
    errorEl.classList.add('visible');
    btn.disabled = false;
  }
});
