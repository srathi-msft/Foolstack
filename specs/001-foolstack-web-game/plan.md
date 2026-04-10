# Implementation Plan: FoolStack Web Game

**Branch**: `001-foolstack-web-game` | **Date**: 2026-04-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-foolstack-web-game/spec.md`

## Summary

FoolStack is a multiplayer browser-based party game where an admin provides prompts, players submit answers, and everyone votes on which answer they think is the admin's "trick" answer. The game uses real-time WebSocket communication for phase transitions and live updates. All state is held in server memory (no database). Hosted on Azure with IaC for spin-up/teardown to minimize cost for short 1–2 hour sessions.

## Technical Context

**Language/Version**: Node.js 20 LTS (JavaScript)
**Primary Dependencies**: Express (HTTP server), Socket.IO (real-time WebSocket communication)
**Storage**: In-memory (no database — all game state lives in server memory and is lost on shutdown)
**Testing**: Manual end-to-end testing of all user flows (per constitution: automated tests only where clear immediate value)
**Target Platform**: Azure App Service (Linux, B1 tier) — deployed via Azure CLI + Bicep IaC
**Project Type**: Web application (single server serving both API and static frontend)
**Performance Goals**: <2s phase transition latency for 20 concurrent players
**Constraints**: <$1 USD per 2-hour session, teardown to zero cost after use
**Scale/Scope**: Up to ~50 concurrent players, 5 pages (login, waiting, prompt, vote, score), single game session

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. MVP First, Always — ✅ PASS
- Single server process serving static files + WebSocket = simplest working architecture.
- No database, no ORM, no separate frontend build pipeline.
- No multi-room, no persistent history, no user accounts.

### II. Code Simplicity & Readability — ✅ PASS
- Plain JavaScript (no TypeScript for MVP), Express + Socket.IO are well-understood.
- Flat file structure, no deep abstractions.
- Vanilla HTML/CSS/JS frontend — no framework.

### III. No Overengineering — ✅ PASS
- No microservices, no message queues, no caching layers.
- No separate frontend framework (React/Vue/Angular).
- No CI/CD pipeline — deploy via CLI commands.
- In-memory state vs. database is the simplest option for ephemeral sessions.

### IV. Testing & Verification — ✅ PASS
- Manual E2E testing of all 5 user flows.
- Automated tests deferred unless clear immediate value emerges.

### V. User Experience (UX) Consistency — ✅ PASS
- 5 simple pages, minimal UI, emoji avatars, clear phase transitions.
- Admin controls are clearly separated buttons.
- Players see only what's relevant to the current phase.

### VI. Performance (Pragmatic, Not Premature) — ✅ PASS
- Socket.IO handles 50 concurrent connections easily on a single server.
- No premature optimization — in-memory state is inherently fast.

### VII. Delivery Standards — ✅ PASS
- App runs locally and on Azure. IaC for deployment + teardown.
- All core requirements implemented before delivery.
- Primary user flow tested manually.

**GATE RESULT**: ✅ ALL PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-foolstack-web-game/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
server/
├── index.js             # Express + Socket.IO entry point
├── game.js              # Game state management (in-memory)
├── package.json         # Node.js dependencies
└── package-lock.json

public/
├── index.html           # Login page
├── waiting.html         # Waiting room
├── prompt.html          # Prompt/answer page
├── vote.html            # Vote page
├── score.html           # Score page
├── css/
│   └── style.css        # Shared styles
└── js/
    ├── common.js         # Shared client utilities (socket connection, phase guard)
    ├── login.js          # Login page logic
    ├── waiting.js        # Waiting room logic
    ├── prompt.js         # Prompt page logic
    ├── vote.js           # Vote page logic
    └── score.js          # Score page logic

infra/
├── main.bicep           # Azure Bicep IaC template
├── main.bicepparam      # Parameters file
├── deploy.ps1           # Deploy script (az CLI)
└── teardown.ps1         # Teardown script (az CLI)
```

**Structure Decision**: Single project — the server serves static files from `public/` and handles WebSocket connections. No separate frontend build step. This is the simplest structure for a real-time web app with no database.

## Complexity Tracking

No constitution violations. No complexity justifications needed.
