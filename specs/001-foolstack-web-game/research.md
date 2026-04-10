# Research: FoolStack Web Game

**Feature**: 001-foolstack-web-game
**Date**: 2026-04-10

## Research Task 1: Azure Hosting for Ephemeral Real-Time Game

### Decision: Azure App Service (B1 Linux tier)

### Rationale
- **Cost**: ~$0.04–0.08 per 2-hour session (cheapest viable option, well under $1 target)
- **WebSocket**: Native support — no special configuration needed for Socket.IO
- **Deployment**: Single Bicep template, no Docker image required. Deploy Node.js code directly via zip deployment
- **Teardown**: One CLI command (`az group delete`) removes everything, zero ongoing cost
- **Capacity**: B1 tier handles 50 concurrent WebSocket connections easily on a single instance

### Alternatives Considered

| Option | Cost (2hr) | WebSocket | Rejected Because |
|--------|-----------|-----------|------------------|
| Azure Container Instances | $0.10–0.15 | ✅ | Requires Docker image build step — adds complexity for no benefit |
| Azure Container Apps | $0.15–0.30 | ✅ | Overkill — designed for continuous workloads, higher minimum cost |
| Azure Functions | $0.002 | ⚠️ Limited | Not designed for persistent WebSocket connections; execution timeout issues |
| Azure VM (B1s) | $0.40–0.50 | ✅ | Higher cost, self-managed OS, slower cold start, more complex teardown |
| App Service Free Tier | $0 | ✅ | Shared resources, 60-min timeout may interrupt game sessions |

---

## Research Task 2: Real-Time Communication Framework

### Decision: Socket.IO on Node.js with Express

### Rationale
- Socket.IO handles WebSocket connections with automatic fallback to long-polling
- Built-in reconnection support maps directly to FR-016 (player reconnection)
- Room/namespace support enables clean separation of game events
- Express serves static frontend files from the same process — no separate server needed
- Massive ecosystem, well-documented, simple API

### Alternatives Considered

| Option | Rejected Because |
|--------|------------------|
| Raw WebSocket (ws library) | No auto-reconnect, no fallback, more boilerplate code |
| Azure SignalR Service | External dependency, adds cost, overengineered for single-server MVP |
| Server-Sent Events (SSE) | One-directional (server→client only), would need separate POST endpoints for client→server |
| Azure Web PubSub | External dependency, adds cost and complexity, overkill for <50 users |

---

## Research Task 3: Frontend Approach

### Decision: Vanilla HTML/CSS/JavaScript (no framework)

### Rationale
- 5 simple pages with minimal interactivity — a framework adds no value
- No build step required (no webpack, vite, etc.)
- Directly served as static files from Express
- Constitution Principle III explicitly prohibits frameworks unless justified by current needs
- Emoji avatars are native Unicode — no icon library needed

### Alternatives Considered

| Option | Rejected Because |
|--------|------------------|
| React/Vue/Angular | Massive overhead for 5 simple pages, requires build pipeline |
| Svelte | Still requires build step, adds dependency |
| HTMX | Interesting but Socket.IO already handles real-time updates |

---

## Research Task 4: Server-Side Phase Gating (Anti-Cheat)

### Decision: Server-side state machine + Socket.IO event filtering

### Rationale
- Game phase is authoritative on the server — clients cannot advance themselves
- All page content is delivered via Socket.IO events, not via URL routing
- Client pages check current phase on load via socket and redirect if mismatched
- Server rejects out-of-phase submissions (e.g., submitting an answer during vote phase)
- No JWT or session tokens needed — player identity is tracked by socket connection + name

### Implementation Pattern
1. Server maintains a single `gamePhase` variable: `login | waiting | prompt | vote | score`
2. When a client connects/navigates, the server sends the current phase
3. Client-side `common.js` checks the phase and redirects to the correct page if needed
4. Server rejects any socket events that don't match the current phase

---

## Research Task 5: Player Identity & Reconnection

### Decision: Server-side player registry keyed by name + simple session cookie

### Rationale
- Player names are unique per session (FR-003)
- On connect, the client sends the player's name; the server matches it to the in-memory player record
- A simple HTTP-only cookie stores the player name for reconnection
- If a player disconnects and reconnects, the cookie identifies them and the server restores their state
- No need for JWT, OAuth, or external auth — the game code itself is the "password"

### Implementation Pattern
1. Login submits name + code via HTTP POST → server validates and sets `playerName` cookie
2. Socket.IO connection sends the cookie automatically
3. On reconnect, server looks up the player by cookie name → restores to current phase
4. Admin is identified by a separate `isAdmin` flag in the cookie/session

---

## All NEEDS CLARIFICATION Items: Resolved

No remaining unknowns. All technical decisions are concrete and implementation-ready.
