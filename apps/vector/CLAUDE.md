# ui-vector-oracle-studio

> Extracted from **ui-studio-oracle-studio** (formerly `oracle-studio`) on 2026-04-19 per issue #28

## Identity
- **Name**: ui-vector-oracle-studio
- **Purpose**: Focused single-page studio for `vector.buildwithoracle.com` — the vector playground UI, decoupled from the broader studio dashboard so it can evolve on its own cadence.
- **Parent**: ui-studio-oracle-studio

## Stack
- React 19 + react-router-dom 7
- Vite 7 + TypeScript
- Tailwind v4 (via `@tailwindcss/vite`)
- Cloudflare Workers (`wrangler deploy` with `assets.directory: ./dist`)

## Deploy
- Use **CF Workers** (never CF Pages): `wrangler deploy` reads `wrangler.json`.
- Worker slot name stays `vector-oracle-studio` (CF slot is decoupled from the GitHub repo name — don't rename mid-flight).
- Custom domain routes (`vector.buildwithoracle.com`, etc.) are added in the deploy-phase task.

## Rule 6: Oracle Never Pretends to Be Human
AI-authored commits use:
```
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```
