import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process'
import { readFileSync, existsSync, mkdirSync, cpSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * The combined bundle has no publicDir of its own, but studio loads visual
 * plugins at runtime via `import('/plugins/<name>.mjs')` (Memory's Map 3D /
 * Graph 3D views and the Canvas page). Those .mjs files live in
 * apps/studio/public/plugins and only ended up in the standalone studio build —
 * on the combined worker the request fell through to the SPA fallback and
 * returned index.html as text/html, so the dynamic import failed. Copy them in.
 */
function copyStudioPlugins() {
  return {
    name: 'copy-studio-plugins',
    apply: 'build' as const,
    closeBundle() {
      const src = resolve(__dirname, '../studio/public/plugins')
      const dest = resolve(__dirname, 'dist/plugins')
      if (!existsSync(src)) return
      mkdirSync(dest, { recursive: true })
      cpSync(src, dest, { recursive: true })
    },
  }
}

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))
const gitHash = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim() }
  catch { return 'dev' }
})()
const appVersion = `v${pkg.version}+${gitHash}`
const buildDate = new Date().toISOString()

export default defineConfig({
  plugins: [tailwindcss(), react(), copyStudioPlugins()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  server: {
    port: 5181,
    allowedHosts: true,
  },
})
