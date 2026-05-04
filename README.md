# ManSkills

Desktop workbench for discovering, browsing, editing, and organizing AI skill folders stored on disk.

Built with **Tauri**, **Rust**, **React**, **TypeScript**, and **Monaco**. Optimized for local-first workflows where skills live across workspace folders, provider directories, Windows paths, and WSL environments.

## Highlights

- **Skill Discovery** — Scans local skill roots for `SKILL.md` manifests across workspace and global locations
- **Skill Editing** — Monaco-based editor for modifying skill files with full IDE features
- **Sidebar Views** — Navigate skills organized by System, Global, and Providers categories
- **Marketplace** — Browse and install skills via CLI from a local API server
- **File Watching** — Automatically refreshes skill trees when files change on disk
- **WSL Support** — Discovers skills across WSL distributions on Windows
- **Lazy Loading** — Loads file trees and contents on demand, not all at once
- **Settings UI** — Configure skill roots, providers, hidden directories, and scan locations

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ManSkills                               │
├───────────────────────────┬─────────────────────────────────────┤
│      React Frontend       │        Rust Backend (Tauri)          │
│   (TypeScript + Monaco)   │                                      │
│                           │  - Skill scanning & discovery        │
│  - Sidebar navigation     │  - File tree building                │
│  - Marketplace UI         │  - File reading/writing             │
│  - Settings panels        │  - Filesystem watching             │
│  - Monaco editor          │  - Marketplace operations          │
│                           │  - Tauri commands                  │
└───────────────────────────┴─────────────────────────────────────┘
                                    │
                                    │ HTTP (localhost)
                                    ▼
                          ┌─────────────────────┐
                          │   skills-api server  │
                          │   (port from file)   │
                          │   marketplace local   │
                          └─────────────────────┘
```

## Marketplace

The marketplace uses a **local API server** (`skills-api`) instead of external services. This gives you:

- Full control over available skills
- No external API dependencies
- No API keys required
- Faster response times for skill metadata
- Ability to run offline (with cached data)

### How It Works

1. The **skills-api** server provides a local REST API with skill metadata
2. The IDE frontend browses and searches skills through this API
3. When you install a skill, the IDE opens your system terminal with the `npx skills add` command pre-filled
4. The command executes in your current workspace directory
5. After installation, the IDE automatically refreshes to show the newly installed skill

### Setting Up the Marketplace Server

The marketplace requires the `skills-api` server to be running. The server port is configured dynamically through a `.skills-api-port` file.

**1. Start the skills-api server:**

```bash
cd server-skills/skills-api
pnpm install
pnpm dev
```

The server starts on port `3456` by default (configurable via `PORT` env var).

On startup, the server writes its port to `.skills-api-port` in its root directory. The Rust backend reads this file to keep the IDE and server in sync automatically.

**2. Start the ManSkills:**

```bash
npm run tauri dev
```

### Marketplace Features

- **Browse Skills** — View all available skills from the local API
- **Search** — Filter skills by name, description, or source repository
- **Preview** — View skill README and contents before installing
- **Install via CLI** — Opens system terminal with `npx skills add {source}/{skill}` command
- **Open Installed** — Navigate directly to an installed skill in the sidebar
- **Update** — Reinstall skills from their source
- **Uninstall** — Remove skills from your local installation

### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3456` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `CORS_ORIGIN` | `*` | CORS origin |
| `AUTO_REFRESH` | `false` | Enable periodic refresh |
| `REFRESH_INTERVAL` | `30` | Refresh interval (minutes) |

For production:

```bash
pnpm build && pnpm start
```

With S3 storage:

```bash
S3_BUCKET=my-bucket AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=xxx pnpm start
```

### Marketplace API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/skills` | List and search skills (paginated) |
| `GET /api/skills/top` | Top skills by installs |
| `GET /api/skills/sources/top` | Top skill sources by total installs |
| `GET /api/skills/:owner/:repo/:skillId` | Get a specific skill |
| `GET /api/skills/:owner/:repo/:skillId/content` | Get SKILL.md content |
| `GET /api/skills/:owner/:repo/:skillId/files` | Get all skill files |

### Skill Installation Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Browse        │ ──► │   Click         │ ──► │   Terminal      │
│   Marketplace   │     │   "Install"     │     │   Opens with    │
│                 │     │                 │     │   npx add cmd   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                            │
                                                            ▼
                                                  ┌─────────────────┐
                                                  │   User runs     │
                                                  │   the command   │
                                                  └─────────────────┘
                                                            │
                                                            ▼
                                                  ┌─────────────────┐
                                                  │   IDE          │
                                                  │   refreshes     │
                                                  │   skill tree    │
                                                  └─────────────────┘
