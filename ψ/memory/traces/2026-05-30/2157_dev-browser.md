---
query: "Dev Browser"
target: "sawyerhood/dev-browser (skill)"
mode: deep
timestamp: 2026-05-30 21:57 +07
friction_score: 1.0
coverage: [oracle, files, sessions]
confidence: high
---

# Trace: Dev Browser

**Target**: `dev-browser` browser-automation skill (sawyerhood)
**Mode**: deep (Wave 1, + Oracle MCP) | **Friction**: 1.0 | **Confidence**: high
**Time**: 2026-05-30 21:57 +07

## Oracle Results (MCP — muninn_search, backend healthy: 21,015 docs)
- `laris-co/arthur-oracle/ψ/memory/learnings/2026-01-27_dev-browser-skill.md` — direct learning on the dev-browser skill (the canonical reference).
- `laris-co/nat-s-agents/ψ/.../2026-01-12_claude-browser-proxy-extension-v210-major-up.md` — related browser-proxy extension (predecessor pattern).
- `nat-s-agents` retros 2026-01-04 + 2026-01-12 — skills + browser-proxy extension work.
→ Indexed and findable = **frictionless (S=1.0)**.

## Files Found (repo: /opt/Code/github.com/sawyerhood/dev-browser)
- Playwright-based browser automation for Claude Code; **persistent page state across script runs** (vs vanilla Playwright fresh each time). HTTP API on :9222, CDP on :9223.
- Two modes:
  - **Standalone** (default): `skills/dev-browser/server.sh` → `scripts/start-server.ts` launches Chromium via `launchPersistentContext()` (own persistent profile). `./server.sh [--headless]`.
  - **Extension**: `npm run start-extension` → `scripts/start-relay.ts` (Hono/WebSocket relay :9222) bridges into the user's existing Chrome via the dev-browser Chrome extension (v1.0.0, GitHub releases).
- Client API (`src/client.ts`, imported `@/client.js`): `connect()`, `client.page(name, opts?)`, `list()`, `close()`, `disconnect()` (pages persist), `getAISnapshot(name)` (YAML a11y tree w/ `[ref=eN]`), `selectSnapshotRef(name, ref)`. Returned page = standard Playwright Page.
- Driven via `cd skills/dev-browser && npx tsx <<'EOF' ... EOF` heredocs; screenshots `page.screenshot({path})`.

## Git History
Not searched (Wave 1 sufficient).

## GitHub Issues/PRs
Not searched.

## Cross-Repo Matches
Heavy — see Session History (used across ~20 oracle repos).

## Oracle Memory
Present and indexed (see Oracle Results). Not new territory.

## Session History (from /dig)
**59 distinct sessions** invoked `Skill(dev-browser)` for real (the ~1,323 "mentions" are mostly the skill description in system prompts, not usage).
- **2026-02-09** — first use, `landing-oracle`: screenshot `story.oraclenet.org` (visual-regression).
- **Feb 10–14** — `DustBoy-Phd-Oracle`, `arthur-oracle`, `hello-oracle`: screenshot local HTML decks (`file://`).
- **2026-02-17** — `claude-browser-proxy`, `oracle-v2`: local dev-server UI testing (`debug.html`, `localhost:3000/handoff`).
- **Feb 18–28** — peak (`homelab`, `oracle-v2`, `oracle-skills-cli`, `nat-s-agents`, `floodboy-oracle`, `hermes-oracle`): shift to **Cloudflare dashboard automation** (DNS A-records, Access apps w/ email-OTP).
- **March–May 4** — `volt-oracle`, `webhook-relay`, `mother-oracle`, `mawjs-oracle`, `neo-oracle`. **Last real use: 2026-05-04.**
- Always the **standalone skill** form (`Skill(dev-browser)`), not raw extension/MCP calls. A `dev-browser-oracle` repo session also exists.
- **In `ui-oracle`: never invoked before** (this session is the first; today's attempt was interrupted).

## Friction Analysis
**Score**: 1.0 — Frictionless (Oracle-indexed + high confidence).
**Coverage**: 3/5 (oracle, files, sessions). Git + GitHub not needed.
**Goal check**: Yes — what it is, how to run (standalone vs extension), the client API, and its 59-session usage history are all established.

## Summary
Dev Browser is a mature, heavily-used (59 sessions, Feb–May 2026) Playwright skill with **persistent page state**. For our goal (view the deployed `app.buildwithoracle.com`), **standalone mode is the fix** — `./server.sh` launches its own Chromium, so it doesn't depend on the (unconnected) claude-in-chrome extension. Next step: `cd skills/dev-browser && ./server.sh &` then a `npx tsx` heredoc that `goto`s the app and screenshots each `/section`.
