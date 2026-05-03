# Forja IDE

Desktop workbench for discovering, browsing, editing, and organizing AI skill folders stored on disk.

The app is built with Tauri, Rust, React, TypeScript, and Monaco. It is optimized for local-first workflows where skills live across workspace folders, provider directories, Windows paths, and WSL environments.

## Highlights

- Scans local skill roots for `SKILL.md` manifests.
- Supports workspace skills, provider-managed skills, custom scan roots, and WSL home directories.
- Groups skills into `System Skills`, `Global`, and `Providers` views in the sidebar.
- Loads file trees and file contents lazily instead of hydrating every skill up front.
- Preserves unsaved editor buffers during background refreshes.
- Watches relevant roots and refreshes skill trees when files change on disk.
- Lets you configure skill classification rules from `Settings > Skills`.
- Lets you right-click skill folders to hide or show directories from discovery.
- Includes early marketplace flows for searching, installing, updating, and uninstalling skills.

## Core Features

- Skill discovery across local workspace roots and provider directories.
- Monaco-based editing for skill files.
- Sidebar views for:
  - open workspace files
  - system skill tree
  - global skill roots
  - provider buckets
- Search and filtering for large skill collections.
- Skill settings for:
  - global roots
  - provider directories
  - hidden directories
  - custom scan roots
- File reveal actions from the UI.
- Marketplace state and install target preferences.

## Skill Discovery

By default, the app keeps scan roots intentionally scoped. It does not scan an entire home directory blindly.

Discovery includes:

- current workspace and ancestor-local skill folders
- supported provider locations under user home directories
- configured custom scan roots
- Windows provider paths
- WSL distributions discovered through `\\wsl$` and `\\wsl.localhost`

The classification settings are persisted in:

- `~/.config/skills-ide/skill-classification.json`

Those settings extend and control how the app interprets:

- which roots count as global
- which directory names count as providers
- which directories should be skipped entirely
- which extra filesystem roots should be scanned

## Project Structure

- `src-tauri/`
  Rust backend for scanning, tree building, file listing, file loading, file saving, watching, marketplace operations, and Tauri commands.
- `src/components/`
  Workbench UI, sidebar, settings, marketplace panels, and editor-facing components.
- `src/hooks/`
  Frontend state orchestration for workspace files, system skills, marketplace, preferences, and settings.
- `src/settings/`
  Settings screens and configuration-specific UI.
- `src/ide/`
  Shared frontend helpers for system skill file ids, hydration, and merge behavior.

## Getting Started

1. Install the standard Tauri prerequisites for your OS.
2. Install Node.js and the Rust toolchain.
3. Install dependencies:

```bash
npm install
```

4. Start the desktop app:

```bash
npm run tauri dev
```

## Scripts

- `npm run dev`
  Start the Vite frontend only.
- `npm run tauri dev`
  Start the desktop app in Tauri dev mode.
- `npm run typecheck`
  Run the TypeScript compiler without emitting files.
- `npm run lint`
  Run ESLint on the frontend codebase.
- `npm run test:ui`
  Run Vitest UI tests.
- `npm run test:rust`
  Run Rust tests in `src-tauri`.
- `npm run test`
  Run UI and Rust tests together.
- `npm run build`
  Typecheck and build the frontend bundle.

## Development Notes

- Skill refreshes are debounced to avoid flooding the UI.
- File contents are loaded on demand when a skill is opened.
- Background refreshes update saved content without clobbering unsaved drafts.
- Hidden directories are applied both to scanning and skill file listing.
- Sidebar folder actions can write directly into the hidden-directory settings.
- The external API layer is still in progress, so some integrations are intentionally incomplete.

## Current Limitations

- Create, rename, and delete flows for skills are still limited.
- Discovery rules are configurable, but they are still convention-driven around `SKILL.md` manifests.
- The API is still in progress, especially around broader marketplace and server-backed workflows.
- The product surface is broader than the README used to reflect, so some areas are still evolving quickly.
