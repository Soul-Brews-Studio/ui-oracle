# syntax=docker/dockerfile:1
#
# ARRA 🔮Racle — combined Oracle hub, containerized.
# apps/all imports every app's source (../../studio/src, …), so build from the
# REPO ROOT as context:
#
#   docker build -f apps/all/Dockerfile -t arra-oracle-studio .
#   docker run --rm -p 3000:3000 \
#     -e ORACLE_API_URL=http://host.docker.internal:47778 \
#     arra-oracle-studio
#
# (On Linux add: --add-host=host.docker.internal:host-gateway)
# Open http://localhost:3000 — studio at /, satellites at /vector, /feed, …

# ---- builder: install the workspace + build the combined Vite bundle ----
FROM oven/bun:1 AS builder
WORKDIR /repo
COPY . .
RUN bun install --frozen-lockfile
RUN bun run --filter '@soul-brews-studio/arra-oracle-studio' build

# ---- runtime: slim image — just the built dist/, the serve script, and Bun ----
# The published artifact is self-contained (Vite inlined react/three/shared-ui
# into dist/), and bin/serve.ts uses only Node builtins (fs/path) + Bun.serve,
# so the runtime needs ZERO npm install.
FROM oven/bun:1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    ORACLE_API_URL=http://localhost:47778
COPY --from=builder /repo/apps/all/dist ./dist
COPY --from=builder /repo/apps/all/bin ./bin
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["bun", "bin/serve.ts"]
