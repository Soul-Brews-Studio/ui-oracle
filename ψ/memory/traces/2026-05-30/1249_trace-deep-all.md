---
query: "all — ui-oracle repo + indexer deploy + calver HMM"
target: "ui-oracle"
mode: deep
timestamp: 2026-05-30 12:49 +07
friction_score: 0.7
coverage: [files, oracle-memory, sessions]
confidence: high
---

# Trace: ui-oracle + indexer deploy + calver HMM

**Target**: ui-oracle (/opt/Code/github.com/Soul-Brews-Studio/ui-oracle)
**Mode**: deep (Wave 1 only — sufficient) | **Friction**: 0.7 | **Confidence**: high
**Time**: 2026-05-30 12:49 +07 (Saturday)

## Oracle Results
None — `arra-oracle` MCP not loaded in this session.

## Files Found

### Monorepo orientation
- `package.json:3` — root version **v26.5.2-alpha.1704**
- `apps/` — 7 apps:
  - `apps/studio/` → app.buildwithoracle.com (main dashboard)
  - `apps/vector/` → vector.buildwithoracle.com (vector playground)
  - `apps/canvas/` → canvas.buildwithoracle.com (canvas plugin host)
  - `apps/schedule/`, `apps/feed/`, `apps/forum/` (satellite apps)
  - `apps/indexer/` → indexer.buildwithoracle.com (NEW)
- `packages/shared-ui/` — reusable Tailwind components
- `agents/` — empty stub
- `docs/menu-matrix/` — menu design reference
- `scripts/calver.ts`, `scripts/sync-menu.ts`

### Indexer app (apps/indexer/)
- Tech: React 19 + Vite + TypeScript + TailwindCSS, deployed via Cloudflare Workers
- Purpose: interactive config UI — configure adapters, models, data sources, run indexing jobs
- `apps/indexer/worker.ts:1-28` — Cloudflare SPA handler + cache strategy
- `apps/indexer/wrangler.json:9` — routes to `indexer.buildwithoracle.com`, account_id `a5eabdc2b11aae9bd5af46bd6a88179e`
- `apps/indexer/package.json:13` — build: `tsc -b && vite build` → wrangler deploy
- App version: `0.1.0` (isolated from monorepo root version)
- Source: `Indexer.tsx`, `api/indexer.ts`, `api/host.ts`

### CalVer + HMM (scripts/calver.ts)
- Scheme: **v{YY}.{M}.{D}[-{channel}.{HMM}]**
  - YY.M.D = today's calendar date
  - channel = `alpha` | `beta` | stable (no suffix)
  - **HMM = H*100 + M** (wall-clock hour+minute as integer, no leading zeros)
    - 00:00 → "0", 09:29 → "929", 10:01 → "1001", 23:59 → "2359"
- Purpose: eliminates merge-order collisions; each minute is a unique slot
- Numeric semver semantics: all-digit prerelease IDs sort chronologically
- TZ: shell's `TZ` (CI: Asia/Bangkok)
- CLI: `bun scripts/calver.ts [--stable|--beta|--check]`
- Cutover: post-tag-walk migration (#766, #819); no longer uses legacy monotonic counter

## Git History
Not searched (Wave 1 was sufficient). Recent commits visible at session start:
- `156fc7d` Merge #89 feat/indexer-deploy
- `562c4d3` feat(indexer): deploy config for indexer.buildwithoracle.com
- `0eff3c0` Merge #86 chore/calver-hmm-indexer
- `8aa8d56` chore: add calver HMM + bump v26.5.2-alpha.1704
- `21f4446` Merge #85 feat/indexer-app

## GitHub Issues/PRs
Not searched (Wave 1 was sufficient).

## Cross-Repo Matches
Not searched (Wave 1 was sufficient). One sibling session dir exists for `mawui-oracle` (different repo).

## Oracle Memory
ψ/memory/ is **empty** — directory initialized but no artifacts yet.
- ψ/memory/ — empty
- ψ/memory/traces/2026-05-30/ — empty (this is the first trace log)

## Session History (from /dig)
Effectively **null signal** for this repo.

| Date (UTC) | Topic | ~User turns |
|---|---|---|
| 2026-05-30 05:00–05:50 | `/trace --deep` (this run) | 21 (3 human, 18 tool) |

- Only one JSONL exists for this repo's project dir — the current session.
- All 14 hits on `indexer|deploy|calver|hmm|buildwithoracle|alpha` are inside the prompts I just dispatched, not in any prior conversation.
- The work that produced commits 562c4d3/8aa8d56/etc. was done outside Claude Code in this repo's project dir — likely from a different cwd (worktree, sibling repo session, or non-Claude editor).
- Sibling: `/Users/nat/.claude/projects/-opt-Code-github-com-Soul-Brews-Studio-mawui-oracle/` (different repo, last touched 2026-05-21, outside scope).

## Friction Analysis

**Score**: 0.7 — Visible (files-tier + high confidence)

**Source breakdown**:
- Oracle: 0.0 (MCP not loaded)
- Files: **0.7** ✓ (rich answers in current repo)
- ψ/memory: 0.0 (empty)
- Sessions: 0.0 (no prior coverage)

**Coverage**: 3 of 5 dimensions searched (files, ψ/memory, sessions). Git history, cross-repo, and GitHub issues not searched — Wave 1 was sufficient.

**Goal check**: Yes — all three sub-topics answered.
- ui-oracle repo: ✓ monorepo of 7 apps + shared-ui, v26.5.2-alpha.1704
- indexer deploy: ✓ React 19 + Vite + Cloudflare Workers → indexer.buildwithoracle.com
- CalVer HMM: ✓ HMM = H*100 + M (decimal-encoded wall-clock minute slot, sorts chronologically as numeric semver prerelease)

**Missing**: nothing critical for the stated query. Open follow-ups:
- Oracle indexing — repo has rich structure but zero ψ/memory. **Actionable zone (0.6–0.89): consider `oracle_learn` indexing.**
- Why session history is empty for this repo — sessions may live under a sibling path.

## Summary

ui-oracle is a Bun-managed monorepo (Soul-Brews-Studio org) containing 7 apps fanning out to `*.buildwithoracle.com` subdomains, with `apps/indexer/` being the newest addition (React 19 + Vite + Cloudflare Workers, deployed via wrangler to `indexer.buildwithoracle.com`). The repo uses a custom CalVer scheme `v{YY}.{M}.{D}[-{channel}.{HMM}]` where HMM is wall-clock encoded as `H*100 + M` — a clever trick that makes the prerelease ID sort chronologically as a plain integer while eliminating merge-order collisions. Current version: **v26.5.2-alpha.1704**.

Friction is 0.7 (Visible) — everything was findable in repo files but nothing is in Oracle memory or session history. Two cleanup actions worth considering:
1. **Index this repo** via `oracle_learn` — currently invisible to muninn_search.
2. **Investigate** why no past sessions for this repo exist under `~/.claude/projects/-opt-...-ui-oracle/` despite recent commits — sessions may have been driven from a sibling cwd.