```

## Skill Discovery

By default, the app keeps scan roots intentionally scoped. It does not scan an entire home directory blindly.

Discovery includes:

- **Current workspace** and ancestor-local skill folders
- **Global roots** — User-configured directories scanned across sessions
- **Provider locations** — Supported provider directories under user home directories
- **Custom scan roots** — Additional locations configured in settings
- **WSL distributions** — Discovered through `\\wsl$` and `\\wsl.localhost`

### Skill Classification Settings

Classification settings control how skills are organized and displayed. These are persisted in:

```
~/.config/skills-ide/skill-classification.json
```

Settings include:

- Which roots count as global vs. workspace-local
- Which directory names count as providers
- Which directories should be skipped entirely
- Which extra filesystem roots should be scanned

Access these settings through **Settings > Skills**.

## Project Structure

```
skills-ide/
├── server-skills/
│   └── skills-api/           # Local marketplace API server
│       ├── src/
│       │   ├── bin.ts         # CLI entry point (writes .skills-api-port)
│       │   ├── server.ts      # Hono server setup
│       │   ├── routes/        # API endpoints
│       │   ├── registry/      # Skill data management
│       │   └── scraper/      # skills.sh scraper
│       └── .skills-api-port   # Dynamic port file (generated)
│
├── src-tauri/                 # Rust backend
│   ├── src/
│   │   ├── lib.rs             # Tauri plugin registration
│   │   ├── tauri_commands.rs  # Tauri command definitions
│   │   ├── models/            # Data structures
│   │   │   ├── marketplace_skill.rs
│   │   │   ├── marketplace_source.rs
│   │   │   └── system_skill.rs
│   │   └── services/
│   │       ├── marketplace.rs   # Marketplace API client (reads .skills-api-port)
│   │       ├── skill_catalog.rs
│   │       ├── skill_tree.rs
│   │       ├── skill_content.rs
│   │       └── skill_watch.rs
│   └── tauri.conf.json
│
└── src/                      # React frontend
    ├── components/
    │   ├── editor/            # Monaco editor integration
    │   ├── navigation/        # Sidebar and tree views
    │   ├── panels/            # Main content panels
    │   │   └── marketplace/   # Marketplace UI components
    │   │       ├── MarketplaceCatalog.tsx
    │   │       ├── MarketplaceContext.tsx
    │   │       └── MarketplaceSkillDetail.tsx
    │   └── settings/          # Settings screens
    ├── hooks/                 # React state hooks
    ├── contexts/              # React context providers
    └── types/                  # TypeScript type definitions
```

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **Rust** toolchain (latest stable)
- **pnpm** (for the skills-api server)
- **Tauri prerequisites** for your OS:
  - macOS: Xcode command line tools
  - Windows: Visual Studio Build Tools
  - Linux: `libwebkit2gtk-4.1-dev`, `libssl-dev`, `pkg-config`

### Installation

1. Clone the repository and install frontend dependencies:

```bash
npm install
```

2. Install Rust dependencies:

```bash
cd src-tauri && cargo fetch && cd ..
```

### Development

Start the skills-api server in one terminal:

```bash
cd server-skills/skills-api
pnpm install  # Only first time
pnpm dev
```

Start the Tauri app in another terminal:

```bash
npm run tauri dev
```

This will:

- Start the Vite dev server on port 1420
- Launch the Tauri application window
- Watch for file changes in both frontend and backend

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite frontend only (port 1420) |
| `npm run tauri dev` | Start full Tauri desktop app |
| `npm run typecheck` | Run TypeScript compiler (no emit) |
| `npm run lint` | Run ESLint on frontend code |
| `npm run build` | Typecheck and build frontend bundle |
| `pnpm tauri build` | Build production Tauri app |

## Development Notes

- **Skill refreshes** are debounced to avoid flooding the UI
- **File contents** are loaded on demand when a skill is opened
- **Background refreshes** update saved content without affecting unsaved drafts
- **Hidden directories** are applied both to scanning and skill file listing
- **Sidebar folder actions** can write directly into the hidden-directory settings
- **Marketplace port** is read from `.skills-api-port` file, not hardcoded

## Troubleshooting

### Marketplace won't load
- Ensure `skills-api` server is running: `cd server-skills/skills-api && pnpm dev`
- Check that the server port matches (look at `.skills-api-port` file)
- Check browser console for CORS errors

### Skills not appearing in sidebar
- Check Settings > Skills to verify scan roots are configured
- Ensure the skill has a valid `SKILL.md` file
- Check if directories are marked as "hidden" in settings

### Installation opens wrong terminal
- The IDE uses `cmd.exe` on Windows and `x-terminal-emulator` on Linux
- On Windows, it should open a new CMD window, not VS Code's terminal
- If using WSL, skills install to the WSL filesystem

### Build fails with icon errors
- Ensure `src-tauri/icons/icon.ico` exists
- Use `png-to-ico` or sharp to convert PNG to ICO with multiple sizes
- ICO must contain at least 16x16, 32x32, and 48x48 sizes

## License

MIT
