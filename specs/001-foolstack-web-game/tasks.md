# Tasks: FoolStack Web Game

**Input**: Design documents from `/specs/001-foolstack-web-game/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No automated tests requested. Manual E2E testing per constitution Principle IV.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Server**: `server/` (Node.js backend — Express + Socket.IO)
- **Frontend**: `public/` (Vanilla HTML/CSS/JS — served as static files)
- **Infrastructure**: `infra/` (Azure Bicep IaC + deployment scripts)

---

## Phase 1: Setup

**Purpose**: Project initialization, dependency installation, and directory structure

- [x] T001 Create project directory structure per plan.md: `server/`, `public/`, `public/css/`, `public/js/`, `infra/`
- [x] T002 Initialize Node.js project with Express and Socket.IO dependencies in server/package.json
- [x] T003 [P] Create shared CSS file with minimal clean styles, emoji avatar defaults, and mobile-friendly layout in public/css/style.css

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core server infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement in-memory game state module (GameSession, Player, Admin, Round, Answer, Vote entities from data-model.md) in server/game.js
- [x] T005 Implement Express server entry point with static file serving from `public/`, HTTP-only session cookie middleware, dotenv loading, and stub `POST /api/login` route (empty handler — login validation logic is deferred to T013) per contracts/socket-events.md in server/index.js
- [x] T006 Integrate Socket.IO into Express server with cookie-based authentication on connection, phase-update broadcast on connect, and player-list broadcast helpers in server/index.js
- [x] T007 [P] Create shared client-side utilities: Socket.IO client connection, initial phase-guard scaffold (check current phase on page load, redirect if wrong page — hardened in T032 after all phases exist), and error display helper in public/js/common.js
- [x] T008 Create environment configuration loading for GAME_CODE, ADMIN_CODE, and PORT from environment variables (with .env support via dotenv) in server/index.js

**Checkpoint**: Server starts, serves static files, accepts Socket.IO connections, and manages in-memory game state. Phase guard redirects work on all client pages.

---

## Phase 3: User Story 1 — Player Joins and Enters Waiting Room (Priority: P1) 🎯 MVP

**Goal**: Players can open the game URL, enter name + game code, pick an emoji avatar, and land in a live waiting room showing all connected players.

**Independent Test**: Open two browser tabs, log in as two different players, confirm both appear in the waiting room with avatars and a live player count.

### Implementation for User Story 1

- [x] T009 [P] [US1] Create login page HTML with name input, code input, emoji avatar picker (grid of ~20 common emojis), and join button in public/index.html
- [x] T010 [P] [US1] Create login page client logic: form submission via fetch POST to `/api/login`, error display for invalid code/duplicate name, redirect to waiting room on success in public/js/login.js
- [x] T011 [P] [US1] Create waiting room page HTML with player list container (name + avatar per player), live participant count, and layout for admin "Start" button (hidden for players) in public/waiting.html
- [x] T012 [US1] Create waiting room client logic: connect Socket.IO, listen for `player-list` events to render player list and count, include phase guard from common.js in public/js/waiting.js
- [x] T013 [US1] Implement login validation logic in the stubbed `POST /api/login` route (created in T005): validate game code, check duplicate names, register player in game state, set session cookie, reject if game already started (FR-015) in server/index.js
- [x] T014 [US1] Implement server-side Socket.IO `connection` event: read session cookie, look up player, mark as connected, broadcast updated `player-list` to all clients, send `phase-update` to the connecting client. On reconnect, restore phase-specific state (e.g., if player already submitted an answer or vote this round, send appropriate waiting status instead of re-prompting) in server/index.js
- [x] T015 [US1] Implement server-side Socket.IO `disconnect` event: mark player as disconnected (keep in registry for reconnect), broadcast updated `player-list` in server/index.js

**Checkpoint**: Players can join, see each other in the waiting room, and reconnect after disconnect. Login rejects bad codes and duplicate names.

---

## Phase 4: User Story 2 — Admin Controls Game Flow (Priority: P1) 🎯 MVP

**Goal**: Admin can log in, see the waiting room, and control all phase transitions (Start → prompt → vote → score → next prompt). Phase changes are broadcast to all connected players in real time.

**Independent Test**: Log in as admin + 1 player. Step through all phase transitions via admin buttons. Confirm the player's browser navigates to the correct page at each step.

### Implementation for User Story 2

- [x] T016 [US2] Implement admin login path in POST `/api/login`: validate admin code, register admin in game state (no avatar, no score), set session cookie with admin role in server/index.js
- [x] T017 [US2] Add admin "Start" button visibility logic in waiting room: show button only if session cookie has admin role in public/js/waiting.js
- [x] T018 [US2] Implement server-side `admin-advance-phase` Socket.IO event handler: validate admin role, validate phase transitions (waiting→prompt, prompt→vote, vote→score, score→next-prompt), update game state, broadcast `phase-update` to all clients in server/index.js
- [x] T019 [US2] Implement server-side `admin-submit-prompt` Socket.IO event handler: validate admin role and prompt phase, store prompt + admin answer in current Round, broadcast `prompt-data` to all players in server/index.js
- [x] T020 [P] [US2] Create admin prompt page view: show prompt + answer text inputs and submit button; after submission show "Begin Vote Phase" button in public/prompt.html and public/js/prompt.js (admin-specific UI branch)
- [x] T021 [P] [US2] Create admin vote page view: show answered-count (`answer-count` event), and "Start Score Phase" button in public/vote.html and public/js/vote.js (admin-specific UI branch)
- [x] T022 [US2] Implement new round creation on score→prompt transition: increment round number, create fresh Round object, clear per-round player data, broadcast `phase-update` in server/index.js

**Checkpoint**: Full admin game loop works. Admin can cycle through all phases. Players are pushed to the correct page at each transition.

---

## Phase 5: User Story 3 — Player Answers a Prompt (Priority: P2)

**Goal**: After admin submits a prompt, players see the prompt and can type + submit an answer. After submission they see a waiting message until the admin advances to voting.

**Independent Test**: Admin submits a prompt, player sees it, types an answer, submits, and sees "Waiting for others to answer". Admin sees the answer count update.

### Implementation for User Story 3

- [x] T023 [US3] Create player prompt page view: display prompt text (from `prompt-data` event), text input for answer, submit button; on submit show "Waiting for others to answer" in public/prompt.html and public/js/prompt.js (player-specific UI branch)
- [x] T024 [US3] Implement server-side `submit-answer` Socket.IO event handler: validate prompt phase, validate player hasn't already answered, store Answer in current Round, emit `answer-count` to admin in server/index.js
- [x] T025 [US3] Handle late/skipped answers: when admin triggers vote phase, players who haven't answered are skipped — they proceed to vote page with no answer in the pool (server-side logic in phase transition handler) in server/index.js

**Checkpoint**: Players can answer prompts. Non-answering players are gracefully skipped. Admin sees live answer count.

---

## Phase 6: User Story 4 — Player Votes on Answers (Priority: P2)

**Goal**: During the vote phase, each player sees all answers anonymously (excluding their own), with the admin's answer at a random position. Players select and submit a vote. Scoring is calculated: +2 for selecting admin's answer, +1 to the answer author for player answers.

**Independent Test**: Admin submits a prompt, 3 players answer, admin starts vote phase. Each player sees answers (minus their own) + admin answer at random position. After voting, scores are correctly calculated.

### Implementation for User Story 4

- [x] T026 [US4] Implement server-side vote-data preparation: on vote phase start, for each player build a personalized answer list (exclude own answer, insert admin answer at random position, use opaque IDs), emit `vote-data` to each player individually in server/index.js
- [x] T027 [US4] Create player vote page view: display prompt text, render list of anonymous answers as selectable radio buttons/cards, submit vote button; on submit show "Waiting for others to vote" in public/vote.html and public/js/vote.js (player-specific UI branch)
- [x] T028 [US4] Implement server-side `submit-vote` Socket.IO event handler: validate vote phase, validate player hasn't voted, resolve opaque answer ID to author, calculate points (+2 admin / +1 player), store Vote in current Round, update player scores, emit `vote-count` to admin in server/index.js

**Checkpoint**: Full voting flow works. Scores are calculated correctly. Admin sees vote count progress.

---

## Phase 7: User Story 5 — Player Views Scores and Proceeds to Next Round (Priority: P3)

**Goal**: After admin triggers score phase, each player sees: which answer they voted for, how many people voted for their answer, a full reveal of all answers with authors (truncated), the admin's answer highlighted, and a top-5 leaderboard. Admin can start the next round.

**Independent Test**: Complete a full round (prompt → answer → vote → score). Verify score page data is correct. Start next round and confirm scores carry over.

### Implementation for User Story 5

- [x] T029 [US5] Implement server-side score-data preparation: on score phase start, for each player compute `yourVote`, `votesForYourAnswer`, `pointsThisRound`, `reveal` (all answers with authors, truncated text, vote counts, admin flag), `leaderboard` (top 5 by cumulative score), emit `score-data` to each player individually in server/index.js
- [x] T030 [US5] Create score page HTML and client logic: display your vote info, votes for your answer, reveal section with truncated answers + authors + admin highlight, leaderboard table; admin sees "Start Next Prompt Phase" button in public/score.html and public/js/score.js
- [x] T031 [US5] Emit `score-data` to admin as well (same leaderboard + reveal view, no personal vote info) in server/index.js

**Checkpoint**: Full game loop is complete. Multiple rounds work with cumulative scoring.

---

## Phase 8: User Story 6 — Secure Phase Navigation (Priority: P2)

**Goal**: Players cannot cheat by navigating to a URL for a different phase. Server-side phase gating ensures only the current phase is accessible. Unauthenticated users are redirected to login.

**Independent Test**: While in waiting room, manually navigate to `/vote.html`. Confirm redirect back to waiting room. Try accessing `/prompt.html` without logging in. Confirm redirect to login.

### Implementation for User Story 6

- [x] T032 [US6] Harden phase guard in public/js/common.js (scaffold created in T007): validate all phase→page mappings now that US1–US5 pages exist, ensure `phase-update` listener covers every page, and redirect on mismatch
- [x] T033 [US6] Implement auth guard in public/js/common.js: check if session cookie exists before allowing any game page access, redirect to `/index.html` (login) if no cookie
- [x] T034 [US6] Implement server-side event rejection: all Socket.IO event handlers (`submit-answer`, `submit-vote`, `admin-submit-prompt`, `admin-advance-phase`) MUST validate that the current game phase matches the expected phase for that event, emit `error` event on mismatch in server/index.js

**Checkpoint**: URL manipulation is blocked. All phase transitions are server-authoritative.

---

## Phase 9: User Story 7 — Cost-Effective Azure Hosting with IaC (Priority: P3)

**Goal**: Provide Azure Bicep IaC template and deployment/teardown scripts. App Service B1 Linux hosting, zip deployment of Node.js app, complete teardown via resource group deletion.

**Independent Test**: Run `deploy.ps1`, verify app is accessible at the printed URL, play a round, run `teardown.ps1`, confirm resource group is deleted.

### Implementation for User Story 7

- [x] T035 [P] [US7] Create Azure Bicep template for App Service Plan (B1 Linux) and Web App (Node.js 20 LTS) with WebSocket enabled, GAME_CODE and ADMIN_CODE as app settings in infra/main.bicep
- [x] T036 [P] [US7] Create Bicep parameters file with configurable resource group name, location, app name, game code, and admin code in infra/main.bicepparam
- [x] T037 [US7] Create deploy.ps1 PowerShell script: accept parameters (ResourceGroup, Location, GameCode, AdminCode), create resource group, run Bicep deployment, zip and deploy Node.js app via `az webapp deployment source config-zip`, print public URL in infra/deploy.ps1
- [x] T038 [US7] Create teardown.ps1 PowerShell script: accept ResourceGroup parameter, run `az group delete --yes`, confirm deletion in infra/teardown.ps1

**Checkpoint**: Full deploy→play→teardown cycle works. Costs stay under $1 for a 2-hour session.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [x] T039 Add .gitignore for node_modules/, .env, *.zip at repository root
- [x] T040 Validate full game flow end-to-end per quickstart.md (local): admin + 2 players, complete 2 rounds, verify cumulative scores
- [x] T041 [P] Add error handling for common edge cases: admin disconnect (pause), player disconnect/reconnect, duplicate vote/answer attempts with user-friendly error messages in server/index.js
- [x] T042 [P] Add mobile-friendly responsive adjustments to public/css/style.css (functional on mobile, not pixel-perfect)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2
- **US2 (Phase 4)**: Depends on Phase 2 + Phase 3 (needs login + waiting room)
- **US3 (Phase 5)**: Depends on Phase 4 (needs admin prompt flow)
- **US4 (Phase 6)**: Depends on Phase 5 (needs answers submitted)
- **US5 (Phase 7)**: Depends on Phase 6 (needs votes calculated)
- **US6 (Phase 8)**: Can start after Phase 2 (phase guard is independent), but T032–T033 should be validated after US1–US5 are complete
- **US7 (Phase 9)**: Can start after Phase 2 (IaC is independent of game logic), T035–T036 can be done in parallel with US1–US5
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup)
  └── Phase 2 (Foundational)
        ├── Phase 3 (US1: Login + Waiting Room)
        │     └── Phase 4 (US2: Admin Controls)
        │           └── Phase 5 (US3: Player Answers)
        │                 └── Phase 6 (US4: Player Votes)
        │                       └── Phase 7 (US5: Scores + Next Round)
        ├── Phase 8 (US6: Phase Guard — can start early, validate late)
        └── Phase 9 (US7: Azure IaC — fully independent)
              └── Phase 10 (Polish)
```

