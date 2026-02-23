<div align="center">

<img src="https://img.shields.io/badge/DriveMigrate-v1.0.0-4ade80?style=for-the-badge&labelColor=0f0f10" alt="version" />
<img src="https://img.shields.io/badge/Node.js-22 LTS-339933?style=for-the-badge&logo=nodedotjs&labelColor=0f0f10" />
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&labelColor=0f0f10" />
<img src="https://img.shields.io/badge/license-MIT-4ade80?style=for-the-badge&labelColor=0f0f10" />

<br/>
<br/>

```
  ██████╗ ██████╗ ██╗██╗   ██╗███████╗
  ██╔══██╗██╔══██╗██║██║   ██║██╔════╝
  ██║  ██║██████╔╝██║██║   ██║█████╗  
  ██║  ██║██╔══██╗██║╚██╗ ██╔╝██╔══╝  
  ██████╔╝██║  ██║██║ ╚████╔╝ ███████╗
  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝  ╚══════╝
         migrate
```

**Move your Google Drive. Without the headache.**

Migrate files between Google accounts in minutes — folder structure intact, Google Docs exported to Office format, real-time progress. No manual downloads. No data loss.

[Live Demo](#) · [Report Bug](../../issues) · [Request Feature](../../issues)

</div>

---

## The Problem

You have two Google accounts. One is overloaded. The other has space. Moving files manually means downloading everything, re-uploading everything, and losing your folder structure. It's a nightmare.

DriveMigrate solves this with a clean wizard UI and a robust backend — connect both accounts, pick what to move, watch it happen live.

---

## Features

| Feature | Details |
|---|---|
| 🔐 **Dual OAuth** | Connect source and destination accounts securely via Google OAuth 2.0 |
| 📁 **Folder structure preserved** | Nested folders recreated exactly as they are in source |
| 📄 **Google Workspace export** | Docs → .docx, Sheets → .xlsx, Slides → .pptx automatically |
| ✅ **Selective migration** | Browse your drive and pick exactly what to move |
| 📡 **Live progress** | Real-time transfer stats via Server-Sent Events |
| ⚙️ **Job queue** | BullMQ + Redis handles large drives without timeouts |
| 🖥️ **CLI included** | Full migration from terminal with `drivemigrate run --all` |
| 🛡️ **Rate limited** | API protected against abuse |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser / CLI                  │
└──────────────────────┬──────────────────────────┘
                       │ HTTP / SSE
┌──────────────────────▼──────────────────────────┐
│              Express Backend (Node.js)           │
│   /auth  ──  Google OAuth 2.0                   │
│   /drive ──  Drive API browsing                 │
│   /transfer── Job creation + SSE stream         │
└──────────┬──────────────────────────────────────┘
           │ BullMQ
┌──────────▼──────────┐     ┌─────────────────────┐
│    Redis Queue       │────▶│   Transfer Worker    │
└─────────────────────┘     │  Download → Upload   │
                            │  source  →  dest     │
┌─────────────────────┐     └─────────────────────┘
│   SQLite Database    │◀── job tracking & logs
└─────────────────────┘
```

---

## Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS (Syne + DM Sans typography)
- React Router v6

**Backend**
- Node.js 22 LTS + Express
- Google Drive API v3 + OAuth 2.0
- BullMQ (job queue) + Redis
- SQLite via better-sqlite3
- express-rate-limit

**CLI**
- Commander.js
- Chalk + Ora (terminal UI)
- Shared Drive API service layer

---

## Getting Started

### Prerequisites

- Node.js v22 LTS ([install with nvm](https://github.com/nvm-sh/nvm))
- Redis (`brew install redis` / `sudo apt install redis-server`)
- A Google Cloud project with Drive API enabled

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/drivemigrate.git
cd drivemigrate
```

### 2. Google Cloud Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project → enable **Google Drive API** and **Google People API**
3. Go to **OAuth consent screen** → External → add yourself as a test user
4. Go to **Credentials** → Create OAuth 2.0 Client ID (Web Application)
5. Add authorized redirect URI: `http://localhost:3001/auth/callback`
6. Copy your **Client ID** and **Client Secret**

### 3. Configure environment

```bash
cd backend
cp .env.example .env
```

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/callback
SESSION_SECRET=generate_with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
REDIS_URL=redis://localhost:6379
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 4. Install dependencies

```bash
# From root
nvm use 22
npm install
```

### 5. Start everything

Open 4 terminals (all with `nvm use 22`):

```bash
# Terminal 1 — Redis
redis-server

# Terminal 2 — Backend
cd backend && npm run dev

# Terminal 3 — Worker
cd backend && npm run worker

# Terminal 4 — Frontend
cd frontend && npm run dev
```

Open **http://localhost:5173** and start migrating.

---

## CLI Usage

```bash
cd cli
npm install

# See available folders
node src/index.js run

# Migrate everything
node src/index.js run --all

# Migrate a specific folder by name
node src/index.js run --folder "My Projects"
```

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Push to GitHub, connect repo in vercel.com
# Set root directory to: frontend
```

### Backend + Worker + Redis → Railway

1. Go to [railway.app](https://railway.app) → New Project
2. Add a **Redis** service from the Railway template
3. Add a new service → connect your GitHub repo → set root to `backend`
4. Set environment variables (same as `.env` but with production values)
5. Add a second service for the worker, same repo, start command: `node src/workers/transferWorker.js`
6. Update `GOOGLE_REDIRECT_URI` in Google Cloud Console to your Railway backend URL

---

## How It Works

1. User connects **source** Google account via OAuth — tokens stored server-side in session
2. User connects **destination** Google account via a second OAuth flow
3. Source Drive is browsed via Drive API — folders and files listed
4. User selects items to migrate
5. A job is created in SQLite and pushed to the BullMQ Redis queue
6. The transfer worker picks up the job:
   - For each folder: recursively creates matching folder in destination, then migrates files
   - For Google Workspace files: exports to Office format before uploading
   - For regular files: streams directly from source to destination
7. Progress is streamed to the browser via Server-Sent Events every 1.5 seconds
8. Completion screen shows full report with any failed transfers

---

## Security

- OAuth tokens are stored **only in server-side sessions** — never sent to the client, never logged
- Sessions are signed with a secret and expire after 24 hours
- The `.env` file is gitignored — credentials never touch the repository
- Rate limiting protects all API endpoints from abuse
- Source and destination accounts are validated to be different before any transfer begins

---

## Roadmap

- [x] v1 — Core migration with selective file picking, real-time progress, CLI
- [ ] v2 — Usage limits + Stripe payments, user accounts, transfer history
- [ ] v3 — Scheduled/incremental sync, Dropbox and OneDrive support

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

```bash
git checkout -b feature/your-feature
git commit -m "feat: your feature"
git push origin feature/your-feature
```

---

## License

MIT © [Your Name](https://github.com/yourusername)

---

<div align="center">
  Built with ☕ as a student project · <a href="#">Live Demo</a>
</div>
