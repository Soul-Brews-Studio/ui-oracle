---
query: "connect deployed app + local network to localhost:47778 backend"
target: "arra-oracle-v3 backend ↔ ui-oracle thin clients"
mode: deep
timestamp: 2026-05-30 22:31 +07
friction_score: 1.0
coverage: [oracle, files, cross-repo]
confidence: high
---

# Trace: connecting to the localhost:47778 backend

**Target**: arra-oracle-v3 backend (`:47778`) ↔ deployed ARRA Oracle apps
**Mode**: deep | **Friction**: 1.0 | **Confidence**: high
**Time**: 2026-05-30 22:31 +07

## Answer (verified live)
The deployed `https://app.buildwithoracle.com` → `http://localhost:47778` path is **already fully supported** by the backend. No code/build/deploy change needed.

Live proof (curl against the running backend):
- `GET /api/stats` w/ `Origin: https://app.buildwithoracle.com` → `200` + `Access-Control-Allow-Origin: https://app.buildwithoracle.com` + `Access-Control-Allow-Credentials: true`.
- PNA preflight (`OPTIONS` + `Access-Control-Request-Private-Network: true`) → `204` + `Access-Control-Allow-Private-Network: true` + the app origin echoed.

## Files Found (backend: /opt/Code/github.com/Soul-Brews-Studio/arra-oracle-v3)
- `src/server.ts:244-246` — Bun default export `{ port: Number(PORT), fetch: app.fetch }`. No explicit hostname → Bun binds **0.0.0.0 (all interfaces)**. Confirmed: `lsof` shows `bun ... TCP *:47778 (LISTEN)`. Port via `ORACLE_PORT` (default 47778, `const.ts:6`).
- `src/server.ts:88-116` — `originAllowed()` allowlist: defaults `studio.*` + `neo.buildwithoracle.com`; **any `*.buildwithoracle.com` over HTTPS** (so `app.*` passes); any `http://localhost:*` / `http://127.0.0.1:*`; extra via `ORACLE_CORS_ORIGIN` (comma-sep), legacy `CORS_ORIGIN`.
- `src/server.ts:148-155` — `@elysiajs/cors`, credentials `true`, methods `GET,POST,PUT,DELETE,PATCH,OPTIONS` (Elysia framework).
- `src/server.ts:122-143` — **Private Network Access** middleware: replies to PNA preflight with `Access-Control-Allow-Private-Network: true` for allowed origins → enables HTTPS→localhost on Chrome 117+.
- `package.json:30` — `"server": "bun src/server.ts"`.

## Oracle Memory
- `laris-co/arthur-oracle/ψ/.../2026-01-30_landing-page-cors-component-reuse.md` — prior CORS work (landing page).
- `laris-co/nat-s-agents/ψ/.../2026-01-03_cors-configuration-whitelist-specific-origins-ne.md` — CORS whitelist-specific-origins learning.

## How to actually connect
1. **Same machine:** backend running (`bunx --bun arra-oracle-v3@github:Soul-Brews-Studio/arra-oracle-v3`), open `https://app.buildwithoracle.com` in a **normal (non-headless)** browser → defaults to `localhost:47778` (post-fix) → connects. Hit **Retry** if the gate pinged before the backend was up.
2. **LAN device:** host machine IP `192.168.1.109`; backend binds 0.0.0.0; on the other device set host → `http://192.168.1.109:47778` (Change host / `?host=`). App origin already allow-listed; PNA covers the private IP.
3. **Headless / CI browsers block PNA** — so automated checks show "unreachable" even when a real browser connects.

## Friction Analysis
**Score**: 1.0 — backend config found in-repo + verified live. **Coverage**: oracle, files, cross-repo.
**Goal check**: Yes — connection is already supported; verified with live CORS + PNA probes.

## Summary
Backend already binds all interfaces and allow-lists `*.buildwithoracle.com` HTTPS + localhost + PNA. The combined app (post nav/host fix, Version 63f27fd3) defaults deployed hosts to `localhost:47778`. So it connects in a real browser with the backend up — no further build/deploy required. To pin an explicit origin for a non-standard device, set `ORACLE_CORS_ORIGIN`.
