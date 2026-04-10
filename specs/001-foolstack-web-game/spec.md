# Feature Specification: FoolStack Web Game

**Feature Branch**: `001-foolstack-web-game`  
**Created**: 2026-04-10  
**Status**: Draft  
**Input**: User description: "Create a simple web-game FoolStack — a multiplayer prompt-answer-vote party game with admin-controlled flow, emoji avatars, scoring, and cost-effective Azure hosting with IaC."

## Clarifications

### Session 2026-04-10

- Q: When does the admin provide their "trick" answer that gets mixed in with player answers during voting? → A: Admin enters their answer at the same time as the prompt (single form with prompt + answer fields).
- Q: What happens when a player does NOT submit an answer before the admin triggers the vote phase? → A: Non-answering players skip the round — they can still vote but have no answer in the pool.
- Q: Can a player join the game after it has left the waiting room (mid-game late join)? → A: No late joins — once the admin starts the game, the login portal is closed to new players.
- Q: Should answers on the vote page be displayed anonymously or with author names? → A: Anonymous — answers shown without author names during voting.
- Q: Does the score page reveal who wrote each answer (including which was the admin's)? → A: Full reveal — score page shows all answers with their authors and identifies the admin's answer, but answers are truncated to save screen space.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Player Joins and Enters Waiting Room (Priority: P1)

A player opens the game URL in their browser, enters their name and the fixed game code on the login portal, optionally picks an emoji avatar, and is placed into the waiting room. In the waiting room the player sees the names and avatars of everyone else who has joined and a live count of participants.

**Why this priority**: Without login and waiting room, no other game phase can function. This is the entry point for every player.

**Independent Test**: Can be fully tested by opening the game URL, logging in with a name + code, choosing an avatar, and confirming the waiting room shows the player alongside any other connected players.

**Acceptance Scenarios**:

1. **Given** the game URL is open, **When** a player enters a valid name and the correct game code, **Then** they are placed in the waiting room and see their own name/avatar plus all other connected players.
2. **Given** the login portal is displayed, **When** a player enters an incorrect game code, **Then** they see a clear error message and are not admitted.
3. **Given** the login portal is displayed, **When** a player selects a different emoji avatar before logging in, **Then** that avatar is shown next to their name in the waiting room.
4. **Given** a player is in the waiting room, **When** another player joins, **Then** the waiting room updates in real time to show the new participant and the updated player count.

---

### User Story 2 - Admin Controls Game Flow (Priority: P1)

An admin opens the same game URL, enters their username and the admin code. The admin does not have an avatar, scoring, or player tracking — their sole purpose is to control the game phases. From the waiting room the admin clicks "Start" to begin the prompt phase. They type a prompt and submit it, which pushes the prompt to all players. After players answer, the admin clicks "Begin Vote Phase" to advance everyone to voting. After voting, the admin clicks "Start Score Phase" to show scores, and then "Start Next Prompt Phase" to begin a new round.

**Why this priority**: The entire game loop depends on admin controls. Without them, players cannot progress past the waiting room.

**Independent Test**: Can be fully tested by logging in as admin and stepping through each phase transition button, confirming each click changes the game state for all connected clients.

**Acceptance Scenarios**:

1. **Given** the login portal is displayed, **When** the admin enters a username and the correct admin code, **Then** they are placed in the waiting room with the same player list view as regular users plus a "Start" button.
2. **Given** the admin is in the waiting room, **When** the admin clicks "Start", **Then** the admin sees a text box to enter a prompt.
3. **Given** the admin is on the prompt page, **When** the admin types a prompt and their own answer in a single form and clicks submit, **Then** all connected players receive the prompt and see a text box to answer it. The admin's answer is stored for the vote phase. The admin also sees a "Begin Vote Phase" button.
4. **Given** the admin is on the prompt page with prompts submitted, **When** the admin clicks "Begin Vote Phase", **Then** all players are transitioned to the vote page. The admin sees a count of how many users answered plus a "Start Score Phase" button.
5. **Given** the admin is on the vote page, **When** the admin clicks "Start Score Phase", **Then** all players are transitioned to the score page. The admin sees the same score view plus a "Start Next Prompt Phase" button.
6. **Given** the admin is on the score page, **When** the admin clicks "Start Next Prompt Phase", **Then** a new round begins — the admin sees the prompt entry text box again and players see the new prompt page.

---

### User Story 3 - Player Answers a Prompt (Priority: P2)

After the admin starts the prompt phase, each player sees the prompt text and a text box to type their answer. When the player submits their answer, they see a waiting message ("Waiting for others to answer") until the admin triggers the vote phase.

**Why this priority**: Answering prompts is the core gameplay mechanic — but it depends on login (US1) and admin flow (US2) being functional first.

**Independent Test**: Can be tested by having the admin start a prompt phase, then a player submitting an answer and confirming the waiting message appears.

**Acceptance Scenarios**:

1. **Given** the admin has submitted a prompt, **When** the player views the prompt page, **Then** they see the prompt text and a text box to type their answer.
2. **Given** the player has typed an answer, **When** they click submit, **Then** the answer is recorded and the player sees "Waiting for others to answer".
3. **Given** the player has submitted an answer and is waiting, **When** the admin triggers the vote phase, **Then** the player is automatically transitioned to the vote page.

---

### User Story 4 - Player Votes on Answers (Priority: P2)

During the vote phase, each player sees all submitted answers (from other players and one admin-provided answer) displayed in FIFO order with the admin's answer placed at a random position. The player selects one answer and submits their vote. If the player picks the admin's answer, the player earns +2 points. If the player picks another player's answer, that other player earns +1 point. After voting, the player sees "Waiting for others to vote" until the admin triggers the score phase. A player's own answer is not shown to them in the voting list.

**Why this priority**: Voting is the second half of the core game loop and drives scoring, but it depends on prompts being answered first.

**Independent Test**: Can be tested by having multiple players submit answers, then each player voting, and verifying the correct points are assigned.

**Acceptance Scenarios**:

1. **Given** the vote phase has started, **When** a player views the vote page, **Then** they see all answers except their own, displayed anonymously (no author names), in submission order with the admin's answer placed at a random position among them.
2. **Given** a player is on the vote page, **When** they select an answer and click submit, **Then** their vote is recorded and they see "Waiting for others to vote".
3. **Given** a player voted for the admin's answer, **When** scores are calculated, **Then** the voting player receives +2 points.
4. **Given** a player voted for another player's answer, **When** scores are calculated, **Then** the author of that answer receives +1 point.
5. **Given** a player has voted and is waiting, **When** the admin triggers the score phase, **Then** the player is automatically transitioned to the score page.

---

### User Story 5 - Player Views Scores and Proceeds to Next Round (Priority: P3)

After the admin triggers the score phase, each player sees: which answer they selected, how many people selected their own answer, and the top 5 players with their cumulative scores. When the admin starts the next prompt phase, all players are automatically moved back to the prompt page for a new round.

**Why this priority**: Score display is essential for player engagement but is a read-only view that can be built after the core answer/vote loop works.

**Independent Test**: Can be tested by completing a full round (prompt → answer → vote → score) and confirming the score page shows the correct data, then verifying the next round transition.

**Acceptance Scenarios**:

1. **Given** the score phase has started, **When** a player views the score page, **Then** they see which answer they voted for, how many people voted for their own answer, the top 5 players with cumulative scores, and a full reveal of all answers with their authors (truncated to save screen space) including which answer was the admin's.
2. **Given** the score page is displayed, **When** the admin clicks "Start Next Prompt Phase", **Then** the player is automatically transitioned to the prompt page for a new round with scores carried over.
3. **Given** multiple rounds have been played, **When** the score page is displayed, **Then** scores reflect the cumulative total across all rounds.

---

### User Story 6 - Secure Phase Navigation (Priority: P2)

Players must not be able to cheat by manually navigating to a different game phase URL (e.g., changing `/prompt` to `/score`). The system enforces that a player can only view the page corresponding to the current game phase controlled by the admin. Any attempt to access a different phase redirects or shows the correct current phase.

**Why this priority**: Without this, the voting and scoring integrity is compromised — players could view answers or scores prematurely.

**Independent Test**: Can be tested by attempting to manually change the URL to a different phase and confirming the system redirects to the current phase.

**Acceptance Scenarios**:

1. **Given** the game is in the waiting room phase, **When** a player manually navigates to `/vote`, **Then** the system redirects them back to the waiting room.
2. **Given** the game is in the prompt phase, **When** a player manually navigates to `/score`, **Then** the system redirects them back to the prompt page.
3. **Given** a player has not logged in, **When** they try to access any game page directly, **Then** the system redirects them to the login portal.

---

### User Story 7 - Cost-Effective Azure Hosting with IaC (Priority: P3)

The entire application is deployed on Azure using Infrastructure as Code. The hosting solution is optimized for cost, given the game only needs to run for 1–2 hours at a time. Deployment and teardown are handled via command-line instructions so the infrastructure can be spun up before a game session and torn down afterward.

**Why this priority**: Hosting is necessary for production use but the game can be developed and tested locally first.

**Independent Test**: Can be tested by running the IaC deployment commands, verifying the application is accessible, playing a game, then tearing down and confirming resources are destroyed and no ongoing costs accrue.

**Acceptance Scenarios**:

1. **Given** the IaC files and deployment scripts exist, **When** the operator runs the deployment commands, **Then** all Azure resources are provisioned and the application is accessible via a public URL.
2. **Given** the application is deployed, **When** the operator runs the teardown commands, **Then** all Azure resources are deleted and no further costs are incurred.
3. **Given** the application is deployed, **When** 20 concurrent players connect and play a full game, **Then** the application performs without noticeable lag or errors.

---

### Edge Cases

- What happens when a player disconnects mid-game and reconnects? They should be returned to the current game phase with their data intact.
- What happens when a player tries to submit an answer after the vote phase has already started? The submission is rejected.
- What happens when a player does not submit an answer before the admin triggers the vote phase? The player skips the round — they can still vote on others' answers but have no answer of their own in the pool.
- What happens when a player tries to vote twice? Only the first vote counts.
- What happens when only one player is in the game? The game should still function (the player sees only the admin's answer to vote on).
- What happens when the admin disconnects? The game pauses at the current phase until the admin reconnects and manually advances.
- What happens when two players choose the same name? The system should prevent duplicate names — the second player is asked to choose a different name.
- What happens when a new player tries to join after the admin has started the game? The login portal rejects the attempt with a message indicating the game is already in progress.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a single login portal where both players and the admin enter a username and code (fixed game code for players, admin code for admin).
- **FR-002**: System MUST allow players to select an emoji avatar on the login screen before joining.
- **FR-003**: System MUST prevent duplicate player names within a single game session.
- **FR-004**: System MUST display a waiting room showing all connected players (names + avatars) and a live participant count.
- **FR-005**: System MUST allow the admin to control game phase transitions: waiting room → prompt → vote → score → next prompt (repeating).
- **FR-006**: System MUST accept the admin's prompt and the admin's own answer in a single submission, broadcast the prompt to all connected players in real time, and store the admin's answer for the vote phase.
- **FR-007**: System MUST accept and store each player's text answer during the prompt phase. Players who do not submit an answer before the admin triggers the vote phase are skipped — they may still vote but have no answer in the pool.
- **FR-008**: System MUST display all submitted answers anonymously (without author names) on the vote page, including the admin's answer placed at a random position, excluding the viewing player's own answer, in FIFO order.
- **FR-009**: System MUST award +2 points to a player who votes for the admin's answer, and +1 point to the author of any player-submitted answer that receives a vote.
- **FR-010**: System MUST enforce that each player can only vote once per round.
- **FR-011**: System MUST display on the score page: the answer the player voted for, how many people voted for their answer, the top 5 players with cumulative scores, and a full reveal of all answers with their authors (truncated to save screen space) clearly identifying which answer was the admin's.
- **FR-012**: System MUST maintain cumulative scores across multiple rounds within a game session.
- **FR-013**: System MUST enforce server-side game phase gating — players can only access the current phase regardless of client-side URL manipulation.
- **FR-014**: System MUST redirect unauthenticated users to the login portal.
- **FR-015**: System MUST close the login portal to new players once the admin starts the game. Attempts to join after the game has started MUST be rejected with a clear message.
- **FR-019**: System MUST support real-time updates (e.g., waiting room player list, phase transitions) pushed from server to all clients.
- **FR-016**: System MUST handle player reconnection — a returning player is placed into the current game phase with their data intact.
- **FR-017**: System MUST provide Infrastructure as Code files for Azure deployment that can be deployed and torn down via CLI commands.
- **FR-018**: System MUST be hostable in a cost-effective manner on Azure, suitable for short 1–2 hour game sessions with teardown afterward.

### Key Entities

- **Player**: Represents a game participant. Attributes: name (unique per session), avatar (emoji), cumulative score, current answer, current vote, connection status.
- **Admin**: Represents the game controller. Attributes: name. No avatar, no score. Controls phase transitions and provides prompts and answers.
- **Game Session**: Represents one game event. Attributes: current phase (login, waiting, prompt, vote, score), game code, admin code, list of players, current round number.
- **Round**: Represents one prompt-answer-vote-score cycle. Attributes: round number, prompt text, admin answer, collection of player answers, collection of votes, computed scores for the round.
- **Answer**: A response to a prompt. Attributes: author (player or admin), text content, submission timestamp.
- **Vote**: A player's selection during the vote phase. Attributes: voter (player), selected answer, points awarded.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new player can join the game (open URL, enter name/code, pick avatar) in under 30 seconds.
- **SC-002**: The system supports at least 20 concurrent players in a single game session without degradation.
- **SC-003**: Phase transitions (admin clicks a button) are reflected on all player screens within 2 seconds.
- **SC-004**: A complete round (prompt → answer → vote → score) can be completed by 20 players in under 5 minutes.
- **SC-005**: Attempting to access a wrong-phase URL always redirects to the correct current phase — 100% enforcement.
- **SC-006**: Azure infrastructure can be deployed from scratch in under 10 minutes via CLI and torn down completely in under 5 minutes.
- **SC-007**: Running costs for a 2-hour game session are under $1 USD.
- **SC-008**: 90% of first-time players can complete their first round without external instructions.

## Assumptions

- The game is designed for small-to-medium groups (up to ~50 players). Large-scale usage (hundreds of players) is out of scope for the MVP.
- The game code and admin code are fixed/pre-configured values, not dynamically generated. The operator sets them before deployment.
- Only one game session runs at a time — there is no multi-room or lobby system in the MVP.
- Players use modern web browsers (Chrome, Firefox, Edge, Safari) on desktop or mobile. No native app is needed.
- No persistent storage of game history is needed — once the session ends (or infrastructure is torn down), all data is lost. This is acceptable for a party game.
- The admin is a trusted human operator — there is no need for admin authentication beyond the admin code.
- Internet connectivity is assumed for all participants during the game.
- Mobile-responsive design is desirable but a fully polished mobile layout is not required for the MVP — functional on mobile is sufficient.