### Within Each User Story

- Server-side logic before client-side UI
- Data model operations before event handlers
- Event handlers before page rendering
- Core flow before edge cases

### Parallel Opportunities

- T003, T007: CSS and common.js can be done in parallel during setup/foundational
- T009, T010, T011: Login page HTML/JS and waiting room HTML can be done in parallel
- T020, T021: Admin prompt view and admin vote view can be done in parallel
- T035, T036: Bicep template and parameters file can be done in parallel with any phase
- T041, T042: Edge case handling and mobile CSS can be done in parallel during polish

---

## Parallel Example: User Story 1

```
         T009 (login HTML)
        /
T008 ──── T010 (login JS)    ──── T013 (server login) ──── T014 (server connect) ──── T015 (server disconnect)
        \
         T011 (waiting HTML) ──── T012 (waiting JS)
```

---

## Implementation Strategy

### MVP Scope
User Stories 1 + 2 (Phases 3–4) = **working game shell** where admin can control phases and players can join/see the waiting room.

### Incremental Delivery
1. **Increment 1** (Phases 1–4): Server starts, players join, admin controls phases → **demo-ready**
2. **Increment 2** (Phases 5–6): Players answer prompts and vote → **playable game**
3. **Increment 3** (Phase 7): Score display + multi-round → **complete game loop**
4. **Increment 4** (Phases 8–9): Phase security + Azure deployment → **production-ready**
5. **Increment 5** (Phase 10): Polish → **ship it**
