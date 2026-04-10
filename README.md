# 🃏 FoolStack

A multiplayer browser-based party game where an admin provides prompts, players submit answers, and everyone votes on which answer they think is the admin's "trick" answer.

## How It Works

1. **Admin** creates a game session and provides prompts with their own trick answer
2. **Players** join using a game code, pick emoji avatars, and submit their answers
3. Everyone **votes** on which answer they think the admin wrote (answers shown anonymously)
4. **Scoring**: +2 points if you spot the admin's answer, +1 point to the author if someone picks yours
5. **Repeat** for as many rounds as you want — scores accumulate!

---

## Prerequisites

- [Node.js 20 LTS](https://nodejs.org/) (or later)
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) — only needed for cloud deployment

---

## Running Locally

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Configure environment

Create a file called `.env` inside the `server/` directory:

```env
GAME_CODE=foolstack
ADMIN_CODE=admin123
PORT=3000
```

| Variable | Description | Default |
|----------|-------------|---------|
| `GAME_CODE` | Code players enter to join the game | `foolstack` |
| `ADMIN_CODE` | Code the admin enters to control the game | `admin123` |
| `PORT` | Server port | `3000` |

> **Tip**: Change `GAME_CODE` and `ADMIN_CODE` to something your friends won't guess!

### 3. Start the server

```bash
cd server
node index.js
```

You'll see:

```
FoolStack server running on http://localhost:3000
Game code: foolstack | Admin code: admin123
```

### 4. Open the game

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Play

### Step 1 — Admin joins first

1. Open the game URL
2. Enter any name (e.g., "GameMaster")
3. Enter the **admin code** (default: `admin123`)
4. You'll land in the **Waiting Room** with a "Start Game" button

### Step 2 — Players join

1. Share the game URL with friends (everyone uses the same URL)
2. Each player enters their name, the **game code** (default: `foolstack`), and picks an emoji avatar
3. Players appear in the Waiting Room in real time

### Step 3 — Play rounds

The admin controls the entire game flow with buttons:

| Admin Action | What Happens |
|-------------|-------------|
| **Start Game** | Opens the Prompt phase — admin types a prompt + their trick answer |
| **Submit Prompt** | Sends the prompt to all players — they type their answers |
| **Begin Vote Phase** | All answers are shown anonymously — players vote on which they think is the admin's |
| **Start Score Phase** | Reveals who wrote what, shows points and leaderboard |
| **Start Next Prompt Phase** | Begins a new round — scores carry over |

### Scoring

| Event | Points |
|-------|--------|
| You vote for the **admin's** answer | **+2** to you |
| Someone votes for **your** answer | **+1** to you |

### Rules

- Players who don't answer in time are skipped (they can still vote)
- You can't vote for your own answer
- You can only vote once per round
- No one can join after the game starts
- If the admin disconnects, the game pauses until they reconnect

---

## Deploying to Azure

FoolStack includes Infrastructure as Code (Bicep) for one-command deployment to Azure App Service.

**Estimated cost**: ~$0.04–0.08 for a 2-hour game session (B1 Linux tier).

### Deploy

```powershell
cd infra
.\deploy.ps1 -ResourceGroup "foolstack-rg" -Location "eastus" -GameCode "mysecretcode" -AdminCode "myadminpass"
```

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `-ResourceGroup` | Yes | — | Azure resource group name |
| `-Location` | No | `eastus` | Azure region |
| `-GameCode` | No | `foolstack` | Game code for players |
| `-AdminCode` | No | `admin123` | Admin code |
| `-AppName` | No | `foolstack` | Base name for Azure resources |

The script will print the public URL when done. Share that URL with your players!

### Playing after deployment

Exactly the same as local — just use the Azure URL instead of `localhost:3000`:

1. **Admin**: Open the printed URL → enter a name + your admin code → Start Game
2. **Players**: Open the same URL → enter a name + game code → pick avatar → play!

### Teardown (stop all costs)

```powershell
cd infra
.\teardown.ps1 -ResourceGroup "foolstack-rg"
```

This deletes the entire resource group. No further costs accrue.

---

## Default Codes

| Code Type | Default Value | Set Via |
|-----------|---------------|---------|
| Game Code (players) | `foolstack` | `GAME_CODE` env var or `-GameCode` deploy param |
| Admin Code | `admin123` | `ADMIN_CODE` env var or `-AdminCode` deploy param |

> **Security note**: Always change the default codes before sharing with players. The admin code gives full control over the game.

---

## Project Structure

```
server/
├── index.js          # Express + Socket.IO server
├── game.js           # In-memory game state
└── package.json      # Dependencies

public/
├── index.html        # Login page
├── waiting.html      # Waiting room
├── prompt.html       # Prompt/answer page
├── vote.html         # Voting page
├── score.html        # Scores + leaderboard
├── css/style.css     # Styles
└── js/
    ├── common.js     # Shared utilities
    ├── login.js      # Login logic
    ├── waiting.js    # Waiting room logic
    ├── prompt.js     # Prompt page logic
    ├── vote.js       # Vote page logic
    └── score.js      # Score page logic

infra/
├── main.bicep        # Azure IaC template
├── main.bicepparam   # Parameters
├── deploy.ps1        # Deploy script
└── teardown.ps1      # Teardown script
```

---

## Tech Stack

- **Backend**: Node.js 20 + Express + Socket.IO
- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework)
- **Storage**: In-memory (no database — state is lost on server restart)
- **Hosting**: Azure App Service B1 Linux (via Bicep IaC)
