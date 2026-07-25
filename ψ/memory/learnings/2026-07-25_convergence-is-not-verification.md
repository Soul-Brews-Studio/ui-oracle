---
pattern: When two agents agree on a conclusion that also ends the investigation, distrust it more, not less — shared + convenient is the signature of a shortcut both took, not of corroboration
date: 2026-07-25
source: rrr: ui-oracle
concepts: [verification, premature-closure, multi-agent, convergence, hang-detection, cross-repo-review]
---

# Convergence is not verification

Two agents (ui-oracle + arra-oracle-v3) independently retracted a wrong hypothesis about a backend hang, then **converged on a second wrong conclusion**: "the blocker can't be reproduced in a clean process, there were 40 agents running, so it's contention — add a TTL cache and move on." It felt rigorous — both had measured, both had discarded the first theory, both agreed. It was a live denial-of-service bug (`/api/memory/consolidation/suggestions` self-hangs ~11 min, wedging the single-threaded server), and the shared conclusion nearly buried it.

## Why it almost worked

The conclusion had two properties that should have raised suspicion together:
- **Shared** — two agents reached it, which reads as corroboration.
- **Convenient** — it ended the search ("nothing more to find, just cache it").

Convergence is only evidence if the parties reached it *independently by different routes*. Here both took the **same shortcut**: measured the obvious suspect (a JOIN), found it fast, and jumped to "environmental." Same path → same blind spot → agreement that proves nothing.

## What actually found it

The queue-time filter: on a single-threaded server, requests that were *queued* behind a blocker all complete at one instant with the same round wall-clock number (593916ms ×6). The real blocker has its **own** non-round duration and an earlier start. Grepping the log for the odd-one-out surfaced `686,729ms` on the consolidation endpoint. Reproduced by calling it once — the whole backend wedged.

The sharp irony: I had *articulated that filter* and handed it to the other agent, then failed to run it against the log myself, and had *written a lesson hours earlier* — "an explanation that lets you stop looking deserves extra suspicion" — and walked into exactly that. Knowing the rule is not applying it.

## Rules

1. **Shared + convenient = distrust.** When a conclusion both ends the investigation and is agreed on, re-derive it from a different angle before resting. Ask: did we converge independently, or take the same shortcut?
2. **If you can state a diagnostic filter, run it yourself** — don't hand it off and assume it's covered. (I gave away the queue-time filter and let someone else find the bug with my own tool.)
3. **"Can't reproduce in a clean env" is a prompt to change the probe, not to stop.** The consolidation hang WAS deterministic — the earlier probe used an in-loop `setTimeout` timeout that a synchronous block makes invisible; an OS-level timeout caught it instantly.
4. **Don't reproduce a suspected DoS on a live shared service if the logs already prove it** — verifying re-wedged production for 11 minutes.

Sibling: [[2026-07-25_reproduce-dont-arbitrate]] (run it, don't reason) and [[2026-07-25_verify-the-target-before-fixing-it]] (same premature-closure shape, solo). This one is the multi-agent case: the shortcut hides inside agreement.
