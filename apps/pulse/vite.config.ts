import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))
const gitHash = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim() }
  catch { return 'dev' }
})()
const appVersion = `v${pkg.version}+${gitHash}`

// Dev proxy: forward /api/status + /api/ping to the live nginx-served JSON so
// local dev behaves the same as production (which goes through worker.ts).
const STATUS_UPSTREAM = 'http://76.13.221.42'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  server: {
    port: 5180,
    allowedHosts: true,
    proxy: {
      '/api/status': {
        target: STATUS_UPSTREAM,
        changeOrigin: true,
        rewrite: () => '/maw/pulse/status.json',
      },
      '/api/ping': {
        target: STATUS_UPSTREAM,
        changeOrigin: true,
        rewrite: () => '/maw/pulse/status.json',
      },
    },
  },
})
