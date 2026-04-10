# Data Model: FoolStack Web Game

**Feature**: 001-foolstack-web-game
**Date**: 2026-04-10

All data is held in server memory (no database). These are JavaScript objects/maps.

---

## Entity: GameSession

Singleton — only one game session exists at a time.

| Field | Type | Description |
|-------|------|-------------|
| phase | string | Current game phase: `"login"`, `"waiting"`, `"prompt"`, `"vote"`, `"score"` |
| gameCode | string | Fixed code players enter to join (set via environment variable) |
| adminCode | string | Fixed code admin enters to control game (set via environment variable) |
| roundNumber | number | Current round (starts at 0, incremented when admin starts a new prompt) |
| players | Map<string, Player> | All registered players, keyed by name |
| admin | Admin \| null | The admin, or null if not yet connected |
| currentRound | Round \| null | Current round data, or null if game hasn't started |

### State Transitions

```
login → waiting    (when player/admin joins)
waiting → prompt   (admin clicks "Start")
prompt → vote      (admin clicks "Begin Vote Phase")
vote → score       (admin clicks "Start Score Phase")
score → prompt     (admin clicks "Start Next Prompt Phase" — new round)
```

### Validation Rules
- `phase` can only advance forward in the sequence above (no skipping, no going backward except score→prompt)
- Only the admin can trigger phase transitions
- Once phase leaves `"waiting"`, no new players can join

---

## Entity: Player

| Field | Type | Description |
|-------|------|-------------|
| name | string | Unique display name (primary key) |
| avatar | string | Single emoji character |
| score | number | Cumulative score across all rounds (starts at 0) |
| connected | boolean | Whether the player currently has an active socket connection |
| socketId | string \| null | Current Socket.IO socket ID (null if disconnected) |

### Validation Rules
- `name` must be unique across all players in the session
- `name` must be non-empty and trimmed
- `avatar` must be a single emoji (default provided if not selected)
- `score` is never negative

---

## Entity: Admin

| Field | Type | Description |
|-------|------|-------------|
| name | string | Admin's display name |
| connected | boolean | Whether the admin has an active socket connection |
| socketId | string \| null | Current Socket.IO socket ID |

### Validation Rules
- Only one admin per game session
- Admin has no avatar, no score

---

## Entity: Round

| Field | Type | Description |
|-------|------|-------------|
| roundNumber | number | Sequential round number (1-based) |
| prompt | string | The prompt text submitted by the admin |
| adminAnswer | string | The admin's "trick" answer |
| answers | Map<string, Answer> | Player answers, keyed by player name |
| votes | Map<string, Vote> | Player votes, keyed by voter's player name |

### Validation Rules
- `prompt` and `adminAnswer` must be non-empty
- A player can submit at most one answer per round
- A player can submit at most one vote per round
- A player who did not submit an answer can still vote
- Answers and votes are only accepted during the correct phase

---

## Entity: Answer

| Field | Type | Description |
|-------|------|-------------|
| authorName | string | Player name (or `"__admin__"` for admin's answer) |
| text | string | The answer text |
| timestamp | number | Unix timestamp of submission (used for FIFO ordering) |

### Validation Rules
- `text` must be non-empty and trimmed
- `authorName` must match a registered player or be `"__admin__"`

---

## Entity: Vote

| Field | Type | Description |
|-------|------|-------------|
| voterName | string | Name of the player who voted |
| selectedAuthorName | string | Name of the answer's author that was selected |
| pointsAwarded | number | Points resulting from this vote (+2 if admin's answer, +1 to answer author) |

### Validation Rules
- `voterName` must be a registered player
- `selectedAuthorName` must be a valid answer author in the current round
- A player cannot vote for their own answer
- `pointsAwarded` is 2 if `selectedAuthorName === "__admin__"`, otherwise 1

---

## Relationships

```
GameSession 1──1 Admin
GameSession 1──* Player
GameSession 1──1 Round (current)

Round 1──* Answer
Round 1──* Vote

Answer *──1 Player (author) OR Admin
Vote *──1 Player (voter)
Vote *──1 Answer (selected)
```

---

## Score Calculation (per round)

For each vote in the round:
1. If the voter selected the admin's answer → voter gets +2 points
2. If the voter selected a player's answer → that player (the answer author) gets +1 point

Scores are accumulated on the `Player.score` field across rounds.
