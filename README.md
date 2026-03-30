# Skills IDE

Desktop workbench built with Tauri, React, TypeScript and Monaco to inspect and edit AI skill folders found on disk.

## What It Does

- Scans the current workspace and supported provider locations for `SKILL.md` manifests.
- Renders a navigable system skill tree without eagerly loading every file into the UI.
- Loads skill files on demand, opens them in Monaco, and writes updates back through the Tauri backend.
- Watches relevant skill roots and refreshes the tree when manifests or skill files change on disk.
- Preserves dirty editor buffers when a background refresh happens.

## Architecture

- `src-tauri/`
  Tauri commands and Rust services for scan, tree building, lazy file listing, file loading, file saving and filesystem watching.
- `src/hooks/`
  Frontend state split by domain: workspace files, system skill discovery, editor preferences and the composed IDE facade.
- `src/components/`
  Workbench layout, sidebar, settings surface and editor workspace.
- `src/ide/systemSkills.ts`
  Shared frontend helpers for system skill file ids, tree hydration and safe merge behavior for refreshed files.

## Commands

- `npm run dev`
  Start the Vite frontend.
- `npm run tauri dev`
  Start the desktop app in Tauri dev mode.
- `npm run typecheck`
  Run the TypeScript compiler without emitting files.
- `npm run lint`
  Run ESLint on the frontend codebase.
- `npm run test:ui`
  Run Vitest tests for the React app.
- `npm run test:rust`
  Run Rust tests in `src-tauri`.
- `npm run test`
  Run UI and Rust tests together.
- `npm run build`
  Typecheck and build the frontend bundle.

## Current Scope

- The app is focused on local skill discovery and editing.
- Marketplace work is intentionally out of scope in this phase.
- Create, rename and delete flows are not implemented yet.
- Skill file nodes are listed lazily per skill; file contents are only loaded when a skill is opened.

## Notes

- Default scan roots are intentionally scoped to the workspace and provider-specific directories, not the whole home directory.
- Skill refreshes are debounced from the watcher to avoid flooding the UI.
- Background refreshes update saved content without overwriting unsaved editor drafts.
