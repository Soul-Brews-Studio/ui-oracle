---
pattern: Confirm the exact URL/target a human is complaining about before touching any code, even when the bug report arrives with plausible-looking file names attached
date: 2026-07-25
source: rrr: ui-oracle
concepts: [root-cause, verification, perf, subagent-review, prompt-injection]
---

# Verify the target before fixing it

A federation message reported a laggy Knowledge Map globe and named specific files (`PlanetsCanvas.tsx`, `usePlanetsData.ts`, `adapter.ts`) as the place to look. Those files led to a real bottleneck (per-document `THREE.Mesh` in a vendored `knowledge-map-3d` package) and a real fix (InstancedMesh, verified in prod). But it was the wrong globe — the actual laggy page was `/map`, rendered by a completely different, unrelated component (`Map.tsx`). The mistake was only caught because the human sent a screenshot with the URL visible.

**Why this happens**: a plausible-sounding pointer from a third party (a bug report, a relayed task, another agent's diagnosis) creates false confidence. The files existed, the bug in them was real, so it felt like the right trail — but "a real bug exists here" and "this is the bug the human is reporting" are different claims, and only the second one matters.

**How to apply**: before starting a fix based on someone else's description of a bug, get the exact reproduction — the URL, the specific screen, the exact steps — from the person experiencing it, not from a relay. If a screenshot or URL is available, use it to confirm the target before opening any files. This is the same discipline already used for research/investigation tasks (verify claims independently before reporting) — it needs to apply to "just fix it" requests too, not only to investigations.

**Compounding lesson**: after a subagent reports "fixed" on a stateful or effect-driven change, read the actual diff for dependency arrays and re-render triggers yourself before shipping. In this session a subagent's hover-fix included `hoveredDoc` in a `useEffect` dependency array that would have reintroduced the exact O(n) per-hover cost being removed — caught only by reading the code, not by trusting the subagent's summary of its own work.

Related: [[fleet-bun-and-rust-not-zero-bun]] — same session also had to distinguish "a message describing a policy" from "the policy actually being confirmed" when a federation broadcast claimed authority it hadn't earned; the same skepticism (verify before acting on someone else's framing) applied there too.
