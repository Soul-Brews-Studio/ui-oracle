---
pattern: When two parties disagree on a number or a claim, reproduce it independently and reconcile the delta — don't pick a side, and don't trust either report (including your own)
date: 2026-07-25
source: rrr: ui-oracle
concepts: [verification, cross-repo-review, reconciliation, reproduce, hang-detection, cargo-cult]
---

# Reproduce, don't arbitrate

A full afternoon of cross-repo review between three oracles (ui-oracle, arra-oracle-v3, muninn) turned into a live demonstration that **executing beats reasoning, every time it was tested.** Both sides confidently stated things that were false; every correction came from running the thing, not from a better argument.

## The scoreboard (all false-until-run)

- "maw plugin = verb↔MCP tool 1:1" — mine. False: `spec.tool` is never read for dispatch; it's a CLI→HTTP map. Found by grepping for the dispatch, not reading the description.
- "arra meets the 3-surface standard" — mine, twice. False by count: 40 CLI/API verbs vs 25 MCP. Found by diffing the sets.
- "`group` controls enable/disable, so give muninn its own group" — theirs. False: `group` is only ever filtered as `=== 'mcp'`; the real lever is `enabled !== false`. Found by grepping every consumer.
- "the LEFT JOIN fix resolves the hang" — theirs. False and *worse* than the bug: FTS5 vtab re-scans, LIMIT 50 didn't finish in 2 min. Found by re-timing the SQL after the "correct-looking" fix.
- 6 claims in an auto-generated `/forward-bg` handoff — false against live state (files already merged, wrong issue attribution, "progressed" on untouched work). Found by `git status` + `gh issue view`.

## The rules that fell out

1. **Two numbers that disagree → reconcile, don't choose.** Their audit said 16 drifted verbs; mine said 43. Rather than argue, I split it: 43 = 16 real REST verbs + 27 local-only commands that never belonged on MCP. The reconciliation *was* the finding — and it also surfaced that 2 of the 16 were process-control (bucket 3), making the real number 14.

2. **A synchronously-blocked event loop is invisible to an in-loop timeout.** Their first hang-probe used `Promise.race` + `setTimeout(8s)` and saw nothing — because the timer lives on the same blocked loop. Only an OS-level timeout (separate process; `curl -m`, `timeout(1)`) catches it. I only saw the symptom because `curl -m` happens to be OS-level — luck, not design, until this named it.

3. **`git status` before contradicting a claim about a file.** I opened a file, saw the bug wasn't there, and nearly said "you're wrong" — the file was mid-edit (their in-progress fix in the working tree). The committed version had exactly what they described.

4. **After removing a no-op assertion, check the replacement isn't also a no-op.** I deleted a `group` assertion for having no runtime effect and, one function later in the same edit, added an `enabled` assertion with no runtime effect (`enabled: true` ≡ omitted, per the real filter). Knowing the principle doesn't inoculate the next line — apply it forward.

## Why it generalizes

Cross-oracle (or cross-agent, or human+agent) review fails the same way solo work does: a plausible story substitutes for a checked fact, and confidence rises with each party that repeats it — convergence reads as validation when it's just shared assumption. The defense is boring and reliable: reproduce independently, reconcile deltas, and treat every report — including your own from five minutes ago — as a claim to verify, not a fact to relay. See [[2026-07-25_verify-the-target-before-fixing-it]] — same root, applied to the target of a fix rather than the numbers describing it.
