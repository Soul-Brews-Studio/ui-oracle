---
pattern: Build-green + static invariants prove code compiles and imports are clean — not that rendered UI behaves correctly; render it before declaring nav/routing done.
date: 2026-05-31
source: "rrr: ui-oracle"
concepts: [verification, ui, routing, react-router, build-green, dev-browser, false-confidence]
---

# Build-green ≠ behavior-correct (verify rendered UI, don't trust the build)

## Context
Composed 7 hostname-identified SPAs into one combined bundle at `app.buildwithoracle.com`. A 10-agent workflow returned all-green: 7 standalone builds, the combined build, and a grep "alias invariant" showing zero `react-router-dom` `Link`/`useNavigate` imports leaking outside standalone wrappers. I reported the nav as working.

It wasn't. Every menu item still bounced cross-origin to `feed.buildwithoracle.com` etc. The bug: `MainNav`/`ToolsDropdown`/`NavDisclosure` computed `const href = crossOriginHref(item)` and rendered `<a href>` **before** the in-app `<Link>` branch. On the `app.*` origin that href is always a cross-origin URL, so the `<a>` always won — the new `combinedMode`/`inAppHref` wiring was never reached. The grep invariant was *true* (imports were clean) and *irrelevant* to the actual defect.

## Rule
- A static check (grep, lint, type-check, build) proves a **necessary** condition, never a **sufficient** one for behavior. Don't promote "build-green + invariant-clean" to "works."
- For UI nav/routing/visual changes, **render the output and inspect it** before claiming done. If a browser-automation tool is available (e.g. dev-browser standalone — launches its own Chromium, no extension needed), use it *as part of the change*, not only after a bug report. The verification took seconds and printed "15 nav links, 0 cross-origin."
- When a behavior can fail in a way your invariant can't observe, that gap is where the bug hides. Ask: "what would my green check still pass while the feature is broken?" — then test exactly that.

## Corollary (this domain)
When merging N hostname-identified SPAs onto one origin: the blocker is identity-by-hostname → convert to identity-by-path, and audit **branch order** — a cross-origin href computed before the in-app link silently escapes the bundle even when imports are perfect.
