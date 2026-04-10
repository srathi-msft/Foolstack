# Socket.IO Event Contract: FoolStack Web Game

**Feature**: 001-foolstack-web-game
**Date**: 2026-04-10

FoolStack uses Socket.IO for all real-time communication. This document defines every event emitted and received by client and server.

---

## HTTP Endpoints (Express)

Only two HTTP endpoints exist — everything else is Socket.IO.

### POST /api/login

Authenticates a player or admin.

**Request Body** (JSON):
```json
{
  "name": "string (required, non-empty, trimmed)",
  "code": "string (required)",
  "avatar": "string (optional, single emoji, default: '😀')"
}
```

**Response 200** (JSON):
```json
{
  "ok": true,
  "role": "player" | "admin",
  "name": "string",
  "avatar": "string"
}
```
Sets HTTP-only cookie: `foolstack_session` containing `{ name, role }`.

**Response 400** (JSON):
```json
{
  "ok": false,
  "error": "Invalid game code" | "Name already taken" | "Game already in progress" | "Name is required"
}
```

### GET /* (Static Files)

Express serves all files from `/public/` directory. Pages: `index.html`, `waiting.html`, `prompt.html`, `vote.html`, `score.html`.

---

## Socket.IO Events

### Connection

On connect, the server reads the `foolstack_session` cookie to identify the player/admin. If no valid cookie, the connection is rejected.

---

### Server → Client Events

#### `phase-update`
Sent to all clients when the game phase changes. Also sent on reconnect.

```json
{
  "phase": "login" | "waiting" | "prompt" | "vote" | "score"
}
```

**Client behavior**: Navigate to the corresponding page.

---

#### `player-list`
Sent to all clients when the player list changes (join, disconnect, reconnect).

```json
{
  "players": [
    { "name": "string", "avatar": "string", "connected": true|false }
  ],
  "count": 3
}
```

---

#### `prompt-data`
Sent to all players when the admin submits a prompt (phase transitions to `prompt`).

```json
{
  "prompt": "string",
  "roundNumber": 1
}
```

---

#### `vote-data`
Sent to each player individually when the vote phase starts. The answer list is personalized (excludes the receiving player's own answer).

```json
{
  "prompt": "string",
  "answers": [
    { "id": "string (opaque identifier)", "text": "string" }
  ]
}
```

Notes:
- `id` is an opaque string (not the author name) to prevent cheating
- The admin's answer is placed at a random position in the array
- The player's own answer is excluded
- Order is FIFO by submission timestamp (except for admin's random insertion)

---

#### `score-data`
Sent to each player individually when the score phase starts.

```json
{
  "yourVote": {
    "answerText": "string",
    "authorName": "string",
    "wasAdmin": true|false
  },
  "votesForYourAnswer": 2,
  "pointsThisRound": 3,
  "reveal": [
    {
      "answerText": "string (truncated)",
      "authorName": "string",
      "isAdmin": true|false,
      "voteCount": 2
    }
  ],
  "leaderboard": [
    { "name": "string", "avatar": "string", "score": 10 }
  ]
}
```

Notes:
- `reveal` shows all answers with authors (truncated text for screen space)
- `leaderboard` is top 5 players sorted by score descending
- `votesForYourAnswer` is 0 if the player did not submit an answer this round

---

#### `answer-count`
Sent to admin only, during prompt phase, to show progress.

```json
{
  "answered": 5,
  "total": 10
}
```

---

#### `vote-count`
Sent to admin only, during vote phase, to show progress.

```json
{
  "voted": 8,
  "total": 10
}
```

---

#### `error`
Sent to a single client when an action fails.

```json
{
  "message": "string"
}
```

---

### Client → Server Events

#### `submit-answer`
Player submits their answer during the prompt phase.

```json
{
  "text": "string (required, non-empty)"
}
```

**Server validation**:
- Current phase must be `"prompt"`
- Player must not have already submitted an answer this round
- Text must be non-empty after trimming

**Server response**: Emits `error` event to client on failure. No response on success (client shows waiting message).

---

#### `submit-vote`
Player submits their vote during the vote phase.

```json
{
  "answerId": "string (opaque ID from vote-data)"
}
```

**Server validation**:
- Current phase must be `"vote"`
- Player must not have already voted this round
- `answerId` must be a valid answer ID in the current round
- Player cannot vote for their own answer

**Server response**: Emits `error` event to client on failure. No response on success (client shows waiting message).

---

#### `admin-submit-prompt`
Admin submits a prompt and their answer.

```json
{
  "prompt": "string (required, non-empty)",
  "adminAnswer": "string (required, non-empty)"
}
```

**Server validation**:
- Client must be admin
- Current phase must be `"prompt"` (admin's prompt page, before submitting)

**Server behavior**: Stores prompt + admin answer, broadcasts `prompt-data` to all players.

---

#### `admin-advance-phase`
Admin triggers a phase transition.

```json
{
  "targetPhase": "prompt" | "vote" | "score" | "next-prompt"
}
```

**Server validation**:
- Client must be admin
- Transition must be valid for current phase:
  - `waiting` → `prompt` (via "Start" button)
  - `prompt` → `vote` (via "Begin Vote Phase" button)
  - `vote` → `score` (via "Start Score Phase" button)
  - `score` → `next-prompt` (via "Start Next Prompt Phase" button — creates new round)

**Server behavior**: Updates `gamePhase`, broadcasts `phase-update` to all clients, sends phase-specific data.
