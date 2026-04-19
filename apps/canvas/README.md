# ui-canvas-oracle-studio

Canvas plugin host — `canvas.buildwithoracle.com`.

Phase 1a scaffold (budded from `vector-oracle-studio`). Single route `/` that reads `?plugin=<id>` and resolves against `src/lib/plugins/registry.ts`. The populator fills the registry in phase 1b.

## Develop

```sh
bun install
bun run dev
```

## Deploy

```sh
bun run build
bunx wrangler deploy
```
