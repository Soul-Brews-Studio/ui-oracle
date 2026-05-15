# Absorbed UI repos archived

Date: 2026-05-15
Oracle: ui-oracle

## Why

`ui-oracle` is now the active monorepo and caretaker identity for the browser-facing Oracle cockpit. The older standalone UI repositories were absorbed into `ui-oracle` during the 2026-04-19 consolidation and should no longer be used as deployment sources.

## Archived GitHub repositories

| Local path checked | GitHub repository archived | Absorbed into | Local status at archive time | Notes |
|---|---|---|---|---|
| `/opt/Code/github.com/Soul-Brews-Studio/oracle-studio/` | `Soul-Brews-Studio/ui-studio-oracle-studio` | `ui-oracle/apps/studio` | clean | Local directory name differs from GitHub repo name; remote points to `ui-studio-oracle-studio`. |
| `/opt/Code/github.com/Soul-Brews-Studio/ui-canvas-oracle-studio/` | `Soul-Brews-Studio/ui-canvas-oracle-studio` | `ui-oracle/apps/canvas` | clean | Original one-commit canvas scaffold. |
| `/opt/Code/github.com/Soul-Brews-Studio/vector-oracle-studio/` | `Soul-Brews-Studio/ui-vector-oracle-studio` | `ui-oracle/apps/vector` | dirty: `M CLAUDE.md`, untracked `.rtk/` | Archived remotely despite local uncommitted identity/runtime artifacts; local work remains untouched. |
| `/opt/Code/github.com/Soul-Brews-Studio/maw-studio-oracle/` | `Soul-Brews-Studio/maw-studio-oracle` | not absorbed; dead placeholder | clean | Domain migrated away; never awakened as the ui-oracle caretaker. |

## Current rule

Do not deploy from the archived standalone repositories. Active UI development and deployment should happen from:

```text
/opt/Code/github.com/Soul-Brews-Studio/ui-oracle
```

Active app homes:

- `apps/studio`
- `apps/vector`
- `apps/canvas`
- `apps/feed`
- `apps/forum`
- `apps/schedule`
- `apps/indexer`

## Follow-up

The archived repos may remain locally for archaeology, but canonical identity, memory, and future UI work now belong to `ui-oracle`.
