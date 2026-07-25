---
pattern: For an SPA with content-hashed immutable assets, serve the HTML entry no-cache — else a post-deploy reload loads a stale index.html pointing at a purged JS hash → blank screen.
date: 2026-05-31
source: "rrr: ui-oracle"
concepts: [spa, deploy, cache-control, cloudflare-workers, blank-screen, immutable-assets, html]
---

# SPA deploy: the HTML entry must be no-cache (blank-screen-on-reload)

## Context
The ARRA Oracle combined bundle (Cloudflare Worker serving `./dist`) sets cache-control by asset type:
- content-hashed assets (`index-<hash>.js/css`) → `public, max-age=31536000, immutable`
- everything else, incl. `index.html` → `public, max-age=3600, stale-while-revalidate=86400`

I redeployed the same worker 4× in ~30 min. Each deploy ships a NEW `index-<hash>.js`. A browser that had `index.html` cached (within the 1h window, or served stale via SWR) reloads into the OLD hash — which the NEW worker's assets no longer serve → **blank white screen**. User reported exactly "first reload is blank."

## Rule
- **When assets are content-hashed + immutable, the HTML document that references them MUST be revalidated every load.** Set `index.html` (and any non-hashed entry) to `cache-control: no-cache` (or `max-age=0, must-revalidate`). The hashed assets keep their 1-year immutable cache — that's safe because their content can't change under a fixed name.
- Rationale: the HTML is the *index* of which hashes are current. Caching the index means caching a pointer to assets that a later deploy removes. `no-cache` doesn't mean "don't cache" — it means "revalidate before use," so a 304 is cheap when nothing changed but you never serve a stale asset map.

## Verification trap (why this hid)
- A `curl`/HTTP-200 check fetches a FRESH document every time, so it can never reproduce a stale *browser* cache. "Deploy succeeded + curl 200" looked complete while real users mid-session got a white page.
- To verify "existing users can still reload after a deploy," you must reload a previously-loaded browser session (dev-browser/real browser), not curl the URL. Server-green ≠ already-open-browser-correct — the same class of gap as trusting build-green for behavior.

## Fix (Cloudflare Worker asset proxy)
In the worker's cache-control branch, send `no-cache` for non-hashed paths instead of `max-age=3600`:
```ts
if (HASHED_ASSET.test(url.pathname)) {
  headers.set('cache-control', 'public, max-age=31536000, immutable');
} else {
  headers.set('cache-control', 'no-cache'); // HTML: always revalidate → never a stale asset map
}
```
Apply to every app's `worker.ts` (each app has its own copy).
