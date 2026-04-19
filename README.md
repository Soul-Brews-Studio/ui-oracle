# ui-oracle

Oracle UI monorepo — studio, vector, canvas.

Single repo housing the three user-facing Oracle frontends, managed via
Bun workspaces. Imported from three separate repos on 2026-04-19.

**Active deploys come from this monorepo.** The old standalone repos
(`oracle-studio`, `vector-oracle-studio`, `ui-canvas-oracle-studio`) are
archive/read-only — do not deploy from them.

## Layout

```
ui-oracle/
├── apps/
│   ├── studio/     ← dashboard (oracle-studio)          → app.buildwithoracle.com
│   ├── vector/     ← vector playground (vector-oracle-studio) → vector.buildwithoracle.com
│   └── canvas/     ← canvas plugin host (ui-canvas-oracle-studio) → canvas.buildwithoracle.com
├── packages/       ← shared code (shared-ui, etc.) — to be extracted
├── package.json    ← root workspace config
└── README.md
```

## Prereqs

- Bun `>=1.2.0`
- Node types via `@types/node` hoisted to root on install

## Install

```bash
bun install
```

Bun will hoist deduped deps to the root `node_modules` and symlink the
per-app workspaces. Run this once after cloning.

## Dev

Run a single app locally:

```bash
bun run dev:studio   # oracle dashboard
bun run dev:vector   # vector playground
bun run dev:canvas   # canvas plugin host
```

Each proxies to the app-local `vite` dev server.

## Build

```bash
bun run build:studio
bun run build:vector
bun run build:canvas
bun run build:all       # all three, serial
```

Build outputs land in each app's local `dist/`.

## Preview

```bash
bun run preview:studio
bun run preview:vector
bun run preview:canvas
```

## Deploy

**Not wired up at the monorepo level yet.** Deploys still run from the
three original repos until cutover issues land. See open issues labeled
`cutover` for the migration plan.

Each app keeps its original `wrangler.json`; once cutover lands,
deploys will run via `bun --cwd apps/<name> run deploy`.

## Status

- [x] Skeleton: apps imported, workspaces linked, builds pass locally
- [ ] Cutover: deploy studio / vector / canvas from this repo
- [ ] Extract `packages/shared-ui` (Header, cache, api)
