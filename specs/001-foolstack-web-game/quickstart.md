# Quickstart: FoolStack Web Game

**Feature**: 001-foolstack-web-game
**Date**: 2026-04-10

## Prerequisites

- Node.js 20 LTS
- Azure CLI (`az`) with an active subscription (for deployment only)
- Bicep CLI (bundled with Azure CLI)

## Local Development

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Configure environment

Create a `.env` file in the `server/` directory:

```env
GAME_CODE=foolstack
ADMIN_CODE=admin123
PORT=3000
```

### 3. Start the server

```bash
node index.js
```

The app will be available at `http://localhost:3000`.

### 4. Play the game locally

1. Open `http://localhost:3000` in one browser tab — log in as **admin** (enter any name + admin code `admin123`)
2. Open `http://localhost:3000` in another tab or browser — log in as a **player** (enter a name + game code `foolstack`, pick an emoji)
3. Repeat step 2 for more players
4. As admin: click **Start** → enter prompt + answer → click **Begin Vote Phase** → click **Start Score Phase** → click **Start Next Prompt Phase**

## Azure Deployment

### 1. Deploy infrastructure + app

```powershell
cd infra
.\deploy.ps1 -ResourceGroup "foolstack-rg" -Location "eastus" -GameCode "foolstack" -AdminCode "admin123"
```

This will:
- Create a resource group
- Deploy Azure App Service (B1 Linux) via Bicep
- Package and deploy the Node.js app via zip deployment
- Print the public URL

### 2. Play the game

Open the printed URL in a browser. Share it with players.

### 3. Teardown (stop costs)

```powershell
cd infra
.\teardown.ps1 -ResourceGroup "foolstack-rg"
```

This deletes the entire resource group and all resources. No further costs accrue.

## Project Structure

```
server/           → Node.js backend (Express + Socket.IO)
public/           → Static frontend (HTML/CSS/JS)
infra/            → Azure Bicep IaC + deployment scripts
specs/            → Feature documentation
```
